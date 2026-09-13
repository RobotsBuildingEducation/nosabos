import { Buffer } from "node:buffer";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const clone = (value) => structuredClone(value);
const remote = new Map();
const cache = new Map();
let generated = "invalid JSON";
let modelCalls = 0;
const day = "2026-09-09";
globalThis.__deckTest = {
  doc: (_db, ...path) => path.join("/"),
  getDoc: async (key) => ({ data: () => clone(remote.get(key)) }),
  runTransaction: async (_db, fn) =>
    fn({
      get: async (key) => ({ data: () => clone(remote.get(key)) }),
      set: (key, patch) =>
        remote.set(key, { ...remote.get(key), ...clone(patch) }),
    }),
  callResponses: async () => {
    modelCalls++;
    if (generated instanceof Error) throw generated;
    return generated;
  },
  readAccountScopedJson: (key, account) =>
    clone(cache.get(`${account}:${key}`)),
  writeAccountScopedJson: (key, account, value) =>
    cache.set(`${account}:${key}`, clone(value)),
  getLocalDayKey: (value) => {
    assert.ok(value instanceof Date);
    return day;
  },
};
let source = await readFile(
  new URL("./focusedPracticeDecks.js", import.meta.url),
  "utf8",
);
source = source.replace(/import\s+[\s\S]*?from\s+"([^"]+)";/g, () => "");
source =
  "const database = {}; const { doc, getDoc, runTransaction, callResponses, readAccountScopedJson, writeAccountScopedJson, getLocalDayKey } = globalThis.__deckTest;\n" +
  source;
const decks = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
function repair(account = "a") {
  return {
    npub: account,
    targetLang: "es",
    supportLang: "en",
    stepIndex: 0,
    plan: {
      dayKey: day,
      items: [
        {
          concept: "rolled r",
          expectedAnswer: "a freshly generated phrase",
          originalAnswer: "perro",
          sourceContext: {
            card: {
              id: "r",
              letter: "rr",
              phoneme: "r",
              practiceWord: "perro",
            },
          },
        },
      ],
    },
  };
}
test("phonics failure retains the captured word, writing system and phoneme, with account isolation", async () => {
  remote.clear();
  cache.clear();
  modelCalls = 0;
  generated = new Error("offline model");
  const a = await decks.getFocusedPhonicsDeck(repair());
  assert.equal(a.cards.length, 1);
  assert.equal(a.cards[0].practiceWord, "perro");
  assert.equal(a.cards[0].letter, "rr");
  assert.equal(a.cards[0].phoneme, "r");
  assert.equal(a.cards[0].isRepair, true);
  assert.equal(a.cards[0].isGoal, false);
  await decks.getFocusedPhonicsDeck(repair("b"));
  assert.equal(modelCalls, 2);
  assert.equal(remote.size, 2);
});
test("a focused mini-deck persists item and transfer outcomes across device/cache loss", async () => {
  remote.clear();
  cache.clear();
  modelCalls = 0;
  generated = JSON.stringify([
    { word: "perro", grapheme: "rr", role: "original" },
    { word: "pero", grapheme: "r", role: "contrast" },
    { word: "rojo", grapheme: "r", role: "transfer" },
  ]);
  const focus = repair();
  const first = await decks.getFocusedPhonicsDeck(focus);
  assert.equal(first.cards.length, 3);
  assert.equal(first.cards[2].practiceRole, "transfer");
  assert.equal(
    await decks.savePracticeOutcome(
      focus,
      "phonics",
      { id: "unrelated" },
      true,
    ),
    null,
  );
  await decks.savePracticeOutcome(
    focus,
    "phonics",
    first.cards[0],
    true,
    "modeled",
  );
  const result = await decks.savePracticeOutcome(
    focus,
    "phonics",
    first.cards[2],
    false,
    "modeled",
  );
  assert.equal(result.outcomes[first.cards[0].id].success, true);
  assert.equal(result.outcomes[first.cards[2].id].success, false);
  assert.equal(result.outcomes[first.cards[2].id].transfer, true);
  cache.clear();
  const restored = await decks.getFocusedPhonicsDeck(focus);
  assert.deepEqual(restored, result);
  assert.equal(modelCalls, 1);
});
test("goal recall fallback preserves exact goal chunks and uses separate artifacts", async () => {
  remote.clear();
  cache.clear();
  generated = "bad response";
  const focus = {
    npub: "a",
    targetLang: "ja",
    supportLang: "en",
    blueprint: {
      goalId: "family",
      dayKey: day,
      cefrLevel: "Pre-A1",
      objective: "Ask about childhood",
      targetLanguage: ["子供の頃はどこに住んでいましたか？"],
    },
  };
  const first = await decks.getGoalFlashcards(focus);
  assert.equal(first.cards[0].concept.ja, focus.blueprint.targetLanguage[0]);
  assert.equal(first.cards[0].isGoal, true);
  assert.equal(first.cards[0].isRepair, undefined);
  const replacement = {
    ...focus,
    blueprint: {
      ...focus.blueprint,
      goalId: "work",
      targetLanguage: ["質問があります。"],
    },
  };
  const second = await decks.getGoalFlashcards(replacement);
  assert.notEqual(first.ownerKey, second.ownerKey);
  assert.equal(second.cards[0].concept.ja, "質問があります。");
  // Only one bounded goal flashcard field per language/day, even after replacement.
  assert.equal(Object.keys([...remote.values()][0]).length, 1);
});
