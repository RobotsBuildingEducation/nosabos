import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Box } from "@chakra-ui/react";
import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";

const ARCHIVE_GLYPH_DURATION_MS = 680;
const ARCHIVE_GLYPH_DURATION_VARIANCE_MS = 150;
const ARCHIVE_ANIMATION_BUFFER_MS = 180;
const ARCHIVE_GLYPH_STREAM_SPREAD_MS = 180;
const ARCHIVE_GLYPH_STREAM_JITTER_MS = 22;
const ARCHIVE_INCOMING_HOLD_MS = 170;
export const CHAT_LOG_HIGHLIGHT_DURATION_MS = 1350;

const archiveLayoutCache = new Map();
let archiveMeasureContext = null;

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function getRealtimeOrbVisualState(uiState) {
  if (uiState === "listening") return "speaking";
  if (uiState === "speaking") return "listening";
  return uiState;
}

export function getChatLogButtonHighlightProps(isActive, isLightTheme = false) {
  if (isLightTheme) {
    return {
      opacity: 1,
      color: isActive ? "#69533d" : "#8b755f",
      bg: isActive
        ? "rgba(255, 250, 241, 0.96)"
        : "rgba(255, 250, 241, 0.58)",
      border: "1px solid",
      borderColor: isActive
        ? "rgba(110, 193, 214, 0.56)"
        : "rgba(191, 168, 139, 0.34)",
      boxShadow: isActive
        ? "0 10px 18px rgba(97, 74, 47, 0.14), 0 0 16px rgba(110, 193, 214, 0.16)"
        : "0 6px 12px rgba(97, 74, 47, 0.08)",
      textShadow: isActive
        ? "0 0 8px rgba(110, 193, 214, 0.22)"
        : "none",
      animation: isActive
        ? `realtimeChatLogPulsePaper ${CHAT_LOG_HIGHLIGHT_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
        : undefined,
      transition:
        "opacity 180ms ease, color 180ms ease, text-shadow 220ms ease, transform 220ms ease, filter 220ms ease, background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease",
      sx: {
        "@keyframes realtimeChatLogPulsePaper": {
          "0%": {
            boxShadow:
              "0 6px 12px rgba(97, 74, 47, 0.08), 0 0 0 rgba(110, 193, 214, 0)",
            transform: "translateY(0px) scale(1)",
          },
          "22%": {
            boxShadow:
              "0 12px 20px rgba(97, 74, 47, 0.14), 0 0 18px rgba(110, 193, 214, 0.24)",
            transform: "translateY(-1px) scale(1.015)",
          },
          "65%": {
            boxShadow:
              "0 8px 16px rgba(97, 74, 47, 0.1), 0 0 10px rgba(110, 193, 214, 0.14)",
            transform: "translateY(0px) scale(1)",
          },
          "100%": {
            boxShadow:
              "0 6px 12px rgba(97, 74, 47, 0.08), 0 0 0 rgba(110, 193, 214, 0)",
            transform: "translateY(0px) scale(1)",
          },
        },
        "& .chakra-button__icon, & svg": {
          filter: isActive
            ? "drop-shadow(0 0 6px rgba(110, 193, 214, 0.24))"
            : "none",
          transition: "filter 220ms ease",
        },
      },
    };
  }
  return {
    opacity: isActive ? 1 : 0.82,
    color: isActive ? "#eff6ff" : undefined,
    textShadow: isActive
      ? "0 0 1px rgba(255,255,255,0.98), 0 0 6px rgba(96,165,250,0.98), 0 0 12px rgba(59,130,246,0.92), 0 0 18px rgba(37,99,235,0.62)"
      : "none",
    animation: isActive
      ? `realtimeChatLogPulse ${CHAT_LOG_HIGHLIGHT_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
      : undefined,
    transition:
      "opacity 180ms ease, color 180ms ease, text-shadow 220ms ease, transform 220ms ease, filter 220ms ease",
    sx: {
      "@keyframes realtimeChatLogPulse": {
        "0%": {
          textShadow:
            "0 0 0 rgba(255,255,255,0), 0 0 0 rgba(96,165,250,0), 0 0 0 rgba(59,130,246,0), 0 0 0 rgba(37,99,235,0)",
          transform: "translateY(0px) scale(1)",
        },
        "22%": {
          textShadow:
            "0 0 1px rgba(255,255,255,1), 0 0 7px rgba(147,197,253,1), 0 0 13px rgba(59,130,246,0.96), 0 0 19px rgba(37,99,235,0.68)",
          transform: "translateY(-1px) scale(1.015)",
        },
        "65%": {
          textShadow:
            "0 0 1px rgba(255,255,255,0.9), 0 0 5px rgba(147,197,253,0.9), 0 0 10px rgba(59,130,246,0.78), 0 0 15px rgba(37,99,235,0.48)",
          transform: "translateY(0px) scale(1)",
        },
        "100%": {
          textShadow:
            "0 0 0 rgba(147,197,253,0), 0 0 0 rgba(96,165,250,0), 0 0 0 rgba(59,130,246,0), 0 0 0 rgba(37,99,235,0)",
          transform: "translateY(0px) scale(1)",
        },
      },
      "& .chakra-button__icon, & svg": {
        filter: isActive
          ? "drop-shadow(0 0 2px rgba(255,255,255,0.95)) drop-shadow(0 0 7px rgba(96,165,250,0.98)) drop-shadow(0 0 13px rgba(37,99,235,0.62))"
          : "none",
        transition: "filter 220ms ease",
      },
    },
  };
}

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
  const raw = Math.sin(seed * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

export function ArchiveTextAnimation({ animation }) {
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
        "@keyframes realtimeArchiveGlyph": {
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
        "@keyframes realtimeArchiveGlow": {
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
          animation={`realtimeArchiveGlow ${
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
                animation: `realtimeArchiveGlyph ${duration}ms cubic-bezier(0.12, 0.86, 0.24, 1) ${streamDelay}ms both`,
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

export function useArchiveTextStream({
  latestMessageId,
  latestMessageText,
  getOutgoingTextById,
  measureDeps = [],
  visibleContentTransform = "translateY(0px) scale(1)",
  mutedContentTransform = "translateY(10px) scale(0.985)",
}) {
  const previousAssistantIdRef = useRef(null);
  const liveBubbleSurfaceRef = useRef(null);
  const liveBubbleTextRef = useRef(null);
  const liveBubbleSnapshotRef = useRef(null);
  const chatLogButtonRef = useRef(null);
  const incomingRevealTimerRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const [archiveAnimation, setArchiveAnimation] = useState(null);
  const [hiddenIncomingMessageId, setHiddenIncomingMessageId] = useState(null);
  const [isChatLogHighlighted, setIsChatLogHighlighted] = useState(false);

  const shouldMuteIncomingBubble =
    hiddenIncomingMessageId != null && latestMessageId === hiddenIncomingMessageId;

  const captureLiveBubbleSnapshot = useCallback(() => {
    if (typeof window === "undefined") return;
    const surfaceNode = liveBubbleSurfaceRef.current;
    const textNode = liveBubbleTextRef.current;
    if (
      !(surfaceNode instanceof HTMLElement) ||
      !(textNode instanceof HTMLElement)
    ) {
      return;
    }

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
    if (!latestMessageId) return;
    const nextId = latestMessageId;
    const prevId = previousAssistantIdRef.current;
    previousAssistantIdRef.current = nextId;
    if (!prevId || prevId === nextId) return;

    const snapshot = liveBubbleSnapshotRef.current;
    const targetNode = chatLogButtonRef.current;
    const outgoingText = String(getOutgoingTextById?.(prevId) || "").trim();

    if (!snapshot || !outgoingText) return;
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
    if (incomingRevealTimerRef.current && typeof window !== "undefined") {
      window.clearTimeout(incomingRevealTimerRef.current);
      incomingRevealTimerRef.current = null;
    }
    if (typeof window !== "undefined") {
      incomingRevealTimerRef.current = window.setTimeout(() => {
        setHiddenIncomingMessageId((current) =>
          current === nextId ? null : current,
        );
        incomingRevealTimerRef.current = null;
      }, ARCHIVE_INCOMING_HOLD_MS);
    }
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

    if (typeof window === "undefined") return;
    const totalDuration =
      ARCHIVE_GLYPH_DURATION_MS +
      ARCHIVE_GLYPH_DURATION_VARIANCE_MS +
      ARCHIVE_GLYPH_STREAM_SPREAD_MS +
      ARCHIVE_GLYPH_STREAM_JITTER_MS +
      ARCHIVE_ANIMATION_BUFFER_MS;
    setIsChatLogHighlighted(true);
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setIsChatLogHighlighted(false);
      highlightTimerRef.current = null;
    }, Math.max(totalDuration, CHAT_LOG_HIGHLIGHT_DURATION_MS));
    const timer = window.setTimeout(() => {
      setArchiveAnimation((current) =>
        current?.id === animationId ? null : current,
      );
    }, totalDuration);

    return () => window.clearTimeout(timer);
  }, [getOutgoingTextById, latestMessageId]);

  useLayoutEffect(() => {
    captureLiveBubbleSnapshot();
  }, [
    captureLiveBubbleSnapshot,
    latestMessageId,
    latestMessageText,
    ...measureDeps,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleViewportChange = () => captureLiveBubbleSnapshot();
    handleViewportChange();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, { passive: true });

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange);
    };
  }, [captureLiveBubbleSnapshot]);

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      if (incomingRevealTimerRef.current) {
        window.clearTimeout(incomingRevealTimerRef.current);
        incomingRevealTimerRef.current = null;
      }
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };
  }, []);

  return {
    archiveAnimation,
    chatLogButtonRef,
    isChatLogHighlighted,
    liveBubbleSurfaceRef,
    liveBubbleTextRef,
    shouldMuteIncomingBubble,
    contentOpacity: shouldMuteIncomingBubble ? 0 : 1,
    contentTransform: shouldMuteIncomingBubble
      ? mutedContentTransform
      : visibleContentTransform,
  };
}
