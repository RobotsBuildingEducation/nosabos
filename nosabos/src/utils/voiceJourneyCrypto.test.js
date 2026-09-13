import test from "node:test";
import assert from "node:assert/strict";
import { generateSecretKey, getPublicKey, nip19, nip44 } from "nostr-tools";
import { decryptJourneyPayload, encryptJourneyPayload, journeyKeyWrapper } from "./voiceJourneyCrypto.js";

test("large audio payloads round-trip with a wrapped key and authenticated account/language/milestone", async () => {
  const secret = generateSecretKey();
  const npub = nip19.npubEncode(getPublicKey(secret));
  const conversationKey = nip44.v2.utils.getConversationKey(secret, getPublicKey(secret));
  const wrapper = { encrypt: value => nip44.v2.encrypt(value, conversationKey), decrypt: value => nip44.v2.decrypt(value, conversationKey) };
  const context = { npub, lang: "es", milestone: 5, wrapper };
  const payload = { audio: "test-audio".repeat(40000), prompt: "Tell me about your family", support: "hints" };
  const encrypted = await encryptJourneyPayload(payload, context);
  assert.deepEqual(await decryptJourneyPayload(encrypted, context), payload);
  assert.equal(new TextDecoder().decode(encrypted.ciphertext).includes(payload.prompt), false);
  await assert.rejects(decryptJourneyPayload(encrypted, { ...context, lang: "fr" }));
  await assert.rejects(decryptJourneyPayload(encrypted, { ...context, milestone: 1 }));
  await assert.rejects(decryptJourneyPayload(encrypted, { ...context, npub: "another-account" }));
  const tampered = { ...encrypted, ciphertext: encrypted.ciphertext.slice() };
  tampered.ciphertext[0] ^= 1;
  await assert.rejects(decryptJourneyPayload(tampered, context));
});

test("private-key account encryption checks the actual signer identity", async () => {
  const secret = generateSecretKey();
  const npub = nip19.npubEncode(getPublicKey(secret));
  const entries = { local_npub: npub, local_nsec: nip19.nsecEncode(secret) };
  globalThis.localStorage = { getItem: key => entries[key] };
  try {
    const wrapper = await journeyKeyWrapper(npub);
    assert.equal(await wrapper.decrypt(await wrapper.encrypt("test")), "test");
    entries.local_nsec = nip19.nsecEncode(generateSecretKey());
    await assert.rejects(journeyKeyWrapper(npub), /Account changed/);
  } finally { delete globalThis.localStorage; }
});

test("extension accounts fail clearly without private recording support", async () => {
  const npub = nip19.npubEncode(getPublicKey(generateSecretKey()));
  globalThis.localStorage = { getItem: key => key === "local_npub" ? npub : "nip07" };
  globalThis.window = { nostr: {} };
  try { await assert.rejects(journeyKeyWrapper(npub), /JOURNEY_SIGNER_UNSUPPORTED/); }
  finally { delete globalThis.localStorage; delete globalThis.window; }
});
