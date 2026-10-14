import { sampleHumanLocomotion, strideDistance } from "./locomotion.js";
import { solveFoot } from "./legIK.js";
export { solveFoot } from "./legIK.js";
const TAU = Math.PI * 2;
export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export const damp = (value, target, response, dt) => target + (value - target) * Math.exp(-response * dt);
export const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// A foot stays on the ground during support, then travels through a lifted arc.
// Its backward support speed is constant, which lets distance drive the cycle
// without sliding the planted foot as the character moves forward.
export function sampleStride(phase, run = 0, animal = false) {
  phase = ((phase % 1) + 1) % 1;
  const stance = mix(0.64, 0.34, run);
  const span = animal ? 0.4 : mix(0.88, 1.28, run);
  if (phase < stance) {
    const t = phase / stance;
    return { z: span * (0.5 - t), lift: 0, planted: true,
      roll: -0.12 * (1 - smooth(t / 0.2)) + 0.28 * smooth((t - 0.76) / 0.24), stance, span };
  }
  const t = (phase - stance) / (1 - stance);
  return { z: span * (smooth(t) - 0.5),
    lift: Math.pow(Math.sin(t * Math.PI), 1.3) * (animal ? 0.085 : mix(0.15, 0.4, run)),
    planted: false, roll: 0.32 * Math.sin(t * Math.PI) - 0.1 * t, stance, span };
}

export function createMotionState() {
  return { phase: 0, weight: 0, run: 0, turn: 0, look: 0, greet: 0, secondary: 0, secondaryVelocity: 0 };
}

export function advanceMotion(state, { dt, distance = 0, speed = 0, scale = 1, time = 0,
  turnRate = 0, lookYaw = 0, greeting = 0, animal = false, reducedMotion = false }) {
  if (dt <= 0) return;
  const targetRun = animal ? 0 : smooth((speed - 0.85) / 2.95);
  const cadenceRun = damp(state.run, targetRun, 8, dt / 2);
  state.run = damp(state.run, targetRun, 8, dt);
  state.weight = damp(state.weight, clamp(speed / 0.6, 0, 1), speed > 0.05 ? 13 : 17, dt);
  state.turn = damp(state.turn, clamp(turnRate, -4, 4), 7, dt);
  state.look = damp(state.look, clamp(lookYaw, -0.65, 0.65), 5, dt);
  state.greet = damp(state.greet, greeting, 5, dt);
  const stride = sampleStride(state.phase, state.run, animal);
  state.phase = (state.phase + (animal ? distance * stride.stance / (stride.span * scale)
    : distance / (strideDistance(cadenceRun) * scale))) % 1;
  const w = state.weight;
  const secondaryTarget = reducedMotion ? 0 : state.run * w * 0.08 + state.turn * 0.012;
  state.secondaryVelocity += (secondaryTarget - state.secondary) * 55 * dt;
  state.secondaryVelocity *= Math.exp(-10 * dt);
  state.secondary += state.secondaryVelocity * dt;
  const idle = reducedMotion ? 0 : Math.sin(time * 1.6) * (1 - w);
  const cycle = state.phase * TAU;
  const common = { phase: state.phase, weight: w, run: state.run, turn: state.turn,
    look: state.look - state.turn * w * 0.015, idle, greeting: state.greet, secondary: state.secondary };
  if (!animal) {
    const human = sampleHumanLocomotion(state.phase, state.run, w, reducedMotion ? 0 : time);
    return { ...common, human, bodyY: human.root[1] };
  }

  // The short animal rigs keep their species-specific grounded IK stride.
  const left = sampleStride(state.phase, 0, true);
  const right = sampleStride(state.phase + 0.5, 0, true);
  const hipHeight = 0.53;
  const ankleHeight = 0.09;
  const upper = 0.23;
  const lower = 0.21;
  const support = left.planted && right.planted
    ? Math.abs(left.z) > Math.abs(right.z) ? left : right
    : left.planted ? left : right.planted ? right : null;
  const supportZ = support ? support.z * w : 0;
  const supportHeight = Math.sqrt(Math.max(0.01, (upper + lower - 0.018) ** 2 - supportZ ** 2));
  const walkHeight = support ? ankleHeight + supportHeight - hipHeight : -0.1;
  let bodyY = mix(-0.025, walkHeight, w);
  const footTargets = [left, right].map((foot) => {
    const roll = foot.roll * w;
    const heelHeight = Math.abs(Math.sin(roll)) * (roll > 0 ? 0.22 : 0.1);
    return { z: foot.z * w, y: ankleHeight + foot.lift * w + heelHeight, roll };
  });
  // The descending swing foot also constrains pelvis height just before heel
  // strike. Both legs keep a little flex through double support and flight.
  for (const foot of footTargets) {
    const down = Math.sqrt(Math.max(0.001, (upper + lower - 0.018) ** 2 - foot.z ** 2));
    bodyY = Math.min(bodyY, foot.y + down - hipHeight);
  }
  const legs = footTargets.map((foot) => solveFoot(foot.z, foot.y - hipHeight - bodyY, upper, lower, foot.roll));
  return {
    ...common, legs, bodyY,
    sway: Math.sin(cycle) * w * 0.035,
    hipsYaw: Math.sin(cycle) * w * 0.055,
    hipsRoll: Math.sin(cycle) * w * 0.065 - state.turn * w * 0.016,
    torsoYaw: -Math.sin(cycle) * w * 0.09,
    lean: w * 0.025,
  };
}
