import { Euler, Quaternion, Vector3 } from "three";
import { solveFoot } from "./legIK.js";

const TAU = Math.PI * 2;
const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const rotation = (x = 0, y = 0, z = 0) => new Quaternion().setFromEuler(new Euler(x, y, z));
const relative = (parent, child) => parent.clone().invert().multiply(child).toArray();
const hipHeight = 1.39;
const ankleHeight = 0.14;
const upperLength = 0.64;
const lowerLength = 0.61;

export function strideDistance(run) {
  return mix(0.78, 1.02, run) / mix(0.62, 0.4, run);
}

export function sampleHumanStride(phase, run) {
  phase = ((phase % 1) + 1) % 1;
  const stance = mix(0.62, 0.4, run);
  const span = mix(0.78, 1.02, run);
  if (phase < stance) {
    const t = phase / stance;
    return { z: span * (0.5 - t), lift: 0,
      roll: -0.045 * (1 - smooth(t / 0.18)) + mix(0.15, 0.22, run) * smooth((t - 0.7) / 0.3), planted: true };
  }
  const t = (phase - stance) / (1 - stance);
  // Match the support velocity at lift-off and landing. The foot continues
  // behind the body briefly, recovers under it, and lands moving backward.
  const tangent = -span * (1 - stance) / stance;
  const t2 = t * t;
  const t3 = t2 * t;
  const z = (2 * t3 - 3 * t2 + 1) * -span / 2 + (t3 - 2 * t2 + t) * tangent
    + (-2 * t3 + 3 * t2) * span / 2 + (t3 - t2) * tangent;
  return { z, lift: Math.sin(Math.PI * t ** 0.6) ** 1.8 * mix(0.09, 0.17, run),
    roll: mix(mix(0.15, 0.22, run), -0.045, smooth(t)), planted: false };
}

// One restrained pose drives the whole rig. No retargeted performance, added
// body sway, or second arm animator is layered over it in characters.js.
export function sampleHumanLocomotion(phase, run, weight, time) {
  run = clamp(run);
  weight = clamp(weight);
  const cycle = phase * TAU;
  const drive = Math.cos(cycle);
  const idle = Math.sin(time * 1.6) * (1 - weight);
  const pelvis = rotation(run * weight * 0.025, drive * weight * 0.018, Math.sin(cycle) * weight * 0.004);
  const lumbar = rotation(weight * mix(0.01, 0.055, run), -drive * weight * 0.004, 0);
  const chest = rotation(weight * mix(0.018, 0.085, run) + idle * 0.002,
    -drive * weight * mix(0.014, 0.032, run), -Math.sin(cycle) * weight * 0.003);
  const neck = rotation(run * weight * 0.018);
  const head = rotation(idle * 0.002);
  const rotations = { hips: pelvis.toArray(), lumbar: relative(pelvis, lumbar), torso: relative(lumbar, chest),
    neck: relative(chest, neck), head: relative(neck, head) };
  const feet = [sampleHumanStride(phase, run), sampleHumanStride(phase + 0.5, run)];
  const targets = feet.map((foot) => {
    const roll = foot.roll * weight;
    // Conservative sole corners: toe-off pivots about the toe, heel strike
    // about the heel, with neither end of the boot passing through the floor.
    const soleOffset = 0.134 * Math.cos(roll) + (roll > 0 ? 0.32 : 0.13) * Math.abs(Math.sin(roll));
    return { z: foot.z * weight, y: Math.max(mix(ankleHeight, 0.134, weight), soleOffset) + foot.lift * weight, roll };
  });
  let bodyY = mix(-0.018 + idle * 0.002, mix(-0.045, -0.065, run)
    + Math.cos(cycle * 2 + 0.4) * mix(0.004, 0.007, run), weight);
  const sockets = [-1, 1].map((side) => new Vector3(side * 0.145, 0, 0).applyQuaternion(pelvis));
  targets.forEach((foot, i) => {
    const z = foot.z - sockets[i].z;
    const down = Math.sqrt(Math.max(0.001, (upperLength + lowerLength - 0.008) ** 2 - z * z));
    bodyY = Math.min(bodyY, foot.y + down - hipHeight - sockets[i].y);
  });
  for (const [i, label] of ["left", "right"].entries()) {
    const side = i === 0 ? -1 : 1;
    const foot = targets[i];
    const leg = solveFoot(foot.z - sockets[i].z, foot.y - hipHeight - sockets[i].y - bodyY,
      upperLength, lowerLength, foot.roll);
    rotations[`${label}Hip`] = relative(pelvis, rotation(leg.hip));
    rotations[`${label}Knee`] = rotation(leg.knee).toArray();
    rotations[`${label}Ankle`] = rotation(leg.ankle).toArray();
    const swing = -side * drive * weight * mix(0.18, 0.34, run);
    rotations[`${label}Shoulder`] = rotation(swing, side * 0.012, side * 0.04).toArray();
    rotations[`${label}Elbow`] = rotation(-mix(0.16, 1.0, run) * weight - 0.07
      - Math.max(0, -swing) * 0.16).toArray();
    rotations[`${label}Wrist`] = rotation(-swing * 0.08).toArray();
  }
  return { root: [Math.sin(cycle) * weight * 0.004, bodyY, 0], shoulders: [[0, 0, 0], [0, 0, 0]], rotations };
}
