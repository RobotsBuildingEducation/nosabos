import { getMultiLevelLearningPath } from "../../data/skillTreeData";

const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const SCENARIO_MODEL = "gpt-5-nano";

const CEFR_LEVELS_FOR_GAME = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];

export const MAP_CHOICES = [
  { id: "livingRoom", name: { en: "Living Room", es: "Sala" } },
  { id: "park", name: { en: "Park", es: "Parque" } },
  { id: "airport", name: { en: "Airport", es: "Aeropuerto" } },
];

const TILE_LIBRARY_BY_MAP = {
  livingRoom: {
    0: { name: "ground", solid: false, colors: [[0xc89b6d, 0xb78456, 0xd4aa7b]], detail: "wood_floor" },
    1: { name: "path", solid: false, colors: [[0xa86f43, 0x9b643b]], detail: "rug" },
    2: { name: "wall", solid: true, colors: [[0xcab9a5, 0xb7a38d]], detail: "wall" },
    3: { name: "tree", solid: true, colors: [[0x5a9e3e]], sprite: "shelf" },
    4: { name: "bench", solid: true, colors: [[0x8b7355]], sprite: "bench" },
    5: { name: "flower", solid: false, colors: [[0xb66aa1]], detail: "rug" },
    6: { name: "counter", solid: true, colors: [[0x8b7355]], sprite: "counter" },
  },
  park: {
    0: { name: "ground", solid: false, colors: [[0x6da84d, 0x5e9a42, 0x7bb55a]], detail: "grass" },
    1: { name: "path", solid: false, colors: [[0xc8a96e, 0xbf9d63]], detail: "dirt" },
    2: { name: "wall", solid: true, colors: [[0x7e6a53, 0x6b5946]], detail: "wall" },
    3: { name: "tree", solid: true, colors: [[0x4b8f38]], sprite: "tree" },
    4: { name: "bench", solid: true, colors: [[0x8b7355]], sprite: "bench" },
    5: { name: "flower", solid: false, colors: [[0x6da84d]], detail: "flower" },
    6: { name: "counter", solid: true, colors: [[0x8b7355]], sprite: "fence" },
  },
  airport: {
    0: { name: "ground", solid: false, colors: [[0xd5dde5, 0xc9d3dd]], detail: "tile_floor" },
    1: { name: "path", solid: false, colors: [[0x7c8b99, 0x6f7d8a]], detail: "runway" },
    2: { name: "wall", solid: true, colors: [[0xaeb9c4, 0x9caab7]], detail: "wall" },
    3: { name: "tree", solid: true, colors: [[0x9fb3c7]], sprite: "freezer" },
    4: { name: "bench", solid: true, colors: [[0x5e6e7c]], sprite: "bench" },
    5: { name: "flower", solid: false, colors: [[0xd5dde5]], detail: "linoleum" },
    6: { name: "counter", solid: true, colors: [[0x8da0b1]], sprite: "register" },
  },
};

function getTileLibrary(mapId) {
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
  return Array.from(new Set(items.filter(Boolean).map((item) => String(item).trim())));
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
          if (Array.isArray(modeData.focusPoints)) terms.push(...modeData.focusPoints);
          if (modeData.topic) terms.push(modeData.topic);
          if (modeData.scenario) terms.push(modeData.scenario);
          return terms;
        });
      }),
    ),
  );
}

function normalizeNPCs(npcs, mapWidth, mapHeight) {
  const raw = Array.isArray(npcs) ? npcs : [];
  const normalized = raw
    .slice(0, 3)
    .map((npc, idx) => ({
      tx: clampInt(npc?.tx, 1, mapWidth - 2, 2 + idx * 3),
      ty: clampInt(npc?.ty, 1, mapHeight - 2, 2 + idx * 2),
      name: String(npc?.name || `Guide ${idx + 1}`),
      presetIdx: clampInt(npc?.presetIdx, 0, 2, idx),
    }));

  while (normalized.length < 3) {
    const idx = normalized.length;
    normalized.push({ tx: 2 + idx * 3, ty: 2 + idx * 2, name: `Guide ${idx + 1}`, presetIdx: idx });
  }

  return normalized;
}

