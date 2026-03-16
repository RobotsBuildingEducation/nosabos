import React, { useEffect, useRef, useCallback, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import useSoundSettings from "../hooks/useSoundSettings";

// ─── Constants ──────────────────────────────────────────────────────────────
const TILE = 16;
const SCALE = 3;
const T = TILE * SCALE; // 48px per tile
const MOVE_COOLDOWN = 130;

// ─── Tile types ─────────────────────────────────────────────────────────────
const GRASS = 0;
const PATH = 1;
const WATER = 2;
const TREE = 4;
const FLOWER = 5;
const SIGN = 6;
const CHEST = 7;
const ROCK = 8;
const BRIDGE = 9;
const LAMP = 11;
const DOOR = 12; // room transition tile
const FLOOR = 13;
const WALL_TOP = 14;
const BOOKSHELF = 15;
const TABLE = 16;
const RUG = 17;
const FIREPLACE = 18;
const SOFA = 19;
const BED = 20;
const WINDOW_TILE = 21;
const DESK = 22;
const PLANT_POT = 23;

const SOLID_TILES = new Set([TREE, WATER, ROCK, WALL_TOP, BOOKSHELF, FIREPLACE, SOFA, BED, WINDOW_TILE, DESK]);
const INTERACT_TILES = new Set([SIGN, CHEST, LAMP, PLANT_POT, TABLE]);

// ─── Room definitions ───────────────────────────────────────────────────────
// Each room: { map, startX, startY, doors: [{ x, y, targetRoom, targetX, targetY }] }

// prettier-ignore
const ROOMS = {
  plaza: {
    name: { en: "Town Plaza", es: "Plaza del Pueblo" },
    map: [
      [ 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [ 4, 0, 0, 5, 0, 1, 1, 1, 1, 1, 1, 1, 0, 5, 0, 0, 6, 4],
      [ 4, 0, 5, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 5, 0, 4],
      [ 4, 0, 0, 0, 8, 1, 0, 5, 0, 5, 0, 1, 8, 0, 0, 0, 0, 4],
      [ 4, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 7, 4],
      [ 4, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 4],
      [ 4, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 4],
      [ 4, 0,11, 0, 8, 1, 9, 9, 1, 9, 9, 1, 8, 0, 0,11, 0, 4],
      [ 4, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 4],
      [ 4, 5, 0,12, 0, 1, 0, 0, 1, 0, 0, 1, 0,12, 0, 5, 0, 4],
      [ 4, 0, 0, 0, 0, 1, 0, 5, 0, 5, 0, 1, 0, 0, 0, 0, 6, 4],
      [ 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    ],
    startX: 9,
    startY: 8,
    doors: [
      { x: 3, y: 9, target: "library", tx: 8, ty: 8 },
      { x: 13, y: 9, target: "cabin", tx: 5, ty: 7 },
    ],
  },

  library: {
    name: { en: "Library", es: "Biblioteca" },
    map: [
      [14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14],
      [14,21,14,15,15,15,14,21,14,21,14,15,15,15,14,21,14,14],
      [14,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14],
      [14,13,22,13,13,13,13,13,13,13,13,13,13,13,22,13,13,14],
      [14,13,13,13,17,17,17,13,13,13,17,17,17,13,13,13,13,14],
      [14,13,13,13,17,16,17,13, 6,13,17,16,17,13,13,13, 7,14],
      [14,13,23,13,17,17,17,13,13,13,17,17,17,13,23,13,13,14],
      [14,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14],
      [14,13,13,13,13,13,13,13,12,13,13,13,13,13,13,13,13,14],
      [14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14],
    ],
    startX: 8,
    startY: 8,
    doors: [
      { x: 8, y: 8, target: "plaza", tx: 3, ty: 8 },
    ],
  },

  cabin: {
    name: { en: "Cozy Cabin", es: "Cabaña Acogedora" },
    map: [
      [14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14],
      [14,21,14,14,18,18,18,14,14,21,14,14,20,20,14,21,14,14],
      [14,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14],
      [14,13,19,19,13,13,13,13,13,13,13,13,13,13,13,23,13,14],
      [14,13,13,13,13,17,17,17,17,13,13,13,13,13,13,13,13,14],
      [14,13,13,13,13,17,16,16,17,13, 6,13,13,13,13,13,11,14],
      [14,13,23,13,13,17,17,17,17,13,13,13,13,22,13,13,13,14],
      [14,13,13,13,13,12,13,13,13,13,13,13,13,13,13, 7,13,14],
      [14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14],
    ],
    startX: 5,
    startY: 7,
    doors: [
      { x: 5, y: 7, target: "plaza", tx: 13, ty: 8 },
    ],
  },
};

// ─── Interaction messages ───────────────────────────────────────────────────
const MESSAGES = {
  [SIGN]: {
    en: [
      "Welcome, adventurer! Explore while your game loads.",
      "Tip: Talk to NPCs in the real game to practice vocabulary!",
      "Fun fact: Language learning is like leveling up your brain.",
      "Pro tip: Complete quests to earn XP and unlock new lessons!",
      "The bridge connects two worlds... just like languages do.",
      "Try entering the doorways to discover new rooms!",
    ],
    es: [
      "¡Bienvenido, aventurero! Explora mientras carga tu juego.",
      "Consejo: ¡Habla con los NPCs en el juego real para practicar!",
      "Dato curioso: Aprender idiomas es como subir de nivel tu cerebro.",
      "Consejo pro: ¡Completa misiones para ganar XP y desbloquear lecciones!",
      "El puente conecta dos mundos... igual que los idiomas.",
      "¡Intenta entrar por las puertas para descubrir nuevas salas!",
    ],
  },
  [CHEST]: {
    en: [
      "You found a hidden treasure! ...it's knowledge!",
      "A scroll inside reads: 'Practice makes permanente'",
      "You discover a glowing rune... it says 'XP +100' (just kidding)",
      "Inside: a tiny map of all the worlds you'll explore!",
    ],
    es: [
      "¡Encontraste un tesoro escondido! ...¡es conocimiento!",
      "Un pergamino dice: 'La práctica hace al maestro'",
      "Descubres una runa brillante... dice 'XP +100' (es broma)",
      "Dentro: ¡un mapa pequeño de todos los mundos que explorarás!",
    ],
  },
  [LAMP]: {
    en: [
      "The lamp flickers warmly. It feels cozy here.",
      "A soft glow illuminates some ancient text... illegible.",
    ],
    es: [
      "La lámpara parpadea cálidamente. Se siente acogedor.",
      "Un brillo suave ilumina un texto antiguo... ilegible.",
    ],
  },
  [PLANT_POT]: {
    en: [
      "A happy little plant. It seems to like this spot.",
      "The leaves rustle gently as you pass by.",
    ],
    es: [
      "Una plantita feliz. Parece que le gusta este lugar.",
      "Las hojas se mueven suavemente cuando pasas.",
    ],
  },
  [TABLE]: {
    en: [
      "A sturdy wooden table. Someone left notes about verb conjugations.",
      "The table has scratch marks from years of study sessions.",
    ],
    es: [
      "Una mesa resistente. Alguien dejó notas sobre conjugaciones.",
      "La mesa tiene marcas de años de sesiones de estudio.",
    ],
  },
};

// ─── Dog character colors (matches PLAYER_COLORS from pixelArt.js) ──────────
const DOG = {
  fur: "#d97706",
  furDark: "#a85d04",
  furLight: "#e5952a",
  belly: "#fef3c7",
  ear: "#92400e",
  paw: "#78350f",
  accent: "#2563eb", // scarf
  nose: "#111827",
  tongue: "#fb7185",
  eyeWhite: "#ffffff",
  eyePupil: "#1f2937",
  outline: "#1a1a2e",
};

// ─── Color palette ──────────────────────────────────────────────────────────
const TRUNK_COLOR = "#5a3a1a";
const LEAF_COLORS = ["#2d8c3a", "#1a7028", "#40a050"];
const WATER_HIGHLIGHT = "#4a9fdd";
const SIGN_POST = "#6b4e1f";

function seededRng(x, y) {
  let h = (x * 374761393 + y * 668265263 + 1013904223) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ─── Tile drawing ───────────────────────────────────────────────────────────
function drawGrass(ctx, x, y) {
  const greens = ["#3a7d44", "#2d6b35", "#4a8c54"];
  ctx.fillStyle = greens[Math.floor(seededRng(x, y) * greens.length)];
  ctx.fillRect(x * T, y * T, T, T);
  const rng = seededRng(x + 100, y + 100);
  if (rng > 0.5) {
    ctx.fillStyle = "#4a9c58";
    const bx = x * T + 6 + seededRng(x + 30, y) * (T - 12);
    const by = y * T + 8 + seededRng(x, y + 30) * (T - 16);
    ctx.fillRect(bx, by, 3, 8);
    ctx.fillRect(bx + 12, by - 4, 3, 8);
  }
  if (rng > 0.75) {
    ctx.fillStyle = "#5aac68";
    ctx.fillRect(x * T + 20, y * T + 28, 3, 6);
  }
}

function drawPath(ctx, x, y) {
  const paths = ["#c4a46c", "#b89a62", "#d4b47c"];
  ctx.fillStyle = paths[Math.floor(seededRng(x, y) * paths.length)];
  ctx.fillRect(x * T, y * T, T, T);
  if (seededRng(x + 50, y + 50) > 0.4) {
    ctx.fillStyle = "#a08a5c";
    ctx.fillRect(x * T + 12, y * T + 20, 6, 4);
  }
  if (seededRng(x + 70, y + 70) > 0.55) {
    ctx.fillStyle = "#baa470";
    ctx.fillRect(x * T + 30, y * T + 10, 5, 4);
  }
}

function drawWater(ctx, x, y, frame) {
  ctx.fillStyle = "#2a6faa";
  ctx.fillRect(x * T, y * T, T, T);
  const off = ((frame * 0.025 + x * 0.5) % 1) * T;
  ctx.fillStyle = WATER_HIGHLIGHT;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x * T + off, y * T + 10, 12, 3);
  ctx.fillRect(x * T + ((off + 20) % T), y * T + 28, 10, 3);
  ctx.globalAlpha = 1;
}

function drawTree(ctx, x, y) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 3;
  ctx.fillStyle = TRUNK_COLOR;
  ctx.fillRect(cx - 4, by - 24, 8, 18);
  const leafC = LEAF_COLORS[Math.floor(seededRng(x, y) * LEAF_COLORS.length)];
  ctx.fillStyle = leafC;
  ctx.beginPath(); ctx.arc(cx, by - 30, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = LEAF_COLORS[1];
  ctx.beginPath(); ctx.arc(cx - 6, by - 27, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = LEAF_COLORS[2];
  ctx.beginPath(); ctx.arc(cx + 7, by - 26, 9, 0, Math.PI * 2); ctx.fill();
}

function drawFlower(ctx, x, y) {
  drawGrass(ctx, x, y);
  const flowerColors = ["#e85d9a", "#f0c040", "#ff6b6b", "#a06ef0"];
  const count = seededRng(x + 200, y + 200) > 0.5 ? 3 : 2;
  for (let i = 0; i < count; i++) {
    const fx = x * T + 6 + seededRng(x + i * 13, y) * (T - 12);
    const fy = y * T + 6 + seededRng(x, y + i * 17) * (T - 12);
    const fc = flowerColors[Math.floor(seededRng(x + i, y + i) * flowerColors.length)];
    ctx.fillStyle = "#3a7d44";
    ctx.fillRect(fx, fy, 3, 9);
    ctx.fillStyle = fc;
    ctx.fillRect(fx - 3, fy - 3, 9, 6);
    ctx.fillRect(fx, fy - 6, 3, 3);
  }
}

function drawSign(ctx, x, y) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 3;
  ctx.fillStyle = SIGN_POST;
  ctx.fillRect(cx - 3, by - 30, 6, 27);
  ctx.fillStyle = "#8b6914";
  ctx.fillRect(cx - 15, by - 38, 30, 14);
  ctx.fillStyle = "#a07a20";
  ctx.fillRect(cx - 13, by - 36, 26, 10);
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - 2, by - 35, 3, 6);
  ctx.fillRect(cx - 2, by - 28, 3, 2);
}

function drawChest(ctx, x, y) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 6;
  ctx.fillStyle = "#b8860b";
  ctx.fillRect(cx - 12, by - 16, 24, 14);
  ctx.fillStyle = "#c89620";
  ctx.fillRect(cx - 13, by - 22, 26, 8);
  ctx.fillStyle = "#ffd700";
  ctx.fillRect(cx - 3, by - 16, 6, 4);
  ctx.fillStyle = "#00000020";
  ctx.fillRect(cx - 12, by - 2, 24, 3);
}

function drawRock(ctx, x, y) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 6;
  ctx.fillStyle = "#7a7a7a";
  ctx.beginPath(); ctx.ellipse(cx, by - 8, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#8a8a8a";
  ctx.beginPath(); ctx.ellipse(cx - 3, by - 11, 8, 6, -0.3, 0, Math.PI * 2); ctx.fill();
}

function drawBridge(ctx, x, y) {
  ctx.fillStyle = "#2a6faa";
  ctx.fillRect(x * T, y * T, T, T);
  ctx.fillStyle = "#8b6d4a";
  ctx.fillRect(x * T + 3, y * T, T - 6, T);
  ctx.fillStyle = "#9c7e5a";
  for (let i = 0; i < T; i += 12) {
    ctx.fillRect(x * T + 3, y * T + i, T - 6, 1);
  }
  ctx.fillStyle = TRUNK_COLOR;
  ctx.fillRect(x * T + 1, y * T, 3, T);
  ctx.fillRect(x * T + T - 4, y * T, 3, T);
}

function drawLamp(ctx, x, y, frame) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 3;
  ctx.fillStyle = "#4a4a4a";
  ctx.fillRect(cx - 3, by - 36, 6, 33);
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(cx - 7, by - 40, 14, 7);
  const ga = 0.25 + Math.sin(frame * 0.05) * 0.1;
  ctx.fillStyle = `rgba(255, 220, 100, ${ga})`;
  ctx.beginPath(); ctx.arc(cx, by - 36, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(cx - 4, by - 39, 8, 4);
}

function drawDoor(ctx, x, y, frame) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 3;
  // doorframe
  ctx.fillStyle = "#6b4226";
  ctx.fillRect(cx - 14, by - 36, 28, 36);
  // door face
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(cx - 11, by - 33, 22, 33);
  // panels
  ctx.fillStyle = "#7a4a20";
  ctx.fillRect(cx - 8, by - 30, 7, 10);
  ctx.fillRect(cx + 1, by - 30, 7, 10);
  ctx.fillRect(cx - 8, by - 16, 7, 10);
  ctx.fillRect(cx + 1, by - 16, 7, 10);
  // handle
  ctx.fillStyle = "#daa520";
  ctx.fillRect(cx + 6, by - 18, 3, 3);
  // glow hint
  const ga = 0.3 + Math.sin(frame * 0.06) * 0.15;
  ctx.fillStyle = `rgba(255, 220, 100, ${ga})`;
  ctx.fillRect(cx - 11, by - 1, 22, 2);
}

