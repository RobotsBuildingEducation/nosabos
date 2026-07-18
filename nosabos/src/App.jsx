// src/App.jsx
import React, {
  Suspense,
  lazy,
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
  CloseIcon,
} from "@chakra-ui/icons";
import { CiUser, CiEdit } from "react-icons/ci";
import { MdOutlineSupportAgent, MdShowChart } from "react-icons/md";
import {
  RiSpeakLine,
  RiBook2Line,
  RiBookmarkFill,
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
  PiSealQuestionDuotone,
} from "react-icons/pi";
import { FiClock, FiCompass, FiPause, FiPlay, FiTarget } from "react-icons/fi";
import { FaCalendarAlt, FaCalendarCheck } from "react-icons/fa";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import { database, simplemodel } from "./firebaseResources/firebaseResources";

import { Navigate, useLocation, useNavigate } from "react-router-dom";

import useUserStore from "./hooks/useUserStore";
import useModalStore from "./hooks/useModalStore";
import { useDecentralizedIdentity } from "./hooks/useDecentralizedIdentity";
import * as Tone from "tone";
import useSoundSettings from "./hooks/useSoundSettings";

import GrammarBook from "./components/GrammarBook";
import Onboarding from "./components/Onboarding";
import VoiceOrb from "./components/VoiceOrb";
import RealTimeTest from "./components/RealTimeTest";
import BottomDrawerDragHandle from "./components/BottomDrawerDragHandle";
import VoicePreferenceField from "./components/VoicePreferenceField";

import { translations } from "./utils/translation";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "./utils/llm";
import { clampCefrLevel, maxCefrLevel } from "./utils/phonicsLevel";
import Vocabulary from "./components/Vocabulary";
import StoryMode from "./components/Stories";
import History from "./components/History";
import HelpChatFab from "./components/HelpChatFab";
import DailyGoalModal from "./components/DailyGoalModal";
import DailyGoalPetPanel from "./components/DailyGoalPetPanel.jsx";
import { getCustomizeModalCopy } from "./components/companionCustomizeCopy";
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
import useRepairFocusStore from "./hooks/useRepairFocusStore";
import { subscribeToTeamInvites } from "./utils/teams";
import SkillTree, { GAME_LOADING_MESSAGES } from "./components/SkillTree";
import DailyPlateHome from "./components/DailyPlateHome";
import {
  PLATE_BONUS_TOAST_COPY,
  PLATE_CLEARED_COPY,
  PLATE_CLOSE_COPY,
  PLATE_CONTINUE_COPY,
  PLATE_COURSE_META,
  PLATE_EXERCISE_COMPLETE_COPY,
  PLATE_NEXT_COPY,
  PLATE_VIEW_NOTES_COPY,
  PLATE_TITLE_COPY,
  plateUiCopy,
} from "./utils/dailyPlateCopy";
import {
  DAILY_PLATE_BONUS_XP,
  DAILY_PLATE_COURSE_ORDER,
  applyPlateBonusMarker,
  claimDailyPlateBonus,
  clearPlateSession,
  electDailyQuestCourses,
  getDailyPlateDayKey,
  getDailyPlateSnapshot,
  getNextPlateCourse,
  getQuestNeglectWeights,
  hasSeenFirstQuest,
  isPastFirstQuest,
  isPlateSessionFor,
  markFirstQuestFlagOnly,
  markFirstQuestSeen,
  normalizePlateLang,
  readPlateSession,
  readQuestPlate,
  readQuestPlateKinds,
  recordPlateActivity,
  resetTodayPlate,
  startPlateSession,
  writeQuestPlate,
} from "./utils/dailyPlate";
import {
  buildEphemeralRepairLesson,
  completeRepairLesson,
  getBlueprintCarryOverKinds,
  getNextRepairStep,
  getReusableMemory,
  hydrateCompanionBucket,
  hydrateQuestDays,
  getStoredRepairPlan,
  getTodaysCapturedNotes,
  getTomorrowKey,
  getYesterdayKey,
  pruneCompanionMemory,
  resetTodayRepairArtifacts,
  runDailyBatch,
  shouldRunDailyBatch,
} from "./utils/companionMemory";
import { migrateUserToSchemaV2 } from "./utils/userDataSchema";
import CompanionRepairModal from "./components/CompanionRepairModal";
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
import SessionTimerBadge from "./components/SessionTimerBadge";
import {
  getRemainingSeconds,
  setRemainingSeconds,
} from "./provider/SessionTimerProvider";
import ProficiencyTestModal from "./components/ProficiencyTestModal";
import ModesCarouselModal from "./components/ModesCarouselModal";
import GettingStartedModal from "./components/GettingStartedModal";
import BitcoinSupportModal from "./components/BitcoinSupportModal";
import RandomCharacter from "./components/RandomCharacter";
import {
  loadLearningPath,
  loadMultiLevelLearningPath,
  getLatestUnlockedLesson,
} from "./data/skillTree/index.js";
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
import { prepareTutorialGameScenario } from "./utils/tutorialGameLoader";
import { waitForGameLoaderExploration } from "./utils/gameLoaderTiming";
import { LESSON_COUNTS, getLessonLevelFromId } from "./utils/cefrProgress";
import { BsCalendar2DateFill } from "react-icons/bs";
import { TbLanguage } from "react-icons/tb";
import sparkleSound from "./assets/sparkle.mp3";
import submitActionSound from "./assets/submitaction.mp3";
import selectSound from "./assets/select.mp3";
import dailyGoalSound from "./assets/dailygoal.mp3";
import {
  DAILY_GOAL_PET_HEALTH_GAIN,
  buildDailyGoalResetFields,
  countMissedDailyGoalWindows,
  getDailyGoalPetHealth,
  hasDailyGoalResetExpired,
} from "./utils/dailyGoalPet";
import {
  getCompanionLevelFromXp,
  getEffectivePetType,
  getNewlyUnlockedPetTypes,
  getPetUnlockLevel,
  normalizePetType,
} from "./utils/petTypes";
import { normalizeThemeMode, useThemeStore } from "./useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  getLanguageLabel,
  getLanguageDirection,
  getLanguageLocale,
  getLanguagePromptName,
  getPracticeLanguageOptions,
  getSortLocale,
  getSupportLanguageOptions,
  isSupportedPracticeLanguage,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "./constants/languages";
import { syncDocumentLanguage } from "./utils/documentLanguage";
import { getGermanCopy } from "./utils/germanCopy";
import {
  clearAccountSwitch,
  clearSecretKeySignIn,
  getAccountSwitchNpub,
  getSecretKeySignInNpub,
  rememberAccountSwitch,
} from "./utils/authSession";
import {
  nativeAnchoredDrawerMotionProps,
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "./utils/modalMotion";
import { scheduleAfterNextPaint } from "./utils/afterPaint";
import {
  getTutorVoiceOption,
  getTutorVoiceOptions,
  getTutorVoicePreviewProvider,
  normalizeTutorVoice,
} from "./utils/tutorRealtime";

// The game client is resolved ahead of the view flip instead of going through
// React.lazy: handleStartLesson awaits this and stores the component in state
// before viewMode switches, so the lesson modal's mini-map loader stays on
// screen until the game can paint directly — no Suspense fallback commits in
// between. The cached promise resets on failure so a later attempt can retry.
let rpgGameComponentPromise = null;
const LoadingMiniGame = lazy(() => import("./components/LoadingMiniGame.jsx"));
function loadRPGGameComponent() {
  if (!rpgGameComponentPromise) {
    rpgGameComponentPromise = import("./components/RPGGame/GameRouter.jsx")
      .then((mod) => mod.default)
      .catch((error) => {
        rpgGameComponentPromise = null;
        throw error;
      });
  }
  return rpgGameComponentPromise;
}

async function warmUpcomingGameReview(lesson, targetLang, supportLang = "en") {
  try {
    const level =
      lesson?.content?.game?.cefrLevel ||
      inferCefrLevelFromLessonId(lesson?.id) ||
      "Pre-A1";
    const units = await loadLearningPath(targetLang, level);
    const unit = units.find((entry) =>
      entry?.lessons?.some((candidate) => candidate?.id === lesson?.id),
    );
    if (!unit) return;
    const lessonIndex = unit.lessons.findIndex(
      (candidate) => candidate?.id === lesson?.id,
    );
    const gameLesson = unit.lessons[lessonIndex + 1];
    if (!gameLesson?.isGame) return;

    const reviewContext = buildGameReviewContext({
      lesson: gameLesson,
      unit,
      fallbackLevel: level,
      targetLang,
    });
    const { prepareLegacyEpisodeScenario } =
      await import("./components/RPGGame/episodes/legacyScenario.js");
    await prepareLegacyEpisodeScenario({
      lesson: {
        ...gameLesson,
        gameReviewContext: reviewContext,
      },
      targetLang,
      supportLang,
    });
  } catch {
    // Warming is opportunistic; tier-1 is always complete.
  }
}

/* ---------------------------
   Small helpers
--------------------------- */
const isTrue = (v) => v === true || v === "true" || v === 1 || v === "1";

const onboardingCompletionStorageKey = (id) =>
  `onboardingCompleted:${String(id || "").trim()}`;

const getLocalOnboardingCompletion = (id) => {
  if (typeof window === "undefined" || !id) return null;
  try {
    const raw = localStorage.getItem(onboardingCompletionStorageKey(id));
    if (!raw) return null;
    if (isTrue(raw)) return { completed: true, completedAt: null };
    const parsed = JSON.parse(raw);
    return isTrue(parsed?.completed) ? parsed : null;
  } catch {
    return null;
  }
};

const rememberLocalOnboardingCompletion = (id, completedAt) => {
  if (typeof window === "undefined" || !id) return;
  try {
    localStorage.setItem(
      onboardingCompletionStorageKey(id),
      JSON.stringify({ completed: true, completedAt: completedAt || null }),
    );
  } catch {}
};

const hasCompletedOnboarding = (data) =>
  isTrue(data?.onboarding?.completed) || isTrue(data?.onboardingCompleted);

// Onboarding writes this full progress profile only when the final step is
// submitted. In-progress answers live under onboarding.draft instead. This is
// therefore durable, cross-origin evidence for accounts whose completion flag
// was lost or was incorrectly reset by an older bootstrap path.
const hasPersistedOnboardingProfile = (data) => {
  const progress = data?.progress;
  if (!progress || typeof progress !== "object") return false;

  const hasString = (key) =>
    typeof progress[key] === "string" && progress[key].trim().length > 0;
  const hasVoiceSettings =
    hasString("voice") ||
    hasString("tutorVoice") ||
    hasString("voicePersona") ||
    hasString("tutorVoicePersona");

  return (
    hasString("level") &&
    hasString("supportLang") &&
    hasString("targetLang") &&
    hasVoiceSettings
  );
};

const getPersistedOnboardingCompletion = (data) => {
  const completedAt = data?.onboarding?.completedAt;
  if (
    (typeof completedAt === "string" && completedAt.trim()) ||
    (completedAt && typeof completedAt === "object")
  ) {
    return { completed: true, completedAt };
  }

  if (hasPersistedOnboardingProfile(data)) {
    return {
      completed: true,
      completedAt: data?.updatedAt || null,
    };
  }

  return null;
};

const CEFR_LEVELS = new Set(["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"]);
const ONBOARDING_TOTAL_STEPS = 1;
const TEST_UNLOCK_NSEC =
  "nsec1akcvuhtemz3kw58gvvfg38uucu30zfsahyt6ulqapx44lype6a9q42qevv";

const DEFAULT_VOICE_PAUSE_MS = 600;
const LOADING_ORB_STATES = ["idle", "listening", "speaking"];

// Repair routing: which surface each repair-step mode opens. Only modes
// whose surface is wired for repair (seeding + completion) belong here;
// "lesson" steps run as ephemeral skill-tree lessons instead. Conversation is
// deliberately NOT a repair surface — free-form chat can't verify a specific
// weak spot. "flashcards" opens the real deck surface, which builds a small
// generated repair deck from the step (see FlashcardSkillTree).
const REPAIR_MODE_TO_SURFACE = {
  phonics: "alphabet",
  tutor: "tutor",
  speak: "tutor",
  flashcards: "flashcards",
};

function hasVisibleChakraModalSurface() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }
  return Array.from(
    document.querySelectorAll(
      ".chakra-modal__content-container, .chakra-modal__overlay",
    ),
  ).some((element) => {
    const style = window.getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      element.getAttribute("aria-hidden") !== "true"
    );
  });
}

function getRandomLoadingOrbState() {
  return LOADING_ORB_STATES[
    Math.floor(Math.random() * LOADING_ORB_STATES.length)
  ];
}

function LoadingOrbFallback({ minH = "420px", bg }) {
  const orbState = useMemo(getRandomLoadingOrbState, []);

  return (
    <Flex
      minH={minH}
      bg={bg}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={6}
    >
      <VoiceOrb state={orbState} size={88} />
    </Flex>
  );
}

// Quiet placeholder for the rare paths that reach the game view before the
// client chunk is resolved (e.g. the ?episode= dev harness). The launch flow
// never shows this: the component is awaited before the view flips. Uses
// pulsing dots rather than the voice orb so it reads as the game loading, not
// a voice surface.
function GameLoadingFallback({ minH = "420px" }) {
  return (
    <Flex
      minH={minH}
      h="100%"
      w="100%"
      alignItems="center"
      justifyContent="center"
      gap={2}
      role="status"
    >
      {[0, 1, 2].map((dot) => (
        <Box
          key={dot}
          w="10px"
          h="10px"
          borderRadius="full"
          bg="blue.200"
          sx={{
            animation: `gameLoadingPulse 1.1s ease-in-out ${dot * 0.16}s infinite`,
            "@keyframes gameLoadingPulse": {
              "0%, 100%": { opacity: 0.3, transform: "translateY(0)" },
              "50%": { opacity: 1, transform: "translateY(-4px)" },
            },
          }}
        />
      ))}
    </Flex>
  );
}

// Same interactive mini-map and rotating progress copy shown while optimized
// RPG review lessons prepare. The tutorial uses it only when its background
// preparation has not finished by the time the learner reaches the game step.
function TutorialGameLoadingFallback({ supportLang = "en" }) {
  const messages =
    GAME_LOADING_MESSAGES[supportLang] || GAME_LOADING_MESSAGES.en;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 1500);
    return () => window.clearInterval(interval);
  }, [messages]);

  return (
    <Box display="flex" flexDirection="column" h="100%" overflow="hidden">
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={2}
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 4 }}
        bgGradient="linear(to-b, rgba(10, 13, 27, 0.96), rgba(10, 13, 27, 0.72), transparent)"
      >
        <Text
          fontSize={{ base: "sm", md: "md" }}
          color="blue.100"
          minH="24px"
          key={messageIndex}
          fontFamily="monospace"
          sx={{
            animation: "fadeIn 0.4s ease-in-out",
            "@keyframes fadeIn": {
              "0%": { opacity: 0, transform: "translateY(-4px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {messages[messageIndex]}
        </Text>
      </Box>
      <Box flex="1" overflow="hidden" position="relative">
        <Suspense fallback={<GameLoadingFallback minH="100dvh" />}>
          <LoadingMiniGame supportLang={supportLang} />
        </Suspense>
      </Box>
    </Box>
  );
}

const personaDefaultFor = (lang) =>
  translations?.[lang]?.DEFAULT_PERSONA ||
  translations?.[lang]?.onboarding_persona_default_example ||
  translations?.en?.onboarding_persona_default_example ||
  "";

const normalizePersonaValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!]+$/g, "")
    .toLocaleLowerCase();

const isDefaultPersonaValue = (value) => {
  if (value === undefined || value === null) return true;
  const normalized = normalizePersonaValue(value);
  if (!normalized) return false;
  return ["en", "es", "pt", "it", "fr", "de", "ja", "hi", "ar", "zh"].some(
    (lang) =>
      normalized ===
        normalizePersonaValue(translations?.[lang]?.DEFAULT_PERSONA) ||
      normalized ===
        normalizePersonaValue(
          translations?.[lang]?.onboarding_persona_default_example,
        ),
  );
};

const personaForSupportLanguage = (currentPersona, supportLang) => {
  if (currentPersona === undefined || currentPersona === null) {
    return personaDefaultFor(supportLang) || "";
  }
  if (!isDefaultPersonaValue(currentPersona)) return currentPersona;
  return personaDefaultFor(supportLang) || currentPersona || "";
};

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
  zh: "Mandarin Chinese",
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
const uiCopy = (lang, copy) => {
  const normalized = normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE);
  if (copy[normalized]) return copy[normalized];
  if (normalized === "de") return getGermanCopy(copy.en) || copy.en;
  return copy.en;
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

// A single custom-drawn 4-point sparkle (soft concave star) — used instead
// of an emoji so it can be colored, glowed, and animated precisely.
function SparkleShape({ size = 16, color = "#ffffff" }) {
  return (
    <Box
      as="svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      display="block"
      sx={{ filter: `drop-shadow(0 0 2px ${color}55)` }}
      aria-hidden="true"
    >
      <path
        d="M12 0 Q13.4 10.6 24 12 Q13.4 13.4 12 24 Q10.6 13.4 0 12 Q10.6 10.6 12 0 Z"
        fill={color}
      />
    </Box>
  );
}

