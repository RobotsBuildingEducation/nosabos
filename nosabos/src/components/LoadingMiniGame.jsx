import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import useSoundSettings from "../hooks/useSoundSettings";

// ─── Constants ──────────────────────────────────────────────────────────────
const TILE = 16;
const SCALE = 3;
const T = TILE * SCALE;
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
const DOOR = 12;
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

// ─── Seeded PRNG (mulberry32) ───────────────────────────────────────────────
function createRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Color palette pools ────────────────────────────────────────────────────
const GRASS_PALETTES = [
  ["#3a7d44", "#2d6b35", "#4a8c54"],
  ["#2e8b57", "#228b22", "#3cb371"],
  ["#4a7c59", "#3a6b48", "#5a9c6a"],
  ["#6b8e23", "#556b2f", "#7caa2d"],
  ["#3a6e3a", "#2d5c2d", "#4a8a4a"],
];

const WATER_PALETTES = [
  { base: "#2a6faa", highlight: "#4a9fdd" },
  { base: "#1a5f8a", highlight: "#3a8fcc" },
  { base: "#2a5f9a", highlight: "#5aaedd" },
  { base: "#1e6090", highlight: "#4090c0" },
  { base: "#2a7ab8", highlight: "#5ab0e8" },
];

const PATH_PALETTES = [
  ["#c4a46c", "#b89a62", "#d4b47c"],
  ["#b09060", "#a08050", "#c0a070"],
  ["#c8a878", "#b89868", "#d8b888"],
  ["#a89070", "#988060", "#b8a080"],
  ["#d4b080", "#c4a070", "#e4c090"],
];

const LEAF_PALETTES = [
  ["#2d8c3a", "#1a7028", "#40a050"],
  ["#1a6e28", "#105a1e", "#2a8838"],
  ["#2a9040", "#1a7a30", "#3aa850"],
  ["#3a8a30", "#2a7a20", "#4aa040"],
  ["#228833", "#187028", "#30a040"],
];

const TRUNK_COLORS = ["#5a3a1a", "#4a3018", "#6a4a2a", "#3a2810", "#5a4020"];

// ─── Room name pools ────────────────────────────────────────────────────────
const OUTDOOR_NAMES = {
  en: ["Town Plaza", "Village Green", "Forest Clearing", "Riverside Park", "Sunset Meadow",
       "Moonlit Garden", "Cobblestone Square", "Whispering Grove", "Lantern Court", "Wildflower Field"],
  es: ["Plaza del Pueblo", "Jardín del Pueblo", "Claro del Bosque", "Parque del Río", "Pradera del Atardecer",
       "Jardín de Luna", "Plaza de Adoquines", "Arboleda Susurrante", "Patio de Faroles", "Campo de Flores"],
};

const INDOOR_ROOM_TYPES = [
  {
    type: "library",
    names: {
      en: ["Ancient Library", "Reading Room", "Scholar's Study", "Book Nook", "Dusty Archives"],
      es: ["Biblioteca Antigua", "Sala de Lectura", "Estudio del Erudito", "Rincón de Libros", "Archivos Polvorientos"],
    },
    wallFurniture: [BOOKSHELF, WINDOW_TILE],
    centerFurniture: [TABLE, DESK, PLANT_POT],
    hasRug: true,
  },
  {
    type: "cabin",
    names: {
      en: ["Cozy Cabin", "Warm Cottage", "Traveler's Rest", "Fireside Lodge", "Mountain Hut"],
      es: ["Cabaña Acogedora", "Casita Cálida", "Descanso del Viajero", "Refugio junto al Fuego", "Cabaña de Montaña"],
    },
    wallFurniture: [FIREPLACE, WINDOW_TILE, BED],
    centerFurniture: [TABLE, SOFA, PLANT_POT],
    hasRug: true,
  },
  {
    type: "workshop",
    names: {
      en: ["Artisan Workshop", "Craft Room", "Maker's Space", "Tinkerer's Lab", "Inventor's Den"],
      es: ["Taller Artesanal", "Sala de Manualidades", "Espacio Creativo", "Laboratorio del Inventor", "Guarida del Creador"],
    },
    wallFurniture: [BOOKSHELF, DESK, WINDOW_TILE],
    centerFurniture: [TABLE, PLANT_POT, DESK],
    hasRug: false,
  },
  {
    type: "bedroom",
    names: {
      en: ["Guest Room", "Cozy Bedroom", "Dreamer's Chamber", "Nap Room", "Rest Haven"],
      es: ["Habitación de Huéspedes", "Dormitorio Acogedor", "Cámara del Soñador", "Sala de Siesta", "Refugio de Descanso"],
    },
    wallFurniture: [BED, WINDOW_TILE, BOOKSHELF],
    centerFurniture: [DESK, PLANT_POT, TABLE],
    hasRug: true,
  },
  {
    type: "lounge",
    names: {
      en: ["Lounge", "Common Room", "Gathering Hall", "Social Corner", "Tea Room"],
      es: ["Salón", "Sala Común", "Sala de Reuniones", "Rincón Social", "Sala de Té"],
    },
    wallFurniture: [WINDOW_TILE, FIREPLACE, BOOKSHELF],
    centerFurniture: [SOFA, TABLE, PLANT_POT],
    hasRug: true,
  },
];

// ─── Message pools ──────────────────────────────────────────────────────────
const SIGN_MESSAGES = {
  en: [
    "Welcome, adventurer! Explore while your game loads.",
    "Tip: Talk to NPCs in the real game to practice vocabulary!",
    "Fun fact: Language learning is like leveling up your brain.",
    "Pro tip: Complete quests to earn XP and unlock new lessons!",
    "The bridge connects two worlds... just like languages do.",
    "Try entering the doorways to discover new rooms!",
    "Every word you learn is a step on a grand adventure.",
    "The more you explore, the more you discover!",
    "Secret: some paths lead to hidden treasures...",
    "Did you know? This map changes every time you load!",
    "Languages open doors to new worlds. Literally!",
    "Keep exploring! There's always something new to find.",
  ],
  es: [
    "¡Bienvenido, aventurero! Explora mientras carga tu juego.",
    "Consejo: ¡Habla con los NPCs en el juego real para practicar!",
    "Dato curioso: Aprender idiomas es como subir de nivel tu cerebro.",
    "Consejo pro: ¡Completa misiones para ganar XP y desbloquear lecciones!",
    "El puente conecta dos mundos... igual que los idiomas.",
    "¡Intenta entrar por las puertas para descubrir nuevas salas!",
    "Cada palabra que aprendes es un paso en una gran aventura.",
    "¡Cuanto más exploras, más descubres!",
    "Secreto: algunos caminos llevan a tesoros escondidos...",
    "¿Sabías? ¡Este mapa cambia cada vez que cargas!",
    "Los idiomas abren puertas a nuevos mundos. ¡Literalmente!",
    "¡Sigue explorando! Siempre hay algo nuevo que encontrar.",
  ],
};

