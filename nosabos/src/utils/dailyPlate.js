// src/utils/dailyPlate.js
//
// The "Daily Plate" composes one light daily session out of three courses:
//   review — graded flashcard reviews        (progress.flashcardDailyActivity)
//   learn  — completed skill-tree lessons    (progress.lessonDailyActivity)
//   speak  — completed Tutor lessons         (progress.speakDailyActivity)
//
// Counts live on the user doc as per-language, per-day maps:
//   progress.<field>[langKey][YYYY-MM-DD] = number
// `flashcardDailyActivity` was already written by the flashcard review flow;
// the other two are bumped by awardXp() when callers tag a source.
import { doc, increment, runTransaction, setDoc } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { FLASHCARD_DAILY_TARGET, getLocalDayKey } from "./flashcardReview";

export const DAILY_PLATE_KINDS = ["review", "learn", "speak"];

// Guided session order: warm up speaking with the tutor, then the unlocked
// lesson, then close out with flashcard review.
export const DAILY_PLATE_COURSE_ORDER = ["speak", "learn", "review"];

export const DAILY_PLATE_TARGETS = {
  // Shared with the Cards screen's "Daily target" bar — one knob tunes both.
  review: FLASHCARD_DAILY_TARGET,
  learn: 1, // skill-tree lessons completed
  speak: 1, // Tutor lessons completed
};

export const DAILY_PLATE_BONUS_XP = 25;

export const DAILY_PLATE_ACTIVITY_FIELDS = {
  review: "flashcardDailyActivity",
  learn: "lessonDailyActivity",
  speak: "speakDailyActivity",
};

// awardXp() accepts these as its optional `source` argument. "review" is
// intentionally absent — flashcard reviews already increment their own
// counter in persistFlashcardReview.
export const PLATE_XP_SOURCE_FIELDS = {
  lesson: DAILY_PLATE_ACTIVITY_FIELDS.learn,
  speak: DAILY_PLATE_ACTIVITY_FIELDS.speak,
};

const PLATE_BONUS_FIELD = "plateBonusDailyActivity";

export function normalizePlateLang(targetLang) {
  return typeof targetLang === "string" && targetLang.trim()
    ? targetLang.trim().toLowerCase()
    : "es";
}

export function getDailyPlateDayKey(now = new Date()) {
  return getLocalDayKey(now) || "";
}

