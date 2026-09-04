import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_GEMINI_LIVE_VOICE,
  GEMINI_LIVE_VOICE_OPTIONS,
  getGeminiLiveVoiceOption,
  getGeminiLiveVoiceDescription,
  normalizeGeminiLiveVoice,
} from "./geminiLiveVoices.js";

test("Gemini Live voices expose Naomi (default), Michael, John, and Zephyr labels with correct API IDs", () => {
  assert.equal(DEFAULT_GEMINI_LIVE_VOICE, "Vindemiatrix");
  assert.equal(getGeminiLiveVoiceOption().label, "Naomi");
  assert.equal(GEMINI_LIVE_VOICE_OPTIONS.length, 4);

  assert.deepEqual(
    GEMINI_LIVE_VOICE_OPTIONS.map(({ value, label, type }) => [value, label, type]),
    [
      ["Vindemiatrix", "Naomi", "girl"],
      ["Enceladus", "John", "boy"],
      ["Zephyr", "Zephyr", "girl"],
      ["Charon", "Michael", "boy"],
    ],
  );

  assert.deepEqual(
    GEMINI_LIVE_VOICE_OPTIONS.map(({ label, description }) => [label, description]),
    [
      ["Naomi", "Relaxed"],
      ["John", "Polished"],
      ["Zephyr", "Bright"],
      ["Michael", "Friendly"],
    ],
  );
});

test("Voice normalization handles labels, spelling variants, and legacy selections", () => {
  // Friendly labels resolve to API IDs
  assert.equal(normalizeGeminiLiveVoice("Naomi"), "Vindemiatrix");
  assert.equal(normalizeGeminiLiveVoice("naomi"), "Vindemiatrix");
  assert.equal(normalizeGeminiLiveVoice("Michael"), "Charon");
  assert.equal(normalizeGeminiLiveVoice("michael"), "Charon");
  assert.equal(normalizeGeminiLiveVoice("John"), "Enceladus");
  assert.equal(normalizeGeminiLiveVoice("john"), "Enceladus");
  assert.equal(normalizeGeminiLiveVoice("Zephyr"), "Zephyr");

  // User spelling variants
  assert.equal(normalizeGeminiLiveVoice("Vindematrix"), "Vindemiatrix");
  assert.equal(normalizeGeminiLiveVoice("vindematrix"), "Vindemiatrix");
  assert.equal(normalizeGeminiLiveVoice("Vindemeatrix"), "Vindemiatrix");

  // Direct exact API IDs
  assert.equal(normalizeGeminiLiveVoice("Vindemiatrix"), "Vindemiatrix");
  assert.equal(normalizeGeminiLiveVoice("Charon"), "Charon");
  assert.equal(normalizeGeminiLiveVoice("Enceladus"), "Enceladus");

  // OpenAI voice settings default to Naomi (Vindemiatrix)
  assert.equal(normalizeGeminiLiveVoice("marin"), "Vindemiatrix");
  assert.equal(normalizeGeminiLiveVoice("cedar"), "Vindemiatrix");
  assert.equal(normalizeGeminiLiveVoice("alloy"), "Vindemiatrix");
  assert.equal(normalizeGeminiLiveVoice("echo"), "Vindemiatrix");
  assert.equal(normalizeGeminiLiveVoice("shimmer"), "Vindemiatrix");

  // Legacy mappings
  assert.equal(normalizeGeminiLiveVoice("Trey"), "Enceladus");
  assert.equal(normalizeGeminiLiveVoice("David"), "Charon");
});

test("Unknown voices fallback to the default Naomi (Vindemiatrix) voice", () => {
  assert.equal(normalizeGeminiLiveVoice("unknown-voice"), DEFAULT_GEMINI_LIVE_VOICE);
  assert.equal(normalizeGeminiLiveVoice(""), DEFAULT_GEMINI_LIVE_VOICE);
  assert.equal(normalizeGeminiLiveVoice(null), DEFAULT_GEMINI_LIVE_VOICE);
});

test("Gemini Live voice descriptions are localized for all 10 support languages", () => {
  const supportLanguages = [
    "en", "es", "pt", "it", "fr", "de", "ja", "hi", "ar", "zh",
  ];

  for (const option of GEMINI_LIVE_VOICE_OPTIONS) {
    assert.ok(option.descriptionByLang, `Missing descriptionByLang for ${option.label}`);
    for (const lang of supportLanguages) {
      const desc = getGeminiLiveVoiceDescription(option.value, lang);
      assert.ok(
        typeof desc === "string" && desc.length > 0,
        `Missing ${lang} description for ${option.label}`,
      );
      assert.equal(desc, option.descriptionByLang[lang]);
    }
  }

  // Exact Spanish descriptions as seen in user interface
  assert.equal(getGeminiLiveVoiceDescription("Vindemiatrix", "es"), "Relajada");
  assert.equal(getGeminiLiveVoiceDescription("Charon", "es"), "Amigable");
  assert.equal(getGeminiLiveVoiceDescription("Enceladus", "es"), "Pulido");
  assert.equal(getGeminiLiveVoiceDescription("Zephyr", "es"), "Brillante");
});
