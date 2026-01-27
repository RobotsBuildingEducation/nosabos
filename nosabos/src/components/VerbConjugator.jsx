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
  Checkbox,
  CheckboxGroup,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
} from "@chakra-ui/react";
import { doc, onSnapshot, setDoc, increment } from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { database, simplemodel } from "../firebaseResources/firebaseResources"; // ✅ streaming model
import useUserStore from "../hooks/useUserStore";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { WaveBar } from "./WaveBar";
import { SpeakSuccessCard } from "./SpeakSuccessCard";
import RobotBuddyPro from "./RobotBuddyPro";
import translations from "../utils/translation";
import { MdOutlineSupportAgent } from "react-icons/md";
import { PiSpeakerHighDuotone, PiMicrophoneStageDuotone } from "react-icons/pi";
import { RiStopCircleLine } from "react-icons/ri";
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
  TTS_LANG_TAG,
  getRandomVoice,
  getTTSPlayer,
  LOW_LATENCY_TTS_FORMAT,
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

// Safely consume a line with potential JSON content (NDJSON style)
function tryConsumeLine(line, cb) {
  const s = line.indexOf("{");
  const e = line.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return;
  try {
    const obj = JSON.parse(line.slice(s, e + 1));
    cb?.(obj);
  } catch {
    // ignore parse noise
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
  // ✅ ready flag so we know when user settings have been loaded once
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!npub) {
      setReady(true); // no user -> use defaults immediately
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
      setReady(true); // ✅ we’ve received user settings
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
  const simpleTenses = ["simple present", "simple past", "simple future"];
  // Intermediate adds more complexity
  const intermediateTenses = [
    ...simpleTenses,
    "conditional",
    "present perfect",
    "past perfect",
  ];
  // Advanced adds subjunctive and more
  const advancedTenses = [
    ...intermediateTenses,
    "subjunctive present",
    "subjunctive past",
    "passive voice",
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

function verbDifficulty(cefrLevel) {
  // Use CEFR level for difficulty hint
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
   Prompts — STREAM-FIRST (NDJSON phases)
--------------------------- */
/* FILL phases:
   1) {"type":"verb_fill","phase":"q","question":"..."}
   2) {"type":"verb_fill","phase":"meta","hint":"...","translation":"..."}
   3) {"type":"done"}
*/
function buildFillVerbStreamPrompt({
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
  const wantTR =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = verbDifficulty(cefrLevel);

  // Get appropriate tenses for this CEFR level
  const availableTenses = getVerbTensesForLevel(cefrLevel);
  const tenseToTest = availableTenses[Math.floor(Math.random() * availableTenses.length)];

  // Special handling for tutorial mode - use very simple verb conjugation
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE verb conjugation question. Use the verb "ser" (to be) or "tener" (to have) in simple present tense. Example: "Yo ___ estudiante" (answer: soy). Keep everything at absolute beginner level.`
    : lessonContent?.focusPoints || lessonContent?.topic
    ? `- STRICT REQUIREMENT: Focus on verb tense: ${lessonContent.topic || tenseToTest}. Use verbs/tenses from: ${JSON.stringify(
        lessonContent.focusPoints || [tenseToTest]
      )}. This is lesson-specific content.`
    : `- Focus on the ${tenseToTest} tense. Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE short ${TARGET} VERB CONJUGATION sentence with a single blank "___" where a CONJUGATED VERB goes. Difficulty: ${diff}`,
    `- ≤ 120 chars; natural context that shows which tense/person is needed.`,
    `- The blank MUST be for a conjugated verb form, NOT vocabulary.`,
    topicDirective,
    `- Hint in ${SUPPORT} (≤ 12 words): include the INFINITIVE form, the SUBJECT, and the TENSE name.`,
    wantTR
      ? `- ${SUPPORT} translation of the full sentence.`
      : `- Empty translation "".`,
    "",
    "Stream as NDJSON in phases:",
    `{"type":"verb_fill","phase":"q","question":"<sentence with ___ for verb in ${TARGET}>"}  // emit ASAP`,
    `{"type":"verb_fill","phase":"meta","hint":"<${SUPPORT} hint with infinitive, subject, tense>","translation":"<${SUPPORT} translation or empty>"}  // then`,
    `{"type":"done"}`,
  ].join("\n");
}

/* MC phases:
   1) {"type":"verb_mc","phase":"q","question":"..."}
   2) {"type":"verb_mc","phase":"choices","choices":["<choice1>","<choice2>","<choice3>","<choice4>"]}
   3) {"type":"verb_mc","phase":"meta","hint":"...","answer":"...","translation":"..."}
   4) {"type":"done"}
*/
function buildMCVerbStreamPrompt({
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
  const wantTR =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = verbDifficulty(cefrLevel);

  // Get appropriate tenses for this CEFR level
  const availableTenses = getVerbTensesForLevel(cefrLevel);
  const tenseToTest = availableTenses[Math.floor(Math.random() * availableTenses.length)];

  // Special handling for tutorial mode
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE verb conjugation question. Use "ser" (to be) or "tener" (to have) in simple present. Keep at absolute beginner level.`
    : lessonContent?.focusPoints || lessonContent?.topic
    ? `- STRICT REQUIREMENT: Focus on verb tense: ${lessonContent.topic || tenseToTest}. Use verbs/tenses from: ${JSON.stringify(
        lessonContent.focusPoints || [tenseToTest]
      )}. This is lesson-specific content.`
    : `- Focus on the ${tenseToTest} tense. Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE ${TARGET} VERB CONJUGATION multiple-choice question (exactly one correct). Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    `- Stem ≤120 chars with a blank "___" where the conjugated verb goes.`,
    `- All 4 choices must be DIFFERENT CONJUGATIONS of the SAME verb (different persons, tenses, or moods).`,
    `- Only ONE choice is correct for the given subject and context.`,
    topicDirective,
    `- Hint in ${SUPPORT} (≤12 words): include INFINITIVE, SUBJECT, and TENSE.`,
    wantTR ? `- ${SUPPORT} translation of stem.` : `- Empty translation "".`,
    "",
    "Stream as NDJSON:",
    `{"type":"verb_mc","phase":"q","question":"<stem in ${TARGET} with ___ for verb>"}  // first`,
    `{"type":"verb_mc","phase":"choices","choices":["<conjugation1>","<conjugation2>","<conjugation3>","<conjugation4>"]}  // second`,
    `{"type":"verb_mc","phase":"meta","hint":"<${SUPPORT} hint with infinitive, subject, tense>","answer":"<exact correct conjugation>","translation":"<${SUPPORT} translation or empty>"} // third`,
    `{"type":"done"}`,
  ].join("\n");
}

/* MA phases:
   1) {"type":"verb_ma","phase":"q","question":"..."}
   2) {"type":"verb_ma","phase":"choices","choices":["..."]} // 5–6
   3) {"type":"verb_ma","phase":"meta","hint":"...","answers":["...","..."],"translation":"..."} // EXACTLY 2 or 3
   4) {"type":"done"}
*/
function buildMAVerbStreamPrompt({
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
  const wantTR =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = verbDifficulty(cefrLevel);
  const numBlanks = Math.random() < 0.5 ? 2 : 3;

  // If lesson content is provided, use specific vocabulary/topic
  // Special handling for tutorial mode - use very simple "hello" content only
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE question about basic greetings only. The correct answers MUST be greeting words like "hello", "hola", "hi", "buenos días", "good morning", etc. Keep everything at absolute beginner level.`
    : lessonContent?.words || lessonContent?.topic
    ? lessonContent.words
      ? `- STRICT REQUIREMENT: The correct answers MUST come from this exact list: ${JSON.stringify(
          lessonContent.words
        )}. Do NOT use any other words. This is lesson-specific content and you MUST NOT diverge.`
      : `- STRICT REQUIREMENT: The vocabulary MUST be directly related to: ${lessonContent.topic}. Do NOT use unrelated vocabulary. This is lesson-specific content.`
    : `- Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE ${TARGET} verb conjugation fill-in-the-blanks question with EXACTLY ${numBlanks} blanks. Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    `- Create a sentence in ${TARGET} with EXACTLY ${numBlanks} blanks written as "___" where ${TARGET} vocabulary words should be inserted.`,
    `- The sentence should test verb conjugation by having the learner fill in ${TARGET} words.`,
    `- Each blank has EXACTLY ONE correct answer. The "answers" array MUST have EXACTLY ${numBlanks} items, one for each blank IN ORDER.`,
    `- Example: A ${TARGET} sentence like "Yo ___ al parque todos los ___" with answers ["voy", "días"] means blank 1 = voy, blank 2 = días.`,
    `- 5–6 distinct single-word choices in ${TARGET}. Include the ${numBlanks} correct answers plus 2-4 distractors.`,
    `- CRITICAL: Each choice MUST be a single ${TARGET} word. NEVER combine words with "/" or "or".`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    wantTR
      ? `- ${SUPPORT} translation showing the complete sentence.`
      : `- Empty translation "".`,
    topicDirective,
    "",
    "Stream as NDJSON:",
    `{"type":"verb_ma","phase":"q","question":"<${TARGET} sentence with EXACTLY ${numBlanks} ___ blanks for ${TARGET} words>"}  // first`,
    `{"type":"verb_ma","phase":"choices","choices":["<${TARGET} word1>","<${TARGET} word2>","..."]}  // second, 5-6 single words`,
    `{"type":"verb_ma","phase":"meta","hint":"<${SUPPORT} hint>","answers":["<answer for blank 1>","<answer for blank 2>"${
      numBlanks === 3 ? ',"<answer for blank 3>"' : ""
    }],"translation":"<${SUPPORT} translation or empty>"} // third`,
    `{"type":"done"}`,
  ].join("\n");
}

/* SPEAK phases:
   1) {"type":"vocab_speak","phase":"prompt","target":"<word>","prompt":"<instruction>"}
   2) {"type":"vocab_speak","phase":"meta","hint":"...","translation":"..."}
   3) {"type":"done"}
*/
function buildSpeakVocabStreamPrompt({
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
  const wantTR =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = verbDifficulty(cefrLevel);
  const allowTranslate =
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);

  // If lesson content is provided, use specific vocabulary/topic
  // Special handling for tutorial mode - use very simple "hello" content only
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE speaking practice about basic greetings only. The word/phrase MUST be "hello", "hola", "hi", or a simple greeting. Keep everything at absolute beginner level.`
    : lessonContent?.words || lessonContent?.topic
    ? lessonContent.words
      ? `- STRICT REQUIREMENT: The word/phrase being practiced MUST be from this exact list: ${JSON.stringify(
          lessonContent.words
        )}. Do NOT use any other words. This is lesson-specific content and you MUST NOT diverge.`
      : `- STRICT REQUIREMENT: The vocabulary MUST be directly related to: ${lessonContent.topic}. Do NOT use unrelated vocabulary. This is lesson-specific content.`
    : `- Consider learner recent successes: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE ${TARGET} speaking drill (difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }). Choose VARIANT:`,
    `- repeat: show the ${TARGET} word/phrase (≤4 words) to repeat aloud.`,
    allowTranslate
      ? `- translate: show a ${SUPPORT} word/phrase (≤3 words) and have them speak the ${TARGET} translation aloud.`
      : `- translate: SKIP when support language equals ${TARGET}.`,
    `- complete: show a ${TARGET} sentence (≤120 chars) with ___ and have them speak the completed sentence aloud.`,
    topicDirective,
    `- Provide a concise instruction sentence in ${TARGET} (≤120 chars).`,
    `- Include a hint in ${SUPPORT} (≤10 words).`,
    wantTR
      ? `- Provide a ${SUPPORT} translation of the stimulus or completed sentence.`
      : `- Use empty translation "".`,
    "",
    "Stream as NDJSON:",
    `{"type":"vocab_speak","phase":"prompt","variant":"repeat|translate|complete","display":"<text shown to learner>","target":"<${TARGET} output to evaluate>","prompt":"<instruction in ${TARGET}>"}`,
    `{"type":"vocab_speak","phase":"meta","hint":"<${SUPPORT} hint>","translation":"<${SUPPORT} translation or empty>"}`,
    `{"type":"done"}`,
  ].join("\n");
}

function normalizeSpeakVariant(variant) {
  const v = (variant || "").toString().toLowerCase();
  return ["repeat", "translate", "complete"].includes(v) ? v : "repeat";
}

/* MATCH phases:
   1) {"type":"verb_match","stem":"...","left":["w1",...],"right":["def1",...],"hint":"..."}
   2) {"type":"done"}
   Left in TARGET (words), Right in SUPPORT (short defs), 3–6 rows
*/
function buildMatchVerbStreamPrompt({
  targetLang,
  supportLang,
  appUILang,
  cefrLevel,
  recentGood,
  lessonContent = null,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const diff = verbDifficulty(cefrLevel);

  // If lesson content is provided, use specific vocabulary/topic
  // Special handling for tutorial mode - use very simple "hello" content only
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE matching exercise about basic greetings only. The left column MUST contain ONLY greeting words like "hello", "hola", "hi", "buenos días", "good morning", "goodbye", etc. Keep everything at absolute beginner level.`
    : lessonContent?.words || lessonContent?.topic
    ? lessonContent.words
      ? `- STRICT REQUIREMENT: The left column MUST contain ONLY words from this list: ${JSON.stringify(
          lessonContent.words
        )}. Do NOT use any other words. Select 3-6 words from this list ONLY. This is lesson-specific content and you MUST NOT diverge.`
      : `- STRICT REQUIREMENT: All words MUST be directly related to: ${lessonContent.topic}. Do NOT use unrelated vocabulary. This is lesson-specific content.`
    : `- Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE ${TARGET} vocabulary matching exercise. Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    topicDirective,
    `- Left column: ${TARGET} words (3–6 items, unique).`,
    `- Right column: ${SUPPORT} short definitions (unique).`,
    `- Clear 1:1 mapping; ≤ 4 words per item.`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    "",
    "Emit exactly TWO NDJSON lines:",
    `{"type":"verb_match","stem":"<${TARGET} stem>","left":["<word>", "..."],"right":["<short ${SUPPORT} definition>", "..."],"hint":"<${SUPPORT} hint>"}`,
    `{"type":"done"}`,
  ].join("\n");
}

/* ---------------------------
   Prompts — JUDGE (lenient)
--------------------------- */
function buildFillVerbJudgePrompt({
  targetLang,
  level,
  sentence,
  userAnswer,
  hint,
}) {
  const TARGET = LANG_NAME(targetLang);
  const filled = sentence.replace(/_{2,}/, String(userAnswer || "").trim());
  return `
Judge a VERB CONJUGATION fill-in-the-blank in ${TARGET} with leniency.

Sentence:
${sentence}

User's conjugated verb:
${userAnswer}

Filled sentence:
${filled}

Hint (contains infinitive, subject, tense):
${hint || ""}

Policy:
- Say YES if the verb conjugation is correct for the given subject and tense.
- Focus on whether the conjugation matches the subject (person/number) and tense indicated.
- Allow minor spelling variations and accent mark differences.
- Be lenient with regional variations (e.g., vosotros vs ustedes forms).
- Accept both formal and informal forms if context allows.
- IMPORTANT: Multiple correct conjugations may be valid depending on context.
- Be lenient - if the conjugation makes grammatical sense, say YES.

Reply ONE WORD ONLY: YES or NO
`.trim();
}

function buildMCVerbJudgePrompt({
  targetLang,
  stem,
  choices,
  userChoice,
  hint,
}) {
  const TARGET = LANG_NAME(targetLang);
  const listed = choices.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return `
Judge a ${TARGET} VERB CONJUGATION multiple-choice answer.

Stem:
${stem}

Choices:
${listed}

User selected:
${userChoice}

Hint (contains infinitive, subject, tense):
${hint || ""}

Rules:
- Say YES if the selected verb conjugation is correct for the subject and tense in context.
- Focus on person, number, and tense correctness.
- Allow regional variations (vosotros/ustedes, tú/vos).
- Allow minor spelling/accent variations.
- IMPORTANT: Multiple conjugations may be valid depending on context.
- Be lenient - if the conjugation makes grammatical sense, say YES.

Reply ONE WORD ONLY: YES or NO
`.trim();
}

function buildMAVerbJudgePrompt({
  targetLang,
  stem,
  choices,
  userSelections,
  hint,
}) {
  const TARGET = LANG_NAME(targetLang);
  const listed = choices.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const picked = userSelections.map((c) => `- ${c}`).join("\n");
  return `
Judge a ${TARGET} VERB CONJUGATION multiple-answer response (order irrelevant).

Stem:
${stem}

Choices:
${listed}

User selected:
${picked || "(none)"}

Hint (contains infinitive, subject, tense):
${hint || ""}

Policy:
- Determine which verb conjugations are correct for the context.
- Say YES if the user's selection includes ALL correct conjugations and NO incorrect ones.
- Focus on person, number, and tense correctness.
- Allow regional variations and minor spelling differences.
- Be lenient, good enough answers are acceptable.

Reply ONE WORD ONLY: YES or NO
`.trim();
}

function buildMatchVerbJudgePrompt({ stem, left, right, userPairs, hint }) {
  const L = left.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const R = right.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const U =
    userPairs
      .map(
        ([li, ri]) =>
          `L${li + 1} -> R${ri + 1}  (${left[li]} -> ${right[ri] || "(none)"})`
      )
      .join("\n") || "(none)";

  return `
Judge a VERB CONJUGATION matching task with leniency.

Stem:
${stem}

Left (subjects/pronouns):
${L}

Right (conjugated forms):
${R}

User mapping (1:1 intended):
${U}

Rules:
- Say YES if each subject/pronoun is matched to the correct conjugated verb form.
- Focus on person and number agreement.
- Allow minor spelling/accent variations.
- If any mapping is wrong or missing, say NO.

Reply ONE WORD ONLY:
YES or NO
`.trim();
}

/* TRANSLATE — word-bank sentence translation (Vocabulary) */
function buildVerbTranslateStreamPrompt({
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
  const diff = verbDifficulty(cefrLevel);

  // Determine source and answer languages based on direction
  const isTargetToSupport = direction === "target-to-support";
  const SOURCE_LANG = isTargetToSupport ? TARGET : SUPPORT;
  const ANSWER_LANG = isTargetToSupport ? SUPPORT : TARGET;

  // Special handling for tutorial mode
  const isTutorial = lessonContent?.topic === "tutorial";
  const exampleSentence = isTargetToSupport
    ? `Example: "El gato es negro" -> "The cat is black"`
    : `Example: "The cat is black" -> "El gato es negro"`;
  const topicDirective = isTutorial
    ? `- TUTORIAL MODE: Create a VERY SIMPLE sentence using basic vocabulary only. ${exampleSentence}. Use only common words. Keep everything at absolute beginner level.`
    : lessonContent?.words || lessonContent?.topic
    ? [
        lessonContent.words
          ? `- STRICT REQUIREMENT: Use words from this list: ${JSON.stringify(
              lessonContent.words
            )}. This is lesson-specific vocabulary.`
          : null,
        lessonContent.topic
          ? `- STRICT REQUIREMENT: Focus on vocabulary topic: ${lessonContent.topic}.`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `- Consider learner recent corrects: ${JSON.stringify(
        recentGood.slice(-3)
      )}`;

  return [
    `Create ONE sentence translation exercise for VOCABULARY. Difficulty: ${
      isTutorial ? "absolute beginner, very easy" : diff
    }`,
    `- Source sentence in ${SOURCE_LANG} (4-8 words, showcasing vocabulary).`,
    `- Correct translation as array of ${ANSWER_LANG} words in order.`,
    `- Provide 3-5 distractor words in ${ANSWER_LANG} that are plausible but incorrect.`,
    `- Hint in ${SUPPORT} (≤8 words) about key vocabulary.`,
    topicDirective,
    "",
    "Stream as NDJSON:",
    `{"type":"translate","phase":"q","sentence":"<${SOURCE_LANG} sentence>"}`,
    `{"type":"translate","phase":"answer","correctWords":["word1","word2",...],"distractors":["wrong1","wrong2",...]}`,
    `{"type":"translate","phase":"meta","hint":"<${SUPPORT} hint>"}`,
    `{"type":"done"}`,
  ].join("\n");
}

function buildVocabTranslateJudgePrompt({
  sourceLang,
  answerLang,
  sentence,
  correctWords,
  userWords,
}) {
  const SOURCE = LANG_NAME(sourceLang);
  const ANSWER = LANG_NAME(answerLang);
  return `
Judge a VOCABULARY translation exercise.

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
   Utilities
--------------------------- */
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
  onExitQuiz = null,
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

  // Debug: Log lesson content to verify it's passed correctly
  console.log("[Vocabulary Component] lessonContent:", lessonContent);
  console.log("[Vocabulary Component] CEFR Level:", cefrLevel);
  if (lessonContent?.words) {
    console.log("[Vocabulary Component] Specific words:", lessonContent.words);
  }

  // Quiz mode state
  const [quizQuestionsAnswered, setQuizQuestionsAnswered] = useState(0);
  const [quizCorrectAnswers, setQuizCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizCurrentQuestionAttempted, setQuizCurrentQuestionAttempted] =
    useState(false);
  const [showQuizSuccessModal, setShowQuizSuccessModal] = useState(false);
  const [showQuizFailureModal, setShowQuizFailureModal] = useState(false);
  const [quizAnswerHistory, setQuizAnswerHistory] = useState([]); // Track correct/wrong for progress bar

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

      const safeAnswered = Number.isFinite(answered) ? answered : 0;
      const safeCorrect = Number.isFinite(correct) ? correct : 0;
      const safeCompleted = Boolean(completed);

      setQuizQuestionsAnswered(safeAnswered);
      setQuizCorrectAnswers(safeCorrect);
      setQuizCompleted(safeCompleted);
      setQuizPassed(Boolean(passed));
      setQuizAnswerHistory(Array.isArray(history) ? history : []);

      // If the quiz was still in progress, allow the learner to answer again
      // rather than keeping the previous "attempted" lock from localStorage.
      const attempted = Boolean(currentAttempted);
      setQuizCurrentQuestionAttempted(safeCompleted ? attempted : false);
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

  // UI language labels
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
  const supportName = localizedLangName(supportCode);
  const targetName = localizedLangName(targetLang);
  const levelLabel = t(`onboarding_level_${level}`) || level;
  // Voice will be randomly selected for each TTS call via getRandomVoice()

  const recentCorrectRef = useRef([]);

  const [mode, setMode] = useState("fill"); // "fill" | "mc" | "ma" | "speak" | "match" | "translate"
  // ✅ always randomize (no manual lock controls in the UI)
  const lockedType = null;

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

    playSound(submitSound);
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
    // Mark current question as attempted (prevents multiple submissions)
    setQuizCurrentQuestionAttempted(true);

    const newQuestionsAnswered = quizQuestionsAnswered + 1;
    const newCorrectAnswers = isCorrect
      ? quizCorrectAnswers + 1
      : quizCorrectAnswers;
    const newWrongAnswers = newQuestionsAnswered - newCorrectAnswers;

    // Add to answer history for progress bar animation
    setQuizAnswerHistory((prev) => [...prev, isCorrect]);

    setQuizQuestionsAnswered(newQuestionsAnswered);
    setQuizCorrectAnswers(newCorrectAnswers);

    // Check for early failure: if user has 3+ wrong answers, they can't pass anymore
    const maxAllowedWrong =
      quizConfig.questionsRequired - quizConfig.passingScore; // 10 - 8 = 2
    if (newWrongAnswers > maxAllowedWrong) {
      setQuizCompleted(true);
      setQuizPassed(false);
      setShowQuizFailureModal(true);
      return;
    }

    // Check for success: user has reached passing score
    if (newCorrectAnswers >= quizConfig.passingScore) {
      setQuizCompleted(true);
      setQuizPassed(true);
      setShowQuizSuccessModal(true);
      return;
    }

    // Check if all questions answered (normal completion)
    if (newQuestionsAnswered >= quizConfig.questionsRequired) {
      const passed = newCorrectAnswers >= quizConfig.passingScore;
      setQuizCompleted(true);
      setQuizPassed(passed);

      if (passed) {
        setShowQuizSuccessModal(true);
      } else {
        setShowQuizFailureModal(true);
      }
    }
  }

  async function handleExplainAnswer() {
    if (!currentQuestionData || isLoadingExplanation || explanationText) return;

    playSound(submitSound);
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
    setRecentXp(0);
    setExplanationText("");
    setAssistantSupportText("");
    setCurrentQuestionData(null);
    setNextAction(null);
    setNoteCreated(false);

    // In lesson mode (non-quiz), move to next module
    if (onSkip && !isFinalQuiz) {
      onSkip();
      return;
    }

    // Reset quiz question attempted flag for next question
    if (isFinalQuiz) {
      setQuizCurrentQuestionAttempted(false);
    }

    // In random/quiz mode, generate next question
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
      const concept = question || correctAnswer || "Vocabulary practice";

      const { example, summary } = await generateNoteContent({
        concept,
        userAnswer,
        wasCorrect: lastOk,
        targetLang,
        supportLang: supportCode,
        cefrLevel,
        moduleType: "vocabulary",
      });

      const lessonTitle = lesson?.title || {
        en: "Vocabulary",
        es: "Vocabulario",
      };

      const note = buildNoteObject({
        lessonTitle,
        cefrLevel,
        example,
        summary,
        targetLang,
        supportLang: supportCode,
        moduleType: "vocabulary",
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

  // Quiz modal handlers
  function resetQuizState() {
    setQuizQuestionsAnswered(0);
    setQuizCorrectAnswers(0);
    setQuizCompleted(false);
    setQuizPassed(false);
    setQuizCurrentQuestionAttempted(false);
    setQuizAnswerHistory([]);
    setShowQuizFailureModal(false);
    setShowQuizSuccessModal(false);
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);
    if (quizStorageKey && typeof window !== "undefined") {
      localStorage.removeItem(quizStorageKey);
    }
  }

  function handleRetryQuiz() {
    // Reset all quiz state
    resetQuizState();
    // Start a new question
    const runner = lockedType
      ? generatorFor(lockedType)
      : pickRandomGenerator();
    if (runner) runner();
  }

  function handleExitQuiz() {
    resetQuizState();
    if (onExitQuiz) {
      onExitQuiz();
      return;
    }
    // Navigate back to skill tree (fallback for legacy navigation)
    if (typeof window !== "undefined") {
      window.history.back();
    }
  }

  function handleSkip() {
    // Skip button is disabled in quiz mode
    if (isFinalQuiz) return;

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
    const runner = lockedType
      ? generatorFor(lockedType)
      : generateRandomRef.current;
    if (typeof runner === "function") {
      runner();
    }
  }

  // ---- FILL (vocab) ----
  const [qFill, setQFill] = useState("");
  const [hFill, setHFill] = useState("");
  const [trFill, setTrFill] = useState("");
  const [ansFill, setAnsFill] = useState("");
  const [resFill, setResFill] = useState(""); // log only
  const [loadingQFill, setLoadingQFill] = useState(false);
  const [loadingGFill, setLoadingGFill] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  // ---- MC (vocab) ----
  const [qMC, setQMC] = useState("");
  const [hMC, setHMC] = useState("");
  const [choicesMC, setChoicesMC] = useState([]);
  const [answerMC, setAnswerMC] = useState("");
  const [trMC, setTrMC] = useState("");
  const [pickMC, setPickMC] = useState("");
  const [mcLayout, setMcLayout] = useState("buttons");
  const [mcBankOrder, setMcBankOrder] = useState([]);
  const [mcSlotIndex, setMcSlotIndex] = useState(null);
  const [resMC, setResMC] = useState(""); // log only
  const [loadingQMC, setLoadingQMC] = useState(false);
  const [loadingGMC, setLoadingGMC] = useState(false);

  // ---- MA (vocab) ----
  const [qMA, setQMA] = useState("");
  const [hMA, setHMA] = useState("");
  const [choicesMA, setChoicesMA] = useState([]);
  const [answersMA, setAnswersMA] = useState([]);
  const [trMA, setTrMA] = useState("");
  const [picksMA, setPicksMA] = useState([]);
  const [maLayout, setMaLayout] = useState("buttons");
  const [maSlots, setMaSlots] = useState([]);
  const [maBankOrder, setMaBankOrder] = useState([]);
  const [resMA, setResMA] = useState(""); // log only
  const [loadingQMA, setLoadingQMA] = useState(false);
  const [loadingGMA, setLoadingGMA] = useState(false);

  // ---- SPEAK (vocab) ----
  const [sPrompt, setSPrompt] = useState("");
  const [sTarget, setSTarget] = useState("");
  const [sStimulus, setSStimulus] = useState("");
  const [sVariant, setSVariant] = useState("repeat");
  const [sHint, setSHint] = useState("");
  const [sTranslation, setSTranslation] = useState("");
  const [sRecognized, setSRecognized] = useState("");
  const [sEval, setSEval] = useState(null);
  const [loadingQSpeak, setLoadingQSpeak] = useState(false);
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
      if (questionAudioUrlRef.current) {
        try {
          URL.revokeObjectURL(questionAudioUrlRef.current);
        } catch {}
        questionAudioUrlRef.current = null;
      }
      if (speakAudioUrlRef.current) {
        try {
          URL.revokeObjectURL(speakAudioUrlRef.current);
        } catch {}
        speakAudioUrlRef.current = null;
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
  }, [qMC, qMA, targetLang]);

  // ---- MATCH (DnD) ----
  const [mStem, setMStem] = useState("");
  const [mHint, setMHint] = useState("");
  const [mLeft, setMLeft] = useState([]); // words (TARGET)
  const [mRight, setMRight] = useState([]); // definitions (SUPPORT)
  const [mSlots, setMSlots] = useState([]); // per-left: rightIndex|null
  const [mBank, setMBank] = useState([]); // right indices not used
  const [mResult, setMResult] = useState(""); // log only
  const [loadingMG, setLoadingMG] = useState(false);
  const [loadingMJ, setLoadingMJ] = useState(false);

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

  /* ---------------------------
     GENERATOR DISPATCH
  --------------------------- */
  useEffect(() => {
    setQuestionTTsLang(targetLang);
  }, [targetLang]);

  const repeatOnlyQuestions = false; // Temporary UI testing toggle (false = full UI mix)
  const types = repeatOnlyQuestions
    ? ["repeat"]
    : ["fill", "mc", "ma", "speak", "match", "translate", "repeat"];
  const typeDeckRef = useRef([]);
  const generateRandomRef = useRef(() => {});
  const mcKeyRef = useRef("");
  const maKeyRef = useRef("");
  // Track previous answer values to detect user input changes
  const prevAnsFillRef = useRef("");
  const prevPickMCRef = useRef("");
  const prevPicksMARef = useRef([]);
  const prevMSlotsRef = useRef([]);
  function generatorFor(type) {
    switch (type) {
      case "fill":
        return generateFill;
      case "mc":
        return generateMC;
      case "ma":
        return generateMA;
      case "speak":
        return generateSpeak;
      case "match":
        return generateMatch;
      case "translate":
        return generateTranslate;
      case "repeat":
        return generateRepeatTranslate;
      default:
        return generateFill;
    }
  }
  function drawType() {
    if (!typeDeckRef.current.length) {
      const reshuffled = [...types];
      for (let i = reshuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
      }
      typeDeckRef.current = reshuffled;
    }
    const [next, ...rest] = typeDeckRef.current;
    typeDeckRef.current = rest;
    return next || types[0];
  }

  function generateRandom() {
    const pick = drawType();
    // do NOT lock when randomizing
    setMode(pick);
    return generatorFor(pick)();
  }

  // Reset feedback UI only when user actively changes their answer (not when cleared after submission)
  useEffect(() => {
    if (ansFill && ansFill !== prevAnsFillRef.current) {
      setLastOk(null);
    }
    prevAnsFillRef.current = ansFill;
  }, [ansFill]);

  useEffect(() => {
    if (pickMC && pickMC !== prevPickMCRef.current) {
      setLastOk(null);
    }
    prevPickMCRef.current = pickMC;
  }, [pickMC]);

  useEffect(() => {
    const prevPicks = prevPicksMARef.current;
    const picksChanged = JSON.stringify(picksMA) !== JSON.stringify(prevPicks);
    if (picksMA.length > 0 && picksChanged) {
      setLastOk(null);
    }
    prevPicksMARef.current = picksMA;
  }, [picksMA]);

  useEffect(() => {
    const prevSlots = prevMSlotsRef.current;
    const slotsChanged = JSON.stringify(mSlots) !== JSON.stringify(prevSlots);
    const hasContent = mSlots.some((s) => s !== null);
    if (hasContent && slotsChanged) {
      setLastOk(null);
    }
    prevMSlotsRef.current = mSlots;
  }, [mSlots]);

  useEffect(() => {
    generateRandomRef.current = generateRandom;
  });

  useEffect(() => {
    if (!qMC || !choicesMC.length) return;
    const signature = `${qMC}||${choicesMC.join("|")}`;
    if (mcKeyRef.current === signature) return;
    mcKeyRef.current = signature;
    const useDrag = shouldUseDragVariant(
      qMC,
      choicesMC,
      [answerMC].filter(Boolean)
    );
    setMcLayout(useDrag ? "drag" : "buttons");
    setMcSlotIndex(null);
    setPickMC("");
    setMcBankOrder(useDrag ? choicesMC.map((_, idx) => idx) : []);
  }, [qMC, choicesMC, answerMC]);

  useEffect(() => {
    if (!qMA || !choicesMA.length || !answersMA.length) return;
    const signature = `${qMA}||${choicesMA.join("|")}|${answersMA.join("|")}`;
    if (maKeyRef.current === signature) return;
    maKeyRef.current = signature;
    const preferDrag = shouldUseDragVariant(qMA, choicesMA, answersMA);
    const blanksCount = countBlanks(qMA);
    // Only use drag mode if blanks count matches answers count exactly
    // This prevents users from being trapped when LLM generates mismatched slots/answers
    const useDrag =
      preferDrag && blanksCount > 0 && blanksCount === answersMA.length;
    setMaLayout(useDrag ? "drag" : "buttons");
    if (useDrag) {
      // Slot count = number of blanks in text (should match answers length from prompt)
      const slotCount = blanksCount > 0 ? blanksCount : answersMA.length;
      setMaSlots(Array.from({ length: slotCount }, () => null));
      setMaBankOrder(choicesMA.map((_, idx) => idx));
    } else {
      setMaSlots([]);
      setMaBankOrder([]);
    }
    setPicksMA([]);
  }, [qMA, choicesMA, answersMA]);

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
        setPickMC(choicesMC[removed] || "");
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
        setPickMC("");
      }
    },
    [mcLayout, mcBankOrder, mcSlotIndex, choicesMC]
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
      setPickMC(choicesMC[choiceIdx] || "");
    },
    [mcLayout, mcBankOrder, mcSlotIndex, choicesMC]
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
    setPicksMA((prev) => {
      const filled = maSlots
        .filter((idx) => idx != null)
        .map((idx) => choicesMA[idx])
        .filter(Boolean);
      if (
        filled.length === prev.length &&
        filled.every((val, idx) => val === prev[idx])
      ) {
        return prev;
      }
      return filled;
    });
  }, [maLayout, maSlots, choicesMA]);

  /* ---------------------------
     STREAM Generate — FILL
  --------------------------- */
  async function generateFill() {
    setMode("fill");
    setLoadingQFill(true);
    setResFill("");
    setAnsFill("");
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    // reset view to allow placeholders while streaming
    setQFill("");
    setHFill("");
    setTrFill("");

    const prompt = buildFillVerbStreamPrompt({
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
            if (
              obj?.type === "verb_fill" &&
              obj.phase === "q" &&
              obj.question
            ) {
              setQFill(String(obj.question));
              gotSomething = true;
            } else if (obj?.type === "verb_fill" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setHFill(obj.hint);
              if (typeof obj.translation === "string")
                setTrFill(obj.translation);
              gotSomething = true;
            }
          });
        }
      }

      // Flush any trailing aggregates
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
                obj?.type === "verb_fill" &&
                obj.phase === "q" &&
                obj.question
              ) {
                setQFill(String(obj.question));
                gotSomething = true;
              } else if (obj?.type === "verb_fill" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setHFill(obj.hint);
                if (typeof obj.translation === "string")
                  setTrFill(obj.translation);
                gotSomething = true;
              }
            })
          );
      }

      if (!gotSomething) throw new Error("no-fill");
    } catch {
      // Fallback (non-stream)
      const text = await callResponses({
        model: MODEL,
        input: `
Create ONE short ${LANG_NAME(
          targetLang
        )} VOCAB sentence with a single blank "___" (not grammar), ≤120 chars.
Return EXACTLY:
<sentence> ||| <hint in ${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )}> ||| <${showTranslations ? "translation" : '""'}>
`.trim(),
      });

      const [q, h, tr] = text.split("|||").map((s) => (s || "").trim());
      if (q) {
        setQFill(q);
        setHFill(h || "");
        setTrFill(tr || "");
      } else {
        setQFill("Complete: She felt deep ___ after her mistake.");
        setHFill("regret/guilt (noun)");
        setTrFill(
          showTranslations && supportCode === "es"
            ? "Completa: Sintió un profundo ___ tras su error."
            : ""
        );
      }
    } finally {
      setLoadingQFill(false);
    }
  }

  /* ---------------------------
     Virtual Keyboard handler
  --------------------------- */
  const handleKeyboardInput = useCallback((key) => {
    if (key === "BACKSPACE") {
      setAnsFill((prev) => prev.slice(0, -1));
    } else {
      setAnsFill((prev) => prev + key);
    }
  }, []);

  // Check if keyboard should be available (Japanese, Russian, or Greek)
  const showKeyboardButton =
    targetLang === "ja" || targetLang === "ru" || targetLang === "el";

  async function submitFill() {
    if (!qFill || !ansFill.trim()) return;
    playSound(submitActionSound);
    setLoadingGFill(true);

    // Clear previous explanation when attempting a new answer
    setExplanationText("");
    setCurrentQuestionData(null);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildFillVerbJudgePrompt({
        targetLang,
        level,
        sentence: qFill,
        userAnswer: ansFill,
        hint: hFill,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 5 : 0; // ✅ normalized to 4-7 XP range

    // Handle quiz mode differently
    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setResFill(ok ? "correct" : "try_again");
      setLastOk(ok);
      setRecentXp(0); // No XP in quiz mode
    } else {
      if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

      setResFill(ok ? "correct" : "try_again"); // log only
      setLastOk(ok);
      setRecentXp(delta);
    }

    // Store question data for explanation and note creation
    setCurrentQuestionData({
      question: qFill,
      userAnswer: ansFill,
      correctAnswer: hFill,
      questionType: "fill",
    });
    if (ok) {
      setExplanationText("");
    }

    // ✅ If user hasn't locked a type, keep randomizing; otherwise stick to locked type
    // In quiz mode, always show next button (even on wrong answer)
    const nextFn =
      ok || isFinalQuiz
        ? lockedType
          ? () => generatorFor(lockedType)()
          : () => generateRandomRef.current()
        : null;
    setNextAction(() => nextFn);

    if (ok) {
      setAnsFill("");
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "fill", question: qFill },
      ].slice(-5);
    }

    setLoadingGFill(false);
  }

  /* ---------------------------
     STREAM Generate — MC
  --------------------------- */
  async function generateMC() {
    setMode("mc");
    setLoadingQMC(true);
    setResMC("");
    setPickMC("");
    setMcLayout("buttons");
    setMcSlotIndex(null);
    setMcBankOrder([]);
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    // reset for streaming placeholders
    setQMC("");
    setHMC("");
    setChoicesMC([]);
    setAnswerMC("");
    setTrMC("");

    const prompt = buildMCVerbStreamPrompt({
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
            if (obj?.type === "verb_mc" && obj.phase === "q" && obj.question) {
              setQMC(String(obj.question));
              got = true;
            } else if (
              obj?.type === "verb_mc" &&
              obj.phase === "choices" &&
              Array.isArray(obj.choices)
            ) {
              const rawChoices = obj.choices.slice(0, 4).map(String);
              // if answer already known from meta, ensure it's in choices
              if (pendingAnswer) {
                const { choices, answer } = ensureAnswerInChoices(
                  rawChoices,
                  pendingAnswer
                );
                setChoicesMC(choices);
                setAnswerMC(answer);
              } else {
                setChoicesMC(rawChoices);
              }
              got = true;
            } else if (obj?.type === "verb_mc" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setHMC(obj.hint);
              if (typeof obj.translation === "string") setTrMC(obj.translation);
              if (typeof obj.answer === "string") {
                pendingAnswer = obj.answer;
                if (Array.isArray(choicesMC) && choicesMC.length) {
                  const { choices, answer } = ensureAnswerInChoices(
                    choicesMC,
                    pendingAnswer
                  );
                  setChoicesMC(choices);
                  setAnswerMC(answer);
                }
              }
              got = true;
            }
          });
        }
      }

      // flush tail
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
                obj?.type === "verb_mc" &&
                obj.phase === "q" &&
                obj.question
              ) {
                setQMC(String(obj.question));
                got = true;
              } else if (
                obj?.type === "verb_mc" &&
                obj.phase === "choices" &&
                Array.isArray(obj.choices)
              ) {
                const rawChoices = obj.choices.slice(0, 4).map(String);
                if (pendingAnswer) {
                  const { choices, answer } = ensureAnswerInChoices(
                    rawChoices,
                    pendingAnswer
                  );
                  setChoicesMC(choices);
                  setAnswerMC(answer);
                } else {
                  setChoicesMC(rawChoices);
                }
                got = true;
              } else if (obj?.type === "verb_mc" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setHMC(obj.hint);
                if (typeof obj.translation === "string")
                  setTrMC(obj.translation);
                if (typeof obj.answer === "string") {
                  pendingAnswer = obj.answer;
                  if (Array.isArray(choicesMC) && choicesMC.length) {
                    const { choices, answer } = ensureAnswerInChoices(
                      choicesMC,
                      pendingAnswer
                    );
                    setChoicesMC(choices);
                    setAnswerMC(answer);
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
      const text = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(targetLang)} vocab MCQ (1 correct). Return JSON ONLY:
{
  "question":"<stem>",
  "hint":"<hint in ${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )}>",
  "choices":["<choice1>","<choice2>","<choice3>","<choice4>"],
  "notes":"Replace <choiceN> placeholders with actual ${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )} options.",
  "answer":"<exact correct choice>",
  "translation":"${showTranslations ? "<translation>" : ""}"
}
`.trim(),
      });

      const parsed = safeParseJSON(text);
      if (
        parsed &&
        parsed.question &&
        Array.isArray(parsed.choices) &&
        parsed.choices.length >= 3
      ) {
        const rawChoices = parsed.choices.slice(0, 4).map(String);
        // Ensure the correct answer is always in choices
        const { choices, answer } = ensureAnswerInChoices(
          rawChoices,
          parsed.answer
        );
        setQMC(String(parsed.question));
        setHMC(String(parsed.hint || ""));
        setChoicesMC(choices);
        setAnswerMC(answer);
        setTrMC(String(parsed.translation || ""));
      } else {
        setQMC("Choose the best synonym for “quick”.");
        setHMC("synonym");
        const choices = ["rapid", "slow", "late", "sleepy"];
        setChoicesMC(choices);
        setAnswerMC("rapid");
        setTrMC(
          showTranslations && supportCode === "es"
            ? "Elige el mejor sinónimo de “quick”."
            : ""
        );
      }
    } finally {
      setLoadingQMC(false);
    }
  }

  async function submitMC() {
    if (!qMC || !pickMC) return;
    playSound(submitActionSound);
    setLoadingGMC(true);

    // Clear previous explanation when attempting a new answer
    setExplanationText("");
    setCurrentQuestionData(null);

    const deterministicOk = answerMC && norm(pickMC) === norm(answerMC);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMCVerbJudgePrompt({
        targetLang,
        stem: qMC,
        choices: choicesMC,
        userChoice: pickMC,
        hint: hMC,
      }),
    });

    const ok =
      deterministicOk ||
      (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 5 : 0; // ✅ normalized to 4-7 XP range

    // Handle quiz mode differently
    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setResMC(ok ? "correct" : "try_again");
      setLastOk(ok);
      setRecentXp(0); // No XP in quiz mode
    } else {
      if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

      setResMC(ok ? "correct" : "try_again"); // log only
      setLastOk(ok);
      setRecentXp(delta);
    }

    // Store question data for explanation and note creation
    setCurrentQuestionData({
      question: qMC,
      userAnswer: pickMC,
      correctAnswer: answerMC || hMC,
      questionType: "mc",
    });
    if (ok) {
      setExplanationText("");
    }

    // In quiz mode, always show next button (even on wrong answer)
    const nextFn =
      ok || isFinalQuiz
        ? lockedType
          ? () => generatorFor(lockedType)()
          : () => generateRandomRef.current()
        : null;
    setNextAction(() => nextFn);

    if (ok) {
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "mc", question: qMC },
      ].slice(-5);
    }

    setLoadingGMC(false);
  }

  /* ---------------------------
     STREAM Generate — MA
  --------------------------- */
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
    setLoadingQMA(true);
    setResMA("");
    setPicksMA([]);
    setMaLayout("buttons");
    setMaSlots([]);
    setMaBankOrder([]);
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    setQMA("");
    setHMA("");
    setChoicesMA([]);
    setAnswersMA([]);
    setTrMA("");

    const prompt = buildMAVerbStreamPrompt({
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
            if (obj?.type === "verb_ma" && obj.phase === "q" && obj.question) {
              setQMA(String(obj.question));
              got = true;
            } else if (
              obj?.type === "verb_ma" &&
              obj.phase === "choices" &&
              Array.isArray(obj.choices)
            ) {
              const rawChoices = obj.choices.slice(0, 6).map(String);
              if (pendingAnswers?.length) {
                const { choices, answers } = ensureAnswersInChoices(
                  rawChoices,
                  pendingAnswers
                );
                setChoicesMA(choices);
                if (answers.length >= 2) setAnswersMA(answers);
              } else {
                setChoicesMA(rawChoices);
              }
              got = true;
            } else if (obj?.type === "verb_ma" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setHMA(obj.hint);
              if (typeof obj.translation === "string") setTrMA(obj.translation);
              if (Array.isArray(obj.answers)) {
                pendingAnswers = obj.answers.map(String);
                if (Array.isArray(choicesMA) && choicesMA.length) {
                  const { choices, answers } = ensureAnswersInChoices(
                    choicesMA,
                    pendingAnswers
                  );
                  setChoicesMA(choices);
                  if (answers.length >= 2) setAnswersMA(answers);
                }
              }
              got = true;
            }
          });
        }
      }

      // flush tail
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
                obj?.type === "verb_ma" &&
                obj.phase === "q" &&
                obj.question
              ) {
                setQMA(String(obj.question));
                got = true;
              } else if (
                obj?.type === "verb_ma" &&
                obj.phase === "choices" &&
                Array.isArray(obj.choices)
              ) {
                const rawChoices = obj.choices.slice(0, 6).map(String);
                if (pendingAnswers?.length) {
                  const { choices, answers } = ensureAnswersInChoices(
                    rawChoices,
                    pendingAnswers
                  );
                  setChoicesMA(choices);
                  if (answers.length >= 2) setAnswersMA(answers);
                } else {
                  setChoicesMA(rawChoices);
                }
                got = true;
              } else if (obj?.type === "verb_ma" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setHMA(obj.hint);
                if (typeof obj.translation === "string")
                  setTrMA(obj.translation);
                if (Array.isArray(obj.answers)) {
                  pendingAnswers = obj.answers.map(String);
                  if (Array.isArray(choicesMA) && choicesMA.length) {
                    const { choices, answers } = ensureAnswersInChoices(
                      choicesMA,
                      pendingAnswers
                    );
                    setChoicesMA(choices);
                    if (answers.length >= 2) setAnswersMA(answers);
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
      const text = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(targetLang)} vocab MAQ (2–3 correct). Return JSON ONLY:
{
  "question":"<stem>",
  "hint":"<hint in ${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )}>",
  "choices":["...","...","...","...","..."],
  "answers":["<correct>","<correct>"],
  "translation":"${showTranslations ? "<translation>" : ""}"
}
`.trim(),
      });

      const parsed = sanitizeMA(safeParseJSON(text));
      if (parsed) {
        setQMA(parsed.question);
        setHMA(parsed.hint);
        setChoicesMA(parsed.choices);
        setAnswersMA(parsed.answers);
        setTrMA(parsed.translation);
      } else {
        setQMA("Select all synonyms of “angry”.");
        setHMA("synonyms");
        const choices = ["furious", "irate", "calm", "content", "mad"];
        setChoicesMA(choices);
        setAnswersMA(["furious", "irate", "mad"]);
        setTrMA(
          showTranslations && supportCode === "es"
            ? "Selecciona todos los sinónimos de “angry”."
            : ""
        );
      }
    } finally {
      setLoadingQMA(false);
    }
  }

  async function submitMA() {
    if (!qMA || !picksMA.length) return;
    playSound(submitActionSound);
    setLoadingGMA(true);

    // Clear previous explanation when attempting a new answer
    setExplanationText("");
    setCurrentQuestionData(null);

    const answerSet = new Set((answersMA || []).map((a) => norm(a)));
    const pickSet = new Set(picksMA.map((a) => norm(a)));
    const deterministicOk =
      answerSet.size > 0 &&
      answerSet.size === pickSet.size &&
      [...answerSet].every((a) => pickSet.has(a));

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMAVerbJudgePrompt({
        targetLang,
        stem: qMA,
        choices: choicesMA,
        userSelections: picksMA,
        hint: hMA,
      }),
    });

    const ok =
      deterministicOk ||
      (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 6 : 0; // ✅ normalized to 4-7 XP range

    // Handle quiz mode differently
    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setResMA(ok ? "correct" : "try_again");
      setLastOk(ok);
      setRecentXp(0); // No XP in quiz mode
    } else {
      if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

      setResMA(ok ? "correct" : "try_again"); // log only
      setLastOk(ok);
      setRecentXp(delta);
    }

    // Store question data for explanation and note creation
    setCurrentQuestionData({
      question: qMA,
      userAnswer: picksMA.join(", "),
      correctAnswer: answersMA?.join(", ") || hMA,
      questionType: "ma",
    });
    if (ok) {
      setExplanationText("");
    }

    // In quiz mode, always show next button (even on wrong answer)
    const nextFn =
      ok || isFinalQuiz
        ? lockedType
          ? () => generatorFor(lockedType)()
          : () => generateRandomRef.current()
        : null;
    setNextAction(() => nextFn);

    if (ok) {
      setPicksMA([]);
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "ma", question: qMA },
      ].slice(-5);
    }

    setLoadingGMA(false);
  }

  async function generateSpeak() {
    try {
      stopSpeakRecording();
    } catch {}
    setMode("speak");
    setLoadingQSpeak(true);
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);
    setSRecognized("");
    setSEval(null);

    const prompt = buildSpeakVocabStreamPrompt({
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
            if (obj?.type === "vocab_speak" && obj.phase === "prompt") {
              if (typeof obj.prompt === "string") setSPrompt(obj.prompt.trim());
              if (typeof obj.target === "string") setSTarget(obj.target.trim());
              if (typeof obj.display === "string")
                setSStimulus(obj.display.trim());
              if (typeof obj.variant === "string")
                setSVariant(normalizeSpeakVariant(obj.variant));
              got = true;
            } else if (obj?.type === "vocab_speak" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setSHint(obj.hint);
              if (typeof obj.translation === "string")
                setSTranslation(obj.translation);
              got = true;
            }
          });
        }
      }

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
              if (obj?.type === "vocab_speak" && obj.phase === "prompt") {
                if (typeof obj.prompt === "string")
                  setSPrompt(obj.prompt.trim());
                if (typeof obj.target === "string")
                  setSTarget(obj.target.trim());
                if (typeof obj.display === "string")
                  setSStimulus(obj.display.trim());
                if (typeof obj.variant === "string")
                  setSVariant(normalizeSpeakVariant(obj.variant));
                got = true;
              } else if (obj?.type === "vocab_speak" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setSHint(obj.hint);
                if (typeof obj.translation === "string")
                  setSTranslation(obj.translation);
                got = true;
              }
            })
          );
      }

      if (!got) throw new Error("no-speak");
    } catch {
      const text = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(
          targetLang
        )} speaking drill. Randomly choose VARIANT from:
