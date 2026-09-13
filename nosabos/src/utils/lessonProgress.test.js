import test from "node:test";
import assert from "node:assert/strict";

import {
  getLessonEarnedXp,
  getLessonProgressPercent,
  hasCompletedLessonXp,
} from "./lessonProgress.js";

test("lesson progress uses only lesson-owned XP", () => {
  const lessonProgress = {
    status: "in_progress",
    earnedXp: 20,
    lessonStartXp: 100,
  };

  assert.equal(getLessonEarnedXp(lessonProgress), 20);
  assert.equal(getLessonProgressPercent(lessonProgress, 50), 40);
  assert.equal(hasCompletedLessonXp(lessonProgress, 50), false);
});

test("legacy shared-XP baselines do not create false lesson progress", () => {
  const legacyProgress = {
    status: "in_progress",
    lessonStartXp: 100,
  };

  assert.equal(getLessonEarnedXp(legacyProgress), 0);
  assert.equal(getLessonProgressPercent(legacyProgress, 50), 0);
  assert.equal(hasCompletedLessonXp(legacyProgress, 50), false);
});

test("lesson progress is capped visually and completes at its own goal", () => {
  const lessonProgress = { status: "in_progress", earnedXp: 55 };

  assert.equal(getLessonProgressPercent(lessonProgress, 50), 100);
  assert.equal(hasCompletedLessonXp(lessonProgress, 50), true);
});

test("Goal preparation counts every module once and survives reloads without completing the goal", async () => {
  const { nextGoalPreparationXp, getGoalPreparationXp } = await import("./lessonProgress.js");
  const blueprint = { goalId: "coffee", dayKey: "2026-09-09", mode: "lesson" };
  let bucket = { activeGoal: { id: "coffee", status: "active" }, dailyGoal: { blueprint, completed: false } };
  const input = { focus: { npub: "learner", targetLang: "en", blueprint }, npub: "learner", targetLang: "en", dayKey: blueprint.dayKey, lessonId: "goal-coffee-2026-09-09" };
  const percentages = [];
  for (const amount of [5, 2, 6, 7]) {
    bucket.dailyGoal.preparationXp = nextGoalPreparationXp({ ...input, bucket, amount });
    bucket = JSON.parse(JSON.stringify(bucket));
    percentages.push(getLessonProgressPercent({ earnedXp: getGoalPreparationXp(bucket, blueprint) }, 20));
  }
  assert.deepEqual(percentages, [25, 35, 65, 100]);
  assert.equal(bucket.dailyGoal.preparationXp, 20);
  assert.equal(bucket.dailyGoal.completed, false);
  for (const change of [ { npub: "other" }, { targetLang: "fr" }, { dayKey: "2026-09-10" }, { lessonId: "normal-course" }, { amount: 0 } ]) {
    assert.equal(nextGoalPreparationXp({ ...input, bucket, amount: 5, ...change }), null);
  }
  bucket.activeGoal = { id: "replacement", status: "active" };
  assert.equal(nextGoalPreparationXp({ ...input, bucket, amount: 5 }), null);
  assert.equal(getGoalPreparationXp(bucket, { ...blueprint, goalId: "replacement" }), 0);
});
