export const JOURNEY_MILESTONES = Object.freeze([1, 5, 15, 30, 45, 60, 90, 120, 150]);
export const QUESTS_PER_JOURNEY_SESSION = 1;
export const JOURNEY_MAX_SECONDS = 45;
export const JOURNEY_MAX_AUDIO_BYTES = 650_000;

export function journeySessionCount(journey = {}) {
  const count = Number(journey.completedQuests);
  return Math.floor((Number.isFinite(count) ? Math.max(0, count) : 0) / QUESTS_PER_JOURNEY_SESSION);
}

// The transaction's per-day receipt supplies alreadyCounted; receipts never
// expire with the app's rolling activity history or its developer quest reset.
export function completeJourneyQuest(journey = {}, alreadyCounted = false, now = new Date().toISOString()) {
  if (alreadyCounted) return journey;
  const previousCount = Number(journey.completedQuests);
  const completedQuests = (Number.isFinite(previousCount) ? Math.max(0, Math.floor(previousCount)) : 0) + 1;
  const next = { ...journey, version: 1, completedQuests, updatedAt: now };
  next.unlockedAt = { ...journey.unlockedAt };
  for (const milestone of JOURNEY_MILESTONES) {
    if (milestone <= journeySessionCount(next) && !next.unlockedAt[milestone]) next.unlockedAt[milestone] = now;
  }
  return next;
}

export function pendingJourneyMilestone(journey = {}) {
  const milestone = JOURNEY_MILESTONES.findLast(number => number <= journeySessionCount(journey));
  return milestone && milestone > (Number(journey.lastPromptedMilestone) || 0) && !journey.recordings?.[milestone]
    ? milestone : null;
}

export function journeyBaseline(journey = {}) {
  // Filling in a skipped early milestone must not replace the learner's
  // actual first recording as their starting point.
  return JOURNEY_MILESTONES.filter(milestone => journey.recordings?.[milestone])
    .sort((a, b) => (Date.parse(journey.recordings[a].createdAt) || 0) - (Date.parse(journey.recordings[b].createdAt) || 0) || a - b)[0] || null;
}

export function isJourneyMilestoneExpired(journey = {}, milestone) {
  const index = JOURNEY_MILESTONES.indexOf(milestone);
  if (index === -1) return false;
  if (journey.recordings?.[milestone]) return false;
  const count = journeySessionCount(journey);
  if (count < milestone) return false;
  const nextMilestone = JOURNEY_MILESTONES[index + 1];
  return Boolean(nextMilestone && count >= nextMilestone);
}

export function canRecordJourneyMilestone(journey = {}, milestone) {
  if (!JOURNEY_MILESTONES.includes(milestone)) return false;
  if (journey?.recordings?.[milestone]) return false;
  const count = journeySessionCount(journey);
  if (milestone > count) return false;
  if (isJourneyMilestoneExpired(journey, milestone)) return false;
  return true;
}
