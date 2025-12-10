/**
 * CEFR Progress Calculation Utilities
 *
 * Calculates completion percentages for each CEFR proficiency level
 * separately for skill tree lessons and flashcards
 */

import { CEFR_LEVELS, CEFR_LEVEL_COUNTS } from '../data/flashcards/common';

// Total lesson counts per CEFR level (based on actual data files)
export const LESSON_COUNTS = {
  A1: 77,
  A2: 72,
  B1: 60,
  B2: 48,
  C1: 40,
  C2: 32,
};

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

  // Count completed lessons for this CEFR level
  // Lesson IDs follow pattern: "lesson-a1-1", "lesson-pre-a1-1", etc.
  const levelPrefix = cefrLevel.toLowerCase();
  const completedCount = Object.keys(lessons).filter(lessonId => {
    const isInLevel = lessonId.includes(`-${levelPrefix}-`) || lessonId.includes(`-pre-${levelPrefix}-`);
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
