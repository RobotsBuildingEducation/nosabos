import assert from "node:assert/strict";
import test from "node:test";
import { watchPhonicsPlaybackCompletion } from "./phonicsPlayback.js";

function createPlayer({ cached = false } = {}) {
  const track = new EventTarget();
  track.muted = false;
  track.readyState = "live";
  const audio = new EventTarget();
  audio.currentTime = 0;
  audio.srcObject = cached ? null : { getAudioTracks: () => [track] };
  let complete;
  let fail;
  const finalize = new Promise((resolve, reject) => {
    complete = resolve;
    fail = reject;
  });
  return { audio, track, finalize, complete, fail };
}

test("initial silence, track readiness, and pauses between sounds cannot finish phonics", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const player = createPlayer();
  let completions = 0;
  watchPhonicsPlaybackCompletion(player, () => completions++);

  player.audio.dispatchEvent(new Event("playing"));
  player.track.dispatchEvent(new Event("unmute"));
  t.mock.timers.tick(5000); // Speech can start well after the media track does.
  assert.equal(completions, 0);
  player.audio.currentTime = 1;
  player.track.dispatchEvent(new Event("mute"));
  player.audio.dispatchEvent(new Event("waiting"));
  t.mock.timers.tick(2000);
  assert.equal(completions, 0);
  player.track.dispatchEvent(new Event("unmute"));
  player.audio.dispatchEvent(new Event("playing"));
  t.mock.timers.tick(2000);
  assert.equal(completions, 0);

  player.complete();
  await player.finalize;
  assert.equal(completions, 1);
});

for (const cached of [false, true]) {
  test(`${cached ? "cached replay" : "live narration"} finishes exactly once when media ends and player finalizes`, async () => {
    const player = createPlayer({ cached });
    let completions = 0;
    watchPhonicsPlaybackCompletion(player, () => completions++);
    await Promise.resolve();
    assert.equal(completions, 0);
    player.audio.dispatchEvent(new Event("ended"));
    player.complete();
    await player.finalize;
    assert.equal(completions, 1);
  });
}

test("media errors clean up without waiting for a natural end", async () => {
  const player = createPlayer();
  let completions = 0;
  watchPhonicsPlaybackCompletion(player, () => completions++);
  player.audio.dispatchEvent(new Event("error"));
  player.complete();
  await player.finalize;
  assert.equal(completions, 1);
});

test("a rejected finalizer also releases the phonics UI", async () => {
  const player = createPlayer();
  let completions = 0;
  watchPhonicsPlaybackCompletion(player, () => completions++);
  player.fail(new Error("Playback failed"));
  await player.finalize.catch(() => {});
  assert.equal(completions, 1);
});

test("detaching a replaced card ignores late completion and media events", async () => {
  const player = createPlayer();
  let completions = 0;
  const detach = watchPhonicsPlaybackCompletion(player, () => completions++);
  detach();
  detach();
  player.audio.dispatchEvent(new Event("ended"));
  player.audio.dispatchEvent(new Event("error"));
  player.complete();
  await player.finalize;
  assert.equal(completions, 0);
});
