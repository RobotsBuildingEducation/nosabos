import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { parse } from "@babel/parser";
import { getSpeechPracticeErrorFeedback } from "../utils/speechPracticeFeedback.js";

// Exercise the actual hook lifecycle with controlled WebRTC and React hooks.
const source = fs.readFileSync(new URL("./useSpeechPractice.js", import.meta.url), "utf8");
const ast = parse(source, { sourceType: "module" });
const functions = ["makeError", "buildRealtimeSpeechSession", "useSpeechPractice"].map((name) => {
  const node = ast.program.body.map((item) => item.declaration || item)
    .find((item) => item.type === "FunctionDeclaration" && item.id.name === name);
  return source.slice(node.start, node.end);
}).join("\n");

function recorder() {
  const results = [], sent = [], timers = new Map(), state = [];
  let channel, nextTimer = 0;
  const track = { enabled: true, stopped: false, stop() { this.stopped = true; } };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  class PeerConnection {
    addTransceiver() {}
    addTrack() {}
    createDataChannel() {
      channel = { readyState: "connecting", send: (raw) => sent.push(JSON.parse(raw)), close() { this.readyState = "closed"; } };
      return channel;
    }
    async createOffer() { return { sdp: "offer" }; }
    async setLocalDescription() {}
    async setRemoteDescription() {}
    close() {}
  }
  const deps = {
    useRef: (current) => ({ current }), useCallback: (fn) => fn,
    useEffect: () => {}, useMemo: (fn) => fn(),
    useState: (initial) => { const index = state.push(initial) - 1; return [initial, (value) => { state[index] = value; }]; },
    navigator: { mediaDevices: { getUserMedia: async () => stream } }, window: {},
    RTCPeerConnection: PeerConnection, REALTIME_URL: "fake", REALTIME_MODEL: "fake",
    BCP47_TO_WHISPER: { es: "es" }, MIN_SPEECH_TURN_MS: 500, TRANSCRIPT_GRACE_MS: 2500,
    SESSION_UPDATE_EVENT_ID: "speech-practice-session-update",
    appCheckFetch: async () => ({ ok: true, text: async () => "answer" }),
    evaluateAttemptStrict: ({ recognizedText }) => ({ pass: !!recognizedText }),
    setTimeout: (fn, delay) => { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
    clearTimeout: (id) => timers.delete(id), console: { error() {}, warn() {} },
  };
  const hook = new Function(...Object.keys(deps), functions + ";return useSpeechPractice;")(...Object.values(deps));
  const api = hook({ targetText: "sí", targetLang: "es", onResult: (result) => results.push(result) });
  return {
    api, results, sent, timers, track, state,
    open() { channel.readyState = "open"; channel.onopen(); },
    message(data) { channel.onmessage({ data: JSON.stringify(data) }); },
    close() { channel.onclose(); },
    async tick(delay) {
      for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); await timer.fn(); }
      await Promise.resolve(); await Promise.resolve();
    },
  };
}

test("speech recorder waits for the voice channel, and Stop during setup cancels silently", async () => {
  const r = recorder();
  await r.api.startRecording();
  assert.equal(r.track.enabled, false);
  assert.equal(r.state[1], true); // isConnecting
  assert.equal(r.state[0], false); // isRecording
  r.api.stopRecording();
  assert.equal(r.track.stopped, true);
  r.open(); // A late onopen cannot re-enable the canceled microphone.
  assert.equal(r.track.enabled, false);
  assert.deepEqual(r.results, []);
});

test("Stop leaves silence for server VAD and waits for transcription without an extra commit", async () => {
  const r = recorder(); await r.api.startRecording(); r.open();
  assert.equal(r.track.enabled, true);
  r.message({ type: "input_audio_buffer.speech_started" });
  r.api.stopRecording();
  assert.equal(r.track.enabled, false);
  assert.equal(r.track.stopped, false);
  assert.ok(!r.sent.some((event) => event.type === "input_audio_buffer.commit"));
  r.message({ type: "input_audio_buffer.committed" });
  r.message({ type: "conversation.item.input_audio_transcription.completed", transcript: "sí" });
  await r.tick(80);
  assert.equal(r.results.length, 1);
  assert.equal(r.results[0].recognizedText, "sí");
  assert.equal(r.track.stopped, true);
});

test("empty recording gives a no-speech warning rather than a connection error or a grade", async () => {
  const r = recorder(); await r.api.startRecording(); r.open(); r.api.stopRecording();
  await r.tick(2500);
  assert.equal(r.results.length, 1);
  assert.equal(r.results[0].error.code, "no-speech");
  assert.equal(r.results[0].evaluation, null);
  assert.equal(getSpeechPracticeErrorFeedback(r.results[0].error, (key) => key).status, "warning");
  assert.equal(r.track.stopped, true);
});

test("expected empty-commit error does not reject an otherwise healthy recording", async () => {
  const r = recorder(); await r.api.startRecording(); r.open();
  r.message({ type: "error", error: { code: "input_audio_buffer_commit_empty", message: "Empty audio buffer" } });
  assert.deepEqual(r.results, []);
  assert.equal(r.track.stopped, false);
  r.api.cancelRecording();
});

test("connection setup times out only while connecting, not ten seconds into speaking", async () => {
  const r = recorder(); await r.api.startRecording(); r.open();
  await r.tick(10000);
  assert.deepEqual(r.results, []);
  assert.equal(r.track.stopped, false);
  r.api.cancelRecording();
  const stalled = recorder(); await stalled.api.startRecording(); await stalled.tick(10000);
  assert.equal(stalled.results[0].error.code, "connection-timeout");
  assert.equal(stalled.track.stopped, true);
});

test("transcription and connection loss are reported with distinct causes", async () => {
  const r = recorder(); await r.api.startRecording(); r.open();
  r.message({ type: "conversation.item.input_audio_transcription.failed", error: { message: "Transcription unavailable" } });
  assert.equal(r.results[0].error.code, "transcription-failed");
  assert.equal(getSpeechPracticeErrorFeedback(r.results[0].error, (key) => key).title, "speech_transcription_error_title");
  const disconnected = recorder(); await disconnected.api.startRecording(); disconnected.open(); disconnected.close();
  assert.equal(disconnected.results[0].error.code, "connection-closed");
});
