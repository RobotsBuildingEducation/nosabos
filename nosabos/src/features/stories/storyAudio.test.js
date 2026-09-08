import test from "node:test";
import assert from "node:assert/strict";
import { createStoryAudio } from "./storyAudio.js";
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const fakePlayer = () => ({ audio: { play: async () => {}, pause() {}, onended: null, onerror: null }, ready: Promise.resolve(), cleanup() { this.cleaned = true; } });

test("each learner line requires speech before later turns or the question can appear", async () => {
  const players = Array.from({ length: 2 }, fakePlayer);
  let requested = 0; let complete = false; const states = [];
  const queue = createStoryAudio({ getPlayer: async (turn) => { assert.equal(turn.speaker, "Host", "Learner turns must never request TTS"); return players[requested++]; }, onState: (state) => states.push(state), onError: assert.fail });
  const pending = queue.play([{ speaker: "Host" }, { speaker: "You" }, { speaker: "Host" }, { speaker: "You" }], () => { complete = true; }, { requiresSpeech: (turn) => turn.speaker === "You" });
  await tick(); players[0].audio.onended(); await tick();
  assert.equal(states.at(-1), "awaiting_speech");
  assert.equal(requested, 1); assert.equal(complete, false);
  queue.completeSpeech(); await tick();
  assert.equal(requested, 2);
  players[1].audio.onended(); await tick();
  assert.equal(states.at(-1), "awaiting_speech"); assert.equal(complete, false);
  queue.completeSpeech(); await pending;
  assert.equal(complete, true);
});

test("leaving a speech turn cancels its gate and late speech cannot unlock the next segment", async () => {
  const players = [fakePlayer(), fakePlayer()]; let requested = 0; let complete = 0;
  const queue = createStoryAudio({ getPlayer: async () => players[requested++], onState() {}, onError: assert.fail });
  const pending = queue.play([{ speaker: "You" }], () => complete++, { requiresSpeech: () => true });
  assert.equal(requested, 0, "A first learner turn opens speech immediately without requesting audio");
  queue.stop(); queue.completeSpeech(); await pending;
  assert.equal(complete, 0);
  const replay = queue.play([{ speaker: "Host" }], () => complete++);
  await tick(); players[0].audio.onended(); await replay;
  assert.equal(complete, 1, "A completed segment can be replayed without recording again");
});

test("queue completes only after every turn ends, and supports pause/resume", async () => {
  const players = [fakePlayer(), fakePlayer()]; let index = 0; let completed = false;
  const states = [];
  const controller = createStoryAudio({ getPlayer: async () => players[index++], onState: (state) => states.push(state), onError: assert.fail });
  const playing = controller.play([{ speaker: "A" }, { speaker: "B" }], () => { completed = true; });
  await tick(); controller.pause(); assert.equal(states.at(-1), "paused");
  await controller.resume(); assert.equal(states.at(-1), "playing");
  players[0].audio.onended(); await tick(); assert.equal(completed, false);
  players[1].audio.onended(); await playing; assert.equal(completed, true);
  assert.equal(players.every((player) => player.cleaned), true);
});
test("stopping pending generation disposes late audio without playing or unlocking a question", async () => {
  let resolvePlayer; let played = false; let completed = false;
  const player = fakePlayer(); player.audio.play = async () => { played = true; };
  const controller = createStoryAudio({ getPlayer: () => new Promise((resolve) => { resolvePlayer = resolve; }), onState() {}, onError: assert.fail });
  const pending = controller.play([{ speaker: "A" }], () => { completed = true; });
  controller.stop(); resolvePlayer(player); await pending;
  assert.equal(played, false); assert.equal(completed, false); assert.equal(player.cleaned, true);
});
test("audio failure reports error and never completes listening", async () => {
  const player = fakePlayer(); let error; let completed = false;
  const controller = createStoryAudio({ getPlayer: async () => player, onState() {}, onError: (value) => { error = value; } });
  const pending = controller.play([{ speaker: "A" }], () => { completed = true; });
  await tick(); player.audio.onerror(); await pending;
  assert.ok(error); assert.equal(completed, false); assert.equal(player.cleaned, true);
});
test("replaying cancels the old queue and only the new queue can advance", async () => {
  const players = [fakePlayer(), fakePlayer()]; let index = 0; const completed = [];
  const controller = createStoryAudio({ getPlayer: async () => players[index++], onState() {}, onError: assert.fail });
  const first = controller.play([{ speaker: "A" }], () => completed.push("old")); await tick();
  const second = controller.play([{ speaker: "B" }], () => completed.push("new")); await tick();
  players[1].audio.onended(); await Promise.all([first, second]);
  assert.deepEqual(completed, ["new"]); assert.equal(players[0].cleaned, true);
});

