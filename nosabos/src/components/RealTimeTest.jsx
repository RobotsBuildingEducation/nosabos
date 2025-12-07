// components/RealtimeAgent.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useToast,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { PiMicrophoneStageDuotone } from "react-icons/pi";
import { FaStop, FaPlay } from "react-icons/fa";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { database, analytics } from "../firebaseResources/firebaseResources";
import { logEvent } from "firebase/analytics";

import useUserStore from "../hooks/useUserStore";
import RobotBuddyPro from "./RobotBuddyPro";
import { translations } from "../utils/translation";
import { WaveBar } from "./WaveBar";
import { awardXp } from "../utils/utils";
import { getLanguageXp } from "../utils/progressTracking";
import { DEFAULT_TTS_VOICE, getRandomVoice } from "../utils/tts";
import { extractCEFRLevel, getCEFRPromptHint } from "../utils/cefrUtils";

const REALTIME_MODEL =
  (import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";

const REALTIME_URL = `${
  import.meta.env.VITE_REALTIME_URL
}?model=gpt-realtime-mini/exchangeRealtimeSDP?model=${encodeURIComponent(
  REALTIME_MODEL
)}`;

const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const TRANSLATE_MODEL =
  import.meta.env.VITE_OPENAI_TRANSLATE_MODEL || "gpt-4o-mini";

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
const isoNow = () => {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
};

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
        { merge: true }
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

function splitByDelimiters(text) {
  if (!text) return [];
  const raw = String(text)
    .split(/[,;·•]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return raw.length ? raw : [String(text).trim()];
}

function tidyPairs(rawPairs) {
  if (!Array.isArray(rawPairs)) return [];
  const results = [];

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
          if (segment && translated) {
            results.push({ lhs: segment, rhs: translated });
          }
        });
        return;
      }
    }

    results.push({ lhs, rhs });
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
      style={{ display: "inline", boxShadow: "inset 0 -2px transparent" }}
    >
      {mid}
    </span>,
    ...wrapFirst(after, phrase, tokenId + "_cont"),
  ];
}
function buildAlignedNodes(text, pairs, side /* 'lhs' | 'rhs' */) {
  if (!pairs?.length || !text) return [text];
  const sorted = [...pairs].sort(
    (a, b) => (b?.[side]?.length || 0) - (a?.[side]?.length || 0)
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
  primaryLabel,
  secondaryLabel,
  primaryText,
  secondaryText,
  pairs,
  showSecondary,
  isTranslating,
  canReplay,
  onReplay,
  isReplaying,
  replayLabel,
}) {
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
  const primaryNodes = decorate(buildAlignedNodes(primaryText, pairs, "lhs"));
  const secondaryNodes = decorate(
    buildAlignedNodes(secondaryText, pairs, "rhs")
  );

  return (
    <Box
      bg="gray.700"
      p={3}
      rounded="2xl"
      border="1px solid rgba(255,255,255,0.06)"
      maxW="100%"
      borderBottomLeftRadius="0px"
    >
      <HStack justify="space-between" mb={1}>
        <Badge variant="subtle">{primaryLabel}</Badge>
        <HStack>
          {canReplay && (
            <Button
              size="xs"
              variant="ghost"
              colorScheme="cyan"
              leftIcon={<FaPlay />}
              onClick={onReplay}
              isLoading={isReplaying}
              loadingText={replayLabel || "Replay"}
            >
              {replayLabel || "Replay"}
            </Button>
          )}
          {showSecondary && !!secondaryText && (
            <Badge variant="outline">{secondaryLabel}</Badge>
          )}
          {showSecondary && isTranslating && (
            <Spinner size="xs" thickness="2px" speed="0.5s" />
          )}
        </HStack>
      </HStack>

      <Box as="p" fontSize="md" lineHeight="1.6" sx={MOBILE_TEXT_SX}>
        {primaryNodes}
      </Box>

      {showSecondary && !!secondaryText && (
        <Box
          as="p"
          fontSize="sm"
          mt={1}
          lineHeight="1.55"
          sx={MOBILE_TEXT_SX}
          transition="opacity 120ms ease-out"
          opacity={1}
        >
          {secondaryNodes}
        </Box>
      )}

      {!!pairs?.length && showSecondary && (
        <Wrap spacing={3} mt={3} shouldWrapChildren>
          {pairs.slice(0, 8).map((p, i) => {
            const color = colorFor(i);
            return (
              <WrapItem key={`${p.lhs}-${p.rhs}-${i}`} maxW="100%">
                <Box
                  px={3}
                  py={2.5}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={hexToRgba(color, 0.6)}
                  background="#0b1220"
                  boxShadow={`0 6px 18px ${hexToRgba(color, 0.12)}`}
                  color="whiteAlpha.900"
                  minW="0"
                  maxW="260px"
                >
                  <Text fontSize="sm" fontWeight="semibold" lineHeight="1.4">
                    {p.lhs}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="whiteAlpha.800"
                    mt={1}
                    lineHeight="1.35"
                  >
                    {p.rhs}
                  </Text>
                </Box>
              </WrapItem>
            );
          })}
        </Wrap>
      )}
    </Box>
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
function UserBubble({ label, text }) {
  return (
    <Box
      bg="blue.500"
      color="white"
      p={3}
      rounded="lg"
      boxShadow="0 6px 20px rgba(0,0,0,0.25)"
      border="1px solid rgba(255,255,255,0.08)"
    >
      <HStack justify="space-between" mb={1}>
        <Badge variant="solid" colorScheme="blackAlpha" bg="blackAlpha.600">
          {label}
        </Badge>
      </HStack>
      <Box as="p" fontSize="md" lineHeight="1.6" sx={MOBILE_TEXT_SX}>
        {text}
      </Box>
    </Box>
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

/* ---------------------------
   Component
--------------------------- */
export default function RealTimeTest({
  auth,
  activeNpub = "",
  activeNsec = "",
  onSwitchedAccount,
  lesson = null,
  lessonContent = null,
  onSkip = null,
}) {
  const toast = useToast();
  const aliveRef = useRef(false);

  // Lesson content ref
  const lessonContentRef = useRef(lessonContent);
  useEffect(() => {
    lessonContentRef.current = lessonContent;
  }, [lessonContent]);

  // Full lesson prop ref (for AI goal generation)
  const lessonPropRef = useRef(lesson);
  useEffect(() => {
    lessonPropRef.current = lesson;
  }, [lesson]);

  // Scroll to top when component mounts or lesson changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [lesson?.id]);

  // User id
  const user = useUserStore((s) => s.user);
  const currentNpub = activeNpub?.trim?.() || strongNpub(user);

  // Extract CEFR level from lesson
  const cefrLevel = lesson?.id ? extractCEFRLevel(lesson.id) : "A1";

  // Refs for realtime
  const audioRef = useRef(null); // remote stream sink
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
  const replayAudioRef = useRef(null);

  // Guardrails
  const guardrailItemIdsRef = useRef([]);
  const pendingGuardrailTextRef = useRef("");

  // Idle gating
  const isIdleRef = useRef(true);
  const idleWaitersRef = useRef([]);

  // Connection/UI state
  const [status, setStatus] = useState("disconnected");
  const [err, setErr] = useState("");
  const [uiState, setUiState] = useState("idle");
  const [volume] = useState(0);
  const [mood, setMood] = useState("neutral");
  const [pauseMs, setPauseMs] = useState(2000);
  const [replayingId, setReplayingId] = useState(null);

  // Learning prefs (now controlled globally; we still mirror them locally)
  const [level, setLevel] = useState("beginner");
  const [supportLang, setSupportLang] = useState("en");
  const [voice, setVoice] = useState("alloy");
  const [voicePersona, setVoicePersona] = useState(
    translations.en.onboarding_persona_default_example
  );
  const [targetLang, setTargetLang] = useState("es");
  const [showTranslations, setShowTranslations] = useState(true);
  const [practicePronunciation, setPracticePronunciation] = useState(
    !!user?.progress?.practicePronunciation
  );

  // live refs
  const voiceRef = useRef(voice);
  const voicePersonaRef = useRef(voicePersona);
  const levelRef = useRef(level);
  const supportLangRef = useRef(supportLang);
  const targetLangRef = useRef(targetLang);
  const pauseMsRef = useRef(pauseMs);
  const practicePronunciationRef = useRef(practicePronunciation);
  const cefrLevelRef = useRef(cefrLevel);

  // hydrate refs on changes
  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);
  useEffect(() => {
    voicePersonaRef.current = voicePersona;
  }, [voicePersona]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    supportLangRef.current = supportLang;
  }, [supportLang]);
  useEffect(() => {
    targetLangRef.current = targetLang;
  }, [targetLang]);
  useEffect(() => {
    pauseMsRef.current = pauseMs;
  }, [pauseMs]);
  useEffect(() => {
    practicePronunciationRef.current = practicePronunciation;
  }, [practicePronunciation]);
  useEffect(() => {
    cefrLevelRef.current = cefrLevel;
  }, [cefrLevel]);

  // ✅ helpRequest (global)
  const initialHelpRequest = (
    user?.progress?.helpRequest ??
    user?.helpRequest ??
    ""
  ).trim();
  const [helpRequest, setHelpRequest] = useState(initialHelpRequest);
  const helpRequestRef = useRef(helpRequest);
  useEffect(() => {
    helpRequestRef.current = helpRequest;
  }, [helpRequest]);

  // 🎯 Goal engine state
  const [currentGoal, setCurrentGoal] = useState(null);
  const goalRef = useRef(null);
  const [goalFeedback, setGoalFeedback] = useState("");
  const goalBusyRef = useRef(false);
  const [goalCompleted, setGoalCompleted] = useState(false); // Track when goal is completed but not advanced
  const goalXpAwardedRef = useRef(false);

  // Track when XP has been granted for the active goal to avoid duplicates
  const lastGoalIdRef = useRef(null);
  useEffect(() => {
    const gid = currentGoal?.id || null;
    if (gid && gid !== lastGoalIdRef.current) {
      goalXpAwardedRef.current = false;
      setGoalCompleted(false);
      lastGoalIdRef.current = gid;
    }
  }, [currentGoal]);

  // XP/STREAK
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  // Persisted history (newest-first)
  const [history, setHistory] = useState([]);

  // Hydration gating for profile persistence
  const [hydrated, setHydrated] = useState(false);

  // UI strings (app UI)
  const uiLang =
    (user?.appLanguage || localStorage.getItem("appLanguage")) === "es"
      ? "es"
      : "en";
  const ui = translations[uiLang];

  // ✅ Which language to show in secondary lane
  const secondaryPref =
    targetLang === "en" ? "es" : supportLang === "es" ? "es" : "en";
  const toggleLabel =
    translations[uiLang].onboarding_translations_toggle?.replace(
      "{language}",
      translations[uiLang][`language_${secondaryPref}`]
    ) || (uiLang === "es" ? "Mostrar traducción" : "Show translation");

  /* ---------------------------
     Replay playback helpers
  --------------------------- */
  function stopReplayAudio() {
    try {
      replayAudioRef.current?.pause();
    } catch {}
    if (replayAudioRef.current?.src) {
      try {
        URL.revokeObjectURL(replayAudioRef.current.src);
      } catch {}
    }
    replayAudioRef.current = null;
  }
  async function playSavedClip(mid) {
    if (!mid) return;
    stopReplayAudio();
    setReplayingId(mid);
    try {
      const clip = await idbGetClip(mid);
      if (!clip?.blob) throw new Error("missing");
      audioCacheIndexRef.current.add(mid);
      const url = URL.createObjectURL(clip.blob);
      const audio = new Audio(url);
      replayAudioRef.current = audio;
      audio.onended = () => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
        setReplayingId((cur) => (cur === mid ? null : cur));
      };
      audio.onerror = () => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
        setReplayingId((cur) => (cur === mid ? null : cur));
      };
      await audio.play();
    } catch (e) {
      setReplayingId((cur) => (cur === mid ? null : cur));
      toast({
        status: "warning",
        description:
          uiLang === "es"
            ? "No hay audio para reproducir."
            : "No audio available to replay.",
        duration: 3000,
        position: "top",
      });
    }
  }

  const languageNameFor = (code) =>
    translations[uiLang][`language_${code === "nah" ? "nah" : code}`];

  const levelLabel = translations[uiLang][`onboarding_level_${level}`] || level;
  const levelColor =
    level === "beginner"
      ? "green"
      : level === "intermediate"
      ? "orange"
      : "purple";
  const progressPct = Math.min(100, xp % 100);
  const appTitle = ui.ra_title.replace(
    "{language}",
    languageNameFor(targetLang)
  );
  // Goal-UI language routing
  const goalUiLang = (() => {
    const s = supportLangRef.current || supportLang;
    if (s === "es") return "es";
    if (s === "en") return "en";
    const t = targetLangRef.current || targetLang;
    if (t === "es") return "es";
    if (t === "en") return "en";
    return uiLang === "es" ? "es" : "en";
  })();
  const gtr = translations[goalUiLang] || translations.en;
  const tGoalLabel =
    translations[goalUiLang]?.ra_goal_label ||
    (goalUiLang === "es" ? "Meta" : "Goal");
  const tGoalCompletedToast =
    gtr?.ra_goal_completed ||
    (goalUiLang === "es" ? "¡Meta lograda!" : "Goal completed!");
  const tGoalSkip =
    gtr?.ra_goal_skip || (goalUiLang === "es" ? "Saltar" : "Skip");
  const tGoalCriteria =
    gtr?.ra_goal_criteria || (goalUiLang === "es" ? "Éxito:" : "Success:");

  const xpLevelNumber = Math.floor(xp / 100) + 1;

  useEffect(() => () => stop(), []);

  useEffect(
    () => () => {
      stopReplayAudio();
    },
    []
  );

  // Keep local_npub cached
  useEffect(() => {
    if (currentNpub) localStorage.setItem("local_npub", currentNpub);
  }, [currentNpub]);

  /* ---------------------------
     Load profile + seed goal (fresh conversation each render)
  --------------------------- */
  useEffect(() => {
    if (!currentNpub) return;
    setHydrated(false);
    setHistory([]);
    (async () => {
      try {
        const ok = await ensureUserDoc(currentNpub);
        if (!ok) return;
        const ref = doc(database, "users", currentNpub);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() || {};
          const currentLang = targetLangRef.current || targetLang;
          const languageXp = getLanguageXp(data?.progress || {}, currentLang);
          if (Number.isFinite(languageXp)) setXp(languageXp);
          if (Number.isFinite(data?.streak)) setStreak(data.streak);
          const p = data?.progress || {};
          // Prime all local states from saved progress
          primeRefsFromPrefs(p);
          // helpRequest
          const hr = (p.helpRequest ?? data.helpRequest ?? "").trim();
          if (hr && hr !== helpRequestRef.current) setHelpRequest(hr);

          // 🎯 goal
          const goal = await ensureCurrentGoalSeed(currentNpub, data);
          setCurrentGoal(goal);
          goalRef.current = goal;
          scheduleSessionUpdate();
        }
      } catch (e) {
        console.warn("Load profile failed:", e?.message || e);
      } finally {
        setHydrated(true);
      }
    })();
  }, [activeNpub]);

  // ✅ react to store changes (global settings changed elsewhere)
  useEffect(() => {
    const p = user?.progress;
    if (!p) return;
    primeRefsFromPrefs(p);
    scheduleSessionUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.progress]);

  // ✅ react to top-bar broadcast immediately
  useEffect(() => {
    function onGlobal(e) {
      const next = e?.detail || {};
      primeRefsFromPrefs(next);
      scheduleSessionUpdate();
    }
    window.addEventListener("app:globalSettingsUpdated", onGlobal);
    return () =>
      window.removeEventListener("app:globalSettingsUpdated", onGlobal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------
     Instant-apply settings when our local mirrors change
  --------------------------- */
  useEffect(() => {
    scheduleSessionUpdate();
    if (!hydrated) return;
    scheduleProfileSave();
  }, [
    voicePersona,
    supportLang,
    showTranslations,
    level,
    pauseMs,
    helpRequest,
    practicePronunciation,
    currentGoal?.title_en,
    hydrated,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    scheduleProfileSave();
    if (dcRef.current?.readyState === "open") {
      applyVoiceNow({ speakProbe: true });
    }
  }, [voice, hydrated]);

  useEffect(() => {
    applyLanguagePolicyNow();
    if (!hydrated) return;
    scheduleProfileSave();
  }, [targetLang, hydrated]);

  // Keep XP in sync with the active practice language
  useEffect(() => {
    if (!hydrated) return;
    const langXp = getLanguageXp(user?.progress || {}, targetLangRef.current);
    if (Number.isFinite(langXp)) {
      setXp(langXp);
    }
  }, [hydrated, targetLang, user?.progress]);

  const DEBOUNCE_MS = 350;
  const respToMsg = useRef(new Map());
  const translateTimers = useRef(new Map());
  const sessionUpdateTimer = useRef(null);
  const profileSaveTimer = useRef(null);
  const lastUserSaveRef = useRef({ text: "", ts: 0 });
  const lastTranscriptRef = useRef({ text: "", ts: 0 });

  const streamBuffersRef = useRef(new Map());
  const streamFlushTimerRef = useRef(null);
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

  /* ---------------------------
     Helpers for priming prefs
  --------------------------- */
  function normalizeSupport(code) {
    return ["en", "es", "bilingual"].includes(code) ? code : "en";
  }
  function primeRefsFromPrefs(p = {}) {
    if (p.level) {
      levelRef.current = p.level;
      setLevel(p.level);
    }
    if (p.supportLang) {
      const v = normalizeSupport(p.supportLang);
      supportLangRef.current = v;
      setSupportLang(v);
    }
    if (p.voice) {
      voiceRef.current = p.voice;
      setVoice(p.voice);
    }
    if (typeof p.voicePersona === "string") {
      voicePersonaRef.current = p.voicePersona;
      setVoicePersona(p.voicePersona);
    }
    if (["nah", "es", "pt", "en", "fr", "it"].includes(p.targetLang)) {
      targetLangRef.current = p.targetLang;
      setTargetLang(p.targetLang);
    }
    if (typeof p.showTranslations === "boolean") {
      setShowTranslations(p.showTranslations);
    }
    if (typeof p.practicePronunciation === "boolean") {
      practicePronunciationRef.current = p.practicePronunciation;
      setPracticePronunciation(p.practicePronunciation);
    }
    if (typeof p.helpRequest === "string") {
      helpRequestRef.current = p.helpRequest;
      setHelpRequest(p.helpRequest);
    }
    if (Number.isFinite(p.pauseMs)) {
      pauseMsRef.current = p.pauseMs;
      setPauseMs(p.pauseMs);
    }
  }

  /* ---------------------------
     Connect / Disconnect
  --------------------------- */
  function waitUntilIdle(timeoutMs = 2000) {
    if (isIdleRef.current) return Promise.resolve();
    return new Promise((resolve) => {
      idleWaitersRef.current.push(resolve);
      setTimeout(resolve, timeoutMs);
    });
  }
  function safeCancelActiveResponse() {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    if (isIdleRef.current) return;
    try {
      dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
    } catch {}
  }
  async function start() {
    setErr("");
    setMessages([]);
    respToMsg.current.clear();
    guardrailItemIdsRef.current = [];
    pendingGuardrailTextRef.current = "";
    clearAllDebouncers();
    setStatus("connecting");
    setUiState("idle");
    try {
      const npub = strongNpub(user);
      if (npub) await ensureUserDoc(npub);

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
        if (!audioGraphReadyRef.current) {
          try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            const ctx = new Ctx();
            const srcNode = ctx.createMediaStreamSource(remote);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.15;
            const dest = ctx.createMediaStreamDestination();
            srcNode.connect(analyser);
            srcNode.connect(dest);
            audioCtxRef.current = ctx;
            analyserRef.current = analyser;
            floatBufRef.current = new Float32Array(analyser.fftSize);
            captureOutRef.current = dest.stream;
            audioGraphReadyRef.current = true;
          } catch (e) {
            console.warn(
              "AudioContext init (ontrack) failed:",
              e?.message || e
            );
          }
        }
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

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      // 🛡️ Set session when DC opens
      dc.onopen = async () => {
        let savedPrefs = null;
        try {
          const npub = strongNpub(user);
          if (npub) {
            const snap = await getDoc(doc(database, "users", npub));
            savedPrefs = snap.exists() ? snap.data()?.progress || null : null;
          }
        } catch {}
        if (savedPrefs) primeRefsFromPrefs(savedPrefs);

        // Use saved voice if available, otherwise pick a random one for the session
        const voiceName =
          voiceRef.current && voiceRef.current !== "alloy"
            ? voiceRef.current
            : getRandomVoice();
        voiceRef.current = voiceName;
        setVoice(voiceName);
        const instructions = buildLanguageInstructions(savedPrefs || undefined);
        const vadMs = pauseMsRef.current || 2000;
        const tLang = savedPrefs?.targetLang || targetLangRef.current || "es";
        const sttLang =
          tLang === "es" ? "es" : tLang === "en" ? "en" : undefined;

        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              instructions,
              modalities: ["audio", "text"],
              voice: voiceName,
              turn_detection: {
                type: "server_vad",
                silence_duration_ms: vadMs,
                threshold: 0.35,
                prefix_padding_ms: 120,
              },
              input_audio_transcription: sttLang
                ? { model: "whisper-1", language: sttLang }
                : { model: "whisper-1" },
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

        setTimeout(() => applyLanguagePolicyNow(), 60);
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

  async function stop() {
    aliveRef.current = false;
    try {
      if (dcRef.current?.readyState === "open") {
        safeCancelActiveResponse();
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

    stopReplayAudio();
    setReplayingId(null);

    clearAllDebouncers();
    respToMsg.current.clear();
    guardrailItemIdsRef.current = [];
    pendingGuardrailTextRef.current = "";
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
     🎯 Goal helpers
  --------------------------- */

  /**
   * Auto-generate a contextual prompt using AI based on lesson context
   * This creates meaningful goals when hardcoded ones don't make sense
   */
  async function generateGoalFromAI(lessonData, lessonContentData) {
    const topic =
      lessonContentData?.topic ||
      lessonData?.content?.vocabulary?.topic ||
      lessonData?.title?.en ||
      "conversation practice";
    const focusPoints =
      lessonContentData?.focusPoints ||
      lessonData?.content?.vocabulary?.focusPoints ||
      [];
    const lessonTitle = lessonData?.title?.en || "";
    const lessonDesc = lessonData?.description?.en || "";
    const cefrLvl = lessonData?.id ? extractCEFRLevel(lessonData.id) : "A1";
    const cefrHint = getCEFRPromptHint(cefrLvl);

    const prompt = `You are creating a conversational practice goal for a language learner.

Lesson: ${lessonTitle}
Description: ${lessonDesc}
Topic: ${topic}
Focus areas: ${focusPoints.join(", ") || "general practice"}
Level: ${cefrHint}

Generate a short, clear, actionable conversation goal that makes sense for this lesson.
The goal should be something the learner can demonstrate in a brief voice conversation.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"scenario":"[2-6 word task title]","prompt":"[1-2 sentence roleplay instruction for AI tutor]","successCriteria":"[what the learner must do to succeed]"}`;

    try {
      const r = await fetch(RESPONSES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: TRANSLATE_MODEL,
          text: { format: { type: "text" } },
          input: prompt,
        }),
      });
      const ct = r.headers.get("content-type") || "";
      const payload = ct.includes("application/json")
        ? await r.json()
        : await r.text();
      const text =
        (typeof payload?.output_text === "string" && payload.output_text) ||
        (Array.isArray(payload?.output) &&
          payload.output
            .map((it) =>
              (it?.content || []).map((seg) => seg?.text || "").join("")
            )
            .join(" ")
            .trim()) ||
        (typeof payload === "string" ? payload : "");

      const parsed = safeParseJson(text);
      if (parsed?.scenario && parsed?.prompt) {
        return {
          scenario: parsed.scenario,
          prompt: parsed.prompt,
          successCriteria:
            parsed.successCriteria || `Complete the ${topic} task`,
        };
      }
    } catch (err) {
      console.warn("AI goal generation failed:", err?.message || err);
    }

    // Fallback if AI fails
    return {
      scenario: `Practice ${topic}`,
      prompt: `Have a conversation about ${topic}. ${
        focusPoints.length
          ? `Focus on: ${focusPoints.slice(0, 2).join(", ")}.`
          : ""
      }`,
      successCriteria: `User demonstrates understanding of ${topic}`,
    };
  }

  function goalTitlesSeed() {
    return {
      en:
        translations.en.onboarding_challenge_default ||
        "Make a polite request.",
      es:
        translations.es.onboarding_challenge_default ||
        "Haz una petición cortés.",
    };
  }
  async function ensureCurrentGoalSeed(npub, userData) {
    const ref = doc(database, "users", npub);
    const data = userData || (await getDoc(ref)).data() || {};

    // Check if lesson content provides a specific goal/scenario
    const lesson = lessonContentRef.current;
    const lessonScenario = lesson?.scenario || lesson?.prompt;
    const goalVariations = lesson?.goalVariations || [];
    const hasVariations = goalVariations.length > 0;

    // Check for existing goal that matches current lesson
    if (
      data.currentGoal &&
      data.currentGoal.title_en &&
      data.currentGoal.title_es &&
      (!lessonScenario || data.currentGoal.lessonScenario === lessonScenario)
    ) {
      goalXpAwardedRef.current = false;
      return { ...data.currentGoal, attempts: data.currentGoal.attempts || 0 };
    }

    // Get goal index for variation progression
    // Check how many times this lesson's goals have been completed
    const lessonGoalCount = data.lessonGoalCounts?.[lessonScenario] || 0;
    const goalIndex = hasVariations
      ? lessonGoalCount % goalVariations.length
      : 0;

    // Select the appropriate goal variation or use base content
    let activeGoal;
    if (hasVariations && goalVariations[goalIndex]) {
      activeGoal = goalVariations[goalIndex];
    } else {
      activeGoal = {
        scenario: lessonScenario,
        successCriteria: lesson?.successCriteria,
      };
    }

    let scenario = activeGoal.scenario || lessonScenario;
    let successCriteria = activeGoal.successCriteria || lesson?.successCriteria;
    let roleplayPrompt = activeGoal.prompt || lesson?.prompt || "";

    // Check if scenario is too generic or missing - use AI to generate a better one
    const isGenericScenario =
      !scenario ||
      scenario.length < 10 ||
      /^(practice|conversation|talk|speak)/i.test(scenario.trim());

    if (isGenericScenario) {
      // Use AI to generate a contextual goal based on full lesson data (passed as prop)
      const aiGoal = await generateGoalFromAI(lessonPropRef.current, lesson);
      scenario = aiGoal.scenario;
      successCriteria = aiGoal.successCriteria;
      roleplayPrompt = aiGoal.prompt;
    }

    // Generate goal based on lesson content or use default
    const seedTitles = goalTitlesSeed();

    // Build clear rubric from success criteria or generate one
    let rubricEn, rubricEs;
    if (successCriteria) {
      rubricEn = `Success: ${successCriteria}`;
      rubricEs = `Éxito: ${successCriteria}`;
    } else if (scenario) {
      // Create actionable rubric from scenario
      rubricEn = `Complete this task: ${scenario}`;
      rubricEs = `Completa esta tarea: ${scenario}`;
    } else {
      rubricEn = "Say a greeting in the target language";
      rubricEs = "Di un saludo en el idioma meta";
    }

    // Localize goal strings when Spanish support is requested
    let localizedScenarioEs = activeGoal.scenario_es || scenario || seedTitles.es;
    let localizedRubricEs = activeGoal.successCriteria_es || rubricEs;
    const prefersSpanishSupport = (supportLangRef.current || supportLang) === "es";
    if (prefersSpanishSupport) {
      try {
        if (!activeGoal.scenario_es && scenario) {
          localizedScenarioEs = await translateGoalText(scenario, "es");
        }
        if (!activeGoal.successCriteria_es && rubricEs) {
          localizedRubricEs = await translateGoalText(rubricEs, "es");
        }
      } catch (err) {
        console.warn("Falling back to default goal Spanish", err?.message || err);
      }
    }

    const seed = {
      id: `goal_${Date.now()}`,
      title_en: scenario || seedTitles.en,
      title_es: localizedScenarioEs,
      rubric_en: rubricEn,
      rubric_es: localizedRubricEs,
      lessonScenario: lessonScenario || null,
      successCriteria: successCriteria || null,
      roleplayPrompt: roleplayPrompt || null,
      goalIndex: goalIndex,
      hasVariations: hasVariations,
      attempts: 0,
      status: "active",
      createdAt: isoNow(),
      updatedAt: isoNow(),
    };
    await setDoc(
      ref,
      { currentGoal: seed, lastGoal: seed.title_en },
      { merge: true }
    );
    goalXpAwardedRef.current = false;
    return seed;
  }

  function goalUiLangCode() {
    const s = supportLangRef.current || supportLang;
    if (s === "es") return "es";
    if (s === "en") return "en";
    const t = targetLangRef.current || targetLang;
    if (t === "es") return "es";
    if (t === "en") return "en";
    return uiLang === "es" ? "es" : "en";
  }
  function goalTitleForUI(goal) {
    if (!goal) return "";
    const gLang = goalUiLangCode();
    return gLang === "es"
      ? goal.title_es || goal.scenario_es || goal.title_en || ""
      : goal.title_en || goal.title_es || goal.scenario || "";
  }
  function goalRubricForUI(goal) {
    if (!goal) return "";
    const gLang = goalUiLangCode();
    return gLang === "es"
      ? goal.rubric_es || goal.successCriteria_es || goal.rubric_en || ""
      : goal.rubric_en || goal.rubric_es || goal.successCriteria || "";
  }
  function goalTitleForTarget(goal) {
    if (!goal) return "";
    const t = targetLangRef.current;
    if (t === "es") return goal.title_es || goal.title_en;
    if (t === "en") return goal.title_en || goal.title_es;
    return "";
  }
  function goalRubricForTarget(goal) {
    if (!goal) return "";
    return targetLangRef.current === "en"
      ? goal.rubric_es || ""
      : goal.rubric_en || "";
  }

  async function translateGoalText(text, target = "es") {
    const trimmed = String(text || "").trim();
    if (!trimmed) return "";

    const prompt =
      target === "es"
        ? `Traduce al español neutral y conciso. Devuelve solo JSON {"translation":"..."}.\n${trimmed}`
        : `Translate to natural US English. Return only JSON {"translation":"..."}.\n${trimmed}`;

    try {
      const r = await fetch(RESPONSES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: TRANSLATE_MODEL,
          text: { format: { type: "text" } },
          input: prompt,
        }),
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

      const merged =
        (typeof payload?.output_text === "string" && payload.output_text) ||
        (Array.isArray(payload?.output) &&
          payload.output
            .map((it) =>
              (it?.content || []).map((seg) => seg?.text || "").join("")
            )
            .join(" ")
            .trim()) ||
        (Array.isArray(payload?.content) && payload.content[0]?.text) ||
        (Array.isArray(payload?.choices) &&
          (payload.choices[0]?.message?.content || "")) ||
        "";

      const parsed = safeParseJson(merged);
      return (parsed?.translation || merged || trimmed).trim();
    } catch (err) {
      console.warn("Goal translation failed", err?.message || err);
      return trimmed;
    }
  }

  async function persistCurrentGoal(next) {
    const npub = strongNpub(user);
    if (!npub) return;
    await setDoc(
      doc(database, "users", npub),
      { currentGoal: { ...next, updatedAt: isoNow() } },
      { merge: true }
    );
  }
  async function recordGoalCompletion(prevGoal, confidence = 0) {
    const npub = strongNpub(user);
    if (!npub || !prevGoal) return;
    const payload = {
      ...prevGoal,
      status: "completed",
      completedAt: isoNow(),
      confidence,
    };
    await addDoc(collection(database, "users", npub, "goals"), payload);

    // Increment lesson goal count for variation progression
    // This ensures the next time user does this lesson, they get a different goal
    if (prevGoal.lessonScenario) {
      const userRef = doc(database, "users", npub);
      const userData = (await getDoc(userRef)).data() || {};
      const lessonGoalCounts = userData.lessonGoalCounts || {};
      lessonGoalCounts[prevGoal.lessonScenario] =
        (lessonGoalCounts[prevGoal.lessonScenario] || 0) + 1;
      await setDoc(userRef, { lessonGoalCounts }, { merge: true });
    }
  }

  function skipGoal() {
    // If in lesson mode, call onSkip to switch to next random module type
    if (onSkip && typeof onSkip === "function") {
      console.log("[RealTimeTest] Skipping to next lesson module");
      onSkip();
      return;
    }

    // Not in lesson mode - show a message
    toast({
      title: uiLang === "es" ? "Modo de práctica libre" : "Free practice mode",
      description:
        uiLang === "es"
          ? "En modo libre, usa el botón Conectar para practicar conversación."
          : "In free mode, use the Connect button to practice conversation.",
      status: "info",
      duration: 2000,
    });
  }

  function handleNextGoal() {
    if (goalBusyRef.current) return;

    // In lesson mode, move to the next module (same behavior as Skip)
    if (onSkip && typeof onSkip === "function") {
      setGoalCompleted(false);
      onSkip();
      return;
    }

    // Not in lesson mode - show the same info as Skip
    skipGoal();
  }

  // XP helpers - normalized to 4-7 XP range
  function computeXpDelta({ met, conf, attempts, pron }) {
    // Simplified XP: award 6 XP for meeting goal, less for partial attempts
    if (met) {
      // Small bonus for pronunciation practice
      const pronBonus = pron ? 1 : 0;
      // Penalty for multiple attempts
      const effortPenalty = Math.max(0, attempts - 1) * 0.5;
      return Math.max(4, Math.min(7, 6 + pronBonus - effortPenalty));
    }
    // Didn't meet goal - award based on confidence
    return Math.max(0, Math.min(4, Math.round(conf * 4)));
  }
  // async function awardXp(delta) {
  //   const amt = Math.round(delta || 0);
  //   if (!amt) return;
  //   setXp((v) => v + amt);
  //   try {
  //     const npub = strongNpub(user);
  //     if (npub) {
  //       await setDoc(
  //         doc(database, "users", npub),
  //         { xp: increment(amt), updatedAt: isoNow() },
  //         { merge: true }
  //       );
  //     }
  //   } catch {}
  // }

  async function evaluateAndMaybeAdvanceGoal(userUtterance) {
    const goal = goalRef.current;
    if (!goal || goalBusyRef.current) return;

    const nextAttempts = (goal.attempts || 0) + 1;
    const patched = { ...goal, attempts: nextAttempts, updatedAt: isoNow() };
    setCurrentGoal(patched);
    goalRef.current = patched;
    await persistCurrentGoal(patched);

    const rubricTL = goalRubricForTarget(goal);
    const gLang = goalUiLangCode();
    const uiLangName = gLang === "es" ? "Spanish" : "English";

    const judgePrompt =
      targetLangRef.current === "es"
        ? `Evalúa si el siguiente enunciado cumple esta meta en español: "${
            goal.title_es
          }". Criterio: ${rubricTL}.
Devuelve SOLO JSON:
{"met":true|false,"confidence":0..1,"feedback_tl":"mensaje breve y amable en el idioma meta (≤12 palabras)","feedback_ui":"mensaje breve y amable en ${
            gLang === "es" ? "español" : "inglés"
          } (≤12 palabras)"}`
        : `Evaluate whether the following utterance meets this goal in ${
            targetLangRef.current === "en" ? "English" : "the target language"
          }: "${goal.title_en}". Criterion: ${rubricTL}.
Return ONLY JSON:
{"met":true|false,"confidence":0..1,"feedback_tl":"short, kind message in the target language (≤12 words)","feedback_ui":"short, kind message in ${uiLangName} (≤12 words)"}`;

    const body = {
      model: TRANSLATE_MODEL,
      text: { format: { type: "text" } },
      input: `${judgePrompt}\n\nUtterance:\n${userUtterance}`,
    };

    try {
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

      const mergedText =
        (typeof payload?.output_text === "string" && payload.output_text) ||
        (Array.isArray(payload?.output) &&
          payload.output
            .map((it) =>
              (it?.content || []).map((seg) => seg?.text || "").join("")
            )
            .join(" ")
            .trim()) ||
        (Array.isArray(payload?.content) && payload.content[0]?.text) ||
        (Array.isArray(payload?.choices) &&
          (payload.choices[0]?.message?.content || "")) ||
        "";
      const parsed = safeParseJson(mergedText) || {};
      const met = !!parsed.met;
      const conf = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
      const fbTL = (parsed.feedback_tl || "").trim();
      const fbUI = (parsed.feedback_ui || "").trim();
      if (fbUI || fbTL) setGoalFeedback(fbUI || fbTL);

      if (met && !goalXpAwardedRef.current) {
        const xpGain = computeXpDelta({
          met: true,
          conf,
          attempts: nextAttempts,
          pron: !!practicePronunciationRef.current,
        });
        setXp((v) => v + xpGain);
        await awardXp(currentNpub, xpGain, targetLangRef.current);
        goalXpAwardedRef.current = true;
      }

      if (met) {
        await recordGoalCompletion(goal, conf);
        setGoalCompleted(true); // Mark goal as completed, wait for user to click "Next Goal"
      }
    } catch (e) {
      console.warn("Goal eval failed:", e?.message || e);
    }
  }

  /* ---------------------------
     Language instructions
  --------------------------- */
  function buildLanguageInstructions(prefs) {
    const persona = String(
      (prefs?.voicePersona ?? voicePersonaRef.current ?? "").slice(0, 240)
    );
    const focus = String(
      (prefs?.helpRequest ?? helpRequestRef.current ?? "").slice(0, 240)
    );
    const tLang = prefs?.targetLang ?? targetLangRef.current;
    const currentCefrLevel = cefrLevelRef.current;
    const pronOn = !!(
      prefs?.practicePronunciation ?? practicePronunciationRef.current
    );
    const goal = goalRef.current;
    const activeGoal = goalTitleForTarget(goal);
    const roleplayPrompt = goal?.roleplayPrompt || "";
    const successCriteria = goal?.successCriteria || "";

    let strict;
    if (tLang === "nah") {
      strict =
        "Respond ONLY in Nahuatl (Náhuatl). Do not use Spanish or English.";
    } else if (tLang === "es") {
      strict = "Responde ÚNICAMENTE en español. No uses inglés ni náhuatl.";
    } else if (tLang === "pt") {
      strict =
        "Responda APENAS em português brasileiro. Não use espanhol ou inglês.";
    } else if (tLang === "fr") {
      strict =
        "Réponds UNIQUEMENT en français. N'utilise ni l'anglais ni l'espagnol.";
    } else if (tLang === "it") {
      strict = "Rispondi SOLO in italiano. Non usare inglese o spagnolo.";
    } else {
      strict = "Respond ONLY in English. Do not use Spanish or Nahuatl.";
    }

    const levelHint = getCEFRPromptHint(currentCefrLevel);

    const focusLine = focus ? `Focus area: ${focus}.` : "";
    const pronLine = pronOn
      ? "Pronunciation mode: after answering, give a micro pronunciation cue (≤6 words), then repeat the corrected sentence once, slowly, and invite the user to repeat."
      : "";

    // Build comprehensive goal guidance for the AI tutor
    let goalGuidance = "";
    if (activeGoal || roleplayPrompt) {
      goalGuidance = `CONVERSATION GOAL: Help the learner accomplish "${activeGoal}".`;
      if (roleplayPrompt) {
        goalGuidance += ` YOUR ROLE: ${roleplayPrompt}`;
      }
      if (successCriteria) {
        goalGuidance += ` Guide them toward: ${successCriteria}.`;
      }
      goalGuidance +=
        " Gently steer the conversation to give them opportunities to demonstrate this skill.";
    }

    return [
      "Act as a language practice partner.",
      strict,
      "Keep replies very brief (≤25 words) and natural.",
      `PERSONA: ${persona}. Stay consistent with that tone/style.`,
      levelHint,
      focusLine,
      pronLine,
      goalGuidance,
    ]
      .filter(Boolean)
      .join(" ");
  }
  function buildLanguageInstructionsFromRefs() {
    return buildLanguageInstructions(undefined);
  }

  function scheduleSessionUpdate() {
    clearTimeout(sessionUpdateTimer.current);
    sessionUpdateTimer.current = setTimeout(
      () => sendSessionUpdate(),
      DEBOUNCE_MS
    );
  }
  function scheduleProfileSave() {
    clearTimeout(profileSaveTimer.current);
    profileSaveTimer.current = setTimeout(() => {
      if (!hydrated) return;
      saveProfile({}).catch(() => {});
    }, 500);
  }
  function clearAllDebouncers() {
    for (const t of translateTimers.current.values()) clearTimeout(t);
    translateTimers.current.clear();
    clearTimeout(sessionUpdateTimer.current);
    clearTimeout(profileSaveTimer.current);
  }

  function applyLanguagePolicyNow() {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    safeCancelActiveResponse();

    const uniqIds = Array.from(new Set(guardrailItemIdsRef.current));
    for (const id of uniqIds) {
      try {
        dcRef.current.send(
          JSON.stringify({ type: "conversation.item.delete", item_id: id })
        );
      } catch {}
    }
    guardrailItemIdsRef.current = [];

    const voiceName = voiceRef.current || "alloy";
    const instructions = buildLanguageInstructionsFromRefs();
    const vadMs = pauseMsRef.current || 2000;

    try {
      dcRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: {
            instructions,
            modalities: ["audio", "text"],
            voice: voiceName,
            turn_detection: {
              type: "server_vad",
              silence_duration_ms: vadMs,
              threshold: 0.35,
              prefix_padding_ms: 120,
            },
            input_audio_transcription: { model: "whisper-1" },
            output_audio_format: "pcm16",
          },
        })
      );
    } catch {}

    try {
      pendingGuardrailTextRef.current = instructions;
      dcRef.current.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "system",
            content: [{ type: "input_text", text: instructions }],
          },
        })
      );
    } catch {}
  }

  async function applyVoiceNow({ speakProbe = false } = {}) {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    safeCancelActiveResponse();
    await waitUntilIdle();
    const voiceName = voiceRef.current || "alloy";
    try {
      dcRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: {
            voice: voiceName,
            modalities: ["audio", "text"],
            turn_detection: {
              type: "server_vad",
              silence_duration_ms: pauseMsRef.current || 2000,
              threshold: 0.35,
              prefix_padding_ms: 120,
            },
            input_audio_transcription: { model: "whisper-1" },
            output_audio_format: "pcm16",
          },
        })
      );
    } catch {}
    await new Promise((r) => setTimeout(r, 40));
    if (speakProbe) {
      const probeText =
        targetLangRef.current === "es"
          ? "Voz actualizada."
          : targetLangRef.current === "pt"
          ? "Voz atualizada."
          : targetLangRef.current === "fr"
          ? "Voix mise à jour."
          : targetLangRef.current === "it"
          ? "Voce aggiornata."
          : "Voice updated.";
      try {
        dcRef.current.send(
          JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["audio"],
              conversation: "none",
              instructions: `Say exactly: "${probeText}"`,
              commit: false,
              metadata: { kind: "voice_probe" },
            },
          })
        );
      } catch {}
    }
  }

  function sendSessionUpdate() {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    const voiceName = voiceRef.current || "alloy";
    const instructions = buildLanguageInstructionsFromRefs();
    try {
      dcRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: {
            instructions,
            modalities: ["audio", "text"],
            voice: voiceName,
            turn_detection: {
              type: "server_vad",
              silence_duration_ms: pauseMsRef.current || 2000,
              threshold: 0.35,
              prefix_padding_ms: 120,
            },
            input_audio_transcription: { model: "whisper-1" },
            output_audio_format: "pcm16",
          },
        })
      );
    } catch {}
  }

  /* ---------------------------
     Replay + recording helpers
  --------------------------- */
  function chooseMime() {
    const cand = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
    ];
    for (const mt of cand)
      if (window.MediaRecorder?.isTypeSupported(mt)) return mt;
    return undefined;
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
  function startRecordingForRid(rid, mid) {
    try {
      const stream = captureOutRef.current || audioRef.current?.srcObject;
      const mimeType = chooseMime();
      if (!stream || !mimeType) return;
      const rec = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      rec.ondataavailable = (ev) => {
        if (ev?.data?.size) chunks.push(ev.data);
      };
      rec.onstop = async () => {
        try {
          if (!chunks.length) return;
          const blob = new Blob(chunks, { type: mimeType });
          await idbPutClip(mid, blob, {
            voice: voiceRef.current || "alloy",
            mimeType,
          });
          audioCacheIndexRef.current.add(mid);
          updateMessage(mid, (m) => ({ ...m, hasAudio: true }));
        } catch (e) {
          console.warn("IDB save failed:", e?.message || e);
        } finally {
          recChunksRef.current.delete(rid);
          recMapRef.current.delete(rid);
        }
      };
      rec.start(250);
      recMapRef.current.set(rid, rec);
      recChunksRef.current.set(rid, chunks);
    } catch (e) {
      console.warn("Recorder start failed:", e?.message || e);
    }
  }
  function stopRecorderAfterTail(
    rid,
    opts = { quietMs: 900, maxMs: 20000, armThresh: 0.006, minActiveMs: 900 }
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
      }
    }, 100);
    recTailRef.current.set(rid, id);
  }

  /* ---------------------------
     Event handling
  --------------------------- */
  const messagesRef = useRef([]);
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

    if (t === "response.created") {
      isIdleRef.current = false;
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
      const text = (data.transcript || "").trim();
      if (text) {
        const now = Date.now();
        if (
          text === lastTranscriptRef.current.text &&
          now - lastTranscriptRef.current.ts < 2000
        ) {
          return;
        }
        lastTranscriptRef.current = { text, ts: now };
        pushMessage({
          id: uid(),
          role: "user",
          lang: "en",
          textFinal: text,
          textStream: "",
          translation: "",
          pairs: [],
          done: true,
          ts: now,
        });
        await persistUserTurn(text, "en").catch(() => {});
        evaluateAndMaybeAdvanceGoal(text).catch(() => {});
      }
      return;
    }

    if (rid && replayRidSetRef.current.has(rid)) {
      if (
        t === "response.completed" ||
        t === "response.done" ||
        t === "response.canceled"
      ) {
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
      scheduleDebouncedTranslate(mid);
      return;
    }

    if (
      t === "response.completed" ||
      t === "response.done" ||
      t === "response.canceled"
    ) {
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
        try {
          await translateMessage(mid, "completed");
          logEvent(analytics, "handleTurn", { action: "turn_completed" });
        } catch {}
        respToMsg.current.delete(rid);
      }
      setUiState("idle");
      setMood("neutral");
      return;
    }

    if (t === "error" && data?.error?.message) {
      const msg = data.error.message || "";
      if (/Cancellation failed/i.test(msg) || /no active response/i.test(msg))
        return;
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
        pairs: [],
        done: false,
        hasAudio: false,
        ts: Date.now(),
      });
    }
    return mid;
  }

  function pushMessage(m) {
    setMessages((p) => [...p, m]);
  }
  function updateMessage(id, updater) {
    setMessages((p) => p.map((m) => (m.id === id ? updater(m) : m)));
  }

  /* ---------------------------
     Translation + PERSIST
  --------------------------- */
  function scheduleDebouncedTranslate(id) {
    const prev = translateTimers.current.get(id);
    if (prev) clearTimeout(prev);
    const timer = setTimeout(() => {
      translateMessage(id).catch(() => {});
    }, 300);
    translateTimers.current.set(id, timer);
  }

  async function translateMessage(id) {
    const m = messagesRef.current.find((x) => x.id === id);
    if (!m) return;
    const src = (m.textFinal + " " + (m.textStream || "")).trim();
    if (!src) return;
    if (m.role !== "assistant") return;

    const supportChoice = supportLangRef.current || supportLang || "en";
    const target = supportChoice === "es" ? "es" : "en";

    if ((m.lang || targetLangRef.current) === target) {
      updateMessage(id, (prev) => ({ ...prev, translation: src, pairs: [] }));
      await upsertAssistantTurn(id, {
        text: src,
        lang: m.lang || targetLangRef.current || "es",
        translation: src,
        pairs: [],
      });
      return;
    }

    const prompt =
      target === "es"
        ? `Traduce lo siguiente al español claro y natural.
Devuelve SOLO JSON con el formato {"translation":"...","pairs":[{"lhs":"...","rhs":"..."}]}.
Divide la oración en fragmentos paralelos muy cortos (2 a 6 palabras) dentro de "pairs" para alinear las ideas.
Evita responder con toda la frase en un solo fragmento.`
        : `Translate the following into natural US English.
Return ONLY JSON in the format {"translation":"...","pairs":[{"lhs":"...","rhs":"..."}]}.
Split the sentence into short, aligned chunks (2-6 words) inside "pairs" for phrase-by-phrase study.
Do not return the whole sentence as a single chunk.`;

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
            (it?.content || []).map((seg) => seg?.text || "").join("")
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
    const pairs = tidyPairs(rawPairs);

    updateMessage(id, (prev) => ({ ...prev, translation, pairs }));
    await upsertAssistantTurn(id, {
      text: src,
      lang: m.lang || targetLangRef.current || "es",
      translation,
      pairs,
    });
  }

  async function upsertAssistantTurn(mid, { text, lang, translation, pairs }) {
    const npub = strongNpub(user);
    if (!npub) return;
    if (!(await ensureUserDoc(npub))) return;

    setStreak((v) => v + 1);
    try {
      await setDoc(
        doc(database, "users", npub),
        {
          local_npub: npub,
          updatedAt: isoNow(),
          streak: increment(1),
          helpRequest: helpRequestRef.current || "",
          progress: {
            level: levelRef.current,
            supportLang: supportLangRef.current,
            voice: voiceRef.current,
            voicePersona: voicePersonaRef.current,
            targetLang: targetLangRef.current,
            showTranslations,
            helpRequest: helpRequestRef.current || "",
            practicePronunciation: !!practicePronunciationRef.current,
            pauseMs: pauseMsRef.current,
          },
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("Streak persist failed:", e?.message || e);
    }
  }

  async function persistUserTurn(text, lang = "en") {
    const npub = strongNpub(user);
    if (!npub) return;
    const now = Date.now();
    lastUserSaveRef.current = { text, ts: now };
  }

  async function saveProfile(partial = {}) {
    if (!hydrated) return;
    const npub = strongNpub(user);
    if (!npub) return;

    const nextProgress = {
      level: partial.level ?? levelRef.current,
      supportLang: partial.supportLang ?? supportLangRef.current,
      voice: partial.voice ?? voiceRef.current,
      voicePersona: partial.voicePersona ?? voicePersonaRef.current,
      targetLang: partial.targetLang ?? targetLangRef.current,
      showTranslations: partial.showTranslations ?? showTranslations,
      pauseMs: Number.isFinite(partial.pauseMs)
        ? partial.pauseMs
        : pauseMsRef.current,
      helpRequest:
        typeof partial.helpRequest === "string"
          ? partial.helpRequest
          : helpRequestRef.current || "",
      practicePronunciation:
        typeof partial.practicePronunciation === "boolean"
          ? partial.practicePronunciation
          : !!practicePronunciationRef.current,
    };

    await setDoc(
      doc(database, "users", npub),
      {
        local_npub: npub,
        updatedAt: isoNow(),
        helpRequest: nextProgress.helpRequest || "",
        progress: nextProgress,
      },
      { merge: true }
    );

    try {
      const st = useUserStore.getState?.();
      const mergedProgress = { ...(st?.user?.progress || {}), ...nextProgress };
      if (st?.patchUser) {
        st.patchUser({
          helpRequest: nextProgress.helpRequest || "",
          progress: mergedProgress,
        });
      } else if (st?.setUser) {
        const prev = st.user || {};
        st.setUser({
          ...prev,
          helpRequest: nextProgress.helpRequest || "",
          progress: mergedProgress,
        });
      }
    } catch (e) {
      console.warn("Store sync (progress) skipped:", e?.message || e);
    }
  }

  /* ---------------------------
     Render helpers
  --------------------------- */
  function isDuplicateOfPersistedUser(ephem) {
    if (!ephem?.textFinal) return false;
    const txt = ephem.textFinal.trim();
    if (!txt) return false;
    const threshold = 4000; // ms
    return history.some(
      (h) =>
        h.role === "user" &&
        (h.textFinal || "").trim() === txt &&
        Math.abs((h.ts || 0) - (ephem.ts || 0)) < threshold
    );
  }

  const timeline = useMemo(() => {
    const map = new Map();
    for (const h of history) map.set(h.id, { ...h, source: "hist" });
    for (const m of messages) {
      if (m.role === "user" && isDuplicateOfPersistedUser(m)) continue;
      map.set(m.id, { ...(map.get(m.id) || {}), ...m, source: "ephem" });
    }
    return Array.from(map.values()).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [messages, history]);

  return (
    <>
      <Box
        minH="100vh"
        // bg="gray.900"
        color="gray.100"
        position="relative"
        pb="120px"
        borderRadius="24px"
        mt="-8"
      >
        {/* Header */}
        {/* <Text
        fontSize={["md", "lg"]}
        fontWeight="bold"
        noOfLines={1}
        flex="1"
        mr={2}
        px={4}
        pt={1}
      >
        {appTitle} (BETA)
      </Text> */}

        <Flex
          px={4}
          pt={2}
          align="center"
          justify="space-between"
          gap={2}
        ></Flex>

        {/* Only Delete (settings moved to top bar) */}

        {/* 🎯 Active goal display */}
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
                loudness={uiState === "listening" ? volume : 0}
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
                  <HStack spacing={2} align="center">
                    <Badge
                      colorScheme="yellow"
                      variant="subtle"
                      fontSize={"10px"}
                    >
                      {tGoalLabel}
                    </Badge>
                    <Text fontSize="xs" opacity={0.9}>
                      {goalTitleForUI(currentGoal) || "—"}
                    </Text>
                  </HStack>
                  <HStack></HStack>
                </HStack>
                {!!currentGoal && (
                  <Text fontSize="xs" opacity={0.8}>
                    <strong style={{ opacity: 0.85 }}>{tGoalCriteria}</strong>{" "}
                    {goalRubricForUI(currentGoal)}
                  </Text>
                )}
                {goalFeedback ? (
                  <Text fontSize="xs" mt={2} opacity={0.9}>
                    💡 {goalFeedback}
                  </Text>
                ) : null}

                <Box mt={3}>
                  <HStack justifyContent="space-between" mb={1}>
                    <Badge colorScheme="cyan" variant="subtle" fontSize="10px">
                      {uiLang === "es" ? "Nivel" : "Level"} {xpLevelNumber}
                    </Badge>
                    <Badge colorScheme="teal" variant="subtle" fontSize="10px">
                      {ui.ra_label_xp} {xp}
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
          {timeline.map((m) => {
            const isUser = m.role === "user";
            if (isUser) {
              return (
                <RowRight key={m.id}>
                  <UserBubble label={ui.ra_label_you} text={m.textFinal} />
                </RowRight>
              );
            }

            const primaryText = (m.textFinal || "") + (m.textStream || "");
            const lang = m.lang || targetLang || "es";
            const primaryLabel = languageNameFor(lang);

            const secondaryText =
              m.source === "hist"
                ? (secondaryPref === "es" ? m.trans_es : m.trans_en) || ""
                : m.translation || "";

            const secondaryLabel =
              lang === "es"
                ? translations[uiLang].language_en
                : translations[uiLang][`language_${secondaryPref}`];

            const isTranslating =
              !secondaryText && !!m.textStream && showTranslations;

            const canReplay =
              !!m.hasAudio || audioCacheIndexRef.current.has(m.id);
            const replayLabel = uiLang === "es" ? "Reproducir" : "Replay";

            if (!primaryText.trim()) return null;
            return (
              <RowLeft key={m.id}>
                <AlignedBubble
                  primaryLabel={primaryLabel}
                  secondaryLabel={secondaryLabel}
                  primaryText={primaryText}
                  secondaryText={showTranslations ? secondaryText : ""}
                  pairs={m.pairs || []}
                  showSecondary={showTranslations}
                  isTranslating={isTranslating}
                  canReplay={canReplay}
                  onReplay={() => playSavedClip(m.id)}
                  isReplaying={replayingId === m.id}
                  replayLabel={replayLabel}
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
              onClick={skipGoal}
              size="md"
              height="48px"
              px={{ base: 6, md: 8 }}
              rounded="full"
              colorScheme="orange"
              variant="outline"
              color="white"
              textShadow="0px 0px 20px black"
              mb={20}
            >
              {uiLang === "es" ? "Saltar" : "Skip"}
            </Button>
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
            >
              {status === "connected" ? (
                <>
                  <FaStop /> &nbsp; {ui.ra_btn_disconnect}
                </>
              ) : (
                <>
                  <PiMicrophoneStageDuotone /> &nbsp;{" "}
                  {status === "connecting"
                    ? ui.ra_btn_connecting
                    : ui.ra_btn_connect}
                </>
              )}
            </Button>

            <Button
              onClick={handleNextGoal}
              size="md"
              height="48px"
              px={{ base: 6, md: 8 }}
              rounded="full"
              color="white"
              textShadow="0px 0px 20px black"
              mb={20}
              bg="gray.800"
              border="1px solid cyan"
              disabled={!goalCompleted}
            >
              {uiLang === "es" ? "Siguiente" : "Next"}
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
    </>
  );
}
