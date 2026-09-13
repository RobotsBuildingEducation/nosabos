import { Buffer } from "node:buffer";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as model from "./learningIntelligenceModel.js";
import { isGoalLessonReady } from "./lessonProgress.js";
const getLocalDayKey = value => {
  assert.ok(value instanceof Date, "The date helper requires an explicit Date");
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

// Run the real service against a serializable in-memory Firestore boundary.
// This exercises transactions and async races without touching learner data.
const clone = value => structuredClone(value);
let databaseUser;
let localUser;
let focus;
let answer;
let prompts;
let queue = Promise.resolve();
const store = { getState: () => ({ user: localUser, patchUser: patch => { localUser = { ...localUser, ...patch }; } }) };
const focusStore = { getState: () => ({ focus, clearFocus: () => { focus = null; } }) };
function apply(path, value) {
  const keys = path.split(".");
  let parent = databaseUser;
  for (const key of keys.slice(0, -1)) parent = parent[key] ||= {};
  parent[keys.at(-1)] = clone(value);
}
const firestore = {
  doc: (...args) => args,
  getDoc: async () => ({ exists: () => true, data: () => clone(databaseUser) }),
  runTransaction: (_db, fn) => {
    const work = queue.then(async () => {
      const writes = [];
      const result = await fn({ get: async () => ({ data: () => clone(databaseUser) }), update: (_ref, patch) => writes.push(patch) });
      for (const patch of writes) for (const [path, value] of Object.entries(patch)) apply(path, value);
      return result;
    });
    queue = work.catch(() => {});
    return work;
  },
};
globalThis.__astraTest = { firestore, store, focusStore, model, isGoalLessonReady, getLocalDayKey, callResponses: async options => { prompts.push(options.input); return typeof answer === "function" ? answer(options) : answer; } };
globalThis.window = { dispatchEvent() {} };
const imports = {
  "firebase/firestore": "const { doc, getDoc, runTransaction } = globalThis.__astraTest.firestore;",
  "../firebaseResources/firebaseResources": "const database = {}; const analytics = null;",
  "firebase/analytics": "const logEvent = () => {};",
  "../hooks/useUserStore": "const useUserStore = globalThis.__astraTest.store;",
  "../hooks/useGoalFocusStore": "const useGoalFocusStore = globalThis.__astraTest.focusStore;",
  "./llm": "const { callResponses } = globalThis.__astraTest;",
  "./flashcardReview": "const { getLocalDayKey } = globalThis.__astraTest;",
  "./lessonProgress": "const { isGoalLessonReady } = globalThis.__astraTest;",
  "./learningIntelligenceModel": "const { activeGoalFor, changeGoal, compactSummary, mergeEvidence, languageKey, normalizeGoalBlueprint, goalInstructions, GOAL_SURFACES, buildGoalLesson, goalModesFor, goalModeTarget, nextGoalMode } = globalThis.__astraTest.model;",
};
let source = await readFile(new URL("./learningIntelligence.js", import.meta.url), "utf8");
source = source.replace(/import\s+[\s\S]*?from\s+"([^"]+)";/g, (_match, specifier) => {
  assert.ok(imports[specifier], `Stub is explicit: ${specifier}`);
  return imports[specifier];
}).replaceAll("import.meta.env.VITE_ASTRA_GOALS_ENABLED", '"true"');
const service = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

function reset() {
  const day = getLocalDayKey(new Date());
  databaseUser = { local_npub: "test-account", progress: { targetLang: "es", conversationSubjects: "Saved custom topic", helpRequest: "Saved help", tutorVoicePersona: "Saved persona", repairDailyActivity: { es: { [day]: 2 } }, speakDailyActivity: { es: { [day]: 1 } }, lessonDailyActivity: { es: { [day]: 1 } }, conversationDailyActivity: { es: { [day]: 3 } } }, learningIntelligence: {} };
  localUser = clone(databaseUser); focus = null; prompts = []; answer = "bad model JSON";
  return day;
}
const setGoal = (text, targetLang = "es", status = "active") => service.saveLearningGoal({ npub: "test-account", targetLang, text, status });
const blueprint = () => service.getOrBuildGoalBlueprint({ npub: "test-account", targetLang: "es" });
function setFocusFixture(bp) { focus = { npub: "test-account", targetLang: "es", supportLang: "en", surface: model.GOAL_SURFACES[bp.mode], blueprint: bp }; return focus; }

