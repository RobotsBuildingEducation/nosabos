import { test } from "node:test";
import assert from "node:assert/strict";
import { isFullNavigationSkillTreeMode } from "./activityControls.js";

test("lessons skill tree ('path') uses the full bottom navigation bar", () => {
  assert.equal(isFullNavigationSkillTreeMode("skillTree", "path"), true);
});

test("today's focus ('plate') and flashcards use the full bottom navigation bar", () => {
  assert.equal(isFullNavigationSkillTreeMode("skillTree", "plate"), true);
  assert.equal(isFullNavigationSkillTreeMode("skillTree", "flashcards"), true);
});

test("skill tree activities (phonics, conversations, tutor) do not use full navigation", () => {
  assert.equal(isFullNavigationSkillTreeMode("skillTree", "alphabet"), false);
  assert.equal(isFullNavigationSkillTreeMode("skillTree", "conversations"), false);
  assert.equal(isFullNavigationSkillTreeMode("skillTree", "tutor"), false);
});

test("active lesson views do not use full navigation regardless of pathMode", () => {
  assert.equal(isFullNavigationSkillTreeMode("lesson", "path"), false);
  assert.equal(isFullNavigationSkillTreeMode("lesson", "plate"), false);
  assert.equal(isFullNavigationSkillTreeMode("lesson", "flashcards"), false);
});
