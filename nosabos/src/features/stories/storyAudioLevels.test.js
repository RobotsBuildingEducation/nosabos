import test from "node:test";
import assert from "node:assert/strict";
import { speechBarLevels } from "./storyAudioLevels.js";

test("speech bars settle in silence and scale with the recorded waveform", () => {
  assert.deepEqual(speechBarLevels(new Float32Array(1024)), Array(12).fill(0));
  const quiet = speechBarLevels(new Float32Array(1024).fill(0.01));
  const speech = speechBarLevels(new Float32Array(1024).fill(0.12));
  assert.ok(speech.every((level, i) => level > quiet[i] && level <= 1));
  const varied = new Float32Array(120);
  varied.fill(0.2, 50, 60);
  assert.ok(speechBarLevels(varied)[5] > 0);
  assert.equal(speechBarLevels(varied).filter((level) => level > 0).length, 1);
  assert.ok(speechBarLevels(new Float32Array(1024).fill(2)).every((level) => level === 1));
});
