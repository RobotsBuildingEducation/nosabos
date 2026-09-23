import React from "react";
import { Box } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const orbitSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const patreonLevitate = keyframes`
  0%, 100% { transform: translateY(3px) rotate(-4deg) scale(0.98); }
  45% { transform: translateY(-9px) rotate(3deg) scale(1.03); }
  72% { transform: translateY(-3px) rotate(0deg) scale(1); }
`;

const patreonAura = keyframes`
  0% { transform: rotate(0deg) scale(0.9); opacity: 0.42; }
  50% { transform: rotate(180deg) scale(1.08); opacity: 0.7; }
  100% { transform: rotate(360deg) scale(0.9); opacity: 0.42; }
`;

const patreonSpark = keyframes`
  0%, 100% { transform: translate3d(0, 5px, 0) scale(0.7); opacity: 0.25; }
  45% { transform: translate3d(0, -8px, 0) scale(1.2); opacity: 1; }
`;

const patreonShadowBreath = keyframes`
  0%, 100% { transform: translateX(-50%) scaleX(0.82); opacity: 0.28; }
  45% { transform: translateX(-50%) scaleX(1.12); opacity: 0.16; }
`;

export default function PatreonMotionMark({ isLightTheme = false }) {
  const logoPath =
    "M53 132 C38 116 39 88 42 66 C45 39 62 24 89 23 C115 22 137 35 138 56 C139 75 125 88 103 91 C87 93 82 106 76 122 C71 137 61 141 53 132 Z";
  const morphPaths = [
    logoPath,
    "M50 129 C36 112 42 82 46 61 C51 36 70 20 96 25 C120 29 139 42 134 63 C129 83 112 88 96 94 C82 99 83 114 73 128 C65 140 57 138 50 129 Z",
    "M56 134 C40 119 36 93 43 70 C50 44 63 26 87 22 C112 18 135 34 140 53 C145 72 129 87 105 90 C88 92 80 106 78 121 C76 136 64 142 56 134 Z",
    logoPath,
  ].join(";");

  return (
    <Box
      role="img"
      aria-label="Animated Patreon symbol"
      w={{ base: "190px", md: "220px" }}
      h={{ base: "190px", md: "220px" }}
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      isolation="isolate"
      sx={{
        "@media (prefers-reduced-motion: reduce)": {
          "& animate": { display: "none" },
        },
      }}
    >
      <Box
        position="absolute"
        inset="9%"
        borderRadius="43% 57% 64% 36% / 48% 37% 63% 52%"
        bg={
          isLightTheme
            ? "conic-gradient(from 20deg, rgba(255,92,138,0.3), rgba(255,184,76,0.22), rgba(123,97,255,0.28), rgba(255,92,138,0.3))"
            : "conic-gradient(from 20deg, rgba(255,105,180,0.36), rgba(255,184,76,0.2), rgba(123,97,255,0.4), rgba(255,105,180,0.36))"
        }
        filter="blur(18px)"
        animation={`${patreonAura} 11s linear infinite`}
      />
      <Box
        position="absolute"
        inset="18%"
        borderRadius="full"
        border="1px dashed"
        borderColor={
          isLightTheme ? "rgba(209,61,116,0.28)" : "rgba(255,116,170,0.38)"
        }
        animation={`${orbitSpin} 18s linear infinite reverse`}
      />
      <Box
        position="absolute"
        left="50%"
        bottom="15%"
        w="56px"
        h="11px"
        borderRadius="full"
        bg={isLightTheme ? "rgba(120,42,75,0.24)" : "rgba(0,0,0,0.46)"}
        filter="blur(9px)"
        animation={`${patreonShadowBreath} 5.2s ease-in-out infinite`}
      />

      <Box
        w="56%"
        h="56%"
        position="relative"
        zIndex={2}
        animation={`${patreonLevitate} 5.2s cubic-bezier(.45,.05,.35,1) infinite`}
        sx={{
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        <svg
          viewBox="0 0 180 180"
          width="100%"
          height="100%"
          aria-hidden="true"
          focusable="false"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient
              id="patreon-motion-gradient"
              x1="20%"
              y1="12%"
              x2="82%"
              y2="88%"
            >
              <stop offset="0%" stopColor="#ffb44c" />
              <stop offset="28%" stopColor="#ff5c8a" />
              <stop offset="62%" stopColor="#d83bd2" />
              <stop offset="100%" stopColor="#6e61ff" />
            </linearGradient>
            <linearGradient
              id="patreon-edge-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ff9e6d" stopOpacity="0.9" />
              <stop offset="52%" stopColor="#ff4f9a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7968ff" stopOpacity="0.85" />
            </linearGradient>
            <radialGradient id="patreon-shine" cx="36%" cy="25%" r="72%">
              <stop offset="0%" stopColor="white" stopOpacity="0.72" />
              <stop offset="32%" stopColor="white" stopOpacity="0.16" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <filter
              id="patreon-logo-shadow"
              x="-60%"
              y="-60%"
              width="220%"
              height="240%"
            >
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="8"
                floodColor="#8a286f"
                floodOpacity="0.35"
              />
            </filter>
          </defs>

          <g transform="translate(1.5, 8)">
            <path
              d={logoPath}
              fill="#781e75"
              opacity="0.72"
              transform="translate(3 6)"
            />
            <path
              d={logoPath}
              fill="url(#patreon-motion-gradient)"
              filter="url(#patreon-logo-shadow)"
            >
              <animate
                attributeName="d"
                dur="5.2s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;0.36;0.7;1"
                keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"
                values={morphPaths}
              />
            </path>
            <path
              d={logoPath}
              fill="url(#patreon-shine)"
              stroke="url(#patreon-edge-gradient)"
              strokeWidth="2"
              opacity="0.72"
            >
              <animate
                attributeName="d"
                dur="5.2s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;0.36;0.7;1"
                keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"
                values={morphPaths}
              />
            </path>
            <ellipse
              cx="79"
              cy="47"
              rx="22"
              ry="10"
              fill="white"
              opacity="0.16"
              transform="rotate(-18 79 47)"
            />
          </g>
        </svg>
      </Box>

      {[
        { top: "19%", left: "12%", size: "7px", delay: "0s", color: "#ffb44c" },
        {
          top: "12%",
          right: "16%",
          size: "5px",
          delay: "1.1s",
          color: "#ff74aa",
        },
        {
          bottom: "24%",
          right: "9%",
          size: "8px",
          delay: "2.2s",
          color: "#8b7cff",
        },
        {
          bottom: "13%",
          left: "21%",
          size: "4px",
          delay: "3.2s",
          color: "#ff5c8a",
        },
      ].map((spark, index) => (
        <Box
          key={index}
          position="absolute"
          top={spark.top}
          bottom={spark.bottom}
          left={spark.left}
          right={spark.right}
          w={spark.size}
          h={spark.size}
          borderRadius="full"
          bg={spark.color}
          boxShadow={`0 0 14px ${spark.color}`}
          animation={`${patreonSpark} 3.8s ${spark.delay} ease-in-out infinite`}
        />
      ))}
    </Box>
  );
}
