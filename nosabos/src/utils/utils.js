// src/utils/xp.js
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import {
  DAILY_GOAL_PET_HEALTH_GAIN,
  applyDailyGoalPetDelta,
  buildDailyGoalResetFields,
  getDailyGoalPetHealth,
  hasDailyGoalResetExpired,
} from "./dailyGoalPet";
import { PLATE_XP_SOURCE_FIELDS } from "./dailyPlate";
import {
  buildDailyXpRecent,
  getLocalCalendarDayKey,
  getNextGoalSummary,
  monthKeyFromDayKey,
  pruneDayEntries,
} from "./userDataSchema";

function getStoredLocalNpub() {
  if (typeof window === "undefined") return "";
  try {
    return (window.localStorage.getItem("local_npub") || "").trim();
  } catch {
    return "";
  }
}

function getUserNpub(user = {}) {
  return (
    user?.id ||
    user?.local_npub ||
    getStoredLocalNpub() ||
    ""
  ).trim();
}

function syncAwardedXpToLocalStore({
  npub,
  delta,
  targetLang,
  dailyXp,
  dailyGoalXp,
  todayKey,
  petHealth,
  activityField,
  activityCount,
}) {
  try {
    const store = useUserStore.getState?.();
    if (!store?.patchUser) return;

    const currentUser = store.user || {};
    const currentNpub = getUserNpub(currentUser);
    if (npub && currentNpub && npub !== currentNpub) return;

    const patch = {};
    const nextDailyXp = Number(dailyXp);
    const nextDailyGoalXp = Number(dailyGoalXp);
    const nextPetHealth = Number(petHealth);
    const currentXp = Number(currentUser?.xp || 0);
    const currentTodayXp = Number(
      currentUser?.dailyXpRecent?.[todayKey] ??
        currentUser?.dailyXpHistory?.[todayKey],
    );
    const langKey =
      typeof targetLang === "string" && targetLang.trim()
        ? targetLang.trim().toLowerCase()
        : "";
    const syncedDailyXp =
      todayKey && Number.isFinite(currentTodayXp)
        ? Math.max(currentTodayXp, nextDailyXp)
        : nextDailyXp;

    if (Number.isFinite(currentXp)) patch.xp = currentXp + delta;
    if (langKey) {
      const currentProgress = currentUser.progress || {};
      const currentProgressTotal = Number(currentProgress.totalXp || 0);
      const currentLanguageXp = Number(
        currentProgress.languageXp?.[langKey] || 0,
      );
      patch.progress = {
        ...currentProgress,
        totalXp: Number.isFinite(currentProgressTotal)
          ? currentProgressTotal + delta
          : delta,
        languageXp: {
          ...(currentProgress.languageXp || {}),
          [langKey]: Number.isFinite(currentLanguageXp)
            ? currentLanguageXp + delta
            : delta,
        },
      };
      if (activityField && Number.isFinite(activityCount) && todayKey) {
        const currentLangActivity = pruneDayEntries(
          currentProgress?.[activityField]?.[langKey] || {},
          todayKey,
        );
        const currentCount = Number(currentLangActivity?.[todayKey]) || 0;
        patch.progress[activityField] = {
          ...(currentProgress?.[activityField] || {}),
          [langKey]: {
            ...currentLangActivity,
            [todayKey]: Math.max(currentCount, activityCount),
          },
        };
      }
    }
    if (Number.isFinite(syncedDailyXp)) patch.dailyXp = syncedDailyXp;
    if (Number.isFinite(nextDailyGoalXp)) patch.dailyGoalXp = nextDailyGoalXp;
    if (Number.isFinite(nextPetHealth)) patch.dailyGoalPetHealth = nextPetHealth;
    if (todayKey && Number.isFinite(syncedDailyXp)) {
      patch.dailyXpRecent = buildDailyXpRecent(
        {
          ...(currentUser.dailyXpRecent || currentUser.dailyXpHistory || {}),
          [todayKey]: syncedDailyXp,
        },
        todayKey,
      );
    }

    if (Object.keys(patch).length) store.patchUser(patch);
  } catch (error) {
    console.warn("Failed to sync awarded XP to local user store:", error);
  }
}

