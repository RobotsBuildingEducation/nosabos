import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceTutorAgendaProgress,
  advanceTutorQuizAttempt,
  getTutorAgendaSnapshot,
  isLegacyTutorAgendaProgress,
  normalizeTutorAgendaProgress,
} from "./tutorAgendaFlow.js";

const familyAgenda = [
  { id: "mama", phrase: "mamá" },
  { id: "papa", phrase: "papá" },
  { id: "brother", phrase: "hermano" },
  { id: "sister", phrase: "hermana" },
  { id: "family", phrase: "familia" },
];

test("regular agenda starts at the first ordered item", () => {
  const snapshot = getTutorAgendaSnapshot(familyAgenda, {});
  assert.equal(snapshot.phase, "teach");
  assert.equal(snapshot.currentItem.phrase, "mamá");
  assert.deepEqual(snapshot.completedItems, []);
});

test("one accepted answer advances exactly one ordered item", () => {
  const first = advanceTutorAgendaProgress(familyAgenda, {});
  assert.equal(first.advancedItem.phrase, "mamá");
  assert.equal(first.currentItem.phrase, "papá");

  const second = advanceTutorAgendaProgress(familyAgenda, first.progress);
  assert.equal(second.advancedItem.phrase, "papá");
  assert.equal(second.currentItem.phrase, "hermano");
});

test("agenda enters review only after every item is covered", () => {
  let progress = {};
  familyAgenda.forEach(() => {
    progress = advanceTutorAgendaProgress(familyAgenda, progress).progress;
  });

  const snapshot = getTutorAgendaSnapshot(familyAgenda, progress);
  assert.equal(snapshot.phase, "review");
  assert.equal(snapshot.currentItem, null);
  assert.equal(snapshot.isComplete, true);
  assert.equal(snapshot.completedItems.length, familyAgenda.length);
});

test("quiz answers advance once whether correct or incorrect", () => {
  const first = advanceTutorQuizAttempt(familyAgenda.slice(0, 3), {}, {}, {
    correct: false,
    passingScore: 2,
  });
  assert.equal(first.currentItem.id, "papa");
  assert.equal(first.score, 0);

  const second = advanceTutorQuizAttempt(
    familyAgenda.slice(0, 3),
    first.progress,
    first.correctItems,
    { correct: true, passingScore: 2 },
  );
  assert.equal(second.currentItem.id, "brother");
  assert.equal(second.score, 1);
});

test("a passed quiz retains completion while a failed quiz resets for a retake", () => {
  const items = familyAgenda.slice(0, 2);
  const first = advanceTutorQuizAttempt(items, {}, {}, {
    correct: true,
    passingScore: 1,
  });
  const passed = advanceTutorQuizAttempt(
    items,
    first.progress,
    first.correctItems,
    { correct: false, passingScore: 1 },
  );
  assert.equal(passed.passed, true);
  assert.equal(passed.isComplete, true);
  assert.equal(Object.keys(passed.progress).length, 2);

  const failedFirst = advanceTutorQuizAttempt(items, {}, {}, {
    correct: false,
    passingScore: 1,
  });
  const failed = advanceTutorQuizAttempt(
    items,
    failedFirst.progress,
    failedFirst.correctItems,
    { correct: false, passingScore: 1 },
  );
  assert.equal(failed.failed, true);
  assert.deepEqual(failed.progress, {});
  assert.deepEqual(failed.correctItems, {});
});

test("stale progress from another agenda is removed", () => {
  assert.deepEqual(
    normalizeTutorAgendaProgress(familyAgenda, {
      mama: true,
      unrelated: true,
      papa: false,
    }),
    { mama: true },
  );
});

test("unversioned and older Tutor agendas are recognized for full-XP migration", () => {
  assert.equal(isLegacyTutorAgendaProgress(undefined, 2), true);
  assert.equal(isLegacyTutorAgendaProgress(1, 2), true);
  assert.equal(isLegacyTutorAgendaProgress(2, 2), false);
  assert.equal(isLegacyTutorAgendaProgress(3, 2), false);
});
