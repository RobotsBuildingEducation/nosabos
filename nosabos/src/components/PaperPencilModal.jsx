import React, { useCallback, useEffect, useRef } from "react";
import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import useSoundSettings from "../hooks/useSoundSettings";
import { submitActionSound } from "../constants/sounds";
import { useThemeStore } from "../useThemeStore";
import { t as tFn } from "../utils/translation";
import { PAPER_PENCIL_MODAL_TRANSLATIONS } from "../utils/paperPencilModalTranslations";
import {
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "../utils/modalMotion";

const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_SHADOW = "var(--app-shadow-soft)";

const pencilFloat = keyframes`
  0%, 100% {
    transform: translate(0px, 0px) rotate(0deg);
  }
  50% {
    transform: translate(-2px, -3.5px) rotate(-1.2deg);
  }
`;

const sparklePulse = keyframes`
  0%, 100% {
    opacity: 0.92;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.82);
  }
`;

function HeaderStationeryEmblem() {
  return (
    <Box
      w={{ base: "54px", md: "62px" }}
      h={{ base: "54px", md: "62px" }}
      borderRadius="20px"
      bg="rgba(255, 255, 255, 0.2)"
      border="1.5px solid rgba(255, 255, 255, 0.42)"
      boxShadow="0 6px 16px rgba(13, 148, 136, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.45)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      aria-hidden="true"
    >
      <Box as="svg" viewBox="0 0 64 64" w="42px" h="42px" overflow="visible">
        {/* Mini paper sheet */}
        <g transform="rotate(-6 30 34)">
          <rect
            x="14"
            y="12"
            width="30"
            height="38"
            rx="6"
            fill="#FFFDF9"
            stroke="#43354B"
            strokeWidth="2.4"
          />
          <line
            x1="20"
            y1="22"
            x2="38"
            y2="22"
            stroke="#99F6E4"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <line
            x1="20"
            y1="29"
            x2="36"
            y2="29"
            stroke="#BAE6FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="20"
            y1="36"
            x2="31"
            y2="36"
            stroke="#FDA4AF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>

        {/* Mini cute tilted pencil */}
        <g transform="rotate(32 39 32)">
          <rect
            x="35"
            y="12"
            width="8"
            height="24"
            rx="2"
            fill="#5EEAD4"
            stroke="#43354B"
            strokeWidth="2.2"
          />
          <rect
            x="35"
            y="7"
            width="8"
            height="6"
            rx="3"
            fill="#FDA4AF"
            stroke="#43354B"
            strokeWidth="2.2"
          />
          <line
            x1="35"
            y1="13"
            x2="43"
            y2="13"
            stroke="#FDE047"
            strokeWidth="2.6"
          />
          <polygon
            points="35,36 43,36 39,45"
            fill="#FDE68A"
            stroke="#43354B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <polygon points="37.4,41.5 40.6,41.5 39,45" fill="#43354B" />
        </g>

        {/* Sparkle */}
        <path
          d="M50 12 Q50 17 55 17 Q50 17 50 22 Q50 17 45 17 Q50 17 50 12 Z"
          fill="#FEF08A"
        />
        <circle cx="11" cy="20" r="2.2" fill="#FFFBEB" />
      </Box>
    </Box>
  );
}

function AnimePaperPencilIllustration({ isLightTheme }) {
  return (
    <Box
      position="relative"
      w="100%"
      borderRadius="22px"
      overflow="hidden"
      border="1.5px solid"
      borderColor={
        isLightTheme ? "rgba(20, 184, 166, 0.26)" : "rgba(45, 212, 191, 0.28)"
      }
      bg={
        isLightTheme
          ? "linear-gradient(145deg, #F0FDFA 0%, #FFFDF9 52%, #FFF1F2 100%)"
          : "linear-gradient(145deg, rgba(19, 42, 46, 0.95) 0%, rgba(30, 32, 48, 0.95) 55%, rgba(46, 29, 44, 0.92) 100%)"
      }
      boxShadow={
        isLightTheme
          ? "0 10px 26px rgba(13, 148, 136, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.9)"
          : "0 10px 26px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
      }
      px={{ base: 2, sm: 3 }}
      py={{ base: 2, sm: 2.5 }}
    >
      <Box
        as="svg"
        viewBox="0 0 340 196"
        w="100%"
        maxW="320px"
        h="auto"
        mx="auto"
        display="block"
        role="img"
        aria-label="Cute anime illustration of a notebook and pencil"
      >
        <defs>
          <linearGradient id="animeDeskPad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor={isLightTheme ? "#CCFBF1" : "#115E59"}
              stopOpacity={isLightTheme ? "0.85" : "0.55"}
            />
            <stop
              offset="100%"
              stopColor={isLightTheme ? "#FCE7F3" : "#4C1D95"}
              stopOpacity={isLightTheme ? "0.75" : "0.35"}
            />
          </linearGradient>

          <linearGradient id="animePaperFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="100%" stopColor="#FFF7ED" />
          </linearGradient>

          <linearGradient id="animeBackSheet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF1F2" />
            <stop offset="100%" stopColor="#FFE4E6" />
          </linearGradient>

          <linearGradient id="pencilBodyLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#99F6E4" />
            <stop offset="48%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>

          <linearGradient id="eraserCapFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FECDD3" />
            <stop offset="65%" stopColor="#FDA4AF" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>

          <linearGradient id="magicTrailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#5EEAD4" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0.85" />
          </linearGradient>

          <filter id="softAnimeShadow" x="-12%" y="-12%" width="124%" height="128%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="5"
              floodColor="#3B2745"
              floodOpacity={isLightTheme ? "0.14" : "0.36"}
            />
          </filter>
        </defs>

        {/* Soft ambient bokeh circles */}
        <circle
          cx="46"
          cy="38"
          r="22"
          fill={isLightTheme ? "#99F6E4" : "#2DD4BF"}
          opacity={isLightTheme ? "0.32" : "0.14"}
        />
        <circle
          cx="296"
          cy="44"
          r="26"
          fill={isLightTheme ? "#FBCFE8" : "#F472B6"}
          opacity={isLightTheme ? "0.35" : "0.14"}
        />
        <circle
          cx="284"
          cy="156"
          r="18"
          fill={isLightTheme ? "#FEF08A" : "#FACC15"}
          opacity={isLightTheme ? "0.38" : "0.14"}
        />

        {/* Cozy pastel desk mat cushion */}
        <ellipse
          cx="170"
          cy="146"
          rx="132"
          ry="36"
          fill="url(#animeDeskPad)"
        />
        <ellipse
          cx="170"
          cy="146"
          rx="124"
          ry="31"
          fill="none"
          stroke={isLightTheme ? "#5EEAD4" : "#2DD4BF"}
          strokeWidth="1.4"
          strokeDasharray="5 5"
          opacity="0.65"
        />

        {/* Floating sakura petals */}
        <path
          d="M42 74 C36 68, 44 60, 49 66 C54 60, 60 68, 53 74 C49 78, 45 78, 42 74 Z"
          fill="#FDA4AF"
          opacity="0.7"
          transform="rotate(-18 47 70) scale(0.75)"
        />
        <path
          d="M298 106 C292 100, 300 92, 305 98 C310 92, 316 100, 309 106 C305 110, 301 110, 298 106 Z"
          fill="#F9A8D4"
          opacity="0.68"
          transform="rotate(24 304 102) scale(0.68)"
        />

        {/* Underneath tilted sakura memo sheet */}
        <g transform="rotate(-9 156 102)" filter="url(#softAnimeShadow)">
          <rect
            x="78"
            y="32"
            width="136"
            height="136"
            rx="14"
            fill="url(#animeBackSheet)"
            stroke="#43354B"
            strokeWidth="2.4"
          />
          {/* Mint washi tape on top-left corner */}
          <g transform="rotate(-28 88 38)">
            <rect
              x="68"
              y="30"
              width="38"
              height="13"
              rx="3"
              fill="#99F6E4"
              stroke="#43354B"
              strokeWidth="1.8"
              opacity="0.92"
            />
            <line
              x1="76"
              y1="30"
              x2="72"
              y2="43"
              stroke="#14B8A6"
              strokeWidth="1.5"
              opacity="0.55"
            />
            <line
              x1="86"
              y1="30"
              x2="82"
              y2="43"
              stroke="#14B8A6"
              strokeWidth="1.5"
              opacity="0.55"
            />
            <line
              x1="96"
              y1="30"
              x2="92"
              y2="43"
              stroke="#14B8A6"
              strokeWidth="1.5"
              opacity="0.55"
            />
          </g>
        </g>

        {/* Main Open/Angled Cute Anime Notebook */}
        <g transform="rotate(-3 166 104)" filter="url(#softAnimeShadow)">
          {/* Teal bookmark ribbon peeking out bottom */}
          <path
            d="M182 158 L182 184 L191 177 L200 184 L200 158 Z"
            fill="#14B8A6"
            stroke="#43354B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M185 160 L185 179 L191 174" fill="#5EEAD4" opacity="0.6" />

          {/* Stacked bottom page thickness */}
          <rect
            x="92"
            y="26"
            width="148"
            height="142"
            rx="15"
            fill="#F3E8EE"
            stroke="#43354B"
            strokeWidth="2.5"
          />
          <rect
            x="88"
            y="21"
            width="148"
            height="142"
            rx="15"
            fill="url(#animePaperFill)"
            stroke="#43354B"
            strokeWidth="2.6"
          />

          {/* Cute side index tabs */}
          <path
            d="M236 44 H245 A5 5 0 0 1 250 49 V61 A5 5 0 0 1 245 66 H236 Z"
            fill="#5EEAD4"
            stroke="#43354B"
            strokeWidth="2.2"
          />
          <path
            d="M236 72 H244 A5 5 0 0 1 249 77 V89 A5 5 0 0 1 244 94 H236 Z"
            fill="#FDA4AF"
            stroke="#43354B"
            strokeWidth="2.2"
          />
          <path
            d="M236 100 H243 A5 5 0 0 1 248 105 V117 A5 5 0 0 1 243 122 H236 Z"
            fill="#FDE047"
            stroke="#43354B"
            strokeWidth="2.2"
          />

          {/* Pink vertical margin line */}
          <line
            x1="114"
            y1="23"
            x2="114"
            y2="161"
            stroke="#FECDD3"
            strokeWidth="1.8"
          />

          {/* Soft sky-teal ruled lines */}
          <line x1="92" y1="54" x2="232" y2="54" stroke="#BAE6FD" strokeWidth="1.5" />
          <line x1="92" y1="74" x2="232" y2="74" stroke="#BAE6FD" strokeWidth="1.5" />
          <line x1="92" y1="94" x2="232" y2="94" stroke="#BAE6FD" strokeWidth="1.5" />
          <line x1="92" y1="114" x2="232" y2="114" stroke="#BAE6FD" strokeWidth="1.5" />
          <line x1="92" y1="134" x2="232" y2="134" stroke="#BAE6FD" strokeWidth="1.5" />

          {/* Notebook header date pill & cute gold star sticker */}
          <rect
            x="122"
            y="34"
            width="46"
            height="11"
            rx="5.5"
            fill="#CCFBF1"
            stroke="#14B8A6"
            strokeWidth="1.4"
          />
          <circle
            cx="214"
            cy="39"
            r="10"
            fill="#FFE4E6"
            stroke="#FDA4AF"
            strokeWidth="1.5"
          />
          <path
            d="M214 32 L216.1 36.4 L220.9 37 L217.4 40.3 L218.3 45 L214 42.7 L209.7 45 L210.6 40.3 L207.1 37 L211.9 36.4 Z"
            fill="#FACC15"
            stroke="#43354B"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Highlighter pastel swatch on line 1 */}
          <rect
            x="121"
            y="62"
            width="68"
            height="9"
            rx="4.5"
            fill="#A7F3D0"
            opacity="0.7"
          />
          {/* Handwritten anime note squiggles */}
          <path
            d="M124 67 Q131 61 137 67 T150 67 T164 66 T182 67"
            fill="none"
            stroke="#0F766E"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="195" cy="66" r="2" fill="#0F766E" />

          {/* Line 2 notes */}
          <path
            d="M124 87 Q130 82 136 87 T149 87 M157 87 Q165 82 172 87 T188 86 T204 87"
            fill="none"
            stroke="#6D597A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Line 3 notes with pink underline accent */}
          <rect
            x="121"
            y="102"
            width="52"
            height="8"
            rx="4"
            fill="#FECDD3"
            opacity="0.65"
          />
          <path
            d="M124 106 Q132 101 139 106 T154 106 T168 106"
            fill="none"
            stroke="#43354B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Line 4 active writing line (where the pencil touches!) */}
          <path
            d="M124 126 Q133 120 141 126 T158 126 T175 125"
            fill="none"
            stroke="#0D9488"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Cute tiny kawaii cloud/sprout doodle at bottom-right of page */}
          <g transform="translate(198, 134)">
            <path
              d="M6 14 C2 14, 1 9, 5 8 C5 4, 11 3, 14 6 C17 3, 23 5, 22 9 C26 10, 25 14, 21 14 Z"
              fill="#E0F2FE"
              stroke="#43354B"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="1.1" fill="#43354B" />
            <circle cx="16" cy="10" r="1.1" fill="#43354B" />
            <ellipse cx="8" cy="11.4" rx="1.6" ry="0.9" fill="#FDA4AF" />
            <ellipse cx="18" cy="11.4" rx="1.6" ry="0.9" fill="#FDA4AF" />
            <path
              d="M12 11 Q13 12.4 14 11"
              fill="none"
              stroke="#43354B"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>

          {/* Twin-ring spiral binding along left edge */}
          {[38, 58, 78, 98, 118, 138].map((ry) => (
            <g key={ry}>
              <circle
                cx="97"
                cy={ry}
                r="3.2"
                fill="#E2E8F0"
                stroke="#43354B"
                strokeWidth="1.8"
              />
              <path
                d={`M 81 ${ry - 2.5} C 86 ${ry - 6}, 95 ${ry - 6}, 97 ${ry - 1.5}`}
                fill="none"
                stroke="#43354B"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <path
                d={`M 81 ${ry + 1.5} C 86 ${ry - 2}, 95 ${ry - 2}, 97 ${ry + 2}`}
                fill="none"
                stroke="#FDE68A"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>

        {/* Cute Kawaii Eraser Buddy on the left */}
        <g
          transform="translate(42, 118) rotate(-14)"
          filter="url(#softAnimeShadow)"
        >
          {/* White rubber top & bottom */}
          <rect
            x="0"
            y="0"
            width="38"
            height="48"
            rx="10"
            fill="#FFFDF9"
            stroke="#43354B"
            strokeWidth="2.4"
          />
          {/* Pastel teal & blush wrapper sleeve */}
          <rect
            x="0"
            y="13"
            width="38"
            height="28"
            rx="4"
            fill="#5EEAD4"
            stroke="#43354B"
            strokeWidth="2.4"
          />
          <rect x="2" y="15" width="34" height="6" fill="#CCFBF1" opacity="0.7" />
          {/* Cute kawaii face on the eraser */}
          <circle cx="13" cy="27" r="2.3" fill="#43354B" />
          <circle cx="12.3" cy="26.2" r="0.8" fill="#FFFFFF" />
          <circle cx="25" cy="27" r="2.3" fill="#43354B" />
          <circle cx="24.3" cy="26.2" r="0.8" fill="#FFFFFF" />
          <ellipse cx="9.2" cy="30.2" rx="2.8" ry="1.5" fill="#FDA4AF" />
          <ellipse cx="28.8" cy="30.2" rx="2.8" ry="1.5" fill="#FDA4AF" />
          <path
            d="M16.8 29.2 Q19 31.8 21.2 29.2"
            fill="none"
            stroke="#43354B"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>

        {/* Glowing magical writing trail from pencil tip */}
        <path
          d="M178 122 C194 114, 214 128, 232 110"
          fill="none"
          stroke="url(#magicTrailGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
        <circle cx="176" cy="122" r="6" fill="#5EEAD4" opacity="0.45" />

        {/* Animated Hero Cute Anime Pencil */}
        <Box
          as="g"
          sx={{
            transformOrigin: "210px 92px",
            "@media (prefers-reduced-motion: no-preference)": {
              animation: `${pencilFloat} 3.4s ease-in-out infinite`,
            },
          }}
        >
          <g
            transform="translate(176, 122) rotate(-52)"
            filter="url(#softAnimeShadow)"
          >
            {/* Graphite tip & wood cone at origin (0,0 is tip!) */}
            <polygon
              points="0,0 24,-12 24,12"
              fill="#FDE68A"
              stroke="#43354B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Warm wood shading on lower half of cone */}
            <polygon points="0,0 24,2 24,12" fill="#F59E0B" opacity="0.45" />
            {/* Graphite lead point */}
            <polygon
              points="0,0 9,-4.5 9,4.5"
              fill="#43354B"
              stroke="#43354B"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Tiny white anime specular dot on lead */}
            <circle cx="5.5" cy="-1.2" r="1.1" fill="#FFFFFF" />

            {/* Pencil Hexagonal Barrel (3 facets for cel-shaded anime look) */}
            <path
              d="M24,-12 C21,-8 21,-4 24,-4 C21,0 21,4 24,4 C21,8 21,12 24,12 L114,12 L114,-12 Z"
              fill="url(#pencilBodyLight)"
              stroke="#43354B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Top light facet */}
            <path d="M25,-10.5 L113,-10.5 L113,-4 L25,-4 Z" fill="#CCFBF1" opacity="0.65" />
            {/* Bottom shadow facet */}
            <path d="M25,4.5 L113,4.5 L113,10.5 L25,10.5 Z" fill="#0F766E" opacity="0.38" />
            {/* Facet dividing ink lines */}
            <line
              x1="24"
              y1="-4"
              x2="114"
              y2="-4"
              stroke="#43354B"
              strokeWidth="1.6"
              opacity="0.75"
            />
            <line
              x1="24"
              y1="4"
              x2="114"
              y2="4"
              stroke="#43354B"
              strokeWidth="1.6"
              opacity="0.75"
            />
            {/* Crisp white anime gloss highlight along top edge */}
            <line
              x1="32"
              y1="-8"
              x2="96"
              y2="-8"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* Cute little sakura heart printed on the pencil barrel */}
            <path
              d="M68 -1.5 C66.5 -3.5, 63.5 -2, 65 0.5 L68 3.2 L71 0.5 C72.5 -2, 69.5 -3.5, 68 -1.5 Z"
              fill="#FFE4E6"
              stroke="#43354B"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* Champagne-gold metallic ferrule */}
            <rect
              x="114"
              y="-12"
              width="16"
              height="24"
              rx="2"
              fill="#FDE047"
              stroke="#43354B"
              strokeWidth="2.5"
            />
            <rect x="115" y="4" width="14" height="6.5" fill="#F59E0B" opacity="0.45" />
            <line x1="119" y1="-11" x2="119" y2="11" stroke="#43354B" strokeWidth="1.5" />
            <line x1="125" y1="-11" x2="125" y2="11" stroke="#43354B" strokeWidth="1.5" />
            <line
              x1="116"
              y1="-7.5"
              x2="128"
              y2="-7.5"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Plump sakura-pink eraser cap */}
            <path
              d="M130,-12 H142 A10,10 0 0 1 152,-2 V2 A10,10 0 0 1 142,12 H130 Z"
              fill="url(#eraserCapFill)"
              stroke="#43354B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Glossy anime highlight bean on eraser cap */}
            <ellipse
              cx="141"
              cy="-6"
              rx="4.8"
              ry="2.2"
              fill="#FFFFFF"
              opacity="0.85"
            />
          </g>
        </Box>

        {/* Twinkling 4-point anime sparkles */}
        <Box
          as="g"
          sx={{
            transformOrigin: "68px 42px",
            "@media (prefers-reduced-motion: no-preference)": {
              animation: `${sparklePulse} 2.6s ease-in-out infinite`,
            },
          }}
        >
          <path
            d="M68 30 Q68 42 80 42 Q68 42 68 54 Q68 42 56 42 Q68 42 68 30 Z"
            fill="#FACC15"
            stroke="#43354B"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </Box>

        <Box
          as="g"
          sx={{
            transformOrigin: "282px 68px",
            "@media (prefers-reduced-motion: no-preference)": {
              animation: `${sparklePulse} 3.1s ease-in-out 0.8s infinite`,
            },
          }}
        >
          <path
            d="M282 58 Q282 68 292 68 Q282 68 282 78 Q282 68 272 68 Q282 68 282 58 Z"
            fill="#5EEAD4"
            stroke="#43354B"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </Box>

        <path
          d="M242 138 Q242 144 248 144 Q242 144 242 150 Q242 144 236 144 Q242 144 242 138 Z"
          fill="#FDA4AF"
        />
        <circle cx="94" cy="24" r="3" fill="#5EEAD4" />
        <circle cx="264" cy="34" r="2.5" fill="#FDE047" />
      </Box>
    </Box>
  );
}

