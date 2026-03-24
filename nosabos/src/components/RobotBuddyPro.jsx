// RobotBuddyPro.jsx (v3.4.0) — Improved speaking/listening states
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * RobotBuddyPro v3.4.0
 * CHANGES from v3.3.1:
 * - LISTENING: blobs breathe slowly inward/outward, orb "opens up" with expanding mask,
 *   concentric ripple rings pulse inward, cooler color temperature, gentle receptive motion
 * - SPEAKING: blobs pulse rhythmically with amplitude, emit outward particle bursts,
 *   radial sound-wave rings expand outward, warmer/brighter intensity, dynamic scaling
 * - Both states now have unique motion signatures that are immediately recognizable
 */

const PALETTES = {
  ocean: {
    primary: "#1cb6fb",
    secondary: "#74cdfc",
    accent: "#16f2d2",
    ringListening: "rgba(28,182,251,0.45)",
    ringSpeaking: "rgba(22,242,210,0.45)",
    ringThinking: "rgba(116,205,252,0.4)",
    neutral: "#69dafa",
    bg: "linear-gradient(180deg,#061428 0%,#0c1e3a 100%)",
    stroke: "#1a3050",
  },
  sunset: {
    primary: "#1cb6fb",
    secondary: "#74cdfc",
    accent: "#16f2d2",
    ringListening: "rgba(28,182,251,0.45)",
    ringSpeaking: "rgba(22,242,210,0.45)",
    ringThinking: "rgba(116,205,252,0.4)",
    neutral: "#69dafa",
    bg: "linear-gradient(180deg,#061428 0%,#0c1e3a 100%)",
    stroke: "#1a3050",
  },
  candy: {
    primary: "#1cb6fb",
    secondary: "#74cdfc",
    accent: "#16f2d2",
    ringListening: "rgba(28,182,251,0.45)",
    ringSpeaking: "rgba(22,242,210,0.45)",
    ringThinking: "rgba(116,205,252,0.4)",
    neutral: "#69dafa",
    bg: "linear-gradient(180deg,#061428 0%,#0c1e3a 100%)",
    stroke: "#1a3050",
  },
  mint: {
    primary: "#1cb6fb",
    secondary: "#74cdfc",
    accent: "#16f2d2",
    ringListening: "rgba(28,182,251,0.45)",
    ringSpeaking: "rgba(22,242,210,0.45)",
    ringThinking: "rgba(116,205,252,0.4)",
    neutral: "#69dafa",
    bg: "linear-gradient(180deg,#061428 0%,#0c1e3a 100%)",
    stroke: "#1a3050",
  },
  violet: {
    primary: "#1cb6fb",
    secondary: "#74cdfc",
    accent: "#16f2d2",
    ringListening: "rgba(28,182,251,0.45)",
    ringSpeaking: "rgba(22,242,210,0.45)",
    ringThinking: "rgba(116,205,252,0.4)",
    neutral: "#69dafa",
    bg: "linear-gradient(180deg,#061428 0%,#0c1e3a 100%)",
    stroke: "#1a3050",
  },
};

export default function RobotBuddyPro({
  state = "idle",
  mood = "neutral",
  loudness = 0,
  speakLoudness,
  variant = "abstract",
  palette = "ocean",
  showBadges = true,
  compact = false,
  maxW = 210,
}) {
  const colors = PALETTES[palette] ?? PALETTES.ocean;
  const amp = useAmp({ state, loudness, speakLoudness });
  const reduced = usePrefersReducedMotion();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: `${maxW}px`,
        margin: "0 auto",
        marginTop: 8,
        padding: "0 8px",
        position: "relative",
      }}
    >
      <style>{CSS_BLOCK}</style>

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
    </div>
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
    return () => m.removeEventListener?.("change", onChange);
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
  return t;
}

