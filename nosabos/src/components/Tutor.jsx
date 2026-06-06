// components/Tutor.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Heading,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Portal,
  VStack,
  Wrap,
  Spinner,
  WrapItem,
  useDisclosure,
  useBreakpointValue,
} from "@chakra-ui/react";
import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";
import { PiMicrophoneStageDuotone } from "react-icons/pi";
import { FaStop, FaRegCommentDots } from "react-icons/fa";
import { MdOutlineTranslate } from "react-icons/md";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBookOpenLine,
  RiCheckLine,
  RiLockLine,
  RiRoadMapLine,
  RiTrophyLine,
  RiVolumeUpLine,
} from "react-icons/ri";

import { doc, setDoc, getDoc, increment } from "firebase/firestore";
import {
  appCheckFetch,
  database,
  analytics,
  gradingLiteModel,
} from "../firebaseResources/firebaseResources";
// Schema comes from firebase/ai (same package as getLiveGenerativeModel in the
// bridge) so the tool's parameter schema matches what the Live model expects —
// not the @firebase/vertexai Schema re-exported by firebaseResources.
import { Schema } from "firebase/ai";
import { logEvent } from "firebase/analytics";

import useUserStore from "../hooks/useUserStore";
import VoiceOrb from "./VoiceOrb";
import {
  CHAT_LOG_HIGHLIGHT_DURATION_MS,
  getChatLogButtonHighlightProps,
  getRealtimeOrbVisualState,
} from "./realtimeArchiveStream";
import { translations } from "../utils/translation";
import {
  buildMessageTranslationPrompt,
  getBaseLanguageCode,
  resolveSupportUiLanguage,
} from "../utils/supportTranslation";
import { getBidiTextProps, mergeBidiSx } from "../utils/bidiText";
import { awardXp } from "../utils/utils";
import {
  completeTutorLesson,
  getLanguageXp,
  saveTutorAgendaProgress,
  saveTutorLessonEarnedXp,
  startTutorLesson,
} from "../utils/progressTracking";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_GLOW,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";
import {
  DEFAULT_TTS_VOICE,
  TTS_LANG_TAG,
  getPreferredTTSVoice,
  getTTSPlayer,
} from "../utils/tts";
import { createGeminiLiveRealtimeBridge } from "../utils/geminiLiveBridge";
import { normalizeGeminiLiveVoice } from "../utils/geminiLiveVoices";
import { getCEFRPromptHint } from "../utils/cefrUtils";
import {
  loadMultiLevelLearningPath,
  SKILL_STATUS,
} from "../data/skillTree/index.js";
import useSoundSettings from "../hooks/useSoundSettings";
import { listeningCueSound } from "../constants/sounds";
import submitActionSound from "../assets/submitaction.mp3";
import XpProgressHeader from "./XpProgressHeader";
import RandomCharacter from "./RandomCharacter";
import { useThemeStore } from "../useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  getLanguagePromptName,
  LANGUAGE_LOCALES,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";
import {
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "../utils/modalMotion";

const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const TRANSLATE_MODEL =
  import.meta.env.VITE_OPENAI_TRANSLATE_MODEL || "gpt-5-nano";
const AUTO_DISCONNECT_MS = 15000;
const ARCHIVE_GLYPH_DURATION_MS = 680;
const ARCHIVE_GLYPH_DURATION_VARIANCE_MS = 150;
const ARCHIVE_ANIMATION_BUFFER_MS = 180;
const ARCHIVE_GLYPH_STREAM_SPREAD_MS = 180;
const ARCHIVE_GLYPH_STREAM_JITTER_MS = 22;
const ARCHIVE_INCOMING_HOLD_MS = 170;
const archiveLayoutCache = new Map();
let archiveMeasureContext = null;
const TUTOR_CODE_SWITCHING_AUDIO_INSTRUCTION =
  "You are a language tutor. Correct target-language pronunciation is required. When code switching, switch accent and phonology for the target-language words instead of reading them with the surrounding language accent.";

/* ---------------------------
   Utils & helpers
--------------------------- */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const MOBILE_TEXT_SX = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "break-word",
  hyphens: "auto",
};
const MATRIX_PANEL_SX = {
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 20% 15%, rgba(30,64,175,0.12) 0%, transparent 42%), " +
    "radial-gradient(circle at 82% 25%, rgba(6,95,70,0.1) 0%, transparent 40%), " +
    "radial-gradient(circle at 50% 100%, rgba(15,23,42,0.52) 0%, transparent 62%), " +
    "linear-gradient(180deg, rgba(2,6,14,0.98) 0%, rgba(1,3,10,0.99) 100%)",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 1px, transparent 1px, transparent 28px), " +
      "repeating-linear-gradient(90deg, rgba(148,163,184,0.05) 0px, rgba(148,163,184,0.05) 1px, transparent 1px, transparent 28px)",
    opacity: 0.45,
    mixBlendMode: "screen",
    pointerEvents: "none",
  },
  "& > *": {
    position: "relative",
    zIndex: 1,
  },
};
const PAPER_PANEL_SX = {
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 18% 16%, rgba(172,142,110,0.12) 0%, transparent 42%), " +
    "radial-gradient(circle at 82% 20%, rgba(217,192,164,0.12) 0%, transparent 38%), " +
    "linear-gradient(180deg, rgba(255,249,242,0.98) 0%, rgba(248,241,232,0.98) 100%)",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(155,135,112,0.05) 0px, rgba(155,135,112,0.05) 1px, transparent 1px, transparent 28px), " +
      "repeating-linear-gradient(90deg, rgba(155,135,112,0.04) 0px, rgba(155,135,112,0.04) 1px, transparent 1px, transparent 28px)",
    opacity: 0.24,
    mixBlendMode: "multiply",
    pointerEvents: "none",
  },
  "& > *": {
    position: "relative",
    zIndex: 1,
  },
};
const TUTOR_MESSAGE_PANEL_SX = {
  position: "relative",
  overflow: "hidden",
  backgroundColor: "rgba(241, 228, 211, 0.98)",
  "& > *": {
    position: "relative",
    zIndex: 1,
  },
};
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_SHADOW = "var(--app-shadow-soft)";
const TUTOR_CEFR_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];
const TUTOR_LEVEL_INFO = {
  "Pre-A1": {
    label: "A0",
    name: { en: "Ultimate Beginner", es: "Principiante Total" },
    description: { en: "First words and recognition", es: "Primeras palabras" },
    color: "#8B5CF6",
  },
  A1: {
    label: "A1",
    name: { en: "Beginner", es: "Principiante" },
    description: { en: "Basic survival language", es: "Lenguaje basico" },
    color: "#3B82F6",
  },
  A2: {
    label: "A2",
    name: { en: "Elementary", es: "Elemental" },
    description: {
      en: "Simple everyday communication",
      es: "Comunicacion cotidiana",
    },
    color: "#8B5CF6",
  },
  B1: {
    label: "B1",
    name: { en: "Intermediate", es: "Intermedio" },
    description: {
      en: "Handle everyday situations",
      es: "Situaciones cotidianas",
    },
    color: "#A855F7",
  },
  B2: {
    label: "B2",
    name: { en: "Upper Intermediate", es: "Intermedio Alto" },
    description: { en: "Complex discussions", es: "Discusiones complejas" },
    color: "#F97316",
  },
  C1: {
    label: "C1",
    name: { en: "Advanced", es: "Avanzado" },
    description: { en: "Sophisticated language use", es: "Uso sofisticado" },
    color: "#EF4444",
  },
  C2: {
    label: "C2",
    name: { en: "Mastery", es: "Maestria" },
    description: {
      en: "Near-native proficiency",
      es: "Competencia casi nativa",
    },
    color: "#EC4899",
  },
};

function isTutorEarlyLevel(level) {
  return level === "Pre-A1" || level === "A1";
}

function isTutorAdvancedConversationLevel(level) {
  return level === "B2" || level === "C1" || level === "C2";
}
const TUTOR_STARTER_LESSON_IDS = new Set([
  "lesson-tutorial-1",
  "lesson-tutorial-a1",
]);
const TUTOR_STARTER_LESSON_XP_REQUIRED = 50;
const TUTOR_LESSON_XP_REQUIRED_MIN = 60;
const TUTOR_LESSON_XP_REQUIRED_MAX = 90;
const TUTOR_TURN_XP_RANGE = { min: 3, max: 7 };
const TUTOR_TASK_VARIATIONS = [
  "Ask one tiny meaning-check question about the current lesson concept.",
  "Give a fill-in-the-blank prompt using a current lesson phrase.",
  "Offer two short choices and ask the learner to pick the correct one.",
  "Ask the learner to transform or personalize a current lesson phrase.",
  "Set up a tiny realistic scenario and ask for one short reply.",
  "Ask the learner to combine two already covered lesson concepts.",
];
const TUTOR_SIGNATURE_EXPERIENCES = {
  microMission: {
    label: "Micro mission",
    instruction:
      "Give the next few turns a clear tiny goal, such as introduce yourself, order one item, get one detail, explain one problem, or defend one opinion. Keep it tied to the lesson agenda and celebrate the specific win when the learner completes the goal.",
  },
  askMeBack: {
    label: "Ask-me-back",
    instruction:
      "After the learner answers a question, coach them to ask the same or a related question back. This trains conversation flow, not only answering.",
  },
  listeningCheckpoint: {
    label: "Listening checkpoint",
    instruction:
      "Say one short target-language sentence or phrase, then ask the learner to prove they understood one detail. Use yes/no, either/or, or a tiny answer at lower levels.",
  },
  mistakeComeback: {
    label: "Comeback moment",
    instruction:
      "Bring back a phrase, pattern, or meaning the learner recently missed, hesitated on, or needed help with. If there was no clear miss, use quick recall of an earlier lesson phrase. Make it feel like an easy redemption moment.",
  },
  conversationRepair: {
    label: "Conversation repair",
    instruction:
      "Practice what to do when communication breaks: ask for repetition, ask what a word means, correct a misunderstanding, clarify a time/place/detail, or say you meant a different thing.",
  },
  informationGap: {
    label: "Information gap",
    instruction:
      "Give the learner missing information they must ask for, such as time, place, price, name, reason, or preference. Let their question unlock the next reply.",
  },
  pushbackPractice: {
    label: "Pushback practice",
    instruction:
      "Gently challenge the learner's answer once, then ask them to clarify, support, soften, or revise their point. Keep the challenge friendly and level-appropriate.",
  },
  polishMode: {
    label: "Polish mode",
    instruction:
      "After the learner gives an understandable answer, ask for a more natural, polite, concise, professional, casual, or precise version. Focus on tone and style instead of basic correctness.",
  },
};
const TUTOR_SIGNATURE_EXPERIENCE_POOLS = {
  "Pre-A1": ["microMission", "listeningCheckpoint", "mistakeComeback"],
  A1: [
    "microMission",
    "askMeBack",
    "listeningCheckpoint",
    "mistakeComeback",
    "conversationRepair",
  ],
  A2: [
    "microMission",
    "conversationRepair",
    "listeningCheckpoint",
    "askMeBack",
    "informationGap",
    "mistakeComeback",
  ],
  B1: [
    "microMission",
    "informationGap",
    "conversationRepair",
    "askMeBack",
    "mistakeComeback",
    "pushbackPractice",
  ],
  B2: [
    "microMission",
    "conversationRepair",
    "listeningCheckpoint",
    "pushbackPractice",
    "polishMode",
    "informationGap",
  ],
  C1: [
    "polishMode",
    "pushbackPractice",
    "conversationRepair",
    "microMission",
    "informationGap",
    "listeningCheckpoint",
  ],
  C2: [
    "polishMode",
    "pushbackPractice",
    "conversationRepair",
    "microMission",
    "informationGap",
    "listeningCheckpoint",
  ],
};
const TUTOR_STARTER_AGENDA_ITEMS = [
  {
    id: "hello",
    label: {
      en: "hello",
      es: "hola",
      pt: "ola",
      it: "ciao",
      fr: "bonjour",
      de: "hallo",
      ja: "こんにちは",
      hi: "नमस्ते",
      ar: "أهلًا",
      zh: "你好",
      nl: "hallo",
    },
    examples: {
      en: ["hello", "hi"],
      es: ["hola", "ola"],
      pt: ["ola", "olá", "oi"],
      it: ["ciao", "salve"],
      fr: ["bonjour", "salut"],
      de: ["hallo", "guten tag"],
      ja: ["こんにちは"],
      zh: ["你好"],
      nl: ["hallo", "hoi"],
    },
  },
  {
    id: "myNameIs",
    label: {
      en: "my name is",
      es: "me llamo",
      pt: "meu nome e",
      it: "mi chiamo",
      fr: "je m'appelle",
      de: "ich heisse",
      ja: "私の名前は",
      hi: "मेरा नाम है",
      ar: "اسمي",
      zh: "我叫",
      nl: "ik heet",
    },
    examples: {
      en: ["my name is", "i am"],
      es: [
        "me llamo",
        "me yamo",
        "me lamo",
        "mi llamo",
        "mi yamo",
        "mi nombre es",
      ],
      pt: ["meu nome e", "meu nome é", "me chamo"],
      it: ["mi chiamo", "il mio nome e", "il mio nome è"],
      fr: ["je m'appelle", "mon nom est"],
      de: ["ich heisse", "ich heiße", "mein name ist"],
      ja: ["私の名前は", "と申します"],
      zh: ["我叫", "我的名字是"],
      nl: ["ik heet", "mijn naam is"],
    },
  },
  {
    id: "goodMorning",
    label: {
      en: "good morning",
      es: "buenos días",
      pt: "bom dia",
      it: "buongiorno",
      fr: "bonjour",
      de: "guten morgen",
      ja: "おはよう",
      hi: "सुप्रभात",
      ar: "صباح الخير",
      zh: "早上好",
      nl: "goedemorgen",
    },
    examples: {
      en: ["good morning"],
      es: ["buenos días", "buenos dias", "buen día", "buen dia"],
      pt: ["bom dia"],
      it: ["buongiorno"],
      fr: ["bonjour"],
      de: ["guten morgen"],
      ja: ["おはよう"],
      zh: ["早上好"],
      nl: ["goedemorgen"],
    },
  },
  {
    id: "goodAfternoon",
    label: {
      en: "good afternoon",
      es: "buenas tardes",
      pt: "boa tarde",
      it: "buon pomeriggio",
      fr: "bon apres-midi",
      de: "guten nachmittag",
      ja: "こんにちは",
      hi: "नमस्कार",
      ar: "مساء الخير",
      zh: "下午好",
      nl: "goedemiddag",
    },
    examples: {
      en: ["good afternoon"],
      es: ["buenas tardes"],
      pt: ["boa tarde"],
      it: ["buon pomeriggio"],
      fr: ["bon apres-midi", "bon après-midi"],
      de: ["guten nachmittag"],
      ja: ["こんにちは"],
      zh: ["下午好"],
      nl: ["goedemiddag"],
    },
  },
  {
    id: "goodNight",
    label: {
      en: "good night",
      es: "buenas noches",
      pt: "boa noite",
      it: "buona notte",
      fr: "bonne nuit",
      de: "gute nacht",
      ja: "おやすみ",
      hi: "शुभ रात्रि",
      ar: "تصبح على خير",
      zh: "晚安",
      nl: "goedenacht",
    },
    examples: {
      en: ["good night"],
      es: ["buenas noches"],
      pt: ["boa noite"],
      it: ["buona notte", "buonanotte"],
      fr: ["bonne nuit", "bonsoir"],
      de: ["gute nacht"],
      ja: ["おやすみ"],
      zh: ["晚安", "晚上好"],
      nl: ["goedenacht", "goedeavond"],
    },
  },
  {
    id: "howAreYou",
    label: {
      en: "how are you",
      es: "cómo estás",
      pt: "como voce esta",
      it: "come stai",
      fr: "comment ca va",
      de: "wie geht es dir",
      ja: "お元気ですか",
      hi: "आप कैसे हैं",
      ar: "كيف حالك",
      zh: "你好吗",
      nl: "hoe gaat het",
    },
    examples: {
      en: ["how are you", "how's it going"],
      es: [
        "cómo estás",
        "como estas",
        "cómo está",
        "como esta",
        "qué tal",
        "que tal",
      ],
      pt: ["como voce esta", "como você está", "tudo bem"],
      it: ["come stai"],
      fr: ["comment ca va", "comment ça va"],
      de: ["wie geht es dir", "wie geht es ihnen"],
      ja: ["お元気ですか"],
      zh: ["你好吗", "你怎么样"],
      nl: ["hoe gaat het"],
    },
  },
];

function tutorCopy(lang, copy) {
  const normalized = normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE);
  return copy[normalized] || copy.en || "";
}

function getTutorDisplayText(textObj, lang = "en") {
  if (!textObj) return "";
  if (typeof textObj === "string") return textObj;
  return (
    textObj[lang] ||
    textObj.en ||
    textObj.es ||
    Object.values(textObj).find(Boolean) ||
    ""
  );
}

function compactUnique(items) {
  const seen = new Set();
  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getTutorLessonSubjects(lesson) {
  const content = lesson?.content || {};
  const subjects = [];
  Object.entries(content).forEach(([mode, block]) => {
    if (!block || typeof block !== "object") return;
    if (block.topic) subjects.push(`${mode}: ${block.topic}`);
    if (block.scenario) subjects.push(`${mode} scenario: ${block.scenario}`);
    if (block.prompt) subjects.push(`${mode} prompt: ${block.prompt}`);
    if (Array.isArray(block.focusPoints) && block.focusPoints.length) {
      subjects.push(`${mode} focus: ${block.focusPoints.join(", ")}`);
    }
  });
  return compactUnique(subjects);
}

function buildTutorLessonContext(
  lesson,
  unit,
  supportLang = "en",
  targetLang = "es",
) {
  if (!lesson) return null;
  const subjects = getTutorLessonSubjects(lesson);
  const title = getTutorDisplayText(lesson.title, supportLang);
  const description = getTutorDisplayText(lesson.description, supportLang);
  const unitTitle = getTutorDisplayText(unit?.title, supportLang);
  const agendaTitle = getTutorLessonAgendaTitle(lesson, unit, supportLang);
  const agendaSubtitle = getTutorLessonAgendaSubtitle(
    lesson,
    unit,
    supportLang,
  );
  const includeSourceDetails = !isTutorStarterAgendaLesson(lesson);
  const targetLanguageName =
    getLanguagePromptName(targetLang) || "the target language";
  const supportLanguageName =
    getLanguagePromptName(supportLang) || "the user's support language";
  const targetBase = getBaseLanguageCode(targetLang || "es") || "es";
  return {
    level: unit?.cefrLevel || unit?.level || "",
    title,
    description,
    unitTitle,
    agendaTitle,
    agendaSubtitle,
    subjects,
    promptText: compactUnique([
      `Target language for learner practice: ${targetLanguageName}.`,
      `Support/UI language for explanations: ${supportLanguageName}.`,
      includeSourceDetails && unitTitle
        ? `Support-language unit label: ${unitTitle}`
        : "",
      agendaTitle ? `Support-language lesson label: ${agendaTitle}` : "",
      agendaSubtitle ? `Lesson concept/focus: ${agendaSubtitle}` : "",
      includeSourceDetails && title ? `Source lesson label: ${title}` : "",
      includeSourceDetails && description
        ? `Source lesson description: ${description}`
        : "",
      includeSourceDetails && subjects.length
        ? `Stored source concepts: ${subjects.join(" | ")}`
        : "",
      includeSourceDetails && targetBase !== "es"
        ? `If any stored concept is written as Spanish, translate or adapt that concept into ${targetLanguageName}; never use the Spanish source wording as the learner's practice phrase.`
        : "",
    ]).join("\n"),
  };
}

function buildTutorCodeSwitchingAudioInstruction(
  targetLanguageName = "",
  supportLanguageName = "",
) {
  return [
    TUTOR_CODE_SWITCHING_AUDIO_INSTRUCTION,
    targetLanguageName
      ? `When you include ${targetLanguageName} words or phrases, pronounce those words with native-like ${targetLanguageName} sounds, rhythm, stress, and intonation even if the surrounding tutoring language is different.`
      : "",
    targetLanguageName && supportLanguageName
      ? `Do not anglicize, hispanicize, or otherwise adapt ${targetLanguageName} model phrases to ${supportLanguageName} pronunciation. The accent must switch for the target phrase itself.`
      : "",
    targetLanguageName
      ? `Before and after each ${targetLanguageName} model phrase, separate it naturally with normal speech timing so the audio clearly switches into ${targetLanguageName} pronunciation.`
      : "",
    targetLanguageName
      ? `Say each ${targetLanguageName} model phrase as a short standalone phrase. Do not blend its sounds into a support-language sentence.`
      : "",
    "Never write visible timing, SSML, or control tags such as <pause>, </pause>, <break>, or [pause]. Use normal punctuation only.",
    "Write target-language words in normal spelling. Do not use phonetic respelling, hyphenation, or transliteration unless the learner explicitly asks.",
  ]
    .filter(Boolean)
    .join(" ");
}

const SPANISH_SOURCE_TOKENS = new Set([
  "buen",
  "buena",
  "buenas",
  "buenos",
  "como",
  "dias",
  "el",
  "estas",
  "familia",
  "hermana",
  "hermano",
  "hola",
  "la",
  "las",
  "llama",
  "llamo",
  "los",
  "madre",
  "mama",
  "mi",
  "mis",
  "noches",
  "padre",
  "papa",
  "se",
  "tardes",
]);

function isLikelySpanishSourcePhrase(text = "") {
  const normalized = normalizeTutorAgendaSpeech(text);
  if (!normalized) return false;
  const tokens = normalized.split(/\s+/).filter(Boolean);
  return tokens.some((token) => SPANISH_SOURCE_TOKENS.has(token));
}

function isTutorPracticePhraseAllowedForTarget(phrase, targetLang = "es") {
  const targetBase = getBaseLanguageCode(targetLang || "es") || "es";
  if (targetBase === "es") return true;
  return !isLikelySpanishSourcePhrase(phrase);
}

function buildTutorTargetLanguageBoundaryInstruction({
  targetLang = "es",
  supportLang = "en",
  targetLanguageName = "the target language",
  supportLanguageName = "the user's support language",
} = {}) {
  const targetBase = getBaseLanguageCode(targetLang || "es") || "es";
  const supportBase = getBaseLanguageCode(supportLang || "") || "";
  const supportBoundary =
    supportBase && supportBase !== targetBase
      ? `${supportLanguageName} is only for coaching, meanings, and UI labels.`
      : "";

  return [
    `LANGUAGE BOUNDARY: The learner is practicing ${targetLanguageName}.`,
    supportBoundary,
    `Every model phrase, repeat prompt, fill-in-the-blank, example sentence, and answer you ask the learner to say must be in ${targetLanguageName}.`,
    targetBase !== "es"
      ? `Some stored lesson labels and focus points are Spanish source curriculum. Treat Spanish phrases like "mi padre", "mi mama", "hola", or "me llamo" as concepts to convert into ${targetLanguageName}; do not ask the learner to practice Spanish.`
      : "",
    `If a previous message accidentally used a non-${targetLanguageName} practice phrase, correct course immediately and continue in ${targetLanguageName}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildTutorTeacherTalkLanguageInstruction({
  targetLang = "es",
  supportLang = "en",
  targetLanguageName = "the target language",
  supportLanguageName = "the user's support language",
  isEarlyTutorLevel = false,
} = {}) {
  const targetBase = getBaseLanguageCode(targetLang || "es") || "es";
  const supportBase = getBaseLanguageCode(supportLang || "") || "";
  if (!isEarlyTutorLevel || !supportBase || supportBase === targetBase) {
    return "";
  }

  return [
    `BEGINNER TEACHER-TALK RULE: The learner is at A0/A1, so all tutoring language must be in ${supportLanguageName}.`,
    `Use ${targetLanguageName} only for the exact word, phrase, sentence, or fill-in text the learner should say.`,
    `Corrections, encouragement, transitions, explanations, meanings, and instructions must be in ${supportLanguageName}, not ${targetLanguageName}.`,
    `Do not say teacher-talk phrases like "Good try", "Let's slow it down", "Listen again", or "Now you try" in ${targetLanguageName}; express that teacher talk in ${supportLanguageName}.`,
    `Do not split ${targetLanguageName} words into syllables unless the learner explicitly asks for pronunciation help.`,
  ].join(" ");
}

function extractRealtimeItemText(item) {
  const parts = Array.isArray(item?.content) ? item.content : [];
  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getTutorStarterAgendaTitleText() {
  return {
    en: "Tutorial - Basic Introductions",
    es: "Tutorial - Introducciones básicas",
    pt: "Tutorial - Apresentações básicas",
    it: "Tutorial - Presentazioni di base",
    fr: "Tutoriel - Présentations de base",
    de: "Tutorial - Einfache Vorstellungen",
    ja: "チュートリアル - 基本的な自己紹介",
    hi: "ट्यूटोरियल - बुनियादी परिचय",
    ar: "الشرح - التعارف الأساسي",
    zh: "教程 - 基本介绍",
    nl: "Tutorial - Eenvoudige kennismakingen",
  };
}

// Tool-call grading (flag-gated, default OFF). When enabled, the Live tutor model
// (which heard the audio) drives grading directly via tools, instead of the verdict
// being reverse-engineered from the (sometimes mistranscribed) transcript:
//   • markTurnSuccessful    — did the learner complete the current task this turn?
//   • proposeLessonComplete — model asks before ending; the app approves or denies.
// The transcript grader and the closing-act judge stay as fallbacks.
const TUTOR_TOOL_GRADING_ENABLED =
  import.meta.env.VITE_GEMINI_LIVE_TOOL_GRADING === "true";

// Safety cap: gemini-2.5 native audio can loop a tool call and never complete the
// turn. If more than this many tool calls arrive in one learner turn, the handler
// aborts the runaway response and reopens the mic so the user is never stuck.
const MAX_TOOL_CALLS_PER_TURN = 3;

function getLiveToolCallArgs(functionCall) {
  const rawArgs =
    functionCall?.args ??
    functionCall?.arguments ??
    functionCall?.parameters ??
    {};
  if (rawArgs && typeof rawArgs === "object") return rawArgs;
  if (typeof rawArgs !== "string") return {};
  try {
    const parsed = JSON.parse(rawArgs);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function buildLiveToolResponse(functionCall, response) {
  const toolResponse = {
    name: functionCall?.name,
    response,
  };
  if (functionCall?.id) {
    toolResponse.id = functionCall.id;
  }
  return toolResponse;
}

const TUTOR_LIVE_TOOLS = {
  functionDeclarations: [
    {
      name: "markTurnSuccessful",
      description:
        "Call markTurnSuccessful(correct:true) ONLY when the learner correctly produces or completes " +
        "the CURRENT requested phrase or task this turn — that is the only thing that earns progress. " +
        "Do NOT call it when: the learner makes a mistake or wrong attempt (instead correct them, and " +
        "call it only after they say it correctly); the learner asks for help, a breakdown, the meaning, " +
        "a repetition, or any question (just help — no progress); or the learner only greets or confirms " +
        "(e.g. 'yes', 'ready'). Call it at most once per correct completion.",
      parameters: Schema.object({
        properties: {
          correct: Schema.boolean({
            description:
              "True only if the learner correctly completed the current requested task this turn.",
          }),
          reason: Schema.string({
            description: "Brief reason for the judgment.",
          }),
        },
        optionalProperties: ["reason"],
      }),
    },
    {
      name: "proposeLessonComplete",
      description:
        "Call this BEFORE ending, summarizing, or saying goodbye to conclude the lesson, when you " +
        "believe it is complete. Do NOT conclude on your own — wait for the response. If not approved, " +
        "the lesson is NOT finished: keep teaching and reviewing the agenda items (and combinations), " +
        "and do not say goodbye. If approved, you may wrap up.",
      parameters: Schema.object({
        properties: {
          reason: Schema.string({
            description: "Brief reason you believe the lesson is complete.",
          }),
        },
        optionalProperties: ["reason"],
      }),
    },
  ],
};

function isTutorStarterAgendaLesson(lesson) {
  const id = String(lesson?.id || "");
  return TUTOR_STARTER_LESSON_IDS.has(id);
}

function getStableTutorLessonXpRequired(lesson) {
  const source = String(
    lesson?.id || lesson?.title?.en || lesson?.title?.es || "tutor-lesson",
  );
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const range = TUTOR_LESSON_XP_REQUIRED_MAX - TUTOR_LESSON_XP_REQUIRED_MIN + 1;
  return TUTOR_LESSON_XP_REQUIRED_MIN + (hash % range);
}

function getTutorLessonXpRequired(lesson) {
  const required = isTutorStarterAgendaLesson(lesson)
    ? TUTOR_STARTER_LESSON_XP_REQUIRED
    : getStableTutorLessonXpRequired(lesson);
  return Math.max(0, Number(required) || 0);
}

function getTutorTaskVariationInstruction(turnCount = 0) {
  const index =
    Math.abs(Number.isFinite(turnCount) ? turnCount : 0) %
    TUTOR_TASK_VARIATIONS.length;
  return `CURRENT TASK FORMAT: ${TUTOR_TASK_VARIATIONS[index]}`;
}

function getTutorSignatureExperienceInstruction({
  selectedLevel = "A1",
  turnCount = 0,
  isKickoff = false,
  isStarterLesson = false,
} = {}) {
  const level = TUTOR_CEFR_LEVELS.includes(selectedLevel)
    ? selectedLevel
    : "A1";
  const pool =
    TUTOR_SIGNATURE_EXPERIENCE_POOLS[level] ||
    TUTOR_SIGNATURE_EXPERIENCE_POOLS.A1;
  const turn = Math.abs(Number.isFinite(turnCount) ? turnCount : 0);
  const preferredId = isKickoff ? "microMission" : pool[turn % pool.length];
  const card =
    TUTOR_SIGNATURE_EXPERIENCES[preferredId] ||
    TUTOR_SIGNATURE_EXPERIENCES.microMission;

  return [
    "SIGNATURE EXPERIENCE LAYER: Keep the existing Tutor agenda and current task formats. Use this as a light overlay, not a replacement for the lesson.",
    "Do not announce internal labels like 'signature experience' to the learner. You may naturally say 'tiny mission' when helpful.",
    `CURRENT SIGNATURE EXPERIENCE: ${card.label}. ${card.instruction}`,
    isStarterLesson
      ? "For the starter introductions lesson, keep the fixed phrase agenda as the source of truth. Use the experience layer only to add listening checks, ask-me-back turns, or tiny missions around the current phrase."
      : "",
    "If the recent on-screen context shows an experience already in progress, continue or complete it before starting a new one.",
  ]
    .filter(Boolean)
    .join(" ");
}

function getStoredTutorLessonEarnedXp(lessonProgress, lesson) {
  const required = getTutorLessonXpRequired(lesson);
  if (lessonProgress?.status === SKILL_STATUS.COMPLETED) return required;
  const earned = Number(lessonProgress?.earnedXp);
  if (!Number.isFinite(earned)) return 0;
  return Math.min(required, Math.max(0, earned));
}

function getTutorStarterAgendaSummary(lang = "en") {
  const normalized = normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE);
  return TUTOR_STARTER_AGENDA_ITEMS.map(
    (item) => item.label[normalized] || item.label.en,
  ).join(", ");
}

function getTutorStarterAgendaPromptText(targetLang = "es") {
  const baseLang = getBaseLanguageCode(targetLang || "es") || "es";
  return TUTOR_STARTER_AGENDA_ITEMS.map((item) => {
    const examples = item.examples[baseLang] || item.examples.en || [];
    return `${item.id}: ${examples.join(" / ")}`;
  }).join("; ");
}

function getTutorStarterItemModelPhrase(item, targetLang = "es") {
  const baseLang = getBaseLanguageCode(targetLang || "es") || "es";
  return (
    item?.examples?.[baseLang]?.[0] ||
    item?.examples?.en?.[0] ||
    item?.label?.en ||
    ""
  );
}

function getTutorStarterItemSupportMeaning(item, supportLang = "en") {
  const normalized = normalizeSupportLanguage(
    supportLang,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  return item?.label?.[normalized] || item?.label?.en || item?.id || "";
}

function getTutorStarterItemSupportTask(item, supportLang = "en") {
  const normalized = normalizeSupportLanguage(
    supportLang,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  if (normalized !== "en") {
    return getTutorStarterItemSupportMeaning(item, normalized);
  }
  const tasks = {
    hello: "learn to say hello",
    myNameIs: "learn to say my name is",
    goodMorning: "learn to say good morning",
    goodAfternoon: "learn to say good afternoon",
    goodNight: "learn to say good night",
    howAreYou: "learn to ask how someone is",
  };
  return tasks[item?.id] || getTutorStarterItemSupportMeaning(item, normalized);
}

function normalizeTutorAgendaSpeech(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:"'()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTutorStarterAgendaMatches(text, targetLang = "es") {
  const baseLang = getBaseLanguageCode(targetLang || "es") || "es";
  const normalizedText = normalizeTutorAgendaSpeech(text);
  if (!normalizedText) return [];

  return TUTOR_STARTER_AGENDA_ITEMS.filter((item) => {
    const examples = item.examples[baseLang] || item.examples.en || [];
    return examples.some((example) => {
      const normalizedExample = normalizeTutorAgendaSpeech(example);
      return normalizedExample && normalizedText.includes(normalizedExample);
    });
  }).map((item) => item.id);
}

function getLatestTutorAssistantText(messages = []) {
  if (!Array.isArray(messages)) return "";
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") continue;
    const text = getTutorMessageVisibleText(message);
    if (text) return text;
  }
  return "";
}

function extractQuotedTutorPhrases(text = "") {
  const phrases = [];
  const source = String(text || "");
  const quotePattern = /["“”]([^"“”]{1,140})["“”]/g;
  let match;
  while ((match = quotePattern.exec(source))) {
    const phrase = String(match[1] || "").trim();
    if (phrase) phrases.push({ phrase, index: match.index });
  }
  return phrases;
}

function extractPromptedTutorPhrases(text = "") {
  const source = String(text || "");
  const quoted = extractQuotedTutorPhrases(source);
  if (!quoted.length) return [];

  const hasFutureCue = (index) => {
    const before = source.slice(Math.max(0, index - 140), index);
    const sentenceStart = Math.max(
      before.lastIndexOf("."),
      before.lastIndexOf("?"),
      before.lastIndexOf("!"),
      before.lastIndexOf("\n"),
    );
    const currentClause = before.slice(sentenceStart + 1);
    return /\b(?:after|later|next|then|luego|despues|después|pronto|seguimos|practicaremos)\b/i.test(
      currentClause,
    );
  };

  const directCuePattern =
    /\b(?:say|saying|repeat|try|answer|respond|tell me|now|your turn|practice|pronounce|ahora|tu turno|tú turno|practica|practicar|di|decir|diga|intenta|repite|responde|contesta|dime|dizer|repita|responda|rispondi|ripeti|dis|dire|repete|répète|réponds|dites)\b/i;
  const modelCuePattern =
    /\b(?:model|modelo|listen|escucha|we say|decimos|se dice)\b/i;
  const prompted = quoted
    .filter(({ index }) => {
      if (hasFutureCue(index)) return false;
      const before = source.slice(Math.max(0, index - 140), index);
      return directCuePattern.test(before);
    })
    .map(({ phrase }) => phrase);

  if (prompted.length) return compactUnique(prompted);

  const modeled = quoted
    .filter(({ index }) => {
      if (hasFutureCue(index)) return false;
      const before = source.slice(Math.max(0, index - 140), index);
      return modelCuePattern.test(before);
    })
    .map(({ phrase }) => phrase);

  return compactUnique(modeled.slice(-1));
}

function tutorPhraseMatchesTranscript(phrase, transcript) {
  const normalizedPhrase = normalizeTutorAgendaSpeech(phrase);
  const normalizedTranscript = normalizeTutorAgendaSpeech(transcript);
  if (!normalizedPhrase || !normalizedTranscript) return false;

  if (normalizedTranscript.includes(normalizedPhrase)) return true;

  const phraseTokens = normalizedPhrase.split(/\s+/).filter(Boolean);
  if (phraseTokens.length <= 1) {
    const escapedToken = phraseTokens[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${escapedToken}($|\\s)`).test(
      normalizedTranscript,
    );
  }

  const transcriptTokens = normalizedTranscript.split(/\s+/).filter(Boolean);
  const matched = phraseTokens.filter((token) =>
    transcriptTokens.includes(token),
  ).length;
  return phraseTokens.length >= 4 && matched >= phraseTokens.length - 1;
}

