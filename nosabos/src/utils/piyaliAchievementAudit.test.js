import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import parser from "@babel/parser";
import { ACHIEVEMENTS, TUTOR_LEVELS } from "../achievements/catalog.js";
import { levelKey } from "../achievements/progressionEvidence.js";
import { tutorLevelFromCompletions } from "../achievements/proficiencyCompletion.js";
import { unlockStore } from "../achievements/unlockStore.js";
import { createCommittedProgressObserver } from "../achievements/committedProgress.js";
import { phonicsCompletionEvidence } from "../achievements/phonicsProgress.js";
import { conversationCompletionEvent } from "../achievements/conversationProgress.js";
import { buildCourseProgressSummary, createEmptyCourseProgressSummary } from "./courseProgress.js";
import { piyaliCompletionProof } from "./piyaliAchievementProgress.js";
import { awardPiyaliFlashcardProgress } from "./piyaliFlashcardAchievements.js";
import { awardProgressionAchievements, awardTutorLevelAchievements, getStoredAchievements } from "./achievements.js";
import { goalModesFor, goalModeTarget } from "./learningIntelligenceModel.js";

const language = "es", source = "nosabos", dayKey = "2026-10-04";
const levels = createEmptyCourseProgressSummary(language);
const modeFields = { tutor: "tutorLanguageLessons", skillTree: "languageLessons", flashcards: "languageFlashcards" };
const tutorSource = readFileSync(new URL("../components/Tutor.jsx", import.meta.url), "utf8");
const tutorAst = parser.parse(tutorSource, { sourceType: "module", plugins: ["jsx"] });
let tutorEarnedNode;
function findTutorEarned(node) {
  if (!node || typeof node !== "object") return;
  if (node.type === "VariableDeclarator" && node.id.name === "tutorEarnedLevel") tutorEarnedNode = node.init.arguments[0];
  Object.values(node).forEach(value => { if (Array.isArray(value)) value.forEach(findTutorEarned); else if (value && typeof value === "object") findTutorEarned(value); });
}
findTutorEarned(tutorAst);
assert.ok(tutorEarnedNode);
const tutorEarnedLevel = Function("TUTOR_CEFR_LEVELS", "tutorLevelCompletionStatus", "tutorLevelFromCompletions",
  `return (${tutorSource.slice(tutorEarnedNode.start, tutorEarnedNode.end)})();`);

function curriculum(mode, count, onlyLevel) {
  const records = [];
  for (const level of onlyLevel ? [onlyLevel] : TUTOR_LEVELS) {
    const n = Math.min(count, levels[mode].levels[levelKey(level)].total);
    for (let i = 0; i < n; i++) records.push(mode === "flashcards"
      ? { cardId: `${level.toLowerCase()}-${i + 1}`, cefrLevel: level, completed: true }
      : { lessonId: `lesson-${level.toLowerCase()}-audit-${i + 1}`, cefrLevel: level, status: "completed" });
    count -= n;
  }
  assert.equal(count, 0, "fixture fits the actual curriculum totals");
  // Production summaries must count a repeated saved completion only once.
  return buildCourseProgressSummary({ targetLang: language, [modeFields[mode]]: [...records, ...records.slice(0, 1)] });
}

async function committed(npub, { profile = {}, summary = null, quest = null }) {
  const deliveries = [];
  const observer = createCommittedProgressObserver(progress => deliveries.push(awardProgressionAchievements({
    npub, source, ...piyaliCompletionProof({ ...progress, language, dayKey }),
  })));
  for (const [name, value] of Object.entries({ profile, summary, quest })) observer.receive(name, {
    metadata: { hasPendingWrites: false, fromCache: false }, exists: () => value !== null, data: () => value,
  });
  await Promise.all(deliveries);
  observer.dispose();
}

