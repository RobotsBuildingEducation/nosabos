import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { goalCopy } from "../utils/learningGoalCopy.js";
import {
  changeGoal,
  activeGoalFor,
} from "../utils/learningIntelligenceModel.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supportedLanguages = [
  "en",
  "es",
  "pt",
  "fr",
  "it",
  "de",
  "ja",
  "zh",
  "ru",
  "ar",
  "hi",
];

test("goalCopy provides label and example for every supported language", () => {
  for (const lang of supportedLanguages) {
    const copy = goalCopy(lang);
    assert.ok(copy.label, `label missing for ${lang}`);
    assert.ok(copy.example, `example missing for ${lang}`);
  }
});

test("learning goal text entry creates and updates active goal", () => {
  const initial = {};
  const goal1 = changeGoal(initial, {
    text: "talk to my grandmother",
    id: "uuid-1",
  });
  assert.equal(goal1.activeGoal?.text, "talk to my grandmother");
  assert.equal(goal1.activeGoal?.id, "uuid-1");

  // Subsequent typing with trailing space keeps same goal ID
  const goal2 = changeGoal(goal1, {
    text: "talk to my grandmother ",
    id: "uuid-2",
  });
  assert.equal(goal2.activeGoal?.text, "talk to my grandmother");
  assert.equal(goal2.activeGoal?.id, "uuid-1");
});

test("clearing learning goal text removes active goal", () => {
  const initial = {
    activeGoal: {
      id: "uuid-1",
      text: "talk to my grandmother",
      status: "active",
    },
  };
  const updated = changeGoal(initial, { text: "", id: "uuid-2" });
  assert.equal(updated.activeGoal, null);
  assert.equal(activeGoalFor({ learningIntelligence: { es: updated } }, "es"), null);

  // Whitespace only also clears
  const updatedWhitespace = changeGoal(initial, { text: "   ", id: "uuid-3" });
  assert.equal(updatedWhitespace.activeGoal, null);
});

test("LearningGoalSettings component has no action buttons or button container", () => {
  const source = readFileSync(
    resolve(__dirname, "LearningGoalSettings.jsx"),
    "utf-8",
  );
  // Ensure Button, HStack, and GOAL_ACTION_BUTTON_PROPS are completely removed
  assert.ok(!source.includes("<Button"), "Buttons should be removed");
  assert.ok(!source.includes("<HStack"), "HStack button container should be removed");
  assert.ok(!source.includes("GOAL_ACTION_BUTTON_PROPS"), "GOAL_ACTION_BUTTON_PROPS should be removed");
  assert.ok(!source.includes("copy.save}"), "copy.save button should be removed");
  assert.ok(!source.includes("copy.pause"), "copy.pause button should be removed");
  assert.ok(!source.includes("copy.resume"), "copy.resume button should be removed");
  assert.ok(!source.includes("copy.achieve"), "copy.achieve button should be removed");
  assert.ok(!source.includes("copy.clear"), "copy.clear button should be removed");
  assert.ok(source.includes("debounceRef"), "Debounce timer ref must be present");
});

test("saved text is localized for every supported language", () => {
  for (const lang of supportedLanguages) {
    const copy = goalCopy(lang);
    assert.ok(copy.saved, `saved copy missing for ${lang}`);
    assert.notEqual(copy.saved.trim(), "", `saved copy empty for ${lang}`);
  }
});

test("LearningGoalSettings renders localized saved indicator with 3-second auto-dismiss", () => {
  const source = readFileSync(
    resolve(__dirname, "LearningGoalSettings.jsx"),
    "utf-8",
  );
  assert.ok(source.includes("showSaved"), "showSaved state must be present");
  assert.ok(source.includes("3000"), "3-second dismiss timeout must be configured");
  assert.ok(source.includes("copy.saved"), "copy.saved text must be rendered");
  assert.ok(source.includes('textAlign="right"'), "Saved indicator must be right-aligned");
});

test("VoicePreferenceField renders localized saved indicator with 3-second auto-dismiss", () => {
  const source = readFileSync(
    resolve(__dirname, "VoicePreferenceField.jsx"),
    "utf-8",
  );
  assert.ok(source.includes("showPersonaSaved"), "showPersonaSaved state must be present");
  assert.ok(source.includes("3000"), "3-second dismiss timeout must be configured");
  assert.ok(source.includes("savedPersonaLabel"), "savedPersonaLabel text must be rendered");
  assert.ok(source.includes('textAlign="right"'), "Saved indicator must be right-aligned");
});

test("LearningGoalSettings matches settings card UI styling", () => {
  const source = readFileSync(
    resolve(__dirname, "LearningGoalSettings.jsx"),
    "utf-8",
  );
  assert.ok(source.includes('bg="gray.800"'), "Goal section must have bg=gray.800 card styling");
  assert.ok(source.includes('rounded="md"'), "Goal section must have rounded=md styling");
  assert.ok(source.includes('bg={textareaBg}'), "Textarea must use textareaBg background styling");
});


