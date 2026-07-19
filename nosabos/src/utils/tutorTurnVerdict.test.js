import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveTutorTurnVerdict,
  TUTOR_TURN_VERDICT,
} from "./tutorTurnVerdict.js";

test("accepts deterministic phrase matches without semantic grading", () => {
  assert.equal(
    resolveTutorTurnVerdict({ localSuccessful: true }),
    TUTOR_TURN_VERDICT.ACCEPTED,
  );
});

test("accepts a confident semantic success", () => {
  assert.equal(
    resolveTutorTurnVerdict({
      semanticAttempted: true,
      semanticSuccessful: true,
      semanticConfidence: 0.8,
    }),
    TUTOR_TURN_VERDICT.ACCEPTED,
  );
});

test("rejects only after a confident semantic decision", () => {
  assert.equal(
    resolveTutorTurnVerdict({
      semanticAttempted: true,
      semanticSuccessful: false,
      semanticConfidence: 0.8,
    }),
    TUTOR_TURN_VERDICT.REJECTED,
  );
  assert.equal(
    resolveTutorTurnVerdict({
      semanticAttempted: true,
      semanticSuccessful: false,
      semanticConfidence: 0.3,
    }),
    TUTOR_TURN_VERDICT.UNCERTAIN,
  );
});

test("keeps missing or failed semantic grading uncertain", () => {
  assert.equal(
    resolveTutorTurnVerdict(),
    TUTOR_TURN_VERDICT.UNCERTAIN,
  );
});
