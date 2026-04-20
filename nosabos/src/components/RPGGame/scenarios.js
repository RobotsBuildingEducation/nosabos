import { getMultiLevelLearningPath } from "../../data/skillTreeData";
import {
  getLanguagePromptName,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../../constants/languages";
import { callResponses } from "../../utils/llm";
import {
  REVIEW_WORLD_ID,
  applyObjectCollisions,
  buildDynamicTileLibrary,
  buildFallbackMapData,
  buildLessonWorldSeed,
  buildScenarioEnvironment,
  getGatherPoolForEnvironment,
  getSupportedDecorKinds,
  getSupportedObjectTypes,
  normalizeScenarioObjects,
  readEnvironmentAmbientColor,
} from "./worldGen";

const SCENARIO_MODEL = "gpt-5-nano";

const CEFR_LEVELS_FOR_GAME = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];

export const TUTORIAL_MAP_ID = "tutorialPlaza";
export { REVIEW_WORLD_ID };

export const MAP_CHOICES = [
  {
    id: REVIEW_WORLD_ID,
    name: { en: "Generated World", es: "Mundo generado" },
    emoji: "✨",
  },
];

const MAP_NAME_BY_ID = {
  [REVIEW_WORLD_ID]: { en: "Generated World", es: "Mundo generado", it: "Mondo generato" },
  livingRoom: { en: "Living Room", es: "Sala", it: "Soggiorno" },
  park: { en: "Park", es: "Parque", it: "Parco" },
  airport: { en: "Airport", es: "Aeropuerto", it: "Aeroporto" },
  [TUTORIAL_MAP_ID]: { en: "Greeting Plaza", es: "Plaza de Saludos", it: "Piazza dei Saluti" },
};

function getMapName(mapId, lang = "en") {
  const mapName = MAP_NAME_BY_ID[mapId];
  if (!mapName) return mapId;
  return mapName[lang] || mapName.en || mapId;
}

const TILE_LIBRARY_BY_MAP = {
  livingRoom: {
    0: {
      name: "ground",
      solid: false,
      colors: [[0xc89b6d, 0xb78456, 0xd4aa7b]],
      detail: "wood_floor",
    },
    1: {
      name: "path",
      solid: false,
      colors: [[0xa86f43, 0x9b643b]],
      detail: "rug",
    },
    2: {
      name: "wall",
      solid: true,
      colors: [[0xcab9a5, 0xb7a38d]],
      detail: "wall",
    },
    3: { name: "tree", solid: true, colors: [[0x5a9e3e]], sprite: "shelf" },
    4: { name: "bench", solid: true, colors: [[0x8b7355]], sprite: "bench" },
    5: { name: "flower", solid: false, colors: [[0xb66aa1]], detail: "rug" },
    6: {
      name: "counter",
      solid: true,
      colors: [[0x8b7355]],
      sprite: "counter",
    },
  },
  park: {
    0: {
      name: "ground",
      solid: false,
      colors: [[0x6da84d, 0x5e9a42, 0x7bb55a]],
      detail: "grass",
    },
    1: {
      name: "path",
      solid: false,
      colors: [[0xc8a96e, 0xbf9d63]],
      detail: "dirt",
    },
    2: {
      name: "wall",
      solid: true,
      colors: [[0x7e6a53, 0x6b5946]],
      detail: "wall",
    },
    3: { name: "tree", solid: true, colors: [[0x4b8f38]], sprite: "tree" },
    4: { name: "bench", solid: true, colors: [[0x8b7355]], sprite: "bench" },
    5: { name: "flower", solid: false, colors: [[0x6da84d]], detail: "flower" },
    6: { name: "counter", solid: true, colors: [[0x8b7355]], sprite: "fence" },
  },
  airport: {
    0: {
      name: "ground",
      solid: false,
      colors: [[0xd5dde5, 0xc9d3dd]],
      detail: "tile_floor",
    },
    1: {
      name: "path",
      solid: false,
      colors: [[0x7c8b99, 0x6f7d8a]],
      detail: "runway",
    },
    2: {
      name: "wall",
      solid: true,
      colors: [[0xaeb9c4, 0x9caab7]],
      detail: "wall",
    },
    3: { name: "tree", solid: true, colors: [[0x9fb3c7]], sprite: "freezer" },
    4: { name: "bench", solid: true, colors: [[0x5e6e7c]], sprite: "bench" },
    5: {
      name: "flower",
      solid: false,
      colors: [[0xd5dde5]],
      detail: "linoleum",
    },
    6: {
      name: "counter",
      solid: true,
      colors: [[0x8da0b1]],
      sprite: "register",
    },
  },
  [TUTORIAL_MAP_ID]: {
    0: {
      name: "ground",
      solid: false,
      colors: [[0xffe8a3, 0xf8dc8c, 0xfbe7aa]],
      detail: "sunny_plaza",
    },
    1: {
      name: "path",
      solid: false,
      colors: [[0xffc978, 0xf0b867]],
      detail: "stone_path",
    },
    2: {
      name: "wall",
      solid: true,
      colors: [[0xa06b3b, 0x8b5a2b]],
      detail: "wall",
    },
    3: { name: "tree", solid: true, colors: [[0x4f9b4a]], sprite: "tree" },
    4: { name: "bench", solid: true, colors: [[0x8b7355]], sprite: "bench" },
    5: { name: "flower", solid: false, colors: [[0xff8fb1]], detail: "flower" },
    6: {
      name: "counter",
      solid: true,
      colors: [[0xb88650]],
      sprite: "counter",
    },
  },
};

function getTileLibrary(mapId, environment = null) {
  if (mapId === REVIEW_WORLD_ID && environment) {
    return buildDynamicTileLibrary(environment);
  }
  return TILE_LIBRARY_BY_MAP[mapId] || TILE_LIBRARY_BY_MAP.park;
}

function clampInt(n, min, max, fallback) {
  const num = Number.isFinite(Number(n)) ? Number(n) : fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function safeHex(value, fallback = 0x1a1a2e) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/^#/, "");
    const parsed = Number.parseInt(cleaned, 16);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function uniqueWords(items = []) {
  return Array.from(
    new Set(items.filter(Boolean).map((item) => String(item).trim())),
  );
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const NPC_PLACEHOLDER_REGEX = /__NPC_\d+__/g;

function buildNpcPlaceholderEntries(names = []) {
  return uniqueWords(names)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((name, idx) => ({
      name,
      placeholder: `__NPC_${idx}__`,
      regex: new RegExp(
        `(^|[^\\p{L}\\p{N}_])(${escapeRegExp(name)})(?=$|[^\\p{L}\\p{N}_])`,
        "gu",
      ),
    }));
}

function replaceNpcNamesInText(text, placeholderEntries = [], mode = "protect") {
  if (typeof text !== "string" || !placeholderEntries.length) return text;

  let nextText = text;
  if (mode === "restore") {
    placeholderEntries.forEach((entry) => {
      nextText = nextText.replaceAll(entry.placeholder, entry.name);
    });
    return nextText;
  }

  placeholderEntries.forEach((entry) => {
    nextText = nextText.replace(
      entry.regex,
      (_, prefix = "") => `${prefix}${entry.placeholder}`,
    );
  });
  return nextText;
}

function transformNpcNamesInValue(value, placeholderEntries = [], mode = "protect") {
  if (!placeholderEntries.length || value == null) return value;
  if (typeof value === "string") {
    return replaceNpcNamesInText(value, placeholderEntries, mode);
  }
  if (Array.isArray(value)) {
    return value.map((entry) =>
      transformNpcNamesInValue(entry, placeholderEntries, mode),
    );
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        transformNpcNamesInValue(entry, placeholderEntries, mode),
      ]),
    );
  }
  return value;
}

function extractNpcPlaceholders(text = "") {
  return Array.from(new Set(String(text).match(NPC_PLACEHOLDER_REGEX) || [])).sort();
}

function areNpcPlaceholdersPreserved(candidate, protectedValue) {
  if (typeof protectedValue === "string") {
    const expectedPlaceholders = extractNpcPlaceholders(protectedValue);
    if (!expectedPlaceholders.length) return true;
    if (typeof candidate !== "string") return false;
    const actualPlaceholders = extractNpcPlaceholders(candidate);
    return (
      actualPlaceholders.length === expectedPlaceholders.length &&
      actualPlaceholders.every(
        (placeholder, idx) => placeholder === expectedPlaceholders[idx],
      )
    );
  }

  if (Array.isArray(protectedValue)) {
    return (
      Array.isArray(candidate) &&
      candidate.length === protectedValue.length &&
      protectedValue.every((entry, idx) =>
        areNpcPlaceholdersPreserved(candidate[idx], entry),
      )
    );
  }

  if (protectedValue && typeof protectedValue === "object") {
    if (!candidate || typeof candidate !== "object") return false;
    return Object.keys(protectedValue).every((key) =>
      areNpcPlaceholdersPreserved(candidate[key], protectedValue[key]),
    );
  }

  return true;
}

function resolveTargetLanguageName(code) {
  return getLanguagePromptName(code) || String(code || "").toUpperCase();
}

function buildTargetLanguageGuard(targetLang, supportLang) {
  const targetName = resolveTargetLanguageName(targetLang);
  const supportName = resolveTargetLanguageName(supportLang);

  return [
    `CRITICAL LANGUAGE RULES: Every learner-facing string must be written strictly in ${targetName} (code: ${targetLang}).`,
    `The support language is ${supportName} (code: ${supportLang}) and is metadata only; it must NOT appear in dialogue, quest text, choices, hints, or questions.`,
    `Never use Spanish unless the target language itself is Spanish. Never mix ${targetName} with ${supportName}.`,
  ].join("\n");
}

function isBeginnerReviewLevel(level = "") {
  return ["Pre-A1", "A1"].includes(String(level || "").trim());
}

function buildReviewContextBlock(reviewContext = null, lessonTerms = [], levelKey = "A1") {
  const effectiveTerms = uniqueWords([
    ...(reviewContext?.reviewTerms || []),
    ...lessonTerms,
  ]).slice(0, 120);

  const contextLines = [
    reviewContext?.curriculumSummary
      ? `Review brief: ${reviewContext.curriculumSummary}`
      : "",
    reviewContext?.unitTitle
      ? `Current chapter/unit: ${reviewContext.unitTitle}.`
      : "",
    reviewContext?.lessonTitles?.length
      ? `Lessons to review: ${reviewContext.lessonTitles.slice(0, 8).join(", ")}.`
      : "",
    reviewContext?.reviewObjectives?.length
      ? `Keep the game aligned to these objectives: ${reviewContext.reviewObjectives
          .slice(0, 8)
          .join(" | ")}.`
      : "",
    reviewContext?.isTutorial
      ? "TUTORIAL REVIEW: Greetings, saying your name, and simple polite responses only. No errands, mysteries, or abstract storylines."
      : "",
    isBeginnerReviewLevel(levelKey)
      ? "BEGINNER REVIEW: Keep the mission concrete and classroom-friendly. Use short, high-frequency language tied directly to the review topics."
      : "",
  ].filter(Boolean);

  return {
    lessonTerms: effectiveTerms,
    promptBlock: contextLines.join("\n"),
  };
}

function getLessonTerms(targetLang) {
  const units = getMultiLevelLearningPath(targetLang, CEFR_LEVELS_FOR_GAME);
  return uniqueWords(
    units.flatMap((unit) =>
      (unit.lessons || []).flatMap((lesson) => {
        const content = lesson?.content || {};
        return Object.values(content).flatMap((modeData) => {
          if (!modeData || typeof modeData !== "object") return [];
          const terms = [];
          if (Array.isArray(modeData.focusPoints))
            terms.push(...modeData.focusPoints);
          if (modeData.topic) terms.push(modeData.topic);
          if (modeData.scenario) terms.push(modeData.scenario);
          return terms;
        });
      }),
    ),
  );
}

function normalizeNPCs(npcs, mapWidth, mapHeight, targetCount) {
  const raw = Array.isArray(npcs) ? npcs : [];
  const count = targetCount || 2 + Math.floor(Math.random() * 3); // 2-4
  const normalized = raw.slice(0, count).map((npc, idx) => ({
    tx: clampInt(npc?.tx, 1, mapWidth - 2, 2 + idx * 3),
    ty: clampInt(npc?.ty, 1, mapHeight - 2, 2 + idx * 2),
    name: String(npc?.name || `Guide ${idx + 1}`),
    presetIdx: clampInt(npc?.presetIdx, 0, 3, idx % 4),
  }));

  while (normalized.length < count) {
    const idx = normalized.length;
    normalized.push({
      tx: 2 + idx * 3,
      ty: 2 + idx * 2,
      name: `Guide ${idx + 1}`,
      presetIdx: idx % 4,
    });
  }

  return normalized;
}

function normalizeQuestions(questions, supportLang) {
  const basePrompt =
    supportLang === "it"
      ? "Scegli l'opzione corretta."
      : supportLang === "es"
        ? "Elige la opción correcta."
        : "Choose the correct option.";
  const list = Array.isArray(questions) ? questions : [];
  const normalized = list
    .slice(0, 20)
    .map((q) => {
      const options = Array.isArray(q?.options)
        ? q.options
            .map((opt) => String(opt))
            .filter(Boolean)
            .slice(0, 4)
        : [];
      if (options.length < 2) return null;
      const correct = clampInt(q?.correct, 0, options.length - 1, 0);
      return {
        prompt: String(q?.prompt || basePrompt),
        options,
        correct,
      };
    })
    .filter(Boolean);

  if (normalized.length) return normalized;

  return [
    {
      prompt: basePrompt,
      options: ["✅", "❌"],
      correct: 0,
    },
  ];
}

function sanitizeDialogueLine(line, npcName) {
  const raw = String(line || "").trim();
  if (!raw) return "";

  const escapedName = String(npcName || "")
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .trim();

  const noPrefix = escapedName
    ? raw.replace(new RegExp(`^${escapedName}\\s*:\\s*`, "i"), "")
    : raw;

  return noPrefix.replace(/^"|"$/g, "").trim();
}

