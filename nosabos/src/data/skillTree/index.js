/**
 * Lazy-loading skill tree data manager
 *
 * This module provides efficient loading of skill tree data by CEFR level.
 * Instead of loading all skill tree data at once, it loads only what's needed
 * based on user progress, significantly improving performance.
 */

import { CEFR_LEVELS } from "../flashcards/common.js";

export const SKILL_STATUS = {
  LOCKED: "locked",
  AVAILABLE: "available",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

// Cache for loaded skill tree data
const skillTreeCache = new Map();

// Dynamic imports for each CEFR level
const levelLoaders = {
  "Pre-A1": () => import("./pre-a1.js").then((m) => m.SKILL_TREE_PRE_A1),
  A1: () => import("./a1.js").then((m) => m.SKILL_TREE_A1),
  A2: () => import("./a2.js").then((m) => m.SKILL_TREE_A2),
  B1: () => import("./b1.js").then((m) => m.SKILL_TREE_B1),
  B2: () => import("./b2.js").then((m) => m.SKILL_TREE_B2),
  C1: () => import("./c1.js").then((m) => m.SKILL_TREE_C1),
  C2: () => import("./c2.js").then((m) => m.SKILL_TREE_C2),
};

/**
 * Load skill tree data for a specific CEFR level
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1, C2)
 * @returns {Promise<Array>} Skill tree units for the specified level
 */
export async function loadSkillTreeForLevel(level) {
  if (skillTreeCache.has(level)) {
    return skillTreeCache.get(level);
  }

  const loader = levelLoaders[level];
  if (!loader) {
    console.warn(`No loader found for level ${level}`);
    return [];
  }

  try {
    const skillTree = await loader();
    skillTreeCache.set(level, skillTree);
    return skillTree;
  } catch (error) {
    console.error(`Error loading skill tree for level ${level}:`, error);
    return [];
  }
}

/**
 * Load skill tree data for multiple CEFR levels
 * @param {Array<string>} levels - Array of CEFR levels to load
 * @returns {Promise<Array>} Combined skill tree units from all specified levels
 */
export async function loadSkillTreeForLevels(levels) {
  const promises = levels.map((level) => loadSkillTreeForLevel(level));
  const results = await Promise.all(promises);
  return results.flat();
}

async function loadAggregateSkillTreeData() {
  return import("../skillTreeData.js");
}

/**
 * Load the learning path for a specific target language and level.
 * Uses the current aggregate data source through a dynamic import so the
 * lesson tree stays behaviorally identical while leaving the main bundle.
 */
export async function loadLearningPath(targetLang, level) {
  const { getLearningPath } = await loadAggregateSkillTreeData();
  return getLearningPath(targetLang, level);
}

/**
 * Load the learning path for multiple levels with level metadata.
 */
export async function loadMultiLevelLearningPath(
  targetLang,
  levels = ["A1", "A2"],
) {
  const { getMultiLevelLearningPath } = await loadAggregateSkillTreeData();
  return getMultiLevelLearningPath(targetLang, levels);
}

/**
 * Get the next available lesson for a user based on sequential completion.
 */
export function getNextLesson(units, userProgress) {
  for (let unitIndex = 0; unitIndex < units.length; unitIndex++) {
    const unit = units[unitIndex];
    for (
      let lessonIndex = 0;
      lessonIndex < unit.lessons.length;
      lessonIndex++
    ) {
      const lesson = unit.lessons[lessonIndex];
      if (!userProgress?.[lesson.id]?.completed) {
        return { lesson, unitIndex, lessonIndex, unit };
      }
    }
  }
  return null;
}

/**
 * Get overall unit progress as a percentage.
 */
export function getUnitProgress(unit, userProgress) {
  const total = unit.lessons.length;
  if (!total) return 0;
  const completed = unit.lessons.filter(
    (lesson) => userProgress?.[lesson.id]?.completed,
  ).length;
  return Math.round((completed / total) * 100);
}

/**
 * Determine which CEFR levels to load based on user progress
 * @param {Object} userProgress - User progress object
 * @returns {Array<string>} Levels to load
 */
export function getLevelsToLoad(userProgress = {}) {
  const lessons = userProgress.lessons || {};

  // Find the highest CEFR level the user has started
  let highestStartedLevel = "Pre-A1";
  for (const lessonId in lessons) {
    // Extract CEFR level from lesson ID (assumes format like "lesson-a1-1", "lesson-b2-3", etc.)
    const match = lessonId.match(/lesson-([a-z]\d+)/i);
    if (match) {
      const level = match[1].toUpperCase();
      const levelIndex = CEFR_LEVELS.indexOf(level);
      const currentHighestIndex = CEFR_LEVELS.indexOf(highestStartedLevel);
      if (levelIndex > currentHighestIndex) {
        highestStartedLevel = level;
      }
    }
  }

  // Load current level + next level for smooth progression
  const currentLevelIndex = CEFR_LEVELS.indexOf(highestStartedLevel);
  const levelsToLoad = [highestStartedLevel];

  // Add next level if available
  if (currentLevelIndex < CEFR_LEVELS.length - 1) {
    levelsToLoad.push(CEFR_LEVELS[currentLevelIndex + 1]);
  }

  return levelsToLoad;
}

/**
 * Load relevant skill tree data based on user progress
 * @param {Object} userProgress - User progress object
 * @returns {Promise<Array>} Relevant skill tree units
 */
export async function loadRelevantSkillTree(userProgress = {}) {
  const levelsToLoad = getLevelsToLoad(userProgress);
  return loadSkillTreeForLevels(levelsToLoad);
}

/**
 * Preload all skill tree data
 * @returns {Promise<Array>} All skill tree units
 */
export async function loadAllSkillTree() {
  return loadSkillTreeForLevels(CEFR_LEVELS);
}

/**
 * Clear the skill tree cache
 */
export function clearSkillTreeCache() {
  skillTreeCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getSkillTreeCacheStats() {
  const cachedLevels = Array.from(skillTreeCache.keys());
  const cachedCount = cachedLevels.reduce((total, level) => {
    return total + (skillTreeCache.get(level)?.length || 0);
  }, 0);

  return {
    cachedLevels,
    cachedCount,
    totalLevels: CEFR_LEVELS.length,
  };
}
