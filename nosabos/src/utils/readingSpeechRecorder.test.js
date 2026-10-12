import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { parse } from "@babel/parser";
import { createReadingSpeechRecorder } from "./readingSpeechRecorder.js";

function fixture(singleUtterance = true) {
  const sessions = [], transcripts = [], states = [], errors = [], timers = new Map();
  let timerId = 0;
  class Recognition {
    starts = 0;
    stops = 0;
    aborts = 0;
    constructor() { sessions.push(this); }
    start() { this.starts++; }
    stop() { this.stops++; }
    abort() { this.aborts++; }
    result(results, resultIndex = 0) {
      this.onresult({ resultIndex, results: results.map(([transcript, isFinal = false]) =>
        Object.assign([{ transcript }], { isFinal })) });
    }
    end() { this.onend(); }
    error(error) { this.onerror({ error }); }
  }
  const api = createReadingSpeechRecorder({
    Recognition, singleUtterance,
    onTranscript: text => transcripts.push(text),
    onState: state => states.push(state),
    onError: error => errors.push(error),
    setTimer: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
    clearTimer: id => timers.delete(id),
  });
  return {
    api, sessions, transcripts, states, errors, timers,
    get text() { return transcripts.at(-1); },
    tick(delay) {
      for (const [id, timer] of [...timers]) {
        if (timer.delay === delay && timers.has(id)) { timers.delete(id); timer.fn(); }
      }
    },
  };
}

test("Android shows interim text immediately and replaces it with a final once", () => {
  const r = fixture(); r.api.start("es-MX");
  const rec = r.sessions[0];
  assert.equal(rec.lang, "es-MX");
  assert.equal(rec.continuous, false);
  assert.equal(rec.interimResults, true);
  rec.result([["La hist"]]);
  assert.equal(r.text, "La hist"); // No debounce or silence timer.
  rec.result([["La historia", true]]);
  assert.equal(r.text, "La historia");
  rec.result([["La historia", true], ["La historia", true]]);
  assert.equal(r.text, "La historia");
  assert.equal(rec.stops, 1);
});

test("Android excludes interim echoes and duplicate final slots in one utterance", () => {
  const r = fixture(); r.api.start();
  r.sessions[0].result([["Una historia", true], ["Una historia", true], ["Una historia"]]);
  assert.equal(r.text, "Una historia");
});

test("automatic session ends keep recording and continue a paragraph without duplication", () => {
  const r = fixture(); r.api.start();
  const first = r.sessions[0]; first.result([["Primera frase", true]]); first.end();
  first.end(); // Duplicate end callbacks cannot archive the utterance twice.
  assert.equal(r.text, "Primera frase");
  assert.equal(r.states.at(-1), "listening");
  r.tick(100);
  assert.equal(r.sessions.length, 2);
  r.sessions[1].result([["Segunda fr"]]);
  assert.equal(r.text, "Primera frase Segunda fr");
  r.sessions[1].result([["Segunda frase", true]]);
  assert.equal(r.text, "Primera frase Segunda frase");
  first.result([["Old replay", true]]);
  assert.equal(r.text, "Primera frase Segunda frase");
});

test("a deliberate repeated phrase in a new utterance is preserved", () => {
  const r = fixture(); r.api.start();
  r.sessions[0].result([["sí sí", true]]); r.sessions[0].end(); r.tick(100);
  r.sessions[1].result([["sí sí", true]]);
  assert.equal(r.text, "sí sí sí sí");
});

test("desktop uses the complete result snapshot, replacing and shrinking interims", () => {
  const r = fixture(false); r.api.start();
  const rec = r.sessions[0];
  assert.equal(rec.continuous, true);
  rec.result([["Hola", true], ["mun"], ["eco"]]);
  assert.equal(r.text, "Hola mun eco");
  rec.result([["Hola", true], ["mundo"]], 1);
  assert.equal(r.text, "Hola mundo");
  rec.result([["Hola", true], ["mundo", true]], 1);
  rec.result([["Hola", true], ["mundo", true]], 2);
  assert.equal(r.text, "Hola mundo");
  assert.equal(rec.stops, 0);
});

test("Stop keeps the late final result, then ends without restarting", () => {
  const r = fixture(); r.api.start();
  const rec = r.sessions[0]; rec.result([["Una fr"]]); r.api.stop();
  assert.equal(r.states.at(-1), "stopping");
  rec.result([["Una frase", true]]); rec.end();
  assert.equal(r.text, "Una frase");
  assert.equal(r.states.at(-1), "idle");
  assert.equal(r.timers.size, 0);
  r.tick(100); assert.equal(r.sessions.length, 1);
});

test("Stop between utterances cancels the pending restart", () => {
  const r = fixture(); r.api.start();
  r.sessions[0].result([["Hola", true]]); r.sessions[0].end(); r.api.stop(); r.tick(100);
  assert.equal(r.sessions.length, 1);
  assert.equal(r.states.at(-1), "idle");
  assert.equal(r.timers.size, 0);
});