export async function awardXp(npub, amount, targetLang = "es", source = "") {
  if (!npub || !amount) return null;
  const ref = doc(database, "users", npub);
  const delta = Math.max(1, Math.round(amount));
  const now = new Date();
  const todayKey = getLocalCalendarDayKey(now);
  // Tagged sources ("lesson"/"speak") also count one action toward the
  // matching daily-plate course; untagged awards only move XP.
  const activityField = PLATE_XP_SOURCE_FIELDS[source] || null;
  const monthKey = monthKeyFromDayKey(todayKey);
  const monthRef = doc(database, "users", npub, "xpHistory", monthKey);
  let shouldCelebrateGoal = false;
  let celebrationPetHealth = null;
  let awardedDailyXp = null;
  let awardedDailyGoalXp = null;
  let awardedTodayKey = "";
  let awardedPetHealth = null;
  let awardedLangKey = "";
  let awardedLanguageXp = null;
  let awardedActivityCount = null;

  await runTransaction(database, async (tx) => {
    const [snap, monthSnap] = await Promise.all([tx.get(ref), tx.get(monthRef)]);
    const data = snap.exists() ? snap.data() : {};
    const monthData = monthSnap.exists() ? monthSnap.data() : {};
    const langKey =
      typeof targetLang === "string" && targetLang.trim()
        ? targetLang.trim().toLowerCase()
        : typeof data?.progress?.targetLang === "string"
        ? data.progress.targetLang
        : "es";
    awardedLangKey = langKey;
    const existingProgress = data?.progress || {};
    const existingLangXp = existingProgress?.languageXp?.[langKey] || 0;
    awardedLanguageXp = existingLangXp + delta;

    // Daily window check/reset
    const needsReset = hasDailyGoalResetExpired(data.dailyResetAt, now);

    const base = {};
    if (needsReset) {
      Object.assign(base, buildDailyGoalResetFields(data, now));
    }

    const currentDailyXp = Number(base.dailyXp ?? data.dailyXp ?? 0) || 0;
    const currentPetHealth = getDailyGoalPetHealth({ ...data, ...base });
    const currentHasCelebrated = Boolean(
      base.dailyHasCelebrated ?? data.dailyHasCelebrated
    );

    const nextDaily = currentDailyXp + delta;
    const nextTotal = (data.xp || 0) + delta;
    const nextProgress = {
      ...existingProgress,
      totalXp: (existingProgress?.totalXp || 0) + delta,
      languageXp: {
        ...(existingProgress?.languageXp || {}),
        [langKey]: existingLangXp + delta,
      },
    };

    if (activityField) {
      const langActivity = pruneDayEntries(
        existingProgress?.[activityField]?.[langKey] || {},
        todayKey,
      );
      const nextActivityCount = (Number(langActivity?.[todayKey]) || 0) + 1;
      nextProgress[activityField] = {
        ...(existingProgress?.[activityField] || {}),
        [langKey]: { ...langActivity, [todayKey]: nextActivityCount },
      };
      awardedActivityCount = nextActivityCount;
    }

    // Celebrate once per day upon reaching goal
    const parsedGoal = Number(
      data.dailyGoalXp ?? data.progress?.dailyGoalXp ?? data.stats?.dailyGoalXp,
    );
    const goal = Number.isFinite(parsedGoal) ? parsedGoal : 0;
    const reached = goal > 0 && nextDaily >= goal && !currentHasCelebrated;
    const nextPetHealth = reached
      ? applyDailyGoalPetDelta(currentPetHealth, DAILY_GOAL_PET_HEALTH_GAIN)
      : currentPetHealth;
    awardedPetHealth = nextPetHealth;
    if (reached) {
      shouldCelebrateGoal = true;
      celebrationPetHealth = nextPetHealth;
    }

    awardedDailyXp = nextDaily;
    awardedDailyGoalXp = goal;
    awardedTodayKey = todayKey;
    const existingDailyXpRecent =
      data?.dailyXpRecent && typeof data.dailyXpRecent === "object"
        ? data.dailyXpRecent
        : data?.dailyXpHistory && typeof data.dailyXpHistory === "object"
          ? data.dailyXpHistory
          : {};
    const nextDailyXpRecent = buildDailyXpRecent(
      { ...existingDailyXpRecent, [todayKey]: nextDaily },
      todayKey,
    );
    const existingGoalDays = Array.isArray(monthData?.goalDays)
      ? monthData.goalDays
      : [];
    const nextGoalDays = reached
      ? Array.from(new Set([...existingGoalDays, todayKey])).sort()
      : existingGoalDays;
    const goalSummary = reached ? getNextGoalSummary(data, todayKey) : null;

    tx.set(
      monthRef,
      {
        monthKey,
        days: { ...(monthData?.days || {}), [todayKey]: nextDaily },
        goalDays: nextGoalDays,
        updatedAt: now.toISOString(),
      },
      { merge: true },
    );

    tx.set(
      ref,
      {
        ...base,
        xp: nextTotal,
        dailyXp: nextDaily,
        updatedAt: now.toISOString(),
        progress: nextProgress,
        dailyGoalPetHealth: nextPetHealth,
        dailyXpRecent: nextDailyXpRecent,
        ...(reached
          ? {
              dailyHasCelebrated: true,
              lastDailyGoalHitAt: serverTimestamp(),
              ...goalSummary,
              dailyGoalPetLastOutcome: "achieved",
              dailyGoalPetLastDelta: DAILY_GOAL_PET_HEALTH_GAIN,
              dailyGoalPetLastUpdatedAt: now.toISOString(),
            }
          : {}),
      },
      { merge: true }
    );
  });

  syncAwardedXpToLocalStore({
    npub,
    delta,
    targetLang: awardedLangKey,
    dailyXp: awardedDailyXp,
    dailyGoalXp: awardedDailyGoalXp,
    todayKey: awardedTodayKey,
    petHealth: awardedPetHealth,
    activityField,
    activityCount: awardedActivityCount,
  });

  const result = {
    amount: delta,
    npub,
    source,
    targetLang: awardedLangKey,
    languageXp: awardedLanguageXp,
    dailyXp: awardedDailyXp,
    dailyGoalXp: awardedDailyGoalXp,
    todayKey: awardedTodayKey,
    shouldCelebrateGoal,
    petHealth: celebrationPetHealth ?? awardedPetHealth,
    petDelta: shouldCelebrateGoal ? DAILY_GOAL_PET_HEALTH_GAIN : 0,
  };

  // Optional UI pings
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("xp:awarded", {
        detail: {
          amount: result.amount,
          npub: result.npub,
          source: result.source,
          targetLang: result.targetLang,
          languageXp: result.languageXp,
          dailyXp: result.dailyXp,
          dailyGoalXp: result.dailyGoalXp,
          todayKey: result.todayKey,
        },
      })
    );
    if (shouldCelebrateGoal) {
      window.dispatchEvent(
        new CustomEvent("daily:goalAchieved", {
          detail: {
            petHealth: celebrationPetHealth,
            petDelta: DAILY_GOAL_PET_HEALTH_GAIN,
          },
        })
      );
    }
  }

  return result;
}
