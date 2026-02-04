// src/utils/noteGeneration.js
import { callResponses, DEFAULT_RESPONSES_MODEL } from "./llm";

// Language name mapping
const LANG_NAME = (code) =>
  ({
    en: "English",
    es: "Spanish",
    pt: "Brazilian Portuguese",
    fr: "French",
    it: "Italian",
    nl: "Dutch",
    nah: "Eastern Huasteca Nahuatl",
    ru: "Russian",
    de: "German",
    el: "Greek",
    pl: "Polish",
    ga: "Irish",
    yua: "Yucatec Maya",
    nv: "Navajo",
  }[code] || code);

/**
 * Generate a note with an example and summary using AI
 * @param {Object} params
 * @param {string} params.concept - The concept/word/phrase the user was practicing
 * @param {string} params.userAnswer - What the user answered (optional)
 * @param {boolean} params.wasCorrect - Whether the user's answer was correct
 * @param {string} params.targetLang - Target language code (e.g., "es")
 * @param {string} params.supportLang - Support language code (e.g., "en")
 * @param {string} params.cefrLevel - CEFR level (A1-C2)
 * @param {string} params.moduleType - Type of module ("flashcard", "vocabulary", "grammar")
 * @returns {Promise<{example: string, summary: string}>}
 */
export async function generateNoteContent({
  concept,
  userAnswer,
  wasCorrect,
  targetLang,
  supportLang,
  cefrLevel,
  moduleType,
}) {
  const targetLangName = LANG_NAME(targetLang);
  const supportLangName = LANG_NAME(supportLang);

  const prompt = `You are a language learning assistant. Generate a study note for a ${cefrLevel} level student learning ${targetLangName}.

Topic/Concept: "${concept}"
${
  userAnswer
    ? `User's answer: "${userAnswer}" (${wasCorrect ? "correct" : "incorrect"})`
    : ""
}
Module: ${moduleType}

Generate:
1. EXAMPLE: A short, practical example sentence in ${targetLangName} using this concept. Keep it appropriate for ${cefrLevel} level.
2. SUMMARY: A 1-2 sentence explanation in ${supportLangName} that helps the student remember this concept.${
    !wasCorrect ? " Include a brief tip about common mistakes." : ""
  }

Reply in this exact JSON format (no markdown, just raw JSON):
{"example": "...", "summary": "..."}`;

  try {
    const response = await callResponses({
      model: DEFAULT_RESPONSES_MODEL,
      input: prompt,
    });

    // Try to parse JSON from response
    const trimmed = (response || "").trim();

    // Find JSON in response
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        example: parsed.example || `Example for "${concept}"`,
        summary: parsed.summary || `Study note for "${concept}"`,
      };
    }

    // Fallback if parsing fails
    return {
      example: `Example: ${concept}`,
      summary: `Practice this ${cefrLevel} ${moduleType} concept regularly.`,
    };
  } catch (error) {
    console.error("Error generating note content:", error);
    // Return fallback content
    return {
      example: `${concept}`,
      summary: `Keep practicing this ${cefrLevel} level concept.`,
    };
  }
}

/**
 * Build a note object ready to be added to the store
 */
export function buildNoteObject({
  lessonTitle,
  cefrLevel,
  example,
  summary,
  targetLang,
  supportLang,
  moduleType,
  wasCorrect,
}) {
  return {
    lessonTitle,
    cefrLevel,
    example,
    summary,
    targetLang,
    supportLang,
    moduleType,
    wasCorrect,
  };
}
