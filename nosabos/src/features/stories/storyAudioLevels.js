// Read speech energy without changing the player's output routing. Live audio
// uses a silent analyser branch; cached audio uses PCM at the playback cursor.
let context;
export function primeStoryAudioLevels() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context ||= new AudioContext();
    if (context.state === "suspended") void context.resume().catch(() => {});
    return context;
  } catch { return null; }
}

export function speechBarLevels(samples, count = 12) {
  return Array.from({ length: count }, (_, bar) => {
    const start = Math.floor(bar * samples.length / count);
    const end = Math.floor((bar + 1) * samples.length / count);
    let energy = 0;
    for (let i = start; i < end; i++) energy += samples[i] ** 2;
    const rms = Math.sqrt(energy / Math.max(1, end - start));
    return Math.min(1, Math.sqrt(Math.max(0, rms - 0.003) * 5));
  });
}

export function createStoryLevelReader(audio) {
  const ctx = primeStoryAudioLevels();
  if (!ctx || !audio) return null;
  let source;
  let analyser;
  let decoded;
  let disposed = false;
  const samples = new Float32Array(1024);
  const stream = audio.srcObject;
  const abort = new AbortController();
  if (!stream) {
    // TTS replay URLs are local cached blobs. Do not fetch arbitrary media URLs.
    const url = audio.currentSrc || audio.src || "";
    if (!url.startsWith("blob:")) return null;
    void fetch(url, { signal: abort.signal })
      .then((response) => response.arrayBuffer())
      .then((bytes) => disposed ? null : ctx.decodeAudioData(bytes))
      .then((buffer) => { if (!disposed) decoded = buffer; })
      .catch(() => {}); // Unsupported codec: keep the playback animation fallback.
  }
  return {
    read() {
      if (disposed) return null;
      if (audio.paused || audio.ended || audio.muted) return Array(12).fill(0);
      if (stream) {
        if (ctx.state !== "running") return null;
        if (!source) {
          if (!stream.getAudioTracks?.().length) return null;
          try {
            source = ctx.createMediaStreamSource(stream);
            analyser = ctx.createAnalyser();
            analyser.fftSize = samples.length;
            source.connect(analyser);
          } catch {
            source?.disconnect();
            source = null;
            analyser = null;
            return null;
          }
        }
        analyser.getFloatTimeDomainData(samples);
      } else {
        if (!decoded) return null;
        const data = decoded.getChannelData(0);
        const end = Math.floor(audio.currentTime * decoded.sampleRate);
        samples.fill(0);
        const start = Math.max(0, end - samples.length);
        samples.set(data.subarray(start, Math.min(end, data.length)));
      }
      const volume = audio.volume ?? 1;
      return speechBarLevels(samples).map((level) => level * volume);
    },
    dispose() {
      disposed = true;
      abort.abort();
      source?.disconnect();
      analyser?.disconnect();
      decoded = null;
    },
  };
}
