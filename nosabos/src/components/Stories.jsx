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
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaVolumeUp, FaStop, FaPen } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
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
import { translations } from "../utils/translation";
import { WaveBar } from "./WaveBar";
import { PasscodePage } from "./PasscodePage";
import { awardXp } from "../utils/utils";
import { simplemodel } from "../firebaseResources/firebaseResources"; // ✅ Gemini client
import {
  evaluateAttemptStrict,
  computeAudioMetricsFromBlob,
  speechReasonTips,
} from "../utils/speechEvaluation";

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
  ({ en: "English", es: "Spanish", pt: "Portuguese", nah: "Nahuatl" }[code] ||
  code);

const BCP47 = {
  es: { stt: "es-ES", tts: "es-ES" },
  en: { stt: "en-US", tts: "en-US" },
  pt: { stt: "pt-BR", tts: "pt-BR" },
  nah: { stt: "es-ES", tts: "es-ES" }, // fallback if Nahuatl is unsupported by engines
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
  const [rolePlayRole, setRolePlayRole] = useState("");

  useEffect(() => {
    if (!npub) return;
    const ref = doc(database, "users", npub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      setXp(Number.isFinite(data?.xp) ? data.xp : 0);
      const p = data?.progress || {};
      setProgress({
        level: p.level || "beginner",
        targetLang: ["nah", "es", "pt", "en"].includes(p.targetLang)
          ? p.targetLang
          : "es",
        supportLang: ["en", "es", "bilingual"].includes(p.supportLang)
          ? p.supportLang
          : "en",
        voice: p.voice || "alloy",
      });
      const storedRole =
        typeof data?.rolePlay?.role === "string"
          ? data.rolePlay.role
          : typeof data?.rolePlayRole === "string"
          ? data.rolePlayRole
          : "";
      setRolePlayRole(storedRole.trim());
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub, rolePlayRole };
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
function useUIText(uiLang, level, translationsObj) {
  return useMemo(() => {
    const t = translationsObj[uiLang] || translationsObj.en;
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
      xp: t?.ra_label_xp || "XP",
      levelLabel: uiLang === "es" ? "Nivel" : "Level",
      levelValue:
        uiLang === "es"
          ? {
              beginner: translationsObj.es.onboarding_level_beginner,
              intermediate: translationsObj.es.onboarding_level_intermediate,
              advanced: translationsObj.es.onboarding_level_advanced,
            }[level] || level
          : {
              beginner: translationsObj.en.onboarding_level_beginner,
              intermediate: translationsObj.en.onboarding_level_intermediate,
              advanced: translationsObj.en.onboarding_level_advanced,
            }[level] || level,
    };
  }, [uiLang, level, translationsObj]);
}

/* ================================
   Normalization / Scoring (multi-lang)
=================================== */

/* ================================
   Main Component
=================================== */
export default function StoryMode() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useUserStore((s) => s.user);

  // Shared settings + XP
  const { xp, levelNumber, progressPct, progress, npub, rolePlayRole } =
    useSharedProgress();

  // APP UI language (drives all UI copy)
  const uiLang = getAppUILang();
  const uiText = useUIText(uiLang, progress.level, translations);

  // Content languages
  const targetLang = progress.targetLang; // 'es' | 'en' | 'nah'
  const supportLang =
    progress.supportLang === "bilingual"
      ? uiLang === "es"
        ? "es"
        : "en"
      : progress.supportLang;

  const targetName = LLM_LANG_NAME(targetLang);
  const supportName = LLM_LANG_NAME(supportLang);

  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  useEffect(() => {
    if (
      levelNumber > 2 &&
      localStorage.getItem("passcode") !== import.meta.env.VITE_PATREON_PASSCODE
    ) {
      setShowPasscodeModal(true);
    }
  }, [xp]);

  // State
  const [storyData, setStoryData] = useState(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [isEditingRole, setIsEditingRole] = useState(false);

  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [isPlayingSupport, setIsPlayingSupport] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // accumulate this session, but award only at end
  const [sessionXp, setSessionXp] = useState(0);
  const [passedCount, setPassedCount] = useState(0);

  const [showFullStory, setShowFullStory] = useState(true);

  // Highlighting (target full story)
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [tokenizedText, setTokenizedText] = useState(null);
  const [boundarySupported, setBoundarySupported] = useState(null);

  // Refs
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const storyCacheRef = useRef(null);
  const highlightIntervalRef = useRef(null);
  const roleInputRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentAudioRef = useRef(null);
  const eventSourceRef = useRef(null);
  const audioCacheRef = useRef(new Map());
  const evalRef = useRef({
    inProgress: false,
    speechDone: false,
    timeoutId: null,
  });

  useEffect(() => {
    const normalized = (rolePlayRole || "").trim();
    setActiveRole(normalized);
    setRoleInput(normalized);
    setIsEditingRole(!normalized);
  }, [rolePlayRole]);

  useEffect(() => {
    if (isEditingRole) {
      roleInputRef.current?.focus();
      roleInputRef.current?.select();
    }
  }, [isEditingRole]);
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
  // Normalize incoming story to { fullStory: { tgt, sup }, sentences: [{tgt,sup}, ...] }
  function normalizeStory(raw, tgtCode, supCode) {
    if (!raw) return null;
    const pick = (obj, code, fallback) =>
      obj?.[code] ??
      (code === "es" ? obj?.es : code === "en" ? obj?.en : undefined) ??
      obj?.[fallback];

    const fullTgt = pick(raw.fullStory || {}, tgtCode, "es");
    const fullSup = pick(raw.fullStory || {}, supCode, "en");
    const sentences = (raw.sentences || []).map((s) => ({
      tgt: s?.[tgtCode] ?? s?.es ?? s?.en ?? "",
      sup: s?.[supCode] ?? s?.en ?? s?.es ?? "",
    }));

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
    setIsAutoPlaying(false);
    setHighlightedWordIndex(-1);
  }, []);

  /* ----------------------------- Story generation (backend, fallback) ----------------------------- */
  const generateStory = useCallback(
    async (roleOverride) => {
      const roleFocus = (roleOverride || activeRole || "").trim();
      setIsLoading(true);
      stopAllAudio();
      try {
        usageStatsRef.current.storyGenerations++;
        const storyUrl = "https://generatestory-hftgya63qa-uc.a.run.app";
        const response = await fetch(storyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            text: { format: { type: "text" } },
            input: {
              uiLanguage: uiLang, // UI language is app UI only
              level: progress.level || "beginner",
              targetLang, // content target language
              supportLang, // effective support language (bilingual mirrors UI)
              rolePlayRole: roleFocus,
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
        if (!normalized)
          throw new Error("Story payload missing expected fields");
        const validated = validateAndFixStorySentences(
          normalized,
          "tgt",
          "sup"
        );
        setStoryData(validated);
        storyCacheRef.current = validated;
        setCurrentSentenceIndex(0);
        setSessionXp(0);
        setPassedCount(0);
        setShowFullStory(true);
        setHighlightedWordIndex(-1);
      } catch (error) {
        // Bilingual fallback (ES/EN) that respects target/support languages
        const fallback = {
          fullStory: {
            tgt:
              targetLang === "en"
                ? roleFocus
                  ? `In this scene, you are ${roleFocus}. One afternoon in San Miguel, the town square is lively as you guide your friends through a new challenge.`
                  : "Once upon a time, there was a small town called San Miguel. The town had a lovely square where kids played every day. In the square, an old fountain always had fresh water. Adults sat around it to talk and rest after work."
                : roleFocus
                ? `En esta historia eres ${roleFocus}. Una tarde en San Miguel, la plaza del pueblo está llena de vida mientras guías a tus amistades en un nuevo reto.`
                : "Había una vez un pequeño pueblo en México llamado San Miguel. El pueblo tenía una plaza muy bonita donde los niños jugaban todos los días. En la plaza, había una fuente antigua que siempre tenía agua fresca. Los adultos se sentaban alrededor de la fuente para hablar y descansar después del trabajo.",
            sup:
              supportLang === "es"
                ? roleFocus
                  ? `En esta historia eres ${roleFocus}. Una tarde en San Miguel, la plaza del pueblo está llena de vida mientras guías a tus amistades en un nuevo reto.`
                  : "Había una vez un pequeño pueblo en México llamado San Miguel. El pueblo tenía una plaza muy bonita donde los niños jugaban todos los días. En la plaza, había una fuente antigua que siempre tenía agua fresca. Los adultos se sentaban alrededor de la fuente para hablar y descansar después del trabajo."
                : roleFocus
                ? `In this role play you are ${roleFocus}. One afternoon in San Miguel, the town square is buzzing while you guide your friends through a new challenge.`
                : "Once upon a time, there was a small town in Mexico called San Miguel. The town had a very beautiful square where the children played every day. In the square, there was an old fountain that always had fresh water. The adults sat around the fountain to talk and rest after work.",
          },
          sentences:
            targetLang === "en"
              ? [
                  {
                    tgt: roleFocus
                      ? `You step into the plaza as ${roleFocus}, ready to help.`
                      : "Once upon a time, there was a small town called San Miguel.",
                    sup:
                      supportLang === "es"
                        ? roleFocus
                          ? `Entras a la plaza como ${roleFocus}, listo para ayudar.`
                          : "Había una vez un pequeño pueblo llamado San Miguel."
                        : roleFocus
                        ? `You step into the plaza as ${roleFocus}, ready to help.`
                        : "Once upon a time, there was a small town called San Miguel.",
                  },
                  {
                    tgt: roleFocus
                      ? "The townspeople gather around you, eager for guidance."
                      : "The town had a lovely square where kids played every day.",
                    sup:
                      supportLang === "es"
                        ? roleFocus
                          ? "La gente del pueblo se reúne contigo, con ganas de escuchar tus consejos."
                          : "El pueblo tenía una plaza bonita donde los niños jugaban a diario."
                        : roleFocus
                        ? "The townspeople gather around you, eager for guidance."
                        : "The town had a lovely square where kids played every day.",
                  },
                  {
                    tgt: roleFocus
                      ? "You show them how to use the fountain to solve their problem."
                      : "In the square, an old fountain always had fresh water.",
                    sup:
                      supportLang === "es"
                        ? roleFocus
                          ? "Les enseñas a usar la fuente para resolver su problema."
                          : "En la plaza, una fuente antigua siempre tenía agua fresca."
                        : roleFocus
                        ? "You show them how to use the fountain to solve their problem."
                        : "In the square, an old fountain always had fresh water.",
                  },
                  {
                    tgt: roleFocus
                      ? "Everyone thanks you for leading the way with calm confidence."
                      : "Adults sat around it to talk and rest after work.",
                    sup:
                      supportLang === "es"
                        ? roleFocus
                          ? "Todos te agradecen por guiarlos con calma y confianza."
                          : "Los adultos se sentaban alrededor para hablar y descansar después del trabajo."
                        : roleFocus
                        ? "Everyone thanks you for leading the way with calm confidence."
                        : "Adults sat around it to talk and rest after work.",
                  },
                ]
              : [
                  {
                    tgt: roleFocus
                      ? `Eres ${roleFocus} y llegas a la plaza principal.`
                      : "Había una vez un pequeño pueblo en México llamado San Miguel.",
                    sup:
                      supportLang === "es"
                        ? "Había una vez un pequeño pueblo en México llamado San Miguel."
                        : roleFocus
                        ? `You are ${roleFocus} arriving at the main square.`
                        : "Once upon a time, there was a small town in Mexico called San Miguel.",
                  },
                  {
                    tgt: roleFocus
                      ? "La gente se reúne a tu alrededor para pedirte ayuda."
                      : "El pueblo tenía una plaza muy bonita donde los niños jugaban todos los días.",
                    sup:
                      supportLang === "es"
                        ? "El pueblo tenía una plaza muy bonita donde los niños jugaban todos los días."
                        : roleFocus
                        ? "People gather around you to ask for help."
                        : "The town had a very beautiful square where the children played every day.",
                  },
                  {
                    tgt: roleFocus
                      ? "Enseñas a todos a usar la fuente para resolver la situación."
                      : "En la plaza, había una fuente antigua que siempre tenía agua fresca.",
                    sup:
                      supportLang === "es"
                        ? "En la plaza, había una fuente antigua que siempre tenía agua fresca."
                        : roleFocus
                        ? "You teach everyone to use the fountain to solve the situation."
                        : "In the square, there was an old fountain that always had fresh water.",
                  },
                  {
                    tgt: roleFocus
                      ? "Todos te agradecen por liderar con calma y creatividad."
                      : "Los adultos se sentaban alrededor de la fuente para hablar y descansar después del trabajo.",
                    sup:
                      supportLang === "es"
                        ? "Los adultos se sentaban alrededor de la fuente para hablar y descansar después del trabajo."
                        : roleFocus
                        ? "The adults thank you for leading with calm creativity."
                        : "The adults sat around the fountain to talk and rest after work.",
                  },
                ],
        };
        setStoryData(fallback);
        storyCacheRef.current = fallback;
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
    },
    [
      activeRole,
      progress.level,
      targetLang,
      supportLang,
      uiLang,
      stopAllAudio,
      toast,
    ]
  );

  /* ----------------------------- Story generation (Gemini streaming) ----------------------------- */
  /**
   * Stream story generation from Gemini (frontend) for speed.
   * Protocol: NDJSON lines emitted by the model, e.g.:
   * {"type":"sentence","tgt":"...", "sup":"..."}
   * ...
   * {"type":"done"}
   */
  const generateStoryGeminiStream = useCallback(
    async (roleOverride) => {
      const roleFocus = (roleOverride || activeRole || "").trim();
      if (!roleFocus) {
        toast({
          title: uiLang === "es" ? "Agrega un rol" : "Add a role",
          description:
            uiLang === "es"
              ? "Cuéntanos a quién quieres interpretar antes de continuar."
              : "Tell us who you want to role play as before continuing.",
          status: "warning",
          duration: 3000,
        });
        return;
      }

      setIsLoading(true);
      stopAllAudio();
      try {
        usageStatsRef.current.storyGenerations++;
        const lvl = progress.level || "beginner";
        const tLang = targetLang; // 'es' | 'en' | 'nah'
        const sLang = supportLang; // 'en' | 'es'
        const tName = LLM_LANG_NAME(tLang);
        const sName = LLM_LANG_NAME(sLang);

        // NDJSON protocol. We instruct the model to strictly emit one compact JSON object per line.
        const prompt = [
          "You are a language tutor. Generate a short, engaging role play scenario",
          `for a ${lvl} learner who is role playing as ${roleFocus}. Target language: ${tName} (${tLang}).`,
          `Also provide a brief support translation in ${sName} (${sLang}).`,
          "",
          "Constraints:",
          "- 8 to 10 sentences total.",
          "- Simple, culturally-relevant, 8–15 words per sentence.",
          `- Make the learner, acting as ${roleFocus}, the protagonist of the story.`,
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
          await generateStory(roleFocus); // fallback path
        } catch {
          setIsLoading(false);
        }
      }
    },
    [
      activeRole,
      progress.level,
      targetLang,
      supportLang,
      stopAllAudio,
      toast,
      uiLang,
      generateStory,
    ]
  );

  const handleRoleSubmit = async (event) => {
    event?.preventDefault?.();
    const trimmed = roleInput.trim();
    if (!trimmed) {
      toast({
        title: uiLang === "es" ? "Agrega un rol" : "Add a role",
        description:
          uiLang === "es"
            ? "Escribe quién quieres ser en esta práctica."
            : "Describe who you want to role play as before continuing.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      if (npub) {
        await setDoc(
          doc(database, "users", npub),
          {
            rolePlay: {
              role: trimmed,
              updatedAt: isoNow(),
            },
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Failed to save role play preference", error);
      toast({
        title:
          uiLang === "es"
            ? "No se pudo guardar el rol"
            : "Couldn't save your role",
        description:
          uiLang === "es"
            ? "Intentaremos generar el juego de todas formas."
            : "We'll still try to generate your role play.",
        status: "error",
        duration: 3000,
      });
    }

    setRoleInput(trimmed);
    setActiveRole(trimmed);
    storyCacheRef.current = null;
    setStoryData(null);
    setCurrentSentenceIndex(0);
    setSessionXp(0);
    setPassedCount(0);
    setShowFullStory(true);
    setHighlightedWordIndex(-1);
    setIsEditingRole(false);
    await generateStoryGeminiStream(trimmed);
  };

  useEffect(() => {
    const normalized = activeRole.trim();
    if (!normalized) return;
    if (storyData || isLoading) return;
    generateStoryGeminiStream(normalized);
  }, [activeRole, storyData, isLoading, generateStoryGeminiStream]);

  /* ----------------------------- TTS / playback ----------------------------- */
  const playWithOpenAITTS = async (
    text,
    langTag,
    { alignToText = false, onStart = () => {}, onEnd = () => {} } = {}
  ) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      const voice = progress.voice || "alloy";
      const cacheKey = `${text}-${voice}-${langTag}`;
      let audioUrl = audioCacheRef.current.get(cacheKey);

      if (!audioUrl) {
        usageStatsRef.current.ttsCalls++;
        const res = await fetch(
          "https://proxytts-hftgya63qa-uc.a.run.app/proxyTTS",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input: text,
              voice,
              model: "gpt-4o-mini-tts",
              response_format: "mp3",
            }),
          }
        );
        if (!res.ok) throw new Error(`OpenAI TTS ${res.status}`);
        const blob = await res.blob();
        audioUrl = URL.createObjectURL(blob);
        audioCacheRef.current.set(cacheKey, audioUrl);
      }

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
        currentAudioRef.current = null;
      };
      audio.onerror = (e) => {
        stopHighlighter?.();
        console.error("Audio playback error", e);
        onEnd?.();
        currentAudioRef.current = null;
      };

      await audio.play();
    } catch (e) {
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
        await playEnhancedWebSpeech(text, langTag);
        return;
      }
      await playWithOpenAITTS(text, langTag, {
        alignToText: true,
        onStart: () => {},
        onEnd: () => {
          setIsPlayingTarget(false);
          setIsAutoPlaying(false);
        },
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
      });
    } catch {
      stopAllAudio();
      await playEnhancedWebSpeech(text, (BCP47[targetLang] || BCP47.es).tts);
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
      });
    } catch (e) {
      console.error("Support TTS failed; falling back to Web Speech", e);
      await playEnhancedWebSpeech(
        text,
        (BCP47[supportLang] || BCP47.en).tts,
        () => setIsPlayingSupport(false)
      );
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

  const playEnhancedWebSpeech = async (text, langTag, onEndCb) => {
    const { handleBoundary, fallbackTiming } = setupBoundaryHighlighting(
      text,
      () => {
        setIsAutoPlaying(false);
        setIsPlayingTarget(false);
        onEndCb?.();
      }
    );
    if (!("speechSynthesis" in window)) {
      setIsPlayingTarget(false);
      setIsAutoPlaying(false);
      onEndCb?.();
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
    };
    utter.onboundary = (evt) => handleBoundary(evt);
    utter.onend = () => {
      setIsPlayingTarget(false);
      setIsAutoPlaying(false);
      onEndCb?.();
    };
    utter.onerror = () => {
      setIsPlayingTarget(false);
      setIsAutoPlaying(false);
      onEndCb?.();
    };
    speechSynthesis.speak(utter);
  };

  /* ----------------------------- Recording + strict scoring ----------------------------- */
  const currentSentence = storyData?.sentences?.[currentSentenceIndex];

  const startRecording = async () => {
    if (evalRef.current.inProgress) return;
    evalRef.current.inProgress = true;
    evalRef.current.speechDone = false;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
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
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      const chunks = [];
      mr.ondataavailable = (e) => {
        if (e.data?.size) chunks.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (!evalRef.current.speechDone) {
          await evaluateWithAudioAnalysis(blob);
        }
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {}
        evalRef.current.inProgress = false;
        clearTimeout(evalRef.current.timeoutId);
        setIsRecording(false);
      };

      if (SR) {
        const recog = new SR();
        recognitionRef.current = recog;
        recog.lang = (BCP47[targetLang] || BCP47.es).stt;
        recog.continuous = false;
        recog.interimResults = false;
        recog.maxAlternatives = 5;

        recog.onresult = (evt) => {
          if (!evalRef.current.inProgress) return;
          evalRef.current.speechDone = true;
          clearTimeout(evalRef.current.timeoutId);

          const result = evt.results[0];
          const best = result[0];

          handleEvaluationResult({
            recognizedText: best?.transcript || "",
            confidence:
              typeof best?.confidence === "number" ? best.confidence : 0,
            method: "live-speech-api",
          });

          try {
            recog.stop();
          } catch {}
          try {
            mr.stop();
          } catch {}
        };
        recog.onerror = () => {
          evalRef.current.speechDone = false;
          try {
            mr.stop();
          } catch {}
        };
        recog.onend = () => {
          if (evalRef.current.inProgress && !evalRef.current.speechDone) {
            try {
              mr.stop();
            } catch {}
          }
        };
        try {
          recog.start();
        } catch {}
      }

      mr.start();
      setIsRecording(true);

      // global timeout safety
      evalRef.current.timeoutId = setTimeout(() => {
        if (!evalRef.current.inProgress) return;
        evalRef.current.speechDone = false;
        try {
          recognitionRef.current?.stop?.();
        } catch {}
        try {
          mr.stop();
        } catch {}
      }, 15000);
    } catch (err) {
      evalRef.current.inProgress = false;
      console.error("Mic error:", err);
      toast({
        title: uiLang === "es" ? "Error de micrófono" : "Microphone error",
        description:
          uiLang === "es"
            ? "Revisa permisos e inténtalo de nuevo."
            : "Check permissions and try again.",
        status: "error",
        duration: 3000,
      });
    }
  };

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    } catch {}
  };

  const evaluateWithAudioAnalysis = async (blob) => {
    try {
      const metrics = await computeAudioMetricsFromBlob(blob);
      handleEvaluationResult({
        recognizedText: "",
        confidence: 0,
        audioMetrics: metrics,
        method: "audio-fallback",
      });
    } catch (e) {
      console.error("Audio analysis failed:", e);
      toast({
        title:
          uiLang === "es"
            ? "No se pudo evaluar el audio"
            : "Could not evaluate audio",
        description:
          uiLang === "es"
            ? "Vuelve a intentarlo hablando claramente."
            : "Please try again, speak clearly in the target language.",
        status: "error",
        duration: 2500,
      });
      setIsRecording(false);
    }
  };

  /* ----------------------------- Award once at session end ----------------------------- */
  const finalizePracticeSession = async (awardedXp) => {
    const npubLive = strongNpub(useUserStore.getState().user);
    if (!npubLive) return;

    if (awardedXp > 0) {
      await awardXp(npubLive, Math.round(awardedXp)).catch(() => {});
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

  // STRICT gate handler — only advances on pass; accumulate XP; log attempts
  const handleEvaluationResult = async ({
    recognizedText = "",
    confidence = 0,
    audioMetrics,
    method,
  }) => {
    const target = currentSentence?.tgt || "";
    const evalOut = evaluateAttemptStrict({
      recognizedText,
      confidence,
      audioMetrics,
      targetSentence: target,
      lang: targetLang,
    });
    const npubLive = strongNpub(useUserStore.getState().user);

    if (!evalOut.pass) {
      const tips = speechReasonTips(evalOut.reasons, {
        uiLang,
        targetLabel: LLM_LANG_NAME(targetLang),
      });

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
        eval: evalOut,
        xpAwarded: 0,
      }).catch(() => {});
      setIsRecording(false);
      return;
    }

    // Passed — accumulate XP and advance (no award yet)
    const delta = 15; // XP per passed sentence
    setSessionXp((p) => p + delta);
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
      eval: evalOut,
      xpAwarded: 0,
    }).catch(() => {});

    toast({
      title: uiText.wellDone,
      description: `${uiText.score}: ${evalOut.score}%`,
      status: "success",
      duration: 2200,
    });

    setTimeout(() => {
      const isLast =
        currentSentenceIndex >= (storyData?.sentences?.length || 0) - 1;

      if (!isLast) {
        setCurrentSentenceIndex((p) => p + 1);
      } else {
        const totalSessionXp = sessionXp + delta;
        finalizePracticeSession(totalSessionXp).finally(() => {
          toast({
            title: uiLang === "es" ? "¡Felicidades!" : "Congrats!",
            description:
              uiLang === "es"
                ? `¡Completaste el juego de roles! Ganaste ${totalSessionXp} ${uiText.xp} en esta sesión.`
                : `Role play completed! You earned ${totalSessionXp} ${uiText.xp} this session.`,
            status: "success",
            duration: 3000,
          });
          setShowFullStory(true);
          setCurrentSentenceIndex(0);
        });
      }
      setIsRecording(false);
    }, 800);
  };

  /* ----------------------------- Mount / Cleanup ----------------------------- */
  useEffect(() => {
    if (storyCacheRef.current) setStoryData(storyCacheRef.current);
  }, []);

  useEffect(() => {
    const cleanup = () => {
      stopAllAudio();
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (audioRef.current) clearInterval(audioRef.current);
      try {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        )
          mediaRecorderRef.current.stop();
      } catch {}
      setIsRecording(false);
      audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      audioCacheRef.current.clear();
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

  if (showPasscodeModal) {
    return (
      <PasscodePage
        userLanguage={user.appLanguage}
        setShowPasscodeModal={setShowPasscodeModal}
      />
    );
  }

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
          <VStack spacing={5} w="100%" px={6} maxW="lg">
            <Text color="white" fontSize="2xl" fontWeight="700">
              {uiText.header}
            </Text>
            <Text color="#94a3b8" textAlign="center">
              {uiText.noStory}
            </Text>
            <Box
              as="form"
              onSubmit={handleRoleSubmit}
              w="100%"
              bg="rgba(15, 23, 42, 0.35)"
              borderRadius="lg"
              p={4}
            >
              <VStack align="stretch" spacing={3}>
                <Text fontSize="sm" color="#cbd5f5">
                  {uiText.rolePrompt}
                </Text>
                <Input
                  ref={roleInputRef}
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  placeholder={uiText.rolePlaceholder}
                  bg="rgba(15, 23, 42, 0.6)"
                  color="white"
                  _placeholder={{ color: "rgba(148, 163, 184, 0.7)" }}
                  isDisabled={isLoading}
                />
                <Button
                  type="submit"
                  size="lg"
                  px={6}
                  leftIcon={<FaWandMagicSparkles />}
                  colorScheme="teal"
                  isLoading={isLoading}
                >
                  {uiText.startRole}
                </Button>
              </VStack>
            </Box>
            {isLoading && <Spinner color="teal.200" />}
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
            <Box
              as={isEditingRole ? "form" : "div"}
              onSubmit={isEditingRole ? handleRoleSubmit : undefined}
            >
              {isEditingRole ? (
                <HStack
                  spacing={2}
                  alignItems="center"
                  justify="flex-end"
                  // flexWrap="wrap"
                >
                  <Input
                    ref={roleInputRef}
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    placeholder={uiText.rolePlaceholder}
                    size="sm"
                    bg="rgba(15, 23, 42, 0.6)"
                    color="white"
                    // maxW={{ base: "200px", md: "240px" }}
                    _placeholder={{ color: "rgba(148, 163, 184, 0.7)" }}
                    isDisabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    // leftIcon={<FaWandMagicSparkles />}
                    colorScheme="teal"
                    isLoading={isLoading}
                    pl={8}
                    pr={8}
                  >
                    {activeRole ? uiText.updateRole : uiText.startRole}
                  </Button>
                  {activeRole && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      colorScheme="teal"
                      onClick={() => {
                        setRoleInput(activeRole);
                        setIsEditingRole(false);
                      }}
                    >
                      {uiText.cancelEdit}
                    </Button>
                  )}
                </HStack>
              ) : (
                <HStack spacing={2} alignItems="center" flexWrap="wrap">
                  {activeRole && (
                    <Tag
                      size="lg"
                      borderRadius="full"
                      bg="rgba(20, 184, 166, 0.16)"
                      color="teal.50"
                      border="1px solid rgba(45, 212, 191, 0.35)"
                      px={3}
                      py={1}
                      maxW={{ base: "100%", sm: "260px" }}
                      cursor="pointer"
                      onClick={() => setIsEditingRole(true)}
                    >
                      <TagLabel
                        fontWeight="600"
                        fontSize="sm"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        maxW="100%"
                      >
                        {activeRole}
                      </TagLabel>
                    </Tag>
                  )}
                  <IconButton
                    type="button"
                    size="sm"
                    leftIcon={<FaPen fontSizesize="sm" />}
                    textAlign={"center"}
                    pl="2"
                    colorScheme="teal"
                    variant="outline"
                    onClick={() => setIsEditingRole(true)}
                  />
                  {/* {uiText.editRole} */}
                </HStack>
              )}
            </Box>
          </HStack>
        </HStack>
      </motion.div>

      {/* Shared Level/XP card */}
      <Box px={4} pt={4}>
        <Box p={3} rounded="2xl">
          <Box display="flex" justifyContent={"center"}>
            <HStack justify="space-between" mb={1} width="50%">
              <Badge colorScheme="cyan" variant="subtle" fontSize="10px">
                {uiText.levelLabel} {levelNumber}
              </Badge>
              <Badge colorScheme="teal" variant="subtle" fontSize="10px">
                {uiText.xp} {xp}
              </Badge>
            </HStack>
          </Box>
          <Box display="flex" justifyContent={"center"}>
            <Box width="50%">
              <WaveBar value={progressPct} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Progress */}
      <Box px={4} py={3}>
        <VStack spacing={2}>
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
            h="8px"
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
      <Box px={4} py={6}>
        <motion.div
          key={
            showFullStory ? "full-story" : `sentence-${currentSentenceIndex}`
          }
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? {} : { duration: 0.5 }}
        >
          <VStack spacing={6} align="stretch">
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
                      isLoading={isPlayingTarget || isAutoPlaying}
                      loadingText={uiText.playing}
                      leftIcon={<FaVolumeUp />}
                      color="white"
                    >
                      {isAutoPlaying
                        ? uiText.playing
                        : uiText.playTarget(targetName)}
                    </Button>
                    {!!storyData.fullStory?.sup && (
                      <Button
                        onClick={() => playSupportTTS(storyData.fullStory?.sup)}
                        isLoading={isPlayingSupport}
                        loadingText={uiText.playing}
                        leftIcon={<FaVolumeUp />}
                        variant="outline"
                        borderColor="rgba(255, 255, 255, 0.3)"
                        color="white"
                      >
                        {supportName}
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
                        setPassedCount(0);
                        setHighlightedWordIndex(-1);
                        setIsRecording(false);
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
                      <Button
                        onClick={() => {
                          if (isRecording) return stopRecording();
                          return startRecording();
                        }}
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
                    </Center>
                    <HStack spacing={3} justify="center">
                      <Button
                        onClick={() => playTargetTTS(currentSentence?.tgt)}
                        leftIcon={<FaVolumeUp />}
                        variant="outline"
                        borderColor="rgba(255, 255, 255, 0.3)"
                        color="white"
                        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                        size="sm"
                      >
                        {uiText.listen}
                      </Button>
                      <Button
                        onClick={() => {
                          if (
                            currentSentenceIndex <
                            storyData.sentences.length - 1
                          ) {
                            setCurrentSentenceIndex((p) => p + 1);
                          } else {
                            // Last sentence — finish session and award accumulated XP once
                            finalizePracticeSession(sessionXp).finally(() => {
                              toast({
                                title:
                                  uiLang === "es"
                                    ? "¡Felicidades!"
                                    : "Congrats!",
                                description:
                                  uiLang === "es"
                                    ? `¡Completaste el juego de roles! Ganaste ${sessionXp} ${uiText.xp} en esta sesión.`
                                    : `Role play completed! You earned ${sessionXp} ${uiText.xp} this session.`,
                                status: "success",
                                duration: 3000,
                              });
                              setShowFullStory(true);
                              setCurrentSentenceIndex(0);
                            });
                          }
                        }}
                        variant="outline"
                        borderColor="rgba(255, 255, 255, 0.3)"
                        color="white"
                        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                        size="sm"
                      >
                        {currentSentenceIndex < storyData.sentences.length - 1
                          ? uiText.skip
                          : uiText.finish}
                      </Button>
                    </HStack>
                  </VStack>
                </VStack>
              )}
            </Box>
          </VStack>
        </motion.div>
      </Box>
    </Box>
  );
}
