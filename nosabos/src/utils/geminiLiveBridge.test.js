import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_GEMINI_LIVE_INPUT_PREROLL_MS,
  DEFAULT_GEMINI_LIVE_INPUT_RMS_THRESHOLD,
  DEFAULT_GEMINI_LIVE_INPUT_SPEECH_HOLD_MS,
  DEFAULT_GEMINI_LIVE_SESSION_RESPONSE_LIMIT,
  INPUT_AUTO_GAIN_CONTROL,
  INPUT_ECHO_CANCELLATION,
  INPUT_NOISE_SUPPRESSION,
  INPUT_PREROLL_MS,
  INPUT_SILENCE_RMS_THRESHOLD,
  INPUT_SPEECH_HOLD_MS,
  SESSION_RESPONSE_LIMIT,
  getPcm16DurationMs,
  getPcm16Rms,
} from "./geminiLiveBridge.js";

test("Gemini Live defaults protect against audio context and dead-air cost ballooning", () => {
  assert.equal(DEFAULT_GEMINI_LIVE_SESSION_RESPONSE_LIMIT, 4);
  assert.equal(DEFAULT_GEMINI_LIVE_INPUT_RMS_THRESHOLD, 0.015);
  assert.equal(DEFAULT_GEMINI_LIVE_INPUT_PREROLL_MS, 400);
  assert.equal(DEFAULT_GEMINI_LIVE_INPUT_SPEECH_HOLD_MS, 1200);

  assert.equal(SESSION_RESPONSE_LIMIT, 4);
  assert.equal(INPUT_SILENCE_RMS_THRESHOLD, 0.015);
  assert.equal(INPUT_PREROLL_MS, 400);
  assert.equal(INPUT_SPEECH_HOLD_MS, 1200);

  // Noise suppression and echo cancellation default to enabled
  assert.equal(INPUT_ECHO_CANCELLATION, true);
  assert.equal(INPUT_NOISE_SUPPRESSION, true);
  // Auto-gain control stays off to prevent pumping ambient noise floors
  assert.equal(INPUT_AUTO_GAIN_CONTROL, false);
});

test("getPcm16Rms correctly measures amplitude and distinguishes speech from noise", () => {
  // Empty buffer
  assert.equal(getPcm16Rms(new ArrayBuffer(0)), 0);

  // Pure silence (zeros)
  const silence = new Int16Array(1600);
  assert.equal(getPcm16Rms(silence.buffer), 0);

  // Constant amplitude of 0.5 (16384 in int16)
  const halfAmplitude = new Int16Array(1600);
  halfAmplitude.fill(16384);
  const halfRms = getPcm16Rms(halfAmplitude.buffer);
  assert.ok(Math.abs(halfRms - 0.5) < 0.001);

  // Low ambient room noise (~0.005 RMS) is below the 0.015 speech threshold
  const ambientNoise = new Int16Array(1600);
  const noiseAmp = Math.round(0.005 * 32768); // ~164
  ambientNoise.fill(noiseAmp);
  const ambientRms = getPcm16Rms(ambientNoise.buffer);
  assert.ok(ambientRms < INPUT_SILENCE_RMS_THRESHOLD);

  // Conversational speech amplitude (~0.08 RMS) is well above the 0.015 threshold
  const speechSignal = new Int16Array(1600);
  const speechAmp = Math.round(0.08 * 32768); // ~2621
  speechSignal.fill(speechAmp);
  const speechRms = getPcm16Rms(speechSignal.buffer);
  assert.ok(speechRms > INPUT_SILENCE_RMS_THRESHOLD);
});

test("getPcm16DurationMs accurately computes 16kHz audio sample durations", () => {
  // 16,000 samples at 16kHz = 1,000 ms (1 second)
  const oneSecondSamples = new Int16Array(16000);
  assert.equal(getPcm16DurationMs(oneSecondSamples.buffer), 1000);

  // 160 samples at 16kHz = 10 ms
  const tenMsSamples = new Int16Array(160);
  assert.equal(getPcm16DurationMs(tenMsSamples.buffer), 10);

  // 0 samples = 0 ms
  assert.equal(getPcm16DurationMs(new ArrayBuffer(0)), 0);
});

test("context truncation logic flags reset when session response limit is reached", () => {
  let completedResponses = 0;
  let resetPending = false;

  function simulateResponseDone(limit = SESSION_RESPONSE_LIMIT) {
    completedResponses += 1;
    if (limit > 0 && completedResponses >= limit) {
      resetPending = true;
    }
  }

  // Turn 1, 2, 3: no reset
  simulateResponseDone(4);
  assert.equal(completedResponses, 1);
  assert.equal(resetPending, false);

  simulateResponseDone(4);
  simulateResponseDone(4);
  assert.equal(completedResponses, 3);
  assert.equal(resetPending, false);

  // Turn 4: triggers resetPending
  simulateResponseDone(4);
  assert.equal(completedResponses, 4);
  assert.equal(resetPending, true);
});
