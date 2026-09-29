import test from "node:test";
import assert from "node:assert/strict";
import {
  applyGradedOutcome,
  eloDelta,
  eloForUser,
  generationPerformanceContextFor,
  internalEloForUser,
  curriculumLevelsForUser,
  eloToScore,
  scoreToElo,
  performanceContextFor,
  practiceLevelForElo,
  questionWorthForUser,
  migrateLegacyEloRating,
  migrateScoreV2,
} from "./performanceEloModel.js";

test("an easier missed question costs more Score across CEFR levels", () => {
  const rating = scoreToElo(46); // B1 learner
  const a1Miss = eloDelta({ rating, questionLevel: "A1", success: false });
  const b1Miss = eloDelta({ rating, questionLevel: "B1", success: false });
  const c2Miss = eloDelta({ rating, questionLevel: "C2", success: false });
  assert.ok(a1Miss < b1Miss);
  assert.ok(b1Miss < c2Miss);
  assert.ok(c2Miss <= 0);
});

test("a harder correct answer gives more Elo than a same-level correct answer", () => {
  const rating = scoreToElo(18); // A1 starting estimate
  const a1Correct = eloDelta({ rating, questionLevel: "A1", success: true });
  const b1Correct = eloDelta({ rating, questionLevel: "B1", success: true });
  assert.ok(b1Correct > a1Correct);
  assert.ok(a1Correct > 0);
});

test("a question keeps its quoted Elo gain and loss after the learner rating changes", () => {
  const user = { learningIntelligence: { de: { elo: {
    rating: scoreToElo(18), scaleVersion: 4,
  } } } };
  const easy = questionWorthForUser(user, "de", "A1");
  const hard = questionWorthForUser(user, "de", "B1");
  assert.ok(hard.gainBySupport.independent > easy.gainBySupport.independent);
  assert.ok(easy.loss > hard.loss);
  assert.equal(hard.ratingAtGeneration, scoreToElo(18));
  const moved = { elo: { rating: scoreToElo(25), scaleVersion: 4 } };
  const next = applyGradedOutcome(moved, {
    id: "quoted", questionLevel: "B1", worth: hard, success: true,
  }, "A1");
  assert.equal(next.elo.rating, scoreToElo(25) + hard.gainBySupport.independent);
  const missed = applyGradedOutcome(moved, {
    id: "quoted-miss", questionLevel: "A1", worth: easy, success: false,
  }, "A1");
  assert.equal(missed.elo.rating, scoreToElo(25) - easy.loss);
});

test("curriculum positions stay separate while Elo is shared", () => {
  const user = { progress: { courseSummary: {
    skillTree: { levels: { pre_a1: { completed: 86 } } },
    flashcards: { levels: { pre_a1: { completed: 100 }, a1: { completed: 300 } } },
  } } };
  const levels = curriculumLevelsForUser(user, "de");
  assert.equal(levels.skillTree, "A1");
  assert.equal(levels.flashcards, "A2");
  assert.equal(levels.overall, "A2");
  const context = generationPerformanceContextFor(user, "de", { curriculumCefrLevel: "A1" });
  assert.equal(context.curriculumCefrLevel, "A1");
  assert.equal(context.curriculumLevels.flashcards, "A2");
});

test("independent success counts more than success after a model", () => {
  const independent = eloDelta({ rating: scoreToElo(32), questionLevel: "A2", success: true, support: "independent" });
  const modeled = eloDelta({ rating: scoreToElo(32), questionLevel: "A2", success: true, support: "modeled" });
  assert.ok(independent > modeled);
});

