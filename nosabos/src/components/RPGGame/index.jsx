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
} from "@chakra-ui/react";
import { ArrowBackIcon, CloseIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { MAP_CHOICES, generateScenarioWithAI } from "./scenarios";
import {
  createTileTexture,
  createCharacterTexture,
  createSpriteTexture,
  createNPCIndicatorTexture,
  NPC_PRESETS,
  PLAYER_COLORS,
} from "./pixelArt";
import useSoundSettings from "../../hooks/useSoundSettings";
import playerSpriteSheetUrl from "../../sprites/sprite_sheet_6.png";
import purpleGirlSpriteSheetUrl from "../../sprites/purple_girl_sprites.png";
import hamsterSpriteSheetUrl from "../../sprites/hamster_sprites.png";
import frogSpriteSheetUrl from "../../sprites/frog_sprites.png";
import catSpriteSheetUrl from "../../sprites/cat_sprites.png";
import RandomCharacter from "../RandomCharacter";

const NPC_SPRITE_SHEETS = [
  { id: "purple-girl", url: purpleGirlSpriteSheetUrl },
  { id: "hamster", url: hamsterSpriteSheetUrl },
  { id: "frog", url: frogSpriteSheetUrl },
  { id: "cat", url: catSpriteSheetUrl },
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
  },
};

const SCENARIO_EMOJIS = {
  livingRoom: "🛋️",
  park: "🌳",
  airport: "✈️",
};

