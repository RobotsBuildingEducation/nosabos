const DAY_MS = 24 * 60 * 60 * 1000;

export const DAILY_GOAL_PET_DEFAULT_HEALTH = 100;
export const DAILY_GOAL_PET_HEALTH_GAIN = 15;
export const DAILY_GOAL_PET_HEALTH_LOSS = 10;

export function clampDailyGoalPetHealth(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DAILY_GOAL_PET_DEFAULT_HEALTH;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function getDailyGoalPetHealth(data = {}) {
  return clampDailyGoalPetHealth(data?.dailyGoalPetHealth);
}

export function getNextDailyGoalResetAt(now = new Date()) {
  return new Date(now.getTime() + DAY_MS).toISOString();
}

export function hasDailyGoalResetExpired(resetAt, now = new Date()) {
  const resetAtMs = Date.parse(resetAt || 0) || 0;
  return !resetAtMs || now.getTime() >= resetAtMs;
}

export function applyDailyGoalPetDelta(health, delta) {
  return clampDailyGoalPetHealth(Number(health || 0) + Number(delta || 0));
}

export function buildDailyGoalResetFields(data = {}, now = new Date()) {
  const goal = Math.max(0, Math.round(Number(data?.dailyGoalXp || 0)));
  const earned = Math.max(0, Math.round(Number(data?.dailyXp || 0)));
  const currentHealth = getDailyGoalPetHealth(data);
  const missedGoal = goal > 0 && earned < goal;

  return {
    dailyXp: 0,
    dailyHasCelebrated: false,
    dailyResetAt: getNextDailyGoalResetAt(now),
    dailyStartedAt: now.toISOString(),
    dailyGoalPetHealth: missedGoal
      ? applyDailyGoalPetDelta(currentHealth, -DAILY_GOAL_PET_HEALTH_LOSS)
      : currentHealth,
    ...(missedGoal
      ? {
          dailyGoalPetLastOutcome: "missed",
          dailyGoalPetLastDelta: -DAILY_GOAL_PET_HEALTH_LOSS,
          dailyGoalPetLastUpdatedAt: now.toISOString(),
        }
      : {}),
  };
}
