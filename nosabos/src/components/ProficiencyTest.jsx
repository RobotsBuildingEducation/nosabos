import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  Text,
  VStack,
  Badge,
  Spinner,
  Divider,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { PiMicrophoneStageDuotone } from "react-icons/pi";
import { FaStop } from "react-icons/fa";
import { LuBadgeCheck } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { database, gradingModel } from "../firebaseResources/firebaseResources";

import useUserStore from "../hooks/useUserStore";
import RobotBuddyPro from "./RobotBuddyPro";
import { translations } from "../utils/translation";
import { WaveBar } from "./WaveBar";
import { DEFAULT_TTS_VOICE, getRandomVoice, TTS_LANG_TAG } from "../utils/tts";
import useSoundSettings from "../hooks/useSoundSettings";
import submitActionSound from "../assets/submitaction.mp3";
import completeSound from "../assets/complete.mp3";

const REALTIME_MODEL =
  (import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";

const REALTIME_URL = `${
  import.meta.env.VITE_REALTIME_URL
}?model=gpt-realtime-mini/exchangeRealtimeSDP?model=${encodeURIComponent(
  REALTIME_MODEL
)}`;

const MAX_EXCHANGES = 10;

const CEFR_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];

const CEFR_LEVEL_INFO = {
  "Pre-A1": {
    name: { en: "Ultimate Beginner", es: "Principiante Total" },
    color: "#8B5CF6",
  },
  A1: { name: { en: "Beginner", es: "Principiante" }, color: "#3B82F6" },
  A2: { name: { en: "Elementary", es: "Elemental" }, color: "#8B5CF6" },
  B1: { name: { en: "Intermediate", es: "Intermedio" }, color: "#A855F7" },
  B2: {
    name: { en: "Upper Intermediate", es: "Intermedio Alto" },
    color: "#F97316",
  },
  C1: { name: { en: "Advanced", es: "Avanzado" }, color: "#EF4444" },
  C2: { name: { en: "Mastery", es: "Maestría" }, color: "#EC4899" },
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
  },
};

const ASSESSMENT_CRITERIA = [
  { key: "pronunciation", en: "Pronunciation", es: "Pronunciación" },
  { key: "grammar", en: "Grammar", es: "Gramática" },
  { key: "vocabulary", en: "Vocabulary", es: "Vocabulario" },
  { key: "fluency", en: "Fluency", es: "Fluidez" },
  { key: "confidence", en: "Confidence", es: "Confianza" },
  { key: "comprehension", en: "Comprehension", es: "Comprensión" },
];

function scoreColor(score) {
  if (score >= 8) return "green";
  if (score >= 6) return "teal";
  if (score >= 4) return "yellow";
  return "red";
}

