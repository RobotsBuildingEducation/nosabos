import React, { memo, useEffect, useRef } from "react";
import { Portal } from "@chakra-ui/react";
import { ORB_PALETTES } from "./orbing/orbModel.js";
import TutorAmbientShader from "./TutorAmbientShader.jsx";

const rgbChannels = (hex) => hex.match(/[\da-f]{2}/gi).map((channel) => parseInt(channel, 16)).join(", ");

const SPEECH_GLOW_CSS = `
.tutor-ambient,
.tutor-viewport-frame {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
.tutor-ambient {
  z-index: 0;
  overflow: hidden;
  opacity: 0;
  --wash-strength: 0.60;
  transition: opacity 1100ms cubic-bezier(0.22, 1, 0.36, 1);
}
.tutor-ambient.is-light {
  --wash-strength: 0.44;
}
.tutor-ambient[data-visible="true"]:has([data-presentation-ready="true"]) {
  opacity: 1;
}
.tutor-ambient-field {
  position: absolute;
  inset: 0;
  transform: translateY(-6%) scale(1.06);
  transition: transform 1400ms cubic-bezier(0.22, 1, 0.36, 1);
}
.tutor-ambient[data-visible="true"] .tutor-ambient-field {
  transform: translateY(0) scale(1);
}
.tutor-ambient-canvas,
.tutor-ambient-fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.tutor-ambient-canvas { opacity: 0; transition: opacity 420ms ease; }
.tutor-ambient-field[data-shader-ready="true"] .tutor-ambient-canvas { opacity: 1; }
.tutor-ambient-field[data-shader-ready="true"] .tutor-ambient-fallback { opacity: 0; }
.tutor-ambient-field[data-shader-ready="true"] .tutor-ambient-colors { animation-play-state: paused; }
.tutor-ambient-fallback {
  opacity: 1;
  transition: opacity 420ms ease;
  mask-image: linear-gradient(to bottom, black 0%, black 8%, rgba(0, 0, 0, 0.72) 30%, transparent 60%);
  -webkit-mask-image: linear-gradient(to bottom, black 0%, black 8%, rgba(0, 0, 0, 0.72) 30%, transparent 60%);
}
.tutor-ambient-colors {
  position: absolute;
  inset: -15%;
  background:
    radial-gradient(ellipse 70% 62% at 82% 12%, rgba(var(--wash-blue-rgb), var(--wash-strength)) 0%, transparent 76%),
    radial-gradient(ellipse 65% 76% at 12% 22%, rgba(var(--wash-teal-rgb), calc(var(--wash-strength) * 0.9)) 0%, transparent 74%),
    radial-gradient(ellipse 58% 46% at 48% 5%, rgba(var(--orb-mid-rgb), calc(var(--wash-strength) * 0.65)) 0%, transparent 78%);
  filter: blur(36px);
  animation: tutorColorDrift 4.25s ease-in-out infinite alternate;
}
.tutor-ambient-colors-secondary {
  opacity: 0.44;
  background:
    radial-gradient(ellipse 70% 55% at 25% 8%, rgba(var(--wash-blue-rgb), var(--wash-strength)) 0%, transparent 74%),
    radial-gradient(ellipse 66% 62% at 78% 36%, rgba(var(--wash-teal-rgb), var(--wash-strength)) 0%, transparent 76%);
  animation: tutorColorDriftSecondary 6s ease-in-out infinite alternate;
}
.tutor-ambient.is-light .tutor-ambient-colors {
  filter: blur(36px) brightness(1.30);
}
.tutor-ambient-grain {
  position: absolute;
  inset: 0;
  opacity: 0.065;
  mix-blend-mode: soft-light;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' opacity='.8' filter='url(%23grain)'/%3E%3C/svg%3E");
}
.tutor-ambient[data-visible="false"] .tutor-ambient-colors {
  animation-play-state: paused;
}
.tutor-viewport-frame {
  z-index: 1399;
  overflow: hidden;
  opacity: 0;
  transform: scale(1.012);
  filter: blur(3px);
  transition: opacity 750ms ease, transform 1100ms cubic-bezier(0.22, 1, 0.36, 1), filter 900ms ease;
}
.tutor-viewport-frame[data-visible="true"] {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}
.tutor-viewport-frame[data-visible="false"] .speech-glow * {
  animation-play-state: paused;
}
@keyframes tutorColorDrift {
  from { transform: translate(-3%, -2%) scale(1.02) rotate(-2deg); }
  to { transform: translate(4%, 3%) scale(1.08) rotate(3deg); }
}
@keyframes tutorColorDriftSecondary {
  from { transform: translate(4%, 2%) scale(1.06) rotate(3deg); }
  to { transform: translate(-4%, -3%) scale(1.02) rotate(-3deg); }
}
.speech-glow,
.speech-glow * {
  pointer-events: none;
}
.speech-glow {
  position: absolute;
  inset: 0;
  overflow: hidden;
  --edge-size: 3.6px;
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
  --edge-size: 2.88px;
  --halo-spread: 2.88px;
  --rim-blur: 0.6px;
  --hotspot-size: 4.32px;
  --hotspot-width: 32.4px;
  --hotspot-blur: 1.62px;
  --ink: 2.2;
  filter: saturate(calc(1.8 + var(--speech) * 0.2)) contrast(1.15);
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
.speech-glow.is-light .edge-top,
.speech-glow.is-light .edge-bottom,
.speech-glow.is-light .edge-left,
.speech-glow.is-light .edge-right {
  transform: none;
}
.speech-glow.is-light .edge-top {
  height: var(--edge-size);
  background: linear-gradient(90deg, rgba(var(--orb-deep-rgb), 0.95) 0%, rgba(var(--orb-mid-rgb), 1) 20%, rgba(var(--orb-deep-rgb), 1) 50%, rgba(var(--orb-mid-rgb), 1) 80%, rgba(var(--orb-deep-rgb), 0.95) 100%);
  box-shadow: 0 calc(0.72px + var(--speech) * 1.08px) calc(2.16px + var(--speech) * 2.16px) rgba(var(--orb-deep-rgb), 0.40);
}
.speech-glow.is-light .edge-bottom {
  height: var(--edge-size);
  background: linear-gradient(90deg, rgba(var(--orb-deep-rgb), 0.95) 0%, rgba(var(--orb-mid-rgb), 1) 20%, rgba(var(--orb-deep-rgb), 1) 50%, rgba(var(--orb-mid-rgb), 1) 80%, rgba(var(--orb-deep-rgb), 0.95) 100%);
  box-shadow: 0 calc(-0.72px - var(--speech) * 1.08px) calc(2.16px + var(--speech) * 2.16px) rgba(var(--orb-deep-rgb), 0.40);
}
.speech-glow.is-light .edge-left {
  width: var(--edge-size);
  background: linear-gradient(180deg, rgba(var(--orb-deep-rgb), 0.95) 0%, rgba(var(--orb-mid-rgb), 1) 20%, rgba(var(--orb-deep-rgb), 1) 50%, rgba(var(--orb-mid-rgb), 1) 80%, rgba(var(--orb-deep-rgb), 0.95) 100%);
  box-shadow: calc(0.72px + var(--speech) * 1.08px) 0 calc(2.16px + var(--speech) * 2.16px) rgba(var(--orb-deep-rgb), 0.40);
}
.speech-glow.is-light .edge-right {
  width: var(--edge-size);
  background: linear-gradient(180deg, rgba(var(--orb-deep-rgb), 0.95) 0%, rgba(var(--orb-mid-rgb), 1) 20%, rgba(var(--orb-deep-rgb), 1) 50%, rgba(var(--orb-mid-rgb), 1) 80%, rgba(var(--orb-deep-rgb), 0.95) 100%);
  box-shadow: calc(-0.72px - var(--speech) * 1.08px) 0 calc(2.16px + var(--speech) * 2.16px) rgba(var(--orb-deep-rgb), 0.40);
}
.speech-glow.is-light .halo {
  box-shadow: inset 0 var(--halo-spread) calc(var(--halo-spread) * 1.5) rgba(var(--orb-deep-rgb), 0.38), inset 0 calc(var(--halo-spread) * -1) calc(var(--halo-spread) * 1.5) rgba(var(--orb-deep-rgb), 0.35), inset var(--halo-spread) 0 calc(var(--halo-spread) * 1.5) rgba(var(--orb-deep-rgb), 0.32), inset calc(var(--halo-spread) * -1) 0 calc(var(--halo-spread) * 1.5) rgba(var(--orb-deep-rgb), 0.32);
}
.speech-glow.is-light .spill {
  box-shadow: inset 0 calc(var(--halo-spread) * 1.5) calc(var(--halo-spread) * 2.2) rgba(var(--orb-mid-rgb), 0.28), inset 0 calc(var(--halo-spread) * -1.5) calc(var(--halo-spread) * 2.2) rgba(var(--orb-deep-rgb), 0.28), inset calc(var(--halo-spread) * 1.5) 0 calc(var(--halo-spread) * 2.2) rgba(var(--orb-mid-rgb), 0.24), inset calc(var(--halo-spread) * -1.5) 0 calc(var(--halo-spread) * 2.2) rgba(var(--orb-mid-rgb), 0.24);
}
.speech-glow.is-light .hotspot-1,
.speech-glow.is-light .hotspot-2,
.speech-glow.is-light .hotspot-3,
.speech-glow.is-light .hotspot-4 {
  background: rgba(var(--orb-deep-rgb), 0.85);
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
  background: linear-gradient(90deg, rgba(var(--orb-deep-rgb), 0.78) 0%, rgba(var(--orb-mid-rgb), 0.92) 16%, rgba(var(--orb-mid-rgb), 1) 38%, rgba(var(--orb-light-rgb), 1) 58%, rgba(var(--orb-mid-rgb), 0.96) 76%, rgba(var(--orb-deep-rgb), 0.76) 100%);
  filter: blur(var(--rim-blur));
  box-shadow: 0 calc(1.5px + var(--speech) * 2.4px) calc(2px + var(--speech) * 3px) rgba(var(--orb-mid-rgb), min(1, calc((0.35 + var(--speech) * 0.3) * var(--ink))));
  transform: translateY(-2px);
  animation: topGlow var(--speed) ease-in-out infinite alternate;
}
.edge-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--edge-size);
  background: linear-gradient(90deg, rgba(var(--orb-mid-rgb), 0.74) 0%, rgba(var(--orb-deep-rgb), 0.94) 18%, rgba(var(--orb-mid-rgb), 1) 42%, rgba(var(--orb-light-rgb), 0.92) 65%, rgba(var(--orb-mid-rgb), 0.88) 86%, rgba(var(--orb-deep-rgb), 0.68) 100%);
  filter: blur(var(--rim-blur));
  box-shadow: 0 calc(-1.5px - var(--speech) * 2.4px) calc(2px + var(--speech) * 3px) rgba(var(--orb-mid-rgb), min(1, calc((0.32 + var(--speech) * 0.28) * var(--ink))));
  transform: translateY(2px);
  animation: bottomGlow calc(var(--speed) * 1.06) ease-in-out infinite alternate;
}
.edge-left {
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--edge-size);
  background: linear-gradient(180deg, rgba(var(--orb-light-rgb), 0.78) 0%, rgba(var(--orb-mid-rgb), 0.96) 26%, rgba(var(--orb-deep-rgb), 1) 52%, rgba(var(--orb-mid-rgb), 0.9) 76%, rgba(var(--orb-deep-rgb), 0.7) 100%);
  filter: blur(var(--rim-blur));
  box-shadow: calc(1.5px + var(--speech) * 2px) 0 calc(2px + var(--speech) * 2.4px) rgba(var(--orb-mid-rgb), min(1, calc((0.3 + var(--speech) * 0.28) * var(--ink))));
  transform: translateX(-2px);
  animation: leftGlow calc(var(--speed) * 0.95) ease-in-out infinite alternate;
}
.edge-right {
  top: 0;
  bottom: 0;
  right: 0;
  width: var(--edge-size);
  background: linear-gradient(180deg, rgba(var(--orb-light-rgb), 0.76) 0%, rgba(var(--orb-mid-rgb), 0.95) 28%, rgba(var(--orb-deep-rgb), 1) 52%, rgba(var(--orb-mid-rgb), 0.9) 78%, rgba(var(--orb-deep-rgb), 0.72) 100%);
  filter: blur(var(--rim-blur));
  box-shadow: calc(-1.5px - var(--speech) * 2px) 0 calc(2px + var(--speech) * 2.4px) rgba(var(--orb-mid-rgb), min(1, calc((0.3 + var(--speech) * 0.28) * var(--ink))));
  transform: translateX(2px);
  animation: rightGlow calc(var(--speed) * 1.03) ease-in-out infinite alternate;
}
.halo {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 var(--halo-spread) calc(var(--halo-spread) * 1.1) rgba(var(--orb-mid-rgb), 0.16), inset 0 calc(var(--halo-spread) * -1) calc(var(--halo-spread) * 1.1) rgba(var(--orb-deep-rgb), 0.14), inset var(--halo-spread) 0 calc(var(--halo-spread) * 1.1) rgba(var(--orb-mid-rgb), 0.12), inset calc(var(--halo-spread) * -1) 0 calc(var(--halo-spread) * 1.1) rgba(var(--orb-mid-rgb), 0.12);
  animation: haloBreath 2.8s ease-in-out infinite alternate;
}
.spill {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 var(--halo-spread) calc(var(--halo-spread) * 1.15) rgba(var(--orb-mid-rgb), 0.14), inset 0 calc(var(--halo-spread) * -1.1) calc(var(--halo-spread) * 1.2) rgba(var(--orb-deep-rgb), 0.16), inset var(--halo-spread) 0 calc(var(--halo-spread) * 1.15) rgba(var(--orb-mid-rgb), 0.12), inset calc(var(--halo-spread) * -1) 0 calc(var(--halo-spread) * 1.15) rgba(var(--orb-mid-rgb), 0.12);
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
  background: rgba(var(--orb-light-rgb), 0.95);
  animation: hotspotA 4.6s ease-in-out infinite alternate;
}
.hotspot-2 {
  top: -6px;
  left: 48%;
  width: calc(var(--hotspot-width) * 1.05);
  height: var(--hotspot-size);
  background: rgba(var(--orb-mid-rgb), 0.92);
  animation: hotspotB 5.4s ease-in-out infinite alternate;
}
.hotspot-3 {
  bottom: -7px;
  left: 24%;
  width: calc(var(--hotspot-width) * 0.95);
  height: var(--hotspot-size);
  background: rgba(var(--orb-mid-rgb), 0.86);
  animation: hotspotB 5.2s ease-in-out infinite alternate-reverse;
}
.hotspot-4 {
  bottom: -8px;
  right: 20%;
  width: var(--hotspot-width);
  height: var(--hotspot-size);
  background: rgba(var(--orb-deep-rgb), 0.82);
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
  .tutor-ambient, .tutor-ambient *, .tutor-viewport-frame, .speech-glow, .speech-glow * {
    animation: none !important;
    transition: none !important;
  }
}
`;

