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

// ─── Gather-quest item definitions per map theme ──────────────────────────
const GATHER_ITEMS_BY_MAP = {
  livingRoom: {
    es: {
      correct: [
        { name: "la llave dorada", hint: "Busca cerca de los estantes.", sprite: "key" },
        { name: "el libro antiguo", hint: "Mira debajo de los muebles.", sprite: "book" },
        { name: "la carta sellada", hint: "Revisa junto a la puerta.", sprite: "letter" },
      ],
      decoys: [
        { name: "el jarrón roto", sprite: "vase" },
        { name: "la cuchara vieja", sprite: "spoon" },
        { name: "el botón suelto", sprite: "button" },
      ],
    },
    en: {
      correct: [
        { name: "the golden key", hint: "Look near the shelves.", sprite: "key" },
        { name: "the old book", hint: "Check under the furniture.", sprite: "book" },
        { name: "the sealed letter", hint: "Search by the door.", sprite: "letter" },
      ],
      decoys: [
        { name: "the broken vase", sprite: "vase" },
        { name: "the old spoon", sprite: "spoon" },
        { name: "the loose button", sprite: "button" },
      ],
    },
  },
  park: {
    es: {
      correct: [
        { name: "la flor rara", hint: "Crece entre los árboles.", sprite: "flower" },
        { name: "la piedra brillante", hint: "Está escondida en el camino.", sprite: "stone" },
        { name: "la pluma azul", hint: "Cerca de la fuente.", sprite: "feather" },
      ],
      decoys: [
        { name: "la hoja seca", sprite: "leaf" },
        { name: "la rama torcida", sprite: "branch" },
        { name: "el caracol vacío", sprite: "shell" },
      ],
    },
    en: {
      correct: [
        { name: "the rare flower", hint: "It grows among the trees.", sprite: "flower" },
        { name: "the shiny stone", hint: "Hidden on the path.", sprite: "stone" },
        { name: "the blue feather", hint: "Near the fountain.", sprite: "feather" },
      ],
      decoys: [
        { name: "the dry leaf", sprite: "leaf" },
        { name: "the crooked branch", sprite: "branch" },
        { name: "the empty shell", sprite: "shell" },
      ],
    },
  },
  airport: {
    es: {
      correct: [
        { name: "el pasaporte perdido", hint: "Alguien lo dejó en una banca.", sprite: "passport" },
        { name: "la etiqueta de equipaje", hint: "Revisa los mostradores.", sprite: "tag" },
        { name: "el boleto dorado", hint: "Mira cerca de la entrada.", sprite: "ticket" },
      ],
      decoys: [
        { name: "el recibo arrugado", sprite: "receipt" },
        { name: "la tarjeta vencida", sprite: "card" },
        { name: "el folleto viejo", sprite: "brochure" },
      ],
    },
    en: {
      correct: [
        { name: "the lost passport", hint: "Someone left it on a bench.", sprite: "passport" },
        { name: "the luggage tag", hint: "Check the counters.", sprite: "tag" },
        { name: "the golden ticket", hint: "Look near the entrance.", sprite: "ticket" },
      ],
      decoys: [
        { name: "the crumpled receipt", sprite: "receipt" },
        { name: "the expired card", sprite: "card" },
        { name: "the old brochure", sprite: "brochure" },
      ],
    },
  },
};

function pickGatherItems(mapId, targetLang) {
  const data = GATHER_ITEMS_BY_MAP[mapId]?.[targetLang] ||
    GATHER_ITEMS_BY_MAP[mapId]?.es ||
    GATHER_ITEMS_BY_MAP.park.es;
  const correctPool = [...data.correct].sort(() => Math.random() - 0.5);
  const decoyPool = [...data.decoys].sort(() => Math.random() - 0.5);
  // 1 correct + 2 decoys
  const correct = correctPool.slice(0, 1).map((item) => ({ ...item, isCorrect: true }));
  const decoys = decoyPool.slice(0, 2).map((item) => ({ ...item, isCorrect: false }));
  return { correct, decoys, all: [...correct, ...decoys].sort(() => Math.random() - 0.5) };
}

