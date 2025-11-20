/**
 * Progress Tracking Utilities
 *
 * Handles lesson progress tracking, XP awards, and skill tree state management
 */

import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { database } from '../firebaseResources/firebaseResources';
import { SKILL_STATUS } from '../data/skillTreeData';

/**
 * Initialize progress structure for a new user
 */
export function initializeProgress() {
  return {
    totalXp: 0,
    languageXp: {},
    currentUnit: null,
    currentLesson: null,
    lessons: {}, // { lessonId: { status, completedAt, xpEarned, attempts } }
    units: {}, // { unitId: { completedLessons, totalLessons, status } }
    lastActiveAt: new Date().toISOString(),
  };
}

/**
 * Start a lesson - mark it as in progress
 */
export async function startLesson(npub, lessonId) {
  if (!npub || !lessonId) return;

  const userRef = doc(database, 'users', npub);

  try {
    await updateDoc(userRef, {
      [`progress.currentLesson`]: lessonId,
      [`progress.lessons.${lessonId}.status`]: SKILL_STATUS.IN_PROGRESS,
      [`progress.lessons.${lessonId}.startedAt`]: serverTimestamp(),
      'progress.lastActiveAt': serverTimestamp(),
    });
  } catch (error) {
    console.error('Error starting lesson:', error);
    throw error;
  }
}

/**
 * Complete a lesson and award XP
 */
export async function completeLesson(
  npub,
  lessonId,
  xpReward,
  targetLang = 'es'
) {
  if (!npub || !lessonId || !xpReward) return;

  const languageKey = targetLang || 'es';
  const languageXpField = `progress.languageXp.${languageKey}`;

  const userRef = doc(database, 'users', npub);

  try {
    await updateDoc(userRef, {
      // Update lesson status
      [`progress.lessons.${lessonId}.status`]: SKILL_STATUS.COMPLETED,
      [`progress.lessons.${lessonId}.completedAt`]: serverTimestamp(),
      [`progress.lessons.${lessonId}.xpEarned`]: xpReward,

      // Award XP
      'progress.totalXp': increment(xpReward),
      xp: increment(xpReward), // Also update global XP
      [languageXpField]: increment(xpReward),

      // Update daily XP (for daily goals)
      dailyXp: increment(xpReward),

      // Clear current lesson
      'progress.currentLesson': null,
      'progress.lastActiveAt': serverTimestamp(),
    });

    // Dispatch XP award event for celebration animations
    window.dispatchEvent(
      new CustomEvent('xp:awarded', {
        detail: { amount: xpReward, source: 'lesson', lessonId },
      })
    );

    return true;
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw error;
  }
}

/**
 * Safely get XP for a specific language from stored progress
 */
export function getLanguageXp(progress, targetLang) {
  if (!progress) return 0;
  const lang = targetLang || progress?.targetLang || 'es';
  const xpMap = progress.languageXp;

  // If we have a per-language XP map, prefer it exclusively so each language
  // tracks its own progress independently. Missing entries should resolve to 0
  // instead of falling back to total XP so that switching languages shows the
  // correct, isolated progress.
  if (xpMap && typeof xpMap === 'object') {
    const langXp = xpMap[lang];
    return typeof langXp === 'number' ? langXp : 0;
  }

  // Legacy fallback: before per-language tracking existed, totalXp was the only
  // source of truth. If no language map is present, treat totalXp as the
  // language's XP so existing users retain their progress.
  if (typeof progress.totalXp === 'number') {
    return progress.totalXp;
  }

  return 0;
}

/**
 * Track lesson attempt (for analytics)
 */
export async function trackLessonAttempt(npub, lessonId) {
  if (!npub || !lessonId) return;

  const userRef = doc(database, 'users', npub);

  try {
    await updateDoc(userRef, {
      [`progress.lessons.${lessonId}.attempts`]: increment(1),
      [`progress.lessons.${lessonId}.lastAttemptAt`]: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error tracking lesson attempt:', error);
  }
}

/**
 * Get lesson status from user progress
 */
export function getLessonStatus(userProgress, lesson) {
  const lessonProgress = userProgress?.lessons?.[lesson.id];

  if (lessonProgress?.status === SKILL_STATUS.COMPLETED) {
    return SKILL_STATUS.COMPLETED;
  }

  if (lessonProgress?.status === SKILL_STATUS.IN_PROGRESS) {
    return SKILL_STATUS.IN_PROGRESS;
  }

  if ((userProgress?.totalXp || 0) >= lesson.xpRequired) {
    return SKILL_STATUS.AVAILABLE;
  }

  return SKILL_STATUS.LOCKED;
}

/**
 * Check if user has completed onboarding and should see skill tree
 */
export function shouldShowSkillTree(user) {
  return user?.onboarding?.completed === true;
}

/**
 * Get user's current learning path based on their progress settings
 */
export function getUserLearningPath(user) {
  const targetLang = user?.progress?.targetLang || 'es';
  const level = user?.progress?.level || 'beginner';

  return { targetLang, level };
}

/**
 * Calculate completion percentage for the current level
 */
export function calculateLevelCompletion(units, userProgress) {
  if (!units || units.length === 0) return 0;

  const totalLessons = units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const completedLessons = units.reduce(
    (sum, unit) =>
      sum +
      unit.lessons.filter(
        (lesson) => userProgress?.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED
      ).length,
    0
  );

  return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
}

/**
 * Find the next recommended lesson for the user
 */
export function findNextLesson(units, userProgress) {
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      const status = getLessonStatus(userProgress, lesson);

      if (status === SKILL_STATUS.IN_PROGRESS) {
        return { lesson, unit, status };
      }

      if (status === SKILL_STATUS.AVAILABLE) {
        return { lesson, unit, status };
      }
    }
  }

  return null; // All lessons completed or all locked
}

/**
 * Award bonus XP for milestones (e.g., completing all lessons in a unit)
 */
export async function awardMilestoneBonus(npub, milestoneType, bonusXp) {
  if (!npub || !bonusXp) return;

  const userRef = doc(database, 'users', npub);

  try {
    await updateDoc(userRef, {
      'progress.totalXp': increment(bonusXp),
      xp: increment(bonusXp),
      dailyXp: increment(bonusXp),
      [`progress.milestones.${milestoneType}`]: serverTimestamp(),
    });

    // Dispatch milestone event
    window.dispatchEvent(
      new CustomEvent('milestone:achieved', {
        detail: { type: milestoneType, bonusXp },
      })
    );

    return true;
  } catch (error) {
    console.error('Error awarding milestone bonus:', error);
    throw error;
  }
}

/**
 * Reset current lesson if user abandons it
 */
export async function abandonLesson(npub, lessonId) {
  if (!npub || !lessonId) return;

  const userRef = doc(database, 'users', npub);

  try {
    await updateDoc(userRef, {
      [`progress.lessons.${lessonId}.status`]: SKILL_STATUS.AVAILABLE,
      'progress.currentLesson': null,
    });
  } catch (error) {
    console.error('Error abandoning lesson:', error);
  }
}
