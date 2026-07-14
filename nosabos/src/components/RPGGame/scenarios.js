import { loadMultiLevelLearningPath } from "../../data/skillTree/index.js";
import {
  getLanguagePromptName,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../../constants/languages";
import { callResponses } from "../../utils/llm";
import { getAdultBeginnerToneRule } from "../../utils/adultBeginnerTone";
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
    name: {
      en: "Generated World",
      es: "Mundo generado",
      pt: "Mundo gerado",
      it: "Mondo generato",
      fr: "Monde genere",
      ja: "生成された世界",
      hi: "बनाई गई दुनिया",
      ar: "العالم المتولّد",
      zh: "生成的世界",
      de: "Erstellte Welt",
    },
    emoji: "✨",
  },
];

const MAP_NAME_BY_ID = {
  [REVIEW_WORLD_ID]: { en: "Generated World", es: "Mundo generado", pt: "Mundo gerado", it: "Mondo generato", fr: "Monde genere", de: "Erstellte Welt", ja: "生成された世界", hi: "बनाई गई दुनिया", ar: "العالم المتولّد", zh: "生成的世界" },
  livingRoom: { en: "Living Room", es: "Sala", pt: "Sala", it: "Soggiorno", fr: "Salon", de: "Wohnzimmer", ja: "リビングルーム", hi: "बैठक कक्ष", ar: "غرفة المعيشة", zh: "客厅" },
  park: { en: "Park", es: "Parque", pt: "Parque", it: "Parco", fr: "Parc", de: "Park", ja: "公園", hi: "उद्यान", ar: "الحديقة", zh: "公园" },
  airport: { en: "Airport", es: "Aeropuerto", pt: "Aeroporto", it: "Aeroporto", fr: "Aeroport", de: "Flughafen", ja: "空港", hi: "हवाई अड्डा", ar: "المطار", zh: "机场" },
  [TUTORIAL_MAP_ID]: { en: "Greeting Plaza", es: "Plaza de Saludos", pt: "Praca das Saudacoes", it: "Piazza dei Saluti", fr: "Place des salutations", de: "Begrüßungsplatz", ja: "あいさつ広場", hi: "अभिवादन चौक", ar: "ساحة التحية", zh: "问候广场" },
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
      colors: [[0xd69a58, 0xc2854a, 0xe2aa68]],
      detail: "wood_floor",
    },
    1: {
      name: "path",
      solid: false,
      colors: [[0xc75b45, 0xb04a3a]],
      detail: "rug",
    },
    2: {
      name: "wall",
      solid: true,
      colors: [[0xe8d4b0, 0xd9bf94]],
      detail: "wall",
    },
    3: { name: "tree", solid: true, colors: [[0x5a9e3e]], sprite: "shelf" },
    4: { name: "bench", solid: true, colors: [[0x8b7355]], sprite: "bench" },
    5: { name: "flower", solid: false, colors: [[0x53948c]], detail: "rug" },
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
      colors: [[0x4a9c30, 0x58ab3a, 0x69ba4a]],
      detail: "grass",
    },
    1: {
      name: "path",
      solid: false,
      colors: [[0xdca763, 0xcf9754]],
      detail: "dirt",
    },
    2: {
      name: "wall",
      solid: true,
      colors: [[0x86694a, 0x715741]],
      detail: "wall",
    },
    3: { name: "tree", solid: true, colors: [[0x4b8f38]], sprite: "tree" },
    4: { name: "bench", solid: true, colors: [[0x8b7355]], sprite: "bench" },
    5: { name: "flower", solid: false, colors: [[0x54a637]], detail: "flower" },
    6: { name: "counter", solid: true, colors: [[0x8b7355]], sprite: "fence" },
  },
  airport: {
    0: {
      name: "ground",
      solid: false,
      colors: [[0xe2e8ee, 0xd4dde6]],
      detail: "tile_floor",
    },
    1: {
      name: "path",
      solid: false,
      colors: [[0x50688e, 0x44597c]],
      detail: "runway",
    },
    2: {
      name: "wall",
      solid: true,
      colors: [[0xb9c5d1, 0xa7b6c4]],
      detail: "wall",
    },
    3: { name: "tree", solid: true, colors: [[0x9fb3c7]], sprite: "freezer" },
    4: { name: "bench", solid: true, colors: [[0x5e6e7c]], sprite: "bench" },
    5: {
      name: "flower",
      solid: false,
      colors: [[0xf3f7fb, 0xe4edf5]],
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
      colors: [[0xffdf8e, 0xf7d17a, 0xffe9a8]],
      detail: "sunny_plaza",
    },
    1: {
      name: "path",
      solid: false,
      colors: [[0xf5b660, 0xe8a851]],
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
      ? "BEGINNER REVIEW: Keep the mission concrete and adult-relevant. Use short, high-frequency language tied directly to the review topics."
      : "",
  ].filter(Boolean);

  return {
    lessonTerms: effectiveTerms,
    promptBlock: contextLines.join("\n"),
  };
}

