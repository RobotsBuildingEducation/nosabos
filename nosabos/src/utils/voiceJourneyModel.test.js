import test from "node:test";
import assert from "node:assert/strict";
import { canRecordJourneyMilestone, completeJourneyQuest, isJourneyMilestoneExpired, JOURNEY_MILESTONES, journeyBaseline, journeySessionCount, pendingJourneyMilestone } from "./voiceJourneyModel.js";

test("only the requested milestones unlock, including all long-term sessions", () => {
  let state = {};
  for (let session = 1; session <= 151; session++) {
    state = completeJourneyQuest(state, false, `session-${session}`);
    assert.equal(journeySessionCount(state), session);
    assert.deepEqual(Object.keys(state.unlockedAt).map(Number), JOURNEY_MILESTONES.filter(value => value <= session));
    const activeMilestone = JOURNEY_MILESTONES.findLast(m => m <= session);
    for (const milestone of JOURNEY_MILESTONES) {
      assert.equal(canRecordJourneyMilestone(state, milestone), milestone === activeMilestone);
    }
  }
  assert.equal(state.unlockedAt[1], "session-1");
  assert.equal(state.unlockedAt[150], "session-150");
  assert.equal(canRecordJourneyMilestone(state, 2), false);
});

test("previous unsaved milestones expire and lock when a new milestone is unlocked", () => {
  // Session 1 remains unlocked and recordable through sessions 1-4
  for (let session = 1; session <= 4; session++) {
    const state = { completedQuests: session };
    assert.equal(isJourneyMilestoneExpired(state, 1), false);
    assert.equal(canRecordJourneyMilestone(state, 1), true);
  }

  // By the time session 5 is unlocked, if session 1 hasn't been saved, it expires/locks
  const unsavedAt5 = { completedQuests: 5 };
  assert.equal(isJourneyMilestoneExpired(unsavedAt5, 1), true);
  assert.equal(canRecordJourneyMilestone(unsavedAt5, 1), false);
  // Session 5 is now the active recordable milestone
  assert.equal(isJourneyMilestoneExpired(unsavedAt5, 5), false);
  assert.equal(canRecordJourneyMilestone(unsavedAt5, 5), true);

  // But if session 1 WAS saved, it does NOT expire
  const savedAt5 = { completedQuests: 5, recordings: { 1: { capturedSession: 1 } } };
  assert.equal(isJourneyMilestoneExpired(savedAt5, 1), false);
  assert.equal(canRecordJourneyMilestone(savedAt5, 1), false); // already recorded
  assert.equal(canRecordJourneyMilestone(savedAt5, 5), true);

  // Session 5 remains recordable through sessions 5-14
  for (let session = 5; session <= 14; session++) {
    const state = { completedQuests: session };
    assert.equal(isJourneyMilestoneExpired(state, 5), false);
    assert.equal(canRecordJourneyMilestone(state, 5), true);
  }

  // At session 15, unsaved session 5 expires
  const unsavedAt15 = { completedQuests: 15 };
  assert.equal(isJourneyMilestoneExpired(unsavedAt15, 5), true);
  assert.equal(canRecordJourneyMilestone(unsavedAt15, 5), false);
  assert.equal(canRecordJourneyMilestone(unsavedAt15, 15), true);
});

test("duplicate completion receipts preserve counts and recordings", () => {
  const original = { completedQuests: 5, recordings: { 1: { capturedSession: 1 } } };
  assert.equal(completeJourneyQuest(original, true), original);
  assert.deepEqual(completeJourneyQuest(original).recordings, original.recordings);
});

test("dismissal stops repeat prompts while unsaved skipped milestones expire", () => {
  const state = { completedQuests: 15, lastPromptedMilestone: 5 };
  assert.equal(pendingJourneyMilestone(state), 15);
  assert.equal(pendingJourneyMilestone({ ...state, lastPromptedMilestone: 15 }), null);
  assert.equal(canRecordJourneyMilestone(state, 1), false);
  assert.equal(canRecordJourneyMilestone(state, 15), true);
  assert.equal(pendingJourneyMilestone({ ...state, recordings: { 15: {} } }), null);
  assert.equal(pendingJourneyMilestone({ completedQuests: 5, recordings: { 5: {} } }), null);
});

test("the earliest retained milestone supplies the comparison baseline", () => {
  assert.equal(journeyBaseline({}), null);
  assert.equal(journeyBaseline({ recordings: { 30: {}, 5: {} } }), 5);
  assert.equal(journeyBaseline({ recordings: { 1: {}, 5: {} } }), 1);
  assert.equal(journeyBaseline({ recordings: { 1: { createdAt: "2026-10-01" }, 5: { createdAt: "2026-09-01" } } }), 5);
});
