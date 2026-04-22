// components/Conversations.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
  Wrap,
  Spinner,
  WrapItem,
  useDisclosure,
} from "@chakra-ui/react";
import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";
import { PiMicrophoneStageDuotone } from "react-icons/pi";
import {
  FaStop,
  FaCheckCircle,
  FaDice,
  FaRegCommentDots,
  FaExclamation,
} from "react-icons/fa";
import { MdOutlineTranslate } from "react-icons/md";
import { FiSettings } from "react-icons/fi";
import { RiVolumeUpLine } from "react-icons/ri";
import ConversationAccountDrawer from "./ConversationAccountDrawer";

import { doc, setDoc, getDoc, increment, updateDoc } from "firebase/firestore";
import {
  database,
  analytics,
  simplemodel,
} from "../firebaseResources/firebaseResources";
import { logEvent } from "firebase/analytics";

import useUserStore from "../hooks/useUserStore";
import VoiceOrb from "./VoiceOrb";
import {
  CHAT_LOG_HIGHLIGHT_DURATION_MS,
  getChatLogButtonHighlightProps,
  getRealtimeOrbVisualState,
} from "./realtimeArchiveStream";
import { translations } from "../utils/translation";
import { awardXp } from "../utils/utils";
import { getLanguageXp } from "../utils/progressTracking";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_GLOW,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";
import { DEFAULT_TTS_VOICE } from "../utils/tts";
import { getCEFRPromptHint } from "../utils/cefrUtils";
import {
  getRandomSkillTreeTopics,
  getRandomFallbackTopic,
} from "../data/conversationTopics";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import XpProgressHeader from "./XpProgressHeader";
import { useThemeStore } from "../useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  getLanguagePromptName,
  normalizeSupportLanguage,
} from "../constants/languages";

const REALTIME_MODEL =
  (import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";

const REALTIME_URL = `${
  import.meta.env.VITE_REALTIME_URL
}?model=gpt-realtime-mini/exchangeRealtimeSDP?model=${encodeURIComponent(
  REALTIME_MODEL,
)}`;

const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const TRANSLATE_MODEL =
  import.meta.env.VITE_OPENAI_TRANSLATE_MODEL || "gpt-5-nano";
const AUTO_DISCONNECT_MS = 15000;
const ARCHIVE_GLYPH_DURATION_MS = 680;
const ARCHIVE_GLYPH_DURATION_VARIANCE_MS = 150;
const ARCHIVE_ANIMATION_BUFFER_MS = 180;
const ARCHIVE_GLYPH_STREAM_SPREAD_MS = 180;
const ARCHIVE_GLYPH_STREAM_JITTER_MS = 22;
const ARCHIVE_INCOMING_HOLD_MS = 170;
const archiveLayoutCache = new Map();
let archiveMeasureContext = null;

/* ---------------------------
   Utils & helpers
--------------------------- */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const MOBILE_TEXT_SX = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "break-word",
  hyphens: "auto",
};
const MATRIX_PANEL_SX = {
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 20% 15%, rgba(30,64,175,0.12) 0%, transparent 42%), " +
    "radial-gradient(circle at 82% 25%, rgba(6,95,70,0.1) 0%, transparent 40%), " +
    "radial-gradient(circle at 50% 100%, rgba(15,23,42,0.52) 0%, transparent 62%), " +
    "linear-gradient(180deg, rgba(2,6,14,0.98) 0%, rgba(1,3,10,0.99) 100%)",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 1px, transparent 1px, transparent 28px), " +
      "repeating-linear-gradient(90deg, rgba(148,163,184,0.05) 0px, rgba(148,163,184,0.05) 1px, transparent 1px, transparent 28px)",
    opacity: 0.45,
    mixBlendMode: "screen",
    pointerEvents: "none",
  },
  "& > *": {
    position: "relative",
    zIndex: 1,
  },
};
const PAPER_PANEL_SX = {
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 18% 16%, rgba(172,142,110,0.12) 0%, transparent 42%), " +
    "radial-gradient(circle at 82% 20%, rgba(217,192,164,0.12) 0%, transparent 38%), " +
    "linear-gradient(180deg, rgba(255,249,242,0.98) 0%, rgba(248,241,232,0.98) 100%)",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(155,135,112,0.05) 0px, rgba(155,135,112,0.05) 1px, transparent 1px, transparent 28px), " +
      "repeating-linear-gradient(90deg, rgba(155,135,112,0.04) 0px, rgba(155,135,112,0.04) 1px, transparent 1px, transparent 28px)",
    opacity: 0.24,
    mixBlendMode: "multiply",
    pointerEvents: "none",
  },
  "& > *": {
    position: "relative",
    zIndex: 1,
  },
};
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_SHADOW = "var(--app-shadow-soft)";
const isoNow = () => {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
};

function rectToSnapshot(rect) {
  if (!rect) return null;
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function parsePx(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildCanvasFont(styles) {
  if (!styles) {
    return '400 16px "Helvetica Neue", Helvetica, Arial, sans-serif';
  }
  const fontStyle = styles.fontStyle || "normal";
  const fontVariant = styles.fontVariant || "normal";
  const fontWeight = styles.fontWeight || "400";
  const fontStretch = styles.fontStretch || "normal";
  const fontSize = styles.fontSize || "16px";
  const rawFamily =
    styles.fontFamily || '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const fontFamily = /system-ui/i.test(rawFamily)
    ? '"Helvetica Neue", Helvetica, Arial, sans-serif'
    : rawFamily;
  return [
    fontStyle,
    fontVariant,
    fontWeight,
    fontStretch,
    fontSize,
    fontFamily,
  ].join(" ");
}

function getArchiveLines(text, font, maxWidth, lineHeight) {
  const normalizedText = String(text || "");
  const safeWidth = Math.max(72, Math.ceil(maxWidth || 0));
  const safeLineHeight = Math.max(18, Math.round(lineHeight || 0));
  if (!normalizedText.trim()) return [];

  const cacheKey = `${font}__${safeWidth}__${safeLineHeight}__${normalizedText}`;
  const cached = archiveLayoutCache.get(cacheKey);
  if (cached) return cached;

  try {
    const prepared = prepareWithSegments(normalizedText, font, {
      whiteSpace: "pre-wrap",
    });
    const { lines } = layoutWithLines(prepared, safeWidth, safeLineHeight);
    const normalizedLines = lines
      .map((line) => ({
        text: line.text.replace(/\s+$/g, "") || line.text,
        width: Math.max(1, line.width),
      }))
      .filter((line) => line.text.length > 0);
    archiveLayoutCache.set(cacheKey, normalizedLines);
    return normalizedLines;
  } catch {
    const fallback = normalizedText
      .split("\n")
      .map((line) => ({ text: line, width: safeWidth }))
      .filter((line) => line.text.trim().length > 0);
    archiveLayoutCache.set(cacheKey, fallback);
    return fallback;
  }
}

function getArchiveMeasureContext() {
  if (typeof document === "undefined") return null;
  if (archiveMeasureContext) return archiveMeasureContext;
  const canvas = document.createElement("canvas");
  archiveMeasureContext = canvas.getContext("2d");
  return archiveMeasureContext;
}

function getArchiveGlyphs(text, font, maxWidth, lineHeight) {
  const cacheKey = `glyphs__${font}__${Math.ceil(maxWidth || 0)}__${Math.round(
    lineHeight || 0,
  )}__${String(text || "")}`;
  const cached = archiveLayoutCache.get(cacheKey);
  if (cached) return cached;

  const lines = getArchiveLines(text, font, maxWidth, lineHeight);
  const ctx = getArchiveMeasureContext();
  if (ctx) ctx.font = font;

  let glyphIndex = 0;
  const glyphs = lines.flatMap((line, lineIndex) => {
    const parts = line.text.split(/(\s+)/).filter(Boolean);
    let cursor = "";

    return parts.flatMap((part) => {
      const startX = ctx ? ctx.measureText(cursor).width : cursor.length * 8;
      cursor += part;
      const endX = ctx ? ctx.measureText(cursor).width : cursor.length * 8;
      if (!part.trim()) return [];

      const currentGlyph = {
        id: `${lineIndex}-${glyphIndex}`,
        glyph: part,
        index: glyphIndex,
        lineIndex,
        x: startX,
        y: lineIndex * lineHeight,
        width: Math.max(1, endX - startX),
      };
      glyphIndex += 1;
      return [currentGlyph];
    });
  });

  const result = {
    glyphs,
    height: Math.max(lines.length * lineHeight, lineHeight),
  };
  archiveLayoutCache.set(cacheKey, result);
  return result;
}

function archiveNoise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

function strongNpub(user) {
  return (
    user?.id ||
    user?.local_npub ||
    localStorage.getItem("local_npub") ||
    ""
  ).trim();
}

async function ensureUserDoc(npub, defaults = {}) {
  if (!npub) return false;
  try {
    const ref = doc(database, "users", npub);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(
        ref,
        {
          local_npub: npub,
          createdAt: isoNow(),
          onboarding: { completed: true },
          xp: 0,
          streak: 0,
          helpRequest: "",
          progress: {
            level: "beginner",
            supportLang: "en",
            voice: DEFAULT_TTS_VOICE,
            voicePersona: translations.en.onboarding_persona_default_example,
            targetLang: "es",
            showTranslations: true,
            helpRequest: "",
            pauseMs: 2000,
            practicePronunciation: false,
          },
          ...defaults,
        },
        { merge: true },
      );
    }
    return true;
  } catch {
    return false;
  }
}

function safeParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) {
    try {
      return JSON.parse(text.slice(s, e + 1));
    } catch {}
  }
  return null;
}

