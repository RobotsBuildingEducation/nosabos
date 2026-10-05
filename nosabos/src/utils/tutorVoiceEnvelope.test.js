import test from "node:test";
import assert from "node:assert/strict";
import { createTutorVoiceEnvelope, waveformRms } from "./tutorVoiceEnvelope.js";

function advance(envelope, amplitude, durationMs, stepMs = 1000 / 60) {
  let level;
  for (let time = 0; time < durationMs; time += stepMs) level = envelope(amplitude, stepMs);
  return level;
}

test("waveform amplitude ignores microphone DC offset but measures speech", () => {
  assert.equal(waveformRms(new Float32Array(256).fill(0.03)), 0);
  assert.equal(waveformRms([]), 0);
  const samples = Float32Array.from({ length: 256 }, (_, i) => 0.03 + (i % 2 ? 0.04 : -0.04));
  assert.ok(Math.abs(waveformRms(samples) - 0.04) < 1e-6);
});

test("silence, fluctuating room noise, and isolated clicks do not animate speech", () => {
  const envelope = createTutorVoiceEnvelope();
  for (let i = 0; i < 300; i++) assert.equal(envelope(i % 2 ? 0.001 : 0.006, 1000 / 60), 0);
  assert.equal(advance(envelope, 0.15, 40, 10), 0);
  assert.equal(advance(envelope, 0, 1000), 0);
});

test("speech rises gently, bridges syllable gaps, and settles to rest", () => {
  const envelope = createTutorVoiceEnvelope();
  assert.equal(advance(envelope, 0.04, 50, 10), 0);
  const initial = advance(envelope, 0.04, 40, 10);
  const sustained = advance(envelope, 0.04, 400, 10);
  assert.ok(initial > 0 && initial < sustained * 0.4);
  const gap = advance(envelope, 0, 80, 10);
  assert.ok(gap > sustained * 0.7);
  const resumed = advance(envelope, 0.04, 100, 10);
  assert.ok(resumed > gap);
  assert.equal(advance(envelope, 0, 3000, 10), 0);
});

test("response timing stays consistent across screen refresh rates", () => {
  const at30 = advance(createTutorVoiceEnvelope(), 0.04, 1000, 1000 / 30);
  const at120 = advance(createTutorVoiceEnvelope(), 0.04, 1000, 1000 / 120);
  assert.ok(Math.abs(at30 - at120) < 0.002);
});

test("tutor playback responds immediately and keeps levels bounded", () => {
  const envelope = createTutorVoiceEnvelope({ microphone: false });
  assert.ok(envelope(0.04, 16) > 0);
  assert.ok(advance(envelope, 2, 1000) <= 1);
  assert.equal(advance(envelope, NaN, 3000), 0);
});