function tutorPhraseIsDirectAnswer(phrase, transcript) {
  const normalizedPhrase = normalizeTutorAgendaSpeech(phrase);
  const normalizedTranscript = normalizeTutorAgendaSpeech(transcript);
  if (!normalizedPhrase || !normalizedTranscript) return false;
  if (normalizedTranscript === normalizedPhrase) return true;

  const phraseTokens = normalizedPhrase.split(/\s+/).filter(Boolean);
  const transcriptTokens = normalizedTranscript.split(/\s+/).filter(Boolean);
  if (!phraseTokens.length || !transcriptTokens.length) return false;
  if (phraseTokens.length === 1) {
    return (
      transcriptTokens.length === 1 && transcriptTokens[0] === phraseTokens[0]
    );
  }
  if (transcriptTokens.length > phraseTokens.length + 2) return false;

  if (normalizedTranscript.includes(normalizedPhrase)) return true;

  let phraseIndex = 0;
  transcriptTokens.forEach((token) => {
    if (token === phraseTokens[phraseIndex]) phraseIndex += 1;
  });
  return phraseIndex >= phraseTokens.length;
}

function anyTutorPhraseIsDirectAnswer(phrases = [], transcript = "") {
  return phrases.some((phrase) =>
    tutorPhraseIsDirectAnswer(phrase, transcript),
  );
}

function hasTutorMeaningfulTranscript(text = "") {
  const normalized = normalizeTutorAgendaSpeech(text);
  if (!normalized) return false;
  const meaningfulChars = normalized.match(/[\p{L}\p{N}]/gu)?.length || 0;
  if (meaningfulChars >= 2) return true;
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(String(text || ""));
}

function extractGeminiResponseText(resp) {
  const result = resp?.response || resp;
  if (typeof result?.text === "function") return result.text();
  if (typeof result?.text === "string") return result.text;
  const cand = result?.candidates?.[0];
  if (cand?.content?.parts?.length) {
    return cand.content.parts.map((part) => part.text || "").join("");
  }
  return "";
}

function sanitizeTutorAssistantText(text = "", { trim = true } = {}) {
  const value = String(text || "")
    .replace(/<\/?\s*(?:pause|break|silence)\b[^>]*>/gi, " ")
    .replace(/<\s*\/?\s*(?:pause|break|silence)\s*$/gi, "")
    .replace(/\[\s*(?:pause|break|silence)\s*\]/gi, " ")
    .replace(/\(\s*(?:pause|break|silence)\s*\)/gi, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([¿¡])\s+/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
  return trim ? value.trim() : value;
}

function normalizeTutorStarterAgendaProgress(progress = {}) {
  const allowedIds = new Set(TUTOR_STARTER_AGENDA_ITEMS.map((item) => item.id));
  return Object.entries(progress || {}).reduce((acc, [id, value]) => {
    if (allowedIds.has(id) && value === true) acc[id] = true;
    return acc;
  }, {});
}

function getSavedTutorStarterAgendaProgress(lessonProgress) {
  return normalizeTutorStarterAgendaProgress(
    lessonProgress?.tutorAgendaProgress?.items,
  );
}

function getNextTutorStarterAgendaItem(progress = {}) {
  return TUTOR_STARTER_AGENDA_ITEMS.find((item) => !progress[item.id]) || null;
}

function isTutorStarterAgendaComplete(progress = {}) {
  return TUTOR_STARTER_AGENDA_ITEMS.every((item) => progress[item.id]);
}

function cleanTutorSubjectText(subject) {
  return String(subject || "")
    .replace(/^[^:]+:\s*/i, "")
    .replace(/\s*\|\s*/g, ", ")
    .trim();
}

function getTutorLessonAgendaTitle(lesson, unit, lang = "en") {
  if (isTutorStarterAgendaLesson(lesson)) {
    const starterAgenda = getTutorStarterAgendaTitleText();
    return (
      starterAgenda[normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE)] ||
      starterAgenda.en
    );
  }
  return (
    getTutorDisplayText(lesson?.title, lang) ||
    getTutorDisplayText(unit?.title, lang) ||
    tutorCopy(lang, {
      en: "Choose a lesson",
      es: "Elige una leccion",
      pt: "Escolha uma licao",
      it: "Scegli una lezione",
      fr: "Choisis une lecon",
      de: "Waehle eine Lektion",
      ja: "レッスンを選択",
      hi: "एक पाठ चुनें",
      ar: "اختار درس",
      zh: "选择课程",
    })
  );
}

function getTutorLessonAgendaSubtitle(lesson, unit, lang = "en") {
  if (isTutorStarterAgendaLesson(lesson)) {
    return getTutorStarterAgendaSummary(lang);
  }

  const description = getTutorDisplayText(lesson?.description, lang);
  if (description) return description;

  const subject = getTutorLessonSubjects(lesson)
    .map(cleanTutorSubjectText)
    .find(Boolean);
  return (
    subject ||
    getTutorDisplayText(unit?.description, lang) ||
    tutorCopy(lang, {
      en: "Follow the lesson agenda with your tutor.",
      es: "Sigue la agenda de la leccion con tu tutor.",
      pt: "Siga a agenda da licao com seu tutor.",
      it: "Segui l'agenda della lezione con il tutor.",
      fr: "Suis le programme de la lecon avec ton tuteur.",
      de: "Folge der Lektionsagenda mit deinem Tutor.",
      ja: "チューターとレッスン内容に沿って進めます。",
      hi: "अपने tutor के साथ पाठ एजेंडा का पालन करें।",
      ar: "اتبع خطة الدرس مع المعلّم.",
      zh: "跟随导师完成课程安排。",
    })
  );
}

function getTutorLessonFocusAgendaItems(lesson) {
  const content = lesson?.content || {};
  const focusPoints = [];
  Object.values(content).forEach((block) => {
    if (!block || typeof block !== "object") return;
    if (!Array.isArray(block.focusPoints)) return;
    block.focusPoints.forEach((point) => {
      const phrase = String(point || "").trim();
      if (!phrase) return;
      focusPoints.push(phrase);
    });
  });

  return compactUnique(focusPoints).map((phrase, index) => ({
    id: `focus-${index}-${normalizeTutorAgendaSpeech(phrase).slice(0, 24)}`,
    phrase,
    label: phrase,
  }));
}

function buildTutorCompletedAgendaData({
  lesson,
  unit,
  targetLang = "es",
  supportLang = "en",
  starterProgress = {},
  xpEarned = 0,
  forceComplete = false,
} = {}) {
  const normalizedSupport = normalizeSupportLanguage(
    supportLang,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  const isStarter = isTutorStarterAgendaLesson(lesson);
  const items = isStarter
    ? TUTOR_STARTER_AGENDA_ITEMS.map((item) => ({
        id: item.id,
        task: getTutorStarterItemSupportTask(item, normalizedSupport),
        phrase: getTutorStarterItemModelPhrase(item, targetLang),
        meaning: getTutorStarterItemSupportMeaning(item, normalizedSupport),
        completed: forceComplete || !!starterProgress?.[item.id],
      }))
    : getTutorLessonFocusAgendaItems(lesson).map((item) => ({
        id: item.id,
        task: getTutorLessonAgendaTitle(lesson, unit, normalizedSupport),
        phrase: item.phrase || item.label,
        meaning: getTutorLessonAgendaSubtitle(lesson, unit, normalizedSupport),
        completed: forceComplete,
      }));

  const fallbackTitle = getTutorLessonAgendaTitle(
    lesson,
    unit,
    normalizedSupport,
  );
  const normalizedItems = items.length
    ? items
    : [
        {
          id: "lesson-focus",
          task: tutorCopy(normalizedSupport, {
            en: "completed the lesson focus",
            es: "completaste el enfoque de la leccion",
            pt: "concluiu o foco da licao",
            it: "hai completato il focus della lezione",
            fr: "tu as termine l'objectif de la lecon",
            de: "du hast den Lektionsfokus abgeschlossen",
            ja: "レッスンの目標を完了しました",
            hi: "आपने पाठ का लक्ष्य पूरा किया",
            ar: "كملت هدف الدرس",
            zh: "完成了课程重点",
          }),
          phrase: fallbackTitle,
          meaning: getTutorLessonAgendaSubtitle(
            lesson,
            unit,
            normalizedSupport,
          ),
          completed: true,
        },
      ];

  const completedCount = normalizedItems.filter(
    (item) => item.completed,
  ).length;
  const level = unit?.cefrLevel || unit?.level || "Pre-A1";

  return {
    title: fallbackTitle,
    subtitle: getTutorLessonAgendaSubtitle(lesson, unit, normalizedSupport),
    unitTitle: getTutorDisplayText(unit?.title, normalizedSupport),
    level,
    levelLabel: TUTOR_LEVEL_INFO[level]?.label || level,
    xpEarned,
    targetLang,
    supportLang: normalizedSupport,
    items: normalizedItems,
    completedCount,
    totalCount: normalizedItems.length,
  };
}

function getTutorLevelIndex(level) {
  const index = TUTOR_CEFR_LEVELS.indexOf(level);
  return index >= 0 ? index : TUTOR_CEFR_LEVELS.indexOf("A1");
}

function isTutorTestUnlockActive() {
  const testNsec =
    typeof window !== "undefined" ? localStorage.getItem("local_nsec") : null;
  return (
    testNsec ===
    "nsec1akcvuhtemz3kw58gvvfg38uucu30zfsahyt6ulqapx44lype6a9q42qevv"
  );
}

function getUnlockedTutorLevel(maxProficiencyLevel) {
  return TUTOR_CEFR_LEVELS.includes(maxProficiencyLevel)
    ? maxProficiencyLevel
    : "Pre-A1";
}

function clampTutorLevelToUnlocked(level, maxProficiencyLevel) {
  if (isTutorTestUnlockActive()) {
    return TUTOR_CEFR_LEVELS.includes(level)
      ? level
      : getUnlockedTutorLevel(maxProficiencyLevel);
  }

  const unlockedLevel = getUnlockedTutorLevel(maxProficiencyLevel);
  const levelToCheck = TUTOR_CEFR_LEVELS.includes(level)
    ? level
    : unlockedLevel;
  return getTutorLevelIndex(levelToCheck) <= getTutorLevelIndex(unlockedLevel)
    ? levelToCheck
    : unlockedLevel;
}

function getTutorStorageLang(targetLang) {
  return String(targetLang || "es").toLowerCase();
}

function getTutorPathLevelStorageKey(targetLang) {
  return `tutorPathLevel:${getTutorStorageLang(targetLang)}`;
}

function getTutorPathLessonStorageKey(targetLang) {
  return `tutorPathLesson:${getTutorStorageLang(targetLang)}`;
}

function getTutorMessagesStorageKey(npub, targetLang, lessonId) {
  if (!lessonId) return "";
  const safeUser = encodeURIComponent(String(npub || "anonymous"));
  const safeLesson = encodeURIComponent(String(lessonId));
  return `tutorMessages:v1:${safeUser}:${getTutorStorageLang(targetLang)}:${safeLesson}`;
}

function readStoredTutorLevel(targetLang) {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.localStorage.getItem(
      getTutorPathLevelStorageKey(targetLang),
    );
    return TUTOR_CEFR_LEVELS.includes(stored) ? stored : "";
  } catch {
    return "";
  }
}

function writeStoredTutorLevel(targetLang, level) {
  if (typeof window === "undefined" || !TUTOR_CEFR_LEVELS.includes(level)) {
    return;
  }
  try {
    window.localStorage.setItem(getTutorPathLevelStorageKey(targetLang), level);
  } catch {}
}

function readStoredTutorLessonId(targetLang) {
  if (typeof window === "undefined") return "";
  try {
    return (
      window.localStorage.getItem(getTutorPathLessonStorageKey(targetLang)) ||
      ""
    );
  } catch {
    return "";
  }
}

function writeStoredTutorLessonId(targetLang, lessonId) {
  if (typeof window === "undefined" || !lessonId) return;
  try {
    window.localStorage.setItem(
      getTutorPathLessonStorageKey(targetLang),
      lessonId,
    );
  } catch {}
}

function findTutorLessonById(units, lessonId) {
  if (!lessonId) return null;
  for (const unit of units || []) {
    const lesson = unit?.lessons?.find(
      (candidate) => candidate.id === lessonId,
    );
    if (lesson) return { lesson, unit };
  }
  return null;
}

function isTutorLessonUnlocked(units, progressLessons, unitIndex, lessonIndex) {
  if (lessonIndex === 0) {
    if (unitIndex === 0) return true;
    const previousUnit = units[unitIndex - 1];
    const previousLesson =
      previousUnit?.lessons?.[previousUnit.lessons.length - 1];
    return (
      progressLessons?.[previousLesson?.id]?.status === SKILL_STATUS.COMPLETED
    );
  }

  const unit = units[unitIndex];
  const previousLesson = unit?.lessons?.[lessonIndex - 1];
  return (
    progressLessons?.[previousLesson?.id]?.status === SKILL_STATUS.COMPLETED
  );
}

function isTutorLessonUnlockedById(units, progressLessons, lessonId) {
  for (let unitIndex = 0; unitIndex < (units || []).length; unitIndex += 1) {
    const unit = units[unitIndex];
    for (
      let lessonIndex = 0;
      lessonIndex < (unit?.lessons?.length || 0);
      lessonIndex += 1
    ) {
      if (unit.lessons[lessonIndex]?.id !== lessonId) continue;
      return isTutorLessonUnlocked(
        units,
        progressLessons,
        unitIndex,
        lessonIndex,
      );
    }
  }
  return false;
}

function findLatestTutorUnlockedLesson(units, progressLessons) {
  for (let unitIndex = 0; unitIndex < (units || []).length; unitIndex += 1) {
    const unit = units[unitIndex];
    for (
      let lessonIndex = 0;
      lessonIndex < (unit?.lessons?.length || 0);
      lessonIndex += 1
    ) {
      const lesson = unit.lessons[lessonIndex];
      const progress = progressLessons?.[lesson.id];
      if (progress?.status === SKILL_STATUS.IN_PROGRESS) {
        return { lesson, unit, status: SKILL_STATUS.IN_PROGRESS };
      }
      if (
        progress?.status !== SKILL_STATUS.COMPLETED &&
        isTutorLessonUnlocked(units, progressLessons, unitIndex, lessonIndex)
      ) {
        return { lesson, unit, status: SKILL_STATUS.AVAILABLE };
      }
    }
  }
  return null;
}

function findNextTutorLessonAfter(units, lessonId, progressLessons = {}) {
  let foundCurrent = false;
  for (const unit of units || []) {
    for (const lesson of unit?.lessons || []) {
      if (foundCurrent) {
        const progress = progressLessons?.[lesson.id];
        if (progress?.status !== SKILL_STATUS.COMPLETED) {
          return {
            lesson,
            unit,
            status:
              progress?.status === SKILL_STATUS.IN_PROGRESS
                ? SKILL_STATUS.IN_PROGRESS
                : SKILL_STATUS.AVAILABLE,
          };
        }
      }

      if (lesson.id === lessonId) {
        foundCurrent = true;
      }
    }
  }
  return null;
}

function getTutorMessageVisibleText(message) {
  return sanitizeTutorAssistantText(
    `${message?.textFinal || ""}${message?.textStream || ""}`,
  );
}

function hasVisibleTutorMessages(messages = []) {
  return Array.isArray(messages) && messages.some(getTutorMessageVisibleText);
}

function buildRecentTutorConversationContext(messages = [], limit = 4) {
  const visibleMessages = Array.isArray(messages)
    ? messages.filter(getTutorMessageVisibleText)
    : [];
  return visibleMessages
    .slice(-limit)
    .map((message) => {
      const speaker = message.role === "user" ? "Learner" : "Tutor";
      return `${speaker}: "${getTutorMessageVisibleText(message)}"`;
    })
    .join("\n");
}

function sanitizeTutorMessageForStorage(message) {
  const textFinal = sanitizeTutorAssistantText(
    `${message?.textFinal || ""} ${message?.textStream || ""}`,
  );
  if (!textFinal) return null;

  return {
    id: String(message?.id || `stored-${Date.now()}`),
    role: message?.role === "user" ? "user" : "assistant",
    lang: String(message?.lang || ""),
    textFinal,
    textStream: "",
    translation: String(message?.translation || ""),
    translationLang: String(message?.translationLang || ""),
    pairs: Array.isArray(message?.pairs)
      ? message.pairs
          .slice(0, 12)
          .map((pair) => ({
            lhs: String(pair?.lhs || ""),
            rhs: String(pair?.rhs || ""),
          }))
          .filter((pair) => pair.lhs && pair.rhs)
      : [],
    done: true,
    hasAudio: false,
    // Preserve the tutorial welcome marker so a resumed session can tell the
    // assistant-only greeting apart from a real tutor turn.
    ...(message?.welcome ? { welcome: true } : {}),
    ts: Number.isFinite(Number(message?.ts)) ? Number(message.ts) : Date.now(),
  };
}

function normalizeStoredTutorMessages(messages = []) {
  if (!Array.isArray(messages)) return [];
  return messages
    .map(sanitizeTutorMessageForStorage)
    .filter(Boolean)
    .slice(-20);
}

function readStoredTutorMessages(storageKey) {
  if (typeof window === "undefined" || !storageKey) return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeStoredTutorMessages(parsed?.messages || parsed);
  } catch {
    return [];
  }
}

function writeStoredTutorMessages(storageKey, messages) {
  if (typeof window === "undefined" || !storageKey) return;
  try {
    const normalizedMessages = normalizeStoredTutorMessages(messages);
    if (!normalizedMessages.length) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        messages: normalizedMessages,
      }),
    );
  } catch {}
}

const isoNow = () => {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
};

function rectToSnapshot(rect) {
  if (!rect) return null;
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function parsePx(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildCanvasFont(styles) {
  if (!styles) {
    return '400 16px "Helvetica Neue", Helvetica, Arial, sans-serif';
  }
  const fontStyle = styles.fontStyle || "normal";
  const fontVariant = styles.fontVariant || "normal";
  const fontWeight = styles.fontWeight || "400";
  const fontStretch = styles.fontStretch || "normal";
  const fontSize = styles.fontSize || "16px";
  const rawFamily =
    styles.fontFamily || '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const fontFamily = /system-ui/i.test(rawFamily)
    ? '"Helvetica Neue", Helvetica, Arial, sans-serif'
    : rawFamily;
  return [
    fontStyle,
    fontVariant,
    fontWeight,
    fontStretch,
    fontSize,
    fontFamily,
  ].join(" ");
}

function getArchiveLines(text, font, maxWidth, lineHeight) {
  const normalizedText = String(text || "");
  const safeWidth = Math.max(72, Math.ceil(maxWidth || 0));
  const safeLineHeight = Math.max(18, Math.round(lineHeight || 0));
  if (!normalizedText.trim()) return [];

  const cacheKey = `${font}__${safeWidth}__${safeLineHeight}__${normalizedText}`;
  const cached = archiveLayoutCache.get(cacheKey);
  if (cached) return cached;

  try {
    const prepared = prepareWithSegments(normalizedText, font, {
      whiteSpace: "pre-wrap",
    });
    const { lines } = layoutWithLines(prepared, safeWidth, safeLineHeight);
    const normalizedLines = lines
      .map((line) => ({
        text: line.text.replace(/\s+$/g, "") || line.text,
        width: Math.max(1, line.width),
      }))
      .filter((line) => line.text.length > 0);
    archiveLayoutCache.set(cacheKey, normalizedLines);
    return normalizedLines;
  } catch {
    const fallback = normalizedText
      .split("\n")
      .map((line) => ({ text: line, width: safeWidth }))
      .filter((line) => line.text.trim().length > 0);
    archiveLayoutCache.set(cacheKey, fallback);
    return fallback;
  }
}

function getArchiveMeasureContext() {
  if (typeof document === "undefined") return null;
  if (archiveMeasureContext) return archiveMeasureContext;
  const canvas = document.createElement("canvas");
  archiveMeasureContext = canvas.getContext("2d");
  return archiveMeasureContext;
}

function getArchiveGlyphs(text, font, maxWidth, lineHeight) {
  const cacheKey = `glyphs__${font}__${Math.ceil(maxWidth || 0)}__${Math.round(
    lineHeight || 0,
  )}__${String(text || "")}`;
  const cached = archiveLayoutCache.get(cacheKey);
  if (cached) return cached;

  const lines = getArchiveLines(text, font, maxWidth, lineHeight);
  const ctx = getArchiveMeasureContext();
  if (ctx) ctx.font = font;

  let glyphIndex = 0;
  const glyphs = lines.flatMap((line, lineIndex) => {
    const parts = line.text.split(/(\s+)/).filter(Boolean);
    let cursor = "";

    return parts.flatMap((part) => {
      const startX = ctx ? ctx.measureText(cursor).width : cursor.length * 8;
      cursor += part;
      const endX = ctx ? ctx.measureText(cursor).width : cursor.length * 8;
      if (!part.trim()) return [];

      const currentGlyph = {
        id: `${lineIndex}-${glyphIndex}`,
        glyph: part,
        index: glyphIndex,
        lineIndex,
        x: startX,
        y: lineIndex * lineHeight,
        width: Math.max(1, endX - startX),
      };
      glyphIndex += 1;
      return [currentGlyph];
    });
  });

  const result = {
    glyphs,
    height: Math.max(lines.length * lineHeight, lineHeight),
  };
  archiveLayoutCache.set(cacheKey, result);
  return result;
}

function archiveNoise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

function strongNpub(user) {
  return (
    user?.id ||
    user?.local_npub ||
    localStorage.getItem("local_npub") ||
    ""
  ).trim();
}

function getTutorTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function dispatchTutorDailyGoalXpUpdate(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("daily-goal:localXpAwarded", { detail }),
  );
}

function getTutorStoreUserDocId(user = {}) {
  return (
    user?.id ||
    user?.local_npub ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("local_npub")
      : "") ||
    ""
  ).trim();
}

function applyTutorDailyGoalXpOptimistic(npub, amount) {
  try {
    const store = useUserStore.getState?.();
    const currentUser = store?.user || {};
    const currentDocId = getTutorStoreUserDocId(currentUser);
    if (npub && currentDocId && npub !== currentDocId) return null;

    const todayKey = getTutorTodayKey();
    const currentDailyXp = Math.max(
      Number(currentUser.dailyXp) || 0,
      Number(currentUser.dailyXpHistory?.[todayKey]) || 0,
    );
    const nextDailyXp = currentDailyXp + amount;
    const dailyGoalXp = Number(
      currentUser.dailyGoalXp ??
        currentUser.progress?.dailyGoalXp ??
        currentUser.stats?.dailyGoalXp,
    );
    const patch = {
      dailyXp: nextDailyXp,
      dailyXpHistory: {
        ...(currentUser.dailyXpHistory || {}),
        [todayKey]: nextDailyXp,
      },
    };
    const detail = {
      npub,
      amount,
      dailyXp: nextDailyXp,
      todayKey,
    };

    if (Number.isFinite(dailyGoalXp)) {
      patch.dailyGoalXp = dailyGoalXp;
      detail.dailyGoalXp = dailyGoalXp;
    }

    const reachedDailyGoal =
      Number.isFinite(dailyGoalXp) &&
      dailyGoalXp > 0 &&
      currentDailyXp < dailyGoalXp &&
      nextDailyXp >= dailyGoalXp;

    store?.patchUser?.(patch);

    dispatchTutorDailyGoalXpUpdate(detail);
    return {
      ...detail,
      previousDailyXp: currentDailyXp,
      reachedDailyGoal,
    };
  } catch (error) {
    console.warn("Failed to apply Tutor daily XP locally:", error);
    return null;
  }
}

async function syncTutorDailyGoalXpFromFirestore(npub) {
  if (!npub) return;
  try {
    const snap = await getDoc(doc(database, "users", npub));
    if (!snap.exists()) return;

    const data = snap.data() || {};
    const todayKey = getTutorTodayKey();
    const dailyXp = Number(data.dailyXp);
    const dailyGoalXp = Number(data.dailyGoalXp);
    const currentUser = useUserStore.getState?.()?.user || {};
    const currentTodayXp = Number(currentUser.dailyXpHistory?.[todayKey]);
    const syncedDailyXp =
      todayKey && Number.isFinite(currentTodayXp)
        ? Math.max(currentTodayXp, dailyXp)
        : dailyXp;
    const patch = {};

    if (Number.isFinite(syncedDailyXp)) patch.dailyXp = syncedDailyXp;
    if (Number.isFinite(dailyGoalXp)) patch.dailyGoalXp = dailyGoalXp;
    if (data.dailyXpHistory && typeof data.dailyXpHistory === "object") {
      patch.dailyXpHistory = {
        ...data.dailyXpHistory,
        ...(Number.isFinite(syncedDailyXp)
          ? { [todayKey]: syncedDailyXp }
          : {}),
      };
    }
    if (typeof data.dailyGoalPetHealth === "number") {
      patch.dailyGoalPetHealth = data.dailyGoalPetHealth;
    }

    if (Object.keys(patch).length) {
      useUserStore.getState?.()?.patchUser?.(patch);
    }

    dispatchTutorDailyGoalXpUpdate({
      npub,
      amount: 0,
      dailyXp: syncedDailyXp,
      dailyGoalXp,
      todayKey,
    });
  } catch (error) {
    console.warn("Failed to sync Tutor daily XP from Firestore:", error);
  }
}

async function ensureUserDoc(npub, defaults = {}) {
  if (!npub) return false;
  try {
    const ref = doc(database, "users", npub);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(
        ref,
        {
          local_npub: npub,
          createdAt: isoNow(),
          onboarding: { completed: true },
          xp: 0,
          streak: 0,
          helpRequest: "",
          progress: {
            level: "beginner",
            supportLang: "en",
            voice: DEFAULT_TTS_VOICE,
            tutorVoice: normalizeGeminiLiveVoice(),
            tutorVoicePersona:
              translations.en.onboarding_persona_default_example,
            targetLang: "es",
            showTranslations: true,
            helpRequest: "",
            practicePronunciation: false,
          },
          ...defaults,
        },
        { merge: true },
      );
    }
    return true;
  } catch {
    return false;
  }
}

function safeParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) {
    try {
      return JSON.parse(text.slice(s, e + 1));
    } catch {}
  }
  return null;
}

