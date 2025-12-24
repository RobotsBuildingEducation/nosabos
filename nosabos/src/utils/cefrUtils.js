/**
 * Utility functions for CEFR level extraction and descriptions
 */

/**
 * Extracts the CEFR level from a lesson or unit ID
 * @param {string} id - Lesson ID (e.g., "lesson-a1-1-1") or Unit ID (e.g., "unit-a1-1")
 * @returns {string} - CEFR level in uppercase (e.g., "A1", "B2", "C1")
 */
export function extractCEFRLevel(id) {
  if (!id || typeof id !== "string") return "A1"; // Default fallback

  // Match pattern like "lesson-a1-" or "unit-b2-" or "lesson-pre-a1-"
  const match = id.match(/(?:lesson|unit)-(?:pre-)?(a1|a2|b1|b2|c1|c2)/i);
  if (match) {
    return match[1].toUpperCase();
  }

  // If no match found, default to A1
  return "A1";
}

/**
 * Get CEFR level descriptions for content generation
 * Based on official CEFR framework standards
 */
export const CEFR_DESCRIPTIONS = {
  "PRE-A1": {
    name: "Pre-A1 Foundations",
    interaction: "Recognize and respond to ultra-common social phrases",
    production: "Use memorized high-frequency words and short requests",
    vocabulary: "100 most common words and phrases to start conversations",
    grammar: "Formula chunks only (I am, this is, where is?)",
    sentenceComplexity: "Single words or 2-4 word memorized phrases",
    readingLevel: "Individual words and micro phrases on signs and labels",
    listeningLevel: "Recognize familiar everyday phrases and key words",
    culturalContext: "Basic courtesy, greetings, and simple questions",
  },
  A1: {
    name: "Beginner",
    interaction: "Exchange short, formulaic turns in simple situations",
    production: "Share personal details and immediate needs using simple phrases",
    vocabulary: "High-frequency everyday vocabulary (500-1000 words)",
    grammar: "Present tense, basic sentence structures, common verbs",
    sentenceComplexity: "Simple sentences with 5-10 words, basic connectors (and, but)",
    readingLevel: "Short, simple texts with familiar vocabulary",
    listeningLevel: "Slow, clear speech with frequent pauses",
    culturalContext: "Everyday situations, basic social norms",
  },
  A2: {
    name: "Elementary",
    interaction: "Handle simple, routine exchanges on familiar topics",
    production: "Describe experiences, plans, and opinions in simple terms",
    vocabulary: "Extended basic vocabulary for routine matters (1000-2000 words)",
    grammar: "Past and future tenses, comparatives, basic modal verbs",
    sentenceComplexity: "Connected sentences with 8-15 words, simple transitions (then, because, so)",
    readingLevel: "Straightforward texts on familiar subjects",
    listeningLevel: "Clear standard speech on familiar matters",
    culturalContext: "Common social situations, basic cultural references",
  },
  B1: {
    name: "Intermediate",
    interaction: "Handle most everyday situations with reasonable fluency",
    production: "Express opinions, narrate stories, and explain viewpoints",
    vocabulary: "Broader vocabulary for abstract and concrete topics (2000-3500 words)",
    grammar: "All major tenses, conditionals, passive voice, subjunctive basics",
    sentenceComplexity: "Multi-clause sentences with 12-20 words, varied connectors (although, while, since)",
    readingLevel: "Texts with varied language on familiar and some unfamiliar topics",
    listeningLevel: "Standard speech at normal speed on familiar topics",
    culturalContext: "Cultural differences, idiomatic expressions, regional variations",
  },
  B2: {
    name: "Upper Intermediate",
    interaction: "Engage in extended conversations on abstract and concrete topics",
    production: "Produce detailed texts, argue viewpoints, discuss complex ideas",
    vocabulary: "Wide vocabulary including idioms and colloquialisms (3500-5000 words)",
    grammar: "Complex structures, advanced conditionals, nuanced tenses, subjunctive mood",
    sentenceComplexity: "Complex sentences with 15-25 words, sophisticated linking (nevertheless, moreover, whereas)",
    readingLevel: "Contemporary prose, opinions, and specialized articles",
    listeningLevel: "Extended speech, films, complex discussions at normal speed",
    culturalContext: "Nuanced cultural references, humor, implicit meanings",
  },
  C1: {
    name: "Advanced",
    interaction: "Express yourself fluently and spontaneously without searching for words",
    production: "Produce clear, well-structured, detailed text on complex subjects",
    vocabulary: "Broad lexical repertoire with precise expressions (5000-8000 words)",
    grammar: "Full mastery of complex structures, stylistic variations, subtle nuances",
    sentenceComplexity: "Sophisticated but concise sentences, advanced discourse markers",
    goalComplexity: "Complex topics expressed clearly and concisely (max 15 words)",
    readingLevel: "Long, complex texts, literary works, technical content",
    listeningLevel: "Extended speech even when poorly structured or implicit",
    culturalContext: "Deep cultural knowledge, subtle references, literary allusions",
  },
  C2: {
    name: "Mastery",
    interaction: "Take part effortlessly in any conversation with native-like ease",
    production: "Produce nuanced, precise communication appropriate to any context",
    vocabulary: "Near-native mastery with specialized and rare terms (8000+ words)",
    grammar: "Native-like command of all structures, registers, and styles",
    sentenceComplexity: "Native-like sophistication while remaining clear and direct",
    goalComplexity: "Nuanced topics expressed concisely (max 15 words)",
    readingLevel: "All types of texts including abstract, complex, or highly colloquial",
    listeningLevel: "Any spoken language at native speed, including accents and dialects",
    culturalContext: "Native-level cultural competence, subtle humor, wordplay",
  },
};

/**
 * Get a CEFR level description
 * @param {string} level - CEFR level (e.g., "A1", "B2")
 * @returns {object} - Description object with interaction, production, vocabulary, grammar, etc.
 */
export function getCEFRDescription(level) {
  const normalizedLevel = level?.toUpperCase() || "A1";
  return CEFR_DESCRIPTIONS[normalizedLevel] || CEFR_DESCRIPTIONS["A1"];
}

/**
 * Get a simplified difficulty hint for prompts based on CEFR level
 * @param {string} cefrLevel - CEFR level (e.g., "A1", "B2")
 * @returns {string} - Difficulty description for AI prompts
 */
export function getCEFRPromptHint(cefrLevel) {
  const level = cefrLevel?.toUpperCase() || "A1";
  const desc = getCEFRDescription(level);

  const goalHint = desc.goalComplexity
    ? ` Goals: ${desc.goalComplexity}.`
    : "";

  return `CEFR ${level} (${desc.name}): ${desc.sentenceComplexity}. Vocabulary: ${desc.vocabulary}. Grammar: ${desc.grammar}.${goalHint}`;
}
