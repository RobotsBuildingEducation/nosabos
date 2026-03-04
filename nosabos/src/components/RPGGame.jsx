import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  IconButton,
  Progress,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

// ─── Pixel-art color palettes ────────────────────────────────────────────────
const PALETTE = {
  grass: [0x3e8948, 0x4aa855, 0x55c062],
  path: [0xc8a96e, 0xb89a5f, 0xd4b87a],
  water: [0x2c6fbb, 0x3a7fd5, 0x4a8fe5],
  tree: { trunk: 0x6b4226, leaves: 0x2d6b2d },
  flower: [0xff6b9d, 0xffd93d, 0xff8fab, 0xc9f0ff],
  house: { wall: 0xd4a574, roof: 0x8b3a3a, door: 0x5c3317 },
  fence: 0x8b7355,
  bridge: 0xa0845c,
};

const PLAYER_COLORS = {
  hair: 0x3b2507,
  skin: 0xf5c5a3,
  shirt: 0x2563eb,
  pants: 0x374151,
  boots: 0x5c3317,
};

const NPC_PRESETS = [
  {
    hair: 0xc0392b,
    skin: 0xf5c5a3,
    shirt: 0x8b5cf6,
    pants: 0x4a3728,
    boots: 0x3b2507,
    accessory: 0xffd700,
  },
  {
    hair: 0xf1c40f,
    skin: 0xdeb887,
    shirt: 0x16a085,
    pants: 0x2c3e50,
    boots: 0x5c3317,
    accessory: 0xff6b9d,
  },
  {
    hair: 0x1a1a2e,
    skin: 0x8d6e63,
    shirt: 0xe74c3c,
    pants: 0x212121,
    boots: 0x3e2723,
    accessory: 0x4fc3f7,
  },
];

// ─── Language question banks ─────────────────────────────────────────────────
const QUESTION_BANKS = {
  es: {
    supportLabel: "Spanish",
    questions: [
      {
        prompt: "How do you say 'Hello' in Spanish?",
        options: ["Hola", "Adiós", "Gracias", "Por favor"],
        correct: 0,
      },
      {
        prompt: "How do you say 'Thank you' in Spanish?",
        options: ["De nada", "Gracias", "Lo siento", "Perdón"],
        correct: 1,
      },
      {
        prompt: "What does 'Buenos días' mean?",
        options: ["Good night", "Good morning", "Goodbye", "Good afternoon"],
        correct: 1,
      },
      {
        prompt: "How do you say 'Water' in Spanish?",
        options: ["Fuego", "Tierra", "Agua", "Aire"],
        correct: 2,
      },
      {
        prompt: "What does '¿Cómo estás?' mean?",
        options: [
          "What is your name?",
          "How are you?",
          "Where are you from?",
          "How old are you?",
        ],
        correct: 1,
      },
    ],
  },
  en: {
    supportLabel: "English",
    questions: [
      {
        prompt: "¿Cómo se dice 'Hola' en inglés?",
        options: ["Hello", "Goodbye", "Thanks", "Please"],
        correct: 0,
      },
      {
        prompt: "¿Cómo se dice 'Gracias' en inglés?",
        options: ["Sorry", "Thank you", "Please", "Welcome"],
        correct: 1,
      },
      {
        prompt: "¿Qué significa 'Good morning'?",
        options: [
          "Buenas noches",
          "Buenas tardes",
          "Buenos días",
          "Hasta luego",
        ],
        correct: 2,
      },
      {
        prompt: "¿Cómo se dice 'Agua' en inglés?",
        options: ["Fire", "Earth", "Water", "Air"],
        correct: 2,
      },
      {
        prompt: "¿Qué significa 'How are you?'?",
        options: [
          "¿Cómo te llamas?",
          "¿Cómo estás?",
          "¿De dónde eres?",
          "¿Cuántos años tienes?",
        ],
        correct: 1,
      },
    ],
  },
  fr: {
    supportLabel: "French",
    questions: [
      {
        prompt: "How do you say 'Hello' in French?",
        options: ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"],
        correct: 0,
      },
      {
        prompt: "How do you say 'Thank you' in French?",
        options: ["De rien", "Merci", "Pardon", "Excusez-moi"],
        correct: 1,
      },
      {
        prompt: "What does 'Bonsoir' mean?",
        options: ["Good morning", "Good evening", "Goodbye", "Good night"],
        correct: 1,
      },
      {
        prompt: "How do you say 'Water' in French?",
        options: ["Feu", "Terre", "Eau", "Air"],
        correct: 2,
      },
      {
        prompt: "What does 'Comment allez-vous?' mean?",
        options: [
          "What is your name?",
          "How are you?",
          "Where are you from?",
          "How old are you?",
        ],
        correct: 1,
      },
    ],
  },
  ja: {
    supportLabel: "Japanese",
    questions: [
      {
        prompt: "How do you say 'Hello' in Japanese?",
        options: ["こんにちは", "さようなら", "ありがとう", "すみません"],
        correct: 0,
      },
      {
        prompt: "How do you say 'Thank you' in Japanese?",
        options: ["ごめんなさい", "ありがとう", "おねがいします", "どういたしまして"],
        correct: 1,
      },
      {
        prompt: "What does 'おはようございます' mean?",
        options: ["Good night", "Good morning", "Goodbye", "Good afternoon"],
        correct: 1,
      },
      {
        prompt: "How do you say 'Water' in Japanese?",
        options: ["火 (ひ)", "土 (つち)", "水 (みず)", "風 (かぜ)"],
        correct: 2,
      },
      {
        prompt: "What does 'お元気ですか?' mean?",
        options: [
          "What is your name?",
          "How are you?",
          "Where are you from?",
          "How old are you?",
        ],
        correct: 1,
      },
    ],
  },
  nl: {
    supportLabel: "Dutch",
    questions: [
      {
        prompt: "How do you say 'Hello' in Dutch?",
        options: ["Hallo", "Tot ziens", "Dank je", "Alstublieft"],
        correct: 0,
      },
      {
        prompt: "How do you say 'Thank you' in Dutch?",
        options: ["Sorry", "Dank je", "Alstublieft", "Graag gedaan"],
        correct: 1,
      },
      {
        prompt: "What does 'Goedemorgen' mean?",
        options: ["Good night", "Good morning", "Goodbye", "Good afternoon"],
        correct: 1,
      },
      {
        prompt: "How do you say 'Water' in Dutch?",
        options: ["Vuur", "Aarde", "Water", "Lucht"],
        correct: 2,
      },
      {
        prompt: "What does 'Hoe gaat het?' mean?",
        options: [
          "What is your name?",
          "How are you?",
          "Where are you from?",
          "How old are you?",
        ],
        correct: 1,
      },
    ],
  },
};

