import assert from "node:assert/strict";
import test from "node:test";
import { SCORE_LEVEL_BANDS } from "./performanceEloModel.js";
import { getScoreMilestoneProgress, getScoreMilestoneWindow, SCORE_MILESTONES } from "./scoreMilestones.js";

test("the horizontal capability trail covers every Score band in order", () => {
  const scores = SCORE_MILESTONES.map((item) => item.score);
  assert.deepEqual(scores, [...new Set(scores)].sort((a, b) => a - b));
  assert.equal(scores[0], 1);
  assert.equal(scores.at(-1), 100);
  for (const milestone of SCORE_MILESTONES) {
    const [floor, ceiling] = SCORE_LEVEL_BANDS[milestone.level];
    assert.ok(milestone.score >= floor && milestone.score <= ceiling);
    assert.ok(milestone.modes.length > 0);
    assert.ok(milestone.en && milestone.es);
  }
  const modes = new Set(SCORE_MILESTONES.flatMap((item) => item.modes));
  for (const mode of ["lesson", "flashcards", "phonics", "tutor", "realtime", "reading", "stories", "game", "conversations"])
    assert.ok(modes.has(mode));
});

test("current and next landmarks follow the live Score", () => {
  assert.equal(getScoreMilestoneProgress(0).score, 0);
  assert.equal(getScoreMilestoneProgress(0).current, null);
  assert.equal(getScoreMilestoneProgress(0).next.score, 1);
  assert.equal(getScoreMilestoneProgress(1).current.score, 1);
  assert.equal(getScoreMilestoneProgress(1).next.score, 2);
  assert.equal(getScoreMilestoneProgress(32).reached[0].score, 1);
  assert.equal(getScoreMilestoneProgress(32).current.score, 32);
  assert.equal(getScoreMilestoneProgress(50).current.score, 49);
  assert.equal(getScoreMilestoneProgress(50).next.score, 53);
  assert.equal(getScoreMilestoneProgress(100).next, null);
  assert.equal(getScoreMilestoneProgress(900).score, 100);
});

test("the visible achievement window follows Score through the final milestone", () => {
  assert.deepEqual(getScoreMilestoneWindow(0).map((item) => item.score), [1, 2, 4]);
  assert.deepEqual(getScoreMilestoneWindow(50).map((item) => item.score), [46, 49, 53]);
  assert.deepEqual(getScoreMilestoneWindow(100).map((item) => item.score), [92, 96, 100]);
});
