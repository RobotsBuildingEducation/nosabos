export function getBootLoadingStage({ isLoadingApp, hasUser, isResolvingSubscription, shouldHoldForInitialSkillTree }) {
  if (isLoadingApp || !hasUser) return "profile";
  if (isResolvingSubscription) return "access";
  if (shouldHoldForInitialSkillTree) return "path";
  return null;
}
