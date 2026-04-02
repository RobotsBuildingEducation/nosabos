// src/utils/xp.js
import { doc, runTransaction, serverTimestamp, arrayUnion } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import {
  DAILY_GOAL_PET_HEALTH_GAIN,
  applyDailyGoalPetDelta,
  buildDailyGoalResetFields,
  getDailyGoalPetHealth,
  hasDailyGoalResetExpired,
} from "./dailyGoalPet";

export async function awardXp(npub, amount, targetLang = "es") {
  if (!npub || !amount) return;
  const ref = doc(database, "users", npub);
  const delta = Math.max(1, Math.round(amount));
  const now = new Date();
  let shouldCelebrateGoal = false;
  let celebrationPetHealth = null;

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists() ? snap.data() : {};
    const langKey =
      typeof targetLang === "string" && targetLang.trim()
        ? targetLang.trim().toLowerCase()
        : typeof data?.progress?.targetLang === "string"
        ? data.progress.targetLang
        : "es";
    const existingProgress = data?.progress || {};
    const existingLangXp = existingProgress?.languageXp?.[langKey] || 0;

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

    // Celebrate once per day upon reaching goal
    const goal = data.dailyGoalXp || 0;
    const reached = goal > 0 && nextDaily >= goal && !currentHasCelebrated;
    const nextPetHealth = reached
      ? applyDailyGoalPetDelta(currentPetHealth, DAILY_GOAL_PET_HEALTH_GAIN)
      : currentPetHealth;
    if (reached) {
      shouldCelebrateGoal = true;
      celebrationPetHealth = nextPetHealth;
    }

    // Format today's date as YYYY-MM-DD for calendar tracking
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    tx.set(
      ref,
      {
        ...base,
        xp: nextTotal,
        dailyXp: nextDaily,
        updatedAt: now.toISOString(),
        progress: nextProgress,
        dailyGoalPetHealth: nextPetHealth,
        ...(reached
          ? {
              dailyHasCelebrated: true,
              lastDailyGoalHitAt: serverTimestamp(),
              completedGoalDates: arrayUnion(todayKey),
              dailyGoalPetLastOutcome: "achieved",
              dailyGoalPetLastDelta: DAILY_GOAL_PET_HEALTH_GAIN,
              dailyGoalPetLastUpdatedAt: now.toISOString(),
            }
          : {}),
      },
      { merge: true }
    );
  });

  // Optional UI pings
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("xp:awarded", { detail: { amount: delta } })
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
}
