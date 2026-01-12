// components/GrammarBook.jsx
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Badge,
  Button,
  Flex,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
  CheckboxGroup,
  IconButton,
  useToast,
  Center,
} from "@chakra-ui/react";
import { doc, onSnapshot } from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { database, simplemodel } from "../firebaseResources/firebaseResources"; // ✅ Gemini (client-side)
import useUserStore from "../hooks/useUserStore";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { WaveBar } from "./WaveBar";
import { SpeakSuccessCard } from "./SpeakSuccessCard";
import RobotBuddyPro from "./RobotBuddyPro";
import translations from "../utils/translation";
import { MdOutlineSupportAgent } from "react-icons/md";
import { PiSpeakerHighDuotone } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import { awardXp } from "../utils/utils";
import { getLanguageXp } from "../utils/progressTracking";
import {
  callResponses,
  DEFAULT_RESPONSES_MODEL,
  explainAnswer,
} from "../utils/llm";
import { speechReasonTips } from "../utils/speechEvaluation";
import FeedbackRail from "./FeedbackRail";
import TranslateSentence from "./TranslateSentence";
import RepeatWhatYouHear from "./RepeatWhatYouHear";
import {
  LOW_LATENCY_TTS_FORMAT,
  TTS_LANG_TAG,
  getTTSPlayer,
} from "../utils/tts";
import { extractCEFRLevel, getCEFRPromptHint } from "../utils/cefrUtils";
import { shuffle } from "./quiz/utils";
import useNotesStore from "../hooks/useNotesStore";
import { generateNoteContent, buildNoteObject } from "../utils/noteGeneration";
import VirtualKeyboard from "./VirtualKeyboard";
import { MdKeyboard } from "react-icons/md";
import useSoundSettings from "../hooks/useSoundSettings";
import submitActionSound from "../assets/submitaction.mp3";
import nextButtonSound from "../assets/nextbutton.mp3";
import selectSound from "../assets/select.mp3";

const renderSpeakerIcon = (loading) =>
  loading ? <Spinner size="xs" /> : <PiSpeakerHighDuotone />;

/* ---------------------------
   Tiny helpers for Gemini streaming
--------------------------- */
function textFromChunk(chunk) {
  try {
    if (!chunk) return "";
    if (typeof chunk.text === "function") return chunk.text() || "";
    if (typeof chunk.text === "string") return chunk.text;
    const cand = chunk.candidates?.[0];
    if (cand?.content?.parts?.length) {
      return cand.content.parts.map((p) => p.text || "").join("");
    }
  } catch {}
  return "";
}

// Consume an NDJSON line safely and hand parsed object to cb(obj)
function tryConsumeLine(line, cb) {
  const s = line.indexOf("{");
  const e = line.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return;
  try {
    const obj = JSON.parse(line.slice(s, e + 1));
    cb?.(obj);
  } catch {
    // ignore
  }
}

function countBlanks(text = "") {
  return (text.match(/___/g) || []).length;
}

function stableHash(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

function shouldUseDragVariant(question, choices = [], answers = []) {
  if (!question || !choices.length) return false;
  const blanks = countBlanks(question);
  if (!blanks) return false;
  // Don't use drag variant if there are fewer blanks than correct answers
  // (user wouldn't be able to select all correct answers)
  if (blanks < answers.length) return false;
  const signature = `${question}||${choices.join("|")}||${answers.join("|")}`;
  return stableHash(signature) % 4 < 2;
}

function buildFallbackDistractors(words = [], answerLang = "en") {
  const normalized = new Set(words.map((w) => norm(w)));
  const pool =
    answerLang === "es"
      ? ["y", "o", "pero", "muy", "también", "sin", "con"]
      : ["and", "or", "but", "very", "also", "without", "with"];
  const picks = [];
  for (const option of pool) {
    if (!normalized.has(norm(option))) {
      picks.push(option);
    }
    if (picks.length >= 4) break;
  }
  return picks;
}

/* ---------------------------
   Minimal i18n helper
--------------------------- */
function useT(uiLang = "en") {
  const lang = ["en", "es"].includes(uiLang) ? uiLang : "en";
  const dict = (translations && translations[lang]) || {};
  const enDict = (translations && translations.en) || {};
  return (key, params) => {
    const raw = (dict[key] ?? enDict[key] ?? key) + "";
    if (!params) return raw;
    return raw.replace(/{(\w+)}/g, (_, k) =>
      k in params ? String(params[k]) : `{${k}}`
    );
  };
}

/* ---------------------------
   LLM plumbing (backend fallback)
--------------------------- */
const MODEL = DEFAULT_RESPONSES_MODEL;

/* ---------------------------
   User/XP helpers
--------------------------- */
const LANG_NAME = (code) =>
  ({
    en: "English",
    es: "Spanish",
    pt: "Brazilian Portuguese",
    fr: "French",
    it: "Italian",
    nl: "Dutch",
    nah: "Huastec Nahuatl",
    ru: "Russian",
    de: "German",
  }[code] || code);

const strongNpub = (user) =>
  (
    user?.id ||
    user?.local_npub ||
    (typeof window !== "undefined" ? localStorage.getItem("local_npub") : "") ||
    ""
  ).trim();

function useSharedProgress() {
  const user = useUserStore((s) => s.user);
  const npub = strongNpub(user);
  const [xp, setXp] = useState(0);
  const [progress, setProgress] = useState({
    level: "beginner",
    targetLang: "es",
    supportLang: "en",
    showTranslations: true,
  });
  // ✅ ready flag so first generated question uses the user's settings
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!npub) {
      setReady(true); // no user doc -> use defaults immediately
      return;
    }
    const ref = doc(database, "users", npub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const p = data?.progress || {};
      const targetLang = ["nah", "es", "pt", "en", "fr", "it", "nl", "ja", "ru", "de"].includes(
        p.targetLang
      )
        ? p.targetLang
        : "es";
      const langXp = getLanguageXp(p, targetLang);

      setXp(Number.isFinite(langXp) ? langXp : 0);
      setProgress({
        level: p.level || "beginner",
        targetLang,
        supportLang: ["en", "es", "bilingual"].includes(p.supportLang)
          ? p.supportLang
          : "en",
        showTranslations:
          typeof p.showTranslations === "boolean" ? p.showTranslations : true,
      });
      setReady(true); // ✅ we've loaded user settings at least once
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub, ready };
}

/* ---------------------------
   Difficulty routing (CEFR-based)
--------------------------- */
function difficultyHint(cefrLevel) {
  // Use CEFR level instead of XP for more accurate difficulty
  return getCEFRPromptHint(cefrLevel);
}

/* ---------------------------
   Prompts (stream-first variants)
--------------------------- */
const resolveSupportLang = (supportLang, appUILang) =>
  supportLang === "bilingual"
    ? appUILang === "es"
      ? "es"
      : "en"
    : supportLang === "es"
    ? "es"
    : "en";

/* FILL — stream phases */
function buildFillStreamPrompt({
  cefrLevel,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  recentGood,
  lessonContent = null,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const wantTranslation =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = difficultyHint(cefrLevel);

  // If lesson content is provided, use specific grammar topic/focus
  // Special handling for tutorial mode - use very simple "hello" content only
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE sentence about basic greetings only. The blank should be for a simple greeting word like "hello", "hola", "hi", or "buenos días". Keep everything at absolute beginner level. Example: "___ amigo!" where the answer is "Hola".`
    : lessonContent?.topic || lessonContent?.focusPoints
    ? [
        lessonContent.topic
          ? `- STRICT REQUIREMENT: Focus EXCLUSIVELY on grammar topic: ${lessonContent.topic}. Do NOT test any other grammar concepts. This is lesson-specific content and you MUST NOT diverge.`
          : null,
        lessonContent.focusPoints
          ? `- STRICT REQUIREMENT: Address these focus points: ${JSON.stringify(
              lessonContent.focusPoints
            )}. These are mandatory lesson objectives.`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `- Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE short ${TARGET} grammar fill-in-the-blank with a single blank "___". Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    `- No meta like "(to go)" in the stem; ≤120 chars.`,
    topicDirective,
    `- Hint in ${SUPPORT} (≤8 words).`,
    wantTranslation
      ? `- Provide a ${SUPPORT} translation.`
      : `- Provide empty translation "".`,
    "",
    "Stream as NDJSON in phases:",
    `{"type":"fill","phase":"q","question":"<stem in ${TARGET}>"}  // emit ASAP`,
    `{"type":"fill","phase":"meta","hint":"<${SUPPORT} hint>","translation":"<${SUPPORT} translation or empty string>"}  // then`,
    `{"type":"done"}`,
  ].join("\n");
}

function buildFillJudgePrompt({ targetLang, question, userAnswer, hint }) {
  return `
Judge a GRAMMAR fill-in-the-blank in ${LANG_NAME(targetLang)}.

Question:
${question}

User answer:
${userAnswer}

Hint (optional):
${hint || ""}

Policy:
- Say YES if the answer is grammatically correct and fits the context.
- IMPORTANT: Multiple answers may be valid. Accept ANY answer that works grammatically.
- For example: "Yo ___ beber agua" - "quiero", "necesito", "puedo" are all valid.
- Allow contractions, minor casing/punctuation differences, and natural variants.
- Allow missing or incorrect accent marks/diacritics (e.g., "Cual" is acceptable for "Cuál").
- Accept words only (if the question is como ___? the appropriate answer is just a word without the ?)
- Be lenient - if the answer makes grammatical sense in context, say YES.

Reply ONE WORD ONLY:
YES or NO
`.trim();
}

/* MATCH — stream with explicit answer map */
function buildMatchStreamPrompt({
  cefrLevel,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  recentGood,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const diff = difficultyHint(cefrLevel);

  return [
    `Create ONE ${TARGET} GRAMMAR matching exercise using exactly ONE grammar family (coherent set). Difficulty: ${diff}.`,
    `Stay related to recent correct topics: ${JSON.stringify(
      recentGood.slice(-3)
    )}`,
    "",
    "Allowed families (pick ONE for all rows):",
    "1) Subject pronoun → correct present form of ONE high-frequency verb",
    "2) Verb (infinitive) → past participle (or simple past)",
    "3) Noun (singular) → plural form",
    "4) Adjective (base) → comparative form",
    "5) Personal pronoun → object/indirect/possessive form (pick one)",
    `6) Time signal → appropriate tense/aspect label (within ${TARGET})`,
    "",
    `- All items in ${TARGET}; hint in ${SUPPORT} (≤ 8 words).`,
    "- 3–6 rows; left/right unique; clear 1:1 mapping.",
    "- One concise instruction as the stem; no meta like “(to go)” inside items.",
    "",
    "Emit exactly TWO NDJSON lines:",
    `{"type":"match","stem":"<${TARGET} stem>","left":["..."],"right":["..."],"map":[0,2,1], "hint":"<${SUPPORT} hint>"}`,
    `{"type":"done"}`,
  ].join("\n");
}

function safeParseJsonLoose(txt = "") {
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {}
  const s = txt.indexOf("{");
  const e = txt.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) {
    try {
      return JSON.parse(txt.slice(s, e + 1));
    } catch {}
  }
  return null;
}

function buildMCStreamPrompt({
  cefrLevel,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  recentGood,
  lessonContent = null,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const wantTranslation =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = difficultyHint(cefrLevel);
  const preferBlank = Math.random() < 0.6;
  const stemDirective = preferBlank
    ? `- Stem short (≤120 chars) and MUST include a blank "___" in the sentence.`
    : `- Stem short (≤120 chars); may include a blank "___" or pose a concise grammar question.`;

  // If lesson content is provided, use specific grammar topic/focus
  // Special handling for tutorial mode - use very simple "hello" content only
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE multiple-choice about basic greetings only. The correct answer MUST be a simple greeting like "hello", "hola", "hi", "buenos días". Keep everything at absolute beginner level.`
    : lessonContent?.topic || lessonContent?.focusPoints
    ? [
        lessonContent.topic
          ? `- STRICT REQUIREMENT: Focus EXCLUSIVELY on grammar topic: ${lessonContent.topic}. Do NOT test any other grammar concepts. This is lesson-specific content and you MUST NOT diverge.`
          : null,
        lessonContent.focusPoints
          ? `- STRICT REQUIREMENT: Address these focus points: ${JSON.stringify(
              lessonContent.focusPoints
            )}. These are mandatory lesson objectives.`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `- Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE ${TARGET} multiple-choice grammar question (EXACTLY one correct). Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    stemDirective,
    `- 4 distinct choices in ${TARGET}.`,
    `- One of the distinct choices must be correct.`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    wantTranslation
      ? `- ${SUPPORT} translation of stem.`
      : `- Empty translation "".`,
    topicDirective,
    "",
    "Stream as NDJSON:",
    `{"type":"mc","phase":"q","question":"<stem in ${TARGET}>"}  // first`,
    `{"type":"mc","phase":"choices","choices":["<choice1>","<choice2>","<choice3>","<choice4>"]} // second (replace with real options)`,
    `{"type":"mc","phase":"meta","hint":"<${SUPPORT} hint>","answer":"<exact correct choice text>","translation":"<${SUPPORT} translation or empty>"} // third`,
    `{"type":"done"}`,
  ].join("\n");
}

function buildMCJudgePrompt({ targetLang, stem, choices, userChoice, hint }) {
  const listed = choices.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return `
Judge a MULTIPLE-CHOICE grammar question in ${LANG_NAME(targetLang)}.

Stem:
${stem}

Choices:
${listed}

User selected:
${userChoice}

Hint (optional):
${hint || ""}

Instructions:
- Say YES if the selected choice is grammatically correct AND makes sense in context.
- IMPORTANT: Multiple choices may be valid. Accept ANY choice that works grammatically, not just one specific answer.
- For example: "Yo ___ beber agua" - both "quiero" and "necesito" are valid, accept either.
- Use the hint and any time/aspect cues in the stem (e.g., "usually", "yesterday", "for/since").
- Allow contractions, minor punctuation/casing differences, and natural variation.
- Allow missing or incorrect accent marks/diacritics (e.g., "Cual" is acceptable for "Cuál").
- Be lenient - if the answer is grammatically sound and contextually reasonable, say YES.
- Only say NO if the answer is clearly grammatically wrong or doesn't fit the context at all.

Reply with ONE WORD ONLY:
YES or NO
`.trim();
}

function buildMAStreamPrompt({
  cefrLevel,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  recentGood,
  lessonContent = null,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const wantTranslation =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = difficultyHint(cefrLevel);
  const numBlanks = Math.random() < 0.5 ? 2 : 3;

  // If lesson content is provided, use specific grammar topic/focus
  // Special handling for tutorial mode - use very simple "hello" content only
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE multiple-answer about basic greetings only. The correct answers MUST be simple greetings like "hello", "hola", "hi", "buenos días", "good morning". Keep everything at absolute beginner level.`
    : lessonContent?.topic || lessonContent?.focusPoints
    ? [
        lessonContent.topic
          ? `- STRICT REQUIREMENT: Focus EXCLUSIVELY on grammar topic: ${lessonContent.topic}. Do NOT test any other grammar concepts. This is lesson-specific content and you MUST NOT diverge.`
          : null,
        lessonContent.focusPoints
          ? `- STRICT REQUIREMENT: Address these focus points: ${JSON.stringify(
              lessonContent.focusPoints
            )}. These are mandatory lesson objectives.`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `- Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE ${TARGET} fill-in-the-blanks grammar question with EXACTLY ${numBlanks} blanks. Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    `- The sentence MUST contain EXACTLY ${numBlanks} blanks written as "___" (three underscores).`,
    `- The sentence MUST be in ${TARGET} and make complete grammatical sense when all blanks are filled.`,
    `- Each blank has EXACTLY ONE correct answer. The "answers" array MUST have EXACTLY ${numBlanks} items, one for each blank IN ORDER.`,
    `- Example: "Mi ___ vive en una ___ grande" with answers ["hermano", "casa"] means blank 1 = hermano, blank 2 = casa.`,
    `- 5–6 distinct single-word choices in ${TARGET}. Include the ${numBlanks} correct answers plus 2-4 distractors.`,
    `- CRITICAL: Each choice MUST be a single word. NEVER combine words with "/" or "or".`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    wantTranslation
      ? `- ${SUPPORT} translation of the complete sentence.`
      : `- Empty translation "".`,
    topicDirective,
    "",
    "Stream as NDJSON:",
    `{"type":"ma","phase":"q","question":"<${TARGET} sentence with EXACTLY ${numBlanks} ___ blanks>"}  // first`,
    `{"type":"ma","phase":"choices","choices":["<word1>","<word2>","..."]}  // second, 5-6 single words`,
    `{"type":"ma","phase":"meta","hint":"<${SUPPORT} hint>","answers":["<answer for blank 1>","<answer for blank 2>"${numBlanks === 3 ? ',"<answer for blank 3>"' : ''}],"translation":"<${SUPPORT} translation or empty>"} // third`,
    `{"type":"done"}`,
  ].join("\n");
}

function buildSpeakGrammarStreamPrompt({
  cefrLevel,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  recentGood,
  lessonContent = null,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const wantTranslation =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = difficultyHint(cefrLevel);

  // If lesson content is provided, use specific grammar topic/focus
  // Special handling for tutorial mode - use very simple "hello" content only
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE speaking exercise about basic greetings only. The sentence MUST be a simple greeting like "Hello!", "¡Hola!", "Good morning!", "¡Buenos días!". Keep everything at absolute beginner level.`
    : lessonContent?.topic || lessonContent?.focusPoints
    ? [
        lessonContent.topic
          ? `- STRICT REQUIREMENT: Focus EXCLUSIVELY on grammar topic: ${lessonContent.topic}. Do NOT test any other grammar concepts. This is lesson-specific content and you MUST NOT diverge.`
          : null,
        lessonContent.focusPoints
          ? `- STRICT REQUIREMENT: Address these focus points: ${JSON.stringify(
              lessonContent.focusPoints
            )}. These are mandatory lesson objectives.`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `- Consider recent grammar successes: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Craft ONE short ${TARGET} sentence (≤8 words) that showcases a grammar feature. Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    `- Provide an instruction line in ${TARGET} telling the learner to say it aloud (≤100 chars).`,
    `- Hint in ${SUPPORT} describing the grammar point (e.g., tense, agreement, mood).`,
    wantTranslation
      ? `- Include a ${SUPPORT} translation of the sentence.`
      : `- Use empty translation "".`,
    topicDirective,
    "",
    "Stream as NDJSON:",
    `{"type":"grammar_speak","phase":"prompt","target":"<${TARGET} sentence>","prompt":"<instruction in ${TARGET}>"}`,
    `{"type":"grammar_speak","phase":"meta","hint":"<${SUPPORT} hint>","translation":"<${SUPPORT} translation or empty>"}`,
    `{"type":"done"}`,
  ].join("\n");
}

