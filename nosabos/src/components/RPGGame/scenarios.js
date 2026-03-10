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

function generateQuestPlan(npcCount) {
  // Generate a random NPC visit order (sometimes non-linear)
  const linearOrders = [
    [0, 1, 2],
    [0, 1, 2],
  ];
  const nonLinearOrders = [
    [0, 2, 1],
    [2, 0, 1],
    [1, 0, 2],
    [1, 2, 0],
  ];
  const visitOrder = Math.random() < 0.5
    ? pickRandom(linearOrders)
    : pickRandom(nonLinearOrders);

  // For each NPC, pick a random number of interaction steps (1-3)
  const interactionTypes = ["choice", "speech"];
  const stepsPerNpc = {};
  for (let i = 0; i < npcCount; i++) {
    const stepCount = 1 + Math.floor(Math.random() * 3); // 1-3
    const steps = [];
    for (let s = 0; s < stepCount; s++) {
      steps.push(pickRandom(interactionTypes));
    }
    stepsPerNpc[i] = steps;
  }

  // Pick which NPC gets the gather quest (60% chance any game has one)
  // Never the last NPC in visit order (so there's still someone to hand off to after)
  const hasGather = Math.random() < 0.6;
  const gatherCandidates = visitOrder.slice(0, -1);
  const gatherNpcIdx = hasGather && gatherCandidates.length > 0
    ? pickRandom(gatherCandidates)
    : -1;

  return { visitOrder, stepsPerNpc, gatherNpcIdx };
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
      // Greeting pools — picked randomly per game instance
      firstGreetings: [
        (seed) => `¡Qué bueno que llegaste! Necesito tu ayuda urgente. ${seed}`,
        (seed) => `¡Por fin alguien viene! Escucha, tenemos un problema serio. ${seed}`,
        (seed) => `No vas a creer lo que pasó. ${seed}`,
        (seed) => `¡Ven, rápido! Algo terrible acaba de ocurrir. ${seed}`,
      ],
      midGreetings: [
        (fromNpc) => `¿${fromNpc} te envió? Entonces la situación es seria.`,
        (fromNpc) => `Ah, vienes de parte de ${fromNpc}. Ya me imaginaba que esto iba a pasar.`,
        (fromNpc) => `${fromNpc} hizo bien en mandarte aquí. Tengo información importante.`,
        (fromNpc) => `¡Menos mal que llegaste! ${fromNpc} me dijo que eres de confianza.`,
      ],
      finalGreetings: [
        (fromNpc) => `¡Llegas justo a tiempo! ${fromNpc} me avisó que vendrías.`,
        (fromNpc) => `Te estaba esperando. ${fromNpc} me contó todo.`,
        (fromNpc) => `¡Al fin! ${fromNpc} dijo que tú podrías resolver esto.`,
        (fromNpc) => `Sabía que vendrías. ${fromNpc} confía mucho en ti.`,
      ],
      // Choice pools — each is [text, replyFn] pairs
      choiceSets: [
        [
          ["¿Qué pasó exactamente? Cuéntame todo.", () => "Todo empezó esta mañana. Necesitamos actuar rápido antes de que sea tarde."],
          ["Estoy listo para ayudar. ¿Por dónde empiezo?", () => "Gracias por ofrecerte. No puedo hacer esto solo."],
          ["Mmm... esto suena a que alguien metió la pata.", () => "¡Ja! Tienes razón. Pero ahora tú puedes arreglarlo."],
          ["¿Y por qué debería importarme?", () => "Oye, sé que suena raro... pero en serio, si no ayudas, esto se pone feo."],
          ["¡Ja! ¿Otra vez problemas? Nunca falla.", () => "Así es la vida aquí. Pero esta vez es diferente, créeme."],
        ],
        [
          ["Exacto. ¿Qué sabes tú sobre esto?", () => "Escuché rumores sobre eso. Hay que investigar más a fondo."],
          ["Necesito más información para continuar.", () => "Claro, esto es lo que sé. La situación es más compleja de lo que parece."],
          ["¿Tú también estás metido en este lío?", () => "¡Oye! Yo soy inocente. Pero sí, sé más de lo que parece."],
          ["No tengo todo el día. Habla rápido.", () => "Tranquilo, tranquilo. Las prisas no ayudan, pero te lo resumo rápido."],
          ["A ver, ¿tú eres el experto o qué?", () => "Digamos que sé un par de cosas. Escucha con atención."],
        ],
        [
          ["Terminemos con esto. ¿Qué falta?", () => "Solo queda una cosa. Estamos a punto de resolverlo."],
          ["¿Cuál es el último paso?", () => "Casi terminamos. Todo depende de este último paso."],
          ["Espero que valga la pena tanto esfuerzo.", () => "Te prometo que sí. Has llegado muy lejos para rendirte ahora."],
          ["Ya era hora. Casi me duermo esperando.", () => "Jaja, no te culpo. Pero el final vale la pena, te lo aseguro."],
          ["¡Por fin! Esto se va a poner bueno.", () => "¡Así me gusta! Con esa energía lo resolvemos en un segundo."],
        ],
        [
          ["¿Hay algo que pueda hacer ahora mismo?", () => "Sí, de hecho hay algo urgente. Déjame explicarte."],
          ["¿Quién más sabe sobre esto?", () => "Pocos lo saben. Pero hay alguien que puede ayudarnos."],
          ["¿Cuánto tiempo tenemos?", () => "No mucho. Cada minuto cuenta."],
          ["Dame los detalles, no te guardes nada.", () => "Está bien, te cuento todo. Presta atención."],
          ["¿Es peligroso?", () => "Un poco, pero nada que no podamos manejar juntos."],
        ],
        [
          ["¿Cómo descubriste todo esto?", () => "Fue por accidente. Estaba caminando y noté algo extraño."],
          ["¿Alguien más ha intentado resolver esto?", () => "Sí, pero nadie lo ha logrado. Por eso necesitamos ayuda."],
          ["¿Qué pasa si no hacemos nada?", () => "Las cosas se pondrían muy mal. No podemos quedarnos de brazos cruzados."],
          ["Cuéntame más sobre el lugar.", () => "Este lugar tiene muchos secretos. Algunos mejor dejarlos en paz."],
          ["¿Confías en las personas de aquí?", () => "En algunas sí, en otras no tanto. Hay que tener cuidado."],
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
      playerBridge: (fromNpc, toNpc) => `${fromNpc} me envió. Dice que tú sabes algo importante.`,
      npcHandoff: (nextNpc) => `Ve con ${nextNpc}. Creo que sabe algo más que puede ayudarnos.`,
      questComplete: "¡Misión cumplida! Has resuelto el misterio.",
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
      firstGreetings: [
        (seed) => `I'm glad you're here! I need your help urgently. ${seed}`,
        (seed) => `Finally, someone showed up! Listen, we have a serious problem. ${seed}`,
        (seed) => `You won't believe what happened. ${seed}`,
        (seed) => `Come, quick! Something terrible just happened. ${seed}`,
      ],
      midGreetings: [
        (fromNpc) => `${fromNpc} sent you? Then the situation is serious.`,
        (fromNpc) => `Ah, you come from ${fromNpc}. I figured this would happen.`,
        (fromNpc) => `${fromNpc} did well sending you here. I have important information.`,
        (fromNpc) => `Thank goodness you're here! ${fromNpc} said you could be trusted.`,
      ],
      finalGreetings: [
        (fromNpc) => `You arrived just in time! ${fromNpc} told me you were coming.`,
        (fromNpc) => `I was waiting for you. ${fromNpc} told me everything.`,
        (fromNpc) => `At last! ${fromNpc} said you could solve this.`,
        (fromNpc) => `I knew you'd come. ${fromNpc} trusts you a lot.`,
      ],
      choiceSets: [
        [
          ["What exactly happened? Tell me everything.", () => "It all started this morning. We need to act fast before it's too late."],
          ["I'm ready to help. Where do I start?", () => "Thanks for volunteering. I can't do this alone."],
          ["Hmm... sounds like someone really messed up.", () => "Ha! You're right. But now you can fix it."],
          ["Why should I care about this?", () => "Hey, I know it sounds weird... but seriously, if you don't help, things get ugly."],
          ["Ha! Problems again? Never a dull moment here.", () => "That's life around here. But this time it's different, trust me."],
        ],
        [
          ["Exactly. What do you know about this?", () => "I've heard rumors about that. We need to dig deeper."],
          ["I need more information to continue.", () => "Sure, here's what I know. The situation is more complex than it seems."],
          ["Are you mixed up in this mess too?", () => "Hey! I'm innocent. But yeah, I know more than it looks."],
          ["I don't have all day. Talk fast.", () => "Easy, easy. Rushing won't help, but I'll give you the short version."],
          ["So, are you the expert or what?", () => "Let's just say I know a thing or two. Listen carefully."],
        ],
        [
          ["Let's finish this. What's left?", () => "Just one thing left. We're about to solve this."],
          ["What's the last step?", () => "We're almost done. It all comes down to this last step."],
          ["I hope all this effort was worth it.", () => "I promise it is. You've come too far to give up now."],
          ["Finally. I almost fell asleep waiting.", () => "Haha, can't blame you. But the ending is worth it, trust me."],
          ["Let's go! This is about to get good.", () => "That's the spirit! With that energy we'll solve this in no time."],
        ],
        [
          ["Is there something I can do right now?", () => "Yes, actually there's something urgent. Let me explain."],
          ["Who else knows about this?", () => "Few people know. But there's someone who can help us."],
          ["How much time do we have?", () => "Not much. Every minute counts."],
          ["Give me the details, don't hold back.", () => "Alright, I'll tell you everything. Pay attention."],
          ["Is it dangerous?", () => "A little, but nothing we can't handle together."],
        ],
        [
          ["How did you find out about all this?", () => "It was by accident. I was walking and noticed something strange."],
          ["Has anyone else tried to solve this?", () => "Yes, but nobody succeeded. That's why we need help."],
          ["What happens if we do nothing?", () => "Things would get really bad. We can't just sit around."],
          ["Tell me more about this place.", () => "This place has many secrets. Some are better left alone."],
          ["Do you trust the people here?", () => "Some of them, yes. Others, not so much. We need to be careful."],
        ],
      ],
      speechPrompts: [
        () => "Interesting... What do you think about all of this?",
        () => "Hmm, tell me more. What's your take?",
        () => "Before we continue... how do you see the situation?",
        () => "I want to hear your perspective. What would you say?",
        () => "That makes me think... what do you believe happened?",
      ],
      playerBridge: (fromNpc, toNpc) => `${fromNpc} sent me. They say you know something important.`,
      npcHandoff: (nextNpc) => `Go find ${nextNpc}. I think they know something more that can help us.`,
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

  // Generate a random quest plan for this game instance
  const plan = generateQuestPlan(npcs.length);

  // Pick gather items (only if a gather step exists)
  const gatherData = plan.gatherNpcIdx >= 0
    ? pickGatherItems(mapId, tl)
    : pickGatherItems(mapId, tl); // always prepare gather data for safety

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

  const treeByNpc = npcs.map((npc, npcIdx) => {
    const visitPos = plan.visitOrder.indexOf(npcIdx);
    const isFirstVisit = visitPos === 0;
    const isLastVisit = visitPos === plan.visitOrder.length - 1;
    const prevNpcIdx = visitPos > 0 ? plan.visitOrder[visitPos - 1] : -1;
    const nextNpcIdx = !isLastVisit ? plan.visitOrder[visitPos + 1] : -1;
    const prevNpc = prevNpcIdx >= 0 ? npcs[prevNpcIdx] : null;
    const nextNpc = nextNpcIdx >= 0 ? npcs[nextNpcIdx] : null;
    const interactions = plan.stepsPerNpc[npcIdx]; // e.g. ["choice", "speech"] or ["speech"] etc.
    const hasGather = npcIdx === plan.gatherNpcIdx;

    const nodeId = (n) => `npc-${npcIdx}-node-${n}`;
    const nodes = [];
    let nodeCounter = 1;

    // Pick greeting based on visit position
    let greetLine;
    if (isFirstVisit) {
      greetLine = pickRandom(t.firstGreetings)(storySeed);
    } else if (isLastVisit) {
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

    // Add gather node if this NPC has the gather quest
    if (hasGather) {
      const correctItem = gatherData.correct[0] || { name: t.defaultTopic, hint: "", isCorrect: true };
      const gatherId = nodeId(nodeCounter);
      const gatherSuccessId = nodeId(nodeCounter + 1);

      // Point the last interaction node to the gather node
      const lastNode = nodes[nodes.length - 1];
      if (lastNode) {
        if (lastNode.responseMode === "choice") {
          lastNode.choices.forEach((c) => { c.nextNodeId = gatherId; });
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
        nextNodeId: gatherSuccessId,
      });
      nodeCounter++;

      // Gather success + handoff/terminal
      if (isLastVisit) {
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
          lastNode.choices.forEach((c) => { c.nextNodeId = terminalId; });
        } else {
          lastNode.nextNodeId = terminalId;
        }
      }

      if (isLastVisit) {
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
      npcIdx,
      nextNpcIdx: nextNpcIdx >= 0 ? nextNpcIdx : undefined,
      title: t.actLabel(npc.name, visitPos + 1),
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
