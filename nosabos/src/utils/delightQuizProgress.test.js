import test from "node:test";
import assert from "node:assert/strict";

import {
  getDelightQuizOutcome,
  normalizeDelightQuizProgress,
  serializeDelightQuizProgress,
} from "./delightQuizProgress.js";

const config = { questionsRequired: 10, passingScore: 8 };

test("delight quiz completes as soon as the passing score is reached", () => {
  const outcome = getDelightQuizOutcome(Array(8).fill(true), config);
  assert.equal(outcome.completed, true);
  assert.equal(outcome.passed, true);
});

test("delight quiz fails as soon as passing becomes impossible", () => {
  const outcome = getDelightQuizOutcome([false, false, false], config);
  assert.equal(outcome.completed, true);
  assert.equal(outcome.passed, false);
});

test("delight quiz persistence uses the legacy-compatible shape", () => {
  const saved = serializeDelightQuizProgress([true, false, true], config);
  assert.deepEqual(saved, {
    answered: 3,
    correct: 2,
    completed: false,
    passed: false,
    history: [true, false, true],
    currentAttempted: false,
  });

  assert.deepEqual(normalizeDelightQuizProgress(saved, config).history, [
    true,
    false,
    true,
  ]);
});
