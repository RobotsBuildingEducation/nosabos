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
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const COHESIVE_TILE_DETAILS = new Set([
  "tile_floor",
  "linoleum",
  "wood_floor",
  "rug",
  "mat",
  "wall",
  "produce",
]);

// ─── World-space noise ───────────────────────────────────────────────────────
// All ground color decisions sample these world-pixel-space functions instead
// of per-tile RNG, so color patches flow across tile borders. That is the
// single biggest "modern indie vs. 2004 tile grid" difference: no seams.
function hash2d(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + (seed | 0);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

let macroNoiseCache = { seed: null, sample: null };
function getMacroNoise(seed) {
  const key = Math.floor(seed);
  if (macroNoiseCache.seed === key) return macroNoiseCache.sample;
  const smooth = (t) => t * t * (3 - 2 * t);
  const lattice = (x, y, freq, offset) => {
    const fx = x * freq + offset;
    const fy = y * freq + offset * 1.7;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = smooth(fx - ix);
    const ty = smooth(fy - iy);
    const a = hash2d(ix, iy, key);
    const b = hash2d(ix + 1, iy, key);
    const c = hash2d(ix, iy + 1, key);
    const d = hash2d(ix + 1, iy + 1, key);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
  // Two octaves in world-pixel units: broad ~2.6-tile patches plus a smaller
  // ripple so patch borders wander organically instead of tracing blobs.
  const sample = (wx, wy) =>
    0.68 * lattice(wx, wy, 1 / 42, 11.31) + 0.32 * lattice(wx, wy, 1 / 13, 57.77);
  macroNoiseCache = { seed: key, sample };
  return sample;
}

function pixelGrain(wx, wy, seed) {
  return hash2d(wx, wy, (seed | 0) ^ 0x9e3779b9) * 2 - 1;
}

function luminanceOf(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const paletteCache = new WeakMap();
function sortedPalette(tileDef) {
  let palette = paletteCache.get(tileDef);
  if (!palette) {
    palette = (tileDef.colors || [[0x808080]])
      .flat()
      .slice()
      .sort((a, b) => luminanceOf(a) - luminanceOf(b));
    paletteCache.set(tileDef, palette);
  }
  return palette;
}

function shiftLuminance(hex, amount) {
  return amount >= 0 ? lighten(hex, amount) : darken(hex, -amount);
}

/**
 * Deterministic base color of a terrain at a world pixel. Cohesive man-made
 * floors keep one base hue with gentle large-scale light variation; organic
 * terrains resolve to multi-tile patches of the theme's palette entries
 * (Stardew's mottled two-tone lawns) with per-pixel grain on top.
 */
function terrainBaseColor(tileDef, seed, wx, wy) {
  const palette = sortedPalette(tileDef);
  const macro = getMacroNoise(seed);
  const t = macro(wx, wy);
  const grain = pixelGrain(wx, wy, seed) * 0.05;
  if (COHESIVE_TILE_DETAILS.has(tileDef.detail)) {
    const base = palette[Math.abs(Math.floor(seed)) % palette.length];
    return shiftLuminance(base, (t - 0.5) * 0.13 + grain);
  }
  const shaped = Math.min(0.999, Math.max(0, t + grain));
  const idx = Math.min(palette.length - 1, Math.floor(shaped * palette.length));
  return shiftLuminance(palette[idx], (t - 0.5) * 0.06 + grain * 0.6);
}

// ─── Solid tile treatments (edge-aware) ──────────────────────────────────────
// `edges` describes the neighborhood of a solid tile:
//   exposedUp/Down/Left/Right — that neighbor is walkable floor
//   linkedUp/Down/Left/Right  — that neighbor is the same tile type
// With it, furniture runs and wall spans render as one connected mass with a
// single silhouette instead of a grid of individually-outlined boxes.
function paintWallTile(ctx, tileDef, tileX, tileY, seed, edges) {
  const SIZE = 16;
  const palette = sortedPalette(tileDef);
  const base = palette[Math.min(palette.length - 1, 1)] ?? palette[0];
  // Face mode whenever anything non-void sits below — floor OR furniture —
  // so a counter run against the back wall keeps the wall face above it.
  const faceMode = edges
    ? !!(edges.faceDown !== undefined ? edges.faceDown : edges.exposedDown)
    : true;

  if (faceMode) {
    // Back wall: lit cap strip on top, masonry face below, dark baseboard.
    const cap = lighten(base, 0.2);
    const face = base;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const wx = tileX * SIZE + x;
        const wy = tileY * SIZE + y;
        const grain = pixelGrain(wx, wy, seed) * 6;
        const src = y < 5 ? cap : face;
        const [r, g, b] = hexToRgb(src);
        ctx.fillStyle = `rgb(${clamp(r + grain)},${clamp(g + grain)},${clamp(b + grain)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    for (let x = 0; x < SIZE; x++) {
      pxA(ctx, x, 0, 0x000000, 0.32);
      pxA(ctx, x, 1, lighten(base, 0.34), 0.5);
      pxA(ctx, x, 4, 0x000000, 0.3);
      pxA(ctx, x, 5, lighten(base, 0.22), 0.4);
      pxA(ctx, x, SIZE - 2, 0x000000, 0.2);
      pxA(ctx, x, SIZE - 1, 0x000000, 0.45);
    }
    // Brick coursing on the face, offset per row, phase-locked to world X so
    // the pattern runs continuously along a wall span.
    for (let row = 0; row < 3; row++) {
      const y = 7 + row * 3;
      for (let x = 0; x < SIZE; x++) pxA(ctx, x, y, 0x000000, 0.13);
      const phase = (tileX * SIZE + row * 4) % 8;
      for (let x = ((8 - phase) % 8); x < SIZE; x += 8) {
        pxA(ctx, x, y + 1, 0x000000, 0.12);
        pxA(ctx, x, y + 2, 0x000000, 0.12);
      }
    }
    if (hash2d(tileX, tileY, seed) > 0.62) {
      const mx = 3 + Math.floor(hash2d(tileX * 3, tileY * 7, seed) * 10);
      const my = 7 + Math.floor(hash2d(tileX * 7, tileY * 3, seed) * 6);
      pxA(ctx, mx, my, 0x000000, 0.12);
      pxA(ctx, mx + 1, my, 0xffffff, 0.07);
    }
    if (edges && !edges.linkedLeft) {
      for (let y = 0; y < SIZE; y++) pxA(ctx, 0, y, 0x000000, 0.28);
    }
    if (edges && !edges.linkedRight) {
      for (let y = 0; y < SIZE; y++) pxA(ctx, SIZE - 1, y, 0x000000, 0.28);
    }
    return;
  }

  // Cap/slab mode: seen from above (side borders, thick wall interiors).
  const slab = darken(base, 0.3);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const wx = tileX * SIZE + x;
      const wy = tileY * SIZE + y;
      const grain = pixelGrain(wx, wy, seed) * 5;
      const [r, g, b] = hexToRgb(slab);
      ctx.fillStyle = `rgb(${clamp(r + grain)},${clamp(g + grain)},${clamp(b + grain)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  if (edges) {
    const rim = lighten(base, 0.16);
    if (edges.exposedUp) for (let x = 0; x < SIZE; x++) pxA(ctx, x, 0, rim, 0.55);
    if (edges.exposedDown)
      for (let x = 0; x < SIZE; x++) pxA(ctx, x, SIZE - 1, 0x000000, 0.4);
    if (edges.exposedLeft)
      for (let y = 0; y < SIZE; y++) pxA(ctx, 0, y, rim, 0.4);
    if (edges.exposedRight)
      for (let y = 0; y < SIZE; y++) pxA(ctx, SIZE - 1, y, 0x000000, 0.32);
  }
}

function paintHedgeTile(ctx, tileDef, tileX, tileY, seed, edges) {
  const SIZE = 16;
  const rng = mulberry32(seed + tileX * 31 + tileY * 97);
  const palette = sortedPalette(tileDef);
  const dark = darken(palette[0], 0.24);
  const mid = palette[Math.min(1, palette.length - 1)];
  const light = lighten(palette[palette.length - 1], 0.12);

  // Rounded leafy mass. Corners adjacent to non-hedge tiles pull in by two
  // pixels so a hedge run reads as one clipped shrub wall, Stardew-style.
  const roundTL = !edges || (!edges.linkedUp && !edges.linkedLeft);
  const roundTR = !edges || (!edges.linkedUp && !edges.linkedRight);
  const roundBL = !edges || (!edges.linkedDown && !edges.linkedLeft);
  const roundBR = !edges || (!edges.linkedDown && !edges.linkedRight);
  const inset = (x, y) => {
    const stair = (cx, cy) => cx + cy < 3; // pixel quarter-round
    if (roundTL && stair(x, y)) return true;
    if (roundTR && stair(SIZE - 1 - x, y)) return true;
    if (roundBL && stair(x, SIZE - 1 - y)) return true;
    if (roundBR && stair(SIZE - 1 - x, SIZE - 1 - y)) return true;
    return false;
  };
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (inset(x, y)) continue;
      const wx = tileX * SIZE + x;
      const wy = tileY * SIZE + y;
      // Half-resolution leaf noise: 2px clumps read as foliage instead of
      // per-pixel static.
      const n = hash2d(wx >> 1, wy >> 1, seed);
      let c = n < 0.3 ? dark : n < 0.78 ? mid : light;
      if (y < 4) c = lighten(c, 0.1);
      if (y > 11) c = darken(c, 0.18);
      const grain = pixelGrain(wx, wy, seed) * 4;
      const [r, g, b] = hexToRgb(c);
      ctx.fillStyle = `rgb(${clamp(r + grain)},${clamp(g + grain)},${clamp(b + grain)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // Leaf clumps: bright top-left cluster + dark undercut per clump.
  const clumps = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < clumps; i++) {
    const cx = 2 + Math.floor(rng() * 12);
    const cy = 2 + Math.floor(rng() * 11);
    px(ctx, cx, cy, light);
    px(ctx, cx + 1, cy, mid);
    pxA(ctx, cx, cy + 1, dark, 0.7);
    pxA(ctx, cx + 2, cy + 1, dark, 0.4);
  }
  if (!edges || edges.exposedDown) {
    for (let x = 0; x < SIZE; x++) {
      pxA(ctx, x, SIZE - 1, 0x000000, 0.35);
      pxA(ctx, x, SIZE - 2, 0x000000, 0.16);
    }
  }
  if (!edges || edges.exposedUp) {
    for (let x = 1; x < SIZE - 1; x++) pxA(ctx, x, 0, lighten(light, 0.15), 0.3);
  }
}

function paintSolidRim(ctx, tileDef, base, edges) {
  const SIZE = 16;
  const rimDark = darken(base, 0.28);
  const rimLight = lighten(base, 0.18);
  const cornerMark =
    tileDef.name === "furniture" ? lighten(base, 0.26) : darken(base, 0.18);
  const openUp = !edges || !edges.linkedUp;
  const openDown = !edges || !edges.linkedDown;
  const openLeft = !edges || !edges.linkedLeft;
  const openRight = !edges || !edges.linkedRight;

  if (openUp) {
    for (let i = 0; i < SIZE; i++) {
      pxA(ctx, i, 0, rimDark, 0.42);
      pxA(ctx, i, 1, rimDark, 0.18);
    }
  }
  if (openDown) {
    const strong = edges && edges.exposedDown;
    for (let i = 0; i < SIZE; i++) pxA(ctx, i, SIZE - 1, 0x000000, strong ? 0.3 : 0.2);
  }
  if (openLeft) for (let i = 0; i < SIZE; i++) pxA(ctx, 0, i, rimDark, 0.22);
  if (openRight) for (let i = 0; i < SIZE; i++) pxA(ctx, SIZE - 1, i, 0x000000, 0.18);

  for (let x = 2; x <= 13; x += 4) {
    pxA(ctx, x, 3, rimLight, 0.38);
    pxA(ctx, x + 1, 4, rimLight, 0.26);
    pxA(ctx, x, 11, 0x000000, 0.14);
    pxA(ctx, x + 1, 10, 0x000000, 0.1);
  }

  const corners = [
    { cells: [[2, 2], [3, 2], [2, 3]], open: openUp && openLeft },
    { cells: [[12, 2], [13, 2], [13, 3]], open: openUp && openRight },
    { cells: [[2, 12], [2, 13], [3, 13]], open: openDown && openLeft },
    { cells: [[13, 12], [12, 13], [13, 13]], open: openDown && openRight },
  ];
  corners.forEach(({ cells, open }) => {
    if (!open) return;
    cells.forEach(([x, y]) => pxA(ctx, x, y, cornerMark, 0.48));
  });
}

// ─── Stardew-style tile textures ─────────────────────────────────────────────
export function createTileTexture(tileDef, tileX, tileY, seed, edges) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const detail = tileDef.detail;

  // Structural solids own their whole tile: walls get a lit cap + masonry
  // face, hedges a rounded leaf mass with transparent clipped corners.
  if (detail === "wall" && (tileDef.solid || tileDef.void)) {
    paintWallTile(ctx, tileDef, tileX, tileY, seed, edges);
    return makeTexture(canvas);
  }
  if (detail === "grass" && tileDef.solid && !tileDef.sprite) {
    paintHedgeTile(ctx, tileDef, tileX, tileY, seed, edges);
    return makeTexture(canvas);
  }

  const rng = mulberry32(seed + tileX * 31 + tileY * 97);

  // Seamless base: color comes from world-space patch noise, not per-tile
  // RNG, so the floor reads as one continuous material across the map.
  for (let py = 0; py < SIZE; py++) {
    for (let pxI = 0; pxI < SIZE; pxI++) {
      const wx = tileX * SIZE + pxI;
      const wy = tileY * SIZE + py;
      const [r, g, b] = hexToRgb(terrainBaseColor(tileDef, seed, wx, wy));
      const grain = pixelGrain(wx, wy, seed + 101) * 5;
      ctx.fillStyle = `rgb(${clamp(r + grain)},${clamp(g + grain)},${clamp(b + grain)})`;
      ctx.fillRect(pxI, py, 1, 1);
    }
  }
  const base = terrainBaseColor(
    tileDef,
    seed,
    tileX * SIZE + 8,
    tileY * SIZE + 8,
  );

  // Detail overlays
  if (detail === "grass") {
    // Flecked lawn: mostly-tonal darker sprigs with the occasional light
    // tip. Bright marks stay rare — light variation belongs to the
    // multi-tile patch noise, not to per-blade highlights.
    const tufts = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < tufts; i++) {
      const gx = 2 + Math.floor(rng() * 12);
      const gy = 3 + Math.floor(rng() * 11);
      const sprig = darken(base, 0.14 + rng() * 0.1);
      px(ctx, gx, gy, sprig);
      px(ctx, gx, gy - 1, sprig);
      pxA(ctx, gx + 1, gy, sprig, 0.6);
      if (rng() > 0.55) pxA(ctx, gx, gy - 2, lighten(base, 0.16), 0.8);
    }
    for (let i = 0; i < 3; i++) {
      const x = 1 + Math.floor(rng() * 14);
      const y = 1 + Math.floor(rng() * 14);
      pxA(ctx, x, y, rng() > 0.5 ? lighten(base, 0.1) : darken(base, 0.12), 0.3);
    }
    if (rng() > 0.9) {
      const x = 3 + Math.floor(rng() * 10);
      const y = 3 + Math.floor(rng() * 10);
      px(ctx, x, y, 0xfff1a8);
      pxA(ctx, x - 1, y, 0xf8fafc, 0.6);
      pxA(ctx, x + 1, y, 0xf8fafc, 0.6);
      px(ctx, x, y + 1, darken(base, 0.18));
    }
  } else if (detail === "dirt") {
    // Pebbles, worn ruts and hairline cracks keep paths from reading as noise.
    const pebbles = 3 + Math.floor(rng() * 4);
    for (let i = 0; i < pebbles; i++) {
      const dx = Math.floor(rng() * 13) + 1;
      const dy = Math.floor(rng() * 13) + 1;
      px(ctx, dx, dy, darken(base, 0.12));
      if (rng() > 0.35) px(ctx, dx + 1, dy, darken(base, 0.08));
      if (rng() > 0.65) px(ctx, dx, dy - 1, lighten(base, 0.13));
    }
    if (rng() > 0.45) {
      const cx = 4 + Math.floor(rng() * 8);
      const cy = 4 + Math.floor(rng() * 8);
      pxA(ctx, cx, cy, darken(base, 0.28), 0.55);
      pxA(ctx, cx + 1, cy + 1, darken(base, 0.24), 0.45);
      pxA(ctx, cx + 2, cy + 1, darken(base, 0.2), 0.35);
    }
  } else if (detail === "water") {
    // Broken wave bands, depth pixels and occasional bubbles.
    const phase = (tileX * 3 + tileY * 7) % 8;
    for (let i = 0; i < 4; i++) {
      const wx = ((phase + i * 5) % 14) + 1;
      const wy = ((phase + i * 3) % 12) + 2;
      px(ctx, wx, wy, lighten(base, 0.25));
      px(ctx, wx + 1, wy, lighten(base, 0.15));
      if (wx < 13 && i % 2 === 0) pxA(ctx, wx + 2, wy, lighten(base, 0.08), 0.7);
      pxA(ctx, wx - 1, wy + 1, darken(base, 0.18), 0.45);
    }
    if (rng() > 0.7) {
      const bx = 4 + Math.floor(rng() * 8);
      const by = 4 + Math.floor(rng() * 8);
      pxA(ctx, bx, by, 0xffffff, 0.55);
      pxA(ctx, bx + 1, by + 1, darken(base, 0.12), 0.45);
    }
  } else if (detail === "tile_floor") {
    // Continuous half-tile pavers. A shared base removes the harsh checker of
    // gameplay-cell-sized squares while small grout lines retain material scale.
    for (let py = 0; py < SIZE; py++) {
      for (let pxI = 0; pxI < SIZE; pxI++) {
        const quadrant = (Math.floor(pxI / 8) + Math.floor(py / 8)) % 2;
        pxA(ctx, pxI, py, quadrant ? 0x000000 : 0xffffff, 0.018);
      }
    }
    for (const seam of [0, 8]) {
      for (let i = 0; i < SIZE; i++) {
        pxA(ctx, i, seam, 0x000000, 0.055);
        pxA(ctx, seam, i, 0x000000, 0.055);
        if (seam + 1 < SIZE) {
          pxA(ctx, i, seam + 1, 0xffffff, 0.025);
          pxA(ctx, seam + 1, i, 0xffffff, 0.025);
        }
      }
    }
    if ((tileX * 7 + tileY * 3) % 11 === 0) {
      pxA(ctx, 12, 3, 0xffffff, 0.12);
      pxA(ctx, 13, 3, 0xffffff, 0.08);
    }
  } else if (detail === "linoleum") {
    // Fine aggregate specks plus a soft diagonal waxed-floor sheen.
    for (let i = 0; i < 12; i++) {
      const sx = Math.floor(rng() * SIZE);
      const sy = Math.floor(rng() * SIZE);
      const bright = rng() > 0.35;
      pxA(ctx, sx, sy, bright ? 0xffffff : 0x000000, bright ? 0.08 : 0.045, 1);
    }
    for (let i = 3; i < 9; i++) {
      pxA(ctx, i, 11 - Math.floor(i / 2), 0xffffff, 0.045, 1);
    }
  } else if (detail === "wood_floor") {
    // Staggered plank floor with seams, end joints, knots and directional grain.
    for (let py = 0; py < SIZE; py++) {
      if (py % 4 === 0) {
        for (let x = 0; x < SIZE; x++) pxA(ctx, x, py, 0x000000, 0.12);
        for (let x = 0; x < SIZE; x++) pxA(ctx, x, py + 1, 0xffffff, 0.045);
      }
    }
    const join = ((tileX + (tileY % 2) * 2) * 5) % 13 + 2;
    for (let band = 0; band < 4; band++) {
      const bandJoin = ((join + band * 5) % 14) + 1;
      for (let y = band * 4 + 1; y < Math.min(SIZE, band * 4 + 4); y++) {
        pxA(ctx, bandJoin, y, 0x000000, 0.065);
      }
    }
    for (let i = 0; i < 4; i++) {
      const kx = 2 + Math.floor(rng() * 12);
      const ky = 2 + Math.floor(rng() * 12);
      if (i < 2) {
        px(ctx, kx, ky, darken(base, 0.2));
        pxA(ctx, kx + 1, ky, lighten(base, 0.15), 0.5);
      } else {
        pxA(ctx, kx, ky, darken(base, 0.15), 0.35);
        if (kx < 13) pxA(ctx, kx + 1, ky, darken(base, 0.12), 0.25);
      }
    }
  } else if (detail === "runway") {
    // Airport concourse markings with embedded wear and painted lane segments.
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
    for (let i = 0; i < 3; i++) {
      const x = 2 + Math.floor(rng() * 12);
      const y = 2 + Math.floor(rng() * 12);
      pxA(ctx, x, y, 0x000000, 0.08);
      if (rng() > 0.5) pxA(ctx, x + 1, y, 0xffffff, 0.06);
    }
  } else if (detail === "sunny_plaza") {
    // Warm sandstone pavers, subtle enough to keep the tutorial plaza cheerful.
    const seam = darken(base, 0.12);
    const bevel = lighten(base, 0.1);
    const split = (tileY % 2) * 8;
    for (let x = 0; x < SIZE; x++) {
      pxA(ctx, x, 0, seam, 0.34);
      pxA(ctx, x, 1, bevel, 0.28);
    }
    const joint = (8 + split - (tileX % 2) * 4) % SIZE;
    for (let y = 0; y < SIZE; y++) pxA(ctx, joint, y, seam, 0.18);
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(rng() * 12);
      const y = 3 + Math.floor(rng() * 11);
      pxA(ctx, x, y, rng() > 0.5 ? 0xffffff : seam, 0.12);
    }
  } else if (detail === "stone_path") {
    // Individually beveled cobbles with alternating shapes and moss in the joins.
    const mortar = darken(base, 0.2);
    const moss = 0x7b8f4b;
    const rowOffset = tileY % 2 === 0 ? 0 : 4;
    for (let y = 0; y < SIZE; y += 5) {
      for (let x = -rowOffset; x < SIZE; x += 8) {
        rect(ctx, x, y, 7, 4, rng() > 0.5 ? lighten(base, 0.035) : darken(base, 0.025));
        for (let xx = Math.max(0, x); xx < Math.min(SIZE, x + 7); xx++) {
          pxA(ctx, xx, y, lighten(base, 0.18), 0.5);
          pxA(ctx, xx, Math.min(SIZE - 1, y + 4), mortar, 0.45);
        }
        if (x >= 0) for (let yy = y; yy < Math.min(SIZE, y + 5); yy++) pxA(ctx, x, yy, mortar, 0.42);
      }
    }
    if (rng() > 0.6) {
      const x = 2 + Math.floor(rng() * 12);
      const y = 2 + Math.floor(rng() * 12);
      pxA(ctx, x, y, moss, 0.34);
      pxA(ctx, x + 1, y, moss, 0.22);
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
    // Coordinated market-display patches. The weave continues through adjacent
    // cells while seeded bins, baskets and sacks prevent one boxed-crate stamp.
    for (let y = 0; y < SIZE; y += 3) {
      const offset = (tileX * SIZE + tileY + y) % 6;
      for (let x = offset; x < SIZE; x += 6) {
        pxA(ctx, x, y, 0xffffff, 0.075);
        if (x + 1 < SIZE) pxA(ctx, x + 1, y + 1, 0x000000, 0.055);
      }
    }
    const variant = Math.abs(tileX * 5 + tileY * 7 + Math.floor(seed)) % 4;
    const wood = darken(base, 0.22);
    const woodLight = lighten(base, 0.16);
    if (variant === 0) {
      // A low woven citrus basket.
      rect(ctx, 3, 9, 10, 4, wood);
      rect(ctx, 4, 10, 8, 2, woodLight);
      rect(ctx, 2, 8, 12, 1, darken(wood, 0.12));
      for (const [x, y] of [[4, 7], [7, 6], [10, 7], [6, 9], [9, 9]]) {
        rect(ctx, x, y, 2, 2, 0xf39c12);
        px(ctx, x, y, 0xffd166);
      }
      px(ctx, 8, 5, 0x2f855a);
    } else if (variant === 1) {
      // A slatted tomato tray that reaches the cell edges like a stall run.
      rect(ctx, 0, 7, 16, 6, wood);
      rect(ctx, 0, 8, 16, 1, woodLight);
      rect(ctx, 0, 11, 16, 1, darken(wood, 0.13));
      for (const [x, y] of [[2, 6], [5, 7], [8, 6], [11, 7], [13, 6]]) {
        rect(ctx, x, y, 2, 2, 0xd9483b);
        px(ctx, x + 1, y, 0xf47a68);
        px(ctx, x, y - 1, 0x3f7d33);
      }
    } else if (variant === 2) {
      // Leafy greens in a shallow open bin.
      rect(ctx, 2, 10, 12, 3, wood);
      rect(ctx, 3, 11, 10, 1, woodLight);
      const greens = [0x287a3e, 0x3e9650, 0x69ad52];
      for (let i = 0; i < 7; i++) {
        const x = 3 + (i * 3) % 10;
        const y = 6 + (i % 3);
        const c = greens[i % greens.length];
        px(ctx, x, y, c);
        px(ctx, x - 1, y + 1, darken(c, 0.12));
        px(ctx, x + 1, y + 1, lighten(c, 0.1));
      }
    } else {
      // Paper sacks and bread add a warm non-produce silhouette.
      rect(ctx, 2, 7, 5, 6, 0xc99b63);
      rect(ctx, 3, 6, 3, 2, 0xe1bd86);
      rect(ctx, 9, 8, 5, 5, 0xb9824f);
      rect(ctx, 10, 7, 3, 2, 0xd9aa70);
      pxA(ctx, 4, 9, 0xffffff, 0.3);
      px(ctx, 11, 10, 0x7c4a2a);
      rect(ctx, 6, 5, 5, 2, 0xe4b866);
      px(ctx, 7, 5, 0xf2d28e);
    }
  } else if (detail === "rug") {
    // Continuous woven field. Motifs use world-space phase so they span cells.
    for (let py = 0; py < SIZE; py++) {
      for (let pxI = 0; pxI < SIZE; pxI++) {
        const gx = tileX * SIZE + pxI;
        const gy = tileY * SIZE + py;
        if ((gx + gy) % 7 === 0) pxA(ctx, pxI, py, 0xffd98a, 0.12);
        if ((gx - gy + 128) % 11 === 0) pxA(ctx, pxI, py, 0x4f2f22, 0.08);
      }
    }
    const motifPhase = Math.abs(tileX + tileY * 2) % 6;
    if (motifPhase === 0) {
      const motif = lighten(base, 0.3);
      for (let d = 0; d <= 4; d++) {
        pxA(ctx, 8 - d, 4 + d, motif, 0.42);
        pxA(ctx, 8 + d, 4 + d, motif, 0.42);
        pxA(ctx, 8 - d, 12 - d, motif, 0.32);
        pxA(ctx, 8 + d, 12 - d, motif, 0.32);
      }
    }
  } else if (detail === "mat") {
    // Fine world-space basket weave, with no border stamped around every cell.
    for (let py = 0; py < SIZE; py++) {
      for (let pxI = 0; pxI < SIZE; pxI++) {
        const gx = tileX * SIZE + pxI;
        const gy = tileY * SIZE + py;
        pxA(ctx, pxI, py, 0x4a7a3a, 0.08);
        if ((gx + gy) % 5 === 0) pxA(ctx, pxI, py, 0xffffff, 0.07);
        if ((gx - gy + 128) % 7 === 0) pxA(ctx, pxI, py, 0x000000, 0.055);
      }
    }
  } else if (detail === "gravel") {
    const pebbles = 7 + Math.floor(rng() * 5);
    for (let i = 0; i < pebbles; i++) {
      const dx = Math.floor(rng() * 14) + 1;
      const dy = Math.floor(rng() * 14) + 1;
      const c = rng() > 0.5 ? darken(base, 0.1) : lighten(base, 0.08);
      px(ctx, dx, dy, c);
      if (rng() > 0.5) px(ctx, dx + 1, dy, c);
      if (rng() > 0.7) pxA(ctx, dx, dy - 1, 0xffffff, 0.18);
    }
  } else if (detail === "wall") {
    // Offset masonry with top-lit mortar and occasional age marks.
    for (let py = 0; py < SIZE; py += 4) {
      const offset = (Math.floor(py / 4) % 2) * 4;
      for (let pxI = 0; pxI < SIZE; pxI++) {
        if (py % 4 === 0 || (pxI + offset) % 8 === 0) {
          pxA(ctx, pxI, py, 0x000000, 0.08, 1);
          if (py % 4 === 0 && py + 1 < SIZE) pxA(ctx, pxI, py + 1, 0xffffff, 0.045, 1);
        }
      }
    }
    if (rng() > 0.48) {
      const x = 3 + Math.floor(rng() * 10);
      const y = 2 + Math.floor(rng() * 11);
      pxA(ctx, x, y, 0x000000, 0.13);
      pxA(ctx, x + 1, y + 1, 0x000000, 0.08);
      if (rng() > 0.6) pxA(ctx, x, y + 1, 0x68834f, 0.18);
    }
  }

  const rimEligible =
    tileDef.solid &&
    !tileDef.sprite &&
    tileDef.name !== "prop footprint" &&
    !["wall", "produce", "grass", "flower"].includes(detail);
  if (rimEligible) paintSolidRim(ctx, tileDef, base, edges);

  return makeTexture(canvas);
}

// ─── Seamless ground layer ───────────────────────────────────────────────────
// The whole walkable floor is baked into ONE canvas: field first, walkable
// overlays (paths, rugs, accents) on top with rounded pixel-stair corners,
// terrain-aware edge treatments, clustered clutter, and contact shadows baked
// around every solid. This is where the Stardew read comes from — terrains
// meet each other with real transitions instead of butting rectangles.
const FABRIC_DETAILS = new Set(["rug", "mat", "produce"]);
const ORGANIC_DETAILS = new Set([
  "grass",
  "dirt",
  "gravel",
  "stone_path",
  "sunny_plaza",
  "flower",
  "water",
]);

function transitionStyle(detail) {
  if (FABRIC_DETAILS.has(detail)) return "fabric";
  if (ORGANIC_DETAILS.has(detail)) return "organic";
  return "hard";
}

const CLUTTER_FLOWER_TINTS = [0xf8fafc, 0xffd166, 0xff8fab, 0xc084fc];

export function createGroundLayerCanvas({
  mapData,
  tiles,
  mapWidth,
  mapHeight,
  seed,
}) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth * SIZE;
  canvas.height = mapHeight * SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const groundDef = tiles[0];
  if (!groundDef) return canvas;
  const macro = getMacroNoise(seed);

  const defAt = (x, y) => {
    if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return null;
    return tiles[mapData[y * mapWidth + x]] || null;
  };
  // What this layer paints in a cell: its own walkable terrain, plain ground
  // beneath solids and sprites, nothing (-1) for void cells.
  const terrainAt = (x, y) => {
    const def = defAt(x, y);
    if (!def || def.void) return -1;
    if (def.solid || def.sprite) return 0;
    return mapData[y * mapWidth + x];
  };
  const walkableAt = (x, y) => {
    const def = defAt(x, y);
    return !!def && !def.void && !def.solid && !def.sprite;
  };
  const blockedAt = (x, y) => {
    const def = defAt(x, y);
    return !def || def.void || def.solid;
  };
  const fieldColor = (wx, wy) => terrainBaseColor(groundDef, seed, wx, wy);
  const setPixel = (wx, wy, hex, alpha = 1) => {
    const [r, g, b] = hexToRgb(hex);
    ctx.fillStyle =
      alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
    ctx.fillRect(wx, wy, 1, 1);
  };

  // Pass 1 — bases: field under everything paintable, overlays on top.
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const terrain = terrainAt(x, y);
      if (terrain < 0) continue;
      ctx.drawImage(
        createTileTexture(groundDef, x, y, seed).image,
        x * SIZE,
        y * SIZE,
      );
      if (terrain === 0) continue;
      const overlayDef = tiles[terrain];
      if (!overlayDef) continue;
      ctx.drawImage(
        createTileTexture(overlayDef, x, y, seed).image,
        x * SIZE,
        y * SIZE,
      );
    }
  }

  // Pass 2 — transitions where an overlay meets the field.
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const terrain = terrainAt(x, y);
      if (terrain <= 0) continue;
      const overlayDef = tiles[terrain];
      if (!overlayDef) continue;
      // Flower accents on organic ground are just lusher lawn with blooms —
      // outlining them would read as raised platforms.
      if (
        overlayDef.detail === "flower" &&
        ["grass", "dirt", "sunny_plaza"].includes(groundDef.detail)
      )
        continue;
      const style = transitionStyle(overlayDef.detail);
      const ox = x * SIZE;
      const oy = y * SIZE;
      const isField = (nx, ny) => terrainAt(nx, ny) === 0 && walkableAt(nx, ny);
      const up = isField(x, y - 1);
      const down = isField(x, y + 1);
      const left = isField(x - 1, y);
      const right = isField(x + 1, y);
      const overlayBase = terrainBaseColor(overlayDef, seed, ox + 8, oy + 8);
      const seamDark = darken(overlayBase, 0.34);
      const grassField = groundDef.detail === "grass";

      // Rounded corners: field pixels stair-stepped back over the overlay.
      const stairs =
        style === "organic" ? [4, 2, 1, 1] : style === "fabric" ? [2, 1] : [];
      const carveCorner = (cornerX, cornerY, dirX, dirY) => {
        stairs.forEach((width, row) => {
          for (let i = 0; i < width; i++) {
            const wx = cornerX + dirX * i;
            const wy = cornerY + dirY * row;
            setPixel(wx, wy, fieldColor(wx, wy));
          }
        });
        if (stairs.length > 2) {
          // one dark pixel tucked into the curve grounds it
          setPixel(cornerX + dirX, cornerY + dirY, seamDark, 0.35);
        }
      };
      if (stairs.length) {
        if (up && left) carveCorner(ox, oy, 1, 1);
        if (up && right) carveCorner(ox + SIZE - 1, oy, -1, 1);
        if (down && left) carveCorner(ox, oy + SIZE - 1, 1, -1);
        if (down && right) carveCorner(ox + SIZE - 1, oy + SIZE - 1, -1, -1);
      }

      const drawSide = (side) => {
        const horizontal = side === "up" || side === "down";
        for (let i = 0; i < SIZE; i++) {
          let sx;
          let sy;
          let inX = 0;
          let inY = 0;
          if (side === "up") {
            sx = ox + i;
            sy = oy;
            inY = 1;
          } else if (side === "down") {
            sx = ox + i;
            sy = oy + SIZE - 1;
            inY = -1;
          } else if (side === "left") {
            sx = ox;
            sy = oy + i;
            inX = 1;
          } else {
            sx = ox + SIZE - 1;
            sy = oy + i;
            inX = -1;
          }
          if (style === "fabric") {
            // woven hem: crisp dark selvage + bright inner border
            setPixel(sx, sy, seamDark, 0.55);
            setPixel(sx + inX, sy + inY, lighten(overlayBase, 0.22), 0.5);
          } else if (style === "organic") {
            setPixel(sx, sy, seamDark, 0.5);
            setPixel(sx + inX, sy + inY, seamDark, 0.16);
            const lx = sx - inX;
            const ly = sy - inY;
            setPixel(lx, ly, lighten(fieldColor(lx, ly), 0.16), 0.4);
          } else {
            setPixel(sx, sy, seamDark, 0.4);
            if (side === "up")
              setPixel(sx, sy + 1, lighten(overlayBase, 0.18), 0.35);
          }
        }
        if (style !== "organic") return;

        // Organic interlock: bites of field pushed into the overlay edge,
        // plus grass blades flopping over the lip when the field is grass.
        for (let s = 0; s < 3; s++) {
          const offset =
            2 +
            Math.floor(
              hash2d(x * 5 + s * 17, y * 9 + (horizontal ? 1 : 5) + (side === "down" || side === "right" ? 43 : 0), seed) *
                (SIZE - 5),
            );
          let bx;
          let by;
          let inX2 = 0;
          let inY2 = 0;
          if (side === "up") {
            bx = ox + offset;
            by = oy;
            inY2 = 1;
          } else if (side === "down") {
            bx = ox + offset;
            by = oy + SIZE - 1;
            inY2 = -1;
          } else if (side === "left") {
            bx = ox;
            by = oy + offset;
            inX2 = 1;
          } else {
            bx = ox + SIZE - 1;
            by = oy + offset;
            inX2 = -1;
          }
          setPixel(bx, by, fieldColor(bx, by));
          if (horizontal) setPixel(bx + 1, by, fieldColor(bx + 1, by));
          else setPixel(bx, by + 1, fieldColor(bx, by + 1));
          if (s % 2 === 0)
            setPixel(bx + inX2, by + inY2, fieldColor(bx, by), 0.85);
          if (grassField && s < 2) {
            const bladeDark = darken(fieldColor(bx, by), 0.2);
            const bladeLight = lighten(fieldColor(bx, by), 0.3);
            setPixel(bx - inX2, by - inY2, bladeDark);
            setPixel(bx + inX2, by + inY2, bladeLight, 0.9);
          }
        }
      };
      if (up) drawSide("up");
      if (down) drawSide("down");
      if (left) drawSide("left");
      if (right) drawSide("right");

      // Overlay meeting a different overlay: single subtle seam.
      const seamTo = (nx, ny, sideDraw) => {
        const other = terrainAt(nx, ny);
        if (other > 0 && other !== terrain && terrain < other) sideDraw();
      };
      seamTo(x + 1, y, () => {
        for (let i = 0; i < SIZE; i++)
          setPixel(ox + SIZE - 1, oy + i, seamDark, 0.2);
      });
      seamTo(x, y + 1, () => {
        for (let i = 0; i < SIZE; i++)
          setPixel(ox + i, oy + SIZE - 1, seamDark, 0.2);
      });
    }
  }

  // Pass 3 — clustered clutter on open field cells. Clumps follow their own
  // noise channel so tufts, blooms, and pebbles gather in drifts, with calm
  // floor between them, instead of uniform confetti.
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      if (terrainAt(x, y) !== 0 || !walkableAt(x, y)) continue;
      const detail = groundDef.detail;
      if (!["grass", "dirt", "gravel"].includes(detail)) continue;
      const n = macro(x * SIZE + 313, y * SIZE + 517);
      if (n < 0.56) continue;
      const cellSeed = hash2d(x, y, seed ^ 0x51ed);
      const ox = x * SIZE;
      const oy = y * SIZE;
      const spots = 1 + (n > 0.7 ? 1 : 0);
      for (let s = 0; s < spots; s++) {
        const tx = ox + 2 + Math.floor(hash2d(x * 3 + s, y * 7, seed ^ 0xabc) * 12);
        const ty = oy + 3 + Math.floor(hash2d(x * 7, y * 3 + s, seed ^ 0xdef) * 11);
        const local = fieldColor(tx, ty);
        if (detail === "grass") {
          const dark = darken(local, 0.2);
          setPixel(tx, ty, dark);
          setPixel(tx, ty - 1, darken(local, 0.12));
          setPixel(tx + 1, ty, darken(local, 0.16), 0.7);
          setPixel(tx, ty - 2, lighten(local, 0.2), 0.85);
        } else {
          const stone = s % 2 === 0 ? lighten(local, 0.14) : darken(local, 0.16);
          setPixel(tx, ty, stone);
          setPixel(tx + 1, ty, stone, 0.8);
          setPixel(tx, ty + 1, darken(local, 0.3), 0.35);
        }
      }
      if (detail === "grass" && n > 0.74 && cellSeed > 0.45) {
        const fx = ox + 4 + Math.floor(cellSeed * 8);
        const fy = oy + 4 + Math.floor(hash2d(y, x, seed ^ 0x777) * 8);
        const tint =
          CLUTTER_FLOWER_TINTS[
            Math.floor(hash2d(x + 9, y + 9, seed) * CLUTTER_FLOWER_TINTS.length)
          ];
        setPixel(fx, fy - 1, tint);
        setPixel(fx - 1, fy, tint);
        setPixel(fx + 1, fy, tint);
        setPixel(fx, fy + 1, tint);
        setPixel(fx, fy, 0xffd700);
        setPixel(fx, fy + 2, darken(fieldColor(fx, fy), 0.22));
      }
    }
  }

  // Pass 4 — baked contact shadow: floors darken along solid neighbors, with
  // the strong reading under walls above (top-down light), soft on the sides.
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      if (terrainAt(x, y) < 0 || !walkableAt(x, y)) continue;
      const ox = x * SIZE;
      const oy = y * SIZE;
      const upB = blockedAt(x, y - 1);
      const downB = blockedAt(x, y + 1);
      const leftB = blockedAt(x - 1, y);
      const rightB = blockedAt(x + 1, y);
      if (upB) {
        for (let i = 0; i < 6; i++) {
          const a = 0.26 * Math.pow(1 - i / 6, 1.5);
          ctx.fillStyle = `rgba(26, 16, 8, ${a})`;
          ctx.fillRect(ox, oy + i, SIZE, 1);
        }
      }
      if (leftB) {
        for (let i = 0; i < 4; i++) {
          const a = 0.15 * (1 - i / 4);
          ctx.fillStyle = `rgba(26, 16, 8, ${a})`;
          ctx.fillRect(ox + i, oy, 1, SIZE);
        }
      }
      if (rightB) {
        for (let i = 0; i < 4; i++) {
          const a = 0.15 * (1 - i / 4);
          ctx.fillStyle = `rgba(26, 16, 8, ${a})`;
          ctx.fillRect(ox + SIZE - 1 - i, oy, 1, SIZE);
        }
      }
      if (downB) {
        ctx.fillStyle = "rgba(26, 16, 8, 0.09)";
        ctx.fillRect(ox, oy + SIZE - 1, SIZE, 1);
        ctx.fillStyle = "rgba(26, 16, 8, 0.05)";
        ctx.fillRect(ox, oy + SIZE - 2, SIZE, 1);
      }
      // soft corner pooling where only the diagonal is solid
      const diagCorner = (dx, dy, blockedDiag) => {
        if (!blockedDiag) return;
        const startX = dx < 0 ? ox : ox + SIZE - 4;
        const startY = dy < 0 ? oy : oy + SIZE - 4;
        for (let cy = 0; cy < 4; cy++) {
          for (let cx = 0; cx < 4; cx++) {
            const distX = dx < 0 ? 3 - cx : cx;
            const distY = dy < 0 ? 3 - cy : cy;
            const a = 0.1 * Math.max(0, 1 - (distX + distY) / 6);
            if (a <= 0.01) continue;
            ctx.fillStyle = `rgba(26, 16, 8, ${a})`;
            ctx.fillRect(startX + cx, startY + cy, 1, 1);
          }
        }
      };
      if (!upB && !leftB) diagCorner(-1, -1, blockedAt(x - 1, y - 1));
      if (!upB && !rightB) diagCorner(1, -1, blockedAt(x + 1, y - 1));
      if (!downB && !leftB) diagCorner(-1, 1, blockedAt(x - 1, y + 1));
      if (!downB && !rightB) diagCorner(1, 1, blockedAt(x + 1, y + 1));
    }
  }

  return canvas;
}

export function createGroundLayerTexture(options) {
  return makeTexture(createGroundLayerCanvas(options));
}

export function createGroundDecalTexture(kind, seed) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const rng = mulberry32(seed * 17 + 991);

  if (kind === "grass_tuft") {
    const blade = [0x3f7f2f, 0x4d9640, 0x6bb85a];
    for (let i = 0; i < 3; i++) {
      const baseX = 5 + i * 2 + Math.floor(rng() * 2);
      const baseY = 14 - Math.floor(rng() * 2);
      px(ctx, baseX, baseY, blade[0]);
      px(ctx, baseX - 1, baseY - 1, blade[1]);
      px(ctx, baseX, baseY - 2, blade[2]);
      if (rng() > 0.5) px(ctx, baseX + 1, baseY - 1, blade[1]);
    }
    pxA(ctx, 6, 15, 0x000000, 0.15);
    pxA(ctx, 9, 15, 0x000000, 0.12);
  }

  if (kind === "flower_patch") {
    const petals = [0xff6ea8, 0xffd166, 0xc084fc, 0x7dd3fc, 0xfb7185];
    const bloomCount = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < bloomCount; i++) {
      const cx = 4 + Math.floor(rng() * 8);
      const cy = 5 + Math.floor(rng() * 7);
      const p = petals[Math.floor(rng() * petals.length)];
      px(ctx, cx, cy, 0xfef08a);
      px(ctx, cx - 1, cy, p);
      px(ctx, cx + 1, cy, p);
      px(ctx, cx, cy - 1, p);
      px(ctx, cx, cy + 1, p);
      px(ctx, cx, cy + 2, 0x4a8a35);
    }
  }

  if (kind === "stones") {
    const tone = [0xcbd5e1, 0x94a3b8, 0x64748b];
    const pebbleCount = 3 + Math.floor(rng() * 5);
    for (let i = 0; i < pebbleCount; i++) {
      const x = 3 + Math.floor(rng() * 10);
      const y = 6 + Math.floor(rng() * 8);
      const c = tone[Math.floor(rng() * tone.length)];
      px(ctx, x, y, c);
      if (rng() > 0.4) px(ctx, x + 1, y, darken(c, 0.12));
    }
  }

  if (kind === "wood_scraps") {
    const woods = [0x8b5e3c, 0xa36f43, 0x6b4226];
    const pieceCount = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < pieceCount; i++) {
      const x = 3 + Math.floor(rng() * 10);
      const y = 6 + Math.floor(rng() * 8);
      const w = 2 + Math.floor(rng() * 3);
      const c = woods[Math.floor(rng() * woods.length)];
      rect(ctx, x, y, w, 1, c);
      pxA(ctx, x, y + 1, 0x000000, 0.2);
    }
  }

  if (kind === "paper_bits") {
    const papers = [0xf8fafc, 0xe2e8f0, 0xf1f5f9];
    const pieceCount = 2 + Math.floor(rng() * 4);
    for (let i = 0; i < pieceCount; i++) {
      const x = 3 + Math.floor(rng() * 9);
      const y = 5 + Math.floor(rng() * 9);
      const c = papers[Math.floor(rng() * papers.length)];
      rect(ctx, x, y, 2, 2, c);
      pxA(ctx, x + 1, y + 1, 0x64748b, 0.25);
    }
  }

  if (kind === "confetti") {
    const palette = [0xff6b6b, 0xffd166, 0x4ecdc4, 0x8ecae6, 0xc77dff];
    for (let i = 0; i < 10; i++) {
      const x = 2 + Math.floor(rng() * 12);
      const y = 3 + Math.floor(rng() * 10);
      const c = palette[Math.floor(rng() * palette.length)];
      px(ctx, x, y, c);
      if (rng() > 0.5) px(ctx, x + 1, y, darken(c, 0.12));
    }
  }

  if (kind === "leaf_litter") {
    const leaves = [0x8f6d32, 0x6b8f3a, 0xa05a2c, 0x5a7d2f];
    for (let i = 0; i < 6; i++) {
      const x = 2 + Math.floor(rng() * 11);
      const y = 5 + Math.floor(rng() * 8);
      const c = leaves[Math.floor(rng() * leaves.length)];
      px(ctx, x, y, c);
      px(ctx, x + 1, y, lighten(c, 0.08));
      if (rng() > 0.5) px(ctx, x, y + 1, darken(c, 0.12));
    }
  }

  if (kind === "floor_marks") {
    const mark = rng() > 0.5 ? 0xf8fafc : 0xfcd34d;
    for (let y = 4; y <= 11; y += 3) {
      for (let x = 3; x <= 12; x++) {
        if ((x + y) % 2 === 0) pxA(ctx, x, y, mark, 0.45);
      }
    }
  }

  if (kind === "book_pages") {
    const papers = [0xf8f1dc, 0xf5efe6, 0xfaf7ef];
    for (let i = 0; i < 4; i++) {
      const x = 3 + Math.floor(rng() * 9);
      const y = 5 + Math.floor(rng() * 7);
      const c = papers[Math.floor(rng() * papers.length)];
      rect(ctx, x, y, 3, 2, c);
      pxA(ctx, x + 1, y + 1, 0x8b7355, 0.28);
    }
  }

  return makeTexture(canvas);
}

// ─── Stardew-style character sprite (32x32 with rich detail) ─────────────────
export function createCharacterTexture(colors, direction = "down", frame = 0) {
  const SIZE = 40;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const outline = 0x1a1a2e;
  const fur = colors.fur;
  const furDark = darken(fur, 0.22);
  const furLight = lighten(fur, 0.2);
  const belly = colors.belly || lighten(fur, 0.28);
  const ear = colors.ear || darken(fur, 0.3);
  const paw = colors.paw || furDark;
  const accent = colors.accent || 0xe11d48;
  const species = colors.species || "animal";
  const isDog = species === "dog";

  const phase = frame % 6;
  const stride = phase === 1 || phase === 5 ? 1 : phase === 3 ? -1 : 0;
  const bob = phase === 2 || phase === 4 ? 1 : 0;
  const tailWag = phase % 2 === 0 ? -1 : 1;

  const draw = (x, y, c) => px(ctx, x, y + bob, c);

  const mirror = (cx, off, y, c) => {
    draw(cx - off, y, c);
    draw(cx + off - 1, y, c);
  };

  const drawHeadFront = () => {
    // ears (dog has longer floppy ears)
    const earTop = isDog ? 4 : 5;
    const earBottom = isDog ? 13 : 10;
    for (let y = earTop; y <= earBottom; y++) {
      draw(12, y, outline);
      draw(27, y, outline);
      for (let x = 13; x <= 15; x++) draw(x, y, ear);
      for (let x = 24; x <= 26; x++) draw(x, y, ear);
      if (isDog && y >= 10) {
        draw(11, y, furDark);
        draw(28, y, furDark);
      }
    }

    // head
    for (let y = 9; y <= 22; y++) {
      const w = y < 13 ? 8 : y < 19 ? 9 : 8;
      for (let x = 20 - w; x <= 19 + w; x++) {
        const edge = x === 20 - w || x === 19 + w;
        draw(x, y, edge ? outline : y < 14 ? furLight : fur);
      }
    }

    // muzzle (dog gets longer snout)
    const muzzleStart = isDog ? 15 : 16;
    const muzzleEnd = isDog ? 23 : 22;
    for (let y = muzzleStart; y <= muzzleEnd; y++) {
      for (let x = 14; x <= 25; x++) draw(x, y, belly);
    }

    // eyes + nose
    mirror(20, 4, 14, 0xffffff);
    mirror(20, 4, 15, 0x1f2937);
    draw(19, 18, 0x111827);
    draw(20, 18, 0x111827);
    draw(19, 19, 0xb45309);
    draw(20, 19, 0xb45309);
    if (isDog) {
      draw(19, 20, 0xfb7185);
      draw(20, 20, 0xfb7185);
      draw(25, 13, darken(fur, 0.28)); // face spot
    }
  };

  const drawHeadBack = () => {
    for (let y = 6; y <= 22; y++) {
      const w = y < 12 ? 8 : y < 19 ? 9 : 8;
      for (let x = 20 - w; x <= 19 + w; x++) {
        const edge = x === 20 - w || x === 19 + w;
        draw(x, y, edge ? outline : y < 12 ? furLight : furDark);
      }
    }
  };

  const drawHeadSide = (flip) => {
    const xf = (x) => (flip ? SIZE - 1 - x : x);
    for (let y = 6; y <= 22; y++) {
      const w = y < 12 ? 8 : y < 19 ? 9 : 8;
      for (let x = 11; x <= 11 + w * 2; x++) {
        const edge = x === 11 || x === 11 + w * 2;
        const muzzle = x <= 15;
        draw(xf(x), y, edge ? outline : muzzle && y > 14 ? belly : fur);
      }
    }
    draw(xf(14), 15, 0xffffff);
    draw(xf(14), 16, 0x1f2937);
    draw(xf(12), 18, 0x111827);
    draw(xf(12), 19, 0xb45309);
    if (isDog) {
      draw(xf(11), 19, 0xb45309);
      draw(xf(12), 20, 0xfb7185);
    }
  };

  const drawBody = (flip = false) => {
    const xf = (x) => (flip ? SIZE - 1 - x : x);

    for (let y = 23; y <= 33; y++) {
      const w = y < 27 ? 8 : 9;
      for (let x = 20 - w; x <= 19 + w; x++) {
        const edge = x === 20 - w || x === 19 + w;
        draw(xf(x), y, edge ? outline : y < 28 ? fur : furDark);
      }
    }

    // belly patch
    for (let y = 27; y <= 33; y++) {
      for (let x = 16; x <= 23; x++) draw(xf(x), y, belly);
    }

    // scarf/collar
    for (let x = 13; x <= 26; x++) draw(xf(x), 24, accent);
    draw(xf(19), 24, lighten(accent, 0.2));

    // tail (dog tail thicker with tip)
    const tailX = flip ? 10 : 29;
    draw(tailX + tailWag, 28, outline);
    draw(tailX + tailWag, 29, furDark);
    draw(tailX + tailWag, 30, furDark);
    if (isDog) {
      draw(tailX + tailWag + (flip ? -1 : 1), 29, fur);
      draw(tailX + tailWag + (flip ? -1 : 1), 30, furLight);
    }
  };

  const drawPaws = (flip = false) => {
    const xf = (x) => (flip ? SIZE - 1 - x : x);
    const leftOffset = stride;
    const rightOffset = -stride;

    for (let y = 34; y <= 38; y++) {
      for (let x = 14 + leftOffset; x <= 17 + leftOffset; x++)
        draw(xf(x), y, y > 36 ? paw : furDark);
      for (let x = 22 + rightOffset; x <= 25 + rightOffset; x++)
        draw(xf(x), y, y > 36 ? paw : furDark);
      draw(xf(13 + leftOffset), y, outline);
      draw(xf(26 + rightOffset), y, outline);
    }
  };

  if (direction === "up") {
    drawHeadBack();
    drawBody();
    drawPaws();
  } else if (direction === "left") {
    drawHeadSide(false);
    drawBody(false);
    drawPaws(false);
  } else if (direction === "right") {
    drawHeadSide(true);
    drawBody(true);
    drawPaws(true);
  } else {
    drawHeadFront();
    drawBody();
    drawPaws();
  }

  for (let x = 13; x <= 26; x++) {
    pxA(ctx, x, 39, 0x000000, 0.16);
  }

  return makeTexture(canvas);
}

// ─── Sprite textures for map objects ─────────────────────────────────────────
export function createSpriteTexture(type, seed) {
  const rng = mulberry32(seed);

  if (type === "tree") return createTreeSprite(rng);
  if (type === "house") return createHouseSprite();
  if (type === "building") return createBuildingSprite();
  if (type === "pavilion") return createPavilionSprite();
  if (type === "greenhouse") return createGreenhouseSprite();
  if (type === "doorway") return createDoorwaySprite();
  if (type === "fence") return createFenceSprite();
  if (type === "counter") return createCounterSprite(rng);
  if (type === "stove") return createStoveSprite();
  if (type === "fridge") return createFridgeSprite();
  if (type === "shelf") return createShelfSprite(rng);
  if (type === "bookshelf") return createBookshelfSprite(rng);
  if (type === "register") return createRegisterSprite();
  if (type === "freezer") return createFreezerSprite();
  if (type === "bench") return createBenchSprite();
  if (type === "tv") return createTVSprite(rng);
  if (type === "sofa") return createSofaSprite(rng);
  if (type === "plant") return createPlantSprite(rng);
  if (type === "table") return createTableSprite(rng);
  if (type === "lamp") return createLampSprite(rng);
  if (type === "sign") return createSignSprite(rng);
  if (type === "gate") return createGateSprite();
  if (type === "speaker") return createSpeakerSprite();
  if (type === "balloons") return createBalloonsSprite(rng);
  if (type === "desk") return createDeskSprite(rng);
  if (type === "suitcaseStack") return createSuitcaseStackSprite(rng);
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

function createBuildingSprite() {
  const SIZE = 48;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const wall = 0xb8c4d4;
  const wallD = darken(wall, 0.18);
  const wallL = lighten(wall, 0.12);
  const trim = 0x415a77;
  const glass = 0x87c8f2;
  const awning = 0xc75b39;

  rect(ctx, 7, 10, 34, 32, wall);
  rect(ctx, 7, 10, 34, 2, wallL);
  rect(ctx, 7, 40, 34, 2, wallD);
  rect(ctx, 5, 8, 38, 3, trim);
  rect(ctx, 8, 17, 32, 4, awning);
  rect(ctx, 9, 20, 30, 2, darken(awning, 0.18));

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 11 + col * 10;
      const y = 13 + row * 10;
      rect(ctx, x, y, 7, 5, glass);
      rect(ctx, x, y, 7, 1, lighten(glass, 0.15));
      rect(ctx, x, y + 4, 7, 1, darken(glass, 0.15));
      rect(ctx, x + 3, y, 1, 5, 0xf1f5f9);
    }
  }

  rect(ctx, 19, 26, 10, 14, 0x4b5563);
  rect(ctx, 20, 27, 8, 12, 0x111827);
  rect(ctx, 21, 28, 6, 10, 0x1f2937);
  rect(ctx, 25, 31, 1, 2, 0xfbbf24);

  rect(ctx, 11, 26, 5, 10, wallD);
  rect(ctx, 32, 26, 5, 10, wallD);
  rect(ctx, 13, 28, 1, 6, wallL);
  rect(ctx, 34, 28, 1, 6, wallL);

  rect(ctx, 10, 43, 28, 2, 0x000000);
  return makeTexture(canvas);
}

function createPavilionSprite() {
  const SIZE = 40;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const roof = 0x8b3a3a;
  const roofL = lighten(roof, 0.14);
  const roofD = darken(roof, 0.18);
  const wood = 0x8b6e50;
  const woodD = darken(wood, 0.2);
  const floor = 0xd4b483;

  for (let y = 4; y < 15; y++) {
    const half = Math.floor((y - 4) * 1.3) + 5;
    rect(ctx, 20 - half, y, half * 2, 1, roof);
    rect(ctx, 20 - half, y, 2, 1, roofD);
    rect(ctx, 20 + half - 2, y, 2, 1, roofL);
  }

  rect(ctx, 7, 15, 26, 3, roofD);
  rect(ctx, 10, 18, 2, 14, woodD);
  rect(ctx, 28, 18, 2, 14, woodD);
  rect(ctx, 14, 20, 2, 12, wood);
  rect(ctx, 24, 20, 2, 12, wood);
  rect(ctx, 11, 31, 18, 4, floor);
  rect(ctx, 11, 34, 18, 1, darken(floor, 0.16));
  rect(ctx, 8, 35, 24, 2, 0x000000);

  return makeTexture(canvas);
}

function createGreenhouseSprite() {
  const SIZE = 44;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const glass = 0xa7f3d0;
  const glassL = lighten(glass, 0.16);
  const frame = 0x4b6b5a;
  const frameL = lighten(frame, 0.1);
  const soil = 0x755532;

  for (let y = 4; y < 14; y++) {
    const half = Math.floor((y - 4) * 1.1) + 4;
    rect(ctx, 22 - half, y, half * 2, 1, frame);
    rect(ctx, 22 - half + 1, y + 1, half * 2 - 2, 1, glassL);
  }

  rect(ctx, 9, 14, 26, 20, glass);
  rect(ctx, 9, 14, 26, 1, frameL);
  rect(ctx, 9, 33, 26, 1, frame);
  for (let x = 9; x <= 35; x += 6) rect(ctx, x, 14, 1, 20, frame);
  for (let y = 18; y <= 30; y += 6) rect(ctx, 9, y, 26, 1, frame);
  rect(ctx, 18, 22, 8, 12, frame);
  rect(ctx, 19, 23, 6, 10, 0xe6fffa);
  rect(ctx, 12, 34, 20, 3, soil);
  rect(ctx, 13, 31, 4, 3, 0x16a34a);
  rect(ctx, 26, 30, 4, 4, 0x22c55e);
  rect(ctx, 8, 37, 28, 2, 0x000000);

  return makeTexture(canvas);
}

function createDoorwaySprite() {
  const SIZE = 40;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  const trim = 0x71829a;
  const trimL = lighten(trim, 0.18);
  const trimD = darken(trim, 0.2);
  const plaque = 0xf5efe4;
  const plaqueD = darken(plaque, 0.12);
  const opening = 0x1e293b;
  const openingL = lighten(opening, 0.12);
  const step = 0xaa7b4f;
  const stepL = lighten(step, 0.12);
  const shadow = 0x000000;

  rect(ctx, 13, 3, 14, 4, plaque);
  rect(ctx, 14, 4, 12, 2, plaqueD);
  rect(ctx, 11, 7, 18, 3, trimL);
  rect(ctx, 8, 10, 4, 22, trim);
  rect(ctx, 28, 10, 4, 22, trim);
  rect(ctx, 12, 10, 16, 3, trimL);
  rect(ctx, 12, 13, 16, 18, opening);
  rect(ctx, 14, 15, 12, 2, openingL);
  rect(ctx, 14, 19, 12, 1, lighten(opening, 0.22));
  rect(ctx, 10, 31, 20, 3, stepL);
  rect(ctx, 10, 33, 20, 2, step);
  rect(ctx, 9, 35, 22, 1, trimD);
  rect(ctx, 10, 36, 20, 2, shadow);

  rect(ctx, 6, 12, 2, 18, trimD);
  rect(ctx, 32, 12, 2, 18, trimD);
  rect(ctx, 12, 8, 16, 1, trimD);

  rect(ctx, 17, 23, 6, 5, 0xe2e8f0);
  rect(ctx, 18, 24, 4, 3, 0x94a3b8);
  rect(ctx, 16, 29, 8, 1, 0xf8fafc);

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

function createCounterSprite(rng) {
  const WIDTH = 32;
  const HEIGHT = 20;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const top = 0x8b7355;
  const front = darken(top, 0.2);
  const edge = lighten(top, 0.15);

  // Long continuous slab and recessed cabinet front read as a real fixture.
  rect(ctx, 1, 4, 30, 5, darken(edge, 0.08));
  rect(ctx, 0, 3, 32, 4, edge);
  rect(ctx, 1, 4, 30, 3, top);
  rect(ctx, 1, 3, 30, 1, lighten(edge, 0.12));
  rect(ctx, 2, 8, 28, 9, front);
  rect(ctx, 3, 9, 12, 7, darken(front, 0.05));
  rect(ctx, 17, 9, 12, 7, darken(front, 0.05));
  rect(ctx, 4, 10, 10, 5, front);
  rect(ctx, 18, 10, 10, 5, front);
  rect(ctx, 15, 8, 2, 9, darken(front, 0.18));
  rect(ctx, 6, 11, 5, 1, lighten(front, 0.14));
  rect(ctx, 21, 11, 5, 1, lighten(front, 0.14));
  px(ctx, 13, 12, 0xd6b768);
  px(ctx, 18, 12, 0xd6b768);
  rect(ctx, 2, 17, 28, 1, darken(front, 0.28));
  rect(ctx, 4, 18, 24, 1, 0x2c2119);

  // Seeded countertop stories keep adjacent counters from being clones.
  const variant = Math.floor(rng() * 3);
  if (variant === 0) {
    rect(ctx, 4, 1, 8, 3, 0x6f4c2f);
    rect(ctx, 5, 2, 6, 2, 0xa96d3d);
    for (const [x, c] of [[5, 0xe34b3f], [7, 0xf3a22f], [9, 0xd94336]]) {
      rect(ctx, x, 0, 2, 2, c);
      px(ctx, x + 1, 0, lighten(c, 0.2));
    }
    px(ctx, 6, 0, 0x397b42);
  } else if (variant === 1) {
    rect(ctx, 20, 0, 7, 4, 0xede4d2);
    rect(ctx, 21, 1, 5, 3, 0xf8f3e8);
    rect(ctx, 22, 2, 3, 1, 0x8b6e50);
    rect(ctx, 7, 1, 5, 2, 0xd9a15d);
    px(ctx, 8, 1, 0xf3d08f);
  } else {
    rect(ctx, 5, 1, 4, 3, 0xf8f1dc);
    px(ctx, 6, 2, 0x6b7280);
    rect(ctx, 22, 0, 4, 4, 0x3f7d33);
    px(ctx, 21, 1, 0x68a752);
    px(ctx, 26, 1, 0x68a752);
  }

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
  rect(ctx, 3, 9, 10, 4, 0x20252b);
  rect(ctx, 4, 10, 8, 1, 0x39424c);
  pxA(ctx, 4, 10, 0xffffff, 0.2);
  // Handle
  rect(ctx, 5, 8, 6, 1, 0xaaaaaa);
  // Knobs
  for (let i = 0; i < 4; i++) px(ctx, 3 + i * 3, 7, 0xdddddd);
  rect(ctx, 1, 15, 14, 1, 0x202124);

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
  // Small magnets and a pinned note make it feel inhabited.
  px(ctx, 4, 3, 0xef4444);
  px(ctx, 6, 5, 0x3b82f6);
  rect(ctx, 4, 10, 3, 3, 0xfff7d6);
  pxA(ctx, 5, 11, 0x6b7280, 0.45);
  // Outline
  for (let y = 0; y < 16; y++) {
    px(ctx, 0, y, 0x1a1a2e);
    px(ctx, 15, y, 0x1a1a2e);
  }

  return makeTexture(canvas);
}

function createShelfSprite(rng) {
  const WIDTH = 24;
  const HEIGHT = 28;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const wood = 0x8b6e50;
  const woodDark = darken(wood, 0.28);
  rect(ctx, 1, 1, 22, 26, woodDark);
  rect(ctx, 3, 2, 18, 23, darken(wood, 0.08));
  rect(ctx, 0, 0, 24, 2, lighten(wood, 0.12));
  rect(ctx, 1, 25, 22, 2, woodDark);
  rect(ctx, 0, 27, 24, 1, 0x241b15);

  const shelfRows = [7, 14, 21];
  shelfRows.forEach((y) => {
    rect(ctx, 2, y, 20, 2, woodDark);
    rect(ctx, 3, y, 18, 1, lighten(wood, 0.14));
  });

  // Each bay uses a different silhouette: bottles, jars, produce or sacks.
  const itemColors = [0xc9493d, 0x3d78b8, 0xe2b541, 0x3f9659, 0x8f5cad];
  for (let row = 0; row < 3; row++) {
    const floorY = shelfRows[row] - 1;
    const rowKind = (row + Math.floor(rng() * 4)) % 4;
    for (let slot = 0; slot < 4; slot++) {
      const x = 4 + slot * 4;
      const c = itemColors[Math.floor(rng() * itemColors.length)];
      if (rowKind === 0) {
        rect(ctx, x, floorY - 4, 2, 4, c);
        px(ctx, x, floorY - 5, lighten(c, 0.15));
        px(ctx, x + 1, floorY - 3, 0xf8fafc);
      } else if (rowKind === 1) {
        rect(ctx, x, floorY - 3, 3, 3, c);
        rect(ctx, x, floorY - 3, 3, 1, lighten(c, 0.2));
        px(ctx, x + 1, floorY - 2, 0xf8f1dc);
      } else if (rowKind === 2) {
        rect(ctx, x, floorY - 2, 3, 2, c);
        px(ctx, x + 1, floorY - 3, 0x3f7d33);
        px(ctx, x, floorY - 2, lighten(c, 0.22));
      } else {
        rect(ctx, x, floorY - 4, 3, 4, 0xc99b63);
        rect(ctx, x + 1, floorY - 5, 1, 1, 0xe4c28f);
        px(ctx, x + 1, floorY - 2, c);
      }
    }
  }

  // Small chalk label and side highlights make the shelving read as furniture.
  rect(ctx, 8, 22, 8, 3, 0x33443d);
  rect(ctx, 9, 23, 6, 1, 0xf5e7b2);
  rect(ctx, 1, 3, 1, 20, lighten(wood, 0.14));
  rect(ctx, 22, 3, 1, 20, darken(wood, 0.18));

  return makeTexture(canvas);
}

function createBookshelfSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const wood = 0x6b4d2f;
  const woodL = lighten(wood, 0.15);
  const woodD = darken(wood, 0.2);

  rect(ctx, 0, 0, 16, 16, wood);
  rect(ctx, 0, 0, 16, 1, woodL);
  rect(ctx, 0, 15, 16, 1, woodD);
  rect(ctx, 0, 5, 16, 1, woodD);
  rect(ctx, 0, 10, 16, 1, woodD);

  const bookColors = [0xb91c1c, 0x2563eb, 0x16a34a, 0xca8a04, 0x7c3aed];
  for (let row = 0; row < 3; row++) {
    const shelfY = row * 5 + 1;
    for (let x = 1; x < 15; x += 3) {
      const c = bookColors[Math.floor(rng() * bookColors.length)];
      const bookH = 3 + Math.floor(rng() * 2);
      rect(ctx, x, shelfY + 4 - bookH, 2, bookH, c);
      px(ctx, x, shelfY + 4 - bookH, lighten(c, 0.18));
      if (rng() > 0.65) px(ctx, x + 1, shelfY + 2, 0xf5d06f);
      if (rng() > 0.5) rect(ctx, x + 2, shelfY + 1, 1, 3, 0xf8f1dc);
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
  rect(ctx, 12, 2, 2, 11, 0xc7efff);
  pxA(ctx, 13, 3, 0xffffff, 0.55);
  pxA(ctx, 2, 2, 0xffffff, 0.45);
  pxA(ctx, 3, 2, 0xffffff, 0.32);
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
  rect(ctx, 2, 2, 12, 2, woodD);
  rect(ctx, 2, 2, 12, 1, wood);
  rect(ctx, 2, 5, 12, 1, woodD);
  // Legs
  rect(ctx, 2, 9, 2, 5, woodD);
  rect(ctx, 12, 9, 2, 5, woodD);
  // Arm rests
  rect(ctx, 1, 4, 2, 5, wood);
  rect(ctx, 13, 4, 2, 5, wood);
  rect(ctx, 3, 13, 3, 1, 0x374151);
  rect(ctx, 10, 13, 3, 1, 0x374151);

  return makeTexture(canvas);
}

function createTVSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, SIZE, SIZE);

  rect(ctx, 2, 2, 12, 8, 0x1f2937);
  const screens = [0x0ea5e9, 0x7c3aed, 0x0f766e];
  const screen = screens[Math.floor(rng() * screens.length)];
  rect(ctx, 3, 3, 10, 6, screen);
  rect(ctx, 4, 4, 8, 4, lighten(screen, 0.18));
  // Tiny changing program silhouette and scanline.
  rect(ctx, 7, 5, 2, 3, 0xfef3c7);
  px(ctx, 6, 6, 0x334155);
  px(ctx, 9, 6, 0x334155);
  rect(ctx, 4, 7, 8, 1, darken(screen, 0.14));
  rect(ctx, 6, 10, 4, 1, 0x6b7280);
  rect(ctx, 5, 11, 6, 2, 0x4b5563);
  rect(ctx, 4, 13, 8, 1, 0x8b6e50);

  return makeTexture(canvas);
}

function createSofaSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const fabrics = [0xb45309, 0x326f78, 0x7c4a71, 0x6f7938];
  const fabric = fabrics[Math.floor(rng() * fabrics.length)];
  const fabricL = lighten(fabric, 0.14);
  const fabricD = darken(fabric, 0.18);

  rect(ctx, 2, 6, 12, 6, fabric);
  rect(ctx, 3, 4, 10, 3, fabricL);
  rect(ctx, 1, 6, 2, 5, fabricD);
  rect(ctx, 13, 6, 2, 5, fabricD);
  rect(ctx, 3, 11, 10, 2, fabricD);
  rect(ctx, 4, 8, 3, 2, fabricL);
  rect(ctx, 9, 8, 3, 2, fabricL);
  pxA(ctx, 7, 7, 0xffffff, 0.13);
  pxA(ctx, 8, 7, 0x000000, 0.12);
  px(ctx, 5, 9, lighten(fabric, 0.28));
  px(ctx, 10, 9, lighten(fabric, 0.28));
  px(ctx, 3, 13, 0x4b2e16);
  px(ctx, 12, 13, 0x4b2e16);

  return makeTexture(canvas);
}

function createPlantSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  rect(ctx, 5, 10, 6, 4, 0xa16207);
  rect(ctx, 6, 11, 4, 2, 0xc2410c);
  const leaf = rng() > 0.5 ? 0x3f8f46 : 0x65a30d;
  const leafL = lighten(leaf, 0.18);
  const leafD = darken(leaf, 0.18);
  rect(ctx, 7, 6, 2, 5, leafD);
  rect(ctx, 5, 4, 2, 4, leaf);
  rect(ctx, 9, 4, 2, 4, leaf);
  rect(ctx, 3, 5, 2, 3, leafD);
  rect(ctx, 11, 5, 2, 3, leafD);
  px(ctx, 8, 3, leafL);
  px(ctx, 5, 3, leafL);
  px(ctx, 10, 3, leafL);
  pxA(ctx, 6, 11, 0xffffff, 0.18);
  rect(ctx, 4, 14, 8, 1, 0x000000);

  return makeTexture(canvas);
}

function createTableSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const wood = 0x8b6e50;
  rect(ctx, 2, 4, 12, 4, wood);
  rect(ctx, 2, 4, 12, 1, lighten(wood, 0.14));
  rect(ctx, 3, 8, 2, 6, darken(wood, 0.18));
  rect(ctx, 11, 8, 2, 6, darken(wood, 0.18));
  // A table setting varies between a book, flowers and a warm drink.
  const clutter = Math.floor(rng() * 3);
  if (clutter === 0) {
    rect(ctx, 5, 5, 5, 2, 0xf8f1dc);
    px(ctx, 7, 5, 0x8b7355);
  } else if (clutter === 1) {
    rect(ctx, 7, 4, 2, 3, 0x3f7d33);
    px(ctx, 6, 4, 0xff7aa2);
    px(ctx, 9, 4, 0xffd166);
  } else {
    rect(ctx, 6, 5, 3, 2, 0xf8f1dc);
    px(ctx, 7, 5, 0x6b4226);
    px(ctx, 9, 6, 0xf8f1dc);
  }
  rect(ctx, 2, 14, 3, 1, 0x000000);
  rect(ctx, 11, 14, 3, 1, 0x000000);

  return makeTexture(canvas);
}

function createLampSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const shade = rng() > 0.55 ? 0xf59e6b : 0xfbbf24;
  rect(ctx, 4, 2, 8, 4, darken(shade, 0.14));
  rect(ctx, 5, 2, 6, 4, shade);
  rect(ctx, 6, 3, 4, 2, lighten(shade, 0.38));
  pxA(ctx, 3, 6, shade, 0.2);
  pxA(ctx, 12, 6, shade, 0.2);
  rect(ctx, 7, 6, 2, 5, 0x737373);
  rect(ctx, 5, 11, 6, 2, 0xa3a3a3);
  rect(ctx, 6, 13, 4, 1, 0x525252);

  return makeTexture(canvas);
}

function createSignSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  rect(ctx, 2, 2, 12, 6, 0x2563eb);
  rect(ctx, 3, 3, 10, 4, 0xeff6ff);
  if (rng() > 0.5) {
    rect(ctx, 5, 4, 5, 1, 0x1d4ed8);
    px(ctx, 10, 3, 0x1d4ed8);
    px(ctx, 10, 5, 0x1d4ed8);
    rect(ctx, 5, 6, 4, 1, 0x60a5fa);
  } else {
    rect(ctx, 5, 4, 6, 1, 0x1d4ed8);
    rect(ctx, 5, 6, 6, 1, 0x60a5fa);
  }
  rect(ctx, 2, 8, 12, 1, 0x1e3a8a);
  rect(ctx, 7, 8, 2, 6, 0x8b6e50);

  return makeTexture(canvas);
}

function createGateSprite() {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  rect(ctx, 2, 2, 2, 12, 0x64748b);
  rect(ctx, 12, 2, 2, 12, 0x64748b);
  rect(ctx, 4, 2, 8, 2, 0x94a3b8);
  rect(ctx, 4, 6, 8, 1, 0xe2e8f0);
  rect(ctx, 5, 8, 6, 1, 0xf8fafc);
  rect(ctx, 6, 10, 4, 2, 0xcbd5e1);

  return makeTexture(canvas);
}

function createSpeakerSprite() {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  rect(ctx, 3, 1, 10, 14, 0x27272a);
  rect(ctx, 5, 3, 6, 4, 0x52525b);
  rect(ctx, 5, 9, 6, 4, 0x3f3f46);
  rect(ctx, 6, 4, 4, 2, 0x18181b);
  rect(ctx, 6, 10, 4, 2, 0x18181b);
  px(ctx, 12, 4, 0xf59e0b);
  px(ctx, 13, 5, 0xf59e0b);
  px(ctx, 12, 11, 0xf59e0b);
  px(ctx, 13, 10, 0xf59e0b);

  return makeTexture(canvas);
}

function createBalloonsSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const colors = [0xff6b6b, 0xffd166, 0x4ecdc4, 0xc77dff];
  const positions = [
    [5, 3],
    [9, 2],
    [7, 5],
  ];

  positions.forEach(([x, y], idx) => {
    const c = colors[(idx + Math.floor(rng() * colors.length)) % colors.length];
    rect(ctx, x, y, 3, 4, c);
    px(ctx, x + 1, y - 1, lighten(c, 0.18));
    rect(ctx, x + 1, y + 4, 1, 5, 0x8b5e3c);
  });
  rect(ctx, 6, 12, 4, 1, 0x8b5e3c);

  return makeTexture(canvas);
}

function createDeskSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const wood = 0x7c5a3c;
  rect(ctx, 2, 4, 12, 4, wood);
  rect(ctx, 2, 4, 12, 1, lighten(wood, 0.18));
  rect(ctx, 2, 8, 4, 5, darken(wood, 0.16));
  rect(ctx, 10, 8, 4, 5, darken(wood, 0.16));
  rect(ctx, 7, 5, 4, 2, rng() > 0.5 ? 0x94a3b8 : 0x4b5563);
  rect(ctx, 4, 5, 2, 2, 0xf8fafc);
  rect(ctx, 11, 5, 1, 3, 0x1f2937);
  px(ctx, 4, 5, 0xfacc15);
  rect(ctx, 3, 9, 2, 1, 0xd6b768);
  rect(ctx, 11, 9, 2, 1, 0xd6b768);
  rect(ctx, 2, 13, 4, 1, 0x000000);
  rect(ctx, 10, 13, 4, 1, 0x000000);

  return makeTexture(canvas);
}

function createSuitcaseStackSprite(rng) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const bottom = rng() > 0.5 ? 0x9a3412 : 0x7c3f58;
  const top = rng() > 0.5 ? 0x1d4ed8 : 0x16766f;
  rect(ctx, 3, 8, 10, 5, darken(bottom, 0.15));
  rect(ctx, 4, 9, 8, 3, bottom);
  rect(ctx, 6, 7, 5, 2, darken(top, 0.12));
  rect(ctx, 7, 6, 3, 1, lighten(top, 0.24));
  rect(ctx, 6, 10, 2, 1, 0xf8fafc);
  rect(ctx, 9, 9, 1, 2, 0xf8fafc);
  px(ctx, 11, 10, 0xfacc15);
  px(ctx, 4, 10, 0x60a5fa);
  rect(ctx, 3, 13, 3, 1, 0x000000);
  rect(ctx, 10, 13, 3, 1, 0x000000);

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
    species: "fox",
    fur: 0xf59e0b,
    belly: 0xfde68a,
    ear: 0xb45309,
    paw: 0x92400e,
    accent: 0xef4444,
  }, // fox
  {
    species: "wolf",
    fur: 0x9ca3af,
    belly: 0xe5e7eb,
    ear: 0x4b5563,
    paw: 0x6b7280,
    accent: 0x2563eb,
  }, // wolf
  {
    species: "cat",
    fur: 0x111827,
    belly: 0xd1d5db,
    ear: 0x1f2937,
    paw: 0x374151,
    accent: 0x22c55e,
  }, // cat
  {
    species: "bear",
    fur: 0xc08457,
    belly: 0xfde68a,
    ear: 0x92400e,
    paw: 0x78350f,
    accent: 0x8b5cf6,
  }, // bear cub
  {
    species: "bunny",
    fur: 0xec4899,
    belly: 0xfce7f3,
    ear: 0xbe185d,
    paw: 0xdb2777,
    accent: 0xf59e0b,
  }, // bunny
  {
    species: "otter",
    fur: 0x14b8a6,
    belly: 0xccfbf1,
    ear: 0x0f766e,
    paw: 0x115e59,
    accent: 0xe11d48,
  }, // fantasy pet
];

export const PLAYER_COLORS = {
  species: "dog",
  fur: 0xd97706,
  belly: 0xfef3c7,
  ear: 0x92400e,
  paw: 0x78350f,
  accent: 0x2563eb,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}
