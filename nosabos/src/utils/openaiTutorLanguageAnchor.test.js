import assert from "node:assert/strict";
import test from "node:test";

import { getOpenAITutorLanguageAnchor } from "./openaiTutorLanguageAnchor.js";

test("every support language has a native-language anchor sentence", () => {
  const codes = ["en", "es", "pt", "it", "fr", "de", "ja", "hi", "ar", "zh"];
  for (const code of codes) {
    const anchor = getOpenAITutorLanguageAnchor(code);
    assert.ok(anchor.length > 0, `missing anchor for ${code}`);
  }
  // Spot-check the language actually matches: the sentence must be written IN
  // the support language — that is its entire mechanism.
  assert.match(getOpenAITutorLanguageAnchor("es"), /en español/);
  assert.match(getOpenAITutorLanguageAnchor("hi"), /हिंदी में/);
  assert.match(getOpenAITutorLanguageAnchor("en"), /in English/);
});

test("locale variants normalize and unknown codes return empty", () => {
  assert.equal(
    getOpenAITutorLanguageAnchor("es-MX"),
    getOpenAITutorLanguageAnchor("es"),
  );
  assert.equal(getOpenAITutorLanguageAnchor("ga"), "");
  assert.equal(getOpenAITutorLanguageAnchor(""), "");
});
