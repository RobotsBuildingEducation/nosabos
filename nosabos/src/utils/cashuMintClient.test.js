import assert from "node:assert/strict";
import test from "node:test";
import {
  CashuDepositError,
  cashuAmountToNumber,
  createBolt11DepositQuote,
  getUnspentCashuProofs,
  mintPaidBolt11Quote,
  toNdkProofs,
  waitForPaidMintQuote,
} from "./cashuMintClient.js";

test("normalizes modern Cashu Amount proofs for NDK storage", () => {
  const proofs = toNdkProofs([
    {
      id: "01-keyset",
      amount: { toNumber: () => 8 },
      secret: "secret",
      C: "signature",
    },
  ]);

  assert.deepEqual(proofs, [
    {
      id: "01-keyset",
      amount: 8,
      secret: "secret",
      C: "signature",
    },
  ]);
  assert.equal(cashuAmountToNumber(2n), 2);
  assert.equal(cashuAmountToNumber("4"), 4);
});

test("filters spent proofs with the modern mint client", async () => {
  const proofs = [
    { id: "id", amount: 1, secret: "one", C: "c1" },
    { id: "id", amount: 2, secret: "two", C: "c2" },
  ];
  const wallet = {
    checkProofsStates: async () => [
      { state: "SPENT" },
      { state: "UNSPENT" },
    ],
  };

  assert.deepEqual(await getUnspentCashuProofs(wallet, proofs), [proofs[1]]);
});

test("creates and mints a paid BOLT11 quote", async () => {
  const wallet = {
    createMintQuoteBolt11: async (amount, description) => ({
      quote: "quote-id",
      request: "lnbc...",
      amount,
      description,
    }),
    mintProofsBolt11: async () => [
      {
        id: "01-keyset",
        amount: { toNumber: () => 16 },
        secret: "secret",
        C: "signature",
      },
    ],
  };

  const quote = await createBolt11DepositQuote(wallet, 16);
  const proofs = await mintPaidBolt11Quote(wallet, 16, {
    ...quote,
    state: "PAID",
  });

  assert.equal(quote.quote, "quote-id");
  assert.equal(quote.description, "Robots Building Education deposit");
  assert.equal(proofs[0].amount, 16);
});

test("waits until a mint quote reports PAID", async () => {
  let checks = 0;
  const wallet = {
    checkMintQuoteBolt11: async () => {
      checks += 1;
      return {
        quote: "quote-id",
        state: "PAID",
        expiry: Math.floor(Date.now() / 1000) + 60,
      };
    },
  };

  const paid = await waitForPaidMintQuote(
    wallet,
    {
      quote: "quote-id",
      state: "UNPAID",
      expiry: Math.floor(Date.now() / 1000) + 60,
    },
    { pollIntervalMs: 0 },
  );

  assert.equal(paid.state, "PAID");
  assert.equal(checks, 1);
});

test("checks the mint once before expiring a restored quote", async () => {
  const wallet = {
    checkMintQuoteBolt11: async () => ({
      quote: "quote-id",
      state: "PAID",
      expiry: 100,
    }),
  };

  const paid = await waitForPaidMintQuote(
    wallet,
    { quote: "quote-id", state: "UNPAID", expiry: 100 },
    { pollIntervalMs: 0, now: () => 101_000 },
  );

  assert.equal(paid.state, "PAID");
});

test("reports an already-issued quote without trying to mint twice", async () => {
  await assert.rejects(
    waitForPaidMintQuote(
      {},
      {
        quote: "quote-id",
        state: "ISSUED",
        expiry: Math.floor(Date.now() / 1000) + 60,
      },
      { pollIntervalMs: 0 },
    ),
    (error) =>
      error instanceof CashuDepositError && error.code === "ISSUED",
  );
});
