import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  IconButton,
  Progress,
  Wrap,
  WrapItem,
  useToast,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
  Image,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import { ArrowBackIcon, CloseIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { MdOutlineSupportAgent, MdUndo } from "react-icons/md";
import { FaMicrophone } from "react-icons/fa";
import * as Tone from "tone";
import * as THREE from "three";
import {
  MAP_CHOICES,
  REVIEW_WORLD_ID,
  TUTORIAL_MAP_ID,
  generateScenarioWithAI,
} from "./scenarios";
import {
  createTileTexture,
  createCharacterTexture,
  createSpriteTexture,
  createNPCIndicatorTexture,
  createGroundDecalTexture,
  NPC_PRESETS,
  PLAYER_COLORS,
} from "./pixelArt";
import useSoundSettings from "../../hooks/useSoundSettings";
import {
  getTTSPlayer,
  TTS_LANG_TAG,
  getCharacterVoice,
  getCharacterPersonality,
} from "../../utils/tts";
import { callResponses } from "../../utils/llm";
import { simplemodel } from "../../firebaseResources/firebaseResources";
import { useSpeechPractice } from "../../hooks/useSpeechPractice";
import HelpChatFab from "../HelpChatFab";
import RobotBuddyPro from "../RobotBuddyPro";
import LoadingMiniGame from "../LoadingMiniGame";
import playerSpriteSheetUrl from "../../sprites/sprite_sheet_6.png";
import npcSpriteSheetUrl from "../../sprites/NPC_sprites.png";
import RandomCharacter from "../RandomCharacter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getLanguagePromptName,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../../constants/languages";
import { buildGameReviewContext } from "../../utils/gameReviewContext";

// ─── Pixel-art drawing for gather-quest items (32×32 canvas, 2× scale) ────
const GATHER_SPRITE_SIZE = 32;
const GATHER_SPRITE_GRID = 16;

function clampGatherVisualInt(value, min, max, fallback) {
  const num = Number.isFinite(Number(value)) ? Number(value) : fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function drawGatherPixelRect(ctx, x, y, w, h, color) {
  if (!color || w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawGatherPixelCircle(ctx, cx, cy, r, fill, stroke) {
  if (!fill && !stroke) return;
  const outerRadius = Math.max(1, r);
  const innerRadius = Math.max(0, outerRadius - 1);

  for (let py = cy - outerRadius; py <= cy + outerRadius; py++) {
    for (let px = cx - outerRadius; px <= cx + outerRadius; px++) {
      const distSq = (px - cx) * (px - cx) + (py - cy) * (py - cy);
      if (stroke && distSq <= outerRadius * outerRadius) {
        drawGatherPixelRect(ctx, px, py, 1, 1, stroke);
      }
      if (fill && distSq <= innerRadius * innerRadius) {
        drawGatherPixelRect(ctx, px, py, 1, 1, fill);
      }
    }
  }
}

function isPixelInRoundedRect(px, py, x, y, w, h, r) {
  const right = x + w - 1;
  const bottom = y + h - 1;
  if (r <= 0) {
    return px >= x && px <= right && py >= y && py <= bottom;
  }

  const innerLeft = x + r;
  const innerRight = right - r;
  const innerTop = y + r;
  const innerBottom = bottom - r;

  if (
    (px >= innerLeft && px <= innerRight && py >= y && py <= bottom) ||
    (py >= innerTop && py <= innerBottom && px >= x && px <= right)
  ) {
    return true;
  }

  const corners = [
    [innerLeft, innerTop],
    [innerRight, innerTop],
    [innerLeft, innerBottom],
    [innerRight, innerBottom],
  ];

  return corners.some(
    ([cx, cy]) => (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r,
  );
}

function drawGatherPixelRoundedRect(ctx, x, y, w, h, r, fill, stroke) {
  if (!fill && !stroke) return;

  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      if (!isPixelInRoundedRect(px, py, x, y, w, h, r)) continue;
      if (stroke) drawGatherPixelRect(ctx, px, py, 1, 1, stroke);
      if (
        fill &&
        isPixelInRoundedRect(
          px,
          py,
          x + 1,
          y + 1,
          Math.max(0, w - 2),
          Math.max(0, h - 2),
          Math.max(0, r - 1),
        )
      ) {
        drawGatherPixelRect(ctx, px, py, 1, 1, fill);
      }
    }
  }
}

function drawGatherPixelLine(ctx, x1, y1, x2, y2, color, width = 1) {
  if (!color) return;
  let currentX = x1;
  let currentY = y1;
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  const radius = Math.max(0, Math.floor(width / 2));

  while (true) {
    for (let offY = -radius; offY <= radius; offY++) {
      for (let offX = -radius; offX <= radius; offX++) {
        drawGatherPixelRect(ctx, currentX + offX, currentY + offY, 1, 1, color);
      }
    }
    if (currentX === x2 && currentY === y2) break;
    const err2 = err * 2;
    if (err2 > -dy) {
      err -= dy;
      currentX += sx;
    }
    if (err2 < dx) {
      err += dx;
      currentY += sy;
    }
  }
}

function drawGatherPixelPolygon(ctx, points, fill, stroke, closed = true) {
  if (!Array.isArray(points) || points.length < 2 || (!fill && !stroke)) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0][0] + 0.5, points[0][1] + 0.5);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0] + 0.5, points[i][1] + 0.5);
  }
  if (closed) ctx.closePath();
  if (fill && closed) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }
  ctx.restore();
}

function drawDynamicGatherVisual(ctx, visual) {
  const layers = Array.isArray(visual?.layers) ? visual.layers : [];
  if (!layers.length) return false;

  const pixelCanvas = document.createElement("canvas");
  pixelCanvas.width = GATHER_SPRITE_GRID;
  pixelCanvas.height = GATHER_SPRITE_GRID;
  const pixelCtx = pixelCanvas.getContext("2d");
  pixelCtx.imageSmoothingEnabled = false;
  pixelCtx.clearRect(0, 0, GATHER_SPRITE_GRID, GATHER_SPRITE_GRID);

  layers.forEach((layer) => {
    if (!layer?.type) return;
    if (layer.type === "rect") {
      drawGatherPixelRect(
        pixelCtx,
        clampGatherVisualInt(layer.x, 0, 15, 0),
        clampGatherVisualInt(layer.y, 0, 15, 0),
        clampGatherVisualInt(layer.w, 1, 16, 4),
        clampGatherVisualInt(layer.h, 1, 16, 4),
        layer.fill,
      );
      if (layer.stroke) {
        drawGatherPixelRect(
          pixelCtx,
          layer.x,
          layer.y,
          layer.w,
          1,
          layer.stroke,
        );
        drawGatherPixelRect(
          pixelCtx,
          layer.x,
          layer.y + layer.h - 1,
          layer.w,
          1,
          layer.stroke,
        );
        drawGatherPixelRect(
          pixelCtx,
          layer.x,
          layer.y,
          1,
          layer.h,
          layer.stroke,
        );
        drawGatherPixelRect(
          pixelCtx,
          layer.x + layer.w - 1,
          layer.y,
          1,
          layer.h,
          layer.stroke,
        );
      }
      return;
    }

    if (layer.type === "roundRect") {
      drawGatherPixelRoundedRect(
        pixelCtx,
        clampGatherVisualInt(layer.x, 0, 15, 0),
        clampGatherVisualInt(layer.y, 0, 15, 0),
        clampGatherVisualInt(layer.w, 1, 16, 6),
        clampGatherVisualInt(layer.h, 1, 16, 6),
        clampGatherVisualInt(layer.r, 0, 6, 1),
        layer.fill,
        layer.stroke,
      );
      return;
    }

    if (layer.type === "circle") {
      drawGatherPixelCircle(
        pixelCtx,
        clampGatherVisualInt(layer.cx, 0, 15, 8),
        clampGatherVisualInt(layer.cy, 0, 15, 8),
        clampGatherVisualInt(layer.r, 1, 8, 3),
        layer.fill,
        layer.stroke,
      );
      return;
    }

    if (layer.type === "line") {
      drawGatherPixelLine(
        pixelCtx,
        clampGatherVisualInt(layer.x1, 0, 15, 0),
        clampGatherVisualInt(layer.y1, 0, 15, 0),
        clampGatherVisualInt(layer.x2, 0, 15, 15),
        clampGatherVisualInt(layer.y2, 0, 15, 15),
        layer.stroke,
        clampGatherVisualInt(layer.width, 1, 3, 1),
      );
      return;
    }

    if (layer.type === "poly") {
      drawGatherPixelPolygon(
        pixelCtx,
        layer.points,
        layer.fill,
        layer.stroke,
        layer.closed !== false,
      );
    }
  });

  ctx.clearRect(0, 0, GATHER_SPRITE_SIZE, GATHER_SPRITE_SIZE);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(pixelCanvas, 0, 0, GATHER_SPRITE_SIZE, GATHER_SPRITE_SIZE);
  return true;
}

function drawGatherItemSprite(ctx, itemOrSprite) {
  if (
    itemOrSprite &&
    typeof itemOrSprite === "object" &&
    drawDynamicGatherVisual(ctx, itemOrSprite.visual)
  ) {
    return;
  }

  const spriteId =
    typeof itemOrSprite === "string" ? itemOrSprite : itemOrSprite?.sprite;
  const S = 2; // scale factor
  const px = (x, y, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x * S, y * S, S, S);
  };
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x * S, y * S, w * S, h * S);
  };

  switch (spriteId) {
    // ── Living Room items ───────────────────────────
    case "key": {
      // Golden key
      rect(3, 3, 4, 4, "#ffd700"); // head ring
      rect(4, 4, 2, 2, "#1a1a2e"); // ring hole
      rect(7, 5, 5, 2, "#ffd700"); // shaft
      px(12, 5, "#daa520");
      px(12, 6, "#daa520"); // tip
      px(10, 7, "#ffd700");
      px(11, 7, "#ffd700"); // teeth
      px(10, 8, "#daa520");
      px(11, 8, "#daa520");
      rect(3, 3, 4, 1, "#fff8dc"); // highlight
      break;
    }
    case "book": {
      // Old brown book
      rect(3, 2, 10, 12, "#8b4513"); // cover
      rect(4, 3, 8, 10, "#f5deb3"); // pages
      rect(3, 2, 1, 12, "#654321"); // spine
      rect(4, 4, 6, 1, "#8b7355"); // text line
      rect(4, 6, 5, 1, "#8b7355"); // text line
      rect(4, 8, 7, 1, "#8b7355"); // text line
      rect(4, 10, 4, 1, "#8b7355"); // text line
      break;
    }
    case "letter": {
      // Sealed envelope
      rect(2, 4, 12, 8, "#f5f0e0"); // envelope body
      rect(2, 4, 12, 1, "#e0d8c8"); // top edge
      // Flap triangle
      px(2, 4, "#d4c8a8");
      px(3, 5, "#d4c8a8");
      px(4, 6, "#d4c8a8");
      px(13, 4, "#d4c8a8");
      px(12, 5, "#d4c8a8");
      px(11, 6, "#d4c8a8");
      // Red wax seal
      rect(6, 6, 4, 4, "#cc3333");
      rect(7, 7, 2, 2, "#ee5555");
      break;
    }
    case "vase": {
      // Cracked vase
      rect(6, 2, 4, 2, "#b87333"); // rim
      rect(5, 4, 6, 6, "#cd853f"); // body
      rect(6, 10, 4, 2, "#b87333"); // base
      px(7, 5, "#8b6914");
      px(8, 6, "#8b6914");
      px(7, 7, "#8b6914"); // crack
      rect(5, 4, 6, 1, "#daa520"); // highlight
      break;
    }
    case "spoon": {
      // Old spoon
      rect(6, 2, 4, 3, "#a8a8a8"); // bowl
      rect(7, 3, 2, 1, "#c8c8c8"); // bowl highlight
      rect(7, 5, 2, 8, "#909090"); // handle
      px(7, 12, "#787878");
      px(8, 12, "#787878"); // handle end
      break;
    }
    case "button": {
      // Round button
      rect(5, 4, 6, 6, "#8b7355"); // body
      px(5, 4, "transparent");
      px(10, 4, "transparent"); // round corners
      px(5, 9, "transparent");
      px(10, 9, "transparent");
      px(6, 6, "#1a1a2e");
      px(9, 6, "#1a1a2e"); // holes
      px(6, 8, "#1a1a2e");
      px(9, 8, "#1a1a2e");
      rect(6, 4, 4, 1, "#a0906e"); // highlight
      break;
    }

    // ── Park items ──────────────────────────────────
    case "flower": {
      // Colorful flower
      rect(7, 9, 2, 5, "#2d8b2d"); // stem
      px(5, 8, "#2d8b2d");
      px(6, 9, "#2d8b2d"); // leaf
      px(10, 10, "#2d8b2d");
      px(11, 9, "#2d8b2d"); // leaf
      rect(7, 4, 2, 2, "#ffdd00"); // center
      px(6, 3, "#ff6699");
      px(9, 3, "#ff6699"); // petals top
      px(5, 4, "#ff6699");
      px(10, 4, "#ff6699"); // petals side
      px(5, 5, "#ff6699");
      px(10, 5, "#ff6699");
      px(6, 6, "#ff6699");
      px(9, 6, "#ff6699"); // petals bottom
      px(7, 3, "#ff88aa");
      px(8, 3, "#ff88aa"); // top petals
      px(7, 6, "#ff88aa");
      px(8, 6, "#ff88aa"); // bottom petals
      break;
    }
    case "stone": {
      // Shiny gem stone
      rect(5, 5, 6, 5, "#6699cc"); // body
      rect(6, 4, 4, 1, "#7ab3e0"); // top facet
      rect(6, 10, 4, 1, "#4477aa"); // bottom
      px(5, 5, "#5588bb");
      px(10, 5, "#5588bb"); // side facets
      rect(6, 6, 2, 2, "#aaddff"); // shine
      px(7, 5, "#cceeFF"); // highlight
      break;
    }
    case "feather": {
      // Blue feather
      px(10, 2, "#3366cc");
      px(9, 3, "#3366cc");
      px(10, 3, "#4488dd");
      px(8, 4, "#3366cc");
      px(9, 4, "#4488dd");
      px(10, 4, "#5599ee");
      px(7, 5, "#3366cc");
      px(8, 5, "#4488dd");
      px(6, 6, "#2255bb");
      px(7, 6, "#3366cc");
      px(5, 7, "#2255bb");
      px(6, 7, "#3366cc");
      px(4, 8, "#1a44aa");
      px(5, 8, "#2255bb");
      px(3, 9, "#1a44aa");
      px(4, 9, "#e8e0d0"); // quill start
      px(3, 10, "#e8e0d0"); // quill
      px(2, 11, "#d8d0c0"); // quill tip
      break;
    }
    case "leaf": {
      // Dry brown leaf
      rect(6, 3, 4, 3, "#a0782c"); // top
      rect(5, 5, 6, 4, "#8b6914"); // body
      rect(6, 9, 4, 2, "#7a5c10"); // bottom
      rect(7, 4, 2, 6, "#9b7924"); // vein
      px(6, 6, "#9b7924");
      px(9, 7, "#9b7924"); // side veins
      rect(7, 11, 2, 3, "#654321"); // stem
      break;
    }
    case "branch": {
      // Crooked branch
      rect(2, 7, 3, 2, "#8b6914"); // left segment
      rect(5, 6, 4, 2, "#7a5c10"); // middle
      rect(9, 5, 3, 2, "#8b6914"); // right upper
      rect(9, 7, 3, 2, "#7a5c10"); // right lower fork
      px(12, 5, "#654321");
      px(12, 8, "#654321"); // tips
      px(1, 7, "#654321"); // left tip
      px(6, 5, "#9b7924"); // highlight
      break;
    }
    case "shell": {
      // Spiral shell
      rect(5, 5, 6, 5, "#e8d8b8"); // body
      rect(6, 4, 4, 1, "#f0e8d0"); // top
      rect(6, 10, 4, 1, "#d0c098"); // bottom
      // Spiral pattern
      px(7, 6, "#c8a878");
      px(8, 6, "#c8a878");
      px(9, 7, "#c8a878");
      px(9, 8, "#c8a878");
      px(8, 8, "#c8a878");
      px(7, 8, "#c8a878");
      px(6, 7, "#c8a878");
      px(7, 7, "#b89858"); // spiral center
      rect(6, 4, 2, 1, "#f8f0e0"); // highlight
      break;
    }

    // ── Airport items ───────────────────────────────
    case "passport": {
      // Blue passport booklet
      rect(3, 2, 10, 12, "#1a3a6a"); // cover
      rect(4, 3, 8, 10, "#f5f0e0"); // pages
      rect(3, 2, 1, 12, "#102850"); // spine
      rect(5, 4, 6, 6, "#e8e0d0"); // photo area
      rect(6, 5, 4, 3, "#d4c8b0"); // face placeholder
      rect(5, 10, 6, 1, "#aaa"); // text line
      rect(5, 12, 4, 1, "#aaa"); // text line
      break;
    }
    case "tag": {
      // Luggage tag
      rect(4, 3, 8, 10, "#f5e6c8"); // body
      rect(6, 1, 4, 3, "#f5e6c8"); // top tab
      rect(7, 2, 2, 1, "#1a1a2e"); // hole
      // String
      px(8, 1, "#888");
      px(8, 0, "#888");
      rect(5, 5, 6, 1, "#999"); // text line
      rect(5, 7, 5, 1, "#999"); // text line
      rect(5, 9, 6, 1, "#999"); // text line
      rect(4, 3, 8, 1, "#e0d0a8"); // highlight
      break;
    }
    case "ticket": {
      // Golden ticket
      rect(2, 5, 12, 6, "#ffd700"); // body
      rect(2, 5, 12, 1, "#fff8dc"); // top edge highlight
      rect(2, 10, 12, 1, "#daa520"); // bottom edge
      // Perforated line
      px(9, 5, "#daa520");
      px(9, 7, "#daa520");
      px(9, 9, "#daa520");
      // Text
      rect(3, 7, 5, 1, "#b8860b");
      rect(3, 9, 3, 1, "#b8860b");
      // Star
      px(11, 7, "#fff8dc");
      px(12, 7, "#fff8dc");
      px(11, 8, "#fff8dc");
      break;
    }
    case "receipt": {
      // Crumpled receipt
      rect(4, 2, 8, 12, "#f0ece0"); // body
      px(4, 2, "#e0d8c8");
      px(11, 2, "#e0d8c8"); // crumpled corners
      px(4, 13, "#e0d8c8");
      px(11, 13, "#d8d0c0");
      rect(5, 4, 6, 1, "#bbb"); // text
      rect(5, 6, 4, 1, "#bbb");
      rect(5, 8, 5, 1, "#bbb");
      rect(5, 10, 6, 1, "#999"); // total line (bold)
      px(6, 3, "#d8d0c0");
      px(9, 7, "#d8d0c0"); // crumple marks
      break;
    }
    case "card": {
      // Expired card
      rect(2, 4, 12, 8, "#d8d0c8"); // body
      rect(2, 4, 12, 3, "#998877"); // stripe
      rect(3, 8, 4, 2, "#c0b8a0"); // chip area
      rect(3, 8, 4, 1, "#b0a890"); // chip line
      rect(8, 9, 5, 1, "#999"); // number line
      // Red X for expired
      px(10, 5, "#cc3333");
      px(12, 5, "#cc3333");
      px(11, 6, "#cc3333");
      px(10, 7, "#cc3333");
      px(12, 7, "#cc3333");
      break;
    }
    case "brochure": {
      // Folded brochure
      rect(2, 3, 5, 10, "#e8e0d0"); // left panel
      rect(7, 3, 1, 10, "#d0c8b0"); // fold line
      rect(8, 3, 5, 10, "#f0ece0"); // right panel
      rect(3, 4, 3, 3, "#7ab87a"); // image placeholder
      rect(9, 4, 3, 3, "#7a9ebb"); // image placeholder
      rect(3, 8, 3, 1, "#aaa"); // text
      rect(3, 10, 3, 1, "#aaa");
      rect(9, 8, 3, 1, "#aaa"); // text
      rect(9, 10, 3, 1, "#aaa");
      break;
    }
    // ── Additional Living Room items ──────────────────
    case "candle": {
      rect(7, 8, 2, 6, "#f5e6c8"); // wax body
      rect(6, 13, 4, 1, "#d4c8a8"); // base
      rect(7, 7, 2, 1, "#e8d8b0"); // top
      px(7, 6, "#ff8800");
      px(8, 6, "#ffaa00"); // flame
      px(7, 5, "#ffcc44");
      px(8, 5, "#ffdd66"); // flame tip
      px(8, 4, "#ffee88"); // flame top
      break;
    }
    case "clock": {
      rect(5, 3, 6, 6, "#c0a870"); // body
      rect(6, 2, 4, 1, "#d0b880"); // top
      rect(6, 9, 4, 2, "#b09860"); // base
      rect(6, 4, 4, 4, "#f5f0e0"); // face
      px(8, 4, "#333");
      px(8, 7, "#333"); // 12, 6
      px(6, 6, "#333");
      px(9, 6, "#333"); // 9, 3
      px(8, 5, "#cc3333");
      px(7, 6, "#333"); // hands
      break;
    }
    case "cup": {
      rect(5, 4, 6, 7, "#e8e0d0"); // body
      rect(5, 4, 6, 1, "#d8d0c0"); // rim
      rect(5, 10, 6, 1, "#d0c8b0"); // base
      rect(11, 6, 2, 3, "#d8d0c0"); // handle
      px(12, 6, "#c8c0a8");
      px(12, 8, "#c8c0a8");
      px(7, 5, "#8b6914"); // crack line
      px(8, 6, "#8b6914");
      px(7, 7, "#8b6914");
      break;
    }
    case "cushion": {
      rect(3, 5, 10, 6, "#9966aa"); // body
      rect(4, 4, 8, 1, "#aa77bb"); // top puff
      rect(4, 11, 8, 1, "#885599"); // bottom
      rect(5, 6, 6, 4, "#aa77bb"); // center highlight
      px(6, 7, "#cc99dd");
      px(9, 7, "#cc99dd"); // tufts
      px(6, 9, "#cc99dd");
      px(9, 9, "#cc99dd");
      break;
    }
    case "frame": {
      rect(3, 2, 10, 12, "#b8860b"); // outer frame
      rect(4, 3, 8, 10, "#8b6914"); // inner frame
      rect(5, 4, 6, 8, "#f5f0e0"); // empty inside
      rect(5, 4, 6, 1, "#e8e0d0");
      rect(5, 11, 6, 1, "#e8e0d0");
      px(7, 7, "#ddd");
      px(8, 8, "#ddd"); // empty marks
      break;
    }
    case "scissors": {
      // Open scissors
      px(4, 3, "#888");
      px(5, 4, "#888");
      px(6, 5, "#888");
      px(7, 6, "#888"); // blade 1
      px(10, 3, "#888");
      px(9, 4, "#888");
      px(8, 5, "#888"); // blade 2
      rect(6, 7, 4, 1, "#666"); // pivot
      px(5, 8, "#cc3333");
      px(6, 9, "#cc3333");
      px(5, 10, "#cc3333"); // handle 1
      px(9, 8, "#cc3333");
      px(8, 9, "#cc3333");
      px(9, 10, "#cc3333"); // handle 2
      px(5, 11, "#cc3333");
      px(9, 11, "#cc3333");
      break;
    }
    case "coin": {
      rect(5, 4, 6, 6, "#daa520"); // body
      rect(6, 3, 4, 1, "#e8b830"); // top
      rect(6, 10, 4, 1, "#c89418"); // bottom
      px(5, 4, "#c89418");
      px(10, 4, "#c89418"); // rounded
      px(5, 9, "#c89418");
      px(10, 9, "#c89418");
      px(7, 6, "#f0d060");
      px(8, 6, "#f0d060"); // symbol
      px(7, 7, "#f0d060");
      px(8, 7, "#f0d060");
      break;
    }

    // ── Additional Park items ───────────────────────
    case "acorn": {
      rect(6, 3, 4, 3, "#8b6914"); // cap
      rect(7, 2, 2, 1, "#7a5c10"); // cap top
      px(8, 1, "#654321"); // stem
      rect(6, 6, 4, 5, "#daa520"); // nut body
      rect(7, 11, 2, 1, "#c89418"); // tip
      px(7, 4, "#9b7924");
      px(8, 4, "#9b7924"); // cap texture
      px(7, 7, "#e8c840"); // highlight
      break;
    }
    case "mushroom": {
      rect(5, 3, 6, 4, "#cc3333"); // cap
      rect(6, 2, 4, 1, "#dd4444"); // cap top
      px(6, 4, "#fff");
      px(9, 3, "#fff");
      px(7, 5, "#fff"); // spots
      rect(7, 7, 2, 5, "#f0e8d0"); // stem
      rect(6, 11, 4, 1, "#e0d8c0"); // base
      px(7, 8, "#f8f0e0"); // stem highlight
      break;
    }
    case "pinecone": {
      rect(6, 2, 4, 2, "#8b6914"); // top
      rect(5, 4, 6, 4, "#7a5c10"); // body upper
      rect(5, 8, 6, 3, "#654321"); // body lower
      rect(6, 11, 4, 1, "#5a4a1a"); // base
      // Scale pattern
      px(6, 4, "#9b7924");
      px(8, 4, "#9b7924");
      px(10, 4, "#9b7924");
      px(5, 6, "#9b7924");
      px(7, 6, "#9b7924");
      px(9, 6, "#9b7924");
      px(6, 8, "#8b6914");
      px(8, 8, "#8b6914");
      px(10, 8, "#8b6914");
      break;
    }
    case "butterfly": {
      // Butterfly with spread wings
      px(7, 5, "#333");
      px(8, 5, "#333"); // body
      px(7, 6, "#333");
      px(8, 6, "#333");
      px(7, 7, "#333");
      px(8, 7, "#333");
      // Left wing
      px(4, 4, "#ff88aa");
      px(5, 4, "#ff88aa");
      px(6, 4, "#ff88aa");
      px(4, 5, "#ff6699");
      px(5, 5, "#ff6699");
      px(6, 5, "#ff6699");
      px(5, 6, "#ff88aa");
      px(6, 6, "#ff88aa");
      // Right wing
      px(9, 4, "#ff88aa");
      px(10, 4, "#ff88aa");
      px(11, 4, "#ff88aa");
      px(9, 5, "#ff6699");
      px(10, 5, "#ff6699");
      px(11, 5, "#ff6699");
      px(9, 6, "#ff88aa");
      px(10, 6, "#ff88aa");
      // Antennae
      px(6, 3, "#333");
      px(9, 3, "#333");
      break;
    }
    case "nest": {
      rect(4, 8, 8, 3, "#8b6914"); // nest bowl
      rect(5, 7, 6, 1, "#9b7924"); // rim
      rect(5, 11, 6, 1, "#7a5c10"); // base
      // Twigs texture
      px(4, 9, "#a08030");
      px(6, 8, "#a08030");
      px(9, 9, "#a08030");
      px(11, 8, "#a08030");
      // Eggs
      px(6, 8, "#e8e0d0");
      px(8, 8, "#e8e0d0");
      px(7, 9, "#f0e8e0");
      break;
    }
    case "frog_statue": {
      rect(5, 6, 6, 5, "#808080"); // body
      rect(6, 5, 4, 1, "#909090"); // head top
      rect(6, 11, 4, 1, "#707070"); // base
      px(6, 6, "#a0a0a0");
      px(9, 6, "#a0a0a0"); // eyes
      px(6, 7, "#333");
      px(9, 7, "#333"); // pupils
      px(7, 9, "#909090");
      px(8, 9, "#909090"); // mouth line
      rect(4, 9, 2, 2, "#808080");
      rect(10, 9, 2, 2, "#808080"); // legs
      break;
    }
    case "seed": {
      rect(6, 5, 4, 6, "#8b6914"); // body
      rect(7, 4, 2, 1, "#9b7924"); // top
      rect(7, 11, 2, 1, "#7a5c10"); // bottom
      px(7, 6, "#a08030");
      px(8, 6, "#a08030"); // stripe
      px(7, 8, "#654321"); // dark line
      px(8, 7, "#b09040"); // highlight
      break;
    }

    // ── Additional Airport items ────────────────────
    case "headphones": {
      rect(5, 2, 6, 2, "#333"); // headband
      px(4, 3, "#333");
      px(11, 3, "#333"); // sides
      px(4, 4, "#333");
      px(11, 4, "#333");
      rect(3, 5, 3, 4, "#444"); // left cup
      rect(10, 5, 3, 4, "#444"); // right cup
      px(4, 6, "#666");
      px(11, 6, "#666"); // cup highlight
      rect(4, 9, 1, 1, "#555");
      rect(11, 9, 1, 1, "#555"); // cup base
      break;
    }
    case "bottle": {
      rect(7, 1, 2, 2, "#a0d0a0"); // cap
      rect(7, 3, 2, 2, "#c8e8f0"); // neck
      rect(5, 5, 6, 8, "#d0eef8"); // body
      rect(5, 13, 6, 1, "#b0d0e0"); // base
      px(6, 7, "#e8f4ff");
      px(7, 8, "#e8f4ff"); // reflection
      rect(6, 9, 4, 1, "#b0d8e8"); // label
      rect(6, 10, 4, 1, "#a0c8d8");
      break;
    }
    case "map": {
      rect(3, 3, 10, 10, "#f5e6c8"); // paper
      rect(3, 3, 10, 1, "#e0d0a8"); // top edge
      // Fold lines
      px(8, 3, "#d0c098");
      px(8, 4, "#d0c098");
      px(8, 5, "#d0c098");
      px(8, 6, "#d0c098");
      px(8, 7, "#d0c098");
      px(8, 8, "#d0c098");
      // Map markings
      px(5, 5, "#cc3333");
      px(5, 6, "#cc3333");
      px(6, 5, "#cc3333"); // X mark
      px(9, 8, "#4477aa");
      px(10, 9, "#4477aa");
      px(10, 7, "#4477aa"); // route
      rect(4, 10, 3, 1, "#8b6914"); // text line
      break;
    }
    case "suitcase": {
      rect(3, 5, 10, 7, "#6699cc"); // body
      rect(6, 3, 4, 2, "#5588bb"); // handle
      rect(7, 4, 2, 1, "#888"); // handle grip
      rect(3, 8, 10, 1, "#5588bb"); // strap
      px(7, 8, "#daa520");
      px(8, 8, "#daa520"); // buckle
      rect(3, 11, 10, 1, "#5080aa"); // base
      px(5, 12, "#444");
      px(10, 12, "#444"); // wheels
      break;
    }
    case "keychain": {
      rect(6, 2, 4, 4, "#c0c0c0"); // ring
      rect(7, 3, 2, 2, "#1a1a2e"); // ring hole
      rect(7, 6, 2, 1, "#aaa"); // chain link
      rect(6, 7, 4, 5, "#cc3333"); // fob body
      rect(7, 8, 2, 3, "#dd5555"); // fob highlight
      rect(6, 12, 4, 1, "#aa2222"); // fob base
      break;
    }
    case "sunglasses": {
      // Aviator-style sunglasses
      rect(2, 5, 5, 4, "#333"); // left lens
      rect(9, 5, 5, 4, "#333"); // right lens
      rect(7, 5, 2, 1, "#888"); // bridge
      px(1, 6, "#888");
      px(14, 6, "#888"); // arms
      px(3, 6, "#555");
      px(10, 6, "#555"); // lens shine
      rect(2, 5, 5, 1, "#444");
      rect(9, 5, 5, 1, "#444"); // top rims
      break;
    }
    case "charger": {
      rect(4, 2, 4, 5, "#333"); // plug head
      rect(5, 3, 2, 2, "#888"); // prongs area
      px(5, 3, "#ccc");
      px(6, 3, "#ccc"); // prongs
      rect(5, 7, 2, 1, "#444"); // cable start
      px(6, 8, "#444");
      px(5, 9, "#444");
      px(6, 10, "#444"); // cable curl
      px(5, 11, "#444");
      px(6, 12, "#444"); // cable end
      rect(5, 12, 3, 2, "#555"); // USB connector
      break;
    }

    default: {
      // Fallback: simple colored circle
      rect(5, 4, 6, 8, "#a080c0");
      rect(6, 3, 4, 1, "#b090d0");
      rect(6, 12, 4, 1, "#8060a0");
      px(7, 5, "#c8b0e0"); // highlight
      break;
    }
  }
}

