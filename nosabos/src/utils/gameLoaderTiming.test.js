import assert from "node:assert/strict";
import test from "node:test";

import {
  GAME_LOADER_EXPLORATION_MAX_MS,
  GAME_LOADER_EXPLORATION_MIN_MS,
  getGameLoaderExplorationDelay,
} from "./gameLoaderTiming.js";

test("loader exploration delay stays within the configured 5-8 second window", () => {
  assert.equal(
    getGameLoaderExplorationDelay(0),
    GAME_LOADER_EXPLORATION_MIN_MS,
  );
  assert.equal(
    getGameLoaderExplorationDelay(1),
    GAME_LOADER_EXPLORATION_MAX_MS,
  );
  assert.equal(getGameLoaderExplorationDelay(0.5), 6_500);
});

test("loader exploration delay clamps invalid random inputs safely", () => {
  assert.equal(
    getGameLoaderExplorationDelay(-5),
    GAME_LOADER_EXPLORATION_MIN_MS,
  );
  assert.equal(
    getGameLoaderExplorationDelay(5),
    GAME_LOADER_EXPLORATION_MAX_MS,
  );
  assert.equal(
    getGameLoaderExplorationDelay(Number.NaN),
    GAME_LOADER_EXPLORATION_MIN_MS,
  );
});
