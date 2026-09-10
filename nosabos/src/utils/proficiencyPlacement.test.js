import test from "node:test";
import assert from "node:assert/strict";

import {
  getHighestProficiencyPlacement,
  isHigherProficiencyPlacement,
} from "./proficiencyPlacement.js";

test("a proficiency retake never lowers the saved placement", () => {
  assert.equal(getHighestProficiencyPlacement("A2", "A1"), "A2");
  assert.equal(isHigherProficiencyPlacement("A1", "A2"), false);
});

test("a proficiency retake can raise the saved placement", () => {
  assert.equal(getHighestProficiencyPlacement("A1", "A2"), "A2");
  assert.equal(isHigherProficiencyPlacement("A2", "A1"), true);
});

test("a valid result replaces a skipped or missing placement", () => {
  assert.equal(getHighestProficiencyPlacement("skipped", "A1"), "A1");
  assert.equal(getHighestProficiencyPlacement(undefined, "Pre-A1"), "Pre-A1");
});

test("the highest server, local, and assessed placement wins", () => {
  assert.equal(getHighestProficiencyPlacement("A2", "B1", "A1"), "B1");
});
