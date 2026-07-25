import test from "node:test";
import assert from "node:assert/strict";

import { createUnitRenderProgressSelector } from "./skillTreeRenderProgress.js";

const UNITS = [
  { id: "unit-1", lessons: [{ id: "lesson-1" }, { id: "lesson-2" }] },
  { id: "unit-2", lessons: [{ id: "lesson-3" }] },
  { id: "unit-3", lessons: [{ id: "lesson-4" }] },
];

test("preserves untouched unit render props when one lesson changes", () => {
  const select = createUnitRenderProgressSelector();
  const first = select(UNITS, {});
  const second = select(UNITS, {
    "lesson-1": { status: "in_progress", earnedXp: 5 },
  });

  assert.notEqual(second[0], first[0]);
  assert.equal(second[1], first[1]);
  assert.equal(second[2], first[2]);
});

test("updates the following unit when the previous boundary unlocks", () => {
  const select = createUnitRenderProgressSelector();
  const first = select(UNITS, {});
  const second = select(UNITS, {
    "lesson-2": { status: "completed", earnedXp: 60 },
  });

  assert.notEqual(second[0], first[0]);
  assert.notEqual(second[1], first[1]);
  assert.equal(second[2], first[2]);
  assert.equal(second[1].previousUnitLastLessonStatus, "completed");
});

test("ignores progress fields that do not affect skill-tree rendering", () => {
  const select = createUnitRenderProgressSelector();
  const first = select(UNITS, {
    "lesson-1": { status: "in_progress", earnedXp: 5, updatedAt: "one" },
  });
  const second = select(UNITS, {
    "lesson-1": { status: "in_progress", earnedXp: 5, updatedAt: "two" },
  });

  assert.equal(second[0], first[0]);
});