/* ---- helpers ---- */
const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

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

  const scored = [grammar, vocabulary, fluency, comprehension, pronunciation, confidence].filter(
    (n) => typeof n === "number"
  );
  const avg = scored.length
    ? scored.reduce((a, b) => a + b, 0) / scored.length
    : null;

  const combined = (userTexts || []).join(" ").toLowerCase();
  const fallbackPattern = /(no se|no sé|no entiendo|i don't know|i dont know|idk|huh|um+|uh+|hmm+|lol|haha)/g;
  const fallbackMatches = combined.match(fallbackPattern) || [];
  const fallbackDensity = userTexts?.length
    ? fallbackMatches.length / userTexts.length
    : 0;

  const tokenCounts = (userTexts || []).map((t) =>
    t
      .trim()
      .split(/\s+/)
      .filter(Boolean).length
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
  }
  else if (avg !== null && avg < 4.4) {
    cap = "A1";
  }
  else if (avg !== null && avg < 5.6) {
    cap = "A2";
  }
  else if (avg !== null && avg < 6.8) {
    if (avgTokens < 4) cap = "A2";
    else cap = "B1";
  }
  else if (avg !== null && avg < 8) {
    if (avgTokens < 6) cap = "B1";
    else cap = "B2";
  }
  else if (avg !== null && avg < 8.8) {
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
  const sortedTurns = [...turns].sort((a, b) => (a.startTs || 0) - (b.startTs || 0));
  const finishedTurns = sortedTurns.filter((t) => typeof t.durationMs === "number" && t.durationMs > 0);
  const transcriptTurns = sortedTurns.filter((t) => typeof t.transcript === "string" && t.transcript.trim());

  const totalSpeechMs = finishedTurns.reduce((sum, turn) => sum + turn.durationMs, 0);
  const avgTurnMs = finishedTurns.length ? totalSpeechMs / finishedTurns.length : 0;
  const totalWords = transcriptTurns.reduce((sum, turn) => {
    const words = turn.transcript.trim().split(/\s+/).filter(Boolean).length;
    return sum + words;
  }, 0);

  const estimatedWpm = totalSpeechMs > 0 ? Math.round((totalWords / (totalSpeechMs / 60000)) * 10) / 10 : null;
  const confidences = transcriptTurns
    .map((t) => (typeof t.transcriptConfidence === "number" ? t.transcriptConfidence : null))
    .filter((n) => typeof n === "number");
  const avgTranscriptConfidence = confidences.length
    ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 1000) / 1000
    : null;

  const pauses = [];
  for (let i = 1; i < finishedTurns.length; i += 1) {
    const prevEnd = finishedTurns[i - 1]?.endTs;
    const start = finishedTurns[i]?.startTs;
    if (typeof prevEnd === "number" && typeof start === "number" && start >= prevEnd) pauses.push(start - prevEnd);
  }

  const avgPauseMs = pauses.length ? Math.round(pauses.reduce((a, b) => a + b, 0) / pauses.length) : null;
  const rmsValues = finishedTurns
    .map((t) => (typeof t.rmsAvg === "number" ? t.rmsAvg : null))
    .filter((n) => typeof n === "number");
  const avgRms = rmsValues.length
    ? Math.round((rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length) * 10000) / 10000
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
      durationMs: typeof turn.durationMs === "number" ? Math.round(turn.durationMs) : null,
      transcript: turn.transcript || "",
      wordCount: turn.wordCount || 0,
      transcriptConfidence:
        typeof turn.transcriptConfidence === "number"
          ? Math.round(turn.transcriptConfidence * 1000) / 1000
          : null,
      rmsAvg: typeof turn.rmsAvg === "number" ? Math.round(turn.rmsAvg * 10000) / 10000 : null,
      rmsPeak: typeof turn.rmsPeak === "number" ? Math.round(turn.rmsPeak * 10000) / 10000 : null,
    })),
  };
}

/* ---- Bubble components ---- */
function UserBubble({ label, text }) {
  if (!text) return null;
  return (
    <Box
      bg="cyan.800"
      p={3}
      rounded="2xl"
      border="1px solid rgba(255,255,255,0.06)"
      maxW="100%"
      borderBottomRightRadius="0px"
    >
      <Text fontSize="2xs" opacity={0.6} mb={1}>
        {label}
      </Text>
      <Text
        fontSize="sm"
        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {text}
      </Text>
    </Box>
  );
}

