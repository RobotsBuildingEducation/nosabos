/**
 * Flashcard data for the 1000 most important words and phrases
 * Language-agnostic: concept is shown in support language, user translates to target language
 * AI grades the response and determines XP reward
 */

export const FLASHCARD_DATA = [
  {
    id: "flashcard-1",
    concept: {
      en: "Hello",
      es: "Hola",
    },
    cefrLevel: "A1",
  },
  {
    id: "flashcard-2",
    concept: {
      en: "Goodbye",
      es: "Adiós",
    },
    cefrLevel: "A1",
  },
  {
    id: "flashcard-3",
    concept: {
      en: "Thank you",
      es: "Gracias",
    },
    cefrLevel: "A1",
  },
  {
    id: "flashcard-4",
    concept: {
      en: "Please",
      es: "Por favor",
    },
    cefrLevel: "A1",
  },
  {
    id: "flashcard-5",
    concept: {
      en: "How are you?",
      es: "¿Cómo estás?",
    },
    cefrLevel: "A1",
  },
  {
    id: "flashcard-6",
    concept: {
      en: "My name is...",
      es: "Me llamo...",
    },
    cefrLevel: "A1",
  },
  {
    id: "flashcard-7",
    concept: {
      en: "I don't understand",
      es: "No entiendo",
    },
    cefrLevel: "A2",
  },
  {
    id: "flashcard-8",
    concept: {
      en: "Where is...?",
      es: "¿Dónde está...?",
    },
    cefrLevel: "A2",
  },
  {
    id: "flashcard-9",
    concept: {
      en: "How much does it cost?",
      es: "¿Cuánto cuesta?",
    },
    cefrLevel: "A2",
  },
  {
    id: "flashcard-10",
    concept: {
      en: "I would like...",
      es: "Me gustaría...",
    },
    cefrLevel: "A2",
  },
];

// CEFR level colors - A1 uses beautiful holographic blue
export const CEFR_COLORS = {
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

export const getFlashcardsByCEFR = (level) => {
  return FLASHCARD_DATA.filter((card) => card.cefrLevel === level);
};

export const getAllFlashcards = () => {
  return FLASHCARD_DATA;
};

// Helper to get concept in the appropriate language
export const getConceptText = (card, supportLang) => {
  if (typeof card.concept === "string") {
    return card.concept;
  }

  // Handle bilingual mode - randomly select English or Spanish
  if (supportLang === "bilingual") {
    const languages = ["en", "es"];
    const randomLang = languages[Math.floor(Math.random() * languages.length)];
    return card.concept[randomLang] || card.concept.en;
  }

  // Otherwise use the specified language, fallback to English
  return card.concept[supportLang] || card.concept.en;
};
