/**
 * Common flashcard utilities and constants
 */

// CEFR level colors - A1 uses beautiful holographic blue
export const CEFR_COLORS = {
  "Pre-A1": {
    primary: "#8B5CF6",
    gradient: "linear(135deg, #A78BFA, #8B5CF6, #7C3AED, #6D28D9)",
  },
  A1: {
    primary: "#3B82F6",
    gradient: "linear(135deg, #60A5FA, #3B82F6, #2563EB, #1D4ED8)",
  },
  A2: { primary: "#3B82F6", gradient: "linear(135deg, #3B82F6, #2563EB)" },
  B1: { primary: "#A855F7", gradient: "linear(135deg, #A855F7, #9333EA)" },
  B2: { primary: "#F97316", gradient: "linear(135deg, #F97316, #EA580C)" },
  C1: { primary: "#EF4444", gradient: "linear(135deg, #EF4444, #DC2626)" },
  C2: { primary: "#EC4899", gradient: "linear(135deg, #EC4899, #DB2777)" },
};

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
    const languages = ["en", "es"];
    const selectedLang = languages[hash % languages.length];
    return card.concept[selectedLang] || card.concept.en;
  }

  // Otherwise use the specified language, fallback to English
  return card.concept[supportLang] || card.concept.en;
};

// CEFR level metadata
export const CEFR_LEVELS = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CEFR_LEVEL_COUNTS = {
  "Pre-A1": 100,
  A1: 300,
  A2: 250,
  B1: 200,
  B2: 150,
  C1: 100,
  C2: 50,
};

export const TOTAL_FLASHCARDS = Object.values(CEFR_LEVEL_COUNTS).reduce((a, b) => a + b, 0);
