import assert from "node:assert/strict";
import test from "node:test";

import {
  buildVoicePersonaPolicy,
  buildVoicePersonaReminder,
  normalizeVoicePersona,
} from "./voicePersonaPrompt.js";

test("persona policy makes the selected personality authoritative", () => {
  const policy = buildVoicePersonaPolicy("Rude and mean", "tutor");

  assert.match(policy, /The user chose this tutor personality: Rude and mean/);
  assert.match(policy, /greetings, praise, corrections, transitions/);
  assert.match(policy, /Preserve its defining attitude, intensity/);
  assert.match(policy, /controls demeanor: warmth, politeness, directness/);
  assert.match(policy, /Generic teaching-tone guidance must not replace/);
  assert.match(
    policy,
    /omit only that trait and preserve every other allowed aspect/,
  );
  assert.match(policy, /not lesson accuracy, language boundaries/);
  assert.doesNotMatch(policy, /must be friendly|must be rude|never be friendly/i);
});

test("persona reminder is compact and empty personas add no policy", () => {
  assert.equal(buildVoicePersonaPolicy("   "), "");
  assert.equal(buildVoicePersonaReminder(""), "");
  assert.match(
    buildVoicePersonaReminder("Dry and sarcastic"),
    /Follow this exact user-selected personality/,
  );
});

test("persona text is trimmed and capped before entering prompts", () => {
  const longPersona = `  ${"x".repeat(300)}  `;
  assert.equal(normalizeVoicePersona(longPersona).length, 240);
});
