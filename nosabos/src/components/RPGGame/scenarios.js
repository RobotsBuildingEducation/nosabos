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
        { name: "the golden key", hint: "Look near the shelves.", sprite: "key" },
        { name: "the old book", hint: "Check under the furniture.", sprite: "book" },
        { name: "the sealed letter", hint: "Search by the door.", sprite: "letter" },
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
        { name: "la flor rara", hint: "Crece entre los árboles.", sprite: "flower" },
        { name: "la piedra brillante", hint: "Está escondida en el camino.", sprite: "stone" },
        { name: "la pluma azul", hint: "Cerca de la fuente.", sprite: "feather" },
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
        { name: "the rare flower", hint: "It grows among the trees.", sprite: "flower" },
        { name: "the shiny stone", hint: "Hidden on the path.", sprite: "stone" },
        { name: "the blue feather", hint: "Near the fountain.", sprite: "feather" },
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
        { name: "el pasaporte perdido", hint: "Alguien lo dejó en una banca.", sprite: "passport" },
        { name: "la etiqueta de equipaje", hint: "Revisa los mostradores.", sprite: "tag" },
        { name: "el boleto dorado", hint: "Mira cerca de la entrada.", sprite: "ticket" },
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
        { name: "the lost passport", hint: "Someone left it on a bench.", sprite: "passport" },
        { name: "the luggage tag", hint: "Check the counters.", sprite: "tag" },
        { name: "the golden ticket", hint: "Look near the entrance.", sprite: "ticket" },
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

