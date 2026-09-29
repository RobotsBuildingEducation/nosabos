import { useEffect, useRef } from "react";
import { keyframes } from "@emotion/react";
import { Box } from "@chakra-ui/react";
import { normalizePetType } from "../utils/petTypes";
import { drawCompanionCharacter, getHealthyCompanionStage } from "./PlatePetPanel";

// The reward pose animates paws, arms, feet, tail, antenna, and gills in the
// pixel drawers. These small outer gestures add a different rhythm per pet.
const dances = {
  ghost: keyframes`
    0%, 100% { transform: translateY(0) rotate(0); }
    12% { transform: translateY(1px) rotate(-2deg); }
    30% { transform: translateY(-5px) rotate(-6deg); }
    48% { transform: translateY(-3px) rotate(0); }
    66% { transform: translateY(-6px) rotate(5deg); }
    82% { transform: translateY(-2px) rotate(2deg); }
  `,
  alien: keyframes`
    0%, 100% { transform: translate(0, 0) rotate(0) scale(1); }
    15% { transform: translateY(1px) rotate(-2deg) scale(1.02, 0.98); }
    30% { transform: translateY(0) rotate(2deg) scale(0.99, 1.01); }
    45% { transform: translateY(1px) rotate(-2deg) scale(1.02, 0.98); }
    60% { transform: translateY(0) rotate(2deg) scale(0.99, 1.01); }
    78% { transform: translateY(-2px) rotate(0) scale(0.98, 1.02); }
  `,
  robot: keyframes`
    0%, 14%, 100% { transform: translate(0, 0) rotate(0); }
    15%, 29% { transform: translateY(0) rotate(-2deg); }
    30%, 44% { transform: translateY(-1px) rotate(0); }
    45%, 59% { transform: translateY(-1px) rotate(2deg); }
    60%, 74% { transform: translateY(0) rotate(0); }
    75%, 84% { transform: translateY(-2px) rotate(0); }
  `,
  slime: keyframes`
    0%, 100% { transform: translateY(0) scale(1, 1); }
    14% { transform: translateY(1px) scale(1.06, 0.94); }
    28% { transform: translateY(-4px) scale(0.97, 1.05); }
    43% { transform: translateY(-3px) scale(0.99, 1.02); }
    58% { transform: translateY(1px) scale(1.07, 0.93); }
    72% { transform: translateY(0) scale(0.98, 1.03); }
    85% { transform: translateY(0) scale(1.02, 0.98); }
  `,
  dog: keyframes`
    0%, 100% { transform: translate(0, 0) rotate(0); }
    15% { transform: translateY(1px) rotate(-2deg); }
    30% { transform: translateY(-2px) rotate(-3deg); }
    45% { transform: translateY(0) rotate(0); }
    60% { transform: translateY(-2px) rotate(3deg); }
    75% { transform: translateY(0) rotate(0); }
    88% { transform: translateY(2px) rotate(1deg); }
  `,
  axolotl: keyframes`
    0%, 100% { transform: translateY(0) rotate(-2deg) scaleX(1); }
    20% { transform: translateY(-1px) rotate(1deg) scaleX(1.02); }
    40% { transform: translateY(-2px) rotate(3deg) scaleX(0.99); }
    60% { transform: translateY(0) rotate(0) scaleX(0.98); }
    80% { transform: translateY(1px) rotate(-3deg) scaleX(1.02); }
  `,
};

const danceSettings = {
  ghost: { frameMs: 170, easing: "ease-in-out" },
  alien: { frameMs: 150, easing: "ease-in-out" },
  robot: { frameMs: 180, easing: "steps(1, end)" },
  slime: { frameMs: 140, easing: "ease-in-out" },
  dog: { frameMs: 150, easing: "ease-in-out" },
  axolotl: { frameMs: 200, easing: "ease-in-out" },
};

const celebrationStage = { ...getHealthyCompanionStage(), motion: "celebrate" };

export default function CompanionRewardDance({ petType, prefersReducedMotion }) {
  const canvasRef = useRef(null);
  const type = normalizePetType(petType);
  const animate = !prefersReducedMotion;
  const canvasScale = type === "ghost" ? 2 : 1;
  const { frameMs, easing } = danceSettings[type];

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return undefined;
    context.imageSmoothingEnabled = false;
    context.setTransform(canvasScale, 0, 0, canvasScale, 0, 0);

    const draw = (frame) => {
      context.clearRect(0, 0, 48, 48);
      drawCompanionCharacter(context, frame, celebrationStage, type);
    };
    draw(0);
    if (!animate) return undefined;
    if (type === "ghost") {
      let startedAt = null;
      let requestId;
      const duration = frameMs * 12;
      const tick = (now) => {
        if (startedAt === null) startedAt = now;
        draw((((now - startedAt) % duration) / duration) * 12);
        requestId = window.requestAnimationFrame(tick);
      };
      requestId = window.requestAnimationFrame(tick);
      return () => window.cancelAnimationFrame(requestId);
    }
    let frame = 1;
    const interval = window.setInterval(() => {
      draw(frame);
      frame = (frame + 1) % 12;
    }, frameMs);
    return () => window.clearInterval(interval);
  }, [animate, canvasScale, frameMs, type]);

  return (
    <Box
      w={{ base: "96px", md: "112px" }}
      h={{ base: "96px", md: "112px" }}
      animation={animate ? `${dances[type]} ${frameMs * 12}ms ${easing} infinite` : undefined}
      transformOrigin="center 65%"
    >
      <canvas
        ref={canvasRef}
        width={48 * canvasScale}
        height={48 * canvasScale}
        role="img"
        aria-label={`${type} companion`}
        style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" }}
      />
    </Box>
  );
}
