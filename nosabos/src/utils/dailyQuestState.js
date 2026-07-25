const QUEST_ACTIVITY_FIELDS = [
  "flashcardDailyActivity",
  "lessonDailyActivity",
  "speakDailyActivity",
  "conversationDailyActivity",
  "phonicsDailyActivity",
  "repairDailyActivity",
];

export function getAccountStorageKey(baseKey, userKey) {
  const account = String(userKey || "").trim();
  return `${baseKey}:${encodeURIComponent(account || "anonymous")}`;
}

export function readAccountScopedJson(baseKey, userKey) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      getAccountStorageKey(baseKey, userKey),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeAccountScopedJson(baseKey, userKey, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getAccountStorageKey(baseKey, userKey),
      JSON.stringify(value),
    );
  } catch {
    // Storage is an optimization; Firestore/user progress remains canonical.
  }
}

export function removeAccountScopedValue(baseKey, userKey) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getAccountStorageKey(baseKey, userKey));
  } catch {
    // Ignore unavailable browser storage.
  }
}

function hasPriorLearningActivity(user) {
  const progress = user?.progress || {};
  if (
    Number(user?.xp) > 0 ||
    Number(progress?.xp) > 0 ||
    Number(progress?.totalXp) > 0
  ) {
    return true;
  }
  if (
    (Array.isArray(user?.completedGoalDates) &&
      user.completedGoalDates.length > 0) ||
    Object.keys(progress?.lessons || {}).length > 0 ||
    Object.keys(progress?.languageLessons || {}).length > 0 ||
    Object.keys(progress?.tutorLanguageLessons || {}).length > 0
  ) {
    return true;
  }
  return QUEST_ACTIVITY_FIELDS.some((field) =>
    Object.values(progress?.[field] || {}).some(
      (languageDays) =>
        languageDays &&
        typeof languageDays === "object" &&
        Object.keys(languageDays).length > 0,
    ),
  );
}

// The fixed intro remains authoritative for its whole first day. The final
// branch repairs accounts that older browser-wide quest caching incorrectly
// marked "seen" without a first-day stamp before they had any learning data.
export function shouldUseFixedFirstQuest(user, dayKey) {
  const progress = user?.progress || {};
  if (!progress.dailyQuestFirstSeen) return true;
  const firstDay =
    typeof progress.dailyQuestFirstDayKey === "string"
      ? progress.dailyQuestFirstDayKey
      : "";
  if (firstDay) return firstDay === dayKey;
  return !hasPriorLearningActivity(user);
}