const DIALOGUE_CHARACTER_POOLS = {
  hamster: ["35", "24", "27", "28"],
  frog: ["31", "34", "38"],
  cat: ["26", "30", "39", "40"],
  "purple-girl": ["36", "41", "33"],
  fallback: ["35", "24", "27", "28", "31", "34", "38", "26", "30", "39", "40", "36", "41", "33"],
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function RPGGame() {
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Read user settings
  const getUserSettings = () => {
    try {
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
  const ui = UI_TEXT[supportLang] || UI_TEXT.en;

  // Scenario selection
  const [scenarioId, setScenarioId] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [loadingScenarioId, setLoadingScenarioId] = useState(null);

  // Game state
  const [dialogue, setDialogue] = useState(null);
  const [answeredNPCs, setAnsweredNPCs] = useState(new Set());
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [questionMapping, setQuestionMapping] = useState({});
  const isTouchDevice = useRef(false);
  const levelCompleteSoundPlayedRef = useRef(false);

  const playSound = useSoundSettings((state) => state.playSound);

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
  const npcDialogueCharactersRef = useRef(new Map());

  const chooseRandomNPCVariants = useCallback(() => {
    const shuffled = [...NPC_SPRITE_SHEETS].sort(() => Math.random() - 0.5);
    const selectedCount =
      2 + Math.floor(Math.random() * Math.min(3, shuffled.length));

    return shuffled.slice(0, selectedCount).map((sheet) => ({
      ...sheet,
      modelIndex: Math.floor(Math.random() * 4),
    }));
  }, []);

  const createNPCTextureFromSheet = useCallback((image, modelIndex) => {
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
    const clampedModelIndex = Math.max(0, Math.min(expectedCols - 1, modelIndex));
    const expectedCenterX = ((clampedModelIndex + 0.5) * width) / expectedCols;

    components.sort((a, b) => {
      const aCenterX = (a.minX + a.maxX) / 2;
      const bCenterX = (b.minX + b.maxX) / 2;
      const aDist = Math.abs(aCenterX - expectedCenterX);
      const bDist = Math.abs(bCenterX - expectedCenterX);

      // Prioritize horizontal position match for model slot, then size.
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
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    return {
      texture,
      aspect: trimmedWidth / trimmedHeight,
    };
  }, []);

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
    return scenario.questions[targetLang] || scenario.questions.es || [];
  }, [scenario, targetLang]);

  const greetings = useMemo(() => {
    if (!scenario) return [];
    return (
      scenario.greetings[supportLang] || scenario.greetings.en || ["Hello!"]
    );
  }, [scenario, supportLang]);

  const totalQuestions = scenario ? scenario.npcs.length : 0;

  const playGameSound = useCallback(
    (name) => {
      void playSound(name);
    },
    [playSound],
  );

  const getDialogueCharacterForNPC = useCallback((npcIdx) => {
    const existingCharacter = npcDialogueCharactersRef.current.get(npcIdx);
    if (existingCharacter) return existingCharacter;

    const variantId = npcVariantAssignmentsRef.current[npcIdx];
    const pool = DIALOGUE_CHARACTER_POOLS[variantId] || DIALOGUE_CHARACTER_POOLS.fallback;
    const nextCharacter = pool[Math.floor(Math.random() * pool.length)] || "35";
    npcDialogueCharactersRef.current.set(npcIdx, nextCharacter);
    return nextCharacter;
  }, []);

  const closeDialogue = useCallback(() => {
    if (!dialogue) return;
    playGameSound("click");
    setDialogue(null);
    setFeedback(null);
  }, [dialogue, playGameSound]);

  const handleSelectScenario = useCallback(
    async (mapId) => {
      setLoadingScenarioId(mapId);
      setScenarioId(mapId);
      setDialogue(null);
      setFeedback(null);
      setGameComplete(false);
      setAnsweredNPCs(new Set());

      const generated = await generateScenarioWithAI(
        mapId,
        targetLang,
        supportLang,
      );
      setScenario(generated);
      setLoadingScenarioId(null);
      levelCompleteSoundPlayedRef.current = false;
    },
    [targetLang, supportLang],
  );

  // ─── Shuffle questions on scenario select ──────────────────────────────
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
    if (!canvasRef.current || !scenario) return;

    const seed = Date.now();
    const TILE = scenario.tileSize;
    const MAP_W = scenario.mapWidth;
    const MAP_H = scenario.mapHeight;

    // Generate map
    const mapData = scenario.generate(seed);
    mapDataRef.current = mapData;

    const getTile = (x, y) => {
      if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return 2;
      return mapData[y * MAP_W + x];
    };
    const isSolid = (x, y) => {
      const t = getTile(x, y);
      const tileDef = scenario.tiles[t];
      return tileDef ? tileDef.solid : true;
    };

    // Init game state
    gameStateRef.current = {
      playerX: scenario.playerStart.x,
      playerY: scenario.playerStart.y,
      renderX: scenario.playerStart.x,
      renderY: scenario.playerStart.y,
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
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.setClearColor(scenario.ambientColor);
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
    const fallbackPlayerAspect = 1.05 / 1.45;
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      playerSpriteSheetUrl,
      (sheetTexture) => {
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
      scenario.playerStart.x * TILE + TILE / 2,
      (MAP_H - 1 - scenario.playerStart.y) * TILE + TILE / 2,
      100,
    );
    cameraRef.current = camera;

    // ── Build tiles ─────────────────────────────────────────────────────
    const tileGroup = new THREE.Group();
    const spriteGroup = new THREE.Group();
    const TILE_OVERDRAW = 0.35;

    // Track house clusters to avoid duplicate sprites
    const visitedClusters = new Set();

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tileType = getTile(x, y);
        const tileDef = scenario.tiles[tileType];
        if (!tileDef) continue;

        // Base tile (always draw ground underneath solid objects)
        const groundDef = scenario.tiles[0];
        if (tileDef.solid && groundDef) {
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
    scene.add(tileGroup);
    scene.add(spriteGroup);

    // ── Player sprite ─────────────────────────────────────────────────────
    const playerTex = fallbackPlayerTexture;
    const PLAYER_WIDTH_TILES = 1.05;
    const PLAYER_HEIGHT_TILES = 1.45;
    const PLAYER_FOOT_MARGIN_TILES = 0.04;
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
      scenario.playerStart.x * TILE + TILE / 2,
      (MAP_H - 1 - scenario.playerStart.y) * TILE +
        TILE / 2 +
        playerVerticalOffset,
      5,
    );
    scene.add(playerSprite);
    playerSpriteRef.current = playerSprite;

    const selectedNPCVariants = chooseRandomNPCVariants();

    // ── NPC sprites ───────────────────────────────────────────────────────
    const npcSprites = [];
    const npcIndicators = [];
    const npcAssignments = scenario.npcs.map(
      (_, index) => selectedNPCVariants[index % selectedNPCVariants.length],
    );
    npcVariantAssignmentsRef.current = npcAssignments.map((assignment) => assignment.id);
    npcDialogueCharactersRef.current.clear();
    scenario.npcs.forEach((npc) => {
      const preset =
        NPC_PRESETS[Math.floor(Math.random() * NPC_PRESETS.length)];
      const npcTex = createCharacterTexture(preset, "down", 0);
      const npcGeo = new THREE.PlaneGeometry(TILE * 1.05, TILE * 1.45);
      const npcMat = new THREE.MeshBasicMaterial({
        map: npcTex,
        transparent: true,
      });
      const npcMesh = new THREE.Mesh(npcGeo, npcMat);
      npcMesh.position.set(
        npc.tx * TILE + TILE / 2,
        (MAP_H - 1 - npc.ty) * TILE + TILE / 2,
        4,
      );
      scene.add(npcMesh);
      npcSprites.push(npcMesh);

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
        (MAP_H - 1 - npc.ty) * TILE + TILE * 1.3,
        6,
      );
      scene.add(indicator);
      npcIndicators.push(indicator);
    });

    selectedNPCVariants.forEach((variant) => {
      textureLoader.load(
        variant.url,
        (sheetTexture) => {
          const npcTexture = createNPCTextureFromSheet(
            sheetTexture.image,
            variant.modelIndex,
          );
          if (!npcTexture) return;

          npcSheetFramesRef.current.set(variant.id, npcTexture.texture);

          const fallbackNPCAspect = 1.05 / 1.45;
          const widthScale = Math.max(
            0.5,
            Math.min(2.5, npcTexture.aspect / fallbackNPCAspect),
          );

          npcAssignments.forEach((assignment, index) => {
            if (assignment.id !== variant.id) return;
            const npcMesh = npcSprites[index];
            if (!npcMesh?.material) return;
            npcMesh.material.map = npcTexture.texture;
            npcMesh.material.needsUpdate = true;
            npcMesh.scale.set(widthScale, 1, 1);
          });
        },
        undefined,
        () => {
          // Keep generated fallback sprites for NPCs if loading fails.
        },
      );
    });

    npcSpritesRef.current = npcSprites;
    npcIndicatorsRef.current = npcIndicators;

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

      // NPC bob
      gs.npcBobPhase += delta * 0.003;
      npcSprites.forEach((sprite, i) => {
        const npc = scenario.npcs[i];
        sprite.position.y =
          (MAP_H - 1 - npc.ty) * TILE +
          TILE / 2 +
          Math.sin(gs.npcBobPhase + i * 2.1) * 2;
      });
      npcIndicators.forEach((ind, i) => {
        const npc = scenario.npcs[i];
        ind.position.y =
          (MAP_H - 1 - npc.ty) * TILE +
          TILE * 1.3 +
          Math.sin(gs.npcBobPhase + i * 2.1) * 2;
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
          const npcBlocking = scenario.npcs.some(
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
    playGameSound,
    scenario,
  ]);

  // ─── Interact with NPCs ───────────────────────────────────────────────
  useEffect(() => {
    if (!scenario) return;

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
        const npcIdx = scenario.npcs.findIndex(
          (n) => n.tx === checkX && n.ty === checkY,
        );

        if (npcIdx !== -1 && !answeredNPCs.has(npcIdx)) {
          const question = getQuestionForNPC(npcIdx);
          if (!question) continue;
          setDialogue({
            npcIdx,
            npcName: scenario.npcs[npcIdx].name,
            npcCharacter: getDialogueCharacterForNPC(npcIdx),
            greeting: greetings[npcIdx % greetings.length],
            question,
          });
          playGameSound("rpgDialogueOpen");
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
      if (!canvasRef.current || !scenario) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const TILE = scenario.tileSize;
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

        for (const candidate of moveCandidates) {
          const stepX = gs.playerX + candidate.dx;
          const stepY = gs.playerY + candidate.dy;
          if (candidate.dx === 0 && candidate.dy === 0) continue;

          const npcBlocking = scenario.npcs.some(
            (n) => n.tx === stepX && n.ty === stepY,
          );
          if (gs.isSolid(stepX, stepY) || npcBlocking) continue;

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
          return true;
        }

        return false;
      };

      // Check NPC click
      const npcIdx = scenario.npcs.findIndex(
        (n) => Math.abs(n.tx - tileX) <= 1 && Math.abs(n.ty - tileY) <= 1,
      );

      if (npcIdx !== -1 && !answeredNPCs.has(npcIdx) && !dialogue) {
        const npc = scenario.npcs[npcIdx];
        const npcDistance =
          Math.abs(npc.tx - gs.playerX) + Math.abs(npc.ty - gs.playerY);

        if (npcDistance > 1) {
          moveOneStepToward(npc.tx, npc.ty);
          return;
        }

        const question = getQuestionForNPC(npcIdx);
        if (question) {
          setDialogue({
            npcIdx,
            npcName: scenario.npcs[npcIdx].name,
            npcCharacter: getDialogueCharacterForNPC(npcIdx),
            greeting: greetings[npcIdx % greetings.length],
            question,
          });
          playGameSound("rpgDialogueOpen");
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
    scenario,
    dialogue,
    answeredNPCs,
    gameComplete,
    getQuestionForNPC,
    getDialogueCharacterForNPC,
    greetings,
    playGameSound,
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
    npcIndicatorsRef.current.forEach((ind, i) => {
      ind.visible = !answeredNPCs.has(i);
    });
  }, [answeredNPCs]);

  // ─── Handle answer ────────────────────────────────────────────────────
  const handleAnswer = (optionIdx) => {
    if (!dialogue) return;

    playGameSound("rpgDialogueSelect");

    if (optionIdx === dialogue.question.correct) {
      playGameSound("correct");
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
      playGameSound("incorrect");
      setFeedback("incorrect");
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  useEffect(() => {
    if (!gameComplete || levelCompleteSoundPlayedRef.current) return;
    levelCompleteSoundPlayedRef.current = true;
    playGameSound("rpgLevelComplete");
    setTimeout(() => playGameSound("sparkle"), 250);
  }, [gameComplete, playGameSound]);

  // ─── Reset / change scenario ──────────────────────────────────────────
  const resetGame = () => {
    playGameSound("submitAction");
    setAnsweredNPCs(new Set());
    setDialogue(null);
    setFeedback(null);
    setGameComplete(false);
    if (scenario && gameStateRef.current) {
      gameStateRef.current.playerX = scenario.playerStart.x;
      gameStateRef.current.playerY = scenario.playerStart.y;
    }
  };

  const goToScenarioSelect = () => {
    playGameSound("submitAction");
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
    setLoadingScenarioId(null);
    setAnsweredNPCs(new Set());
    setDialogue(null);
    setFeedback(null);
    setGameComplete(false);
  };

  // ─── D-pad ────────────────────────────────────────────────────────────
  const pressDir = (dir) => {
    if (gameStateRef.current) {
      gameStateRef.current.keysDown.add(dir);
      setTimeout(() => {
        if (gameStateRef.current) gameStateRef.current.keysDown.delete(dir);
      }, 180);
    }
  };

  // ─── Scenario selection screen ─────────────────────────────────────────
  if (!scenarioId) {
    return (
      <Box
        w="100vw"
        h="100vh"
        bg="linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={6} maxW="500px" mx={4}>
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

          <Text
            color="yellow.300"
            fontSize="2xl"
            fontWeight="bold"
            textAlign="center"
          >
            {ui.chooseScenario}
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
                      {SCENARIO_EMOJIS[choice.id] ||
                        Object.values(SCENARIO_EMOJIS)[idx % 3] ||
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
        </VStack>
      </Box>
    );
  }

  if (!scenario) {
    return (
      <Box
        w="100vw"
        h="100vh"
        bg="linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Text color="white" fontSize="xl" fontWeight="bold">
            Generating scenario with AI...
          </Text>
          <Button onClick={goToScenarioSelect}>{ui.back}</Button>
        </VStack>
      </Box>
    );
  }

  // ─── Game screen ───────────────────────────────────────────────────────
  return (
    <Box
      position="relative"
      w="100vw"
      h="100vh"
      bg="#1a1a2e"
      overflow="hidden"
      userSelect="none"
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
          <Badge
            colorScheme="purple"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
          >
            {SCENARIO_EMOJIS[scenario.id] || "🎮"}{" "}
            {scenario.name[supportLang] || scenario.name.en}
          </Badge>
        </HStack>
        <HStack bg="blackAlpha.700" borderRadius="md" px={3} py={1} spacing={2}>
          <Text color="white" fontSize="sm" fontWeight="bold">
            {answeredNPCs.size}/{totalQuestions}
          </Text>
          <Progress
            value={(answeredNPCs.size / totalQuestions) * 100}
            size="sm"
            colorScheme="green"
            w="60px"
            borderRadius="full"
          />
        </HStack>
      </HStack>

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
            w="48px"
            h="48px"
            bg="blackAlpha.600"
            color="white"
            borderRadius="lg"
            _active={{ bg: "blackAlpha.800" }}
            onTouchStart={() => pressDir("ArrowUp")}
            onMouseDown={() => pressDir("ArrowUp")}
          >
            ▲
          </Button>
          <HStack spacing={0}>
            <Button
              size="sm"
              w="48px"
              h="48px"
              bg="blackAlpha.600"
              color="white"
              borderRadius="lg"
              _active={{ bg: "blackAlpha.800" }}
              onTouchStart={() => pressDir("ArrowLeft")}
              onMouseDown={() => pressDir("ArrowLeft")}
            >
              ◀
            </Button>
            <Box w="48px" h="48px" />
            <Button
              size="sm"
              w="48px"
              h="48px"
              bg="blackAlpha.600"
              color="white"
              borderRadius="lg"
              _active={{ bg: "blackAlpha.800" }}
              onTouchStart={() => pressDir("ArrowRight")}
              onMouseDown={() => pressDir("ArrowRight")}
            >
              ▶
            </Button>
          </HStack>
          <Button
            size="sm"
            w="48px"
            h="48px"
            bg="blackAlpha.600"
            color="white"
            borderRadius="lg"
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
          inset={0}
          zIndex={20}
          onClick={closeDialogue}
        >
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
            boxShadow="0 0 30px rgba(0,0,0,0.8)"
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              aria-label="Close dialogue"
              icon={<CloseIcon boxSize={2.5} />}
              size="xs"
              position="absolute"
              top={2}
              right={2}
              variant="ghost"
              color="gray.300"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={closeDialogue}
            />
            <VStack align="stretch" spacing={3}>
              <HStack align="center" spacing={2}>
                <Box pt={1}>
                  <RandomCharacter
                    width="42px"
                    notSoRandomCharacter={dialogue.npcCharacter}
                  />
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

              <Text color="gray.300" fontSize="sm" fontStyle="italic">
                &ldquo;{dialogue.greeting}&rdquo;
              </Text>

              <Text color="white" fontSize="md" fontWeight="bold">
                {dialogue.question.prompt}
              </Text>

              <VStack spacing={2}>
                {dialogue.question.options.map((opt, idx) => (
                  <Button
                    key={idx}
                    w="100%"
                    size="sm"
                    variant="outline"
                    colorScheme={
                      feedback === "correct" && idx === dialogue.question.correct
                        ? "green"
                        : feedback === "incorrect" &&
                            idx === dialogue.question.correct
                          ? "yellow"
                          : "whiteAlpha"
                    }
                    color="white"
                    borderColor={
                      feedback === "correct" && idx === dialogue.question.correct
                        ? "green.400"
                        : "whiteAlpha.300"
                    }
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

              <Button
                size="xs"
                variant="ghost"
                color="gray.500"
                onClick={closeDialogue}
              >
                {ui.back}
              </Button>
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
            <Text fontSize="4xl">{SCENARIO_EMOJIS[scenarioId] || "🏆"}</Text>
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
                {ui.scenario}
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
}
