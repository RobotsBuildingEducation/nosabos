import test from "node:test";
import assert from "node:assert/strict";

import {
  getTutorLessonLaunchMode,
  TUTOR_LESSON_LAUNCH_MODE,
} from "./tutorLessonLaunch.js";

test("Tutor routes generated Game Reviews to the RPG modality", () => {
  assert.equal(
    getTutorLessonLaunchMode({
      tutorPurpose: "rpg_game",
      isGame: true,
      modes: ["game"],
    }),
    TUTOR_LESSON_LAUNCH_MODE.RPG_GAME,
  );
});

test("Tutor keeps ordinary, review, integrated, and quiz lessons in voice", () => {
  [
    { tutorPurpose: "instruction", modes: ["realtime"] },
    { tutorPurpose: "targeted_review", modes: ["grammar", "vocabulary"] },
    { tutorPurpose: "integrated_scenario", modes: ["realtime"] },
    { isFinalQuiz: true, modes: ["grammar", "vocabulary"] },
  ].forEach((lesson) => {
    assert.equal(
      getTutorLessonLaunchMode(lesson),
      TUTOR_LESSON_LAUNCH_MODE.VOICE,
    );
  });
});
