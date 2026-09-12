import { JOURNEY_MAX_AUDIO_BYTES, JOURNEY_MAX_SECONDS } from "./voiceJourneyModel.js";

export function createJourneyRecorder({
  onState, onRecording,
  mediaDevices = globalThis.navigator?.mediaDevices,
  Recorder = globalThis.MediaRecorder,
  now = () => Date.now(),
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = id => clearInterval(id),
}) {
  let current = null;
  let disposed = false;
  const release = run => {
    if (run.timer != null) clearTimer(run.timer);
    run.stream?.getTracks().forEach(track => track.stop());
  };
  const fail = (run, error) => {
    run.invalid = true;
    release(run);
    if (current === run) current = null;
    if (!disposed) onState({ status: "idle", error });
  };
  const stop = () => {
    const run = current;
    if (run?.recorder?.state !== "recording") return;
    run.duration = Math.min(JOURNEY_MAX_SECONDS, (now() - run.startedAt) / 1000);
    onState({ status: "stopping", seconds: Math.ceil(run.duration) });
    run.recorder.stop();
    release(run);
  };
  return {
    async start() {
      if (current || disposed) return;
      if (!Recorder || !mediaDevices?.getUserMedia) {
        onState({ status: "idle", error: "unsupported" });
        return;
      }
      const run = { stream: null, recorder: null, chunks: [], size: 0, timer: null };
      current = run;
      onState({ status: "starting", seconds: 0 });
      try {
        run.stream = await mediaDevices.getUserMedia({ audio: true });
        if (disposed || current !== run) { release(run); return; }
        const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(type => Recorder.isTypeSupported?.(type));
        run.recorder = new Recorder(run.stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 48000 });
        run.recorder.ondataavailable = event => {
          if (!event.data?.size || run.invalid || disposed) return;
          run.size += event.data.size;
          if (run.size > JOURNEY_MAX_AUDIO_BYTES) {
            if (run.recorder.state === "recording") run.recorder.stop();
            fail(run, "error");
            return;
          }
          run.chunks.push(event.data);
        };
        run.recorder.onerror = () => {
          if (run.recorder.state === "recording") run.recorder.stop();
          fail(run, "error");
        };
        run.recorder.onstop = () => {
          release(run);
          if (disposed || run.invalid || current !== run) return;
          current = null;
          const duration = run.duration ?? Math.min(JOURNEY_MAX_SECONDS, (now() - run.startedAt) / 1000);
          if (duration < 1 || !run.size) { onState({ status: "idle", error: "error" }); return; }
          const blob = new Blob(run.chunks, { type: run.recorder.mimeType || run.chunks[0]?.type || "audio/webm" });
          onRecording({ blob, duration });
          onState({ status: "preview", seconds: Math.ceil(duration) });
        };
        run.startedAt = now();
        run.recorder.start(250);
        onState({ status: "recording", seconds: 0 });
        run.timer = setTimer(() => {
          const seconds = Math.floor((now() - run.startedAt) / 1000);
          if (seconds >= JOURNEY_MAX_SECONDS) stop();
          else onState({ status: "recording", seconds });
        }, 200);
      } catch {
        if (!disposed && current === run) fail(run, "micError");
        else release(run);
      }
    },
    stop,
    dispose() {
      disposed = true;
      const run = current;
      current = null;
      if (!run) return;
      run.invalid = true;
      if (run.recorder) {
        run.recorder.ondataavailable = null;
        run.recorder.onstop = null;
        run.recorder.onerror = null;
        if (run.recorder.state === "recording") run.recorder.stop();
      }
      release(run);
    },
  };
}