/* ---------------------------
   Phrase-highlighting helpers
--------------------------- */
const COLORS = [
  "#91E0FF",
  "#A0EBAF",
  "#FFD48A",
  "#C6B7FF",
  "#FF9FB1",
  "#B0F0FF",
];
const colorFor = (i) => COLORS[i % COLORS.length];

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  if (clean.length !== 6) {
    return `rgba(255,255,255,${alpha})`;
  }
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex) {
  if (!hex) return null;
  let clean = String(hex).replace("#", "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  if (clean.length !== 6) return null;

  const int = Number.parseInt(clean, 16);
  if (Number.isNaN(int)) return null;

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (channel) =>
    Math.max(0, Math.min(255, Math.round(channel)))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHexColors(baseHex, mixHex, amount = 0.5) {
  const base = hexToRgb(baseHex);
  const mix = hexToRgb(mixHex);
  if (!base || !mix) return baseHex;

  const weight = Math.max(0, Math.min(1, amount));

  return rgbToHex({
    r: base.r + (mix.r - base.r) * weight,
    g: base.g + (mix.g - base.g) * weight,
    b: base.b + (mix.b - base.b) * weight,
  });
}

function splitByDelimiters(text) {
  if (!text) return [];
  const raw = String(text)
    .split(/[,;·•]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return raw.length ? raw : [String(text).trim()];
}

function normalizePairText(text) {
  return String(text || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function textIncludesPair(haystack, needle) {
  const normalizedHaystack = normalizePairText(haystack);
  const normalizedNeedle = normalizePairText(needle);
  return !!normalizedNeedle && normalizedHaystack.includes(normalizedNeedle);
}

function filterPairsForPrimaryText(pairs, primaryText) {
  if (!Array.isArray(pairs)) return [];
  return pairs.filter((pair) => textIncludesPair(primaryText, pair?.lhs));
}

function tidyPairs(rawPairs, sourceText = "") {
  if (!Array.isArray(rawPairs)) return [];
  const results = [];

  const addPair = (lhsValue, rhsValue) => {
    const lhs = String(lhsValue || "").trim();
    const rhs = String(rhsValue || "").trim();
    if (!lhs || !rhs) return;
    if (sourceText && !textIncludesPair(sourceText, lhs)) return;
    results.push({ lhs, rhs });
  };

  rawPairs.forEach((pair) => {
    const lhs = String(pair?.lhs || "").trim();
    const rhs = String(pair?.rhs || "").trim();
    if (!lhs || !rhs) return;

    if (lhs.length > 80 || rhs.length > 80) {
      const lhsParts = splitByDelimiters(lhs);
      const rhsParts = splitByDelimiters(rhs);
      if (lhsParts.length === rhsParts.length && lhsParts.length > 1) {
        lhsParts.forEach((segment, idx) => {
          const translated = rhsParts[idx] || "";
          addPair(segment, translated);
        });
        return;
      }
    }

    addPair(lhs, rhs);
  });

  return results.slice(0, 8);
}

function wrapFirst(text, phrase, tokenId) {
  if (!text || !phrase) return [text];
  const idx = text.toLowerCase().indexOf(String(phrase).toLowerCase());
  if (idx < 0) return [text];
  const before = text.slice(0, idx);
  const mid = text.slice(idx, idx + phrase.length);
  const after = text.slice(idx + phrase.length);
  return [
    before,
    <span
      key={`${tokenId}-${idx}`}
      data-token={tokenId}
      style={{
        display: "inline",
        boxShadow: "inset 0 -2px transparent",
        unicodeBidi: "isolate",
      }}
    >
      {mid}
    </span>,
    ...wrapFirst(after, phrase, tokenId + "_cont"),
  ];
}
function buildAlignedNodes(text, pairs, side /* 'lhs' | 'rhs' */) {
  if (!pairs?.length || !text) return [text];
  const sorted = [...pairs].sort(
    (a, b) => (b?.[side]?.length || 0) - (a?.[side]?.length || 0),
  );
  let nodes = [text];
  sorted.forEach((pair, i) => {
    const phrase = pair?.[side];
    if (!phrase) return;
    const tokenId = `tok_${i}`;
    const next = [];
    nodes.forEach((node) => {
      if (typeof node === "string")
        next.push(...wrapFirst(node, phrase, tokenId));
      else next.push(node);
    });
    nodes = next;
  });
  return nodes;
}

function AlignedBubble({
  primaryText,
  primaryLang = "en",
  secondaryText,
  secondaryLang = "en",
  pairs,
  showSecondary,
  isTranslating,
  canReplay,
  onTranslate,
  canTranslate,
  onReplay,
  isReplaying,
  replayLabel,
  containerRef,
  primaryTextRef,
  contentOpacity = 1,
  contentTransform = "translateY(0px) scale(1)",
  feedbackText = "",
  feedbackLang = "en",
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const [activeId, setActiveId] = useState(null);
  function decorate(nodes) {
    return React.Children.map(nodes, (node) => {
      if (typeof node === "string" || !node?.props?.["data-token"]) return node;
      const rootId = node.props["data-token"].split("_")[0];
      const i = parseInt(rootId.replace("tok_", "")) || 0;
      const isActive = activeId === rootId;
      const style = {
        boxShadow: isActive
          ? `inset 0 -2px ${colorFor(i)}`
          : "inset 0 -2px transparent",
      };
      return React.cloneElement(node, {
        onMouseEnter: () => setActiveId(rootId),
        onMouseLeave: () => setActiveId(null),
        onClick: () => setActiveId(isActive ? null : rootId),
        style: { ...(node.props.style || {}), ...style },
      });
    });
  }
  const visiblePairs = filterPairsForPrimaryText(pairs, primaryText);
  const primaryNodes = decorate(
    buildAlignedNodes(primaryText, visiblePairs, "lhs"),
  );
  const secondaryNodes = decorate(
    buildAlignedNodes(secondaryText, visiblePairs, "rhs"),
  );
  const primaryTextProps = getBidiTextProps(primaryLang);
  const secondaryTextProps = getBidiTextProps(secondaryLang);

  return (
    <Box
      ref={containerRef}
      bg={isLightTheme ? "rgba(241, 228, 211, 0.98)" : "transparent"}
      p={3}
      rounded="2xl"
      border="1px solid"
      borderColor={
        isLightTheme ? "rgba(142, 113, 79, 0.26)" : "rgba(255,255,255,0.06)"
      }
      boxShadow={
        isLightTheme
          ? "0 18px 38px rgba(120, 94, 61, 0.13), 0 1px 0 rgba(255,255,255,0.72) inset"
          : "0 14px 28px rgba(0,0,0,0.35)"
      }
      maxW="100%"
      borderBottomLeftRadius="0px"
      sx={isLightTheme ? TUTOR_MESSAGE_PANEL_SX : MATRIX_PANEL_SX}
      color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.950"}
    >
      <Box
        opacity={contentOpacity}
        transform={contentTransform}
        transition="opacity 180ms ease, transform 180ms ease"
        willChange="opacity, transform"
        pointerEvents={contentOpacity < 0.5 ? "none" : "auto"}
      >
        <HStack align="flex-start" spacing={2}>
          {canReplay && (
            <IconButton
              size="xs"
              variant="ghost"
              colorScheme="cyan"
              icon={
                isReplaying ? (
                  <Spinner size="xs" />
                ) : (
                  <RiVolumeUpLine size={14} />
                )
              }
              onClick={onReplay}
              isDisabled={isReplaying}
              aria-label={replayLabel || "Replay"}
              mt="2px"
            />
          )}
          <Box
            ref={primaryTextRef}
            as="p"
            fontSize="md"
            lineHeight="1.6"
            color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.950"}
            flex="1"
            {...primaryTextProps}
            sx={mergeBidiSx(primaryTextProps, MOBILE_TEXT_SX)}
          >
            {primaryNodes}
          </Box>
        </HStack>

        {showSecondary && !!secondaryText && (
          <Box
            as="p"
            fontSize="xs"
            mt={1}
            lineHeight="1.55"
            color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
            transition="opacity 120ms ease-out"
            opacity={1}
            {...secondaryTextProps}
            sx={mergeBidiSx(secondaryTextProps, MOBILE_TEXT_SX)}
          >
            {secondaryNodes}
          </Box>
        )}

        {!!feedbackText && (
          <TutorInlineFeedbackNote
            text={feedbackText}
            supportLang={feedbackLang}
            insideMessage
          />
        )}

        {!!visiblePairs?.length && showSecondary && (
          <Wrap
            spacing={3}
            mt={3}
            shouldWrapChildren
            dir={primaryTextProps.dir}
            sx={{ unicodeBidi: "isolate" }}
          >
            {visiblePairs.slice(0, 8).map((p, i) => {
              const color = colorFor(i);
              return (
                <WrapItem key={`${p.lhs}-${p.rhs}-${i}`} maxW="100%">
                  <Box
                    px={3}
                    py={2.5}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={
                      isLightTheme
                        ? hexToRgba(color, 0.34)
                        : hexToRgba(color, 0.6)
                    }
                    background={isLightTheme ? APP_SURFACE : "#0b1220"}
                    boxShadow={
                      isLightTheme
                        ? "0 6px 16px rgba(120,94,61,0.06)"
                        : `0 6px 18px ${hexToRgba(color, 0.12)}`
                    }
                    color={isLightTheme ? APP_TEXT_PRIMARY : "whiteAlpha.900"}
                    minW="0"
                    maxW="260px"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      lineHeight="1.4"
                      {...primaryTextProps}
                      sx={mergeBidiSx(primaryTextProps)}
                    >
                      {p.lhs}
                    </Text>
                    <Text
                      fontSize="2xs"
                      color={
                        isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"
                      }
                      mt={1}
                      lineHeight="1.35"
                      {...secondaryTextProps}
                      sx={mergeBidiSx(secondaryTextProps)}
                    >
                      {p.rhs}
                    </Text>
                  </Box>
                </WrapItem>
              );
            })}
          </Wrap>
        )}

        {canTranslate && (
          <HStack justify="flex-end" mt={2}>
            <IconButton
              size="xs"
              variant="ghost"
              colorScheme="cyan"
              icon={
                isTranslating ? <Spinner size="xs" /> : <MdOutlineTranslate />
              }
              onClick={onTranslate}
              isDisabled={isTranslating}
              aria-label="Translate message"
            />
          </HStack>
        )}
      </Box>
    </Box>
  );
}

function TutorInlineFeedbackNote({
  text,
  supportLang = "en",
  insideMessage = false,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const lang = normalizeSupportLanguage(supportLang, DEFAULT_SUPPORT_LANGUAGE);
  const textProps = getBidiTextProps(lang);

  if (!text) return null;

  if (insideMessage) {
    return (
      <HStack w="100%" align="center" spacing={3} mt={3}>
        <Box
          flex="1"
          minW={0}
          border="1px solid"
          borderColor={
            isLightTheme
              ? "rgba(201, 116, 93, 0.30)"
              : "rgba(251, 146, 60, 0.34)"
          }
          bg={
            isLightTheme
              ? "linear-gradient(180deg, rgba(255, 247, 242, 0.96), rgba(253, 238, 232, 0.94))"
              : "linear-gradient(180deg, rgba(70, 30, 34, 0.70), rgba(50, 26, 20, 0.76))"
          }
          color={isLightTheme ? APP_TEXT_PRIMARY : "orange.50"}
          borderRadius="14px"
          px={3}
          py={2.5}
          boxShadow={
            isLightTheme
              ? "0 10px 22px rgba(201, 116, 93, 0.10)"
              : "0 14px 28px rgba(0, 0, 0, 0.24)"
          }
        >
          <Text
            fontSize="2xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="0"
            color={isLightTheme ? "#a45f4d" : "orange.200"}
            mb={1}
          >
            {tutorCopy(lang, {
              en: "Tiny next step",
              es: "Siguiente pasito",
              pt: "Proximo passinho",
              it: "Piccolo passo",
              fr: "Petit pas suivant",
              de: "Kleiner naechster Schritt",
              ja: "次の小さな一歩",
              hi: "अगला छोटा कदम",
              ar: "خطوة صغيرة",
              zh: "下一小步",
            })}
          </Text>
          <Text
            fontSize="sm"
            lineHeight="1.55"
            color={isLightTheme ? APP_TEXT_PRIMARY : "orange.50"}
            {...textProps}
            sx={mergeBidiSx(textProps, MOBILE_TEXT_SX)}
          >
            {text}
          </Text>
        </Box>
        <Box flexShrink={0} pointerEvents="none" mr="-4px">
          <RandomCharacter key={`tutor-feedback-${text}`} width="62px" />
        </Box>
      </HStack>
    );
  }

  return (
    <HStack w="100%" align="center" spacing={3} pt={1}>
      <Box
        flex="1"
        minW={0}
        border="1px solid"
        borderColor={
          isLightTheme ? "rgba(201, 116, 93, 0.30)" : "rgba(251, 146, 60, 0.34)"
        }
        bg={
          isLightTheme
            ? "linear-gradient(180deg, rgba(255, 247, 242, 0.96), rgba(253, 238, 232, 0.94))"
            : "linear-gradient(180deg, rgba(70, 30, 34, 0.70), rgba(50, 26, 20, 0.76))"
        }
        color={isLightTheme ? APP_TEXT_PRIMARY : "orange.50"}
        borderRadius="16px"
        px={4}
        py={3}
        boxShadow={
          isLightTheme
            ? "0 10px 22px rgba(201, 116, 93, 0.10)"
            : "0 14px 28px rgba(0, 0, 0, 0.28)"
        }
      >
        <Text
          fontSize="2xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="0"
          color={isLightTheme ? "#a45f4d" : "orange.200"}
          mb={1}
        >
          {tutorCopy(lang, {
            en: "Tiny next step",
            es: "Siguiente pasito",
            pt: "Proximo passinho",
            it: "Piccolo passo",
            fr: "Petit pas suivant",
            de: "Kleiner naechster Schritt",
            ja: "次の小さな一歩",
            hi: "अगला छोटा कदम",
            ar: "خطوة صغيرة",
            zh: "下一小步",
          })}
        </Text>
        <Text
          fontSize="sm"
          lineHeight="1.55"
          color={isLightTheme ? APP_TEXT_PRIMARY : "orange.50"}
          {...textProps}
          sx={mergeBidiSx(textProps, MOBILE_TEXT_SX)}
        >
          {text}
        </Text>
      </Box>
      <Box flexShrink={0} pointerEvents="none" mr="-4px">
        <RandomCharacter key={`tutor-feedback-${text}`} width="62px" />
      </Box>
    </HStack>
  );
}

/* ---------------------------
   Chat bubble wrappers
--------------------------- */
function RowLeft({ children }) {
  return (
    <HStack w="100%" justify="flex-start" align="flex-start">
      <Box maxW={["95%", "90%"]}>{children}</Box>
    </HStack>
  );
}
function RowRight({ children }) {
  return (
    <HStack w="100%" justify="flex-end" align="flex-start">
      <Box maxW={["95%", "90%"]}>{children}</Box>
    </HStack>
  );
}
function UserBubble({ label, text, textLang = "en" }) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const textProps = getBidiTextProps(textLang);
  return (
    <Box
      bg={isLightTheme ? "rgba(108, 182, 191, 0.16)" : "blue.500"}
      color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
      p={3}
      rounded="lg"
      boxShadow={isLightTheme ? APP_SHADOW : "0 6px 20px rgba(0,0,0,0.25)"}
      border="1px solid"
      borderColor={
        isLightTheme ? "rgba(108, 182, 191, 0.22)" : "rgba(255,255,255,0.08)"
      }
    >
      <Box
        as="p"
        fontSize="md"
        lineHeight="1.6"
        color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
        {...textProps}
        sx={mergeBidiSx(textProps, MOBILE_TEXT_SX)}
      >
        {text}
      </Box>
    </Box>
  );
}

function ArchiveTextAnimation({ animation }) {
  if (!animation) return null;

  const { id, fromRect, targetRect, glyphs, font, lineHeight, color, height } =
    animation;
  const glyphCount = glyphs.length;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const textCenterX = fromRect.left + fromRect.width / 2;
  const textCenterY = fromRect.top + height / 2;
  const flowDx = targetCenterX - textCenterX;
  const flowDy = targetCenterY - textCenterY;
  const flowDistance = Math.hypot(flowDx, flowDy) || 1;
  const flowUnitX = flowDx / flowDistance;
  const flowUnitY = flowDy / flowDistance;
  const flowPerpX = -flowUnitY;
  const flowPerpY = flowUnitX;
  const maxDistance =
    glyphs.reduce((largest, glyph) => {
      const glyphCenterX = fromRect.left + glyph.x + glyph.width / 2;
      const glyphCenterY = fromRect.top + glyph.y + lineHeight / 2;
      const distance = Math.hypot(
        targetCenterX - glyphCenterX,
        targetCenterY - glyphCenterY,
      );
      return Math.max(largest, distance);
    }, 0) || 1;

  return (
    <Box
      position="fixed"
      inset={0}
      pointerEvents="none"
      zIndex={40}
      sx={{
        "@keyframes conversationArchiveGlyph": {
          "0%": {
            opacity: 1,
            offsetDistance: "0%",
            transform: "scale(1)",
            filter: "blur(0px)",
          },
          "100%": {
            opacity: 0,
            offsetDistance: "100%",
            transform: "scale(0.12, 0.22)",
            filter: "blur(6px)",
          },
        },
        "@keyframes conversationArchiveGlow": {
          "0%": {
            opacity: 0.35,
            transform: "scale(0.98)",
          },
          "100%": {
            opacity: 0,
            transform: "scale(0.52)",
          },
        },
      }}
    >
      <Box
        position="absolute"
        left={`${fromRect.left}px`}
        top={`${fromRect.top}px`}
        width={`${Math.max(fromRect.width, 1)}px`}
        height={`${Math.max(height, 1)}px`}
      >
        <Box
          position="absolute"
          inset={0}
          borderRadius="20px"
          bg="linear-gradient(135deg, rgba(103,232,249,0.22), rgba(56,189,248,0.06))"
          filter="blur(16px)"
          transformOrigin="center"
          animation={`conversationArchiveGlow ${
            ARCHIVE_GLYPH_DURATION_MS + 120
          }ms ease-out forwards`}
        />
        {glyphs.map((glyph) => {
          const glyphCenterX = fromRect.left + glyph.x + glyph.width / 2;
          const glyphCenterY = fromRect.top + glyph.y + lineHeight / 2;
          const endX = targetCenterX - glyphCenterX;
          const endY = targetCenterY - glyphCenterY;
          const distance = Math.hypot(endX, endY);
          const normalizedDistance = distance / maxDistance;
          const streamOrder =
            glyphCount > 1 ? glyph.index / (glyphCount - 1) : 0;
          const noiseA = archiveNoise(glyph.index + glyph.lineIndex * 31 + 1);
          const noiseB = archiveNoise(glyph.index * 1.37 + 17);
          const ribbonWidth = Math.min(fromRect.width * 0.16, 34);
          const ribbonOffset =
            (streamOrder - 0.5) * ribbonWidth + (noiseA - 0.5) * 8;
          const mergeWorldX =
            textCenterX + flowDx * 0.18 + flowPerpX * ribbonOffset * 0.55;
          const mergeWorldY =
            textCenterY +
            flowDy * 0.18 +
            flowPerpY * ribbonOffset * 0.22 -
            8 +
            (noiseB - 0.5) * 4;
          const pullWorldX =
            textCenterX + flowDx * 0.66 + flowPerpX * ribbonOffset * 0.18;
          const pullWorldY =
            textCenterY + flowDy * 0.66 + flowPerpY * ribbonOffset * 0.1 - 2;
          const cp1X = mergeWorldX - glyphCenterX;
          const cp1Y = mergeWorldY - glyphCenterY;
          const cp2X = pullWorldX - glyphCenterX;
          const cp2Y = pullWorldY - glyphCenterY;
          const duration = Math.round(
            ARCHIVE_GLYPH_DURATION_MS +
              normalizedDistance * ARCHIVE_GLYPH_DURATION_VARIANCE_MS,
          );
          const streamDelay = Math.max(
            0,
            Math.round(
              streamOrder * ARCHIVE_GLYPH_STREAM_SPREAD_MS +
                (noiseA - 0.5) * ARCHIVE_GLYPH_STREAM_JITTER_MS,
            ),
          );
          const motionPath = `path("M 0 0 C ${cp1X.toFixed(2)} ${cp1Y.toFixed(
            2,
          )}, ${cp2X.toFixed(2)} ${cp2Y.toFixed(2)}, ${endX.toFixed(
            2,
          )} ${endY.toFixed(2)}")`;

          return (
            <Box
              key={`${id}-${glyph.id}-${glyph.glyph}`}
              as="span"
              position="absolute"
              left={`${glyph.x}px`}
              top={`${glyph.y}px`}
              display="block"
              whiteSpace="pre"
              transformOrigin="center"
              letterSpacing="0"
              color={color}
              textShadow="0 0 18px rgba(34,211,238,0.32)"
              style={{
                font,
                lineHeight: `${lineHeight}px`,
                offsetPath: motionPath,
                WebkitOffsetPath: motionPath,
                offsetRotate: "0deg",
                WebkitOffsetRotate: "0deg",
                offsetDistance: "0%",
                WebkitOffsetDistance: "0%",
              }}
              sx={{
                animation: `conversationArchiveGlyph ${duration}ms cubic-bezier(0.12, 0.86, 0.24, 1) ${streamDelay}ms both`,
                willChange: "offset-distance, transform, opacity, filter",
              }}
            >
              {glyph.glyph}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function uiStateLabel(uiState, uiLang) {
  const lang = normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE);
  const ui = translations[lang] || translations.en;
  if (uiState === "speaking")
    return ui?.proficiency_speaking || translations.en.proficiency_speaking;
  if (uiState === "listening")
    return ui?.proficiency_listening || translations.en.proficiency_listening;
  if (uiState === "thinking")
    return ui?.proficiency_thinking || translations.en.proficiency_thinking;
  return "";
}

function TutorViewportEdgeGlow({
  enabled = true,
  state = "idle",
  isLightTheme = false,
}) {
  if (!enabled) return null;

  const isSpeaking = state === "speaking";
  const isThinking = state === "thinking";
  const isActive = isSpeaking || isThinking;
  const opacity = isActive ? 1 : 0;
  const animationDuration = isSpeaking || isThinking ? "2.35s" : "3.4s";
  const restingShadow = isLightTheme
    ? "inset 0 0 7px rgba(14, 165, 233, 0.34), inset 0 0 15px rgba(45, 212, 191, 0.22), inset 0 0 26px rgba(134, 239, 172, 0.12)"
    : "inset 0 0 8px rgba(34, 211, 238, 0.4), inset 0 0 18px rgba(45, 212, 191, 0.26), inset 0 0 30px rgba(134, 239, 172, 0.14)";
  const activeShadow = isLightTheme
    ? "inset 0 0 11px rgba(14, 165, 233, 0.5), inset 0 0 24px rgba(45, 212, 191, 0.34), inset 0 0 42px rgba(134, 239, 172, 0.18)"
    : "inset 0 0 12px rgba(34, 211, 238, 0.56), inset 0 0 27px rgba(45, 212, 191, 0.38), inset 0 0 46px rgba(134, 239, 172, 0.2)";

  return (
    <Portal>
      <Box
        aria-hidden="true"
        pointerEvents="none"
        position="fixed"
        inset={0}
        zIndex={1399}
        opacity={opacity}
        transition="opacity 460ms ease"
        sx={{
          "--edge-breathe": animationDuration,
          "@keyframes tutorEdgeBreathe": {
            "0%, 100%": {
              filter: "saturate(1.24) brightness(1.08)",
              boxShadow: restingShadow,
            },
            "50%": {
              filter: "saturate(1.68) brightness(1.36)",
              boxShadow: activeShadow,
            },
          },
          "@media (prefers-reduced-motion: reduce)": {
            "&, &::before, &::after": {
              animation: "none",
            },
          },
          animation:
            "tutorEdgeBreathe var(--edge-breathe) ease-in-out infinite",
          boxShadow: restingShadow,
        }}
      />
    </Portal>
  );
}

/* ---------------------------
   IndexedDB audio cache (per message)
--------------------------- */
const IDB_DB = "RBE-AudioCache";
const IDB_STORE = "clips";

function openIDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window))
      return reject(new Error("IndexedDB not supported"));
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB open failed"));
  });
}
async function idbPutClip(id, blob, meta = {}) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IDB put failed"));
    tx.objectStore(IDB_STORE).put({
      id,
      blob,
      createdAt: Date.now(),
      bytes: blob?.size || 0,
      ...meta,
    });
  });
}
async function idbGetClip(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    tx.onerror = () => reject(tx.error || new Error("IDB get failed"));
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error("IDB get failed"));
  });
}

function TutorPathLevelHeader({
  activeLevel,
  currentLevel,
  levelProgress,
  levelCompletionStatus,
  supportLang,
  onLevelChange,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const lang = normalizeSupportLanguage(supportLang, DEFAULT_SUPPORT_LANGUAGE);
  const activeIndex = getTutorLevelIndex(activeLevel);
  const currentIndex = getTutorLevelIndex(currentLevel);
  const previousLevel = TUTOR_CEFR_LEVELS[activeIndex - 1];
  const nextLevel = TUTOR_CEFR_LEVELS[activeIndex + 1];
  const levelInfo = TUTOR_LEVEL_INFO[activeLevel] || TUTOR_LEVEL_INFO.A1;
  const isTestUnlocked = isTutorTestUnlockActive();
  const nextIndex = nextLevel ? getTutorLevelIndex(nextLevel) : -1;
  const isNextUnlocked =
    isTestUnlocked ||
    (nextLevel
      ? nextIndex <= currentIndex ||
        TUTOR_CEFR_LEVELS.slice(0, activeIndex + 1).every(
          (level) => levelCompletionStatus[level]?.isComplete,
        )
      : false);

  const navButtonProps = {
    variant: "outline",
    borderColor: isLightTheme ? `${levelInfo.color}88` : `${levelInfo.color}cc`,
    borderWidth: "2px",
    bg: isLightTheme ? "var(--app-glass-bg-soft)" : "rgba(15, 23, 42, 0.88)",
    color: isLightTheme ? "var(--app-text-primary)" : "whiteAlpha.950",
    boxShadow: isLightTheme ? undefined : `0 0 0 1px ${levelInfo.color}33`,
    size: "sm",
    _hover: {
      bg: isLightTheme ? "var(--app-surface-muted)" : `${levelInfo.color}22`,
      borderColor: `${levelInfo.color}ee`,
    },
    _disabled: {
      opacity: 0.48,
      cursor: "not-allowed",
      color: isLightTheme ? "var(--app-text-muted)" : "whiteAlpha.600",
    },
  };

  return (
    <VStack spacing={4} w="100%">
      <VStack spacing={0} align="center">
        <Badge
          px={4}
          py={2}
          borderRadius="16px"
          bg={
            isLightTheme
              ? "linear-gradient(135deg, rgba(255,253,249,0.98) 0%, rgba(255,247,237,0.98) 100%)"
              : undefined
          }
          bgGradient={
            isLightTheme
              ? undefined
              : `linear(135deg, ${levelInfo.color}, ${levelInfo.color}aa)`
          }
          border="2px solid"
          borderColor={
            isLightTheme ? `${levelInfo.color}99` : `${levelInfo.color}ee`
          }
          color={isLightTheme ? "#2f261d" : "white"}
          fontSize="md"
          fontWeight="black"
          textShadow={isLightTheme ? "none" : "0 1px 3px rgba(0,0,0,0.45)"}
          boxShadow={
            isLightTheme
              ? `0 8px 24px ${levelInfo.color}22`
              : `0 10px 26px ${levelInfo.color}40, inset 0 1px 0 rgba(255,255,255,0.24)`
          }
        >
          {levelInfo.label || activeLevel}
        </Badge>
        <Text fontSize="md" fontWeight="bold" color="var(--app-text-primary)">
          {getTutorDisplayText(levelInfo.name, lang)}
        </Text>
        <Text fontSize="xs" color="var(--app-text-secondary)">
          {getTutorDisplayText(levelInfo.description, lang)}
        </Text>
      </VStack>

      <HStack justify="center" spacing={3}>
        {previousLevel && (
          <Button
            leftIcon={<RiArrowLeftLine />}
            onClick={() => onLevelChange(previousLevel)}
            {...navButtonProps}
          >
            {TUTOR_LEVEL_INFO[previousLevel]?.label || previousLevel}
          </Button>
        )}
        {nextLevel && (
          <Button
            rightIcon={isNextUnlocked ? <RiArrowRightLine /> : <RiLockLine />}
            onClick={() => isNextUnlocked && onLevelChange(nextLevel)}
            isDisabled={!isNextUnlocked}
            opacity={isNextUnlocked ? 1 : 0.58}
            cursor={isNextUnlocked ? "pointer" : "not-allowed"}
            {...navButtonProps}
          >
            {TUTOR_LEVEL_INFO[nextLevel]?.label || nextLevel}
          </Button>
        )}
      </HStack>

      {levelProgress >= 100 && activeLevel === currentLevel && (
        <HStack
          justify="center"
          p={3}
          bgGradient="linear(135deg, green.500, green.600)"
          borderRadius="lg"
          spacing={2}
          color="white"
        >
          <RiTrophyLine size={20} />
          <Text fontWeight="bold" fontSize="sm">
            {tutorCopy(lang, {
              en: "Level complete",
              es: "Nivel completado",
              pt: "Nivel completo",
              it: "Livello completato",
              fr: "Niveau termine",
              ja: "レベル完了",
              hi: "स्तर पूरा हुआ",
              ar: "المستوى اكتمل",
              zh: "等级完成",
            })}
          </Text>
        </HStack>
      )}
    </VStack>
  );
}

function TutorLessonProgressRing({
  percent = 0,
  label = "",
  isComplete = false,
  isLightTheme = false,
}) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const progressColor = isComplete ? "#34D399" : "#5EEAD4";
  const trackColor = isLightTheme
    ? "rgba(31,41,55,0.14)"
    : "rgba(255,255,255,0.18)";
  const innerBg = isLightTheme ? "rgba(255,255,255,0.92)" : "rgba(5,10,22,0.9)";
  const iconColor = isLightTheme ? "#166534" : "#D1FAE5";

  return (
    <Box
      role="progressbar"
      aria-label={label || "Lesson progress"}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safePercent}
      title={label || `${safePercent}%`}
      w="26px"
      h="26px"
      borderRadius="full"
      display="grid"
      placeItems="center"
      flexShrink={0}
      bg={`conic-gradient(${progressColor} ${safePercent}%, ${trackColor} 0)`}
      boxShadow={
        isComplete
          ? `0 0 14px ${progressColor}55`
          : isLightTheme
            ? "0 1px 4px rgba(15,23,42,0.08)"
            : "0 0 10px rgba(94,234,212,0.12)"
      }
      transition="background 180ms ease, box-shadow 180ms ease"
    >
      <Box
        w="18px"
        h="18px"
        borderRadius="full"
        bg={innerBg}
        display="grid"
        placeItems="center"
      >
        {isComplete ? (
          <Box as={RiCheckLine} boxSize="13px" color={iconColor} />
        ) : (
          <Box
            w="5px"
            h="5px"
            borderRadius="full"
            bg={progressColor}
            opacity={safePercent > 0 ? 0.95 : 0.45}
          />
        )}
      </Box>
    </Box>
  );
}

function TutorPathLessonNode({
  lesson,
  unit,
  status,
  earnedPercent = 0,
  supportLang,
  onSelect,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const isLocked = status === SKILL_STATUS.LOCKED;
  const isCompleted = status === SKILL_STATUS.COMPLETED;
  const isInProgress = status === SKILL_STATUS.IN_PROGRESS;
  const isClickable = !isLocked;
  const Icon = isCompleted
    ? RiCheckLine
    : isLocked
      ? RiLockLine
      : RiBookOpenLine;
  const color = unit?.color || "#38BDF8";
  const ringPercent = Math.max(0, Math.min(100, earnedPercent));
  const ringRadius = 48;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - ringPercent / 100);
  const ringViewport = 106;
  const ringCenter = ringViewport / 2;
  const progressRingTrackColor = isLightTheme
    ? "rgba(247, 199, 74, 0.46)"
    : "rgba(224,170,44,0.34)";
  const progressRingStrokeColor = isLightTheme ? "#F7C74A" : "#E0AA2C";
  const shouldPastelizeNode =
    isLightTheme && !isLocked && status !== SKILL_STATUS.COMPLETED;
  const lightNodeColorStart = shouldPastelizeNode
    ? mixHexColors(color, "#fffaf3", 0.26)
    : color;
  const lightNodeColorEnd = shouldPastelizeNode
    ? mixHexColors(color, "#f2e6d4", 0.18)
    : color;
  const lightNodeGlowColor = shouldPastelizeNode
    ? mixHexColors(color, "#fff8ef", 0.34)
    : color;
  const nodeBg = isLocked
    ? isLightTheme
      ? "linear(135deg, rgba(245, 239, 230, 0.98), rgba(224, 212, 194, 0.98))"
      : "linear(to-br, gray.700, gray.800)"
    : isCompleted
      ? "linear(135deg, #FFD700, #FFA500, #FFD700)"
      : shouldPastelizeNode
        ? `linear(135deg, ${lightNodeColorStart}, ${lightNodeColorEnd})`
        : `linear(135deg, ${color}dd, ${color})`;
  const nodeShadow = isLocked
    ? isLightTheme
      ? "0 8px 0px rgba(168, 146, 119, 0.26), 0 0 0 1px rgba(168, 146, 119, 0.18)"
      : "0 8px 0px rgba(0,0,0,0.4)"
    : isCompleted
      ? "0 8px 0px #DAA520, 0 0 15px rgba(255,215,0,0.3)"
      : shouldPastelizeNode
        ? `0 8px 0px ${hexToRgba(lightNodeColorEnd, 0.58)}, 0 0 0 1px ${hexToRgba(
            lightNodeColorStart,
            0.18,
          )}`
        : `0 8px 0px ${hexToRgba(color, 0.67)}`;
  const nodeOpacity = isLocked ? (isLightTheme ? 0.92 : 0.4) : 1;
  const iconColor = isLocked
    ? isLightTheme
      ? "#8B7A63"
      : "gray"
    : isLightTheme
      ? "#fffaf3"
      : "white";
  const title = getTutorDisplayText(lesson.title, supportLang);

  return (
    <VStack
      as="button"
      type="button"
      spacing={2}
      onClick={() => isClickable && onSelect?.()}
      disabled={!isClickable}
      cursor={isClickable ? "pointer" : "not-allowed"}
      bg="transparent"
      border="none"
      _focus={{ outline: "none" }}
      _focusVisible={
        isClickable ? { boxShadow: `0 0 0 3px ${hexToRgba(color, 0.6)}` } : {}
      }
      _active={isClickable ? { transform: "translateY(2px) scale(0.97)" } : {}}
      sx={{
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <Box position="relative">
        {!isLocked && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            w="90px"
            h="90px"
            borderRadius="full"
            bg={
              isCompleted
                ? "#FFD700"
                : shouldPastelizeNode
                  ? lightNodeGlowColor
                  : color
            }
            filter="blur(16px)"
            opacity={isCompleted ? 0.6 : shouldPastelizeNode ? 0.24 : 0.4}
            pointerEvents="none"
          />
        )}
        <Box
          w="90px"
          h="90px"
          borderRadius="full"
          bgGradient={nodeBg}
          border="4px solid"
          borderColor={
            isLocked && isLightTheme
              ? "rgba(168, 146, 119, 0.16)"
              : "transparent"
          }
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative"
          boxShadow={nodeShadow}
          opacity={nodeOpacity}
          transition="transform 0.15s ease, box-shadow 0.15s ease"
          sx={{
            "button:active &": {
              boxShadow: "none",
            },
          }}
        >
          {isInProgress && (
            <Box
              as="svg"
              pointerEvents="none"
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width={`${ringViewport}px`}
              height={`${ringViewport}px`}
              viewBox={`0 0 ${ringViewport} ${ringViewport}`}
            >
              <circle
                cx={ringCenter}
                cy={ringCenter}
                r={ringRadius}
                fill="none"
                stroke={progressRingTrackColor}
                strokeWidth="10"
              />
              <circle
                cx={ringCenter}
                cy={ringCenter}
                r={ringRadius}
                fill="none"
                stroke={progressRingStrokeColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
                style={{ transition: "stroke-dashoffset 0.4s ease" }}
              />
            </Box>
          )}
          <Icon
            size={36}
            color={iconColor}
            style={{
              filter: !isLocked
                ? isLightTheme
                  ? "drop-shadow(0 1px 2px rgba(118, 92, 60, 0.18))"
                  : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                : "none",
            }}
          />
          {isCompleted && (
            <>
              <Box
                pointerEvents="none"
                position="absolute"
                top="10%"
                right="15%"
                w="9px"
                h="9px"
                borderRadius="full"
                bg="white"
                boxShadow="0 0 10px 3px rgba(255,255,255,0.7), 0 0 18px rgba(255,255,255,0.5)"
                animation="sparkle 2.4s ease-in-out infinite"
                sx={{
                  "@keyframes sparkle": {
                    "0%, 100%": {
                      opacity: 0,
                      transform: "scale(0.5) rotate(0deg)",
                    },
                    "50%": {
                      opacity: 0.55,
                      transform: "scale(0.6) rotate(15deg)",
                      filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))",
                    },
                  },
                }}
              />
              <Box
                pointerEvents="none"
                position="absolute"
                bottom="15%"
                left="10%"
                w="7px"
                h="7px"
                borderRadius="full"
                bg="white"
                boxShadow="0 0 8px 2px rgba(255,255,255,0.6), 0 0 14px rgba(255,255,255,0.4)"
                animation="sparkle 2.7s ease-in-out infinite 1.2s"
                sx={{
                  "@keyframes sparkle": {
                    "0%, 100%": {
                      opacity: 0,
                      transform: "scale(0.4) rotate(0deg)",
                    },
                    "50%": {
                      opacity: 0.9,
                      transform: "scale(1.3) rotate(-10deg)",
                      filter: "drop-shadow(0 0 6px rgba(255,255,255,0.8))",
                    },
                  },
                }}
              />
              <Box
                pointerEvents="none"
                position="absolute"
                top="45%"
                left="60%"
                w="5px"
                h="5px"
                borderRadius="full"
                bg="white"
                boxShadow="0 0 8px 2px rgba(255,255,255,0.7), 0 0 16px rgba(255,255,255,0.5)"
                animation="sparkle 2.2s ease-in-out infinite 0.6s"
                sx={{
                  "@keyframes sparkle": {
                    "0%, 100%": {
                      opacity: 0,
                      transform: "scale(0.3) rotate(0deg)",
                    },
                    "50%": {
                      opacity: 0.9,
                      transform: "scale(1.1) rotate(8deg)",
                      filter: "drop-shadow(0 0 7px rgba(255,255,255,0.8))",
                    },
                  },
                }}
              />
            </>
          )}
        </Box>
      </Box>
      <Text
        fontSize="sm"
        fontWeight="bold"
        textAlign="center"
        maxW="140px"
        lineHeight="1.15"
        color={
          isLocked
            ? isLightTheme
              ? "#c4b4a0"
              : "gray.600"
            : isLightTheme
              ? "#746250"
              : "white"
        }
        textShadow="none"
      >
        {title}
      </Text>
    </VStack>
  );
}

