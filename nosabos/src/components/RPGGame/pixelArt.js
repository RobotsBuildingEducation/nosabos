import * as THREE from "three";
import { mulberry32 } from "./scenarios";

// ─── Color helpers ───────────────────────────────────────────────────────────
function hexToRgb(hex) {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

function rgbToHex(r, g, b) {
  return (
    ((Math.max(0, Math.min(255, r)) << 16) |
      (Math.max(0, Math.min(255, g)) << 8) |
      Math.max(0, Math.min(255, b))) >>>
    0
  );
}

function darken(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    Math.round(r * (1 - amount)),
    Math.round(g * (1 - amount)),
    Math.round(b * (1 - amount)),
  );
}

function lighten(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    Math.round(r + (255 - r) * amount),
    Math.round(g + (255 - g) * amount),
    Math.round(b + (255 - b) * amount),
  );
}

// ─── Canvas pixel helpers ────────────────────────────────────────────────────
function px(ctx, x, y, hex, s = 1) {
  const [r, g, b] = hexToRgb(hex);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x * s, y * s, s, s);
}

function pxA(ctx, x, y, hex, alpha, s = 1) {
  const [r, g, b] = hexToRgb(hex);
  ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.fillRect(x * s, y * s, s, s);
}

function rect(ctx, x, y, w, h, hex, s = 1) {
  const [r, g, b] = hexToRgb(hex);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x * s, y * s, w * s, h * s);
}

function makeTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