test("realtime playout completion advances even when play() stays pending and no ended event fires", async () => {
  let endHost; let endCaller; let requests = 0; let complete = false;
  const host = fakePlayer(); const caller = fakePlayer();
  host.audio.play = () => new Promise(() => {});
  caller.audio.play = () => new Promise(() => {});
  host.completion = new Promise((resolve) => { endHost = resolve; });
  caller.completion = new Promise((resolve) => { endCaller = resolve; });
  const queue = createStoryAudio({ getPlayer: async () => [host, caller][requests++], onState() {}, onError: assert.fail });
  const pending = queue.play([{ speaker: "Host" }, { speaker: "Caller" }], () => { complete = true; });
  await tick(); endHost({ status: "ended" }); await tick();
  assert.equal(requests, 2); assert.equal(complete, false);
  endCaller({ status: "ended" }); await pending;
  assert.equal(complete, true);
  assert.equal(host.cleaned, undefined, "Natural completion must not cancel cache finalization");
});

test("early realtime failure cannot be mistaken for a finished turn", async () => {
  const player = fakePlayer(); let error; let complete = false;
  player.ready = new Promise(() => {});
  player.completion = Promise.resolve({ status: "error", error: new Error("RTC failed") });
  const queue = createStoryAudio({ getPlayer: async () => player, onState() {}, onError: (value) => { error = value; } });
  await queue.play([{ speaker: "Host" }], () => { complete = true; });
  assert.match(error.message, /RTC failed/); assert.equal(complete, false);
});

for (const stage of ["setup", "readiness", "starting playback", "playback"]) {
  test(`a stalled ${stage} returns to idle without unlocking the checkpoint`, async () => {
    const player = fakePlayer(); let error; let complete = false; const states = [];
    if (stage === "readiness") player.ready = new Promise(() => {});
    if (stage === "starting playback") player.audio.play = () => new Promise(() => {});
    const queue = createStoryAudio({
      getPlayer: () => stage === "setup" ? new Promise(() => {}) : Promise.resolve(player),
      setupTimeoutMs: 10, playbackTimeoutMs: 10,
      onState: (value) => states.push(value), onError: (value) => { error = value; },
    });
    await queue.play([{ speaker: "Host" }], () => { complete = true; });
    assert.equal(error.message, `Radio audio timed out during ${stage}`);
    assert.equal(states.at(-1), "idle"); assert.equal(complete, false);
    if (stage !== "setup") assert.equal(player.cleaned, true);
  });
}

test("pause suspends the watchdog and resume restores completion", async () => {
  const player = fakePlayer(); let complete = false;
  const queue = createStoryAudio({ getPlayer: async () => player, playbackTimeoutMs: 15, onState() {}, onError: assert.fail });
  const pending = queue.play([{ speaker: "Host" }], () => { complete = true; });
  await tick(); queue.pause(); await new Promise((resolve) => setTimeout(resolve, 35));
  assert.equal(complete, false); await queue.resume();
  player.audio.onended(); await pending; assert.equal(complete, true);
});
