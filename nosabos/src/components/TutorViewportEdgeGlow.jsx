import React, { memo, useEffect, useRef } from "react";
import { Portal, Box } from "@chakra-ui/react";

const SPEECH_GLOW_CSS = `
.speech-glow,
.speech-glow * {
  pointer-events: none;
}
.speech-glow {
  position: absolute;
  inset: 0;
  overflow: hidden;
  --edge-size: 4px;
  --speech: 0;
  --rim-blur: 1.6px;
  --halo-spread: 3px;
  --hotspot-size: 7px;
  --hotspot-width: 72px;
  --hotspot-blur: 6px;
  --ink: 1;
  --speed: 5.8s;
  opacity: 1;
  transition: opacity 460ms ease;
  filter: brightness(calc(1 + var(--speech) * 0.35)) saturate(calc(1 + var(--speech) * 0.25));
}
.speech-glow.is-tutor {
  opacity: 0.44;
}
.speech-glow.is-light {
  --ink: 1.55;
  filter: saturate(calc(1.5 + var(--speech) * 0.15)) contrast(1.12);
}
.speech-glow.is-light.is-tutor {
  opacity: 0.8;
}
.speech-glow.is-light .edge,
.speech-glow.is-light .hotspot,
.speech-glow.is-light .halo,
.speech-glow.is-light .spill {
  mix-blend-mode: normal;
}
.speech-glow.is-light .halo {
  box-shadow: inset 0 var(--halo-spread) calc(var(--halo-spread) * 1.1) rgba(95, 211, 255, 0.32), inset 0 calc(var(--halo-spread) * -1) calc(var(--halo-spread) * 1.1) rgba(112, 111, 255, 0.28), inset var(--halo-spread) 0 calc(var(--halo-spread) * 1.1) rgba(79, 182, 255, 0.24), inset calc(var(--halo-spread) * -1) 0 calc(var(--halo-spread) * 1.1) rgba(79, 182, 255, 0.24);
}
.speech-glow.is-light .spill {
  box-shadow: inset 0 var(--halo-spread) calc(var(--halo-spread) * 1.15) rgba(88, 217, 255, 0.22), inset 0 calc(var(--halo-spread) * -1.1) calc(var(--halo-spread) * 1.2) rgba(120, 108, 255, 0.24), inset var(--halo-spread) 0 calc(var(--halo-spread) * 1.15) rgba(79, 178, 255, 0.18), inset calc(var(--halo-spread) * -1) 0 calc(var(--halo-spread) * 1.15) rgba(79, 178, 255, 0.18);
}
.edge {
  position: absolute;
  pointer-events: none;
  opacity: var(--glow-opacity, 0.72);
  mix-blend-mode: screen;
}
.edge-top {
  top: 0;
  left: 0;
  right: 0;
  height: var(--edge-size);
  background: linear-gradient(90deg, rgba(120, 115, 255, 0.78) 0%, rgba(83, 138, 255, 0.92) 16%, rgba(74, 190, 255, 1) 38%, rgba(99, 239, 233, 1) 58%, rgba(79, 194, 255, 0.96) 76%, rgba(160, 104, 255, 0.76) 100%);
  filter: blur(var(--rim-blur));
  box-shadow: 0 calc(1.5px + var(--speech) * 2.4px) calc(2px + var(--speech) * 3px) rgba(110, 220, 255, min(1, calc((0.35 + var(--speech) * 0.3) * var(--ink))));
  transform: translateY(-2px);
  animation: topGlow var(--speed) ease-in-out infinite alternate;
}
.edge-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--edge-size);
  background: linear-gradient(90deg, rgba(88, 209, 255, 0.74) 0%, rgba(86, 145, 255, 0.94) 18%, rgba(109, 118, 255, 1) 42%, rgba(96, 132, 255, 0.92) 65%, rgba(74, 205, 255, 0.88) 86%, rgba(120, 116, 255, 0.68) 100%);
  filter: blur(var(--rim-blur));
  box-shadow: 0 calc(-1.5px - var(--speech) * 2.4px) calc(2px + var(--speech) * 3px) rgba(130, 140, 255, min(1, calc((0.32 + var(--speech) * 0.28) * var(--ink))));
  transform: translateY(2px);
  animation: bottomGlow calc(var(--speed) * 1.06) ease-in-out infinite alternate;
}
.edge-left {
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--edge-size);
  background: linear-gradient(180deg, rgba(96, 237, 229, 0.78) 0%, rgba(72, 196, 255, 0.96) 26%, rgba(69, 132, 255, 1) 52%, rgba(96, 112, 255, 0.9) 76%, rgba(132, 110, 255, 0.7) 100%);
  filter: blur(var(--rim-blur));
  box-shadow: calc(1.5px + var(--speech) * 2px) 0 calc(2px + var(--speech) * 2.4px) rgba(90, 190, 255, min(1, calc((0.3 + var(--speech) * 0.28) * var(--ink))));
  transform: translateX(-2px);
  animation: leftGlow calc(var(--speed) * 0.95) ease-in-out infinite alternate;
}
.edge-right {
  top: 0;
  bottom: 0;
  right: 0;
  width: var(--edge-size);
  background: linear-gradient(180deg, rgba(92, 236, 226, 0.76) 0%, rgba(76, 196, 255, 0.95) 28%, rgba(69, 132, 255, 1) 52%, rgba(98, 113, 255, 0.9) 78%, rgba(132, 112, 255, 0.72) 100%);
  filter: blur(var(--rim-blur));
  box-shadow: calc(-1.5px - var(--speech) * 2px) 0 calc(2px + var(--speech) * 2.4px) rgba(90, 190, 255, min(1, calc((0.3 + var(--speech) * 0.28) * var(--ink))));
  transform: translateX(2px);
  animation: rightGlow calc(var(--speed) * 1.03) ease-in-out infinite alternate;
}
.halo {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 var(--halo-spread) calc(var(--halo-spread) * 1.1) rgba(95, 211, 255, 0.16), inset 0 calc(var(--halo-spread) * -1) calc(var(--halo-spread) * 1.1) rgba(112, 111, 255, 0.14), inset var(--halo-spread) 0 calc(var(--halo-spread) * 1.1) rgba(79, 182, 255, 0.12), inset calc(var(--halo-spread) * -1) 0 calc(var(--halo-spread) * 1.1) rgba(79, 182, 255, 0.12);
  animation: haloBreath 2.8s ease-in-out infinite alternate;
}
.spill {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 var(--halo-spread) calc(var(--halo-spread) * 1.15) rgba(88, 217, 255, 0.14), inset 0 calc(var(--halo-spread) * -1.1) calc(var(--halo-spread) * 1.2) rgba(120, 108, 255, 0.16), inset var(--halo-spread) 0 calc(var(--halo-spread) * 1.15) rgba(79, 178, 255, 0.12), inset calc(var(--halo-spread) * -1) 0 calc(var(--halo-spread) * 1.15) rgba(79, 178, 255, 0.12);
  animation: spillBreath 2.7s ease-in-out infinite alternate;
}
.hotspot {
  position: absolute;
  border-radius: 999px;
  filter: blur(var(--hotspot-blur));
  mix-blend-mode: screen;
}
.hotspot-1 {
  top: -8px;
  left: 14%;
  width: var(--hotspot-width);
  height: var(--hotspot-size);
  background: rgba(95, 225, 255, 0.95);
  animation: hotspotA 4.6s ease-in-out infinite alternate;
}
.hotspot-2 {
  top: -6px;
  left: 48%;
  width: calc(var(--hotspot-width) * 1.05);
  height: var(--hotspot-size);
  background: rgba(74, 157, 255, 0.92);
  animation: hotspotB 5.4s ease-in-out infinite alternate;
}
.hotspot-3 {
  bottom: -7px;
  left: 24%;
  width: calc(var(--hotspot-width) * 0.95);
  height: var(--hotspot-size);
  background: rgba(113, 112, 255, 0.86);
  animation: hotspotB 5.2s ease-in-out infinite alternate-reverse;
}
.hotspot-4 {
  bottom: -8px;
  right: 20%;
  width: var(--hotspot-width);
  height: var(--hotspot-size);
  background: rgba(125, 101, 255, 0.82);
  animation: hotspotA 5.1s ease-in-out infinite alternate-reverse;
}
@keyframes topGlow {
  from { transform: translate(-0.8%, -2px); filter: blur(var(--rim-blur)); }
  to { transform: translate(0.8%, -1px); filter: blur(calc(var(--rim-blur) + 1px)); }
}
@keyframes bottomGlow {
  from { transform: translate(-0.7%, 3px); }
  to { transform: translate(0.7%, 2px); }
}
@keyframes leftGlow {
  from { transform: translate(-3px, -0.7%); }
  to { transform: translate(-2px, 0.7%); }
}
@keyframes rightGlow {
  from { transform: translate(3px, 0.7%); }
  to { transform: translate(2px, -0.7%); }
}
@keyframes haloBreath {
  from { opacity: 0.78; }
  to { opacity: 1; }
}
@keyframes spillBreath {
  from { opacity: 0.62; }
  to { opacity: 0.9; }
}
@keyframes hotspotA {
  from { transform: translateX(-10px) scaleX(0.92); }
  to { transform: translateX(12px) scaleX(1.06); }
}
@keyframes hotspotB {
  from { transform: translateX(10px) scaleX(0.92); }
  to { transform: translateX(-12px) scaleX(1.06); }
}
@media (prefers-reduced-motion: reduce) {
  .speech-glow, .speech-glow * {
    animation: none !important;
  }
}
`;

