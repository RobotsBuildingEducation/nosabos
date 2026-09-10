import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import * as progress from "./lessonProgress.js";
import * as model from "./learningIntelligenceModel.js";
import * as pet from "./dailyGoalPet.js";
import * as schema from "./userDataSchema.js";

// Exercise the real XP transaction with an isolated, serialized Firestore boundary.
let records, localUser, focus, failWrite;
let queue = Promise.resolve();
const clone = (value) => structuredClone(value);
const merge = (a, b) => {
  for (const [key, value] of Object.entries(b)) a[key] = value && typeof value === "object" && !Array.isArray(value) ? merge(a[key] || {}, value) : clone(value);
  return a;
};
const setPath = (object, path, value) => {
  const parts = path.split(".");
  let parent = object;
  for (const part of parts.slice(0, -1)) parent = parent[part] ||= {};
  parent[parts.at(-1)] = clone(value);
};
const firestore = {
  doc: (_db, ...parts) => parts.join("/"),
  serverTimestamp: () => "test-timestamp",
  runTransaction: (_db, fn) => {
    const task = queue.then(async () => {
      const draft = clone(records);
      await fn({
        get: async (ref) => ({ exists: () => Boolean(draft[ref]), data: () => clone(draft[ref]) }),
        set: (ref, data) => { draft[ref] = merge(draft[ref] || {}, data); },
        update: (ref, data) => { for (const [path, value] of Object.entries(data)) setPath(draft[ref], path, value); },
      });
      if (failWrite) throw new Error("Test write rejected");
      records = draft;
    });
    queue = task.catch(() => {});
    return task;
  },
};
const store = { getState: () => ({ user: localUser, patchUser: (patch) => { localUser = { ...localUser, ...patch }; } }) };
globalThis.__goalXpTest = { progress, model, pet, schema, firestore, store, getFocus: () => focus };
const imports = {
  "./lessonProgress": "const { nextGoalPreparationXp, getGoalPreparationXp } = globalThis.__goalXpTest.progress;",
  "./learningIntelligenceModel": "const { practiceXpAttribution } = globalThis.__goalXpTest.model;",
  "./learningIntelligence": "const currentGoalFocus = globalThis.__goalXpTest.getFocus;",
  "../hooks/useRepairFocusStore": "const currentRepairFocus = () => null;",
  "firebase/firestore": "const { doc, runTransaction, serverTimestamp } = globalThis.__goalXpTest.firestore;",
  "../firebaseResources/firebaseResources": "const database = {};",
  "../hooks/useUserStore": "const useUserStore = globalThis.__goalXpTest.store;",
  "./dailyGoalPet": "const { DAILY_GOAL_PET_HEALTH_GAIN, applyDailyGoalPetDelta, buildDailyGoalResetFields, getDailyGoalPetHealth, hasDailyGoalResetExpired } = globalThis.__goalXpTest.pet;",
  "./dailyPlate": 'const PLATE_XP_SOURCE_FIELDS = { lesson: "lessonDailyActivity" };',
  "./userDataSchema": "const { buildDailyXpRecent, getLocalCalendarDayKey, getNextGoalSummary, monthKeyFromDayKey, pruneDayEntries } = globalThis.__goalXpTest.schema;",
};
let source = await readFile(new URL("./utils.js", import.meta.url), "utf8");
source = source.replace(/import\s+[\s\S]*?from\s+"([^"]+)";/g, (_match, specifier) => {
  assert.ok(imports[specifier], `Explicit test boundary: ${specifier}`);
  return imports[specifier];
});
const { awardXp } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
function reset() {
  const dayKey = schema.getLocalCalendarDayKey(new Date());
  const blueprint = { goalId: "coffee", dayKey, mode: "lesson" };
  focus = { npub: "learner", targetLang: "en", blueprint };
  const user = { local_npub: "learner", dailyGoalXp: 1000, dailyResetAt: new Date(Date.now() + 86400000).toISOString(), progress: { targetLang: "en", languageXp: { en: 0 } }, learningIntelligence: { en: { activeGoal: { id: "coffee", status: "active" }, dailyGoal: { blueprint, completed: false } } } };
  records = { "users/learner": user };
  localUser = clone(user); failWrite = false;
  return { skillTreeLessonId: `goal-coffee-${dayKey}` };
}
test("Goal XP is atomic, shared across exercises, and isolated from curriculum completion", async () => {
  const options = reset();
  await awardXp("learner", 5, "en", options);
  assert.equal(localUser.learningIntelligence.en.dailyGoal.preparationXp, 5);
  await Promise.all([awardXp("learner", 7, "en", options), awardXp("learner", 6, "en", options)]);
  assert.equal(records["users/learner"].learningIntelligence.en.dailyGoal.preparationXp, 18);
  assert.equal(localUser.learningIntelligence.en.dailyGoal.preparationXp, 18);
  assert.equal(records["users/learner"].learningIntelligence.en.dailyGoal.completed, false);
  assert.equal(localUser.progress.goalDailyActivity, undefined);
  assert.equal(localUser.progress.languageLessons, undefined);
  assert.ok(!Object.keys(records).some((key) => key.includes("languageLessons")));
  localUser = clone(records["users/learner"]); // Reload sees the same counter.
  assert.equal(progress.getGoalPreparationXp(localUser.learningIntelligence.en, focus.blueprint), 18);
  await awardXp("learner", 4, "en", { source: "speak" });
  assert.equal(localUser.learningIntelligence.en.dailyGoal.preparationXp, 18);
});
test("failed writes and replaced goals cannot gain preparation progress", async () => {
  const options = reset();
  failWrite = true;
  await assert.rejects(awardXp("learner", 5, "en", options), /rejected/);
  assert.equal(localUser.learningIntelligence.en.dailyGoal.preparationXp, undefined);
  failWrite = false;
  records["users/learner"].learningIntelligence.en.activeGoal.id = "replacement";
  await awardXp("learner", 5, "en", options);
  assert.equal(records["users/learner"].learningIntelligence.en.dailyGoal.preparationXp, undefined);
});
