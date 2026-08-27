// src/hooks/useNostrWalletStore.js
// NIP-60 (Cashu Wallets) and NIP-61 (Nutzaps) implementation
// Zustand store for global wallet state
import { create } from "zustand";
import NDK, {
  NDKPrivateKeySigner,
  NDKNip07Signer,
  NDKEvent,
} from "@nostr-dev-kit/ndk";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { Buffer } from "buffer";
import { bech32 } from "bech32";
import {
  CashuDepositError,
  createBolt11DepositQuote,
  getCashuMintWallet,
  getUnspentCashuProofs,
  mintPaidBolt11Quote,
  toNdkProofs,
  waitForPaidMintQuote,
} from "../utils/cashuMintClient";

// Polyfill Buffer for browser
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

// Default configuration
const DEFAULT_MINT = "https://mint.minibits.cash/Bitcoin";
const DEFAULT_RELAYS = [
  "wss://relay.ditto.pub",
  "wss://relay.primal.net",
  "wss://nos.lol",
];
const DEFAULT_RECEIVER =
  "npub1auhch9697q3jxjjtj7jq3glqtl2eyf7quu357ppja2fr5fvvhlxsqla9n5";
const PENDING_DEPOSIT_STORAGE_PREFIX = "nosabos:cashu-pending-deposit:v1";
const activeDepositMonitors = new Map();

function pendingDepositStorageKey(pubkey) {
  return `${PENDING_DEPOSIT_STORAGE_PREFIX}:${pubkey}`;
}

function loadPendingDeposit(pubkey) {
  if (typeof localStorage === "undefined" || !pubkey) return null;

  try {
    const value = localStorage.getItem(pendingDepositStorageKey(pubkey));
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn("[Wallet] Could not read pending deposit:", error);
    return null;
  }
}

function savePendingDeposit(pubkey, deposit) {
  if (typeof localStorage === "undefined" || !pubkey) return false;

  try {
    localStorage.setItem(
      pendingDepositStorageKey(pubkey),
      JSON.stringify(deposit),
    );
    return true;
  } catch (error) {
    console.warn("[Wallet] Could not persist pending deposit:", error);
    return false;
  }
}

function removePendingDeposit(pubkey) {
  if (typeof localStorage === "undefined" || !pubkey) return;
  localStorage.removeItem(pendingDepositStorageKey(pubkey));
}

function stopDepositMonitor(pubkey) {
  const monitor = activeDepositMonitors.get(pubkey);
  monitor?.controller.abort();
  activeDepositMonitors.delete(pubkey);
}

/**
 * Safely extract total balance from wallet.balance response
 */
