import { isWalkable, terrainHeight } from "./gameData.js";
import { angleDelta, clamp, damp } from "./motion.js";

function randomFor(id) {
  let seed = Array.from(id).reduce((value, letter) => Math.imul(value, 31) + letter.charCodeAt(0) >>> 0, 713);
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

export function createVillager(item, index = 0) {
  const random = randomFor(item.id);
  return { id: item.id, x: item.x, z: item.z, y: terrainHeight(item.x, item.z),
    homeX: item.x, homeZ: item.z, heading: item.rotation || 0,
    radius: item.id === "jiraiya" ? 0.6 : 0.42,
    roam: item.id === "hana" ? 1.8 : item.id === "milo" ? 2.1 : 2.8,
    pace: item.id === "jiraiya" ? 0.65 : item.id === "yachiru" ? 1.2 : 0.85 + random() * 0.25,
    wait: 1 + index * 0.65, speed: 0, destination: null, distance: 0, turnRate: 0,
    visits: 0, mode: "idle", lookYaw: 0, greeting: 0, greetClock: 0, wasNear: false, random };
}

function clearLine(actor, destination, scenery) {
  const length = Math.hypot(destination.x - actor.x, destination.z - actor.z);
  const count = Math.max(1, Math.ceil(length / 0.2));
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    if (!isWalkable(actor.x + (destination.x - actor.x) * t,
      actor.z + (destination.z - actor.z) * t, scenery, actor.radius)) return false;
  }
  return true;
}

function chooseDestination(actor, scenery) {
  for (let i = 0; i < 18; i++) {
    const angle = actor.random() * Math.PI * 2;
    const radius = 0.85 + actor.random() * (actor.roam - 0.85);
    const destination = actor.visits % 4 === 3 && i === 0
      ? { x: actor.homeX, z: actor.homeZ }
      : { x: actor.homeX + Math.sin(angle) * radius, z: actor.homeZ + Math.cos(angle) * radius };
    if (Math.hypot(destination.x - actor.x, destination.z - actor.z) > 0.8 && clearLine(actor, destination, scenery)) return destination;
  }
  return null;
}

// Each villager has its own seeded timing. They turn before stepping, yield to
// the player and other villagers, and choose only clear, local walking segments.
export function updateVillagers(actors, dt, time, player, scenery, paused = false) {
  for (const actor of actors) {
    actor.distance = 0;
    actor.turnRate = 0;
    if (paused) continue;
    const playerDistance = Math.hypot(player.x - actor.x, player.z - actor.z);
    const near = playerDistance < 2.05;
    if (near && !actor.wasNear) actor.greetClock = 2.4;
    actor.wasNear = near;
    actor.greetClock = Math.max(0, actor.greetClock - dt);
    actor.greeting = actor.greetClock > 0 && near ? Math.sin(Math.PI * clamp(actor.greetClock / 2.4, 0, 1)) : 0;
    let desiredHeading = actor.heading;
    let desiredSpeed = 0;
    if (near) {
      actor.mode = "greeting";
      desiredHeading = Math.atan2(player.x - actor.x, player.z - actor.z);
      actor.wait = Math.max(actor.wait, 1.3);
    } else if (!actor.destination) {
      actor.wait -= dt;
      actor.mode = "idle";
      actor.lookYaw = Math.sin(time * 0.48 + actor.homeX) * 0.24;
      if (actor.wait <= 0) {
        actor.destination = chooseDestination(actor, scenery);
        if (!actor.destination) actor.wait = 2;
      }
    } else {
      const dx = actor.destination.x - actor.x;
      const dz = actor.destination.z - actor.z;
      const remaining = Math.hypot(dx, dz);
      if (remaining < 0.12) {
        actor.destination = null;
        actor.visits++;
        actor.wait = 2.5 + actor.random() * 4;
        actor.mode = "idle";
      } else {
        desiredHeading = Math.atan2(dx, dz);
        const alignment = Math.max(0, Math.cos(angleDelta(actor.heading, desiredHeading)));
        desiredSpeed = actor.pace * alignment * Math.min(1, remaining / 0.55);
        actor.mode = alignment < 0.4 ? "turning" : "walking";
        actor.lookYaw = clamp(angleDelta(actor.heading, desiredHeading), -0.45, 0.45);
      }
    }
    const previousHeading = actor.heading;
    actor.heading += angleDelta(actor.heading, desiredHeading) * (1 - Math.exp(-dt * 3.5));
    actor.turnRate = angleDelta(previousHeading, actor.heading) / Math.max(dt, 0.0001);
    if (near) actor.lookYaw = clamp(angleDelta(actor.heading, desiredHeading), -0.55, 0.55);
    actor.speed = damp(actor.speed, desiredSpeed, desiredSpeed ? 4.5 : 9, dt);
    const step = actor.speed * dt;
    const x = actor.x + Math.sin(actor.heading) * step;
    const z = actor.z + Math.cos(actor.heading) * step;
    const separates = actors.every((other) => other === actor || Math.hypot(x - other.x, z - other.z) > actor.radius + other.radius + 0.2);
    if (step > 0.00001 && separates && Math.hypot(x - player.x, z - player.z) > actor.radius + 0.55 &&
      isWalkable(x, z, scenery, actor.radius)) {
      actor.distance = Math.hypot(x - actor.x, z - actor.z);
      actor.x = x;
      actor.z = z;
      actor.y = terrainHeight(x, z);
    } else {
      actor.speed = 0;
      if (desiredSpeed > 0.1) {
        actor.destination = null;
        actor.wait = 1.5 + actor.random();
      }
    }
  }
}
