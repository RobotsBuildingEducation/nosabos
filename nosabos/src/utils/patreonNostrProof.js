import { finalizeEvent, nip19 } from "nostr-tools";
import { fetchWithTimeout } from "./fetchWithTimeout.js";

const PATREON_CHALLENGE_ENDPOINT = "/api/patreon/link-challenge";

function storedNsec() {
  if (typeof window === "undefined") return "";
  try {
    return String(window.localStorage.getItem("local_nsec") || "").trim();
  } catch {
    return "";
  }
}

export function canSilentlySignPatreonProof() {
  const nsec = storedNsec();
  return nsec.startsWith("nsec1");
}

async function signEventTemplate(eventTemplate, { allowExtension }) {
  const nsec = storedNsec();
  if (nsec.startsWith("nsec1")) {
    const decoded = nip19.decode(nsec);
    if (decoded.type !== "nsec") throw new Error("Invalid Piyali private key");
    return finalizeEvent(eventTemplate, decoded.data);
  }

  if (
    allowExtension &&
    typeof window !== "undefined" &&
    typeof window.nostr?.signEvent === "function"
  ) {
    return window.nostr.signEvent(eventTemplate);
  }

  throw new Error("No Piyali signer is available");
}

export async function createPatreonNostrProof({
  npub,
  action,
  allowExtension = true,
}) {
  const response = await fetchWithTimeout(PATREON_CHALLENGE_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ npub, action }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.challengeId || !payload.eventTemplate) {
    throw new Error(payload.error || "Unable to create Patreon link proof");
  }

  const signedEvent = await signEventTemplate(payload.eventTemplate, {
    allowExtension,
  });
  return { challengeId: payload.challengeId, signedEvent };
}
