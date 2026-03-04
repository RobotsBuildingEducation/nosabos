import { getMultiLevelLearningPath } from "../../data/skillTreeData";

const CEFR_LEVELS_FOR_GAME = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];
const MAP_IDS = ["livingRoom", "park", "airport"];

function uniqueWords(items = []) {
  return Array.from(new Set(items.filter(Boolean).map((item) => String(item).trim())));
}

function shuffle(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function extractLessonTerms(lesson) {
  const terms = [];
  const content = lesson?.content || {};

  Object.values(content).forEach((modeData) => {
    if (!modeData || typeof modeData !== "object") return;
    if (Array.isArray(modeData.focusPoints)) terms.push(...modeData.focusPoints);
    if (Array.isArray(modeData.topics)) terms.push(...modeData.topics);
    if (modeData.topic) terms.push(modeData.topic);
    if (modeData.scenario) terms.push(modeData.scenario);
    if (modeData.prompt) terms.push(modeData.prompt);
  });

  return uniqueWords(terms);
}

function buildQuestionBank(targetLang, supportLang) {
  const units = getMultiLevelLearningPath(targetLang, CEFR_LEVELS_FOR_GAME);
  const lessonRows = units.flatMap((unit) =>
    (unit.lessons || []).map((lesson) => ({ lesson, unit })),
  );

  if (lessonRows.length === 0) {
    return [
      {
        prompt: supportLang === "es" ? "Completa esta misión" : "Complete this mission",
        options: ["✅", "❌"],
        correct: 0,
      },
    ];
  }

  const allTerms = uniqueWords(lessonRows.flatMap(({ lesson }) => extractLessonTerms(lesson)));
  const bank = [];

  lessonRows.forEach(({ lesson }) => {
    const lessonTitle = lesson?.title?.[supportLang] || lesson?.title?.en || "Lesson";
    const terms = extractLessonTerms(lesson).slice(0, 3);

    terms.forEach((term) => {
      const distractors = allTerms.filter((entry) => entry !== term).slice(0, 10);
      const options = uniqueWords([term, ...distractors]).slice(0, 4);
      const correct = options.indexOf(term);
      if (options.length < 2 || correct === -1) return;

      bank.push({
        prompt:
          supportLang === "es"
            ? `¿Cuál término pertenece a la lección "${lessonTitle}"?`
            : `Which term belongs to the lesson "${lessonTitle}"?`,
        options,
        correct,
      });
    });
  });

  return bank.length ? bank : [{ prompt: "Complete this mission", options: ["✅", "❌"], correct: 0 }];
}

function getScenarioQuestions(mapId, targetLang, supportLang) {
  const bank = buildQuestionBank(targetLang, supportLang);
  const seed = mapId.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const rng = mulberry32(seed + targetLang.length + supportLang.length);
  return shuffle(rng, bank).slice(0, 18);
}

function generateLivingRoom(seed, W, H) {
  const rng = mulberry32(seed);
  const map = new Array(W * H).fill(0);
  const set = (x, y, v) => {
    if (x >= 0 && x < W && y >= 0 && y < H) map[y * W + x] = v;
  };

  for (let x = 0; x < W; x++) {
    set(x, 0, 2);
    set(x, H - 1, 2);
  }
  for (let y = 0; y < H; y++) {
    set(0, y, 2);
    set(W - 1, y, 2);
  }

  const rugW = 5 + Math.floor(rng() * 4);
  const rugH = 3 + Math.floor(rng() * 2);
  const rugX = Math.floor((W - rugW) / 2);
  const rugY = Math.floor((H - rugH) / 2);
  for (let y = rugY; y < rugY + rugH; y++) {
    for (let x = rugX; x < rugX + rugW; x++) set(x, y, 1);
  }

  for (let x = 2; x < W - 2; x++) set(x, 2, 3);
  set(2 + Math.floor(rng() * 4), H - 3, 6);
  set(W - 3 - Math.floor(rng() * 4), H - 3, 4);

  return map;
}

function generatePark(seed, W, H) {
  const rng = mulberry32(seed);
  const map = new Array(W * H).fill(0);
  const set = (x, y, v) => {
    if (x >= 0 && x < W && y >= 0 && y < H) map[y * W + x] = v;
  };

  for (let x = 0; x < W; x++) {
    set(x, 0, 3);
    set(x, H - 1, 3);
  }
  for (let y = 0; y < H; y++) {
    set(0, y, 3);
    set(W - 1, y, 3);
  }

  let pathY = Math.floor(H / 2);
  for (let x = 1; x < W - 1; x++) {
    if (rng() > 0.7) pathY += rng() > 0.5 ? 1 : -1;
    pathY = Math.max(2, Math.min(H - 3, pathY));
    set(x, pathY, 1);
    if (rng() > 0.5) set(x, pathY + 1, 1);
  }

  for (let i = 0; i < 22; i++) {
    const tx = 2 + Math.floor(rng() * (W - 4));
    const ty = 2 + Math.floor(rng() * (H - 4));
    if (map[ty * W + tx] === 0) set(tx, ty, rng() > 0.75 ? 4 : 3);
  }

  set(Math.floor(W / 2), Math.floor(H / 2), 6);
  return map;
}

function generateAirport(seed, W, H) {
  const rng = mulberry32(seed);
  const map = new Array(W * H).fill(0);
  const set = (x, y, v) => {
    if (x >= 0 && x < W && y >= 0 && y < H) map[y * W + x] = v;
  };

  for (let x = 0; x < W; x++) {
    set(x, 0, 2);
    set(x, H - 1, 2);
  }
  for (let y = 0; y < H; y++) {
    set(0, y, 2);
    set(W - 1, y, 2);
  }

  const laneCount = 3;
  for (let lane = 0; lane < laneCount; lane++) {
    const x = 4 + lane * 4;
    for (let y = 2; y < H - 2; y++) {
      set(x, y, 1);
      if (rng() > 0.8) set(x + 1, y, 3);
    }
  }

  for (let x = W - 6; x < W - 1; x++) {
    set(x, 3, 4);
    if (x % 2 === 0) set(x, 4, 5);
  }

  for (let i = 0; i < 10; i++) {
    const ox = 2 + Math.floor(rng() * (W - 4));
    const oy = 2 + Math.floor(rng() * (H - 4));
    if (map[oy * W + ox] === 0 && rng() > 0.7) set(ox, oy, 6);
  }

  return map;
}

function buildScenario(mapId, targetLang, supportLang) {
  const questions = getScenarioQuestions(mapId, targetLang, supportLang);

  if (mapId === "livingRoom") {
    return {
      id: "livingRoom",
      name: { en: "Living Room", es: "Sala" },
      tileSize: 32,
      mapWidth: 18,
      mapHeight: 14,
      playerStart: { x: 9, y: 10 },
      ambientColor: 0xf4e9d8,
      tiles: {
        0: { name: "floor", solid: false, colors: [[0xd9c7a8, 0xcfbd9f]], detail: "tile_floor" },
        1: { name: "rug", solid: false, colors: [[0xb85c3a, 0xa85230]], detail: "rug" },
        2: { name: "wall", solid: true, colors: [[0xf1e6cf, 0xe7dcc5]], detail: "wall" },
        3: { name: "counter", solid: true, colors: [[0x8b7355]], sprite: "counter" },
        4: { name: "stove", solid: true, colors: [[0x4a4a4a]], sprite: "stove" },
        5: { name: "mat", solid: false, colors: [[0x6b8e5a]], detail: "mat" },
        6: { name: "fridge", solid: true, colors: [[0xd0d0d0]], sprite: "fridge" },
      },
      generate(seed) {
        return generateLivingRoom(seed, this.mapWidth, this.mapHeight);
      },
      npcs: [
        { tx: 4, ty: 8, name: "Housemate Mira", presetIdx: 0 },
        { tx: 13, ty: 8, name: "Guest Theo", presetIdx: 1 },
        { tx: 9, ty: 4, name: "Tutor Sol", presetIdx: 2 },
      ],
      questions: { [targetLang]: questions, en: questions, es: questions },
      greetings: {
        en: ["Welcome home!", "Quick check before tea?", "Practice time in the living room!"],
        es: ["¡Bienvenido a casa!", "¿Un repaso rápido?", "¡Hora de practicar en la sala!"],
      },
    };
  }

  if (mapId === "park") {
    return {
      id: "park",
      name: { en: "Park", es: "Parque" },
      tileSize: 32,
      mapWidth: 24,
      mapHeight: 16,
      playerStart: { x: 12, y: 8 },
      ambientColor: 0x98d66b,
      tiles: {
        0: { name: "grass", solid: false, colors: [[0x5a9e3e, 0x4e8b36]], detail: "grass" },
        1: { name: "path", solid: false, colors: [[0xc8a96e, 0xbfa063]], detail: "dirt" },
        2: { name: "wall", solid: true, colors: [[0x8aa08f]], detail: "wall" },
        3: { name: "tree", solid: true, colors: [[0x5a9e3e]], sprite: "tree" },
        4: { name: "bench", solid: true, colors: [[0x8b7355]], sprite: "bench" },
        5: { name: "flowers", solid: false, colors: [[0x5a9e3e]], detail: "flower" },
        6: { name: "fountain", solid: true, colors: [[0x8ac5ff]], sprite: "fountain" },
      },
      generate(seed) {
        return generatePark(seed, this.mapWidth, this.mapHeight);
      },
      npcs: [
        { tx: 5, ty: 6, name: "Ranger Pia", presetIdx: 0 },
        { tx: 18, ty: 9, name: "Runner Nico", presetIdx: 1 },
        { tx: 12, ty: 12, name: "Poet Emi", presetIdx: 2 },
      ],
      questions: { [targetLang]: questions, en: questions, es: questions },
      greetings: {
        en: ["Fresh air and fresh vocabulary!", "Walk and learn?", "Let’s train in the park."],
        es: ["¡Aire fresco y vocabulario!", "¿Caminamos y aprendemos?", "Entrenemos en el parque."],
      },
    };
  }

  return {
    id: "airport",
    name: { en: "Airport", es: "Aeropuerto" },
    tileSize: 32,
    mapWidth: 22,
    mapHeight: 14,
    playerStart: { x: 3, y: 10 },
    ambientColor: 0xdfe6ef,
    tiles: {
      0: { name: "terminal", solid: false, colors: [[0xd4dde6, 0xc9d2db]], detail: "linoleum" },
      1: { name: "lane", solid: false, colors: [[0xaec7dc, 0x9db5ca]], detail: "dirt" },
      2: { name: "wall", solid: true, colors: [[0xb9c3cf]], detail: "wall" },
      3: { name: "counter", solid: true, colors: [[0x6b7280]], sprite: "counter" },
      4: { name: "register", solid: true, colors: [[0x5a5a5a]], sprite: "register" },
      5: { name: "shelf", solid: true, colors: [[0x8a8f9a]], sprite: "shelf" },
      6: { name: "freezer", solid: true, colors: [[0xc0d8e8]], sprite: "freezer" },
    },
    generate(seed) {
      return generateAirport(seed, this.mapWidth, this.mapHeight);
    },
    npcs: [
      { tx: 6, ty: 9, name: "Agent Lio", presetIdx: 0 },
      { tx: 12, ty: 6, name: "Traveler Ana", presetIdx: 1 },
      { tx: 17, ty: 10, name: "Pilot Ren", presetIdx: 2 },
    ],
    questions: { [targetLang]: questions, en: questions, es: questions },
    greetings: {
      en: ["Boarding soon — one quick quiz!", "Passport, ticket, and vocabulary.", "Welcome to departures."],
      es: ["¡Abordamos pronto — un quiz rápido!", "Pasaporte, boleto y vocabulario.", "Bienvenido a salidas."],
    },
  };
}

export function getGeneratedScenarios(targetLang = "es", supportLang = "en") {
  return MAP_IDS.reduce((acc, mapId) => {
    acc[mapId] = buildScenario(mapId, targetLang, supportLang);
    return acc;
  }, {});
}

// ─── Seeded RNG ──────────────────────────────────────────────────────────────
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
