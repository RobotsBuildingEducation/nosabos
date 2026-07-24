import test from "node:test";
import assert from "node:assert/strict";

import {
  getRandomHistoryXp,
  HISTORY_XP_MAX,
  HISTORY_XP_MIN,
} from "./historyXp.js";

test("History XP maps random rolls to inclusive integer awards from 5 through 8", () => {
  assert.equal(getRandomHistoryXp(() => 0), 5);
  assert.equal(getRandomHistoryXp(() => 0.249999), 5);
  assert.equal(getRandomHistoryXp(() => 0.25), 6);
  assert.equal(getRandomHistoryXp(() => 0.5), 7);
  assert.equal(getRandomHistoryXp(() => 0.75), 8);
  assert.equal(getRandomHistoryXp(() => 0.999999), 8);
});

test("History XP safely clamps unusual random sources", () => {
  assert.equal(getRandomHistoryXp(() => -1), HISTORY_XP_MIN);
  assert.equal(getRandomHistoryXp(() => 1), HISTORY_XP_MAX);
  assert.equal(getRandomHistoryXp(() => Number.NaN), HISTORY_XP_MIN);
});
