// components/Stories.jsx
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Center,
  useToast,
  Badge,
  Progress,
  IconButton,
  Spacer,
  Divider,
  Spinner,
  Input,
  Tag,
  TagLabel,
  Flex,
  SlideFade,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaStop, FaPen } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { PiMicrophoneStageDuotone, PiSpeakerHighDuotone } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import {
  doc,
  setDoc,
  increment,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { t, translations } from "../utils/translation";
import { WaveBar } from "./WaveBar";
import { awardXp } from "../utils/utils";
import { getLanguageXp } from "../utils/progressTracking";
import { getRandomVoice, TTS_LANG_TAG, TTS_ENDPOINT } from "../utils/tts";
import { simplemodel } from "../firebaseResources/firebaseResources"; // ✅ Gemini client
import { extractCEFRLevel, getCEFRPromptHint } from "../utils/cefrUtils";
import { speechReasonTips } from "../utils/speechEvaluation";
import { SpeakSuccessCard } from "./SpeakSuccessCard";
import { useSpeechPractice } from "../hooks/useSpeechPractice";

/* ================================
   ENV / API
=================================== */
const RESPONSES_URL = import.meta.env.VITE_RESPONSES_URL;

/* ================================
   Helpers / Language utils
=================================== */
const isoNow = () => {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
};

const strongNpub = (user) =>
  (
    user?.id ||
    user?.local_npub ||
    localStorage.getItem("local_npub") ||
    ""
  ).trim();

const LLM_LANG_NAME = (code) =>
  ({
    en: "English",
    es: "Spanish",
    pt: "Brazilian Portuguese",
    fr: "French",
    it: "Italian",
    nah: "Nahuatl",
  }[code] || code);

const BCP47 = {
  es: { stt: "es-ES", tts: "es-ES" },
  en: { stt: "en-US", tts: "en-US" },
  pt: { stt: "pt-BR", tts: "pt-BR" },
  fr: { stt: "fr-FR", tts: "fr-FR" },
  it: { stt: "it-IT", tts: "it-IT" },
  nah: { stt: "es-ES", tts: "es-ES" }, // fallback if Nahuatl is unsupported by engines
};

const toLangKey = (value) => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return null;
  if (["en", "english"].includes(raw)) return "en";
  if (["es", "spanish", "español"].includes(raw)) return "es";
  if (["pt", "portuguese", "português", "portugues"].includes(raw)) return "pt";
  if (["fr", "french", "francés", "francais", "français"].includes(raw))
    return "fr";
  if (["it", "italian", "italiano"].includes(raw)) return "it";
  if (["nah", "nahuatl", "náhuatl"].includes(raw)) return "nah";
  return null;
};

const DISPLAY_LANG_NAME = (code, uiLang) => {
  const dict = translations[uiLang] || translations.en || {};
  const fallback = translations.en || {};
  const langKey = toLangKey(code);
  if (langKey) {
    const key = `language_${langKey}`;
    return dict[key] || fallback[key] || langKey;
  }
  const raw = String(code ?? "").trim();
  return raw || LLM_LANG_NAME(code);
};

const getAppUILang = () => {
  const user = useUserStore.getState().user;
  return (user?.appLanguage || localStorage.getItem("appLanguage")) === "es"
    ? "es"
    : "en";
};

// Extract text from a Gemini streaming chunk (tolerant to shapes)
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

/* ================================
   Shared Progress (global XP + settings)
=================================== */
function useSharedProgress() {
  const user = useUserStore((s) => s.user);
  const npub = strongNpub(user);
  const [xp, setXp] = useState(0);
  const [progress, setProgress] = useState({
    level: "beginner",
    targetLang: "es",
    supportLang: "en", // 'en' | 'es' | 'bilingual'
    voice: "alloy",
  });

  useEffect(() => {
    if (!npub) return;
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
        voice: p.voice || "alloy",
      });
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub };
}

/* ================================
   Global XP helpers + logging
=================================== */
// async function awardXp(npub, amount) {
//   if (!npub || !amount) return;
//   const ref = doc(database, "users", npub);
//   await setDoc(
//     ref,
//     { xp: increment(Math.round(amount)), updatedAt: isoNow() },
//     { merge: true }
//   );
// }

async function saveStoryTurn(npub, payload) {
  if (!npub) return;
  const col = collection(database, "users", npub, "storyTurns");
  await addDoc(col, {
    ...payload,
    createdAt: serverTimestamp(),
    createdAtClient: Date.now(),
    origin: "story",
  });
}

/* ================================
   UI text (driven by APP UI language only)
=================================== */
function useUIText(uiLang, level) {
  return useMemo(() => {
    return {
      header: uiLang === "es" ? "Juego de roles" : "Role Play",
      rolePrompt:
        uiLang === "es"
          ? "¿Con qué personaje quieres jugar a los roles?"
          : "Who do you want to role play as?",
      rolePlaceholder:
        uiLang === "es"
          ? "Por ejemplo: una doctora ayudando a pacientes"
          : "e.g. a teacher helping new students",
      startRole: uiLang === "es" ? "Comenzar" : "Start role play",
      updateRole: uiLang === "es" ? "Actualizar rol" : "Update",
      editRole: uiLang === "es" ? "Editar" : "Edit",
      cancelEdit: uiLang === "es" ? "Cancelar" : "Cancel",
      playing: uiLang === "es" ? "Reproduciendo..." : "Playing...",
      playTarget: (name) =>
        uiLang === "es" ? `Reproducir ${name}` : `Play ${name}`,
      listen: uiLang === "es" ? "Escuchar" : "Listen",
      stop: uiLang === "es" ? "Detener" : "Stop",
      startPractice:
        uiLang === "es"
          ? "Empezar práctica por oración"
          : "Start Sentence Practice",
      practiceThis:
        uiLang === "es" ? "Practica esta oración:" : "Practice this sentence:",
      skip: uiLang === "es" ? "Saltar oración" : "Skip Sentence",
      finish: uiLang === "es" ? "Terminar juego" : "Finish Role Play",
      record: uiLang === "es" ? "Grabar oración" : "Record Sentence",
      stopRecording: uiLang === "es" ? "Detener grabación" : "Stop Recording",
      progress: uiLang === "es" ? "Progreso" : "Progress",
      noStory:
        uiLang === "es"
          ? "Define un rol para comenzar a jugar."
          : "Set a role to kick off your role play.",
      generatingTitle:
        uiLang === "es"
          ? "Generando tu juego de roles"
          : "Preparing your role play…",
      generatingSub:
        uiLang === "es"
          ? "Preparando una escena basada en tu rol."
          : "Shaping a role play scene around your role.",
      almost:
        uiLang === "es" ? "Casi — inténtalo otra vez" : "Almost — try again",
      wellDone: uiLang === "es" ? "¡Bien hecho!" : "Well done!",
      score: uiLang === "es" ? "Puntuación" : "Score",
      xp: t(uiLang, "ra_label_xp") || "XP",
      levelLabel: uiLang === "es" ? "Nivel" : "Level",
      levelValue:
        uiLang === "es"
          ? {
              beginner: t("es", "onboarding_level_beginner"),
              intermediate: t("es", "onboarding_level_intermediate"),
              advanced: t("es", "onboarding_level_advanced"),
            }[level] || level
          : {
              beginner: t("en", "onboarding_level_beginner"),
              intermediate: t("en", "onboarding_level_intermediate"),
              advanced: t("en", "onboarding_level_advanced"),
            }[level] || level,
      tts_synthesizing:
        t(uiLang, "tts_synthesizing") ||
        (uiLang === "es" ? "Sintetizando…" : "Synthesizing…"),
    };
  }, [uiLang, level]);
}

