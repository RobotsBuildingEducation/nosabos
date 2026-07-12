// Adapter from the authored episode engine to the original RPG renderer's
// scenario/quest contract. This is the intended cutover seam: content changes,
// presentation does not.

import { dealRun, findCardsForConcepts } from "../content/slots";
import { buildEpisodeWorld } from "./mapRecipes";
import {
  dealCastNames,
  getEpisodeManifest,
  getEpisodeName,
  getEpisodeObjective,
} from "./manifests";
import { getItemName } from "./itemArt";
import { getLanguagePromptName } from "../../../constants/languages";

// Language props can arrive empty during app hydration. Fall back to the same
// persisted settings the game component itself trusts, so a missing prop can
// never silently downgrade a run to the es/en defaults.
function resolveRuntimeLang(value, storageKey, fallback) {
  const clean = String(value || "").trim();
  if (clean) return clean;
  try {
    if (typeof window !== "undefined") {
      const stored = String(
        window.localStorage.getItem(storageKey) || "",
      ).trim();
      if (stored) return stored;
    }
  } catch {
    // Storage unavailable — use the fallback.
  }
  return fallback;
}

// Script sanity check for non-Latin languages: if the model answered in the
// wrong language entirely (the classic es/en drift), refuse to cache or apply
// the result so the next run can try again.
const SCRIPT_RANGES = {
  ja: /[぀-ヿ一-鿿]/,
  zh: /[一-鿿]/,
  ar: /[؀-ۿ]/,
  hi: /[ऀ-ॿ]/,
};

function matchesExpectedScript(lang, text) {
  const range = SCRIPT_RANGES[lang];
  if (!range) return true;
  const sample = String(text || "");
  if (!sample.trim()) return true;
  return range.test(sample);
}

function preparedStoryMatchesLanguages(prepared, targetLang, supportLang) {
  const targetSample = [
    prepared.beats[0]?.npcLine,
    prepared.beats[0]?.options?.join(" "),
    prepared.intro?.target,
  ]
    .filter(Boolean)
    .join(" ");
  const supportSample = [
    prepared.beats[0]?.sceneLine,
    prepared.beats[0]?.coverage,
    prepared.intro?.support,
    prepared.personas?.[0],
  ]
    .filter(Boolean)
    .join(" ");
  return (
    matchesExpectedScript(targetLang, targetSample) &&
    matchesExpectedScript(supportLang, supportSample)
  );
}