// ─── Stardew-style tile textures ─────────────────────────────────────────────
export function createTileTexture(tileDef, tileX, tileY, seed) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const rng = mulberry32(seed + tileX * 31 + tileY * 97);
  const colorRow = tileDef.colors[(tileX + tileY) % tileDef.colors.length];
  const base = colorRow[Math.floor(rng() * colorRow.length)];

  // Fill base with subtle per-pixel noise
  for (let py = 0; py < SIZE; py++) {
    for (let pxI = 0; pxI < SIZE; pxI++) {
      const noise = (rng() - 0.5) * 12;
      const [r, g, b] = hexToRgb(base);
      ctx.fillStyle = `rgb(${clamp(r + noise)},${clamp(g + noise)},${clamp(b + noise)})`;
      ctx.fillRect(pxI, py, 1, 1);
    }
  }

  // Detail overlays
  const detail = tileDef.detail;
  if (detail === "grass") {
    // Stardew-style grass tufts
    const tufts = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < tufts; i++) {
      const gx = Math.floor(rng() * 14) + 1;
      const gy = Math.floor(rng() * 12) + 2;
      const grassC = lighten(base, 0.15 + rng() * 0.15);
      const grassD = darken(base, 0.1);
      // Little V-shaped grass blade
      px(ctx, gx, gy, grassC);
      px(ctx, gx - 1, gy - 1, grassC);
      px(ctx, gx + 1, gy - 1, grassC);
      px(ctx, gx, gy - 2, lighten(grassC, 0.1));
      // Shadow at base
      pxA(ctx, gx, gy + 1, grassD, 0.3);
    }
  } else if (detail === "dirt") {
    // Pebbles and texture
    const pebbles = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < pebbles; i++) {
      const dx = Math.floor(rng() * 13) + 1;
      const dy = Math.floor(rng() * 13) + 1;
      px(ctx, dx, dy, darken(base, 0.12));
      px(ctx, dx + 1, dy, darken(base, 0.08));
    }
  } else if (detail === "water") {
    // Animated-ish water highlights
    const phase = (tileX * 3 + tileY * 7) % 8;
    for (let i = 0; i < 3; i++) {
      const wx = (phase + i * 5) % 14 + 1;
      const wy = (phase + i * 3) % 12 + 2;
      px(ctx, wx, wy, lighten(base, 0.25));
      px(ctx, wx + 1, wy, lighten(base, 0.15));
    }
  } else if (detail === "tile_floor") {
    // Checkerboard tile pattern
    const isLight = (tileX + tileY) % 2 === 0;
    if (!isLight) {
      for (let py = 0; py < SIZE; py++) {
        for (let pxI = 0; pxI < SIZE; pxI++) {
          pxA(ctx, pxI, py, 0x000000, 0.06, 1);
        }
      }
    }
    // Grout lines
    for (let i = 0; i < SIZE; i++) {
      pxA(ctx, i, 0, 0x000000, 0.1, 1);
      pxA(ctx, 0, i, 0x000000, 0.1, 1);
    }
  } else if (detail === "linoleum") {
    // Subtle speckle pattern
    for (let i = 0; i < 8; i++) {
      const sx = Math.floor(rng() * SIZE);
      const sy = Math.floor(rng() * SIZE);
      pxA(ctx, sx, sy, 0xffffff, 0.06, 1);
    }
  } else if (detail === "wood_floor") {
    // Warm plank floor with seam lines and knots
    for (let py = 0; py < SIZE; py++) {
      if (py % 4 === 0) {
        for (let x = 0; x < SIZE; x++) pxA(ctx, x, py, 0x000000, 0.12);
      }
    }
    for (let i = 0; i < 3; i++) {
      const kx = 2 + Math.floor(rng() * 12);
      const ky = 2 + Math.floor(rng() * 12);
      px(ctx, kx, ky, darken(base, 0.2));
      pxA(ctx, kx + 1, ky, lighten(base, 0.15), 0.5);
    }
  } else if (detail === "runway") {
    // Airport stripe lane
    for (let py = 0; py < SIZE; py++) {
      for (let pxI = 0; pxI < SIZE; pxI++) {
        if ((pxI + tileX * 2) % 8 === 0) {
          pxA(ctx, pxI, py, 0xffffff, 0.18);
        }
      }
    }
    if (tileY % 3 === 0) {
      for (let x = 4; x <= 11; x++) pxA(ctx, x, 7, 0xfff3b0, 0.25);
    }
  } else if (detail === "flower") {
    // Flower on grass
    const colors = [0xff6b9d, 0xffd93d, 0xff8fab, 0x7eb8da, 0xd4a5ff];
    const fc = colors[Math.floor(rng() * colors.length)];
    const cx = 7 + Math.floor(rng() * 3);
    const cy = 6 + Math.floor(rng() * 3);
    // Stem
    px(ctx, cx, cy + 1, 0x3d7a2a);
    px(ctx, cx, cy + 2, 0x3d7a2a);
    px(ctx, cx, cy + 3, 0x4a8a35);
    // Leaves
    px(ctx, cx - 1, cy + 2, 0x4a8a35);
    px(ctx, cx + 1, cy + 3, 0x4a8a35);
    // Petals
    px(ctx, cx, cy - 1, fc);
    px(ctx, cx - 1, cy, fc);
    px(ctx, cx + 1, cy, fc);
    px(ctx, cx, cy + 1, fc);
    // Center
    px(ctx, cx, cy, 0xffd700);
  } else if (detail === "produce") {
    // Little produce items
    const items = [
      [0xe74c3c, 0xc0392b], // tomato
      [0xf39c12, 0xe67e22], // orange
      [0x27ae60, 0x1e8449], // lettuce
    ];
    const item = items[Math.floor(rng() * items.length)];
    rect(ctx, 5, 5, 3, 3, item[0]);
    rect(ctx, 9, 7, 3, 3, item[1]);
    px(ctx, 6, 4, 0x27ae60);
    px(ctx, 10, 6, 0x27ae60);
  } else if (detail === "rug") {
    // Woven pattern
    for (let py = 0; py < SIZE; py += 2) {
      for (let pxI = 0; pxI < SIZE; pxI += 2) {
        if ((pxI + py) % 4 === 0) {
          pxA(ctx, pxI, py, 0xffd700, 0.15, 1);
        }
      }
    }
    // Border
    for (let i = 0; i < SIZE; i++) {
      pxA(ctx, i, 0, 0x8b4513, 0.3, 1);
      pxA(ctx, i, SIZE - 1, 0x8b4513, 0.3, 1);
      pxA(ctx, 0, i, 0x8b4513, 0.3, 1);
      pxA(ctx, SIZE - 1, i, 0x8b4513, 0.3, 1);
    }
  } else if (detail === "mat") {
    for (let py = 0; py < SIZE; py++) {
      for (let pxI = 0; pxI < SIZE; pxI++) {
        pxA(ctx, pxI, py, 0x4a7a3a, 0.15, 1);
      }
    }
  } else if (detail === "gravel") {
    const pebbles = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < pebbles; i++) {
      const dx = Math.floor(rng() * 14) + 1;
      const dy = Math.floor(rng() * 14) + 1;
      const c = rng() > 0.5 ? darken(base, 0.1) : lighten(base, 0.08);
      px(ctx, dx, dy, c);
      if (rng() > 0.5) px(ctx, dx + 1, dy, c);
    }
  } else if (detail === "wall") {
    // Brick-like pattern
    for (let py = 0; py < SIZE; py += 4) {
      const offset = (Math.floor(py / 4) % 2) * 4;
      for (let pxI = 0; pxI < SIZE; pxI++) {
        if (py % 4 === 0 || (pxI + offset) % 8 === 0) {
          pxA(ctx, pxI, py, 0x000000, 0.08, 1);
        }
      }
    }
  }

  return makeTexture(canvas);
}