// Fallback for any unsupported targetLang
const DEFAULT_BANK = QUESTION_BANKS.es;

// ─── UI text per support language ────────────────────────────────────────────
const UI_TEXT = {
  en: {
    talkHint: "Press SPACE or tap to talk",
    correct: "Correct!",
    incorrect: "Try again!",
    completed: "Congratulations! You answered all questions correctly!",
    completedSub: "The village thanks you, traveler!",
    playAgain: "Play Again",
    back: "Back",
    progress: "Progress",
    answeredOf: "of",
    npcGreet: [
      "Hey traveler! Can you help me?",
      "Welcome! I have a question for you.",
      "Greetings! Test your knowledge!",
    ],
    moveHint: "Arrow keys or WASD to move",
    touchMove: "Tap to move, tap NPC to talk",
  },
  es: {
    talkHint: "Presiona ESPACIO o toca para hablar",
    correct: "¡Correcto!",
    incorrect: "¡Inténtalo de nuevo!",
    completed: "¡Felicidades! ¡Respondiste todas las preguntas correctamente!",
    completedSub: "¡La aldea te lo agradece, viajero!",
    playAgain: "Jugar de nuevo",
    back: "Volver",
    progress: "Progreso",
    answeredOf: "de",
    npcGreet: [
      "¡Hola viajero! ¿Puedes ayudarme?",
      "¡Bienvenido! Tengo una pregunta para ti.",
      "¡Saludos! ¡Pon a prueba tu conocimiento!",
    ],
    moveHint: "Flechas o WASD para mover",
    touchMove: "Toca para mover, toca NPC para hablar",
  },
};

// ─── Sprite drawing helpers (pure canvas pixel art) ──────────────────────────
function hexToRgb(hex) {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

function drawPixel(ctx, x, y, hex, scale = 1) {
  const [r, g, b] = hexToRgb(hex);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x * scale, y * scale, scale, scale);
}