/**
 * Tutor viewport edge treatment.
 * User turn: voice-reactive perimeter glow.
 * Tutor turn: hard border that thickens and brightens with their voice.
 * Renders only while a conversation is active.
 */
function TutorViewportEdgeGlow({
  enabled = true,
  state = "idle",
  isLightTheme = false,
  analyserRef = null,
  floatBufRef = null,
  tutorAnalyserRef = null,
  tutorFloatBufRef = null,
}) {
  const containerRef = useRef(null);
  const isUserTurn = state === "listening";

  useEffect(() => {
    if (!enabled || !isUserTurn) return;

    let rafId;
    let smoothedLevel = 0;

    let freqBuf = null;
    const readLevel = (analyser) => {
      if (!analyser) return 0;
      try {
        if (analyser.context?.state === "suspended") {
          analyser.context.resume?.();
        }
        const bins = analyser.frequencyBinCount || 128;
        if (!freqBuf || freqBuf.length < bins) freqBuf = new Uint8Array(bins);
        analyser.getByteFrequencyData(freqBuf);
        let sum = 0;
        const n = Math.min(freqBuf.length, 40);
        for (let i = 0; i < n; i++) sum += freqBuf[i];
        const avg = sum / n / 255;
        if (avg <= 0.015) return 0;
        return Math.min(1, Math.pow((avg - 0.015) / 0.2, 0.5));
      } catch {
        return 0;
      }
    };

    const updateGlow = () => {
      const node = containerRef.current;
      if (!node) {
        rafId = requestAnimationFrame(updateGlow);
        return;
      }

      let targetLevel = isUserTurn
        ? readLevel(analyserRef?.current)
        : readLevel(tutorAnalyserRef?.current);
      const attack = isUserTurn ? 0.72 : 0.58;
      const decay = isUserTurn ? 0.2 : 0.16;
      const coef = targetLevel > smoothedLevel ? attack : decay;
      smoothedLevel = smoothedLevel + (targetLevel - smoothedLevel) * coef;

      const reach = isUserTurn ? smoothedLevel : smoothedLevel * 0.76;
      const edgeSize = 2.6 + reach * 1.1;
      const rimBlur = 0.9 + reach * 0.4;
      const haloSpread = 1.6 + reach * 1.2;
      const hotspotSize = 4 + reach * 0.8;
      const hotspotWidth = 42 + reach * 5;
      node.style.opacity = smoothedLevel > 0.06 ? "1" : "0";
      node.style.setProperty("--speech", reach.toFixed(3));
      node.style.setProperty("--edge-size", `${edgeSize.toFixed(1)}px`);
      node.style.setProperty("--rim-blur", `${rimBlur.toFixed(1)}px`);
      node.style.setProperty("--halo-spread", `${haloSpread.toFixed(1)}px`);
      node.style.setProperty("--hotspot-size", `${hotspotSize.toFixed(1)}px`);
      node.style.setProperty("--hotspot-width", `${hotspotWidth.toFixed(1)}px`);
      node.style.setProperty("--hotspot-blur", `${(2.8 + reach * 1).toFixed(1)}px`);
      if (isUserTurn) {
        const baseOpacity = isLightTheme ? 1 : 0.56;
        const glowOpacity = Math.min(1, baseOpacity + smoothedLevel * (isLightTheme ? 0 : 0.44));
        node.style.setProperty("--glow-opacity", glowOpacity.toFixed(3));
      } else {
        const baseOpacity = isLightTheme ? 0.84 : 0.28;
        const glowOpacity = Math.min(1, baseOpacity + smoothedLevel * (isLightTheme ? 0.16 : 0.64));
        node.style.setProperty("--glow-opacity", glowOpacity.toFixed(3));
      }

      rafId = requestAnimationFrame(updateGlow);
    };

    rafId = requestAnimationFrame(updateGlow);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    enabled,
    isUserTurn,
    isLightTheme,
    analyserRef,
    floatBufRef,
    tutorAnalyserRef,
    tutorFloatBufRef,
  ]);

  if (!enabled || !isUserTurn) return null;

  return (
    <Portal>
      <style>{SPEECH_GLOW_CSS}</style>
      <Box
        aria-hidden="true"
        pointerEvents="none"
        position="fixed"
        inset={0}
        zIndex={1399}
        overflow="visible"
        opacity={1}
        transition="opacity 380ms ease"
        style={{ cornerShape: "superellipse(2)" }}
        sx={{
          "--window-radius":
            "max(16px, env(safe-area-inset-top, 0px), env(safe-area-inset-right, 0px), env(safe-area-inset-bottom, 0px), env(safe-area-inset-left, 0px))",
          "--glow-depth": "8px",
          "--glow-brightness": isLightTheme ? "1.1" : "1.08",
          "--glow-saturation": isLightTheme ? "1.4" : "1.3",
          "--edge-glow-angle": "0deg",
          "--tutor-border-width": "4px",
          "--tutor-border-bright": "1",
          "--glow-opacity": isLightTheme ? "1" : "0.8",
          "&, & *": { pointerEvents: "none" },
          "--breathe-duration": "1.6s",

          "@keyframes tutorAmbientBreathe": {
            "0%, 100%": {
              filter:
                "blur(4px) saturate(var(--glow-saturation)) brightness(var(--glow-brightness))",
              opacity: isLightTheme ? 0.78 : 0.68,
            },
            "50%": {
              filter:
                "blur(6px) saturate(calc(var(--glow-saturation) + 0.12)) brightness(calc(var(--glow-brightness) + 0.06))",
              opacity: isLightTheme ? 0.92 : 0.86,
            },
          },

          "@keyframes tutorBloomBreathe": {
            "0%, 100%": {
              opacity: isLightTheme ? 0.62 : 0.52,
            },
            "50%": {
              opacity: isLightTheme ? 0.84 : 0.74,
            },
          },

          "@media (prefers-reduced-motion: reduce)": {
            "&, & *": {
              animation: "none !important",
              transition: "none !important",
            },
          },
        }}
      >
        <div
          ref={containerRef}
          className={`speech-glow${isLightTheme ? " is-light" : ""}`}
          aria-hidden="true"
        >
          <div className="edge edge-top" />
          <div className="edge edge-bottom" />
          <div className="edge edge-left" />
          <div className="edge edge-right" />
          <div className="halo" />
          <div className="spill" />
          <div className="hotspot hotspot-1" />
          <div className="hotspot hotspot-2" />
          <div className="hotspot hotspot-3" />
          <div className="hotspot hotspot-4" />
        </div>

      </Box>
    </Portal>
  );
}

export default memo(TutorViewportEdgeGlow);
