import test from "node:test";
import assert from "node:assert/strict";
import {
  THREE_WORD_CHALLENGE_I18N,
  getThreeWordChallengeCopy,
  formatThreeWordChallengeCopy,
} from "./threeWordChallengeI18n.js";

const REQUIRED_KEYS = [
  "title",
  "instruction",
  "inputPlaceholder",
  "semanticTip",
  "askForHelp",
  "helpRequest",
  "skip",
  "submit",
  "checking",
  "tryAgain",
  "nextQuestion",
  "generationFailed",
  "tryAnother",
];

const SUPPORTED_LANGUAGES = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "ja",
  "ru",
  "el",
  "nl",
  "pl",
  "ga",
  "ar",
  "hi",
  "zh",
  "nah",
  "yua",
];

test("Three-Word Challenge has complete copy for every support language", () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    const copy = THREE_WORD_CHALLENGE_I18N[lang];
    assert.ok(copy, `Missing copy for language: ${lang}`);
    for (const key of REQUIRED_KEYS) {
      assert.ok(
        typeof copy[key] === "string" && copy[key].length > 0,
        `Missing or empty key '${key}' in language: ${lang}`,
      );
    }
  }
});

test("Three-Word Challenge copy falls back safely for an unknown language", () => {
  const copy = getThreeWordChallengeCopy("xx-unknown");
  assert.equal(copy.title, "Three-Word Challenge");
});

test("Three-Word Challenge copy interpolates localized placeholders", () => {
  const formatted = formatThreeWordChallengeCopy("Challenge for {level}", {
    level: "A2",
  });
  assert.equal(formatted, "Challenge for A2");
});
