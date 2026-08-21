import test from "node:test";
import assert from "node:assert/strict";
import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";
import {
  SENTENCE_DETECTIVE_COPY,
  formatSentenceDetectiveCopy,
  getSentenceDetectiveCopy,
} from "./sentenceDetectiveI18n.js";

test("Sentence Detective has complete copy for every support language", () => {
  const englishKeys = Object.keys(SENTENCE_DETECTIVE_COPY.en).sort();

  assert.deepEqual(Object.keys(SENTENCE_DETECTIVE_COPY).sort(), [
    ...SUPPORT_LANGUAGE_CODES,
  ].sort());

  for (const language of SUPPORT_LANGUAGE_CODES) {
    const copy = getSentenceDetectiveCopy(language);
    assert.deepEqual(
      Object.keys(copy).sort(),
      englishKeys,
      `${language} is missing localized Sentence Detective copy`,
    );
    for (const [key, value] of Object.entries(copy)) {
      assert.equal(typeof value, "string", `${language}.${key} is not text`);
      assert.ok(value.trim(), `${language}.${key} is empty`);
    }
  }
});

test("Sentence Detective copy falls back safely for an unknown language", () => {
  assert.equal(getSentenceDetectiveCopy("unknown"), SENTENCE_DETECTIVE_COPY.en);
});

test("Sentence Detective copy interpolates localized placeholders", () => {
  assert.equal(
    formatSentenceDetectiveCopy("{correct} de {total}", {
      correct: 7,
      total: 10,
    }),
    "7 de 10",
  );
  assert.equal(
    formatSentenceDetectiveCopy("«{token}»", { token: "bonjour" }),
    "«bonjour»",
  );
});
