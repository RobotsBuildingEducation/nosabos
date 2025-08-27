// RobotBuddyPro.jsx (v3.3.1)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Badge, HStack } from "@chakra-ui/react";

/**
 * RobotBuddyPro v3.3.1
 * - Abstract: NO gray base blobs, NO gray specular ellipses.
 * - Colored gel blobs only + infinite bottom ribbon.
 * - Variants: "abstract" | "sigil" | "character" (unchanged API)
 */

const PALETTES = {
  ocean: {
    primary: "#22d3ee",
    secondary: "#60a5fa",
    accent: "#58f7a2",
    ringListening: "rgba(14,165,233,0.6)",
    ringSpeaking: "rgba(34,211,238,0.65)",
    ringThinking: "rgba(255,220,0,0.55)",
    neutral: "#a0b3ff",
    bg: "linear-gradient(180deg,#0b1220 0%,#162033 100%)",
    stroke: "#2b3a55",
  },
  sunset: {
    primary: "#f59e0b",
    secondary: "#fb7185",
    accent: "#facc15",
    ringListening: "rgba(251,113,133,0.5)",
    ringSpeaking: "rgba(250,204,21,0.6)",
    ringThinking: "rgba(245,158,11,0.6)",
    neutral: "#ffb3a7",
    bg: "linear-gradient(180deg,#1b1020 0%,#2a1a14 100%)",
    stroke: "#4b2a20",
  },
  candy: {
    primary: "#f472b6",
    secondary: "#a78bfa",
    accent: "#34d399",
    ringListening: "rgba(167,139,250,0.55)",
    ringSpeaking: "rgba(52,211,153,0.65)",
    ringThinking: "rgba(244,114,182,0.6)",
    neutral: "#ffc6f2",
    bg: "linear-gradient(180deg,#171226 0%,#271a2b 100%)",
    stroke: "#3a2d4a",
  },
  mint: {
    primary: "#5eead4",
    secondary: "#86efac",
    accent: "#2dd4bf",
    ringListening: "rgba(94,234,212,0.55)",
    ringSpeaking: "rgba(45,212,191,0.6)",
    ringThinking: "rgba(134,239,172,0.55)",
    neutral: "#b7ffe8",
    bg: "linear-gradient(180deg,#0f1a17 0%,#11211e 100%)",
    stroke: "#29443d",
  },
  violet: {
    primary: "#8b5cf6",
    secondary: "#22d3ee",
    accent: "#ec4899",
    ringListening: "rgba(139,92,246,0.55)",
    ringSpeaking: "rgba(34,211,238,0.6)",
    ringThinking: "rgba(236,72,153,0.55)",
    neutral: "#cdbaff",
    bg: "linear-gradient(180deg,#130f1c 0%,#1b1630 100%)",
    stroke: "#332a56",
  },
};

export default function RobotBuddyPro({
  state = "idle",
  mood = "neutral",
  loudness = 0,
  speakLoudness,
  variant = "abstract",
  palette = "sunset",
  showBadges = true,
  compact = false,
  maxW = 420,
}) {
  const colors = PALETTES[palette] ?? PALETTES.ocean;
  const amp = useAmp({ state, loudness, speakLoudness });
  const reduced = usePrefersReducedMotion();

  const ring =
    state === "listening"
      ? colors.ringListening
      : state === "speaking"
      ? colors.ringSpeaking
      : state === "thinking"
      ? colors.ringThinking
      : "rgba(255,255,255,0.18)";

  return (
    <Box
      w="100%"
      maxW={`${maxW}px`}
      mx="auto"
      mt={2}
      px={2}
      position="relative"
    >
      {/* Glow ring */}
      <Box
        position="absolute"
        inset="-10px"
        borderRadius="28px"
        filter="blur(14px)"
        pointerEvents="none"
        _before={{
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "28px",
          boxShadow: `0 0 46px 10px ${ring}`,
          animation:
            !reduced && state === "speaking"
              ? "rbproPulse 1.2s ease-in-out infinite"
              : "none",
        }}
      />

      <style>{CSS_BLOCK}</style>

      <Box
        bgGradient={colors.bg}
        border={`1px solid ${hexWithAlpha(colors.stroke, 0.55)}`}
        rounded="2xl"
        p={compact ? 2 : 3}
        boxShadow="0 8px 24px rgba(0,0,0,0.45)"
      >
        {variant === "character" ? (
          <CharacterAvatar
            amp={amp}
            state={state}
            mood={mood}
            colors={colors}
            reduced={reduced}
          />
        ) : variant === "sigil" ? (
          <SigilAvatar
            amp={amp}
            state={state}
            mood={mood}
            colors={colors}
            reduced={reduced}
          />
        ) : (
          <AbstractAvatar
            amp={amp}
            state={state}
            mood={mood}
            colors={colors}
            reduced={reduced}
          />
        )}

        {showBadges && (
          <HStack justify="center" mt={compact ? 1.5 : 2} spacing={2}>
            <Badge
              colorScheme={
                state === "listening"
                  ? "orange"
                  : state === "speaking"
                  ? "green"
                  : state === "thinking"
                  ? "yellow"
                  : "purple"
              }
              variant="solid"
              fontSize={compact ? "xs" : "sm"}
            >
              {state.charAt(0).toUpperCase() + state.slice(1)}
            </Badge>
            {mood !== "neutral" && (
              <Badge
                variant="subtle"
                colorScheme="orange"
                fontSize={compact ? "xs" : "sm"}
              >
                {mood}
              </Badge>
            )}
          </HStack>
        )}
      </Box>
    </Box>
  );
}

