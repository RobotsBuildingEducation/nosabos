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
  runTransaction,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import { SKILL_STATUS } from "../data/skillTree/index.js";
import { LESSON_COUNTS, getLessonLevelFromId } from "./cefrProgress.js";
import {
  COURSE_PROGRESS_COLLECTION,
  COURSE_PROGRESS_SCHEMA_VERSION,
  normalizeCourseLevel,
  toCourseLevelKey,
} from "./courseProgress.js";
import {
  normalizeTutorConversationDraftMessages,
  TUTOR_CONVERSATION_DRAFT_VERSION,
} from "./tutorConversationDraft.js";

// Version the Tutor agenda checkpoint so full-XP records written before the
// app-owned agenda gate can be migrated without weakening completion rules for
// new lessons.
export const TUTOR_AGENDA_PROGRESS_SCHEMA_VERSION = 2;

function getLessonCourseLevel(lessonId, cefrLevel) {
  return normalizeCourseLevel(cefrLevel) || getLessonLevelFromId(lessonId);
}

function getCourseSummaryCompletionPatch(
  targetLang,
  mode,
  cefrLevel,
  shouldIncrement,
) {
  const levelKey = toCourseLevelKey(cefrLevel);
  return {
    schemaVersion: COURSE_PROGRESS_SCHEMA_VERSION,
    targetLang,
    [mode]: {
      levels: {
        [levelKey]: {
          ...(shouldIncrement ? { completed: increment(1) } : {}),
          total: LESSON_COUNTS[cefrLevel] || 0,
        },
      },
    },
    updatedAt: serverTimestamp(),
  };
}

/**
 * Initialize progress structure for a new user
 */
export function initializeProgress() {
  return {
    totalXp: 0,
    languageXp: {},
    languageLessons: {},
    tutorLanguageLessons: {},
    currentUnit: null,
    currentLesson: null,
    currentTutorLesson: null,
    lessons: {}, // { lessonId: { status, completedAt, xpEarned, attempts } }
    units: {}, // { unitId: { completedLessons, totalLessons, status } }
    lastActiveAt: new Date().toISOString(),
  };
}

/**
 * Start a lesson - mark it as in progress (but preserve COMPLETED and IN_PROGRESS status).
 * Saves lesson-owned `earnedXp` so progress resumes without counting XP from
 * unrelated learning surfaces.
 */
