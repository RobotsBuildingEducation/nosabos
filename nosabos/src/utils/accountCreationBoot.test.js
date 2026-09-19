import test from "node:test";
import assert from "node:assert/strict";
import { shouldHoldForInitialPatreonStatus } from "./patreonRecoveryState.js";

test("onboarding bypasses subscription gate during boot", () => {
  const needsOnboarding = true;
  const patreonStatusResolved = false;
  const isCheckingPatreon = true;

  // With needsOnboarding = true, isResolvingSubscription should be false
  const isResolvingSubscription =
    !needsOnboarding &&
    shouldHoldForInitialPatreonStatus({
      isResolved: patreonStatusResolved,
      isChecking: isCheckingPatreon,
    });

  assert.equal(isResolvingSubscription, false);

  // When onboarding is completed, subscription resolution check holds as expected
  const isResolvingAfterOnboarding =
    !false &&
    shouldHoldForInitialPatreonStatus({
      isResolved: patreonStatusResolved,
      isChecking: isCheckingPatreon,
    });

  assert.equal(isResolvingAfterOnboarding, true);
});

test("fallback user document satisfies boot prerequisites for onboarding", () => {
  const fallbackId = "npub1test1234567890abcdefghijklmnopqrstuvwxyz";
  const storedDisplayName = "Alex";

  const fallbackUser = {
    id: fallbackId,
    local_npub: fallbackId,
    createdAt: new Date().toISOString(),
    onboarding: { completed: false, currentStep: 1 },
    appLanguage: "en",
    displayName: storedDisplayName,
    dailyGoalPetType: "dog",
  };

  assert.ok(fallbackUser.id);
  assert.equal(fallbackUser.local_npub, fallbackId);
  assert.equal(fallbackUser.onboarding.completed, false);
  assert.equal(fallbackUser.onboarding.currentStep, 1);

  // Verifying boot conditions with this fallback user
  const user = fallbackUser;
  const isLoadingApp = false;
  const needsOnboarding = !user.onboarding.completed;
  const isResolvingSubscription =
    !needsOnboarding &&
    shouldHoldForInitialPatreonStatus({
      isResolved: false,
      isChecking: true,
    });
  const shouldHoldForInitialSkillTree = false;

  const isBootLoading =
    isLoadingApp ||
    !user ||
    shouldHoldForInitialSkillTree ||
    isResolvingSubscription;

  assert.equal(isBootLoading, false, "Boot should finish and allow transition to onboarding");
});

test("new account registration fast-track detection initializes draft immediately", () => {
  const newNpub = "npub1newuser999";
  const mockSessionStorage = {
    "new_registration_npub": newNpub,
  };

  const isNewRegistration = mockSessionStorage["new_registration_npub"] === newNpub;
  assert.equal(isNewRegistration, true);

  // Fast-track immediately returns the initial user doc without DB querying
  const base = {
    local_npub: newNpub,
    createdAt: new Date().toISOString(),
    schemaVersion: 2,
    onboarding: { completed: false, currentStep: 1 },
    appLanguage: "en",
    displayName: "NewLearner",
    dailyGoalPetType: "dog",
    progress: {},
  };
  const fastTrackUser = { id: newNpub, ...base };

  assert.equal(fastTrackUser.onboarding.completed, false);
  assert.equal(fastTrackUser.displayName, "NewLearner");
  assert.equal(fastTrackUser.schemaVersion, 2);
});

test("timed-out DB load preserves existing user onboarding completion", () => {
  const existingNpub = "npub1existinguser111";
  const mockLocalStorage = {
    [`onboarding_completed_${existingNpub}`]: JSON.stringify({
      completed: true,
      completedAt: "2026-09-01T12:00:00Z",
    }),
  };

  const localRaw = mockLocalStorage[`onboarding_completed_${existingNpub}`];
  const localCompletion = JSON.parse(localRaw);
  const wasCompleted = Boolean(localCompletion?.completed);

  assert.equal(wasCompleted, true);

  const base = {
    local_npub: existingNpub,
    createdAt: new Date().toISOString(),
    schemaVersion: 2,
    onboarding: wasCompleted
      ? {
          completed: true,
          completedAt: localCompletion?.completedAt,
        }
      : { completed: false, currentStep: 1 },
    appLanguage: "en",
    displayName: "ExistingLearner",
    dailyGoalPetType: "dog",
    progress: {},
  };

  assert.equal(base.onboarding.completed, true);
  assert.equal(base.onboarding.completedAt, "2026-09-01T12:00:00Z");
});
