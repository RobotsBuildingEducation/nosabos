import ActivityActionRow from "./ActivityActionRow";
import QuestionActionArea from "./QuestionActionArea";
import FeedbackRail from "./FeedbackRail";
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
  IconButton,
  Spacer,
  Divider,
  Input,
  Tag,
  TagLabel,
  Flex,
  SlideFade,
  Spinner,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaStop, FaPen, FaMicrophone } from "react-icons/fa";
import { FiRadio, FiHeadphones } from "react-icons/fi";
import { MdOutlineTranslate } from "react-icons/md";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { PiSpeakerHighDuotone } from "react-icons/pi";
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
import {
  appCheckFetch,
  database,
  storyModel,
} from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { t, translations } from "../utils/translation";
import { WaveBar } from "./WaveBar";
import { awardXp } from "../utils/utils";
import { captureCompanionMemory } from "../utils/companionMemory";
import { getLanguageXp } from "../utils/progressTracking";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_EDGE,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";
import {
  getTTSPlayer,
  primeTTSAudio,
  stopAllTTSPlayback,
  TTS_LANG_TAG,
} from "../utils/tts";
import { extractCEFRLevel } from "../utils/cefrUtils";
import { getUserProficiencyLevel } from "../utils/cefrProgress";
import { speechReasonTips } from "../utils/speechEvaluation";
import { SpeakSuccessCard } from "./SpeakSuccessCard";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import StoryLoadingScreen from "../features/stories/StoryLoadingScreen";
import RandomCharacter from "./RandomCharacter";
import useSoundSettings from "../hooks/useSoundSettings";
import { submitActionSound, nextButtonSound, deliciousSound, selectSound } from "../constants/sounds";
import { getBidiTextProps, mergeBidiSx } from "../utils/bidiText";
import { buildCurriculumPromptContext } from "../utils/lessonCurriculum";
import { questionSquircleStyle } from "./questionUiStyles";
import StoryComprehension from "../features/stories/StoryComprehension";
import { chooseStoryMode, isStoryTargetCollectionCompatible, rotateStoryMode, STORY_MODES } from "../features/stories/storySession";
import { buildSpeakingStoryPrompt, getStoryDifficulty, STORY_THINKING_BUDGET } from "../features/stories/storyPrompts";
import StoryCharacterAvatar from "../features/stories/StoryCharacterAvatar";
import { storyCopy } from "../features/stories/storyCopy";
import { storyServices } from "../features/stories/storyServices";
import {
  PRACTICE_STORY_TURN_XP,
  claimPracticeStoryTurnReward,
} from "../features/stories/practiceStoryRewards";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";
import {
  getStoryCharacterVoice,
  getStoryCharacterPersonality,
  getRandomStoryCharacterPortraitId,
} from "../features/stories/storyCharacters";

const renderSpeakerIcon = (loading) =>
  loading ? <Spinner size="xs" /> : <PiSpeakerHighDuotone />;
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";
const STORY_PRIMARY_BUTTON_BG = "#14b8a6";
const STORY_PRIMARY_BUTTON_HOVER_BG = "#0d9488";
const STORY_PRIMARY_BUTTON_EDGE = "#0f766e";

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
    ar: "Egyptian Arabic",
    hi: "Hindi",
    pt: "Brazilian Portuguese",
    fr: "French",
    it: "Italian",
    ja: "Japanese",
    nl: "Dutch",
    nah: "Eastern Huasteca Nahuatl",
    ru: "Russian",
    de: "German",
    el: "Greek",
    pl: "Polish",
    ga: "Irish",
    yua: "Yucatec Maya",
  })[code] || code;

const BCP47 = {
  es: { stt: "es-MX", tts: "es-MX" },
  en: { stt: "en-US", tts: "en-US" },
  hi: { stt: "hi-IN", tts: "hi-IN" },
  pt: { stt: "pt-BR", tts: "pt-BR" },
  fr: { stt: "fr-FR", tts: "fr-FR" },
  it: { stt: "it-IT", tts: "it-IT" },
  ja: { stt: "ja-JP", tts: "ja-JP" },
  nl: { stt: "nl-NL", tts: "nl-NL" },
  nah: { stt: "es-MX", tts: "es-MX" }, // fallback if Eastern Huasteca Nahuatl is unsupported by engines
  ru: { stt: "ru-RU", tts: "ru-RU" },
  de: { stt: "de-DE", tts: "de-DE" },
  el: { stt: "el-GR", tts: "el-GR" },
  pl: { stt: "pl-PL", tts: "pl-PL" },
  ga: { stt: "ga-IE", tts: "ga-IE" },
  yua: { stt: "es-MX", tts: "es-MX" },
};

const supportStoryText = (lang, values) =>
  values?.[lang] || values?.en || "";

const resolveStoryLanguages = ({ targetLang, supportLang, progress, uiLang }) => {
  const resolvedTargetLang = normalizePracticeLanguage(
    targetLang || progress?.targetLang,
    DEFAULT_TARGET_LANGUAGE,
  );
  const requestedSupportLang = supportLang || progress?.supportLang;
  const resolvedSupportLang =
    requestedSupportLang === "bilingual"
      ? normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE)
      : normalizeSupportLanguage(
          requestedSupportLang || uiLang,
          DEFAULT_SUPPORT_LANGUAGE,
        );
  return { targetLang: resolvedTargetLang, supportLang: resolvedSupportLang };
};

const resolveStoryTitleText = (value, uiLang = "en", supportLang = "en", targetLang = "es") => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map((v) => resolveStoryTitleText(v, uiLang, supportLang, targetLang)).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    const candidate =
      value[uiLang] ||
      value[supportLang] ||
      value[targetLang] ||
      value.en ||
      value.es ||
      value.title ||
      value.name ||
      Object.values(value).find((v) => typeof v === "string" && v.trim() && !v.startsWith("[object")) ||
      "";
    if (typeof candidate === "string") return candidate.trim();
    if (typeof candidate === "object" && candidate !== null && candidate !== value) {
      return resolveStoryTitleText(candidate, uiLang, supportLang, targetLang);
    }
  }
  const str = String(value).trim();
  return str === "[object Object]" ? "" : str;
};

const toLangKey = (value) => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return null;
  if (["en", "english"].includes(raw)) return "en";
  if (["es", "spanish", "español"].includes(raw)) return "es";
  if (["ar", "arz", "arabic", "egyptian arabic", "عربي", "العربية"].includes(raw))
    return "ar";
  if (["zh", "zh-cn", "chinese", "mandarin", "mandarin chinese", "中文", "普通话"].includes(raw))
    return "zh";
  if (["pt", "portuguese", "português", "portugues"].includes(raw)) return "pt";
  if (["fr", "french", "francés", "francais", "français"].includes(raw))
    return "fr";
  if (["it", "italian", "italiano"].includes(raw)) return "it";
  if (["hi", "hindi", "हिंदी", "hindustani"].includes(raw)) return "hi";
  if (["ja", "japanese", "japonés", "japones", "giapponese", "japonais", "日本語"].includes(raw)) return "ja";
  if (["nl", "dutch", "nederlands", "holandés", "holandes"].includes(raw))
    return "nl";
  if (
    [
      "nah",
      "nahuatl",
      "náhuatl",
      "eastern huasteca nahuatl",
      "náhuatl huasteco",
    ].includes(raw)
  )
    return "nah";
  if (["ru", "russian", "ruso", "русский"].includes(raw)) return "ru";
  if (["de", "german", "alemán", "aleman", "deutsch"].includes(raw))
    return "de";
  if (["el", "greek", "griego", "ελληνικά", "ελληνικα"].includes(raw))
    return "el";
  if (["pl", "polish", "polaco", "polski"].includes(raw)) return "pl";
  if (["ga", "irish", "irlandés", "irlandes", "gaeilge"].includes(raw))
    return "ga";
  if (["yua", "yucatec maya", "maya yucateco", "maaya t'aan"].includes(raw))
    return "yua";
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
  const lang = user?.appLanguage || localStorage.getItem("appLanguage") || "en";
  return ["es", "pt", "it", "fr", "de", "ja", "hi", "ar", "zh"].includes(lang) ? lang : "en";
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
function useSharedProgress(activeNpub = "") {
  const user = useUserStore((s) => s.user);
  const npub = activeNpub?.trim?.() || strongNpub(user);
  const [xp, setXp] = useState(0);
  const [progress, setProgress] = useState({
    level: "beginner",
    targetLang: "es",
    supportLang: "en", // 'en' | 'es' | 'bilingual'
  });

  // ✅ NEW: track when we've loaded progress at least once
  const [progressReady, setProgressReady] = useState(false);

  useEffect(() => {
    // If we don't have an npub, just mark as ready and keep defaults
    if (!npub) {
      setProgressReady(true);
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
        "pl",
        "ga",
        "yua",
      ].includes(p.targetLang)
        ? p.targetLang
        : "es";

      const langXp = getLanguageXp(p, targetLang);

      setXp(Number.isFinite(langXp) ? langXp : 0);
      setProgress({
        level: p.level || "beginner",
        targetLang,
        supportLang: ["en", "es", "pt", "it", "fr", "de", "ja", "hi", "ar", "zh", "bilingual"].includes(p.supportLang)
          ? p.supportLang
          : "en",
      });

      // ✅ we've seen the first snapshot (existing doc or not)
      setProgressReady(true);
    });

    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);

  // ✅ return the ready flag
  return { xp, levelNumber, progressPct, progress, npub, progressReady };
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
      header: t(uiLang, "story_header_roleplay"),
      rolePrompt: t(uiLang, "story_role_prompt"),
      rolePlaceholder: t(uiLang, "story_role_placeholder"),
      startRole: t(uiLang, "story_start_role"),
      updateRole: t(uiLang, "story_update_role"),
      editRole: t(uiLang, "story_edit_role"),
      cancelEdit: t(uiLang, "story_cancel_edit"),
      playing: t(uiLang, "story_playing"),
      playTarget: (name) => t(uiLang, "story_play_target").replace("{name}", name),
      listen: t(uiLang, "story_listen"),
      stop: t(uiLang, "story_stop"),
      startPractice:
        t(uiLang, "story_start_practice") ||
        supportStoryText(uiLang, {
          en: "Practice",
          es: "Practicar",
          hi: "अभ्यास",
          it: "Pratica",
          fr: "Pratiquer",
          ar: "تدريب",
        }) ||
        "Practice",
      practiceThis: t(uiLang, "story_practice_this"),
      skip: t(uiLang, "story_skip"),
      finish: t(uiLang, "story_finish_role"),
      record: t(uiLang, "story_record"),
      stopRecording: t(uiLang, "story_stop_recording"),
      progress: t(uiLang, "story_progress"),
      noStory: t(uiLang, "story_no_role"),
      generatingTitle: t(uiLang, "story_generating_role_title"),
      generatingSub: t(uiLang, "story_generating_role_sub"),
      almost: t(uiLang, "story_almost"),
      wellDone: t(uiLang, "story_well_done"),
      score: t(uiLang, "story_score"),
      xp: t(uiLang, "ra_label_xp") || "XP",
      levelLabel: t(uiLang, "story_level"),
      levelValue:
        {
          beginner: t(uiLang, "onboarding_level_beginner"),
          intermediate: t(uiLang, "onboarding_level_intermediate"),
          advanced: t(uiLang, "onboarding_level_advanced"),
        }[level] || level,
      tts_synthesizing: t(uiLang, "tts_synthesizing"),
    };
  }, [uiLang, level]);
}

