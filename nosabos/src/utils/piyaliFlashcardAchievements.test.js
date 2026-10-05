import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { awardPiyaliFlashcardProgress } from "./piyaliFlashcardAchievements.js";
import { getStoredAchievements, awardProgressionAchievements } from "./achievements.js";
import { unlockStore } from "../achievements/unlockStore.js";
import { createAchievementPersistence } from "../achievements/firestoreRecords.js";
import { piyaliBackfillProofs } from "./piyaliAchievementBackfill.js";

test("five successful first reviews unlock Word Collector while SRS remains in learning", async () => {
  // Load the actual scheduler through Vite because its existing UI imports use
  // JSX and extensionless paths. No browser, listener, or network is started.
  const server = await createServer({ configFile: false, appType: "custom",
    cacheDir: "/private/tmp/piyali-scheduler-test-cache",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, entries: [] },
  });
  let scheduler;
  try { scheduler = await server.ssrLoadModule("/src/utils/flashcardReview.js"); }
  finally { await server.close(); }
  const patch = scheduler.buildFlashcardReviewUpdate({}, "good", new Date("2026-10-04T00:00:00Z"));
  assert.equal(patch.completed, false);
  assert.equal(patch.schedulerState, "learning");
  assert.equal(patch.successfulReviews, 1);
  const previous = { window: globalThis.window, storage: globalThis.localStorage };
  const storage = new Map();
  globalThis.window = {};
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  const npub = "five-new-flashcards", language = "es", id = "nosabos_flashcards_completed_5";
  unlockStore.setIdentity(npub);
  const cards = Array.from({ length: 5 }, (_, i) => ({ cardId: `pre-a1-${i + 1}`, ...patch }));
  try {
    await awardPiyaliFlashcardProgress({ npub, language, cards: cards.slice(0, 4) });
    assert.equal(getStoredAchievements(npub)[id], undefined);
    await awardPiyaliFlashcardProgress({ npub, language, cards: [cards[4]] });
    assert.ok(getStoredAchievements(npub)[id]);
    assert.deepEqual(unlockStore.getSnapshot().queue.map(item => item.achievement.id), [id]);
    assert.ok(!Object.keys(getStoredAchievements(npub)).some(key => key.startsWith("piyali_flashcards_complete")));
    assert.deepEqual(await awardPiyaliFlashcardProgress({ npub, language, cards }), []);
    assert.equal(unlockStore.getSnapshot().queue.length, 1);

    // Ordinary progress hydration recovers an account with missed first reviews.
    unlockStore.setIdentity("missed-first-reviews");
    await awardPiyaliFlashcardProgress({ npub: "missed-first-reviews", language, cards });
    assert.ok(getStoredAchievements("missed-first-reviews")[id]);

    // Backfill uses the same evidence, including first reviews still in learning.
    const backfill = piyaliBackfillProofs({ profile: {}, records: {
      languageFlashcards: cards.map(card => ({ id: `${language}_${card.cardId}`, data: { ...card, targetLang: language } })),
    } });
    assert.equal(backfill.proofs[0].evidence.counters.flashcards_completed, 5);
    assert.equal(backfill.proofs[0].evidence.levels.flashcards.pre_a1.completed, 0);

    // The receiving host reevaluates the union of phone and laptop receipts.
    const adapter = createAchievementPersistence({});
    const ledger = { "flashcards_completed:es": Object.fromEntries(cards.map(card => [card.cardId, 1])) };
    unlockStore.setIdentity("other-device");
    for (const evidence of adapter.evidenceForProgress("nosabos", ledger)) {
      await awardProgressionAchievements({ npub: "other-device", source: "nosabos", evidence });
    }
    assert.ok(getStoredAchievements("other-device")[id]);

    // Other languages and failed recalls cannot silently fill the five-card count.
    unlockStore.setIdentity("partial-language");
    await awardPiyaliFlashcardProgress({ npub: "partial-language", language: "es", cards: cards.slice(0, 4) });
    await awardPiyaliFlashcardProgress({ npub: "partial-language", language: "ja", cards: [cards[4]] });
    await awardPiyaliFlashcardProgress({ npub: "partial-language", language: "es", cards: [{
      cardId: cards[4].cardId, ...scheduler.buildFlashcardReviewUpdate({}, "again"),
    }] });
    const failedTwice = scheduler.buildFlashcardReviewUpdate(scheduler.buildFlashcardReviewUpdate({}, "again"), "again");
    await awardPiyaliFlashcardProgress({ npub: "partial-language", language: "es", cards: [{ cardId: cards[4].cardId, ...failedTwice }] });
    assert.equal(getStoredAchievements("partial-language")[id], undefined);
  } finally {
    unlockStore.setIdentity("");
    if (previous.window === undefined) delete globalThis.window; else globalThis.window = previous.window;
    if (previous.storage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous.storage;
  }
});
