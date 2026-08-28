import {
  buildCurriculumPromptContext,
  isCurriculumPayloadGrounded,
} from "./lessonCurriculum.js";
import { getTutorStarterVocabularyPairs } from "./tutorStarterAgenda.js";

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase();

const parseJsonObject = (raw) => {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Some providers wrap the object in commentary; extract it below.
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
};

export const VOCABULARY_MATCH_RESPONSE_SCHEMA = {
  type: "object",
  description: "One vocabulary matching exercise with exactly three pairs.",
  properties: {
    stem: {
      type: "string",
      description: "A short instruction in the target language.",
    },
    left: {
      type: "array",
      description: "Exactly three unique target-language vocabulary items.",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
    right: {
      type: "array",
      description:
        "Exactly three unique support-language meanings, ordered to match left.",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
    hint: {
      type: "string",
      description: "A short hint in the support language.",
    },
  },
  required: ["stem", "left", "right", "hint"],
  additionalProperties: false,
};

export const isTutorialVocabularyLesson = (lessonContent) =>
  lessonContent?.topic === "tutorial" || lessonContent?.isTutorial === true;

export function buildVocabularyMatchPrompt({
  targetLang,
  targetName,
  supportLang,
  supportName,
  difficulty,
  lessonContent = null,
  recentGood = [],
}) {
  const isTutorial = isTutorialVocabularyLesson(lessonContent);
  const tutorialPairs = isTutorial
    ? getTutorStarterVocabularyPairs(targetLang, supportLang)
    : [];
  const curriculumScope = buildCurriculumPromptContext(
    lessonContent?.curriculumContext,
    { mode: "vocabulary" },
  );
  const lessonDirective = isTutorial
    ? [
        "TUTORIAL MODE: This is the absolute-beginner greetings lesson.",
        `The following target/support mappings are authoritative: ${JSON.stringify(tutorialPairs)}.`,
        "Choose exactly three distinct mappings. Copy each selected target value verbatim into left.",
        `Write a distinct, short ${supportName} meaning for each corresponding item in right. Do not introduce adjectives, objects, animals, colors, or unrelated vocabulary.`,
      ].join("\n")
    : [
        Array.isArray(lessonContent?.words) && lessonContent.words.length
          ? `Every left item must come verbatim from: ${JSON.stringify(lessonContent.words)}.`
          : lessonContent?.topic
            ? `Every item must directly test this lesson topic: ${lessonContent.topic}.`
            : "Use common level-appropriate vocabulary.",
        Array.isArray(lessonContent?.focusPoints) &&
        lessonContent.focusPoints.length
          ? `Mandatory lesson focus: ${JSON.stringify(lessonContent.focusPoints)}.`
          : "",
        curriculumScope,
        recentGood.length
          ? `Avoid repeating these recent items: ${JSON.stringify(recentGood.slice(-5))}.`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

  return [
    `Create one ${targetName} vocabulary matching exercise at ${isTutorial ? "absolute-beginner" : difficulty} level.`,
    lessonDirective,
    `Return exactly three unique ${targetName} items in left and exactly three corresponding unique ${supportName} meanings in right.`,
    "The arrays must use the same order so left[0] maps to right[0], and so on.",
    `stem must be a short instruction in ${targetName}. hint must be a short hint in ${supportName}.`,
    "Do not use markdown, commentary, ellipses, or placeholder values.",
    "Return one JSON object only with exactly this shape:",
    '{"stem":"...","left":["item 1","item 2","item 3"],"right":["meaning 1","meaning 2","meaning 3"],"hint":"..."}',
  ].join("\n");
}

export function normalizeVocabularyMatchQuestion(
  raw,
  { targetLang, lessonContent = null } = {},
) {
  const parsed = parseJsonObject(raw);
  if (!parsed) return null;

  const left = Array.isArray(parsed.left)
    ? parsed.left.map((value) => String(value || "").trim())
    : [];
  const right = Array.isArray(parsed.right)
    ? parsed.right.map((value) => String(value || "").trim())
    : [];
  if (
    left.length !== 3 ||
    right.length !== 3 ||
    left.some((value) => !value || /<|>|^\.{2,}$/.test(value)) ||
    right.some((value) => !value || /<|>|^\.{2,}$/.test(value)) ||
    new Set(left.map(normalizeText)).size !== 3 ||
    new Set(right.map(normalizeText)).size !== 3
  ) {
    return null;
  }

  if (isTutorialVocabularyLesson(lessonContent)) {
    const allowed = new Set(
      getTutorStarterVocabularyPairs(targetLang, "en").map(({ target }) =>
        normalizeText(target),
      ),
    );
    if (!left.every((value) => allowed.has(normalizeText(value)))) return null;
  }

  if (
    !isCurriculumPayloadGrounded(
      { left },
      lessonContent?.curriculumContext,
      { mode: "vocabulary" },
    )
  ) {
    return null;
  }

  return {
    stem: String(parsed.stem || "").trim(),
    left,
    right,
    hint: String(parsed.hint || "").trim(),
  };
}
