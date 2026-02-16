/**
 * Progress Tracking Utilities
 *
 * Handles lesson progress tracking, XP awards, and skill tree state management
 */

import {
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import { SKILL_STATUS } from "../data/skillTreeData";

/**
 * Initialize progress structure for a new user
 */
export function initializeProgress() {
  return {
    totalXp: 0,
    languageXp: {},
    languageLessons: {},
    currentUnit: null,
    currentLesson: null,
    lessons: {}, // { lessonId: { status, completedAt, xpEarned, attempts } }
    units: {}, // { unitId: { completedLessons, totalLessons, status } }
    lastActiveAt: new Date().toISOString(),
  };
}

/**
 * Start a lesson - mark it as in progress (but preserve COMPLETED and IN_PROGRESS status).
 * Saves `lessonStartXp` so users can resume mid-lesson progress across sessions.
 */
export async function startLesson(
  npub,
  lessonId,
  targetLang = "es",
  userProgress = null,
  currentXp = 0,
) {
  if (!npub || !lessonId) return;

  const languageKey = (targetLang || "es").toLowerCase();
  const userRef = doc(database, "users", npub);
  const lessonProgressRef = doc(
    database,
    "users",
    npub,
    "languageLessons",
    `${languageKey}_${lessonId}`,
  );

  // Check existing lesson status to decide what to write
  const existingLessonData =
    userProgress?.languageLessons?.[languageKey]?.[lessonId] ||
    userProgress?.lessons?.[lessonId];
  const existingStatus = existingLessonData?.status;

  const isAlreadyCompleted = existingStatus === SKILL_STATUS.COMPLETED;
  const isAlreadyInProgress = existingStatus === SKILL_STATUS.IN_PROGRESS;

  try {
    const updateData = {
      [`progress.currentLesson`]: lessonId,
      "progress.lastActiveAt": serverTimestamp(),
    };

    // Determine the lesson doc write:
    // - COMPLETED: don't touch (preserves unlock chain)
    // - IN_PROGRESS: only bump updatedAt (preserve lessonStartXp & startedAt)
    // - Otherwise (new/available): write full IN_PROGRESS with lessonStartXp
    let lessonDocPromise;
    if (isAlreadyCompleted) {
      lessonDocPromise = Promise.resolve();
    } else if (isAlreadyInProgress) {
      // Lesson already in progress — preserve lessonStartXp and startedAt
      lessonDocPromise = setDoc(
        lessonProgressRef,
        {
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      // Fresh start — record the baseline XP so progress can be restored later
      lessonDocPromise = setDoc(
        lessonProgressRef,
        {
          targetLang: languageKey,
          lessonId,
          status: SKILL_STATUS.IN_PROGRESS,
          lessonStartXp: currentXp,
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    await Promise.all([updateDoc(userRef, updateData), lessonDocPromise]);
  } catch (error) {
    console.error("Error starting lesson:", error);
    throw error;
  }
}

/**
 * Complete a lesson - marks it complete but does NOT award XP.
 * Callers should use awardXp() separately to handle XP with proper daily goal tracking.
 */
export async function completeLesson(
  npub,
  lessonId,
  xpReward,
  targetLang = "es",
) {
  if (!npub || !lessonId || !xpReward) return;

  const languageKey = (targetLang || "es").toLowerCase();

  const userRef = doc(database, "users", npub);
  const lessonProgressRef = doc(
    database,
    "users",
    npub,
    "languageLessons",
    `${languageKey}_${lessonId}`,
  );

  try {
    await Promise.all([
      updateDoc(userRef, {
        "progress.currentLesson": null,
        "progress.lastActiveAt": serverTimestamp(),
      }),
      setDoc(
        lessonProgressRef,
        {
          targetLang: languageKey,
          lessonId,
          status: SKILL_STATUS.COMPLETED,
          completedAt: serverTimestamp(),
          xpEarned: xpReward,
          lessonStartXp: deleteField(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ]);

    return true;
  } catch (error) {
    console.error("Error completing lesson:", error);
    throw error;
  }
}

/**
 * Safely get XP for a specific language from stored progress
 */
export function getLanguageXp(progress, targetLang) {
  if (!progress) return 0;
  const lang = targetLang || progress?.targetLang || "es";
  const xpMap = progress.languageXp;

  // If we have a per-language XP map, prefer it exclusively so each language
  // tracks its own progress independently. Missing entries should resolve to 0
  // instead of falling back to total XP so that switching languages shows the
  // correct, isolated progress.
  if (xpMap && typeof xpMap === "object") {
    const langXp = xpMap[lang];
    return typeof langXp === "number" ? langXp : 0;
  }

  // Legacy fallback: before per-language tracking existed, totalXp was the only
  // source of truth. If no language map is present, treat totalXp as the
  // language's XP so existing users retain their progress.
  if (typeof progress.totalXp === "number") {
    return progress.totalXp;
  }

  return 0;
}

/**
 * Track lesson attempt (for analytics)
 */
export async function trackLessonAttempt(npub, lessonId, targetLang = "es") {
  if (!npub || !lessonId) return;

  const languageKey = (targetLang || "es").toLowerCase();
  const userRef = doc(database, "users", npub);
  const lessonProgressRef = doc(
    database,
    "users",
    npub,
    "languageLessons",
    `${languageKey}_${lessonId}`,
  );

  try {
    await Promise.all([
      updateDoc(userRef, {
        "progress.lastActiveAt": serverTimestamp(),
      }),
      setDoc(
        lessonProgressRef,
        {
          targetLang: languageKey,
          lessonId,
          attempts: increment(1),
          lastAttemptAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ]);
  } catch (error) {
    console.error("Error tracking lesson attempt:", error);
  }
}

/**
 * Get lesson status from user progress
 */
export function getLessonStatus(userProgress, lesson, targetLang) {
  const lang =
    targetLang || userProgress?.targetLang || userProgress?.language || "es";
  const lessonProgress =
    userProgress?.languageLessons?.[lang]?.[lesson.id] ||
    userProgress?.lessons?.[lesson.id];

  if (lessonProgress?.status === SKILL_STATUS.COMPLETED) {
    return SKILL_STATUS.COMPLETED;
  }

  if (lessonProgress?.status === SKILL_STATUS.IN_PROGRESS) {
    return SKILL_STATUS.IN_PROGRESS;
  }

  // Test unlock: check for specific nsec in local storage
  const testNsec =
    typeof window !== "undefined" ? localStorage.getItem("local_nsec") : null;
  const isTestUnlocked =
    testNsec ===
    "nsec1akcvuhtemz3kw58gvvfg38uucu30zfsahyt6ulqapx44lype6a9q42qevv";

  if (isTestUnlocked) {
    return SKILL_STATUS.AVAILABLE;
  }

  const langXp = getLanguageXp(userProgress, lang);
  if (langXp >= lesson.xpRequired) {
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
  const targetLang = user?.progress?.targetLang || "es";
  const level = user?.progress?.level || "beginner";

  return { targetLang, level };
}

/**
 * Calculate completion percentage for the current level
 */
export function calculateLevelCompletion(units, userProgress) {
  if (!units || units.length === 0) return 0;

  const totalLessons = units.reduce(
    (sum, unit) => sum + unit.lessons.length,
    0,
  );
  const completedLessons = units.reduce(
    (sum, unit) =>
      sum +
      unit.lessons.filter(
        (lesson) =>
          userProgress?.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED,
      ).length,
    0,
  );

  return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
}

/**
 * Find the next recommended lesson for the user
 */
export function findNextLesson(units, userProgress, targetLang) {
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      const status = getLessonStatus(userProgress, lesson, targetLang);

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

  const userRef = doc(database, "users", npub);

  try {
    await updateDoc(userRef, {
      "progress.totalXp": increment(bonusXp),
      xp: increment(bonusXp),
      dailyXp: increment(bonusXp),
      [`progress.milestones.${milestoneType}`]: serverTimestamp(),
    });

    // Dispatch milestone event
    window.dispatchEvent(
      new CustomEvent("milestone:achieved", {
        detail: { type: milestoneType, bonusXp },
      }),
    );

    return true;
  } catch (error) {
    console.error("Error awarding milestone bonus:", error);
    throw error;
  }
}

/**
 * Reset current lesson if user abandons it
 */
export async function abandonLesson(npub, lessonId, targetLang = "es") {
  if (!npub || !lessonId) return;

  const languageKey = (targetLang || "es").toLowerCase();
  const userRef = doc(database, "users", npub);
  const lessonProgressRef = doc(
    database,
    "users",
    npub,
    "languageLessons",
    `${languageKey}_${lessonId}`,
  );

  try {
    await Promise.all([
      updateDoc(userRef, {
        "progress.currentLesson": null,
        "progress.lastActiveAt": serverTimestamp(),
      }),
      setDoc(
        lessonProgressRef,
        {
          targetLang: languageKey,
          lessonId,
          status: SKILL_STATUS.AVAILABLE,
          lessonStartXp: deleteField(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ]);
  } catch (error) {
    console.error("Error abandoning lesson:", error);
  }
}
