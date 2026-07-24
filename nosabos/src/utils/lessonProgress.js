export function getLessonEarnedXp(lessonProgress) {
  const earnedXp = Number(lessonProgress?.earnedXp);
  return Number.isFinite(earnedXp) ? Math.max(0, earnedXp) : 0;
}

export function getLessonProgressPercent(lessonProgress, xpReward) {
  const goal = Number(xpReward);
  if (!Number.isFinite(goal) || goal <= 0) return 0;

  return Math.min(100, (getLessonEarnedXp(lessonProgress) / goal) * 100);
}

export function hasCompletedLessonXp(lessonProgress, xpReward) {
  const goal = Number(xpReward);
  return (
    Number.isFinite(goal) &&
    goal > 0 &&
    getLessonEarnedXp(lessonProgress) >= goal
  );
}
