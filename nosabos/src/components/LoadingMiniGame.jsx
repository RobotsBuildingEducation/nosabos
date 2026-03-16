import React, { useEffect, useRef, useCallback, useState } from "react";
import { Box, Text, VStack, HStack } from "@chakra-ui/react";

// ─── Constants ──────────────────────────────────────────────────────────────
const TILE = 16; // pixel size of each tile in the source
const SCALE = 2; // render scale
const T = TILE * SCALE; // rendered tile size (32px)
const MAP_W = 14; // tiles wide
const MAP_H = 10; // tiles tall
const CANVAS_W = MAP_W * T;
const CANVAS_H = MAP_H * T;
const MOVE_COOLDOWN = 120; // ms between moves

// ─── Tile types ─────────────────────────────────────────────────────────────
const GRASS = 0;
const PATH = 1;
const WATER = 2;
const WALL = 3;
const TREE = 4;
const FLOWER = 5;
const SIGN = 6;
const CHEST = 7;
const ROCK = 8;
const BRIDGE = 9;
const HOUSE = 10;
const LAMP = 11;

const SOLID_TILES = new Set([WALL, TREE, WATER, ROCK, HOUSE]);
const INTERACT_TILES = new Set([SIGN, CHEST, LAMP]);

// ─── Predefined map ────────────────────────────────────────────────────────
// A small plaza with a pond, paths, trees, signs, and a chest to find
// prettier-ignore
const MAP_DATA = [
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [4, 0, 0, 5, 1, 1, 1, 1, 1, 5, 0, 0, 6, 4],
  [4, 0, 5, 0, 0, 1, 0, 0, 1, 0, 0, 5, 0, 4],
  [4, 0, 0, 0, 8, 1, 0, 0, 1, 8, 0, 0, 0, 4],
  [4, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 4],
  [4, 0, 0, 0, 8, 1, 2, 2, 1, 0, 0, 0, 7, 4],
  [4, 0,11, 0, 0, 1, 9, 9, 1, 0, 0, 0, 0, 4],
  [4, 5, 0, 0, 0, 1, 0, 0, 1, 0, 0, 5, 0, 4],
  [4, 0, 0, 6, 0, 1, 1, 1, 1, 0, 6, 0, 0, 4],
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
];

// ─── Interaction messages (cycle through) ───────────────────────────────────
const SIGN_MESSAGES = {
  en: [
    "Welcome, adventurer! Explore while your game loads.",
    "Tip: Talk to NPCs in the real game to practice vocabulary!",
    "Fun fact: Language learning is like leveling up your brain.",
    "Pro tip: Complete quests to earn XP and unlock new lessons!",
    "The bridge connects two worlds... just like languages do.",
  ],
  es: [
    "¡Bienvenido, aventurero! Explora mientras carga tu juego.",
    "Consejo: ¡Habla con los NPCs en el juego real para practicar vocabulario!",
    "Dato curioso: Aprender idiomas es como subir de nivel tu cerebro.",
    "Consejo pro: ¡Completa misiones para ganar XP y desbloquear lecciones!",
    "El puente conecta dos mundos... igual que los idiomas.",
  ],
};

const CHEST_MESSAGES = {
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
};

const LAMP_MESSAGES = {
  en: [
    "The lamp flickers warmly. It feels cozy here.",
    "A soft glow illuminates some ancient text... illegible.",
  ],
  es: [
    "La lámpara parpadea cálidamente. Se siente acogedor.",
    "Un brillo suave ilumina un texto antiguo... ilegible.",
  ],
};

