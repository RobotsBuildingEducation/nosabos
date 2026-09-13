import test from "node:test";
import assert from "node:assert/strict";
import {
  DAILY_QUEST_FLASHCARD_TARGET_DEFAULT,
  DAILY_QUEST_FLASHCARD_TARGET_MAX,
  DAILY_QUEST_FLASHCARD_TARGET_MIN,
  getDailyQuestFlashcardTarget,
  getFlashcardDailyTarget,
} from "./dailyQuestTargets.js";

test("daily quest flashcard targets stay stable for a learner, language, and day", () => {
  const input = {
    userKey: "npub-test-learner",
    langKey: "es",
    dayKey: "2026-07-23",
  };

  assert.equal(
    getDailyQuestFlashcardTarget(input),
    getDailyQuestFlashcardTarget(input),
  );
});

test("daily quest flashcard targets use the evenly distributed 4-6 range", () => {
  const counts = {
    [DAILY_QUEST_FLASHCARD_TARGET_MIN]: 0,
    [DAILY_QUEST_FLASHCARD_TARGET_DEFAULT]: 0,
    [DAILY_QUEST_FLASHCARD_TARGET_MAX]: 0,
  };

  for (let day = 0; day < 400; day += 1) {
    const target = getDailyQuestFlashcardTarget({
      userKey: `npub-${day % 17}`,
      langKey: day % 2 === 0 ? "es" : "fr",
      dayKey: `day-${day}`,
    });
    assert.ok(target >= DAILY_QUEST_FLASHCARD_TARGET_MIN);
    assert.ok(target <= DAILY_QUEST_FLASHCARD_TARGET_MAX);
    counts[target] += 1;
  }

  Object.values(counts).forEach((count) => {
    assert.ok(count >= 100);
    assert.ok(count <= 165);
  });
});

test("getFlashcardDailyTarget uses Today's Focus target when flashcards are included", () => {
  const plateSnapshotWithReview = {
    dayKey: "2026-09-12",
    langKey: "es",
    courses: [
      { kind: "speak", target: 1 },
      { kind: "review", target: 5 },
    ],
    byKind: {
      speak: { kind: "speak", target: 1 },
      review: { kind: "review", target: 5 },
    },
  };

  assert.equal(
    getFlashcardDailyTarget({ plateSnapshot: plateSnapshotWithReview }),
    5,
  );
});

test("getFlashcardDailyTarget returns random between 3-7 when Today's Focus does not include flashcards", () => {
  const plateSnapshotWithoutReview = {
    dayKey: "2026-09-12",
    langKey: "es",
    courses: [
      { kind: "speak", target: 1 },
      { kind: "learn", target: 1 },
      { kind: "conversation", target: 4 },
    ],
    byKind: {
      speak: { kind: "speak", target: 1 },
      learn: { kind: "learn", target: 1 },
      conversation: { kind: "conversation", target: 4 },
    },
  };

  const target = getFlashcardDailyTarget({
    plateSnapshot: plateSnapshotWithoutReview,
    userKey: "user-test",
    langKey: "es",
  });
  assert.ok(target >= 3 && target <= 7, `Expected target ${target} to be between 3 and 7`);

  // Target stays stable for the same user, language, and day
  assert.equal(
    getFlashcardDailyTarget({
      plateSnapshot: plateSnapshotWithoutReview,
      userKey: "user-test",
      langKey: "es",
    }),
    target,
  );

  // Over 500 samples, all values from 3 to 7 are generated
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const rolled = getFlashcardDailyTarget({
      userKey: `user-${i}`,
      langKey: "es",
      dayKey: `2026-09-${(i % 30) + 1}`,
    });
    assert.ok(rolled >= 3 && rolled <= 7);
    seen.add(rolled);
  }
  assert.deepEqual([...seen].sort(), [3, 4, 5, 6, 7]);
});

