import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanSpoken,
  cleanSubtext,
  splitDialogueSubtext,
  extractSpokenDialogue,
} from "./dialogueFormatting.js";

test("splitDialogueSubtext handles narration followed by single-quoted dialogue", () => {
  const input = "Yachiru looks up and says, 'I am Yachiru.'";
  const result = splitDialogueSubtext(input);
  assert.equal(result.subtext, "Yachiru looks up and says");
  assert.equal(result.spokenText, "I am Yachiru.");
});

test("splitDialogueSubtext handles narration followed by double-quoted dialogue", () => {
  const input = "Yachiru looks up and says, \"I am Yachiru.\"";
  const result = splitDialogueSubtext(input);
  assert.equal(result.subtext, "Yachiru looks up and says");
  assert.equal(result.spokenText, "I am Yachiru.");
});

test("splitDialogueSubtext handles leading italic stage direction", () => {
  const input = "*Yachiru smiles shyly after hearing your question.* Hello! My name is Yachiru.";
  const result = splitDialogueSubtext(input);
  assert.equal(result.subtext, "Yachiru smiles shyly after hearing your question.");
  assert.equal(result.spokenText, "Hello! My name is Yachiru.");
});

test("splitDialogueSubtext handles leading parentheses stage direction", () => {
  const input = "(looks up shyly) I am Yachiru.";
  const result = splitDialogueSubtext(input);
  assert.equal(result.subtext, "looks up shyly");
  assert.equal(result.spokenText, "I am Yachiru.");
});

test("splitDialogueSubtext handles narration with colon and no quotes", () => {
  const input = "Yachiru looks up and says: I am Yachiru.";
  const result = splitDialogueSubtext(input);
  assert.equal(result.subtext, "Yachiru looks up and says");
  assert.equal(result.spokenText, "I am Yachiru.");
});

test("splitDialogueSubtext handles trailing stage direction", () => {
  const input = "Hello there! *waves cheerfully*";
  const result = splitDialogueSubtext(input);
  assert.equal(result.subtext, "waves cheerfully");
  assert.equal(result.spokenText, "Hello there!");
});

test("splitDialogueSubtext handles pure dialogue with no subtext", () => {
  const input = "Hello! My name is Yachiru. It is very nice to meet you. What do you say?";
  const result = splitDialogueSubtext(input);
  assert.equal(result.subtext, "");
  assert.equal(result.spokenText, input);
});

test("splitDialogueSubtext unquotes cleanly wrapped quotes", () => {
  const input = "\"Just a normal quoted dialogue line.\"";
  const result = splitDialogueSubtext(input);
  assert.equal(result.subtext, "");
  assert.equal(result.spokenText, "Just a normal quoted dialogue line.");
});

test("extractSpokenDialogue extracts speech-only string for TTS", () => {
  const input = "Yachiru looks up and says, 'I am Yachiru.'";
  assert.equal(extractSpokenDialogue(input), "I am Yachiru.");
});
