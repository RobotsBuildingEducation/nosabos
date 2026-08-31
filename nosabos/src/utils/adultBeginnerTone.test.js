import assert from "node:assert/strict";
import test from "node:test";

import { getAdultBeginnerToneRule } from "./adultBeginnerTone.js";

test("adult beginner guidance limits language without choosing a personality", () => {
  const rule = getAdultBeginnerToneRule("A0", "conversation");

  assert.match(rule, /controls language complexity and age-appropriateness only/);
  assert.match(rule, /does not choose the assistant's demeanor or personality/);
  assert.doesNotMatch(rule, /calm, socially normal/);
});
