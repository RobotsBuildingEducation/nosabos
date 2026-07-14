// Tier-1 beat dealing: manifest beat specs + flashcard term pools + the CEFR
// profile → concrete, playable beats. Pure data in, pure data out; the runner
// renders and scores them. Tier-2 flavor (flavor.js) may later upgrade the
// authored frame lines — never the answers.

import { getCefrProfile } from "../episodes/profile";
import { ITEM_CATALOG, ITEM_IDS, getItemName } from "../episodes/itemArt";
import {
  buildTranslationCheck,
  conceptText,
  getDistractorCards,
  getTermCards,
  mulberry32,
  seededShuffle,
} from "./terms";
import { FLASHCARD_DATA } from "../../../data/flashcardData";

// ─── Authored framing lines (tier-1 voice of every episode) ─────────────────
const FRAMES = {
  en: {
    request: (item) => `Could you bring me ${item}, please?`,
    handOver: (item) => `Here you go — ${item}.`,
    listenNeed: (item) => `I need ${item}.`,
    ask: (concept) => `How do you say "${concept}"?`,
    formIntro: () => "Help me fill this in:",
    mismatchIntro: () => "One of these is wrong:",
    right: () => "Perfect, thank you!",
    wrong: () => "Hmm, that's not it.",
  },
  es: {
    request: (item) => `¿Me traes ${item}, por favor?`,
    handOver: (item) => `Aquí tienes ${item}.`,
    listenNeed: (item) => `Necesito ${item}.`,
    ask: (concept) => `¿Cómo se dice "${concept}"?`,
    formIntro: () => "Ayúdame a completar esto:",
    mismatchIntro: () => "Una de estas está mal:",
    right: () => "¡Perfecto, gracias!",
    wrong: () => "Mmm, eso no es.",
  },
  pt: {
    request: (item) => `Você me traz ${item}, por favor?`,
    handOver: (item) => `Aqui está — ${item}.`,
    listenNeed: (item) => `Eu preciso de ${item}.`,
    ask: (concept) => `Como se diz "${concept}"?`,
    formIntro: () => "Me ajude a preencher isto:",
    mismatchIntro: () => "Uma destas está errada:",
    right: () => "Perfeito, obrigado!",
    wrong: () => "Hmm, não é isso.",
  },
  it: {
    request: (item) => `Mi porti ${item}, per favore?`,
    handOver: (item) => `Ecco qui — ${item}.`,
    listenNeed: (item) => `Ho bisogno di ${item}.`,
    ask: (concept) => `Come si dice "${concept}"?`,
    formIntro: () => "Aiutami a completare questo:",
    mismatchIntro: () => "Una di queste è sbagliata:",
    right: () => "Perfetto, grazie!",
    wrong: () => "Mmm, non è quello.",
  },
  fr: {
    request: (item) => `Tu peux m'apporter ${item}, s'il te plaît ?`,
    handOver: (item) => `Voilà — ${item}.`,
    listenNeed: (item) => `J'ai besoin de ${item}.`,
    ask: (concept) => `Comment dit-on « ${concept} » ?`,
    formIntro: () => "Aide-moi à remplir ceci :",
    mismatchIntro: () => "L'une d'elles est fausse :",
    right: () => "Parfait, merci !",
    wrong: () => "Hmm, ce n'est pas ça.",
  },
  de: {
    request: (item) => `Bringst du mir bitte ${item}?`,
    handOver: (item) => `Bitte sehr — ${item}.`,
    listenNeed: (item) => `Ich brauche ${item}.`,
    ask: (concept) => `Wie sagt man „${concept}"?`,
    formIntro: () => "Hilf mir, das auszufüllen:",
    mismatchIntro: () => "Eines davon ist falsch:",
    right: () => "Perfekt, danke!",
    wrong: () => "Hmm, das ist es nicht.",
  },
  ja: {
    request: (item) => `${item}を持ってきてくれる？`,
    handOver: (item) => `はい、どうぞ。${item}です。`,
    listenNeed: (item) => `${item}が必要です。`,
    ask: (concept) => `「${concept}」は何と言いますか？`,
    formIntro: () => "これを一緒に書きましょう：",
    mismatchIntro: () => "一つだけまちがいがあります：",
    right: () => "かんぺき！ありがとう！",
    wrong: () => "うーん、ちがいます。",
  },
  hi: {
    request: (item) => `क्या आप मुझे ${item} ला सकते हैं?`,
    handOver: (item) => `यह लीजिए — ${item}।`,
    listenNeed: (item) => `मुझे ${item} चाहिए।`,
    ask: (concept) => `"${concept}" को क्या कहते हैं?`,
    formIntro: () => "इसे भरने में मेरी मदद करें:",
    mismatchIntro: () => "इनमें से एक गलत है:",
    right: () => "बहुत बढ़िया, धन्यवाद!",
    wrong: () => "हम्म, यह नहीं है।",
  },
  ar: {
    request: (item) => `هل تحضر لي ${item} من فضلك؟`,
    handOver: (item) => `تفضل — ${item}.`,
    listenNeed: (item) => `أحتاج إلى ${item}.`,
    ask: (concept) => `كيف نقول "${concept}"؟`,
    formIntro: () => "ساعدني في ملء هذا:",
    mismatchIntro: () => "واحدة من هذه خاطئة:",
    right: () => "ممتاز، شكرًا!",
    wrong: () => "همم، ليس هذا.",
  },
  zh: {
    request: (item) => `可以帮我拿${item}吗？`,
    handOver: (item) => `给你——${item}。`,
    listenNeed: (item) => `我需要${item}。`,
    ask: (concept) => `"${concept}"怎么说？`,
    formIntro: () => "帮我填一下这个：",
    mismatchIntro: () => "其中一个是错的：",
    right: () => "太好了，谢谢！",
    wrong: () => "嗯，不是这个。",
  },
};