function extractBalance(bal) {
  if (bal === null || bal === undefined) return 0;
  if (typeof bal === "number") return bal;
  if (typeof bal === "object" && typeof bal.amount === "number") {
    return bal.amount;
  }
  const parsed = Number(bal);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Decode bech32 key (npub/nsec) to hex
 */
function decodeKey(key) {
  try {
    const { words } = bech32.decode(key);
    return Buffer.from(bech32.fromWords(words)).toString("hex");
  } catch (e) {
    console.error("Error decoding key:", e);
    return null;
  }
}

/**
 * Verify proofs with mint and return only unspent balance
 */
async function verifyBalanceWithMint(wallet, mintUrl) {
  try {
    const proofs = wallet.state?.getProofs({ mint: mintUrl }) || [];
    console.log("[Wallet] Proofs from state:", proofs.length);

    if (proofs.length === 0) {
      return 0;
    }

    const cashuWallet = await getCashuMintWallet(mintUrl);
    const unspentProofs = await getUnspentCashuProofs(cashuWallet, proofs);

    const balance = unspentProofs.reduce((sum, p) => sum + p.amount, 0);
    console.log("[Wallet] Verified balance from mint:", balance);
    return balance;
  } catch (e) {
    console.error("[Wallet] Error verifying with mint:", e);
    return extractBalance(wallet.balance);
  }
}

export const useNostrWalletStore = create((set, get) => ({
  // State
  isConnected: false,
  errorMessage: null,
  nostrPubKey: "",
  nostrPrivKey: "",
  ndkInstance: null,
  signer: null,
  cashuWallet: null,
  walletBalance: 0,
  proofs: [],
  invoice: "",
  isCreatingWallet: false,
  isWalletReady: false,

  // Setters
  setError: (msg) => set({ errorMessage: msg }),
  setInvoice: (data) => set({ invoice: data }),

  // Utility: Get hex pubkey from npub
  getHexNPub: (npub) => decodeKey(npub),

  // Verify and update balance from mint
  verifyAndUpdateBalance: async () => {
    const { cashuWallet } = get();
    if (!cashuWallet) return 0;

    const balance = await verifyBalanceWithMint(cashuWallet, DEFAULT_MINT);
    set({ walletBalance: balance });
    return balance;
  },

  // Connect to Nostr relays
  connectToNostr: async (npubRef = null, nsecRef = null) => {
    void npubRef; // Retained for compatibility with existing two-argument callers.
    const { setError, nostrPrivKey } = get();

    const storedNsec = localStorage.getItem("local_nsec");
    const isNip07 = localStorage.getItem("nip07_signer") === "true";
    const nsec = nsecRef || (storedNsec !== "nip07" ? nostrPrivKey : null);

    try {
      const ndkInstance = new NDK({
        explicitRelayUrls: DEFAULT_RELAYS,
      });

      await ndkInstance.connect();

      // Handle NIP-07 mode
      if (isNip07 && typeof window !== "undefined" && window.nostr) {
        console.log("[Wallet] Using NIP-07 signer");
        const signer = new NDKNip07Signer();
        await signer.blockUntilReady();
        ndkInstance.signer = signer;
        const user = await signer.user();
        ndkInstance.activeUser = user;

        set({ isConnected: true, ndkInstance, signer });
        return { ndkInstance, signer };
      }

      // Handle private key mode
      if (!nsec || !nsec.startsWith("nsec")) {
        console.error("[Wallet] No valid nsec provided");
        return null;
      }

      const hexNsec = decodeKey(nsec);
      if (!hexNsec) throw new Error("Invalid nsec key");

      const signer = new NDKPrivateKeySigner(hexNsec);
      await signer.blockUntilReady();
      ndkInstance.signer = signer;
      const user = await signer.user();
      ndkInstance.activeUser = user;

      set({ isConnected: true, ndkInstance, signer });
      return { ndkInstance, signer };
    } catch (err) {
      console.error("[Wallet] Error connecting to Nostr:", err);
      setError(err.message);
      return null;
    }
  },

  // Initialize (called on app load)
  init: async () => {
    const storedNpub = localStorage.getItem("local_npub");
    const storedNsec = localStorage.getItem("local_nsec");
    const isNip07 = localStorage.getItem("nip07_signer") === "true";

    if (storedNpub) set({ nostrPubKey: storedNpub });
    if (storedNsec && storedNsec !== "nip07") set({ nostrPrivKey: storedNsec });

    const { connectToNostr } = get();

    if ((isNip07 && storedNpub) || (storedNpub && storedNsec)) {
      const connection = await connectToNostr(storedNpub, storedNsec);
      return !!connection;
    }

    return false;
  },

  // Initialize wallet
  // Initialize wallet (load existing only - does NOT create new)
  // Initialize wallet (load existing only - does NOT create new)
  initWallet: async () => {
    const {
      ndkInstance,
      signer,
      cashuWallet,
      setError,
      verifyAndUpdateBalance,
    } = get();

    if (cashuWallet) {
      cashuWallet.removeAllListeners();
    }

    if (!ndkInstance || !signer) {
      console.error("[Wallet] NDK not ready");
      return null;
    }

    try {
      const user = await signer.user();
      console.log("[Wallet] Looking for wallet for pubkey:", user.pubkey);

      // Check for wallet events - try multiple possible kinds
      const walletEvents = await ndkInstance.fetchEvents({
        kinds: [37513, 7374, 7375], // wallet, token, and proof kinds
        authors: [user.pubkey],
        limit: 5,
      });

      console.log("[Wallet] Found events:", walletEvents.size);
      walletEvents.forEach((e) => console.log("[Wallet] Event kind:", e.kind));

      if (walletEvents.size === 0) {
        console.log("[Wallet] No existing wallet found");
        return null;
      }

      console.log("[Wallet] Found existing wallet, loading...");

      const pk = signer.privateKey;
      const wallet = new NDKCashuWallet(ndkInstance);
      wallet.mints = [DEFAULT_MINT];
      wallet.walletId = "Robots Building Education Wallet"; // Add this line

      if (pk) {
        wallet.privkey = pk;
        wallet.signer = new NDKPrivateKeySigner(pk);
      }

      ndkInstance.wallet = wallet;

      await wallet.start({ pubkey: user.pubkey });

      console.log("[Wallet] Wallet status:", wallet.status);
      console.log("[Wallet] Wallet relaySet:", wallet.relaySet);
      wallet.on("balance_updated", (balance) => {
        console.log("[Wallet] >>> BALANCE EVENT FIRED:", balance);
        console.log("[Wallet] Balance updated event:", balance);
        if (balance?.amount !== undefined) {
          set({ walletBalance: balance.amount });
        } else {
          // Fallback to manual check
          verifyAndUpdateBalance();
        }
      });

      wallet.on("ready", () => {
        console.log("[Wallet] Wallet ready event");
        verifyAndUpdateBalance();
      });

      wallet.on("warning", (warning) => {
        console.warn("[Wallet] Warning:", warning.msg);
      });
      console.log("[Wallet] Wallet loaded, status:", wallet.status);

      set({ cashuWallet: wallet, isWalletReady: true });

      await verifyAndUpdateBalance();
      await get().resumePendingDeposit();

      return wallet;
    } catch (err) {
      console.error("[Wallet] Error loading wallet:", err);
      setError(err.message);
      return null;
    }
  },

  // Create and publish new wallet
  // Accepts optional nsec for NIP-07 users who need to provide their key manually
  createNewWallet: async (overrideNsec = null) => {
    const { ndkInstance, signer, setError, verifyAndUpdateBalance } = get();

    if (!ndkInstance || !signer) {
      console.error("[Wallet] NDK not ready");
      return null;
    }

    set({ isCreatingWallet: true });

    try {
      // Use override nsec if provided (for NIP-07 users), otherwise use signer's private key
      let pk = signer.privateKey;

      if (overrideNsec) {
        // Decode the nsec to hex
        pk = decodeKey(overrideNsec);
        if (!pk) {
          throw new Error("Invalid nsec key provided");
        }
        console.log("[Wallet] Using provided nsec for wallet creation");
      }

      if (!pk) {
        throw new Error("No private key available for wallet creation");
      }

      const wallet = new NDKCashuWallet(ndkInstance);
      wallet.mints = [DEFAULT_MINT];
      wallet.privkey = pk;
      wallet.signer = new NDKPrivateKeySigner(pk);
      wallet.walletId = "Robots Building Education Wallet";

      ndkInstance.wallet = wallet;

      const user = await signer.user();
      await wallet.start({ pubkey: user.pubkey });
      console.log("[Wallet] Wallet started");

      try {
        await wallet.publish();
        console.log("[Wallet] Wallet published to relays");
      } catch (pubErr) {
        console.warn("[Wallet] Could not publish (non-critical):", pubErr);
      }

      set({
        cashuWallet: wallet,
        isWalletReady: true,
        isCreatingWallet: false,
      });

      await verifyAndUpdateBalance();
      await get().resumePendingDeposit();

      return wallet;
    } catch (err) {
      console.error("[Wallet] Error creating wallet:", err);
      setError(err.message);
      set({ isCreatingWallet: false });
      return null;
    }
  },

  // Fetch recipient's payment info (kind:10019)
  fetchUserPaymentInfo: async (recipientNpub) => {
    const { ndkInstance } = get();

    if (!ndkInstance) {
      return { mints: [DEFAULT_MINT], p2pkPubkey: null, relays: [] };
    }

    const hexNpub = decodeKey(recipientNpub);
    if (!hexNpub) {
      return { mints: [DEFAULT_MINT], p2pkPubkey: null, relays: [] };
    }

    try {
      const filter = {
        kinds: [10019],
        authors: [hexNpub],
        limit: 1,
      };

      const events = await ndkInstance.fetchEvents(filter);
      const eventsArray = Array.from(events);

      if (eventsArray.length === 0) {
        return { mints: [DEFAULT_MINT], p2pkPubkey: hexNpub, relays: [] };
      }

      const userEvent = eventsArray[0];
      let mints = [];
      let relays = [];
      let p2pkPubkey = null;

      for (const tag of userEvent.tags) {
        const [t, v1] = tag;
        if (t === "mint" && v1) mints.push(v1);
        else if (t === "relay" && v1) relays.push(v1);
        else if (t === "pubkey" && v1) p2pkPubkey = v1;
      }

      if (mints.length === 0) mints = [DEFAULT_MINT];
      if (!p2pkPubkey) p2pkPubkey = hexNpub;

      return { mints, p2pkPubkey, relays };
    } catch (e) {
      console.error("[Wallet] Error fetching payment info:", e);
      return { mints: [DEFAULT_MINT], p2pkPubkey: hexNpub, relays: [] };
    }
  },

  monitorPendingDeposit: (pendingDeposit, options = {}) => {
    const { ownerPubkey } = pendingDeposit;
    const existingMonitor = activeDepositMonitors.get(ownerPubkey);
    if (existingMonitor) return existingMonitor.promise;

    const controller = new AbortController();
    const { onSuccess, onError } = options;

    const monitorPromise = (async () => {
      try {
        let proofs = pendingDeposit.proofs;

        if (!Array.isArray(proofs) || proofs.length === 0) {
          const mintWallet = await getCashuMintWallet(pendingDeposit.mint);
          const paidQuote = await waitForPaidMintQuote(
            mintWallet,
            pendingDeposit.quote,
            { signal: controller.signal },
          );
          proofs = await mintPaidBolt11Quote(
            mintWallet,
            pendingDeposit.amount,
            paidQuote,
          );

          // Persist issued proofs before relay storage so a refresh in between
          // cannot strand an already-paid quote.
          savePendingDeposit(ownerPubkey, {
            ...pendingDeposit,
            proofs,
          });
        }

        const currentWallet = get().cashuWallet;
        if (!currentWallet) {
          throw new CashuDepositError(
            "Deposit was paid, but the wallet is no longer open",
            "WALLET_CLOSED",
          );
        }

        const storedProofs =
          currentWallet.state?.getProofs({ mint: pendingDeposit.mint }) || [];
        const storedSecrets = new Set(
          storedProofs.map((proof) => proof.secret),
        );
        const unstoredProofs = proofs.filter(
          (proof) => !storedSecrets.has(proof.secret),
        );

        if (unstoredProofs.length > 0) {
          await currentWallet.state.update({
            store: unstoredProofs,
            mint: pendingDeposit.mint,
          });
        }

        removePendingDeposit(ownerPubkey);
        set({ invoice: "", errorMessage: null });
        const newBalance = await get().verifyAndUpdateBalance();
        console.log("[Wallet] Deposit successful!", proofs);

        if (typeof onSuccess === "function") onSuccess(newBalance);
        return proofs;
      } catch (error) {
        if (error?.code === "ABORTED") return null;

        if (error?.code === "ISSUED") {
          removePendingDeposit(ownerPubkey);
          set({ invoice: "" });
          await get().verifyAndUpdateBalance();
          return null;
        }

        if (error?.code === "EXPIRED") {
          removePendingDeposit(ownerPubkey);
          set({ invoice: "" });
        }

        console.error("[Wallet] Deposit monitor error:", error);
        get().setError(error.message || "Deposit failed");
        if (typeof onError === "function") onError(error);
        return null;
      } finally {
        const activeMonitor = activeDepositMonitors.get(ownerPubkey);
        if (activeMonitor?.controller === controller) {
          activeDepositMonitors.delete(ownerPubkey);
        }
      }
    })();

    activeDepositMonitors.set(ownerPubkey, {
      controller,
      promise: monitorPromise,
    });
    return monitorPromise;
  },

  resumePendingDeposit: async (options = {}) => {
    const { signer, cashuWallet, monitorPendingDeposit } = get();
    if (!signer || !cashuWallet) return null;

    try {
      const user = await signer.user();
      const pendingDeposit = loadPendingDeposit(user.pubkey);
      if (!pendingDeposit || pendingDeposit.mint !== DEFAULT_MINT) return null;

      set({ invoice: pendingDeposit.quote.request, errorMessage: null });
      monitorPendingDeposit(pendingDeposit, options);
      return pendingDeposit.quote.request;
    } catch (error) {
      console.error("[Wallet] Error resuming deposit:", error);
      get().setError(error.message || "Could not resume deposit");
      return null;
    }
  },

  // Deposit sats using Cashu TS v4 directly. NDK remains the proof store.
  initiateDeposit: async (amountInSats = 10, options = {}) => {
    const { cashuWallet, signer, setError, setInvoice, monitorPendingDeposit } =
      get();
    const { onError } = options;

    if (!cashuWallet || !signer) {
      setError("Wallet not initialized");
      return null;
    }

    try {
      const user = await signer.user();
      const existingDeposit = loadPendingDeposit(user.pubkey);

      if (
        existingDeposit?.mint === DEFAULT_MINT &&
        existingDeposit?.quote?.request
      ) {
        set({ invoice: existingDeposit.quote.request, errorMessage: null });
        monitorPendingDeposit(existingDeposit, options);
        return existingDeposit.quote.request;
      }

      const mintWallet = await getCashuMintWallet(DEFAULT_MINT);
      const quote = await createBolt11DepositQuote(mintWallet, amountInSats);
      const pendingDeposit = {
        ownerPubkey: user.pubkey,
        mint: DEFAULT_MINT,
        amount: amountInSats,
        createdAt: Date.now(),
        quote: {
          quote: quote.quote,
          request: quote.request,
          state: quote.state,
          expiry: quote.expiry,
        },
      };

      savePendingDeposit(user.pubkey, pendingDeposit);
      set({ invoice: quote.request, errorMessage: null });
      monitorPendingDeposit(pendingDeposit, options);
      console.log("[Wallet] Invoice created with modern Cashu client");
      return quote.request;
    } catch (error) {
      console.error("[Wallet] Error initiating deposit:", error);
      setError(error.message || "Unable to create deposit invoice");
      setInvoice("");
      if (typeof onError === "function") onError(error);
      return null;
    }
  },

  // Send 1 sat via nutzap
  sendOneSatToNpub: async (
    recipientNpub = DEFAULT_RECEIVER,
    retryCount = 0,
  ) => {
    const {
      cashuWallet,
      ndkInstance,
      signer,
      fetchUserPaymentInfo,
      setError,
      walletBalance,
      verifyAndUpdateBalance,
      initWallet,
    } = get();

    const MAX_RETRIES = 2;

    if (!cashuWallet) {
      console.error("[Wallet] Wallet not initialized");
      return false;
    }

    if (walletBalance < 1) {
      console.error("[Wallet] Insufficient balance:", walletBalance);
      return false;
    }

    await initWallet();

    const freshWallet = get().cashuWallet;

    if (!freshWallet) {
      console.error("[Wallet] Wallet not available after refresh");
      return false;
    }

    try {
      const amount = 1;
      const unit = "sat";

      const { p2pkPubkey } = await fetchUserPaymentInfo(recipientNpub);
      console.log("[Wallet] Sending 1 sat to:", recipientNpub);

      const cashuWalletInstance = await getCashuMintWallet(DEFAULT_MINT);

      // Get proofs from wallet state
      let proofs = freshWallet.state?.getProofs({ mint: DEFAULT_MINT }) || [];
      if (proofs.length === 0) {
        throw new Error("No proofs available");
      }

      // Check which proofs are actually still spendable at the mint
      const validProofs = await getUnspentCashuProofs(
        cashuWalletInstance,
        proofs,
      );

      console.log("[Wallet] Total proofs:", proofs.length);
      console.log("[Wallet] Valid proofs:", validProofs.length);

      if (validProofs.length === 0) {
        throw new Error("No valid proofs available");
      }

      // Check if we have enough balance with valid proofs
      const validBalance = validProofs.reduce((sum, p) => sum + p.amount, 0);
      if (validBalance < amount) {
        throw new Error(`Insufficient valid balance: ${validBalance}`);
      }

      const recipientHex = decodeKey(recipientNpub);

      // Use only valid proofs for the send
      const sendResult = p2pkPubkey
        ? await cashuWalletInstance.ops
            .send(amount, validProofs)
            .asP2PK({ pubkey: p2pkPubkey })
            .run()
        : await cashuWalletInstance.send(amount, validProofs);
      const keep = toNdkProofs(sendResult.keep);
      const send = toNdkProofs(sendResult.send);

      console.log("[Wallet] Keep proofs:", keep);
      console.log("[Wallet] Send proofs:", send);

      // Destroy ALL original proofs (including spent ones), store the change
      await freshWallet.state.update({
        store: keep,
        destroy: proofs,
        mint: DEFAULT_MINT,
      });

      const proofTags = send.map((proof) => ["proof", JSON.stringify(proof)]);

      const nutzapEvent = new NDKEvent(ndkInstance, {
        kind: 9321,
        content: "Robots Building Education",
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ...proofTags,
          ["amount", amount.toString()],
          ["unit", unit],
          ["u", DEFAULT_MINT],
          ["p", recipientHex],
        ],
      });

      await nutzapEvent.sign(signer);
      await nutzapEvent.publish();
      console.log("[Wallet] Nutzap published!");

      await verifyAndUpdateBalance();

      return true;
    } catch (e) {
      console.error("[Wallet] Error sending nutzap:", e);

      const isSpentError =
        e.message?.toLowerCase().includes("already spent") ||
        e.message?.toLowerCase().includes("no valid proofs") ||
        e.message?.toLowerCase().includes("insufficient valid");

      if (isSpentError && retryCount < MAX_RETRIES) {
        console.log(
          `[Wallet] Retrying... attempt ${retryCount + 1}/${MAX_RETRIES}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        return get().sendOneSatToNpub(recipientNpub, retryCount + 1);
      }

      setError(e.message);
      await verifyAndUpdateBalance();

      return false;
    }
  },

  // Reset state (logout)
  resetState: () => {
    for (const pubkey of activeDepositMonitors.keys()) {
      stopDepositMonitor(pubkey);
    }

    set({
      isConnected: false,
      errorMessage: null,
      nostrPubKey: "",
      nostrPrivKey: "",
      ndkInstance: null,
      signer: null,
      cashuWallet: null,
      walletBalance: 0,
      proofs: [],
      invoice: "",
      isCreatingWallet: false,
      isWalletReady: false,
    });
  },
}));

export default useNostrWalletStore;
