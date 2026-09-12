import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import * as model from "./voiceJourneyModel.js";
import * as intelligence from "./learningIntelligenceModel.js";
import * as crypto from "./voiceJourneyCrypto.js";
import * as questState from "./dailyQuestState.js";

const database = new Map();
let queue = Promise.resolve();
const snapshot = ref => ({ exists: () => database.has(ref), data: () => structuredClone(database.get(ref)) });
const apply = (object, key, value) => {
  const segments = key.split(".");
  let parent = object;
  for (const segment of segments.slice(0, -1)) parent = parent[segment] ||= {};
  parent[segments.at(-1)] = structuredClone(value);
};
const firestore = {
  doc: (_db, ...path) => path.join("/"),
  Bytes: { fromUint8Array: bytes => bytes },
  getDoc: async ref => snapshot(ref), onSnapshot() {}, setDoc() {},
  runTransaction(_db, callback) {
    const promise = queue.then(async () => {
      const writes = [];
      const result = await callback({
        get: async ref => { assert.equal(writes.length, 0, "Firestore requires every read before writes"); return snapshot(ref); },
        set: (ref, value) => writes.push(() => database.set(ref, structuredClone(value))),
        update: (ref, patch) => writes.push(() => {
          assert.ok(database.has(ref), "update requires an existing document");
          const next = structuredClone(database.get(ref));
          for (const [key, value] of Object.entries(patch)) apply(next, key, value);
          database.set(ref, next);
        }),
        delete: ref => writes.push(() => database.delete(ref)),
      });
      writes.forEach(write => write());
      return result;
    });
    queue = promise.catch(() => {});
    return promise;
  },
};
const getLocalDayKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
globalThis.__journeyTest = { firestore, model, intelligence, crypto, questState, getLocalDayKey };
async function loadService(path, imports) {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  source = source.replace(/import\s+[\s\S]*?from\s+"([^"]+)";/g, (_match, specifier) => {
    assert.ok(imports[specifier], `Explicit test boundary: ${specifier}`);
    return imports[specifier];
  }).replace(/export\s*\{[^}]+\}\s*from\s*"[^"]+";/g, "");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}
const common = {
  "firebase/firestore": "const { Bytes, doc, getDoc, onSnapshot, runTransaction, setDoc } = globalThis.__journeyTest.firestore;",
  "../firebaseResources/firebaseResources": "const database = {};",
};
const service = await loadService("./voiceJourney.js", {
  ...common,
  "./voiceJourneyModel": "const { canRecordJourneyMilestone, completeJourneyQuest, JOURNEY_MAX_AUDIO_BYTES, JOURNEY_MAX_SECONDS, JOURNEY_MILESTONES, QUESTS_PER_JOURNEY_SESSION, journeySessionCount } = globalThis.__journeyTest.model;",
  "./voiceJourneyCrypto": "const { decryptJourneyPayload, encryptJourneyPayload } = globalThis.__journeyTest.crypto; const journeyKeyWrapper = async () => ({ encrypt: async text => text, decrypt: async text => text });",
});
globalThis.__journeyTest.service = service;
const plate = await loadService("./dailyPlate.js", {
  ...common,
  "../hooks/useUserStore": "const useUserStore = {};",
  "./voiceJourney": "const { prepareJourneyCompletion } = globalThis.__journeyTest.service;",
  "./learningIntelligenceModel": "const { activeGoalFor, composeQuestKinds, goalModesFor, goalModeTarget } = globalThis.__journeyTest.intelligence;",
  "./learningIntelligence": "const astraGoalsEnabled = () => true;",
  "./dailyQuestTargets": "const DAILY_QUEST_FLASHCARD_TARGET_DEFAULT = 4; const getDailyQuestFlashcardTarget = () => 4;",
  "./flashcardReview": "const { getLocalDayKey } = globalThis.__journeyTest;",
  "./userDataSchema": "const pruneDayEntries = value => value;",
  "./dailyQuestState": "const { readAccountScopedJson, removeAccountScopedValue, writeAccountScopedJson } = globalThis.__journeyTest.questState;",
});
function seed(npub = "account-a", lang = "es", day = "2026-09-10") {
  database.set(`users/${npub}`, {
    local_npub: npub,
    progress: { speakDailyActivity: { [lang]: { [day]: 1 } }, lessonDailyActivity: { [lang]: { [day]: 1 } }, flashcardDailyActivity: { [lang]: { [day]: 4 } } },
  });
}
const date = new Date(2026, 8, 10, 13);