// ─── Gather-quest item definitions per map theme ──────────────────────────
const GATHER_ITEMS_BY_MAP = {
  livingRoom: {
    es: {
      correct: [
        {
          name: "la llave dorada",
          hint: "Busca cerca de los estantes.",
          sprite: "key",
        },
        {
          name: "el libro antiguo",
          hint: "Mira debajo de los muebles.",
          sprite: "book",
        },
        {
          name: "la carta sellada",
          hint: "Revisa junto a la puerta.",
          sprite: "letter",
        },
      ],
      decoys: [
        { name: "el jarrón roto", sprite: "vase" },
        { name: "la cuchara vieja", sprite: "spoon" },
        { name: "el botón suelto", sprite: "button" },
        { name: "la vela derretida", sprite: "candle" },
        { name: "el reloj parado", sprite: "clock" },
        { name: "la taza agrietada", sprite: "cup" },
        { name: "el cojín viejo", sprite: "cushion" },
        { name: "el marco vacío", sprite: "frame" },
        { name: "las tijeras oxidadas", sprite: "scissors" },
        { name: "la moneda antigua", sprite: "coin" },
      ],
    },
    en: {
      correct: [
        {
          name: "the golden key",
          hint: "Look near the shelves.",
          sprite: "key",
        },
        {
          name: "the old book",
          hint: "Check under the furniture.",
          sprite: "book",
        },
        {
          name: "the sealed letter",
          hint: "Search by the door.",
          sprite: "letter",
        },
      ],
      decoys: [
        { name: "the broken vase", sprite: "vase" },
        { name: "the old spoon", sprite: "spoon" },
        { name: "the loose button", sprite: "button" },
        { name: "the melted candle", sprite: "candle" },
        { name: "the stopped clock", sprite: "clock" },
        { name: "the cracked cup", sprite: "cup" },
        { name: "the old cushion", sprite: "cushion" },
        { name: "the empty frame", sprite: "frame" },
        { name: "the rusty scissors", sprite: "scissors" },
        { name: "the old coin", sprite: "coin" },
      ],
    },
  },
  park: {
    es: {
      correct: [
        {
          name: "la flor rara",
          hint: "Crece entre los árboles.",
          sprite: "flower",
        },
        {
          name: "la piedra brillante",
          hint: "Está escondida en el camino.",
          sprite: "stone",
        },
        {
          name: "la pluma azul",
          hint: "Cerca de la fuente.",
          sprite: "feather",
        },
      ],
      decoys: [
        { name: "la hoja seca", sprite: "leaf" },
        { name: "la rama torcida", sprite: "branch" },
        { name: "el caracol vacío", sprite: "shell" },
        { name: "la bellota", sprite: "acorn" },
        { name: "el hongo rojo", sprite: "mushroom" },
        { name: "la piña caída", sprite: "pinecone" },
        { name: "la mariposa seca", sprite: "butterfly" },
        { name: "el nido abandonado", sprite: "nest" },
        { name: "la rana de piedra", sprite: "frog_statue" },
        { name: "la semilla extraña", sprite: "seed" },
      ],
    },
    en: {
      correct: [
        {
          name: "the rare flower",
          hint: "It grows among the trees.",
          sprite: "flower",
        },
        {
          name: "the shiny stone",
          hint: "Hidden on the path.",
          sprite: "stone",
        },
        {
          name: "the blue feather",
          hint: "Near the fountain.",
          sprite: "feather",
        },
      ],
      decoys: [
        { name: "the dry leaf", sprite: "leaf" },
        { name: "the crooked branch", sprite: "branch" },
        { name: "the empty shell", sprite: "shell" },
        { name: "the acorn", sprite: "acorn" },
        { name: "the red mushroom", sprite: "mushroom" },
        { name: "the fallen pinecone", sprite: "pinecone" },
        { name: "the dried butterfly", sprite: "butterfly" },
        { name: "the abandoned nest", sprite: "nest" },
        { name: "the stone frog", sprite: "frog_statue" },
        { name: "the strange seed", sprite: "seed" },
      ],
    },
  },
  airport: {
    es: {
      correct: [
        {
          name: "el pasaporte perdido",
          hint: "Alguien lo dejó en una banca.",
          sprite: "passport",
        },
        {
          name: "la etiqueta de equipaje",
          hint: "Revisa los mostradores.",
          sprite: "tag",
        },
        {
          name: "el boleto dorado",
          hint: "Mira cerca de la entrada.",
          sprite: "ticket",
        },
      ],
      decoys: [
        { name: "el recibo arrugado", sprite: "receipt" },
        { name: "la tarjeta vencida", sprite: "card" },
        { name: "el folleto viejo", sprite: "brochure" },
        { name: "los audífonos rotos", sprite: "headphones" },
        { name: "la botella vacía", sprite: "bottle" },
        { name: "el mapa doblado", sprite: "map" },
        { name: "la maleta rota", sprite: "suitcase" },
        { name: "el llavero perdido", sprite: "keychain" },
        { name: "las gafas de sol", sprite: "sunglasses" },
        { name: "el cargador viejo", sprite: "charger" },
      ],
    },
    en: {
      correct: [
        {
          name: "the lost passport",
          hint: "Someone left it on a bench.",
          sprite: "passport",
        },
        { name: "the luggage tag", hint: "Check the counters.", sprite: "tag" },
        {
          name: "the golden ticket",
          hint: "Look near the entrance.",
          sprite: "ticket",
        },
      ],
      decoys: [
        { name: "the crumpled receipt", sprite: "receipt" },
        { name: "the expired card", sprite: "card" },
        { name: "the old brochure", sprite: "brochure" },
        { name: "the broken headphones", sprite: "headphones" },
        { name: "the empty bottle", sprite: "bottle" },
        { name: "the folded map", sprite: "map" },
        { name: "the broken suitcase", sprite: "suitcase" },
        { name: "the lost keychain", sprite: "keychain" },
        { name: "the sunglasses", sprite: "sunglasses" },
        { name: "the old charger", sprite: "charger" },
      ],
    },
  },
};

function pickGatherItems(gatherSource, targetLang) {
  const dynamicPool =
    gatherSource && typeof gatherSource === "object"
      ? getGatherPoolForEnvironment(gatherSource)
      : null;
  const data =
    dynamicPool?.[targetLang] ||
    dynamicPool?.en ||
    dynamicPool?.es ||
    GATHER_ITEMS_BY_MAP[gatherSource]?.[targetLang] ||
    GATHER_ITEMS_BY_MAP[gatherSource]?.es ||
    GATHER_ITEMS_BY_MAP.park.es;
  const correctPool = [...data.correct].sort(() => Math.random() - 0.5);
  const decoyPool = [...data.decoys].sort(() => Math.random() - 0.5);
  // 2 correct + 8 decoys = 10 items
  const correct = correctPool
    .slice(0, 2)
    .map((item) => ({ ...item, isCorrect: true }));
  const decoys = decoyPool
    .slice(0, 8)
    .map((item) => ({ ...item, isCorrect: false }));
  return {
    correct,
    decoys,
    all: [...correct, ...decoys].sort(() => Math.random() - 0.5),
  };
}

