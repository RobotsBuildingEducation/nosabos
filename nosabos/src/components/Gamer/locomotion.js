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

export function strideTiming(run) {
  return { stance: mix(0.61, 0.44, run), span: mix(0.72, 0.98, run) };
}

export function strideDistance(run) {
  const { span, stance } = strideTiming(run);
  return span / stance;
}

export function sampleHumanStride(phase, run) {
  phase = ((phase % 1) + 1) % 1;
  const { stance, span } = strideTiming(run);
  const front = span * mix(0.49, 0.44, run);
  const back = front - span;
  if (phase < stance) {
    const t = phase / stance;
    return {
      z: mix(front, back, t),
      lift: 0,
      roll: -0.08 * (1 - smooth(t / 0.22)) + mix(0.2, 0.44, run) * smooth((t - 0.58) / 0.42),
      planted: true,
    };
  }
  const t = (phase - stance) / (1 - stance);
  // C1-continuous swing curve with a C2 behind-the-hip heel-recovery lag term:
  // keeps exact support velocity matching at toe-off (t=0) and contact (t=1),
  // while holding the ankle behind the hip during early swing so the knee bends
  // naturally behind the body instead of high-stepping in front of the waist.
  const tangent = -span * (1 - stance) / stance;
  const t2 = t * t;
  const t3 = t2 * t;
  const hermite = (2 * t3 - 3 * t2 + 1) * back + (t3 - 2 * t2 + t) * tangent
    + (-2 * t3 + 3 * t2) * front + (t3 - t2) * tangent;
  const recoveryLag = -span * mix(0.28, 0.72, run) * t2 * (1 - t) ** 3;
  const z = hermite + recoveryLag;
  const lift = Math.sin(Math.PI * t ** 0.7) ** 2 * mix(0.14, 0.42, run);
  const roll = mix(mix(0.2, 0.44, run), -0.08, smooth(t));
  return { z, lift, roll, planted: false };
}

