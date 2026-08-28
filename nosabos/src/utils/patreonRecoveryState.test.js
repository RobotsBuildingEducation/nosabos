import test from "node:test";
import assert from "node:assert/strict";
import {
  PATREON_PASSIVE_RECHECK_TTL_MS,
  classifyPatreonReplacementResponse,
  clearPatreonRestoreMiss,
  createPatreonRecheckGate,
  hasFreshPatreonRestoreMiss,
  rememberPatreonRestoreMiss,
  shouldAttemptPatreonKeyRestore,
  shouldHoldForInitialPatreonStatus,
} from "./patreonRecoveryState.js";

test("replacement success and restartable failures have stable frontend outcomes", () => {
  assert.deepEqual(
    classifyPatreonReplacementResponse(true, { authorized: true }),
    { kind: "success", error: "" },
  );
  assert.deepEqual(
    classifyPatreonReplacementResponse(false, {
      error: "replacement_expired",
    }),
    { kind: "restart", error: "replacement_expired" },
  );
  assert.deepEqual(
    classifyPatreonReplacementResponse(false, {
      error: "membership_not_active",
    }),
    { kind: "restart", error: "membership_not_active" },
  );
  assert.deepEqual(classifyPatreonReplacementResponse(false, {}), {
    kind: "failure",
    error: "replacement_failed",
  });
});

test("passive rechecks use a 16-hour TTL while pending returns stay responsive", () => {
  let currentTime = PATREON_PASSIVE_RECHECK_TTL_MS;
  const shouldRecheck = createPatreonRecheckGate({
    now: () => currentTime,
  });
  assert.equal(shouldRecheck("hidden"), false);
  assert.equal(shouldRecheck("visible"), true);
  currentTime += PATREON_PASSIVE_RECHECK_TTL_MS - 1;
  assert.equal(shouldRecheck("visible"), false);
  currentTime += 1;
  assert.equal(shouldRecheck("visible"), true);

  currentTime += 1500;
  assert.equal(shouldRecheck("visible", { pending: true }), true);
});

test("a confirmed missing key link is cached for 16 hours", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const npub = "npub1test";
  const now = 20_000;

  assert.equal(hasFreshPatreonRestoreMiss({ npub, storage, now }), false);
  rememberPatreonRestoreMiss({ npub, storage, now });
  assert.equal(hasFreshPatreonRestoreMiss({ npub, storage, now }), true);
  assert.equal(
    hasFreshPatreonRestoreMiss({
      npub,
      storage,
      now: now + PATREON_PASSIVE_RECHECK_TTL_MS,
    }),
    false,
  );
  clearPatreonRestoreMiss({ npub, storage });
  assert.equal(hasFreshPatreonRestoreMiss({ npub, storage, now }), false);
});

test("key restore never overwrites meaningful checkout or replacement state", () => {
  assert.equal(shouldAttemptPatreonKeyRestore({}), true);
  assert.equal(shouldAttemptPatreonKeyRestore({ authorized: true }), false);
  assert.equal(shouldAttemptPatreonKeyRestore({ connected: true }), false);
  assert.equal(shouldAttemptPatreonKeyRestore({ linked: true }), false);
  assert.equal(
    shouldAttemptPatreonKeyRestore({ replacementRequired: true }),
    false,
  );
  assert.equal(shouldAttemptPatreonKeyRestore({ checkoutRequired: true }), false);
});

test("only the initial unresolved Patreon check can hold the app boot", () => {
  assert.equal(
    shouldHoldForInitialPatreonStatus({
      isResolved: false,
      isChecking: true,
    }),
    true,
  );
  assert.equal(
    shouldHoldForInitialPatreonStatus({
      isResolved: true,
      isChecking: true,
    }),
    false,
  );
  assert.equal(
    shouldHoldForInitialPatreonStatus({
      isResolved: false,
      isChecking: false,
    }),
    true,
  );
});