const CHEST_MESSAGES = {
  en: [
    "You found a hidden treasure! ...it's knowledge!",
    "A scroll inside reads: 'Practice makes permanente'",
    "You discover a glowing rune... it says 'XP +100' (just kidding)",
    "Inside: a tiny map of all the worlds you'll explore!",
    "A golden coin! Wait... it's a vocabulary token.",
    "You found an ancient grammar scroll!",
    "The chest contains... motivation! +10 willpower.",
    "Inside you find a note: 'You're doing great!'",
  ],
  es: [
    "¡Encontraste un tesoro escondido! ...¡es conocimiento!",
    "Un pergamino dice: 'La práctica hace al maestro'",
    "Descubres una runa brillante... dice 'XP +100' (es broma)",
    "Dentro: ¡un mapa pequeño de todos los mundos que explorarás!",
    "¡Una moneda de oro! Espera... es un token de vocabulario.",
    "¡Encontraste un pergamino antiguo de gramática!",
    "El cofre contiene... ¡motivación! +10 voluntad.",
    "Dentro encuentras una nota: '¡Lo estás haciendo genial!'",
  ],
};

const LAMP_MESSAGES = {
  en: [
    "The lamp flickers warmly. It feels cozy here.",
    "A soft glow illuminates some ancient text... illegible.",
    "The light dances like tiny fireflies.",
    "You feel a warm glow of encouragement.",
  ],
  es: [
    "La lámpara parpadea cálidamente. Se siente acogedor.",
    "Un brillo suave ilumina un texto antiguo... ilegible.",
    "La luz baila como pequeñas luciérnagas.",
    "Sientes un cálido resplandor de ánimo.",
  ],
};

const PLANT_MESSAGES = {
  en: [
    "A happy little plant. It seems to like this spot.",
    "The leaves rustle gently as you pass by.",
    "This plant has been here longer than anyone remembers.",
    "A small flower is blooming. How nice!",
  ],
  es: [
    "Una plantita feliz. Parece que le gusta este lugar.",
    "Las hojas se mueven suavemente cuando pasas.",
    "Esta planta lleva aquí más tiempo del que nadie recuerda.",
    "Una pequeña flor está floreciendo. ¡Qué bonito!",
  ],
};

const TABLE_MESSAGES = {
  en: [
    "A sturdy wooden table. Someone left notes about verb conjugations.",
    "The table has scratch marks from years of study sessions.",
    "Books and papers are scattered across the surface.",
    "A half-finished puzzle sits on the table.",
  ],
  es: [
    "Una mesa resistente. Alguien dejó notas sobre conjugaciones.",
    "La mesa tiene marcas de años de sesiones de estudio.",
    "Libros y papeles están esparcidos por la superficie.",
    "Un rompecabezas a medio terminar está sobre la mesa.",
  ],
};

const ALL_MESSAGES = {
  [SIGN]: SIGN_MESSAGES,
  [CHEST]: CHEST_MESSAGES,
  [LAMP]: LAMP_MESSAGES,
  [PLANT_POT]: PLANT_MESSAGES,
  [TABLE]: TABLE_MESSAGES,
};

// ─── Procedural map generation ──────────────────────────────────────────────
const MAP_W = 18;
const MAP_H = 12;
const INDOOR_W = 18;
const INDOOR_H_MIN = 8;
const INDOOR_H_MAX = 10;

function generateOutdoor(rng) {
  const map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(GRASS));

  // Border of trees
  for (let x = 0; x < MAP_W; x++) { map[0][x] = TREE; map[MAP_H - 1][x] = TREE; }
  for (let y = 0; y < MAP_H; y++) { map[y][0] = TREE; map[y][MAP_W - 1] = TREE; }

  // Main path - vertical
  const pathX = 4 + Math.floor(rng() * (MAP_W - 8));
  for (let y = 1; y < MAP_H - 1; y++) map[y][pathX] = PATH;

  // Horizontal path
  const pathY = 3 + Math.floor(rng() * (MAP_H - 6));
  for (let x = 1; x < MAP_W - 1; x++) map[pathY][x] = PATH;

  // Second horizontal path
  const pathY2 = pathY + 2 + Math.floor(rng() * 3);
  if (pathY2 < MAP_H - 1) {
    for (let x = 1; x < MAP_W - 1; x++) map[pathY2][x] = PATH;
  }

  // Pond (random position, not on paths)
  const pondW = 2 + Math.floor(rng() * 3);
  const pondH = 2;
  const pondX = 2 + Math.floor(rng() * (MAP_W - pondW - 4));
  const pondY = 2 + Math.floor(rng() * (MAP_H - pondH - 4));
  for (let py = pondY; py < pondY + pondH; py++) {
    for (let px = pondX; px < pondX + pondW; px++) {
      if (map[py][px] === GRASS) map[py][px] = WATER;
    }
  }

  // Bridges over water on path intersections
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map[y][x] === WATER) {
        // If path is adjacent, place bridge
        if ((x > 0 && map[y][x - 1] === PATH) || (x < MAP_W - 1 && map[y][x + 1] === PATH) ||
            (y > 0 && map[y - 1][x] === PATH) || (y < MAP_H - 1 && map[y + 1][x] === PATH)) {
          map[y][x] = BRIDGE;
        }
      }
    }
  }

  // Scatter decorations on grass tiles
  const grassTiles = [];
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (map[y][x] === GRASS) grassTiles.push([x, y]);
    }
  }
  const shuffled = shuffle(rng, grassTiles);
  let idx = 0;

  // Extra trees (3-6)
  const numTrees = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < numTrees && idx < shuffled.length; i++, idx++) {
    map[shuffled[idx][1]][shuffled[idx][0]] = TREE;
  }

  // Rocks (2-4)
  const numRocks = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < numRocks && idx < shuffled.length; i++, idx++) {
    map[shuffled[idx][1]][shuffled[idx][0]] = ROCK;
  }

  // Flowers (3-6)
  const numFlowers = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < numFlowers && idx < shuffled.length; i++, idx++) {
    map[shuffled[idx][1]][shuffled[idx][0]] = FLOWER;
  }

  // Lamps (1-3)
  const numLamps = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < numLamps && idx < shuffled.length; i++, idx++) {
    map[shuffled[idx][1]][shuffled[idx][0]] = LAMP;
  }

  // Signs (2-3)
  const numSigns = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < numSigns && idx < shuffled.length; i++, idx++) {
    map[shuffled[idx][1]][shuffled[idx][0]] = SIGN;
  }

  // Chests (1-2)
  const numChests = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < numChests && idx < shuffled.length; i++, idx++) {
    map[shuffled[idx][1]][shuffled[idx][0]] = CHEST;
  }

  // Place 2 doors on grass tiles adjacent to paths
  const doorCandidates = shuffled.slice(idx).filter(([x, y]) => {
    if (map[y][x] !== GRASS) return false;
    // Must be adjacent to a path
    return (
      (x > 0 && map[y][x - 1] === PATH) || (x < MAP_W - 1 && map[y][x + 1] === PATH) ||
      (y > 0 && map[y - 1][x] === PATH) || (y < MAP_H - 1 && map[y + 1][x] === PATH)
    );
  });

  const doorPositions = doorCandidates.slice(0, 2);
  for (const [dx, dy] of doorPositions) {
    map[dy][dx] = DOOR;
  }

  // Find a walkable start position near center
  let startX = Math.floor(MAP_W / 2);
  let startY = Math.floor(MAP_H / 2);
  // If center isn't walkable, search nearby
  for (let r = 0; r < 5; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const sx = startX + dx;
        const sy = startY + dy;
        if (sx > 0 && sx < MAP_W - 1 && sy > 0 && sy < MAP_H - 1) {
          const tile = map[sy][sx];
          if (!SOLID_TILES.has(tile) && !INTERACT_TILES.has(tile) && tile !== WATER && tile !== DOOR) {
            startX = sx;
            startY = sy;
            r = 99; dy = 99; break;
          }
        }
      }
    }
  }

  return { map, startX, startY, doorPositions };
}

