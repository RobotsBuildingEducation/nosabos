import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_OPENAI_TUTOR_VOICE,
  OPENAI_TUTOR_VOICE_VALUES,
  normalizeOpenAITutorVoice,
} from "./openaiTutorVoices.js";

test("only the native-safe new-generation pair is allowed", () => {
  assert.deepEqual([...OPENAI_TUTOR_VOICE_VALUES].sort(), ["cedar", "marin"]);
  assert.ok(OPENAI_TUTOR_VOICE_VALUES.includes(DEFAULT_OPENAI_TUTOR_VOICE));
});

test("new-generation voices pass through unchanged", () => {
  assert.equal(normalizeOpenAITutorVoice("marin"), "marin");
  assert.equal(normalizeOpenAITutorVoice("cedar"), "cedar");
  assert.equal(normalizeOpenAITutorVoice("  Cedar "), "cedar");
});

test("stored legacy voices migrate within the same vocal register", () => {
  // Boy-register legacy voices → cedar (alloy was the original app default,
  // and the worst code-switcher — "meee llamo").
  for (const legacy of ["alloy", "ash", "ballad", "echo", "verse"]) {
    assert.equal(normalizeOpenAITutorVoice(legacy), "cedar");
  }
  // Girl-register legacy voices → marin.
  for (const legacy of ["coral", "sage", "shimmer"]) {
    assert.equal(normalizeOpenAITutorVoice(legacy), "marin");
  }
});

test("Gemini-era and unknown names fall back to the default", () => {
  assert.equal(normalizeOpenAITutorVoice("Leda"), DEFAULT_OPENAI_TUTOR_VOICE);
  assert.equal(normalizeOpenAITutorVoice(""), DEFAULT_OPENAI_TUTOR_VOICE);
  assert.equal(normalizeOpenAITutorVoice(null), DEFAULT_OPENAI_TUTOR_VOICE);
  assert.equal(
    normalizeOpenAITutorVoice(undefined),
    DEFAULT_OPENAI_TUTOR_VOICE,
  );
});
