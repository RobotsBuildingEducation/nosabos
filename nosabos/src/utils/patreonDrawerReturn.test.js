import test from "node:test";
import assert from "node:assert/strict";
import {
  PATREON_DRAWER_RETURN_KEYS,
  beginPatreonDrawerReturn,
  clearPatreonDrawerReturn,
  completePatreonDrawerReturn,
  hasPendingPatreonDrawerReturn,
  hasPatreonDrawerReopenRequest,
  readPatreonDrawerReadyResult,
  sanitizePatreonDrawerReturnPath,
} from "./patreonDrawerReturn.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("drawer return paths reject external and protocol-relative targets", () => {
  assert.equal(sanitizePatreonDrawerReturnPath("https://evil.example"), "/");
  assert.equal(sanitizePatreonDrawerReturnPath("//evil.example/path"), "/");
  assert.equal(
    sanitizePatreonDrawerReturnPath("/learn?unit=4#exercise"),
    "/learn?unit=4#exercise",
  );
});

test("OAuth return restores the original query and hash with drawer markers", () => {
  const storage = memoryStorage();
  beginPatreonDrawerReturn({
    returnPath: "/learn?unit=4#exercise",
    storage,
    now: 1_000,
  });
  const target = completePatreonDrawerReturn({
    result: "replace_required",
    storage,
    now: 2_000,
  });
  assert.equal(
    target,
    "/learn?unit=4&patreon_drawer=1&patreon_result=replace_required#exercise",
  );
  assert.equal(storage.getItem(PATREON_DRAWER_RETURN_KEYS.pending), null);
  assert.equal(hasPatreonDrawerReopenRequest({ storage }), true);
});

test("page OAuth returns to its page without opening the settings drawer", () => {
  const storage = memoryStorage();
  beginPatreonDrawerReturn({
    returnPath: "/subscribe?plan=annual",
    npub: "npub-original",
    reopenDrawer: false,
    storage,
    now: 1_000,
  });
  const target = completePatreonDrawerReturn({
    result: "connected",
    storage,
    now: 2_000,
  });

  assert.equal(target, "/subscribe?plan=annual&patreon=connected");
  assert.equal(hasPatreonDrawerReopenRequest({ storage }), false);
});

test("completing the callback keeps a durable reopen request until explicit close", () => {
  const storage = memoryStorage();
  beginPatreonDrawerReturn({ returnPath: "/", storage, now: 1_000 });
  completePatreonDrawerReturn({ result: "connected", storage, now: 2_000 });
  assert.equal(hasPatreonDrawerReopenRequest({ storage }), true);
  clearPatreonDrawerReturn({ storage });
  assert.equal(hasPatreonDrawerReopenRequest({ storage }), false);
  assert.equal(storage.getItem(PATREON_DRAWER_RETURN_KEYS.ready), null);
});

test("a callback never changes the browser's active Nostr identity", () => {
  const storage = memoryStorage();
  storage.setItem("local_npub", "npub-active");
  beginPatreonDrawerReturn({
    returnPath: "/",
    npub: "npub-active",
    storage,
    now: 1_000,
  });
  assert.equal(
    hasPendingPatreonDrawerReturn({
      storage,
      npub: "npub-active",
      now: 1_500,
    }),
    true,
  );
  completePatreonDrawerReturn({ result: "connected", storage, now: 2_000 });
  assert.equal(storage.getItem("local_npub"), "npub-active");
});

test("drawer return requests only reopen for the key that started Patreon", () => {
  const storage = memoryStorage();
  beginPatreonDrawerReturn({
    returnPath: "/",
    npub: "npub-original",
    storage,
    now: 1_000,
  });
  completePatreonDrawerReturn({ result: "connected", storage, now: 2_000 });

  assert.equal(
    hasPatreonDrawerReopenRequest({ storage, npub: "npub-original" }),
    true,
  );
  assert.equal(
    hasPatreonDrawerReopenRequest({ storage, npub: "npub-new" }),
    false,
  );
  assert.equal(
    readPatreonDrawerReadyResult({ storage, npub: "npub-new" }),
    "",
  );
});

test("expired pending routes fall back safely", () => {
  const storage = memoryStorage();
  beginPatreonDrawerReturn({ returnPath: "/private", storage, now: 1_000 });
  const target = completePatreonDrawerReturn({
    result: "oauth_error",
    storage,
    now: 1_000 + 11 * 60 * 1000,
  });
  assert.equal(target, "/?patreon_drawer=1&patreon_result=oauth_error");
});

test("unknown callback results are normalized to a safe error state", () => {
  const storage = memoryStorage();
  beginPatreonDrawerReturn({ returnPath: "/learn", storage, now: 1_000 });
  const target = completePatreonDrawerReturn({
    result: "unexpected_result",
    storage,
    now: 2_000,
  });
  assert.equal(target, "/learn?patreon_drawer=1&patreon_result=oauth_error");
});
