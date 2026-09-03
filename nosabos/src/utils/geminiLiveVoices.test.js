import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_GEMINI_LIVE_VOICE,
  GEMINI_LIVE_VOICE_OPTIONS,
  getGeminiLiveVoiceOption,
} from "./geminiLiveVoices.js";

test("Gemini Tutor voices expose friendly frontend names without changing API IDs", () => {
  assert.equal(DEFAULT_GEMINI_LIVE_VOICE, "Sadachbia");
  assert.equal(getGeminiLiveVoiceOption().label, "Trey");
  assert.deepEqual(
    GEMINI_LIVE_VOICE_OPTIONS.map(({ value, label }) => [value, label]),
    [
      ["Zephyr", "Zephyr"],
      ["Sadachbia", "Trey"],
      ["Vindemiatrix", "Naomi"],
      ["Enceladus", "John"],
      ["Gacrux", "Chloe"],
      ["Algenib", "David"],
    ],
  );
  assert.equal(getGeminiLiveVoiceOption("Enceladus").label, "John");
  assert.deepEqual(
    GEMINI_LIVE_VOICE_OPTIONS.map(({ label, description }) => [
      label,
      description,
    ]),
    [
      ["Zephyr", "Bright"],
      ["Trey", "Chill"],
      ["Naomi", "Warm"],
      ["John", "Polished"],
      ["Chloe", "Gentle"],
      ["David", "Confident"],
    ],
  );
});