/* ---------------------------
   Phrase-highlighting helpers
--------------------------- */
const COLORS = [
  "#91E0FF",
  "#A0EBAF",
  "#FFD48A",
  "#C6B7FF",
  "#FF9FB1",
  "#B0F0FF",
];
const colorFor = (i) => COLORS[i % COLORS.length];

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  if (clean.length !== 6) {
    return `rgba(255,255,255,${alpha})`;
  }
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function splitByDelimiters(text) {
  if (!text) return [];
  const raw = String(text)
    .split(/[,;·•]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return raw.length ? raw : [String(text).trim()];
}

function tidyPairs(rawPairs) {
  if (!Array.isArray(rawPairs)) return [];
  const results = [];

  rawPairs.forEach((pair) => {
    const lhs = String(pair?.lhs || "").trim();
    const rhs = String(pair?.rhs || "").trim();
    if (!lhs || !rhs) return;

    if (lhs.length > 80 || rhs.length > 80) {
      const lhsParts = splitByDelimiters(lhs);
      const rhsParts = splitByDelimiters(rhs);
      if (lhsParts.length === rhsParts.length && lhsParts.length > 1) {
        lhsParts.forEach((segment, idx) => {
          const translated = rhsParts[idx] || "";
          if (segment && translated) {
            results.push({ lhs: segment, rhs: translated });
          }
        });
        return;
      }
    }

    results.push({ lhs, rhs });
  });

  return results.slice(0, 8);
}

function wrapFirst(text, phrase, tokenId) {
  if (!text || !phrase) return [text];
  const idx = text.toLowerCase().indexOf(String(phrase).toLowerCase());
  if (idx < 0) return [text];
  const before = text.slice(0, idx);
  const mid = text.slice(idx, idx + phrase.length);
  const after = text.slice(idx + phrase.length);
  return [
    before,
    <span
      key={`${tokenId}-${idx}`}
      data-token={tokenId}
      style={{ display: "inline", boxShadow: "inset 0 -2px transparent" }}
    >
      {mid}
    </span>,
    ...wrapFirst(after, phrase, tokenId + "_cont"),
  ];
}
function buildAlignedNodes(text, pairs, side /* 'lhs' | 'rhs' */) {
  if (!pairs?.length || !text) return [text];
  const sorted = [...pairs].sort(
    (a, b) => (b?.[side]?.length || 0) - (a?.[side]?.length || 0),
  );
  let nodes = [text];
  sorted.forEach((pair, i) => {
    const phrase = pair?.[side];
    if (!phrase) return;
    const tokenId = `tok_${i}`;
    const next = [];
    nodes.forEach((node) => {
      if (typeof node === "string")
        next.push(...wrapFirst(node, phrase, tokenId));
      else next.push(node);
    });
    nodes = next;
  });
  return nodes;
}

function AlignedBubble({
  primaryText,
  secondaryText,
  pairs,
  showSecondary,
  isTranslating,
  canReplay,
  onTranslate,
  canTranslate,
  onReplay,
  isReplaying,
  replayLabel,
  containerRef,
  primaryTextRef,
  contentOpacity = 1,
  contentTransform = "translateY(0px) scale(1)",
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const [activeId, setActiveId] = useState(null);
  function decorate(nodes) {
    return React.Children.map(nodes, (node) => {
      if (typeof node === "string" || !node?.props?.["data-token"]) return node;
      const rootId = node.props["data-token"].split("_")[0];
      const i = parseInt(rootId.replace("tok_", "")) || 0;
      const isActive = activeId === rootId;
      const style = {
        boxShadow: isActive
          ? `inset 0 -2px ${colorFor(i)}`
          : "inset 0 -2px transparent",
      };
      return React.cloneElement(node, {
        onMouseEnter: () => setActiveId(rootId),
        onMouseLeave: () => setActiveId(null),
        onClick: () => setActiveId(isActive ? null : rootId),
        style: { ...(node.props.style || {}), ...style },
      });
    });
  }
  const primaryNodes = decorate(buildAlignedNodes(primaryText, pairs, "lhs"));
  const secondaryNodes = decorate(
    buildAlignedNodes(secondaryText, pairs, "rhs"),
  );

  return (
    <Box
      ref={containerRef}
      bg={isLightTheme ? APP_SURFACE_ELEVATED : "transparent"}
      p={3}
      rounded="2xl"
      border="1px solid"
      borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.06)"}
      boxShadow={isLightTheme ? APP_SHADOW : "0 14px 28px rgba(0,0,0,0.35)"}
      maxW="100%"
      borderBottomLeftRadius="0px"
      sx={isLightTheme ? PAPER_PANEL_SX : MATRIX_PANEL_SX}
      color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.950"}
    >
      <Box
        opacity={contentOpacity}
        transform={contentTransform}
        transition="opacity 180ms ease, transform 180ms ease"
        willChange="opacity, transform"
        pointerEvents={contentOpacity < 0.5 ? "none" : "auto"}
      >
        <HStack align="flex-start" spacing={2}>
          {canReplay && (
            <IconButton
              size="xs"
              variant="ghost"
              colorScheme="cyan"
              icon={
                isReplaying ? (
                  <Spinner size="xs" />
                ) : (
                  <RiVolumeUpLine size={14} />
                )
              }
              onClick={onReplay}
              isDisabled={isReplaying}
              aria-label={replayLabel || "Replay"}
              mt="2px"
            />
          )}
          <Box
            ref={primaryTextRef}
            as="p"
            fontSize="md"
            lineHeight="1.6"
            color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.950"}
            sx={MOBILE_TEXT_SX}
            flex="1"
          >
            {primaryNodes}
          </Box>
        </HStack>

        {showSecondary && !!secondaryText && (
          <Box
            as="p"
            fontSize="xs"
            mt={1}
            lineHeight="1.55"
            color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
            sx={MOBILE_TEXT_SX}
            transition="opacity 120ms ease-out"
            opacity={1}
          >
            {secondaryNodes}
          </Box>
        )}

        {!!pairs?.length && showSecondary && (
          <Wrap spacing={3} mt={3} shouldWrapChildren>
            {pairs.slice(0, 8).map((p, i) => {
              const color = colorFor(i);
              return (
                <WrapItem key={`${p.lhs}-${p.rhs}-${i}`} maxW="100%">
                  <Box
                    px={3}
                    py={2.5}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={
                      isLightTheme
                        ? hexToRgba(color, 0.34)
                        : hexToRgba(color, 0.6)
                    }
                    background={isLightTheme ? APP_SURFACE : "#0b1220"}
                    boxShadow={
                      isLightTheme
                        ? "0 6px 16px rgba(120,94,61,0.06)"
                        : `0 6px 18px ${hexToRgba(color, 0.12)}`
                    }
                    color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.900"}
                    minW="0"
                    maxW="260px"
                  >
                    <Text fontSize="sm" fontWeight="semibold" lineHeight="1.4">
                      {p.lhs}
                    </Text>
                    <Text
                      fontSize="2xs"
                      color={
                        isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"
                      }
                      mt={1}
                      lineHeight="1.35"
                    >
                      {p.rhs}
                    </Text>
                  </Box>
                </WrapItem>
              );
            })}
          </Wrap>
        )}

        {canTranslate && (
          <HStack justify="flex-end" mt={2}>
            <IconButton
              size="xs"
              variant="ghost"
              colorScheme="cyan"
              icon={
                isTranslating ? <Spinner size="xs" /> : <MdOutlineTranslate />
              }
              onClick={onTranslate}
              isDisabled={isTranslating}
              aria-label="Translate message"
            />
          </HStack>
        )}
      </Box>
    </Box>
  );
}

/* ---------------------------
   Chat bubble wrappers
--------------------------- */
function RowLeft({ children }) {
  return (
    <HStack w="100%" justify="flex-start" align="flex-start">
      <Box maxW={["95%", "90%"]}>{children}</Box>
    </HStack>
  );
}
function RowRight({ children }) {
  return (
    <HStack w="100%" justify="flex-end" align="flex-start">
      <Box maxW={["95%", "90%"]}>{children}</Box>
    </HStack>
  );
}
function UserBubble({ label, text }) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  return (
    <Box
      bg={isLightTheme ? "rgba(108, 182, 191, 0.16)" : "blue.500"}
      color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
      p={3}
      rounded="lg"
      boxShadow={isLightTheme ? APP_SHADOW : "0 6px 20px rgba(0,0,0,0.25)"}
      border="1px solid"
      borderColor={
        isLightTheme
          ? "rgba(108, 182, 191, 0.22)"
          : "rgba(255,255,255,0.08)"
      }
    >
      <Box
        as="p"
        fontSize="md"
        lineHeight="1.6"
        color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
        sx={MOBILE_TEXT_SX}
      >
        {text}
      </Box>
    </Box>
  );
}

function ArchiveTextAnimation({ animation }) {
  if (!animation) return null;

  const { id, fromRect, targetRect, glyphs, font, lineHeight, color, height } =
    animation;
  const glyphCount = glyphs.length;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const textCenterX = fromRect.left + fromRect.width / 2;
  const textCenterY = fromRect.top + height / 2;
  const flowDx = targetCenterX - textCenterX;
  const flowDy = targetCenterY - textCenterY;
  const flowDistance = Math.hypot(flowDx, flowDy) || 1;
  const flowUnitX = flowDx / flowDistance;
  const flowUnitY = flowDy / flowDistance;
  const flowPerpX = -flowUnitY;
  const flowPerpY = flowUnitX;
  const maxDistance =
    glyphs.reduce((largest, glyph) => {
      const glyphCenterX = fromRect.left + glyph.x + glyph.width / 2;
      const glyphCenterY = fromRect.top + glyph.y + lineHeight / 2;
      const distance = Math.hypot(
        targetCenterX - glyphCenterX,
        targetCenterY - glyphCenterY,
      );
      return Math.max(largest, distance);
    }, 0) || 1;

  return (
    <Box
      position="fixed"
      inset={0}
      pointerEvents="none"
      zIndex={40}
      sx={{
        "@keyframes conversationArchiveGlyph": {
          "0%": {
            opacity: 1,
            offsetDistance: "0%",
            transform: "scale(1)",
            filter: "blur(0px)",
          },
          "100%": {
            opacity: 0,
            offsetDistance: "100%",
            transform: "scale(0.12, 0.22)",
            filter: "blur(6px)",
          },
        },
        "@keyframes conversationArchiveGlow": {
          "0%": {
            opacity: 0.35,
            transform: "scale(0.98)",
          },
          "100%": {
            opacity: 0,
            transform: "scale(0.52)",
          },
        },
      }}
    >
      <Box
        position="absolute"
        left={`${fromRect.left}px`}
        top={`${fromRect.top}px`}
        width={`${Math.max(fromRect.width, 1)}px`}
        height={`${Math.max(height, 1)}px`}
      >
        <Box
          position="absolute"
          inset={0}
          borderRadius="20px"
          bg="linear-gradient(135deg, rgba(103,232,249,0.22), rgba(56,189,248,0.06))"
          filter="blur(16px)"
          transformOrigin="center"
          animation={`conversationArchiveGlow ${
            ARCHIVE_GLYPH_DURATION_MS + 120
          }ms ease-out forwards`}
        />
        {glyphs.map((glyph) => {
          const glyphCenterX = fromRect.left + glyph.x + glyph.width / 2;
          const glyphCenterY = fromRect.top + glyph.y + lineHeight / 2;
          const endX = targetCenterX - glyphCenterX;
          const endY = targetCenterY - glyphCenterY;
          const distance = Math.hypot(endX, endY);
          const normalizedDistance = distance / maxDistance;
          const streamOrder =
            glyphCount > 1 ? glyph.index / (glyphCount - 1) : 0;
          const noiseA = archiveNoise(glyph.index + glyph.lineIndex * 31 + 1);
          const noiseB = archiveNoise(glyph.index * 1.37 + 17);
          const ribbonWidth = Math.min(fromRect.width * 0.16, 34);
          const ribbonOffset =
            (streamOrder - 0.5) * ribbonWidth + (noiseA - 0.5) * 8;
          const mergeWorldX =
            textCenterX + flowDx * 0.18 + flowPerpX * ribbonOffset * 0.55;
          const mergeWorldY =
            textCenterY +
            flowDy * 0.18 +
            flowPerpY * ribbonOffset * 0.22 -
            8 +
            (noiseB - 0.5) * 4;
          const pullWorldX =
            textCenterX + flowDx * 0.66 + flowPerpX * ribbonOffset * 0.18;
          const pullWorldY =
            textCenterY + flowDy * 0.66 + flowPerpY * ribbonOffset * 0.1 - 2;
          const cp1X = mergeWorldX - glyphCenterX;
          const cp1Y = mergeWorldY - glyphCenterY;
          const cp2X = pullWorldX - glyphCenterX;
          const cp2Y = pullWorldY - glyphCenterY;
          const duration = Math.round(
            ARCHIVE_GLYPH_DURATION_MS +
              normalizedDistance * ARCHIVE_GLYPH_DURATION_VARIANCE_MS,
          );
          const streamDelay = Math.max(
            0,
            Math.round(
              streamOrder * ARCHIVE_GLYPH_STREAM_SPREAD_MS +
                (noiseA - 0.5) * ARCHIVE_GLYPH_STREAM_JITTER_MS,
            ),
          );
          const motionPath = `path("M 0 0 C ${cp1X.toFixed(2)} ${cp1Y.toFixed(
            2,
          )}, ${cp2X.toFixed(2)} ${cp2Y.toFixed(2)}, ${endX.toFixed(
            2,
          )} ${endY.toFixed(2)}")`;

          return (
            <Box
              key={`${id}-${glyph.id}-${glyph.glyph}`}
              as="span"
              position="absolute"
              left={`${glyph.x}px`}
              top={`${glyph.y}px`}
              display="block"
              whiteSpace="pre"
              transformOrigin="center"
              letterSpacing="0.01em"
              color={color}
              textShadow="0 0 18px rgba(34,211,238,0.32)"
              style={{
                font,
                lineHeight: `${lineHeight}px`,
                offsetPath: motionPath,
                WebkitOffsetPath: motionPath,
                offsetRotate: "0deg",
                WebkitOffsetRotate: "0deg",
                offsetDistance: "0%",
                WebkitOffsetDistance: "0%",
              }}
              sx={{
                animation: `conversationArchiveGlyph ${duration}ms cubic-bezier(0.12, 0.86, 0.24, 1) ${streamDelay}ms both`,
                willChange: "offset-distance, transform, opacity, filter",
              }}
            >
              {glyph.glyph}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function uiStateLabel(uiState, uiLang) {
  const lang = normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE);
  if (uiState === "speaking")
    return lang === "ja"
      ? "話しています"
      : lang === "fr"
      ? "Parle"
      : lang === "es"
      ? "Hablando"
      : lang === "it"
      ? "Parlando"
      : "Speaking";
  if (uiState === "listening")
    return lang === "ja"
      ? "聞き取り中"
      : lang === "fr"
      ? "Ecoute"
      : lang === "es"
      ? "Escuchando"
      : lang === "it"
        ? "Ascoltando"
        : "Listening";
  if (uiState === "thinking")
    return lang === "ja"
      ? "考え中"
      : lang === "fr"
      ? "Reflechit"
      : lang === "es"
      ? "Pensando"
      : lang === "it"
      ? "Pensando"
      : "Thinking";
  return "";
}

/* ---------------------------
   IndexedDB audio cache (per message)
--------------------------- */
const IDB_DB = "RBE-AudioCache";
const IDB_STORE = "clips";

function openIDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window))
      return reject(new Error("IndexedDB not supported"));
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB open failed"));
  });
}
async function idbPutClip(id, blob, meta = {}) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IDB put failed"));
    tx.objectStore(IDB_STORE).put({
      id,
      blob,
      createdAt: Date.now(),
      bytes: blob?.size || 0,
      ...meta,
    });
  });
}
async function idbGetClip(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    tx.onerror = () => reject(tx.error || new Error("IDB get failed"));
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error("IDB get failed"));
  });
}

