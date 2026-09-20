// Keep a small lead-in so quiet consonants and codec pre-roll are preserved.
const LEAD_IN_SECONDS = 0.12;
const MIN_TRIM_SECONDS = 0.15;
const SOUND_THRESHOLD = 0.001; // -60 dBFS; synthesized silence is near zero.

export function findTTSStartFrame(buffer) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  for (let frame = 0; frame < buffer.length; frame++) {
    if (channels.some((channel) => Math.abs(channel[frame]) >= SOUND_THRESHOLD)) {
      const start = Math.max(0, frame - Math.ceil(buffer.sampleRate * LEAD_IN_SECONDS));
      return start >= buffer.sampleRate * MIN_TRIM_SECONDS ? start : 0;
    }
  }
  // Never turn an unexpectedly quiet recording into an empty/unplayable file.
  return 0;
}

export function encodeTTSWav(buffer, startFrame) {
  const frames = buffer.length - startFrame;
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
  for (let frame = startFrame; frame < buffer.length; frame++) {
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
    const startFrame = findTTSStartFrame(decoded);
    // MediaRecorder's compressed containers cannot safely be cut by byte/chunk
    // offsets. Encode only when there is silence to remove, preserving every
    // sample from the lead-in through the original recording's complete tail.
    return { blob: startFrame ? encodeTTSWav(decoded, startFrame) : blob, prepared: true };
  } catch {
    // Decode/format failures must not break otherwise playable cached audio.
    return { blob, prepared: false };
  }
}