/**
 * Learner turn: voice-reactive perimeter. Tutor turn: drifting color and grain.
 * Keep both layers mounted so turn changes can blend and reverse mid-transition.
 * Pages with an opaque backdrop can place the aura inside their content layer.
 */
function TutorViewportEdgeGlow({
  enabled = true,
  state = "idle",
  isLightTheme = false,
  audioLevelRef = null,
  ambientInPlace = false,
}) {
  const containerRef = useRef(null);
  const isUserTurn = state === "listening";
  const orbPalette = ORB_PALETTES.find(({ id }) => id === (isLightTheme ? "mint" : "blue"));
  const paletteStyle = {
    "--orb-deep-rgb": rgbChannels(orbPalette.colors[0]),
    "--orb-mid-rgb": rgbChannels(orbPalette.colors[1]),
    "--orb-light-rgb": rgbChannels(orbPalette.colors[2]),
    "--wash-blue-rgb": isLightTheme ? "92, 170, 225" : "37, 114, 224",
    "--wash-teal-rgb": isLightTheme ? rgbChannels(orbPalette.colors[0]) : "0, 151, 149",
  };

  useEffect(() => {
    if (!enabled || !isUserTurn) return;

    let rafId;

    const updateGlow = () => {
      const node = containerRef.current;
      if (!node) {
        rafId = requestAnimationFrame(updateGlow);
        return;
      }

      const reach = Math.min(1, Math.max(0, audioLevelRef?.current || 0));
      const edgeSize = isLightTheme ? 2.88 + reach * 1.44 : 3.6 + reach * 1.1;
      const rimBlur = isLightTheme ? 0.6 + reach * 0.288 : 0.9 + reach * 0.4;
      const haloSpread = isLightTheme ? 2.88 + reach * 1.44 : 1.6 + reach * 1.2;
      const hotspotSize = isLightTheme ? 4.32 + reach * 1.08 : 4 + reach * 0.8;
      const hotspotWidth = isLightTheme ? 32.4 + reach * 7.2 : 42 + reach * 5;
      const hotspotBlur = isLightTheme ? 1.62 + reach * 0.54 : 2.8 + reach * 1.0;
      node.style.setProperty("--speech", reach.toFixed(3));
      node.style.setProperty("--edge-size", `${edgeSize.toFixed(1)}px`);
      node.style.setProperty("--rim-blur", `${rimBlur.toFixed(1)}px`);
      node.style.setProperty("--halo-spread", `${haloSpread.toFixed(1)}px`);
      node.style.setProperty("--hotspot-size", `${hotspotSize.toFixed(1)}px`);
      node.style.setProperty("--hotspot-width", `${hotspotWidth.toFixed(1)}px`);
      node.style.setProperty("--hotspot-blur", `${hotspotBlur.toFixed(1)}px`);
      const baseOpacity = isLightTheme ? 1 : 0.56;
      const glowOpacity = Math.min(1, baseOpacity + reach * (isLightTheme ? 0 : 0.44));
      node.style.setProperty("--glow-opacity", glowOpacity.toFixed(3));

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
    audioLevelRef,
  ]);

  const ambient = (
    <div
      className={`tutor-ambient${isLightTheme ? " is-light" : ""}`}
      data-visible={enabled && state === "speaking"}
      aria-hidden="true"
      style={paletteStyle}
    >
      <TutorAmbientShader prepare={enabled} visible={enabled && state === "speaking"} isLightTheme={isLightTheme} audioLevelRef={audioLevelRef} />
    </div>
  );

  return (
    <>
      {ambientInPlace && ambient}
      <Portal>
        <style>{SPEECH_GLOW_CSS}</style>
        {!ambientInPlace && ambient}
        <div
          className="tutor-viewport-frame"
          data-visible={enabled && isUserTurn}
          aria-hidden="true"
          style={paletteStyle}
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

        </div>
      </Portal>
    </>
  );
}

export default memo(TutorViewportEdgeGlow);
