// src/utils/xp.js
import { doc, runTransaction, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";

export async function awardXp(npub, amount, targetLang = null) {
  if (!npub || !amount) return;
  const ref = doc(database, "users", npub);
  const delta = Math.max(1, Math.round(amount));
  const now = new Date();

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists() ? snap.data() : {};

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

    // Celebrate once per day upon reaching goal
    const goal = data.dailyGoalXp || 0;
    const reached = goal > 0 && nextDaily >= goal && !data.dailyHasCelebrated;

    // Build base update object
    const updates = {
      ...base,
      xp: nextTotal,
      dailyXp: nextDaily,
      updatedAt: now.toISOString(),
      ...(reached
        ? { dailyHasCelebrated: true, lastDailyGoalHitAt: serverTimestamp() }
        : {}),
    };

    // Update language-specific XP if targetLang is provided
    // Use dot notation for nested fields - tx.update handles this correctly
    if (targetLang) {
      const progress = data.progress || {};
      const languageXp = progress.languageXp || {};
      const currentLangXp = languageXp[targetLang] || 0;
      const totalXp = progress.totalXp || 0;

      updates[`progress.languageXp.${targetLang}`] = currentLangXp + delta;
      updates['progress.totalXp'] = totalXp + delta;
    }

    // Use update instead of set for dot-notation nested fields
    tx.update(ref, updates);
  });

  // Optional UI ping
  window.dispatchEvent(
    new CustomEvent("xp:awarded", { detail: { amount: delta } })
  );
}
