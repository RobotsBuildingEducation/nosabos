/**
 * Common flashcard utilities and constants
 */

import { translateFlashcardConceptToArabic } from "./arabicLocalizer.js";
import { translateFlashcardConceptToJapanese } from "./japaneseLocalizer.js";
import { translateFlashcardConceptToHindi } from "./hindiLocalizer.js";
import { translateFlashcardConceptToPortuguese } from "./portugueseLocalizer.js";
import { translateFlashcardConceptToChinese } from "./chineseLocalizer.js";
import { translateFlashcardConceptToGerman } from "./germanLocalizer.js";

export {
  CEFR_COLORS,
  CEFR_LEVELS,
  CEFR_LEVEL_COUNTS,
  TOTAL_FLASHCARDS,
} from "./cefrConstants.js";

// Helper to get concept in the appropriate language
export const getConceptText = (card, supportLang) => {
  if (typeof card.concept === "string") {
    return card.concept;
  }

  // Handle bilingual mode - deterministically select language based on card ID
  // This ensures the same card always shows the same language (no flickering)
  if (supportLang === "bilingual") {
    // Simple hash: sum of char codes in card.id
    const hash = (card.id || "")
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const languages = ["en", "es", "pt", "it", "fr", "de", "ja", "hi", "ar", "zh"];
    const selectedLang = languages[hash % languages.length];
    if (selectedLang === "pt" && !card.concept.pt) {
      return translateFlashcardConceptToPortuguese(
        card.concept.en,
        card.concept.es,
      );
    }
    if (selectedLang === "ja" && !card.concept.ja) {
      return translateFlashcardConceptToJapanese(card.concept.en);
    }
    if (selectedLang === "hi" && !card.concept.hi) {
      return translateFlashcardConceptToHindi(card.concept.en || card.concept.es);
    }
    if (selectedLang === "ar" && !card.concept.ar) {
      return translateFlashcardConceptToArabic(card.concept.en || card.concept.es);
    }
    if (selectedLang === "zh" && !card.concept.zh) {
      return translateFlashcardConceptToChinese(card.concept.en || card.concept.es);
    }
    if (selectedLang === "de" && !card.concept.de) {
      return translateFlashcardConceptToGerman(card.concept.en || card.concept.es);
    }
    return card.concept[selectedLang] || card.concept.en;
  }

  if (supportLang === "pt" && !card.concept.pt) {
    return translateFlashcardConceptToPortuguese(
      card.concept.en,
      card.concept.es,
    );
  }

  if (supportLang === "ja" && !card.concept.ja) {
    return translateFlashcardConceptToJapanese(card.concept.en);
  }

  if (supportLang === "hi" && !card.concept.hi) {
    return translateFlashcardConceptToHindi(card.concept.en || card.concept.es);
  }

  if (supportLang === "ar" && !card.concept.ar) {
    return translateFlashcardConceptToArabic(card.concept.en || card.concept.es);
  }

  if (supportLang === "zh" && !card.concept.zh) {
    return translateFlashcardConceptToChinese(card.concept.en || card.concept.es);
  }

  if (supportLang === "de" && !card.concept.de) {
    return translateFlashcardConceptToGerman(card.concept.en || card.concept.es);
  }

  // Otherwise use the specified language, fallback to English
  return card.concept[supportLang] || card.concept.en;
};