/** ---------- Hooks & utils ---------- **/
function useAmp({ state, loudness, speakLoudness }) {
  const [t, setT] = useState(0);
  const target =
    state === "speaking"
      ? typeof speakLoudness === "number"
        ? speakLoudness
        : 0.45
      : state === "listening"
      ? loudness
      : 0.12;

  const wobble =
    state === "speaking" && typeof speakLoudness !== "number"
      ? 0.12 * (Math.sin(t / 120) * Math.sin(t / 274))
      : 0;

  const raw = Math.max(0, Math.min(1, target + wobble));
  const [smooth, setSmooth] = useState(raw);

  useEffect(() => {
    let raf;
    const loop = () => {
      setT(performance.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const alpha = 0.22;
    setSmooth((prev) => prev + alpha * (raw - prev));
  }, [raw]);

  return smooth;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!m.matches);
    onChange();
    m.addEventListener?.("change", onChange);
    return () => {
      m.removeEventListener?.("change", onChange);
    };
  }, []);
  return reduced;
}

function useClock(paused = false) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (paused) return;
    let raf;
    const loop = () => {
      setT(performance.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused]);
  return t; // ms
}

function hexWithAlpha(hex, alpha = 1) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1], 16),
    g = parseInt(m[2], 16),
    b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Build an infinite-feel ribbon: overscan far beyond the viewBox and scroll phase. */