function frames(lang) {
  return FRAMES[lang] || FRAMES.en;
}

// ─── Weak-spot seeding (companion memory → answer cards) ─────────────────────
export function findCardsForConcepts(
  concepts = [],
  targetLang = "es",
  limit = 16,
  allowLoose = true,
) {
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^[\s]*(el|la|los|las|un|una|the|a|an)\s+/i, "")
      .trim();
  const wanted = concepts
    .flatMap((concept) => String(concept || "").split(/[,;/|+]/))
    .map(normalize)
    .filter((concept) => concept.length > 1);
  if (!wanted.length) return [];
  const ranked = [];
  for (const card of FLASHCARD_DATA) {
    const target = normalize(conceptText(card, targetLang));
    const english = normalize(conceptText(card, "en"));
    const exact = wanted.some(
      (concept) => target === concept || english === concept,
    );
    const loose = wanted.some(
      (concept) =>
        (target && target.length >= 3 && concept.includes(target)) ||
        (english && english.length >= 3 && concept.includes(english)),
    );
    if (exact || loose) ranked.push({ card, rank: exact ? 0 : 1 });
  }
  const exactMatches = ranked.filter((entry) => entry.rank === 0);
  const selected =
    exactMatches.length >= 3 || !allowLoose ? exactMatches : ranked;
  return selected
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.card)
    .filter(
      (card, index, cards) =>
        cards.findIndex((candidate) => candidate.id === card.id) === index,
    )
    .slice(0, limit);
}

