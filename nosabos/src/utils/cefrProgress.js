/**
 * CEFR Progress Calculation Utilities
 *
 * Calculates completion percentages for each CEFR proficiency level
 * separately for skill tree lessons and flashcards
 */

import { CEFR_LEVELS, CEFR_LEVEL_COUNTS } from '../data/flashcards/common.js';

// Total user-facing lessons per CEFR level from the runtime learning path.
// Includes core lessons, skill builders, integrated practice, game reviews, and quizzes.
export const LESSON_COUNTS = {
  "Pre-A1": 86,
  A1: 98,
  A2: 126,
  B1: 105,
  B2: 84,
  C1: 70,
  C2: 56,
};

/**
 * Extract the CEFR level from user-facing lesson IDs.
 * Handles both authored lessons (`lesson-a1-*`) and generated unit lessons
 * (`unit-a1-*-skill-builder`, `unit-a1-*-integrated-practice`, `unit-a1-*-game`).
 * The first A1 number units are staged under Pre-A1 in the runtime path.
 */
export function getLessonLevelFromId(lessonId = "") {
  const id = String(lessonId || "").toLowerCase();
  if (!id) return null;

  if (id.includes("lesson-tutorial") || id.includes("unit-tutorial-pre-a1")) {
    return "Pre-A1";
  }

  if (/(?:lesson|unit)-pre-a1(?:-|$)/.test(id)) {
    return "Pre-A1";
  }

  if (/(?:lesson|unit)-a1-(?:1|3|4)(?:-|$)/.test(id)) {
    return "Pre-A1";
  }

  const match = id.match(/(?:lesson|unit)-(a1|a2|b1|b2|c1|c2)(?:-|$)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Calculate completion percentage for lessons in a specific CEFR level
 * @param {Object} userProgress - User progress object
 * @param {string} cefrLevel - CEFR level (A1, A2, B1, B2, C1, C2)
 * @param {string} targetLang - Target language code (e.g., 'es', 'en')
 * @returns {number} Completion percentage (0-100)
 */
export function calculateLessonCompletion(userProgress, cefrLevel, targetLang = 'es') {
  if (!userProgress || !cefrLevel) return 0;

  const lessons = userProgress.languageLessons?.[targetLang] || userProgress.lessons || {};
  const totalLessonsInLevel = LESSON_COUNTS[cefrLevel] || 0;

  if (totalLessonsInLevel === 0) return 0;

  const completedCount = Object.keys(lessons).filter(lessonId => {
    const isInLevel = getLessonLevelFromId(lessonId) === cefrLevel;
    const isCompleted = lessons[lessonId]?.status === 'completed';
    return isInLevel && isCompleted;
  }).length;

  return Number(((completedCount / totalLessonsInLevel) * 100).toFixed(2));
}

/**
 * Calculate completion percentage for flashcards in a specific CEFR level
 * @param {Object} userProgress - User progress object
 * @param {string} cefrLevel - CEFR level (A1, A2, B1, B2, C1, C2)
 * @param {string} targetLang - Target language code (e.g., 'es', 'en')
 * @returns {number} Completion percentage (0-100)
 */
export function calculateFlashcardCompletion(userProgress, cefrLevel, targetLang = 'es') {
  if (!userProgress || !cefrLevel) return 0;

  const flashcards = userProgress.languageFlashcards?.[targetLang] || userProgress.flashcards || {};
  const totalFlashcardsInLevel = CEFR_LEVEL_COUNTS[cefrLevel] || 0;

  if (totalFlashcardsInLevel === 0) return 0;

  // Count completed flashcards for this CEFR level
  // Flashcard IDs follow pattern: "a1-greet-1", "a2-food-5", etc.
  const levelPrefix = cefrLevel.toLowerCase();
  const completedCount = Object.keys(flashcards).filter(cardId => {
    const isInLevel = cardId.startsWith(`${levelPrefix}-`);
    const isCompleted = flashcards[cardId]?.completed === true;
    return isInLevel && isCompleted;
  }).length;

  return Number(((completedCount / totalFlashcardsInLevel) * 100).toFixed(2));
}

/**
 * Get all CEFR level progress for lessons
 * @param {Object} userProgress - User progress object
 * @param {string} targetLang - Target language code
 * @returns {Object} Object with completion percentages for each level
 */
export function getAllLessonProgress(userProgress, targetLang = 'es') {
  const progress = {};

  for (const level of CEFR_LEVELS) {
    progress[level] = {
      percentage: calculateLessonCompletion(userProgress, level, targetLang),
      total: LESSON_COUNTS[level],
    };
  }

  return progress;
}

/**
 * Get all CEFR level progress for flashcards
 * @param {Object} userProgress - User progress object
 * @param {string} targetLang - Target language code
 * @returns {Object} Object with completion percentages for each level
 */
export function getAllFlashcardProgress(userProgress, targetLang = 'es') {
  const progress = {};

  for (const level of CEFR_LEVELS) {
    progress[level] = {
      percentage: calculateFlashcardCompletion(userProgress, level, targetLang),
      total: CEFR_LEVEL_COUNTS[level],
    };
  }

  return progress;
}

/**
 * Get combined progress for both lessons and flashcards per level
 * @param {Object} userProgress - User progress object
 * @param {string} targetLang - Target language code
 * @returns {Object} Object with both lesson and flashcard progress per level
 */
export function getAllCEFRProgress(userProgress, targetLang = 'es') {
  const lessonProgress = getAllLessonProgress(userProgress, targetLang);
  const flashcardProgress = getAllFlashcardProgress(userProgress, targetLang);

  const combinedProgress = {};

  for (const level of CEFR_LEVELS) {
    combinedProgress[level] = {
      lessons: lessonProgress[level],
      flashcards: flashcardProgress[level],
    };
  }

  return combinedProgress;
}

/**
 * Determine the user's current proficiency level based on lesson completion
 * Returns the highest CEFR level that is unlocked (previous level is complete)
 * @param {Object} userProgress - User progress object
 * @param {string} targetLang - Target language code
 * @returns {string} Current CEFR level (A1, A2, B1, B2, C1, or C2)
 */
export function getUserProficiencyLevel(userProgress, targetLang = 'es') {
  if (!userProgress) return 'A1'; // Default to A1 if no progress

  // A1 is always unlocked
  let currentLevel = 'A1';

  // Check each level sequentially
  for (let i = 0; i < CEFR_LEVELS.length - 1; i++) {
    const level = CEFR_LEVELS[i];
    const nextLevel = CEFR_LEVELS[i + 1];

    // Calculate completion for current level
    const completion = calculateLessonCompletion(userProgress, level, targetLang);

    // If current level is 100% complete, unlock next level
    if (completion >= 100) {
      currentLevel = nextLevel;
    } else {
      // Stop at first incomplete level
      break;
    }
  }

  return currentLevel;
}
