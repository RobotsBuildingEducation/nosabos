import test from "node:test";
import assert from "node:assert/strict";

import {
  generateSecretKey,
  getPublicKey,
  nip19,
  verifyEvent,
} from "nostr-tools";

import {
  canSilentlySignPatreonProof,
  createPatreonNostrProof,
} from "./patreonNostrProof.js";

test("signs a Patreon challenge locally without sending the private key", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const secretKey = generateSecretKey();
  const nsec = nip19.nsecEncode(secretKey);
  const npub = nip19.npubEncode(getPublicKey(secretKey));
  const eventTemplate = {
    kind: 27235,
    created_at: 1_700_000_000,
    tags: [
      ["action", "restore"],
      ["challenge", "challenge-id"],
      ["expires", "2030-01-01T00:00:00.000Z"],
    ],
    content: "Authorize Piyali Patreon restore: random-challenge",
  };
  let requestBody;

  globalThis.window = {
    localStorage: {
      getItem(key) {
        return key === "local_nsec" ? nsec : null;
      },
    },
  };
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(
      JSON.stringify({ challengeId: "challenge-id", eventTemplate }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    assert.equal(canSilentlySignPatreonProof(), true);
    const proof = await createPatreonNostrProof({
      npub,
      action: "restore",
      allowExtension: false,
    });

    assert.deepEqual(requestBody, { npub, action: "restore" });
    assert.equal(proof.challengeId, "challenge-id");
    assert.equal(proof.signedEvent.pubkey, getPublicKey(secretKey));
    assert.equal(verifyEvent(proof.signedEvent), true);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
