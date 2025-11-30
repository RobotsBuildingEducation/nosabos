/**
 * Flashcard data for the 1000 most important words and phrases
 * Starting with 10 cards for initial implementation
 */

export const FLASHCARD_DATA = [
  {
    id: "flashcard-1",
    concept: "Hello",
    translation: "Hola",
    cefrLevel: "A1",
    xpReward: 5,
    category: "greetings",
  },
  {
    id: "flashcard-2",
    concept: "Goodbye",
    translation: "Adiós",
    cefrLevel: "A1",
    xpReward: 5,
    category: "greetings",
  },
  {
    id: "flashcard-3",
    concept: "Thank you",
    translation: "Gracias",
    cefrLevel: "A1",
    xpReward: 4,
    category: "courtesy",
  },
  {
    id: "flashcard-4",
    concept: "Please",
    translation: "Por favor",
    cefrLevel: "A1",
    xpReward: 4,
    category: "courtesy",
  },
  {
    id: "flashcard-5",
    concept: "How are you?",
    translation: "¿Cómo estás?",
    cefrLevel: "A1",
    xpReward: 6,
    category: "greetings",
  },
  {
    id: "flashcard-6",
    concept: "My name is...",
    translation: "Me llamo...",
    cefrLevel: "A1",
    xpReward: 6,
    category: "introductions",
  },
  {
    id: "flashcard-7",
    concept: "I don't understand",
    translation: "No entiendo",
    cefrLevel: "A2",
    xpReward: 7,
    category: "communication",
  },
  {
    id: "flashcard-8",
    concept: "Where is...?",
    translation: "¿Dónde está...?",
    cefrLevel: "A2",
    xpReward: 6,
    category: "questions",
  },
  {
    id: "flashcard-9",
    concept: "How much does it cost?",
    translation: "¿Cuánto cuesta?",
    cefrLevel: "A2",
    xpReward: 7,
    category: "shopping",
  },
  {
    id: "flashcard-10",
    concept: "I would like...",
    translation: "Me gustaría...",
    cefrLevel: "A2",
    xpReward: 6,
    category: "requests",
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
