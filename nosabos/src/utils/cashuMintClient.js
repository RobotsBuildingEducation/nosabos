import { MintQuoteState, Wallet } from "cashu-ts-v4";

const DEFAULT_POLL_INTERVAL_MS = 2500;
const DEFAULT_QUOTE_LIFETIME_MS = 30 * 60 * 1000;
const MAX_CONSECUTIVE_POLL_ERRORS = 5;

const walletPromises = new Map();

export class CashuDepositError extends Error {
  constructor(message, code, options = {}) {
    super(message, options);
    this.name = "CashuDepositError";
    this.code = code;
  }
}

/**
 * Load and cache a modern Cashu wallet for a mint.
 *
 * The app intentionally imports Cashu TS v4 through an npm alias so the
 * legacy version required by ndk-wallet can continue handling Nostr storage.
 */
export async function getCashuMintWallet(mintUrl, { forceRefresh = false } = {}) {
  if (forceRefresh) walletPromises.delete(mintUrl);

  if (!walletPromises.has(mintUrl)) {
    const walletPromise = (async () => {
      const wallet = new Wallet(mintUrl);
      await wallet.loadMint(forceRefresh);
      return wallet;
    })().catch((error) => {
      walletPromises.delete(mintUrl);
      throw error;
    });

    walletPromises.set(mintUrl, walletPromise);
  }

  return walletPromises.get(mintUrl);
}

export function clearCashuMintWalletCache(mintUrl) {
  if (mintUrl) walletPromises.delete(mintUrl);
  else walletPromises.clear();
}

/** Convert Cashu TS v4 Amount values to the plain numbers ndk-wallet stores. */
export function cashuAmountToNumber(amount) {
  if (typeof amount === "number") return amount;
  if (typeof amount === "bigint") return Number(amount);
  if (typeof amount === "string") return Number(amount);
  if (amount && typeof amount.toNumber === "function") return amount.toNumber();

  const parsed = Number(amount);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("Cashu proof contains an invalid amount");
  }
  return parsed;
}

export function toNdkProof(proof) {
  const amount = cashuAmountToNumber(proof?.amount);
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error("Cashu proof amount is outside the safe satoshi range");
  }

  return {
    ...proof,
    amount,
  };
}

export function toNdkProofs(proofs = []) {
  return proofs.map(toNdkProof);
}

export async function getUnspentCashuProofs(wallet, proofs = []) {
  if (proofs.length === 0) return [];

  const states = await wallet.checkProofsStates(proofs);
  return proofs.filter((_, index) => states[index]?.state === "UNSPENT");
}

function quoteExpiryMs(quote, fallbackStartedAt = Date.now()) {
  if (Number.isFinite(quote?.expiry)) return quote.expiry * 1000;
  return fallbackStartedAt + DEFAULT_QUOTE_LIFETIME_MS;
}

function abortableDelay(ms, signal) {
  if (signal?.aborted) {
    return Promise.reject(
      new CashuDepositError("Deposit monitoring was cancelled", "ABORTED"),
    );
  }

  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      clearTimeout(timeout);
      reject(
        new CashuDepositError("Deposit monitoring was cancelled", "ABORTED"),
      );
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

/**
 * Poll a BOLT11 mint quote until it is paid, issued, expired, or cancelled.
 */
export async function waitForPaidMintQuote(
  wallet,
  quote,
  {
    signal,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    now = () => Date.now(),
  } = {},
) {
  const startedAt = now();
  let currentQuote = quote;
  let consecutiveErrors = 0;
  let hasCheckedMint = false;

  while (!signal?.aborted) {
    if (currentQuote?.state === MintQuoteState.PAID) return currentQuote;

    if (currentQuote?.state === MintQuoteState.ISSUED) {
      throw new CashuDepositError(
        "This deposit invoice has already been claimed",
        "ISSUED",
      );
    }

    if (hasCheckedMint && now() >= quoteExpiryMs(currentQuote, startedAt)) {
      throw new CashuDepositError("The deposit invoice expired", "EXPIRED");
    }

    if (hasCheckedMint) await abortableDelay(pollIntervalMs, signal);

    try {
      currentQuote = await wallet.checkMintQuoteBolt11(quote.quote);
      hasCheckedMint = true;
      consecutiveErrors = 0;
    } catch (error) {
      hasCheckedMint = true;
      consecutiveErrors += 1;
      if (consecutiveErrors >= MAX_CONSECUTIVE_POLL_ERRORS) {
        throw new CashuDepositError(
          "Lost contact with the mint while checking the deposit",
          "POLL_FAILED",
          { cause: error },
        );
      }
    }
  }

  throw new CashuDepositError("Deposit monitoring was cancelled", "ABORTED");
}

export async function createBolt11DepositQuote(wallet, amountInSats) {
  if (!Number.isSafeInteger(amountInSats) || amountInSats <= 0) {
    throw new CashuDepositError(
      "Deposit amount must be a positive whole number of sats",
      "INVALID_AMOUNT",
    );
  }

  return wallet.createMintQuoteBolt11(
    amountInSats,
    "Robots Building Education deposit",
  );
}

export async function mintPaidBolt11Quote(wallet, amountInSats, paidQuote) {
  const proofs = await wallet.mintProofsBolt11(amountInSats, paidQuote);
  return toNdkProofs(proofs);
}