function buildMAJudgePrompt({
  targetLang,
  stem,
  choices,
  userSelections,
  hint,
}) {
  const listed = choices.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const picked = userSelections.map((c) => `- ${c}`).join("\n");
  return `
Judge a MULTIPLE-ANSWER grammar question in ${LANG_NAME(targetLang)}.

Stem:
${stem}

Choices:
${listed}

User selected (order irrelevant):
${picked || "(none)"}

Hint (optional):
${hint || ""}

Instructions:
- Determine which choices are grammatically correct and context-appropriate answers.
- Say YES if the user's selection includes ALL correct choices and NO incorrect ones (order doesn't matter).
- Be lenient about contractions and minor surface differences; focus on grammar/meaning fit with the stem + hint.
- Allow missing or incorrect accent marks/diacritics (e.g., "Cual" is acceptable for "Cuál").
- If two variants are both acceptable, either may be included.
- Be lenient, good enough answers are acceptable.

Reply with ONE WORD ONLY:
YES or NO
`.trim();
}

/* TRANSLATE — word-bank sentence translation */
function buildTranslateStreamPrompt({
  cefrLevel,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  recentGood,
  lessonContent = null,
  direction = "target-to-support", // "target-to-support" or "support-to-target"
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const diff = difficultyHint(cefrLevel);

  // Determine source and answer languages based on direction
  const isTargetToSupport = direction === "target-to-support";
  const SOURCE_LANG = isTargetToSupport ? TARGET : SUPPORT;
  const ANSWER_LANG = isTargetToSupport ? SUPPORT : TARGET;

  // Special handling for tutorial mode
  const isTutorial = lessonContent?.topic === "tutorial";
  const exampleSentence = isTargetToSupport
    ? `Example: "Hola amigo" -> "Hello friend"`
    : `Example: "Hello friend" -> "Hola amigo"`;
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE sentence about basic greetings only. ${exampleSentence}. Use only common greeting words. Keep everything at absolute beginner level.`
    : lessonContent?.topic || lessonContent?.focusPoints
    ? [
        lessonContent.topic
          ? `- STRICT REQUIREMENT: Focus EXCLUSIVELY on grammar topic: ${lessonContent.topic}. This is lesson-specific content.`
          : null,
        lessonContent.focusPoints
          ? `- STRICT REQUIREMENT: Address these focus points: ${JSON.stringify(
              lessonContent.focusPoints
            )}.`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `- Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE sentence translation exercise. Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    `- Source sentence in ${SOURCE_LANG} (4-8 words, clear grammar).`,
    `- Correct translation as array of ${ANSWER_LANG} words in order.`,
    `- Provide 3-5 distractor words in ${ANSWER_LANG} that are plausible but incorrect.`,
    `- Hint in ${SUPPORT} (≤8 words) about the grammar point.`,
    topicDirective,
    "",
    "Stream as NDJSON:",
    `{"type":"translate","phase":"q","sentence":"<${SOURCE_LANG} sentence>"}`,
    `{"type":"translate","phase":"answer","correctWords":["word1","word2",...],"distractors":["wrong1","wrong2",...]}`,
    `{"type":"translate","phase":"meta","hint":"<${SUPPORT} hint>"}`,
    `{"type":"done"}`,
  ].join("\n");
}

function buildTranslateJudgePrompt({
  sourceLang,
  answerLang,
  sentence,
  correctWords,
  userWords,
}) {
  const SOURCE = LANG_NAME(sourceLang);
  const ANSWER = LANG_NAME(answerLang);
  return `
Judge a TRANSLATION exercise.

Source sentence (${SOURCE}):
${sentence}

Expected translation (${ANSWER}):
${correctWords.join(" ")}

User's answer:
${userWords.join(" ")}

Instructions:
- Say YES if the user's translation is correct or an acceptable variant.
- Allow minor word order variations if meaning is preserved.
- Allow contractions, minor punctuation differences.
- Allow missing or incorrect accent marks/diacritics.
- Be lenient - good enough translations are acceptable.

Reply with ONE WORD ONLY:
YES or NO
`.trim();
}

/* ---------------------------
   Normalizers
--------------------------- */
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Ensure the correct answer is always present in choices.
// If answer not found, inject it by replacing a random non-answer choice.
function ensureAnswerInChoices(choices, answer) {
  if (!answer || !Array.isArray(choices) || choices.length === 0) {
    return { choices, answer: choices[0] || "" };
  }
  const found = choices.find((c) => norm(c) === norm(answer));
  if (found) {
    return { choices, answer: found };
  }
  // Answer not found - inject it by replacing a random choice
  const newChoices = [...choices];
  const replaceIdx = Math.floor(Math.random() * newChoices.length);
  newChoices[replaceIdx] = String(answer);
  return { choices: newChoices, answer: String(answer) };
}

// For multiple answer questions - ensure all correct answers are in choices
function ensureAnswersInChoices(choices, answers) {
  if (
    !Array.isArray(answers) ||
    !Array.isArray(choices) ||
    choices.length === 0
  ) {
    return { choices, answers: [] };
  }
  const newChoices = [...choices];
  const validAnswers = [];

  for (const ans of answers) {
    const found = newChoices.find((c) => norm(c) === norm(ans));
    if (found) {
      validAnswers.push(found);
    } else {
      // Find a slot that's not already a correct answer and replace it
      const nonAnswerIdx = newChoices.findIndex(
        (c) =>
          !validAnswers.some((a) => norm(a) === norm(c)) &&
          !answers.some((a) => norm(a) === norm(c))
      );
      if (nonAnswerIdx !== -1) {
        newChoices[nonAnswerIdx] = String(ans);
        validAnswers.push(String(ans));
      }
    }
  }
  return { choices: newChoices, answers: validAnswers };
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s !== -1 && e !== -1 && e > s) {
      try {
        return JSON.parse(text.slice(s, e + 1));
      } catch {}
    }
    return null;
  }
}

/* Normalize 0-based or 1-based 'map' arrays coming from model */
function normalizeMap(map, len) {
  const arr = Array.isArray(map) ? map.map((n) => parseInt(n, 10)) : [];
  if (!arr.length || arr.some((n) => Number.isNaN(n))) return [];
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (min === 0 && max === len - 1) return arr; // already 0-based
  if (min === 1 && max === len) return arr.map((n) => n - 1); // 1-based
  return [];
}