// ─── Stardew-style character sprite (32x32 with rich detail) ─────────────────
export function createCharacterTexture(colors, direction = "down", frame = 0) {
  const SIZE = 48;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const outline = 0x1a1a2e;
  const hairDark = darken(colors.hair, 0.28);
  const hairLight = lighten(colors.hair, 0.18);
  const skinDark = darken(colors.skin, 0.2);
  const skinLight = lighten(colors.skin, 0.16);
  const shirtDark = darken(colors.shirt, 0.22);
  const shirtLight = lighten(colors.shirt, 0.14);
  const pantsDark = darken(colors.pants, 0.2);
  const bootsDark = darken(colors.boots, 0.2);

  const phase = frame % 6;
  const stride = phase === 1 || phase === 5 ? 1 : phase === 3 ? -1 : 0;
  const bodyBob = phase === 2 || phase === 4 ? 1 : 0;

  const draw = (x, y, c) => px(ctx, x, y + bodyBob, c);

  const drawSym = (x, y, c) => {
    draw(24 - x, y, c);
    draw(23 + x, y, c);
  };

  const drawHeadFront = () => {
    for (let y = 6; y <= 18; y++) {
      const w = y < 10 ? 6 : y < 15 ? 7 : 6;
      for (let x = -w; x <= w; x++) {
        const edge = Math.abs(x) >= w;
        draw(24 + x, y, edge ? skinDark : colors.skin);
      }
    }
    for (let y = 4; y <= 13; y++) {
      const w = y < 7 ? 6 : 8;
      for (let x = -w; x <= w; x++) {
        const edge = Math.abs(x) >= w;
        draw(24 + x, y, edge ? outline : y < 7 ? hairLight : colors.hair);
      }
    }
    drawSym(4, 12, 0xffffff);
    drawSym(4, 13, 0x28384d);
    drawSym(3, 12, lighten(0x28384d, 0.4));
    draw(23, 15, skinLight);
    draw(24, 15, skinDark);
    draw(23, 16, 0xc86b5d);
    draw(24, 16, 0xb3584f);
    draw(20, 15, 0xffb1c9);
    draw(27, 15, 0xffb1c9);
  };

  const drawHeadBack = () => {
    for (let y = 5; y <= 18; y++) {
      const w = y < 9 ? 6 : y < 14 ? 8 : 7;
      for (let x = -w; x <= w; x++) {
        const edge = Math.abs(x) >= w;
        const c = y < 8 ? hairLight : y < 14 ? colors.hair : hairDark;
        draw(24 + x, y, edge ? outline : c);
      }
    }
  };

  const drawSideHead = (flip) => {
    const xf = (x) => (flip ? SIZE - 1 - x : x);
    for (let y = 5; y <= 18; y++) {
      const w = y < 9 ? 6 : y < 14 ? 7 : 6;
      for (let x = 17; x <= 17 + w * 2; x++) {
        const edge = x === 17 || x === 17 + w * 2;
        const hairLine = x >= 27;
        const c = hairLine ? (y < 9 ? hairLight : colors.hair) : colors.skin;
        draw(xf(x), y, edge ? outline : c);
      }
    }
    draw(xf(20), 12, 0xffffff);
    draw(xf(20), 13, 0x26374e);
    draw(xf(19), 14, skinDark);
    draw(xf(19), 15, 0xbc6157);
  };

  const drawBody = (flip = false) => {
    const xf = (x) => (flip ? SIZE - 1 - x : x);
    for (let y = 19; y <= 30; y++) {
      const w = y < 22 ? 7 : 8;
      for (let x = 24 - w; x <= 24 + w; x++) {
        const edge = x === 24 - w || x === 24 + w;
        const c = y < 24 ? colors.shirt : y < 28 ? shirtDark : colors.pants;
        draw(xf(x), y, edge ? outline : c);
      }
    }

    draw(xf(23), 20, shirtLight);
    draw(xf(24), 20, shirtLight);
    if (colors.accessory) {
      for (let x = 18; x <= 29; x++) draw(xf(x), 27, colors.accessory);
      draw(xf(23), 27, lighten(colors.accessory, 0.2));
    }

    for (let y = 21; y <= 27; y++) {
      draw(xf(15), y, y < 26 ? colors.skin : skinDark);
      draw(xf(14), y, outline);
      draw(xf(33), y, y < 26 ? colors.skin : skinDark);
      draw(xf(34), y, outline);
    }
  };

  const drawLegs = (flip = false) => {
    const xf = (x) => (flip ? SIZE - 1 - x : x);
    const leftOffset = stride;
    const rightOffset = -stride;

    for (let y = 31; y <= 39; y++) {
      for (let x = 19 + leftOffset; x <= 22 + leftOffset; x++) draw(xf(x), y, y > 36 ? pantsDark : colors.pants);
      for (let x = 25 + rightOffset; x <= 28 + rightOffset; x++) draw(xf(x), y, y > 36 ? pantsDark : colors.pants);
      draw(xf(18 + leftOffset), y, outline);
      draw(xf(29 + rightOffset), y, outline);
    }

    for (let y = 40; y <= 43; y++) {
      for (let x = 18 + leftOffset; x <= 23 + leftOffset; x++) draw(xf(x), y, y === 43 ? bootsDark : colors.boots);
      for (let x = 24 + rightOffset; x <= 29 + rightOffset; x++) draw(xf(x), y, y === 43 ? bootsDark : colors.boots);
      draw(xf(17 + leftOffset), y, outline);
      draw(xf(30 + rightOffset), y, outline);
    }
  };

  if (direction === "up") {
    drawHeadBack();
    drawBody();
    drawLegs();
  } else if (direction === "left") {
    drawSideHead(false);
    drawBody(false);
    drawLegs(false);
  } else if (direction === "right") {
    drawSideHead(true);
    drawBody(true);
    drawLegs(true);
  } else {
    drawHeadFront();
    drawBody();
    drawLegs();
  }

  // soft grounding shadow for depth
  for (let x = 17; x <= 30; x++) {
    pxA(ctx, x, 45 + bodyBob, 0x000000, 0.16);
  }

  return makeTexture(canvas);
}

