export const DAILY_QUEST_FLASHCARD_TARGET_MIN = 4;
export const DAILY_QUEST_FLASHCARD_TARGET_DEFAULT = 5;
export const DAILY_QUEST_FLASHCARD_TARGET_MAX = 6;

function hashString(value) {
  const text = String(value || "");
  let hash = 1779033703 ^ text.length;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

/**
 * Pick a stable 4-6 card target for one learner's daily quest.
 *
 * Four, five, and six are equally likely. Including the learner, language, and
 * local day keeps the target fresh while ensuring it does not change after a
 * refresh or between devices.
 */
export function getDailyQuestFlashcardTarget({
  userKey = "",
  langKey = "",
  dayKey = "",
} = {}) {
  const bucket =
    hashString(`review|${userKey}|${langKey}|${dayKey}`) % 3;
  return DAILY_QUEST_FLASHCARD_TARGET_MIN + bucket;
}

export const FLASHCARD_RANDOM_DAILY_TARGET_MIN = 3;
export const FLASHCARD_RANDOM_DAILY_TARGET_MAX = 7;

/**
 * Determine the daily goal for flashcard mode:
 * 1. If Today's Focus includes flashcards (the "review" quest), use Today's Focus amount.
 * 2. If Today's Focus does not include flashcards, pick a random number between 3 and 7 (inclusive).
 * Stable per day+user+language so it does not change mid-day or across refreshes.
 */
export function getFlashcardDailyTarget({
  plateSnapshot,
  user,
  userKey = "",
  langKey = "",
  dayKey = "",
} = {}) {
  const reviewCourse =
    plateSnapshot?.byKind?.review ||
    plateSnapshot?.courses?.find((c) => c.kind === "review");
  if (
    reviewCourse &&
    Number.isFinite(reviewCourse.target) &&
    reviewCourse.target > 0
  ) {
    return reviewCourse.target;
  }

  const resolvedUserKey =
    userKey ||
    user?.local_npub ||
    user?.identity ||
    user?.id ||
    plateSnapshot?.userKey ||
    "";
  const resolvedLangKey = langKey || plateSnapshot?.langKey || "";
  const resolvedDayKey = dayKey || plateSnapshot?.dayKey || "";

  const span =
    FLASHCARD_RANDOM_DAILY_TARGET_MAX - FLASHCARD_RANDOM_DAILY_TARGET_MIN + 1;
  const roll =
    hashString(
      `flashcard_daily_random|${resolvedUserKey}|${resolvedLangKey}|${resolvedDayKey}`,
    ) % span;
  return FLASHCARD_RANDOM_DAILY_TARGET_MIN + roll;
}