// ─── Indoor tiles ───────────────────────────────────────────────────────────
function drawFloor(ctx, x, y) {
  const floors = ["#b89a72", "#a88a62", "#c8aa82"];
  ctx.fillStyle = floors[Math.floor(seededRng(x, y) * floors.length)];
  ctx.fillRect(x * T, y * T, T, T);
  // wood grain
  ctx.fillStyle = "#a08050";
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < T; i += 8) {
    ctx.fillRect(x * T, y * T + i, T, 1);
  }
  ctx.globalAlpha = 1;
}

function drawWallTop(ctx, x, y) {
  ctx.fillStyle = "#5a4a3a";
  ctx.fillRect(x * T, y * T, T, T);
  ctx.fillStyle = "#4a3a2a";
  ctx.fillRect(x * T, y * T + T - 3, T, 3);
  // brick pattern
  ctx.fillStyle = "#6a5a4a";
  ctx.globalAlpha = 0.3;
  const off = (y % 2) * (T / 2);
  for (let bx = 0; bx < T; bx += T / 2) {
    ctx.fillRect(x * T + bx + off, y * T, 1, T);
  }
  ctx.globalAlpha = 1;
}

function drawBookshelf(ctx, x, y) {
  drawWallTop(ctx, x, y);
  const bx = x * T + 4;
  const by = y * T + 4;
  const bw = T - 8;
  const bh = T - 6;
  // shelving
  ctx.fillStyle = "#6b4226";
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
  // shelves
  ctx.fillStyle = "#6b4226";
  const shelfH = Math.floor(bh / 3);
  for (let i = 1; i < 3; i++) {
    ctx.fillRect(bx + 2, by + shelfH * i, bw - 4, 2);
  }
  // books
  const bookColors = ["#c0392b", "#2980b9", "#27ae60", "#8e44ad", "#f39c12", "#e74c3c"];
  for (let s = 0; s < 3; s++) {
    const sy = by + shelfH * s + 4;
    let bkx = bx + 4;
    for (let b = 0; b < 5; b++) {
      const w = 3 + seededRng(x + b, y + s) * 4;
      ctx.fillStyle = bookColors[Math.floor(seededRng(x * 7 + b, y * 3 + s) * bookColors.length)];
      ctx.fillRect(bkx, sy, w, shelfH - 6);
      bkx += w + 1;
      if (bkx > bx + bw - 6) break;
    }
  }
}

