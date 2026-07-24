import test from "node:test";
import assert from "node:assert/strict";
import {
  DAILY_QUEST_FLASHCARD_TARGET_DEFAULT,
  DAILY_QUEST_FLASHCARD_TARGET_MAX,
  DAILY_QUEST_FLASHCARD_TARGET_MIN,
  getDailyQuestFlashcardTarget,
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
