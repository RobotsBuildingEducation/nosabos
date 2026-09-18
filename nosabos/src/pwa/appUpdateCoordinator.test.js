import test from "node:test";
import assert from "node:assert/strict";
import {
  AppUpdateCoordinator,
  STORAGE_KEYS,
} from "./appUpdateCoordinator.js";
import { resetBlockersForTest, registerUpdateBlocker } from "./updateSafety.js";

// Mock sessionStorage
function createMockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

test("coordinator initializes and verifies successful previous reload", () => {
  const storage = createMockStorage({
    [STORAGE_KEYS.RELOAD_TARGET]: "build-v2",
    [STORAGE_KEYS.ATTEMPT_COUNT]: "1",
  });

  const coordinator = new AppUpdateCoordinator({
    runningBuildId: "build-v2",
    storage,
  });

  coordinator.verifyReloadResult();

  assert.equal(storage.getItem(STORAGE_KEYS.RELOAD_TARGET), null);
  assert.equal(storage.getItem(STORAGE_KEYS.ATTEMPT_COUNT), null);
});

test("coordinator guards against infinite reload loops on build mismatch", () => {
  const storage = createMockStorage({
    [STORAGE_KEYS.RELOAD_TARGET]: "build-v2",
    [STORAGE_KEYS.ATTEMPT_COUNT]: "2", // Reached max attempts
  });

  const coordinator = new AppUpdateCoordinator({
    runningBuildId: "build-v1", // Still on v1
    storage,
  });

  coordinator.verifyReloadResult();

  assert.equal(storage.getItem(STORAGE_KEYS.RELOAD_TARGET), null);
  const state = coordinator.getState();
  assert.equal(state.uiState, "error");
  assert.equal(state.isModalOpen, true);
  assert.ok(state.errorMessage.includes("couldn't finish the update"));
});

test("checkForUpdate detects new deployment from valid /version.json", async () => {
  const mockFetch = async (url) => {
    assert.equal(url, "/version.json");
    return {
      ok: true,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ buildId: "build-v2", builtAt: "2026-09-18T10:00:00Z" }),
    };
  };

  const coordinator = new AppUpdateCoordinator({
    runningBuildId: "build-v1",
    fetch: mockFetch,
    storage: createMockStorage(),
  });

  const detected = await coordinator.checkForUpdate({ force: true });
  assert.equal(detected, true);

  const state = coordinator.getState();
  assert.equal(state.discoveryStatus, "different_detected");
  assert.equal(state.advertisedBuildId, "build-v2");
  assert.equal(state.targetBuildId, "build-v2");
});

test("checkForUpdate marks idle when /version.json has matching buildId", async () => {
  const mockFetch = async () => ({
    ok: true,
    headers: new Map([["content-type", "application/json"]]),
    json: async () => ({ buildId: "build-v1", builtAt: "2026-09-18T10:00:00Z" }),
  });

  const coordinator = new AppUpdateCoordinator({
    runningBuildId: "build-v1",
    fetch: mockFetch,
    storage: createMockStorage(),
  });

  const detected = await coordinator.checkForUpdate({ force: true });
  assert.equal(detected, false);
  assert.equal(coordinator.getState().discoveryStatus, "idle");
});

test("checkForUpdate rejects HTML fallback response as check_failed", async () => {
  const mockFetch = async () => ({
    ok: true,
    headers: new Map([["content-type", "text/html; charset=utf-8"]]),
    json: async () => ({}),
  });

  const coordinator = new AppUpdateCoordinator({
    runningBuildId: "build-v1",
    fetch: mockFetch,
    storage: createMockStorage(),
  });

  const detected = await coordinator.checkForUpdate({ force: true });
  assert.equal(detected, false);
  assert.equal(coordinator.getState().discoveryStatus, "check_failed");
});

test("checkForUpdate coalesces calls within 30 seconds", async () => {
  let fetchCount = 0;
  const mockFetch = async () => {
    fetchCount++;
    return {
      ok: true,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ buildId: "build-v1" }),
    };
  };

  const coordinator = new AppUpdateCoordinator({
    runningBuildId: "build-v1",
    fetch: mockFetch,
    storage: createMockStorage(),
  });

  await coordinator.checkForUpdate({ force: false });
  assert.equal(fetchCount, 1);

  // Call again immediately without force
  await coordinator.checkForUpdate({ force: false });
  assert.equal(fetchCount, 1, "Throttled within 30s coalesce window");

  // Call with force: true
  await coordinator.checkForUpdate({ force: true });
  assert.equal(fetchCount, 2, "force: true bypasses throttle");
});

test("dismissUpdate defers update and suppresses modal reopening for that build", () => {
  const storage = createMockStorage();
  const coordinator = new AppUpdateCoordinator({
    runningBuildId: "build-v1",
    storage,
  });

  coordinator.setState({
    advertisedBuildId: "build-v2",
    targetBuildId: "build-v2",
    isModalOpen: true,
    uiState: "ready",
  });

  coordinator.dismissUpdate();

  assert.equal(storage.getItem(STORAGE_KEYS.DEFERRED_BUILD), "build-v2");
  const state = coordinator.getState();
  assert.equal(state.uiState, "deferred");
  assert.equal(state.isModalOpen, false);
  assert.equal(coordinator.isDeferred(), true);

  // When worker reports waiting again, it stays deferred
  coordinator.handleWorkerWaiting({});
  assert.equal(coordinator.getState().uiState, "deferred");
  assert.equal(coordinator.getState().isModalOpen, false);
});

test("applyUpdate enforces safety checks", async () => {
  resetBlockersForTest();
  const storage = createMockStorage();
  let reloadCalled = false;
  const mockLocation = { reload: () => { reloadCalled = true; } };

  const coordinator = new AppUpdateCoordinator({
    runningBuildId: "build-v1",
    storage,
    location: mockLocation,
  });

  coordinator.setState({
    targetBuildId: "build-v2",
    isUpdateReady: true,
  });

  // Register active blocker
  const unregister = registerUpdateBlocker("active-lesson", {
    description: "In lesson",
  });

  const applied = await coordinator.applyUpdate();
  assert.equal(applied, false, "Blocked while lesson active");
  assert.equal(reloadCalled, false);
  assert.ok(coordinator.getState().errorMessage.includes("finish or save"));

  // Unregister blocker
  unregister();
  const appliedNow = await coordinator.applyUpdate();
  assert.equal(appliedNow, true, "Proceeds when safe");
  assert.equal(reloadCalled, true);
  assert.equal(storage.getItem(STORAGE_KEYS.RELOAD_TARGET), "build-v2");
});