export default function PaperPencilModal({
  isOpen,
  onClose,
  lang = "en",
  useSharedBackdrop = false,
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const modalBodyRef = useRef(null);

  const ui = useCallback(
    (key) => {
      const translated = tFn(lang, key);
      if (translated && translated !== key) return translated;
      return (
        PAPER_PENCIL_MODAL_TRANSLATIONS[lang]?.[key] ||
        PAPER_PENCIL_MODAL_TRANSLATIONS.en[key] ||
        key
      );
    },
    [lang],
  );

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return undefined;
    const frame = window.requestAnimationFrame(() => {
      const body = modalBodyRef.current;
      if (!body) return;
      body.scrollTop = 0;
      body.scrollLeft = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const deferPostAction = useCallback((task) => {
    if (typeof task !== "function") return;

    if (typeof window === "undefined") {
      task();
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        task();
      });
    });
  }, []);

  const handleUnderstood = useCallback(() => {
    onClose?.();
    deferPostAction(() => {
      void playSound(submitActionSound);
    });
  }, [deferPostAction, onClose, playSound]);

  const textPrimary = isLightTheme ? APP_TEXT_PRIMARY : "gray.100";
  const textSecondary = isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleUnderstood}
      isCentered
      size="lg"
      closeOnOverlayClick={true}
      closeOnEsc={true}
      motionPreset="none"
      returnFocusOnClose={false}
      autoFocus={false}
    >
      <ModalOverlay
        motionProps={nativeOverlayMotionProps}
        bg={useSharedBackdrop ? "transparent" : "var(--app-overlay)"}
      />
      <ModalContent
        motionProps={nativeModalMotionProps}
        bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
        color={textPrimary}
        border="1px solid"
        borderColor={isLightTheme ? APP_BORDER : "gray.700"}
        rounded="2xl"
        shadow={isLightTheme ? APP_SHADOW : "xl"}
        overflow="hidden"
        maxH="calc(100vh - 24px)"
        maxW={{ base: "90%", sm: "md" }}
        display="flex"
        flexDirection="column"
        sx={{
          borderRadius: {
            base: "24px !important",
            md: "72px !important",
          },
          "@supports (height: 100dvh)": {
            maxHeight: "calc(100dvh - 24px)",
          },
        }}
      >
        {/* Teal Header matching Install App & Proficiency Modals */}
        <Box
          className="app-modal-header"
          bgGradient="linear(to-r, teal.400, teal.500)"
          px={{ base: 4, md: 5 }}
          py={{ base: 3, md: 4 }}
          borderBottom="1px solid"
          borderColor={
            isLightTheme ? "rgba(20, 184, 166, 0.22)" : "transparent"
          }
          flexShrink={0}
          sx={{
            paddingInlineStart: {
              base: "16px !important",
              md: "48px !important",
            },
            paddingInlineEnd: {
              base: "16px !important",
              md: "48px !important",
            },
            paddingTop: {
              base: "14px !important",
              md: "28px !important",
            },
            paddingBottom: {
              base: "14px !important",
              md: "28px !important",
            },
          }}
        >
          <VStack spacing={{ base: 1.5, md: 2 }} align="center">
            <HeaderStationeryEmblem />
            <Text
              fontWeight="bold"
              fontSize={{ base: "md", md: "lg" }}
              textAlign="center"
              color="white"
              textShadow="0 1px 10px rgba(0,0,0,0.16)"
            >
              {ui("paper_pencil_title")}
            </Text>
            <Text
              fontSize={{ base: "2xs", md: "xs" }}
              fontWeight="medium"
              color="rgba(255,255,255,0.92)"
              textAlign="center"
              lineHeight="1.35"
              maxW="320px"
            >
              {ui("paper_pencil_subtitle")}
            </Text>
          </VStack>
        </Box>

        <ModalBody
          ref={modalBodyRef}
          px={{ base: 4, md: 5 }}
          py={{ base: 4, md: 5 }}
          minH={0}
          overflowY="auto"
          overscrollBehavior="contain"
          sx={{
            WebkitOverflowScrolling: "touch",
            paddingInlineStart: {
              base: "18px !important",
              md: "40px !important",
            },
            paddingInlineEnd: {
              base: "18px !important",
              md: "40px !important",
            },
            paddingTop: {
              base: "16px !important",
              md: "32px !important",
            },
            paddingBottom: {
              base: "18px !important",
              md: "36px !important",
            },
          }}
        >
          <VStack spacing={{ base: 3.5, md: 4 }} align="stretch">
            <AnimePaperPencilIllustration isLightTheme={isLightTheme} />

            <Text
              fontSize={{ base: "xs", sm: "sm" }}
              color={textPrimary}
              textAlign="center"
              lineHeight="1.55"
              fontWeight="medium"
              px={{ base: 1, md: 2 }}
            >
              {ui("paper_pencil_message")}
            </Text>

            <HStack
              spacing={2.5}
              align="center"
              justify="center"
              bg={isLightTheme ? "#F0FDFA" : "rgba(20, 184, 166, 0.12)"}
              border="1px solid"
              borderColor={
                isLightTheme
                  ? "rgba(20, 184, 166, 0.28)"
                  : "rgba(45, 212, 191, 0.25)"
              }
              borderRadius="16px"
              px={{ base: 3, md: 4 }}
              py={{ base: 2.5, md: 3 }}
            >
              <Text
                fontSize={{ base: "2xs", sm: "xs" }}
                color={isLightTheme ? "#0F766E" : "teal.200"}
                textAlign="center"
                lineHeight="1.45"
                fontWeight="semibold"
              >
                {ui("paper_pencil_tip")}
              </Text>
            </HStack>

            <Button
              w="100%"
              size="md"
              colorScheme="teal"
              bg="teal.500"
              color="white"
              onClick={handleUnderstood}
              fontWeight="bold"
              rounded="lg"
              p={{ base: 3, md: 8 }}
              minH={{ base: "44px", md: "40px" }}
              boxShadow="0 4px 0 var(--chakra-colors-teal-800, #1D4044)"
              _hover={{ bg: "teal.400" }}
              _active={{ boxShadow: "none", transform: "translateY(3px)" }}
            >
              {ui("paper_pencil_understood")}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
