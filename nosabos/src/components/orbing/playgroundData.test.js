import test from "node:test";
import assert from "node:assert/strict";
import {
  ORB_MOODS,
  ORB_PALETTES,
  ORB_STATES,
  DISPLAY_MOODS,
  DISPLAY_REACTIONS,
  TUTOR_DEFAULT_MOODS,
  TUTOR_CORRECT_MOODS,
  TUTOR_WRONG_MOODS,
  REACTION_DURATION,
} from "./orbModel.js";
import {
  PLAYGROUND_MOODS,
  PLAYGROUND_REACTIONS,
  PLAYGROUND_PALETTES,
  PLAYGROUND_STATES,
  PLAYGROUND_FLOW,
  PLAYGROUND_REACTION_DURATIONS,
  PLAYGROUND_EXPRESSIONS,
  playgroundReactionPose,
  resolvePlaygroundMood,
} from "./playgroundData.js";
import { createEyeMorph, advanceEyeMorph, EYE_COORDINATES } from "./orbEyeMorph.js";

test("app orb settings remain strictly unchanged and separate from playground", () => {
  assert.equal(ORB_MOODS.length, 8, "Standard app moods must remain 8");
  assert.equal(ORB_PALETTES.length, 9, "Keep the existing nine app palettes separate from experiments");
  assert.equal(ORB_STATES.length, 4, "Standard app voice states must remain 4");
  assert.equal(DISPLAY_MOODS.length, 7, "Display moods must remain untouched");
  assert.equal(DISPLAY_REACTIONS.length, 4, "Display reactions must remain untouched");
  assert.equal(TUTOR_DEFAULT_MOODS.length, 2, "Tutor default moods must remain untouched");
  assert.equal(TUTOR_CORRECT_MOODS.length, 3, "Tutor correct moods must remain untouched");
  assert.equal(TUTOR_WRONG_MOODS.length, 2, "Tutor wrong moods must remain untouched");
  assert.equal(Object.keys(REACTION_DURATION).length, 5, "Standard reaction durations must remain untouched");
});

test("playground has exactly 20 distinct feelings, all validly configured", () => {
  assert.equal(PLAYGROUND_MOODS.length, 20);
  const ids = new Set(PLAYGROUND_MOODS.map((m) => m.id));
  assert.equal(ids.size, 20, "All 20 feelings must have unique IDs");
  for (const mood of PLAYGROUND_MOODS) {
    assert.ok(mood.id && typeof mood.id === "string");
    assert.ok(mood.label && typeof mood.label === "string");
    assert.ok(mood.line && typeof mood.line === "string");
  }
});

test("playground has exactly 20 distinct behaviors/dances", () => {
  assert.equal(PLAYGROUND_REACTIONS.length, 20);
  const ids = new Set(PLAYGROUND_REACTIONS.map((r) => r.id));
  assert.equal(ids.size, 20, "All 20 reactions must have unique IDs");
  for (const reaction of PLAYGROUND_REACTIONS) {
    assert.ok(reaction.id && typeof reaction.id === "string");
    assert.ok(reaction.label && typeof reaction.label === "string");
    assert.ok(reaction.icon, `Reaction ${reaction.id} must have an icon`);
    assert.ok(reaction.message && typeof reaction.message === "string");
  }
});

test("playground has exactly 20 distinct color palettes", () => {
  assert.equal(PLAYGROUND_PALETTES.length, 20);
  const ids = new Set(PLAYGROUND_PALETTES.map((p) => p.id));
  assert.equal(ids.size, 20, "All 20 palettes must have unique IDs");
  for (const palette of PLAYGROUND_PALETTES) {
    assert.ok(palette.id && typeof palette.id === "string");
    assert.ok(palette.name && typeof palette.name === "string");
    assert.ok(palette.swatch?.startsWith("#"), "Swatch must be a valid hex color");
    assert.equal(palette.colors.length, 3, "Palette must define [deep, mid, light] colors");
    for (const color of palette.colors) {
      assert.ok(color.startsWith("#"), `Color ${color} in ${palette.id} must be hex`);
    }
  }
});