test("settings edits isolate languages and never change Custom Conversation preferences", async () => {
  reset();
  const custom = clone(databaseUser.progress);
  await setGoal("Talk with my grandmother");
  const es = clone(databaseUser.learningIntelligence.es);
  await setGoal("Meet French colleagues", "fr");
  assert.deepEqual(databaseUser.learningIntelligence.es, es);
  await setGoal("Talk with my grandmother", "es", "paused");
  assert.equal(model.activeGoalFor(databaseUser, "es"), null);
  assert.equal(databaseUser.learningIntelligence.es.activeGoal.id, es.activeGoal.id);
  for (const key of Object.keys(custom)) assert.deepEqual(databaseUser.progress[key], custom[key]);
  await setGoal("");
  assert.equal(databaseUser.learningIntelligence.es.activeGoal, null);
  assert.equal(databaseUser.learningIntelligence.fr.activeGoal.text, "Meet French colleagues");
});
test("model failure produces a durable exact-goal Tutor fallback, stable after local hydration is lost", async () => {
  reset(); await setGoal("Ask my grandmother about childhood");
  answer = () => { throw new Error("model unavailable"); };
  const [first, second] = await Promise.all([blueprint(), blueprint()]);
  assert.deepEqual(first, second);
  assert.equal(first.mode, "tutor");
  assert.ok(first.objective.includes("Ask my grandmother about childhood"));
  assert.equal(prompts.length, 1);
  localUser = { local_npub: "test-account", progress: { targetLang: "es" } };
  assert.deepEqual(await blueprint(), first);
  assert.equal(prompts.length, 1);
  assert.equal(service.currentGoalFocus(), null);
  setFocusFixture(first);
  assert.equal(service.currentGoalFocus("tutor")?.blueprint.goalId, first.goalId);
});
test("observable completion is atomic, idempotent and isolated in every goal mode", async () => {
  for (const mode of model.GOAL_MODES) {
    const day = reset(); await setGoal("Ask about childhood");
    answer = JSON.stringify({ mode, targetLanguage: ["¿Dónde vivías?"], objective: "Ask where she lived" });
    const bp = await blueprint();
    const task = setFocusFixture(bp);
    const before = clone(databaseUser.progress);
    const event = { success: true, observation: "Asked where she lived", support: "prompted" };
    const results = await Promise.all([service.recordGoalAttempt(task, event), service.recordGoalAttempt(task, event)]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(databaseUser.progress.goalDailyActivity.es[day], 0);
    for (const remainingMode of bp.modes.slice(1)) {
      await service.recordGoalAttempt(
        setFocusFixture({ ...bp, mode: remainingMode }),
        {
          ...event,
          id: `${mode}:${remainingMode}`,
          observation: `Completed ${remainingMode} practice`,
        },
      );
    }
    assert.equal(databaseUser.progress.goalDailyActivity.es[day], 1);
    for (const key of Object.keys(before).filter(k => k !== "goalDailyActivity")) assert.deepEqual(databaseUser.progress[key], before[key]);
    assert.equal(databaseUser.learningIntelligence.es.dailyGoal.evidence.length, bp.modes.length);
    assert.ok(databaseUser.learningIntelligence.es.goalProgress.demonstrated.length >= 1);
    await setGoal("Lead work meetings");
    assert.equal(databaseUser.progress.goalDailyActivity.es[day], 0);
    assert.equal(await service.recordGoalAttempt(task, event), false);
  }
});
test("empty, failed and stale attempts never complete a goal", async () => {
  const day = reset(); await setGoal("Ask about childhood");
  const task = setFocusFixture(await blueprint());
  assert.equal(await service.recordGoalAttempt(task, { success: true }), false);
  assert.equal(await service.recordGoalAttempt(task, { success: false, observation: "Could not form the question" }), false);
  assert.equal(databaseUser.progress.goalDailyActivity.es[day], 0);
  const stale = { ...task, blueprint: { ...task.blueprint, dayKey: "2000-01-01" } };
  assert.equal(await service.recordGoalAttempt(stale, { success: true, observation: "answer" }), false);
  localUser.progress.targetLang = "fr";
  assert.equal(service.currentGoalFocus(), null);
  localUser.progress.targetLang = "es";
  localUser.local_npub = "another-account";
  assert.equal(service.currentGoalFocus(), null);
});
test("a goal replacement during generation cannot install the old goal's blueprint", async () => {
  reset(); await setGoal("Old goal");
  let release;
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  answer = () => { started(); return new Promise(resolve => { release = resolve; }); };
  const pending = blueprint();
  await ready;
  await setGoal("New goal");
  release('{"mode":"tutor","objective":"Old task"}');
  assert.equal(await pending, null);
  assert.equal(databaseUser.learningIntelligence.es.dailyGoal, null);
});
test("Goal uses recent repair evidence without reading the durable repair-only summary", async () => {
  reset(); await setGoal("Ask about childhood");
  await service.recordLearningEvidence({ npub: "test-account", targetLang: "es", event: { id: "repair-1", target: "Durable-only pattern", mode: "lesson", success: true, support: "prompted", observation: "Produced question after a hint" } });
  localUser.companionMemory = { es: { notes: [{ concept: "Question order", targetLang: "es", expiresAfterDayKey: getLocalDayKey(new Date()) }] } };
  await blueprint();
  assert.match(prompts[0], /Question order/);
  assert.doesNotMatch(prompts[0], /Durable-only pattern/);
  assert.match(prompts[0], /Repair informs support only/);
  assert.equal(databaseUser.learningIntelligence.es.goalProgress.demonstrated.length, 0);
});

test("100% Goal lesson completes today's task once and keeps the long-term goal active", async () => {
  const day = reset();
  await setGoal("Invite someone for coffee");
  answer = JSON.stringify({ mode: "lesson", objective: "Practice inviting someone for coffee" });
  const bp = await blueprint();
  const lesson = model.buildGoalLesson(bp);
  const input = { lesson, npub: "test-account", targetLang: "es" };
  const bucket = databaseUser.learningIntelligence.es;
  bucket.dailyGoal.preparationXp = lesson.xpReward - 1;
  assert.equal(await service.completeGoalLesson(input), false);
  // A caller cannot lower the persisted blueprint's completion target.
  assert.equal(await service.completeGoalLesson({ ...input, lesson: { ...lesson, xpReward: 1 } }), false);
  const before = clone(databaseUser.progress);
  bucket.dailyGoal.preparationXp = lesson.xpReward;
  localUser = clone(databaseUser); // Resuming at 100% also completes.
  assert.equal(isGoalLessonReady(localUser.learningIntelligence.es, lesson), true);
  const results = await Promise.all([service.completeGoalLesson(input), service.completeGoalLesson(input)]);
  assert.deepEqual(results, [true, true]);
  assert.equal(databaseUser.learningIntelligence.es.dailyGoal.completed, false);
  for (const remainingMode of bp.modes.filter((mode) => mode !== "lesson")) {
    await service.recordGoalAttempt(
      setFocusFixture({ ...bp, mode: remainingMode }),
      {
        id: `remaining:${remainingMode}`,
        success: true,
        support: "prompted",
        observation: `Completed ${remainingMode} practice`,
      },
    );
  }
  const completed = databaseUser.learningIntelligence.es;
  assert.equal(completed.dailyGoal.completed, true);
  assert.equal(localUser.progress.goalDailyActivity.es[day], 1);
  assert.equal(completed.dailyGoal.evidence.length, bp.modes.length);
  const lessonEvidence = completed.dailyGoal.evidence.find((entry) => entry.mode === "lesson");
  assert.equal(lessonEvidence.support, "prompted");
  assert.match(lessonEvidence.observation, /not independent real-world mastery/);
  assert.equal(completed.activeGoal.status, "active");
  for (const key of Object.keys(before).filter(key => key !== "goalDailyActivity")) assert.deepEqual(databaseUser.progress[key], before[key]);
  localUser = clone(databaseUser);
  assert.equal(await service.completeGoalLesson(input), true);
  assert.equal(databaseUser.learningIntelligence.es.dailyGoal.evidence.length, bp.modes.length);
  await setGoal("A replacement goal");
  assert.equal(await service.completeGoalLesson(input), false);
});

test("stale, wrong-language and wrong-mode lessons cannot complete a Goal", async () => {
  reset(); await setGoal("Invite someone for coffee");
  answer = JSON.stringify({ mode: "lesson" });
  const bp = await blueprint();
  const lesson = model.buildGoalLesson(bp);
  databaseUser.learningIntelligence.es.dailyGoal.preparationXp = lesson.xpReward;
  assert.equal(await service.completeGoalLesson({ lesson, npub: "test-account", targetLang: "fr" }), false);
  assert.equal(await service.completeGoalLesson({ lesson: { ...lesson, id: "normal-lesson" }, npub: "test-account", targetLang: "es" }), false);
  const stale = { ...bp, dayKey: "2020-01-01" };
  assert.equal(await service.completeGoalLesson({ lesson: model.buildGoalLesson(stale), npub: "test-account", targetLang: "es" }), false);
  assert.equal(await service.completeGoalLesson({ lesson: model.buildGoalLesson({ ...bp, mode: "tutor" }), npub: "test-account", targetLang: "es" }), false);
  assert.equal(databaseUser.learningIntelligence.es.dailyGoal.completed, false);
});
