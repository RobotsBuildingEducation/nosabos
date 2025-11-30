// components/GrammarBook.jsx
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
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
  Tooltip,
  IconButton,
  useToast,
  Center,
  SlideFade,
} from "@chakra-ui/react";
import {
  doc,
  onSnapshot,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { database, simplemodel } from "../firebaseResources/firebaseResources"; // ✅ Gemini (client-side)
import useUserStore from "../hooks/useUserStore";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { WaveBar } from "./WaveBar";
import { SpeakSuccessCard } from "./SpeakSuccessCard";
import RobotBuddyPro from "./RobotBuddyPro";
import translations from "../utils/translation";
import { PasscodePage } from "./PasscodePage";
import { FiArrowRight, FiCopy } from "react-icons/fi";
import { PiSpeakerHighDuotone } from "react-icons/pi";
import { awardXp } from "../utils/utils";
import { getLanguageXp } from "../utils/progressTracking";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { speechReasonTips } from "../utils/speechEvaluation";
import {
  TTS_LANG_TAG,
  fetchTTSBlob,
  resolveVoicePreference,
} from "../utils/tts";
import { extractCEFRLevel, getCEFRPromptHint } from "../utils/cefrUtils";
import { shuffle } from "./quiz/utils";

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
  const signature = `${question}||${choices.join("|")}||${answers.join("|")}`;
  return stableHash(signature) % 4 < 2;
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
    nah: "Nahuatl",
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
      const targetLang = ["nah", "es", "pt", "en", "fr", "it"].includes(
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
  const topicDirective =
    lessonContent?.topic || lessonContent?.focusPoints
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
    `Create ONE short ${TARGET} grammar fill-in-the-blank with a single blank "___". Difficulty: ${diff}`,
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
- Allow contractions, minor casing/punctuation differences, and natural variants.
- Allow missing or incorrect accent marks/diacritics (e.g., "Cual" is acceptable for "Cuál").
- If clearly wrong or ungrammatical for the stem, say NO.

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
  const topicDirective =
    lessonContent?.topic || lessonContent?.focusPoints
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
    `Create ONE ${TARGET} multiple-choice grammar question (EXACTLY one correct). Difficulty: ${diff}`,
    stemDirective,
    `- 4 distinct choices in ${TARGET}.`,
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
- Say YES if the selected choice is a grammatically correct, context-appropriate answer to the stem.
- Use the hint and any time/aspect cues in the stem (e.g., "usually", "yesterday", "for/since").
- Allow contractions, minor punctuation/casing differences, and natural variation.
- Allow missing or incorrect accent marks/diacritics (e.g., "Cual" is acceptable for "Cuál").
- If more than one choice could be acceptable, accept the user's if it fits well.
- Otherwise say NO.

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
  const preferBlank = Math.random() < 0.6;
  const stemDirective = preferBlank
    ? `- Stem short (≤120 chars) and MUST include at least one blank "___".`
    : `- Stem short (≤120 chars), may include "___".`;

  // If lesson content is provided, use specific grammar topic/focus
  const topicDirective =
    lessonContent?.topic || lessonContent?.focusPoints
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
    `Create ONE ${TARGET} multiple-answer grammar question (EXACTLY 2 or 3 correct). Difficulty: ${diff}`,
    stemDirective,
    `- 5–6 distinct choices in ${TARGET}.`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    wantTranslation
      ? `- ${SUPPORT} translation of stem.`
      : `- Empty translation "".`,
    topicDirective,
    "",
    "Stream as NDJSON:",
    `{"type":"ma","phase":"q","question":"<stem in ${TARGET}>"}  // first`,
    `{"type":"ma","phase":"choices","choices":["..."]}           // second`,
    `{"type":"ma","phase":"meta","hint":"<${SUPPORT} hint>","answers":["<correct>","<correct>"],"translation":"<${SUPPORT} translation or empty>"} // third`,
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
  const topicDirective =
    lessonContent?.topic || lessonContent?.focusPoints
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
    `Craft ONE short ${TARGET} sentence (≤8 words) that showcases a grammar feature. Difficulty: ${diff}`,
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
}) {
  const t = useT(userLanguage);
  const toast = useToast();
  const user = useUserStore((s) => s.user);

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

  const level = progress.level || "beginner";
  const targetLang = ["en", "es", "pt", "nah", "fr", "it"].includes(
    progress.targetLang
  )
    ? progress.targetLang
    : "en";
  const speakLangTag = TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es;
  const supportLang = ["en", "es", "bilingual"].includes(progress.supportLang)
    ? progress.supportLang
    : "en";
  const showTranslations =
    typeof progress.showTranslations === "boolean"
      ? progress.showTranslations
      : true;
  const supportCode = resolveSupportLang(supportLang, userLanguage);

  // Localized chips
  const localizedLangName = (code) =>
    ({
      en: t("language_en"),
      es: t("language_es"),
      pt: t("language_pt"),
      fr: t("language_fr"),
      it: t("language_it"),
      nah: t("language_nah"),
    }[code] || code);
  const supportName = localizedLangName(supportCode);
  const targetName = localizedLangName(targetLang);
  const levelLabel = t(`onboarding_level_${level}`) || level;
  const voicePreference = resolveVoicePreference({
    voice: progress.voice,
    lang: targetLang,
    langTag: speakLangTag,
  });

  const recentCorrectRef = useRef([]);

  const [mode, setMode] = useState("fill"); // "fill" | "mc" | "ma" | "speak" | "match"
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  useEffect(() => {
    if (
      levelNumber > 2 &&
      localStorage.getItem("passcode") !== import.meta.env.VITE_PATREON_PASSCODE
    ) {
      setShowPasscodeModal(true);
    }
  }, [xp]);

  // random-by-default (no manual lock controls)
  const modeLocked = false;
  const autoInitRef = useRef(false);

  // verdict + next control
  const [lastOk, setLastOk] = useState(null); // null | true | false
  const [recentXp, setRecentXp] = useState(0);
  const [nextAction, setNextAction] = useState(null);

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

  function handleNext() {
    setLastOk(null);
    setQuizCurrentQuestionAttempted(false);
    setRecentXp(0);
    setNextAction(null);

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

  function handleSkip() {
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
  const speakAudioCacheRef = useRef(new Map());
  const [isSpeakPlaying, setIsSpeakPlaying] = useState(false);
  const [isSpeakSynthesizing, setIsSpeakSynthesizing] = useState(false);

  useEffect(() => {
    const cache = speakAudioCacheRef.current;
    return () => {
      try {
        speakAudioRef.current?.pause?.();
      } catch {}
      speakAudioRef.current = null;
      cache.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      cache.clear();
    };
  }, []);

  useEffect(() => {
    try {
      speakAudioRef.current?.pause?.();
    } catch {}
    speakAudioRef.current = null;
    setIsSpeakPlaying(false);
  }, [sTarget]);

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

  const generatorDeckRef = useRef([]);
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
      const order = [
        generateFill,
        generateMC,
        generateMA,
        generateSpeak,
        generateMatch,
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
    const useDrag = shouldUseDragVariant(maQ, maChoices, maAnswers);
    setMaLayout(useDrag ? "drag" : "buttons");
    if (useDrag) {
      const blanks = countBlanks(maQ) || maAnswers.length;
      const slotCount = Math.min(Math.max(blanks, 1), maAnswers.length);
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
    if (showPasscodeModal) return;
    if (!ready) return;
    autoInitRef.current = true;
    generateRandom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, showPasscodeModal]);

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
              const choices = obj.choices.slice(0, 4).map(String);
              setMcChoices(choices);
              // If answer already known, align it
              if (pendingAnswer) {
                const ans =
                  choices.find((c) => norm(c) === norm(pendingAnswer)) ||
                  choices[0];
                setMcAnswer(ans);
              }
              got = true;
            } else if (obj?.type === "mc" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setMcHint(obj.hint);
              if (typeof obj.translation === "string")
                setMcTranslation(obj.translation);
              if (typeof obj.answer === "string") {
                pendingAnswer = obj.answer;
                if (Array.isArray(mcChoices) && mcChoices.length) {
                  const ans =
                    mcChoices.find((c) => norm(c) === norm(pendingAnswer)) ||
                    mcChoices[0];
                  setMcAnswer(ans);
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
                const choices = obj.choices.slice(0, 4).map(String);
                setMcChoices(choices);
                if (pendingAnswer) {
                  const ans =
                    choices.find((c) => norm(c) === norm(pendingAnswer)) ||
                    choices[0];
                  setMcAnswer(ans);
                }
                got = true;
              } else if (obj?.type === "mc" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setMcHint(obj.hint);
                if (typeof obj.translation === "string")
                  setMcTranslation(obj.translation);
                if (typeof obj.answer === "string") {
                  pendingAnswer = obj.answer;
                  if (Array.isArray(mcChoices) && mcChoices.length) {
                    const ans =
                      mcChoices.find((c) => norm(c) === norm(pendingAnswer)) ||
                      mcChoices[0];
                    setMcAnswer(ans);
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
        const choices = parsed.choices.slice(0, 4).map((c) => String(c));
        const ans =
          choices.find((c) => norm(c) === norm(parsed.answer)) || choices[0];
        setMcQ(String(parsed.question));
        setMcHint(String(parsed.hint || ""));
        setMcChoices(choices);
        setMcAnswer(ans);
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

    const choices = uniqByNorm(parsed.choices).slice(0, 6);
    const answers = uniqByNorm(parsed.answers).filter((a) =>
      choices.some((c) => norm(c) === norm(a))
    );

    if (choices.length < 4) return null;
    if (answers.length < 2 || answers.length > 3) return null;

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
    let pendingAnswers = [];

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
              setMaQ(String(obj.question));
              got = true;
            } else if (
              obj?.type === "ma" &&
              obj.phase === "choices" &&
              Array.isArray(obj.choices)
            ) {
              const choices = obj.choices.slice(0, 6).map(String);
              setMaChoices(choices);
              // If we already have pending answers, align them
              if (pendingAnswers?.length) {
                const aligned = pendingAnswers.filter((a) =>
                  choices.some((c) => norm(c) === norm(a))
                );
                if (aligned.length >= 2) setMaAnswers(aligned);
              }
              got = true;
            } else if (obj?.type === "ma" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setMaHint(obj.hint);
              if (typeof obj.translation === "string")
                setMaTranslation(obj.translation);
              if (Array.isArray(obj.answers)) {
                pendingAnswers = obj.answers.map(String);
                if (Array.isArray(maChoices) && maChoices.length) {
                  const aligned = pendingAnswers.filter((a) =>
                    maChoices.some((c) => norm(c) === norm(a))
                  );
                  if (aligned.length >= 2) setMaAnswers(aligned);
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
              if (obj?.type === "ma" && obj.phase === "q" && obj.question) {
                setMaQ(String(obj.question));
                got = true;
              } else if (
                obj?.type === "ma" &&
                obj.phase === "choices" &&
                Array.isArray(obj.choices)
              ) {
                const choices = obj.choices.slice(0, 6).map(String);
                setMaChoices(choices);
                if (pendingAnswers?.length) {
                  const aligned = pendingAnswers.filter((a) =>
                    choices.some((c) => norm(c) === norm(a))
                  );
                  if (aligned.length >= 2) setMaAnswers(aligned);
                }
                got = true;
              } else if (obj?.type === "ma" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setMaHint(obj.hint);
                if (typeof obj.translation === "string")
                  setMaTranslation(obj.translation);
                if (Array.isArray(obj.answers)) {
                  pendingAnswers = obj.answers.map(String);
                  if (Array.isArray(maChoices) && maChoices.length) {
                    const aligned = pendingAnswers.filter((a) =>
                      maChoices.some((c) => norm(c) === norm(a))
                    );
                    if (aligned.length >= 2) setMaAnswers(aligned);
                  }
                }
                got = true;
              }
            })
          );
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

  /* ---------------------------
     Submits (backend judging for fill/mc/ma; deterministic for match)
  --------------------------- */
  async function submitFill() {
    if (!question || !input.trim()) return;
    setLoadingG(true);

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
      const nextFn = ok || isFinalQuiz
        ? modeLocked
          ? () => generateFill()
          : () => generateRandomRef.current()
        : null;
      setNextAction(() => nextFn);
      setLoadingG(false);
      return;
    }

    await saveAttempt(npub, {
      ok,
      mode: "fill",
      question,
      hint,
      translation,
      user_input: input,
      award_xp: delta,
    }).catch(() => {});
    if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

    setLastOk(ok);
    setRecentXp(delta);

    if (ok) {
      setInput("");
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "fill", question },
      ].slice(-5);
      const nextFn = modeLocked
        ? () => generateFill()
        : () => generateRandomRef.current();
      setNextAction(() => nextFn); // ✅ random unless user locked a type
    } else {
      setNextAction(null);
    }

    setLoadingG(false);
  }

  async function submitMC() {
    if (!mcQ || !mcPick) return;
    setLoadingMCG(true);

    const deterministicOk =
      mcAnswer && norm(mcPick) === norm(mcAnswer);

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
      deterministicOk || (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 5 : 0; // ✅ normalized to 4-7 XP range

    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setMcResult(ok ? "correct" : "try_again");
      setLastOk(ok);
      setRecentXp(0);
      const nextFn = ok || isFinalQuiz
        ? modeLocked
          ? () => generateMC()
          : () => generateRandomRef.current()
        : null;
      setNextAction(() => nextFn);
      setLoadingMCG(false);
      return;
    }

    await saveAttempt(npub, {
      ok,
      mode: "mc",
      question: mcQ,
      hint: mcHint,
      translation: mcTranslation,
      choices: mcChoices,
      author_answer: mcAnswer || "",
      user_choice: mcPick,
      award_xp: delta,
    }).catch(() => {});
    if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

    setMcResult(ok ? "correct" : "try_again"); // for logs only
    setLastOk(ok);
    setRecentXp(delta);
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
    setLoadingMAG(true);

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
      deterministicOk || (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 6 : 0; // ✅ normalized to 4-7 XP range

    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setMaResult(ok ? "correct" : "try_again");
      setLastOk(ok);
      setRecentXp(0);
      const nextFn = ok || isFinalQuiz
        ? modeLocked
          ? () => generateMA()
          : () => generateRandomRef.current()
        : null;
      setNextAction(() => nextFn);
      setLoadingMAG(false);
      return;
    }

    await saveAttempt(npub, {
      ok,
      mode: "ma",
      question: maQ,
      hint: maHint,
      translation: maTranslation,
      choices: maChoices,
      author_answers: maAnswers || [],
      user_choices: maPicks,
      award_xp: delta,
    }).catch(() => {});
    if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

    setMaResult(ok ? "correct" : "try_again"); // for logs only
    setLastOk(ok);
    setRecentXp(delta);
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
    setLoadingMJ(true);

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
      const nextFn = ok || isFinalQuiz
        ? modeLocked
          ? () => generateMatch()
          : () => generateRandomRef.current()
        : null;
      setNextAction(() => nextFn);
      setLoadingMJ(false);
      return;
    }

    await saveAttempt(npub, {
      ok,
      mode: "match",
      question: mStem,
      hint: mHint,
      left: mLeft,
      right: mRight,
      user_pairs: userPairs,
      answer_map: mAnswerMap,
      award_xp: delta,
    }).catch(() => {});
    if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

    setLastOk(ok);
    setRecentXp(delta);
    const nextFn = ok
      ? modeLocked
        ? () => generateMatch()
        : () => generateRandomRef.current()
      : null;
    setNextAction(() => nextFn);

    setLoadingMJ(false);
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

      setSRecognized(recognizedText || "");
      setSEval(evaluation);

    const ok = evaluation.pass;
    const delta = ok ? 6 : 0; // ✅ normalized to 4-7 XP range

    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setLastOk(ok);
      setRecentXp(0);
      const nextFn = ok || isFinalQuiz
        ? modeLocked
          ? () => generateSpeak()
          : () => generateRandomRef.current()
        : null;
      setNextAction(() => nextFn);
      return;
    }

    await saveAttempt(npub, {
      ok,
        mode: "grammar_speak",
        question: sPrompt,
        target: sTarget,
        hint: sHint,
        translation: sTranslation,
        recognized_text: recognizedText || "",
        confidence,
        audio_metrics: audioMetrics,
        eval: evaluation,
        method,
        award_xp: delta,
      }).catch(() => {});
      if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

      setLastOk(ok);
      setRecentXp(delta);
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

      // From slot -> slot
      if (source.droppableId.startsWith("slot-")) {
        const src = parseInt(source.droppableId.replace("slot-", ""), 10);
        if (Number.isNaN(src) || src === dest) return;
        const nextSlots = [...mSlots];
        const prevDest = nextSlots[dest];
        nextSlots[dest] = ri;
        nextSlots[src] = null;
        setMSlots(nextSlots);
        if (prevDest !== null) setMBank((b) => [...b, prevDest]);
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

  if (showPasscodeModal) {
    return (
      <PasscodePage
        userLanguage={user?.appLanguage}
        setShowPasscodeModal={setShowPasscodeModal}
      />
    );
  }

  // Single copy button (left of question)
  const CopyAllBtn = ({ q, h, tr }) => {
    const has = (q && q.trim()) || (h && h.trim()) || (tr && tr.trim());
    if (!has) return null;
    return (
      <Tooltip
        label={
          t("copy_all") || (userLanguage === "es" ? "Copiar todo" : "Copy all")
        }
      >
        <IconButton
          aria-label="Copy all"
          icon={<FiCopy />}
          size="xs"
          variant="ghost"
          onClick={() => copyAll(q, h, tr)}
          mr={1}
        />
      </Tooltip>
    );
  };

  // Animated feedback rail that blends the badge + next button
  const FeedbackRail = ({ ok, xp, showNext, onNext, nextLabel }) => {
    if (ok === null) return null;
    const label = ok
      ? t("correct") || "Correct!"
      : t("try_again") || "Try again";

    return (
      <SlideFade in={true} offsetY="10px">
        <Flex
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={3}
          p={4}
          borderRadius="xl"
          bg={
            ok
              ? "linear-gradient(90deg, rgba(72,187,120,0.16), rgba(56,161,105,0.08))"
              : "linear-gradient(90deg, rgba(245,101,101,0.16), rgba(229,62,62,0.08))"
          }
          borderWidth="1px"
          borderColor={ok ? "green.400" : "red.300"}
          boxShadow="0 12px 30px rgba(0, 0, 0, 0.3)"
        >
          <HStack spacing={3} flex="1" align="center">
            <Flex
              w="44px"
              h="44px"
              rounded="full"
              align="center"
              justify="center"
              bg={ok ? "green.500" : "red.500"}
              color="white"
              fontWeight="bold"
              fontSize="lg"
              boxShadow="0 10px 24px rgba(0,0,0,0.22)"
            >
              {ok ? "✓" : "✖"}
            </Flex>
            <Box>
              <Text fontWeight="semibold">{label}</Text>
              <Text fontSize="sm" color="whiteAlpha.800">
                {xp > 0
                  ? `+${xp} XP`
                  : ok
                  ? t("practice_next_ready") ||
                    "Great work! Keep the streak going."
                  : t("practice_try_again_hint") || "Review and try again."}
              </Text>
            </Box>
          </HStack>
          {showNext ? (
            <Button
              rightIcon={<FiArrowRight />}
              colorScheme="cyan"
              variant="solid"
              onClick={onNext}
              shadow="md"
              w={{ base: "100%", md: "auto" }}
            >
              {nextLabel}
            </Button>
          ) : null}
        </Flex>
      </SlideFade>
    );
  };

  const dragPlaceholderLabel =
    t("practice_drag_drop_slot_placeholder") ||
    (userLanguage === "es"
      ? "Suelta la respuesta aquí"
      : "Drop the answer here");
  const skipLabel =
    t("practice_skip_question") ||
    (userLanguage === "es" ? "Omitir pregunta" : "skip");
  const speakListenLabel =
    userLanguage === "es" ? "Escuchar ejemplo" : "Listen to example";
  const speakVariantLabel =
    t("grammar_btn_speak") || (userLanguage === "es" ? "Pronunciar" : "Speak");
  const nextQuestionLabel = t("practice_next_question") || "Next question";
  const synthLabel =
    t("tts_synthesizing") ||
    (userLanguage === "es" ? "Sintetizando..." : "Synthesizing...");

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

      const cacheKey = `${speakLangTag}::${voicePreference}::${text}`;
      let audioUrl = speakAudioCacheRef.current.get(cacheKey);
      if (!audioUrl) {
        const blob = await fetchTTSBlob({
          text,
          voice: voicePreference,
          lang: targetLang,
          langTag: speakLangTag,
        });
        audioUrl = URL.createObjectURL(blob);
        speakAudioCacheRef.current.set(cacheKey, audioUrl);
      }

      const audio = new Audio(audioUrl);
      speakAudioRef.current = audio;
      audio.onended = () => {
        setIsSpeakPlaying(false);
        speakAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeakPlaying(false);
        speakAudioRef.current = null;
      };
      await audio.play();
      setIsSpeakSynthesizing(false);
    } catch (err) {
      console.error("Grammar speak playback failed", err);
      setIsSpeakSynthesizing(false);
      setIsSpeakPlaying(false);
      speakAudioRef.current = null;
      toast({
        title:
          userLanguage === "es"
            ? "No se pudo reproducir el audio"
            : "Audio playback failed",
        description:
          userLanguage === "es" ? "Inténtalo de nuevo." : "Please try again.",
        status: "error",
        duration: 2600,
      });
    }
  }, [
    isSpeakPlaying,
    sTarget,
    speakLangTag,
    toast,
    userLanguage,
    voicePreference,
  ]);

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
                  <Badge variant="subtle">{t("grammar_badge_xp", { xp })}</Badge>
                </HStack>
                <WaveBar value={progressPct} />
              </>
            )}
          </Box>
        </Box>

        {/* ---- Fill UI ---- */}
        {mode === "fill" && (question || loadingQ) ? (
          <VStack align="stretch" spacing={4}>
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
                  <Text
                    fontSize="lg"
                    fontWeight="medium"
                    flex="1"
                    lineHeight="tall"
                  >
                    {question || (loadingQ ? "…" : "")}
                  </Text>
                </HStack>
                {showTRFill && translation ? (
                  <Box
                    pl={7}
                    py={2}
                    borderLeftWidth="3px"
                    borderLeftColor="purple.500"
                    bg="rgba(159, 122, 234, 0.05)"
                  >
                    <Text fontSize="sm" color="gray.400">
                      {translation}
                    </Text>
                  </Box>
                ) : null}
                {hint ? (
                  <Box
                    pl={7}
                    py={2}
                    borderLeftWidth="3px"
                    borderLeftColor="cyan.500"
                    bg="rgba(0, 206, 209, 0.05)"
                  >
                    <Text fontSize="sm" color="gray.400">
                      💡 {hint}
                    </Text>
                  </Box>
                ) : null}
              </VStack>
            </Box>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("grammar_input_placeholder_answer")}
              isDisabled={loadingG}
            />

            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={3}
              align={{ base: "stretch", md: "center" }}
            >
              <Button
                variant="ghost"
                onClick={handleSkip}
                isDisabled={loadingQ || loadingG}
                w={{ base: "100%", md: "auto" }}
              >
                {skipLabel}
              </Button>
              <Button
                colorScheme="purple"
                onClick={submitFill}
                isDisabled={
                  lastOk === true || loadingG || !input.trim() || !question
                  || (isFinalQuiz && quizCurrentQuestionAttempted)
                }
                w={{ base: "100%", md: "auto" }}
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
            />
          </VStack>
        ) : null}

        {/* ---- MC UI ---- */}
        {mode === "mc" && (mcQ || loadingMCQ) ? (
          <>
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
                        <Text
                          fontSize="lg"
                          fontWeight="medium"
                          flex="1"
                          lineHeight="tall"
                        >
                          {renderMcPrompt() || (loadingMCQ ? "…" : "")}
                        </Text>
                      </HStack>
                      {showTRMC && mcTranslation ? (
                        <Box
                          pl={7}
                          py={2}
                          borderLeftWidth="3px"
                          borderLeftColor="purple.500"
                          bg="rgba(159, 122, 234, 0.05)"
                        >
                          <Text fontSize="sm" color="gray.400">
                            {mcTranslation}
                          </Text>
                        </Box>
                      ) : null}
                      {mcHint ? (
                        <Box
                          pl={7}
                          py={2}
                          borderLeftWidth="3px"
                          borderLeftColor="cyan.500"
                          bg="rgba(0, 206, 209, 0.05)"
                        >
                          <Text fontSize="sm" color="gray.400">
                            💡 {mcHint}
                          </Text>
                        </Box>
                      ) : null}
                      <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        {t("practice_drag_drop_instruction") ||
                          (userLanguage === "es"
                            ? "Arrastra o selecciona la respuesta correcta al espacio en la frase."
                            : "Drag or select the correct answer into the blank in the sentence.")}
                      </Text>
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
                      <Text
                        fontSize="lg"
                        fontWeight="medium"
                        flex="1"
                        lineHeight="tall"
                      >
                        {mcQ || (loadingMCQ ? "…" : "")}
                      </Text>
                    </HStack>
                    {showTRMC && mcTranslation ? (
                      <Box
                        pl={7}
                        py={2}
                        borderLeftWidth="3px"
                        borderLeftColor="purple.500"
                        bg="rgba(159, 122, 234, 0.05)"
                      >
                        <Text fontSize="sm" color="gray.400">
                          {mcTranslation}
                        </Text>
                      </Box>
                    ) : null}
                    {mcHint ? (
                      <Box
                        pl={7}
                        py={2}
                        borderLeftWidth="3px"
                        borderLeftColor="cyan.500"
                        bg="rgba(0, 206, 209, 0.05)"
                      >
                        <Text fontSize="sm" color="gray.400">
                          💡 {mcHint}
                        </Text>
                      </Box>
                    ) : null}
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
                      onClick={() => mcChoices.length && setMcPick(c)}
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

            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={3}
              align={{ base: "stretch", md: "center" }}
            >
              <Button
                variant="ghost"
                onClick={handleSkip}
                isDisabled={loadingMCQ || loadingMCG}
                w={{ base: "100%", md: "auto" }}
              >
                {skipLabel}
              </Button>
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
                w={{ base: "100%", md: "auto" }}
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
            />
          </>
        ) : null}
        {/* ---- MA UI ---- */}
        {mode === "ma" && (maQ || loadingMAQ) ? (
          <>
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
                        <Text
                          fontSize="lg"
                          fontWeight="medium"
                          flex="1"
                          lineHeight="tall"
                        >
                          {renderMaPrompt() || (loadingMAQ ? "…" : "")}
                        </Text>
                      </HStack>
                      {showTRMA && maTranslation ? (
                        <Box
                          pl={7}
                          py={2}
                          borderLeftWidth="3px"
                          borderLeftColor="purple.500"
                          bg="rgba(159, 122, 234, 0.05)"
                        >
                          <Text fontSize="sm" color="gray.400">
                            {maTranslation}
                          </Text>
                        </Box>
                      ) : null}
                      {maHint ? (
                        <Box
                          pl={7}
                          py={2}
                          borderLeftWidth="3px"
                          borderLeftColor="cyan.500"
                          bg="rgba(0, 206, 209, 0.05)"
                        >
                          <Text fontSize="sm" color="gray.400">
                            💡 {maHint}
                          </Text>
                        </Box>
                      ) : null}
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        fontWeight="semibold"
                      >
                        {t("grammar_select_all_apply")}
                      </Text>
                      <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        {t("practice_drag_drop_multi_instruction") ||
                          (userLanguage === "es"
                            ? "Arrastra o selecciona cada respuesta correcta a su espacio en la frase."
                            : "Drag or select each correct answer into its place in the sentence.")}
                      </Text>
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
                      <Text
                        fontSize="lg"
                        fontWeight="medium"
                        flex="1"
                        lineHeight="tall"
                      >
                        {maQ || (loadingMAQ ? "…" : "")}
                      </Text>
                    </HStack>
                    {showTRMA && maTranslation ? (
                      <Box
                        pl={7}
                        py={2}
                        borderLeftWidth="3px"
                        borderLeftColor="purple.500"
                        bg="rgba(159, 122, 234, 0.05)"
                      >
                        <Text fontSize="sm" color="gray.400">
                          {maTranslation}
                        </Text>
                      </Box>
                    ) : null}
                    {maHint ? (
                      <Box
                        pl={7}
                        py={2}
                        borderLeftWidth="3px"
                        borderLeftColor="cyan.500"
                        bg="rgba(0, 206, 209, 0.05)"
                      >
                        <Text fontSize="sm" color="gray.400">
                          💡 {maHint}
                        </Text>
                      </Box>
                    ) : null}
                    <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                      {t("grammar_select_all_apply")}
                    </Text>
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

            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={3}
              align={{ base: "stretch", md: "center" }}
            >
              <Button
                variant="ghost"
                onClick={handleSkip}
                isDisabled={loadingMAQ || loadingMAG}
                w={{ base: "100%", md: "auto" }}
              >
                {skipLabel}
              </Button>
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
                w={{ base: "100%", md: "auto" }}
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
            />
          </>
        ) : null}
        {/* ---- SPEAK UI ---- */}
        {mode === "speak" && (sTarget || loadingSpeakQ) ? (
          <>
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
                  bg="rgba(255, 255, 255, 0.02)"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="whiteAlpha.100"
                  p={5}
                  mb={4}
                >
                  <VStack align="stretch" spacing={3}>
                    <HStack align="start" spacing={2}>
                      <CopyAllBtn
                        q={`${sPrompt ? `${sPrompt}\n` : ""}${sTarget}`}
                        h={sHint}
                        tr={sTranslation}
                      />
                      <VStack align="flex-start" spacing={2} flex="1">
                        <Text fontSize="xs" color="gray.500" fontStyle="italic">
                          {t("grammar_speak_instruction_label") ||
                            (userLanguage === "es"
                              ? "Pronuncia la oración para practicar la gramática."
                              : "Say the sentence aloud to practice the grammar point.")}
                        </Text>
                        {sPrompt && (
                          <Text
                            fontSize="lg"
                            fontWeight="medium"
                            lineHeight="tall"
                          >
                            {sPrompt}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </VStack>
                </Box>

                <Box
                  border="1px solid rgba(255,255,255,0.18)"
                  rounded="xl"
                  p={6}
                  textAlign="center"
                  bg="rgba(255,255,255,0.04)"
                  position="relative"
                >
                  <Tooltip label={speakListenLabel} placement="top">
                    <Button
                      aria-label={speakListenLabel}
                      leftIcon={<PiSpeakerHighDuotone />}
                      size="sm"
                      variant="solid"
                      colorScheme={isSpeakPlaying ? "teal" : "purple"}
                      position="absolute"
                      top="3"
                      right="3"
                      onClick={handleToggleSpeakPlayback}
                      isDisabled={!sTarget}
                      isLoading={isSpeakSynthesizing}
                      spinnerPlacement="start"
                    >
                      {t("practice_play") ||
                        (userLanguage === "es" ? "Reproducir" : "Play")}
                    </Button>
                  </Tooltip>
                  <Badge mb={3} colorScheme="purple" fontSize="0.7rem">
                    {speakVariantLabel}
                  </Badge>
                  <Text fontSize="3xl" fontWeight="700">
                    {sTarget || "…"}
                  </Text>
                  {isSpeakSynthesizing ? (
                    <HStack
                      spacing={2}
                      justify="center"
                      mt={3}
                      color="gray.200"
                    >
                      <Spinner size="sm" />
                      <Text fontSize="xs">{synthLabel}</Text>
                    </HStack>
                  ) : null}
                </Box>

                {sHint ? (
                  <Box
                    pl={7}
                    py={2}
                    mt={3}
                    borderLeftWidth="3px"
                    borderLeftColor="cyan.500"
                    bg="rgba(0, 206, 209, 0.05)"
                  >
                    <Text fontSize="sm" color="gray.400">
                      💡 {sHint}
                    </Text>
                  </Box>
                ) : null}

                {showTRSpeak ? (
                  <Box
                    pl={7}
                    py={2}
                    mt={2}
                    borderLeftWidth="3px"
                    borderLeftColor="purple.500"
                    bg="rgba(159, 122, 234, 0.05)"
                  >
                    <Text fontSize="sm" color="gray.400">
                      {sTranslation}
                    </Text>
                  </Box>
                ) : null}
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

            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={3}
              align={{ base: "stretch", md: "center" }}
              mt={4}
            >
              <Button
                variant="ghost"
                onClick={handleSkip}
                isDisabled={loadingSpeakQ || isSpeakRecording}
                w={{ base: "100%", md: "auto" }}
              >
                {skipLabel}
              </Button>
              <Button
                colorScheme={isSpeakRecording ? "red" : "teal"}
                w={{ base: "100%", md: "auto" }}
                onClick={async () => {
                  if (isSpeakRecording) {
                    stopSpeakRecording();
                    return;
                  }
                  // Clear previous results to prevent UI flickering
                  setLastOk(null);
                  setSRecognized("");
                  setSEval(null);
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
                    (userLanguage === "es"
                      ? "Grabar pronunciación"
                      : "Record pronunciation")}
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
            />
          </>
        ) : null}

        {/* ---- MATCH UI (Drag & Drop) ---- */}
        {mode === "match" && (mLeft.length > 0 || loadingMG) ? (
          <>
            <Box
              bg="rgba(255, 255, 255, 0.02)"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              p={5}
              mb={4}
            >
              <VStack align="stretch" spacing={3}>
                <HStack align="start" spacing={2}>
                  <CopyAllBtn q={mStem} h={mHint} tr="" />
                  <Text
                    fontSize="lg"
                    fontWeight="medium"
                    flex="1"
                    lineHeight="tall"
                  >
                    {mStem || (loadingMG ? "…" : "")}
                  </Text>
                </HStack>
                {!!mHint && (
                  <Box
                    pl={7}
                    py={2}
                    borderLeftWidth="3px"
                    borderLeftColor="cyan.500"
                    bg="rgba(0, 206, 209, 0.05)"
                  >
                    <Text fontSize="sm" color="gray.400">
                      💡 {mHint}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
            <DragDropContext onDragEnd={onDragEnd}>
              <VStack align="stretch" spacing={3}>
                {(mLeft.length ? mLeft : loadingMG ? ["…", "…", "…"] : []).map(
                  (lhs, i) => (
                    <HStack key={i} align="stretch" spacing={3}>
                      <Box minW="180px">
                        <Text>{lhs}</Text>
                      </Box>
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
                                    onClick={() =>
                                      handleMatchAutoMove(
                                        mSlots[i],
                                        `slot-${i}`
                                      )
                                    }
                                    onKeyDown={(event) => {
                                      if (
                                        event.key === "Enter" ||
                                        event.key === " "
                                      ) {
                                        event.preventDefault();
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
                                  onClick={() =>
                                    handleMatchAutoMove(ri, "bank")
                                  }
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === "Enter" ||
                                      event.key === " "
                                    ) {
                                      event.preventDefault();
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

            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={3}
              align={{ base: "stretch", md: "center" }}
            >
              <Button
                variant="ghost"
                onClick={handleSkip}
                isDisabled={loadingMG || loadingMJ}
                w={{ base: "100%", md: "auto" }}
              >
                {skipLabel}
              </Button>
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
                w={{ base: "100%", md: "auto" }}
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
            />
          </>
        ) : null}
      </VStack>
    </Box>
  );
}

/* ---------------------------
   Firestore logging helper
--------------------------- */
async function saveAttempt(npub, payload) {
  if (!npub) return;
  const col = collection(database, "users", npub, "grammarTurns");
  await addDoc(col, {
    ...payload,
    createdAt: serverTimestamp(),
    createdAtClient: Date.now(),
    origin: "grammar",
  });
}