test("playground has exactly 20 distinct voice states and flow configurations", () => {
  assert.equal(PLAYGROUND_STATES.length, 20);
  const ids = new Set(PLAYGROUND_STATES.map((s) => s.id));
  assert.equal(ids.size, 20, "All 20 voice states must have unique IDs");
  for (const state of PLAYGROUND_STATES) {
    assert.ok(state.id && typeof state.id === "string");
    assert.ok(state.label && typeof state.label === "string");
    assert.ok(state.caption && typeof state.caption === "string");
    const flow = PLAYGROUND_FLOW[state.id];
    assert.ok(flow, `State ${state.id} must have a flow configuration`);
    assert.ok(Number.isFinite(flow.speed) && flow.speed > 0);
    assert.ok(Number.isInteger(flow.pattern) && flow.pattern >= 1 && flow.pattern <= 20);
  }
});

test("all 20 playground reaction poses settle to rest and stay bounded throughout", () => {
  const limits = { x: 0.5, y: 1.8, squash: 0.4, roll: 0.45, turn: 20, pitch: 10, burst: 2.0 };
  for (const reaction of PLAYGROUND_REACTIONS) {
    const kind = reaction.id;
    const duration = PLAYGROUND_REACTION_DURATIONS[kind];
    assert.ok(duration > 0, `Duration for ${kind} must be positive`);
    for (let elapsed = 0; elapsed <= duration; elapsed += 0.01) {
      const pose = playgroundReactionPose(kind, elapsed, 1.5);
      for (const [key, value] of Object.entries(pose)) {
        assert.ok(Number.isFinite(value) && Math.abs(value) <= limits[key], `${kind}.${key} at ${elapsed}: ${value}`);
      }
      assert.ok(1 - pose.squash > 0, `squash must never invert the mesh in ${kind}`);
    }
    // Outside duration
    for (const elapsed of [-1, duration, duration + 1]) {
      assert.ok(
        Object.values(playgroundReactionPose(kind, elapsed)).every((value) => value === 0),
        `${kind} must be zero at ${elapsed}`
      );
    }
  }
});

test("full spin, ballet twirl, and somersault flip complete exact full rotations", () => {
  const spinEnd = playgroundReactionPose("spin", PLAYGROUND_REACTION_DURATIONS.spin - 0.001);
  assert.ok(Math.abs(spinEnd.turn - Math.PI * 2) < 0.01, "Spin must complete full turn");
  const twirlEnd = playgroundReactionPose("twirl", PLAYGROUND_REACTION_DURATIONS.twirl - 0.001);
  assert.ok(Math.abs(twirlEnd.turn - Math.PI * 4) < 0.01, "Twirl must complete double turn");
  const flipEnd = playgroundReactionPose("flip", PLAYGROUND_REACTION_DURATIONS.flip - 0.001);
  assert.ok(Math.abs(flipEnd.pitch - Math.PI * 2) < 0.01, "Flip must complete full pitch rotation");
});

test("all 20 playground feelings morph smoothly without crashing or collapsing", () => {
  for (const from of PLAYGROUND_MOODS) {
    const morph = createEyeMorph(from.id, PLAYGROUND_EXPRESSIONS);
    assert.equal(morph.values.length, EYE_COORDINATES + 7);
    assert.ok(morph.values.every(Number.isFinite));
    for (const to of PLAYGROUND_MOODS) {
      advanceEyeMorph(morph, { mood: to.id, dt: 1 / 40, expressions: PLAYGROUND_EXPRESSIONS });
      assert.ok(morph.values.every(Number.isFinite));
    }
  }
});

test("resolvePlaygroundMood resolves properly among 20 playground feelings", () => {
  assert.equal(resolvePlaygroundMood("boop", "idle", "boop"), "love");
  assert.equal(resolvePlaygroundMood("joy", "idle", "heartbeat"), "love");
  for (const mood of PLAYGROUND_MOODS) {
    assert.equal(resolvePlaygroundMood(mood.id, "idle", null), mood.id);
  }
  assert.equal(resolvePlaygroundMood("nonexistent", "idle", null), "content");
});
