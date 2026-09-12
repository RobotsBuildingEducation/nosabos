import { getPublicKey, nip19, nip44 } from "nostr-tools";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const binding = (npub, lang, milestone) => encoder.encode(`piyali-voice-journey:v1:${npub}:${lang}:${milestone}`);
const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
const unhex = value => {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error("Invalid recording key");
  return Uint8Array.from(value.match(/../g), byte => parseInt(byte, 16));
};

// Wrap only the random AES key with NIP-44; audio exceeds NIP-44's message
// limit. The existing account key never leaves this device or its signer.
export async function journeyKeyWrapper(npub) {
  const decoded = nip19.decode(npub);
  if (decoded.type !== "npub") throw new Error("Sign in to access recordings");
  if (localStorage.getItem("local_npub") !== npub) throw new Error("Account changed");
  const nsec = localStorage.getItem("local_nsec");
  if (nsec?.startsWith("nsec")) {
    const secret = nip19.decode(nsec);
    if (secret.type !== "nsec" || getPublicKey(secret.data) !== decoded.data) throw new Error("Account changed");
    const key = nip44.v2.utils.getConversationKey(secret.data, decoded.data);
    return {
      encrypt: value => nip44.v2.encrypt(value, key),
      decrypt: value => nip44.v2.decrypt(value, key),
    };
  }
  const signer = globalThis.window?.nostr;
  if (!signer?.nip44?.encrypt || !signer?.nip44?.decrypt) throw new Error("JOURNEY_SIGNER_UNSUPPORTED");
  if (await signer.getPublicKey() !== decoded.data) throw new Error("Account changed");
  return {
    encrypt: value => signer.nip44.encrypt(decoded.data, value),
    decrypt: value => signer.nip44.decrypt(decoded.data, value),
  };
}

export async function encryptJourneyPayload(payload, { npub, lang, milestone, wrapper }) {
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: binding(npub, lang, milestone) },
    key, encoder.encode(JSON.stringify(payload)),
  );
  const wrappedKey = await wrapper.encrypt(hex(keyBytes));
  return { version: 1, wrappedKey, iv, ciphertext: new Uint8Array(ciphertext) };
}

export async function decryptJourneyPayload(envelope, { npub, lang, milestone, wrapper }) {
  if (envelope.version !== 1) throw new Error("Unsupported recording version");
  const key = await crypto.subtle.importKey("raw", unhex(await wrapper.decrypt(envelope.wrappedKey)), "AES-GCM", false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: envelope.iv, additionalData: binding(npub, lang, milestone) },
    key, envelope.ciphertext,
  );
  return JSON.parse(decoder.decode(plaintext));
}