async function getLessonTerms(targetLang) {
  const units = await loadMultiLevelLearningPath(
    targetLang,
    CEFR_LEVELS_FOR_GAME,
  );
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
    {
      en: "Choose the correct option.",
      es: "Elige la opción correcta.",
      pt: "Escolha a opcao correta.",
      it: "Scegli l'opzione corretta.",
      fr: "Choisis la bonne option.",
      de: "Wähle die richtige Option.",
      ja: "正しい選択肢を選んでください。",
      hi: "सही विकल्प चुनें।",
      ar: "اختر الإجابة الصحيحة.",
    }[supportLang] || "Choose the correct option.";
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

function sanitizeGatherSupportField(value) {
  return String(value || "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function applyGatherSupportCopyToQuest(quest, supportByKey) {
  if (!supportByKey?.size) return quest;

  const applySupport = (item) => {
    if (!item) return item;
    const support = supportByKey.get(getGatherItemKey(item));
    if (!support) return item;
    return {
      ...item,
      supportName: support.supportName || item.supportName || "",
      supportHint: support.supportHint || item.supportHint || "",
      transcription: support.transcription || item.transcription || "",
    };
  };

  return {
    ...quest,
    gatherData: {
      ...quest.gatherData,
      correct: (quest.gatherData.correct || []).map(applySupport),
      decoys: (quest.gatherData.decoys || []).map(applySupport),
      all: (quest.gatherData.all || []).map(applySupport),
    },
    steps: (quest.steps || []).map((step) => ({
      ...step,
      nodes: (step.nodes || []).map((node) => ({
        ...node,
        gatherItem: node.gatherItem ? applySupport(node.gatherItem) : node.gatherItem,
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

async function enrichQuestGatherSupportCopy(
  quest,
  targetLang,
  supportLang,
) {
  const items = Array.isArray(quest?.gatherData?.all) ? quest.gatherData.all : [];
  if (!items.length) return quest;

  const normalizedTargetLang = normalizePracticeLanguage(targetLang, "es");
  const normalizedSupportLang = normalizeSupportLanguage(supportLang, "en");
  const targetLangName = resolveTargetLanguageName(normalizedTargetLang);
  const supportLangName = resolveTargetLanguageName(normalizedSupportLang);
  const prompt = [
    "You localize inventory item labels for a language-learning RPG.",
    "Return ONLY valid JSON.",
    "Output a JSON array with the SAME length and SAME order as the input array.",
    `Interpret every item name and hint as ${targetLangName} (code: ${normalizedTargetLang}).`,
    `Translate learner-facing support copy into ${supportLangName} (code: ${normalizedSupportLang}).`,
    'For each entry, keep "name" and "hint" exactly the same as the input.',
    `Write "supportName" as a concise learner-facing translation of the item name in ${supportLangName}.`,
    `Write "supportHint" as a direct translation of the hint in ${supportLangName}. If the hint is blank, return an empty string.`,
    'Write "transcription" as a short Latin-script pronunciation guide for the original item name only when that helps a learner read it. If it is unnecessary, return an empty string.',
    "Do not add extra commentary or keys.",
    'Each output item must have this shape: {"name":"exact original item name","hint":"exact original hint or empty string","supportName":"...","supportHint":"...","transcription":"..."}',
    "",
    JSON.stringify(
      items.map((item) => ({
        name: item.name,
        hint: item.hint || "",
      })),
    ),
  ].join("\n");

  try {
    const raw = await callResponses({
      model: SCENARIO_MODEL,
      input: prompt,
    });
    const parsed = parseJSON(raw);
    if (!Array.isArray(parsed)) return quest;

    const supportByKey = new Map();
    parsed.forEach((entry, idx) => {
      const sourceItem = items[idx];
      if (!sourceItem) return;
      supportByKey.set(getGatherItemKey(sourceItem), {
        supportName: sanitizeGatherSupportField(
          entry?.supportName || entry?.translation,
        ),
        supportHint: sanitizeGatherSupportField(
          entry?.supportHint || entry?.translatedHint,
        ),
        transcription: sanitizeGatherSupportField(
          entry?.transcription ||
            entry?.romanization ||
            entry?.transliteration,
        ),
      });
    });

    return applyGatherSupportCopyToQuest(quest, supportByKey);
  } catch {
    return quest;
  }
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
      ? 0.25
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
        "Hay algo aquí que quiero entender bien, y creo que tú me puedes ayudar.",
      defaultIntro: (name) =>
        `Empieza con ${name} y conversa con cada persona para repasar lo aprendido.`,
      actLabel: (name, n) => `${name} · acto ${n}`,
      connectClue: (name, next) => `${name} enlaza lo anterior con ${next}.`,
      defaultTopic: "lo que estamos repasando",
      fallbackSpeech: "No alcancé a oírte bien. Inténtalo otra vez.",
      heardPrefix: "Perfecto, escuché",
      // Greeting pools — picked randomly per game instance
      firstGreetings: [
        (seed) =>
          `¡Qué bueno que llegaste! Justo te quería comentar algo. ${seed}`,
        (seed) => `¡Llegaste en buen momento! Estaba pensando en esto. ${seed}`,
        (seed) => `Me alegra verte por aquí. ${seed}`,
        (seed) => `¡Hola! Ven, quiero mostrarte algo. ${seed}`,
      ],
      midGreetings: [
        (fromNpc) => `Así que ${fromNpc} te mandó. Me imagino de qué se trata.`,
        (fromNpc) => `Ah, vienes de parte de ${fromNpc}. Entonces hablemos.`,
        (fromNpc) =>
          `${fromNpc} hizo bien en mandarte. Yo te puedo contar mi parte.`,
        (fromNpc) =>
          `¡Qué bueno que viniste! ${fromNpc} me dijo que andas practicando.`,
      ],
      finalGreetings: [
        (fromNpc) => `¡Llegas justo a tiempo! ${fromNpc} me avisó que venías.`,
        (fromNpc) => `Te estaba esperando. ${fromNpc} ya me puso al tanto.`,
        (fromNpc) => `¡Por fin! ${fromNpc} dijo que contigo lo cerramos bien.`,
        (fromNpc) => `Sabía que vendrías. ${fromNpc} confía mucho en ti.`,
      ],
      // Choice pools — each is [text, replyFn] pairs
      choiceSets: [
        [
          [
            "Cuéntame, ¿de qué se trata?",
            () =>
              "Mira, te explico. Quiero ver cómo lo dirías tú con tus palabras.",
          ],
          [
            "Listo para practicar. ¿Por dónde empiezo?",
            () => "Me gusta esa actitud. Vamos paso a paso.",
          ],
          [
            "Mmm, esto se ve interesante.",
            () => "¿Verdad que sí? Hay más de lo que parece.",
          ],
          [
            "¿Y esto para qué me sirve?",
            () => "Buena pregunta. Te sirve más de lo que crees, ya verás.",
          ],
          [
            "¡Ja! A ver si me sale bien esta vez.",
            () => "Esa energía me gusta. Vamos a probar.",
          ],
        ],
        [
          [
            "A ver, ¿qué me puedes enseñar de esto?",
            () => "Con gusto. Pon atención a cómo lo digo yo.",
          ],
          [
            "Quiero entenderlo mejor.",
            () =>
              "Claro. Es más sencillo de lo que parece cuando lo practicas.",
          ],
          [
            "¿Tú lo usas así en tu día a día?",
            () => "Todo el tiempo. Por eso te lo quiero mostrar bien.",
          ],
          [
            "Explícamelo rápido, porfa.",
            () =>
              "Tranquilo, te lo resumo, pero vale la pena hacerlo con calma.",
          ],
          [
            "¿Entonces tú eres el que sabe de esto?",
            () => "Digamos que sé un par de cosas. Escucha con atención.",
          ],
        ],
        [
          [
            "Vamos cerrando. ¿Qué falta?",
            () => "Solo una cosa más y lo tenemos.",
          ],
          [
            "¿Cuál es el último paso?",
            () => "Ya casi. Todo depende de este último detalle.",
          ],
          [
            "Espero acordarme de todo esto.",
            () => "Te va a quedar, ya verás. Has avanzado bastante.",
          ],
          [
            "Esto ya me está gustando.",
            () => "¡Así me gusta! Con esa actitud lo dominas rapidísimo.",
          ],
          [
            "¡Por fin! Vamos a rematar bien.",
            () => "¡Eso! Con esa energía lo cerramos en un momento.",
          ],
        ],
        [
          [
            "¿Hay algo que pueda intentar ahora mismo?",
            () => "Sí, justo hay algo. Déjame mostrarte.",
          ],
          [
            "¿Con quién más debería practicar esto?",
            () => "Hay alguien por aquí que te puede ayudar también.",
          ],
          [
            "¿Lo repetimos una vez más?",
            () => "Claro, la práctica hace al maestro.",
          ],
          [
            "Dame el detalle, no te guardes nada.",
            () => "Está bien, te explico todo. Pon atención.",
          ],
          [
            "¿Es difícil?",
            () => "Un poquito al principio, pero nada que no podamos juntos.",
          ],
        ],
        [
          [
            "¿Cómo aprendiste todo esto?",
            () => "Practicando mucho, igual que tú ahora mismo.",
          ],
          [
            "¿A otros también les costó al principio?",
            () => "A todos. Por eso vale la pena repasarlo bien.",
          ],
          [
            "¿Y si todavía me equivoco?",
            () =>
              "No pasa nada. Equivocarse es parte de aprender; lo importante es intentarlo.",
          ],
          [
            "Cuéntame más sobre este lugar.",
            () => "Este lugar tiene su encanto. Cada rincón te recuerda algo.",
          ],
          [
            "¿La gente de aquí habla así siempre?",
            () => "Cada quien tiene su estilo. Eso es lo bonito.",
          ],
        ],
      ],
      // Speech prompt pools
      speechPrompts: [
        () => "Interesante... ¿y tú cómo lo dirías?",
        () => "Mmm, cuéntame más. ¿Qué piensas tú?",
        () => "Antes de seguir... ¿cómo lo ves tú?",
        () => "Quiero escuchar tu versión. ¿Qué dirías?",
        () => "Eso me hace pensar... ¿tú qué opinas?",
      ],
      playerBridge: (fromNpc) =>
        `${fromNpc} me mandó. Dice que contigo puedo practicar esto.`,
      npcHandoff: (nextNpc) =>
        `Ve con ${nextNpc}. Creo que te puede mostrar algo más.`,
      questComplete: "¡Lo lograste! Repasaste todo muy bien.",
      gatherIntro: (itemName) =>
        `Ayúdame a encontrar ${itemName} por aquí. Ojo, que hay varias cosas que no son.`,
      gatherHint: (hint) => `Una pista: ${hint}`,
      gatherWrongItem: (wrongName, correctName) =>
        `Eso es ${wrongName}. No es lo que busco. Busca ${correctName}.`,
      gatherSuccess: (itemName) =>
        `¡Eso es! Tienes ${itemName}. Justo lo que necesitaba.`,
      gatherPlayerReport: (itemName) => `Encontré ${itemName}. Aquí está.`,
      speechContinue: "Me gusta cómo lo dijiste. Sigamos.",
    },
    en: {
      defaultSeed:
        "There's something here I want to get right, and I think you can help.",
      defaultIntro: (name) =>
        `Start with ${name} and talk with each person to review what you've learned.`,
      actLabel: (name, n) => `${name} · act ${n}`,
      connectClue: (name, next) => `${name} ties what came before to ${next}.`,
      defaultTopic: "what we're reviewing",
      fallbackSpeech: "I couldn't hear you clearly. Try again.",
      heardPrefix: "Perfect, I heard",
      firstGreetings: [
        (seed) =>
          `I'm glad you're here! I've been meaning to show you this. ${seed}`,
        (seed) => `Good timing! I was just thinking about this. ${seed}`,
        (seed) => `Nice to see you around here. ${seed}`,
        (seed) => `Hey! Come over, I want to show you something. ${seed}`,
      ],
      midGreetings: [
        (fromNpc) => `So ${fromNpc} sent you. I can guess what this is about.`,
        (fromNpc) => `Ah, you come from ${fromNpc}. Then let's talk.`,
        (fromNpc) => `${fromNpc} did well sending you. I can share my part.`,
        (fromNpc) =>
          `Glad you came! ${fromNpc} told me you've been practicing.`,
      ],
      finalGreetings: [
        (fromNpc) =>
          `You arrived just in time! ${fromNpc} told me you were coming.`,
        (fromNpc) => `I was waiting for you. ${fromNpc} already filled me in.`,
        (fromNpc) =>
          `At last! ${fromNpc} said we'd wrap this up nicely together.`,
        (fromNpc) => `I knew you'd come. ${fromNpc} trusts you a lot.`,
      ],
      choiceSets: [
        [
          [
            "Tell me, what's this about?",
            () => "Let me show you. I want to see how you'd say it yourself.",
          ],
          [
            "Ready to practice. Where do I start?",
            () => "I like that attitude. Let's take it step by step.",
          ],
          [
            "Hmm, this looks interesting.",
            () => "Right? There's more to it than it seems.",
          ],
          [
            "What's this good for, anyway?",
            () => "Good question. It helps more than you'd think, you'll see.",
          ],
          [
            "Ha! Let's see if I get it right this time.",
            () => "Love that energy. Let's give it a go.",
          ],
        ],
        [
          [
            "So, what can you teach me about this?",
            () => "Gladly. Pay attention to how I say it.",
          ],
          [
            "I want to understand it better.",
            () => "Sure. It's simpler than it looks once you practice.",
          ],
          [
            "Do you use it like this day to day?",
            () => "All the time. That's why I want to show you properly.",
          ],
          [
            "Give me the short version, please.",
            () => "Easy — I'll sum it up, but it's worth doing slowly.",
          ],
          [
            "So you're the one who knows about this?",
            () => "Let's just say I know a thing or two. Listen carefully.",
          ],
        ],
        [
          [
            "Let's wrap up. What's left?",
            () => "Just one more thing and we've got it.",
          ],
          [
            "What's the last step?",
            () => "Almost there. It all comes down to this last detail.",
          ],
          [
            "I hope I remember all of this.",
            () => "You will, you'll see. You've come a long way.",
          ],
          [
            "I'm starting to like this.",
            () => "That's the spirit! With that attitude you'll master it fast.",
          ],
          [
            "Finally! Let's finish strong.",
            () => "Yes! With that energy we'll wrap it up in no time.",
          ],
        ],
        [
          [
            "Is there something I can try right now?",
            () => "Yes, there's something right here. Let me show you.",
          ],
          [
            "Who else should I practice this with?",
            () => "There's someone around here who can help too.",
          ],
          ["Shall we do it once more?", () => "Sure — practice makes perfect."],
          [
            "Give me the details, don't hold back.",
            () => "Alright, I'll walk you through it. Pay attention.",
          ],
          [
            "Is it hard?",
            () => "A little at first, but nothing we can't handle together.",
          ],
        ],
        [
          [
            "How did you learn all this?",
            () => "Lots of practice — just like you're doing now.",
          ],
          [
            "Did it trip up other people too at first?",
            () => "Everyone. That's why it's worth reviewing well.",
          ],
          [
            "And if I still get it wrong?",
            () =>
              "No worries. Mistakes are part of learning; what matters is trying.",
          ],
          [
            "Tell me more about this place.",
            () =>
              "This place has its charm. Every corner reminds you of something.",
          ],
          [
            "Do people here always talk like this?",
            () => "Everyone has their own style. That's the beauty of it.",
          ],
        ],
      ],
      speechPrompts: [
        () => "Interesting... and how would you say it?",
        () => "Hmm, tell me more. What's your take?",
        () => "Before we continue... how do you see it?",
        () => "I want to hear your version. What would you say?",
        () => "That makes me think... what do you reckon?",
      ],
      playerBridge: (fromNpc) =>
        `${fromNpc} sent me. They say I can practice this with you.`,
      npcHandoff: (nextNpc) =>
        `Go find ${nextNpc}. I think they can show you something more.`,
      questComplete: "You did it! You reviewed everything really well.",
      gatherIntro: (itemName) =>
        `Help me find ${itemName} somewhere around here. Heads up, several things out there aren't it.`,
      gatherHint: (hint) => `A clue: ${hint}`,
      gatherWrongItem: (wrongName, correctName) =>
        `That's ${wrongName}. Not what I'm looking for. Look for ${correctName}.`,
      gatherSuccess: (itemName) =>
        `That's it! You've got ${itemName}. Just what I needed.`,
      gatherPlayerReport: (itemName) => `I found ${itemName}. Here it is.`,
      speechContinue: "I like how you put that. Let's keep going.",
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
    "You are redesigning a structured RPG quest so it becomes an engaging, in-context chapter review for a language-learning game.",
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
      ? "Beginner rule: rewrite everything into very short, concrete, high-frequency review language with adult register. No abstract, literary, or poetic lines."
      : "",
    getAdultBeginnerToneRule(levelKey, "rpg"),
    "IMPORTANT: The quest JSON below is only a GENERIC scaffold — a placeholder mystery padded with filler small-talk (lines such as \"what happened? tell me everything\", \"the situation is serious\", or \"I'm ready to help, where do I start?\"). Do NOT preserve that generic plot or that filler. Replace the words while keeping the structure.",
    "Reauthor the learner-facing text so the WHOLE conversation becomes a believable, real-world situation where THIS unit's language is actually used. The characters should naturally USE and talk about the unit's target language the way real people would in that context, so it feels like reviewing something the learner has genuinely practiced — not a quiz wrapped in a fake mystery.",
    "Make each player choice a distinct, meaningful way to handle the moment using the unit's language (different phrasings, registers, regional variants, tones, or word choices the unit teaches) — never interchangeable filler reactions. Each choice reply (npcReply) must react specifically to that choice and reinforce the point, so picking it actually teaches something.",
    "NPC lines should DEMONSTRATE the unit's target language in use, not merely mention the topic by name.",
    "If the unit is abstract (e.g. regional variation, register/formality, style, tone, or grammar patterns), ground it in concrete moments: have the characters actually speak in the relevant variants or registers, and let the player choose the form that fits the person, place, or situation. Never settle for vague narration about the topic.",
    "Avoid sounding robotic, repetitive, or generic. Keep every line warm, specific, and conversational.",
    `Rewrite EVERY learner-facing string into ${targetLangName}: intro, storySeed, step titles/intros, node dialogue (npcLine), player lines (playerLine), choice text, choice replies (npcReply), speech replies, gather item names and hints, and gather-data item names/hints.`,
    "Keep the JSON structure exactly the same: the same number of steps, nodes, and choices, and the same ids and nextNodeId links. Only the human-readable text may change.",
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
    // Reauthoring dialogue into meaningful, unit-specific scenes is a creative
    // task — give the model a real thinking budget (instead of the default
    // minimal one) plus JSON output so it stops doing shallow string swaps.
    generationConfig: {
      thinkingConfig: { thinkingBudget: 2048 },
      temperature: 1,
      responseMimeType: "application/json",
    },
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
      name: { en: "Kitchen", es: "Cocina", it: "Cucina", fr: "Cuisine", ja: "キッチン" },
      markerType: "doorway",
      shape: "annex",
      objects: ["counter", "stove", "shelf"],
    },
    {
      slug: "study",
      name: { en: "Study", es: "Estudio", it: "Studio", fr: "Bureau", ja: "書斎" },
      markerType: "doorway",
      shape: "alcove",
      objects: ["bookshelf", "desk", "lamp"],
    },
    {
      slug: "garden-patio",
      name: { en: "Garden Patio", es: "Patio del Jardin", it: "Patio del Giardino", fr: "Patio du jardin", ja: "庭のパティオ" },
      markerType: "pavilion",
      shape: "courtyard",
      objects: ["bench", "plant", "table"],
    },
  ],
  market: [
    {
      slug: "prep-room",
      name: { en: "Prep Room", es: "Sala de Preparacion", it: "Sala Preparazione", fr: "Salle de preparation", ja: "準備室" },
      markerType: "doorway",
      shape: "annex",
      objects: ["counter", "stove", "fridge"],
    },
    {
      slug: "pantry",
      name: { en: "Pantry", es: "Despensa", it: "Dispensa", fr: "Garde-manger", ja: "食品庫" },
      markerType: "building",
      shape: "offset",
      objects: ["shelf", "shelf", "counter"],
    },
    {
      slug: "cafe-patio",
      name: { en: "Cafe Patio", es: "Patio del Cafe", it: "Patio del Caffè", fr: "Patio du cafe", ja: "カフェのパティオ" },
      markerType: "pavilion",
      shape: "courtyard",
      objects: ["table", "bench", "plant"],
    },
  ],
  library: [
    {
      slug: "archive-wing",
      name: { en: "Archive Wing", es: "Ala de Archivo", it: "Ala Archivio", fr: "Aile des archives", ja: "資料棟" },
      markerType: "doorway",
      shape: "annex",
      objects: ["bookshelf", "bookshelf", "lamp"],
    },
    {
      slug: "reading-nook",
      name: { en: "Reading Nook", es: "Rincon de Lectura", it: "Angolo Lettura", fr: "Coin lecture", ja: "読書コーナー" },
      markerType: "doorway",
      shape: "alcove",
      objects: ["table", "bench", "lamp"],
    },
    {
      slug: "front-office",
      name: { en: "Front Office", es: "Oficina Principal", it: "Ufficio Principale", fr: "Accueil", ja: "受付オフィス" },
      markerType: "building",
      shape: "offset",
      objects: ["desk", "bookshelf", "plant"],
    },
  ],
  transit: [
    {
      slug: "ticket-office",
      name: { en: "Ticket Office", es: "Oficina de Boletos", it: "Biglietteria", fr: "Billetterie", ja: "チケット売り場" },
      markerType: "building",
      shape: "offset",
      objects: ["counter", "register", "sign"],
    },
    {
      slug: "gate-lounge",
      name: { en: "Gate Lounge", es: "Sala de Embarque", it: "Sala d'Imbarco", fr: "Salon d'embarquement", ja: "搭乗ラウンジ" },
      markerType: "gate",
      shape: "courtyard",
      objects: ["bench", "sign", "suitcaseStack"],
    },
    {
      slug: "travel-desk",
      name: { en: "Travel Desk", es: "Mesa de Viaje", it: "Banco Viaggi", fr: "Comptoir voyage", ja: "旅行デスク" },
      markerType: "building",
      shape: "annex",
      objects: ["desk", "plant", "sign"],
    },
  ],
  nature: [
    {
      slug: "garden-pavilion",
      name: { en: "Garden Pavilion", es: "Pabellon del Jardin", it: "Padiglione del Giardino", fr: "Pavillon du jardin", ja: "庭の東屋" },
      markerType: "pavilion",
      shape: "courtyard",
      objects: ["bench", "plant", "sign"],
    },
    {
      slug: "glasshouse",
      name: { en: "Glasshouse", es: "Invernadero", it: "Serra", fr: "Serre", ja: "温室" },
      markerType: "greenhouse",
      shape: "offset",
      objects: ["plant", "plant", "table"],
    },
    {
      slug: "ranger-station",
      name: { en: "Ranger Station", es: "Estacion del Guardabosques", it: "Stazione del Guardaboschi", fr: "Poste du garde", ja: "レンジャー詰所" },
      markerType: "building",
      shape: "annex",
      objects: ["desk", "shelf", "bench"],
    },
  ],
  civic: [
    {
      slug: "council-room",
      name: { en: "Council Room", es: "Sala del Consejo", it: "Sala del Consiglio", fr: "Salle du conseil", ja: "評議室" },
      markerType: "building",
      shape: "offset",
      objects: ["desk", "table", "lamp"],
    },
    {
      slug: "records-room",
      name: { en: "Records Room", es: "Sala de Registros", it: "Sala Archivi", fr: "Salle des dossiers", ja: "記録室" },
      markerType: "building",
      shape: "annex",
      objects: ["bookshelf", "bookshelf", "desk"],
    },
    {
      slug: "courtyard-pavilion",
      name: { en: "Courtyard Pavilion", es: "Pabellon del Patio", it: "Padiglione del Cortile", fr: "Pavillon de la cour", ja: "中庭の東屋" },
      markerType: "pavilion",
      shape: "courtyard",
      objects: ["bench", "plant", "sign"],
    },
  ],
  lab: [
    {
      slug: "prep-lab",
      name: { en: "Prep Lab", es: "Laboratorio de Preparacion", it: "Laboratorio Preparazione", fr: "Labo de preparation", ja: "準備ラボ" },
      markerType: "doorway",
      shape: "annex",
      objects: ["freezer", "table", "lamp"],
    },
    {
      slug: "analysis-booth",
      name: { en: "Analysis Booth", es: "Cabina de Analisis", it: "Cabina Analisi", fr: "Cabine d'analyse", ja: "分析ブース" },
      markerType: "building",
      shape: "offset",
      objects: ["desk", "shelf", "lamp"],
    },
    {
      slug: "equipment-store",
      name: { en: "Equipment Store", es: "Deposito de Equipo", it: "Magazzino Attrezzature", fr: "Reserve d'equipement", ja: "備品倉庫" },
      markerType: "building",
      shape: "alcove",
      objects: ["shelf", "freezer", "desk"],
    },
  ],
  festival: [
    {
      slug: "performance-stage",
      name: { en: "Performance Stage", es: "Escenario", it: "Palco delle Esibizioni", fr: "Scene", ja: "ステージ" },
      markerType: "pavilion",
      shape: "courtyard",
      objects: ["speaker", "speaker", "balloons"],
    },
    {
      slug: "food-stall",
      name: { en: "Food Stall", es: "Puesto de Comida", it: "Banco del Cibo", fr: "Stand de nourriture", ja: "屋台" },
      markerType: "building",
      shape: "offset",
      objects: ["counter", "table", "sign"],
    },
    {
      slug: "craft-tent",
      name: { en: "Craft Tent", es: "Taller Creativo", it: "Tenda Creativa", fr: "Tente d'artisanat", ja: "クラフトテント" },
      markerType: "pavilion",
      shape: "annex",
      objects: ["table", "bench", "balloons"],
    },
  ],
};

const SCENARIO_NAME_AR_BY_EN = {
  Kitchen: "المطبخ",
  Study: "المكتب",
  "Garden Patio": "فناء الحديقة",
  "Prep Room": "غرفة التحضير",
  Pantry: "المخزن",
  "Cafe Patio": "فناء المقهى",
  "Archive Wing": "جناح الأرشيف",
  "Reading Nook": "ركن القراءة",
  "Front Office": "المكتب الأمامي",
  "Ticket Office": "شباك التذاكر",
  "Gate Lounge": "صالة البوابة",
  "Travel Desk": "مكتب السفر",
  "Garden Pavilion": "جناح الحديقة",
  Glasshouse: "البيت الزجاجي",
  "Ranger Station": "مركز الحارس",
  "Council Room": "قاعة المجلس",
  "Records Room": "غرفة السجلات",
  "Courtyard Pavilion": "جناح الفناء",
  "Prep Lab": "مختبر التحضير",
  "Analysis Booth": "كشك التحليل",
  "Equipment Store": "مخزن المعدات",
  "Performance Stage": "مسرح العروض",
  "Food Stall": "كشك الطعام",
  "Craft Tent": "خيمة الحِرف",
};

Object.values(REVIEW_ROOM_BLUEPRINTS).forEach((rooms) => {
  rooms.forEach((room) => {
    if (!room?.name?.ar) {
      room.name.ar = SCENARIO_NAME_AR_BY_EN[room.name.en] || room.name.en;
    }
  });
});

const SCENARIO_NAME_PT_BY_ES = {
  Cocina: "Cozinha",
  Estudio: "Estúdio",
  "Patio del Jardin": "Pátio do Jardim",
  "Sala de Preparacion": "Sala de Preparação",
  Despensa: "Despensa",
  "Patio del Cafe": "Pátio do Café",
  "Ala de Archivo": "Ala do Arquivo",
  "Rincon de Lectura": "Cantinho de Leitura",
  "Oficina Principal": "Escritório Principal",
  "Oficina de Boletos": "Bilheteria",
  "Sala de Embarque": "Sala de Embarque",
  "Mesa de Viaje": "Mesa de Viagem",
  "Pabellon del Jardin": "Pavilhão do Jardim",
  Invernadero: "Estufa",
  "Estacion del Guardabosques": "Estação do Guarda-Florestal",
  "Sala del Consejo": "Sala do Conselho",
  "Sala de Registros": "Sala de Registros",
  "Pabellon del Patio": "Pavilhão do Pátio",
  "Laboratorio de Preparacion": "Laboratório de Preparação",
  "Cabina de Analisis": "Cabine de Análise",
  "Deposito de Equipo": "Depósito de Equipamentos",
  Escenario: "Palco",
  "Puesto de Comida": "Barraca de Comida",
  "Taller Creativo": "Tenda Criativa",
};

const SCENARIO_NAME_HI_BY_EN = {
  Kitchen: "रसोई",
  Study: "अध्ययन कक्ष",
  "Garden Patio": "बगीचे का आँगन",
  "Prep Room": "तैयारी कक्ष",
  Pantry: "भंडार कक्ष",
  "Cafe Patio": "कैफ़े आँगन",
  "Archive Wing": "अभिलेख कक्ष",
  "Reading Nook": "पठन कोना",
  "Front Office": "मुख्य कार्यालय",
  "Ticket Office": "टिकट कार्यालय",
  "Gate Lounge": "गेट लाउंज",
  "Travel Desk": "यात्रा डेस्क",
  "Garden Pavilion": "उद्यान मंडप",
  Glasshouse: "काँचघर",
  "Ranger Station": "रेंजर चौकी",
  "Council Room": "परिषद कक्ष",
  "Records Room": "अभिलेख कक्ष",
  "Courtyard Pavilion": "आँगन मंडप",
  "Prep Lab": "तैयारी प्रयोगशाला",
  "Analysis Booth": "विश्लेषण कक्ष",
  "Equipment Store": "उपकरण भंडार",
  "Performance Stage": "प्रदर्शन मंच",
  "Food Stall": "भोजन स्टॉल",
  "Craft Tent": "शिल्प तंबू",
};

const SCENARIO_NAME_ZH_BY_EN = {
  Kitchen: "厨房",
  Study: "书房",
  "Garden Patio": "花园露台",
  "Prep Room": "准备室",
  Pantry: "储藏室",
  "Cafe Patio": "咖啡露台",
  "Archive Wing": "档案侧厅",
  "Reading Nook": "阅读角",
  "Front Office": "前台办公室",
  "Ticket Office": "售票处",
  "Gate Lounge": "登机口休息区",
  "Travel Desk": "旅行服务台",
  "Garden Pavilion": "花园亭",
  Glasshouse: "温室",
  "Ranger Station": "护林员站",
  "Council Room": "会议室",
  "Records Room": "档案室",
  "Courtyard Pavilion": "庭院亭",
  "Prep Lab": "准备实验室",
  "Analysis Booth": "分析间",
  "Equipment Store": "设备储藏室",
  "Performance Stage": "表演舞台",
  "Food Stall": "食物摊位",
  "Craft Tent": "手工帐篷",
};

MAP_CHOICES.forEach((choice) => {
  if (choice?.name?.es && !choice.name.pt) {
    choice.name.pt = SCENARIO_NAME_PT_BY_ES[choice.name.es] || choice.name.en;
  }
  if (choice?.name?.en && !choice.name.zh) {
    choice.name.zh = SCENARIO_NAME_ZH_BY_EN[choice.name.en] || choice.name.en;
  }
});

Object.values(MAP_NAME_BY_ID).forEach((name) => {
  if (name?.es && !name.pt) {
    name.pt = SCENARIO_NAME_PT_BY_ES[name.es] || name.en;
  }
  if (name?.en && !name.zh) {
    name.zh = SCENARIO_NAME_ZH_BY_EN[name.en] || name.en;
  }
});

Object.values(REVIEW_ROOM_BLUEPRINTS).forEach((specs) => {
  specs.forEach((spec) => {
    if (spec?.name?.es && !spec.name.pt) {
      spec.name.pt = SCENARIO_NAME_PT_BY_ES[spec.name.es] || spec.name.en;
    }
    if (spec?.name?.en && !spec.name.hi) {
      spec.name.hi = SCENARIO_NAME_HI_BY_EN[spec.name.en] || spec.name.en;
    }
    if (spec?.name?.en && !spec.name.zh) {
      spec.name.zh = SCENARIO_NAME_ZH_BY_EN[spec.name.en] || spec.name.en;
    }
  });
});

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
          label: Array.isArray(environment?.names?.en)
            ? environment.names.en[0]
            : environment?.names?.en || "Main Area",
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
    name: {
      en: Array.isArray(environment?.names?.en)
        ? environment.names.en[0]
        : environment?.names?.en || "Lesson World",
      es: Array.isArray(environment?.names?.es)
        ? environment.names.es[0]
        : environment?.names?.es || "Mundo de Leccion",
      pt: Array.isArray(environment?.names?.pt)
        ? environment.names.pt[0]
        : environment?.names?.pt || "Mundo da Licao",
      it: Array.isArray(environment?.names?.it)
        ? environment.names.it[0]
        : environment?.names?.it || "Mondo della Lezione",
      fr: Array.isArray(environment?.names?.fr)
        ? environment.names.fr[0]
        : environment?.names?.fr || "Monde de la lecon",
      ja: Array.isArray(environment?.names?.ja)
        ? environment.names.ja[0]
        : environment?.names?.ja || "レッスンの世界",
      hi: Array.isArray(environment?.names?.hi)
        ? environment.names.hi[0]
        : environment?.names?.hi || "पाठ की दुनिया",
      ar: Array.isArray(environment?.names?.ar)
        ? environment.names.ar[0]
        : environment?.names?.ar || "عالم الدرس",
      zh: Array.isArray(environment?.names?.zh)
        ? environment.names.zh[0]
        : environment?.names?.zh || "课程世界",
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
    const name = {
      en: getMapName(mapId, "en"),
      es: getMapName(mapId, "es"),
      pt: getMapName(mapId, "pt"),
      it: getMapName(mapId, "it"),
      fr: getMapName(mapId, "fr"),
      de: getMapName(mapId, "de"),
      ja: getMapName(mapId, "ja"),
      hi: getMapName(mapId, "hi"),
      ar: getMapName(mapId, "ar"),
    };
    const mapWidth = 18;
    const mapHeight = 14;

    const questionsByLang = {
      [targetLang]: normalizeQuestions([], supportLang),
      en: normalizeQuestions([], supportLang),
      es: normalizeQuestions([], supportLang),
      ja: normalizeQuestions([], supportLang),
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
    const localizedQuest = await enrichQuestGatherSupportCopy(
      visualizedQuest,
      targetLang,
      supportLang,
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
      quest: localizedQuest,
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
    ja: normalizeQuestions([], supportLang),
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
  const localizedQuest = await enrichQuestGatherSupportCopy(
    visualizedQuest,
    targetLang,
    supportLang,
  );
  const baseScenario = {
    id: mapId,
    name: environment?.names || {
      en: getMapName(mapId, "en"),
      es: getMapName(mapId, "es"),
      pt: getMapName(mapId, "pt"),
      it: getMapName(mapId, "it"),
      fr: getMapName(mapId, "fr"),
      ja: getMapName(mapId, "ja"),
      hi: getMapName(mapId, "hi"),
      ar: getMapName(mapId, "ar"),
      zh: getMapName(mapId, "zh"),
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
    quest: localizedQuest,
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
    localizedQuest,
  );

  return {
    ...populatedFallbackScenario,
    quest: localizedQuest,
    gatherPlacements: buildGatherPlacementsForScenario(
      populatedFallbackScenario,
      localizedQuest,
    ),
  };
}

const CEFR_DIALOGUE_GUIDANCE = {
  "Pre-A1":
    "Use only very basic high-frequency language, but write natural complete micro-sentences instead of isolated word fragments. One or two short formulaic phrases per turn. No grammar complexity. Keep the register adult, socially normal, and conversational.",
  A1: "Use short, simple sentences (5-8 words max). Present tense only. Basic everyday vocabulary. Keep NPC dialogue natural, adult, and easy to understand for beginners.",
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
  const adultBeginnerToneRule = getAdultBeginnerToneRule(levelKey, "rpg");
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
${adultBeginnerToneRule}
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
  "name": {"en": "...", "es": "..."${!["en","es"].includes(normalizedSupportLang) ? `, "${normalizedSupportLang}": "..."` : ""}},
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
    "storySeed": "one vivid, intriguing sentence in TARGET language at ${levelKey} level that sets up the scene's central situation and gives a natural reason to use this unit's language (not necessarily a crime or mystery)",
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
${adultBeginnerToneRule}
ALL NPC dialogue, quest text, questions, and greetings MUST match ${levelKey} proficiency level.
${reviewContextBlock.promptBlock ? `\n${reviewContextBlock.promptBlock}\n` : ""}
${
  mapId === TUTORIAL_MAP_ID
    ? "TUTORIAL MODE: Make this a greetings-only onboarding scene. NPC dialogue must focus on saying hello, introducing yourself, and polite greetings. Keep it friendly, simple, and adult in register."
    : ""
}

Use these curriculum terms for question content (focus the game around these topics):
${reviewContextBlock.lessonTerms.join(", ")}

Required JSON shape:
{
  "name": {"en": "...", "es": "..."${!["en","es"].includes(normalizedSupportLang) ? `, "${normalizedSupportLang}": "..."` : ""}},
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
    "storySeed": "one vivid, intriguing sentence in TARGET language at ${levelKey} level that sets up the scene's central situation and gives a natural reason to use this unit's language (not necessarily a crime or mystery)",
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
        pt: String(raw?.name?.pt || getMapName(mapId, "pt")),
        it: String(raw?.name?.it || getMapName(mapId, "it")),
        fr: String(raw?.name?.fr || getMapName(mapId, "fr")),
        de: String(raw?.name?.de || getMapName(mapId, "de")),
        ja: String(raw?.name?.ja || getMapName(mapId, "ja")),
        hi: String(raw?.name?.hi || getMapName(mapId, "hi")),
        ar: String(raw?.name?.ar || getMapName(mapId, "ar")),
        zh: String(raw?.name?.zh || getMapName(mapId, "zh")),
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
        ja: normalizeQuestions(raw?.questions, supportLang),
      },
      quest: null,
      greetings: {
        en: Array.isArray(raw?.greetings?.en)
          ? raw.greetings.en.slice(0, 6).map(String)
          : ["Let's practice!"],
        es: Array.isArray(raw?.greetings?.es)
          ? raw.greetings.es.slice(0, 6).map(String)
          : ["¡Vamos a practicar!"],
        ja: Array.isArray(raw?.greetings?.ja)
          ? raw.greetings.ja.slice(0, 6).map(String)
          : ["練習しましょう！"],
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

  const processedName = {
    en: String(raw?.name?.en || (Array.isArray(environment?.names?.en) ? environment.names.en[0] : environment?.names?.en) || getMapName(mapId, "en")),
    es: String(raw?.name?.es || (Array.isArray(environment?.names?.es) ? environment.names.es[0] : environment?.names?.es) || getMapName(mapId, "es")),
    pt: String(raw?.name?.pt || (Array.isArray(environment?.names?.pt) ? environment.names.pt[0] : environment?.names?.pt) || getMapName(mapId, "pt")),
    it: String(raw?.name?.it || (Array.isArray(environment?.names?.it) ? environment.names.it[0] : environment?.names?.it) || getMapName(mapId, "it")),
    fr: String(raw?.name?.fr || (Array.isArray(environment?.names?.fr) ? environment.names.fr[0] : environment?.names?.fr) || getMapName(mapId, "fr")),
    de: String(raw?.name?.de || (Array.isArray(environment?.names?.de) ? environment.names.de[0] : environment?.names?.de) || getMapName(mapId, "de")),
    ja: String(raw?.name?.ja || (Array.isArray(environment?.names?.ja) ? environment.names.ja[0] : environment?.names?.ja) || getMapName(mapId, "ja")),
    hi: String(raw?.name?.hi || (Array.isArray(environment?.names?.hi) ? environment.names.hi[0] : environment?.names?.hi) || getMapName(mapId, "hi")),
    ar: String(raw?.name?.ar || (Array.isArray(environment?.names?.ar) ? environment.names.ar[0] : environment?.names?.ar) || getMapName(mapId, "ar")),
    zh: String(raw?.name?.zh || (Array.isArray(environment?.names?.zh) ? environment.names.zh[0] : environment?.names?.zh) || getMapName(mapId, "zh")),
  };
  hubMap.name = processedName;

  return {
    id: mapId,
    name: processedName,
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
      ja: normalizeQuestions(raw?.questions, supportLang),
    },
    quest: null,
    greetings: {
      en: Array.isArray(raw?.greetings?.en)
        ? raw.greetings.en.slice(0, 6).map(String)
        : ["Let's practice!"],
      es: Array.isArray(raw?.greetings?.es)
        ? raw.greetings.es.slice(0, 6).map(String)
        : ["¡Vamos a practicar!"],
      ja: Array.isArray(raw?.greetings?.ja)
        ? raw.greetings.ja.slice(0, 6).map(String)
        : ["練習しましょう！"],
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
  const supportLocalizedQuest = await enrichQuestGatherSupportCopy(
    visualizedQuest,
    targetLang,
    supportLang,
  );
  const populatedScenario = distributeReviewWorldNPCs(
    scenario,
    supportLocalizedQuest,
  );

  return {
    ...populatedScenario,
    quest: supportLocalizedQuest,
    gatherPlacements: buildGatherPlacementsForScenario(
      populatedScenario,
      supportLocalizedQuest,
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
    (await getLessonTerms(normalizedTargetLang));
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
