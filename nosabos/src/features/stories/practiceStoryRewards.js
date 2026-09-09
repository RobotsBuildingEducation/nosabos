export const PRACTICE_STORY_TURN_XP = 2;

export function claimPracticeStoryTurnReward(claimedTurns, turnKey) {
  if (!(claimedTurns instanceof Set) || !turnKey || claimedTurns.has(turnKey)) {
    return 0;
  }
  claimedTurns.add(turnKey);
  return PRACTICE_STORY_TURN_XP;
}