// Wraps a celebratory element (e.g. the quest-complete character) with a
// ring of twinkling custom sparkles. The keyframe is defined once on the
// wrapper; each sparkle references it by name with a staggered delay.
function SparkleFrame({ children }) {
  // A handful of sparkles in a balanced ring around the character. Same
  // shape and gentle twinkle for all — just staggered so they shimmer in
  // turn. Positions jitter a little per mount.
  const sparkles = useMemo(() => {
    const count = 6;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360 + (Math.random() * 18 - 9);
      const radius = 48 + Math.random() * 6;
      const rad = (angle * Math.PI) / 180;
      return {
        top: `${(50 + radius * Math.sin(rad)).toFixed(1)}%`,
        left: `${(50 + radius * Math.cos(rad)).toFixed(1)}%`,
        size: 5 + Math.round(Math.random() * 2), // 5–7px
        delay: `${(i * 0.45).toFixed(2)}s`,
      };
    });
  }, []);

  return (
    <Box
      position="relative"
      display="inline-flex"
      sx={{
        "@keyframes sparkleTwinkle": {
          "0%, 100%": { opacity: 0, transform: "scale(0.4) rotate(0deg)" },
          "50%": { opacity: 0.85, transform: "scale(1) rotate(45deg)" },
        },
      }}
    >
      {children}
      {sparkles.map((sparkle, index) => (
        <Box
          key={index}
          position="absolute"
          top={sparkle.top}
          left={sparkle.left}
          transform="translate(-50%, -50%)"
          pointerEvents="none"
          aria-hidden="true"
        >
          {/* Inner element animates so the keyframe's transform doesn't
              clobber the centering translate above. */}
          <Box
            sx={{
              animation: `sparkleTwinkle 2.4s ease-in-out ${sparkle.delay} infinite`,
            }}
          >
            <SparkleShape size={sparkle.size} />
          </Box>
        </Box>
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
  const localCompletion = getLocalOnboardingCompletion(id);
  const persistedCompletion = getPersistedOnboardingCompletion(data);
  const completionRecovery = localCompletion || persistedCompletion;
  const shouldRestoreCompletion =
    Boolean(completionRecovery) && !hasCompletedOnboarding(data);

  const shouldSetDefaults = !hasCompleted && !hasLegacyTopLevel;
  const shouldSetStep = !hasStep;

  if (shouldSetDefaults || shouldSetStep || shouldRestoreCompletion) {
    const onboardingPayload = {
      ...(hasNested ? data.onboarding : {}),
    };

    if (shouldRestoreCompletion) {
      onboardingPayload.completed = true;
      onboardingPayload.completedAt =
        onboardingPayload.completedAt || completionRecovery.completedAt;
    } else if (shouldSetDefaults && !hasCompleted) {
      // The doc has no onboarding flag. Treat it as a pre-onboarding "legacy"
      // account (already onboarded) ONLY when there's real evidence of prior
      // use; otherwise it's a fresh/partial doc and onboarding must still run.
      // Previously this always assumed completed=true, which silently skipped
      // onboarding whenever any other write created the user doc before
      // connectDID got to set completed=false.
      const looksUsed = Boolean(
        hasPersistedOnboardingProfile(data) ||
        Number(data?.xp) > 0 ||
        Number(data?.progress?.xp) > 0 ||
        Number(data?.streak) > 0 ||
        (Array.isArray(data?.completedGoalDates) &&
          data.completedGoalDates.length > 0) ||
        (data?.dailyXpHistory &&
          typeof data.dailyXpHistory === "object" &&
          Object.keys(data.dailyXpHistory).length > 0) ||
        (data?.dailyXpRecent &&
          typeof data.dailyXpRecent === "object" &&
          Object.keys(data.dailyXpRecent).length > 0),
      );
      if (!looksUsed) {
        console.warn(
          "[ONBOARDING] users doc had no onboarding flag and no prior-use " +
            "signals; keeping onboarding pending. doc keys:",
          Object.keys(data || {}),
        );
      }
      onboardingPayload.completed = looksUsed;
    }

    if (shouldSetStep) {
      const existing = Number(onboardingPayload.currentStep);
      onboardingPayload.currentStep = Number.isFinite(existing) ? existing : 1;
    }

    await setDoc(
      doc(db, "users", id),
      // Including the document's npub also lets Firestore repair legacy user
      // documents that predate the local_npub field required by current rules.
      { local_npub: id, onboarding: onboardingPayload },
      { merge: true },
    );
    const snap = await getDoc(doc(db, "users", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : data;
  }
  return data;
}

function addLanguageLessonProgress(map, data) {
  if (!data?.targetLang || !data?.lessonId) return;
  const targetLang = String(data.targetLang).toLowerCase();
  if (!map[targetLang]) map[targetLang] = {};
  map[targetLang][data.lessonId] = {
    ...(map[targetLang][data.lessonId] || {}),
    ...data,
  };
}

function mergeLanguageLessonProgressMaps(...maps) {
  return maps.reduce((merged, map) => {
    if (!map || typeof map !== "object") return merged;
    Object.entries(map).forEach(([lang, lessons]) => {
      if (!lessons || typeof lessons !== "object") return;
      if (!merged[lang]) merged[lang] = {};
      Object.entries(lessons).forEach(([lessonId, data]) => {
        merged[lang][lessonId] = {
          ...(merged[lang][lessonId] || {}),
          ...data,
        };
      });
    });
    return merged;
  }, {});
}

function isLegacyTutorLessonProgress(data) {
  return !!data?.tutorAgendaProgress;
}

async function loadUserObjectFromDB(db, id) {
  if (!id) return null;
  const ref = doc(db, "users", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  // A confirmed missing root document is the only case that may return null.
  // Bootstrap uses null to create a new user, so optional hydration failures
  // must not be allowed to reset an existing user's onboarding state.
  let userData = await ensureOnboardingField(db, id, {
    id: snap.id,
    ...snap.data(),
  });

  try {
    userData = (await migrateUserToSchemaV2(db, id, userData)) || userData;
  } catch (error) {
    console.warn(
      "User data migration failed; using the compatible legacy shape:",
      error,
    );
  }

  if (!userData.progress || typeof userData.progress !== "object") {
    userData.progress = {};
  }

  try {
    const activeTargetLang = String(
      userData?.progress?.targetLang || userData?.targetLang || "es",
    ).toLowerCase();
    const [
      languageLessonsSnapshot,
      tutorLanguageLessonsSnapshot,
      languageFlashcardsSnapshot,
    ] = await Promise.all([
      getDocs(
        query(
          collection(db, "users", id, "languageLessons"),
          where("targetLang", "==", activeTargetLang),
        ),
      ),
      getDocs(
        query(
          collection(db, "users", id, "tutorLanguageLessons"),
          where("targetLang", "==", activeTargetLang),
        ),
      ),
      getDocs(
        query(
          collection(db, "users", id, "languageFlashcards"),
          where("targetLang", "==", activeTargetLang),
        ),
      ),
    ]);

    const languageLessons = {};
    const legacyTutorLanguageLessons = {};
    languageLessonsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (isLegacyTutorLessonProgress(data)) {
        addLanguageLessonProgress(legacyTutorLanguageLessons, data);
        return;
      }
      addLanguageLessonProgress(languageLessons, data);
    });

    const tutorLanguageLessons = mergeLanguageLessonProgressMaps(
      legacyTutorLanguageLessons,
    );
    tutorLanguageLessonsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      addLanguageLessonProgress(tutorLanguageLessons, data);
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

    // Use subcollections as the canonical source of truth for lesson/flashcard progress.
    // This intentionally ignores any legacy nested progress JSON fields.
    userData.progress.languageLessons = languageLessons;
    userData.progress.tutorLanguageLessons = tutorLanguageLessons;
    userData.progress.languageFlashcards = languageFlashcards;

    return userData;
  } catch (e) {
    console.warn(
      "Progress hydration failed; continuing with the root user document:",
      e,
    );
    return userData;
  }
}

// Disables Chakra's exit animation on menus so the menu disappears
// immediately on select; enter animation is left at Chakra's default.
const INSTANT_EXIT_MOTION_PROPS = {
  variants: {
    enter: {
      visibility: "visible",
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.15,
        ease: [0, 0, 0.2, 1],
      },
    },
    exit: {
      transitionEnd: { visibility: "hidden" },
      opacity: 0,
      scale: 1,
      transition: { duration: 0 },
    },
  },
};

/* -------------------------------------------------------------------------------------------------
   Top Bar
--------------------------------------------------------------------------------------------------*/
function getTodayDailyXpFromHistory(history = {}) {
  const todayKey = getLocalDayKey(new Date());
  if (!todayKey || !history || typeof history !== "object") return 0;
  const todayXp = Number(history[todayKey]);
  return Number.isFinite(todayXp) ? todayXp : 0;
}

function getEffectiveDailyXpToday(data = {}) {
  const rawXp =
    data?.dailyXp ?? data?.stats?.dailyXp ?? data?.progress?.dailyXp;
  const parsedXp = Number(rawXp);
  const directXp = Number.isFinite(parsedXp) ? parsedXp : 0;
  const historyXp = getTodayDailyXpFromHistory(
    data?.dailyXpRecent || data?.dailyXpHistory,
  );
  return Math.max(directXp, historyXp);
}

function getEffectiveDailyGoalXp(data = {}, fallback = 100) {
  const rawGoal =
    data?.dailyGoalXp ??
    data?.progress?.dailyGoalXp ??
    data?.stats?.dailyGoalXp;
  const parsedGoal = Number(rawGoal);
  if (Number.isFinite(parsedGoal) && parsedGoal > 0) return parsedGoal;
  const parsedFallback = Number(fallback);
  return Number.isFinite(parsedFallback) && parsedFallback > 0
    ? parsedFallback
    : 0;
}

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
  hasTimer,
  isTimerRunning,
  timerPaused,
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
  // 🆕 tutor volume props
  tutorVolume,
  onTutorVolumeChange,
  onTutorVolumeSave,
  playSound,
  // 🆕 mobile detection prop
  isMobile,
  postNostrContent,
  onSupportLangChange,
  pendingLangRef,
  subscriptionVerified = false,
}) {
  const playSliderTick = useSoundSettings((s) => s.playSliderTick);
  const toast = useToast();
  const navigate = useNavigate();
  const t = translations[appLanguage] || translations.en;
  const isRtlApp = getLanguageDirection(appLanguage) === "rtl";
  const themeMode = useThemeStore((s) => s.themeMode);
  const syncThemeMode = useThemeStore((s) => s.syncThemeMode);
  const [settingsTabIndex, setSettingsTabIndex] = useState(0);
  // Defer mounting the heavy settings body until after the open animation has
  // started painting. On iOS Safari, mounting the full drawer tree in the same
  // commit as the open transition blocks the first frame for several seconds.
  const [settingsBodyReady, setSettingsBodyReady] = useState(false);
  useEffect(() => {
    if (!settingsOpen) {
      setSettingsBodyReady(false);
      return undefined;
    }
    // Two RAFs: first frame paints the (empty) drawer, second frame begins
    // mounting children so the open animation actually shows.
    let outer = 0;
    let inner = 0;
    outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSettingsBodyReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, [settingsOpen]);
  const settingsSwipeDismiss = useBottomDrawerSwipeDismiss({
    isOpen: settingsOpen,
    onClose: closeSettings,
  });

  // ---- Local draft state (no autosave) ----
  const p = user?.progress || {};
  const [level, setLevel] = useState(migrateToCEFRLevel(p.level) || "Pre-A1");
  const [supportLang, setSupportLang] = useState(
    normalizeSupportLanguage(p.supportLang, DEFAULT_SUPPORT_LANGUAGE),
  );
  const [tutorVoice, setTutorVoice] = useState(
    normalizeTutorVoice(p.tutorVoice || p.voice),
  );
  const defaultPersonaSupportLang = p.supportLang || supportLang || appLanguage;
  const defaultPersona =
    personaForSupportLanguage(
      p.tutorVoicePersona ?? p.voicePersona,
      defaultPersonaSupportLang,
    ) ??
    personaDefaultFor(defaultPersonaSupportLang) ??
    translations.en.onboarding_persona_default_example;
  const [voicePersona, setVoicePersona] = useState(defaultPersona);
  const [targetLang, setTargetLang] = useState(
    normalizePracticeLanguage(p.targetLang, DEFAULT_TARGET_LANGUAGE),
  );
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
    Number.isFinite(p.pauseMs) ? p.pauseMs : DEFAULT_VOICE_PAUSE_MS,
  );
  const [helpRequest, setHelpRequest] = useState(
    p.helpRequest ?? user?.helpRequest ?? "",
  );
  const [practicePronunciation, setPracticePronunciation] = useState(
    !!p.practicePronunciation,
  );
  const textDraftRef = useRef({ voicePersona: null, helpRequest: null });
  const textDraftClearTimersRef = useRef({});
  const rememberTextDraft = useCallback((key, value) => {
    clearTimeout(textDraftClearTimersRef.current[key]);
    textDraftRef.current[key] = { value, at: Date.now() };
  }, []);
  const releaseTextDraftSoon = useCallback((key, value) => {
    clearTimeout(textDraftClearTimersRef.current[key]);
    textDraftClearTimersRef.current[key] = setTimeout(() => {
      const draft = textDraftRef.current[key];
      if (draft && draft.value === value) {
        textDraftRef.current[key] = null;
      }
    }, 6000);
  }, []);
  const preferTextDraft = useCallback((key, savedValue) => {
    const draft = textDraftRef.current[key];
    return draft ? draft.value : savedValue;
  }, []);
  useEffect(
    () => () => {
      Object.values(textDraftClearTimersRef.current).forEach(clearTimeout);
    },
    [],
  );
  const vadSecondsLabel = uiCopy(appLanguage, {
    en: "seconds",
    es: "segundos",
    pt: "segundos",
    it: "secondi",
    fr: "secondes",
    de: "Sekunden",
    ja: "秒",
    ar: "ثواني",
    zh: "秒",
    hi: "सेकंड",
  });
  const pauseSeconds = new Intl.NumberFormat(getLanguageLocale(appLanguage), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(pauseMs / 1000);
  const vadHint =
    t.onboarding_vad_hint ||
    uiCopy(appLanguage, {
      en: "Shorter = more responsive; longer = gives you time to finish speaking. 0.6 seconds is recommended for a quick response.",
      es: "Más corta = más sensible; más larga = te deja terminar de hablar. 0.6 segundos es lo recomendado para una respuesta rápida.",
      pt: "Mais curta = mais responsiva; mais longa = dá tempo para terminar de falar. 0,6 segundos é o recomendado para uma resposta rápida.",
      it: "Più breve = più reattiva; più lunga = ti lascia finire di parlare. 0,6 secondi è consigliato per una risposta rapida.",
      fr: "Plus court = plus reactif ; plus long = te laisse finir de parler. 0,6 seconde est recommande pour une reponse rapide.",
      de: "Kürzer = reaktionsschneller; länger = gibt dir Zeit, auszusprechen. 0,6 Sekunden werden für eine schnelle Antwort empfohlen.",
      ja: "短いほど反応が速く、長いほど話し終える時間ができます。素早い応答には0.6秒がおすすめです。",
      ar: "الأقصر = استجابة أسرع؛ الأطول = يديك وقت تخلص كلامك. ٠٫٦ ثانية مناسب لرد سريع.",
      zh: "更短 = 反应更快；更长 = 给你更多时间说完。快速回应建议 0.6 秒。",
    });

  // Japanese is visible for everyone (beta label applied in UI)
  const showJapanese = true;

  const supportLanguageOptions = useMemo(
    () => getSupportLanguageOptions({ ui: t, uiLang: appLanguage }),
    [appLanguage, t],
  );

  const practiceLanguageOptions = useMemo(
    () =>
      getPracticeLanguageOptions({
        ui: t,
        uiLang: appLanguage,
        showJapanese,
      }),
    [appLanguage, showJapanese, t],
  );
  const selectedSupportOption =
    supportLanguageOptions.find(
      (option) => option.value === normalizeSupportLanguage(supportLang),
    ) || supportLanguageOptions[0];
  const selectedPracticeOption =
    practiceLanguageOptions.find((option) => option.value === targetLang) ||
    practiceLanguageOptions[0];

  // Refill draft when store changes
  useEffect(() => {
    const q = user?.progress || {};
    setLevel(migrateToCEFRLevel(q.level) || "Pre-A1");
    const incomingLang = normalizeSupportLanguage(
      q.supportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    if (!pendingLangRef.current || incomingLang === pendingLangRef.current) {
      setSupportLang(incomingLang);
    }
    setTutorVoice(normalizeTutorVoice(q.tutorVoice || q.voice));
    const draftSupportLang =
      pendingLangRef.current || incomingLang || supportLang || appLanguage;
    const nextVoicePersona =
      personaForSupportLanguage(
        q.tutorVoicePersona ?? q.voicePersona,
        draftSupportLang,
      ) ??
      personaDefaultFor(draftSupportLang) ??
      translations.en.onboarding_persona_default_example;
    setVoicePersona(preferTextDraft("voicePersona", nextVoicePersona));
    setTargetLang(
      normalizePracticeLanguage(q.targetLang, DEFAULT_TARGET_LANGUAGE),
    );
    setShowTranslations(
      typeof q.showTranslations === "boolean" ? q.showTranslations : true,
    );
    setPauseMs(Number.isFinite(q.pauseMs) ? q.pauseMs : DEFAULT_VOICE_PAUSE_MS);
    const nextHelpRequest = String(q.helpRequest ?? user?.helpRequest ?? "");
    setHelpRequest(preferTextDraft("helpRequest", nextHelpRequest));
    setPracticePronunciation(!!q.practicePronunciation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.progress, user?.helpRequest]);

  useEffect(() => {
    const localizedDefault = personaDefaultFor(supportLang || appLanguage);
    const current = (voicePersona || "").trim();

    if (
      isDefaultPersonaValue(current) &&
      localizedDefault &&
      current !== localizedDefault
    ) {
      setVoicePersona(localizedDefault);
      persistSettings({ tutorVoicePersona: localizedDefault });
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
          title: uiCopy(appLanguage, {
            en: "Save failed",
            es: "Error al guardar",
            it: "Salvataggio non riuscito",
            ja: "保存に失敗しました",
            zh: "保存失败",
          }),
          description: String(e?.message || e),
        });
      }
    },
    [onPatchSettings, toast, appLanguage],
  );
  const persistSettingsAfterPaint = useCallback(
    (partial = {}) => {
      const run = () => {
        void persistSettings(partial);
      };

      if (typeof window === "undefined" || !window.requestAnimationFrame) {
        setTimeout(run, 0);
        return;
      }

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(run);
      });
    },
    [persistSettings],
  );

  // Debounced persist for text inputs (tutorVoicePersona, helpRequest)
  const debounceRef = useRef(null);
  const debouncedPersist = useCallback(
    (partial, delay = 400) => {
      clearTimeout(debounceRef.current);
      const textDrafts = [];
      if (Object.prototype.hasOwnProperty.call(partial, "tutorVoicePersona")) {
        textDrafts.push({
          key: "voicePersona",
          value: partial.tutorVoicePersona,
        });
      }
      if (Object.prototype.hasOwnProperty.call(partial, "helpRequest")) {
        textDrafts.push({ key: "helpRequest", value: partial.helpRequest });
      }
      debounceRef.current = setTimeout(() => {
        void persistSettings(partial).finally(() => {
          textDrafts.forEach(({ key, value }) =>
            releaseTextDraftSoon(key, value),
          );
        });
      }, delay);
    },
    [persistSettings, releaseTextDraftSoon],
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
          title: uiCopy(appLanguage, {
            en: "Save failed",
            es: "Error al guardar",
            it: "Salvataggio non riuscito",
            ja: "保存に失敗しました",
            zh: "保存失败",
          }),
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

      if (
        Number(data?.schemaVersion || 1) < 2 ||
        data?.dailyQuestBlueprint ||
        data?.dailyQuestRepair ||
        data?.dailyQuestExplanations ||
        data?.dailyXpHistory ||
        data?.completedGoalDates ||
        data?.companionMemory
      ) {
        void migrateUserToSchemaV2(database, activeNpub).catch((error) => {
          console.warn("Deferred user data cleanup failed:", error);
        });
      }

      try {
        const companionPatch = {};
        if (data?.companionUnlocksCelebrated)
          companionPatch.companionUnlocksCelebrated =
            data.companionUnlocksCelebrated;
        if (Object.keys(companionPatch).length) {
          useUserStore.getState().patchUser?.(companionPatch);
        }
      } catch {
        /* non-fatal: the plate re-derives on the next snapshot */
      }

      const goal = getEffectiveDailyGoalXp(data);
      let resetISO = data?.dailyResetAt || null;
      const completedDates = Array.isArray(data?.completedGoalDates)
        ? data.completedGoalDates
        : [];
      const xpHistory =
        data?.dailyXpRecent && typeof data.dailyXpRecent === "object"
          ? data.dailyXpRecent
          : data?.dailyXpHistory && typeof data.dailyXpHistory === "object"
            ? data.dailyXpHistory
            : {};
      let dxp = getEffectiveDailyXpToday({
        ...data,
        dailyXpRecent: xpHistory,
      });

      const expired = hasDailyGoalResetExpired(resetISO);
      // Catch up pet health for any whole days missed since it was last
      // reflected — even when the 24h window hasn't rolled over. This is what
      // recovers a long absence whose dailyResetAt was already bumped forward
      // by an earlier app-open (so `expired` reads false today).
      const missedDays = countMissedDailyGoalWindows(data, new Date());
      if (goal > 0 && (expired || missedDays > 0)) {
        try {
          await runTransaction(database, async (tx) => {
            const latestSnap = await tx.get(ref);
            const latestData = latestSnap.exists() ? latestSnap.data() : {};
            const latestExpired = hasDailyGoalResetExpired(
              latestData?.dailyResetAt,
            );
            const latestMissed = countMissedDailyGoalWindows(
              latestData,
              new Date(),
            );
            // Another writer (or an earlier fire) may have already handled it.
            if (!latestExpired && latestMissed <= 0) return;

            tx.set(
              ref,
              {
                ...buildDailyGoalResetFields(latestData, new Date(), {
                  // Only roll the daily window when it actually expired;
                  // otherwise just reconcile health and leave today's XP alone.
                  resetWindow: latestExpired,
                }),
                updatedAt: new Date().toISOString(),
              },
              { merge: true },
            );
          });
        } catch (error) {
          console.warn("Failed to apply daily goal reset:", error);
        }
        if (expired) {
          dxp = getTodayDailyXpFromHistory(xpHistory);
          resetISO = data?.dailyResetAt || resetISO;
        }
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

  // Sync local dailyXp/dailyGoalXp from the user prop so XP awarded via
  // setUser(fresh) — e.g. from the immersion drawer reward claim — updates
  // the progress bar immediately without waiting for the Firestore
  // onSnapshot round-trip.
  useEffect(() => {
    setDailyXp(getEffectiveDailyXpToday(user || {}));
    const goal = getEffectiveDailyGoalXp(user || {});
    if (Number.isFinite(goal)) setDailyGoalXp(goal);
  }, [
    user?.dailyXp,
    user?.dailyGoalXp,
    user?.dailyXpRecent,
    user?.dailyXpHistory,
    user?.progress?.dailyGoalXp,
    user?.progress?.dailyXp,
    user?.stats?.dailyGoalXp,
    user?.stats?.dailyXp,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleLocalDailyXpAwarded = (event) => {
      const detail = event?.detail || {};
      const eventNpub = typeof detail.npub === "string" ? detail.npub : "";
      if (eventNpub && activeNpub && eventNpub !== activeNpub) return;

      const nextDailyXp = Number(detail.dailyXp);
      const amount = Number(detail.amount);
      const nextGoal = Number(detail.dailyGoalXp);

      if (Number.isFinite(nextDailyXp)) {
        setDailyXp((prev) => Math.max(Number(prev) || 0, nextDailyXp));
      } else if (Number.isFinite(amount) && amount > 0) {
        setDailyXp((prev) => (Number(prev) || 0) + amount);
      }

      if (Number.isFinite(nextGoal)) {
        setDailyGoalXp(nextGoal);
      }
    };

    window.addEventListener(
      "daily-goal:localXpAwarded",
      handleLocalDailyXpAwarded,
    );
    return () =>
      window.removeEventListener(
        "daily-goal:localXpAwarded",
        handleLocalDailyXpAwarded,
      );
  }, [activeNpub]);

  const dailyRawPct =
    dailyGoalXp > 0
      ? Math.max(0, Math.round((dailyXp / dailyGoalXp) * 100))
      : 0;
  const dailyDone = dailyGoalXp > 0 && dailyXp >= dailyGoalXp;
  // Daily XP HUD tiers: reward blue (light) / teal (dark) at 100%+,
  // purple past 50%, neutral gray below.
  const dailyGoalHudColor =
    dailyRawPct >= 100
      ? themeMode === "light"
        ? "#39BFD1"
        : "#2dd4bf"
      : dailyRawPct > 50
        ? themeMode === "light"
          ? "#6d28d9"
          : "#b794f4"
        : themeMode === "light"
          ? "#4b5563"
          : "whiteAlpha.700";
  const dailyGoalLabel = uiCopy(appLanguage, {
    en: "Daily XP",
    es: "XP diaria",
    pt: "XP diária",
    fr: "XP du jour",
    it: "XP giornaliera",
    de: "Tägliche XP",
    ja: "今日のXP",
    zh: "每日 XP",
    ru: "Ежедневный XP",
    ar: "XP اليومية",
    hi: "दैनिक XP",
  });

  const cefrTimestamp =
    cefrResult?.updatedAt &&
    new Date(cefrResult.updatedAt).toLocaleString(getSortLocale(appLanguage));

  // The iOS freeze came from the heavy SkillTree mode surface underneath the
  // overlay, not from the click sound itself. Keep the familiar feedback.
  const topBarPointerActionKeyRef = useRef(null);
  const runTopBarAction = useCallback(
    (action) => {
      if (!action) return;
      try {
        void playSound?.(selectSound);
      } catch (error) {
        console.warn("Failed to play top bar sound:", error);
      }
      action();
    },
    [playSound],
  );

  const getTopBarPressProps = useCallback(
    (key, action) => {
      const shouldOpenOnPointerDown =
        key === "daily-goal" || key === "session-timer";

      return {
        touchAction: "manipulation",
        cursor: "pointer",
        onPointerDown: shouldOpenOnPointerDown
          ? (event) => {
              if (event.button != null && event.button !== 0) return;
              event.preventDefault();
              topBarPointerActionKeyRef.current = key;
              runTopBarAction(action);

              if (typeof window !== "undefined") {
                window.setTimeout(() => {
                  if (topBarPointerActionKeyRef.current === key) {
                    topBarPointerActionKeyRef.current = null;
                  }
                }, 350);
              }
            }
          : undefined,
        onClick: () => {
          if (topBarPointerActionKeyRef.current === key) {
            topBarPointerActionKeyRef.current = null;
            return;
          }
          runTopBarAction(action);
        },
      };
    },
    [runTopBarAction],
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
            pt="calc(env(safe-area-inset-top, 0px) + 0.5rem)"
            pb={2}
            color="gray.100"
            wrap="wrap"
            spacing={{ base: 2, md: 3 }}
          >
            {/* LEFT: Daily Goal button + Daily XP status */}
            <HStack
              spacing={{ base: 1, md: 1.5 }}
              minW={0}
              flex="1 1 auto"
              align="center"
            >
              <IconButton
                size="sm"
                variant="outline"
                colorScheme="teal"
                icon={dailyDone ? <FaCalendarCheck /> : <FaCalendarAlt />}
                aria-label={uiCopy(appLanguage, {
                  en: "Open daily goal",
                  es: "Abrir meta diaria",
                  it: "Apri obiettivo giornaliero",
                  ja: "デイリー目標を開く",
                  zh: "打开每日目标",
                })}
                borderColor="teal.600"
                px={{ base: 2, md: 3 }}
                _active={{ transform: "none" }}
                {...getTopBarPressProps("daily-goal", onOpenDailyGoalModal)}
              />
              <HStack
                spacing={{ base: 0.5, md: 0.5 }}
                h="34px"
                minW={0}
                px={0}
                align="center"
                color={dailyGoalHudColor}
                title={`${dailyGoalLabel}: ${dailyRawPct}%`}
              >
                <Box
                  as={MdShowChart}
                  boxSize={{ base: 4, md: 4.5 }}
                  flexShrink={0}
                />
                <Text
                  fontSize={{ base: "xs", md: "xs" }}
                  fontWeight="bold"
                  lineHeight="1"
                  whiteSpace="nowrap"
                  maxW={{ base: "92px", sm: "140px", md: "none" }}
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {dailyGoalLabel}:
                </Text>
                <Text
                  fontSize={{ base: "xs", md: "xs" }}
                  fontWeight="bold"
                  lineHeight="1"
                  fontVariantNumeric="tabular-nums"
                  whiteSpace="nowrap"
                >
                  {dailyRawPct}%
                </Text>
              </HStack>
            </HStack>

            <Spacer display={{ base: "none", md: "block" }} />

            {/* RIGHT: controls */}
            <HStack
              spacing={{ base: 1, md: 2 }}
              flexShrink={0}
              ml="auto"
              align="center"
            >
              {hasTimer && <SessionTimerBadge isRunning={isTimerRunning} />}
              <Button
                colorScheme="teal"
                variant={isTimerRunning ? "solid" : "outline"}
                size="sm"
                boxShadow={isTimerRunning ? "none" : undefined}
                aria-label={uiCopy(appLanguage, {
                  en: "Open timer",
                  es: "Abrir temporizador",
                  it: "Apri timer",
                  ja: "タイマーを開く",
                  zh: "打开计时器",
                })}
                _hover={isTimerRunning ? { boxShadow: "none" } : undefined}
                _active={{ boxShadow: "none", transform: "none" }}
                {...getTopBarPressProps("session-timer", onOpenTimerModal)}
              >
                <FiClock />
              </Button>
              {hasTimer && (
                <Button
                  colorScheme="teal"
                  variant={timerPaused ? "outline" : "ghost"}
                  size="sm"
                  aria-label={
                    timerPaused
                      ? uiCopy(appLanguage, {
                          en: "Resume timer",
                          es: "Reanudar temporizador",
                          it: "Riprendi timer",
                          ja: "タイマーを再開",
                          zh: "继续计时器",
                        })
                      : uiCopy(appLanguage, {
                          en: "Pause timer",
                          es: "Pausar temporizador",
                          it: "Metti in pausa il timer",
                          ja: "タイマーを一時停止",
                          zh: "暂停计时器",
                        })
                  }
                  {...getTopBarPressProps(
                    "session-timer-toggle",
                    onTogglePauseTimer,
                  )}
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
        {/* Drawers intentionally have no overlay (overlays are modal-only). */}
        <DrawerContent
          {...settingsSwipeDismiss.drawerContentProps}
          motionProps={nativeAnchoredDrawerMotionProps}
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
          <DrawerBody
            pb={6}
            display="flex"
            flexDirection="column"
            flex={1}
            minH={0}
          >
            <Flex
              justify={isRtlApp ? "flex-start" : "flex-end"}
              mt={-2}
              mb={-2}
            >
              <IconButton
                aria-label={t.close || t.app_close || "Close"}
                icon={<CloseIcon boxSize={3} />}
                size="sm"
                variant="ghost"
                color="var(--app-text-muted)"
                _hover={{
                  color: "var(--app-text-primary)",
                  bg: "gray.800",
                }}
                onClick={closeSettings}
              />
            </Flex>
            {settingsBodyReady ? (
              <Tabs
                index={settingsTabIndex}
                onChange={setSettingsTabIndex}
                variant="unstyled"
                display="flex"
                flexDirection="column"
                flex={1}
                minH={0}
                isLazy
                lazyBehavior="keepMounted"
              >
                <Box maxW="600px" mx="auto" w="100%">
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
                        bgGradient: "linear(to-r, cyan.300, teal.400)",
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
                        bgGradient: "linear(to-r, cyan.300, teal.400)",
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
                              <MenuList
                                borderColor="gray.700"
                                bg="gray.900"
                                maxH="300px"
                                overflowY="auto"
                                motionProps={INSTANT_EXIT_MOTION_PROPS}
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
                                    .onboarding_support_menu_label ||
                                    "Support:"}
                                </Box>
                                <MenuOptionGroup
                                  type="radio"
                                  value={supportLang}
                                  onChange={(value) => {
                                    const normalized = normalizeSupportLanguage(
                                      value,
                                      DEFAULT_SUPPORT_LANGUAGE,
                                    );
                                    playSound(selectSound);
                                    const shouldLocalizePersona =
                                      isDefaultPersonaValue(voicePersona);
                                    const nextPersona = shouldLocalizePersona
                                      ? personaForSupportLanguage(
                                          voicePersona,
                                          normalized,
                                        )
                                      : voicePersona;
                                    if (
                                      shouldLocalizePersona &&
                                      nextPersona &&
                                      nextPersona !== voicePersona
                                    ) {
                                      setVoicePersona(nextPersona);
                                    }
                                    onSupportLangChange?.(
                                      normalized,
                                      setSupportLang,
                                    );
                                    persistSettingsAfterPaint({
                                      supportLang: normalized,
                                      ...(shouldLocalizePersona && nextPersona
                                        ? { tutorVoicePersona: nextPersona }
                                        : {}),
                                    });
                                  }}
                                >
                                  {supportLanguageOptions.map((option) => (
                                    <MenuItemOption
                                      key={option.value}
                                      value={option.value}
                                      padding={5}
                                      onPointerDown={() =>
                                        playSound(selectSound)
                                      }
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
                                  </Text>
                                </HStack>
                              </MenuButton>
                              <MenuList
                                borderColor="gray.700"
                                bg="gray.900"
                                maxH="300px"
                                overflowY="auto"
                                motionProps={INSTANT_EXIT_MOTION_PROPS}
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
                                    persistSettingsAfterPaint({
                                      targetLang: value,
                                    });
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
                                        <Text as="span">{option.label}</Text>
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
                            borderColor={
                              themeMode === "light" ? "cyan.700" : "cyan.600"
                            }
                            color={
                              themeMode === "light" ? "cyan.800" : "cyan.200"
                            }
                            padding={6}
                            _hover={{
                              bg:
                                themeMode === "light" ? "cyan.50" : "cyan.900",
                            }}
                            onClick={() => {
                              closeSettings();
                              navigate("/proficiency");
                            }}
                            mt={4}
                          >
                            {uiCopy(appLanguage, {
                              en: "Start proficiency test",
                              es: "Iniciar prueba de nivel",
                              pt: "Iniciar teste de nível",
                              it: "Inizia test di livello",
                              fr: "Commencer le test de niveau",
                              ja: "レベルテストを始める",
                              hi: "प्रवीणता परीक्षण शुरू करें",
                              ar: "ابدأ اختبار المستوى",
                              zh: "开始水平测试",
                            })}
                          </Button>
                        )}

                        <VoicePreferenceField
                          t={t}
                          voice={tutorVoice}
                          voicePersona={voicePersona}
                          targetLang={targetLang}
                          supportLang={supportLang}
                          voiceOptions={getTutorVoiceOptions()}
                          normalizeVoice={normalizeTutorVoice}
                          getVoiceOption={getTutorVoiceOption}
                          previewProvider={getTutorVoicePreviewProvider()}
                          onVoiceChange={(nextVoice, nextPersona) => {
                            const normalized = normalizeTutorVoice(nextVoice);
                            const persona = String(
                              nextPersona ?? voicePersona ?? "",
                            ).slice(0, 240);
                            setTutorVoice(normalized);
                            setVoicePersona(persona);
                            rememberTextDraft("voicePersona", persona);
                            persistSettingsAfterPaint({
                              tutorVoice: normalized,
                              tutorVoicePersona: persona,
                            });
                          }}
                          onVoicePersonaChange={(next) => {
                            setVoicePersona(next);
                            rememberTextDraft("voicePersona", next);
                            debouncedPersist({ tutorVoicePersona: next });
                          }}
                          onSelectSound={() => playSound(selectSound)}
                          menuListMotionProps={INSTANT_EXIT_MOTION_PROPS}
                          heading={
                            t.onboarding_section_voice_persona ||
                            "Tutor Voice & Personality"
                          }
                          description={
                            t.onboarding_voice_desc ||
                            "Choose the voice and style for your tutor."
                          }
                          personaPlaceholder={
                            (t.ra_persona_placeholder &&
                              t.ra_persona_placeholder.replace(
                                "{example}",
                                translations[appLanguage]
                                  .onboarding_persona_default_example,
                              )) ||
                            `e.g., ${translations[appLanguage].onboarding_persona_default_example}`
                          }
                        />

                        <Box bg="gray.800" p={3} rounded="md">
                          <HStack justifyContent="space-between" mb={2}>
                            <Text fontSize="sm">
                              {t.ra_vad_label ||
                                "How long to wait to respond to your speech"}
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
                            <SliderTrack
                              bg="gray.700"
                              h={3}
                              borderRadius="full"
                            >
                              <SliderFilledTrack bg="linear-gradient(90deg, #3CB371, #5dade2)" />
                            </SliderTrack>
                            <SliderThumb boxSize={6} />
                          </Slider>
                        </Box>

                        <Box bg="gray.800" p={3} rounded="md">
                          <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm">
                              {t.tutor_volume_label || "Tutor volume"}
                            </Text>
                            <Text fontSize="sm" opacity={0.8}>
                              ×{Number(tutorVolume).toFixed(1)}
                            </Text>
                          </HStack>
                          <Slider
                            aria-label="tutor-volume-slider"
                            min={0}
                            max={4}
                            step={0.1}
                            value={tutorVolume}
                            onChange={(val) => {
                              onTutorVolumeChange(val);
                              playSliderTick(val, 0, 4);
                            }}
                            onChangeEnd={(val) => onTutorVolumeSave(val)}
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
                        showPatreonSupport={!subscriptionVerified}
                      />
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

/* -------------------------------------------------------------------------------------------------
   App root
--------------------------------------------------------------------------------------------------*/
export default function App({ onBootReady } = {}) {
  const toast = useToast();
  const initRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const isSubscriptionRoute = location.pathname.startsWith("/subscribe");
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
    const id = setInterval(() => setTasksTickNow(Date.now()), 60 * 1000);
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
  const appLanguageSyncKeyRef = useRef("");

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

  const normalizeSupportLang = useCallback((raw) => {
    const normalized = normalizeSupportLanguage(raw, "");
    return normalized || undefined;
  }, []);

  const resolvedTargetLang = normalizePracticeLanguage(
    user?.progress?.targetLang,
    DEFAULT_TARGET_LANGUAGE,
  );
  const resolvedSupportLang =
    normalizeSupportLang(user?.progress?.supportLang) ||
    normalizeSupportLanguage(storedUiLang, DEFAULT_SUPPORT_LANGUAGE);
  const resolvedLevel = migrateToCEFRLevel(user?.progress?.level) || "Pre-A1";

  useEffect(() => {
    const nextLang = normalizeSupportLanguage(
      resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    // Ignore incoming Firestore value if it differs from a pending local selection
    // (stale snapshot arriving before the write is confirmed).
    if (pendingLangRef.current && nextLang !== pendingLangRef.current) return;
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

    const desiredAppLanguage = normalizeSupportLanguage(
      resolvedSupportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const persistedAppLanguage = normalizeSupportLanguage(
      user?.appLanguage,
      DEFAULT_SUPPORT_LANGUAGE,
    );

    if (persistedAppLanguage === desiredAppLanguage) return;

    const syncKey = `${id}:${desiredAppLanguage}`;
    if (appLanguageSyncKeyRef.current === syncKey) return;
    appLanguageSyncKeyRef.current = syncKey;
    patchUser?.({ appLanguage: desiredAppLanguage });

    updateDoc(doc(database, "users", id), {
      appLanguage: desiredAppLanguage,
      updatedAt: new Date().toISOString(),
    }).catch((error) => {
      if (appLanguageSyncKeyRef.current === syncKey) {
        appLanguageSyncKeyRef.current = "";
      }
      console.warn("Failed to sync appLanguage from supportLang:", error);
    });
  }, [patchUser, resolvedSupportLang, user?.appLanguage, user?.local_npub]);

  const dailyGoalTarget = useMemo(() => {
    return getEffectiveDailyGoalXp(user || {});
  }, [user]);

  const dailyXpToday = useMemo(() => {
    return getEffectiveDailyXpToday(user || {});
  }, [user]);

  const dailyGoalCompletedDates = useMemo(
    () =>
      Array.isArray(user?.completedGoalDates) ? user.completedGoalDates : [],
    [user?.completedGoalDates],
  );

  const dailyGoalXpHistory = useMemo(
    () =>
      user?.dailyXpRecent && typeof user.dailyXpRecent === "object"
        ? user.dailyXpRecent
        : user?.dailyXpHistory && typeof user.dailyXpHistory === "object"
          ? user.dailyXpHistory
          : {},
    [user?.dailyXpHistory, user?.dailyXpRecent],
  );

  const companionXp = useMemo(() => {
    const languageXp = getLanguageXp(user?.progress || {}, resolvedTargetLang);
    return Number.isFinite(languageXp) && languageXp >= 0 ? languageXp : 0;
  }, [user?.progress, resolvedTargetLang]);

  const companionLevel = useMemo(
    () => getCompanionLevelFromXp(companionXp),
    [companionXp],
  );

  const dailyGoalPetHealth = useMemo(
    () => getDailyGoalPetHealth(user || {}),
    [user],
  );

  const dailyGoalPetType = useMemo(
    () => getEffectivePetType(user?.dailyGoalPetType, companionLevel),
    [companionLevel, user?.dailyGoalPetType],
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
    if (typeof window === "undefined") return DEFAULT_SUPPORT_LANGUAGE;
    const stored = localStorage.getItem("appLanguage");
    return normalizeSupportLanguage(stored, DEFAULT_SUPPORT_LANGUAGE);
  });
  // Guards stale Firestore snapshots from reverting an in-flight language change.
  const pendingLangRef = useRef(null);
  const pendingLangTimeoutRef = useRef(null);
  const onSupportLangChange = useCallback(
    (normalized, setSupportLangFn) => {
      pendingLangRef.current = normalized;
      if (pendingLangTimeoutRef.current)
        clearTimeout(pendingLangTimeoutRef.current);
      pendingLangTimeoutRef.current = setTimeout(() => {
        pendingLangRef.current = null;
      }, 5000);

      try {
        localStorage.setItem("appLanguage", normalized);
      } catch {}

      const applyOptimisticLanguage = () => {
        syncDocumentLanguage(normalized);
        setAppLanguage(normalized);
        setSupportLangFn?.(normalized);
        if (user) {
          const currentProgress = user.progress || {};
          const nextVoicePersona = personaForSupportLanguage(
            currentProgress.tutorVoicePersona ?? currentProgress.voicePersona,
            normalized,
          );
          const shouldLocalizeTutorPersona = isDefaultPersonaValue(
            currentProgress.tutorVoicePersona ?? currentProgress.voicePersona,
          );
          setUser?.({
            ...user,
            appLanguage: normalized,
            progress: {
              ...currentProgress,
              supportLang: normalized,
              ...(shouldLocalizeTutorPersona && nextVoicePersona
                ? { tutorVoicePersona: nextVoicePersona }
                : {}),
            },
          });
        }
      };

      try {
        flushSync(applyOptimisticLanguage);
      } catch {
        applyOptimisticLanguage();
      }
    },
    [setUser, user],
  );
  const t = translations[appLanguage] || translations.en;
  useEffect(() => {
    syncDocumentLanguage(appLanguage);
  }, [appLanguage]);
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
  const [soundVolume, setSoundVolume] = useState(100);
  const [tutorVolume, setTutorVolume] = useState(1);
  const setSoundSettingsEnabled = useSoundSettings((s) => s.setSoundEnabled);
  const setSoundSettingsVolume = useSoundSettings((s) => s.setVolume);
  const setSoundSettingsTutorVolume = useSoundSettings((s) => s.setTutorVolume);
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
          ? localStorage.getItem("themeMode") || "light"
          : "light"),
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

  // Sound effects are now an on/off switch with no volume control, so they always
  // play at full volume when enabled. Ignore any stored soundVolume (which may be a
  // stale value from the old slider) and force 100% for everyone.
  useEffect(() => {
    setSoundVolume(100);
    setSoundSettingsVolume(100);
  }, [setSoundSettingsVolume]);

  // Sync tutorVolume (Gemini Live playback gain, 0-4) state with global store
  useEffect(() => {
    // Default to 1 (no boost) if user.tutorVolume is not set
    const vol = typeof user?.tutorVolume === "number" ? user.tutorVolume : 1;
    setTutorVolume(vol);
    setSoundSettingsTutorVolume(vol);
  }, [user?.tutorVolume, setSoundSettingsTutorVolume]);

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

  // Tabs (order: Chat, Stories, History, Grammar, Vocabulary, Random)
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
  // Bumped when "next" is pressed in a single-module lesson (e.g. the repair
  // flashcards lesson, modes=["vocabulary"]): there's no other module to hop
  // to, so we remount the current one to regenerate a fresh question — the
  // same effect a tab-hop has in multi-module lessons.
  const [lessonModuleNonce, setLessonModuleNonce] = useState(0);
  const [preGeneratedGameScenario, setPreGeneratedGameScenario] =
    useState(null);
  const [tutorialGameScenario, setTutorialGameScenario] = useState(null);
  const [tutorialGamePreparationFailed, setTutorialGamePreparationFailed] =
    useState(false);
  const [tutorialGameRevealReady, setTutorialGameRevealReady] = useState(false);
  const tutorialGamePreparationTokenRef = useRef(0);
  // Resolved GameRouter component. handleStartLesson fills this in before the
  // view flips so the game's first commit renders the game itself; the effect
  // below covers paths that reach the game view without the launch flow
  // (currently the ?episode= dev harness — refreshes reset viewMode above).
  const [GameRouterComponent, setGameRouterComponent] = useState(null);
  useEffect(() => {
    if (GameRouterComponent) return undefined;
    const harnessRequested =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("episode");
    const lessonUsesGame =
      viewMode === "lesson" &&
      !!(activeLesson?.isGame || activeLesson?.modes?.includes("game"));
    if (!harnessRequested && !lessonUsesGame) return undefined;
    let cancelled = false;
    loadRPGGameComponent()
      .then((component) => {
        if (!cancelled) setGameRouterComponent(() => component);
      })
      .catch((error) => {
        console.error("Failed to load game client:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [GameRouterComponent, viewMode, activeLesson]);

  // The tutorial scenario is usually ready before the learner reaches its
  // final game step. Start the artificial exploration window only once that
  // loader is actually visible; timing it during earlier modules would make
  // the intended 6-10 seconds invisible.
  useEffect(() => {
    const shouldHoldTutorialGame =
      viewMode === "lesson" &&
      activeLesson?.isTutorial &&
      currentTab === "game" &&
      !!tutorialGameScenario &&
      !preGeneratedGameScenario;

    setTutorialGameRevealReady(false);
    if (!shouldHoldTutorialGame) return undefined;

    let cancelled = false;
    void waitForGameLoaderExploration().then(() => {
      if (!cancelled) setTutorialGameRevealReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [
    activeLesson?.id,
    activeLesson?.isTutorial,
    currentTab,
    preGeneratedGameScenario,
    tutorialGameScenario,
    viewMode,
  ]);

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

  // Path mode state (plate, path, flashcards, conversations, tutor, alphabet bootcamp)
  // Every load starts on the Daily Quest home ("plate") — the last-used mode
  // intentionally does not survive a refresh/return. The one exception is the
  // one-shot "pathModeHandoff" key, written by flows on other routes that need
  // to land somewhere specific on remount (the proficiency test queues
  // "tutor"); it's consumed here so it can't leak into later loads. Invalid
  // values are sanitized to "plate" by the validation effect below.
  const [pathMode, setPathMode] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const handoff = localStorage.getItem("pathModeHandoff");
        localStorage.removeItem("pathModeHandoff");
        // Legacy key from when the last-used mode persisted across loads.
        localStorage.removeItem("pathMode");
        if (handoff) return handoff;
      } catch {}
    }
    return "plate";
  });
  const lastPathTargetRef = useRef(null);
  const [voiceConnectionStatuses, setVoiceConnectionStatuses] = useState({
    conversations: "disconnected",
    tutor: "disconnected",
  });
  const [isBottomActionBarMinimized, setIsBottomActionBarMinimized] =
    useState(false);

  const handleVoiceConnectionStatusChange = useCallback((mode, status) => {
    if (mode !== "conversations" && mode !== "tutor") return;
    const nextStatus =
      status === "connecting" || status === "connected"
        ? status
        : "disconnected";
    setVoiceConnectionStatuses((prev) =>
      prev[mode] === nextStatus ? prev : { ...prev, [mode]: nextStatus },
    );
  }, []);

  const handleBottomActionBarMinimizedChange = useCallback((nextValue) => {
    setIsBottomActionBarMinimized(Boolean(nextValue));
  }, []);

  // Ref to trigger scroll to latest unlocked lesson
  const scrollToLatestUnlockedRef = useRef(null);

  // Counter to trigger scroll to latest unlocked (increments on each scroll request)
  const [scrollToLatestTrigger, setScrollToLatestTrigger] = useState(0);

  // Reset to the Daily Plate home on language switch; also validate pathMode
  useEffect(() => {
    const validModes = [
      "plate",
      "alphabet",
      "path",
      "flashcards",
      "conversations",
      "tutor",
    ];
    if (!validModes.includes(pathMode)) {
      setPathMode("plate");
      return;
    }

    // Only track languages that actually come from the user doc. During boot
    // the doc can arrive in stages — a partial user object resolves to the
    // DEFAULT language first — and tracking that fallback made every refresh
    // look like a language switch, yanking users back to the plate instead
    // of their last-used mode.
    const rawTargetLang =
      typeof user?.progress?.targetLang === "string" &&
      user.progress.targetLang.trim()
        ? normalizePracticeLanguage(
            user.progress.targetLang,
            DEFAULT_TARGET_LANGUAGE,
          )
        : null;
    if (!rawTargetLang) return;

    // When the user explicitly switches languages, reset to the Daily Plate
    if (
      lastPathTargetRef.current !== null &&
      lastPathTargetRef.current !== rawTargetLang
    ) {
      // Land at the top of the quest page, not the previous scroll position.
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      setPathMode("plate");
    }
    lastPathTargetRef.current = rawTargetLang;
  }, [pathMode, user]);

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

  const [companionUnlockModal, setCompanionUnlockModal] = useState(null);
  const [companionUnlockQueueTick, setCompanionUnlockQueueTick] = useState(0);
  const companionUnlockQueueRef = useRef([]);
  const companionUnlockFlushTimerRef = useRef(null);
  const companionUnlockSeenRef = useRef(new Set());

  // Once-per-account guard for the unlock celebration. The in-memory seen-set
  // only dedupes within a session; boot can re-derive a level transition (XP
  // hydrates in steps), which used to replay "Alien unlocked!" on refresh.
  // Two persisted layers because the level transition can fire BEFORE the user
  // doc hydrates into the store: localStorage is synchronous (never races) and
  // the Firestore field covers other devices / cleared storage.
  const isCompanionUnlockCelebrated = useCallback(
    (petType) => {
      const type = normalizePetType(petType);
      const celebrated =
        useUserStore.getState()?.user?.companionUnlocksCelebrated || {};
      if (celebrated[type]) return true;
      try {
        return (
          window.localStorage.getItem(
            `companionUnlockCelebrated:${activeNpub || "local"}:${type}`,
          ) === "1"
        );
      } catch {
        return false;
      }
    },
    [activeNpub],
  );
  const markCompanionUnlockCelebrated = useCallback(
    (petType) => {
      const type = normalizePetType(petType);
      try {
        window.localStorage.setItem(
          `companionUnlockCelebrated:${activeNpub || "local"}:${type}`,
          "1",
        );
      } catch {
        /* ignore quota/availability */
      }
      const store = useUserStore.getState();
      const existing = store?.user?.companionUnlocksCelebrated || {};
      if (!existing[type]) {
        store.patchUser?.({
          companionUnlocksCelebrated: { ...existing, [type]: true },
        });
      }
      if (!activeNpub) return;
      setDoc(
        doc(database, "users", activeNpub),
        { companionUnlocksCelebrated: { [type]: true } },
        { merge: true },
      ).catch(() => {});
    },
    [activeNpub],
  );

  const queueCompanionUnlocks = useCallback(
    (types, reachedLevel, options = {}) => {
      const unlockTypes = Array.isArray(types) ? types : [];
      if (!unlockTypes.length) return;

      const companionCopy = getCustomizeModalCopy(appLanguage);
      const nextUnlocks = unlockTypes
        .map((type) => {
          const normalizedType = normalizePetType(type);
          const unlockLevel = getPetUnlockLevel(normalizedType);
          // Already celebrated on some earlier session/device → never replay.
          if (isCompanionUnlockCelebrated(normalizedType)) return null;
          const key = `${activeNpub || "local"}:${normalizedType}`;
          if (companionUnlockSeenRef.current.has(key)) return null;
          companionUnlockSeenRef.current.add(key);
          return {
            type: normalizedType,
            name: companionCopy[normalizedType] || normalizedType,
            unlockLevel,
            reachedLevel,
            expectsModal: Boolean(options.expectsModal),
          };
        })
        .filter(Boolean);

      if (!nextUnlocks.length) return;
      companionUnlockQueueRef.current.push(...nextUnlocks);
      setCompanionUnlockQueueTick((tick) => tick + 1);
    },
    [activeNpub, appLanguage, isCompanionUnlockCelebrated],
  );

  useEffect(() => {
    return () => {
      if (companionUnlockFlushTimerRef.current) {
        clearTimeout(companionUnlockFlushTimerRef.current);
        companionUnlockFlushTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return useModalStore.subscribe((state, prev) => {
      if (
        state.dailyGoalOpen === prev.dailyGoalOpen &&
        state.timerModalOpen === prev.timerModalOpen
      ) {
        return;
      }
      if (!companionUnlockQueueRef.current.length) return;
      setCompanionUnlockQueueTick((tick) => tick + 1);
    });
  }, []);

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

    // Synchronous local flag too: the Firestore field can lag behind a refresh
    // (user doc loads after the show-effect runs), which would briefly re-trigger
    // onboarding. localStorage is read synchronously on the next mount, so the
    // tutorial never re-shows once completed on this device.
    try {
      window.localStorage.setItem(
        `skillTreeTutorialCompleted:${activeNpub}`,
        "1",
      );
    } catch {
      /* ignore quota/availability */
    }

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
  const activeLessonContent = useMemo(() => {
    const content = activeLesson?.content || {};
    const curriculumContext = activeLesson?.gameReviewContext || null;
    if (!curriculumContext) return content;
    return Object.fromEntries(
      Object.entries(content).map(([mode, block]) => [
        mode,
        block && typeof block === "object"
          ? { ...block, curriculumContext }
          : block,
      ]),
    );
  }, [activeLesson]);

  // Track XP at lesson start for completion detection
  const [lessonStartXp, setLessonStartXp] = useState(null);
  const lessonCompletionTriggeredRef = useRef(false);
  const previousXpRef = useRef(null);
  const activeLessonLanguageRef = useRef(resolvedTargetLang);
  const lastTargetLangRef = useRef(resolvedTargetLang);
  const pendingLessonCompletionRef = useRef(null);
  const lessonCompletionSequenceActiveRef = useRef(false);

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
    const fallback = uiCopy(appLanguage, {
      en: "Show translation",
      es: "Mostrar traducción",
      it: "Mostra traduzione",
      fr: "Afficher la traduction",
      ja: "翻訳を表示",
    });
    const template = translations[appLanguage]?.onboarding_translations_toggle;
    if (!template) return fallback;

    const progress = user?.progress || {};
    const supportLang = normalizeSupportLanguage(
      progress.supportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const targetLang = normalizePracticeLanguage(
      progress.targetLang,
      DEFAULT_TARGET_LANGUAGE,
    );
    const languageName = (code) =>
      translations[appLanguage]?.[
        `language_${code === "nah" ? "nah" : code}`
      ] || code;

    const targetNameKey =
      targetLang === supportLang
        ? targetLang === "en"
          ? "es"
          : "en"
        : supportLang;

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
    voice: "marin",
    tutorVoice: normalizeTutorVoice(),
    tutorVoicePersona:
      translations?.[appLanguage]?.onboarding_persona_default_example ||
      translations?.en?.onboarding_persona_default_example ||
      "",
    targetLang: "es",
    showTranslations: true,
    pauseMs: DEFAULT_VOICE_PAUSE_MS,
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
      const previousUser = useUserStore.getState()?.user;
      const previousUserNpub =
        previousUser?.local_npub || previousUser?.id || activeNpub;
      if (id && previousUserNpub && previousUserNpub !== id) {
        setUser?.(null);
      }
      const storedDisplayName = (
        localStorage.getItem("displayName") || ""
      ).trim();
      console.log("[CONNECT_DID] Read local_npub from localStorage:", id);
      console.log(
        "[CONNECT_DID] Read local_nsec from localStorage:",
        localStorage.getItem("local_nsec")?.substring(0, 20) + "...",
      );
      const secretKeySignInNpub = getSecretKeySignInNpub();
      const accountSwitchNpub = getAccountSwitchNpub();
      const explicitReturningAccountNpub =
        secretKeySignInNpub === id || accountSwitchNpub === id;
      let userDoc = null;
      let foundExistingUserDoc = false;

      if (id) {
        console.log(
          "[CONNECT_DID] Found existing npub, loading user from DB...",
        );
        userDoc = await loadUserObjectFromDB(database, id);
        foundExistingUserDoc = Boolean(userDoc);
        if (!userDoc) {
          const base = {
            local_npub: id,
            createdAt: new Date().toISOString(),
            onboarding: { completed: false, currentStep: 1 },
            appLanguage: normalizeSupportLanguage(
              localStorage.getItem("appLanguage"),
              DEFAULT_SUPPORT_LANGUAGE,
            ),
            helpRequest: "",
            practicePronunciation: false,
            identity: null,
            displayName: storedDisplayName || "",
            dailyGoalPetType: "dog",
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
          appLanguage: normalizeSupportLanguage(
            localStorage.getItem("appLanguage"),
            DEFAULT_SUPPORT_LANGUAGE,
          ),
          helpRequest: "",
          practicePronunciation: false,
          identity: null,
          displayName: storedDisplayName || "",
          dailyGoalPetType: "dog",
        };
        await setDoc(doc(database, "users", id), base, { merge: true });
        userDoc = await loadUserObjectFromDB(database, id);
      }

      // Explicit returning-account actions should load the existing app user
      // doc instead of sending the account back through onboarding.
      if (
        foundExistingUserDoc &&
        explicitReturningAccountNpub &&
        !hasCompletedOnboarding(userDoc)
      ) {
        const completedAt =
          userDoc?.onboarding?.completedAt || new Date().toISOString();
        const onboarding = {
          ...(userDoc?.onboarding || {}),
          completed: true,
          completedAt,
        };

        await setDoc(
          doc(database, "users", id),
          {
            local_npub: id,
            updatedAt: new Date().toISOString(),
            onboarding,
          },
          { merge: true },
        );
        userDoc = { ...userDoc, onboarding };
        rememberLocalOnboardingCompletion(id, completedAt);
      }

      if (secretKeySignInNpub) clearSecretKeySignIn();
      if (accountSwitchNpub) clearAccountSwitch();

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
        if (hasCompletedOnboarding(userDoc)) {
          rememberLocalOnboardingCompletion(
            id,
            userDoc?.onboarding?.completedAt || null,
          );
        }

        // Precedence: a saved support language (returning user) wins; otherwise
        // honor the choice made on the landing page / /links, which lives in
        // localStorage *before* the account doc knows about it. The doc's own
        // appLanguage is the last resort — a doc created before a language was
        // known resolves to the English default here, which is exactly what
        // made onboarding ignore the landing-page language until a later
        // refresh backfilled the doc.
        const storedLang = normalizeSupportLang(
          localStorage.getItem("appLanguage"),
        );
        const savedSupportLang = normalizeSupportLang(
          userDoc?.progress?.supportLang,
        );
        const uiLang =
          savedSupportLang ||
          storedLang ||
          normalizeSupportLanguage(
            userDoc.appLanguage,
            DEFAULT_SUPPORT_LANGUAGE,
          );
        setAppLanguage(uiLang);
        localStorage.setItem("appLanguage", uiLang);
        // Backfill a language-less doc so subsequent reads (this device or
        // another) resolve to the same language instead of the default.
        if (
          !savedSupportLang &&
          normalizeSupportLanguage(userDoc.appLanguage, "") !== uiLang
        ) {
          setDoc(
            doc(database, "users", id),
            { appLanguage: uiLang },
            { merge: true },
          ).catch(() => {});
          userDoc = { ...userDoc, appLanguage: uiLang };
        }
        setUser?.(userDoc);
      }
    } catch (e) {
      console.error("connectDID error:", e);
    } finally {
      setIsLoadingApp(false);
    }
  };

  const handleSwitchedAccount = async (id, sec) => {
    const nextNpub = String(id || "").trim();
    const nextNsec = typeof sec === "string" ? sec.trim() : "";

    if (nextNpub) {
      localStorage.setItem("local_npub", nextNpub);
      rememberAccountSwitch(nextNpub);
    }
    if (typeof sec === "string") {
      localStorage.setItem("local_nsec", nextNsec);
    }

    setActiveNpub(nextNpub || localStorage.getItem("local_npub") || "");
    setActiveNsec(
      typeof sec === "string"
        ? nextNsec
        : localStorage.getItem("local_nsec") || "",
    );
    setUser?.(null);
    await connectDID();
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
    return hasCompletedOnboarding(user);
  }, [user]);

  const needsOnboarding = useMemo(() => !onboardingDone, [onboardingDone]);

  // Show the action bar tutorial on first login (only once per session)
  useEffect(() => {
    if (skillTreeTutorialCheckedRef.current) return;
    if (!user || !activeNpub) return;
    if (isLoadingApp || needsOnboarding) return;
    if (
      viewMode !== "skillTree" ||
      !["plate", "path", "tutor"].includes(pathMode)
    )
      return;

    skillTreeTutorialCheckedRef.current = true;

    // Treat the tutorial as done if EITHER the synced user flag or the local
    // device flag is set. The local flag guards the refresh race where the user
    // doc (with skillTreeTutorialCompleted) hasn't loaded yet when this runs.
    let locallyCompleted = false;
    try {
      locallyCompleted =
        window.localStorage.getItem(
          `skillTreeTutorialCompleted:${activeNpub}`,
        ) === "1";
    } catch {
      locallyCompleted = false;
    }

    // Show tutorial if not completed
    if (!user.skillTreeTutorialCompleted && !locallyCompleted) {
      // Small delay to let UI settle
      setTimeout(() => {
        setShowSkillTreeTutorial(true);
      }, 500);
    }
  }, [user, activeNpub, isLoadingApp, needsOnboarding, viewMode, pathMode]);

  /* -----------------------------------
     Daily goal modals (open logic)
     - Only open DailyGoalModal right after onboarding completes
  ----------------------------------- */
  // dailyGoalOpen lives in useModalStore so tapping the top-bar button
  // doesn't re-render this huge App component before the modal can open.
  // App reads the flag only via getState/subscribe in effects below — no
  // hook subscription — so flipping it doesn't trigger an App re-render.
  const setDailyGoalOpen = useCallback((value, dismissible = false) => {
    const m = useModalStore.getState();
    if (value) m.openDailyGoal(dismissible);
    else m.closeDailyGoal();
  }, []);
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [dailyGoalCelebrationPet, setDailyGoalCelebrationPet] = useState(null);
  const celebrationPetHealth =
    dailyGoalCelebrationPet?.health ?? dailyGoalPetHealth;
  const celebrationPetDelta =
    dailyGoalCelebrationPet?.delta ?? DAILY_GOAL_PET_HEALTH_GAIN;
  const dailyGoalModalJustOpenedRef = useRef(false);
  const deferDailyGoalCelebrationRef = useRef(false);
  const pendingDailyGoalCelebrationRef = useRef(null);
  const openDailyGoalCelebration = useCallback((detail = {}) => {
    setCelebrateOpen(true);
    setDailyGoalCelebrationPet({
      health: detail?.petHealth ?? detail?.health ?? null,
      delta: detail?.petDelta ?? detail?.delta ?? DAILY_GOAL_PET_HEALTH_GAIN,
    });
    dailyGoalModalJustOpenedRef.current = true;
  }, []);
  const openPendingDailyGoalCelebration = useCallback(() => {
    deferDailyGoalCelebrationRef.current = false;
    const pending = pendingDailyGoalCelebrationRef.current;
    if (!pending) return false;
    pendingDailyGoalCelebrationRef.current = null;
    openDailyGoalCelebration(pending);
    return true;
  }, [openDailyGoalCelebration]);
  const [shouldShowTimerAfterGoal, setShouldShowTimerAfterGoal] =
    useState(false);
  const [shouldShowProficiencyAfterTimer, setShouldShowProficiencyAfterTimer] =
    useState(false);
  const [proficiencyTestOpen, setProficiencyTestOpen] = useState(false);
  // Modes intro carousel — onboarding step right after the proficiency modal
  const [modesIntroOpen, setModesIntroOpen] = useState(false);
  const modesIntroCheckDoneRef = useRef(false);
  const proficiencyCheckDoneRef = useRef(false);
  const [gettingStartedOpen, setGettingStartedOpen] = useState(false);
  const [
    pendingInstallModalAfterTutorial,
    setPendingInstallModalAfterTutorial,
  ] = useState(false);

  const blurActiveElement = useCallback(() => {
    if (typeof document === "undefined") return;
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      typeof activeElement.blur === "function"
    ) {
      activeElement.blur();
    }
  }, []);

  const runAfterNextPaint = useCallback((task) => {
    if (typeof task !== "function") return;

    if (typeof window === "undefined") {
      task();
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        task();
      });
    });
  }, []);

  // Play daily goal sound when daily goal celebration modal opens
  useEffect(() => {
    if (celebrateOpen) {
      playSound(dailyGoalSound);
    }
  }, [celebrateOpen, playSound]);

  /* -----------------------------------
     Session timer
     The high-frequency "remaining seconds" value is kept in a module-level
     store (SessionTimerProvider) so only <SessionTimerBadge/> re-renders on
     each 1-second tick. App and TopBar only re-render on structural changes
     (start, pause, reset, time-up).
  ----------------------------------- */
  // timerModalOpen lives in useModalStore (see dailyGoalOpen above for the
  // reasoning). The shim below preserves the existing setX(true/false) API.
  const setTimerModalOpen = useCallback((value) => {
    const m = useModalStore.getState();
    if (value) m.openTimerModal();
    else m.closeTimerModal();
  }, []);
  const [timerMinutes, setTimerMinutes] = useState("10");
  const [timerDurationSeconds, setTimerDurationSeconds] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerEndsAt, setTimerEndsAt] = useState(null);
  const [timerModalImmediateBody, setTimerModalImmediateBody] = useState(false);
  const [timeUpOpen, setTimeUpOpen] = useState(false);
  const [hasTimer, setHasTimer] = useState(false);
  const timerIntervalRef = useRef(null);
  const timerHydratedRef = useRef(false);
  const sessionTimerStorageKey = useMemo(
    () => `${SESSION_TIMER_STORAGE_KEY}:${activeNpub || "anonymous"}`,
    [activeNpub],
  );
  const isTimerRunning = timerActive && !timerPaused && hasTimer;
  // App-owned half of the onboarding chain (proficiencyTestOpen +
  // gettingStartedOpen still useState here). dailyGoal + timer live in
  // useModalStore, so the shared backdrop component and modal Gates combine
  // both sides themselves — this keeps App's render free of subscriptions
  // to the two store-backed booleans.
  const appOnboardingChainOpen =
    proficiencyTestOpen || gettingStartedOpen || modesIntroOpen;

  useEffect(() => {
    if (timeUpOpen) {
      playSound(sparkleSound);
    }
  }, [timeUpOpen, playSound]);

  // Show proficiency modal for returning users only when the user document
  // does NOT contain a proficiency decision flag yet.
  //
  // dailyGoalOpen/timerModalOpen aren't in the dep array because they live in
  // useModalStore — instead we read them with getState() inside the check and
  // subscribe to the store below to re-fire when they flip closed. This is
  // what keeps a "open timer modal" tap from re-rendering App.
  useEffect(() => {
    let cancelled = false;

    const isProficiencyBlocked = () => {
      const m = useModalStore.getState();
      return (
        m.dailyGoalOpen ||
        m.timerModalOpen ||
        proficiencyTestOpen ||
        shouldShowTimerAfterGoal ||
        shouldShowProficiencyAfterTimer
      );
    };

    const checkProficiencyDecision = async () => {
      if (cancelled) return;
      if (proficiencyCheckDoneRef.current) return;
      if (isLoadingApp || !user || !activeNpub) return;
      if (needsOnboarding) return;
      if (isProficiencyBlocked()) return;

      try {
        const snap = await getDoc(doc(database, "users", activeNpub));
        const data = snap.exists() ? snap.data() || {} : {};
        const hasDecision = Object.prototype.hasOwnProperty.call(
          data,
          "proficiencyPlacement",
        );

        if (hasDecision) {
          proficiencyCheckDoneRef.current = true;
          return;
        }
        if (cancelled || isProficiencyBlocked()) return;

        proficiencyCheckDoneRef.current = true;
        setProficiencyTestOpen(true);
      } catch (error) {
        console.warn("Failed to check proficiency decision flag:", error);

        const fallbackHasDecision = Object.prototype.hasOwnProperty.call(
          user || {},
          "proficiencyPlacement",
        );
        if (fallbackHasDecision) {
          proficiencyCheckDoneRef.current = true;
          return;
        }
        if (cancelled || isProficiencyBlocked()) return;

        proficiencyCheckDoneRef.current = true;
        setProficiencyTestOpen(true);
      }
    };

    checkProficiencyDecision();

    // Re-run when dailyGoalOpen or timerModalOpen change in the store.
    // Using subscribe (not the hook) so this effect doesn't re-render App.
    const unsubscribe = useModalStore.subscribe((state, prev) => {
      if (
        state.dailyGoalOpen !== prev.dailyGoalOpen ||
        state.timerModalOpen !== prev.timerModalOpen
      ) {
        checkProficiencyDecision();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [
    isLoadingApp,
    user,
    activeNpub,
    needsOnboarding,
    proficiencyTestOpen,
    shouldShowTimerAfterGoal,
    shouldShowProficiencyAfterTimer,
  ]);

  // Modes intro carousel: opens once per user, right after the proficiency
  // step resolves (skipped in the modal, or completed via /proficiency).
  // Mirrors the proficiency check's gating so it never opens over the daily
  // goal / timer / proficiency modals.
  useEffect(() => {
    const checkModesIntro = () => {
      if (modesIntroCheckDoneRef.current) return;
      if (isLoadingApp || !user || !activeNpub) return;
      if (needsOnboarding) return;
      if (
        proficiencyTestOpen ||
        shouldShowTimerAfterGoal ||
        shouldShowProficiencyAfterTimer
      )
        return;
      const m = useModalStore.getState();
      if (m.dailyGoalOpen || m.timerModalOpen) return;

      // The proficiency step must be decided (taken or skipped) first.
      const hasProficiencyDecision = Object.prototype.hasOwnProperty.call(
        user,
        "proficiencyPlacement",
      );
      if (!hasProficiencyDecision) return;

      modesIntroCheckDoneRef.current = true;
      if (!user.modesIntroShown) {
        setModesIntroOpen(true);
      }
    };

    checkModesIntro();

    const unsubscribe = useModalStore.subscribe((state, prev) => {
      if (
        state.dailyGoalOpen !== prev.dailyGoalOpen ||
        state.timerModalOpen !== prev.timerModalOpen
      ) {
        checkModesIntro();
      }
    });

    return () => unsubscribe();
  }, [
    isLoadingApp,
    user,
    activeNpub,
    needsOnboarding,
    proficiencyTestOpen,
    shouldShowTimerAfterGoal,
    shouldShowProficiencyAfterTimer,
  ]);

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
        setRemainingSeconds(null);
        setTimerDurationSeconds(null);
        setTimerActive(false);
        setTimerPaused(false);
        setTimerEndsAt(null);
        setTimeUpOpen(false);
        setHasTimer(false);
        return;
      }

      const stored = JSON.parse(raw);
      const storedMinutes = String(stored?.minutes || "10");
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
        setRemainingSeconds(storedRemaining);
        setTimerActive(true);
        setTimerPaused(true);
        setTimerEndsAt(null);
        setTimeUpOpen(false);
        setHasTimer(true);
        return;
      }

      if (storedActive && Number.isFinite(storedEndsAt)) {
        const nextRemaining = Math.max(
          0,
          Math.ceil((storedEndsAt - Date.now()) / 1000),
        );

        if (nextRemaining > 0) {
          setRemainingSeconds(nextRemaining);
          setTimerActive(true);
          setTimerPaused(false);
          setTimerEndsAt(storedEndsAt);
          setTimeUpOpen(false);
          setHasTimer(true);
        } else {
          setRemainingSeconds(0);
          setTimerActive(false);
          setTimerPaused(false);
          setTimerEndsAt(null);
          setTimeUpOpen(true);
          setHasTimer(true);
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
      // While running we persist only endsAt (remaining is recomputed on
      // hydrate). While paused we snapshot remaining so it survives reload.
      window.sessionStorage.setItem(
        sessionTimerStorageKey,
        JSON.stringify({
          minutes: timerMinutes,
          remainingSeconds: timerPaused ? getRemainingSeconds() : null,
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
    () => subscriptionXp >= 300 && !subscriptionVerified,
    [subscriptionXp, subscriptionVerified],
  );

  useEffect(() => {
    if (
      isLoadingApp ||
      !user ||
      needsOnboarding ||
      needsSubscriptionPasscode ||
      !isOnboardingRoute
    ) {
      return;
    }
    navigate("/", { replace: true });
  }, [
    isLoadingApp,
    isOnboardingRoute,
    navigate,
    needsOnboarding,
    needsSubscriptionPasscode,
    user,
  ]);

  const handleResetTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerActive(false);
    setTimerPaused(false);
    setRemainingSeconds(null);
    setTimerDurationSeconds(null);
    setTimerEndsAt(null);
    setTimeUpOpen(false);
    setHasTimer(false);
  }, []);

  const handleStartTimer = useCallback(
    (minutesArg) => {
      // The modal may pass its local draft value here — prefer it over the
      // parent state to avoid any staleness if the user hadn't blurred yet.
      const source = minutesArg ?? timerMinutes;
      const parsedSource = Number(source);
      const parsedMinutes = Math.max(
        1,
        Math.round(
          Number.isFinite(parsedSource) && parsedSource > 0 ? parsedSource : 10,
        ),
      );
      const shouldOpenProficiency = shouldShowProficiencyAfterTimer;

      flushSync(() => {
        setTimerModalOpen(false);
        setTimerModalImmediateBody(false);
        if (shouldOpenProficiency) {
          proficiencyCheckDoneRef.current = true;
          setShouldShowProficiencyAfterTimer(false);
          setProficiencyTestOpen(true);
        }
      });

      runAfterNextPaint(() => {
        handleResetTimer();
        const seconds = parsedMinutes * 60;
        const endsAt = Date.now() + seconds * 1000;
        setTimerDurationSeconds(seconds);
        setRemainingSeconds(seconds);
        setTimerActive(true);
        setTimerPaused(false);
        setTimerEndsAt(endsAt);
        setTimeUpOpen(false);
        setHasTimer(true);
      });
    },
    [
      handleResetTimer,
      runAfterNextPaint,
      timerMinutes,
      shouldShowProficiencyAfterTimer,
    ],
  );

  const handleCloseTimeUp = useCallback(() => {
    playSound(selectSound);
    setTimeUpOpen(false);
    setRemainingSeconds(null);
    setTimerDurationSeconds(null);
    setTimerActive(false);
    setTimerPaused(false);
    setTimerEndsAt(null);
    setHasTimer(false);
  }, [playSound]);

  const clearTimeUpState = useCallback(() => {
    setTimeUpOpen(false);
    setRemainingSeconds(null);
    setTimerDurationSeconds(null);
    setTimerActive(false);
    setTimerPaused(false);
    setTimerEndsAt(null);
    setHasTimer(false);
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

  useEffect(() => {
    if (!timerActive || timerPaused || !Number.isFinite(timerEndsAt)) return;

    const syncTimer = () => {
      const nextRemaining = Math.max(
        0,
        Math.ceil((timerEndsAt - Date.now()) / 1000),
      );
      // Writes to the module-level store and notifies only subscribers
      // (SessionTimerBadge). App and TopBar do NOT re-render on each tick.
      setRemainingSeconds(nextRemaining);

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
    const remaining = getRemainingSeconds();
    if (!timerActive || remaining === null) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (timerPaused) {
      setTimerEndsAt(Date.now() + remaining * 1000);
      setTimerPaused(false);
      return;
    }

    setTimerEndsAt(null);
    setTimerPaused(true);
  }, [timerActive, timerPaused]);

  // Celebration listener (fired by awardXp when goal is reached)
  useEffect(() => {
    const queueOrOpenDailyGoalCelebration = (event) => {
      const detail = event?.detail || {};
      if (deferDailyGoalCelebrationRef.current) {
        pendingDailyGoalCelebrationRef.current = detail;
        return;
      }
      openDailyGoalCelebration(detail);
    };
    window.addEventListener(
      "daily:goalAchieved",
      queueOrOpenDailyGoalCelebration,
    );
    window.addEventListener(
      "daily-goal:queueCelebration",
      queueOrOpenDailyGoalCelebration,
    );
    return () => {
      window.removeEventListener(
        "daily:goalAchieved",
        queueOrOpenDailyGoalCelebration,
      );
      window.removeEventListener(
        "daily-goal:queueCelebration",
        queueOrOpenDailyGoalCelebration,
      );
    };
  }, [openDailyGoalCelebration]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleSequenceStart = () => {
      deferDailyGoalCelebrationRef.current = true;
    };
    const handleReleaseQueuedCelebration = (event) => {
      let opened = openPendingDailyGoalCelebration() || celebrateOpen;
      const fallbackDetail = event?.detail?.celebration;
      if (!opened && fallbackDetail && typeof fallbackDetail === "object") {
        deferDailyGoalCelebrationRef.current = false;
        openDailyGoalCelebration(fallbackDetail);
        opened = true;
      }
      if (event?.detail && typeof event.detail === "object") {
        event.detail.handled = opened;
      }
    };
    window.addEventListener(
      "lesson-completion:sequence-start",
      handleSequenceStart,
    );
    window.addEventListener(
      "daily-goal:releaseQueuedCelebration",
      handleReleaseQueuedCelebration,
    );
    return () => {
      window.removeEventListener(
        "lesson-completion:sequence-start",
        handleSequenceStart,
      );
      window.removeEventListener(
        "daily-goal:releaseQueuedCelebration",
        handleReleaseQueuedCelebration,
      );
    };
  }, [
    celebrateOpen,
    openDailyGoalCelebration,
    openPendingDailyGoalCelebration,
  ]);

  const handleSubmitPasscode = useCallback(
    async (input, setLocalError) => {
      const normalized = (input || "").trim();
      const expected = (subscriptionPasscode || "").trim();
      if (!expected) {
        const msg = uiCopy(appLanguage, {
          en: "Subscription passcode is not configured",
          es: "El código de acceso no está configurado",
          it: "Il codice abbonamento non è configurato",
          fr: "Le code abonne n'est pas configure",
          ja: "サブスクリプションのパスコードが設定されていません",
          zh: "订阅通行码尚未配置",
        });
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
          title: uiCopy(appLanguage, {
            en: "Passcode accepted",
            es: "Código aceptado",
            it: "Codice accettato",
            fr: "Code accepte",
            ja: "パスコードを確認しました",
            zh: "通行码已接受",
          }),
        });
      } catch (error) {
        console.error("Failed to save subscription passcode", error);
        const msg = uiCopy(appLanguage, {
          en: "Failed to save passcode",
          es: "No se pudo guardar el código",
          it: "Impossibile salvare il codice",
          fr: "Impossible d'enregistrer le code",
          ja: "パスコードを保存できませんでした",
          zh: "无法保存通行码",
        });
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
        const message = uiCopy(appLanguage, {
          en: "Connect your account to use this feature.",
          es: "Conecta tu cuenta para usar esta función.",
          it: "Collega il tuo account per usare questa funzione.",
          fr: "Connecte ton compte pour utiliser cette fonction.",
          ja: "この機能を使うにはアカウントを接続してください。",
          zh: "请连接你的账户以使用此功能。",
        });
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
        const message = uiCopy(appLanguage, {
          en: "Connect your account to use this feature.",
          es: "Conecta tu cuenta para usar esta función.",
          it: "Collega il tuo account per usare questa funzione.",
          fr: "Connecte ton compte pour utiliser cette fonction.",
          ja: "この機能を使うにはアカウントを接続してください。",
          zh: "请连接你的账户以使用此功能。",
        });
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

  const handleTutorVolumeChange = useCallback(
    (nextValue) => {
      const normalized = Math.max(
        0,
        Math.min(4, Math.round(nextValue * 10) / 10),
      );
      setTutorVolume(normalized);
      setSoundSettingsTutorVolume(normalized);
    },
    [setSoundSettingsTutorVolume],
  );

  const handleTutorVolumeSave = useCallback(
    async (nextValue) => {
      const normalized = Math.max(
        0,
        Math.min(4, Math.round(nextValue * 10) / 10),
      );
      const id = resolveNpub();
      if (!id) return;
      try {
        await updateDoc(doc(database, "users", id), {
          tutorVolume: normalized,
        });
        if (user) {
          setUser?.({ ...user, tutorVolume: normalized });
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
      const n = Number.isFinite(v) ? Math.round(v) : DEFAULT_VOICE_PAUSE_MS;
      return Math.max(200, Math.min(4000, Math.round(n / 100) * 100));
    };

    const prev = user?.progress || {
      level: "Pre-A1",
      supportLang: "en",
      voice: "marin",
      tutorVoice: normalizeTutorVoice(),
      tutorVoicePersona:
        translations?.en?.onboarding_persona_default_example || "",
      targetLang: "es",
      showTranslations: true,
      pauseMs: DEFAULT_VOICE_PAUSE_MS,
      helpRequest: "",
      practicePronunciation: false,
    };
    const nextSupportLang = normalizeSupportLanguage(
      partial.supportLang ?? prev.supportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const nextVoicePersona =
      personaForSupportLanguage(
        partial.tutorVoicePersona ??
          partial.voicePersona ??
          prev.tutorVoicePersona ??
          prev.voicePersona,
        nextSupportLang,
      ) ?? "";

    const next = {
      ...prev, // Preserve all existing progress data including XP
      level: migrateToCEFRLevel(partial.level ?? prev.level) ?? "Pre-A1",
      supportLang: nextSupportLang,
      // Only normalize an EXPLICIT voice change. Unrelated settings saves must
      // not rewrite the stored voice, or flipping the realtime provider would
      // clobber the other provider's saved pick on the next save.
      tutorVoice:
        partial.tutorVoice !== undefined
          ? normalizeTutorVoice(partial.tutorVoice)
          : (prev.tutorVoice ?? normalizeTutorVoice(prev.voice)),
      tutorVoicePersona: nextVoicePersona.slice(0, 240),
      targetLang: normalizePracticeLanguage(
        partial.targetLang ?? prev.targetLang,
        DEFAULT_TARGET_LANGUAGE,
      ),
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
    const derivedAppLanguage = normalizeSupportLanguage(
      next.supportLang,
      DEFAULT_SUPPORT_LANGUAGE,
    );

    // Strip subcollection-backed data from the progress field before writing
    // to the user document. languageLessons, tutorLanguageLessons, and languageFlashcards live in
    // their own subcollections and must not be duplicated (stale) in the doc.
    const {
      languageLessons: _ll,
      tutorLanguageLessons: _tll,
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
      const normalizedSupportLang = normalizeSupportLanguage(
        payload.supportLang,
        DEFAULT_SUPPORT_LANGUAGE,
      );
      const incomingPersona = safe(
        payload.tutorVoicePersona ?? payload.voicePersona,
        personaDefaultFor(normalizedSupportLang),
      );

      // Simplified onboarding - language settings, Tutor persona, and pause
      const normalized = {
        level: migrateToCEFRLevel(safe(payload.level, "Pre-A1")),
        supportLang: normalizedSupportLang,
        voice: "marin",
        tutorVoice: normalizeTutorVoice(payload.tutorVoice ?? payload.voice),
        tutorVoicePersona:
          personaForSupportLanguage(incomingPersona, normalizedSupportLang) ??
          personaDefaultFor(normalizedSupportLang),
        targetLang: normalizePracticeLanguage(
          payload.targetLang,
          DEFAULT_TARGET_LANGUAGE,
        ),
        pauseMs:
          typeof payload.pauseMs === "number"
            ? payload.pauseMs
            : DEFAULT_VOICE_PAUSE_MS,
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

      try {
        localStorage.setItem("appLanguage", uiLangForPersist);
      } catch {}
      syncDocumentLanguage(uiLangForPersist);
      setAppLanguage(uiLangForPersist);
      setPathMode("plate");

      const completedOnboarding = {
        ...(user?.onboarding || {}),
        completed: true,
        completedAt: now,
        currentStep: 1,
        draft: null,
      };

      await setDoc(
        doc(database, "users", id),
        {
          local_npub: id,
          updatedAt: now,
          appLanguage: uiLangForPersist,
          onboarding: completedOnboarding,
          xp: 0,
          streak: 0,
          progress: { ...normalized },
          identity: safe(payload.identity, user?.identity || null),
          soundEnabled: payload.soundEnabled !== false,
          soundVolume:
            typeof payload.soundVolume === "number" ? payload.soundVolume : 100,
          themeMode: normalizedThemeMode,
        },
        { merge: true },
      );

      rememberLocalOnboardingCompletion(id, now);

      // Arm the entire first-run modal chain before releasing the onboarding
      // route gate. Otherwise the returning-user proficiency effect can run in
      // the gap before the post-write hydration finishes and open over the goal.
      proficiencyCheckDoneRef.current = true;
      setShouldShowTimerAfterGoal(true);
      setShouldShowProficiencyAfterTimer(true);
      setDailyGoalOpen(true);

      // The write above is the durable completion point. Release the route
      // gate immediately instead of depending on another full DB hydration.
      setUser?.({
        ...(user || {}),
        id: user?.id || id,
        local_npub: id,
        updatedAt: now,
        appLanguage: uiLangForPersist,
        onboarding: completedOnboarding,
        xp: 0,
        streak: 0,
        progress: { ...(user?.progress || {}), ...normalized },
        identity: safe(payload.identity, user?.identity || null),
        soundEnabled: payload.soundEnabled !== false,
        soundVolume:
          typeof payload.soundVolume === "number" ? payload.soundVolume : 100,
        themeMode: normalizedThemeMode,
      });
      navigate("/", { replace: true });

      const fresh = await loadUserObjectFromDB(database, id);
      if (fresh) setUser?.(fresh);
    } catch (e) {
      console.error("Failed to complete onboarding:", e);
    }
  };

  const enrichLessonForGameReview = useCallback(
    async (lesson) => {
      if (!lesson) return lesson;
      if (lesson.gameReviewContext) return lesson;

      const inferredLevel =
        lesson?.content?.game?.cefrLevel ||
        inferCefrLevelFromLessonId(lesson.id) ||
        resolvedLevel ||
        "Pre-A1";
      const units = await loadLearningPath(resolvedTargetLang, inferredLevel);
      const unit =
        units.find((entry) =>
          entry?.lessons?.some((candidate) => candidate?.id === lesson.id),
        ) || null;
      const reviewContext = buildGameReviewContext({
        lesson,
        unit,
        fallbackLevel: inferredLevel,
        targetLang: resolvedTargetLang,
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
    // Ephemeral repair lessons aren't part of the learning path: no game-review
    // enrichment (their id isn't in any unit) and no lesson-progress writes.
    const enrichedLesson = lesson.isRepair
      ? lesson
      : await enrichLessonForGameReview(lesson);

    // Store pre-generated scenario for game lessons. Start the multi-module
    // tutorial's Greeting Plaza preparation before awaiting the client chunk,
    // so both pieces warm concurrently while the learner is still entering
    // the tutorial and completing its earlier activities.
    const tutorialPreparationToken =
      tutorialGamePreparationTokenRef.current + 1;
    tutorialGamePreparationTokenRef.current = tutorialPreparationToken;
    setPreGeneratedGameScenario(preGeneratedScenario || null);
    setTutorialGameScenario(null);
    setTutorialGamePreparationFailed(false);
    setTutorialGameRevealReady(false);
    if (enrichedLesson.isTutorial && enrichedLesson.modes?.includes("game")) {
      void prepareTutorialGameScenario({
        lesson: enrichedLesson,
        targetLang: resolvedTargetLang,
        supportLang: resolvedSupportLang,
      })
        .then((scenario) => {
          if (
            tutorialPreparationToken ===
              tutorialGamePreparationTokenRef.current &&
            scenario
          ) {
            setTutorialGameScenario(scenario);
          }
        })
        .catch((error) => {
          if (
            tutorialPreparationToken !== tutorialGamePreparationTokenRef.current
          ) {
            return;
          }
          console.error("Failed to pre-generate tutorial game:", error);
          setTutorialGamePreparationFailed(true);
        });
    }

    // Standalone games resolve the client before their immediate view flip.
    // The multi-module tutorial warms it without blocking the first tutorial
    // activity because its game step comes last.
    if (enrichedLesson.isGame || enrichedLesson.modes?.includes("game")) {
      const componentPromise = loadRPGGameComponent();
      if (enrichedLesson.isTutorial && !enrichedLesson.isGame) {
        void componentPromise
          .then((component) => setGameRouterComponent(() => component))
          .catch((error) => {
            console.error("Failed to warm tutorial game client:", error);
          });
      } else {
        try {
          const component = await componentPromise;
          setGameRouterComponent(() => component);
        } catch (error) {
          // Non-fatal: the game view falls back to its quiet loader and the
          // component-load effect retries.
          console.error("Failed to preload game client:", error);
        }
      }
    }

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

      if (npub && !enrichedLesson.isRepair) {
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
      if (
        tutorialPreparationToken === tutorialGamePreparationTokenRef.current
      ) {
        tutorialGamePreparationTokenRef.current += 1;
      }
      console.error("Failed to start lesson:", e);
      toast({
        title: "Error",
        description: uiCopy(appLanguage, {
          en: "Failed to start lesson",
          es: "No se pudo iniciar la lección",
          it: "Impossibile avviare la lezione",
          fr: "Impossible de demarrer la lecon",
          ja: "レッスンを開始できませんでした",
          zh: "无法开始课程",
        }),
        status: "error",
        duration: 3000,
      });
      return false;
    }
  };
  // Latest-instance ref so stable callbacks (e.g. the plate's repair routing)
  // can launch a lesson without depending on this per-render function.
  const handleStartLessonRef = useRef(handleStartLesson);
  handleStartLessonRef.current = handleStartLesson;

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
              },
            },
            { merge: true },
          ),
          ...(flashcardActivityKey
            ? [
                recordPlateActivity(
                  npub,
                  "review",
                  activityLanguageKey,
                  new Date(updatedAt),
                ),
              ]
            : []),
          setDoc(
            flashcardProgressRef,
            {
              targetLang: resolvedTargetLang,
              cardId: card.id,
              // Generated cards (repair decks) aren't in the predefined
              // library, so the first answer stores the card's definition
              // alongside its progress — that's what adds it to the main
              // deck (FlashcardSkillTree merges these into the queues).
              ...(card.isRepair &&
              card.concept &&
              typeof card.concept === "object"
                ? {
                    card: {
                      id: card.id,
                      concept: card.concept,
                      cefrLevel: card.cefrLevel || "A1",
                      category: card.category || "repair",
                      type: card.type || "phrase",
                      isRepair: true,
                    },
                  }
                : {}),
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
          title: "Error",
          description: uiCopy(appLanguage, {
            en: "Failed to save progress",
            es: "No se pudo guardar el progreso",
            it: "Impossibile salvare i progressi",
            fr: "Impossible d'enregistrer la progression",
            ja: "進捗を保存できませんでした",
            zh: "无法保存进度",
          }),
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
    tutorialGamePreparationTokenRef.current += 1;
    setViewMode("skillTree");
    setActiveLesson(null);
    setPreGeneratedGameScenario(null);
    setTutorialGameScenario(null);
    setTutorialGamePreparationFailed(false);
    setTutorialGameRevealReady(false);
    setLessonStartXp(null);
    previousXpRef.current = null;
    lessonCompletionTriggeredRef.current = false;
    activeLessonLanguageRef.current = resolvedTargetLang;
    // Reset tutorial state
    setIsTutorialMode(false);
    setTutorialCompletedModules([]);
    setShowTutorialPopovers(false);
    // Belt-and-suspenders: clear the lesson-detail modal payload from the
    // store. If it's still flagged open (e.g. user got into a lesson via a
    // path that didn't go through closeLessonDetail), the SkillTree re-mount
    // would otherwise pop the modal back up.
    useModalStore.getState().closeLessonDetail();
    if (typeof window !== "undefined") {
      localStorage.setItem("viewMode", "skillTree");
      localStorage.removeItem("activeLesson");
    }
  }, [resolvedTargetLang]);

  const triggerLessonCompletion = useCallback(
    async (reason = "manual", completion = null) => {
      if (!activeLesson || lessonCompletionTriggeredRef.current) return;

      console.log("[Lesson Completion] Triggered", { reason, activeLesson });
      lessonCompletionTriggeredRef.current = true;
      lessonCompletionSequenceActiveRef.current = true;

      const npub = resolveNpub();
      if (!npub) {
        lessonCompletionTriggeredRef.current = false;
        lessonCompletionSequenceActiveRef.current = false;
        return;
      }

      const lessonLang = activeLessonLanguageRef.current || resolvedTargetLang;
      const earnedXp = Math.max(
        0,
        Number(completion?.xpEarned ?? activeLesson.xpReward) || 0,
      );

      try {
        if (activeLesson.isRepair) {
          // Repair flow: stay put — no lesson-completion modal and NO
          // navigation here. completeRepairLesson flips the plate's repair
          // course, the "task complete" celebration renders over this view,
          // and ITS Continue button moves the learner onward
          // (handlePlateCelebrationContinue → next task / plate home).
          //
          // Release the celebration blockers BEFORE any network waits: there
          // is no lesson-modal chain here, and the course flips via local
          // store patches inside completeRepairLesson — the modal should
          // appear the moment the objective completes, not after the writes
          // and the profile reload settle.
          lessonCompletionSequenceActiveRef.current = false;
          // Repair XP is tagged "repairLesson" so it doesn't also advance the
          // separate Learn task; the plate count comes from
          // completeRepairLesson (uses the live focus, or the data embedded
          // in the lesson if the app reloaded mid-lesson).
          deferDailyGoalCelebrationRef.current = true;
          await Promise.all([
            completeRepairLesson({
              lesson: activeLesson,
              npub,
              targetLang: lessonLang,
            }),
            awardXp(npub, activeLesson.xpReward, lessonLang, "repairLesson"),
          ]);
          const freshRepair = await loadUserObjectFromDB(database, npub);
          if (freshRepair) setUser?.(freshRepair);
          return;
        }

        // completeLesson marks the lesson complete (status tracking only, no XP)
        await completeLesson(npub, activeLesson.id, earnedXp, lessonLang);

        deferDailyGoalCelebrationRef.current = true;
        await awardXp(npub, earnedXp, lessonLang, "lesson");

        const fresh = await loadUserObjectFromDB(database, npub);
        if (fresh) setUser?.(fresh);

        if (!activeLesson.isGame && !activeLesson.isTutorial) {
          void warmUpcomingGameReview(
            activeLesson,
            lessonLang,
            resolvedSupportLang,
          );
        }

        const lessonData = {
          title: activeLesson.title,
          xpEarned: earnedXp,
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
          if (pendingLessonCompletionRef.current) {
            setShowCompletionModal(true);
            pendingLessonCompletionRef.current = null;
          }
        }, 150);
      } catch (err) {
        console.error("Failed to complete lesson:", err);
        lessonCompletionTriggeredRef.current = false;
        lessonCompletionSequenceActiveRef.current = false;
      }
    },
    [
      activeLesson,
      handleReturnToSkillTree,
      resolveNpub,
      resolvedSupportLang,
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
      // Single-module lesson (e.g. the repair flashcards lesson): no module to
      // hop to, so remount the current one for a fresh question instead of
      // silently doing nothing (which left "Next question" frozen).
      setLessonModuleNonce((n) => n + 1);
      return;
    }

    // Filter out current mode to ensure we switch to a different one
    const otherModes = availableModes.filter((mode) => mode !== currentTab);
    if (otherModes.length === 0) {
      setLessonModuleNonce((n) => n + 1);
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
    lessonCompletionSequenceActiveRef.current = false;

    const openedDailyGoalCelebration = openPendingDailyGoalCelebration();

    if (pendingTutorialBitcoinModalRef.current) {
      // Queue the Bitcoin modal and let the effect below wait until the
      // previous Chakra modal overlay is fully gone before opening it.
      setPendingTutorialBitcoinModal(true);
      pendingTutorialBitcoinModalRef.current = false;
    }

    if (openedDailyGoalCelebration) return;

    // Return to skill tree
    handleReturnToSkillTree();
  }, [handleReturnToSkillTree, openPendingDailyGoalCelebration]);

  const handleCloseTutorialBitcoinModal = useCallback(() => {
    setShowTutorialBitcoinModal(false);
    setPendingTutorialBitcoinModal(false);
    pendingTutorialBitcoinModalRef.current = false;
    if (!user?.gettingStartedModalShown) {
      setPendingInstallModalAfterTutorial(true);
    }
    void markTutorialBitcoinModalShown();
  }, [markTutorialBitcoinModalShown, user?.gettingStartedModalShown]);

  const handleTutorFirstLessonComplete = useCallback(() => {
    if (user?.tutorialBitcoinModalShown) {
      if (!user?.gettingStartedModalShown) {
        setPendingInstallModalAfterTutorial(true);
      }
      return;
    }

    setPendingTutorialBitcoinModal(true);
  }, [user?.gettingStartedModalShown, user?.tutorialBitcoinModalShown]);

  const handleTutorDailyGoalCelebration = useCallback(
    (detail = {}) => {
      pendingDailyGoalCelebrationRef.current = null;
      deferDailyGoalCelebrationRef.current = false;
      const openCelebration = () => openDailyGoalCelebration(detail);

      if (typeof window === "undefined" || typeof document === "undefined") {
        openCelebration();
        return true;
      }

      let cancelled = false;
      let opened = false;
      const startedAt = Date.now();
      const tryOpen = () => {
        if (cancelled || opened) return;
        const activeModalStack = Array.from(
          document.querySelectorAll(
            ".chakra-modal__content-container, .chakra-modal__overlay",
          ),
        ).filter((element) => {
          const style = window.getComputedStyle(element);
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            element.getAttribute("aria-hidden") !== "true"
          );
        }).length;
        if (!activeModalStack || Date.now() - startedAt > 900) {
          opened = true;
          openCelebration();
          return;
        }
        window.setTimeout(tryOpen, 60);
      };

      window.requestAnimationFrame(() => {
        window.setTimeout(tryOpen, 0);
      });
      return true;
    },
    [openDailyGoalCelebration],
  );

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
    deferDailyGoalCelebrationRef.current = false;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("daily-goal:celebration-closed"));
    }

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

      if (!modalStackStillClosing) {
        setShowTutorialBitcoinModal(true);
        setPendingTutorialBitcoinModal(false);
        return;
      }

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

  // dailyGoalOpen/timerModalOpen aren't in the dep array because they live in
  // useModalStore — read with getState() inside the run, re-fired by the
  // subscribe() below. This keeps App from re-rendering on a timer-modal tap.
  useEffect(() => {
    let cancelled = false;
    let timeoutId = null;
    let rafId = null;

    const tryOpenGettingStarted = () => {
      if (cancelled) return;

      const activeModalContainers = document.querySelectorAll(
        ".chakra-modal__content-container",
      ).length;
      const activeModalOverlays = document.querySelectorAll(
        ".chakra-modal__overlay",
      ).length;
      const modalStackStillClosing =
        activeModalContainers > 0 || activeModalOverlays > 0;

      if (!modalStackStillClosing) {
        setGettingStartedOpen(true);
        setPendingInstallModalAfterTutorial(false);
        return;
      }

      timeoutId = window.setTimeout(tryOpenGettingStarted, 60);
    };

    const evaluate = () => {
      if (cancelled) return;
      if (!pendingInstallModalAfterTutorial) return;

      if (user?.gettingStartedModalShown) {
        setPendingInstallModalAfterTutorial(false);
        return;
      }

      const m = useModalStore.getState();
      if (
        showTutorialBitcoinModal ||
        celebrateOpen ||
        showCompletionModal ||
        showProficiencyCompletionModal ||
        m.dailyGoalOpen ||
        m.timerModalOpen ||
        proficiencyTestOpen ||
        modesIntroOpen ||
        gettingStartedOpen
      ) {
        return;
      }

      if (typeof window === "undefined" || typeof document === "undefined") {
        setGettingStartedOpen(true);
        setPendingInstallModalAfterTutorial(false);
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        timeoutId = window.setTimeout(tryOpenGettingStarted, 0);
      });
    };

    evaluate();

    const unsubscribe = useModalStore.subscribe((state, prev) => {
      if (
        state.dailyGoalOpen !== prev.dailyGoalOpen ||
        state.timerModalOpen !== prev.timerModalOpen
      ) {
        evaluate();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    celebrateOpen,
    gettingStartedOpen,
    modesIntroOpen,
    pendingInstallModalAfterTutorial,
    proficiencyTestOpen,
    showCompletionModal,
    showProficiencyCompletionModal,
    showTutorialBitcoinModal,
    user?.gettingStartedModalShown,
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
          uiCopy(appLanguage, {
            en: "Account required",
            es: "Cuenta requerida",
            it: "Account richiesto",
            fr: "Compte requis",
            ja: "アカウントが必要です",
          });
        const description =
          t.app_cefr_need_account ||
          uiCopy(appLanguage, {
            en: "Connect your account to analyze your level.",
            es: "Conéctate para analizar tu nivel con la IA.",
            it: "Collega il tuo account per analizzare il tuo livello con l'IA.",
            fr: "Connecte ton compte pour analyser ton niveau avec l'IA.",
            ja: "AIでレベルを分析するにはアカウントを接続してください。",
          });
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

        const localeName = getLanguagePromptName(appLanguage) || "English";
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
          uiCopy(appLanguage, {
            en: "Analysis complete",
            es: "Análisis completado",
            it: "Analisi completata",
            fr: "Analyse terminee",
            ja: "分析が完了しました",
          });
        const successDescTemplate =
          t.app_cefr_success_desc ||
          uiCopy(appLanguage, {
            en: "Assigned level: {level}.",
            es: "Nivel asignado: {level}.",
            it: "Livello assegnato: {level}.",
            fr: "Niveau attribue : {level}.",
            ja: "判定レベル: {level}",
          });

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
          uiCopy(appLanguage, {
            en: "Analysis failed",
            es: "No se pudo analizar",
            it: "Analisi non riuscita",
            fr: "Analyse impossible",
            ja: "分析できませんでした",
          });
        const errorDesc =
          t.app_cefr_error ||
          uiCopy(appLanguage, {
            en: "Please try again later.",
            es: "Vuelve a intentarlo más tarde.",
            it: "Riprova piu tardi.",
            fr: "Reessaie plus tard.",
            ja: "あとでもう一度試してください。",
          });
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
    const shouldOpenTimer = shouldShowTimerAfterGoal;
    blurActiveElement();

    flushSync(() => {
      setDailyGoalOpen(false);
      if (shouldOpenTimer) {
        setShouldShowTimerAfterGoal(false);
        setTimerModalImmediateBody(true);
        setTimerModalOpen(true);
      }
    });
  }, [blurActiveElement, shouldShowTimerAfterGoal]);

  const handleDailyGoalSave = useCallback(
    (goalValue) => {
      const parsedGoal = Math.max(
        1,
        Math.min(1000, Math.round(Number(goalValue) || 0)),
      );
      const now = new Date();

      const shouldOpenTimer = shouldShowTimerAfterGoal;
      blurActiveElement();

      flushSync(() => {
        setDailyGoalOpen(false);
        if (shouldOpenTimer) {
          setShouldShowTimerAfterGoal(false);
          setTimerModalImmediateBody(true);
          setTimerModalOpen(true);
        }
      });

      const commitDailyGoal = () => {
        // Only change the target for the day. Never reset XP already earned,
        // the day's window, or the celebration/pet state — changing the goal
        // adjusts what's required, it doesn't erase progress.
        patchUser?.({ dailyGoalXp: parsedGoal });

        if (!activeNpub) {
          toast({
            status: "error",
            title: uiCopy(appLanguage, {
              en: "Save failed",
              es: "Error al guardar",
              it: "Salvataggio non riuscito",
              fr: "Echec de l'enregistrement",
              ja: "保存に失敗しました",
              zh: "保存失败",
            }),
            description: uiCopy(appLanguage, {
              en: "Couldn't find the current user.",
              es: "No se encontró el usuario actual.",
              it: "Impossibile trovare l'utente corrente.",
              fr: "Impossible de trouver l'utilisateur actuel.",
              ja: "現在のユーザーが見つかりませんでした。",
              zh: "找不到当前用户。",
            }),
          });
          return;
        }

        void setDoc(
          doc(database, "users", activeNpub),
          {
            dailyGoalXp: parsedGoal,
            updatedAt: now.toISOString(),
          },
          { merge: true },
        ).catch((error) => {
          console.error("Failed to save daily goal:", error);
          toast({
            status: "error",
            title: uiCopy(appLanguage, {
              en: "Save failed",
              es: "Error al guardar",
              it: "Salvataggio non riuscito",
              fr: "Echec de l'enregistrement",
              ja: "保存に失敗しました",
              zh: "保存失败",
            }),
            description: String(error?.message || error),
          });
        });
      };

      runAfterNextPaint(commitDailyGoal);
    },
    [
      activeNpub,
      appLanguage,
      blurActiveElement,
      patchUser,
      runAfterNextPaint,
      shouldShowTimerAfterGoal,
      toast,
    ],
  );

  // Customize the daily-goal companion. Empty string clears the custom name and
  // falls back to the localized default ("Your companion").
  const handleCustomizePet = useCallback(
    (payload, fallbackPetType) => {
      const rawName =
        payload && typeof payload === "object" ? payload.name : payload;
      const rawPetType =
        payload && typeof payload === "object"
          ? payload.petType
          : fallbackPetType;
      const name = String(rawName || "")
        .trim()
        .slice(0, 24);
      const petType = getEffectivePetType(rawPetType, companionLevel);

      // Optimistic local update so the quest panel, goal modal, and
      // celebration all reflect the customization immediately.
      patchUser?.({ dailyGoalPetName: name, dailyGoalPetType: petType });

      if (!activeNpub) return;

      void setDoc(
        doc(database, "users", activeNpub),
        {
          dailyGoalPetName: name,
          dailyGoalPetType: petType,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      ).catch((error) => {
        console.error("Failed to save companion customization:", error);
        toast({
          status: "error",
          title: uiCopy(appLanguage, {
            en: "Save failed",
            es: "Error al guardar",
            it: "Salvataggio non riuscito",
            fr: "Echec de l'enregistrement",
            ja: "保存に失敗しました",
            zh: "保存失败",
          }),
          description: String(error?.message || error),
        });
      });
    },
    [activeNpub, appLanguage, companionLevel, patchUser, toast],
  );

  const handleCloseCompanionUnlockModal = useCallback(() => {
    setCompanionUnlockModal(null);
    setCompanionUnlockQueueTick((tick) => tick + 1);
  }, []);

  const handleEquipCompanionUnlock = useCallback(() => {
    if (companionUnlockModal?.type) {
      handleCustomizePet({
        name: user?.dailyGoalPetName || "",
        petType: companionUnlockModal.type,
      });
    }
    setCompanionUnlockModal(null);
    setCompanionUnlockQueueTick((tick) => tick + 1);
  }, [companionUnlockModal, handleCustomizePet, user?.dailyGoalPetName]);

  useEffect(() => {
    if (companionUnlockModal) {
      playSound(sparkleSound);
    }
  }, [companionUnlockModal, playSound]);

  const handleTimerModalClose = useCallback(() => {
    const shouldOpenProficiency = shouldShowProficiencyAfterTimer;

    flushSync(() => {
      setTimerModalOpen(false);
      setTimerModalImmediateBody(false);
      if (shouldOpenProficiency) {
        proficiencyCheckDoneRef.current = true;
        setShouldShowProficiencyAfterTimer(false);
        setProficiencyTestOpen(true);
      }
    });
  }, [shouldShowProficiencyAfterTimer]);

  const handleProficiencySkip = useCallback(async () => {
    flushSync(() => {
      setProficiencyTestOpen(false);
    });
    // Record the decision locally FIRST so the next modal in the chain (the
    // modes-intro "How it works" carousel, which waits for proficiencyPlacement)
    // opens immediately — don't make it wait on the Firestore round-trip.
    // "skipped" is a sentinel — treated as falsy by the placement check but
    // truthy enough to prevent the modal from re-opening.
    patchUser?.({
      proficiencyPlacement: "skipped",
      proficiencyPlacements: {
        ...(user?.proficiencyPlacements || {}),
        [resolvedTargetLang]: "skipped",
      },
    });
    // Persist skip so the modal doesn't reappear every session.
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
      } catch (e) {
        console.warn("Failed to persist proficiency skip:", e);
      }
    }
  }, [resolveNpub, patchUser, user?.proficiencyPlacements, resolvedTargetLang]);

  const handleProficiencyTakeTest = useCallback(() => {
    proficiencyCheckDoneRef.current = true;
    setProficiencyTestOpen(false);
    navigate("/proficiency");
  }, [navigate]);

  // Modes intro carousel: close + persist so it only ever shows once.
  const handleModesIntroClose = useCallback(async () => {
    setModesIntroOpen(false);
    const id = resolveNpub();
    if (!id) return;
    try {
      await setDoc(
        doc(database, "users", id),
        { modesIntroShown: true, updatedAt: new Date().toISOString() },
        { merge: true },
      );
      patchUser?.({ modesIntroShown: true });
    } catch (e) {
      console.warn("Failed to persist modes intro shown flag:", e);
    }
  }, [resolveNpub, patchUser]);

  // Install modal: mark as shown and persist to Firestore.
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
    runAfterNextPaint(() => {
      markGettingStartedShown();
    });
  }, [markGettingStartedShown, runAfterNextPaint]);

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
        ? `${goalCopy} and now have ${totalXp} XP total on https://piyali.app practicing ${langLabel}! ${NOSTR_PROGRESS_HASHTAG}`
        : `I just reached ${totalXp} XP on https://piyali.app practicing ${langLabel}! ${NOSTR_PROGRESS_HASHTAG}`;
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
    const handleLocalXpAward = (event) => {
      const detail = event?.detail || {};
      const eventNpub = typeof detail.npub === "string" ? detail.npub : "";
      if (eventNpub && activeNpub && eventNpub !== activeNpub) return;

      const nextDailyXp = Number(detail.dailyXp);
      const nextDailyGoalXp = Number(detail.dailyGoalXp);
      const todayKey =
        typeof detail.todayKey === "string" ? detail.todayKey : "";
      const dailyPatch = {};
      if (Number.isFinite(nextDailyXp)) dailyPatch.dailyXp = nextDailyXp;
      if (Number.isFinite(nextDailyGoalXp)) {
        dailyPatch.dailyGoalXp = nextDailyGoalXp;
      }
      if (todayKey && Number.isFinite(nextDailyXp)) {
        const latestUser = useUserStore.getState()?.user || {};
        dailyPatch.dailyXpRecent = {
          ...(latestUser.dailyXpRecent || latestUser.dailyXpHistory || {}),
          [todayKey]: nextDailyXp,
        };
      }
      if (Object.keys(dailyPatch).length) patchUser?.(dailyPatch);

      const awardedTargetLang =
        typeof detail.targetLang === "string"
          ? detail.targetLang.trim().toLowerCase()
          : "";
      const activeTargetLang = String(resolvedTargetLang || "")
        .trim()
        .toLowerCase();
      const xpAmount = Math.max(0, Number(detail.amount) || 0);
      const nextLanguageXp = Number(detail.languageXp);
      if (
        xpAmount > 0 &&
        Number.isFinite(nextLanguageXp) &&
        (!awardedTargetLang || awardedTargetLang === activeTargetLang)
      ) {
        const source = String(detail.source || "");
        const previousCompanionLevel = getCompanionLevelFromXp(
          Math.max(0, nextLanguageXp - xpAmount),
        );
        const nextCompanionLevel = getCompanionLevelFromXp(nextLanguageXp);
        queueCompanionUnlocks(
          getNewlyUnlockedPetTypes(previousCompanionLevel, nextCompanionLevel),
          nextCompanionLevel,
          {
            expectsModal:
              source === "lesson" ||
              source === "repairLesson" ||
              source === "speak",
          },
        );
      }

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
  }, [
    activeNpub,
    hasSpendableBalance,
    patchUser,
    queueCompanionUnlocks,
    resolvedTargetLang,
    sendOneSatToNpub,
    user?.identity,
  ]);

  useEffect(() => {
    if (!activeNpub) return;

    const targetLang = String(resolvedTargetLang || "es").toLowerCase();
    const lessonProgressRef = query(
      collection(database, "users", activeNpub, "languageLessons"),
      where("targetLang", "==", targetLang),
    );
    const flashcardProgressRef = query(
      collection(database, "users", activeNpub, "languageFlashcards"),
      where("targetLang", "==", targetLang),
    );
    const tutorLessonProgressRef = query(
      collection(database, "users", activeNpub, "tutorLanguageLessons"),
      where("targetLang", "==", targetLang),
    );

    const unsubLessons = onSnapshot(lessonProgressRef, (snapshot) => {
      const languageLessons = {};
      const legacyTutorLanguageLessons = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (isLegacyTutorLessonProgress(data)) {
          addLanguageLessonProgress(legacyTutorLanguageLessons, data);
          return;
        }
        addLanguageLessonProgress(languageLessons, data);
      });

      const latestUser = useUserStore.getState()?.user || {};
      const currentProgress = latestUser?.progress || {};
      const tutorLanguageLessons = mergeLanguageLessonProgressMaps(
        legacyTutorLanguageLessons,
        currentProgress?.tutorLanguageLessons,
      );

      patchUser?.({
        progress: {
          ...currentProgress,
          languageLessons,
          tutorLanguageLessons,
        },
      });
    });

    const unsubTutorLessons = onSnapshot(tutorLessonProgressRef, (snapshot) => {
      const tutorLanguageLessons = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        addLanguageLessonProgress(tutorLanguageLessons, data);
      });

      const latestUser = useUserStore.getState()?.user || {};
      const currentProgress = latestUser?.progress || {};
      const mergedTutorLanguageLessons = mergeLanguageLessonProgressMaps(
        currentProgress?.tutorLanguageLessons,
        tutorLanguageLessons,
      );

      patchUser?.({
        progress: {
          ...currentProgress,
          tutorLanguageLessons: mergedTutorLanguageLessons,
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
      unsubTutorLessons();
      unsubFlashcards();
    };
  }, [activeNpub, patchUser, resolvedTargetLang]);

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
      // tutorLanguageLessons/languageFlashcards data written by saveGlobalSettings. The subcollection
      // listeners and loadUserObjectFromDB are the only sources of truth for
      // these maps, so strip them from rawProgress before merging.
      const {
        languageLessons: _rawLL,
        tutorLanguageLessons: _rawTLL,
        languageFlashcards: _rawLF,
        ...rawProgressWithoutSubcollections
      } = rawProgress;

      const progressPayload = {
        ...existingProgress,
        ...rawProgressWithoutSubcollections,
        languageLessons: existingProgress?.languageLessons ?? {},
        tutorLanguageLessons: existingProgress?.tutorLanguageLessons ?? {},
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
        Object.keys(existingProgress?.tutorLanguageLessons || {}).length > 0 ||
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
      if (typeof data?.dailyGoalPetName === "string")
        patch.dailyGoalPetName = data.dailyGoalPetName;
      if (typeof data?.dailyGoalPetType === "string")
        patch.dailyGoalPetType = normalizePetType(data.dailyGoalPetType);
      if (typeof data?.dailyGoalPetLastDelta === "number")
        patch.dailyGoalPetLastDelta = data.dailyGoalPetLastDelta;
      if (typeof data?.dailyGoalPetLastOutcome === "string")
        patch.dailyGoalPetLastOutcome = data.dailyGoalPetLastOutcome;
      if (data?.dailyGoalPetLastUpdatedAt)
        patch.dailyGoalPetLastUpdatedAt = data.dailyGoalPetLastUpdatedAt;
      if (typeof data?.goalStreakCount === "number")
        patch.goalStreakCount = data.goalStreakCount;
      if (typeof data?.lastGoalDayKey === "string")
        patch.lastGoalDayKey = data.lastGoalDayKey;
      if (data?.dailyXpRecent && typeof data.dailyXpRecent === "object")
        patch.dailyXpRecent = data.dailyXpRecent;
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

      const previousXp = prevXpRef.current;
      const diff = newXp - previousXp;
      prevXpRef.current = newXp;

      if (diff > 0) {
        const previousCompanionXp = getLanguageXp(
          existingProgress,
          resolvedTargetLang,
        );
        const nextCompanionXp = getLanguageXp(
          progressPayload,
          resolvedTargetLang,
        );
        if (nextCompanionXp > previousCompanionXp) {
          const previousCompanionLevel =
            getCompanionLevelFromXp(previousCompanionXp);
          const nextCompanionLevel = getCompanionLevelFromXp(nextCompanionXp);
          const newlyUnlockedPets = getNewlyUnlockedPetTypes(
            previousCompanionLevel,
            nextCompanionLevel,
          );
          queueCompanionUnlocks(newlyUnlockedPets, nextCompanionLevel, {
            expectsModal: viewMode === "lesson" && Boolean(activeLesson),
          });
        }

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
            uiCopy(appLanguage, {
              en: "Nice job!",
              es: "¡Buen trabajo!",
              it: "Ottimo lavoro!",
              fr: "Bien joue !",
              ja: "よくできました！",
              zh: "做得好！",
            });
          const descTpl =
            t?.random_toast_desc ??
            uiCopy(appLanguage, {
              en: "You earned +{xp} XP.",
              es: "Ganaste +{xp} XP.",
              it: "Hai guadagnato +{xp} XP.",
              fr: "Tu as gagne +{xp} XP.",
              ja: "+{xp} XPを獲得しました。",
              zh: "你获得了 +{xp} XP。",
            });
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
    queueCompanionUnlocks,
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
              targetLang={user?.progress?.targetLang}
              showTranslations={user?.progress?.showTranslations}
              pauseMs={user?.progress?.pauseMs ?? DEFAULT_VOICE_PAUSE_MS}
              helpRequest={user?.progress?.helpRequest}
              practicePronunciation={user?.progress?.practicePronunciation}
              bottomActionBarMinimized={isBottomActionBarMinimized}
              onSwitchedAccount={handleSwitchedAccount}
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
              pauseMs={user?.progress?.pauseMs ?? DEFAULT_VOICE_PAUSE_MS}
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
    "Pre-A1": { flashcards: 100, lessons: LESSON_COUNTS["Pre-A1"] }, // 86 runtime lessons
    A1: { flashcards: 300, lessons: LESSON_COUNTS.A1 }, // 14 units x 7 lessons
    A2: { flashcards: 250, lessons: LESSON_COUNTS.A2 }, // 18 units x 7 lessons
    B1: { flashcards: 200, lessons: LESSON_COUNTS.B1 }, // 15 units x 7 lessons
    B2: { flashcards: 150, lessons: LESSON_COUNTS.B2 }, // 12 units x 7 lessons
    C1: { flashcards: 100, lessons: LESSON_COUNTS.C1 }, // 10 units x 7 lessons
    C2: { flashcards: 50, lessons: LESSON_COUNTS.C2 }, // 8 units x 7 lessons
  };

  const CEFR_LEVEL_INFO = {
    "Pre-A1": {
      name: {
        en: "Ultimate Beginner",
        es: "Principiante Total",
        pt: "Iniciante absoluto",
        it: "Principiante assoluto",
        fr: "Grand debutant",
        zh: "零基础入门",
      },
      color: "#8B5CF6",
      gradient: "linear(135deg, #A78BFA, #8B5CF6)",
      description: {
        en: "First words and recognition",
        es: "Primeras palabras y reconocimiento",
        pt: "Primeiras palavras e reconhecimento",
        it: "Prime parole e riconoscimento",
        fr: "Premiers mots et reconnaissance",
        zh: "最初的词语与识别",
      },
    },
    A1: {
      name: {
        en: "Beginner",
        es: "Principiante",
        pt: "Iniciante",
        it: "Principiante",
        fr: "Debutant",
        zh: "初学者",
      },
      color: "#3B82F6",
      gradient: "linear(135deg, #60A5FA, #3B82F6)",
      description: {
        en: "Basic survival language",
        es: "Lenguaje básico de supervivencia",
        pt: "Linguagem básica de sobrevivência",
        it: "Lingua essenziale di base",
        fr: "Langue essentielle de base",
        zh: "基础生存语言",
      },
    },
    A2: {
      name: {
        en: "Elementary",
        es: "Elemental",
        pt: "Elementar",
        it: "Elementare",
        fr: "Elementaire",
        zh: "初级",
      },
      color: "#8B5CF6",
      gradient: "linear(135deg, #A78BFA, #8B5CF6)",
      description: {
        en: "Simple everyday communication",
        es: "Comunicación cotidiana simple",
        pt: "Comunicação cotidiana simples",
        it: "Comunicazione quotidiana semplice",
        fr: "Communication simple du quotidien",
        zh: "简单日常交流",
      },
    },
    B1: {
      name: {
        en: "Intermediate",
        es: "Intermedio",
        pt: "Intermediário",
        it: "Intermedio",
        fr: "Intermediaire",
        zh: "中级",
      },
      color: "#A855F7",
      gradient: "linear(135deg, #C084FC, #A855F7)",
      description: {
        en: "Handle everyday situations",
        es: "Manejo de situaciones cotidianas",
        pt: "Lidar com situações do dia a dia",
        it: "Gestire situazioni quotidiane",
        fr: "Gerer les situations quotidiennes",
        zh: "应对日常情境",
      },
    },
    B2: {
      name: {
        en: "Upper Intermediate",
        es: "Intermedio Alto",
        pt: "Intermediário avançado",
        it: "Intermedio alto",
        fr: "Intermediaire avance",
        zh: "中高级",
      },
      color: "#F97316",
      gradient: "linear(135deg, #FB923C, #F97316)",
      description: {
        en: "Complex discussions",
        es: "Discusiones complejas",
        pt: "Discussões complexas",
        it: "Discussioni complesse",
        fr: "Discussions complexes",
        zh: "复杂讨论",
      },
    },
    C1: {
      name: {
        en: "Advanced",
        es: "Avanzado",
        pt: "Avançado",
        it: "Avanzato",
        fr: "Avance",
        zh: "高级",
      },
      color: "#EF4444",
      gradient: "linear(135deg, #F87171, #EF4444)",
      description: {
        en: "Sophisticated language use",
        es: "Uso sofisticado del idioma",
        pt: "Uso sofisticado do idioma",
        it: "Uso sofisticato della lingua",
        fr: "Usage sophistique de la langue",
        zh: "成熟精细的语言运用",
      },
    },
    C2: {
      name: {
        en: "Mastery",
        es: "Maestría",
        pt: "Domínio",
        it: "Padronanza",
        fr: "Maitrise",
        zh: "精通",
      },
      color: "#EC4899",
      gradient: "linear(135deg, #F472B6, #EC4899)",
      description: {
        en: "Near-native proficiency",
        es: "Competencia casi nativa",
        pt: "Proficiência quase nativa",
        it: "Competenza quasi nativa",
        fr: "Competence quasi native",
        zh: "接近母语水平",
      },
    },
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
    if (
      !Array.isArray(realWorldTasks.tasks) ||
      realWorldTasks.tasks.length !== 3
    ) {
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
    return generatedAt + REAL_WORLD_TASKS_REFRESH_MS;
  }, [realWorldTasks, resolvedTargetLang]);

  const realWorldTasksLastOpenedAt = user?.realWorldTasksLastOpenedAt
    ? new Date(user.realWorldTasksLastOpenedAt).getTime()
    : 0;

  // Show the notification badge when the tasks are ready and the user
  // hasn't opened the modal since the ready state began.
  const realWorldTasksHasNotification =
    realWorldTasksReady &&
    realWorldTasksLastOpenedAt <
      Math.max(1, realWorldTasksReadySince || tasksTickNow);

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

  const handleRealWorldRewardClaimed = useCallback(async () => {
    const npub = resolveNpub();
    if (!npub) return;
    // Match the pattern used by lesson completion and flashcard review:
    // re-read the full user doc from Firestore after awardXp so every
    // downstream consumer (XP counter, daily goal progress bar, etc.)
    // stays in sync.
    try {
      const fresh = await loadUserObjectFromDB(database, npub);
      if (fresh) setUser?.(fresh);
    } catch (err) {
      console.error("Failed to refresh user after real-world reward:", err);
    }
  }, [resolveNpub, setUser]);

  const handleOpenRealWorldTasks = useCallback(() => {
    // Open immediately so the drawer animation starts on the next paint,
    // then defer persistence work that can otherwise block the interaction.
    setRealWorldTasksOpen(true);
    setRealWorldTasksAttention(false);

    requestAnimationFrame(() => {
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
    });
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

  const savedLessonLevel = useMemo(
    () =>
      (CEFR_LEVELS.includes(
        user?.progress?.activeLessonLevels?.[normalizedTargetLang],
      ) &&
        user.progress.activeLessonLevels[normalizedTargetLang]) ||
      (CEFR_LEVELS.includes(user?.activeLessonLevels?.[normalizedTargetLang]) &&
        user.activeLessonLevels[normalizedTargetLang]) ||
      (CEFR_LEVELS.includes(user?.activeLessonLevel) &&
        user.activeLessonLevel) ||
      currentLessonLevel,
    [
      currentLessonLevel,
      normalizedTargetLang,
      user?.activeLessonLevel,
      user?.activeLessonLevels,
      user?.progress?.activeLessonLevels,
    ],
  );

  const savedFlashcardLevel = useMemo(
    () =>
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
      currentFlashcardLevel,
    [
      currentFlashcardLevel,
      normalizedTargetLang,
      user?.activeFlashcardLevel,
      user?.activeFlashcardLevels,
      user?.progress?.activeFlashcardLevels,
    ],
  );

  // Sync active levels from user document when it loads
  useEffect(() => {
    if (isLoadingApp) return;
    if (!user) return;
    if (!hasHydratedUserProgress) return;
    if (!normalizedTargetLang) return;
    if (initializedLevelsKey === levelsPersistenceKey) return;

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
    savedLessonLevel,
    savedFlashcardLevel,
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

  const displayActiveLessonLevel =
    initializedLevelsKey === levelsPersistenceKey
      ? activeLessonLevel
      : savedLessonLevel;
  const displayActiveFlashcardLevel =
    initializedLevelsKey === levelsPersistenceKey
      ? activeFlashcardLevel
      : savedFlashcardLevel;

  // Load only the active levels (include both lesson and flashcard levels for mode switching)
  const relevantLevels = useMemo(() => {
    // Include both lesson and flashcard active levels to support mode switching
    const levelsSet = new Set([
      displayActiveLessonLevel,
      displayActiveFlashcardLevel,
    ]);
    return Array.from(levelsSet);
  }, [displayActiveLessonLevel, displayActiveFlashcardLevel]);

  const relevantLevelsKey = relevantLevels.join("|");
  const skillTreeInitialUnitsKey = `multi:${resolvedTargetLang}:${relevantLevelsKey}`;
  const [skillTreeInitialUnits, setSkillTreeInitialUnits] = useState({
    key: null,
    units: null,
  });
  const [
    hasCompletedInitialSkillTreeBoot,
    setHasCompletedInitialSkillTreeBoot,
  ] = useState(false);

  useEffect(() => {
    if (isLoadingApp) return;
    if (!user) return;
    if (needsOnboarding || needsSubscriptionPasscode || isSubscriptionRoute)
      return;
    if (viewMode !== "skillTree" || !["path", "plate"].includes(pathMode))
      return;
    if (showAlphabetBootcamp) return;

    let isMounted = true;
    setSkillTreeInitialUnits((prev) =>
      prev.key === skillTreeInitialUnitsKey ? prev : { key: null, units: null },
    );

    loadMultiLevelLearningPath(resolvedTargetLang, relevantLevels)
      .then((nextUnits) => {
        if (!isMounted) return;
        setSkillTreeInitialUnits({
          key: skillTreeInitialUnitsKey,
          units: nextUnits,
        });
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Failed to preload skill tree units:", error);
        setSkillTreeInitialUnits({
          key: skillTreeInitialUnitsKey,
          units: [],
        });
      });

    return () => {
      isMounted = false;
    };
  }, [
    isLoadingApp,
    user,
    needsOnboarding,
    needsSubscriptionPasscode,
    isSubscriptionRoute,
    viewMode,
    pathMode,
    showAlphabetBootcamp,
    skillTreeInitialUnitsKey,
    resolvedTargetLang,
    relevantLevels,
  ]);

  const handleBottomBarSettingsOpen = useCallback(() => {
    // Let the bottom-bar tap state paint before mounting the drawer.
    scheduleAfterNextPaint(() => setSettingsOpen(true));
  }, []);

  /* -----------------------------------
     Daily plate — guided session conductor

     The plate home is the landing surface. "Start daily practice" opens a
     guided session that drops the user into the first unfinished course
     (speak → lesson → review) and auto-advances them as each course's
     target completes. Course counts arrive through the user store (awardXp
     syncs them), so the conductor just watches snapshot transitions.
  ----------------------------------- */
  // Which course types make up the quest. Defaults to the fixed first-quest
  // trio; the elector (and the dev re-roll button) can swap the composition.
  const [electedQuestKinds, setElectedQuestKinds] = useState(
    DAILY_PLATE_COURSE_ORDER,
  );

  // Pool of course types that can be elected today. "learn" is gated on an
  // unlocked lesson actually existing; the rest are always available.
  // (phonics joins in Phase 3.)
  const availableQuestKinds = useMemo(() => {
    const kinds = ["speak", "review", "conversation"];
    const units = skillTreeInitialUnits.units;
    const lessonAvailable =
      !Array.isArray(units) || units.length === 0
        ? true // units not loaded yet — assume available
        : Boolean(
            getLatestUnlockedLesson(
              units,
              userProgress?.lessons || {},
              hasCompletedSkillTreeTutorial,
            ),
          );
    if (lessonAvailable) kinds.push("learn");
    // Phonics is electable only for languages that have an alphabet deck.
    if (ALPHABET_LANGS.includes(resolvedTargetLang)) kinds.push("phonics");
    return kinds;
    // ALPHABET_LANGS is a stable in-component literal; resolvedTargetLang is
    // the real input here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    skillTreeInitialUnits.units,
    userProgress?.lessons,
    hasCompletedSkillTreeTutorial,
    resolvedTargetLang,
  ]);

  // Stable per-day language/day keys (independent of the elected kinds), used
  // by the repair + prune effects so they don't depend on the snapshot they
  // help shape.
  const plateLangKey = normalizePlateLang(resolvedTargetLang);
  const plateDayKey = getDailyPlateDayKey();

  const companionHydrationRef = useRef("");
  useEffect(() => {
    if (isLoadingApp || !activeNpub || !plateLangKey || !plateDayKey) return;
    const hydrationKey = `${activeNpub}:${plateLangKey}:${plateDayKey}`;
    if (companionHydrationRef.current === hydrationKey) return;
    companionHydrationRef.current = hydrationKey;
    void Promise.all([
      hydrateCompanionBucket({ npub: activeNpub, targetLang: plateLangKey }),
      hydrateQuestDays({
        npub: activeNpub,
        targetLang: plateLangKey,
        dayKeys: [getYesterdayKey(), plateDayKey, getTomorrowKey()],
      }),
    ]);
  }, [activeNpub, isLoadingApp, plateDayKey, plateLangKey]);

  // Today's repair plan (curated from yesterday's companion memory), if any.
  const repairPlanToday = useMemo(
    () => getStoredRepairPlan(user, resolvedTargetLang, plateDayKey),
    [user, resolvedTargetLang, plateDayKey],
  );
  const repairLessonCefrLevel =
    displayActiveLessonLevel ||
    currentLessonLevel ||
    currentCEFRLevel ||
    "Pre-A1";

  // Tutor-earned unlock, persisted by Tutor.jsx when every tutor lesson in a
  // CEFR level is complete — lets tutor-only progress raise ceilings here and
  // in SkillTree's maxProficiencyLevel.
  const tutorUnlockedLevel = clampCefrLevel(
    user?.progress?.tutorUnlockedLevels?.[
      String(resolvedTargetLang || "es").toLowerCase()
    ] ?? user?.progress?.tutorUnlockedLevels?.[resolvedTargetLang],
  );

  // Phonics deck generation bounds. Placement seeds the bootcamp's own deck
  // ladder (the way it pre-unlocks levels elsewhere); the ceiling is built
  // from UNLOCKED levels only — never display/active browse state, so viewing
  // a B2 tab can't inflate generated phonics difficulty. Placement can be the
  // literal string "skipped", which clampCefrLevel filters out.
  const phonicsPlacementLevel = clampCefrLevel(
    user?.proficiencyPlacements?.[resolvedTargetLang],
  );
  const phonicsCourseCeilingLevel =
    maxCefrLevel(
      currentLessonLevel,
      currentFlashcardLevel,
      tutorUnlockedLevel,
    ) || "Pre-A1";

  // Option A: kinds the learner left unfinished on an incomplete previous day,
  // carried into today by the batch blueprint. Derived (never elected), like
  // repair, so they can't fight the elector.
  const carryOverKinds = useMemo(
    () => getBlueprintCarryOverKinds(user, resolvedTargetLang, plateDayKey),
    [user, resolvedTargetLang, plateDayKey],
  );

  // The plate's display kinds = elected base, with carried-over unfinished
  // kinds and "repair" prepended (deduped). The elected base (persisted) never
  // contains either, so this stays purely derived and can't fight the elector.
  const questKinds = useMemo(() => {
    const base = electedQuestKinds.filter((k) => k !== "repair");
    const withRepair = repairPlanToday ? ["repair", ...base] : base;
    if (!carryOverKinds.length) return withRepair;
    const carry = carryOverKinds.filter((k) => !withRepair.includes(k));
    return [...carry, ...withRepair];
  }, [repairPlanToday, electedQuestKinds, carryOverKinds]);

  const plateSnapshot = useMemo(
    () =>
      getDailyPlateSnapshot(user, resolvedTargetLang, undefined, questKinds),
    [user, resolvedTargetLang, questKinds],
  );

  // Resolve today's quest composition:
  //  • already elected today (survives refresh / dev re-rolls) → use it.
  //  • first quest ever → the fixed trio (then mark first-seen).
  //  • otherwise → auto-elect for the day: deterministic seed, neglect
  //    weighting, and yesterday's set down-weighted so days differ.
  useEffect(() => {
    const langKey = plateSnapshot.langKey;
    const dayKey = plateSnapshot.dayKey;
    if (!langKey || !dayKey) return;

    const todays = readQuestPlateKinds(langKey, dayKey);
    if (todays && todays.length) {
      setElectedQuestKinds((prev) =>
        prev.join("|") === todays.join("|") ? prev : todays,
      );
      // A plate cached by older code may have skipped the first-seen flag for a
      // returning user. Today's plate already exists, so they're past the intro
      // — set the flag (no first-day stamp) so the companion bubble isn't gated
      // off. (A genuine first-timer's trio election sets the flag itself below.)
      // Only against a LOADED user: the boot-time null user reads as unflagged,
      // which would set the flag for a first-timer reloading mid-intro-day.
      const cachedPathUser = useUserStore.getState?.()?.user || user;
      if (
        !isLoadingApp &&
        cachedPathUser &&
        activeNpub &&
        !hasSeenFirstQuest(cachedPathUser)
      ) {
        void markFirstQuestFlagOnly(activeNpub);
      }
      return;
    }

    // Need a loaded user before electing/marking (the first-seen flag and the
    // neglect weights both come from the user doc). activeNpub resolves from
    // localStorage at mount — long before the doc loads — and electing against
    // that boot-time null user on a new day stamped TODAY as the first quest
    // day (clobbering the real one, re-showing the welcome bubble on a repair
    // day) and served the intro trio instead of an auto-elected plate.
    if (!activeNpub || isLoadingApp) return;
    const currentUser = useUserStore.getState?.()?.user || user;
    if (!currentUser) return;

    let kinds;
    if (!hasSeenFirstQuest(currentUser)) {
      kinds = DAILY_PLATE_COURSE_ORDER;
      void markFirstQuestSeen(activeNpub);
    } else {
      const previous = readQuestPlate();
      const avoid =
        previous &&
        previous.langKey === langKey &&
        Array.isArray(previous.kinds)
          ? previous.kinds
          : [];
      kinds = electDailyQuestCourses({
        available: availableQuestKinds,
        avoid,
        seed: `${activeNpub}:${langKey}:${dayKey}`,
        weights: getQuestNeglectWeights(
          currentUser,
          langKey,
          availableQuestKinds,
        ),
      });
    }
    if (!kinds.length) kinds = DAILY_PLATE_COURSE_ORDER;

    writeQuestPlate(langKey, dayKey, kinds);
    setElectedQuestKinds((prev) =>
      prev.join("|") === kinds.join("|") ? prev : kinds,
    );
    // `user` intentionally omitted — read fresh via getState so this doesn't
    // re-run on every XP patch (already-elected days early-return anyway).
    // isLoadingApp IS a dep: it flips false right after setUser, re-running
    // this against the loaded doc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    plateSnapshot.langKey,
    plateSnapshot.dayKey,
    availableQuestKinds,
    activeNpub,
    isLoadingApp,
  ]);

  // Companion brain: expire stale memory once per day. Notes live through the
  // day after capture (Day T+1 reinforcement), then this prunes them (Day T+2).
  // Gated on a loaded user so it never runs against an empty store, and prune
  // itself only writes when it actually removed notes.
  const memoryPrunedRef = useRef("");
  useEffect(() => {
    if (isLoadingApp || !user || !activeNpub || !plateLangKey || !plateDayKey)
      return;
    const onceKey = `${plateLangKey}:${plateDayKey}`;
    if (memoryPrunedRef.current === onceKey) return;
    memoryPrunedRef.current = onceKey;
    void pruneCompanionMemory({ npub: activeNpub, targetLang: plateLangKey });
  }, [isLoadingApp, user, activeNpub, plateLangKey, plateDayKey]);

  // Companion batch — primary trigger. When today's quest clears, compose
  // TOMORROW's blueprint (manga message + AI repair) from today's captured
  // notes, so the next session is instant. Marker-first via shouldRunDailyBatch
  // (skips if already generated, even across devices) + a ref for same-tick.
  // No first-quest gate here: Day-1 completion legitimately seeds Day-2, which
  // is past-intro; the caveat is enforced at consumption, not generation.
  const blueprintCompletionRef = useRef("");
  useEffect(() => {
    if (isLoadingApp || !user || !activeNpub || !plateLangKey || !plateDayKey)
      return;
    if (!plateSnapshot.isCleared) return;
    const tomorrowKey = getTomorrowKey();
    if (!tomorrowKey) return;
    const currentUser = useUserStore.getState?.()?.user || user;
    if (!shouldRunDailyBatch(currentUser, plateLangKey, tomorrowKey)) return;
    const sourceNotes = getTodaysCapturedNotes(currentUser, plateLangKey);
    if (!sourceNotes.length) return;
    const onceKey = `${plateLangKey}:${tomorrowKey}`;
    if (blueprintCompletionRef.current === onceKey) return;
    blueprintCompletionRef.current = onceKey;
    void runDailyBatch({
      npub: activeNpub,
      targetLang: plateLangKey,
      appLanguage,
      sourceNotes,
      targetDayKey: tomorrowKey,
      todayCleared: true,
      carryOverKinds: [],
      cefrLevel: repairLessonCefrLevel,
    });
  }, [
    isLoadingApp,
    user,
    activeNpub,
    plateLangKey,
    plateDayKey,
    plateSnapshot.isCleared,
    appLanguage,
    repairLessonCefrLevel,
  ]);

  // Companion batch — fallback. On open, if today has no blueprint yet (the
  // completion trigger never fired — yesterday's quest went unfinished, or the
  // tab closed before it ran) and yesterday left reusable notes, compose
  // today's blueprint now. Reads yesterday's snapshot to carry over unfinished
  // kinds and flag the incomplete day (Option A). Gated past the intro quest.
  const blueprintFallbackRef = useRef("");
  useEffect(() => {
    if (isLoadingApp || !user || !activeNpub || !plateLangKey || !plateDayKey)
      return;
    const currentUser = useUserStore.getState?.()?.user || user;
    if (!isPastFirstQuest(currentUser, plateDayKey)) return;
    if (!shouldRunDailyBatch(currentUser, plateLangKey, plateDayKey)) return;
    const sourceNotes = getReusableMemory(currentUser, plateLangKey);
    if (!sourceNotes.length) return;
    const onceKey = `${plateLangKey}:${plateDayKey}`;
    if (blueprintFallbackRef.current === onceKey) return;
    blueprintFallbackRef.current = onceKey;

    // Did yesterday's quest get finished, and what was left unfinished?
    const yKey = getYesterdayKey();
    const yKinds = readQuestPlateKinds(plateLangKey, yKey) || [];
    const ySnap = yKinds.length
      ? getDailyPlateSnapshot(
          currentUser,
          plateLangKey,
          new Date(Date.now() - 86_400_000),
          yKinds,
        )
      : null;
    const yesterdayComplete = ySnap ? ySnap.isCleared : true;
    const carryOverKinds =
      !yesterdayComplete && ySnap
        ? ySnap.courses
            .filter((c) => !c.done && c.kind !== "repair")
            .map((c) => c.kind)
            .slice(0, 2)
        : [];

    void runDailyBatch({
      npub: activeNpub,
      targetLang: plateLangKey,
      appLanguage,
      sourceNotes,
      targetDayKey: plateDayKey,
      todayCleared: yesterdayComplete,
      carryOverKinds,
      cefrLevel: repairLessonCefrLevel,
    });
  }, [
    isLoadingApp,
    user,
    activeNpub,
    plateLangKey,
    plateDayKey,
    appLanguage,
    repairLessonCefrLevel,
  ]);

  // Repair surface (a short ephemeral flashcard pass) opens over the plate —
  // last-resort fallback only; flashcards/lesson repairs launch a real
  // ephemeral lesson instead.
  const [repairModalOpen, setRepairModalOpen] = useState(false);

  const [plateSessionActive, setPlateSessionActive] = useState(false);

  const endPlateSession = useCallback(() => {
    clearPlateSession();
    setPlateSessionActive(false);
  }, []);

  // Restore an in-flight session on boot; drop stale ones (new day/language).
  useEffect(() => {
    const session = readPlateSession();
    const active = isPlateSessionFor(
      session,
      plateSnapshot.langKey,
      plateSnapshot.dayKey,
    );
    if (!active && session) clearPlateSession();
    setPlateSessionActive((prev) => (prev === active ? prev : active));
  }, [plateSnapshot.langKey, plateSnapshot.dayKey]);

  // Internal navigation used by the plate (does NOT end the guided session,
  // unlike the bottom-bar mode switcher).
  const goToSkillTreeMode = useCallback(
    (mode) => {
      if (viewMode !== "skillTree") {
        handleReturnToSkillTree();
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      setPathMode(mode);
    },
    [handleReturnToSkillTree, viewMode],
  );

  // Route a course to its surface — that's it. The user engages each surface
  // themselves (press connect in the Tutor, tap a lesson, start a card), so
  // the quest never auto-starts a session or picks the activity for them.
  const navigateToPlateCourse = useCallback(
    (kind) => {
      if (kind === "repair") {
        // Repair is a SEQUENCE of short steps — one per curated weak spot,
        // each in its own practice mode (that's why the course counts 0/N).
        // The next step = however many increments are already banked today.
        // Live-engine steps (tutor/phonics) stash the step's mini-plan as the
        // "repair focus" and route there; flashcards/lesson steps run as an
        // ephemeral lesson seeded strictly with that step's weak material.
        const stepsDone = plateSnapshot.byKind?.repair?.count || 0;
        const step = getNextRepairStep(repairPlanToday, stepsDone);
        if (step) {
          const repairSurface = REPAIR_MODE_TO_SURFACE[step.mode];
          if (repairSurface) {
            useRepairFocusStore.getState().setFocus({
              plan: step.plan,
              mode: step.mode,
              surface: repairSurface,
              stepIndex: step.index,
              stepCount: step.stepCount,
              targetLang: resolvedTargetLang,
              supportLang: appLanguage,
              npub: activeNpub,
            });
            goToSkillTreeMode(repairSurface);
            return;
          }
          const ephemeral = buildEphemeralRepairLesson({
            plan: step.plan,
            targetLang: resolvedTargetLang,
            cefrLevel: repairLessonCefrLevel,
            dayKey: plateDayKey,
            recommendedMode: step.mode,
            stepIndex: step.index,
          });
          if (ephemeral) {
            useRepairFocusStore.getState().setFocus({
              plan: step.plan,
              mode: step.mode,
              surface: "lesson",
              stepIndex: step.index,
              stepCount: step.stepCount,
              targetLang: resolvedTargetLang,
              supportLang: appLanguage,
              npub: activeNpub,
            });
            void handleStartLessonRef.current?.(ephemeral);
            return;
          }
        }
        // No plan / no usable items → the quick card fallback.
        goToSkillTreeMode("plate");
        setRepairModalOpen(true);
        return;
      }
      if (kind === "speak") {
        goToSkillTreeMode("tutor");
        return;
      }
      if (kind === "conversation") {
        goToSkillTreeMode("conversations");
        return;
      }
      if (kind === "phonics") {
        goToSkillTreeMode("alphabet");
        return;
      }
      if (kind === "review") {
        goToSkillTreeMode("flashcards");
        return;
      }
      // learn — show the skill tree, scrolled to the latest unlocked lesson
      goToSkillTreeMode("path");
      setScrollToLatestTrigger((prev) => prev + 1);
    },
    [
      goToSkillTreeMode,
      repairPlanToday,
      plateSnapshot,
      resolvedTargetLang,
      appLanguage,
      activeNpub,
      repairLessonCefrLevel,
      plateDayKey,
    ],
  );

  const handleStartDailyPractice = () => {
    const next = getNextPlateCourse(plateSnapshot);
    if (!next) {
      // Plate already cleared — keep practicing with the tutor
      goToSkillTreeMode("tutor");
      return;
    }
    startPlateSession(plateSnapshot.langKey, plateSnapshot.dayKey);
    setPlateSessionActive(true);
    navigateToPlateCourse(next);
  };

  // Celebration modals for the guided session: "Exercise Complete" with a
  // Continue button after each course, and a final "plate cleared" modal.
  // Lesson and Tutor completions trigger their own chains of modals
  // (completion celebration, daily-goal celebration, agenda modals — any of
  // which may or may not render), so a requested celebration is queued and
  // only shown once no other Chakra modal remains open. That guarantees it
  // always renders last in the chain on both surfaces.
  const [plateCelebration, setPlateCelebration] = useState(null);
  const pendingPlateCelebrationRef = useRef(null);
  const plateCelebrationFlushTimerRef = useRef(null);
  const plateClearedCelebratedKeyRef = useRef("");
  const plateCelebrationBlockersRef = useRef({});
  plateCelebrationBlockersRef.current = {
    celebrateOpen,
    companionUnlockModalOpen: Boolean(companionUnlockModal),
    gettingStartedOpen,
    modesIntroOpen,
    pendingInstallModalAfterTutorial,
    pendingTutorialBitcoinModal,
    plateCelebrationOpen: Boolean(plateCelebration),
    proficiencyTestOpen,
    repairModalOpen,
    showCompletionModal,
    showProficiencyCompletionModal,
    showTutorialBitcoinModal,
    timeUpOpen,
  };

  const flushCompanionUnlockWhenQuiet = useCallback(() => {
    if (companionUnlockFlushTimerRef.current) {
      clearTimeout(companionUnlockFlushTimerRef.current);
      companionUnlockFlushTimerRef.current = null;
    }
    if (companionUnlockModal || !companionUnlockQueueRef.current.length) return;

    const startedAt = Date.now();
    const expectsModal = companionUnlockQueueRef.current.some(
      (item) => item?.expectsModal,
    );
    const chain = { sawModal: false, quietChecks: 0 };

    const hasModalSurface = () => {
      if (typeof document !== "undefined") {
        const activeModalStack = Array.from(
          document.querySelectorAll(
            ".chakra-modal__content-container, .chakra-modal__overlay",
          ),
        ).filter((element) => {
          const style = window.getComputedStyle(element);
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            element.getAttribute("aria-hidden") !== "true"
          );
        }).length;
        if (activeModalStack > 0) return true;
      }

      const modalStore = useModalStore.getState();
      return Boolean(
        modalStore.dailyGoalOpen ||
        modalStore.timerModalOpen ||
        pendingDailyGoalCelebrationRef.current ||
        pendingLessonCompletionRef.current ||
        pendingTutorialBitcoinModalRef.current ||
        pendingPlateCelebrationRef.current,
      );
    };

    const showQueued = () => {
      // Final gate at show time: the queue may hold items that snuck in before
      // the user doc hydrated (the boot level-transition race). By now the
      // persisted celebrated-map is loaded, so drop anything already shown.
      let nextUnlock = null;
      while (companionUnlockQueueRef.current.length) {
        const candidate = companionUnlockQueueRef.current.shift();
        if (candidate && !isCompanionUnlockCelebrated(candidate.type)) {
          nextUnlock = candidate;
          break;
        }
      }
      if (!nextUnlock) return;
      setCompanionUnlockModal((prev) => prev || nextUnlock);
      // Persist once-per-account the moment it renders, so a refresh (even
      // mid-modal) never replays this unlock celebration.
      markCompanionUnlockCelebrated(nextUnlock.type);
    };

    const tick = () => {
      companionUnlockFlushTimerRef.current = null;
      if (companionUnlockModal || !companionUnlockQueueRef.current.length) {
        return;
      }

      if (hasModalSurface()) {
        chain.sawModal = true;
        chain.quietChecks = 0;
        companionUnlockFlushTimerRef.current = setTimeout(tick, 90);
        return;
      }

      const minimumWaitMs = expectsModal ? 900 : 120;
      if (!chain.sawModal && Date.now() - startedAt < minimumWaitMs) {
        companionUnlockFlushTimerRef.current = setTimeout(tick, 80);
        return;
      }

      chain.quietChecks += 1;
      const neededQuietChecks = 1;
      if (chain.quietChecks < neededQuietChecks) {
        companionUnlockFlushTimerRef.current = setTimeout(tick, 80);
        return;
      }

      showQueued();
    };

    companionUnlockFlushTimerRef.current = setTimeout(
      tick,
      expectsModal ? 90 : 0,
    );
  }, [
    companionUnlockModal,
    markCompanionUnlockCelebrated,
    isCompanionUnlockCelebrated,
  ]);

  useEffect(() => {
    if (!companionUnlockQueueRef.current.length || companionUnlockModal) return;
    flushCompanionUnlockWhenQuiet();
  }, [
    companionUnlockModal,
    companionUnlockQueueTick,
    flushCompanionUnlockWhenQuiet,
  ]);

  const flushPlateCelebrationWhenQuiet = useCallback(() => {
    if (plateCelebrationFlushTimerRef.current) {
      clearTimeout(plateCelebrationFlushTimerRef.current);
      plateCelebrationFlushTimerRef.current = null;
    }
    const startedAt = Date.now();
    // `expectsModal` only controls the initial grace window for completion
    // chains that may mount a beat late. The poll below still waits behind any
    // modal or pending modal state that actually exists.
    const expectsModal = Boolean(
      pendingPlateCelebrationRef.current?.expectsModal,
    );
    const chain = { sawModal: false, quietChecks: 0 };

    const showQueued = () => {
      const queued = pendingPlateCelebrationRef.current;
      pendingPlateCelebrationRef.current = null;
      if (!queued) return;
      setPlateCelebration((prev) => prev || queued);
      // Celebratory sound, timed to the modal's appearance: dedicated Tone.js
      // synths — a cute "ta-da" for a single objective, a grand flourish when
      // the whole daily is cleared. Played by name (not via the shared mp3->
      // tone map) so each is unique to the quest flow.
      playSound(queued.type === "cleared" ? "questCleared" : "questComplete");
    };

    const hasBlockingModalSurface = () => {
      const blockers = plateCelebrationBlockersRef.current || {};
      const modalStore = useModalStore.getState?.() || {};
      return Boolean(
        lessonCompletionSequenceActiveRef.current ||
        pendingLessonCompletionRef.current ||
        pendingDailyGoalCelebrationRef.current ||
        pendingTutorialBitcoinModalRef.current ||
        modalStore.dailyGoalOpen ||
        modalStore.timerModalOpen ||
        Object.values(blockers).some(Boolean) ||
        hasVisibleChakraModalSurface(),
      );
    };

    const tick = () => {
      plateCelebrationFlushTimerRef.current = null;
      if (!pendingPlateCelebrationRef.current) return;
      if (typeof document === "undefined" || typeof window === "undefined") {
        showQueued();
        return;
      }
      if (hasBlockingModalSurface()) {
        chain.sawModal = true;
        chain.quietChecks = 0;
        plateCelebrationFlushTimerRef.current = setTimeout(tick, 120);
        return;
      }
      // Wait for a not-yet-mounted completion chain only when one is expected
      // (the Tutor can mount its modal late while audio settles).
      if (expectsModal && !chain.sawModal && Date.now() - startedAt < 2500) {
        plateCelebrationFlushTimerRef.current = setTimeout(tick, 250);
        return;
      }
      // Once a chain was seen, require two consecutive quiet checks so the gap
      // between chained modals doesn't fire early.
      chain.quietChecks += 1;
      const needed = chain.sawModal ? 2 : 1;
      if (chain.quietChecks < needed) {
        plateCelebrationFlushTimerRef.current = setTimeout(tick, 250);
        return;
      }
      showQueued();
    };

    plateCelebrationFlushTimerRef.current = setTimeout(
      tick,
      expectsModal ? 400 : 100,
    );
  }, [playSound]);

  const requestPlateCelebration = useCallback(
    (celebration) => {
      if (celebration?.type === "cleared") {
        // The cleared celebration can be requested by both the conductor and
        // the bonus-claim effect — show it once per plate.
        const onceKey = `${plateSnapshot.langKey}:${plateSnapshot.dayKey}`;
        if (plateClearedCelebratedKeyRef.current === onceKey) return;
        plateClearedCelebratedKeyRef.current = onceKey;
      }
      pendingPlateCelebrationRef.current = celebration;
      flushPlateCelebrationWhenQuiet();
    },
    [
      flushPlateCelebrationWhenQuiet,
      plateSnapshot.langKey,
      plateSnapshot.dayKey,
    ],
  );

  // Dismissing a celebration: a course modal moves into the next course; the
  // cleared modal (when finishing a guided session) returns home — but only
  // now, on close, not the instant the plate clears, so the modal isn't
  // yanked away underneath the user. Used by every celebration button and the
  // modal's own onClose.
  const handlePlateCelebrationContinue = () => {
    const celebration = plateCelebration;
    setPlateCelebration(null);
    // A finished ephemeral repair lesson stays on screen behind the
    // celebration (its completion deliberately doesn't navigate) — so when
    // there's no next course to move to, Continue must still leave the spent
    // lesson rather than strand the learner on it.
    const finishedRepairLesson =
      viewMode === "lesson" && Boolean(activeLesson?.isRepair);
    if (celebration?.type === "course" && celebration.next) {
      navigateToPlateCourse(celebration.next);
    } else if (
      (celebration?.type === "cleared" && celebration.navigateHome) ||
      finishedRepairLesson
    ) {
      goToSkillTreeMode("plate");
    }
  };

  // Keep the quest celebration and the daily-goal celebration sequential.
  // awardXp dispatches "daily:goalAchieved" only after its async Firestore
  // write resolves (~1s), while recordPlateActivity bumps the quest counter
  // synchronously — so the goal modal would otherwise pop on top of the quest
  // modal a beat later. While a quest celebration is on screen we hold any
  // goal celebration in the existing defer queue, then release it when the
  // quest modal closes (button or backdrop, via handlePlateCelebrationContinue
  // -> setPlateCelebration(null)). If the goal modal opened first instead, the
  // flush's modal poll already waits behind it, so either order stays clean.
  useEffect(() => {
    if (!plateCelebration) return undefined;
    deferDailyGoalCelebrationRef.current = true;
    return () => {
      // Clears the defer flag and surfaces any goal celebration that fired
      // while the quest modal was up (no-op when none is queued).
      openPendingDailyGoalCelebration();
    };
  }, [plateCelebration, openPendingDailyGoalCelebration]);

  // Celebrate when a quest course completes.
  //  • In a guided session: full flow — celebrate each course, advance via the
  //    Continue button, and land home with the cleared celebration at the end.
  //  • Outside a session: acknowledge finishing any course (a lesson, Tutor
  //    lesson, or flashcards) so the gamification shows up everywhere, not just
  //    inside the quest. The celebration queue waits for the surface's own
  //    completion modal first, so it chains after it. The plate-cleared bonus
  //    is handled separately by the bonus effect.
  const platePrevSnapshotRef = useRef(null);
  // Guard against the conductor firing during initial hydration or a language
  // switch: an already-completed course's saved count loads in as a not-done ->
  // done transition, which would otherwise pop a "Quest Complete!" modal on
  // every refresh. Arm only after the snapshot has had a moment to settle, and
  // re-arm whenever the user or target language changes.
  const plateConductorArmedRef = useRef(false);
  useEffect(() => {
    plateConductorArmedRef.current = false;
    if (!activeNpub) return undefined;
    const timer = setTimeout(() => {
      plateConductorArmedRef.current = true;
    }, 2000);
    return () => clearTimeout(timer);
  }, [activeNpub, resolvedTargetLang]);

  useEffect(() => {
    const prev = platePrevSnapshotRef.current;
    platePrevSnapshotRef.current = plateSnapshot;
    if (!prev) return;
    // Only celebrate genuine in-session completions, not hydration transitions.
    if (!plateConductorArmedRef.current) return;
    if (
      prev.dayKey !== plateSnapshot.dayKey ||
      prev.langKey !== plateSnapshot.langKey
    )
      return;

    const justDone = plateSnapshot.courses
      .map((course) => course.kind)
      .find(
        (kind) => plateSnapshot.byKind[kind]?.done && !prev.byKind[kind]?.done,
      );
    if (!justDone) {
      // Repair advances one step (one increment) at a time, so intermediate
      // steps never flip the course done — celebrate each banked step like a
      // course completion. In a guided session the Continue button re-routes
      // into "repair", which serves the NEXT step in its own mode; outside a
      // session it's a plain acknowledgement (Continue leaves the spent step).
      const prevRepair = prev.byKind?.repair;
      const nowRepair = plateSnapshot.byKind?.repair;
      const repairStepped =
        nowRepair &&
        prevRepair &&
        !nowRepair.done &&
        nowRepair.count > prevRepair.count;
      if (!repairStepped) return;
      requestPlateCelebration({
        type: "course",
        completed: "repair",
        next: plateSessionActive ? getNextPlateCourse(plateSnapshot) : null,
        expectsModal: false,
        // Step progress ("1/3") so the celebration reads as one step of the
        // multi-mode repair sequence, not the whole task.
        progress: {
          count: Math.min(nowRepair.count, nowRepair.target),
          target: nowRepair.target,
        },
      });
      return;
    }

    const next = getNextPlateCourse(plateSnapshot);
    // Only surfaces that render their own completion modal need the
    // celebration to wait behind them: lessons and Tutor lessons. Repair
    // deliberately shows NO lesson-completion modal (triggerLessonCompletion
    // early-returns for isRepair), so its "task complete" celebration is the
    // one and only modal — show it promptly over the finished repair view.
    const expectsModal = justDone === "learn" || justDone === "speak";

    // Live voice surfaces are keep-alive across mode switches, so finishing
    // the Conversation course would otherwise leave the session talking under
    // the task-complete modal and even after Continue navigates onward. In a
    // guided session, tell the surface its course is done so it can hang up
    // before the celebration lands.
    if (plateSessionActive && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("plate:courseComplete", {
          detail: { kind: justDone },
        }),
      );
    }

    if (!plateSessionActive) {
      // Standalone acknowledgement for any course finished outside a guided
      // session (a lesson, a Tutor lesson, or flashcards). The celebration
      // queue waits for the surface's own completion modal to close first, so
      // it chains after it rather than overlapping. Skip when this completion
      // clears the whole plate — the bonus effect celebrates that instead.
      if (next) {
        requestPlateCelebration({
          type: "course",
          completed: justDone,
          next: null,
          expectsModal,
        });
      }
      return;
    }

    if (!next) {
      endPlateSession();
      // Don't navigate yet — show the cleared modal where the user is, then
      // return home when they dismiss it (navigateHome handled on close).
      requestPlateCelebration({
        type: "cleared",
        navigateHome: true,
        expectsModal,
      });
      return;
    }
    // Queued: renders after the surface's own completion-modal chain
    // (lesson celebration, Tutor agenda modals, daily-goal celebration).
    // Navigation to the next course happens on its Continue button.
    requestPlateCelebration({
      type: "course",
      completed: justDone,
      next,
      expectsModal,
    });
  }, [
    plateSnapshot,
    plateSessionActive,
    endPlateSession,
    goToSkillTreeMode,
    playSound,
    requestPlateCelebration,
  ]);

  // Claim the daily bonus exactly once when the plate clears (whether or not
  // a guided session is running). Marker first so two devices can't double-pay.
  const plateBonusClaimingRef = useRef(false);
  useEffect(() => {
    if (!activeNpub || !plateSnapshot.isCleared || plateSnapshot.bonusAwarded)
      return;
    if (plateBonusClaimingRef.current) return;
    plateBonusClaimingRef.current = true;
    (async () => {
      try {
        const claimed = await claimDailyPlateBonus(
          activeNpub,
          plateSnapshot.langKey,
        );
        if (!claimed) return;
        const store = useUserStore.getState();
        store.patchUser?.({
          progress: applyPlateBonusMarker(
            store.user?.progress || {},
            plateSnapshot.langKey,
            plateSnapshot.dayKey,
          ),
        });
        await awardXp(activeNpub, DAILY_PLATE_BONUS_XP, plateSnapshot.langKey);
        // Covers plates cleared outside a guided session too; the once-per-
        // plate guard inside makes this a no-op when the conductor already
        // requested it.
        requestPlateCelebration({ type: "cleared" });
      } catch (error) {
        console.error("Failed to claim daily plate bonus:", error);
      } finally {
        plateBonusClaimingRef.current = false;
      }
    })();
  }, [activeNpub, plateSnapshot, playSound, requestPlateCelebration]);

  // Dev/testing: wipe today's course counters while preserving the current
  // quest composition, repair plan, and manga-bubble context so the exact flow
  // can be replayed from the top. Repair-step artifacts (cached decks + the
  // answered repair cards' progress docs) are wiped too — their ids are
  // deterministic per day, so leaving them would make a re-run flashcards
  // step self-complete the moment it opens.
  const handleResetQuestPlate = useCallback(async () => {
    if (!activeNpub) return;
    if (plateCelebrationFlushTimerRef.current) {
      clearTimeout(plateCelebrationFlushTimerRef.current);
      plateCelebrationFlushTimerRef.current = null;
    }
    plateClearedCelebratedKeyRef.current = "";
    platePrevSnapshotRef.current = null;
    pendingPlateCelebrationRef.current = null;
    setPlateCelebration(null);
    endPlateSession();
    await Promise.all([
      resetTodayPlate(activeNpub, resolvedTargetLang),
      resetTodayRepairArtifacts({
        npub: activeNpub,
        targetLang: resolvedTargetLang,
      }),
    ]);
  }, [activeNpub, resolvedTargetLang, endPlateSession]);

  const handleBottomBarPathModeChange = useCallback(
    (newMode) => {
      if (viewMode !== "skillTree") {
        handleReturnToSkillTree();
      }

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }

      // Manually picking a mode opts out of the guided daily session.
      endPlateSession();
      setPathMode(newMode);
    },
    [handleReturnToSkillTree, viewMode, endPlateSession],
  );

  /* -----------------------------------
     Loading / Onboarding gates
  ----------------------------------- */
  const shouldHoldForInitialSkillTree =
    !hasCompletedInitialSkillTreeBoot &&
    !!user &&
    !needsOnboarding &&
    !needsSubscriptionPasscode &&
    !isSubscriptionRoute &&
    viewMode === "skillTree" &&
    pathMode === "path" &&
    !showAlphabetBootcamp &&
    skillTreeInitialUnits.key !== skillTreeInitialUnitsKey;

  const isBootLoading = isLoadingApp || !user || shouldHoldForInitialSkillTree;

  useEffect(() => {
    if (hasCompletedInitialSkillTreeBoot) return;
    if (isLoadingApp || !user) return;
    if (shouldHoldForInitialSkillTree) return;
    setHasCompletedInitialSkillTreeBoot(true);
  }, [
    hasCompletedInitialSkillTreeBoot,
    isLoadingApp,
    user,
    shouldHoldForInitialSkillTree,
  ]);

  useEffect(() => {
    if (isBootLoading) return;
    onBootReady?.();
  }, [isBootLoading, onBootReady]);

  if (isBootLoading) {
    if (onBootReady) return null;
    return <LoadingOrbFallback minH="100vh" bg="gray.900" />;
  }

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

  // When onboarding completes, the route may still be /onboarding for one
  // paint. Render the app immediately and let the effect above replace the
  // URL, avoiding a blank Navigate-only frame on mobile.

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

  const isTutorialGameStep =
    viewMode === "lesson" && activeLesson?.isTutorial && currentTab === "game";

  const episodeHarnessRequested =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("episode");

  const isGameFullScreen =
    episodeHarnessRequested ||
    (viewMode === "lesson" &&
      (activeLesson?.isGame ||
        (isTutorialGameStep &&
          (!!preGeneratedGameScenario ||
            (!!tutorialGameInitialScenario && tutorialGameRevealReady)))));
  const isVoiceSurfaceMode =
    viewMode === "skillTree" &&
    (pathMode === "conversations" || pathMode === "tutor");
  const activeVoiceConnectionStatus =
    pathMode === "conversations" || pathMode === "tutor"
      ? voiceConnectionStatuses[pathMode]
      : "disconnected";
  const skillTreeSceneBottomPadding = isVoiceSurfaceMode
    ? 0
    : { base: 32, md: 24 };

  return (
    <Box minH="100dvh" bg="var(--app-page-bg)" color="gray.50" width="100%">
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
          onSwitchedAccount={handleSwitchedAccount}
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
          hasTimer={hasTimer}
          isTimerRunning={isTimerRunning}
          timerPaused={timerPaused}
          onOpenTimerModal={() => {
            setTimerModalImmediateBody(false);
            setTimerModalOpen(true);
          }}
          onTogglePauseTimer={handleTogglePauseTimer}
          onOpenDailyGoalModal={() => setDailyGoalOpen(true, true)}
          allowPosts={allowPosts}
          onAllowPostsChange={handleAllowPostsChange}
          soundEnabled={soundEnabled}
          onSoundEnabledChange={handleSoundEnabledChange}
          soundVolume={soundVolume}
          onVolumeChange={handleVolumeChange}
          onVolumeSave={handleVolumeSave}
          tutorVolume={tutorVolume}
          onTutorVolumeChange={handleTutorVolumeChange}
          onTutorVolumeSave={handleTutorVolumeSave}
          playSound={playSound}
          isMobile={isMobile}
          postNostrContent={postNostrContent}
          onSupportLangChange={onSupportLangChange}
          pendingLangRef={pendingLangRef}
          subscriptionVerified={subscriptionVerified}
        />
      )}

      {/* Keep the top-bar modal subscribers high in the tree so opening them
          does not make React walk the entire learning surface first. */}
      <OnboardingChainBackdrop appChainOpen={appOnboardingChainOpen} />

      <DailyGoalModalGate
        appChainOpen={appOnboardingChainOpen}
        onClose={handleDailyGoalClose}
        onSaveGoal={handleDailyGoalSave}
        npub={activeNpub}
        lang={appLanguage}
        defaultGoal={dailyGoalTarget > 0 ? dailyGoalTarget : 100}
        t={t}
        petHealth={dailyGoalPetHealth}
        petName={user?.dailyGoalPetName || ""}
        petType={dailyGoalPetType}
        companionLevel={companionLevel}
        onCustomizePet={handleCustomizePet}
        petLastOutcome={user?.dailyGoalPetLastOutcome || null}
        petLastDelta={user?.dailyGoalPetLastDelta ?? null}
        completedGoalDates={dailyGoalCompletedDates}
        dailyXpHistory={dailyGoalXpHistory}
        currentDailyXp={dailyXpToday}
        currentGoalXp={dailyGoalTarget}
      />

      <SessionTimerModalGate
        appChainOpen={appOnboardingChainOpen}
        onClose={handleTimerModalClose}
        minutes={timerMinutes}
        onMinutesChange={setTimerMinutes}
        onStart={handleStartTimer}
        isRunning={isTimerRunning}
        helper={null}
        t={t}
        lang={appLanguage}
        deferBody={!timerModalImmediateBody}
      />

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
        onRewardClaimed={handleRealWorldRewardClaimed}
      />

      <NotesDrawer
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        appLanguage={appLanguage}
        targetLang={resolvedTargetLang}
      />

      <CompanionRepairModal
        isOpen={repairModalOpen}
        onClose={() => setRepairModalOpen(false)}
        plan={repairPlanToday}
        targetLang={resolvedTargetLang}
        appLanguage={appLanguage}
        npub={activeNpub}
        startIndex={plateSnapshot.byKind?.repair?.count || 0}
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
          onMinimizedChange={handleBottomActionBarMinimizedChange}
          onPathModeChange={handleBottomBarPathModeChange}
          onScrollToLatest={() => {
            // Trigger scroll when already in path mode
            if (viewMode === "skillTree") {
              setScrollToLatestTrigger((prev) => prev + 1);
            }
          }}
          currentTab={currentTab}
        />
      )}

      {/* Tutorial Action Bar Popovers - shows on first login on main learning surfaces */}
      <TutorialActionBarPopovers
        isActive={
          showSkillTreeTutorial &&
          viewMode === "skillTree" &&
          ["plate", "path", "tutor"].includes(pathMode)
        }
        lang={appLanguage}
        onComplete={handleSkillTreeTutorialComplete}
        isOnSkillTree={true}
      />

      {/* Skill Tree Scene - Full Screen */}
      {viewMode === "skillTree" && (
        <Box pb={skillTreeSceneBottomPadding} w="100%">
          {pathMode === "plate" && !showAlphabetBootcamp && (
            <DailyPlateHome
              user={user}
              targetLang={resolvedTargetLang}
              appLanguage={appLanguage}
              dailyXp={dailyXpToday}
              dailyGoalXp={dailyGoalTarget}
              sessionActive={plateSessionActive}
              onStartPractice={handleStartDailyPractice}
              onResetPlate={handleResetQuestPlate}
              questKinds={questKinds}
              ctaDisabled={showSkillTreeTutorial}
              petHealth={dailyGoalPetHealth}
              petName={user?.dailyGoalPetName || ""}
              petType={dailyGoalPetType}
              companionLevel={companionLevel}
              onCustomizePet={handleCustomizePet}
              completedGoalDates={dailyGoalCompletedDates}
              dailyXpHistory={dailyGoalXpHistory}
            />
          )}
          {showAlphabetBootcamp ? (
            <AlphabetBootcamp
              appLanguage={appLanguage}
              targetLang={resolvedTargetLang}
              npub={activeNpub}
              languageXp={userProgress?.totalXp || 0}
              cefrLevel={repairLessonCefrLevel}
              placementLevel={phonicsPlacementLevel}
              courseCeilingLevel={phonicsCourseCeilingLevel}
              pauseMs={user?.progress?.pauseMs ?? DEFAULT_VOICE_PAUSE_MS}
            />
          ) : (
            // In plate mode the skill tree renders nothing visible, but it
            // stays mounted (display:none) so the keep-alive voice surfaces
            // survive mode switches without contributing scroll height.
            <Box
              display={pathMode === "plate" ? "none" : "block"}
              aria-hidden={pathMode === "plate"}
            >
              <SkillTree
                targetLang={resolvedTargetLang}
                level={resolvedLevel}
                supportLang={resolvedSupportLang}
                userProgress={userProgress}
                onStartLesson={handleStartLesson}
                onCompleteFlashcard={handleCompleteFlashcard}
                onRandomPracticeFlashcard={handleRandomPracticeFlashcard}
                pauseMs={user?.progress?.pauseMs ?? DEFAULT_VOICE_PAUSE_MS}
                showMultipleLevels={true}
                levels={relevantLevels}
                // Mode-specific level props
                activeLessonLevel={displayActiveLessonLevel}
                activeFlashcardLevel={displayActiveFlashcardLevel}
                currentLessonLevel={currentLessonLevel}
                currentFlashcardLevel={currentFlashcardLevel}
                tutorUnlockedLevel={tutorUnlockedLevel}
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
                initialUnits={skillTreeInitialUnits.units}
                initialUnitsKey={skillTreeInitialUnits.key || ""}
                onTutorFirstLessonComplete={handleTutorFirstLessonComplete}
                onTutorDailyGoalCelebration={handleTutorDailyGoalCelebration}
                bottomActionBarMinimized={isBottomActionBarMinimized}
                onVoiceConnectionStatusChange={
                  handleVoiceConnectionStatusChange
                }
                // Tutorial props
                isTutorialComplete={hasCompletedSkillTreeTutorial}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Learning Modules Scene */}
      {isGameFullScreen && (
        <Box
          w="100%"
          h="100dvh"
          position="fixed"
          top={0}
          left={0}
          zIndex={1000}
          bg="gray.900"
        >
          {GameRouterComponent ? (
            <GameRouterComponent
              lessonContext={activeLesson}
              initialScenario={
                preGeneratedGameScenario || tutorialGameInitialScenario
              }
              targetLang={resolvedTargetLang}
              supportLang={resolvedSupportLang}
              npub={activeNpub}
              onComplete={() => handleReturnToSkillTree()}
              onGameComplete={
                activeLesson?.isGame && !activeLesson?.isTutorial
                  ? (result) =>
                      // The completion overlay shows no buttons in this flow,
                      // so if the completion write fails, still exit back to
                      // the skill tree rather than stranding the player (a
                      // repeat call after success is a no-op).
                      triggerLessonCompletion("game_complete", {
                        xpEarned: result?.xp,
                      }).finally(() => handleReturnToSkillTree())
                  : undefined
              }
              onSkip={switchToRandomLessonMode}
            />
          ) : (
            <GameLoadingFallback minH="100dvh" />
          )}
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
                          key={`realtime-${lessonModuleNonce}`}
                          auth={auth}
                          activeNpub={activeNpub}
                          activeNsec={activeNsec}
                          level={user?.progress?.level}
                          supportLang={resolvedSupportLang}
                          targetLang={user?.progress?.targetLang}
                          showTranslations={user?.progress?.showTranslations}
                          pauseMs={
                            user?.progress?.pauseMs ?? DEFAULT_VOICE_PAUSE_MS
                          }
                          helpRequest={user?.progress?.helpRequest}
                          practicePronunciation={
                            user?.progress?.practicePronunciation
                          }
                          lesson={activeLesson}
                          lessonContent={activeLessonContent?.realtime}
                          onSkip={switchToRandomLessonMode}
                          bottomActionBarMinimized={isBottomActionBarMinimized}
                          onSwitchedAccount={handleSwitchedAccount}
                        />
                      </TabPanel>
                    );
                  case "stories":
                    return (
                      <TabPanel
                        key="stories"
                        px={0}
                        pt={isTutorialMode ? 0 : 4}
                      >
                        <StoryMode
                          key={`stories-${lessonModuleNonce}`}
                          userLanguage={appLanguage}
                          activeNpub={activeNpub}
                          activeNsec={activeNsec}
                          pauseMs={
                            user?.progress?.pauseMs ?? DEFAULT_VOICE_PAUSE_MS
                          }
                          lesson={activeLesson}
                          lessonContent={activeLessonContent?.stories}
                          onSkip={switchToRandomLessonMode}
                        />
                      </TabPanel>
                    );
                  case "reading":
                    return (
                      <TabPanel key="reading" px={0}>
                        <History
                          key={`reading-${lessonModuleNonce}`}
                          userLanguage={appLanguage}
                          lesson={activeLesson}
                          lessonContent={activeLessonContent?.reading}
                          onSkip={switchToRandomLessonMode}
                          lessonStartXp={lessonStartXp}
                        />
                      </TabPanel>
                    );
                  case "grammar":
                    return (
                      <TabPanel key="grammar" px={0}>
                        <GrammarBook
                          key={`grammar-${lessonModuleNonce}`}
                          userLanguage={appLanguage}
                          activeNpub={activeNpub}
                          activeNsec={activeNsec}
                          pauseMs={
                            user?.progress?.pauseMs ?? DEFAULT_VOICE_PAUSE_MS
                          }
                          lesson={activeLesson}
                          lessonContent={activeLessonContent?.grammar}
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
                          key={`vocabulary-${lessonModuleNonce}`}
                          userLanguage={appLanguage}
                          activeNpub={activeNpub}
                          activeNsec={activeNsec}
                          pauseMs={
                            user?.progress?.pauseMs ?? DEFAULT_VOICE_PAUSE_MS
                          }
                          lesson={activeLesson}
                          lessonContent={activeLessonContent?.vocabulary}
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
                        {activeLesson?.isTutorial &&
                        !preGeneratedGameScenario &&
                        !tutorialGamePreparationFailed ? (
                          <Box
                            w="100%"
                            h={{
                              base: "min(62vh, calc(100dvh - 220px))",
                              md: "min(70vh, calc(100dvh - 170px))",
                            }}
                            minH={{ base: "300px", md: "320px" }}
                            maxH="720px"
                            borderRadius="xl"
                            overflow="hidden"
                            mt={-2}
                          >
                            <TutorialGameLoadingFallback
                              supportLang={resolvedSupportLang}
                            />
                          </Box>
                        ) : GameRouterComponent ? (
                          <GameRouterComponent
                            lessonContext={activeLesson}
                            initialScenario={
                              preGeneratedGameScenario ||
                              tutorialGameInitialScenario
                            }
                            targetLang={resolvedTargetLang}
                            supportLang={resolvedSupportLang}
                            npub={activeNpub}
                            onSkip={switchToRandomLessonMode}
                            onScenarioReady={(scenario) => {
                              if (activeLesson?.isTutorial && scenario) {
                                setTutorialGameScenario(scenario);
                              }
                            }}
                          />
                        ) : (
                          <GameLoadingFallback />
                        )}
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

      <ProficiencyTestModalSharedBackdropWrapper
        isOpen={proficiencyTestOpen}
        appChainOpen={appOnboardingChainOpen}
        onClose={handleProficiencySkip}
        onTakeTest={handleProficiencyTakeTest}
        lang={appLanguage}
        targetLangLabel={
          t[`language_${resolvedTargetLang}`] ||
          TARGET_LANGUAGE_LABELS[resolvedTargetLang]
        }
      />

      <GettingStartedModalSharedBackdropWrapper
        isOpen={gettingStartedOpen}
        appChainOpen={appOnboardingChainOpen}
        onClose={handleGettingStartedSkip}
        secretKey={activeNsec}
        lang={appLanguage}
      />

      {/* Modes intro carousel — onboarding step after the proficiency modal */}
      <ModesCarouselModal
        isOpen={modesIntroOpen}
        onClose={handleModesIntroClose}
        includePhonics={ALPHABET_LANGS.includes(resolvedTargetLang)}
        lang={appLanguage}
        useSharedBackdrop={modesIntroOpen || appOnboardingChainOpen}
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
        motionPreset="none"
      >
        <ModalOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
          bg="linear-gradient(135deg, #c084fc 0%, #22d3ee 100%)"
          color="white"
          borderRadius="2xl"
          boxShadow="2xl"
          maxW={{ base: "90%", sm: "md" }}
        >
          <ModalHeader textAlign="center" fontSize="2xl" fontWeight="bold">
            {t.timer_times_up_title || "Time's up!"}
          </ModalHeader>
          <ModalCloseButton
            color="white"
            left={appLanguage === "ar" ? 3 : undefined}
            right={appLanguage === "ar" ? "auto" : undefined}
          />
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
        motionPreset="none"
      >
        <ModalOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
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
                  {uiCopy(appLanguage, {
                    en: "Daily Goal Complete!",
                    es: "¡Meta diaria alcanzada!",
                    it: "Obiettivo giornaliero raggiunto!",
                    fr: "Objectif quotidien atteint !",
                    ja: "デイリー目標達成！",
                    hi: "दैनिक लक्ष्य पूरा हुआ!",
                    ar: "الهدف اليومي اكتمل!",
                    zh: "每日目标已完成！",
                  })}
                </Text>
                <Text fontSize={{ base: "md", md: "lg" }} opacity={0.9}>
                  {uiCopy(appLanguage, {
                    en: "You hit today’s XP target.",
                    es: "Alcanzaste tu objetivo de XP de hoy.",
                    it: "Hai raggiunto il tuo obiettivo XP di oggi.",
                    fr: "Tu as atteint ton objectif XP d'aujourd'hui.",
                    ja: "今日のXP目標を達成しました。",
                    hi: "आपने आज का XP लक्ष्य पूरा कर लिया।",
                    ar: "حققت هدف XP بتاع النهارده.",
                    zh: "你已达成今天的 XP 目标。",
                  })}
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
                        {uiCopy(appLanguage, {
                          en: "Goal",
                          es: "Meta",
                          it: "Obiettivo",
                          fr: "Objectif",
                          ja: "目標",
                          hi: "लक्ष्य",
                          ar: "الهدف",
                          zh: "目标",
                        })}
                      </Text>
                      <Text fontSize="3xl" fontWeight="bold" color="yellow.200">
                        {dailyGoalTarget || 0} XP
                      </Text>
                    </VStack>
                  </HStack>
                  <Text fontSize="sm" opacity={0.85}>
                    {uiCopy(appLanguage, {
                      en: "Keep the streak going and come back tomorrow for a new goal!",
                      es: "¡Sigue la racha y vuelve mañana para un nuevo objetivo!",
                      it: "Mantieni la serie e torna domani per un nuovo obiettivo!",
                      fr: "Garde la serie et reviens demain pour un nouvel objectif !",
                      ja: "連続記録を続けて、明日また新しい目標に挑戦しましょう！",
                      hi: "अपनी श्रृंखला बनाए रखें और नए लक्ष्य के लिए कल फिर आएँ!",
                      ar: "كمّل السلسلة وارجع بكرة لهدف جديد!",
                      zh: "保持连续学习，明天回来挑战新目标！",
                    })}
                  </Text>
                </VStack>
              </Box>

              <DailyGoalPetPanel
                lang={appLanguage}
                health={celebrationPetHealth}
                petName={user?.dailyGoalPetName || ""}
                petType={dailyGoalPetType}
                companionLevel={companionLevel}
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
                {uiCopy(appLanguage, {
                  en: "Keep learning",
                  es: "Seguir practicando",
                  pt: "Continuar aprendendo",
                  it: "Continua ad imparare",
                  fr: "Continuer a apprendre",
                  ja: "学習を続ける",
                  hi: "सीखना जारी रखें",
                  ar: "كمّل تعلّم",
                  zh: "继续学习",
                })}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Companion unlock celebration modal */}
      <Modal
        isOpen={!!companionUnlockModal}
        onClose={handleCloseCompanionUnlockModal}
        returnFocusOnClose={false}
        closeOnOverlayClick={false}
        closeOnEsc={false}
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
          bg="linear-gradient(135deg, #0891b2 0%, #06b6d4 42%, #0e7490 100%)"
          color="white"
          borderRadius="2xl"
          boxShadow="0 28px 80px rgba(8, 145, 178, 0.52)"
          maxW={{ base: "90%", sm: "md" }}
        >
          <ModalBody py={10} px={{ base: 5, md: 8 }}>
            <VStack spacing={6} textAlign="center">
              <VStack spacing={2}>
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
                  {uiCopy(appLanguage, {
                    en: "{companion} unlocked!",
                    es: "¡Desbloqueaste {companion}!",
                    pt: "{companion} desbloqueado!",
                    it: "{companion} sbloccato!",
                    fr: "{companion} debloque !",
                    ja: "{companion}をアンロック！",
                    hi: "{companion} अनलॉक हुआ!",
                    ar: "{companion} اتفتح!",
                    zh: "{companion} 已解锁！",
                  }).replace("{companion}", companionUnlockModal?.name || "")}
                </Text>
                <Text
                  fontSize="md"
                  opacity={0.9}
                  lineHeight="1.45"
                  whiteSpace="pre-line"
                >
                  {uiCopy(appLanguage, {
                    en: "You reached Level {level}.\nThis companion can join you now.",
                    es: "Llegaste al nivel {level}.\nEste compañero ya puede acompañarte.",
                    pt: "Voce chegou ao nivel {level}.\nEste companheiro ja pode ir com voce.",
                    it: "Hai raggiunto il livello {level}.\nQuesto compagno ora puo unirsi a te.",
                    fr: "Tu as atteint le niveau {level}.\nCe compagnon peut maintenant te rejoindre.",
                    ja: "レベル{level}に到達しました。\nこの相棒を連れていけます。",
                    hi: "आप स्तर {level} पर पहुंच गए।\nयह साथी अब आपके साथ आ सकता है।",
                    ar: "وصلت للمستوى {level}.\nالرفيق ده يقدر ينضم لك دلوقتي.",
                    zh: "你达到了等级 {level}。\n这个伙伴现在可以加入你了。",
                  }).replace(
                    "{level}",
                    String(companionUnlockModal?.unlockLevel || companionLevel),
                  )}
                </Text>
              </VStack>

              <DailyGoalPetPanel
                lang={appLanguage}
                health={100}
                petName={companionUnlockModal?.name || ""}
                petType={companionUnlockModal?.type || "dog"}
                companionLevel={
                  companionUnlockModal?.reachedLevel || companionLevel
                }
                variant="celebration"
                celebrationTone="unlock"
                showPreview={false}
              />

              <VStack spacing={4} w="100%">
                <Button
                  size="lg"
                  width="100%"
                  bg="white"
                  color="#0e7490"
                  _hover={{ bg: "rgba(255, 255, 255, 0.92)" }}
                  _active={{ bg: "rgba(255, 255, 255, 0.82)" }}
                  onClick={handleEquipCompanionUnlock}
                  fontWeight="bold"
                  fontSize="lg"
                  py={6}
                >
                  {uiCopy(appLanguage, {
                    en: "Equip",
                    es: "Equipar",
                    pt: "Equipar",
                    it: "Equipaggia",
                    fr: "Equiper",
                    ja: "設定する",
                    hi: "लगाएँ",
                    ar: "استخدمه",
                    zh: "装备",
                  })}
                </Button>
                <Button
                  size="md"
                  width="100%"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "rgba(207, 250, 254, 0.24)" }}
                  onClick={handleCloseCompanionUnlockModal}
                >
                  {uiCopy(appLanguage, {
                    en: "Keep current",
                    es: "Mantener actual",
                    pt: "Manter atual",
                    it: "Mantieni attuale",
                    fr: "Garder l'actuel",
                    ja: "今のまま",
                    hi: "मौजूदा रखें",
                    ar: "خليك على الحالي",
                    zh: "保留当前",
                  })}
                </Button>
              </VStack>
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
                  {uiCopy(appLanguage, {
                    en: "Lesson Complete!",
                    es: "¡Lección Completada!",
                    pt: "Lição concluída!",
                    it: "Lezione Completata!",
                    fr: "Lecon terminee !",
                    ja: "レッスン完了！",
                    hi: "पाठ पूरा हुआ!",
                    ar: "الدرس اكتمل!",
                    zh: "课程完成！",
                  })}
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
                    {uiCopy(appLanguage, {
                      en: "XP Earned",
                      es: "XP Ganado",
                      pt: "XP ganho",
                      it: "XP Guadagnato",
                      fr: "XP gagne",
                      ja: "獲得XP",
                      hi: "प्राप्त XP",
                      ar: "XP المكتسبة",
                      zh: "获得的 XP",
                    })}
                  </Text>
                  <Text fontSize="5xl" fontWeight="bold" color="yellow.300">
                    +{completedLessonData?.xpEarned || 0}
                  </Text>
                  <Text fontSize="sm" opacity={0.8}>
                    {uiCopy(appLanguage, {
                      en: "Experience Points",
                      es: "Puntos de Experiencia",
                      pt: "Pontos de experiência",
                      it: "Punti Esperienza",
                      fr: "Points d'experience",
                      ja: "経験値",
                      hi: "अनुभव अंक",
                      ar: "نقاط الخبرة",
                      zh: "经验值",
                    })}
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
                {uiCopy(appLanguage, {
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
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Daily Plate celebration modal: exercise complete / plate cleared */}
      <Modal
        isOpen={!!plateCelebration}
        onClose={handlePlateCelebrationContinue}
        returnFocusOnClose={false}
        isCentered
        size="lg"
        motionPreset="none"
        closeOnOverlayClick={false}
      >
        <ModalOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
          bg={
            plateCelebration?.type === "cleared"
              ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              : "linear-gradient(135deg, #10b981 0%, #0d9488 100%)"
          }
          color="white"
          borderRadius="2xl"
          boxShadow="2xl"
          maxW={{ base: "90%", sm: "md" }}
        >
          <ModalBody py={12} px={8}>
            {plateCelebration?.type === "cleared" ? (
              <VStack spacing={6} textAlign="center">
                <SparkleFrame>
                  <Box
                    bg="rgba(255, 255, 255, 0.2)"
                    borderRadius="full"
                    p={4}
                    border="2px solid"
                    borderColor="rgba(255, 255, 255, 0.3)"
                    boxShadow="0 20px 40px rgba(0, 0, 0, 0.18)"
                  >
                    <RandomCharacter
                      key={`plate-cleared-${plateCelebration ? "open" : "closed"}`}
                      width="96px"
                      notSoRandomCharacter={"29"}
                    />
                  </Box>
                </SparkleFrame>
                <VStack spacing={2}>
                  <Text fontSize="3xl" fontWeight="bold">
                    {plateUiCopy(appLanguage, PLATE_CLEARED_COPY)}
                  </Text>
                  <Text fontSize="md" opacity={0.9}>
                    {plateUiCopy(appLanguage, PLATE_BONUS_TOAST_COPY)}
                  </Text>
                </VStack>
                <Box
                  bg="rgba(255, 255, 255, 0.2)"
                  borderRadius="xl"
                  py={6}
                  px={8}
                  width="100%"
                  border="2px solid"
                  borderColor="rgba(255, 255, 255, 0.4)"
                >
                  <VStack spacing={1}>
                    <Text fontSize="5xl" fontWeight="bold" color="yellow.200">
                      +{DAILY_PLATE_BONUS_XP}
                    </Text>
                    <Text
                      fontSize="sm"
                      opacity={0.85}
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      XP
                    </Text>
                  </VStack>
                </Box>
                <Button
                  size="lg"
                  width="100%"
                  bg="white"
                  color="orange.600"
                  boxShadow="0 4px 0 rgba(154, 52, 18, 0.6)"
                  _hover={{ bg: "rgba(255, 255, 255, 0.92)" }}
                  _active={{
                    bg: "rgba(255, 255, 255, 0.82)",
                    boxShadow: "0 2px 0 rgba(154, 52, 18, 0.6)",
                    transform: "translateY(2px)",
                  }}
                  _focus={{ boxShadow: "0 4px 0 rgba(154, 52, 18, 0.6)" }}
                  _focusVisible={{
                    boxShadow: "0 4px 0 rgba(154, 52, 18, 0.6)",
                  }}
                  onClick={handlePlateCelebrationContinue}
                  fontWeight="bold"
                  fontSize="lg"
                  py={6}
                >
                  {plateUiCopy(appLanguage, PLATE_CLOSE_COPY)}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  width="100%"
                  mt={-2}
                  color="white"
                  fontWeight="semibold"
                  _hover={{ bg: "rgba(255, 255, 255, 0.14)" }}
                  _active={{ bg: "rgba(255, 255, 255, 0.22)" }}
                  onClick={() => {
                    // Close the celebration through the normal path (returns
                    // home when navigateHome is set), with the Memory drawer
                    // opening on top of wherever that lands.
                    handlePlateCelebrationContinue();
                    setNotesOpen(true);
                  }}
                >
                  {plateUiCopy(appLanguage, PLATE_VIEW_NOTES_COPY)}
                </Button>
              </VStack>
            ) : plateCelebration ? (
              <VStack spacing={6} textAlign="center">
                <SparkleFrame>
                  <Box
                    bg="rgba(255, 255, 255, 0.2)"
                    borderRadius="full"
                    p={4}
                    border="2px solid"
                    borderColor="rgba(255, 255, 255, 0.3)"
                    boxShadow="0 20px 40px rgba(0, 0, 0, 0.18)"
                  >
                    <RandomCharacter
                      key={`quest-complete-${plateCelebration?.completed || "course"}`}
                      width="96px"
                      notSoRandomCharacter={"25"}
                    />
                  </Box>
                </SparkleFrame>
                <VStack spacing={2}>
                  <Text fontSize="3xl" fontWeight="bold">
                    {plateUiCopy(appLanguage, PLATE_EXERCISE_COMPLETE_COPY)}
                  </Text>
                  <Text fontSize="lg" opacity={0.9}>
                    {plateUiCopy(
                      appLanguage,
                      PLATE_COURSE_META[plateCelebration.completed]?.label || {
                        en: "",
                      },
                    )}
                    {plateCelebration.progress
                      ? ` ${plateCelebration.progress.count}/${plateCelebration.progress.target}`
                      : ""}{" "}
                    ✓
                  </Text>
                </VStack>
                {plateCelebration.next ? (
                  <Box
                    bg="rgba(255, 255, 255, 0.18)"
                    borderRadius="xl"
                    py={4}
                    px={6}
                    width="100%"
                    border="2px solid"
                    borderColor="rgba(255, 255, 255, 0.35)"
                  >
                    <HStack justify="center" spacing={3}>
                      <Text
                        fontSize="sm"
                        opacity={0.85}
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        {plateUiCopy(appLanguage, PLATE_NEXT_COPY)}
                      </Text>
                      {(() => {
                        const NextIcon =
                          PLATE_COURSE_META[plateCelebration.next]?.icon;
                        return NextIcon ? <NextIcon size={18} /> : null;
                      })()}
                      <Text fontSize="md" fontWeight="bold">
                        {plateUiCopy(
                          appLanguage,
                          PLATE_COURSE_META[plateCelebration.next]?.label || {
                            en: "",
                          },
                        )}
                      </Text>
                    </HStack>
                  </Box>
                ) : null}
                <Button
                  size="lg"
                  width="100%"
                  bg="white"
                  color="teal.600"
                  boxShadow="0 4px 0 rgba(44, 122, 123, 0.55)"
                  _hover={{ bg: "rgba(255, 255, 255, 0.92)" }}
                  _active={{
                    bg: "rgba(255, 255, 255, 0.82)",
                    boxShadow: "0 2px 0 rgba(44, 122, 123, 0.55)",
                    transform: "translateY(2px)",
                  }}
                  _focus={{ boxShadow: "0 4px 0 rgba(44, 122, 123, 0.55)" }}
                  _focusVisible={{
                    boxShadow: "0 4px 0 rgba(44, 122, 123, 0.55)",
                  }}
                  onClick={handlePlateCelebrationContinue}
                  fontWeight="bold"
                  fontSize="lg"
                  py={6}
                >
                  {plateUiCopy(appLanguage, PLATE_CONTINUE_COPY)}
                </Button>
              </VStack>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Proficiency Level Completion Celebration Modal */}
      <Modal
        isOpen={showProficiencyCompletionModal}
        onClose={handleCloseProficiencyCompletionModal}
        isCentered
        size="lg"
        closeOnOverlayClick={true}
        motionPreset="none"
      >
        <ModalOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
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
                  {uiCopy(appLanguage, {
                    en: "Level Complete!",
                    es: "¡Nivel Completado!",
                    it: "Livello completato!",
                    fr: "Niveau termine !",
                    ja: "レベル完了！",
                    hi: "स्तर पूरा हुआ!",
                    zh: "等级完成！",
                  })}
                </Text>
                <Text fontSize="2xl" opacity={0.95} fontWeight="semibold">
                  {completedProficiencyData?.level} -{" "}
                  {CEFR_LEVEL_INFO[completedProficiencyData?.level]?.name[
                    appLanguage
                  ] ||
                    CEFR_LEVEL_INFO[completedProficiencyData?.level]?.name.en}
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
                    {uiCopy(appLanguage, {
                      en: "Congratulations!",
                      es: "¡Felicitaciones!",
                      it: "Congratulazioni!",
                      fr: "Felicitations !",
                      ja: "おめでとうございます！",
                      hi: "बधाई हो!",
                      zh: "恭喜！",
                    })}
                  </Text>
                  <Text fontSize="md" opacity={0.9}>
                    {completedProficiencyData?.nextLevel
                      ? uiCopy(appLanguage, {
                          en: `You've unlocked level ${completedProficiencyData.nextLevel}`,
                          es: `Has desbloqueado el nivel ${completedProficiencyData.nextLevel}`,
                          pt: `Você desbloqueou o nível ${completedProficiencyData.nextLevel}`,
                          it: `Hai sbloccato il livello ${completedProficiencyData.nextLevel}`,
                          fr: `Tu as debloque le niveau ${completedProficiencyData.nextLevel}`,
                          ja: `レベル${completedProficiencyData.nextLevel}が開放されました`,
                          hi: `आपने स्तर ${completedProficiencyData.nextLevel} खोल लिया है`,
                          zh: `你已解锁等级 ${completedProficiencyData.nextLevel}`,
                        })
                      : uiCopy(appLanguage, {
                          en: "You've completed all levels!",
                          es: "¡Has completado todos los niveles!",
                          pt: "Você concluiu todos os níveis!",
                          it: "Hai completato tutti i livelli!",
                          fr: "Tu as termine tous les niveaux !",
                          ja: "すべてのレベルを完了しました！",
                          hi: "आपने सभी स्तर पूरे कर लिए हैं!",
                          zh: "你已完成所有等级！",
                        })}
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
                  ? uiCopy(appLanguage, {
                      en: "Go to Next Level",
                      es: "Ir al Siguiente Nivel",
                      pt: "Ir para o próximo nível",
                      it: "Vai al livello successivo",
                      fr: "Aller au niveau suivant",
                      ja: "次のレベルへ",
                      hi: "अगले स्तर पर जाएँ",
                      zh: "前往下一等级",
                    })
                  : uiCopy(appLanguage, {
                      en: "Continue",
                      es: "Continuar",
                      pt: "Continuar",
                      it: "Continua",
                      fr: "Continuer",
                      ja: "続ける",
                      hi: "जारी रखें",
                      zh: "继续",
                    })}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

// ─── Modal Gates ──────────────────────────────────────────────────────────
// These tiny wrappers subscribe to useModalStore so the top-bar modals can
// react to dailyGoalOpen / timerModalOpen without re-rendering App. App passes
// stable props (data + callbacks); only the Gate re-renders on flag flip.

function OnboardingChainBackdrop({ appChainOpen }) {
  // One persistent, solid dim shared by the whole onboarding modal chain.
  // Perf notes:
  // - No backdrop-filter. A full-screen blur is re-rasterized every frame while
  //   the modals cross-fade — that was the jitter. A solid translucent fill is
  //   ~free for the compositor.
  // - Always mounted and opacity-toggled (not mount/unmounted), so it can't
  //   flicker if the chain flag blips between steps; a solid-color opacity fade
  //   is cheap and stays on one stable layer.
  // Combine both halves of the chain here: proficiency/gettingStarted arrive via
  // appChainOpen, while dailyGoal/timer are read from the store. This keeps the
  // dim up for the whole sequence (no gap between any two steps) without making
  // the App component subscribe to the two store booleans.
  const dailyGoalOpen = useModalStore((s) => s.dailyGoalOpen);
  const timerModalOpen = useModalStore((s) => s.timerModalOpen);
  const chainOpen = appChainOpen || dailyGoalOpen || timerModalOpen;
  // Latch the dim on through brief gaps between consecutive chain steps. When one
  // modal closes a frame before the next opens (e.g. proficiency -> "how it
  // works"), chainOpen blips false; the opacity transition would start fading
  // and then snap back, which reads as a flash. So turn the dim on instantly but
  // only turn it off after a short grace, cancelled if the next step opens.
  const [visible, setVisible] = useState(chainOpen);
  useEffect(() => {
    if (chainOpen) {
      setVisible(true);
      return undefined;
    }
    const timer = setTimeout(() => setVisible(false), 160);
    return () => clearTimeout(timer);
  }, [chainOpen]);
  return (
    <Portal>
      <Box
        aria-hidden="true"
        position="fixed"
        inset="0"
        zIndex="1300"
        pointerEvents="none"
        bg="var(--app-overlay)"
        opacity={visible ? 1 : 0}
        transition="opacity 0.16s ease"
      />
    </Portal>
  );
}

function DailyGoalModalGate({ appChainOpen, ...props }) {
  const isOpen = useModalStore((s) => s.dailyGoalOpen);
  // Sibling-aware: keeps useSharedBackdrop true across the (flushSync, gap-free)
  // daily-goal → timer swap, so the shared dim never blinks to this modal's own
  // overlay mid-handoff.
  const siblingOpen = useModalStore((s) => s.timerModalOpen);
  // Dismissible (close button + overlay/esc) when opened manually from the top
  // bar; locked during onboarding.
  const dismissible = useModalStore((s) => s.dailyGoalDismissible);
  // Lazy-mount: don't put the heavy modal subtree in the React tree until
  // the first open. Once mounted it stays mounted (so subsequent opens just
  // flip isOpen). This matched the perf pattern of FlashcardPracticeGate,
  // which the user reported as the only modal that "opens how I expect".
  const hasEverOpened = useRef(false);
  if (isOpen) hasEverOpened.current = true;
  if (!hasEverOpened.current) return null;
  return (
    <DailyGoalModal
      isOpen={isOpen}
      useSharedBackdrop={appChainOpen || isOpen || siblingOpen}
      dismissible={dismissible}
      {...props}
    />
  );
}

function SessionTimerModalGate({ appChainOpen, ...props }) {
  const isOpen = useModalStore((s) => s.timerModalOpen);
  // Sibling-aware (see DailyGoalModalGate) so the shared dim survives the swap.
  const siblingOpen = useModalStore((s) => s.dailyGoalOpen);
  const hasEverOpened = useRef(false);
  if (isOpen) hasEverOpened.current = true;
  if (!hasEverOpened.current) return null;
  return (
    <SessionTimerModal
      isOpen={isOpen}
      useSharedBackdrop={appChainOpen || isOpen || siblingOpen}
      {...props}
    />
  );
}

function ProficiencyTestModalSharedBackdropWrapper({
  isOpen,
  appChainOpen,
  ...props
}) {
  return (
    <ProficiencyTestModal
      isOpen={isOpen}
      useSharedBackdrop={isOpen || appChainOpen}
      {...props}
    />
  );
}

function GettingStartedModalSharedBackdropWrapper({
  isOpen,
  appChainOpen,
  ...props
}) {
  return (
    <GettingStartedModal
      isOpen={isOpen}
      useSharedBackdrop={isOpen || appChainOpen}
      {...props}
    />
  );
}

const MEMORY_CRYSTAL_SHARDS = [
  { x: 0, y: -32, size: 6.5, color: "#fde68a", delay: 0 },
  { x: 16, y: -28, size: 6.5, color: "#99f6e4", delay: 0 },
  { x: 28, y: -16, size: 6.5, color: "#fef3c7", delay: 0 },
  { x: 32, y: 0, size: 6.5, color: "#67e8f9", delay: 0 },
  { x: 28, y: 16, size: 6.5, color: "#fde68a", delay: 0 },
  { x: 16, y: 28, size: 6.5, color: "#5eead4", delay: 0 },
  { x: 0, y: 32, size: 6.5, color: "#fef3c7", delay: 0 },
  { x: -16, y: 28, size: 6.5, color: "#67e8f9", delay: 0 },
  { x: -28, y: 16, size: 6.5, color: "#fde68a", delay: 0 },
  { x: -32, y: 0, size: 6.5, color: "#99f6e4", delay: 0 },
  { x: -28, y: -16, size: 6.5, color: "#fef3c7", delay: 0 },
  { x: -16, y: -28, size: 6.5, color: "#fde68a", delay: 0 },
];

const MEMORY_CRYSTAL_SHAPES = [
  "polygon(50% 0%, 100% 45%, 62% 100%, 5% 60%)",
  "polygon(35% 0%, 100% 28%, 72% 100%, 0% 68%)",
  "polygon(62% 0%, 100% 62%, 42% 100%, 0% 35%)",
];

function NoteCaptureCrystalShards() {
  return (
    <Box
      position="absolute"
      inset={0}
      pointerEvents="none"
      aria-hidden="true"
      zIndex={51}
      overflow="visible"
      sx={{
        "@keyframes memoryCrystalGather": {
          "0%": {
            opacity: 0,
            transform:
              "translate(-50%, -50%) translate3d(var(--shard-x), var(--shard-y), 0) scale(0.25) rotate(var(--shard-start-rotate))",
          },
          "12%": { opacity: 0.75 },
          "38%": {
            opacity: 1,
            transform:
              "translate(-50%, -50%) translate3d(var(--shard-wander-x), var(--shard-wander-y), 0) scale(1.15) rotate(var(--shard-wander-rotate))",
          },
          "52%": { opacity: 0.5 },
          "68%": {
            opacity: 1,
            transform:
              "translate(-50%, -50%) translate3d(var(--shard-near-x), var(--shard-near-y), 0) scale(0.85) rotate(var(--shard-near-rotate))",
          },
          "88%": {
            opacity: 0.9,
            transform:
              "translate(-50%, -50%) translate3d(0, 0, 0) scale(0.4) rotate(var(--shard-end-rotate))",
          },
          "100%": {
            opacity: 0,
            transform:
              "translate(-50%, -50%) translate3d(0, 0, 0) scale(0.08) rotate(var(--shard-end-rotate))",
          },
        },
        "@keyframes memoryCrystalCatch": {
          "0%, 64%": {
            opacity: 0,
            transform: "translate(-50%, -50%) scale(0.25)",
          },
          "80%": {
            opacity: 0.9,
            transform: "translate(-50%, -50%) scale(1.2)",
          },
          "100%": {
            opacity: 0,
            transform: "translate(-50%, -50%) scale(0.35)",
          },
        },
        "@keyframes crystalShardGlint": {
          "0%, 18%, 100%": {
            opacity: 0,
            transform: "scale(0.35) rotate(0deg)",
          },
          "38%": {
            opacity: 1,
            transform: "scale(1.35) rotate(45deg)",
          },
          "58%": {
            opacity: 0.18,
            transform: "scale(0.65) rotate(82deg)",
          },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& [data-memory-crystal], & [data-crystal-catch]": {
            animation: "none",
            opacity: 0,
          },
        },
      }}
    >
      {MEMORY_CRYSTAL_SHARDS.map((shard, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const wanderX = Math.round(shard.x * 0.72);
        const wanderY = Math.round(shard.y * 0.72);
        const nearX = Math.round(shard.x * 0.24);
        const nearY = Math.round(shard.y * 0.24);
        const startRotate = (index * 37) % 120 - 60;
        const mainShape =
          MEMORY_CRYSTAL_SHAPES[index % MEMORY_CRYSTAL_SHAPES.length];
        return (
          <Box
            key={`${shard.x}-${shard.y}`}
            data-memory-crystal
            position="absolute"
            top="50%"
            left="50%"
            width={`${shard.size * 2.2}px`}
            height={`${shard.size * 2.2}px`}
            opacity={0}
            animation="memoryCrystalGather 2550ms ease-in-out both"
            animationDelay={`${shard.delay}ms`}
            willChange="transform, opacity"
            style={{
              "--shard-x": `${shard.x}px`,
              "--shard-y": `${shard.y}px`,
              "--shard-wander-x": `${wanderX}px`,
              "--shard-wander-y": `${wanderY}px`,
              "--shard-near-x": `${nearX}px`,
              "--shard-near-y": `${nearY}px`,
              "--shard-start-rotate": `${startRotate}deg`,
              "--shard-wander-rotate": `${startRotate + direction * 65}deg`,
              "--shard-near-rotate": `${startRotate + direction * 125}deg`,
              "--shard-end-rotate": `${startRotate + direction * 195}deg`,
            }}
          >
            <Box
              position="absolute"
              top="8%"
              left="29%"
              width="46%"
              height={`${62 + (index % 3) * 5}%`}
              background={`linear-gradient(135deg, rgba(255,255,255,0.98) 0%, ${shard.color} 42%, ${shard.color} 100%)`}
              clipPath={mainShape}
              filter={`drop-shadow(0 0 ${shard.size + 2}px ${shard.color})`}
              _after={{
                content: '""',
                position: "absolute",
                top: "11%",
                left: "23%",
                width: "34%",
                height: "48%",
                bg: "rgba(255,255,255,0.76)",
                clipPath: "polygon(50% 0%, 100% 100%, 0% 78%)",
              }}
            />
            <Box
              position="absolute"
              top={`${13 + (index % 2) * 12}%`}
              left="1%"
              width="31%"
              height="37%"
              background={`linear-gradient(145deg, rgba(255,255,255,0.9), ${shard.color})`}
              clipPath={
                MEMORY_CRYSTAL_SHAPES[
                  (index + 1) % MEMORY_CRYSTAL_SHAPES.length
                ]
              }
              filter={`drop-shadow(0 0 ${shard.size}px ${shard.color})`}
              transform={`rotate(${direction * -24}deg)`}
            />
            <Box
              position="absolute"
              right="2%"
              bottom={`${5 + (index % 3) * 5}%`}
              width="24%"
              height="31%"
              background={`linear-gradient(145deg, rgba(255,255,255,0.86), ${shard.color})`}
              clipPath={
                MEMORY_CRYSTAL_SHAPES[
                  (index + 2) % MEMORY_CRYSTAL_SHAPES.length
                ]
              }
              filter={`drop-shadow(0 0 ${shard.size}px ${shard.color})`}
              transform={`rotate(${direction * 31}deg)`}
            />
            <Box
              position="absolute"
              top={`${18 + (index % 3) * 12}%`}
              left={`${48 + (index % 2) * 8}%`}
              width="32%"
              height="32%"
              bg="rgba(255,255,255,0.98)"
              clipPath="polygon(50% 0%, 59% 39%, 100% 50%, 59% 61%, 50% 100%, 41% 61%, 0% 50%, 41% 39%)"
              opacity={0}
              animation="crystalShardGlint 900ms ease-in-out 2 both"
              animationDelay={`${320 + shard.delay + index * 35}ms`}
              filter="drop-shadow(0 0 3px rgba(255,255,255,0.95))"
            />
          </Box>
        );
      })}
      <Box
        data-crystal-catch
        position="absolute"
        top="50%"
        left="50%"
        width="28px"
        height="28px"
        opacity={0}
        animation="memoryCrystalCatch 2740ms ease-out both"
        willChange="transform, opacity"
      >
        {[0, 1, 2].map((layer) => (
          <Box
            key={layer}
            position="absolute"
            inset={`${layer * 21}%`}
            background={
              layer === 0
                ? "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(103,232,249,0.72))"
                : layer === 1
                  ? "rgba(94,234,212,0.9)"
                  : "white"
            }
            clipPath="polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
            filter={
              layer === 0
                ? "drop-shadow(0 0 8px rgba(103,232,249,0.9))"
                : undefined
            }
            transform={`rotate(${layer * 45}deg)`}
          />
        ))}
        <Box
          position="absolute"
          top="-12%"
          right="-8%"
          width="28%"
          height="34%"
          bg="white"
          clipPath={MEMORY_CRYSTAL_SHAPES[1]}
          transform="rotate(24deg)"
        />
        <Box
          position="absolute"
          bottom="-8%"
          left="2%"
          width="22%"
          height="29%"
          bg="#99f6e4"
          clipPath={MEMORY_CRYSTAL_SHAPES[2]}
          transform="rotate(-31deg)"
        />
      </Box>
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
  pathMode = "tutor",
  shouldAutoMinimize = false,
  onMinimizedChange,
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
    helpLabel ||
    t?.app_help_chat ||
    uiCopy(appLanguage, { en: "Help", es: "Ayuda", it: "Aiuto", ja: "ヘルプ" });
  const teamsLabel = t?.teams_drawer_title || "Teams";
  const tasksLabel =
    t?.real_world_tasks_title ||
    uiCopy(appLanguage, {
      en: "Immersion practice",
      es: "Práctica de inmersión",
      it: "Pratica di immersione",
      ja: "イマージョン練習",
    });
  const notesLabel =
    t?.app_notes ||
    uiCopy(appLanguage, { en: "Notes", es: "Notas", it: "Note", ja: "ノート" });

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
    {
      id: "plate",
      label: uiCopy(appLanguage, PLATE_TITLE_COPY),
      icon: PiSealQuestionDuotone,
    },
    {
      id: "path",
      label:
        t?.app_mode_path ||
        uiCopy(appLanguage, {
          en: "Lessons",
          es: "Ruta",
          it: "Percorso",
          ja: "学習パス",
        }),
      icon: PiPath,
    },
    {
      id: "flashcards",
      label:
        t?.app_mode_cards ||
        uiCopy(appLanguage, {
          en: "Cards",
          es: "Tarjetas",
          it: "Schede",
          ja: "カード",
        }),
      icon: PiCardsBold,
    },
    ...(ALPHABET_LANGS.includes(targetLang)
      ? [
          {
            id: "alphabet",
            label:
              t?.app_mode_phonics ||
              uiCopy(appLanguage, {
                en: "Phonics",
                es: "Fonética",
                pt: "Fonética",
                it: "Fonetica",
                fr: "Phonétique",
                de: "Phonetik",
                ja: "フォニックス",
                hi: "ध्वनिकी",
                ar: "الصوتيات",
                zh: "自然拼读",
              }),
            icon: LuLanguages,
          },
        ]
      : []),
    {
      id: "conversations",
      label:
        t?.app_mode_conversation ||
        uiCopy(appLanguage, {
          en: "Conversation",
          es: "Conversación",
          it: "Conversazione",
          ja: "会話",
        }),
      icon: RiChat3Line,
    },
    {
      id: "tutor",
      label:
        t?.app_mode_tutor ||
        uiCopy(appLanguage, {
          en: "Tutor",
          es: "Tutor",
          it: "Tutor",
          ja: "チューター",
        }),
      icon: RiBook2Line,
    },
  ];

  const currentMode =
    PATH_MODES.find((m) => m.id === pathMode) || PATH_MODES[0];
  const CurrentModeIcon = currentMode.icon;
  const modeMenuLabel =
    t?.app_mode_menu ||
    uiCopy(appLanguage, {
      en: "Mode",
      es: "Modo",
      it: "Modalità",
      ja: "モード",
    });

  // The notes button's resting "raised key" look is this hard bottom ledge.
  // Loading keeps the old quiet pulse; a captured memory gathers a tumbling
  // swarm of crystal fragments into the bookmark instead of using a glow.
  const notesLedgeShadow = isLightTheme
    ? "0 4px 0 rgba(180, 164, 144, 0.9)"
    : "0 4px 0 #313a4b";
  const notesAnimation = notesIsLoading
    ? "notesPulse 1.5s ease-in-out infinite"
    : notesIsDone
      ? "notesCrystalCatch 2760ms linear both"
      : undefined;
  // Collapse/minimize removed: the bottom action bar stays full everywhere —
  // no auto-minimize in lessons or voice modes, no collapse button, no minimized
  // pill. Forcing this false neutralizes all of it (effectiveIsMinimized can
  // never become true, the collapse control is gated off, and children receive
  // bottomActionBarMinimized=false via onMinimizedChange, i.e. the full layout).
  const shouldShowMinimizeControls = false;
  // Auto-minimize when entering a lesson, switching modules, or starting voice.
  const [isMinimized, setIsMinimized] = useState(shouldShowMinimizeControls);
  const prevShouldShowMinimizeControls = useRef(shouldShowMinimizeControls);
  const prevTab = useRef(currentTab);
  const effectiveIsMinimized = isMinimized && shouldShowMinimizeControls;

  useEffect(() => {
    if (shouldShowMinimizeControls && !prevShouldShowMinimizeControls.current) {
      setIsMinimized(true);
    } else if (!shouldShowMinimizeControls) {
      setIsMinimized(false);
    }
    prevShouldShowMinimizeControls.current = shouldShowMinimizeControls;
  }, [shouldShowMinimizeControls]);

  useEffect(() => {
    onMinimizedChange?.(effectiveIsMinimized);
  }, [effectiveIsMinimized, onMinimizedChange]);

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
    ? "0 0 0 2px rgba(56,178,172,0.5), 0 0 16px rgba(56,178,172,0.7)"
    : notesIsLoading
      ? "0 0 0 2px rgba(34,211,238,0.5), 0 0 16px rgba(34,211,238,0.7)"
      : undefined;
  const minimizedBorderColor = notesIsDone
    ? "teal.400"
    : notesIsLoading
      ? "cyan.400"
      : "var(--app-border)";
  const minimizedAnimation = notesIsLoading
    ? "notesPulse 1.5s ease-in-out infinite"
    : notesIsDone
      ? "notesDone 1.5s ease-out"
      : undefined;

  // Render minimized pill when this surface supports collapsing.
  if (effectiveIsMinimized) {
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
          touchAction="manipulation"
          onClick={() => {
            playSound?.(selectSound);
            setIsMinimized(false);
          }}
          borderRadius="24px"
          bg="var(--app-glass-bg)"
          backdropFilter="blur(8px)"
          aria-label={modeMenuLabel}
          w="48px"
          h="40px"
          px={0}
          py={2}
          cursor="pointer"
          display="flex"
          alignItems="center"
          justifyContent="center"
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
                  "0 0 0 3px rgba(56,178,172,0.6), 0 0 20px rgba(56,178,172,0.8)",
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
          shadowIntensity={isLightTheme ? 0.12 : 0.25}
          allowLightModeGlass
          fallbackBlur={isLightTheme ? "10px" : "2px"}
          fallbackBg={
            isLightTheme
              ? "rgba(255, 252, 247, 0.58)"
              : "var(--app-glass-bg-soft)"
          }
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
            {shouldShowMinimizeControls && (
              <Flex justify="center" mb={1}>
                <Box
                  as="button"
                  touchAction="manipulation"
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
                    <defs>
                      <linearGradient
                        id="immersionProgressGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                        gradientTransform="rotate(135 0.5 0.5)"
                      >
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
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
                      stroke="url(#immersionProgressGradient)"
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
                  touchAction="manipulation"
                  icon={<FiCompass size={16} />}
                  onClick={() => handleActionClick(onOpenTeams)}
                  aria-label={tasksLabel}
                  size="sm"
                  rounded="xl"
                  borderWidth={realWorldTasksAttention ? "2px" : "0px"}
                  borderColor={
                    realWorldTasksAttention ? "teal.400" : "gray.700"
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
                          "0 0 0 3px rgba(20,184,166,0.6), 0 0 20px rgba(6,182,212,0.75)",
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
                    bgGradient="linear(135deg, #14b8a6 0%, #06b6d4 100%)"
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
                touchAction="manipulation"
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

              <Box position="relative" flexShrink={0} overflow="visible">
                {notesIsDone && <NoteCaptureCrystalShards />}
                <IconButton
                  data-tutorial-id="notes"
                  touchAction="manipulation"
                  icon={
                    notesIsDone ? (
                      <RiBookmarkFill size={16} />
                    ) : (
                      <RiBookmarkLine size={16} />
                    )
                  }
                  aria-label={notesLabel}
                  onClick={() => handleActionClick(onOpenNotes)}
                  isLoading={notesIsLoading}
                  colorScheme="gray"
                  bg={notesIsDone ? "teal.400" : "gray.800"}
                  boxShadow={notesLedgeShadow}
                  color={notesIsDone ? "white" : "gray.100"}
                  size="sm"
                  position="relative"
                  zIndex={50}
                  rounded="xl"
                  transition="color 0.2s ease"
                  animation={notesAnimation}
                  sx={{
                    "@keyframes notesPulse": {
                      "0%": {
                        boxShadow: `${notesLedgeShadow}, 0 0 0 2px rgba(34,211,238,0.35), 0 0 8px rgba(34,211,238,0.4)`,
                      },
                      "50%": {
                        boxShadow: `${notesLedgeShadow}, 0 0 0 3px rgba(34,211,238,0.5), 0 0 20px rgba(34,211,238,0.7)`,
                      },
                      "100%": {
                        boxShadow: `${notesLedgeShadow}, 0 0 0 2px rgba(34,211,238,0.35), 0 0 8px rgba(34,211,238,0.4)`,
                      },
                    },
                    "@keyframes notesCrystalCatch": {
                      "0%": {
                        transform: "translateY(0) scale(1)",
                        backgroundColor: "#38b2ac",
                        animationTimingFunction:
                          "cubic-bezier(0.45, 0, 0.55, 1)",
                      },
                      "36%": {
                        transform: "translateY(-0.5px) scale(1.015)",
                        backgroundColor: "#2dd4bf",
                        animationTimingFunction:
                          "cubic-bezier(0.45, 0, 0.55, 1)",
                      },
                      "66%": {
                        transform: "translateY(1px) scale(0.965)",
                        backgroundColor: "#14b8a6",
                        animationTimingFunction:
                          "cubic-bezier(0.16, 1, 0.3, 1)",
                      },
                      "84%": {
                        transform: "translateY(-2px) scale(1.075)",
                        backgroundColor: "#22d3ee",
                        animationTimingFunction:
                          "cubic-bezier(0.34, 1.18, 0.64, 1)",
                      },
                      "100%": {
                        transform: "translateY(0) scale(1)",
                        backgroundColor: "#38b2ac",
                      },
                    },
                    "@media (prefers-reduced-motion: reduce)": {
                      animation: "none",
                    },
                  }}
                />
              </Box>

              <IconButton
                data-tutorial-id="help"
                touchAction="manipulation"
                icon={<MdOutlineSupportAgent size={16} />}
                onClick={() => handleActionClick(onOpenHelpChat)}
                aria-label={helpChatLabel}
                isDisabled={!onOpenHelpChat}
                size="sm"
                rounded="xl"
                bg="white"
                color="blue"
                boxShadow="0 4px 0 blue"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.92)",
                  color: "blue.500",
                  boxShadow: "0 4px 0 rgba(255, 255, 255, 0.36)",
                }}
                _active={{
                  bg: "rgba(255, 255, 255, 0.78)",
                  color: "blue.600",
                  boxShadow: "none",
                  transform: "translateY(4px)",
                }}
                zIndex={50}
                flexShrink={0}
              />

              {/* Path Mode Menu */}
              <Menu placement="top-end" isLazy lazyBehavior="keepMounted">
                <MenuButton
                  data-tutorial-id="mode"
                  touchAction="manipulation"
                  as={IconButton}
                  icon={<CurrentModeIcon size={16} />}
                  aria-label={modeMenuLabel}
                  size="sm"
                  rounded="xl"
                  flexShrink={0}
                  onClick={() => playSound?.("modeSwitch")}
                  bg={isLightTheme ? "#38b2ac" : undefined}
                  colorScheme={isLightTheme ? undefined : "teal"}
                  boxShadow={isLightTheme ? "0 4px 0 #237f7a" : undefined}
                  color="white"
                  _hover={
                    isLightTheme
                      ? {
                          bg: "#44c7bf",
                          boxShadow: "0 4px 0 #237f7a",
                        }
                      : undefined
                  }
                  _active={
                    isLightTheme
                      ? {
                          bg: "#319795",
                          boxShadow: "none",
                          transform: "translateY(4px)",
                        }
                      : undefined
                  }
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
                            playSound?.("modeSwitch");
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
