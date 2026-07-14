import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDailyXpRecent,
  computeGoalStreak,
  monthKeyFromDayKey,
  pruneActivityProgress,
  pruneDayEntries,
  shiftDayKey,
} from "./userDataSchema.js";

test("month keys are derived from local calendar day keys", () => {
  assert.equal(monthKeyFromDayKey("2026-07-13"), "2026-07");
  assert.equal(monthKeyFromDayKey("not-a-day"), "");
});

test("day shifting remains calendar-safe across month boundaries", () => {
  assert.equal(shiftDayKey("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftDayKey("2024-03-01", -1), "2024-02-29");
  assert.equal(shiftDayKey("2026-12-31", 1), "2027-01-01");
});

test("recent maps retain exactly the inclusive 14-day window", () => {
  const days = {};
  for (let day = 1; day <= 20; day += 1) {
    days[`2026-07-${String(day).padStart(2, "0")}`] = day;
  }
  const pruned = pruneDayEntries(days, "2026-07-20");
  assert.deepEqual(Object.keys(pruned), [
    "2026-07-07",
    "2026-07-08",
    "2026-07-09",
    "2026-07-10",
    "2026-07-11",
    "2026-07-12",
    "2026-07-13",
    "2026-07-14",
    "2026-07-15",
    "2026-07-16",
    "2026-07-17",
    "2026-07-18",
    "2026-07-19",
    "2026-07-20",
  ]);
  assert.deepEqual(buildDailyXpRecent(days, "2026-07-20"), pruned);
});

test("activity pruning removes old days and stale root progress collections", () => {
  const progress = pruneActivityProgress(
    {
      languageLessons: { es: { old: true } },
      languageFlashcards: { es: { old: true } },
      lessonDailyActivity: {
        es: { "2026-06-01": 1, "2026-07-13": 2 },
      },
      languageXp: { es: 500 },
    },
    "2026-07-13",
  );
  assert.equal(progress.languageLessons, undefined);
  assert.equal(progress.languageFlashcards, undefined);
  assert.deepEqual(progress.lessonDailyActivity.es, { "2026-07-13": 2 });
  assert.deepEqual(progress.languageXp, { es: 500 });
});

test("goal streaks count consecutive goal days ending at the latest goal", () => {
  assert.deepEqual(
    computeGoalStreak([
      "2026-07-01",
      "2026-07-03",
      "2026-07-04",
      "2026-07-05",
    ]),
    { goalStreakCount: 3, lastGoalDayKey: "2026-07-05" },
  );
  assert.deepEqual(computeGoalStreak([]), {
    goalStreakCount: 0,
    lastGoalDayKey: "",
  });
});
