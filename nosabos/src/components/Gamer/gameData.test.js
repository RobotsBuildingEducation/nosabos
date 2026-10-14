import test from "node:test";
import assert from "node:assert/strict";
import { BERRIES, HOUSES, LANDMARKS, SPAWN, WORLD_LIMIT, isWalkable, nearestInteraction, riverCenter } from "./gameData.js";

test("the river blocks movement except at the bridge and map boundaries hold", () => {
  assert.equal(isWalkable(riverCenter(8), 8), false);
  assert.equal(isWalkable(riverCenter(-10), -10), false);
  assert.equal(isWalkable(riverCenter(-3), -3), true);
  assert.equal(isWalkable(WORLD_LIMIT.maxX + 0.1, 0), false);
  assert.equal(isWalkable(0, WORLD_LIMIT.minZ - 0.1), false);
});

test("house collisions follow rotated footprints instead of blocking empty corners", () => {
  const house = { x: 0, z: 0, width: 6, depth: 2, rotation: Math.PI / 2 };
  assert.equal(isWalkable(0, 2.8, [house]), false);
  assert.equal(isWalkable(2.8, 0, [house]), true);
});

test("every quest target can be reached from spawn without entering the river or houses", () => {
  const obstacles = [...HOUSES, { id: "well", x: -2, z: -4.5, radius: 1.1 }];
  const queue = [{ ...SPAWN }];
  const visited = new Set([`${SPAWN.x},${SPAWN.z}`]);
  const targets = [LANDMARKS[0], ...BERRIES];
  const reached = new Set();
  for (let i = 0; i < queue.length; i++) {
    const point = queue[i];
    for (const target of targets) {
      if (Math.hypot(point.x - target.x, point.z - target.z) < 1.5) reached.add(target.id);
    }
    for (const [dx, dz] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) {
      const x = point.x + dx;
      const z = point.z + dz;
      const key = `${x},${z}`;
      if (!visited.has(key) && isWalkable(x, z, obstacles)) { visited.add(key); queue.push({ x, z }); }
    }
  }
  assert.deepEqual([...reached].sort(), targets.map((target) => target.id).sort());
});

test("interactions respect range, collected items, and intervening obstacles", () => {
  assert.equal(nearestInteraction(SPAWN), null);
  assert.equal(nearestInteraction({ x: -2, z: 3 }).id, "hana");
  assert.equal(nearestInteraction({ x: 7, z: 5 }).id, "berry-meadow");
  assert.equal(nearestInteraction({ x: 7, z: 5 }, ["berry-meadow"]), null);
  assert.equal(nearestInteraction({ x: -2, z: 3.5 }, [], [{ x: -2, z: 2.75, width: 2, depth: 0.3 }]), null);
});