// ─── Sprite textures for map objects ─────────────────────────────────────────
export function createSpriteTexture(type, seed) {
  const rng = mulberry32(seed);

  if (type === "tree") return createTreeSprite(rng);
  if (type === "house") return createHouseSprite();
  if (type === "fence") return createFenceSprite();
  if (type === "counter") return createCounterSprite();
  if (type === "stove") return createStoveSprite();
  if (type === "fridge") return createFridgeSprite();
  if (type === "shelf") return createShelfSprite(rng);
  if (type === "register") return createRegisterSprite();
  if (type === "freezer") return createFreezerSprite();
  if (type === "bench") return createBenchSprite();
  if (type === "fountain") return createFountainSprite();
  return null;
}

function createTreeSprite(rng) {
  const SIZE = 32;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const S = 1;
  const trunkC = 0x6b4226;
  const trunkD = 0x4a2e1a;
  const trunkL = 0x8b5a3a;

  // Trunk with bark texture
  for (let y = 20; y <= 31; y++) {
    for (let x = 13; x <= 18; x++) {
      const c = x <= 14 ? trunkD : x >= 17 ? trunkL : trunkC;
      px(ctx, x, y, c, S);
    }
    // Bark detail
    if (y % 3 === 0) {
      px(ctx, 15, y, trunkD, S);
      px(ctx, 16, y, trunkL, S);
    }
  }
  // Trunk outline
  for (let y = 20; y <= 31; y++) {
    px(ctx, 12, y, 0x1a1a2e, S);
    px(ctx, 19, y, 0x1a1a2e, S);
  }

  // Canopy - layered, varied greens (Stardew style)
  const leafColors = [0x2d6b2d, 0x3a8a3a, 0x4a9e4a, 0x2a5e2a, 0x358535];
  const layers = [
    { y: 3, xStart: 10, xEnd: 21 },
    { y: 4, xStart: 8, xEnd: 23 },
    { y: 5, xStart: 6, xEnd: 25 },
    { y: 6, xStart: 5, xEnd: 26 },
    { y: 7, xStart: 4, xEnd: 27 },
    { y: 8, xStart: 3, xEnd: 28 },
    { y: 9, xStart: 3, xEnd: 28 },
    { y: 10, xStart: 4, xEnd: 27 },
    { y: 11, xStart: 4, xEnd: 27 },
    { y: 12, xStart: 5, xEnd: 26 },
    { y: 13, xStart: 5, xEnd: 26 },
    { y: 14, xStart: 6, xEnd: 25 },
    { y: 15, xStart: 7, xEnd: 24 },
    { y: 16, xStart: 8, xEnd: 23 },
    { y: 17, xStart: 9, xEnd: 22 },
    { y: 18, xStart: 10, xEnd: 21 },
    { y: 19, xStart: 11, xEnd: 20 },
  ];

  layers.forEach(({ y, xStart, xEnd }) => {
    for (let x = xStart; x <= xEnd; x++) {
      const cIdx = Math.floor(rng() * leafColors.length);
      let c = leafColors[cIdx];
      // Light on top, dark on bottom
      if (y <= 8) c = lighten(c, 0.1);
      if (y >= 16) c = darken(c, 0.15);
      // Left side darker, right lighter
      if (x <= xStart + 2) c = darken(c, 0.1);
      if (x >= xEnd - 2) c = lighten(c, 0.05);
      px(ctx, x, y, c, S);
    }
    // Outline
    px(ctx, xStart - 1, y, 0x1a3a1a, S);
    px(ctx, xEnd + 1, y, 0x1a3a1a, S);
  });
  // Top outline
  for (let x = 10; x <= 21; x++) px(ctx, x, 2, 0x1a3a1a, S);

  // Highlights (light spots)
  for (let i = 0; i < 8; i++) {
    const hx = 7 + Math.floor(rng() * 18);
    const hy = 5 + Math.floor(rng() * 10);
    pxA(ctx, hx, hy, 0x8bdd6b, 0.4, S);
  }

  // Shadow at base
  for (let x = 10; x <= 21; x++) {
    pxA(ctx, x, 31, 0x000000, 0.15, S);
  }

  return makeTexture(canvas);
}

