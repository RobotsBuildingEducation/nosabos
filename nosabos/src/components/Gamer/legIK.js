// Sagittal two-bone IK shared by the human and animal rigs. The sum of the
// three joint angles is the foot's pitch relative to the ground.
export function solveFoot(z, y, upper = 0.64, lower = 0.61, roll = 0) {
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const requested = Math.hypot(z, y);
  const length = clamp(requested, Math.abs(upper - lower) + 0.0001, upper + lower - 0.0001);
  const hipOffset = Math.acos(clamp((upper * upper + length * length - lower * lower) / (2 * upper * length), -1, 1));
  const hip = Math.atan2(-z, -y) - hipOffset;
  const knee = Math.PI - Math.acos(clamp((upper * upper + lower * lower - length * length) / (2 * upper * lower), -1, 1));
  return { hip, knee, ankle: roll - hip - knee, reachable: requested <= upper + lower };
}
