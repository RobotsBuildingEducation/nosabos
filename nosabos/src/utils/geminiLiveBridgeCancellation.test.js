import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { parse } from "@babel/parser";

const source = fs.readFileSync(new URL("./geminiLiveBridge.js", import.meta.url), "utf8");
const ast = parse(source, { sourceType: "module" });
function declaration(name, dependencies) {
  const node = ast.program.body.map((item) => item.declaration || item).find((item) => item.id?.name === name);
  return new Function(...Object.keys(dependencies), `${source.slice(node.start, node.end)}; return ${name};`)(...Object.values(dependencies));
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function environment(getUserMedia = async () => { throw new Error("Unexpected microphone request"); }) {
  let contexts = 0, contextCloses = 0;
  class AudioContext {
    constructor() { contexts += 1; this.state = "running"; this.currentTime = 0; }
    async close() { this.state = "closed"; contextCloses += 1; }
  }
  const Bridge = declaration("GeminiLiveRealtimeBridge", {
    normalizeGeminiLiveVoice: (value) => value, INPUT_SPEECH_HOLD_MS: 1200,
    INPUT_ECHO_CANCELLATION: true, INPUT_NOISE_SUPPRESSION: true, INPUT_AUTO_GAIN_CONTROL: true,
    AudioContext, webkitAudioContext: undefined, window: { AudioContext },
    navigator: { mediaDevices: { getUserMedia } },
  });
  return { Bridge, AudioContext, get contexts() { return contexts; }, get contextCloses() { return contextCloses; } };
}

test("canceling the SDK handshake closes a late session without ever requesting microphone access", async () => {
  const env = environment();
  const sdk = deferred();
  let socketCloses = 0;
  const bridge = new env.Bridge({ voice: "test" });
  bridge.connectLiveSession = () => sdk.promise;
  const pending = bridge.connect();
  await bridge.close();
  sdk.resolve({ close: async () => { socketCloses += 1; } });
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(socketCloses, 1);
  assert.equal(env.contexts, 0);
});

test("canceling while microphone permission is pending stops every late track and closes Web Audio", async () => {
  const microphone = deferred();
  let requested = false, trackStops = 0, socketCloses = 0;
  const env = environment(() => { requested = true; return microphone.promise; });
  const bridge = new env.Bridge({ voice: "test" });
  bridge.connectLiveSession = async () => ({ close: async () => { socketCloses += 1; } });
  const pending = bridge.connect();
  await Promise.resolve();
  assert.equal(requested, true);
  await bridge.close();
  microphone.resolve({ getTracks: () => [{ stop: () => { trackStops += 1; } }] });
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(trackStops, 1);
  assert.equal(env.contextCloses, 1);
  assert.equal(socketCloses, 1);
});

test("factory abort signals close a supplied, pre-unlocked audio context during startup", async () => {
  const env = environment();
  const sdk = deferred();
  const signalController = new AbortController();
  env.Bridge.prototype.connectLiveSession = () => sdk.promise;
  const factory = declaration("createGeminiLiveRealtimeBridge", {
    GeminiLiveRealtimeBridge: env.Bridge, DEFAULT_GEMINI_LIVE_VOICE: "test",
  });
  const context = new env.AudioContext();
  const pending = factory({ signal: signalController.signal, audioContext: context });
  signalController.abort();
  sdk.resolve({ close: async () => {} });
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(env.contexts, 1);
  assert.equal(env.contextCloses, 1);
  assert.equal(context.state, "closed");
});

test("an already canceled factory request releases its supplied context before connecting", async () => {
  const env = environment();
  const controller = new AbortController();
  controller.abort();
  let connects = 0;
  env.Bridge.prototype.connectLiveSession = async () => { connects += 1; };
  const factory = declaration("createGeminiLiveRealtimeBridge", {
    GeminiLiveRealtimeBridge: env.Bridge, DEFAULT_GEMINI_LIVE_VOICE: "test",
  });
  await assert.rejects(factory({ signal: controller.signal, audioContext: new env.AudioContext() }), { name: "AbortError" });
  assert.equal(connects, 0);
  assert.equal(env.contextCloses, 1);
});
