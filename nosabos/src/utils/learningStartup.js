// Share the same game import with lesson launch, so warming never creates a
// second client or changes when the game view appears.
let gamePromise;
export function loadRPGGameComponent() {
  gamePromise ||= import("../components/RPGGame/GameRouter.jsx")
    .then((module) => module.default)
    .catch((error) => { gamePromise = null; throw error; });
  return gamePromise;
}

export function createLearningStartupPreparer({ loadPath, loadGame, loadGameLoader }) {
  return ({ targetLang, level = "Pre-A1", includeIntro = false }) => {
    const courseLevel = { beginner: "Pre-A1", intermediate: "B1", advanced: "C1" }[level] || level;
    const levels = new Set([courseLevel]);
    if (includeIntro) levels.add("Pre-A1");
    // One failed optional warmup must not block another, or onboarding.
    return Promise.allSettled([
      ...[...levels].map((selectedLevel) => loadPath(targetLang, selectedLevel)),
      loadGame(),
      loadGameLoader(),
    ]);
  };
}

export const prepareLearningStartup = createLearningStartupPreparer({
  loadPath: async (...args) => (await import("../data/skillTree/index.js")).loadLearningPath(...args),
  loadGame: loadRPGGameComponent,
  loadGameLoader: () => import("../components/LoadingMiniGame.jsx"),
});

// Reserve initial rendering for the current screen. Cancelling a pending job
// lets a changed language selection replace it without fetching the old one.
export function scheduleLearningStartup(options, environment = window, prepare = prepareLearningStartup) {
  let cancelled = false;
  let firstFrame;
  let secondFrame;
  let idle;
  let timer;
  let paintObserver;
  const run = () => {
    if (!cancelled) void prepare(options).catch(() => {});
  };
  const queue = () => {
    if (cancelled) return;
    firstFrame = environment.requestAnimationFrame(() => {
      secondFrame = environment.requestAnimationFrame(() => {
        if (typeof environment.requestIdleCallback === "function") {
          idle = environment.requestIdleCallback(run, { timeout: 1500 });
        } else {
          timer = environment.setTimeout(run, 750);
        }
      });
    });
  };
  const Observer = environment.PerformanceObserver;
  const hasPainted = (environment.performance?.getEntriesByType?.("paint") || [])
    .some((entry) => entry.name === "first-contentful-paint");
  if (Observer?.supportedEntryTypes?.includes("paint") && !hasPainted) {
    paintObserver = new Observer((entries) => {
      if (!entries.getEntries().some((entry) => entry.name === "first-contentful-paint")) return;
      paintObserver.disconnect();
      queue();
    });
    paintObserver.observe({ type: "paint", buffered: true });
  } else {
    queue();
  }
  return () => {
    cancelled = true;
    paintObserver?.disconnect();
    environment.cancelAnimationFrame(firstFrame);
    environment.cancelAnimationFrame(secondFrame);
    if (idle !== undefined) environment.cancelIdleCallback?.(idle);
    environment.clearTimeout(timer);
  };
}
