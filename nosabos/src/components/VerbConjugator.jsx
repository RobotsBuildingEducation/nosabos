// components/VerbConjugator.jsx
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
  IconButton,
  useToast,
  Progress,
} from "@chakra-ui/react";
import { doc, onSnapshot } from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { database, simplemodel } from "../firebaseResources/firebaseResources";
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
import submitSound from "../assets/submit.mp3";

const renderSpeakerIcon = (loading) =>
  loading ? <Spinner size="xs" /> : <PiSpeakerHighDuotone />;

/* ---------------------------
   Streaming helpers (Gemini)
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

function tryConsumeLine(line, cb) {
  const s = line.indexOf("{");
  const e = line.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return;
  try {
    const obj = JSON.parse(line.slice(s, e + 1));
    cb?.(obj);
  } catch {}
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
   LLM plumbing
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
    el: "Greek",
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!npub) {
      setReady(true);
      return;
    }
    const ref = doc(database, "users", npub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const p = data?.progress || {};
      const targetLang = [
        "nah",
        "es",
        "pt",
        "en",
        "fr",
        "it",
        "nl",
        "ja",
        "ru",
        "de",
        "el",
      ].includes(p.targetLang)
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
      setReady(true);
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub, ready };
}

/* ---------------------------
   CEFR-based verb tense selection
--------------------------- */
function getVerbTensesForLevel(cefrLevel) {
  const level = (cefrLevel || "A1").toUpperCase();

  // Simple tenses for beginners
  const simpleTenses = [
    "simple present",
    "simple past",
    "simple future",
  ];

  // Intermediate tenses
  const intermediateTenses = [
    ...simpleTenses,
    "conditional",
    "present perfect",
    "past perfect",
    "future perfect",
  ];

  // Advanced tenses
  const advancedTenses = [
    ...intermediateTenses,
    "subjunctive present",
    "subjunctive past",
    "passive voice",
    "progressive aspect",
    "perfect progressive",
  ];

  switch (level) {
    case "A1":
    case "A2":
      return simpleTenses;
    case "B1":
    case "B2":
      return intermediateTenses;
    case "C1":
    case "C2":
      return advancedTenses;
    default:
      return simpleTenses;
  }
}

function getVerbTenseHint(cefrLevel) {
  const level = (cefrLevel || "A1").toUpperCase();
  const tenses = getVerbTensesForLevel(level);
  return tenses[Math.floor(Math.random() * tenses.length)];
}

/* ---------------------------
   Difficulty routing (CEFR-based)
--------------------------- */
function difficultyHint(cefrLevel) {
  return getCEFRPromptHint(cefrLevel);
}

/* ---------------------------
   Support language resolution
--------------------------- */
const resolveSupportLang = (supportLang, appUILang) =>
  supportLang === "bilingual"
    ? appUILang === "es"
      ? "es"
      : "en"
    : supportLang === "es"
    ? "es"
    : "en";

/* ---------------------------
   Prompts for Verb Conjugation
--------------------------- */

// Fill-in-the-blank conjugation
function buildConjugationFillPrompt({
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
  const tenseToTest = getVerbTenseHint(cefrLevel);

  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE verb conjugation about the verb "to be" or "to have" in simple present tense. Example: "Yo ___ estudiante" (answer: soy). Keep everything at absolute beginner level.`
    : lessonContent?.topic || lessonContent?.focusPoints
    ? [
        lessonContent.topic
          ? `- STRICT REQUIREMENT: Focus on verb tense: ${lessonContent.topic}. This is lesson-specific content.`
          : null,
        lessonContent.focusPoints
          ? `- STRICT REQUIREMENT: Use these verbs or tenses: ${JSON.stringify(
              lessonContent.focusPoints
            )}.`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `- Focus on the ${tenseToTest} tense. Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE ${TARGET} verb conjugation fill-in-the-blank with a single blank "___". Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    `- The blank must be for a CONJUGATED VERB form, not vocabulary.`,
    `- Include the infinitive form of the verb and the subject/pronoun in the hint.`,
    `- Sentence ≤120 chars; natural context that shows which tense is needed.`,
    topicDirective,
    `- Hint in ${SUPPORT} (≤12 words), must include: infinitive form, subject, and tense name.`,
    wantTranslation
      ? `- Provide a ${SUPPORT} translation of the full sentence.`
      : `- Provide empty translation "".`,
    "",
    "Stream as NDJSON in phases:",
    `{"type":"conj_fill","phase":"q","question":"<sentence with ___ for verb in ${TARGET}>"}`,
    `{"type":"conj_fill","phase":"meta","hint":"<${SUPPORT} hint with infinitive, subject, tense>","answer":"<correct conjugated form>","translation":"<${SUPPORT} translation or empty>"}`,
    `{"type":"done"}`,
  ].join("\n");
}

