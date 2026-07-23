import test from "node:test";
import assert from "node:assert/strict";
import { ADAPTIVE_TEXT_TRANSLATIONS } from "./adaptiveTranslations.js";
import { CITIZENSHIP_QUESTIONS } from "./questions.js";

const supportedLanguages = ["es", "pt", "it", "fr", "de", "ja", "hi", "ar", "zh"];
const requiredAdaptiveKeys = [
  "Do you already have any Mexican nationality document?",
  "Before March 20, 1998, did you voluntarily acquire or use another nationality?",
  "Was at least one legal parent Mexican when you were born?",
  "What is your current immigration status in Mexico?",
  "Which of these may apply to you?",
  "Have you been married for at least two years?",
  "For the last two years, have you lived together at your marital home in Mexico?",
  "Which adoption or parental-authority situation applies?",
  "Does the narrow second-degree residence exception apply?",
  "Which criminal-proceeding statement applies to you?",
  "Do you feel ready to demonstrate Spanish?",
  "Do you feel ready for the Mexican history and culture exam?",
  "Checkpoint",
  "We found your likely route",
  "Your required answers point to the result below. You can check for document and filing issues before opening your full checklist.",
  "What remains unchecked",
  "Additional questions can check documents, identity-record differences, and filing preparation.",
  "optional questions available",
  "Refine document further",
  "View my results now",
  "Reset questionnaire?",
  "This will permanently clear your questionnaire answers, checklist progress, and saved assistant chat. This action cannot be undone.",
  "Reset progress",
  "Refine my checklist",
  "Already Mexican — document and ID path",
  "Mexican by birth — record and ID path",
];

test("core adaptive copy is localized for every citizenship language", () => {
  supportedLanguages.forEach((language) => {
    requiredAdaptiveKeys.forEach((key) => {
      const value = ADAPTIVE_TEXT_TRANSLATIONS[language]?.[key];
      assert.ok(value, `${language} is missing: ${key}`);
      assert.notEqual(value, key, `${language} falls back to English: ${key}`);
    });
  });
});

test("every adaptive question helper and placeholder is localized", () => {
  const contextualCopy = [
    ...new Set(
      CITIZENSHIP_QUESTIONS.flatMap((question) => [
        question.helper,
        question.placeholder,
      ]).filter(Boolean),
    ),
  ];

  supportedLanguages.forEach((language) => {
    contextualCopy.forEach((key) => {
      const value = ADAPTIVE_TEXT_TRANSLATIONS[language]?.[key];
      assert.ok(value, `${language} is missing contextual copy: ${key}`);
      assert.notEqual(
        value,
        key,
        `${language} contextual copy falls back to English: ${key}`,
      );
    });
  });
});
