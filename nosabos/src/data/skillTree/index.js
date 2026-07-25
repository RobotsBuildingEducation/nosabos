/**
 * Skill tree data access helpers.
 *
 * The aggregate skillTreeData.js remains the authoring source of truth.
 * Generated raw-level modules let the app download and transform only the
 * selected CEFR level and target-language curriculum.
 */

import { CEFR_LEVELS } from "../flashcards/common.js";
import { loadTargetCurriculum } from "./targetCurriculum/load.js";

export const SKILL_STATUS = {
  LOCKED: "locked",
  AVAILABLE: "available",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

const DEFAULT_TARGET_LANG = "es";
const SUPPORTED_TARGET_LANGS = new Set([
  "en",
  "es",
  "pt",
  "fr",
  "it",
  "nl",
  "nah",
  "ja",
  "ru",
  "de",
  "el",
  "pl",
  "ga",
  "yua",
]);

const levelLoaders = {
  "Pre-A1": () => import("./baseLevels/pre-a1.js"),
  A1: () => import("./baseLevels/a1.js"),
  A2: () => import("./baseLevels/a2.js"),
  B1: () => import("./baseLevels/b1.js"),
  B2: () => import("./baseLevels/b2.js"),
  C1: () => import("./baseLevels/c1.js"),
  C2: () => import("./baseLevels/c2.js"),
};

const learningPathCache = new Map();

function normalizeTargetLang(targetLang) {
  const languageKey = String(targetLang || DEFAULT_TARGET_LANG).toLowerCase();
  return SUPPORTED_TARGET_LANGS.has(languageKey)
    ? languageKey
    : DEFAULT_TARGET_LANG;
}

/**
 * Load the learning path for a specific target language and level.
 * Raw units and authored practice-language curriculum are separate dynamic
 * chunks. The transformed result is cached by language + level.
 */
export async function loadLearningPath(targetLang, level) {
  const loader = levelLoaders[level];
  if (!loader) return [];
  const languageKey = normalizeTargetLang(targetLang);
  const cacheKey = `${languageKey}:${level}`;
  if (learningPathCache.has(cacheKey)) {
    const cached = await learningPathCache.get(cacheKey);
    return cached.slice();
  }

  const pending = Promise.all([
    loader(),
    import("../skillTreeLevelBuilder.js"),
    loadTargetCurriculum(languageKey),
  ])
    .then(([rawModule, builderModule, authoredCurriculum]) =>
      builderModule.buildLearningPathLevel({
        rawUnits: rawModule.default,
        level,
        targetLang: languageKey,
        authoredCurriculum,
      }),
    )
    .catch((error) => {
      learningPathCache.delete(cacheKey);
      throw error;
    });

  learningPathCache.set(cacheKey, pending);
  const units = await pending;
  return units.slice();
}

/**
 * Load the learning path for multiple levels with level metadata.
 */
export async function loadMultiLevelLearningPath(
  targetLang,
  levels = ["A1", "A2"],
) {
  const requestedLevels = levels.filter((level) => CEFR_LEVELS.includes(level));
  const levelUnits = await Promise.all(
    requestedLevels.map((level) => loadLearningPath(targetLang, level)),
  );
  return levelUnits.flatMap((units, index) =>
    units.map((unit) => ({
      ...unit,
      cefrLevel: requestedLevels[index],
    })),
  );
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
 * Find the latest unlocked lesson (first IN_PROGRESS or AVAILABLE lesson by
 * sequential-unlock rules), mirroring the skill tree's own status logic.
 * `lessonsMap` is the per-language map of { [lessonId]: { status, ... } }.
 * Returns { lesson, unit } or null (e.g. tutorial incomplete or all done).
 */
export function getLatestUnlockedLesson(
  units = [],
  lessonsMap = {},
  isTutorialComplete = true,
) {
  if (!isTutorialComplete || !Array.isArray(units)) return null;

  for (let unitIndex = 0; unitIndex < units.length; unitIndex++) {
    const unit = units[unitIndex];
    const previousUnit = unitIndex > 0 ? units[unitIndex - 1] : null;

    for (
      let lessonIndex = 0;
      lessonIndex < unit.lessons.length;
      lessonIndex++
    ) {
      const lesson = unit.lessons[lessonIndex];
      const status = lessonsMap?.[lesson.id]?.status;

      if (status === SKILL_STATUS.IN_PROGRESS) {
        return { lesson, unit };
      }

      if (status !== SKILL_STATUS.COMPLETED) {
        let isPreviousCompleted = false;

        if (lessonIndex === 0) {
          if (unitIndex === 0) {
            isPreviousCompleted = true;
          } else if (previousUnit) {
            const prevUnitLastLesson =
              previousUnit.lessons[previousUnit.lessons.length - 1];
            isPreviousCompleted =
              lessonsMap?.[prevUnitLastLesson.id]?.status ===
              SKILL_STATUS.COMPLETED;
          }
        } else {
          isPreviousCompleted =
            lessonsMap?.[unit.lessons[lessonIndex - 1].id]?.status ===
            SKILL_STATUS.COMPLETED;
        }

        if (isPreviousCompleted) {
          return { lesson, unit };
        }
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
