/**
 * Skill tree data access helpers.
 *
 * The lesson tree itself lives in ../skillTreeData.js (the aggregate source of
 * truth). This module exposes it to components via lightweight loaders and a
 * few pure progress helpers. (The old per-level lazy-loading modules
 * a1.js…c2.js were unused duplicates and have been removed.)
 */

import { CEFR_LEVELS } from "../flashcards/common.js";

export const SKILL_STATUS = {
  LOCKED: "locked",
  AVAILABLE: "available",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

async function loadAggregateSkillTreeData() {
  return import("../skillTreeData.js");
}

/**
 * Load the learning path for a specific target language and level.
 * Uses the aggregate data source through a dynamic import so the lesson tree
 * stays out of the main bundle.
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
