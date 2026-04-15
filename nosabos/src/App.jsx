// src/App.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerCloseButton,
  DrawerOverlay,
  HStack,
  IconButton,
  Input,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Spacer,
  Switch,
  Text,
  Textarea,
  useToast,
  VStack,
  Wrap,
  Tab,
  TabList,
  Tabs,
  TabPanels,
  TabPanel,
  InputGroup,
  InputRightElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Divider,
  Flex,
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuOptionGroup,
  Portal,
  Badge,
  Tooltip,
  useDisclosure,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  SettingsIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ArrowBackIcon,
} from "@chakra-ui/icons";
import { CiUser, CiEdit } from "react-icons/ci";
import { MdOutlineSupportAgent } from "react-icons/md";
import {
  RiSpeakLine,
  RiBook2Line,
  RiBookmarkLine,
  RiRoadMapLine,
  RiFileList3Line,
  RiChat3Line,
  RiGamepadLine,
} from "react-icons/ri";
import {
  LuBadgeCheck,
  LuBookOpen,
  LuShuffle,
  LuLanguages,
  LuKeyRound,
  LuCalendarDays,
  LuCalendarCheck2,
} from "react-icons/lu";
import {
  PiCardsBold,
  PiPath,
  PiUsers,
  PiUsersBold,
  PiUsersThreeBold,
} from "react-icons/pi";
import { FiClock, FiCompass, FiPause, FiPlay, FiTarget } from "react-icons/fi";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import { database, simplemodel } from "./firebaseResources/firebaseResources";

import { Navigate, useLocation, useNavigate } from "react-router-dom";

import useUserStore from "./hooks/useUserStore";
import { useDecentralizedIdentity } from "./hooks/useDecentralizedIdentity";
import * as Tone from "tone";
import useSoundSettings from "./hooks/useSoundSettings";

import GrammarBook from "./components/GrammarBook";
import Onboarding from "./components/Onboarding";
import VoiceOrb from "./components/VoiceOrb";
import RealTimeTest from "./components/RealTimeTest";
import BottomDrawerDragHandle from "./components/BottomDrawerDragHandle";

import { translations } from "./utils/translation";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "./utils/llm";
import Vocabulary from "./components/Vocabulary";
import StoryMode from "./components/Stories";
import History from "./components/History";
import RPGGame from "./components/RPGGame/index.jsx";
import HelpChatFab from "./components/HelpChatFab";
import { WaveBar } from "./components/WaveBar";
import DailyGoalModal from "./components/DailyGoalModal";
import DailyGoalPetPanel from "./components/DailyGoalPetPanel.jsx";
import JobScript from "./components/JobScript"; // ⬅️ NEW TAB COMPONENT
import { IdentityPanel } from "./components/IdentityDrawer";
import SubscriptionGate from "./components/SubscriptionGate";
import { useNostrWalletStore } from "./hooks/useNostrWalletStore";
import { LuKey } from "react-icons/lu";
import AlphabetBootcamp from "./components/AlphabetBootcamp";
import TeamsDrawer from "./components/Teams/TeamsDrawer";
import NotesDrawer from "./components/NotesDrawer";
import RealWorldTasksModal, {
  REAL_WORLD_TASKS_REFRESH_MS,
} from "./components/RealWorldTasksModal";
import useNotesStore from "./hooks/useNotesStore";
import { subscribeToTeamInvites } from "./utils/teams";
import SkillTree from "./components/SkillTree";
import {
  startLesson,
  completeLesson,
  getLanguageXp,
} from "./utils/progressTracking";
import { awardXp } from "./utils/utils";
import {
  buildFlashcardReviewUpdate,
  getLocalDayKey,
} from "./utils/flashcardReview";
import { RiArrowLeftLine } from "react-icons/ri";
import SessionTimerModal from "./components/SessionTimerModal";
import ProficiencyTestModal from "./components/ProficiencyTestModal";
import GettingStartedModal from "./components/GettingStartedModal";
import BitcoinSupportModal from "./components/BitcoinSupportModal";
import RandomCharacter from "./components/RandomCharacter";
import { getLearningPath } from "./data/skillTreeData";
import TutorialStepper from "./components/TutorialStepper";
import TutorialActionBarPopovers from "./components/TutorialActionBarPopovers";
import AnimatedBackground from "./components/AnimatedBackground";
import useAppUpdate from "./hooks/useAppUpdate";
import GlassContainer from "./components/GlassContainer";
import ThemeModeField from "./components/ThemeModeField";
import useBottomDrawerSwipeDismiss from "./hooks/useBottomDrawerSwipeDismiss";
import {
  buildGameReviewContext,
  inferCefrLevelFromLessonId,
} from "./utils/gameReviewContext";
import { FaCalendarAlt, FaCalendarCheck, FaKey } from "react-icons/fa";
import { BsCalendar2DateFill } from "react-icons/bs";
import { HiVolumeUp } from "react-icons/hi";
import { TbLanguage } from "react-icons/tb";
import sparkleSound from "./assets/sparkle.mp3";
import submitActionSound from "./assets/submitaction.mp3";
import selectSound from "./assets/select.mp3";
import modeSwitcherSound from "./assets/modeswitcher.mp3";
import dailyGoalSound from "./assets/dailygoal.mp3";
import {
  DAILY_GOAL_PET_HEALTH_GAIN,
  buildDailyGoalResetFields,
  getDailyGoalPetHealth,
  getNextDailyGoalResetAt,
  hasDailyGoalResetExpired,
} from "./utils/dailyGoalPet";
import {
  brazilianFlag,
  frenchFlag,
  germanFlag,
  greekFlag,
  irishFlag,
  italianFlag,
  japaneseFlag,
  mexicanFlag,
  netherlandsFlag,
  polishFlag,
  russianFlag,
  usaFlag,
} from "./components/flagsIcons/flags";
import { normalizeThemeMode, useThemeStore } from "./useThemeStore";

/* ---------------------------
   Small helpers
--------------------------- */
const isTrue = (v) => v === true || v === "true" || v === 1 || v === "1";

const CEFR_LEVELS = new Set(["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"]);
const ONBOARDING_TOTAL_STEPS = 1;
const TEST_UNLOCK_NSEC =
  "nsec1akcvuhtemz3kw58gvvfg38uucu30zfsahyt6ulqapx44lype6a9q42qevv";

const personaDefaultFor = (lang) =>
  translations?.[lang]?.DEFAULT_PERSONA ||
  translations?.[lang]?.onboarding_persona_default_example ||
  translations?.en?.onboarding_persona_default_example ||
  "";

/**
 * Migrate old level values to CEFR levels
 * beginner -> Pre-A1, intermediate -> B1, advanced -> C1
 */
function migrateToCEFRLevel(level) {
  const migrations = {
    beginner: "Pre-A1",
    intermediate: "B1",
    advanced: "C1",
  };
  return migrations[level] || level || "Pre-A1";
}
const TARGET_LANGUAGE_LABELS = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  nl: "Dutch",
  nah: "Eastern Huasteca Nahuatl",
  ja: "Japanese",
  ru: "Russian",
  de: "German",
  el: "Greek",
  pl: "Polish",
  ga: "Irish",
  yua: "Yucatec Maya",
};
const SESSION_TIMER_STORAGE_KEY = "sessionTimerState";
const NOSTR_PROGRESS_HASHTAG = "#LearnWithNostr";

function extractJsonBlock(text = "") {
  if (!text) return "";
  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (blockMatch) {
    return blockMatch[1].trim();
  }
  const braceMatch = text.match(/\{[\s\S]*\}/);
  return braceMatch ? braceMatch[0].trim() : text.trim();
}

function parseCefrResponse(raw = "") {
  if (!raw) return null;
  const snippet = extractJsonBlock(raw);
  try {
    const payload = JSON.parse(snippet);
    if (!payload || typeof payload !== "object") return null;
    const level = String(payload.level || payload.cefr || "")
      .trim()
      .toUpperCase();
    if (!CEFR_LEVELS.has(level)) return null;
    const explanation = String(
      payload.explanation || payload.reason || payload.summary || "",
    ).trim();
    if (!explanation) return null;
    return { level, explanation };
  } catch {
    return null;
  }
}

function CelebrationOrb({
  size = 120,
  accentGradient = "linear(135deg, yellow.300, yellow.400, orange.400)",
  particleColor = "yellow.200",
  icon = "★",
}) {
  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`}>
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        w={`${(size / 3) * 2}px`}
        h={`${(size / 3) * 2}px`}
        borderRadius="full"
        bgGradient={accentGradient}
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
          {icon}
        </Box>
      </Box>

      {[0, 60, 120, 180, 240, 300].map((angle, idx) => (
        <Box
          key={idx}
          position="absolute"
          top="50%"
          left="50%"
          w="12px"
          h="12px"
          animation={`orbit${idx} 3s linear infinite`}
          sx={{
            [`@keyframes orbit${idx}`]: {
              "0%": {
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${
                  size / 2
                }px) rotate(-${angle}deg)`,
                opacity: 0.4,
              },
              "50%": {
                opacity: 1,
              },
              "100%": {
                transform: `translate(-50%, -50%) rotate(${
                  angle + 360
                }deg) translateX(${size / 2}px) rotate(-${angle - 360}deg)`,
                opacity: 0.4,
              },
            },
          }}
        >
          <Box
            w="100%"
            h="100%"
            bgGradient="linear(to-br, yellow.200, yellow.400)"
            borderRadius="full"
            boxShadow="0 0 10px rgba(251, 191, 36, 0.8)"
          />
        </Box>
      ))}

      {[...Array(8)].map((_, i) => (
        <Box
          key={`particle-${i}`}
          position="absolute"
          top="50%"
          left="50%"
          w="6px"
          h="6px"
          borderRadius="full"
          bg={particleColor}
          opacity={0.8}
          animation={`float${i} ${2 + i * 0.3}s ease-in-out infinite`}
          sx={{
            [`@keyframes float${i}`]: {
              "0%, 100%": {
                transform: `translate(-50%, -50%) translate(${
                  Math.cos((i * 45 * Math.PI) / 180) * (size / 4)
                }px, ${Math.sin((i * 45 * Math.PI) / 180) * (size / 4)}px)`,
                opacity: 0,
              },
              "50%": {
                transform: `translate(-50%, -50%) translate(${
                  Math.cos((i * 45 * Math.PI) / 180) * (size / 2)
                }px, ${Math.sin((i * 45 * Math.PI) / 180) * (size / 2)}px)`,
                opacity: 0.8,
              },
            },
          }}
        />
      ))}
    </Box>
  );
}

async function ensureOnboardingField(db, id, data) {
  const hasNested = data?.onboarding && typeof data.onboarding === "object";
  const hasCompleted =
    hasNested &&
    Object.prototype.hasOwnProperty.call(data.onboarding, "completed");
  const hasLegacyTopLevel = Object.prototype.hasOwnProperty.call(
    data || {},
    "onboardingCompleted",
  );
  const hasStep =
    hasNested && Number.isFinite(Number(data.onboarding?.currentStep));

  const shouldSetDefaults = !hasCompleted && !hasLegacyTopLevel;
  const shouldSetStep = !hasStep;

  if (shouldSetDefaults || shouldSetStep) {
    const onboardingPayload = {
      ...(hasNested ? data.onboarding : {}),
    };

    if (shouldSetDefaults && !hasCompleted) {
      // New accounts are always created with onboarding.completed = false,
      // so if we reach here the doc predates the onboarding system — it's
      // an old account that already completed onboarding. Mark it true.
      onboardingPayload.completed = true;
    }

    if (shouldSetStep) {
      const existing = Number(onboardingPayload.currentStep);
      onboardingPayload.currentStep = Number.isFinite(existing) ? existing : 1;
    }

    await setDoc(
      doc(db, "users", id),
      { onboarding: onboardingPayload },
      { merge: true },
    );
    const snap = await getDoc(doc(db, "users", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : data;
  }
  return data;
}

async function loadUserObjectFromDB(db, id) {
  if (!id) return null;
  try {
    const ref = doc(db, "users", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    // Ensure onboarding fields first, then hydrate progress maps from subcollections.
    let userData = await ensureOnboardingField(db, id, {
      id: snap.id,
      ...snap.data(),
    });

    const [languageLessonsSnapshot, languageFlashcardsSnapshot] =
      await Promise.all([
        getDocs(collection(db, "users", id, "languageLessons")),
        getDocs(collection(db, "users", id, "languageFlashcards")),
      ]);

    const languageLessons = {};
    languageLessonsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data?.targetLang || !data?.lessonId) return;

      const targetLang = String(data.targetLang).toLowerCase();
      if (!languageLessons[targetLang]) languageLessons[targetLang] = {};

      languageLessons[targetLang][data.lessonId] = {
        ...(languageLessons[targetLang][data.lessonId] || {}),
        ...data,
      };
    });

    const languageFlashcards = {};
    languageFlashcardsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data?.targetLang || !data?.cardId) return;

      const targetLang = String(data.targetLang).toLowerCase();
      if (!languageFlashcards[targetLang]) languageFlashcards[targetLang] = {};

      languageFlashcards[targetLang][data.cardId] = {
        ...(languageFlashcards[targetLang][data.cardId] || {}),
        ...data,
      };
    });

    if (!userData.progress || typeof userData.progress !== "object") {
      userData.progress = {};
    }

    // Use subcollections as the canonical source of truth for lesson/flashcard progress.
    // This intentionally ignores any legacy nested progress JSON fields.
    userData.progress.languageLessons = languageLessons;
    userData.progress.languageFlashcards = languageFlashcards;

    return userData;
  } catch (e) {
    console.error("loadUserObjectFromDB failed:", e);
    return null;
  }
}