/* ---------------------------
   Component
--------------------------- */
export default function GrammarBook({
  userLanguage = "en",
  lesson = null,
  lessonContent = null,
  isFinalQuiz = false,
  quizConfig = { questionsRequired: 10, passingScore: 8 },
  onSkip = null,
  pauseMs = 2000,
  onSendHelpRequest = null,
  lessonStartXp = null,
}) {
  const t = useT(userLanguage);
  const toast = useToast();
  const user = useUserStore((s) => s.user);
  const playSound = useSoundSettings((s) => s.playSound);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // Extract CEFR level from lesson ID
  const cefrLevel = lesson?.id ? extractCEFRLevel(lesson.id) : "A1";

  // Quiz mode state
  const [quizQuestionsAnswered, setQuizQuestionsAnswered] = useState(0);
  const [quizCorrectAnswers, setQuizCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizAnswerHistory, setQuizAnswerHistory] = useState([]); // Track correct/wrong for progress bar
  const [quizCurrentQuestionAttempted, setQuizCurrentQuestionAttempted] =
    useState(false);

  const quizStorageKey = useMemo(
    () => (lesson?.id ? `quiz-progress:${lesson.id}` : null),
    [lesson?.id]
  );

  useEffect(() => {
    if (!isFinalQuiz || !quizStorageKey) return;
    try {
      const stored = localStorage.getItem(quizStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return;

      const {
        answered,
        correct,
        completed,
        passed,
        history,
        currentAttempted,
      } = parsed;

      setQuizQuestionsAnswered(Number.isFinite(answered) ? answered : 0);
      setQuizCorrectAnswers(Number.isFinite(correct) ? correct : 0);
      setQuizCompleted(Boolean(completed));
      setQuizPassed(Boolean(passed));
      setQuizAnswerHistory(Array.isArray(history) ? history : []);
      setQuizCurrentQuestionAttempted(Boolean(currentAttempted));
    } catch (error) {
      console.warn("Failed to load quiz progress", error);
    }
  }, [isFinalQuiz, quizStorageKey]);

  useEffect(() => {
    if (!isFinalQuiz || !quizStorageKey) return;
    try {
      const payload = {
        answered: quizQuestionsAnswered,
        correct: quizCorrectAnswers,
        completed: quizCompleted,
        passed: quizPassed,
        history: quizAnswerHistory,
        currentAttempted: quizCurrentQuestionAttempted,
      };
      localStorage.setItem(quizStorageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to save quiz progress", error);
    }
  }, [
    isFinalQuiz,
    quizStorageKey,
    quizQuestionsAnswered,
    quizCorrectAnswers,
    quizCompleted,
    quizPassed,
    quizAnswerHistory,
    quizCurrentQuestionAttempted,
  ]);

  const { xp, levelNumber, progressPct, progress, npub, ready } =
    useSharedProgress();

  const lessonXpGoal = lesson?.xpReward || 0;
  const lessonXpEarned =
    lessonStartXp == null ? 0 : Math.max(0, xp - lessonStartXp);
  const lessonProgressPct =
    lessonXpGoal > 0 ? Math.min(100, (lessonXpEarned / lessonXpGoal) * 100) : 0;
  const lessonProgress =
    lesson &&
    !lesson.isTutorial &&
    !isFinalQuiz &&
    lessonStartXp != null &&
    lessonXpGoal > 0
      ? {
          pct: lessonProgressPct,
          earned: Math.min(lessonXpEarned, lessonXpGoal),
          total: lessonXpGoal,
          label:
            userLanguage === "es"
              ? "Progreso de la lección"
              : "Lesson progress",
        }
      : null;

  const level = progress.level || "beginner";
  const targetLang = ["en", "es", "pt", "nah", "fr", "it", "nl", "ja", "ru", "de"].includes(
    progress.targetLang
  )
    ? progress.targetLang
    : "en";
  const supportLang = ["en", "es", "bilingual"].includes(progress.supportLang)
    ? progress.supportLang
    : "en";
  const showTranslations =
    typeof progress.showTranslations === "boolean"
      ? progress.showTranslations
      : true;
  const isTutorial = lessonContent?.topic === "tutorial";
  const supportCode = resolveSupportLang(supportLang, userLanguage);

  // Localized chips
  const localizedLangName = (code) =>
    ({
      en: t("language_en"),
      es: t("language_es"),
      pt: t("language_pt"),
      fr: t("language_fr"),
      it: t("language_it"),
      nl: t("language_nl"),
      nah: t("language_nah"),
      ja: t("language_ja"),
      ru: t("language_ru"),
      de: t("language_de"),
    }[code] || code);
  const supportName = localizedLangName(supportCode);
  const targetName = localizedLangName(targetLang);
  const levelLabel = t(`onboarding_level_${level}`) || level;
  // Voice will be randomly selected inside getTTSPlayer()
  // voicePreference is kept for backwards compatibility but not used for selection

  const recentCorrectRef = useRef([]);

  const [mode, setMode] = useState("fill"); // "fill" | "mc" | "ma" | "speak" | "match" | "translate"

  // random-by-default (no manual lock controls)
  const modeLocked = false;
  const autoInitRef = useRef(false);

  // verdict + next control
  const [lastOk, setLastOk] = useState(null); // null | true | false
  const [recentXp, setRecentXp] = useState(0);
  const [nextAction, setNextAction] = useState(null);

  // explanation feature
  const [explanationText, setExplanationText] = useState("");
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);

  // note creation feature
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteCreated, setNoteCreated] = useState(false);
  const addNote = useNotesStore((s) => s.addNote);
  const setNotesLoading = useNotesStore((s) => s.setLoading);
  const triggerDoneAnimation = useNotesStore((s) => s.triggerDoneAnimation);

  // inline assistant support feature (replaces modal)
  const [assistantSupportText, setAssistantSupportText] = useState("");
  const [isLoadingAssistantSupport, setIsLoadingAssistantSupport] = useState(false);

  function showCopyToast() {
    toast({
      title:
        t("copied_to_clipboard_all") ||
        (userLanguage === "es"
          ? "Copiado (pregunta + pista + traducción)"
          : "Copied (question + hint + translation)"),
      duration: 1200,
      isClosable: true,
      position: "top",
    });
  }

  function makeBundle(q, h, tr) {
    const lines = [];
    if (q?.trim()) lines.push(q.trim());
    if (h?.trim())
      lines.push((userLanguage === "es" ? "Pista: " : "Hint: ") + h.trim());
    if (tr?.trim())
      lines.push(
        (userLanguage === "es" ? "Traducción: " : "Translation: ") + tr.trim()
      );
    return lines.join("\n");
  }

  async function copyAll(q, h, tr) {
    const text = makeBundle(q, h, tr);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showCopyToast();
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showCopyToast();
      } catch {}
    }
    // Trigger inline assistant instead of modal
    handleAskAssistant(text);
  }

  // Inline assistant support - streams response directly in the UI
  async function handleAskAssistant(questionContext) {
    if (!questionContext || isLoadingAssistantSupport || assistantSupportText) return;

    setIsLoadingAssistantSupport(true);
    setAssistantSupportText("");

    try {
      // Build instruction similar to HelpChatFab
      const levelHint =
        level === "beginner"
          ? "Use short, simple sentences."
          : level === "intermediate"
          ? "Be concise and natural."
          : "Be succinct and native-like.";

      const instruction = [
        "You are a helpful language study buddy for quick questions.",
        `The learner is practicing ${targetName}; their support/UI language is ${supportName}.`,
        levelHint,
        `Explain and guide in ${supportName}. Include examples or phrases in ${targetName} only when they help, but keep the explanation in ${supportName}.`,
        "Keep replies ≤ 60 words.",
        "Use concise Markdown when helpful (bullets, **bold**).",
      ].join(" ");

      const prompt = `${instruction}\n\nUser question:\n${questionContext}`;

      if (simplemodel) {
        const resp = await simplemodel.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        let accumulatedText = "";
        for await (const chunk of resp.stream) {
          const piece = textFromChunk(chunk);
          if (piece) {
            accumulatedText += piece;
            setAssistantSupportText(accumulatedText);
          }
        }

        // Ensure final text is set
        const finalAgg = await resp.response;
        const finalText =
          (typeof finalAgg?.text === "function"
            ? finalAgg.text()
            : finalAgg?.text) || accumulatedText;
        if (finalText) {
          setAssistantSupportText(finalText);
        }
      } else {
        // Fallback to non-streaming if Gemini unavailable
        const response = await callResponses({
          model: DEFAULT_RESPONSES_MODEL,
          input: prompt,
        });
        setAssistantSupportText(
          response ||
            (userLanguage === "es"
              ? "No se pudo generar una respuesta en este momento."
              : "Could not generate a response at this time.")
        );
      }
    } catch (error) {
      console.error("Failed to generate assistant support:", error);
      setAssistantSupportText(
        userLanguage === "es"
          ? "No se pudo generar una respuesta en este momento."
          : "Could not generate a response at this time."
      );
    } finally {
      setIsLoadingAssistantSupport(false);
    }
  }

  // Quiz mode helper function
  function handleQuizAnswer(isCorrect) {
    setQuizCurrentQuestionAttempted(true);

    const newQuestionsAnswered = quizQuestionsAnswered + 1;
    const newCorrectAnswers = isCorrect
      ? quizCorrectAnswers + 1
      : quizCorrectAnswers;
    const newWrongAnswers = newQuestionsAnswered - newCorrectAnswers;

    setQuizAnswerHistory((prev) => [...prev, isCorrect]);
    setQuizQuestionsAnswered(newQuestionsAnswered);
    setQuizCorrectAnswers(newCorrectAnswers);

    const maxAllowedWrong =
      quizConfig.questionsRequired - quizConfig.passingScore;
    if (newWrongAnswers > maxAllowedWrong) {
      setQuizCompleted(true);
      setQuizPassed(false);
      return;
    }

    if (newCorrectAnswers >= quizConfig.passingScore) {
      setQuizCompleted(true);
      setQuizPassed(true);
      return;
    }

    if (newQuestionsAnswered >= quizConfig.questionsRequired) {
      const passed = newCorrectAnswers >= quizConfig.passingScore;
      setQuizCompleted(true);
      setQuizPassed(passed);
    }
  }

  async function handleExplainAnswer() {
    if (!currentQuestionData || isLoadingExplanation || explanationText) return;

    setIsLoadingExplanation(true);
    setExplanationText(""); // Clear any previous text

    try {
      // Build prompt for explanation
      const { question, userAnswer, correctAnswer, questionType } =
        currentQuestionData;

      // Get the prompt template based on question type and user language
      const getLangPrompt = (type) => {
        const langKey = userLanguage === "es" ? "es" : "en";
        const prompts = {
          en: {
            fill: `You are a helpful language tutor teaching ${targetName}. A student answered a fill-in-the-blank question incorrectly.

Question: ${question}
Student's answer: ${userAnswer}
Correct answer (or hint): ${correctAnswer}

IMPORTANT: Provide your explanation in ${supportName}.

Provide a brief, encouraging explanation (2-3 sentences) that:
1. Explains why their answer doesn't fit or what they misunderstood
2. Clarifies the correct answer and its meaning
3. Provides a helpful tip to remember it

Keep it concise, supportive, and focused on learning. Write your entire response in ${supportName}.`,
            mc: `You are a helpful language tutor teaching ${targetName}. A student answered a multiple-choice question incorrectly.

Question: ${question}
Student's answer: ${userAnswer}
Correct answer: ${correctAnswer}

IMPORTANT: Provide your explanation in ${supportName}.

Provide a brief, encouraging explanation (2-3 sentences) that:
1. Explains why their choice was incorrect
2. Clarifies why the correct answer is right
3. Provides a helpful tip to remember the difference

Keep it concise, supportive, and focused on learning. Write your entire response in ${supportName}.`,
            ma: `You are a helpful language tutor teaching ${targetName}. A student answered a multiple-answer question incorrectly.

Question: ${question}
Student's answers: ${userAnswer}
Correct answers: ${correctAnswer}

IMPORTANT: Provide your explanation in ${supportName}.

Provide a brief, encouraging explanation (2-3 sentences) that:
1. Explains which answers they missed or incorrectly selected
2. Clarifies why the correct answers are right
3. Provides a helpful tip to identify correct answers

Keep it concise, supportive, and focused on learning. Write your entire response in ${supportName}.`,
            speak: `You are a helpful language tutor teaching ${targetName}. A student tried to say something in ${targetName} but was not understood correctly.

Target phrase: ${correctAnswer}
What they said: ${userAnswer}

IMPORTANT: Provide your explanation in ${supportName}.

Provide a brief, encouraging explanation (2-3 sentences) that:
1. Explains what pronunciation or phrasing issues may have occurred
2. Provides tips on how to pronounce the correct phrase
3. Offers encouragement to try again

Keep it concise, supportive, and focused on learning. Write your entire response in ${supportName}.`,
            match: `You are a helpful language tutor teaching ${targetName}. A student attempted to match items but made incorrect pairings.

Question: ${question}
Their pairings: ${userAnswer}
Hint: ${correctAnswer}

IMPORTANT: Provide your explanation in ${supportName}.

Provide a brief, encouraging explanation (2-3 sentences) that:
1. Explains which pairings were incorrect
2. Clarifies the correct relationships
3. Provides a tip to remember the correct matches

Keep it concise, supportive, and focused on learning. Write your entire response in ${supportName}.`,
          },
          es: {
            fill: `Eres un tutor de idiomas servicial que enseña ${targetName}. Un estudiante respondió incorrectamente una pregunta de llenar el espacio en blanco.

Pregunta: ${question}
Respuesta del estudiante: ${userAnswer}
Respuesta correcta (o pista): ${correctAnswer}

IMPORTANTE: Proporciona tu explicación en ${supportName}.

Proporciona una breve explicación alentadora (2-3 oraciones) que:
1. Explique por qué su respuesta no encaja o qué malentendieron
2. Aclare la respuesta correcta y su significado
3. Proporcione un consejo útil para recordarla

Mantenlo conciso, de apoyo y enfocado en el aprendizaje. Escribe toda tu respuesta en ${supportName}.`,
            mc: `Eres un tutor de idiomas servicial que enseña ${targetName}. Un estudiante respondió incorrectamente una pregunta de opción múltiple.

Pregunta: ${question}
Respuesta del estudiante: ${userAnswer}
Respuesta correcta: ${correctAnswer}

IMPORTANTE: Proporciona tu explicación en ${supportName}.

Proporciona una breve explicación alentadora (2-3 oraciones) que:
1. Explique por qué su elección fue incorrecta
2. Aclare por qué la respuesta correcta es la correcta
3. Proporcione un consejo útil para recordar la diferencia

Mantenlo conciso, de apoyo y enfocado en el aprendizaje. Escribe toda tu respuesta en ${supportName}.`,
            ma: `Eres un tutor de idiomas servicial que enseña ${targetName}. Un estudiante respondió incorrectamente una pregunta de respuesta múltiple.

Pregunta: ${question}
Respuestas del estudiante: ${userAnswer}
Respuestas correctas: ${correctAnswer}

IMPORTANTE: Proporciona tu explicación en ${supportName}.

Proporciona una breve explicación alentadora (2-3 oraciones) que:
1. Explique qué respuestas omitieron o seleccionaron incorrectamente
2. Aclare por qué las respuestas correctas son correctas
3. Proporcione un consejo útil para identificar las respuestas correctas

Mantenlo conciso, de apoyo y enfocado en el aprendizaje. Escribe toda tu respuesta en ${supportName}.`,
            speak: `Eres un tutor de idiomas servicial que enseña ${targetName}. Un estudiante intentó decir algo en ${targetName} pero no fue entendido correctamente.

Frase objetivo: ${correctAnswer}
Lo que dijeron: ${userAnswer}

IMPORTANTE: Proporciona tu explicación en ${supportName}.

Proporciona una breve explicación alentadora (2-3 oraciones) que:
1. Explique qué problemas de pronunciación o fraseo pueden haber ocurrido
2. Proporcione consejos sobre cómo pronunciar la frase correcta
3. Ofrezca aliento para intentarlo de nuevo

Mantenlo conciso, de apoyo y enfocado en el aprendizaje. Escribe toda tu respuesta en ${supportName}.`,
            match: `Eres un tutor de idiomas servicial que enseña ${targetName}. Un estudiante intentó emparejar elementos pero hizo emparejamientos incorrectos.

Pregunta: ${question}
Sus emparejamientos: ${userAnswer}
Pista: ${correctAnswer}

IMPORTANTE: Proporciona tu explicación en ${supportName}.

Proporciona una breve explicación alentadora (2-3 oraciones) que:
1. Explique qué emparejamientos fueron incorrectos
2. Aclare las relaciones correctas
3. Proporcione un consejo para recordar los emparejamientos correctos

Mantenlo conciso, de apoyo y enfocado en el aprendizaje. Escribe toda tu respuesta en ${supportName}.`,
          },
        };
        return prompts[langKey][type] || prompts[langKey].fill;
      };

      const prompt = getLangPrompt(questionType);

      // Try streaming with Gemini first
      if (simplemodel) {
        const resp = await simplemodel.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        let accumulatedText = "";
        for await (const chunk of resp.stream) {
          const piece = textFromChunk(chunk);
          if (piece) {
            accumulatedText += piece;
            setExplanationText(accumulatedText);
          }
        }

        // Ensure final text is set
        const finalAgg = await resp.response;
        const finalText =
          (typeof finalAgg?.text === "function"
            ? finalAgg.text()
            : finalAgg?.text) || accumulatedText;
        if (finalText) {
          setExplanationText(finalText);
        }
      } else {
        // Fallback to non-streaming if Gemini unavailable
        const explanation = await callResponses({
          model: MODEL,
          input: prompt,
        });
        setExplanationText(
          explanation ||
            (userLanguage === "es"
              ? "No se pudo generar una explicación en este momento."
              : "Could not generate an explanation at this time.")
        );
      }
    } catch (error) {
      console.error("Failed to generate explanation:", error);
      setExplanationText(
        userLanguage === "es"
          ? "No se pudo generar una explicación en este momento."
          : "Could not generate an explanation at this time."
      );
    } finally {
      setIsLoadingExplanation(false);
    }
  }

  function handleNext() {
    playSound(nextButtonSound);
    setLastOk(null);
    setQuizCurrentQuestionAttempted(false);
    setRecentXp(0);
    setNextAction(null);
    setExplanationText("");
    setAssistantSupportText("");
    setCurrentQuestionData(null);
    setNoteCreated(false);

    // In lesson mode, move to next module
    if (onSkip && !isFinalQuiz) {
      onSkip();
      return;
    }

    // In random mode, generate next question
    if (typeof nextAction === "function") {
      const fn = nextAction;
      fn();
    }
  }

  async function handleCreateNote() {
    if (isCreatingNote || noteCreated || !currentQuestionData) return;

    setIsCreatingNote(true);
    setNotesLoading(true);

    try {
      const { question, userAnswer, correctAnswer } = currentQuestionData;
      const concept = question || correctAnswer || "Grammar practice";

      const { example, summary } = await generateNoteContent({
        concept,
        userAnswer,
        wasCorrect: lastOk,
        targetLang,
        supportLang: supportCode,
        cefrLevel,
        moduleType: "grammar",
      });

      const lessonTitle = lesson?.title || { en: "Grammar", es: "Gramática" };

      const note = buildNoteObject({
        lessonTitle,
        cefrLevel,
        example,
        summary,
        targetLang,
        supportLang: supportCode,
        moduleType: "grammar",
        wasCorrect: lastOk,
      });

      addNote(note);
      setNoteCreated(true);
      triggerDoneAnimation();
    } catch (error) {
      console.error("Error creating note:", error);
      toast({
        title:
          userLanguage === "es"
            ? "Error al crear nota"
            : "Could not create note",
        status: "error",
        duration: 2500,
      });
    } finally {
      setIsCreatingNote(false);
      setNotesLoading(false);
    }
  }

  function handleSkip() {
    playSound(nextButtonSound);
    if (isSpeakRecording) {
      try {
        stopSpeakRecording();
      } catch {}
    }
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    // In lesson mode, skip to next module
    if (onSkip) {
      onSkip();
      return;
    }

    // In random mode, generate next question
    const runner = modeLocked ? generatorFor(mode) : generateRandomRef.current;
    if (typeof runner === "function") {
      runner();
    }
  }

  // ---- FILL ----
  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [translation, setTranslation] = useState("");
  const [input, setInput] = useState("");
  const [loadingQ, setLoadingQ] = useState(false);
  const [loadingG, setLoadingG] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  // ---- MC ----
  const [mcQ, setMcQ] = useState("");
  const [mcHint, setMcHint] = useState("");
  const [mcChoices, setMcChoices] = useState([]);
  const [mcAnswer, setMcAnswer] = useState("");
  const [mcTranslation, setMcTranslation] = useState("");
  const [mcPick, setMcPick] = useState("");
  const [mcLayout, setMcLayout] = useState("buttons");
  const [mcBankOrder, setMcBankOrder] = useState([]);
  const [mcSlotIndex, setMcSlotIndex] = useState(null);
  const [mcResult, setMcResult] = useState(""); // kept for firestore text; not shown
  const [loadingMCQ, setLoadingMCQ] = useState(false);
  const [loadingMCG, setLoadingMCG] = useState(false);

  // ---- MA ----
  const [maQ, setMaQ] = useState("");
  const [maHint, setMaHint] = useState("");
  const [maChoices, setMaChoices] = useState([]);
  const [maAnswers, setMaAnswers] = useState([]); // correct strings
  const [maTranslation, setMaTranslation] = useState("");
  const [maPicks, setMaPicks] = useState([]); // selected strings
  const [maLayout, setMaLayout] = useState("buttons");
  const [maSlots, setMaSlots] = useState([]);
  const [maBankOrder, setMaBankOrder] = useState([]);
  const [maResult, setMaResult] = useState(""); // kept for firestore text; not shown
  const [loadingMAQ, setLoadingMAQ] = useState(false);
  const [loadingMAG, setLoadingMAG] = useState(false);

  const maReady =
    maLayout === "drag"
      ? maSlots.length > 0 && maSlots.every((slot) => slot != null)
      : maPicks.length > 0;

  // ---- SPEAK ----
  const [sPrompt, setSPrompt] = useState("");
  const [sTarget, setSTarget] = useState("");
  const [sHint, setSHint] = useState("");
  const [sTranslation, setSTranslation] = useState("");
  const [sRecognized, setSRecognized] = useState("");
  const [sEval, setSEval] = useState(null);
  const [loadingSpeakQ, setLoadingSpeakQ] = useState(false);
  const speakAudioRef = useRef(null);
  const speakAudioUrlRef = useRef(null);
  const [isSpeakPlaying, setIsSpeakPlaying] = useState(false);
  const [isSpeakSynthesizing, setIsSpeakSynthesizing] = useState(false);
  const [isQuestionPlaying, setIsQuestionPlaying] = useState(false);
  const [isQuestionSynthesizing, setIsQuestionSynthesizing] = useState(false);
  const questionAudioRef = useRef(null);
  const questionAudioUrlRef = useRef(null);
  const questionTextRef = useRef("");

  // Match word TTS state
  const [matchWordSynthesizing, setMatchWordSynthesizing] = useState(null); // index of word being synthesized
  const matchWordAudioRef = useRef(null);

  useEffect(() => {
    return () => {
      try {
        speakAudioRef.current?.pause?.();
      } catch {}
      speakAudioRef.current = null;
      try {
        questionAudioRef.current?.pause?.();
      } catch {}
      questionAudioRef.current = null;
      if (speakAudioUrlRef.current) {
        try {
          URL.revokeObjectURL(speakAudioUrlRef.current);
        } catch {}
        speakAudioUrlRef.current = null;
      }
      if (questionAudioUrlRef.current) {
        try {
          URL.revokeObjectURL(questionAudioUrlRef.current);
        } catch {}
        questionAudioUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    try {
      speakAudioRef.current?.pause?.();
    } catch {}
    speakAudioRef.current = null;
    setIsSpeakPlaying(false);
    try {
      questionAudioRef.current?.pause?.();
    } catch {}
    questionAudioRef.current = null;
    setIsQuestionPlaying(false);
  }, [sTarget]);

  useEffect(() => {
    try {
      questionAudioRef.current?.pause?.();
    } catch {}
    questionAudioRef.current = null;
    setIsQuestionPlaying(false);
    setIsQuestionSynthesizing(false);
  }, [mcQ, maQ, targetLang]);

  useEffect(() => {
    setQuestionTTsLang(targetLang);
  }, [targetLang]);

  // ---- MATCH (DnD) ----
  const [mStem, setMStem] = useState("");
  const [mHint, setMHint] = useState("");
  const [mLeft, setMLeft] = useState([]); // strings
  const [mRight, setMRight] = useState([]); // strings
  const [mSlots, setMSlots] = useState([]); // per-left slot: rightIndex | null
  const [mBank, setMBank] = useState([]); // right indices not yet used
  const [mResult, setMResult] = useState(""); // kept for firestore text; not shown
  const [loadingMG, setLoadingMG] = useState(false);
  const [loadingMJ, setLoadingMJ] = useState(false);
  const [mAnswerMap, setMAnswerMap] = useState([]); // ✅ right index for each left (deterministic)

  // ---- TRANSLATE (word bank) ----
  const [tSentence, setTSentence] = useState(""); // source sentence
  const [tCorrectWords, setTCorrectWords] = useState([]); // correct translation words in order
  const [tDistractors, setTDistractors] = useState([]); // distractor words
  const [tWordBank, setTWordBank] = useState([]); // all words shuffled
  const [tHint, setTHint] = useState("");
  const [tDirection, setTDirection] = useState("target-to-support"); // "target-to-support" or "support-to-target"
  const [loadingTQ, setLoadingTQ] = useState(false); // loading question
  const [loadingTJ, setLoadingTJ] = useState(false); // loading judge
  const [translateVariant, setTranslateVariant] = useState("translation"); // "translation" | "listening"
  const [translateUIVariant, setTranslateUIVariant] = useState("repeat"); // "repeat" | "standard"
  const [repeatMode, setRepeatMode] = useState("target-tts-support-bank"); // translate-repeat submode
  const [questionTTsLang, setQuestionTTsLang] = useState(targetLang);

  const generatorDeckRef = useRef([]);
  const repeatOnlyQuestions = false; // Temporary UI testing toggle (false = full UI mix)
  const generateRandomRef = useRef(() => {});
  const mcKeyRef = useRef("");
  const maKeyRef = useRef("");
  // Track previous answer values to detect user input changes
  const prevInputRef = useRef("");
  const prevMcPickRef = useRef("");
  const prevMaPicksRef = useRef([]);

  /* ---------- RANDOM GENERATOR (default on mount & for Next unless user locks a type) ---------- */
  function drawGenerator() {
    if (!generatorDeckRef.current.length) {
      const order = repeatOnlyQuestions
        ? [generateRepeatTranslate]
        : [
            generateFill,
            generateMC,
            generateMA,
            generateSpeak,
            generateMatch,
            generateTranslate,
            generateRepeatTranslate,
          ];
      for (let i = order.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      generatorDeckRef.current = order;
    }
    const [next, ...rest] = generatorDeckRef.current;
    generatorDeckRef.current = rest;
    return next || generateFill;
  }

  function generateRandom() {
    const fn = drawGenerator();
    fn();
  }

  function generatorFor(kind) {
    switch (kind) {
      case "fill":
        return generateFill;
      case "mc":
        return generateMC;
      case "ma":
        return generateMA;
      case "match":
        return generateMatch;
      case "speak":
        return generateSpeak;
      case "translate":
        return generateTranslate;
      case "repeat":
        return generateRepeatTranslate;
      default:
        return generateRandom;
    }
  }

  useEffect(() => {
    generateRandomRef.current = generateRandom;
  });

  // Reset feedback UI only when user actively changes their answer (not when cleared after submission)
  useEffect(() => {
    if (input && input !== prevInputRef.current) {
      setLastOk(null);
    }
    prevInputRef.current = input;
  }, [input]);

  useEffect(() => {
    if (mcPick && mcPick !== prevMcPickRef.current) {
      setLastOk(null);
    }
    prevMcPickRef.current = mcPick;
  }, [mcPick]);

  useEffect(() => {
    const prevPicks = prevMaPicksRef.current;
    const picksChanged = JSON.stringify(maPicks) !== JSON.stringify(prevPicks);
    if (maPicks.length > 0 && picksChanged) {
      setLastOk(null);
    }
    prevMaPicksRef.current = maPicks;
  }, [maPicks]);

  useEffect(() => {
    if (!mcQ || !mcChoices.length) return;
    const signature = `${mcQ}||${mcChoices.join("|")}`;
    if (mcKeyRef.current === signature) return;
    mcKeyRef.current = signature;
    const useDrag = shouldUseDragVariant(
      mcQ,
      mcChoices,
      [mcAnswer].filter(Boolean)
    );
    setMcLayout(useDrag ? "drag" : "buttons");
    setMcSlotIndex(null);
    setMcBankOrder(useDrag ? mcChoices.map((_, idx) => idx) : []);
    setMcPick("");
  }, [mcQ, mcChoices, mcAnswer]);

  useEffect(() => {
    if (!maQ || !maChoices.length || !maAnswers.length) return;
    const signature = `${maQ}||${maChoices.join("|")}|${maAnswers.join("|")}`;
    if (maKeyRef.current === signature) return;
    maKeyRef.current = signature;
    const preferDrag = shouldUseDragVariant(maQ, maChoices, maAnswers);
    const blanksCount = countBlanks(maQ);
    // Only use drag mode if blanks count matches answers count exactly
    // This prevents users from being trapped when LLM generates mismatched slots/answers
    const useDrag =
      preferDrag && blanksCount > 0 && blanksCount === maAnswers.length;
    setMaLayout(useDrag ? "drag" : "buttons");
    if (useDrag) {
      // Slot count = number of blanks in text (should match answers length from prompt)
      const slotCount = blanksCount > 0 ? blanksCount : maAnswers.length;
      setMaSlots(Array.from({ length: slotCount }, () => null));
      setMaBankOrder(maChoices.map((_, idx) => idx));
    } else {
      setMaSlots([]);
      setMaBankOrder([]);
    }
    setMaPicks([]);
  }, [maQ, maChoices, maAnswers]);

  const handleMcDragEnd = useCallback(
    (result) => {
      if (!result?.destination || mcLayout !== "drag") return;
      const { source, destination } = result;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      if (
        source.droppableId === "mc-bank" &&
        destination.droppableId === "mc-bank"
      ) {
        const updated = Array.from(mcBankOrder);
        const [removed] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, removed);
        setMcBankOrder(updated);
        return;
      }

      if (
        source.droppableId === "mc-bank" &&
        destination.droppableId === "mc-slot"
      ) {
        const updated = Array.from(mcBankOrder);
        const [removed] = updated.splice(source.index, 1);
        if (mcSlotIndex != null) {
          updated.splice(destination.index, 0, mcSlotIndex);
        }
        setMcBankOrder(updated);
        setMcSlotIndex(removed);
        setMcPick(mcChoices[removed] || "");
        return;
      }

      if (
        source.droppableId === "mc-slot" &&
        destination.droppableId === "mc-bank"
      ) {
        if (mcSlotIndex == null) return;
        const updated = Array.from(mcBankOrder);
        updated.splice(destination.index, 0, mcSlotIndex);
        setMcBankOrder(updated);
        setMcSlotIndex(null);
        setMcPick("");
      }
    },
    [mcLayout, mcBankOrder, mcSlotIndex, mcChoices]
  );

  const handleMaDragEnd = useCallback(
    (result) => {
      if (!result?.destination || maLayout !== "drag") return;
      const { source, destination } = result;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      const parseSlot = (id) =>
        id.startsWith("ma-slot-")
          ? parseInt(id.replace("ma-slot-", ""), 10)
          : null;
      const sourceSlot = parseSlot(source.droppableId);
      const destSlot = parseSlot(destination.droppableId);

      if (
        source.droppableId === "ma-bank" &&
        destination.droppableId === "ma-bank"
      ) {
        const updated = Array.from(maBankOrder);
        const [removed] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, removed);
        setMaBankOrder(updated);
        return;
      }

      if (source.droppableId === "ma-bank" && destSlot != null) {
        const updated = Array.from(maBankOrder);
        const [removed] = updated.splice(source.index, 1);
        const displaced = maSlots[destSlot];
        if (displaced != null) {
          updated.splice(source.index, 0, displaced);
        }
        setMaBankOrder(updated);
        setMaSlots((prev) => {
          const next = [...prev];
          next[destSlot] = removed;
          return next;
        });
        return;
      }

      if (sourceSlot != null && destination.droppableId === "ma-bank") {
        const slotValue = maSlots[sourceSlot];
        if (slotValue == null) return;
        const updated = Array.from(maBankOrder);
        updated.splice(destination.index, 0, slotValue);
        setMaBankOrder(updated);
        setMaSlots((prev) => {
          const next = [...prev];
          next[sourceSlot] = null;
          return next;
        });
        return;
      }

      if (sourceSlot != null && destSlot != null) {
        setMaSlots((prev) => {
          const next = [...prev];
          const temp = next[sourceSlot];
          next[sourceSlot] = next[destSlot];
          next[destSlot] = temp;
          return next;
        });
      }
    },
    [maLayout, maBankOrder, maSlots]
  );

  // Auto-drag handlers for click-to-place functionality
  const handleMcAnswerClick = useCallback(
    (choiceIdx, position) => {
      if (mcLayout !== "drag") return;

      // Move answer from bank to slot
      const updated = Array.from(mcBankOrder);
      updated.splice(position, 1);

      // If there's already an answer in the slot, return it to the bank
      if (mcSlotIndex != null) {
        updated.splice(position, 0, mcSlotIndex);
      }

      setMcBankOrder(updated);
      setMcSlotIndex(choiceIdx);
      setMcPick(mcChoices[choiceIdx] || "");
    },
    [mcLayout, mcBankOrder, mcSlotIndex, mcChoices]
  );

  const handleMaAnswerClick = useCallback(
    (choiceIdx, position) => {
      if (maLayout !== "drag") return;

      // Find first empty slot
      const firstEmptySlot = maSlots.findIndex((slot) => slot == null);

      if (firstEmptySlot === -1) {
        // No empty slots available
        return;
      }

      // Remove from bank
      const updated = Array.from(maBankOrder);
      updated.splice(position, 1);
      setMaBankOrder(updated);

      // Place in first empty slot
      setMaSlots((prev) => {
        const next = [...prev];
        next[firstEmptySlot] = choiceIdx;
        return next;
      });
    },
    [maLayout, maBankOrder, maSlots]
  );

  useEffect(() => {
    if (maLayout !== "drag") return;
    setMaPicks((prev) => {
      const filled = maSlots
        .filter((idx) => idx != null)
        .map((idx) => maChoices[idx])
        .filter(Boolean);
      if (
        filled.length === prev.length &&
        filled.every((val, idx) => val === prev[idx])
      ) {
        return prev;
      }
      return filled;
    });
  }, [maLayout, maSlots, maChoices]);

  /* ---------- AUTO-GENERATE on first render (respect language settings) ---------- */
  // ✅ Wait until 'ready' so the very first prompt uses the user's target/support language.
  useEffect(() => {
    if (autoInitRef.current) return;
    if (!ready) return;
    autoInitRef.current = true;
    generateRandom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /* ---------- STREAM Generate: Fill ---------- */
  async function generateFill() {
    setMode("fill");
    setLoadingQ(true);
    setInput("");
    setLastOk(null);
    setQuizCurrentQuestionAttempted(false);
    setRecentXp(0);
    setNextAction(null);

    setQuestion("");
    setHint("");
    setTranslation("");

    const prompt = buildFillStreamPrompt({
      cefrLevel,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      recentGood: recentCorrectRef.current,
      lessonContent,
    });

    let gotSomething = false;

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");

      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (obj?.type === "fill" && obj.phase === "q" && obj.question) {
              setQuestion(String(obj.question));
              gotSomething = true;
            } else if (obj?.type === "fill" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setHint(obj.hint);
              if (typeof obj.translation === "string")
                setTranslation(obj.translation);
              gotSomething = true;
            }
          });
        }
      }

      // Flush any trailing text after stream ends
      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (finalText) {
        (finalText + "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) =>
            tryConsumeLine(l, (obj) => {
              if (obj?.type === "fill" && obj.phase === "q" && obj.question) {
                setQuestion(String(obj.question));
                gotSomething = true;
              } else if (obj?.type === "fill" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setHint(obj.hint);
                if (typeof obj.translation === "string")
                  setTranslation(obj.translation);
                gotSomething = true;
              }
            })
          );
      }

      if (!gotSomething) throw new Error("no-fill");
    } catch {
      // Fallback (unchanged)
      const fallbackPrompt = `
Write ONE short ${LANG_NAME(
        targetLang
      )} grammar question with a single blank "___".
- No meta like "(to go)" in the question.
- ≤ 120 chars.
Return EXACTLY: <question> ||| <hint in ${LANG_NAME(
        resolveSupportLang(supportLang, userLanguage)
      )} (≤ 8 words)> ||| <${
        showTranslations
          ? LANG_NAME(resolveSupportLang(supportLang, userLanguage))
          : ""
      } translation or "">
`.trim();

      const text = await callResponses({ model: MODEL, input: fallbackPrompt });
      const [q, h, tr] = text.split("|||").map((s) => (s || "").trim());
      if (q) {
        setQuestion(q);
        setHint(h || "");
        setTranslation(tr || "");
      } else {
        if (targetLang === "es") {
          setQuestion("Completa: Ella ___ al trabajo cada día.");
          setHint("Tiempo presente de ir");
          setTranslation(
            showTranslations && supportCode === "en"
              ? "She ___ to work every day."
              : ""
          );
        } else {
          setQuestion("Fill in the blank: She ___ to work every day.");
          setHint('Use present of "go"');
          setTranslation(
            showTranslations && supportCode === "es"
              ? "Ella ___ al trabajo cada día."
              : ""
          );
        }
      }
    } finally {
      setLoadingQ(false);
    }
  }

  /* ---------- STREAM Generate: MC ---------- */
  async function generateMC() {
    setMode("mc");
    setLoadingMCQ(true);
    setMcResult("");
    setMcPick("");
    setMcLayout("buttons");
    setMcBankOrder([]);
    setMcSlotIndex(null);
    setLastOk(null);
    setQuizCurrentQuestionAttempted(false);
    setRecentXp(0);
    setNextAction(null);

    setMcQ("");
    setMcHint("");
    setMcChoices([]);
    setMcAnswer("");
    setMcTranslation("");

    const prompt = buildMCStreamPrompt({
      cefrLevel,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      recentGood: recentCorrectRef.current,
      lessonContent,
    });

    let got = false;
    let pendingAnswer = "";

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");

      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (obj?.type === "mc" && obj.phase === "q" && obj.question) {
              setMcQ(String(obj.question));
              got = true;
            } else if (
              obj?.type === "mc" &&
              obj.phase === "choices" &&
              Array.isArray(obj.choices)
            ) {
              const rawChoices = obj.choices.slice(0, 4).map(String);
              // If answer already known, ensure it's in choices
              if (pendingAnswer) {
                const { choices, answer } = ensureAnswerInChoices(
                  rawChoices,
                  pendingAnswer
                );
                setMcChoices(choices);
                setMcAnswer(answer);
              } else {
                setMcChoices(rawChoices);
              }
              got = true;
            } else if (obj?.type === "mc" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setMcHint(obj.hint);
              if (typeof obj.translation === "string")
                setMcTranslation(obj.translation);
              if (typeof obj.answer === "string") {
                pendingAnswer = obj.answer;
                if (Array.isArray(mcChoices) && mcChoices.length) {
                  const { choices, answer } = ensureAnswerInChoices(
                    mcChoices,
                    pendingAnswer
                  );
                  setMcChoices(choices);
                  setMcAnswer(answer);
                }
              }
              got = true;
            }
          });
        }
      }

      // Flush tail
      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (finalText) {
        (finalText + "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) =>
            tryConsumeLine(l, (obj) => {
              if (obj?.type === "mc" && obj.phase === "q" && obj.question) {
                setMcQ(String(obj.question));
                got = true;
              } else if (
                obj?.type === "mc" &&
                obj.phase === "choices" &&
                Array.isArray(obj.choices)
              ) {
                const rawChoices = obj.choices.slice(0, 4).map(String);
                if (pendingAnswer) {
                  const { choices, answer } = ensureAnswerInChoices(
                    rawChoices,
                    pendingAnswer
                  );
                  setMcChoices(choices);
                  setMcAnswer(answer);
                } else {
                  setMcChoices(rawChoices);
                }
                got = true;
              } else if (obj?.type === "mc" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setMcHint(obj.hint);
                if (typeof obj.translation === "string")
                  setMcTranslation(obj.translation);
                if (typeof obj.answer === "string") {
                  pendingAnswer = obj.answer;
                  if (Array.isArray(mcChoices) && mcChoices.length) {
                    const { choices, answer } = ensureAnswerInChoices(
                      mcChoices,
                      pendingAnswer
                    );
                    setMcChoices(choices);
                    setMcAnswer(answer);
                  }
                }
                got = true;
              }
            })
          );
      }

      if (!got) throw new Error("no-mc");
    } catch {
      // Fallback (non-stream)
      const fallback = `
Create ONE multiple-choice ${LANG_NAME(
        targetLang
      )} grammar question. Return JSON ONLY:
{
  "question": "<stem>",
  "hint": "<hint in ${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )}>",
  "choices": ["<choice1>","<choice2>","<choice3>","<choice4>"],
  "notes": "Replace <choiceN> with real ${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )} options.",
  "answer": "<exact correct choice>",
  "translation": "${showTranslations ? "<translation>" : ""}"
}
`.trim();

      const text = await callResponses({ model: MODEL, input: fallback });
      const parsed = safeParseJSON(text);
      if (
        parsed &&
        parsed.question &&
        Array.isArray(parsed.choices) &&
        parsed.choices.length >= 3
      ) {
        const rawChoices = parsed.choices.slice(0, 4).map((c) => String(c));
        // Ensure the correct answer is always in choices
        const { choices, answer } = ensureAnswerInChoices(
          rawChoices,
          parsed.answer
        );
        setMcQ(String(parsed.question));
        setMcHint(String(parsed.hint || ""));
        setMcChoices(choices);
        setMcAnswer(answer);
        setMcTranslation(String(parsed.translation || ""));
      } else {
        setMcQ("Choose the correct past form of 'go'.");
        setMcHint("Simple past");
        const choices = ["go", "went", "gone", "going"];
        setMcChoices(choices);
        setMcAnswer("went");
        setMcTranslation(
          showTranslations && supportCode === "es"
            ? "Elige la forma correcta del pasado de 'go'."
            : ""
        );
      }
    } finally {
      setLoadingMCQ(false);
    }
  }

  /* ---------- STREAM Generate: MA ---------- */
  function sanitizeMA(parsed) {
    if (
      !parsed ||
      typeof parsed.question !== "string" ||
      !Array.isArray(parsed.choices) ||
      !Array.isArray(parsed.answers)
    )
      return null;

    const uniqByNorm = (arr) => {
      const seen = new Set();
      const out = [];
      for (const s of arr) {
        const k = norm(s);
        if (!seen.has(k)) {
          seen.add(k);
          out.push(String(s));
        }
      }
      return out;
    };

    const rawChoices = uniqByNorm(parsed.choices).slice(0, 6);
    const rawAnswers = uniqByNorm(parsed.answers);

    if (rawChoices.length < 4) return null;
    if (rawAnswers.length < 2 || rawAnswers.length > 3) return null;

    // Ensure all correct answers are in choices
    const { choices, answers } = ensureAnswersInChoices(rawChoices, rawAnswers);

    return {
      question: String(parsed.question),
      hint: String(parsed.hint || ""),
      choices,
      answers,
      translation: String(parsed.translation || ""),
    };
  }

  async function generateMA() {
    setMode("ma");
    setLoadingMAQ(true);
    setMaResult("");
    setMaPicks([]);
    setMaLayout("buttons");
    setMaSlots([]);
    setMaBankOrder([]);
    setLastOk(null);
    setQuizCurrentQuestionAttempted(false);
    setRecentXp(0);
    setNextAction(null);

    setMaQ("");
    setMaHint("");
    setMaChoices([]);
    setMaAnswers([]);
    setMaTranslation("");

    const prompt = buildMAStreamPrompt({
      cefrLevel,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      recentGood: recentCorrectRef.current,
      lessonContent,
    });

    let got = false;
    // Use local variables to accumulate streaming data to prevent de-rendering issues
    let tempQuestion = "";
    let tempChoices = [];
    let tempAnswers = [];
    let tempHint = "";
    let tempTranslation = "";

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");

      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (obj?.type === "ma" && obj.phase === "q" && obj.question) {
              tempQuestion = String(obj.question);
              setMaQ(tempQuestion);
              got = true;
            } else if (
              obj?.type === "ma" &&
              obj.phase === "choices" &&
              Array.isArray(obj.choices)
            ) {
              tempChoices = obj.choices.slice(0, 6).map(String);
              // Don't set state yet - wait for answers to arrive
              got = true;
            } else if (obj?.type === "ma" && obj.phase === "meta") {
              if (typeof obj.hint === "string") {
                tempHint = obj.hint;
                setMaHint(tempHint);
              }
              if (typeof obj.translation === "string") {
                tempTranslation = obj.translation;
                setMaTranslation(tempTranslation);
              }
              if (Array.isArray(obj.answers)) {
                tempAnswers = obj.answers.map(String);
              }
              got = true;
            }
          });
        }
      }

      // Flush tail
      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (finalText) {
        (finalText + "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) =>
            tryConsumeLine(l, (obj) => {
              if (obj?.type === "ma" && obj.phase === "q" && obj.question) {
                tempQuestion = String(obj.question);
                setMaQ(tempQuestion);
                got = true;
              } else if (
                obj?.type === "ma" &&
                obj.phase === "choices" &&
                Array.isArray(obj.choices)
              ) {
                tempChoices = obj.choices.slice(0, 6).map(String);
                got = true;
              } else if (obj?.type === "ma" && obj.phase === "meta") {
                if (typeof obj.hint === "string") {
                  tempHint = obj.hint;
                  setMaHint(tempHint);
                }
                if (typeof obj.translation === "string") {
                  tempTranslation = obj.translation;
                  setMaTranslation(tempTranslation);
                }
                if (Array.isArray(obj.answers)) {
                  tempAnswers = obj.answers.map(String);
                }
                got = true;
              }
            })
          );
      }

      // Now set choices and answers together to prevent de-rendering
      if (tempChoices.length > 0 && tempAnswers.length >= 2) {
        const { choices, answers } = ensureAnswersInChoices(
          tempChoices,
          tempAnswers
        );
        setMaChoices(choices);
        setMaAnswers(answers);
      } else if (tempChoices.length > 0) {
        setMaChoices(tempChoices);
        if (tempAnswers.length >= 2) setMaAnswers(tempAnswers);
      }

      if (!got) throw new Error("no-ma");
    } catch {
      // Fallback (non-stream)
      const fallback = `
Create ONE multiple-answer ${LANG_NAME(
        targetLang
      )} grammar question. Return JSON ONLY:
{
  "question":"<stem>",
  "hint":"<hint in ${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )}>",
  "choices":["...","...","...","...","..."],
  "answers":["<correct>","<correct>"],
  "translation":"${showTranslations ? "<translation>" : ""}"
}
`.trim();

      const text = await callResponses({ model: MODEL, input: fallback });
      const parsed = sanitizeMA(safeParseJSON(text));
      if (parsed) {
        setMaQ(parsed.question);
        setMaHint(parsed.hint);
        setMaChoices(parsed.choices);
        setMaAnswers(parsed.answers);
        setMaTranslation(parsed.translation);
      } else {
        setMaQ("Select all sentences that are in present perfect.");
        setMaHint("have/has + past participle");
        const choices = [
          "She has eaten.",
          "They eat now.",
          "We have finished.",
          "He is finishing.",
          "I have seen it.",
        ];
        setMaChoices(choices);
        setMaAnswers([
          "She has eaten.",
          "We have finished.",
          "I have seen it.",
        ]);
        setMaTranslation(
          showTranslations && supportCode === "es"
            ? "Selecciona todas las oraciones en presente perfecto."
            : ""
        );
      }
    } finally {
      setLoadingMAQ(false);
    }
  }

  async function generateSpeak() {
    try {
      stopSpeakRecording();
    } catch {}
    setMode("speak");
    setLoadingSpeakQ(true);
    setLastOk(null);
    setQuizCurrentQuestionAttempted(false);
    setRecentXp(0);
    setNextAction(null);
    setSRecognized("");
    setSEval(null);

    const prompt = buildSpeakGrammarStreamPrompt({
      cefrLevel,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      recentGood: recentCorrectRef.current,
      lessonContent,
    });

    let got = false;

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");

      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;

        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (obj?.type === "grammar_speak" && obj.phase === "prompt") {
              if (typeof obj.prompt === "string") setSPrompt(obj.prompt.trim());
              if (typeof obj.target === "string") setSTarget(obj.target.trim());
              got = true;
            } else if (obj?.type === "grammar_speak" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setSHint(obj.hint);
              if (typeof obj.translation === "string")
                setSTranslation(obj.translation);
              got = true;
            }
          });
        }
      }

      if (!got) throw new Error("no-speak");
    } catch {
      const text = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(
          targetLang
        )} sentence for pronunciation practice. Return JSON ONLY:
{
  "target":"<${LANG_NAME(targetLang)} sentence with a grammar focus>",
  "prompt":"<${LANG_NAME(
    targetLang
  )} instruction telling the learner to say it aloud>",
  "hint":"<${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )} grammar hint>",
  "translation":"${
    showTranslations
      ? `<${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )} translation>`
      : ""
  }"
}`.trim(),
      });

      const parsed = safeParseJsonLoose(text);
      if (parsed && typeof parsed.target === "string") {
        setSTarget(parsed.target.trim());
        setSPrompt(String(parsed.prompt || ""));
        setSHint(String(parsed.hint || ""));
        setSTranslation(String(parsed.translation || ""));
      } else {
        if (targetLang === "es") {
          setSTarget("Si hubiera estudiado más, habría aprobado.");
          setSPrompt("Pronuncia la oración completa.");
          setSHint("condicional compuesto");
          setSTranslation(
            supportCode === "en"
              ? "If I had studied more, I would have passed."
              : "Si hubiera estudiado más, habría aprobado."
          );
        } else if (targetLang === "nah") {
          setSTarget("Tlakatl kuali tlahtoa nechca teopan.");
          setSPrompt("Di la frase con claridad.");
          setSHint("orden verbo + adverbio");
          setSTranslation(
            supportCode === "en"
              ? "The person speaks well near the temple."
              : "La persona habla bien cerca del templo."
          );
        } else {
          setSTarget("Were she to ask, I would help.");
          setSPrompt("Say the conditional sentence out loud.");
          setSHint(
            supportCode === "es"
              ? "condicional invertido"
              : "inverted conditional"
          );
          setSTranslation(
            supportCode === "es"
              ? "Si ella lo pidiera, ayudaría."
              : "Were she to ask, I would help."
          );
        }
      }
    } finally {
      setLoadingSpeakQ(false);
    }
  }

  /* ---------- STREAM Generate: MATCH (Gemini with deterministic map) ---------- */
  async function generateMatch() {
    setMode("match");
    setLoadingMG(true);
    setMResult("");
    setLastOk(null);
    setQuizCurrentQuestionAttempted(false);
    setRecentXp(0);
    setNextAction(null);

    // Reset state
    setMStem("");
    setMHint("");
    setMLeft([]);
    setMRight([]);
    setMSlots([]);
    setMBank([]);
    setMAnswerMap([]);

    const prompt = buildMatchStreamPrompt({
      cefrLevel,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      recentGood: recentCorrectRef.current,
    });

    let okPayload = false;

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");
      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (
              obj?.type === "match" &&
              typeof obj.stem === "string" &&
              Array.isArray(obj.left) &&
              Array.isArray(obj.right) &&
              obj.left.length >= 3 &&
              obj.left.length <= 6 &&
              obj.left.length === obj.right.length
            ) {
              const stem = String(obj.stem).trim() || "Empareja los elementos.";
              const left = obj.left.slice(0, 6).map(String);
              const right = obj.right.slice(0, 6).map(String);
              const hint = String(obj.hint || "");
              const map = normalizeMap(obj.map, right.length);
              setMStem(stem);
              setMHint(hint);
              setMLeft(left);
              setMRight(right);
              setMSlots(Array(left.length).fill(null));
              setMBank(shuffle([...Array(right.length)].map((_, i) => i)));
              setMAnswerMap(
                map.length === left.length ? map : [...left.keys()]
              );
              okPayload = true;
            }
          });
        }
      }

      // Flush tail
      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (finalText) {
        (finalText + "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) =>
            tryConsumeLine(l, (obj) => {
              if (
                obj?.type === "match" &&
                typeof obj.stem === "string" &&
                Array.isArray(obj.left) &&
                Array.isArray(obj.right) &&
                obj.left.length >= 3 &&
                obj.left.length <= 6 &&
                obj.left.length === obj.right.length
              ) {
                const stem =
                  String(obj.stem).trim() || "Empareja los elementos.";
                const left = obj.left.slice(0, 6).map(String);
                const right = obj.right.slice(0, 6).map(String);
                const hint = String(obj.hint || "");
                const map = normalizeMap(obj.map, right.length);
                setMStem(stem);
                setMHint(hint);
                setMLeft(left);
                setMRight(right);
                setMSlots(Array(left.length).fill(null));
                setMBank(shuffle([...Array(right.length)].map((_, i) => i)));
                setMAnswerMap(
                  map.length === left.length ? map : [...left.keys()]
                );
                okPayload = true;
              }
            })
          );
      }

      if (!okPayload) throw new Error("no-match");
    } catch {
      // Backend fallback with the same coherence guarantees
      const raw = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(
          targetLang
        )} GRAMMAR matching exercise (single grammar family, 3–6 rows).
Return JSON ONLY:
{"stem":"<stem>","left":["..."],"right":["..."],"map":[0,2,1],"hint":"<hint in ${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )}>"}
`.trim(),
      });
      const parsed = safeParseJsonLoose(raw);

      let stem = "",
        left = [],
        right = [],
        hint = "",
        map = [];

      if (
        parsed &&
        Array.isArray(parsed.left) &&
        Array.isArray(parsed.right) &&
        parsed.left.length >= 3 &&
        parsed.left.length <= 6 &&
        parsed.left.length === parsed.right.length
      ) {
        stem = String(parsed.stem || "Empareja los elementos.");
        left = parsed.left.slice(0, 6).map(String);
        right = parsed.right.slice(0, 6).map(String);
        hint = String(parsed.hint || "");
        map = normalizeMap(parsed.map, right.length);
      } else {
        // Safe default set (family: subject → 'to be' present)
        if (targetLang === "es") {
          stem =
            "Relaciona el sujeto con la forma correcta del verbo 'ser' (presente).";
          left = ["yo", "él", "nosotros"];
          right = ["soy", "es", "somos"];
          hint = "Concordancia sujeto–verbo";
          map = [0, 1, 2];
        } else {
          stem = "Match subjects with the correct present form of 'to be'.";
          left = ["I", "she", "they"];
          right = ["am", "is", "are"];
          hint = "Subject–verb agreement";
          map = [0, 1, 2];
        }
      }

      setMStem(stem);
      setMHint(hint);
      setMLeft(left);
      setMRight(right);
      setMSlots(Array(left.length).fill(null));
      setMBank(shuffle([...Array(right.length)].map((_, i) => i)));
      setMAnswerMap(map.length === left.length ? map : [...left.keys()]);
    } finally {
      setLoadingMG(false);
    }
  }

  /* ---------- STREAM Generate: TRANSLATE (word bank) ---------- */
  async function generateTranslate({ useRepeatUI = false } = {}) {
    setMode("translate");
    setLoadingTQ(true);
    setLastOk(null);
    setQuizCurrentQuestionAttempted(false);
    setRecentXp(0);
    setNextAction(null);

    const repeatVariant = useRepeatUI;
    const supportCode = resolveSupportLang(supportLang, userLanguage);
    const isListening = repeatVariant && Math.random() < 0.5; // listening vs translation exercise

    const chosenRepeatMode = repeatVariant
      ? isListening
        ? "listening-target"
        : Math.random() < 0.5
        ? "target-tts-support-bank"
        : "support-tts-target-bank"
      : null;

    setTranslateUIVariant(repeatVariant ? "repeat" : "standard");
    setTranslateVariant(isListening ? "listening" : "translation");
    setRepeatMode(chosenRepeatMode || "target-tts-support-bank");

    const direction = repeatVariant
      ? isListening
        ? "support-to-target"
        : chosenRepeatMode === "target-tts-support-bank"
        ? "target-to-support"
        : "support-to-target"
      : Math.random() < 0.5
      ? "target-to-support"
      : "support-to-target";

    setQuestionTTsLang(
      repeatVariant
        ? chosenRepeatMode === "target-tts-support-bank" || isListening
          ? targetLang
          : supportCode
        : direction === "target-to-support"
        ? targetLang
        : supportCode
    );
    setTDirection(direction);
    const activeRepeatMode = chosenRepeatMode;

    // Reset state
    setTSentence("");
    setTCorrectWords([]);
    setTDistractors([]);
    setTWordBank([]);
    setTHint("");

    const prompt = buildTranslateStreamPrompt({
      cefrLevel,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      recentGood: recentCorrectRef.current,
      lessonContent,
      direction,
    });

    let tempSentence = "";
    let gotSentence = false;
    let gotAnswer = false;
    let tempCorrectWords = [];
    let tempDistractors = [];

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");
      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (
              obj?.type === "translate" &&
              obj.phase === "q" &&
              obj.sentence
            ) {
              tempSentence = String(obj.sentence).trim();
              setTSentence(tempSentence);
              gotSentence = true;
            }
            if (obj?.type === "translate" && obj.phase === "answer") {
              if (
                Array.isArray(obj.correctWords) &&
                obj.correctWords.length > 0
              ) {
                tempCorrectWords = obj.correctWords.map(String);
                setTCorrectWords(tempCorrectWords);
              }
              if (Array.isArray(obj.distractors)) {
                tempDistractors = obj.distractors.map(String);
                setTDistractors(tempDistractors);
              }
              gotAnswer = true;
            }
            if (obj?.type === "translate" && obj.phase === "meta" && obj.hint) {
              setTHint(String(obj.hint).trim());
            }
          });
        }
      }

      // Flush tail
      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (finalText) {
        (finalText + "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) =>
            tryConsumeLine(l, (obj) => {
              if (
                obj?.type === "translate" &&
                obj.phase === "q" &&
                obj.sentence
              ) {
                tempSentence = String(obj.sentence).trim();
                setTSentence(tempSentence);
                gotSentence = true;
              }
              if (obj?.type === "translate" && obj.phase === "answer") {
                if (
                  Array.isArray(obj.correctWords) &&
                  obj.correctWords.length > 0
                ) {
                  tempCorrectWords = obj.correctWords.map(String);
                  setTCorrectWords(tempCorrectWords);
                }
                if (Array.isArray(obj.distractors)) {
                  tempDistractors = obj.distractors.map(String);
                  setTDistractors(tempDistractors);
                }
                gotAnswer = true;
              }
              if (
                obj?.type === "translate" &&
                obj.phase === "meta" &&
                obj.hint
              ) {
                setTHint(String(obj.hint).trim());
              }
            })
          );
      }

      if (!gotSentence || !gotAnswer) throw new Error("incomplete-translate");

      const answerLang =
        direction === "target-to-support" ? supportCode : targetLang;
      const distractors =
        tempDistractors.length > 0
          ? tempDistractors
          : buildFallbackDistractors(tempCorrectWords, answerLang);

      if (
        repeatVariant &&
        activeRepeatMode === "listening-target" &&
        tempCorrectWords.length
      ) {
        setTSentence(tempCorrectWords.join(" "));
      } else if (tempSentence) {
        setTSentence(tempSentence);
      }

      // Build shuffled word bank
      setTDistractors(distractors);
      const allWords = [...tempCorrectWords, ...distractors];
      setTWordBank(shuffle(allWords));
    } catch {
      // Fallback defaults based on direction
      const isTargetToSupport = direction === "target-to-support";
      if (targetLang === "es") {
        if (isTargetToSupport) {
          // Spanish -> English
          setTSentence("Vamos a la escuela.");
          setTCorrectWords(["We", "go", "to", "school"]);
          setTDistractors(["house", "the", "tomorrow"]);
          setTWordBank(
            shuffle(["We", "go", "to", "school", "house", "the", "tomorrow"])
          );
          setTHint("Present tense of 'ir' (to go)");
        } else {
          // English -> Spanish
          setTSentence("We go to school.");
          setTCorrectWords(["Vamos", "a", "la", "escuela"]);
          setTDistractors(["casa", "el", "mañana"]);
          setTWordBank(
            shuffle(["Vamos", "a", "la", "escuela", "casa", "el", "mañana"])
          );
          setTHint("Present tense of 'ir' (to go)");
        }
      } else {
        if (isTargetToSupport) {
          // English -> Spanish (when target is English)
          setTSentence("We go to school.");
          setTCorrectWords(["Vamos", "a", "la", "escuela"]);
          setTDistractors(["casa", "el", "mañana"]);
          setTWordBank(
            shuffle(["Vamos", "a", "la", "escuela", "casa", "el", "mañana"])
          );
          setTHint("Presente del verbo 'ir'");
        } else {
          // Spanish -> English (when target is English)
          setTSentence("Vamos a la escuela.");
          setTCorrectWords(["We", "go", "to", "school"]);
          setTDistractors(["house", "the", "tomorrow"]);
          setTWordBank(
            shuffle(["We", "go", "to", "school", "house", "the", "tomorrow"])
          );
          setTHint("Presente del verbo 'ir'");
        }
      }

      if (
        repeatVariant &&
        activeRepeatMode === "listening-target" &&
        tCorrectWords.length
      ) {
        setTSentence(tCorrectWords.join(" "));
      }
    } finally {
      setLoadingTQ(false);
    }
  }

  async function generateRepeatTranslate() {
    return generateTranslate({ useRepeatUI: true });
  }

  /* ---------------------------
     Virtual Keyboard handler
  --------------------------- */
  const handleKeyboardInput = useCallback((key) => {
    if (key === "BACKSPACE") {
      setInput((prev) => prev.slice(0, -1));
    } else {
      setInput((prev) => prev + key);
    }
  }, []);

  // Check if keyboard should be available (Japanese or Russian)
  const showKeyboardButton = targetLang === "ja" || targetLang === "ru";

  /* ---------------------------
     Submits (backend judging for fill/mc/ma; deterministic for match)
  --------------------------- */
  async function submitFill() {
    if (!question || !input.trim()) return;
    playSound(submitActionSound);
    setLoadingG(true);

    // Clear previous explanation when attempting a new answer
    setExplanationText("");
    setCurrentQuestionData(null);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildFillJudgePrompt({
        targetLang,
        question,
        userAnswer: input,
        hint,
      }),
    });
    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 6 : 0; // ✅ normalized to 4-7 XP range

    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setLastOk(ok);
      setRecentXp(0);
      const nextFn =
        ok || isFinalQuiz
          ? modeLocked
            ? () => generateFill()
            : () => generateRandomRef.current()
          : null;
      setNextAction(() => nextFn);
      setLoadingG(false);
      return;
    }

    if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

    setLastOk(ok);
    setRecentXp(delta);

    // Store question data for explanation and note creation
    setCurrentQuestionData({
      question,
      userAnswer: input,
      correctAnswer: hint,
      questionType: "fill",
    });

    if (!ok) {
      setNextAction(null);
    } else {
      setExplanationText("");
      setInput("");
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "fill", question },
      ].slice(-5);
      const nextFn = modeLocked
        ? () => generateFill()
        : () => generateRandomRef.current();
      setNextAction(() => nextFn); // ✅ random unless user locked a type
    }

    setLoadingG(false);
  }

  async function submitMC() {
    if (!mcQ || !mcPick) return;
    playSound(submitActionSound);
    setLoadingMCG(true);

    // Clear previous explanation when attempting a new answer
    setExplanationText("");
    setCurrentQuestionData(null);

    const deterministicOk = mcAnswer && norm(mcPick) === norm(mcAnswer);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMCJudgePrompt({
        targetLang,
        stem: mcQ,
        choices: mcChoices,
        userChoice: mcPick,
        hint: mcHint,
      }),
    });

    const ok =
      deterministicOk ||
      (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 5 : 0; // ✅ normalized to 4-7 XP range

    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setMcResult(ok ? "correct" : "try_again");
      setLastOk(ok);
      setRecentXp(0);
      const nextFn =
        ok || isFinalQuiz
          ? modeLocked
            ? () => generateMC()
            : () => generateRandomRef.current()
          : null;
      setNextAction(() => nextFn);
      setLoadingMCG(false);
      return;
    }

    if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

    setMcResult(ok ? "correct" : "try_again"); // for logs only
    setLastOk(ok);
    setRecentXp(delta);

    // Store question data for explanation and note creation
    setCurrentQuestionData({
      question: mcQ,
      userAnswer: mcPick,
      correctAnswer: mcAnswer || mcHint,
      questionType: "mc",
    });
    if (ok) {
      setExplanationText("");
    }

    const nextFn = ok
      ? modeLocked
        ? () => generateMC()
        : () => generateRandomRef.current()
      : null;
    setNextAction(() => nextFn);

    setLoadingMCG(false);
  }

  async function submitMA() {
    if (!maQ || !maPicks.length) return;
    playSound(submitActionSound);
    setLoadingMAG(true);

    // Clear previous explanation when attempting a new answer
    setExplanationText("");
    setCurrentQuestionData(null);

    const answerSet = new Set((maAnswers || []).map((a) => norm(a)));
    const pickSet = new Set(maPicks.map((a) => norm(a)));
    const deterministicOk =
      answerSet.size > 0 &&
      answerSet.size === pickSet.size &&
      [...answerSet].every((a) => pickSet.has(a));

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMAJudgePrompt({
        targetLang,
        stem: maQ,
        choices: maChoices,
        userSelections: maPicks,
        hint: maHint,
      }),
    });

    const ok =
      deterministicOk ||
      (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 6 : 0; // ✅ normalized to 4-7 XP range

    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setMaResult(ok ? "correct" : "try_again");
      setLastOk(ok);
      setRecentXp(0);
      const nextFn =
        ok || isFinalQuiz
          ? modeLocked
            ? () => generateMA()
            : () => generateRandomRef.current()
          : null;
      setNextAction(() => nextFn);
      setLoadingMAG(false);
      return;
    }

    if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

    setMaResult(ok ? "correct" : "try_again"); // for logs only
    setLastOk(ok);
    setRecentXp(delta);

    // Store question data for explanation and note creation
    setCurrentQuestionData({
      question: maQ,
      userAnswer: maPicks.join(", "),
      correctAnswer: maAnswers?.join(", ") || maHint,
      questionType: "ma",
    });
    if (ok) {
      setExplanationText("");
    }

    const nextFn = ok
      ? modeLocked
        ? () => generateMA()
        : () => generateRandomRef.current()
      : null;
    setNextAction(() => nextFn);

    setLoadingMAG(false);
  }

  function canSubmitMatch() {
    return mLeft.length > 0 && mSlots.every((ri) => ri !== null);
  }

  // ✅ Deterministic judge for Match using the returned map
  async function submitMatch() {
    if (!canSubmitMatch()) return;
    playSound(submitActionSound);
    setLoadingMJ(true);

    // Clear previous explanation when attempting a new answer
    setExplanationText("");
    setCurrentQuestionData(null);

    const userPairs = mSlots.map((ri, li) => [li, ri]);

    let ok = false;
    if (mAnswerMap.length === mSlots.length) {
      ok = mSlots.every((ri, li) => ri === mAnswerMap[li]);
    } else {
      ok = false;
    }

    const delta = ok ? 6 : 0; // ✅ normalized to 4-7 XP range

    setMResult(ok ? "correct" : "try_again"); // for logs only

    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setLastOk(ok);
      setRecentXp(0);
      const nextFn =
        ok || isFinalQuiz
          ? modeLocked
            ? () => generateMatch()
            : () => generateRandomRef.current()
          : null;
      setNextAction(() => nextFn);
      setLoadingMJ(false);
      return;
    }

    if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

    setLastOk(ok);
    setRecentXp(delta);

    // Store question data for explanation and note creation
    const userMappings = userPairs
      .map(([li, ri]) => `${mLeft[li]} → ${mRight[ri]}`)
      .join(", ");
    setCurrentQuestionData({
      question: mStem || "Match the items:",
      userAnswer: userMappings,
      correctAnswer: mHint || "Check the correct pairings",
      questionType: "match",
    });
    if (ok) {
      setExplanationText("");
    }

    const nextFn = ok
      ? modeLocked
        ? () => generateMatch()
        : () => generateRandomRef.current()
      : null;
    setNextAction(() => nextFn);

    setLoadingMJ(false);
  }

  // Submit for Translate mode
  async function submitTranslate(userWords) {
    if (!tSentence || !userWords || userWords.length === 0) return;
    setLoadingTJ(true);

    // Clear previous explanation when attempting a new answer
    setExplanationText("");
    setCurrentQuestionData(null);

    // First check: exact match (normalized)
    const normalizedUser = userWords.map((w) => norm(w));
    const normalizedCorrect = tCorrectWords.map((w) => norm(w));
    let ok =
      normalizedUser.length === normalizedCorrect.length &&
      normalizedUser.every((w, i) => w === normalizedCorrect[i]);

    // If not exact match, use LLM judge for flexible matching
    if (!ok) {
      // Determine source and answer languages based on direction
      const supportCode = resolveSupportLang(supportLang, userLanguage);
      const isTargetToSupport = tDirection === "target-to-support";
      const sourceLang = isTargetToSupport ? targetLang : supportCode;
      const answerLang = isTargetToSupport ? supportCode : targetLang;

      const judgePrompt = buildTranslateJudgePrompt({
        sourceLang,
        answerLang,
        sentence: tSentence,
        correctWords: tCorrectWords,
        userWords,
      });

      try {
        const verdictRaw = await callResponses({
          model: MODEL,
          input: judgePrompt,
        });
        ok = /yes/i.test((verdictRaw || "").trim().split(/\s+/)[0]);
      } catch {
        ok = false;
      }
    }

    const delta = ok ? 6 : 0;

    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setLastOk(ok);
      setRecentXp(0);
      const nextFn =
        ok || isFinalQuiz
          ? modeLocked
            ? () => generateTranslate()
            : () => generateRandomRef.current()
          : null;
      setNextAction(() => nextFn);
      setLoadingTJ(false);
      return;
    }

    if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

    setLastOk(ok);
    setRecentXp(delta);

    // Store question data for explanation and note creation
    setCurrentQuestionData({
      question: tSentence,
      userAnswer: userWords.join(" "),
      correctAnswer: tCorrectWords.join(" "),
      questionType: "translate",
    });
    if (ok) {
      setExplanationText("");
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "translate", question: tSentence },
      ].slice(-5);
    }

    const nextFn = ok
      ? modeLocked
        ? () => generateTranslate()
        : () => generateRandomRef.current()
      : null;
    setNextAction(() => nextFn);

    setLoadingTJ(false);
  }

  const handleSpeakEvaluation = useCallback(
    async ({
      evaluation,
      recognizedText = "",
      confidence = 0,
      audioMetrics = null,
      method = "",
      error = null,
    }) => {
      if (!sTarget) return;
      if (error) {
        toast({
          title:
            userLanguage === "es" ? "No se pudo evaluar" : "Could not evaluate",
          description:
            userLanguage === "es"
              ? "Revisa permisos de micrófono e inténtalo otra vez."
              : "Check microphone permissions and try again.",
          status: "error",
          duration: 2600,
        });
        return;
      }
      if (!evaluation) return;

      // Clear previous explanation when attempting a new answer
      setExplanationText("");
      setCurrentQuestionData(null);

      setSRecognized(recognizedText || "");
      setSEval(evaluation);

      const ok = evaluation.pass;
      const delta = ok ? 6 : 0; // ✅ normalized to 4-7 XP range

      if (isFinalQuiz) {
        handleQuizAnswer(ok);
        setLastOk(ok);
        setRecentXp(0);
        const nextFn =
          ok || isFinalQuiz
            ? modeLocked
              ? () => generateSpeak()
              : () => generateRandomRef.current()
            : null;
        setNextAction(() => nextFn);
        return;
      }

      if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

      setLastOk(ok);
      setRecentXp(delta);

      // Store question data for explanation and note creation
      setCurrentQuestionData({
        question: sPrompt || sTarget,
        userAnswer: recognizedText || "",
        correctAnswer: sTarget,
        questionType: "speak",
      });
      if (ok) {
        setExplanationText("");
      }

      const nextFn = ok
        ? modeLocked
          ? () => generateSpeak()
          : () => generateRandomRef.current()
        : null;
      setNextAction(() => nextFn);

      if (ok) {
        recentCorrectRef.current = [
          ...recentCorrectRef.current,
          { mode: "speak", question: sTarget },
        ].slice(-5);
      } else {
        const tips = speechReasonTips(evaluation.reasons, {
          uiLang: userLanguage,
          targetLabel: targetName,
        });
        const retryTitle =
          t("grammar_speak_retry_title") ||
          (userLanguage === "es" ? "Intenta de nuevo" : "Try again");
        toast({
          title: retryTitle,
          description: tips.join(" "),
          status: "warning",
          duration: 3600,
        });
      }
    },
    [
      modeLocked,
      npub,
      sHint,
      sPrompt,
      sTarget,
      sTranslation,
      t,
      targetName,
      toast,
      userLanguage,
    ]
  );

  const {
    startRecording: startSpeakRecording,
    stopRecording: stopSpeakRecording,
    isRecording: isSpeakRecording,
    supportsSpeech: supportsSpeak,
  } = useSpeechPractice({
    targetText: sTarget,
    targetLang,
    onResult: handleSpeakEvaluation,
    timeoutMs: pauseMs,
  });

  /* ---------------------------
     Drag & Drop handlers (Match)
  --------------------------- */
  function onDragEnd(result) {
    if (!result?.destination) return;
    const { source, destination, draggableId } = result;
    const ri = parseInt(draggableId.replace("r-", ""), 10);
    if (Number.isNaN(ri)) return;

    // To bank
    if (destination.droppableId === "bank") {
      const nextSlots = mSlots.map((a) => (a === ri ? null : a));
      const filtered = mBank.filter((x) => x !== ri);
      filtered.splice(destination.index, 0, ri);
      setMSlots(nextSlots);
      setMBank(filtered);
      return;
    }

    // To a slot
    if (destination.droppableId.startsWith("slot-")) {
      const dest = parseInt(destination.droppableId.replace("slot-", ""), 10);
      if (Number.isNaN(dest)) return;

      // From bank -> slot
      if (source.droppableId === "bank") {
        const filtered = mBank.filter((x) => x !== ri);
        const prevInSlot = mSlots[dest];
        const nextSlots = [...mSlots];
        nextSlots[dest] = ri;
        setMSlots(nextSlots);
        if (prevInSlot !== null) setMBank([...filtered, prevInSlot]);
        else setMBank(filtered);
        return;
      }

      // From slot -> slot (swap items)
      if (source.droppableId.startsWith("slot-")) {
        const src = parseInt(source.droppableId.replace("slot-", ""), 10);
        if (Number.isNaN(src) || src === dest) return;
        const nextSlots = [...mSlots];
        const prevDest = nextSlots[dest];
        nextSlots[dest] = ri;
        // Swap: put displaced item in source slot instead of bank
        nextSlots[src] = prevDest;
        setMSlots(nextSlots);
      }
    }
  }

  function handleMatchAutoMove(ri, sourceId) {
    if (typeof ri !== "number" || Number.isNaN(ri)) return;
    const draggableId = `r-${ri}`;

    if (sourceId === "bank") {
      const sourceIndex = mBank.indexOf(ri);
      if (sourceIndex === -1) return;
      const targetSlot = mSlots.indexOf(null);
      if (targetSlot === -1) return;
      onDragEnd({
        draggableId,
        source: { droppableId: "bank", index: sourceIndex },
        destination: { droppableId: `slot-${targetSlot}`, index: 0 },
      });
      return;
    }

    if (sourceId?.startsWith("slot-")) {
      const slotIndex = parseInt(sourceId.replace("slot-", ""), 10);
      if (Number.isNaN(slotIndex)) return;
      onDragEnd({
        draggableId,
        source: { droppableId: `slot-${slotIndex}`, index: 0 },
        destination: { droppableId: "bank", index: mBank.length },
      });
    }
  }

  const sendMatchHelp = useCallback(() => {
    if (isLoadingAssistantSupport || assistantSupportText) return;
    const isSpanishUI = userLanguage === "es";
    const promptLines = [
      isSpanishUI
        ? "Ejercicio de emparejar palabras. Responde emparejando cada elemento de la columna izquierda con la opción correcta del banco de palabras."
        : "Match the words exercise. Respond by pairing each left item with the correct option from the word bank.",
      mStem
        ? isSpanishUI
          ? `Indicador o consigna: ${mStem}`
          : `Prompt: ${mStem}`
        : null,
      mLeft.length
        ? isSpanishUI
          ? `Columna izquierda: ${mLeft.join(" | ")}`
          : `Left column: ${mLeft.join(" | ")}`
        : null,
      mRight.length
        ? isSpanishUI
          ? `Banco de palabras: ${mRight.join(" | ")}`
          : `Word bank: ${mRight.join(" | ")}`
        : null,
      mHint ? (isSpanishUI ? `Pista: ${mHint}` : `Hint: ${mHint}`) : null,
    ].filter(Boolean);
    handleAskAssistant(promptLines.join("\n"));
  }, [mHint, mLeft, mRight, mStem, isLoadingAssistantSupport, assistantSupportText, userLanguage]);

  const showTRFill =
    showTranslations &&
    translation &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRMC =
    showTranslations &&
    mcTranslation &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRMA =
    showTranslations &&
    maTranslation &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRSpeak =
    showTranslations &&
    sTranslation &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);

  // Single copy button (left of question) - now triggers inline assistant
  const CopyAllBtn = ({ q, h, tr }) => {
    const has = (q && q.trim()) || (h && h.trim()) || (tr && tr.trim());
    if (!has) return null;
    return (
      <IconButton
        aria-label={userLanguage === "es" ? "Pedir ayuda" : "Ask the assistant"}
        icon={isLoadingAssistantSupport ? <Spinner size="xs" /> : <MdOutlineSupportAgent />}
        size="sm"
        fontSize="lg"
        rounded="xl"
        bg="white"
        color="blue"
        boxShadow="0 4px 0 blue"
        onClick={() => copyAll(q, h, tr)}
        isDisabled={isLoadingAssistantSupport || !!assistantSupportText}
        mr={1}
      />
    );
  };

  // Assistant support response box (blue theme)
  const AssistantSupportBox = () => {
    if (!assistantSupportText && !isLoadingAssistantSupport) return null;
    return (
      <Box
        p={4}
        borderRadius="lg"
        bg="rgba(66, 153, 225, 0.1)"
        borderWidth="1px"
        borderColor="blue.400"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
        mt={4}
      >
        <HStack spacing={2} mb={2}>
          <MdOutlineSupportAgent color="var(--chakra-colors-blue-400)" />
          <Text fontWeight="semibold" color="blue.300">
            {userLanguage === "es" ? "Asistente" : "Assistant"}
          </Text>
          {isLoadingAssistantSupport && <Spinner size="xs" color="blue.400" />}
        </HStack>
        <Box
          fontSize="md"
          color="whiteAlpha.900"
          lineHeight="1.6"
          sx={{
            "& p": { mb: 2 },
            "& p:last-child": { mb: 0 },
            "& strong": { fontWeight: "bold", color: "blue.200" },
            "& em": { fontStyle: "italic" },
            "& ul, & ol": { pl: 4, mb: 2 },
            "& li": { mb: 1 },
            "& code": {
              bg: "rgba(0,0,0,0.3)",
              px: 1,
              py: 0.5,
              borderRadius: "sm",
              fontFamily: "mono",
            },
          }}
        >
          <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
        </Box>
      </Box>
    );
  };

  const dragPlaceholderLabel =
    t("practice_drag_drop_slot_placeholder") ||
    (userLanguage === "es"
      ? "Suelta la respuesta aquí"
      : "Drop the answer here");
  const skipLabel =
    t("practice_skip_question") || (userLanguage === "es" ? "Saltar" : "Skip");
  const canSkip = !isFinalQuiz && !quizCompleted;
  const questionListenLabel =
    userLanguage === "es" ? "Escuchar pregunta" : "Listen to question";
  const speakListenLabel =
    userLanguage === "es" ? "Escuchar ejemplo" : "Listen to example";
  const speakVariantLabel =
    t("grammar_btn_speak") || (userLanguage === "es" ? "Pronunciar" : "Speak");
  const nextQuestionLabel = t("practice_next_question") || "Next question";
  const synthLabel =
    t("tts_synthesizing") ||
    (userLanguage === "es" ? "Sintetizando..." : "Synthesizing...");
  const isQuestionBusy = isQuestionPlaying || isQuestionSynthesizing;

  const handleToggleSpeakPlayback = useCallback(async () => {
    const text = (sTarget || "").trim();
    if (!text) return;

    if (isSpeakPlaying && speakAudioRef.current) {
      try {
        speakAudioRef.current.pause();
      } catch {}
      speakAudioRef.current = null;
      setIsSpeakPlaying(false);
      setIsSpeakSynthesizing(false);
      return;
    }

    try {
      setIsSpeakSynthesizing(true);
      setIsSpeakPlaying(true);
      try {
        speakAudioRef.current?.pause?.();
      } catch {}
      speakAudioRef.current = null;
      if (speakAudioUrlRef.current) {
        try {
          URL.revokeObjectURL(speakAudioUrlRef.current);
        } catch {}
        speakAudioUrlRef.current = null;
      }

      const player = await getTTSPlayer({
        text,
        responseFormat: LOW_LATENCY_TTS_FORMAT,
      });
      speakAudioUrlRef.current = player.audioUrl;

      const audio = player.audio;
      speakAudioRef.current = audio;
      audio.onended = () => {
        setIsSpeakPlaying(false);
        speakAudioRef.current = null;
        player.cleanup?.();
      };
      audio.onerror = () => {
        setIsSpeakPlaying(false);
        speakAudioRef.current = null;
        player.cleanup?.();
      };
      await player.ready;
      setIsSpeakSynthesizing(false);
      await audio.play();
    } catch (err) {
      console.error("Grammar speak playback failed", err);
      setIsSpeakSynthesizing(false);
      setIsSpeakPlaying(false);
      speakAudioRef.current = null;
    }
  }, [isSpeakPlaying, sTarget, toast, userLanguage]);

  const handlePlayQuestionTTS = useCallback(
    async (text, langOverride = null) => {
      const ttsText = (text || "").trim().replace(/___/g, " … ");
      if (!ttsText) return;

      if (isQuestionPlaying && questionTextRef.current === ttsText) {
        try {
          questionAudioRef.current?.pause?.();
        } catch {}
        questionAudioRef.current = null;
        setIsQuestionPlaying(false);
        setIsQuestionSynthesizing(false);
        return;
      }

      try {
        setIsQuestionSynthesizing(true);
        questionTextRef.current = ttsText;

        try {
          questionAudioRef.current?.pause?.();
        } catch {}
        questionAudioRef.current = null;
        if (questionAudioUrlRef.current) {
          try {
            URL.revokeObjectURL(questionAudioUrlRef.current);
          } catch {}
          questionAudioUrlRef.current = null;
        }

        const lang = langOverride || targetLang;
        const player = await getTTSPlayer({
          text: ttsText,
          langTag: TTS_LANG_TAG[lang] || TTS_LANG_TAG.es,
          responseFormat: LOW_LATENCY_TTS_FORMAT,
        });

        questionAudioUrlRef.current = player.audioUrl;
        const audio = player.audio;
        questionAudioRef.current = audio;
        audio.onended = () => {
          setIsQuestionPlaying(false);
          questionAudioRef.current = null;
          player.cleanup?.();
        };
        audio.onerror = () => {
          setIsQuestionPlaying(false);
          questionAudioRef.current = null;
          player.cleanup?.();
        };
        await player.ready;
        setIsQuestionSynthesizing(false);
        setIsQuestionPlaying(true);
        await audio.play();
      } catch (err) {
        console.error("Grammar question playback failed", err);
        setIsQuestionSynthesizing(false);
        setIsQuestionPlaying(false);
      }
    },
    [isQuestionPlaying, targetLang, toast, userLanguage]
  );

  // Handler for playing TTS on individual match words
  const handlePlayMatchWordTTS = useCallback(
    async (text, index) => {
      const ttsText = (text || "").trim();
      if (!ttsText) return;

      // Stop current playback if clicking the same word
      if (matchWordSynthesizing === index) {
        try {
          matchWordAudioRef.current?.pause?.();
        } catch {}
        matchWordAudioRef.current = null;
        setMatchWordSynthesizing(null);
        return;
      }

      try {
        setMatchWordSynthesizing(index);

        // Stop any existing playback
        try {
          matchWordAudioRef.current?.pause?.();
        } catch {}
        matchWordAudioRef.current = null;

        const player = await getTTSPlayer({
          text: ttsText,
          langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
          responseFormat: LOW_LATENCY_TTS_FORMAT,
        });

        const audio = player.audio;
        matchWordAudioRef.current = audio;
        audio.onended = () => {
          setMatchWordSynthesizing(null);
          matchWordAudioRef.current = null;
          player.cleanup?.();
        };
        audio.onerror = () => {
          setMatchWordSynthesizing(null);
          matchWordAudioRef.current = null;
          player.cleanup?.();
        };
        await player.ready;
        await audio.play();
      } catch (err) {
        console.error("Match word playback failed", err);
        setMatchWordSynthesizing(null);
      }
    },
    [matchWordSynthesizing, targetLang]
  );

  const renderMcPrompt = () => {
    if (!mcQ) return null;
    const segments = String(mcQ).split("___");
    if (segments.length === 1) {
      return mcQ;
    }
    let blankPlaced = false;
    const nodes = [];
    segments.forEach((segment, idx) => {
      nodes.push(
        <React.Fragment key={`grammar-mc-segment-${idx}`}>
          {segment}
        </React.Fragment>
      );
      if (idx < segments.length - 1) {
        if (blankPlaced) {
          nodes.push(
            <React.Fragment key={`grammar-mc-gap-${idx}`}>___</React.Fragment>
          );
          return;
        }
        blankPlaced = true;
        nodes.push(
          <Droppable
            droppableId="mc-slot"
            direction="horizontal"
            key={`grammar-mc-blank-${idx}`}
          >
            {(provided, snapshot) => (
              <Box
                as="span"
                ref={provided.innerRef}
                {...provided.droppableProps}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                minW="72px"
                minH="32px"
                px={2}
                py={1}
                mx={1}
                borderRadius="md"
                borderBottomWidth="2px"
                borderBottomColor={
                  snapshot.isDraggingOver
                    ? "purple.300"
                    : "rgba(255,255,255,0.6)"
                }
                bg={
                  snapshot.isDraggingOver
                    ? "rgba(128,90,213,0.18)"
                    : "rgba(255,255,255,0.08)"
                }
                transition="all 0.2s ease"
              >
                {mcSlotIndex != null ? (
                  <Draggable draggableId={`mc-${mcSlotIndex}`} index={0}>
                    {(dragProvided, snapshot) => (
                      <Box
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={{
                          cursor: "grab",
                          ...(dragProvided.draggableProps.style || {}),
                        }}
                        px={3}
                        py={2}
                        rounded="md"
                        borderWidth="1px"
                        borderColor={
                          snapshot.isDragging
                            ? "purple.300"
                            : "rgba(255,255,255,0.22)"
                        }
                        bg={
                          snapshot.isDragging
                            ? "rgba(128,90,213,0.24)"
                            : "purple.600"
                        }
                        color="white"
                        fontSize="sm"
                      >
                        {mcChoices[mcSlotIndex]}
                      </Box>
                    )}
                  </Draggable>
                ) : (
                  <Text as="span" fontSize="sm" opacity={0.7}>
                    {dragPlaceholderLabel}
                  </Text>
                )}
                <Box as="span" display="none">
                  {provided.placeholder}
                </Box>
              </Box>
            )}
          </Droppable>
        );
      }
    });
    return nodes;
  };

  const renderMaPrompt = () => {
    if (!maQ) return null;
    const segments = String(maQ).split("___");
    if (segments.length === 1) {
      return maQ;
    }
    let slotNumber = 0;
    const nodes = [];
    segments.forEach((segment, idx) => {
      nodes.push(
        <React.Fragment key={`grammar-ma-segment-${idx}`}>
          {segment}
        </React.Fragment>
      );
      if (idx < segments.length - 1) {
        const currentSlot = slotNumber;
        slotNumber += 1;
        if (currentSlot >= maSlots.length) {
          nodes.push(
            <React.Fragment key={`grammar-ma-gap-${idx}`}>___</React.Fragment>
          );
          return;
        }
        const choiceIdx = maSlots[currentSlot];
        nodes.push(
          <Droppable
            droppableId={`ma-slot-${currentSlot}`}
            direction="horizontal"
            key={`grammar-ma-blank-${currentSlot}`}
          >
            {(provided, snapshot) => (
              <Box
                as="span"
                ref={provided.innerRef}
                {...provided.droppableProps}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                minW="72px"
                minH="32px"
                px={2}
                py={1}
                mx={1}
                borderRadius="md"
                borderBottomWidth="2px"
                borderBottomColor={
                  snapshot.isDraggingOver
                    ? "purple.300"
                    : "rgba(255,255,255,0.6)"
                }
                bg={
                  snapshot.isDraggingOver
                    ? "rgba(128,90,213,0.18)"
                    : "rgba(255,255,255,0.08)"
                }
                transition="all 0.2s ease"
              >
                {choiceIdx != null ? (
                  <Draggable draggableId={`ma-${choiceIdx}`} index={0}>
                    {(dragProvided, snapshot) => (
                      <Box
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={{
                          cursor: "grab",
                          ...(dragProvided.draggableProps.style || {}),
                        }}
                        px={3}
                        py={2}
                        rounded="md"
                        borderWidth="1px"
                        borderColor={
                          snapshot.isDragging
                            ? "purple.300"
                            : "rgba(255,255,255,0.22)"
                        }
                        bg={
                          snapshot.isDragging
                            ? "rgba(128,90,213,0.24)"
                            : "purple.600"
                        }
                        color="white"
                        fontSize="sm"
                      >
                        {maChoices[choiceIdx]}
                      </Box>
                    )}
                  </Draggable>
                ) : (
                  <Text as="span" fontSize="sm" opacity={0.7}>
                    {dragPlaceholderLabel}
                  </Text>
                )}
                <Box as="span" display="none">
                  {provided.placeholder}
                </Box>
              </Box>
            )}
          </Droppable>
        );
      }
    });
    return nodes;
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch" maxW="720px" mx="auto">
        {/* Shared progress header */}
        <Box display={"flex"} justifyContent={"center"}>
          <Box w="50%" justifyContent={"center"}>
            {isFinalQuiz ? (
              // Quiz progress display with animated bars
              <VStack spacing={2}>
                <HStack justify="space-between" w="100%" mb={1}>
                  <Badge colorScheme="purple" fontSize="md">
                    {userLanguage === "es" ? "Prueba Final" : "Final Quiz"}
                  </Badge>
                  <Badge
                    colorScheme={
                      quizCorrectAnswers >= quizConfig.passingScore
                        ? "green"
                        : "yellow"
                    }
                    fontSize="md"
                  >
                    {quizQuestionsAnswered}/{quizConfig.questionsRequired}
                  </Badge>
                </HStack>

                {/* Animated progress bar showing correct (blue) and wrong (red) answers */}
                <HStack spacing="2px" w="100%" h="16px">
                  {Array.from({ length: quizConfig.questionsRequired }).map(
                    (_, i) => {
                      const hasAnswer = i < quizAnswerHistory.length;
                      const isCorrect = hasAnswer ? quizAnswerHistory[i] : null;

                      return (
                        <Box
                          key={i}
                          flex="1"
                          h="100%"
                          bg={
                            !hasAnswer
                              ? "gray.700"
                              : isCorrect
                              ? "blue.400"
                              : "red.400"
                          }
                          borderRadius="sm"
                          position="relative"
                          overflow="hidden"
                          opacity={hasAnswer ? 1 : 0.5}
                          transition="all 0.3s ease-out"
                          sx={
                            hasAnswer
                              ? {
                                  animation: `${
                                    isCorrect
                                      ? "slideFromRight"
                                      : "slideFromLeft"
                                  } 0.4s ease-out`,
                                  "@keyframes slideFromRight": {
                                    "0%": {
                                      transform: "translateX(100%)",
                                      opacity: 0,
                                    },
                                    "100%": {
                                      transform: "translateX(0)",
                                      opacity: 1,
                                    },
                                  },
                                  "@keyframes slideFromLeft": {
                                    "0%": {
                                      transform: "translateX(-100%)",
                                      opacity: 0,
                                    },
                                    "100%": {
                                      transform: "translateX(0)",
                                      opacity: 1,
                                    },
                                  },
                                }
                              : {}
                          }
                        />
                      );
                    }
                  )}
                </HStack>

                <Text fontSize="xs" color="gray.400" textAlign="center">
                  {userLanguage === "es"
                    ? `${quizCorrectAnswers} correctas • Necesitas ${quizConfig.passingScore} para aprobar`
                    : `${quizCorrectAnswers} correct • Need ${quizConfig.passingScore} to pass`}
                </Text>
              </VStack>
            ) : (
              // Normal XP progress display
              <>
                <HStack justify="space-between" mb={1}>
                  <Badge variant="subtle">
                    {t("grammar_badge_level", { level: levelNumber })}
                  </Badge>
                  <Badge variant="subtle">
                    {t("grammar_badge_xp", { xp })}
                  </Badge>
                </HStack>
                <WaveBar value={progressPct} />
              </>
            )}
          </Box>
        </Box>

        {/* ---- Fill UI ---- */}
        {mode === "fill" && (question || loadingQ) ? (
          <VStack align="stretch" spacing={4}>
            <Text fontSize="xl" fontWeight="bold" color="white">
              {userLanguage === "es"
                ? "Completa el espacio"
                : "Fill in the blank"}
            </Text>
            <Box
              bg="rgba(255, 255, 255, 0.02)"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              p={5}
            >
              <VStack align="stretch" spacing={3}>
                <HStack align="start" spacing={2}>
                  <CopyAllBtn
                    q={question}
                    h={hint}
                    tr={showTRFill ? translation : ""}
                  />
                  <IconButton
                    aria-label={questionListenLabel}
                    icon={renderSpeakerIcon(isQuestionSynthesizing)}
                    size="sm"
                    fontSize="lg"
                    variant="ghost"
                    onClick={() => handlePlayQuestionTTS(question)}
                    mr={1}
                  />
                  <Text
                    fontSize="lg"
                    fontWeight="medium"
                    flex="1"
                    lineHeight="tall"
                  >
                    {question || (loadingQ ? "…" : "")}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            <AssistantSupportBox />

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("grammar_input_placeholder_answer")}
              isDisabled={loadingG}
              fontSize="16px"
            />

            {showKeyboard && showKeyboardButton && (
              <VirtualKeyboard
                lang={targetLang}
                onKeyPress={handleKeyboardInput}
                onClose={() => setShowKeyboard(false)}
                userLanguage={userLanguage}
              />
            )}

            <Stack
              direction="row"
              spacing={3}
              align="center"
              justify="flex-end"
            >
              {showKeyboardButton && (
                <Button
                  variant="ghost"
                  leftIcon={<MdKeyboard />}
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  isDisabled={loadingQ || loadingG}
                  px={{ base: 4, md: 6 }}
                  py={{ base: 3, md: 4 }}
                >
                  {showKeyboard
                    ? userLanguage === "es"
                      ? "Cerrar teclado"
                      : "Close keyboard"
                    : userLanguage === "es"
                    ? "Abrir teclado"
                    : "Open keyboard"}
                </Button>
              )}
              {canSkip && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  isDisabled={loadingQ || loadingG}
                  px={{ base: 6, md: 10 }}
                  py={{ base: 3, md: 4 }}
                >
                  {skipLabel}
                </Button>
              )}
              <Button
                colorScheme="purple"
                onClick={submitFill}
                isDisabled={
                  lastOk === true ||
                  loadingG ||
                  !input.trim() ||
                  !question ||
                  (isFinalQuiz && quizCurrentQuestionAttempted)
                }
                px={{ base: 7, md: 12 }}
                py={{ base: 3, md: 4 }}
              >
                {loadingG ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
            </Stack>

            <FeedbackRail
              ok={lastOk}
              xp={recentXp}
              showNext={
                (lastOk === true || (isFinalQuiz && lastOk === false)) &&
                nextAction
              }
              onNext={handleNext}
              nextLabel={nextQuestionLabel}
              t={t}
              userLanguage={userLanguage}
              onExplainAnswer={handleExplainAnswer}
              explanationText={explanationText}
              isLoadingExplanation={isLoadingExplanation}
              lessonProgress={lessonProgress}
              onCreateNote={handleCreateNote}
              isCreatingNote={isCreatingNote}
              noteCreated={noteCreated}
            />
          </VStack>
        ) : null}

        {/* ---- MC UI ---- */}
        {mode === "mc" && (mcQ || loadingMCQ) ? (
          <>
            <Text fontSize="xl" fontWeight="bold" color="white" mb={2}>
              {userLanguage === "es"
                ? "Elige la respuesta correcta"
                : "Choose the correct answer"}
            </Text>
            {mcLayout === "drag" ? (
              <DragDropContext onDragEnd={handleMcDragEnd}>
                <VStack align="stretch" spacing={3}>
                  <Box
                    bg="rgba(255, 255, 255, 0.02)"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="whiteAlpha.100"
                    p={5}
                  >
                    <VStack align="stretch" spacing={3}>
                      <HStack align="start" spacing={2}>
                        <CopyAllBtn
                          q={mcQ}
                          h={mcHint}
                          tr={showTRMC ? mcTranslation : ""}
                        />
                        <IconButton
                          aria-label={questionListenLabel}
                          icon={renderSpeakerIcon(isQuestionSynthesizing)}
                          size="sm"
                          fontSize="lg"
                          variant="ghost"
                          onClick={() => handlePlayQuestionTTS(mcQ)}
                          mr={1}
                        />
                        <Text
                          fontSize="lg"
                          fontWeight="medium"
                          flex="1"
                          lineHeight="tall"
                        >
                          {renderMcPrompt() || (loadingMCQ ? "…" : "")}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                  <Droppable droppableId="mc-bank" direction="horizontal">
                    {(provided) => (
                      <Flex
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        align="stretch"
                        wrap="wrap"
                        gap={3}
                        w="full"
                      >
                        {mcBankOrder.map((idx, position) => (
                          <Draggable
                            draggableId={`mc-${idx}`}
                            index={position}
                            key={`grammar-mc-bank-${idx}`}
                          >
                            {(dragProvided, snapshot) => (
                              <Box
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{
                                  cursor: "pointer",
                                  ...(dragProvided.draggableProps.style || {}),
                                }}
                                px={3}
                                py={2}
                                rounded="md"
                                borderWidth="1px"
                                borderColor={
                                  snapshot.isDragging
                                    ? "purple.300"
                                    : "rgba(255,255,255,0.22)"
                                }
                                bg={
                                  snapshot.isDragging
                                    ? "rgba(128,90,213,0.16)"
                                    : "transparent"
                                }
                                fontSize="sm"
                                textAlign="left"
                                onClick={() =>
                                  handleMcAnswerClick(idx, position)
                                }
                                _hover={{
                                  bg: "rgba(128,90,213,0.12)",
                                  borderColor: "purple.200",
                                }}
                                transition="all 0.15s ease"
                              >
                                {mcChoices[idx]}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Flex>
                    )}
                  </Droppable>
                </VStack>
              </DragDropContext>
            ) : (
              <>
                <Box
                  bg="rgba(255, 255, 255, 0.02)"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="whiteAlpha.100"
                  p={5}
                  mb={3}
                >
                  <VStack align="stretch" spacing={3}>
                    <HStack align="start" spacing={2}>
                      <CopyAllBtn
                        q={mcQ}
                        h={mcHint}
                        tr={showTRMC ? mcTranslation : ""}
                      />
                      <IconButton
                        aria-label={questionListenLabel}
                        icon={renderSpeakerIcon(isQuestionSynthesizing)}
                        size="sm"
                        fontSize="lg"
                        variant="ghost"
                        onClick={() => handlePlayQuestionTTS(mcQ)}
                        mr={1}
                      />
                      <Text
                        fontSize="lg"
                        fontWeight="medium"
                        flex="1"
                        lineHeight="tall"
                      >
                        {mcQ || (loadingMCQ ? "…" : "")}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
                <Stack spacing={3} align="stretch">
                  {(mcChoices.length
                    ? mcChoices
                    : loadingMCQ
                    ? ["…", "…", "…", "…"]
                    : []
                  ).map((c, i) => (
                    <Box
                      key={i}
                      onClick={() => {
                        if (!mcChoices.length) return;
                        playSound(selectSound);
                        setMcPick(c);
                      }}
                      cursor={mcChoices.length ? "pointer" : "not-allowed"}
                      px={4}
                      py={3}
                      rounded="lg"
                      borderWidth="2px"
                      borderColor={
                        mcPick === c ? "purple.400" : "rgba(255,255,255,0.15)"
                      }
                      bg={
                        mcPick === c
                          ? "linear-gradient(135deg, rgba(128,90,213,0.25) 0%, rgba(159,122,234,0.15) 100%)"
                          : "rgba(255,255,255,0.03)"
                      }
                      transition="all 0.2s ease"
                      _hover={
                        mcChoices.length
                          ? {
                              borderColor:
                                mcPick === c
                                  ? "purple.300"
                                  : "rgba(255,255,255,0.3)",
                              bg:
                                mcPick === c
                                  ? "linear-gradient(135deg, rgba(128,90,213,0.3) 0%, rgba(159,122,234,0.2) 100%)"
                                  : "rgba(255,255,255,0.06)",
                              transform: "translateY(-2px)",
                              shadow: "md",
                            }
                          : {}
                      }
                      position="relative"
                      opacity={mcChoices.length ? 1 : 0.5}
                    >
                      <HStack spacing={3}>
                        <Box
                          w="20px"
                          h="20px"
                          rounded="full"
                          borderWidth="2px"
                          borderColor={
                            mcPick === c
                              ? "purple.400"
                              : "rgba(255,255,255,0.3)"
                          }
                          bg={mcPick === c ? "purple.500" : "transparent"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          transition="all 0.2s ease"
                          flexShrink={0}
                        >
                          {mcPick === c && (
                            <Box w="8px" h="8px" rounded="full" bg="white" />
                          )}
                        </Box>
                        <Text flex="1" fontSize="md">
                          {c}
                        </Text>
                      </HStack>
                    </Box>
                  ))}
                </Stack>
              </>
            )}

            <AssistantSupportBox />

            <Stack
              direction="row"
              spacing={3}
              align="center"
              justify="flex-end"
            >
              {canSkip && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  isDisabled={loadingMCQ || loadingMCG}
                  px={{ base: 6, md: 10 }}
                  py={{ base: 3, md: 4 }}
                >
                  {skipLabel}
                </Button>
              )}
              <Button
                colorScheme="purple"
                onClick={submitMC}
                isDisabled={
                  lastOk === true ||
                  loadingMCG ||
                  !mcPick ||
                  !mcChoices.length ||
                  (isFinalQuiz && quizCurrentQuestionAttempted)
                }
                px={{ base: 7, md: 12 }}
                py={{ base: 3, md: 4 }}
              >
                {loadingMCG ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
            </Stack>

            <FeedbackRail
              ok={lastOk}
              xp={recentXp}
              showNext={
                (lastOk === true || (isFinalQuiz && lastOk === false)) &&
                nextAction
              }
              onNext={handleNext}
              nextLabel={nextQuestionLabel}
              t={t}
              userLanguage={userLanguage}
              onExplainAnswer={handleExplainAnswer}
              explanationText={explanationText}
              isLoadingExplanation={isLoadingExplanation}
              lessonProgress={lessonProgress}
              onCreateNote={handleCreateNote}
              isCreatingNote={isCreatingNote}
              noteCreated={noteCreated}
            />
          </>
        ) : null}
        {/* ---- MA UI ---- */}
        {mode === "ma" && (maQ || loadingMAQ) ? (
          <>
            <Text fontSize="xl" fontWeight="bold" color="white" mb={2}>
              {userLanguage === "es"
                ? "Selecciona todas las respuestas correctas"
                : "Select all correct answers"}
            </Text>
            {maLayout === "drag" ? (
              <DragDropContext onDragEnd={handleMaDragEnd}>
                <VStack align="stretch" spacing={3}>
                  <Box
                    bg="rgba(255, 255, 255, 0.02)"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="whiteAlpha.100"
                    p={5}
                  >
                    <VStack align="stretch" spacing={3}>
                      <HStack align="start" spacing={2}>
                        <CopyAllBtn
                          q={maQ}
                          h={maHint}
                          tr={showTRMA ? maTranslation : ""}
                        />
                        <IconButton
                          aria-label={questionListenLabel}
                          icon={renderSpeakerIcon(isQuestionSynthesizing)}
                          size="sm"
                          fontSize="lg"
                          variant="ghost"
                          onClick={() => handlePlayQuestionTTS(maQ)}
                          mr={1}
                        />
                        <Text
                          fontSize="lg"
                          fontWeight="medium"
                          flex="1"
                          lineHeight="tall"
                        >
                          {renderMaPrompt() || (loadingMAQ ? "…" : "")}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                  <Droppable droppableId="ma-bank" direction="horizontal">
                    {(provided) => (
                      <Flex
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        align="stretch"
                        wrap="wrap"
                        gap={3}
                        w="full"
                      >
                        {maBankOrder.map((idx, position) => (
                          <Draggable
                            draggableId={`ma-${idx}`}
                            index={position}
                            key={`grammar-ma-bank-${idx}`}
                          >
                            {(dragProvided, snapshot) => (
                              <Box
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{
                                  cursor: "pointer",
                                  ...(dragProvided.draggableProps.style || {}),
                                }}
                                px={3}
                                py={2}
                                rounded="md"
                                borderWidth="1px"
                                borderColor={
                                  snapshot.isDragging
                                    ? "purple.300"
                                    : "rgba(255,255,255,0.22)"
                                }
                                bg={
                                  snapshot.isDragging
                                    ? "rgba(128,90,213,0.16)"
                                    : "transparent"
                                }
                                fontSize="sm"
                                textAlign="left"
                                onClick={() =>
                                  handleMaAnswerClick(idx, position)
                                }
                                _hover={{
                                  bg: "rgba(128,90,213,0.12)",
                                  borderColor: "purple.200",
                                }}
                                transition="all 0.15s ease"
                              >
                                {maChoices[idx]}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Flex>
                    )}
                  </Droppable>
                </VStack>
              </DragDropContext>
            ) : (
              <>
                <Box
                  bg="rgba(255, 255, 255, 0.02)"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="whiteAlpha.100"
                  p={5}
                  mb={3}
                >
                  <VStack align="stretch" spacing={3}>
                    <HStack align="start" spacing={2}>
                      <CopyAllBtn
                        q={maQ}
                        h={maHint}
                        tr={showTRMA ? maTranslation : ""}
                      />
                      <IconButton
                        aria-label={questionListenLabel}
                        icon={renderSpeakerIcon(isQuestionSynthesizing)}
                        size="sm"
                        fontSize="lg"
                        variant="ghost"
                        onClick={() => handlePlayQuestionTTS(maQ)}
                        mr={1}
                      />
                      <Text
                        fontSize="lg"
                        fontWeight="medium"
                        flex="1"
                        lineHeight="tall"
                      >
                        {maQ || (loadingMAQ ? "…" : "")}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
                <Stack spacing={3} align="stretch">
                  {(maChoices.length
                    ? maChoices
                    : loadingMAQ
                    ? ["…", "…", "…", "…", "…"]
                    : []
                  ).map((c, i) => {
                    const isSelected = maPicks.includes(c);
                    return (
                      <Box
                        key={i}
                        onClick={() => {
                          if (!maChoices.length) return;
                          playSound(selectSound);
                          if (isSelected) {
                            setMaPicks(maPicks.filter((p) => p !== c));
                          } else {
                            setMaPicks([...maPicks, c]);
                          }
                        }}
                        cursor={maChoices.length ? "pointer" : "not-allowed"}
                        px={4}
                        py={3}
                        rounded="lg"
                        borderWidth="2px"
                        borderColor={
                          isSelected ? "teal.400" : "rgba(255,255,255,0.15)"
                        }
                        bg={
                          isSelected
                            ? "linear-gradient(135deg, rgba(56,178,172,0.25) 0%, rgba(77,201,195,0.15) 100%)"
                            : "rgba(255,255,255,0.03)"
                        }
                        transition="all 0.2s ease"
                        _hover={
                          maChoices.length
                            ? {
                                borderColor: isSelected
                                  ? "teal.300"
                                  : "rgba(255,255,255,0.3)",
                                bg: isSelected
                                  ? "linear-gradient(135deg, rgba(56,178,172,0.3) 0%, rgba(77,201,195,0.2) 100%)"
                                  : "rgba(255,255,255,0.06)",
                                transform: "translateY(-2px)",
                                shadow: "md",
                              }
                            : {}
                        }
                        position="relative"
                        opacity={maChoices.length ? 1 : 0.5}
                      >
                        <HStack spacing={3}>
                          <Box
                            w="20px"
                            h="20px"
                            rounded="md"
                            borderWidth="2px"
                            borderColor={
                              isSelected ? "teal.400" : "rgba(255,255,255,0.3)"
                            }
                            bg={isSelected ? "teal.500" : "transparent"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            transition="all 0.2s ease"
                            flexShrink={0}
                          >
                            {isSelected && (
                              <Text
                                color="white"
                                fontSize="xs"
                                fontWeight="bold"
                              >
                                ✓
                              </Text>
                            )}
                          </Box>
                          <Text flex="1" fontSize="md">
                            {c}
                          </Text>
                        </HStack>
                      </Box>
                    );
                  })}
                </Stack>
              </>
            )}

            <AssistantSupportBox />

            <Stack
              direction="row"
              spacing={3}
              align="center"
              justify="flex-end"
            >
              {canSkip && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  isDisabled={loadingMAQ || loadingMAG}
                  px={{ base: 6, md: 10 }}
                  py={{ base: 3, md: 4 }}
                >
                  {skipLabel}
                </Button>
              )}
              <Button
                colorScheme="purple"
                onClick={submitMA}
                isDisabled={
                  lastOk === true ||
                  loadingMAG ||
                  !maChoices.length ||
                  !maReady ||
                  (isFinalQuiz && quizCurrentQuestionAttempted)
                }
                px={{ base: 7, md: 12 }}
                py={{ base: 3, md: 4 }}
              >
                {loadingMAG ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
            </Stack>

            <FeedbackRail
              ok={lastOk}
              xp={recentXp}
              showNext={
                (lastOk === true || (isFinalQuiz && lastOk === false)) &&
                nextAction
              }
              onNext={handleNext}
              nextLabel={nextQuestionLabel}
              t={t}
              userLanguage={userLanguage}
              onExplainAnswer={handleExplainAnswer}
              explanationText={explanationText}
              isLoadingExplanation={isLoadingExplanation}
              lessonProgress={lessonProgress}
              onCreateNote={handleCreateNote}
              isCreatingNote={isCreatingNote}
              noteCreated={noteCreated}
            />
          </>
        ) : null}
        {/* ---- SPEAK UI ---- */}
        {mode === "speak" && (sTarget || loadingSpeakQ) ? (
          <>
            <Text fontSize="xl" fontWeight="bold" color="white" mb={2}>
              {userLanguage === "es" ? "Dilo en voz alta" : "Say it aloud"}
            </Text>
            {loadingSpeakQ ? (
              <Box textAlign="center" py={12}>
                <RobotBuddyPro palette="ocean" variant="abstract" />
                <Text mt={4} fontSize="sm" opacity={0.7}>
                  {userLanguage === "es"
                    ? "Generando pregunta..."
                    : "Generating question..."}
                </Text>
              </Box>
            ) : (
              <>
                <Box
                  border="1px solid rgba(255,255,255,0.18)"
                  rounded="xl"
                  p={6}
                  textAlign="center"
                  bg="rgba(255,255,255,0.04)"
                  position="relative"
                >
                  <IconButton
                    aria-label={speakListenLabel}
                    icon={renderSpeakerIcon(isSpeakSynthesizing)}
                    size="sm"
                    variant="solid"
                    colorScheme={isSpeakPlaying ? "teal" : "purple"}
                    position="absolute"
                    top="3"
                    right="3"
                    onClick={handleToggleSpeakPlayback}
                    isDisabled={!sTarget}
                  />
                  <Badge mb={3} colorScheme="purple" fontSize="0.7rem">
                    {speakVariantLabel}
                  </Badge>
                  <Text fontSize="3xl" fontWeight="700">
                    {sTarget || "…"}
                  </Text>
                </Box>
              </>
            )}

            {sRecognized && lastOk !== true ? (
              <Text fontSize="sm" mt={3} color="teal.200">
                <Text as="span" fontWeight="600">
                  {t("grammar_speak_last_heard") ||
                    (userLanguage === "es" ? "Último intento" : "Last attempt")}
                  :
                </Text>{" "}
                {sRecognized}
              </Text>
            ) : null}

            <AssistantSupportBox />

            <Stack
              direction="row"
              spacing={3}
              align="center"
              justify="flex-end"
              mt={4}
            >
              {canSkip && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  isDisabled={loadingSpeakQ || isSpeakRecording}
                  px={{ base: 6, md: 10 }}
                  py={{ base: 3, md: 4 }}
                >
                  {skipLabel}
                </Button>
              )}
              <Button
                colorScheme={isSpeakRecording ? "red" : "teal"}
                px={{ base: 7, md: 12 }}
                py={{ base: 3, md: 4 }}
                onClick={async () => {
                  if (isSpeakRecording) {
                    stopSpeakRecording();
                    return;
                  }
                  // Clear previous results to prevent UI flickering
                  setLastOk(null);
                  setSRecognized("");
                  setSEval(null);
                  playSound(submitActionSound);
                  try {
                    await startSpeakRecording();
                  } catch (err) {
                    const code = err?.code;
                    if (code === "no-speech-recognition") {
                      toast({
                        title:
                          t("grammar_speak_unavailable") ||
                          (userLanguage === "es"
                            ? "Reconocimiento de voz no disponible"
                            : "Speech recognition unavailable"),
                        description:
                          userLanguage === "es"
                            ? "Usa un navegador Chromium con acceso al micrófono."
                            : "Use a Chromium-based browser with microphone access.",
                        status: "warning",
                        duration: 3200,
                      });
                    } else if (code === "mic-denied") {
                      toast({
                        title:
                          userLanguage === "es"
                            ? "Permiso de micrófono denegado"
                            : "Microphone denied",
                        description:
                          userLanguage === "es"
                            ? "Activa el micrófono en la configuración del navegador."
                            : "Enable microphone access in your browser settings.",
                        status: "error",
                        duration: 3200,
                      });
                    } else {
                      toast({
                        title:
                          userLanguage === "es"
                            ? "No se pudo iniciar la grabación"
                            : "Recording failed",
                        description:
                          userLanguage === "es"
                            ? "Inténtalo de nuevo."
                            : "Please try again.",
                        status: "error",
                        duration: 2500,
                      });
                    }
                  }
                }}
                isDisabled={
                  !supportsSpeak ||
                  loadingSpeakQ ||
                  !sTarget ||
                  (isFinalQuiz && quizCurrentQuestionAttempted)
                }
              >
                {isSpeakRecording
                  ? t("grammar_speak_stop") ||
                    (userLanguage === "es" ? "Detener" : "Stop")
                  : t("grammar_speak_record") ||
                    (userLanguage === "es" ? "Grabar" : "Record")}
              </Button>
            </Stack>

            {lastOk === true ? (
              <SpeakSuccessCard
                title={
                  t("grammar_speak_success_title") ||
                  (userLanguage === "es"
                    ? "¡Pronunciación aprobada!"
                    : "Pronunciation approved!")
                }
                scoreLabel={
                  sEval
                    ? t("grammar_speak_success_desc", { score: sEval.score }) ||
                      (userLanguage === "es"
                        ? `Puntaje ${sEval.score}%`
                        : `Score ${sEval.score}%`)
                    : ""
                }
                xp={recentXp}
                recognizedText={sRecognized}
                translation={showTRSpeak ? sTranslation : ""}
                t={t}
                userLanguage={userLanguage}
              />
            ) : null}

            <FeedbackRail
              ok={lastOk}
              xp={recentXp}
              showNext={
                (lastOk === true || (isFinalQuiz && lastOk === false)) &&
                nextAction
              }
              onNext={handleNext}
              nextLabel={nextQuestionLabel}
              t={t}
              userLanguage={userLanguage}
              onExplainAnswer={handleExplainAnswer}
              explanationText={explanationText}
              isLoadingExplanation={isLoadingExplanation}
              lessonProgress={lessonProgress}
              onCreateNote={handleCreateNote}
              isCreatingNote={isCreatingNote}
              noteCreated={noteCreated}
            />
          </>
        ) : null}

        {/* ---- MATCH UI (Drag & Drop) ---- */}
        {mode === "match" && (mLeft.length > 0 || loadingMG) ? (
          <>
            <HStack justify="space-between" align="center" mb={4}>
              <Text fontSize="xl" fontWeight="bold" color="white" mb={0}>
                {userLanguage === "es"
                  ? "Empareja las palabras"
                  : "Match the words"}
              </Text>
              <IconButton
                aria-label={
                  userLanguage === "es" ? "Pedir ayuda" : "Ask the assistant"
                }
                icon={isLoadingAssistantSupport ? <Spinner size="xs" /> : <MdOutlineSupportAgent />}
                size="sm"
                fontSize="lg"
                rounded="xl"
                bg="white"
                color="blue"
                boxShadow="0 4px 0 blue"
                onClick={sendMatchHelp}
                isDisabled={isLoadingAssistantSupport || !!assistantSupportText}
              />
            </HStack>
            <DragDropContext onDragEnd={onDragEnd}>
              <VStack align="stretch" spacing={3}>
                {(mLeft.length ? mLeft : loadingMG ? ["…", "…", "…"] : []).map(
                  (lhs, i) => (
                    <HStack key={i} align="stretch" spacing={3}>
                      <HStack minW="180px" spacing={1}>
                        <IconButton
                          aria-label={
                            userLanguage === "es"
                              ? "Escuchar palabra"
                              : "Listen to word"
                          }
                          icon={renderSpeakerIcon(matchWordSynthesizing === i)}
                          size="xs"
                          fontSize="md"
                          variant="ghost"
                          onClick={() => handlePlayMatchWordTTS(lhs, i)}
                          isDisabled={!lhs || lhs === "…"}
                        />
                        <Text>{lhs}</Text>
                      </HStack>
                      <Droppable
                        droppableId={`slot-${i}`}
                        direction="horizontal"
                      >
                        {(provided) => (
                          <HStack
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            minH="42px"
                            px={2}
                            border="1px dashed rgba(255,255,255,0.22)"
                            rounded="md"
                            w="100%"
                          >
                            {mSlots[i] !== null && mRight[mSlots[i]] != null ? (
                              <Draggable
                                draggableId={`r-${mSlots[i]}`}
                                index={0}
                              >
                                {(dragProvided) => (
                                  <Box
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={() => {
                                      playSound(selectSound);
                                      handleMatchAutoMove(
                                        mSlots[i],
                                        `slot-${i}`
                                      );
                                    }}
                                    onKeyDown={(event) => {
                                      if (
                                        event.key === "Enter" ||
                                        event.key === " "
                                      ) {
                                        event.preventDefault();
                                        playSound(selectSound);
                                        handleMatchAutoMove(
                                          mSlots[i],
                                          `slot-${i}`
                                        );
                                      }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    style={{
                                      cursor: "pointer",
                                      transition:
                                        "transform 0.18s ease, box-shadow 0.18s ease",
                                      ...(dragProvided.draggableProps.style ||
                                        {}),
                                    }}
                                    _hover={{ transform: "translateY(-2px)" }}
                                    _focusVisible={{
                                      boxShadow:
                                        "0 0 0 2px rgba(255,255,255,0.35)",
                                      transform: "translateY(-2px)",
                                    }}
                                    px={3}
                                    py={1.5}
                                    rounded="md"
                                    border="1px solid rgba(255,255,255,0.24)"
                                  >
                                    {mRight[mSlots[i]]}
                                  </Box>
                                )}
                              </Draggable>
                            ) : (
                              <Text opacity={0.6} fontSize="sm">
                                {t("grammar_dnd_drop_here")}
                              </Text>
                            )}
                            {provided.placeholder}
                          </HStack>
                        )}
                      </Droppable>
                    </HStack>
                  )
                )}
              </VStack>

              {/* Bank */}
              <Box mt={3}>
                <Text fontSize="sm" mb={1}>
                  {t("grammar_dnd_bank")}
                </Text>
                <Droppable droppableId="bank" direction="horizontal">
                  {(provided) => (
                    <HStack
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      spacing={2}
                      flexWrap="wrap"
                      minH="44px"
                      p={2}
                      border="1px dashed rgba(255,255,255,0.22)"
                      rounded="md"
                    >
                      {(mBank.length ? mBank : loadingMG ? [0, 1, 2] : []).map(
                        (ri, index) =>
                          mRight[ri] != null ? (
                            <Draggable
                              key={`r-${ri}`}
                              draggableId={`r-${ri}`}
                              index={index}
                            >
                              {(dragProvided) => (
                                <Box
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() => {
                                    playSound(selectSound);
                                    handleMatchAutoMove(ri, "bank");
                                  }}
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === "Enter" ||
                                      event.key === " "
                                    ) {
                                      event.preventDefault();
                                      playSound(selectSound);
                                      handleMatchAutoMove(ri, "bank");
                                    }
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  style={{
                                    cursor: "pointer",
                                    transition:
                                      "transform 0.18s ease, box-shadow 0.18s ease",
                                    ...(dragProvided.draggableProps.style ||
                                      {}),
                                  }}
                                  _hover={{ transform: "translateY(-2px)" }}
                                  _focusVisible={{
                                    boxShadow:
                                      "0 0 0 2px rgba(255,255,255,0.35)",
                                    transform: "translateY(-2px)",
                                  }}
                                  px={3}
                                  py={1.5}
                                  rounded="md"
                                  border="1px solid rgba(255,255,255,0.24)"
                                >
                                  {mRight[ri]}
                                </Box>
                              )}
                            </Draggable>
                          ) : (
                            <Box
                              key={`placeholder-${index}`}
                              px={3}
                              py={1.5}
                              rounded="md"
                              border="1px solid rgba(255,255,255,0.24)"
                              opacity={0.5}
                            >
                              …
                            </Box>
                          )
                      )}
                      {provided.placeholder}
                    </HStack>
                  )}
                </Droppable>
              </Box>
            </DragDropContext>

            <AssistantSupportBox />

            <Stack
              direction="row"
              spacing={3}
              align="center"
              justify="flex-end"
            >
              {canSkip && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  isDisabled={loadingMG || loadingMJ}
                  px={{ base: 7, md: 12 }}
                  py={{ base: 3, md: 4 }}
                >
                  {skipLabel}
                </Button>
              )}
              <Button
                colorScheme="purple"
                onClick={submitMatch}
                isDisabled={
                  lastOk === true ||
                  !canSubmitMatch() ||
                  loadingMJ ||
                  !mLeft.length ||
                  (isFinalQuiz && quizCurrentQuestionAttempted)
                }
                px={{ base: 8, md: 14 }}
                py={{ base: 3, md: 4 }}
              >
                {loadingMJ ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
            </Stack>

            <FeedbackRail
              ok={lastOk}
              xp={recentXp}
              showNext={
                (lastOk === true || (isFinalQuiz && lastOk === false)) &&
                nextAction
              }
              onNext={handleNext}
              nextLabel={nextQuestionLabel}
              t={t}
              userLanguage={userLanguage}
              onExplainAnswer={handleExplainAnswer}
              explanationText={explanationText}
              isLoadingExplanation={isLoadingExplanation}
              lessonProgress={lessonProgress}
              onCreateNote={handleCreateNote}
              isCreatingNote={isCreatingNote}
              noteCreated={noteCreated}
            />
          </>
        ) : null}

        {/* ---- TRANSLATE UI ---- */}
        {mode === "translate" && (tSentence || loadingTQ) ? (
          translateUIVariant === "repeat" ? (
            <RepeatWhatYouHear
              sourceSentence={tSentence}
              wordBank={tWordBank}
              correctAnswer={tCorrectWords}
              hint={tHint}
              loading={loadingTQ}
              userLanguage={userLanguage}
              t={t}
              onSubmit={submitTranslate}
              onSkip={handleSkip}
              onNext={handleNext}
              onPlayTTS={(text) => handlePlayQuestionTTS(text, questionTTsLang)}
              onAskAssistant={handleAskAssistant}
              assistantSupportText={assistantSupportText}
              isLoadingAssistantSupport={isLoadingAssistantSupport}
              canSkip={canSkip}
              lastOk={lastOk}
              recentXp={recentXp}
              isSubmitting={loadingTJ}
              showNext={
                (lastOk === true || (isFinalQuiz && lastOk === false)) &&
                nextAction
              }
              isSynthesizing={isQuestionSynthesizing}
              onExplainAnswer={handleExplainAnswer}
              explanationText={explanationText}
              isLoadingExplanation={isLoadingExplanation}
              lessonProgress={lessonProgress}
              onCreateNote={handleCreateNote}
              isCreatingNote={isCreatingNote}
              noteCreated={noteCreated}
            />
          ) : (
            <TranslateSentence
              sourceSentence={tSentence}
              wordBank={tWordBank}
              correctAnswer={tCorrectWords}
              hint={tHint}
              loading={loadingTQ}
              userLanguage={userLanguage}
              t={t}
              onSubmit={submitTranslate}
              onSkip={handleSkip}
              onNext={handleNext}
              onPlayTTS={(text) => handlePlayQuestionTTS(text, questionTTsLang)}
              onAskAssistant={handleAskAssistant}
              assistantSupportText={assistantSupportText}
              isLoadingAssistantSupport={isLoadingAssistantSupport}
              canSkip={canSkip}
              lastOk={lastOk}
              recentXp={recentXp}
              isSubmitting={loadingTJ}
              showNext={
                (lastOk === true || (isFinalQuiz && lastOk === false)) &&
                nextAction
              }
              isSynthesizing={isQuestionSynthesizing}
              onExplainAnswer={handleExplainAnswer}
              explanationText={explanationText}
              isLoadingExplanation={isLoadingExplanation}
              lessonProgress={lessonProgress}
              onCreateNote={handleCreateNote}
              isCreatingNote={isCreatingNote}
              noteCreated={noteCreated}
            />
          )
        ) : null}
      </VStack>
    </Box>
  );
}
