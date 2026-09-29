import assert from "node:assert/strict";
import test from "node:test";
import {
  adaptIntroTutorialUnit,
  INTRO_TUTORIAL_LESSON_ID,
  needsIntroTutorial,
} from "./introTutorial.js";
import { getLatestUnlockedLesson, loadMultiLevelLearningPath } from "../data/skillTree/index.js";
import { buildGameReviewContext } from "./gameReviewContext.js";
import { getLessonLevelFromId } from "./cefrProgress.js";

test("advanced first quest puts the Pre-A1 tutorial before the placed level", async () => {
  const units = await loadMultiLevelLearningPath("de", ["B1"], {
    introTutorialLevel: "B1",
  });
  const tutorial = units[0].lessons[0];

  assert.equal(units[0].id, "unit-tutorial-pre-a1");
  assert.equal(units[0].cefrLevel, "B1");
  assert.equal(tutorial.id, INTRO_TUTORIAL_LESSON_ID);
  assert.equal(tutorial.isTutorial, true);
  assert.deepEqual(tutorial.modes, [
    "vocabulary", "grammar", "reading", "stories", "realtime", "game",
  ]);
  assert.equal(tutorial.content.reading.cefrLevel, "B1");
  assert.equal(tutorial.content.game.topic, "tutorial");
  assert.match(tutorial.content.realtime.prompt, /CEFR B1/);
  assert.notEqual(tutorial.content.vocabulary.topic, "tutorial");
  assert.equal(units[1].cefrLevel, "B1");
  assert.equal(getLatestUnlockedLesson(units, {})?.lesson.id, INTRO_TUTORIAL_LESSON_ID);
  assert.equal(getLessonLevelFromId(tutorial.id), "Pre-A1");

  const review = buildGameReviewContext({
    lesson: tutorial,
    unit: units[0],
    targetLang: "de",
  });
  assert.equal(review.cefrLevel, "B1");
  assert.match(review.curriculumSummary, /CEFR B1/);
  assert.equal(review.reviewObjectives.some((goal) => /basic greetings|goodbyes/.test(goal)), false);
});

test("completion and older accounts do not get a new introductory lesson", async () => {
  assert.equal(needsIntroTutorial({ level: "B1", hasFirstQuestHistory: false }), false);
  assert.equal(needsIntroTutorial({ level: "Pre-A1", hasFirstQuestHistory: true }), false);
  assert.equal(needsIntroTutorial({
    level: "B1",
    hasFirstQuestHistory: true,
    lessons: { [INTRO_TUTORIAL_LESSON_ID]: { status: "completed" } },
  }), false);
  assert.equal(needsIntroTutorial({ level: "B1", hasFirstQuestHistory: true }), true);

  const units = await loadMultiLevelLearningPath("de", ["B1"]);
  assert.notEqual(units[0].id, "unit-tutorial-pre-a1");
});

test("Pre-A1 tutorial source remains unchanged after adaptation", async () => {
  const [source] = await loadMultiLevelLearningPath("de", ["Pre-A1"]);
  const adapted = adaptIntroTutorialUnit(source, "C1");
  assert.equal(source.lessons[0].content.vocabulary.topic, "tutorial");
  assert.equal(adapted.lessons[0].content.vocabulary.cefrLevel, "C1");
  assert.equal(adapted.lessons[0].content.game.sceneId, source.lessons[0].content.game.sceneId);
});
