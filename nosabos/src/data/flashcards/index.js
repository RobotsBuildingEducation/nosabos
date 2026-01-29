/**
 * Lazy-loading flashcard data manager
 *
 * This module provides efficient loading of flashcard data by CEFR level.
 * Instead of loading all 1,050 flashcards at once, it loads only what's needed
 * based on user progress, significantly improving performance.
 */

import { CEFR_LEVELS, CEFR_LEVEL_COUNTS } from './common';

// Cache for loaded flashcard data
const flashcardCache = new Map();

// Dynamic imports for each CEFR level
const levelLoaders = {
  "Pre-A1": () => import('./pre-a1.js').then(m => m.FLASHCARDS_PRE_A1),
  A1: () => import('./a1.js').then(m => m.FLASHCARDS_A1),
  A2: () => import('./a2.js').then(m => m.FLASHCARDS_A2),
  B1: () => import('./b1.js').then(m => m.FLASHCARDS_B1),
  B2: () => import('./b2.js').then(m => m.FLASHCARDS_B2),
  C1: () => import('./c1.js').then(m => m.FLASHCARDS_C1),
  C2: () => import('./c2.js').then(m => m.FLASHCARDS_C2),
};

/**
 * Load flashcards for a specific CEFR level
 * @param {string} level - CEFR level (Pre-A1, A1, A2, B1, B2, C1, C2)
 * @returns {Promise<Array>} Flashcards for the specified level
 */
export async function loadFlashcardsForLevel(level) {
  if (flashcardCache.has(level)) {
    return flashcardCache.get(level);
  }

  const loader = levelLoaders[level];
  if (!loader) {
    console.warn(`No loader found for level ${level}`);
    return [];
  }

  try {
    const flashcards = await loader();
    flashcardCache.set(level, flashcards);
    return flashcards;
  } catch (error) {
    console.error(`Error loading flashcards for level ${level}:`, error);
    return [];
  }
}

/**
 * Load flashcards for multiple CEFR levels
 * @param {Array<string>} levels - Array of CEFR levels to load
 * @returns {Promise<Array>} Combined flashcards from all specified levels
 */
export async function loadFlashcardsForLevels(levels) {
  const promises = levels.map(level => loadFlashcardsForLevel(level));
  const results = await Promise.all(promises);
  return results.flat();
}

/**
 * Get the current CEFR level and next level based on user progress
 * @param {Object} userProgress - User progress object with flashcard completion data
 * @returns {Object} { currentLevel, nextLevel, completedInCurrentLevel, totalInCurrentLevel }
 */
export function getUserProgressLevel(userProgress = {}) {
  const flashcards = userProgress.flashcards || {};
  const completedIds = new Set(
    Object.keys(flashcards).filter(id => flashcards[id]?.completed)
  );

  let cumulativeCount = 0;
  let currentLevel = 'Pre-A1';
  let completedInCurrentLevel = 0;

  for (const level of CEFR_LEVELS) {
    const levelCount = CEFR_LEVEL_COUNTS[level];
    const nextCumulativeCount = cumulativeCount + levelCount;

    // Count how many cards in this level are completed
    const completedInLevel = Array.from(completedIds).filter(id =>
      id.startsWith(level.toLowerCase())
    ).length;

    if (completedIds.size >= cumulativeCount && completedIds.size < nextCumulativeCount) {
      currentLevel = level;
      completedInCurrentLevel = completedInLevel;
      break;
    }

    cumulativeCount = nextCumulativeCount;
  }

  // Determine next level
  const currentLevelIndex = CEFR_LEVELS.indexOf(currentLevel);
  const nextLevel = currentLevelIndex < CEFR_LEVELS.length - 1
    ? CEFR_LEVELS[currentLevelIndex + 1]
    : null;

  return {
    currentLevel,
    nextLevel,
    completedInCurrentLevel,
    totalInCurrentLevel: CEFR_LEVEL_COUNTS[currentLevel],
    isCurrentLevelComplete: completedInCurrentLevel === CEFR_LEVEL_COUNTS[currentLevel],
  };
}

/**
 * Load relevant flashcards based on user progress
 * Loads current level + next level for smooth progression
 * @param {Object} userProgress - User progress object
 * @returns {Promise<Array>} Relevant flashcards
 */
export async function loadRelevantFlashcards(userProgress = {}) {
  const { currentLevel, nextLevel, isCurrentLevelComplete } = getUserProgressLevel(userProgress);

  // Load current level and next level
  const levelsToLoad = [currentLevel];
  if (nextLevel && (isCurrentLevelComplete || Math.random() > 0.5)) {
    // If current level is complete, or user is more than halfway through, preload next
    levelsToLoad.push(nextLevel);
  }

  return loadFlashcardsForLevels(levelsToLoad);
}

/**
 * Preload all flashcard data (for when user wants to see everything)
 * @returns {Promise<Array>} All flashcards
 */
export async function loadAllFlashcards() {
  return loadFlashcardsForLevels(CEFR_LEVELS);
}

/**
 * Clear the flashcard cache (useful for testing or memory management)
 */
export function clearFlashcardCache() {
  flashcardCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  const cachedLevels = Array.from(flashcardCache.keys());
  const cachedCount = cachedLevels.reduce((total, level) => {
    return total + (flashcardCache.get(level)?.length || 0);
  }, 0);

  return {
    cachedLevels,
    cachedCount,
    totalLevels: CEFR_LEVELS.length,
  };
}