/* ================================
   Normalization / Scoring (multi-lang)
=================================== */

/* ================================
   Main Component
=================================== */
export default function StoryMode(props) {
  const user = useUserStore((s) => s.user);
  const pinnedMode =
    props.lessonContent?.topic === "tutorial"
      ? "speaking"
      : props.lessonContent?.storyMode &&
        STORY_MODES.includes(props.lessonContent.storyMode)
      ? props.lessonContent.storyMode
      : null;

  const [activeMode, setActiveMode] = useState(() =>
    pinnedMode || chooseStoryMode(props.lessonContent),
  );
  const [cycle, setCycle] = useState(0);

  const baseScope = JSON.stringify([
    user?.id,
    props.targetLang || user?.progress?.targetLang,
    props.supportLang || user?.progress?.supportLang,
    props.lesson?.id,
    props.lessonContent?.topic,
    props.lessonContent?.scenario,
  ]);

  useEffect(() => {
    if (pinnedMode && pinnedMode !== activeMode) {
      setActiveMode(pinnedMode);
    }
  }, [pinnedMode, activeMode]);

  const handleNewStory = useCallback(() => {
    if (pinnedMode) {
      setActiveMode(pinnedMode);
    } else {
      const nextMode = rotateStoryMode(activeMode, props.lessonContent);
      setActiveMode(nextMode);
    }
    setCycle((c) => c + 1);
  }, [pinnedMode, activeMode, props.lessonContent]);

  return (
    <Box w="100%" maxW="1280px" mx="auto" px={{ base: 2, md: 4 }}>
      <StoryActivity
        key={`${baseScope}-${activeMode}-${cycle}`}
        {...props}
        mode={activeMode}
        onNewStory={handleNewStory}
      />
    </Box>
  );
}

function StoryActivity(props) {
  const mode = props.mode;
  return mode === "speaking" ? (
    <SpeakingStoryMode {...props} />
  ) : (
    <StoryComprehensionSettings {...props} mode={mode} />
  );
}

function StoryComprehensionSettings(props) {
  const { progress, npub, progressReady } = useSharedProgress(props.activeNpub);
  const uiLang = getAppUILang();
  const { targetLang, supportLang } = resolveStoryLanguages({
    targetLang: props.targetLang,
    supportLang: props.supportLang,
    progress,
    uiLang,
  });
  const effectiveLang = normalizeSupportLanguage(supportLang || uiLang, "en");
  const copy = storyCopy(effectiveLang);

  if (!progressReady) {
    return (
      <StoryLoadingScreen
        title={copy.loading}
        subtitle={copy.loadingSub}
        onSkip={props.onSkip}
        skipLabel={copy.skip}
        variant={props.mode || "radio"}
      />
    );
  }
  return <StoryComprehension {...props} npub={npub} uiLang={uiLang}
    targetLang={targetLang} supportLang={supportLang}
    targetName={LLM_LANG_NAME(targetLang)} supportName={LLM_LANG_NAME(supportLang)}
    cefrLevel={props.lesson?.cefrLevel || props.lessonContent?.cefrLevel || (props.lesson?.id ? extractCEFRLevel(props.lesson.id) : getUserProficiencyLevel(progress, targetLang))} />;
}

