/** Linear waveform amplitude, excluding a microphone's DC offset. */
export function waveformRms(samples) {
  if (!samples?.length) return 0;
  let sum = 0;
  let squares = 0;
  for (const sample of samples) {
    sum += sample;
    squares += sample * sample;
  }
  return Math.sqrt(Math.max(0, squares / samples.length - (sum / samples.length) ** 2));
}

/** Visual-only speech envelope; this does not change recording or turn detection. */
export function createTutorVoiceEnvelope({ microphone = true } = {}) {
  let level = 0;
  let noiseFloor = 0.002;
  let open = !microphone;
  let onsetMs = 0;
  let quietMs = 0;

  return (amplitude, elapsedMs) => {
    const rms = Number.isFinite(amplitude) ? Math.max(0, amplitude) : 0;
    const dt = Math.min(100, Math.max(0, elapsedMs));
    const openThreshold = Math.max(0.008, noiseFloor * 3);
    const closeThreshold = Math.max(0.004, noiseFloor * 1.8);

    if (microphone) {
      if (!open) {
        // Learn quiet room noise, without treating a new utterance as noise.
        if (rms < openThreshold) {
          noiseFloor += (Math.min(rms, 0.006) - noiseFloor) * (1 - Math.exp(-dt / 1500));
        }
        onsetMs = rms >= openThreshold ? onsetMs + dt : 0;
        if (onsetMs >= 65) {
          open = true;
          quietMs = 0;
        }
      } else {
        // Separate open/close thresholds and a short hold bridge syllable gaps.
        quietMs = rms < closeThreshold ? quietMs + dt : 0;
        if (quietMs >= 140) {
          open = false;
          onsetMs = 0;
        }
      }
    }

    const floor = microphone ? closeThreshold : 0.002;
    const target = open ? Math.sqrt(Math.min(1, Math.max(0, rms - floor) / 0.12)) : 0;
    const durationMs = target > level ? 110 : 280;
    level += (target - level) * (1 - Math.exp(-dt / durationMs));
    if (target === 0 && level < 0.001) level = 0;
    return level;
  };
}