function createBlockedTileHintTexture() {
  const SIZE = 24;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  ctx.strokeStyle = "#C2410C";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(7, 7);
  ctx.lineTo(17, 17);
  ctx.moveTo(17, 7);
  ctx.lineTo(7, 17);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 245, 230, 0.9)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8, 7);
  ctx.lineTo(17, 16);
  ctx.moveTo(16, 7);
  ctx.lineTo(7, 16);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

// ─── Pixel-art backpack icon (Three.js canvas sprite, JRPG style) ───────────
function BackpackIcon({ size = 28 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const RES = 64;
    canvas.width = RES;
    canvas.height = RES;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
    });
    renderer.setSize(RES, RES);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const half = RES / 2;
    const camera = new THREE.OrthographicCamera(
      -half,
      half,
      half,
      -half,
      0.1,
      100,
    );
    camera.position.z = 10;

    // 32×32 pixel-art canvas for a clear, chunky JRPG backpack
    const texCanvas = document.createElement("canvas");
    texCanvas.width = 32;
    texCanvas.height = 32;
    const ctx = texCanvas.getContext("2d");
    const px = (x, y, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    };
    const rect = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };

    // ── Straps ──
    rect(10, 1, 2, 4, "#6b3f1f"); // left strap
    rect(20, 1, 2, 4, "#6b3f1f"); // right strap
    px(10, 1, "#8b6040"); // strap highlights
    px(20, 1, "#8b6040");

    // ── Main body (rounded shape) ──
    rect(9, 5, 14, 20, "#c07840"); // main fill
    rect(8, 7, 1, 16, "#c07840"); // left round
    rect(23, 7, 1, 16, "#c07840"); // right round
    rect(10, 25, 12, 1, "#c07840"); // bottom round

    // ── Dark outline / border ──
    rect(9, 5, 14, 1, "#5a3018"); // top edge
    rect(8, 6, 1, 1, "#5a3018"); // top-left corner
    rect(23, 6, 1, 1, "#5a3018"); // top-right corner
    rect(7, 7, 1, 16, "#5a3018"); // left edge
    rect(24, 7, 1, 16, "#5a3018"); // right edge
    rect(8, 23, 1, 1, "#5a3018"); // bottom-left corner
    rect(23, 23, 1, 1, "#5a3018"); // bottom-right corner
    rect(9, 24, 1, 1, "#5a3018");
    rect(22, 24, 1, 1, "#5a3018");
    rect(10, 25, 12, 1, "#5a3018"); // bottom edge

    // ── Top flap ──
    rect(9, 5, 14, 4, "#d89050");
    rect(10, 4, 12, 1, "#d89050"); // flap peak
    rect(10, 4, 12, 1, "#e0a060"); // flap highlight
    rect(9, 5, 14, 1, "#e0a060"); // top highlight

    // ── Gold buckle / clasp ──
    rect(13, 8, 6, 3, "#ffd700");
    rect(14, 9, 4, 1, "#5a3018"); // buckle hole
    px(13, 8, "#ffec80"); // buckle shine
    px(14, 8, "#ffec80");

    // ── Front pocket ──
    rect(10, 13, 12, 8, "#a86030"); // pocket body
    rect(10, 13, 12, 1, "#b87040"); // pocket top highlight
    rect(10, 13, 1, 8, "#904820"); // pocket left shadow
    rect(21, 13, 1, 8, "#904820"); // pocket right shadow
    rect(10, 20, 12, 1, "#904820"); // pocket bottom shadow

    // ── Pocket buckle (small) ──
    rect(14, 12, 4, 2, "#ffd700");
    px(14, 12, "#ffec80");

    // ── Body shading ──
    rect(9, 6, 2, 4, "#d09858"); // left highlight
    rect(21, 6, 2, 12, "#a06030"); // right shadow
    rect(9, 22, 14, 2, "#a06030"); // bottom shadow

    const texture = new THREE.CanvasTexture(texCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const geo = new THREE.PlaneGeometry(RES, RES);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    renderer.render(scene, camera);

    return () => {
      geo.dispose();
      mat.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        display: "block",
      }}
    />
  );
}

const NPC_SPRITE_ROWS = [
  { id: "hamster", rowIndex: 0, name: "Sheilfer" },
  { id: "frog", rowIndex: 1, name: "Jiraiya" },
  { id: "purple-girl", rowIndex: 2, name: "Yoruichi" },
  { id: "cat", rowIndex: 3, name: "Neko" },
];

// ─── UI text per support language ────────────────────────────────────────────
const UI_TEXT = {
  en: {
    talkHint: "Press SPACE or tap to talk",
    correct: "Correct!",
    incorrect: "Try again!",
    completed: "Congratulations! You answered all questions correctly!",
    playAgain: "Play Again",
    back: "Back",
    progress: "Progress",
    answeredOf: "of",
    moveHint: "Arrow keys or WASD to move",
    touchMove: "Tap to move, tap NPC to talk",
    chooseScenario: "Choose a scenario",
    scenario: "Scenario",
    newWorld: "New World",
    quest: "Quest",
    lockedNpc: "You should start with",
    response: "Response",
    micStart: "Start mic",
    micStop: "Stop mic",
    heardYou: "I heard",
    speechUnavailable: "Speech unavailable in this browser",
    noSpeechMatch: "I didn't catch that. Try again.",
    continue: "Continue",
    skip: "Skip",
    loadingTutorialScene: "Loading tutorial scene...",
    loadingGeneratingGame: "Generating your game...",
  },
  es: {
    talkHint: "Presiona ESPACIO o toca para hablar",
    correct: "¡Correcto!",
    incorrect: "¡Inténtalo de nuevo!",
    completed: "¡Felicidades! ¡Respondiste todas las preguntas correctamente!",
    playAgain: "Jugar de nuevo",
    back: "Volver",
    progress: "Progreso",
    answeredOf: "de",
    moveHint: "Flechas o WASD para mover",
    touchMove: "Toca para mover, toca NPC para hablar",
    chooseScenario: "Elige un escenario",
    scenario: "Escenario",
    newWorld: "Nuevo mundo",
    quest: "Misión",
    lockedNpc: "Debes comenzar con",
    response: "Respuesta",
    micStart: "Iniciar mic",
    micStop: "Detener mic",
    heardYou: "Escuché",
    speechUnavailable: "Voz no disponible en este navegador",
    noSpeechMatch: "No entendí eso. Inténtalo otra vez.",
    continue: "Continuar",
    skip: "Saltar",
    loadingTutorialScene: "Cargando escena tutorial...",
    loadingGeneratingGame: "Generando tu juego...",
  },
};

const SCENARIO_EMOJIS = {
  [REVIEW_WORLD_ID]: "✨",
  [TUTORIAL_MAP_ID]: "👋",
};

const GAME_LOADING_MESSAGES = {
  en: [
    "Building your world...",
    "Placing NPCs...",
    "Writing quest dialogue...",
    "Generating vocabulary challenges...",
    "Designing the map layout...",
    "Preparing language puzzles...",
    "Setting the scene...",
    "Crafting your adventure...",
  ],
  es: [
    "Construyendo tu mundo...",
    "Colocando NPCs...",
    "Escribiendo diálogos de misión...",
    "Generando desafíos de vocabulario...",
    "Diseñando el mapa...",
    "Preparando acertijos de idiomas...",
    "Ambientando la escena...",
    "Creando tu aventura...",
  ],
};

const SCENARIO_OBJECT_VISUALS = {
  tree: { width: 1.3, height: 1.6, yOffset: 0.6, z: 2 },
  house: { width: 1.9, height: 2.6, yOffset: 0.68, z: 2.2 },
  building: { width: 1.95, height: 2.7, yOffset: 0.68, z: 2.2 },
  pavilion: { width: 1.75, height: 2.0, yOffset: 0.62, z: 2.05 },
  greenhouse: { width: 1.8, height: 2.2, yOffset: 0.64, z: 2.1 },
  doorway: { width: 1.35, height: 1.95, yOffset: 0.66, z: 2.08 },
  bookshelf: { width: 1.0, height: 1.3, yOffset: 0.55, z: 1.9 },
  shelf: { width: 1.0, height: 1.15, yOffset: 0.52, z: 1.8 },
  tv: { width: 1.0, height: 0.95, yOffset: 0.45, z: 1.7 },
  sofa: { width: 1.2, height: 0.95, yOffset: 0.45, z: 1.7 },
  plant: { width: 0.9, height: 1.1, yOffset: 0.5, z: 1.8 },
  table: { width: 1.1, height: 0.95, yOffset: 0.45, z: 1.7 },
  lamp: { width: 0.75, height: 1.15, yOffset: 0.55, z: 1.8 },
  sign: { width: 0.95, height: 1.15, yOffset: 0.55, z: 1.8 },
  gate: { width: 1.0, height: 1.15, yOffset: 0.55, z: 1.8 },
  speaker: { width: 0.95, height: 1.0, yOffset: 0.5, z: 1.8 },
  balloons: { width: 0.95, height: 1.15, yOffset: 0.6, z: 1.9 },
  desk: { width: 1.1, height: 0.95, yOffset: 0.45, z: 1.7 },
  suitcaseStack: { width: 0.95, height: 1.0, yOffset: 0.48, z: 1.8 },
  default: { width: 1.0, height: 1.0, yOffset: 0.5, z: 1.7 },
};

