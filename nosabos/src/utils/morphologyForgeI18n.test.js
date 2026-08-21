import test from "node:test";
import assert from "node:assert/strict";
import {
  MORPHOLOGY_FORGE_I18N,
  getMorphologyForgeCopy,
  formatMorphologyForgeCopy,
} from "./morphologyForgeI18n.js";

const REQUIRED_KEYS = [
  "title",
  "instruction",
  "forgeSlot",
  "emptyForge",
  "pieceBank",
  "allPiecesUsed",
  "tapToRemove",
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

test("Morphology Forge has complete copy for every support language", () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    const copy = MORPHOLOGY_FORGE_I18N[lang];
    assert.ok(copy, `Missing Morphology Forge copy for language: ${lang}`);
    for (const key of REQUIRED_KEYS) {
      assert.ok(
        typeof copy[key] === "string" && copy[key].trim().length > 0,
        `Missing or empty key '${key}' for language '${lang}'`,
      );
    }
  }
});

test("Morphology Forge copy falls back safely for an unknown language", () => {
  const fallback = getMorphologyForgeCopy("unknown-lang");
  assert.equal(fallback.title, "Morphology Forge");
});

test("Morphology Forge copy interpolates localized placeholders", () => {
  const template = "Word: {word} ({count})";
  const formatted = formatMorphologyForgeCopy(template, {
    word: "escribió",
    count: 2,
  });
  assert.equal(formatted, "Word: escribió (2)");
});