function createHouseSprite() {
  const SIZE = 48;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const S = 1;
  const wallC = 0xd4a574;
  const wallD = darken(wallC, 0.15);
  const roofC = 0x8b3a3a;
  const roofD = darken(roofC, 0.2);
  const roofL = lighten(roofC, 0.15);

  // ── Roof ──
  for (let y = 0; y < 18; y++) {
    const halfW = Math.floor(y * 1.3) + 4;
    for (let x = 24 - halfW; x <= 24 + halfW; x++) {
      if (x < 0 || x >= SIZE) continue;
      const c = x < 24 - halfW + 3 ? roofD : x > 24 + halfW - 3 ? roofL : roofC;
      px(ctx, x, y, c, S);
    }
    // Shingle lines
    if (y % 3 === 0 && y > 2) {
      for (let x = 24 - halfW; x <= 24 + halfW; x++) {
        if (x >= 0 && x < SIZE) pxA(ctx, x, y, 0x000000, 0.1, S);
      }
    }
  }

  // ── Walls ──
  for (let y = 18; y < 44; y++) {
    for (let x = 6; x < 42; x++) {
      const c = x < 10 ? wallD : x > 38 ? wallD : y > 40 ? wallD : wallC;
      px(ctx, x, y, c, S);
    }
    // Outline
    px(ctx, 5, y, 0x1a1a2e, S);
    px(ctx, 42, y, 0x1a1a2e, S);
  }

  // ── Door ──
  for (let y = 30; y < 44; y++) {
    for (let x = 19; x < 29; x++) {
      px(ctx, x, y, y < 32 ? 0x6b4226 : 0x5c3317, S);
    }
  }
  // Door knob
  px(ctx, 26, 37, 0xffd700, S);
  px(ctx, 26, 38, 0xdaa520, S);
  // Door frame
  for (let y = 29; y < 44; y++) {
    px(ctx, 18, y, 0x8b6e50, S);
    px(ctx, 29, y, 0x8b6e50, S);
  }

  // ── Windows ──
  const winColor = 0x87ceeb;
  const winFrame = 0x8b6e50;
  // Left window
  for (let y = 22; y < 29; y++) {
    for (let x = 10; x < 17; x++) {
      px(ctx, x, y, winColor, S);
    }
  }
  px(ctx, 13, 22, winFrame, S);
  px(ctx, 13, 23, winFrame, S);
  px(ctx, 13, 24, winFrame, S);
  px(ctx, 13, 25, winFrame, S);
  px(ctx, 13, 26, winFrame, S);
  px(ctx, 13, 27, winFrame, S);
  px(ctx, 13, 28, winFrame, S);
  for (let x = 10; x < 17; x++) {
    px(ctx, x, 25, winFrame, S);
    px(ctx, x, 21, winFrame, S);
    px(ctx, x, 29, winFrame, S);
  }
  // Curtain hint
  pxA(ctx, 10, 22, 0xffffff, 0.3, S);
  pxA(ctx, 11, 22, 0xffffff, 0.2, S);

  // Right window
  for (let y = 22; y < 29; y++) {
    for (let x = 31; x < 38; x++) {
      px(ctx, x, y, winColor, S);
    }
  }
  px(ctx, 34, 22, winFrame, S);
  px(ctx, 34, 23, winFrame, S);
  px(ctx, 34, 24, winFrame, S);
  px(ctx, 34, 25, winFrame, S);
  px(ctx, 34, 26, winFrame, S);
  px(ctx, 34, 27, winFrame, S);
  px(ctx, 34, 28, winFrame, S);
  for (let x = 31; x < 38; x++) {
    px(ctx, x, 25, winFrame, S);
    px(ctx, x, 21, winFrame, S);
    px(ctx, x, 29, winFrame, S);
  }

  // Shadow
  for (let x = 6; x < 42; x++) {
    pxA(ctx, x, 44, 0x000000, 0.15, S);
    pxA(ctx, x, 45, 0x000000, 0.08, S);
  }

  return makeTexture(canvas);
}

