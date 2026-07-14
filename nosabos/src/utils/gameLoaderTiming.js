export const GAME_LOADER_EXPLORATION_MIN_MS = 6_000;
export const GAME_LOADER_EXPLORATION_MAX_MS = 10_000;

export function getGameLoaderExplorationDelay(randomValue = Math.random()) {
  const normalized = Math.min(1, Math.max(0, Number(randomValue) || 0));
  return Math.floor(
    GAME_LOADER_EXPLORATION_MIN_MS +
      normalized *
        (GAME_LOADER_EXPLORATION_MAX_MS - GAME_LOADER_EXPLORATION_MIN_MS),
  );
}

export function waitForGameLoaderExploration(randomValue = Math.random()) {
  const delay = getGameLoaderExplorationDelay(randomValue);
  return new Promise((resolve) => globalThis.setTimeout(resolve, delay));
}