export async function startLesson(
  npub,
  lessonId,
  targetLang = "es",
  userProgress = null,
  cefrLevel = null,
) {
  if (!npub || !lessonId) return;
  void userProgress;

  const languageKey = (targetLang || "es").toLowerCase();
  const userRef = doc(database, "users", npub);
  const lessonProgressRef = doc(
    database,
    "users",
    npub,
    "languageLessons",
    `${languageKey}_${lessonId}`,
  );

  const lessonLevel = getLessonCourseLevel(lessonId, cefrLevel);

  try {
    return await runTransaction(database, async (transaction) => {
      const lessonSnapshot = await transaction.get(lessonProgressRef);
      const existingLessonData = lessonSnapshot.exists()
        ? lessonSnapshot.data()
        : {};
      const existingStatus = existingLessonData?.status;

      transaction.update(userRef, {
        "progress.currentLesson": lessonId,
        "progress.lastActiveAt": serverTimestamp(),
      });

      if (existingStatus === SKILL_STATUS.COMPLETED) {
        return existingLessonData;
      }

      if (existingStatus === SKILL_STATUS.IN_PROGRESS) {
        // Preserve trustworthy lesson-owned progress. Legacy records only have
        // lessonStartXp, which cannot distinguish lesson activity from XP
        // earned elsewhere, so they restart at zero.
        transaction.set(
          lessonProgressRef,
          {
            ...(lessonLevel ? { cefrLevel: lessonLevel } : {}),
            earnedXp:
              typeof existingLessonData?.earnedXp === "number"
                ? Math.max(0, existingLessonData.earnedXp)
                : 0,
            lessonStartXp: deleteField(),
            tutorAgendaProgress: deleteField(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        return {
          ...existingLessonData,
          ...(lessonLevel ? { cefrLevel: lessonLevel } : {}),
          earnedXp:
            typeof existingLessonData?.earnedXp === "number"
              ? Math.max(0, existingLessonData.earnedXp)
              : 0,
        };
      }

      const freshProgress = {
        targetLang: languageKey,
        lessonId,
        ...(lessonLevel ? { cefrLevel: lessonLevel } : {}),
        status: SKILL_STATUS.IN_PROGRESS,
        earnedXp: 0,
      };
      transaction.set(
        lessonProgressRef,
        {
          ...freshProgress,
          lessonStartXp: deleteField(),
          tutorAgendaProgress: deleteField(),
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return freshProgress;
    });
  } catch (error) {
    console.error("Error starting lesson:", error);
    throw error;
  }
}

/**
 * Start a Tutor lesson without mutating Skill Tree lesson progress.
 */
export async function startTutorLesson(
  npub,
  lessonId,
  targetLang = "es",
  userProgress = null,
  cefrLevel = null,
) {
  if (!npub || !lessonId) return;
  void userProgress;

  const languageKey = (targetLang || "es").toLowerCase();
  const userRef = doc(database, "users", npub);
  const lessonProgressRef = doc(
    database,
    "users",
    npub,
    "tutorLanguageLessons",
    `${languageKey}_${lessonId}`,
  );

  const lessonLevel = getLessonCourseLevel(lessonId, cefrLevel);

  try {
    return await runTransaction(database, async (transaction) => {
      const lessonSnapshot = await transaction.get(lessonProgressRef);
      const existingLessonData = lessonSnapshot.exists()
        ? lessonSnapshot.data()
        : {};
      const existingStatus = existingLessonData?.status;

      transaction.update(userRef, {
        "progress.currentTutorLesson": lessonId,
        "progress.lastActiveAt": serverTimestamp(),
      });

      if (existingStatus === SKILL_STATUS.COMPLETED) {
        return existingLessonData;
      }

      if (existingStatus === SKILL_STATUS.IN_PROGRESS) {
        transaction.set(
          lessonProgressRef,
          {
            ...(lessonLevel ? { cefrLevel: lessonLevel } : {}),
            lessonStartXp: deleteField(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        return {
          ...existingLessonData,
          ...(lessonLevel ? { cefrLevel: lessonLevel } : {}),
        };
      }

      const freshProgress = {
        targetLang: languageKey,
        lessonId,
        ...(lessonLevel ? { cefrLevel: lessonLevel } : {}),
        status: SKILL_STATUS.IN_PROGRESS,
        earnedXp: 0,
      };
      transaction.set(
        lessonProgressRef,
        {
          ...freshProgress,
          lessonStartXp: deleteField(),
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return freshProgress;
    });
  } catch (error) {
    console.error("Error starting Tutor lesson:", error);
    throw error;
  }
}

/**
 * Save the app-tracked Tutor lesson XP counter.
 * This is intentionally independent from the user's global/language XP.
 */
export async function saveTutorLessonEarnedXp(
  npub,
  lessonId,
  targetLang = "es",
  earnedXp = 0,
) {
  if (!npub || !lessonId) return;

  const languageKey = (targetLang || "es").toLowerCase();
  const lessonProgressRef = doc(
    database,
    "users",
    npub,
    "tutorLanguageLessons",
    `${languageKey}_${lessonId}`,
  );
  const normalizedEarnedXp = Math.max(0, Number(earnedXp) || 0);

  try {
    await setDoc(
      lessonProgressRef,
      {
        targetLang: languageKey,
        lessonId,
        earnedXp: normalizedEarnedXp,
        lessonStartXp: deleteField(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving Tutor lesson XP:", error);
    throw error;
  }
}

/**
 * Save a small reconnect transcript on the active Tutor lesson.
 *
 * Callers intentionally fire-and-forget this write. The Tutor UI debounces
 * finalized message snapshots so speaking/listening never waits on Firestore.
 */
export async function saveTutorConversationDraft(
  npub,
  lessonId,
  targetLang = "es",
  messages = [],
) {
  if (!npub || !lessonId) return;

  const languageKey = (targetLang || "es").toLowerCase();
  const lessonProgressRef = doc(
    database,
    "users",
    npub,
    "tutorLanguageLessons",
    `${languageKey}_${lessonId}`,
  );
  const normalizedMessages =
    normalizeTutorConversationDraftMessages(messages);
  if (!normalizedMessages.length) return;

  try {
    await setDoc(
      lessonProgressRef,
      {
        targetLang: languageKey,
        lessonId,
        conversationDraft: {
          version: TUTOR_CONVERSATION_DRAFT_VERSION,
          messages: normalizedMessages,
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving Tutor conversation draft:", error);
    throw error;
  }
}

/**
 * Save Tutor's agenda checkpoint for a lesson.
 * Tutor progress is intentionally separate from Skill Tree languageLessons.
 */
export async function saveTutorAgendaProgress(
  npub,
  lessonId,
  targetLang = "es",
  progress = {},
  quizAttempt = null,
) {
  if (!npub || !lessonId) return;

  const languageKey = (targetLang || "es").toLowerCase();
  const userRef = doc(database, "users", npub);
  const lessonProgressRef = doc(
    database,
    "users",
    npub,
    "tutorLanguageLessons",
    `${languageKey}_${lessonId}`,
  );
  const items = Object.entries(progress || {}).reduce((acc, [id, value]) => {
    if (id && value === true) acc[id] = true;
    return acc;
  }, {});
  const correctItems = Object.entries(quizAttempt?.correctItems || {}).reduce(
    (acc, [id, value]) => {
      if (id && value === true) acc[id] = true;
      return acc;
    },
    {},
  );
  const quiz = quizAttempt
    ? {
        correctItems,
        attemptNumber: Math.max(1, Number(quizAttempt.attemptNumber) || 1),
      }
    : null;

  try {
    await Promise.all([
      setDoc(
        userRef,
        {
          progress: {
            lastActiveAt: serverTimestamp(),
          },
        },
        { merge: true },
      ),
      setDoc(
        lessonProgressRef,
        {
          targetLang: languageKey,
          lessonId,
          tutorAgendaProgress: {
            schemaVersion: TUTOR_AGENDA_PROGRESS_SCHEMA_VERSION,
            items,
            ...(quiz ? { quiz } : {}),
            updatedAt: serverTimestamp(),
          },
          lessonStartXp: deleteField(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ]);
  } catch (error) {
    console.error("Error saving Tutor agenda progress:", error);
    throw error;
  }
}

/**
 * Complete a Tutor lesson without mutating Skill Tree lesson progress.
 */
export async function completeTutorLesson(
  npub,
  lessonId,
  xpReward,
  targetLang = "es",
  cefrLevel = null,
) {
  if (!npub || !lessonId || !xpReward) return;

  const languageKey = (targetLang || "es").toLowerCase();

  const userRef = doc(database, "users", npub);
  const lessonProgressRef = doc(
    database,
    "users",
    npub,
    "tutorLanguageLessons",
    `${languageKey}_${lessonId}`,
  );
  const lessonLevel = getLessonCourseLevel(lessonId, cefrLevel);
  const summaryRef = doc(
    database,
    "users",
    npub,
    COURSE_PROGRESS_COLLECTION,
    languageKey,
  );

  try {
    await runTransaction(database, async (transaction) => {
      const lessonSnapshot = await transaction.get(lessonProgressRef);
      const wasCompleted =
        lessonSnapshot.exists() &&
        lessonSnapshot.data()?.status === SKILL_STATUS.COMPLETED;

      transaction.update(userRef, {
        "progress.currentTutorLesson": null,
        "progress.lastActiveAt": serverTimestamp(),
      });
      transaction.set(
        lessonProgressRef,
        {
          targetLang: languageKey,
          lessonId,
          ...(lessonLevel ? { cefrLevel: lessonLevel } : {}),
          status: SKILL_STATUS.COMPLETED,
          completedAt: serverTimestamp(),
          xpEarned: xpReward,
          earnedXp: xpReward,
          lessonStartXp: deleteField(),
          tutorAgendaProgress: deleteField(),
          conversationDraft: deleteField(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      if (lessonLevel) {
        transaction.set(
          summaryRef,
          getCourseSummaryCompletionPatch(
            languageKey,
            "tutor",
            lessonLevel,
            !wasCompleted,
          ),
          { merge: true },
        );
      }
    });

    return true;
  } catch (error) {
    console.error("Error completing Tutor lesson:", error);
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
  cefrLevel = null,
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
  const lessonLevel = getLessonCourseLevel(lessonId, cefrLevel);
  const summaryRef = doc(
    database,
    "users",
    npub,
    COURSE_PROGRESS_COLLECTION,
    languageKey,
  );

  try {
    await runTransaction(database, async (transaction) => {
      const lessonSnapshot = await transaction.get(lessonProgressRef);
      const wasCompleted =
        lessonSnapshot.exists() &&
        lessonSnapshot.data()?.status === SKILL_STATUS.COMPLETED;

      transaction.update(userRef, {
        "progress.currentLesson": null,
        "progress.lastActiveAt": serverTimestamp(),
      });
      transaction.set(
        lessonProgressRef,
        {
          targetLang: languageKey,
          lessonId,
          ...(lessonLevel ? { cefrLevel: lessonLevel } : {}),
          status: SKILL_STATUS.COMPLETED,
          completedAt: serverTimestamp(),
          xpEarned: xpReward,
          earnedXp: xpReward,
          lessonStartXp: deleteField(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      if (lessonLevel) {
        transaction.set(
          summaryRef,
          getCourseSummaryCompletionPatch(
            languageKey,
            "skillTree",
            lessonLevel,
            !wasCompleted,
          ),
          { merge: true },
        );
      }
    });

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
export async function trackLessonAttempt(
  npub,
  lessonId,
  targetLang = "es",
  cefrLevel = null,
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
  const lessonLevel = getLessonCourseLevel(lessonId, cefrLevel);

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
          ...(lessonLevel ? { cefrLevel: lessonLevel } : {}),
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
          earnedXp: deleteField(),
          lessonStartXp: deleteField(),
          tutorAgendaProgress: deleteField(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ]);
  } catch (error) {
    console.error("Error abandoning lesson:", error);
  }
}
