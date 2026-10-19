import { NDKKind } from "@nostr-dev-kit/ndk";
import { Buffer } from "buffer";
import { bech32 } from "bech32";

export function profileFilter(npub) {
  const { words } = bech32.decode(npub);
  return { kinds: [NDKKind.Metadata], authors: [Buffer.from(bech32.fromWords(words)).toString("hex")], limit: 1 };
}