// Multiple choice conjugation
function buildConjugationMCPrompt({
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
  const tenseToTest = getVerbTenseHint(cefrLevel);

  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE multiple-choice about basic verb conjugation. Test "to be" (ser/estar) or "to have" (tener) in simple present. Keep everything at absolute beginner level.`
    : lessonContent?.topic || lessonContent?.focusPoints
    ? [
        lessonContent.topic
          ? `- STRICT REQUIREMENT: Focus on verb tense: ${lessonContent.topic}. This is lesson-specific content.`
          : null,
        lessonContent.focusPoints
          ? `- STRICT REQUIREMENT: Use these verbs or tenses: ${JSON.stringify(
              lessonContent.focusPoints
            )}.`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `- Focus on the ${tenseToTest} tense. Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE ${TARGET} verb conjugation multiple-choice question. Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    `- Sentence with a blank "___" where the conjugated verb goes (≤120 chars).`,
    `- All 4 choices must be different conjugations of the SAME verb (different persons, tenses, or moods).`,
    `- Only ONE choice is correct for the given subject and context.`,
    topicDirective,
    `- Hint in ${SUPPORT} (≤12 words): include infinitive, subject, and tense.`,
    wantTranslation
      ? `- ${SUPPORT} translation of stem.`
      : `- Empty translation "".`,
    "",
    "Stream as NDJSON:",
    `{"type":"conj_mc","phase":"q","question":"<stem in ${TARGET} with ___ for verb>"}`,
    `{"type":"conj_mc","phase":"choices","choices":["<conjugation1>","<conjugation2>","<conjugation3>","<conjugation4>"]}`,
    `{"type":"conj_mc","phase":"meta","hint":"<${SUPPORT} hint with infinitive, subject, tense>","answer":"<exact correct conjugation>","translation":"<${SUPPORT} translation or empty>"}`,
    `{"type":"done"}`,
  ].join("\n");
}

// Conjugation table exercise (match subject to conjugation)
function buildConjugationTablePrompt({
  cefrLevel,
  targetLang,
  supportLang,
  appUILang,
  recentGood,
  lessonContent = null,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const diff = difficultyHint(cefrLevel);
  const tenseToTest = getVerbTenseHint(cefrLevel);

  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Use the verb "ser" (to be) in simple present tense. Only include yo/tú/él forms.`
    : lessonContent?.topic || lessonContent?.focusPoints
    ? [
        lessonContent.topic
          ? `- STRICT REQUIREMENT: Focus on verb tense: ${lessonContent.topic}.`
          : null,
        lessonContent.focusPoints
          ? `- STRICT REQUIREMENT: Use these verbs: ${JSON.stringify(
              lessonContent.focusPoints
            )}.`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `- Focus on the ${tenseToTest} tense.`;

  return [
    `Create ONE ${TARGET} verb conjugation MATCHING exercise. Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    `- Pick ONE common verb and ONE tense.`,
    `- Left side: 4-6 subject pronouns (e.g., yo, tú, él, nosotros, ellos)`,
    `- Right side: The correct conjugated forms (shuffled order)`,
    `- Provide a clear 1:1 mapping.`,
    topicDirective,
    `- Hint in ${SUPPORT} naming the verb infinitive and tense.`,
    "",
    "Emit exactly TWO NDJSON lines:",
    `{"type":"conj_match","stem":"<instruction: 'Match each pronoun to the correct form of [verb] in [tense]'>","left":["yo","tú","él","nosotros"],"right":["conjugation1","conjugation2","conjugation3","conjugation4"],"map":[0,1,2,3],"hint":"<verb infinitive + tense in ${SUPPORT}>"}`,
    `{"type":"done"}`,
  ].join("\n");
}

// Judge prompts
function buildConjugationFillJudgePrompt({ targetLang, question, userAnswer, hint }) {
  return `
Judge a VERB CONJUGATION fill-in-the-blank in ${LANG_NAME(targetLang)}.

Question:
${question}

User answer:
${userAnswer}

Hint (contains infinitive, subject, tense):
${hint || ""}

Policy:
- Say YES if the verb conjugation is correct for the given subject and tense context.
- Focus on whether the conjugation matches the subject (person/number) and tense indicated.
- Allow minor spelling variations and accent mark differences.
- Be lenient with regional variations (e.g., vosotros vs ustedes).
- Accept both formal and informal forms if context allows.

Reply ONE WORD ONLY:
YES or NO
`.trim();
}