function createCharacterTexture(colors, direction = "down") {
  const size = 16;
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Hair (top of head)
  for (let x = 5; x <= 10; x++) drawPixel(ctx, x, 1, colors.hair, scale);
  for (let x = 4; x <= 11; x++) drawPixel(ctx, x, 2, colors.hair, scale);
  for (let x = 4; x <= 11; x++) drawPixel(ctx, x, 3, colors.hair, scale);

  // Face
  for (let x = 5; x <= 10; x++) {
    drawPixel(ctx, x, 4, colors.skin, scale);
    drawPixel(ctx, x, 5, colors.skin, scale);
  }
  // Eyes
  if (direction === "down" || direction === "left" || direction === "right") {
    drawPixel(ctx, 6, 4, 0x1a1a2e, scale);
    drawPixel(ctx, 9, 4, 0x1a1a2e, scale);
    // Mouth
    drawPixel(ctx, 7, 5, 0xd4726a, scale);
    drawPixel(ctx, 8, 5, 0xd4726a, scale);
  }
  if (direction === "up") {
    // Back of head, no face details
    for (let x = 5; x <= 10; x++) drawPixel(ctx, x, 4, colors.hair, scale);
    for (let x = 5; x <= 10; x++) drawPixel(ctx, x, 5, colors.hair, scale);
  }

  // Shirt / body
  for (let y = 6; y <= 9; y++) {
    for (let x = 4; x <= 11; x++) {
      drawPixel(ctx, x, y, colors.shirt, scale);
    }
  }
  // Arms
  drawPixel(ctx, 3, 7, colors.skin, scale);
  drawPixel(ctx, 3, 8, colors.skin, scale);
  drawPixel(ctx, 12, 7, colors.skin, scale);
  drawPixel(ctx, 12, 8, colors.skin, scale);

  // Pants
  for (let y = 10; y <= 12; y++) {
    for (let x = 5; x <= 7; x++) drawPixel(ctx, x, y, colors.pants, scale);
    for (let x = 8; x <= 10; x++) drawPixel(ctx, x, y, colors.pants, scale);
  }

  // Boots
  for (let x = 5; x <= 7; x++) drawPixel(ctx, x, 13, colors.boots, scale);
  for (let x = 8; x <= 10; x++) drawPixel(ctx, x, 13, colors.boots, scale);

  // Accessory (hat band or necklace for NPCs)
  if (colors.accessory) {
    for (let x = 5; x <= 10; x++)
      drawPixel(ctx, x, 6, colors.accessory, scale);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

function createTileTexture(baseColor, variation = 0) {
  const size = 16;
  const scale = 1;
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const [r, g, b] = hexToRgb(baseColor);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const noise = ((x * 7 + y * 13 + variation * 37) % 11) - 5;
      ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r + noise))},${Math.max(0, Math.min(255, g + noise))},${Math.max(0, Math.min(255, b + noise))})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

