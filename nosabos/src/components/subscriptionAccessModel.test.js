import test from "node:test";
import assert from "node:assert/strict";
import { resolveSubscriptionAccess } from "./subscriptionAccessModel.js";

test("Patreon verification authorizes subscription access", () => {
  assert.deepEqual(
    resolveSubscriptionAccess({ patreonVerified: true, passcodeVerified: false }),
    { authorized: true, requiresPatreonMigration: false },
  );
});

test("legacy passcode verification requires Patreon migration", () => {
  assert.deepEqual(
    resolveSubscriptionAccess({ patreonVerified: false, passcodeVerified: true }),
    { authorized: false, requiresPatreonMigration: true },
  );
});

test("an unverified user sees the standard subscription flow", () => {
  assert.deepEqual(resolveSubscriptionAccess(), {
    authorized: false,
    requiresPatreonMigration: false,
  });
});
