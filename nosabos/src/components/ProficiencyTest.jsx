import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Box,
  Button,
  Center,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerOverlay,
  HStack,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  Text,
  VStack,
  Badge, Divider,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { PiMicrophoneStageDuotone } from "react-icons/pi";
import { FaRegCommentDots, FaStop } from "react-icons/fa";
import { LuBadgeCheck } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { database, gradingModel } from "../firebaseResources/firebaseResources";

import useUserStore from "../hooks/useUserStore";
import useBottomDrawerSwipeDismiss from "../hooks/useBottomDrawerSwipeDismiss";
import VoiceOrb from "./VoiceOrb";
import BottomDrawerDragHandle from "./BottomDrawerDragHandle";
import {
  ArchiveTextAnimation,
  getChatLogButtonHighlightProps,
  getRealtimeOrbVisualState,
  useArchiveTextStream,
} from "./realtimeArchiveStream";
import { translations } from "../utils/translation";
import { WaveBar } from "./WaveBar";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_GLOW,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";
import { DEFAULT_TTS_VOICE, getRandomVoice, TTS_LANG_TAG } from "../utils/tts";
import useSoundSettings from "../hooks/useSoundSettings";
import submitActionSound from "../assets/submitaction.mp3";
import completeSound from "../assets/complete.mp3";
import { useThemeStore } from "../useThemeStore";

const REALTIME_MODEL =
  (import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";

const REALTIME_URL = `${
  import.meta.env.VITE_REALTIME_URL
}?model=gpt-realtime-mini/exchangeRealtimeSDP?model=${encodeURIComponent(
  REALTIME_MODEL,
)}`;

const MAX_EXCHANGES = 10;
const AUTO_DISCONNECT_MS = 15000;
const MATRIX_PANEL_SX = {
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 20% 15%, rgba(30,64,175,0.12) 0%, transparent 42%), " +
    "radial-gradient(circle at 82% 25%, rgba(6,95,70,0.1) 0%, transparent 40%), " +
    "radial-gradient(circle at 50% 100%, rgba(15,23,42,0.52) 0%, transparent 62%), " +
    "linear-gradient(180deg, rgba(2,6,14,0.98) 0%, rgba(1,3,10,0.99) 100%)",
  "&::after": {
    content: '\"\"',
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
const PAPER_PAGE_SX = {
  background:
    "radial-gradient(circle at 14% 12%, rgba(220, 197, 169, 0.18) 0%, transparent 34%), " +
    "radial-gradient(circle at 84% 10%, rgba(235, 220, 198, 0.2) 0%, transparent 32%), " +
    "linear-gradient(180deg, rgba(252,248,242,0.98) 0%, rgba(246,239,230,0.98) 100%)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(155,135,112,0.04) 0px, rgba(155,135,112,0.04) 1px, transparent 1px, transparent 28px), " +
      "repeating-linear-gradient(90deg, rgba(155,135,112,0.03) 0px, rgba(155,135,112,0.03) 1px, transparent 1px, transparent 28px)",
    opacity: 0.4,
    pointerEvents: "none",
  },
  "& > :not([data-proficiency-bottom-dock='true'])": {
    position: "relative",
    zIndex: 1,
  },
};
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

const CEFR_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];

const CEFR_LEVEL_INFO = {
  "Pre-A1": {
    name: {
      en: "Ultimate Beginner",
      es: "Principiante Total",
      it: "Principiante assoluto",
      fr: "Grand debutant",
      ja: "完全初心者",
    },
    color: "#8B5CF6",
  },
  A1: { name: { en: "Beginner", es: "Principiante", it: "Principiante", fr: "Debutant", ja: "初心者" }, color: "#3B82F6" },
  A2: { name: { en: "Elementary", es: "Elemental", it: "Elementare", fr: "Elementaire", ja: "初級" }, color: "#8B5CF6" },
  B1: { name: { en: "Intermediate", es: "Intermedio", it: "Intermedio", fr: "Intermediaire", ja: "中級" }, color: "#A855F7" },
  B2: {
    name: {
      en: "Upper Intermediate",
      es: "Intermedio Alto",
      it: "Intermedio alto",
      fr: "Intermediaire avance",
      ja: "中上級",
    },
    color: "#F97316",
  },
  C1: { name: { en: "Advanced", es: "Avanzado", it: "Avanzato", fr: "Avance", ja: "上級" }, color: "#EF4444" },
  C2: { name: { en: "Mastery", es: "Maestría", it: "Padronanza", fr: "Maitrise", ja: "熟達" }, color: "#EC4899" },
};

const CEFR_LEVEL_OFFERINGS = {
  "Pre-A1": {
    en: [
      "Ultra-guided lessons with basic words and phrases.",
      "Very short prompts with lots of repetition.",
      "Focus on confidence and comprehension foundations.",
    ],
    es: [
      "Lecciones guiadas con palabras y frases básicas.",
      "Ejercicios muy cortos con mucha repetición.",
      "Enfoque en confianza y comprensión inicial.",
    ],
    ja: [
      "基本単語とフレーズを使う手厚いガイド付きレッスン。",
      "反復の多い、とても短い問題。",
      "自信と理解の土台に集中。",
    ],
  },
  A1: {
    en: [
      "Beginner modules for greetings, personal info, and daily basics.",
      "Simple conversation drills with frequent support.",
      "Core vocabulary and sentence patterns.",
    ],
    es: [
      "Módulos iniciales de saludos, información personal y rutina.",
      "Prácticas simples de conversación con apoyo frecuente.",
      "Vocabulario esencial y estructuras básicas.",
    ],
    ja: [
      "あいさつ、個人情報、日常の基礎を扱う初心者モジュール。",
      "頻繁なサポート付きの簡単な会話練習。",
      "中心語彙と文型。",
    ],
  },
  A2: {
    en: [
      "Everyday scenario lessons (shopping, plans, routines).",
      "Longer responses and clearer tense control.",
      "Expanded practical vocabulary for real interactions.",
    ],
    es: [
      "Lecciones de situaciones cotidianas (compras, planes, rutina).",
      "Respuestas más largas y mejor manejo de tiempos verbales.",
      "Vocabulario práctico ampliado para interacciones reales.",
    ],
    ja: [
      "買い物、予定、日課などの日常場面レッスン。",
      "より長い回答と時制のコントロール。",
      "実際のやり取りに役立つ実用語彙の拡張。",
    ],
  },
  B1: {
    en: [
      "Intermediate discussions with opinions and explanations.",
      "Practice narrating past/future events with detail.",
      "More nuanced grammar and connector usage.",
    ],
    es: [
      "Conversaciones intermedias con opiniones y explicaciones.",
      "Práctica narrando eventos pasados/futuros con detalle.",
      "Gramática más matizada y mejor uso de conectores.",
    ],
    ja: [
      "意見や説明を含む中級の話し合い。",
      "過去や未来の出来事を詳しく語る練習。",
      "より細かな文法と接続表現の使用。",
    ],
  },
  B2: {
    en: [
      "Upper-intermediate speaking with argumentation and precision.",
      "Complex listening/reading contexts and abstract themes.",
      "Greater focus on natural fluency and style control.",
    ],
    es: [
      "Producción oral de nivel intermedio alto con argumentación.",
      "Contextos complejos de escucha/lectura y temas abstractos.",
      "Mayor enfoque en fluidez natural y control de estilo.",
    ],
    ja: [
      "論証と正確さを伴う中上級のスピーキング。",
      "複雑な聞き取り/読解の文脈と抽象的なテーマ。",
      "自然な流暢さと文体コントロールに重点。",
    ],
  },
  C1: {
    en: [
      "Advanced scenarios requiring precision and flexibility.",
      "Idiomatic and professional language usage.",
      "High-level tasks around tone, nuance, and persuasion.",
    ],
    es: [
      "Escenarios avanzados que requieren precisión y flexibilidad.",
      "Uso idiomático y profesional del idioma.",
      "Tareas de alto nivel sobre tono, matiz y persuasión.",
    ],
    ja: [
      "正確さと柔軟さが必要な上級シナリオ。",
      "慣用的・専門的な言語使用。",
      "トーン、ニュアンス、説得に関する高度なタスク。",
    ],
  },
  C2: {
    en: [
      "Mastery-level tasks with subtle meaning control.",
      "Near-native speed, complexity, and adaptability.",
      "Focus on refinement, register, and expressive range.",
    ],
    es: [
      "Tareas de maestría con control de matices complejos.",
      "Velocidad, complejidad y adaptabilidad casi nativas.",
      "Enfoque en refinamiento, registro y amplitud expresiva.",
    ],
    ja: [
      "微妙な意味を制御する熟達レベルのタスク。",
      "ネイティブに近い速度、複雑さ、適応力。",
      "洗練、レジスター、表現の幅に集中。",
    ],
  },
};

const ASSESSMENT_CRITERIA = [
  { key: "pronunciation", en: "Pronunciation", es: "Pronunciación", it: "Pronuncia", fr: "Prononciation", ja: "発音" },
  { key: "grammar", en: "Grammar", es: "Gramática", it: "Grammatica", fr: "Grammaire", ja: "文法" },
  { key: "vocabulary", en: "Vocabulary", es: "Vocabulario", it: "Vocabolario", fr: "Vocabulaire", ja: "語彙" },
  { key: "fluency", en: "Fluency", es: "Fluidez", it: "Fluidità", fr: "Fluidite", ja: "流暢さ" },
  { key: "confidence", en: "Confidence", es: "Confianza", it: "Sicurezza", fr: "Confiance", ja: "自信" },
  { key: "comprehension", en: "Comprehension", es: "Comprensión", it: "Comprensione", fr: "Comprehension", ja: "理解" },
];

function scoreColor(score) {
  if (score >= 8) return "green";
  if (score >= 6) return "teal";
  if (score >= 4) return "yellow";
  return "red";
}

function uiStateLabel(uiState, ui) {
  if (uiState === "speaking") return ui.proficiency_speaking;
  if (uiState === "listening") return ui.proficiency_listening;
  if (uiState === "thinking") return ui.proficiency_thinking;
  return "";
}

