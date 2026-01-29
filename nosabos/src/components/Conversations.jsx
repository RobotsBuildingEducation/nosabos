// components/Conversations.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  IconButton,
  Text,
  VStack,
  Wrap,
  WrapItem,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import { PiMicrophoneStageDuotone } from "react-icons/pi";
import { FaStop, FaCheckCircle, FaDice } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { RiVolumeUpLine } from "react-icons/ri";
import ConversationSettingsDrawer from "./ConversationSettingsDrawer";

import { doc, setDoc, getDoc, increment, updateDoc } from "firebase/firestore";
import {
  database,
  analytics,
  simplemodel,
} from "../firebaseResources/firebaseResources";
import { logEvent } from "firebase/analytics";

import useUserStore from "../hooks/useUserStore";
import RobotBuddyPro from "./RobotBuddyPro";
import { translations } from "../utils/translation";
import { WaveBar } from "./WaveBar";
import { awardXp } from "../utils/utils";
import { getLanguageXp } from "../utils/progressTracking";
import { DEFAULT_TTS_VOICE } from "../utils/tts";
import { getCEFRPromptHint } from "../utils/cefrUtils";
import {
  getRandomSkillTreeTopics,
  getRandomFallbackTopic,
} from "../data/conversationTopics";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";

const REALTIME_MODEL =
  (import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";

const REALTIME_URL = `${
  import.meta.env.VITE_REALTIME_URL
}?model=gpt-realtime-mini/exchangeRealtimeSDP?model=${encodeURIComponent(
  REALTIME_MODEL
)}`;

const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const TRANSLATE_MODEL =
  import.meta.env.VITE_OPENAI_TRANSLATE_MODEL || "gpt-5-nano";

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
            />
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
export default function Conversations({
  activeNpub = "",
  targetLang = "es",
  supportLang = "en",
  pauseMs: initialPauseMs = 2000,
  maxProficiencyLevel = "A1",
}) {
  const aliveRef = useRef(false);
  const playSound = useSoundSettings((s) => s.playSound);

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
  const replayAudioRef = useRef(null);

  // Idle gating
  const isIdleRef = useRef(true);
  const idleWaitersRef = useRef([]);

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

  // Learning prefs
  const [voice, setVoice] = useState(user?.progress?.voice || "alloy");
  const [voicePersona, setVoicePersona] = useState(
    user?.progress?.voicePersona ||
      translations.en.onboarding_persona_default_example
  );
  const [showTranslations, setShowTranslations] = useState(
    user?.progress?.showTranslations !== false
  );

  // Conversation settings state
  const [conversationSettings, setConversationSettings] = useState({
    proficiencyLevel: maxProficiencyLevel || "A1",
    practicePronunciation: user?.progress?.practicePronunciation || false,
    conversationSubjects: user?.progress?.conversationSubjects || "",
  });
  const conversationSettingsRef = useRef(conversationSettings);

  // Settings drawer
  const {
    isOpen: isSettingsOpen,
    onOpen: openSettings,
    onClose: closeSettings,
  } = useDisclosure();
  const handleSettingsOpen = useCallback(() => {
    playSound(selectSound);
    openSettings();
  }, [openSettings, playSound]);
  const scrollConversationToTop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // Live refs
  const voiceRef = useRef(voice);
  const voicePersonaRef = useRef(voicePersona);
  const targetLangRef = useRef(targetLang);
  const supportLangRef = useRef(supportLang);
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
    supportLangRef.current = supportLang;
  }, [supportLang]);
  useEffect(() => {
    pauseMsRef.current = pauseMs;
  }, [pauseMs]);

  // Keep conversation settings ref updated
  useEffect(() => {
    conversationSettingsRef.current = conversationSettings;
  }, [conversationSettings]);

  // Track if we should regenerate goal after settings change
  const shouldRegenerateGoalRef = useRef(false);

  // Handle settings change with Firebase persistence
  const handleSettingsChange = useCallback(
    async (newSettings) => {
      const previousSettings = conversationSettingsRef.current;
      setConversationSettings(newSettings);

      // Persist to Firebase
      if (currentNpub) {
        try {
          await updateDoc(doc(database, "users", currentNpub), {
            "progress.conversationProficiencyLevel":
              newSettings.proficiencyLevel,
            "progress.practicePronunciation": newSettings.practicePronunciation,
            "progress.conversationSubjects": newSettings.conversationSubjects,
          });
        } catch (e) {
          console.error("Failed to save conversation settings:", e);
        }
      }

      // Mark for goal regeneration if proficiency level or subjects changed
      if (
        previousSettings.proficiencyLevel !== newSettings.proficiencyLevel ||
        previousSettings.conversationSubjects !==
          newSettings.conversationSubjects
      ) {
        shouldRegenerateGoalRef.current = true;
      }
    },
    [currentNpub]
  );

  // Regenerate goal when settings drawer closes (if settings changed)
  const handleSettingsClose = useCallback(() => {
    closeSettings();
    scrollConversationToTop();
    if (shouldRegenerateGoalRef.current) {
      shouldRegenerateGoalRef.current = false;
      // Small delay to let state update
      setTimeout(() => {
        generateConversationTopic();
      }, 150);
    }
  }, [closeSettings, scrollConversationToTop]);

  // XP
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  // Goal system - initialize with fallback, then generate AI topic
  const [currentGoal, setCurrentGoal] = useState(() => ({
    text: getRandomFallbackTopic(maxProficiencyLevel),
    completed: false,
  }));
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [goalFeedback, setGoalFeedback] = useState("");
  const goalCheckPendingRef = useRef(false);
  const lastUserMessageRef = useRef("");
  const hasGeneratedInitialTopic = useRef(false);
  const streamingRef = useRef(false);

  // Generate a conversation topic using AI with streaming
  async function generateConversationTopic() {
    // Prevent multiple simultaneous calls
    if (streamingRef.current || isGeneratingGoal) return;

    setIsGeneratingGoal(true);
    setGoalFeedback("");
    setStreamingText("");
    streamingRef.current = true;

    // Determine the language for the response
    const responseLang = supportLang === "es" ? "Spanish" : "English";

    // Get current settings from ref (for use in async context)
    const currentSettings = conversationSettingsRef.current;
    const selectedLevel =
      currentSettings.proficiencyLevel || maxProficiencyLevel || "A1";
    const customSubjects = currentSettings.conversationSubjects || "";

    try {
      // Get skill tree topics for context
      const skillTreeTopics = getRandomSkillTreeTopics(
        selectedLevel,
        targetLang,
        15
      );

      const levelDescription =
        selectedLevel === "A1"
          ? "absolute beginner - use very simple vocabulary and short sentences"
          : selectedLevel === "A2"
          ? "elementary - use simple everyday topics and basic sentences"
          : selectedLevel === "B1"
          ? "intermediate - discuss experiences, opinions, and plans"
          : selectedLevel === "B2"
          ? "upper intermediate - handle complex and abstract topics"
          : selectedLevel === "C1"
          ? "advanced - use sophisticated vocabulary concisely"
          : "mastery - use nuanced vocabulary concisely";

      // Build custom subjects prompt if user has defined subjects
      const customSubjectsPrompt = customSubjects
        ? `\n\nIMPORTANT: The user has specified they want to practice these specific topics/contexts:\n"${customSubjects}"\nPrioritize generating topics related to these interests when possible.`
        : "";

      const prompt = `You are creating a conversation practice topic for a ${selectedLevel} level language learner (${levelDescription}).

Here are some topics from their learning curriculum that you can reference or be inspired by:
${skillTreeTopics.join("\n")}${customSubjectsPrompt}

Generate ONE clear, specific conversation topic that:
1. Is appropriate for ${selectedLevel} level complexity
2. Encourages the learner to speak and practice
3. Can be either based on the curriculum topics above, the user's custom interests, OR a creative topic you think would be engaging
4. Is specific enough to guide the conversation (not generic like "practice speaking")
5. Is CONCISE: Maximum 10-15 words. For advanced levels (C1/C2), use sophisticated vocabulary, NOT longer sentences.

Examples of good topics:
- "Describe your morning routine" (A1)
- "Explain your favorite hobby and why" (B1)
- "Debate the ethics of AI in healthcare" (C2)
- "Discuss cultural nuances in business etiquette" (C2)

BAD examples (too verbose): "Analyze the socio-economic implications of modern consumer culture..."

Respond with ONLY the topic text in ${responseLang}. No quotes, no JSON, no explanation - just the topic itself (max 15 words).`;

      // Use Gemini streaming for real-time feedback
      const result = await simplemodel.generateContentStream(prompt);

      let fullText = "";

      for await (const chunk of result.stream) {
        if (!streamingRef.current) break;

        const chunkText = typeof chunk.text === "function" ? chunk.text() : "";

        if (!chunkText) continue;

        fullText += chunkText;
        setStreamingText(fullText);
      }

      // Use the streamed text directly as the topic
      const topicText = fullText.trim();
      if (topicText) {
        setCurrentGoal({
          text: { en: topicText, es: topicText },
          completed: false,
        });
      } else {
        // Use fallback if empty
        setCurrentGoal({
          text: getRandomFallbackTopic(selectedLevel),
          completed: false,
        });
      }
    } catch (e) {
      console.error("Topic generation error:", e);
      // Use fallback on error
      const selectedLevel =
        conversationSettingsRef.current.proficiencyLevel ||
        maxProficiencyLevel ||
        "A1";
      setCurrentGoal({
        text: getRandomFallbackTopic(selectedLevel),
        completed: false,
      });
    } finally {
      streamingRef.current = false;
      setStreamingText("");
      setIsGeneratingGoal(false);
    }
  }

  // Generate initial topic on mount
  useEffect(() => {
    if (!hasGeneratedInitialTopic.current) {
      hasGeneratedInitialTopic.current = true;
      generateConversationTopic();
    }
  }, []);

  // Handler to get a new AI-generated topic
  const handleShuffleTopic = () => {
    generateConversationTopic();
  };

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

  // Translate timers & response mapping
  const translateTimers = useRef(new Map());
  const respToMsg = useRef(new Map());
  const sessionUpdateTimer = useRef(null);
  const lastTranscriptRef = useRef({ text: "", ts: 0 });

  // UI strings
  const storedUiLang = (() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("appLanguage") || "";
    } catch {
      return "";
    }
  })();

  const normalizeSupportLang = (raw) => {
    const code = String(raw || "").toLowerCase();
    if (code === "es" || code.startsWith("es-") || code === "spanish")
      return "es";
    if (code === "en" || code.startsWith("en-") || code === "english")
      return "en";
    return undefined;
  };

  const resolvedSupportLang =
    normalizeSupportLang(supportLangRef.current || supportLang) ||
    normalizeSupportLang(user?.progress?.supportLang) ||
    normalizeSupportLang(storedUiLang) ||
    "en";

  const uiLang = resolvedSupportLang;
  const ui = translations[uiLang];

  // Which language to show in secondary lane
  const secondaryPref =
    targetLang === "en" ? "es" : supportLang === "es" ? "es" : "en";

  // XP level calculation
  const xpLevelNumber = Math.floor(xp / 100) + 1;
  const progressPct = xp % 100;

  // Timeline sorted by timestamp (newest-first for display)
  const timeline = [...messages].sort((a, b) => b.ts - a.ts);

  // Language name helper
  const languageNameFor = (code) => {
    if (code === "es") return translations[uiLang].language_es;
    if (code === "en") return translations[uiLang].language_en;
    if (code === "pt") return translations[uiLang].language_pt || "Portuguese";
    if (code === "fr") return translations[uiLang].language_fr || "French";
    if (code === "it") return translations[uiLang].language_it || "Italian";
    if (code === "nl") return translations[uiLang].language_nl || "Dutch";
    if (code === "nah")
      return translations[uiLang].language_nah || "Huastec Nahuatl";
    if (code === "ja") return translations[uiLang].language_ja || "Japanese";
    if (code === "ru") return translations[uiLang].language_ru || "Russian";
    if (code === "de") return translations[uiLang].language_de || "German";
    if (code === "el") return translations[uiLang].language_el || "Greek";
    if (code === "pl") return translations[uiLang].language_pl || "Polish";
    if (code === "ga") return translations[uiLang].language_ga || "Irish";
    return code;
  };

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
          if (data.progress?.voice) setVoice(data.progress.voice);
          if (data.progress?.voicePersona)
            setVoicePersona(data.progress.voicePersona);
          if (typeof data.progress?.showTranslations === "boolean") {
            setShowTranslations(data.progress.showTranslations);
          }
          if (Number.isFinite(data.progress?.pauseMs)) {
            setPauseMs(data.progress.pauseMs);
          }
          // Load conversation settings
          setConversationSettings((prev) => ({
            proficiencyLevel:
              data.progress?.conversationProficiencyLevel ||
              maxProficiencyLevel ||
              prev.proficiencyLevel,
            practicePronunciation:
              data.progress?.practicePronunciation ??
              prev.practicePronunciation,
            conversationSubjects:
              data.progress?.conversationSubjects || prev.conversationSubjects,
          }));
        }
      } catch {}
    }
    loadXp();
  }, [currentNpub, targetLang, maxProficiencyLevel]);

  // Cleanup on unmount
  useEffect(() => () => stop(), []);
  useEffect(
    () => () => {
      stopReplayAudio();
    },
    []
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
    setErr("");
    setStatus("connecting");
    setUiState("thinking");
    setMood("thoughtful");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localRef.current = stream;

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
    const selectedLevel =
      currentSettings.proficiencyLevel || maxProficiencyLevel || "A1";
    const practicePronunciation =
      currentSettings.practicePronunciation || false;
    const customSubjects = currentSettings.conversationSubjects || "";

    let strict;
    if (tLang === "nah") {
      strict =
        "Respond ONLY in Huastec Nahuatl (Náhuatl Huasteco). Do not use Spanish or English.";
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
    } else if (tLang === "nl") {
      strict =
        "Antwoord ALLEEN in het Nederlands. Gebruik geen Engels of Spaans.";
    } else if (tLang === "ja") {
      strict =
        "日本語のみで応答してください。英語やスペイン語は使用しないでください。Respond ONLY in Japanese.";
    } else if (tLang === "ru") {
      strict =
        "Отвечайте ТОЛЬКО на русском языке. Не используйте английский или испанский. Respond ONLY in Russian.";
    } else if (tLang === "de") {
      strict =
        "Antworten Sie NUR auf Deutsch. Verwenden Sie kein Englisch oder Spanisch. Respond ONLY in German.";
    } else if (tLang === "el") {
      strict =
        "Απαντήστε ΜΟΝΟ στα ελληνικά. Μην χρησιμοποιείτε αγγλικά ή ισπανικά. Respond ONLY in Greek.";
    } else if (tLang === "pl") {
      strict =
        "Odpowiadaj TYLKO po polsku. Nie używaj angielskiego ani hiszpańskiego. Respond ONLY in Polish.";
    } else if (tLang === "ga") {
      strict =
        "Freagair i nGaeilge AMHÁIN. Ná húsáid Béarla ná Spáinnis. Respond ONLY in Irish.";
    } else {
      strict =
        "Respond ONLY in English. Do not use Spanish or Huastec Nahuatl.";
    }

    // Proficiency level guidance
    const levelGuidance = {
      A1: "CRITICAL: User is a complete beginner (A1). Use ONLY very simple vocabulary (greetings, numbers, colors, family). Use short 3-5 word sentences. Use ONLY present tense. Speak as if to a child learning their first words. Examples: 'Hola. ¿Cómo estás?' 'Tengo un gato.' 'Me gusta pizza.'",
      A2: "CRITICAL: User is elementary level (A2). Use simple everyday vocabulary (food, shopping, directions). Use 5-8 word sentences. Use present, past, and simple future tenses only. Avoid complex grammar. Examples: 'Ayer fui al mercado.' '¿Qué vas a hacer mañana?'",
      B1: "CRITICAL: User is intermediate (B1). Use conversational vocabulary about familiar topics (work, travel, hobbies). Can use 8-12 word sentences. Use various tenses but keep grammar structures moderate. Can express opinions simply.",
      B2: "CRITICAL: User is upper intermediate (B2). Use more complex vocabulary and abstract concepts. Can use longer sentences with subordinate clauses. Can use subjunctive mood occasionally. Can discuss hypotheticals.",
      C1: "CRITICAL: User is advanced (C1). Use sophisticated vocabulary and nuanced expressions. Use complex sentence structures with multiple clauses. Use idiomatic expressions. Can handle abstract and specialized topics.",
      C2: "CRITICAL: User is near-native (C2). Use native-like expressions, colloquialisms, and subtle distinctions. Can use any grammatical structure. Can handle any topic with precision and style.",
    };

    const proficiencyHint = levelGuidance[selectedLevel] || levelGuidance.A1;

    // Pronunciation practice instructions
    const pronunciationInstructions = practicePronunciation
      ? "PRONUNCIATION PRACTICE MODE: When the user makes pronunciation errors or uses awkward phrasing, gently correct them and ask them to repeat the correct pronunciation. Use phonetic hints when helpful. Praise good pronunciation."
      : "";

    // Custom subjects context
    const customSubjectsContext = customSubjects
      ? `CUSTOM CONTEXT: The user wants to practice conversations related to: "${customSubjects}". Try to incorporate relevant vocabulary and scenarios from this context when appropriate.`
      : "";

    return [
      "Act as a friendly language practice partner for free-form conversation.",
      strict,
      proficiencyHint,
      pronunciationInstructions,
      customSubjectsContext,
      "IMPORTANT: Match your language complexity to the learner's proficiency level. Do not use vocabulary or grammar above their level.",
      "Keep replies very brief (≤25 words) and natural.",
      `PERSONA: ${persona}. Stay consistent with that tone/style.`,
      "Be encouraging and help the learner practice speaking naturally.",
      "Ask follow-up questions to keep the conversation flowing.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function applyLanguagePolicyNow() {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;

    const voiceName = voiceRef.current || "alloy";
    const instructions = buildLanguageInstructions();
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
  }

  function clearAllDebouncers() {
    for (const t of translateTimers.current.values()) clearTimeout(t);
    translateTimers.current.clear();
    clearTimeout(sessionUpdateTimer.current);
  }

  /* ---------------------------
     Goal-based XP system with AI evaluation
  --------------------------- */

  // Evaluate if user's response satisfies the current goal
  async function evaluateGoalCompletion(userMessage, aiResponse) {
    if (currentGoal.completed || goalCheckPendingRef.current) return;
    if (!userMessage || userMessage.length < 3) return;

    goalCheckPendingRef.current = true;

    try {
      const goalText = currentGoal.text.en;
      const tLang = targetLangRef.current;
      const sLang = supportLangRef.current;
      const languageName =
        tLang === "es"
          ? "Spanish"
          : tLang === "pt"
          ? "Portuguese"
          : tLang === "fr"
          ? "French"
          : tLang === "it"
          ? "Italian"
          : tLang === "nl"
          ? "Dutch"
          : tLang === "nah"
          ? "Huastec Nahuatl"
          : tLang === "ja"
          ? "Japanese"
          : tLang === "ru"
          ? "Russian"
          : tLang === "de"
          ? "German"
          : tLang === "el"
          ? "Greek"
          : tLang === "pl"
          ? "Polish"
          : tLang === "ga"
          ? "Irish"
          : "English";
      const feedbackLanguage = sLang === "es" ? "Spanish" : "English";

      const prompt = `You are evaluating if a language learner completed a conversation goal.

CRITICAL REQUIREMENTS (BOTH must be met):
1. The user MUST respond in ${languageName}. If they responded in ANY other language, the goal is NOT completed.
2. The user's message MUST directly address the specific goal content. Generic or unrelated responses do NOT count.

Goal: "${goalText}"
Target language: ${languageName}
User said: "${userMessage}"
AI responded: "${aiResponse}"

STRICT EVALUATION CRITERIA:
1. Language Check: Is the user's message in ${languageName}? (If not → completed = false)
2. Content Relevance Check: Does the user's message directly address the specific topic/action in the goal?
   - If the goal is "talk about your favorite place in the city" and user talks about their dog → completed = false
   - If the goal is "describe your morning routine" and user talks about food → completed = false
   - If the goal is "discuss your hobbies" and user talks about weather → completed = false
   - The message must be TOPICALLY RELEVANT to the goal, not just grammatically correct

Examples of INCORRECT evaluation:
- Goal: "Describe your favorite restaurant" / User: "My dog is white" → completed = false (wrong topic)
- Goal: "Talk about your weekend plans" / User: "I like coffee" → completed = false (off-topic)

Only mark completed = true if BOTH language AND content relevance are satisfied.

FEEDBACK GUIDELINES:
- Provide feedback in ${feedbackLanguage}
- If completed = true: Provide encouraging, specific praise (e.g., "Great! You talked about your favorite restaurant perfectly!")
- If completed = false: Keep it SHORT - 1-2 sentences max. Just briefly tell them what to try instead (e.g., "Try talking about the goal topic." or "Use ${languageName} to respond.")

Respond with ONLY a JSON object: {"completed": true/false, "reason": "brief, actionable feedback in ${feedbackLanguage}"}`;

      const body = {
        model: TRANSLATE_MODEL,
        text: { format: { type: "text" } },
        input: prompt,
      };

      const r = await fetch(RESPONSES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        goalCheckPendingRef.current = false;
        return;
      }

      const payload = await r.json();
      const responseText =
        payload?.output_text ||
        (Array.isArray(payload?.output) &&
          payload.output
            .map((it) =>
              (it?.content || []).map((seg) => seg?.text || "").join("")
            )
            .join(" ")
            .trim()) ||
        "";

      const parsed = safeParseJson(responseText);
      if (parsed?.completed) {
        // Set positive feedback
        const defaultSuccess =
          sLang === "es"
            ? "¡Bien hecho! Completaste la meta."
            : "Great job! You completed the goal!";
        setGoalFeedback(parsed?.reason || defaultSuccess);
        await awardGoalXp();
        // Generate contextual next goal
        setTimeout(() => generateContextualGoal(), 1500);
      } else {
        // Set guiding feedback for failed attempt
        const defaultGuidance =
          sLang === "es"
            ? "Intenta hablar sobre la meta."
            : "Try addressing the goal.";
        setGoalFeedback(parsed?.reason || defaultGuidance);
        goalCheckPendingRef.current = false;
      }
    } catch (e) {
      goalCheckPendingRef.current = false;
    }
  }

  // Generate next goal based on conversation context
  async function generateContextualGoal() {
    setIsGeneratingGoal(true);
    setGoalFeedback(""); // Clear previous feedback

    // Get current settings
    const currentSettings = conversationSettingsRef.current;
    const selectedLevel =
      currentSettings.proficiencyLevel || maxProficiencyLevel || "A1";
    const customSubjects = currentSettings.conversationSubjects || "";

    try {
      // Get recent conversation context
      const recentMessages = messagesRef.current
        .slice(-6)
        .map(
          (m) => `${m.role === "user" ? "User" : "AI"}: ${m.textFinal || ""}`
        )
        .join("\n");

      // Build custom subjects hint
      const customSubjectsHint = customSubjects
        ? `\nThe user is interested in practicing: "${customSubjects}". Consider incorporating relevant topics when appropriate.`
        : "";

      const prompt = `You are helping a ${selectedLevel} level language learner practice conversation.

Recent conversation:
${recentMessages || "Just started"}

Previous goal was: "${currentGoal.text.en}"${customSubjectsHint}

Generate the NEXT natural conversation goal that follows the flow of the conversation.
The goal should be appropriate for ${selectedLevel} level (${
        selectedLevel === "A1"
          ? "beginner - simple tasks"
          : selectedLevel === "A2"
          ? "elementary - everyday topics"
          : selectedLevel === "B1"
          ? "intermediate - opinions and experiences"
          : selectedLevel === "B2"
          ? "upper intermediate - complex discussions"
          : selectedLevel === "C1"
          ? "advanced - nuanced but concise"
          : "mastery - sophisticated but concise"
      }).

IMPORTANT: Keep the goal CONCISE (max 10-15 words). For advanced levels, use sophisticated vocabulary, NOT longer sentences.

Respond with ONLY a JSON object: {"en": "goal in English (max 15 words)", "es": "goal in Spanish (max 15 words)"}`;

      const body = {
        model: TRANSLATE_MODEL,
        text: { format: { type: "text" } },
        input: prompt,
      };

      const r = await fetch(RESPONSES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        // Fallback to default goal
        setCurrentGoal({
          text: {
            en: "Continue the conversation",
            es: "Continúa la conversación",
          },
          completed: false,
        });
        goalCheckPendingRef.current = false;
        setIsGeneratingGoal(false);
        return;
      }

      const payload = await r.json();
      const responseText =
        payload?.output_text ||
        (Array.isArray(payload?.output) &&
          payload.output
            .map((it) =>
              (it?.content || []).map((seg) => seg?.text || "").join("")
            )
            .join(" ")
            .trim()) ||
        "";

      const parsed = safeParseJson(responseText);
      if (parsed?.en && parsed?.es) {
        setCurrentGoal({
          text: { en: parsed.en, es: parsed.es },
          completed: false,
        });
      } else {
        setCurrentGoal({
          text: {
            en: "Continue the conversation",
            es: "Continúa la conversación",
          },
          completed: false,
        });
      }
    } catch (e) {
      setCurrentGoal({
        text: {
          en: "Continue the conversation",
          es: "Continúa la conversación",
        },
        completed: false,
      });
    }

    setIsGeneratingGoal(false);
    goalCheckPendingRef.current = false;
  }

  async function awardGoalXp() {
    const npub = currentNpub;
    if (!npub) return;

    // Award 2-4 XP for completing a goal
    const xpGain = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4

    setXp((v) => v + xpGain);
    setGoalsCompleted((v) => v + 1);
    setCurrentGoal((prev) => ({ ...prev, completed: true }));

    try {
      await awardXp(npub, xpGain, targetLangRef.current);
      logEvent(analytics, "conversation_goal_completed", { xp: xpGain });
    } catch {}
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

    // Evaluate goal completion with AI
    if (userMessage) {
      evaluateGoalCompletion(userMessage, aiResponse);
    }

    try {
      await awardXp(npub, xpGain, targetLangRef.current);
      logEvent(analytics, "conversation_turn_xp", { xp: xpGain });
    } catch {}
  }

  /* ---------------------------
     Realtime event handler
  --------------------------- */
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
      return;
    }

    if (t === "response.created") {
      isIdleRef.current = false;
      // Record when this response started (user spoke before this)
      responseStartTimeRef.current = Date.now();
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
          pairs: [],
          done: true,
          ts: userTs,
        });
        // Award XP for user turn and store message for goal evaluation
        turnCountRef.current += 1;
        lastUserMessageRef.current = text;
        awardTurnXp(text, "");
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
          logEvent(analytics, "conversation_turn", {
            action: "turn_completed",
          });
        } catch {}

        // Evaluate goal completion with the AI response
        const aiMessage = messagesRef.current.find((m) => m.id === mid);
        const aiResponseText = aiMessage?.textFinal || "";
        if (lastUserMessageRef.current && aiResponseText) {
          evaluateGoalCompletion(lastUserMessageRef.current, aiResponseText);
        }

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
  }

  /* ---------------------------
     Render
  --------------------------- */
  return (
    <>
      <Box minH="100vh" color="gray.100" position="relative" pb="120px">
        {/* Header area with centered Robot and Goal UI */}
        <Box px={4} mt={0} display="flex" justifyContent="center">
          <Box
            bg="gray.800"
            p={2}
            rounded="2xl"
            border="1px solid rgba(255,255,255,0.06)"
            width="100%"
            maxWidth="400px"
          >
            <VStack spacing={3} align="center" width="100%">
              {/* Robot and Settings Row */}
              <HStack width="100%" justify="space-between" align="center">
                {/* RobotBuddyPro on the left */}
                <Box
                  width="75px"
                  opacity={0.95}
                  flexShrink={0}
                  mt="-12px"
                  ml={"-22px"}
                >
                  <RobotBuddyPro
                    state={uiState}
                    loudness={uiState === "listening" ? volume : 0}
                    mood={mood}
                    variant="abstract"
                    maxW={75}
                  />
                </Box>

                {/* Conversation Settings Button */}
                <Button
                  leftIcon={<FiSettings />}
                  size="xs"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={handleSettingsOpen}
                  opacity={0.7}
                  _hover={{ opacity: 1 }}
                  fontWeight="medium"
                >
                  {uiLang === "es" ? "Configuración" : "Conversation settings"}
                </Button>
              </HStack>

              {/* Goal Text with Checkmark or Loader */}
              <VStack spacing={2} align="center" width="100%">
                <HStack
                  spacing={2}
                  align="center"
                  width="100%"
                  justify="center"
                >
                  {isGeneratingGoal ? (
                    <>
                      <Spinner
                        size="sm"
                        color="white"
                        thickness="2px"
                        speed="0.8s"
                      />
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        textAlign="center"
                        color="white"
                        flex="1"
                      >
                        {streamingText ||
                          (uiLang === "es"
                            ? "Generando nuevo tema..."
                            : "Generating new topic...")}
                      </Text>
                    </>
                  ) : (
                    <>
                      <IconButton
                        icon={<FaDice />}
                        size="xs"
                        variant="ghost"
                        colorScheme="purple"
                        aria-label={
                          uiLang === "es" ? "Nuevo tema" : "New topic"
                        }
                        onClick={handleShuffleTopic}
                        opacity={0.7}
                        _hover={{ opacity: 1 }}
                        isDisabled={status === "connected"}
                      />
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        textAlign="center"
                        opacity={currentGoal.completed ? 0.6 : 1}
                        textDecoration={
                          currentGoal.completed ? "line-through" : "none"
                        }
                        flex="1"
                      >
                        {currentGoal.text[uiLang] || currentGoal.text.en}
                      </Text>
                      {currentGoal.completed && (
                        <Box
                          as={FaCheckCircle}
                          color="green.400"
                          boxSize="18px"
                        />
                      )}
                    </>
                  )}
                </HStack>

                {/* Goal Feedback */}
                {goalFeedback && !isGeneratingGoal && (
                  <Text
                    fontSize="xs"
                    textAlign="center"
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    bg={currentGoal.completed ? "green.900" : "orange.900"}
                    color={currentGoal.completed ? "green.200" : "orange.200"}
                    border="1px solid"
                    borderColor={
                      currentGoal.completed ? "green.600" : "orange.600"
                    }
                    maxW="90%"
                  >
                    {goalFeedback}
                  </Text>
                )}
              </VStack>

              {/* XP Progress Bar */}
              <Box w="100%">
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

            const secondaryText = m.translation || "";

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

      {/* Conversation Settings Drawer */}
      <ConversationSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
        settings={conversationSettings}
        onSettingsChange={handleSettingsChange}
        supportLang={supportLang}
      />
    </>
  );
}
