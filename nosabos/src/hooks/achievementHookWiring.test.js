import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import parser from "@babel/parser";
import { createCommittedProgressObserver } from "../achievements/committedProgress.js";
import { unlockStore } from "../achievements/unlockStore.js";
import { piyaliCompletionProof } from "../utils/piyaliAchievementProgress.js";
import { awardProgressionAchievements, getStoredAchievements } from "../utils/achievements.js";

const source = readFileSync(new URL("./usePiyaliAchievements.js", import.meta.url), "utf8");
const ast = parser.parse(source, { sourceType: "module" });
const node = ast.program.body.find(node => node.type === "ExportDefaultDeclaration").declaration;

test("the actual Piyali hook connects confirmed Firestore writes to awards and releases its listeners", async () => {
  const previous = { window: globalThis.window, storage: globalThis.localStorage };
  const storage = new Map(), listeners = new Map(), cleanups = [], deliveries = [];
  const account = "live-hook-audit";
  globalThis.window = {};
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  unlockStore.setIdentity(account);
  const dependencies = { achievementServices: {}, useAchievementAccount: () => {}, getDailyPlateSnapshot: () => ({ dayKey: "2026-10-04" }),
    useEffect: effect => { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); },
    database: {}, doc: (_db, ...parts) => parts.join("/"),
    onSnapshot: (path, options, receive) => {
      assert.equal(options.includeMetadataChanges, true);
      listeners.set(path, receive); return () => listeners.delete(path);
    },
    createCommittedProgressObserver, piyaliCompletionProof,
    awardProgressionAchievements: args => { const job = awardProgressionAchievements(args); deliveries.push(job); return job; },
    awardPiyaliFlashcardProgress: () => assert.fail("no unrelated flashcard hydration"),
  };
  const hook = Function(...Object.keys(dependencies), source.slice(node.start, node.end) + "\nreturn usePiyaliAchievements;")(...Object.values(dependencies));
  const snapshot = (data, metadata = {}) => ({ metadata, exists: () => data !== null, data: () => data });
  try {
    hook({ id: "other-account" }, "es", account);
    assert.equal(listeners.size, 0, "stale profile can't award the active account");
    hook({ local_npub: account, progress: {} }, "es", account);
    assert.equal(listeners.size, 3);
    const profile = listeners.get(`users/${account}`);
    const summary = listeners.get(`users/${account}/courseProgress/es`);
    const quest = listeners.get(`users/${account}/questDays/es_2026-10-04`);
    profile(snapshot({ progress: {} })); quest(snapshot(null));
    const progress = completed => ({ migration: { complete: true }, skillTree: { levels: { pre_a1: { total: 86, completed } } } });
    summary(snapshot(progress(4)));
    await Promise.all(deliveries);
    assert.equal(getStoredAchievements(account).nosabos_skill_tree_lessons_5, undefined);
    summary(snapshot(progress(5), { hasPendingWrites: true }));
    summary(snapshot(progress(5), { fromCache: true }));
    assert.equal(deliveries.length, 1);
    summary(snapshot(progress(5)));
    await Promise.all(deliveries);
    assert.ok(getStoredAchievements(account).nosabos_skill_tree_lessons_5);
    cleanups.forEach(stop => stop());
    assert.equal(listeners.size, 0);
    summary(snapshot(progress(10)));
    await Promise.all(deliveries);
    assert.equal(getStoredAchievements(account).nosabos_skill_tree_lessons_10, undefined);
  } finally {
    cleanups.forEach(stop => stop()); unlockStore.setIdentity("");
    if (previous.window === undefined) delete globalThis.window; else globalThis.window = previous.window;
    if (previous.storage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous.storage;
  }
});
