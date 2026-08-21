import test from "node:test";
import assert from "node:assert/strict";
import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";
import {
  SENTENCE_SHAPESHIFTER_COPY,
  formatSentenceShapeshifterCopy,
  getSentenceShapeshifterCopy,
} from "./sentenceShapeshifterI18n.js";

test("Sentence Shapeshifter has complete copy for every support language", () => {
  const englishKeys = Object.keys(SENTENCE_SHAPESHIFTER_COPY.en).sort();
  const allLanguages = Object.keys(SENTENCE_SHAPESHIFTER_COPY);

  for (const supportCode of SUPPORT_LANGUAGE_CODES) {
    assert.ok(
      allLanguages.includes(supportCode),
      `Sentence Shapeshifter is missing support language ${supportCode}`,
    );
  }

  for (const language of allLanguages) {
    const copy = getSentenceShapeshifterCopy(language);
    assert.deepEqual(
      Object.keys(copy).sort(),
      englishKeys,
      `${language} is missing localized Sentence Shapeshifter copy`,
    );
    for (const [key, value] of Object.entries(copy)) {
      assert.equal(typeof value, "string", `${language}.${key} is not text`);
      assert.ok(value.trim(), `${language}.${key} is empty`);
    }
  }
});

test("Sentence Shapeshifter copy falls back safely for an unknown language", () => {
  assert.equal(
    getSentenceShapeshifterCopy("unknown"),
    SENTENCE_SHAPESHIFTER_COPY.en,
  );
});

test("Sentence Shapeshifter copy interpolates localized placeholders", () => {
  assert.equal(
    formatSentenceShapeshifterCopy("Transform {source} with {constraint}", {
      source: "I eat an apple",
      constraint: "Past tense",
    }),
    "Transform I eat an apple with Past tense",
  );
});