function generateIndoor(rng, roomType) {
  const h = INDOOR_H_MIN + Math.floor(rng() * (INDOOR_H_MAX - INDOOR_H_MIN + 1));
  const w = INDOOR_W;
  const map = Array.from({ length: h }, () => Array(w).fill(FLOOR));

  // Walls
  for (let x = 0; x < w; x++) { map[0][x] = WALL_TOP; map[h - 1][x] = WALL_TOP; }
  for (let y = 0; y < h; y++) { map[y][0] = WALL_TOP; map[y][w - 1] = WALL_TOP; }

  // Wall furniture along top wall
  const topSlots = [];
  for (let x = 1; x < w - 1; x++) topSlots.push(x);
  const shuffledTop = shuffle(rng, topSlots);
  const wallItems = shuffle(rng, roomType.wallFurniture);

  // Place windows
  const numWindows = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < numWindows && i < shuffledTop.length; i++) {
    map[1][shuffledTop[i]] = WINDOW_TILE;
  }

  // Place wall furniture in row 1 (gaps between windows)
  let wallIdx = numWindows;
  const numWallFurn = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < numWallFurn && wallIdx < shuffledTop.length; i++, wallIdx++) {
    if (map[1][shuffledTop[wallIdx]] === FLOOR) {
      map[1][shuffledTop[wallIdx]] = pick(rng, wallItems);
    }
  }

  // Rugs (random position)
  if (roomType.hasRug && rng() > 0.3) {
    const rugX = 3 + Math.floor(rng() * (w - 8));
    const rugY = 3 + Math.floor(rng() * (h - 6));
    const rugW = 2 + Math.floor(rng() * 3);
    const rugH = 2 + Math.floor(rng() * 2);
    for (let ry = rugY; ry < Math.min(rugY + rugH, h - 2); ry++) {
      for (let rx = rugX; rx < Math.min(rugX + rugW, w - 2); rx++) {
        if (map[ry][rx] === FLOOR) map[ry][rx] = RUG;
      }
    }
  }

  // Center furniture
  const interiorTiles = [];
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (map[y][x] === FLOOR || map[y][x] === RUG) interiorTiles.push([x, y]);
    }
  }
  const shuffledInterior = shuffle(rng, interiorTiles);
  const centerItems = shuffle(rng, roomType.centerFurniture);
  let iIdx = 0;

  // Tables (1-2)
  const numTables = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < numTables && iIdx < shuffledInterior.length; i++, iIdx++) {
    const [x, y] = shuffledInterior[iIdx];
    if (map[y][x] === FLOOR || map[y][x] === RUG) {
      map[y][x] = pick(rng, centerItems);
    }
  }

  // Plants (1-2)
  const numPlants = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < numPlants && iIdx < shuffledInterior.length; i++, iIdx++) {
    map[shuffledInterior[iIdx][1]][shuffledInterior[iIdx][0]] = PLANT_POT;
  }

  // Sign and chest
  if (iIdx < shuffledInterior.length) {
    map[shuffledInterior[iIdx][1]][shuffledInterior[iIdx][0]] = SIGN;
    iIdx++;
  }
  if (iIdx < shuffledInterior.length) {
    map[shuffledInterior[iIdx][1]][shuffledInterior[iIdx][0]] = CHEST;
    iIdx++;
  }

  // Lamp
  if (rng() > 0.4 && iIdx < shuffledInterior.length) {
    map[shuffledInterior[iIdx][1]][shuffledInterior[iIdx][0]] = LAMP;
    iIdx++;
  }

  // Door at bottom center
  const doorX = Math.floor(w / 2);
  const doorY = h - 2;
  map[doorY][doorX] = DOOR;
  // Make sure tiles around door are walkable
  if (doorY - 1 > 0 && SOLID_TILES.has(map[doorY - 1][doorX])) map[doorY - 1][doorX] = FLOOR;

  // Start position near door
  const startX = doorX;
  const startY = doorY - 1;

  return { map, startX, startY, doorX, doorY };
}

