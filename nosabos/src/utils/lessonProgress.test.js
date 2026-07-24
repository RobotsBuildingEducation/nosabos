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
