// Prepares the tutorial with the same authored episode pipeline used by RPG
// Game Reviews while the learner completes the earlier tutorial modules.
// Scenario work, the interactive loader, and the RPG client chunk are all
// warmed before the game view needs to paint.

const pendingTutorialScenarios = new Map();

function tutorialScenarioKey({ lesson, targetLang, supportLang }) {
  return [
    lesson?.id || "tutorial",
    targetLang || "es",
    supportLang || "en",
    lesson?.content?.game?.sceneId || "tutorialPlaza",
  ].join(":");
}

export function prepareTutorialGameScenario({
  lesson,
  targetLang = "es",
  supportLang = "en",
}) {
  const key = tutorialScenarioKey({ lesson, targetLang, supportLang });
  const pending = pendingTutorialScenarios.get(key);
  if (pending) return pending;

  const preparation = Promise.all([
    import("../components/RPGGame/episodes/legacyScenario.js"),
    // Resolve the game client in parallel so the prepared scenario can hand
    // straight to GameRouter without an intermediate loading commit.
    import("../components/RPGGame/GameRouter.jsx"),
    // This is the exact interactive loader used by RPG review launches. Warm
    // it too so a fast learner never falls back to a blank or dot-only screen.
    import("../components/LoadingMiniGame.jsx"),
  ])
    .then(([{ prepareLegacyEpisodeScenario }]) =>
      prepareLegacyEpisodeScenario({ lesson, targetLang, supportLang }),
    )
    .catch((error) => {
      // A later retry should be able to recover from a transient model or
      // network failure instead of inheriting a rejected cached promise.
      pendingTutorialScenarios.delete(key);
      throw error;
    });

  pendingTutorialScenarios.set(key, preparation);
  return preparation;
}