async function perform(npub, item, complete) {
  const { requirement: r } = item;
  if (r.type === "level") {
    const index = TUTOR_LEVELS.indexOf(r.level);
    const status = Object.fromEntries(TUTOR_LEVELS.map((level, i) => [level, { isComplete: i === index - (complete ? 1 : 2) }]));
    return awardTutorLevelAchievements({ npub, level: tutorEarnedLevel(TUTOR_LEVELS, status, tutorLevelFromCompletions) });
  }
  if (r.type === "level_set") {
    return committed(npub, { summary: curriculum(r.metric, levels[r.metric].levels[levelKey(r.level)].total - (complete ? 0 : 1), r.level) });
  }
  if (r.type === "full_language_course") {
    const summary = createEmptyCourseProgressSummary(language);
    summary.migration.complete = true;
    for (const mode of r.modes) summary[mode].levels.c2.completed = summary[mode].levels.c2.total;
    if (!complete) summary.flashcards.levels.c2.completed--;
    return committed(npub, { summary });
  }
  if (r.type === "level_counter") {
    if (r.metric === "goals") {
      const blueprint = { modes: ["tutor", "flashcards"], goalId: item.id, dayKey, cefrLevel: r.level };
      const modeProgress = Object.fromEntries(goalModesFor(blueprint).map(mode => [mode, goalModeTarget(mode)]));
      if (!complete) modeProgress.flashcards--;
      return committed(npub, { profile: { learningIntelligence: { [language]: { dailyGoal: { completed: true, blueprint, modeProgress } } } } });
    }
    return committed(npub, { quest: { repair: { createdAt: item.id, target: 2, items: [{ cefrLevel: r.level }, { cefrLevel: r.level }] } },
      profile: { progress: { repairDailyActivity: { [language]: { [dayKey]: complete ? 2 : 1 } } } } });
  }
  if (r.metric === "phonics_cards" || r.metric === "phonics_decks") {
    const documents = [{ letterId: "a", correctCount: 1 }];
    const target = r.type === "complete_set" ? 1 : r.target;
    for (let i = 1; i <= target; i++) documents.push({ letterId: `gen_${i}_0`, generated: true,
      generatedDeckSize: 1, correctCount: i < target || complete ? 1 : 0 });
    return awardProgressionAchievements({ npub, source, ...phonicsCompletionEvidence(language, [{ id: "a" }], documents) });
  }
  if (r.type === "counter") {
    const count = r.target - (complete ? 0 : 1);
    const mode = { tutor_lessons: "tutor", skill_tree_lessons: "skillTree" }[r.metric];
    if (mode) return committed(npub, { summary: curriculum(mode, count) });
    if (r.metric === "flashcards_completed") {
      const summary = curriculum("flashcards", count);
      const cards = [];
      for (const level of TUTOR_LEVELS) for (let i = 0; i < summary.flashcards.levels[levelKey(level)].completed; i++)
        cards.push({ cardId: `${level.toLowerCase()}-${i + 1}`, successfulReviews: 1, lastReviewOutcome: "good", completed: false });
      return awardPiyaliFlashcardProgress({ npub, language, cards });
    }
    if (r.metric === "conversation_goals") {
      const events = Array.from({ length: count }, () => conversationCompletionEvent({ language, goal: { text: { en: "Order lunch" } }, completed: true }));
      return awardProgressionAchievements({ npub, source, events });
    }
    if (r.metric === "immersion_tasks") return committed(npub, { profile: { realWorldTasks: {
      targetLang: language, generatedAt: 1, dayKey, tasks: Array(r.target).fill("Practice"),
      completed: Array.from({ length: r.target }, (_, i) => i < count), rewarded: complete,
    } } });
    if (r.metric === "immersion_checklists") {
      for (let i = 0; i < count; i++) await committed(npub, { profile: { realWorldTasks: {
        targetLang: language, generatedAt: i + 1, dayKey: `audit-day-${i}`, tasks: ["Practice"], completed: [true], rewarded: true,
      } } });
      return;
    }
  }
  assert.fail(`Unmapped Piyali trigger: ${item.id}`);
}

test("all 75 Piyali awards reject incomplete work, unlock at completion, persist and don't repeat", async t => {
  const previous = { window: globalThis.window, storage: globalThis.localStorage };
  const storage = new Map();
  globalThis.window = {};
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  const items = Object.values(ACHIEVEMENTS).filter(item => item.source === source);
  assert.equal(items.length, 75);
  try {
    for (const item of items) await t.test(item.id, async () => {
      const account = `audit-${item.id}`;
      unlockStore.setIdentity(account);
      await perform(account, item, false);
      assert.equal(getStoredAchievements(account)[item.id], undefined, "no early award");
      await perform(account, item, true);
      const earned = getStoredAchievements(account)[item.id];
      assert.ok(earned && !earned.test, "genuine completion awards");
      if (["level_set", "level_counter"].includes(item.requirement.type)) {
        for (const level of TUTOR_LEVELS.slice(0, TUTOR_LEVELS.indexOf(item.requirement.level) + 1)) {
          assert.ok(getStoredAchievements(account)[`piyali_${item.requirement.metric}_complete_${levelKey(level)}`], "production proof also awards earlier levels");
        }
      }
      assert.equal(unlockStore.getSnapshot().queue.filter(entry => entry.achievement.id === item.id).length, 1);
      await perform(account, item, true);
      assert.deepEqual(getStoredAchievements(account)[item.id], earned, "timestamp survives duplicate completion");
      assert.equal(unlockStore.getSnapshot().queue.filter(entry => entry.achievement.id === item.id).length, 1);
      assert.ok(JSON.parse(storage.get(`learning_achievements_v1_${account}`))[item.id], "saved outside component state");
      assert.equal(getStoredAchievements(`${account}-other-user`)[item.id], undefined, "account isolation");
    });
  } finally {
    unlockStore.setIdentity("");
    if (previous.window === undefined) delete globalThis.window; else globalThis.window = previous.window;
    if (previous.storage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous.storage;
  }
});