function createFenceSprite() {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const wood = 0x8b7355;
  const woodD = darken(wood, 0.2);
  const woodL = lighten(wood, 0.15);

  // Vertical posts
  for (let y = 2; y <= 14; y++) {
    px(ctx, 2, y, woodD);
    px(ctx, 3, y, wood);
    px(ctx, 4, y, woodL);
    px(ctx, 11, y, woodD);
    px(ctx, 12, y, wood);
    px(ctx, 13, y, woodL);
  }
  // Horizontal rails
  for (let x = 2; x <= 13; x++) {
    px(ctx, x, 5, woodD);
    px(ctx, x, 6, wood);
    px(ctx, x, 10, woodD);
    px(ctx, x, 11, wood);
  }
  // Post caps
  px(ctx, 2, 1, woodL);
  px(ctx, 3, 1, woodL);
  px(ctx, 4, 1, woodL);
  px(ctx, 11, 1, woodL);
  px(ctx, 12, 1, woodL);
  px(ctx, 13, 1, woodL);

  return makeTexture(canvas);
}

function createCounterSprite() {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const top = 0x8b7355;
  const front = darken(top, 0.2);
  const edge = lighten(top, 0.15);

  // Counter top
  rect(ctx, 0, 0, 16, 6, edge);
  rect(ctx, 0, 2, 16, 4, top);
  // Front panel
  rect(ctx, 0, 6, 16, 10, front);
  // Handle
  rect(ctx, 6, 10, 4, 1, 0xaaaaaa);
  // Edge highlight
  rect(ctx, 0, 0, 16, 1, lighten(edge, 0.1));

  return makeTexture(canvas);
}

function createStoveSprite() {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const body = 0x4a4a4a;
  const burner = 0x2a2a2a;

  rect(ctx, 0, 0, 16, 16, body);
  // Burners
  rect(ctx, 2, 2, 4, 4, burner);
  rect(ctx, 10, 2, 4, 4, burner);
  // Burner rings
  px(ctx, 3, 3, 0xff4444);
  px(ctx, 4, 3, 0xff4444);
  px(ctx, 11, 3, 0xff4444);
  px(ctx, 12, 3, 0xff4444);
  // Oven door
  rect(ctx, 2, 8, 12, 6, darken(body, 0.2));
  rect(ctx, 3, 9, 10, 4, darken(body, 0.1));
  // Handle
  rect(ctx, 5, 8, 6, 1, 0xaaaaaa);
  // Knobs
  for (let i = 0; i < 4; i++) px(ctx, 3 + i * 3, 7, 0xdddddd);

  return makeTexture(canvas);
}

