import test from "node:test";
import assert from "node:assert/strict";
import { canRecordJourneyMilestone, completeJourneyQuest, JOURNEY_MILESTONES, journeyBaseline, journeySessionCount, pendingJourneyMilestone } from "./voiceJourneyModel.js";

test("only the requested milestones unlock, including all long-term sessions", () => {
  let state = {};
  for (let session = 1; session <= 151; session++) {
    state = completeJourneyQuest(state, false, `session-${session}`);
    assert.equal(journeySessionCount(state), session);
    assert.deepEqual(Object.keys(state.unlockedAt).map(Number), JOURNEY_MILESTONES.filter(value => value <= session));
    for (const milestone of JOURNEY_MILESTONES) assert.equal(canRecordJourneyMilestone(state, milestone), milestone <= session);
  }
  assert.equal(state.unlockedAt[1], "session-1");
  assert.equal(state.unlockedAt[150], "session-150");
  assert.equal(canRecordJourneyMilestone(state, 2), false);
});

test("duplicate completion receipts preserve counts and recordings", () => {
  const original = { completedQuests: 5, recordings: { 1: { capturedSession: 1 } } };
  assert.equal(completeJourneyQuest(original, true), original);
  assert.deepEqual(completeJourneyQuest(original).recordings, original.recordings);
});

test("dismissal stops repeat prompts while keeping skipped milestones recordable", () => {
  const state = { completedQuests: 15, lastPromptedMilestone: 5 };
  assert.equal(pendingJourneyMilestone(state), 15);
  assert.equal(pendingJourneyMilestone({ ...state, lastPromptedMilestone: 15 }), null);
  assert.equal(canRecordJourneyMilestone(state, 1), true);
  assert.equal(pendingJourneyMilestone({ ...state, recordings: { 15: {} } }), null);
  assert.equal(pendingJourneyMilestone({ completedQuests: 5, recordings: { 5: {} } }), null);
});

test("the earliest retained milestone supplies the comparison baseline", () => {
  assert.equal(journeyBaseline({}), null);
  assert.equal(journeyBaseline({ recordings: { 30: {}, 5: {} } }), 5);
  assert.equal(journeyBaseline({ recordings: { 1: {}, 5: {} } }), 1);
  assert.equal(journeyBaseline({ recordings: { 1: { createdAt: "2026-10-01" }, 5: { createdAt: "2026-09-01" } } }), 5);
});