function generateWorld(seed) {
  const rng = createRng(seed);

  // Pick color palettes
  const palette = {
    grass: pick(rng, GRASS_PALETTES),
    water: pick(rng, WATER_PALETTES),
    path: pick(rng, PATH_PALETTES),
    leaves: pick(rng, LEAF_PALETTES),
    trunk: pick(rng, TRUNK_COLORS),
  };

  // Generate outdoor
  const outdoor = generateOutdoor(rng);
  const outdoorName = {
    en: pick(rng, OUTDOOR_NAMES.en),
    es: pick(rng, OUTDOOR_NAMES.es),
  };

  // Pick 2 random room types for the indoor rooms
  const roomTypePool = shuffle(rng, INDOOR_ROOM_TYPES);
  const roomType1 = roomTypePool[0];
  const roomType2 = roomTypePool[1];

  const indoor1 = generateIndoor(rng, roomType1);
  const indoor1Name = {
    en: pick(rng, roomType1.names.en),
    es: pick(rng, roomType1.names.es),
  };

  const indoor2 = generateIndoor(rng, roomType2);
  const indoor2Name = {
    en: pick(rng, roomType2.names.en),
    es: pick(rng, roomType2.names.es),
  };

  // Build rooms object
  const rooms = {
    outdoor: {
      name: outdoorName,
      map: outdoor.map,
      startX: outdoor.startX,
      startY: outdoor.startY,
      doors: [],
    },
    room1: {
      name: indoor1Name,
      map: indoor1.map,
      startX: indoor1.startX,
      startY: indoor1.startY,
      doors: [
        { x: indoor1.doorX, y: indoor1.doorY, target: "outdoor", tx: 0, ty: 0 },
      ],
    },
    room2: {
      name: indoor2Name,
      map: indoor2.map,
      startX: indoor2.startX,
      startY: indoor2.startY,
      doors: [
        { x: indoor2.doorX, y: indoor2.doorY, target: "outdoor", tx: 0, ty: 0 },
      ],
    },
  };

  // Wire outdoor doors to indoor rooms
  if (outdoor.doorPositions.length >= 1) {
    const [dx1, dy1] = outdoor.doorPositions[0];
    rooms.outdoor.doors.push({ x: dx1, y: dy1, target: "room1", tx: indoor1.startX, ty: indoor1.startY });
    rooms.room1.doors[0].tx = dx1;
    rooms.room1.doors[0].ty = Math.max(1, dy1 - 1);
  }
  if (outdoor.doorPositions.length >= 2) {
    const [dx2, dy2] = outdoor.doorPositions[1];
    rooms.outdoor.doors.push({ x: dx2, y: dy2, target: "room2", tx: indoor2.startX, ty: indoor2.startY });
    rooms.room2.doors[0].tx = dx2;
    rooms.room2.doors[0].ty = Math.max(1, dy2 - 1);
  }

  // Pick shuffled messages for this session
  const messages = {};
  for (const [tile, msgs] of Object.entries(ALL_MESSAGES)) {
    messages[tile] = {
      en: shuffle(rng, msgs.en),
      es: shuffle(rng, msgs.es),
    };
  }

  return { rooms, palette, messages };
}

// ─── Dog character colors ───────────────────────────────────────────────────
const DOG = {
  fur: "#d97706", furDark: "#a85d04", furLight: "#e5952a",
  belly: "#fef3c7", ear: "#92400e", paw: "#78350f",
  accent: "#2563eb", nose: "#111827", tongue: "#fb7185",
  eyeWhite: "#ffffff", eyePupil: "#1f2937", outline: "#1a1a2e",
};

// ─── Tile-position seeded variation ─────────────────────────────────────────
function seededRng(x, y) {
  let h = (x * 374761393 + y * 668265263 + 1013904223) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ─── Tile drawing (palette-aware) ───────────────────────────────────────────
function drawGrass(ctx, x, y, palette) {
  const c = palette.grass;
  ctx.fillStyle = c[Math.floor(seededRng(x, y) * c.length)];
  ctx.fillRect(x * T, y * T, T, T);
  const rng = seededRng(x + 100, y + 100);
  if (rng > 0.5) {
    ctx.fillStyle = c[2] || c[0];
    ctx.globalAlpha = 0.6;
    ctx.fillRect(x * T + 6 + seededRng(x + 30, y) * (T - 12), y * T + 8 + seededRng(x, y + 30) * (T - 16), 3, 8);
    ctx.fillRect(x * T + 20 + seededRng(x + 40, y) * 8, y * T + 4 + seededRng(x, y + 40) * 8, 3, 8);
    ctx.globalAlpha = 1;
  }
}

function drawPath(ctx, x, y, palette) {
  const c = palette.path;
  ctx.fillStyle = c[Math.floor(seededRng(x, y) * c.length)];
  ctx.fillRect(x * T, y * T, T, T);
  if (seededRng(x + 50, y + 50) > 0.4) {
    ctx.fillStyle = c[0]; ctx.globalAlpha = 0.5;
    ctx.fillRect(x * T + 12, y * T + 20, 6, 4); ctx.globalAlpha = 1;
  }
}

function drawWater(ctx, x, y, frame, palette) {
  ctx.fillStyle = palette.water.base;
  ctx.fillRect(x * T, y * T, T, T);
  const off = ((frame * 0.025 + x * 0.5) % 1) * T;
  ctx.fillStyle = palette.water.highlight;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x * T + off, y * T + 10, 12, 3);
  ctx.fillRect(x * T + ((off + 20) % T), y * T + 28, 10, 3);
  ctx.globalAlpha = 1;
}