- repeat: show the ${LANG_NAME(
          targetLang
        )} word/phrase and have them repeat it aloud.
- translate: show a ${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )} word and have them speak the ${LANG_NAME(
          targetLang
        )} translation aloud.
- complete: show a ${LANG_NAME(
          targetLang
        )} sentence with ___ and have them speak the completed sentence aloud.

Return JSON ONLY:
{
  "variant":"repeat"|"translate"|"complete",
  "prompt":"<${LANG_NAME(targetLang)} instruction>",
  "display":"<text to show the learner>",
  "target":"<${LANG_NAME(targetLang)} text they must say>",
  "hint":"<${LANG_NAME(resolveSupportLang(supportLang, userLanguage))} hint>",
  "translation":"${
    showTranslations
      ? `<${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )} translation or context>`
      : ""
  }"
}`.trim(),
      });

      const parsed = safeParseJSON(text);
      if (parsed && typeof parsed.target === "string") {
        setSTarget(parsed.target.trim());
        setSStimulus(String(parsed.display || parsed.target || "").trim());
        setSVariant(normalizeSpeakVariant(parsed.variant));
        setSPrompt(String(parsed.prompt || ""));
        setSHint(String(parsed.hint || ""));
        setSTranslation(String(parsed.translation || ""));
      } else {
        const fallbackOptions = ["repeat", "complete"];
        if (supportCode !== (targetLang === "en" ? "en" : targetLang)) {
          fallbackOptions.splice(1, 0, "translate");
        }
        const fallbackVariant =
          fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
        setSVariant(normalizeSpeakVariant(fallbackVariant));
        if (fallbackVariant === "translate") {
          const supportWord = supportCode === "es" ? "bosque" : "forest";
          setSStimulus(supportWord);
          setSTarget(
            targetLang === "es"
              ? "bosque"
              : targetLang === "nah"
              ? "kwawitl"
              : "forest"
          );
          setSPrompt(
            targetLang === "es"
              ? `Traduce en voz alta: ${supportWord}.`
              : targetLang === "nah"
              ? `Kijtoa tlen nechicoliz: ${supportWord}.`
              : `Translate aloud: ${supportWord}.`
          );
          setSHint(
            supportCode === "es"
              ? "Di la versión en español"
              : "Say it in the target language"
          );
          setSTranslation(
            showTranslations ? (supportCode === "es" ? "bosque" : "forest") : ""
          );
        } else if (fallbackVariant === "complete") {
          const cloze =
            targetLang === "es"
              ? "Completa: La niña ___ una canción."
              : targetLang === "nah"
              ? "Tlatzotzona: Pilli ___ tlahkuiloa."
              : "Complete: The child ___ a song.";
          const completed =
            targetLang === "es"
              ? "La niña canta una canción."
              : targetLang === "nah"
              ? "Pilli tlahkuiloa tlatzotzontli."
              : "The child sings a song.";
          setSStimulus(cloze);
          setSTarget(completed);
          setSPrompt(
            targetLang === "es"
              ? "Di la oración completa con la palabra que falta."
              : targetLang === "nah"
              ? "Kijtoa nochi tlahtolli tlen mokpano."
              : "Say the full sentence with the missing word."
          );
          setSHint(
            supportCode === "es"
              ? "El verbo es 'cantar'"
              : "The verb is 'to sing'"
          );
          setSTranslation(
            showTranslations
              ? supportCode === "es"
                ? "La niña canta una canción."
                : "The girl sings a song."
              : ""
          );
        } else {
          const repeatWord =
            targetLang === "es"
              ? "sonrisa"
              : targetLang === "nah"
              ? "yolpaki"
              : "harmony";
          setSStimulus(repeatWord);
          setSTarget(repeatWord);
          setSPrompt(
            targetLang === "es"
              ? "Di la palabra claramente: sonrisa."
              : targetLang === "nah"
              ? "Pronuncia la palabra con calma: yolpaki."
              : "Say this word out loud: harmony."
          );
          setSHint(
            supportCode === "es" ? "significa felicidad" : "means happiness"
          );
          setSTranslation(
            showTranslations
              ? supportCode === "es"
                ? "sonrisa"
                : "harmony"
              : ""
          );
        }
      }
    } finally {
      setLoadingQSpeak(false);
    }
  }

  /* ---------------------------
     STREAM Generate — MATCH (DnD)
  --------------------------- */
  async function generateMatch() {
    setMode("match");
    setLoadingMG(true);
    setMResult("");
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    // reset state to show placeholders
    setMStem("");
    setMHint("");
    setMLeft([]);
    setMRight([]);
    setMSlots([]);
    setMBank([]);

    const prompt = buildMatchVerbStreamPrompt({
      targetLang,
      supportLang,
      appUILang: userLanguage,
      cefrLevel,
      recentGood: recentCorrectRef.current,
      lessonContent,
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
              obj?.type === "verb_match" &&
              typeof obj.stem === "string" &&
              Array.isArray(obj.left) &&
              Array.isArray(obj.right) &&
              obj.left.length >= 3 &&
              obj.left.length <= 6 &&
              obj.left.length === obj.right.length
            ) {
              const stem =
                String(obj.stem).trim() ||
                "Match the words to their definitions.";
              const left = obj.left.slice(0, 6).map(String);
              const right = obj.right.slice(0, 6).map(String);
              const hint = String(obj.hint || "");
              setMStem(stem);
              setMHint(hint);
              setMLeft(left);
              setMRight(right);
              setMSlots(Array(left.length).fill(null));
              setMBank(shuffle([...Array(right.length)].map((_, i) => i)));
              okPayload = true;
            }
          });
        }
      }

      // flush tail
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
                obj?.type === "verb_match" &&
                typeof obj.stem === "string" &&
                Array.isArray(obj.left) &&
                Array.isArray(obj.right) &&
                obj.left.length >= 3 &&
                obj.left.length <= 6 &&
                obj.left.length === obj.right.length
              ) {
                const stem =
                  String(obj.stem).trim() ||
                  "Match the words to their definitions.";
                const left = obj.left.slice(0, 6).map(String);
                const right = obj.right.slice(0, 6).map(String);
                const hint = String(obj.hint || "");
                setMStem(stem);
                setMHint(hint);
                setMLeft(left);
                setMRight(right);
                setMSlots(Array(left.length).fill(null));
                setMBank(shuffle([...Array(right.length)].map((_, i) => i)));
                okPayload = true;
              }
            })
          );
      }

      if (!okPayload) throw new Error("no-match");
    } catch {
      // Backend fallback (non-stream)
      const raw = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(targetLang)} vocabulary matching set. Return JSON ONLY:
{"stem":"<stem>","left":["<word>","..."],"right":["<short ${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )} definition>","..."],"hint":"<${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )} hint>"}
`.trim(),
      });
      const parsed = safeParseJsonLoose(raw);

      let stem = "",
        left = [],
        right = [],
        hint = "";

      if (
        parsed &&
        Array.isArray(parsed.left) &&
        Array.isArray(parsed.right) &&
        parsed.left.length >= 3 &&
        parsed.left.length <= 6 &&
        parsed.left.length === parsed.right.length
      ) {
        stem = String(parsed.stem || "Match the words to their definitions.");
        left = parsed.left.slice(0, 6).map(String);
        right = parsed.right.slice(0, 6).map(String);
        hint = String(parsed.hint || "");
      } else {
        stem = "Match words to their definitions.";
        left = ["rapid", "generous", "fragile"];
        right = ["quick", "kind in giving", "easily broken"];
        hint = "synonym match";
      }

      setMStem(stem);
      setMHint(hint);
      setMLeft(left);
      setMRight(right);
      setMSlots(Array(left.length).fill(null));
      setMBank(shuffle([...Array(right.length)].map((_, i) => i)));
    } finally {
      setLoadingMG(false);
    }
  }

  /* ---------------------------
     STREAM Generate — TRANSLATE (word bank)
  --------------------------- */
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

    const prompt = buildVerbTranslateStreamPrompt({
      cefrLevel,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      recentGood: recentCorrectRef.current,
      lessonContent,
      direction,
    });

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
              setTSentence(String(obj.sentence).trim());
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
                setTSentence(String(obj.sentence).trim());
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

      // Build shuffled word bank
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
      }

      setTDistractors(distractors);
      const allWords = [...tempCorrectWords, ...distractors];
      setTWordBank(shuffle(allWords));
    } catch {
      // Fallback defaults based on direction
      const isTargetToSupport = direction === "target-to-support";
      if (targetLang === "es") {
        if (isTargetToSupport) {
          // Spanish -> English
          setTSentence("El gato es negro.");
          setTCorrectWords(["The", "cat", "is", "black"]);
          setTDistractors(["dog", "red", "big"]);
          setTWordBank(
            shuffle(["The", "cat", "is", "black", "dog", "red", "big"])
          );
          setTHint("Colors and animals vocabulary");
        } else {
          // English -> Spanish
          setTSentence("The cat is black.");
          setTCorrectWords(["El", "gato", "es", "negro"]);
          setTDistractors(["perro", "rojo", "grande"]);
          setTWordBank(
            shuffle(["El", "gato", "es", "negro", "perro", "rojo", "grande"])
          );
          setTHint("Colors and animals vocabulary");
        }
      } else {
        if (isTargetToSupport) {
          // English -> Spanish (when target is English)
          setTSentence("The cat is black.");
          setTCorrectWords(["El", "gato", "es", "negro"]);
          setTDistractors(["perro", "rojo", "grande"]);
          setTWordBank(
            shuffle(["El", "gato", "es", "negro", "perro", "rojo", "grande"])
          );
          setTHint("Vocabulario de colores y animales");
        } else {
          // Spanish -> English (when target is English)
          setTSentence("El gato es negro.");
          setTCorrectWords(["The", "cat", "is", "black"]);
          setTDistractors(["dog", "red", "big"]);
          setTWordBank(
            shuffle(["The", "cat", "is", "black", "dog", "red", "big"])
          );
          setTHint("Vocabulario de colores y animales");
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

  function canSubmitMatch() {
    return mLeft.length > 0 && mSlots.every((ri) => ri !== null);
  }

  async function submitMatch() {
    if (!canSubmitMatch()) return;
    playSound(submitActionSound);
    setLoadingMJ(true);

    // Clear previous explanation when attempting a new answer
    setExplanationText("");
    setCurrentQuestionData(null);

    const userPairs = mSlots.map((ri, li) => [li, ri]);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMatchVerbJudgePrompt({
        stem: mStem,
        left: mLeft,
        right: mRight,
        userPairs,
        hint: mHint,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 6 : 0; // ✅ normalized to 4-7 XP range

    // Handle quiz mode differently
    if (isFinalQuiz) {
      handleQuizAnswer(ok);
      setMResult(ok ? "correct" : "try_again");
      setLastOk(ok);
      setRecentXp(0); // No XP in quiz mode
    } else {
      if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

      setMResult(ok ? "correct" : "try_again"); // log only
      setLastOk(ok);
      setRecentXp(delta);
    }

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

    // In quiz mode, always show next button (even on wrong answer)
    const nextFn =
      ok || isFinalQuiz
        ? lockedType
          ? () => generatorFor(lockedType)()
          : () => generateRandom()
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

      const judgePrompt = buildVocabTranslateJudgePrompt({
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
          ? lockedType
            ? () => generatorFor(lockedType)()
            : () => generateRandom()
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
      ? lockedType
        ? () => generatorFor(lockedType)()
        : () => generateRandom()
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
              ? "Vuelve a intentarlo con una conexión estable."
              : "Please try again with a stable connection.",
          status: "error",
          duration: 2500,
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

      // Handle quiz mode differently
      if (isFinalQuiz) {
        handleQuizAnswer(ok);
        setLastOk(ok);
        setRecentXp(0); // No XP in quiz mode
      } else {
        if (delta > 0) await awardXp(npub, delta, targetLang).catch(() => {});

        setLastOk(ok);
        setRecentXp(delta);
      }

      // Store question data for explanation and note creation
      setCurrentQuestionData({
        question: sPrompt || sStimulus || sTarget,
        userAnswer: recognizedText || "",
        correctAnswer: sTarget,
        questionType: "speak",
      });
      if (ok) {
        setExplanationText("");
      }

      // In quiz mode, always show next button (even on wrong answer)
      const nextFn =
        ok || isFinalQuiz
          ? lockedType
            ? () => generatorFor(lockedType)()
            : () => generateRandomRef.current()
          : null;
      setNextAction(() => nextFn);

      if (ok) {
        recentCorrectRef.current = [
          ...recentCorrectRef.current,
          { mode: "speak", question: sStimulus || sTarget, variant: sVariant },
        ].slice(-5);
      } else {
        const tips = speechReasonTips(evaluation.reasons, {
          uiLang: userLanguage,
          targetLabel: targetName,
        });
        const retryTitle =
          t("vocab_speak_retry_title") ||
          (userLanguage === "es" ? "Intenta otra vez" : "Try again");
        toast({
          title: retryTitle,
          description: tips.join(" "),
          status: "warning",
          duration: 3600,
        });
      }
    },
    [
      lockedType,
      npub,
      sHint,
      sPrompt,
      sStimulus,
      sTarget,
      sTranslation,
      sVariant,
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
    isConnecting: isSpeakConnecting,
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
        ? "Ejercicio de emparejar palabras. Responde haciendo coincidir las palabras con las opciones del banco de palabras."
        : "Match the words exercise. Respond by matching the words with the word bank options.",
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

  const sendSpeakHelp = useCallback(() => {
    if (isLoadingAssistantSupport || assistantSupportText) return;
    const isSpanishUI = userLanguage === "es";
    const base =
      sVariant === "translate"
        ? isSpanishUI
          ? "Dilo en voz alta (traducción). Proporciona la traducción en el idioma de práctica para la palabra dada."
          : "Say it aloud (translate). Provide the target language translation for the given word."
        : isSpanishUI
        ? "Dilo en voz alta (completar). Ayuda al estudiante a decir la frase completa con la palabra que falta."
        : "Say it aloud (complete). Help the learner say the full sentence with the missing word.";

    const details = [
      sPrompt
        ? isSpanishUI
          ? `Consigna o indicación: ${sPrompt}`
          : `Prompt: ${sPrompt}`
        : null,
      sStimulus
        ? isSpanishUI
          ? `Mostrado al estudiante: ${sStimulus}`
          : `Shown to learner: ${sStimulus}`
        : null,
      sTarget
        ? isSpanishUI
          ? `Respuesta hablada esperada: ${sTarget}`
          : `Expected spoken answer: ${sTarget}`
        : null,
      sHint ? (isSpanishUI ? `Pista: ${sHint}` : `Hint: ${sHint}`) : null,
      sTranslation
        ? isSpanishUI
          ? `Traducción o contexto de apoyo: ${sTranslation}`
          : `Support translation/context: ${sTranslation}`
        : null,
    ].filter(Boolean);

    handleAskAssistant([base, ...details].join("\n"));
  }, [
    userLanguage,
    isLoadingAssistantSupport,
    assistantSupportText,
    sHint,
    sPrompt,
    sStimulus,
    sTarget,
    sTranslation,
    sVariant,
  ]);

  const showTRFill =
    showTranslations &&
    trFill &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRMC =
    showTranslations &&
    trMC &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRMA =
    showTranslations &&
    trMA &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRSpeak =
    showTranslations &&
    sTranslation &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);

  const speakVariantLabel = useMemo(() => {
    switch (sVariant) {
      case "translate":
        return (
          t("vocab_speak_variant_translate") ||
          (userLanguage === "es" ? "Traduce la palabra" : "Translate the word")
        );
      case "complete":
        return (
          t("vocab_speak_variant_complete") ||
          (userLanguage === "es"
            ? "Completa la oración"
            : "Complete the sentence")
        );
      case "repeat":
      default:
        return (
          t("vocab_speak_variant_repeat") ||
          (userLanguage === "es" ? "Pronuncia la palabra" : "Speak the word")
        );
    }
  }, [sVariant, t, userLanguage]);

  /* ---------------------------
     AUTO-GENERATE on first render (respecting user settings)
     - Wait until 'ready' so target/support languages are applied.
     - Randomize by default; only lock when user picks a type explicitly.
  --------------------------- */
  const autoInitRef = useRef(false);
  useEffect(() => {
    if (autoInitRef.current) return;
    if (!ready) return; // ✅ wait for user progress to load
    autoInitRef.current = true;
    generateRandom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

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

  const renderMcPrompt = () => {
    if (!qMC) return null;
    const segments = String(qMC).split("___");
    if (segments.length === 1) {
      return qMC;
    }
    let blankPlaced = false;
    const nodes = [];
    segments.forEach((segment, idx) => {
      nodes.push(
        <React.Fragment key={`mc-segment-${idx}`}>{segment}</React.Fragment>
      );
      if (idx < segments.length - 1) {
        if (blankPlaced) {
          nodes.push(
            <React.Fragment key={`mc-gap-${idx}`}>___</React.Fragment>
          );
          return;
        }
        blankPlaced = true;
        nodes.push(
          <Droppable
            droppableId="mc-slot"
            direction="horizontal"
            key={`mc-blank-${idx}`}
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
                        onClick={() => {
                          playSound(selectSound);
                          // Move from slot back to bank
                          setMcBankOrder((prev) => [...prev, mcSlotIndex]);
                          setMcSlotIndex(null);
                        }}
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
                            ? "rgba(128,90,213,0.24)"
                            : "purple.600"
                        }
                        color="white"
                        fontSize="sm"
                      >
                        {choicesMC[mcSlotIndex]}
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
    if (!qMA) return null;
    const segments = String(qMA).split("___");
    if (segments.length === 1) {
      return qMA;
    }
    let slotNumber = 0;
    const nodes = [];
    segments.forEach((segment, idx) => {
      nodes.push(
        <React.Fragment key={`ma-segment-${idx}`}>{segment}</React.Fragment>
      );
      if (idx < segments.length - 1) {
        const currentSlot = slotNumber;
        slotNumber += 1;
        if (currentSlot >= maSlots.length) {
          nodes.push(
            <React.Fragment key={`ma-gap-${idx}`}>___</React.Fragment>
          );
          return;
        }
        const choiceIdx = maSlots[currentSlot];
        nodes.push(
          <Droppable
            droppableId={`ma-slot-${currentSlot}`}
            direction="horizontal"
            key={`ma-blank-${currentSlot}`}
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
                        onClick={() => {
                          playSound(selectSound);
                          // Move from slot back to bank
                          setMaBankOrder((prev) => [...prev, choiceIdx]);
                          setMaSlots((prev) => {
                            const next = [...prev];
                            next[currentSlot] = null;
                            return next;
                          });
                        }}
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
                            ? "rgba(128,90,213,0.24)"
                            : "purple.600"
                        }
                        color="white"
                        fontSize="sm"
                      >
                        {choicesMA[choiceIdx]}
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

  const nextLabel =
    t("practice_next_question") ||
    (userLanguage === "es" ? "Siguiente pregunta" : "Next question");
  const skipLabel =
    t("practice_skip_question") || (userLanguage === "es" ? "Saltar" : "Skip");
  const canSkip = !isFinalQuiz && !quizCompleted;
  const showNextButton = isFinalQuiz
    ? Boolean(nextAction)
    : Boolean(lastOk === true && nextAction);
  const questionListenLabel =
    userLanguage === "es" ? "Escuchar pregunta" : "Listen to question";
  const speakListenLabel =
    userLanguage === "es" ? "Escuchar ejemplo" : "Listen to example";
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
        langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
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
      console.error("Vocabulary speak playback failed", err);
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
        console.error("Vocabulary question playback failed", err);
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

  const maReady =
    maLayout === "drag"
      ? maSlots.length > 0 && maSlots.every((slot) => slot != null)
      : picksMA.length > 0;

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
                    {t("vocab_badge_level", { level: levelNumber })}
                  </Badge>
                  <Badge variant="subtle">{t("vocab_badge_xp", { xp })}</Badge>
                </HStack>
                <WaveBar value={progressPct} />
              </>
            )}
          </Box>
        </Box>

        {/* ---- FILL UI ---- */}
        {mode === "fill" && (qFill || loadingQFill) ? (
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
                    q={qFill}
                    h={hFill}
                    tr={showTRFill ? trFill : ""}
                  />
                  <IconButton
                    aria-label={questionListenLabel}
                    icon={renderSpeakerIcon(isQuestionSynthesizing)}
                    size="sm"
                    fontSize="lg"
                    variant="ghost"
                    onClick={() => handlePlayQuestionTTS(qFill)}
                    mr={1}
                  />
                  <Text
                    fontSize="lg"
                    fontWeight="medium"
                    flex="1"
                    lineHeight="tall"
                  >
                    {qFill || (loadingQFill ? "…" : "")}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            <AssistantSupportBox />

            <Input
              value={ansFill}
              onChange={(e) => setAnsFill(e.target.value)}
              placeholder={t("vocab_input_placeholder_word")}
              isDisabled={loadingGFill}
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
                  isDisabled={loadingQFill || loadingGFill}
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
                  isDisabled={loadingQFill || loadingGFill}
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
                  loadingGFill ||
                  !ansFill.trim() ||
                  !qFill ||
                  (isFinalQuiz && quizCurrentQuestionAttempted)
                }
                px={{ base: 7, md: 12 }}
                py={{ base: 3, md: 4 }}
              >
                {loadingGFill ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
            </Stack>

            <FeedbackRail
              ok={lastOk}
              xp={recentXp}
              showNext={showNextButton}
              onNext={handleNext}
              nextLabel={nextLabel}
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
        {mode === "mc" && (qMC || loadingQMC) ? (
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
                        <CopyAllBtn q={qMC} h={hMC} tr={showTRMC ? trMC : ""} />
                        <IconButton
                          aria-label={questionListenLabel}
                          icon={renderSpeakerIcon(isQuestionSynthesizing)}
                          size="sm"
                          fontSize="lg"
                          variant="ghost"
                          onClick={() => handlePlayQuestionTTS(qMC)}
                          mr={1}
                        />
                        <Text
                          fontSize="lg"
                          fontWeight="medium"
                          flex="1"
                          lineHeight="tall"
                        >
                          {renderMcPrompt() || (loadingQMC ? "…" : "")}
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
                            key={`mc-bank-${idx}`}
                          >
                            {(dragProvided, snapshot) => (
                              <Box
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => {
                                  playSound(selectSound);
                                  handleMcAnswerClick(idx, position);
                                }}
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
                                _hover={{
                                  bg: "rgba(128,90,213,0.12)",
                                  borderColor: "purple.200",
                                }}
                                transition="all 0.15s ease"
                              >
                                {choicesMC[idx]}
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
                      <CopyAllBtn q={qMC} h={hMC} tr={showTRMC ? trMC : ""} />
                      <IconButton
                        aria-label={questionListenLabel}
                        icon={renderSpeakerIcon(isQuestionSynthesizing)}
                        size="sm"
                        fontSize="lg"
                        variant="ghost"
                        onClick={() => handlePlayQuestionTTS(qMC)}
                        mr={1}
                      />
                      <Text
                        fontSize="lg"
                        fontWeight="medium"
                        flex="1"
                        lineHeight="tall"
                      >
                        {qMC || (loadingQMC ? "…" : "")}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
                <Stack spacing={3} align="stretch">
                  {(choicesMC.length
                    ? choicesMC
                    : loadingQMC
                    ? ["…", "…", "…", "…"]
                    : []
                  ).map((c, i) => (
                    <Box
                      key={i}
                      onClick={() => {
                        if (!choicesMC.length) return;
                        playSound(selectSound);
                        setPickMC(c);
                      }}
                      cursor={choicesMC.length ? "pointer" : "not-allowed"}
                      px={4}
                      py={3}
                      rounded="lg"
                      borderWidth="2px"
                      borderColor={
                        pickMC === c ? "purple.400" : "rgba(255,255,255,0.15)"
                      }
                      bg={
                        pickMC === c
                          ? "linear-gradient(135deg, rgba(128,90,213,0.25) 0%, rgba(159,122,234,0.15) 100%)"
                          : "rgba(255,255,255,0.03)"
                      }
                      transition="all 0.2s ease"
                      _hover={
                        choicesMC.length
                          ? {
                              borderColor:
                                pickMC === c
                                  ? "purple.300"
                                  : "rgba(255,255,255,0.3)",
                              bg:
                                pickMC === c
                                  ? "linear-gradient(135deg, rgba(128,90,213,0.3) 0%, rgba(159,122,234,0.2) 100%)"
                                  : "rgba(255,255,255,0.06)",
                              transform: "translateY(-2px)",
                              shadow: "md",
                            }
                          : {}
                      }
                      position="relative"
                      opacity={choicesMC.length ? 1 : 0.5}
                    >
                      <HStack spacing={3}>
                        <Box
                          w="20px"
                          h="20px"
                          rounded="full"
                          borderWidth="2px"
                          borderColor={
                            pickMC === c
                              ? "purple.400"
                              : "rgba(255,255,255,0.3)"
                          }
                          bg={pickMC === c ? "purple.500" : "transparent"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          transition="all 0.2s ease"
                          flexShrink={0}
                        >
                          {pickMC === c && (
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
                  isDisabled={loadingQMC || loadingGMC}
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
                  loadingGMC ||
                  !pickMC ||
                  !choicesMC.length ||
                  (isFinalQuiz && quizCurrentQuestionAttempted)
                }
                px={{ base: 7, md: 12 }}
                py={{ base: 3, md: 4 }}
              >
                {loadingGMC ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
            </Stack>

            <FeedbackRail
              ok={lastOk}
              xp={recentXp}
              showNext={showNextButton}
              onNext={handleNext}
              nextLabel={nextLabel}
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
        {mode === "ma" && (qMA || loadingQMA) ? (
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
                        <CopyAllBtn q={qMA} h={hMA} tr={showTRMA ? trMA : ""} />
                        <IconButton
                          aria-label={questionListenLabel}
                          icon={renderSpeakerIcon(isQuestionSynthesizing)}
                          size="sm"
                          fontSize="lg"
                          variant="ghost"
                          onClick={() => handlePlayQuestionTTS(qMA)}
                          mr={1}
                        />
                        <Text
                          fontSize="lg"
                          fontWeight="medium"
                          flex="1"
                          lineHeight="tall"
                        >
                          {renderMaPrompt() || (loadingQMA ? "…" : "")}
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
                            key={`ma-bank-${idx}`}
                          >
                            {(dragProvided, snapshot) => (
                              <Box
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => {
                                  playSound(selectSound);
                                  handleMaAnswerClick(idx, position);
                                }}
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
                                _hover={{
                                  bg: "rgba(128,90,213,0.12)",
                                  borderColor: "purple.200",
                                }}
                                transition="all 0.15s ease"
                              >
                                {choicesMA[idx]}
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
                      <CopyAllBtn q={qMA} h={hMA} tr={showTRMA ? trMA : ""} />
                      <IconButton
                        aria-label={questionListenLabel}
                        icon={renderSpeakerIcon(isQuestionSynthesizing)}
                        size="sm"
                        fontSize="lg"
                        variant="ghost"
                        onClick={() => handlePlayQuestionTTS(qMA)}
                        mr={1}
                      />
                      <Text
                        fontSize="lg"
                        fontWeight="medium"
                        flex="1"
                        lineHeight="tall"
                      >
                        {qMA || (loadingQMA ? "…" : "")}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
                <Stack spacing={3} align="stretch">
                  {(choicesMA.length
                    ? choicesMA
                    : loadingQMA
                    ? ["…", "…", "…", "…", "…"]
                    : []
                  ).map((c, i) => {
                    const isSelected = picksMA.includes(c);
                    return (
                      <Box
                        key={i}
                        onClick={() => {
                          if (!choicesMA.length) return;
                          playSound(selectSound);
                          if (isSelected) {
                            setPicksMA(picksMA.filter((p) => p !== c));
                          } else {
                            setPicksMA([...picksMA, c]);
                          }
                        }}
                        cursor={choicesMA.length ? "pointer" : "not-allowed"}
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
                          choicesMA.length
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
                        opacity={choicesMA.length ? 1 : 0.5}
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
                  isDisabled={loadingQMA || loadingGMA}
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
                  loadingGMA ||
                  !choicesMA.length ||
                  !maReady ||
                  (isFinalQuiz && quizCurrentQuestionAttempted)
                }
                px={{ base: 7, md: 12 }}
                py={{ base: 3, md: 4 }}
              >
                {loadingGMA ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
            </Stack>

            <FeedbackRail
              ok={lastOk}
              xp={recentXp}
              showNext={showNextButton}
              onNext={handleNext}
              nextLabel={nextLabel}
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
        {mode === "speak" && (sTarget || loadingQSpeak) ? (
          <>
            <HStack justify="space-between" align="center" mb={2}>
              <Text fontSize="xl" fontWeight="bold" color="white" mb={0}>
                {userLanguage === "es" ? "Dilo en voz alta" : "Say it aloud"}
              </Text>
              {(sVariant === "translate" || sVariant === "complete") ? (
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
                  onClick={sendSpeakHelp}
                  isDisabled={isLoadingAssistantSupport || !!assistantSupportText}
                />
              ) : null}
            </HStack>
            {loadingQSpeak ? (
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
                    {sStimulus || sTarget || "…"}
                  </Text>
                </Box>
              </>
            )}

            {sRecognized && lastOk !== true ? (
              <Text fontSize="sm" mt={3} color="teal.200">
                <Text as="span" fontWeight="600">
                  {t("vocab_speak_last_heard") ||
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
                  isDisabled={loadingQSpeak || isSpeakRecording}
                  px={{ base: 6, md: 10 }}
                  py={{ base: 3, md: 4 }}
                >
                  {skipLabel}
                </Button>
              )}
              <Button
                colorScheme={isSpeakRecording ? "red" : isSpeakConnecting ? "yellow" : "teal"}
                px={{ base: 7, md: 12 }}
                py={{ base: 3, md: 4 }}
                leftIcon={
                  isSpeakConnecting ? (
                    <Spinner size="sm" />
                  ) : isSpeakRecording ? (
                    <RiStopCircleLine />
                  ) : (
                    <PiMicrophoneStageDuotone />
                  )
                }
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
                          t("vocab_speak_unavailable") ||
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
                            ? "Inténtalo nuevamente."
                            : "Please try again.",
                        status: "error",
                        duration: 2500,
                      });
                    }
                  }
                }}
                isDisabled={!supportsSpeak || loadingQSpeak || !sTarget || isSpeakConnecting}
              >
                {isSpeakConnecting
                  ? userLanguage === "es"
                    ? "Conectando..."
                    : "Connecting..."
                  : isSpeakRecording
                  ? t("vocab_speak_stop") ||
                    (userLanguage === "es" ? "Detener" : "Stop")
                  : t("vocab_speak_record") ||
                    (userLanguage === "es" ? "Grabar" : "Record")}
              </Button>
            </Stack>

            <FeedbackRail
              ok={lastOk}
              xp={recentXp}
              showNext={showNextButton}
              onNext={handleNext}
              nextLabel={nextLabel}
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

            {lastOk === true ? (
              <SpeakSuccessCard
                title={
                  t("vocab_speak_success_title") ||
                  (userLanguage === "es"
                    ? "¡Gran pronunciación!"
                    : "Great pronunciation!")
                }
                scoreLabel={
                  sEval
                    ? t("vocab_speak_success_desc", { score: sEval.score }) ||
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
                                {t("vocab_dnd_drop_here")}
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
                  {t("vocab_dnd_bank")}
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
                  px={{ base: 6, md: 10 }}
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
                px={{ base: 7, md: 12 }}
                py={{ base: 3, md: 4 }}
              >
                {loadingMJ ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
            </Stack>

            <FeedbackRail
              ok={lastOk}
              xp={recentXp}
              showNext={showNextButton}
              onNext={handleNext}
              nextLabel={nextLabel}
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
              showNext={showNextButton}
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
              showNext={showNextButton}
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

      {/* Quiz Success Modal */}
      <Modal
        isOpen={showQuizSuccessModal}
        onClose={() => setShowQuizSuccessModal(false)}
        isCentered
        size="lg"
        closeOnOverlayClick={false}
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="white"
          borderRadius="2xl"
          boxShadow="2xl"
          maxW={{ base: "90%", sm: "md" }}
        >
          <ModalBody py={12} px={8}>
            <VStack spacing={6} textAlign="center">
              {/* Celebration Icon */}
              <Box position="relative" w="120px" h="120px">
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="80px"
                  h="80px"
                  borderRadius="full"
                  bgGradient="linear(135deg, yellow.300, yellow.400, orange.400)"
                  boxShadow="0 0 40px rgba(251, 191, 36, 0.6), 0 0 80px rgba(251, 191, 36, 0.4)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  animation="pulse 2s ease-in-out infinite"
                  sx={{
                    "@keyframes pulse": {
                      "0%, 100%": {
                        transform: "translate(-50%, -50%) scale(1)",
                        boxShadow:
                          "0 0 40px rgba(251, 191, 36, 0.6), 0 0 80px rgba(251, 191, 36, 0.4)",
                      },
                      "50%": {
                        transform: "translate(-50%, -50%) scale(1.1)",
                        boxShadow:
                          "0 0 60px rgba(251, 191, 36, 0.8), 0 0 120px rgba(251, 191, 36, 0.6)",
                      },
                    },
                  }}
                >
                  <Box
                    fontSize="3xl"
                    color="white"
                    fontWeight="black"
                    textShadow="0 2px 4px rgba(0,0,0,0.3)"
                  >
                    ★
                  </Box>
                </Box>
              </Box>

              {/* Title */}
              <VStack spacing={2}>
                <Text fontSize="3xl" fontWeight="bold">
                  {userLanguage === "es" ? "¡Prueba Aprobada!" : "Quiz Passed!"}
                </Text>
                <Text fontSize="lg" opacity={0.9}>
                  {userLanguage === "es"
                    ? "¡Felicitaciones!"
                    : "Congratulations!"}
                </Text>
              </VStack>

              {/* Score Display */}
              <Box
                bg="whiteAlpha.200"
                borderRadius="xl"
                py={6}
                px={8}
                width="100%"
                border="2px solid"
                borderColor="whiteAlpha.400"
              >
                <VStack spacing={2}>
                  <Text
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    opacity={0.8}
                  >
                    {userLanguage === "es" ? "Puntuación" : "Score"}
                  </Text>
                  <Text fontSize="5xl" fontWeight="bold" color="yellow.300">
                    {quizCorrectAnswers}/{quizConfig.questionsRequired}
                  </Text>
                  <Text fontSize="sm" opacity={0.8}>
                    {userLanguage === "es"
                      ? `${quizCorrectAnswers} correctas • Necesitabas ${quizConfig.passingScore}`
                      : `${quizCorrectAnswers} correct • Needed ${quizConfig.passingScore}`}
                  </Text>
                </VStack>
              </Box>

              {/* Continue Button */}
              <Button
                size="lg"
                width="100%"
                bg="white"
                color="purple.600"
                _hover={{ bg: "gray.100" }}
                _active={{ bg: "gray.200" }}
                onClick={handleExitQuiz}
                fontWeight="bold"
                fontSize="lg"
                py={6}
              >
                {userLanguage === "es" ? "Continuar" : "Continue"}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Quiz Failure Modal */}
      <Modal
        isOpen={showQuizFailureModal}
        onClose={() => setShowQuizFailureModal(false)}
        isCentered
        size="lg"
        closeOnOverlayClick={false}
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent
          bg="linear-gradient(135deg, #e53e3e 0%, #c53030 100%)"
          color="white"
          borderRadius="2xl"
          boxShadow="2xl"
          maxW={{ base: "90%", sm: "md" }}
        >
          <ModalBody py={12} px={8}>
            <VStack spacing={6} textAlign="center">
              {/* Failure Icon */}
              <Box position="relative" w="120px" h="120px">
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="80px"
                  h="80px"
                  borderRadius="full"
                  bg="red.400"
                  boxShadow="0 0 40px rgba(245, 101, 101, 0.6)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box fontSize="3xl" color="white" fontWeight="black">
                    ✗
                  </Box>
                </Box>
              </Box>

              {/* Title */}
              <VStack spacing={2}>
                <Text fontSize="3xl" fontWeight="bold">
                  {userLanguage === "es"
                    ? "Prueba No Aprobada"
                    : "Quiz Not Passed"}
                </Text>
                <Text fontSize="lg" opacity={0.9}>
                  {userLanguage === "es" ? "Inténtalo de nuevo" : "Try again"}
                </Text>
              </VStack>

              {/* Score Display */}
              <Box
                bg="whiteAlpha.200"
                borderRadius="xl"
                py={6}
                px={8}
                width="100%"
                border="2px solid"
                borderColor="whiteAlpha.400"
              >
                <VStack spacing={2}>
                  <Text
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    opacity={0.8}
                  >
                    {userLanguage === "es" ? "Puntuación" : "Score"}
                  </Text>
                  <Text fontSize="5xl" fontWeight="bold" color="red.200">
                    {quizCorrectAnswers}/{quizConfig.questionsRequired}
                  </Text>
                  <Text fontSize="sm" opacity={0.8}>
                    {userLanguage === "es"
                      ? `${quizCorrectAnswers} correctas • Necesitas ${quizConfig.passingScore} para aprobar`
                      : `${quizCorrectAnswers} correct • Need ${quizConfig.passingScore} to pass`}
                  </Text>
                </VStack>
              </Box>

              {/* Action Buttons */}
              <VStack spacing={3} width="100%">
                <Button
                  size="lg"
                  width="100%"
                  bg="white"
                  color="red.600"
                  _hover={{ bg: "gray.100" }}
                  _active={{ bg: "gray.200" }}
                  onClick={handleRetryQuiz}
                  fontWeight="bold"
                  fontSize="lg"
                  py={6}
                >
                  {userLanguage === "es" ? "Intentar de Nuevo" : "Try Again"}
                </Button>
                <Button
                  size="lg"
                  width="100%"
                  variant="outline"
                  borderColor="whiteAlpha.600"
                  color="white"
                  _hover={{ bg: "whiteAlpha.200" }}
                  _active={{ bg: "whiteAlpha.300" }}
                  onClick={handleExitQuiz}
                  fontWeight="bold"
                  fontSize="lg"
                  py={6}
                >
                  {userLanguage === "es"
                    ? "Volver al Árbol"
                    : "Back to Skill Tree"}
                </Button>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