function drawTable(ctx, x, y) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 8;
  // legs
  ctx.fillStyle = "#5a3a1a";
  ctx.fillRect(cx - 14, by + 2, 4, 6);
  ctx.fillRect(cx + 10, by + 2, 4, 6);
  // surface
  ctx.fillStyle = "#8b6d4a";
  ctx.fillRect(cx - 16, by - 6, 32, 8);
  ctx.fillStyle = "#9c7e5a";
  ctx.fillRect(cx - 14, by - 5, 28, 6);
}

function drawRug(ctx, x, y) {
  drawFloor(ctx, x, y);
  ctx.fillStyle = "#8b2252";
  ctx.globalAlpha = 0.6;
  ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
  ctx.fillStyle = "#cd5c5c";
  ctx.globalAlpha = 0.5;
  ctx.fillRect(x * T + 6, y * T + 6, T - 12, T - 12);
  ctx.globalAlpha = 1;
  // pattern
  ctx.fillStyle = "#daa520";
  ctx.globalAlpha = 0.4;
  ctx.fillRect(x * T + 4, y * T + 4, T - 8, 2);
  ctx.fillRect(x * T + 4, y * T + T - 6, T - 8, 2);
  ctx.fillRect(x * T + 4, y * T + 4, 2, T - 8);
  ctx.fillRect(x * T + T - 6, y * T + 4, 2, T - 8);
  ctx.globalAlpha = 1;
}

