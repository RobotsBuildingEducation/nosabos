/** Independent background and speech-wave travel, with a soft playback swell. */
export function createTutorAtmosphereMotion() {
  const motion = { time: 0, activity: 0, reach: 0, speechTravel: 0, speechOffset: 0 };
  return (level, elapsedSeconds) => {
    const dt = Number.isFinite(elapsedSeconds) ? Math.min(0.1, Math.max(0, elapsedSeconds)) : 0;
    const target = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0;
    // Playback is already enveloped like the border. Only ease frame-to-frame
    // changes here so another long filter does not erase individual syllables.
    const activityDuration = target > motion.activity ? 0.055 : 0.10;
    motion.activity += (target - motion.activity) * (1 - Math.exp(-dt / activityDuration));
    const reachDuration = target > motion.reach ? 0.55 : 1.2;
    motion.reach += (target - motion.reach) * (1 - Math.exp(-dt / reachDuration));
    // Compare syllables with the slower phrase level: louder parts extend the
    // wave, quieter parts lift it. Random shape changes cannot cancel this cue.
    motion.speechOffset = Math.tanh((motion.activity - motion.reach) * 4) * 0.10;
    motion.time += dt * 2;
    // The speech wave keeps traveling left as its opacity rises and falls.
    // It never reverses or subtracts from the underlying rightward drift.
    motion.speechTravel += dt * (0.28 + motion.activity * 0.90);
    return motion;
  };
}