function clampVisualInt(value, min, max, fallback) {
  const num = Number.isFinite(Number(value)) ? Number(value) : fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function normalizeVisualHex(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return `#${cleaned.toUpperCase()}`;
}

function sanitizeGatherVisualLayer(layer) {
  if (!layer || typeof layer !== "object") return null;
  const type = String(layer.type || "").trim();

  if (type === "rect") {
    const fill = normalizeVisualHex(layer.fill);
    const stroke = normalizeVisualHex(layer.stroke);
    if (!fill && !stroke) return null;
    return {
      type,
      x: clampVisualInt(layer.x, 0, 15, 0),
      y: clampVisualInt(layer.y, 0, 15, 0),
      w: clampVisualInt(layer.w, 1, 16, 4),
      h: clampVisualInt(layer.h, 1, 16, 4),
      fill,
      stroke,
    };
  }

  if (type === "roundRect") {
    const fill = normalizeVisualHex(layer.fill);
    const stroke = normalizeVisualHex(layer.stroke);
    if (!fill && !stroke) return null;
    const w = clampVisualInt(layer.w, 1, 16, 6);
    const h = clampVisualInt(layer.h, 1, 16, 6);
    return {
      type,
      x: clampVisualInt(layer.x, 0, 15, 0),
      y: clampVisualInt(layer.y, 0, 15, 0),
      w,
      h,
      r: clampVisualInt(layer.r, 0, Math.floor(Math.min(w, h) / 2), 1),
      fill,
      stroke,
    };
  }

  if (type === "circle") {
    const fill = normalizeVisualHex(layer.fill);
    const stroke = normalizeVisualHex(layer.stroke);
    if (!fill && !stroke) return null;
    return {
      type,
      cx: clampVisualInt(layer.cx, 0, 15, 8),
      cy: clampVisualInt(layer.cy, 0, 15, 8),
      r: clampVisualInt(layer.r, 1, 8, 3),
      fill,
      stroke,
    };
  }

  if (type === "line") {
    const stroke = normalizeVisualHex(layer.stroke);
    if (!stroke) return null;
    return {
      type,
      x1: clampVisualInt(layer.x1, 0, 15, 0),
      y1: clampVisualInt(layer.y1, 0, 15, 0),
      x2: clampVisualInt(layer.x2, 0, 15, 15),
      y2: clampVisualInt(layer.y2, 0, 15, 15),
      stroke,
      width: clampVisualInt(layer.width, 1, 3, 1),
    };
  }

  if (type === "poly") {
    const points = Array.isArray(layer.points)
      ? layer.points
          .map((point) =>
            Array.isArray(point) && point.length >= 2
              ? [
                  clampVisualInt(point[0], 0, 15, 0),
                  clampVisualInt(point[1], 0, 15, 0),
                ]
              : null,
          )
          .filter(Boolean)
          .slice(0, 8)
      : [];
    const fill = normalizeVisualHex(layer.fill);
    const stroke = normalizeVisualHex(layer.stroke);
    if (points.length < 2 || (!fill && !stroke)) return null;
    return {
      type,
      points,
      fill,
      stroke,
      closed: layer.closed !== false,
    };
  }

  return null;
}

function sanitizeGatherVisualSpec(spec) {
  const layers = Array.isArray(spec?.layers)
    ? spec.layers.map(sanitizeGatherVisualLayer).filter(Boolean).slice(0, 8)
    : [];
  if (!layers.length) return null;
  return { layers };
}

function getGatherItemKey(item) {
  return `${String(item?.name || "").trim()}::${String(item?.hint || "").trim()}`;
}

function applyGatherVisualsToQuest(quest, rawVisuals) {
  const items = Array.isArray(quest?.gatherData?.all) ? quest.gatherData.all : [];
  if (!items.length || !Array.isArray(rawVisuals) || !rawVisuals.length) {
    return quest;
  }

  const visualsByKey = new Map();
  rawVisuals.forEach((entry, idx) => {
    const sourceItem = items[idx];
    const visual = sanitizeGatherVisualSpec(entry?.visual);
    if (!visual || !sourceItem) return;
    visualsByKey.set(getGatherItemKey(sourceItem), visual);
  });

  if (!visualsByKey.size) return quest;

  const applyVisual = (item) => {
    if (!item) return item;
    const key = getGatherItemKey(item);
    const visual = visualsByKey.get(key) || item.visual || null;
    return {
      ...item,
      visual,
    };
  };

  return {
    ...quest,
    gatherData: {
      ...quest.gatherData,
      correct: (quest.gatherData.correct || []).map(applyVisual),
      decoys: (quest.gatherData.decoys || []).map(applyVisual),
      all: items.map(applyVisual),
    },
    steps: (quest.steps || []).map((step) => ({
      ...step,
      nodes: (step.nodes || []).map((node) => ({
        ...node,
        gatherItem: node.gatherItem ? applyVisual(node.gatherItem) : node.gatherItem,
      })),
    })),
  };
}

async function enrichQuestGatherVisuals(
  quest,
  targetLang,
  reviewContext = null,
  environment = null,
) {
  const items = Array.isArray(quest?.gatherData?.all) ? quest.gatherData.all : [];
  if (!items.length) return quest;

  const normalizedTargetLang = normalizePracticeLanguage(targetLang, "es");
  const targetLangName = resolveTargetLanguageName(normalizedTargetLang);
  const prompt = [
    "You create compact 16x16 pixel-art blueprints for RPG inventory items.",
    "Return ONLY valid JSON.",
    "Output a JSON array with the SAME length and SAME order as the input array.",
    `Interpret every item name as ${targetLangName} (code: ${normalizedTargetLang}).`,
    environment?.summary?.en
      ? `World context: ${environment.summary.en}`
      : "",
    reviewContext?.curriculumSummary
      ? `Lesson review context: ${reviewContext.curriculumSummary}`
      : "",
    "Each output item must have this shape:",
    '{"name":"exact original item name","visual":{"layers":[...]}}',
    "Allowed layer types only: rect, roundRect, circle, line, poly.",
    "All coordinates are integers on a 16x16 transparent canvas.",
    "Use 3-6 layers per item, strong silhouettes, and make each object visually specific.",
    "Important: do not make a map look like a key, a candle look like a book, or any item look like a generic treasure icon.",
    "Maps should look like folded papers with route marks or markers.",
    "Books, dictionaries, and glossaries should look like thick bound books with visible page edges.",
    "Candles must show wax and a visible flame.",
    "Keys must show a ring and teeth.",
    "Return only the JSON array and nothing else.",
    "",
    JSON.stringify(
      items.map((item) => ({
        name: item.name,
        hint: item.hint || "",
        isCorrect: !!item.isCorrect,
      })),
    ),
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callResponses({
    model: SCENARIO_MODEL,
    input: prompt,
  });
  const parsed = parseJSON(raw);
  if (!Array.isArray(parsed)) return quest;
  return applyGatherVisualsToQuest(quest, parsed);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestPlan(npcCount, options = {}) {
  const levelKey = options?.cefrLevel || "A1";
  const isTutorial = !!options?.isTutorial;
  // Build a variable-length visit sequence (2-6 steps)
  // Each step targets an NPC and has random interactions
  const npcIndices = Array.from({ length: npcCount }, (_, i) => i);

  // Start with a shuffled base visit of all NPCs
  const base = shuffle(npcIndices);

  // Randomly add 0-3 extra revisit steps
  const extraCount = isTutorial ? 0 : Math.floor(Math.random() * 4); // 0-3
  const extras = [];
  for (let i = 0; i < extraCount; i++) {
    extras.push(pickRandom(npcIndices));
  }

  // Interleave extras at random positions, avoiding consecutive duplicates
  const visitOrder = [...base];
  for (const extra of extras) {
    // Find positions where inserting this NPC wouldn't create consecutive duplicates
    const validPositions = [];
    for (let p = 0; p <= visitOrder.length; p++) {
      const before = p > 0 ? visitOrder[p - 1] : -1;
      const after = p < visitOrder.length ? visitOrder[p] : -1;
      if (extra !== before && extra !== after) validPositions.push(p);
    }
    if (validPositions.length > 0) {
      const pos = pickRandom(validPositions);
      visitOrder.splice(pos, 0, extra);
    }
  }

  // For each step, pick 1-3 random interaction types
  const interactionTypes = ["choice", "speech"];
  const maxInteractions = isTutorial
    ? 1
    : levelKey === "Pre-A1"
      ? 1
      : levelKey === "A1"
        ? 2
        : 3;
  const stepsInteractions = visitOrder.map(() => {
    const count = 1 + Math.floor(Math.random() * maxInteractions);
    const types = [];
    for (let s = 0; s < count; s++) {
      types.push(pickRandom(interactionTypes));
    }
    return types;
  });

  // Pick which step gets the gather quest (60% chance, never the last step)
  const gatherChance = isTutorial
    ? 0
    : levelKey === "Pre-A1"
      ? 0.1
      : levelKey === "A1"
        ? 0.25
        : 0.6;
  const hasGather = Math.random() < gatherChance;
  const gatherStepIdx =
    hasGather && visitOrder.length > 1
      ? Math.floor(Math.random() * (visitOrder.length - 1))
      : -1;

  return { visitOrder, stepsInteractions, gatherStepIdx };
}

function normalizeQuest(
  rawQuest,
  npcs,
  questionsByLang,
  supportLang,
  targetLang,
  gatherSource = "park",
  cefrLevel = null,
  reviewContext = null,
) {
  const rawStorySeed = String(rawQuest?.storySeed || "").trim();
  const tl = targetLang;
  const levelKey = cefrLevel || reviewContext?.cefrLevel || "A1";

  const L = {
    es: {
      defaultSeed:
        "La campana del pueblo desapareció y nadie sabe quién la tomó.",
      defaultIntro: (name) =>
        `Comienza con ${name} y sigue las pistas para resolver el misterio.`,
      actLabel: (name, n) => `${name} · acto ${n}`,
      connectClue: (name, next) =>
        `${name} conecta la pista anterior con ${next}.`,
      defaultTopic: "las pistas del caso",
      fallbackSpeech: "No alcancé a oírte bien. Inténtalo otra vez.",
      heardPrefix: "Perfecto, escuché",
      // Greeting pools — picked randomly per game instance
      firstGreetings: [
        (seed) => `¡Qué bueno que llegaste! Necesito tu ayuda urgente. ${seed}`,
        (seed) =>
          `¡Por fin alguien viene! Escucha, tenemos un problema serio. ${seed}`,
        (seed) => `No vas a creer lo que pasó. ${seed}`,
        (seed) => `¡Ven, rápido! Algo terrible acaba de ocurrir. ${seed}`,
      ],
      midGreetings: [
        (fromNpc) => `¿${fromNpc} te envió? Entonces la situación es seria.`,
        (fromNpc) =>
          `Ah, vienes de parte de ${fromNpc}. Ya me imaginaba que esto iba a pasar.`,
        (fromNpc) =>
          `${fromNpc} hizo bien en mandarte aquí. Tengo información importante.`,
        (fromNpc) =>
          `¡Menos mal que llegaste! ${fromNpc} me dijo que eres de confianza.`,
      ],
      finalGreetings: [
        (fromNpc) =>
          `¡Llegas justo a tiempo! ${fromNpc} me avisó que vendrías.`,
        (fromNpc) => `Te estaba esperando. ${fromNpc} me contó todo.`,
        (fromNpc) => `¡Al fin! ${fromNpc} dijo que tú podrías resolver esto.`,
        (fromNpc) => `Sabía que vendrías. ${fromNpc} confía mucho en ti.`,
      ],
      // Choice pools — each is [text, replyFn] pairs
      choiceSets: [
        [
          [
            "¿Qué pasó exactamente? Cuéntame todo.",
            () =>
              "Todo empezó esta mañana. Necesitamos actuar rápido antes de que sea tarde.",
          ],
          [
            "Estoy listo para ayudar. ¿Por dónde empiezo?",
            () => "Gracias por ofrecerte. No puedo hacer esto solo.",
          ],
          [
            "Mmm... esto suena a que alguien metió la pata.",
            () => "¡Ja! Tienes razón. Pero ahora tú puedes arreglarlo.",
          ],
          [
            "¿Y por qué debería importarme?",
            () =>
              "Oye, sé que suena raro... pero en serio, si no ayudas, esto se pone feo.",
          ],
          [
            "¡Ja! ¿Otra vez problemas? Nunca falla.",
            () => "Así es la vida aquí. Pero esta vez es diferente, créeme.",
          ],
        ],
        [
          [
            "Exacto. ¿Qué sabes tú sobre esto?",
            () => "Escuché rumores sobre eso. Hay que investigar más a fondo.",
          ],
          [
            "Necesito más información para continuar.",
            () =>
              "Claro, esto es lo que sé. La situación es más compleja de lo que parece.",
          ],
          [
            "¿Tú también estás metido en este lío?",
            () => "¡Oye! Yo soy inocente. Pero sí, sé más de lo que parece.",
          ],
          [
            "No tengo todo el día. Habla rápido.",
            () =>
              "Tranquilo, tranquilo. Las prisas no ayudan, pero te lo resumo rápido.",
          ],
          [
            "A ver, ¿tú eres el experto o qué?",
            () => "Digamos que sé un par de cosas. Escucha con atención.",
          ],
        ],
        [
          [
            "Terminemos con esto. ¿Qué falta?",
            () => "Solo queda una cosa. Estamos a punto de resolverlo.",
          ],
          [
            "¿Cuál es el último paso?",
            () => "Casi terminamos. Todo depende de este último paso.",
          ],
          [
            "Espero que valga la pena tanto esfuerzo.",
            () =>
              "Te prometo que sí. Has llegado muy lejos para rendirte ahora.",
          ],
          [
            "Ya era hora. Casi me duermo esperando.",
            () =>
              "Jaja, no te culpo. Pero el final vale la pena, te lo aseguro.",
          ],
          [
            "¡Por fin! Esto se va a poner bueno.",
            () => "¡Así me gusta! Con esa energía lo resolvemos en un segundo.",
          ],
        ],
        [
          [
            "¿Hay algo que pueda hacer ahora mismo?",
            () => "Sí, de hecho hay algo urgente. Déjame explicarte.",
          ],
          [
            "¿Quién más sabe sobre esto?",
            () => "Pocos lo saben. Pero hay alguien que puede ayudarnos.",
          ],
          ["¿Cuánto tiempo tenemos?", () => "No mucho. Cada minuto cuenta."],
          [
            "Dame los detalles, no te guardes nada.",
            () => "Está bien, te cuento todo. Presta atención.",
          ],
          [
            "¿Es peligroso?",
            () => "Un poco, pero nada que no podamos manejar juntos.",
          ],
        ],
        [
          [
            "¿Cómo descubriste todo esto?",
            () => "Fue por accidente. Estaba caminando y noté algo extraño.",
          ],
          [
            "¿Alguien más ha intentado resolver esto?",
            () => "Sí, pero nadie lo ha logrado. Por eso necesitamos ayuda.",
          ],
          [
            "¿Qué pasa si no hacemos nada?",
            () =>
              "Las cosas se pondrían muy mal. No podemos quedarnos de brazos cruzados.",
          ],
          [
            "Cuéntame más sobre el lugar.",
            () =>
              "Este lugar tiene muchos secretos. Algunos mejor dejarlos en paz.",
          ],
          [
            "¿Confías en las personas de aquí?",
            () => "En algunas sí, en otras no tanto. Hay que tener cuidado.",
          ],
        ],
      ],
      // Speech prompt pools
      speechPrompts: [
        () => "Interesante... ¿Y tú qué opinas sobre todo esto?",
        () => "Mmm, cuéntame más. ¿Qué piensas tú?",
        () => "Antes de seguir... ¿cómo ves la situación?",
        () => "Quiero escuchar tu punto de vista. ¿Qué dirías?",
        () => "Eso me hace pensar... ¿y tú qué crees que pasó?",
      ],
      playerBridge: (fromNpc) =>
        `${fromNpc} me envió. Dice que tú sabes algo importante.`,
      npcHandoff: (nextNpc) =>
        `Ve con ${nextNpc}. Creo que sabe algo más que puede ayudarnos.`,
      questComplete: "¡Misión cumplida! Has resuelto el misterio.",
      gatherIntro: (itemName) =>
        `Necesito que encuentres ${itemName} en este lugar. Ten cuidado, hay muchas cosas por ahí que no sirven.`,
      gatherHint: (hint) => `Una pista: ${hint}`,
      gatherWrongItem: (wrongName, correctName) =>
        `Eso es ${wrongName}. No es lo que necesito. Busca ${correctName}.`,
      gatherSuccess: (itemName) =>
        `¡Excelente! Tienes ${itemName}. Eso me ayuda mucho.`,
      gatherPlayerReport: (itemName) => `Encontré ${itemName}. Aquí está.`,
      speechContinue: "Entiendo lo que dices. Sigamos adelante.",
    },
    en: {
      defaultSeed: "The town bell disappeared and nobody knows who took it.",
      defaultIntro: (name) =>
        `Start with ${name} and follow the clues to solve the mystery.`,
      actLabel: (name, n) => `${name} · act ${n}`,
      connectClue: (name, next) =>
        `${name} connects the previous clue to ${next}.`,
      defaultTopic: "the case clues",
      fallbackSpeech: "I couldn't hear you clearly. Try again.",
      heardPrefix: "Perfect, I heard",
      firstGreetings: [
        (seed) => `I'm glad you're here! I need your help urgently. ${seed}`,
        (seed) =>
          `Finally, someone showed up! Listen, we have a serious problem. ${seed}`,
        (seed) => `You won't believe what happened. ${seed}`,
        (seed) => `Come, quick! Something terrible just happened. ${seed}`,
      ],
      midGreetings: [
        (fromNpc) => `${fromNpc} sent you? Then the situation is serious.`,
        (fromNpc) =>
          `Ah, you come from ${fromNpc}. I figured this would happen.`,
        (fromNpc) =>
          `${fromNpc} did well sending you here. I have important information.`,
        (fromNpc) =>
          `Thank goodness you're here! ${fromNpc} said you could be trusted.`,
      ],
      finalGreetings: [
        (fromNpc) =>
          `You arrived just in time! ${fromNpc} told me you were coming.`,
        (fromNpc) => `I was waiting for you. ${fromNpc} told me everything.`,
        (fromNpc) => `At last! ${fromNpc} said you could solve this.`,
        (fromNpc) => `I knew you'd come. ${fromNpc} trusts you a lot.`,
      ],
      choiceSets: [
        [
          [
            "What exactly happened? Tell me everything.",
            () =>
              "It all started this morning. We need to act fast before it's too late.",
          ],
          [
            "I'm ready to help. Where do I start?",
            () => "Thanks for volunteering. I can't do this alone.",
          ],
          [
            "Hmm... sounds like someone really messed up.",
            () => "Ha! You're right. But now you can fix it.",
          ],
          [
            "Why should I care about this?",
            () =>
              "Hey, I know it sounds weird... but seriously, if you don't help, things get ugly.",
          ],
          [
            "Ha! Problems again? Never a dull moment here.",
            () =>
              "That's life around here. But this time it's different, trust me.",
          ],
        ],
        [
          [
            "Exactly. What do you know about this?",
            () => "I've heard rumors about that. We need to dig deeper.",
          ],
          [
            "I need more information to continue.",
            () =>
              "Sure, here's what I know. The situation is more complex than it seems.",
          ],
          [
            "Are you mixed up in this mess too?",
            () => "Hey! I'm innocent. But yeah, I know more than it looks.",
          ],
          [
            "I don't have all day. Talk fast.",
            () =>
              "Easy, easy. Rushing won't help, but I'll give you the short version.",
          ],
          [
            "So, are you the expert or what?",
            () => "Let's just say I know a thing or two. Listen carefully.",
          ],
        ],
        [
          [
            "Let's finish this. What's left?",
            () => "Just one thing left. We're about to solve this.",
          ],
          [
            "What's the last step?",
            () => "We're almost done. It all comes down to this last step.",
          ],
          [
            "I hope all this effort was worth it.",
            () => "I promise it is. You've come too far to give up now.",
          ],
          [
            "Finally. I almost fell asleep waiting.",
            () =>
              "Haha, can't blame you. But the ending is worth it, trust me.",
          ],
          [
            "Let's go! This is about to get good.",
            () =>
              "That's the spirit! With that energy we'll solve this in no time.",
          ],
        ],
        [
          [
            "Is there something I can do right now?",
            () => "Yes, actually there's something urgent. Let me explain.",
          ],
          [
            "Who else knows about this?",
            () => "Few people know. But there's someone who can help us.",
          ],
          ["How much time do we have?", () => "Not much. Every minute counts."],
          [
            "Give me the details, don't hold back.",
            () => "Alright, I'll tell you everything. Pay attention.",
          ],
          [
            "Is it dangerous?",
            () => "A little, but nothing we can't handle together.",
          ],
        ],
        [
          [
            "How did you find out about all this?",
            () =>
              "It was by accident. I was walking and noticed something strange.",
          ],
          [
            "Has anyone else tried to solve this?",
            () => "Yes, but nobody succeeded. That's why we need help.",
          ],
          [
            "What happens if we do nothing?",
            () => "Things would get really bad. We can't just sit around.",
          ],
          [
            "Tell me more about this place.",
            () => "This place has many secrets. Some are better left alone.",
          ],
          [
            "Do you trust the people here?",
            () =>
              "Some of them, yes. Others, not so much. We need to be careful.",
          ],
        ],
      ],
      speechPrompts: [
        () => "Interesting... What do you think about all of this?",
        () => "Hmm, tell me more. What's your take?",
        () => "Before we continue... how do you see the situation?",
        () => "I want to hear your perspective. What would you say?",
        () => "That makes me think... what do you believe happened?",
      ],
      playerBridge: (fromNpc) =>
        `${fromNpc} sent me. They say you know something important.`,
      npcHandoff: (nextNpc) =>
        `Go find ${nextNpc}. I think they know something more that can help us.`,
      questComplete: "Quest complete! You solved the mystery.",
      gatherIntro: (itemName) =>
        `I need you to find ${itemName} somewhere around here. Be careful, there are lots of things out there that won't help.`,
      gatherHint: (hint) => `A clue: ${hint}`,
      gatherWrongItem: (wrongName, correctName) =>
        `That's ${wrongName}. Not what I need. Look for ${correctName}.`,
      gatherSuccess: (itemName) =>
        `Excellent! You have ${itemName}. That helps a lot.`,
      gatherPlayerReport: (itemName) => `I found ${itemName}. Here it is.`,
      speechContinue: "I understand what you're saying. Let's keep going.",
    },
  };

  const t = L[tl] || {
    ...L.en,
    // For target languages with no template, use LLM-generated content directly
    // to avoid prepending/appending English text to target-language dialogue
    firstGreetings: [(seed) => seed],
    midGreetings: [(fromNpc) => `${fromNpc}!`],
    finalGreetings: [(fromNpc) => `${fromNpc}!`],
    // Terminal nodes: NPC name only, no English narrative
    npcHandoff: (nextNpc) => `${nextNpc}!`,
    questComplete: "✓",
    // Player connector lines: NPC name reference only
    playerBridge: (fromNpc) => `${fromNpc}.`,
    // Speech fallbacks: null so index.jsx falls through to ui.* (support language)
    fallbackSpeech: null,
    speechContinue: null,
    // Follow-up NPC prompts in speech mode
    speechPrompts: [() => "…"],
  };

  const storySeed = rawStorySeed || t.defaultSeed;
  const intro =
    String(rawQuest?.intro || "").trim() ||
    t.defaultIntro(npcs[0]?.name || "NPC");

  // Generate a random quest plan for this game instance
  const plan = generateQuestPlan(npcs.length, {
    cefrLevel: levelKey,
    isTutorial: !!reviewContext?.isTutorial,
  });

  // Prepare gather items
  const gatherData = pickGatherItems(gatherSource, tl);

  // Track which choice sets have been used to avoid repeats
  const usedChoiceSets = new Set();
  function pickChoiceSet() {
    const available = t.choiceSets
      .map((set, idx) => ({ set, idx }))
      .filter(({ idx }) => !usedChoiceSets.has(idx));
    if (available.length === 0) {
      usedChoiceSets.clear();
      return pickRandom(t.choiceSets);
    }
    const pick = pickRandom(available);
    usedChoiceSets.add(pick.idx);
    return pick.set;
  }

  // Build steps array — each step targets one NPC with its own dialogue nodes
  const steps = plan.visitOrder.map((npcIdx, stepIdx) => {
    const npc = npcs[npcIdx];
    const isFirstStep = stepIdx === 0;
    const isLastStep = stepIdx === plan.visitOrder.length - 1;
    const prevNpcIdx = stepIdx > 0 ? plan.visitOrder[stepIdx - 1] : -1;
    const nextNpcIdx = !isLastStep ? plan.visitOrder[stepIdx + 1] : -1;
    const prevNpc = prevNpcIdx >= 0 ? npcs[prevNpcIdx] : null;
    const nextNpc = nextNpcIdx >= 0 ? npcs[nextNpcIdx] : null;
    const interactions = plan.stepsInteractions[stepIdx];
    const hasGather = stepIdx === plan.gatherStepIdx;

    const nodeId = (n) => `step-${stepIdx}-npc-${npcIdx}-node-${n}`;
    const nodes = [];
    let nodeCounter = 1;

    // Pick greeting based on step position
    let greetLine;
    if (isFirstStep) {
      greetLine = pickRandom(t.firstGreetings)(storySeed);
    } else if (isLastStep) {
      greetLine = pickRandom(t.finalGreetings)(prevNpc?.name || "NPC");
    } else {
      greetLine = pickRandom(t.midGreetings)(prevNpc?.name || "NPC");
    }

    // Build interaction nodes from the random plan
    for (let i = 0; i < interactions.length; i++) {
      const type = interactions[i];
      const isFirstNode = i === 0;
      const currentId = nodeId(nodeCounter);
      const nextInteractionId = nodeId(nodeCounter + 1);
      nodeCounter++;

      if (type === "choice") {
        const choiceSet = pickChoiceSet();
        const node = {
          id: currentId,
          npcLine: sanitizeDialogueLine(
            isFirstNode ? greetLine : pickRandom(t.speechPrompts)(),
            npc.name,
          ),
          responseMode: "choice",
          choices: choiceSet.map(([text, replyFn]) => ({
            text,
            npcReply: replyFn(),
            nextNodeId: nextInteractionId,
          })),
        };
        if (isFirstNode && prevNpc) {
          node.playerLine = t.playerBridge(prevNpc.name, npc.name);
        }
        nodes.push(node);
      } else if (type === "speech") {
        const node = {
          id: currentId,
          npcLine: sanitizeDialogueLine(
            isFirstNode ? greetLine : pickRandom(t.speechPrompts)(),
            npc.name,
          ),
          responseMode: "speech",
          speechFallbackReply: t.fallbackSpeech,
          speechContinueReply: t.speechContinue,
          nextNodeId: nextInteractionId,
        };
        if (isFirstNode && prevNpc) {
          node.playerLine = t.playerBridge(prevNpc.name, npc.name);
        }
        nodes.push(node);
      }
    }

    // Add gather node if this step has the gather quest
    if (hasGather) {
      const correctItem = gatherData.correct[0] || {
        name: t.defaultTopic,
        hint: "",
        isCorrect: true,
      };
      const gatherId = nodeId(nodeCounter);
      const gatherSuccessId = nodeId(nodeCounter + 1);

      // Point the last interaction node to the gather node
      const lastNode = nodes[nodes.length - 1];
      if (lastNode) {
        if (lastNode.responseMode === "choice") {
          lastNode.choices.forEach((c) => {
            c.nextNodeId = gatherId;
          });
        } else {
          lastNode.nextNodeId = gatherId;
        }
      }

      nodes.push({
        id: gatherId,
        npcLine: sanitizeDialogueLine(
          `${t.gatherIntro(correctItem.name)} ${t.gatherHint(correctItem.hint)}`,
          npc.name,
        ),
        responseMode: "gather",
        gatherItem: correctItem,
        gatherWrongItemTemplate: t.gatherWrongItem(
          "{{wrongItem}}",
          "{{correctItem}}",
        ),
        nextNodeId: gatherSuccessId,
      });
      nodeCounter++;

      if (isLastStep) {
        nodes.push({
          id: gatherSuccessId,
          playerLine: t.gatherPlayerReport(correctItem.name),
          npcLine: sanitizeDialogueLine(
            `${t.gatherSuccess(correctItem.name)} ${t.questComplete}`,
            npc.name,
          ),
          responseMode: "none",
          terminal: true,
        });
      } else {
        nodes.push({
          id: gatherSuccessId,
          playerLine: t.gatherPlayerReport(correctItem.name),
          npcLine: sanitizeDialogueLine(
            `${t.gatherSuccess(correctItem.name)} ${t.npcHandoff(nextNpc.name)}`,
            npc.name,
          ),
          responseMode: "none",
          terminal: true,
          playerBridge: t.playerBridge(npc.name, nextNpc.name),
        });
      }
      nodeCounter++;
    } else {
      // Add terminal/handoff node
      const terminalId = nodeId(nodeCounter);

      // Point the last interaction node to the terminal
      const lastNode = nodes[nodes.length - 1];
      if (lastNode) {
        if (lastNode.responseMode === "choice") {
          lastNode.choices.forEach((c) => {
            c.nextNodeId = terminalId;
          });
        } else {
          lastNode.nextNodeId = terminalId;
        }
      }

      if (isLastStep) {
        nodes.push({
          id: terminalId,
          npcLine: sanitizeDialogueLine(t.questComplete, npc.name),
          responseMode: "none",
          terminal: true,
        });
      } else {
        nodes.push({
          id: terminalId,
          npcLine: sanitizeDialogueLine(t.npcHandoff(nextNpc.name), npc.name),
          responseMode: "none",
          terminal: true,
          playerBridge: t.playerBridge(npc.name, nextNpc.name),
        });
      }
    }

    return {
      stepIdx,
      npcIdx,
      title: t.actLabel(npc.name, stepIdx + 1),
      intro: nextNpc
        ? t.connectClue(npc.name, nextNpc.name)
        : t.connectClue(npc.name, npc.name),
      nodes,
    };
  });

  return {
    intro,
    storySeed,
    startNpcIdx: plan.visitOrder[0],
    steps,
    gatherData,
  };
}

function isQuestLocalizationValid(candidate, baseQuest) {
  if (!candidate || typeof candidate !== "object") return false;
  if (!Array.isArray(candidate.steps) || !Array.isArray(baseQuest?.steps)) {
    return false;
  }
  if (candidate.steps.length !== baseQuest.steps.length) return false;
  if (!candidate.gatherData || !baseQuest?.gatherData) return false;
  return true;
}

async function adaptQuestForReviewContext(
  quest,
  targetLang,
  cefrLevel,
  reviewContext = null,
  protectedCharacterNames = [],
) {
  const normalizedTargetLang = normalizePracticeLanguage(targetLang, "es");
  if (!quest) {
    return quest;
  }

  const targetLangName = resolveTargetLanguageName(normalizedTargetLang);
  const levelKey = cefrLevel || reviewContext?.cefrLevel || "A1";
  const npcPlaceholderEntries = buildNpcPlaceholderEntries(
    protectedCharacterNames,
  );
  const protectedQuest = transformNpcNamesInValue(
    quest,
    npcPlaceholderEntries,
    "protect",
  );
  const prompt = [
    "You are rewriting a structured RPG quest so it becomes a chapter review for a language-learning game.",
    `Target language: ${targetLangName} (code: ${normalizedTargetLang}).`,
    `CEFR level: ${levelKey}.`,
    reviewContext?.curriculumSummary
      ? `Review brief: ${reviewContext.curriculumSummary}`
      : "",
    reviewContext?.unitTitle
      ? `Current chapter/unit: ${reviewContext.unitTitle}.`
      : "",
    reviewContext?.lessonTitles?.length
      ? `Lessons being reviewed: ${reviewContext.lessonTitles
          .slice(0, 8)
          .join(", ")}.`
      : "",
    reviewContext?.reviewTerms?.length
      ? `Required review topics and vocabulary: ${reviewContext.reviewTerms
          .slice(0, 24)
          .join(", ")}.`
      : "",
    reviewContext?.reviewObjectives?.length
      ? `Keep the dialogue tied to these lesson objectives: ${reviewContext.reviewObjectives
          .slice(0, 8)
          .join(" | ")}.`
      : "",
    reviewContext?.isTutorial
      ? "Tutorial rule: greetings, saying your name, and simple polite expressions only. No mysteries, errands, memory loss, urgency, or dramatic twists."
      : "",
    isBeginnerReviewLevel(levelKey)
      ? "Beginner rule: rewrite everything into very short, concrete, high-frequency review language. No abstract, literary, or poetic lines."
      : "",
    `Rewrite every learner-facing string into ${targetLangName} and align it to the review brief.`,
    "This includes intro, storySeed, step titles/intros, node dialogue, player lines, choice text, choice replies, gather item names, hints, and gather-data item names/hints.",
    "Keep the JSON structure exactly the same.",
    "Do NOT change keys, ids, stepIdx, npcIdx, startNpcIdx, nextNodeId, responseMode, terminal, isCorrect, sprite, or any numbers/booleans.",
    npcPlaceholderEntries.length
      ? "Character name placeholders like __NPC_0__ represent the fixed roster. Preserve every placeholder exactly as written and never invent any other person name."
      : "Keep character names as written and do not invent any new person names.",
    "Preserve the placeholders {{wrongItem}} and {{correctItem}} exactly.",
    `Use only ${targetLangName}. Do not use Spanish, English, or any other language unless ${targetLangName} is that language.`,
    "Return ONLY valid JSON.",
    "",
    JSON.stringify(protectedQuest),
  ].join("\n");

  const localizedRaw = await callResponses({
    model: SCENARIO_MODEL,
    input: prompt,
  });
  const localized = parseJSON(localizedRaw);
  const placeholdersPreserved = areNpcPlaceholdersPreserved(
    localized,
    protectedQuest,
  );
  if (!isQuestLocalizationValid(localized, quest) || !placeholdersPreserved) {
    return quest;
  }
  return transformNpcNamesInValue(localized, npcPlaceholderEntries, "restore");
}

function normalizeMapData(mapData, mapWidth, mapHeight) {
  const expectedLength = mapWidth * mapHeight;
  if (!Array.isArray(mapData) || mapData.length !== expectedLength) {
    return null;
  }

  return mapData.map((value) => clampInt(value, 0, 6, 0));
}

function ensureWalkableTiles(mapData, mapWidth, entities = []) {
  const next = [...mapData];
  entities.forEach((entity) => {
    const x = clampInt(entity?.x ?? entity?.tx, 1, mapWidth - 2, 1);
    const y = clampInt(entity?.y ?? entity?.ty, 1, Math.floor(next.length / mapWidth) - 2, 1);
    next[y * mapWidth + x] = 1;
  });
  return next;
}

const REVIEW_HUB_MAP_ID = "review-hub";

const REVIEW_ROOM_BLUEPRINTS = {
  home: [
    {
      slug: "kitchen",
      name: { en: "Kitchen", es: "Cocina" },
      markerType: "doorway",
      shape: "annex",
      objects: ["counter", "stove", "shelf"],
    },
    {
      slug: "study",
      name: { en: "Study", es: "Estudio" },
      markerType: "doorway",
      shape: "alcove",
      objects: ["bookshelf", "desk", "lamp"],
    },
    {
      slug: "garden-patio",
      name: { en: "Garden Patio", es: "Patio del Jardin" },
      markerType: "pavilion",
      shape: "courtyard",
      objects: ["bench", "plant", "table"],
    },
  ],
  market: [
    {
      slug: "prep-room",
      name: { en: "Prep Room", es: "Sala de Preparacion" },
      markerType: "doorway",
      shape: "annex",
      objects: ["counter", "stove", "fridge"],
    },
    {
      slug: "pantry",
      name: { en: "Pantry", es: "Despensa" },
      markerType: "building",
      shape: "offset",
      objects: ["shelf", "shelf", "counter"],
    },
    {
      slug: "cafe-patio",
      name: { en: "Cafe Patio", es: "Patio del Cafe" },
      markerType: "pavilion",
      shape: "courtyard",
      objects: ["table", "bench", "plant"],
    },
  ],
  library: [
    {
      slug: "archive-wing",
      name: { en: "Archive Wing", es: "Ala de Archivo" },
      markerType: "doorway",
      shape: "annex",
      objects: ["bookshelf", "bookshelf", "lamp"],
    },
    {
      slug: "reading-nook",
      name: { en: "Reading Nook", es: "Rincon de Lectura" },
      markerType: "doorway",
      shape: "alcove",
      objects: ["table", "bench", "lamp"],
    },
    {
      slug: "front-office",
      name: { en: "Front Office", es: "Oficina Principal" },
      markerType: "building",
      shape: "offset",
      objects: ["desk", "bookshelf", "plant"],
    },
  ],
  transit: [
    {
      slug: "ticket-office",
      name: { en: "Ticket Office", es: "Oficina de Boletos" },
      markerType: "building",
      shape: "offset",
      objects: ["counter", "register", "sign"],
    },
    {
      slug: "gate-lounge",
      name: { en: "Gate Lounge", es: "Sala de Embarque" },
      markerType: "gate",
      shape: "courtyard",
      objects: ["bench", "sign", "suitcaseStack"],
    },
    {
      slug: "travel-desk",
      name: { en: "Travel Desk", es: "Mesa de Viaje" },
      markerType: "building",
      shape: "annex",
      objects: ["desk", "plant", "sign"],
    },
  ],
  nature: [
    {
      slug: "garden-pavilion",
      name: { en: "Garden Pavilion", es: "Pabellon del Jardin" },
      markerType: "pavilion",
      shape: "courtyard",
      objects: ["bench", "plant", "sign"],
    },
    {
      slug: "glasshouse",
      name: { en: "Glasshouse", es: "Invernadero" },
      markerType: "greenhouse",
      shape: "offset",
      objects: ["plant", "plant", "table"],
    },
    {
      slug: "ranger-station",
      name: { en: "Ranger Station", es: "Estacion del Guardabosques" },
      markerType: "building",
      shape: "annex",
      objects: ["desk", "shelf", "bench"],
    },
  ],
  civic: [
    {
      slug: "council-room",
      name: { en: "Council Room", es: "Sala del Consejo" },
      markerType: "building",
      shape: "offset",
      objects: ["desk", "table", "lamp"],
    },
    {
      slug: "records-room",
      name: { en: "Records Room", es: "Sala de Registros" },
      markerType: "building",
      shape: "annex",
      objects: ["bookshelf", "bookshelf", "desk"],
    },
    {
      slug: "courtyard-pavilion",
      name: { en: "Courtyard Pavilion", es: "Pabellon del Patio" },
      markerType: "pavilion",
      shape: "courtyard",
      objects: ["bench", "plant", "sign"],
    },
  ],
  lab: [
    {
      slug: "prep-lab",
      name: { en: "Prep Lab", es: "Laboratorio de Preparacion" },
      markerType: "doorway",
      shape: "annex",
      objects: ["freezer", "table", "lamp"],
    },
    {
      slug: "analysis-booth",
      name: { en: "Analysis Booth", es: "Cabina de Analisis" },
      markerType: "building",
      shape: "offset",
      objects: ["desk", "shelf", "lamp"],
    },
    {
      slug: "equipment-store",
      name: { en: "Equipment Store", es: "Deposito de Equipo" },
      markerType: "building",
      shape: "alcove",
      objects: ["shelf", "freezer", "desk"],
    },
  ],
  festival: [
    {
      slug: "performance-stage",
      name: { en: "Performance Stage", es: "Escenario" },
      markerType: "pavilion",
      shape: "courtyard",
      objects: ["speaker", "speaker", "balloons"],
    },
    {
      slug: "food-stall",
      name: { en: "Food Stall", es: "Puesto de Comida" },
      markerType: "building",
      shape: "offset",
      objects: ["counter", "table", "sign"],
    },
    {
      slug: "craft-tent",
      name: { en: "Craft Tent", es: "Taller Creativo" },
      markerType: "pavilion",
      shape: "annex",
      objects: ["table", "bench", "balloons"],
    },
  ],
};

function createSolidMapData(mapWidth, mapHeight, fillValue = 2) {
  return new Array(mapWidth * mapHeight).fill(fillValue);
}

function setScenarioMapTile(mapData, mapWidth, mapHeight, x, y, value) {
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return;
  mapData[y * mapWidth + x] = value;
}

function fillScenarioMapRect(mapData, mapWidth, mapHeight, x, y, width, height, value) {
  for (let yy = y; yy < y + height; yy++) {
    for (let xx = x; xx < x + width; xx++) {
      setScenarioMapTile(mapData, mapWidth, mapHeight, xx, yy, value);
    }
  }
}

function listScenarioRectTiles(x, y, width, height) {
  const tiles = [];
  for (let yy = y; yy < y + height; yy++) {
    for (let xx = x; xx < x + width; xx++) {
      tiles.push({ tx: xx, ty: yy });
    }
  }
  return tiles;
}

function buildReviewBodyRect(mapWidth, mapHeight, insetX = 1, insetY = 1) {
  const insets =
    typeof insetX === "object" && insetX !== null
      ? insetX
      : {
          west: insetX,
          east: insetX,
          north: insetY,
          south: insetY,
        };
  const x = clampInt(insets.west, 1, Math.max(1, mapWidth - 4), 1);
  const y = clampInt(insets.north, 1, Math.max(1, mapHeight - 4), 1);
  const width = Math.max(3, mapWidth - x - clampInt(insets.east, 1, mapWidth - 3, 1));
  const height = Math.max(
    3,
    mapHeight - y - clampInt(insets.south, 1, mapHeight - 3, 1),
  );
  return { x, y, width, height };
}

function buildReviewPortalInsets(portalFacings = [], seedKey = "review-body") {
  const baseInsets = {
    west: 1,
    east: 1,
    north: 1,
    south: 1,
  };

  Array.from(new Set(portalFacings))
    .filter((facing) => Object.prototype.hasOwnProperty.call(baseInsets, facing))
    .forEach((facing) => {
      baseInsets[facing] = 1 + (hashString(`${seedKey}:${facing}`) % 3);
    });

  return baseInsets;
}

function pickRangePosition(min, max, seedValue, fallback) {
  const clampedMin = Math.min(min, max);
  const clampedMax = Math.max(min, max);
  const span = clampedMax - clampedMin + 1;
  if (span <= 0) return fallback;
  return clampedMin + (Math.abs(seedValue) % span);
}

function carvePortalVestibule(
  mapData,
  mapWidth,
  mapHeight,
  portal,
  bodyRect,
  tileValue = 1,
) {
  const footprint = [];

  if (portal?.facing === "west") {
    for (let x = portal.tx; x < bodyRect.x; x++) {
      setScenarioMapTile(mapData, mapWidth, mapHeight, x, portal.ty, tileValue);
      footprint.push({ tx: x, ty: portal.ty });
    }
  } else if (portal?.facing === "east") {
    for (let x = bodyRect.x + bodyRect.width; x <= portal.tx; x++) {
      setScenarioMapTile(mapData, mapWidth, mapHeight, x, portal.ty, tileValue);
      footprint.push({ tx: x, ty: portal.ty });
    }
  } else if (portal?.facing === "north") {
    for (let y = portal.ty; y < bodyRect.y; y++) {
      setScenarioMapTile(mapData, mapWidth, mapHeight, portal.tx, y, tileValue);
      footprint.push({ tx: portal.tx, ty: y });
    }
  } else {
    for (let y = bodyRect.y + bodyRect.height; y <= portal.ty; y++) {
      setScenarioMapTile(mapData, mapWidth, mapHeight, portal.tx, y, tileValue);
      footprint.push({ tx: portal.tx, ty: y });
    }
  }

  if (portal?.facing === "west") {
    footprint.push({ tx: bodyRect.x, ty: portal.ty });
  } else if (portal?.facing === "east") {
    footprint.push({
      tx: bodyRect.x + bodyRect.width - 1,
      ty: portal.ty,
    });
  } else if (portal?.facing === "north") {
    footprint.push({ tx: portal.tx, ty: bodyRect.y });
  } else {
    footprint.push({
      tx: portal.tx,
      ty: bodyRect.y + bodyRect.height - 1,
    });
  }

  setScenarioMapTile(mapData, mapWidth, mapHeight, portal.tx, portal.ty, tileValue);
  footprint.push({ tx: portal.tx, ty: portal.ty });
  return Array.from(
    new Map(footprint.map((tile) => [`${tile.tx},${tile.ty}`, tile])).values(),
  );
}

function paintScenarioCorridor(mapData, mapWidth, mapHeight, from, to, value = 1) {
  const startX = clampInt(from?.x, 0, mapWidth - 1, 0);
  const startY = clampInt(from?.y, 0, mapHeight - 1, 0);
  const endX = clampInt(to?.x, 0, mapWidth - 1, startX);
  const endY = clampInt(to?.y, 0, mapHeight - 1, startY);

  const stepX = startX <= endX ? 1 : -1;
  for (let x = startX; x !== endX; x += stepX) {
    setScenarioMapTile(mapData, mapWidth, mapHeight, x, startY, value);
  }
  setScenarioMapTile(mapData, mapWidth, mapHeight, endX, startY, value);

  const stepY = startY <= endY ? 1 : -1;
  for (let y = startY; y !== endY; y += stepY) {
    setScenarioMapTile(mapData, mapWidth, mapHeight, endX, y, value);
  }
  setScenarioMapTile(mapData, mapWidth, mapHeight, endX, endY, value);
}

function scatterScenarioDecor(mapData, mapWidth, mapHeight, seed, chance = 0.08) {
  const rng = mulberry32(seed);
  for (let y = 1; y < mapHeight - 1; y++) {
    for (let x = 1; x < mapWidth - 1; x++) {
      const idx = y * mapWidth + x;
      if (mapData[idx] !== 0 || rng() > chance) continue;
      mapData[idx] = 5;
    }
  }
}

function getInteriorSpawnForPortal(portal, mapWidth, mapHeight) {
  const x = Number(portal?.tx) || 0;
  const y = Number(portal?.ty) || 0;
  if (portal?.facing === "west") return { x: clampInt(x + 1, 1, mapWidth - 2, x), y };
  if (portal?.facing === "east") return { x: clampInt(x - 1, 1, mapWidth - 2, x), y };
  if (portal?.facing === "north") return { x, y: clampInt(y + 1, 1, mapHeight - 2, y) };
  return { x, y: clampInt(y - 1, 1, mapHeight - 2, y) };
}

function getPortalMarkerTile(portal, mapWidth, mapHeight) {
  const x = Number(portal?.tx) || 0;
  const y = Number(portal?.ty) || 0;
  if (portal?.facing === "west") {
    return { tx: clampInt(x + 1, 0, mapWidth - 1, x), ty: y };
  }
  if (portal?.facing === "east") {
    return { tx: clampInt(x - 1, 0, mapWidth - 1, x), ty: y };
  }
  if (portal?.facing === "north") {
    return { tx: x, ty: clampInt(y + 1, 0, mapHeight - 1, y) };
  }
  return { tx: x, ty: clampInt(y - 1, 0, mapHeight - 1, y) };
}

function isGeneratedTileWalkable(tileType) {
  return tileType === 0 || tileType === 1 || tileType === 5;
}

function getReachableGeneratedTiles(mapData, mapWidth, mapHeight, start) {
  const startX = clampInt(start?.x, 0, mapWidth - 1, 0);
  const startY = clampInt(start?.y, 0, mapHeight - 1, 0);
  const queue = [{ x: startX, y: startY }];
  const visited = new Set([`${startX},${startY}`]);

  while (queue.length) {
    const current = queue.shift();
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    neighbors.forEach((neighbor) => {
      if (
        neighbor.x < 0 ||
        neighbor.y < 0 ||
        neighbor.x >= mapWidth ||
        neighbor.y >= mapHeight
      ) {
        return;
      }
      const key = `${neighbor.x},${neighbor.y}`;
      if (visited.has(key)) return;
      const tileType = mapData[neighbor.y * mapWidth + neighbor.x];
      if (!isGeneratedTileWalkable(tileType)) return;
      visited.add(key);
      queue.push(neighbor);
    });
  }

  return visited;
}

function ensurePortalsReachable(mapData, mapWidth, mapHeight, playerStart, portals = []) {
  const next = [...mapData];
  (portals || []).forEach((portal) => {
    const reachable = getReachableGeneratedTiles(
      next,
      mapWidth,
      mapHeight,
      playerStart,
    );
    const key = `${portal.tx},${portal.ty}`;
    if (!reachable.has(key)) {
      paintScenarioCorridor(
        next,
        mapWidth,
        mapHeight,
        playerStart,
        { x: portal.tx, y: portal.ty },
        1,
      );
    }
    setScenarioMapTile(next, mapWidth, mapHeight, portal.tx, portal.ty, 1);
  });
  return next;
}

function pickReviewReturnFacing(shape, seedKey = "room") {
  const facingChoicesByShape = {
    annex: ["east", "south", "west"],
    alcove: ["west", "south", "east"],
    courtyard: ["east", "west", "north", "south"],
    offset: ["east", "south", "north", "west"],
  };
  const facingChoices =
    facingChoicesByShape[shape] || ["south", "east", "west", "north"];
  const facingSeed = hashString(`${seedKey}:facing`);
  return facingChoices[facingSeed % facingChoices.length];
}

function buildReviewReturnPortal(facing, mapWidth, mapHeight, seedKey = "room", bodyRect) {
  const offsetSeed = hashString(`${seedKey}:offset`);

  if (facing === "west" || facing === "east") {
    const ty = pickRangePosition(
      bodyRect.y + 1,
      bodyRect.y + bodyRect.height - 2,
      offsetSeed,
      Math.floor(mapHeight / 2),
    );
    return {
      tx: facing === "west" ? 0 : mapWidth - 1,
      ty,
      facing,
    };
  }

  const tx = pickRangePosition(
    bodyRect.x + 1,
    bodyRect.x + bodyRect.width - 2,
    offsetSeed,
    Math.floor(mapWidth / 2),
  );
  return {
    tx,
    ty: facing === "north" ? 0 : mapHeight - 1,
    facing,
  };
}

function getReviewRoomSpecs(environment) {
  const blueprintId = environment?.blueprintId || "home";
  const baseSpecs = REVIEW_ROOM_BLUEPRINTS[blueprintId] || REVIEW_ROOM_BLUEPRINTS.home;
  return baseSpecs.map((spec, idx) => ({
    ...spec,
    mapId: `review-room-${idx + 1}-${spec.slug}`,
  }));
}

function buildReviewHubLayout(area, mapWidth, mapHeight) {
  const mapData = createSolidMapData(mapWidth, mapHeight, 2);
  const portalFacings =
    area === "urban" || area === "outdoor"
      ? ["west", "north", "east"]
      : ["west", "east", "east"];
  const bodyRect = buildReviewBodyRect(
    mapWidth,
    mapHeight,
    buildReviewPortalInsets(
      portalFacings,
      `${area || "review"}:${mapWidth}:${mapHeight}:hub`,
    ),
  );
  const bodyCenterX = bodyRect.x + Math.floor(bodyRect.width / 2);
  const bodyCenterY = bodyRect.y + Math.floor(bodyRect.height / 2);
  let portalSlots = [];
  let portalReservedTiles = [];
  let defaultPlayerStart = { x: bodyCenterX, y: bodyCenterY };

  fillScenarioMapRect(
    mapData,
    mapWidth,
    mapHeight,
    bodyRect.x,
    bodyRect.y,
    bodyRect.width,
    bodyRect.height,
    0,
  );

  if (area === "urban") {
    portalSlots = [
      { tx: 0, ty: bodyCenterY, facing: "west" },
      { tx: bodyCenterX, ty: 0, facing: "north" },
      {
        tx: mapWidth - 1,
        ty: pickRangePosition(
          bodyRect.y + 1,
          bodyRect.y + bodyRect.height - 2,
          bodyCenterY - 3,
          bodyCenterY,
        ),
        facing: "east",
      },
    ];
    defaultPlayerStart = {
      x: bodyCenterX,
      y: clampInt(bodyCenterY + 1, bodyRect.y + 1, bodyRect.y + bodyRect.height - 2, bodyCenterY),
    };
  } else if (area === "outdoor") {
    portalSlots = [
      { tx: 0, ty: bodyCenterY, facing: "west" },
      { tx: bodyCenterX, ty: 0, facing: "north" },
      {
        tx: mapWidth - 1,
        ty: pickRangePosition(
          bodyRect.y + 1,
          bodyRect.y + bodyRect.height - 2,
          bodyCenterY + 2,
          bodyCenterY,
        ),
        facing: "east",
      },
    ];
  } else {
    const upperRangeMax = Math.max(bodyRect.y + 1, bodyCenterY - 1);
    const lowerRangeMin = Math.min(bodyRect.y + bodyRect.height - 2, bodyCenterY + 1);
    portalSlots = [
      { tx: 0, ty: bodyCenterY, facing: "west" },
      {
        tx: mapWidth - 1,
        ty: pickRangePosition(
          bodyRect.y + 1,
          upperRangeMax,
          hashString(`${area || "review"}:upper`),
          bodyRect.y + 1,
        ),
        facing: "east",
      },
      {
        tx: mapWidth - 1,
        ty: pickRangePosition(
          lowerRangeMin,
          bodyRect.y + bodyRect.height - 2,
          hashString(`${area || "review"}:lower`),
          bodyRect.y + bodyRect.height - 2,
        ),
        facing: "east",
      },
    ];
  }

  portalReservedTiles = portalSlots.flatMap((portal) =>
    carvePortalVestibule(
      mapData,
      mapWidth,
      mapHeight,
      portal,
      bodyRect,
      1,
    ),
  );
  portalSlots.forEach((portal) => {
    setScenarioMapTile(mapData, mapWidth, mapHeight, portal.tx, portal.ty, 1);
  });
  scatterScenarioDecor(mapData, mapWidth, mapHeight, hashString(`${area}-${mapWidth}-${mapHeight}`), area === "outdoor" ? 0.12 : 0.06);

  return {
    mapData,
    portalSlots,
    portalReservedTiles,
    defaultPlayerStart,
  };
}

function buildReviewRoomLayout(shape, mapWidth, mapHeight, seedKey = "room") {
  const mapData = createSolidMapData(mapWidth, mapHeight, 2);
  const returnFacing = pickReviewReturnFacing(shape, seedKey);
  const bodyRect = buildReviewBodyRect(
    mapWidth,
    mapHeight,
    buildReviewPortalInsets([returnFacing], `${seedKey}:room`),
  );
  const bodyCenterX = bodyRect.x + Math.floor(bodyRect.width / 2);
  const bodyCenterY = bodyRect.y + Math.floor(bodyRect.height / 2);
  fillScenarioMapRect(
    mapData,
    mapWidth,
    mapHeight,
    bodyRect.x,
    bodyRect.y,
    bodyRect.width,
    bodyRect.height,
    0,
  );

  if (shape === "courtyard") {
    fillScenarioMapRect(
      mapData,
      mapWidth,
      mapHeight,
      bodyCenterX - 1,
      bodyCenterY - 1,
      3,
      3,
      5,
    );
  }

  const returnPortal = buildReviewReturnPortal(
    returnFacing,
    mapWidth,
    mapHeight,
    seedKey,
    bodyRect,
  );
  const defaultPlayerStart = {
    x: bodyCenterX,
    y: clampInt(
      bodyCenterY + 1,
      bodyRect.y + 1,
      bodyRect.y + bodyRect.height - 2,
      bodyCenterY,
    ),
  };
  const portalBufferTiles = carvePortalVestibule(
    mapData,
    mapWidth,
    mapHeight,
    returnPortal,
    bodyRect,
    1,
  );

  paintScenarioCorridor(
    mapData,
    mapWidth,
    mapHeight,
    {
      x: bodyCenterX,
      y: clampInt(
        bodyRect.y + bodyRect.height - 2,
        bodyRect.y + 1,
        bodyRect.y + bodyRect.height - 2,
        bodyCenterY,
      ),
    },
    { x: bodyCenterX, y: bodyCenterY },
    1,
  );
  setScenarioMapTile(mapData, mapWidth, mapHeight, returnPortal.tx, returnPortal.ty, 1);
  scatterScenarioDecor(mapData, mapWidth, mapHeight, hashString(seedKey), 0.05);

  return {
    mapData,
    returnPortal,
    portalBufferTiles,
    defaultPlayerStart,
  };
}

function buildReviewWorldMaps({
  environment,
  tiles,
  ambientColor,
  requestedPlayerStart,
  npcs,
}) {
  const roomSpecs = getReviewRoomSpecs(environment);
  const hubWidth = environment?.area === "outdoor" ? 26 : 24;
  const hubHeight = 18;
  const hubLayout = buildReviewHubLayout(environment?.area, hubWidth, hubHeight);
  const hubPlayerStart = {
    x: clampInt(requestedPlayerStart?.x, 1, hubWidth - 2, hubLayout.defaultPlayerStart.x),
    y: clampInt(requestedPlayerStart?.y, 1, hubHeight - 2, hubLayout.defaultPlayerStart.y),
  };

  const npcEntries = (npcs || []).map((npc) => ({
    ...npc,
    mapId: REVIEW_HUB_MAP_ID,
  }));
  const hubOccupied = [
    { tx: hubPlayerStart.x, ty: hubPlayerStart.y },
    ...npcEntries,
    ...(hubLayout.portalReservedTiles || []),
    ...hubLayout.portalSlots,
  ];

  const hubObjectsBase = normalizeScenarioObjects(
    environment?.suggestedObjects || [],
    environment,
    hubWidth,
    hubHeight,
    hubOccupied,
  ).filter(
    (object) =>
      !hubLayout.portalSlots.some((portal) => portal.tx === object.tx && portal.ty === object.ty),
  );

  const subMaps = roomSpecs.map((spec, idx) => {
    const roomWidth = environment?.area === "outdoor" ? 18 : 16;
    const roomHeight = environment?.area === "outdoor" ? 14 : 13;
    const roomEnvironment = {
      ...environment,
      suggestedObjects: spec.objects,
    };
    const layout = buildReviewRoomLayout(
      spec.shape,
      roomWidth,
      roomHeight,
      `${environment?.blueprintId || "home"}-${spec.slug}`,
    );
    const roomObjects = normalizeScenarioObjects(
      spec.objects,
      roomEnvironment,
      roomWidth,
      roomHeight,
      [
        layout.defaultPlayerStart,
        layout.returnPortal,
        ...(layout.portalBufferTiles || []),
      ],
    ).filter(
      (object) =>
        !(object.tx === layout.returnPortal.tx && object.ty === layout.returnPortal.ty),
    );

    const combinedMapData = ensureWalkableTiles(
      ensurePortalsReachable(
        applyObjectCollisions(
          layout.mapData,
          roomObjects,
          roomWidth,
          roomHeight,
        ),
        roomWidth,
        roomHeight,
        layout.defaultPlayerStart,
        [layout.returnPortal],
      ),
      roomWidth,
      [layout.defaultPlayerStart, layout.returnPortal],
    );

    return {
      id: spec.mapId,
      name: spec.name,
      tileSize: 32,
      mapWidth: roomWidth,
      mapHeight: roomHeight,
      playerStart: layout.defaultPlayerStart,
      ambientColor,
      tiles,
      environment: roomEnvironment,
      reservedTiles: layout.portalBufferTiles || [],
      objects: roomObjects,
      portals: [
        {
          ...layout.returnPortal,
          toMapId: REVIEW_HUB_MAP_ID,
          spawn: getInteriorSpawnForPortal(
            hubLayout.portalSlots[idx],
            hubWidth,
            hubHeight,
          ),
          label: environment?.names?.en || "Main Area",
        },
      ],
      generate() {
        return combinedMapData;
      },
    };
  });

  const hubPortals = roomSpecs.map((spec, idx) => ({
    ...hubLayout.portalSlots[idx],
    toMapId: spec.mapId,
    spawn: subMaps[idx]?.playerStart || { x: 2, y: 2 },
    label: spec.name,
  }));

  const hubCombinedMapData = ensureWalkableTiles(
    ensurePortalsReachable(
      applyObjectCollisions(
        hubLayout.mapData,
        hubObjectsBase,
        hubWidth,
        hubHeight,
      ),
      hubWidth,
      hubHeight,
      hubPlayerStart,
      hubPortals,
    ),
    hubWidth,
    [
      { x: hubPlayerStart.x, y: hubPlayerStart.y },
      ...npcEntries,
      ...hubPortals,
    ],
  );

  const hubMap = {
    id: REVIEW_HUB_MAP_ID,
    name: environment?.names || {
      en: "Lesson World",
      es: "Mundo de Leccion",
    },
    tileSize: 32,
    mapWidth: hubWidth,
    mapHeight: hubHeight,
    playerStart: hubPlayerStart,
    ambientColor,
    tiles,
    environment,
    reservedTiles: hubLayout.portalReservedTiles || [],
    objects: hubObjectsBase,
    portals: hubPortals,
    generate() {
      return hubCombinedMapData;
    },
  };

  return {
    startMapId: REVIEW_HUB_MAP_ID,
    maps: [hubMap, ...subMaps],
    npcs: npcEntries,
  };
}

function getScenarioMapById(scenario, mapId) {
  if (!scenario) return null;
  if (!Array.isArray(scenario.maps) || !scenario.maps.length) return scenario;
  return (
    scenario.maps.find((entry) => entry.id === mapId) ||
    scenario.maps.find((entry) => entry.id === scenario.startMapId) ||
    scenario.maps[0]
  );
}

function hashString(text = "") {
  let hash = 0;
  const source = String(text);
  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function getScenarioMapData(map) {
  return typeof map?.generate === "function" ? map.generate() : [];
}

function isScenarioMapWalkable(map, mapData, x, y) {
  if (!map || x < 0 || y < 0 || x >= map.mapWidth || y >= map.mapHeight) return false;
  const tileType = mapData[y * map.mapWidth + x];
  const tileDef = map.tiles?.[tileType];
  return !!tileDef && !tileDef.solid;
}

function buildMapOccupiedSet(map) {
  const occupied = new Set();
  (map?.objects || []).forEach((object) => occupied.add(`${object.tx},${object.ty}`));
  (map?.portals || []).forEach((portal) => occupied.add(`${portal.tx},${portal.ty}`));
  (map?.reservedTiles || []).forEach((tile) => occupied.add(`${tile.tx},${tile.ty}`));
  if (map?.playerStart) occupied.add(`${map.playerStart.x},${map.playerStart.y}`);
  return occupied;
}

function getReachablePlacementCandidates(map, occupied = new Set(), minDistance = 2) {
  const mapData = getScenarioMapData(map);
  const start = map?.playerStart || { x: 1, y: 1 };
  const startKey = `${start.x},${start.y}`;
  const queue = [{ x: start.x, y: start.y, dist: 0 }];
  const visited = new Set([`${start.x},${start.y}`]);
  const candidates = [];

  while (queue.length) {
    const current = queue.shift();
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    let approachableNeighbors = 0;
    neighbors.forEach((neighbor) => {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (isScenarioMapWalkable(map, mapData, neighbor.x, neighbor.y)) {
        const isUsableApproachTile =
          !occupied.has(neighborKey) || neighborKey === startKey;
        if (isUsableApproachTile) {
          approachableNeighbors += 1;
        }
      }
      if (visited.has(neighborKey)) return;
      if (!isScenarioMapWalkable(map, mapData, neighbor.x, neighbor.y)) return;
      visited.add(neighborKey);
      queue.push({ x: neighbor.x, y: neighbor.y, dist: current.dist + 1 });
    });

    const key = `${current.x},${current.y}`;
    if (
      current.dist >= minDistance &&
      !occupied.has(key) &&
      !(current.x === start.x && current.y === start.y) &&
      approachableNeighbors >= 1
    ) {
      candidates.push({
        tx: current.x,
        ty: current.y,
        dist: current.dist,
        openNeighbors: approachableNeighbors,
      });
    }
  }

  return candidates;
}

function choosePlacementTilesForMap(
  map,
  count,
  occupied = new Set(),
  seedKey = "placements",
  options = {},
) {
  const preferFar = options.preferFar !== false;
  const minDistances = [options.minDistance ?? 2, 1, 0];
  let candidates = [];
  for (const minDistance of minDistances) {
    candidates = getReachablePlacementCandidates(map, occupied, minDistance);
    if (candidates.length >= count || minDistance === 0) break;
  }

  const rng = mulberry32(hashString(seedKey));
  const placements = [];
  let available = [...candidates];

  while (placements.length < count && available.length) {
    available.sort((a, b) => {
      const farDelta = preferFar ? b.dist - a.dist : a.dist - b.dist;
      return farDelta || b.openNeighbors - a.openNeighbors;
    });
    const pool = available.slice(0, Math.min(6, available.length));
    const pick = pool[Math.floor(rng() * pool.length)] || available[0];
    placements.push(pick);
    occupied.add(`${pick.tx},${pick.ty}`);
    available = available.filter((candidate) => {
      const sameTile = candidate.tx === pick.tx && candidate.ty === pick.ty;
      const tooClose =
        Math.abs(candidate.tx - pick.tx) + Math.abs(candidate.ty - pick.ty) <= 1;
      return !sameTile && !tooClose;
    });
  }

  return placements;
}

function distributeReviewWorldNPCs(scenario, quest) {
  if (
    scenario?.id !== REVIEW_WORLD_ID ||
    !Array.isArray(scenario?.maps) ||
    scenario.maps.length < 2 ||
    !Array.isArray(scenario?.npcs)
  ) {
    return scenario;
  }

  const hubId = scenario.startMapId || REVIEW_HUB_MAP_ID;
  const roomMaps = scenario.maps.filter((map) => map.id !== hubId);
  const stepOrder = Array.from(
    new Set(
      (quest?.steps || [])
        .map((step) => step?.npcIdx)
        .filter((value) => Number.isInteger(value)),
    ),
  );
  const startNpcIdx = Number.isInteger(quest?.startNpcIdx)
    ? quest.startNpcIdx
    : stepOrder[0] || 0;
  const roomNpcIndices = stepOrder
    .filter((idx) => idx !== startNpcIdx)
    .slice(0, roomMaps.length);

  if (!roomNpcIndices.length && scenario.npcs.length > 1 && roomMaps.length > 0) {
    const fallbackNpcIdx = scenario.npcs.findIndex((_, idx) => idx !== startNpcIdx);
    if (fallbackNpcIdx >= 0) roomNpcIndices.push(fallbackNpcIdx);
  }

  const assignedMapByNpc = new Map();
  roomNpcIndices.forEach((npcIdx, roomIdx) => {
    assignedMapByNpc.set(npcIdx, roomMaps[roomIdx]?.id);
  });

  const mapsById = new Map(scenario.maps.map((map) => [map.id, map]));
  const nextNpcs = scenario.npcs.map((npc, idx) => ({
    ...npc,
    mapId: assignedMapByNpc.get(idx) || hubId,
  }));

  const npcIndicesByMap = new Map();
  nextNpcs.forEach((npc, idx) => {
    const mapId = npc.mapId || hubId;
    if (!npcIndicesByMap.has(mapId)) npcIndicesByMap.set(mapId, []);
    npcIndicesByMap.get(mapId).push(idx);
  });

  npcIndicesByMap.forEach((npcIndices, mapId) => {
    const map = mapsById.get(mapId);
    if (!map) return;
    const occupied = buildMapOccupiedSet(map);
    const placements = choosePlacementTilesForMap(
      map,
      npcIndices.length,
      occupied,
      `${scenario.id || "review"}:${mapId}:${quest?.storySeed || ""}:npcs`,
      {
        preferFar: mapId !== hubId,
        minDistance: mapId !== hubId ? 3 : 2,
      },
    );

    npcIndices.forEach((npcIdx, order) => {
      const placement =
        placements[order] ||
        placements[placements.length - 1] ||
        map.playerStart || { x: 2, y: 2 };
      nextNpcs[npcIdx] = {
        ...nextNpcs[npcIdx],
        tx: placement.tx ?? placement.x,
        ty: placement.ty ?? placement.y,
      };
    });
  });

  return {
    ...scenario,
    npcs: nextNpcs,
  };
}

function buildGatherPlacementsForScenario(scenario, quest) {
  const items = Array.isArray(quest?.gatherData?.all) ? quest.gatherData.all : [];
  if (!items.length) return [];

  const maps = Array.isArray(scenario?.maps) && scenario.maps.length
    ? scenario.maps
    : [scenario].filter(Boolean);
  if (!maps.length) return [];

  const defaultMapId = scenario?.startMapId || maps[0]?.id || REVIEW_HUB_MAP_ID;
  const mapsById = new Map(maps.map((map) => [map.id, map]));
  const placementStateByMapId = new Map();
  maps.forEach((map) => {
    const occupied = buildMapOccupiedSet(map);
    (scenario?.npcs || [])
      .filter((npc) => (npc.mapId || defaultMapId) === map.id)
      .forEach((npc) => occupied.add(`${npc.tx},${npc.ty}`));
    placementStateByMapId.set(map.id, {
      map,
      occupied,
    });
  });

  const reviewHubId = scenario?.startMapId || REVIEW_HUB_MAP_ID;
  const roomMapIds = maps
    .map((map) => map.id)
    .filter((mapId) => mapId && mapId !== reviewHubId);
  const roomMapIdsWithNpcs = Array.from(
    new Set(
      (scenario?.npcs || [])
        .map((npc) => npc.mapId || reviewHubId)
        .filter((mapId) => mapId && mapId !== reviewHubId),
    ),
  ).filter((mapId) => mapsById.has(mapId));
  const preferredRoomMapIds = roomMapIdsWithNpcs.length
    ? roomMapIdsWithNpcs
    : roomMapIds;

  const targetedMapByItemIndex = new Map();
  if (scenario?.id === REVIEW_WORLD_ID && preferredRoomMapIds.length) {
    const firstCorrectIdx = items.findIndex((item) => item?.isCorrect);
    const roomFocusIndices = [];
    if (firstCorrectIdx >= 0) roomFocusIndices.push(firstCorrectIdx);
    const firstDecoyIdx = items.findIndex((item, idx) => idx !== firstCorrectIdx);
    if (firstDecoyIdx >= 0) roomFocusIndices.push(firstDecoyIdx);
    roomFocusIndices.forEach((itemIdx, roomIdx) => {
      targetedMapByItemIndex.set(
        itemIdx,
        preferredRoomMapIds[Math.min(roomIdx, preferredRoomMapIds.length - 1)],
      );
    });
  }

  const reviewPlacementRotation =
    scenario?.id === REVIEW_WORLD_ID
      ? [reviewHubId, ...preferredRoomMapIds].filter((value, idx, array) => value && array.indexOf(value) === idx)
      : maps.map((map) => map.id);
  let rotationCursor = 0;

  return items.map((item, idx) => {
    const preferredMapId =
      targetedMapByItemIndex.get(idx) ||
      reviewPlacementRotation[rotationCursor % reviewPlacementRotation.length] ||
      defaultMapId;
    rotationCursor += 1;

    const placementState =
      placementStateByMapId.get(preferredMapId) ||
      placementStateByMapId.get(defaultMapId) ||
      placementStateByMapId.values().next().value;
    const placementMap = placementState?.map;
    const occupied = placementState?.occupied || new Set();
    const placement = choosePlacementTilesForMap(
      placementMap,
      1,
      occupied,
      `${scenario?.id || "scenario"}:${preferredMapId}:${quest?.intro || ""}:gather:${idx}`,
      {
        preferFar: preferredMapId !== reviewHubId,
        minDistance: preferredMapId !== reviewHubId ? 3 : 2,
      },
    )[0];
    const fallbackPlacement = placementMap?.playerStart || { x: 2, y: 2 };

    return {
      ...item,
      mapId: placementMap?.id || defaultMapId,
      tx: placement?.tx ?? fallbackPlacement.x,
      ty: placement?.ty ?? fallbackPlacement.y,
      collected: false,
    };
  });
}

async function fallbackScenario(
  mapId,
  targetLang,
  supportLang,
  lessonTerms = [],
  cefrLevel = null,
  reviewContext = null,
) {
  if (mapId !== REVIEW_WORLD_ID) {
    const name = { en: getMapName(mapId, "en"), es: getMapName(mapId, "es"), it: getMapName(mapId, "it") };
    const mapWidth = 18;
    const mapHeight = 14;

    const questionsByLang = {
      [targetLang]: normalizeQuestions([], supportLang),
      en: normalizeQuestions([], supportLang),
      es: normalizeQuestions([], supportLang),
    };

    const allFallbackNpcs = [
      { tx: 4, ty: 4, name: "Ada", presetIdx: 0 },
      { tx: 8, ty: 6, name: "Bruno", presetIdx: 1 },
      { tx: 12, ty: 8, name: "Cleo", presetIdx: 2 },
      { tx: 14, ty: 4, name: "Dana", presetIdx: 3 },
    ];
    const npcCount = 2 + Math.floor(Math.random() * 3); // 2-4
    const npcs = allFallbackNpcs.slice(0, npcCount);

    const quest = await adaptQuestForReviewContext(
      normalizeQuest(
        null,
        npcs,
        questionsByLang,
        supportLang,
        targetLang,
        mapId,
        cefrLevel,
        reviewContext,
      ),
      targetLang,
      cefrLevel,
      reviewContext,
      npcs.map((npc) => npc.name),
    );
    const visualizedQuest = await enrichQuestGatherVisuals(
      quest,
      targetLang,
      reviewContext,
      null,
    );

    return {
      id: mapId,
      name,
      tileSize: 32,
      mapWidth,
      mapHeight,
      playerStart: { x: 3, y: 3 },
      ambientColor: 0x1f2937,
      tiles: getTileLibrary(mapId),
      objects: [],
      environment: null,
      emoji: null,
      generate() {
        const map = new Array(mapWidth * mapHeight).fill(0);
        for (let x = 0; x < mapWidth; x++) {
          map[x] = 2;
          map[(mapHeight - 1) * mapWidth + x] = 2;
        }
        for (let y = 0; y < mapHeight; y++) {
          map[y * mapWidth] = 2;
          map[y * mapWidth + (mapWidth - 1)] = 2;
        }
        return map;
      },
      npcs,
      questions: questionsByLang,
      quest: visualizedQuest,
      greetings: {
        en: ["Generating scenario unavailable; using safe fallback."],
        es: ["Generacion no disponible; usando respaldo."],
      },
    };
  }

  const environment = buildScenarioEnvironment(null, lessonTerms, mapId);
  const playerStart = { x: 3, y: 3 };
  const ambientColor = 0x1f2937;

  const questionsByLang = {
    [targetLang]: normalizeQuestions([], supportLang),
    en: normalizeQuestions([], supportLang),
    es: normalizeQuestions([], supportLang),
  };

  const allFallbackNpcs = [
    { tx: 4, ty: 4, name: "Ada", presetIdx: 0 },
    { tx: 8, ty: 6, name: "Bruno", presetIdx: 1 },
    { tx: 12, ty: 8, name: "Cleo", presetIdx: 2 },
    { tx: 14, ty: 4, name: "Dana", presetIdx: 3 },
  ];
  const npcCount = 2 + Math.floor(Math.random() * 3); // 2-4
  const npcs = allFallbackNpcs.slice(0, npcCount);
  const reviewMaps = buildReviewWorldMaps({
    environment,
    tiles: getTileLibrary(mapId, environment),
    ambientColor,
    requestedPlayerStart: playerStart,
    npcs,
  });
  const hubMap = reviewMaps.maps[0];

  const quest = await adaptQuestForReviewContext(
    normalizeQuest(
      null,
      reviewMaps.npcs,
      questionsByLang,
      supportLang,
      targetLang,
      environment,
      cefrLevel,
      reviewContext,
    ),
    targetLang,
    cefrLevel,
    reviewContext,
  );
  const visualizedQuest = await enrichQuestGatherVisuals(
    quest,
    targetLang,
    reviewContext,
    environment,
  );
  const baseScenario = {
    id: mapId,
    name: environment?.names || {
      en: getMapName(mapId, "en"),
      es: getMapName(mapId, "es"),
      it: getMapName(mapId, "it"),
    },
    tileSize: 32,
    mapWidth: hubMap.mapWidth,
    mapHeight: hubMap.mapHeight,
    playerStart: hubMap.playerStart,
    ambientColor,
    tiles: hubMap.tiles,
    environment,
    objects: hubMap.objects,
    emoji: environment?.emoji || "✨",
    startMapId: reviewMaps.startMapId,
    maps: reviewMaps.maps,
    generate() {
      return hubMap.generate();
    },
    npcs: reviewMaps.npcs,
    questions: questionsByLang,
    quest: visualizedQuest,
    greetings: {
      en: [
        "Scenario generation was incomplete, so we built a lesson-themed world locally.",
      ],
      es: [
        "La generacion fue incompleta, asi que creamos un mundo del tema de la leccion.",
      ],
    },
  };
  const populatedFallbackScenario = distributeReviewWorldNPCs(
    baseScenario,
    visualizedQuest,
  );

  return {
    ...populatedFallbackScenario,
    quest: visualizedQuest,
    gatherPlacements: buildGatherPlacementsForScenario(
      populatedFallbackScenario,
      visualizedQuest,
    ),
  };
}

const CEFR_DIALOGUE_GUIDANCE = {
  "Pre-A1":
    "Use only the most basic words (1-3 word phrases). Very simple greetings and labels. No grammar complexity.",
  A1: "Use short, simple sentences (5-8 words max). Present tense only. Basic everyday vocabulary. NPC dialogue should be easy to understand for absolute beginners.",
  A2: "Use simple sentences and common expressions. Present and simple past tense. Everyday situations and familiar topics. Short dialogue turns.",
  B1: "Use moderately complex sentences. Mix of tenses allowed. Can include opinions and explanations. Connected discourse but still clear.",
  B2: "Use varied sentence structures. All tenses appropriate. Can include abstract topics, idioms, and nuanced language.",
  C1: "Use sophisticated language with complex structures. Idiomatic expressions, subtle humor, and advanced vocabulary expected.",
  C2: "Use native-level language with full range of expression. Literary references, wordplay, and highly nuanced dialogue welcome.",
};

function buildPrompt({
  mapId,
  targetLang,
  supportLang,
  lessonTerms,
  npcCount,
  cefrLevel,
  reviewContext,
}) {
  const normalizedTargetLang = normalizePracticeLanguage(targetLang, "es");
  const normalizedSupportLang = normalizeSupportLanguage(supportLang, "en");
  const targetLangName = resolveTargetLanguageName(normalizedTargetLang);
  const supportLangName = resolveTargetLanguageName(normalizedSupportLang);
  const languageGuard = buildTargetLanguageGuard(
    normalizedTargetLang,
    normalizedSupportLang,
  );
  const levelKey = cefrLevel || "A1";
  const reviewContextBlock = buildReviewContextBlock(
    reviewContext,
    lessonTerms,
    levelKey,
  );
  const worldSeed =
    mapId === REVIEW_WORLD_ID
      ? buildLessonWorldSeed(reviewContextBlock.lessonTerms, { mapId })
      : null;
  const dialogueGuidance =
    CEFR_DIALOGUE_GUIDANCE[levelKey] || CEFR_DIALOGUE_GUIDANCE.A1;
  const supportedObjects = getSupportedObjectTypes().join(", ");
  const supportedDecor = getSupportedDecorKinds().join(", ");

  if (mapId === REVIEW_WORLD_ID) {
    return `You generate JSON for a 2D JRPG language-learning review world.
Return ONLY valid JSON (no markdown).

Target language: ${targetLangName} (code: ${normalizedTargetLang})
Support language: ${supportLangName} (code: ${normalizedSupportLang})
CEFR proficiency level: ${levelKey}

${languageGuard}
CRITICAL - Language difficulty: ${dialogueGuidance}
ALL NPC dialogue, quest text, questions, and greetings MUST match ${levelKey} proficiency level.
${reviewContextBlock.promptBlock ? `\n${reviewContextBlock.promptBlock}\n` : ""}

This is NOT a preset map picker. Invent one unique environment that fits the lesson topics naturally.
If the lesson feels domestic, include home details like a TV or sofa.
If it feels literary or academic, include bookshelves, desks, lamps, and reading spaces.
If it feels travel-related, make it feel international with gates, signs, counters, waiting areas, and luggage.
If it feels scientific, include equipment and workstations.
If it feels social or celebratory, add speakers, tables, decorations, and event details.
Design the setting so it can plausibly include connected side areas such as rooms, wings, buildings, pavilions, gardens, or stations.

Suggested world direction:
- ${worldSeed?.promptHint || "Create a detailed lesson-based environment."}
- Example tone/setting inspiration: ${worldSeed?.summary?.en || "rich, specific, and grounded"}

Use these curriculum terms for the world and question content:
${reviewContextBlock.lessonTerms.join(", ")}

Supported decor kinds: ${supportedDecor}
Supported object types: ${supportedObjects}

Required JSON shape:
{
  "name": {"en": "...", "es": "..."},
  "ambientColor": "hex like #87ceeb",
  "mapWidth": 18-26,
  "mapHeight": 12-18,
  "playerStart": {"x": int, "y": int},
  "npcs": [
    {"tx": int, "ty": int, "name": "...", "presetIdx": 0-3}
  ],
  "mapData": [flat array length mapWidth*mapHeight, values only 0..6],
  "environment": {
    "themeLabel": {"en": "...", "es": "..."},
    "summary": {"en": "...", "es": "..."},
    "emoji": "one emoji",
    "details": ["...", "..."],
    "decorKinds": ["one of supported decor kinds"],
    "keyObjects": [
      {"type": "one supported object type", "zone": "edge|interior|center|corner|entrance"}
    ]
  },
  "objects": [
    {"type": "one supported object type", "tx": int, "ty": int}
  ],
  "questions": [
    {"prompt": "...", "options": ["...","...","...","..."], "correct": 0-3}
  ],
  "quest": {
    "intro": "one sentence in TARGET language at ${levelKey} level",
    "storySeed": "one dramatic sentence in TARGET language at ${levelKey} level describing the main mystery",
    "startNpcIdx": 0
  },
  "greetings": {
    "en": ["...", "...", "..."],
    "es": ["...", "...", "..."]
  }
}

Tile semantics for mapData:
0 walkable ground
1 walkable path
2 solid wall/boundary
3 solid natural barrier
4 solid obstacle
5 walkable scenic decoration
6 solid furniture/object footprint

Constraints:
- Exactly ${npcCount} NPCs in the npcs array.
- At least 8 questions, all at ${levelKey} difficulty.
- Questions should directly test the curriculum terms listed above.
- Only refer to named people who appear in the npcs array. Do not invent or mention any off-screen named characters.
- Make the world feel specific and lived-in, not generic.
- Ensure playerStart and NPCs are in-bounds.
- Keep mapData playable and navigable.
- Use only the supported decor kinds and object types.
- No extra keys.`;
  }

  return `You generate JSON for a 2D JRPG language-learning scenario.
Return ONLY valid JSON (no markdown).

Map theme requested: ${getMapName(mapId, "en")} (${mapId}).
Target language: ${targetLangName} (code: ${normalizedTargetLang})
Support language: ${supportLangName} (code: ${normalizedSupportLang})
CEFR proficiency level: ${levelKey}

${languageGuard}
CRITICAL - Language difficulty: ${dialogueGuidance}
ALL NPC dialogue, quest text, questions, and greetings MUST match ${levelKey} proficiency level.
${reviewContextBlock.promptBlock ? `\n${reviewContextBlock.promptBlock}\n` : ""}
${
  mapId === TUTORIAL_MAP_ID
    ? "TUTORIAL MODE: Make this a greetings-only onboarding scene. NPC dialogue must focus on saying hello, introducing yourself, and polite greetings. Keep it friendly and simple."
    : ""
}

Use these curriculum terms for question content (focus the game around these topics):
${reviewContextBlock.lessonTerms.join(", ")}

Required JSON shape:
{
  "name": {"en": "...", "es": "..."},
  "ambientColor": "hex like #87ceeb",
  "mapWidth": 18-26,
  "mapHeight": 12-18,
  "playerStart": {"x": int, "y": int},
  "npcs": [
    {"tx": int, "ty": int, "name": "...", "presetIdx": 0-3}
  ],
  "mapData": [flat array length mapWidth*mapHeight, values only 0..6],
  "questions": [
    {"prompt": "...", "options": ["...","...","...","..."], "correct": 0-3}
  ],
  "quest": {
    "intro": "one sentence in TARGET language at ${levelKey} level",
    "storySeed": "one dramatic sentence in TARGET language at ${levelKey} level describing the main mystery",
    "startNpcIdx": 0
  },
  "greetings": {
    "en": ["...", "...", "..."],
    "es": ["...", "...", "..."]
  }
}

Tile semantics for mapData:
0 walkable ground
1 walkable path
2 solid wall/boundary
3 solid tree/object
4 solid bench/object
5 walkable decoration
6 solid indoor object

Constraints:
- Exactly ${npcCount} NPCs in the npcs array.
- At least 8 questions, all at ${levelKey} difficulty.
- Questions should test the curriculum terms listed above.
- Only refer to named people who appear in the npcs array. Do not invent or mention any off-screen named characters.
- Ensure playerStart and NPCs are in-bounds.
- Keep mapData playable (not all solid).
- No extra keys.`;
}

function parseJSON(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through to relaxed extraction below
  }

  const candidates = [
    {
      start: trimmed.indexOf("{"),
      end: trimmed.lastIndexOf("}"),
    },
    {
      start: trimmed.indexOf("["),
      end: trimmed.lastIndexOf("]"),
    },
  ]
    .filter(({ start, end }) => start !== -1 && end !== -1 && end > start)
    .sort((a, b) => a.start - b.start);

  for (const candidate of candidates) {
    try {
      return JSON.parse(trimmed.slice(candidate.start, candidate.end + 1));
    } catch {
      // Try the next candidate shape.
    }
  }

  return null;
}

function normalizeScenario({
  raw,
  mapId,
  targetLang,
  supportLang,
  npcCount,
  lessonTerms,
}) {
  if (mapId !== REVIEW_WORLD_ID) {
    const mapWidth = clampInt(raw?.mapWidth, 16, 28, 20);
    const mapHeight = clampInt(raw?.mapHeight, 12, 20, 14);
    const mapData = normalizeMapData(raw?.mapData, mapWidth, mapHeight);
    if (!mapData) return null;

    const playerStart = {
      x: clampInt(raw?.playerStart?.x, 1, mapWidth - 2, 2),
      y: clampInt(raw?.playerStart?.y, 1, mapHeight - 2, 2),
    };

    return {
      id: mapId,
      name: {
        en: String(raw?.name?.en || getMapName(mapId, "en")),
        es: String(raw?.name?.es || getMapName(mapId, "es")),
        it: String(raw?.name?.it || getMapName(mapId, "it")),
      },
      tileSize: 32,
      mapWidth,
      mapHeight,
      playerStart,
      ambientColor: safeHex(raw?.ambientColor, 0x1a1a2e),
      tiles: getTileLibrary(mapId),
      environment: null,
      objects: [],
      emoji: null,
      generate() {
        return mapData;
      },
      npcs: normalizeNPCs(raw?.npcs, mapWidth, mapHeight, npcCount),
      questions: {
        [targetLang]: normalizeQuestions(raw?.questions, supportLang),
        en: normalizeQuestions(raw?.questions, supportLang),
        es: normalizeQuestions(raw?.questions, supportLang),
      },
      quest: null,
      greetings: {
        en: Array.isArray(raw?.greetings?.en)
          ? raw.greetings.en.slice(0, 6).map(String)
          : ["Let's practice!"],
        es: Array.isArray(raw?.greetings?.es)
          ? raw.greetings.es.slice(0, 6).map(String)
          : ["¡Vamos a practicar!"],
      },
    };
  }

  const mapWidth = clampInt(raw?.mapWidth, 16, 28, 20);
  const mapHeight = clampInt(raw?.mapHeight, 12, 20, 14);

  const playerStart = {
    x: clampInt(raw?.playerStart?.x, 1, mapWidth - 2, 2),
    y: clampInt(raw?.playerStart?.y, 1, mapHeight - 2, 2),
  };

  const environment = buildScenarioEnvironment(raw?.environment, lessonTerms, mapId);
  const npcs = normalizeNPCs(raw?.npcs, mapWidth, mapHeight, npcCount);
  const ambientColor = safeHex(
    raw?.ambientColor,
    readEnvironmentAmbientColor(raw?.environment, 0x1a1a2e),
  );
  const reviewMaps = buildReviewWorldMaps({
    environment,
    tiles: getTileLibrary(mapId, environment),
    ambientColor,
    requestedPlayerStart: playerStart,
    npcs,
  });
  const hubMap = reviewMaps.maps[0];

  return {
    id: mapId,
    name: {
      en: String(raw?.name?.en || environment?.names?.en || getMapName(mapId, "en")),
      es: String(raw?.name?.es || environment?.names?.es || getMapName(mapId, "es")),
      it: String(raw?.name?.it || environment?.names?.it || getMapName(mapId, "it")),
    },
    tileSize: 32,
    mapWidth: hubMap.mapWidth,
    mapHeight: hubMap.mapHeight,
    playerStart: hubMap.playerStart,
    ambientColor,
    tiles: hubMap.tiles,
    environment,
    objects: hubMap.objects,
    emoji: environment?.emoji || "✨",
    startMapId: reviewMaps.startMapId,
    maps: reviewMaps.maps,
    generate() {
      return hubMap.generate();
    },
    npcs: reviewMaps.npcs,
    questions: {
      [targetLang]: normalizeQuestions(raw?.questions, supportLang),
      en: normalizeQuestions(raw?.questions, supportLang),
      es: normalizeQuestions(raw?.questions, supportLang),
    },
    quest: null,
    greetings: {
      en: Array.isArray(raw?.greetings?.en)
        ? raw.greetings.en.slice(0, 6).map(String)
        : ["Let's practice!"],
      es: Array.isArray(raw?.greetings?.es)
        ? raw.greetings.es.slice(0, 6).map(String)
        : ["¡Vamos a practicar!"],
    },
  };
}

async function withQuest(
  scenario,
  raw,
  supportLang,
  targetLang,
  cefrLevel,
  reviewContext = null,
) {
  const questionsByLang = scenario.questions;
  const baseQuest = normalizeQuest(
    raw?.quest,
    scenario.npcs,
    questionsByLang,
    supportLang,
    targetLang,
    scenario.environment || scenario.id,
    cefrLevel,
    reviewContext,
  );
  const localizedQuest = await adaptQuestForReviewContext(
    baseQuest,
    targetLang,
    cefrLevel,
    reviewContext,
    scenario.npcs.map((npc) => npc.name),
  );
  const visualizedQuest = await enrichQuestGatherVisuals(
    localizedQuest,
    targetLang,
    reviewContext,
    scenario.environment || null,
  );
  const populatedScenario = distributeReviewWorldNPCs(scenario, visualizedQuest);

  return {
    ...populatedScenario,
    quest: visualizedQuest,
    gatherPlacements: buildGatherPlacementsForScenario(
      populatedScenario,
      visualizedQuest,
    ),
  };
}

export async function generateScenarioWithAI(
  mapId,
  targetLang = "es",
  supportLang = "en",
  overrideTerms = null,
  cefrLevel = null,
  reviewContext = null,
) {
  const normalizedTargetLang = normalizePracticeLanguage(targetLang, "es");
  const normalizedSupportLang = normalizeSupportLanguage(supportLang, "en");
  const effectiveReviewContext = reviewContext || null;
  const lessonTerms =
    overrideTerms ||
    effectiveReviewContext?.reviewTerms ||
    getLessonTerms(normalizedTargetLang);
  const isTutorial = !!effectiveReviewContext?.isTutorial;
  const levelKey = cefrLevel || effectiveReviewContext?.cefrLevel || "A1";
  const npcCount = isTutorial
    ? 2
    : levelKey === "Pre-A1"
      ? 2 + Math.floor(Math.random() * 2)
      : 2 + Math.floor(Math.random() * 3);
  const prompt = buildPrompt({
    mapId,
    targetLang: normalizedTargetLang,
    supportLang: normalizedSupportLang,
    lessonTerms,
    npcCount,
    cefrLevel: levelKey,
    reviewContext: effectiveReviewContext,
  });

  const text = await callResponses({
    model: SCENARIO_MODEL,
    input: prompt,
  });

  const parsed = parseJSON(text);
  const normalized = normalizeScenario({
    raw: parsed,
    mapId,
    targetLang: normalizedTargetLang,
    supportLang: normalizedSupportLang,
    npcCount,
    lessonTerms,
  });
  if (!normalized)
    return await fallbackScenario(
      mapId,
      normalizedTargetLang,
      normalizedSupportLang,
      lessonTerms,
      levelKey,
      effectiveReviewContext,
    );
  return withQuest(
    normalized,
    parsed,
    normalizedSupportLang,
    normalizedTargetLang,
    levelKey,
    effectiveReviewContext,
  );
}

export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
