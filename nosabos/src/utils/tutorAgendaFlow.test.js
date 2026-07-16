import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceTutorAgendaProgress,
  getTutorAgendaSnapshot,
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
