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

// Goal lesson work has its own per-goal/day counter. Finishing today's lesson
// does not advance the curriculum or mark the learner's long-term goal achieved.
export function getGoalPreparationXp(bucket, blueprint) {
  const saved = bucket?.dailyGoal?.blueprint;
  if (
    !blueprint ||
    saved?.goalId !== blueprint.goalId ||
    saved?.dayKey !== blueprint.dayKey
  )
    return 0;
  return getLessonEarnedXp({ earnedXp: bucket.dailyGoal.preparationXp });
}

export function nextGoalPreparationXp({
  bucket,
  focus,
  npub,
  targetLang,
  dayKey,
  lessonId,
  amount,
}) {
  const blueprint = focus?.blueprint;
  if (
    !blueprint ||
    focus.npub !== npub ||
    focus.targetLang !== targetLang ||
    blueprint.dayKey !== dayKey ||
    blueprint.mode !== "lesson" ||
    lessonId !== `goal-${blueprint.goalId}-${blueprint.dayKey}` ||
    bucket?.activeGoal?.id !== blueprint.goalId ||
    bucket.activeGoal.status !== "active" ||
    bucket.dailyGoal?.blueprint?.goalId !== blueprint.goalId ||
    bucket.dailyGoal.blueprint.dayKey !== blueprint.dayKey ||
    !Number.isFinite(amount) ||
    amount <= 0
  )
    return null;
  return getGoalPreparationXp(bucket, blueprint) + amount;
}

export function isGoalLessonReady(bucket, lesson) {
  const blueprint = lesson?.goalBlueprint;
  if (!lesson?.isGoal || blueprint?.mode !== "lesson" ||
      lesson.id !== `goal-${blueprint.goalId}-${blueprint.dayKey}` ||
      bucket?.activeGoal?.id !== blueprint.goalId || bucket.activeGoal.status !== "active" ||
      bucket.dailyGoal?.blueprint?.goalId !== blueprint.goalId ||
      bucket.dailyGoal.blueprint.dayKey !== blueprint.dayKey) return false;
  return bucket.dailyGoal.completed === true || hasCompletedLessonXp(
    { earnedXp: getGoalPreparationXp(bucket, blueprint) }, lesson.xpReward,
  );
}