function TutorPathUnit({
  unit,
  unitIndex,
  visibleUnits,
  userProgress,
  supportLang,
  getLessonStatus,
  getLessonEarnedPercent,
  onLessonSelect,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const zigzagOffset =
    useBreakpointValue(
      { base: 90, sm: 110, md: 140, lg: 180 },
      { ssr: false },
    ) || 90;
  const svgWidth =
    useBreakpointValue(
      { base: 240, sm: 260, md: 300, lg: 320 },
      { ssr: false },
    ) || 240;
  const completedCount = unit.lessons.filter(
    (lesson) =>
      userProgress.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED,
  ).length;
  const unitTitle = getTutorDisplayText(unit.title, supportLang);
  const unitDescription = getTutorDisplayText(unit.description, supportLang);

  return (
    <Box mb={-8} position="relative">
      <Box
        position="absolute"
        top="0"
        left="50%"
        transform="translateX(-50%)"
        w="300px"
        h="300px"
        bgGradient={`radial(${unit.color}15, transparent 70%)`}
        filter="blur(60px)"
        opacity={0.6}
        pointerEvents="none"
        zIndex={0}
      />
      <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
        <Box
          bgGradient={`linear(135deg, ${unit.color}15, ${unit.color}08)`}
          backdropFilter="blur(10px)"
          borderRadius="2xl"
          p={4}
          px={6}
          border="2px solid"
          borderColor={`${unit.color}40`}
          boxShadow={
            isLightTheme
              ? "none"
              : `0 8px 32px ${unit.color}20, 0 4px 16px rgba(0,0,0,0.3)`
          }
          position="relative"
          overflow="hidden"
        >
          <HStack justify="space-between" position="relative" align="start">
            <VStack align="start" spacing={2}>
              <HStack spacing={3}>
                <Box
                  w={2}
                  h={2}
                  borderRadius="full"
                  bg={unit.color}
                  boxShadow={`0 0 20px ${unit.color}80`}
                />
                <Heading
                  size="sm"
                  color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                >
                  {unitTitle}
                </Heading>
              </HStack>
              <Text
                fontSize="sm"
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                ml={8}
              >
                {unitDescription}
              </Text>
            </VStack>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
            >
              {completedCount}/{unit.lessons.length}
            </Text>
          </HStack>
        </Box>

        <Box position="relative" py={4} minH="200px">
          {unit.lessons.map((lesson, lessonIndex) => {
            const status = getLessonStatus(
              lesson,
              unit,
              unitIndex,
              lessonIndex,
              visibleUnits,
            );
            const isEven = lessonIndex % 2 === 0;
            const offset = isEven ? 0 : zigzagOffset;
            const yPosition = lessonIndex * 140;
            const nextIsEven = (lessonIndex + 1) % 2 === 0;
            const nextOffset = nextIsEven ? 0 : zigzagOffset;

            return (
              <Box key={lesson.id}>
                {lessonIndex < unit.lessons.length - 1 && (
                  <Box
                    as="svg"
                    position="absolute"
                    top={`${yPosition + 45}px`}
                    left="50%"
                    transform="translateX(-50%)"
                    width={`${svgWidth}px`}
                    height="140px"
                    overflow="visible"
                    zIndex={0}
                    pointerEvents="none"
                  >
                    <path
                      d={`M ${svgWidth / 2 + offset} 0 Q ${
                        svgWidth / 2 + (offset + nextOffset) / 2
                      } 70, ${svgWidth / 2 + nextOffset} 95`}
                      stroke={
                        status === SKILL_STATUS.COMPLETED
                          ? unit.color
                          : isLightTheme
                            ? "#d3c4b0"
                            : "#374151"
                      }
                      strokeWidth="5"
                      fill="none"
                      strokeLinecap="round"
                      opacity={status === SKILL_STATUS.COMPLETED ? 0.76 : 0.42}
                    />
                  </Box>
                )}
                <Box
                  position="absolute"
                  top={`${yPosition}px`}
                  left="50%"
                  transform={`translateX(calc(-50% + ${offset}px))`}
                  zIndex={1}
                >
                  <TutorPathLessonNode
                    lesson={lesson}
                    unit={unit}
                    status={status}
                    supportLang={supportLang}
                    earnedPercent={getLessonEarnedPercent(lesson, status)}
                    onSelect={() => onLessonSelect(lesson, unit, status)}
                  />
                </Box>
              </Box>
            );
          })}
          <Box h={`${unit.lessons.length * 140}px`} />
        </Box>
      </VStack>
    </Box>
  );
}

/* ---------------------------
   Component
--------------------------- */
export default function Tutor({
  activeNpub = "",
  targetLang = "es",
  supportLang = "",
  maxProficiencyLevel = "Pre-A1",
  onFirstLessonComplete,
  onDailyGoalCelebration,
  isActive = true,
}) {
  const aliveRef = useRef(false);
  const autoStopTimerRef = useRef(null);
  const playSound = useSoundSettings((s) => s.playSound);
  const soundIsInitialized = useSoundSettings((s) => s.isInitialized);
  const tutorVolume = useSoundSettings((s) => s.tutorVolume);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const voiceOrbSize =
    useBreakpointValue({ base: 64, sm: 70, md: 75 }, { ssr: false }) || 64;
  const voiceOrbWrapWidth =
    useBreakpointValue({ base: "112px", md: "132px" }, { ssr: false }) ||
    "112px";

  // User id
  const user = useUserStore((s) => s.user);
  const currentNpub = activeNpub?.trim?.() || strongNpub(user);

  useEffect(() => {
    if (!isActive) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [isActive]);

  // Refs for realtime
  const audioRef = useRef(null);
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const dcRef = useRef(null);

  // WebAudio capture graph
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const floatBufRef = useRef(null);
  const captureOutRef = useRef(null);
  const audioGraphReadyRef = useRef(false);

  // Apply the saved Tutor volume (gain multiplier, 0-4) live to an active session.
  useEffect(() => {
    dcRef.current?.setOutputGain?.(tutorVolume);
  }, [tutorVolume]);

  // Cached-clip index
  const audioCacheIndexRef = useRef(new Set());

  // Replay capture maps
  const recMapRef = useRef(new Map());
  const recChunksRef = useRef(new Map());
  const recTailRef = useRef(new Map());
  const replayRidSetRef = useRef(new Set());
  const ignoredRidSetRef = useRef(new Set());
  const replayAudioRef = useRef(null);
  const replayAudioUrlRef = useRef("");
  const replayCleanupRef = useRef(null);
  const guardrailItemIdsRef = useRef([]);
  const pendingGuardrailTextRef = useRef("");
  const tutorKickoffSentRef = useRef(false);
  const tutorKickoffTimerRef = useRef(null);
  const tutorKickoffRetryCountRef = useRef(0);
  const tutorSessionReadyRef = useRef(false);
  // Tutorial lesson opens with a support-language welcome turn. While true, the
  // learner's next reply is treated as a greeting (no XP, no agenda progress)
  // and triggers the real lesson kickoff.
  const tutorWelcomePendingReplyRef = useRef(false);
  // Response ids whose assistant message is the tutorial welcome (so it renders
  // in the support language rather than the target language).
  const tutorWelcomeRidSetRef = useRef(new Set());

  // Idle gating
  const isIdleRef = useRef(true);
  const idleWaitersRef = useRef([]);
  const assistantInputLockedRef = useRef(false);
  const assistantSpeakingRef = useRef(false);
  const assistantUnlockTimerRef = useRef(null);
  const listeningCueLastPlayedAtRef = useRef(0);
  const pendingUserAudioCommitRef = useRef(false);

  // Track when current response started (for proper user message ordering)
  const responseStartTimeRef = useRef(null);

  // Connection/UI state
  const [status, setStatus] = useState("disconnected");
  const [err, setErr] = useState("");
  const [uiState, setUiStateState] = useState("idle");
  const uiStateRef = useRef("idle");
  const setUiState = useCallback((nextUiState) => {
    const resolvedUiState =
      typeof nextUiState === "function"
        ? nextUiState(uiStateRef.current)
        : nextUiState;
    uiStateRef.current = resolvedUiState;
    setUiStateState(resolvedUiState);
  }, []);
  const [volume] = useState(0);
  const [mood, setMood] = useState("neutral");
  const [replayingId, setReplayingId] = useState(null);
  const [translatingMessageId, setTranslatingMessageId] = useState(null);

  // Learning prefs
  const [voice, setVoice] = useState(
    normalizeGeminiLiveVoice(
      user?.progress?.tutorVoice || user?.progress?.voice,
    ),
  );
  const [voicePersona, setVoicePersona] = useState(
    user?.progress?.tutorVoicePersona ||
      user?.progress?.voicePersona ||
      translations.en.onboarding_persona_default_example,
  );
  const [showTranslations, setShowTranslations] = useState(
    user?.progress?.showTranslations !== false,
  );

  // Conversation settings state
  const [conversationSettings, setConversationSettings] = useState({
    proficiencyLevel: maxProficiencyLevel || "A1",
    practicePronunciation: user?.progress?.practicePronunciation || false,
    conversationSubjects: user?.progress?.conversationSubjects || "",
  });
  const conversationSettingsRef = useRef(conversationSettings);

  const {
    isOpen: isTranscriptOpen,
    onOpen: openTranscript,
    onClose: closeTranscript,
  } = useDisclosure();

  // Live refs
  const voiceRef = useRef(voice);
  const voicePersonaRef = useRef(voicePersona);
  const targetLangRef = useRef(targetLang);
  const supportLangRef = useRef(supportLang || "");

  // Hydrate refs on changes
  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);
  useEffect(() => {
    voicePersonaRef.current = voicePersona;
  }, [voicePersona]);
  useEffect(() => {
    targetLangRef.current = targetLang;
  }, [targetLang]);
  useEffect(() => {
    supportLangRef.current = supportLang || "";
  }, [supportLang]);

  // Keep conversation settings ref updated
  useEffect(() => {
    conversationSettingsRef.current = conversationSettings;
  }, [conversationSettings]);

  // XP
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  const tutorUserProgress = useMemo(() => {
    const progressLanguageKey = String(targetLang || "es").toLowerCase();
    const tutorLanguageLessons = user?.progress?.tutorLanguageLessons;
    const hasTutorLanguageLessons =
      tutorLanguageLessons && typeof tutorLanguageLessons === "object";
    const lessonsForLanguage = hasTutorLanguageLessons
      ? tutorLanguageLessons?.[progressLanguageKey] ||
        tutorLanguageLessons?.[targetLang] ||
        {}
      : {};

    return {
      lessons: lessonsForLanguage,
      targetLang,
    };
  }, [targetLang, user?.progress]);

  const {
    isOpen: isTutorPathOpen,
    onOpen: openTutorPath,
    onClose: closeTutorPath,
  } = useDisclosure();
  const initialTutorLevel = clampTutorLevelToUnlocked(
    readStoredTutorLevel(targetLang) ||
      getUnlockedTutorLevel(maxProficiencyLevel),
    maxProficiencyLevel,
  );
  const [activeTutorLevel, setActiveTutorLevel] = useState(initialTutorLevel);
  const [tutorPathUnits, setTutorPathUnits] = useState([]);
  const [isTutorPathLoading, setIsTutorPathLoading] = useState(false);
  const isTutorPathLoadingRef = useRef(false);
  const tutorPathLoadedLangRef = useRef("");
  const [selectedTutorLesson, setSelectedTutorLesson] = useState(null);
  const [selectedTutorUnit, setSelectedTutorUnit] = useState(null);
  const selectedTutorLessonRef = useRef(null);
  const selectedTutorUnitRef = useRef(null);
  const [tutorLessonEarnedXp, setTutorLessonEarnedXp] = useState(0);
  const tutorLessonEarnedXpRef = useRef(0);
  const [tutorStarterAgendaProgress, setTutorStarterAgendaProgress] = useState(
    {},
  );
  const tutorStarterAgendaProgressRef = useRef({});
  const tutorLessonCompletionTriggeredRef = useRef(false);
  const pendingTutorLessonCompletionRef = useRef(false);
  const [completedTutorLessonData, setCompletedTutorLessonData] =
    useState(null);
  const [showTutorLessonComplete, setShowTutorLessonComplete] = useState(false);
  const [completedTutorAgendaData, setCompletedTutorAgendaData] =
    useState(null);
  const [showTutorCompletedAgenda, setShowTutorCompletedAgenda] =
    useState(false);
  const tutorResumeAppliedRef = useRef("");
  const pendingFirstLessonCompletionFlowRef = useRef(false);
  const tutorFirstLessonCompleteNotifiedRef = useRef(false);
  const pendingTutorAgendaAfterDailyGoalRef = useRef(false);
  const pendingTutorFirstLessonNotifyAfterDailyGoalRef = useRef(false);
  const pendingTutorDailyGoalCelebrationRef = useRef(null);
  const lessonCompleteSoundKeyRef = useRef("");

  useEffect(() => {
    const storedLevel = readStoredTutorLevel(targetLang);
    setActiveTutorLevel(
      clampTutorLevelToUnlocked(
        storedLevel || getUnlockedTutorLevel(maxProficiencyLevel),
        maxProficiencyLevel,
      ),
    );
  }, [maxProficiencyLevel, targetLang]);

  useEffect(() => {
    selectedTutorLessonRef.current = selectedTutorLesson;
    selectedTutorUnitRef.current = selectedTutorUnit;
  }, [selectedTutorLesson, selectedTutorUnit]);

  useEffect(() => {
    tutorLessonEarnedXpRef.current = tutorLessonEarnedXp;
  }, [tutorLessonEarnedXp]);

  useEffect(() => {
    if (!showTutorLessonComplete) {
      lessonCompleteSoundKeyRef.current = "";
      return;
    }

    const soundKey =
      completedTutorLessonData?.lessonId ||
      completedTutorLessonData?.title ||
      "tutor-lesson-complete";
    if (lessonCompleteSoundKeyRef.current === soundKey) return;

    if (soundIsInitialized) {
      lessonCompleteSoundKeyRef.current = soundKey;
      playSound("lessonComplete");
      return;
    }

    if (typeof window === "undefined") return;

    const playAfterUserGesture = () => {
      lessonCompleteSoundKeyRef.current = soundKey;
      playSound("lessonComplete");
    };

    window.addEventListener("pointerdown", playAfterUserGesture, {
      once: true,
    });
    window.addEventListener("keydown", playAfterUserGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", playAfterUserGesture);
      window.removeEventListener("keydown", playAfterUserGesture);
    };
  }, [
    completedTutorLessonData?.lessonId,
    completedTutorLessonData?.title,
    playSound,
    showTutorLessonComplete,
    soundIsInitialized,
  ]);

  useEffect(() => {
    if (!isTutorStarterAgendaLesson(selectedTutorLessonRef.current)) {
      tutorStarterAgendaProgressRef.current = {};
      setTutorStarterAgendaProgress({});
    }
  }, [selectedTutorLesson?.id, targetLang]);

  useEffect(() => {
    pendingFirstLessonCompletionFlowRef.current = false;
    tutorFirstLessonCompleteNotifiedRef.current = false;
    pendingTutorAgendaAfterDailyGoalRef.current = false;
    pendingTutorFirstLessonNotifyAfterDailyGoalRef.current = false;
    pendingTutorDailyGoalCelebrationRef.current = null;
  }, [currentNpub, targetLang]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleDailyGoalCelebrationClosed = () => {
      if (pendingTutorAgendaAfterDailyGoalRef.current) {
        pendingTutorAgendaAfterDailyGoalRef.current = false;
        setShowTutorCompletedAgenda(true);
        return;
      }
      if (pendingTutorFirstLessonNotifyAfterDailyGoalRef.current) {
        pendingTutorFirstLessonNotifyAfterDailyGoalRef.current = false;
        notifyTutorFirstLessonCompleteOnce();
      }
    };
    window.addEventListener(
      "daily-goal:celebration-closed",
      handleDailyGoalCelebrationClosed,
    );
    return () =>
      window.removeEventListener(
        "daily-goal:celebration-closed",
        handleDailyGoalCelebrationClosed,
      );
  }, [onFirstLessonComplete]);

  useEffect(() => {
    const langKey = getTutorStorageLang(targetLang);
    let cancelled = false;
    tutorPathLoadedLangRef.current = "";
    setTutorPathUnits([]);
    setIsTutorPathLoading(true);
    loadMultiLevelLearningPath(targetLang, TUTOR_CEFR_LEVELS)
      .then((units) => {
        if (cancelled) return;
        setTutorPathUnits(Array.isArray(units) ? units : []);
        tutorPathLoadedLangRef.current = langKey;
      })
      .catch((error) => {
        console.error("Failed to load Tutor path:", error);
        if (!cancelled) setTutorPathUnits([]);
      })
      .finally(() => {
        if (!cancelled) setIsTutorPathLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetLang]);

  const visibleTutorUnits = useMemo(
    () => tutorPathUnits.filter((unit) => unit.cefrLevel === activeTutorLevel),
    [activeTutorLevel, tutorPathUnits],
  );

  const tutorLevelCompletionStatus = useMemo(() => {
    return TUTOR_CEFR_LEVELS.reduce((acc, level) => {
      const levelUnits = tutorPathUnits.filter(
        (unit) => unit.cefrLevel === level,
      );
      const totalLessons = levelUnits.reduce(
        (sum, unit) => sum + (unit.lessons?.length || 0),
        0,
      );
      const completedLessons = levelUnits.reduce(
        (sum, unit) =>
          sum +
          (unit.lessons || []).filter(
            (lesson) =>
              tutorUserProgress.lessons?.[lesson.id]?.status ===
              SKILL_STATUS.COMPLETED,
          ).length,
        0,
      );
      acc[level] = {
        isComplete: totalLessons > 0 && completedLessons >= totalLessons,
        progress:
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0,
      };
      return acc;
    }, {});
  }, [tutorPathUnits, tutorUserProgress.lessons]);

  const activeTutorLevelProgress =
    tutorLevelCompletionStatus[activeTutorLevel]?.progress || 0;
  const tutorInitialAgendaReadyRef = useRef(false);
  const [isTutorAgendaHydrating, setIsTutorAgendaHydrating] = useState(true);
  const isTutorAgendaHydratingRef = useRef(true);

  useEffect(() => {
    isTutorPathLoadingRef.current = isTutorPathLoading;
  }, [isTutorPathLoading]);

  useEffect(() => {
    isTutorAgendaHydratingRef.current = isTutorAgendaHydrating;
  }, [isTutorAgendaHydrating]);

  useEffect(() => {
    tutorResumeAppliedRef.current = "";
    tutorInitialAgendaReadyRef.current = false;
    selectedTutorLessonRef.current = null;
    selectedTutorUnitRef.current = null;
    tutorLessonEarnedXpRef.current = 0;
    tutorLessonCompletionTriggeredRef.current = false;
    tutorStarterAgendaProgressRef.current = {};
    setIsTutorAgendaHydrating(true);
    setSelectedTutorLesson(null);
    setSelectedTutorUnit(null);
    setTutorLessonEarnedXp(0);
    setTutorStarterAgendaProgress({});
  }, [targetLang]);

  useEffect(() => {
    if (!tutorPathUnits.length) return;
    const langKey = getTutorStorageLang(targetLang);
    if (tutorPathLoadedLangRef.current !== langKey) return;
    const progressLessons = tutorUserProgress.lessons || {};
    const storedLevel = readStoredTutorLevel(targetLang);
    const currentTutorLessonId =
      typeof user?.progress?.currentTutorLesson === "string"
        ? user.progress.currentTutorLesson
        : "";
    const storedLessonId =
      currentTutorLessonId || readStoredTutorLessonId(targetLang);
    const storedLesson = findTutorLessonById(tutorPathUnits, storedLessonId);
    const storedLessonProgress = storedLesson
      ? progressLessons?.[storedLesson.lesson.id]
      : null;
    const storedLessonIsUnlocked = storedLesson
      ? isTutorLessonUnlockedById(
          tutorPathUnits,
          progressLessons,
          storedLesson.lesson.id,
        )
      : false;
    const storedLessonIsUsable =
      storedLesson &&
      storedLessonProgress?.status !== SKILL_STATUS.COMPLETED &&
      (storedLessonProgress?.status === SKILL_STATUS.IN_PROGRESS ||
        storedLessonIsUnlocked);
    const resumeLesson = storedLessonIsUsable
      ? {
          ...storedLesson,
          status:
            storedLessonProgress?.status === SKILL_STATUS.IN_PROGRESS
              ? SKILL_STATUS.IN_PROGRESS
              : SKILL_STATUS.AVAILABLE,
        }
      : findLatestTutorUnlockedLesson(tutorPathUnits, progressLessons);

    if (resumeLesson?.unit?.cefrLevel) {
      setActiveTutorLevel(resumeLesson.unit.cefrLevel);
    } else if (storedLevel) {
      setActiveTutorLevel(storedLevel);
    }

    let appliedResumeLesson = false;

    if (resumeLesson) {
      const resumeKey = `${langKey}:${resumeLesson.lesson.id}`;
      if (
        tutorResumeAppliedRef.current !== resumeKey ||
        selectedTutorLessonRef.current?.id !== resumeLesson.lesson.id
      ) {
        tutorResumeAppliedRef.current = resumeKey;

        const earned =
          resumeLesson.status === SKILL_STATUS.IN_PROGRESS
            ? getStoredTutorLessonEarnedXp(
                progressLessons?.[resumeLesson.lesson.id],
                resumeLesson.lesson,
              )
            : 0;

        const savedStarterProgress = isTutorStarterAgendaLesson(
          resumeLesson.lesson,
        )
          ? getSavedTutorStarterAgendaProgress(
              progressLessons?.[resumeLesson.lesson.id],
            )
          : {};

        setSelectedTutorLesson(resumeLesson.lesson);
        setSelectedTutorUnit(resumeLesson.unit);
        selectedTutorLessonRef.current = resumeLesson.lesson;
        selectedTutorUnitRef.current = resumeLesson.unit;
        setTutorLessonEarnedXp(earned);
        tutorLessonEarnedXpRef.current = earned;
        setTutorStarterAgendaProgress(savedStarterProgress);
        tutorStarterAgendaProgressRef.current = savedStarterProgress;
        tutorLessonCompletionTriggeredRef.current = false;
        setConversationSettings((prev) => ({
          ...prev,
          proficiencyLevel:
            resumeLesson.unit?.cefrLevel || prev.proficiencyLevel,
        }));
        appliedResumeLesson = true;
      }
    }

    if (!tutorInitialAgendaReadyRef.current) {
      tutorInitialAgendaReadyRef.current = true;
      setIsTutorAgendaHydrating(false);
      return;
    }

    if (!appliedResumeLesson) {
      setIsTutorAgendaHydrating(false);
    }
  }, [
    targetLang,
    tutorPathUnits,
    tutorUserProgress.lessons,
    user?.progress?.currentTutorLesson,
    xp,
  ]);

  // Inline coaching feedback for incomplete attempts
  const [inlineFeedback] = useState("");
  const [inlineFeedbackKind] = useState(null);

  function getTutorLessonStatus(lesson, unit, unitIndex, lessonIndex, units) {
    const lessonProgress = tutorUserProgress.lessons?.[lesson.id];
    if (lessonProgress?.status === SKILL_STATUS.COMPLETED) {
      return SKILL_STATUS.COMPLETED;
    }
    if (lessonProgress?.status === SKILL_STATUS.IN_PROGRESS) {
      return SKILL_STATUS.IN_PROGRESS;
    }

    const testNsec =
      typeof window !== "undefined" ? localStorage.getItem("local_nsec") : null;
    const isTestUnlocked =
      testNsec ===
      "nsec1akcvuhtemz3kw58gvvfg38uucu30zfsahyt6ulqapx44lype6a9q42qevv";
    if (isTestUnlocked) return SKILL_STATUS.AVAILABLE;

    let previousCompleted = false;
    if (lessonIndex === 0) {
      if (unitIndex === 0) {
        previousCompleted = true;
      } else {
        const previousUnit = units[unitIndex - 1];
        const previousLesson =
          previousUnit?.lessons?.[previousUnit.lessons.length - 1];
        previousCompleted =
          tutorUserProgress.lessons?.[previousLesson?.id]?.status ===
          SKILL_STATUS.COMPLETED;
      }
    } else {
      previousCompleted =
        tutorUserProgress.lessons?.[unit.lessons[lessonIndex - 1]?.id]
          ?.status === SKILL_STATUS.COMPLETED;
    }

    return previousCompleted ? SKILL_STATUS.AVAILABLE : SKILL_STATUS.LOCKED;
  }

  function getTutorLessonEarnedPercent(lesson, status) {
    if (status === SKILL_STATUS.COMPLETED) return 100;
    if (status !== SKILL_STATUS.IN_PROGRESS) return 0;

    if (selectedTutorLesson?.id === lesson.id) {
      const required = getTutorLessonXpRequired(lesson);
      return Math.round(
        (Math.max(0, tutorLessonEarnedXp) / Math.max(1, required || 1)) * 100,
      );
    }

    const lessonProgress = tutorUserProgress.lessons?.[lesson.id];
    const required = getTutorLessonXpRequired(lesson);
    if (!required) return 0;
    const earned = getStoredTutorLessonEarnedXp(lessonProgress, lesson);
    return Math.round((Math.max(0, earned) / Math.max(1, required)) * 100);
  }

  function handleTutorPathOpen() {
    openTutorPath();
  }

  function handleTutorLevelChange(level) {
    if (!TUTOR_CEFR_LEVELS.includes(level)) return;
    const nextLevel = clampTutorLevelToUnlocked(level, maxProficiencyLevel);
    if (nextLevel !== level) return;
    setActiveTutorLevel(nextLevel);
    writeStoredTutorLevel(targetLang, nextLevel);
  }

  async function handleTutorLessonSelect(lesson, unit, status) {
    if (!lesson || status === SKILL_STATUS.LOCKED) return;

    const lessonProgress = tutorUserProgress.lessons?.[lesson.id];
    const isCompleted = status === SKILL_STATUS.COMPLETED;
    const earned =
      status === SKILL_STATUS.IN_PROGRESS || isCompleted
        ? getStoredTutorLessonEarnedXp(lessonProgress, lesson)
        : 0;
    const savedStarterProgress = isTutorStarterAgendaLesson(lesson)
      ? getSavedTutorStarterAgendaProgress(lessonProgress)
      : {};

    setSelectedTutorLesson(lesson);
    setSelectedTutorUnit(unit);
    selectedTutorLessonRef.current = lesson;
    selectedTutorUnitRef.current = unit;
    tutorLessonEarnedXpRef.current = isCompleted
      ? getTutorLessonXpRequired(lesson)
      : earned;
    setTutorLessonEarnedXp(
      isCompleted ? getTutorLessonXpRequired(lesson) : earned,
    );
    tutorStarterAgendaProgressRef.current = savedStarterProgress;
    setTutorStarterAgendaProgress(savedStarterProgress);
    tutorLessonCompletionTriggeredRef.current = isCompleted;
    setConversationSettings((prev) => ({
      ...prev,
      proficiencyLevel: unit?.cefrLevel || prev.proficiencyLevel,
    }));
    if (unit?.cefrLevel) {
      writeStoredTutorLevel(targetLangRef.current, unit.cefrLevel);
      setActiveTutorLevel(unit.cefrLevel);
    }
    writeStoredTutorLessonId(targetLangRef.current, lesson.id);
    closeTutorPath();

    if (currentNpub && !isCompleted) {
      try {
        await startTutorLesson(
          currentNpub,
          lesson.id,
          targetLangRef.current,
          tutorUserProgress,
        );
      } catch (error) {
        console.error("Failed to start Tutor lesson:", error);
      }
    }

    setTimeout(() => applyLanguagePolicyNow(), 80);
  }

  async function ensureSelectedTutorLessonStarted() {
    const lesson = selectedTutorLessonRef.current;
    if (!currentNpub || !lesson) return;

    const existingStatus = tutorUserProgress.lessons?.[lesson.id]?.status;
    if (
      existingStatus === SKILL_STATUS.IN_PROGRESS ||
      existingStatus === SKILL_STATUS.COMPLETED
    ) {
      return;
    }

    try {
      await startTutorLesson(
        currentNpub,
        lesson.id,
        targetLangRef.current,
        tutorUserProgress,
      );
    } catch (error) {
      console.error("Failed to start Tutor lesson:", error);
    }
  }

  // Turn counter for XP awarding
  const turnCountRef = useRef(0);
  // Award turn XP at most once per learner turn, so multiple verdict sources
  // (transcript grader, background re-check, markTurnSuccessful tool call) can't
  // stack XP for the same turn. Keyed on turnCountRef.current.
  const tutorXpAwardedTurnRef = useRef(-1);
  // Circuit breaker state for runaway tool-call loops (see the tool.call handler).
  const toolCallBudgetRef = useRef({ turn: -1, count: 0, broke: false });
  // False during the welcome/kickoff phase; flips true on the first real practice
  // turn. Gates tool-grading XP so greeting/"I'm ready" turns can't be awarded XP.
  const lessonPracticeStartedRef = useRef(false);

  // Messages
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  const tutorMessagesStorageKeyRef = useRef("");
  const tutorMessagesHydratedKeyRef = useRef("");
  const tutorMessagesRestoringRef = useRef(false);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const storageKey = getTutorMessagesStorageKey(
      currentNpub,
      targetLang,
      selectedTutorLesson?.id,
    );
    tutorMessagesStorageKeyRef.current = storageKey;
    if (!storageKey || tutorMessagesHydratedKeyRef.current === storageKey) {
      return;
    }

    const storedMessages = readStoredTutorMessages(storageKey);
    tutorMessagesHydratedKeyRef.current = storageKey;
    tutorMessagesRestoringRef.current = true;
    messagesRef.current = storedMessages;
    setMessages(storedMessages);
  }, [currentNpub, selectedTutorLesson?.id, targetLang]);

  useEffect(() => {
    const storageKey = tutorMessagesStorageKeyRef.current;
    if (!storageKey || tutorMessagesHydratedKeyRef.current !== storageKey) {
      return;
    }
    if (tutorMessagesRestoringRef.current) {
      tutorMessagesRestoringRef.current = false;
      return;
    }
    writeStoredTutorMessages(storageKey, messages);
  }, [messages]);

  // The tutorial lesson opens with an assistant-only welcome greeting. That
  // greeting on its own does NOT mean the lesson has started — it has started
  // only once the learner has replied, made agenda progress, or received a real
  // (non-welcome) tutor turn. For every other lesson, any visible message counts
  // as started (matching the previous behavior). Used to gate the kickoff so a
  // resumed session doesn't get stuck showing only the welcome.
  function hasStartedTutorLessonConversation() {
    const msgs = messagesRef.current || [];
    if (!hasVisibleTutorMessages(msgs)) return false;
    if (!isTutorStarterAgendaLesson(selectedTutorLessonRef.current)) return true;
    const hasLearnerReply = msgs.some(
      (m) => m.role === "user" && getTutorMessageVisibleText(m),
    );
    const hasAgendaProgress =
      Object.keys(tutorStarterAgendaProgressRef.current || {}).length > 0;
    const hasNonWelcomeTutorTurn = msgs.some(
      (m) =>
        m.role === "assistant" && !m.welcome && getTutorMessageVisibleText(m),
    );
    return hasLearnerReply || hasAgendaProgress || hasNonWelcomeTutorTurn;
  }

  function buildRecentOnScreenContextInstruction() {
    const context = buildRecentTutorConversationContext(messagesRef.current);
    return context
      ? `RECENT ON-SCREEN CONTEXT FROM THIS TUTOR SESSION:\n${context}\nUse this only to interpret the learner's next response after a reconnect.`
      : "";
  }

  // Stream buffers
  const streamBuffersRef = useRef(new Map());
  const streamFlushScheduled = useRef(false);

  // Response mapping
  const respToMsg = useRef(new Map());
  const tutorClosingActCheckedKeysRef = useRef(new Set());
  const tutorClosingActRecoveryTurnRef = useRef(null);
  const tutorClosingActRecoveryInFlightRef = useRef(false);
  const sessionUpdateTimer = useRef(null);
  const lastTranscriptRef = useRef({ text: "", ts: 0 });
  const inlineFeedbackRef = useRef(inlineFeedback);

  useEffect(() => {
    inlineFeedbackRef.current =
      inlineFeedbackKind === "incorrect" ? inlineFeedback : "";
  }, [inlineFeedback, inlineFeedbackKind]);

  // UI strings
  const storedUiLang = (() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("appLanguage") || "";
    } catch {
      return "";
    }
  })();

  const resolvedSupportLang = resolveSupportUiLanguage({
    supportLang: supportLangRef.current || supportLang,
    persistedSupportLang: user?.progress?.supportLang,
    storedUiLang,
  });
  supportLangRef.current = resolvedSupportLang;

  const uiLang = resolvedSupportLang;
  const ui = translations[uiLang] || translations.en;
  const uiText = (key, fallback = "") =>
    ui?.[key] || translations.en?.[key] || fallback;

  useEffect(() => {
    inlineFeedbackRef.current =
      inlineFeedbackKind === "incorrect" ? inlineFeedback : "";

    if (!inlineFeedback || inlineFeedbackKind !== "incorrect") {
      return;
    }

    clearTimeout(sessionUpdateTimer.current);
    sessionUpdateTimer.current = setTimeout(() => {
      applyLanguagePolicyNow();
    }, 120);

    return () => clearTimeout(sessionUpdateTimer.current);
  }, [inlineFeedback, inlineFeedbackKind]);

  const liveUiState =
    status === "connected" && uiState !== "speaking" && uiState !== "thinking"
      ? "listening"
      : uiState;
  const edgeGlowState = status === "connected" ? liveUiState : "idle";
  const [displayRobotState, setDisplayRobotState] = useState(liveUiState);
  const [previousRobotState, setPreviousRobotState] = useState(null);
  const [isRobotTransitioning, setIsRobotTransitioning] = useState(false);
  const displayOrbState =
    displayRobotState === "thinking"
      ? "idle"
      : getRealtimeOrbVisualState(displayRobotState);
  const previousOrbState =
    previousRobotState === "thinking"
      ? "idle"
      : getRealtimeOrbVisualState(previousRobotState);

  useEffect(() => {
    if (liveUiState === displayRobotState) return;
    setPreviousRobotState(displayRobotState);
    setDisplayRobotState(liveUiState);
    setIsRobotTransitioning(true);
    const timer = setTimeout(() => {
      setIsRobotTransitioning(false);
      setPreviousRobotState(null);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [liveUiState, displayRobotState]);

  // XP level calculation
  const xpLevelNumber = Math.floor(xp / 100) + 1;
  const progressPct = xp % 100;

  // Timeline sorted by timestamp (newest-first; used to find the latest messages).
  const timeline = [...messages].sort((a, b) => b.ts - a.ts);
  // The conversation log renders oldest-first (top → bottom) so the tutor's opening
  // (the tutor starts the conversation) shows at the top, not buried at the bottom.
  const conversationLog = [...timeline].reverse();
  const latestAssistantMessage = timeline.find((m) => {
    if (m.role !== "assistant") return false;
    return Boolean(getTutorMessageVisibleText(m));
  });
  const previousAssistantIdRef = useRef(null);
  const liveBubbleSurfaceRef = useRef(null);
  const liveBubbleTextRef = useRef(null);
  const liveBubbleSnapshotRef = useRef(null);
  const chatLogButtonRef = useRef(null);
  const incomingRevealTimerRef = useRef(null);
  const chatLogHighlightTimerRef = useRef(null);
  const [archiveAnimation, setArchiveAnimation] = useState(null);
  const [isChatLogHighlighted, setIsChatLogHighlighted] = useState(false);
  const [hiddenIncomingMessageId, setHiddenIncomingMessageId] = useState(null);
  const chatLogButtonHighlightProps = getChatLogButtonHighlightProps(
    isChatLogHighlighted,
    isLightTheme,
  );
  const shouldMuteIncomingBubble =
    hiddenIncomingMessageId != null &&
    latestAssistantMessage?.id === hiddenIncomingMessageId;

  const captureLiveBubbleSnapshot = useCallback(() => {
    if (typeof window === "undefined") return;
    const surfaceNode = liveBubbleSurfaceRef.current;
    const textNode = liveBubbleTextRef.current;
    if (
      !(surfaceNode instanceof HTMLElement) ||
      !(textNode instanceof HTMLElement)
    )
      return;

    const surfaceRect = rectToSnapshot(surfaceNode.getBoundingClientRect());
    const textRect = rectToSnapshot(textNode.getBoundingClientRect());
    if (!surfaceRect?.width || !surfaceRect?.height) return;
    if (!textRect?.width || !textRect?.height) return;

    const styles = window.getComputedStyle(textNode);
    const fallbackLineHeight = parsePx(styles.fontSize, 16) * 1.6;
    liveBubbleSnapshotRef.current = {
      surfaceRect,
      textRect,
      font: buildCanvasFont(styles),
      lineHeight: parsePx(styles.lineHeight, fallbackLineHeight),
      color: styles.color || "#F7FAFC",
    };
  }, []);

  useLayoutEffect(() => {
    if (!latestAssistantMessage?.id) return;
    const nextId = latestAssistantMessage.id;
    const prevId = previousAssistantIdRef.current;
    previousAssistantIdRef.current = nextId;
    if (!prevId || prevId === nextId) return;

    const previousMessage = messages.find((m) => m.id === prevId);
    const snapshot = liveBubbleSnapshotRef.current;
    const targetNode = chatLogButtonRef.current;
    const outgoingText = getTutorMessageVisibleText(previousMessage);

    if (!previousMessage || !snapshot || !outgoingText) return;
    if (!(targetNode instanceof HTMLElement)) return;

    const targetRect = rectToSnapshot(targetNode.getBoundingClientRect());
    if (!targetRect?.width || !targetRect?.height) return;

    const { glyphs, height } = getArchiveGlyphs(
      outgoingText,
      snapshot.font,
      snapshot.textRect.width,
      snapshot.lineHeight,
    );
    if (!glyphs.length) return;

    const animationId = uid();
    setHiddenIncomingMessageId(nextId);
    if (incomingRevealTimerRef.current) {
      window.clearTimeout(incomingRevealTimerRef.current);
      incomingRevealTimerRef.current = null;
    }
    incomingRevealTimerRef.current = window.setTimeout(() => {
      setHiddenIncomingMessageId((current) =>
        current === nextId ? null : current,
      );
      incomingRevealTimerRef.current = null;
    }, ARCHIVE_INCOMING_HOLD_MS);
    setArchiveAnimation({
      id: animationId,
      fromRect: snapshot.textRect,
      targetRect,
      glyphs,
      height,
      font: snapshot.font,
      lineHeight: snapshot.lineHeight,
      color: snapshot.color,
    });

    const totalDuration =
      ARCHIVE_GLYPH_DURATION_MS +
      ARCHIVE_GLYPH_DURATION_VARIANCE_MS +
      ARCHIVE_GLYPH_STREAM_SPREAD_MS +
      ARCHIVE_GLYPH_STREAM_JITTER_MS +
      ARCHIVE_ANIMATION_BUFFER_MS;
    setIsChatLogHighlighted(true);
    if (chatLogHighlightTimerRef.current) {
      window.clearTimeout(chatLogHighlightTimerRef.current);
      chatLogHighlightTimerRef.current = null;
    }
    chatLogHighlightTimerRef.current = window.setTimeout(
      () => {
        setIsChatLogHighlighted(false);
        chatLogHighlightTimerRef.current = null;
      },
      Math.max(totalDuration, CHAT_LOG_HIGHLIGHT_DURATION_MS),
    );
    const timer = window.setTimeout(() => {
      setArchiveAnimation((current) =>
        current?.id === animationId ? null : current,
      );
    }, totalDuration);

    return () => window.clearTimeout(timer);
  }, [latestAssistantMessage?.id, messages]);

  useLayoutEffect(() => {
    captureLiveBubbleSnapshot();
  }, [
    captureLiveBubbleSnapshot,
    latestAssistantMessage?.id,
    latestAssistantMessage?.textFinal,
    latestAssistantMessage?.textStream,
    showTranslations,
    replayingId,
    translatingMessageId,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleViewportChange = () => captureLiveBubbleSnapshot();

    handleViewportChange();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, { passive: true });

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange);
    };
  }, [captureLiveBubbleSnapshot]);

  useEffect(
    () => () => {
      if (incomingRevealTimerRef.current) {
        window.clearTimeout(incomingRevealTimerRef.current);
      }
      if (chatLogHighlightTimerRef.current) {
        window.clearTimeout(chatLogHighlightTimerRef.current);
      }
    },
    [],
  );

  /* ---------------------------
     Replay playback helpers
  --------------------------- */
  function stopReplayAudio() {
    try {
      replayCleanupRef.current?.();
      replayCleanupRef.current = null;
      if (replayAudioRef.current) {
        replayAudioRef.current.pause();
        replayAudioRef.current.src = "";
        replayAudioRef.current = null;
      }
      if (replayAudioUrlRef.current) {
        URL.revokeObjectURL(replayAudioUrlRef.current);
        replayAudioUrlRef.current = "";
      }
    } catch {}
  }

  async function playSavedClip(mid) {
    if (replayingId === mid) {
      stopReplayAudio();
      setReplayingId(null);
      return;
    }
    stopReplayAudio();
    setReplayingId(mid);
    try {
      const cached = await idbGetClip(mid);
      if (cached?.blob) {
        const url = URL.createObjectURL(cached.blob);
        replayAudioUrlRef.current = url;
        const audio = new Audio(url);
        replayAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          replayAudioUrlRef.current = "";
          setReplayingId(null);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          replayAudioUrlRef.current = "";
          setReplayingId(null);
        };
        await audio.play();
        return;
      }

      const message = messagesRef.current.find((item) => item.id === mid);
      const text = getTutorMessageVisibleText(message);
      if (!text || message?.role !== "assistant") {
        setReplayingId(null);
        return;
      }

      const langCode =
        getBaseLanguageCode(message.lang || targetLangRef.current) ||
        getBaseLanguageCode(targetLangRef.current) ||
        "es";
      const player = await getTTSPlayer({
        text,
        voice: getPreferredTTSVoice(voiceRef.current),
        langTag: TTS_LANG_TAG[langCode] || TTS_LANG_TAG.es,
      });

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        player.cleanup?.();
        replayCleanupRef.current = null;
        if (replayAudioRef.current === player.audio) {
          replayAudioRef.current = null;
        }
        setReplayingId(null);
      };
      replayAudioRef.current = player.audio;
      replayCleanupRef.current = cleanup;
      player.audio.onended = cleanup;
      player.audio.onerror = cleanup;
      await player.ready;
      await player.audio.play();
      player.finalize?.finally(cleanup);
    } catch {
      setReplayingId(null);
    }
  }

  /* ---------------------------
     Recording helpers
  --------------------------- */
  function startRecordingForRid(rid, mid) {
    if (!captureOutRef.current || !audioGraphReadyRef.current) return;
    try {
      const stream = captureOutRef.current?.stream || captureOutRef.current;
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        if (!chunks.length) return;
        const blob = new Blob(chunks, { type: "audio/webm" });
        try {
          await idbPutClip(mid, blob, { rid });
          audioCacheIndexRef.current.add(mid);
          updateMessage(mid, (m) => ({ ...m, hasAudio: true }));
        } catch {}
      };
      recorder.start();
      recMapRef.current.set(rid, recorder);
      recChunksRef.current.set(rid, chunks);
    } catch {}
  }

  function getRMS() {
    const analyser = analyserRef.current;
    const buf = floatBufRef.current;
    if (!analyser || !buf) return 0;
    if (analyser.getFloatTimeDomainData) {
      analyser.getFloatTimeDomainData(buf);
    } else {
      const tmp = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(tmp);
      for (let i = 0; i < tmp.length; i++) buf[i] = (tmp[i] - 128) / 128;
    }
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / buf.length);
  }

  function stopRecorderAfterTail(
    rid,
    opts = { quietMs: 900, maxMs: 20000, armThresh: 0.006, minActiveMs: 900 },
  ) {
    if (recTailRef.current.has(rid)) return;
    const { quietMs, maxMs, armThresh, minActiveMs } = opts;
    const startedAt = Date.now();
    let armed = false;
    let firstVoiceAt = 0;
    let lastLoudAt = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const rms = getRMS();
      if (rms >= armThresh) {
        if (!armed) {
          armed = true;
          firstVoiceAt = now;
        }
        lastLoudAt = now;
      }
      const longEnoughSinceVoice = armed && now - firstVoiceAt >= minActiveMs;
      const quietLongEnough = armed && now - lastLoudAt >= quietMs;
      const timedOut = now - startedAt >= maxMs;
      if ((longEnoughSinceVoice && quietLongEnough) || timedOut) {
        clearInterval(id);
        recTailRef.current.delete(rid);
        const rec = recMapRef.current.get(rid);
        if (rec?.state === "recording") rec.stop();
        recMapRef.current.delete(rid);
        recChunksRef.current.delete(rid);
      }
    }, 100);
    recTailRef.current.set(rid, id);
  }

  /* ---------------------------
     Load user XP on mount
  --------------------------- */
  useEffect(() => {
    async function loadXp() {
      if (!currentNpub) return;
      try {
        await ensureUserDoc(currentNpub);
        const snap = await getDoc(doc(database, "users", currentNpub));
        if (snap.exists()) {
          const data = snap.data() || {};
          const languageXp = getLanguageXp(data?.progress || {}, targetLang);
          if (Number.isFinite(languageXp)) setXp(languageXp);
          if (data.progress?.tutorVoice || data.progress?.voice) {
            setVoice(
              normalizeGeminiLiveVoice(
                data.progress.tutorVoice || data.progress.voice,
              ),
            );
          }
          if (data.progress?.tutorVoicePersona || data.progress?.voicePersona) {
            setVoicePersona(
              data.progress.tutorVoicePersona || data.progress.voicePersona,
            );
          }
          if (typeof data.progress?.showTranslations === "boolean") {
            setShowTranslations(data.progress.showTranslations);
          }
          // Load conversation settings
          setConversationSettings((prev) => {
            const savedSubjects =
              typeof data.progress?.conversationSubjects === "string"
                ? data.progress.conversationSubjects
                : prev.conversationSubjects;
            return {
              proficiencyLevel:
                data.progress?.conversationProficiencyLevel ||
                maxProficiencyLevel ||
                prev.proficiencyLevel,
              practicePronunciation:
                data.progress?.practicePronunciation ??
                prev.practicePronunciation,
              conversationSubjects: savedSubjects,
            };
          });
        }
      } catch {}
    }
    loadXp();
  }, [currentNpub, targetLang, maxProficiencyLevel]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      stop();
    },
    [],
  );
  useEffect(
    () => () => {
      stopReplayAudio();
    },
    [],
  );

  // Scroll to top on mount
  useEffect(() => {
    if (!isActive) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [isActive]);

  /* ---------------------------
     Stream flushing
  --------------------------- */
  function scheduleStreamFlush() {
    if (streamFlushScheduled.current) return;
    streamFlushScheduled.current = true;
    requestAnimationFrame(() => {
      streamFlushScheduled.current = false;
      flushStreamBuffers();
    });
  }

  function flushStreamBuffers() {
    for (const [mid, buf] of streamBuffersRef.current.entries()) {
      if (!buf) continue;
      streamBuffersRef.current.set(mid, "");
      updateMessage(mid, (m) => ({
        ...m,
        textStream: sanitizeTutorAssistantText((m.textStream || "") + buf, {
          trim: false,
        }),
      }));
    }
  }

  /* ---------------------------
     WebRTC Start
  --------------------------- */
  async function start() {
    playSound(submitActionSound);
    clearAutoStopTimer();
    clearTutorKickoffTimer();
    tutorKickoffSentRef.current = hasStartedTutorLessonConversation();
    tutorKickoffRetryCountRef.current = 0;
    tutorWelcomePendingReplyRef.current = false;
    tutorWelcomeRidSetRef.current.clear();
    setErr("");
    setStatus("connecting");
    setUiState("idle");
    setMood("thoughtful");
    try {
      await ensureSelectedTutorLessonStarted();
      assistantInputLockedRef.current = false;
      // Hint BOTH the learner's target language and their support (UI) language to
      // Gemini's input transcription. Native-audio transcription only takes hints,
      // not a hard lock, so it can still drift to a phonetically close language — the
      // bug where English spoken during a French lesson got logged in Devanagari.
      // Passing both candidates keeps the transcript on whichever language the learner
      // is actually using: the target phrase they practice, or a question in support.
      const targetBaseForHint = normalizePracticeLanguage(
        targetLangRef.current || targetLang,
      );
      const supportBaseForHint = normalizeSupportLanguage(
        supportLangRef.current || supportLang,
      );
      // Target first (the phrase being practiced), support second (questions /
      // teacher-talk). Dedupe so a learner whose target == support sends one code,
      // and drop any base code missing from LANGUAGE_LOCALES.
      const inputLanguageCodes = [
        LANGUAGE_LOCALES[targetBaseForHint],
        LANGUAGE_LOCALES[supportBaseForHint],
      ].filter((locale, index, all) => locale && all.indexOf(locale) === index);
      // TEMP debug (remove after verifying the input-language hint): confirms this
      // code path runs and what locales it resolved for target + support.
      console.info(
        "[gemini-live] connecting Tutor — targetLang:",
        targetBaseForHint,
        "supportLang:",
        supportBaseForHint,
        "→ inputLanguageCodes:",
        inputLanguageCodes,
      );
      const bridge = await createGeminiLiveRealtimeBridge({
        audioElement: audioRef.current,
        initialInstructions: buildLanguageInstructions(),
        voice: normalizeGeminiLiveVoice(voiceRef.current),
        inputLanguageCodes: inputLanguageCodes.length ? inputLanguageCodes : null,
        tools: TUTOR_TOOL_GRADING_ENABLED ? [TUTOR_LIVE_TOOLS] : undefined,
        onEvent: handleRealtimeEvent,
        onError: (message) => setErr((prev) => prev || message),
        onAudioGraph: ({ audioContext, analyser, floatBuffer, stream }) => {
          audioCtxRef.current = audioContext;
          analyserRef.current = analyser;
          floatBufRef.current = floatBuffer;
          captureOutRef.current = stream;
          audioGraphReadyRef.current = true;
        },
      });
      dcRef.current = bridge;
      pcRef.current = bridge;
      localRef.current = bridge.mediaStream;
      // Apply the user's saved Tutor volume (gain multiplier, 0-4) to this session.
      bridge.setOutputGain?.(useSoundSettings.getState().tutorVolume);
      setLocalMicEnabled(true);

      setStatus("connected");
      aliveRef.current = true;
      tutorSessionReadyRef.current = true;
      setUiState("idle");
      applyLanguagePolicyNow();
      scheduleAutoStop();
    } catch (e) {
      clearAutoStopTimer();
      clearTutorKickoffTimer();
      tutorSessionReadyRef.current = false;
      setStatus("disconnected");
      setUiState("idle");
      setErr(e?.message || String(e));
    }
  }

  async function stop() {
    clearAutoStopTimer();
    clearTutorKickoffTimer();
    clearAssistantUnlockTimer();
    aliveRef.current = false;
    tutorKickoffSentRef.current = false;
    tutorWelcomePendingReplyRef.current = false;
    tutorWelcomeRidSetRef.current.clear();
    tutorSessionReadyRef.current = false;
    assistantInputLockedRef.current = false;
    assistantSpeakingRef.current = false;
    pendingUserAudioCommitRef.current = false;
    setLocalMicEnabled(true);
    try {
      if (dcRef.current?.readyState === "open") {
        dcRef.current.send(
          JSON.stringify({ type: "input_audio_buffer.clear" }),
        );
        dcRef.current.send(
          JSON.stringify({
            type: "session.update",
            session: { turn_detection: null },
          }),
        );
      }
    } catch {}
    try {
      const a = audioRef.current;
      if (a) {
        try {
          a.pause();
        } catch {}
        const s = a.srcObject;
        if (s) {
          try {
            s.getTracks().forEach((t) => t.stop());
          } catch {}
        }
        a.srcObject = null;
        try {
          a.load?.();
        } catch {}
      }
    } catch {}

    try {
      localRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    localRef.current = null;

    try {
      pcRef.current?.getSenders?.().forEach((s) => s.track && s.track.stop());
      pcRef.current?.getReceivers?.().forEach((r) => r.track && r.track.stop());
    } catch {}

    try {
      dcRef.current?.close();
    } catch {}
    dcRef.current = null;
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    try {
      audioCtxRef.current?.close?.();
    } catch {}
    audioCtxRef.current = null;
    analyserRef.current = null;
    floatBufRef.current = null;
    captureOutRef.current = null;
    audioGraphReadyRef.current = false;

    try {
      for (const rec of recMapRef.current.values())
        if (rec?.state === "recording") rec.stop();
    } catch {}
    recMapRef.current.clear();
    recChunksRef.current.clear();
    for (const id of recTailRef.current.values()) clearInterval(id);
    recTailRef.current.clear();
    replayRidSetRef.current.clear();
    ignoredRidSetRef.current.clear();
    tutorClosingActCheckedKeysRef.current.clear();
    tutorClosingActRecoveryTurnRef.current = null;
    tutorClosingActRecoveryInFlightRef.current = false;
    guardrailItemIdsRef.current = [];
    pendingGuardrailTextRef.current = "";

    stopReplayAudio();
    setReplayingId(null);

    clearAllDebouncers();
    respToMsg.current.clear();
    isIdleRef.current = true;
    idleWaitersRef.current.splice(0).forEach((fn) => {
      try {
        fn();
      } catch {}
    });

    setStatus("disconnected");
    setUiState("idle");
    setMood("neutral");
  }

  /* ---------------------------
     Language instructions with proficiency level
  --------------------------- */
  function buildLanguageInstructions() {
    const persona = String((voicePersonaRef.current ?? "").slice(0, 240));
    const tLang = targetLangRef.current;
    const currentSettings = conversationSettingsRef.current;
    const tutorLessonDetails = buildTutorLessonContext(
      selectedTutorLessonRef.current,
      selectedTutorUnitRef.current,
      resolvedSupportLang,
      tLang,
    );
    const selectedLevel =
      tutorLessonDetails?.level ||
      currentSettings.proficiencyLevel ||
      maxProficiencyLevel ||
      "A1";
    const customSubjects = currentSettings.conversationSubjects || "";
    const supportCode = normalizeSupportLanguage(
      supportLangRef.current || resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const targetLanguageName =
      getLanguagePromptName(tLang) || "the target language";
    const supportLanguageName =
      getLanguagePromptName(supportCode) || "the user's support language";
    const codeSwitchingAudioInstruction =
      buildTutorCodeSwitchingAudioInstruction(
        targetLanguageName,
        supportLanguageName,
      );
    const targetLanguageBoundaryInstruction =
      buildTutorTargetLanguageBoundaryInstruction({
        targetLang: tLang,
        supportLang: supportCode,
        targetLanguageName,
        supportLanguageName,
      });
    const isEarlyTutorLevel = isTutorEarlyLevel(selectedLevel);
    const isAdvancedTutorLevel =
      isTutorAdvancedConversationLevel(selectedLevel);
    const teacherTalkLanguageInstruction =
      buildTutorTeacherTalkLanguageInstruction({
        targetLang: tLang,
        supportLang: supportCode,
        targetLanguageName,
        supportLanguageName,
        isEarlyTutorLevel,
      });
    const starterAgendaLesson = isTutorStarterAgendaLesson(
      selectedTutorLessonRef.current,
    );

    const strict = (() => {
      if (supportCode === tLang) {
        return `LOCALIZED TUTOR MODE: The support language and target language are both ${targetLanguageName}. Teach in level-appropriate ${targetLanguageName}.`;
      }
      if (isEarlyTutorLevel) {
        return `BEGINNER BILINGUAL MODE: Use ${supportLanguageName} for ALL teacher talk: narration, explanations, encouragement, corrections, transitions, and questions. Use ${targetLanguageName} only for exact model phrases, examples, and the learner's practice text.`;
      }
      if (isAdvancedTutorLevel) {
        return `ADVANCED IMMERSION MODE: Conduct the tutoring session almost entirely in ${targetLanguageName}. Use ${supportLanguageName} only if the learner explicitly asks for clarification or is clearly stuck.`;
      }
      return `TARGET-LANGUAGE-FIRST MODE: Give instructions primarily in simple ${targetLanguageName}. Use ${supportLanguageName} only as a short rescue clarification, not as the default teaching language.`;
    })();

    // Proficiency level guidance
    const levelGuidance = {
      "Pre-A1": `CRITICAL: User is at foundations level (Pre-A1). Treat them as an adult beginner. Teach one tiny step at a time. Use ONLY the most basic ${targetLanguageName} words, such as greetings, goodbye, yes/no, thank you, numbers 1-10, and basic colors. Model 1-3 word ${targetLanguageName} phrases, then ask the learner to try or complete them once.`,
      A1: `CRITICAL: User is a complete beginner (A1). Treat them as an adult beginner. Use ONLY very simple ${targetLanguageName} vocabulary, such as greetings, numbers, colors, and family. Model short 3-5 word ${targetLanguageName} phrases in present tense, then guide the learner to produce one phrase.`,
      A2: `CRITICAL: User is elementary level (A2). Use simple everyday ${targetLanguageName} vocabulary, such as food, shopping, and directions. Use 5-8 word sentences. Use present, past, and simple future tenses only. Avoid complex grammar.`,
      B1: "CRITICAL: User is intermediate (B1). Use conversational vocabulary about familiar topics (work, travel, hobbies). Can use 8-12 word sentences. Use various tenses but keep grammar structures moderate. Can express opinions simply.",
      B2: "CRITICAL: User is upper intermediate (B2). Use more complex vocabulary and abstract concepts. Can use longer sentences with subordinate clauses. Can use subjunctive mood occasionally. Can discuss hypotheticals.",
      C1: "CRITICAL: User is advanced (C1). Use sophisticated vocabulary and nuanced expressions. Use complex sentence structures with multiple clauses. Use idiomatic expressions. Can handle abstract and specialized topics.",
      C2: "CRITICAL: User is near-native (C2). Use native-like expressions, colloquialisms, and subtle distinctions. Can use any grammatical structure. Can handle any topic with precision and style.",
    };

    const proficiencyHint = levelGuidance[selectedLevel] || levelGuidance.A1;
    const tutorPedagogyInstructions = isEarlyTutorLevel
      ? [
          "TUTORING STYLE: Be an active tutor, not a passive chat partner.",
          `For each reply, use this rhythm: brief ${supportLanguageName} guidance, one exact ${targetLanguageName} model phrase, then ask the learner to try, choose, or complete that phrase once.`,
          `Before asking the learner to say a ${targetLanguageName} phrase, briefly tell them what it means in ${supportLanguageName}.`,
          "When the learner answers, accept it only when it matches the requested target-language phrase or clearly expresses the requested meaning. If the words are unrelated or clearly wrong, correct briefly and keep the learner on that same tiny step.",
          "Do not repeat a phrase after it has been accepted. If the learner misses the phrase, keep the same agenda item but make the prompt simpler. Avoid bare two-word acknowledgements that do not teach the next step.",
          `Use fill-in-the-blank prompts, brief repetition, and simple choices. The surrounding instruction must be in ${supportLanguageName}; only the model phrase itself is in ${targetLanguageName}.`,
          "Allow support-language questions and answer them briefly, then guide the learner back to producing the target-language phrase.",
        ].join(" ")
      : selectedLevel === "A2" || selectedLevel === "B1"
        ? [
            "TUTORING STYLE: Coach through short target-language exchanges.",
            `Use mostly ${targetLanguageName} for instructions and prompts. Keep sentences simple enough for ${selectedLevel}.`,
            `Use ${supportLanguageName} only for a very short clarification after confusion, then return to ${targetLanguageName}.`,
            "Ask one focused follow-up question and give a short model answer when the learner hesitates.",
          ].join(" ")
        : [
            "TUTORING STYLE: Use conversational immersion, not beginner drills.",
            `Keep the dialogue in ${targetLanguageName} and make it feel like a natural conversation tied to the selected lesson agenda.`,
            "Ask open-ended follow-ups, respond to the learner's ideas, and weave corrections into the conversation.",
            "Only pause for explicit teaching or support-language clarification when the learner asks or is clearly stuck.",
          ].join(" ");
    // Tutor speech is the dominant Gemini Live cost, so these length limits are
    // cost guardrails as much as UX tuning.
    const replyLengthInstruction = isEarlyTutorLevel
      ? "Keep replies short but instructional: 1-2 compact sentences, usually under 28 words and under 12 seconds spoken."
      : isAdvancedTutorLevel
        ? "Keep replies natural and conversational: usually 1-3 concise sentences, with one clear follow-up question, under 16 seconds spoken."
        : "Keep replies brief and target-language-first: 1-2 short sentences, under 12 seconds spoken.";
    const speechAcceptanceInstructions = isEarlyTutorLevel
      ? [
          "SPEECH ACCEPTANCE RULE: Sound quality is not the gate for progress.",
          "If the learner makes an understandable attempt at the requested target phrase, count it as successful even if accents, audio, or transcription are imperfect.",
          "Do not count unrelated words, random phrases, support-language filler, or a different target phrase as successful.",
          "Do not grade how the learner sounds. Do not drill the same phrase repeatedly. Do not split syllables unless the learner explicitly asks for sound coaching.",
          "For normal Tutor flow, treat speech transcription as approximate, but the transcript must still represent the requested phrase or meaning before you advance.",
          "If your previous assistant message already asked the learner to say the same phrase and they did not match it, stay on that agenda item but switch to a simpler prompt or choice.",
          "If an attempt is not the requested phrase or meaning, do not say it was correct; give a short correction and ask for the same model phrase again.",
        ].join(" ")
      : "SPEECH ACCEPTANCE RULE: Do not grade how the learner sounds or over-drill. If the learner expresses the requested meaning, keep the conversation moving; if the answer is unrelated or clearly wrong, correct it.";

    // Custom subjects context
    const customSubjectsContext = customSubjects
      ? `CUSTOM CONTEXT: The user wants to practice conversations related to: "${customSubjects}". Try to incorporate relevant vocabulary and scenarios from this context when appropriate.`
      : "";
    const tutorLessonContext = tutorLessonDetails?.promptText
      ? `LESSON AGENDA: The user selected this Tutor lesson.\n${tutorLessonDetails.promptText}\nUse this agenda to decide what to teach and practice throughout the session. Keep the lesson plan aligned with this agenda.`
      : "";
    const starterAgendaContext = starterAgendaLesson
      ? [
          "STARTER INTRODUCTIONS LESSON: This first Tutor lesson has a fixed agenda.",
          `Required agenda in ${targetLanguageName}: ${getTutorStarterAgendaPromptText(tLang)}.`,
          "Teach and practice the items one at a time: hello, my name is, good morning, good afternoon, good night, and how are you.",
          `Before each practice attempt, tell the learner the phrase meaning in ${supportLanguageName}.`,
          "For 'my name is', model a safe example with a fictional name or invite the learner to use any name; do not require personal details.",
          "Only the app-tracked acceptance state completes an agenda item. Do not advance when the learner says unrelated words, filler, or a different target phrase.",
          "After all agenda items have been practiced, keep combining or reviewing the covered concepts until the app itself transitions away.",
          "Never make closing remarks or tell the learner they are finished; the app owns that transition.",
          buildTutorStarterProgressInstructions(),
        ].join(" ")
      : "";
    const feedbackText = String(inlineFeedbackRef.current || "").trim();
    const feedbackContext = feedbackText
      ? `LATEST TUTOR FEEDBACK: ${feedbackText}. Use this to adjust the next micro-step without repeating the feedback verbatim.`
      : "";
    const requiredXp = getTutorLessonXpRequired(selectedTutorLessonRef.current);
    const earnedXp = Math.max(0, Number(tutorLessonEarnedXpRef.current) || 0);
    const lessonStillInProgress =
      requiredXp > 0 &&
      earnedXp < requiredXp &&
      !tutorLessonCompletionTriggeredRef.current;
    const completionControlInstruction = lessonStillInProgress
      ? [
          `INTERNAL ONLY: current lesson practice progress is ${earnedXp}/${requiredXp}; the app has not completed this lesson.`,
          "Do not perform a closing act in any language or wording.",
          "A closing act includes any farewell, completion announcement, end-of-session summary, offer to stop, or suggestion that the lesson is over.",
          "The app will automatically close the conversation and show the lesson-complete modal when the threshold is reached.",
          "Until then, keep reviewing, combining, or practicing only the selected lesson concepts.",
        ].join(" ")
      : "";
    const interactionVarietyInstruction = [
      "Avoid repetitive prompt endings. Do not repeatedly end with 'can you say that' or 'can you try that'.",
      "Vary the learner task: fill a blank, choose between options, answer a small meaning question, transform a phrase, respond to a tiny scenario, or use the model phrase in context.",
      "Use direct, natural prompts and do not reuse the same request wording twice in a row.",
      getTutorTaskVariationInstruction(turnCountRef.current),
    ].join(" ");
    const signatureExperienceInstruction =
      getTutorSignatureExperienceInstruction({
        selectedLevel,
        turnCount: turnCountRef.current,
        isStarterLesson: starterAgendaLesson,
      });

    return [
      "Act as a warm, practical language tutor leading a focused tutoring session.",
      strict,
      targetLanguageBoundaryInstruction,
      teacherTalkLanguageInstruction,
      codeSwitchingAudioInstruction,
      proficiencyHint,
      customSubjectsContext,
      tutorLessonContext,
      starterAgendaContext,
      feedbackContext,
      completionControlInstruction,
      TUTOR_TOOL_GRADING_ENABLED
        ? `GRADING — call the markTurnSuccessful tool based on the learner's turn: (1) If they correctly produce the requested ${targetLanguageName} phrase or complete the task, call markTurnSuccessful(correct:true), praise briefly, and move to the next agenda item. (2) If they make a mistake, do NOT call it — briefly correct them and have them try again, then call markTurnSuccessful(correct:true) only once they get it right. (3) If they ask for help, a breakdown, the meaning, a repetition, or any question, do NOT call it — help them with the current phrase, then invite them to try; help never earns progress. Call markTurnSuccessful at most once per correct completion, and never for a greeting or "yes"/"ready".`
        : "",
      TUTOR_TOOL_GRADING_ENABLED
        ? `LESSON FLOW — the app, not you, owns lesson completion. Work through the agenda one item at a time. Once every item has been practiced but the lesson is not yet complete, keep REVIEWING — re-practice items and combine them, calling markTurnSuccessful(correct:true) for each correct review — and do not stop or wind down. Never end, summarize, or say goodbye on your own; when you think the lesson is complete, call proposeLessonComplete and follow its decision (if not approved, keep teaching/reviewing).`
        : "",
      "IMPORTANT: Match your language complexity to the learner's proficiency level. Do not use vocabulary or grammar above their level.",
      tutorPedagogyInstructions,
      speechAcceptanceInstructions,
      interactionVarietyInstruction,
      signatureExperienceInstruction,
      replyLengthInstruction,
      `PERSONA: ${persona}. Stay consistent with that tone/style.`,
      "Be encouraging and help the learner practice speaking naturally.",
      isEarlyTutorLevel
        ? "Ask one tiny practice prompt at a time. Keep the learner producing target-language words, not just listening."
        : isAdvancedTutorLevel
          ? "Keep the conversation flowing in the target language; avoid phrase-drill mode unless teaching a specific expression."
          : "Ask focused target-language follow-up questions to keep the learner producing full thoughts.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function buildTutorKickoffInstructions() {
    const tLang = targetLangRef.current || targetLang || "es";
    const targetLanguageName =
      getLanguagePromptName(tLang) || "the target language";
    const supportCode = normalizeSupportLanguage(
      supportLangRef.current || resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const supportLanguageName =
      getLanguagePromptName(supportCode) || "the user's support language";
    const codeSwitchingAudioInstruction =
      buildTutorCodeSwitchingAudioInstruction(
        targetLanguageName,
        supportLanguageName,
      );
    const targetLanguageBoundaryInstruction =
      buildTutorTargetLanguageBoundaryInstruction({
        targetLang: tLang,
        supportLang: supportCode,
        targetLanguageName,
        supportLanguageName,
      });
    const lesson = selectedTutorLessonRef.current;
    const unit = selectedTutorUnitRef.current;
    const selectedLevel =
      unit?.cefrLevel ||
      unit?.level ||
      conversationSettingsRef.current.proficiencyLevel ||
      maxProficiencyLevel ||
      "A1";
    const isEarlyTutorLevel = isTutorEarlyLevel(selectedLevel);
    const isAdvancedTutorLevel =
      isTutorAdvancedConversationLevel(selectedLevel);
    const teacherTalkLanguageInstruction =
      buildTutorTeacherTalkLanguageInstruction({
        targetLang: tLang,
        supportLang: supportCode,
        targetLanguageName,
        supportLanguageName,
        isEarlyTutorLevel,
      });
    const agendaTitle = getTutorLessonAgendaTitle(lesson, unit, supportCode);
    const agendaSubtitle = getTutorLessonAgendaSubtitle(
      lesson,
      unit,
      supportCode,
    );
    const requiredXp = getTutorLessonXpRequired(lesson);
    const earnedXp = Math.max(0, Number(tutorLessonEarnedXpRef.current) || 0);
    const lessonStillInProgress =
      requiredXp > 0 &&
      earnedXp < requiredXp &&
      !tutorLessonCompletionTriggeredRef.current;
    const noWrapInstruction = lessonStillInProgress
      ? "LESSON_STATE: IN_PROGRESS. Do not perform a closing act in any language or wording. The app will close the conversation and show the lesson-complete modal when the threshold is reached."
      : "";
    const varietyInstruction = [
      "Do not end with a generic repeated request.",
      "Use a natural varied prompt, such as a tiny question, choice, blank, transformation, or scenario tied to the lesson.",
      getTutorTaskVariationInstruction(turnCountRef.current),
    ].join(" ");
    const signatureExperienceInstruction =
      getTutorSignatureExperienceInstruction({
        selectedLevel,
        turnCount: turnCountRef.current,
        isKickoff: true,
        isStarterLesson: isTutorStarterAgendaLesson(lesson),
      });

    if (isTutorStarterAgendaLesson(lesson)) {
      const nextItem = getNextTutorStarterAgendaItem(
        tutorStarterAgendaProgressRef.current,
      );
      return buildTutorAgendaResponseInstructions({
        item: nextItem,
        isKickoff: true,
        supportLang: supportCode,
        targetLang: tLang,
        kind: "tutor_kickoff",
      });
    }

    return [
      "Kick off the Tutor lesson now. Do not wait for the learner to speak first.",
      targetLanguageBoundaryInstruction,
      teacherTalkLanguageInstruction,
      codeSwitchingAudioInstruction,
      noWrapInstruction,
      varietyInstruction,
      signatureExperienceInstruction,
      `Use the selected lesson agenda: ${agendaTitle}${
        agendaSubtitle ? ` - ${agendaSubtitle}` : ""
      }. Treat this as the lesson topic/concept, not permission to practice non-${targetLanguageName} phrases.`,
      isEarlyTutorLevel
        ? `Briefly orient the learner in ${supportLanguageName}, model one useful ${targetLanguageName} phrase, then ask for one tiny practice attempt.`
        : isAdvancedTutorLevel
          ? `Start in ${targetLanguageName} with a natural conversational opener about the agenda, then ask one open-ended question.`
          : `Start in simple ${targetLanguageName}, give one short model or prompt, then ask a focused question the learner can answer in ${targetLanguageName}.`,
      supportCode !== tLang && !isEarlyTutorLevel
        ? `Do not default to ${supportLanguageName}; use it only for a quick clarification if needed.`
        : "",
      isEarlyTutorLevel
        ? "Move forward only after the learner gives the requested phrase or the app-tracked agenda accepts the attempt."
        : "Use the lesson agenda as the guide, but let the learner's answers shape the next conversational follow-up.",
      isAdvancedTutorLevel
        ? "Keep the opening concise, adult, and conversational."
        : "Keep the opening concise and tutor-like.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function buildTutorWelcomeInstructions() {
    const tLang = targetLangRef.current || targetLang || "es";
    const targetLanguageName =
      getLanguagePromptName(tLang) || "the target language";
    const supportCode = normalizeSupportLanguage(
      supportLangRef.current || resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const supportLanguageName =
      getLanguagePromptName(supportCode) || "the user's support language";

    return [
      "This is the very first message of the tutorial lesson. Give ONLY a short, warm welcome.",
      `Speak entirely in ${supportLanguageName}. Do not use any ${targetLanguageName} yet.`,
      "Greet the learner, welcome them to their first lesson, and introduce yourself as their realtime tutor who will guide them along the way.",
      `In ${supportLanguageName}, convey something along the lines of: "Hello! Welcome to your first lesson. I'm your realtime tutor and I'll guide you along the way." Adapt it naturally into ${supportLanguageName} — do not copy the English wording — then invite them to say hello or to let you know when they are ready to begin.`,
      "Do NOT teach, model, translate, or ask the learner to repeat any words yet. Do NOT introduce any lesson phrase, vocabulary, or practice task.",
      "Do NOT mention XP, scoring, levels, or progress.",
      "Keep it warm and brief: about 2-3 short sentences.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function getTutorAgendaItemLabel(item, lang = "en") {
    const normalized = normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE);
    return item?.label?.[normalized] || item?.label?.en || item?.id || "";
  }

  function buildTutorAgendaResponseInstructions({
    item,
    isKickoff = false,
    supportLang = "en",
    targetLang = "es",
    userMessage = "",
    acceptedItemIds = [],
    kind = "tutor_followup",
  } = {}) {
    const supportCode = normalizeSupportLanguage(
      supportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const supportLanguageName =
      getLanguagePromptName(supportCode) || "the user's support language";
    const targetLanguageName =
      getLanguagePromptName(targetLang) || "the target language";
    const codeSwitchingAudioInstruction =
      buildTutorCodeSwitchingAudioInstruction(
        targetLanguageName,
        supportLanguageName,
      );
    const targetLanguageBoundaryInstruction =
      buildTutorTargetLanguageBoundaryInstruction({
        targetLang,
        supportLang: supportCode,
        targetLanguageName,
        supportLanguageName,
      });
    const teacherTalkLanguageInstruction =
      buildTutorTeacherTalkLanguageInstruction({
        targetLang,
        supportLang: supportCode,
        targetLanguageName,
        supportLanguageName,
        isEarlyTutorLevel: true,
      });
    const phrase = item ? getTutorStarterItemModelPhrase(item, targetLang) : "";
    const task = item ? getTutorStarterItemSupportTask(item, supportCode) : "";
    const meaning = item
      ? getTutorStarterItemSupportMeaning(item, supportCode)
      : "";
    const progress = tutorStarterAgendaProgressRef.current || {};
    const lesson = selectedTutorLessonRef.current;
    const requiredXp = getTutorLessonXpRequired(lesson);
    const earnedXp = Math.max(0, tutorLessonEarnedXpRef.current || 0);
    const remainingXp = Math.max(0, requiredXp - earnedXp);
    const completedItems = TUTOR_STARTER_AGENDA_ITEMS.filter(
      (agendaItem) => progress[agendaItem.id],
    )
      .map((agendaItem) =>
        getTutorStarterItemSupportMeaning(agendaItem, supportCode),
      )
      .join(", ");
    const acceptedItems = TUTOR_STARTER_AGENDA_ITEMS.filter((agendaItem) =>
      acceptedItemIds.includes(agendaItem.id),
    )
      .map((agendaItem) =>
        getTutorStarterItemSupportMeaning(agendaItem, supportCode),
      )
      .join(", ");
    const reviewPhrases = TUTOR_STARTER_AGENDA_ITEMS.map((agendaItem) =>
      getTutorStarterItemModelPhrase(agendaItem, targetLang),
    )
      .filter(Boolean)
      .join(", ");
    const latestTranscript = String(userMessage || "").trim();
    const currentPhrase = phrase || "";
    const latestTurnWasAccepted = acceptedItemIds.length > 0;
    const completedPhrases = TUTOR_STARTER_AGENDA_ITEMS.filter(
      (agendaItem) => progress[agendaItem.id] && agendaItem.id !== item?.id,
    )
      .map((agendaItem) =>
        getTutorStarterItemModelPhrase(agendaItem, targetLang),
      )
      .filter(Boolean)
      .join(", ");
    const recentOnScreenContext = buildRecentOnScreenContextInstruction();
    const unit = selectedTutorUnitRef.current;
    const selectedLevel =
      unit?.cefrLevel ||
      unit?.level ||
      conversationSettingsRef.current.proficiencyLevel ||
      maxProficiencyLevel ||
      "Pre-A1";
    const signatureExperienceInstruction =
      getTutorSignatureExperienceInstruction({
        selectedLevel,
        turnCount: turnCountRef.current,
        isKickoff,
        isStarterLesson: true,
      });

    if (!item) {
      return [
        "You are the realtime voice tutor for this Tutor lesson.",
        targetLanguageBoundaryInstruction,
        teacherTalkLanguageInstruction,
        codeSwitchingAudioInstruction,
        recentOnScreenContext,
        signatureExperienceInstruction,
        "All required agenda items have been introduced, but the lesson is NOT complete until the app transitions. Keep practicing by reviewing or combining only the concepts already covered.",
        `Use ${supportLanguageName} for brief guidance and ${targetLanguageName} for model phrases.`,
        supportCode === targetLang
          ? ""
          : `Do not answer entirely in ${targetLanguageName}; keep teacher talk in ${supportLanguageName}.`,
        `Covered concepts: ${completedItems || getTutorStarterAgendaSummary(supportCode)}.`,
        `Allowed model phrases: ${reviewPhrases}.`,
        `App-tracked lesson XP after the latest accepted turn: ${earnedXp}/${requiredXp}.`,
        `Internal only, do not say this to the learner: ${remainingXp} XP of review practice remains before the app auto-advances.`,
        remainingXp > 0
          ? "REVIEW LOOP ACTIVE: acknowledge the learner briefly, then ask one natural review/combo practice task using only the covered concepts. There is no fixed number of review turns; continue this loop until the app itself ends the session."
          : "If this instruction is reached after the app has enough XP, do not make a closing announcement; ask one tiny practice prompt and let the app handle the transition.",
        remainingXp > 0
          ? `CRITICAL: ${remainingXp} XP is still required. Do not perform a closing act in any language or wording. Ask the next review task instead.`
          : "",
        latestTranscript
          ? `Latest learner transcript: "${latestTranscript}".`
          : "",
        "Do not mention XP, internal progress, or any end-of-session state.",
        "Ask for one small review task or one simple combination of learned concepts in natural tutor language.",
        "Do not introduce new subjects, advanced vocabulary, or open-ended free conversation.",
        "Do not mention pronunciation, accents, or sound quality. Do not ask the learner to repeat for pronunciation.",
        "Keep it natural and concise: 1 short sentence, or 2 very short sentences only when needed.",
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      "You are the realtime voice tutor for this Tutor lesson.",
      targetLanguageBoundaryInstruction,
      teacherTalkLanguageInstruction,
      codeSwitchingAudioInstruction,
      recentOnScreenContext,
      signatureExperienceInstruction,
      "The app controls the agenda. Your job is to tutor the current agenda item naturally.",
      `Use ${supportLanguageName} for brief guidance and ${targetLanguageName} for the phrase the learner should try.`,
      supportCode === targetLang
        ? ""
        : `Do not answer entirely in ${targetLanguageName}; keep teacher talk in ${supportLanguageName}.`,
      `Current agenda item: ${item.id}.`,
      `Current subject: ${task}.`,
      `Model phrase: "${phrase}".`,
      meaning ? `Meaning in ${supportLanguageName}: "${meaning}".` : "",
      meaning
        ? `Before asking the learner to say "${phrase}", briefly explain that it means "${meaning}" in ${supportLanguageName}.`
        : "",
      currentPhrase
        ? `When you model "${currentPhrase}", pronounce it correctly as ${targetLanguageName}.`
        : "",
      completedItems
        ? `Internal progress only, do not say this to the learner: completed items so far are ${completedItems}.`
        : "",
      completedPhrases
        ? `Do not prompt these completed phrases again: ${completedPhrases}.`
        : "",
      acceptedItems
        ? `The app accepted the learner's last attempt for: ${acceptedItems}. Briefly praise it in ${supportLanguageName}, then move to the current agenda item. Do not mention internal completion state to the learner.`
        : "",
      latestTranscript && !latestTurnWasAccepted && !isKickoff
        ? `The learner has not produced the phrase correctly yet, so do not say "nice work"/"great" or imply they got it right. FIRST fully respond to what they actually said: if they asked for help, a breakdown, the meaning, a repetition, or any question, give exactly that — about the SAME phrase you just asked them to try — in ${supportLanguageName} (e.g. break it into syllables). Then invite them to try that SAME phrase again. Stay on that phrase: do NOT switch to a different phrase, say you've "moved on", or change the agenda item, even if they ask for help several times — keep helping until they produce it.`
        : "",
      latestTranscript
        ? `Latest learner transcript: "${latestTranscript}".`
        : "",
      isKickoff
        ? "Start the lesson and introduce only this first agenda item."
        : latestTurnWasAccepted
          ? "Briefly acknowledge the accepted attempt, then introduce only the current agenda item. Do not apologize and do not mention internal completion state."
          : "First fully address what the learner asked or said, then keep practicing the SAME phrase you just asked them to try — do not move to a different phrase or agenda item until they produce it correctly.",
      currentPhrase && (isKickoff || latestTurnWasAccepted)
        ? `Your next practice prompt MUST be for the current model phrase: "${currentPhrase}".`
        : "",
      "Never ask the learner to repeat a completed agenda item, and never announce internal agenda state to the learner.",
      "Never say 'remember' followed by a completed phrase as the main practice prompt.",
      "Only app-accepted turns are progress. Do not treat unrelated words, random phrases, or a different target phrase as progress.",
      "Do not ask the learner to repeat for pronunciation, do not split syllables, and do not rate accent.",
      "Do not drift into topics beyond the current agenda item.",
      "Keep it natural and concise: 1 short sentence, or 2 very short sentences only when needed.",
      `Response kind: ${kind}.`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function requestRealtimeTutorAgendaResponse({
    item,
    kind,
    isKickoff = false,
    supportLang = "en",
    targetLang = "es",
    userMessage = "",
    acceptedItemIds = [],
  } = {}) {
    if (!aliveRef.current) return;
    if (!dcRef.current || dcRef.current.readyState !== "open") return;

    clearAutoStopTimer();
    setUiState("thinking");
    setMood("thoughtful");
    setAssistantInputLocked(true, { clearBuffer: false, updateSession: false });

    try {
      dcRef.current.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions: buildTutorAgendaResponseInstructions({
              item,
              isKickoff,
              supportLang,
              targetLang,
              userMessage,
              acceptedItemIds,
              kind,
            }),
            metadata: { kind },
          },
        }),
      );
    } catch {
      resumeListeningWithAutoStop();
    }
  }

  function buildTutorStarterProgressInstructions(
    latestTranscript = "",
    acceptedItemIds = [],
  ) {
    const lesson = selectedTutorLessonRef.current;
    if (!isTutorStarterAgendaLesson(lesson)) return "";

    const tLang = targetLangRef.current || targetLang || "es";
    const supportCode = normalizeSupportLanguage(
      supportLangRef.current || resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const targetLanguageName =
      getLanguagePromptName(tLang) || "the target language";
    const supportLanguageName =
      getLanguagePromptName(supportCode) || "the support language";
    const progress = tutorStarterAgendaProgressRef.current || {};
    const completedItems = TUTOR_STARTER_AGENDA_ITEMS.filter(
      (item) => progress[item.id],
    );
    const nextItem = getNextTutorStarterAgendaItem(progress);
    const acceptedItems = TUTOR_STARTER_AGENDA_ITEMS.filter((item) =>
      acceptedItemIds.includes(item.id),
    );
    const completedText = completedItems.length
      ? completedItems
          .map((item) => getTutorAgendaItemLabel(item, supportCode))
          .join(", ")
      : "none yet";
    const acceptedText = acceptedItems
      .map((item) => getTutorAgendaItemLabel(item, supportCode))
      .join(", ");
    const baseLang = getBaseLanguageCode(tLang) || "es";
    const nextModel =
      nextItem?.examples?.[baseLang]?.[0] ||
      nextItem?.examples?.en?.[0] ||
      nextItem?.label?.en ||
      "";
    const nextMeaning = nextItem
      ? getTutorStarterItemSupportMeaning(nextItem, supportCode)
      : "";
    const requiredXp = getTutorLessonXpRequired(lesson);
    const earnedXp = Math.max(0, tutorLessonEarnedXpRef.current || 0);
    const remainingXp = Math.max(0, requiredXp - earnedXp);

    return [
      "APP-TRACKED STARTER AGENDA STATE:",
      latestTranscript
        ? `Latest learner transcript: "${latestTranscript}".`
        : "",
      `Internal progress only, do not say this to the learner: completed agenda items are ${completedText}.`,
      acceptedText
        ? `The app has accepted the latest turn as completing: ${acceptedText}. Say a brief positive acknowledgement, then move forward. Do not mention internal completion state. Do not ask for those words again.`
        : "",
      latestTranscript && !acceptedText
        ? "The app did not accept the latest turn. Do not advance the agenda, do not award praise, and keep the learner on the current phrase."
        : "",
      nextItem
        ? `Next agenda item: ${getTutorAgendaItemLabel(
            nextItem,
            supportCode,
          )}. Model this ${targetLanguageName} phrase if useful: "${nextModel}". Meaning in ${supportLanguageName}: "${nextMeaning}".`
        : `All agenda items have been covered. Internal only, do not say this to the learner: app-tracked XP is ${earnedXp}/${requiredXp}, with ${remainingXp} XP of review practice remaining. Continue with natural review or combination practice using only covered concepts until the app ends the session.`,
      "Use the app-tracked agenda state as the source of truth. Do not evaluate accent, sound quality, or pronunciation. Only explicitly accepted agenda items are complete.",
      "Do not mention XP, internal progress, or any end-of-session state. The app UI handles the transition.",
      remainingXp > 0
        ? `Internal only: ${remainingXp} XP remains. Do not perform a closing act in any language or wording; continue with one more review prompt.`
        : "",
      nextItem
        ? `Before asking the learner to repeat "${nextModel}", briefly explain that it means "${nextMeaning}" in ${supportLanguageName}.`
        : "",
      "Completed agenda state is internal bookkeeping. Do not mention it to the learner.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function buildTutorFollowupInstructions(
    userMessage = "",
    acceptedItemIds = [],
  ) {
    const lesson = selectedTutorLessonRef.current;
    const unit = selectedTutorUnitRef.current;
    const supportCode = normalizeSupportLanguage(
      supportLangRef.current || resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const tLang = targetLangRef.current || targetLang || "es";
    const targetLanguageName =
      getLanguagePromptName(tLang) || "the target language";
    const supportLanguageName =
      getLanguagePromptName(supportCode) || "the user's support language";
    const codeSwitchingAudioInstruction =
      buildTutorCodeSwitchingAudioInstruction(
        targetLanguageName,
        supportLanguageName,
      );
    const targetLanguageBoundaryInstruction =
      buildTutorTargetLanguageBoundaryInstruction({
        targetLang: tLang,
        supportLang: supportCode,
        targetLanguageName,
        supportLanguageName,
      });
    const selectedLevel =
      unit?.cefrLevel ||
      unit?.level ||
      conversationSettingsRef.current.proficiencyLevel ||
      maxProficiencyLevel ||
      "A1";
    const isEarlyTutorLevel = isTutorEarlyLevel(selectedLevel);
    const isAdvancedTutorLevel =
      isTutorAdvancedConversationLevel(selectedLevel);
    const teacherTalkLanguageInstruction =
      buildTutorTeacherTalkLanguageInstruction({
        targetLang: tLang,
        supportLang: supportCode,
        targetLanguageName,
        supportLanguageName,
        isEarlyTutorLevel,
      });
    const requiredXp = getTutorLessonXpRequired(lesson);
    const earnedXp = Math.max(0, Number(tutorLessonEarnedXpRef.current) || 0);
    const remainingXp = Math.max(0, requiredXp - earnedXp);
    const lessonStillInProgress =
      requiredXp > 0 &&
      earnedXp < requiredXp &&
      !tutorLessonCompletionTriggeredRef.current;
    const noWrapInstruction = lessonStillInProgress
      ? [
          `INTERNAL LESSON PROGRESS: ${earnedXp}/${requiredXp} app-tracked lesson XP; ${remainingXp} XP remains.`,
          "LESSON_STATE: IN_PROGRESS.",
          "Do not perform a closing act in any language or wording.",
          "A closing act includes any farewell, completion announcement, end-of-session summary, offer to stop, or suggestion that the lesson is over.",
          "The app, not you, ends the lesson. When the threshold is reached, the app will close the conversation and show the lesson-complete modal.",
          "Until then, continue with one review, combination, or comprehension task from the selected lesson.",
        ].join(" ")
      : "";
    const varietyInstruction = [
      "INTERACTION VARIETY: Do not end every message with 'can you try that' or 'can you say that'.",
      "Vary the task format naturally: fill a blank, choose between two options, answer a tiny question, transform a phrase, identify meaning, or use the phrase in a short reply.",
      "Avoid using the same closing request wording twice in a row.",
      getTutorTaskVariationInstruction(turnCountRef.current),
    ].join(" ");
    const signatureExperienceInstruction =
      getTutorSignatureExperienceInstruction({
        selectedLevel,
        turnCount: turnCountRef.current,
        isStarterLesson: isTutorStarterAgendaLesson(lesson),
      });

    if (isTutorStarterAgendaLesson(lesson)) {
      return [
        "Respond to the learner's latest turn as their tutor.",
        targetLanguageBoundaryInstruction,
        teacherTalkLanguageInstruction,
        codeSwitchingAudioInstruction,
        buildTutorStarterProgressInstructions(userMessage, acceptedItemIds),
        noWrapInstruction,
        varietyInstruction,
        signatureExperienceInstruction,
        `Use brief ${supportLanguageName} guidance and one tiny ${targetLanguageName} practice step.`,
        acceptedItemIds.length
          ? "The latest app-tracked item is complete. Continue to the next agenda item."
          : "The latest turn was not accepted. First address what the learner actually said — if they asked for help, a breakdown, the meaning, or a repetition, provide it for the current phrase — then invite them to try the current agenda item's phrase again.",
      ]
        .filter(Boolean)
        .join(" ");
    }

    const agendaTitle = getTutorLessonAgendaTitle(lesson, unit, supportCode);
    return [
      "Respond to the learner's latest turn as their tutor.",
      targetLanguageBoundaryInstruction,
      teacherTalkLanguageInstruction,
      codeSwitchingAudioInstruction,
      userMessage ? `Latest learner transcript: "${userMessage}".` : "",
      buildRecentOnScreenContextInstruction(),
      noWrapInstruction,
      varietyInstruction,
      signatureExperienceInstruction,
      `Keep teaching from the selected agenda topic: ${agendaTitle}. Convert any non-${targetLanguageName} source wording into ${targetLanguageName} before modeling it.`,
      "Work through the agenda first. Once the agenda has been covered, review, combine, or practice only what was covered in this lesson until the app transitions away.",
      isEarlyTutorLevel
        ? `Use ${supportLanguageName} for coaching, explanations, and questions. Use ${targetLanguageName} only for examples, model phrases, and practice prompts.`
        : isAdvancedTutorLevel
          ? `Respond almost entirely in ${targetLanguageName}. Make it feel like a natural conversation, not a phrase drill.`
          : `Respond primarily in simple ${targetLanguageName}. Use ${supportLanguageName} only for a short clarification if the learner seems stuck.`,
      supportCode !== tLang && !isEarlyTutorLevel
        ? `Do not default back to ${supportLanguageName}; the learner is ${selectedLevel}, so they should practice following instructions in ${targetLanguageName}.`
        : "",
      "If the learner's meaning is understandable, accept it and move forward. Do not evaluate accent or sound quality.",
      isAdvancedTutorLevel
        ? "Ask one purposeful open-ended follow-up in the target language and weave corrections into your reply."
        : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function buildTurnDetectionConfig() {
    if (assistantInputLockedRef.current) return null;
    return {
      type: "server_vad",
      silence_duration_ms: 2000,
      threshold: 0.35,
      prefix_padding_ms: 120,
      create_response: false,
      interrupt_response: false,
    };
  }

  function setLocalMicEnabled(enabled) {
    // Route mic state through the Gemini bridge so "muted" also means no
    // billable input-audio stream.
    try {
      dcRef.current?.setInputAudioEnabled?.(enabled);
    } catch {}
    try {
      localRef.current?.getAudioTracks?.().forEach((track) => {
        track.enabled = enabled;
      });
    } catch {}
  }

  // Prevent background sounds from barging in while the assistant is speaking.
  function setAssistantInputLocked(locked, opts = {}) {
    const { clearBuffer = false, updateSession = true } = opts;
    assistantInputLockedRef.current = locked;
    if (locked) setLocalMicEnabled(false);
    try {
      if (updateSession && dcRef.current?.readyState === "open") {
        if (locked && clearBuffer) {
          dcRef.current.send(
            JSON.stringify({ type: "input_audio_buffer.clear" }),
          );
        }
        dcRef.current.send(
          JSON.stringify({
            type: "session.update",
            session: { turn_detection: buildTurnDetectionConfig() },
          }),
        );
      }
    } catch {}
    if (!locked) setLocalMicEnabled(true);
  }

  function clearAssistantUnlockTimer() {
    if (assistantUnlockTimerRef.current) {
      clearInterval(assistantUnlockTimerRef.current);
      assistantUnlockTimerRef.current = null;
    }
  }

  function resumeListeningWithAutoStop({ playCue = false } = {}) {
    setAssistantInputLocked(false);
    setUiState(aliveRef.current ? "listening" : "idle");
    setMood("neutral");
    if (aliveRef.current) {
      if (playCue) {
        playListeningCue();
      }
      scheduleAutoStop();
    }
  }

  function playListeningCue() {
    if (!aliveRef.current) return;
    const now = Date.now();
    if (now - listeningCueLastPlayedAtRef.current < 1200) return;
    listeningCueLastPlayedAtRef.current = now;
    setTimeout(() => {
      if (!aliveRef.current) return;
      void playSound(listeningCueSound);
    }, 80);
  }

  function finishAssistantOutput() {
    clearAssistantUnlockTimer();
    const shouldPlayListeningCue = assistantSpeakingRef.current;
    assistantSpeakingRef.current = false;
    enableVAD();
    resumeListeningWithAutoStop({ playCue: shouldPlayListeningCue });
  }

  function scheduleAssistantUnlockAfterQuiet() {
    if (!assistantInputLockedRef.current) return;
    clearAssistantUnlockTimer();
    const startedAt = Date.now();
    let heardAudio = false;
    let lastLoudAt = Date.now();
    // The Gemini bridge only emits response.output_audio.done AFTER playback has fully
    // drained (it waits for scheduledSources to empty), so by the time this runs the
    // audio is already silent. The RMS poll therefore never "hears" audio and used to
    // sit on the 1800ms no-audio fallback — that was the ~1.5-2s dead gap before
    // "listening". Audio is confirmed finished here, so we only add a small natural
    // beat. (The poll is kept purely as a safety net for any residual decay.)
    const quietMs = 350;
    const minWaitMs = 150;
    const noAudioFallbackMs = 250;
    const maxWaitMs = 30000;

    assistantUnlockTimerRef.current = setInterval(() => {
      const now = Date.now();
      const hasAnalyser = !!analyserRef.current && !!floatBufRef.current;
      const rms = hasAnalyser ? getRMS() : 0;
      if (rms >= 0.0025) {
        heardAudio = true;
        lastLoudAt = now;
      }
      const quietAfterSpeech =
        heardAudio &&
        now - lastLoudAt >= quietMs &&
        now - startedAt >= minWaitMs;
      const noAudioHeard = !heardAudio && now - startedAt >= noAudioFallbackMs;
      const timedOut = now - startedAt >= maxWaitMs;
      if (quietAfterSpeech || noAudioHeard || timedOut) {
        finishAssistantOutput();
      }
    }, 100);
  }

  function lockInputForPendingTutorResponse() {
    if (assistantSpeakingRef.current) return;
    clearAutoStopTimer();
    setUiState("thinking");
    setMood("thoughtful");
    // Keep this lightweight: the transcript handler immediately requests the tutor
    // response, and that request path mutes input while the tutor speaks.
  }

  function commitPendingUserSpeech() {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    clearAutoStopTimer();
    setUiState("thinking");
    setMood("thoughtful");
  }

  function applyLanguagePolicyNow() {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;

    const voiceName = normalizeGeminiLiveVoice(voiceRef.current);
    const instructions = buildLanguageInstructions();

    const previousGuardrailIds = Array.from(
      new Set(guardrailItemIdsRef.current),
    );
    for (const id of previousGuardrailIds) {
      try {
        dcRef.current.send(
          JSON.stringify({ type: "conversation.item.delete", item_id: id }),
        );
      } catch {}
    }
    guardrailItemIdsRef.current = [];

    try {
      dcRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: {
            instructions,
            modalities: ["audio", "text"],
            voice: voiceName,
            turn_detection: buildTurnDetectionConfig(),
            input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
            output_audio_format: "pcm16",
          },
        }),
      );
    } catch {}
    pendingGuardrailTextRef.current = "";
  }

  function sendTutorStarterAgendaKickoff() {
    const supportCode = normalizeSupportLanguage(
      supportLangRef.current || resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const tLang = targetLangRef.current || targetLang || "es";
    const nextItem = getNextTutorStarterAgendaItem(
      tutorStarterAgendaProgressRef.current,
    );
    requestRealtimeTutorAgendaResponse({
      item: nextItem,
      isKickoff: true,
      supportLang: supportCode,
      targetLang: tLang,
      kind: "tutor_kickoff",
    });
    logEvent(analytics, "tutor_lesson_kickoff_requested", {
      lessonId: selectedTutorLessonRef.current?.id || "",
    });
  }

  function requestTutorLessonWelcome() {
    if (!aliveRef.current) return;
    if (!dcRef.current || dcRef.current.readyState !== "open") return;

    tutorWelcomePendingReplyRef.current = true;
    // New lesson conversation: no real practice turn has happened yet, so block
    // tool-grading XP until the learner actually attempts a phrase.
    lessonPracticeStartedRef.current = false;
    clearAutoStopTimer();
    setUiState("thinking");
    setMood("thoughtful");
    setAssistantInputLocked(true, { clearBuffer: false, updateSession: false });

    try {
      dcRef.current.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions: buildTutorWelcomeInstructions(),
            metadata: { kind: "tutor_welcome" },
          },
        }),
      );
      logEvent(analytics, "tutor_lesson_welcome_requested", {
        lessonId: selectedTutorLessonRef.current?.id || "",
      });
    } catch {
      tutorWelcomePendingReplyRef.current = false;
      resumeListeningWithAutoStop();
    }
  }

  function requestTutorLessonKickoff() {
    if (tutorKickoffSentRef.current) return;
    if (!aliveRef.current) return;
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    // Already underway (the learner replied, made agenda progress, or received a
    // real tutor turn): just resume listening. The tutorial welcome on its own
    // does not count as started.
    if (hasStartedTutorLessonConversation()) {
      tutorKickoffSentRef.current = true;
      setAssistantInputLocked(false);
      setUiState(status === "connected" ? "listening" : "idle");
      setMood("neutral");
      if (aliveRef.current) scheduleAutoStop();
      return;
    }
    if (
      !selectedTutorLessonRef.current &&
      (isTutorPathLoadingRef.current || isTutorAgendaHydratingRef.current)
    ) {
      scheduleTutorLessonKickoff(120);
      return;
    }

    void ensureSelectedTutorLessonStarted();
    tutorKickoffSentRef.current = true;
    clearAutoStopTimer();

    if (isTutorStarterAgendaLesson(selectedTutorLessonRef.current)) {
      // Resumed after the welcome was shown but before the learner replied:
      // start the actual lesson now instead of repeating the welcome.
      if (hasVisibleTutorMessages(messagesRef.current)) {
        sendTutorStarterAgendaKickoff();
        return;
      }
      // Fresh start: open with a friendly welcome in the learner's support
      // language. Replying to it earns no XP; once the learner responds, the
      // transcript handler kicks off the lesson as it normally would.
      requestTutorLessonWelcome();
      return;
    }

    setUiState("thinking");
    setMood("thoughtful");
    setAssistantInputLocked(true, { clearBuffer: false, updateSession: false });

    try {
      dcRef.current.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions: buildTutorKickoffInstructions(),
            metadata: { kind: "tutor_kickoff" },
          },
        }),
      );
      logEvent(analytics, "tutor_lesson_kickoff_requested", {
        lessonId: selectedTutorLessonRef.current?.id || "",
      });
    } catch (error) {
      tutorKickoffSentRef.current = false;
      resumeListeningWithAutoStop();
    }
  }

  function requestTutorTurnFollowup(
    userMessage = "",
    acceptedItemIds = [],
    { kind = "tutor_followup" } = {},
  ) {
    if (!aliveRef.current) return;
    if (!dcRef.current || dcRef.current.readyState !== "open") return;

    const lesson = selectedTutorLessonRef.current;
    const isStarterLesson = isTutorStarterAgendaLesson(lesson);
    const supportCode = normalizeSupportLanguage(
      supportLangRef.current || resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const tLang = targetLangRef.current || targetLang || "es";
    const nextStarterItem = isStarterLesson
      ? getNextTutorStarterAgendaItem(tutorStarterAgendaProgressRef.current)
      : null;
    if (isStarterLesson) {
      requestRealtimeTutorAgendaResponse({
        item: nextStarterItem,
        supportLang: supportCode,
        targetLang: tLang,
        userMessage,
        acceptedItemIds,
        kind,
      });
      return;
    }

    const instructions = buildTutorFollowupInstructions(
      userMessage,
      acceptedItemIds,
    );

    clearAutoStopTimer();
    setUiState("thinking");
    setMood("thoughtful");
    setAssistantInputLocked(true, { clearBuffer: false, updateSession: false });

    try {
      dcRef.current.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions,
            metadata: { kind },
          },
        }),
      );
    } catch {
      resumeListeningWithAutoStop();
    }
  }

  function scheduleTutorLessonKickoff(delayMs = 140) {
    clearTutorKickoffTimer();
    tutorKickoffTimerRef.current = setTimeout(() => {
      tutorKickoffTimerRef.current = null;
      if (tutorKickoffSentRef.current) return;
      if (!dcRef.current || dcRef.current.readyState !== "open") return;
      if (!tutorSessionReadyRef.current) return;
      if (!aliveRef.current) {
        scheduleTutorLessonKickoff(80);
        return;
      }
      requestTutorLessonKickoff();
    }, delayMs);
  }

  /** Disable VAD and detach mic track so the user cannot interrupt AI speech. */
  function disableVAD() {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((s) => {
        if (s.track?.kind === "audio") {
          s.replaceTrack(null).catch(() => {});
        }
      });
    }
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    try {
      dcRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: { turn_detection: null },
        }),
      );
    } catch {}
  }

  /** Re-enable server VAD and reattach mic track after AI finishes speaking. */
  function enableVAD() {
    const micTrack = localRef.current?.getAudioTracks()?.[0];
    if (pcRef.current && micTrack) {
      pcRef.current.getSenders().forEach((s) => {
        if (!s.track || s.track?.kind === "audio") {
          s.replaceTrack(micTrack).catch(() => {});
        }
      });
    }
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    try {
      dcRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: {
            turn_detection: {
              type: "server_vad",
              silence_duration_ms: 2000,
              threshold: 0.35,
              prefix_padding_ms: 120,
              create_response: false,
              interrupt_response: false,
            },
          },
        }),
      );
    } catch {}
  }

  function clearAllDebouncers() {
    clearTimeout(sessionUpdateTimer.current);
  }

  function clearAutoStopTimer() {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }

  function waitUntilIdle(timeoutMs = 2000) {
    if (isIdleRef.current) return Promise.resolve();
    return new Promise((resolve) => {
      idleWaitersRef.current.push(resolve);
      setTimeout(resolve, timeoutMs);
    });
  }

  function isTutorLessonPracticeInProgress() {
    const lesson = selectedTutorLessonRef.current;
    if (!lesson || tutorLessonCompletionTriggeredRef.current) return false;
    const requiredXp = getTutorLessonXpRequired(lesson);
    const earnedXp = Math.max(0, Number(tutorLessonEarnedXpRef.current) || 0);
    const xpIncomplete = requiredXp > 0 && earnedXp < requiredXp;
    const starterAgendaIncomplete =
      isTutorStarterAgendaLesson(lesson) &&
      !isTutorStarterAgendaComplete(tutorStarterAgendaProgressRef.current);
    return xpIncomplete || starterAgendaIncomplete;
  }

  function getTutorAssistantOutputText(mid) {
    if (!mid) return "";
    const message = messagesRef.current.find((item) => item.id === mid);
    return sanitizeTutorAssistantText(
      [
        message?.textFinal || "",
        message?.textStream || "",
        streamBuffersRef.current.get(mid) || "",
      ]
        .filter(Boolean)
        .join(" ")
        .trim(),
    );
  }

  function getLatestTutorUserText() {
    const items = messagesRef.current || [];
    for (let i = items.length - 1; i >= 0; i -= 1) {
      if (items[i]?.role === "user") {
        return String(items[i].textFinal || items[i].textStream || "").trim();
      }
    }
    return "";
  }

  function buildTutorClosingActJudgePrompt(assistantText = "") {
    const lesson = selectedTutorLessonRef.current;
    const unit = selectedTutorUnitRef.current;
    const supportCode = normalizeSupportLanguage(
      supportLangRef.current || resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const tLang = targetLangRef.current || targetLang || "es";
    const targetLanguageName =
      getLanguagePromptName(tLang) || "the target language";
    const supportLanguageName =
      getLanguagePromptName(supportCode) || "the user's support language";
    const agendaTitle = getTutorLessonAgendaTitle(lesson, unit, supportCode);
    const requiredXp = getTutorLessonXpRequired(lesson);
    const earnedXp = Math.max(0, Number(tutorLessonEarnedXpRef.current) || 0);

    return [
      "You are a language-neutral semantic classifier for a realtime language tutor.",
      "The app state is LESSON_STATE: IN_PROGRESS. The app, not the tutor text, owns lesson completion.",
      "Classify the assistant message by intent and meaning across any language, writing system, or code-switching. Do not use keyword matching.",
      "A closing act means the tutor presents the lesson/session/practice as ended, offers to end it, gives a final-session summary, says farewell as the session conclusion, or stops assigning practice because it thinks the lesson is complete.",
      "A continuing tutor turn acknowledges, corrects, explains, reviews, combines, or asks a concrete next practice/comprehension task from the lesson.",
      `Lesson: ${agendaTitle || lesson?.title || "selected Tutor lesson"}.`,
      `Target language: ${targetLanguageName}. Support language: ${supportLanguageName}.`,
      `Internal app progress: ${earnedXp}/${requiredXp || "unknown"} lesson XP.`,
      "Assistant message:",
      `"""${String(assistantText || "").slice(0, 1600)}"""`,
      'Return ONLY JSON: {"closingAct":true|false,"confidence":0..1,"reason":"short semantic reason"}',
    ].join("\n");
  }

  async function judgeTutorClosingAct(assistantText = "") {
    try {
      if (!gradingLiteModel) {
        return { closingAct: false, confidence: 0, reason: "" };
      }
      const resp = await gradingLiteModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: buildTutorClosingActJudgePrompt(assistantText) }],
          },
        ],
      });
      const raw = extractGeminiResponseText(resp);
      const parsed = safeParseJson(raw) || {};
      const closingAct =
        parsed.closingAct === true || parsed.closing_act === true;
      const confidence =
        parsed.confidence === undefined
          ? 1
          : Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
      return {
        closingAct: closingAct && confidence >= 0.6,
        confidence,
        reason: String(parsed.reason || "").slice(0, 180),
      };
    } catch (error) {
      console.warn("Tutor closing-act semantic judge failed:", error);
      return { closingAct: false, confidence: 0, reason: "" };
    }
  }

  async function recoverFromSemanticTutorClosingAct(rid, mid) {
    const checkKey = rid || mid;
    if (!checkKey || !mid) return;
    if (tutorClosingActCheckedKeysRef.current.has(checkKey)) return;
    if (tutorClosingActRecoveryInFlightRef.current) return;
    if (!isTutorLessonPracticeInProgress()) return;

    const checkedTurn = turnCountRef.current;
    if (tutorClosingActRecoveryTurnRef.current === checkedTurn) return;

    const assistantText = getTutorAssistantOutputText(mid);
    if (!assistantText) return;

    // Tool-grading mode: proposeLessonComplete is the sole ending mechanism, so never
    // run the per-turn closing-act flash judge. (Flag off → judge runs as before.)
    if (TUTOR_TOOL_GRADING_ENABLED) {
      return;
    }

    tutorClosingActCheckedKeysRef.current.add(checkKey);
    const verdict = await judgeTutorClosingAct(assistantText);
    if (!verdict.closingAct) return;
    if (!aliveRef.current) return;
    if (turnCountRef.current !== checkedTurn) return;
    if (!isTutorLessonPracticeInProgress()) return;

    tutorClosingActRecoveryInFlightRef.current = true;
    tutorClosingActRecoveryTurnRef.current = checkedTurn;
    try {
      if (!isIdleRef.current && dcRef.current?.readyState === "open") {
        try {
          dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
        } catch {}
        await waitUntilIdle(1800);
      }

      if (!aliveRef.current) return;
      if (turnCountRef.current !== checkedTurn) return;
      if (!isTutorLessonPracticeInProgress()) return;

      streamBuffersRef.current.delete(mid);
      removeMessage(mid);
      requestTutorTurnFollowup(getLatestTutorUserText(), [], {
        kind: "tutor_semantic_review_retry",
      });
    } finally {
      tutorClosingActRecoveryInFlightRef.current = false;
    }
  }

  function dispatchTutorCompletionSequenceStart() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("lesson-completion:sequence-start"));
  }

  function getTutorDailyGoalCelebrationDetail(awardResult, source) {
    if (!awardResult?.shouldCelebrateGoal) return null;
    return {
      petHealth: awardResult.petHealth ?? null,
      petDelta: awardResult.petDelta,
      source,
    };
  }

  function getTutorLocalDailyGoalCelebrationDetail(update, source) {
    if (!update?.reachedDailyGoal) return null;
    return {
      petHealth: null,
      source,
      dailyXp: update.dailyXp,
      dailyGoalXp: update.dailyGoalXp,
      todayKey: update.todayKey,
    };
  }

  function queueTutorDailyGoalCelebration(detail) {
    if (!detail || typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("daily-goal:queueCelebration", { detail }),
    );
  }

  function rememberTutorDailyGoalCelebration(awardResult, source) {
    const detail = getTutorDailyGoalCelebrationDetail(awardResult, source);
    if (!detail) return;
    pendingTutorDailyGoalCelebrationRef.current = detail;
    queueTutorDailyGoalCelebration(detail);
  }

  function rememberTutorLocalDailyGoalCelebration(update, source) {
    const detail = getTutorLocalDailyGoalCelebrationDetail(update, source);
    if (!detail) return;
    pendingTutorDailyGoalCelebrationRef.current = detail;
    queueTutorDailyGoalCelebration(detail);
  }

  function releaseQueuedDailyGoalCelebration(celebration = null) {
    if (typeof window === "undefined") return false;
    const detail = { handled: false };
    if (celebration) detail.celebration = celebration;
    window.dispatchEvent(
      new CustomEvent("daily-goal:releaseQueuedCelebration", { detail }),
    );
    return detail.handled === true;
  }

  function releaseTutorDailyGoalCelebration() {
    const directCelebration = pendingTutorDailyGoalCelebrationRef.current;
    const openedQueued = releaseQueuedDailyGoalCelebration(directCelebration);
    if (openedQueued) {
      pendingTutorDailyGoalCelebrationRef.current = null;
      return true;
    }

    if (directCelebration && typeof onDailyGoalCelebration === "function") {
      const opened = onDailyGoalCelebration(directCelebration) !== false;
      if (opened) {
        pendingTutorDailyGoalCelebrationRef.current = null;
        return true;
      }
    }

    return false;
  }

  function scheduleAutoStop() {
    clearAutoStopTimer();
    autoStopTimerRef.current = setTimeout(() => {
      if (!aliveRef.current) return;
      stop();
    }, AUTO_DISCONNECT_MS);
  }

  function clearTutorKickoffTimer() {
    if (tutorKickoffTimerRef.current) {
      clearTimeout(tutorKickoffTimerRef.current);
      tutorKickoffTimerRef.current = null;
    }
  }

  async function completeTutorLessonFromXp(
    lesson,
    unit,
    awardPromises = [],
    localDailyGoalUpdates = [],
  ) {
    if (!lesson || tutorLessonCompletionTriggeredRef.current) return;
    const npub = currentNpub;
    if (!npub) return;
    const xpRequired = getTutorLessonXpRequired(lesson);

    tutorLessonCompletionTriggeredRef.current = true;
    dispatchTutorCompletionSequenceStart();
    const nextProgressLessons = {
      ...(tutorUserProgress.lessons || {}),
      [lesson.id]: {
        ...(tutorUserProgress.lessons?.[lesson.id] || {}),
        status: SKILL_STATUS.COMPLETED,
      },
    };
    const nextTutorLesson = findNextTutorLessonAfter(
      tutorPathUnits,
      lesson.id,
      nextProgressLessons,
    );
    await stop();
    try {
      const settledAwards = await Promise.allSettled(
        awardPromises.filter(Boolean),
      );
      settledAwards.forEach((settled) => {
        if (settled.status === "fulfilled") {
          rememberTutorDailyGoalCelebration(
            settled.value,
            "tutor_lesson_final_turn",
          );
        }
      });
      localDailyGoalUpdates.forEach((update) => {
        rememberTutorLocalDailyGoalCelebration(
          update,
          "tutor_lesson_final_turn_local",
        );
      });
      await completeTutorLesson(
        npub,
        lesson.id,
        xpRequired || 1,
        targetLangRef.current,
      );
      if (xpRequired > 0) {
        setXp((v) => v + xpRequired);
        const lessonDailyGoalUpdate = applyTutorDailyGoalXpOptimistic(
          npub,
          xpRequired,
        );
        const lessonAwardResult = await awardXp(
          npub,
          xpRequired,
          targetLangRef.current,
        );
        rememberTutorDailyGoalCelebration(
          lessonAwardResult,
          "tutor_lesson_completion_bonus",
        );
        rememberTutorLocalDailyGoalCelebration(
          lessonDailyGoalUpdate,
          "tutor_lesson_completion_bonus_local",
        );
        await syncTutorDailyGoalXpFromFirestore(npub);
      }
      setCompletedTutorLessonData({
        title: lesson.title,
        xpEarned: xpRequired,
        lessonId: lesson.id,
        unitTitle: unit?.title,
      });
      if (isTutorStarterAgendaLesson(lesson)) {
        pendingFirstLessonCompletionFlowRef.current = true;
      }
      setCompletedTutorAgendaData(
        buildTutorCompletedAgendaData({
          lesson,
          unit,
          targetLang: targetLangRef.current,
          supportLang: resolvedSupportLang,
          starterProgress: tutorStarterAgendaProgressRef.current,
          xpEarned: xpRequired,
          forceComplete: true,
        }),
      );
      if (nextTutorLesson?.lesson) {
        const nextProgress = nextProgressLessons[nextTutorLesson.lesson.id];
        const nextEarned =
          nextTutorLesson.status === SKILL_STATUS.IN_PROGRESS
            ? getStoredTutorLessonEarnedXp(nextProgress, nextTutorLesson.lesson)
            : 0;

        setSelectedTutorLesson(nextTutorLesson.lesson);
        setSelectedTutorUnit(nextTutorLesson.unit);
        selectedTutorLessonRef.current = nextTutorLesson.lesson;
        selectedTutorUnitRef.current = nextTutorLesson.unit;
        tutorLessonEarnedXpRef.current = nextEarned;
        setTutorLessonEarnedXp(nextEarned);
        tutorLessonCompletionTriggeredRef.current = false;
        tutorStarterAgendaProgressRef.current = {};
        setTutorStarterAgendaProgress({});
        setConversationSettings((prev) => ({
          ...prev,
          proficiencyLevel:
            nextTutorLesson.unit?.cefrLevel || prev.proficiencyLevel,
        }));
        if (nextTutorLesson.unit?.cefrLevel) {
          writeStoredTutorLevel(
            targetLangRef.current,
            nextTutorLesson.unit.cefrLevel,
          );
          setActiveTutorLevel(nextTutorLesson.unit.cefrLevel);
        }
        writeStoredTutorLessonId(
          targetLangRef.current,
          nextTutorLesson.lesson.id,
        );
      } else {
        writeStoredTutorLessonId(targetLangRef.current, lesson.id);
      }
      setShowTutorLessonComplete(true);
      logEvent(analytics, "tutor_lesson_completed", {
        lessonId: lesson.id,
        xpRequired,
      });
    } catch (error) {
      console.error("Failed to complete Tutor lesson:", error);
      tutorLessonCompletionTriggeredRef.current = false;
      releaseQueuedDailyGoalCelebration();
    }
  }

  function trackTutorLessonXp(
    xpGain,
    awardPromise = null,
    localDailyGoalUpdate = null,
    { deferCompletionUntilIdle = false } = {},
  ) {
    const lesson = selectedTutorLessonRef.current;
    const unit = selectedTutorUnitRef.current;
    if (!lesson || tutorLessonCompletionTriggeredRef.current) return false;
    const xpRequired = getTutorLessonXpRequired(lesson);
    if (xpRequired <= 0) return false;

    const nextEarned = Math.min(
      xpRequired,
      Math.max(0, tutorLessonEarnedXpRef.current + xpGain),
    );
    tutorLessonEarnedXpRef.current = nextEarned;
    setTutorLessonEarnedXp(nextEarned);
    if (currentNpub) {
      void saveTutorLessonEarnedXp(
        currentNpub,
        lesson.id,
        targetLangRef.current,
        nextEarned,
      ).catch((error) => {
        console.error("Failed to save Tutor lesson XP:", error);
      });
    }

    const canCompleteLesson =
      !isTutorStarterAgendaLesson(lesson) ||
      isTutorStarterAgendaComplete(tutorStarterAgendaProgressRef.current);
    if (nextEarned >= xpRequired && canCompleteLesson) {
      if (pendingTutorLessonCompletionRef.current) return true;
      pendingTutorLessonCompletionRef.current = true;
      void (async () => {
        try {
          if (deferCompletionUntilIdle && !isIdleRef.current) {
            await waitUntilIdle(45000);
          }
          if (tutorLessonCompletionTriggeredRef.current) return;
          dispatchTutorCompletionSequenceStart();
          await completeTutorLessonFromXp(
            lesson,
            unit,
            awardPromise ? [awardPromise] : [],
            localDailyGoalUpdate ? [localDailyGoalUpdate] : [],
          );
        } finally {
          pendingTutorLessonCompletionRef.current = false;
        }
      })();
      return true;
    }

    return false;
  }

  function persistTutorStarterAgendaProgress(lesson, progress) {
    const npub = currentNpub;
    if (!npub || !lesson?.id) return;
    void saveTutorAgendaProgress(
      npub,
      lesson.id,
      targetLangRef.current,
      normalizeTutorStarterAgendaProgress(progress),
    ).catch((error) => {
      console.error("Failed to save Tutor agenda progress:", error);
    });
  }

  function getTutorStarterAgendaCandidateItemIds() {
    const lesson = selectedTutorLessonRef.current;
    if (!isTutorStarterAgendaLesson(lesson)) return [];
    if (tutorLessonCompletionTriggeredRef.current) return [];

    const currentItem = getNextTutorStarterAgendaItem(
      tutorStarterAgendaProgressRef.current,
    );
    if (!currentItem) return [];
    return [currentItem.id];
  }

  function commitTutorStarterAgendaProgress(itemIds = []) {
    const lesson = selectedTutorLessonRef.current;
    if (!isTutorStarterAgendaLesson(lesson)) return [];
    if (tutorLessonCompletionTriggeredRef.current) return [];

    const allowedIds = new Set(
      TUTOR_STARTER_AGENDA_ITEMS.map((item) => item.id),
    );
    const acceptedIds = compactUnique(itemIds).filter(
      (id) =>
        allowedIds.has(id) && !tutorStarterAgendaProgressRef.current?.[id],
    );
    if (!acceptedIds.length) return [];

    const nextProgress = { ...tutorStarterAgendaProgressRef.current };
    acceptedIds.forEach((id) => {
      nextProgress[id] = true;
    });
    const normalizedNextProgress =
      normalizeTutorStarterAgendaProgress(nextProgress);
    tutorStarterAgendaProgressRef.current = normalizedNextProgress;
    setTutorStarterAgendaProgress(normalizedNextProgress);

    persistTutorStarterAgendaProgress(lesson, normalizedNextProgress);
    return acceptedIds;
  }

  function getRegularTutorAcceptedPhrases() {
    const lesson = selectedTutorLessonRef.current;
    if (!lesson || isTutorStarterAgendaLesson(lesson)) return [];
    const currentTargetLang = targetLangRef.current || targetLang || "es";
    const targetBase = getBaseLanguageCode(currentTargetLang || "es") || "es";

    const promptedPhrases = extractPromptedTutorPhrases(
      getLatestTutorAssistantText(messagesRef.current),
    ).filter((phrase) =>
      isTutorPracticePhraseAllowedForTarget(phrase, currentTargetLang),
    );
    if (promptedPhrases.length) return promptedPhrases;

    if (targetBase !== "es") return [];

    return getTutorLessonFocusAgendaItems(lesson)
      .map((item) => item.phrase || item.label)
      .filter((phrase) =>
        isTutorPracticePhraseAllowedForTarget(phrase, currentTargetLang),
      );
  }

  function buildTutorTurnSuccessJudgePrompt(
    userMessage = "",
    {
      starterCandidateItemIds = [],
      exactStarterMatches = [],
      regularPhraseMatch = false,
      directPhraseAnswer = false,
      acceptedPhrases = [],
    } = {},
  ) {
    const lesson = selectedTutorLessonRef.current;
    const unit = selectedTutorUnitRef.current;
    const supportCode = normalizeSupportLanguage(
      supportLangRef.current || resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const tLang = targetLangRef.current || targetLang || "es";
    const targetLanguageName =
      getLanguagePromptName(tLang) || "the target language";
    const supportLanguageName =
      getLanguagePromptName(supportCode) || "the user's support language";
    const selectedLevel =
      unit?.cefrLevel ||
      unit?.level ||
      conversationSettingsRef.current.proficiencyLevel ||
      maxProficiencyLevel ||
      "A1";
    const latestAssistantText = getLatestTutorAssistantText(
      messagesRef.current,
    );
    const agendaTitle = getTutorLessonAgendaTitle(lesson, unit, supportCode);
    const agendaSubtitle = getTutorLessonAgendaSubtitle(
      lesson,
      unit,
      supportCode,
    );
    const starterCandidates = starterCandidateItemIds
      .map((id) => TUTOR_STARTER_AGENDA_ITEMS.find((item) => item.id === id))
      .filter(Boolean)
      .map((item) => ({
        id: item.id,
        phrase: getTutorStarterItemModelPhrase(item, tLang),
        meaning: getTutorStarterItemSupportMeaning(item, supportCode),
      }));
    const regularPhrases = compactUnique(acceptedPhrases)
      .slice(0, 8)
      .map((phrase) => String(phrase || "").slice(0, 120));
    const focusItems = getTutorLessonFocusAgendaItems(lesson)
      .map((item) => item.phrase || item.label)
      .filter(Boolean)
      .slice(0, 10);

    return [
      "You are a strict, language-neutral XP gate for a realtime language tutor.",
      "Classify the latest learner transcript semantically across any language or writing system. Do not use keyword matching.",
      "XP should be awarded only for a correct or successful learner attempt at the tutor's immediately previous practice/comprehension task.",
      "Successful means the learner answered the prompt, produced the requested target-language phrase, completed the requested transformation, chose/identified the correct meaning, or gave a relevant understandable response for an open conversational prompt.",
      "Also count newer Tutor experiences when the learner completes the requested communicative move: asks the question back, asks for repetition or clarification, corrects a misunderstanding, supplies a missing detail in an information gap, identifies a listened detail, responds to friendly pushback, or improves tone/register/naturalness when asked.",
      "For fill-in-the-blank tasks, the learner may answer with only the missing word. Count it as successful if that word correctly completes the tutor's blank.",
      "Accent, speech quality, minor grammar mistakes, and transcription imperfections are not blockers when the intended answer is clear.",
      "Not successful: the learner asks how to say something, asks for help/explanation/translation, says they do not know, refuses, gives only filler, gives random/unrelated words, repeats support-language instructions, quotes/mentions the answer inside a question, or answers a different task.",
      "If a local phrase matcher found words, still return successful=false when the transcript is a meta-question or mention rather than an answer.",
      "For starter agenda phrase-production tasks, require an attempt at the target-language phrase itself; a support-language translation alone is not enough unless the tutor explicitly asked for the meaning instead of asking the learner to say the phrase.",
      `Lesson: ${agendaTitle || "selected Tutor lesson"}.`,
      agendaSubtitle ? `Lesson focus: ${agendaSubtitle}.` : "",
      `Learner level: ${selectedLevel}.`,
      `Target language: ${targetLanguageName}. Support language: ${supportLanguageName}.`,
      starterCandidates.length
        ? `Current starter agenda candidate(s): ${JSON.stringify(
            starterCandidates,
          )}`
        : "",
      exactStarterMatches.length
        ? `Exact starter phrase match candidates from transcript: ${JSON.stringify(
            exactStarterMatches,
          )}`
        : "",
      regularPhrases.length
        ? `Target phrase(s) likely requested by the tutor: ${JSON.stringify(
            regularPhrases,
          )}`
        : "",
      regularPhraseMatch
        ? "A local phrase matcher found overlap with a requested phrase, but you must still judge whether the transcript is actually an answer."
        : "",
      directPhraseAnswer
        ? "The transcript is a short direct phrase answer to the requested model phrase. Unless there is clear evidence of a different task, this is successful."
        : "",
      focusItems.length
        ? `Lesson concept list: ${JSON.stringify(focusItems)}`
        : "",
      "Immediately previous tutor prompt:",
      `"""${String(latestAssistantText || "").slice(0, 1800)}"""`,
      "Latest learner transcript:",
      `"""${String(userMessage || "").slice(0, 800)}"""`,
      'Return ONLY JSON: {"successful":true|false,"confidence":0..1,"reason":"short semantic reason"}',
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function judgeTutorTurnSuccessfulForXp(userMessage = "", opts = {}) {
    if (!hasTutorMeaningfulTranscript(userMessage)) {
      return { successful: false, confidence: 0, reason: "empty transcript" };
    }
    if (opts?.directPhraseAnswer) {
      return {
        successful: true,
        confidence: 1,
        reason: "direct phrase answer",
      };
    }

    try {
      if (!gradingLiteModel) {
        return {
          successful: false,
          confidence: 0,
          reason: "grading model unavailable",
        };
      }
      const resp = await gradingLiteModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: buildTutorTurnSuccessJudgePrompt(userMessage, opts) },
            ],
          },
        ],
      });
      const parsed = safeParseJson(extractGeminiResponseText(resp)) || {};
      const successful =
        parsed.successful === true ||
        parsed.success === true ||
        parsed.accepted === true;
      const confidence =
        parsed.confidence === undefined
          ? 1
          : Math.max(0, Math.min(1, Number(parsed.confidence) || 0));

      return {
        successful: successful && confidence >= 0.55,
        confidence,
        reason: String(parsed.reason || "").slice(0, 180),
      };
    } catch (error) {
      console.warn("Tutor XP success judge failed:", error);
      return { successful: false, confidence: 0, reason: "judge failed" };
    }
  }

  function getLocalTutorTurnSuccessfulForXp({
    isStarterLesson = false,
    starterCandidateItemIds = [],
    exactStarterMatches = [],
    regularTurnAccepted = false,
    directPhraseAnswer = false,
  } = {}) {
    if (directPhraseAnswer) return true;
    if (!isStarterLesson) return regularTurnAccepted;

    const candidateIds = new Set(starterCandidateItemIds);
    return exactStarterMatches.some((id) => candidateIds.has(id));
  }

  function couldPotentialTutorTurnCompleteLesson({
    lesson = selectedTutorLessonRef.current,
    isStarterLesson = isTutorStarterAgendaLesson(lesson),
    starterCandidateItemIds = [],
  } = {}) {
    if (!lesson || tutorLessonCompletionTriggeredRef.current) return false;

    const xpRequired = getTutorLessonXpRequired(lesson);
    const earnedXp = Math.max(0, Number(tutorLessonEarnedXpRef.current) || 0);
    const remainingXp = xpRequired - earnedXp;
    if (remainingXp <= 0 || remainingXp > TUTOR_TURN_XP_RANGE.max) {
      return false;
    }

    if (!isStarterLesson) return true;
    if (isTutorStarterAgendaComplete(tutorStarterAgendaProgressRef.current)) {
      return true;
    }

    const potentialProgress = { ...tutorStarterAgendaProgressRef.current };
    starterCandidateItemIds.forEach((id) => {
      potentialProgress[id] = true;
    });
    return isTutorStarterAgendaComplete(potentialProgress);
  }

  function applySuccessfulTutorTurnProgress({
    isStarterLesson = false,
    starterCandidateItemIds = [],
    successful = false,
    deferCompletionUntilIdle = false,
  } = {}) {
    if (!successful) {
      return { acceptedItemIds: [], lessonCompletionTriggered: false };
    }

    const acceptedItemIds =
      isStarterLesson && starterCandidateItemIds.length
        ? commitTutorStarterAgendaProgress(starterCandidateItemIds)
        : [];
    const starterAgendaComplete =
      isStarterLesson &&
      isTutorStarterAgendaComplete(tutorStarterAgendaProgressRef.current);
    const starterReviewAccepted =
      isStarterLesson && starterAgendaComplete && !acceptedItemIds.length;
    const canAwardXpForTurn =
      (!isStarterLesson && successful) ||
      acceptedItemIds.length > 0 ||
      starterReviewAccepted;
    let lessonCompletionTriggered = false;

    if (canAwardXpForTurn) {
      lessonCompletionTriggered =
        awardTurnXp({ deferCompletionUntilIdle })?.lessonCompletionTriggered ||
        false;
    }

    return { acceptedItemIds, lessonCompletionTriggered };
  }

  function validateTutorTurnForXpInBackground({
    text = "",
    lessonId = "",
    starterCandidateItemIds = [],
    exactStarterMatches = [],
    regularTurnAccepted = false,
    directPhraseAnswer = false,
    regularAcceptedPhrases = [],
  } = {}) {
    void (async () => {
      const turnSuccess = await judgeTutorTurnSuccessfulForXp(text, {
        starterCandidateItemIds,
        exactStarterMatches,
        regularPhraseMatch: regularTurnAccepted,
        directPhraseAnswer,
        acceptedPhrases: regularAcceptedPhrases,
      });
      if (!turnSuccess.successful) return;
      if (!aliveRef.current) return;
      if (lessonId && selectedTutorLessonRef.current?.id !== lessonId) return;

      applySuccessfulTutorTurnProgress({
        isStarterLesson: isTutorStarterAgendaLesson(
          selectedTutorLessonRef.current,
        ),
        starterCandidateItemIds,
        successful: true,
        deferCompletionUntilIdle: true,
      });
    })();
  }

  function notifyTutorFirstLessonCompleteOnce() {
    if (!pendingFirstLessonCompletionFlowRef.current) return;
    pendingFirstLessonCompletionFlowRef.current = false;
    if (tutorFirstLessonCompleteNotifiedRef.current) return;
    tutorFirstLessonCompleteNotifiedRef.current = true;
    onFirstLessonComplete?.();
  }

  function releaseTutorDailyGoalOrNotifyFirstLesson() {
    const finishSequence = () => {
      if (releaseTutorDailyGoalCelebration()) {
        pendingTutorFirstLessonNotifyAfterDailyGoalRef.current = true;
        return;
      }

      notifyTutorFirstLessonCompleteOnce();
    };

    if (typeof window === "undefined") {
      finishSequence();
      return;
    }

    window.setTimeout(finishSequence, 0);
  }

  function runAfterTutorModalClose(task) {
    if (typeof task !== "function") return;
    if (typeof window === "undefined") {
      task();
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(task, 120);
      });
    });
  }

  function closeTutorLessonCompleteModal() {
    setShowTutorLessonComplete(false);
    setCompletedTutorLessonData(null);

    if (completedTutorAgendaData) {
      setShowTutorCompletedAgenda(true);
      return;
    }

    runAfterTutorModalClose(releaseTutorDailyGoalOrNotifyFirstLesson);
  }

  function closeTutorCompletedAgendaModal() {
    setShowTutorCompletedAgenda(false);
    setCompletedTutorAgendaData(null);

    runAfterTutorModalClose(releaseTutorDailyGoalOrNotifyFirstLesson);
  }

  /* ---------------------------
     Award XP per turn (3-7 XP)
  --------------------------- */
  function awardTurnXp({ deferCompletionUntilIdle = false } = {}) {
    const npub = currentNpub;
    if (!npub) {
      return { xpGain: 0, lessonCompletionTriggered: false };
    }
    // Idempotent per turn: if this turn already awarded XP (e.g. the transcript
    // grader credited it and then the markTurnSuccessful tool call also fired),
    // do not award again.
    if (tutorXpAwardedTurnRef.current === turnCountRef.current) {
      return { xpGain: 0, lessonCompletionTriggered: false };
    }
    tutorXpAwardedTurnRef.current = turnCountRef.current;

    const xpGain =
      Math.floor(
        Math.random() * (TUTOR_TURN_XP_RANGE.max - TUTOR_TURN_XP_RANGE.min + 1),
      ) + TUTOR_TURN_XP_RANGE.min;

    setXp((v) => v + xpGain);
    const dailyGoalUpdate = applyTutorDailyGoalXpOptimistic(npub, xpGain);

    const awardPromise = (async () => {
      try {
        const awardResult = await awardXp(npub, xpGain, targetLangRef.current);
        await syncTutorDailyGoalXpFromFirestore(npub);
        logEvent(analytics, "conversation_turn_xp", { xp: xpGain });
        return awardResult;
      } catch (error) {
        console.error("Failed to award Tutor turn XP:", error);
        return null;
      }
    })();

    const lessonCompletionTriggered = trackTutorLessonXp(
      xpGain,
      awardPromise,
      dailyGoalUpdate,
      { deferCompletionUntilIdle },
    );
    if (!lessonCompletionTriggered) {
      void awardPromise;
    }

    return { xpGain, lessonCompletionTriggered };
  }

  /* ---------------------------
     Realtime event handler
  --------------------------- */
  async function handleRealtimeEvent(evt) {
    let data;
    try {
      data = JSON.parse(evt.data);
    } catch {
      return;
    }
    const t = data?.type;
    const rid = data?.response_id || data?.response?.id || data?.id || null;

    if (t === "tool.call") {
      if (!aliveRef.current) return;
      const calls = Array.isArray(data.functionCalls) ? data.functionCalls : [];
      // TEMP debug (remove after verifying tool-call grading): shows what the
      // Live model called and with what args.
      console.info("[gemini-live] tool.call", calls);
      // Circuit breaker: cap tool calls per learner turn. gemini-2.5 native audio
      // occasionally loops a tool call without ever completing the turn, leaving the
      // user stuck in "thinking". Once over budget, abort the runaway response once
      // and reopen the mic so the session can never hang.
      const toolBudget = toolCallBudgetRef.current;
      if (toolBudget.turn !== turnCountRef.current) {
        toolBudget.turn = turnCountRef.current;
        toolBudget.count = 0;
        toolBudget.broke = false;
      }
      toolBudget.count += calls.length;
      if (toolBudget.count > MAX_TOOL_CALLS_PER_TURN) {
        if (!toolBudget.broke) {
          toolBudget.broke = true;
          console.warn(
            "[gemini-live] tool-call loop detected — aborting turn to unstick the session",
          );
          try {
            dcRef.current?.send?.(JSON.stringify({ type: "response.cancel" }));
          } catch {
            // best-effort cancel; ignore if the socket is already closing
          }
          finishAssistantOutput();
        }
        return;
      }
      const responses = [];
      for (const fc of calls) {
        if (fc?.name === "markTurnSuccessful") {
          // Always answer so the live turn can continue (id is undefined on Vertex).
          responses.push(
            buildLiveToolResponse(fc, {
              ok: true,
              note: "Recorded. Continue your spoken reply and do not call markTurnSuccessful again this turn.",
            }),
          );
          const args = getLiveToolCallArgs(fc);
          if (args.correct === true && lessonPracticeStartedRef.current) {
            const lesson = selectedTutorLessonRef.current;
            const isStarterLesson = isTutorStarterAgendaLesson(lesson);
            const starterCandidateItemIds = isStarterLesson
              ? getTutorStarterAgendaCandidateItemIds()
              : [];
            // XP is deduped per turn inside awardTurnXp, so this coexists safely
            // with the transcript grader (which remains the fallback).
            applySuccessfulTutorTurnProgress({
              isStarterLesson,
              starterCandidateItemIds,
              successful: true,
              deferCompletionUntilIdle: true,
            });
          }
        } else if (fc?.name === "proposeLessonComplete") {
          // App owns completion. Approve only when the lesson's XP/agenda criteria are
          // actually met; otherwise deny so the model keeps teaching — no goodbye is
          // ever spoken because it asked first. Completion itself stays XP-driven, so
          // approval here is just permission (no app action needed).
          const allowed = !isTutorLessonPracticeInProgress();
          const toolResponse = allowed
            ? { approved: true }
            : {
                approved: false,
                instruction:
                  "The lesson is not complete yet. Do not end, summarize, or say goodbye — continue teaching the current agenda item.",
              };
          responses.push(buildLiveToolResponse(fc, toolResponse));
        } else if (fc?.name) {
          // Unknown tool: still answer so the model is not left waiting.
          responses.push(
            buildLiveToolResponse(fc, { ok: false, error: "unsupported_tool" }),
          );
        }
      }
      if (responses.length) {
        dcRef.current?.sendToolResponses?.(responses);
      }
      return;
    }

    if (t === "session.updated") {
      tutorSessionReadyRef.current = true;
      if (aliveRef.current && !tutorKickoffSentRef.current) {
        if (hasStartedTutorLessonConversation()) {
          tutorKickoffSentRef.current = true;
          setAssistantInputLocked(false);
          setUiState(status === "connected" ? "listening" : "idle");
          setMood("neutral");
          scheduleAutoStop();
        } else {
          scheduleTutorLessonKickoff(80);
        }
      }
      return;
    }

    if (!aliveRef.current) return;

    if (t === "conversation.item.created" && data?.item) {
      if (data.item?.role === "system") {
        const text = extractRealtimeItemText(data.item);
        if (
          text &&
          pendingGuardrailTextRef.current &&
          text === pendingGuardrailTextRef.current
        ) {
          guardrailItemIdsRef.current.push(data.item.id);
          pendingGuardrailTextRef.current = "";
        }
      }
      return;
    }

    if (t === "input_audio_buffer.speech_stopped") {
      commitPendingUserSpeech();
      return;
    }

    if (t === "input_audio_buffer.committed") {
      pendingUserAudioCommitRef.current = false;
      lockInputForPendingTutorResponse();
      return;
    }

    if (rid && ignoredRidSetRef.current.has(rid)) {
      if (t === "response.created") {
        try {
          dcRef.current?.send(JSON.stringify({ type: "response.cancel" }));
        } catch {}
      }
      if (
        t === "response.completed" ||
        t === "response.done" ||
        t === "response.canceled"
      ) {
        ignoredRidSetRef.current.delete(rid);
        if (t === "response.canceled" && assistantInputLockedRef.current) {
          enableVAD();
          setAssistantInputLocked(false);
          setUiState(status === "connected" ? "listening" : "idle");
          setMood("neutral");
          if (aliveRef.current) scheduleAutoStop();
        }
      }
      return;
    }

    if (t === "output_audio_buffer.stopped") {
      if (!assistantSpeakingRef.current) return;
      finishAssistantOutput();
      return;
    }

    if (
      t === "response.audio.done" ||
      t === "response.output_audio.done" ||
      t === "output_audio.done"
    ) {
      if (!assistantSpeakingRef.current) return;
      scheduleAssistantUnlockAfterQuiet();
      return;
    }

    if (t === "response.created") {
      isIdleRef.current = false;
      clearAutoStopTimer();
      disableVAD();
      // Record when this response started (user spoke before this)
      responseStartTimeRef.current = Date.now();
      assistantSpeakingRef.current = true;
      setAssistantInputLocked(true, {
        clearBuffer: false,
        updateSession: false,
      });
      const mdKind = data?.response?.metadata?.kind;
      if (mdKind === "replay") {
        replayRidSetRef.current.add(rid);
        const mid = data?.response?.metadata?.mid;
        if (mid) startRecordingForRid(rid, mid);
        setUiState("speaking");
        setMood("happy");
        return;
      }
      if (mdKind === "tutor_welcome" && rid) {
        tutorWelcomeRidSetRef.current.add(rid);
      }
      if (mdKind === "tutor_welcome" || mdKind === "tutor_kickoff") {
        tutorKickoffRetryCountRef.current = 0;
      }
      const mid = uid();
      respToMsg.current.set(rid, mid);
      setUiState("speaking");
      setMood("happy");
      startRecordingForRid(rid, mid);
      return;
    }

    if (
      (t === "conversation.item.input_audio_transcription.completed" ||
        t === "input_audio_transcription.completed") &&
      data?.transcript
    ) {
      pendingUserAudioCommitRef.current = false;
      const text = (data.transcript || "").trim();
      if (assistantSpeakingRef.current) {
        return;
      }
      if (!text) {
        resumeListeningWithAutoStop();
        return;
      }
      const now = Date.now();
      if (
        text === lastTranscriptRef.current.text &&
        now - lastTranscriptRef.current.ts < 2000
      ) {
        resumeListeningWithAutoStop();
        return;
      }
      lastTranscriptRef.current = { text, ts: now };
      // Timestamp the learner turn at "now". The transcript only commits while the
      // tutor is NOT speaking (we early-return above otherwise), so `now` always falls
      // after the tutor message being replied to and before the tutor's next reply —
      // correct chronological order. The old `responseStartTimeRef - 1` hack back-dated
      // the turn before the message it was replying to, which pushed the learner's first
      // reply above the tutor's opening (tutor starts the conversation now).
      const userTs = now;
      pushMessage({
        id: uid(),
        role: "user",
        lang: "en",
        textFinal: text,
        textStream: "",
        translation: "",
        translationLang: "",
        pairs: [],
        done: true,
        ts: userTs,
      });
      // Tutorial lesson: the learner's reply to the opening welcome is just a
      // greeting. Award no XP and make no agenda progress; instead kick off the
      // actual lesson now (the welcome was a separate, ungraded turn).
      if (tutorWelcomePendingReplyRef.current) {
        tutorWelcomePendingReplyRef.current = false;
        sendTutorStarterAgendaKickoff();
        return;
      }
      turnCountRef.current += 1;
      // Past the welcome/kickoff phase — real practice turns can now be graded.
      lessonPracticeStartedRef.current = true;
      const currentLesson = selectedTutorLessonRef.current;
      const isStarterLesson = isTutorStarterAgendaLesson(currentLesson);
      const starterCandidateItemIds = isStarterLesson
        ? getTutorStarterAgendaCandidateItemIds()
        : [];
      const exactStarterMatches = isStarterLesson
        ? getTutorStarterAgendaMatches(text, targetLangRef.current)
        : [];
      const starterCandidatePhrases = starterCandidateItemIds
        .map((id) => TUTOR_STARTER_AGENDA_ITEMS.find((item) => item.id === id))
        .filter(Boolean)
        .map((item) =>
          getTutorStarterItemModelPhrase(item, targetLangRef.current),
        );
      const regularAcceptedPhrases = !isStarterLesson
        ? getRegularTutorAcceptedPhrases()
        : [];
      const regularTurnAccepted =
        !isStarterLesson &&
        regularAcceptedPhrases.some((phrase) =>
          tutorPhraseMatchesTranscript(phrase, text),
        );
      const directPhraseAnswer = isStarterLesson
        ? anyTutorPhraseIsDirectAnswer(starterCandidatePhrases, text)
        : anyTutorPhraseIsDirectAnswer(regularAcceptedPhrases, text);
      const localTurnSuccessful = getLocalTutorTurnSuccessfulForXp({
        isStarterLesson,
        starterCandidateItemIds,
        exactStarterMatches,
        regularTurnAccepted,
        directPhraseAnswer,
      });
      // In tool-grading mode the markTurnSuccessful tool is the grader, so the
      // transcript flash judges (the lesson-completion gate and the background
      // re-check) are disabled entirely — no separate flash calls. The free local
      // matcher below still credits exact phrase matches.
      const shouldGateEndOfLesson =
        !TUTOR_TOOL_GRADING_ENABLED &&
        !localTurnSuccessful &&
        couldPotentialTutorTurnCompleteLesson({
          lesson: currentLesson,
          isStarterLesson,
          starterCandidateItemIds,
        });
      let { acceptedItemIds, lessonCompletionTriggered } =
        applySuccessfulTutorTurnProgress({
          isStarterLesson,
          starterCandidateItemIds,
          successful: localTurnSuccessful,
        });

      if (shouldGateEndOfLesson) {
        const turnSuccess = await judgeTutorTurnSuccessfulForXp(text, {
          starterCandidateItemIds,
          exactStarterMatches,
          regularPhraseMatch: regularTurnAccepted,
          directPhraseAnswer,
          acceptedPhrases: regularAcceptedPhrases,
        });
        if (!aliveRef.current) return;
        if (currentLesson?.id !== selectedTutorLessonRef.current?.id) return;
        const progressResult = applySuccessfulTutorTurnProgress({
          isStarterLesson,
          starterCandidateItemIds,
          successful: turnSuccess.successful,
        });
        acceptedItemIds = progressResult.acceptedItemIds;
        lessonCompletionTriggered = progressResult.lessonCompletionTriggered;
      } else if (!localTurnSuccessful && !TUTOR_TOOL_GRADING_ENABLED) {
        validateTutorTurnForXpInBackground({
          text,
          lessonId: currentLesson?.id || "",
          starterCandidateItemIds,
          exactStarterMatches,
          regularTurnAccepted,
          directPhraseAnswer,
          regularAcceptedPhrases,
        });
      }

      // Keep the voice loop hot: semantic grading may still update XP/progress
      // behind the scenes, but the tutor response should not wait for it.
      if (!lessonCompletionTriggered) {
        requestTutorTurnFollowup(text, acceptedItemIds);
      }
      return;
    }

    if (
      t === "conversation.item.input_audio_transcription.failed" ||
      t === "input_audio_transcription.failed"
    ) {
      pendingUserAudioCommitRef.current = false;
      resumeListeningWithAutoStop();
      return;
    }

    if (rid && replayRidSetRef.current.has(rid)) {
      if (
        t === "response.completed" ||
        t === "response.done" ||
        t === "response.canceled"
      ) {
        if (t === "response.canceled") finishAssistantOutput();
        stopRecorderAfterTail(rid);
        replayRidSetRef.current.delete(rid);
      }
      return;
    }

    if (
      (t === "response.audio_transcript.delta" ||
        t === "response.output_text.delta" ||
        t === "response.text.delta") &&
      typeof data?.delta === "string"
    ) {
      const mid = ensureMessageForResponse(rid);
      const prev = streamBuffersRef.current.get(mid) || "";
      const nextText = sanitizeTutorAssistantText(prev + data.delta, {
        trim: false,
      });
      streamBuffersRef.current.set(mid, nextText);
      scheduleStreamFlush();
      return;
    }

    if (
      (t === "response.audio_transcript.done" ||
        t === "response.output_text.done" ||
        t === "response.text.done") &&
      typeof data?.text === "string"
    ) {
      const mid = ensureMessageForResponse(rid);
      const buf = streamBuffersRef.current.get(mid) || "";
      if (buf) {
        streamBuffersRef.current.set(mid, "");
        updateMessage(mid, (m) => ({
          ...m,
          textStream: sanitizeTutorAssistantText((m.textStream || "") + buf, {
            trim: false,
          }),
        }));
      }
      const doneText = sanitizeTutorAssistantText(data.text);
      updateMessage(mid, (m) => ({
        ...m,
        textFinal: sanitizeTutorAssistantText(
          `${m.textFinal || ""} ${doneText}`,
        ),
        textStream: "",
      }));
      void recoverFromSemanticTutorClosingAct(rid, mid);
      return;
    }

    if (
      t === "response.completed" ||
      t === "response.done" ||
      t === "response.canceled"
    ) {
      const mdKind = data?.response?.metadata?.kind;
      const responseStartTimedOut = /did not start a response/i.test(
        data?.error?.message || "",
      );
      if (
        t === "response.canceled" &&
        responseStartTimedOut &&
        (mdKind === "tutor_welcome" || mdKind === "tutor_kickoff") &&
        !hasStartedTutorLessonConversation() &&
        tutorKickoffRetryCountRef.current < 1 &&
        aliveRef.current
      ) {
        tutorKickoffRetryCountRef.current += 1;
        tutorKickoffSentRef.current = false;
        tutorWelcomePendingReplyRef.current = false;
        finishAssistantOutput();
        scheduleTutorLessonKickoff(350);
        return;
      }
      if (t === "response.canceled" && assistantInputLockedRef.current) {
        finishAssistantOutput();
      }
      if (
        t !== "response.canceled" &&
        assistantSpeakingRef.current &&
        assistantInputLockedRef.current &&
        !assistantUnlockTimerRef.current
      ) {
        scheduleAssistantUnlockAfterQuiet();
      }
      stopRecorderAfterTail(rid);
      isIdleRef.current = true;
      idleWaitersRef.current.splice(0).forEach((fn) => {
        try {
          fn();
        } catch {}
      });
      const mid = rid && respToMsg.current.get(rid);
      if (mid) {
        const buf = streamBuffersRef.current.get(mid) || "";
        if (buf) {
          streamBuffersRef.current.set(mid, "");
          updateMessage(mid, (m) => ({
            ...m,
            textStream: "",
            textFinal: sanitizeTutorAssistantText(
              `${m.textFinal || ""} ${buf}`,
            ),
          }));
        }
        updateMessage(mid, (m) => ({ ...m, done: true }));
        void recoverFromSemanticTutorClosingAct(rid, mid);
        logEvent(analytics, "conversation_turn", {
          action: "turn_completed",
        });

        respToMsg.current.delete(rid);
      }
      return;
    }

    if (t === "error" && data?.error?.message) {
      const msg = data.error.message || "";
      if (/Cancellation failed/i.test(msg) || /no active response/i.test(msg))
        return;
      if (/input_audio_buffer|audio buffer|buffer is empty/i.test(msg)) {
        pendingUserAudioCommitRef.current = false;
        return;
      }
      setErr((p) => p || msg);
      if (assistantInputLockedRef.current && !assistantSpeakingRef.current) {
        resumeListeningWithAutoStop();
      }
    }
  }

  function ensureMessageForResponse(rid) {
    let mid = respToMsg.current.get(rid);
    if (!mid) {
      mid = uid();
      respToMsg.current.set(rid, mid);
    }
    const exists = messagesRef.current.some((m) => m.id === mid);
    if (!exists) {
      const isWelcome = tutorWelcomeRidSetRef.current.has(rid);
      pushMessage({
        id: mid,
        role: "assistant",
        lang: isWelcome
          ? normalizeSupportLanguage(
              supportLangRef.current || resolvedSupportLang,
              DEFAULT_SUPPORT_LANGUAGE,
            )
          : targetLangRef.current || "es",
        textFinal: "",
        textStream: "",
        translation: "",
        translationLang: "",
        pairs: [],
        done: false,
        hasAudio: false,
        welcome: isWelcome,
        ts: Date.now(),
      });
    }
    return mid;
  }

  function pushMessage(m) {
    if (!messagesRef.current.some((existing) => existing.id === m.id)) {
      messagesRef.current = [...messagesRef.current, m];
    }
    setMessages((p) => {
      // Prevent duplicate messages with same ID
      if (p.some((existing) => existing.id === m.id)) {
        return p;
      }
      return [...p, m];
    });
  }

  function updateMessage(id, fn) {
    messagesRef.current = messagesRef.current.map((m) =>
      m.id === id ? fn(m) : m,
    );
    setMessages((p) => p.map((m) => (m.id === id ? fn(m) : m)));
  }

  function removeMessage(id) {
    messagesRef.current = messagesRef.current.filter((m) => m.id !== id);
    setMessages((p) => p.filter((m) => m.id !== id));
  }

  /* ---------------------------
     Translation
  --------------------------- */
  async function translateMessage(id) {
    const m = messagesRef.current.find((x) => x.id === id);
    if (!m) return;
    const src = sanitizeTutorAssistantText(
      `${m.textFinal || ""} ${m.textStream || ""}`,
    );
    if (!src) return;
    if (m.role !== "assistant") return;

    const target = normalizeSupportLanguage(
      resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );

    if (getBaseLanguageCode(m.lang || targetLangRef.current) === target) {
      updateMessage(id, (prev) => ({
        ...prev,
        translation: src,
        translationLang: target,
        pairs: [],
      }));
      return;
    }

    const sourceLanguage = getBaseLanguageCode(
      m.lang || targetLangRef.current || "",
    );
    const prompt = buildMessageTranslationPrompt(target, sourceLanguage);

    const body = {
      model: TRANSLATE_MODEL,
      text: { format: { type: "text" } },
      input: `${prompt}\n\n${src}`,
    };

    const r = await appCheckFetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const ct = r.headers.get("content-type") || "";
    const payload = ct.includes("application/json")
      ? await r.json()
      : await r.text();
    if (!r.ok) {
      const msg =
        payload?.error?.message ||
        (typeof payload === "string" ? payload : JSON.stringify(payload));
      throw new Error(msg || `Translate HTTP ${r.status}`);
    }

    const mergedText =
      (typeof payload?.output_text === "string" && payload.output_text) ||
      (Array.isArray(payload?.output) &&
        payload.output
          .map((it) =>
            (it?.content || []).map((seg) => seg?.text || "").join(""),
          )
          .join(" ")
          .trim()) ||
      (Array.isArray(payload?.content) && payload.content[0]?.text) ||
      (Array.isArray(payload?.choices) &&
        (payload.choices[0]?.message?.content || "")) ||
      "";

    const parsed = safeParseJson(mergedText);
    const translation = (parsed?.translation || mergedText || "").trim();
    const rawPairs = Array.isArray(parsed?.pairs) ? parsed.pairs : [];
    const pairs = tidyPairs(rawPairs, src);

    updateMessage(id, (prev) => ({
      ...prev,
      translation,
      translationLang: target,
      pairs,
    }));
  }

  async function handleManualTranslate(id) {
    const previousUiState = uiState;
    setTranslatingMessageId(id);
    setUiState("thinking");
    try {
      await translateMessage(id);
    } catch {}
    setTranslatingMessageId(null);
    if (status === "connected") {
      setUiState("listening");
    } else {
      setUiState(previousUiState === "thinking" ? "idle" : previousUiState);
    }
  }

  const lessonAgendaTitle = getTutorLessonAgendaTitle(
    selectedTutorLesson,
    selectedTutorUnit,
    uiLang,
  );
  const isLessonAgendaLoading =
    isTutorPathLoading || (isTutorAgendaHydrating && !selectedTutorLesson);
  const showGentleInlineFeedback =
    inlineFeedbackKind === "incorrect" && !!inlineFeedback;
  const selectedTutorLessonProgressStatus = selectedTutorLesson
    ? tutorUserProgress.lessons?.[selectedTutorLesson.id]?.status ||
      (tutorLessonCompletionTriggeredRef.current
        ? SKILL_STATUS.COMPLETED
        : SKILL_STATUS.IN_PROGRESS)
    : SKILL_STATUS.AVAILABLE;
  const lessonCompletionRing = useMemo(() => {
    const lesson = selectedTutorLesson;
    if (!lesson) {
      return {
        percent: 0,
        isComplete: false,
        label: tutorCopy(uiLang, {
          en: "Lesson progress",
          es: "Progreso de la leccion",
          pt: "Progresso da licao",
          it: "Progresso della lezione",
          fr: "Progression de la lecon",
          ja: "レッスンの進捗",
          hi: "पाठ प्रगति",
          ar: "تقدّم الدرس",
          zh: "课程进度",
        }),
      };
    }

    if (selectedTutorLessonProgressStatus === SKILL_STATUS.COMPLETED) {
      return {
        percent: 100,
        isComplete: true,
        label: tutorCopy(uiLang, {
          en: "Lesson complete",
          es: "Leccion completada",
          pt: "Licao completa",
          it: "Lezione completata",
          fr: "Lecon terminee",
          ja: "レッスン完了",
          hi: "पाठ पूरा हुआ",
          ar: "الدرس اكتمل",
          zh: "课程完成",
        }),
      };
    }

    const required = getTutorLessonXpRequired(lesson);
    const earned = Math.min(required, Math.max(0, tutorLessonEarnedXp || 0));
    const percent = required > 0 ? Math.round((earned / required) * 100) : 100;
    const starterAgendaComplete =
      !isTutorStarterAgendaLesson(lesson) ||
      isTutorStarterAgendaComplete(tutorStarterAgendaProgress);
    return {
      percent,
      isComplete: percent >= 100 && starterAgendaComplete,
      label:
        required > 0
          ? `${earned}/${required} XP`
          : tutorCopy(uiLang, {
              en: "Lesson complete",
              es: "Leccion completada",
              pt: "Licao completa",
              it: "Lezione completata",
              fr: "Lecon terminee",
              ja: "レッスン完了",
              hi: "पाठ पूरा हुआ",
              ar: "الدرس اكتمل",
              zh: "课程完成",
            }),
    };
  }, [
    selectedTutorLesson,
    selectedTutorLessonProgressStatus,
    tutorLessonEarnedXp,
    tutorStarterAgendaProgress,
    uiLang,
  ]);
  /* ---------------------------
     Render
  --------------------------- */
  return (
    <>
      <TutorViewportEdgeGlow
        enabled={isActive}
        state={edgeGlowState}
        isLightTheme={isLightTheme}
      />
      <Box color="gray.100" position="relative" pb="120px">
        {/* Header area: lesson agenda separated from robot */}
        <VStack px={4} mt={0} spacing={1} align="center">
          <Box
            p={2}
            rounded="2xl"
            border="1px solid"
            borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.06)"}
            width="100%"
            maxWidth="400px"
            sx={{
              ...(isLightTheme ? PAPER_PANEL_SX : MATRIX_PANEL_SX),
              overflow: "visible",
            }}
            boxShadow={isLightTheme ? APP_SHADOW : undefined}
          >
            <VStack spacing={3} align="center" width="100%">
              <HStack width="100%" justify="space-between" align="center">
                <Button
                  leftIcon={<RiRoadMapLine />}
                  size="xs"
                  variant="ghost"
                  onClick={handleTutorPathOpen}
                  opacity={0.78}
                  color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                  _hover={{
                    opacity: 1,
                    bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
                  }}
                  fontWeight="medium"
                >
                  {tutorCopy(uiLang, {
                    en: "Lessons",
                    es: "Lecciones",
                    pt: "Lições",
                    it: "Lezioni",
                    fr: "Leçons",
                    ja: "レッスン",
                    hi: "पाठ",
                    ar: "الدروس",
                    zh: "课程",
                  })}
                </Button>
                <HStack spacing={2}>
                  <TutorLessonProgressRing
                    percent={lessonCompletionRing.percent}
                    label={lessonCompletionRing.label}
                    isComplete={lessonCompletionRing.isComplete}
                    isLightTheme={isLightTheme}
                  />
                  <IconButton
                    ref={chatLogButtonRef}
                    icon={<FaRegCommentDots size={14} />}
                    size="xs"
                    variant="ghost"
                    colorScheme="cyan"
                    {...chatLogButtonHighlightProps}
                    onClick={openTranscript}
                    _hover={{ opacity: 1 }}
                    isDisabled={!timeline.length}
                    aria-label={uiText("ra_chat_log", "Chat log")}
                  />
                </HStack>
              </HStack>

              {/* Lesson agenda */}
              <VStack spacing={2} align="center" width="100%">
                <HStack
                  spacing={2}
                  align="center"
                  width="100%"
                  justify="center"
                >
                  {isLessonAgendaLoading ? (
                    <>
                      <VoiceOrb
                        state={getRealtimeOrbVisualState(
                          ["idle", "listening", "speaking"][
                            Math.floor(Math.random() * 3)
                          ],
                        )}
                        size={24}
                        theme={isLightTheme ? "light" : "dark"}
                      />
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        textAlign="center"
                        color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                        flex="1"
                      >
                        {tutorCopy(uiLang, {
                          en: "Loading lesson agenda...",
                          es: "Cargando agenda de la leccion...",
                          pt: "Carregando agenda da licao...",
                          it: "Caricamento agenda della lezione...",
                          fr: "Chargement du programme...",
                          de: "Lektionsagenda wird geladen...",
                          ja: "レッスン内容を読み込み中...",
                          hi: "पाठ एजेंडा लोड हो रहा है...",
                          ar: "بنحمّل خطة الدرس...",
                          zh: "正在加载课程安排...",
                        })}
                      </Text>
                    </>
                  ) : (
                    <VStack spacing={1} align="center" flex="1" minW={0}>
                      <Text
                        fontSize="md"
                        fontWeight="bold"
                        textAlign="center"
                        color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                        w="100%"
                        sx={MOBILE_TEXT_SX}
                      >
                        {lessonAgendaTitle}
                      </Text>
                    </VStack>
                  )}
                </HStack>
              </VStack>

              {/* XP Progress Bar */}
              <Box w="100%">
                <XpProgressHeader
                  levelText={`${uiText("ra_label_level", "Level")} ${xpLevelNumber}`}
                  xpText={`${uiText("ra_label_xp", "XP")} ${xp}`}
                  progressPct={progressPct}
                  xpBadgeProps={{ colorScheme: "teal", fontSize: "10px" }}
                />
              </Box>
            </VStack>
          </Box>

          <VStack spacing={0.5} align="center">
            <Box
              width={voiceOrbWrapWidth}
              opacity={0.95}
              flexShrink={0}
              position="relative"
            >
              {previousRobotState && (
                <Box
                  position="absolute"
                  inset={0}
                  opacity={isRobotTransitioning ? 0 : 1}
                  transition="opacity 0.5s ease"
                >
                  <VoiceOrb
                    state={previousOrbState}
                    theme={isLightTheme ? "light" : "dark"}
                    size={voiceOrbSize}
                  />
                </Box>
              )}
              <Box opacity={1} transition="opacity 0.5s ease">
                <VoiceOrb
                  state={displayOrbState}
                  theme={isLightTheme ? "light" : "dark"}
                  size={voiceOrbSize}
                />
              </Box>
            </Box>
            {status === "connected" && uiStateLabel(liveUiState, uiLang) && (
              <Text
                fontSize="xs"
                color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
              >
                {uiStateLabel(liveUiState, uiLang)}
              </Text>
            )}
          </VStack>
        </VStack>

        {/* Centered live reply */}
        <Box px={4} mt="6px">
          <VStack w="100%" maxW="640px" mx="auto" spacing={2} align="stretch">
            {latestAssistantMessage ? (
              <Box
                w="100%"
                minH={{ base: "150px", md: "165px" }}
                display="flex"
                alignItems="stretch"
                justifyContent="flex-start"
                position="relative"
              >
                <Box w="100%" position="relative" zIndex={1}>
                  <AlignedBubble
                    containerRef={liveBubbleSurfaceRef}
                    primaryTextRef={liveBubbleTextRef}
                    contentOpacity={shouldMuteIncomingBubble ? 0 : 1}
                    contentTransform={
                      shouldMuteIncomingBubble
                        ? "translateY(10px) scale(0.985)"
                        : "translateY(0px) scale(1)"
                    }
                    primaryText={getTutorMessageVisibleText(
                      latestAssistantMessage,
                    )}
                    primaryLang={
                      latestAssistantMessage.lang || targetLang || "es"
                    }
                    secondaryText={
                      showTranslations
                        ? normalizeSupportLanguage(
                            latestAssistantMessage.translationLang,
                            "",
                          ) === resolvedSupportLang
                          ? latestAssistantMessage.translation || ""
                          : ""
                        : ""
                    }
                    secondaryLang={resolvedSupportLang}
                    pairs={
                      normalizeSupportLanguage(
                        latestAssistantMessage.translationLang,
                        "",
                      ) === resolvedSupportLang
                        ? latestAssistantMessage.pairs || []
                        : []
                    }
                    showSecondary={showTranslations}
                    isTranslating={
                      translatingMessageId === latestAssistantMessage.id
                    }
                    canTranslate={false}
                    onTranslate={() =>
                      handleManualTranslate(latestAssistantMessage.id)
                    }
                    canReplay={
                      !!getTutorMessageVisibleText(latestAssistantMessage)
                    }
                    onReplay={() => playSavedClip(latestAssistantMessage.id)}
                    isReplaying={replayingId === latestAssistantMessage.id}
                    replayLabel={uiText("ra_btn_replay", "Replay")}
                    feedbackText={
                      showGentleInlineFeedback ? inlineFeedback : ""
                    }
                    feedbackLang={resolvedSupportLang}
                  />
                </Box>
              </Box>
            ) : null}
          </VStack>
        </Box>

        {/* Bottom dock - Connect button only */}
        <Center
          position="fixed"
          bottom="22px"
          left="0"
          right="0"
          zIndex={30}
          px={4}
        >
          <HStack spacing={3} w="100%" maxW="560px" justify="center">
            <Button
              onClick={status === "connected" ? stop : start}
              size="lg"
              height="64px"
              px={{ base: 8, md: 12 }}
              rounded="full"
              colorScheme={status === "connected" ? undefined : "cyan"}
              bg={
                status === "connected"
                  ? SOFT_STOP_BUTTON_BG
                  : isLightTheme
                    ? "linear-gradient(180deg, #40c6d9 0%, #2fb4c7 100%)"
                    : undefined
              }
              boxShadow={
                status === "connected"
                  ? SOFT_STOP_BUTTON_GLOW
                  : isLightTheme
                    ? "0 10px 24px rgba(66, 168, 181, 0.22), 0 4px 0 rgba(41, 126, 136, 0.82)"
                    : undefined
              }
              _hover={
                status === "connected"
                  ? { bg: SOFT_STOP_BUTTON_HOVER_BG }
                  : isLightTheme
                    ? {
                        bg: "linear-gradient(180deg, #35bfd3 0%, #27adc0 100%)",
                      }
                    : undefined
              }
              color={
                status === "connected"
                  ? "white"
                  : isLightTheme
                    ? "white"
                    : "white"
              }
              border={
                isLightTheme && status !== "connected"
                  ? "1px solid rgba(255,255,255,0.55)"
                  : undefined
              }
              textShadow={isLightTheme ? "none" : "0 0 16px rgba(0,0,0,0.9)"}
              mb={20}
            >
              {status === "connected" ? (
                <>
                  <FaStop /> &nbsp; {uiText("ra_btn_end", "End")}
                </>
              ) : (
                <>
                  <PiMicrophoneStageDuotone /> &nbsp;{" "}
                  {status === "connecting"
                    ? uiText("ra_btn_starting", "Starting...")
                    : uiText("ra_btn_start", "Start")}
                </>
              )}
            </Button>
          </HStack>
        </Center>

        {err && (
          <Box px={4} pt={2}>
            <Box
              as="pre"
              bg="rgba(255,255,255,0.06)"
              border="1px solid rgba(255,255,255,0.12)"
              p={3}
              borderRadius={8}
              whiteSpace="pre-wrap"
              color="#fee2e2"
            >
              {err}
            </Box>
          </Box>
        )}

        {/* remote live audio sink */}
        <audio ref={audioRef} />
      </Box>

      <ArchiveTextAnimation animation={archiveAnimation} />

      <Modal
        isOpen={isTutorPathOpen}
        onClose={closeTutorPath}
        size="full"
        scrollBehavior="inside"
        motionPreset="none"
      >
        <ModalOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
          bg={isLightTheme ? APP_SURFACE : "gray.950"}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
          >
            <HStack justify="space-between" pr={8}>
              <HStack spacing={3}>
                <Box
                  w={9}
                  h={9}
                  borderRadius="full"
                  bg="cyan.500"
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <RiRoadMapLine size={20} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="bold">
                    {uiText("app_mode_path", "Path")}
                  </Text>
                  <Text fontSize="xs" color="var(--app-text-secondary)">
                    {tutorCopy(uiLang, {
                      en: "Choose a lesson to shape the Tutor agenda",
                      es: "Elige una leccion para guiar la agenda",
                      pt: "Escolha uma licao para guiar a agenda",
                      it: "Scegli una lezione per guidare l'agenda",
                      fr: "Choisis une lecon pour guider le programme",
                      ja: "チューターの内容に使うレッスンを選択",
                      hi: "Tutor एजेंडा के लिए पाठ चुनें",
                      ar: "اختار درس يوجّه خطة المعلّم",
                      zh: "选择课程来引导导师安排",
                    })}
                  </Text>
                </VStack>
              </HStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={{ base: 3, md: 6 }} py={5}>
            <VStack spacing={6} align="stretch" maxW="container.lg" mx="auto">
              <TutorPathLevelHeader
                activeLevel={activeTutorLevel}
                currentLevel={getUnlockedTutorLevel(maxProficiencyLevel)}
                levelProgress={activeTutorLevelProgress}
                levelCompletionStatus={tutorLevelCompletionStatus}
                supportLang={uiLang}
                onLevelChange={handleTutorLevelChange}
              />

              {selectedTutorLesson && (
                <Box
                  border="1px solid"
                  borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
                  bg={isLightTheme ? APP_SURFACE_ELEVATED : "whiteAlpha.100"}
                  borderRadius="xl"
                  p={4}
                >
                  <HStack justify="space-between" align="start" spacing={4}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="var(--app-text-secondary)">
                        {tutorCopy(uiLang, {
                          en: "Current Tutor lesson",
                          es: "Leccion actual",
                          pt: "Licao atual",
                          it: "Lezione attuale",
                          fr: "Lecon actuelle",
                          ja: "現在のレッスン",
                          hi: "मौजूदा पाठ",
                          ar: "الدرس الحالي",
                          zh: "当前课程",
                        })}
                      </Text>
                      <Text fontWeight="bold">
                        {getTutorDisplayText(selectedTutorLesson.title, uiLang)}
                      </Text>
                    </VStack>
                    <Badge colorScheme="cyan" flexShrink={0}>
                      {Math.min(
                        getTutorLessonXpRequired(selectedTutorLesson),
                        selectedTutorLessonProgressStatus ===
                          SKILL_STATUS.COMPLETED
                          ? getTutorLessonXpRequired(selectedTutorLesson)
                          : tutorLessonEarnedXp,
                      )}
                      /{getTutorLessonXpRequired(selectedTutorLesson)} XP
                    </Badge>
                  </HStack>
                </Box>
              )}

              {isTutorPathLoading ? (
                <Center minH="320px">
                  <VStack spacing={3}>
                    <Spinner color="cyan.300" size="lg" />
                    <Text fontSize="sm" color="var(--app-text-secondary)">
                      {tutorCopy(uiLang, {
                        en: "Loading path...",
                        es: "Cargando ruta...",
                        pt: "Carregando rota...",
                        it: "Caricamento percorso...",
                        fr: "Chargement du parcours...",
                        ja: "パスを読み込み中...",
                        hi: "पथ लोड हो रहा है...",
                        ar: "بنحمّل المسار...",
                        zh: "正在加载路径...",
                      })}
                    </Text>
                  </VStack>
                </Center>
              ) : visibleTutorUnits.length ? (
                <VStack spacing={8} align="stretch">
                  {visibleTutorUnits.map((unit, index) => (
                    <TutorPathUnit
                      key={unit.id}
                      unit={unit}
                      unitIndex={index}
                      visibleUnits={visibleTutorUnits}
                      userProgress={tutorUserProgress}
                      supportLang={uiLang}
                      getLessonStatus={getTutorLessonStatus}
                      getLessonEarnedPercent={getTutorLessonEarnedPercent}
                      onLessonSelect={handleTutorLessonSelect}
                    />
                  ))}
                </VStack>
              ) : (
                <Center minH="260px">
                  <Text color="var(--app-text-secondary)">
                    {tutorCopy(uiLang, {
                      en: "No lessons found for this level yet.",
                      es: "Aun no hay lecciones para este nivel.",
                      pt: "Ainda nao ha licoes para este nivel.",
                      it: "Non ci sono ancora lezioni per questo livello.",
                      fr: "Aucune lecon pour ce niveau pour l'instant.",
                      ja: "このレベルのレッスンはまだありません。",
                      hi: "इस स्तर के लिए अभी कोई पाठ नहीं है।",
                      ar: "مفيش دروس للمستوى ده لسه.",
                      zh: "这个等级还没有课程。",
                    })}
                  </Text>
                </Center>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showTutorLessonComplete}
        onClose={closeTutorLessonCompleteModal}
        isCentered
        size="lg"
        motionPreset="none"
      >
        <ModalOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="white"
          borderRadius="2xl"
          boxShadow="2xl"
          maxW={{ base: "90%", sm: "md" }}
        >
          <ModalBody py={12} px={8}>
            <VStack spacing={6} textAlign="center">
              <Box
                bg="rgba(255,255,255,0.2)"
                borderRadius="full"
                p={4}
                border="2px solid"
                borderColor="rgba(255,255,255,0.3)"
                boxShadow="0 20px 40px rgba(0,0,0,0.18)"
              >
                <RandomCharacter
                  key={`${completedTutorLessonData?.lessonId || "tutor"}-${
                    showTutorLessonComplete ? "open" : "closed"
                  }`}
                  width="96px"
                  notSoRandomCharacter="27"
                />
              </Box>
              <VStack spacing={2}>
                <Text fontSize="3xl" fontWeight="bold">
                  {tutorCopy(uiLang, {
                    en: "Lesson Complete!",
                    es: "Leccion completada!",
                    pt: "Licao concluida!",
                    it: "Lezione completata!",
                    fr: "Lecon terminee !",
                    ja: "レッスン完了！",
                    hi: "पाठ पूरा हुआ!",
                    ar: "الدرس اكتمل!",
                    zh: "课程完成！",
                  })}
                </Text>
                <Text fontSize="lg" opacity={0.9}>
                  {getTutorDisplayText(completedTutorLessonData?.title, uiLang)}
                </Text>
              </VStack>
              <Box
                bg="rgba(255,255,255,0.2)"
                borderRadius="xl"
                py={6}
                px={8}
                width="100%"
                border="2px solid"
                borderColor="rgba(255,255,255,0.4)"
              >
                <VStack spacing={2}>
                  <Text
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="0"
                    opacity={0.8}
                  >
                    {tutorCopy(uiLang, {
                      en: "XP Gained",
                      es: "XP ganado",
                      pt: "XP ganho",
                      it: "XP guadagnati",
                      fr: "XP gagne",
                      ja: "獲得XP",
                      hi: "कमाया XP",
                      ar: "XP مكتسب",
                      zh: "获得 XP",
                    })}
                  </Text>
                  <Text fontSize="5xl" fontWeight="bold" color="yellow.300">
                    {completedTutorLessonData?.xpEarned || 0}
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              size="lg"
              width="100%"
              bg="white"
              color="purple.600"
              _hover={{ bg: "rgba(255,255,255,0.92)" }}
              onClick={closeTutorLessonCompleteModal}
              fontWeight="bold"
            >
              {tutorCopy(uiLang, {
                en: "Continue",
                es: "Continuar",
                pt: "Continuar",
                it: "Continua",
                fr: "Continuer",
                ja: "続ける",
                hi: "जारी रखें",
                ar: "كمّل",
                zh: "继续",
              })}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showTutorCompletedAgenda}
        onClose={closeTutorCompletedAgendaModal}
        isCentered
        size="xl"
        motionPreset="none"
      >
        <ModalOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
          mx={3}
          my={{ base: 6, md: 10 }}
          maxH={{ base: "calc(100dvh - 48px)", md: "calc(100dvh - 80px)" }}
          overflow="hidden"
          borderRadius="2xl"
          border="1px solid"
          borderColor={isLightTheme ? "rgba(120,94,61,0.18)" : "whiteAlpha.200"}
          bg={
            isLightTheme
              ? "linear-gradient(180deg, rgba(255,251,245,0.98) 0%, rgba(248,239,226,0.98) 100%)"
              : "linear-gradient(180deg, rgba(12,18,32,0.98) 0%, rgba(4,8,18,0.98) 100%)"
          }
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          boxShadow={
            isLightTheme
              ? "0 24px 60px rgba(120,94,61,0.22)"
              : "0 24px 70px rgba(0,0,0,0.45), 0 0 40px rgba(45,212,191,0.12)"
          }
        >
          <ModalHeader px={{ base: 5, md: 8 }} pt={7} pb={2}>
            <VStack align="start" spacing={2}>
              <Heading size="lg" lineHeight="1.1">
                {tutorCopy(uiLang, {
                  en: "Lesson Review",
                  es: "Repaso de la leccion",
                  pt: "Revisao da licao",
                  it: "Ripasso della lezione",
                  fr: "Revision de la lecon",
                  de: "Lektionsrueckblick",
                  ja: "レッスン復習",
                  hi: "पाठ समीक्षा",
                  ar: "مراجعة الدرس",
                  zh: "课程回顾",
                })}
              </Heading>
              <Text
                fontSize="md"
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                fontWeight="600"
              >
                {completedTutorAgendaData?.title}
              </Text>
            </VStack>
          </ModalHeader>
          <ModalBody px={{ base: 5, md: 8 }} py={5} overflowY="auto">
            <Box
              p={{ base: 4, md: 5 }}
              rounded="2xl"
              bg={
                isLightTheme ? "rgba(255,255,255,0.62)" : "rgba(15,23,42,0.68)"
              }
              border="1px solid"
              borderColor={
                isLightTheme ? "rgba(120,94,61,0.14)" : "whiteAlpha.100"
              }
            >
              <VStack spacing={3} align="stretch">
                {(completedTutorAgendaData?.items || []).map((agendaItem) => (
                  <HStack
                    key={agendaItem.id}
                    align="flex-start"
                    spacing={3}
                    py={2}
                    px={1}
                    rounded="xl"
                  >
                    <Center
                      flexShrink={0}
                      w="22px"
                      h="22px"
                      rounded="full"
                      bg={
                        agendaItem.completed
                          ? isLightTheme
                            ? "teal.500"
                            : "teal.400"
                          : isLightTheme
                            ? "gray.100"
                            : "whiteAlpha.200"
                      }
                      color={
                        agendaItem.completed
                          ? "white"
                          : isLightTheme
                            ? "gray.500"
                            : "gray.300"
                      }
                    >
                      <RiCheckLine size={14} />
                    </Center>
                    <VStack align="stretch" spacing={1} flex={1} minW={0}>
                      <Text
                        fontSize="xs"
                        color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
                        fontWeight="700"
                        textTransform="capitalize"
                      >
                        {agendaItem.task}
                      </Text>
                      <Text
                        fontSize={{ base: "md", md: "lg" }}
                        fontWeight="900"
                        color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                        {...getBidiTextProps(
                          agendaItem.phrase,
                          completedTutorAgendaData?.targetLang || targetLang,
                        )}
                      >
                        {agendaItem.phrase}
                      </Text>
                      {agendaItem.meaning &&
                        agendaItem.meaning !== agendaItem.phrase && (
                          <Text
                            fontSize="xs"
                            color={
                              isLightTheme ? APP_TEXT_SECONDARY : "gray.300"
                            }
                          >
                            {agendaItem.meaning}
                          </Text>
                        )}
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </ModalBody>
          <ModalFooter px={{ base: 5, md: 8 }} pb={7} pt={2}>
            <Button
              width="100%"
              size="lg"
              rounded="xl"
              bg="teal.500"
              color="white"
              fontWeight="900"
              boxShadow="0px 4px 0px teal"
              _hover={{
                bg: "teal.400",
                transform: "translateY(1px)",
                boxShadow: "0px 3px 0px teal",
              }}
              _active={{ transform: "translateY(4px)", boxShadow: "none" }}
              onClick={closeTutorCompletedAgendaModal}
            >
              {tutorCopy(uiLang, {
                en: "Continue",
                es: "Continuar",
                pt: "Continuar",
                it: "Continua",
                fr: "Continuer",
                ja: "続ける",
                hi: "जारी रखें",
                ar: "كمّل",
                zh: "继续",
              })}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isTranscriptOpen}
        onClose={closeTranscript}
        size="xl"
        motionPreset="none"
      >
        <ModalOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
          bg="gray.800"
          color="gray.100"
          mx={3}
        >
          <ModalHeader>
            {uiText("ra_conversation_log", "Conversation log")}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={5}>
            <VStack align="stretch" spacing={3}>
              {conversationLog.map((m) => {
                const isUser = m.role === "user";
                if (isUser) {
                  return (
                    <RowRight key={m.id}>
                      <UserBubble
                        label={ui.ra_label_you}
                        text={m.textFinal}
                        textLang={targetLang}
                      />
                    </RowRight>
                  );
                }

                const primaryText = getTutorMessageVisibleText(m);
                const secondaryText =
                  normalizeSupportLanguage(m.translationLang, "") ===
                  resolvedSupportLang
                    ? m.translation || ""
                    : "";

                if (!primaryText.trim()) return null;
                return (
                  <RowLeft key={m.id}>
                    <AlignedBubble
                      primaryText={primaryText}
                      primaryLang={m.lang || targetLang || "es"}
                      secondaryText={showTranslations ? secondaryText : ""}
                      secondaryLang={resolvedSupportLang}
                      pairs={
                        normalizeSupportLanguage(m.translationLang, "") ===
                        resolvedSupportLang
                          ? m.pairs || []
                          : []
                      }
                      showSecondary={showTranslations}
                      isTranslating={translatingMessageId === m.id}
                      canTranslate={false}
                      onTranslate={() => handleManualTranslate(m.id)}
                      canReplay={!!getTutorMessageVisibleText(m)}
                      onReplay={() => playSavedClip(m.id)}
                      isReplaying={replayingId === m.id}
                      replayLabel={uiText("ra_btn_replay", "Replay")}
                    />
                  </RowLeft>
                );
              })}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
