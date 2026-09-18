import test from "node:test";
import assert from "node:assert/strict";
import {
  isChunkLoadError,
  getStaleAssetRecoveryInfo,
} from "./staleAssetRecovery.js";

test("isChunkLoadError detects chunk and dynamic import errors", () => {
  assert.equal(isChunkLoadError(null), false);
  assert.equal(isChunkLoadError(new Error("Generic runtime crash")), false);

  assert.equal(
    isChunkLoadError(new Error("Failed to fetch dynamically imported module: https://example.com/asset.js")),
    true,
  );
  assert.equal(
    isChunkLoadError(new Error("error loading dynamically imported module /src/App.jsx")),
    true,
  );
  assert.equal(
    isChunkLoadError(new Error("Importing a module script failed")),
    true,
  );
  assert.equal(
    isChunkLoadError(new Error("Loading chunk 42 failed")),
    true,
  );

  const chunkError = new Error("Custom");
  chunkError.name = "ChunkLoadError";
  assert.equal(isChunkLoadError(chunkError), true);
});

test("getStaleAssetRecoveryInfo provides offline messaging when offline", () => {
  const error = new Error("Failed to fetch dynamically imported module");
  const info = getStaleAssetRecoveryInfo({
    error,
    isOnline: false,
    isUpdateReady: false,
    hasAttemptedReload: false,
  });

  assert.equal(info.type, "offline_missing_chunk");
  assert.ok(info.description.includes("appear to be offline"));
  assert.equal(info.actionLabel, "Try again");
  assert.equal(info.actionType, "reload");
});

test("getStaleAssetRecoveryInfo offers update when update is ready", () => {
  const error = new Error("Failed to fetch dynamically imported module");
  const info = getStaleAssetRecoveryInfo({
    error,
    isOnline: true,
    isUpdateReady: true,
    hasAttemptedReload: false,
  });

  assert.equal(info.type, "update_ready");
  assert.ok(info.title.includes("new version"));
  assert.equal(info.actionLabel, "Update now");
  assert.equal(info.actionType, "update");
});

test("getStaleAssetRecoveryInfo distinguishes first reload vs repeated failure", () => {
  const error = new Error("Failed to fetch dynamically imported module");

  const firstAttempt = getStaleAssetRecoveryInfo({
    error,
    isOnline: true,
    isUpdateReady: false,
    hasAttemptedReload: false,
  });
  assert.equal(firstAttempt.type, "stale_chunk_first_attempt");
  assert.ok(firstAttempt.description.includes("new deployment was published"));

  const persistingFailure = getStaleAssetRecoveryInfo({
    error,
    isOnline: true,
    isUpdateReady: false,
    hasAttemptedReload: true,
  });
  assert.equal(persistingFailure.type, "stale_chunk_persisting");
  assert.ok(persistingFailure.description.includes("couldn't fetch the latest files"));
});

test("getStaleAssetRecoveryInfo preserves ordinary runtime error copy", () => {
  const error = new TypeError("Cannot read properties of undefined (reading 'foo')");
  const info = getStaleAssetRecoveryInfo({
    error,
    isOnline: true,
    isUpdateReady: true,
    hasAttemptedReload: false,
  });

  assert.equal(info.type, "runtime_error");
  assert.equal(info.title, "Piyali couldn't finish loading");
  assert.ok(info.description.includes("unexpected error"));
});
