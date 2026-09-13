import test from "node:test";
import assert from "node:assert/strict";
import { createJourneyRecorder } from "./journeyRecorder.js";

function harness(options = {}) {
  const states = [], recordings = [], recorders = [];
  let time = 0, tick, stopped = 0, cleared = 0;
  const stream = { getTracks: () => [{ stop: () => stopped++ }] };
  class Recorder {
    static isTypeSupported(type) { return type === (options.mimeType || "audio/webm;codecs=opus"); }
    constructor(_stream, settings) { this.state = "inactive"; this.mimeType = settings.mimeType; recorders.push(this); }
    start() { this.state = "recording"; }
    stop() {
      this.state = "inactive";
      queueMicrotask(() => { this.ondataavailable?.({ data: new Blob(["final audio"], { type: this.mimeType }) }); this.onstop?.(); });
    }
  }
  const controller = createJourneyRecorder({
    onState: state => states.push(state), onRecording: recording => recordings.push(recording),
    Recorder, mediaDevices: { getUserMedia: options.getUserMedia || (async () => stream) }, now: () => time,
    setTimer: fn => { tick = fn; return 1; }, clearTimer: () => cleared++,
  });
  return { controller, states, recordings, recorders, stream, elapsed(ms) { time += ms; tick?.(); }, get stopped() { return stopped; }, get cleared() { return cleared; } };
}

test("recording stops at 45 seconds, keeps the final chunk, and releases microphone", async () => {
  const h = harness(); await h.controller.start(); h.elapsed(45000);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.recordings[0].duration, 45);
  assert.equal(await h.recordings[0].blob.text(), "final audio");
  assert.ok(h.stopped); assert.ok(h.cleared);
  assert.equal(h.states.at(-1).status, "preview");
});

test("closing while microphone permission is pending stops the eventual stream", async () => {
  let resolve;
  const h = harness({ getUserMedia: () => new Promise(done => { resolve = done; }) });
  const pending = h.controller.start(); h.controller.dispose(); resolve(h.stream); await pending;
  assert.equal(h.stopped, 1); assert.equal(h.recorders.length, 0); assert.equal(h.recordings.length, 0);
});

test("closing during recording discards audio and detaches handlers", async () => {
  const h = harness(); await h.controller.start(); h.elapsed(3000); h.controller.dispose();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.recordings.length, 0); assert.ok(h.stopped);
});

test("permission denial is recoverable and does not create a recording", async () => {
  let denied = true;
  const h = harness({ getUserMedia: async () => { if (denied) throw new Error("denied"); return h.stream; } });
  await h.controller.start(); assert.equal(h.states.at(-1).error, "micError");
  denied = false; await h.controller.start(); assert.equal(h.states.at(-1).status, "recording"); h.controller.dispose();
});

test("Safari's supported MP4 type is preserved for playback", async () => {
  const h = harness({ mimeType: "audio/mp4" }); await h.controller.start(); h.elapsed(3000); h.controller.stop();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.recordings[0].blob.type, "audio/mp4");
});

test("oversized recordings are discarded and release the microphone", async () => {
  const h = harness(); await h.controller.start();
  h.recorders[0].ondataavailable({ data: new Blob([new Uint8Array(700000)]) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.states.at(-1).error, "error"); assert.equal(h.recordings.length, 0); assert.ok(h.stopped);
});
