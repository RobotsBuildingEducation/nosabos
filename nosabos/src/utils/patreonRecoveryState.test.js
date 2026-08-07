import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyPatreonReplacementResponse,
  createPatreonRecheckGate,
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

test("focus and visibility rechecks ignore hidden and duplicate events", () => {
  let currentTime = 2_000;
  const shouldRecheck = createPatreonRecheckGate({
    minimumIntervalMs: 1500,
    now: () => currentTime,
  });
  assert.equal(shouldRecheck("hidden"), false);
  assert.equal(shouldRecheck("visible"), true);
  currentTime += 200;
  assert.equal(shouldRecheck("visible"), false);
  currentTime += 1500;
  assert.equal(shouldRecheck("visible"), true);
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
