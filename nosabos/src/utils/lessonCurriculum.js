import { getManualPreA1AgendaItems } from "../data/manualPreA1Agendas.js";

const INVALID_OBJECTIVE_LABELS = new Set([
  "form",
  "use",
  "form and use",
  "pattern recycling",
  "micro-drills",
  "micro drills",
  "general vocabulary and grammar",
  "comprehensive review",
  "lesson focus",
]);

const REVIEW_LESSON_ID_PARTS = [
  "skill-builder",
  "integrated-practice",
  "-quiz",
  "-game",
];

const MODE_KIND = {
  vocabulary: "vocabulary",
  grammar: "grammar",
  reading: "comprehension",
  stories: "comprehension",
  realtime: "communication",
  game: "communication",
};

const AGENDA_TARGET_ROLES = new Set(["form", "goal"]);
const EXACT_FORM_MODES = new Set(["vocabulary"]);
const INSTRUCTIONAL_OBJECTIVE_PATTERN =
  /^(?:ask|complete|demonstrate|describe|discuss|follow|interpret|learn|listen|practice|read|repeat|roleplay|tell|the learner|the user|use only|write)\b/i;

const MODE_LABELS = {
  en: {
    vocabulary: "Use in context",
    grammar: "Use accurately",
    reading: "Recognize in a text",
    stories: "Understand in a story",
    realtime: "Use in conversation",
    game: "Apply in a review",
  },
  es: {
    vocabulary: "Usa en contexto",
    grammar: "Usa con precisión",
    reading: "Reconoce en un texto",
    stories: "Comprende en una historia",
    realtime: "Usa en conversación",
    game: "Aplica en un repaso",
  },
  pt: {
    vocabulary: "Use em contexto",
    grammar: "Use com precisão",
    reading: "Reconheça em um texto",
    stories: "Compreenda em uma história",
    realtime: "Use em uma conversa",
    game: "Aplique em uma revisão",
  },
  it: {
    vocabulary: "Usa nel contesto",
    grammar: "Usa con precisione",
    reading: "Riconosci in un testo",
    stories: "Comprendi in una storia",
    realtime: "Usa in una conversazione",
    game: "Applica in un ripasso",
  },
  fr: {
    vocabulary: "Utilise en contexte",
    grammar: "Utilise avec précision",
    reading: "Repère dans un texte",
    stories: "Comprends dans une histoire",
    realtime: "Utilise dans une conversation",
    game: "Applique dans une révision",
  },
  de: {
    vocabulary: "Im Kontext verwenden",
    grammar: "Korrekt verwenden",
    reading: "In einem Text erkennen",
    stories: "In einer Geschichte verstehen",
    realtime: "Im Gespräch verwenden",
    game: "In einer Wiederholung anwenden",
  },
  ja: {
    vocabulary: "文脈の中で使う",
    grammar: "正確に使う",
    reading: "文章の中で見分ける",
    stories: "物語の中で理解する",
    realtime: "会話の中で使う",
    game: "復習で応用する",
  },
  hi: {
    vocabulary: "संदर्भ में उपयोग करें",
    grammar: "सटीक रूप से उपयोग करें",
    reading: "पाठ में पहचानें",
    stories: "कहानी में समझें",
    realtime: "बातचीत में उपयोग करें",
    game: "समीक्षा में लागू करें",
  },
  ar: {
    vocabulary: "استخدم في السياق",
    grammar: "استخدم بدقة",
    reading: "تعرّف عليه في نص",
    stories: "افهمه في قصة",
    realtime: "استخدمه في محادثة",
    game: "طبّقه في مراجعة",
  },
  zh: {
    vocabulary: "在语境中使用",
    grammar: "准确使用",
    reading: "在文本中识别",
    stories: "在故事中理解",
    realtime: "在对话中使用",
    game: "在复习中运用",
  },
};

const EVIDENCE_BY_MODE = {
  vocabulary: {
    type: "produce_or_choose",
    criteria: "Uses or identifies the specified vocabulary in context",
  },
  grammar: {
    type: "produce_or_choose",
    criteria: "Uses or identifies the specified structure accurately",
  },
  reading: {
    type: "identify",
    criteria: "Identifies the specified meaning or form in written context",
  },
  stories: {
    type: "comprehend_and_respond",
    criteria: "Understands and responds using the specified lesson material",
  },
  realtime: {
    type: "scenario_response",
    criteria: "Completes the specified communicative action understandably",
  },
  game: {
    type: "scenario_response",
    criteria: "Applies the specified lesson material in the review scenario",
  },
};

const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const CURRICULUM_GROUNDING_STOP_WORDS = new Set([
  "accurate",
  "accurately",
  "about",
  "agreement",
  "and",
  "answer",
  "answers",
  "apply",
  "appropriate",
  "choose",
  "complete",
  "correct",
  "demonstrate",
  "form",
  "forms",
  "grammar",
  "identify",
  "match",
  "noun",
  "nouns",
  "plural",
  "practice",
  "read",
  "recognize",
  "sentence",
  "sentences",
  "singular",
  "structure",
  "structures",
  "the",
  "understand",
  "use",
  "word",
  "words",
  "with",
  "forma",
  "formas",
  "gramatica",
  "palabra",
  "palabras",
  "plural",
  "singular",
]);

const normalizeObjectiveKey = (value) =>
  cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:"'()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const collectTextValues = (value) => {
  if (typeof value === "string" || typeof value === "number") {
    return [cleanText(value)];
  }
  if (Array.isArray(value)) return value.flatMap(collectTextValues);
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectTextValues);
};

const getGroundingTerms = (value) =>
  Array.from(
    new Set(
      collectTextValues(value)
        .flatMap((text) =>
          normalizeObjectiveKey(text).match(/[\p{L}\p{M}\p{N}]+/gu),
        )
        .filter(
          (term) =>
            term &&
            term.length >= 3 &&
            !CURRICULUM_GROUNDING_STOP_WORDS.has(term),
        ),
    ),
  );

export function isCurriculumPayloadGrounded(
  payload,
  curriculumContext,
  { mode = "" } = {},
) {
  const agendaItems = Array.isArray(curriculumContext?.agendaItems)
    ? curriculumContext.agendaItems
    : [];
  const relevantItems = agendaItems.filter(
    (item) =>
      !mode ||
      !Array.isArray(item?.modes) ||
      item.modes.length === 0 ||
      item.modes.includes(mode),
  );
  if (!relevantItems.length) return true;

  const objectiveTerms = getGroundingTerms(
    relevantItems.flatMap((item) => [
      item?.targetConcept,
      ...(Array.isArray(item?.targetExamples) ? item.targetExamples : []),
    ]),
  );
  if (!objectiveTerms.length) return true;

  const candidateText = normalizeObjectiveKey(
    collectTextValues(payload).join(" "),
  );
  return objectiveTerms.some((term) => candidateText.includes(term));
}