function parseLooseJSON(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through to relaxed extraction
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {
      // try array shape next
    }
  }

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function humanizeObjectType(type = "") {
  return String(type || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
}

function buildFallbackObjectExamineText(object) {
  const label = humanizeObjectType(object?.type) || "object";
  return {
    name: label,
    supportName: label,
    text: `It looks like a ${label}.`,
    supportText: `It looks like a ${label}.`,
  };
}

function findScenarioObjectAtTile(objects = [], tileX, tileY) {
  const candidates = objects
    .map((object) => {
      const visual =
        SCENARIO_OBJECT_VISUALS[object.type] || SCENARIO_OBJECT_VISUALS.default;
      const halfWidth = Math.max(0, Math.ceil((visual.width - 1) / 2));
      const verticalReach = Math.max(0, Math.ceil(visual.height - 1));
      const hitbox = {
        left: object.tx - halfWidth,
        right: object.tx + halfWidth,
        top: object.ty - verticalReach,
        bottom: object.ty,
      };
      const withinHitbox =
        tileX >= hitbox.left &&
        tileX <= hitbox.right &&
        tileY >= hitbox.top &&
        tileY <= hitbox.bottom;
      if (!withinHitbox) return null;

      return {
        object,
        score: Math.abs(object.tx - tileX) + Math.abs(object.ty - tileY),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score);

  return candidates[0]?.object || null;
}

const DIALOGUE_CHARACTER_POOLS = {
  hamster: ["33", "26", "25", "22"],
  frog: ["29", "32", "36"],
  cat: ["40", "38", "37", "28", "24"],
  "purple-girl": ["31", "39", "34"],
};

// ─── Animated text: fade-in per character ────────────────────────────────────
function splitIntoSentences(text) {
  if (!text) return [];
  const result = text.match(/[^.!?¡¿。！？]*[.!?。！？]+/g);
  if (!result) return text.trim() ? [text.trim()] : [];
  const joined = result.join("");
  const remainder = text.slice(joined.length).trim();
  if (remainder) result.push(remainder);
  return result.map((s) => s.trim()).filter(Boolean);
}

function textFromChunk(chunk) {
  try {
    if (!chunk) return "";
    if (typeof chunk.text === "function") return chunk.text() || "";
    if (typeof chunk.text === "string") return chunk.text;
    const cand = chunk.candidates?.[0];
    if (cand?.content?.parts?.length)
      return cand.content.parts.map((p) => p.text || "").join("");
  } catch {}
  return "";
}

function fillNamedTemplate(template, replacements = {}) {
  let output = String(template || "");
  Object.entries(replacements).forEach(([key, value]) => {
    output = output.replaceAll(`{{${key}}}`, String(value ?? ""));
  });
  return output;
}

function AnimatedText({ text, charDelayMs = 18, ...textProps }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const prevTextRef = useRef("");

  useEffect(() => {
    if (text !== prevTextRef.current) {
      prevTextRef.current = text;
      setVisibleCount(0);
    }
    if (!text) return;
    if (visibleCount >= text.length) return;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), charDelayMs);
    return () => clearTimeout(timer);
  }, [text, visibleCount, charDelayMs]);

  if (!text) return null;

  return (
    <Text {...textProps} whiteSpace="pre-wrap">
      {text.split("").map((ch, i) => (
        <span
          key={`${i}-${ch}`}
          style={{
            opacity: i < visibleCount ? 1 : 0,
            transition: "opacity 0.12s ease-in",
          }}
        >
          {ch}
        </span>
      ))}
    </Text>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function RPGGame({
  lessonContext = null,
  onComplete = null,
  initialScenario = null,
  onSkip = null,
  onScenarioReady = null,
  targetLang: targetLangProp = null,
  supportLang: supportLangProp = null,
}) {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const reviewContext = useMemo(
    () =>
      lessonContext?.gameReviewContext ||
      buildGameReviewContext({ lesson: lessonContext }),
    [lessonContext],
  );

  // CEFR proficiency level from lesson context - controls dialogue complexity
  const cefrLevel =
    reviewContext?.cefrLevel || lessonContext?.content?.game?.cefrLevel || null;
  const cefrDialogueRule = useMemo(() => {
    const rules = {
      "Pre-A1": {
        es: "IMPORTANTE: Nivel Pre-A1. Usa SOLO palabras sueltas o frases de 1-3 palabras. Sin conjugaciones complejas. Vocabulario muy básico (hola, sí, no, gracias, por favor, números 1-10, colores básicos). NO uses subjuntivo, condicional ni frases largas.",
        en: "IMPORTANT: Pre-A1 level. Use ONLY single words or 1-3 word phrases. No complex conjugations. Very basic vocabulary (hello, yes, no, thank you, please, numbers 1-10, basic colors). Do NOT use complex sentences.",
      },
      A1: {
        es: "IMPORTANTE: Nivel A1. Usa oraciones muy cortas y simples (máximo 5-8 palabras). Solo presente de indicativo. Vocabulario cotidiano básico. Frases como 'Me llamo...', '¿Dónde está...?', 'Quiero...'. NO uses subjuntivo, condicional, pasado complejo ni vocabulario avanzado.",
        en: "IMPORTANT: A1 level. Use very short, simple sentences (max 5-8 words). Present tense only. Basic everyday vocabulary. Phrases like 'My name is...', 'Where is...?', 'I want...'. Do NOT use subjunctive, conditional, complex past, or advanced vocabulary.",
      },
      A2: {
        es: "IMPORTANTE: Nivel A2. Oraciones simples y claras. Presente y pasado simple. Vocabulario cotidiano. Máximo 10-12 palabras por oración. Sin vocabulario rebuscado.",
        en: "IMPORTANT: A2 level. Simple, clear sentences. Present and simple past tense. Everyday vocabulary. Max 10-12 words per sentence. No fancy vocabulary.",
      },
      B1: {
        es: "Nivel B1. Puedes usar oraciones de complejidad moderada. Mezcla de tiempos permitida. Temas cotidianos y familiares.",
        en: "B1 level. You can use moderately complex sentences. Mix of tenses allowed. Everyday and familiar topics.",
      },
    };
    if (!cefrLevel) return { es: "", en: "" };
    return rules[cefrLevel] || { es: "", en: "" };
  }, [cefrLevel]);

  const localStorageSettings = useMemo(() => {
    try {
      return {
        targetLang: localStorage.getItem("userTargetLang") || "es",
        supportLang: localStorage.getItem("appLanguage") || "en",
      };
    } catch {
      return { targetLang: "es", supportLang: "en" };
    }
  }, []);

  const targetLang = normalizePracticeLanguage(
    targetLangProp ||
      lessonContext?.targetLang ||
      localStorageSettings.targetLang,
    "es",
  );
  const supportLang = normalizeSupportLanguage(
    supportLangProp || localStorageSettings.supportLang,
    "en",
  );
  const ui = UI_TEXT[supportLang] || UI_TEXT.en;
  const isMobileDialogueLayout =
    useBreakpointValue({ base: true, md: false }) ?? false;

  // Scenario selection - initialize from pre-generated scenario if provided
  const [scenarioId, setScenarioId] = useState(
    initialScenario ? initialScenario.id || "generated" : null,
  );
  const [scenario, setScenario] = useState(initialScenario || null);
  const [activeMapId, setActiveMapId] = useState(
    initialScenario?.startMapId || initialScenario?.id || null,
  );
  const [loadingScenarioId, setLoadingScenarioId] = useState(null);
  const [npcNameMap, setNpcNameMap] = useState(null);

  // Game state
  const [dialogue, setDialogue] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [questionMapping, setQuestionMapping] = useState({});
  const [lastHeardSpeech, setLastHeardSpeech] = useState("");
  const [generatingChoices, setGeneratingChoices] = useState(false);
  const [lineTranslations, setLineTranslations] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [dialogueBubblePosition, setDialogueBubblePosition] = useState(null);
  const [objectExamine, setObjectExamine] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedInvItem, setSelectedInvItem] = useState(null);
  const [gatherUnlocked, setGatherUnlocked] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const conversationLogRef = useRef([]);
  const pendingBridgeRef = useRef(null);
  const pendingNpcGreetingRef = useRef(null);
  const inventoryModal = useDisclosure();
  const helpChat = useDisclosure();
  const helpChatRef = useRef(null);
  const isTouchDevice = useRef(false);
  const levelCompleteSoundPlayedRef = useRef(false);
  const ttsPlayerRef = useRef(null);
  const preWarmedAudioRef = useRef(null);
  const gatherSpritesRef = useRef([]);
  const toast = useToast();
  const transitionCooldownUntilRef = useRef(0);
  const mapEntrySpawnRef = useRef(null);
  const npcAssignmentsCacheRef = useRef(null);
  const gatherPlacementCacheKeyRef = useRef(null);
  const objectExamineCacheRef = useRef(new Map());
  const objectExaminePendingMapsRef = useRef(new Set());

  const playSound = useSoundSettings((state) => state.playSound);
  const warmupAudio = useSoundSettings((state) => state.warmupAudio);

  const supportLangName = useMemo(
    () => getLanguagePromptName(supportLang) || supportLang,
    [supportLang],
  );
  const targetLangName = useMemo(
    () => getLanguagePromptName(targetLang) || targetLang,
    [targetLang],
  );
  const cefrPromptRule = useMemo(
    () => cefrDialogueRule.en || cefrDialogueRule.es || "",
    [cefrDialogueRule],
  );
  const strictTargetLanguageGuard = useMemo(
    () =>
      [
        `Target language: ${targetLangName} (code: ${targetLang}).`,
        `Support/UI language: ${supportLangName} (code: ${supportLang}). This is metadata only.`,
        `Write all learner-facing dialogue strictly in ${targetLangName}.`,
        `Do not use ${supportLangName}, Spanish, English, or any mixed-language output unless the target language is one of those languages.`,
      ].join("\n"),
    [supportLang, supportLangName, targetLang, targetLangName],
  );
  const reviewPromptContext = useMemo(
    () =>
      [
        reviewContext?.curriculumSummary
          ? `Review brief: ${reviewContext.curriculumSummary}`
          : "",
        reviewContext?.unitTitle
          ? `Current chapter/unit: ${reviewContext.unitTitle}.`
          : "",
        reviewContext?.lessonTitles?.length
          ? `Lessons being reviewed: ${reviewContext.lessonTitles
              .slice(0, 8)
              .join(", ")}.`
          : "",
        reviewContext?.reviewTerms?.length
          ? `Required review topics and vocabulary: ${reviewContext.reviewTerms
              .slice(0, 24)
              .join(", ")}.`
          : "",
        reviewContext?.reviewObjectives?.length
          ? `Keep the interactions tied to these objectives: ${reviewContext.reviewObjectives
              .slice(0, 8)
              .join(" | ")}.`
          : "",
        reviewContext?.isTutorial
          ? "Tutorial rule: greetings, saying your name, and other ultra-basic polite expressions only."
          : "",
        ["Pre-A1", "A1"].includes(cefrLevel || "")
          ? "Beginner rule: no dramatic missions, metaphors, abstract narration, or advanced sentence structures."
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    [cefrLevel, reviewContext],
  );
  const buildStrictDialoguePrompt = useCallback(
    (...sections) =>
      [
        cefrPromptRule,
        strictTargetLanguageGuard,
        reviewPromptContext,
        ...sections,
      ]
        .filter(Boolean)
        .join("\n"),
    [cefrPromptRule, reviewPromptContext, strictTargetLanguageGuard],
  );

  const getObjectExamineKey = useCallback(
    (map, object) =>
      `${map?.id || scenario?.id || "map"}:${object?.tx ?? 0},${object?.ty ?? 0}:${
        object?.type || "object"
      }`,
    [scenario?.id],
  );

  const requestObjectExamineTexts = useCallback(
    async (map, rawObjects = []) => {
      const objects = Array.isArray(rawObjects)
        ? rawObjects.filter(Boolean)
        : [];
      if (!map || !objects.length) return;

      const mapId = map.id || scenario?.id || "map";
      const uncachedObjects = objects.filter(
        (object) =>
          !objectExamineCacheRef.current.has(getObjectExamineKey(map, object)),
      );
      if (!uncachedObjects.length) return;
      if (objectExaminePendingMapsRef.current.has(mapId)) return;

      objectExaminePendingMapsRef.current.add(mapId);

      const mapName =
        typeof map.name === "string"
          ? map.name
          : map.name?.[targetLang] || map.name?.en || map.name?.es || "Area";
      const prompt = [
        cefrPromptRule,
        reviewPromptContext,
        `Target language: ${targetLangName} (code: ${targetLang}).`,
        `Support language: ${supportLangName} (code: ${supportLang}). Use it ONLY for the supportName and supportText fields.`,
        "You write short 'examine' descriptions for environmental objects in a language-learning RPG.",
        `For each object, write "name" and "text" in ${targetLangName}.`,
        `For each object, write "supportName" as the direct translation of the object name in ${supportLangName}.`,
        `For each object, write "supportText" as the direct translation of the context sentence in ${supportLangName}.`,
        "The text sentence should sound like the player quietly examining the object.",
        "Keep the object name short and clear.",
        "A little dry or playful humor is welcome, but keep it brief and readable.",
        "Do not mention quests, tasks, controls, objectives, or NPCs.",
        ["Pre-A1", "A1"].includes(cefrLevel || "")
          ? "For beginner levels, use very short, high-frequency sentences only."
          : "",
        `Current area: ${mapName}.`,
        map?.environment?.summary?.en
          ? `Area context: ${map.environment.summary.en}.`
          : "",
        'Return ONLY valid JSON in this exact shape: [{"key":"...","name":"...","supportName":"...","text":"...","supportText":"..."}].',
        `Objects:\n${JSON.stringify(
          uncachedObjects.map((object) => ({
            key: getObjectExamineKey(map, object),
            type: object.type,
            x: object.tx,
            y: object.ty,
          })),
        )}`,
      ]
        .filter(Boolean)
        .join("\n");

      try {
        const response = await callResponses({ input: prompt });
        const parsed = parseLooseJSON(response);
        const entries = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.items)
            ? parsed.items
            : [];
        const resolvedTexts = new Map();

        entries.forEach((entry) => {
          const key = String(entry?.key || "").trim();
          const name = String(entry?.name || entry?.label || "").trim();
          const supportName = String(
            entry?.supportName ||
              entry?.translation ||
              entry?.supportLabel ||
              "",
          ).trim();
          const supportText = String(
            entry?.supportText ||
              entry?.translatedText ||
              entry?.supportLine ||
              "",
          ).trim();
          const text = String(entry?.text || entry?.line || "").trim();
          if (!key || !text) return;
          resolvedTexts.set(key, {
            name: name.replace(/^["']|["']$/g, "").trim(),
            supportName: supportName.replace(/^["']|["']$/g, "").trim(),
            text: text.replace(/^["']|["']$/g, "").trim(),
            supportText: supportText.replace(/^["']|["']$/g, "").trim(),
          });
        });

        uncachedObjects.forEach((object) => {
          const key = getObjectExamineKey(map, object);
          const text =
            resolvedTexts.get(key) || buildFallbackObjectExamineText(object);
          objectExamineCacheRef.current.set(key, text);
        });

        setObjectExamine((current) => {
          if (!current) return current;
          const nextEntry = objectExamineCacheRef.current.get(current.key);
          return nextEntry
            ? {
                ...current,
                ...nextEntry,
                pending: false,
              }
            : current;
        });
      } catch {
        uncachedObjects.forEach((object) => {
          const key = getObjectExamineKey(map, object);
          objectExamineCacheRef.current.set(
            key,
            buildFallbackObjectExamineText(object),
          );
        });
        setObjectExamine((current) => {
          if (!current) return current;
          const nextEntry = objectExamineCacheRef.current.get(current.key);
          return nextEntry
            ? {
                ...current,
                ...nextEntry,
                pending: false,
              }
            : current;
        });
      } finally {
        objectExaminePendingMapsRef.current.delete(mapId);
      }
    },
    [
      cefrLevel,
      getObjectExamineKey,
      reviewPromptContext,
      scenario?.id,
      supportLang,
      supportLangName,
      targetLang,
      targetLangName,
      cefrPromptRule,
    ],
  );

  useEffect(() => {
    if (!scenario) {
      setActiveMapId(null);
      return;
    }

    setActiveMapId((prev) => {
      if (!Array.isArray(scenario.maps) || !scenario.maps.length) {
        return scenario.id || null;
      }
      if (prev && scenario.maps.some((entry) => entry.id === prev)) {
        return prev;
      }
      return scenario.startMapId || scenario.maps[0]?.id || scenario.id || null;
    });
  }, [scenario]);

  const activeMap = useMemo(() => {
    if (!scenario) return null;
    if (!Array.isArray(scenario.maps) || !scenario.maps.length) return scenario;
    return (
      scenario.maps.find((entry) => entry.id === activeMapId) ||
      scenario.maps.find((entry) => entry.id === scenario.startMapId) ||
      scenario.maps[0]
    );
  }, [activeMapId, scenario]);

  const activeMapNpcIndices = useMemo(() => {
    if (!scenario?.npcs?.length || !activeMap) return [];
    return scenario.npcs.reduce((list, npc, idx) => {
      const npcMapId = npc.mapId || scenario.startMapId || scenario.id;
      if (npcMapId === activeMap.id) list.push(idx);
      return list;
    }, []);
  }, [activeMap, scenario]);

  const activeMapNpcs = useMemo(
    () =>
      activeMapNpcIndices.map((idx) => scenario?.npcs?.[idx]).filter(Boolean),
    [activeMapNpcIndices, scenario],
  );

  const activeAreaLabel = useMemo(() => {
    if (!activeMap) return "";
    if (typeof activeMap.name === "string") return activeMap.name;
    return (
      activeMap.name?.[supportLang] ||
      activeMap.name?.en ||
      activeMap.name?.es ||
      ""
    );
  }, [activeMap, supportLang]);

  const flashBlockedTileHint = useCallback(
    (tx, ty) => {
      const hint = blockedTileHintRef.current;
      const mapHeight = gameStateRef.current?.mapH;
      const tileSize = activeMap?.tileSize || scenario?.tileSize || 32;
      if (!hint || !Number.isFinite(mapHeight)) return;
      hint.position.set(
        tx * tileSize + tileSize / 2,
        (mapHeight - 1 - ty) * tileSize + tileSize / 2,
        4.4,
      );
      hint.scale.set(1, 1, 1);
      hint.material.opacity = 0.95;
      hint.visible = true;
      blockedTileHintUntilRef.current = performance.now() + 260;
    },
    [activeMap?.tileSize, scenario?.tileSize],
  );

  useEffect(() => {
    objectExamineCacheRef.current = new Map();
    objectExaminePendingMapsRef.current = new Set();
    setObjectExamine(null);
  }, [scenario?.id]);

  useEffect(() => {
    if (!activeMap?.objects?.length) return;
    requestObjectExamineTexts(activeMap, activeMap.objects);
  }, [activeMap, requestObjectExamineTexts]);

  useEffect(() => {
    if (!objectExamine || objectExamine.pending) return undefined;
    const timer = setTimeout(() => {
      setObjectExamine((current) =>
        current?.openedAt === objectExamine.openedAt ? null : current,
      );
    }, 3600);
    return () => clearTimeout(timer);
  }, [objectExamine]);

  useEffect(() => {
    setObjectExamine(null);
  }, [activeMapId]);

  useEffect(() => {
    if (dialogue || gameComplete) {
      setObjectExamine(null);
    }
  }, [dialogue, gameComplete]);

  const toggleTranslation = useCallback(async () => {
    if (lineTranslations) {
      setLineTranslations(null);
      return;
    }

    const npcText =
      dialogue?.npcReply ||
      dialogue?.node?.npcLine ||
      dialogue?.node?.prompt ||
      dialogue?.question?.prompt ||
      "";
    if (!npcText.trim()) return;

    const lines = splitIntoSentences(npcText);
    if (!lines.length) return;

    setIsTranslating(true);
    const nextLines = Array(lines.length).fill("");
    setLineTranslations([...nextLines]);

    let receivedCount = 0;
    let lineBuffer = "";

    const applyLine = (rawLine) => {
      if (receivedCount >= lines.length) return;
      const clean = String(rawLine || "")
        .replace(/^\s*\d+[\).:-]\s*/, "")
        .trim();
      if (!clean) return;
      nextLines[receivedCount] = clean;
      receivedCount += 1;
      setLineTranslations([...nextLines]);
    };

    try {
      const prompt = [
        `Translate each line below into ${supportLangName}.`,
        "Output plain text only.",
        `Return exactly ${lines.length} line${lines.length > 1 ? "s" : ""}.`,
        "Each line must be only the translation for the matching line index.",
        "No numbering, labels, markdown, or commentary.",
        "",
        "Lines:",
        ...lines.map((l, i) => `${i + 1}. ${l}`),
      ].join("\n");

      if (simplemodel) {
        const resp = await simplemodel.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        for await (const chunk of resp.stream) {
          const ct = textFromChunk(chunk);
          if (!ct) continue;
          lineBuffer += ct;
          const segments = lineBuffer.split(/\r?\n/);
          lineBuffer = segments.pop() || "";
          for (const seg of segments) applyLine(seg);
        }
        if (lineBuffer.trim()) applyLine(lineBuffer);
      } else {
        const result = await callResponses({ input: prompt });
        const resultLines = (result || "")
          .split(/\r?\n/)
          .filter((l) => l.trim());
        for (const rl of resultLines) applyLine(rl);
      }
    } catch {
      setLineTranslations(null);
    } finally {
      setIsTranslating(false);
    }
  }, [dialogue, lineTranslations, supportLangName]);

  // Three.js refs
  const gameStateRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerSpriteRef = useRef(null);
  const npcSpritesRef = useRef([]);
  const npcIndicatorsRef = useRef([]);
  const npcSheetFramesRef = useRef(new Map());
  const animFrameRef = useRef(null);
  const mapDataRef = useRef(null);
  const walkFrameRef = useRef(0);
  const walkTimerRef = useRef(0);
  const playerSheetFramesRef = useRef(null);
  const npcVariantAssignmentsRef = useRef([]);
  const npcCharacterNamesRef = useRef([]);
  const npcDialogueCharactersRef = useRef(new Map());
  const blockedTileHintRef = useRef(null);
  const blockedTileHintUntilRef = useRef(0);

  const [questProgress, setQuestProgress] = useState({
    currentStepIdx: 0,
    currentNodeId: null,
  });

  const chooseRandomNPCVariants = useCallback((npcCount) => {
    const shuffled = [...NPC_SPRITE_ROWS].sort(() => Math.random() - 0.5);
    const desiredCount = Math.max(1, Math.min(npcCount, shuffled.length));

    return shuffled.slice(0, desiredCount).map((sheet) => ({
      ...sheet,
      modelIndex: Math.floor(Math.random() * 4),
    }));
  }, []);

  const createNPCTextureFromSheet = useCallback(
    (image, rowIndex, modelIndex) => {
      const width = image.width;
      const height = image.height;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0);

      const pixels = ctx.getImageData(0, 0, width, height).data;
      const isOpaque = (x, y) => pixels[(y * width + x) * 4 + 3] > 10;

      const visited = new Uint8Array(width * height);
      const components = [];
      const neighbors = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (visited[idx] || !isOpaque(x, y)) continue;

          const queue = [[x, y]];
          visited[idx] = 1;

          let minX = x;
          let minY = y;
          let maxX = x;
          let maxY = y;
          let size = 0;

          while (queue.length > 0) {
            const [cx, cy] = queue.pop();
            size += 1;
            minX = Math.min(minX, cx);
            minY = Math.min(minY, cy);
            maxX = Math.max(maxX, cx);
            maxY = Math.max(maxY, cy);

            neighbors.forEach(([dx, dy]) => {
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
              const nIdx = ny * width + nx;
              if (visited[nIdx] || !isOpaque(nx, ny)) return;
              visited[nIdx] = 1;
              queue.push([nx, ny]);
            });
          }

          // Ignore tiny sparkles/noise.
          if (size >= 24) {
            components.push({ minX, minY, maxX, maxY, size });
          }
        }
      }

      if (components.length === 0) return null;

      const expectedCols = 4;
      const expectedRows = 4;
      const clampedModelIndex = Math.max(
        0,
        Math.min(expectedCols - 1, modelIndex),
      );
      const clampedRowIndex = Math.max(0, Math.min(expectedRows - 1, rowIndex));
      const expectedCenterX =
        ((clampedModelIndex + 0.5) * width) / expectedCols;
      const expectedCenterY = ((clampedRowIndex + 0.5) * height) / expectedRows;

      components.sort((a, b) => {
        const aCenterX = (a.minX + a.maxX) / 2;
        const bCenterX = (b.minX + b.maxX) / 2;
        const aCenterY = (a.minY + a.maxY) / 2;
        const bCenterY = (b.minY + b.maxY) / 2;
        const aDist = Math.abs(aCenterX - expectedCenterX);
        const bDist = Math.abs(bCenterX - expectedCenterX);
        const aRowDist = Math.abs(aCenterY - expectedCenterY);
        const bRowDist = Math.abs(bCenterY - expectedCenterY);

        // Prioritize row match first, then model slot match, then size.
        if (Math.abs(aRowDist - bRowDist) > 6) return aRowDist - bRowDist;

        if (Math.abs(aDist - bDist) > 6) return aDist - bDist;
        return b.size - a.size;
      });

      const chosen = components[0];
      const pad = 2;
      const minX = Math.max(0, chosen.minX - pad);
      const minY = Math.max(0, chosen.minY - pad);
      const maxX = Math.min(width - 1, chosen.maxX + pad);
      const maxY = Math.min(height - 1, chosen.maxY + pad);

      const trimmedWidth = maxX - minX + 1;
      const trimmedHeight = maxY - minY + 1;
      const trimmedCanvas = document.createElement("canvas");
      trimmedCanvas.width = trimmedWidth;
      trimmedCanvas.height = trimmedHeight;
      const trimmedCtx = trimmedCanvas.getContext("2d");
      trimmedCtx.imageSmoothingEnabled = false;
      trimmedCtx.clearRect(0, 0, trimmedWidth, trimmedHeight);
      trimmedCtx.drawImage(
        canvas,
        minX,
        minY,
        trimmedWidth,
        trimmedHeight,
        0,
        0,
        trimmedWidth,
        trimmedHeight,
      );

      const texture = new THREE.CanvasTexture(trimmedCanvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;

      return {
        texture,
        aspect: trimmedWidth / trimmedHeight,
      };
    },
    [],
  );

  const buildPlayerSheetFrames = useCallback((sourceImage) => {
    const expectedRows = 5;
    const directionRows = {
      down: 0,
      up: 3,
      left: 2,
      right: 1,
      idle: 4,
    };

    const sample = document.createElement("canvas");
    sample.width = sourceImage.width;
    sample.height = sourceImage.height;
    const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
    sampleCtx.imageSmoothingEnabled = false;
    sampleCtx.drawImage(sourceImage, 0, 0);
    const pixels = sampleCtx.getImageData(
      0,
      0,
      sample.width,
      sample.height,
    ).data;

    const alphaAt = (x, y) => pixels[(y * sample.width + x) * 4 + 3] > 10;
    const toRuns = (occupied) => {
      const runs = [];
      let start = -1;
      for (let i = 0; i < occupied.length; i++) {
        if (occupied[i] && start === -1) start = i;
        if ((!occupied[i] || i === occupied.length - 1) && start !== -1) {
          const end = occupied[i] ? i : i - 1;
          if (end - start + 1 >= 2) runs.push({ start, end });
          start = -1;
        }
      }
      return runs;
    };

    const occupiedRows = Array.from({ length: sample.height }, (_, y) => {
      for (let x = 0; x < sample.width; x++) {
        if (alphaAt(x, y)) return true;
      }
      return false;
    });

    let rowRuns = toRuns(occupiedRows);
    if (rowRuns.length >= expectedRows) {
      rowRuns = rowRuns
        .sort((a, b) => b.end - b.start - (a.end - a.start))
        .slice(0, expectedRows)
        .sort((a, b) => a.start - b.start);
    }

    if (rowRuns.length < expectedRows) {
      const fallbackRowHeight = Math.floor(sourceImage.height / expectedRows);
      rowRuns = Array.from({ length: expectedRows }, (_, rowIdx) => {
        const start = rowIdx * fallbackRowHeight;
        const end =
          rowIdx === expectedRows - 1
            ? sourceImage.height - 1
            : start + fallbackRowHeight - 1;
        return { start, end };
      });
    }

    const rowFrames = rowRuns.map((row) => {
      const occupiedCols = Array.from({ length: sample.width }, (_, x) => {
        for (let y = row.start; y <= row.end; y++) {
          if (alphaAt(x, y)) return true;
        }
        return false;
      });
      const colRuns = toRuns(occupiedCols);
      return colRuns.length > 0
        ? colRuns
        : [{ start: 0, end: sample.width - 1 }];
    });

    const frameHeight = Math.max(...rowRuns.map((r) => r.end - r.start + 1));
    const frameWidth = Math.max(
      ...rowFrames.flat().map((r) => r.end - r.start + 1),
    );

    const createFrameTexture = (sx, sy, sw, sh) => {
      const canvas = document.createElement("canvas");
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, frameWidth, frameHeight);
      const dx = Math.floor((frameWidth - sw) / 2);
      const dy = Math.floor((frameHeight - sh) / 2);
      ctx.drawImage(sourceImage, sx, sy, sw, sh, dx, dy, sw, sh);
      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      return texture;
    };

    const makeAnimationsForRow = (rowIdx) => {
      const row = rowRuns[rowIdx] || rowRuns[0];
      const cols = rowFrames[rowIdx] || rowFrames[0];
      return cols.map((col) =>
        createFrameTexture(
          col.start,
          row.start,
          col.end - col.start + 1,
          row.end - row.start + 1,
        ),
      );
    };

    const animations = {
      idle: makeAnimationsForRow(directionRows.idle),
      right: makeAnimationsForRow(directionRows.right),
      left: makeAnimationsForRow(directionRows.left),
      up: makeAnimationsForRow(directionRows.up),
      down: makeAnimationsForRow(directionRows.down),
    };

    return {
      animations,
      frameWidth,
      frameHeight,
      frameCount: Math.max(...Object.values(animations).map((f) => f.length)),
      getFrame(direction = "down", frame = 0) {
        const frames = animations[direction] || animations.down;
        return frames[frame % frames.length] || animations.down[0];
      },
      dispose() {
        Object.values(animations).forEach((frames) => {
          frames.forEach((tex) => tex.dispose());
        });
      },
    };
  }, []);

  const questions = useMemo(() => {
    if (!scenario) return [];
    return (
      scenario.questions[targetLang] ||
      scenario.questions.en ||
      scenario.questions.es ||
      []
    );
  }, [scenario, targetLang]);

  const quest = scenario?.quest;
  const questSteps = useMemo(() => {
    const steps = quest?.steps || [];
    if (!npcNameMap || Object.keys(npcNameMap).length === 0) return steps;

    // Replace scenario NPC names with character names in all dialogue text
    const sub = (text) => {
      if (!text) return text;
      let result = text;
      for (const [oldName, newName] of Object.entries(npcNameMap)) {
        result = result.replaceAll(oldName, newName);
      }
      return result;
    };

    return steps.map((step) => ({
      ...step,
      title: sub(step.title),
      intro: sub(step.intro),
      nodes: step.nodes.map((node) => ({
        ...node,
        npcLine: sub(node.npcLine),
        playerLine: sub(node.playerLine),
        playerBridge: sub(node.playerBridge),
        speechFallbackReply: sub(node.speechFallbackReply),
        speechContinueReply: sub(node.speechContinueReply),
        gatherWrongItemTemplate: sub(node.gatherWrongItemTemplate),
        gatherItem: node.gatherItem
          ? {
              ...node.gatherItem,
              name: sub(node.gatherItem.name),
              hint: sub(node.gatherItem.hint),
            }
          : node.gatherItem,
        choices: node.choices?.map((c) => ({
          ...c,
          text: sub(c.text),
          npcReply: sub(c.npcReply),
        })),
      })),
    }));
  }, [quest, npcNameMap]);
  const totalSteps = questSteps.length;

  const playGameSound = useCallback(
    (name) => {
      void (async () => {
        await warmupAudio();
        await playSound(name);
      })();
    },
    [playSound, warmupAudio],
  );

  const examineScenarioObject = useCallback(
    (object) => {
      if (!activeMap || !object) return;
      const key = getObjectExamineKey(activeMap, object);
      const cachedEntry = objectExamineCacheRef.current.get(key);
      setObjectExamine({
        key,
        name: cachedEntry?.name || "",
        supportName: cachedEntry?.supportName || "",
        text: cachedEntry?.text || "",
        supportText: cachedEntry?.supportText || "",
        pending: !cachedEntry,
        openedAt: Date.now(),
      });
      requestObjectExamineTexts(activeMap, [object]);
      playGameSound("rpgDialogueOpen");
    },
    [activeMap, getObjectExamineKey, playGameSound, requestObjectExamineTexts],
  );

  // Generate a data URL for a gather item sprite (for UI display)
  const getItemSpriteDataURL = useCallback((itemOrSprite) => {
    const canvas = document.createElement("canvas");
    canvas.width = GATHER_SPRITE_SIZE;
    canvas.height = GATHER_SPRITE_SIZE;
    const ctx = canvas.getContext("2d");
    drawGatherItemSprite(ctx, itemOrSprite || "default");
    return canvas.toDataURL();
  }, []);

  // Show a quick toast when picking up an item
  const showPickupToast = useCallback(
    (itemName) => {
      toast({
        duration: 1500,
        isClosable: false,
        position: "bottom",
        render: () => (
          <HStack
            bg="gray.800"
            border="1px solid"
            borderColor="yellow.400"
            borderRadius="lg"
            px={3}
            py={2}
            spacing={2}
            justify="center"
            boxShadow="0 0 12px rgba(236,201,75,0.3)"
          >
            <Text color="yellow.300" fontSize="sm" fontWeight="bold">
              +
            </Text>
            <Text color="white" fontSize="sm">
              {itemName}
            </Text>
          </HStack>
        ),
      });
    },
    [toast],
  );

  const getDialogueCharacterForNPC = useCallback((npcIdx) => {
    const existingCharacter = npcDialogueCharactersRef.current.get(npcIdx);
    if (existingCharacter) return existingCharacter;

    const variantId = npcVariantAssignmentsRef.current[npcIdx];
    const pool =
      DIALOGUE_CHARACTER_POOLS[variantId] || DIALOGUE_CHARACTER_POOLS.fallback;
    const nextCharacter = pool[Math.floor(Math.random() * pool.length)] || "35";
    npcDialogueCharactersRef.current.set(npcIdx, nextCharacter);
    return nextCharacter;
  }, []);

  const closeDialogue = useCallback(() => {
    if (!dialogue) return;
    const player = ttsPlayerRef.current;
    if (player) {
      try {
        player.audio?.pause();
      } catch {
        /* ignore */
      }
      try {
        player.cleanup?.();
      } catch {
        /* ignore */
      }
    }
    ttsPlayerRef.current = null;
    playGameSound("click");
    setDialogue(null);
    setFeedback(null);
    setLineTranslations(null);
    setLastHeardSpeech("");
  }, [dialogue, playGameSound]);

  // Clear translation when dialogue node changes
  const dialogueNodeId = dialogue?.node?.id;
  const dialogueNpcReply = dialogue?.npcReply;
  useEffect(() => {
    setLineTranslations(null);
  }, [dialogueNodeId, dialogueNpcReply]);

  const updateDialogueBubblePosition = useCallback(() => {
    if (
      isMobileDialogueLayout ||
      !dialogue ||
      !canvasRef.current ||
      !cameraRef.current
    )
      return;

    const npcMesh = npcSpritesRef.current?.[dialogue.npcIdx];
    if (!npcMesh) return;

    const rect = canvasRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const anchorPoint = new THREE.Vector3(
      npcMesh.position.x,
      npcMesh.position.y +
        (activeMap?.tileSize || scenario?.tileSize || 32) * 0.55,
      npcMesh.position.z,
    ).project(cameraRef.current);

    const screenX = (anchorPoint.x * 0.5 + 0.5) * rect.width;
    const screenY = (-anchorPoint.y * 0.5 + 0.5) * rect.height;
    const preferredRight = screenX < rect.width * 0.58;

    const horizontalOffset = preferredRight ? 110 : -110;
    const margin = 16;
    const nextLeft = Math.max(
      margin,
      Math.min(rect.width - margin, screenX + horizontalOffset),
    );
    const nextTop = Math.max(
      margin,
      Math.min(rect.height - margin, screenY - 36),
    );

    setDialogueBubblePosition((prev) => {
      if (
        prev &&
        Math.abs(prev.left - nextLeft) < 0.5 &&
        Math.abs(prev.top - nextTop) < 0.5 &&
        prev.preferredRight === preferredRight
      ) {
        return prev;
      }
      return { left: nextLeft, top: nextTop, preferredRight };
    });
  }, [
    activeMap?.tileSize,
    dialogue,
    isMobileDialogueLayout,
    scenario?.tileSize,
  ]);

  useEffect(() => {
    if (!dialogue || isMobileDialogueLayout) {
      setDialogueBubblePosition(null);
      return undefined;
    }

    let rafId = 0;
    const tick = () => {
      updateDialogueBubblePosition();
      rafId = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [dialogue, isMobileDialogueLayout, updateDialogueBubblePosition]);

  const stopNPCSpeech = useCallback(() => {
    const player = ttsPlayerRef.current;
    if (player) {
      try {
        player.audio?.pause();
      } catch {
        /* ignore */
      }
      try {
        player.cleanup?.();
      } catch {
        /* ignore */
      }
    }
    ttsPlayerRef.current = null;
  }, []);

  const speakNPCText = useCallback(
    async (text, { warmAudio, npcIdx } = {}) => {
      if (!text) return;
      stopNPCSpeech();
      try {
        const characterId =
          npcIdx != null ? npcVariantAssignmentsRef.current[npcIdx] : undefined;
        const player = await getTTSPlayer({
          text,
          voice: characterId ? getCharacterVoice(characterId) : undefined,
          personality: characterId
            ? getCharacterPersonality(characterId)
            : undefined,
          langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
          warmAudio,
        });
        ttsPlayerRef.current = player;
        await player.ready;
        await player.audio.play();
      } catch {
        // non-blocking
      }
    },
    [stopNPCSpeech, targetLang],
  );

  const handleSelectScenario = useCallback(
    async (mapId) => {
      playGameSound("select");
      setLoadingScenarioId(mapId);
      setScenarioId(mapId);
      setDialogue(null);
      setFeedback(null);
      setActiveMapId(null);
      setGameComplete(false);
      setCompletedSteps(0);
      setQuestProgress({ currentStepIdx: 0, currentNodeId: null });
      setLoadingMsgIdx(0);
      mapEntrySpawnRef.current = null;
      transitionCooldownUntilRef.current = 0;
      npcAssignmentsCacheRef.current = null;
      gatherPlacementCacheKeyRef.current = null;

      // When lessonContext is provided, pass focused terms and CEFR level
      const gameContent = lessonContext?.content?.game;
      const overrideTerms = [
        ...(reviewContext?.reviewTerms || []),
        ...(gameContent?.focusPoints || []),
        ...(gameContent?.unitTopics || []),
        gameContent?.topic,
        gameContent?.unitTitle,
      ].filter(Boolean);

      const generated = await generateScenarioWithAI(
        mapId,
        targetLang,
        supportLang,
        overrideTerms.length ? overrideTerms : null,
        reviewContext?.cefrLevel || gameContent?.cefrLevel || null,
        reviewContext,
      );
      setScenario(generated);
      setActiveMapId(generated?.startMapId || generated?.id || null);
      if (typeof onScenarioReady === "function" && generated) {
        onScenarioReady(generated);
      }
      setQuestProgress({ currentStepIdx: 0, currentNodeId: null });
      setLoadingScenarioId(null);
      levelCompleteSoundPlayedRef.current = false;
      tutorialCompletionHandledRef.current = false;
    },
    [targetLang, supportLang, lessonContext, onScenarioReady, reviewContext],
  );

  // ─── Shuffle questions on scenario select ──────────────────────────────
  useEffect(() => {
    return () => {
      stopNPCSpeech();
    };
  }, [stopNPCSpeech]);

  const loadingMessages = GAME_LOADING_MESSAGES[supportLang] || GAME_LOADING_MESSAGES.en;

  useEffect(() => {
    if (!loadingScenarioId) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loadingScenarioId, loadingMessages]);

  useEffect(() => {
    const unlockAudio = () => {
      // Call Tone.start() synchronously inside the user gesture so the
      // browser treats it as user-initiated (required on iOS / mobile).
      Tone.start();
      void warmupAudio();
    };

    window.addEventListener("touchstart", unlockAudio, {
      passive: true,
      once: true,
    });
    window.addEventListener("pointerdown", unlockAudio, {
      passive: true,
      once: true,
    });

    return () => {
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("pointerdown", unlockAudio);
    };
  }, [warmupAudio]);

  useEffect(() => {
    if (!scenario || questions.length === 0) return;
    const indices = questions.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const mapping = {};
    scenario.npcs.forEach((_, idx) => {
      mapping[idx] = indices[idx % indices.length];
    });
    setQuestionMapping(mapping);
  }, [scenario, questions]);

  const getQuestionForNPC = useCallback(
    (npcIdx) => {
      const idx =
        questionMapping[npcIdx] !== undefined
          ? questionMapping[npcIdx]
          : npcIdx % questions.length;
      return questions[idx];
    },
    [questions, questionMapping],
  );

  // ─── Three.js setup (runs when scenario changes) ──────────────────────
  useEffect(() => {
    if (!canvasRef.current || !scenario || !activeMap) return;

    const seed = Date.now();
    const TILE = activeMap.tileSize || scenario.tileSize;
    const MAP_W = activeMap.mapWidth;
    const MAP_H = activeMap.mapHeight;
    const currentMapNpcs = activeMapNpcs;
    const currentMapTiles = activeMap.tiles || scenario.tiles;
    const currentMapPortals = activeMap.portals || [];
    const entrySpawn =
      mapEntrySpawnRef.current?.mapId === activeMap.id
        ? {
            x: mapEntrySpawnRef.current.x,
            y: mapEntrySpawnRef.current.y,
          }
        : activeMap.playerStart || scenario.playerStart;
    mapEntrySpawnRef.current = null;

    // Generate map
    const mapData =
      typeof activeMap.generate === "function" ? activeMap.generate(seed) : [];
    mapDataRef.current = mapData;

    const getTile = (x, y) => {
      if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return 2;
      return mapData[y * MAP_W + x];
    };
    const isSolid = (x, y) => {
      const t = getTile(x, y);
      const tileDef = currentMapTiles[t];
      return tileDef ? tileDef.solid : true;
    };

    // Init game state
    gameStateRef.current = {
      playerX: entrySpawn.x,
      playerY: entrySpawn.y,
      renderX: entrySpawn.x,
      renderY: entrySpawn.y,
      playerDir: "down",
      keysDown: new Set(),
      moveTimer: 0,
      idleHoldMs: 0,
      npcBobPhase: 0,
      getTile,
      isSolid,
      mapW: MAP_W,
      mapH: MAP_H,
    };

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(activeMap.ambientColor || scenario.ambientColor, 0);
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const fallbackPlayerTexture = createCharacterTexture(
      PLAYER_COLORS,
      "down",
      0,
    );
    const fallbackPlayerAspect = 0.9 / 1.2;
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      playerSpriteSheetUrl,
      (sheetTexture) => {
        sheetTexture.colorSpace = THREE.SRGBColorSpace;
        const frameSet = buildPlayerSheetFrames(sheetTexture.image);
        playerSheetFramesRef.current = frameSet;

        if (playerSpriteRef.current?.material) {
          const nextFrame = frameSet.getFrame(
            gameStateRef.current?.playerDir || "down",
            walkFrameRef.current,
          );
          playerSpriteRef.current.material.map = nextFrame;
          playerSpriteRef.current.material.needsUpdate = true;

          const detectedAspect = frameSet.frameWidth / frameSet.frameHeight;
          const widthScale = detectedAspect / fallbackPlayerAspect;
          playerSpriteRef.current.scale.set(widthScale, 1, 1);
        }
      },
      undefined,
      () => {
        playerSheetFramesRef.current = null;
        if (playerSpriteRef.current) {
          playerSpriteRef.current.scale.set(1, 1, 1);
        }
      },
    );

    // Camera
    const aspect = width / height;
    const viewH = 10 * TILE; // Show ~10 tiles vertically
    const viewW = viewH * aspect;
    const camera = new THREE.OrthographicCamera(
      -viewW / 2,
      viewW / 2,
      viewH / 2,
      -viewH / 2,
      0.1,
      1000,
    );
    camera.position.set(
      entrySpawn.x * TILE + TILE / 2,
      (MAP_H - 1 - entrySpawn.y) * TILE + TILE / 2,
      100,
    );
    cameraRef.current = camera;

    // ── Build tiles ─────────────────────────────────────────────────────
    const tileGroup = new THREE.Group();
    const spriteGroup = new THREE.Group();
    const decalGroup = new THREE.Group();
    const objectGroup = new THREE.Group();
    const TILE_OVERDRAW = 0.35;

    const mapDecorTheme = activeMap.environment?.decorKinds?.length
      ? activeMap.environment.decorKinds
      : activeMap.id === "park"
        ? ["grass_tuft", "flower_patch", "stones"]
        : activeMap.id === "livingRoom"
          ? ["wood_scraps", "paper_bits"]
          : ["paper_bits", "stones"];

    // Track house clusters to avoid duplicate sprites
    const visitedClusters = new Set();

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tileType = getTile(x, y);
        const tileDef = currentMapTiles[tileType];
        if (!tileDef) continue;
        if (tileDef.void) continue;

        // Base tile (always draw ground underneath solid objects)
        const groundDef = currentMapTiles[0];
        if (tileDef.solid && groundDef && !groundDef.void) {
          const groundTex = createTileTexture(groundDef, x, y, seed);
          const groundGeo = new THREE.PlaneGeometry(
            TILE + TILE_OVERDRAW,
            TILE + TILE_OVERDRAW,
          );
          const groundMat = new THREE.MeshBasicMaterial({ map: groundTex });
          const groundMesh = new THREE.Mesh(groundGeo, groundMat);
          groundMesh.position.set(
            x * TILE + TILE / 2,
            (MAP_H - 1 - y) * TILE + TILE / 2,
            0,
          );
          tileGroup.add(groundMesh);
        }

        // Tile surface
        if (!tileDef.sprite) {
          const tex = createTileTexture(tileDef, x, y, seed);
          const geo = new THREE.PlaneGeometry(
            TILE + TILE_OVERDRAW,
            TILE + TILE_OVERDRAW,
          );
          const mat = new THREE.MeshBasicMaterial({ map: tex });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(
            x * TILE + TILE / 2,
            (MAP_H - 1 - y) * TILE + TILE / 2,
            tileDef.solid ? 0.5 : 0,
          );
          tileGroup.add(mesh);
        }

        // Sprite objects
        if (tileDef.sprite) {
          // Houses are 2x2 - only draw once per cluster
          if (tileDef.sprite === "house") {
            const clusterKey = `${Math.floor(x / 2) * 2},${Math.floor(y / 2) * 2}`;
            if (visitedClusters.has(clusterKey)) continue;
            visitedClusters.add(clusterKey);

            const spriteTex = createSpriteTexture(
              "house",
              seed + x * 7 + y * 13,
            );
            if (spriteTex) {
              const sGeo = new THREE.PlaneGeometry(TILE * 2.4, TILE * 3);
              const sMat = new THREE.MeshBasicMaterial({
                map: spriteTex,
                transparent: true,
              });
              const sMesh = new THREE.Mesh(sGeo, sMat);
              sMesh.position.set(
                x * TILE + TILE,
                (MAP_H - 1 - y) * TILE + TILE * 0.5,
                3,
              );
              spriteGroup.add(sMesh);
            }
            continue;
          }

          // Fountain is 2x2
          if (tileDef.sprite === "fountain") {
            const clusterKey = `f${Math.floor(x / 2) * 2},${Math.floor(y / 2) * 2}`;
            if (visitedClusters.has(clusterKey)) continue;
            visitedClusters.add(clusterKey);

            const spriteTex = createSpriteTexture("fountain", seed + x + y);
            if (spriteTex) {
              const sGeo = new THREE.PlaneGeometry(TILE * 2, TILE * 2);
              const sMat = new THREE.MeshBasicMaterial({
                map: spriteTex,
                transparent: true,
              });
              const sMesh = new THREE.Mesh(sGeo, sMat);
              sMesh.position.set(
                x * TILE + TILE,
                (MAP_H - 1 - y) * TILE + TILE * 0.2,
                3,
              );
              spriteGroup.add(sMesh);
            }
            continue;
          }

          const spriteTex = createSpriteTexture(
            tileDef.sprite,
            seed + x * 7 + y * 13,
          );
          if (spriteTex) {
            const isTree = tileDef.sprite === "tree";
            const w = isTree ? TILE * 1.3 : TILE;
            const h = isTree ? TILE * 1.6 : TILE;
            const sGeo = new THREE.PlaneGeometry(w, h);
            const sMat = new THREE.MeshBasicMaterial({
              map: spriteTex,
              transparent: true,
            });
            const sMesh = new THREE.Mesh(sGeo, sMat);
            sMesh.position.set(
              x * TILE + TILE / 2,
              (MAP_H - 1 - y) * TILE + (isTree ? TILE * 0.6 : TILE / 2),
              isTree ? 2 : 1.5,
            );
            spriteGroup.add(sMesh);
          }
        }
      }
    }
    const addGroundDecor = (x, y, tileType) => {
      const tileDef = currentMapTiles[tileType];
      if (!tileDef || tileDef.solid || tileDef.sprite) return;
      if (Math.random() > 0.3) return;

      const decorKind =
        mapDecorTheme[Math.floor(Math.random() * mapDecorTheme.length)];
      const decorTex = createGroundDecalTexture(
        decorKind,
        seed + x * 113 + y * 197,
      );
      const decorGeo = new THREE.PlaneGeometry(TILE * 0.72, TILE * 0.72);
      const decorMat = new THREE.MeshBasicMaterial({
        map: decorTex,
        transparent: true,
      });
      const decorMesh = new THREE.Mesh(decorGeo, decorMat);
      decorMesh.position.set(
        x * TILE + TILE * 0.5 + (Math.random() - 0.5) * TILE * 0.2,
        (MAP_H - 1 - y) * TILE +
          TILE * 0.5 +
          (Math.random() - 0.5) * TILE * 0.15,
        0.8,
      );
      decalGroup.add(decorMesh);
    };

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        addGroundDecor(x, y, getTile(x, y));
      }
    }

    (activeMap.objects || []).forEach((object, idx) => {
      const spriteTex = createSpriteTexture(
        object.type,
        seed + idx * 211 + object.tx * 17 + object.ty * 29,
      );
      if (!spriteTex) return;

      const visual =
        SCENARIO_OBJECT_VISUALS[object.type] || SCENARIO_OBJECT_VISUALS.default;
      const sGeo = new THREE.PlaneGeometry(
        TILE * visual.width,
        TILE * visual.height,
      );
      const sMat = new THREE.MeshBasicMaterial({
        map: spriteTex,
        transparent: true,
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(
        object.tx * TILE + TILE / 2,
        (MAP_H - 1 - object.ty) * TILE + TILE * visual.yOffset,
        visual.z,
      );
      objectGroup.add(sMesh);
    });

    scene.add(tileGroup);
    scene.add(decalGroup);
    scene.add(spriteGroup);
    scene.add(objectGroup);

    const blockedHintTex = createBlockedTileHintTexture();
    const blockedHintGeo = new THREE.PlaneGeometry(TILE * 0.7, TILE * 0.7);
    const blockedHintMat = new THREE.MeshBasicMaterial({
      map: blockedHintTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.95,
    });
    const blockedHintMesh = new THREE.Mesh(blockedHintGeo, blockedHintMat);
    blockedHintMesh.visible = false;
    blockedHintMesh.position.set(0, 0, 4.4);
    scene.add(blockedHintMesh);
    blockedTileHintRef.current = blockedHintMesh;

    // ── Player sprite ─────────────────────────────────────────────────────
    const playerTex = fallbackPlayerTexture;
    const PLAYER_WIDTH_TILES = 0.9;
    const PLAYER_HEIGHT_TILES = 1.2;
    const PLAYER_FOOT_MARGIN_TILES = 0.02;
    const playerVerticalOffset =
      TILE * ((PLAYER_HEIGHT_TILES - 1) / 2 + PLAYER_FOOT_MARGIN_TILES);
    const playerGeo = new THREE.PlaneGeometry(
      TILE * PLAYER_WIDTH_TILES,
      TILE * PLAYER_HEIGHT_TILES,
    );
    const playerMat = new THREE.MeshBasicMaterial({
      map: playerTex,
      transparent: true,
    });
    const playerSprite = new THREE.Mesh(playerGeo, playerMat);
    playerSprite.position.set(
      entrySpawn.x * TILE + TILE / 2,
      (MAP_H - 1 - entrySpawn.y) * TILE + TILE / 2 + playerVerticalOffset,
      5,
    );
    scene.add(playerSprite);
    playerSpriteRef.current = playerSprite;

    const scenarioNpcCount = scenario.npcs.length;
    const assignmentKey = [
      scenario.id || "scenario",
      scenarioNpcCount,
      scenario.quest?.storySeed || "",
      scenario.name?.en || scenario.name?.es || "",
    ].join(":");
    let npcAssignments =
      npcAssignmentsCacheRef.current?.key === assignmentKey
        ? npcAssignmentsCacheRef.current.items
        : null;
    if (!npcAssignments) {
      const selectedNPCVariants = chooseRandomNPCVariants(scenarioNpcCount);
      npcAssignments = scenario.npcs.map(
        (_, index) => selectedNPCVariants[index % selectedNPCVariants.length],
      );
      npcAssignmentsCacheRef.current = {
        key: assignmentKey,
        items: npcAssignments,
      };
    }
    const selectedNPCVariants = Array.from(
      new Map(
        npcAssignments.map((assignment) => [assignment.id, assignment]),
      ).values(),
    );
    const NPC_WIDTH_TILES = 0.9;
    const NPC_HEIGHT_TILES = 1.2;
    const NPC_BASE_SCALE = 0.92;
    const NPC_FOOT_MARGIN_TILES = 0.02;
    const npcVerticalOffset =
      TILE * ((NPC_HEIGHT_TILES - 1) / 2 + NPC_FOOT_MARGIN_TILES);

    // ── NPC sprites ───────────────────────────────────────────────────────
    const npcSprites = Array(scenario.npcs.length).fill(null);
    const npcIndicators = Array(scenario.npcs.length).fill(null);
    npcVariantAssignmentsRef.current = npcAssignments.map(
      (assignment) => assignment.id,
    );
    npcCharacterNamesRef.current = npcAssignments.map(
      (assignment) => assignment.name,
    );
    // Build scenario-name → character-name mapping for quest dialogue substitution
    const nameMapping = {};
    scenario.npcs.forEach((npc, idx) => {
      const charName = npcAssignments[idx % npcAssignments.length]?.name;
      if (charName && npc.name !== charName) {
        nameMapping[npc.name] = charName;
      }
    });
    setNpcNameMap(nameMapping);
    npcDialogueCharactersRef.current.clear();
    activeMapNpcIndices.forEach((npcIdx) => {
      const npc = scenario.npcs[npcIdx];
      const preset =
        NPC_PRESETS[Math.floor(Math.random() * NPC_PRESETS.length)];
      const npcTex = createCharacterTexture(preset, "down", 0);
      const npcGeo = new THREE.PlaneGeometry(
        TILE * NPC_WIDTH_TILES,
        TILE * NPC_HEIGHT_TILES,
      );
      const npcMat = new THREE.MeshBasicMaterial({
        map: npcTex,
        transparent: true,
      });
      const npcMesh = new THREE.Mesh(npcGeo, npcMat);
      npcMesh.position.set(
        npc.tx * TILE + TILE / 2,
        (MAP_H - 1 - npc.ty) * TILE + TILE / 2 + npcVerticalOffset,
        4,
      );
      scene.add(npcMesh);
      npcSprites[npcIdx] = npcMesh;

      // Indicator
      const indTex = createNPCIndicatorTexture();
      const indGeo = new THREE.PlaneGeometry(TILE * 0.5, TILE * 0.6);
      const indMat = new THREE.MeshBasicMaterial({
        map: indTex,
        transparent: true,
      });
      const indicator = new THREE.Mesh(indGeo, indMat);
      indicator.position.set(
        npc.tx * TILE + TILE / 2,
        (MAP_H - 1 - npc.ty) * TILE + TILE * 1.15,
        6,
      );
      scene.add(indicator);
      npcIndicators[npcIdx] = indicator;
    });

    textureLoader.load(
      npcSpriteSheetUrl,
      (sheetTexture) => {
        sheetTexture.colorSpace = THREE.SRGBColorSpace;
        selectedNPCVariants.forEach((variant) => {
          const npcTexture = createNPCTextureFromSheet(
            sheetTexture.image,
            variant.rowIndex,
            variant.modelIndex,
          );
          if (!npcTexture) return;

          npcSheetFramesRef.current.set(variant.id, npcTexture.texture);

          const fallbackNPCAspect = 1.05 / 1.45;
          const widthScale = Math.max(
            0.45,
            Math.min(1.4, npcTexture.aspect / fallbackNPCAspect),
          );

          npcAssignments.forEach((assignment, index) => {
            if (assignment.id !== variant.id) return;
            const npcMesh = npcSprites[index];
            if (!npcMesh?.material) return;
            npcMesh.material.map = npcTexture.texture;
            npcMesh.material.needsUpdate = true;
            npcMesh.scale.set(widthScale * NPC_BASE_SCALE, NPC_BASE_SCALE, 1);
          });
        });
      },
      undefined,
      () => {
        // Keep generated fallback sprites for NPCs if loading fails.
      },
    );

    npcSpritesRef.current = npcSprites;
    npcIndicatorsRef.current = npcIndicators;

    // ── Gather item sprites (correct + decoy, start hidden) ─────────────
    const gatherData = scenario.quest?.gatherData;
    const allGatherItems = gatherData?.all || [];
    if (
      Array.isArray(scenario.gatherPlacements) &&
      scenario.gatherPlacements.length > 0
    ) {
      const gatherPlacementKey = [
        scenario.id || "scenario",
        scenario.quest?.storySeed || "",
        scenario.gatherPlacements.length,
        scenario.gatherPlacements.map((item) => item.name).join("|"),
      ].join(":");
      if (
        gatherPlacementCacheKeyRef.current !== gatherPlacementKey ||
        !Array.isArray(gatherSpritesRef.current) ||
        gatherSpritesRef.current.length !== scenario.gatherPlacements.length
      ) {
        gatherPlacementCacheKeyRef.current = gatherPlacementKey;
        gatherSpritesRef.current = scenario.gatherPlacements.map((item) => ({
          ...item,
          collected: !!item.collected,
          mesh: null,
        }));
      }

      gatherSpritesRef.current.forEach((item) => {
        if ((item.mapId || activeMap.id) !== activeMap.id) return;
        const canvas = document.createElement("canvas");
        canvas.width = GATHER_SPRITE_SIZE;
        canvas.height = GATHER_SPRITE_SIZE;
        const ctx = canvas.getContext("2d");
        drawGatherItemSprite(ctx, item);

        const itemTex = new THREE.CanvasTexture(canvas);
        itemTex.magFilter = THREE.NearestFilter;
        itemTex.minFilter = THREE.NearestFilter;
        const itemGeo = new THREE.PlaneGeometry(TILE * 0.85, TILE * 0.85);
        const itemMat = new THREE.MeshBasicMaterial({
          map: itemTex,
          transparent: true,
        });
        const itemMesh = new THREE.Mesh(itemGeo, itemMat);
        itemMesh.position.set(
          item.tx * TILE + TILE / 2,
          (MAP_H - 1 - item.ty) * TILE + TILE / 2,
          3,
        );
        itemMesh.visible = gatherUnlocked && !item.collected;
        scene.add(itemMesh);
        item.mesh = itemMesh;
      });
    } else if (allGatherItems.length > 0) {
      const playerStart = activeMap.playerStart || scenario.playerStart;
      const placed = [];
      const occupied = new Set();
      currentMapNpcs.forEach((n) => occupied.add(`${n.tx},${n.ty}`));
      occupied.add(`${playerStart.x},${playerStart.y}`);

      allGatherItems.forEach((item) => {
        let tx;
        let ty;
        let attempts = 0;
        do {
          tx = 2 + Math.floor(Math.random() * (MAP_W - 4));
          ty = 2 + Math.floor(Math.random() * (MAP_H - 4));
          attempts++;
        } while (
          (isSolid(tx, ty) || occupied.has(`${tx},${ty}`)) &&
          attempts < 80
        );
        occupied.add(`${tx},${ty}`);

        const canvas = document.createElement("canvas");
        canvas.width = GATHER_SPRITE_SIZE;
        canvas.height = GATHER_SPRITE_SIZE;
        const ctx = canvas.getContext("2d");
        drawGatherItemSprite(ctx, item);

        const itemTex = new THREE.CanvasTexture(canvas);
        itemTex.magFilter = THREE.NearestFilter;
        itemTex.minFilter = THREE.NearestFilter;
        const itemGeo = new THREE.PlaneGeometry(TILE * 0.85, TILE * 0.85);
        const itemMat = new THREE.MeshBasicMaterial({
          map: itemTex,
          transparent: true,
        });
        const itemMesh = new THREE.Mesh(itemGeo, itemMat);
        itemMesh.position.set(
          tx * TILE + TILE / 2,
          (MAP_H - 1 - ty) * TILE + TILE / 2,
          3,
        );
        itemMesh.visible = false;
        scene.add(itemMesh);

        placed.push({
          ...item,
          mapId: activeMap.id,
          tx,
          ty,
          mesh: itemMesh,
          collected: false,
        });
      });

      gatherSpritesRef.current = placed;
    }

    // ── Game loop ─────────────────────────────────────────────────────────
    let lastTime = 0;
    const MOVE_COOLDOWN = 140;
    const IDLE_DELAY_MS = 400;

    function gameLoop(time) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
      const delta = time - lastTime;
      lastTime = time;

      const gs = gameStateRef.current;
      if (!gs) return;

      const blockedHint = blockedTileHintRef.current;
      if (blockedHint) {
        const remainingMs = blockedTileHintUntilRef.current - time;
        if (remainingMs > 0) {
          const progress = 1 - remainingMs / 260;
          const pulse = 1 + progress * 0.18;
          blockedHint.visible = true;
          blockedHint.scale.set(pulse, pulse, 1);
          blockedHint.material.opacity = Math.max(0.2, 0.95 - progress * 0.55);
        } else {
          blockedHint.visible = false;
        }
      }

      // Keep NPCs anchored in place (no floating bob).
      gs.npcBobPhase += delta * 0.003;
      npcSprites.forEach((sprite, i) => {
        if (!sprite) return;
        const npc = scenario.npcs[i];
        sprite.position.y =
          (MAP_H - 1 - npc.ty) * TILE + TILE / 2 + npcVerticalOffset;
      });
      npcIndicators.forEach((ind, i) => {
        if (!ind) return;
        const npc = scenario.npcs[i];
        ind.position.y = (MAP_H - 1 - npc.ty) * TILE + TILE * 1.15;
        // Pulse scale
        const pulse = 1 + Math.sin(gs.npcBobPhase * 2 + i) * 0.08;
        ind.scale.set(pulse, pulse, 1);
      });

      // Player movement
      gs.moveTimer -= delta;
      if (gs.moveTimer <= 0) {
        let dx = 0,
          dy = 0;
        if (gs.keysDown.has("ArrowUp") || gs.keysDown.has("w")) {
          dy = -1;
          gs.playerDir = "up";
        } else if (gs.keysDown.has("ArrowDown") || gs.keysDown.has("s")) {
          dy = 1;
          gs.playerDir = "down";
        } else if (gs.keysDown.has("ArrowLeft") || gs.keysDown.has("a")) {
          dx = -1;
          gs.playerDir = "left";
        } else if (gs.keysDown.has("ArrowRight") || gs.keysDown.has("d")) {
          dx = 1;
          gs.playerDir = "right";
        }

        if (dx !== 0 || dy !== 0) {
          const nx = gs.playerX + dx;
          const ny = gs.playerY + dy;
          const npcBlocking = currentMapNpcs.some(
            (n) => n.tx === nx && n.ty === ny,
          );
          if (!isSolid(nx, ny) && !npcBlocking) {
            gs.playerX = nx;
            gs.playerY = ny;
            gs.moveTimer = MOVE_COOLDOWN;
            gs.idleHoldMs = IDLE_DELAY_MS;

            // Walk animation frame
            walkTimerRef.current++;
            walkFrameRef.current = walkTimerRef.current % 6;

            const sheetFrames = playerSheetFramesRef.current;
            playerSprite.material.map = sheetFrames
              ? sheetFrames.getFrame(gs.playerDir, walkFrameRef.current)
              : createCharacterTexture(
                  PLAYER_COLORS,
                  gs.playerDir,
                  walkFrameRef.current,
                );
            playerSprite.material.needsUpdate = true;

            playGameSound("rpgStep");
            const currentPortal = currentMapPortals.find(
              (portal) => portal.tx === gs.playerX && portal.ty === gs.playerY,
            );
            if (currentPortal?.toMapId) {
              transitionCooldownUntilRef.current = performance.now() + 320;
              mapEntrySpawnRef.current = {
                mapId: currentPortal.toMapId,
                x: currentPortal.spawn?.x ?? 2,
                y: currentPortal.spawn?.y ?? 2,
              };
              setActiveMapId(currentPortal.toMapId);
              return;
            }
          } else {
            flashBlockedTileHint(nx, ny);
          }
        } else {
          gs.idleHoldMs = Math.max(0, (gs.idleHoldMs || 0) - delta);
          if (gs.idleHoldMs <= 0) {
            const sheetFrames = playerSheetFramesRef.current;
            if (sheetFrames) {
              playerSprite.material.map = sheetFrames.getFrame("idle", 0);
              playerSprite.material.needsUpdate = true;
            }
          }
        }
      }

      // Update player position with interpolation for smoother movement
      gs.renderX += (gs.playerX - gs.renderX) * 0.35;
      gs.renderY += (gs.playerY - gs.renderY) * 0.35;
      playerSprite.position.set(
        gs.renderX * TILE + TILE / 2,
        (MAP_H - 1 - gs.renderY) * TILE + TILE / 2 + playerVerticalOffset,
        5,
      );

      // Check gather item pickup (only when gather quest is active)
      gatherSpritesRef.current.forEach((item) => {
        if ((item.mapId || activeMap.id) !== activeMap.id) return;
        if (item.collected || !item.mesh?.visible) return;
        if (gs.playerX === item.tx && gs.playerY === item.ty) {
          item.collected = true;
          item.mesh.visible = false;
          setInventory((prev) => [
            ...prev,
            {
              name: item.name,
              isCorrect: item.isCorrect,
              sprite: item.sprite || "default",
              visual: item.visual || null,
            },
          ]);
          playGameSound("rpgDialogueSelect");
          showPickupToast(item.name);
        }
      });

      // Pulse visible gather items
      gatherSpritesRef.current.forEach((item) => {
        if ((item.mapId || activeMap.id) !== activeMap.id) return;
        if (item.collected || !item.mesh?.visible) return;
        const pulse = 1 + Math.sin(time * 0.004) * 0.15;
        item.mesh.scale.set(pulse, pulse, 1);
      });

      // Camera follow (smooth)
      const camTargetX = gs.renderX * TILE + TILE / 2;
      const camTargetY = (MAP_H - 1 - gs.renderY) * TILE + TILE / 2;
      camera.position.x += (camTargetX - camera.position.x) * 0.1;
      camera.position.y += (camTargetY - camera.position.y) * 0.1;

      renderer.render(scene, camera);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);

    // ── Input handling ────────────────────────────────────────────────────
    const handleKeyDown = (e) => {
      if (gameStateRef.current) gameStateRef.current.keysDown.add(e.key);
    };
    const handleKeyUp = (e) => {
      if (gameStateRef.current) gameStateRef.current.keysDown.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const handleTouchStart = () => {
      isTouchDevice.current = true;
    };
    window.addEventListener("touchstart", handleTouchStart, { once: true });

    const handleResize = () => {
      const w = canvasRef.current?.clientWidth;
      const h = canvasRef.current?.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      const newAspect = w / h;
      const newViewH = 10 * TILE;
      const newViewW = newViewH * newAspect;
      camera.left = -newViewW / 2;
      camera.right = newViewW / 2;
      camera.top = newViewH / 2;
      camera.bottom = -newViewH / 2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      fallbackPlayerTexture.dispose();
      if (playerSheetFramesRef.current) {
        playerSheetFramesRef.current.dispose();
        playerSheetFramesRef.current = null;
      }
      npcSheetFramesRef.current.forEach((frameSet) => frameSet.dispose());
      npcSheetFramesRef.current.clear();
      gatherSpritesRef.current.forEach((item) => {
        item.mesh?.geometry?.dispose();
        item.mesh?.material?.map?.dispose();
        item.mesh?.material?.dispose();
        item.mesh = null;
      });
      if (
        !Array.isArray(scenario?.gatherPlacements) ||
        !scenario.gatherPlacements.length
      ) {
        gatherSpritesRef.current = [];
      }
      blockedTileHintRef.current?.geometry?.dispose?.();
      blockedTileHintRef.current?.material?.map?.dispose?.();
      blockedTileHintRef.current?.material?.dispose?.();
      blockedTileHintRef.current = null;
      blockedTileHintUntilRef.current = 0;
      if (
        canvasRef.current &&
        renderer.domElement.parentNode === canvasRef.current
      ) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, [
    buildPlayerSheetFrames,
    chooseRandomNPCVariants,
    createNPCTextureFromSheet,
    flashBlockedTileHint,
    playGameSound,
    activeMap,
    activeMapNpcs,
    activeMapNpcIndices,
    gatherUnlocked,
    scenario,
  ]);

  // ─── Interact with NPCs ───────────────────────────────────────────────
  useEffect(() => {
    if (!scenario || !activeMap) return;

    const handleInteract = () => {
      if (dialogue || gameComplete) return;
      const gs = gameStateRef.current;
      if (!gs) return;

      const dirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const dir of dirs) {
        const checkX = gs.playerX + dir.dx;
        const checkY = gs.playerY + dir.dy;
        const npcIdx =
          activeMapNpcIndices.find(
            (index) =>
              scenario.npcs[index]?.tx === checkX &&
              scenario.npcs[index]?.ty === checkY,
          ) ?? -1;

        if (npcIdx !== -1) {
          const currentStep = questSteps[questProgress.currentStepIdx];
          if (!currentStep || npcIdx !== currentStep.npcIdx) {
            const targetNpc =
              scenario.npcs[currentStep?.npcIdx ?? 0]?.name || "NPC";
            const targetCharName =
              npcCharacterNamesRef.current[currentStep?.npcIdx ?? 0] ||
              targetNpc;
            setFeedback(`${ui.lockedNpc} ${targetCharName}`);
            setTimeout(() => setFeedback(null), 1200);
            return;
          }
          const question = getQuestionForNPC(npcIdx);
          if (!question) continue;
          const stepArc = questSteps[questProgress.currentStepIdx];
          const nodeId = questProgress.currentNodeId || stepArc?.nodes?.[0]?.id;
          let node = stepArc?.nodes?.find((n) => n.id === nodeId);
          // Inject contextual bridge and NPC greeting if available
          if (node?.playerLine && pendingBridgeRef.current) {
            node = { ...node, playerLine: pendingBridgeRef.current };
            pendingBridgeRef.current = null;
          }
          if (pendingNpcGreetingRef.current) {
            node = { ...node, npcLine: pendingNpcGreetingRef.current };
            pendingNpcGreetingRef.current = null;
          }
          // Clear heard speech from previous interactions
          setLastHeardSpeech("");
          setDialogue({
            npcIdx,
            stepIdx: questProgress.currentStepIdx,
            npcName:
              npcCharacterNamesRef.current[npcIdx] ||
              scenario.npcs[npcIdx].name,
            npcCharacter: getDialogueCharacterForNPC(npcIdx),
            question,
            node,
            npcReply: "",
          });
          const greetLine = node?.npcLine || node?.prompt || question.prompt;
          conversationLogRef.current.push({
            speaker:
              npcCharacterNamesRef.current[npcIdx] ||
              scenario.npcs[npcIdx].name,
            text: greetLine,
            npcIdx,
          });
          speakNPCText(greetLine, { npcIdx });
          playGameSound("rpgDialogueOpen");
          // Generate dynamic choices if the first node is a choice node
          if (node?.responseMode === "choice") {
            generateDynamicChoices(node, npcIdx, questProgress.currentStepIdx);
          }
          return;
        }
      }

      const facingDir =
        gs.playerDir === "up"
          ? { dx: 0, dy: -1 }
          : gs.playerDir === "down"
            ? { dx: 0, dy: 1 }
            : gs.playerDir === "left"
              ? { dx: -1, dy: 0 }
              : { dx: 1, dy: 0 };
      const examineDirs = [
        facingDir,
        ...dirs.filter(
          (dir) => dir.dx !== facingDir.dx || dir.dy !== facingDir.dy,
        ),
      ];

      for (const dir of examineDirs) {
        const object = (activeMap.objects || []).find(
          (entry) =>
            entry.tx === gs.playerX + dir.dx &&
            entry.ty === gs.playerY + dir.dy,
        );
        if (object) {
          examineScenarioObject(object);
          return;
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleInteract();
      }
    };

    const handleClick = (e) => {
      if (!canvasRef.current || !scenario || !activeMap) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const TILE = activeMap.tileSize || scenario.tileSize;
      const gs = gameStateRef.current;
      if (!gs) return;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dx = clickX - centerX;
      const dy = clickY - centerY;

      const camera = cameraRef.current;
      if (!camera) return;

      const viewW = camera.right - camera.left;
      const viewH = camera.top - camera.bottom;
      const worldX = camera.position.x + (dx / rect.width) * viewW;
      const worldY = camera.position.y - (dy / rect.height) * viewH;
      const tileX = Math.floor(worldX / TILE);
      const tileY = gs.mapH - 1 - Math.floor(worldY / TILE);

      const moveOneStepToward = (targetX, targetY) => {
        const deltaX = targetX - gs.playerX;
        const deltaY = targetY - gs.playerY;
        if (deltaX === 0 && deltaY === 0) return false;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const primary =
          absX >= absY
            ? { dx: Math.sign(deltaX), dy: 0 }
            : { dx: 0, dy: Math.sign(deltaY) };
        const secondary =
          absX >= absY
            ? { dx: 0, dy: Math.sign(deltaY) }
            : { dx: Math.sign(deltaX), dy: 0 };

        const moveCandidates = [primary];
        if (secondary.dx !== 0 || secondary.dy !== 0) {
          moveCandidates.push(secondary);
        }

        const playerSprite = playerSpriteRef.current;
        const sheetFrames = playerSheetFramesRef.current;
        let blockedCandidate = null;

        for (const candidate of moveCandidates) {
          const stepX = gs.playerX + candidate.dx;
          const stepY = gs.playerY + candidate.dy;
          if (candidate.dx === 0 && candidate.dy === 0) continue;

          const npcBlocking = activeMapNpcs.some(
            (n) => n.tx === stepX && n.ty === stepY,
          );
          if (gs.isSolid(stepX, stepY) || npcBlocking) {
            if (!blockedCandidate) {
              blockedCandidate = { tx: stepX, ty: stepY };
            }
            continue;
          }

          gs.playerX = stepX;
          gs.playerY = stepY;
          gs.moveTimer = 140;
          gs.idleHoldMs = 400;

          if (candidate.dy < 0) gs.playerDir = "up";
          else if (candidate.dy > 0) gs.playerDir = "down";
          else if (candidate.dx < 0) gs.playerDir = "left";
          else if (candidate.dx > 0) gs.playerDir = "right";

          walkTimerRef.current += 1;
          walkFrameRef.current = walkTimerRef.current % 6;

          if (playerSprite?.material) {
            playerSprite.material.map = sheetFrames
              ? sheetFrames.getFrame(gs.playerDir, walkFrameRef.current)
              : createCharacterTexture(
                  PLAYER_COLORS,
                  gs.playerDir,
                  walkFrameRef.current,
                );
            playerSprite.material.needsUpdate = true;
          }

          playGameSound("rpgStep");
          const currentPortal = (activeMap.portals || []).find(
            (portal) => portal.tx === gs.playerX && portal.ty === gs.playerY,
          );
          if (currentPortal?.toMapId) {
            transitionCooldownUntilRef.current = performance.now() + 320;
            mapEntrySpawnRef.current = {
              mapId: currentPortal.toMapId,
              x: currentPortal.spawn?.x ?? 2,
              y: currentPortal.spawn?.y ?? 2,
            };
            setActiveMapId(currentPortal.toMapId);
          }
          return true;
        }

        if (blockedCandidate) {
          flashBlockedTileHint(blockedCandidate.tx, blockedCandidate.ty);
        }
        return false;
      };

      const clickedObject =
        !dialogue &&
        findScenarioObjectAtTile(activeMap.objects || [], tileX, tileY);
      if (clickedObject) {
        examineScenarioObject(clickedObject);
        return;
      }

      // Check NPC click
      const npcIdx =
        activeMapNpcIndices.find(
          (index) =>
            Math.abs(scenario.npcs[index]?.tx - tileX) <= 1 &&
            Math.abs(scenario.npcs[index]?.ty - tileY) <= 1,
        ) ?? -1;

      if (npcIdx !== -1 && !dialogue) {
        const currentStep = questSteps[questProgress.currentStepIdx];
        if (!currentStep || npcIdx !== currentStep.npcIdx) return;
        const npc = scenario.npcs[npcIdx];
        const npcDistance =
          Math.abs(npc.tx - gs.playerX) + Math.abs(npc.ty - gs.playerY);

        if (npcDistance > 1) {
          moveOneStepToward(npc.tx, npc.ty);
          return;
        }

        const question = getQuestionForNPC(npcIdx);
        if (question) {
          const stepArc = questSteps[questProgress.currentStepIdx];
          const nodeId = questProgress.currentNodeId || stepArc?.nodes?.[0]?.id;
          let node = stepArc?.nodes?.find((n) => n.id === nodeId);
          // Inject contextual bridge and NPC greeting if available
          if (node?.playerLine && pendingBridgeRef.current) {
            node = { ...node, playerLine: pendingBridgeRef.current };
            pendingBridgeRef.current = null;
          }
          if (pendingNpcGreetingRef.current) {
            node = { ...node, npcLine: pendingNpcGreetingRef.current };
            pendingNpcGreetingRef.current = null;
          }
          // Clear heard speech from previous interactions
          setLastHeardSpeech("");
          setDialogue({
            npcIdx,
            stepIdx: questProgress.currentStepIdx,
            npcName:
              npcCharacterNamesRef.current[npcIdx] ||
              scenario.npcs[npcIdx].name,
            npcCharacter: getDialogueCharacterForNPC(npcIdx),
            question,
            node,
            npcReply: "",
          });
          const greetLine = node?.npcLine || node?.prompt || question.prompt;
          conversationLogRef.current.push({
            speaker:
              npcCharacterNamesRef.current[npcIdx] ||
              scenario.npcs[npcIdx].name,
            text: greetLine,
            npcIdx,
          });
          speakNPCText(greetLine, { npcIdx });
          playGameSound("rpgDialogueOpen");
          // Generate dynamic choices if the first node is a choice node
          if (node?.responseMode === "choice") {
            generateDynamicChoices(node, npcIdx, questProgress.currentStepIdx);
          }
        }
        return;
      }

      // Move toward clicked tile
      if (!dialogue) {
        moveOneStepToward(tileX, tileY);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvasRef.current?.addEventListener("click", handleClick);

    const currentCanvas = canvasRef.current;
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      currentCanvas?.removeEventListener("click", handleClick);
    };
  }, [
    activeMap,
    activeMapNpcIndices,
    activeMapNpcs,
    scenario,
    dialogue,
    flashBlockedTileHint,
    examineScenarioObject,
    gameComplete,
    getQuestionForNPC,
    getDialogueCharacterForNPC,
    playGameSound,
    questProgress,
    questSteps,
    speakNPCText,
    ui.lockedNpc,
  ]);

  useEffect(() => {
    if (!dialogue || gameComplete) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialogue();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeDialogue, dialogue, gameComplete]);

  // ─── Update NPC indicators ────────────────────────────────────────────
  useEffect(() => {
    if (gameComplete) {
      npcIndicatorsRef.current.forEach((ind) => {
        if (!ind) return;
        ind.visible = false;
      });
      return;
    }

    const currentStep = questSteps[questProgress.currentStepIdx];
    const nextTargetIdx = currentStep?.npcIdx;

    npcIndicatorsRef.current.forEach((ind, i) => {
      if (!ind) return;
      ind.visible = nextTargetIdx !== undefined && i === nextTargetIdx;
    });
  }, [gameComplete, questProgress, questSteps]);

  // ─── Show/hide gather items based on quest unlock ──────────────────
  useEffect(() => {
    gatherSpritesRef.current.forEach((item) => {
      if (!item.collected && item.mesh) {
        item.mesh.visible = gatherUnlocked;
      }
    });
  }, [gatherUnlocked]);

  const completeNPCChapter = useCallback(() => {
    // Stop any playing TTS and clear heard speech when completing a chapter
    stopNPCSpeech();
    setLastHeardSpeech("");

    const newCompleted = completedSteps + 1;
    setCompletedSteps(newCompleted);

    const nextStepIdx = questProgress.currentStepIdx + 1;
    setQuestProgress({ currentStepIdx: nextStepIdx, currentNodeId: null });

    // Pre-generate contextual player bridge + NPC greeting for the next step
    pendingBridgeRef.current = null;
    pendingNpcGreetingRef.current = null;
    const nextStep = questSteps[nextStepIdx];
    if (nextStep && newCompleted < totalSteps) {
      const history = conversationLogRef.current
        .slice(-10)
        .map((e) => `${e.speaker}: ${e.text}`)
        .join("\n");
      const seed = quest?.storySeed || "";
      const nextNpcName =
        npcCharacterNamesRef.current[nextStep.npcIdx] ||
        scenario?.npcs?.[nextStep.npcIdx]?.name ||
        "NPC";
      const bridgePrompt = buildStrictDialoguePrompt(
        "You are writing a line for the player in a language-learning RPG.",
        `Story seed: ${seed}`,
        history ? `Recent history:\n${history}` : "",
        `The player is walking up to ${nextNpcName}.`,
        `Write exactly 1 short sentence the player says on arrival in ${targetLangName}.`,
        "Return only the sentence, with no quotes or labels.",
      );
      callResponses({ input: bridgePrompt })
        .then((playerBridge) => {
          const text = (playerBridge || "").trim();
          if (text.length > 0 && text.length < 200) {
            pendingBridgeRef.current = text;
          }
          // Now generate a contextual NPC greeting that responds to the player's bridge
          const npcPersonality =
            scenario?.npcs?.[nextStep.npcIdx]?.personality || "";
          const npcGreetPrompt = buildStrictDialoguePrompt(
            `You are ${nextNpcName}, a character in an adventure${npcPersonality ? ` with personality "${npcPersonality}"` : ""}.`,
            `Story seed: ${seed}`,
            history ? `Recent history:\n${history}` : "",
            text ? `The player arrives and says: "${text}"` : "",
            `Reply as ${nextNpcName} in 1-2 short sentences in ${targetLangName}.`,
            "Return only the sentences, with no quotes or labels.",
          );
          return callResponses({ input: npcGreetPrompt });
        })
        .then((result) => {
          const text = (result || "").trim();
          if (text.length > 0 && text.length < 300) {
            pendingNpcGreetingRef.current = text;
          }
        })
        .catch(() => {});
    }

    setTimeout(() => {
      setDialogue(null);
      setFeedback(null);
      if (newCompleted >= totalSteps) setGameComplete(true);
    }, 800);
  }, [
    buildStrictDialoguePrompt,
    completedSteps,
    quest,
    questProgress,
    questSteps,
    scenario,
    stopNPCSpeech,
    targetLangName,
    totalSteps,
  ]);

  // ─── Generate dynamic choices for choice nodes via LLM ────────────────
  const generateDynamicChoices = useCallback(
    async (node, npcIdx) => {
      if (!node || node.responseMode !== "choice") return;
      setGeneratingChoices(true);
      const npcName =
        npcCharacterNamesRef.current[npcIdx] ||
        scenario?.npcs?.[npcIdx]?.name ||
        "NPC";
      const seed = quest?.storySeed || "";
      const historyContext = conversationLogRef.current
        .slice(-10)
        .map((e) => `${e.speaker}: ${e.text}`)
        .join("\n");
      const characterId = npcVariantAssignmentsRef.current[npcIdx];
      const personality = characterId
        ? getCharacterPersonality(characterId)
        : null;
      const npcLine = node.npcLine || "";

      const prompt = buildStrictDialoguePrompt(
        "You are writing branching dialogue for a language-learning RPG.",
        personality ? `NPC personality: ${personality}.` : "",
        `Story seed: ${seed}`,
        historyContext ? `Conversation history:\n${historyContext}` : "",
        `The NPC "${npcName}" just said: "${npcLine}"`,
        `Generate exactly 3 short player response options in ${targetLangName}.`,
        `For each option, include the NPC's short reply in ${targetLangName}.`,
        "Return ONLY valid JSON in this exact shape with no extra text:",
        '[{"text":"player option","reply":"NPC response"},{"text":"option 2","reply":"response 2"},{"text":"option 3","reply":"response 3"}]',
      );

      try {
        const result = await callResponses({ input: prompt });
        const cleaned = (result || "").trim();
        // Extract JSON array from response
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length >= 2) {
            const dynamicChoices = parsed.slice(0, 3).map((c) => ({
              text: String(c.text || ""),
              npcReply: String(c.reply || c.npcReply || ""),
              nextNodeId: node.choices?.[0]?.nextNodeId || null,
            }));
            // Update dialogue with dynamic choices
            setDialogue((prev) => {
              if (!prev || prev.node?.id !== node.id) return prev;
              return {
                ...prev,
                node: { ...prev.node, choices: dynamicChoices },
              };
            });
          }
        }
      } catch {
        // Keep fallback hardcoded choices
      } finally {
        setGeneratingChoices(false);
      }
    },
    [buildStrictDialoguePrompt, quest, scenario, targetLangName],
  );

  // ─── Handle answer ────────────────────────────────────────────────────
  const handleAnswer = (optionIdx) => {
    if (!dialogue) return;

    // Stop any currently playing TTS before advancing
    stopNPCSpeech();
    playGameSound("rpgDialogueSelect");

    const selected = dialogue.node?.choices?.[optionIdx];
    if (!selected) return;

    // Log choice exchange to conversation history
    const npcName =
      npcCharacterNamesRef.current[dialogue.npcIdx] ||
      scenario?.npcs?.[dialogue.npcIdx]?.name ||
      "NPC";
    conversationLogRef.current.push({
      speaker: "Player",
      text: selected.text,
      npcIdx: dialogue.npcIdx,
    });
    if (selected.npcReply) {
      conversationLogRef.current.push({
        speaker: npcName,
        text: selected.npcReply,
        npcIdx: dialogue.npcIdx,
      });
    }

    const nextNodeId = selected.nextNodeId || null;

    if (!nextNodeId) {
      setDialogue((prev) => ({ ...prev, npcReply: selected.npcReply || "" }));
      if (selected.npcReply)
        speakNPCText(selected.npcReply, { npcIdx: dialogue.npcIdx });
      completeNPCChapter(dialogue.npcIdx);
      return;
    }

    const nextNode = questSteps[dialogue.stepIdx]?.nodes?.find(
      (n) => n.id === nextNodeId,
    );
    setQuestProgress((prev) => ({
      ...prev,
      currentNodeId: nextNodeId,
    }));

    if (!nextNode) {
      completeNPCChapter(dialogue.npcIdx);
      return;
    }

    // Unlock gather items when reaching a gather node
    if (nextNode.responseMode === "gather") {
      setGatherUnlocked(true);
    }

    // Clear heard speech when transitioning nodes
    setLastHeardSpeech("");

    setTimeout(() => {
      let reply = selected.npcReply || "";
      // When transitioning into a gather or non-speech node with a reply,
      // append the node's instructions so the player knows what to do
      if (reply && nextNode.npcLine && nextNode.responseMode !== "speech") {
        reply = `${reply}\n\n${nextNode.npcLine}`;
      }
      setDialogue((prev) => ({
        ...prev,
        node: nextNode,
        npcReply: reply,
      }));
      const transitionLine = reply || nextNode.npcLine || nextNode.prompt || "";
      speakNPCText(transitionLine, { npcIdx: dialogue.npcIdx });

      // Generate dynamic choices if the next node is a choice node
      if (nextNode.responseMode === "choice") {
        generateDynamicChoices(nextNode, dialogue.npcIdx, dialogue.stepIdx);
      }
    }, 300);
  };

  // Return an item from inventory back to the map near the player
  const returnItemToMap = (itemName) => {
    const gs = gameStateRef.current;
    if (!gs || !scenario || !activeMap) return;
    const sprite = gatherSpritesRef.current.find(
      (s) => s.name === itemName && s.collected,
    );
    if (!sprite) return;
    const MAP_W = activeMap.mapWidth;
    const MAP_H = activeMap.mapHeight;
    const TILE = activeMap.tileSize || scenario.tileSize;
    const offsets = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ];
    let dropX = gs.playerX;
    let dropY = gs.playerY;
    for (const [dx, dy] of offsets) {
      const nx = gs.playerX + dx;
      const ny = gs.playerY + dy;
      if (nx >= 1 && nx < MAP_W - 1 && ny >= 1 && ny < MAP_H - 1) {
        dropX = nx;
        dropY = ny;
        break;
      }
    }
    sprite.mapId = activeMap.id;
    sprite.tx = dropX;
    sprite.ty = dropY;
    sprite.collected = false;
    if (sprite.mesh) {
      sprite.mesh.position.set(
        dropX * TILE + TILE / 2,
        (MAP_H - 1 - dropY) * TILE + TILE / 2,
        3,
      );
      sprite.mesh.visible = gatherUnlocked;
    }
  };

  const dropInventoryItem = (itemIndex) => {
    const droppedItem = inventory[itemIndex];
    if (!droppedItem) return;
    setInventory((prev) => {
      const copy = [...prev];
      copy.splice(itemIndex, 1);
      return copy;
    });
    returnItemToMap(droppedItem.name);
  };

  const handleGatherSubmit = (itemIndex) => {
    if (!dialogue?.node || dialogue.node.responseMode !== "gather") return;
    const submittedItem = inventory[itemIndex];
    if (!submittedItem) return;

    playGameSound("rpgDialogueSelect");
    const requiredItem = dialogue.node.gatherItem?.name;

    // Remove the submitted item from inventory
    setInventory((prev) => {
      const copy = [...prev];
      copy.splice(itemIndex, 1);
      return copy;
    });

    if (!submittedItem.isCorrect) {
      // Wrong item — NPC tells you it's wrong, drop item back near the player
      const wrongText = fillNamedTemplate(
        dialogue.node.gatherWrongItemTemplate ||
          "That is {{wrongItem}}. Not what I need. Look for {{correctItem}}.",
        {
          wrongItem: submittedItem.name,
          correctItem: requiredItem,
        },
      );
      setDialogue((prev) => ({ ...prev, npcReply: wrongText }));
      speakNPCText(wrongText, { npcIdx: dialogue.npcIdx });
      returnItemToMap(submittedItem.name);
      return;
    }

    // Correct item — advance quest
    setGatherUnlocked(false);
    const nextNodeId = dialogue.node.nextNodeId;
    const nextNode = questSteps[dialogue.stepIdx]?.nodes?.find(
      (n) => n.id === nextNodeId,
    );

    if (!nextNode) {
      completeNPCChapter(dialogue.npcIdx);
      return;
    }

    setQuestProgress((prev) => ({
      ...prev,
      currentNodeId: nextNode.id,
    }));

    setTimeout(() => {
      setDialogue((prev) => ({ ...prev, node: nextNode, npcReply: "" }));
      speakNPCText(nextNode.npcLine || "", { npcIdx: dialogue.npcIdx });
    }, 300);
  };

  const {
    startRecording,
    stopRecording,
    isRecording,
    isConnecting,
    supportsSpeech,
  } = useSpeechPractice({
    targetText: dialogue?.node?.npcLine || "",
    targetLang,
    onResult: async ({ recognizedText }) => {
      const heard = (recognizedText || "").trim();
      setLastHeardSpeech(heard);
      if (!dialogue?.node || dialogue.node.responseMode !== "speech") return;

      // Grab the pre-warmed audio element (unlocked during user gesture)
      const warmAudio = preWarmedAudioRef.current;
      preWarmedAudioRef.current = null;

      if (!heard) {
        const fallbackReply =
          dialogue.node.speechFallbackReply || ui.noSpeechMatch;
        setDialogue((prev) => ({ ...prev, npcReply: fallbackReply }));
        speakNPCText(fallbackReply, { warmAudio, npcIdx: dialogue.npcIdx });
        return;
      }

      const npcName =
        npcCharacterNamesRef.current[dialogue.npcIdx] ||
        scenario?.npcs?.[dialogue.npcIdx]?.name ||
        "NPC";
      const seed = quest?.storySeed || "";
      const historyContext = conversationLogRef.current
        .slice(-10)
        .map((e) => `${e.speaker}: ${e.text}`)
        .join("\n");

      // Log the user's speech
      conversationLogRef.current.push({
        speaker: "Player",
        text: heard,
        npcIdx: dialogue.npcIdx,
      });

      const nextNodeId = dialogue.node.nextNodeId || null;
      const nextNode = questSteps[dialogue.stepIdx]?.nodes?.find(
        (n) => n.id === nextNodeId,
      );

      // Advance dialogue state immediately (no delay)
      if (nextNode) {
        if (nextNode.responseMode === "gather") {
          setGatherUnlocked(true);
        }
        setQuestProgress((prev) => ({
          ...prev,
          currentNodeId: nextNode.id,
        }));
      }

      // Build LLM prompt for a dynamic, personalized NPC reply
      const characterId = npcVariantAssignmentsRef.current[dialogue.npcIdx];
      const personality = characterId
        ? getCharacterPersonality(characterId)
        : null;
      const llmPrompt = buildStrictDialoguePrompt(
        `You are ${npcName}, a character in an adventure.`,
        personality ? `Your personality: ${personality}.` : "",
        `Story seed: ${seed}`,
        historyContext ? `Conversation history:\n${historyContext}` : "",
        `The player just said: "${heard}"`,
        `Reply in 1-2 brief sentences in ${targetLangName}.`,
        "Respond only as the character with no narration or labels.",
      );

      // Stop any currently playing TTS before the new speech reply
      stopNPCSpeech();

      // Fire LLM call without blocking dialogue progression
      const npcIdx = dialogue.npcIdx;
      const stepIdx = dialogue.stepIdx;
      callResponses({ input: llmPrompt })
        .then((llmResult) => {
          const dynamicReply =
            llmResult && llmResult.trim().length > 0
              ? llmResult.trim()
              : dialogue.node.speechContinueReply ||
                "I understand. Let's continue.";

          conversationLogRef.current.push({
            speaker: npcName,
            text: dynamicReply,
            npcIdx,
          });

          let fullReply = dynamicReply;
          if (nextNode?.npcLine && nextNode.responseMode !== "speech") {
            fullReply = `${dynamicReply}\n\n${nextNode.npcLine}`;
          }

          setDialogue((prev) => ({
            ...prev,
            ...(nextNode ? { node: nextNode } : {}),
            npcReply: fullReply,
          }));
          speakNPCText(fullReply, { warmAudio, npcIdx });

          // Generate dynamic choices if the next node is a choice node
          if (nextNode?.responseMode === "choice") {
            generateDynamicChoices(nextNode, npcIdx, stepIdx);
          }
        })
        .catch(() => {
          const fallback =
            dialogue.node.speechContinueReply ||
            "I understand. Let's continue.";
          conversationLogRef.current.push({
            speaker: npcName,
            text: fallback,
            npcIdx,
          });

          let fullReply = fallback;
          if (nextNode?.npcLine && nextNode.responseMode !== "speech") {
            fullReply = `${fallback}\n\n${nextNode.npcLine}`;
          }

          setDialogue((prev) => ({
            ...prev,
            ...(nextNode ? { node: nextNode } : {}),
            npcReply: fullReply,
          }));
          speakNPCText(fullReply, { warmAudio, npcIdx });
        });
    },
  });

  useEffect(() => {
    if (!gameComplete || levelCompleteSoundPlayedRef.current) return;
    levelCompleteSoundPlayedRef.current = true;
    playGameSound("rpgLevelComplete");
    setTimeout(() => playGameSound("sparkle"), 250);
  }, [gameComplete, playGameSound]);

  // ─── Reset / change scenario ──────────────────────────────────────────
  const resetGame = () => {
    playGameSound("submitAction");
    stopNPCSpeech();
    setCompletedSteps(0);
    setDialogue(null);
    setFeedback(null);
    setGameComplete(false);
    setLastHeardSpeech("");
    setInventory([]);
    setGatherUnlocked(false);
    conversationLogRef.current = [];
    gatherSpritesRef.current.forEach((item) => {
      item.collected = false;
      if (item.mesh) item.mesh.visible = false;
    });
    setQuestProgress({ currentStepIdx: 0, currentNodeId: null });
    mapEntrySpawnRef.current = null;
    transitionCooldownUntilRef.current = 0;
    setActiveMapId(scenario?.startMapId || scenario?.id || null);
    if (scenario && gameStateRef.current) {
      const resetMap =
        scenario.maps?.find(
          (entry) => entry.id === (scenario.startMapId || scenario.id),
        ) || scenario;
      const start = resetMap?.playerStart || scenario.playerStart;
      gameStateRef.current.playerX = start.x;
      gameStateRef.current.playerY = start.y;
      gameStateRef.current.renderX = start.x;
      gameStateRef.current.renderY = start.y;
    }
  };

  const goToScenarioSelect = () => {
    playGameSound("submitAction");
    stopNPCSpeech();

    // If launched with a pre-generated scenario, exit back to skill tree
    if (initialScenario && onComplete) {
      onComplete();
      return;
    }
    // Clean up Three.js
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (
        canvasRef.current &&
        rendererRef.current.domElement.parentNode === canvasRef.current
      ) {
        canvasRef.current.removeChild(rendererRef.current.domElement);
      }
    }
    setScenarioId(null);
    setScenario(null);
    setActiveMapId(null);
    setNpcNameMap(null);
    setLoadingScenarioId(null);
    setCompletedSteps(0);
    setDialogue(null);
    setFeedback(null);
    setGameComplete(false);
    setLastHeardSpeech("");
    mapEntrySpawnRef.current = null;
    transitionCooldownUntilRef.current = 0;
    npcAssignmentsCacheRef.current = null;
    gatherPlacementCacheKeyRef.current = null;
  };

  const isEmbedded = !!lessonContext && !initialScenario;
  const isTutorialGame =
    !!lessonContext?.isTutorial &&
    lessonContext?.content?.game?.topic === "tutorial";
  const tutorialSceneId =
    lessonContext?.content?.game?.sceneId || TUTORIAL_MAP_ID;
  const tutorialCompletionHandledRef = useRef(false);

  useEffect(() => {
    if (!isTutorialGame || scenarioId || loadingScenarioId) return;
    void handleSelectScenario(tutorialSceneId);
  }, [
    handleSelectScenario,
    isTutorialGame,
    loadingScenarioId,
    scenarioId,
    tutorialSceneId,
  ]);

  useEffect(() => {
    if (!isEmbedded || isTutorialGame || scenarioId || loadingScenarioId)
      return;
    void handleSelectScenario(REVIEW_WORLD_ID);
  }, [
    handleSelectScenario,
    isEmbedded,
    isTutorialGame,
    loadingScenarioId,
    scenarioId,
  ]);

  useEffect(() => {
    if (
      !isTutorialGame ||
      !gameComplete ||
      tutorialCompletionHandledRef.current
    ) {
      return;
    }

    tutorialCompletionHandledRef.current = true;

    if (typeof onSkip === "function") {
      onSkip();
    }
  }, [gameComplete, isTutorialGame, onSkip]);

  const handleSkipStep = useCallback(() => {
    if (typeof onSkip === "function") {
      onSkip();
      return;
    }
    goToScenarioSelect();
  }, [goToScenarioSelect, onSkip]);

  // ─── Scenario selection screen ─────────────────────────────────────────
  if (!scenarioId) {
    return (
      <Box
        w={isEmbedded ? "100%" : "100vw"}
        h={isEmbedded ? "80vh" : "100vh"}
        minH={isEmbedded ? "400px" : undefined}
        bg={isEmbedded ? "transparent" : "#1a1a2e"}
        display="flex"
        alignItems={isEmbedded ? "flex-start" : "center"}
        justifyContent="center"
        borderRadius={isEmbedded ? "xl" : undefined}
        pt={isEmbedded ? 6 : undefined}
        onPointerDownCapture={() => {
          Tone.start();
          void warmupAudio();
        }}
        onTouchStartCapture={() => {
          Tone.start();
          void warmupAudio();
        }}
      >
        <VStack spacing={6} maxW="560px" mx={4}>
          {!isEmbedded && (
            <IconButton
              icon={<ArrowBackIcon />}
              aria-label={ui.back}
              size="sm"
              variant="ghost"
              color="white"
              position="absolute"
              top={4}
              left={4}
              onClick={() => navigate("/")}
            />
          )}

          {isEmbedded && lessonContext?.content?.game?.unitTitle && (
            <Text color="gray.400" fontSize="sm" textAlign="center">
              {lessonContext.content.game.unitTitle}
            </Text>
          )}

          {isTutorialGame ? (
            <>
              <RobotBuddyPro state="thinking" maxW={140} />
              <VStack spacing={2}>
                <Text
                  color="white"
                  fontSize="lg"
                  fontWeight="bold"
                  textAlign="center"
                >
                  {ui.loadingTutorialScene}
                </Text>
                <Text
                  fontSize="sm"
                  color="purple.200"
                  textAlign="center"
                  minH="20px"
                >
                  {loadingMessages[loadingMsgIdx]}
                </Text>
              </VStack>
            </>
          ) : (
            <>
              <Text
                color="yellow.300"
                fontSize="2xl"
                fontWeight="bold"
                textAlign="center"
              >
                {MAP_CHOICES.length === 1 ? ui.newWorld : ui.chooseScenario}
              </Text>
              <Wrap spacing={4} justify="center">
                {MAP_CHOICES.map((choice, idx) => {
                  return (
                    <WrapItem key={choice.id}>
                      <Button
                        size="lg"
                        h="auto"
                        py={4}
                        px={6}
                        bg="whiteAlpha.100"
                        color="white"
                        border="2px solid"
                        borderColor="whiteAlpha.200"
                        borderRadius="xl"
                        _hover={{
                          bg: "whiteAlpha.200",
                          borderColor: "yellow.400",
                          transform: "scale(1.05)",
                        }}
                        transition="all 0.2s"
                        onClick={() => handleSelectScenario(choice.id)}
                        flexDir="column"
                        minW="140px"
                        isLoading={loadingScenarioId === choice.id}
                        loadingText="Loading"
                      >
                        <Text fontSize="3xl" mb={1}>
                          {choice.emoji ||
                            SCENARIO_EMOJIS[choice.id] ||
                            Object.values(SCENARIO_EMOJIS)[idx % 2] ||
                            "🎮"}
                        </Text>
                        <Text fontSize="md" fontWeight="bold">
                          {choice.name[supportLang] || choice.name.en}
                        </Text>
                      </Button>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </>
          )}
        </VStack>
      </Box>
    );
  }

  if (!scenario) {
    return (
      <Box
        w={isEmbedded ? "100%" : "100vw"}
        h={isEmbedded ? "80vh" : "100vh"}
        minH={isEmbedded ? "400px" : undefined}
        borderRadius={isEmbedded ? "xl" : undefined}
        bg={isEmbedded ? "transparent" : "#1a1a2e"}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        onPointerDownCapture={() => {
          Tone.start();
          void warmupAudio();
        }}
        onTouchStartCapture={() => {
          Tone.start();
          void warmupAudio();
        }}
      >
        <Box
          w={isEmbedded ? "90%" : { base: "90vw", md: "40vw" }}
          h={isEmbedded ? "55%" : { base: "50vh", md: "40vh" }}
          borderRadius="xl"
          overflow="hidden"
          position="relative"
        >
          <LoadingMiniGame supportLang={supportLang} />
        </Box>
        <VStack spacing={2} mt={3}>
          <Text
            color="white"
            fontSize="md"
            fontWeight="bold"
            textAlign="center"
          >
            {isTutorialGame
              ? ui.loadingTutorialScene
              : ui.loadingGeneratingGame}
          </Text>
          <Text fontSize="xs" color="purple.200" textAlign="center" minH="16px">
            {loadingMessages[loadingMsgIdx]}
          </Text>
          {!isTutorialGame && (
            <Button size="sm" onClick={goToScenarioSelect}>{ui.back}</Button>
          )}
        </VStack>
      </Box>
    );
  }

  // ─── Game screen ───────────────────────────────────────────────────────
  return (
    <Box
      position="relative"
      w={isEmbedded ? "100%" : "100vw"}
      h={isEmbedded ? "80vh" : "100vh"}
      bg="#1a1a2e"
      overflow="hidden"
      userSelect="none"
      onPointerDownCapture={() => {
        Tone.start();
        void warmupAudio();
      }}
      onTouchStartCapture={() => {
        Tone.start();
        void warmupAudio();
      }}
    >
      {/* Three.js canvas */}
      <Box
        ref={canvasRef}
        position="absolute"
        top={0}
        left={0}
        w="100%"
        h="100%"
      />

      {/* Top bar */}
      <HStack
        position="absolute"
        top={3}
        left={3}
        right={3}
        justify="space-between"
        zIndex={10}
      >
        <HStack spacing={2}>
          <IconButton
            icon={<ArrowBackIcon />}
            aria-label={ui.back}
            size="sm"
            variant="solid"
            colorScheme="blackAlpha"
            onClick={goToScenarioSelect}
          />
          {isTutorialGame && (
            <Button
              size="sm"
              variant="solid"
              colorScheme="blackAlpha"
              onClick={handleSkipStep}
            >
              {ui.skip}
            </Button>
          )}
          {!!activeAreaLabel && (
            <Badge
              bg="blackAlpha.700"
              color="white"
              px={3}
              py={1.5}
              borderRadius="full"
              fontSize="xs"
              textTransform="none"
            >
              {activeAreaLabel}
            </Badge>
          )}
        </HStack>
        <HStack bg="blackAlpha.700" borderRadius="md" px={3} py={1} spacing={2}>
          <Text color="white" fontSize="sm" fontWeight="bold">
            {completedSteps}/{totalSteps}
          </Text>
          <Progress
            value={totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}
            size="sm"
            colorScheme="green"
            w="60px"
            borderRadius="full"
          />
        </HStack>
      </HStack>

      {/* Quick actions */}
      {!gameComplete && (
        <VStack position="absolute" top={14} right={3} zIndex={10} spacing={3}>
          <IconButton
            aria-label="Inventory"
            icon={
              <Box position="relative">
                <BackpackIcon size={22} />
                {inventory.length > 0 && (
                  <Badge
                    position="absolute"
                    top="-6px"
                    right="-10px"
                    colorScheme="yellow"
                    borderRadius="full"
                    fontSize="10px"
                    minW="18px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {inventory.length}
                  </Badge>
                )}
              </Box>
            }
            size="md"
            variant="ghost"
            bg="transparent"
            border="none"
            outline="none"
            boxShadow="none"
            _hover={{ bg: "transparent", border: "none", boxShadow: "none" }}
            _active={{ bg: "transparent", border: "none", boxShadow: "none" }}
            _focus={{ boxShadow: "none", outline: "none" }}
            _focusVisible={{ boxShadow: "none", outline: "none" }}
            onClick={inventoryModal.onOpen}
          />
          <IconButton
            aria-label={supportLang === "es" ? "Ayuda" : "Help"}
            icon={<MdOutlineSupportAgent size={20} />}
            size="md"
            variant="solid"
            bg="white"
            color="blue.600"
            boxShadow="0 2px 0 #2b6cb0"
            _hover={{ bg: "gray.50" }}
            onClick={helpChat.onOpen}
          />
        </VStack>
      )}

      <HelpChatFab
        ref={helpChatRef}
        progress={{ targetLang, supportLang }}
        appLanguage={supportLang}
        isOpen={helpChat.isOpen}
        onOpen={helpChat.onOpen}
        onClose={helpChat.onClose}
        showFloatingTrigger={false}
      />

      {/* Inventory modal */}
      <Modal
        isOpen={inventoryModal.isOpen}
        onClose={() => {
          inventoryModal.onClose();
          setSelectedInvItem(null);
        }}
        isCentered
        size="sm"
      >
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent
          bg="rgba(250, 244, 232, 0.96)"
          border="2px solid"
          borderColor="orange.200"
          borderRadius="xl"
          boxShadow="0 18px 38px rgba(0,0,0,0.52)"
        >
          <ModalHeader color="orange.800" fontSize="md" pb={1}>
            {targetLang === "es" ? "Inventario" : "Inventory"}
          </ModalHeader>
          <ModalCloseButton
            color="gray.600"
            _hover={{ bg: "whiteAlpha.200" }}
          />
          <ModalBody pb={4}>
            {inventory.length === 0 ? (
              <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                {targetLang === "es" ? "No tienes objetos." : "No items yet."}
              </Text>
            ) : (
              <VStack spacing={3} align="stretch">
                <SimpleGrid columns={4} spacing={3}>
                  {inventory.map((item, idx) => (
                    <VStack
                      key={`${item.name}-${idx}`}
                      spacing={0}
                      cursor="pointer"
                      onClick={() =>
                        setSelectedInvItem(selectedInvItem === idx ? null : idx)
                      }
                      bg={selectedInvItem === idx ? "orange.100" : "orange.50"}
                      borderRadius="lg"
                      border="2px solid"
                      borderColor={
                        selectedInvItem === idx ? "orange.400" : "transparent"
                      }
                      p={2}
                      transition="all 0.15s"
                      _hover={{ bg: "orange.100" }}
                    >
                      <Image
                        src={getItemSpriteDataURL(item)}
                        alt={item.name}
                        w="48px"
                        h="48px"
                        imageRendering="pixelated"
                      />
                    </VStack>
                  ))}
                </SimpleGrid>
                {selectedInvItem !== null && inventory[selectedInvItem] && (
                  <HStack
                    bg="orange.50"
                    borderRadius="lg"
                    px={3}
                    py={2}
                    justify="space-between"
                    border="1px solid"
                    borderColor="orange.200"
                  >
                    <Text color="gray.800" fontSize="sm" fontWeight="medium">
                      {inventory[selectedInvItem].name}
                    </Text>
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => {
                        const idx = selectedInvItem;
                        setSelectedInvItem(null);
                        dropInventoryItem(idx);
                      }}
                    >
                      {targetLang === "es" ? "Soltar" : "Drop"}
                    </Button>
                  </HStack>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {objectExamine && !dialogue && !gameComplete && (
        <Box
          position="absolute"
          left="50%"
          bottom={{ base: 4, md: 5 }}
          transform="translateX(-50%)"
          zIndex={18}
          w={{ base: "calc(100% - 24px)", md: "min(86vw, 420px)" }}
          pointerEvents="none"
        >
          <Box
            bg="rgba(250, 244, 232, 0.96)"
            color="gray.800"
            border="2px solid"
            borderColor="orange.200"
            borderRadius="xl"
            px={4}
            py={3}
            boxShadow="0 18px 38px rgba(0,0,0,0.52)"
          >
            {objectExamine.pending ? (
              <HStack spacing={2}>
                <Spinner size="xs" color="gray.500" />
                <Text fontSize="sm" color="gray.700">
                  ...
                </Text>
              </HStack>
            ) : (
              <VStack align="stretch" spacing={1}>
                {objectExamine.name || objectExamine.supportName ? (
                  <Text
                    fontSize="sm"
                    lineHeight="1.35"
                    color="gray.800"
                    fontWeight="semibold"
                  >
                    {objectExamine.name}
                    {objectExamine.supportName
                      ? ` (${objectExamine.supportName})`
                      : ""}
                  </Text>
                ) : null}
                {objectExamine.text ? (
                  <Text fontSize="sm" lineHeight="1.45" color="gray.800">
                    {objectExamine.text}
                  </Text>
                ) : null}
                {objectExamine.supportText ? (
                  <Text
                    fontSize="xs"
                    lineHeight="1.35"
                    color="gray.600"
                    fontStyle="italic"
                  >
                    ({objectExamine.supportText})
                  </Text>
                ) : null}
              </VStack>
            )}
          </Box>
        </Box>
      )}

      {/* Dialogue bubble (desktop) / bottom sheet (mobile) */}
      {dialogue &&
        !gameComplete &&
        (isMobileDialogueLayout || dialogueBubblePosition) && (
          <Box position="absolute" inset={0} zIndex={20} pointerEvents="none">
            <Box
              position="absolute"
              left={
                isMobileDialogueLayout
                  ? { base: 3, md: `${dialogueBubblePosition?.left || 0}px` }
                  : `${dialogueBubblePosition?.left || 0}px`
              }
              right={isMobileDialogueLayout ? { base: 3, md: "auto" } : "auto"}
              top={
                isMobileDialogueLayout
                  ? {
                      base: "auto",
                      md: `${dialogueBubblePosition?.top || 0}px`,
                    }
                  : `${dialogueBubblePosition?.top || 0}px`
              }
              bottom={isMobileDialogueLayout ? { base: 4, md: "auto" } : "auto"}
              transform={
                isMobileDialogueLayout
                  ? "none"
                  : dialogueBubblePosition?.preferredRight
                    ? "translate(0, -50%)"
                    : "translate(-100%, -50%)"
              }
              w={
                isMobileDialogueLayout
                  ? { base: "auto", md: "360px" }
                  : { base: "min(86vw, 340px)", md: "360px" }
              }
              maxH={
                isMobileDialogueLayout
                  ? { base: "44vh", md: "62vh" }
                  : { base: "70vh", md: "62vh" }
              }
              overflowY="auto"
              overflowX="hidden"
              css={{
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              bg="rgba(250, 244, 232, 0.96)"
              border="2px solid"
              borderColor="orange.200"
              borderRadius={isMobileDialogueLayout ? "xl" : "2xl"}
              p={0}
              boxShadow="0 18px 38px rgba(0,0,0,0.52)"
              pointerEvents="auto"
            >
              {!isMobileDialogueLayout && dialogueBubblePosition && (
                <Box
                  position="absolute"
                  top="50%"
                  transform="translateY(-50%)"
                  left={
                    dialogueBubblePosition.preferredRight ? "-12px" : "auto"
                  }
                  right={
                    dialogueBubblePosition.preferredRight ? "auto" : "-12px"
                  }
                  w="0"
                  h="0"
                  borderTop="10px solid transparent"
                  borderBottom="10px solid transparent"
                  borderRight={
                    dialogueBubblePosition.preferredRight
                      ? "12px solid rgba(250, 244, 232, 0.96)"
                      : "none"
                  }
                  borderLeft={
                    dialogueBubblePosition.preferredRight
                      ? "none"
                      : "12px solid rgba(250, 244, 232, 0.96)"
                  }
                />
              )}

              <IconButton
                aria-label="Close dialogue"
                icon={<CloseIcon boxSize={2.5} />}
                size="xs"
                position="absolute"
                top={2}
                right={2}
                variant="ghost"
                color="gray.600"
                _hover={{ bg: "whiteAlpha.200" }}
                onClick={closeDialogue}
              />

              <VStack align="stretch" spacing={0}>
                {/* Player dialogue line (bridges narrative between NPCs) */}
                {dialogue.node?.playerLine && (
                  <Box
                    bg="blue.50"
                    border="1px solid"
                    borderColor="blue.200"
                    borderRadius="lg"
                    px={3}
                    py={2}
                    mx={3}
                    mt={8}
                    mb={2}
                  >
                    <Text color="blue.800" fontSize="sm" fontStyle="italic">
                      {dialogue.node.playerLine}
                    </Text>
                  </Box>
                )}

                <HStack
                  align="center"
                  spacing={2}
                  px={2}
                  py={0}
                  pr={8}
                  bg="orange.50"
                  borderBottom="1px solid"
                  borderColor="orange.100"
                >
                  <Box flexShrink={0}>
                    <RandomCharacter
                      width="36px"
                      notSoRandomCharacter={dialogue.npcCharacter}
                    />{" "}
                  </Box>
                  <Badge colorScheme="purple" fontSize="sm" px={2}>
                    {dialogue.npcName}
                  </Badge>
                  {feedback === "correct" && (
                    <Badge colorScheme="green" variant="solid">
                      {ui.correct}
                    </Badge>
                  )}
                  {feedback === "incorrect" && (
                    <Badge colorScheme="red" variant="solid">
                      {ui.incorrect}
                    </Badge>
                  )}
                </HStack>

                <VStack align="stretch" spacing={2} px={3} py={1}>
                  <HStack justify="flex-end">
                    <IconButton
                      aria-label={
                        lineTranslations
                          ? supportLang === "es"
                            ? "Deshacer traducción"
                            : "Undo translation"
                          : supportLang === "es"
                            ? "Traducir texto"
                            : "Translate text"
                      }
                      icon={
                        lineTranslations ? (
                          <MdUndo size={14} />
                        ) : (
                          <MdOutlineSupportAgent size={14} />
                        )
                      }
                      size="xs"
                      rounded="md"
                      bg="white"
                      color={lineTranslations ? "orange.500" : "blue.600"}
                      boxShadow={
                        lineTranslations ? "0 1px 0 #c05621" : "0 1px 0 #2b6cb0"
                      }
                      _hover={{ bg: "gray.50" }}
                      onClick={toggleTranslation}
                      isLoading={isTranslating}
                    />
                  </HStack>

                  {lineTranslations ? (
                    <VStack align="stretch" spacing={1}>
                      {(() => {
                        const npcText =
                          dialogue.npcReply ||
                          dialogue.node?.npcLine ||
                          dialogue.node?.prompt ||
                          dialogue.question.prompt;
                        const isReply = !!dialogue.npcReply;
                        return splitIntoSentences(npcText).map((line, i) => (
                          <Box key={i}>
                            {isReply ? (
                              <Box
                                color="orange.700"
                                fontSize="sm"
                                sx={{
                                  "& p": { m: 0 },
                                  "& strong": { fontWeight: "bold" },
                                }}
                              >
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {line}
                                </ReactMarkdown>
                              </Box>
                            ) : (
                              <Text
                                color="gray.800"
                                fontSize="md"
                                fontWeight="bold"
                                m={0}
                              >
                                {line}
                              </Text>
                            )}
                            {lineTranslations[i] && (
                              <Text
                                color="blue.700"
                                fontSize="sm"
                                fontStyle="italic"
                                m={0}
                              >
                                {lineTranslations[i]}
                              </Text>
                            )}
                          </Box>
                        ));
                      })()}
                    </VStack>
                  ) : (
                    <>
                      {!dialogue.npcReply && (
                        <AnimatedText
                          text={
                            dialogue.node?.npcLine ||
                            dialogue.node?.prompt ||
                            dialogue.question.prompt
                          }
                          color="gray.800"
                          fontSize="md"
                          fontWeight="bold"
                          m={0}
                        />
                      )}
                      {!!dialogue.npcReply && (
                        <Box
                          color="orange.700"
                          fontSize="sm"
                          sx={{
                            "& p": { m: 0 },
                            "& strong": { fontWeight: "bold" },
                          }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {dialogue.npcReply}
                          </ReactMarkdown>
                        </Box>
                      )}
                    </>
                  )}

                  {lastHeardSpeech &&
                    dialogue.node?.responseMode === "speech" && (
                      <Text color="teal.700" fontSize="xs" m={0}>
                        {ui.heardYou}: {lastHeardSpeech}
                      </Text>
                    )}

                  {dialogue.node?.responseMode === "choice" &&
                    (generatingChoices ? (
                      <HStack justify="center" py={4}>
                        <Spinner size="sm" color="gray.500" />
                        <Text fontSize="sm" color="gray.500">
                          {targetLang === "es" ? "Pensando..." : "Thinking..."}
                        </Text>
                      </HStack>
                    ) : (
                      <VStack spacing={2}>
                        {(dialogue.node?.choices || []).map((optRaw, idx) => {
                          const opt =
                            typeof optRaw === "string" ? optRaw : optRaw.text;

                          return (
                            <Button
                              key={idx}
                              w="100%"
                              size="sm"
                              variant="solid"
                              bg="rgba(255,255,255,0.92)"
                              color="gray.900"
                              border="1px solid"
                              borderColor="blackAlpha.200"
                              boxShadow="0px 4px 0px #a9a18c"
                              _active={{ bg: "gray.100" }}
                              onClick={() => handleAnswer(idx)}
                              isDisabled={isRecording || isConnecting}
                              justifyContent="flex-start"
                              textAlign="left"
                              whiteSpace="normal"
                              h="auto"
                              py={2}
                            >
                              {String.fromCharCode(65 + idx)}. {opt}
                            </Button>
                          );
                        })}
                      </VStack>
                    ))}

                  {dialogue.node?.responseMode === "speech" && (
                    <HStack justify="flex-end">
                      <IconButton
                        aria-label={isRecording ? ui.micStop : ui.micStart}
                        size="sm"
                        colorScheme={isRecording ? "red" : "teal"}
                        icon={<FaMicrophone />}
                        isLoading={isConnecting}
                        onClick={async () => {
                          if (!supportsSpeech) {
                            toast({
                              title: ui.speechUnavailable,
                              status: "warning",
                              duration: 2500,
                              isClosable: true,
                            });
                            return;
                          }
                          if (isRecording) {
                            stopRecording();
                            return;
                          }
                          // Pre-warm an Audio element during this user gesture
                          // so TTS can play after the async speech recognition
                          // callback (mobile browsers block audio.play() without
                          // a gesture context). Fire-and-forget – don't await.
                          try {
                            const warm = new Audio();
                            warm.playsInline = true;
                            warm.src =
                              "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
                            warm
                              .play()
                              .then(() => warm.pause())
                              .catch(() => {});
                            preWarmedAudioRef.current = warm;
                          } catch {
                            // ignore – desktop doesn't need this
                          }
                          try {
                            await startRecording();
                          } catch {
                            toast({
                              title: ui.speechUnavailable,
                              status: "warning",
                              duration: 2500,
                              isClosable: true,
                            });
                          }
                        }}
                      />
                    </HStack>
                  )}

                  {dialogue.node?.responseMode === "gather" && (
                    <VStack spacing={2}>
                      {inventory.length > 0 ? (
                        <>
                          <Text color="gray.600" fontSize="xs">
                            {targetLang === "es"
                              ? "Elige un objeto para entregar:"
                              : "Choose an item to hand over:"}
                          </Text>
                          <Wrap spacing={2} justify="center">
                            {inventory.map((item, idx) => (
                              <WrapItem key={`${item.name}-${idx}`}>
                                <Box
                                  as="button"
                                  onClick={() => handleGatherSubmit(idx)}
                                  bg="rgba(255,255,255,0.92)"
                                  border="2px solid"
                                  borderColor="blackAlpha.200"
                                  borderRadius="lg"
                                  boxShadow="0px 4px 0px #a9a18c"
                                  _hover={{
                                    bg: "orange.50",
                                    borderColor: "orange.400",
                                  }}
                                  _active={{
                                    transform: "translateY(2px)",
                                    boxShadow: "0px 2px 0px #a9a18c",
                                  }}
                                  p={2}
                                  transition="all 0.12s"
                                  cursor="pointer"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <Image
                                    src={getItemSpriteDataURL(item)}
                                    alt={item.name}
                                    w="40px"
                                    h="40px"
                                    imageRendering="pixelated"
                                  />
                                </Box>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </>
                      ) : null}
                      <Button
                        size="sm"
                        colorScheme="orange"
                        variant="outline"
                        onClick={closeDialogue}
                        w="100%"
                      >
                        {targetLang === "es"
                          ? "Seguir buscando"
                          : "Keep searching"}
                      </Button>
                    </VStack>
                  )}

                  {dialogue.node?.responseMode === "none" && (
                    <Button
                      size="sm"
                      colorScheme="yellow"
                      onClick={() => completeNPCChapter(dialogue.npcIdx)}
                    >
                      {ui.continue}
                    </Button>
                  )}
                </VStack>
              </VStack>
            </Box>
          </Box>
        )}

      {/* Game complete */}
      {gameComplete && (
        <Box
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          bg="blackAlpha.800"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={30}
        >
          <VStack
            bg="gray.900"
            border="3px solid"
            borderColor="yellow.400"
            borderRadius="xl"
            p={8}
            spacing={4}
            maxW="400px"
            mx={4}
            textAlign="center"
            boxShadow="0 0 40px rgba(255,215,0,0.3)"
          >
            <Text fontSize="4xl">
              {scenario?.emoji || SCENARIO_EMOJIS[scenarioId] || "🏆"}
            </Text>
            <Text color="yellow.300" fontSize="xl" fontWeight="bold">
              {ui.completed}
            </Text>
            <HStack spacing={3}>
              <Button colorScheme="yellow" onClick={resetGame}>
                {ui.playAgain}
              </Button>
              <Button
                variant="outline"
                colorScheme="whiteAlpha"
                color="white"
                onClick={goToScenarioSelect}
              >
                {isTutorialGame ? ui.scenario : ui.newWorld}
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
}
