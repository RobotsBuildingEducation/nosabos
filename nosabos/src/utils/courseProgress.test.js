import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCourseProgressSummary,
  getCourseLevelStats,
  getFlashcardLevelFromProgress,
  getProgressDocumentLevel,
  isCourseProgressSubscriptionReady,
  mergeCourseProgressSummaries,
  replaceProgressLevel,
  shouldSubscribeToCourseProgressMode,
  toCourseLevelKey,
} from "./courseProgress.js";

test("waits for account bootstrap before subscribing to progress slices", () => {
  assert.equal(
    isCourseProgressSubscriptionReady({
      isLoadingApp: true,
      userId: "npub-user",
      targetLang: "es",
    }),
    false,
  );
  assert.equal(
    isCourseProgressSubscriptionReady({
      isLoadingApp: false,
      userId: "npub-user",
      targetLang: "es",
    }),
    true,
  );
});

test("subscribes only to the progress slice for the visible learning mode", () => {
  assert.equal(
    shouldSubscribeToCourseProgressMode("plate", "skillTree"),
    false,
  );
  assert.equal(
    shouldSubscribeToCourseProgressMode("plate", "flashcards"),
    false,
  );
  assert.equal(
    shouldSubscribeToCourseProgressMode("path", "skillTree"),
    true,
  );
  assert.equal(
    shouldSubscribeToCourseProgressMode("path", "flashcards"),
    false,
  );
  assert.equal(
    shouldSubscribeToCourseProgressMode("flashcards", "flashcards"),
    true,
  );
  assert.equal(
    shouldSubscribeToCourseProgressMode("tutor", "tutor"),
    true,
  );
});

test("normalizes CEFR keys used by the compact summary", () => {
  assert.equal(toCourseLevelKey("Pre-A1"), "pre_a1");
  assert.equal(toCourseLevelKey("C1"), "c1");
});

test("infers levels from legacy lesson and flashcard progress", () => {
  assert.equal(
    getProgressDocumentLevel("skillTree", {
      lessonId: "lesson-a1-1-greetings",
    }),
    "Pre-A1",
  );
  assert.equal(
    getProgressDocumentLevel("skillTree", {
      lessonId: "unit-c1-2-game",
    }),
    "C1",
  );
  assert.equal(
    getFlashcardLevelFromProgress({}, "pre-a1-greeting-1"),
    "Pre-A1",
  );
  assert.equal(
    getFlashcardLevelFromProgress(
      { card: { cefrLevel: "B2" } },
      "repair-card",
    ),
    "B2",
  );
});

test("builds completion counts without storing individual progress", () => {
  const summary = buildCourseProgressSummary({
    targetLang: "es",
    languageLessons: [
      { lessonId: "lesson-a1-1-greetings", status: "completed" },
      { lessonId: "lesson-a1-3-numbers", status: "in_progress" },
      { lessonId: "unit-c1-2-game", status: "completed" },
    ],
    tutorLanguageLessons: [
      { lessonId: "lesson-a2-1-food", status: "completed" },
    ],
    languageFlashcards: [
      { cardId: "c1-work-1", completed: true },
      { cardId: "c1-work-2", completed: false },
      {
        cardId: "repair-card",
        completed: true,
        card: { cefrLevel: "C1" },
      },
    ],
  });

  assert.equal(
    getCourseLevelStats(summary, "skillTree", "Pre-A1").completed,
    1,
  );
  assert.equal(getCourseLevelStats(summary, "skillTree", "C1").completed, 1);
  assert.equal(getCourseLevelStats(summary, "tutor", "A2").completed, 1);
  assert.equal(getCourseLevelStats(summary, "flashcards", "C1").completed, 1);
  assert.equal(summary.migration.complete, true);
  assert.equal(JSON.stringify(summary).includes("lesson-a1"), false);
});

test("replaces only the hydrated level and preserves cached levels", () => {
  const existing = {
    "lesson-a1-1-greetings": {
      lessonId: "lesson-a1-1-greetings",
      status: "completed",
    },
    "lesson-c1-1-register": {
      lessonId: "lesson-c1-1-register",
      status: "in_progress",
    },
  };

  const next = replaceProgressLevel({
    existing,
    documents: [
      {
        id: "es_lesson-c1-1-register",
        data: () => ({
          lessonId: "lesson-c1-1-register",
          cefrLevel: "C1",
          status: "completed",
        }),
      },
    ],
    mode: "skillTree",
    level: "C1",
    idField: "lessonId",
  });

  assert.equal(next["lesson-a1-1-greetings"].status, "completed");
  assert.equal(next["lesson-c1-1-register"].status, "completed");
});

test("migration merging never loses a concurrent completion increment", () => {
  const calculated = buildCourseProgressSummary({ targetLang: "es" });
  const stored = {
    targetLang: "es",
    skillTree: {
      levels: {
        c1: { completed: 2, total: 70 },
      },
    },
  };

  const merged = mergeCourseProgressSummaries(calculated, stored);
  assert.equal(getCourseLevelStats(merged, "skillTree", "C1").completed, 2);
  assert.equal(merged.migration.complete, true);
});