function hashSeed(value) {
  return [...String(value || "episode")].reduce(
    (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
}

function makeRng(seed) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffled(values, rng) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function beatChoices(beat, run, targetLang, rng) {
  if (Array.isArray(beat.options)) {
    return beat.options.map((option) => ({
      text: option.label,
      correct: !!option.correct,
    }));
  }
  if (Array.isArray(beat.statements)) {
    return beat.statements.map((statement) => ({
      text: statement.text,
      correct: !!statement.wrong,
    }));
  }
  if (Array.isArray(beat.fields)) {
    const correct = beat.fields.map((field) => field.answer).join(" · ");
    const distractors = [0, 1].map((offset) =>
      beat.fields
        .map((field, fieldIndex) => {
          const wrong = field.options.filter((option) => !option.correct);
          return wrong[(fieldIndex + offset) % Math.max(wrong.length, 1)]?.label;
        })
        .filter(Boolean)
        .join(" · "),
    );
    return shuffled(
      [
        { text: correct, correct: true },
        ...distractors.filter(Boolean).map((text) => ({ text, correct: false })),
      ],
      rng,
    );
  }
  if (beat.answerItemId) {
    const otherItems = run.worldItems
      .map((entry) => entry.itemId)
      .filter((itemId) => itemId !== beat.answerItemId)
      .filter((itemId, index, items) => items.indexOf(itemId) === index)
      .slice(0, 2);
    return shuffled(
      [
        {
          text: getItemName(beat.answerItemId, targetLang),
          correct: true,
        },
        ...otherItems.map((itemId) => ({
          text: getItemName(itemId, targetLang),
          correct: false,
        })),
      ],
      rng,
    );
  }
  return [{ text: beat.expectedAnswer, correct: true }];
}

// Bump whenever the authored run structure or unit-grounding rules change so
// stale all-choice/map-themed runs cannot be reused from localStorage.
const PREPARED_BEATS_SCHEMA = "v5-lang-guard";

function preparedBeatsCacheKey({ lesson, targetLang, level, episodeId }) {
  return `rpgPreparedBeats:${PREPARED_BEATS_SCHEMA}:${targetLang}:${level}:${
    lesson?.gameReviewContext?.unitId || lesson?.id || "unit"
  }:${episodeId}`;
}

function cleanLine(value, max) {
  return String(value || "").trim().slice(0, max);
}

function cleanBilingual(raw, max = 260) {
  const target = cleanLine(raw?.target, max);
  const support = cleanLine(raw?.support, max);
  if (!target && !support) return null;
  return { target, support };
}

function validatePreparedStory(raw) {
  const beats = Array.isArray(raw?.beats) ? raw.beats : null;
  if (!beats || beats.length !== 7) return null;
  const cleaned = beats.map((beat, index) => {
    const mode = beat?.mode === "speech" ? "speech" : "choice";
    const npcLine = cleanLine(beat?.npcLine, 260);
    const options = Array.isArray(beat?.options)
      ? beat.options.map((option) => String(option || "").trim()).filter(Boolean)
      : [];
    const correctIndex = Number(beat?.correctIndex);
    // Speech beats are open role-play invitations. The example answer doubles
    // as the local-matcher fallback target when the grading call is offline.
    const speechExample = cleanLine(
      beat?.speechExample || beat?.speechTarget,
      160,
    );
    const speechGoal = cleanLine(beat?.speechGoal || beat?.coverage, 200);
    if (
      !npcLine ||
      (mode === "choice" &&
        (options.length !== 3 ||
          !Number.isInteger(correctIndex) ||
          correctIndex < 0 ||
          correctIndex > 2)) ||
      (mode === "speech" && !speechExample)
    ) {
      return null;
    }
    return {
      id: index === 6 ? "finale" : `b${index + 1}`,
      mode,
      npcLine,
      sceneLine: cleanLine(beat?.sceneLine, 220),
      options: mode === "choice" ? options : [],
      correctIndex,
      speechExample,
      speechGoal,
      coverage: cleanLine(beat?.coverage, 180),
      concept: cleanLine(
        beat?.concept || speechExample || options[correctIndex] || "review",
        160,
      ),
      expectedAnswer: cleanLine(
        beat?.expectedAnswer || speechExample || options[correctIndex] || "",
        160,
      ),
      right: cleanLine(beat?.right, 200),
      wrong: cleanLine(beat?.wrong, 200),
    };
  });
  if (!cleaned.every(Boolean)) return null;
  const speechCount = cleaned.filter((beat) => beat.mode === "speech").length;
  if (speechCount < 2 || speechCount > 3) return null;
  return {
    beats: cleaned,
    title: cleanLine(raw?.title, 90),
    intro: cleanBilingual(raw?.intro),
    epilogue: cleanBilingual(raw?.epilogue),
    personas: Array.isArray(raw?.personas)
      ? raw.personas
          .map((persona) =>
            cleanLine(
              typeof persona === "string" ? persona : persona?.vibe,
              140,
            ),
          )
          .filter(Boolean)
          .slice(0, 8)
      : [],
  };
}

function parsePreparedJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function applyPreparedBeats(scenario, prepared) {
  const preparedBeats = prepared.beats;
  const npcCount = Math.max(scenario.npcs.length, 1);
  const personas = prepared.personas || [];
  return {
    ...scenario,
    npcs: scenario.npcs.map((npc, index) => ({
      ...npc,
      personality: personas[index % Math.max(personas.length, 1)] ||
        npc.personality,
    })),
    storyTitle: prepared.title || "",
    storyIntro: prepared.intro || null,
    storyEpilogue: prepared.epilogue || null,
    quest: {
      ...scenario.quest,
      intro: prepared.intro?.support || scenario.quest.intro,
      storySeed:
        [scenario.quest.storySeed, prepared.intro?.target]
          .filter(Boolean)
          .join(" ") || scenario.quest.storySeed,
      steps: preparedBeats.map((beat, index) => ({
        id: beat.id,
        npcIdx: index % npcCount,
        title: beat.concept,
        weight: index === 6 ? 2 : 1,
        conceptLabel: beat.concept,
        expectedAnswer: beat.expectedAnswer,
        primitive:
          beat.mode === "speech" ? "say-aloud" : "choice-check",
        nodes: [
          {
            id: `${beat.id}-check`,
            responseMode: beat.mode,
            npcLine: beat.npcLine,
            prompt: beat.npcLine,
            supportLine: beat.coverage,
            // Storybook caption bridging from the previous beat's outcome.
            sceneLine:
              beat.sceneLine ||
              (index === 0 ? prepared.intro?.support || "" : ""),
            speechTarget: beat.speechExample,
            speechExample: beat.speechExample,
            speechGoal: beat.speechGoal,
            speechContinueReply: beat.right,
            speechFallbackReply: beat.wrong,
            weight: index === 6 ? 2 : 1,
            conceptLabel: beat.concept,
            expectedAnswer: beat.expectedAnswer,
            primitive:
              beat.mode === "speech" ? "say-aloud" : "choice-check",
            choices: beat.mode === "choice" ? beat.options.map((text, optionIndex) => ({
              text,
              correct: optionIndex === beat.correctIndex,
              npcReply:
                optionIndex === beat.correctIndex
                  ? beat.right || scenario.quest.steps[index]?.nodes?.[0]?.choices?.find(
                      (choice) => choice.correct,
                    )?.npcReply
                  : beat.wrong || scenario.quest.steps[index]?.nodes?.[0]?.choices?.find(
                      (choice) => !choice.correct,
                    )?.npcReply,
              nextNodeId: null,
            })) : [],
          },
        ],
      })),
    },
    authoredEpisode: {
      ...scenario.authoredEpisode,
      unitGrounded: true,
      preparedWith: "constrained-content-call",
    },
  };
}

export function buildLegacyEpisodeScenario({
  lesson,
  targetLang: targetLangProp = "",
  supportLang: supportLangProp = "",
  forcedEpisodeId = null,
  seed: requestedSeed = null,
}) {
  const targetLang = resolveRuntimeLang(targetLangProp, "userTargetLang", "es");
  const supportLang = resolveRuntimeLang(supportLangProp, "appLanguage", "en");
  const game = lesson?.content?.game || {};
  const reviewTerms =
    lesson?.gameReviewContext?.reviewTerms || [
      ...(game.unitTopics || []),
      ...(game.focusPoints || []),
    ];
  const episodeId =
    forcedEpisodeId ||
    game.episodeOverride ||
    game.episodeCandidates?.[0] ||
    "marketRush";
  const manifest = getEpisodeManifest(episodeId);
  const level =
    lesson?.gameReviewContext?.cefrLevel || game.cefrLevel || "A1";
  const seed =
    requestedSeed ?? hashSeed(`${lesson?.id || "harness"}:${episodeId}:${targetLang}`);
  const rng = makeRng(seed);
  const world = buildEpisodeWorld(manifest, seed);
  const run = dealRun({
    manifest,
    targetLang,
    supportLang,
    level,
    unitConcepts: reviewTerms,
    seed,
  });
  const castNames = dealCastNames(manifest, rng);
  const mapId = `episode-${episodeId}`;

  const npcs = world.npcSpots.map((spot, index) => ({
    name: castNames[index] || `NPC ${index + 1}`,
    role: manifest.cast?.[index]?.role || "character",
    personality: manifest.cast?.[index]?.role || "friendly",
    tx: spot.tx,
    ty: spot.ty,
    mapId,
  }));

  const steps = run.beats.map((beat) => {
    const choices = beatChoices(beat, run, targetLang, rng).map((choice) => ({
      ...choice,
      npcReply: choice.correct ? run.reactions.right : run.reactions.wrong,
      nextNodeId: null,
    }));
    return {
      id: beat.id,
      npcIdx: beat.npcIdx % Math.max(npcs.length, 1),
      title: beat.conceptLabel,
      weight: beat.isFinale ? 2 : 1,
      conceptLabel: beat.conceptLabel,
      expectedAnswer: beat.expectedAnswer,
      primitive: beat.primitive,
      nodes: [
        {
          id: `${beat.id}-check`,
          // Preserve authored interaction types instead of flattening every
          // beat to buttons in the legacy renderer.
          responseMode: beat.kind === "listen" ? "speech" : "choice",
          npcLine: beat.promptTarget,
          prompt: beat.promptTarget,
          supportLine: beat.promptSupport,
          speechTarget: beat.kind === "listen" ? beat.expectedAnswer : "",
          choices: beat.kind === "listen" ? [] : choices,
          weight: beat.isFinale ? 2 : 1,
          conceptLabel: beat.conceptLabel,
          expectedAnswer: beat.expectedAnswer,
          primitive: beat.primitive,
        },
      ],
    };
  });

  const map = {
    id: mapId,
    name: manifest.copy?.name || getEpisodeName(manifest, supportLang),
    tileSize: 32,
    mapWidth: world.mapWidth,
    mapHeight: world.mapHeight,
    playerStart: world.playerStart,
    ambientColor: world.blueprint?.ambientColor || 0x1a1a2e,
    tiles: world.tileLibrary,
    environment: world.blueprint,
    objects: world.objects || [],
    portals: [],
    generate: () => [...world.map],
  };

  const questions = run.beats.map((beat) => ({
    prompt: beat.promptTarget,
    answer: beat.expectedAnswer,
  }));

  return {
    id: mapId,
    startMapId: mapId,
    name: manifest.copy?.name || getEpisodeName(manifest, supportLang),
    emoji: manifest.emoji,
    tileSize: 32,
    mapWidth: world.mapWidth,
    mapHeight: world.mapHeight,
    playerStart: world.playerStart,
    ambientColor: map.ambientColor,
    tiles: world.tileLibrary,
    environment: world.blueprint,
    objects: world.objects || [],
    maps: [map],
    generate: map.generate,
    npcs,
    questions: {
      [targetLang]: questions,
      en: questions,
      es: questions,
    },
    quest: {
      title: getEpisodeName(manifest, supportLang),
      intro: getEpisodeObjective(manifest, supportLang),
      storySeed: getEpisodeObjective(manifest, targetLang),
      steps,
      gatherData: { all: [], correct: [] },
    },
    greetings: manifest.copy?.objective || {},
    authoredEpisode: {
      id: episodeId,
      level,
      maxBaseScore: 800,
      unitGrounded:
        findCardsForConcepts(reviewTerms, targetLang, 20, false).length >= 3,
    },
  };
}

export async function prepareLegacyEpisodeScenario(args) {
  const scenario = buildLegacyEpisodeScenario(args);

  const { lesson } = args;
  const targetLang = resolveRuntimeLang(args.targetLang, "userTargetLang", "es");
  const supportLang = resolveRuntimeLang(args.supportLang, "appLanguage", "en");
  const targetLangName = getLanguagePromptName(targetLang) || targetLang;
  const supportLangName = getLanguagePromptName(supportLang) || supportLang;
  const game = lesson?.content?.game || {};
  const context = lesson?.gameReviewContext || {};
  const cacheKey = preparedBeatsCacheKey({
    lesson,
    targetLang,
    level: scenario.authoredEpisode.level,
    episodeId: scenario.authoredEpisode.id,
  });

  try {
    const cached = validatePreparedStory(
      JSON.parse(window.localStorage.getItem(cacheKey) || "null"),
    );
    if (cached && preparedStoryMatchesLanguages(cached, targetLang, supportLang)) {
      return applyPreparedBeats(scenario, cached);
    }
  } catch {
    // Continue to the constrained call.
  }

  const npcNames = scenario.npcs.map((npc) => npc.name);
  const prompt = [
    "Create one connected story episode for a language-learning RPG review. The player is the hero of a small adventure; the NPCs are characters with personalities, wants, and moods — not quiz hosts.",
    `Target language: ${targetLangName} (code: ${targetLang}). The learner is studying ${targetLangName}.`,
    `Support language: ${supportLangName} (code: ${supportLang}). This is the learner's own language, used only for narration and labels.`,
    `LANGUAGE RULES (STRICT): "title", every "npcLine", every option, "speechExample", "right", "wrong", and the "target" fields of intro/epilogue must be written ONLY in ${targetLangName}. "personas", every "sceneLine", "coverage", "concept", "speechGoal", and the "support" fields of intro/epilogue must be written ONLY in ${supportLangName}. Do not use Spanish, English, or any other language for these fields unless it IS the language just named.`,
    `CEFR level: ${scenario.authoredEpisode.level}.`,
    `Unit: ${context.unitTitle || game.unitTitle || "Unit review"}.`,
    `Episode: ${scenario.quest.title}. Story objective: ${scenario.quest.intro}.`,
    `NPCs in story order (use these exact names, never invent new named characters): ${JSON.stringify(
      scenario.npcs.map((npc) => ({ name: npc.name, role: npc.role })),
    )}.`,
    "The episode setting is only the stage. NEVER test airport, café, market, luggage, food, or other setting vocabulary unless it explicitly appears in the curriculum below.",
    `Unit material: ${JSON.stringify((context.reviewTerms || game.unitTopics || []).slice(0, 35))}.`,
    context.reviewLessons?.length
      ? `Structured curriculum lessons: ${JSON.stringify(context.reviewLessons.slice(0, 10))}.`
      : "",
    context.reviewObjectives?.length
      ? `Unit objectives: ${JSON.stringify(context.reviewObjectives.slice(0, 12))}.`
      : "",
    "STORY LAYER:",
    `- "title": a short evocative story title in ${targetLangName}.`,
    `- "intro": 1-2 sentences of scene-setting narration with real stakes, tied to the story objective. Fields: "target" (${targetLangName}) and "support" (${supportLangName}).`,
    `- "personas": one vivid personality per NPC, in the same order as the NPC list (${npcNames.length} entries), written in ${supportLangName}, max 12 words each — e.g. "superstitious stallkeeper who blames the weather for everything". Every line that NPC speaks must sound like this person.`,
    `- Each beat gets "sceneLine": ONE short storybook-caption sentence in ${supportLangName} that bridges from the previous beat's outcome into this one (beat 1's sceneLine sets the opening scene). These captions, read in order, should retell the whole story.`,
    `- "epilogue": 1-2 sentences that close the story and credit what the player did, fields "target" (${targetLangName}) and "support" (${supportLangName}).`,
    "Build one continuous mini-story: arrival/setup, rising problem, cooperation between NPCs, complication, resolution, and a finale that pays off something established earlier.",
    "Every beat must advance that same story. NPCs must refer naturally to what the player or another NPC just accomplished; do not write seven isolated quiz introductions.",
    "Review depth matters: distribute the seven beats across the lessons and modes above. Include vocabulary recall, recognition in context, grammar/application, comprehension, and production when those appear in the curriculum. Do not merely repeat translations of the same three words.",
    "Write exactly 7 beats: exactly 2 or 3 speech beats and the rest choice beats. Vary the order; the finale may be either type.",
    `For choice mode: provide exactly 3 options in ${targetLangName} and correctIndex 0, 1, or 2. Distractors must diagnose a plausible misconception from this unit, not unrelated words.`,
    `For speech mode: this is FREE-FORM roleplay, never repeat-after-me. npcLine must end with an open question or invitation to the player — asking their opinion, a decision, a description, a negotiation — woven from the unit material. Provide "speechGoal": a ${supportLangName} description of what a good spoken answer does (the micro-goal a grader can check), and "speechExample": ONE natural example answer in ${targetLangName} a learner at this level could give. Do not provide options or correctIndex.`,
    `npcLine, options, speechExample, right, and wrong must be in ${targetLangName}. coverage, concept, speechGoal, and sceneLine are concise ${supportLangName} strings.`,
    "right must react in character to what the player did and pull the story toward the next event. wrong must stay in character, react to the actual mistake, and give a useful hint without changing subjects.",
    ["Pre-A1", "A1"].includes(scenario.authoredEpisode.level)
      ? "Use only very short, concrete beginner phrases. No advanced grammar and no unrelated vocabulary."
      : "Keep wording natural and appropriate to the stated CEFR level.",
    'Return ONLY JSON: {"title":"...","intro":{"target":"...","support":"..."},"personas":["..."],"beats":[{"mode":"choice|speech","sceneLine":"storybook caption","coverage":"lesson detail assessed","npcLine":"in-character story line plus challenge","options":["choice only","choice only","choice only"],"correctIndex":0,"speechGoal":"speech only","speechExample":"speech only","concept":"...","expectedAnswer":"...","right":"...","wrong":"..."}],"epilogue":{"target":"...","support":"..."}}',
  ]
    .filter(Boolean)
    .join("\n");

  let prepared = null;
  try {
    const { callResponses } = await import("../../../utils/llm");
    const response = await callResponses({ input: prompt });
    prepared = validatePreparedStory(parsePreparedJson(response));
  } catch {
    return scenario;
  }
  if (!prepared) return scenario;
  // Wrong-language output (the classic es/en drift) must never be cached or
  // shown; skipping the cache lets the next run retry with a fresh call.
  if (!preparedStoryMatchesLanguages(prepared, targetLang, supportLang)) {
    return scenario;
  }
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(prepared));
  } catch {
    // Cache is an optimization only.
  }
  return applyPreparedBeats(scenario, prepared);
}
