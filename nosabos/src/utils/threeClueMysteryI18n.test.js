import test from "node:test";
import assert from "node:assert/strict";
import {
  THREE_CLUE_MYSTERY_I18N,
  getThreeClueMysteryCopy,
  formatThreeClueMysteryCopy,
} from "./threeClueMysteryI18n.js";

const REQUIRED_KEYS = [
  "title",
  "instruction",
  "clueBadge",
  "revealNext",
  "allCluesRevealed",
  "potentialXp",
  "inputPlaceholder",
  "askForHelp",
  "helpRequest",
  "skip",
  "submit",
  "checking",
  "tryAgain",
  "nextQuestion",
  "generationFailed",
  "tryAnother",
  "testingVocabulary",
  "testingGrammar",
  "example",
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

test("Three-Clue Mystery has complete copy for every support language", () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    const copy = THREE_CLUE_MYSTERY_I18N[lang];
    assert.ok(copy, `Missing Three-Clue Mystery copy for language: ${lang}`);
    for (const key of REQUIRED_KEYS) {
      assert.ok(
        typeof copy[key] === "string" && copy[key].trim().length > 0,
        `Missing or empty key '${key}' for language '${lang}'`,
      );
    }
  }
});

test("Three-Clue Mystery copy falls back safely for an unknown language", () => {
  const fallback = getThreeClueMysteryCopy("unknown-lang");
  assert.equal(fallback.title, "Three-Clue Mystery");
});

test("Three-Clue Mystery copy interpolates localized placeholders", () => {
  const template = "Clue {index} (+{xp} XP)";
  const formatted = formatThreeClueMysteryCopy(template, {
    index: 2,
    xp: 7,
  });
  assert.equal(formatted, "Clue 2 (+7 XP)");
});