function drawFireplace(ctx, x, y, frame) {
  drawWallTop(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 2;
  // stone surround
  ctx.fillStyle = "#6a6a6a";
  ctx.fillRect(cx - 16, by - 34, 32, 34);
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(cx - 12, by - 30, 24, 26);
  // opening
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - 10, by - 24, 20, 20);
  // fire (animated)
  const fl = Math.sin(frame * 0.12) * 3;
  ctx.fillStyle = "#ff4500";
  ctx.beginPath();
  ctx.ellipse(cx, by - 14 + fl, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff8c00";
  ctx.beginPath();
  ctx.ellipse(cx - 2, by - 12 - fl, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.ellipse(cx + 1, by - 10, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSofa(ctx, x, y) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 6;
  // back
  ctx.fillStyle = "#6a3030";
  ctx.fillRect(cx - 16, by - 18, 32, 8);
  // seat cushion
  ctx.fillStyle = "#8b4040";
  ctx.fillRect(cx - 16, by - 10, 32, 12);
  // cushion lines
  ctx.fillStyle = "#7a3535";
  ctx.fillRect(cx, by - 10, 2, 12);
  // armrests
  ctx.fillStyle = "#6a3030";
  ctx.fillRect(cx - 18, by - 14, 4, 16);
  ctx.fillRect(cx + 14, by - 14, 4, 16);
}

function drawBed(ctx, x, y) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 4;
  // frame
  ctx.fillStyle = "#5a3a1a";
  ctx.fillRect(cx - 16, by - 28, 32, 28);
  // mattress
  ctx.fillStyle = "#e8e0d0";
  ctx.fillRect(cx - 14, by - 26, 28, 22);
  // pillow
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(cx - 10, by - 24, 20, 8);
  // blanket
  ctx.fillStyle = "#4a7abc";
  ctx.fillRect(cx - 14, by - 12, 28, 10);
}

function drawWindowTile(ctx, x, y) {
  drawWallTop(ctx, x, y);
  const cx = x * T + T / 2;
  const cy = y * T + T / 2;
  // frame
  ctx.fillStyle = "#8b6d4a";
  ctx.fillRect(cx - 12, cy - 14, 24, 22);
  // glass
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(cx - 10, cy - 12, 20, 18);
  // panes
  ctx.fillStyle = "#8b6d4a";
  ctx.fillRect(cx - 1, cy - 12, 2, 18);
  ctx.fillRect(cx - 10, cy - 1, 20, 2);
  // light
  ctx.fillStyle = "rgba(135, 206, 235, 0.15)";
  ctx.fillRect(cx - 14, cy + 8, 28, 20);
}

function drawDesk(ctx, x, y) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 6;
  // legs
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(cx - 14, by, 4, 6);
  ctx.fillRect(cx + 10, by, 4, 6);
  // surface
  ctx.fillStyle = "#6b4226";
  ctx.fillRect(cx - 16, by - 8, 32, 8);
  ctx.fillStyle = "#7a522e";
  ctx.fillRect(cx - 14, by - 7, 28, 6);
  // items on desk
  ctx.fillStyle = "#f0f0e0";
  ctx.fillRect(cx - 8, by - 12, 10, 6); // paper
  ctx.fillStyle = "#333";
  ctx.fillRect(cx + 6, by - 10, 2, 6); // pen
}

function drawPlantPot(ctx, x, y) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 6;
  // pot
  ctx.fillStyle = "#b05030";
  ctx.fillRect(cx - 8, by - 10, 16, 12);
  ctx.fillStyle = "#c06040";
  ctx.fillRect(cx - 6, by - 8, 12, 8);
  // rim
  ctx.fillStyle = "#b05030";
  ctx.fillRect(cx - 9, by - 12, 18, 4);
  // plant
  ctx.fillStyle = "#3a8a44";
  ctx.beginPath(); ctx.arc(cx, by - 20, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#4a9c54";
  ctx.beginPath(); ctx.arc(cx - 4, by - 22, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 5, by - 18, 6, 0, Math.PI * 2); ctx.fill();
}

function drawDoorIndoor(ctx, x, y, frame) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T;
  // mat
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(cx - 14, by - 6, 28, 6);
  // glow hint
  const ga = 0.25 + Math.sin(frame * 0.06) * 0.15;
  ctx.fillStyle = `rgba(100, 200, 255, ${ga})`;
  ctx.fillRect(cx - 12, by - 5, 24, 4);
  // arrow
  ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(frame * 0.08) * 0.3})`;
  ctx.font = `bold ${Math.round(T * 0.4)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("↓", cx, by - 10);
}