test("missing onend after Stop cannot leave the UI stuck", () => {
  const r = fixture(); r.api.start();
  const rec = r.sessions[0]; rec.result([["Hola"]]); r.api.stop(); r.tick(1500);
  assert.equal(r.text, "Hola");
  assert.equal(rec.aborts, 1);
  assert.equal(r.states.at(-1), "idle");
  assert.equal(r.timers.size, 0);
  rec.end(); assert.equal(r.text, "Hola");
});

test("missing onend after an Android final is recovered without losing the paragraph", () => {
  const r = fixture(); r.api.start();
  const rec = r.sessions[0]; rec.result([["Hola", true]]); r.tick(1500); r.tick(100);
  assert.equal(rec.aborts, 1);
  assert.equal(r.sessions.length, 2);
  assert.equal(r.states.at(-1), "listening");
  assert.equal(r.text, "Hola");
});

test("cancel ignores old results and shuts down a late microphone start", () => {
  const r = fixture(); r.api.start();
  const rec = r.sessions[0]; rec.result([["Hola"]]); r.api.cancel();
  rec.result([["Late words", true]]); rec.end(); rec.onstart();
  assert.equal(r.text, "Hola");
  assert.equal(rec.aborts, 2);
  assert.equal(r.timers.size, 0);
  assert.equal(r.states.at(-1), "idle");
});

test("a new recording starts empty and cannot receive the old recording's events", () => {
  const r = fixture(); r.api.start();
  const old = r.sessions[0]; old.result([["Old text"]]); r.api.start("en-US");
  old.result([["Old final", true]]); old.end();
  const next = r.sessions[1]; next.result([["New text"]]);
  assert.equal(next.lang, "en-US");
  assert.equal(r.text, "New text");
  assert.equal(old.aborts, 1);
});

test("dispose aborts capture, clears timers and never updates unmounted UI", () => {
  const r = fixture(); r.api.start();
  const rec = r.sessions[0]; const count = r.states.length;
  r.api.dispose(); rec.result([["Late"]]); rec.end(); r.api.start();
  assert.equal(rec.aborts, 1);
  assert.equal(r.states.length, count);
  assert.equal(r.transcripts.length, 0);
  assert.equal(r.sessions.length, 1);
  assert.equal(r.timers.size, 0);
});

test("permission denial stops immediately without retrying", () => {
  const r = fixture(); r.api.start(); r.sessions[0].error("not-allowed"); r.sessions[0].end();
  assert.equal(r.errors[0].code, "mic-denied");
  assert.equal(r.states.at(-1), "idle");
  assert.equal(r.timers.size, 0);
});

test("temporary network errors restart, but repeated failures are bounded", () => {
  const r = fixture(); r.api.start();
  for (let i = 0; i < 2; i++) { r.sessions[i].error("network"); r.sessions[i].end(); r.tick(300); }
  assert.equal(r.sessions.length, 3);
  assert.equal(r.errors.length, 0);
  r.sessions[2].error("network");
  assert.equal(r.errors[0].code, "connection-failed");
  assert.equal(r.states.at(-1), "idle");
  assert.equal(r.timers.size, 0);
});

test("no-speech recovery also handles missing end callbacks and eventually stops", () => {
  const r = fixture(); r.api.start();
  for (let i = 0; i < 3; i++) { r.sessions[i].error("no-speech"); r.tick(1500); r.tick(300); }
  assert.equal(r.sessions.length, 3);
  assert.equal(r.errors[0].code, "no-speech");
  assert.equal(r.states.at(-1), "idle");
  assert.equal(r.timers.size, 0);
});

test("three-minute limit stops recording and clears a pending restart", () => {
  const r = fixture(); r.api.start();
  r.sessions[0].result([["Hola", true]]); r.sessions[0].end(); r.tick(180000); r.tick(100);
  assert.equal(r.sessions.length, 1);
  assert.equal(r.text, "Hola");
  assert.equal(r.states.at(-1), "idle");
  assert.equal(r.timers.size, 0);
});

test("Reading's actual Record handler stops narration and configures native Android recognition", () => {
  const source = fs.readFileSync(new URL("../components/History.jsx", import.meta.url), "utf8");
  const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
  let handler;
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "FunctionDeclaration" && node.id.name === "startListening") handler = source.slice(node.start, node.end);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  visit(ast);
  assert.ok(handler);
  const calls = [], ref = { current: { dispose() { calls.push("dispose"); } } };
  class SpeechRecognition {}
  const deps = {
    window: { webkitSpeechRecognition: SpeechRecognition }, navigator: { userAgent: "Android Chrome", audioSession: {} },
    stopSpeech: () => calls.push("stop narration"), speechRecRef: ref,
    setSpeechTranscript: text => calls.push(["text", text]), setSpeechRecordingError() {},
    setIsListening() {}, setIsSpeechFinalizing() {}, getSpeechPracticeErrorFeedback() {}, t() {},
    BCP47: { es: { tts: "es-MX" } }, targetLang: "es",
    createReadingSpeechRecorder: options => {
      assert.equal(options.Recognition, SpeechRecognition);
      assert.equal(options.singleUtterance, true);
      return { start: lang => calls.push(["start native", lang]) };
    },
  };
  new Function(...Object.keys(deps), `${handler}; startListening();`)(...Object.values(deps));
  assert.deepEqual(calls, ["stop narration", "dispose", ["text", ""], ["start native", "es-MX"]]);
});
