// Shared companion character sprites: the six directional pet drawers used by
// the game-loading mini-map AND the in-game RPG player companion. Poses cover
// down/up/left/right with stride, bob, and idle/ambient motion; the art is
// always the healthy look — there are no sickness states here by design.

const T = 48; // loader tile size the drawers were authored against

// ─── Dog character colors ───────────────────────────────────────────────────
const DOG = {
  fur: "#d97706", furDark: "#a85d04", furLight: "#e5952a",
  belly: "#fef3c7", ear: "#92400e", paw: "#78350f",
  accent: "#2563eb", nose: "#111827", tongue: "#fb7185",
  eyeWhite: "#ffffff", eyePupil: "#1f2937", outline: "#1a1a2e",
};

// ─── Alien character colors ─────────────────────────────────────────────────
const ALIEN = {
  body: "#9a7fd6", body2: "#7c5fc0", eye: "#2a1f45", leg: "#5a3fa6",
};

// ─── Dog character drawing ──────────────────────────────────────────────────
function drawDogCharacter(ctx, px, py, dir, frame) {
  const cx = px * T + T / 2;
  const cy = py * T + T / 2;
  const phase = frame % 6;
  const stride = phase === 1 || phase === 5 ? 2 : phase === 3 ? -2 : 0;
  const bob = phase === 2 || phase === 4 ? -2 : 0;
  const tailWag = phase % 2 === 0 ? -2 : 2;
  const by = cy + 6;
  const headY = by - 28 + bob;

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath(); ctx.ellipse(cx, by + 4, 12, 4, 0, 0, Math.PI * 2); ctx.fill();

  const d = (fs, rx, ry, rw, rh) => { ctx.fillStyle = fs; ctx.fillRect(rx, ry, rw, rh); };

  if (dir === "down" || dir === "idle") {
    d(DOG.furDark, cx - 2 + tailWag, by - 22 + bob, 4, 6);
    d(DOG.fur, cx - 10, by - 18 + bob, 20, 14);
    d(DOG.belly, cx - 6, by - 12 + bob, 12, 10);
    d(DOG.accent, cx - 10, by - 18 + bob, 20, 4);
    d(DOG.paw, cx - 8 + stride, by - 2, 6, 5);
    d(DOG.paw, cx + 2 - stride, by - 2, 6, 5);
    d(DOG.fur, cx - 10, headY, 20, 16);
    d(DOG.furLight, cx - 8, headY + 2, 16, 10);
    d(DOG.ear, cx - 14, headY + 2, 6, 14);
    d(DOG.ear, cx + 8, headY + 2, 6, 14);
    d(DOG.belly, cx - 6, headY + 8, 12, 8);
    d(DOG.eyeWhite, cx - 6, headY + 6, 4, 4);
    d(DOG.eyeWhite, cx + 2, headY + 6, 4, 4);
    d(DOG.eyePupil, cx - 5, headY + 7, 3, 3);
    d(DOG.eyePupil, cx + 3, headY + 7, 3, 3);
    d(DOG.nose, cx - 2, headY + 10, 4, 3);
    if (phase % 4 < 2) d(DOG.tongue, cx - 1, headY + 13, 3, 4);
  } else if (dir === "up") {
    d(DOG.furDark, cx - 10, by - 18 + bob, 20, 14);
    d(DOG.fur, cx - 8, by - 16 + bob, 16, 10);
    d(DOG.accent, cx - 10, by - 18 + bob, 20, 4);
    d(DOG.furDark, cx - 2 + tailWag, by - 24 + bob, 4, 8);
    d(DOG.furLight, cx - 1 + tailWag, by - 24 + bob, 2, 4);
    d(DOG.paw, cx - 8 + stride, by - 2, 6, 5);
    d(DOG.paw, cx + 2 - stride, by - 2, 6, 5);
    d(DOG.furDark, cx - 10, headY, 20, 16);
    d(DOG.fur, cx - 8, headY + 2, 16, 12);
    d(DOG.ear, cx - 14, headY + 2, 6, 14);
    d(DOG.ear, cx + 8, headY + 2, 6, 14);
  } else {
    if (dir === "right") {
      ctx.save(); ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0);
    }
    const offX = cx - 12;
    d(DOG.furDark, cx + 6 - tailWag, by - 22 + bob, 4, 8);
    d(DOG.furLight, cx + 7 - tailWag, by - 22 + bob, 2, 4);
    d(DOG.fur, offX, by - 18 + bob, 20, 14);
    d(DOG.belly, offX + 4, by - 12 + bob, 12, 10);
    d(DOG.accent, offX, by - 18 + bob, 20, 4);
    d(DOG.paw, offX + 2 + stride, by - 2, 6, 5);
    d(DOG.paw, offX + 12 - stride, by - 2, 6, 5);
    const hx = cx - 12;
    d(DOG.fur, hx, headY, 20, 16);
    d(DOG.ear, hx - 4, headY + 2, 6, 14);
    d(DOG.belly, hx - 2, headY + 8, 10, 8);
    d(DOG.eyeWhite, hx + 4, headY + 6, 4, 4);
    d(DOG.eyePupil, hx + 4, headY + 7, 3, 3);
    d(DOG.nose, hx - 1, headY + 10, 3, 3);
    if (phase % 4 < 2) d(DOG.tongue, hx - 1, headY + 13, 3, 3);
    if (dir === "right") ctx.restore();
  }
}

