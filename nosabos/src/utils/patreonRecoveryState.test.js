import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyPatreonReplacementResponse,
  createPatreonRecheckGate,
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