// Tile dispatch
function drawTile(ctx, x, y, tile, frame, isIndoor) {
  switch (tile) {
    case GRASS: return drawGrass(ctx, x, y);
    case PATH: return drawPath(ctx, x, y);
    case WATER: return drawWater(ctx, x, y, frame);
    case TREE: return drawTree(ctx, x, y);
    case FLOWER: return drawFlower(ctx, x, y);
    case SIGN: return isIndoor ? (drawFloor(ctx, x, y), drawSign(ctx, x, y)) : drawSign(ctx, x, y);
    case CHEST: return isIndoor ? (drawFloor(ctx, x, y), drawChest(ctx, x, y)) : drawChest(ctx, x, y);
    case ROCK: return drawRock(ctx, x, y);
    case BRIDGE: return drawBridge(ctx, x, y);
    case LAMP: return isIndoor ? (drawFloor(ctx, x, y), drawLamp(ctx, x, y, frame)) : drawLamp(ctx, x, y, frame);
    case DOOR: return isIndoor ? drawDoorIndoor(ctx, x, y, frame) : drawDoor(ctx, x, y, frame);
    case FLOOR: return drawFloor(ctx, x, y);
    case WALL_TOP: return drawWallTop(ctx, x, y);
    case BOOKSHELF: return drawBookshelf(ctx, x, y);
    case TABLE: return drawTable(ctx, x, y);
    case RUG: return drawRug(ctx, x, y);
    case FIREPLACE: return drawFireplace(ctx, x, y, frame);
    case SOFA: return drawSofa(ctx, x, y);
    case BED: return drawBed(ctx, x, y);
    case WINDOW_TILE: return drawWindowTile(ctx, x, y);
    case DESK: return drawDesk(ctx, x, y);
    case PLANT_POT: return drawPlantPot(ctx, x, y);
    default: return drawGrass(ctx, x, y);
  }
}