// ─── Alien character drawing ────────────────────────────────────────────────
function drawAlienCharacter(ctx, px, py, dir, frame) {
  const cx = px * T + T / 2;
  const cy = py * T + T / 2;
  const phase = frame % 6;
  const stride = phase === 1 || phase === 5 ? 1 : phase === 3 ? -1 : 0;
  const bob = phase === 2 || phase === 4 ? -1 : 0;
  const by = cy + 6;
  const top = by - 21 + bob;
  const d = (fs, rx, ry, rw, rh) => { ctx.fillStyle = fs; ctx.fillRect(rx, ry, rw, rh); };

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath(); ctx.ellipse(cx, by + 4, 12, 4, 0, 0, Math.PI * 2); ctx.fill();

  const ly = by - 1;
  d(ALIEN.leg, cx - 10 + stride, ly, 3, 4);
  d(ALIEN.leg, cx - 5, ly, 3, 4);
  d(ALIEN.leg, cx + 1, ly, 3, 4);
  d(ALIEN.leg, cx + 6 - stride, ly, 3, 4);

  d(ALIEN.body, cx - 8, top, 16, 1);
  d(ALIEN.body, cx - 10, top + 1, 20, 1);
  d(ALIEN.body, cx - 12, top + 2, 24, 1);
  d(ALIEN.body, cx - 13, top + 3, 26, 16);
  d(ALIEN.body, cx - 12, top + 19, 24, 1);
  d(ALIEN.body, cx - 10, top + 20, 20, 1);
  d(ALIEN.body, cx - 8, top + 21, 16, 1);
  d(ALIEN.body2, cx - 10, top + 20, 20, 1);
  d(ALIEN.body2, cx - 8, top + 21, 16, 1);

  const E = ALIEN.eye;
  if (dir === "up") {
    d(ALIEN.body2, cx - 9, top + 7, 18, 2);
  } else if (dir === "left" || dir === "right") {
    if (dir === "right") { ctx.save(); ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
    d(E, cx - 7, top + 8, 2, 2);
    d(E, cx - 2, top + 8, 2, 2);
    d(E, cx - 6, top + 15, 3, 1);
    if (dir === "right") ctx.restore();
  } else {
    d(E, cx - 4, top + 8, 2, 2);
    d(E, cx + 2, top + 8, 2, 2);
    d(E, cx - 2, top + 15, 1, 1);
    d(E, cx + 1, top + 15, 1, 1);
    d(E, cx - 1, top + 16, 2, 1);
  }
}

// ─── Ghost character drawing (floats, no walk cycle) ────────────────────────
const GHOST = {
  body: "#e6ecfa", body2: "#c2cde8", bodyLight: "#f3f6fe", eye: "#2f3566",
};
const GHOST_HW = [
  3, 5, 7, 8, 9, 10, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
  12, 12, 12, 12,
];

function drawGhostCharacter(ctx, px, py, dir, frame) {
  const cx = px * T + T / 2;
  const cy = py * T + T / 2;
  const bob = Math.round(Math.sin(frame * 0.2) * 1.5);
  const gy = cy - 20 + bob;
  const lean = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const d = (fs, rx, ry, rw, rh) => { ctx.fillStyle = fs; ctx.fillRect(rx, ry, rw, rh); };

  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath(); ctx.ellipse(cx, cy + 11, 9, 3, 0, 0, Math.PI * 2); ctx.fill();

  for (let i = 0; i < GHOST_HW.length; i++) {
    d(GHOST.body, cx - GHOST_HW[i], gy + i, 2 * GHOST_HW[i], 1);
  }
  const b = gy + GHOST_HW.length;
  d(GHOST.body, cx - 12, b, 7, 1); d(GHOST.body, cx - 3, b, 6, 1); d(GHOST.body, cx + 5, b, 7, 1);
  d(GHOST.body, cx - 11, b + 1, 5, 1); d(GHOST.body, cx - 2, b + 1, 4, 1); d(GHOST.body, cx + 6, b + 1, 5, 1);
  for (let i = 4; i < GHOST_HW.length; i++) {
    d(GHOST.body2, cx + GHOST_HW[i] - 1, gy + i, 1, 1);
  }
  d(GHOST.body2, cx - 11, b + 1, 5, 1); d(GHOST.body2, cx - 2, b + 1, 4, 1); d(GHOST.body2, cx + 6, b + 1, 5, 1);
  d(GHOST.bodyLight, cx - 6, gy + 2, 3, 1); d(GHOST.bodyLight, cx - 8, gy + 3, 2, 1); d(GHOST.bodyLight, cx - 9, gy + 4, 2, 1);

  const E = GHOST.eye, y = gy + 12;
  if (dir === "up") {
    d(GHOST.body2, cx - 7, gy + 11, 14, 1);
    d(GHOST.body2, cx - 5, gy + 14, 10, 1);
    d(GHOST.bodyLight, cx - 5, gy + 5, 2, 1);
    return;
  }
  if (dir === "left") {
    d(E, cx - 7, y, 1, 3);
    d(E, cx - 8, y + 1, 1, 1);
    d(E, cx - 10, y + 5, 2, 1);
    return;
  }
  if (dir === "right") {
    d(E, cx + 7, y, 1, 3);
    d(E, cx + 8, y + 1, 1, 1);
    d(E, cx + 9, y + 5, 2, 1);
    return;
  }
  d(E, cx - 8 + lean, y, 1, 3); d(E, cx - 9 + lean, y + 1, 1, 1); d(E, cx - 7 + lean, y + 1, 1, 1);
  d(E, cx + 8 + lean, y, 1, 3); d(E, cx + 9 + lean, y + 1, 1, 1); d(E, cx + 7 + lean, y + 1, 1, 1);
}

// ─── Robot character drawing (rolls on a wheel, screen-face) ────────────────
const ROBOT = {
  metal: "#9fb4c9", metalDark: "#7891ab", screen: "#222a38",
  eye: "#5fe0d8", bulb: "#f0934e", wheel: "#3a4452",
};

function drawRobotCharacter(ctx, px, py, dir, frame) {
  const cx = px * T + T / 2;
  const cy = py * T + T / 2;
  const phase = frame % 6;
  const blink = phase < 3;
  const d = (fs, rx, ry, rw, rh) => { ctx.fillStyle = fs; ctx.fillRect(rx, ry, rw, rh); };
  const M = ROBOT.metal, MD = ROBOT.metalDark, S = ROBOT.screen, E = ROBOT.eye, BU = ROBOT.bulb, WH = ROBOT.wheel;

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath(); ctx.ellipse(cx, cy + 11, 11, 3, 0, 0, Math.PI * 2); ctx.fill();

  d(M, cx - 1, cy - 19, 2, 4);
  d(BU, cx - 1, cy - 22, 2, 2); if (blink) d(BU, cx, cy - 23, 1, 1);
  d(M, cx - 9, cy - 16, 18, 1); d(M, cx - 10, cy - 15, 20, 8); d(M, cx - 9, cy - 7, 18, 1);
  d(MD, cx + 9, cy - 15, 1, 8); d(MD, cx - 10, cy - 8, 20, 1);

  if (dir === "up") {
    d(MD, cx - 6, cy - 14, 12, 6);
    d(M, cx - 5, cy - 13, 10, 1); d(M, cx - 5, cy - 11, 10, 1); d(M, cx - 5, cy - 9, 10, 1);
  } else {
    d(S, cx - 7, cy - 14, 14, 6);
    const lean = dir === "left" ? -2 : dir === "right" ? 2 : 0;
    d(E, cx - 5 + lean, cy - 12, 2, 2); d(E, cx + 3 + lean, cy - 12, 2, 2);
  }

  d(M, cx - 8, cy - 5, 16, 1); d(M, cx - 9, cy - 4, 18, 7); d(M, cx - 8, cy + 3, 16, 1);
  d(MD, cx + 8, cy - 4, 1, 7);
  d(M, cx - 11, cy - 3, 2, 4); d(M, cx + 9, cy - 3, 2, 4);
  d(E, cx - 1, cy - 2, 2, 2);
  d(WH, cx - 7, cy + 4, 14, 4); d(MD, cx - 7, cy + 7, 14, 1);
  d(M, cx - 6 + (frame % 6), cy + 5, 1, 2);
  d(M, cx - 1, cy + 5, 2, 2);
}

// ─── Slime character drawing (hops in place, screen-style face) ─────────────
const SLIME = {
  body: "#5fc92e", outline: "#39791a", hi: "#8ed848",
  eye: "#26391a", gold: "#f7c948",
};
const SLIME_HW = [
  3, 5, 7, 9, 10, 11, 12, 12, 13, 13, 14, 14, 14, 14, 13, 13, 12, 10, 7,
];

function drawSlimeCharacter(ctx, px, py, dir, frame) {
  const cx = px * T + T / 2;
  const cy = py * T + T / 2;
  const hop = Math.round(Math.abs(Math.sin(frame * 0.16)) * 2);
  const topY = cy - 9 - hop;
  const lean = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const d = (fs, rx, ry, rw, rh) => { ctx.fillStyle = fs; ctx.fillRect(rx, ry, rw, rh); };
  const O = SLIME.outline, B = SLIME.body, H = SLIME.hi, E = SLIME.eye, G = SLIME.gold;

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath(); ctx.ellipse(cx, cy + 11, 12, 3, 0, 0, Math.PI * 2); ctx.fill();

  // antenna
  if (dir === "left") {
    d(O, cx, topY - 2, 1, 2); d(O, cx - 1, topY - 3, 1, 1); d(O, cx - 2, topY - 4, 1, 1); d(O, cx - 3, topY - 4, 1, 1);
    d(B, cx - 7, topY - 6, 3, 3);
    d(O, cx - 7, topY - 7, 3, 1); d(O, cx - 7, topY - 3, 3, 1); d(O, cx - 8, topY - 6, 1, 3); d(O, cx - 4, topY - 6, 1, 3);
  } else if (dir === "up") {
    d(O, cx, topY - 2, 1, 2); d(O, cx, topY - 4, 1, 2);
    d(B, cx - 1, topY - 7, 3, 3);
    d(O, cx - 1, topY - 8, 3, 1); d(O, cx - 1, topY - 4, 3, 1); d(O, cx - 2, topY - 7, 1, 3); d(O, cx + 2, topY - 7, 1, 3);
  } else {
    d(O, cx, topY - 2, 1, 2); d(O, cx + 1, topY - 3, 1, 1); d(O, cx + 2, topY - 4, 1, 1); d(O, cx + 3, topY - 4, 1, 1);
    d(B, cx + 4, topY - 6, 3, 3);
    d(O, cx + 4, topY - 7, 3, 1); d(O, cx + 4, topY - 3, 3, 1); d(O, cx + 3, topY - 6, 1, 3); d(O, cx + 7, topY - 6, 1, 3);
  }
  // body
  for (let i = 0; i < SLIME_HW.length; i++) {
    const w = SLIME_HW[i];
    d(O, cx - w, topY + i, 2 * w, 1);
    if (i > 0 && i < SLIME_HW.length - 1) d(B, cx - (w - 1), topY + i, 2 * (w - 1), 1);
  }
  d(H, cx - 4, topY + 1, 8, 1); d(H, cx - 7, topY + 2, 4, 1); d(H, cx + 4, topY + 2, 4, 1);
  // eyes (calm, gold glint) + omega mouth, leaning toward travel
  const ey = topY + 5, lx = lean;
  if (dir === "up") {
    d(O, cx - 5, topY + 8, 10, 1);
    d(O, cx - 3, topY + 11, 6, 1);
    return;
  }
  if (dir === "left" || dir === "right") {
    const eyeX = dir === "right" ? cx + 4 : cx - 8;
    const glintX = dir === "right" ? eyeX : eyeX + 1;
    d(E, eyeX, ey, 4, 1); d(E, eyeX - 1, ey + 1, 6, 4); d(E, eyeX, ey + 5, 4, 1);
    d(G, glintX, ey + 2, 3, 1); d(G, glintX + 1, ey + 1, 1, 1);
    if (dir === "right") {
      d(E, cx + 2, topY + 12, 1, 1); d(E, cx + 3, topY + 13, 1, 1); d(E, cx + 4, topY + 12, 1, 1);
    } else {
      d(E, cx - 4, topY + 12, 1, 1); d(E, cx - 3, topY + 13, 1, 1); d(E, cx - 2, topY + 12, 1, 1);
    }
    return;
  }
  d(E, cx - 7 + lx, ey, 4, 1); d(E, cx - 8 + lx, ey + 1, 6, 4); d(E, cx - 7 + lx, ey + 5, 4, 1);
  d(G, cx - 7 + lx, ey + 2, 3, 1); d(G, cx - 6 + lx, ey + 1, 1, 1);
  d(E, cx + 4 + lx, ey, 4, 1); d(E, cx + 3 + lx, ey + 1, 6, 4); d(E, cx + 4 + lx, ey + 5, 4, 1);
  d(G, cx + 4 + lx, ey + 2, 3, 1); d(G, cx + 5 + lx, ey + 1, 1, 1);
  d(E, cx - 3, topY + 12, 1, 1); d(E, cx - 2, topY + 13, 1, 1); d(E, cx - 1, topY + 12, 1, 1);
  d(E, cx, topY + 12, 1, 1); d(E, cx + 1, topY + 13, 1, 1); d(E, cx + 2, topY + 12, 1, 1);
}

// ─── Axolotl character drawing (directional, gentle bob, eyes lean) ──────────
const AXOLOTL = {
  body: "#f9a8d4", bodyLt: "#fbcfe8", belly: "#fdf2f8",
  gill: "#fb7185", gillTip: "#f43f5e", gillSoft: "#fecdd3",
  cheek: "#f472b6", eye: "#3f1d2b", smile: "#be185d",
};
function drawAxolotlCharacter(ctx, px, py, dir, frame) {
  const cx = px * T + T / 2;
  const cy = py * T + T / 2;
  const bob = Math.round(Math.sin(frame * 0.2) * 1.5);
  const lean = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const P = AXOLOTL;
  const a = (fs, lx, ly, w, h) => { ctx.fillStyle = fs; ctx.fillRect(cx + lx - 24, cy - 28 + bob + ly, w, h); };

  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath(); ctx.ellipse(cx, cy + 11, 9, 3, 0, 0, Math.PI * 2); ctx.fill();

  if (dir === "up") {
    a(P.gill,13,10,4,3); a(P.gillTip,11,9,2,2); a(P.gillSoft,14,11,1,1);
    a(P.gill,12,14,4,3); a(P.gillTip,10,15,2,2); a(P.gillSoft,13,15,1,1);
    a(P.gill,11,18,4,3); a(P.gillTip,9,20,2,2); a(P.gillSoft,12,19,1,1);
    a(P.gill,31,10,4,3); a(P.gillTip,35,9,2,2); a(P.gillSoft,33,11,1,1);
    a(P.gill,32,14,4,3); a(P.gillTip,36,15,2,2); a(P.gillSoft,34,15,1,1);
    a(P.gill,33,18,4,3); a(P.gillTip,37,20,2,2); a(P.gillSoft,35,19,1,1);
    a(P.body,20,8,8,1); a(P.body,18,9,12,1); a(P.body,17,10,14,2); a(P.body,16,12,16,1); a(P.body,15,13,18,3); a(P.body,14,16,20,7); a(P.body,15,23,18,3); a(P.body,16,26,15,2); a(P.body,18,28,12,1);
    a(P.bodyLt,22,11,4,1); a(P.bodyLt,22,12,3,10); a(P.bodyLt,21,22,5,1);
    a(P.body,13,23,3,3); a(P.body,32,23,3,3);
    a(P.body,18,29,5,3); a(P.body,25,29,5,3); a(P.bodyLt,18,31,5,1); a(P.bodyLt,25,31,5,1);
    a(P.body,33,24,4,4); a(P.bodyLt,34,23,5,1); a(P.body,37,22,3,4); a(P.bodyLt,38,21,4,1);
    return;
  }

  if (dir === "left" || dir === "right") {
    if (dir === "right") { ctx.save(); ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
    a(P.body,31,23,6,5); a(P.bodyLt,35,22,4,1); a(P.body,37,21,3,4); a(P.bodyLt,39,20,4,1);
    a(P.gill,10,11,4,3); a(P.gillTip,8,10,2,2); a(P.gillSoft,11,12,1,1);
    a(P.gill,9,15,4,3); a(P.gillTip,7,16,2,2); a(P.gillSoft,10,16,1,1);
    a(P.gill,10,19,4,3); a(P.gillTip,8,21,2,2); a(P.gillSoft,11,20,1,1);
    a(P.body,15,10,14,1); a(P.body,13,11,18,1); a(P.body,12,12,21,2); a(P.body,10,14,25,4); a(P.body,11,18,24,6); a(P.body,13,24,20,3); a(P.body,16,27,14,1);
    a(P.bodyLt,13,12,6,1); a(P.bodyLt,12,13,5,2);
    a(P.belly,18,18,11,5); a(P.belly,20,23,8,1);
    a(P.body,14,24,4,2); a(P.body,26,26,5,3); a(P.bodyLt,26,28,5,1);
    a(P.cheek,11,18,3,2);
    a(P.eye,14,14,2,1); a(P.eye,13,15,4,1); a(P.eye,14,16,2,1); a("#ffffff",14,14,1,1);
    a(P.smile,11,20,2,1);
    if (dir === "right") ctx.restore();
    return;
  }

  a(P.gill,13,10,4,3); a(P.gillTip,11,9,2,2); a(P.gillSoft,14,11,1,1);
  a(P.gill,12,14,4,3); a(P.gillTip,10,15,2,2); a(P.gillSoft,13,15,1,1);
  a(P.gill,11,18,4,3); a(P.gillTip,9,20,2,2); a(P.gillSoft,12,19,1,1);
  a(P.gill,31,10,4,3); a(P.gillTip,35,9,2,2); a(P.gillSoft,33,11,1,1);
  a(P.gill,32,14,4,3); a(P.gillTip,36,15,2,2); a(P.gillSoft,34,15,1,1);
  a(P.gill,33,18,4,3); a(P.gillTip,37,20,2,2); a(P.gillSoft,35,19,1,1);

  a(P.body,20,8,8,1); a(P.body,18,9,12,1); a(P.body,17,10,14,2); a(P.body,16,12,16,1); a(P.body,15,13,18,3); a(P.body,14,16,20,7); a(P.body,15,23,18,3); a(P.body,16,26,15,2); a(P.body,18,28,12,1);
  a(P.bodyLt,17,11,5,1); a(P.bodyLt,16,12,5,2);
  a(P.belly,19,18,10,1); a(P.belly,18,19,12,7); a(P.belly,19,26,10,1);
  a(P.body,13,23,3,3); a(P.body,32,23,3,3);
  a(P.body,18,29,5,3); a(P.body,25,29,5,3); a(P.bodyLt,18,31,5,1); a(P.bodyLt,25,31,5,1);

  a(P.cheek,16,17,3,2); a(P.cheek,29,17,3,2);
  const eye = (lx) => {
    a(P.eye,lx+lean,13,2,1);
    a(P.eye,lx-1+lean,14,4,1);
    a(P.eye,lx+lean,15,2,1);
    a("#ffffff",lx+lean,13,1,1);
  };
  eye(18); eye(28);
  a(P.smile,21,18,1,1); a(P.smile,26,18,1,1); a(P.smile,22,19,4,1); a(P.smile,23,20,2,1);
}

// ─── RPG game adapter ────────────────────────────────────────────────────────
// Frames render into a width×height cell: one tile wide with headroom above
// (axolotl frills and dog ears overdraw the tile top) and the contact shadow
// landing near the bottom edge so the sprite grounds on its map tile. The
// 48×64 cell matches the RPG player plane's 0.75 aspect exactly.
export const RPG_COMPANION_SPRITE = {
  width: T,
  height: 64,
  offsetY: 24,
};

export function drawRpgCompanionFrame(ctx, petType, dir = "down", frame = 0) {
  const drawCharacter =
    petType === "axolotl"
      ? drawAxolotlCharacter
      : petType === "alien"
        ? drawAlienCharacter
        : petType === "ghost"
          ? drawGhostCharacter
          : petType === "robot"
            ? drawRobotCharacter
            : petType === "slime"
              ? drawSlimeCharacter
              : drawDogCharacter;
  ctx.save();
  ctx.translate(0, RPG_COMPANION_SPRITE.offsetY);
  drawCharacter(ctx, 0, 0, dir, frame);
  ctx.restore();
}

export {
  drawDogCharacter,
  drawAlienCharacter,
  drawGhostCharacter,
  drawRobotCharacter,
  drawSlimeCharacter,
  drawAxolotlCharacter,
};