function normalizeQuest(rawQuest, npcs, questionsByLang, supportLang, targetLang, mapId = "park") {
  const rawStorySeed = String(rawQuest?.storySeed || "").trim();
  const tl = targetLang;

  const L = {
    es: {
      defaultSeed: "La campana del pueblo desapareció y nadie sabe quién la tomó.",
      defaultIntro: (name) => `Comienza con ${name} y sigue las pistas para resolver el misterio.`,
      actLabel: (name, n) => `${name} · acto ${n}`,
      connectClue: (name, next) => `${name} conecta la pista anterior con ${next}.`,
      defaultTopic: "las pistas del caso",
      fallbackSpeech: "No alcancé a oírte bien. Inténtalo otra vez.",
      heardPrefix: "Perfecto, escuché",
      // NPC dialogue — all in target language now
      npc0Greet: (seed) => `¡Qué bueno que llegaste! Necesito tu ayuda urgente. ${seed}`,
      npc0Choice1: "¿Qué pasó exactamente? Cuéntame todo.",
      npc0Choice2: "Estoy listo para ayudar. ¿Por dónde empiezo?",
      npc0Reply1: (seed) => `Todo empezó esta mañana. ${seed} Necesitamos actuar rápido.`,
      npc0Reply2: (seed) => `Gracias por ofrecerte. ${seed} Por eso necesito tu ayuda.`,
      npcSpeechPrompt: (seed) => `Interesante... ¿Y tú qué opinas sobre todo esto? ${seed}`,
      // Player dialogue bridging NPCs
      playerBridge: (fromNpc, toNpc) => `${fromNpc} me envió. Dice que tú sabes algo importante.`,
      npcMidGreet: (fromNpc) => `¿${fromNpc} te envió? Entonces la situación es seria.`,
      npcMidChoice1: "Exacto. ¿Qué sabes tú sobre esto?",
      npcMidChoice2: "Necesito más información para continuar.",
      npcMidReply1: (seed) => `Escuché rumores sobre eso. ${seed} Hay que investigar más.`,
      npcMidReply2: (seed) => `Claro, esto es lo que sé: ${seed} La situación es más compleja de lo que parece.`,
      npcHandoff: (nextNpc, detail) => `Ve con ${nextNpc}. ${detail}`,
      npcFinalGreet: (fromNpc) => `¡Llegas justo a tiempo! ${fromNpc} me avisó que vendrías.`,
      npcFinalChoice1: "Terminemos con esto. ¿Qué falta?",
      npcFinalChoice2: "¿Cuál es el último paso?",
      npcFinalReply1: (seed) => `Solo queda una cosa. ${seed} Estamos a punto de resolverlo.`,
      npcFinalReply2: (seed) => `Casi terminamos. ${seed} Todo depende de este último paso.`,
      questComplete: "¡Misión cumplida! Has resuelto el misterio.",
      // Gather quest
      gatherIntro: (itemName) => `Necesito que encuentres ${itemName} en este lugar. Ten cuidado, hay muchas cosas por ahí que no sirven.`,
      gatherHint: (hint) => `Una pista: ${hint}`,
      gatherWrongItem: (wrongName, correctName) => `Eso es ${wrongName}. No es lo que necesito. Busca ${correctName}.`,
      gatherSuccess: (itemName) => `¡Excelente! Tienes ${itemName}. Eso me ayuda mucho.`,
      gatherPlayerReport: (itemName) => `Encontré ${itemName}. Aquí está.`,
      speechContinue: "Entiendo lo que dices. Sigamos adelante.",
    },
    en: {
      defaultSeed: "The town bell disappeared and nobody knows who took it.",
      defaultIntro: (name) => `Start with ${name} and follow the clues to solve the mystery.`,
      actLabel: (name, n) => `${name} · act ${n}`,
      connectClue: (name, next) => `${name} connects the previous clue to ${next}.`,
      defaultTopic: "the case clues",
      fallbackSpeech: "I couldn't hear you clearly. Try again.",
      heardPrefix: "Perfect, I heard",
      npc0Greet: (seed) => `I'm glad you're here! I need your help urgently. ${seed}`,
      npc0Choice1: "What exactly happened? Tell me everything.",
      npc0Choice2: "I'm ready to help. Where do I start?",
      npc0Reply1: (seed) => `It all started this morning. ${seed} We need to act fast.`,
      npc0Reply2: (seed) => `Thanks for volunteering. ${seed} That's why I need your help.`,
      npcSpeechPrompt: (seed) => `Interesting... What do you think about all of this? ${seed}`,
      playerBridge: (fromNpc, toNpc) => `${fromNpc} sent me. They say you know something important.`,
      npcMidGreet: (fromNpc) => `${fromNpc} sent you? Then the situation is serious.`,
      npcMidChoice1: "Exactly. What do you know about this?",
      npcMidChoice2: "I need more information to continue.",
      npcMidReply1: (seed) => `I've heard rumors about that. ${seed} We need to dig deeper.`,
      npcMidReply2: (seed) => `Sure, here's what I know: ${seed} The situation is more complex than it seems.`,
      npcHandoff: (nextNpc, detail) => `Go find ${nextNpc}. ${detail}`,
      npcFinalGreet: (fromNpc) => `You arrived just in time! ${fromNpc} told me you were coming.`,
      npcFinalChoice1: "Let's finish this. What's left?",
      npcFinalChoice2: "What's the last step?",
      npcFinalReply1: (seed) => `Just one thing left. ${seed} We're about to solve this.`,
      npcFinalReply2: (seed) => `We're almost done. ${seed} It all comes down to this last step.`,
      questComplete: "Quest complete! You solved the mystery.",
      gatherIntro: (itemName) => `I need you to find ${itemName} somewhere around here. Be careful, there are lots of things out there that won't help.`,
      gatherHint: (hint) => `A clue: ${hint}`,
      gatherWrongItem: (wrongName, correctName) => `That's ${wrongName}. Not what I need. Look for ${correctName}.`,
      gatherSuccess: (itemName) => `Excellent! You have ${itemName}. That helps a lot.`,
      gatherPlayerReport: (itemName) => `I found ${itemName}. Here it is.`,
      speechContinue: "I understand what you're saying. Let's keep going.",
    },
  };

  const t = L[tl] || L.es;

  const storySeed = rawStorySeed || t.defaultSeed;
  const startNpcIdx = clampInt(rawQuest?.startNpcIdx, 0, npcs.length - 1, 0);
  const intro =
    String(rawQuest?.intro || "").trim() ||
    t.defaultIntro(npcs[startNpcIdx]?.name || "NPC");

  // Pick gather items for the middle NPC's gather quest
  const gatherData = pickGatherItems(mapId, tl);

  const treeByNpc = npcs.map((npc, npcIdx) => {
    const previousNpc = npcs[(npcIdx - 1 + npcs.length) % npcs.length];
    const nextNpc = npcs[(npcIdx + 1) % npcs.length];
    const isFirst = npcIdx === 0;
    const isLast = npcIdx === npcs.length - 1;
    const isMid = !isFirst && !isLast;

    const nodeId = (n) => `npc-${npcIdx}-node-${n}`;

    // Build nodes depending on NPC position in the quest
    let nodes;

    if (isFirst) {
      // NPC 0: story introduction, free conversation, handoff to NPC 1
      nodes = [
        {
          id: nodeId(1),
          npcLine: sanitizeDialogueLine(t.npc0Greet(storySeed), npc.name),
          responseMode: "choice",
          choices: [
            {
              text: t.npc0Choice1,
              npcReply: t.npc0Reply1(storySeed),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npc0Choice2,
              npcReply: t.npc0Reply2(storySeed),
              nextNodeId: nodeId(2),
            },
          ],
        },
        {
          id: nodeId(2),
          npcLine: sanitizeDialogueLine(t.npcSpeechPrompt(storySeed), npc.name),
          responseMode: "speech",
          speechFallbackReply: t.fallbackSpeech,
          speechContinueReply: t.speechContinue,
          nextNodeId: nodeId(3),
        },
        {
          id: nodeId(3),
          npcLine: sanitizeDialogueLine(t.npcHandoff(nextNpc.name, storySeed), npc.name),
          responseMode: "none",
          terminal: true,
          playerBridge: t.playerBridge(npc.name, nextNpc.name),
        },
      ];
    } else if (isMid) {
      // Middle NPC: conversation then gather quest — player must find correct item
      const correctItem = gatherData.correct[0] || { name: t.defaultTopic, hint: "", isCorrect: true };
      nodes = [
        {
          id: nodeId(1),
          playerLine: t.playerBridge(previousNpc.name, npc.name),
          npcLine: sanitizeDialogueLine(t.npcMidGreet(previousNpc.name), npc.name),
          responseMode: "choice",
          choices: [
            {
              text: t.npcMidChoice1,
              npcReply: t.npcMidReply1(storySeed),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npcMidChoice2,
              npcReply: t.npcMidReply2(storySeed),
              nextNodeId: nodeId(2),
            },
          ],
        },
        {
          id: nodeId(2),
          npcLine: sanitizeDialogueLine(t.npcSpeechPrompt(storySeed), npc.name),
          responseMode: "speech",
          speechFallbackReply: t.fallbackSpeech,
          speechContinueReply: t.speechContinue,
          nextNodeId: nodeId(3),
        },
        {
          id: nodeId(3),
          npcLine: sanitizeDialogueLine(
            `${t.gatherIntro(correctItem.name)} ${t.gatherHint(correctItem.hint)}`,
            npc.name,
          ),
          responseMode: "gather",
          gatherItem: correctItem,
          nextNodeId: nodeId(4),
        },
        {
          id: nodeId(4),
          playerLine: t.gatherPlayerReport(correctItem.name),
          npcLine: sanitizeDialogueLine(
            `${t.gatherSuccess(correctItem.name)} ${t.npcHandoff(nextNpc.name, storySeed)}`,
            npc.name,
          ),
          responseMode: "none",
          terminal: true,
          playerBridge: t.playerBridge(npc.name, nextNpc.name),
        },
      ];
    } else {
      // Last NPC: conclusion
      nodes = [
        {
          id: nodeId(1),
          playerLine: t.playerBridge(previousNpc.name, npc.name),
          npcLine: sanitizeDialogueLine(t.npcFinalGreet(previousNpc.name), npc.name),
          responseMode: "choice",
          choices: [
            {
              text: t.npcFinalChoice1,
              npcReply: t.npcFinalReply1(storySeed),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npcFinalChoice2,
              npcReply: t.npcFinalReply2(storySeed),
              nextNodeId: nodeId(2),
            },
          ],
        },
        {
          id: nodeId(2),
          npcLine: sanitizeDialogueLine(t.npcSpeechPrompt(storySeed), npc.name),
          responseMode: "speech",
          speechFallbackReply: t.fallbackSpeech,
          speechContinueReply: t.speechContinue,
          nextNodeId: nodeId(3),
        },
        {
          id: nodeId(3),
          npcLine: sanitizeDialogueLine(t.questComplete, npc.name),
          responseMode: "none",
          terminal: true,
        },
      ];
    }

    return {
      npcIdx,
      title: t.actLabel(npc.name, npcIdx + 1),
      intro: t.connectClue(npc.name, nextNpc.name),
      nodes,
    };
  });

  return {
    intro,
    storySeed,
    startNpcIdx,
    treeByNpc,
    gatherData,
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
    quest: normalizeQuest(null, npcs, questionsByLang, supportLang, targetLang, mapId),
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
    "intro": "one sentence in TARGET language",
    "storySeed": "one dramatic sentence in TARGET language describing the main mystery",
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
    quest: normalizeQuest(raw?.quest, scenario.npcs, questionsByLang, supportLang, targetLang, scenario.id),
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
