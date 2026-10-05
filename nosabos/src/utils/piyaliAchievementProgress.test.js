import test from "node:test";
import assert from "node:assert/strict";
import { piyaliCompletionProof } from "./piyaliAchievementProgress.js";
import { createCommittedProgressObserver } from "../achievements/committedProgress.js";
import { awardProgressionAchievements, awardTutorLevelAchievements, getStoredAchievements, ACHIEVEMENTS } from "./achievements.js";
import { unlockStore } from "../achievements/unlockStore.js";
import { goalModesFor, goalModeTarget } from "./learningIntelligenceModel.js";
import { PROFICIENCY_LEVELS } from "../achievements/progression.js";
import { levelKey } from "../achievements/progressionEvidence.js";
import { phonicsCompletionEvidence } from "../achievements/phonicsProgress.js";
import { conversationCompletionEvent } from "../achievements/conversationProgress.js";

test("a confirmed fifth lesson unlocks a genuine award and feedback without a test button", async () => {
  const previous = { window: globalThis.window, storage: globalThis.localStorage };
  const storage = new Map();
  globalThis.window = {};
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  const npub = "committed-lesson-user";
  unlockStore.setIdentity(npub);
  const deliveries = [];
  const observer = createCommittedProgressObserver(progress => {
    deliveries.push(awardProgressionAchievements({ npub, source: "nosabos",
      ...piyaliCompletionProof({ ...progress, language: "es", dayKey: "2026-10-01" }),
    }));
  });
  const snapshot = (data, hasPendingWrites = false) => ({ metadata: { hasPendingWrites, fromCache: false }, exists: () => data !== null, data: () => data });
  const summary = count => ({ migration: { complete: true }, tutor: { levels: { pre_a1: { total: 40, completed: count } } } });
  try {
    observer.receive("profile", snapshot({ progress: {} }));
    observer.receive("quest", snapshot(null));
    observer.receive("summary", snapshot(summary(4)));
    await Promise.all(deliveries);
    assert.equal(getStoredAchievements(npub).nosabos_tutor_lessons_5, undefined);
    observer.receive("summary", snapshot(summary(5), true));
    assert.equal(deliveries.length, 1);
    observer.receive("summary", snapshot(summary(5)));
    await Promise.all(deliveries);
    assert.equal(getStoredAchievements(npub).nosabos_tutor_lessons_5.test, undefined);
    const pending = unlockStore.getSnapshot().queue;
    assert.deepEqual(pending.map(item => item.achievement.id), ["nosabos_tutor_lessons_5"]);
    assert.equal(pending[0].test, false);
    assert.equal(pending[0].preview, false);
    observer.receive("summary", snapshot(summary(5)));
    await Promise.all(deliveries);
    assert.equal(unlockStore.getSnapshot().queue.length, 1);
  } finally {
    observer.dispose(); unlockStore.setIdentity("");
    if (previous.window === undefined) delete globalThis.window; else globalThis.window = previous.window;
    if (previous.storage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous.storage;
  }
});

test("goal, repair and immersion triggers use saved completion evidence", () => {
  const language = "es", dayKey = "2026-10-01";
  const blueprint = { mode: "tutor", cefrLevel: "B2", goalId: "goal-1", dayKey };
  const modes = goalModesFor(blueprint);
  const profile = { learningIntelligence: { es: { dailyGoal: { completed: true, blueprint,
    modeProgress: Object.fromEntries(modes.map(mode => [mode, goalModeTarget(mode)])),
  } } }, progress: { repairDailyActivity: { es: { [dayKey]: 2 } } },
  realWorldTasks: { targetLang: language, dayKey, generatedAt: 123, tasks: ["a", "b"], completed: [true, true], rewarded: true } };
  const quest = { repair: { target: 2, createdAt: 123, items: [{ cefrLevel: "B2" }, { cefrLevel: "B2" }] } };
  const proof = () => piyaliCompletionProof({ profile, quest, summary: null, language, dayKey });
  assert.deepEqual(proof().events.map(event => event.metric), ["goals:b2", "repairs:b2", "immersion_tasks", "immersion_tasks", "immersion_checklists"]);
  profile.learningIntelligence.es.dailyGoal.modeProgress[modes[0]] = 0;
  profile.progress.repairDailyActivity.es[dayKey] = 1;
  profile.realWorldTasks.completed[1] = false;
  assert.deepEqual(proof().events.map(event => event.metric), ["immersion_tasks"]);
  // A repair plan alone cannot award a repair, and an unconfirmed curriculum
  // migration cannot award proficiency completion.
  const partial = piyaliCompletionProof({ profile, quest, summary: { migration: { complete: false }, tutor: { levels: { b2: { total: 2, completed: 2 } } } }, language, dayKey });
  assert.deepEqual(partial.evidence.levels, {});
  assert.equal(partial.evidence.counters.tutor_lessons, 0);
});

test("every Piyali award is reachable through genuine completion evidence", async () => {
  const previous = { window: globalThis.window, storage: globalThis.localStorage };
  const storage = new Map();
  globalThis.window = {};
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  const npub = "full-piyali-completion-user";
  unlockStore.setIdentity(npub);
  try {
    const summary = { migration: { complete: true }, ...Object.fromEntries(["tutor", "skillTree", "flashcards"].map(mode => [mode, {
      levels: Object.fromEntries(PROFICIENCY_LEVELS.map(level => [levelKey(level), { total: 40, completed: 40 }])),
    }])) };
    for (const [index, cefrLevel] of PROFICIENCY_LEVELS.entries()) {
      const dayKey = `2026-09-${String(index + 1).padStart(2, "0")}`;
      const blueprint = { mode: "tutor", cefrLevel, goalId: `goal-${index}`, dayKey };
      const profile = { learningIntelligence: { es: { dailyGoal: { completed: true, blueprint,
        modeProgress: Object.fromEntries(goalModesFor(blueprint).map(mode => [mode, goalModeTarget(mode)])),
      } } }, progress: { repairDailyActivity: { es: { [dayKey]: 1 } } } };
      const quest = { repair: { target: 1, createdAt: index + 1, items: [{ cefrLevel }] } };
      await awardProgressionAchievements({ npub, source: "nosabos",
        ...piyaliCompletionProof({ profile, summary, quest, language: "es", dayKey }),
      });
    }
    for (let day = 1; day <= 30; day++) {
      const count = day === 1 ? 200 : 1;
      await awardProgressionAchievements({ npub, source: "nosabos", ...piyaliCompletionProof({
        profile: { realWorldTasks: { targetLang: "es", dayKey: `day-${day}`, generatedAt: day,
          tasks: Array(count).fill("practice"), completed: Array(count).fill(true), rewarded: true } },
        language: "es", dayKey: `day-${day}`, summary,
      }) });
    }
    const cards = [{ letterId: "a", correctCount: 1 }, ...Array.from({ length: 20 }, (_, i) => ({
      letterId: `gen_${i + 1}_0`, generated: true, generatedDeckSize: 1, correctCount: 1,
    }))];
    await awardProgressionAchievements({ npub, source: "nosabos", ...phonicsCompletionEvidence("es", [{ id: "a" }], cards) });
    await awardProgressionAchievements({ npub, source: "nosabos", events: Array.from({ length: 200 }, () =>
      conversationCompletionEvent({ language: "es", goal: { text: { en: "Complete the conversation goal" } }, completed: true })) });
    await awardTutorLevelAchievements({ npub, level: "C2" });
    const expected = Object.values(ACHIEVEMENTS).filter(item => item.source === "nosabos").map(item => item.id).sort();
    const records = getStoredAchievements(npub);
    assert.equal(expected.length, 75);
    assert.deepEqual(Object.keys(records).sort(), expected);
    assert.ok(Object.values(records).every(record => !record.test));
    assert.equal(unlockStore.getSnapshot().queue.length, 75);
    assert.ok(unlockStore.getSnapshot().queue.every(item => !item.preview && !item.test));
  } finally {
    unlockStore.setIdentity("");
    if (previous.window === undefined) delete globalThis.window; else globalThis.window = previous.window;
    if (previous.storage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous.storage;
  }
});
