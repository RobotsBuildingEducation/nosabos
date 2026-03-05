import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
import { ArrowBackIcon } from "@chakra-ui/icons";
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
import playerSpriteSheetUrl from "../../sprites/sprite_sheet.png";

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

  // Three.js refs
  const gameStateRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerSpriteRef = useRef(null);
  const npcSpritesRef = useRef([]);
  const npcIndicatorsRef = useRef([]);
  const animFrameRef = useRef(null);
  const mapDataRef = useRef(null);
  const walkFrameRef = useRef(0);
  const walkTimerRef = useRef(0);
  const playerSheetFramesRef = useRef(null);

  const buildPlayerSheetFrames = useCallback((sourceImage) => {
    const rowCount = 5;
    const frameSize = Math.floor(sourceImage.height / rowCount);
    const frameCount = Math.max(1, Math.floor(sourceImage.width / frameSize));
    const directionRows = {
      down: 4,
      up: 3,
      left: 2,
      right: 1,
      idle: 0,
    };

    const createFrameTexture = (row, col) => {
      const canvas = document.createElement("canvas");
      canvas.width = frameSize;
      canvas.height = frameSize;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, frameSize, frameSize);
      ctx.drawImage(
        sourceImage,
        col * frameSize,
        row * frameSize,
        frameSize,
        frameSize,
        0,
        0,
        frameSize,
        frameSize,
      );
      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      return texture;
    };

    const animations = Object.fromEntries(
      Object.entries(directionRows).map(([dir, row]) => [
        dir,
        Array.from({ length: frameCount }, (_, col) => createFrameTexture(row, col)),
      ]),
    );

    return {
      animations,
      frameCount,
      getFrame(direction = "down", frame = 0) {
        const key = directionRows[direction] !== undefined ? direction : "down";
        const frames = animations[key] || animations.down;
        return frames[frame % frames.length] || frames[0];
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

  const handleSelectScenario = useCallback(
    async (mapId) => {
      setLoadingScenarioId(mapId);
      setScenarioId(mapId);
      setDialogue(null);
      setFeedback(null);
      setGameComplete(false);
      setAnsweredNPCs(new Set());

      const generated = await generateScenarioWithAI(mapId, targetLang, supportLang);
      setScenario(generated);
      setLoadingScenarioId(null);
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

    const fallbackPlayerTexture = createCharacterTexture(PLAYER_COLORS, "down", 0);
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
        }
      },
      undefined,
      () => {
        playerSheetFramesRef.current = null;
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
          const groundGeo = new THREE.PlaneGeometry(TILE, TILE);
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
          const geo = new THREE.PlaneGeometry(TILE, TILE);
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

            const spriteTex = createSpriteTexture("house", seed + x * 7 + y * 13);
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
    const playerGeo = new THREE.PlaneGeometry(TILE * 1.05, TILE * 1.45);
    const playerMat = new THREE.MeshBasicMaterial({
      map: playerTex,
      transparent: true,
    });
    const playerSprite = new THREE.Mesh(playerGeo, playerMat);
    playerSprite.position.set(
      scenario.playerStart.x * TILE + TILE / 2,
      (MAP_H - 1 - scenario.playerStart.y) * TILE + TILE / 2,
      5,
    );
    scene.add(playerSprite);
    playerSpriteRef.current = playerSprite;

    // ── NPC sprites ───────────────────────────────────────────────────────
    const npcSprites = [];
    const npcIndicators = [];
    scenario.npcs.forEach((npc) => {
      const preset = NPC_PRESETS[Math.floor(Math.random() * NPC_PRESETS.length)];
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
    npcSpritesRef.current = npcSprites;
    npcIndicatorsRef.current = npcIndicators;

    // ── Game loop ─────────────────────────────────────────────────────────
    let lastTime = 0;
    const MOVE_COOLDOWN = 140;

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

            // Walk animation frame
            walkTimerRef.current++;
            walkFrameRef.current = walkTimerRef.current % 6;

            const sheetFrames = playerSheetFramesRef.current;
            playerSprite.material.map = sheetFrames
              ? sheetFrames.getFrame(gs.playerDir, walkFrameRef.current)
              : createCharacterTexture(PLAYER_COLORS, gs.playerDir, walkFrameRef.current);
            playerSprite.material.needsUpdate = true;
          }
        }
      }

      // Update player position with interpolation for smoother movement
      gs.renderX += (gs.playerX - gs.renderX) * 0.35;
      gs.renderY += (gs.playerY - gs.renderY) * 0.35;
      playerSprite.position.set(
        gs.renderX * TILE + TILE / 2,
        (MAP_H - 1 - gs.renderY) * TILE + TILE / 2,
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
      if (
        canvasRef.current &&
        renderer.domElement.parentNode === canvasRef.current
      ) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, [scenario]);

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
            greeting: greetings[npcIdx % greetings.length],
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

      // Check NPC click
      const npcIdx = scenario.npcs.findIndex(
        (n) => Math.abs(n.tx - tileX) <= 1 && Math.abs(n.ty - tileY) <= 1,
      );

      if (npcIdx !== -1 && !answeredNPCs.has(npcIdx) && !dialogue) {
        const npc = scenario.npcs[npcIdx];
        const adjacentSpots = [
          { x: npc.tx, y: npc.ty - 1 },
          { x: npc.tx, y: npc.ty + 1 },
          { x: npc.tx - 1, y: npc.ty },
          { x: npc.tx + 1, y: npc.ty },
        ].filter(
          (s) =>
            !gs.isSolid(s.x, s.y) &&
            !scenario.npcs.some((n) => n.tx === s.x && n.ty === s.y),
        );

        if (adjacentSpots.length > 0) {
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
        if (question) {
          setDialogue({
            npcIdx,
            npcName: scenario.npcs[npcIdx].name,
            greeting: greetings[npcIdx % greetings.length],
            question,
          });
        }
        return;
      }

      // Move toward clicked tile
      if (!dialogue) {
        if (
          !gs.isSolid(tileX, tileY) &&
          !scenario.npcs.some((n) => n.tx === tileX && n.ty === tileY)
        ) {
          gs.playerX = Math.max(0, Math.min(gs.mapW - 1, tileX));
          gs.playerY = Math.max(0, Math.min(gs.mapH - 1, tileY));
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
  }, [scenario, dialogue, answeredNPCs, gameComplete, getQuestionForNPC, greetings]);

  // ─── Update NPC indicators ────────────────────────────────────────────
  useEffect(() => {
    npcIndicatorsRef.current.forEach((ind, i) => {
      ind.visible = !answeredNPCs.has(i);
    });
  }, [answeredNPCs]);

  // ─── Handle answer ────────────────────────────────────────────────────
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

  // ─── Reset / change scenario ──────────────────────────────────────────
  const resetGame = () => {
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
                      {SCENARIO_EMOJIS[choice.id] || Object.values(SCENARIO_EMOJIS)[idx % 3] || "🎮"}
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
        <HStack
          bg="blackAlpha.700"
          borderRadius="md"
          px={3}
          py={1}
          spacing={2}
        >
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
            color="whiteAlpha.500"
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
          boxShadow="0 0 30px rgba(0,0,0,0.8)"
        >
          <VStack align="stretch" spacing={3}>
            <HStack>
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
                    feedback === "correct" &&
                    idx === dialogue.question.correct
                      ? "green"
                      : feedback === "incorrect" &&
                          idx === dialogue.question.correct
                        ? "yellow"
                        : "whiteAlpha"
                  }
                  color="white"
                  borderColor={
                    feedback === "correct" &&
                    idx === dialogue.question.correct
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
              {SCENARIO_EMOJIS[scenarioId] || "🏆"}
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
                {ui.scenario}
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
}
