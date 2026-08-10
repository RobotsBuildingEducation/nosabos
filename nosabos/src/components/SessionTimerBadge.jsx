import { Box } from "@chakra-ui/react";
import { useSessionTimerRemaining } from "../provider/SessionTimerProvider";
import { useThemeStore } from "../useThemeStore";

export default function SessionTimerBadge({ durationSeconds, isRunning }) {
  const remaining = useSessionTimerRemaining();
  const themeMode = useThemeStore((s) => s.themeMode);
  const duration = Number(durationSeconds);

  if (remaining === null || !Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  const isLightTheme = themeMode === "light";
  const progress = Math.max(0, Math.min(100, (remaining / duration) * 100));

  return (
    <Box
      as="svg"
      position="absolute"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      width="46px"
      height="46px"
      viewBox="0 0 46 46"
      overflow="visible"
      pointerEvents="none"
      aria-hidden="true"
      zIndex={1}
    >
      <defs>
        <linearGradient
          id="sessionTimerProgressGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          gradientTransform="rotate(135 0.5 0.5)"
        >
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect
        x="1.75"
        y="1.75"
        width="42.5"
        height="42.5"
        rx="18.5"
        ry="18.5"
        fill="none"
        stroke={
          isLightTheme
            ? "rgba(120, 94, 61, 0.18)"
            : "rgba(255,255,255,0.08)"
        }
        strokeWidth="3.5"
      />
      <rect
        x="1.75"
        y="1.75"
        width="42.5"
        height="42.5"
        rx="18.5"
        ry="18.5"
        fill="none"
        stroke="url(#sessionTimerProgressGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={100 - progress}
        opacity={isRunning ? 1 : 0.62}
        style={{
          transition: "stroke-dashoffset 0.8s ease, opacity 0.2s ease",
        }}
      />
    </Box>
  );
}