function buildUnitContextBeats(ctx, specs, finaleSpec, weakConcepts, unitConcepts) {
  const { targetLang, supportLang, rng } = ctx;
  const unitCards = findCardsForConcepts(
    unitConcepts,
    targetLang,
    20,
    false,
  ).filter(
    (card) => conceptText(card, targetLang),
  );
  if (unitCards.length < 3) return null;

  const weakCards = findCardsForConcepts(weakConcepts, targetLang, 2).filter(
    (card) => conceptText(card, targetLang),
  );
  const answerPool = [
    ...weakCards,
    ...seededShuffle(unitCards, rng),
  ].filter(
    (card, index, cards) =>
      cards.findIndex((candidate) => candidate.id === card.id) === index,
  );
  const beatSpecs = [...specs, finaleSpec];
  const beats = beatSpecs.map((spec, index) => {
    const answerCard = answerPool[index % answerPool.length];
    const distractors = seededShuffle(
      unitCards.filter((card) => card.id !== answerCard.id),
      rng,
    ).slice(0, 2);
    const answer = conceptText(answerCard, targetLang);
    const support =
      conceptText(answerCard, supportLang) || conceptText(answerCard, "en");
    const prompt = frames(targetLang).ask(support);
    const isFinale = index === beatSpecs.length - 1;
    return {
      kind: "check",
      primitive: "choice-check",
      promptTarget: prompt,
      promptSupport: frames(supportLang).ask
        ? frames(supportLang).ask(support)
        : support,
      options: seededShuffle(
        [
          { label: answer, correct: true },
          ...distractors.map((card) => ({
            label: conceptText(card, targetLang),
            correct: false,
          })),
        ],
        rng,
      ),
      conceptLabel: answer,
      expectedAnswer: answer,
      sayAloudTarget: answer,
      ttsText: prompt,
      id: isFinale ? "finale" : `b${index + 1}`,
      index,
      isFinale,
      npcIdx: Number.isInteger(spec?.npc) ? spec.npc : 0,
    };
  });

  return {
    beats,
    worldItems: [],
    reactions: {
      right: frames(targetLang).right(),
      wrong: frames(targetLang).wrong(),
    },
  };
}

// ─── Per-kind builders ───────────────────────────────────────────────────────
function pickEpisodeItems(manifest, rng, count, excludeIds = new Set()) {
  const categories = new Set(manifest.itemCategories || []);
  const eligible = ITEM_IDS.filter(
    (id) =>
      !excludeIds.has(id) &&
      (ITEM_CATALOG[id].categories || []).some((cat) => categories.has(cat)),
  );
  const pool = eligible.length >= count ? eligible : ITEM_IDS.filter((id) => !excludeIds.has(id));
  return seededShuffle(pool, rng).slice(0, count);
}

function buildFetchBeat(ctx, spec, state) {
  // A fetch beat only makes sense when the active unit actually supplies
  // fetchable objects. Never swap in map/restaurant items for a unit such as
  // Colors just to satisfy this mechanic.
  if (state.strictUnitContent) return null;
  const { targetLang, supportLang, rng } = ctx;
  const [answerId, decoyA, decoyB] = pickEpisodeItems(
    ctx.manifest,
    rng,
    3,
    state.usedItemIds,
  );
  if (!answerId) return null;
  [answerId, decoyA, decoyB].filter(Boolean).forEach((id) => state.usedItemIds.add(id));
  const itemName = getItemName(answerId, targetLang);
  const supportName = getItemName(answerId, supportLang);
  state.worldItems.push(
    { itemId: answerId },
    ...(decoyA ? [{ itemId: decoyA }] : []),
    ...(decoyB ? [{ itemId: decoyB }] : []),
  );
  return {
    kind: "fetch",
    primitive: "fetch-serve",
    promptTarget: frames(targetLang).request(itemName),
    promptSupport: frames(supportLang).request
      ? frames(supportLang).request(supportName)
      : supportName,
    answerItemId: answerId,
    conceptLabel: itemName,
    expectedAnswer: itemName,
    sayAloudTarget: frames(targetLang).handOver(itemName),
    ttsText: frames(targetLang).request(itemName),
  };
}

function buildListenBeat(ctx, spec, state) {
  const { targetLang, supportLang, rng } = ctx;
  const preferred = state.preferredCards.shift();
  if (!preferred && state.strictUnitContent) return null;
  const picked = preferred
    ? [preferred]
    : pickEpisodeItems(ctx.manifest, rng, 1, state.usedItemIds);
  const answer = preferred
    ? conceptText(preferred, targetLang)
    : getItemName(picked[0], targetLang);
  if (!answer) return null;
  const support = preferred
    ? conceptText(preferred, supportLang) || conceptText(preferred, "en")
    : getItemName(picked[0], supportLang);
  const ttsText = frames(targetLang).listenNeed(answer);
  return {
    kind: "listen",
    primitive: "listen-and-pick",
    promptTarget: ttsText,
    promptSupport: frames(supportLang).listenNeed
      ? frames(supportLang).listenNeed(support)
      : support,
    ttsText,
    ttsFirst: true,
    options: [],
    conceptLabel: answer,
    expectedAnswer: ttsText,
    sayAloudTarget: ttsText,
  };
}