/* ================================
   Normalization / Scoring (multi-lang)
=================================== */

/* ================================
   Main Component
=================================== */
export default function StoryMode({
  userLanguage = "en",
  lesson = null,
  lessonContent = null,
  onSkip = null,
  pauseMs = 2000,
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useUserStore((s) => s.user);

  // Extract CEFR level from lesson ID
  const cefrLevel = lesson?.id ? extractCEFRLevel(lesson.id) : "A1";

  // Shared settings + XP
  const { xp, levelNumber, progressPct, progress, npub } = useSharedProgress();

  // APP UI language (drives all UI copy)
  const uiLang = getAppUILang();
  const uiText = useUIText(uiLang, progress.level);

  // Content languages
  const targetLang = progress.targetLang; // 'es' | 'en' | 'nah'
  const supportLang =
    progress.supportLang === "bilingual"
      ? uiLang === "es"
        ? "es"
        : "en"
      : progress.supportLang;

  const targetDisplayName = DISPLAY_LANG_NAME(targetLang, uiLang);
  const supportDisplayName = DISPLAY_LANG_NAME(supportLang, uiLang);

  // State
  const [storyData, setStoryData] = useState(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [isPlayingSupport, setIsPlayingSupport] = useState(false);
  const [isSynthesizingTarget, setIsSynthesizingTarget] = useState(false);
  const [isSynthesizingSupport, setIsSynthesizingSupport] = useState(false);
  const [sentenceCompleted, setSentenceCompleted] = useState(false); // Track when sentence is completed but not advanced
  const [lastSuccessInfo, setLastSuccessInfo] = useState(null);

  // accumulate this session, but award only at end
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState({ passed: 0, total: 0 });
  const [passedCount, setPassedCount] = useState(0);

  const [showFullStory, setShowFullStory] = useState(true);

  // Highlighting (target full story)
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [tokenizedText, setTokenizedText] = useState(null);
  const [boundarySupported, setBoundarySupported] = useState(null);

  // Refs
  const audioRef = useRef(null);
  const storyCacheRef = useRef(null);
  const highlightIntervalRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentAudioRef = useRef(null);
  const eventSourceRef = useRef(null);
  const currentAudioUrlRef = useRef(null);
  const sessionAwardedRef = useRef(false);
  const usageStatsRef = useRef({
    ttsCalls: 0,
    storyGenerations: 0,
    lastResetDate: new Date().toDateString(),
  });

  /* ------------------------- Tokenization for highlighting ------------------------- */
  const WORD_TOKEN_REGEX = /(\p{L}[\p{L}\p{M}'-]*|\s+|[^\s\p{L}\p{M}]+)/gu;

  const createTokenMap = useCallback((text) => {
    const tokens = [];
    const charToWord = new Map();
    let charIndex = 0;
    let wordIndex = 0;

    for (const match of text.matchAll(WORD_TOKEN_REGEX)) {
      const token = match[0];
      const isWord = /\p{L}/u.test(token);
      const start = charIndex;
      const end = start + token.length;

      tokens.push({ text: token, isWord, startChar: start, endChar: end });

      if (isWord) {
        for (let i = 0; i < token.length; i++)
          charToWord.set(start + i, wordIndex);
        wordIndex++;
      }
      charIndex = end;
    }

    return {
      tokens,
      wordIndexByChar: (ci) => charToWord.get(ci) ?? -1,
      totalWords: wordIndex,
    };
  }, []);

  // pseudo alignment based on duration
  function buildWordTimeline(tokens, totalDurationSec) {
    const wordTokens = tokens.filter((t) => t.isWord);
    if (
      !wordTokens.length ||
      !Number.isFinite(totalDurationSec) ||
      totalDurationSec <= 0
    )
      return [];
    const weights = wordTokens.map(
      (t) => 0.22 + Math.max(1, Array.from(t.text).length) * 0.055
    );
    const sum = weights.reduce((a, b) => a + b, 0);
    const scale = (totalDurationSec * 0.98) / sum;
    const boundaries = [];
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i] * scale;
      boundaries.push(acc);
    }
    return boundaries;
  }

  function startAudioAlignedHighlight(audio, tokens, setIdx) {
    const wordTokens = tokens.filter((t) => t.isWord);
    if (!wordTokens.length) return () => {};
    const timeline = buildWordTimeline(tokens, audio.duration || 0);
    if (!timeline.length) return () => {};
    let rafId = null,
      lastIndex = -1;

    const tick = () => {
      const t = audio.currentTime;
      let i = 0;
      while (i < timeline.length && t > timeline[i]) i++;
      const idx = Math.min(i, timeline.length - 1);
      if (idx !== lastIndex) {
        lastIndex = idx;
        setIdx(idx);
      }
      if (!audio.paused && !audio.ended) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    const stop = () => rafId && cancelAnimationFrame(rafId);
    audio.addEventListener("pause", stop, { once: true });
    audio.addEventListener("ended", stop, { once: true });
    audio.addEventListener("error", stop, { once: true });
    return stop;
  }

  /* --------------------------- Story data shaping --------------------------- */
  const FALLBACK_STORIES = {
    es: {
      sentences: [
        "Había una vez un pequeño pueblo en México llamado San Miguel.",
        "La plaza tenía una fuente antigua que siempre tenía agua fresca.",
        "Cada tarde, los niños jugaban mientras los adultos conversaban.",
        "Un día, una feria llegó al pueblo y todos ayudaron a prepararla.",
      ],
      translations: {
        en: [
          "Once upon a time there was a small town in Mexico called San Miguel.",
          "The plaza had an old fountain that always had fresh water.",
          "Every afternoon, children played while the adults chatted.",
          "One day, a fair came to town and everyone helped set it up.",
        ],
        es: [],
      },
    },
    en: {
      sentences: [
        "Once upon a time there was a small town in Mexico called San Miguel.",
        "The plaza had an old fountain that always had fresh water.",
        "Every afternoon, children played while the adults chatted.",
        "One day, a fair came to town and everyone helped set it up.",
      ],
      translations: {
        es: [
          "Había una vez un pequeño pueblo en México llamado San Miguel.",
          "La plaza tenía una fuente antigua que siempre tenía agua fresca.",
          "Cada tarde, los niños jugaban mientras los adultos conversaban.",
          "Un día, una feria llegó al pueblo y todos ayudaron a prepararla.",
        ],
        en: [],
      },
    },
    pt: {
      sentences: [
        "Era manhã quando Ana abriu sua pequena padaria na praça.",
        "Ela preparou pão fresco e cumprimentou os primeiros clientes.",
        "Um músico de rua começou a tocar violão perto da fonte.",
        "As pessoas sorriram e tomaram café ouvindo a melodia suave.",
      ],
      translations: {
        en: [
          "It was morning when Ana opened her small bakery in the square.",
          "She prepared fresh bread and greeted the first customers.",
          "A street musician started playing guitar near the fountain.",
          "People smiled and drank coffee while hearing the soft melody.",
        ],
        es: [
          "Era de mañana cuando Ana abrió su pequeña panadería en la plaza.",
          "Preparó pan fresco y saludó a los primeros clientes.",
          "Un músico callejero empezó a tocar la guitarra cerca de la fuente.",
          "La gente sonrió y tomó café mientras escuchaba la melodía suave.",
        ],
      },
    },
    fr: {
      sentences: [
        "Au matin, Léa ouvre sa petite librairie près du marché.",
        "Elle recommande un roman facile aux nouveaux apprenants de français.",
        "Un couple demande un café et discute de leurs voyages.",
        "Léa sourit en entendant leurs histoires et propose un guide local.",
      ],
      translations: {
        en: [
          "In the morning, Léa opens her small bookstore near the market.",
          "She recommends an easy novel to new French learners.",
          "A couple asks for a coffee and talks about their travels.",
          "Léa smiles hearing their stories and offers a local guide.",
        ],
        es: [
          "Por la mañana, Léa abre su pequeña librería cerca del mercado.",
          "Recomienda una novela fácil a los nuevos estudiantes de francés.",
          "Una pareja pide un café y habla de sus viajes.",
          "Léa sonríe al escuchar sus historias y ofrece una guía local.",
        ],
      },
    },
    it: {
      sentences: [
        "È mattina e Lucia apre il bar del paese.",
        "Prepara il caffè e saluta i primi clienti.",
        "Un turista chiede indicazioni per il museo.",
        "Lucia disegna una mappa sul tovagliolo e sorride.",
      ],
      translations: {
        en: [
          "It is morning and Lucia opens the town café.",
          "She makes coffee and greets the first customers.",
          "A tourist asks for directions to the museum.",
          "Lucia draws a map on a napkin and smiles.",
        ],
        es: [
          "Es de mañana y Lucía abre el café del pueblo.",
          "Prepara el café y saluda a los primeros clientes.",
          "Un turista pregunta cómo llegar al museo.",
          "Lucía dibuja un mapa en una servilleta y sonríe.",
        ],
      },
    },
    nah: {
      sentences: [
        "Tlajko, se ipantzi se tiankistli kan altepetl.",
        "Tlahtokeh ica tlacatl sekinamaka tlanelto.",
        "Se konetl chikauak mokaka pakilistli ika nochtli.",
        "In altepetl moneki tlapaleuili itech se ilhuitl.",
      ],
      translations: {
        en: [
          "In the morning, a market opens in the town.",
          "People greet each other and share goods.",
          "A child happily tastes fresh cactus fruit.",
          "The town prepares decorations for a festival.",
        ],
        es: [
          "Por la mañana, se abre un mercado en el pueblo.",
          "La gente se saluda y comparte productos.",
          "Un niño prueba feliz la fruta del nopal.",
          "El pueblo prepara decoraciones para una fiesta.",
        ],
      },
    },
  };

  const buildFallbackStory = (tLang, sLang) => {
    const entry = FALLBACK_STORIES[tLang] || FALLBACK_STORIES.es;
    const supKey = sLang === "es" ? "es" : "en";
    const sentences = (entry.sentences || []).map((tgt, idx) => ({
      tgt,
      sup:
        entry.translations?.[supKey]?.[idx] ||
        entry.translations?.en?.[idx] ||
        entry.translations?.es?.[idx] ||
        "",
    }));

    return {
      fullStory: {
        tgt: sentences.map((s) => s.tgt).join(" "),
        sup: sentences.map((s) => s.sup).filter(Boolean).join(" "),
      },
      sentences,
    };
  };

  // Normalize incoming story to { fullStory: { tgt, sup }, sentences: [{tgt,sup}, ...] }
  function normalizeStory(raw, tgtCode, supCode) {
    if (!raw) return null;

    const pickTarget = (obj, code) => {
      const value = obj?.[code];
      return typeof value === "string" && value.trim() ? value : "";
    };

    const pickSupport = (obj, code, fallback) => {
      if (!obj) return "";
      const primary = obj?.[code];
      if (typeof primary === "string" && primary.trim()) return primary;
      if (fallback && typeof obj?.[fallback] === "string") return obj[fallback];
      const firstValue = Object.values(obj || {}).find(
        (v) => typeof v === "string" && v.trim()
      );
      return firstValue || "";
    };

    const fullTgt = pickTarget(raw.fullStory || {}, tgtCode);
    const fullSup = pickSupport(raw.fullStory || {}, supCode, tgtCode);
    const sentences = (raw.sentences || [])
      .map((s) => ({
        tgt: pickTarget(s, tgtCode),
        sup: pickSupport(s, supCode, tgtCode),
      }))
      .filter((s) => s.tgt);

    if (!fullTgt || !sentences.length) return null;

    return {
      fullStory: { tgt: fullTgt, sup: fullSup || "" },
      sentences,
    };
  }

  const validateAndFixStorySentences = (
    data,
    tgtKey = "tgt",
    supKey = "sup"
  ) => {
    if (!data || !data.fullStory || !data.sentences) return data;
    const full = data.fullStory[tgtKey];
    const parts = full
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0)
      .map((s) => (/[.!?]$/.test(s.trim()) ? s.trim() : s.trim() + "."));
    const reconstructed = parts.join(" ");
    if (
      reconstructed === full.trim() &&
      parts.length === data.sentences.length
    ) {
      const validated = parts.map((tgt, i) => ({
        tgt,
        sup: data.sentences[i]?.[supKey] || data.sentences[i]?.sup || "",
      }));
      return { ...data, sentences: validated };
    }
    return data;
  };

  const stopAllAudio = useCallback(() => {
    try {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    } catch {}
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    currentUtteranceRef.current = null;
    if (highlightIntervalRef.current) {
      clearTimeout(highlightIntervalRef.current);
      highlightIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlayingTarget(false);
    setIsPlayingSupport(false);
    setIsSynthesizingTarget(false);
    setIsSynthesizingSupport(false);
    setIsAutoPlaying(false);
    setHighlightedWordIndex(-1);
  }, []);

  /* ----------------------------- Story generation (backend, fallback) ----------------------------- */
  const generateStory = useCallback(async () => {
    setIsLoading(true);
    stopAllAudio();
    try {
      usageStatsRef.current.storyGenerations++;
      const storyUrl = "https://generatestory-hftgya63qa-uc.a.run.app";

      // Determine lesson context for the story
      const lessonTopic =
        lessonContent?.topic ||
        lessonContent?.scenario ||
        "general conversation";

      const response = await fetch(storyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          text: { format: { type: "text" } },
          input: {
            uiLanguage: uiLang, // UI language is app UI only
            cefrLevel, // CEFR-based difficulty level
            targetLang, // content target language
            supportLang, // effective support language (bilingual mirrors UI)
            lessonTopic, // Use lesson context instead of role
          },
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const normalized = normalizeStory(
        data.story || data,
        targetLang,
        supportLang
      );
      if (!normalized) throw new Error("Story payload missing expected fields");
      const validated = validateAndFixStorySentences(normalized, "tgt", "sup");
      setStoryData(validated);
      storyCacheRef.current = validated;
      setCurrentSentenceIndex(0);
      setSessionXp(0);
      setSessionComplete(false);
      setSessionSummary({
        passed: 0,
        total: validated?.sentences?.length || 0,
      });
      setPassedCount(0);
      sessionAwardedRef.current = false;
      setShowFullStory(true);
      setHighlightedWordIndex(-1);
      setLastSuccessInfo(null);
    } catch (error) {
      // Fallback story that mirrors the selected practice/support languages
      const fallback = buildFallbackStory(targetLang, supportLang);
      const validated = validateAndFixStorySentences(fallback, "tgt", "sup");
      setStoryData(validated);
      storyCacheRef.current = validated;
      toast({
        title:
          uiLang === "es"
            ? "Usando juego de roles de demo"
            : "Using Demo Role Play",
        description:
          uiLang === "es"
            ? "API no disponible. Usando juego de roles de demo para pruebas."
            : "API unavailable. Using demo role play for testing.",
        status: "info",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    lessonContent,
    cefrLevel,
    targetLang,
    supportLang,
    uiLang,
    stopAllAudio,
    toast,
  ]);

  /* ----------------------------- Story generation (Gemini streaming) ----------------------------- */
  /**
   * Stream story generation from Gemini (frontend) for speed.
   * Protocol: NDJSON lines emitted by the model, e.g.:
   * {"type":"sentence","tgt":"...", "sup":"..."}
   * ...
   * {"type":"done"}
   */
  const generateStoryGeminiStream = useCallback(async () => {
    setIsLoading(true);
    stopAllAudio();
    try {
      usageStatsRef.current.storyGenerations++;
      const tLang = targetLang; // 'es' | 'en' | 'nah'
      const sLang = supportLang; // 'en' | 'es'
      const tName = LLM_LANG_NAME(tLang);
      const sName = LLM_LANG_NAME(sLang);
      const diff = getCEFRPromptHint(cefrLevel);

      // NDJSON protocol. We instruct the model to strictly emit one compact JSON object per line.
      const scenarioDirective =
        lessonContent?.scenario || lessonContent?.topic
          ? lessonContent.scenario
            ? `STRICT REQUIREMENT: The scenario MUST be about: ${lessonContent.scenario}. Do NOT create stories about other topics. This is lesson-specific content and you MUST NOT diverge.`
            : `STRICT REQUIREMENT: The story MUST focus on the topic: ${lessonContent.topic}. Do NOT create stories about other topics. This is lesson-specific content and you MUST NOT diverge.`
          : "Create a simple conversational story appropriate for language practice.";

      const targetLanguageRule =
        tLang === "es"
          ? "All target sentences must be in Spanish."
          : `All target sentences must be in ${tName}. Do NOT use Spanish or any other language for the target sentences.`;

      const prompt = [
        "You are a language tutor. Generate a short, engaging conversational story",
        `for a learner practicing ${tName} (${tLang}). Difficulty: ${diff}.`,
        targetLanguageRule,
        `Also provide a brief support translation in ${sName} (${sLang}).`,
        scenarioDirective,
        "",
        "Constraints:",
        "- 8 to 10 sentences total.",
        "- Simple, culturally-relevant, 8–15 words per sentence.",
        "- Create an engaging narrative that helps the learner practice the language.",
        "- NO headings, NO commentary, NO code fences.",
        "",
        "Output protocol (NDJSON, one compact JSON object per line):",
        `1) For each sentence, output: {"type":"sentence","tgt":"<${tName} sentence>","sup":"<${sName} translation>"}`,
        '2) After the final sentence, output: {"type":"done"}',
        "",
        "Begin now and follow the protocol exactly.",
      ].join(" ");

      // Stream from Gemini
      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      let sentences = [];
      let revealed = false;
      const seenLineKeys = new Set();

      // Safely parse and apply a line of potential JSON
      const tryConsumeLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("```")) return;
        if (!(trimmed.startsWith("{") && trimmed.endsWith("}"))) return;
        let obj;
        try {
          obj = JSON.parse(trimmed);
        } catch {
          return;
        }
        if (obj?.type === "sentence" && (obj.tgt || obj.sup)) {
          const item = {
            tgt: String(obj.tgt || "").trim(),
            sup: String(obj.sup || "").trim(),
          };
          const key = `${item.tgt}|||${item.sup}`;
          if (seenLineKeys.has(key)) return;
          seenLineKeys.add(key);
          sentences.push(item);

          // Reveal UI as soon as we have the first sentence
          if (!revealed) {
            setStoryData({
              fullStory: { tgt: item.tgt, sup: item.sup || "" },
              sentences: [item],
            });
            setIsLoading(false);
            revealed = true;
          } else {
            // incrementally append
            setStoryData((prev) => {
              const prevSentences = prev?.sentences || [];
              const alreadyExists = prevSentences.some(
                (s) => s.tgt === item.tgt && s.sup === item.sup
              );
              if (alreadyExists) return prev;
              const nextSentences = [...prevSentences, item];
              return {
                fullStory: {
                  tgt:
                    (prev?.fullStory?.tgt ? prev.fullStory.tgt + " " : "") +
                    item.tgt,
                  sup:
                    (prev?.fullStory?.sup ? prev.fullStory.sup + " " : "") +
                    (item.sup || ""),
                },
                sentences: nextSentences,
              };
            });
          }
          return;
        }
        if (obj?.type === "done") {
          // no-op; we finalize after stream end as well
          return;
        }
      };

      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;

        // Consume complete lines
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line);
        }
      }

      const leftover = buffer.trim();
      if (leftover) {
        leftover
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((line) => tryConsumeLine(line));
      }

      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (!sentences.length && finalText) {
        finalText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((line) => tryConsumeLine(line));
      }

      // If model ignored protocol, fallback to best-effort parse
      if (sentences.length === 0 && finalText) {
        const rough = finalText
          .replace(/```[\s\S]*?```/g, "")
          .replace(/\n+/g, " ")
          .split(/[.!?]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 6);
        sentences = rough.map((s) => ({
          tgt: s.endsWith(".") ? s : s + ".",
          sup: "",
        }));
        if (sentences.length) {
          setIsLoading(false);
          setStoryData({
            fullStory: {
              tgt: sentences.map((s) => s.tgt).join(" "),
              sup: "",
            },
            sentences,
          });
          revealed = true;
        }
      }

      if (!revealed) throw new Error("No story produced.");

      // Final tidy/validation (keeps your existing UX expectations)
      setStoryData((prev) => {
        const normalized = normalizeStory(
          {
            fullStory: {
              [tLang]: prev.fullStory.tgt,
              [sLang]: prev.fullStory.sup,
            },
            sentences: prev.sentences.map((s) => ({
              [tLang]: s.tgt,
              [sLang]: s.sup,
            })),
          },
          tLang,
          sLang
        );
        const validated = validateAndFixStorySentences(
          normalized,
          "tgt",
          "sup"
        );
        storyCacheRef.current = validated;
        setCurrentSentenceIndex(0);
        setSessionXp(0);
        setSessionComplete(false);
        setSessionSummary({
          passed: 0,
          total: validated?.sentences?.length || 0,
        });
        setPassedCount(0);
        setShowFullStory(true);
        setHighlightedWordIndex(-1);
        return validated;
      });
    } catch (error) {
      console.error(
        "Gemini streaming failed; falling back to backend/demo.",
        error
      );
      try {
        await generateStory(); // fallback path
      } catch {
        setIsLoading(false);
      }
    }
  }, [
    lessonContent,
    cefrLevel,
    targetLang,
    supportLang,
    stopAllAudio,
    toast,
    uiLang,
    generateStory,
  ]);

  // Auto-generate story on mount if lessonContent is provided
  useEffect(() => {
    if (storyData || isLoading) return;
    if (lessonContent) {
      generateStoryGeminiStream();
    }
  }, [lessonContent, storyData, isLoading, generateStoryGeminiStream]);

  /* ----------------------------- Skip module ----------------------------- */
  const handleSkipModule = () => {
    // If in lesson mode, call onSkip to switch to next random module type
    if (onSkip && typeof onSkip === "function") {
      console.log("[StoryMode] Skipping to next lesson module");
      onSkip();
      return;
    }

    // Not in lesson mode - show a message
    toast({
      title: uiLang === "es" ? "No disponible" : "Not available",
      description:
        uiLang === "es"
          ? "Solo puedes saltar cuando estás en un modo de lección."
          : "You can only skip when in lesson mode.",
      status: "info",
      duration: 3000,
    });
  };

  /* ----------------------------- TTS / playback ----------------------------- */
  const playWithOpenAITTS = async (
    text,
    langTag,
    {
      alignToText = false,
      onStart = () => {},
      onEnd = () => {},
      setSynthesizing,
    } = {}
  ) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (currentAudioUrlRef.current) {
        try {
          URL.revokeObjectURL(currentAudioUrlRef.current);
        } catch {}
        currentAudioUrlRef.current = null;
      }

      setSynthesizing?.(true);

      usageStatsRef.current.ttsCalls++;

      const res = await fetch(TTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: text,
          voice: getRandomVoice(),
          model: "gpt-4o-mini-tts",
          response_format: "mp3",
          language: langTag,
        }),
      });

      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      currentAudioUrlRef.current = audioUrl;

      let tokenMap = null;
      if (alignToText) {
        tokenMap = createTokenMap(text);
        setTokenizedText(tokenMap.tokens);
        setHighlightedWordIndex(-1);
      }

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      let stopHighlighter = null;
      audio.onloadedmetadata = () => {
        if (alignToText && tokenMap) {
          stopHighlighter = startAudioAlignedHighlight(
            audio,
            tokenMap.tokens,
            (idx) => setHighlightedWordIndex(idx)
          );
        }
      };
      audio.onplay = () => onStart?.();
      audio.onended = () => {
        stopHighlighter?.();
        onEnd?.();
        setSynthesizing?.(false);
        currentAudioRef.current = null;
      };
      audio.onerror = (e) => {
        stopHighlighter?.();
        console.error("Audio playback error", e);
        onEnd?.();
        setSynthesizing?.(false);
        currentAudioRef.current = null;
      };

      await audio.play();
      setSynthesizing?.(false);
    } catch (e) {
      setSynthesizing?.(false);
      onEnd?.();
      throw e;
    }
  };

  const playNarrationWithHighlighting = async (text) => {
    stopAllAudio();
    setIsAutoPlaying(true);
    setIsPlayingTarget(true);
    try {
      const langTag = (BCP47[targetLang] || BCP47.es).tts;
      if (text.length < 50) {
        setIsSynthesizingTarget(true);
        await playEnhancedWebSpeech(text, langTag, {
          setSynthesizing: setIsSynthesizingTarget,
        });
        return;
      }
      await playWithOpenAITTS(text, langTag, {
        alignToText: true,
        onStart: () => {},
        onEnd: () => {
          setIsPlayingTarget(false);
          setIsAutoPlaying(false);
        },
        setSynthesizing: setIsSynthesizingTarget,
      });
    } catch (err) {
      console.error("TTS failed; falling back:", err);
      stopAllAudio();
      await playEnhancedWebSpeech(text, (BCP47[targetLang] || BCP47.es).tts);
    }
  };

  const playTargetTTS = async (text) => {
    if (!text) return;
    stopAllAudio();
    setIsPlayingTarget(true);
    try {
      await playWithOpenAITTS(text, (BCP47[targetLang] || BCP47.es).tts, {
        alignToText: false,
        onEnd: () => setIsPlayingTarget(false),
        setSynthesizing: setIsSynthesizingTarget,
      });
    } catch {
      stopAllAudio();
      setIsSynthesizingTarget(true);
      await playEnhancedWebSpeech(text, (BCP47[targetLang] || BCP47.es).tts, {
        setSynthesizing: setIsSynthesizingTarget,
      });
    }
  };

  const playSupportTTS = async (text) => {
    if (!text) return;
    stopAllAudio();
    setIsPlayingSupport(true);
    try {
      await playWithOpenAITTS(text, (BCP47[supportLang] || BCP47.en).tts, {
        alignToText: false,
        onEnd: () => setIsPlayingSupport(false),
        setSynthesizing: setIsSynthesizingSupport,
      });
    } catch (e) {
      console.error("Support TTS failed; falling back to Web Speech", e);
      setIsSynthesizingSupport(true);
      await playEnhancedWebSpeech(text, (BCP47[supportLang] || BCP47.en).tts, {
        setSynthesizing: setIsSynthesizingSupport,
        onEnd: () => setIsPlayingSupport(false),
      });
    }
  };

  const setupBoundaryHighlighting = useCallback(
    (text, onComplete) => {
      const tokenMap = createTokenMap(text);
      setTokenizedText(tokenMap.tokens);
      setHighlightedWordIndex(-1);
      setCurrentWordIndex(0);

      if (highlightIntervalRef.current)
        clearTimeout(highlightIntervalRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);

      const updateHighlight = (wordIndex) => {
        if (animationFrameRef.current)
          cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(() => {
          setHighlightedWordIndex(wordIndex);
          setCurrentWordIndex(wordIndex);
        });
      };

      const handleBoundary = () => updateHighlight(currentWordIndex + 1);

      const fallbackTiming = () => {
        let i = 0;
        const words = text.split(/\s+/);
        const tick = () => {
          if (i >= words.length) return onComplete?.();
          updateHighlight(i);
          const w = words[i];
          const base = 200;
          const ms = Math.max(150, Math.min(800, base + w.length * 50));
          i++;
          highlightIntervalRef.current = setTimeout(tick, ms);
        };
        tick();
      };

      return { handleBoundary, fallbackTiming, tokenMap };
    },
    [createTokenMap, currentWordIndex]
  );

  const playEnhancedWebSpeech = async (
    text,
    langTag,
    { onStart = null, onEnd = null, setSynthesizing = null } = {}
  ) => {
    const { handleBoundary, fallbackTiming } = setupBoundaryHighlighting(
      text,
      () => {
        setIsAutoPlaying(false);
        setIsPlayingTarget(false);
        onEnd?.();
      }
    );
    setSynthesizing?.(true);
    if (!("speechSynthesis" in window)) {
      setIsPlayingTarget(false);
      setIsAutoPlaying(false);
      setSynthesizing?.(false);
      onEnd?.();
      return;
    }

    const ensureVoices = () =>
      new Promise((res) => {
        const v = speechSynthesis.getVoices();
        if (v.length) return res(v);
        speechSynthesis.addEventListener(
          "voiceschanged",
          () => res(speechSynthesis.getVoices()),
          { once: true }
        );
      });

    await ensureVoices();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langTag || "es-ES";
    utter.rate = 0.85;
    utter.pitch = 1.02;
    utter.volume = 0.95;

    utter.onstart = () => {
      setIsPlayingTarget(true);
      setBoundarySupported(!!utter.onboundary);
      if (!utter.onboundary) fallbackTiming();
      setSynthesizing?.(false);
      onStart?.();
    };
    utter.onboundary = (evt) => handleBoundary(evt);
    utter.onend = () => {
      setIsPlayingTarget(false);
      setIsAutoPlaying(false);
      setSynthesizing?.(false);
      onEnd?.();
    };
    utter.onerror = () => {
      setIsPlayingTarget(false);
      setIsAutoPlaying(false);
      setSynthesizing?.(false);
      onEnd?.();
    };
    speechSynthesis.speak(utter);
  };

  /* ----------------------------- Recording + strict scoring ----------------------------- */
  const currentSentence = storyData?.sentences?.[currentSentenceIndex];
  const totalSentences = storyData?.sentences?.length || 0;
  const isLastSentence = currentSentenceIndex >= totalSentences - 1;

  const nextSentenceLabel =
    t(uiLang, "stories_next_sentence") ||
    (uiLang === "es" ? "Siguiente Oración" : "Next Sentence");
  const finishLabel =
    t(uiLang, "stories_finish") || (uiLang === "es" ? "Terminar" : "Finish");

  const handleEvaluationResult = useCallback(
    async ({
      evaluation,
      recognizedText = "",
      confidence = 0,
      audioMetrics = null,
      method = "",
      error = null,
    }) => {
      const target = currentSentence?.tgt || "";
      if (!target) return;
      const npubLive = strongNpub(useUserStore.getState().user);

      if (error) {
        toast({
          title: uiLang === "es" ? "No se pudo evaluar" : "Could not evaluate",
          description:
            uiLang === "es"
              ? "Vuelve a intentarlo con una conexión estable."
              : "Please try again with a stable connection.",
          status: "error",
          duration: 2500,
        });
        return;
      }

      if (!evaluation) return;

      if (!evaluation.pass) {
        const tips = speechReasonTips(evaluation.reasons, {
          uiLang,
          targetLabel: targetDisplayName,
        });

        setLastSuccessInfo(null);

        toast({
          title: uiText.almost,
          description: tips.join(" "),
          status: "warning",
          duration: 3800,
        });

        // log failed attempt (0 XP)
        saveStoryTurn(npubLive, {
          ok: false,
          mode: "sentence",
          lang: targetLang,
          supportLang,
          sentenceIndex: currentSentenceIndex,
          target,
          recognizedText,
          confidence,
          audioMetrics: audioMetrics || null,
          eval: evaluation,
          xpAwarded: 0,
          method,
        }).catch(() => {});
        return;
      }

      // Passed — advance (XP awarded once at the end of the story)
      setPassedCount((c) => c + 1);

      // log passing attempt with 0 awarded now (we award at session end)
      saveStoryTurn(npubLive, {
        ok: true,
        mode: "sentence",
        lang: targetLang,
        supportLang,
        sentenceIndex: currentSentenceIndex,
        target,
        recognizedText,
        confidence,
        audioMetrics: audioMetrics || null,
        eval: evaluation,
        xpAwarded: 0,
        method,
      }).catch(() => {});

      setLastSuccessInfo({
        score: evaluation.score,
        recognizedText,
        translation: currentSentence?.sup || "",
      });

      // Mark sentence as completed, wait for user to click "Next"
      setSentenceCompleted(true);
    },
    [
      currentSentence,
      currentSentenceIndex,
      supportLang,
      targetDisplayName,
      targetLang,
      toast,
      uiLang,
      uiText,
    ]
  );

  const {
    startRecording: startSpeakRecording,
    stopRecording: stopSpeakRecording,
    isRecording: isSpeakRecording,
    supportsSpeech: supportsSpeak,
  } = useSpeechPractice({
    targetText: currentSentence?.tgt || "",
    targetLang,
    onResult: handleEvaluationResult,
    timeoutMs: pauseMs,
  });

  const isRecording = isSpeakRecording;

  const handleRecordPress = useCallback(async () => {
    stopAllAudio();
    if (isSpeakRecording) {
      stopSpeakRecording();
      return;
    }

    setLastSuccessInfo(null);

    try {
      await startSpeakRecording();
    } catch (err) {
      const code = err?.code;
      if (code === "no-speech-recognition") {
        toast({
          title:
            uiLang === "es"
              ? "Reconocimiento de voz no disponible"
              : "Speech recognition unavailable",
          description:
            uiLang === "es"
              ? "Para calificar, usa un navegador Chromium con acceso al micrófono."
              : "For grading, please use a Chromium-based browser with microphone access.",
          status: "warning",
          duration: 3500,
        });
      } else if (code === "mic-denied") {
        toast({
          title:
            uiLang === "es"
              ? "Permiso de micrófono denegado"
              : "Microphone denied",
          description:
            uiLang === "es"
              ? "Activa el micrófono en la configuración del navegador."
              : "Enable microphone access in your browser settings.",
          status: "error",
          duration: 3200,
        });
      } else {
        toast({
          title:
            uiLang === "es"
              ? "No se pudo iniciar la grabación"
              : "Recording failed",
          description:
            uiLang === "es" ? "Inténtalo nuevamente." : "Please try again.",
          status: "error",
          duration: 2500,
        });
      }
    }
  }, [
    isSpeakRecording,
    startSpeakRecording,
    stopAllAudio,
    stopSpeakRecording,
    toast,
    uiLang,
  ]);

  /* ----------------------------- Award once at session end ----------------------------- */
  const computeStoryXpReward = () =>
    Math.max(4, Math.min(7, 4 + Math.round(Math.random() * 3)));

  const finalizePracticeSession = async (awardedXp) => {
    const npubLive = strongNpub(useUserStore.getState().user);
    if (!npubLive) return;

    if (sessionAwardedRef.current) return;
    sessionAwardedRef.current = true;

    if (awardedXp > 0) {
      await awardXp(npubLive, Math.round(awardedXp), targetLang).catch(
        () => {}
      );
    }
    try {
      await saveStoryTurn(npubLive, {
        ok: true,
        mode: "story-session-complete",
        lang: targetLang,
        supportLang,
        totalSentences: storyData?.sentences?.length || 0,
        passedSentences: passedCount,
        xpAwarded: Math.round(awardedXp || 0),
      });
    } catch {}
  };

  // Handle manual advancement to next sentence
  const handleNextSentence = async () => {
    const isLast =
      currentSentenceIndex >= (storyData?.sentences?.length || 0) - 1;

    if (!isLast) {
      setCurrentSentenceIndex((p) => p + 1);
      setSentenceCompleted(false);
      setLastSuccessInfo(null);
    } else {
      const totalSentences = storyData?.sentences?.length || 0;
      const latestPassed = Math.min(
        totalSentences || passedCount + 1,
        passedCount + 1
      );
      const totalSessionXp = computeStoryXpReward();
      setSessionXp(totalSessionXp);
      setSessionSummary({ passed: latestPassed, total: totalSentences });
      setSessionComplete(true);
      await finalizePracticeSession(totalSessionXp);

      // Move to the next lesson module when available; otherwise show recap
      if (onSkip && typeof onSkip === "function") {
        onSkip();
        return;
      }

      setShowFullStory(true);
      setCurrentSentenceIndex(0);
      setSentenceCompleted(false);
      setLastSuccessInfo(null);
    }
  };

  /* ----------------------------- Mount / Cleanup ----------------------------- */
  useEffect(() => {
    if (storyCacheRef.current) setStoryData(storyCacheRef.current);
  }, []);

  useEffect(() => {
    const cleanup = () => {
      stopAllAudio();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (audioRef.current) clearInterval(audioRef.current);
      if (currentAudioUrlRef.current) {
        try {
          URL.revokeObjectURL(currentAudioUrlRef.current);
        } catch {}
        currentAudioUrlRef.current = null;
      }
    };
    window.addEventListener("beforeunload", cleanup);
    return () => {
      cleanup();
      window.removeEventListener("beforeunload", cleanup);
    };
  }, []);

  /* ----------------------------- Derived ----------------------------- */
  const progressPercentage = storyData
    ? ((currentSentenceIndex + 1) / storyData.sentences.length) * 100
    : 0;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------- Loading / Empty ----------------------------- */
  if (isLoading) {
    return (
      <Box
        minH="100vh"
        // bg="linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)"
      >
        <Center h="100vh">
          <VStack spacing={6}>
            <Text color="white" fontSize="xl" fontWeight="600">
              {uiText.generatingTitle}
            </Text>
            <Text color="#94a3b8" fontSize="sm">
              {uiText.generatingSub}
            </Text>
            <Spinner color="teal.300" />
          </VStack>
        </Center>
      </Box>
    );
  }

  if (!storyData) {
    return (
      <Box
        minH="100vh"
        // bg="linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)"
        borderRadius="24px"
      >
        <Center h="100vh">
          <VStack spacing={6}>
            <Text color="white" fontSize="xl" fontWeight="600">
              {uiText.generatingTitle}
            </Text>
            <Text color="#94a3b8" fontSize="sm">
              {uiText.generatingSub}
            </Text>
            <Spinner color="teal.300" />
          </VStack>
        </Center>
      </Box>
    );
  }

  /* ----------------------------- Main UI ----------------------------- */
  return (
    <Box
      minH="100vh"

      // bg="linear-gradient(135deg, #0f0f23 0%, #1a1e2e 50%, #16213e 100%)"
    >
      {/* Header */}
      <motion.div
        initial={prefersReducedMotion ? {} : { y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={
          prefersReducedMotion ? {} : { duration: 0.6, ease: "easeOut" }
        }
      >
        <HStack
          as="header"
          w="100%"
          px={4}
          py={3}
          // bg="rgba(15, 15, 35, 0.8)"
          // backdropFilter="blur(20px)"
          color="white"
          // borderBottom="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          // position="sticky"
          top={0}
          zIndex={100}
        >
          <Spacer />
          <HStack spacing={3} align="center" flexWrap="wrap" justify="flex-end">
            {sessionXp > 0 && (
              <Badge colorScheme="teal" variant="subtle" fontSize="sm">
                +{sessionXp}
              </Badge>
            )}
          </HStack>
        </HStack>
      </motion.div>

      {/* Shared Level/XP card */}
      <Box px={4} pt={4}>
        <Box p={3} rounded="2xl">
          <Box display="flex" justifyContent={"center"}>
            <HStack justify="space-between" mb={1} width="50%" maxW="600px">
              <Badge colorScheme="cyan" variant="subtle" fontSize="10px">
                {uiText.levelLabel} {levelNumber}
              </Badge>
              <Badge colorScheme="teal" variant="subtle" fontSize="10px">
                {uiText.xp} {xp}
              </Badge>
            </HStack>
          </Box>
          <Box display="flex" justifyContent={"center"}>
            <Box width="50%" maxW="600px">
              <WaveBar value={progressPct} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Progress */}
      <Box px={4} py={3} display="flex" justifyContent={"center"}>
        <VStack spacing={2} width="50%" maxWidth={"600px"}>
          <HStack w="100%" justify="space-between">
            <Text fontSize="sm" color="#94a3b8">
              {uiText.progress}
            </Text>
            <Text fontSize="sm" color="#94a3b8">
              {showFullStory
                ? uiLang === "es"
                  ? "Narrativa"
                  : "Narrative"
                : `${currentSentenceIndex + 1} / ${
                    storyData?.sentences?.length || 0
                  }`}
            </Text>
          </HStack>
          <Progress
            value={progressPercentage}
            w="100%"
            h="20px"
            borderRadius="full"

            // bg="rgba(255, 255, 255, 0.1)"
            // sx={{
            //   "& > div": {
            //     bg: "linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)",
            //   },
            // }}
          />
        </VStack>
      </Box>

      {/* Content */}
      <Box
        px={4}
        py={6}
        display="flex"
        flexDirection={"column"}
        alignItems={"center"}
      >
        <motion.div
          key={
            showFullStory ? "full-story" : `sentence-${currentSentenceIndex}`
          }
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? {} : { duration: 0.5 }}
        >
          <VStack spacing={6} align="stretch" maxWidth="1280px">
            <Box
              bg="rgba(255, 255, 255, 0.05)"
              p={6}
              rounded="20px"
              border="1px solid rgba(255, 255, 255, 0.1)"
              backdropFilter="blur(20px)"
            >
              {showFullStory ? (
                <VStack spacing={4} align="stretch">
                  {/* Full story with highlighting (target language) */}
                  <Box>
                    <Text
                      fontSize="lg"
                      fontWeight="500"
                      color="#f8fafc"
                      mb={3}
                      lineHeight="1.8"
                    >
                      {tokenizedText
                        ? tokenizedText.map((token, idx) =>
                            token.isWord ? (
                              <Text
                                key={idx}
                                as="span"
                                // bg={
                                //   highlightedWordIndex ===
                                //   tokenizedText
                                //     .slice(0, idx)
                                //     .filter((t) => t.isWord).length
                                //     ? "rgba(139, 92, 246, 0.3)"
                                //     : "transparent"
                                // }
                                px={1}
                                borderRadius="4px"
                                transition="background-color 0.1s ease"
                              >
                                {token.text}
                              </Text>
                            ) : (
                              <Text key={idx} as="span">
                                {token.text}
                              </Text>
                            )
                          )
                        : (storyData.fullStory?.tgt || "")
                            .split(" ")
                            .map((w, i) => (
                              <Text
                                key={i}
                                as="span"
                                // bg={
                                //   highlightedWordIndex === i
                                //     ? "rgba(139, 92, 246, 0.3)"
                                //     : "transparent"
                                // }
                                px={1}
                                borderRadius="4px"
                                transition="background-color 0.3s ease"
                              >
                                {w}{" "}
                              </Text>
                            ))}
                    </Text>
                    {!!storyData.fullStory?.sup && (
                      <Text fontSize="md" color="#94a3b8" lineHeight="1.6">
                        {storyData.fullStory.sup}
                      </Text>
                    )}
                  </Box>

                  {/* Audio controls */}
                  <HStack spacing={3} justify="center">
                    <Button
                      onClick={() =>
                        playNarrationWithHighlighting(storyData.fullStory?.tgt)
                      }
                      isLoading={
                        isPlayingTarget || isSynthesizingTarget || isAutoPlaying
                      }
                      loadingText={
                        isSynthesizingTarget
                          ? uiText.tts_synthesizing
                          : uiText.playing
                      }
                      leftIcon={<PiSpeakerHighDuotone />}
                      color="white"
                    >
                      {isAutoPlaying
                        ? uiText.playing
                        : uiText.playTarget(targetDisplayName)}
                    </Button>
                    {!!storyData.fullStory?.sup && (
                      <Button
                        onClick={() => playSupportTTS(storyData.fullStory?.sup)}
                        isLoading={isPlayingSupport || isSynthesizingSupport}
                        loadingText={
                          isSynthesizingSupport
                            ? uiText.tts_synthesizing
                            : uiText.playing
                        }
                        leftIcon={<PiSpeakerHighDuotone />}
                        variant="outline"
                        borderColor="rgba(255, 255, 255, 0.3)"
                        color="white"
                      >
                        {supportDisplayName}
                      </Button>
                    )}
                    {(isPlayingTarget || isPlayingSupport || isAutoPlaying) && (
                      <Button
                        onClick={stopAllAudio}
                        leftIcon={<FaStop />}
                        variant="outline"
                        borderColor="rgba(239, 68, 68, 0.5)"
                        color="#ef4444"
                      >
                        {uiText.stop}
                      </Button>
                    )}
                  </HStack>

                  <Center>
                    <Button
                      onClick={() => {
                        stopAllAudio();
                        setShowFullStory(false);
                        setCurrentSentenceIndex(0);
                        setSessionXp(0);
                        setSessionComplete(false);
                        setSessionSummary({
                          passed: 0,
                          total: storyData?.sentences?.length || 0,
                        });
                        sessionAwardedRef.current = false;
                        setPassedCount(0);
                        setHighlightedWordIndex(-1);
                        stopSpeakRecording();
                      }}
                      size="lg"
                      px={8}
                      rounded="full"
                      bg="linear-gradient(135deg,rgb(0, 157, 255) 0%,rgb(0, 101, 210) 100%)"
                      color="white"
                      fontWeight="600"
                      _active={{ transform: "translateY(0)" }}
                      transition="all 0.2s ease"
                    >
                      {uiText.startPractice}
                    </Button>
                  </Center>
                </VStack>
              ) : (
                /* Sentence practice */
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="lg" fontWeight="500" color="#f8fafc" mb={3}>
                      {uiText.practiceThis}
                    </Text>
                    <Text
                      fontSize="xl"
                      fontWeight="600"
                      color="white"
                      lineHeight="1.6"
                      mb={2}
                      textAlign="center"
                    >
                      {currentSentence?.tgt}
                    </Text>
                    {!!currentSentence?.sup && (
                      <Text
                        fontSize="md"
                        color="#94a3b8"
                        lineHeight="1.5"
                        textAlign="center"
                      >
                        {currentSentence?.sup}
                      </Text>
                    )}
                    <Text
                      fontSize="sm"
                      color="#64748b"
                      textAlign="center"
                      mt={2}
                    >
                      {uiLang === "es" ? "Oración" : "Sentence"}{" "}
                      {currentSentenceIndex + 1} {uiLang === "es" ? "de" : "of"}{" "}
                      {storyData.sentences.length}
                    </Text>
                  </Box>

                  <VStack spacing={4}>
                    <Center>
                      <HStack spacing={4}>
                        <Button
                          onClick={handleRecordPress}
                          size="lg"
                          height="60px"
                          px={8}
                          rounded="full"
                          bg={
                            isRecording
                              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                              : "linear-gradient(135deg,rgb(0, 157, 255) 0%,rgb(0, 101, 210) 100%)"
                          }
                          color="white"
                          fontWeight="600"
                          fontSize="lg"
                          leftIcon={<PiMicrophoneStageDuotone />}
                          isDisabled={!supportsSpeak || !currentSentence?.tgt}
                          _hover={{
                            bg: isRecording
                              ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                              : "linear-gradient(135deg,rgb(0, 157, 255) 0%,rgb(0, 101, 210) 100%)",
                            transform: "translateY(-2px)",
                          }}
                          _active={{ transform: "translateY(0)" }}
                          transition="all 0.2s ease"
                        >
                          {isRecording ? uiText.stopRecording : uiText.record}
                        </Button>
                      </HStack>
                    </Center>
                    <HStack spacing={3} justify="center">
                      <Button
                        onClick={() => playTargetTTS(currentSentence?.tgt)}
                        isLoading={isPlayingTarget || isSynthesizingTarget}
                        loadingText={
                          isSynthesizingTarget
                            ? uiText.tts_synthesizing
                            : uiText.playing
                        }
                        leftIcon={<PiSpeakerHighDuotone />}
                        variant="outline"
                        borderColor="rgba(255, 255, 255, 0.3)"
                        color="white"
                        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                        size="sm"
                      >
                        {uiText.listen}
                      </Button>
                    </HStack>
                    {sentenceCompleted && lastSuccessInfo ? (
                      <SlideFade in={true} offsetY="10px">
                        <Flex
                          direction={{ base: "column", md: "row" }}
                          gap={3}
                          p={4}
                          borderRadius="xl"
                          bg="linear-gradient(90deg, rgba(72,187,120,0.16), rgba(56,161,105,0.08))"
                          borderWidth="1px"
                          borderColor="green.400"
                          boxShadow="0 12px 30px rgba(0, 0, 0, 0.3)"
                          align={{ base: "stretch", md: "center" }}
                        >
                          <HStack spacing={3} flex="1" align="center">
                            <Flex
                              w="44px"
                              h="44px"
                              rounded="full"
                              align="center"
                              justify="center"
                              bg="green.500"
                              color="white"
                              fontWeight="bold"
                              fontSize="lg"
                              boxShadow="0 10px 24px rgba(0,0,0,0.22)"
                            >
                              ✓
                            </Flex>
                            <Box>
                              <Text fontWeight="semibold">
                                {t(uiLang, "stories_sentence_success_title") ||
                                  uiText.wellDone}
                              </Text>
                              <Text fontSize="sm" color="whiteAlpha.800">
                                {typeof lastSuccessInfo.score === "number"
                                  ? t(
                                      uiLang,
                                      "stories_sentence_success_score",
                                      {
                                        score: lastSuccessInfo.score,
                                      }
                                    ) ||
                                    `${uiText.score}: ${lastSuccessInfo.score}%`
                                  : t(uiLang, "practice_next_ready") ||
                                    (uiLang === "es"
                                      ? "¡Listo para continuar!"
                                      : "Ready to continue!")}
                              </Text>
                            </Box>
                          </HStack>
                          <Button
                            rightIcon={<FiArrowRight />}
                            colorScheme="teal"
                            variant="solid"
                            onClick={handleNextSentence}
                            shadow="md"
                            w={{ base: "100%", md: "auto" }}
                          >
                            {isLastSentence ? finishLabel : nextSentenceLabel}
                          </Button>
                        </Flex>
                      </SlideFade>
                    ) : null}
                    {sessionComplete &&
                    sessionXp > 0 &&
                    sessionSummary.total > 0 ? (
                      <SpeakSuccessCard
                        title={
                          uiLang === "es"
                            ? "¡Juego de roles completado!"
                            : "Role play completed!"
                        }
                        scoreLabel={`${sessionSummary.passed}/${
                          sessionSummary.total
                        } ${uiLang === "es" ? "oraciones" : "sentences"}`}
                        xp={sessionXp}
                        t={t}
                        userLanguage={uiLang}
                      />
                    ) : null}
                  </VStack>
                </VStack>
              )}
            </Box>
          </VStack>
        </motion.div>

        {/* Skip button - only show in lesson mode */}
        {onSkip && (
          <Center mt={4}>
            <Button
              onClick={handleSkipModule}
              // size="md"
              variant="outline"
              colorScheme="orange"
              color="white"
              padding={6}
            >
              {uiLang === "es" ? "Saltar" : "Skip"}
            </Button>
          </Center>
        )}
      </Box>
    </Box>
  );
}