function readDayCount(progress, field, langKey, dayKey) {
  const value = Number(progress?.[field]?.[langKey]?.[dayKey]);
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

/**
 * Pure read of today's plate for one language. Everything comes from the
 * user object already held in the store, so callers re-render for free as
 * awards sync back.
 */
export function getDailyPlateSnapshot(user = {}, targetLang = "es", now = new Date()) {
  const langKey = normalizePlateLang(targetLang);
  const dayKey = getDailyPlateDayKey(now);
  const progress = user?.progress || {};

  const courses = DAILY_PLATE_KINDS.map((kind) => {
    const target = DAILY_PLATE_TARGETS[kind];
    const count = readDayCount(
      progress,
      DAILY_PLATE_ACTIVITY_FIELDS[kind],
      langKey,
      dayKey,
    );
    return {
      kind,
      count: Math.min(count, 999),
      target,
      done: count >= target,
      percent: target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0,
    };
  });

  const doneCount = courses.filter((course) => course.done).length;
  const byKind = Object.fromEntries(
    courses.map((course) => [course.kind, course]),
  );

  return {
    dayKey,
    langKey,
    courses,
    byKind,
    doneCount,
    isCleared: doneCount === courses.length,
    bonusAwarded: Boolean(progress?.[PLATE_BONUS_FIELD]?.[langKey]?.[dayKey]),
  };
}

/**
 * First incomplete course in guided-session order, or null when the plate
 * is cleared.
 */
export function getNextPlateCourse(snapshot) {
  return (
    DAILY_PLATE_COURSE_ORDER.find((kind) => !snapshot?.byKind?.[kind]?.done) ||
    null
  );
}

/* -----------------------------------
   Guided session persistence

   A "session" is the user pressing "Start daily practice" — while active,
   the app auto-advances them through the remaining courses. It lives in
   localStorage keyed to a day + language so a stale session never carries
   into tomorrow or another language.
----------------------------------- */
const PLATE_SESSION_STORAGE_KEY = "dailyPlateSession";

export function readPlateSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLATE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function startPlateSession(langKey, dayKey, now = new Date()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PLATE_SESSION_STORAGE_KEY,
      JSON.stringify({ langKey, dayKey, startedAt: now.toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

export function clearPlateSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PLATE_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isPlateSessionFor(session, langKey, dayKey) {
  return Boolean(
    session && session.langKey === langKey && session.dayKey === dayKey,
  );
}

/**
 * Count one plate action right now, independent of XP. The Tutor uses this
 * for "speak" when a Tutor lesson completes — its XP is success-gated and
 * varies per lesson, so the plate counts the completion itself. Bumps the
 * local store first so the plate UI and conductor react immediately, then
 * persists an atomic increment.
 */
export async function recordPlateActivity(
  npub,
  kind,
  targetLang,
  now = new Date(),
) {
  const field = DAILY_PLATE_ACTIVITY_FIELDS[kind];
  const langKey = normalizePlateLang(targetLang);
  const dayKey = getDailyPlateDayKey(now);
  if (!npub || !field || !dayKey) return;

  try {
    const store = useUserStore.getState?.();
    const currentUser = store?.user;
    if (store?.patchUser && currentUser) {
      const progress = currentUser.progress || {};
      const langMap = progress?.[field]?.[langKey] || {};
      const nextCount = (Number(langMap?.[dayKey]) || 0) + 1;
      store.patchUser({
        progress: {
          ...progress,
          [field]: {
            ...(progress[field] || {}),
            [langKey]: { ...langMap, [dayKey]: nextCount },
          },
        },
      });
    }
  } catch (error) {
    console.warn("Failed to sync plate activity locally:", error);
  }

  try {
    await setDoc(
      doc(database, "users", npub),
      {
        progress: {
          [field]: { [langKey]: { [dayKey]: increment(1) } },
        },
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Failed to record plate activity:", error);
  }
}

/**
 * Returns a progress object with today's bonus marker applied — used to
 * patch the local user store immediately after a successful claim so the
 * claiming effect doesn't refire while Firestore catches up.
 */
export function applyPlateBonusMarker(
  progress = {},
  langKey,
  dayKey,
  at = new Date().toISOString(),
) {
  return {
    ...progress,
    [PLATE_BONUS_FIELD]: {
      ...(progress?.[PLATE_BONUS_FIELD] || {}),
      [langKey]: {
        ...(progress?.[PLATE_BONUS_FIELD]?.[langKey] || {}),
        [dayKey]: at,
      },
    },
  };
}

/**
 * Marks today's plate bonus as claimed exactly once per language per day.
 * Returns true only for the writer that won, so the caller knows whether to
 * award the bonus XP. The marker is written before the XP so a race can never
 * double-pay.
 */
export async function claimDailyPlateBonus(npub, targetLang, now = new Date()) {
  if (!npub) return false;
  const langKey = normalizePlateLang(targetLang);
  const dayKey = getDailyPlateDayKey(now);
  if (!dayKey) return false;

  const ref = doc(database, "users", npub);
  let claimed = false;

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists() ? snap.data() : {};
    if (data?.progress?.[PLATE_BONUS_FIELD]?.[langKey]?.[dayKey]) {
      claimed = false;
      return;
    }
    tx.set(
      ref,
      {
        progress: {
          [PLATE_BONUS_FIELD]: {
            [langKey]: { [dayKey]: now.toISOString() },
          },
        },
      },
      { merge: true },
    );
    claimed = true;
  });

  return claimed;
}