function buildCheckBeat(ctx, spec, state) {
  const { targetLang, supportLang, level, rng } = ctx;
  const preferred = state.preferredCards.shift() || null;
  let check = null;
  if (preferred) {
    const distractors = getDistractorCards({ answerCard: preferred, level, count: 2, rng });
    const options = seededShuffle(
      [
        { text: conceptText(preferred, targetLang), correct: true, cardId: preferred.id },
        ...distractors.map((card) => ({
          text: conceptText(card, targetLang),
          correct: false,
          cardId: card.id,
        })),
      ].filter((option) => option.text),
      rng,
    );
    check = {
      card: preferred,
      promptConcept: conceptText(preferred, supportLang) || conceptText(preferred, "en"),
      answer: conceptText(preferred, targetLang),
      options,
    };
  }
  if ((!check || check.options.length < 2) && !state.strictUnitContent) {
    check = buildTranslationCheck({
      targetLang,
      supportLang,
      level,
      categories: ctx.manifest.termCategories,
      rng,
      excludeIds: [...state.usedCardIds],
    });
    if (!check) {
      check = buildTranslationCheck({
        targetLang,
        supportLang,
        level,
        categories: null,
        rng,
        excludeIds: [...state.usedCardIds],
      });
    }
  }
  if (!check || check.options.length < 2) return null;
  state.usedCardIds.add(check.card.id);
  return {
    kind: "check",
    primitive: "choice-check",
    promptTarget: frames(targetLang).ask(check.promptConcept),
    promptSupport: frames(supportLang).ask
      ? frames(supportLang).ask(check.promptConcept)
      : check.promptConcept,
    options: check.options.map((option) => ({ label: option.text, correct: option.correct })),
    conceptLabel: check.answer,
    expectedAnswer: check.answer,
    sayAloudTarget: check.answer,
    ttsText: frames(targetLang).ask(check.promptConcept),
  };
}

function buildMismatchBeat(ctx, spec, state) {
  const { targetLang, supportLang, level, rng } = ctx;
  const cards = state.strictUnitContent
    ? [state.preferredCards.shift(), state.preferredCards.shift()].filter(Boolean)
    : getTermCards({
        level,
        categories: ctx.manifest.termCategories,
        count: 2,
        rng,
        excludeIds: [...state.usedCardIds],
      });
  if (cards.length < 2) return null;
  const [goodCard, trapCard] = cards;
  const wrongMeaning = getDistractorCards({ answerCard: trapCard, level, count: 1, rng })[0];
  if (!wrongMeaning) return null;
  [goodCard, trapCard].forEach((card) => state.usedCardIds.add(card.id));

  const pair = (card, meaningCard) =>
    `"${conceptText(card, targetLang)}" = ${conceptText(meaningCard, supportLang) || conceptText(meaningCard, "en")}`;

  const statements = seededShuffle(
    [
      { text: pair(goodCard, goodCard), wrong: false },
      { text: pair(trapCard, wrongMeaning), wrong: true },
    ],
    rng,
  );
  return {
    kind: "mismatch",
    primitive: "spot-the-mismatch",
    promptTarget: frames(targetLang).mismatchIntro(),
    promptSupport: frames(supportLang).mismatchIntro
      ? frames(supportLang).mismatchIntro()
      : "",
    statements,
    conceptLabel: conceptText(trapCard, targetLang),
    expectedAnswer: `${conceptText(trapCard, targetLang)} = ${conceptText(trapCard, supportLang) || conceptText(trapCard, "en")}`,
    sayAloudTarget: conceptText(goodCard, targetLang),
    ttsText: frames(targetLang).mismatchIntro(),
  };
}