function SpeakingStoryMode({
  userLanguage = "en",
  lesson = null,
  lessonContent = null,
  onSkip = null,
  onNewStory = null,
  pauseMs = 2000,
  lessonEarnedXp = 0,
  targetLang: targetLangProp = "",
  supportLang: supportLangProp = "",
  activeNpub = "",
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useUserStore((s) => s.user);
  const playSound = useSoundSettings((s) => s.playSound);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // Shared settings + XP
  const { progress, npub, progressReady } = useSharedProgress(activeNpub);

  const uiLang = getAppUILang();
  const { targetLang, supportLang } = resolveStoryLanguages({
    targetLang: targetLangProp,
    supportLang: supportLangProp,
    progress,
    uiLang,
  });

  // Repair/ephemeral lessons carry an explicit CEFR level; regular path lessons
  // can still derive it from their level-coded id.
  const cefrLevel =
    lesson?.cefrLevel ||
    lessonContent?.cefrLevel ||
    (lesson?.id
      ? extractCEFRLevel(lesson.id)
      : getUserProficiencyLevel(progress, targetLang));

  // APP/UI copy and support translations follow the resolved support language.
  const effectiveLang = normalizeSupportLanguage(supportLang || uiLang, "en");
  const copy = storyCopy(effectiveLang);
  const uiText = useUIText(effectiveLang, progress.level);
  const targetTextProps = getBidiTextProps(targetLang);
  const supportTextProps = getBidiTextProps(supportLang);

  const targetDisplayName = DISPLAY_LANG_NAME(targetLang, effectiveLang);

  // State
  const [storyData, setStoryData] = useState(null);
  const [storyType, setStoryType] = useState(null); // 'paragraph' | 'conversation'
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [generationError, setGenerationError] = useState(false);

  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [isSynthesizingTarget, setIsSynthesizingTarget] = useState(false);
  const [playingLineIndex, setPlayingLineIndex] = useState(null);
  const [revealedTranslations, setRevealedTranslations] = useState({});
  const [sentenceTranslations, setSentenceTranslations] = useState({});
  const [translatingSentences, setTranslatingSentences] = useState({});
  const [sentenceCompleted, setSentenceCompleted] = useState(false); // Track when sentence is completed but not advanced
  const [lastSuccessInfo, setLastSuccessInfo] = useState(null);
  const [lastFeedback, setLastFeedback] = useState(null);

  // accumulate this session, but award only at end
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionSummary, setSessionSummary] = useState({ passed: 0, total: 0 });

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
  const audioRequestRef = useRef(0);
  const eventSourceRef = useRef(null);
  const activeSentenceRef = useRef(null);

  useEffect(() => {
    if (currentSentenceIndex > 0 && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentSentenceIndex]);
  const currentAudioUrlRef = useRef(null);
  const sessionAwardedRef = useRef(false);
  const rewardedSentenceKeysRef = useRef(new Set());
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

  /* ------------------------- Character Voice Mapping ------------------------- */
  // Voices categorized by typical sound. Stories assign these once per character.
  const MALE_CHARACTER_VOICES = [
    "echo",
    "verse",
    "ash",
    "cedar",
    "ballad",
    "alloy",
  ];
  const FEMALE_CHARACTER_VOICES = ["shimmer", "coral", "sage", "marin"];
  const STORY_NARRATOR_VOICE = "cedar";

  const canonicalCharacterName = (name) =>
    String(name || "")
      .trim()
      .toLowerCase();

  const normalizeCharacterGender = (gender) => {
    const value = String(gender || "")
      .trim()
      .toLowerCase();
    if (["female", "feminine", "woman", "girl", "f"].includes(value))
      return "female";
    if (["male", "masculine", "man", "boy", "m"].includes(value))
      return "male";
    return "";
  };

  // Common name patterns (covers Spanish, English, Portuguese, French, Italian)
  const FEMININE_NAME_PATTERNS = [
    /a$/i, // Maria, Elena, Sofia, Ana, Laura
    /^mar[iy]/i, // Maria, Marie, Mary
    /^ana/i,
    /^sofia/i,
    /^elena/i,
    /^carmen/i,
    /^rosa/i,
    /^lucia/i,
    /^isabel/i,
  ];

  const inferCharacterGender = (name) =>
    FEMININE_NAME_PATTERNS.some((pattern) => pattern.test(name || ""))
      ? "female"
      : "male";

  // Build a stable voice mapping for characters in the current story.
  // No Math.random here: each character keeps the same voice across playback.
  const characterVoiceMap = useMemo(() => {
    const map = new Map();
    if (!storyData?.sentences) return map;

    const characters = [];
    const seen = new Set();

    storyData.sentences.forEach((sentence) => {
      const name = String(sentence.character || "").trim();
      if (!name) return;
      const key = canonicalCharacterName(name);
      const gender = normalizeCharacterGender(sentence.gender);
      const existing = characters.find((character) => character.key === key);
      if (existing) {
        if (!existing.gender && gender) existing.gender = gender;
        return;
      }
      if (seen.has(key)) return;
      seen.add(key);
      characters.push({ key, name, gender });
    });

    const genderIndex = { male: 0, female: 0 };
    characters.forEach(({ key, name, gender }) => {
      const voiceGender = gender || inferCharacterGender(name);
      const pool =
        voiceGender === "female" ? FEMALE_CHARACTER_VOICES : MALE_CHARACTER_VOICES;
      const index = genderIndex[voiceGender] % pool.length;
      genderIndex[voiceGender] += 1;
      map.set(key, pool[index]);
    });

    return map;
  }, [storyData?.sentences]);

  const getStableCharacterVoice = useCallback(
    (name) => {
      const charVoice = getStoryCharacterVoice(name, user);
      if (charVoice) return charVoice;
      return (
        characterVoiceMap.get(canonicalCharacterName(name)) ||
        STORY_NARRATOR_VOICE
      );
    },
    [characterVoiceMap, user],
  );

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
      (t) => 0.22 + Math.max(1, Array.from(t.text).length) * 0.055,
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
  // Practice stories load target-language dialogue only. Support translations
  // are fetched per line when the learner asks for one.
  function normalizeStory(raw, tgtCode) {
    if (!raw) return null;
    const pick = (obj, code, fallback) =>
      obj?.[code] ??
      (code === "es" ? obj?.es : code === "en" ? obj?.en : undefined) ??
      obj?.[fallback];

    const fullTgt = pick(raw.fullStory || {}, tgtCode, "es");
    const sentences = (raw.sentences || []).map((s) => ({
      tgt: s?.[tgtCode] ?? s?.es ?? s?.en ?? "",
      sup: "",
      ...(s?.character && { character: String(s.character).trim() }),
      ...(normalizeCharacterGender(s?.gender) && {
        gender: normalizeCharacterGender(s.gender),
      }),
    }));

    if (!fullTgt || !sentences.length) return null;

    return {
      fullStory: { tgt: fullTgt, sup: "" },
      sentences,
    };
  }

  const validateAndFixStorySentences = (
    data,
    tgtKey = "tgt",
    supKey = "sup",
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
        ...(data.sentences[i]?.character && {
          character: data.sentences[i].character,
        }),
        ...(normalizeCharacterGender(data.sentences[i]?.gender) && {
          gender: normalizeCharacterGender(data.sentences[i].gender),
        }),
      }));
      return { ...data, sentences: validated };
    }
    return data;
  };

  const stopAllAudio = useCallback(() => {
    audioRequestRef.current++;
    stopAllTTSPlayback();
    if (currentAudioRef.current) {
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
    setIsSynthesizingTarget(false);
    setIsAutoPlaying(false);
    setHighlightedWordIndex(-1);
  }, []);

  /* ----------------------------- Story generation (backend, fallback) ----------------------------- */
  const generateStory = useCallback(async () => {
    setIsLoading(true);
    setGenerationError(false);
    stopAllAudio();
    setRevealedTranslations({});
    setSentenceTranslations({});
    setTranslatingSentences({});
    setSessionXp(0);
    sessionAwardedRef.current = false;
    rewardedSentenceKeysRef.current.clear();
    const isTutorial = lessonContent?.topic === "tutorial";
    try {
      usageStatsRef.current.storyGenerations++;
      const storyUrl = "https://generatestory-hftgya63qa-uc.a.run.app";

      // Determine lesson context for the story
      // Special handling for tutorial mode - use very simple "hello" content only
      const lessonTopic = isTutorial
        ? "TUTORIAL: Create an extremely simple story about saying hello. Use ONLY basic greetings like 'hello', 'hi', 'good morning', 'goodbye'. The story must be 2-3 very short sentences (2-5 words each) with NO extra topics."
        : lessonContent?.topic ||
          lessonContent?.scenario ||
          "general conversation";

      const response = await appCheckFetch(storyUrl, {
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
            includeTranslations: false,
            lessonTopic, // Use lesson context instead of role
          },
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const normalized = normalizeStory(
        data.story || data,
        targetLang,
        supportLang,
      );
      if (!normalized) throw new Error("Story payload missing expected fields");
      const validated = validateAndFixStorySentences(normalized, "tgt", "sup");
      if (!isStoryTargetCollectionCompatible(
        validated.sentences.map((sentence) => sentence?.tgt),
        targetLang,
      )) {
        throw new Error(
          `Story dialogue is not in the requested target language (${targetLang})`,
        );
      }
      setStoryData(validated);
      storyCacheRef.current = validated;
      setCurrentSentenceIndex(0);
      setSessionXp(0);
      setSessionComplete(false);
      setSessionSummary({
        passed: 0,
        total: validated?.sentences?.length || 0,
      });
      sessionAwardedRef.current = false;
      setHighlightedWordIndex(-1);
      setLastSuccessInfo(null);
      setLastFeedback(null);
    } catch (error) {
      if (!new Set(["en", "es"]).has(targetLang)) {
        console.error("Story generation failed for the requested language", {
          targetLang,
          supportLang,
          message: error?.message || String(error),
        });
        setStoryData(null);
        setGenerationError(true);
        return;
      }
      // Bilingual fallback that respects target/support languages
      setStoryType("paragraph"); // Fallback is always a paragraph story
      const fallback = isTutorial
        ? {
            storyType: "paragraph",
            fullStory: {
              tgt:
                targetLang === "en"
                  ? "Hello. Hi. Goodbye."
                  : "Hola. Hola. Adiós.",
              sup: supportStoryText(supportLang, {
                en: "Hello. Hi. Goodbye.",
                es: "Hola. Hola. Adiós.",
                hi: "नमस्ते। हाय। अलविदा।",
                it: "Ciao. Ciao. Arrivederci.",
                fr: "Bonjour. Salut. Au revoir.",
                ar: "أهلاً. هاي. مع السلامة.",
                zh: "你好。嗨。再见。",
              }),
            },
            sentences:
              targetLang === "en"
                ? [
                    {
                      tgt: "Hello.",
                      sup: supportStoryText(supportLang, {
                        en: "Hello.",
                        es: "Hola.",
                        hi: "नमस्ते।",
                        it: "Ciao.",
                        fr: "Bonjour.",
                        ar: "أهلاً.",
                        zh: "你好。",
                      }),
                    },
                    {
                      tgt: "Hi.",
                      sup: supportStoryText(supportLang, {
                        en: "Hi.",
                        es: "Hola.",
                        hi: "हाय।",
                        it: "Ciao.",
                        fr: "Salut.",
                        ar: "هاي.",
                        zh: "嗨。",
                      }),
                    },
                    {
                      tgt: "Goodbye.",
                      sup: supportStoryText(supportLang, {
                        en: "Goodbye.",
                        es: "Adiós.",
                        hi: "अलविदा।",
                        it: "Arrivederci.",
                        fr: "Au revoir.",
                        ar: "مع السلامة.",
                        zh: "再见。",
                      }),
                    },
                  ]
                : [
                    {
                      tgt: "Hola.",
                      sup: supportStoryText(supportLang, {
                        en: "Hello.",
                        es: "Hola.",
                        hi: "नमस्ते।",
                        it: "Ciao.",
                        fr: "Bonjour.",
                        ar: "أهلاً.",
                        zh: "你好。",
                      }),
                    },
                    {
                      tgt: "Hola.",
                      sup: supportStoryText(supportLang, {
                        en: "Hi.",
                        es: "Hola.",
                        hi: "हाय।",
                        it: "Ciao.",
                        fr: "Salut.",
                        ar: "هاي.",
                        zh: "嗨。",
                      }),
                    },
                    {
                      tgt: "Adiós.",
                      sup: supportStoryText(supportLang, {
                        en: "Goodbye.",
                        es: "Adiós.",
                        hi: "अलविदा।",
                        it: "Arrivederci.",
                        fr: "Au revoir.",
                        ar: "مع السلامة.",
                        zh: "再见。",
                      }),
                    },
                  ],
          }
        : {
            storyType: "paragraph",
            fullStory: {
              tgt:
                targetLang === "en"
                  ? "Once upon a time, there was a small town called San Miguel. The town had a lovely square where kids played every day. In the square, an old fountain always had fresh water. Adults sat around it to talk and rest after work."
                  : "Había una vez un pequeño pueblo en México llamado San Miguel. El pueblo tenía una plaza muy bonita donde los niños jugaban todos los días. En la plaza, había una fuente antigua que siempre tenía agua fresca. Los adultos se sentaban alrededor de la fuente para hablar y descansar después del trabajo.",
              sup: supportStoryText(supportLang, {
                en: "Once upon a time, there was a small town in Mexico called San Miguel. The town had a very beautiful square where the children played every day. In the square, there was an old fountain that always had fresh water. The adults sat around the fountain to talk and rest after work.",
                es: "Había una vez un pequeño pueblo en México llamado San Miguel. El pueblo tenía una plaza muy bonita donde los niños jugaban todos los días. En la plaza, había una fuente antigua que siempre tenía agua fresca. Los adultos se sentaban alrededor de la fuente para hablar y descansar después del trabajo.",
                hi: "एक समय मेक्सिको में सैन मिगेल नाम का एक छोटा-सा कस्बा था। उस कस्बे में एक बहुत सुंदर चौक था जहाँ बच्चे हर दिन खेलते थे। चौक में एक पुराना फव्वारा था जिसमें हमेशा ताज़ा पानी रहता था। बड़े लोग काम के बाद बातें करने और आराम करने के लिए उसी फव्वारे के आसपास बैठते थे।",
                it: "C'era una volta un piccolo paese in Messico chiamato San Miguel. Il paese aveva una piazza molto bella dove i bambini giocavano ogni giorno. Nella piazza c'era una vecchia fontana con acqua sempre fresca. Gli adulti si sedevano intorno alla fontana per parlare e riposare dopo il lavoro.",
                fr: "Il etait une fois un petit village au Mexique appele San Miguel. Le village avait une tres belle place ou les enfants jouaient tous les jours. Sur la place, il y avait une vieille fontaine qui avait toujours de l'eau fraiche. Les adultes s'asseyaient autour de la fontaine pour parler et se reposer apres le travail.",
                ar: "كان يا ما كان، كانت هناك بلدة صغيرة في المكسيك اسمها سان ميجيل. كان فيها ميدان جميل جداً يلعب فيه الأطفال كل يوم. وفي الميدان كانت توجد نافورة قديمة فيها ماء عذب دائماً. وكان الكبار يجلسون حول النافورة ليتحدثوا ويستريحوا بعد العمل.",
                zh: "从前，墨西哥有一个叫圣米格尔的小镇。小镇有一个很漂亮的广场，孩子们每天都在那里玩。广场上有一座古老的喷泉，里面总是有清水。大人们下班后会坐在喷泉周围聊天和休息。",
              }),
            },
            sentences:
              targetLang === "en"
                ? [
                    {
                      tgt: "Once upon a time, there was a small town called San Miguel.",
                      sup: supportStoryText(supportLang, {
                        en: "Once upon a time, there was a small town called San Miguel.",
                        es: "Había una vez un pequeño pueblo llamado San Miguel.",
                        hi: "एक समय सैन मिगेल नाम का एक छोटा-सा कस्बा था।",
                        it: "C'era una volta un piccolo paese chiamato San Miguel.",
                        fr: "Il etait une fois un petit village appele San Miguel.",
                        ar: "كان يا ما كان، كانت هناك بلدة صغيرة اسمها سان ميجيل.",
                        zh: "从前，有一个叫圣米格尔的小镇。",
                      }),
                    },
                    {
                      tgt: "The town had a lovely square where kids played every day.",
                      sup: supportStoryText(supportLang, {
                        en: "The town had a lovely square where kids played every day.",
                        es: "El pueblo tenía una plaza bonita donde los niños jugaban a diario.",
                        hi: "उस कस्बे में एक सुंदर चौक था जहाँ बच्चे हर दिन खेलते थे।",
                        it: "Il paese aveva una bella piazza dove i bambini giocavano ogni giorno.",
                        fr: "Le village avait une jolie place ou les enfants jouaient tous les jours.",
                        ar: "كان في البلدة ميدان جميل يلعب فيه الأطفال كل يوم.",
                        zh: "小镇有一个漂亮的广场，孩子们每天都在那里玩。",
                      }),
                    },
                    {
                      tgt: "In the square, an old fountain always had fresh water.",
                      sup: supportStoryText(supportLang, {
                        en: "In the square, an old fountain always had fresh water.",
                        es: "En la plaza, una fuente antigua siempre tenía agua fresca.",
                        hi: "उस चौक में एक पुराना फव्वारा था जिसमें हमेशा ताज़ा पानी रहता था।",
                        it: "Nella piazza, una vecchia fontana aveva sempre acqua fresca.",
                        fr: "Sur la place, une vieille fontaine avait toujours de l'eau fraiche.",
                        ar: "وفي الميدان كانت توجد نافورة قديمة فيها ماء عذب دائماً.",
                        zh: "广场上有一座古老的喷泉，里面总是有清水。",
                      }),
                    },
                    {
                      tgt: "Adults sat around it to talk and rest after work.",
                      sup: supportStoryText(supportLang, {
                        en: "Adults sat around it to talk and rest after work.",
                        es: "Los adultos se sentaban alrededor para hablar y descansar después del trabajo.",
                        hi: "बड़े लोग काम के बाद बातें करने और आराम करने के लिए उसके आसपास बैठते थे।",
                        it: "Gli adulti si sedevano intorno per parlare e riposare dopo il lavoro.",
                        fr: "Les adultes s'asseyaient autour pour parler et se reposer apres le travail.",
                        ar: "وكان الكبار يجلسون حولها ليتحدثوا ويستريحوا بعد العمل.",
                        zh: "大人们下班后会坐在它周围聊天和休息。",
                      }),
                    },
                  ]
                : [
                    {
                      tgt: "Había una vez un pequeño pueblo en México llamado San Miguel.",
                      sup: supportStoryText(supportLang, {
                        en: "Once upon a time, there was a small town in Mexico called San Miguel.",
                        es: "Había una vez un pequeño pueblo en México llamado San Miguel.",
                        hi: "एक समय मेक्सिको में सैन मिगेल नाम का एक छोटा-सा कस्बा था।",
                        it: "C'era una volta un piccolo paese in Messico chiamato San Miguel.",
                        fr: "Il etait une fois un petit village au Mexique appele San Miguel.",
                        ar: "كان يا ما كان، كانت هناك بلدة صغيرة في المكسيك اسمها سان ميجيل.",
                        zh: "从前，墨西哥有一个叫圣米格尔的小镇。",
                      }),
                    },
                    {
                      tgt: "El pueblo tenía una plaza muy bonita donde los niños jugaban todos los días.",
                      sup: supportStoryText(supportLang, {
                        en: "The town had a very beautiful square where the children played every day.",
                        es: "El pueblo tenía una plaza muy bonita donde los niños jugaban todos los días.",
                        hi: "उस कस्बे में एक बहुत सुंदर चौक था जहाँ बच्चे हर दिन खेलते थे।",
                        it: "Il paese aveva una piazza molto bella dove i bambini giocavano ogni giorno.",
                        fr: "Le village avait une tres belle place ou les enfants jouaient tous les jours.",
                        ar: "كان فيها ميدان جميل جداً يلعب فيه الأطفال كل يوم.",
                        zh: "小镇有一个很漂亮的广场，孩子们每天都在那里玩。",
                      }),
                    },
                    {
                      tgt: "En la plaza, había una fuente antigua que siempre tenía agua fresca.",
                      sup: supportStoryText(supportLang, {
                        en: "In the square, there was an old fountain that always had fresh water.",
                        es: "En la plaza, había una fuente antigua que siempre tenía agua fresca.",
                        hi: "उस चौक में एक पुराना फव्वारा था जिसमें हमेशा ताज़ा पानी रहता था।",
                        it: "Nella piazza c'era una vecchia fontana che aveva sempre acqua fresca.",
                        fr: "Sur la place, il y avait une vieille fontaine qui avait toujours de l'eau fraiche.",
                        ar: "وفي الميدان كانت توجد نافورة قديمة فيها ماء عذب دائماً.",
                        zh: "广场上有一座古老的喷泉，里面总是有清水。",
                      }),
                    },
                    {
                      tgt: "Los adultos se sentaban alrededor de la fuente para hablar y descansar después del trabajo.",
                      sup: supportStoryText(supportLang, {
                        en: "The adults sat around the fountain to talk and rest after work.",
                        es: "Los adultos se sentaban alrededor de la fuente para hablar y descansar después del trabajo.",
                        hi: "बड़े लोग काम के बाद बातें करने और आराम करने के लिए फव्वारे के आसपास बैठते थे।",
                        it: "Gli adulti si sedevano intorno alla fontana per parlare e riposare dopo il lavoro.",
                        fr: "Les adultes s'asseyaient autour de la fontaine pour parler et se reposer apres le travail.",
                        ar: "وكان الكبار يجلسون حول النافورة ليتحدثوا ويستريحوا بعد العمل.",
                        zh: "大人们下班后会坐在喷泉周围聊天和休息。",
                      }),
                    },
                  ],
          };
      setStoryData(fallback);
      storyCacheRef.current = fallback;
      toast({
        title: t(uiLang, "story_demo_title"),
        description: t(uiLang, "story_demo_desc"),
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
    setGenerationError(false);
    stopAllAudio();
    setRevealedTranslations({});
    setSentenceTranslations({});
    setTranslatingSentences({});
    setSessionXp(0);
    sessionAwardedRef.current = false;
    rewardedSentenceKeysRef.current.clear();
    try {
      usageStatsRef.current.storyGenerations++;
      const tLang = targetLang; // 'es' | 'en' | 'nah'
      const tName = LLM_LANG_NAME(tLang);
      const diff = getStoryDifficulty(cefrLevel, { includeTranslations: false });

      // Check for tutorial mode first
      const isTutorial = lessonContent?.topic === "tutorial";

      // Stories use character scripts so voice assignment can stay stable.
      const selectedStoryType = "conversation";
      setStoryType(selectedStoryType);

      // NDJSON protocol. We instruct the model to strictly emit one compact JSON object per line.
      // Special handling for tutorial mode - use very simple "hello" content only
      const scenarioDirective = isTutorial
        ? `TUTORIAL MODE - ABSOLUTE BEGINNER: Create an extremely simple story about saying hello. Use ONLY basic greetings like 'hello', 'hi', 'good morning', 'goodbye'. Each sentence should be 2-5 words maximum. The story MUST be only 2-3 lines/sentences.`
        : lessonContent?.scenario || lessonContent?.topic
          ? lessonContent.scenario
            ? `STRICT REQUIREMENT: The scenario MUST be about: ${lessonContent.scenario}. Do NOT create stories about other topics. This is lesson-specific content and you MUST NOT diverge.`
            : `STRICT REQUIREMENT: The story MUST focus on the topic: ${lessonContent.topic}. Do NOT create stories about other topics. This is lesson-specific content and you MUST NOT diverge.`
          : "Create a simple conversational story appropriate for language practice.";
      const curriculumPromptContext = buildCurriculumPromptContext(
        lessonContent?.curriculumContext,
        { mode: "stories" },
      );

      const prompt = buildSpeakingStoryPrompt({
        targetName: tName,
        targetLang: tLang,
        difficulty: diff,
        isTutorial,
        scenarioDirective,
        curriculumContext: curriculumPromptContext,
      });

      // Stream from Gemini
      const resp = await storyModel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { thinkingConfig: { thinkingBudget: STORY_THINKING_BUDGET } },
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
        if (obj?.type === "sentence" && obj.tgt) {
          const item = {
            tgt: String(obj.tgt || "").trim(),
            sup: "",
            // Include character name for conversation scripts
            ...(obj.character && { character: String(obj.character).trim() }),
            ...(normalizeCharacterGender(obj.gender) && {
              gender: normalizeCharacterGender(obj.gender),
            }),
          };
          const key = `${item.character || ""}|||${item.tgt}`;
          if (seenLineKeys.has(key)) return;
          seenLineKeys.add(key);
          sentences.push(item);

          // Distinct-script targets may begin with a name, acronym, or "OK".
          // Buffer those short Latin-only lines until the episode has enough
          // target-script evidence to safely reveal it.
          if (!revealed) {
            if (
              isStoryTargetCollectionCompatible(
                sentences.map((sentence) => sentence.tgt),
                tLang,
              )
            ) {
              setStoryData({
                fullStory: {
                  tgt: sentences.map((sentence) => sentence.tgt).join(" "),
                  sup: "",
                },
                sentences: [...sentences],
                storyType: selectedStoryType,
              });
              setIsLoading(false);
              revealed = true;
            }
            return;
          }

          // Once the buffered opening passes validation, append new lines.
          setStoryData((prev) => {
            const prevSentences = prev?.sentences || [];
            const alreadyExists = prevSentences.some(
              (s) => s.tgt === item.tgt && s.sup === item.sup,
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
              storyType: selectedStoryType,
            };
          });
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
        if (
          sentences.length &&
          isStoryTargetCollectionCompatible(
            sentences.map((sentence) => sentence.tgt),
            tLang,
          )
        ) {
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

      if (
        sentences.length &&
        !isStoryTargetCollectionCompatible(
          sentences.map((sentence) => sentence.tgt),
          tLang,
        )
      ) {
        throw new Error(
          `Story dialogue is not in the requested target language (${tLang})`,
        );
      }
      if (!revealed) throw new Error("No story produced.");

      // Final tidy/validation (keeps your existing UX expectations)
      setStoryData((prev) => {
        const normalized = {
          fullStory: { tgt: prev.fullStory.tgt, sup: "" },
          sentences: prev.sentences.map((s) => ({
            tgt: s.tgt,
            sup: "",
            ...(s.character && { character: s.character }),
            ...(s.gender && { gender: s.gender }),
          })),
        };
        const validated = validateAndFixStorySentences(
          normalized,
          "tgt",
          "sup",
        );
        // Preserve character data and storyType from original sentences
        const finalData = {
          ...validated,
          storyType: selectedStoryType,
          sentences: validated.sentences.map((s, idx) => ({
            ...s,
            ...(prev.sentences[idx]?.character && {
              character: prev.sentences[idx].character,
            }),
            ...(prev.sentences[idx]?.gender && {
              gender: prev.sentences[idx].gender,
            }),
          })),
        };
        storyCacheRef.current = finalData;
        // Note: Do NOT call other state setters inside setStoryData callback
        // as it causes race conditions. State resets are handled separately.
        return finalData;
      });
    } catch (error) {
      console.error(
        "Gemini streaming failed; falling back to backend/demo.",
        error,
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
  // Auto-generate story on mount if lessonContent is provided
  useEffect(() => {
    // ⚠️ if we don't have progress yet, don't generate
    if (!progressReady) return;

    if (storyData || isLoading || generationError) return;
    generateStoryGeminiStream();
  }, [
    lessonContent,
    storyData,
    isLoading,
    progressReady,
    generationError,
    generateStoryGeminiStream,
  ]);

  /* ----------------------------- Skip module ----------------------------- */
  const handleSkipModule = () => {
    playSound(nextButtonSound);
    stopAllAudio();
    setLastFeedback(null);
    // If in lesson mode, call onSkip to switch to next random module type
    if (onSkip && typeof onSkip === "function") {
      console.log("[StoryMode] Skipping to next lesson module");
      onSkip();
      return;
    }

    // Not in lesson mode - show a message
    toast({
      title: t(uiLang, "story_skip_unavailable_title"),
      description: t(uiLang, "story_skip_unavailable_desc"),
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
      voice = null,
      personality = null,
    } = {},
  ) => {
    const request = audioRequestRef.current;
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

      const player = await getTTSPlayer({
        text,
        langTag,
        voice: voice || STORY_NARRATOR_VOICE,
        personality,
      });
      if (request !== audioRequestRef.current) {
        player.ready?.catch(() => {});
        player.cleanup?.();
        return;
      }
      currentAudioUrlRef.current = player.audioUrl;

      let tokenMap = null;
      if (alignToText) {
        tokenMap = createTokenMap(text);
        setTokenizedText(tokenMap.tokens);
        setHighlightedWordIndex(-1);
      }

      const audio = player.audio;
      currentAudioRef.current = audio;

      let stopHighlighter = null;
      audio.onloadedmetadata = () => {
        if (alignToText && tokenMap) {
          stopHighlighter = startAudioAlignedHighlight(
            audio,
            tokenMap.tokens,
            (idx) => setHighlightedWordIndex(idx),
          );
        }
      };
      audio.onplaying = () => onStart?.();
      audio.onended = () => {
        stopHighlighter?.();
        onEnd?.();
        setSynthesizing?.(false);
        currentAudioRef.current = null;
        player.cleanup?.();
      };
      audio.onerror = (e) => {
        stopHighlighter?.();
        console.error("Audio playback error", e);
        onEnd?.();
        setSynthesizing?.(false);
        currentAudioRef.current = null;
        player.cleanup?.();
      };

      await player.ready;
      if (request !== audioRequestRef.current) { player.cleanup?.(); return; }
      setSynthesizing?.(false);
      const playAttempt = Promise.resolve(audio.play());
      // Realtime/WebRTC audio does not consistently settle play() or fire the
      // media element's playing event. Its transport signal is the reliable
      // indication that the requested narration has started.
      if (player.playbackStarted) {
        await Promise.race([
          playAttempt.then(() => true),
          player.playbackStarted,
        ]);
        void playAttempt.catch(() => {});
      } else {
        await playAttempt;
      }
    } catch (e) {
      if (request !== audioRequestRef.current) return;
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
      console.error("TTS failed; ending playback:", err);
      stopAllAudio();
    }
  };

  const playTargetTTS = async (text, voice = null, personality = null) => {
    if (!text) return;
    primeTTSAudio();
    stopAllAudio();
    setIsPlayingTarget(true);
    try {
      await playWithOpenAITTS(text, (BCP47[targetLang] || BCP47.es).tts, {
        alignToText: false,
        onEnd: () => setIsPlayingTarget(false),
        setSynthesizing: setIsSynthesizingTarget,
        voice,
        personality,
      });
    } catch (error) {
      console.warn("[Stories] Practice audio playback failed", error);
      stopAllAudio();
      setIsSynthesizingTarget(false);
    }
  };

  const toggleSentenceTranslation = useCallback(async (index, sentence) => {
    const key = `${index}::${sentence?.tgt || ""}`;
    if (!sentence?.tgt) return;
    playSound(selectSound);

    if (revealedTranslations[key]) {
      setRevealedTranslations((value) => ({ ...value, [key]: false }));
      return;
    }

    setRevealedTranslations((value) => ({ ...value, [key]: true }));
    if (sentenceTranslations[key] || translatingSentences[key]) return;

    setTranslatingSentences((value) => ({ ...value, [key]: true }));
    try {
      const translated = await storyServices.translate(
        sentence.tgt,
        LLM_LANG_NAME(targetLang),
        LLM_LANG_NAME(supportLang),
      );
      if (translated) {
        setSentenceTranslations((value) => ({ ...value, [key]: translated }));
      }
    } catch (error) {
      console.warn("[Stories] Practice translation request failed", error);
      setRevealedTranslations((value) => ({ ...value, [key]: false }));
    } finally {
      setTranslatingSentences((value) => ({ ...value, [key]: false }));
    }
  }, [playSound, revealedTranslations, sentenceTranslations, translatingSentences, targetLang, supportLang]);

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

      return { handleBoundary, tokenMap };
    },
    [createTokenMap, currentWordIndex],
  );

  /* ----------------------------- Recording + strict scoring ----------------------------- */
  const currentSentence = storyData?.sentences?.[currentSentenceIndex];
  const totalSentences = storyData?.sentences?.length || 0;
  const isLastSentence = currentSentenceIndex >= totalSentences - 1;

  const isCharacterStory =
    (storyData?.storyType === "conversation" || storyType === "conversation") &&
    storyData?.sentences?.some((s) => s.character);

  const autoplaySentenceRef = useRef(null);
  autoplaySentenceRef.current = () => {
    const name = isCharacterStory ? currentSentence?.character || "Sheilfer" : "Sheilfer";
    playTargetTTS(
      currentSentence?.tgt,
      isCharacterStory ? getStoryCharacterVoice(name, user) : STORY_NARRATOR_VOICE,
      getStoryCharacterPersonality(name),
    );
  };
  useEffect(() => {
    if (isLoading || !currentSentence?.tgt) return;
    autoplaySentenceRef.current();
    return stopAllAudio;
  }, [currentSentenceIndex, currentSentence?.tgt, isLoading, stopAllAudio]);

  const storyCharacterPortraits = useMemo(() => {
    const map = {};
    storyData?.sentences?.forEach((s) => {
      const charName = s.character || "Sheilfer";
      if (!map[charName]) {
        map[charName] = getRandomStoryCharacterPortraitId(charName, user);
      }
    });
    if (!map["Sheilfer"]) {
      map["Sheilfer"] = getRandomStoryCharacterPortraitId("Sheilfer", user);
    }
    return map;
  }, [storyData, user]);

  const visibleSentences = (storyData?.sentences || []).slice(
    0,
    currentSentenceIndex + 1,
  );

  const completedSentences = currentSentenceIndex + (sentenceCompleted ? 1 : 0);
  const progressPct =
    totalSentences > 0
      ? Math.round((completedSentences / totalSentences) * 100)
      : 0;
  const lessonProgress =
    totalSentences > 0
      ? {
          pct: progressPct,
          earned: completedSentences,
          total: totalSentences,
          label:
            t(uiLang, "story_progress") ||
            t(uiLang, "vocab_lesson_progress") ||
            "Lesson progress",
          showAlways: true,
        }
      : null;

  const rawStoryName =
    resolveStoryTitleText(storyData?.title, uiLang, supportLang, targetLang) ||
    resolveStoryTitleText(lessonContent?.title, uiLang, supportLang, targetLang) ||
    resolveStoryTitleText(lesson?.title, uiLang, supportLang, targetLang) ||
    resolveStoryTitleText(lessonContent?.scenario, uiLang, supportLang, targetLang) ||
    resolveStoryTitleText(lessonContent?.topic, uiLang, supportLang, targetLang) ||
    t(effectiveLang, "story_title") ||
    copy.story ||
    "Story";
  const practicePrefix = copy.practice || "Practice";
  const escapedPrefixes = [
    "sentence practice",
    "practice",
    "call",
    "story",
    copy.call,
    copy.practice,
    copy.story,
    copy.speaking,
  ]
    .filter(Boolean)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const cleanSpeakingTitle = rawStoryName
    .replace(new RegExp(`^(?:${escapedPrefixes}):\\s*`, "i"), "")
    .trim();
  const displaySpeakingTitle = cleanSpeakingTitle
    ? `${practicePrefix}: ${cleanSpeakingTitle}`
    : practicePrefix;

  const nextSentenceLabel =
    t(effectiveLang, "stories_next_sentence") ||
    supportStoryText(effectiveLang, {
      en: "Next Sentence",
      es: "Siguiente Oración",
      hi: "अगला वाक्य",
      it: "Frase successiva",
      fr: "Phrase suivante",
      ar: "الجملة التالية",
    });
  const finishLabel =
    t(effectiveLang, "stories_finish") ||
    supportStoryText(effectiveLang, {
      en: "Finish",
      es: "Terminar",
      hi: "समाप्त करें",
      it: "Fine",
      fr: "Terminer",
      ar: "إنهاء",
    });

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
          title: t(effectiveLang, "story_audio_eval_error_title"),
          description: t(effectiveLang, "story_audio_eval_error_desc"),
          status: "error",
          duration: 2500,
          position: "top",
        });
        return;
      }

      if (!evaluation) return;

      if (!evaluation.pass) {
        const tips = speechReasonTips(evaluation.reasons, {
          uiLang: effectiveLang,
          targetLabel: targetDisplayName,
        });

        setLastSuccessInfo(null);
        setSentenceCompleted(false);
        setLastFeedback({
          ok: false,
          label: uiText.almost,
          explanation:
            tips.length > 0
              ? tips.join(" ")
              : t(effectiveLang, "practice_try_again_hint") ||
                copy.speechIncorrect ||
                "Try saying the sentence again clearly.",
        });

        // Companion brain: a missed sentence-practice attempt (pronunciation) is
        // a high-signal weak spot — bank it for tomorrow's repair.
        captureCompanionMemory({
          npub: npubLive,
          targetLang,
          supportLang,
          sourceMode: "story",
          concept: target,
          userAnswer: recognizedText || "",
          expectedAnswer: target,
          cefrLevel,
          sourceContext: "story",
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

      const sentenceKey = `${currentSentenceIndex}::${target}`;
      const xpAwarded = claimPracticeStoryTurnReward(
        rewardedSentenceKeysRef.current,
        sentenceKey,
      );

      if (xpAwarded > 0) {
        setSessionXp((xp) => xp + xpAwarded);
        if (npubLive) {
          awardXp(npubLive, xpAwarded, targetLang, {
            skillTreeLessonId: lesson?.id,
          }).catch(() => {});
        }
      }

      // Each line awards once; repeated callbacks for the same line log 0 XP.
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
        xpAwarded,
        method,
      }).catch(() => {});

      setLastSuccessInfo({
        score: evaluation.score,
        recognizedText,
        translation: currentSentence?.sup || "",
      });

      setLastFeedback({
        ok: true,
        label: uiText.wellDone,
        xp: xpAwarded,
        subtext:
          typeof evaluation.score === "number"
            ? `${uiText.score}: ${evaluation.score}%`
            : null,
      });

      // Mark sentence as completed, wait for user to click "Next"
      setSentenceCompleted(true);
    },
    [
      currentSentence,
      currentSentenceIndex,
      lesson?.id,
      supportLang,
      targetDisplayName,
      targetLang,
      toast,
      uiLang,
      uiText,
    ],
  );

  const {
    startRecording: startSpeakRecording,
    stopRecording: stopSpeakRecording,
    isRecording: isSpeakRecording,
    isConnecting: isSpeakConnecting,
    supportsSpeech: supportsSpeak,
  } = useSpeechPractice({
    targetText: currentSentence?.tgt || "",
    targetLang,
    onResult: handleEvaluationResult,
    timeoutMs: pauseMs,
  });

  const isRecording = isSpeakRecording;
  const isConnecting = isSpeakConnecting;

  const handleTestSubmit = useCallback(
    (isCorrect = true) => {
      if (!currentSentence?.tgt) return;
      stopAllAudio();
      if (isSpeakRecording) {
        try {
          stopSpeakRecording();
        } catch {}
      }

      if (isCorrect) {
        handleEvaluationResult({
          evaluation: {
            pass: true,
            score: 95,
            reasons: [],
          },
          recognizedText: currentSentence.tgt,
          confidence: 0.98,
          method: "test",
        });
      } else {
        handleEvaluationResult({
          evaluation: {
            pass: false,
            score: 42,
            reasons: ["pronunciation"],
          },
          recognizedText: "...",
          confidence: 0.42,
          method: "test",
        });
      }
    },
    [
      currentSentence,
      handleEvaluationResult,
      isSpeakRecording,
      stopAllAudio,
      stopSpeakRecording,
    ],
  );

  const handleRecordPress = useCallback(async () => {
    stopAllAudio();
    if (isSpeakRecording) {
      stopSpeakRecording();
      return;
    }

    setLastSuccessInfo(null);
    setLastFeedback(null);
    playSound(submitActionSound);

    try {
      await startSpeakRecording();
    } catch (err) {
      const code = err?.code;
      if (code === "no-speech-recognition") {
        toast({
          title: t(uiLang, "story_speech_unavailable_title"),
          description: t(uiLang, "story_speech_unavailable_desc"),
          status: "warning",
          duration: 3500,
        });
      } else if (code === "mic-denied") {
        toast({
          title: t(uiLang, "flashcard_mic_denied_title"),
          description: t(uiLang, "flashcard_mic_denied_desc"),
          status: "error",
          duration: 3200,
        });
      } else {
        toast({
          title: t(uiLang, "vocab_recording_failed"),
          description: t(uiLang, "vocab_recording_failed_desc"),
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

  /* ----------------------------- Log session completion once ----------------------------- */
  const finalizePracticeSession = async (earnedXp, passedSentences) => {
    const npubLive = strongNpub(useUserStore.getState().user);
    if (!npubLive) return;

    if (sessionAwardedRef.current) return;
    sessionAwardedRef.current = true;

    try {
      await saveStoryTurn(npubLive, {
        ok: true,
        mode: "story-session-complete",
        lang: targetLang,
        supportLang,
        totalSentences: storyData?.sentences?.length || 0,
        passedSentences,
        xpAwarded: 0,
        sessionXp: earnedXp,
      });
    } catch {}
  };

  // Handle manual advancement to next sentence
  const handleNextSentence = async () => {
    playSound(nextButtonSound);
    const isLast =
      currentSentenceIndex >= (storyData?.sentences?.length || 0) - 1;

    if (!isLast) {
      setCurrentSentenceIndex((p) => p + 1);
      setSentenceCompleted(false);
      setLastSuccessInfo(null);
      setLastFeedback(null);
    } else {
      const totalSentences = storyData?.sentences?.length || 0;
      const latestPassed = Math.min(
        totalSentences,
        rewardedSentenceKeysRef.current.size,
      );
      const totalSessionXp = latestPassed * PRACTICE_STORY_TURN_XP;
      setSessionXp(totalSessionXp);
      setSessionSummary({ passed: latestPassed, total: totalSentences });
      await finalizePracticeSession(totalSessionXp, latestPassed);

      setSentenceCompleted(false);
      setLastSuccessInfo(null);
      setLastFeedback(null);

      if (onSkip) {
        onSkip();
      } else if (onNewStory) {
        onNewStory();
      } else {
        setStoryData(null);
        storyCacheRef.current = null;
        setCurrentSentenceIndex(0);
        generateStoryGeminiStream();
      }
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
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------- Loading / Empty ----------------------------- */
  if (generationError && !storyData) {
    return (
      <StoryLoadingScreen
        error={copy.generationError}
        onRetry={() => {
          setGenerationError(false);
          generateStoryGeminiStream();
        }}
        retryLabel={copy.retry}
        onSkip={onSkip ? handleSkipModule : null}
        skipLabel={copy.skip || t(effectiveLang, "practice_skip_question")}
        variant="practice"
      />
    );
  }

  if (isLoading || !storyData) {
    return (
      <StoryLoadingScreen
        title={copy.loading || uiText.generatingTitle}
        subtitle={copy.loadingSub || uiText.generatingSub}
        onSkip={onSkip ? handleSkipModule : null}
        skipLabel={copy.skip || t(effectiveLang, "practice_skip_question")}
        variant="practice"
      />
    );
  }

  /* ----------------------------- Main UI ----------------------------- */
  return (
    <Box>
      {/* Header */}
      {sessionXp > 0 && (
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
            py={{ base: 1, md: 3 }}
            color={APP_TEXT_PRIMARY}
            borderColor="rgba(255, 255, 255, 0.1)"
            top={0}
            zIndex={100}
          >
            <Spacer />
            <HStack spacing={3} align="center" flexWrap="wrap" justify="flex-end">
              <Badge colorScheme="teal" variant="subtle" fontSize="sm">
                +{sessionXp}
              </Badge>
            </HStack>
          </HStack>
        </motion.div>
      )}

      {/* Content */}
      <Box
        px={{ base: 0, md: 4 }}
        py={{ base: 1, md: 6 }}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <motion.div
          key="sentence-practice"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? {} : { duration: 0.5 }}
          style={{ width: "100%", maxWidth: "1280px" }}
        >
          <VStack spacing={{ base: 3, md: 6 }} align="stretch" w="100%">
            <Box>
              <Text
                as="h2"
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="600"
                color={APP_TEXT_PRIMARY}
                {...supportTextProps}
                sx={mergeBidiSx(supportTextProps)}
              >
                {displaySpeakingTitle}
              </Text>
            </Box>
            <Box
              bg={APP_SURFACE_ELEVATED}
              p={6}
              rounded="20px"
              style={questionSquircleStyle}
              border={`1px solid ${APP_BORDER}`}
              boxShadow={APP_SHADOW}
            >
              {isCharacterStory ? (
                <VStack spacing={4} align="stretch">
                  {visibleSentences.map((sentence, idx) => {
                    const isCurrent = idx === currentSentenceIndex;
                    const isLeft = idx % 2 === 0;
                    const isThisLinePlaying =
                      playingLineIndex === idx ||
                      (isCurrent && isPlayingTarget);
                    const characterVoice = sentence.character
                      ? getStableCharacterVoice(sentence.character)
                      : STORY_NARRATOR_VOICE;
                    const characterPersonality = sentence.character
                      ? getStoryCharacterPersonality(sentence.character)
                      : null;
                    const translationKey = `${idx}::${sentence.tgt}`;
                    const translationVisible = Boolean(
                      revealedTranslations[translationKey],
                    );
                    const isTranslating = Boolean(
                      translatingSentences[translationKey],
                    );

                    return (
                      <Flex
                        key={idx}
                        ref={isCurrent ? activeSentenceRef : undefined}
                        justify={isLeft ? "flex-start" : "flex-end"}
                        w="100%"
                      >
                        <HStack
                          spacing={3}
                          align="flex-start"
                          maxW="85%"
                          flexDirection={isLeft ? "row" : "row-reverse"}
                        >
                          <StoryCharacterAvatar
                            name={sentence.character || (isLeft ? "Sheilfer" : "You")}
                            portraitId={
                              sentence.character
                                ? storyCharacterPortraits[sentence.character]
                                : isLeft
                                  ? storyCharacterPortraits["Sheilfer"]
                                  : undefined
                            }
                            user={user}
                            userLabel={(copy.you || "You").toUpperCase()}
                            size="36px"
                            isSpeaking={isThisLinePlaying}
                            accentColor={isLeft ? "teal.400" : "purple.400"}
                          />
                          <IconButton
                            onClick={() => {
                              setPlayingLineIndex(idx);
                              playTargetTTS(
                                sentence.tgt,
                                characterVoice,
                                characterPersonality,
                              ).finally(() => setPlayingLineIndex(null));
                            }}
                            variant="outline"
                            borderColor={
                              isCurrent
                                ? isLeft
                                  ? "teal.400"
                                  : "purple.400"
                                : APP_BORDER_STRONG
                            }
                            color={APP_TEXT_PRIMARY}
                            _hover={{ bg: APP_SURFACE_MUTED }}
                            size="xs"
                            aria-label={`${copy.play}: ${
                              sentence.character || "line"
                            }`}
                            icon={renderSpeakerIcon(
                              isThisLinePlaying &&
                                (isSynthesizingTarget || isPlayingTarget),
                            )}
                            flexShrink={0}
                            mt={1}
                          />
                          <Box
                            px={3}
                            py={2}
                            bg={
                              isLeft
                                ? "rgba(56, 178, 172, 0.15)"
                                : "rgba(99, 102, 241, 0.15)"
                            }
                            borderRadius="lg"
                            style={questionSquircleStyle}
                            borderLeft={isLeft ? "3px solid" : "none"}
                            borderRight={isLeft ? "none" : "3px solid"}
                            borderColor={
                              isLeft ? "teal.400" : "purple.400"
                            }
                            boxShadow={
                              isCurrent
                                ? `0 0 0 2px ${
                                    isLeft
                                      ? "rgba(56, 178, 172, 0.6)"
                                      : "rgba(99, 102, 241, 0.6)"
                                  }`
                                : "none"
                            }
                            opacity={isCurrent ? 1 : 0.85}
                            transition="all 0.25s ease"
                          >
                            <HStack justify="space-between" align="start" spacing={2} mb={1}>
                              {sentence.character ? (
                              <Text
                                fontSize="sm"
                                fontWeight="700"
                                color={
                                  isLeft ? "teal.300" : "purple.300"
                                }
                              >
                                {sentence.character.toLowerCase() === "you"
                                  ? (copy.you || sentence.character)
                                  : sentence.character}
                              </Text>
                              ) : <Box />}
                              <IconButton
                                onClick={() => toggleSentenceTranslation(idx, sentence)}
                                variant="ghost"
                                color={translationVisible ? "teal.400" : APP_TEXT_SECONDARY}
                                _hover={{ color: translationVisible ? "teal.300" : APP_TEXT_PRIMARY }}
                                size="xs"
                                minW="28px"
                                h="28px"
                                aria-label={translationVisible ? copy.hideTranslation : copy.translation}
                                title={translationVisible ? copy.hideTranslation : copy.translation}
                                aria-pressed={translationVisible}
                                isDisabled={isTranslating}
                                icon={isTranslating ? <Spinner size="xs" /> : <MdOutlineTranslate size={18} />}
                                flexShrink={0}
                                mt={-1}
                                me={-1}
                              />
                            </HStack>
                            <Text
                              fontSize="lg"
                              fontWeight="500"
                              color={APP_TEXT_PRIMARY}
                              lineHeight="1.6"
                              {...targetTextProps}
                              sx={mergeBidiSx(targetTextProps)}
                            >
                              {sentence.tgt}
                            </Text>
                            {translationVisible && sentenceTranslations[translationKey] && (
                              <Text
                                fontSize="sm"
                                color={APP_TEXT_SECONDARY}
                                lineHeight="1.4"
                                mt={1}
                                {...supportTextProps}
                                sx={mergeBidiSx(supportTextProps)}
                              >
                                {sentenceTranslations[translationKey]}
                              </Text>
                            )}
                          </Box>
                        </HStack>
                      </Flex>
                    );
                  })}
                </VStack>
              ) : (
                <VStack spacing={4} align="stretch">
                  {visibleSentences.map((sentence, idx) => {
                    const isCurrent = idx === currentSentenceIndex;
                    const isThisLinePlaying =
                      playingLineIndex === idx ||
                      (isCurrent && isPlayingTarget);
                    const translationKey = `${idx}::${sentence.tgt}`;
                    const translationVisible = Boolean(
                      revealedTranslations[translationKey],
                    );
                    const isTranslating = Boolean(
                      translatingSentences[translationKey],
                    );

                    return (
                      <Flex
                        key={idx}
                        ref={isCurrent ? activeSentenceRef : undefined}
                        w="100%"
                        justify="flex-start"
                      >
                        <HStack spacing={3} align="flex-start" w="100%">
                          <StoryCharacterAvatar
                            name="Sheilfer"
                            portraitId={storyCharacterPortraits["Sheilfer"]}
                            user={user}
                            size="36px"
                            isSpeaking={isThisLinePlaying}
                            accentColor="teal.400"
                          />
                          <IconButton
                            onClick={() => {
                              setPlayingLineIndex(idx);
                              playTargetTTS(
                                sentence.tgt,
                                STORY_NARRATOR_VOICE,
                                getStoryCharacterPersonality("Sheilfer"),
                              ).finally(() => setPlayingLineIndex(null));
                            }}
                            variant="outline"
                            borderColor={
                              isCurrent ? "teal.400" : APP_BORDER_STRONG
                            }
                            color={APP_TEXT_PRIMARY}
                            _hover={{ bg: APP_SURFACE_MUTED }}
                            size="xs"
                            aria-label={`${copy.play}: ${idx + 1}`}
                            icon={renderSpeakerIcon(
                              isThisLinePlaying &&
                                (isSynthesizingTarget || isPlayingTarget),
                            )}
                            flexShrink={0}
                            mt={1}
                          />
                          <Box
                            flex="1"
                            px={3}
                            py={2}
                            bg="rgba(56, 178, 172, 0.1)"
                            borderRadius="lg"
                            style={questionSquircleStyle}
                            borderLeft="3px solid"
                            borderColor={isCurrent ? "teal.400" : "teal.600"}
                            boxShadow={
                              isCurrent ? "0 0 0 2px rgba(56, 178, 172, 0.5)" : "none"
                            }
                            opacity={isCurrent ? 1 : 0.85}
                            transition="all 0.25s ease"
                            position="relative"
                          >
                            <IconButton
                              onClick={() => toggleSentenceTranslation(idx, sentence)}
                              variant="ghost"
                              color={translationVisible ? "teal.400" : APP_TEXT_SECONDARY}
                              _hover={{ color: translationVisible ? "teal.300" : APP_TEXT_PRIMARY }}
                              size="xs"
                              minW="28px"
                              h="28px"
                              position="absolute"
                              top={1}
                              right={1}
                              aria-label={translationVisible ? copy.hideTranslation : copy.translation}
                              title={translationVisible ? copy.hideTranslation : copy.translation}
                              aria-pressed={translationVisible}
                              isDisabled={isTranslating}
                              icon={isTranslating ? <Spinner size="xs" /> : <MdOutlineTranslate size={18} />}
                            />
                            <Text
                              fontSize="lg"
                              fontWeight="500"
                              color={APP_TEXT_PRIMARY}
                              lineHeight="1.6"
                              pe={8}
                              {...targetTextProps}
                              sx={mergeBidiSx(targetTextProps)}
                            >
                              {sentence.tgt}
                            </Text>
                            {translationVisible && sentenceTranslations[translationKey] && (
                              <Text
                                fontSize="sm"
                                color={APP_TEXT_SECONDARY}
                                lineHeight="1.4"
                                mt={1}
                                {...supportTextProps}
                                sx={mergeBidiSx(supportTextProps)}
                              >
                                {sentenceTranslations[translationKey]}
                              </Text>
                            )}
                          </Box>
                        </HStack>
                      </Flex>
                    );
                  })}
                </VStack>
              )}
            </Box>
          </VStack>
        </motion.div>

        <Box w="full" maxW="720px" mx="auto" mt={6}>
            <QuestionActionArea
              feedback={lastFeedback ? lastFeedback.ok : null}
              actions={
                lastFeedback?.ok ? null : (
                  <ActivityActionRow
                    tone={
                      isRecording
                        ? "stop"
                        : lastFeedback && !lastFeedback.ok
                        ? "danger"
                        : "speak"
                    }
                    primary={
                      <Button
                        key={isRecording ? "stop" : "record"}
                        onClick={handleRecordPress}
                        size="lg"
                        height="60px"
                        px={8}
                        rounded="full"
                        bg={
                          isRecording
                            ? SOFT_STOP_BUTTON_BG
                            : isConnecting
                            ? "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)"
                            : STORY_PRIMARY_BUTTON_BG
                        }
                        boxShadow={
                          isRecording
                            ? `0px 4px 0px ${SOFT_STOP_BUTTON_EDGE}`
                            : isConnecting
                            ? "0px 4px 0px #eab308"
                            : `0px 4px 0px ${STORY_PRIMARY_BUTTON_EDGE}`
                        }
                        color="white"
                        fontWeight="600"
                        fontSize="lg"
                        leftIcon={
                          isConnecting ? null : isRecording ? (
                            <FaStop />
                          ) : (
                            <FaMicrophone />
                          )
                        }
                        isDisabled={!supportsSpeak || !currentSentence?.tgt || isConnecting}
                        _hover={{
                          bg: isRecording
                            ? SOFT_STOP_BUTTON_HOVER_BG
                            : isConnecting
                            ? "linear-gradient(135deg, #ca8a04 0%, #a16207 100%)"
                            : STORY_PRIMARY_BUTTON_HOVER_BG,
                          transform: "translateY(-2px)",
                        }}
                        _active={{ transform: "translateY(0)" }}
                        aria-label={isRecording ? "Stop recording" : undefined}
                      >
                        {isConnecting
                          ? (copy.connectingMic || "Connecting")
                          : isRecording
                          ? (copy.stopRecording || "Stop")
                          : (copy.record || uiText.record)}
                      </Button>
                    }
                  >
                    {onSkip && (
                      <Button
                        onClick={handleSkipModule}
                        variant="ghost"
                        color={APP_TEXT_PRIMARY}
                        _hover={{ bg: APP_SURFACE_MUTED }}
                        width="fit-content"
                      >
                        {copy.skip || t(effectiveLang, "practice_skip_question")}
                      </Button>
                    )}
                    {/* Test buttons commented out
                    <Button
                      onClick={() => handleTestSubmit(true)}
                      variant="ghost"
                      color="teal.400"
                      _hover={{ bg: "rgba(56, 178, 172, 0.16)", color: "teal.300" }}
                      title="Test correct answer"
                      aria-label="Test correct answer"
                      isDisabled={!currentSentence || (lastFeedback && lastFeedback.ok)}
                    >
                      Test ✓
                    </Button>
                    <Button
                      onClick={() => handleTestSubmit(false)}
                      variant="ghost"
                      color="red.400"
                      _hover={{ bg: "rgba(229, 62, 62, 0.16)", color: "red.300" }}
                      title="Test incorrect answer"
                      aria-label="Test incorrect answer"
                      isDisabled={!currentSentence || (lastFeedback && lastFeedback.ok)}
                    >
                      Test ✗
                    </Button>
                    */}
                  </ActivityActionRow>
                )
              }
            >
              {lastFeedback && (
                <FeedbackRail
                  compact
                  ok={lastFeedback.ok}
                  xp={lastFeedback.xp || 0}
                  statusLabel={lastFeedback.label}
                  subtext={lastFeedback.subtext}
                  explanationText={lastFeedback.explanation}
                  lessonProgress={lessonProgress}
                  showNext={lastFeedback.ok}
                  onNext={handleNextSentence}
                  nextLabel={isLastSentence ? finishLabel : nextSentenceLabel}
                  t={(k) => t(effectiveLang, k)}
                  userLanguage={effectiveLang}
                />
              )}
            </QuestionActionArea>
          </Box>
      </Box>
    </Box>
  );
}
