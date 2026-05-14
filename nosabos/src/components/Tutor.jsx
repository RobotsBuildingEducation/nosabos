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
import { database, analytics } from "../firebaseResources/firebaseResources";
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
  startTutorLesson,
} from "../utils/progressTracking";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_GLOW,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";
import { DEFAULT_TTS_VOICE, getPreferredTTSVoice } from "../utils/tts";
import { getCEFRPromptHint } from "../utils/cefrUtils";
import {
  loadMultiLevelLearningPath,
  SKILL_STATUS,
} from "../data/skillTree/index.js";
import useSoundSettings from "../hooks/useSoundSettings";
import submitActionSound from "../assets/submitaction.mp3";
import XpProgressHeader from "./XpProgressHeader";
import RandomCharacter from "./RandomCharacter";
import { useThemeStore } from "../useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  getLanguagePromptName,
  normalizeSupportLanguage,
} from "../constants/languages";
import {
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "../utils/modalMotion";

const TUTOR_REALTIME_MODEL =
  (import.meta.env.VITE_TUTOR_REALTIME_MODEL || "gpt-realtime") + "";

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL
  ? `${import.meta.env.VITE_REALTIME_URL}?model=${encodeURIComponent(
      TUTOR_REALTIME_MODEL,
    )}`
  : "";

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
  "You are a language tutor. You must pronounce words correctly when code switching and changing languages.";

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

function buildTutorLessonContext(lesson, unit, lang = "en") {
  if (!lesson) return null;
  const subjects = getTutorLessonSubjects(lesson);
  const title = getTutorDisplayText(lesson.title, lang);
  const description = getTutorDisplayText(lesson.description, lang);
  const unitTitle = getTutorDisplayText(unit?.title, lang);
  const agendaTitle = getTutorLessonAgendaTitle(lesson, unit, lang);
  const agendaSubtitle = getTutorLessonAgendaSubtitle(lesson, unit, lang);
  const includeSourceDetails = !isTutorStarterAgendaLesson(lesson);
  return {
    level: unit?.cefrLevel || unit?.level || "",
    title,
    description,
    unitTitle,
    agendaTitle,
    agendaSubtitle,
    subjects,
    promptText: compactUnique([
      includeSourceDetails && unitTitle ? `Unit: ${unitTitle}` : "",
      agendaTitle ? `Agenda: ${agendaTitle}` : "",
      agendaSubtitle ? `Focus: ${agendaSubtitle}` : "",
      includeSourceDetails && title ? `Source lesson: ${title}` : "",
      includeSourceDetails && description
        ? `Source description: ${description}`
        : "",
      includeSourceDetails && subjects.length
        ? `Subjects: ${subjects.join(" | ")}`
        : "",
    ]).join("\n"),
  };
}

function buildTutorCodeSwitchingAudioInstruction(targetLanguageName = "") {
  return [
    TUTOR_CODE_SWITCHING_AUDIO_INSTRUCTION,
    targetLanguageName
      ? `When you include ${targetLanguageName} words or phrases, pronounce those words as ${targetLanguageName} even if the surrounding tutoring language is different.`
      : "",
    targetLanguageName
      ? `Say each ${targetLanguageName} model phrase as a short standalone phrase. Do not blend it into a support-language sentence.`
      : "",
    "Write target-language words in normal spelling. Do not use phonetic respelling, hyphenation, or transliteration unless the learner explicitly asks.",
  ]
    .filter(Boolean)
    .join(" ");
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

function isTutorStarterAgendaLesson(lesson) {
  const id = String(lesson?.id || "");
  return TUTOR_STARTER_LESSON_IDS.has(id);
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

  const completedCount = normalizedItems.filter((item) => item.completed).length;
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
            voicePersona: translations.en.onboarding_persona_default_example,
            targetLang: "es",
            showTranslations: true,
            helpRequest: "",
            pauseMs: 2000,
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
                      filter:
                        "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))",
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
  pauseMs: initialPauseMs = 2000,
  maxProficiencyLevel = "Pre-A1",
  onFirstLessonComplete,
}) {
  const aliveRef = useRef(false);
  const autoStopTimerRef = useRef(null);
  const playSound = useSoundSettings((s) => s.playSound);
  const soundIsInitialized = useSoundSettings((s) => s.isInitialized);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";

  // User id
  const user = useUserStore((s) => s.user);
  const currentNpub = activeNpub?.trim?.() || strongNpub(user);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

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

  // Cached-clip index
  const audioCacheIndexRef = useRef(new Set());

  // Replay capture maps
  const recMapRef = useRef(new Map());
  const recChunksRef = useRef(new Map());
  const recTailRef = useRef(new Map());
  const replayRidSetRef = useRef(new Set());
  const ignoredRidSetRef = useRef(new Set());
  const replayAudioRef = useRef(null);
  const guardrailItemIdsRef = useRef([]);
  const pendingGuardrailTextRef = useRef("");
  const tutorKickoffSentRef = useRef(false);
  const tutorKickoffTimerRef = useRef(null);
  const tutorSessionReadyRef = useRef(false);

  // Idle gating
  const isIdleRef = useRef(true);
  const idleWaitersRef = useRef([]);
  const assistantInputLockedRef = useRef(false);
  const assistantSpeakingRef = useRef(false);
  const assistantUnlockTimerRef = useRef(null);
  const pendingUserAudioCommitRef = useRef(false);

  // Track when current response started (for proper user message ordering)
  const responseStartTimeRef = useRef(null);

  // Connection/UI state
  const [status, setStatus] = useState("disconnected");
  const [err, setErr] = useState("");
  const [uiState, setUiState] = useState("idle");
  const [volume] = useState(0);
  const [mood, setMood] = useState("neutral");
  const [pauseMs, setPauseMs] = useState(initialPauseMs);
  const [replayingId, setReplayingId] = useState(null);
  const [translatingMessageId, setTranslatingMessageId] = useState(null);

  // Learning prefs
  const [voice, setVoice] = useState(
    getPreferredTTSVoice(user?.progress?.voice),
  );
  const [voicePersona, setVoicePersona] = useState(
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
  const pauseMsRef = useRef(pauseMs);

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
  useEffect(() => {
    pauseMsRef.current = pauseMs;
  }, [pauseMs]);

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
      totalXp: xp,
      lessons: lessonsForLanguage,
      targetLang,
    };
  }, [targetLang, user?.progress, xp]);

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
  const lessonCompleteSoundKeyRef = useRef("");

  useEffect(() => {
    const storedLevel = readStoredTutorLevel(targetLang);
    setActiveTutorLevel(
      clampTutorLevelToUnlocked(
        storedLevel ||
          getUnlockedTutorLevel(maxProficiencyLevel),
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
    tutorStarterAgendaProgressRef.current = {};
    setTutorStarterAgendaProgress({});
  }, [selectedTutorLesson?.id, targetLang]);

  useEffect(() => {
    pendingFirstLessonCompletionFlowRef.current = false;
    tutorFirstLessonCompleteNotifiedRef.current = false;
  }, [currentNpub, targetLang]);

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
    const storedLessonId = readStoredTutorLessonId(targetLang);
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

        const lessonStartXp =
          progressLessons?.[resumeLesson.lesson.id]?.lessonStartXp ?? xp;
        const earned =
          resumeLesson.status === SKILL_STATUS.IN_PROGRESS
            ? Math.min(
                resumeLesson.lesson.xpReward || 0,
                Math.max(0, xp - lessonStartXp),
              )
            : 0;

        setSelectedTutorLesson(resumeLesson.lesson);
        setSelectedTutorUnit(resumeLesson.unit);
        selectedTutorLessonRef.current = resumeLesson.lesson;
        selectedTutorUnitRef.current = resumeLesson.unit;
        setTutorLessonEarnedXp(earned);
        tutorLessonEarnedXpRef.current = earned;
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
  }, [targetLang, tutorPathUnits, tutorUserProgress.lessons, xp]);

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

    if (
      isTutorStarterAgendaLesson(lesson) &&
      selectedTutorLesson?.id === lesson.id
    ) {
      const completedItems = TUTOR_STARTER_AGENDA_ITEMS.filter(
        (item) => tutorStarterAgendaProgress[item.id],
      ).length;
      return Math.round(
        (completedItems / Math.max(1, TUTOR_STARTER_AGENDA_ITEMS.length)) * 100,
      );
    }

    if (selectedTutorLesson?.id === lesson.id) {
      return Math.round(
        (Math.max(0, tutorLessonEarnedXp) / Math.max(1, lesson.xpReward || 1)) *
          100,
      );
    }

    const lessonStartXp = tutorUserProgress.lessons?.[lesson.id]?.lessonStartXp;
    if (
      typeof lessonStartXp !== "number" ||
      typeof tutorUserProgress.totalXp !== "number" ||
      !lesson.xpReward
    ) {
      return 0;
    }
    return Math.round(
      (Math.max(0, tutorUserProgress.totalXp - lessonStartXp) /
        Math.max(1, lesson.xpReward)) *
        100,
    );
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
    const lessonStartXp =
      typeof lessonProgress?.lessonStartXp === "number"
        ? lessonProgress.lessonStartXp
        : xp;
    const earned =
      status === SKILL_STATUS.IN_PROGRESS || isCompleted
        ? Math.min(
            lesson.xpReward || 0,
            Math.max(0, xp - (lessonProgress?.lessonStartXp ?? xp)),
          )
        : 0;

    setSelectedTutorLesson(lesson);
    setSelectedTutorUnit(unit);
    selectedTutorLessonRef.current = lesson;
    selectedTutorUnitRef.current = unit;
    tutorLessonEarnedXpRef.current = isCompleted
      ? lesson.xpReward || 0
      : earned;
    setTutorLessonEarnedXp(isCompleted ? lesson.xpReward || 0 : earned);
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
          lessonStartXp,
        );
      } catch (error) {
        console.error("Failed to start Tutor lesson:", error);
      }
    }

    setTimeout(() => applyLanguagePolicyNow(), 80);
  }

  // Turn counter for XP awarding
  const turnCountRef = useRef(0);

  // Messages
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Stream buffers
  const streamBuffersRef = useRef(new Map());
  const streamFlushScheduled = useRef(false);

  // Response mapping
  const respToMsg = useRef(new Map());
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
  const [displayRobotState, setDisplayRobotState] = useState(liveUiState);
  const [previousRobotState, setPreviousRobotState] = useState(null);
  const [isRobotTransitioning, setIsRobotTransitioning] = useState(false);
  const displayOrbState = getRealtimeOrbVisualState(displayRobotState);
  const previousOrbState = getRealtimeOrbVisualState(previousRobotState);

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

  // Timeline sorted by timestamp (newest-first for display)
  const timeline = [...messages].sort((a, b) => b.ts - a.ts);
  const latestAssistantMessage = timeline.find((m) => {
    if (m.role !== "assistant") return false;
    const text = `${m.textFinal || ""}${m.textStream || ""}`.trim();
    return Boolean(text);
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
    const outgoingText = `${previousMessage?.textFinal || ""}${
      previousMessage?.textStream || ""
    }`.trim();

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
      if (replayAudioRef.current) {
        replayAudioRef.current.pause();
        replayAudioRef.current.src = "";
        replayAudioRef.current = null;
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
      if (!cached?.blob) {
        setReplayingId(null);
        return;
      }
      const url = URL.createObjectURL(cached.blob);
      const audio = new Audio(url);
      replayAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setReplayingId(null);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setReplayingId(null);
      };
      await audio.play();
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
      const dest = captureOutRef.current;
      const recorder = new MediaRecorder(dest.stream, {
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
          if (data.progress?.voice)
            setVoice(getPreferredTTSVoice(data.progress.voice));
          if (data.progress?.voicePersona)
            setVoicePersona(data.progress.voicePersona);
          if (typeof data.progress?.showTranslations === "boolean") {
            setShowTranslations(data.progress.showTranslations);
          }
          if (Number.isFinite(data.progress?.pauseMs)) {
            setPauseMs(data.progress.pauseMs);
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
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

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
        textStream: (m.textStream || "") + buf,
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
    tutorKickoffSentRef.current = false;
    setErr("");
    setStatus("connecting");
    setUiState("thinking");
    setMood("thoughtful");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localRef.current = stream;
      assistantInputLockedRef.current = false;
      setLocalMicEnabled(true);

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (e) => {
        if (!audioRef.current) return;
        audioRef.current.srcObject = e.streams[0];
        audioRef.current.play().catch(() => {});

        // Setup audio graph for recording
        if (!audioGraphReadyRef.current) {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(e.streams[0]);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          analyserRef.current = analyser;
          floatBufRef.current = new Float32Array(analyser.frequencyBinCount);
          const dest = ctx.createMediaStreamDestination();
          src.connect(dest);
          captureOutRef.current = dest;
          audioGraphReadyRef.current = true;
        }
      };

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        aliveRef.current = true;
        setTimeout(() => {
          applyLanguagePolicyNow();
        }, 60);
      };

      dc.onmessage = handleRealtimeEvent;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const resp = await fetch(REALTIME_URL, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      const answer = await resp.text();
      if (!resp.ok) throw new Error(`SDP exchange failed: HTTP ${resp.status}`);
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      setStatus("connected");
      aliveRef.current = true;
      setUiState("idle");
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
      buildTutorCodeSwitchingAudioInstruction(targetLanguageName);
    const isEarlyTutorLevel = isTutorEarlyLevel(selectedLevel);
    const isAdvancedTutorLevel =
      isTutorAdvancedConversationLevel(selectedLevel);
    const starterAgendaLesson = isTutorStarterAgendaLesson(
      selectedTutorLessonRef.current,
    );

    const strict = (() => {
      if (supportCode === tLang) {
        return `LOCALIZED TUTOR MODE: The support language and target language are both ${targetLanguageName}. Teach in level-appropriate ${targetLanguageName}.`;
      }
      if (isEarlyTutorLevel) {
        return `BEGINNER BILINGUAL MODE: Use ${supportLanguageName} for brief narration, explanations, encouragement, transitions, and questions. Use ${targetLanguageName} for exact model phrases, examples, and learner practice prompts.`;
      }
      if (isAdvancedTutorLevel) {
        return `ADVANCED IMMERSION MODE: Conduct the tutoring session almost entirely in ${targetLanguageName}. Use ${supportLanguageName} only if the learner explicitly asks for clarification or is clearly stuck.`;
      }
      return `TARGET-LANGUAGE-FIRST MODE: Give instructions primarily in simple ${targetLanguageName}. Use ${supportLanguageName} only as a short rescue clarification, not as the default teaching language.`;
    })();

    // Proficiency level guidance
    const levelGuidance = {
      "Pre-A1":
        "CRITICAL: User is at foundations level (Pre-A1). Treat them as an adult beginner. Teach one tiny step at a time. Use ONLY the most basic target-language words (hello, goodbye, yes, no, thank you, numbers 1-10, basic colors). Model 1-3 word target phrases, then ask the learner to try or complete them once. Examples: 'Hola.' 'Sí.' 'No.' 'Uno, dos, tres.' 'Rojo.' 'Gracias.'",
      A1: "CRITICAL: User is a complete beginner (A1). Treat them as an adult beginner. Use ONLY very simple target-language vocabulary (greetings, numbers, colors, family). Model short 3-5 word target phrases in present tense, then guide the learner to produce one phrase. Examples: 'Hola. ¿Cómo estás?' 'Tengo un gato.' 'Me gusta pizza.'",
      A2: "CRITICAL: User is elementary level (A2). Use simple everyday vocabulary (food, shopping, directions). Use 5-8 word sentences. Use present, past, and simple future tenses only. Avoid complex grammar. Examples: 'Ayer fui al mercado.' '¿Qué vas a hacer mañana?'",
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
          "Do not repeat a phrase after it has been accepted. If the learner misses the phrase, keep the same agenda item but make the prompt simpler. Avoid bare replies like 'Hola. Bien.'",
          `Use fill-in-the-blank prompts, brief repetition, and simple choices. Example: 'Great. In ${targetLanguageName}, say: [model phrase]. Your turn.'`,
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
    const replyLengthInstruction = isEarlyTutorLevel
      ? "Keep replies short but instructional: 1-3 compact sentences, usually under 45 words."
      : isAdvancedTutorLevel
        ? "Keep replies natural and conversational: usually 2-4 concise sentences, with one clear follow-up question."
        : "Keep replies brief and target-language-first: 1-3 short sentences.";
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
          "After all agenda items have been practiced, combine or review the covered concepts until the lesson XP requirement is complete.",
          buildTutorStarterProgressInstructions(),
        ].join(" ")
      : "";
    const feedbackText = String(inlineFeedbackRef.current || "").trim();
    const feedbackContext = feedbackText
      ? `LATEST TUTOR FEEDBACK: ${feedbackText}. Use this to adjust the next micro-step without repeating the feedback verbatim.`
      : "";

    return [
      "Act as a warm, practical language tutor leading a focused tutoring session.",
      strict,
      codeSwitchingAudioInstruction,
      proficiencyHint,
      customSubjectsContext,
      tutorLessonContext,
      starterAgendaContext,
      feedbackContext,
      "IMPORTANT: Match your language complexity to the learner's proficiency level. Do not use vocabulary or grammar above their level.",
      tutorPedagogyInstructions,
      speechAcceptanceInstructions,
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
      buildTutorCodeSwitchingAudioInstruction(targetLanguageName);
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
    const agendaTitle = getTutorLessonAgendaTitle(lesson, unit, supportCode);
    const agendaSubtitle = getTutorLessonAgendaSubtitle(
      lesson,
      unit,
      supportCode,
    );

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
      codeSwitchingAudioInstruction,
      `Use the selected lesson agenda: ${agendaTitle}${
        agendaSubtitle ? ` - ${agendaSubtitle}` : ""
      }.`,
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
      buildTutorCodeSwitchingAudioInstruction(targetLanguageName);
    const phrase = item ? getTutorStarterItemModelPhrase(item, targetLang) : "";
    const task = item ? getTutorStarterItemSupportTask(item, supportCode) : "";
    const meaning = item
      ? getTutorStarterItemSupportMeaning(item, supportCode)
      : "";
    const progress = tutorStarterAgendaProgressRef.current || {};
    const lesson = selectedTutorLessonRef.current;
    const requiredXp = Math.max(0, lesson?.xpReward || 0);
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

    if (!item) {
      return [
        "You are the realtime voice tutor for this Tutor lesson.",
        codeSwitchingAudioInstruction,
        "The lesson agenda is complete. Keep practicing by reviewing or combining only the concepts already covered.",
        `Use ${supportLanguageName} for brief guidance and ${targetLanguageName} for model phrases.`,
        supportCode === targetLang
          ? ""
          : `Do not answer entirely in ${targetLanguageName}; keep teacher talk in ${supportLanguageName}.`,
        `Covered concepts: ${completedItems || getTutorStarterAgendaSummary(supportCode)}.`,
        `Allowed model phrases: ${reviewPhrases}.`,
        `XP remaining before lesson completion: ${remainingXp}.`,
        latestTranscript
          ? `Latest learner transcript: "${latestTranscript}".`
          : "",
        "Ask for one small review task or one simple combination of learned concepts.",
        "Do not introduce new subjects, advanced vocabulary, or open-ended free conversation.",
        "Do not mention pronunciation, accents, or sound quality. Do not ask the learner to repeat for pronunciation.",
        "Keep it natural and concise: 1-2 short sentences.",
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      "You are the realtime voice tutor for this Tutor lesson.",
      codeSwitchingAudioInstruction,
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
        ? `The app accepted the learner's last attempt for: ${acceptedItems}. Briefly praise it, then move to the current agenda item. Do not mention internal completion state to the learner.`
        : "",
      latestTranscript && !latestTurnWasAccepted && !isKickoff
        ? `The app did NOT accept the latest transcript as the current phrase. Do not say "nice work", "great", or imply the learner got it right. Briefly correct in ${supportLanguageName}, remind them what "${currentPhrase}" means, then ask them to try exactly this ${targetLanguageName} phrase: "${currentPhrase}".`
        : "",
      latestTranscript
        ? `Latest learner transcript: "${latestTranscript}".`
        : "",
      isKickoff
        ? "Start the lesson and introduce only this first agenda item."
        : latestTurnWasAccepted
          ? "Briefly acknowledge the accepted attempt, then introduce only the current agenda item. Do not apologize and do not mention internal completion state."
          : "Briefly correct the learner, then keep practicing only the current agenda item.",
      currentPhrase
        ? `Your next practice prompt MUST be for the current model phrase: "${currentPhrase}".`
        : "",
      "Never ask the learner to repeat a completed agenda item, and never announce internal agenda state to the learner.",
      "Never say 'remember' followed by a completed phrase as the main practice prompt.",
      "Only app-accepted turns are progress. Do not treat unrelated words, random phrases, or a different target phrase as progress.",
      "Do not ask the learner to repeat for pronunciation, do not split syllables, and do not rate accent.",
      "Do not drift into topics beyond the current agenda item.",
      "Keep it natural and concise: 1-2 short sentences.",
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
      setAssistantInputLocked(false);
      setUiState(status === "connected" ? "listening" : "idle");
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
        : "All agenda items are complete. Review or combine covered concepts until the lesson XP requirement is complete.",
      "Use the app-tracked agenda state as the source of truth. Do not evaluate accent, sound quality, or pronunciation. Only explicitly accepted agenda items are complete.",
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
      buildTutorCodeSwitchingAudioInstruction(targetLanguageName);
    const selectedLevel =
      unit?.cefrLevel ||
      unit?.level ||
      conversationSettingsRef.current.proficiencyLevel ||
      maxProficiencyLevel ||
      "A1";
    const isEarlyTutorLevel = isTutorEarlyLevel(selectedLevel);
    const isAdvancedTutorLevel =
      isTutorAdvancedConversationLevel(selectedLevel);

    if (isTutorStarterAgendaLesson(lesson)) {
      return [
        "Respond to the learner's latest turn as their tutor.",
        codeSwitchingAudioInstruction,
        buildTutorStarterProgressInstructions(userMessage, acceptedItemIds),
        `Use brief ${supportLanguageName} guidance and one tiny ${targetLanguageName} practice step.`,
        acceptedItemIds.length
          ? "The latest app-tracked item is complete. Continue to the next agenda item."
          : "The latest turn was not accepted. Keep the learner on the current agenda item and ask for the model phrase again.",
      ]
        .filter(Boolean)
        .join(" ");
    }

    const agendaTitle = getTutorLessonAgendaTitle(lesson, unit, supportCode);
    return [
      "Respond to the learner's latest turn as their tutor.",
      codeSwitchingAudioInstruction,
      userMessage ? `Latest learner transcript: "${userMessage}".` : "",
      `Keep teaching from the selected agenda: ${agendaTitle}.`,
      "Work through the agenda first. Once the agenda has been covered, review, combine, or practice only what was covered in this lesson until the lesson completes.",
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
      silence_duration_ms: pauseMsRef.current || 2000,
      threshold: 0.35,
      prefix_padding_ms: 120,
      create_response: false,
      interrupt_response: false,
    };
  }

  function setLocalMicEnabled(enabled) {
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

  function finishAssistantOutput() {
    clearAssistantUnlockTimer();
    assistantSpeakingRef.current = false;
    enableVAD();
    setAssistantInputLocked(false);
    setUiState(status === "connected" ? "listening" : "idle");
    setMood("neutral");
    if (aliveRef.current) scheduleAutoStop();
  }

  function scheduleAssistantUnlockAfterQuiet() {
    if (!assistantInputLockedRef.current) return;
    clearAssistantUnlockTimer();
    const startedAt = Date.now();
    let heardAudio = false;
    let lastLoudAt = Date.now();
    const quietMs = 1100;
    const minWaitMs = 600;
    const noAudioFallbackMs = 1800;
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
    setAssistantInputLocked(true, { clearBuffer: false, updateSession: false });
  }

  function commitPendingUserSpeech() {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    clearAutoStopTimer();
    setUiState("thinking");
    setMood("thoughtful");
  }

  function applyLanguagePolicyNow() {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;

    const voiceName = getPreferredTTSVoice(voiceRef.current);
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

  function requestTutorLessonKickoff() {
    if (tutorKickoffSentRef.current) return;
    if (!aliveRef.current) return;
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    if (
      !selectedTutorLessonRef.current &&
      (isTutorPathLoadingRef.current || isTutorAgendaHydratingRef.current)
    ) {
      scheduleTutorLessonKickoff(120);
      return;
    }

    tutorKickoffSentRef.current = true;
    clearAutoStopTimer();

    if (isTutorStarterAgendaLesson(selectedTutorLessonRef.current)) {
      const supportCode = normalizeSupportLanguage(
        supportLangRef.current || resolvedSupportLang,
        DEFAULT_SUPPORT_LANGUAGE,
      );
      const tLang = targetLangRef.current || targetLang || "es";
      const nextItem =
        getNextTutorStarterAgendaItem(tutorStarterAgendaProgressRef.current) ||
        TUTOR_STARTER_AGENDA_ITEMS[0];
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
      setAssistantInputLocked(false);
      setUiState(status === "connected" ? "listening" : "idle");
    }
  }

  function requestTutorTurnFollowup(userMessage = "", acceptedItemIds = []) {
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
        kind: "tutor_followup",
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
            metadata: { kind: "tutor_followup" },
          },
        }),
      );
    } catch {
      setAssistantInputLocked(false);
      setUiState(status === "connected" ? "listening" : "idle");
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
              silence_duration_ms: pauseMsRef.current || 2000,
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

  async function completeTutorLessonFromXp(lesson, unit) {
    if (!lesson || tutorLessonCompletionTriggeredRef.current) return;
    const npub = currentNpub;
    if (!npub) return;

    tutorLessonCompletionTriggeredRef.current = true;
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
      await completeTutorLesson(
        npub,
        lesson.id,
        lesson.xpReward || 1,
        targetLangRef.current,
      );
      setCompletedTutorLessonData({
        title: lesson.title,
        xpEarned: lesson.xpReward || 0,
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
          xpEarned: lesson.xpReward || 0,
          forceComplete: true,
        }),
      );
      if (nextTutorLesson?.lesson) {
        const nextProgress = nextProgressLessons[nextTutorLesson.lesson.id];
        const nextEarned =
          nextTutorLesson.status === SKILL_STATUS.IN_PROGRESS
            ? Math.min(
                nextTutorLesson.lesson.xpReward || 0,
                Math.max(0, xp - (nextProgress?.lessonStartXp ?? xp)),
              )
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
        xpRequired: lesson.xpReward || 0,
      });
    } catch (error) {
      console.error("Failed to complete Tutor lesson:", error);
      tutorLessonCompletionTriggeredRef.current = false;
    }
  }

  function trackTutorLessonXp(xpGain) {
    const lesson = selectedTutorLessonRef.current;
    const unit = selectedTutorUnitRef.current;
    if (!lesson || tutorLessonCompletionTriggeredRef.current) return;
    if (!lesson.xpReward || lesson.xpReward <= 0) return;

    const nextEarned = Math.min(
      lesson.xpReward,
      Math.max(0, tutorLessonEarnedXpRef.current + xpGain),
    );
    tutorLessonEarnedXpRef.current = nextEarned;
    setTutorLessonEarnedXp(nextEarned);

    const canCompleteLesson =
      !isTutorStarterAgendaLesson(lesson) ||
      isTutorStarterAgendaComplete(tutorStarterAgendaProgressRef.current);
    if (nextEarned >= lesson.xpReward && canCompleteLesson) {
      void completeTutorLessonFromXp(lesson, unit);
    }
  }

  function trackTutorStarterAgendaProgress(userMessage) {
    const lesson = selectedTutorLessonRef.current;
    const unit = selectedTutorUnitRef.current;
    if (!isTutorStarterAgendaLesson(lesson)) return [];
    if (tutorLessonCompletionTriggeredRef.current) return [];

    const currentItem = getNextTutorStarterAgendaItem(
      tutorStarterAgendaProgressRef.current,
    );
    if (!currentItem) return [];

    const matches = getTutorStarterAgendaMatches(
      userMessage,
      targetLangRef.current,
    );
    if (!matches.includes(currentItem.id)) return [];

    const nextProgress = { ...tutorStarterAgendaProgressRef.current };
    nextProgress[currentItem.id] = true;
    tutorStarterAgendaProgressRef.current = nextProgress;
    setTutorStarterAgendaProgress(nextProgress);

    const agendaComplete = TUTOR_STARTER_AGENDA_ITEMS.every(
      (item) => nextProgress[item.id],
    );
    if (!agendaComplete) return [currentItem.id];

    void completeTutorLessonFromXp(lesson, unit);
    return [currentItem.id];
  }

  function closeTutorLessonCompleteModal() {
    setShowTutorLessonComplete(false);
    setCompletedTutorLessonData(null);

    if (completedTutorAgendaData) {
      setShowTutorCompletedAgenda(true);
      return;
    }

    if (!pendingFirstLessonCompletionFlowRef.current) return;
    pendingFirstLessonCompletionFlowRef.current = false;
    if (tutorFirstLessonCompleteNotifiedRef.current) return;
    tutorFirstLessonCompleteNotifiedRef.current = true;
    onFirstLessonComplete?.();
  }

  function closeTutorCompletedAgendaModal() {
    setShowTutorCompletedAgenda(false);
    setCompletedTutorAgendaData(null);

    if (!pendingFirstLessonCompletionFlowRef.current) return;
    pendingFirstLessonCompletionFlowRef.current = false;
    if (tutorFirstLessonCompleteNotifiedRef.current) return;
    tutorFirstLessonCompleteNotifiedRef.current = true;
    onFirstLessonComplete?.();
  }

  /* ---------------------------
     Award XP per turn (1-3 XP)
  --------------------------- */
  async function awardTurnXp(userMessage = "", aiResponse = "") {
    const npub = currentNpub;
    if (!npub) return;

    // Award 1-3 XP randomly per turn
    const xpGain = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3

    setXp((v) => v + xpGain);
    trackTutorLessonXp(xpGain);

    try {
      await awardXp(npub, xpGain, targetLangRef.current);
      logEvent(analytics, "conversation_turn_xp", { xp: xpGain });
    } catch {}
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

    if (t === "session.updated") {
      tutorSessionReadyRef.current = true;
      if (aliveRef.current && !tutorKickoffSentRef.current) {
        scheduleTutorLessonKickoff(80);
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
      if (text) {
        const now = Date.now();
        if (
          text === lastTranscriptRef.current.text &&
          now - lastTranscriptRef.current.ts < 2000
        ) {
          return;
        }
        lastTranscriptRef.current = { text, ts: now };
        // Use timestamp BEFORE the AI response started so user message appears first
        const userTs = responseStartTimeRef.current
          ? responseStartTimeRef.current - 1
          : now;
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
        turnCountRef.current += 1;
        const acceptedItemIds = trackTutorStarterAgendaProgress(text);
        requestTutorTurnFollowup(text, acceptedItemIds);
        const currentLesson = selectedTutorLessonRef.current;
        const isStarterLesson = isTutorStarterAgendaLesson(currentLesson);
        const starterReviewMatched =
          isStarterLesson &&
          isTutorStarterAgendaComplete(tutorStarterAgendaProgressRef.current) &&
          getTutorStarterAgendaMatches(text, targetLangRef.current).length > 0;
        const canAwardXpForTurn =
          !isStarterLesson ||
          acceptedItemIds.length > 0 ||
          starterReviewMatched;
        // Award XP after the tutor reply is requested so progress state cannot suppress the response.
        if (canAwardXpForTurn) {
          awardTurnXp(text, "");
        }
      }
      return;
    }

    if (
      t === "conversation.item.input_audio_transcription.failed" ||
      t === "input_audio_transcription.failed"
    ) {
      pendingUserAudioCommitRef.current = false;
      setAssistantInputLocked(false);
      setUiState(status === "connected" ? "listening" : "idle");
      setMood("neutral");
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
      streamBuffersRef.current.set(mid, prev + data.delta);
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
          textStream: (m.textStream || "") + buf,
        }));
      }
      updateMessage(mid, (m) => ({
        ...m,
        textFinal: ((m.textFinal || "").trim() + " " + data.text).trim(),
        textStream: "",
      }));
      return;
    }

    if (
      t === "response.completed" ||
      t === "response.done" ||
      t === "response.canceled"
    ) {
      if (
        t === "response.canceled" &&
        assistantInputLockedRef.current &&
        assistantSpeakingRef.current
      ) {
        finishAssistantOutput();
      }
      if (t === "response.canceled" && assistantSpeakingRef.current) {
        setAssistantInputLocked(false);
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
            textFinal: ((m.textFinal || "") + " " + buf).trim(),
          }));
        }
        updateMessage(mid, (m) => ({ ...m, done: true }));
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
      pushMessage({
        id: mid,
        role: "assistant",
        lang: targetLangRef.current || "es",
        textFinal: "",
        textStream: "",
        translation: "",
        translationLang: "",
        pairs: [],
        done: false,
        hasAudio: false,
        ts: Date.now(),
      });
    }
    return mid;
  }

  function pushMessage(m) {
    setMessages((p) => {
      // Prevent duplicate messages with same ID
      if (p.some((existing) => existing.id === m.id)) {
        return p;
      }
      return [...p, m];
    });
  }

  function updateMessage(id, fn) {
    setMessages((p) => p.map((m) => (m.id === id ? fn(m) : m)));
  }

  /* ---------------------------
     Translation
  --------------------------- */
  async function translateMessage(id) {
    const m = messagesRef.current.find((x) => x.id === id);
    if (!m) return;
    const src = (m.textFinal + " " + (m.textStream || "")).trim();
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

    const r = await fetch(RESPONSES_URL, {
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

    if (isTutorStarterAgendaLesson(lesson)) {
      const total = TUTOR_STARTER_AGENDA_ITEMS.length;
      const completed = TUTOR_STARTER_AGENDA_ITEMS.filter(
        (item) => tutorStarterAgendaProgress[item.id],
      ).length;
      const percent = Math.round((completed / Math.max(1, total)) * 100);
      return {
        percent,
        isComplete: percent >= 100,
        label: `${completed}/${total} ${tutorCopy(uiLang, {
          en: "steps",
          es: "pasos",
          pt: "passos",
          it: "passi",
          fr: "etapes",
          ja: "ステップ",
          hi: "कदम",
          ar: "خطوات",
          zh: "步",
        })}`,
      };
    }

    const required = Math.max(0, lesson.xpReward || 0);
    const earned = Math.min(required, Math.max(0, tutorLessonEarnedXp || 0));
    const percent = required > 0 ? Math.round((earned / required) * 100) : 100;
    return {
      percent,
      isComplete: percent >= 100,
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
      <Box minH="100vh" color="gray.100" position="relative" pb="120px">
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
              width="132px"
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
                  />
                </Box>
              )}
              <Box opacity={1} transition="opacity 0.5s ease">
                <VoiceOrb
                  state={displayOrbState}
                  theme={isLightTheme ? "light" : "dark"}
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
                    primaryText={`${latestAssistantMessage.textFinal || ""}${
                      latestAssistantMessage.textStream || ""
                    }`}
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
                    canTranslate={showTranslations}
                    onTranslate={() =>
                      handleManualTranslate(latestAssistantMessage.id)
                    }
                    canReplay={
                      !!latestAssistantMessage.hasAudio ||
                      audioCacheIndexRef.current.has(latestAssistantMessage.id)
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
          bg="blackAlpha.700"
          backdropFilter="blur(4px)"
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
                        selectedTutorLesson.xpReward || 0,
                        selectedTutorLessonProgressStatus ===
                          SKILL_STATUS.COMPLETED
                          ? selectedTutorLesson.xpReward || 0
                          : tutorLessonEarnedXp,
                      )}
                      /{selectedTutorLesson.xpReward || 0} XP
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
          bg="blackAlpha.700"
          backdropFilter="blur(4px)"
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
                      en: "XP Practiced",
                      es: "XP practicado",
                      pt: "XP praticado",
                      it: "XP praticati",
                      fr: "XP pratique",
                      ja: "練習XP",
                      hi: "अभ्यास XP",
                      ar: "XP اتدرّب",
                      zh: "练习 XP",
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
          bg="blackAlpha.700"
          backdropFilter="blur(5px)"
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
                isLightTheme
                  ? "rgba(255,255,255,0.62)"
                  : "rgba(15,23,42,0.68)"
              }
              border="1px solid"
              borderColor={isLightTheme ? "rgba(120,94,61,0.14)" : "whiteAlpha.100"}
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
          bg="blackAlpha.700"
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
              {timeline.map((m) => {
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

                const primaryText = (m.textFinal || "") + (m.textStream || "");
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
                      canTranslate={showTranslations}
                      onTranslate={() => handleManualTranslate(m.id)}
                      canReplay={
                        !!m.hasAudio || audioCacheIndexRef.current.has(m.id)
                      }
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