function createTreeTexture() {
  const size = 16;
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Trunk
  for (let y = 10; y <= 15; y++) {
    drawPixel(ctx, 7, y, PALETTE.tree.trunk, scale);
    drawPixel(ctx, 8, y, PALETTE.tree.trunk, scale);
  }
  // Leaves - layered circle
  const leafColors = [0x1b5e20, 0x2e7d32, 0x388e3c, 0x43a047];
  for (let y = 1; y <= 9; y++) {
    const width = y < 3 ? 3 : y < 7 ? 5 : 3;
    const startX = 8 - Math.floor(width / 2) - (y < 7 ? 1 : 0);
    for (let x = startX; x < startX + width + (y < 7 ? 2 : 0); x++) {
      const c = leafColors[(x + y) % leafColors.length];
      drawPixel(ctx, x, y, c, scale);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

function createHouseTexture() {
  const size = 32;
  const scale = 1;
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Roof
  for (let y = 0; y < 12; y++) {
    const halfW = y + 2;
    for (let x = 16 - halfW; x <= 16 + halfW; x++) {
      if (x >= 0 && x < size) drawPixel(ctx, x, y, PALETTE.house.roof, scale);
    }
  }
  // Walls
  for (let y = 12; y < 30; y++) {
    for (let x = 4; x < 28; x++) {
      drawPixel(ctx, x, y, PALETTE.house.wall, scale);
    }
  }
  // Door
  for (let y = 20; y < 30; y++) {
    for (let x = 13; x < 19; x++) {
      drawPixel(ctx, x, y, PALETTE.house.door, scale);
    }
  }
  // Windows
  for (let y = 15; y < 19; y++) {
    for (let x = 7; x < 11; x++) drawPixel(ctx, x, y, 0x87ceeb, scale);
    for (let x = 21; x < 25; x++) drawPixel(ctx, x, y, 0x87ceeb, scale);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

function createNPCIndicatorTexture() {
  const size = 16;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);

  // Exclamation mark
  ctx.fillStyle = "#ffd700";
  ctx.fillRect(6, 1, 4, 8);
  ctx.fillRect(6, 11, 4, 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

// ─── Map layout ──────────────────────────────────────────────────────────────
// 0=grass, 1=path, 2=water, 3=tree, 4=house, 5=flower, 6=fence, 7=bridge
const MAP_WIDTH = 24;
const MAP_HEIGHT = 18;
// prettier-ignore
const MAP_DATA = [
  3,3,3,3,3,5,0,0,0,0,0,0,0,0,0,0,0,0,5,3,3,3,3,3,
  3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,
  3,0,0,4,4,0,0,0,0,1,1,1,1,1,0,0,0,0,0,4,4,0,0,3,
  3,0,0,4,4,0,0,0,0,1,0,0,0,1,0,0,0,0,0,4,4,0,0,3,
  0,0,0,0,0,0,0,5,0,1,0,0,0,1,0,5,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,
  0,5,0,0,6,6,6,0,0,1,0,0,0,1,0,0,6,6,6,0,0,5,0,0,
  0,0,0,0,6,0,0,0,0,1,0,0,0,1,0,0,0,0,6,0,0,0,0,0,
  1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,
  0,0,0,0,6,0,0,0,0,1,0,0,0,1,0,0,0,0,6,0,0,0,0,0,
  0,5,0,0,6,6,6,0,0,1,0,0,0,1,0,0,6,6,6,0,0,5,0,0,
  0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,5,0,1,0,0,0,1,0,5,0,0,0,0,0,0,0,0,
  3,0,0,4,4,0,0,0,0,1,0,0,0,1,0,0,0,0,0,4,4,0,0,3,
  3,0,0,4,4,0,0,0,0,1,1,1,1,1,0,0,0,0,0,4,4,0,0,3,
  3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,
  3,3,3,3,3,5,0,0,0,0,0,0,0,0,0,0,0,0,5,3,3,3,3,3,
];

// Collision tiles
const SOLID_TILES = new Set([2, 3, 4, 6]);

function getTile(x, y) {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return 3; // out of bounds = solid
  return MAP_DATA[y * MAP_WIDTH + x];
}

function isSolid(x, y) {
  return SOLID_TILES.has(getTile(x, y));
}

// ─── NPC positions (in tile coords) ─────────────────────────────────────────
const NPC_DEFINITIONS = [
  { tx: 5, ty: 7, name: "Elder", presetIdx: 0 },
  { tx: 18, ty: 7, name: "Scholar", presetIdx: 1 },
  { tx: 11, ty: 4, name: "Merchant", presetIdx: 2 },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function RPGGame() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Read user settings from localStorage
  const getUserSettings = () => {
    try {
      const nsec = localStorage.getItem("local_nsec");
      if (!nsec) return { targetLang: "es", supportLang: "en" };
      // Try to read from cached user data
      const stored = localStorage.getItem("appLanguage");
      return {
        targetLang: localStorage.getItem("userTargetLang") || "es",
        supportLang: stored || "en",
      };
    } catch {
      return { targetLang: "es", supportLang: "en" };
    }
  };

  const settings = getUserSettings();
  const targetLang = settings.targetLang;
  const supportLang = settings.supportLang;

  const bank = QUESTION_BANKS[targetLang] || DEFAULT_BANK;
  const ui = UI_TEXT[supportLang] || UI_TEXT.en;

  // Game state
  const [dialogue, setDialogue] = useState(null);
  const [answeredNPCs, setAnsweredNPCs] = useState(new Set());
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [questionIndex, setQuestionIndex] = useState({});
  const isTouchDevice = useRef(false);

  // Refs for game loop access
  const gameStateRef = useRef({
    playerX: 11,
    playerY: 9,
    playerDir: "down",
    keysDown: new Set(),
    moveTimer: 0,
    npcBobPhase: 0,
  });

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerSpriteRef = useRef(null);
  const npcSpritesRef = useRef([]);
  const npcIndicatorsRef = useRef([]);
  const animFrameRef = useRef(null);

  const totalQuestions = NPC_DEFINITIONS.length;

  // Assign a question index to each NPC
  const getQuestionForNPC = useCallback(
    (npcIdx) => {
      const idx =
        questionIndex[npcIdx] !== undefined
          ? questionIndex[npcIdx]
          : npcIdx % bank.questions.length;
      return bank.questions[idx];
    },
    [bank, questionIndex],
  );

  // Shuffle questions on mount
  useEffect(() => {
    const indices = bank.questions.map((_, i) => i);
    // Fisher-Yates
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const mapping = {};
    NPC_DEFINITIONS.forEach((_, idx) => {
      mapping[idx] = indices[idx % indices.length];
    });
    setQuestionIndex(mapping);
  }, [bank]);

  // ─── Three.js setup ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const TILE = 32;
    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1); // Crisp pixels
    renderer.setClearColor(0x1a1a2e);
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Orthographic camera
    const aspect = width / height;
    const viewH = MAP_HEIGHT * TILE;
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
      (MAP_WIDTH * TILE) / 2,
      (MAP_HEIGHT * TILE) / 2,
      100,
    );
    camera.lookAt(
      (MAP_WIDTH * TILE) / 2,
      (MAP_HEIGHT * TILE) / 2,
      0,
    );
    cameraRef.current = camera;

    // ── Build map tiles ───────────────────────────────────────────────────
    const tileGroup = new THREE.Group();
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = getTile(x, y);
        let color;
        switch (tile) {
          case 0:
            color = PALETTE.grass[(x + y) % 3];
            break;
          case 1:
            color = PALETTE.path[(x + y) % 3];
            break;
          case 2:
            color = PALETTE.water[(x + y) % 3];
            break;
          case 5:
            color = PALETTE.grass[0];
            break;
          case 6:
            color = PALETTE.fence;
            break;
          case 7:
            color = PALETTE.bridge;
            break;
          default:
            color = PALETTE.grass[0];
        }

        const tex = createTileTexture(color, x * 3 + y * 7);
        const geo = new THREE.PlaneGeometry(TILE, TILE);
        const mat = new THREE.MeshBasicMaterial({ map: tex });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x * TILE + TILE / 2, (MAP_HEIGHT - 1 - y) * TILE + TILE / 2, 0);
        tileGroup.add(mesh);

        // Draw flowers on flower tiles
        if (tile === 5) {
          const flowerGeo = new THREE.PlaneGeometry(TILE * 0.3, TILE * 0.3);
          const flowerMat = new THREE.MeshBasicMaterial({
            color: PALETTE.flower[(x + y) % PALETTE.flower.length],
          });
          const flower = new THREE.Mesh(flowerGeo, flowerMat);
          flower.position.set(
            x * TILE + TILE / 2,
            (MAP_HEIGHT - 1 - y) * TILE + TILE / 2,
            1,
          );
          tileGroup.add(flower);
        }

        // Draw fence posts
        if (tile === 6) {
          const fenceGeo = new THREE.PlaneGeometry(TILE * 0.8, TILE * 0.15);
          const fenceMat = new THREE.MeshBasicMaterial({ color: 0x6b4226 });
          const fenceH = new THREE.Mesh(fenceGeo, fenceMat);
          fenceH.position.set(
            x * TILE + TILE / 2,
            (MAP_HEIGHT - 1 - y) * TILE + TILE / 2,
            1,
          );
          tileGroup.add(fenceH);
          const fenceV = new THREE.Mesh(
            new THREE.PlaneGeometry(TILE * 0.1, TILE * 0.8),
            fenceMat.clone(),
          );
          fenceV.position.set(
            x * TILE + TILE / 2,
            (MAP_HEIGHT - 1 - y) * TILE + TILE / 2,
            1.1,
          );
          tileGroup.add(fenceV);
        }
      }
    }
    scene.add(tileGroup);

    // ── Trees ─────────────────────────────────────────────────────────────
    const treeTexture = createTreeTexture();
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (getTile(x, y) === 3) {
          const tGeo = new THREE.PlaneGeometry(TILE * 1.2, TILE * 1.5);
          const tMat = new THREE.MeshBasicMaterial({
            map: treeTexture.clone(),
            transparent: true,
          });
          const treeMesh = new THREE.Mesh(tGeo, tMat);
          treeMesh.position.set(
            x * TILE + TILE / 2,
            (MAP_HEIGHT - 1 - y) * TILE + TILE * 0.6,
            2,
          );
          scene.add(treeMesh);
        }
      }
    }

    // ── Houses ────────────────────────────────────────────────────────────
    const houseTexture = createHouseTexture();
    const houseTiles = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (getTile(x, y) === 4) houseTiles.push({ x, y });
      }
    }
    // Group houses (2x2 tiles) — place one sprite per cluster
    const visitedHouse = new Set();
    houseTiles.forEach(({ x, y }) => {
      const key = `${x},${y}`;
      if (visitedHouse.has(key)) return;
      visitedHouse.add(key);
      visitedHouse.add(`${x + 1},${y}`);
      visitedHouse.add(`${x},${y + 1}`);
      visitedHouse.add(`${x + 1},${y + 1}`);
      const hGeo = new THREE.PlaneGeometry(TILE * 2.2, TILE * 2.5);
      const hMat = new THREE.MeshBasicMaterial({
        map: houseTexture.clone(),
        transparent: true,
      });
      const houseMesh = new THREE.Mesh(hGeo, hMat);
      houseMesh.position.set(
        x * TILE + TILE,
        (MAP_HEIGHT - 1 - y) * TILE + TILE * 0.3,
        3,
      );
      scene.add(houseMesh);
    });

    // ── Player sprite ─────────────────────────────────────────────────────
    const playerTex = createCharacterTexture(PLAYER_COLORS, "down");
    const playerGeo = new THREE.PlaneGeometry(TILE * 0.9, TILE * 1.1);
    const playerMat = new THREE.MeshBasicMaterial({
      map: playerTex,
      transparent: true,
    });
    const playerSprite = new THREE.Mesh(playerGeo, playerMat);
    const gs = gameStateRef.current;
    playerSprite.position.set(
      gs.playerX * TILE + TILE / 2,
      (MAP_HEIGHT - 1 - gs.playerY) * TILE + TILE / 2,
      5,
    );
    scene.add(playerSprite);
    playerSpriteRef.current = playerSprite;

    // ── NPC sprites ───────────────────────────────────────────────────────
    const npcSprites = [];
    const npcIndicators = [];
    NPC_DEFINITIONS.forEach((npc, idx) => {
      const preset = NPC_PRESETS[npc.presetIdx];
      const npcTex = createCharacterTexture(preset, "down");
      const npcGeo = new THREE.PlaneGeometry(TILE * 0.9, TILE * 1.1);
      const npcMat = new THREE.MeshBasicMaterial({
        map: npcTex,
        transparent: true,
      });
      const npcMesh = new THREE.Mesh(npcGeo, npcMat);
      npcMesh.position.set(
        npc.tx * TILE + TILE / 2,
        (MAP_HEIGHT - 1 - npc.ty) * TILE + TILE / 2,
        4,
      );
      scene.add(npcMesh);
      npcSprites.push(npcMesh);

      // Indicator (!) above NPC
      const indTex = createNPCIndicatorTexture();
      const indGeo = new THREE.PlaneGeometry(TILE * 0.4, TILE * 0.5);
      const indMat = new THREE.MeshBasicMaterial({
        map: indTex,
        transparent: true,
      });
      const indicator = new THREE.Mesh(indGeo, indMat);
      indicator.position.set(
        npc.tx * TILE + TILE / 2,
        (MAP_HEIGHT - 1 - npc.ty) * TILE + TILE * 1.2,
        6,
      );
      scene.add(indicator);
      npcIndicators.push(indicator);
    });
    npcSpritesRef.current = npcSprites;
    npcIndicatorsRef.current = npcIndicators;

    // ── Game loop ─────────────────────────────────────────────────────────
    let lastTime = 0;
    const MOVE_COOLDOWN = 150; // ms between moves

    function gameLoop(time) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
      const delta = time - lastTime;
      lastTime = time;
      const gs = gameStateRef.current;

      // NPC bob animation
      gs.npcBobPhase += delta * 0.003;
      npcSprites.forEach((sprite, i) => {
        const npc = NPC_DEFINITIONS[i];
        sprite.position.y =
          (MAP_HEIGHT - 1 - npc.ty) * TILE +
          TILE / 2 +
          Math.sin(gs.npcBobPhase + i * 2) * 2;
      });
      npcIndicators.forEach((ind, i) => {
        const npc = NPC_DEFINITIONS[i];
        ind.position.y =
          (MAP_HEIGHT - 1 - npc.ty) * TILE +
          TILE * 1.2 +
          Math.sin(gs.npcBobPhase + i * 2) * 2;
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
          // Check NPC collision
          const npcBlocking = NPC_DEFINITIONS.some(
            (n) => n.tx === nx && n.ty === ny,
          );
          if (!isSolid(nx, ny) && !npcBlocking) {
            gs.playerX = nx;
            gs.playerY = ny;
            gs.moveTimer = MOVE_COOLDOWN;

            // Update sprite texture for direction
            playerSprite.material.map = createCharacterTexture(
              PLAYER_COLORS,
              gs.playerDir,
            );
            playerSprite.material.needsUpdate = true;
          }
        }
      }

      // Update player position
      playerSprite.position.set(
        gs.playerX * TILE + TILE / 2,
        (MAP_HEIGHT - 1 - gs.playerY) * TILE + TILE / 2,
        5,
      );

      // Camera follow
      const camTargetX = gs.playerX * TILE + TILE / 2;
      const camTargetY = (MAP_HEIGHT - 1 - gs.playerY) * TILE + TILE / 2;
      camera.position.x += (camTargetX - camera.position.x) * 0.08;
      camera.position.y += (camTargetY - camera.position.y) * 0.08;

      renderer.render(scene, camera);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);

    // ── Input handling ────────────────────────────────────────────────────
    const handleKeyDown = (e) => {
      gameStateRef.current.keysDown.add(e.key);
    };
    const handleKeyUp = (e) => {
      gameStateRef.current.keysDown.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Touch detection
    const handleTouchStart = () => {
      isTouchDevice.current = true;
    };
    window.addEventListener("touchstart", handleTouchStart, { once: true });

    // Resize handler
    const handleResize = () => {
      const w = canvasRef.current?.clientWidth;
      const h = canvasRef.current?.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      const newAspect = w / h;
      const newViewH = MAP_HEIGHT * TILE;
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
      if (canvasRef.current && renderer.domElement.parentNode === canvasRef.current) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ─── Space / tap to interact with NPC ──────────────────────────────────
  useEffect(() => {
    const handleInteract = () => {
      if (dialogue || gameComplete) return;
      const gs = gameStateRef.current;

      // Check adjacent tiles for NPCs
      const dirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const dir of dirs) {
        const checkX = gs.playerX + dir.dx;
        const checkY = gs.playerY + dir.dy;

        const npcIdx = NPC_DEFINITIONS.findIndex(
          (n) => n.tx === checkX && n.ty === checkY,
        );

        if (npcIdx !== -1 && !answeredNPCs.has(npcIdx)) {
          const question = getQuestionForNPC(npcIdx);
          setDialogue({
            npcIdx,
            npcName: NPC_DEFINITIONS[npcIdx].name,
            greeting:
              ui.npcGreet[npcIdx % ui.npcGreet.length],
            question,
          });
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

    // Touch/click on canvas to interact
    const handleClick = (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const TILE = 32;
      const gs = gameStateRef.current;

      // Get click position relative to canvas center
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dx = clickX - centerX;
      const dy = clickY - centerY;

      // Check if clicking near an NPC (within range)
      const camera = cameraRef.current;
      if (camera) {
        const viewW = camera.right - camera.left;
        const viewH = camera.top - camera.bottom;
        const worldX = camera.position.x + (dx / rect.width) * viewW;
        const worldY = camera.position.y - (dy / rect.height) * viewH;
        const tileX = Math.floor(worldX / TILE);
        const tileY = MAP_HEIGHT - 1 - Math.floor(worldY / TILE);

        // Check if clicked on or near an NPC
        const npcIdx = NPC_DEFINITIONS.findIndex(
          (n) => Math.abs(n.tx - tileX) <= 1 && Math.abs(n.ty - tileY) <= 1,
        );

        if (npcIdx !== -1 && !answeredNPCs.has(npcIdx)) {
          // Move player adjacent to NPC first
          const npc = NPC_DEFINITIONS[npcIdx];
          const adjacentSpots = [
            { x: npc.tx, y: npc.ty - 1 },
            { x: npc.tx, y: npc.ty + 1 },
            { x: npc.tx - 1, y: npc.ty },
            { x: npc.tx + 1, y: npc.ty },
          ].filter(
            (s) =>
              !isSolid(s.x, s.y) &&
              !NPC_DEFINITIONS.some((n) => n.tx === s.x && n.ty === s.y),
          );

          if (adjacentSpots.length > 0) {
            // Pick closest spot
            let best = adjacentSpots[0];
            let bestDist = Infinity;
            adjacentSpots.forEach((s) => {
              const d =
                Math.abs(s.x - gs.playerX) + Math.abs(s.y - gs.playerY);
              if (d < bestDist) {
                bestDist = d;
                best = s;
              }
            });
            gs.playerX = best.x;
            gs.playerY = best.y;
          }

          const question = getQuestionForNPC(npcIdx);
          setDialogue({
            npcIdx,
            npcName: NPC_DEFINITIONS[npcIdx].name,
            greeting: ui.npcGreet[npcIdx % ui.npcGreet.length],
            question,
          });
          return;
        }

        // Otherwise, move player toward clicked tile
        if (!dialogue) {
          if (
            !isSolid(tileX, tileY) &&
            !NPC_DEFINITIONS.some((n) => n.tx === tileX && n.ty === tileY)
          ) {
            gs.playerX = Math.max(0, Math.min(MAP_WIDTH - 1, tileX));
            gs.playerY = Math.max(0, Math.min(MAP_HEIGHT - 1, tileY));
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvasRef.current?.addEventListener("click", handleClick);

    const currentCanvas = canvasRef.current;
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      currentCanvas?.removeEventListener("click", handleClick);
    };
  }, [dialogue, answeredNPCs, gameComplete, getQuestionForNPC, ui]);

  // ─── Update NPC indicators when answered ───────────────────────────────
  useEffect(() => {
    npcIndicatorsRef.current.forEach((ind, i) => {
      ind.visible = !answeredNPCs.has(i);
    });
  }, [answeredNPCs]);

  // ─── Handle answer selection ───────────────────────────────────────────
  const handleAnswer = (optionIdx) => {
    if (!dialogue) return;

    if (optionIdx === dialogue.question.correct) {
      setFeedback("correct");
      const newAnswered = new Set(answeredNPCs);
      newAnswered.add(dialogue.npcIdx);
      setAnsweredNPCs(newAnswered);

      setTimeout(() => {
        setDialogue(null);
        setFeedback(null);
        if (newAnswered.size >= totalQuestions) {
          setGameComplete(true);
        }
      }, 1000);
    } else {
      setFeedback("incorrect");
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  // ─── Reset game ────────────────────────────────────────────────────────
  const resetGame = () => {
    setAnsweredNPCs(new Set());
    setDialogue(null);
    setFeedback(null);
    setGameComplete(false);
    gameStateRef.current.playerX = 11;
    gameStateRef.current.playerY = 9;

    // Re-shuffle questions
    const indices = bank.questions.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const mapping = {};
    NPC_DEFINITIONS.forEach((_, idx) => {
      mapping[idx] = indices[idx % indices.length];
    });
    setQuestionIndex(mapping);
  };

  // ─── D-pad for mobile ─────────────────────────────────────────────────
  const pressDir = (dir) => {
    gameStateRef.current.keysDown.add(dir);
    setTimeout(() => gameStateRef.current.keysDown.delete(dir), 180);
  };

  return (
    <Box
      position="relative"
      w="100vw"
      h="100vh"
      bg="#1a1a2e"
      overflow="hidden"
      userSelect="none"
    >
      {/* Three.js canvas container */}
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
        <IconButton
          icon={<ArrowBackIcon />}
          aria-label={ui.back}
          size="sm"
          variant="solid"
          colorScheme="blackAlpha"
          onClick={() => navigate("/")}
        />
        <HStack
          bg="blackAlpha.700"
          borderRadius="md"
          px={3}
          py={1}
          spacing={2}
        >
          <Text color="white" fontSize="sm" fontWeight="bold">
            {ui.progress}: {answeredNPCs.size} {ui.answeredOf} {totalQuestions}
          </Text>
          <Progress
            value={(answeredNPCs.size / totalQuestions) * 100}
            size="sm"
            colorScheme="green"
            w="80px"
            borderRadius="full"
          />
        </HStack>
      </HStack>

      {/* Movement hint */}
      {!dialogue && !gameComplete && (
        <Box
          position="absolute"
          bottom={20}
          left="50%"
          transform="translateX(-50%)"
          zIndex={10}
        >
          <Text
            color="whiteAlpha.600"
            fontSize="xs"
            textAlign="center"
            bg="blackAlpha.500"
            px={3}
            py={1}
            borderRadius="md"
          >
            {isTouchDevice.current ? ui.touchMove : ui.moveHint}
            {" · "}
            {ui.talkHint}
          </Text>
        </Box>
      )}

      {/* Mobile D-pad */}
      <Box
        position="absolute"
        bottom={6}
        left={6}
        zIndex={10}
        display={{ base: "block", md: "none" }}
      >
        <VStack spacing={0}>
          <Button
            size="sm"
            w="44px"
            h="44px"
            bg="blackAlpha.600"
            color="white"
            _active={{ bg: "blackAlpha.800" }}
            onTouchStart={() => pressDir("ArrowUp")}
            onMouseDown={() => pressDir("ArrowUp")}
          >
            ▲
          </Button>
          <HStack spacing={0}>
            <Button
              size="sm"
              w="44px"
              h="44px"
              bg="blackAlpha.600"
              color="white"
              _active={{ bg: "blackAlpha.800" }}
              onTouchStart={() => pressDir("ArrowLeft")}
              onMouseDown={() => pressDir("ArrowLeft")}
            >
              ◀
            </Button>
            <Box w="44px" h="44px" />
            <Button
              size="sm"
              w="44px"
              h="44px"
              bg="blackAlpha.600"
              color="white"
              _active={{ bg: "blackAlpha.800" }}
              onTouchStart={() => pressDir("ArrowRight")}
              onMouseDown={() => pressDir("ArrowRight")}
            >
              ▶
            </Button>
          </HStack>
          <Button
            size="sm"
            w="44px"
            h="44px"
            bg="blackAlpha.600"
            color="white"
            _active={{ bg: "blackAlpha.800" }}
            onTouchStart={() => pressDir("ArrowDown")}
            onMouseDown={() => pressDir("ArrowDown")}
          >
            ▼
          </Button>
        </VStack>
      </Box>

      {/* Dialogue box */}
      {dialogue && !gameComplete && (
        <Box
          position="absolute"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
          w={{ base: "92%", md: "500px" }}
          bg="gray.900"
          border="3px solid"
          borderColor="yellow.400"
          borderRadius="lg"
          p={4}
          zIndex={20}
          boxShadow="0 0 20px rgba(0,0,0,0.8)"
        >
          <VStack align="stretch" spacing={3}>
            {/* NPC name */}
            <HStack>
              <Badge colorScheme="purple" fontSize="sm" px={2}>
                {dialogue.npcName}
              </Badge>
              {feedback === "correct" && (
                <Badge colorScheme="green">{ui.correct}</Badge>
              )}
              {feedback === "incorrect" && (
                <Badge colorScheme="red">{ui.incorrect}</Badge>
              )}
            </HStack>

            {/* Greeting */}
            <Text color="gray.300" fontSize="sm" fontStyle="italic">
              "{dialogue.greeting}"
            </Text>

            {/* Question */}
            <Text color="white" fontSize="md" fontWeight="bold">
              {dialogue.question.prompt}
            </Text>

            {/* Options */}
            <VStack spacing={2}>
              {dialogue.question.options.map((opt, idx) => (
                <Button
                  key={idx}
                  w="100%"
                  size="sm"
                  variant="outline"
                  colorScheme={
                    feedback === "correct" &&
                    idx === dialogue.question.correct
                      ? "green"
                      : feedback === "incorrect" &&
                          idx === dialogue.question.correct
                        ? "yellow"
                        : "whiteAlpha"
                  }
                  color="white"
                  _hover={{ bg: "whiteAlpha.200" }}
                  onClick={() => handleAnswer(idx)}
                  isDisabled={feedback === "correct"}
                  justifyContent="flex-start"
                  textAlign="left"
                  whiteSpace="normal"
                  h="auto"
                  py={2}
                >
                  {String.fromCharCode(65 + idx)}. {opt}
                </Button>
              ))}
            </VStack>

            {/* Close */}
            <Button
              size="xs"
              variant="ghost"
              color="gray.500"
              onClick={() => {
                setDialogue(null);
                setFeedback(null);
              }}
            >
              {ui.back}
            </Button>
          </VStack>
        </Box>
      )}

      {/* Game complete overlay */}
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
            <Text fontSize="4xl">🏆</Text>
            <Text color="yellow.300" fontSize="xl" fontWeight="bold">
              {ui.completed}
            </Text>
            <Text color="gray.400" fontSize="sm">
              {ui.completedSub}
            </Text>
            <HStack spacing={3}>
              <Button colorScheme="yellow" onClick={resetGame}>
                {ui.playAgain}
              </Button>
              <Button
                variant="outline"
                colorScheme="whiteAlpha"
                color="white"
                onClick={() => navigate("/")}
              >
                {ui.back}
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
}