const slugify = (value) =>
  normalizeObjectiveKey(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52) || "objective";

const getDisplayText = (value, lang = "en") => {
  if (typeof value === "string") return cleanText(value);
  if (!value || typeof value !== "object") return "";
  return cleanText(
    value[lang] || value.en || value.es || Object.values(value).find(Boolean),
  );
};

const uniqueText = (values = []) => {
  const seen = new Set();
  return values.filter((value) => {
    const key = normalizeObjectiveKey(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const extractItemText = (value) => {
  if (typeof value === "string" || typeof value === "number") {
    return cleanText(value);
  }
  if (!value || typeof value !== "object") return "";
  return cleanText(
    value.target ||
      value.word ||
      value.phrase ||
      value.answer ||
      value.label ||
      value.text,
  );
};

const normalizeTextList = (value) =>
  uniqueText(
    (Array.isArray(value) ? value : value ? [value] : [])
      .map(extractItemText)
      .filter(Boolean),
  );

export function isInstructionalLessonObjective(value) {
  const text = cleanText(value);
  const words = text.match(/[\p{L}\p{M}\p{N}]+/gu) || [];
  if (words.length <= 1) return false;
  // Comma/slash-separated vocabulary lists may legitimately begin with an
  // English verb such as "read, paint, cook, dance".
  if (/[,/|]/.test(text) && words.length <= 12) return false;
  return INSTRUCTIONAL_OBJECTIVE_PATTERN.test(text);
}

export function getAgendaTargetRole(item = {}) {
  if (AGENDA_TARGET_ROLES.has(item.targetRole)) return item.targetRole;
  if (normalizeTextList(item.targetForms).length) return "form";

  const mode =
    item.modes?.find((candidate) => MODE_KIND[candidate]) ||
    Object.entries(MODE_KIND).find(([, kind]) => kind === item.kind)?.[0] ||
    "";
  const concept = cleanText(item.targetConcept);
  return EXACT_FORM_MODES.has(mode) && !isInstructionalLessonObjective(concept)
    ? "form"
    : "goal";
}

export function getAgendaTargetForms(item = {}) {
  const explicit = normalizeTextList(item.targetForms);
  if (explicit.length) return explicit;
  if (getAgendaTargetRole(item) !== "form") return [];
  return normalizeTextList(item.targetConcept);
}

export function getAgendaGoal(item = {}) {
  return (
    cleanText(item.goal) ||
    cleanText(item.targetConcept) ||
    getDisplayText(item.label, "en")
  );
}

function normalizeAgendaItemSemantics(item = {}) {
  const targetRole = getAgendaTargetRole(item);
  const targetForms =
    targetRole === "form"
      ? getAgendaTargetForms(item)
      : normalizeTextList(item.targetForms);
  return {
    ...item,
    goal: getAgendaGoal(item),
    targetRole,
    targetForms,
    activityBrief: cleanText(item.activityBrief),
  };
}

export function isInvalidLessonObjective(value) {
  const normalized = normalizeObjectiveKey(value);
  if (!normalized) return true;
  if (INVALID_OBJECTIVE_LABELS.has(normalized)) return true;
  if (/^(?:form|use|practice|review|vocabulary|grammar)$/.test(normalized)) {
    return true;
  }
  return false;
}

export function isReviewLesson(lesson) {
  const id = String(lesson?.id || "").toLowerCase();
  return (
    !!lesson?.isFinalQuiz ||
    !!lesson?.isGame ||
    REVIEW_LESSON_ID_PARTS.some((part) => id.includes(part))
  );
}

function getConcreteModeObjectives(block = {}) {
  const explicit = [
    ...(Array.isArray(block.focusPoints) ? block.focusPoints : []),
    ...(Array.isArray(block.topics) ? block.topics : []),
    ...(Array.isArray(block.words) ? block.words : []),
    ...(Array.isArray(block.items) ? block.items : []),
  ]
    .map(extractItemText)
    .filter((value) => value && !isInvalidLessonObjective(value));

  if (explicit.length) {
    return uniqueText(explicit).map((text) => ({ text, source: "explicit" }));
  }

  const fallbackCandidates = [
    { text: block.successCriteria, source: "successCriteria" },
    { text: block.prompt, source: "prompt" },
    { text: block.scenario, source: "scenario" },
    { text: block.topic, source: "topic" },
  ]
    .map((candidate) => ({
      ...candidate,
      text: cleanText(candidate.text),
    }))
    .filter(
      (candidate) =>
        candidate.text && !isInvalidLessonObjective(candidate.text),
    );

  return fallbackCandidates.length ? [fallbackCandidates[0]] : [];
}

// Vocabulary and grammar objectives are practice content (target-language
// tokens like "lunes, martes"), so every UI language can show the concrete
// objective verbatim. Prose-mode objectives (reading/stories/realtime) are
// authored as English instructions, so non-English labels keep localized
// lesson copy instead of leaking English prose into the support-language UI.
const CONCRETE_LABEL_MODES = new Set(["vocabulary", "grammar"]);

// Curriculum focus points were originally authored as a mixture of Spanish
// target forms and English editor notes (for example,
// "irregular stems: tendré, haré"). Those notes must never leak into a
// non-English support-language UI. Keep the actual Spanish form when it can be
// separated safely; otherwise use the lesson's already-localized description.
const ENGLISH_CURRICULUM_SCAFFOLDING =
  /\b(?:actions?|adjectives?|agreement|articles?|auxiliary|backchanneling|cause|clauses?|collocations?|comparatives?|compounds?|conditionals?|connectors?|consequence|consonants?|contrast|discourse|endings?|events?|expressions?|field-specific|fillers?|formal|future|gender|gerunds?|idioms?|imperative|imperfect|impersonal|indicative|infinitive|informal|irregulars?|location|markers?|medical|negation|nominalization|nouns?|objects?|opinions?|passive|past|phrases?|plural|possessives?|predictions?|prefixes?|prepositions?|present|preterite|probability|pronouns?|questions?|reflexive|register|regular|repetition|reported|requests?|results?|routines?|singular|stems?|structures?|subjunctive|suffixes?|technical|time|tone|verbs?|voice|word order)\b/i;
const ENGLISH_CURRICULUM_CONNECTORS =
  /\b(?:and|as|at|for|from|in|into|of|on|the|to|with|without)\b/i;
const SPANISH_TARGET_SIGNAL =
  /[¿¡áéíóúüñ]|\b(?:al|aquí|allí|como|con|cuando|de|del|el|ella|ellos|en|es|esta|este|hay|la|las|lo|los|más|me|mi|no|para|pero|por|que|se|ser|si|sin|son|su|te|tener|tu|un|una|usted|y|yo)\b/i;
const SUPPORT_GRAMMAR_TERMS = Object.freeze({
  "present perfect": {
    es: "pretérito perfecto",
    pt: "pretérito perfeito",
    it: "passato prossimo",
    fr: "passé composé",
    de: "Perfekt",
    ja: "現在完了形",
    hi: "वर्तमान पूर्ण काल",
    ar: "المضارع التام",
    zh: "现在完成时",
  },
  "past continuous": {
    es: "pasado continuo",
    pt: "passado contínuo",
    it: "passato progressivo",
    fr: "passé continu",
    de: "Verlaufsform der Vergangenheit",
    ja: "過去進行形",
    hi: "भूतकाल निरंतर",
    ar: "الماضي المستمر",
    zh: "过去进行时",
  },
  "future tense": {
    es: "tiempo futuro",
    pt: "tempo futuro",
    it: "tempo futuro",
    fr: "futur",
    de: "Futur",
    ja: "未来形",
    hi: "भविष्य काल",
    ar: "زمن المستقبل",
    zh: "将来时",
  },
  "past perfect": {
    es: "pluscuamperfecto",
    pt: "mais-que-perfeito",
    it: "trapassato prossimo",
    fr: "plus-que-parfait",
    de: "Plusquamperfekt",
    ja: "過去完了形",
    hi: "पूर्ण भूतकाल",
    ar: "الماضي التام",
    zh: "过去完成时",
  },
  "passive voice": {
    es: "voz pasiva",
    pt: "voz passiva",
    it: "forma passiva",
    fr: "voix passive",
    de: "Passiv",
    ja: "受動態",
    hi: "कर्मवाच्य",
    ar: "المبني للمجهول",
    zh: "被动语态",
  },
  "reported speech": {
    es: "estilo indirecto",
    pt: "discurso indireto",
    it: "discorso indiretto",
    fr: "discours indirect",
    de: "indirekte Rede",
    ja: "間接話法",
    hi: "अप्रत्यक्ष कथन",
    ar: "الكلام المنقول",
    zh: "间接引语",
  },
  "relative clauses": {
    es: "oraciones de relativo",
    pt: "orações relativas",
    it: "frasi relative",
    fr: "propositions relatives",
    de: "Relativsätze",
    ja: "関係節",
    hi: "संबंधवाचक उपवाक्य",
    ar: "الجمل الموصولة",
    zh: "关系从句",
  },
  "present subjunctive": {
    es: "presente de subjuntivo",
    pt: "presente do subjuntivo",
    it: "congiuntivo presente",
    fr: "subjonctif présent",
    de: "Konjunktiv Präsens",
    ja: "接続法現在",
    hi: "वर्तमान संभावनार्थक",
    ar: "صيغة الشرط في المضارع",
    zh: "现在虚拟式",
  },
  "past subjunctive": {
    es: "pasado de subjuntivo",
    pt: "pretérito do subjuntivo",
    it: "congiuntivo passato",
    fr: "subjonctif passé",
    de: "Konjunktiv Vergangenheit",
    ja: "接続法過去",
    hi: "भूतकाल संभावनार्थक",
    ar: "صيغة الشرط في الماضي",
    zh: "过去虚拟式",
  },
  subjunctive: {
    es: "subjuntivo",
    pt: "subjuntivo",
    it: "congiuntivo",
    fr: "subjonctif",
    de: "Konjunktiv",
    ja: "接続法",
    hi: "संभावनार्थक",
    ar: "صيغة الشرط",
    zh: "虚拟式",
  },
  infinitive: {
    es: "infinitivo",
    pt: "infinitivo",
    it: "infinito",
    fr: "infinitif",
    de: "Infinitiv",
    ja: "不定詞",
    hi: "क्रिया का मूल रूप",
    ar: "المصدر",
    zh: "不定式",
  },
});
const UNLOCALIZED_CONTEXT_PATTERN =
  /\b(?:integrated practice|irregular stems|skill builder|word order|introductions?|goodbyes?|present perfect|past continuous|future tense|past perfect|passive voice|reported speech|relative clauses|subjunctive|infinitive)\b/i;

const hasEnglishCurriculumScaffolding = (value) =>
  ENGLISH_CURRICULUM_SCAFFOLDING.test(value) ||
  ENGLISH_CURRICULUM_CONNECTORS.test(value);

function localizeEmbeddedGrammarTerms(value, lang) {
  let localized = cleanText(value);
  Object.entries(SUPPORT_GRAMMAR_TERMS).forEach(([englishTerm, translations]) => {
    const replacement = translations[lang];
    if (!replacement) return;
    localized = localized.replace(
      new RegExp(`\\b${englishTerm.replace(/\s+/g, "\\s+")}\\b`, "gi"),
      replacement,
    );
  });
  return localized;
}

const hasUsableLocalizedContext = (localizedContext, fallbackEn) =>
  !!localizedContext &&
  normalizeObjectiveKey(localizedContext) !== normalizeObjectiveKey(fallbackEn) &&
  !UNLOCALIZED_CONTEXT_PATTERN.test(localizedContext);

function extractTargetLanguageDetail(value) {
  let detail = cleanText(value).replace(/\bvs\.?\b/gi, "/");
  if (!detail) return "";

  const colonIndex = detail.indexOf(":");
  if (colonIndex > 0) {
    const prefix = detail.slice(0, colonIndex);
    const suffix = cleanText(detail.slice(colonIndex + 1));
    if (
      suffix &&
      (hasEnglishCurriculumScaffolding(prefix) ||
        SPANISH_TARGET_SIGNAL.test(suffix))
    ) {
      detail = suffix;
    }
  }

  const parentheticalParts = Array.from(
    detail.matchAll(/\(([^()]*)\)/g),
    (match) => cleanText(match[1]),
  );
  if (parentheticalParts.length) {
    const outside = cleanText(detail.replace(/\([^()]*\)/g, ""));
    const targetParenthetical = parentheticalParts.find(
      (part) =>
        SPANISH_TARGET_SIGNAL.test(part) &&
        !hasEnglishCurriculumScaffolding(part),
    );
    if (
      targetParenthetical &&
      hasEnglishCurriculumScaffolding(outside) &&
      !SPANISH_TARGET_SIGNAL.test(outside)
    ) {
      detail = targetParenthetical;
    } else {
      detail = cleanText(
        detail.replace(/\(([^()]*)\)/g, (match, inner) =>
          hasEnglishCurriculumScaffolding(inner) &&
          !SPANISH_TARGET_SIGNAL.test(inner)
            ? ""
            : match,
        ),
      );
    }
  }

  // Formula objectives such as "infinitive + é/ás/á/emos/án" still contain
  // useful target endings after their English editor prefix.
  if (hasEnglishCurriculumScaffolding(detail)) {
    const endings = detail.match(
      /[a-z]*[áéíóúüñ][a-z]*(?:\s*[/,]\s*[a-z]*[áéíóúüñ][a-z]*)+/i,
    );
    if (endings) detail = endings[0];
  }

  if (hasEnglishCurriculumScaffolding(detail)) {
    const quotedTargets = Array.from(
      detail.matchAll(/['“‘]([^'”’]+)['”’]/g),
      (match) => cleanText(match[1]),
    ).filter(
      (part) =>
        SPANISH_TARGET_SIGNAL.test(part) &&
        !hasEnglishCurriculumScaffolding(part),
    );
    if (quotedTargets.length) detail = uniqueText(quotedTargets).join(" / ");
  }

  return hasEnglishCurriculumScaffolding(detail) ? "" : cleanText(detail);
}

function buildObjectiveLabel(mode, objective, lesson) {
  const enPrefix = MODE_LABELS.en[mode] || "Practice";
  const esPrefix = MODE_LABELS.es[mode] || "Practica";
  const objectiveText = cleanText(objective);
  const fallbackEn = getDisplayText(lesson?.description, "en");
  const fallbackEs = getDisplayText(lesson?.description, "es") || fallbackEn;
  const showConcreteEverywhere =
    !!objectiveText && CONCRETE_LABEL_MODES.has(mode);

  const label = {
    en: objectiveText ? `${enPrefix}: ${objectiveText}` : fallbackEn,
    es: showConcreteEverywhere
      ? `${esPrefix}: ${objectiveText}`
      : fallbackEs
        ? `${esPrefix}: ${fallbackEs}`
        : esPrefix,
  };

  Object.entries(MODE_LABELS).forEach(([lang, labels]) => {
    if (lang === "en" || lang === "es") return;
    const prefix = labels[mode] || labels.realtime;
    if (showConcreteEverywhere) {
      const targetDetail = extractTargetLanguageDetail(objectiveText);
      const localizedContext =
        lesson?.description && typeof lesson.description === "object"
          ? localizeEmbeddedGrammarTerms(lesson.description[lang], lang)
          : "";
      const hasLocalizedContext = hasUsableLocalizedContext(
        localizedContext,
        fallbackEn,
      );
      label[lang] = targetDetail
        ? `${prefix}: ${targetDetail}`
        : hasLocalizedContext
          ? `${prefix}: ${localizedContext}`
          : prefix;
      return;
    }
    const localizedContext =
      lesson?.description && typeof lesson.description === "object"
        ? localizeEmbeddedGrammarTerms(lesson.description[lang], lang)
        : "";
    if (hasUsableLocalizedContext(localizedContext, fallbackEn)) {
      label[lang] = `${prefix}: ${localizedContext}`;
    } else {
      label[lang] = prefix;
    }
  });

  if (showConcreteEverywhere) {
    const targetDetail = extractTargetLanguageDetail(objectiveText);
    label.es = targetDetail
      ? `${esPrefix}: ${targetDetail}`
      : fallbackEs
        ? `${esPrefix}: ${fallbackEs}`
        : esPrefix;
  }

  return label;
}

function createAgendaItem({ lesson, mode, objective, index, source, block }) {
  const kind = MODE_KIND[mode] || "communication";
  const concept = cleanText(objective);
  const targetRole =
    EXACT_FORM_MODES.has(mode) &&
    source === "explicit" &&
    !isInstructionalLessonObjective(concept)
      ? "form"
      : "goal";
  return normalizeAgendaItemSemantics({
    id: `${mode}-${slugify(concept)}-${index + 1}`,
    kind,
    modes: [mode],
    label: buildObjectiveLabel(mode, concept, lesson),
    goal: concept,
    targetConcept: concept,
    targetRole,
    targetForms: targetRole === "form" ? [concept] : [],
    activityBrief: cleanText(block?.prompt || block?.scenario || ""),
    preserveCanonicalGoal: block?.preserveCanonicalGoal === true,
    targetCurriculumAliases: normalizeTextList(
      block?.targetCurriculumAliases,
    ),
    evidence: { ...(EVIDENCE_BY_MODE[mode] || EVIDENCE_BY_MODE.realtime) },
    source: source || "derived",
  });
}

export function buildLessonAgenda(lesson, { unit = null } = {}) {
  if (!lesson) return { version: 1, items: [] };

  const modes = Array.isArray(lesson.modes) ? lesson.modes : [];
  const content = lesson.content || {};
  const activeModes = modes.length
    ? modes
    : Object.keys(content).filter((mode) => MODE_KIND[mode]);
  const items = [];

  activeModes.forEach((mode) => {
    const block = content[mode];
    if (!block || typeof block !== "object") return;
    const objectives = getConcreteModeObjectives(block);
    objectives.forEach((objective, index) => {
      items.push(
        createAgendaItem({
          lesson,
          mode,
          objective: objective.text,
          index,
          source: objective.source,
          block,
        }),
      );
    });
  });

  if (!items.length) {
    const fallback =
      getDisplayText(lesson.description, "en") ||
      getDisplayText(lesson.title, "en") ||
      getDisplayText(unit?.description, "en") ||
      getDisplayText(unit?.title, "en");
    if (fallback && !isInvalidLessonObjective(fallback)) {
      items.push(
        createAgendaItem({
          lesson,
          mode: activeModes[0] || "realtime",
          objective: fallback,
          index: 0,
          source: "lesson-description",
        }),
      );
    }
  }

  const usedIds = new Map();
  const stableItems = items.map((item) => {
    const count = usedIds.get(item.id) || 0;
    usedIds.set(item.id, count + 1);
    return count ? { ...item, id: `${item.id}-${count + 1}` } : item;
  });

  return { version: 1, items: stableItems };
}

export function withCanonicalLessonAgenda(lesson, { unit = null } = {}) {
  if (!lesson) return lesson;
  const authoredItems = Array.isArray(lesson.agenda?.items)
    ? lesson.agenda.items.filter(
        (item) =>
          item?.id &&
          !isInvalidLessonObjective(
            item.targetConcept || getDisplayText(item.label, "en"),
          ),
      )
    : [];
  return {
    ...lesson,
    agenda: authoredItems.length
      ? { version: lesson.agenda?.version || 1, items: authoredItems }
      : buildLessonAgenda(lesson, { unit }),
  };
}

export function getLessonAgenda(
  lesson,
  { unit = null, mode = null, allowLegacy = true, targetLang = "" } = {},
) {
  if (!lesson) return [];
  const normalizedTarget = String(targetLang || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
  const directManualItems =
    normalizedTarget === "es" ? getManualPreA1AgendaItems(lesson) : [];
  if (directManualItems.length) {
    return directManualItems
      .map(normalizeAgendaItemSemantics)
      .filter(
        (item) =>
          !mode ||
          !Array.isArray(item.modes) ||
          item.modes.includes(mode),
      );
  }

  const canonical = Array.isArray(lesson.agenda?.items)
    ? lesson.agenda.items
    : [];
  let sourceItems = canonical.length
    ? canonical
    : allowLegacy
      ? buildLessonAgenda(lesson, { unit }).items
      : [];

  // Generated Skill Builders, Integrated Practice lessons, and Game Reviews
  // retain sourceLessonId on every inherited item. For Spanish Pre-A1, replace
  // each weak source lesson's old prose objectives with the same hand-authored
  // material used by its core lesson, while preserving strong source lessons.
  if (normalizedTarget === "es" && sourceItems.some((item) => item.sourceLessonId)) {
    const replacedSourceIds = new Set();
    sourceItems = sourceItems.flatMap((item) => {
      const sourceLessonId = item.sourceLessonId;
      if (!sourceLessonId) return [item];
      const manualItems = getManualPreA1AgendaItems(sourceLessonId, {
        modes: Array.isArray(item.modes) ? item.modes : lesson.modes,
      });
      if (!manualItems.length) return [item];
      if (replacedSourceIds.has(sourceLessonId)) return [];
      replacedSourceIds.add(sourceLessonId);
      return manualItems.map((manualItem) => ({
        ...manualItem,
        id: `review-${sourceLessonId}-${manualItem.id}`,
        sourceLessonId,
        sourceAgendaItemId: manualItem.id,
        sourceModes: manualItem.modes,
        source: "unit-review",
      }));
    });
  }

  const filteredItems = sourceItems
    .map(normalizeAgendaItemSemantics)
    .filter((item) => {
      const concept = item?.targetConcept || getDisplayText(item?.label, "en");
      if (!item?.id || isInvalidLessonObjective(concept)) return false;
      if (!mode) return true;
      return Array.isArray(item.modes) && item.modes.includes(mode);
    });

  if (!normalizedTarget || normalizedTarget === "es") return filteredItems;

  // Two adaptation tiers for non-Spanish practice languages. Items with
  // authored per-language data keep the full per-objective sequence in the
  // practice language; anything unauthored collapses to one generic item per
  // lesson×mode as before, so ungenerated languages keep working.
  const adaptedItems = [];
  const groupedItems = new Map();
  filteredItems.forEach((item) => {
    const sourceModes =
      Array.isArray(item.sourceModes) && item.sourceModes.length
        ? item.sourceModes
        : item.modes;
    const objectiveMode =
      sourceModes?.find((candidate) => MODE_KIND[candidate]) ||
      item.modes?.find((candidate) => MODE_KIND[candidate]) ||
      "realtime";
    const sourceLessonId = item.sourceLessonId || lesson.id || "lesson";

    const {
      targetConceptByLanguage,
      targetExamplesByLanguage,
      targetFormsByLanguage,
      ...portableItem
    } = item;
    const authoredTargetConcept = cleanText(
      targetConceptByLanguage?.[normalizedTarget],
    );
    const authoredTargetExamples = Array.isArray(
      targetExamplesByLanguage?.[normalizedTarget],
    )
      ? targetExamplesByLanguage[normalizedTarget].map(cleanText).filter(Boolean)
      : [];
    const authoredTargetForms = normalizeTextList(
      targetFormsByLanguage?.[normalizedTarget],
    );

    if (authoredTargetConcept) {
      // Word/short-chunk concepts ("mom", "lunedì, martedì") ARE the
      // learner-facing objective — promoting their fuller example sentence
      // ("Dad is working.") made the agenda preview and the Tutor drill full
      // conjugated sentences at Pre-A1. Only prose criteria concepts (English
      // authoring scaffolding like "Read a dialogue and...") still swap in
      // the target-language example so English never leaks into a
      // non-English support UI.
      const conceptIsShortPhrase =
        authoredTargetConcept.length <= 32 &&
        authoredTargetConcept.split(/\s+/).length <= 4;
      const targetRole = getAgendaTargetRole(portableItem);
      const targetForms = authoredTargetForms.length
        ? authoredTargetForms
        : portableItem.useExamplesAsTargetForms
          ? authoredTargetExamples
          : targetRole === "form"
            ? [authoredTargetConcept]
            : [];
      const adaptedLabel = Object.fromEntries(
        Object.entries(MODE_LABELS).map(([lang, labels]) => [
          lang,
          `${labels[objectiveMode] || labels.realtime}: ${
            lang === "en" || conceptIsShortPhrase
              ? authoredTargetConcept
              : authoredTargetExamples[0] || authoredTargetConcept
          }`,
        ]),
      );
      const label = portableItem.preserveCanonicalGoal
        ? portableItem.label
        : adaptedLabel;
      adaptedItems.push(normalizeAgendaItemSemantics({
        ...portableItem,
        id: `target-${normalizedTarget}-${item.id}`,
        label,
        goal: portableItem.preserveCanonicalGoal
          ? portableItem.goal
          : authoredTargetConcept,
        targetConcept: authoredTargetConcept,
        targetExamples: authoredTargetExamples,
        targetRole,
        targetForms,
        // The pre-adaptation concept is the Spanish-authored base curriculum
        // ("papá" for the English item "dad") — a free support-language gloss
        // for Spanish-support learners of any target language.
        sourceConcept: cleanText(item.targetConcept),
        sourceModes,
        source: "target-language-authored",
        sourceObjectiveSource: portableItem.source || "authored-agenda",
        sourceAgendaItemIds: [item.sourceAgendaItemId || item.id],
        evidence: {
          ...(portableItem.evidence ||
            EVIDENCE_BY_MODE[objectiveMode] ||
            EVIDENCE_BY_MODE.realtime),
        },
      }));
      return;
    }

    const groupKey = `${sourceLessonId}:${objectiveMode}`;
    const existing = groupedItems.get(groupKey);
    if (existing) {
      existing.sourceAgendaItemIds.push(item.sourceAgendaItemId || item.id);
      return;
    }

    const sourceLesson =
      unit?.lessons?.find((candidate) => candidate?.id === sourceLessonId) ||
      lesson;
    const sourceTitle = item.sourceLessonTitle || sourceLesson.title || lesson.title;
    const skillTitle = unit?.title || sourceTitle;
    const skillTitleEn =
      getDisplayText(skillTitle, "en") ||
      getDisplayText(sourceTitle, "en") ||
      "this lesson";
    const sourceTitleEn =
      getDisplayText(sourceTitle, "en") || skillTitleEn;
    const sourceBlock = sourceLesson?.content?.[objectiveMode] || {};
    const rawContextEn = cleanText(
      sourceBlock.scenario ||
        sourceBlock.topic ||
        sourceBlock.successCriteria ||
        "",
    );
    const contextLooksTargetSpecific =
      /[¿¡]|\b(?:vos|vosotros|usted|ustedes|tú|ser|estar|haber|había|se\s+(?:hace|vende|venden)|por\s+qué)\b/i.test(
        rawContextEn,
      );
    const contextEn = contextLooksTargetSpecific ? "" : rawContextEn;
    const capitalizedContext = contextEn
      ? `${contextEn.charAt(0).toUpperCase()}${contextEn.slice(1)}`
      : "";
    const detailEn = capitalizedContext
      ? `${skillTitleEn} — ${capitalizedContext}`
      : skillTitleEn === sourceTitleEn
        ? skillTitleEn
        : `${skillTitleEn} — ${sourceTitleEn}`;
    const label = Object.fromEntries(
      Object.entries(MODE_LABELS).map(([lang, labels]) => {
        const localizedSkill = getDisplayText(skillTitle, lang) || skillTitleEn;
        const localizedLesson =
          getDisplayText(sourceTitle, lang) || sourceTitleEn;
        const localizedDetail =
          lang === "en"
            ? detailEn
            : localizedSkill === localizedLesson
              ? localizedSkill
              : `${localizedSkill} — ${localizedLesson}`;
        return [
          lang,
          `${labels[objectiveMode] || labels.realtime}: ${localizedDetail}`,
        ];
      }),
    );
    const groupEntry = normalizeAgendaItemSemantics({
      ...portableItem,
      id: `target-${normalizedTarget}-${sourceLessonId}-${objectiveMode}`,
      label,
      goal: `${label.en}. Complete this objective in the selected practice language.`,
      targetConcept: `${label.en}. Complete this objective in the selected practice language.`,
      targetExamples: [],
      targetRole: "goal",
      targetForms: [],
      sourceModes,
      source: "target-language-adapter",
      sourceObjectiveSource: portableItem.source || "unknown",
      sourceAgendaItemIds: [item.sourceAgendaItemId || item.id],
      evidence: {
        ...(EVIDENCE_BY_MODE[objectiveMode] || EVIDENCE_BY_MODE.realtime),
      },
    });
    groupedItems.set(groupKey, groupEntry);
    adaptedItems.push(groupEntry);
  });

  return adaptedItems;
}

export function getLocalizedAgendaLabel(item, supportLang = "en") {
  if (!item) return "";
  return (
    getDisplayText(item.label, supportLang) ||
    cleanText(item.targetConcept) ||
    String(item.id || "")
  );
}

export function buildUnitCurriculumSnapshot(
  unit,
  { beforeLessonId = "", includeLessonIds = [], targetLang = "" } = {},
) {
  const lessons = Array.isArray(unit?.lessons) ? unit.lessons : [];
  const explicitIds = new Set(includeLessonIds);
  const sourceLessons = [];

  for (const lesson of lessons) {
    if (beforeLessonId && lesson?.id === beforeLessonId) break;
    if (!lesson || isReviewLesson(lesson)) continue;
    if (explicitIds.size && !explicitIds.has(lesson.id)) continue;
    sourceLessons.push(lesson);
  }

  const agendaItems = sourceLessons.flatMap((lesson) =>
    getLessonAgenda(lesson, { unit, targetLang }).map((item) => ({
      ...item,
      sourceLessonId: lesson.id,
      sourceLessonTitle: lesson.title,
    })),
  );

  const byKind = (kind) =>
    agendaItems.filter((item) => item.kind === kind).map((item) => item.id);

  return {
    version: 1,
    unitId: unit?.id || "",
    unitTitle: unit?.title || null,
    cefrLevel: unit?.cefrLevel || unit?.level || "",
    sourceLessonIds: sourceLessons.map((lesson) => lesson.id),
    agendaItems,
    vocabularyItemIds: byKind("vocabulary"),
    grammarItemIds: byKind("grammar"),
    comprehensionItemIds: byKind("comprehension"),
    communicationItemIds: byKind("communication"),
  };
}

export function buildUnitQuizBlueprint(
  unit,
  { beforeLessonId = "", questionCount = 10, targetLang = "" } = {},
) {
  const snapshot = buildUnitCurriculumSnapshot(unit, {
    beforeLessonId,
    targetLang,
  });
  const safeQuestionCount = Math.max(1, Math.floor(Number(questionCount) || 10));
  const lessonQueues = snapshot.sourceLessonIds
    .map((lessonId) => ({
      lessonId,
      items: snapshot.agendaItems.filter(
        (item) => item.sourceLessonId === lessonId,
      ),
    }))
    .filter((queue) => queue.items.length);
  const selected = [];

  // Round-robin across source lessons first. Within each lesson, rotate kinds
  // so an objective-rich lesson cannot crowd the rest of the unit out.
  while (selected.length < safeQuestionCount) {
    let addedInRound = false;
    for (const queue of lessonQueues) {
      if (!queue.items.length || selected.length >= safeQuestionCount) continue;
      const usedKinds = new Set(selected.map((item) => item.kind));
      const preferredIndex = queue.items.findIndex(
        (item) => !usedKinds.has(item.kind),
      );
      const [nextItem] = queue.items.splice(
        preferredIndex >= 0 ? preferredIndex : 0,
        1,
      );
      selected.push(nextItem);
      addedInRound = true;
    }
    if (!addedInRound) break;
  }

  return {
    version: 1,
    questionCount: selected.length,
    sourceLessonIds: Array.from(
      new Set(selected.map((item) => item.sourceLessonId)),
    ),
    questionTargets: selected.map((item, index) => ({
      questionNumber: index + 1,
      agendaItemId: item.sourceAgendaItemId || item.id,
      sourceLessonId: item.sourceLessonId,
      kind: item.kind,
      modes: item.modes,
      targetRole: getAgendaTargetRole(item),
      targetForms: getAgendaTargetForms(item),
      goal: getAgendaGoal(item),
      targetConcept: item.targetConcept,
      sourceConcept: item.sourceConcept,
      labels: item.labels,
      activityBrief: item.activityBrief,
      targetExamples: Array.isArray(item.targetExamples)
        ? item.targetExamples
        : [],
      evidence: item.evidence,
    })),
  };
}

export function getLessonQuizSettings(
  lesson,
  availableQuestionCount = Number.POSITIVE_INFINITY,
) {
  const configuredQuestions = Math.max(
    1,
    Math.floor(Number(lesson?.quizConfig?.questionsRequired) || 10),
  );
  const available = Number(availableQuestionCount);
  const questionCount = Number.isFinite(available)
    ? Math.max(0, Math.min(configuredQuestions, Math.floor(available)))
    : configuredQuestions;
  const configuredPassingScore = Number(lesson?.quizConfig?.passingScore);
  const configuredRatio =
    Number.isFinite(configuredPassingScore) && configuredPassingScore > 0
      ? configuredPassingScore / configuredQuestions
      : 0.8;
  const passingScore = questionCount
    ? Math.max(
        1,
        Math.min(questionCount, Math.ceil(questionCount * configuredRatio)),
      )
    : 0;

  return { questionCount, passingScore };
}

export function buildCurriculumPromptContext(
  curriculumContext,
  { mode = "", limit = 24 } = {},
) {
  const agendaItems = Array.isArray(curriculumContext?.agendaItems)
    ? curriculumContext.agendaItems
    : [];
  const lessonId = String(curriculumContext?.lessonId || "").toLowerCase();
  const shouldCombineAcrossModes =
    lessonId.includes("integrated-practice") ||
    curriculumContext?.isGameReview === true;
  const relevantItems = agendaItems
    .filter(
      (item) =>
        shouldCombineAcrossModes ||
        !mode ||
        !Array.isArray(item.modes) ||
        item.modes.includes(mode),
    )
    .slice(0, limit);
  if (!relevantItems.length) return "";

  const objectives = relevantItems.map((item) => ({
    id: item.sourceAgendaItemId || item.id,
    sourceLessonId: item.sourceLessonId || "",
    kind: item.kind || "",
    goal: getAgendaGoal(item),
    targetRole: getAgendaTargetRole(item),
    ...(getAgendaTargetForms(item).length
      ? { targetForms: getAgendaTargetForms(item).slice(0, 8) }
      : {}),
    ...(cleanText(item.activityBrief)
      ? { activityBrief: cleanText(item.activityBrief) }
      : {}),
    evidence: cleanText(item.evidence?.criteria),
    ...(Array.isArray(item.targetExamples) && item.targetExamples.length
      ? { examples: item.targetExamples.slice(0, 3) }
      : {}),
  }));

  return [
    "CURRICULUM OBJECTIVES (authoritative):",
    JSON.stringify(objectives),
    curriculumContext?.reviewStrategy
      ? `REVIEW STRATEGY (format only): ${JSON.stringify(curriculumContext.reviewStrategy)}`
      : "",
    curriculumContext?.quizBlueprint?.questionTargets?.length
      ? `QUIZ COVERAGE BLUEPRINT (authoritative): ${JSON.stringify(curriculumContext.quizBlueprint.questionTargets)}`
      : "",
    curriculumContext?.targetLanguageAdapted
      ? "The source curriculum was authored for another practice language. Ignore legacy source-language examples in lesson content and create all examples in the selected target language."
      : "",
    "Build the activity from these curriculum goals. Only targetForms are exact language for the learner to produce; goals and activityBriefs are private instructions and must never be presented as phrases to repeat. Do not introduce unrelated curriculum.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Attach authored practice-language adaptations onto a learning path's agenda
 * items. `data` is keyed by source lesson id → agenda item id → { concept,
 * examples, forms }. Review lessons reference source items via sourceLessonId /
 * sourceAgendaItemId, so their items pick up the same authored entries.
 * Mutates (and returns) the path, which is always a fresh clone per language.
 */
export function applyAuthoredTargetCurriculum(pathByLevel, targetLang, data) {
  const normalizedTarget = String(targetLang || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
  if (!normalizedTarget || !data || typeof data !== "object") {
    return pathByLevel;
  }

  Object.values(pathByLevel || {}).forEach((units) => {
    (Array.isArray(units) ? units : []).forEach((unit) => {
      (unit?.lessons || []).forEach((lesson) => {
        (lesson?.agenda?.items || []).forEach((item) => {
          if (!item) return;
          const lessonKey = item.sourceLessonId || lesson.id || "";
          const itemKey = item.sourceAgendaItemId || item.id || "";
          const curriculumKeys = [
            itemKey,
            ...normalizeTextList(item.targetCurriculumAliases),
          ];
          const entry = curriculumKeys
            .map((key) => data[lessonKey]?.[key])
            .find(Boolean);
          if (!entry) return;
          const concept = cleanText(entry.concept);
          if (concept) {
            item.targetConceptByLanguage = {
              ...item.targetConceptByLanguage,
              [normalizedTarget]: concept,
            };
          }
          const examples = Array.isArray(entry.examples)
            ? entry.examples.map(cleanText).filter(Boolean)
            : [];
          if (examples.length) {
            item.targetExamplesByLanguage = {
              ...item.targetExamplesByLanguage,
              [normalizedTarget]: examples,
            };
          }
          const forms = normalizeTextList(entry.forms);
          if (forms.length) {
            item.targetFormsByLanguage = {
              ...item.targetFormsByLanguage,
              [normalizedTarget]: forms,
            };
          }
        });
      });
    });
  });

  return pathByLevel;
}

export function getCurriculumIntegrityIssues(
  units = [],
  { requiredSupportLanguages = [] } = {},
) {
  const issues = [];
  (Array.isArray(units) ? units : []).forEach((unit) => {
    (unit?.lessons || []).forEach((lesson) => {
      if (!lesson || lesson.isGame) return;
      const agenda = getLessonAgenda(lesson, { unit, allowLegacy: false });
      if (!agenda.length) {
        issues.push({ type: "missing_agenda", unitId: unit.id, lessonId: lesson.id });
        return;
      }

      const ids = new Set();
      agenda.forEach((item) => {
        if (ids.has(item.id)) {
          issues.push({
            type: "duplicate_agenda_id",
            unitId: unit.id,
            lessonId: lesson.id,
            agendaItemId: item.id,
          });
        }
        ids.add(item.id);
        requiredSupportLanguages.forEach((lang) => {
          if (!getDisplayText(item.label, lang)) {
            issues.push({
              type: "missing_agenda_translation",
              unitId: unit.id,
              lessonId: lesson.id,
              agendaItemId: item.id,
              lang,
            });
          }
        });
      });

      const activeModes = new Set(lesson.modes || []);
      Object.keys(lesson.content || {}).forEach((mode) => {
        if (MODE_KIND[mode] && !activeModes.has(mode)) {
          issues.push({
            type: "inactive_authored_content",
            unitId: unit.id,
            lessonId: lesson.id,
            mode,
          });
        }
      });
    });
  });
  return issues;
}

export function buildLessonCurriculumAudit(
  units = [],
  { requiredSupportLanguages = [], targetLang = "" } = {},
) {
  const report = {
    targetLang,
    lessonCount: 0,
    itemCount: 0,
    sourceCounts: {},
    roleCounts: { form: 0, goal: 0 },
    blockers: [],
    reviewCandidates: [],
  };

  const addFinding = (bucket, type, unit, lesson, item, extra = {}) => {
    report[bucket].push({
      type,
      level: unit?.cefrLevel || unit?.level || "",
      unitId: unit?.id || "",
      lessonId: lesson?.id || "",
      lessonTitle: getDisplayText(lesson?.title, "en"),
      agendaItemId: item?.id || "",
      mode: item?.modes?.[0] || "",
      source: item?.source || "unknown",
      goal: item ? getAgendaGoal(item) : "",
      ...extra,
    });
  };

  (Array.isArray(units) ? units : []).forEach((unit) => {
    (unit?.lessons || []).forEach((lesson) => {
      if (!lesson || isReviewLesson(lesson)) return;
      report.lessonCount += 1;
      const agenda = getLessonAgenda(lesson, { unit, targetLang });

      // High-risk capstone lessons can declare a small semantic contract.
      // Each inner group is an OR-list; every group must be represented in the
      // canonical objectives. This catches title/content drift without trying
      // to infer arbitrary semantic similarity from lesson titles.
      const alignmentGroups = Array.isArray(lesson.objectiveAlignment)
        ? lesson.objectiveAlignment
            .map((group) =>
              (Array.isArray(group) ? group : [group])
                .map((term) => normalizeObjectiveKey(term))
                .filter(Boolean),
            )
            .filter((group) => group.length)
        : [];
      if (alignmentGroups.length) {
        const canonicalGoals = getLessonAgenda(lesson, { unit })
          .map((item) => normalizeObjectiveKey(getAgendaGoal(item)))
          .join(" ");
        alignmentGroups.forEach((terms) => {
          if (terms.some((term) => canonicalGoals.includes(term))) return;
          addFinding(
            "blockers",
            "objective_alignment_missing",
            unit,
            lesson,
            null,
            { expectedAnyOf: terms },
          );
        });
      }

      agenda.forEach((item) => {
        report.itemCount += 1;
        const source = item.source || "unknown";
        const sourceObjectiveSource = item.sourceObjectiveSource || source;
        const role = getAgendaTargetRole(item);
        const forms = getAgendaTargetForms(item);
        report.sourceCounts[source] = (report.sourceCounts[source] || 0) + 1;
        report.roleCounts[role] = (report.roleCounts[role] || 0) + 1;

        if (role === "form" && !forms.length) {
          addFinding("blockers", "exact_target_without_forms", unit, lesson, item);
        }
        forms.forEach((form) => {
          if (isInstructionalLessonObjective(form)) {
            addFinding(
              "blockers",
              "instruction_used_as_exact_target",
              unit,
              lesson,
              item,
              { form },
            );
          }
        });
        if (!cleanText(item.evidence?.criteria)) {
          addFinding("blockers", "missing_evidence", unit, lesson, item);
        }

        if (source === "target-language-adapter") {
          addFinding(
            "reviewCandidates",
            "generic_target_language_adapter",
            unit,
            lesson,
            item,
          );
        } else if (
          ["prompt", "successCriteria", "scenario", "topic", "lesson-description"].includes(
            sourceObjectiveSource,
          )
        ) {
          addFinding(
            "reviewCandidates",
            "legacy_fallback_objective",
            unit,
            lesson,
            item,
          );
        } else if (role === "goal" && isInstructionalLessonObjective(getAgendaGoal(item))) {
          addFinding(
            "reviewCandidates",
            "instructional_goal_needs_author_review",
            unit,
            lesson,
            item,
          );
        }

        const englishLabel = getDisplayText(item.label, "en");
        requiredSupportLanguages.forEach((lang) => {
          const localizedLabel = getDisplayText(item.label, lang);
          if (!localizedLabel) {
            addFinding(
              "blockers",
              "missing_support_label",
              unit,
              lesson,
              item,
              { lang },
            );
          } else if (
            lang !== "en" &&
            englishLabel.length >= 12 &&
            normalizeObjectiveKey(localizedLabel) ===
              normalizeObjectiveKey(englishLabel)
          ) {
            addFinding(
              "reviewCandidates",
              "support_label_matches_english",
              unit,
              lesson,
              item,
              { lang },
            );
          }
        });
      });
    });
  });

  return report;
}

export const INVALID_LESSON_OBJECTIVE_LABELS = Object.freeze([
  ...INVALID_OBJECTIVE_LABELS,
]);
