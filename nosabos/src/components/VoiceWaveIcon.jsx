import React, { useEffect, useRef } from "react";
import { Box, HStack } from "@chakra-ui/react";

let sharedAudioContext = null;

function getSharedAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
      sharedAudioContext = new AudioCtx();
    }
    if (sharedAudioContext.state === "suspended") {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

const FREQ_BUCKETS = [
  { start: 1, end: 2 },   // Bass / fundamental vocal pitch (~300-600 Hz)
  { start: 3, end: 6 },   // Low-mid vowel formants (~900-1800 Hz)
  { start: 7, end: 13 },  // High-mid vowel/consonant formants (~2100-3900 Hz)
  { start: 14, end: 24 }, // Sibilance and high presence (~4200-7200 Hz)
];

const LEVEL_WEIGHTS = [0.85, 1.25, 1.05, 0.75];

/**
 * Minimalist voice equalizer wave icon.
 * Dynamically reacts to user speech when `stream` (MediaStream) or `audioLevelRef`
 * is supplied, with zero-re-render 60fps/120fps direct DOM animation.
 * Falls back to an ambient CSS equalizer wave when idle or without live audio.
 */
export default function VoiceWaveIcon({
  color = "currentColor",
  size = 18,
  barCount = 4,
  stream = null,
  audioLevelRef = null,
  ...props
}) {
  const numSize = typeof size === "number" ? size : parseInt(size, 10) || 18;
  const barWidth = Math.max(2, Math.round(numSize * 0.14));
  const spacing = Math.max(2, Math.round(numSize * 0.12));

  const barRefs = useRef([]);
  const smoothRef = useRef([0, 0, 0, 0]);

  const defaultBars = [
    { scale: 0.45, delay: 0.0 },
    { scale: 1.0, delay: 0.18 },
    { scale: 0.75, delay: 0.36 },
    { scale: 0.45, delay: 0.12 },
  ];

  useEffect(() => {
    const hasLiveSource = !!(stream || audioLevelRef);
    if (!hasLiveSource) {
      // Clear any inline styles so default CSS animation runs
      barRefs.current.forEach((el) => {
        if (!el) return;
        el.style.animation = "";
        el.style.transform = "";
        el.style.opacity = "";
      });
      return;
    }

    let sourceNode = null;
    let analyserNode = null;
    let animId = null;
    let isDisposed = false;
    let freqData = null;

    if (stream && stream.getAudioTracks && stream.getAudioTracks().length > 0) {
      const ctx = getSharedAudioContext();
      if (ctx) {
        try {
          analyserNode = ctx.createAnalyser();
          analyserNode.fftSize = 128;
          analyserNode.smoothingTimeConstant = 0.35;
          sourceNode = ctx.createMediaStreamSource(stream);
          sourceNode.connect(analyserNode);
          freqData = new Uint8Array(analyserNode.frequencyBinCount);
        } catch (e) {
          analyserNode = null;
          sourceNode = null;
        }
      }
    }

    // Disable CSS keyframe animation so inline transform takes precedence smoothly
    barRefs.current.forEach((el) => {
      if (el) el.style.animation = "none";
    });

    const updateFrame = () => {
      if (isDisposed) return;

      const activeBarCount = Math.min(barCount, 4);

      if (analyserNode && freqData) {
        analyserNode.getByteFrequencyData(freqData);
        const noiseFloor = 14;
        const maxLevel = 175;

        for (let i = 0; i < activeBarCount; i++) {
          const bucket = FREQ_BUCKETS[i] || FREQ_BUCKETS[0];
          let sum = 0;
          let count = 0;
          for (let b = bucket.start; b <= bucket.end && b < freqData.length; b++) {
            sum += freqData[b];
            count++;
          }
          const raw = count > 0 ? sum / count : 0;
          const normalized =
            raw <= noiseFloor
              ? 0
              : Math.min(1, (raw - noiseFloor) / (maxLevel - noiseFloor));

          const prev = smoothRef.current[i] || 0;
          const current =
            normalized > prev
              ? prev + (normalized - prev) * 0.72 // Fast attack
              : prev * 0.8; // Smooth decay
          smoothRef.current[i] = current;

          const scaleY = 0.28 + current * 1.05;
          const opacity = 0.65 + current * 0.35;

          const el = barRefs.current[i];
          if (el) {
            el.style.transform = `scaleY(${scaleY.toFixed(3)})`;
            el.style.opacity = opacity.toFixed(2);
          }
        }
      } else if (audioLevelRef) {
        const rawLvl = Math.min(1, Math.max(0, audioLevelRef.current || 0));
        for (let i = 0; i < activeBarCount; i++) {
          const weight = LEVEL_WEIGHTS[i] || 1;
          const target = Math.min(1, rawLvl * weight);
          const prev = smoothRef.current[i] || 0;
          const current =
            target > prev
              ? prev + (target - prev) * 0.7
              : prev * 0.8;
          smoothRef.current[i] = current;

          const scaleY = 0.28 + current * 1.05;
          const opacity = 0.65 + current * 0.35;

          const el = barRefs.current[i];
          if (el) {
            el.style.transform = `scaleY(${scaleY.toFixed(3)})`;
            el.style.opacity = opacity.toFixed(2);
          }
        }
      }

      animId = requestAnimationFrame(updateFrame);
    };

    animId = requestAnimationFrame(updateFrame);

    return () => {
      isDisposed = true;
      if (animId) cancelAnimationFrame(animId);
      try {
        sourceNode?.disconnect();
      } catch {}
      try {
        analyserNode?.disconnect();
      } catch {}
      barRefs.current.forEach((el) => {
        if (!el) return;
        el.style.animation = "";
        el.style.transform = "";
        el.style.opacity = "";
      });
    };
  }, [stream, audioLevelRef, barCount]);

  return (
    <HStack
      spacing={`${spacing}px`}
      h={`${numSize}px`}
      align="center"
      justify="center"
      display="inline-flex"
      aria-hidden="true"
      {...props}
    >
      {defaultBars.slice(0, barCount).map((bar, i) => (
        <Box
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          w={`${barWidth}px`}
          h={`${Math.round(numSize * bar.scale)}px`}
          borderRadius="full"
          bg={color}
          sx={{
            transformOrigin: "center",
            willChange: "transform, opacity",
            animation: `voiceWavePulse 0.75s ease-in-out ${bar.delay}s infinite alternate`,
            "@keyframes voiceWavePulse": {
              "0%": {
                transform: "scaleY(0.35)",
                opacity: 0.65,
              },
              "100%": {
                transform: "scaleY(1.3)",
                opacity: 1,
              },
            },
          }}
        />
      ))}
    </HStack>
  );
}
