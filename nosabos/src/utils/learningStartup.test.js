import assert from "node:assert/strict";
import test from "node:test";
import { createLearningStartupPreparer, scheduleLearningStartup } from "./learningStartup.js";

test("warming selects only the learner's language and current level, plus the introductory level when needed", async () => {
  const paths = [];
  let gameLoads = 0, loaderLoads = 0;
  const prepare = createLearningStartupPreparer({
    loadPath: async (...args) => { paths.push(args); },
    loadGame: async () => { gameLoads++; },
    loadGameLoader: async () => { loaderLoads++; },
  });
  await prepare({ targetLang: "ja", level: "B1", includeIntro: true });
  assert.deepEqual(paths, [["ja", "B1"], ["ja", "Pre-A1"]]);
  assert.equal(gameLoads, 1);
  assert.equal(loaderLoads, 1);
  paths.length = 0;
  await prepare({ targetLang: "fr", includeIntro: true });
  assert.deepEqual(paths, [["fr", "Pre-A1"]], "Introductory data must not be requested twice");
  paths.length = 0;
  await prepare({ targetLang: "fr", level: "intermediate", includeIntro: true });
  assert.deepEqual(paths, [["fr", "B1"], ["fr", "Pre-A1"]], "Existing onboarding drafts use legacy levels");
});

test("a failed course warmup does not block game preparation or reject onboarding", async () => {
  let warmedGame = false;
  const prepare = createLearningStartupPreparer({
    loadPath: async () => { throw new Error("offline"); },
    loadGame: async () => { warmedGame = true; },
    loadGameLoader: async () => {},
  });
  const results = await prepare({ targetLang: "es" });
  assert.equal(warmedGame, true);
  assert.deepEqual(results.map(result => result.status), ["rejected", "fulfilled", "fulfilled"]);
});

function scheduler(withIdle = true) {
  let id = 0;
  const frames = new Map(), idleJobs = new Map(), timers = new Map();
  const environment = {
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: handle => frames.delete(handle),
    setTimeout: (callback, delay) => { assert.equal(delay, 750); timers.set(++id, callback); return id; },
    clearTimeout: handle => timers.delete(handle),
  };
  if (withIdle) {
    environment.requestIdleCallback = (callback, options) => { assert.equal(options.timeout, 1500); idleJobs.set(++id, callback); return id; };
    environment.cancelIdleCallback = handle => idleJobs.delete(handle);
  }
  const flush = queue => { const callbacks = [...queue.values()]; queue.clear(); callbacks.forEach(callback => callback()); };
  return { environment, frame: () => flush(frames), idle: () => flush(idleJobs), timer: () => flush(timers) };
}

test("preparation waits for two frames and idle time, then uses the latest selected language", () => {
  const clock = scheduler();
  const warmed = [];
  const prepare = async options => { warmed.push(options.targetLang); };
  const cancel = scheduleLearningStartup({ targetLang: "es" }, clock.environment, prepare);
  clock.frame();
  assert.deepEqual(warmed, []);
  cancel();
  scheduleLearningStartup({ targetLang: "fr" }, clock.environment, prepare);
  clock.frame(); clock.frame();
  assert.deepEqual(warmed, []);
  clock.idle();
  assert.deepEqual(warmed, ["fr"]);
});

test("unmount cancels a pending idle warmup", () => {
  const clock = scheduler();
  let warmed = false;
  const cancel = scheduleLearningStartup({ targetLang: "es" }, clock.environment, async () => { warmed = true; });
  clock.frame(); clock.frame(); cancel(); clock.idle();
  assert.equal(warmed, false);
});

test("paint timing prevents preparation before the first visible screen", () => {
  const clock = scheduler();
  let emitPaint;
  let disconnected = false;
  clock.environment.PerformanceObserver = class {
    static supportedEntryTypes = ["paint"];
    constructor(callback) { emitPaint = name => callback({ getEntries: () => [{ name }] }); }
    observe(options) { assert.deepEqual(options, { type: "paint", buffered: true }); }
    disconnect() { disconnected = true; }
  };
  let warmed = false;
  scheduleLearningStartup({ targetLang: "es" }, clock.environment, async () => { warmed = true; });
  clock.frame(); clock.frame(); clock.idle();
  assert.equal(warmed, false);
  emitPaint("first-paint"); clock.frame(); clock.frame(); clock.idle();
  assert.equal(warmed, false);
  emitPaint("first-contentful-paint"); clock.frame(); clock.frame(); clock.idle();
  assert.equal(warmed, true);
  assert.equal(disconnected, true);
});

test("browsers without idle callbacks use a cancellable timer", () => {
  const clock = scheduler(false);
  let warmed = 0;
  const cancel = scheduleLearningStartup({ targetLang: "es" }, clock.environment, async () => { warmed++; });
  clock.frame(); clock.frame(); cancel(); clock.timer();
  assert.equal(warmed, 0);
  scheduleLearningStartup({ targetLang: "es" }, clock.environment, async () => { warmed++; });
  clock.frame(); clock.frame(); clock.timer();
  assert.equal(warmed, 1);
});