test("the test button advances each milestone and preserves recordings without awarding quest progress", async () => {
  database.clear(); seed();
  const originalUser = structuredClone(database.get("users/account-a"));
  for (const milestone of model.JOURNEY_MILESTONES) {
    const result = await service.unlockNextJourneyMilestoneForTesting("account-a", "es");
    assert.equal(result.milestone, milestone);
    assert.equal(model.journeySessionCount(result.journey), milestone);
    assert.equal(model.pendingJourneyMilestone(result.journey), null);
    assert.equal(model.canRecordJourneyMilestone(result.journey, milestone), true);
    if (milestone === 1) database.get("users/account-a/voiceJourney/es").recordings = { 1: { capturedSession: 1 } };
    else assert.deepEqual(result.journey.recordings[1], { capturedSession: 1 });
  }
  assert.equal(await service.unlockNextJourneyMilestoneForTesting("account-a", "es"), null);
  assert.deepEqual(database.get("users/account-a"), originalUser);
  assert.equal([...database.keys()].some(key => key.includes("/completions/")), false);
});

test("two devices completing the same quest get one session and one bonus claim", async () => {
  database.clear(); seed();
  const results = await Promise.all([plate.claimDailyPlateBonus("account-a", "es", date), plate.claimDailyPlateBonus("account-a", "es", date)]);
  assert.deepEqual(results.sort(), [false, true]);
  assert.equal(database.get("users/account-a/voiceJourney/es").completedQuests, 1);
  assert.ok(database.has("users/account-a/voiceJourney/es/completions/2026-09-10"));
});

test("an incomplete quest never awards a session even if the client asks", async () => {
  database.clear(); seed();
  database.get("users/account-a").progress.lessonDailyActivity.es["2026-09-10"] = 0;
  assert.equal(await plate.claimDailyPlateBonus("account-a", "es", date), false);
  assert.equal(database.has("users/account-a/voiceJourney/es"), false);
});

test("developer quest resets preserve Journey's durable completion receipt", async () => {
  database.clear(); seed();
  await plate.claimDailyPlateBonus("account-a", "es", date);
  seed(); // reset/replay all original daily activity and the bonus marker
  await plate.claimDailyPlateBonus("account-a", "es", date);
  assert.equal(database.get("users/account-a/voiceJourney/es").completedQuests, 1);
});

test("account and language progress is independent; future days add sessions", async () => {
  database.clear(); seed(); seed("account-b", "fr");
  await plate.claimDailyPlateBonus("account-a", "es", date);
  await plate.claimDailyPlateBonus("account-b", "fr", date);
  seed("account-a", "es", "2026-09-11");
  await plate.claimDailyPlateBonus("account-a", "es", new Date(2026, 8, 11));
  assert.equal(database.get("users/account-a/voiceJourney/es").completedQuests, 2);
  assert.equal(database.get("users/account-b/voiceJourney/fr").completedQuests, 1);
  assert.equal(database.has("users/account-a/voiceJourney/fr"), false);
});

test("acknowledging an older prompt cannot re-open newer prompts", async () => {
  database.clear(); database.set("users/account-a/voiceJourney/es", { completedQuests: 30 });
  await service.acknowledgeJourneyMilestone("account-a", "es", 30);
  await service.acknowledgeJourneyMilestone("account-a", "es", 5);
  assert.equal(database.get("users/account-a/voiceJourney/es").lastPromptedMilestone, 30);
  await service.acknowledgeJourneyMilestone("account-a", "es", 150);
  assert.equal(database.get("users/account-a/voiceJourney/es").lastPromptedMilestone, 30);
});

test("saving an unlocked recording stores only ciphertext; duplicates and locks fail", async () => {
  database.clear(); database.set("users/account-a/voiceJourney/es", { completedQuests: 5 });
  globalThis.localStorage = { getItem: () => "account-a" };
  globalThis.FileReader = class {
    async readAsDataURL(blob) { this.result = `data:audio/webm;base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`; this.onload(); }
  };
  try {
    const options = { npub: "account-a", lang: "es", milestone: 1, blob: new Blob(["fixture audio"], { type: "audio/webm" }), duration: 3, prompt: "My private prompt", support: "hints" };
    await service.saveJourneyRecording(options);
    const stored = database.get("users/account-a/voiceJourney/es/recordings/1");
    assert.deepEqual(Object.keys(stored).sort(), ["ciphertext", "iv", "version", "wrappedKey"]);
    assert.equal(database.get("users/account-a/voiceJourney/es").recordings[1].capturedSession, 5);
    await assert.rejects(service.saveJourneyRecording(options), /already exists/);
    await assert.rejects(service.saveJourneyRecording({ ...options, milestone: 15 }), /locked/);
    await service.deleteJourneyRecording("account-a", "es", 1);
    assert.equal(database.has("users/account-a/voiceJourney/es/recordings/1"), false);
    assert.equal(database.get("users/account-a/voiceJourney/es").completedQuests, 5);
  } finally { delete globalThis.localStorage; delete globalThis.FileReader; }
});
