// src/utils/xp.js
import { doc, runTransaction, serverTimestamp, arrayUnion } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";

export async function awardXp(npub, amount, targetLang = "es") {
  if (!npub || !amount) return;
  const ref = doc(database, "users", npub);
  const delta = Math.max(1, Math.round(amount));
  const now = new Date();
  let shouldCelebrateGoal = false;

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
    const resetAtMs = Date.parse(data.dailyResetAt || 0) || 0;
    const needsReset = !resetAtMs || now.getTime() >= resetAtMs;
    const nextReset = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    ).toISOString();

    const base = {};
    if (needsReset) {
      base.dailyXp = 0;
      base.dailyHasCelebrated = false;
      base.dailyResetAt = nextReset;
      base.dailyStartedAt = now.toISOString();
    }

    const nextDaily = (needsReset ? 0 : data.dailyXp || 0) + delta;
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
    const reached = goal > 0 && nextDaily >= goal && !data.dailyHasCelebrated;
    if (reached) shouldCelebrateGoal = true;

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
        ...(reached
          ? {
              dailyHasCelebrated: true,
              lastDailyGoalHitAt: serverTimestamp(),
              completedGoalDates: arrayUnion(todayKey),
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
      window.dispatchEvent(new CustomEvent("daily:goalAchieved"));
    }
  }
}
