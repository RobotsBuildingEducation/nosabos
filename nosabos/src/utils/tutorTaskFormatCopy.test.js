import assert from "node:assert/strict";
import test from "node:test";

import {
  TUTOR_TASK_FORMATS_GENERAL,
  TUTOR_TASK_FORMATS_PRE_A1,
  getLocalizedTutorTaskFormatSentence,
} from "./tutorTaskFormatCopy.js";

const SUPPORT_CODES = ["en", "es", "pt", "it", "fr", "de", "ja", "hi", "ar", "zh"];

test("every support language has a full, aligned format set", () => {
  for (const code of SUPPORT_CODES) {
    assert.equal(
      TUTOR_TASK_FORMATS_GENERAL[code]?.length,
      TUTOR_TASK_FORMATS_GENERAL.en.length,
      `general formats for ${code}`,
    );
    assert.equal(
      TUTOR_TASK_FORMATS_PRE_A1[code]?.length,
      TUTOR_TASK_FORMATS_PRE_A1.en.length,
      `pre-a1 formats for ${code}`,
    );
  }
});

test("rotation is keyed by turn count and localized by support code", () => {
  // Index 1 is the fill-in-the-blank format in every language.
  assert.match(
    getLocalizedTutorTaskFormatSentence(1, "Pre-A1", "es"),
    /una sola palabra que falta/,
  );
  assert.match(
    getLocalizedTutorTaskFormatSentence(1, "Pre-A1", "en"),
    /one-word fill-in-the-blank/,
  );
  // Locale variants normalize; unknown codes fall back to English.
  assert.equal(
    getLocalizedTutorTaskFormatSentence(2, "A1", "es-MX"),
    getLocalizedTutorTaskFormatSentence(2, "A1", "es"),
  );
  assert.equal(
    getLocalizedTutorTaskFormatSentence(2, "A1", "ga"),
    getLocalizedTutorTaskFormatSentence(2, "A1", "en"),
  );
});

test("no format sentence asks the learner to write — this is a voice surface", () => {
  for (const sentence of [
    ...TUTOR_TASK_FORMATS_GENERAL.en,
    ...TUTOR_TASK_FORMATS_PRE_A1.en,
    ...TUTOR_TASK_FORMATS_GENERAL.es,
    ...TUTOR_TASK_FORMATS_PRE_A1.es,
  ]) {
    assert.doesNotMatch(sentence, /write|escrib/i);
  }
});