// ─── Color palette ──────────────────────────────────────────────────────────
const COLORS = {
  [GRASS]: ["#3a7d44", "#2d6b35", "#4a8c54"],
  [PATH]: ["#c4a46c", "#b89a62", "#d4b47c"],
  [WATER]: ["#2a6faa", "#1e5f9a", "#3580bb"],
  [WALL]: ["#6b5b4f", "#5c4e42", "#7a6a5e"],
  [TREE]: ["#1a5c28", "#145020", "#206830"],
  [FLOWER]: ["#e85d9a", "#d94d8a", "#f06daa"],
  [SIGN]: ["#8b6914", "#7a5a10", "#9c7a24"],
  [CHEST]: ["#b8860b", "#a07608", "#c89620"],
  [ROCK]: ["#7a7a7a", "#6a6a6a", "#8a8a8a"],
  [BRIDGE]: ["#8b6d4a", "#7a5c3a", "#9c7e5a"],
  [HOUSE]: ["#8b4513", "#7a3a0c", "#9c5624"],
  [LAMP]: ["#daa520", "#c99510", "#eab530"],
};

const TRUNK_COLOR = "#5a3a1a";
const LEAF_COLORS = ["#2d8c3a", "#1a7028", "#40a050"];
const WATER_HIGHLIGHT = "#4a9fdd";
const SIGN_POST = "#6b4e1f";

// ─── Player colors (pixel art character) ────────────────────────────────────
const PLAYER = {
  skin: "#f5c5a3",
  hair: "#4a2e14",
  shirt: "#3a8fd9",
  pants: "#3a4a6a",
  shoes: "#2a2a2a",
  eyes: "#1a1a2e",
};

// ─── Seeded RNG for tile variation ──────────────────────────────────────────
function seededRng(x, y) {
  let h = (x * 374761393 + y * 668265263 + 1013904223) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ─── Tile drawing functions ─────────────────────────────────────────────────
function drawGrass(ctx, x, y) {
  const colors = COLORS[GRASS];
  const base = colors[Math.floor(seededRng(x, y) * colors.length)];
  ctx.fillStyle = base;
  ctx.fillRect(x * T, y * T, T, T);
  // subtle grass detail
  const rng = seededRng(x + 100, y + 100);
  if (rng > 0.6) {
    ctx.fillStyle = "#4a9c58";
    ctx.fillRect(x * T + 4, y * T + 10, 2, 6);
    ctx.fillRect(x * T + 18, y * T + 4, 2, 6);
  }
  if (rng > 0.8) {
    ctx.fillStyle = "#5aac68";
    ctx.fillRect(x * T + 12, y * T + 20, 2, 4);
  }
}

function drawPath(ctx, x, y) {
  const colors = COLORS[PATH];
  const base = colors[Math.floor(seededRng(x, y) * colors.length)];
  ctx.fillStyle = base;
  ctx.fillRect(x * T, y * T, T, T);
  // pebble detail
  if (seededRng(x + 50, y + 50) > 0.5) {
    ctx.fillStyle = "#a08a5c";
    ctx.fillRect(x * T + 8, y * T + 14, 4, 3);
  }
  if (seededRng(x + 70, y + 70) > 0.65) {
    ctx.fillStyle = "#baa470";
    ctx.fillRect(x * T + 20, y * T + 6, 3, 3);
  }
}

function drawWater(ctx, x, y, frame) {
  ctx.fillStyle = COLORS[WATER][0];
  ctx.fillRect(x * T, y * T, T, T);
  // animated wave highlights
  const off = ((frame * 0.03 + x * 0.5) % 1) * T;
  ctx.fillStyle = WATER_HIGHLIGHT;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x * T + off, y * T + 6, 8, 2);
  ctx.fillRect(x * T + ((off + 14) % T), y * T + 18, 6, 2);
  ctx.globalAlpha = 1;
}

