import test from "node:test";
import assert from "node:assert/strict";
import {
  LISTEN_DIFFERENCE_I18N,
  getListenDifferenceCopy,
  formatListenDifferenceCopy,
} from "./listenDifferenceI18n.js";

const REQUIRED_KEYS = [
  "title",
  "instruction",
  "playAudio",
  "playingAudio",
  "askForHelp",
  "helpRequest",
  "skip",
  "submit",
  "checking",
  "tryAgain",
  "nextQuestion",
  "generationFailed",
  "tryAnother",
  "contrastLabel",
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

test("Listen for the Difference has complete copy for every support language", () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    const copy = LISTEN_DIFFERENCE_I18N[lang];
    assert.ok(copy, `Missing copy for language: ${lang}`);
    for (const key of REQUIRED_KEYS) {
      assert.ok(
        typeof copy[key] === "string" && copy[key].length > 0,
        `Missing or empty key '${key}' in language: ${lang}`,
      );
    }
  }
});

test("Listen for the Difference copy falls back safely for an unknown language", () => {
  const copy = getListenDifferenceCopy("xx-unknown");
  assert.equal(copy.title, "Listen for the Difference");
});

test("Listen for the Difference copy interpolates localized placeholders", () => {
  const formatted = formatListenDifferenceCopy("Audio for {contrast}", {
    contrast: "tense difference",
  });
  assert.equal(formatted, "Audio for tense difference");
});