function pickGatherItems(mapId, targetLang) {
  const data = GATHER_ITEMS_BY_MAP[mapId]?.[targetLang] ||
    GATHER_ITEMS_BY_MAP[mapId]?.es ||
    GATHER_ITEMS_BY_MAP.park.es;
  const correctPool = [...data.correct].sort(() => Math.random() - 0.5);
  const decoyPool = [...data.decoys].sort(() => Math.random() - 0.5);
  // 2 correct + 8 decoys = 10 items
  const correct = correctPool.slice(0, 2).map((item) => ({ ...item, isCorrect: true }));
  const decoys = decoyPool.slice(0, 8).map((item) => ({ ...item, isCorrect: false }));
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
      npc0Choice3: "Mmm... esto suena a que alguien metió la pata.",
      npc0Choice4: "¿Y por qué debería importarme?",
      npc0Choice5: "¡Ja! ¿Otra vez problemas? Nunca falla.",
      npc0Reply1: () => `Todo empezó esta mañana. Necesitamos actuar rápido antes de que sea tarde.`,
      npc0Reply2: () => `Gracias por ofrecerte. Por eso necesito tu ayuda, no puedo hacer esto solo.`,
      npc0Reply3: () => `¡Ja! Tienes razón, alguien la regó. Pero ahora tú puedes arreglarlo.`,
      npc0Reply4: () => `Oye, sé que suena raro... pero en serio, si no ayudas, esto se pone feo.`,
      npc0Reply5: () => `Así es la vida aquí. Siempre pasa algo. Pero esta vez es diferente, créeme.`,
      npcSpeechPrompt: () => `Interesante... ¿Y tú qué opinas sobre todo esto?`,
      // Player dialogue bridging NPCs
      playerBridge: (fromNpc, toNpc) => `${fromNpc} me envió. Dice que tú sabes algo importante.`,
      npcMidGreet: (fromNpc) => `¿${fromNpc} te envió? Entonces la situación es seria.`,
      npcMidChoice1: "Exacto. ¿Qué sabes tú sobre esto?",
      npcMidChoice2: "Necesito más información para continuar.",
      npcMidChoice3: "¿Tú también estás metido en este lío?",
      npcMidChoice4: "No tengo todo el día. Habla rápido.",
      npcMidChoice5: "A ver, ¿tú eres el experto o qué?",
      npcMidReply1: () => `Escuché rumores sobre eso. Hay que investigar más a fondo.`,
      npcMidReply2: () => `Claro, esto es lo que sé. La situación es más compleja de lo que parece.`,
      npcMidReply3: () => `¡Oye! Yo soy inocente. Pero sí, sé más de lo que parece.`,
      npcMidReply4: () => `Tranquilo, tranquilo. Las prisas no ayudan, pero te lo resumo rápido.`,
      npcMidReply5: () => `Digamos que sé un par de cosas. Escucha con atención.`,
      npcHandoff: (nextNpc) => `Ve con ${nextNpc}. Creo que sabe algo más que puede ayudarnos.`,
      npcFinalGreet: (fromNpc) => `¡Llegas justo a tiempo! ${fromNpc} me avisó que vendrías.`,
      npcFinalChoice1: "Terminemos con esto. ¿Qué falta?",
      npcFinalChoice2: "¿Cuál es el último paso?",
      npcFinalChoice3: "Espero que valga la pena tanto esfuerzo.",
      npcFinalChoice4: "Ya era hora. Casi me duermo esperando.",
      npcFinalChoice5: "¡Por fin! Esto se va a poner bueno.",
      npcFinalReply1: () => `Solo queda una cosa. Estamos a punto de resolverlo.`,
      npcFinalReply2: () => `Casi terminamos. Todo depende de este último paso.`,
      npcFinalReply3: () => `Te prometo que sí. Has llegado muy lejos para rendirte ahora.`,
      npcFinalReply4: () => `Jaja, no te culpo. Pero el final vale la pena, te lo aseguro.`,
      npcFinalReply5: () => `¡Así me gusta! Con esa energía lo resolvemos en un segundo.`,
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
      npc0Choice3: "Hmm... sounds like someone really messed up.",
      npc0Choice4: "Why should I care about this?",
      npc0Choice5: "Ha! Problems again? Never a dull moment here.",
      npc0Reply1: () => `It all started this morning. We need to act fast before it's too late.`,
      npc0Reply2: () => `Thanks for volunteering. That's why I need your help, I can't do this alone.`,
      npc0Reply3: () => `Ha! You're right, someone dropped the ball. But now you can fix it.`,
      npc0Reply4: () => `Hey, I know it sounds weird... but seriously, if you don't help, things get ugly.`,
      npc0Reply5: () => `That's life around here. Something always happens. But this time it's different, trust me.`,
      npcSpeechPrompt: () => `Interesting... What do you think about all of this?`,
      playerBridge: (fromNpc, toNpc) => `${fromNpc} sent me. They say you know something important.`,
      npcMidGreet: (fromNpc) => `${fromNpc} sent you? Then the situation is serious.`,
      npcMidChoice1: "Exactly. What do you know about this?",
      npcMidChoice2: "I need more information to continue.",
      npcMidChoice3: "Are you mixed up in this mess too?",
      npcMidChoice4: "I don't have all day. Talk fast.",
      npcMidChoice5: "So, are you the expert or what?",
      npcMidReply1: () => `I've heard rumors about that. We need to dig deeper.`,
      npcMidReply2: () => `Sure, here's what I know. The situation is more complex than it seems.`,
      npcMidReply3: () => `Hey! I'm innocent. But yeah, I know more than it looks.`,
      npcMidReply4: () => `Easy, easy. Rushing won't help, but I'll give you the short version.`,
      npcMidReply5: () => `Let's just say I know a thing or two. Listen carefully.`,
      npcHandoff: (nextNpc) => `Go find ${nextNpc}. I think they know something more that can help us.`,
      npcFinalGreet: (fromNpc) => `You arrived just in time! ${fromNpc} told me you were coming.`,
      npcFinalChoice1: "Let's finish this. What's left?",
      npcFinalChoice2: "What's the last step?",
      npcFinalChoice3: "I hope all this effort was worth it.",
      npcFinalChoice4: "Finally. I almost fell asleep waiting.",
      npcFinalChoice5: "Let's go! This is about to get good.",
      npcFinalReply1: () => `Just one thing left. We're about to solve this.`,
      npcFinalReply2: () => `We're almost done. It all comes down to this last step.`,
      npcFinalReply3: () => `I promise it is. You've come too far to give up now.`,
      npcFinalReply4: () => `Haha, can't blame you. But the ending is worth it, trust me.`,
      npcFinalReply5: () => `That's the spirit! With that energy we'll solve this in no time.`,
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
              npcReply: t.npc0Reply1(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npc0Choice2,
              npcReply: t.npc0Reply2(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npc0Choice3,
              npcReply: t.npc0Reply3(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npc0Choice4,
              npcReply: t.npc0Reply4(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npc0Choice5,
              npcReply: t.npc0Reply5(),
              nextNodeId: nodeId(2),
            },
          ],
        },
        {
          id: nodeId(2),
          npcLine: sanitizeDialogueLine(t.npcSpeechPrompt(), npc.name),
          responseMode: "speech",
          speechFallbackReply: t.fallbackSpeech,
          speechContinueReply: t.speechContinue,
          nextNodeId: nodeId(3),
        },
        {
          id: nodeId(3),
          npcLine: sanitizeDialogueLine(t.npcHandoff(nextNpc.name), npc.name),
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
              npcReply: t.npcMidReply1(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npcMidChoice2,
              npcReply: t.npcMidReply2(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npcMidChoice3,
              npcReply: t.npcMidReply3(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npcMidChoice4,
              npcReply: t.npcMidReply4(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npcMidChoice5,
              npcReply: t.npcMidReply5(),
              nextNodeId: nodeId(2),
            },
          ],
        },
        {
          id: nodeId(2),
          npcLine: sanitizeDialogueLine(t.npcSpeechPrompt(), npc.name),
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
            `${t.gatherSuccess(correctItem.name)} ${t.npcHandoff(nextNpc.name)}`,
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
              npcReply: t.npcFinalReply1(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npcFinalChoice2,
              npcReply: t.npcFinalReply2(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npcFinalChoice3,
              npcReply: t.npcFinalReply3(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npcFinalChoice4,
              npcReply: t.npcFinalReply4(),
              nextNodeId: nodeId(2),
            },
            {
              text: t.npcFinalChoice5,
              npcReply: t.npcFinalReply5(),
              nextNodeId: nodeId(2),
            },
          ],
        },
        {
          id: nodeId(2),
          npcLine: sanitizeDialogueLine(t.npcSpeechPrompt(), npc.name),
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