function drawTree(ctx, x, y) {
  // grass beneath
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 2;
  // trunk
  ctx.fillStyle = TRUNK_COLOR;
  ctx.fillRect(cx - 3, by - 16, 6, 12);
  // canopy layers
  const leafC =
    LEAF_COLORS[Math.floor(seededRng(x, y) * LEAF_COLORS.length)];
  ctx.fillStyle = leafC;
  ctx.beginPath();
  ctx.arc(cx, by - 20, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = LEAF_COLORS[1];
  ctx.beginPath();
  ctx.arc(cx - 4, by - 18, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = LEAF_COLORS[2];
  ctx.beginPath();
  ctx.arc(cx + 5, by - 17, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(ctx, x, y) {
  drawGrass(ctx, x, y);
  const rng = seededRng(x + 200, y + 200);
  const flowerColors = ["#e85d9a", "#f0c040", "#ff6b6b", "#a06ef0"];
  // scatter 2-3 flowers
  const count = rng > 0.5 ? 3 : 2;
  for (let i = 0; i < count; i++) {
    const fx = x * T + 4 + seededRng(x + i * 13, y) * (T - 8);
    const fy = y * T + 4 + seededRng(x, y + i * 17) * (T - 8);
    const fc =
      flowerColors[
        Math.floor(seededRng(x + i, y + i) * flowerColors.length)
      ];
    // stem
    ctx.fillStyle = "#3a7d44";
    ctx.fillRect(fx, fy, 2, 6);
    // petals
    ctx.fillStyle = fc;
    ctx.fillRect(fx - 2, fy - 2, 6, 4);
    ctx.fillRect(fx, fy - 4, 2, 2);
  }
}

function drawSign(ctx, x, y) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 2;
  // post
  ctx.fillStyle = SIGN_POST;
  ctx.fillRect(cx - 2, by - 20, 4, 18);
  // board
  ctx.fillStyle = COLORS[SIGN][0];
  ctx.fillRect(cx - 10, by - 26, 20, 10);
  ctx.fillStyle = "#a07a20";
  ctx.fillRect(cx - 9, by - 25, 18, 8);
  // "!" mark
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - 1, by - 24, 2, 4);
  ctx.fillRect(cx - 1, by - 19, 2, 2);
}

function drawChest(ctx, x, y) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 4;
  // chest body
  ctx.fillStyle = COLORS[CHEST][0];
  ctx.fillRect(cx - 8, by - 12, 16, 10);
  // lid
  ctx.fillStyle = COLORS[CHEST][2];
  ctx.fillRect(cx - 9, by - 16, 18, 6);
  // clasp
  ctx.fillStyle = "#ffd700";
  ctx.fillRect(cx - 2, by - 12, 4, 3);
  // shadow
  ctx.fillStyle = "#00000020";
  ctx.fillRect(cx - 8, by - 2, 16, 2);
}

function drawRock(ctx, x, y) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 4;
  ctx.fillStyle = COLORS[ROCK][0];
  ctx.beginPath();
  ctx.ellipse(cx, by - 6, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS[ROCK][2];
  ctx.beginPath();
  ctx.ellipse(cx - 2, by - 8, 6, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBridge(ctx, x, y) {
  // water beneath
  ctx.fillStyle = COLORS[WATER][0];
  ctx.fillRect(x * T, y * T, T, T);
  // planks
  ctx.fillStyle = COLORS[BRIDGE][0];
  ctx.fillRect(x * T + 2, y * T, T - 4, T);
  // plank lines
  ctx.fillStyle = COLORS[BRIDGE][2];
  for (let i = 0; i < T; i += 8) {
    ctx.fillRect(x * T + 2, y * T + i, T - 4, 1);
  }
  // rails
  ctx.fillStyle = TRUNK_COLOR;
  ctx.fillRect(x * T + 1, y * T, 2, T);
  ctx.fillRect(x * T + T - 3, y * T, 2, T);
}

function drawHouse(ctx, x, y) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 2;
  // walls
  ctx.fillStyle = "#d4a76a";
  ctx.fillRect(cx - 10, by - 18, 20, 16);
  // roof
  ctx.fillStyle = "#8b2500";
  ctx.beginPath();
  ctx.moveTo(cx - 14, by - 18);
  ctx.lineTo(cx, by - 28);
  ctx.lineTo(cx + 14, by - 18);
  ctx.fill();
  // door
  ctx.fillStyle = "#5a3010";
  ctx.fillRect(cx - 3, by - 10, 6, 10);
  // window
  ctx.fillStyle = "#8ac4ff";
  ctx.fillRect(cx + 5, by - 16, 4, 4);
}

function drawLamp(ctx, x, y, frame) {
  drawGrass(ctx, x, y);
  const cx = x * T + T / 2;
  const by = y * T + T - 2;
  // post
  ctx.fillStyle = "#4a4a4a";
  ctx.fillRect(cx - 2, by - 24, 4, 22);
  // lamp housing
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(cx - 5, by - 28, 10, 5);
  // glow (animated)
  const glowAlpha = 0.25 + Math.sin(frame * 0.05) * 0.1;
  ctx.fillStyle = `rgba(255, 220, 100, ${glowAlpha})`;
  ctx.beginPath();
  ctx.arc(cx, by - 24, 12, 0, Math.PI * 2);
  ctx.fill();
  // bulb
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(cx - 3, by - 27, 6, 3);
}

// Tile draw dispatch
function drawTile(ctx, x, y, tileType, frame) {
  switch (tileType) {
    case GRASS:
      return drawGrass(ctx, x, y);
    case PATH:
      return drawPath(ctx, x, y);
    case WATER:
      return drawWater(ctx, x, y, frame);
    case WALL:
      return drawGrass(ctx, x, y); // walls use tree border
    case TREE:
      return drawTree(ctx, x, y);
    case FLOWER:
      return drawFlower(ctx, x, y);
    case SIGN:
      return drawSign(ctx, x, y);
    case CHEST:
      return drawChest(ctx, x, y);
    case ROCK:
      return drawRock(ctx, x, y);
    case BRIDGE:
      return drawBridge(ctx, x, y);
    case HOUSE:
      return drawHouse(ctx, x, y);
    case LAMP:
      return drawLamp(ctx, x, y, frame);
    default:
      return drawGrass(ctx, x, y);
  }
}

// ─── Player drawing ─────────────────────────────────────────────────────────
function drawPlayer(ctx, px, py, dir, frame) {
  const x = px * T + T / 2;
  const y = py * T + T / 2;
  const bob = Math.sin(frame * 0.15) * 1.5;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // body
  const bodyY = y - 4 + bob;

  // shoes
  ctx.fillStyle = PLAYER.shoes;
  ctx.fillRect(x - 5, bodyY + 10, 4, 3);
  ctx.fillRect(x + 1, bodyY + 10, 4, 3);

  // pants
  ctx.fillStyle = PLAYER.pants;
  ctx.fillRect(x - 5, bodyY + 5, 4, 6);
  ctx.fillRect(x + 1, bodyY + 5, 4, 6);

  // shirt
  ctx.fillStyle = PLAYER.shirt;
  ctx.fillRect(x - 6, bodyY - 4, 12, 10);

  // arms
  const armSwing = Math.sin(frame * 0.15) * 2;
  ctx.fillRect(x - 8, bodyY - 2 + armSwing, 3, 8);
  ctx.fillRect(x + 5, bodyY - 2 - armSwing, 3, 8);

  // head
  ctx.fillStyle = PLAYER.skin;
  ctx.fillRect(x - 5, bodyY - 12, 10, 9);

  // hair
  ctx.fillStyle = PLAYER.hair;
  ctx.fillRect(x - 6, bodyY - 14, 12, 5);
  if (dir === "left") {
    ctx.fillRect(x - 6, bodyY - 12, 3, 4);
  } else if (dir === "right") {
    ctx.fillRect(x + 3, bodyY - 12, 3, 4);
  }

  // eyes
  ctx.fillStyle = PLAYER.eyes;
  if (dir === "up") {
    // looking up - no eyes visible from back
  } else if (dir === "left") {
    ctx.fillRect(x - 4, bodyY - 9, 2, 2);
  } else if (dir === "right") {
    ctx.fillRect(x + 2, bodyY - 9, 2, 2);
  } else {
    ctx.fillRect(x - 3, bodyY - 9, 2, 2);
    ctx.fillRect(x + 1, bodyY - 9, 2, 2);
  }
}

// ─── Interaction sparkle effect ─────────────────────────────────────────────
function drawInteractHint(ctx, tileX, tileY, frame) {
  const cx = tileX * T + T / 2;
  const cy = tileY * T - 4;
  const bounce = Math.sin(frame * 0.08) * 3;
  const alpha = 0.6 + Math.sin(frame * 0.1) * 0.3;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffd700";
  // "E" or "⬆" indicator
  ctx.font = `bold ${10 * SCALE}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("!", cx, cy + bounce);
  ctx.restore();
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function LoadingMiniGame({ supportLang = "en" }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    px: 7,
    py: 7,
    dir: "down",
    frame: 0,
    lastMove: 0,
    keysDown: new Set(),
    touchStart: null,
    msgSignIdx: 0,
    msgChestIdx: 0,
    msgLampIdx: 0,
  });
  const [message, setMessage] = useState(null);
  const [objectsFound, setObjectsFound] = useState(new Set());
  const messageTimeoutRef = useRef(null);

  // Count total interactables
  const totalInteractables = useRef(0);
  if (totalInteractables.current === 0) {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (INTERACT_TILES.has(MAP_DATA[y][x])) totalInteractables.current++;
      }
    }
  }

  const showMessage = useCallback(
    (text) => {
      setMessage(text);
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setMessage(null), 3500);
    },
    [],
  );

  const handleInteract = useCallback(
    (tileX, tileY) => {
      const tile = MAP_DATA[tileY]?.[tileX];
      const lang = supportLang === "es" ? "es" : "en";
      const key = `${tileX},${tileY}`;

      if (tile === SIGN) {
        const msgs = SIGN_MESSAGES[lang];
        const idx = stateRef.current.msgSignIdx % msgs.length;
        showMessage(msgs[idx]);
        stateRef.current.msgSignIdx++;
        setObjectsFound((prev) => new Set(prev).add(key));
      } else if (tile === CHEST) {
        const msgs = CHEST_MESSAGES[lang];
        const idx = stateRef.current.msgChestIdx % msgs.length;
        showMessage(msgs[idx]);
        stateRef.current.msgChestIdx++;
        setObjectsFound((prev) => new Set(prev).add(key));
      } else if (tile === LAMP) {
        const msgs = LAMP_MESSAGES[lang];
        const idx = stateRef.current.msgLampIdx % msgs.length;
        showMessage(msgs[idx]);
        stateRef.current.msgLampIdx++;
        setObjectsFound((prev) => new Set(prev).add(key));
      }
    },
    [supportLang, showMessage],
  );

  // Try to interact with the tile the player is facing
  const tryInteract = useCallback(() => {
    const s = stateRef.current;
    const dx = { left: -1, right: 1, up: 0, down: 0 }[s.dir];
    const dy = { left: 0, right: 0, up: -1, down: 1 }[s.dir];
    const tx = s.px + dx;
    const ty = s.py + dy;
    if (
      tx >= 0 &&
      tx < MAP_W &&
      ty >= 0 &&
      ty < MAP_H &&
      INTERACT_TILES.has(MAP_DATA[ty][tx])
    ) {
      handleInteract(tx, ty);
    }
  }, [handleInteract]);

  // Movement logic
  const tryMove = useCallback(
    (dir) => {
      const now = Date.now();
      const s = stateRef.current;
      s.dir = dir;

      if (now - s.lastMove < MOVE_COOLDOWN) return;

      const dx = { left: -1, right: 1, up: 0, down: 0 }[dir];
      const dy = { left: 0, right: 0, up: -1, down: 1 }[dir];
      const nx = s.px + dx;
      const ny = s.py + dy;

      if (
        nx >= 0 &&
        nx < MAP_W &&
        ny >= 0 &&
        ny < MAP_H &&
        !SOLID_TILES.has(MAP_DATA[ny][nx]) &&
        !INTERACT_TILES.has(MAP_DATA[ny][nx])
      ) {
        s.px = nx;
        s.py = ny;
        s.lastMove = now;
      }
    },
    [],
  );

  // Keyboard input
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      stateRef.current.keysDown.add(key);

      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)
      ) {
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

  // Touch input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      stateRef.current.touchStart = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      if (!stateRef.current.touchStart) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - stateRef.current.touchStart.x;
      const dy = touch.clientY - stateRef.current.touchStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      stateRef.current.touchStart = null;

      if (dist < 15) {
        // tap = interact
        tryInteract();
        return;
      }

      // swipe = move
      if (Math.abs(dx) > Math.abs(dy)) {
        tryMove(dx > 0 ? "right" : "left");
      } else {
        tryMove(dy > 0 ? "down" : "up");
      }
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

      // Process held keys
      const keys = s.keysDown;
      if (keys.has("arrowup") || keys.has("w")) tryMove("up");
      else if (keys.has("arrowdown") || keys.has("s")) tryMove("down");
      else if (keys.has("arrowleft") || keys.has("a")) tryMove("left");
      else if (keys.has("arrowright") || keys.has("d")) tryMove("right");

      // Clear
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Draw tiles
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          drawTile(ctx, x, y, MAP_DATA[y][x], s.frame);
        }
      }

      // Draw interact hints for nearby interactables
      const dx = { left: -1, right: 1, up: 0, down: 0 }[s.dir];
      const dy = { left: 0, right: 0, up: -1, down: 1 }[s.dir];
      const facingX = s.px + dx;
      const facingY = s.py + dy;
      if (
        facingX >= 0 &&
        facingX < MAP_W &&
        facingY >= 0 &&
        facingY < MAP_H &&
        INTERACT_TILES.has(MAP_DATA[facingY][facingX])
      ) {
        drawInteractHint(ctx, facingX, facingY, s.frame);
      }

      // Draw player
      drawPlayer(ctx, s.px, s.py, s.dir, s.frame);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tryMove]);

  // Cleanup message timeout
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, []);

  const lang = supportLang === "es" ? "es" : "en";
  const controlHint =
    lang === "es"
      ? "WASD / Flechas para mover · E para interactuar"
      : "WASD / Arrows to move · E to interact";

  return (
    <VStack spacing={3} align="center" w="100%">
      <Box position="relative" borderRadius="lg" overflow="hidden" boxShadow="0 4px 20px rgba(0,0,0,0.4)">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            display: "block",
            width: "100%",
            maxWidth: `${CANVAS_W}px`,
            imageRendering: "pixelated",
            borderRadius: "8px",
          }}
          tabIndex={0}
        />

        {/* Message overlay */}
        {message && (
          <Box
            position="absolute"
            bottom="8px"
            left="8px"
            right="8px"
            bg="rgba(8, 20, 43, 0.92)"
            border="2px solid"
            borderColor="cyan.400"
            borderRadius="lg"
            px={4}
            py={3}
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

      {/* Discovery tracker */}
      <HStack spacing={2} opacity={0.7}>
        <Text fontSize="xs" color="blue.200" fontFamily="monospace">
          {lang === "es"
            ? `Descubiertos: ${objectsFound.size}/${totalInteractables.current}`
            : `Discovered: ${objectsFound.size}/${totalInteractables.current}`}
        </Text>
      </HStack>

      {/* Controls hint */}
      <Text fontSize="xs" color="whiteAlpha.500" fontFamily="monospace">
        {controlHint}
      </Text>
    </VStack>
  );
}