/* -------------------------------------------------------------------------------------------------
   Top Bar
--------------------------------------------------------------------------------------------------*/
function TopBar({
  appLanguage,
  user,
  activeNpub,
  activeNsec,
  auth,
  cefrResult,
  cefrLoading,
  cefrError,
  onPatchSettings,
  onSwitchedAccount,
  settingsOpen,
  closeSettings,
  onRunCefrAnalysis,
  onSelectIdentity,
  isIdentitySaving = false,
  tabOrder = [],
  tabLabels = {},
  tabIcons = {},
  currentTab = "realtime",
  onSelectTab,
  viewMode,

  // 🆕 timer props
  timerRemainingSeconds,
  isTimerRunning,
  timerPaused,
  formatTimer,
  onOpenTimerModal,
  onTogglePauseTimer,
  // 🆕 daily goal modal props
  onOpenDailyGoalModal,
  // 🆕 allow posts props
  allowPosts,
  onAllowPostsChange,
  // 🆕 sound effects props
  soundEnabled,
  onSoundEnabledChange,
  // 🆕 sound volume props
  soundVolume,
  onVolumeChange,
  onVolumeSave,
  playSound,
  testSound,
  // 🆕 mobile detection prop
  isMobile,
  postNostrContent,
}) {
  const playSliderTick = useSoundSettings((s) => s.playSliderTick);
  const toast = useToast();
  const navigate = useNavigate();
  const t = translations[appLanguage] || translations.en;
  const themeMode = useThemeStore((s) => s.themeMode);
  const syncThemeMode = useThemeStore((s) => s.syncThemeMode);
  const [settingsTabIndex, setSettingsTabIndex] = useState(0);
  const settingsSwipeDismiss = useBottomDrawerSwipeDismiss({
    isOpen: settingsOpen,
    onClose: closeSettings,
  });

  // ---- Local draft state (no autosave) ----
  const p = user?.progress || {};
  const [level, setLevel] = useState(migrateToCEFRLevel(p.level) || "Pre-A1");
  const [supportLang, setSupportLang] = useState(p.supportLang || "en");
  const [voice, setVoice] = useState(p.voice || "alloy");
  const defaultPersona =
    p.voicePersona ||
    personaDefaultFor(p.supportLang || supportLang || appLanguage) ||
    translations.en.onboarding_persona_default_example;
  const [voicePersona, setVoicePersona] = useState(defaultPersona);
  const [targetLang, setTargetLang] = useState(p.targetLang || "es");
  const normalizedTargetLang = String(targetLang || "").toLowerCase();
  const hasProficiencyDecisionForTargetLang =
    Object.prototype.hasOwnProperty.call(
      user?.proficiencyPlacements || {},
      normalizedTargetLang,
    );
  const [showTranslations, setShowTranslations] = useState(
    typeof p.showTranslations === "boolean" ? p.showTranslations : true,
  );
  const [pauseMs, setPauseMs] = useState(
    Number.isFinite(p.pauseMs) ? p.pauseMs : 1200,
  );
  const [helpRequest, setHelpRequest] = useState(
    (p.helpRequest || user?.helpRequest || "").trim(),
  );
  const [practicePronunciation, setPracticePronunciation] = useState(
    !!p.practicePronunciation,
  );
  const vadSecondsLabel = appLanguage === "es" ? "segundos" : "seconds";
  const pauseSeconds = (pauseMs / 1000).toFixed(1);
  const vadHint =
    t.onboarding_vad_hint ||
    (appLanguage === "es"
      ? "Más corta = más sensible; más larga = te deja terminar de hablar. 1.2 segundos es lo recomendado para un habla natural."
      : "Shorter = more responsive; longer = gives you time to finish speaking. 1.2 seconds is recommended for natural speech.");

  // Japanese is visible for everyone (beta label applied in UI)
  const showJapanese = true;

  const supportLanguageOptions = useMemo(
    () => [
      { value: "en", label: t.onboarding_support_en, flag: usaFlag() },
      { value: "es", label: t.onboarding_support_es, flag: mexicanFlag() },
    ],
    [t],
  );

  const practiceLanguageOptions = useMemo(() => {
    const collator = new Intl.Collator(appLanguage === "es" ? "es" : "en");
    const options = [
      {
        value: "nl",
        label: t.onboarding_practice_nl,
        beta: false,
        flag: netherlandsFlag(),
      },
      {
        value: "en",
        label: t.onboarding_practice_en,
        beta: false,
        flag: usaFlag(),
      },
      {
        value: "fr",
        label: t.onboarding_practice_fr,
        beta: false,
        flag: frenchFlag(),
      },
      {
        value: "de",
        label: t.onboarding_practice_de,
        beta: false,
        flag: germanFlag(),
      },
      {
        value: "it",
        label: t.onboarding_practice_it,
        beta: false,
        flag: italianFlag(),
      },
      {
        value: "nah",
        label: `${t.onboarding_practice_nah} (${appLanguage === "es" ? "alfa" : "alpha"})`,
        beta: false,
        alpha: true,
        flag: mexicanFlag(),
      },
      {
        value: "yua",
        label: `${t.onboarding_practice_yua} (${appLanguage === "es" ? "alfa" : "alpha"})`,
        beta: false,
        alpha: true,
        flag: mexicanFlag(),
      },
      {
        value: "pt",
        label: t.onboarding_practice_pt,
        beta: false,
        flag: brazilianFlag(),
      },
      {
        value: "es",
        label: t.onboarding_practice_es,
        beta: false,
        flag: mexicanFlag(),
      },
      {
        value: "el",
        label: t.onboarding_practice_el,
        beta: true,
        flag: greekFlag(),
      },
      {
        value: "ja",
        label: t.onboarding_practice_ja,
        beta: true,
        hidden: !showJapanese,
        flag: japaneseFlag(),
      },
      {
        value: "ru",
        label: t.onboarding_practice_ru,
        beta: true,
        flag: russianFlag(),
      },
      {
        value: "pl",
        label: t.onboarding_practice_pl,
        beta: true,
        flag: polishFlag(),
      },
      {
        value: "ga",
        label: t.onboarding_practice_ga,
        beta: true,
        flag: irishFlag(),
      },
    ];

    const visible = options.filter((option) => !option.hidden);
    const stable = visible
      .filter((option) => !option.beta && !option.alpha)
      .sort((a, b) => collator.compare(a.label, b.label));
    const alpha = visible
      .filter((option) => option.alpha)
      .sort((a, b) => collator.compare(a.label, b.label));
    const beta = visible
      .filter((option) => option.beta)
      .sort((a, b) => collator.compare(a.label, b.label));

    return [...stable, ...alpha, ...beta];
  }, [appLanguage, showJapanese, t]);
  const selectedSupportOption =
    supportLanguageOptions.find((option) => option.value === supportLang) ||
    supportLanguageOptions[0];
  const selectedPracticeOption =
    practiceLanguageOptions.find((option) => option.value === targetLang) ||
    practiceLanguageOptions[0];

  // Refill draft when store changes
  useEffect(() => {
    const q = user?.progress || {};
    setLevel(migrateToCEFRLevel(q.level) || "Pre-A1");
    setSupportLang(q.supportLang || "en");
    setVoice(q.voice || "alloy");
    setVoicePersona(
      q.voicePersona ??
        personaDefaultFor(q.supportLang || supportLang || appLanguage) ??
        translations.en.onboarding_persona_default_example,
    );
    setTargetLang(q.targetLang || "es");
    setShowTranslations(
      typeof q.showTranslations === "boolean" ? q.showTranslations : true,
    );
    setPauseMs(Number.isFinite(q.pauseMs) ? q.pauseMs : 1200);
    setHelpRequest((q.helpRequest || user?.helpRequest || "").trim());
    setPracticePronunciation(!!q.practicePronunciation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.progress, user?.helpRequest]);

  useEffect(() => {
    const localizedDefault = personaDefaultFor(supportLang || appLanguage);
    const enDefault = personaDefaultFor("en");
    const esDefault = personaDefaultFor("es");
    const current = (voicePersona || "").trim();

    if (
      (!current && localizedDefault) ||
      (current &&
        current !== localizedDefault &&
        (current === enDefault || current === esDefault))
    ) {
      const nextPersona = localizedDefault || current;
      setVoicePersona(nextPersona);
      persistSettings({ voicePersona: nextPersona });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appLanguage, supportLang]);

  const persistSettings = useCallback(
    async (partial = {}) => {
      try {
        await Promise.resolve(onPatchSettings?.(partial));
      } catch (e) {
        toast({
          status: "error",
          title: appLanguage === "es" ? "Error al guardar" : "Save failed",
          description: String(e?.message || e),
        });
      }
    },
    [onPatchSettings, toast, appLanguage],
  );

  // Debounced persist for text inputs (voicePersona, helpRequest)
  const debounceRef = useRef(null);
  const debouncedPersist = useCallback(
    (partial, delay = 400) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        persistSettings(partial);
      }, delay);
    },
    [persistSettings],
  );

  useEffect(() => {
    if (settingsOpen) {
      setSettingsTabIndex(0);
    }
  }, [settingsOpen]);

  /* ---------------------------
     Daily goal HUD (left side)
  --------------------------- */
  const MS_24H = 24 * 60 * 60 * 1000;
  const [dailyGoalXp, setDailyGoalXp] = useState(0);
  const [dailyXp, setDailyXp] = useState(0);
  const [dailyResetAt, setDailyResetAt] = useState(null);
  const [completedGoalDates, setCompletedGoalDates] = useState([]);
  const [dailyXpHistory, setDailyXpHistory] = useState({});

  // Keep a local draft for settings input
  const [goalDraft, setGoalDraft] = useState(0);

  const handleDailyGoalChange = useCallback(
    async (rawValue) => {
      const parsed = Math.max(0, Math.floor(Number(rawValue) || 0));
      setGoalDraft(rawValue);
      setDailyGoalXp(parsed);

      if (!activeNpub) return;
      try {
        await setDoc(
          doc(database, "users", activeNpub),
          { dailyGoalXp: parsed },
          { merge: true },
        );
      } catch (e) {
        toast({
          status: "error",
          title: appLanguage === "es" ? "Error al guardar" : "Save failed",
          description: String(e?.message || e),
        });
      }
    },
    [activeNpub, appLanguage, toast],
  );

  useEffect(() => {
    if (!activeNpub) return;
    const ref = doc(database, "users", activeNpub);
    const unsub = onSnapshot(ref, async (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const goal = Number(data?.dailyGoalXp || 0);
      let dxp = Number(data?.dailyXp || 0);
      let resetISO = data?.dailyResetAt || null;
      const completedDates = Array.isArray(data?.completedGoalDates)
        ? data.completedGoalDates
        : [];
      const xpHistory =
        data?.dailyXpHistory && typeof data.dailyXpHistory === "object"
          ? data.dailyXpHistory
          : {};

      const expired = hasDailyGoalResetExpired(resetISO);
      if (expired && goal > 0) {
        try {
          await runTransaction(database, async (tx) => {
            const latestSnap = await tx.get(ref);
            const latestData = latestSnap.exists() ? latestSnap.data() : {};
            if (!hasDailyGoalResetExpired(latestData?.dailyResetAt)) return;

            tx.set(
              ref,
              {
                ...buildDailyGoalResetFields(latestData, new Date()),
                updatedAt: new Date().toISOString(),
              },
              { merge: true },
            );
          });
        } catch (error) {
          console.warn("Failed to apply daily goal reset:", error);
        }
        dxp = 0;
        resetISO = data?.dailyResetAt || resetISO;
      }

      setDailyGoalXp(goal);
      setGoalDraft(goal);
      setDailyXp(dxp);
      setDailyResetAt(resetISO);
      setCompletedGoalDates(completedDates);
      setDailyXpHistory(xpHistory);
    });
    return () => unsub();
  }, [activeNpub]);

  const dailyPct =
    dailyGoalXp > 0
      ? Math.min(100, Math.round((dailyXp / dailyGoalXp) * 100))
      : 0;
  const dailyDone = dailyGoalXp > 0 && dailyXp >= dailyGoalXp;

  const cefrTimestamp =
    cefrResult?.updatedAt &&
    new Date(cefrResult.updatedAt).toLocaleString(
      appLanguage === "es" ? "es" : "en-US",
    );

  return (
    <>
      {/* ---- Header (responsive) ---- */}
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={100}
        w="100%"
        borderBottom={themeMode === "light" ? "none" : "1px solid #000026ff"}
      >
        <GlassContainer
          borderRadius={0}
          blur={0.5}
          contrast={1.2}
          brightness={1.05}
          saturation={1.1}
          zIndex={100}
        >
          <HStack
            w="100%"
            px={{ base: 2, md: 3 }}
            py={2}
            color="gray.100"
            wrap="wrap"
            spacing={{ base: 2, md: 3 }}
          >
            {/* LEFT: Daily Goal Button + WaveBar */}
            <HStack
              spacing={{ base: 2, md: 3 }}
              minW={0}
              flex="1 1 auto"
              align="center"
            >
              <IconButton
                size="sm"
                variant="outline"
                colorScheme="teal"
                icon={dailyDone ? <FaCalendarCheck /> : <FaCalendarAlt />}
                onClick={() => {
                  playSound(selectSound);
                  onOpenDailyGoalModal?.();
                }}
                borderColor="teal.600"
                px={{ base: 2, md: 3 }}
              />
              <Box w={{ base: "100px", sm: "130px", md: "160px" }}>
                <WaveBar value={dailyPct} />
              </Box>
            </HStack>

            <Spacer display={{ base: "none", md: "block" }} />

            {/* RIGHT: controls */}
            <HStack
              spacing={{ base: 1, md: 2 }}
              flexShrink={0}
              ml="auto"
              align="center"
            >
              {timerRemainingSeconds !== null && (
                <Badge
                  colorScheme={isTimerRunning ? "teal" : "purple"}
                  variant="subtle"
                  px={3}
                  py={1.5}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Text fontFamily="mono" fontWeight="bold" fontSize="2xs">
                    {formatTimer(timerRemainingSeconds)}
                  </Text>
                </Badge>
              )}
              <Button
                colorScheme="teal"
                variant={isTimerRunning ? "solid" : "outline"}
                size="sm"
                onClick={() => {
                  playSound(selectSound);
                  onOpenTimerModal?.();
                }}
              >
                <FiClock />
              </Button>
              {timerRemainingSeconds !== null && (
                <Button
                  colorScheme="teal"
                  variant={timerPaused ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => {
                    playSound(selectSound);
                    onTogglePauseTimer?.();
                  }}
                >
                  {timerPaused ? <FiPlay /> : <FiPause />}
                </Button>
              )}
            </HStack>
          </HStack>
        </GlassContainer>
      </Box>

      {/* ---- Settings Drawer ---- */}
      <Drawer isOpen={settingsOpen} placement="bottom" onClose={closeSettings}>
        <DrawerOverlay
          {...settingsSwipeDismiss.overlayProps}
          bg="var(--app-overlay)"
        />
        <DrawerContent
          {...settingsSwipeDismiss.drawerContentProps}
          bg="gray.900"
          color="var(--app-text-primary)"
          borderTopRadius="24px"
          maxH="75vh"
          display="flex"
          flexDirection="column"
        >
          <BottomDrawerDragHandle
            isDragging={settingsSwipeDismiss.isDragging}
          />
          <DrawerCloseButton
            color="var(--app-text-muted)"
            _hover={{ color: "var(--app-text-primary)" }}
            top={4}
            right={4}
          />
          <DrawerBody
            pb={6}
            display="flex"
            flexDirection="column"
            flex={1}
            minH={0}
          >
            <Tabs
              index={settingsTabIndex}
              onChange={setSettingsTabIndex}
              variant="unstyled"
              display="flex"
              flexDirection="column"
              flex={1}
              minH={0}
            >
              <Box maxW="600px" mx="auto" w="100%" pr={12}>
                <TabList
                  mb={4}
                  mt={2}
                  gap={6}
                  flexWrap="wrap"
                  justifyContent="center"
                >
                  <Tab
                    px={0}
                    pt={1}
                    pb={3}
                    position="relative"
                    fontWeight="semibold"
                    color="var(--app-text-muted)"
                    borderRadius="0"
                    bg="transparent"
                    border="none"
                    boxShadow="none"
                    outline="none"
                    _active={{ bg: "transparent" }}
                    _hover={{
                      color: "var(--app-text-primary)",
                      borderColor: "transparent",
                    }}
                    _focus={{
                      boxShadow: "none",
                      outline: "none",
                      borderColor: "transparent",
                    }}
                    _focusVisible={{
                      boxShadow: "none",
                      outline: "none",
                      borderColor: "transparent",
                    }}
                    sx={{
                      "&:hover": { borderColor: "transparent" },
                      "&:focus": {
                        outline: "none",
                        boxShadow: "none",
                        borderColor: "transparent",
                      },
                      "&:focus-visible": {
                        outline: "none",
                        boxShadow: "none",
                        borderColor: "transparent",
                      },
                      "&[data-focus]": {
                        outline: "none",
                        boxShadow: "none",
                        borderColor: "transparent",
                      },
                      "&[data-focus-visible]": {
                        outline: "none",
                        boxShadow: "none",
                        borderColor: "transparent",
                      },
                    }}
                    _after={{
                      content: '""',
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: "-1px",
                      height: "3px",
                      borderRadius: "full",
                      bgGradient:
                        "linear(to-r, cyan.300, blue.400, purple.400)",
                      opacity: 0,
                      transform: "scaleX(0.7)",
                      transformOrigin: "center",
                      transition: "all 0.2s ease",
                    }}
                    _selected={{
                      color: "var(--app-text-primary)",
                      _after: {
                        opacity: 1,
                        transform: "scaleX(1)",
                      },
                    }}
                  >
                    {t.ra_settings_title || "Settings"}
                  </Tab>
                  <Tab
                    px={0}
                    pt={1}
                    pb={3}
                    position="relative"
                    fontWeight="semibold"
                    color="var(--app-text-muted)"
                    borderRadius="0"
                    bg="transparent"
                    border="none"
                    boxShadow="none"
                    outline="none"
                    _active={{ bg: "transparent" }}
                    _hover={{
                      color: "var(--app-text-primary)",
                      borderColor: "transparent",
                    }}
                    _focus={{
                      boxShadow: "none",
                      outline: "none",
                      borderColor: "transparent",
                    }}
                    _focusVisible={{
                      boxShadow: "none",
                      outline: "none",
                      borderColor: "transparent",
                    }}
                    sx={{
                      "&:hover": { borderColor: "transparent" },
                      "&:focus": {
                        outline: "none",
                        boxShadow: "none",
                        borderColor: "transparent",
                      },
                      "&:focus-visible": {
                        outline: "none",
                        boxShadow: "none",
                        borderColor: "transparent",
                      },
                      "&[data-focus]": {
                        outline: "none",
                        boxShadow: "none",
                        borderColor: "transparent",
                      },
                      "&[data-focus-visible]": {
                        outline: "none",
                        boxShadow: "none",
                        borderColor: "transparent",
                      },
                    }}
                    _after={{
                      content: '""',
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: "-1px",
                      height: "3px",
                      borderRadius: "full",
                      bgGradient:
                        "linear(to-r, cyan.300, blue.400, purple.400)",
                      opacity: 0,
                      transform: "scaleX(0.7)",
                      transformOrigin: "center",
                      transition: "all 0.2s ease",
                    }}
                    _selected={{
                      color: "var(--app-text-primary)",
                      _after: {
                        opacity: 1,
                        transform: "scaleX(1)",
                      },
                    }}
                  >
                    {t.app_account_title || "Account"}
                  </Tab>
                </TabList>
              </Box>
              <TabPanels flex={1} minH={0}>
                <TabPanel
                  px={0}
                  pt={0}
                  pb={0}
                  display="flex"
                  flexDirection="column"
                  overflowY="auto"
                  minH={0}
                >
                  <Box maxW="600px" mx="auto" w="100%">
                    <VStack align="stretch" spacing={3} pb={14}>
                      <Wrap spacing={4}>
                        <VStack align="flex-start" spacing={1}>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="gray.400"
                          >
                            {translations[appLanguage]
                              .onboarding_support_menu_label || "Support:"}
                          </Text>
                          <Menu
                            autoSelect={false}
                            isLazy
                            onOpen={() => playSound(selectSound)}
                          >
                            <MenuButton
                              as={Button}
                              rightIcon={<ChevronDownIcon />}
                              variant="outline"
                              size="sm"
                              borderColor="gray.700"
                              bg="gray.800"
                              _hover={{ bg: "gray.750" }}
                              _active={{ bg: "gray.750" }}
                              padding={5}
                              onClick={() => playSound(selectSound)}
                            >
                              <HStack spacing={2}>
                                {selectedSupportOption?.flag}
                                <Text as="span">
                                  {selectedSupportOption?.label}
                                </Text>
                              </HStack>
                            </MenuButton>
                            <MenuList borderColor="gray.700" bg="gray.900">
                              <Box
                                px={3}
                                pt={2}
                                pb={1}
                                fontSize="xs"
                                fontWeight="semibold"
                                color="gray.400"
                              >
                                {translations[appLanguage]
                                  .onboarding_support_menu_label || "Support:"}
                              </Box>
                              <MenuOptionGroup
                                type="radio"
                                value={supportLang}
                                onChange={(value) => {
                                  playSound(selectSound);
                                  setSupportLang(value);
                                  persistSettings({ supportLang: value });
                                }}
                              >
                                {supportLanguageOptions.map((option) => (
                                  <MenuItemOption
                                    key={option.value}
                                    value={option.value}
                                    padding={5}
                                  >
                                    <HStack spacing={2}>
                                      {option.flag}
                                      <Text as="span">{option.label}</Text>
                                    </HStack>
                                  </MenuItemOption>
                                ))}
                              </MenuOptionGroup>
                            </MenuList>
                          </Menu>
                        </VStack>

                        <VStack align="flex-start" spacing={1}>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="gray.400"
                          >
                            {translations[appLanguage]
                              .onboarding_practice_menu_label || "Practice:"}
                          </Text>
                          <Menu
                            autoSelect={false}
                            isLazy
                            onOpen={() => playSound(selectSound)}
                          >
                            <MenuButton
                              as={Button}
                              rightIcon={<ChevronDownIcon />}
                              variant="outline"
                              size="sm"
                              borderColor="gray.700"
                              bg="gray.800"
                              _hover={{ bg: "gray.750" }}
                              _active={{ bg: "gray.750" }}
                              px={4}
                              title={
                                translations[appLanguage]
                                  .onboarding_practice_label_title
                              }
                              padding={5}
                              onClick={() => playSound(selectSound)}
                            >
                              <HStack spacing={2}>
                                {selectedPracticeOption?.flag}
                                <Text as="span">
                                  {selectedPracticeOption?.label}
                                  {selectedPracticeOption?.beta
                                    ? " (beta)"
                                    : ""}
                                </Text>
                              </HStack>
                            </MenuButton>
                            <MenuList
                              borderColor="gray.700"
                              bg="gray.900"
                              maxH="300px"
                              overflowY="auto"
                              sx={{
                                "&::-webkit-scrollbar": {
                                  width: "8px",
                                },
                                "&::-webkit-scrollbar-track": {
                                  bg: "gray.800",
                                  borderRadius: "4px",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                  bg: "gray.600",
                                  borderRadius: "4px",
                                },
                                "&::-webkit-scrollbar-thumb:hover": {
                                  bg: "gray.500",
                                },
                              }}
                            >
                              <Box
                                px={3}
                                pt={2}
                                pb={1}
                                fontSize="xs"
                                fontWeight="semibold"
                                color="gray.400"
                              >
                                {translations[appLanguage]
                                  .onboarding_practice_menu_label ||
                                  "Practice:"}
                              </Box>
                              <MenuOptionGroup
                                type="radio"
                                value={targetLang}
                                onChange={(value) => {
                                  playSound(selectSound);
                                  setTargetLang(value);
                                  persistSettings({ targetLang: value });
                                }}
                              >
                                {practiceLanguageOptions.map((option) => (
                                  <MenuItemOption
                                    key={option.value}
                                    value={option.value}
                                    padding={5}
                                  >
                                    <HStack spacing={2}>
                                      {option.flag}
                                      <Text as="span">
                                        {option.label}
                                        {option.beta ? " (beta)" : ""}
                                      </Text>
                                    </HStack>
                                  </MenuItemOption>
                                ))}
                              </MenuOptionGroup>
                            </MenuList>
                          </Menu>
                        </VStack>
                      </Wrap>

                      {!hasProficiencyDecisionForTargetLang && (
                        <Button
                          leftIcon={<LuBadgeCheck />}
                          size="sm"
                          variant="outline"
                          borderColor="cyan.600"
                          color="cyan.200"
                          padding={6}
                          _hover={{ bg: "cyan.900" }}
                          onClick={() => {
                            closeSettings();
                            navigate("/proficiency");
                          }}
                          mt={4}
                        >
                          {appLanguage === "es"
                            ? "Iniciar prueba de nivel"
                            : "Start proficiency test"}
                        </Button>
                      )}

                      <Box bg="gray.800" p={3} rounded="md">
                        <Text fontSize="sm" mb={2}>
                          {t.ra_persona_label || "Persona"}
                        </Text>
                        <Input
                          value={voicePersona}
                          onChange={(e) => {
                            const next = e.target.value.slice(0, 240);
                            setVoicePersona(next);
                            debouncedPersist({ voicePersona: next });
                          }}
                          bg="gray.700"
                          placeholder={
                            (t.ra_persona_placeholder &&
                              t.ra_persona_placeholder.replace(
                                "{example}",
                                translations[appLanguage]
                                  .onboarding_persona_default_example,
                              )) ||
                            `e.g., ${translations[appLanguage].onboarding_persona_default_example}`
                          }
                        />
                        <Text fontSize="xs" opacity={0.7} mt={1}>
                          {t.ra_persona_help ||
                            "A short vibe/style hint for the AI voice."}
                        </Text>
                      </Box>

                      <Box bg="gray.800" p={3} rounded="md">
                        <HStack justifyContent="space-between" mb={2}>
                          <Text fontSize="sm">
                            {t.ra_vad_label || "Voice activity pause (seconds)"}
                          </Text>
                          <Text fontSize="sm" opacity={0.8}>
                            {pauseSeconds} {vadSecondsLabel}
                          </Text>
                        </HStack>
                        <Slider
                          aria-label="pause-slider"
                          min={200}
                          max={4000}
                          step={100}
                          value={pauseMs}
                          onChange={(val) => {
                            setPauseMs(val);
                            playSliderTick(val, 200, 4000);
                          }}
                          onChangeEnd={(value) =>
                            persistSettings({ pauseMs: value })
                          }
                        >
                          <SliderTrack bg="gray.700" h={3} borderRadius="full">
                            <SliderFilledTrack bg="linear-gradient(90deg, #3CB371, #5dade2)" />
                          </SliderTrack>
                          <SliderThumb boxSize={6} />
                        </Slider>
                      </Box>

                      <Box bg="gray.800" p={3} rounded="md">
                        <HStack justifyContent="space-between">
                          <Text fontSize="sm">
                            {t.teams_feed_allow_label || "Allow posts"}
                          </Text>
                          <Switch
                            id="settings-allow-posts-switch"
                            isChecked={allowPosts}
                            onChange={(e) =>
                              onAllowPostsChange(e.target.checked)
                            }
                          />
                        </HStack>
                        <Text fontSize="xs" opacity={0.6} mt={2}>
                          {allowPosts
                            ? t.teams_feed_allow_enabled ||
                              "Automatic community posts enabled."
                            : t.teams_feed_allow_disabled ||
                              "Automatic community posts disabled."}
                        </Text>
                      </Box>

                      <Box bg="gray.800" p={3} rounded="md">
                        <HStack justifyContent="space-between">
                          <Text fontSize="sm">
                            {t.sound_effects_label || "Sound effects"}
                          </Text>
                          <Switch
                            id="settings-sound-effects-switch"
                            isChecked={soundEnabled}
                            onChange={(e) =>
                              onSoundEnabledChange(e.target.checked)
                            }
                          />
                        </HStack>
                        <Text fontSize="xs" opacity={0.6} mt={2}>
                          {soundEnabled
                            ? t.sound_effects_enabled ||
                              "Sound effects are enabled."
                            : t.sound_effects_disabled ||
                              "Sound effects are muted."}
                        </Text>
                        {soundEnabled && !isMobile && (
                          <HStack mt={3} spacing={3} align="center">
                            <Box w="50%">
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm">
                                  {t.sound_volume_label || "Volume"}
                                </Text>
                                <Text fontSize="sm" opacity={0.8}>
                                  {soundVolume}%
                                </Text>
                              </HStack>
                              <Slider
                                aria-label="sound-volume-slider"
                                min={0}
                                max={100}
                                step={5}
                                value={soundVolume}
                                onChange={(val) => {
                                  onVolumeChange(val);
                                  playSliderTick(val, 0, 100);
                                }}
                                onChangeEnd={(val) => onVolumeSave(val)}
                              >
                                <SliderTrack
                                  bg="gray.700"
                                  h={3}
                                  borderRadius="full"
                                >
                                  <SliderFilledTrack bg="linear-gradient(90deg, #5dade2, #9370DB)" />
                                </SliderTrack>
                                <SliderThumb boxSize={6} />
                              </Slider>
                            </Box>
                            <Button
                              leftIcon={<HiVolumeUp />}
                              size="sm"
                              variant="outline"
                              onClick={() => playSound(testSound)}
                            >
                              {t.test_sound || "Test sound"}
                            </Button>
                          </HStack>
                        )}
                      </Box>

                      <ThemeModeField
                        value={themeMode}
                        compact={isMobile}
                        t={t}
                        onChange={(nextMode) => {
                          playSound(selectSound);
                          syncThemeMode(nextMode);
                          persistSettings({ themeMode: nextMode });
                        }}
                      />
                    </VStack>
                  </Box>
                </TabPanel>
                <TabPanel
                  px={0}
                  pt={0}
                  pb={0}
                  display="flex"
                  flexDirection="column"
                  overflowY="auto"
                  minH={0}
                >
                  <Box maxW="600px" mx="auto" w="100%">
                    <IdentityPanel
                      onClose={closeSettings}
                      t={t}
                      appLanguage={appLanguage}
                      activeNpub={activeNpub}
                      activeNsec={activeNsec}
                      auth={auth}
                      onSwitchedAccount={onSwitchedAccount}
                      cefrResult={cefrResult}
                      cefrLoading={cefrLoading}
                      cefrError={cefrError}
                      onRunCefrAnalysis={() =>
                        onRunCefrAnalysis?.({ dailyGoalXp, dailyXp })
                      }
                      user={user}
                      onSelectIdentity={onSelectIdentity}
                      isIdentitySaving={isIdentitySaving}
                      postNostrContent={postNostrContent}
                      showHeader={false}
                    />
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

/* -------------------------------------------------------------------------------------------------
   App root
--------------------------------------------------------------------------------------------------*/
export default function App() {
  const toast = useToast();
  const initRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const helpChatDisclosure = useDisclosure();
  const helpChatRef = useRef(null);
  useAppUpdate();
  const handleSendToHelpChat = useCallback(
    (text) => {
      const payload = (text || "").trim();
      if (!payload) return;
      helpChatDisclosure.onOpen();
      helpChatRef.current?.openAndSend(payload);
    },
    [helpChatDisclosure],
  );
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [realWorldTasksOpen, setRealWorldTasksOpen] = useState(false);
  const [tasksTickNow, setTasksTickNow] = useState(() => Date.now());
  const [pendingTeamInviteCount, setPendingTeamInviteCount] = useState(0);

  // Periodically tick to drive the real-world tasks "ready" animation
  useEffect(() => {
    const id = setInterval(
      () => setTasksTickNow(Date.now()),
      60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  // Notes store state for action bar animations
  const notesIsLoading = useNotesStore((s) => s.isLoading);
  const notesIsDone = useNotesStore((s) => s.isDone);

  const [isLoadingApp, setIsLoadingApp] = useState(true);

  // Zustand store
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const patchUser = useUserStore((s) => s.patchUser);

  const SUBSCRIPTION_PASSCODE_KEY = "subscriptionPasscode";
  const subscriptionPasscode = (
    import.meta.env?.VITE_SUBSCRIPTION_PASSCODE || ""
  ).trim();
  const [storedPasscode, setStoredPasscode] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(SUBSCRIPTION_PASSCODE_KEY) || ""
      : "",
  );
  const [passcodeError, setPasscodeError] = useState("");
  const [isSavingPasscode, setIsSavingPasscode] = useState(false);

  const storedUiLang = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("appLanguage") || "";
    } catch {
      return "";
    }
  }, []);

  const normalizeSupportLang = useCallback(
    (raw) => (raw === "es" ? "es" : raw === "en" ? "en" : undefined),
    [],
  );

  const resolvedTargetLang = (user?.progress?.targetLang || "es").toLowerCase();
  const resolvedSupportLang =
    normalizeSupportLang(user?.progress?.supportLang) ||
    (storedUiLang === "es" ? "es" : "en");
  const resolvedLevel = migrateToCEFRLevel(user?.progress?.level) || "Pre-A1";

  useEffect(() => {
    const nextLang = resolvedSupportLang === "es" ? "es" : "en";
    setAppLanguage((prev) => {
      if (prev === nextLang) return prev;
      return nextLang;
    });
    try {
      localStorage.setItem("appLanguage", nextLang);
    } catch {}
  }, [resolvedSupportLang]);

  useEffect(() => {
    const id = (
      user?.local_npub ||
      (typeof window !== "undefined"
        ? localStorage.getItem("local_npub")
        : "") ||
      ""
    ).trim();
    if (!id) return;

    const desiredAppLanguage = resolvedSupportLang === "es" ? "es" : "en";
    const persistedAppLanguage = user?.appLanguage === "es" ? "es" : "en";

    if (persistedAppLanguage === desiredAppLanguage) return;

    updateDoc(doc(database, "users", id), {
      appLanguage: desiredAppLanguage,
      updatedAt: new Date().toISOString(),
    }).catch((error) => {
      console.warn("Failed to sync appLanguage from supportLang:", error);
    });
  }, [resolvedSupportLang, user?.appLanguage, user?.local_npub]);

  const dailyGoalTarget = useMemo(() => {
    const rawGoal =
      user?.dailyGoalXp ??
      user?.progress?.dailyGoalXp ??
      user?.stats?.dailyGoalXp ??
      0;
    const parsed = Number(rawGoal);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [user]);

  const dailyXpToday = useMemo(() => {
    const rawXp =
      user?.dailyXp ?? user?.stats?.dailyXp ?? user?.progress?.dailyXp ?? 0;
    const parsed = Number(rawXp);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [user]);

  const dailyGoalCompletedDates = useMemo(
    () =>
      Array.isArray(user?.completedGoalDates) ? user.completedGoalDates : [],
    [user?.completedGoalDates],
  );

  const dailyGoalXpHistory = useMemo(
    () =>
      user?.dailyXpHistory && typeof user.dailyXpHistory === "object"
        ? user.dailyXpHistory
        : {},
    [user?.dailyXpHistory],
  );

  const dailyGoalPetHealth = useMemo(
    () => getDailyGoalPetHealth(user || {}),
    [user],
  );

  // const { sendOneSatToNpub, initWalletService, init, walletBalance } =
  //   useNostrWalletStore((state) => ({
  //     sendOneSatToNpub: state.sendOneSatToNpub, // renamed from cashTap
  //     initWalletService: state.initWalletService, // renamed from loadWallet
  //     init: state.init,
  //     walletBalance: state.walletBalance,
  //   }));
  const init = useNostrWalletStore((s) => s.init);
  const initWallet = useNostrWalletStore((s) => s.initWallet);
  const walletBalance = useNostrWalletStore((s) => s.walletBalance);
  const sendOneSatToNpub = useNostrWalletStore((s) => s.sendOneSatToNpub);
  const cashuWallet = useNostrWalletStore((s) => s.cashuWallet);

  console.log("walletBalance", walletBalance);

  // walletBalance is now a clean number from the store
  const totalWalletBalance = useMemo(() => {
    const numeric = Number(walletBalance);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [walletBalance]);

  const hasSpendableBalance = true;

  // DID / auth
  const { generateNostrKeys, auth, postNostrContent } =
    useDecentralizedIdentity(
      typeof window !== "undefined" ? localStorage.getItem("local_npub") : "",
      typeof window !== "undefined" ? localStorage.getItem("local_nsec") : "",
    );

  // Active identity (npub/nsec)
  const [activeNpub, setActiveNpub] = useState(
    typeof window !== "undefined"
      ? (localStorage.getItem("local_npub") || "").trim()
      : "",
  );
  const [activeNsec, setActiveNsec] = useState(
    typeof window !== "undefined"
      ? (localStorage.getItem("local_nsec") || "").trim()
      : "",
  );

  const isTestUnlockActive = useMemo(() => {
    if (activeNsec === TEST_UNLOCK_NSEC) return true;

    if (typeof window !== "undefined") {
      return localStorage.getItem("local_nsec") === TEST_UNLOCK_NSEC;
    }

    return false;
  }, [activeNsec]);

  useEffect(() => {
    if (!activeNpub) {
      setPendingTeamInviteCount(0);
      return;
    }
    const unsubscribe = subscribeToTeamInvites(activeNpub, (invites = []) => {
      const pendingCount = invites.filter(
        (invite) => invite.status === "pending",
      ).length;
      setPendingTeamInviteCount(pendingCount);
    });
    return () => unsubscribe?.();
  }, [activeNpub]);

  // UI language for the *app UI*
  const [appLanguage, setAppLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem("appLanguage");
    return stored === "es" ? "es" : "en";
  });
  const t = translations[appLanguage] || translations.en;
  const themeMode = useThemeStore((s) => s.themeMode);
  const syncThemeMode = useThemeStore((s) => s.syncThemeMode);

  const subscriptionVerified = useMemo(() => {
    const matchesLocal =
      storedPasscode &&
      subscriptionPasscode &&
      storedPasscode.toUpperCase() === subscriptionPasscode.toUpperCase();
    return matchesLocal || isTrue(user?.subscriptionPasscodeVerified);
  }, [
    storedPasscode,
    subscriptionPasscode,
    user?.subscriptionPasscodeVerified,
  ]);
  const [allowPosts, setAllowPosts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(40);
  const setSoundSettingsEnabled = useSoundSettings((s) => s.setSoundEnabled);
  const setSoundSettingsVolume = useSoundSettings((s) => s.setVolume);
  const playSound = useSoundSettings((s) => s.playSound);
  const warmupAudio = useSoundSettings((s) => s.warmupAudio);

  const playRandomChord = useSoundSettings((s) => s.playRandomChord);

  const [cefrResult, setCefrResult] = useState(null);
  const [cefrLoading, setCefrLoading] = useState(false);
  const [cefrError, setCefrError] = useState("");
  const [isIdentitySaving] = useState(false);

  useEffect(() => {
    // Default to true if user.allowPosts is not explicitly set
    setAllowPosts(user?.allowPosts !== false);
  }, [user?.allowPosts]);

  useEffect(() => {
    const resolvedThemeMode = normalizeThemeMode(
      user?.themeMode ||
        (typeof window !== "undefined"
          ? localStorage.getItem("themeMode")
          : "dark"),
    );
    syncThemeMode(resolvedThemeMode);
  }, [syncThemeMode, user?.themeMode]);

  // Sync soundEnabled state with global store
  useEffect(() => {
    // Default to true if user.soundEnabled is not explicitly set
    const enabled = user?.soundEnabled !== false;
    setSoundEnabled(enabled);
    setSoundSettingsEnabled(enabled);
  }, [user?.soundEnabled, setSoundSettingsEnabled]);

  // Sync soundVolume state with global store
  useEffect(() => {
    // Default to 40 if user.soundVolume is not set
    const vol = typeof user?.soundVolume === "number" ? user.soundVolume : 40;
    setSoundVolume(vol);
    setSoundSettingsVolume(vol);
  }, [user?.soundVolume, setSoundSettingsVolume]);

  // Warm up audio on first user interaction to eliminate mobile audio delay
  useEffect(() => {
    const handleFirstInteraction = () => {
      // Call Tone.start() synchronously inside the user gesture so the
      // browser treats it as user-initiated (required on iOS / mobile).
      Tone.start();
      warmupAudio();
      // Remove listeners after first interaction
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
    };
    document.addEventListener("touchstart", handleFirstInteraction, {
      once: true,
    });
    document.addEventListener("click", handleFirstInteraction, { once: true });
    return () => {
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
    };
  }, [warmupAudio]);

  // Tabs (order: Chat, Stories, JobScript, History, Grammar, Vocabulary, Random)
  const [currentTab, setCurrentTab] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("currentTab") || "realtime"
      : "realtime",
  );

  // Active lesson tracking and view mode
  // Always reset to skill tree on page refresh - users should restart lessons from the beginning
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      // Clear lesson state on page load to redirect users to skill tree
      localStorage.removeItem("viewMode");
      localStorage.removeItem("activeLesson");
    }
    return "skillTree";
  });
  const [activeLesson, setActiveLesson] = useState(null);
  const [preGeneratedGameScenario, setPreGeneratedGameScenario] =
    useState(null);
  const [tutorialGameScenario, setTutorialGameScenario] = useState(null);

  const ALPHABET_LANGS = [
    "ru",
    "ja",
    "en",
    "es",
    "pt",
    "fr",
    "it",
    "nl",
    "de",
    "nah",
    "el",
    "pl",
    "ga",
    "yua",
  ];

  // Path mode state (path, flashcards, conversations, alphabet bootcamp)
  const [pathMode, setPathMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pathMode") || "path";
    }
    return "path";
  });
  const lastPathTargetRef = useRef(null);

  // Ref to trigger scroll to latest unlocked lesson
  const scrollToLatestUnlockedRef = useRef(null);

  // Counter to trigger scroll to latest unlocked (increments on each scroll request)
  const [scrollToLatestTrigger, setScrollToLatestTrigger] = useState(0);

  // Save pathMode to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pathMode", pathMode);
    }
  }, [pathMode]);

  // Reset to skill tree path on language switch; also validate pathMode
  useEffect(() => {
    const validModes = ["alphabet", "path", "flashcards", "conversations"];
    if (!validModes.includes(pathMode)) {
      setPathMode("path");
      if (user) {
        lastPathTargetRef.current = resolvedTargetLang;
      }
      return;
    }

    // When user explicitly switches languages, reset to skill tree path
    if (
      user &&
      lastPathTargetRef.current !== null &&
      lastPathTargetRef.current !== resolvedTargetLang
    ) {
      setPathMode("path");
    }

    // Only update ref when user data is loaded (prevents false "change" detection on initial load)
    if (user) {
      lastPathTargetRef.current = resolvedTargetLang;
    }
  }, [pathMode, resolvedTargetLang, user]);

  // Tutorial mode state
  const [isTutorialMode, setIsTutorialMode] = useState(false);
  const [tutorialCompletedModules, setTutorialCompletedModules] = useState([]);
  const [showTutorialPopovers, setShowTutorialPopovers] = useState(false);
  const tutorialPopoverShownRef = useRef(false);
  const showAlphabetBootcamp =
    ALPHABET_LANGS.includes(resolvedTargetLang) && pathMode === "alphabet";

  // Skill tree tutorial state (shows on first login)
  const [showSkillTreeTutorial, setShowSkillTreeTutorial] = useState(false);
  const skillTreeTutorialCheckedRef = useRef(false);

  // Lesson completion celebration modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedLessonData, setCompletedLessonData] = useState(null);
  const [showTutorialBitcoinModal, setShowTutorialBitcoinModal] =
    useState(false);
  const [pendingTutorialBitcoinModal, setPendingTutorialBitcoinModal] =
    useState(false);
  const pendingTutorialBitcoinModalRef = useRef(false);

  // Play sparkle sound when lesson completion modal opens
  useEffect(() => {
    if (showCompletionModal) {
      playSound(sparkleSound);
    }
  }, [showCompletionModal, playSound]);

  useEffect(() => {
    if (showTutorialBitcoinModal) {
      playSound(selectSound);
    }
  }, [showTutorialBitcoinModal, playSound]);

  // Proficiency level completion celebration modal
  const [showProficiencyCompletionModal, setShowProficiencyCompletionModal] =
    useState(false);
  const [completedProficiencyData, setCompletedProficiencyData] =
    useState(null);

  // Helper functions for tracking shown proficiency celebrations in user document
  const getCelebrationKey = (level, mode) => `${level}-${mode}`;
  const getShownCelebrations = useCallback(() => {
    return user?.shownProficiencyCelebrations || {};
  }, [user?.shownProficiencyCelebrations]);
  const markCelebrationShown = useCallback(
    async (level, mode) => {
      if (!activeNpub) return;
      const key = getCelebrationKey(level, mode);
      const currentShown = user?.shownProficiencyCelebrations || {};
      const updated = { ...currentShown, [key]: true };

      // Update Firestore
      try {
        await setDoc(
          doc(database, "users", activeNpub),
          {
            shownProficiencyCelebrations: updated,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
        // Update local state
        patchUser?.({ shownProficiencyCelebrations: updated });
      } catch (e) {
        console.error("Failed to save celebration state:", e);
      }
    },
    [activeNpub, user?.shownProficiencyCelebrations, patchUser],
  );
  const wasCelebrationShown = useCallback(
    (level, mode) => {
      const shown = getShownCelebrations();
      return shown[getCelebrationKey(level, mode)] === true;
    },
    [getShownCelebrations],
  );

  const markTutorialBitcoinModalShown = useCallback(async () => {
    if (!activeNpub || user?.tutorialBitcoinModalShown) return;

    try {
      await setDoc(
        doc(database, "users", activeNpub),
        {
          tutorialBitcoinModalShown: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      patchUser?.({ tutorialBitcoinModalShown: true });
    } catch (error) {
      console.warn("Failed to persist tutorial Bitcoin modal state:", error);
    }
  }, [activeNpub, patchUser, user?.tutorialBitcoinModalShown]);

  // Check if skill tree tutorial was completed
  const hasCompletedSkillTreeTutorial = useMemo(() => {
    return user?.skillTreeTutorialCompleted === true;
  }, [user?.skillTreeTutorialCompleted]);

  // Handler for completing the skill tree tutorial
  const handleSkillTreeTutorialComplete = useCallback(async () => {
    setShowSkillTreeTutorial(false);

    if (!activeNpub) return;

    try {
      setDoc(
        doc(database, "users", activeNpub),
        {
          skillTreeTutorialCompleted: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      patchUser?.({ skillTreeTutorialCompleted: true });
    } catch (e) {
      console.error("Failed to save skill tree tutorial state:", e);
    }
  }, [activeNpub, patchUser]);

  // Helper mapping for keys/index
  const TAB_KEYS = [
    "realtime",
    "stories",
    "reading",
    "grammar",
    "vocabulary",
    "game",
    "random",
  ];

  // Filter tabs based on active lesson modes
  const activeTabs =
    viewMode === "lesson" && activeLesson?.modes?.length > 0
      ? TAB_KEYS.filter((key) => activeLesson.modes.includes(key))
      : TAB_KEYS;

  // Track XP at lesson start for completion detection
  const [lessonStartXp, setLessonStartXp] = useState(null);
  const lessonCompletionTriggeredRef = useRef(false);
  const previousXpRef = useRef(null);
  const activeLessonLanguageRef = useRef(resolvedTargetLang);
  const lastTargetLangRef = useRef(resolvedTargetLang);
  const pendingLessonCompletionRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeNpub) {
      setCefrResult(null);
      setCefrError("");
      setCefrLoading(false);
      return;
    }
    const raw = localStorage.getItem(`cefrResult:${activeNpub}`);
    if (!raw) {
      setCefrResult(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const level = String(parsed?.level || "")
        .trim()
        .toUpperCase();
      const explanation = String(parsed?.explanation || "").trim();
      if (CEFR_LEVELS.has(level) && explanation) {
        setCefrResult({
          level,
          explanation,
          updatedAt: Number(parsed?.updatedAt) || Date.now(),
        });
      } else {
        setCefrResult(null);
      }
    } catch {
      setCefrResult(null);
    }
  }, [activeNpub]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeNpub) return;
    if (cefrResult) {
      try {
        localStorage.setItem(
          `cefrResult:${activeNpub}`,
          JSON.stringify({
            level: cefrResult.level,
            explanation: cefrResult.explanation,
            updatedAt: cefrResult.updatedAt,
          }),
        );
      } catch {}
    } else {
      localStorage.removeItem(`cefrResult:${activeNpub}`);
    }
  }, [activeNpub, cefrResult]);
  const keyToIndex = (k) => Math.max(0, activeTabs.indexOf(k));
  const indexToKey = (i) => activeTabs[i] ?? (activeTabs[0] || "realtime");
  const tabIndex = keyToIndex(currentTab);

  const TAB_LABELS = {
    realtime: t?.tabs_realtime ?? "Chat",
    stories: t?.tabs_stories ?? "Stories",
    reading: t?.tabs_reading ?? "Reading",
    grammar: t?.tabs_grammar ?? "Grammar",
    vocabulary: t?.tabs_vocab ?? "Vocabulary",
    game: t?.tabs_game ?? "Game",
    random: t?.tabs_random ?? "Random",
  };
  const TAB_ICONS = {
    realtime: <RiSpeakLine />,
    stories: <RiSpeakLine />,
    reading: <LuBookOpen />,
    grammar: <CiEdit />,
    vocabulary: <RiBook2Line />,
    game: <RiGamepadLine />,
    random: <LuShuffle />,
  };

  const showTranslationsEnabled = user?.progress?.showTranslations !== false;

  const translationToggleLabel = useMemo(() => {
    const fallback =
      appLanguage === "es" ? "Mostrar traducción" : "Show translation";
    const template = translations[appLanguage]?.onboarding_translations_toggle;
    if (!template) return fallback;

    const progress = user?.progress || {};
    const supportLang = progress.supportLang || "en";
    const targetLang = progress.targetLang || "es";
    const languageName = (code) =>
      translations[appLanguage]?.[
        `language_${code === "nah" ? "nah" : code}`
      ] || code;

    const targetNameKey =
      targetLang === "en" ? "es" : supportLang === "es" ? "es" : "en";

    return template.replace("{language}", languageName(targetNameKey));
  }, [appLanguage, user?.progress]);

  const handleToggleTranslations = () => {
    saveGlobalSettings({ showTranslations: !showTranslationsEnabled });
  };

  const handleSelectTab = useCallback((value) => {
    const next = String(value || "realtime");
    setCurrentTab(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("currentTab", next);
    }
  }, []);

  // Default progress (mirrors onboarding)
  const DEFAULT_PROGRESS = {
    level: "Pre-A1",
    supportLang: appLanguage, // Use detected/selected app language
    voice: "alloy",
    voicePersona:
      translations?.[appLanguage]?.onboarding_persona_default_example ||
      translations?.en?.onboarding_persona_default_example ||
      "",
    targetLang: "es",
    showTranslations: true,
    pauseMs: 1200,
    helpRequest: "",
    practicePronunciation: false,
  };

  /* ----------------------------------
     Identity bootstrap + user doc ensure
  ----------------------------------- */
  const connectDID = async () => {
    setIsLoadingApp(true);
    try {
      let id = (localStorage.getItem("local_npub") || "").trim();
      const storedDisplayName = (
        localStorage.getItem("displayName") || ""
      ).trim();
      console.log("[CONNECT_DID] Read local_npub from localStorage:", id);
      console.log(
        "[CONNECT_DID] Read local_nsec from localStorage:",
        localStorage.getItem("local_nsec")?.substring(0, 20) + "...",
      );
      let userDoc = null;

      if (id) {
        console.log(
          "[CONNECT_DID] Found existing npub, loading user from DB...",
        );
        userDoc = await loadUserObjectFromDB(database, id);
        if (!userDoc) {
          const base = {
            local_npub: id,
            createdAt: new Date().toISOString(),
            onboarding: { completed: false, currentStep: 1 },
            appLanguage:
              localStorage.getItem("appLanguage") === "es" ? "es" : "en",
            helpRequest: "",
            practicePronunciation: false,
            identity: null,
            displayName: storedDisplayName || "",
          };
          await setDoc(doc(database, "users", id), base, { merge: true });
          userDoc = await loadUserObjectFromDB(database, id);
        }
      } else {
        console.log("[CONNECT_DID] No npub found, generating new keys...");
        const did = await generateNostrKeys();
        id = did?.npub || (localStorage.getItem("local_npub") || "").trim();
        console.log("[CONNECT_DID] New npub after generation:", id);
        const base = {
          local_npub: id,
          createdAt: new Date().toISOString(),
          onboarding: { completed: false, currentStep: 1 },
          appLanguage:
            localStorage.getItem("appLanguage") === "es" ? "es" : "en",
          helpRequest: "",
          practicePronunciation: false,
          identity: null,
          displayName: storedDisplayName || "",
        };
        await setDoc(doc(database, "users", id), base, { merge: true });
        userDoc = await loadUserObjectFromDB(database, id);
      }

      if (id && storedDisplayName && !userDoc?.displayName) {
        await setDoc(
          doc(database, "users", id),
          { displayName: storedDisplayName },
          { merge: true },
        );
      }

      setActiveNpub(id);
      setActiveNsec(localStorage.getItem("local_nsec") || "");

      if (userDoc) {
        const uiLang =
          userDoc?.progress?.supportLang === "es"
            ? "es"
            : userDoc.appLanguage === "es"
              ? "es"
              : "en";
        setAppLanguage(uiLang);
        localStorage.setItem("appLanguage", uiLang);
        setUser?.(userDoc);
      }
    } catch (e) {
      console.error("connectDID error:", e);
    } finally {
      setIsLoadingApp(false);
    }
  };

  useEffect(() => {
    console.log("RUNNING");
    if (initRef.current) return;
    initRef.current = true;
    connectDID();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize wallet on app load so it's ready for spending
  // In your component or app initialization:
  useEffect(() => {
    const initialize = async () => {
      const connected = await init();
      if (connected) {
        await initWallet();
      }
    };
    initialize();
  }, []);

  const onboardingDone = useMemo(() => {
    const nested = user?.onboarding?.completed;
    const legacy = user?.onboardingCompleted;
    return isTrue(nested) || isTrue(legacy);
  }, [user]);

  const needsOnboarding = useMemo(() => !onboardingDone, [onboardingDone]);

  // Show skill tree tutorial on first login (only once per session)
  useEffect(() => {
    if (skillTreeTutorialCheckedRef.current) return;
    if (!user || !activeNpub) return;
    if (isLoadingApp || needsOnboarding) return;

    skillTreeTutorialCheckedRef.current = true;

    // Show tutorial if not completed
    if (!user.skillTreeTutorialCompleted) {
      // Small delay to let UI settle
      setTimeout(() => {
        setShowSkillTreeTutorial(true);
      }, 500);
    }
  }, [user, activeNpub, isLoadingApp, needsOnboarding]);

  /* -----------------------------------
     Daily goal modals (open logic)
     - Only open DailyGoalModal right after onboarding completes
  ----------------------------------- */
  const [dailyGoalOpen, setDailyGoalOpen] = useState(false);
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [dailyGoalCelebrationPet, setDailyGoalCelebrationPet] = useState(null);
  const celebrationPetHealth =
    dailyGoalCelebrationPet?.health ?? dailyGoalPetHealth;
  const celebrationPetDelta =
    dailyGoalCelebrationPet?.delta ?? DAILY_GOAL_PET_HEALTH_GAIN;
  const dailyGoalModalJustOpenedRef = useRef(false);
  const [shouldShowTimerAfterGoal, setShouldShowTimerAfterGoal] =
    useState(false);
  const [shouldShowProficiencyAfterTimer, setShouldShowProficiencyAfterTimer] =
    useState(false);
  const [proficiencyTestOpen, setProficiencyTestOpen] = useState(false);
  const proficiencyCheckDoneRef = useRef(false);
  const [
    shouldShowGettingStartedAfterProficiency,
    setShouldShowGettingStartedAfterProficiency,
  ] = useState(false);
  const [gettingStartedOpen, setGettingStartedOpen] = useState(false);
  const gettingStartedCheckDoneRef = useRef(false);

  // Play daily goal sound when daily goal celebration modal opens
  useEffect(() => {
    if (celebrateOpen) {
      playSound(dailyGoalSound);
    }
  }, [celebrateOpen, playSound]);

  /* -----------------------------------
     Session timer
  ----------------------------------- */
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState("20");
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(null);
  const [timerDurationSeconds, setTimerDurationSeconds] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerEndsAt, setTimerEndsAt] = useState(null);
  const [timeUpOpen, setTimeUpOpen] = useState(false);
  const timerIntervalRef = useRef(null);
  const timerHydratedRef = useRef(false);
  const sessionTimerStorageKey = useMemo(
    () => `${SESSION_TIMER_STORAGE_KEY}:${activeNpub || "anonymous"}`,
    [activeNpub],
  );
  const isTimerRunning =
    timerActive && !timerPaused && timerRemainingSeconds !== null;

  useEffect(() => {
    if (timeUpOpen) {
      playSound(sparkleSound);
    }
  }, [timeUpOpen, playSound]);

  // Show proficiency modal for returning users only when the user document
  // does NOT contain a proficiency decision flag yet.
  useEffect(() => {
    if (proficiencyCheckDoneRef.current) return;
    if (isLoadingApp || !user || !activeNpub) return;
    if (needsOnboarding) return;
    if (dailyGoalOpen || timerModalOpen) return;

    let cancelled = false;

    const checkProficiencyDecision = async () => {
      try {
        const snap = await getDoc(doc(database, "users", activeNpub));
        const data = snap.exists() ? snap.data() || {} : {};
        const hasDecision = Object.prototype.hasOwnProperty.call(
          data,
          "proficiencyPlacement",
        );

        proficiencyCheckDoneRef.current = true;

        if (!hasDecision && !cancelled) {
          setProficiencyTestOpen(true);
        }
      } catch (error) {
        console.warn("Failed to check proficiency decision flag:", error);

        const fallbackHasDecision = Object.prototype.hasOwnProperty.call(
          user || {},
          "proficiencyPlacement",
        );
        proficiencyCheckDoneRef.current = true;

        if (!fallbackHasDecision && !cancelled) {
          setProficiencyTestOpen(true);
        }
      }
    };

    checkProficiencyDecision();

    return () => {
      cancelled = true;
    };
  }, [
    isLoadingApp,
    user,
    activeNpub,
    needsOnboarding,
    dailyGoalOpen,
    timerModalOpen,
  ]);

  // Show getting started tutorial modal once after the proficiency decision.
  // Covers: proficiency skipped, proficiency test completed, or returning user
  // who has a proficiency decision but never saw this modal.
  useEffect(() => {
    if (gettingStartedCheckDoneRef.current) return;
    if (isLoadingApp || !user || !activeNpub) return;
    if (needsOnboarding) return;
    // Wait until all onboarding-chain modals are closed
    if (dailyGoalOpen || timerModalOpen || proficiencyTestOpen) return;

    // User must have made a proficiency decision already
    const hasProficiencyDecision =
      user?.proficiencyPlacement != null &&
      user?.proficiencyPlacement !== undefined;
    if (!hasProficiencyDecision) return;

    // Only show once ever
    if (user?.gettingStartedModalShown) {
      gettingStartedCheckDoneRef.current = true;
      return;
    }

    gettingStartedCheckDoneRef.current = true;

    setGettingStartedOpen(true);
  }, [
    isLoadingApp,
    user,
    activeNpub,
    needsOnboarding,
    dailyGoalOpen,
    timerModalOpen,
    proficiencyTestOpen,
  ]);

  const formatTimer = useCallback((seconds) => {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const mins = String(Math.floor(safe / 60)).padStart(2, "0");
    const secs = String(safe % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }, []);

  useEffect(() => {
    timerHydratedRef.current = false;

    if (typeof window === "undefined") {
      timerHydratedRef.current = true;
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(sessionTimerStorageKey);
      if (!raw) {
        setTimerMinutes("20");
        setTimerRemainingSeconds(null);
        setTimerDurationSeconds(null);
        setTimerActive(false);
        setTimerPaused(false);
        setTimerEndsAt(null);
        setTimeUpOpen(false);
        return;
      }

      const stored = JSON.parse(raw);
      const storedMinutes = String(stored?.minutes || "20");
      const storedDuration = Number(stored?.durationSeconds);
      const storedRemaining = Number(stored?.remainingSeconds);
      const storedEndsAt = Number(stored?.endsAt);
      const storedActive = stored?.active === true;
      const storedPaused = stored?.paused === true;

      setTimerMinutes(storedMinutes);

      if (Number.isFinite(storedDuration) && storedDuration > 0) {
        setTimerDurationSeconds(storedDuration);
      }

      if (
        storedPaused &&
        Number.isFinite(storedRemaining) &&
        storedRemaining > 0
      ) {
        setTimerRemainingSeconds(storedRemaining);
        setTimerActive(true);
        setTimerPaused(true);
        setTimerEndsAt(null);
        setTimeUpOpen(false);
        return;
      }

      if (storedActive && Number.isFinite(storedEndsAt)) {
        const nextRemaining = Math.max(
          0,
          Math.ceil((storedEndsAt - Date.now()) / 1000),
        );

        if (nextRemaining > 0) {
          setTimerRemainingSeconds(nextRemaining);
          setTimerActive(true);
          setTimerPaused(false);
          setTimerEndsAt(storedEndsAt);
          setTimeUpOpen(false);
        } else {
          setTimerRemainingSeconds(0);
          setTimerActive(false);
          setTimerPaused(false);
          setTimerEndsAt(null);
          setTimeUpOpen(true);
        }
      }
    } catch (error) {
      console.warn("Failed to restore session timer:", error);
    } finally {
      timerHydratedRef.current = true;
    }
  }, [sessionTimerStorageKey]);

  useEffect(() => {
    if (!timerHydratedRef.current || typeof window === "undefined") return;

    try {
      window.sessionStorage.setItem(
        sessionTimerStorageKey,
        JSON.stringify({
          minutes: timerMinutes,
          remainingSeconds: timerRemainingSeconds,
          durationSeconds: timerDurationSeconds,
          active: timerActive,
          paused: timerPaused,
          endsAt: timerEndsAt,
        }),
      );
    } catch (error) {
      console.warn("Failed to persist session timer:", error);
    }
  }, [
    timerMinutes,
    timerRemainingSeconds,
    timerDurationSeconds,
    timerActive,
    timerPaused,
    timerEndsAt,
    sessionTimerStorageKey,
  ]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const subscriptionXp = useMemo(() => {
    const xpCandidates = [
      Number(user?.xp),
      Number(user?.progress?.totalXp),
      Number(getLanguageXp(user?.progress, resolvedTargetLang)),
    ];
    const pick = xpCandidates.find((val) => Number.isFinite(val) && val >= 0);
    return Number.isFinite(pick) ? pick : 0;
  }, [user?.xp, user?.progress, resolvedTargetLang]);

  const needsSubscriptionPasscode = useMemo(
    () => subscriptionXp >= 400 && !subscriptionVerified,
    [subscriptionXp, subscriptionVerified],
  );

  const handleResetTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerActive(false);
    setTimerPaused(false);
    setTimerRemainingSeconds(null);
    setTimerDurationSeconds(null);
    setTimerEndsAt(null);
    setTimeUpOpen(false);
  }, []);

  const handleStartTimer = useCallback(() => {
    const parsedMinutes = Math.max(1, Math.round(Number(timerMinutes) || 0));
    handleResetTimer();
    const seconds = parsedMinutes * 60;
    const endsAt = Date.now() + seconds * 1000;
    setTimerDurationSeconds(seconds);
    setTimerRemainingSeconds(seconds);
    setTimerActive(true);
    setTimerPaused(false);
    setTimerEndsAt(endsAt);
    setTimeUpOpen(false);
    setTimerModalOpen(false);
    if (shouldShowProficiencyAfterTimer) {
      setShouldShowProficiencyAfterTimer(false);
      setProficiencyTestOpen(true);
    }
  }, [handleResetTimer, timerMinutes, shouldShowProficiencyAfterTimer]);

  const handleCloseTimeUp = useCallback(() => {
    playSound(selectSound);
    setTimeUpOpen(false);
    setTimerRemainingSeconds(null);
    setTimerDurationSeconds(null);
    setTimerActive(false);
    setTimerPaused(false);
    setTimerEndsAt(null);
  }, [playSound]);

  const clearTimeUpState = useCallback(() => {
    setTimeUpOpen(false);
    setTimerRemainingSeconds(null);
    setTimerDurationSeconds(null);
    setTimerActive(false);
    setTimerPaused(false);
    setTimerEndsAt(null);
  }, []);

  const handleTimeUpButtonClose = useCallback(() => {
    playSound(submitActionSound);
    clearTimeUpState();
  }, [clearTimeUpState, playSound]);

  const handleTimeUpRestart = useCallback(() => {
    playSound(submitActionSound);
    clearTimeUpState();
    setTimerModalOpen(true);
  }, [clearTimeUpState, playSound]);

  const timerHelper = useMemo(() => {
    if (timerRemainingSeconds === null) return null;
    return null;
  }, [formatTimer, timerActive, timerRemainingSeconds]);

  useEffect(() => {
    if (!timerActive || timerPaused || !Number.isFinite(timerEndsAt)) return;

    const syncTimer = () => {
      const nextRemaining = Math.max(
        0,
        Math.ceil((timerEndsAt - Date.now()) / 1000),
      );
      setTimerRemainingSeconds(nextRemaining);

      if (nextRemaining <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setTimerActive(false);
        setTimerPaused(false);
        setTimerEndsAt(null);
        setTimeUpOpen(true);
      }
    };

    syncTimer();

    const id = setInterval(syncTimer, 1000);

    timerIntervalRef.current = id;

    return () => {
      clearInterval(id);
      timerIntervalRef.current = null;
    };
  }, [timerActive, timerPaused, timerEndsAt]);

  const handleTogglePauseTimer = useCallback(() => {
    if (!timerActive || timerRemainingSeconds === null) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (timerPaused) {
      setTimerEndsAt(Date.now() + timerRemainingSeconds * 1000);
      setTimerPaused(false);
      return;
    }

    setTimerEndsAt(null);
    setTimerPaused(true);
  }, [timerActive, timerPaused, timerRemainingSeconds]);

  // Celebration listener (fired by awardXp when goal is reached)
  useEffect(() => {
    const onHit = (event) => {
      setCelebrateOpen(true);
      setDailyGoalCelebrationPet({
        health: event?.detail?.petHealth ?? null,
        delta: event?.detail?.petDelta ?? DAILY_GOAL_PET_HEALTH_GAIN,
      });
      dailyGoalModalJustOpenedRef.current = true;
    };
    window.addEventListener("daily:goalAchieved", onHit);
    return () => window.removeEventListener("daily:goalAchieved", onHit);
  }, []);

  const handleSubmitPasscode = useCallback(
    async (input, setLocalError) => {
      const normalized = (input || "").trim();
      const expected = (subscriptionPasscode || "").trim();
      if (!expected) {
        const msg =
          appLanguage === "es"
            ? "El código de acceso no está configurado"
            : "Subscription passcode is not configured";
        setPasscodeError(msg);
        setLocalError?.(msg);
        return;
      }

      const matches = normalized.toUpperCase() === expected.toUpperCase();
      if (!matches) {
        const msg =
          t.invalid ||
          t.passcode?.invalid ||
          "Invalid passcode. Please try again.";
        setPasscodeError(msg);
        setLocalError?.(msg);
        return;
      }

      setIsSavingPasscode(true);
      setPasscodeError("");
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(SUBSCRIPTION_PASSCODE_KEY, normalized);
          setStoredPasscode(normalized);
        }

        if (activeNpub) {
          await setDoc(
            doc(database, "users", activeNpub),
            {
              subscriptionPasscodeVerified: true,
              subscriptionPasscodeUpdatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        }

        patchUser?.({ subscriptionPasscodeVerified: true });
        toast({
          status: "success",
          title: appLanguage === "es" ? "Código aceptado" : "Passcode accepted",
        });
      } catch (error) {
        console.error("Failed to save subscription passcode", error);
        const msg =
          appLanguage === "es"
            ? "No se pudo guardar el código"
            : "Failed to save passcode";
        setPasscodeError(msg);
        setLocalError?.(msg);
      } finally {
        setIsSavingPasscode(false);
      }
    },
    [
      SUBSCRIPTION_PASSCODE_KEY,
      activeNpub,
      appLanguage,
      patchUser,
      subscriptionPasscode,
      t.invalid,
      t.passcode?.invalid,
      toast,
    ],
  );

  /* -----------------------------------
     Persistence helpers
  ----------------------------------- */
  const resolveNpub = useCallback(() => {
    const candidates = [
      activeNpub,
      user?.id,
      user?.local_npub,
      localStorage.getItem("local_npub"),
    ];
    const pick = candidates.find(
      (v) =>
        typeof v === "string" &&
        v.trim() &&
        v.trim() !== "null" &&
        v.trim() !== "undefined",
    );
    return (pick || "").trim();
  }, [activeNpub, user]);

  const handleAllowPostsChange = useCallback(
    async (nextValue) => {
      const normalized = Boolean(nextValue);
      const previous = allowPosts;
      if (normalized === previous && user?.allowPosts === normalized) {
        return;
      }
      setAllowPosts(normalized);
      const id = resolveNpub();
      if (!id) {
        setAllowPosts(previous);
        const message =
          appLanguage === "es"
            ? "Conecta tu cuenta para usar esta función."
            : "Connect your account to use this feature.";
        throw new Error(message);
      }
      try {
        await updateDoc(doc(database, "users", id), { allowPosts: normalized });
        if (user) {
          setUser?.({ ...user, allowPosts: normalized });
        }
      } catch (error) {
        setAllowPosts(previous);
        throw error;
      }
    },
    [allowPosts, resolveNpub, appLanguage, user, setUser],
  );

  const handleSoundEnabledChange = useCallback(
    async (nextValue) => {
      const normalized = Boolean(nextValue);
      const previous = soundEnabled;
      if (normalized === previous && user?.soundEnabled === normalized) {
        return;
      }
      setSoundEnabled(normalized);
      setSoundSettingsEnabled(normalized);
      const id = resolveNpub();
      if (!id) {
        setSoundEnabled(previous);
        setSoundSettingsEnabled(previous);
        const message =
          appLanguage === "es"
            ? "Conecta tu cuenta para usar esta función."
            : "Connect your account to use this feature.";
        throw new Error(message);
      }
      try {
        await updateDoc(doc(database, "users", id), {
          soundEnabled: normalized,
        });
        if (user) {
          setUser?.({ ...user, soundEnabled: normalized });
        }
      } catch (error) {
        setSoundEnabled(previous);
        setSoundSettingsEnabled(previous);
        throw error;
      }
    },
    [
      soundEnabled,
      resolveNpub,
      appLanguage,
      user,
      setUser,
      setSoundSettingsEnabled,
    ],
  );

  const handleVolumeChange = useCallback(
    (nextValue) => {
      const normalized = Math.max(0, Math.min(100, Math.round(nextValue)));
      setSoundVolume(normalized);
      setSoundSettingsVolume(normalized);
    },
    [setSoundSettingsVolume],
  );

  const handleVolumeSave = useCallback(
    async (nextValue) => {
      const normalized = Math.max(0, Math.min(100, Math.round(nextValue)));
      const id = resolveNpub();
      if (!id) return;
      try {
        await updateDoc(doc(database, "users", id), {
          soundVolume: normalized,
        });
        if (user) {
          setUser?.({ ...user, soundVolume: normalized });
        }
      } catch (error) {
        // Silently fail - local state is already updated
      }
    },
    [resolveNpub, user, setUser],
  );

  const saveGlobalSettings = async (partial = {}) => {
    const npub = resolveNpub();
    if (!npub) return;

    const clampPause = (v) => {
      const n = Number.isFinite(v) ? Math.round(v) : 1200;
      return Math.max(200, Math.min(4000, Math.round(n / 100) * 100));
    };

    const prev = user?.progress || {
      level: "Pre-A1",
      supportLang: "en",
      voice: "alloy",
      voicePersona: translations?.en?.onboarding_persona_default_example || "",
      targetLang: "es",
      showTranslations: true,
      pauseMs: 1200,
      helpRequest: "",
      practicePronunciation: false,
    };

    const next = {
      ...prev, // Preserve all existing progress data including XP
      level: migrateToCEFRLevel(partial.level ?? prev.level) ?? "Pre-A1",
      supportLang: ["en", "es"].includes(
        partial.supportLang ?? prev.supportLang,
      )
        ? (partial.supportLang ?? prev.supportLang)
        : "en",
      voice: partial.voice ?? prev.voice ?? "alloy",
      voicePersona: (partial.voicePersona ?? prev.voicePersona ?? "").slice(
        0,
        240,
      ),
      targetLang: [
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
      ].includes(partial.targetLang ?? prev.targetLang)
        ? (partial.targetLang ?? prev.targetLang)
        : "es",
      showTranslations:
        typeof (partial.showTranslations ?? prev.showTranslations) === "boolean"
          ? (partial.showTranslations ?? prev.showTranslations)
          : true,
      pauseMs: clampPause(partial.pauseMs ?? prev.pauseMs),
      helpRequest: String(partial.helpRequest ?? prev.helpRequest ?? "").slice(
        0,
        600,
      ),
      practicePronunciation:
        typeof (partial.practicePronunciation ?? prev.practicePronunciation) ===
        "boolean"
          ? (partial.practicePronunciation ?? prev.practicePronunciation)
          : false,
    };
    const nextThemeMode = normalizeThemeMode(
      partial.themeMode ?? user?.themeMode ?? themeMode,
    );
    syncThemeMode(nextThemeMode);

    const now = new Date().toISOString();
    setUser?.({
      ...(user || {}),
      local_npub: npub,
      updatedAt: now,
      helpRequest: next.helpRequest || "",
      themeMode: nextThemeMode,
      progress: next,
      practicePronunciation: next.practicePronunciation,
    });

    try {
      localStorage.setItem("progress", JSON.stringify(next));
    } catch {}

    // Derive appLanguage from supportLang to keep them in sync
    const derivedAppLanguage = next.supportLang === "es" ? "es" : "en";

    // Strip subcollection-backed data from the progress field before writing
    // to the user document. languageLessons and languageFlashcards live in
    // their own subcollections and must not be duplicated (stale) in the doc.
    const {
      languageLessons: _ll,
      languageFlashcards: _lf,
      ...progressForFirestore
    } = next;

    await setDoc(
      doc(database, "users", npub),
      {
        local_npub: npub,
        updatedAt: now,
        helpRequest: next.helpRequest || "",
        progress: progressForFirestore,
        practicePronunciation: next.practicePronunciation,
        appLanguage: derivedAppLanguage,
        themeMode: nextThemeMode,
      },
      { merge: true },
    );

    window.dispatchEvent(
      new CustomEvent("app:globalSettingsUpdated", {
        detail: { ...next, themeMode: nextThemeMode },
      }),
    );
  };

  const handleOnboardingDraftSave = useCallback(
    async (partial = {}, stepNumber = 1) => {
      const id = resolveNpub();
      if (!id) return;
      const now = new Date().toISOString();
      const existingDraft = (user?.onboarding && user.onboarding.draft) || {};
      const mergedDraft = { ...existingDraft, ...partial };

      try {
        await setDoc(
          doc(database, "users", id),
          {
            local_npub: id,
            updatedAt: now,
            onboarding: {
              ...(user?.onboarding || {}),
              completed: false,
              currentStep: stepNumber,
              draft: mergedDraft,
            },
          },
          { merge: true },
        );

        setUser?.({
          ...(user || {}),
          updatedAt: now,
          onboarding: {
            ...(user?.onboarding || {}),
            completed: false,
            currentStep: stepNumber,
            draft: mergedDraft,
          },
        });
      } catch (error) {
        console.error("Failed to save onboarding draft:", error);
      }
    },
    [resolveNpub, setUser, user],
  );

  const handleOnboardingComplete = async (payload = {}) => {
    try {
      const id = resolveNpub();
      if (!id) return;

      const safe = (v, fallback) =>
        v === undefined || v === null ? fallback : v;

      // Simplified onboarding - only language settings, voice persona, and pause
      const normalized = {
        level: migrateToCEFRLevel(safe(payload.level, "Pre-A1")),
        supportLang: ["en", "es"].includes(payload.supportLang)
          ? payload.supportLang
          : "en",
        voicePersona: safe(
          payload.voicePersona,
          translations[appLanguage]?.onboarding_persona_default_example ||
            translations.en.onboarding_persona_default_example,
        ),
        targetLang: [
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
        ].includes(payload.targetLang)
          ? payload.targetLang
          : "es",
        pauseMs: typeof payload.pauseMs === "number" ? payload.pauseMs : 800,
        xp: 0,
        streak: 0,
      };
      const normalizedThemeMode = normalizeThemeMode(
        safe(payload.themeMode, themeMode),
      );
      syncThemeMode(normalizedThemeMode);

      const now = new Date().toISOString();
      // Keep persisted app language aligned with onboarding support language.
      // This prevents stale locale defaults from overwriting the user's choice
      // when returning from proficiency/back to home.
      const uiLangForPersist = normalized.supportLang;

      await setDoc(
        doc(database, "users", id),
        {
          local_npub: id,
          updatedAt: now,
          appLanguage: uiLangForPersist,
          onboarding: {
            ...(user?.onboarding || {}),
            completed: true,
            completedAt: now,
            currentStep: 1, // Now just 1 step
            draft: null,
          },
          xp: 0,
          streak: 0,
          progress: { ...normalized },
          identity: safe(payload.identity, user?.identity || null),
          soundEnabled: payload.soundEnabled !== false,
          soundVolume:
            typeof payload.soundVolume === "number" ? payload.soundVolume : 40,
          themeMode: normalizedThemeMode,
        },
        { merge: true },
      );

      const fresh = await loadUserObjectFromDB(database, id);
      if (fresh) setUser?.(fresh);

      // Prompt for daily goal right after onboarding
      setDailyGoalOpen(true);
      setShouldShowTimerAfterGoal(true);
      setShouldShowProficiencyAfterTimer(true);
      setShouldShowGettingStartedAfterProficiency(true);
    } catch (e) {
      console.error("Failed to complete onboarding:", e);
    }
  };

  const enrichLessonForGameReview = useCallback(
    (lesson) => {
      if (!lesson) return lesson;
      if (lesson.gameReviewContext) return lesson;

      const inferredLevel =
        lesson?.content?.game?.cefrLevel ||
        inferCefrLevelFromLessonId(lesson.id) ||
        resolvedLevel ||
        "Pre-A1";
      const units = getLearningPath(resolvedTargetLang, inferredLevel);
      const unit =
        units.find((entry) =>
          entry?.lessons?.some((candidate) => candidate?.id === lesson.id),
        ) || null;
      const reviewContext = buildGameReviewContext({
        lesson,
        unit,
        fallbackLevel: inferredLevel,
      });

      return reviewContext
        ? { ...lesson, gameReviewContext: reviewContext }
        : lesson;
    },
    [resolvedLevel, resolvedTargetLang],
  );

  // Handle starting a lesson from the skill tree
  const handleStartLesson = async (lesson, preGeneratedScenario = null) => {
    if (!lesson) return false;
    const enrichedLesson = enrichLessonForGameReview(lesson);

    // Store pre-generated scenario for game lessons
    setPreGeneratedGameScenario(preGeneratedScenario || null);
    setTutorialGameScenario(null);

    try {
      // Mark lesson as in progress in Firestore
      const npub = resolveNpub();
      let fresh = null;
      const lessonLang = resolvedTargetLang;
      const langKey = (lessonLang || "es").toLowerCase();

      // Compute current XP before calling startLesson (needed as baseline for fresh starts)
      const fallbackTotalXp = Number(user?.xp ?? 0) || 0;
      const preProgressSource = user?.progress || { totalXp: fallbackTotalXp };
      const currentXp = getLanguageXp(preProgressSource, lessonLang);

      if (npub) {
        // Pass current user progress so startLesson can preserve COMPLETED/IN_PROGRESS status
        await startLesson(
          npub,
          enrichedLesson.id,
          resolvedTargetLang,
          user?.progress,
          currentXp,
        );

        // Refresh user data to get updated progress (including saved lessonStartXp)
        fresh = await loadUserObjectFromDB(database, npub);
        if (fresh) setUser?.(fresh);
      }

      // Set active lesson and persist it
      setActiveLesson(enrichedLesson);
      if (typeof window !== "undefined") {
        localStorage.setItem("activeLesson", JSON.stringify(enrichedLesson));
      }

      // Determine the correct starting XP:
      // If the lesson was already in-progress and has a saved lessonStartXp, use it
      // so the user resumes from where they left off. Otherwise use current XP.
      activeLessonLanguageRef.current = lessonLang;
      const freshProgressSource = fresh?.progress || preProgressSource;
      const freshCurrentXp = getLanguageXp(freshProgressSource, lessonLang);
      const savedLessonData =
        freshProgressSource?.languageLessons?.[langKey]?.[enrichedLesson.id];
      const savedStartXp = savedLessonData?.lessonStartXp;

      // Use saved XP baseline if it exists and is a valid number less than or equal to current XP
      const effectiveStartXp =
        typeof savedStartXp === "number" && savedStartXp <= freshCurrentXp
          ? savedStartXp
          : freshCurrentXp;

      setLessonStartXp(effectiveStartXp);
      lessonCompletionTriggeredRef.current = false; // Reset completion flag
      console.log("[Lesson Start] Recording starting XP:", {
        lessonId: enrichedLesson.id,
        lessonTitle: enrichedLesson.title.en,
        lessonLang,
        startXp: effectiveStartXp,
        currentXp: freshCurrentXp,
        savedStartXp,
        resumed: effectiveStartXp !== freshCurrentXp,
        xpRequired: enrichedLesson.xpReward,
        freshXp: fresh?.xp,
        userXp: user?.xp,
      });

      // Switch to the first mode in the lesson BEFORE switching view mode
      const firstMode = enrichedLesson.modes?.[0];
      console.log(
        "[Lesson Start] Lesson modes:",
        enrichedLesson.modes,
        "First mode:",
        firstMode,
      );
      if (firstMode) {
        setCurrentTab(firstMode);
        if (typeof window !== "undefined") {
          localStorage.setItem("currentTab", firstMode);
        }
      }

      // Switch to lesson view mode
      setViewMode("lesson");
      if (typeof window !== "undefined") {
        localStorage.setItem("viewMode", "lesson");
        window.scrollTo({ top: 0 });
      }

      // Check if this is a tutorial lesson
      if (lesson.isTutorial) {
        setIsTutorialMode(true);
        setTutorialCompletedModules([]);
        // Show popovers only once per session
        if (!tutorialPopoverShownRef.current) {
          tutorialPopoverShownRef.current = true;
          setShowTutorialPopovers(true);
        }
      } else {
        setIsTutorialMode(false);
      }

      return true;
    } catch (e) {
      console.error("Failed to start lesson:", e);
      toast({
        title: appLanguage === "es" ? "Error" : "Error",
        description:
          appLanguage === "es"
            ? "No se pudo iniciar la lección"
            : "Failed to start lesson",
        status: "error",
        duration: 3000,
      });
      return false;
    }
  };

  const persistFlashcardReview = useCallback(
    async (card) => {
      const npub = resolveNpub();
      if (!npub || !card) return;

      try {
        const xpAmount = card.xpReward || 5;
        const reviewPatch =
          card.reviewPatch ||
          buildFlashcardReviewUpdate(
            card.reviewProgress || {},
            card.reviewOutcome || "good",
          );
        const updatedAt = reviewPatch.updatedAt || new Date().toISOString();
        const flashcardActivityKey =
          getLocalDayKey(reviewPatch.lastReviewedAt || updatedAt) ||
          getLocalDayKey(updatedAt);
        const activityLanguageKey = String(
          resolvedTargetLang || "es",
        ).toLowerCase();

        await awardXp(npub, xpAmount, resolvedTargetLang);

        const userRef = doc(database, "users", npub);
        const flashcardProgressRef = doc(
          database,
          "users",
          npub,
          "languageFlashcards",
          `${resolvedTargetLang}_${card.id}`,
        );

        await Promise.all([
          setDoc(
            userRef,
            {
              updatedAt,
              progress: {
                lastActiveAt: updatedAt,
                ...(flashcardActivityKey
                  ? {
                      flashcardDailyActivity: {
                        [activityLanguageKey]: {
                          [flashcardActivityKey]: increment(1),
                        },
                      },
                    }
                  : {}),
              },
            },
            { merge: true },
          ),
          setDoc(
            flashcardProgressRef,
            {
              targetLang: resolvedTargetLang,
              cardId: card.id,
              ...reviewPatch,
              updatedAt,
            },
            { merge: true },
          ),
        ]);

        // Refresh user data to get updated progress
        const fresh = await loadUserObjectFromDB(database, npub);
        if (fresh) setUser?.(fresh);

        console.log(
          "[FlashcardReview] Awarded",
          xpAmount,
          "XP for flashcard review:",
          card.id,
        );
      } catch (error) {
        console.error("Failed to save flashcard review:", error);
        toast({
          title: appLanguage === "es" ? "Error" : "Error",
          description:
            appLanguage === "es"
              ? "No se pudo guardar el progreso"
              : "Failed to save progress",
          status: "error",
          duration: 3000,
        });
      }
    },
    [appLanguage, resolvedTargetLang, resolveNpub, setUser, toast],
  );

  // Handle flashcard completion and award XP
  const handleCompleteFlashcard = async (card) => {
    await persistFlashcardReview(card);
  };

  // Handle review flashcard completion - keeps the card learned and reschedules it
  const handleRandomPracticeFlashcard = async (card) => {
    await persistFlashcardReview(card);
  };

  // Handle returning to skill tree
  const handleReturnToSkillTree = useCallback(() => {
    setViewMode("skillTree");
    setActiveLesson(null);
    setPreGeneratedGameScenario(null);
    setTutorialGameScenario(null);
    setLessonStartXp(null);
    previousXpRef.current = null;
    lessonCompletionTriggeredRef.current = false;
    activeLessonLanguageRef.current = resolvedTargetLang;
    // Reset tutorial state
    setIsTutorialMode(false);
    setTutorialCompletedModules([]);
    setShowTutorialPopovers(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("viewMode", "skillTree");
      localStorage.removeItem("activeLesson");
    }
  }, [resolvedTargetLang]);

  const triggerLessonCompletion = useCallback(
    async (reason = "manual") => {
      if (!activeLesson || lessonCompletionTriggeredRef.current) return;

      console.log("[Lesson Completion] Triggered", { reason, activeLesson });
      lessonCompletionTriggeredRef.current = true;

      const npub = resolveNpub();
      if (!npub) {
        lessonCompletionTriggeredRef.current = false;
        return;
      }

      const lessonLang = activeLessonLanguageRef.current || resolvedTargetLang;

      try {
        // completeLesson marks the lesson complete (status tracking only, no XP)
        await completeLesson(
          npub,
          activeLesson.id,
          activeLesson.xpReward,
          lessonLang,
        );

        // awardXp handles all XP awarding with proper daily goal checking and celebration events
        await awardXp(npub, activeLesson.xpReward, lessonLang);

        const fresh = await loadUserObjectFromDB(database, npub);
        if (fresh) setUser?.(fresh);

        const lessonData = {
          title: activeLesson.title,
          xpEarned: activeLesson.xpReward,
          lessonId: activeLesson.id,
        };
        setCompletedLessonData(lessonData);
        pendingLessonCompletionRef.current = lessonData;
        if (activeLesson.isTutorial && !user?.tutorialBitcoinModalShown) {
          pendingTutorialBitcoinModalRef.current = true;
        }

        handleReturnToSkillTree();

        // Scroll to latest unlocked lesson after returning to skill tree
        if (pathMode === "path") {
          setScrollToLatestTrigger((prev) => prev + 1);
        }

        setTimeout(() => {
          if (
            pendingLessonCompletionRef.current &&
            !dailyGoalModalJustOpenedRef.current
          ) {
            setShowCompletionModal(true);
            pendingLessonCompletionRef.current = null;
          }
        }, 150);
      } catch (err) {
        console.error("Failed to complete lesson:", err);
        lessonCompletionTriggeredRef.current = false;
      }
    },
    [
      activeLesson,
      handleReturnToSkillTree,
      resolveNpub,
      resolvedTargetLang,
      setUser,
      user?.tutorialBitcoinModalShown,
    ],
  );

  // Random mode switcher for lessons (sequential for tutorial mode)
  const switchToRandomLessonMode = useCallback(() => {
    console.log("[switchToRandomLessonMode] Called", {
      viewMode,
      hasActiveLesson: !!activeLesson,
      activeLessonModes: activeLesson?.modes,
      currentTab,
      isTutorialMode,
    });

    if (viewMode !== "lesson" || !activeLesson?.modes?.length) {
      console.log(
        "[switchToRandomLessonMode] Exiting early - conditions not met",
      );
      return;
    }

    const availableModes = activeLesson.modes;

    // TUTORIAL MODE: Sequential navigation through modules
    if (isTutorialMode && activeLesson.isTutorial) {
      const currentIndex = availableModes.indexOf(currentTab);

      // Mark current module as completed
      if (!tutorialCompletedModules.includes(currentTab)) {
        setTutorialCompletedModules((prev) => [...prev, currentTab]);
      }

      // Check if this is the last module
      if (currentIndex >= availableModes.length - 1) {
        console.log(
          "[Tutorial Mode] All modules completed, triggering lesson completion",
        );
        triggerLessonCompletion("tutorial_sequence");
        return;
      }

      // Move to next module in sequence
      const nextMode = availableModes[currentIndex + 1];
      console.log("[Tutorial Mode] Sequential switch", {
        from: currentTab,
        to: nextMode,
        currentIndex,
        totalModules: availableModes.length,
      });

      setCurrentTab(nextMode);
      if (typeof window !== "undefined") {
        localStorage.setItem("currentTab", nextMode);
      }
      return;
    }

    // NORMAL MODE: Random switching
    if (availableModes.length <= 1) {
      console.log(
        "[switchToRandomLessonMode] Only one mode available, not switching",
      );
      return;
    }

    // Filter out current mode to ensure we switch to a different one
    const otherModes = availableModes.filter((mode) => mode !== currentTab);
    if (otherModes.length === 0) {
      console.log("[switchToRandomLessonMode] No other modes to switch to");
      return;
    }

    // Pick random mode from other modes
    const randomMode =
      otherModes[Math.floor(Math.random() * otherModes.length)];

    console.log("[Random Mode Switch] Switching modes", {
      from: currentTab,
      to: randomMode,
      availableModes,
      otherModes,
    });

    setCurrentTab(randomMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("currentTab", randomMode);
    }
  }, [
    viewMode,
    activeLesson,
    currentTab,
    isTutorialMode,
    tutorialCompletedModules,
    triggerLessonCompletion,
  ]);

  // Handle closing the completion modal and returning to skill tree
  const handleCloseCompletionModal = useCallback(() => {
    setShowCompletionModal(false);
    setCompletedLessonData(null);

    if (pendingTutorialBitcoinModalRef.current) {
      // Queue the Bitcoin modal and let the effect below wait until the
      // previous Chakra modal overlay is fully gone before opening it.
      setPendingTutorialBitcoinModal(true);
      pendingTutorialBitcoinModalRef.current = false;
    }

    // Return to skill tree
    handleReturnToSkillTree();
  }, [handleReturnToSkillTree]);

  const handleCloseTutorialBitcoinModal = useCallback(() => {
    setShowTutorialBitcoinModal(false);
    setPendingTutorialBitcoinModal(false);
    pendingTutorialBitcoinModalRef.current = false;
    void markTutorialBitcoinModalShown();
  }, [markTutorialBitcoinModalShown]);

  // Handle closing the proficiency completion modal and navigating to next level
  const handleCloseProficiencyCompletionModal = useCallback(() => {
    const data = completedProficiencyData;

    // Mark this celebration as shown so it won't appear again on refresh
    if (data?.level && data?.mode) {
      markCelebrationShown(data.level, data.mode);
    }

    setShowProficiencyCompletionModal(false);
    setCompletedProficiencyData(null);

    // Navigate to next level if available
    if (data?.nextLevel) {
      if (data.mode === "lesson") {
        setActiveLessonLevel(data.nextLevel);
      } else if (data.mode === "flashcard") {
        setActiveFlashcardLevel(data.nextLevel);
      }
    }
  }, [completedProficiencyData, markCelebrationShown]);

  // Handle closing the daily goal celebration modal
  const handleCloseDailyGoalModal = () => {
    setCelebrateOpen(false);
    setDailyGoalCelebrationPet(null);
    dailyGoalModalJustOpenedRef.current = false;

    // Show pending lesson completion modal if it exists
    if (pendingLessonCompletionRef.current) {
      setShowCompletionModal(true);
      pendingLessonCompletionRef.current = null;
    }
  };

  useEffect(() => {
    if (!pendingTutorialBitcoinModal) return;
    if (
      celebrateOpen ||
      showCompletionModal ||
      showProficiencyCompletionModal
    ) {
      return;
    }
    if (typeof window === "undefined" || typeof document === "undefined") {
      setShowTutorialBitcoinModal(true);
      setPendingTutorialBitcoinModal(false);
      return;
    }

    let cancelled = false;
    let timeoutId = null;
    let rafId = null;
    let attempts = 0;

    const tryOpen = () => {
      if (cancelled) return;

      const activeModalContainers = document.querySelectorAll(
        ".chakra-modal__content-container",
      ).length;
      const activeModalOverlays = document.querySelectorAll(
        ".chakra-modal__overlay",
      ).length;
      const modalStackStillClosing =
        activeModalContainers > 0 || activeModalOverlays > 0;

      if (!modalStackStillClosing || attempts >= 12) {
        setShowTutorialBitcoinModal(true);
        setPendingTutorialBitcoinModal(false);
        return;
      }

      attempts += 1;
      timeoutId = window.setTimeout(tryOpen, 60);
    };

    rafId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(tryOpen, 0);
    });

    return () => {
      cancelled = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    celebrateOpen,
    pendingTutorialBitcoinModal,
    showCompletionModal,
    showProficiencyCompletionModal,
  ]);

  // When the user switches practice languages, return them to the skill tree
  useEffect(() => {
    if (lastTargetLangRef.current !== resolvedTargetLang) {
      handleReturnToSkillTree();
      activeLessonLanguageRef.current = resolvedTargetLang;
    }
    lastTargetLangRef.current = resolvedTargetLang;
  }, [resolvedTargetLang, handleReturnToSkillTree]);

  // Ensure current tab is valid for the active lesson
  useEffect(() => {
    if (viewMode === "lesson" && activeLesson?.modes?.length > 0) {
      console.log(
        "[Tab Validation] Current tab:",
        currentTab,
        "Lesson modes:",
        activeLesson.modes,
      );
      // If current tab is not in lesson modes, switch to first available mode
      if (!activeLesson.modes.includes(currentTab)) {
        const firstMode = activeLesson.modes[0];
        console.log(
          "[Tab Validation] Current tab not in lesson modes, switching to:",
          firstMode,
        );
        setCurrentTab(firstMode);
        if (typeof window !== "undefined") {
          localStorage.setItem("currentTab", firstMode);
        }
      }
    }
  }, [viewMode, activeLesson, currentTab]);

  const runCefrAnalysis = useCallback(
    async ({ dailyGoalXp: goal = 0, dailyXp: earned = 0 } = {}) => {
      if (!activeNpub) {
        const title =
          t.app_cefr_need_account_title ||
          (appLanguage === "es" ? "Cuenta requerida" : "Account required");
        const description =
          t.app_cefr_need_account ||
          (appLanguage === "es"
            ? "Conéctate para analizar tu nivel con la IA."
            : "Connect your account to analyze your level.");
        toast({ title, description, status: "info", duration: 2200 });
        return;
      }

      setCefrLoading(true);
      setCefrError("");

      try {
        const progress = user?.progress || {};
        const xp = Number(user?.xp || 0);
        const snapshot = {
          xp,
          xpLevel: Math.floor(xp / 100) + 1,
          streak: Number(user?.streak || 0),
          selectedDifficulty: progress.level || "beginner",
          targetLang: progress.targetLang || "es",
          supportLang: progress.supportLang || "en",
          showTranslations: progress.showTranslations !== false,
          dailyGoalXp: goal,
          dailyXp: earned,
          practicePronunciation: !!(
            progress.practicePronunciation ?? user?.practicePronunciation
          ),
          helpRequest: progress.helpRequest || user?.helpRequest || "",
          challenge: progress.challenge || null,
          updatedAt: user?.updatedAt || null,
        };

        const localeName = appLanguage === "es" ? "Spanish" : "English";
        const prompt = [
          "You are an expert language placement coach.",
          "Assign a CEFR level (A1, A2, B1, B2, C1, or C2) based on the learner metrics below.",
          "Use XP as a rough progress indicator (0-200≈A1, 200-500≈A2, 500-1000≈B1, 1000-1600≈B2, 1600-2200≈C1, >2200≈C2) and adjust using streaks, goals, and translation reliance.",
          'Respond ONLY with compact JSON: {"level":"B1","explanation":"..."}.',
          `Explanation must be <= 60 words, written in ${localeName}, and cite the strongest factors.`,
          "Learner data:",
          JSON.stringify(snapshot, null, 2),
        ].join("\n");

        let text = "";
        if (simplemodel) {
          try {
            const resp = await simplemodel.generateContent({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
            });
            text =
              (typeof resp?.response?.text === "function"
                ? resp.response.text()
                : resp?.response?.text) || "";
          } catch (err) {
            console.warn("CEFR simplemodel failed", err);
          }
        }

        if (!text) {
          text = await callResponses({
            model: DEFAULT_RESPONSES_MODEL,
            input: prompt,
          });
        }

        const parsed = parseCefrResponse(text);
        if (!parsed) throw new Error("parse");

        const explanation =
          parsed.explanation.length > 420
            ? `${parsed.explanation.slice(0, 417).trimEnd()}…`
            : parsed.explanation;

        const result = {
          level: parsed.level,
          explanation,
          updatedAt: Date.now(),
        };

        setCefrResult(result);

        const successTitle =
          t.app_cefr_success_title ||
          (appLanguage === "es" ? "Análisis completado" : "Analysis complete");
        const successDescTemplate =
          t.app_cefr_success_desc ||
          (appLanguage === "es"
            ? "Nivel asignado: {level}."
            : "Assigned level: {level}.");

        toast({
          title: successTitle,
          description: successDescTemplate.replace("{level}", result.level),
          status: "success",
          duration: 2600,
        });
      } catch (err) {
        console.error("CEFR analysis failed:", err);
        const errorTitle =
          t.app_cefr_error_title ||
          (appLanguage === "es" ? "No se pudo analizar" : "Analysis failed");
        const errorDesc =
          t.app_cefr_error ||
          (appLanguage === "es"
            ? "Vuelve a intentarlo más tarde."
            : "Please try again later.");
        setCefrError(errorDesc);
        toast({
          title: errorTitle,
          description: errorDesc,
          status: "error",
          duration: 2800,
        });
      } finally {
        setCefrLoading(false);
      }
    },
    [activeNpub, appLanguage, t, toast, user],
  );

  /* -----------------------------------
     RANDOMIZE tab mechanics (no routing)
  ----------------------------------- */
  const RANDOM_POOL = useMemo(
    // ⬅️ keep JobScript out of this list
    () => ["realtime", "stories", "grammar", "vocabulary", "history"],
    [],
  );
  const [randomPick, setRandomPick] = useState(null);
  const prevXpRef = useRef(null);
  const lastLocalXpEventRef = useRef(0);

  const handleIdentitySelection = useCallback(
    (npub) => {
      if (!npub || !activeNpub || user?.identity === npub) return;

      patchUser?.({ identity: npub });

      updateDoc(doc(database, "users", activeNpub), {
        identity: npub,
      }).catch((error) => {
        console.error("Failed to persist identity selection", error);
      });
    },
    [activeNpub, patchUser, user?.identity],
  );

  const handleDailyGoalClose = useCallback(() => {
    setDailyGoalOpen(false);
    if (shouldShowTimerAfterGoal) {
      setShouldShowTimerAfterGoal(false);
      setTimerModalOpen(true);
    }
  }, [shouldShowTimerAfterGoal]);

  const handleDailyGoalSave = useCallback(
    (goalValue) => {
      const parsedGoal = Math.max(
        1,
        Math.min(1000, Math.round(Number(goalValue) || 0)),
      );
      const now = new Date();
      const resetAt = getNextDailyGoalResetAt(now);
      const todayKey = getLocalDayKey(now);
      const nextDailyGoalHistory = todayKey
        ? {
            ...(dailyGoalXpHistory || {}),
            [todayKey]: 0,
          }
        : dailyGoalXpHistory || {};
      const nextPetHealth = getDailyGoalPetHealth({
        dailyGoalPetHealth,
      });

      setDailyGoalOpen(false);
      if (shouldShowTimerAfterGoal) {
        setShouldShowTimerAfterGoal(false);
        setTimerModalOpen(true);
      }

      const commitDailyGoal = () => {
        patchUser?.({
          dailyGoalXp: parsedGoal,
          dailyXp: 0,
          dailyResetAt: resetAt,
          dailyHasCelebrated: false,
          dailyGoalPetHealth: nextPetHealth,
          ...(todayKey
            ? {
                dailyXpHistory: nextDailyGoalHistory,
              }
            : {}),
        });

        if (!activeNpub) {
          toast({
            status: "error",
            title: appLanguage === "es" ? "Error al guardar" : "Save failed",
            description:
              appLanguage === "es"
                ? "No se encontró el usuario actual."
                : "Couldn't find the current user.",
          });
          return;
        }

        void setDoc(
          doc(database, "users", activeNpub),
          {
            dailyGoalXp: parsedGoal,
            dailyXp: 0,
            dailyResetAt: resetAt,
            dailyHasCelebrated: false,
            dailyGoalPetHealth: nextPetHealth,
            ...(todayKey
              ? {
                  dailyXpHistory: nextDailyGoalHistory,
                }
              : {}),
            updatedAt: now.toISOString(),
          },
          { merge: true },
        ).catch((error) => {
          console.error("Failed to save daily goal:", error);
          toast({
            status: "error",
            title: appLanguage === "es" ? "Error al guardar" : "Save failed",
            description: String(error?.message || error),
          });
        });
      };

      if (typeof window !== "undefined") {
        window.setTimeout(commitDailyGoal, 0);
      } else {
        commitDailyGoal();
      }
    },
    [
      activeNpub,
      appLanguage,
      dailyGoalPetHealth,
      dailyGoalXpHistory,
      patchUser,
      shouldShowTimerAfterGoal,
      toast,
    ],
  );

  const handleTimerModalClose = useCallback(() => {
    flushSync(() => {
      setTimerModalOpen(false);
      if (shouldShowProficiencyAfterTimer) {
        setShouldShowProficiencyAfterTimer(false);
        setProficiencyTestOpen(true);
      }
    });
  }, [shouldShowProficiencyAfterTimer]);

  const handleProficiencySkip = useCallback(async () => {
    flushSync(() => {
      setProficiencyTestOpen(false);
      if (shouldShowGettingStartedAfterProficiency) {
        setShouldShowGettingStartedAfterProficiency(false);
        setGettingStartedOpen(true);
      }
    });
    // Persist skip so the modal doesn't reappear every session.
    // "skipped" is a sentinel — treated as falsy by the placement check
    // but truthy enough to prevent the modal from re-opening.
    const id = resolveNpub();
    if (id) {
      try {
        await setDoc(
          doc(database, "users", id),
          {
            proficiencyPlacement: "skipped",
            proficiencyPlacements: { [resolvedTargetLang]: "skipped" },
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
        patchUser?.({
          proficiencyPlacement: "skipped",
          proficiencyPlacements: {
            ...(user?.proficiencyPlacements || {}),
            [resolvedTargetLang]: "skipped",
          },
        });
      } catch (e) {
        console.warn("Failed to persist proficiency skip:", e);
      }
    }
  }, [
    resolveNpub,
    patchUser,
    user?.proficiencyPlacements,
    resolvedTargetLang,
    shouldShowGettingStartedAfterProficiency,
  ]);

  const handleProficiencyTakeTest = useCallback(() => {
    setProficiencyTestOpen(false);
    navigate("/proficiency");
  }, [navigate]);

  // Getting started modal: mark as shown and persist to Firestore
  const markGettingStartedShown = useCallback(async () => {
    const id = resolveNpub();
    if (id) {
      try {
        await setDoc(
          doc(database, "users", id),
          {
            gettingStartedModalShown: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
        patchUser?.({ gettingStartedModalShown: true });
      } catch (e) {
        console.warn("Failed to persist getting started shown:", e);
      }
    }
  }, [resolveNpub, patchUser]);

  const handleGettingStartedSkip = useCallback(() => {
    flushSync(() => {
      setGettingStartedOpen(false);
    });
    window.setTimeout(() => {
      markGettingStartedShown();
    }, 0);
  }, [markGettingStartedShown]);

  const handleGettingStartedStart = useCallback(() => {
    flushSync(() => {
      setGettingStartedOpen(false);
    });
    window.setTimeout(() => {
      markGettingStartedShown();
    }, 0);

    // Find the tutorial lesson from the Pre-A1 learning path and launch it directly
    const units = getLearningPath(resolvedTargetLang, "Pre-A1");
    const tutorialUnit = units?.find((u) => u.isTutorial);
    const tutorialLesson = tutorialUnit?.lessons?.[0];
    if (tutorialLesson) {
      handleStartLesson(tutorialLesson);
    }
  }, [markGettingStartedShown, handleStartLesson, resolvedTargetLang]);

  const pickRandomFeature = useCallback(() => {
    const pool = RANDOM_POOL;
    if (!pool.length) return null;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    setRandomPick(choice);
    return choice;
  }, [RANDOM_POOL]);

  // When switching into Random tab, pick a feature
  useEffect(() => {
    if (currentTab === "random") {
      const first = pickRandomFeature();
      if (!first) setRandomPick("realtime");
    }
  }, [currentTab, pickRandomFeature]);

  const maybePostNostrProgress = useCallback(
    async ({ totalXp }) => {
      if (!allowPosts) return;
      const privateKey =
        activeNsec ||
        (typeof window !== "undefined"
          ? localStorage.getItem("local_nsec")
          : "");
      if (!privateKey) return;
      const goalTarget = Number(dailyGoalTarget || 0);
      const earnedToday = Number(dailyXpToday || 0);
      const hasDailyGoal = goalTarget > 0;
      const goalPercent = hasDailyGoal
        ? Math.min(100, Math.round((earnedToday / goalTarget) * 100))
        : null;
      const langCode = String(
        (user?.progress?.targetLang || user?.targetLang || "es").toLowerCase(),
      );
      const labelKey = `language_${langCode}`;
      const langLabel =
        t?.[labelKey] ||
        translations[appLanguage]?.[labelKey] ||
        translations.en?.[labelKey] ||
        TARGET_LANGUAGE_LABELS[langCode] ||
        langCode.toUpperCase();
      const goalCopy = hasDailyGoal
        ? `I'm ${goalPercent}% through today's ${goalTarget} XP goal (${earnedToday}/${goalTarget} XP)`
        : null;
      const content = hasDailyGoal
        ? `${goalCopy} and now have ${totalXp} XP total on https://nosabos.app practicing ${langLabel}! ${NOSTR_PROGRESS_HASHTAG}`
        : `I just reached ${totalXp} XP on https://nosabos.app practicing ${langLabel}! ${NOSTR_PROGRESS_HASHTAG}`;
      const hashtagTag = NOSTR_PROGRESS_HASHTAG.replace("#", "").toLowerCase();
      const tags = [
        ["t", hashtagTag],
        ["purpose", "nosaboProgress"],
        ["total_xp", String(totalXp)],
      ];
      if (hasDailyGoal) {
        tags.push(["daily_goal_percent", String(goalPercent)]);
        tags.push(["daily_xp", String(earnedToday)]);
        tags.push(["daily_goal_target", String(goalTarget)]);
      }
      try {
        await postNostrContent(
          content,
          undefined,
          activeNpub,
          privateKey,
          tags,
        );
      } catch (error) {
        console.error("Failed to share XP update on Nostr", error);
      }
    },
    [
      allowPosts,
      postNostrContent,
      activeNsec,
      user,
      t,
      appLanguage,
      activeNpub,
      dailyGoalTarget,
      dailyXpToday,
    ],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleLocalXpAward = () => {
      console.log("hasSpendableBalance", hasSpendableBalance);
      if (!hasSpendableBalance) return;
      const mark = Date.now();
      lastLocalXpEventRef.current = mark;
      const recipientNpub =
        typeof user?.identity === "string" && user.identity.trim()
          ? user.identity.trim()
          : undefined;
      Promise.resolve(sendOneSatToNpub(recipientNpub)).catch((error) => {
        console.error("Failed to send sat on local XP award", error);
        if (lastLocalXpEventRef.current === mark) {
          lastLocalXpEventRef.current = 0;
        }
      });
    };
    window.addEventListener("xp:awarded", handleLocalXpAward);
    return () => window.removeEventListener("xp:awarded", handleLocalXpAward);
  }, [hasSpendableBalance, sendOneSatToNpub, user?.identity]);

  useEffect(() => {
    if (!activeNpub) return;

    const lessonProgressRef = collection(
      database,
      "users",
      activeNpub,
      "languageLessons",
    );
    const flashcardProgressRef = collection(
      database,
      "users",
      activeNpub,
      "languageFlashcards",
    );

    const unsubLessons = onSnapshot(lessonProgressRef, (snapshot) => {
      const languageLessons = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data?.targetLang || !data?.lessonId) return;

        const lang = String(data.targetLang).toLowerCase();
        if (!languageLessons[lang]) languageLessons[lang] = {};

        languageLessons[lang][data.lessonId] = {
          ...(languageLessons[lang][data.lessonId] || {}),
          ...data,
        };
      });

      const latestUser = useUserStore.getState()?.user || {};
      const currentProgress = latestUser?.progress || {};

      patchUser?.({
        progress: {
          ...currentProgress,
          languageLessons,
        },
      });
    });

    const unsubFlashcards = onSnapshot(flashcardProgressRef, (snapshot) => {
      const languageFlashcards = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data?.targetLang || !data?.cardId) return;

        const lang = String(data.targetLang).toLowerCase();
        if (!languageFlashcards[lang]) languageFlashcards[lang] = {};

        languageFlashcards[lang][data.cardId] = {
          ...(languageFlashcards[lang][data.cardId] || {}),
          ...data,
        };
      });

      const latestUser = useUserStore.getState()?.user || {};
      const currentProgress = latestUser?.progress || {};

      patchUser?.({
        progress: {
          ...currentProgress,
          languageFlashcards,
        },
      });
    });

    return () => {
      unsubLessons();
      unsubFlashcards();
    };
  }, [activeNpub, patchUser]);

  // ✅ Listen to XP changes; random tab adds toast + auto-pick next
  useEffect(() => {
    if (!activeNpub) return;
    const ref = doc(database, "users", activeNpub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const newXp = Number(data?.xp || 0);
      const lessonLang = activeLessonLanguageRef.current || resolvedTargetLang;
      const latestUser = useUserStore.getState()?.user || {};
      const existingProgress = latestUser?.progress || user?.progress || {};
      const rawProgress = data?.progress || { totalXp: newXp };

      // The user document's progress field may contain stale languageLessons/
      // languageFlashcards data written by saveGlobalSettings. The subcollection
      // listeners and loadUserObjectFromDB are the only sources of truth for
      // these maps, so strip them from rawProgress before merging.
      const {
        languageLessons: _rawLL,
        languageFlashcards: _rawLF,
        ...rawProgressWithoutSubcollections
      } = rawProgress;

      const progressPayload = {
        ...existingProgress,
        ...rawProgressWithoutSubcollections,
        languageLessons: existingProgress?.languageLessons ?? {},
        languageFlashcards: existingProgress?.languageFlashcards ?? {},
      };
      const newLessonLanguageXp = getLanguageXp(progressPayload, lessonLang);

      // Keep global user store in sync with Firestore changes.
      // IMPORTANT: root user snapshots do not include subcollection-backed lesson/
      // flashcard progress, so avoid blindly overwriting `progress` before hydration.
      const patch = {
        xp: newXp,
      };

      const hasHydratedProgressMaps =
        Object.keys(existingProgress?.languageLessons || {}).length > 0 ||
        Object.keys(existingProgress?.languageFlashcards || {}).length > 0;

      if (hasHydratedProgressMaps) {
        patch.progress = progressPayload;
      }

      if (typeof data?.streak === "number") patch.streak = data.streak;
      if (typeof data?.dailyXp === "number") patch.dailyXp = data.dailyXp;
      if (typeof data?.dailyGoalXp === "number")
        patch.dailyGoalXp = data.dailyGoalXp;
      if (typeof data?.dailyGoalPetHealth === "number")
        patch.dailyGoalPetHealth = data.dailyGoalPetHealth;
      if (typeof data?.dailyGoalPetLastDelta === "number")
        patch.dailyGoalPetLastDelta = data.dailyGoalPetLastDelta;
      if (typeof data?.dailyGoalPetLastOutcome === "string")
        patch.dailyGoalPetLastOutcome = data.dailyGoalPetLastOutcome;
      if (data?.dailyGoalPetLastUpdatedAt)
        patch.dailyGoalPetLastUpdatedAt = data.dailyGoalPetLastUpdatedAt;
      if (Array.isArray(data?.completedGoalDates))
        patch.completedGoalDates = data.completedGoalDates;
      if (data?.dailyXpHistory && typeof data.dailyXpHistory === "object")
        patch.dailyXpHistory = data.dailyXpHistory;
      if (data?.stats) patch.stats = data.stats;
      if (data?.updatedAt) patch.updatedAt = data.updatedAt;
      if (data?.appLanguage) patch.appLanguage = data.appLanguage;

      const patchHasChanges = Object.entries(patch).some(([key, value]) => {
        const current = latestUser?.[key];
        if (value && typeof value === "object") {
          try {
            return JSON.stringify(current) !== JSON.stringify(value);
          } catch {
            return true;
          }
        }
        return current !== value;
      });

      if (patchHasChanges) {
        patchUser?.(patch);
      }

      if (prevXpRef.current == null) {
        prevXpRef.current = newXp;
        return;
      }

      const diff = newXp - prevXpRef.current;
      prevXpRef.current = newXp;

      if (diff > 0) {
        const recentlySent =
          Date.now() - lastLocalXpEventRef.current <= 1500 &&
          lastLocalXpEventRef.current !== 0;

        if (hasSpendableBalance && !recentlySent) {
          const mark = Date.now();
          lastLocalXpEventRef.current = mark;
          const recipientNpub =
            typeof latestUser?.identity === "string" &&
            latestUser.identity.trim()
              ? latestUser.identity.trim()
              : undefined;
          Promise.resolve(sendOneSatToNpub(recipientNpub)).catch((error) => {
            console.error("Failed to send sat on XP update", error);
            if (lastLocalXpEventRef.current === mark) {
              lastLocalXpEventRef.current = 0;
            }
          });
        }

        if (currentTab === "random") {
          const title =
            t?.random_toast_title ??
            (appLanguage === "es" ? "¡Buen trabajo!" : "Nice job!");
          const descTpl =
            t?.random_toast_desc ??
            (appLanguage === "es"
              ? "Ganaste +{xp} XP."
              : "You earned +{xp} XP.");
          const description = descTpl.replace("{xp}", String(diff));

          toast({
            title,
            description,
            status: "success",
            duration: 1800,
            isClosable: true,
            position: "top",
          });
          // Immediately pick the next randomized activity
          pickRandomFeature();
        }

        // Check for lesson completion
        if (viewMode === "lesson" && activeLesson && lessonStartXp !== null) {
          const totalXpEarned = newLessonLanguageXp - lessonStartXp;

          console.log("[Lesson XP Check]", {
            newXp,
            lessonLang,
            newLessonLanguageXp,
            lessonStartXp,
            totalXpEarned,
            lessonGoal: activeLesson.xpReward,
            shouldComplete: totalXpEarned >= activeLesson.xpReward,
          });

          // Check if lesson goal reached
          if (
            totalXpEarned >= activeLesson.xpReward &&
            !lessonCompletionTriggeredRef.current
          ) {
            console.log(
              "[Lesson Completion] XP goal reached! Completing lesson...",
            );
            triggerLessonCompletion("xp_goal");
          }
        }

        maybePostNostrProgress({ totalXp: newXp });
      }
    });
    return () => unsub();
  }, [
    activeNpub,
    currentTab,
    t,
    toast,
    appLanguage,
    hasSpendableBalance,
    sendOneSatToNpub,
    pickRandomFeature,
    patchUser,
    maybePostNostrProgress,
    viewMode,
    activeLesson,
    lessonStartXp,
    resolvedTargetLang,
    triggerLessonCompletion,
  ]);

  const RandomHeader = (
    <Box
      position="sticky"
      top={{ base: "70px", md: "78px" }}
      right="0"
      width="100%"
      zIndex={10}
    >
      <HStack justify="flex-end">
        <Button
          size="sm"
          leftIcon={<LuShuffle />}
          variant="outline"
          borderColor="gray.700"
          onClick={pickRandomFeature}
        >
          {t?.random_shuffle ?? "Shuffle"}
        </Button>
      </HStack>
    </Box>
  );

  const renderRandomPanel = () => {
    switch (randomPick) {
      case "realtime":
        return (
          <>
            {RandomHeader}
            <RealTimeTest
              auth={auth}
              activeNpub={activeNpub}
              activeNsec={activeNsec}
              level={user?.progress?.level}
              supportLang={user?.progress?.supportLang}
              voice={user?.progress?.voice}
              voicePersona={user?.progress?.voicePersona}
              targetLang={user?.progress?.targetLang}
              showTranslations={user?.progress?.showTranslations}
              pauseMs={user?.progress?.pauseMs}
              helpRequest={user?.progress?.helpRequest}
              practicePronunciation={user?.progress?.practicePronunciation}
              onSwitchedAccount={async (id, sec) => {
                if (id) localStorage.setItem("local_npub", id);
                if (typeof sec === "string")
                  localStorage.setItem("local_nsec", sec);
                await connectDID();
                setActiveNpub(localStorage.getItem("local_npub") || "");
                setActiveNsec(localStorage.getItem("local_nsec") || "");
              }}
            />
          </>
        );
      case "stories":
        return (
          <>
            {RandomHeader}
            <StoryMode
              userLanguage={appLanguage}
              activeNpub={activeNpub}
              activeNsec={activeNsec}
              pauseMs={user?.progress?.pauseMs}
            />
          </>
        );
      case "reading":
        return (
          <>
            {RandomHeader}
            <History userLanguage={appLanguage} />
          </>
        );
      case "grammar":
        return (
          <>
            {RandomHeader}
            <GrammarBook
              userLanguage={appLanguage}
              activeNpub={activeNpub}
              activeNsec={activeNsec}
              onSendHelpRequest={handleSendToHelpChat}
            />
          </>
        );
      case "vocabulary":
      default:
        return (
          <>
            {RandomHeader}
            <Vocabulary
              userLanguage={appLanguage}
              activeNpub={activeNpub}
              activeNsec={activeNsec}
              onExitQuiz={handleReturnToSkillTree}
              onSendHelpRequest={handleSendToHelpChat}
            />
          </>
        );
    }
  };

  /* -----------------------------------
     Top bar with Settings / Account / Install
  ----------------------------------- */
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Compute userProgress - must be before any conditional returns to maintain hook order
  const userProgress = useMemo(() => {
    const progressLanguageKey = String(
      resolvedTargetLang || "es",
    ).toLowerCase();
    const languageXpMap = user?.progress?.languageXp || {};
    const languageLessons = user?.progress?.languageLessons;
    const hasLanguageLessons =
      languageLessons && typeof languageLessons === "object";
    const lessonsForLanguage = hasLanguageLessons
      ? languageLessons?.[progressLanguageKey] ||
        languageLessons?.[resolvedTargetLang] ||
        {}
      : user?.progress?.lessons || {};

    // Get language-specific flashcards
    const languageFlashcards = user?.progress?.languageFlashcards;
    const hasLanguageFlashcards =
      languageFlashcards && typeof languageFlashcards === "object";
    const flashcardsForLanguage = hasLanguageFlashcards
      ? languageFlashcards?.[progressLanguageKey] ||
        languageFlashcards?.[resolvedTargetLang] ||
        {}
      : user?.progress?.flashcards || {};
    const flashcardDailyActivity = user?.progress?.flashcardDailyActivity;
    const hasFlashcardDailyActivity =
      flashcardDailyActivity && typeof flashcardDailyActivity === "object";
    const flashcardActivityForLanguage = hasFlashcardDailyActivity
      ? flashcardDailyActivity?.[progressLanguageKey] ||
        flashcardDailyActivity?.[resolvedTargetLang] ||
        {}
      : {};

    const skillTreeXp = getLanguageXp(user?.progress || {}, resolvedTargetLang);
    return {
      totalXp: skillTreeXp,
      lessons: lessonsForLanguage,
      languageXp: languageXpMap,
      languageLessons: hasLanguageLessons ? languageLessons : undefined,
      targetLang: resolvedTargetLang,
      flashcards: flashcardsForLanguage,
      flashcardActivity: flashcardActivityForLanguage,
    };
  }, [user?.progress, resolvedTargetLang]);

  // CEFR level configuration (shared across modes)
  const CEFR_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];
  const CEFR_LEVEL_COUNTS = {
    "Pre-A1": { flashcards: 100, lessons: 33 }, // 1 tutorial (1) + 8 units (4 each) = 1 + 32
    A1: { flashcards: 300, lessons: 110 }, // 1 pre-unit (7) + 17 units (6 each) = 7 + 102
    A2: { flashcards: 250, lessons: 108 }, // 18 units × 6 lessons per unit
    B1: { flashcards: 200, lessons: 90 }, // 15 units × 6 lessons per unit
    B2: { flashcards: 150, lessons: 72 }, // 12 units × 6 lessons per unit
    C1: { flashcards: 100, lessons: 60 }, // 10 units × 6 lessons per unit
    C2: { flashcards: 50, lessons: 48 }, // 8 units × 6 lessons per unit
  };

  const CEFR_LEVEL_INFO = {
    "Pre-A1": {
      name: { en: "Ultimate Beginner", es: "Principiante Total" },
      color: "#8B5CF6",
      gradient: "linear(135deg, #A78BFA, #8B5CF6)",
      description: {
        en: "First words and recognition",
        es: "Primeras palabras y reconocimiento",
      },
    },
    A1: {
      name: { en: "Beginner", es: "Principiante" },
      color: "#3B82F6",
      gradient: "linear(135deg, #60A5FA, #3B82F6)",
      description: {
        en: "Basic survival language",
        es: "Lenguaje básico de supervivencia",
      },
    },
    A2: {
      name: { en: "Elementary", es: "Elemental" },
      color: "#8B5CF6",
      gradient: "linear(135deg, #A78BFA, #8B5CF6)",
      description: {
        en: "Simple everyday communication",
        es: "Comunicación cotidiana simple",
      },
    },
    B1: {
      name: { en: "Intermediate", es: "Intermedio" },
      color: "#A855F7",
      gradient: "linear(135deg, #C084FC, #A855F7)",
      description: {
        en: "Handle everyday situations",
        es: "Manejo de situaciones cotidianas",
      },
    },
    B2: {
      name: { en: "Upper Intermediate", es: "Intermedio Alto" },
      color: "#F97316",
      gradient: "linear(135deg, #FB923C, #F97316)",
      description: { en: "Complex discussions", es: "Discusiones complejas" },
    },
    C1: {
      name: { en: "Advanced", es: "Avanzado" },
      color: "#EF4444",
      gradient: "linear(135deg, #F87171, #EF4444)",
      description: {
        en: "Sophisticated language use",
        es: "Uso sofisticado del idioma",
      },
    },
    C2: {
      name: { en: "Mastery", es: "Maestría" },
      color: "#EC4899",
      gradient: "linear(135deg, #F472B6, #EC4899)",
      description: {
        en: "Near-native proficiency",
        es: "Competencia casi nativa",
      },
    },
  };

  const getLessonLevelFromId = (lessonId = "") => {
    // Pre-A1 lessons: "lesson-pre-a1-..." or tutorial "lesson-tutorial-..."
    if (
      lessonId.includes("lesson-pre-a1") ||
      lessonId.includes("lesson-tutorial")
    ) {
      return "Pre-A1";
    }

    const match = lessonId.match(/lesson-([a-z]\d+)/i);
    if (match) return match[1].toUpperCase();

    return null;
  };

  // Calculate lesson mode completion status (independent from flashcards)
  const lessonLevelCompletionStatus = useMemo(() => {
    if (isTestUnlockActive) {
      const unlockedStatus = {};

      CEFR_LEVELS.forEach((level) => {
        const totalLessons = CEFR_LEVEL_COUNTS[level]?.lessons || 0;

        unlockedStatus[level] = {
          completedLessons: totalLessons,
          totalLessons,
          isComplete: true,
          lessonsProgress: 100,
        };
      });

      return unlockedStatus;
    }

    const status = {};
    const lessons = userProgress.lessons || {};

    CEFR_LEVELS.forEach((level) => {
      // Count completed lessons for this level (including pre-level lessons)
      const completedLessons = Object.keys(lessons).filter((lessonId) => {
        const cefrLevel = getLessonLevelFromId(lessonId);
        return cefrLevel === level && lessons[lessonId]?.status === "completed";
      }).length;

      const totalLessons = CEFR_LEVEL_COUNTS[level]?.lessons || 0;

      // Level is complete if all lessons are done (ignore flashcards)
      const isComplete = completedLessons >= totalLessons;

      status[level] = {
        completedLessons,
        totalLessons,
        isComplete,
        lessonsProgress:
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
      };
    });

    return status;
  }, [isTestUnlockActive, userProgress.lessons]);

  // Calculate flashcard mode completion status (independent from lessons)
  const flashcardLevelCompletionStatus = useMemo(() => {
    if (isTestUnlockActive) {
      const unlockedStatus = {};

      CEFR_LEVELS.forEach((level) => {
        const totalFlashcards = CEFR_LEVEL_COUNTS[level]?.flashcards || 0;

        unlockedStatus[level] = {
          completedFlashcards: totalFlashcards,
          totalFlashcards,
          isComplete: true,
          flashcardsProgress: 100,
        };
      });

      return unlockedStatus;
    }

    const status = {};
    const flashcards = userProgress.flashcards || {};

    CEFR_LEVELS.forEach((level) => {
      // Count completed flashcards for this level
      const completedFlashcards = Object.keys(flashcards).filter((cardId) => {
        return (
          cardId.startsWith(level.toLowerCase() + "-") &&
          flashcards[cardId]?.completed
        );
      }).length;

      const totalFlashcards = CEFR_LEVEL_COUNTS[level]?.flashcards || 0;

      // Level is complete if all flashcards are done (ignore lessons)
      const isComplete = completedFlashcards >= totalFlashcards;

      status[level] = {
        completedFlashcards,
        totalFlashcards,
        isComplete,
        flashcardsProgress:
          totalFlashcards > 0
            ? (completedFlashcards / totalFlashcards) * 100
            : 0,
      };
    });

    return status;
  }, [isTestUnlockActive, userProgress.flashcards]);

  // Legacy: Combined completion status (for backwards compatibility)
  const levelCompletionStatus = useMemo(() => {
    const status = {};

    CEFR_LEVELS.forEach((level) => {
      const lessonStatus = lessonLevelCompletionStatus[level];
      const flashcardStatus = flashcardLevelCompletionStatus[level];

      status[level] = {
        completedLessons: lessonStatus.completedLessons,
        totalLessons: lessonStatus.totalLessons,
        completedFlashcards: flashcardStatus.completedFlashcards,
        totalFlashcards: flashcardStatus.totalFlashcards,
        isComplete: lessonStatus.isComplete && flashcardStatus.isComplete,
        lessonsProgress: lessonStatus.lessonsProgress,
        flashcardsProgress: flashcardStatus.flashcardsProgress,
      };
    });

    return status;
  }, [lessonLevelCompletionStatus, flashcardLevelCompletionStatus]);

  // Determine current unlocked lesson level (highest level user can access in lesson mode)
  const currentLessonLevel = useMemo(() => {
    // Find the highest level that's unlocked for lessons
    // A level is unlocked if the previous level is complete OR user has proficiency placement
    let unlockedLevel = "Pre-A1"; // Pre-A1 is always unlocked

    // Only use per-language proficiency placement (no global fallback)
    const placement = user?.proficiencyPlacements?.[resolvedTargetLang] || null;
    const placementIndex = placement ? CEFR_LEVELS.indexOf(placement) : -1;

    for (let i = 0; i < CEFR_LEVELS.length - 1; i++) {
      const currentLevel = CEFR_LEVELS[i];
      const nextLevel = CEFR_LEVELS[i + 1];

      if (
        lessonLevelCompletionStatus[currentLevel]?.isComplete ||
        i < placementIndex
      ) {
        unlockedLevel = nextLevel;
      } else {
        break; // Stop at first incomplete level
      }
    }

    return unlockedLevel;
  }, [
    lessonLevelCompletionStatus,
    user?.proficiencyPlacements,
    resolvedTargetLang,
  ]);

  // Determine current unlocked flashcard level (highest level user can access in flashcard mode)
  const currentFlashcardLevel = useMemo(() => {
    // Find the highest level that's unlocked for flashcards
    // A level is unlocked if the previous level is complete OR user has proficiency placement
    let unlockedLevel = "Pre-A1"; // Pre-A1 is always unlocked

    const placement = user?.proficiencyPlacements?.[resolvedTargetLang] || null;
    const placementIndex = placement ? CEFR_LEVELS.indexOf(placement) : -1;

    for (let i = 0; i < CEFR_LEVELS.length - 1; i++) {
      const currentLevel = CEFR_LEVELS[i];
      const nextLevel = CEFR_LEVELS[i + 1];

      if (
        flashcardLevelCompletionStatus[currentLevel]?.isComplete ||
        i < placementIndex
      ) {
        unlockedLevel = nextLevel;
      } else {
        break; // Stop at first incomplete level
      }
    }

    return unlockedLevel;
  }, [
    flashcardLevelCompletionStatus,
    user?.proficiencyPlacements,
    resolvedTargetLang,
  ]);

  // Legacy: Combined current level (for backwards compatibility)
  const currentCEFRLevel = useMemo(() => {
    // Find the highest level that's unlocked in both modes
    // A level is unlocked if the previous level is complete in BOTH modes OR user has proficiency placement
    let unlockedLevel = "Pre-A1"; // Pre-A1 is always unlocked

    const placement = user?.proficiencyPlacements?.[resolvedTargetLang] || null;
    const placementIndex = placement ? CEFR_LEVELS.indexOf(placement) : -1;

    for (let i = 0; i < CEFR_LEVELS.length - 1; i++) {
      const currentLevel = CEFR_LEVELS[i];
      const nextLevel = CEFR_LEVELS[i + 1];

      if (
        levelCompletionStatus[currentLevel]?.isComplete ||
        i < placementIndex
      ) {
        unlockedLevel = nextLevel;
      } else {
        break; // Stop at first incomplete level
      }
    }

    return unlockedLevel;
  }, [levelCompletionStatus, user?.proficiencyPlacements, resolvedTargetLang]);

  // Real-world tasks state derived from user document
  const realWorldTasks = user?.realWorldTasks || null;

  // Ready = user should be prompted to generate/see a new batch
  const realWorldTasksReady = useMemo(() => {
    if (!realWorldTasks) return true;
    if (!Array.isArray(realWorldTasks.tasks) || realWorldTasks.tasks.length !== 3) {
      return true;
    }
    if (
      realWorldTasks.targetLang &&
      realWorldTasks.targetLang !== resolvedTargetLang
    ) {
      return true;
    }
    const generatedAt = realWorldTasks.generatedAt
      ? new Date(realWorldTasks.generatedAt).getTime()
      : 0;
    if (!generatedAt) return true;
    return tasksTickNow - generatedAt >= REAL_WORLD_TASKS_REFRESH_MS;
  }, [realWorldTasks, resolvedTargetLang, tasksTickNow]);

  // When did the current "ready" state start? Used to decide if the user
  // has already seen this ready notification.
  const realWorldTasksReadySince = useMemo(() => {
    if (!realWorldTasks) return 0;
    const generatedAt = realWorldTasks.generatedAt
      ? new Date(realWorldTasks.generatedAt).getTime()
      : 0;
    if (!generatedAt) return 0;
    if (!Array.isArray(realWorldTasks.tasks) || realWorldTasks.tasks.length !== 3) {
      return 0;
    }
    if (
      realWorldTasks.targetLang &&
      realWorldTasks.targetLang !== resolvedTargetLang
    ) {
      return 0;
    }
    return generatedAt + REAL_WORLD_TASKS_REFRESH_MS;
  }, [realWorldTasks, resolvedTargetLang]);

  const realWorldTasksLastOpenedAt = user?.realWorldTasksLastOpenedAt
    ? new Date(user.realWorldTasksLastOpenedAt).getTime()
    : 0;

  // Show the notification badge when the tasks are ready and the user
  // hasn't opened the modal since the ready state began.
  const realWorldTasksHasNotification =
    realWorldTasksReady && realWorldTasksLastOpenedAt < Math.max(1, realWorldTasksReadySince || tasksTickNow);

  // True only when the current batch exists, hasn't been claimed,
  // and has zero completed tasks — i.e. it is genuinely untouched.
  const realWorldTasksBatchUntouched = Boolean(
    realWorldTasks &&
      !realWorldTasks.rewarded &&
      Array.isArray(realWorldTasks.completed) &&
      realWorldTasks.completed.length === 3 &&
      !realWorldTasks.completed.some(Boolean),
  );

  // 0-100% representing remaining time until the next batch. Full = lots
  // of time left, 0 = ready for a new batch. Used to render a drain ring
  // around the immersion action-bar button so users see the countdown
  // without opening the drawer.
  const realWorldTasksTimerProgress = useMemo(() => {
    if (!realWorldTasks) return 0;
    const generatedAt = realWorldTasks.generatedAt
      ? new Date(realWorldTasks.generatedAt).getTime()
      : 0;
    if (!generatedAt) return 0;
    if (
      !Array.isArray(realWorldTasks.tasks) ||
      realWorldTasks.tasks.length !== 3
    ) {
      return 0;
    }
    if (
      realWorldTasks.targetLang &&
      realWorldTasks.targetLang !== resolvedTargetLang
    ) {
      return 0;
    }
    const remainingMs = Math.max(
      0,
      REAL_WORLD_TASKS_REFRESH_MS - (tasksTickNow - generatedAt),
    );
    return Math.max(
      0,
      Math.min(100, (remainingMs / REAL_WORLD_TASKS_REFRESH_MS) * 100),
    );
  }, [realWorldTasks, resolvedTargetLang, tasksTickNow]);

  const [realWorldTasksAttention, setRealWorldTasksAttention] = useState(false);
  const prevAnimTriggerRef = useRef(false);

  // Fire a brief one-time animation whenever the current batch is
  // untouched (no completed tasks, not claimed). This re-fires on each
  // page load / mount so the user sees a visual signal every time they
  // return and still have pending tasks. It also re-fires when a new
  // untouched batch replaces a touched/claimed one.
  useEffect(() => {
    if (realWorldTasksBatchUntouched && !prevAnimTriggerRef.current) {
      setRealWorldTasksAttention(true);
      const id = setTimeout(() => setRealWorldTasksAttention(false), 1800);
      prevAnimTriggerRef.current = true;
      return () => clearTimeout(id);
    }
    if (!realWorldTasksBatchUntouched) {
      prevAnimTriggerRef.current = false;
    }
  }, [realWorldTasksBatchUntouched]);

  const handleRealWorldTasksUpdated = useCallback(
    (next) => {
      patchUser({ realWorldTasks: next });
    },
    [patchUser],
  );

  const handleOpenRealWorldTasks = useCallback(() => {
    setRealWorldTasksOpen(true);
    setRealWorldTasksAttention(false);
    const openedAt = new Date().toISOString();
    patchUser({ realWorldTasksLastOpenedAt: openedAt });
    if (activeNpub) {
      setDoc(
        doc(database, "users", activeNpub),
        {
          realWorldTasksLastOpenedAt: openedAt,
          updatedAt: openedAt,
        },
        { merge: true },
      ).catch((err) =>
        console.warn("Failed to persist realWorldTasksLastOpenedAt:", err),
      );
    }
  }, [activeNpub, patchUser]);

  // State for which CEFR level is currently being viewed (separate for each mode)
  // Initialize with default, will be synced from user document when loaded
  const [activeLessonLevel, setActiveLessonLevel] = useState("Pre-A1");
  const [activeFlashcardLevel, setActiveFlashcardLevel] = useState("Pre-A1");
  const normalizedTargetLang = String(resolvedTargetLang || "").toLowerCase();
  const levelsPersistenceKey = `${activeNpub || "local"}:${normalizedTargetLang}`;
  const [initializedLevelsKey, setInitializedLevelsKey] = useState(null);
  const hasHydratedUserProgress =
    user?.progress && typeof user.progress === "object";

  // Sync active levels from user document when it loads
  useEffect(() => {
    if (isLoadingApp) return;
    if (!user) return;
    if (!hasHydratedUserProgress) return;
    if (!normalizedTargetLang) return;
    if (initializedLevelsKey === levelsPersistenceKey) return;

    const savedLessonLevel =
      (CEFR_LEVELS.includes(
        user?.progress?.activeLessonLevels?.[normalizedTargetLang],
      ) &&
        user.progress.activeLessonLevels[normalizedTargetLang]) ||
      (CEFR_LEVELS.includes(user?.activeLessonLevels?.[normalizedTargetLang]) &&
        user.activeLessonLevels[normalizedTargetLang]) ||
      (CEFR_LEVELS.includes(user?.activeLessonLevel) &&
        user.activeLessonLevel) ||
      currentLessonLevel;

    const savedFlashcardLevel =
      (CEFR_LEVELS.includes(
        user?.progress?.activeFlashcardLevels?.[normalizedTargetLang],
      ) &&
        user.progress.activeFlashcardLevels[normalizedTargetLang]) ||
      (CEFR_LEVELS.includes(
        user?.activeFlashcardLevels?.[normalizedTargetLang],
      ) &&
        user.activeFlashcardLevels[normalizedTargetLang]) ||
      (CEFR_LEVELS.includes(user?.activeFlashcardLevel) &&
        user.activeFlashcardLevel) ||
      currentFlashcardLevel;

    setActiveLessonLevel(savedLessonLevel);
    setActiveFlashcardLevel(savedFlashcardLevel);
    setInitializedLevelsKey(levelsPersistenceKey);
  }, [
    isLoadingApp,
    user,
    hasHydratedUserProgress,
    activeNpub,
    initializedLevelsKey,
    levelsPersistenceKey,
    normalizedTargetLang,
    currentLessonLevel,
    currentFlashcardLevel,
  ]);

  // Legacy: Combined active level (for backwards compatibility)
  const [activeCEFRLevel, setActiveCEFRLevel] = useState(currentCEFRLevel);

  // Persist active lesson level to Firestore
  const prevLessonLevelRef = useRef(null);
  useEffect(() => {
    if (!normalizedTargetLang) return;
    if (initializedLevelsKey !== levelsPersistenceKey || !activeNpub) return;
    if (prevLessonLevelRef.current === activeLessonLevel) return;
    prevLessonLevelRef.current = activeLessonLevel;

    const latestUser = useUserStore.getState()?.user || {};
    const latestProgress = latestUser?.progress || {};
    patchUser?.({
      activeLessonLevel,
      progress: {
        ...latestProgress,
        activeLessonLevels: {
          ...(latestProgress?.activeLessonLevels || {}),
          [normalizedTargetLang]: activeLessonLevel,
        },
      },
    });

    updateDoc(doc(database, "users", activeNpub), {
      activeLessonLevel,
      [`progress.activeLessonLevels.${normalizedTargetLang}`]:
        activeLessonLevel,
      updatedAt: new Date().toISOString(),
    }).catch((e) => console.error("Failed to save activeLessonLevel:", e));
  }, [
    activeLessonLevel,
    activeNpub,
    initializedLevelsKey,
    levelsPersistenceKey,
    normalizedTargetLang,
    patchUser,
  ]);

  // Persist active flashcard level to Firestore
  const prevFlashcardLevelRef = useRef(null);
  useEffect(() => {
    if (!normalizedTargetLang) return;
    if (initializedLevelsKey !== levelsPersistenceKey || !activeNpub) return;
    if (prevFlashcardLevelRef.current === activeFlashcardLevel) return;
    prevFlashcardLevelRef.current = activeFlashcardLevel;

    const latestUser = useUserStore.getState()?.user || {};
    const latestProgress = latestUser?.progress || {};
    patchUser?.({
      activeFlashcardLevel,
      progress: {
        ...latestProgress,
        activeFlashcardLevels: {
          ...(latestProgress?.activeFlashcardLevels || {}),
          [normalizedTargetLang]: activeFlashcardLevel,
        },
      },
    });

    updateDoc(doc(database, "users", activeNpub), {
      activeFlashcardLevel,
      [`progress.activeFlashcardLevels.${normalizedTargetLang}`]:
        activeFlashcardLevel,
      updatedAt: new Date().toISOString(),
    }).catch((e) => console.error("Failed to save activeFlashcardLevel:", e));
  }, [
    activeFlashcardLevel,
    activeNpub,
    initializedLevelsKey,
    levelsPersistenceKey,
    normalizedTargetLang,
    patchUser,
  ]);

  // Track previous completion status to detect newly completed levels
  const prevLessonCompletionRef = useRef({});
  const prevFlashcardCompletionRef = useRef({});
  const lessonCompletionSeedKeyRef = useRef(null);
  const flashcardCompletionSeedKeyRef = useRef(null);

  // Detect lesson level completion and show celebration modal
  useEffect(() => {
    const completionSnapshot = CEFR_LEVELS.reduce((acc, level) => {
      acc[level] = lessonLevelCompletionStatus[level]?.isComplete || false;
      return acc;
    }, {});

    if (initializedLevelsKey !== levelsPersistenceKey) {
      prevLessonCompletionRef.current = completionSnapshot;
      return;
    }

    if (
      isTestUnlockActive ||
      lessonCompletionSeedKeyRef.current !== levelsPersistenceKey
    ) {
      lessonCompletionSeedKeyRef.current = levelsPersistenceKey;
      prevLessonCompletionRef.current = completionSnapshot;
      return;
    }

    CEFR_LEVELS.forEach((level) => {
      const wasComplete = prevLessonCompletionRef.current[level];
      const isNowComplete = lessonLevelCompletionStatus[level]?.isComplete;
      const alreadyCelebrated = wasCelebrationShown(level, "lesson");

      // Check if level was just completed (transition from false/undefined to true)
      // and hasn't been celebrated before
      if (
        !wasComplete &&
        isNowComplete &&
        level === activeLessonLevel &&
        !alreadyCelebrated
      ) {
        // Find the next level for the modal
        const levelIndex = CEFR_LEVELS.indexOf(level);
        const nextLevel =
          levelIndex < CEFR_LEVELS.length - 1
            ? CEFR_LEVELS[levelIndex + 1]
            : null;

        setCompletedProficiencyData({
          level,
          nextLevel,
          mode: "lesson",
        });
        setShowProficiencyCompletionModal(true);
      }
    });

    // Update ref for next comparison
    prevLessonCompletionRef.current = completionSnapshot;
  }, [
    lessonLevelCompletionStatus,
    activeLessonLevel,
    wasCelebrationShown,
    initializedLevelsKey,
    levelsPersistenceKey,
    isTestUnlockActive,
  ]);

  // Detect flashcard level completion and show celebration modal
  useEffect(() => {
    const completionSnapshot = CEFR_LEVELS.reduce((acc, level) => {
      acc[level] = flashcardLevelCompletionStatus[level]?.isComplete || false;
      return acc;
    }, {});

    if (initializedLevelsKey !== levelsPersistenceKey) {
      prevFlashcardCompletionRef.current = completionSnapshot;
      return;
    }

    if (
      isTestUnlockActive ||
      flashcardCompletionSeedKeyRef.current !== levelsPersistenceKey
    ) {
      flashcardCompletionSeedKeyRef.current = levelsPersistenceKey;
      prevFlashcardCompletionRef.current = completionSnapshot;
      return;
    }

    CEFR_LEVELS.forEach((level) => {
      const wasComplete = prevFlashcardCompletionRef.current[level];
      const isNowComplete = flashcardLevelCompletionStatus[level]?.isComplete;
      const alreadyCelebrated = wasCelebrationShown(level, "flashcard");

      // Check if level was just completed (transition from false/undefined to true)
      // and hasn't been celebrated before
      if (
        !wasComplete &&
        isNowComplete &&
        level === activeFlashcardLevel &&
        !alreadyCelebrated
      ) {
        // Find the next level for the modal
        const levelIndex = CEFR_LEVELS.indexOf(level);
        const nextLevel =
          levelIndex < CEFR_LEVELS.length - 1
            ? CEFR_LEVELS[levelIndex + 1]
            : null;

        setCompletedProficiencyData({
          level,
          nextLevel,
          mode: "flashcard",
        });
        setShowProficiencyCompletionModal(true);
      }
    });

    // Update ref for next comparison
    prevFlashcardCompletionRef.current = completionSnapshot;
  }, [
    flashcardLevelCompletionStatus,
    activeFlashcardLevel,
    wasCelebrationShown,
    initializedLevelsKey,
    levelsPersistenceKey,
    isTestUnlockActive,
  ]);

  // Note: We deliberately do NOT auto-update active levels when new levels unlock
  // Users should stay at their current level until they manually navigate

  // Handler for lesson level navigation
  // Lock checking is handled by CEFRLevelNavigator UI (next button disabled when locked)
  const handleLessonLevelChange = useCallback((newLevel) => {
    if (CEFR_LEVELS.includes(newLevel)) {
      setActiveLessonLevel(newLevel);
    }
  }, []);

  // Handler for flashcard level navigation
  const handleFlashcardLevelChange = useCallback((newLevel) => {
    if (CEFR_LEVELS.includes(newLevel)) {
      setActiveFlashcardLevel(newLevel);
    }
  }, []);

  // Legacy: Combined handler for level navigation
  const handleLevelChange = useCallback((newLevel) => {
    if (CEFR_LEVELS.includes(newLevel)) {
      setActiveCEFRLevel(newLevel);
    }
  }, []);

  // Load only the active levels (include both lesson and flashcard levels for mode switching)
  const relevantLevels = useMemo(() => {
    // Include both lesson and flashcard active levels to support mode switching
    const levelsSet = new Set([activeLessonLevel, activeFlashcardLevel]);
    return Array.from(levelsSet);
  }, [activeLessonLevel, activeFlashcardLevel]);

  const handleBottomBarSettingsOpen = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  /* -----------------------------------
     Loading / Onboarding gates
  ----------------------------------- */
  if (isLoadingApp || !user) {
    return (
      <Flex
        minH="100vh"
        bg="gray.900"
        color="gray.100"
        align="center"
        justify="center"
        p={6}
      >
        <VoiceOrb state="idle" />
      </Flex>
    );
  }

  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const isSubscriptionRoute = location.pathname.startsWith("/subscribe");
  const onboardingInitialDraft = {
    ...(user?.progress || {}),
    ...(user?.onboarding?.draft || {}),
    themeMode:
      user?.onboarding?.draft?.themeMode || user?.themeMode || themeMode,
  };

  if (needsOnboarding) {
    if (!isOnboardingRoute) {
      return <Navigate to="/onboarding" replace />;
    }

    return (
      <Box minH="100vh" bg="gray.900" color="gray.100">
        <Onboarding
          userLanguage={appLanguage}
          onComplete={handleOnboardingComplete}
          initialDraft={onboardingInitialDraft}
        />
      </Box>
    );
  }

  if (isOnboardingRoute) {
    return <Navigate to="/" replace />;
  }

  if (isSubscriptionRoute) {
    if (!needsSubscriptionPasscode) {
      return <Navigate to="/" replace />;
    }

    return (
      <SubscriptionGate
        appLanguage={appLanguage}
        t={t}
        onSubmit={handleSubmitPasscode}
        isSubmitting={isSavingPasscode}
        error={passcodeError}
      />
    );
  }

  if (needsSubscriptionPasscode) {
    return <Navigate to="/subscribe" replace />;
  }

  /* -----------------------------------
     Main App (dropdown + panels)
  ----------------------------------- */

  const tutorialGameInitialScenario =
    activeLesson?.isTutorial && currentTab === "game"
      ? tutorialGameScenario
      : null;

  const isGameFullScreen =
    viewMode === "lesson" &&
    (activeLesson?.isGame ||
      (activeLesson?.isTutorial &&
        currentTab === "game" &&
        !!tutorialGameInitialScenario));

  return (
    <Box minH="100dvh" bg="transparent" color="gray.50" width="100%">
      <AnimatedBackground />
      {!isGameFullScreen && (
        <TopBar
          appLanguage={appLanguage}
          user={user}
          activeNpub={activeNpub}
          activeNsec={activeNsec}
          auth={auth}
          cefrResult={cefrResult}
          cefrLoading={cefrLoading}
          cefrError={cefrError}
          onSwitchedAccount={async (id, sec) => {
            /* ... */
          }}
          onPatchSettings={saveGlobalSettings}
          settingsOpen={settingsOpen}
          closeSettings={() => setSettingsOpen(false)}
          onRunCefrAnalysis={runCefrAnalysis}
          onSelectIdentity={handleIdentitySelection}
          isIdentitySaving={isIdentitySaving}
          tabOrder={activeTabs}
          tabLabels={TAB_LABELS}
          tabIcons={TAB_ICONS}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          viewMode={viewMode}
          // 🆕 timer props
          timerRemainingSeconds={timerRemainingSeconds}
          isTimerRunning={isTimerRunning}
          timerPaused={timerPaused}
          formatTimer={formatTimer}
          onOpenTimerModal={() => setTimerModalOpen(true)}
          onTogglePauseTimer={handleTogglePauseTimer}
          onOpenDailyGoalModal={() => setDailyGoalOpen(true)}
          allowPosts={allowPosts}
          onAllowPostsChange={handleAllowPostsChange}
          soundEnabled={soundEnabled}
          onSoundEnabledChange={handleSoundEnabledChange}
          soundVolume={soundVolume}
          onVolumeChange={handleVolumeChange}
          onVolumeSave={handleVolumeSave}
          playSound={playSound}
          testSound={submitActionSound}
          isMobile={isMobile}
          postNostrContent={postNostrContent}
        />
      )}

      {/* Teams/global feed modal temporarily hidden — replaced by Real-World Practice tasks.
      <TeamsDrawer
        isOpen={teamsOpen}
        onClose={() => setTeamsOpen(false)}
        userLanguage={appLanguage}
        t={t}
        pendingInviteCount={pendingTeamInviteCount}
        allowPosts={allowPosts}
        onAllowPostsChange={handleAllowPostsChange}
      />
      */}

      <RealWorldTasksModal
        isOpen={realWorldTasksOpen}
        onClose={() => setRealWorldTasksOpen(false)}
        npub={activeNpub}
        appLanguage={appLanguage}
        targetLang={resolvedTargetLang}
        cefrLevel={currentCEFRLevel}
        realWorldTasks={realWorldTasks}
        onTasksUpdated={handleRealWorldTasksUpdated}
      />

      <NotesDrawer
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        appLanguage={appLanguage}
        targetLang={resolvedTargetLang}
      />

      {!isGameFullScreen && (
        <BottomActionBar
          t={t}
          onOpenSettings={handleBottomBarSettingsOpen}
          onOpenTeams={handleOpenRealWorldTasks}
          onOpenNotes={() => setNotesOpen(true)}
          realWorldTasksHasNotification={realWorldTasksHasNotification}
          realWorldTasksAttention={realWorldTasksAttention}
          realWorldTasksTimerProgress={realWorldTasksTimerProgress}
          showTranslations={showTranslationsEnabled}
          onToggleTranslations={handleToggleTranslations}
          translationLabel={translationToggleLabel}
          appLanguage={appLanguage}
          targetLang={resolvedTargetLang}
          viewMode={viewMode}
          onNavigateToSkillTree={handleReturnToSkillTree}
          onOpenHelpChat={helpChatDisclosure.onOpen}
          playSound={playSound}
          hasPendingTeamInvite={pendingTeamInviteCount > 0}
          notesIsLoading={notesIsLoading}
          notesIsDone={notesIsDone}
          pathMode={pathMode}
          onPathModeChange={(newMode) => {
            // If in a lesson or other view, return to skill tree first
            if (viewMode !== "skillTree") {
              handleReturnToSkillTree();
            }
            setPathMode(newMode);
            // Always scroll to top when switching modes
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
          onScrollToLatest={() => {
            // Trigger scroll when already in path mode
            if (viewMode === "skillTree") {
              setScrollToLatestTrigger((prev) => prev + 1);
            }
          }}
          currentTab={currentTab}
        />
      )}

      {/* Tutorial Action Bar Popovers - shows on first login at skill tree only */}
      <TutorialActionBarPopovers
        isActive={showSkillTreeTutorial && viewMode === "skillTree"}
        lang={appLanguage}
        onComplete={handleSkillTreeTutorialComplete}
        isOnSkillTree={true}
      />

      {/* Skill Tree Scene - Full Screen */}
      {viewMode === "skillTree" && (
        <Box pb={{ base: 32, md: 24 }} w="100%">
          {initializedLevelsKey !== levelsPersistenceKey ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minH="60vh"
            >
              <VoiceOrb state="idle" />
            </Box>
          ) : showAlphabetBootcamp ? (
            <AlphabetBootcamp
              appLanguage={appLanguage}
              targetLang={resolvedTargetLang}
              npub={activeNpub}
              languageXp={userProgress?.totalXp || 0}
              pauseMs={user?.progress?.pauseMs}
              onStartSkillTree={() => setPathMode("path")}
            />
          ) : (
            <SkillTree
              targetLang={resolvedTargetLang}
              level={resolvedLevel}
              supportLang={resolvedSupportLang}
              userProgress={userProgress}
              onStartLesson={handleStartLesson}
              onCompleteFlashcard={handleCompleteFlashcard}
              onRandomPracticeFlashcard={handleRandomPracticeFlashcard}
              pauseMs={user?.progress?.pauseMs}
              showMultipleLevels={true}
              levels={relevantLevels}
              // Mode-specific level props
              activeLessonLevel={activeLessonLevel}
              activeFlashcardLevel={activeFlashcardLevel}
              currentLessonLevel={currentLessonLevel}
              currentFlashcardLevel={currentFlashcardLevel}
              onLessonLevelChange={handleLessonLevelChange}
              onFlashcardLevelChange={handleFlashcardLevelChange}
              lessonLevelCompletionStatus={lessonLevelCompletionStatus}
              flashcardLevelCompletionStatus={flashcardLevelCompletionStatus}
              // Legacy props (for backwards compatibility)
              activeCEFRLevel={activeCEFRLevel}
              currentCEFRLevel={currentCEFRLevel}
              onLevelChange={handleLevelChange}
              levelCompletionStatus={levelCompletionStatus}
              // Conversations props
              activeNpub={activeNpub}
              // Path mode props (lifted from SkillTree)
              pathMode={pathMode}
              onPathModeChange={setPathMode}
              scrollToLatestTrigger={scrollToLatestTrigger}
              scrollToLatestUnlockedRef={scrollToLatestUnlockedRef}
              // Tutorial props
              isTutorialComplete={hasCompletedSkillTreeTutorial}
            />
          )}
        </Box>
      )}

      {/* Learning Modules Scene */}
      {viewMode === "lesson" && isGameFullScreen && (
        <Box
          w="100%"
          h="100dvh"
          position="fixed"
          top={0}
          left={0}
          zIndex={1000}
          bg="gray.900"
        >
          <RPGGame
            lessonContext={activeLesson}
            initialScenario={
              preGeneratedGameScenario || tutorialGameInitialScenario
            }
            targetLang={resolvedTargetLang}
            supportLang={resolvedSupportLang}
            onComplete={() => handleReturnToSkillTree()}
            onSkip={switchToRandomLessonMode}
          />
        </Box>
      )}

      {viewMode === "lesson" && !isGameFullScreen && (
        <Box px={[2, 3, 4]} pt={[2, 3]} pb={{ base: 32, md: 24 }} w="100%">
          {/* Tutorial Stepper - shows progress through tutorial modules */}
          {isTutorialMode && activeLesson?.isTutorial && (
            <TutorialStepper
              modules={activeLesson.modes}
              currentModule={currentTab}
              completedModules={tutorialCompletedModules}
              lang={appLanguage}
              supportLang={resolvedSupportLang}
              tutorialDescription={
                activeLesson?.content?.[currentTab]?.tutorialDescription
              }
            />
          )}

          <Tabs
            index={tabIndex}
            onChange={(i) => {
              const key = indexToKey(i);
              handleSelectTab(key);
            }}
            colorScheme="teal"
            isLazy
          >
            <TabPanels mt={[2, 3]}>
              {activeTabs.map((tabKey) => {
                switch (tabKey) {
                  case "realtime":
                    return (
                      <TabPanel key="realtime" px={0}>
                        <RealTimeTest
                          auth={auth}
                          activeNpub={activeNpub}
                          activeNsec={activeNsec}
                          level={user?.progress?.level}
                          supportLang={resolvedSupportLang}
                          voice={user?.progress?.voice}
                          voicePersona={user?.progress?.voicePersona}
                          targetLang={user?.progress?.targetLang}
                          showTranslations={user?.progress?.showTranslations}
                          pauseMs={user?.progress?.pauseMs}
                          helpRequest={user?.progress?.helpRequest}
                          practicePronunciation={
                            user?.progress?.practicePronunciation
                          }
                          lesson={activeLesson}
                          lessonContent={activeLesson?.content?.realtime}
                          onSkip={switchToRandomLessonMode}
                          onSwitchedAccount={async (id, sec) => {
                            if (id) localStorage.setItem("local_npub", id);
                            if (typeof sec === "string")
                              localStorage.setItem("local_nsec", sec);
                            await connectDID();
                            setActiveNpub(
                              localStorage.getItem("local_npub") || "",
                            );
                            setActiveNsec(
                              localStorage.getItem("local_nsec") || "",
                            );
                          }}
                        />
                      </TabPanel>
                    );
                  case "stories":
                    return (
                      <TabPanel key="stories" px={0}>
                        <StoryMode
                          userLanguage={appLanguage}
                          activeNpub={activeNpub}
                          activeNsec={activeNsec}
                          pauseMs={user?.progress?.pauseMs}
                          lesson={activeLesson}
                          lessonContent={activeLesson?.content?.stories}
                          onSkip={switchToRandomLessonMode}
                        />
                      </TabPanel>
                    );
                  case "reading":
                    return (
                      <TabPanel key="reading" px={0}>
                        <History
                          userLanguage={appLanguage}
                          lesson={activeLesson}
                          lessonContent={activeLesson?.content?.reading}
                          onSkip={switchToRandomLessonMode}
                          lessonStartXp={lessonStartXp}
                        />
                      </TabPanel>
                    );
                  case "grammar":
                    return (
                      <TabPanel key="grammar" px={0}>
                        <GrammarBook
                          userLanguage={appLanguage}
                          activeNpub={activeNpub}
                          activeNsec={activeNsec}
                          pauseMs={user?.progress?.pauseMs}
                          lesson={activeLesson}
                          lessonContent={activeLesson?.content?.grammar}
                          isFinalQuiz={activeLesson?.isFinalQuiz || false}
                          quizConfig={
                            activeLesson?.quizConfig || {
                              questionsRequired: 10,
                              passingScore: 8,
                            }
                          }
                          onSkip={switchToRandomLessonMode}
                          onSendHelpRequest={handleSendToHelpChat}
                          lessonStartXp={lessonStartXp}
                        />
                      </TabPanel>
                    );
                  case "vocabulary":
                    return (
                      <TabPanel key="vocabulary" px={0}>
                        <Vocabulary
                          userLanguage={appLanguage}
                          activeNpub={activeNpub}
                          activeNsec={activeNsec}
                          pauseMs={user?.progress?.pauseMs}
                          lesson={activeLesson}
                          lessonContent={activeLesson?.content?.vocabulary}
                          isFinalQuiz={activeLesson?.isFinalQuiz || false}
                          quizConfig={
                            activeLesson?.quizConfig || {
                              questionsRequired: 10,
                              passingScore: 8,
                            }
                          }
                          onSkip={switchToRandomLessonMode}
                          onExitQuiz={handleReturnToSkillTree}
                          onSendHelpRequest={handleSendToHelpChat}
                          lessonStartXp={lessonStartXp}
                        />
                      </TabPanel>
                    );
                  case "game":
                    return (
                      <TabPanel key="game" px={0}>
                        <RPGGame
                          lessonContext={activeLesson}
                          initialScenario={
                            preGeneratedGameScenario ||
                            tutorialGameInitialScenario
                          }
                          targetLang={resolvedTargetLang}
                          supportLang={resolvedSupportLang}
                          onSkip={switchToRandomLessonMode}
                          onScenarioReady={(scenario) => {
                            if (activeLesson?.isTutorial && scenario) {
                              setTutorialGameScenario(scenario);
                            }
                          }}
                        />
                      </TabPanel>
                    );
                  case "random":
                    return (
                      <TabPanel key="random" px={0}>
                        {renderRandomPanel()}
                      </TabPanel>
                    );
                  default:
                    return null;
                }
              })}
            </TabPanels>
          </Tabs>
        </Box>
      )}

      <HelpChatFab
        ref={helpChatRef}
        progress={user?.progress}
        appLanguage={appLanguage}
        isOpen={helpChatDisclosure.isOpen}
        onOpen={helpChatDisclosure.onOpen}
        onClose={helpChatDisclosure.onClose}
        showFloatingTrigger={false}
      />

      {/* Daily Goal Setup — only opened right after onboarding completes */}
      <DailyGoalModal
        isOpen={dailyGoalOpen}
        onClose={handleDailyGoalClose}
        onSaveGoal={handleDailyGoalSave}
        npub={activeNpub}
        lang={appLanguage}
        defaultGoal={dailyGoalTarget > 0 ? dailyGoalTarget : 100}
        t={t}
        petHealth={dailyGoalPetHealth}
        petLastOutcome={user?.dailyGoalPetLastOutcome || null}
        petLastDelta={user?.dailyGoalPetLastDelta ?? null}
        completedGoalDates={dailyGoalCompletedDates}
        dailyXpHistory={dailyGoalXpHistory}
        currentDailyXp={dailyXpToday}
        currentGoalXp={dailyGoalTarget}
      />

      <SessionTimerModal
        isOpen={timerModalOpen}
        onClose={handleTimerModalClose}
        minutes={timerMinutes}
        onMinutesChange={setTimerMinutes}
        onStart={handleStartTimer}
        isRunning={isTimerRunning}
        helper={timerHelper}
        t={t}
      />

      <ProficiencyTestModal
        isOpen={proficiencyTestOpen}
        onClose={handleProficiencySkip}
        onTakeTest={handleProficiencyTakeTest}
        lang={appLanguage}
        targetLangLabel={
          t[`language_${resolvedTargetLang}`] ||
          TARGET_LANGUAGE_LABELS[resolvedTargetLang]
        }
      />

      <GettingStartedModal
        isOpen={gettingStartedOpen}
        onClose={handleGettingStartedSkip}
        onStartTutorial={handleGettingStartedStart}
        secretKey={activeNsec}
        lang={appLanguage}
      />

      <BitcoinSupportModal
        isOpen={showTutorialBitcoinModal}
        onClose={handleCloseTutorialBitcoinModal}
        userLanguage={appLanguage}
        identity={user?.identity || ""}
        onSelectIdentity={handleIdentitySelection}
        isIdentitySaving={isIdentitySaving}
      />

      <Modal
        isOpen={timeUpOpen}
        onClose={handleCloseTimeUp}
        isCentered
        size="lg"
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent
          bg="linear-gradient(135deg, #c084fc 0%, #22d3ee 100%)"
          color="white"
          borderRadius="2xl"
          boxShadow="2xl"
          maxW={{ base: "90%", sm: "md" }}
        >
          <ModalHeader textAlign="center" fontSize="2xl" fontWeight="bold">
            {t.timer_times_up_title || "Time's up!"}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={8} px={{ base: 6, md: 8 }}>
            <VStack spacing={5} textAlign="center">
              <Box
                px={6}
                py={4}
                borderRadius="2xl"
                bg="rgba(255, 255, 255, 0.18)"
                boxShadow="0 20px 50px rgba(91, 33, 182, 0.24)"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.3)"
              >
                <RandomCharacter
                  key={`${timeUpOpen}-${timerDurationSeconds || 0}`}
                  width="112px"
                  notSoRandomCharacter={"32"}
                />
              </Box>
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">
                  {t.timer_times_up_subtitle || "Focus session complete"}
                </Text>
                <Text opacity={0.9} fontSize="md">
                  {timerDurationSeconds
                    ? (
                        t.timer_times_up_duration ||
                        "You stayed on task for {minutes} minutes."
                      ).replace(
                        "{minutes}",
                        String(Math.round(timerDurationSeconds / 60)),
                      )
                    : t.timer_times_up_no_duration ||
                      "Nice work wrapping up your timer."}
                </Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3} flexWrap="wrap">
            <Button
              variant="ghost"
              color="white"
              onClick={handleTimeUpButtonClose}
            >
              {t.timer_times_up_close || "Close"}
            </Button>
            <Button
              colorScheme="whiteAlpha"
              bg="white"
              color="purple.700"
              _hover={{ bg: "rgba(255, 255, 255, 0.92)" }}
              onClick={handleTimeUpRestart}
            >
              {t.timer_times_up_restart || "Start another timer"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Daily celebration (once per day) */}
      <Modal
        isOpen={celebrateOpen}
        onClose={handleCloseDailyGoalModal}
        isCentered
        size="lg"
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent
          bg="linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)"
          color="white"
          borderRadius="2xl"
          boxShadow="2xl"
          maxW={{ base: "90%", sm: "md" }}
        >
          <ModalBody py={{ base: 8, md: 10 }} px={{ base: 6, md: 8 }}>
            <VStack spacing={{ base: 4, md: 5 }} textAlign="center">
              <VStack spacing={2}>
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
                  {appLanguage === "es"
                    ? "¡Meta diaria alcanzada!"
                    : "Daily Goal Complete!"}
                </Text>
                <Text fontSize={{ base: "md", md: "lg" }} opacity={0.9}>
                  {appLanguage === "es"
                    ? "Alcanzaste tu objetivo de XP de hoy."
                    : "You hit today’s XP target."}
                </Text>
              </VStack>

              <Box
                bg="rgba(255, 255, 255, 0.2)"
                borderRadius="xl"
                py={{ base: 4, md: 6 }}
                px={{ base: 5, md: 8 }}
                width="100%"
                border="2px solid"
                borderColor="rgba(255, 255, 255, 0.4)"
              >
                <VStack spacing={3}>
                  <HStack spacing={6} justify="center">
                    <VStack spacing={1} minW="120px">
                      <Text fontSize="xs" opacity={0.8}>
                        {appLanguage === "es" ? "Meta" : "Goal"}
                      </Text>
                      <Text fontSize="3xl" fontWeight="bold" color="yellow.200">
                        {dailyGoalTarget || 0} XP
                      </Text>
                    </VStack>
                  </HStack>
                  <Text fontSize="sm" opacity={0.85}>
                    {appLanguage === "es"
                      ? "¡Sigue la racha y vuelve mañana para un nuevo objetivo!"
                      : "Keep the streak going and come back tomorrow for a new goal!"}
                  </Text>
                </VStack>
              </Box>

              <DailyGoalPetPanel
                lang={appLanguage}
                health={celebrationPetHealth}
                lastOutcome="achieved"
                lastDelta={celebrationPetDelta}
                variant="celebration"
                showPreview={false}
              />

              <Button
                size={{ base: "md", md: "lg" }}
                width="100%"
                colorScheme="teal"
                onClick={handleCloseDailyGoalModal}
                fontWeight="bold"
                fontSize={{ base: "md", md: "lg" }}
                py={{ base: 5, md: 6 }}
              >
                {appLanguage === "es" ? "Seguir practicando" : "Keep learning"}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Lesson Completion Celebration Modal */}
      <Modal
        isOpen={showCompletionModal}
        onClose={handleCloseCompletionModal}
        returnFocusOnClose={false}
        isCentered
        size="lg"
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
              <Box
                bg="rgba(255, 255, 255, 0.2)"
                borderRadius="full"
                p={4}
                border="2px solid"
                borderColor="rgba(255, 255, 255, 0.3)"
                boxShadow="0 20px 40px rgba(0, 0, 0, 0.18)"
              >
                <RandomCharacter
                  key={`${completedLessonData?.lessonId || "lesson"}-${
                    showCompletionModal ? "open" : "closed"
                  }`}
                  width="96px"
                  notSoRandomCharacter={"27"}
                />
              </Box>

              {/* Title */}
              <VStack spacing={2}>
                <Text fontSize="3xl" fontWeight="bold">
                  {appLanguage === "es"
                    ? "¡Lección Completada!"
                    : "Lesson Complete!"}
                </Text>
                <Text fontSize="lg" opacity={0.9}>
                  {completedLessonData?.title?.[appLanguage] ||
                    completedLessonData?.title?.en}
                </Text>
              </VStack>

              {/* XP Award Display */}
              <Box
                bg="rgba(255, 255, 255, 0.2)"
                borderRadius="xl"
                py={6}
                px={8}
                width="100%"
                border="2px solid"
                borderColor="rgba(255, 255, 255, 0.4)"
              >
                <VStack spacing={2}>
                  <Text
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    opacity={0.8}
                  >
                    {appLanguage === "es" ? "XP Ganado" : "XP Earned"}
                  </Text>
                  <Text fontSize="5xl" fontWeight="bold" color="yellow.300">
                    +{completedLessonData?.xpEarned || 0}
                  </Text>
                  <Text fontSize="sm" opacity={0.8}>
                    {appLanguage === "es"
                      ? "Puntos de Experiencia"
                      : "Experience Points"}
                  </Text>
                </VStack>
              </Box>

              {/* Continue Button */}
              <Button
                size="lg"
                width="100%"
                bg="white"
                color="purple.600"
                _hover={{ bg: "rgba(255, 255, 255, 0.92)" }}
                _active={{ bg: "rgba(255, 255, 255, 0.82)" }}
                onClick={handleCloseCompletionModal}
                fontWeight="bold"
                fontSize="lg"
                py={6}
              >
                {appLanguage === "es" ? "Continuar" : "Continue"}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Proficiency Level Completion Celebration Modal */}
      <Modal
        isOpen={showProficiencyCompletionModal}
        onClose={handleCloseProficiencyCompletionModal}
        isCentered
        size="lg"
        closeOnOverlayClick={false}
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent
          bg={
            completedProficiencyData?.level
              ? CEFR_LEVEL_INFO[completedProficiencyData.level]?.gradient ||
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          }
          color="white"
          borderRadius="2xl"
          boxShadow="2xl"
          maxW={{ base: "90%", sm: "md" }}
        >
          <ModalBody py={12} px={8}>
            <VStack spacing={6} textAlign="center">
              <CelebrationOrb
                size={140}
                icon="★"
                accentGradient="linear(135deg, green.300, green.400, teal.400)"
                particleColor="green.200"
              />

              {/* Title */}
              <VStack spacing={2}>
                <Text fontSize="3xl" fontWeight="bold">
                  {appLanguage === "es"
                    ? "¡Nivel Completado!"
                    : "Level Complete!"}
                </Text>
                <Text fontSize="2xl" opacity={0.95} fontWeight="semibold">
                  {completedProficiencyData?.level} -{" "}
                  {
                    CEFR_LEVEL_INFO[completedProficiencyData?.level]?.name[
                      appLanguage
                    ]
                  }
                </Text>
              </VStack>

              {/* Completion Message */}
              <Box
                bg="rgba(255, 255, 255, 0.2)"
                borderRadius="xl"
                py={6}
                px={8}
                width="100%"
                border="2px solid"
                borderColor="rgba(255, 255, 255, 0.4)"
              >
                <VStack spacing={3}>
                  <Text fontSize="lg" fontWeight="bold">
                    {appLanguage === "es"
                      ? "¡Felicitaciones!"
                      : "Congratulations!"}
                  </Text>
                  <Text fontSize="md" opacity={0.9}>
                    {completedProficiencyData?.nextLevel
                      ? appLanguage === "es"
                        ? `Has desbloqueado el nivel ${completedProficiencyData.nextLevel}`
                        : `You've unlocked level ${completedProficiencyData.nextLevel}`
                      : appLanguage === "es"
                        ? "¡Has completado todos los niveles!"
                        : "You've completed all levels!"}
                  </Text>
                </VStack>
              </Box>

              {/* Continue Button */}
              <Button
                size="lg"
                width="100%"
                bg="white"
                color={
                  completedProficiencyData?.level
                    ? CEFR_LEVEL_INFO[completedProficiencyData.level]?.color ||
                      "purple.600"
                    : "purple.600"
                }
                _hover={{ bg: "rgba(255, 255, 255, 0.92)" }}
                _active={{ bg: "rgba(255, 255, 255, 0.82)" }}
                onClick={handleCloseProficiencyCompletionModal}
                fontWeight="bold"
                fontSize="lg"
                py={6}
              >
                {completedProficiencyData?.nextLevel
                  ? appLanguage === "es"
                    ? "Ir al Siguiente Nivel"
                    : "Go to Next Level"
                  : appLanguage === "es"
                    ? "Continuar"
                    : "Continue"}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function BottomActionBar({
  t,
  onOpenSettings,
  onOpenTeams,
  onOpenNotes,
  showTranslations = true,
  onToggleTranslations,
  translationLabel,
  appLanguage = "en",
  targetLang = "es",
  onNavigateToSkillTree,
  viewMode,
  onOpenHelpChat,
  playSound,
  helpLabel,
  hasPendingTeamInvite = false,
  realWorldTasksHasNotification = false,
  realWorldTasksAttention = false,
  realWorldTasksTimerProgress = 0,
  notesIsLoading = false,
  notesIsDone = false,
  pathMode = "path",
  onPathModeChange,
  onScrollToLatest,
  currentTab,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const settingsLabel =
    t?.app_settings_aria || t?.ra_btn_settings || "Settings";
  const toggleLabel =
    translationLabel || t?.ra_translations_toggle || "Translations";
  const helpChatLabel =
    helpLabel || t?.app_help_chat || (appLanguage === "es" ? "Ayuda" : "Help");
  const teamsLabel = t?.teams_drawer_title || "Teams";
  const tasksLabel =
    appLanguage === "es" ? "Práctica de inmersión" : "Immersion practice";
  const notesLabel = appLanguage === "es" ? "Notas" : "Notes";

  // Path mode configuration
  const ALPHABET_LANGS = [
    "ru",
    "ja",
    "en",
    "es",
    "pt",
    "fr",
    "it",
    "nl",
    "de",
    "nah",
    "el",
    "pl",
    "ga",
    "yua",
  ];
  const PATH_MODES = [
    ...(ALPHABET_LANGS.includes(targetLang)
      ? [
          {
            id: "alphabet",
            label: appLanguage === "es" ? "Alfabeto" : "Alphabet",
            icon: LuLanguages,
          },
        ]
      : []),
    {
      id: "path",
      label: appLanguage === "es" ? "Ruta" : "Path",
      icon: PiPath,
    },
    {
      id: "flashcards",
      label: appLanguage === "es" ? "Tarjetas" : "Cards",
      icon: PiCardsBold,
    },
    {
      id: "conversations",
      label: appLanguage === "es" ? "Conversación" : "Conversation",
      icon: RiChat3Line,
    },
  ];

  const currentMode =
    PATH_MODES.find((m) => m.id === pathMode) || PATH_MODES[0];
  const CurrentModeIcon = currentMode.icon;
  const modeMenuLabel = appLanguage === "es" ? "Modo" : "Mode";

  // Determine notes button border styles based on loading/done state
  const notesBorderWidth = notesIsLoading || notesIsDone ? "2px" : "1px";
  const notesBorderColor = notesIsLoading
    ? "cyan.400"
    : notesIsDone
      ? "green.400"
      : "gray.600";
  const notesBoxShadow = notesIsLoading
    ? "0 0 0 2px rgba(34,211,238,0.35), 0 0 14px rgba(34,211,238,0.65)"
    : notesIsDone
      ? "0 0 0 2px rgba(74,222,128,0.35), 0 0 14px rgba(74,222,128,0.65)"
      : undefined;
  const notesAnimation = notesIsLoading
    ? "notesPulse 1.5s ease-in-out infinite"
    : notesIsDone
      ? "notesDone 1.5s ease-out"
      : undefined;
  // Auto-minimize when entering a lesson or switching modules
  const [isMinimized, setIsMinimized] = useState(viewMode === "lesson");
  const prevViewMode = useRef(viewMode);
  const prevTab = useRef(currentTab);

  useEffect(() => {
    if (viewMode === "lesson" && prevViewMode.current !== "lesson") {
      setIsMinimized(true);
    } else if (viewMode !== "lesson") {
      setIsMinimized(false);
    }
    prevViewMode.current = viewMode;
  }, [viewMode]);

  // Re-minimize when switching modules within a lesson
  useEffect(() => {
    if (viewMode === "lesson" && currentTab !== prevTab.current) {
      setIsMinimized(true);
    }
    prevTab.current = currentTab;
  }, [currentTab, viewMode]);

  const handleActionClick = (action) => {
    if (!action) return;
    playSound?.(selectSound);
    action();
  };

  // Minimized bar highlight when a note is saved
  const minimizedHighlight = notesIsDone
    ? "0 0 0 2px rgba(74,222,128,0.5), 0 0 16px rgba(74,222,128,0.7)"
    : notesIsLoading
      ? "0 0 0 2px rgba(34,211,238,0.5), 0 0 16px rgba(34,211,238,0.7)"
      : undefined;
  const minimizedBorderColor = notesIsDone
    ? "green.400"
    : notesIsLoading
      ? "cyan.400"
      : "var(--app-border)";
  const minimizedAnimation = notesIsLoading
    ? "notesPulse 1.5s ease-in-out infinite"
    : notesIsDone
      ? "notesDone 1.5s ease-out"
      : undefined;

  // Render minimized pill when in lesson and minimized
  if (isMinimized && viewMode === "lesson") {
    return (
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={80}
        width="100%"
        maxW="480px"
        margin="0 auto"
        mb={3}
        paddingLeft={2}
        paddingRight={2}
        display="flex"
        justifyContent="center"
      >
        <Box
          as="button"
          onClick={() => {
            playSound?.(selectSound);
            setIsMinimized(false);
          }}
          borderRadius="24px"
          bg="var(--app-glass-bg)"
          backdropFilter="blur(8px)"
          px={6}
          py={2}
          cursor="pointer"
          display="flex"
          alignItems="center"
          gap={2}
          borderWidth={notesIsDone || notesIsLoading ? "2px" : "1px"}
          borderColor={minimizedBorderColor}
          boxShadow={
            minimizedHighlight ||
            (isLightTheme
              ? "0 4px 10px rgba(117, 94, 66, 0.1)"
              : "0 2px 8px rgba(0,0,0,0.3)")
          }
          transition="all 0.3s ease"
          animation={minimizedAnimation}
          _hover={{ bg: "var(--app-glass-hover)" }}
          sx={{
            "@keyframes notesPulse": {
              "0%": {
                boxShadow:
                  "0 0 0 2px rgba(34,211,238,0.35), 0 0 8px rgba(34,211,238,0.4)",
              },
              "50%": {
                boxShadow:
                  "0 0 0 3px rgba(34,211,238,0.5), 0 0 20px rgba(34,211,238,0.7)",
              },
              "100%": {
                boxShadow:
                  "0 0 0 2px rgba(34,211,238,0.35), 0 0 8px rgba(34,211,238,0.4)",
              },
            },
            "@keyframes notesDone": {
              "0%": {
                boxShadow:
                  "0 0 0 3px rgba(74,222,128,0.6), 0 0 20px rgba(74,222,128,0.8)",
              },
              "100%": {
                boxShadow: isLightTheme
                  ? "0 4px 10px rgba(117, 94, 66, 0.1)"
                  : "0 2px 8px rgba(0,0,0,0.3)",
                borderColor: "var(--app-border)",
              },
            },
          }}
        >
          <ChevronUpIcon boxSize={4} color="gray.300" />
          <Box as="span" fontSize="xs" color="gray.400" fontWeight="medium">
            Menu
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={80}
      width="100%"
      maxW="480px"
      margin="0 auto"
      mb={3}
      paddingLeft={2}
      paddingRight={2}
    >
      <Box borderRadius="24px" overflow="hidden">
        <GlassContainer
          borderRadius="24px"
          blur={0.5}
          contrast={1.1}
          brightness={1.05}
          saturation={1.1}
          zIndex={80}
          displacementScale={0.2}
          className="bottombar-glass"
          elasticity={0.9}
          fallbackBlur="2px"
          fallbackBg="var(--app-glass-bg-soft)"
        >
          <Box
            py={2}
            px={{ base: 3, md: 6 }}
            width="100%"
            paddingBottom={5}
            paddingTop={3}
            borderRadius="24px"
          >
            {/* Minimize caret above buttons */}
            {viewMode === "lesson" && (
              <Flex justify="center" mb={1}>
                <Box
                  as="button"
                  onClick={() => {
                    playSound?.(selectSound);
                    setIsMinimized(true);
                  }}
                  bg="transparent"
                  border="none"
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  px={4}
                  py={0}
                  _hover={{ opacity: 0.7 }}
                  transition="opacity 0.2s"
                >
                  <ChevronDownIcon boxSize={5} color="gray.400" />
                </Box>
              </Flex>
            )}
            <Flex
              as="nav"
              maxW="560px"
              mx="auto"
              w="100%"
              align="center"
              justify={{ base: "space-between", md: "space-between" }}
              flexWrap={{ base: "wrap", md: "wrap" }}
              overflow="visible"
              borderRadius="24px"
            >
              <Box position="relative" flexShrink={0}>
                {realWorldTasksTimerProgress > 0 && (
                  <Box
                    as="svg"
                    position="absolute"
                    top="calc(50% + 2px)"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    width="44px"
                    height="48px"
                    viewBox="0 0 44 48"
                    pointerEvents="none"
                    aria-hidden="true"
                    zIndex={1}
                    overflow="visible"
                  >
                    <rect
                      x="1.75"
                      y="1.75"
                      width="40.5"
                      height="44.5"
                      rx="14"
                      ry="14"
                      fill="none"
                      stroke={
                        isLightTheme
                          ? "rgba(120, 94, 61, 0.18)"
                          : "rgba(255,255,255,0.08)"
                      }
                      strokeWidth="3.5"
                    />
                    <rect
                      x="1.75"
                      y="1.75"
                      width="40.5"
                      height="44.5"
                      rx="14"
                      ry="14"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset={100 - realWorldTasksTimerProgress}
                      style={{
                        transition: "stroke-dashoffset 0.8s ease",
                      }}
                    />
                  </Box>
                )}
                <IconButton
                  data-tutorial-id="teams"
                  icon={<FiCompass size={16} />}
                  onClick={() => handleActionClick(onOpenTeams)}
                  aria-label={tasksLabel}
                  size="sm"
                  rounded="xl"
                  borderWidth={realWorldTasksAttention ? "2px" : "0px"}
                  borderColor={
                    realWorldTasksAttention ? "purple.400" : "gray.700"
                  }
                  boxShadow={
                    isLightTheme
                      ? "0 4px 0 rgba(180, 164, 144, 0.9)"
                      : "0 4px 0 #313a4b"
                  }
                  animation={
                    realWorldTasksAttention
                      ? "tasksAttentionPing 1.5s ease-out"
                      : undefined
                  }
                  colorScheme="gray"
                  bg="gray.800"
                  color="gray.100"
                  sx={{
                    "@keyframes tasksAttentionPing": {
                      "0%": {
                        boxShadow:
                          "0 0 0 3px rgba(168,85,247,0.6), 0 0 20px rgba(168,85,247,0.8)",
                      },
                      "100%": {
                        boxShadow: isLightTheme
                          ? "0 4px 0 rgba(180, 164, 144, 0.9)"
                          : "0 4px 0 #313a4b",
                        borderColor: "gray.700",
                      },
                    },
                  }}
                />
                {realWorldTasksHasNotification && (
                  <Box
                    position="absolute"
                    top="-4px"
                    right="-4px"
                    minW="16px"
                    h="16px"
                    px="4px"
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    fontSize="10px"
                    fontWeight="bold"
                    lineHeight="16px"
                    textAlign="center"
                    boxShadow="0 0 0 2px var(--app-glass-bg-soft, rgba(0,0,0,0.6))"
                    pointerEvents="none"
                    aria-hidden="true"
                  >
                    !
                  </Box>
                )}
              </Box>

              <IconButton
                data-tutorial-id="settings"
                icon={<SettingsIcon boxSize="14px" />}
                color="gray.100"
                onClick={() => handleActionClick(onOpenSettings)}
                aria-label={settingsLabel}
                size="sm"
                rounded="xl"
                flexShrink={0}
                colorScheme="gray"
                bg="gray.800"
                boxShadow={
                  isLightTheme
                    ? "0 4px 0 rgba(180, 164, 144, 0.9)"
                    : "0 4px 0 #313a4b"
                }
              />

              <IconButton
                data-tutorial-id="notes"
                icon={<RiBookmarkLine size={16} />}
                aria-label={notesLabel}
                onClick={() => handleActionClick(onOpenNotes)}
                isLoading={notesIsLoading}
                colorScheme="gray"
                bg="gray.800"
                boxShadow={
                  isLightTheme
                    ? "0 4px 0 rgba(180, 164, 144, 0.9)"
                    : "0 4px 0 #313a4b"
                }
                color="gray.100"
                size="sm"
                zIndex={50}
                rounded="xl"
                transition="all 0.3s ease"
                animation={notesAnimation}
                sx={{
                  "@keyframes notesPulse": {
                    "0%": {
                      boxShadow:
                        "0 0 0 2px rgba(34,211,238,0.35), 0 0 8px rgba(34,211,238,0.4)",
                    },
                    "50%": {
                      boxShadow:
                        "0 0 0 3px rgba(34,211,238,0.5), 0 0 20px rgba(34,211,238,0.7)",
                    },
                    "100%": {
                      boxShadow:
                        "0 0 0 2px rgba(34,211,238,0.35), 0 0 8px rgba(34,211,238,0.4)",
                    },
                  },
                  "@keyframes notesDone": {
                    "0%": {
                      boxShadow:
                        "0 0 0 3px rgba(74,222,128,0.6), 0 0 20px rgba(74,222,128,0.8)",
                    },
                    "100%": { boxShadow: "none", borderColor: "gray.600" },
                  },
                }}
              />

              <IconButton
                data-tutorial-id="help"
                icon={<MdOutlineSupportAgent size={16} />}
                onClick={() => handleActionClick(onOpenHelpChat)}
                aria-label={helpChatLabel}
                isDisabled={!onOpenHelpChat}
                size="sm"
                rounded="xl"
                bg="white"
                color="blue"
                boxShadow="0 4px 0 blue"
                zIndex={50}
                flexShrink={0}
              />

              {/* Path Mode Menu */}
              <Menu placement="top-end">
                <MenuButton
                  data-tutorial-id="mode"
                  as={IconButton}
                  icon={<CurrentModeIcon size={16} />}
                  aria-label={modeMenuLabel}
                  size="sm"
                  rounded="xl"
                  flexShrink={0}
                  onClick={() => playSound?.(modeSwitcherSound)}
                  // bg="rgba(0, 98, 189, 0.6)"
                  colorScheme="teal"
                  // boxShadow="0 4px 0 rgba(0, 151, 189, 0.6)"
                  color="white"
                />
                <Portal>
                  <MenuList
                    bg={
                      isLightTheme ? "var(--app-surface-elevated)" : "gray.800"
                    }
                    color={isLightTheme ? "var(--app-text-primary)" : "white"}
                    borderColor="var(--app-border)"
                    boxShadow="var(--app-shadow-soft)"
                    minW="180px"
                    zIndex="popover"
                    mb={4}
                  >
                    {PATH_MODES.map((mode) => {
                      const ModeIcon = mode.icon;
                      const isSelected = pathMode === mode.id;
                      return (
                        <MenuItem
                          key={mode.id}
                          onClick={() => {
                            playSound?.(modeSwitcherSound);
                            // If clicking the already-selected mode, navigate back to skill tree (if in a lesson) or scroll
                            if (isSelected) {
                              if (viewMode !== "skillTree") {
                                onNavigateToSkillTree?.();
                              } else if (mode.id === "path") {
                                onScrollToLatest?.();
                              }
                            } else {
                              onPathModeChange?.(mode.id);
                            }
                          }}
                          bg={
                            isLightTheme
                              ? isSelected
                                ? "var(--app-surface-muted)"
                                : "transparent"
                              : isSelected
                                ? "whiteAlpha.100"
                                : "transparent"
                          }
                          _hover={{
                            bg: isLightTheme
                              ? "var(--app-surface-muted)"
                              : "whiteAlpha.200",
                            color: isLightTheme
                              ? "var(--app-text-primary)"
                              : "white",
                          }}
                          _active={{
                            bg: isLightTheme
                              ? "var(--app-glass-bg-soft)"
                              : "whiteAlpha.200",
                            color: isLightTheme
                              ? "var(--app-text-primary)"
                              : "white",
                          }}
                          color={
                            isLightTheme
                              ? isSelected
                                ? "var(--app-text-primary)"
                                : "var(--app-text-secondary)"
                              : "white"
                          }
                          icon={<ModeIcon size={18} />}
                          fontWeight={isSelected ? "bold" : "normal"}
                          p={6}
                        >
                          {mode.label}
                        </MenuItem>
                      );
                    })}
                  </MenuList>
                </Portal>
              </Menu>
            </Flex>
          </Box>
        </GlassContainer>
      </Box>
    </Box>
  );
}