/* ---- helpers ---- */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function strongNpub(user) {
  return (
    user?.id ||
    user?.local_npub ||
    localStorage.getItem("local_npub") ||
    ""
  ).trim();
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

function normalizeCefrLevel(level) {
  if (!level) return null;
  if (level === "A0") return "Pre-A1";
  return level;
}

function getStrictPlacementFromEvidence(userTexts, modelScores, modelLevel) {
  const normalized = normalizeCefrLevel(modelLevel) || "Pre-A1";
  const levelRank = {
    "Pre-A1": 0,
    A1: 1,
    A2: 2,
    B1: 3,
    B2: 4,
    C1: 5,
    C2: 6,
  };

  const scoreFor = (key) => {
    const raw = modelScores?.[key];
    const val = typeof raw?.score === "number" ? raw.score : raw;
    if (typeof val !== "number") return null;
    return Math.max(1, Math.min(10, val));
  };

  const grammar = scoreFor("grammar");
  const vocabulary = scoreFor("vocabulary");
  const fluency = scoreFor("fluency");
  const comprehension = scoreFor("comprehension");
  const pronunciation = scoreFor("pronunciation");
  const confidence = scoreFor("confidence");

  const scored = [
    grammar,
    vocabulary,
    fluency,
    comprehension,
    pronunciation,
    confidence,
  ].filter((n) => typeof n === "number");
  const avg = scored.length
    ? scored.reduce((a, b) => a + b, 0) / scored.length
    : null;

  const combined = (userTexts || []).join(" ").toLowerCase();
  const fallbackPattern =
    /(no se|no sé|no entiendo|i don't know|i dont know|idk|huh|um+|uh+|hmm+|lol|haha)/g;
  const fallbackMatches = combined.match(fallbackPattern) || [];
  const fallbackDensity = userTexts?.length
    ? fallbackMatches.length / userTexts.length
    : 0;

  const tokenCounts = (userTexts || []).map(
    (t) => t.trim().split(/\s+/).filter(Boolean).length,
  );
  const avgTokens = tokenCounts.length
    ? tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length
    : 0;
  const totalTokens = tokenCounts.reduce((a, b) => a + b, 0);

  // Check for nonsense / gibberish: extremely short total output
  const noSubstance = totalTokens < 6 || avgTokens < 2;

  let cap = normalized;

  // HARD FLOOR: no meaningful output at all
  if (noSubstance || !userTexts?.length || totalTokens === 0) {
    return "Pre-A1";
  }

  // HARD FLOOR: mostly filler / non-comprehension responses
  if (fallbackDensity >= 0.75) {
    return "Pre-A1";
  }

  // Very limited production tends to be Pre-A1/A1 depending on score signal
  if (avgTokens <= 2.5 && avg !== null && avg < 4) {
    return "Pre-A1";
  }

  // Core skill floor: very low critical skills should not exceed A1
  if (
    (grammar !== null && grammar <= 2) ||
    (comprehension !== null && comprehension <= 2) ||
    (vocabulary !== null && vocabulary <= 2)
  ) {
    cap = "A1";
  }
  // CEFR-oriented score banding from rubric evidence
  else if (avg !== null && avg < 3.2) {
    cap = "Pre-A1";
  } else if (avg !== null && avg < 4.4) {
    cap = "A1";
  } else if (avg !== null && avg < 5.6) {
    cap = "A2";
  } else if (avg !== null && avg < 6.8) {
    if (avgTokens < 4) cap = "A2";
    else cap = "B1";
  } else if (avg !== null && avg < 8) {
    if (avgTokens < 6) cap = "B1";
    else cap = "B2";
  } else if (avg !== null && avg < 8.8) {
    cap = avgTokens >= 8 ? "C1" : "B2";
  } else {
    cap =
      avgTokens >= 10 &&
      (grammar ?? 0) >= 8 &&
      (vocabulary ?? 0) >= 8 &&
      (fluency ?? 0) >= 8 &&
      (comprehension ?? 0) >= 8
        ? "C2"
        : "C1";
  }

  // Additional guard: short responses should not exceed B1 regardless of scores
  if (avgTokens < 4 && levelRank[cap] > levelRank["A2"]) {
    cap = "A2";
  }

  return levelRank[cap] < levelRank[normalized] ? cap : normalized;
}

function summarizeSpeechEvidence(turns = []) {
  const sortedTurns = [...turns].sort(
    (a, b) => (a.startTs || 0) - (b.startTs || 0),
  );
  const finishedTurns = sortedTurns.filter(
    (t) => typeof t.durationMs === "number" && t.durationMs > 0,
  );
  const transcriptTurns = sortedTurns.filter(
    (t) => typeof t.transcript === "string" && t.transcript.trim(),
  );

  const totalSpeechMs = finishedTurns.reduce(
    (sum, turn) => sum + turn.durationMs,
    0,
  );
  const avgTurnMs = finishedTurns.length
    ? totalSpeechMs / finishedTurns.length
    : 0;
  const totalWords = transcriptTurns.reduce((sum, turn) => {
    const words = turn.transcript.trim().split(/\s+/).filter(Boolean).length;
    return sum + words;
  }, 0);

  const estimatedWpm =
    totalSpeechMs > 0
      ? Math.round((totalWords / (totalSpeechMs / 60000)) * 10) / 10
      : null;
  const confidences = transcriptTurns
    .map((t) =>
      typeof t.transcriptConfidence === "number"
        ? t.transcriptConfidence
        : null,
    )
    .filter((n) => typeof n === "number");
  const avgTranscriptConfidence = confidences.length
    ? Math.round(
        (confidences.reduce((a, b) => a + b, 0) / confidences.length) * 1000,
      ) / 1000
    : null;

  const pauses = [];
  for (let i = 1; i < finishedTurns.length; i += 1) {
    const prevEnd = finishedTurns[i - 1]?.endTs;
    const start = finishedTurns[i]?.startTs;
    if (
      typeof prevEnd === "number" &&
      typeof start === "number" &&
      start >= prevEnd
    )
      pauses.push(start - prevEnd);
  }

  const avgPauseMs = pauses.length
    ? Math.round(pauses.reduce((a, b) => a + b, 0) / pauses.length)
    : null;
  const rmsValues = finishedTurns
    .map((t) => (typeof t.rmsAvg === "number" ? t.rmsAvg : null))
    .filter((n) => typeof n === "number");
  const avgRms = rmsValues.length
    ? Math.round(
        (rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length) * 10000,
      ) / 10000
    : null;

  return {
    hasAudioEvidence: finishedTurns.length > 0,
    turnCount: sortedTurns.length,
    finishedTurnCount: finishedTurns.length,
    transcriptTurnCount: transcriptTurns.length,
    totalSpeechMs: Math.round(totalSpeechMs),
    avgTurnMs: Math.round(avgTurnMs),
    totalWords,
    estimatedWpm,
    avgPauseMs,
    avgTranscriptConfidence,
    avgRms,
    turns: sortedTurns.map((turn) => ({
      id: turn.id,
      durationMs:
        typeof turn.durationMs === "number"
          ? Math.round(turn.durationMs)
          : null,
      transcript: turn.transcript || "",
      wordCount: turn.wordCount || 0,
      transcriptConfidence:
        typeof turn.transcriptConfidence === "number"
          ? Math.round(turn.transcriptConfidence * 1000) / 1000
          : null,
      rmsAvg:
        typeof turn.rmsAvg === "number"
          ? Math.round(turn.rmsAvg * 10000) / 10000
          : null,
      rmsPeak:
        typeof turn.rmsPeak === "number"
          ? Math.round(turn.rmsPeak * 10000) / 10000
          : null,
    })),
  };
}

/* ---- Bubble components ---- */
function UserBubble({ label, text }) {
  if (!text) return null;
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  return (
    <Box
      bg={isLightTheme ? "rgba(108, 182, 191, 0.16)" : "cyan.800"}
      p={3}
      rounded="2xl"
      border="1px solid"
      borderColor={
        isLightTheme ? "rgba(108, 182, 191, 0.22)" : "rgba(255,255,255,0.06)"
      }
      maxW="100%"
      borderBottomRightRadius="0px"
      color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
    >
      <Text
        fontSize="2xs"
        opacity={0.6}
        mb={1}
        color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
      >
        {label}
      </Text>
      <Text
        fontSize="sm"
        color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {text}
      </Text>
    </Box>
  );
}

function AssistantBubble({
  label,
  text,
  containerRef,
  primaryTextRef,
  contentOpacity = 1,
  contentTransform = "translateY(0px) scale(1)",
}) {
  if (!text) return null;
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  return (
    <Box
      ref={containerRef}
      bg={isLightTheme ? APP_SURFACE_ELEVATED : "transparent"}
      p={3}
      rounded="2xl"
      border="1px solid"
      borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.06)"}
      boxShadow={isLightTheme ? APP_SHADOW : "0 14px 28px rgba(0,0,0,0.35)"}
      maxW="100%"
      borderBottomLeftRadius="0px"
      sx={isLightTheme ? PAPER_PANEL_SX : MATRIX_PANEL_SX}
      color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
    >
      <Box
        opacity={contentOpacity}
        transform={contentTransform}
        transition="opacity 180ms ease, transform 180ms ease"
        willChange="opacity, transform"
        pointerEvents={contentOpacity < 0.5 ? "none" : "auto"}
      >
        <Text
          fontSize="2xs"
          opacity={0.6}
          mb={1}
          color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
        >
          {label}
        </Text>
        <Text
          ref={primaryTextRef}
          fontSize="sm"
          color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
          sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {text}
        </Text>
      </Box>
    </Box>
  );
}

function RowLeft({ children }) {
  return (
    <HStack justify="flex-start" w="100%">
      <Box maxW="85%">{children}</Box>
    </HStack>
  );
}

function RowRight({ children }) {
  return (
    <HStack justify="flex-end" w="100%">
      <Box maxW="85%">{children}</Box>
    </HStack>
  );
}

export default function ProficiencyTest() {
  const navigate = useNavigate();
  const playSound = useSoundSettings((s) => s.playSound);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const patchUser = useUserStore((s) => s.patchUser);
  const currentNpub = strongNpub(user);

  const storedProgressTargetLang = useMemo(() => {
    if (typeof window === "undefined") return "";
    const raw = localStorage.getItem("progress");
    if (!raw) return "";
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed?.targetLang === "string" ? parsed.targetLang : "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      if (user?.progress?.targetLang) return;

      const npub = strongNpub(user);
      if (!npub) return;

      try {
        const snap = await getDoc(doc(database, "users", npub));
        if (!snap.exists() || cancelled) return;

        const profile = snap.data() || {};
        setUser({
          ...(user || {}),
          ...profile,
          local_npub: profile.local_npub || npub,
        });
      } catch (error) {
        console.warn(
          "Failed to load user settings for proficiency test:",
          error,
        );
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [setUser, user]);

  const aliveRef = useRef(false);
  const autoStopTimerRef = useRef(null);

  // Derive settings from user
  const targetLang =
    user?.progress?.targetLang ||
    user?.targetLang ||
    storedProgressTargetLang ||
    "es";
  const targetLangTag = TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es;
  const targetLanguageCode = (targetLangTag || "es-MX").split("-")[0];
  const supportLang = user?.progress?.supportLang || "en";
  const voicePersona = user?.progress?.voicePersona || "";
  const pauseMs = user?.progress?.pauseMs || 800;

  const ui = translations[supportLang] || translations.en;

  // Realtime refs
  const audioRef = useRef(null);
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const dcRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const floatBufRef = useRef(null);
  const captureOutRef = useRef(null);
  const audioGraphReadyRef = useRef(false);

  // Connection/UI state
  const [status, setStatus] = useState("disconnected");
  const [err, setErr] = useState("");
  const [uiState, setUiState] = useState("idle");
  const [mood, setMood] = useState("neutral");
  const [showChatLog, setShowChatLog] = useState(false);

  // Messages
  const messagesRef = useRef([]);
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const respToMsg = useRef(new Map());
  const streamBuffersRef = useRef(new Map());
  const streamFlushTimerRef = useRef(null);
  const lastTranscriptRef = useRef({ text: "", ts: 0 });
  const pendingUserMsgRef = useRef(null);
  const speechTurnsRef = useRef([]);
  const currentSpeechTurnRef = useRef(null);
  const speechSampleTimerRef = useRef(null);
  const assistantInputLockedRef = useRef(false);

  // Idle gating
  const isIdleRef = useRef(true);

  // Guardrails
  const guardrailItemIdsRef = useRef([]);
  const pendingGuardrailTextRef = useRef("");

  // Count user exchanges (user messages count, exclude pending placeholders)
  const userMessageCount = useMemo(
    () =>
      messages.filter((m) => m.role === "user" && !m.pendingTranscript).length,
    [messages],
  );

  // Exit confirmation modal
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Result drawer
  const [showResult, setShowResult] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const rubricBodyRef = useRef(null);
  const rubricInitialFocusRef = useRef(null);
  const [assessedLevel, setAssessedLevel] = useState(null);
  const [assessmentSummary, setAssessmentSummary] = useState("");
  const [assessmentScores, setAssessmentScores] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessmentError, setAssessmentError] = useState(false);
  const assessmentDoneRef = useRef(false);

  // Progress bar
  const progressPct = Math.min(100, (userMessageCount / MAX_EXCHANGES) * 100);
  const closeRubric = useCallback(() => setShowRubric(false), []);
  const rubricSwipeDismiss = useBottomDrawerSwipeDismiss({
    isOpen: showRubric,
    onClose: closeRubric,
  });

  useEffect(() => {
    if (!showRubric || !rubricBodyRef.current) return;
    rubricBodyRef.current.scrollTop = 0;
  }, [showRubric]);

  function pushMessage(m) {
    setMessages((p) => {
      if (p.some((existing) => existing.id === m.id)) return p;
      return [...p, m];
    });
  }
  function updateMessage(id, updater) {
    setMessages((p) => p.map((m) => (m.id === id ? updater(m) : m)));
  }

  function scheduleStreamFlush() {
    if (streamFlushTimerRef.current) return;
    streamFlushTimerRef.current = setTimeout(() => {
      const buffers = streamBuffersRef.current;
      buffers.forEach((buf, mid) => {
        if (!buf) return;
        updateMessage(mid, (m) => ({
          ...m,
          textStream: (m.textStream || "") + buf,
        }));
      });
      streamBuffersRef.current = new Map();
      streamFlushTimerRef.current = null;
    }, 50);
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
        lang: targetLang,
        textFinal: "",
        textStream: "",
        done: false,
        ts: Date.now(),
      });
    }
    return mid;
  }

  function stopSpeechSampling() {
    if (speechSampleTimerRef.current) {
      clearInterval(speechSampleTimerRef.current);
      speechSampleTimerRef.current = null;
    }
  }

  function sampleSpeechRms() {
    const analyser = analyserRef.current;
    const buf = floatBufRef.current;
    const turn = currentSpeechTurnRef.current;
    if (!analyser || !buf || !turn) return;

    analyser.getFloatTimeDomainData(buf);
    let sumSquares = 0;
    let peak = 0;
    for (let i = 0; i < buf.length; i += 1) {
      const v = buf[i];
      sumSquares += v * v;
      const abs = Math.abs(v);
      if (abs > peak) peak = abs;
    }
    const rms = Math.sqrt(sumSquares / buf.length);
    turn.rmsSamples = (turn.rmsSamples || 0) + 1;
    turn.rmsTotal = (turn.rmsTotal || 0) + rms;
    turn.rmsPeak = Math.max(turn.rmsPeak || 0, peak);
  }

  function startSpeechSampling() {
    stopSpeechSampling();
    speechSampleTimerRef.current = setInterval(sampleSpeechRms, 120);
  }

  function buildTurnDetectionConfig() {
    if (assistantInputLockedRef.current) return null;
    return {
      type: "server_vad",
      silence_duration_ms: pauseMs,
      threshold: 0.35,
      prefix_padding_ms: 120,
    };
  }

  function setLocalMicEnabled(enabled) {
    try {
      localRef.current?.getAudioTracks?.().forEach((track) => {
        track.enabled = enabled;
      });
    } catch {}
  }

  // Keep microphone input closed while the assistant audio is still playing.
  function setAssistantInputLocked(locked) {
    assistantInputLockedRef.current = locked;
    if (locked) setLocalMicEnabled(false);
    try {
      if (dcRef.current?.readyState === "open") {
        dcRef.current.send(JSON.stringify({ type: "input_audio_buffer.clear" }));
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

  function extractTranscriptConfidence(payload) {
    const candidates = [
      payload?.confidence,
      payload?.transcript_confidence,
      payload?.transcription?.confidence,
      payload?.item?.transcription?.confidence,
    ];
    const value = candidates.find((n) => typeof n === "number");
    return typeof value === "number" ? value : null;
  }

  /* ---- Build proficiency assessment instructions ---- */
  function buildProficiencyInstructions() {
    const langName =
      {
        es: "Spanish",
        pt: "Portuguese",
        fr: "French",
        it: "Italian",
        nl: "Dutch",
        ja: "Japanese",
        ru: "Russian",
        de: "German",
        el: "Greek",
        pl: "Polish",
        ga: "Irish",
        nah: "Eastern Huasteca Nahuatl",
        yua: "Yucatec Maya",
        en: "English",
      }[targetLang] || "Spanish";

    const strict =
      {
        es: "Responde ÚNICAMENTE en español.",
        pt: "Responda APENAS em português brasileiro.",
        fr: "Réponds UNIQUEMENT en français.",
        it: "Rispondi SOLO in italiano.",
        nl: "Antwoord ALLEEN in het Nederlands.",
        ja: "日本語のみで応答してください。",
        ru: "Отвечайте ТОЛЬКО на русском языке.",
        de: "Antworten Sie NUR auf Deutsch.",
        el: "Απαντήστε ΜΟΝΟ στα ελληνικά.",
        pl: "Odpowiadaj TYLKO po polsku.",
        ga: "Freagair i nGaeilge AMHÁIN.",
        nah: "T'aanen tu'ux maaya t'aan.",
        yua: "Respond ONLY in Yucatec Maya.",
        en: "Respond ONLY in English.",
      }[targetLang] || "Respond ONLY in the target language.";

    return [
      `You are a ${langName} proficiency assessor conducting a placement test.`,
      strict,
      `When speaking, use natural ${langName} pronunciation for locale ${targetLangTag}.`,
      "Your task is to have a natural conversation that progressively tests the user's language ability.",
      "Start with very simple topics (greetings, basic questions) and gradually increase complexity.",
      `CONVERSATION FLOW across ${MAX_EXCHANGES} exchanges:`,
      "Exchange 1: Basic greeting, simple question (name, how are you). Pre-A1/A1 level.",
      "Exchange 2: Personal details and daily routines. Pre-A1/A1 level.",
      "Exchange 3: Likes/dislikes and simple preferences. A1/A2 level.",
      "Exchange 4: Short description of recent activity. A1/A2 level.",
      "Exchange 5: Past events or future plans, brief opinions. A2/B1 level.",
      "Exchange 6: Reasons, comparisons, and basic connectors. A2/B1 level.",
      "Exchange 7: Abstract topics and hypothetical situations. B1/B2 level.",
      "Exchange 8: Defend an opinion with supporting details. B1/B2 level.",
      "Exchange 9: Complex discussion with nuance and precision. C1 level.",
      "Exchange 10: Flexible, high-level expression with subtle meaning. C1/C2 level.",
      "Keep your replies brief (≤20 words). Ask ONE question per turn to prompt the user.",
      "Adapt based on their responses — if they struggle, stay at that level longer.",
      "Be encouraging but accurate in your assessment.",
      `PERSONA: ${voicePersona || "patient, encouraging, and conversational"}.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  /* ---- Event handling ---- */
  function extractTextFromItem(item) {
    const parts = Array.isArray(item?.content) ? item.content : [];
    return parts
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .filter(Boolean)
      .join(" ")
      .trim();
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
      dcRef.current.send(JSON.stringify({ type: "input_audio_buffer.clear" }));
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
              silence_duration_ms: pauseMs || 800,
              threshold: 0.35,
              prefix_padding_ms: 120,
              interrupt_response: false,
            },
          },
        }),
      );
    } catch {}
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

  async function handleRealtimeEvent(evt) {
    if (!aliveRef.current) return;
    let data;
    try {
      data = JSON.parse(evt.data);
    } catch {
      return;
    }
    const t = data?.type;
    const rid = data?.response_id || data?.response?.id || data?.id || null;

    if (t === "conversation.item.created" && data?.item) {
      if (data.item?.role === "system") {
        const text = extractTextFromItem(data.item);
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

    // --- Ported from RealTimeTest / Conversations (proven pattern) ---

    if (
      t === "response.output_audio.done" ||
      t === "output_audio.done" ||
      t === "output_audio_buffer.stopped"
    ) {
      enableVAD();
      setAssistantInputLocked(false);
      setUiState(status === "connected" ? "listening" : "idle");
      setMood("neutral");
      if (aliveRef.current) scheduleAutoStop();
      return;
    }

    if (t === "response.created") {
      isIdleRef.current = false;
      clearAutoStopTimer();
      setAssistantInputLocked(true);
      const mid = uid();
      respToMsg.current.set(rid, mid);
      setUiState("speaking");
      setMood("happy");
      return;
    }

    if (
      (t === "conversation.item.input_audio_transcription.completed" ||
        t === "input_audio_transcription.completed") &&
      data?.transcript
    ) {
      const text = (data.transcript || "").trim();
      if (text) {
        const confidence = extractTranscriptConfidence(data);
        let turn = currentSpeechTurnRef.current;
        if (!turn) {
          turn = {
            id: uid(),
            startTs: Date.now(),
            endTs: Date.now(),
            durationMs: 0,
            rmsSamples: 0,
            rmsTotal: 0,
            rmsPeak: 0,
            transcript: "",
            wordCount: 0,
          };
          speechTurnsRef.current.push(turn);
        }
        turn.transcript = text;
        turn.wordCount = text.split(/\s+/).filter(Boolean).length;
        if (typeof confidence === "number")
          turn.transcriptConfidence = confidence;
        if (turn.rmsSamples > 0) turn.rmsAvg = turn.rmsTotal / turn.rmsSamples;

        const now = Date.now();
        if (
          text === lastTranscriptRef.current.text &&
          now - lastTranscriptRef.current.ts < 2000
        ) {
          // Remove orphaned placeholder if transcript is a duplicate
          const staleId = pendingUserMsgRef.current;
          if (staleId) {
            pendingUserMsgRef.current = null;
            setMessages((p) => p.filter((m) => m.id !== staleId));
          }
          return;
        }
        lastTranscriptRef.current = { text, ts: now };

        // Update the placeholder user message if one exists, otherwise create new
        const pendingId = pendingUserMsgRef.current;
        if (pendingId) {
          pendingUserMsgRef.current = null;
          updateMessage(pendingId, (m) => ({
            ...m,
            textFinal: text,
            done: true,
            pendingTranscript: false,
          }));
        } else {
          pushMessage({
            id: uid(),
            role: "user",
            lang: targetLang,
            textFinal: text,
            textStream: "",
            done: true,
            ts: now,
          });
        }
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
      if (t === "response.canceled") setAssistantInputLocked(false);
      isIdleRef.current = true;
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
        respToMsg.current.delete(rid);
      }
      return;
    }

    if (t === "input_audio_buffer.speech_started") {
      if (assistantInputLockedRef.current) return;
      const turn = {
        id: uid(),
        startTs: Date.now(),
        endTs: null,
        durationMs: null,
        rmsSamples: 0,
        rmsTotal: 0,
        rmsPeak: 0,
        transcript: "",
        wordCount: 0,
      };
      speechTurnsRef.current.push(turn);
      currentSpeechTurnRef.current = turn;
      startSpeechSampling();
      setUiState("listening");
      setMood("listening");
      return;
    }

    if (t === "input_audio_buffer.speech_stopped") {
      if (assistantInputLockedRef.current) return;
      const now = Date.now();
      const turn = currentSpeechTurnRef.current;
      if (turn) {
        turn.endTs = now;
        turn.durationMs = Math.max(0, now - (turn.startTs || now));
        if (turn.rmsSamples > 0) turn.rmsAvg = turn.rmsTotal / turn.rmsSamples;
      }
      currentSpeechTurnRef.current = null;
      stopSpeechSampling();

      if (t === "input_audio_buffer.speech_stopped") {
        const now = Date.now();
        const turn = currentSpeechTurnRef.current;
        if (turn) {
          turn.endTs = now;
          turn.durationMs = Math.max(0, now - (turn.startTs || now));
          if (turn.rmsSamples > 0) turn.rmsAvg = turn.rmsTotal / turn.rmsSamples;
        }
        currentSpeechTurnRef.current = null;
        stopSpeechSampling();

        // Create placeholder user message so it renders before the AI response
        const placeholderId = uid();
        pendingUserMsgRef.current = placeholderId;
        pushMessage({
          id: placeholderId,
          role: "user",
          lang: targetLang,
          textFinal: "",
          textStream: "",
          done: false,
          pendingTranscript: true,
          ts: now,
        });

        setUiState("thinking");
        setMood("thinking");
      }
      return;
    }

    if (t === "error" && data?.error?.message) {
      const msg = data.error.message || "";
      if (/Cancellation failed/i.test(msg) || /no active response/i.test(msg))
        return;
      setErr((p) => p || msg);
    }
  }

  /* ---- Check if assessment should trigger ---- */
  useEffect(() => {
    if (userMessageCount >= MAX_EXCHANGES && !assessmentDoneRef.current) {
      assessmentDoneRef.current = true;
      // Stop the session and run assessment
      stop();
      runAssessment();
    }
  }, [userMessageCount]);

  async function runAssessment() {
    setIsEvaluating(true);
    setAssessmentError(false);
    // Collect the full conversation for analysis
    const sorted = [...messagesRef.current].sort(
      (a, b) => (a.ts || 0) - (b.ts || 0),
    );
    const transcript = sorted
      .map((m) => {
        const role = m.role === "user" ? "User" : "AI";
        const text = m.textFinal || m.textStream || "";
        return `${role}: ${text}`;
      })
      .filter((line) => line.includes(": ") && line.split(": ")[1].trim())
      .join("\n");
    const speechEvidence = summarizeSpeechEvidence(
      speechTurnsRef.current || [],
    );

    const LANG_MAP = {
      es: "Spanish", pt: "Portuguese", fr: "French", it: "Italian",
      nl: "Dutch", ja: "Japanese", ru: "Russian", de: "German",
      el: "Greek", pl: "Polish", ga: "Irish", nah: "Nahuatl",
      yua: "Yucatec Maya", en: "English",
    };
    const langName = LANG_MAP[targetLang] || "the target language";
    const supportName = LANG_MAP[supportLang] || "English";

    const insufficientAudioMsg = {
      es: "Evidencia de audio insuficiente.",
      it: "Prove audio insufficienti.",
      pt: "Evidência de áudio insuficiente.",
      fr: "Preuves audio insuffisantes.",
      de: "Unzureichende Audiobeweise.",
      nl: "Onvoldoende audiobewijs.",
      ja: "音声証拠が不十分です。",
      ru: "Недостаточно аудиодоказательств.",
      el: "Ανεπαρκή ηχητικά στοιχεία.",
      pl: "Niewystarczające dowody audio.",
      ga: "Fianaise fuaime neamhleor.",
    }[supportLang] || "Insufficient audio evidence.";

    const prompt = `You are an EXTREMELY STRICT CEFR language proficiency assessor for ${langName}. Your job is to accurately place learners — most test-takers are beginners and should score low.

CONVERSATION TO EVALUATE:
${transcript}

AUDIO EVIDENCE (TURN-LEVEL METADATA):
${JSON.stringify(speechEvidence, null, 2)}

SCORING RULES — BE HARSH AND ACCURATE:
- Score 1-2: No meaningful ${langName} produced. Gibberish, wrong language, single words, or nonsense.
- Score 3-4: Isolated words or memorized phrases only. No sentence construction. Major errors throughout.
- Score 5-6: Can form basic sentences with frequent errors. Limited vocabulary. Simple present tense only.
- Score 7-8: Good sentence variety, multiple tenses, few errors, varied vocabulary, natural flow.
- Score 9-10: Near-native fluency, complex grammar, idiomatic expressions, nuanced vocabulary.

CRITICAL ANTI-INFLATION RULES:
- If the user wrote in the WRONG LANGUAGE (not ${langName}), ALL scores must be 1-2.
- If responses are gibberish, random words, or make no sense, ALL scores must be 1.
- If responses are mostly single words ("si", "no", "ok", "hola"), scores must be 1-3.
- If the user could not form a single complete sentence in ${langName}, cap all scores at 3.
- A score of 5+ requires EVIDENCE of actual sentence construction in ${langName}.
- A score of 7+ requires EVIDENCE of multiple tenses or complex structures.
- Do NOT give credit for the AI's responses — only evaluate what the USER said.
- Do NOT inflate scores to be nice. Accurate placement helps the learner.
- Grammar/vocabulary/comprehension should be scored mainly from transcript content.
- Pronunciation/fluency/confidence MUST use AUDIO EVIDENCE whenever available.
- If hasAudioEvidence is false, set pronunciation note exactly to "${insufficientAudioMsg}" and keep pronunciation score conservative (1-2).

LEVEL PLACEMENT GUIDE:
- Pre-A1: Cannot communicate in ${langName}. Wrong language, gibberish, or only isolated words.
- A1: Can say basic greetings and simple phrases. Very limited grammar.
- A2: Can form simple sentences about familiar topics. Basic grammar control.
- B1: Can discuss past/future, give opinions, use connectors. Consistent grammar.
- B2: Can argue, discuss abstract topics, self-correct. Varied grammar and vocabulary.
- C1/C2: Near-native precision, idioms, register control, complex argumentation.

LANGUAGE REQUIREMENT: Write the "summary" and every criterion "note" in ${supportName}, not English.

Return ONLY valid JSON:
{"level":"Pre-A1","summary":"[2-3 sentence assessment in ${supportName}]","scores":{"pronunciation":{"score":1,"note":"[reason in ${supportName}]"},"grammar":{"score":1,"note":"[reason in ${supportName}]"},"vocabulary":{"score":1,"note":"[reason in ${supportName}]"},"fluency":{"score":1,"note":"[reason in ${supportName}]"},"confidence":{"score":1,"note":"[reason in ${supportName}]"},"comprehension":{"score":1,"note":"[reason in ${supportName}]"}}}`;

    try {
      const resp = await gradingModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const result = resp.response;
      let resultText = "";
      if (typeof result?.text === "function") {
        resultText = result.text();
      } else if (typeof result?.text === "string") {
        resultText = result.text;
      } else {
        const cand = result?.candidates?.[0];
        if (cand?.content?.parts?.length) {
          resultText = cand.content.parts.map((p) => p.text || "").join("");
        }
      }

      const parsed = safeParseJson(resultText);
      const userTexts = sorted
        .filter((m) => m.role === "user")
        .map((m) => (m.textFinal || m.textStream || "").trim())
        .filter(Boolean);

      if (parsed?.level) {
        const modelLevel = normalizeCefrLevel(parsed.level);
        const strictLevel = getStrictPlacementFromEvidence(
          userTexts,
          parsed.scores,
          modelLevel,
        );
        setAssessedLevel(
          CEFR_LEVELS.includes(strictLevel) ? strictLevel : "Pre-A1",
        );
        setAssessmentSummary(parsed.summary || "");
        if (parsed.scores && typeof parsed.scores === "object") {
          if (
            !speechEvidence?.hasAudioEvidence &&
            parsed?.scores?.pronunciation
          ) {
            const currentScore =
              typeof parsed.scores.pronunciation === "number"
                ? parsed.scores.pronunciation
                : typeof parsed?.scores?.pronunciation?.score === "number"
                  ? parsed.scores.pronunciation.score
                  : 1;
            parsed.scores.pronunciation = {
              ...(typeof parsed.scores.pronunciation === "object"
                ? parsed.scores.pronunciation
                : {}),
              score: Math.min(2, Math.max(1, currentScore)),
              note: "Insufficient audio evidence.",
            };
          }
          setAssessmentScores(parsed.scores);
        }
      } else {
        // Try to extract level from text
        const levelMatch = resultText?.match?.(
          /\b(A0|Pre-A1|A1|A2|B1|B2|C1|C2)\b/,
        );
        const fallbackLevel = getStrictPlacementFromEvidence(
          userTexts,
          parsed?.scores,
          normalizeCefrLevel(levelMatch?.[1] || "A1"),
        );
        setAssessedLevel(
          CEFR_LEVELS.includes(fallbackLevel) ? fallbackLevel : "Pre-A1",
        );
        setAssessmentSummary(
          parsed?.summary || ui.proficiency_test_assess_fallback,
        );
      }
    } catch (e) {
      console.error("Assessment failed:", e);
      setAssessmentError(true);
      setAssessedLevel("Pre-A1");
      setAssessmentSummary(ui.proficiency_test_assess_error);
    }

    setIsEvaluating(false);
    playSound(completeSound);
    setShowResult(true);
  }

  /* ---- Unlock levels and return to app ---- */
  const handleReturnToApp = useCallback(async () => {
    if (!currentNpub || !assessedLevel) {
      navigate("/");
      return;
    }

    try {
      // Mark all levels up to the assessed level as unlocked
      // by setting the user's proficiency placement level per-language
      const levelIndex = CEFR_LEVELS.indexOf(assessedLevel);

      await setDoc(
        doc(database, "users", currentNpub),
        {
          proficiencyPlacement: assessedLevel,
          proficiencyPlacements: { [targetLang]: assessedLevel },
          proficiencyPlacementAt: new Date().toISOString(),
          activeLessonLevel: assessedLevel,
          activeFlashcardLevel: assessedLevel,
          "progress.level": assessedLevel,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      // Update local user state
      patchUser({
        proficiencyPlacement: assessedLevel,
        proficiencyPlacements: {
          ...(user?.proficiencyPlacements || {}),
          [targetLang]: assessedLevel,
        },
        activeLessonLevel: assessedLevel,
        activeFlashcardLevel: assessedLevel,
        progress: {
          ...(user?.progress || {}),
          level: assessedLevel,
        },
      });
    } catch (e) {
      console.error("Failed to save proficiency placement:", e);
    }

    navigate("/");
  }, [currentNpub, assessedLevel, navigate, patchUser, user?.progress]);

  /* ---- Confirm exit: mark placement as skipped and leave ---- */
  const handleConfirmExit = useCallback(async () => {
    setShowExitConfirm(false);
    if (currentNpub) {
      try {
        await setDoc(
          doc(database, "users", currentNpub),
          {
            proficiencyPlacement: "skipped",
            proficiencyPlacements: { [targetLang]: "skipped" },
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
        patchUser({
          proficiencyPlacement: "skipped",
          proficiencyPlacements: {
            ...(user?.proficiencyPlacements || {}),
            [targetLang]: "skipped",
          },
        });
      } catch (e) {
        console.warn("Failed to persist proficiency skip:", e);
      }
    }
    navigate("/");
  }, [
    currentNpub,
    targetLang,
    navigate,
    patchUser,
    user?.proficiencyPlacements,
  ]);

  const handleTryAgain = useCallback(() => {
    stop();
    setShowResult(false);
    setMessages([]);
    setErr("");
    setUiState("idle");
    setMood("neutral");
    assessmentDoneRef.current = false;
    setIsEvaluating(false);
    setAssessmentError(false);
    setAssessedLevel(null);
    setAssessmentSummary("");
    setAssessmentScores(null);
    speechTurnsRef.current = [];
    currentSpeechTurnRef.current = null;
    stopSpeechSampling();
    respToMsg.current.clear();
    streamBuffersRef.current = new Map();
    guardrailItemIdsRef.current = [];
    pendingGuardrailTextRef.current = "";
  }, []);

  const scoreInsight = useMemo(() => {
    if (!assessmentScores) return null;
    const weighted = {
      pronunciation: 1,
      grammar: 1.25,
      vocabulary: 1.1,
      fluency: 1.25,
      confidence: 0.9,
      comprehension: 1.5,
    };

    let totalWeight = 0;
    let weightedScore = 0;
    const considered = [];

    for (const criterion of ASSESSMENT_CRITERIA) {
      const raw = assessmentScores[criterion.key];
      const score =
        typeof raw?.score === "number"
          ? raw.score
          : typeof raw === "number"
            ? raw
            : null;
      if (score === null) continue;
      const clamped = Math.max(1, Math.min(10, score));
      const weight = weighted[criterion.key] || 1;
      weightedScore += clamped * weight;
      totalWeight += weight;
      considered.push(criterion.key);
    }

    if (!totalWeight) return null;
    return {
      finalScore: (weightedScore / totalWeight).toFixed(1),
      considered,
      totalWeight: totalWeight.toFixed(2),
    };
  }, [assessmentScores]);

  /* ---- Connect / Disconnect ---- */
  async function start() {
    playSound(submitActionSound);
    clearAutoStopTimer();
    setErr("");
    setMessages([]);
    respToMsg.current.clear();
    guardrailItemIdsRef.current = [];
    pendingGuardrailTextRef.current = "";
    assessmentDoneRef.current = false;
    setShowResult(false);
    setAssessedLevel(null);
    setAssessmentSummary("");
    setAssessmentScores(null);
    speechTurnsRef.current = [];
    currentSpeechTurnRef.current = null;
    stopSpeechSampling();
    streamBuffersRef.current = new Map();
    if (streamFlushTimerRef.current) {
      clearTimeout(streamFlushTimerRef.current);
      streamFlushTimerRef.current = null;
    }
    setStatus("connecting");
    setUiState("idle");

    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const remote = new MediaStream();
      if (audioRef.current) {
        audioRef.current.srcObject = remote;
        audioRef.current.autoplay = true;
        audioRef.current.playsInline = true;
      }
      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach((t) => remote.addTrack(t));
      };
      pc.addTransceiver("audio", { direction: "recvonly" });

      const local = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localRef.current = local;
      assistantInputLockedRef.current = false;
      setLocalMicEnabled(true);
      local.getTracks().forEach((track) => pc.addTrack(track, local));

      if (!audioGraphReadyRef.current) {
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          const ctx = new Ctx();
          const srcNode = ctx.createMediaStreamSource(local);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.2;
          srcNode.connect(analyser);
          audioCtxRef.current = ctx;
          analyserRef.current = analyser;
          floatBufRef.current = new Float32Array(analyser.fftSize);
          audioGraphReadyRef.current = true;
        } catch (e) {
          console.warn("Mic AudioContext init failed:", e?.message || e);
        }
      }

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        const voiceName = getRandomVoice();
        const instructions = buildProficiencyInstructions();

        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              instructions,
              modalities: ["audio", "text"],
              voice: voiceName,
              turn_detection: buildTurnDetectionConfig(),
              input_audio_transcription: {
                model: "whisper-1",
                language: targetLanguageCode,
                prompt:
                  "Transcribe exactly what the speaker says in the original spoken language. Do not translate.",
              },
              output_audio_format: "pcm16",
            },
          }),
        );

        pendingGuardrailTextRef.current = instructions;
        dc.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "system",
              content: [{ type: "input_text", text: instructions }],
            },
          }),
        );
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
      setUiState("listening");
      scheduleAutoStop();
    } catch (e) {
      clearAutoStopTimer();
      setStatus("disconnected");
      setUiState("idle");
      setErr(e?.message || String(e));
    }
  }

  function stop() {
    clearAutoStopTimer();
    aliveRef.current = false;
    assistantInputLockedRef.current = false;
    setLocalMicEnabled(true);
    try {
      if (dcRef.current?.readyState === "open") {
        try {
          dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
        } catch {}
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
      }
    } catch {}
    try {
      localRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    dcRef.current = null;
    localRef.current = null;
    try {
      audioCtxRef.current?.close();
    } catch {}
    audioCtxRef.current = null;
    analyserRef.current = null;
    floatBufRef.current = null;
    captureOutRef.current = null;
    currentSpeechTurnRef.current = null;
    stopSpeechSampling();
    audioGraphReadyRef.current = false;
    setStatus("disconnected");
    setUiState("idle");
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      aliveRef.current = false;
      clearAutoStopTimer();
      if (streamFlushTimerRef.current)
        clearTimeout(streamFlushTimerRef.current);
      stopSpeechSampling();
      try {
        audioCtxRef.current?.close();
      } catch {}
      try {
        localRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      try {
        pcRef.current?.close();
      } catch {}
    };
  }, []);

  /* ---- Timeline (deduplicated + strict alternation) ---- */
  const timeline = useMemo(() => {
    const sorted = [...messages].sort((a, b) => (b?.ts || 0) - (a?.ts || 0));
    // Deduplicate assistant messages with identical text
    const seenAssistantText = new Set();
    const deduped = sorted.filter((m) => {
      if (m.role !== "assistant") return true;
      const text = ((m.textFinal || "") + (m.textStream || "")).trim();
      if (!text) return false;
      if (seenAssistantText.has(text)) return false;
      seenAssistantText.add(text);
      return true;
    });
    // Enforce strict one-to-one alternation (newest first).
    // When consecutive messages share the same role, keep only the first
    // (most recent) one so the conversation stays user ↔ assistant.
    const alternated = [];
    for (const m of deduped) {
      if (alternated.length === 0) {
        alternated.push(m);
        continue;
      }
      const prevRole = alternated[alternated.length - 1].role;
      if (m.role !== prevRole) {
        alternated.push(m);
      }
    }
    return alternated;
  }, [messages]);
  const latestAssistantMessage = useMemo(
    () =>
      timeline.find(
        (m) =>
          m.role === "assistant" &&
          `${m.textFinal || ""}${m.textStream || ""}`.trim(),
      ) || null,
    [timeline],
  );
  const latestAssistantText = `${latestAssistantMessage?.textFinal || ""}${
    latestAssistantMessage?.textStream || ""
  }`;
  const getAssistantMessageTextById = useCallback(
    (messageId) => {
      const message = timeline.find((entry) => entry.id === messageId);
      return `${message?.textFinal || ""}${message?.textStream || ""}`;
    },
    [timeline],
  );
  const {
    archiveAnimation,
    chatLogButtonRef,
    isChatLogHighlighted,
    liveBubbleSurfaceRef,
    liveBubbleTextRef,
    contentOpacity: liveBubbleContentOpacity,
    contentTransform: liveBubbleContentTransform,
  } = useArchiveTextStream({
    latestMessageId: latestAssistantMessage?.id,
    latestMessageText: latestAssistantText,
    getOutgoingTextById: getAssistantMessageTextById,
  });
  const chatLogButtonHighlightProps =
    getChatLogButtonHighlightProps(isChatLogHighlighted, isLightTheme);
  const liveUiState =
    status === "connected" && uiState === "idle" ? "listening" : uiState;
  const orbUiState = getRealtimeOrbVisualState(liveUiState);

  /* ---- Render ---- */
  const levelInfo = assessedLevel ? CEFR_LEVEL_INFO[assessedLevel] : null;
  const rubricRows = [
    {
      level: "Pre-A1",
      range: "1.0 - 3.1",
      badgeColor: "purple",
      en: "Single words, fillers, or very short responses. Frequent comprehension breakdowns.",
      es: "Palabras sueltas, muletillas o respuestas muy cortas. Fallos frecuentes de comprensión.",
      it: "Parole isolate, riempitivi o risposte molto brevi. Frequenti problemi di comprensione.",
      fr: "Mots isoles, remplissages ou reponses tres courtes. Ruptures frequentes de comprehension.",
      ja: "単語だけ、つなぎ言葉、または非常に短い回答。理解の途切れが多い。",
    },
    {
      level: "A1",
      range: "3.2 - 4.3",
      badgeColor: "purple",
      en: "Can handle greetings and personal basics with simple memorized patterns.",
      es: "Puede manejar saludos y datos personales con patrones simples memorizados.",
      it: "Riesce a gestire saluti e dati personali con schemi semplici e memorizzati.",
      fr: "Peut gerer les salutations et les bases personnelles avec des modeles simples memorises.",
      ja: "あいさつや個人情報を、覚えた簡単な型で扱える。",
    },
    {
      level: "A2",
      range: "4.4 - 5.5",
      badgeColor: "purple",
      en: "Can discuss routine topics and answer straightforward questions with limited detail.",
      es: "Puede hablar de temas rutinarios y responder preguntas directas con poco detalle.",
      it: "Riesce a discutere argomenti di routine e rispondere a domande semplici con dettagli limitati.",
      fr: "Peut discuter de sujets routiniers et repondre a des questions simples avec peu de details.",
      ja: "日常的な話題を話し、直接的な質問に限られた詳細で答えられる。",
    },
    {
      level: "B1",
      range: "5.6 - 6.7",
      badgeColor: "blue",
      en: "Can explain opinions, narrate events, and maintain short conversations with some errors.",
      es: "Puede explicar opiniones, narrar eventos y mantener conversaciones cortas con algunos errores.",
      it: "Sa esprimere opinioni, narrare eventi e sostenere brevi conversazioni con qualche errore.",
      fr: "Peut expliquer des opinions, raconter des evenements et maintenir de courtes conversations avec quelques erreurs.",
      ja: "意見を説明し、出来事を語り、多少の誤りがあっても短い会話を続けられる。",
    },
    {
      level: "B2",
      range: "6.8 - 7.9",
      badgeColor: "blue",
      en: "Can communicate clearly on familiar and abstract topics with good control and fluency.",
      es: "Puede comunicarse claramente sobre temas familiares y abstractos con buen control y fluidez.",
      it: "Sa comunicare chiaramente su argomenti familiari e astratti con buon controllo e fluidità.",
      fr: "Peut communiquer clairement sur des sujets familiers et abstraits avec un bon controle et une bonne fluidite.",
      ja: "身近な話題や抽象的な話題について、良い制御と流暢さで明確に伝えられる。",
    },
    {
      level: "C1",
      range: "8.0 - 8.7",
      badgeColor: "pink",
      en: "Can produce flexible, nuanced language in longer responses with strong comprehension.",
      es: "Puede producir lenguaje flexible y matizado en respuestas largas con gran comprensión.",
      it: "Sa produrre un linguaggio flessibile e sfumato in risposte più lunghe con forte comprensione.",
      fr: "Peut produire une langue souple et nuancee dans des reponses longues avec une forte comprehension.",
      ja: "長めの回答で、柔軟でニュアンスのある表現を強い理解とともに使える。",
    },
    {
      level: "C2",
      range: "8.8 - 10.0",
      badgeColor: "pink",
      en: "Near-native precision, speed, and adaptability across complex topics.",
      es: "Precisión, velocidad y adaptabilidad casi nativas en temas complejos.",
      it: "Precisione, velocità e adattabilità quasi native su argomenti complessi.",
      fr: "Precision, vitesse et adaptabilite presque natives sur des sujets complexes.",
      ja: "複雑な話題でも、ネイティブに近い正確さ、速さ、適応力がある。",
    },
  ];

  return (
    <>
      <Box
        minH="100vh"
        bg={isLightTheme ? "var(--app-bg)" : "#0b1020"}
        color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
        position="relative"
        pb="140px"
        sx={isLightTheme ? PAPER_PAGE_SX : {
          background:
            "radial-gradient(circle at 20% 15%, rgba(30,64,175,0.2) 0%, transparent 42%), " +
            "radial-gradient(circle at 82% 25%, rgba(6,95,70,0.14) 0%, transparent 40%), " +
            "linear-gradient(180deg, rgba(9,13,30,0.98) 0%, rgba(4,8,22,0.99) 100%)",
          "&::before": {
            content: '\"\"',
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 1px, transparent 1px, transparent 28px), " +
              "repeating-linear-gradient(90deg, rgba(148,163,184,0.05) 0px, rgba(148,163,184,0.05) 1px, transparent 1px, transparent 28px)",
            opacity: 0.45,
            mixBlendMode: "screen",
            pointerEvents: "none",
          },
          "& > :not([data-proficiency-bottom-dock='true'])": {
            position: "relative",
            zIndex: 1,
          },
        }}
      >
        {/* Header */}
        <Box px={4} py={4} position="relative">
          <IconButton
            icon={<CloseIcon />}
            aria-label="Close"
            variant="ghost"
            color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
            _hover={{
              color: isLightTheme ? APP_TEXT_PRIMARY : "gray.200",
              bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
            }}
            size="sm"
            position="absolute"
            top={3}
            right={4}
            onClick={() => setShowExitConfirm(true)}
          />
        </Box>

        {/* Progress + Robot */}
        <Box px={4} mt={4} display="flex" justifyContent="center">
          <Box
            p={3}
            rounded="2xl"
            border="1px solid"
            borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.06)"}
            width="100%"
            maxWidth="400px"
            position="relative"
            sx={isLightTheme ? PAPER_PANEL_SX : MATRIX_PANEL_SX}
            boxShadow={isLightTheme ? APP_SHADOW : undefined}
          >
            <IconButton
              ref={chatLogButtonRef}
              icon={<FaRegCommentDots size={14} />}
              size="sm"
              variant="ghost"
              colorScheme="cyan"
              {...chatLogButtonHighlightProps}
              onClick={() => setShowChatLog(true)}
              isDisabled={!timeline.length}
              position="absolute"
              top={2}
              right={2}
              minW="36px"
              h="36px"
              zIndex={4}
              pointerEvents="auto"
              aria-label={ui.ra_chat_log}
            />

            <VStack align="center" spacing={2} width="100%">
              <Text
                fontSize="lg"
                fontWeight="bold"
                color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
                textAlign="center"
              >
                {ui.proficiency_test_title}
              </Text>
              <Box w="100%">
                <HStack justify="space-between" align="center" mb={1}>
                  <HStack spacing={2} align="center" flex="1">
                    <Text
                      fontSize="sm"
                      opacity={0.9}
                      color={isLightTheme ? APP_TEXT_SECONDARY : "white"}
                      flex="1"
                    >
                      {ui.proficiency_test_instruction}
                    </Text>
                  </HStack>
                </HStack>

                <Box mt={3}>
                  <HStack justifyContent="space-between" mb={1}>
                    <Badge colorScheme="cyan" variant="subtle" fontSize="10px">
                      {ui.ra_progress_header}
                    </Badge>
                    <Badge colorScheme="teal" variant="subtle" fontSize="10px">
                      {Math.min(userMessageCount, MAX_EXCHANGES)}/
                      {MAX_EXCHANGES}
                    </Badge>
                  </HStack>
                  <WaveBar value={progressPct} />
                </Box>
              </Box>
              <HStack spacing={2} mt={2}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="teal"
                  onClick={handleTryAgain}
                  bg={isLightTheme ? APP_SURFACE : undefined}
                  color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                  borderColor={isLightTheme ? APP_BORDER : undefined}
                  _hover={
                    isLightTheme
                      ? { bg: APP_SURFACE_MUTED, borderColor: APP_BORDER }
                      : undefined
                  }
                >
                  {ui.history_speech_start_over}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="teal"
                  onClick={() => setShowRubric(true)}
                  bg={isLightTheme ? APP_SURFACE : undefined}
                  color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                  borderColor={isLightTheme ? APP_BORDER : undefined}
                  _hover={
                    isLightTheme
                      ? { bg: APP_SURFACE_MUTED, borderColor: APP_BORDER }
                      : undefined
                  }
                >
                  {ui.proficiency_test_rubric}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>

        <VStack spacing={0.5} align="center" mt={2}>
          <Box width="132px" opacity={0.95}>
            <VoiceOrb state={orbUiState} />
          </Box>
          {uiStateLabel(liveUiState, ui) && (
            <Text
              fontSize="xs"
              color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
            >
              {uiStateLabel(liveUiState, ui)}
            </Text>
          )}
        </VStack>

        {/* Live assistant panel */}
        <VStack align="stretch" spacing={3} px={4} mt={3}>
          {isEvaluating && (
            <VStack spacing={0} py={6}>
              {/* Card with loading text */}
              <Box
                bg={
                  isLightTheme
                    ? APP_SURFACE_ELEVATED
                    : "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,70,0.95) 50%, rgba(15,23,42,0.95) 100%)"
                }
                border="1px solid"
                borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
                rounded="2xl"
                pt={6}
                pb={5}
                px={6}
                w="100%"
                maxW="340px"
                textAlign="center"
                boxShadow={
                  isLightTheme
                    ? APP_SHADOW
                    : "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)"
                }
              >
                <VStack spacing={3}>
                  <HStack spacing={2} justify="center">
                    <Text
                      fontWeight="bold"
                      fontSize="lg"
                      color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                    >
                      {ui.proficiency_test_evaluating}
                    </Text>
                  </HStack>
                  <Text
                    fontSize="sm"
                    opacity={0.7}
                    color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
                  >
                    {ui.proficiency_test_analyzing}
                  </Text>
                </VStack>
              </Box>
            </VStack>
          )}
          {latestAssistantMessage && (
            <Center>
              <Box w="100%" maxW="680px">
                <AssistantBubble
                  containerRef={liveBubbleSurfaceRef}
                  primaryTextRef={liveBubbleTextRef}
                  contentOpacity={liveBubbleContentOpacity}
                  contentTransform={liveBubbleContentTransform}
                  label={ui.proficiency_test_assessor}
                  text={`${latestAssistantMessage.textFinal || ""}${
                    latestAssistantMessage.textStream || ""
                  }`}
                />
              </Box>
            </Center>
          )}
        </VStack>

        {/* Bottom dock */}
        <Center
          data-proficiency-bottom-dock="true"
          position="fixed"
          bottom="22px"
          left="0"
          right="0"
          zIndex={30}
          px={4}
        >
          <VStack spacing={2} w="100%" maxW="560px" justify="center">
            <Button
              onClick={status === "connected" ? stop : start}
              size="lg"
              height="64px"
              px={{ base: 8, md: 12 }}
              rounded="full"
              colorScheme={status === "connected" ? undefined : "cyan"}
              background={
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
              mb={3}
              isDisabled={userMessageCount >= MAX_EXCHANGES}
            >
              {status === "connected" ? (
                <>
                  <FaStop /> &nbsp; {ui.story_stop}
                </>
              ) : (
                <>
                  <PiMicrophoneStageDuotone /> &nbsp;{" "}
                  {status === "connecting"
                    ? ui.vocab_connecting
                    : ui.proficiency_test_start}
                </>
              )}
            </Button>
          </VStack>
        </Center>

        {err && (
          <Box px={4} pt={2}>
            <Box
              as="pre"
              bg={isLightTheme ? APP_SURFACE : "rgba(255,255,255,0.06)"}
              border="1px solid"
              borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.12)"}
              p={3}
              borderRadius={8}
              whiteSpace="pre-wrap"
              color={isLightTheme ? "#8a4d5a" : "#fee2e2"}
            >
              {err}
            </Box>
          </Box>
        )}

      {/* Remote live audio sink */}
      <audio ref={audioRef} />
      <ArchiveTextAnimation animation={archiveAnimation} />
      </Box>

      <Modal
        isOpen={showChatLog}
        onClose={() => setShowChatLog(false)}
        size="xl"
      >
        <ModalOverlay
          bg={isLightTheme ? "rgba(76, 60, 40, 0.18)" : "blackAlpha.700"}
          backdropFilter="blur(4px)"
        />
        <ModalContent
          bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          borderWidth="1px"
          borderColor={isLightTheme ? APP_BORDER : undefined}
        >
          <ModalHeader>{ui.ra_chat_log}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={3}>
              {timeline.map((m) => {
                if (m.role === "user") {
                  const userText = m.pendingTranscript ? "…" : m.textFinal;
                  return (
                    <RowRight key={m.id}>
                      <UserBubble label={ui.proficiency_test_you} text={userText} />
                    </RowRight>
                  );
                }

                const text = `${m.textFinal || ""}${m.textStream || ""}`.trim();
                if (!text) return null;
                return (
                  <RowLeft key={m.id}>
                    <AssistantBubble
                      label={ui.proficiency_test_assessor}
                      text={text}
                    />
                  </RowLeft>
                );
              })}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ---- Result Drawer ---- */}
      <Drawer
        isOpen={showResult}
        placement="bottom"
        onClose={() => {}}
        closeOnOverlayClick={false}
        closeOnEsc={false}
      >
        <DrawerOverlay
          bg={isLightTheme ? "rgba(76, 60, 40, 0.18)" : "blackAlpha.700"}
          backdropFilter="blur(6px)"
        />
        <DrawerContent
          bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          borderTopRadius="24px"
          maxH="92vh"
          display="flex"
          flexDirection="column"
          borderTop={isLightTheme ? `1px solid ${APP_BORDER}` : undefined}
          boxShadow={
            isLightTheme
              ? "0 -18px 42px rgba(111, 86, 54, 0.12)"
              : undefined
          }
          sx={{
            "@supports (height: 100dvh)": {
              maxHeight: "92dvh",
            },
          }}
        >
          <DrawerBody px={{ base: 4, md: 6 }} py={0} overflowY="auto">
            <VStack spacing={5} align="stretch" w="100%" maxW="1180px" mx="auto">
              {/* Header */}
              <Box
                bg={isLightTheme ? APP_SURFACE : undefined}
                bgGradient={
                  isLightTheme
                    ? undefined
                    : levelInfo
                      ? `linear(to-r, ${levelInfo.color}, purple.500)`
                      : "linear(to-r, cyan.500, purple.500)"
                }
                px={{ base: 5, md: 8 }}
                py={{ base: 6, md: 7 }}
                mt={4}
                rounded="3xl"
                border="1px solid"
                borderColor={
                  isLightTheme ? APP_BORDER : "rgba(255,255,255,0.12)"
                }
                boxShadow={isLightTheme ? APP_SHADOW : undefined}
                sx={isLightTheme ? PAPER_PANEL_SX : undefined}
              >
                <VStack spacing={3} align="center">
                  <Box
                    bg={isLightTheme ? APP_SURFACE : "whiteAlpha.200"}
                    p={3}
                    rounded="full"
                    border={isLightTheme ? "1px solid" : undefined}
                    borderColor={isLightTheme ? APP_BORDER_STRONG : undefined}
                    boxShadow={isLightTheme ? "0 8px 18px rgba(111, 86, 54, 0.08)" : undefined}
                  >
                    <Box
                      as={LuBadgeCheck}
                      fontSize="36px"
                      color={isLightTheme ? "#0f766e" : "white"}
                    />
                  </Box>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color={isLightTheme ? APP_TEXT_MUTED : "whiteAlpha.800"}
                  >
                    {ui.proficiency_test_final_result}
                  </Text>
                  <Text
                    fontSize={{ base: "2xl", md: "3xl" }}
                    fontWeight="bold"
                    color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                    textAlign="center"
                  >
                    {ui.proficiency_test_complete}
                  </Text>
                  {assessedLevel && (
                    <Badge
                      colorScheme={isLightTheme ? undefined : "whiteAlpha"}
                      bg={isLightTheme ? APP_SURFACE : "whiteAlpha.300"}
                      color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
                      fontSize="lg"
                      px={5}
                      py={1.5}
                      rounded="full"
                      fontWeight="bold"
                      border={isLightTheme ? "1px solid" : undefined}
                      borderColor={isLightTheme ? APP_BORDER_STRONG : undefined}
                      boxShadow={isLightTheme ? "0 6px 14px rgba(111, 86, 54, 0.06)" : undefined}
                    >
                      {assessedLevel} —{" "}
                      {levelInfo?.name?.[supportLang] || levelInfo?.name?.en || assessedLevel}
                    </Badge>
                  )}
                </VStack>
              </Box>
              {/* Summary */}
              {assessmentSummary && (
                <Box
                  bg={isLightTheme ? APP_SURFACE : "gray.800"}
                  px={{ base: 4, md: 6 }}
                  py={{ base: 4, md: 5 }}
                  rounded="2xl"
                  border="1px solid"
                  borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.10)"}
                  boxShadow={isLightTheme ? "0 8px 20px rgba(111, 86, 54, 0.06)" : undefined}
                >
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                    mb={2}
                    textAlign="center"
                    color={isLightTheme ? APP_TEXT_MUTED : "whiteAlpha.700"}
                  >
                    {ui.proficiency_test_summary}
                  </Text>
                  <Text
                    fontSize={{ base: "md", md: "lg" }}
                    textAlign="center"
                    lineHeight="1.8"
                    color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                  >
                    {assessmentSummary}
                  </Text>
                </Box>
              )}

              {/* Individual criterion scores — compact grid */}
              {assessmentScores && (
                <>
                  <Divider borderColor={isLightTheme ? APP_BORDER : "gray.700"} />
                  <Box>
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      mb={3}
                      letterSpacing="0.05em"
                      textTransform="uppercase"
                      color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                    >
                      {ui.proficiency_test_breakdown}
                    </Text>
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3}>
                      {ASSESSMENT_CRITERIA.map((criterion) => {
                        const data = assessmentScores[criterion.key];
                        const score =
                          typeof data?.score === "number"
                            ? Math.max(1, Math.min(10, data.score))
                            : typeof data === "number"
                              ? Math.max(1, Math.min(10, data))
                              : null;
                        const note =
                          typeof data?.note === "string" ? data.note : "";
                        const color = scoreColor(score);
                        const colorMap = {
                          green: "#48BB78",
                          teal: "#38B2AC",
                          yellow: "#ECC94B",
                          red: "#FC8181",
                        };
                        const accent = colorMap[color] || "#A0AEC0";
                        const lightToneMap = {
                          green: {
                            fg: "#166534",
                            bg: "rgba(74, 222, 128, 0.16)",
                            border: "rgba(34, 197, 94, 0.28)",
                          },
                          teal: {
                            fg: "#0f766e",
                            bg: "rgba(45, 212, 191, 0.16)",
                            border: "rgba(20, 184, 166, 0.28)",
                          },
                          yellow: {
                            fg: "#a16207",
                            bg: "rgba(250, 204, 21, 0.18)",
                            border: "rgba(234, 179, 8, 0.28)",
                          },
                          red: {
                            fg: "#b91c1c",
                            bg: "rgba(248, 113, 113, 0.14)",
                            border: "rgba(248, 113, 113, 0.28)",
                          },
                        };
                        const lightTone = lightToneMap[color] || {
                          fg: APP_TEXT_PRIMARY,
                          bg: APP_SURFACE_MUTED,
                          border: APP_BORDER,
                        };

                        return (
                          <GridItem key={criterion.key}>
                            <Box
                              bg={isLightTheme ? APP_SURFACE : "gray.800"}
                              px={4}
                              py={3.5}
                              rounded="2xl"
                              borderLeft="3px solid"
                              borderLeftColor={isLightTheme ? lightTone.border : accent}
                              h="100%"
                              border={isLightTheme ? "1px solid" : undefined}
                              borderColor={isLightTheme ? APP_BORDER : undefined}
                              boxShadow={
                                isLightTheme
                                  ? "0 8px 18px rgba(111, 86, 54, 0.05)"
                                  : undefined
                              }
                            >
                              <HStack
                                justify="space-between"
                                align="start"
                                mb={2}
                              >
                                <Text
                                  fontSize="sm"
                                  fontWeight="semibold"
                                  color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                                >
                                  {criterion[supportLang] || criterion.en}
                                </Text>
                                {score !== null && (
                                  <Box
                                    px={2.5}
                                    py={1}
                                    rounded="full"
                                    bg={isLightTheme ? lightTone.bg : undefined}
                                  >
                                    <Text
                                      fontSize="md"
                                      fontWeight="bold"
                                      color={isLightTheme ? lightTone.fg : accent}
                                      lineHeight="1"
                                    >
                                      {score}
                                    </Text>
                                  </Box>
                                )}
                              </HStack>
                              {note && (
                                <Text
                                  fontSize="xs"
                                  lineHeight="1.6"
                                  noOfLines={3}
                                  color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                                >
                                  {note}
                                </Text>
                              )}
                            </Box>
                          </GridItem>
                        );
                      })}
                    </Grid>
                  </Box>
                </>
              )}

              {scoreInsight && (
                <HStack
                  bg={isLightTheme ? APP_SURFACE : "gray.800"}
                  px={4}
                  py={3}
                  rounded="2xl"
                  justify="space-between"
                  align="center"
                  border={isLightTheme ? "1px solid" : undefined}
                  borderColor={isLightTheme ? APP_BORDER : undefined}
                  boxShadow={
                    isLightTheme
                      ? "0 8px 18px rgba(111, 86, 54, 0.05)"
                      : undefined
                  }
                >
                  <Text
                    fontSize="xs"
                    color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                  >
                    {ui.proficiency_test_composite}
                  </Text>
                  <Text
                    fontSize="md"
                    fontWeight="bold"
                    color={isLightTheme ? "#0f766e" : "cyan.300"}
                  >
                    {scoreInsight.finalScore}/10
                  </Text>
                </HStack>
              )}

              <Divider borderColor={isLightTheme ? APP_BORDER : "gray.700"} />

              {assessedLevel && (
                <Box
                  bg={isLightTheme ? APP_SURFACE : "gray.800"}
                  px={{ base: 4, md: 5 }}
                  py={{ base: 4, md: 4 }}
                  rounded="2xl"
                  border={isLightTheme ? "1px solid" : undefined}
                  borderColor={isLightTheme ? APP_BORDER : undefined}
                  boxShadow={
                    isLightTheme
                      ? "0 8px 18px rgba(111, 86, 54, 0.05)"
                      : undefined
                  }
                >
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    mb={2}
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                    color={isLightTheme ? APP_TEXT_MUTED : undefined}
                  >
                    {ui.proficiency_test_level_label?.replace("{level}", assessedLevel) || `Level ${assessedLevel}`}
                  </Text>
                  <VStack align="start" spacing={1}>
                    {(
                      CEFR_LEVEL_OFFERINGS[assessedLevel]?.[supportLang] ||
                      CEFR_LEVEL_OFFERINGS[assessedLevel]?.en ||
                      []
                    ).map((item) => (
                      <Text
                        key={item}
                        fontSize="xs"
                        lineHeight="1.55"
                        color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                      >
                        {item}
                      </Text>
                    ))}
                  </VStack>
                  {assessedLevel !== "Pre-A1" && (
                    <HStack mt={3} spacing={1.5} flexWrap="wrap">
                      {CEFR_LEVELS.slice(
                        0,
                        CEFR_LEVELS.indexOf(assessedLevel) + 1,
                      ).map((lvl) => (
                        <Badge
                          key={lvl}
                          colorScheme="green"
                          variant="subtle"
                          fontSize="2xs"
                          px={1.5}
                          py={0.5}
                        >
                          {lvl}
                        </Badge>
                      ))}
                    </HStack>
                  )}
                </Box>
              )}

              {assessmentError && (
                <Text
                  fontSize="sm"
                  color={isLightTheme ? "#9a7d3c" : "yellow.300"}
                  textAlign="center"
                >
                  {ui.proficiency_test_eval_error}
                </Text>
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter
            borderTop="1px solid"
            borderColor={isLightTheme ? APP_BORDER : "gray.700"}
            bg={isLightTheme ? "rgba(255, 253, 249, 0.96)" : "gray.900"}
            backdropFilter={isLightTheme ? "blur(10px)" : undefined}
            position="sticky"
            bottom={0}
            zIndex={2}
            px={{ base: 4, md: 6 }}
            py={4}
          >
            <HStack w="100%" spacing={3}>
              <Button
                flex={1}
                size="lg"
                variant="outline"
                colorScheme={isLightTheme ? undefined : "whiteAlpha"}
                onClick={handleTryAgain}
                rounded="xl"
                bg={isLightTheme ? APP_SURFACE : undefined}
                color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                borderColor={isLightTheme ? APP_BORDER_STRONG : undefined}
                _hover={
                  isLightTheme
                    ? { bg: APP_SURFACE_MUTED, borderColor: APP_BORDER_STRONG }
                    : undefined
                }
              >
                {ui.try_again}
              </Button>
              <Button
                flex={1}
                size="lg"
                colorScheme="cyan"
                onClick={handleReturnToApp}
                fontWeight="bold"
                rounded="xl"
                isDisabled={!assessedLevel}
                color={isLightTheme ? "#083344" : undefined}
                boxShadow={isLightTheme ? "0 8px 18px rgba(66, 168, 181, 0.18)" : undefined}
              >
                {ui.proficiency_test_return_app}
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        isOpen={showRubric}
        placement="bottom"
        onClose={closeRubric}
        initialFocusRef={rubricInitialFocusRef}
      >
        <DrawerOverlay
          {...rubricSwipeDismiss.overlayProps}
          bg={isLightTheme ? "rgba(76, 60, 40, 0.18)" : "blackAlpha.700"}
          backdropFilter="blur(6px)"
        />
        <DrawerContent
          {...rubricSwipeDismiss.drawerContentProps}
          bg={isLightTheme ? APP_SURFACE_ELEVATED : "linear-gradient(180deg, #0f172a 0%, #111827 40%, #020617 100%)"}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          borderTopRadius="24px"
          h="80vh"
          borderTop={isLightTheme ? `1px solid ${APP_BORDER}` : "1px solid rgba(255,255,255,0.14)"}
          boxShadow={
            isLightTheme
              ? APP_SHADOW
              : "0 -18px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)"
          }
          sx={{
            "@supports (height: 100dvh)": {
              height: "80dvh",
            },
          }}
        >
          <BottomDrawerDragHandle isDragging={rubricSwipeDismiss.isDragging} />
          <DrawerBody ref={rubricBodyRef} py={6} overflowY="auto">
            <VStack
              align="stretch"
              spacing={4}
              width="100%"
              display="flex"
              alignItems={"center"}
              justifyContent="flex-start"
            >
              <Box
                ref={rubricInitialFocusRef}
                tabIndex={-1}
                bg={isLightTheme ? APP_SURFACE_MUTED : "linear-gradient(135deg, rgba(128, 0, 248, 0.22), rgba(173, 90, 250, 0.22))"}
                border="1px solid"
                borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.18)"}
                borderRadius="2xl"
                p={4}
                boxShadow={isLightTheme ? "none" : "inset 0 1px 0 rgba(255,255,255,0.06)"}
                maxWidth="600px"
                width="100%"
              >
                <HStack justify="space-between" align="start" mb={2}>
                  <Text fontSize="xl" fontWeight="bold" mb={2}>
                    {ui.proficiency_test_rubric}
                  </Text>
                </HStack>

                <Text
                  fontSize="sm"
                  opacity={0.75}
                  color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                >
                  {ui.proficiency_test_rubric_desc}
                </Text>
              </Box>

              <Box
                bg={isLightTheme ? APP_SURFACE : "rgba(17,24,39,0.85)"}
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.10)"}
                maxWidth="600px"
                width="100%"
              >
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  {ui.proficiency_test_what_scored}
                </Text>
                <Text
                  fontSize="sm"
                  opacity={0.8}
                  color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                >
                  {ui.proficiency_test_what_scored_desc}
                </Text>
              </Box>

              <Box
                bg={isLightTheme ? APP_SURFACE : "rgba(17,24,39,0.85)"}
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.10)"}
                maxWidth={"600px"}
                width="100%"
              >
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  {ui.proficiency_test_scoring_heading}
                </Text>
                <VStack align="start" spacing={1} fontSize="sm" opacity={0.85}>
                  <Text>
                    •{" "}
                    {ui.proficiency_test_scoring_1}
                  </Text>
                  <Text>
                    •{" "}
                    {ui.proficiency_test_scoring_2}
                  </Text>
                  <Text>
                    •{" "}
                    {ui.proficiency_test_scoring_3}
                  </Text>
                  <Text>
                    •{" "}
                    {ui.proficiency_test_scoring_4}
                  </Text>
                </VStack>
              </Box>

              <Box maxWidth="600px" width="100%">
                <VStack spacing={2} align="stretch">
                  {rubricRows.map((row) => (
                    <Box
                      key={row.level}
                      bg={isLightTheme ? APP_SURFACE : "linear-gradient(135deg, rgba(30,41,59,0.88), rgba(15,23,42,0.78))"}
                      borderRadius="xl"
                      px={3}
                      py={2.5}
                      border="1px solid"
                      borderColor={isLightTheme ? APP_BORDER : "rgba(255,255,255,0.10)"}
                      _hover={{
                        borderColor: isLightTheme ? "rgba(86, 168, 155, 0.35)" : "rgba(34,211,238,0.45)",
                      }}
                      transition="border-color 0.2s ease"
                    >
                      <HStack justify="space-between" align="center" mb={1}>
                        <Badge
                          colorScheme={row.badgeColor}
                          variant="solid"
                          px={2}
                          py={0.5}
                        >
                          {row.level}
                        </Badge>
                        <Text
                          fontSize="xs"
                          opacity={0.6}
                          color={isLightTheme ? APP_TEXT_MUTED : undefined}
                        >
                          {row.range}
                        </Text>
                      </HStack>
                      <Text
                        fontSize="sm"
                        opacity={0.8}
                        lineHeight="1.5"
                        color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                      >
                        {row[supportLang] || row.en}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </Box>

              <Button
                mt={2}
                colorScheme="teal"
                maxW="400px"
                p={4}
                color="white"
                rounded="xl"
                onClick={closeRubric}
                boxShadow={isLightTheme ? "0 8px 18px rgba(66, 168, 181, 0.18)" : undefined}
              >
                {ui.proficiency_test_got_it}
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Exit confirmation modal */}
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        isCentered
        size="sm"
        motionPreset="slideInBottom"
      >
        <ModalOverlay
          bg={isLightTheme ? "rgba(76, 60, 40, 0.18)" : "blackAlpha.700"}
          backdropFilter="blur(4px)"
        />
        <ModalContent
          bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          border="1px solid"
          borderColor={isLightTheme ? APP_BORDER : "gray.700"}
          rounded="2xl"
          mx={4}
        >
          <ModalBody py={8} px={6}>
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="bold" textAlign="center">
                {ui.proficiency_test_exit_title}
              </Text>
              <Text
                fontSize="sm"
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
                textAlign="center"
              >
                {ui.proficiency_test_exit_desc}
              </Text>
              <VStack spacing={3} w="100%" pt={2}>
                <Button
                  w="100%"
                  colorScheme="red"
                  variant="solid"
                  onClick={handleConfirmExit}
                >
                  {ui.proficiency_test_yes_exit}
                </Button>
                <Button
                  w="100%"
                  variant="ghost"
                  color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                  _hover={{
                    bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
                  }}
                  onClick={() => setShowExitConfirm(false)}
                >
                  {ui.proficiency_test_continue}
                </Button>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
