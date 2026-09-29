import test from "node:test";
import assert from "node:assert/strict";
import { assessGeneratedQuestionWorth, assessGeneratedQuestionWorths, buildQuestionDifficultyPrompt, parseQuestionDifficulty } from "./questionDifficultyAssessment.js";
import { applyGradedOutcome, scoreToElo } from "./performanceEloModel.js";

const user = { learningIntelligence: { de: { elo: {
  rating: scoreToElo(46), scaleVersion: 4,
} } } };

test("Gemini's estimate of the actual item changes its frozen worth within one CEFR lesson", async () => {
  const easy = await assessGeneratedQuestionWorth({
    user, targetLang: "de", questionLevel: "B1", question: "Select Hallo",
    mode: "lesson", generateAssessment: async () => '{"difficultyScore":8}',
  });
  const hard = await assessGeneratedQuestionWorth({
    user, targetLang: "de", questionLevel: "B1", question: "Defend a nuanced argument",
    mode: "lesson", generateAssessment: async () => '{"difficultyScore":65}',
  });
  assert.equal(easy.questionLevel, "B1");
  assert.equal(easy.assessedQuestionLevel, "Pre-A1");
  assert.equal(hard.questionLevel, "B1");
  assert.equal(hard.assessedQuestionLevel, "B2");
  assert.equal(easy.difficultySource, "model_assessment");
  assert.equal(hard.difficultyScore, 65);
  assert.ok(hard.gainBySupport.independent > easy.gainBySupport.independent);
  assert.ok(easy.loss > hard.loss);
  const moved = { elo: { rating: scoreToElo(50), scaleVersion: 4 } };
  const graded = applyGradedOutcome(moved, {
    id: "hard-item", success: true, questionLevel: "B1", worth: hard,
  });
  assert.equal(graded.elo.rating, scoreToElo(50) + hard.gainBySupport.independent);
  assert.equal(graded.performanceSummary.byLevel.B2.correct, 1);
});

test("invalid or unavailable assessment is marked as a CEFR fallback", async () => {
  assert.equal(parseQuestionDifficulty('{"difficultyScore":101}'), null);
  assert.equal(parseQuestionDifficulty('{"difficultyScore":20.5}'), null);
  assert.equal(parseQuestionDifficulty('{"difficultyScore":null}'), null);
  const worth = await assessGeneratedQuestionWorth({
    user, targetLang: "de", questionLevel: "B1", question: "Hallo?",
    generateAssessment: async () => { throw new Error("offline"); },
  });
  assert.equal(worth.difficultySource, "cefr_fallback");
  assert.equal(worth.difficultyScore, null);
  assert.match(buildQuestionDifficultyPrompt({ question: "Hallo?", questionLevel: "B1" }),
    /actual language difficulty/);
});

test("one story assessment returns an independent quote for each sentence", async () => {
  let calls = 0;
  const worths = await assessGeneratedQuestionWorths({
    user, targetLang: "de", questionLevel: "B1", mode: "story",
    questions: ["Hallo.", "Explain why the policy changed."],
    generateAssessment: async () => {
      calls += 1;
      return '{"difficultyScores":[4,62]}';
    },
  });
  assert.equal(calls, 1);
  assert.equal(worths.length, 2);
  assert.equal(worths[0].assessedQuestionLevel, "Pre-A1");
  assert.equal(worths[1].assessedQuestionLevel, "B2");
  assert.ok(worths[0].loss > worths[1].loss);
});
