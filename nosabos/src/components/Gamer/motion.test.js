import test from "node:test";
import assert from "node:assert/strict";
import { advanceMotion, createMotionState, sampleStride, solveFoot } from "./motion.js";
import { createVillager, updateVillagers } from "./villagers.js";
import { HOUSES, LANDMARKS, SPAWN, isWalkable, nearestInteraction } from "./gameData.js";
import { VILLAGE_CAST } from "./cast.js";

test("knee and ankle IK place the foot at the requested point with a level sole", () => {
  for (const [z, y] of [[0, -1.18], [0.43, -1.08], [-0.45, -1.07], [0.1, -0.75]]) {
    const pose = solveFoot(z, y);
    const actualZ = -0.64 * Math.sin(pose.hip) - 0.61 * Math.sin(pose.hip + pose.knee);
    const actualY = -0.64 * Math.cos(pose.hip) - 0.61 * Math.cos(pose.hip + pose.knee);
    assert.ok(Math.abs(actualZ - z) < 0.00001);
    assert.ok(Math.abs(actualY - y) < 0.00001);
    assert.ok(pose.knee > 0, "the knee must bend rather than lock");
    assert.ok(Math.abs(pose.hip + pose.knee + pose.ankle) < 0.00001);
  }
});

test("the support foot stays planted as the body advances and swing clears the ground", () => {
  for (const run of [0, 0.5, 1]) {
    const first = sampleStride(0.08, run);
    const next = sampleStride(0.18, run);
    const bodyAdvance = 0.1 * first.span / first.stance;
    assert.equal(first.lift, 0);
    assert.equal(next.lift, 0);
    assert.ok(Math.abs(next.z + bodyAdvance - first.z) < 0.00001);
    assert.ok(sampleStride(first.stance + (1 - first.stance) / 2, run).lift > 0.1);
  }
});

test("cadence follows travel distance at different frame rates, and pauses freeze the pose", () => {
  const slowFrames = createMotionState();
  const fastFrames = createMotionState();
  for (let i = 0; i < 60; i++) advanceMotion(slowFrames, { dt: 1 / 30, speed: 1, distance: 1 / 30 });
  for (let i = 0; i < 240; i++) advanceMotion(fastFrames, { dt: 1 / 120, speed: 1, distance: 1 / 120 });
  assert.ok(Math.abs(slowFrames.phase - fastFrames.phase) < 0.000002);
  const before = { ...slowFrames };
  advanceMotion(slowFrames, { dt: 0, distance: 1, speed: 4 });
  assert.deepEqual(slowFrames, before);
  const phase = slowFrames.phase;
  for (let i = 0; i < 30; i++) advanceMotion(slowFrames, { dt: 1 / 60, distance: 0, speed: 0 });
  assert.equal(slowFrames.phase, phase);
  assert.ok(slowFrames.weight < 0.001, "stopping should blend to rest without resetting the stride");
});

test("animal gait poses remain finite through movement, stopping, and unreachable targets", () => {
  const state = createMotionState();
  for (let frame = 0; frame < 600; frame++) {
    const speed = frame < 120 ? 1 : frame < 360 ? 5.7 : 0;
    const pose = advanceMotion(state, { dt: 1 / 60, speed, distance: speed / 60, scale: 0.87, turnRate: Math.sin(frame / 20) * 3, animal: true });
    pose.legs.forEach((leg) => {
      assert.ok(leg.reachable, "neither planted nor swinging legs should overextend");
      [leg.hip, leg.knee, leg.ankle].forEach((angle) => assert.ok(Number.isFinite(angle)));
    });
  }
  const extended = solveFoot(3, -3);
  assert.equal(extended.reachable, false);
  assert.ok(Number.isFinite(extended.hip + extended.knee + extended.ankle));
});

test("villagers periodically walk and rest while respecting scenery and one another", () => {
  const items = [...LANDMARKS.filter((item) => item.kind === "npc"), ...VILLAGE_CAST];
  const actors = items.map(createVillager);
  const scenery = [...HOUSES, { id: "well", x: -2, z: -4.5, radius: 1.1 }, { id: "sign", x: 5.3, z: 10.3, radius: 0.35 }];
  const traveled = new Map(actors.map((actor) => [actor.id, 0]));
  for (let frame = 0; frame < 2400; frame++) {
    updateVillagers(actors, 1 / 60, frame / 60, SPAWN, scenery);
    for (const actor of actors) {
      traveled.set(actor.id, traveled.get(actor.id) + actor.distance);
      assert.ok(isWalkable(actor.x, actor.z, scenery, actor.radius), `${actor.id} entered scenery`);
      assert.ok(Math.hypot(actor.x - actor.homeX, actor.z - actor.homeZ) < actor.roam + 0.4);
      for (const other of actors) {
        if (actor === other) continue;
        assert.ok(Math.hypot(actor.x - other.x, actor.z - other.z) >= actor.radius + other.radius + 0.19, "villagers must not overlap");
      }
    }
  }
  actors.forEach((actor) => {
    assert.ok(traveled.get(actor.id) > 2, `${actor.id} should take several steps`);
    assert.ok(actor.visits > 0, `${actor.id} should finish a walk and pause`);
  });
});

test("villagers greet a nearby player, pause with panels, and resume after the player leaves", () => {
  const actor = createVillager(VILLAGE_CAST[0]);
  const player = { x: actor.x, z: actor.z + 1.4 };
  const origin = { x: actor.x, z: actor.z };
  let waved = false;
  for (let i = 0; i < 120; i++) {
    updateVillagers([actor], 1 / 60, i / 60, player, []);
    waved ||= actor.greeting > 0.8;
  }
  assert.equal(actor.mode, "greeting");
  assert.deepEqual({ x: actor.x, z: actor.z }, origin);
  assert.ok(waved);
  const wait = actor.wait;
  updateVillagers([actor], 1, 3, SPAWN, [], true);
  assert.equal(actor.wait, wait);
  for (let i = 0; i < 360; i++) updateVillagers([actor], 1 / 60, 4 + i / 60, SPAWN, []);
  assert.ok(Math.hypot(actor.x - origin.x, actor.z - origin.z) > 0.2);
});

test("conversation prompts follow a moving quest NPC instead of its original map coordinate", () => {
  const landmarks = LANDMARKS.map((item) => item.id === "hana" ? { ...item, x: 9.5, z: 10 } : item);
  assert.equal(nearestInteraction({ x: 9, z: 10 }, [], [], landmarks)?.id, "hana");
  assert.notEqual(nearestInteraction({ x: -2, z: 3 }, [], [], landmarks)?.id, "hana");
});
