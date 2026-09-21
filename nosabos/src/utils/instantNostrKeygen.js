import NDK, { NDKPrivateKeySigner, NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { bech32 } from "bech32";
import { Buffer } from "buffer";

/**
 * Generates and persists Nostr keypair on demand without blocking the initial route mount.
 * Sets local_nsec, local_npub, uniqueId, and displayName in localStorage.
 */
export async function generateInstantNostrKeys(userDisplayName = "") {
  if (typeof window === "undefined") return null;

  const existingNsec = localStorage.getItem("local_nsec");
  const existingNpub = localStorage.getItem("local_npub");
  if (existingNsec && existingNpub) {
    return { nsec: existingNsec, npub: existingNpub };
  }

  try {
    const privateKeySigner = NDKPrivateKeySigner.generate();
    const privateKey = privateKeySigner.privateKey;
    const user = await privateKeySigner.user();
    const publicKey = user.npub;

    const encodedNsec = bech32.encode(
      "nsec",
      bech32.toWords(Buffer.from(privateKey, "hex")),
    );

    localStorage.setItem("local_nsec", encodedNsec);
    localStorage.setItem("local_npub", publicKey);
    localStorage.setItem("uniqueId", publicKey);
    localStorage.setItem("displayName", userDisplayName || "");
    try {
      sessionStorage.setItem("new_registration_npub", publicKey);
    } catch {}

    // In background, connect and publish kind 0 and kind 1 introductory post
    try {
      const ndk = new NDK({
        explicitRelayUrls: ["wss://relay.ditto.pub", "wss://relay.primal.net"],
      });
      ndk.signer = privateKeySigner;
      await ndk.connect(2500);

      const profileEvent = new NDKEvent(ndk, {
        kind: NDKKind.Metadata,
        content: JSON.stringify({
          name: userDisplayName || "",
          about: "A student onboarded with Robots Building Education",
        }),
        created_at: Math.floor(Date.now() / 1000),
      });
      await profileEvent.sign(privateKeySigner);
      profileEvent.publish().catch(() => {});

      const introEvent = new NDKEvent(ndk, {
        kind: NDKKind.Text,
        content:
          "gm nostr! I've joined #LearnWithNostr from Tiktok by creating an account with https://robotsbuildingeducation.com so I can learn how to code with AI.",
        created_at: Math.floor(Date.now() / 1000),
      });
      await introEvent.sign(privateKeySigner);
      introEvent.publish().catch(() => {});
    } catch (publishErr) {
      console.warn("Could not publish initial Nostr intro post:", publishErr);
    }

    return { nsec: encodedNsec, npub: publicKey };
  } catch (err) {
    console.error("Failed to generate instant Nostr keys:", err);
    return null;
  }
}
