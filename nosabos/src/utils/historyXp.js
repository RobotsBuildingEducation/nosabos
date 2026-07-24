export const HISTORY_XP_MIN = 5;
export const HISTORY_XP_MAX = 8;

export function getRandomHistoryXp(random = Math.random) {
  const roll = Number(random());
  const boundedRoll = Number.isFinite(roll)
    ? Math.min(1 - Number.EPSILON, Math.max(0, roll))
    : 0;

  return (
    HISTORY_XP_MIN +
    Math.floor(boundedRoll * (HISTORY_XP_MAX - HISTORY_XP_MIN + 1))
  );
}