// Coordinated Tales-of-Symphonia style walk and run pose synthesizer:
// athletic forward lean, behind-the-hip heel fold, inward-angled bent-elbow
// arm pump, and smooth twice-per-stride vertical rhythm.
export function sampleHumanLocomotion(phase, run, weight, time, turn = 0) {
  run = clamp(run);
  weight = clamp(weight);
  const cycle = phase * TAU;
  const drive = Math.cos(cycle - 0.22);
  const strideWave = Math.sin(cycle);
  const idle = Math.sin(time * 1.6) * (1 - weight);
  const bank = clamp(turn, -3, 3) * weight * -0.022;

  const pelvisPitch = weight * mix(0.02, 0.082, run);
  const lumbarPitch = weight * mix(0.032, 0.118, run);
  const chestPitch = weight * mix(0.045, 0.148, run) + Math.cos(cycle * 2 - 0.4) * weight * mix(0.004, 0.008, run) + idle * 0.003;

  const pelvis = rotation(
    pelvisPitch,
    drive * weight * mix(0.038, 0.052, run),
    strideWave * weight * mix(0.018, 0.02, run) + bank * 0.45,
  );
  const lumbar = rotation(
    lumbarPitch,
    -drive * weight * mix(0.008, 0.012, run),
    bank * 0.65,
  );
  const chest = rotation(
    chestPitch,
    -drive * weight * mix(0.045, 0.062, run),
    -strideWave * weight * 0.008 + bank * 0.85,
  );
  // Keep neck and head looking naturally ahead while the torso leans into the run.
  const neck = rotation(weight * mix(0.01, 0.035, run), 0, bank * 0.35);
  const head = rotation(idle * 0.003 - weight * mix(0, 0.015, run), 0, bank * 0.18);

  const rotations = {
    hips: pelvis.toArray(),
    lumbar: relative(pelvis, lumbar),
    torso: relative(lumbar, chest),
    neck: relative(chest, neck),
    head: relative(neck, head),
  };

  const feet = [sampleHumanStride(phase, run), sampleHumanStride(phase + 0.5, run)];
  const targets = feet.map((foot) => {
    const roll = foot.roll * weight;
    const soleOffset = 0.134 * Math.cos(roll) + (roll > 0 ? 0.32 : 0.13) * Math.abs(Math.sin(roll));
    return {
      z: foot.z * weight,
      y: Math.max(mix(ankleHeight, 0.134, weight), soleOffset) + foot.lift * weight,
      roll,
    };
  });

  // Smooth twice-per-cycle bounce peaking during push-off/flight and cushioning on contact.
  const bounce = -Math.cos(cycle * 2 - 0.62);
  let bodyY = mix(
    -0.025 + idle * 0.003,
    mix(-0.068, -0.088, run) + bounce * mix(0.02, 0.044, run),
    weight,
  );
  const sockets = [-1, 1].map((side) => new Vector3(side * 0.145, 0, 0).applyQuaternion(pelvis));
  targets.forEach((foot, i) => {
    const z = foot.z - sockets[i].z;
    const down = Math.sqrt(Math.max(0.001, (upperLength + lowerLength - 0.01) ** 2 - z * z));
    bodyY = Math.min(bodyY, foot.y + down - hipHeight - sockets[i].y);
  });

  const shoulders = [[0, 0, 0], [0, 0, 0]];
  for (const [i, label] of ["left", "right"].entries()) {
    const side = i === 0 ? -1 : 1;
    const foot = targets[i];
    const leg = solveFoot(
      foot.z - sockets[i].z,
      foot.y - hipHeight - sockets[i].y - bodyY,
      upperLength,
      lowerLength,
      foot.roll,
    );
    // Subtle inward leg adduction so feet track naturally under the body rather than wide apart.
    const hipAdduct = -side * weight * mix(0.018, 0.03, run);
    const hipTurn = -side * Math.max(0, -leg.hip) * weight * 0.04;
    rotations[`${label}Hip`] = relative(pelvis, rotation(leg.hip, hipTurn, hipAdduct));
    rotations[`${label}Knee`] = rotation(leg.knee).toArray();
    rotations[`${label}Ankle`] = rotation(leg.ankle, 0, -hipAdduct * 0.7).toArray();

    // Energetic anime arm swing: bent elbows, forearm angled slightly inward across the ribs.
    const armPhase = cycle + 0.18;
    const armWave = -side * Math.cos(armPhase);
    const forwardPump = Math.max(0, -armWave);
    const backDrive = Math.max(0, armWave);
    const shoulderPitch = (armWave * mix(0.32, 0.68, run) - forwardPump * mix(0.04, 0.14, run) + run * 0.04) * weight;
    const shoulderYaw = -side * (0.04 + (0.14 + forwardPump * 0.12) * run) * weight;
    const shoulderRoll = side * (0.085 + weight * mix(0.02, 0.075, run));
    rotations[`${label}Shoulder`] = rotation(shoulderPitch, shoulderYaw, shoulderRoll).toArray();

    const elbowBend = -0.14 - weight * (mix(0.24, 1.12, run) + forwardPump * mix(0.14, 0.34, run) - backDrive * mix(0.04, 0.12, run));
    rotations[`${label}Elbow`] = rotation(elbowBend, -side * run * weight * 0.08, 0).toArray();
    rotations[`${label}Wrist`] = rotation(-0.06 - armWave * weight * 0.08, 0, side * -run * weight * 0.08).toArray();

    shoulders[i] = [
      0,
      (forwardPump * 0.012 - backDrive * 0.006) * weight * mix(0.5, 1, run),
      (forwardPump * 0.015 - backDrive * 0.012) * weight * mix(0.4, 1, run),
    ];
  }
  return {
    root: [Math.sin(cycle) * weight * mix(0.015, 0.011, run), bodyY, 0],
    shoulders,
    rotations,
  };
}