function drawTree(ctx, x, y, palette) {
  drawGrass(ctx, x, y, palette);
  const cx = x * T + T / 2;
  const by = y * T + T - 3;
  ctx.fillStyle = palette.trunk;
  ctx.fillRect(cx - 4, by - 24, 8, 18);
  const lc = palette.leaves;
  ctx.fillStyle = lc[0]; ctx.beginPath(); ctx.arc(cx, by - 30, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = lc[1]; ctx.beginPath(); ctx.arc(cx - 6, by - 27, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = lc[2]; ctx.beginPath(); ctx.arc(cx + 7, by - 26, 9, 0, Math.PI * 2); ctx.fill();
}

function drawFlower(ctx, x, y, palette) {
  drawGrass(ctx, x, y, palette);
  const flowerColors = ["#e85d9a", "#f0c040", "#ff6b6b", "#a06ef0", "#ff9050", "#60c0f0"];
  const count = seededRng(x + 200, y + 200) > 0.5 ? 3 : 2;
  for (let i = 0; i < count; i++) {
    const fx = x * T + 6 + seededRng(x + i * 13, y) * (T - 12);
    const fy = y * T + 6 + seededRng(x, y + i * 17) * (T - 12);
    const fc = flowerColors[Math.floor(seededRng(x + i, y + i) * flowerColors.length)];
    ctx.fillStyle = palette.grass[0]; ctx.fillRect(fx, fy, 3, 9);
    ctx.fillStyle = fc; ctx.fillRect(fx - 3, fy - 3, 9, 6); ctx.fillRect(fx, fy - 6, 3, 3);
  }
}

function drawSign(ctx, x, y, palette, isIndoor) {
  if (isIndoor) drawFloor(ctx, x, y); else drawGrass(ctx, x, y, palette);
  const cx = x * T + T / 2; const by = y * T + T - 3;
  ctx.fillStyle = "#6b4e1f"; ctx.fillRect(cx - 3, by - 30, 6, 27);
  ctx.fillStyle = "#8b6914"; ctx.fillRect(cx - 15, by - 38, 30, 14);
  ctx.fillStyle = "#a07a20"; ctx.fillRect(cx - 13, by - 36, 26, 10);
  ctx.fillStyle = "#fff"; ctx.fillRect(cx - 2, by - 35, 3, 6); ctx.fillRect(cx - 2, by - 28, 3, 2);
}

function drawChest(ctx, x, y, palette, isIndoor) {
  if (isIndoor) drawFloor(ctx, x, y); else drawGrass(ctx, x, y, palette);
  const cx = x * T + T / 2; const by = y * T + T - 6;
  ctx.fillStyle = "#b8860b"; ctx.fillRect(cx - 12, by - 16, 24, 14);
  ctx.fillStyle = "#c89620"; ctx.fillRect(cx - 13, by - 22, 26, 8);
  ctx.fillStyle = "#ffd700"; ctx.fillRect(cx - 3, by - 16, 6, 4);
  ctx.fillStyle = "#00000020"; ctx.fillRect(cx - 12, by - 2, 24, 3);
}

function drawRock(ctx, x, y, palette) {
  drawGrass(ctx, x, y, palette);
  const cx = x * T + T / 2; const by = y * T + T - 6;
  ctx.fillStyle = "#7a7a7a"; ctx.beginPath(); ctx.ellipse(cx, by - 8, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#8a8a8a"; ctx.beginPath(); ctx.ellipse(cx - 3, by - 11, 8, 6, -0.3, 0, Math.PI * 2); ctx.fill();
}

function drawBridge(ctx, x, y, palette) {
  ctx.fillStyle = palette.water.base; ctx.fillRect(x * T, y * T, T, T);
  ctx.fillStyle = "#8b6d4a"; ctx.fillRect(x * T + 3, y * T, T - 6, T);
  ctx.fillStyle = "#9c7e5a";
  for (let i = 0; i < T; i += 12) ctx.fillRect(x * T + 3, y * T + i, T - 6, 1);
  ctx.fillStyle = palette.trunk;
  ctx.fillRect(x * T + 1, y * T, 3, T); ctx.fillRect(x * T + T - 4, y * T, 3, T);
}

function drawLamp(ctx, x, y, frame, palette, isIndoor) {
  if (isIndoor) drawFloor(ctx, x, y); else drawGrass(ctx, x, y, palette);
  const cx = x * T + T / 2; const by = y * T + T - 3;
  ctx.fillStyle = "#4a4a4a"; ctx.fillRect(cx - 3, by - 36, 6, 33);
  ctx.fillStyle = "#3a3a3a"; ctx.fillRect(cx - 7, by - 40, 14, 7);
  const ga = 0.25 + Math.sin(frame * 0.05) * 0.1;
  ctx.fillStyle = `rgba(255, 220, 100, ${ga})`;
  ctx.beginPath(); ctx.arc(cx, by - 36, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffe066"; ctx.fillRect(cx - 4, by - 39, 8, 4);
}

function drawDoor(ctx, x, y, frame, palette, isIndoor) {
  if (isIndoor) {
    drawFloor(ctx, x, y);
    const cx = x * T + T / 2; const by = y * T + T;
    ctx.fillStyle = "#8b5a2b"; ctx.fillRect(cx - 14, by - 6, 28, 6);
    const ga = 0.25 + Math.sin(frame * 0.06) * 0.15;
    ctx.fillStyle = `rgba(100, 200, 255, ${ga})`; ctx.fillRect(cx - 12, by - 5, 24, 4);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(frame * 0.08) * 0.3})`;
    ctx.font = `bold ${Math.round(T * 0.4)}px monospace`; ctx.textAlign = "center";
    ctx.fillText("↓", cx, by - 10);
  } else {
    drawGrass(ctx, x, y, palette);
    const cx = x * T + T / 2; const by = y * T + T - 3;
    ctx.fillStyle = "#6b4226"; ctx.fillRect(cx - 14, by - 36, 28, 36);
    ctx.fillStyle = "#8b5a2b"; ctx.fillRect(cx - 11, by - 33, 22, 33);
    ctx.fillStyle = "#7a4a20";
    ctx.fillRect(cx - 8, by - 30, 7, 10); ctx.fillRect(cx + 1, by - 30, 7, 10);
    ctx.fillRect(cx - 8, by - 16, 7, 10); ctx.fillRect(cx + 1, by - 16, 7, 10);
    ctx.fillStyle = "#daa520"; ctx.fillRect(cx + 6, by - 18, 3, 3);
    const ga = 0.3 + Math.sin(frame * 0.06) * 0.15;
    ctx.fillStyle = `rgba(255, 220, 100, ${ga})`; ctx.fillRect(cx - 11, by - 1, 22, 2);
  }
}

// ─── Indoor tiles ───────────────────────────────────────────────────────────
function drawFloor(ctx, x, y) {
  const floors = ["#b89a72", "#a88a62", "#c8aa82"];
  ctx.fillStyle = floors[Math.floor(seededRng(x, y) * floors.length)];
  ctx.fillRect(x * T, y * T, T, T);
  ctx.fillStyle = "#a08050"; ctx.globalAlpha = 0.2;
  for (let i = 0; i < T; i += 8) ctx.fillRect(x * T, y * T + i, T, 1);
  ctx.globalAlpha = 1;
}

function drawWallTop(ctx, x, y) {
  ctx.fillStyle = "#5a4a3a"; ctx.fillRect(x * T, y * T, T, T);
  ctx.fillStyle = "#4a3a2a"; ctx.fillRect(x * T, y * T + T - 3, T, 3);
  ctx.fillStyle = "#6a5a4a"; ctx.globalAlpha = 0.3;
  const off = (y % 2) * (T / 2);
  for (let bx = 0; bx < T; bx += T / 2) ctx.fillRect(x * T + bx + off, y * T, 1, T);
  ctx.globalAlpha = 1;
}

function drawBookshelf(ctx, x, y) {
  drawWallTop(ctx, x, y);
  const bx = x * T + 4; const by = y * T + 4; const bw = T - 8; const bh = T - 6;
  ctx.fillStyle = "#6b4226"; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = "#8b5a2b"; ctx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
  ctx.fillStyle = "#6b4226";
  const shelfH = Math.floor(bh / 3);
  for (let i = 1; i < 3; i++) ctx.fillRect(bx + 2, by + shelfH * i, bw - 4, 2);
  const bookColors = ["#c0392b", "#2980b9", "#27ae60", "#8e44ad", "#f39c12", "#e74c3c"];
  for (let s = 0; s < 3; s++) {
    const sy = by + shelfH * s + 4; let bkx = bx + 4;
    for (let b = 0; b < 5; b++) {
      const w = 3 + seededRng(x + b, y + s) * 4;
      ctx.fillStyle = bookColors[Math.floor(seededRng(x * 7 + b, y * 3 + s) * bookColors.length)];
      ctx.fillRect(bkx, sy, w, shelfH - 6); bkx += w + 1;
      if (bkx > bx + bw - 6) break;
    }
  }
}

function drawTable(ctx, x, y) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2; const by = y * T + T - 8;
  ctx.fillStyle = "#5a3a1a"; ctx.fillRect(cx - 14, by + 2, 4, 6); ctx.fillRect(cx + 10, by + 2, 4, 6);
  ctx.fillStyle = "#8b6d4a"; ctx.fillRect(cx - 16, by - 6, 32, 8);
  ctx.fillStyle = "#9c7e5a"; ctx.fillRect(cx - 14, by - 5, 28, 6);
}

function drawRug(ctx, x, y) {
  drawFloor(ctx, x, y);
  ctx.fillStyle = "#8b2252"; ctx.globalAlpha = 0.6; ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
  ctx.fillStyle = "#cd5c5c"; ctx.globalAlpha = 0.5; ctx.fillRect(x * T + 6, y * T + 6, T - 12, T - 12);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#daa520"; ctx.globalAlpha = 0.4;
  ctx.fillRect(x * T + 4, y * T + 4, T - 8, 2); ctx.fillRect(x * T + 4, y * T + T - 6, T - 8, 2);
  ctx.fillRect(x * T + 4, y * T + 4, 2, T - 8); ctx.fillRect(x * T + T - 6, y * T + 4, 2, T - 8);
  ctx.globalAlpha = 1;
}

function drawFireplace(ctx, x, y, frame) {
  drawWallTop(ctx, x, y);
  const cx = x * T + T / 2; const by = y * T + T - 2;
  ctx.fillStyle = "#6a6a6a"; ctx.fillRect(cx - 16, by - 34, 32, 34);
  ctx.fillStyle = "#5a5a5a"; ctx.fillRect(cx - 12, by - 30, 24, 26);
  ctx.fillStyle = "#1a1a1a"; ctx.fillRect(cx - 10, by - 24, 20, 20);
  const fl = Math.sin(frame * 0.12) * 3;
  ctx.fillStyle = "#ff4500"; ctx.beginPath(); ctx.ellipse(cx, by - 14 + fl, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ff8c00"; ctx.beginPath(); ctx.ellipse(cx - 2, by - 12 - fl, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.ellipse(cx + 1, by - 10, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
}

function drawSofa(ctx, x, y) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2; const by = y * T + T - 6;
  ctx.fillStyle = "#6a3030"; ctx.fillRect(cx - 16, by - 18, 32, 8);
  ctx.fillStyle = "#8b4040"; ctx.fillRect(cx - 16, by - 10, 32, 12);
  ctx.fillStyle = "#7a3535"; ctx.fillRect(cx, by - 10, 2, 12);
  ctx.fillStyle = "#6a3030"; ctx.fillRect(cx - 18, by - 14, 4, 16); ctx.fillRect(cx + 14, by - 14, 4, 16);
}

function drawBed(ctx, x, y) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2; const by = y * T + T - 4;
  ctx.fillStyle = "#5a3a1a"; ctx.fillRect(cx - 16, by - 28, 32, 28);
  ctx.fillStyle = "#e8e0d0"; ctx.fillRect(cx - 14, by - 26, 28, 22);
  ctx.fillStyle = "#f0f0f0"; ctx.fillRect(cx - 10, by - 24, 20, 8);
  ctx.fillStyle = "#4a7abc"; ctx.fillRect(cx - 14, by - 12, 28, 10);
}

function drawWindowTile(ctx, x, y) {
  drawWallTop(ctx, x, y);
  const cx = x * T + T / 2; const cy = y * T + T / 2;
  ctx.fillStyle = "#8b6d4a"; ctx.fillRect(cx - 12, cy - 14, 24, 22);
  ctx.fillStyle = "#87ceeb"; ctx.fillRect(cx - 10, cy - 12, 20, 18);
  ctx.fillStyle = "#8b6d4a"; ctx.fillRect(cx - 1, cy - 12, 2, 18); ctx.fillRect(cx - 10, cy - 1, 20, 2);
}

function drawDesk(ctx, x, y) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2; const by = y * T + T - 6;
  ctx.fillStyle = "#4a3020"; ctx.fillRect(cx - 14, by, 4, 6); ctx.fillRect(cx + 10, by, 4, 6);
  ctx.fillStyle = "#6b4226"; ctx.fillRect(cx - 16, by - 8, 32, 8);
  ctx.fillStyle = "#7a522e"; ctx.fillRect(cx - 14, by - 7, 28, 6);
  ctx.fillStyle = "#f0f0e0"; ctx.fillRect(cx - 8, by - 12, 10, 6);
  ctx.fillStyle = "#333"; ctx.fillRect(cx + 6, by - 10, 2, 6);
}

function drawPlantPot(ctx, x, y) {
  drawFloor(ctx, x, y);
  const cx = x * T + T / 2; const by = y * T + T - 6;
  ctx.fillStyle = "#b05030"; ctx.fillRect(cx - 8, by - 10, 16, 12);
  ctx.fillStyle = "#c06040"; ctx.fillRect(cx - 6, by - 8, 12, 8);
  ctx.fillStyle = "#b05030"; ctx.fillRect(cx - 9, by - 12, 18, 4);
  ctx.fillStyle = "#3a8a44"; ctx.beginPath(); ctx.arc(cx, by - 20, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#4a9c54";
  ctx.beginPath(); ctx.arc(cx - 4, by - 22, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 5, by - 18, 6, 0, Math.PI * 2); ctx.fill();
}

// Tile dispatch
function drawTile(ctx, x, y, tile, frame, palette, isIndoor) {
  switch (tile) {
    case GRASS: return drawGrass(ctx, x, y, palette);
    case PATH: return drawPath(ctx, x, y, palette);
    case WATER: return drawWater(ctx, x, y, frame, palette);
    case TREE: return drawTree(ctx, x, y, palette);
    case FLOWER: return drawFlower(ctx, x, y, palette);
    case SIGN: return drawSign(ctx, x, y, palette, isIndoor);
    case CHEST: return drawChest(ctx, x, y, palette, isIndoor);
    case ROCK: return drawRock(ctx, x, y, palette);
    case BRIDGE: return drawBridge(ctx, x, y, palette);
    case LAMP: return drawLamp(ctx, x, y, frame, palette, isIndoor);
    case DOOR: return drawDoor(ctx, x, y, frame, palette, isIndoor);
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
    default: return drawGrass(ctx, x, y, palette);
  }
}

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

function drawInteractHint(ctx, tileX, tileY, frame) {
  const cx = tileX * T + T / 2; const cy = tileY * T - 6;
  const bounce = Math.sin(frame * 0.08) * 4;
  ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(frame * 0.1) * 0.3;
  ctx.fillStyle = "#ffd700"; ctx.font = `bold ${Math.round(T * 0.45)}px monospace`;
  ctx.textAlign = "center"; ctx.fillText("!", cx, cy + bounce); ctx.restore();
}

function drawTransition(ctx, w, h, progress) {
  ctx.fillStyle = "#000";
  ctx.globalAlpha = progress < 0.5 ? progress * 2 : 2 - progress * 2;
  ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function LoadingMiniGame({ supportLang = "en" }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { playSound, warmupAudio } = useSoundSettings();

  // Generate world once on mount with random seed
  const world = useMemo(() => generateWorld(Date.now()), []);

  const stateRef = useRef({
    px: world.rooms.outdoor.startX,
    py: world.rooms.outdoor.startY,
    dir: "down",
    frame: 0,
    walkFrame: 0,
    lastMove: 0,
    keysDown: new Set(),
    touchStart: null,
    currentRoom: "outdoor",
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

  const totalInteractables = useMemo(() => {
    let count = 0;
    for (const room of Object.values(world.rooms)) {
      for (const row of room.map) {
        for (const tile of row) {
          if (INTERACT_TILES.has(tile)) count++;
        }
      }
    }
    return count;
  }, [world]);

  const playGameSound = useCallback(
    (name) => { void (async () => { await warmupAudio(); await playSound(name); })(); },
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
      const room = world.rooms[s.currentRoom];
      const tile = room.map[tileY]?.[tileX];
      if (!tile || !world.messages[tile]) return;

      const lang = supportLang === "es" ? "es" : "en";
      const msgs = world.messages[tile][lang];
      const key = `${s.currentRoom}:${tileX},${tileY}`;
      const idxKey = `${tile}`;
      if (!s.msgIdx[idxKey]) s.msgIdx[idxKey] = 0;
      showMessage(msgs[s.msgIdx[idxKey] % msgs.length]);
      s.msgIdx[idxKey]++;
      setObjectsFound((prev) => new Set(prev).add(key));
      playGameSound("rpgDialogueOpen");
    },
    [supportLang, showMessage, playGameSound, world],
  );

  const tryInteract = useCallback(() => {
    const s = stateRef.current;
    if (s.transitioning) return;
    const dx = { left: -1, right: 1, up: 0, down: 0 }[s.dir];
    const dy = { left: 0, right: 0, up: -1, down: 1 }[s.dir];
    const tx = s.px + dx; const ty = s.py + dy;
    const room = world.rooms[s.currentRoom];
    if (tx >= 0 && tx < room.map[0].length && ty >= 0 && ty < room.map.length && INTERACT_TILES.has(room.map[ty][tx])) {
      handleInteract(tx, ty);
    }
  }, [handleInteract, world]);

  const enterDoor = useCallback(
    (door) => {
      const s = stateRef.current;
      if (s.transitioning) return;
      s.transitioning = true; s.transitionProgress = 0; s.transitionTarget = door;
      playGameSound("rpgDialogueSelect");
    },
    [playGameSound],
  );

  const handleCanvasClick = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const s = stateRef.current;
      if (s.transitioning) return;
      const rect = canvas.getBoundingClientRect();
      const room = world.rooms[s.currentRoom];
      const mapW = room.map[0].length; const mapH = room.map.length;
      const pixelX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const pixelY = (e.clientY - rect.top) * (canvas.height / rect.height);
      const worldX = (pixelX - (s.camX || 0)) / (s.scaleVal || 1);
      const worldY = (pixelY - (s.camY || 0)) / (s.scaleVal || 1);
      const tileX = Math.floor(worldX / T); const tileY = Math.floor(worldY / T);
      if (tileX < 0 || tileX >= mapW || tileY < 0 || tileY >= mapH) return;
      const tile = room.map[tileY][tileX];
      if (INTERACT_TILES.has(tile)) {
        handleInteract(tileX, tileY);
        const diffX = tileX - s.px; const diffY = tileY - s.py;
        if (Math.abs(diffX) > Math.abs(diffY)) s.dir = diffX > 0 ? "right" : "left";
        else s.dir = diffY > 0 ? "down" : "up";
        return;
      }
      if (tile === DOOR) {
        const door = room.doors.find((d) => d.x === tileX && d.y === tileY);
        if (door) { enterDoor(door); return; }
      }
    },
    [handleInteract, enterDoor, world],
  );

  const tryMove = useCallback(
    (dir) => {
      const now = Date.now(); const s = stateRef.current;
      s.dir = dir;
      if (s.transitioning) return;
      if (now - s.lastMove < MOVE_COOLDOWN) return;
      const room = world.rooms[s.currentRoom];
      const mapW = room.map[0].length; const mapH = room.map.length;
      const dx = { left: -1, right: 1, up: 0, down: 0 }[dir];
      const dy = { left: 0, right: 0, up: -1, down: 1 }[dir];
      const nx = s.px + dx; const ny = s.py + dy;
      if (nx < 0 || nx >= mapW || ny < 0 || ny >= mapH) return;
      const targetTile = room.map[ny][nx];
      if (targetTile === DOOR) {
        const door = room.doors.find((d) => d.x === nx && d.y === ny);
        if (door) { enterDoor(door); s.lastMove = now; return; }
      }
      if (SOLID_TILES.has(targetTile) || INTERACT_TILES.has(targetTile)) return;
      s.px = nx; s.py = ny; s.lastMove = now; s.walkFrame++; s.moving = true;
      playGameSound("rpgStep");
    },
    [enterDoor, playGameSound, world],
  );

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      stateRef.current.keysDown.add(key);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) e.preventDefault();
      if (key === "e" || key === "enter" || key === " ") { e.preventDefault(); tryInteract(); }
    };
    const onKeyUp = (e) => { stateRef.current.keysDown.delete(e.key.toLowerCase()); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [tryInteract]);

  // Touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouchStart = (e) => { e.preventDefault(); stateRef.current.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTouchEnd = (e) => {
      e.preventDefault();
      if (!stateRef.current.touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - stateRef.current.touchStart.x;
      const dy = t.clientY - stateRef.current.touchStart.y;
      stateRef.current.touchStart = null;
      if (Math.sqrt(dx * dx + dy * dy) < 15) { tryInteract(); return; }
      if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? "right" : "left");
      else tryMove(dy > 0 ? "down" : "up");
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => { canvas.removeEventListener("touchstart", onTouchStart); canvas.removeEventListener("touchend", onTouchEnd); };
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

      const container = containerRef.current;
      if (!container) { animId = requestAnimationFrame(loop); return; }
      const cRect = container.getBoundingClientRect();
      const cw = Math.round(cRect.width); const ch = Math.round(cRect.height);
      if (cw === 0 || ch === 0) { animId = requestAnimationFrame(loop); return; }
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw; canvas.height = ch; ctx.imageSmoothingEnabled = false;
      }

      if (s.transitioning) {
        s.transitionProgress += 0.04;
        if (s.transitionProgress >= 0.5 && s.transitionTarget) {
          const door = s.transitionTarget;
          s.currentRoom = door.target; s.px = door.tx; s.py = door.ty;
          s.transitionTarget = null;
          const lang = supportLang === "es" ? "es" : "en";
          showRoomName(world.rooms[s.currentRoom].name[lang]);
        }
        if (s.transitionProgress >= 1) { s.transitioning = false; s.transitionProgress = 0; }
      }

      const keys = s.keysDown; s.moving = false;
      if (keys.has("arrowup") || keys.has("w")) tryMove("up");
      else if (keys.has("arrowdown") || keys.has("s")) tryMove("down");
      else if (keys.has("arrowleft") || keys.has("a")) tryMove("left");
      else if (keys.has("arrowright") || keys.has("d")) tryMove("right");

      const room = world.rooms[s.currentRoom];
      const mapW = room.map[0].length; const mapH = room.map.length;
      const mapPixelW = mapW * T; const mapPixelH = mapH * T;
      const isIndoor = s.currentRoom !== "outdoor";

      const scaleVal = Math.max(cw / mapPixelW, ch / mapPixelH);
      const playerCenterX = (s.px + 0.5) * T * scaleVal;
      const playerCenterY = (s.py + 0.5) * T * scaleVal;
      const scaledMapW = mapPixelW * scaleVal; const scaledMapH = mapPixelH * scaleVal;
      let camX = Math.min(0, Math.max(cw - scaledMapW, cw / 2 - playerCenterX));
      let camY = Math.min(0, Math.max(ch - scaledMapH, ch / 2 - playerCenterY));
      s.camX = camX; s.camY = camY; s.scaleVal = scaleVal;

      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = isIndoor ? "#3a2a1a" : "#08142b"; ctx.fillRect(0, 0, cw, ch);

      ctx.save(); ctx.translate(camX, camY); ctx.scale(scaleVal, scaleVal);
      for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) drawTile(ctx, x, y, room.map[y][x], s.frame, world.palette, isIndoor);
      }

      const fdx = { left: -1, right: 1, up: 0, down: 0 }[s.dir];
      const fdy = { left: 0, right: 0, up: -1, down: 1 }[s.dir];
      const fx = s.px + fdx; const fy = s.py + fdy;
      if (fx >= 0 && fx < mapW && fy >= 0 && fy < mapH && INTERACT_TILES.has(room.map[fy][fx])) {
        drawInteractHint(ctx, fx, fy, s.frame);
      }

      drawDogCharacter(ctx, s.px, s.py, s.dir, s.moving ? s.walkFrame : 0);
      ctx.restore();

      if (s.transitioning) drawTransition(ctx, cw, ch, s.transitionProgress);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tryMove, supportLang, showRoomName, world]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      if (roomNameTimeoutRef.current) clearTimeout(roomNameTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const lang = supportLang === "es" ? "es" : "en";
    showRoomName(world.rooms.outdoor.name[lang]);
  }, [supportLang, showRoomName, world]);

  return (
    <Box ref={containerRef} position="relative" w="100%" h="100%" bg="#08142b" overflow="hidden">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", imageRendering: "pixelated" }}
        tabIndex={0}
      />

      {roomName && (
        <Box
          position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)"
          bg="rgba(8, 20, 43, 0.88)" border="2px solid" borderColor="cyan.600"
          borderRadius="lg" px={5} py={2} pointerEvents="none"
          sx={{
            animation: "roomFadeIn 0.4s ease-out",
            "@keyframes roomFadeIn": {
              "0%": { opacity: 0, transform: "translate(-50%, -50%) scale(0.95)" },
              "100%": { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
            },
          }}
        >
          <Text fontSize="md" fontWeight="bold" color="cyan.100" fontFamily="monospace" whiteSpace="nowrap">
            {roomName}
          </Text>
        </Box>
      )}

      {message && (
        <Box
          position="absolute" bottom="12px" left="12px" right="12px"
          bg="rgba(8, 20, 43, 0.94)" border="2px solid" borderColor="cyan.400"
          borderRadius="lg" px={4} py={3} pointerEvents="none"
          sx={{
            animation: "msgSlideUp 0.3s ease-out",
            "@keyframes msgSlideUp": {
              "0%": { opacity: 0, transform: "translateY(8px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Text fontSize="sm" color="cyan.50" fontFamily="monospace">{message}</Text>
        </Box>
      )}
    </Box>
  );
}
