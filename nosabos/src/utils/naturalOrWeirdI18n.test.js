import test from "node:test";
import assert from "node:assert/strict";
import {
  NATURAL_OR_WEIRD_I18N,
  getNaturalOrWeirdCopy,
  formatNaturalOrWeirdCopy,
} from "./naturalOrWeirdI18n.js";

const REQUIRED_KEYS = [
  "title",
  "instruction",
  "soundsNatural",
  "soundsWeird",
  "playAudio",
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

test("Natural or Weird has complete copy for every support language", () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    const copy = NATURAL_OR_WEIRD_I18N[lang];
    assert.ok(copy, `Missing copy for language: ${lang}`);
    for (const key of REQUIRED_KEYS) {
      assert.ok(
        typeof copy[key] === "string" && copy[key].length > 0,
        `Missing or empty key '${key}' in language: ${lang}`,
      );
    }
  }
});

test("Natural or Weird copy falls back safely for an unknown language", () => {
  const copy = getNaturalOrWeirdCopy("xx-unknown");
  assert.equal(copy.title, "Natural or Weird?");
});

test("Natural or Weird copy interpolates localized placeholders", () => {
  const formatted = formatNaturalOrWeirdCopy("Intuition on {sentence}", {
    sentence: "Hola",
  });
  assert.equal(formatted, "Intuition on Hola");
});