function normalizeQuestions(questions, supportLang) {
  const basePrompt = supportLang === "es" ? "Elige la opción correcta." : "Choose the correct option.";
  const list = Array.isArray(questions) ? questions : [];
  const normalized = list
    .slice(0, 20)
    .map((q) => {
      const options = Array.isArray(q?.options)
        ? q.options.map((opt) => String(opt)).filter(Boolean).slice(0, 4)
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

function normalizeQuest(rawQuest, npcs, questionsByLang, supportLang, targetLang) {
  const questionPool =
    questionsByLang?.[targetLang] || questionsByLang?.en || questionsByLang?.es || [];
  const rawStorySeed = String(rawQuest?.storySeed || "").trim();
  const useSpanish = targetLang === "es";

  const storySeed =
    rawStorySeed ||
    (useSpanish
      ? "La campana del pueblo desapareció y nadie sabe quién la tomó."
      : "The town bell disappeared and nobody knows who took it.");
  const startNpcIdx = clampInt(rawQuest?.startNpcIdx, 0, npcs.length - 1, 0);
  const intro =
    String(rawQuest?.intro || "").trim() ||
    (useSpanish
      ? `Comienza con ${npcs[startNpcIdx]?.name || "la guía"} y sigue las pistas para resolver el misterio.`
      : `Start with ${npcs[startNpcIdx]?.name || "the guide"} and follow the clues to solve the mystery.`);

  const topicAt = (idx, fallback) => {
    const q = questionPool[idx % Math.max(1, questionPool.length)];
    return String(q?.prompt || fallback);
  };

  const treeByNpc = npcs.map((npc, npcIdx) => {
    const previousNpc = npcs[(npcIdx - 1 + npcs.length) % npcs.length];
    const nextNpc = npcs[(npcIdx + 1) % npcs.length];
    const topic = topicAt(npcIdx, useSpanish ? "las pistas del caso" : "the case clues");

    const node1Id = `npc-${npcIdx}-node-1`;
    const node2Id = `npc-${npcIdx}-node-2`;
    const node3Id = `npc-${npcIdx}-node-3`;

    return {
      npcIdx,
      title:
        useSpanish
          ? `${npc.name} · acto ${npcIdx + 1}`
          : `${npc.name} · act ${npcIdx + 1}`,
      intro:
        useSpanish
          ? `${npc.name} conecta la pista anterior con ${nextNpc.name}.`
          : `${npc.name} connects the previous clue to ${nextNpc.name}.`,
      nodes: [
        {
          id: node1Id,
          npcLine: sanitizeDialogueLine(
            useSpanish
              ? `Hola. ${previousNpc.name} dijo que podrías ayudar.`
              : `Hello. ${previousNpc.name} said you could help.`,
            npc.name,
          ),
          responseMode: "choice",
          choices: [
            {
              text: useSpanish ? "Cuenta conmigo, ¿qué necesitas?" : "I'm in. What do you need?",
              npcReply:
                useSpanish
                  ? `Gracias. Escucha: ${topic}.`
                  : `Thanks. Listen: ${topic}.`,
              nextNodeId: node2Id,
            },
            {
              text:
                useSpanish
                  ? "Suena ridículo, pero quiero oír la historia completa."
                  : "This sounds ridiculous, but I want the full story.",
              npcReply:
                useSpanish
                  ? `Suena raro, sí, pero es urgente. ${topic}.`
                  : `It sounds weird, yes, but it's urgent. ${topic}.`,
              nextNodeId: node2Id,
            },
          ],
        },
        {
          id: node2Id,
          npcLine: sanitizeDialogueLine(
            useSpanish
              ? `Suena bien. ${topic}`
              : `Sounds good. ${topic}`,
            npc.name,
          ),
          responseMode: "speech",
          speechFallbackReply:
            useSpanish
              ? "No alcancé a oírte bien. Inténtalo otra vez."
              : "I couldn't hear you clearly. Try again.",
          nextNodeId: node3Id,
        },
        {
          id: node3Id,
          npcLine: sanitizeDialogueLine(
            useSpanish
              ? `Perfecto. Ahora habla con ${nextNpc.name}. ${storySeed}`
              : `Perfect. Now talk to ${nextNpc.name}. ${storySeed}`,
            npc.name,
          ),
          responseMode: "none",
          terminal: true,
        },
      ],
    };
  });

  return {
    intro,
    storySeed,
    startNpcIdx,
    treeByNpc,
  };
}

function normalizeMapData(mapData, mapWidth, mapHeight) {
  const expectedLength = mapWidth * mapHeight;
  if (!Array.isArray(mapData) || mapData.length !== expectedLength) {
    return null;
  }

  return mapData.map((value) => clampInt(value, 0, 6, 0));
}

function fallbackScenario(mapId, targetLang, supportLang) {
  const name = MAP_CHOICES.find((m) => m.id === mapId)?.name || { en: mapId, es: mapId };
  const mapWidth = 18;
  const mapHeight = 14;

  const questionsByLang = {
    [targetLang]: normalizeQuestions([], supportLang),
    en: normalizeQuestions([], supportLang),
    es: normalizeQuestions([], supportLang),
  };

  const npcs = [
    { tx: 4, ty: 4, name: "Ada", presetIdx: 0 },
    { tx: 8, ty: 6, name: "Bruno", presetIdx: 1 },
    { tx: 12, ty: 8, name: "Cleo", presetIdx: 2 },
  ];

  return {
    id: mapId,
    name,
    tileSize: 32,
    mapWidth,
    mapHeight,
    playerStart: { x: 3, y: 3 },
    ambientColor: 0x1f2937,
    tiles: getTileLibrary(mapId),
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
    quest: normalizeQuest(null, npcs, questionsByLang, supportLang, targetLang),
    greetings: {
      en: ["Generating scenario unavailable; using safe fallback."],
      es: ["Generación no disponible; usando respaldo."],
    },
  };
}

function buildPrompt({ mapId, targetLang, supportLang, lessonTerms }) {
  const mapLabel = MAP_CHOICES.find((m) => m.id === mapId)?.name?.en || mapId;

  return `You generate JSON for a 2D JRPG language-learning scenario.
Return ONLY valid JSON (no markdown).

Map theme requested: ${mapLabel} (${mapId}).
Target language: ${targetLang}
Support language: ${supportLang}

Use some of these curriculum terms for question content:
${lessonTerms.slice(0, 120).join(", ")}

Required JSON shape:
{
  "name": {"en": "...", "es": "..."},
  "ambientColor": "hex like #87ceeb",
  "mapWidth": 18-26,
  "mapHeight": 12-18,
  "playerStart": {"x": int, "y": int},
  "npcs": [
    {"tx": int, "ty": int, "name": "...", "presetIdx": 0-2},
    {"tx": int, "ty": int, "name": "...", "presetIdx": 0-2},
    {"tx": int, "ty": int, "name": "...", "presetIdx": 0-2}
  ],
  "mapData": [flat array length mapWidth*mapHeight, values only 0..6],
  "questions": [
    {"prompt": "...", "options": ["...","...","...","..."], "correct": 0-3}
  ],
  "quest": {
    "intro": "one sentence",
    "storySeed": "one sentence",
    "startNpcIdx": 0-2
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
- Exactly 3 NPCs.
- At least 8 questions.
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

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeScenario({ raw, mapId, targetLang, supportLang }) {
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
      en: String(raw?.name?.en || MAP_CHOICES.find((m) => m.id === mapId)?.name?.en || mapId),
      es: String(raw?.name?.es || MAP_CHOICES.find((m) => m.id === mapId)?.name?.es || mapId),
    },
    tileSize: 32,
    mapWidth,
    mapHeight,
    playerStart,
    ambientColor: safeHex(raw?.ambientColor, 0x1a1a2e),
    tiles: getTileLibrary(mapId),
    generate() {
      return mapData;
    },
    npcs: normalizeNPCs(raw?.npcs, mapWidth, mapHeight),
    questions: {
      [targetLang]: normalizeQuestions(raw?.questions, supportLang),
      en: normalizeQuestions(raw?.questions, supportLang),
      es: normalizeQuestions(raw?.questions, supportLang),
    },
    quest: null,
    greetings: {
      en: Array.isArray(raw?.greetings?.en) ? raw.greetings.en.slice(0, 6).map(String) : ["Let's practice!"],
      es: Array.isArray(raw?.greetings?.es) ? raw.greetings.es.slice(0, 6).map(String) : ["¡Vamos a practicar!"],
    },
  };
}

function withQuest(scenario, raw, supportLang, targetLang) {
  const questionsByLang = scenario.questions;
  return {
    ...scenario,
    quest: normalizeQuest(raw?.quest, scenario.npcs, questionsByLang, supportLang, targetLang),
  };
}

export async function generateScenarioWithAI(mapId, targetLang = "es", supportLang = "en") {
  const lessonTerms = getLessonTerms(targetLang);
  const prompt = buildPrompt({ mapId, targetLang, supportLang, lessonTerms });

  let text = "";
  try {
    const r = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: SCENARIO_MODEL,
        text: { format: { type: "text" } },
        input: prompt,
      }),
    });

    const contentType = r.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await r.json()
      : await r.text();

    text =
      (typeof payload?.output_text === "string" && payload.output_text) ||
      (Array.isArray(payload?.output) &&
        payload.output
          .map((it) =>
            (it?.content || []).map((seg) => seg?.text || "").join(""),
          )
          .join(" ")
          .trim()) ||
      (Array.isArray(payload?.content) && payload.content[0]?.text) ||
      (Array.isArray(payload?.choices) && payload.choices[0]?.message?.content) ||
      (typeof payload === "string" ? payload : "");
  } catch {
    text = "";
  }

  const parsed = parseJSON(text);
  const normalized = normalizeScenario({ raw: parsed, mapId, targetLang, supportLang });
  if (!normalized) return fallbackScenario(mapId, targetLang, supportLang);
  return withQuest(normalized, parsed, supportLang, targetLang);
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
