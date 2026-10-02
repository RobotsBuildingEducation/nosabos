import test from "node:test";
import assert from "node:assert/strict";
import { createTutorAtmosphereMotion } from "./tutorAtmosphereMotion.js";
import { createTutorVoiceEnvelope } from "./tutorVoiceEnvelope.js";

// For f(x + phase), increasing phase moves the sampled shape to the left.
const backgroundPhase = (motion) => -motion.time * 0.16;
const run = (advance, level, seconds, fps = 24) => {
  let result;
  for (let i = 0; i < seconds * fps; i++) result = advance(level, 1 / fps);
  return { ...result };
};

test("playback swells an independent leftward wave without reversing the background", () => {
  const advance = createTutorAtmosphereMotion();
  const quietAdvance = createTutorAtmosphereMotion();
  const quiet = run(advance, 0, 1);
  run(quietAdvance, 0, 1);
  assert.ok(backgroundPhase(quiet) < 0);
  const playbackEnvelope = createTutorVoiceEnvelope({ microphone: false });
  let playbackLevel;
  for (let i = 0; i < 24; i++) playbackLevel = playbackEnvelope(0.015, 1000 / 24);
  const speaking = run(advance, playbackLevel, 1);
  const silent = run(quietAdvance, 0, 1);
  assert.equal(backgroundPhase(speaking), backgroundPhase(silent));
  assert.ok(speaking.speechTravel > quiet.speechTravel);
  assert.ok(speaking.activity > 0.1, "normal playback makes the overlapping wave visible");
  const settled = run(advance, 0, 4);
  const pause = run(advance, 0, 1);
  assert.ok(backgroundPhase(pause) < backgroundPhase(settled));
  assert.ok(pause.speechTravel > settled.speechTravel, "the fading wave continues left without reversing");
  assert.ok(pause.activity < 0.001, "the wave fades away during a pause");
});

test("speech onset and release keep position continuous", () => {
  const advance = createTutorAtmosphereMotion();
  const quiet = { ...advance(0, 1 / 24) };
  const onset = { ...advance(1, 1 / 24) };
  const release = { ...advance(0, 1 / 24) };
  assert.ok(onset.activity > 0 && onset.activity < 0.65);
  assert.ok(release.activity > 0 && release.activity < onset.activity);
  assert.ok(onset.speechTravel > quiet.speechTravel);
  assert.ok(release.speechTravel > onset.speechTravel);
  assert.ok(onset.speechTravel - quiet.speechTravel < 0.04);
  assert.ok(release.speechTravel - onset.speechTravel < 0.04);
  assert.ok(release.activity > onset.activity * 0.6, "release eases rather than yanking the wave back");
});

test("ordinary playback syllables visibly swell and accelerate the wave", () => {
  const advance = createTutorAtmosphereMotion();
  const envelope = createTutorVoiceEnvelope({ microphone: false });
  const dt = 1 / 60;
  const pulse = (rms, seconds) => {
    let state;
    for (let i = 0; i < seconds * 60; i++) state = advance(envelope(rms, dt * 1000), dt);
    return { ...state };
  };
  const soft = pulse(0.006, 0.4);
  const stressed = pulse(0.045, 0.2);
  const lull = pulse(0.002, 0.3);
  const next = pulse(0.035, 0.2);
  assert.ok(stressed.activity - soft.activity > 0.20, "syllable contrast survives smoothing");
  assert.ok(stressed.activity - lull.activity > 0.20, "the wave responds to short lulls");
  assert.ok(next.activity - lull.activity > 0.10, "the next syllable gets a new visible swell");
  const stressSpeed = (stressed.speechTravel - soft.speechTravel) / 0.2;
  assert.ok(stressSpeed > 0.5, "normal playback noticeably accelerates the leftward layer");
  assert.ok(backgroundPhase(next) < backgroundPhase(lull), "underlying drift stays steady");
});

test("voice rises push down and quieter syllables pull up with a visible range", () => {
  const advance = createTutorAtmosphereMotion();
  const envelope = createTutorVoiceEnvelope({ microphone: false });
  const pulse = (rms, seconds) => {
    let state;
    for (let i = 0; i < seconds * 60; i++) {
      state = advance(envelope(rms, 1000 / 60), 1 / 60);
      assert.ok(Math.abs(state.speechOffset) <= 0.10, "vertical motion stays bounded");
    }
    return { ...state };
  };
  pulse(0.015, 0.8);
  const stress = pulse(0.045, 0.2);
  const softer = pulse(0.004, 0.4);
  const next = pulse(0.035, 0.2);
  assert.ok(stress.speechOffset > 0.05, "a stressed syllable clearly extends the aura");
  assert.ok(softer.speechOffset < -0.015, "a quieter part pulls the aura upward");
  assert.ok(stress.speechOffset - softer.speechOffset > 0.075, "normal voice changes move the edge visibly");
  assert.ok(next.speechOffset > 0.02, "the next syllable restores a downward response");
});

test("overlapping-wave motion is consistent across frame rates", () => {
  const sample = (fps) => {
    const advance = createTutorAtmosphereMotion();
    run(advance, 0, 1, fps);
    run(advance, 0.4, 2, fps);
    return run(advance, 0, 2, fps);
  };
  const slow = sample(24);
  const fast = sample(60);
  assert.ok(Math.abs(slow.speechTravel - fast.speechTravel) < 0.01);
  assert.ok(Math.abs(backgroundPhase(slow) - backgroundPhase(fast)) < 0.001);
  assert.ok(Math.abs(slow.activity - fast.activity) < 0.001);
  assert.ok(Math.abs(slow.speechOffset - fast.speechOffset) < 0.001);
});
