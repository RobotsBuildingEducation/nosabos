import test from "node:test";
import assert from "node:assert/strict";
import { getPublicKey, nip19 } from "nostr-tools";
import { withDevTestProgress } from "./devTestAccount.js";
import { getCompanionLevelFromXp } from "./petTypes.js";
import { scoreForUser } from "./performanceEloModel.js";

function storageFrom(values = {}) {
  const entries = new Map(Object.entries(values));
  return {
    getItem: (key) => entries.get(key) || null,
    setItem: (key, value) => entries.set(key, value),
  };
}

const secret = new Uint8Array(32).fill(1);
const account = {
  nsec: nip19.nsecEncode(secret),
  npub: nip19.npubEncode(getPublicKey(secret)),
};

test("only the matching local account starts at companion level 100 and score 100", () => {
  const storage = storageFrom({ local_nsec: account.nsec, local_npub: account.npub });
  const user = {
    local_npub: account.npub,
    progress: { targetLang: "es", languageXp: { es: 20, fr: 45 } },
    learningIntelligence: { es: { elo: { rating: 1000, scaleVersion: 4 } } },
  };
  const seeded = withDevTestProgress(user, storage, account);
  assert.equal(seeded.progress.languageXp.es, 9900);
  assert.equal(getCompanionLevelFromXp(seeded.progress.languageXp.es), 100);
  assert.equal(scoreForUser(seeded, "es"), 100);
  assert.equal(seeded.progress.languageXp.fr, 45);
  assert.equal(user.progress.languageXp.es, 20);

  assert.equal(withDevTestProgress({ ...user, local_npub: "other" }, storage, account).progress.languageXp.es, 20);
});
