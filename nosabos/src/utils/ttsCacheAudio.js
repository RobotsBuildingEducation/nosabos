// Keep small lead-in and lead-out margins so quiet consonants and room decay are preserved.
const LEAD_IN_SECONDS = 0.12;
const LEAD_OUT_SECONDS = 0.15;
const MIN_TRIM_SECONDS = 0.15;
const SOUND_THRESHOLD = 0.001; // -60 dBFS for onset/offset trimming.
const MIN_PEAK_AMPLITUDE = 0.02; // -34 dBFS; real speech peaks far higher (0.2 - 0.8).
const MIN_SPEECH_DURATION_SECONDS = 0.15; // Minimum total duration of audible speech.
const MIN_RMS_AMPLITUDE = 0.002; // Minimum RMS energy across the recording.

export function isAudibleSpeech(buffer) {
  if (!buffer || !buffer.length || !buffer.sampleRate) return false;
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  if (!channels.length) return false;

  let peak = 0;
  let audibleFrames = 0;
  let sumSquares = 0;
  const totalSamples = buffer.length * channels.length;

  for (const channel of channels) {
    for (let i = 0; i < channel.length; i++) {
      const abs = Math.abs(channel[i]);
      if (abs > peak) peak = abs;
      if (abs >= 0.01) audibleFrames++;
      sumSquares += abs * abs;
    }
  }

  const rms = Math.sqrt(sumSquares / totalSamples);
  const audibleSeconds = audibleFrames / (buffer.sampleRate * channels.length);

  return peak >= MIN_PEAK_AMPLITUDE && audibleSeconds >= MIN_SPEECH_DURATION_SECONDS && rms >= MIN_RMS_AMPLITUDE;
}

export function findTTSStartFrame(buffer) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  for (let frame = 0; frame < buffer.length; frame++) {
    if (channels.some((channel) => Math.abs(channel[frame]) >= SOUND_THRESHOLD)) {
      const start = Math.max(0, frame - Math.ceil(buffer.sampleRate * LEAD_IN_SECONDS));
      return start >= buffer.sampleRate * MIN_TRIM_SECONDS ? start : 0;
    }
  }
  return 0;
}

export function findTTSEndFrame(buffer) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  for (let frame = buffer.length - 1; frame >= 0; frame--) {
    if (channels.some((channel) => Math.abs(channel[frame]) >= SOUND_THRESHOLD)) {
      const end = Math.min(buffer.length, frame + Math.ceil(buffer.sampleRate * LEAD_OUT_SECONDS));
      return (buffer.length - end) >= buffer.sampleRate * MIN_TRIM_SECONDS ? end : buffer.length;
    }
  }
  return 0;
}

export function encodeTTSWav(buffer, startFrame = 0, endFrame = buffer.length) {
  const safeStart = Math.max(0, Math.min(startFrame, buffer.length));
  const safeEnd = Math.max(safeStart, Math.min(endFrame, buffer.length));
  const frames = safeEnd - safeStart;
  const channels = buffer.numberOfChannels;
  const bytes = new ArrayBuffer(44 + frames * channels * 2);
  const view = new DataView(bytes);
  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, "RIFF");
  view.setUint32(4, bytes.byteLength - 8, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, bytes.byteLength - 44, true);
  const samples = Array.from({ length: channels }, (_, index) => buffer.getChannelData(index));
  let offset = 44;
  for (let frame = safeStart; frame < safeEnd; frame++) {
    for (const channel of samples) {
      const sample = Math.max(-1, Math.min(1, channel[frame]));
      view.setInt16(offset, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
      offset += 2;
    }
  }
  return new Blob([bytes], { type: "audio/wav" });
}

export async function prepareTTSCacheAudio(blob) {
  const OfflineContext = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!OfflineContext) return { blob, prepared: false };
  try {
    // Offline decoding needs no playback permission. 24 kHz matches Realtime's
    // speech output and keeps PCM cache size lower than device-rate (48 kHz) WAV.
    const context = new OfflineContext(1, 1, 24000);
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (!isAudibleSpeech(decoded)) {
      return { blob: null, prepared: false, isSilent: true };
    }
    const startFrame = findTTSStartFrame(decoded);
    const endFrame = findTTSEndFrame(decoded);
    // Trim leading silence and trailing silence, returning a clean WAV.
    const wav = encodeTTSWav(decoded, startFrame, endFrame);
    return { blob: wav, prepared: true, isSilent: false };
  } catch {
    // Decode/format failures on mock or unsupported environments preserve the blob
    // so playback is not broken, but prepared is marked false.
    return { blob, prepared: false };
  }
}