function AssistantBubble({ label, text }) {
  if (!text) return null;
  return (
    <Box
      bg="gray.700"
      p={3}
      rounded="2xl"
      border="1px solid rgba(255,255,255,0.06)"
      maxW="100%"
      borderBottomLeftRadius="0px"
    >
      <Text fontSize="2xs" opacity={0.6} mb={1}>
        {label}
      </Text>
      <Text
        fontSize="sm"
        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {text}
      </Text>
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
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const patchUser = useUserStore((s) => s.patchUser);
  const currentNpub = strongNpub(user);

  const aliveRef = useRef(false);

  // Derive settings from user
  const targetLang = user?.progress?.targetLang || "es";
  const targetLangTag = TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es;
  const targetLanguageCode = (targetLangTag || "es-MX").split("-")[0];
  const supportLang = user?.progress?.supportLang || "en";
  const voicePersona = user?.progress?.voicePersona || "";
  const pauseMs = user?.progress?.pauseMs || 800;

  const isEs = supportLang === "es";
  const ui = translations[isEs ? "es" : "en"];

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
  const speechTurnsRef = useRef([]);
  const currentSpeechTurnRef = useRef(null);
  const speechSampleTimerRef = useRef(null);

  // Idle gating
  const isIdleRef = useRef(true);

  // Guardrails
  const guardrailItemIdsRef = useRef([]);
  const pendingGuardrailTextRef = useRef("");

  // Count user exchanges (user messages count)
  const userMessageCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );

  // Result drawer
  const [showResult, setShowResult] = useState(false);
  const [assessedLevel, setAssessedLevel] = useState(null);
  const [assessmentSummary, setAssessmentSummary] = useState("");
  const [assessmentScores, setAssessmentScores] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessmentError, setAssessmentError] = useState(false);
  const assessmentDoneRef = useRef(false);

  // Progress bar
  const progressPct = Math.min(100, (userMessageCount / MAX_EXCHANGES) * 100);

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
    const langName = {
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

    const strict = {
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

    if (t === "response.created") {
      isIdleRef.current = false;
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
        if (typeof confidence === "number") turn.transcriptConfidence = confidence;
        if (turn.rmsSamples > 0) turn.rmsAvg = turn.rmsTotal / turn.rmsSamples;

        const now = Date.now();
        if (
          text === lastTranscriptRef.current.text &&
          now - lastTranscriptRef.current.ts < 2000
        ) {
          return;
        }
        lastTranscriptRef.current = { text, ts: now };
        const msgs = messagesRef.current;
        const recentAi = msgs
          .filter((m) => m.role === "assistant")
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        const userTs = recentAi?.ts ? recentAi.ts - 1 : now;
        pushMessage({
          id: uid(),
          role: "user",
          lang: targetLang,
          textFinal: text,
          textStream: "",
          done: true,
          ts: userTs,
        });
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
      setUiState("idle");
      setMood("neutral");
      return;
    }

    if (t === "input_audio_buffer.speech_started") {
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
      const now = Date.now();
      const turn = currentSpeechTurnRef.current;
      if (turn) {
        turn.endTs = now;
        turn.durationMs = Math.max(0, now - (turn.startTs || now));
        if (turn.rmsSamples > 0) turn.rmsAvg = turn.rmsTotal / turn.rmsSamples;
      }
      currentSpeechTurnRef.current = null;
      stopSpeechSampling();
      setUiState("thinking");
      setMood("thinking");
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
      (a, b) => (a.ts || 0) - (b.ts || 0)
    );
    const transcript = sorted
      .map((m) => {
        const role = m.role === "user" ? "User" : "AI";
        const text = m.textFinal || m.textStream || "";
        return `${role}: ${text}`;
      })
      .filter((line) => line.includes(": ") && line.split(": ")[1].trim())
      .join("\n");
    const speechEvidence = summarizeSpeechEvidence(speechTurnsRef.current || []);

    const langName = {
      es: "Spanish", pt: "Portuguese", fr: "French", it: "Italian",
      nl: "Dutch", ja: "Japanese", ru: "Russian", de: "German",
      el: "Greek", pl: "Polish", ga: "Irish", nah: "Nahuatl",
      yua: "Yucatec Maya", en: "English",
    }[targetLang] || "the target language";

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
- If hasAudioEvidence is false, set pronunciation note exactly to "Insufficient audio evidence." and keep pronunciation score conservative (1-2).

LEVEL PLACEMENT GUIDE:
- Pre-A1: Cannot communicate in ${langName}. Wrong language, gibberish, or only isolated words.
- A1: Can say basic greetings and simple phrases. Very limited grammar.
- A2: Can form simple sentences about familiar topics. Basic grammar control.
- B1: Can discuss past/future, give opinions, use connectors. Consistent grammar.
- B2: Can argue, discuss abstract topics, self-correct. Varied grammar and vocabulary.
- C1/C2: Near-native precision, idioms, register control, complex argumentation.

Return ONLY valid JSON:
{"level":"Pre-A1","summary":"2-3 sentence assessment.","scores":{"pronunciation":{"score":1,"note":"reason"},"grammar":{"score":1,"note":"reason"},"vocabulary":{"score":1,"note":"reason"},"fluency":{"score":1,"note":"reason"},"confidence":{"score":1,"note":"reason"},"comprehension":{"score":1,"note":"reason"}}}`;

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
          modelLevel
        );
        setAssessedLevel(
          CEFR_LEVELS.includes(strictLevel) ? strictLevel : "Pre-A1"
        );
        setAssessmentSummary(parsed.summary || "");
        if (parsed.scores && typeof parsed.scores === "object") {
          if (!speechEvidence?.hasAudioEvidence && parsed?.scores?.pronunciation) {
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
          /\b(A0|Pre-A1|A1|A2|B1|B2|C1|C2)\b/
        );
        const fallbackLevel = getStrictPlacementFromEvidence(
          userTexts,
          parsed?.scores,
          normalizeCefrLevel(levelMatch?.[1] || "A1")
        );
        setAssessedLevel(
          CEFR_LEVELS.includes(fallbackLevel) ? fallbackLevel : "Pre-A1"
        );
        setAssessmentSummary(
          parsed?.summary ||
            (isEs
              ? "Evaluación completada. Revisa tus resultados abajo."
              : "Assessment complete. Review your results below.")
        );
      }
    } catch (e) {
      console.error("Assessment failed:", e);
      setAssessmentError(true);
      setAssessedLevel("Pre-A1");
      setAssessmentSummary(
        isEs
          ? "Error en la evaluación. Te colocamos en Pre-A1/A0 por seguridad."
          : "Assessment error. Conservatively placing you at Pre-A1/A0."
      );
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
        { merge: true }
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
              turn_detection: {
                type: "server_vad",
                silence_duration_ms: pauseMs,
                threshold: 0.35,
                prefix_padding_ms: 120,
              },
              input_audio_transcription: {
                model: "whisper-1",
                language: targetLanguageCode,
                prompt:
                  "Transcribe exactly what the speaker says in the original spoken language. Do not translate.",
              },
              output_audio_format: "pcm16",
            },
          })
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
          })
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
      setUiState("idle");
    } catch (e) {
      setStatus("disconnected");
      setUiState("idle");
      setErr(e?.message || String(e));
    }
  }

  function stop() {
    aliveRef.current = false;
    try {
      if (dcRef.current?.readyState === "open") {
        try {
          dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
        } catch {}
        dcRef.current.send(
          JSON.stringify({ type: "input_audio_buffer.clear" })
        );
        dcRef.current.send(
          JSON.stringify({
            type: "session.update",
            session: { turn_detection: null },
          })
        );
      }
    } catch {}
    try {
      const a = audioRef.current;
      if (a) {
        try { a.pause(); } catch {}
        const s = a.srcObject;
        if (s) {
          try { s.getTracks().forEach((t) => t.stop()); } catch {}
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
      if (streamFlushTimerRef.current) clearTimeout(streamFlushTimerRef.current);
      stopSpeechSampling();
      try { audioCtxRef.current?.close(); } catch {}
      try { localRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      try { pcRef.current?.close(); } catch {}
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

  /* ---- Render ---- */
  const levelInfo = assessedLevel ? CEFR_LEVEL_INFO[assessedLevel] : null;

  return (
    <>
      <Box
        minH="100vh"
        bg="gray.900"
        color="gray.100"
        position="relative"
        pb="140px"
      >
        {/* Header */}
        <Box px={4} py={4} position="relative">
          <Text fontSize="lg" fontWeight="bold" color="gray.100" textAlign="center">
            {isEs ? "Prueba de Nivel" : "Proficiency Test"}
          </Text>
          <IconButton
            icon={<CloseIcon />}
            aria-label="Close"
            variant="ghost"
            color="gray.400"
            _hover={{ color: "gray.200", bg: "whiteAlpha.100" }}
            size="sm"
            position="absolute"
            top={4}
            right={4}
            onClick={() => navigate("/")}
          />
        </Box>

        {/* Progress + Robot */}
        <Box px={4} mt={3} display="flex" justifyContent="center">
          <Box
            bg="gray.800"
            p={3}
            rounded="2xl"
            border="1px solid rgba(255,255,255,0.06)"
            width="100%"
            maxWidth="400px"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top={3}
              left={3}
              width="72px"
              opacity={0.95}
            >
              <RobotBuddyPro
                state={uiState}
                loudness={0}
                mood={mood}
                variant="abstract"
                maxW={72}
              />
            </Box>

            <VStack
              align="flex-start"
              spacing={2}
              width="100%"
              pl={{ base: "78px", sm: "82px" }}
              pt={{ base: 1, sm: 0 }}
            >
              <Box w="100%">
                <HStack justify="space-between" align="center" mb={1}>
                  <HStack spacing={2} align="center" flex="1">
                    <Badge
                      colorScheme="purple"
                      variant="subtle"
                      fontSize="10px"
                    >
                      {isEs ? "Evaluación" : "Assessment"}
                    </Badge>
                    <Text fontSize="xs" opacity={0.9} color="white" flex="1">
                      {isEs
                        ? "Habla naturalmente — estamos evaluando tu nivel"
                        : "Speak naturally — we're assessing your level"}
                    </Text>
                  </HStack>
                </HStack>

                <Box mt={3}>
                  <HStack justifyContent="space-between" mb={1}>
                    <Badge
                      colorScheme="cyan"
                      variant="subtle"
                      fontSize="10px"
                    >
                      {isEs ? "Progreso" : "Progress"}
                    </Badge>
                    <Badge
                      colorScheme="teal"
                      variant="subtle"
                      fontSize="10px"
                    >
                      {Math.min(userMessageCount, MAX_EXCHANGES)}/{MAX_EXCHANGES}
                    </Badge>
                  </HStack>
                  <WaveBar value={progressPct} />
                </Box>
              </Box>
            </VStack>
          </Box>
        </Box>

        {/* Timeline — newest first */}
        <VStack align="stretch" spacing={3} px={4} mt={3}>
          {isEvaluating && (
            <Box
              bg="gray.800"
              border="1px solid"
              borderColor="gray.700"
              rounded="2xl"
              p={4}
            >
              <HStack spacing={3} align="center">
                <RobotBuddyPro state="thinking" mood="thinking" maxW={60} />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="semibold">
                    {isEs ? "Evaluando" : "Evaluating"}
                  </Text>
                  <Text fontSize="sm" opacity={0.75}>
                    {isEs
                      ? "Analizando tu conversación para determinar tu nivel..."
                      : "Analyzing your conversation to determine your level..."}
                  </Text>
                </VStack>
                <Spinner ml="auto" size="sm" color="cyan.300" />
              </HStack>
            </Box>
          )}
          {timeline.map((m) => {
            const isUser = m.role === "user";
            if (isUser) {
              return (
                <RowRight key={m.id}>
                  <UserBubble
                    label={isEs ? "Tú" : "You"}
                    text={m.textFinal}
                  />
                </RowRight>
              );
            }

            const text = (m.textFinal || "") + (m.textStream || "");
            if (!text.trim()) return null;
            return (
              <RowLeft key={m.id}>
                <AssistantBubble
                  label={isEs ? "Evaluador" : "Assessor"}
                  text={text}
                />
              </RowLeft>
            );
          })}
        </VStack>

        {/* Bottom dock */}
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
              colorScheme={status === "connected" ? "red" : "cyan"}
              color="white"
              textShadow="0px 0px 20px black"
              mb={20}
              isDisabled={userMessageCount >= MAX_EXCHANGES}
            >
              {status === "connected" ? (
                <>
                  <FaStop /> &nbsp;{" "}
                  {isEs ? "Detener" : "Stop"}
                </>
              ) : (
                <>
                  <PiMicrophoneStageDuotone /> &nbsp;{" "}
                  {status === "connecting"
                    ? isEs
                      ? "Conectando..."
                      : "Connecting..."
                    : isEs
                    ? "Comenzar"
                    : "Start"}
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

        {/* Remote live audio sink */}
        <audio ref={audioRef} />
      </Box>

      {/* ---- Result Drawer ---- */}
      <Drawer
        isOpen={showResult}
        placement="bottom"
        onClose={() => {}}
        closeOnOverlayClick={false}
        closeOnEsc={false}
      >
        <DrawerOverlay bg="blackAlpha.700" backdropFilter="blur(6px)" />
        <DrawerContent
          bg="gray.900"
          color="gray.100"
          borderTopRadius="24px"
          maxH="92vh"
          display="flex"
          flexDirection="column"
          sx={{
            "@supports (height: 100dvh)": {
              maxHeight: "92dvh",
            },
          }}
        >
          <DrawerBody px={{ base: 4, md: 6 }} py={0} overflowY="auto">
            <VStack spacing={5} align="stretch">
              {/* Gradient header with level badge */}
              <Box
                bgGradient={
                  levelInfo
                    ? `linear(to-r, ${levelInfo.color}, purple.500)`
                    : "linear(to-r, cyan.500, purple.500)"
                }
                px={6}
                py={6}
                mx={-4}
                mt={0}
                borderTopRadius="24px"
              >
                <VStack spacing={3} align="center">
                  <Box bg="whiteAlpha.200" p={3} rounded="full">
                    <Box as={LuBadgeCheck} fontSize="36px" color="white" />
                  </Box>
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color="white"
                    textAlign="center"
                  >
                    {isEs ? "Evaluación Completa" : "Assessment Complete"}
                  </Text>
                  {assessedLevel && (
                    <Badge
                      colorScheme="whiteAlpha"
                      bg="whiteAlpha.300"
                      color="white"
                      fontSize="lg"
                      px={5}
                      py={1.5}
                      rounded="full"
                      fontWeight="bold"
                    >
                      {assessedLevel} —{" "}
                      {levelInfo?.name?.[isEs ? "es" : "en"] || assessedLevel}
                    </Badge>
                  )}
                </VStack>
              </Box>
              {/* Summary */}
              {assessmentSummary && (
                <Text
                  fontSize="md"
                  opacity={0.9}
                  textAlign="center"
                  lineHeight="1.7"
                >
                  {assessmentSummary}
                </Text>
              )}

              {/* Individual criterion scores — compact grid */}
              {assessmentScores && (
                <>
                  <Divider borderColor="gray.700" />
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" mb={3} opacity={0.7} letterSpacing="0.05em" textTransform="uppercase">
                      {isEs ? "Desglose" : "Breakdown"}
                    </Text>
                    <Grid templateColumns="repeat(2, 1fr)" gap={2}>
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

                        return (
                          <GridItem key={criterion.key}>
                            <Box
                              bg="gray.800"
                              px={3}
                              py={2.5}
                              rounded="lg"
                              borderLeft="3px solid"
                              borderColor={accent}
                              h="100%"
                            >
                              <HStack justify="space-between" align="center" mb={1}>
                                <Text fontSize="xs" fontWeight="semibold" opacity={0.85}>
                                  {criterion[isEs ? "es" : "en"]}
                                </Text>
                                {score !== null && (
                                  <Text fontSize="lg" fontWeight="bold" color={accent} lineHeight="1">
                                    {score}
                                  </Text>
                                )}
                              </HStack>
                              {note && (
                                <Text fontSize="2xs" opacity={0.55} lineHeight="1.4" noOfLines={3}>
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
                  bg="gray.800"
                  px={4}
                  py={3}
                  rounded="lg"
                  justify="space-between"
                  align="center"
                >
                  <Text fontSize="xs" opacity={0.6}>
                    {isEs ? "Puntaje compuesto" : "Composite score"}
                  </Text>
                  <Text fontSize="md" fontWeight="bold" color="cyan.300">
                    {scoreInsight.finalScore}/10
                  </Text>
                </HStack>
              )}

              <Divider borderColor="gray.700" />

              {assessedLevel && (
                <Box bg="gray.800" px={4} py={3} rounded="lg">
                  <Text fontSize="xs" fontWeight="semibold" opacity={0.5} mb={2} textTransform="uppercase" letterSpacing="0.05em">
                    {isEs ? `Nivel ${assessedLevel}` : `Level ${assessedLevel}`}
                  </Text>
                  <VStack align="start" spacing={1}>
                    {(CEFR_LEVEL_OFFERINGS[assessedLevel]?.[isEs ? "es" : "en"] || []).map(
                      (item) => (
                        <Text key={item} fontSize="xs" opacity={0.7}>
                          {item}
                        </Text>
                      )
                    )}
                  </VStack>
                  {assessedLevel !== "Pre-A1" && (
                    <HStack mt={3} spacing={1.5} flexWrap="wrap">
                      {CEFR_LEVELS.slice(
                        0,
                        CEFR_LEVELS.indexOf(assessedLevel) + 1
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
                <Text fontSize="sm" color="yellow.300" textAlign="center">
                  {isEs
                    ? "Hubo un problema al evaluar automáticamente. Puedes intentar de nuevo."
                    : "There was a problem with automatic evaluation. You can try again."}
                </Text>
              )}
            </VStack>
          </DrawerBody>
          <DrawerFooter
            borderTop="1px solid"
            borderColor="gray.700"
            bg="gray.900"
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
                colorScheme="whiteAlpha"
                onClick={handleTryAgain}
                rounded="xl"
              >
                {isEs ? "Intentar de nuevo" : "Try again"}
              </Button>
              <Button
                flex={1}
                size="lg"
                colorScheme="cyan"
                onClick={handleReturnToApp}
                fontWeight="bold"
                rounded="xl"
                isDisabled={!assessedLevel}
              >
                {isEs ? "Volver a la aplicación" : "Return to app"}
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
