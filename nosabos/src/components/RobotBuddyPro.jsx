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

/** ---------- VARIANT: Shader Orb (OpenAI-style) ---------- **/
function AbstractAvatar({ amp, state, mood, colors, reduced }) {
  const canvasRef = useRef(null);
  const propsRef = useRef({ amp, state, mood, colors, reduced });

  useEffect(() => {
    propsRef.current = { amp, state, mood, colors, reduced };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 360,
      H = 240,
      CX = 180,
      CY = 120,
      BASE_R = 88;
    let rafId;

    const draw = (ts) => {
      const { amp, state, reduced: isReduced } = propsRef.current;
      const t = ts * 0.001;
      const isListening = state === "listening";
      const isSpeaking = state === "speaking";

      ctx.clearRect(0, 0, W, H);

      const breathCycle = Math.sin(t * 0.45) * 0.5 + 0.5;
      const orbR =
        BASE_R +
        (isListening ? 8 + breathCycle * 12 + amp * 6 : 0) +
        (isSpeaking ? 2 + amp * 4 : 0);
      const speedMult = isSpeaking
        ? 1.4 + amp * 0.8
        : isListening
          ? 0.65
          : 1.0;

      // — Outer glow —
      const glowR = orbR * (1.3 + amp * 0.15);
      const glowAlpha = isListening
        ? 0.22 + breathCycle * 0.08
        : isSpeaking
          ? 0.26 + amp * 0.1
          : 0.2;
      const glowColor = isSpeaking ? "22,220,180" : "28,162,251";
      const outerGlow = ctx.createRadialGradient(
        CX,
        CY,
        orbR * 0.88,
        CX,
        CY,
        glowR,
      );
      outerGlow.addColorStop(0, `rgba(${glowColor},${glowAlpha})`);
      outerGlow.addColorStop(1, `rgba(${glowColor},0)`);
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(CX, CY, glowR, 0, Math.PI * 2);
      ctx.fill();

      // — Clipped orb interior —
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, orbR, 0, Math.PI * 2);
      ctx.clip();

      // Deep navy base
      ctx.fillStyle = "#030d1a";
      ctx.fillRect(CX - orbR - 2, CY - orbR - 2, orbR * 2 + 4, orbR * 2 + 4);

      ctx.globalCompositeOperation = "screen";

      // Primary blue pool
      const b0x = CX + Math.cos(t * 0.18 * speedMult) * orbR * 0.28;
      const b0y = CY + Math.sin(t * 0.13 * speedMult) * orbR * 0.22;
      const b0r = orbR * (0.92 + amp * 0.1);
      const b0 = ctx.createRadialGradient(b0x, b0y, 0, b0x, b0y, b0r);
      const [b0r0, b0g0, b0b0] = isSpeaking
        ? [20, 180, 255]
        : isListening
          ? [10, 130, 240]
          : [28, 140, 251];
      b0.addColorStop(0, `rgba(${b0r0},${b0g0},${b0b0},0.88)`);
      b0.addColorStop(0.45, `rgba(${b0r0},${b0g0},${b0b0},0.28)`);
      b0.addColorStop(1, `rgba(${b0r0},${b0g0},${b0b0},0)`);
      ctx.fillStyle = b0;
      ctx.fillRect(CX - orbR - 2, CY - orbR - 2, orbR * 2 + 4, orbR * 2 + 4);

      // Teal / cyan pool
      const b1x =
        CX + Math.cos(t * 0.14 * speedMult + 1.85) * orbR * 0.33;
      const b1y =
        CY + Math.sin(t * 0.11 * speedMult + 1.85) * orbR * 0.26;
      const b1r = orbR * (0.78 + amp * 0.1);
      const b1 = ctx.createRadialGradient(b1x, b1y, 0, b1x, b1y, b1r);
      const [b1r0, b1g0, b1b0] = isSpeaking
        ? [0, 240, 200]
        : isListening
          ? [0, 195, 215]
          : [22, 210, 190];
      b1.addColorStop(0, `rgba(${b1r0},${b1g0},${b1b0},0.78)`);
      b1.addColorStop(0.48, `rgba(${b1r0},${b1g0},${b1b0},0.22)`);
      b1.addColorStop(1, `rgba(${b1r0},${b1g0},${b1b0},0)`);
      ctx.fillStyle = b1;
      ctx.fillRect(CX - orbR - 2, CY - orbR - 2, orbR * 2 + 4, orbR * 2 + 4);

      // Deep indigo accent (adds depth)
      const b2x =
        CX + Math.cos(t * 0.21 * speedMult + 3.6) * orbR * 0.25;
      const b2y =
        CY + Math.sin(t * 0.16 * speedMult + 3.6) * orbR * 0.2;
      const b2r = orbR * (0.72 + amp * 0.07);
      const b2 = ctx.createRadialGradient(b2x, b2y, 0, b2x, b2y, b2r);
      b2.addColorStop(0, `rgba(30,60,200,0.82)`);
      b2.addColorStop(0.5, `rgba(30,60,200,0.18)`);
      b2.addColorStop(1, `rgba(30,60,200,0)`);
      ctx.fillStyle = b2;
      ctx.fillRect(CX - orbR - 2, CY - orbR - 2, orbR * 2 + 4, orbR * 2 + 4);

      // Speaking burst pool
      if (isSpeaking) {
        const b3x =
          CX +
          Math.cos(t * 0.38 + 0.9) * orbR * 0.18 +
          Math.sin(t * 2.2) * orbR * amp * 0.14;
        const b3y =
          CY +
          Math.sin(t * 0.31 + 0.9) * orbR * 0.16 +
          Math.cos(t * 1.9) * orbR * amp * 0.11;
        const b3r = orbR * (0.52 + amp * 0.22);
        const b3 = ctx.createRadialGradient(b3x, b3y, 0, b3x, b3y, b3r);
        b3.addColorStop(
          0,
          `rgba(120,255,230,${0.55 + amp * 0.3})`,
        );
        b3.addColorStop(0.4, `rgba(80,220,200,${0.18 + amp * 0.1})`);
        b3.addColorStop(1, `rgba(80,220,200,0)`);
        ctx.fillStyle = b3;
        ctx.fillRect(
          CX - orbR - 2,
          CY - orbR - 2,
          orbR * 2 + 4,
          orbR * 2 + 4,
        );
      }

      // Specular highlight (sphere illusion — upper-left)
      const hlx =
        CX - orbR * 0.28 + Math.cos(t * 0.07 * speedMult) * orbR * 0.06;
      const hly =
        CY - orbR * 0.32 + Math.sin(t * 0.055 * speedMult) * orbR * 0.05;
      const hlr = orbR * (0.44 + amp * 0.04);
      const hl = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, hlr);
      hl.addColorStop(0, `rgba(255,255,255,${0.38 + amp * 0.06})`);
      hl.addColorStop(0.3, `rgba(200,230,255,0.12)`);
      hl.addColorStop(1, `rgba(200,230,255,0)`);
      ctx.fillStyle = hl;
      ctx.fillRect(CX - orbR - 2, CY - orbR - 2, orbR * 2 + 4, orbR * 2 + 4);

      // Edge vignette for depth
      ctx.globalCompositeOperation = "source-over";
      const vign = ctx.createRadialGradient(CX, CY, orbR * 0.58, CX, CY, orbR);
      vign.addColorStop(0, "rgba(0,0,0,0)");
      vign.addColorStop(0.68, "rgba(0,0,0,0.08)");
      vign.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.fillStyle = vign;
      ctx.fillRect(CX - orbR - 2, CY - orbR - 2, orbR * 2 + 4, orbR * 2 + 4);

      ctx.restore();

      // — Listening inward rings —
      if (isListening && !isReduced) {
        for (let i = 0; i < 3; i++) {
          const ph = ((ts * 0.000125) + i / 3) % 1;
          const ringR = orbR + Math.sqrt(ph) * (32 + amp * 8);
          const fade = Math.pow(1 - ph, 2.2) * (0.26 + amp * 0.14);
          const sw = Math.max(0.3, 1.4 * (1 - ph * 0.55));
          ctx.beginPath();
          ctx.arc(CX, CY, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(28,182,251,${fade})`;
          ctx.lineWidth = sw;
          ctx.stroke();
        }
      }

      // — Speaking outward rings —
      if (isSpeaking && !isReduced) {
        for (let i = 0; i < 2; i++) {
          const phase = ((ts * 0.0003125) + i / 2) % 1;
          const ringR = orbR * 0.7 + phase * (orbR * 0.5 + amp * 10);
          const alpha = (1 - phase) * (0.22 + amp * 0.12);
          ctx.beginPath();
          ctx.arc(CX, CY, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(22,242,210,${alpha})`;
          ctx.lineWidth = 1.2 * (1 - phase * 0.5);
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []); // animation loop runs once; live values read from propsRef

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={240}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
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
