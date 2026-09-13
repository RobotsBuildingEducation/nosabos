import test from "node:test";
import assert from "node:assert/strict";
import {
  PRACTICE_STORY_TURN_XP,
  claimPracticeStoryTurnReward,
} from "./practiceStoryRewards.js";

test("practice stories award two XP once for each completed turn", () => {
  const claimedTurns = new Set();

  assert.equal(claimPracticeStoryTurnReward(claimedTurns, "0::hola"), 2);
  assert.equal(claimPracticeStoryTurnReward(claimedTurns, "0::hola"), 0);
  assert.equal(claimPracticeStoryTurnReward(claimedTurns, "1::adios"), 2);
  assert.equal(claimedTurns.size * PRACTICE_STORY_TURN_XP, 4);
});