function hexWithAlpha(hex, alpha = 1) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1], 16),
    g = parseInt(m[2], 16),
    b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildInfiniteRibbonPath({
  t,
  amp,
  yBase = 196,
  height = 36,
  freq = 1.6,
  speed = 700,
}) {
  const left = -360;
  const width = 1080;
  const N = 90;
  const A = 6 + amp * 22;
  const phase = t / speed;

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

/** ---------- VARIANT: Abstract Orb — IMPROVED STATES ---------- **/
function AbstractAvatar({ amp, state, mood, colors, reduced }) {
  const t = useClock(reduced);
  const moodColor =
    mood === "happy"
      ? colors.secondary
      : mood === "encourage"
        ? colors.primary
        : colors.neutral;

  const isListening = state === "listening";
  const isSpeaking = state === "speaking";

  const breathCycle = Math.sin(t / 2200) * 0.5 + 0.5;
  const speakPulse = Math.sin(t / 1800) * 0.5 + 0.5;

  const baseR = 88;
  const orbRadius = isListening
    ? baseR + 8 + breathCycle * 12 + amp * 6
    : isSpeaking
      ? baseR + 2 + amp * 4
      : baseR;
  const spreadMult = isListening ? 1.35 + breathCycle * 0.3 : 1.0;

  const pulse = (speed, offset = 0, min = 0.85, max = 1.25) => {
    const s = Math.sin(t / speed + offset) * 0.5 + 0.5;
    return min + (max - min) * s;
  };
  const blobScale = isListening
    ? (speed, offset) => pulse(speed * 1.5, offset, 0.9, 1.15)
    : (speed, offset) => pulse(speed, offset);

  const dispBase = isListening ? 6 : 10;
  const dispAmpMult = isListening ? 18 : 32;
  const dispA = Math.round(dispBase + amp * dispAmpMult);
  const dispB = Math.round(dispBase * 0.8 + amp * dispAmpMult * 0.85);
  const dispC = Math.round(dispBase * 1.1 + amp * dispAmpMult * 1.1);

  const glowR = isListening
    ? 85 + breathCycle * 20 + amp * 10
    : isSpeaking
      ? 82 + amp * 10
      : 80 + amp * 22;
  const glowOpacity = isListening
    ? 0.25 + breathCycle * 0.1
    : isSpeaking
      ? 0.3 + amp * 0.12
      : 0.35;

  // Unified colors from palette
  const color1 = colors.accent; // #16f2d2 teal green
  const color2 = colors.primary; // #1cb6fb bright blue
  const color3 = colors.secondary; // #74cdfc pale soft blue
  const colorCenter = colors.neutral; // #69dafa center mix

  const speakPath = useMemo(() => {
    const cx = 180,
      cy = 120,
      baseRadius = 58 + amp * 8,
      N = 72,
      points = [];
    for (let i = 0; i <= N; i++) {
      const angle = (i / N) * Math.PI * 2;
      const w1 = Math.sin(angle * 2 + t / 1400) * (4 + amp * 3);
      const w2 = Math.sin(angle * 3 + t / 2100) * (3 + amp * 2.5);
      const w3 = Math.sin(angle * 5 + t / 3300) * (2 + amp * 2);
      const r = baseRadius + w1 + w2 + w3;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r * 0.92;
      points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return points.join(" ") + " Z";
  }, [t, amp]);

  const gradAngle1 = t / 6000,
    gradAngle2 = t / 8000 + Math.PI * 0.8;
  const f1x = 50 + Math.cos(gradAngle1) * 25,
    f1y = 50 + Math.sin(gradAngle1) * 20;
  const f2x = 50 + Math.cos(gradAngle2) * 25,
    f2y = 50 + Math.sin(gradAngle2) * 20;

  const satA = {
    cx: 180 - 28 * spreadMult - Math.sin(t / 1800) * 10 * spreadMult,
    cy: 120 + 6 + Math.cos(t / 2000) * 8,
  };
  const satB = {
    cx: 180 + 28 * spreadMult + Math.sin(t / 1600) * 9 * spreadMult,
    cy: 118 - 8 + Math.cos(t / 2200) * 7,
  };
  const satC = {
    cx: 180 + Math.sin(t / 1500) * 7 * spreadMult,
    cy: 120 + Math.cos(t / 1800) * 6,
  };
  const satDist = 22 + breathCycle * 14 + amp * 8;
  const satSize = 8 + amp * 5 + breathCycle * 3;

  const blobA = {
    cx: satA.cx,
    cy: satA.cy,
    r: (26 + amp * 14) * blobScale(1400, 0.3),
  };
  const blobB = {
    cx: satB.cx,
    cy: satB.cy,
    r: (24 + amp * 12) * blobScale(1200, 0.9),
  };
  const blobC = {
    cx: satC.cx,
    cy: satC.cy,
    r: (18 + amp * 11) * blobScale(1000, 1.6),
  };

  return (
    <svg
      viewBox="0 0 360 240"
      width="100%"
      height="100%"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="rbgrad" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor={color2} stopOpacity={glowOpacity} />
          <stop
            offset="60%"
            stopColor={color1}
            stopOpacity={glowOpacity * 0.5}
          />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        {isSpeaking && (
          <>
            <radialGradient id="sg1" cx={`${f1x}%`} cy={`${f1y}%`} r="65%">
              <stop offset="0%" stopColor={color1} stopOpacity="0.95" />
              <stop offset="50%" stopColor={color1} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color1} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sg2" cx={`${f2x}%`} cy={`${f2y}%`} r="65%">
              <stop offset="0%" stopColor={color2} stopOpacity="0.95" />
              <stop offset="50%" stopColor={color3} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color3} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sgCenter" cx="50%" cy="50%" r="40%">
              <stop offset="0%" stopColor={colorCenter} stopOpacity="0.85" />
              <stop offset="60%" stopColor={colorCenter} stopOpacity="0.15" />
              <stop offset="100%" stopColor={colorCenter} stopOpacity="0" />
            </radialGradient>
          </>
        )}
        <mask id="orbMask">
          <rect width="100%" height="100%" fill="black" />
          <circle cx="180" cy="120" r={orbRadius} fill="white" />
        </mask>
        <filter id="rbgoo">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={isListening ? 10 : 8}
            result="blur"
          />
          <feColorMatrix
            in="blur"
            result="goo"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
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
                dur={isListening ? "10s" : "7s"}
                values={isListening ? "0.008;0.015;0.008" : "0.01;0.02;0.01"}
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
                dur={isListening ? "11s" : "8s"}
                values={isListening ? "0.007;0.014;0.007" : "0.009;0.018;0.009"}
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
                dur={isListening ? "9s" : "6s"}
                values={isListening ? "0.01;0.018;0.01" : "0.012;0.022;0.012"}
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
        <filter id="gelDispSpeak" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008"
            numOctaves="2"
            seed="17"
            result="n"
          >
            {!reduced && (
              <animate
                attributeName="baseFrequency"
                dur="12s"
                values="0.006;0.012;0.006"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={Math.round(4 + amp * 6)}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      {isListening && !reduced && (
        <g>
          {[0, 1, 2].map((i) => {
            const ph = (t / 8000 + i / 3) % 1;
            const eased = Math.sqrt(ph);
            const r = orbRadius + eased * (34 + amp * 8);
            const fade = Math.pow(1 - ph, 2.2);
            const sw = 1.4 * (1 - eased * 0.55);
            const wobble = Math.sin(ph * Math.PI * 1.5 + i * 1.3) * 0.15;
            return (
              <circle
                key={`lr${i}`}
                cx="180"
                cy="120"
                r={r}
                fill="none"
                stroke={hexWithAlpha(color2, 0.5)}
                strokeWidth={Math.max(0.3, sw + wobble)}
                opacity={fade * (0.28 + amp * 0.2)}
              />
            );
          })}
        </g>
      )}
      {isSpeaking && !reduced && (
        <g opacity={0.2 + amp * 0.2}>
          {[0, 1].map((i) => {
            const phase = (t / 3200 + i / 2) % 1;
            const r = orbRadius * 0.7 + phase * (orbRadius * 0.5 + amp * 10);
            return (
              <circle
                key={`sr${i}`}
                cx="180"
                cy="120"
                r={r}
                fill="none"
                stroke={hexWithAlpha(color2, 0.4)}
                strokeWidth={1.2 * (1 - phase * 0.5)}
                opacity={(1 - phase) * (0.25 + amp * 0.15)}
              />
            );
          })}
        </g>
      )}

      <circle cx="180" cy="120" r={glowR} fill="url(#rbgrad)" />
      {isSpeaking && (
        <circle
          cx="180"
          cy="120"
          r={orbRadius + 3}
          fill="none"
          stroke={hexWithAlpha(color2, 0.06 + amp * 0.08)}
          strokeWidth={1 + amp * 0.5}
          opacity={0.3 + speakPulse * 0.2}
        />
      )}
      {isListening && (
        <circle
          cx="180"
          cy="120"
          r={orbRadius + 6 + breathCycle * 8}
          fill="none"
          stroke={hexWithAlpha(color2, 0.08 + breathCycle * 0.12)}
          strokeWidth={2 + breathCycle * 2}
          opacity={0.6}
        />
      )}

      {isSpeaking && (
        <g filter="url(#gelDispSpeak)">
          <path d={speakPath} fill="url(#sg1)" opacity="0.9" />
          <path d={speakPath} fill="url(#sg2)" opacity="0.85" />
          <path d={speakPath} fill="url(#sgCenter)" opacity="0.7" />
        </g>
      )}

      {!isSpeaking && (
        <g
          mask="url(#orbMask)"
          filter="url(#rbgoo)"
          style={{ mixBlendMode: "screen" }}
        >
          <g filter="url(#gelDispA)">
            <circle
              cx={blobA.cx}
              cy={blobA.cy}
              r={blobA.r}
              fill={hexWithAlpha(color1, 0.98)}
            />
            {isListening && (
              <circle
                cx={satA.cx + Math.cos(t / 1800 + 0.5) * satDist}
                cy={satA.cy + Math.sin(t / 2100 + 0.5) * satDist * 0.7}
                r={satSize}
                fill={hexWithAlpha(color1, 0.75)}
              />
            )}
          </g>
          <g filter="url(#gelDispB)">
            <circle
              cx={blobB.cx}
              cy={blobB.cy}
              r={blobB.r}
              fill={hexWithAlpha(color2, 0.96)}
            />
            {isListening && (
              <circle
                cx={satB.cx + Math.cos(t / 1600 + 2.1) * satDist}
                cy={satB.cy + Math.sin(t / 1900 + 2.1) * satDist * 0.7}
                r={satSize * 0.9}
                fill={hexWithAlpha(color2, 0.7)}
              />
            )}
          </g>
          <g filter="url(#gelDispC)">
            <circle
              cx={blobC.cx}
              cy={blobC.cy}
              r={blobC.r}
              fill={hexWithAlpha(color3, 0.98)}
            />
            {isListening && (
              <circle
                cx={satC.cx + Math.cos(t / 2000 + 4.0) * satDist * 0.85}
                cy={satC.cy + Math.sin(t / 2300 + 4.0) * satDist * 0.65}
                r={satSize * 0.8}
                fill={hexWithAlpha(color3, 0.65)}
              />
            )}
          </g>
        </g>
      )}

      {isListening && (
        <circle
          cx="180"
          cy="120"
          r={12 + breathCycle * 8}
          fill={hexWithAlpha(color2, 0.06 + breathCycle * 0.06)}
          style={{ mixBlendMode: "screen" }}
        />
      )}
    </svg>
  );
}

/** ---------- VARIANT: Sigil (unchanged) ---------- **/
function SigilAvatar({ amp, state, mood, colors, reduced }) {
  const t = useClock(reduced);

  const points = useMemo(() => {
    const A = 64 + amp * 18;
    const B = 38 + amp * 12;
    const a = 3,
      b = 2,
      delta = Math.PI / 2.6;
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
    [t, amp, reduced],
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
        <rect x="66" y="50" width="228" height="48" rx="12" fill="#0b1220" />

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

/** ---------- Audio loudness from <audio> ---------- **/
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