function buildConjugationMCJudgePrompt({ targetLang, stem, choices, userChoice, hint }) {
  const listed = choices.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return `
Judge a VERB CONJUGATION multiple-choice question in ${LANG_NAME(targetLang)}.

Stem:
${stem}

Choices:
${listed}

User selected:
${userChoice}

Hint (contains infinitive, subject, tense):
${hint || ""}

Instructions:
- Say YES if the selected conjugation correctly matches the subject and tense in the context.
- Multiple forms may be acceptable in some contexts; accept any grammatically valid answer.
- Allow regional variations (vosotros/ustedes, tú/vos).
- Focus on person, number, and tense correctness.

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

function ensureAnswerInChoices(choices, answer) {
  if (!answer || !Array.isArray(choices) || choices.length === 0) {
    return { choices, answer: choices[0] || "" };
  }
  const found = choices.find((c) => norm(c) === norm(answer));
  if (found) {
    return { choices, answer: found };
  }
  const newChoices = [...choices];
  const replaceIdx = Math.floor(Math.random() * newChoices.length);
  newChoices[replaceIdx] = String(answer);
  return { choices: newChoices, answer: String(answer) };
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

function normalizeMap(map, len) {
  const arr = Array.isArray(map) ? map.map((n) => parseInt(n, 10)) : [];
  if (!arr.length || arr.some((n) => Number.isNaN(n))) return [];
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (min === 0 && max === len - 1) return arr;
  if (min === 1 && max === len) return arr.map((n) => n - 1);
  return [];
}

/* ---------------------------
   Component
--------------------------- */
export default function VerbConjugator({
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
  const availableTenses = getVerbTensesForLevel(cefrLevel);

  // Quiz mode state
  const [quizQuestionsAnswered, setQuizQuestionsAnswered] = useState(0);
  const [quizCorrectAnswers, setQuizCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizAnswerHistory, setQuizAnswerHistory] = useState([]);
  const [quizCurrentQuestionAttempted, setQuizCurrentQuestionAttempted] =
    useState(false);

  const quizStorageKey = useMemo(
    () => (lesson?.id ? `verb-conj-quiz:${lesson.id}` : null),
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
  const targetLang = [
    "en",
    "es",
    "pt",
    "nah",
    "fr",
    "it",
    "nl",
    "ja",
    "ru",
    "de",
    "el",
  ].includes(progress.targetLang)
    ? progress.targetLang
    : "es";
  const supportLang = ["en", "es", "bilingual"].includes(progress.supportLang)
    ? progress.supportLang
    : "en";
  const showTranslations =
    typeof progress.showTranslations === "boolean"
      ? progress.showTranslations
      : true;
  const isTutorial = lessonContent?.topic === "tutorial";
  const supportCode = resolveSupportLang(supportLang, userLanguage);

  // Question state
  const [mode, setMode] = useState("fill"); // "fill", "mc", "match"
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState([]);
  const [hint, setHint] = useState("");
  const [translation, setTranslation] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [matchLeft, setMatchLeft] = useState([]);
  const [matchRight, setMatchRight] = useState([]);
  const [matchMap, setMatchMap] = useState([]);

  // User interaction state
  const [userInput, setUserInput] = useState("");
  const [selectedChoice, setSelectedChoice] = useState("");
  const [userMatches, setUserMatches] = useState({});
  const [dragItems, setDragItems] = useState([]);

  // Flow state
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [recentGood, setRecentGood] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Virtual keyboard
  const [showKeyboard, setShowKeyboard] = useState(false);
  const inputRef = useRef(null);

  // TTS
  const [ttsLoading, setTtsLoading] = useState(false);

  // Localized language name
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
      el: t("language_el"),
    }[code] || code);

  // Generate question
  const generateQuestion = useCallback(async () => {
    if (!ready) return;
    setGenerating(true);
    setLoading(true);
    setSubmitted(false);
    setIsCorrect(null);
    setFeedback("");
    setShowExplanation(false);
    setExplanation("");
    setUserInput("");
    setSelectedChoice("");
    setUserMatches({});
    setDragItems([]);
    setQuizCurrentQuestionAttempted(false);

    // Pick mode: 60% fill, 30% MC, 10% match
    const rand = Math.random();
    const newMode = rand < 0.6 ? "fill" : rand < 0.9 ? "mc" : "match";
    setMode(newMode);

    const promptArgs = {
      cefrLevel,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      recentGood,
      lessonContent,
    };

    let prompt;
    if (newMode === "fill") {
      prompt = buildConjugationFillPrompt(promptArgs);
    } else if (newMode === "mc") {
      prompt = buildConjugationMCPrompt(promptArgs);
    } else {
      prompt = buildConjugationTablePrompt(promptArgs);
    }

    try {
      const stream = await simplemodel.generateContentStream(prompt);
      let buffer = "";

      for await (const chunk of stream.stream) {
        const txt = textFromChunk(chunk);
        buffer += txt;

        // Process NDJSON lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          tryConsumeLine(line, (obj) => {
            if (obj.type === "conj_fill") {
              if (obj.phase === "q") {
                setQuestion(obj.question || "");
              } else if (obj.phase === "meta") {
                setHint(obj.hint || "");
                setCorrectAnswer(obj.answer || "");
                setTranslation(obj.translation || "");
              }
            } else if (obj.type === "conj_mc") {
              if (obj.phase === "q") {
                setQuestion(obj.question || "");
              } else if (obj.phase === "choices") {
                setChoices(shuffle(obj.choices || []));
              } else if (obj.phase === "meta") {
                setHint(obj.hint || "");
                setCorrectAnswer(obj.answer || "");
                setTranslation(obj.translation || "");
              }
            } else if (obj.type === "conj_match") {
              setQuestion(obj.stem || "");
              setMatchLeft(obj.left || []);
              const shuffledRight = shuffle([...(obj.right || [])]);
              setMatchRight(shuffledRight);
              setMatchMap(normalizeMap(obj.map, (obj.left || []).length));
              setHint(obj.hint || "");
              setDragItems(shuffledRight.map((item, idx) => ({ id: `item-${idx}`, content: item })));
            }
          });
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        tryConsumeLine(buffer, (obj) => {
          if (obj.type === "conj_fill" && obj.phase === "meta") {
            setHint(obj.hint || "");
            setCorrectAnswer(obj.answer || "");
            setTranslation(obj.translation || "");
          } else if (obj.type === "conj_mc" && obj.phase === "meta") {
            setHint(obj.hint || "");
            setCorrectAnswer(obj.answer || "");
            setTranslation(obj.translation || "");
          } else if (obj.type === "conj_match") {
            setQuestion(obj.stem || "");
            setMatchLeft(obj.left || []);
            const shuffledRight = shuffle([...(obj.right || [])]);
            setMatchRight(shuffledRight);
            setMatchMap(normalizeMap(obj.map, (obj.left || []).length));
            setHint(obj.hint || "");
            setDragItems(shuffledRight.map((item, idx) => ({ id: `item-${idx}`, content: item })));
          }
        });
      }
    } catch (err) {
      console.error("Generation error:", err);
      toast({
        title: userLanguage === "es" ? "Error" : "Error",
        description:
          userLanguage === "es"
            ? "No se pudo generar la pregunta. Intenta de nuevo."
            : "Could not generate question. Please try again.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }, [
    ready,
    cefrLevel,
    targetLang,
    supportLang,
    showTranslations,
    userLanguage,
    recentGood,
    lessonContent,
    toast,
  ]);

  // Auto-generate on mount
  useEffect(() => {
    if (ready && !question && !loading) {
      generateQuestion();
    }
  }, [ready, question, loading, generateQuestion]);

  // Submit answer
  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    playSound(submitSound);
    setSubmitted(true);
    setLoading(true);

    let userAnswer = "";
    let judgePrompt = "";

    if (mode === "fill") {
      userAnswer = userInput.trim();
      judgePrompt = buildConjugationFillJudgePrompt({
        targetLang,
        question,
        userAnswer,
        hint,
      });
    } else if (mode === "mc") {
      userAnswer = selectedChoice;
      judgePrompt = buildConjugationMCJudgePrompt({
        targetLang,
        stem: question,
        choices,
        userChoice: selectedChoice,
        hint,
      });
    } else if (mode === "match") {
      // Check matching
      const allCorrect = matchLeft.every((_, idx) => {
        const expectedRightIdx = matchMap[idx];
        const expectedAnswer = matchRight[expectedRightIdx];
        const userMatch = userMatches[idx];
        return norm(userMatch) === norm(expectedAnswer);
      });
      setIsCorrect(allCorrect);
      setLoading(false);

      if (allCorrect) {
        setFeedback(userLanguage === "es" ? "¡Correcto!" : "Correct!");
        setRecentGood((prev) => [...prev, question].slice(-5));
        if (!isTutorial) {
          awardXp(npub, 5);
        }
        if (isFinalQuiz && !quizCurrentQuestionAttempted) {
          setQuizCorrectAnswers((prev) => prev + 1);
          setQuizAnswerHistory((prev) => [...prev, true]);
        }
      } else {
        setFeedback(
          userLanguage === "es"
            ? "No exactamente. Revisa las conjugaciones."
            : "Not quite. Check the conjugations."
        );
        if (isFinalQuiz && !quizCurrentQuestionAttempted) {
          setQuizAnswerHistory((prev) => [...prev, false]);
        }
      }

      if (isFinalQuiz && !quizCurrentQuestionAttempted) {
        setQuizQuestionsAnswered((prev) => prev + 1);
        setQuizCurrentQuestionAttempted(true);
      }
      return;
    }

    try {
      const result = await callResponses({
        model: MODEL,
        input: judgePrompt,
      });
      const verdict = (result || "").trim().toUpperCase();
      const correct = verdict.startsWith("YES");
      setIsCorrect(correct);

      if (correct) {
        setFeedback(userLanguage === "es" ? "¡Correcto!" : "Correct!");
        setRecentGood((prev) => [...prev, question].slice(-5));
        if (!isTutorial) {
          awardXp(npub, 5);
        }
        if (isFinalQuiz && !quizCurrentQuestionAttempted) {
          setQuizCorrectAnswers((prev) => prev + 1);
          setQuizAnswerHistory((prev) => [...prev, true]);
        }
      } else {
        const correctHint =
          mode === "fill"
            ? correctAnswer
            : correctAnswer;
        setFeedback(
          userLanguage === "es"
            ? `No exactamente. La respuesta correcta: ${correctHint}`
            : `Not quite. The correct answer: ${correctHint}`
        );
        if (isFinalQuiz && !quizCurrentQuestionAttempted) {
          setQuizAnswerHistory((prev) => [...prev, false]);
        }
      }

      if (isFinalQuiz && !quizCurrentQuestionAttempted) {
        setQuizQuestionsAnswered((prev) => prev + 1);
        setQuizCurrentQuestionAttempted(true);
      }
    } catch (err) {
      console.error("Judge error:", err);
      // Fallback to direct comparison
      const correct = norm(userAnswer) === norm(correctAnswer);
      setIsCorrect(correct);
      setFeedback(
        correct
          ? userLanguage === "es"
            ? "¡Correcto!"
            : "Correct!"
          : userLanguage === "es"
          ? `La respuesta correcta: ${correctAnswer}`
          : `The correct answer: ${correctAnswer}`
      );
    } finally {
      setLoading(false);
    }
  }, [
    submitted,
    mode,
    userInput,
    selectedChoice,
    userMatches,
    matchLeft,
    matchRight,
    matchMap,
    question,
    choices,
    hint,
    correctAnswer,
    targetLang,
    userLanguage,
    npub,
    isTutorial,
    isFinalQuiz,
    quizCurrentQuestionAttempted,
    playSound,
  ]);

  // Handle explanation request
  const handleExplain = useCallback(async () => {
    if (loadingExplanation || explanation) {
      setShowExplanation(!showExplanation);
      return;
    }
    setLoadingExplanation(true);
    setShowExplanation(true);

    try {
      const explainText = await explainAnswer({
        targetLang,
        supportLang: supportCode,
        question,
        correctAnswer,
        userAnswer: mode === "fill" ? userInput : selectedChoice,
        context: `This is a verb conjugation exercise. The hint was: "${hint}"`,
      });
      setExplanation(explainText || "");
    } catch (err) {
      console.error("Explain error:", err);
      setExplanation(
        userLanguage === "es"
          ? "No se pudo generar la explicación."
          : "Could not generate explanation."
      );
    } finally {
      setLoadingExplanation(false);
    }
  }, [
    loadingExplanation,
    explanation,
    showExplanation,
    targetLang,
    supportCode,
    question,
    correctAnswer,
    userInput,
    selectedChoice,
    mode,
    hint,
    userLanguage,
  ]);

  // TTS
  const handleSpeak = useCallback(async () => {
    if (ttsLoading || !question) return;
    setTtsLoading(true);
    try {
      const player = getTTSPlayer();
      const langTag = TTS_LANG_TAG[targetLang] || "es-ES";
      const textToSpeak = question.replace(/___/g, "...");
      await player.speak(textToSpeak, { lang: langTag, format: LOW_LATENCY_TTS_FORMAT });
    } catch (err) {
      console.error("TTS error:", err);
    } finally {
      setTtsLoading(false);
    }
  }, [ttsLoading, question, targetLang]);

  // Next question
  const handleNext = useCallback(() => {
    playSound(nextButtonSound);

    // Check quiz completion
    if (isFinalQuiz) {
      const newAnswered = quizQuestionsAnswered;
      if (newAnswered >= quizConfig.questionsRequired) {
        const passed = quizCorrectAnswers >= quizConfig.passingScore;
        setQuizCompleted(true);
        setQuizPassed(passed);
        return;
      }
    }

    generateQuestion();
  }, [
    playSound,
    isFinalQuiz,
    quizQuestionsAnswered,
    quizCorrectAnswers,
    quizConfig,
    generateQuestion,
  ]);

  // Handle drag end for matching
  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const sourceIdx = parseInt(result.source.droppableId.replace("drop-", ""), 10);
    const destIdx = parseInt(result.destination.droppableId.replace("drop-", ""), 10);

    if (result.source.droppableId === "bank") {
      // Dragging from bank to a slot
      const itemContent = dragItems[result.source.index]?.content;
      if (itemContent) {
        setUserMatches((prev) => ({
          ...prev,
          [destIdx]: itemContent,
        }));
      }
    }
  }, [dragItems]);

  // Keyboard handler
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !submitted && userInput.trim()) {
        handleSubmit();
      }
    },
    [submitted, userInput, handleSubmit]
  );

  // Quiz progress display
  const quizProgressBar = isFinalQuiz && (
    <Box w="100%" mb={4}>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="sm" color="gray.400">
          {userLanguage === "es" ? "Progreso del quiz" : "Quiz Progress"}
        </Text>
        <Text fontSize="sm" color="gray.400">
          {quizQuestionsAnswered}/{quizConfig.questionsRequired}
        </Text>
      </Flex>
      <Progress
        value={(quizQuestionsAnswered / quizConfig.questionsRequired) * 100}
        colorScheme="purple"
        borderRadius="full"
        size="sm"
      />
      <HStack mt={1} spacing={1} flexWrap="wrap">
        {quizAnswerHistory.map((correct, idx) => (
          <Box
            key={idx}
            w="8px"
            h="8px"
            borderRadius="full"
            bg={correct ? "green.400" : "red.400"}
          />
        ))}
      </HStack>
    </Box>
  );

  // Quiz completed screen
  if (isFinalQuiz && quizCompleted) {
    return (
      <Box
        p={6}
        bg="rgba(30, 41, 59, 0.95)"
        borderRadius="2xl"
        maxW="600px"
        mx="auto"
        textAlign="center"
      >
        <Text fontSize="2xl" fontWeight="bold" mb={4} color="white">
          {quizPassed
            ? userLanguage === "es"
              ? "¡Felicidades! 🎉"
              : "Congratulations! 🎉"
            : userLanguage === "es"
            ? "Quiz completado"
            : "Quiz Completed"}
        </Text>
        <Text fontSize="lg" color="gray.300" mb={4}>
          {userLanguage === "es"
            ? `Respondiste ${quizCorrectAnswers} de ${quizConfig.questionsRequired} correctamente.`
            : `You answered ${quizCorrectAnswers} out of ${quizConfig.questionsRequired} correctly.`}
        </Text>
        {!quizPassed && (
          <Button
            colorScheme="purple"
            onClick={() => {
              setQuizQuestionsAnswered(0);
              setQuizCorrectAnswers(0);
              setQuizCompleted(false);
              setQuizPassed(false);
              setQuizAnswerHistory([]);
              generateQuestion();
            }}
          >
            {userLanguage === "es" ? "Intentar de nuevo" : "Try Again"}
          </Button>
        )}
        {quizPassed && onSkip && (
          <Button colorScheme="green" onClick={onSkip}>
            {userLanguage === "es" ? "Continuar" : "Continue"}
          </Button>
        )}
      </Box>
    );
  }

  // Main render
  return (
    <Box
      p={[3, 4, 6]}
      bg="rgba(30, 41, 59, 0.95)"
      borderRadius="2xl"
      maxW="700px"
      mx="auto"
    >
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <HStack>
          <Badge colorScheme="purple" fontSize="sm" px={2} py={1} borderRadius="md">
            {userLanguage === "es" ? "Conjugación" : "Conjugation"}
          </Badge>
          <Badge colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
            {cefrLevel}
          </Badge>
        </HStack>
        <HStack>
          <Badge colorScheme="green" fontSize="xs">
            {localizedLangName(targetLang)}
          </Badge>
        </HStack>
      </Flex>

      {/* Available tenses info */}
      <Box mb={4} p={2} bg="whiteAlpha.100" borderRadius="md">
        <Text fontSize="xs" color="gray.400">
          {userLanguage === "es" ? "Tiempos verbales en este nivel:" : "Verb tenses at this level:"}
        </Text>
        <Text fontSize="xs" color="gray.300">
          {availableTenses.join(", ")}
        </Text>
      </Box>

      {quizProgressBar}

      {/* Lesson progress */}
      {lessonProgress && (
        <Box mb={4}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="sm" color="gray.400">
              {lessonProgress.label}
            </Text>
            <Text fontSize="sm" color="gray.400">
              {lessonProgress.earned}/{lessonProgress.total} XP
            </Text>
          </Flex>
          <Progress
            value={lessonProgress.pct}
            colorScheme="green"
            borderRadius="full"
            size="sm"
          />
        </Box>
      )}

      {/* Loading state */}
      {generating && (
        <Flex direction="column" align="center" py={8}>
          <Spinner size="lg" color="purple.400" mb={4} />
          <Text color="gray.400">
            {userLanguage === "es"
              ? "Generando ejercicio..."
              : "Generating exercise..."}
          </Text>
        </Flex>
      )}

      {/* Question display */}
      {!generating && question && (
        <VStack spacing={4} align="stretch">
          {/* Question with speaker */}
          <Flex align="center" gap={2}>
            <IconButton
              icon={renderSpeakerIcon(ttsLoading)}
              size="sm"
              variant="ghost"
              colorScheme="blue"
              onClick={handleSpeak}
              isLoading={ttsLoading}
              aria-label="Listen"
            />
            <Text fontSize="lg" fontWeight="medium" color="white" flex={1}>
              {question}
            </Text>
          </Flex>

          {/* Hint */}
          {hint && (
            <Box p={3} bg="whiteAlpha.100" borderRadius="md">
              <Text fontSize="sm" color="gray.300">
                💡 {hint}
              </Text>
            </Box>
          )}

          {/* Fill mode input */}
          {mode === "fill" && (
            <VStack spacing={2}>
              <Input
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  userLanguage === "es"
                    ? "Escribe la forma conjugada..."
                    : "Type the conjugated form..."
                }
                size="lg"
                bg="whiteAlpha.200"
                borderColor="whiteAlpha.300"
                color="white"
                _placeholder={{ color: "gray.500" }}
                isDisabled={submitted}
              />
              <HStack w="100%" justify="flex-end">
                <IconButton
                  icon={<MdKeyboard />}
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  aria-label="Toggle keyboard"
                />
              </HStack>
              {showKeyboard && (
                <VirtualKeyboard
                  lang={targetLang}
                  onKey={(key) => setUserInput((prev) => prev + key)}
                  onBackspace={() => setUserInput((prev) => prev.slice(0, -1))}
                />
              )}
            </VStack>
          )}

          {/* MC mode choices */}
          {mode === "mc" && choices.length > 0 && (
            <RadioGroup
              value={selectedChoice}
              onChange={(val) => {
                playSound(selectSound);
                setSelectedChoice(val);
              }}
              isDisabled={submitted}
            >
              <Stack spacing={2}>
                {choices.map((choice, idx) => (
                  <Box
                    key={idx}
                    p={3}
                    bg={
                      submitted && norm(choice) === norm(correctAnswer)
                        ? "green.900"
                        : submitted &&
                          selectedChoice === choice &&
                          !isCorrect
                        ? "red.900"
                        : selectedChoice === choice
                        ? "purple.900"
                        : "whiteAlpha.100"
                    }
                    borderRadius="md"
                    borderWidth="2px"
                    borderColor={
                      submitted && norm(choice) === norm(correctAnswer)
                        ? "green.400"
                        : submitted &&
                          selectedChoice === choice &&
                          !isCorrect
                        ? "red.400"
                        : selectedChoice === choice
                        ? "purple.400"
                        : "transparent"
                    }
                    cursor={submitted ? "default" : "pointer"}
                    onClick={() => !submitted && setSelectedChoice(choice)}
                    _hover={
                      !submitted ? { bg: "whiteAlpha.200" } : undefined
                    }
                  >
                    <Radio value={choice} colorScheme="purple">
                      <Text color="white">{choice}</Text>
                    </Radio>
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          )}

          {/* Match mode */}
          {mode === "match" && matchLeft.length > 0 && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <VStack spacing={3}>
                {matchLeft.map((leftItem, idx) => (
                  <HStack key={idx} w="100%" justify="space-between">
                    <Box
                      p={2}
                      bg="whiteAlpha.200"
                      borderRadius="md"
                      minW="100px"
                      textAlign="center"
                    >
                      <Text color="white" fontWeight="medium">
                        {leftItem}
                      </Text>
                    </Box>
                    <Text color="gray.400">→</Text>
                    <Droppable droppableId={`drop-${idx}`}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          p={2}
                          bg={
                            submitted
                              ? norm(userMatches[idx]) ===
                                norm(matchRight[matchMap[idx]])
                                ? "green.900"
                                : "red.900"
                              : snapshot.isDraggingOver
                              ? "purple.900"
                              : "whiteAlpha.200"
                          }
                          borderRadius="md"
                          minW="120px"
                          minH="40px"
                          textAlign="center"
                          borderWidth="2px"
                          borderColor={
                            submitted
                              ? norm(userMatches[idx]) ===
                                norm(matchRight[matchMap[idx]])
                                ? "green.400"
                                : "red.400"
                              : snapshot.isDraggingOver
                              ? "purple.400"
                              : "transparent"
                          }
                        >
                          {userMatches[idx] ? (
                            <Text color="white">{userMatches[idx]}</Text>
                          ) : (
                            <Text color="gray.500" fontSize="sm">
                              {userLanguage === "es" ? "arrastra aquí" : "drop here"}
                            </Text>
                          )}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </HStack>
                ))}

                {/* Word bank */}
                <Box mt={4} p={3} bg="whiteAlpha.100" borderRadius="md" w="100%">
                  <Text fontSize="sm" color="gray.400" mb={2}>
                    {userLanguage === "es" ? "Banco de palabras:" : "Word bank:"}
                  </Text>
                  <Droppable droppableId="bank" direction="horizontal">
                    {(provided) => (
                      <HStack
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        flexWrap="wrap"
                        spacing={2}
                      >
                        {dragItems.map((item, idx) => (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={idx}
                            isDragDisabled={submitted}
                          >
                            {(provided, snapshot) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                p={2}
                                bg={
                                  snapshot.isDragging
                                    ? "purple.600"
                                    : "purple.800"
                                }
                                borderRadius="md"
                                cursor={submitted ? "default" : "grab"}
                                opacity={
                                  Object.values(userMatches).includes(
                                    item.content
                                  )
                                    ? 0.4
                                    : 1
                                }
                              >
                                <Text color="white" fontSize="sm">
                                  {item.content}
                                </Text>
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </HStack>
                    )}
                  </Droppable>
                </Box>
              </VStack>
            </DragDropContext>
          )}

          {/* Translation */}
          {submitted && translation && (
            <Box p={3} bg="whiteAlpha.100" borderRadius="md">
              <Text fontSize="sm" color="gray.400">
                {userLanguage === "es" ? "Traducción:" : "Translation:"}
              </Text>
              <Text color="gray.200">{translation}</Text>
            </Box>
          )}

          {/* Feedback */}
          {feedback && (
            <Box
              p={3}
              bg={isCorrect ? "green.900" : "red.900"}
              borderRadius="md"
              borderWidth="2px"
              borderColor={isCorrect ? "green.400" : "red.400"}
            >
              <Text color="white" fontWeight="medium">
                {feedback}
              </Text>
            </Box>
          )}

          {/* Explanation */}
          {submitted && (
            <Button
              variant="ghost"
              colorScheme="blue"
              size="sm"
              onClick={handleExplain}
              isLoading={loadingExplanation}
            >
              {showExplanation
                ? userLanguage === "es"
                  ? "Ocultar explicación"
                  : "Hide explanation"
                : userLanguage === "es"
                ? "Explícame"
                : "Explain to me"}
            </Button>
          )}

          {showExplanation && explanation && (
            <Box p={3} bg="blue.900" borderRadius="md">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <Text color="gray.200" fontSize="sm" mb={2}>
                      {children}
                    </Text>
                  ),
                }}
              >
                {explanation}
              </ReactMarkdown>
            </Box>
          )}

          {/* Action buttons */}
          <HStack justify="center" spacing={4} pt={4}>
            {!submitted ? (
              <Button
                colorScheme="purple"
                size="lg"
                onClick={handleSubmit}
                isLoading={loading}
                isDisabled={
                  (mode === "fill" && !userInput.trim()) ||
                  (mode === "mc" && !selectedChoice) ||
                  (mode === "match" &&
                    Object.keys(userMatches).length !== matchLeft.length)
                }
              >
                {userLanguage === "es" ? "Comprobar" : "Check"}
              </Button>
            ) : (
              <Button colorScheme="green" size="lg" onClick={handleNext}>
                {userLanguage === "es" ? "Siguiente" : "Next"}
              </Button>
            )}
          </HStack>

          {/* Help button */}
          {onSendHelpRequest && (
            <Flex justify="center" mt={2}>
              <Button
                variant="ghost"
                colorScheme="gray"
                size="sm"
                leftIcon={<MdOutlineSupportAgent />}
                onClick={() =>
                  onSendHelpRequest({
                    type: "verb_conjugation",
                    question,
                    hint,
                    mode,
                  })
                }
              >
                {userLanguage === "es" ? "Pedir ayuda" : "Ask for help"}
              </Button>
            </Flex>
          )}
        </VStack>
      )}

      {/* Robot buddy */}
      <Box position="fixed" bottom={4} right={4} zIndex={10}>
        <RobotBuddyPro
          mood={
            generating
              ? "thinking"
              : isCorrect === true
              ? "happy"
              : isCorrect === false
              ? "confused"
              : "neutral"
          }
          size="sm"
        />
      </Box>
    </Box>
  );
}