test("one per-language rating evolves across levels with bounded memory and idempotent events", () => {
  const initial = { learningIntelligence: {}, proficiencyPlacements: { de: "B1", es: "A1" } };
  assert.equal(eloForUser(initial, "de"), 46);
  assert.equal(eloForUser(initial, "es"), 18);
  assert.equal(eloForUser({ progress: { targetLang: "de", level: "Pre-A1" } }, "de"), 1);
  const first = applyGradedOutcome({}, {
    id: "question-1", success: false, questionLevel: "A1", mode: "lesson", concept: "greetings",
  }, "B1");
  const duplicate = applyGradedOutcome(first, {
    id: "question-1", success: false, questionLevel: "A1", mode: "lesson", concept: "greetings",
  }, "B1");
  assert.deepEqual(duplicate, first);
  const second = applyGradedOutcome(first, {
    id: "question-2", success: true, questionLevel: "C2", mode: "tutor", concept: "greetings",
  }, "B1");
  assert.equal(second.elo.totalGraded, 2);
  assert.equal(second.elo.scaleVersion, 4);
  assert.equal(second.performanceSummary.byLevel.A1.missed, 1);
  assert.equal(second.performanceSummary.byLevel.C2.correct, 1);
  assert.equal(second.performanceSummary.weakConcepts.length, 0);
  const context = performanceContextFor({ learningIntelligence: { de: second }, proficiencyPlacements: { de: "B1" } }, "de");
  assert.equal(context.score, eloToScore(second.elo.rating));
  assert.equal(context.eloRating, Math.round(second.elo.rating));
  assert.equal(context.curriculumCefrLevel, "B1");
  assert.equal(practiceLevelForElo(18), "A1");
  assert.equal(practiceLevelForElo(14), "Pre-A1");
  assert.equal(practiceLevelForElo(15), "A1");
});

test("legacy ratings migrate without losing graded history", () => {
  assert.equal(migrateLegacyEloRating(800), 1);
  assert.equal(migrateLegacyEloRating(1400), 46);
  const legacy = { elo: { rating: 1500, totalGraded: 3, recentEventIds: ["old"] } };
  assert.equal(eloForUser({ learningIntelligence: { de: legacy } }, "de"), 53);
  const next = applyGradedOutcome(legacy, { id: "new", success: true, questionLevel: "B1" }, "B1");
  assert.equal(next.elo.scaleVersion, 4);
  assert.equal(next.elo.totalGraded, 4);
  assert.equal(next.elo.recentEventIds[1], "old");
});

test("complete beginners start at zero and earn their first Score point", () => {
  const miss = applyGradedOutcome({ elo: { rating: 0, scaleVersion: 3 } },
    { id: "floor", success: false, questionLevel: "Pre-A1" }, "Pre-A1");
  assert.equal(miss.elo.rating, scoreToElo(0));
  const first = applyGradedOutcome(miss,
    { id: "first", success: true, questionLevel: "Pre-A1" }, "Pre-A1");
  assert.equal(eloToScore(first.elo.rating), 1);
  assert.equal(practiceLevelForElo(0), "Pre-A1");
});

test("freshly completed onboarding shows zero before a placement is saved", () => {
  const fresh = {
    onboarding: { completed: true }, xp: 0, streak: 0,
    progress: { targetLang: "en", level: "Pre-A1", xp: 0 },
  };
  assert.equal(eloForUser(fresh, "en"), 0);
  assert.equal(eloForUser({ ...fresh, proficiencyPlacements: { en: "Pre-A1" } }, "en"), 1);
  assert.equal(eloForUser({ ...fresh, xp: 20 }, "en"), 1);
  const oldBeginnerChoice = {
    elo: { rating: 1, scaleVersion: 3, initializedFrom: "self_report", totalGraded: 0 },
    selfAssessment: { selectedIds: [] },
  };
  assert.equal(eloForUser({ learningIntelligence: { en: oldBeginnerChoice } }, "en"), 0);
});

test("the full Pre-A1–C2 Score stays within 0–100", () => {
  assert.equal(practiceLevelForElo(84), "C1");
  assert.equal(practiceLevelForElo(85), "C2");
  const gain = applyGradedOutcome({ elo: { rating: 14, scaleVersion: 3 } },
    { id: "advance", success: true, questionLevel: "Pre-A1" }, "Pre-A1");
  assert.equal(practiceLevelForElo(eloToScore(gain.elo.rating)), "Pre-A1");
  const cap = applyGradedOutcome({ elo: { rating: 100, scaleVersion: 3 } },
    { id: "cap", success: true, questionLevel: "C2" }, "C2");
  assert.equal(cap.elo.rating, scoreToElo(100));
});

