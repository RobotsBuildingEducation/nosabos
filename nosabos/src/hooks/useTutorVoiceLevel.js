import { useEffect, useRef } from "react";
import { createTutorVoiceEnvelope, waveformRms } from "../utils/tutorVoiceEnvelope.js";

/** Share one live, smoothed amplitude between the orb, border, and tutor atmosphere. */
export function useTutorVoiceLevel({
  enabled, state, microphoneEnabled = true,
  micAnalyserRef, micFloatBufRef, tutorAnalyserRef, tutorFloatBufRef,
}) {
  const levelRef = useRef(0);

  useEffect(() => {
    levelRef.current = 0;
    if (!enabled || !["listening", "speaking"].includes(state)) return;
    const microphone = state === "listening";
    if (microphone && !microphoneEnabled) return;
    const analyserRef = microphone ? micAnalyserRef : tutorAnalyserRef;
    const bufferRef = microphone ? micFloatBufRef : tutorFloatBufRef;
    const envelope = createTutorVoiceEnvelope({ microphone });
    let frame;
    let previousTime;
    let samples;

    const update = (now) => {
      const dt = previousTime == null ? 0 : now - previousTime;
      previousTime = now;
      let rms = 0;
      const analyser = analyserRef?.current;
      if (analyser && analyser.context?.state !== "suspended" && analyser.context?.state !== "closed") {
        try {
          samples = bufferRef?.current || samples;
          if (!samples || samples.length !== analyser.fftSize) samples = new Float32Array(analyser.fftSize);
          analyser.getFloatTimeDomainData(samples);
          rms = waveformRms(samples);
        } catch {
          // A disconnected audio graph settles back to silence.
        }
      }
      levelRef.current = envelope(rms, dt);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      levelRef.current = 0;
    };
  }, [enabled, state, microphoneEnabled, micAnalyserRef, micFloatBufRef, tutorAnalyserRef, tutorFloatBufRef]);

  return levelRef;
}
