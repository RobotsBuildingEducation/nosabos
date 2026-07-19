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
      label[lang] = `${prefix}: ${objectiveText}`;
      return;
    }
    const localizedContext =
      lesson?.description && typeof lesson.description === "object"
        ? cleanText(lesson.description[lang])
        : "";
    if (localizedContext) {
      label[lang] = `${prefix}: ${localizedContext}`;
    }
  });

  return label;
}

function createAgendaItem({ lesson, mode, objective, index, source }) {
  const kind = MODE_KIND[mode] || "communication";
  const concept = cleanText(objective);
  return {
    id: `${mode}-${slugify(concept)}-${index + 1}`,
    kind,
    modes: [mode],
    label: buildObjectiveLabel(mode, concept, lesson),
    targetConcept: concept,
    evidence: { ...(EVIDENCE_BY_MODE[mode] || EVIDENCE_BY_MODE.realtime) },
    source: source || "derived",
  };
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
  const canonical = Array.isArray(lesson.agenda?.items)
    ? lesson.agenda.items
    : [];
  const sourceItems = canonical.length
    ? canonical
    : allowLegacy
      ? buildLessonAgenda(lesson, { unit }).items
      : [];

  const filteredItems = sourceItems.filter((item) => {
    const concept = item?.targetConcept || getDisplayText(item?.label, "en");
    if (!item?.id || isInvalidLessonObjective(concept)) return false;
    if (!mode) return true;
    return Array.isArray(item.modes) && item.modes.includes(mode);
  });

  const normalizedTarget = String(targetLang || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
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

    if (authoredTargetConcept) {
      const label = Object.fromEntries(
        Object.entries(MODE_LABELS).map(([lang, labels]) => [
          lang,
          `${labels[objectiveMode] || labels.realtime}: ${
            // Authored prose concepts intentionally contain English authoring
            // scaffolding (for example, "Read a dialogue and..."). That is
            // useful to the Tutor, but it must not leak into a non-English
            // support-language UI. Every authored curriculum entry has a
            // target-language example, so use that as the learner-facing
            // teaching target after the localized action label. English
            // support keeps the fuller authored concept.
            lang === "en"
              ? authoredTargetConcept
              : authoredTargetExamples[0] || authoredTargetConcept
          }`,
        ]),
      );
      adaptedItems.push({
        ...portableItem,
        id: `target-${normalizedTarget}-${item.id}`,
        label,
        targetConcept: authoredTargetConcept,
        targetExamples: authoredTargetExamples,
        sourceModes,
        source: "target-language-authored",
        sourceAgendaItemIds: [item.sourceAgendaItemId || item.id],
        evidence: {
          ...(EVIDENCE_BY_MODE[objectiveMode] || EVIDENCE_BY_MODE.realtime),
        },
      });
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
    const groupEntry = {
      ...portableItem,
      id: `target-${normalizedTarget}-${sourceLessonId}-${objectiveMode}`,
      label,
      targetConcept: `${label.en}. Complete this objective in the selected practice language.`,
      targetExamples: [],
      sourceModes,
      source: "target-language-adapter",
      sourceAgendaItemIds: [item.sourceAgendaItemId || item.id],
      evidence: {
        ...(EVIDENCE_BY_MODE[objectiveMode] || EVIDENCE_BY_MODE.realtime),
      },
    };
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
      targetConcept: item.targetConcept,
      evidence: item.evidence,
    })),
  };
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
    objective:
      cleanText(item.targetConcept) || getDisplayText(item.label, "en"),
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
    "Build the activity from these concrete objectives. Teaching formats are not objectives. Do not introduce unrelated curriculum.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Attach authored practice-language adaptations onto a learning path's agenda
 * items. `data` is keyed by source lesson id → agenda item id → { concept,
 * examples }. Review lessons reference source items via sourceLessonId /
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
          const entry = data[lessonKey]?.[itemKey];
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

export const INVALID_LESSON_OBJECTIVE_LABELS = Object.freeze([
  ...INVALID_OBJECTIVE_LABELS,
]);
