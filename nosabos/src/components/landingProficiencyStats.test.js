import assert from "node:assert/strict";
import test from "node:test";
import { loadLearningPath } from "../data/skillTree/index.js";
import { TOTAL_FLASHCARDS } from "../data/flashcards/common.js";
import { LANDING_PROFICIENCY_LEVELS, LANDING_PROFICIENCY_STATS, LANDING_STANDALONE_PRACTICE_MODES } from "./landingProficiencyStats.js";

test("public proficiency counts match delivered English and Spanish curricula, including reviews", async () => {
  for (const language of ["en", "es"]) {
    const units = (await Promise.all(LANDING_PROFICIENCY_LEVELS.map(level => loadLearningPath(language, level)))).flat();
    const lessons = units.flatMap(unit => unit.lessons);
    assert.deepEqual({
      modules: units.length,
      lessonReviews: lessons.length,
      modes: new Set([...lessons.flatMap(lesson => lesson.modes), ...LANDING_STANDALONE_PRACTICE_MODES]).size,
      vocabularyCards: TOTAL_FLASHCARDS,
    }, LANDING_PROFICIENCY_STATS);
  }
});