function createFridgeSprite() {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  rect(ctx, 1, 0, 14, 16, 0xd8d8d8);
  rect(ctx, 2, 1, 12, 6, lighten(0xd8d8d8, 0.1));
  rect(ctx, 2, 8, 12, 7, 0xd0d0d0);
  // Door line
  rect(ctx, 2, 7, 12, 1, darken(0xd8d8d8, 0.15));
  // Handles
  rect(ctx, 12, 3, 1, 3, 0x888888);
  rect(ctx, 12, 10, 1, 3, 0x888888);
  // Outline
  for (let y = 0; y < 16; y++) {
    px(ctx, 0, y, 0x1a1a2e);
    px(ctx, 15, y, 0x1a1a2e);
  }

  return makeTexture(canvas);
}

function createShelfSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const wood = 0x8b6e50;
  rect(ctx, 0, 0, 16, 16, wood);

  // Shelves
  rect(ctx, 0, 5, 16, 1, darken(wood, 0.2));
  rect(ctx, 0, 10, 16, 1, darken(wood, 0.2));

  // Items on shelves
  const itemColors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6];
  for (let row = 0; row < 3; row++) {
    const shelfY = row * 5 + 1;
    for (let i = 0; i < 3; i++) {
      const x = 2 + i * 5;
      const c = itemColors[Math.floor(rng() * itemColors.length)];
      rect(ctx, x, shelfY, 3, 4, c);
      px(ctx, x, shelfY, lighten(c, 0.2));
    }
  }

  return makeTexture(canvas);
}

function createRegisterSprite() {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // Counter
  rect(ctx, 0, 6, 16, 10, 0x5a5a5a);
  // Register body
  rect(ctx, 3, 0, 10, 8, 0x3a3a3a);
  // Screen
  rect(ctx, 4, 1, 8, 4, 0x00aa44);
  // Buttons
  rect(ctx, 4, 6, 2, 1, 0xdddddd);
  rect(ctx, 7, 6, 2, 1, 0xdddddd);
  rect(ctx, 10, 6, 2, 1, 0xdddddd);
  // Drawer
  rect(ctx, 2, 10, 12, 4, darken(0x5a5a5a, 0.15));
  rect(ctx, 6, 11, 4, 1, 0xaaaaaa);

  return makeTexture(canvas);
}

function createFreezerSprite() {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  rect(ctx, 0, 0, 16, 16, 0xc0d8e8);
  // Glass front
  rect(ctx, 1, 1, 14, 14, 0xd8eaf5);
  // Items inside
  rect(ctx, 2, 3, 4, 3, 0x87ceeb);
  rect(ctx, 7, 3, 4, 3, 0xa0d0f0);
  rect(ctx, 2, 8, 4, 3, 0x90c8e8);
  rect(ctx, 7, 8, 4, 3, 0xb0ddf5);
  // Frame
  for (let i = 0; i < 16; i++) {
    px(ctx, i, 0, darken(0xc0d8e8, 0.2));
    px(ctx, i, 15, darken(0xc0d8e8, 0.2));
    px(ctx, 0, i, darken(0xc0d8e8, 0.2));
    px(ctx, 15, i, darken(0xc0d8e8, 0.2));
  }

  return makeTexture(canvas);
}

function createBenchSprite() {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const wood = 0x8b6e50;
  const woodD = darken(wood, 0.2);

  // Seat
  rect(ctx, 1, 6, 14, 3, wood);
  rect(ctx, 1, 6, 14, 1, lighten(wood, 0.15));
  // Back
  rect(ctx, 2, 2, 12, 4, woodD);
  rect(ctx, 2, 2, 12, 1, wood);
  // Legs
  rect(ctx, 2, 9, 2, 5, woodD);
  rect(ctx, 12, 9, 2, 5, woodD);
  // Arm rests
  rect(ctx, 1, 4, 2, 5, wood);
  rect(ctx, 13, 4, 2, 5, wood);

  return makeTexture(canvas);
}

