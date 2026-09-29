import test from "node:test";
import assert from "node:assert/strict";
import {
  clearGlobalTeamFeedCache,
  getCachedGlobalTeamFeed,
  GLOBAL_TEAM_FEED_HASHTAG,
  loadGlobalTeamFeed,
} from "./globalTeamFeedCache.js";

test("background preload and feed opening share one request and reuse its result", async () => {
  clearGlobalTeamFeedCache();
  let finish;
  let calls = 0;
  const fetchNotes = (hashtag) => {
    assert.equal(hashtag, GLOBAL_TEAM_FEED_HASHTAG);
    calls += 1;
    return new Promise((resolve) => { finish = resolve; });
  };

  const preload = loadGlobalTeamFeed(fetchNotes);
  const openedFeed = loadGlobalTeamFeed(fetchNotes);
  assert.equal(preload, openedFeed);
  await Promise.resolve();
  assert.equal(calls, 1);

  const notes = [{ id: "one" }];
  finish(notes);
  assert.deepEqual(await openedFeed, notes);
  assert.deepEqual(getCachedGlobalTeamFeed(), notes);
  assert.deepEqual(await loadGlobalTeamFeed(fetchNotes), notes);
  assert.equal(calls, 1);
});

test("refresh replaces the cached feed and failed requests can retry", async () => {
  clearGlobalTeamFeedCache();
  let calls = 0;
  const fetchNotes = async () => [{ id: String(++calls) }];
  assert.deepEqual(await loadGlobalTeamFeed(fetchNotes), [{ id: "1" }]);
  assert.deepEqual(await loadGlobalTeamFeed(fetchNotes, { force: true }), [{ id: "2" }]);
  assert.deepEqual(getCachedGlobalTeamFeed(), [{ id: "2" }]);

  clearGlobalTeamFeedCache();
  await assert.rejects(loadGlobalTeamFeed(() => Promise.reject(new Error("offline"))), /offline/);
  assert.equal(getCachedGlobalTeamFeed(), null);
  assert.deepEqual(await loadGlobalTeamFeed(fetchNotes), [{ id: "3" }]);
});