test("previous 1–700 Scores migrate within their CEFR band", () => {
  assert.equal(migrateScoreV2(1), 1);
  assert.equal(migrateScoreV2(100), 14);
  assert.equal(migrateScoreV2(101), 15);
  assert.equal(migrateScoreV2(325), 46);
  assert.equal(migrateScoreV2(700), 100);
  const saved = { elo: { rating: 475, scaleVersion: 2, totalGraded: 9, recentEventIds: ["old"] } };
  assert.equal(eloForUser({ learningIntelligence: { de: saved } }, "de"), 67);
  const next = applyGradedOutcome(saved, { id: "new", success: false, questionLevel: "A1" }, "B2");
  assert.equal(next.elo.scaleVersion, 4);
  assert.equal(next.elo.totalGraded, 10);
  assert.equal(next.elo.recentEventIds[1], "old");
});

test("fine grained Elo slows visible progression and preserves difficulty weighting", () => {
  let bucket = { elo: { rating: 46, scaleVersion: 3 } };
  for (let index = 0; index < 4; index += 1) {
    bucket = applyGradedOutcome(bucket, { id: `b1-${index}`, success: true, questionLevel: "B1" }, "B1");
  }
  assert.ok(eloToScore(bucket.elo.rating) <= 49);
  assert.ok(eloToScore(bucket.elo.rating) >= 47);
  assert.equal(bucket.elo.totalGraded, 4);
  const afterMiss = applyGradedOutcome(bucket, { id: "miss", success: false, questionLevel: "C2" }, "B1");
  assert.ok(afterMiss.elo.rating < bucket.elo.rating);
  assert.equal(eloToScore(afterMiss.elo.rating), eloToScore(bucket.elo.rating));
  const user = { learningIntelligence: { de: afterMiss } };
  assert.equal(internalEloForUser(user, "de"), afterMiss.elo.rating);
  assert.equal(eloForUser(user, "de"), eloToScore(afterMiss.elo.rating));
});

test("a CEFR-sized Score gain takes sustained independent practice", () => {
  let bucket = { elo: { rating: scoreToElo(46), scaleVersion: 4 } };
  let attempts = 0;
  while (eloToScore(bucket.elo.rating) < 57 && attempts < 300) {
    bucket = applyGradedOutcome(bucket, { id: `steady-${attempts}`, success: true, questionLevel: "B1" }, "B1");
    attempts += 1;
  }
  assert.ok(attempts >= 70 && attempts <= 150);
  assert.equal(eloToScore(bucket.elo.rating), 57);
  assert.equal(bucket.elo.totalGraded, attempts);
});

test("saved public Scores retain their number through the internal Elo migration", () => {
  for (const score of [0, 1, 3, 14, 15, 46, 53, 85, 100]) {
    const user = { learningIntelligence: { de: { elo: { rating: score, scaleVersion: 3 } } } };
    assert.equal(eloForUser(user, "de"), score);
    const bucket = applyGradedOutcome(user.learningIntelligence.de,
      { id: `migrate-${score}`, success: true, questionLevel: "C2" }, "B1");
    assert.equal(bucket.elo.scaleVersion, 4);
    assert.ok(bucket.elo.rating >= 800 && bucket.elo.rating <= 2200);
  }
});

test("generation receives compact Elo evidence without public Score or answer history", () => {
  const user = { proficiencyPlacements: { de: "B1" }, learningIntelligence: { de: {
    elo: { rating: scoreToElo(46), scaleVersion: 4 },
    performanceSummary: {
      recentResults: [1, 0, 1, 1],
      weakConcepts: Array.from({ length: 5 }, (_, index) => ({
        concept: `concept-${index}`, questionLevel: "A1", misses: index + 1,
        lastSeen: "2026-09-23T00:00:00.000Z",
      })),
      byLevel: { A1: { correct: 20, missed: 4 } },
    },
  } } };
  const context = generationPerformanceContextFor(user, "de");
  assert.equal(context.eloRating, Math.round(scoreToElo(46)));
  assert.equal(context.curriculumCefrLevel, "B1");
  assert.equal(context.recentAccuracy, 0.75);
  assert.equal(context.recentAccuracySampleCount, 4);
  assert.equal(context.weakConcepts.length, 3);
  assert.deepEqual(Object.keys(context.weakConcepts[0]), ["concept", "questionLevel", "misses"]);
  assert.equal("score" in context, false);
  assert.equal(context.byLevel.A1.correct, 20);
  assert.deepEqual(context.selfReportedStatements, []);
  assert.equal("ratingGuide" in context, false);
  assert.equal("recentResults" in context, false);
});
