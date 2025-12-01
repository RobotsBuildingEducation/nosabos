/**
 * Flashcard data for the 1000 most important words and phrases
 * Language-agnostic: concept is shown in support language, user translates to target language
 * AI grades the response and determines XP reward
 */

export const FLASHCARD_DATA = [
  {
    id: "flashcard-1",
    concept: "Hello",
    cefrLevel: "A1",
  },
  {
    id: "flashcard-2",
    concept: "Goodbye",
    cefrLevel: "A1",
  },
  {
    id: "flashcard-3",
    concept: "Thank you",
    cefrLevel: "A1",
  },
  {
    id: "flashcard-4",
    concept: "Please",
    cefrLevel: "A1",
  },
  {
    id: "flashcard-5",
    concept: "How are you?",
    cefrLevel: "A1",
  },
  {
    id: "flashcard-6",
    concept: "My name is...",
    cefrLevel: "A1",
  },
  {
    id: "flashcard-7",
    concept: "I don't understand",
    cefrLevel: "A2",
  },
  {
    id: "flashcard-8",
    concept: "Where is...?",
    cefrLevel: "A2",
  },
  {
    id: "flashcard-9",
    concept: "How much does it cost?",
    cefrLevel: "A2",
  },
  {
    id: "flashcard-10",
    concept: "I would like...",
    cefrLevel: "A2",
  },
];

// CEFR level colors matching the existing skill tree
export const CEFR_COLORS = {
  A1: { primary: "#22C55E", gradient: "linear(135deg, #22C55E, #16A34A)" },
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
