// An independent, authored playground. Nothing here reads or writes RPG progress.
export const SPAWN = { x: 0, z: 12 };
export const WORLD_LIMIT = { minX: -22, maxX: 23, minZ: -24, maxZ: 22 };
export const INTERACT_DISTANCE = 2.5;
export const BERRIES = [
  { id: "berry-meadow", kind: "berry", name: "Sunberries", x: 7, z: 5 },
  { id: "berry-river", kind: "berry", name: "Sunberries", x: 7, z: -8 },
  { id: "berry-grove", kind: "berry", name: "Sunberries", x: 19, z: -6 },
];
export const LANDMARKS = [
  { id: "hana", kind: "npc", name: "Hana", subtitle: "Village botanist", x: -2, z: 2 },
  { id: "milo", kind: "npc", name: "Milo", subtitle: "A familiar face", x: 3.3, z: -7.5 },
  { id: "sign", kind: "object", name: "Village sign", x: 5.3, z: 10.3 },
  { id: "well", kind: "object", name: "Wishing well", x: -2, z: -4.5 },
];
export const HOUSES = [
  { x: -8.5, z: -7.5, width: 6, depth: 5, height: 3.5, roof: "terracotta", rotation: 0.13 },
  { x: 2, z: -16.5, width: 7.5, depth: 5.5, height: 4.3, roof: "blue", rotation: -0.06 },
  { x: -12, z: 4.2, width: 5.5, depth: 4.4, height: 3.1, roof: "terracotta", rotation: 0.22 },
];

export function riverCenter(z) {
  return 13.5 + Math.sin(z * 0.13) * 1.6;
}

export function terrainHeight(x, z) {
  const outer = Math.max(0, Math.hypot(x * 0.9, z * 0.7) - 19);
  return Math.sin(x * 0.17) * Math.cos(z * 0.15) * Math.min(outer * 0.1, 1.5)
    + Math.max(0, outer - 8) * 0.12;
}

export function isWalkable(x, z, obstacles = [], radius = 0.28) {
  if (x < WORLD_LIMIT.minX || x > WORLD_LIMIT.maxX || z < WORLD_LIMIT.minZ || z > WORLD_LIMIT.maxZ) return false;
  // The bridge is the only crossing. A bank margin keeps feet out of the water.
  if (Math.abs(x - riverCenter(z)) < 2.27 + radius && (z < -4.1 || z > -1.9)) return false;
  return !obstacles.some((obstacle) => {
    if (obstacle.radius) return Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + radius;
    const angle = -(obstacle.rotation || 0);
    const dx = x - obstacle.x;
    const dz = z - obstacle.z;
    const localX = dx * Math.cos(angle) + dz * Math.sin(angle);
    const localZ = -dx * Math.sin(angle) + dz * Math.cos(angle);
    return Math.abs(localX) < obstacle.width / 2 + radius + 0.07 && Math.abs(localZ) < obstacle.depth / 2 + radius + 0.07;
  });
}

export function nearestInteraction(position, collected = [], obstacles = [], landmarks = LANDMARKS) {
  return [...landmarks, ...BERRIES.filter((berry) => !collected.includes(berry.id))]
    .map((item) => ({ ...item, distance: Math.hypot(position.x - item.x, position.z - item.z) }))
    .filter((item) => item.distance <= INTERACT_DISTANCE &&
      // Prevent interacting across a river or through a building.
      [0.25, 0.5, 0.75].every((t) => isWalkable(
        position.x + (item.x - position.x) * t,
        position.z + (item.z - position.z) * t,
        obstacles.filter((obstacle) => obstacle.id !== item.id),
      )))
    .sort((a, b) => a.distance - b.distance)[0] || null;
}

export function questDescription(stage, count) {
  if (stage === "complete") return { title: "A little kindness", task: "Hana’s basket is full. The village is yours to explore.", label: "QUEST COMPLETE", progress: 1 };
  if (stage === "gather" && count === 3) return { title: "A little kindness", task: "Bring the sunberries back to Hana.", label: "RETURN TO HANA", progress: 0.85 };
  if (stage === "gather") return { title: "A little kindness", task: "Find sunberries along the river.", label: `SUNBERRIES · ${count} / 3`, progress: 0.2 + count * 0.2 };
  return { title: "A little kindness", task: "Say hello to Hana in the village square.", label: "MEET THE VILLAGERS", progress: 0 };
}