function buildInfiniteRibbonPath({
  t,
  amp,
  yBase = 196,
  height = 36,
  freq = 1.6,
  speed = 700,
}) {
  const left = -360; // overscan left
  const width = 1080; // overscan width
  const N = 90;
  const A = 6 + amp * 22;
  const phase = t / speed; // Removed % (Math.PI * 2) for continuous scrolling

  let d = `M ${left} ${yBase}`;
  for (let i = 1; i <= N; i++) {
    const x = left + (width * i) / N;
    const w1 = Math.sin((i * freq * Math.PI * 2) / N + phase);
    const w2 = Math.sin((i * (freq * 0.5) * Math.PI * 2) / N + phase * 1.7);
    const y = yBase - (w1 * A + w2 * (A * 0.45));
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  d += ` L ${left + width} ${yBase + height} L ${left} ${yBase + height} Z`;
  return d;
}
/** ---------- VARIANT: Abstract Orb (color blobs only; infinite ribbon) ---------- **/
function AbstractAvatar({ amp, state, mood, colors, reduced }) {
  const t = useClock(reduced);
  const moodColor =
    mood === "happy"
      ? colors.secondary
      : mood === "encourage"
      ? colors.primary
      : colors.neutral;

  const ringStroke =
    state === "thinking"
      ? colors.ringThinking
      : state === "listening"
      ? colors.ringListening
      : state === "speaking"
      ? colors.ringSpeaking
      : hexWithAlpha(colors.stroke, 0.8);

  const ribbonPath = useMemo(
    () =>
      buildInfiniteRibbonPath({
        t,
        amp: reduced ? 0.1 : amp,
        yBase: 196,
        height: 36,
        freq: 1.7,
        speed: 640,
      }),
    [t, amp, reduced]
  );

  // Per-blob size pulsers (different rhythms)
  const pulse = (speed, offset = 0, min = 0.85, max = 1.25) => {
    const s = Math.sin(t / speed + offset) * 0.5 + 0.5;
    return min + (max - min) * s;
  };

  // Displacement scales (react to amp)
  const dispA = Math.round(10 + amp * 32);
  const dispB = Math.round(8 + amp * 28);
  const dispC = Math.round(12 + amp * 36);

  return (
    <svg
      viewBox="0 0 360 240"
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      <defs>
        {/* outer glow only (kept) */}
        <radialGradient id="rbgrad" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.35" />
          <stop offset="60%" stopColor={colors.secondary} stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>

        {/* Clip the gel to a circle; NO gray base behind */}
        <mask id="orbMask">
          <rect width="100%" height="100%" fill="black" />
          <circle cx="180" cy="120" r="88" fill="white" />
        </mask>

        {/* metaball fusion */}
        <filter id="rbgoo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            result="goo"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>

        {/* per-blob turbulence + displacement */}
        <filter id="gelDispA" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="2"
            seed="3"
            result="n"
          >
            {!reduced && (
              <animate
                attributeName="baseFrequency"
                dur="7s"
                values="0.01;0.02;0.01"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={dispA}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="gelDispB" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011"
            numOctaves="2"
            seed="7"
            result="n"
          >
            {!reduced && (
              <animate
                attributeName="baseFrequency"
                dur="8s"
                values="0.009;0.018;0.009"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={dispB}
            xChannelSelector="G"
            yChannelSelector="B"
          />
        </filter>
        <filter id="gelDispC" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.013"
            numOctaves="2"
            seed="11"
            result="n"
          >
            {!reduced && (
              <animate
                attributeName="baseFrequency"
                dur="6s"
                values="0.012;0.022;0.012"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={dispC}
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>

        {/* ribbon gradient */}
        <linearGradient id="ribbonGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hexWithAlpha(colors.primary, 0.9)} />
          <stop offset="80%" stopColor={hexWithAlpha(colors.accent, 0.35)} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* soft outer glow (bluish/brand tint; not gray) */}
      <circle cx="180" cy="120" r={80 + amp * 22} fill="url(#rbgrad)" />

      {/* COLOR LAVA BLOBS ONLY */}
      <g
        mask="url(#orbMask)"
        filter="url(#rbgoo)"
        style={{ mixBlendMode: "screen" }}
      >
        {/* GREEN */}
        <g filter="url(#gelDispA)">
          <circle
            cx={180 - 28 - Math.sin(t / 1100) * 10}
            cy={120 + 6 + Math.cos(t / 1300) * 8}
            r={(26 + amp * 14) * pulse(1400, 0.3)}
            fill={hexWithAlpha(colors.accent, 0.98)}
          />
        </g>
        {/* BLUE */}
        <g filter="url(#gelDispB)">
          <circle
            cx={180 + 28 + Math.sin(t / 1000) * 9}
            cy={118 - 8 + Math.cos(t / 1400) * 7}
            r={(24 + amp * 12) * pulse(1200, 0.9)}
            fill={hexWithAlpha(colors.secondary, 0.96)}
          />
        </g>
        {/* PURPLE / mood */}
        <g filter="url(#gelDispC)">
          <circle
            cx={180 + Math.sin(t / 900) * 7}
            cy={120 + Math.cos(t / 1100) * 6}
            r={(18 + amp * 11) * pulse(1000, 1.6)}
            fill={hexWithAlpha(moodColor, 0.98)}
          />
        </g>
      </g>

      {/* orbiting dash ring */}
      <g
        style={{
          transformOrigin: "180px 120px",
          animation:
            !reduced && state !== "idle"
              ? "rbproOrbit 8s linear infinite"
              : "none",
        }}
      >
        <circle
          cx="180"
          cy="120"
          r={66 + amp * 6}
          fill="none"
          stroke={ringStroke}
          strokeOpacity="0.7"
          strokeDasharray="6 10"
          strokeWidth="2"
          style={{
            animation: !reduced ? "rbproDash 4s linear infinite" : "none",
          }}
        />
      </g>

      {/* INFINITE BOTTOM RIBBON (sound wave) */}
      <path d={ribbonPath} fill="url(#ribbonGrad)" opacity="0.95" />
      <path
        d={ribbonPath.replace(/Z$/, "")}
        fill="none"
        stroke={hexWithAlpha(colors.primary, 0.85)}
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

/** ---------- VARIANT: Sigil (kept; infinite ribbon) ---------- **/
function SigilAvatar({ amp, state, mood, colors, reduced }) {
  const t = useClock(reduced);

  const points = useMemo(() => {
    const A = 64 + amp * 18;
    const B = 38 + amp * 12;
    const a = 3;
    const b = 2;
    const delta = Math.PI / 2.6;
    const cx = 180,
      cy = 120,
      N = 360;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = (i / N) * Math.PI * 2 + t / 5000;
      const x = cx + A * Math.sin(a * u + delta);
      const y = cy + B * Math.sin(b * u);
      pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(" ");
  }, [amp, t]);

  const haloR = 78 + amp * 14;
  const accent =
    mood === "happy"
      ? colors.secondary
      : mood === "encourage"
      ? colors.accent
      : colors.neutral;

  const ribbon = useMemo(
    () =>
      buildInfiniteRibbonPath({
        t,
        amp: reduced ? 0.1 : amp,
        yBase: 196,
        height: 32,
        freq: 1.4,
        speed: 680,
      }),
    [t, amp, reduced]
  );

  return (
    <svg
      viewBox="0 0 360 240"
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="sigHalo" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.25" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sigRibbonGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hexWithAlpha(colors.secondary, 0.9)} />
          <stop offset="90%" stopColor={hexWithAlpha(colors.accent, 0.25)} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      <circle cx="180" cy="120" r={haloR} fill="url(#sigHalo)" />
      <path
        d={points}
        fill="none"
        stroke={accent}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.18))" }}
      />

      {[0, 1, 2, 3, 4, 5].map((k) => {
        const angle = ((performance.now() / 2000 + k / 6) % 1) * Math.PI * 2;
        const r = 50 + amp * 18;
        const x = 180 + r * Math.cos(angle);
        const y = 120 + r * Math.sin(angle) * 0.7;
        return (
          <circle
            key={k}
            cx={x}
            cy={y}
            r={3 + ((k % 3) + 1) * 0.6}
            fill={k % 2 ? colors.primary : colors.accent}
            opacity="0.9"
          />
        );
      })}

      <path d={ribbon} fill="url(#sigRibbonGrad)" opacity="0.95" />
      <path
        d={ribbon.replace(/Z$/, "")}
        fill="none"
        stroke={hexWithAlpha(colors.secondary, 0.85)}
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** ---------- VARIANT: Character (unchanged) ---------- **/
function CharacterAvatar({ amp, state, mood, colors, reduced }) {
  const [gaze, setGaze] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onMove = (e) => {
      const { clientX, clientY } = e.touches?.[0] || e;
      const w = window.innerWidth,
        h = window.innerHeight;
      const nx = (clientX / w) * 2 - 1;
      const ny = (clientY / h) * 2 - 1;
      setGaze({
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchstart", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchstart", onMove);
    };
  }, []);

  const eyeX = gaze.x * 6,
    eyeY = gaze.y * 4;
  const accent =
    mood === "happy"
      ? colors.secondary
      : mood === "encourage"
      ? colors.accent
      : colors.neutral;

  return (
    <svg
      viewBox="0 0 360 240"
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="headGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
      </defs>

      <g
        style={{
          transformOrigin: "180px 120px",
          animation: !reduced
            ? "rbproDriftY 6.5s ease-in-out infinite"
            : "none",
        }}
      >
        <rect
          x="40"
          y="28"
          width="280"
          height="170"
          rx="26"
          fill="url(#headGrad)"
          stroke={colors.stroke}
          strokeWidth="2"
        />
        <rect x="66" y="50" width="228" height="48" rx="12" fill="#2a1a14" />

        <g stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.8">
          {mood === "encourage" ? (
            <>
              <line x1="108" y1="72" x2="138" y2="68" />
              <line x1="222" y1="68" x2="252" y2="72" />
            </>
          ) : mood === "happy" ? (
            <>
              <line x1="108" y1="70" x2="138" y2="70" />
              <line x1="222" y1="70" x2="252" y2="70" />
            </>
          ) : (
            <>
              <line x1="108" y1="74" x2="138" y2="72" />
              <line x1="222" y1="72" x2="252" y2="74" />
            </>
          )}
        </g>

        <g transform={`translate(${eyeX}, ${eyeY})`}>
          <g>
            <ellipse
              cx="128"
              cy="92"
              rx="18"
              ry="12"
              fill="#e2e8f0"
              style={{
                transformOrigin: "128px 92px",
                animation: !reduced
                  ? "rbproBlink 5.2s ease-in-out infinite"
                  : "none",
              }}
            />
            <circle cx="128" cy="92" r="6" fill="#334155" />
          </g>
          <g>
            <ellipse
              cx="232"
              cy="92"
              rx="18"
              ry="12"
              fill="#e2e8f0"
              style={{
                transformOrigin: "232px 92px",
                animation: !reduced
                  ? "rbproBlink 6.1s ease-in-out infinite"
                  : "none",
              }}
            />
            <circle cx="232" cy="92" r="6" fill="#334155" />
          </g>
        </g>

        <circle
          cx="112"
          cy="122"
          r={8 + amp * 3}
          fill={accent}
          opacity={0.25}
        />
        <circle
          cx="248"
          cy="122"
          r={8 + amp * 3}
          fill={accent}
          opacity={0.25}
        />

        <g transform="translate(180, 138)">
          <rect
            x={-30}
            y={-5 - amp * 9}
            width={60}
            height={10 + amp * 20}
            rx={12}
            fill={accent}
            opacity={0.9}
          />
          {state === "speaking" && (
            <rect
              x={-44}
              y={-2 - amp * 6}
              width={88}
              height={4 + amp * 12}
              rx={8}
              fill="#94a3b8"
              opacity={0.28}
            />
          )}
        </g>

        <line
          x1="180"
          y1="20"
          x2="180"
          y2="42"
          stroke={accent}
          strokeWidth="4"
        />
        <circle cx="180" cy="16" r="8" fill={accent}>
          {!reduced && (
            <animate
              attributeName="r"
              dur="2s"
              values="8;11;8"
              repeatCount="indefinite"
            />
          )}
        </circle>

        <g transform="translate(90, 190)">
          {Array.from({ length: 14 }).map((_, i) => {
            const h = 6 + amp * 24 * (0.6 + (i % 5) * 0.08);
            return (
              <rect
                key={i}
                x={i * 14}
                y={-h}
                width="8"
                height={h}
                rx="2"
                fill={accent}
                opacity={0.9}
              />
            );
          })}
        </g>
      </g>
    </svg>
  );
}

/** ---------- Audio loudness from <audio> (sturdy) ---------- **/
export function useAudioOutputLoudness(audioRef) {
  const [lvl, setLvl] = useState(0);
  const nodesRef = useRef(null);

  useEffect(() => {
    const el = audioRef?.current;
    if (!el) return;

    let ctx, src, analyser, raf;

    const setup = async () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioCtx();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;

        src = ctx.createMediaElementSource(el);
        src.connect(analyser);
        analyser.connect(ctx.destination);

        const maybeResume = () => {
          if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
        };
        el.addEventListener("play", maybeResume, { passive: true });

        const buf = new Uint8Array(analyser.fftSize);
        const loop = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          setLvl(rms);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        nodesRef.current = {
          ctx,
          src,
          analyser,
          cleanup: () => el.removeEventListener("play", maybeResume),
        };
      } catch (e) {
        console.warn("useAudioOutputLoudness:", e?.message || e);
      }
    };

    setup();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      try {
        nodesRef.current?.cleanup?.();
      } catch {}
      try {
        nodesRef.current?.src?.disconnect();
      } catch {}
      try {
        nodesRef.current?.analyser?.disconnect();
      } catch {}
      try {
        const c = nodesRef.current?.ctx;
        if (c && c.state !== "closed") c.suspend().catch(() => {});
      } catch {}
      nodesRef.current = null;
    };
  }, [audioRef]);

  return lvl;
}

/** ---------- Local CSS ---------- **/
const CSS_BLOCK = `
@keyframes rbproPulse { 0%{ transform: scale(.985) } 50%{ transform: scale(1.025) } 100%{ transform: scale(.985) } }
@keyframes rbproDriftY { 0%{ transform: translateY(-6px) } 50%{ transform: translateY(6px) } 100%{ transform: translateY(-6px) } }
@keyframes rbproOrbit { 0%{ transform: rotate(0deg) } 100%{ transform: rotate(360deg) } }
@keyframes rbproBlink { 0%,92%,100% { transform: scaleY(1) } 96% { transform: scaleY(0.08) } }
@keyframes rbproDash { to { stroke-dashoffset: -200 } }
`;