function buildFormBeat(ctx, spec, state) {
  const { targetLang, supportLang, level, rng } = ctx;
  const profile = getCefrProfile(level);
  const fieldCount = Math.min(3, Math.max(2, profile.constraintsPerBeat));
  const fields = [];
  for (let i = 0; i < fieldCount; i++) {
    const preferred = state.preferredCards.shift() || null;
    const check = preferred
      ? {
          card: preferred,
          promptConcept:
            conceptText(preferred, supportLang) || conceptText(preferred, "en"),
          answer: conceptText(preferred, targetLang),
          options: seededShuffle(
            [
              { text: conceptText(preferred, targetLang), correct: true },
              ...getDistractorCards({ answerCard: preferred, level, count: 2, rng }).map(
                (card) => ({ text: conceptText(card, targetLang), correct: false }),
              ),
            ].filter((option) => option.text),
            rng,
          ),
        }
      : state.strictUnitContent
        ? null
        : buildTranslationCheck({
            targetLang,
            supportLang,
            level,
            categories: ctx.manifest.termCategories,
            rng,
            excludeIds: [...state.usedCardIds],
          });
    if (!check) break;
    state.usedCardIds.add(check.card.id);
    fields.push({
      label: check.promptConcept,
      options: check.options.map((option) => ({ label: option.text, correct: option.correct })),
      answer: check.answer,
    });
  }
  if (fields.length < 2) return null;
  return {
    kind: "form",
    primitive: "form-fill",
    promptTarget: frames(targetLang).formIntro(),
    promptSupport: frames(supportLang).formIntro ? frames(supportLang).formIntro() : "",
    fields,
    conceptLabel: fields[0].answer,
    expectedAnswer: fields.map((field) => field.answer).join(", "),
    sayAloudTarget: fields[0].answer,
    ttsText: frames(targetLang).formIntro(),
  };
}

const BUILDERS = {
  fetch: buildFetchBeat,
  listen: buildListenBeat,
  check: buildCheckBeat,
  mismatch: buildMismatchBeat,
  form: buildFormBeat,
};

// ─── Run dealer ──────────────────────────────────────────────────────────────
/**
 * Deal a full run from a manifest.
 * Returns { beats, worldItems, reactions } — beats include the finale (last,
 * weight ×2). Any beat kind that can't be built (thin category pools) falls
 * back to a translation check so a run always has its full beat count.
 */
export function dealRun({
  manifest,
  targetLang = "es",
  supportLang = "en",
  level = "A1",
  weakConcepts = [],
  unitConcepts = [],
  seed = 1,
}) {
  const rng = mulberry32(seed);
  const specs = [...(manifest.beats || [])].slice(0, 6);
  const finaleSpec =
    manifest.finale || specs[specs.length - 1] || { kind: "check", npc: 0 };
  const ctx = { manifest, targetLang, supportLang, level, rng };
  const unitCards = findCardsForConcepts(unitConcepts, targetLang, 20, false);
  const strictUnitContent = unitCards.length >= 3;
  const state = {
    usedItemIds: new Set(),
    usedCardIds: new Set(),
    worldItems: [],
    strictUnitContent,
    preferredCards: [
      ...findCardsForConcepts(weakConcepts, targetLang).slice(0, 2),
      ...(strictUnitContent
        ? Array.from({ length: 3 }, () => unitCards).flat()
        : findCardsForConcepts(unitConcepts, targetLang)),
    ].filter(
      (card, index, cards) =>
        cards.findIndex((candidate) => candidate.id === card.id) === index,
    ),
  };
  const beats = [];
  [...specs, finaleSpec].forEach((spec, index) => {
    const isFinale = index === specs.length;
    const builder = BUILDERS[spec.kind] || buildCheckBeat;
    let beat = builder(ctx, spec, state);
    if (!beat) beat = buildCheckBeat(ctx, spec, state);
    if (!beat) return;
    beats.push({
      ...beat,
      id: isFinale ? "finale" : `b${index + 1}`,
      index,
      isFinale,
      npcIdx: Number.isInteger(spec.npc) ? spec.npc : 0,
    });
  });

  return {
    beats,
    worldItems: state.worldItems,
    reactions: {
      right: frames(targetLang).right(),
      wrong: frames(targetLang).wrong(),
    },
  };
}