/* ---------------------------
   Component
--------------------------- */
export default function Conversations({
  activeNpub = "",
  targetLang = "es",
  supportLang = "en",
  pauseMs: initialPauseMs = 2000,
  maxProficiencyLevel = "A1",
}) {
  const aliveRef = useRef(false);
  const autoStopTimerRef = useRef(null);
  const playSound = useSoundSettings((s) => s.playSound);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";

  // User id
  const user = useUserStore((s) => s.user);
  const currentNpub = activeNpub?.trim?.() || strongNpub(user);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // Refs for realtime
  const audioRef = useRef(null);
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const dcRef = useRef(null);

  // WebAudio capture graph
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const floatBufRef = useRef(null);
  const captureOutRef = useRef(null);
  const audioGraphReadyRef = useRef(false);

  // Cached-clip index
  const audioCacheIndexRef = useRef(new Set());

  // Replay capture maps
  const recMapRef = useRef(new Map());
  const recChunksRef = useRef(new Map());
  const recTailRef = useRef(new Map());
  const replayRidSetRef = useRef(new Set());
  const replayAudioRef = useRef(null);

  // Idle gating
  const isIdleRef = useRef(true);
  const idleWaitersRef = useRef([]);
  const assistantInputLockedRef = useRef(false);

  // Track when current response started (for proper user message ordering)
  const responseStartTimeRef = useRef(null);

  // Connection/UI state
  const [status, setStatus] = useState("disconnected");
  const [err, setErr] = useState("");
  const [uiState, setUiState] = useState("idle");
  const [volume] = useState(0);
  const [mood, setMood] = useState("neutral");
  const [pauseMs, setPauseMs] = useState(initialPauseMs);
  const [replayingId, setReplayingId] = useState(null);
  const [translatingMessageId, setTranslatingMessageId] = useState(null);

  // Learning prefs
  const [voice, setVoice] = useState(user?.progress?.voice || "alloy");
  const [voicePersona, setVoicePersona] = useState(
    user?.progress?.voicePersona ||
      translations.en.onboarding_persona_default_example,
  );
  const [showTranslations, setShowTranslations] = useState(
    user?.progress?.showTranslations !== false,
  );

  // Conversation settings state
  const [conversationSettings, setConversationSettings] = useState({
    proficiencyLevel: maxProficiencyLevel || "A1",
    practicePronunciation: user?.progress?.practicePronunciation || false,
    conversationSubjects: user?.progress?.conversationSubjects || "",
  });
  const conversationSettingsRef = useRef(conversationSettings);
  const conversationSubjectsDraftRef = useRef(null);
  const conversationSubjectsClearTimerRef = useRef(null);

  // Settings drawer
  const {
    isOpen: isSettingsOpen,
    onOpen: openSettings,
    onClose: closeSettings,
  } = useDisclosure();
  const {
    isOpen: isTranscriptOpen,
    onOpen: openTranscript,
    onClose: closeTranscript,
  } = useDisclosure();
  const handleSettingsOpen = useCallback(() => {
    playSound(selectSound);
    openSettings();
  }, [openSettings, playSound]);
  const scrollConversationToTop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // Live refs
  const voiceRef = useRef(voice);
  const voicePersonaRef = useRef(voicePersona);
  const targetLangRef = useRef(targetLang);
  const supportLangRef = useRef(supportLang);
  const pauseMsRef = useRef(pauseMs);

  // Hydrate refs on changes
  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);
  useEffect(() => {
    voicePersonaRef.current = voicePersona;
  }, [voicePersona]);
  useEffect(() => {
    targetLangRef.current = targetLang;
  }, [targetLang]);
  useEffect(() => {
    supportLangRef.current = supportLang;
  }, [supportLang]);
  useEffect(() => {
    pauseMsRef.current = pauseMs;
  }, [pauseMs]);

  // Keep conversation settings ref updated
  useEffect(() => {
    conversationSettingsRef.current = conversationSettings;
  }, [conversationSettings]);

  // Track if we should regenerate goal after settings change
  const shouldRegenerateGoalRef = useRef(false);

  // Handle settings change with Firebase persistence
  const handleSettingsChange = useCallback(
    async (newSettings) => {
      const previousSettings = conversationSettingsRef.current;
      const subjectsChanged =
        previousSettings.conversationSubjects !==
        newSettings.conversationSubjects;
      if (subjectsChanged) {
        clearTimeout(conversationSubjectsClearTimerRef.current);
        conversationSubjectsDraftRef.current = newSettings.conversationSubjects;
      }
      setConversationSettings(newSettings);

      // Persist to Firebase
      if (currentNpub) {
        try {
          await updateDoc(doc(database, "users", currentNpub), {
            "progress.conversationProficiencyLevel":
              newSettings.proficiencyLevel,
            "progress.practicePronunciation": newSettings.practicePronunciation,
            "progress.conversationSubjects": newSettings.conversationSubjects,
          });
        } catch (e) {
          console.error("Failed to save conversation settings:", e);
        }
      }
      if (subjectsChanged) {
        clearTimeout(conversationSubjectsClearTimerRef.current);
        conversationSubjectsClearTimerRef.current = setTimeout(() => {
          if (
            conversationSubjectsDraftRef.current ===
            newSettings.conversationSubjects
          ) {
            conversationSubjectsDraftRef.current = null;
          }
        }, 6000);
      }

      // Mark for goal regeneration if proficiency level or subjects changed
      if (
        previousSettings.proficiencyLevel !== newSettings.proficiencyLevel ||
        previousSettings.conversationSubjects !==
          newSettings.conversationSubjects
      ) {
        shouldRegenerateGoalRef.current = true;
      }
    },
    [currentNpub],
  );

  // Regenerate goal when settings drawer closes (if settings changed)
  const handleSettingsClose = useCallback(() => {
    closeSettings();
    scrollConversationToTop();
    if (shouldRegenerateGoalRef.current) {
      shouldRegenerateGoalRef.current = false;
      // Small delay to let state update
      setTimeout(() => {
        generateConversationTopic();
      }, 150);
    }
  }, [closeSettings, scrollConversationToTop]);

  // XP
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  // Goal system - initialize with fallback, then generate AI topic
  const [currentGoal, setCurrentGoal] = useState(() => ({
    text: getRandomFallbackTopic(maxProficiencyLevel),
    completed: false,
  }));
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [goalFeedback, setGoalFeedback] = useState("");
  const goalCheckPendingRef = useRef(false);
  const lastUserMessageRef = useRef("");
  const hasGeneratedInitialTopic = useRef(false);
  const streamingRef = useRef(false);

  // Generate a conversation topic using AI with streaming
  async function generateConversationTopic() {
    // Prevent multiple simultaneous calls
    if (streamingRef.current || isGeneratingGoal) return;

    setIsGeneratingGoal(true);
    setGoalFeedback("");
    setStreamingText("");
    streamingRef.current = true;

    // Determine the language for the response
    const responseLang =
      getLanguagePromptName(
        normalizeSupportLanguage(supportLang, DEFAULT_SUPPORT_LANGUAGE),
      ) || "English";

    // Get current settings from ref (for use in async context)
    const currentSettings = conversationSettingsRef.current;
    const selectedLevel =
      currentSettings.proficiencyLevel || maxProficiencyLevel || "A1";
    const customSubjects = currentSettings.conversationSubjects || "";

    try {
      // Get skill tree topics for context
      const skillTreeTopics = getRandomSkillTreeTopics(
        selectedLevel,
        targetLang,
        15,
      );

      const levelDescription =
        selectedLevel === "Pre-A1"
          ? "foundations - use only the most basic words and single-word responses"
          : selectedLevel === "A1"
            ? "absolute beginner - use very simple vocabulary and short sentences"
            : selectedLevel === "A2"
              ? "elementary - use simple everyday topics and basic sentences"
              : selectedLevel === "B1"
                ? "intermediate - discuss experiences, opinions, and plans"
                : selectedLevel === "B2"
                  ? "upper intermediate - handle complex and abstract topics"
                  : selectedLevel === "C1"
                    ? "advanced - use sophisticated vocabulary concisely"
                    : "mastery - use nuanced vocabulary concisely";

      // Build custom subjects prompt if user has defined subjects
      const customSubjectsPrompt = customSubjects
        ? `\n\nIMPORTANT: The user has specified they want to practice these specific topics/contexts:\n"${customSubjects}"\nPrioritize generating topics related to these interests when possible.`
        : "";

      const prompt = `You are creating a conversation practice topic for a ${selectedLevel} level language learner (${levelDescription}).

Here are some topics from their learning curriculum that you can reference or be inspired by:
${skillTreeTopics.join("\n")}${customSubjectsPrompt}

Generate ONE clear, specific conversation topic that:
1. Is appropriate for ${selectedLevel} level complexity
2. Encourages the learner to speak and practice
3. Can be either based on the curriculum topics above, the user's custom interests, OR a creative topic you think would be engaging
4. Is specific enough to guide the conversation (not generic like "practice speaking")
5. Is CONCISE: Maximum 10-15 words. For advanced levels (C1/C2), use sophisticated vocabulary, NOT longer sentences.

Examples of good topics:
- "Describe your morning routine" (A1)
- "Explain your favorite hobby and why" (B1)
- "Debate the ethics of AI in healthcare" (C2)
- "Discuss cultural nuances in business etiquette" (C2)

BAD examples (too verbose): "Analyze the socio-economic implications of modern consumer culture..."

Respond with ONLY the topic text in ${responseLang}. No quotes, no JSON, no explanation - just the topic itself (max 15 words).`;

      // Use Gemini streaming for real-time feedback
      const result = await simplemodel.generateContentStream(prompt);

      let fullText = "";

      for await (const chunk of result.stream) {
        if (!streamingRef.current) break;

        const chunkText = typeof chunk.text === "function" ? chunk.text() : "";

        if (!chunkText) continue;

        fullText += chunkText;
        setStreamingText(fullText);
      }

      // Use the streamed text directly as the topic
      const topicText = fullText.trim();
      if (topicText) {
        setCurrentGoal({
          text: { en: topicText, es: topicText, it: topicText, fr: topicText },
          completed: false,
        });
      } else {
        // Use fallback if empty
        setCurrentGoal({
          text: getRandomFallbackTopic(selectedLevel),
          completed: false,
        });
      }
    } catch (e) {
      console.error("Topic generation error:", e);
      // Use fallback on error
      const selectedLevel =
        conversationSettingsRef.current.proficiencyLevel ||
        maxProficiencyLevel ||
        "A1";
      setCurrentGoal({
        text: getRandomFallbackTopic(selectedLevel),
        completed: false,
      });
    } finally {
      streamingRef.current = false;
      setStreamingText("");
      setIsGeneratingGoal(false);
    }
  }

  // Generate initial topic on mount
  useEffect(() => {
    if (!hasGeneratedInitialTopic.current) {
      hasGeneratedInitialTopic.current = true;
      generateConversationTopic();
    }
  }, []);

  // Handler to get a new AI-generated topic
  const handleShuffleTopic = () => {
    generateConversationTopic();
  };

  // Turn counter for XP awarding
  const turnCountRef = useRef(0);

  // Messages
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Stream buffers
  const streamBuffersRef = useRef(new Map());
  const streamFlushScheduled = useRef(false);

  // Response mapping
  const respToMsg = useRef(new Map());
  const sessionUpdateTimer = useRef(null);
  const lastTranscriptRef = useRef({ text: "", ts: 0 });

  // UI strings
  const storedUiLang = (() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("appLanguage") || "";
    } catch {
      return "";
    }
  })();

  const resolvedSupportLang =
    normalizeSupportLanguage(supportLangRef.current || supportLang, "") ||
    normalizeSupportLanguage(user?.progress?.supportLang, "") ||
    normalizeSupportLanguage(storedUiLang, DEFAULT_SUPPORT_LANGUAGE) ||
    DEFAULT_SUPPORT_LANGUAGE;

  const uiLang = resolvedSupportLang;
  const ui = translations[uiLang] || translations.en;
  const uiText = (key, fallback = "") =>
    ui?.[key] || translations.en?.[key] || fallback;
  const liveUiState =
    status === "connected" && uiState !== "speaking" && uiState !== "thinking"
      ? "listening"
      : uiState;
  const [displayRobotState, setDisplayRobotState] = useState(liveUiState);
  const [previousRobotState, setPreviousRobotState] = useState(null);
  const [isRobotTransitioning, setIsRobotTransitioning] = useState(false);
  const displayOrbState = getRealtimeOrbVisualState(displayRobotState);
  const previousOrbState = getRealtimeOrbVisualState(previousRobotState);

  useEffect(() => {
    if (liveUiState === displayRobotState) return;
    setPreviousRobotState(displayRobotState);
    setDisplayRobotState(liveUiState);
    setIsRobotTransitioning(true);
    const timer = setTimeout(() => {
      setIsRobotTransitioning(false);
      setPreviousRobotState(null);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [liveUiState, displayRobotState]);

  // XP level calculation
  const xpLevelNumber = Math.floor(xp / 100) + 1;
  const progressPct = xp % 100;

  // Timeline sorted by timestamp (newest-first for display)
  const timeline = [...messages].sort((a, b) => b.ts - a.ts);
  const latestAssistantMessage = timeline.find((m) => {
    if (m.role !== "assistant") return false;
    const text = `${m.textFinal || ""}${m.textStream || ""}`.trim();
    return Boolean(text);
  });
  const previousAssistantIdRef = useRef(null);
  const liveBubbleSurfaceRef = useRef(null);
  const liveBubbleTextRef = useRef(null);
  const liveBubbleSnapshotRef = useRef(null);
  const chatLogButtonRef = useRef(null);
  const incomingRevealTimerRef = useRef(null);
  const chatLogHighlightTimerRef = useRef(null);
  const [archiveAnimation, setArchiveAnimation] = useState(null);
  const [isChatLogHighlighted, setIsChatLogHighlighted] = useState(false);
  const [hiddenIncomingMessageId, setHiddenIncomingMessageId] = useState(null);
  const chatLogButtonHighlightProps =
    getChatLogButtonHighlightProps(isChatLogHighlighted, isLightTheme);
  const shouldMuteIncomingBubble =
    hiddenIncomingMessageId != null &&
    latestAssistantMessage?.id === hiddenIncomingMessageId;

  const captureLiveBubbleSnapshot = useCallback(() => {
    if (typeof window === "undefined") return;
    const surfaceNode = liveBubbleSurfaceRef.current;
    const textNode = liveBubbleTextRef.current;
    if (
      !(surfaceNode instanceof HTMLElement) ||
      !(textNode instanceof HTMLElement)
    )
      return;

    const surfaceRect = rectToSnapshot(surfaceNode.getBoundingClientRect());
    const textRect = rectToSnapshot(textNode.getBoundingClientRect());
    if (!surfaceRect?.width || !surfaceRect?.height) return;
    if (!textRect?.width || !textRect?.height) return;

    const styles = window.getComputedStyle(textNode);
    const fallbackLineHeight = parsePx(styles.fontSize, 16) * 1.6;
    liveBubbleSnapshotRef.current = {
      surfaceRect,
      textRect,
      font: buildCanvasFont(styles),
      lineHeight: parsePx(styles.lineHeight, fallbackLineHeight),
      color: styles.color || "#F7FAFC",
    };
  }, []);

  useLayoutEffect(() => {
    if (!latestAssistantMessage?.id) return;
    const nextId = latestAssistantMessage.id;
    const prevId = previousAssistantIdRef.current;
    previousAssistantIdRef.current = nextId;
    if (!prevId || prevId === nextId) return;

    const previousMessage = messages.find((m) => m.id === prevId);
    const snapshot = liveBubbleSnapshotRef.current;
    const targetNode = chatLogButtonRef.current;
    const outgoingText = `${previousMessage?.textFinal || ""}${
      previousMessage?.textStream || ""
    }`.trim();

    if (!previousMessage || !snapshot || !outgoingText) return;
    if (!(targetNode instanceof HTMLElement)) return;

    const targetRect = rectToSnapshot(targetNode.getBoundingClientRect());
    if (!targetRect?.width || !targetRect?.height) return;

    const { glyphs, height } = getArchiveGlyphs(
      outgoingText,
      snapshot.font,
      snapshot.textRect.width,
      snapshot.lineHeight,
    );
    if (!glyphs.length) return;

    const animationId = uid();
    setHiddenIncomingMessageId(nextId);
    if (incomingRevealTimerRef.current) {
      window.clearTimeout(incomingRevealTimerRef.current);
      incomingRevealTimerRef.current = null;
    }
    incomingRevealTimerRef.current = window.setTimeout(() => {
      setHiddenIncomingMessageId((current) =>
        current === nextId ? null : current,
      );
      incomingRevealTimerRef.current = null;
    }, ARCHIVE_INCOMING_HOLD_MS);
    setArchiveAnimation({
      id: animationId,
      fromRect: snapshot.textRect,
      targetRect,
      glyphs,
      height,
      font: snapshot.font,
      lineHeight: snapshot.lineHeight,
      color: snapshot.color,
    });

    const totalDuration =
      ARCHIVE_GLYPH_DURATION_MS +
      ARCHIVE_GLYPH_DURATION_VARIANCE_MS +
      ARCHIVE_GLYPH_STREAM_SPREAD_MS +
      ARCHIVE_GLYPH_STREAM_JITTER_MS +
      ARCHIVE_ANIMATION_BUFFER_MS;
    setIsChatLogHighlighted(true);
    if (chatLogHighlightTimerRef.current) {
      window.clearTimeout(chatLogHighlightTimerRef.current);
      chatLogHighlightTimerRef.current = null;
    }
    chatLogHighlightTimerRef.current = window.setTimeout(
      () => {
        setIsChatLogHighlighted(false);
        chatLogHighlightTimerRef.current = null;
      },
      Math.max(totalDuration, CHAT_LOG_HIGHLIGHT_DURATION_MS),
    );
    const timer = window.setTimeout(() => {
      setArchiveAnimation((current) =>
        current?.id === animationId ? null : current,
      );
    }, totalDuration);

    return () => window.clearTimeout(timer);
  }, [latestAssistantMessage?.id, messages]);

  useLayoutEffect(() => {
    captureLiveBubbleSnapshot();
  }, [
    captureLiveBubbleSnapshot,
    latestAssistantMessage?.id,
    latestAssistantMessage?.textFinal,
    latestAssistantMessage?.textStream,
    showTranslations,
    replayingId,
    translatingMessageId,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleViewportChange = () => captureLiveBubbleSnapshot();

    handleViewportChange();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, { passive: true });

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange);
    };
  }, [captureLiveBubbleSnapshot]);

  useEffect(
    () => () => {
      if (incomingRevealTimerRef.current) {
        window.clearTimeout(incomingRevealTimerRef.current);
      }
      if (chatLogHighlightTimerRef.current) {
        window.clearTimeout(chatLogHighlightTimerRef.current);
      }
    },
    [],
  );

  /* ---------------------------
     Replay playback helpers
  --------------------------- */
  function stopReplayAudio() {
    try {
      if (replayAudioRef.current) {
        replayAudioRef.current.pause();
        replayAudioRef.current.src = "";
        replayAudioRef.current = null;
      }
    } catch {}
  }

  async function playSavedClip(mid) {
    if (replayingId === mid) {
      stopReplayAudio();
      setReplayingId(null);
      return;
    }
    stopReplayAudio();
    setReplayingId(mid);
    try {
      const cached = await idbGetClip(mid);
      if (!cached?.blob) {
        setReplayingId(null);
        return;
      }
      const url = URL.createObjectURL(cached.blob);
      const audio = new Audio(url);
      replayAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setReplayingId(null);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setReplayingId(null);
      };
      await audio.play();
    } catch {
      setReplayingId(null);
    }
  }

  /* ---------------------------
     Recording helpers
  --------------------------- */
  function startRecordingForRid(rid, mid) {
    if (!captureOutRef.current || !audioGraphReadyRef.current) return;
    try {
      const dest = captureOutRef.current;
      const recorder = new MediaRecorder(dest.stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        if (!chunks.length) return;
        const blob = new Blob(chunks, { type: "audio/webm" });
        try {
          await idbPutClip(mid, blob, { rid });
          audioCacheIndexRef.current.add(mid);
          updateMessage(mid, (m) => ({ ...m, hasAudio: true }));
        } catch {}
      };
      recorder.start();
      recMapRef.current.set(rid, recorder);
      recChunksRef.current.set(rid, chunks);
    } catch {}
  }

  function getRMS() {
    const analyser = analyserRef.current;
    const buf = floatBufRef.current;
    if (!analyser || !buf) return 0;
    if (analyser.getFloatTimeDomainData) {
      analyser.getFloatTimeDomainData(buf);
    } else {
      const tmp = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(tmp);
      for (let i = 0; i < tmp.length; i++) buf[i] = (tmp[i] - 128) / 128;
    }
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / buf.length);
  }

  function stopRecorderAfterTail(
    rid,
    opts = { quietMs: 900, maxMs: 20000, armThresh: 0.006, minActiveMs: 900 },
  ) {
    if (recTailRef.current.has(rid)) return;
    const { quietMs, maxMs, armThresh, minActiveMs } = opts;
    const startedAt = Date.now();
    let armed = false;
    let firstVoiceAt = 0;
    let lastLoudAt = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const rms = getRMS();
      if (rms >= armThresh) {
        if (!armed) {
          armed = true;
          firstVoiceAt = now;
        }
        lastLoudAt = now;
      }
      const longEnoughSinceVoice = armed && now - firstVoiceAt >= minActiveMs;
      const quietLongEnough = armed && now - lastLoudAt >= quietMs;
      const timedOut = now - startedAt >= maxMs;
      if ((longEnoughSinceVoice && quietLongEnough) || timedOut) {
        clearInterval(id);
        recTailRef.current.delete(rid);
        const rec = recMapRef.current.get(rid);
        if (rec?.state === "recording") rec.stop();
        recMapRef.current.delete(rid);
        recChunksRef.current.delete(rid);
      }
    }, 100);
    recTailRef.current.set(rid, id);
  }

  /* ---------------------------
     Load user XP on mount
  --------------------------- */
  useEffect(() => {
    async function loadXp() {
      if (!currentNpub) return;
      try {
        await ensureUserDoc(currentNpub);
        const snap = await getDoc(doc(database, "users", currentNpub));
        if (snap.exists()) {
          const data = snap.data() || {};
          const languageXp = getLanguageXp(data?.progress || {}, targetLang);
          if (Number.isFinite(languageXp)) setXp(languageXp);
          if (data.progress?.voice) setVoice(data.progress.voice);
          if (data.progress?.voicePersona)
            setVoicePersona(data.progress.voicePersona);
          if (typeof data.progress?.showTranslations === "boolean") {
            setShowTranslations(data.progress.showTranslations);
          }
          if (Number.isFinite(data.progress?.pauseMs)) {
            setPauseMs(data.progress.pauseMs);
          }
          // Load conversation settings
          setConversationSettings((prev) => {
            const savedSubjects =
              typeof data.progress?.conversationSubjects === "string"
                ? data.progress.conversationSubjects
                : prev.conversationSubjects;
            const draftSubjects = conversationSubjectsDraftRef.current;
            return {
              proficiencyLevel:
                data.progress?.conversationProficiencyLevel ||
                maxProficiencyLevel ||
                prev.proficiencyLevel,
              practicePronunciation:
                data.progress?.practicePronunciation ??
                prev.practicePronunciation,
              conversationSubjects:
                draftSubjects !== null && draftSubjects !== savedSubjects
                  ? draftSubjects
                  : savedSubjects,
            };
          });
        }
      } catch {}
    }
    loadXp();
  }, [currentNpub, targetLang, maxProficiencyLevel]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      clearTimeout(conversationSubjectsClearTimerRef.current);
      stop();
    },
    [],
  );
  useEffect(
    () => () => {
      stopReplayAudio();
    },
    [],
  );

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  /* ---------------------------
     Stream flushing
  --------------------------- */
  function scheduleStreamFlush() {
    if (streamFlushScheduled.current) return;
    streamFlushScheduled.current = true;
    requestAnimationFrame(() => {
      streamFlushScheduled.current = false;
      flushStreamBuffers();
    });
  }

  function flushStreamBuffers() {
    for (const [mid, buf] of streamBuffersRef.current.entries()) {
      if (!buf) continue;
      streamBuffersRef.current.set(mid, "");
      updateMessage(mid, (m) => ({
        ...m,
        textStream: (m.textStream || "") + buf,
      }));
    }
  }

  /* ---------------------------
     WebRTC Start
  --------------------------- */
  async function start() {
    playSound(submitActionSound);
    clearAutoStopTimer();
    setErr("");
    setStatus("connecting");
    setUiState("thinking");
    setMood("thoughtful");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localRef.current = stream;
      assistantInputLockedRef.current = false;
      setLocalMicEnabled(true);

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (e) => {
        if (!audioRef.current) return;
        audioRef.current.srcObject = e.streams[0];
        audioRef.current.play().catch(() => {});

        // Setup audio graph for recording
        if (!audioGraphReadyRef.current) {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(e.streams[0]);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          analyserRef.current = analyser;
          floatBufRef.current = new Float32Array(analyser.frequencyBinCount);
          const dest = ctx.createMediaStreamDestination();
          src.connect(dest);
          captureOutRef.current = dest;
          audioGraphReadyRef.current = true;
        }
      };

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        setTimeout(() => applyLanguagePolicyNow(), 60);
      };

      dc.onmessage = handleRealtimeEvent;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const resp = await fetch(REALTIME_URL, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      const answer = await resp.text();
      if (!resp.ok) throw new Error(`SDP exchange failed: HTTP ${resp.status}`);
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      setStatus("connected");
      aliveRef.current = true;
      setUiState("idle");
      scheduleAutoStop();
    } catch (e) {
      clearAutoStopTimer();
      setStatus("disconnected");
      setUiState("idle");
      setErr(e?.message || String(e));
    }
  }

  async function stop() {
    clearAutoStopTimer();
    aliveRef.current = false;
    assistantInputLockedRef.current = false;
    setLocalMicEnabled(true);
    try {
      if (dcRef.current?.readyState === "open") {
        dcRef.current.send(
          JSON.stringify({ type: "input_audio_buffer.clear" }),
        );
        dcRef.current.send(
          JSON.stringify({
            type: "session.update",
            session: { turn_detection: null },
          }),
        );
      }
    } catch {}
    try {
      const a = audioRef.current;
      if (a) {
        try {
          a.pause();
        } catch {}
        const s = a.srcObject;
        if (s) {
          try {
            s.getTracks().forEach((t) => t.stop());
          } catch {}
        }
        a.srcObject = null;
        try {
          a.load?.();
        } catch {}
      }
    } catch {}

    try {
      localRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    localRef.current = null;

    try {
      pcRef.current?.getSenders?.().forEach((s) => s.track && s.track.stop());
      pcRef.current?.getReceivers?.().forEach((r) => r.track && r.track.stop());
    } catch {}

    try {
      dcRef.current?.close();
    } catch {}
    dcRef.current = null;
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    try {
      audioCtxRef.current?.close?.();
    } catch {}
    audioCtxRef.current = null;
    analyserRef.current = null;
    floatBufRef.current = null;
    captureOutRef.current = null;
    audioGraphReadyRef.current = false;

    try {
      for (const rec of recMapRef.current.values())
        if (rec?.state === "recording") rec.stop();
    } catch {}
    recMapRef.current.clear();
    recChunksRef.current.clear();
    for (const id of recTailRef.current.values()) clearInterval(id);
    recTailRef.current.clear();
    replayRidSetRef.current.clear();

    stopReplayAudio();
    setReplayingId(null);

    clearAllDebouncers();
    respToMsg.current.clear();
    isIdleRef.current = true;
    idleWaitersRef.current.splice(0).forEach((fn) => {
      try {
        fn();
      } catch {}
    });

    setStatus("disconnected");
    setUiState("idle");
    setMood("neutral");
  }

  /* ---------------------------
     Language instructions with proficiency level
  --------------------------- */
  function buildLanguageInstructions() {
    const persona = String((voicePersonaRef.current ?? "").slice(0, 240));
    const tLang = targetLangRef.current;
    const currentSettings = conversationSettingsRef.current;
    const selectedLevel =
      currentSettings.proficiencyLevel || maxProficiencyLevel || "A1";
    const practicePronunciation =
      currentSettings.practicePronunciation || false;
    const customSubjects = currentSettings.conversationSubjects || "";

    let strict;
    if (tLang === "nah") {
      strict =
        "Respond ONLY in Eastern Huasteca Nahuatl (Náhuatl Huasteco Oriental). Do not use Spanish or English.";
    } else if (tLang === "es") {
      strict = "Responde ÚNICAMENTE en español. No uses inglés ni náhuatl.";
    } else if (tLang === "pt") {
      strict =
        "Responda APENAS em português brasileiro. Não use espanhol ou inglês.";
    } else if (tLang === "fr") {
      strict =
        "Réponds UNIQUEMENT en français. N'utilise ni l'anglais ni l'espagnol.";
    } else if (tLang === "it") {
      strict = "Rispondi SOLO in italiano. Non usare inglese o spagnolo.";
    } else if (tLang === "nl") {
      strict =
        "Antwoord ALLEEN in het Nederlands. Gebruik geen Engels of Spaans.";
    } else if (tLang === "ja") {
      strict =
        "日本語のみで応答してください。英語やスペイン語は使用しないでください。Respond ONLY in Japanese.";
    } else if (tLang === "ru") {
      strict =
        "Отвечайте ТОЛЬКО на русском языке. Не используйте английский или испанский. Respond ONLY in Russian.";
    } else if (tLang === "de") {
      strict =
        "Antworten Sie NUR auf Deutsch. Verwenden Sie kein Englisch oder Spanisch. Respond ONLY in German.";
    } else if (tLang === "el") {
      strict =
        "Απαντήστε ΜΟΝΟ στα ελληνικά. Μην χρησιμοποιείτε αγγλικά ή ισπανικά. Respond ONLY in Greek.";
    } else if (tLang === "pl") {
      strict =
        "Odpowiadaj TYLKO po polsku. Nie używaj angielskiego ani hiszpańskiego. Respond ONLY in Polish.";
    } else if (tLang === "ga") {
      strict =
        "Freagair i nGaeilge AMHÁIN. Ná húsáid Béarla ná Spáinnis. Respond ONLY in Irish.";
    } else if (tLang === "yua") {
      strict =
        "T'aanen tu'ux maaya t'aan. Ma' a ts'íibaj inglés wa español. Respond ONLY in Yucatec Maya.";
    } else {
      strict =
        "Respond ONLY in English. Do not use Spanish or Eastern Huasteca Nahuatl.";
    }

    // Proficiency level guidance
    const levelGuidance = {
      "Pre-A1":
        "CRITICAL: User is at foundations level (Pre-A1). Use ONLY the most basic words (hello, goodbye, yes, no, thank you, numbers 1-10, basic colors). Use 1-3 word phrases ONLY. Speak extremely slowly. Use single words when possible. Examples: 'Hola.' 'Sí.' 'No.' 'Uno, dos, tres.' 'Rojo.' 'Gracias.'",
      A1: "CRITICAL: User is a complete beginner (A1). Use ONLY very simple vocabulary (greetings, numbers, colors, family). Use short 3-5 word sentences. Use ONLY present tense. Speak as if to a child learning their first words. Examples: 'Hola. ¿Cómo estás?' 'Tengo un gato.' 'Me gusta pizza.'",
      A2: "CRITICAL: User is elementary level (A2). Use simple everyday vocabulary (food, shopping, directions). Use 5-8 word sentences. Use present, past, and simple future tenses only. Avoid complex grammar. Examples: 'Ayer fui al mercado.' '¿Qué vas a hacer mañana?'",
      B1: "CRITICAL: User is intermediate (B1). Use conversational vocabulary about familiar topics (work, travel, hobbies). Can use 8-12 word sentences. Use various tenses but keep grammar structures moderate. Can express opinions simply.",
      B2: "CRITICAL: User is upper intermediate (B2). Use more complex vocabulary and abstract concepts. Can use longer sentences with subordinate clauses. Can use subjunctive mood occasionally. Can discuss hypotheticals.",
      C1: "CRITICAL: User is advanced (C1). Use sophisticated vocabulary and nuanced expressions. Use complex sentence structures with multiple clauses. Use idiomatic expressions. Can handle abstract and specialized topics.",
      C2: "CRITICAL: User is near-native (C2). Use native-like expressions, colloquialisms, and subtle distinctions. Can use any grammatical structure. Can handle any topic with precision and style.",
    };

    const proficiencyHint = levelGuidance[selectedLevel] || levelGuidance.A1;

    // Pronunciation practice instructions
    const pronunciationInstructions = practicePronunciation
      ? "PRONUNCIATION PRACTICE MODE: When the user makes pronunciation errors or uses awkward phrasing, gently correct them and ask them to repeat the correct pronunciation. Use phonetic hints when helpful. Praise good pronunciation."
      : "";

    // Custom subjects context
    const customSubjectsContext = customSubjects
      ? `CUSTOM CONTEXT: The user wants to practice conversations related to: "${customSubjects}". Try to incorporate relevant vocabulary and scenarios from this context when appropriate.`
      : "";

    return [
      "Act as a friendly language practice partner for free-form conversation.",
      strict,
      proficiencyHint,
      pronunciationInstructions,
      customSubjectsContext,
      "IMPORTANT: Match your language complexity to the learner's proficiency level. Do not use vocabulary or grammar above their level.",
      "Keep replies very brief (≤25 words) and natural.",
      `PERSONA: ${persona}. Stay consistent with that tone/style.`,
      "Be encouraging and help the learner practice speaking naturally.",
      "Ask follow-up questions to keep the conversation flowing.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function buildTurnDetectionConfig() {
    if (assistantInputLockedRef.current) return null;
    return {
      type: "server_vad",
      silence_duration_ms: pauseMsRef.current || 2000,
      threshold: 0.35,
      prefix_padding_ms: 120,
    };
  }

  function setLocalMicEnabled(enabled) {
    try {
      localRef.current?.getAudioTracks?.().forEach((track) => {
        track.enabled = enabled;
      });
    } catch {}
  }

  // Prevent background sounds from barging in while the assistant is speaking.
  function setAssistantInputLocked(locked) {
    assistantInputLockedRef.current = locked;
    if (locked) setLocalMicEnabled(false);
    try {
      if (dcRef.current?.readyState === "open") {
        dcRef.current.send(
          JSON.stringify({ type: "input_audio_buffer.clear" }),
        );
        dcRef.current.send(
          JSON.stringify({
            type: "session.update",
            session: { turn_detection: buildTurnDetectionConfig() },
          }),
        );
      }
    } catch {}
    if (!locked) setLocalMicEnabled(true);
  }

  function applyLanguagePolicyNow() {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;

    const voiceName = voiceRef.current || "alloy";
    const instructions = buildLanguageInstructions();

    try {
      dcRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: {
            instructions,
            modalities: ["audio", "text"],
            voice: voiceName,
            turn_detection: buildTurnDetectionConfig(),
            input_audio_transcription: { model: "whisper-1" },
            output_audio_format: "pcm16",
          },
        }),
      );
    } catch {}
  }

  /** Disable VAD and detach mic track so the user cannot interrupt AI speech. */
  function disableVAD() {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((s) => {
        if (s.track?.kind === "audio") {
          s.replaceTrack(null).catch(() => {});
        }
      });
    }
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    try {
      dcRef.current.send(JSON.stringify({ type: "input_audio_buffer.clear" }));
      dcRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: { turn_detection: null },
        }),
      );
    } catch {}
  }

  /** Re-enable server VAD and reattach mic track after AI finishes speaking. */
  function enableVAD() {
    const micTrack = localRef.current?.getAudioTracks()?.[0];
    if (pcRef.current && micTrack) {
      pcRef.current.getSenders().forEach((s) => {
        if (!s.track || s.track?.kind === "audio") {
          s.replaceTrack(micTrack).catch(() => {});
        }
      });
    }
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    try {
      dcRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: {
            turn_detection: {
              type: "server_vad",
              silence_duration_ms: pauseMsRef.current || 2000,
              threshold: 0.35,
              prefix_padding_ms: 120,
              interrupt_response: false,
            },
          },
        }),
      );
    } catch {}
  }

  function clearAllDebouncers() {
    clearTimeout(sessionUpdateTimer.current);
  }

  function clearAutoStopTimer() {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }

  function scheduleAutoStop() {
    clearAutoStopTimer();
    autoStopTimerRef.current = setTimeout(() => {
      if (!aliveRef.current) return;
      stop();
    }, AUTO_DISCONNECT_MS);
  }

  /* ---------------------------
     Goal-based XP system with AI evaluation
  --------------------------- */

  // Evaluate if user's response satisfies the current goal
  async function evaluateGoalCompletion(userMessage, aiResponse) {
    if (currentGoal.completed || goalCheckPendingRef.current) return;
    if (!userMessage || userMessage.length < 3) return;

    goalCheckPendingRef.current = true;

    try {
      const goalText = currentGoal.text.en;
      const tLang = targetLangRef.current;
      const sLang = supportLangRef.current;
      const languageName =
        tLang === "es"
          ? "Spanish"
          : tLang === "pt"
            ? "Portuguese"
            : tLang === "fr"
              ? "French"
              : tLang === "it"
                ? "Italian"
                : tLang === "nl"
                  ? "Dutch"
                  : tLang === "nah"
                    ? "Eastern Huasteca Nahuatl"
                    : tLang === "ja"
                      ? "Japanese"
                      : tLang === "ru"
                        ? "Russian"
                        : tLang === "de"
                          ? "German"
                          : tLang === "el"
                            ? "Greek"
                            : tLang === "pl"
                              ? "Polish"
                              : tLang === "ga"
                                ? "Irish"
                                : tLang === "yua"
                                  ? "Yucatec Maya"
                                  : "English";
      const feedbackLanguage =
        getLanguagePromptName(
          normalizeSupportLanguage(sLang, DEFAULT_SUPPORT_LANGUAGE),
        ) || "English";

      const prompt = `You are evaluating if a language learner completed a conversation goal.

CRITICAL REQUIREMENTS (BOTH must be met):
1. The user MUST respond in ${languageName}. If they responded in ANY other language, the goal is NOT completed.
2. The user's message MUST directly address the specific goal content. Generic or unrelated responses do NOT count.

Goal: "${goalText}"
Target language: ${languageName}
User said: "${userMessage}"
AI responded: "${aiResponse}"

STRICT EVALUATION CRITERIA:
1. Language Check: Is the user's message in ${languageName}? (If not → completed = false)
2. Content Relevance Check: Does the user's message directly address the specific topic/action in the goal?
   - If the goal is "talk about your favorite place in the city" and user talks about their dog → completed = false
   - If the goal is "describe your morning routine" and user talks about food → completed = false
   - If the goal is "discuss your hobbies" and user talks about weather → completed = false
   - The message must be TOPICALLY RELEVANT to the goal, not just grammatically correct

Examples of INCORRECT evaluation:
- Goal: "Describe your favorite restaurant" / User: "My dog is white" → completed = false (wrong topic)
- Goal: "Talk about your weekend plans" / User: "I like coffee" → completed = false (off-topic)

Only mark completed = true if BOTH language AND content relevance are satisfied.

FEEDBACK GUIDELINES:
- Provide feedback in ${feedbackLanguage}
- If completed = true: Provide encouraging, specific praise (e.g., "Great! You talked about your favorite restaurant perfectly!")
- If completed = false: Keep it SHORT - 1-2 sentences max. Just briefly tell them what to try instead (e.g., "Try talking about the goal topic." or "Use ${languageName} to respond.")

Respond with ONLY a JSON object: {"completed": true/false, "reason": "brief, actionable feedback in ${feedbackLanguage}"}`;

      const body = {
        model: TRANSLATE_MODEL,
        text: { format: { type: "text" } },
        input: prompt,
      };

      const r = await fetch(RESPONSES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        goalCheckPendingRef.current = false;
        return;
      }

      const payload = await r.json();
      const responseText =
        payload?.output_text ||
        (Array.isArray(payload?.output) &&
          payload.output
            .map((it) =>
              (it?.content || []).map((seg) => seg?.text || "").join(""),
            )
            .join(" ")
            .trim()) ||
        "";

      const parsed = safeParseJson(responseText);
      if (parsed?.completed) {
        // Set positive feedback
        const defaultSuccess =
          sLang === "es"
            ? "¡Bien hecho! Completaste la meta."
            : sLang === "it"
              ? "Ben fatto! Hai completato l'obiettivo."
            : "Great job! You completed the goal!";
        setGoalFeedback(parsed?.reason || defaultSuccess);
        await awardGoalXp();
        // Generate contextual next goal
        setTimeout(() => generateContextualGoal(), 1500);
      } else {
        // Set guiding feedback for failed attempt
        const defaultGuidance =
          sLang === "es"
            ? "Intenta hablar sobre la meta."
            : sLang === "it"
              ? "Prova a parlare dell'obiettivo."
            : "Try addressing the goal.";
        setGoalFeedback(parsed?.reason || defaultGuidance);
        goalCheckPendingRef.current = false;
      }
    } catch (e) {
      goalCheckPendingRef.current = false;
    }
  }

  // Generate next goal based on conversation context
  async function generateContextualGoal() {
    setIsGeneratingGoal(true);
    setGoalFeedback(""); // Clear previous feedback

    // Get current settings
    const currentSettings = conversationSettingsRef.current;
    const selectedLevel =
      currentSettings.proficiencyLevel || maxProficiencyLevel || "A1";
    const customSubjects = currentSettings.conversationSubjects || "";

    try {
      // Get recent conversation context
      const recentMessages = messagesRef.current
        .slice(-6)
        .map(
          (m) => `${m.role === "user" ? "User" : "AI"}: ${m.textFinal || ""}`,
        )
        .join("\n");

      // Build custom subjects hint
      const customSubjectsHint = customSubjects
        ? `\nThe user is interested in practicing: "${customSubjects}". Consider incorporating relevant topics when appropriate.`
        : "";

      const prompt = `You are helping a ${selectedLevel} level language learner practice conversation.

Recent conversation:
${recentMessages || "Just started"}

Previous goal was: "${currentGoal.text.en}"${customSubjectsHint}

Generate the NEXT natural conversation goal that follows the flow of the conversation.
The goal should be appropriate for ${selectedLevel} level (${
        selectedLevel === "Pre-A1"
          ? "foundations - single words and basic phrases only"
          : selectedLevel === "A1"
            ? "beginner - simple tasks"
            : selectedLevel === "A2"
              ? "elementary - everyday topics"
              : selectedLevel === "B1"
                ? "intermediate - opinions and experiences"
                : selectedLevel === "B2"
                  ? "upper intermediate - complex discussions"
                  : selectedLevel === "C1"
                    ? "advanced - nuanced but concise"
                    : "mastery - sophisticated but concise"
      }).

IMPORTANT: Keep the goal CONCISE (max 10-15 words). For advanced levels, use sophisticated vocabulary, NOT longer sentences.

Respond with ONLY a JSON object: {"en": "goal in English (max 15 words)", "es": "goal in Spanish (max 15 words)", "it": "goal in Italian (max 15 words)", "fr": "goal in French (max 15 words)", "ja": "goal in Japanese (max 15 words)"}`;

      const body = {
        model: TRANSLATE_MODEL,
        text: { format: { type: "text" } },
        input: prompt,
      };

      const r = await fetch(RESPONSES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        // Fallback to default goal
        setCurrentGoal({
          text: {
            en: "Continue the conversation",
            es: "Continúa la conversación",
          },
          completed: false,
        });
        goalCheckPendingRef.current = false;
        setIsGeneratingGoal(false);
        return;
      }

      const payload = await r.json();
      const responseText =
        payload?.output_text ||
        (Array.isArray(payload?.output) &&
          payload.output
            .map((it) =>
              (it?.content || []).map((seg) => seg?.text || "").join(""),
            )
            .join(" ")
            .trim()) ||
        "";

      const parsed = safeParseJson(responseText);
      if (parsed?.en && parsed?.es) {
        setCurrentGoal({
          text: { en: parsed.en, es: parsed.es },
          completed: false,
        });
      } else {
        setCurrentGoal({
          text: {
            en: "Continue the conversation",
            es: "Continúa la conversación",
          },
          completed: false,
        });
      }
    } catch (e) {
      setCurrentGoal({
        text: {
          en: "Continue the conversation",
          es: "Continúa la conversación",
        },
        completed: false,
      });
    }

    setIsGeneratingGoal(false);
    goalCheckPendingRef.current = false;
  }

  async function awardGoalXp() {
    const npub = currentNpub;
    if (!npub) return;

    // Award 2-4 XP for completing a goal
    const xpGain = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4

    setXp((v) => v + xpGain);
    setGoalsCompleted((v) => v + 1);
    setCurrentGoal((prev) => ({ ...prev, completed: true }));

    try {
      await awardXp(npub, xpGain, targetLangRef.current);
      logEvent(analytics, "conversation_goal_completed", { xp: xpGain });
    } catch {}
  }

  /* ---------------------------
     Award XP per turn (1-3 XP)
  --------------------------- */
  async function awardTurnXp(userMessage = "", aiResponse = "") {
    const npub = currentNpub;
    if (!npub) return;

    // Award 1-3 XP randomly per turn
    const xpGain = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3

    setXp((v) => v + xpGain);

    // Evaluate goal completion with AI
    if (userMessage) {
      evaluateGoalCompletion(userMessage, aiResponse);
    }

    try {
      await awardXp(npub, xpGain, targetLangRef.current);
      logEvent(analytics, "conversation_turn_xp", { xp: xpGain });
    } catch {}
  }

  /* ---------------------------
     Realtime event handler
  --------------------------- */
  async function handleRealtimeEvent(evt) {
    if (!aliveRef.current) return;
    let data;
    try {
      data = JSON.parse(evt.data);
    } catch {
      return;
    }
    const t = data?.type;
    const rid = data?.response_id || data?.response?.id || data?.id || null;

    if (t === "conversation.item.created" && data?.item) {
      return;
    }

    // Mute mic as early as possible — before response.created fires
    if (
      t === "input_audio_buffer.speech_stopped" ||
      t === "input_audio_buffer.committed"
    ) {
      disableVAD();
      return;
    }

    if (
      t === "response.output_audio.done" ||
      t === "output_audio.done" ||
      t === "output_audio_buffer.stopped"
    ) {
      enableVAD();
      setAssistantInputLocked(false);
      setUiState(status === "connected" ? "listening" : "idle");
      setMood("neutral");
      if (aliveRef.current) scheduleAutoStop();
      return;
    }

    if (t === "response.created") {
      isIdleRef.current = false;
      clearAutoStopTimer();
      disableVAD();
      // Record when this response started (user spoke before this)
      responseStartTimeRef.current = Date.now();
      setAssistantInputLocked(true);
      const mdKind = data?.response?.metadata?.kind;
      if (mdKind === "replay") {
        replayRidSetRef.current.add(rid);
        const mid = data?.response?.metadata?.mid;
        if (mid) startRecordingForRid(rid, mid);
        setUiState("speaking");
        setMood("happy");
        return;
      }
      const mid = uid();
      respToMsg.current.set(rid, mid);
      setUiState("speaking");
      setMood("happy");
      startRecordingForRid(rid, mid);
      return;
    }

    if (
      (t === "conversation.item.input_audio_transcription.completed" ||
        t === "input_audio_transcription.completed") &&
      data?.transcript
    ) {
      const text = (data.transcript || "").trim();
      if (text) {
        const now = Date.now();
        if (
          text === lastTranscriptRef.current.text &&
          now - lastTranscriptRef.current.ts < 2000
        ) {
          return;
        }
        lastTranscriptRef.current = { text, ts: now };
        // Use timestamp BEFORE the AI response started so user message appears first
        const userTs = responseStartTimeRef.current
          ? responseStartTimeRef.current - 1
          : now;
        pushMessage({
          id: uid(),
          role: "user",
          lang: "en",
          textFinal: text,
          textStream: "",
          translation: "",
          pairs: [],
          done: true,
          ts: userTs,
        });
        // Award XP for user turn and store message for goal evaluation
        turnCountRef.current += 1;
        lastUserMessageRef.current = text;
        awardTurnXp(text, "");
      }
      return;
    }

    if (rid && replayRidSetRef.current.has(rid)) {
      if (
        t === "response.completed" ||
        t === "response.done" ||
        t === "response.canceled"
      ) {
        enableVAD();
        stopRecorderAfterTail(rid);
        replayRidSetRef.current.delete(rid);
      }
      return;
    }

    if (
      (t === "response.audio_transcript.delta" ||
        t === "response.output_text.delta" ||
        t === "response.text.delta") &&
      typeof data?.delta === "string"
    ) {
      const mid = ensureMessageForResponse(rid);
      const prev = streamBuffersRef.current.get(mid) || "";
      streamBuffersRef.current.set(mid, prev + data.delta);
      scheduleStreamFlush();
      return;
    }

    if (
      (t === "response.audio_transcript.done" ||
        t === "response.output_text.done" ||
        t === "response.text.done") &&
      typeof data?.text === "string"
    ) {
      const mid = ensureMessageForResponse(rid);
      const buf = streamBuffersRef.current.get(mid) || "";
      if (buf) {
        streamBuffersRef.current.set(mid, "");
        updateMessage(mid, (m) => ({
          ...m,
          textStream: (m.textStream || "") + buf,
        }));
      }
      updateMessage(mid, (m) => ({
        ...m,
        textFinal: ((m.textFinal || "").trim() + " " + data.text).trim(),
        textStream: "",
      }));
      return;
    }

    if (
      t === "response.completed" ||
      t === "response.done" ||
      t === "response.canceled"
    ) {
      if (t === "response.canceled") setAssistantInputLocked(false);
      stopRecorderAfterTail(rid);
      isIdleRef.current = true;
      idleWaitersRef.current.splice(0).forEach((fn) => {
        try {
          fn();
        } catch {}
      });
      const mid = rid && respToMsg.current.get(rid);
      if (mid) {
        const buf = streamBuffersRef.current.get(mid) || "";
        if (buf) {
          streamBuffersRef.current.set(mid, "");
          updateMessage(mid, (m) => ({
            ...m,
            textStream: "",
            textFinal: ((m.textFinal || "") + " " + buf).trim(),
          }));
        }
        updateMessage(mid, (m) => ({ ...m, done: true }));
        logEvent(analytics, "conversation_turn", {
          action: "turn_completed",
        });

        // Evaluate goal completion with the AI response
        const aiMessage = messagesRef.current.find((m) => m.id === mid);
        const aiResponseText = aiMessage?.textFinal || "";
        if (lastUserMessageRef.current && aiResponseText) {
          evaluateGoalCompletion(lastUserMessageRef.current, aiResponseText);
        }

        respToMsg.current.delete(rid);
      }
      return;
    }

    if (t === "error" && data?.error?.message) {
      const msg = data.error.message || "";
      if (/Cancellation failed/i.test(msg) || /no active response/i.test(msg))
        return;
      setErr((p) => p || msg);
    }
  }

  function ensureMessageForResponse(rid) {
    let mid = respToMsg.current.get(rid);
    if (!mid) {
      mid = uid();
      respToMsg.current.set(rid, mid);
    }
    const exists = messagesRef.current.some((m) => m.id === mid);
    if (!exists) {
      pushMessage({
        id: mid,
        role: "assistant",
        lang: targetLangRef.current || "es",
        textFinal: "",
        textStream: "",
        translation: "",
        pairs: [],
        done: false,
        hasAudio: false,
        ts: Date.now(),
      });
    }
    return mid;
  }

  function pushMessage(m) {
    setMessages((p) => {
      // Prevent duplicate messages with same ID
      if (p.some((existing) => existing.id === m.id)) {
        return p;
      }
      return [...p, m];
    });
  }

  function updateMessage(id, fn) {
    setMessages((p) => p.map((m) => (m.id === id ? fn(m) : m)));
  }

  /* ---------------------------
     Translation
  --------------------------- */
  async function translateMessage(id) {
    const m = messagesRef.current.find((x) => x.id === id);
    if (!m) return;
    const src = (m.textFinal + " " + (m.textStream || "")).trim();
    if (!src) return;
    if (m.role !== "assistant") return;

    const target = normalizeSupportLanguage(
      supportLangRef.current || supportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );

    if ((m.lang || targetLangRef.current) === target) {
      updateMessage(id, (prev) => ({ ...prev, translation: src, pairs: [] }));
      return;
    }

    const prompt =
      target === "es"
        ? `Traduce lo siguiente al español claro y natural.
Devuelve SOLO JSON con el formato {"translation":"...","pairs":[{"lhs":"...","rhs":"..."}]}.
Divide la oración en fragmentos paralelos muy cortos (2 a 6 palabras) dentro de "pairs" para alinear las ideas.
Evita responder con toda la frase en un solo fragmento.`
        : target === "it"
          ? `Traduci quanto segue in italiano naturale e chiaro.
Restituisci SOLO JSON nel formato {"translation":"...","pairs":[{"lhs":"...","rhs":"..."}]}.
Dividi la frase in frammenti paralleli molto brevi (2-6 parole) dentro "pairs" per allineare le idee.
Non restituire l'intera frase come un unico frammento.`
        : `Translate the following into natural US English.
Return ONLY JSON in the format {"translation":"...","pairs":[{"lhs":"...","rhs":"..."}]}.
Split the sentence into short, aligned chunks (2-6 words) inside "pairs" for phrase-by-phrase study.
Do not return the whole sentence as a single chunk.`;

    const body = {
      model: TRANSLATE_MODEL,
      text: { format: { type: "text" } },
      input: `${prompt}\n\n${src}`,
    };

    const r = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const ct = r.headers.get("content-type") || "";
    const payload = ct.includes("application/json")
      ? await r.json()
      : await r.text();
    if (!r.ok) {
      const msg =
        payload?.error?.message ||
        (typeof payload === "string" ? payload : JSON.stringify(payload));
      throw new Error(msg || `Translate HTTP ${r.status}`);
    }

    const mergedText =
      (typeof payload?.output_text === "string" && payload.output_text) ||
      (Array.isArray(payload?.output) &&
        payload.output
          .map((it) =>
            (it?.content || []).map((seg) => seg?.text || "").join(""),
          )
          .join(" ")
          .trim()) ||
      (Array.isArray(payload?.content) && payload.content[0]?.text) ||
      (Array.isArray(payload?.choices) &&
        (payload.choices[0]?.message?.content || "")) ||
      "";

    const parsed = safeParseJson(mergedText);
    const translation = (parsed?.translation || mergedText || "").trim();
    const rawPairs = Array.isArray(parsed?.pairs) ? parsed.pairs : [];
    const pairs = tidyPairs(rawPairs);

    updateMessage(id, (prev) => ({ ...prev, translation, pairs }));
  }

  async function handleManualTranslate(id) {
    const previousUiState = uiState;
    setTranslatingMessageId(id);
    setUiState("thinking");
    try {
      await translateMessage(id);
    } catch {}
    setTranslatingMessageId(null);
    if (status === "connected") {
      setUiState("listening");
    } else {
      setUiState(previousUiState === "thinking" ? "idle" : previousUiState);
    }
  }

  /* ---------------------------
     Render
  --------------------------- */
  return (
    <>
      <Box minH="100vh" color="gray.100" position="relative" pb="120px">
        {/* Header area: robot separated from goal card */}
        <VStack px={4} mt={0} spacing={1} align="center">
          <Box
            p={2}
            rounded="2xl"
            border="1px solid"
            borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.06)"}
            width="100%"
            maxWidth="400px"
            sx={{
              ...(isLightTheme ? PAPER_PANEL_SX : MATRIX_PANEL_SX),
              overflow: "visible",
            }}
            boxShadow={isLightTheme ? APP_SHADOW : undefined}
          >
            <VStack spacing={3} align="center" width="100%">
              <HStack width="100%" justify="space-between" align="center">
                <Button
                  leftIcon={<FiSettings />}
                  size="xs"
                  variant="ghost"
                  onClick={handleSettingsOpen}
                  opacity={0.7}
                  color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                  _hover={{
                    opacity: 1,
                    bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
                  }}
                  fontWeight="medium"
                >
                  {uiText("ra_conversation_settings", "Conversation settings")}
                </Button>
                <IconButton
                  ref={chatLogButtonRef}
                  icon={<FaRegCommentDots size={14} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="cyan"
                  {...chatLogButtonHighlightProps}
                  onClick={openTranscript}
                  _hover={{ opacity: 1 }}
                  isDisabled={!timeline.length}
                  aria-label={uiText("ra_chat_log", "Chat log")}
                />
              </HStack>

              {/* Goal Text with Checkmark or Loader */}
              <VStack spacing={2} align="center" width="100%">
                <HStack
                  spacing={2}
                  align="center"
                  width="100%"
                  justify="center"
                >
                  {isGeneratingGoal ? (
                    <>
                      <VoiceOrb
                        state={getRealtimeOrbVisualState(
                          ["idle", "listening", "speaking"][
                            Math.floor(Math.random() * 3)
                          ],
                        )}
                        size={24}
                        theme={isLightTheme ? "light" : "dark"}
                      />
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        textAlign="center"
                        color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                        flex="1"
                      >
                        {streamingText ||
                          uiText("ra_generating_topic", "Generating new topic...")}
                      </Text>
                    </>
                  ) : (
                    <>
                      <IconButton
                        icon={<FaDice />}
                        size="xs"
                        variant="ghost"
                        color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                        aria-label={
                          uiText("ra_new_topic", "New topic")
                        }
                        onClick={handleShuffleTopic}
                        opacity={0.7}
                        bg={isLightTheme ? APP_SURFACE : undefined}
                        _hover={{
                          opacity: 1,
                          bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
                        }}
                        isDisabled={status === "connected"}
                      />
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        textAlign="center"
                        color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                        opacity={currentGoal.completed ? 0.6 : 1}
                        textDecoration={
                          currentGoal.completed ? "line-through" : "none"
                        }
                        flex="1"
                      >
                        {currentGoal.text[uiLang] || currentGoal.text.en}
                        {goalFeedback &&
                          !isGeneratingGoal &&
                          !currentGoal.completed && (
                            <Popover placement="bottom-end" isLazy>
                              <PopoverTrigger>
                                <Box
                                  as="button"
                                  type="button"
                                  aria-label={
                                    uiText("ra_show_suggestion", "Show suggestion")
                                  }
                                  ml="6px"
                                  width="12px"
                                  height="12px"
                                  display="inline-flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  borderRadius="full"
                                  border="1px solid"
                                  borderColor={
                                    isLightTheme
                                      ? "rgba(165, 89, 108, 0.38)"
                                      : "red.300"
                                  }
                                  bg={
                                    isLightTheme
                                      ? "rgba(214, 96, 122, 0.16)"
                                      : "rgba(239,68,68,0.9)"
                                  }
                                  color={isLightTheme ? "#8f4a5e" : "white"}
                                  boxShadow={
                                    isLightTheme
                                      ? "0 1px 0 rgba(255,255,255,0.45)"
                                      : undefined
                                  }
                                  verticalAlign="text-bottom"
                                  transform="translateY(-1px)"
                                  lineHeight={1}
                                >
                                  <FaExclamation size={7} />
                                </Box>
                              </PopoverTrigger>
                              <PopoverContent
                                bg={isLightTheme ? APP_SURFACE : "red.900"}
                                color={isLightTheme ? APP_TEXT_PRIMARY : "red.100"}
                                borderColor={
                                  isLightTheme
                                    ? "rgba(194, 103, 132, 0.24)"
                                    : "red.500"
                                }
                                maxW="320px"
                              >
                                <PopoverArrow
                                  bg={isLightTheme ? APP_SURFACE : "red.900"}
                                />
                                <PopoverBody fontSize="xs">
                                  {goalFeedback}
                                </PopoverBody>
                              </PopoverContent>
                            </Popover>
                          )}
                      </Text>
                      {currentGoal.completed && (
                        <Box
                          as={FaCheckCircle}
                          color={isLightTheme ? "#5f9d8a" : "green.400"}
                          boxSize="18px"
                        />
                      )}
                    </>
                  )}
                </HStack>

                {/* Goal Feedback */}
                {goalFeedback && !isGeneratingGoal && currentGoal.completed && (
                  <Text
                    fontSize="xs"
                    textAlign="center"
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    bg={
                      isLightTheme ? "rgba(86, 168, 155, 0.12)" : "green.900"
                    }
                    color={isLightTheme ? APP_TEXT_SECONDARY : "green.200"}
                    border="1px solid"
                    borderColor={
                      isLightTheme ? "rgba(86, 168, 155, 0.24)" : "green.600"
                    }
                    maxW="90%"
                  >
                    {goalFeedback}
                  </Text>
                )}
              </VStack>

              {/* XP Progress Bar */}
              <Box w="100%">
                <XpProgressHeader
                  levelText={`${uiText("ra_label_level", "Level")} ${xpLevelNumber}`}
                  xpText={`${uiText("ra_label_xp", "XP")} ${xp}`}
                  progressPct={progressPct}
                  xpBadgeProps={{ colorScheme: "teal", fontSize: "10px" }}
                />
              </Box>
            </VStack>
          </Box>

          <VStack spacing={0.5} align="center">
            <Box
              width="132px"
              opacity={0.95}
              flexShrink={0}
              position="relative"
            >
              {previousRobotState && (
                <Box
                  position="absolute"
                  inset={0}
                  opacity={isRobotTransitioning ? 0 : 1}
                  transition="opacity 0.5s ease"
                >
                  <VoiceOrb
                    state={previousOrbState}
                    theme={isLightTheme ? "light" : "dark"}
                  />
                </Box>
              )}
              <Box opacity={1} transition="opacity 0.5s ease">
                <VoiceOrb
                  state={displayOrbState}
                  theme={isLightTheme ? "light" : "dark"}
                />
              </Box>
            </Box>
            {status === "connected" && uiStateLabel(liveUiState, uiLang) && (
              <Text
                fontSize="xs"
                color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
              >
                {uiStateLabel(liveUiState, uiLang)}
              </Text>
            )}
          </VStack>
        </VStack>

        {/* Centered live reply */}
        <Box px={4} mt="6px">
          <VStack w="100%" maxW="640px" mx="auto" spacing={2} align="stretch">
            {latestAssistantMessage ? (
              <Box
                w="100%"
                minH={{ base: "150px", md: "165px" }}
                display="flex"
                alignItems="stretch"
                justifyContent="flex-start"
                position="relative"
              >
                <Box w="100%" position="relative" zIndex={1}>
                  <AlignedBubble
                    containerRef={liveBubbleSurfaceRef}
                    primaryTextRef={liveBubbleTextRef}
                    contentOpacity={shouldMuteIncomingBubble ? 0 : 1}
                    contentTransform={
                      shouldMuteIncomingBubble
                        ? "translateY(10px) scale(0.985)"
                        : "translateY(0px) scale(1)"
                    }
                    primaryText={`${latestAssistantMessage.textFinal || ""}${
                      latestAssistantMessage.textStream || ""
                    }`}
                    secondaryText={
                      showTranslations
                        ? latestAssistantMessage.translation || ""
                        : ""
                    }
                    pairs={latestAssistantMessage.pairs || []}
                    showSecondary={showTranslations}
                    isTranslating={
                      translatingMessageId === latestAssistantMessage.id
                    }
                    canTranslate={showTranslations}
                    onTranslate={() =>
                      handleManualTranslate(latestAssistantMessage.id)
                    }
                    canReplay={
                      !!latestAssistantMessage.hasAudio ||
                      audioCacheIndexRef.current.has(latestAssistantMessage.id)
                    }
                    onReplay={() => playSavedClip(latestAssistantMessage.id)}
                    isReplaying={replayingId === latestAssistantMessage.id}
                    replayLabel={uiText("ra_btn_replay", "Replay")}
                  />
                </Box>
              </Box>
            ) : null}
          </VStack>
        </Box>

        {/* Bottom dock - Connect button only */}
        <Center
          position="fixed"
          bottom="22px"
          left="0"
          right="0"
          zIndex={30}
          px={4}
        >
          <HStack spacing={3} w="100%" maxW="560px" justify="center">
            <Button
              onClick={status === "connected" ? stop : start}
              size="lg"
              height="64px"
              px={{ base: 8, md: 12 }}
              rounded="full"
              colorScheme={status === "connected" ? undefined : "cyan"}
              bg={
                status === "connected"
                  ? SOFT_STOP_BUTTON_BG
                  : isLightTheme
                    ? "linear-gradient(180deg, #40c6d9 0%, #2fb4c7 100%)"
                    : undefined
              }
              boxShadow={
                status === "connected"
                  ? SOFT_STOP_BUTTON_GLOW
                  : isLightTheme
                    ? "0 10px 24px rgba(66, 168, 181, 0.22), 0 4px 0 rgba(41, 126, 136, 0.82)"
                    : undefined
              }
              _hover={
                status === "connected"
                  ? { bg: SOFT_STOP_BUTTON_HOVER_BG }
                  : isLightTheme
                    ? {
                        bg: "linear-gradient(180deg, #35bfd3 0%, #27adc0 100%)",
                      }
                  : undefined
              }
              color={
                status === "connected"
                  ? "white"
                  : isLightTheme
                    ? "white"
                    : "white"
              }
              border={
                isLightTheme && status !== "connected"
                  ? "1px solid rgba(255,255,255,0.55)"
                  : undefined
              }
              textShadow={isLightTheme ? "none" : "0 0 16px rgba(0,0,0,0.9)"}
              mb={20}
            >
              {status === "connected" ? (
                <>
                  <FaStop /> &nbsp; {uiText("ra_btn_end", "End")}
                </>
              ) : (
                <>
                  <PiMicrophoneStageDuotone /> &nbsp;{" "}
                  {status === "connecting"
                    ? uiText("ra_btn_starting", "Starting...")
                    : uiText("ra_btn_start", "Start")}
                </>
              )}
            </Button>
          </HStack>
        </Center>

        {err && (
          <Box px={4} pt={2}>
            <Box
              as="pre"
              bg="rgba(255,255,255,0.06)"
              border="1px solid rgba(255,255,255,0.12)"
              p={3}
              borderRadius={8}
              whiteSpace="pre-wrap"
              color="#fee2e2"
            >
              {err}
            </Box>
          </Box>
        )}

        {/* remote live audio sink */}
        <audio ref={audioRef} />
      </Box>

      <ArchiveTextAnimation animation={archiveAnimation} />

      {/* Conversation + Account Drawer */}
      <ConversationAccountDrawer
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
        appLanguage={uiLang}
        settings={conversationSettings}
        onSettingsChange={handleSettingsChange}
        supportLang={supportLang}
      />

      <Modal isOpen={isTranscriptOpen} onClose={closeTranscript} size="xl">
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent bg="gray.800" color="gray.100" mx={3}>
          <ModalHeader>
            {uiText("ra_conversation_log", "Conversation log")}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={5}>
            <VStack align="stretch" spacing={3}>
              {timeline.map((m) => {
                const isUser = m.role === "user";
                if (isUser) {
                  return (
                    <RowRight key={m.id}>
                      <UserBubble label={ui.ra_label_you} text={m.textFinal} />
                    </RowRight>
                  );
                }

                const primaryText = (m.textFinal || "") + (m.textStream || "");
                const secondaryText = m.translation || "";

                if (!primaryText.trim()) return null;
                return (
                  <RowLeft key={m.id}>
                    <AlignedBubble
                      primaryText={primaryText}
                      secondaryText={showTranslations ? secondaryText : ""}
                      pairs={m.pairs || []}
                      showSecondary={showTranslations}
                      isTranslating={translatingMessageId === m.id}
                      canTranslate={showTranslations}
                      onTranslate={() => handleManualTranslate(m.id)}
                      canReplay={
                        !!m.hasAudio || audioCacheIndexRef.current.has(m.id)
                      }
                      onReplay={() => playSavedClip(m.id)}
                      isReplaying={replayingId === m.id}
                      replayLabel={uiText("ra_btn_replay", "Replay")}
                    />
                  </RowLeft>
                );
              })}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