// ─── Dog character drawing (matches createCharacterTexture in pixelArt.js) ──
function drawDogCharacter(ctx, px, py, dir, frame) {
  const cx = px * T + T / 2;
  const cy = py * T + T / 2;
  const phase = frame % 6;
  const stride = phase === 1 || phase === 5 ? 2 : phase === 3 ? -2 : 0;
  const bob = phase === 2 || phase === 4 ? -2 : 0;
  const tailWag = phase % 2 === 0 ? -2 : 2;

  const by = cy + 6; // base y (feet)
  const headY = by - 28 + bob;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(cx, by + 4, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const d = (fillStyle, rx, ry, rw, rh) => {
    ctx.fillStyle = fillStyle;
    ctx.fillRect(rx, ry, rw, rh);
  };

  if (dir === "down" || dir === "idle") {
    // tail (behind)
    d(DOG.furDark, cx - 2 + tailWag, by - 22 + bob, 4, 6);

    // body
    d(DOG.fur, cx - 10, by - 18 + bob, 20, 14);
    // belly
    d(DOG.belly, cx - 6, by - 12 + bob, 12, 10);
    // scarf
    d(DOG.accent, cx - 10, by - 18 + bob, 20, 4);

    // paws
    d(DOG.paw, cx - 8 + stride, by - 2, 6, 5);
    d(DOG.paw, cx + 2 - stride, by - 2, 6, 5);

    // head
    d(DOG.fur, cx - 10, headY, 20, 16);
    d(DOG.furLight, cx - 8, headY + 2, 16, 10);
    // ears (floppy dog ears)
    d(DOG.ear, cx - 14, headY + 2, 6, 14);
    d(DOG.ear, cx + 8, headY + 2, 6, 14);
    // muzzle
    d(DOG.belly, cx - 6, headY + 8, 12, 8);
    // eyes
    d(DOG.eyeWhite, cx - 6, headY + 6, 4, 4);
    d(DOG.eyeWhite, cx + 2, headY + 6, 4, 4);
    d(DOG.eyePupil, cx - 5, headY + 7, 3, 3);
    d(DOG.eyePupil, cx + 3, headY + 7, 3, 3);
    // nose
    d(DOG.nose, cx - 2, headY + 10, 4, 3);
    // tongue on idle
    if (phase % 4 < 2) {
      d(DOG.tongue, cx - 1, headY + 13, 3, 4);
    }
  } else if (dir === "up") {
    // body
    d(DOG.furDark, cx - 10, by - 18 + bob, 20, 14);
    d(DOG.fur, cx - 8, by - 16 + bob, 16, 10);
    // scarf
    d(DOG.accent, cx - 10, by - 18 + bob, 20, 4);

    // tail (visible from back)
    d(DOG.furDark, cx - 2 + tailWag, by - 24 + bob, 4, 8);
    d(DOG.furLight, cx - 1 + tailWag, by - 24 + bob, 2, 4);

    // paws
    d(DOG.paw, cx - 8 + stride, by - 2, 6, 5);
    d(DOG.paw, cx + 2 - stride, by - 2, 6, 5);

    // head (back view)
    d(DOG.furDark, cx - 10, headY, 20, 16);
    d(DOG.fur, cx - 8, headY + 2, 16, 12);
    // ears
    d(DOG.ear, cx - 14, headY + 2, 6, 14);
    d(DOG.ear, cx + 8, headY + 2, 6, 14);
  } else {
    // Side view: always draw facing left, flip canvas for right
    if (dir === "right") {
      ctx.save();
      ctx.translate(cx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-cx, 0);
    }

    const offX = cx - 12;

    // tail (behind, right side of body when facing left)
    d(DOG.furDark, cx + 6 - tailWag, by - 22 + bob, 4, 8);
    d(DOG.furLight, cx + 7 - tailWag, by - 22 + bob, 2, 4);

    // body
    d(DOG.fur, offX, by - 18 + bob, 20, 14);
    d(DOG.belly, offX + 4, by - 12 + bob, 12, 10);
    // scarf
    d(DOG.accent, offX, by - 18 + bob, 20, 4);

    // paws
    d(DOG.paw, offX + 2 + stride, by - 2, 6, 5);
    d(DOG.paw, offX + 12 - stride, by - 2, 6, 5);

    // head
    const hx = cx - 12;
    d(DOG.fur, hx, headY, 20, 16);
    // ear (one visible, left side)
    d(DOG.ear, hx - 4, headY + 2, 6, 14);
    // muzzle
    d(DOG.belly, hx - 2, headY + 8, 10, 8);
    // eye
    d(DOG.eyeWhite, hx + 4, headY + 6, 4, 4);
    d(DOG.eyePupil, hx + 4, headY + 7, 3, 3);
    // nose
    d(DOG.nose, hx - 1, headY + 10, 3, 3);
    // tongue
    if (phase % 4 < 2) {
      d(DOG.tongue, hx - 1, headY + 13, 3, 3);
    }

    if (dir === "right") {
      ctx.restore();
    }
  }
}

// ─── Interaction hint ───────────────────────────────────────────────────────
function drawInteractHint(ctx, tileX, tileY, frame) {
  const cx = tileX * T + T / 2;
  const cy = tileY * T - 6;
  const bounce = Math.sin(frame * 0.08) * 4;
  const alpha = 0.6 + Math.sin(frame * 0.1) * 0.3;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffd700";
  ctx.font = `bold ${Math.round(T * 0.45)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("!", cx, cy + bounce);
  ctx.restore();
}

// ─── Room transition effect ─────────────────────────────────────────────────
function drawTransition(ctx, w, h, progress) {
  ctx.fillStyle = "#000";
  ctx.globalAlpha = progress < 0.5 ? progress * 2 : 2 - progress * 2;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function LoadingMiniGame({ supportLang = "en" }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { playSound, warmupAudio } = useSoundSettings();

  const stateRef = useRef({
    px: ROOMS.plaza.startX,
    py: ROOMS.plaza.startY,
    dir: "down",
    frame: 0,
    walkFrame: 0,
    lastMove: 0,
    keysDown: new Set(),
    touchStart: null,
    currentRoom: "plaza",
    msgIdx: {},
    transitioning: false,
    transitionProgress: 0,
    transitionTarget: null,
    moving: false,
  });

  const [message, setMessage] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [objectsFound, setObjectsFound] = useState(new Set());
  const messageTimeoutRef = useRef(null);
  const roomNameTimeoutRef = useRef(null);

  // Count total interactables across all rooms
  const totalInteractables = useRef(0);
  if (totalInteractables.current === 0) {
    for (const [, room] of Object.entries(ROOMS)) {
      for (const row of room.map) {
        for (const tile of row) {
          if (INTERACT_TILES.has(tile)) totalInteractables.current++;
        }
      }
    }
  }

  const playGameSound = useCallback(
    (name) => {
      void (async () => {
        await warmupAudio();
        await playSound(name);
      })();
    },
    [playSound, warmupAudio],
  );

  const showMessage = useCallback((text) => {
    setMessage(text);
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = setTimeout(() => setMessage(null), 4000);
  }, []);

  const showRoomName = useCallback((name) => {
    setRoomName(name);
    if (roomNameTimeoutRef.current) clearTimeout(roomNameTimeoutRef.current);
    roomNameTimeoutRef.current = setTimeout(() => setRoomName(null), 2000);
  }, []);

  const handleInteract = useCallback(
    (tileX, tileY) => {
      const s = stateRef.current;
      const room = ROOMS[s.currentRoom];
      const tile = room.map[tileY]?.[tileX];
      if (!tile || !MESSAGES[tile]) return;

      const lang = supportLang === "es" ? "es" : "en";
      const msgs = MESSAGES[tile][lang];
      const key = `${s.currentRoom}:${tileX},${tileY}`;
      const idxKey = `${tile}`;

      if (!s.msgIdx[idxKey]) s.msgIdx[idxKey] = 0;
      const idx = s.msgIdx[idxKey] % msgs.length;
      showMessage(msgs[idx]);
      s.msgIdx[idxKey]++;
      setObjectsFound((prev) => new Set(prev).add(key));
      playGameSound("rpgDialogueOpen");
    },
    [supportLang, showMessage, playGameSound],
  );

  const tryInteract = useCallback(() => {
    const s = stateRef.current;
    if (s.transitioning) return;
    const dx = { left: -1, right: 1, up: 0, down: 0 }[s.dir];
    const dy = { left: 0, right: 0, up: -1, down: 1 }[s.dir];
    const tx = s.px + dx;
    const ty = s.py + dy;
    const room = ROOMS[s.currentRoom];
    if (
      tx >= 0 && tx < room.map[0].length &&
      ty >= 0 && ty < room.map.length &&
      INTERACT_TILES.has(room.map[ty][tx])
    ) {
      handleInteract(tx, ty);
    }
  }, [handleInteract]);

  const enterDoor = useCallback(
    (door) => {
      const s = stateRef.current;
      if (s.transitioning) return;
      s.transitioning = true;
      s.transitionProgress = 0;
      s.transitionTarget = door;
      playGameSound("rpgDialogueSelect");
    },
    [playGameSound],
  );

  // Click/tap to interact with a specific tile
  const handleCanvasClick = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const s = stateRef.current;
      if (s.transitioning) return;

      const rect = canvas.getBoundingClientRect();
      const room = ROOMS[s.currentRoom];
      const mapW = room.map[0].length;
      const mapH = room.map.length;

      // Convert click position through camera transform to tile coordinates
      const pixelX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const pixelY = (e.clientY - rect.top) * (canvas.height / rect.height);
      const worldX = (pixelX - (s.camX || 0)) / (s.scaleVal || 1);
      const worldY = (pixelY - (s.camY || 0)) / (s.scaleVal || 1);
      const tileX = Math.floor(worldX / T);
      const tileY = Math.floor(worldY / T);

      if (tileX < 0 || tileX >= mapW || tileY < 0 || tileY >= mapH) return;

      const tile = room.map[tileY][tileX];

      // Check if clicked tile is interactable
      if (INTERACT_TILES.has(tile)) {
        handleInteract(tileX, tileY);
        // Face toward the clicked object
        const diffX = tileX - s.px;
        const diffY = tileY - s.py;
        if (Math.abs(diffX) > Math.abs(diffY)) {
          s.dir = diffX > 0 ? "right" : "left";
        } else {
          s.dir = diffY > 0 ? "down" : "up";
        }
        return;
      }

      // Check if clicked a door
      if (tile === DOOR) {
        const door = room.doors.find((d) => d.x === tileX && d.y === tileY);
        if (door) {
          enterDoor(door);
          return;
        }
      }
    },
    [handleInteract, enterDoor],
  );

  const tryMove = useCallback(
    (dir) => {
      const now = Date.now();
      const s = stateRef.current;
      s.dir = dir;
      if (s.transitioning) return;
      if (now - s.lastMove < MOVE_COOLDOWN) return;

      const room = ROOMS[s.currentRoom];
      const mapW = room.map[0].length;
      const mapH = room.map.length;
      const dx = { left: -1, right: 1, up: 0, down: 0 }[dir];
      const dy = { left: 0, right: 0, up: -1, down: 1 }[dir];
      const nx = s.px + dx;
      const ny = s.py + dy;

      if (nx < 0 || nx >= mapW || ny < 0 || ny >= mapH) return;

      const targetTile = room.map[ny][nx];

      // Check for door
      if (targetTile === DOOR) {
        const door = room.doors.find((d) => d.x === nx && d.y === ny);
        if (door) {
          enterDoor(door);
          s.lastMove = now;
          return;
        }
      }

      if (SOLID_TILES.has(targetTile) || INTERACT_TILES.has(targetTile)) return;

      s.px = nx;
      s.py = ny;
      s.lastMove = now;
      s.walkFrame++;
      s.moving = true;
      playGameSound("rpgStep");
    },
    [enterDoor, playGameSound],
  );

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      stateRef.current.keysDown.add(key);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
        e.preventDefault();
      }
      if (key === "e" || key === "enter" || key === " ") {
        e.preventDefault();
        tryInteract();
      }
    };
    const onKeyUp = (e) => {
      stateRef.current.keysDown.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [tryInteract]);

  // Touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouchStart = (e) => {
      e.preventDefault();
      const t = e.touches[0];
      stateRef.current.touchStart = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e) => {
      e.preventDefault();
      if (!stateRef.current.touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - stateRef.current.touchStart.x;
      const dy = t.clientY - stateRef.current.touchStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      stateRef.current.touchStart = null;
      if (dist < 15) { tryInteract(); return; }
      if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? "right" : "left");
      else tryMove(dy > 0 ? "down" : "up");
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [tryMove, tryInteract]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    let animId;
    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      // Match canvas buffer to container size (like RPGGame does with renderer.setSize)
      const container = containerRef.current;
      if (!container) { animId = requestAnimationFrame(loop); return; }
      const cRect = container.getBoundingClientRect();
      const cw = Math.round(cRect.width);
      const ch = Math.round(cRect.height);
      if (cw === 0 || ch === 0) { animId = requestAnimationFrame(loop); return; }
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        ctx.imageSmoothingEnabled = false;
      }

      // Handle transition
      if (s.transitioning) {
        s.transitionProgress += 0.04;
        if (s.transitionProgress >= 0.5 && s.transitionTarget) {
          const door = s.transitionTarget;
          s.currentRoom = door.target;
          s.px = door.tx;
          s.py = door.ty;
          s.transitionTarget = null;
          const lang = supportLang === "es" ? "es" : "en";
          showRoomName(ROOMS[s.currentRoom].name[lang]);
        }
        if (s.transitionProgress >= 1) {
          s.transitioning = false;
          s.transitionProgress = 0;
        }
      }

      // Process held keys
      const keys = s.keysDown;
      s.moving = false;
      if (keys.has("arrowup") || keys.has("w")) tryMove("up");
      else if (keys.has("arrowdown") || keys.has("s")) tryMove("down");
      else if (keys.has("arrowleft") || keys.has("a")) tryMove("left");
      else if (keys.has("arrowright") || keys.has("d")) tryMove("right");

      const room = ROOMS[s.currentRoom];
      const mapW = room.map[0].length;
      const mapH = room.map.length;
      const mapPixelW = mapW * T;
      const mapPixelH = mapH * T;
      const isIndoor = s.currentRoom !== "plaza";

      // Calculate scale to fill the container (cover, not contain)
      const scaleVal = Math.max(cw / mapPixelW, ch / mapPixelH);

      // Camera follows player, clamped to map edges
      const playerCenterX = (s.px + 0.5) * T * scaleVal;
      const playerCenterY = (s.py + 0.5) * T * scaleVal;
      const scaledMapW = mapPixelW * scaleVal;
      const scaledMapH = mapPixelH * scaleVal;

      let camX = cw / 2 - playerCenterX;
      let camY = ch / 2 - playerCenterY;
      // Clamp so we don't show past map edges
      camX = Math.min(0, Math.max(cw - scaledMapW, camX));
      camY = Math.min(0, Math.max(ch - scaledMapH, camY));

      // Store camera info for click coordinate conversion
      s.camX = camX;
      s.camY = camY;
      s.scaleVal = scaleVal;

      ctx.clearRect(0, 0, cw, ch);

      // Fill background for any uncovered area
      ctx.fillStyle = isIndoor ? "#3a2a1a" : "#08142b";
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(camX, camY);
      ctx.scale(scaleVal, scaleVal);

      // Draw tiles
      for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) {
          drawTile(ctx, x, y, room.map[y][x], s.frame, isIndoor);
        }
      }

      // Interact hint
      const fdx = { left: -1, right: 1, up: 0, down: 0 }[s.dir];
      const fdy = { left: 0, right: 0, up: -1, down: 1 }[s.dir];
      const facingX = s.px + fdx;
      const facingY = s.py + fdy;
      if (
        facingX >= 0 && facingX < mapW &&
        facingY >= 0 && facingY < mapH &&
        INTERACT_TILES.has(room.map[facingY][facingX])
      ) {
        drawInteractHint(ctx, facingX, facingY, s.frame);
      }

      // Draw player
      const animFrame = s.moving ? s.walkFrame : 0;
      drawDogCharacter(ctx, s.px, s.py, s.dir, animFrame);

      ctx.restore();

      // Draw transition overlay (full screen)
      if (s.transitioning) {
        drawTransition(ctx, cw, ch, s.transitionProgress);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tryMove, supportLang, showRoomName]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      if (roomNameTimeoutRef.current) clearTimeout(roomNameTimeoutRef.current);
    };
  }, []);

  // Show initial room name
  useEffect(() => {
    const lang = supportLang === "es" ? "es" : "en";
    showRoomName(ROOMS.plaza.name[lang]);
  }, [supportLang, showRoomName]);

  return (
    <Box
      ref={containerRef}
      position="relative"
      w="100%"
      h="100%"
      bg="#08142b"
      overflow="hidden"
    >
      {/* Game canvas - fills entire container */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
        }}
        tabIndex={0}
      />

      {/* Room name overlay */}
      {roomName && (
        <Box
          position="absolute"
          top="12px"
          left="50%"
          transform="translateX(-50%)"
          bg="rgba(8, 20, 43, 0.88)"
          border="2px solid"
          borderColor="cyan.600"
          borderRadius="lg"
          px={5}
          py={2}
          pointerEvents="none"
          sx={{
            animation: "roomFadeIn 0.4s ease-out",
            "@keyframes roomFadeIn": {
              "0%": { opacity: 0, transform: "translateX(-50%) translateY(-8px)" },
              "100%": { opacity: 1, transform: "translateX(-50%) translateY(0)" },
            },
          }}
        >
          <Text fontSize="md" fontWeight="bold" color="cyan.100" fontFamily="monospace" whiteSpace="nowrap">
            {roomName}
          </Text>
        </Box>
      )}

      {/* Message overlay */}
      {message && (
        <Box
          position="absolute"
          bottom="12px"
          left="12px"
          right="12px"
          bg="rgba(8, 20, 43, 0.94)"
          border="2px solid"
          borderColor="cyan.400"
          borderRadius="lg"
          px={4}
          py={3}
          pointerEvents="none"
          sx={{
            animation: "msgSlideUp 0.3s ease-out",
            "@keyframes msgSlideUp": {
              "0%": { opacity: 0, transform: "translateY(8px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Text fontSize="sm" color="cyan.50" fontFamily="monospace">
            {message}
          </Text>
        </Box>
      )}
    </Box>
  );
}