function createFountainSprite() {
  const SIZE = 32;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const stone = 0x8899aa;
  const stoneD = darken(stone, 0.2);
  const water = 0x4a9ad5;

  // Base pool
  for (let y = 22; y <= 30; y++) {
    const halfW = 12 - Math.abs(y - 26);
    for (let x = 16 - halfW; x <= 16 + halfW; x++) {
      px(ctx, x, y, y === 22 || y === 30 ? stoneD : stone);
    }
  }
  // Water in pool
  for (let y = 24; y <= 28; y++) {
    const halfW = 10 - Math.abs(y - 26);
    for (let x = 16 - halfW; x <= 16 + halfW; x++) {
      px(ctx, x, y, water);
    }
  }
  // Pillar
  for (let y = 6; y <= 22; y++) {
    for (let x = 14; x <= 17; x++) px(ctx, x, y, y < 10 ? stoneD : stone);
  }
  // Top bowl
  for (let x = 11; x <= 20; x++) px(ctx, x, 5, stone);
  for (let x = 12; x <= 19; x++) px(ctx, x, 6, water);
  // Water spray
  px(ctx, 15, 2, lighten(water, 0.4));
  px(ctx, 16, 2, lighten(water, 0.4));
  px(ctx, 15, 1, lighten(water, 0.6));
  px(ctx, 16, 1, lighten(water, 0.6));
  px(ctx, 14, 3, lighten(water, 0.3));
  px(ctx, 17, 3, lighten(water, 0.3));

  return makeTexture(canvas);
}

// ─── NPC indicator ───────────────────────────────────────────────────────────
export function createNPCIndicatorTexture() {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Speech bubble background
  for (let y = 1; y <= 11; y++) {
    const halfW = y < 3 ? y + 3 : y > 9 ? 12 - y : 6;
    for (let x = 8 - halfW; x <= 8 + halfW; x++) {
      px(ctx, x, y, 0xffffff);
    }
  }
  // Bubble tail
  px(ctx, 7, 12, 0xffffff);
  px(ctx, 6, 13, 0xffffff);

  // Exclamation mark
  rect(ctx, 7, 3, 2, 5, 0xffa500);
  rect(ctx, 7, 9, 2, 2, 0xffa500);

  // Outline
  for (let y = 1; y <= 11; y++) {
    const halfW = y < 3 ? y + 3 : y > 9 ? 12 - y : 6;
    px(ctx, 8 - halfW - 1, y, 0x333333);
    px(ctx, 8 + halfW + 1, y, 0x333333);
  }

  return makeTexture(canvas);
}

// ─── NPC appearance presets ──────────────────────────────────────────────────
export const NPC_PRESETS = [
  {
    hair: 0x5a321b,
    skin: 0xf2c2a0,
    shirt: 0x7f5af0,
    pants: 0x3a2e2a,
    boots: 0x2a1b0f,
    accessory: 0xf6c453,
  },
  {
    hair: 0xd29b2e,
    skin: 0xe2b184,
    shirt: 0x198f7a,
    pants: 0x2c3e50,
    boots: 0x5c3317,
    accessory: 0xff7ca8,
  },
  {
    hair: 0x1f2233,
    skin: 0x8d6e63,
    shirt: 0xd94f3d,
    pants: 0x1c1f2a,
    boots: 0x3e2723,
    accessory: 0x5ac8fa,
  },
  {
    hair: 0x8f4f8f,
    skin: 0xf0c9a7,
    shirt: 0x3b82f6,
    pants: 0x334155,
    boots: 0x3b2b1f,
    accessory: 0x93c5fd,
  },
  {
    hair: 0x2f6b2f,
    skin: 0xc8956d,
    shirt: 0xeab308,
    pants: 0x4b5563,
    boots: 0x3f2d20,
    accessory: 0xfb7185,
  },
  {
    hair: 0xa13a2f,
    skin: 0xe9bf96,
    shirt: 0x14b8a6,
    pants: 0x312e81,
    boots: 0x4c1d12,
    accessory: 0xf9a8d4,
  },
];

export const PLAYER_COLORS = {
  hair: 0x3b2507,
  skin: 0xf5c5a3,
  shirt: 0x2563eb,
  pants: 0x374151,
  boots: 0x5c3317,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}
