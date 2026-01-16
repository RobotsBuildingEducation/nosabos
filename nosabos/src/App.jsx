// src/App.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerOverlay,
  DrawerFooter,
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
  Badge,
  Tooltip,
  useDisclosure,
  useBreakpointValue,
  Alert,
  AlertIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import {
  SettingsIcon,
  ChevronDownIcon,
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
import { FiClock, FiPause, FiPlay, FiTarget } from "react-icons/fi";

import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { database, simplemodel } from "./firebaseResources/firebaseResources";

import { Navigate, useLocation } from "react-router-dom";

import useUserStore from "./hooks/useUserStore";
import { useDecentralizedIdentity } from "./hooks/useDecentralizedIdentity";
import useSoundSettings from "./hooks/useSoundSettings";

import GrammarBook from "./components/GrammarBook";
import Onboarding from "./components/Onboarding";
import RobotBuddyPro from "./components/RobotBuddyPro";
import RealTimeTest from "./components/RealTimeTest";

import { translations } from "./utils/translation";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "./utils/llm";
import Vocabulary from "./components/Vocabulary";
import StoryMode from "./components/Stories";
import History from "./components/History";
import HelpChatFab from "./components/HelpChatFab";
import { WaveBar } from "./components/WaveBar";
import DailyGoalModal from "./components/DailyGoalModal";
import GoalCalendar from "./components/GoalCalendar";
import JobScript from "./components/JobScript"; // ⬅️ NEW TAB COMPONENT
import IdentityDrawer from "./components/IdentityDrawer";
import SubscriptionGate from "./components/SubscriptionGate";
import { useNostrWalletStore } from "./hooks/useNostrWalletStore";
import { LuKey } from "react-icons/lu";
import AlphabetBootcamp from "./components/AlphabetBootcamp";
import TeamsDrawer from "./components/Teams/TeamsDrawer";
import NotesDrawer from "./components/NotesDrawer";
import useNotesStore from "./hooks/useNotesStore";
import { subscribeToTeamInvites } from "./utils/teams";
import SkillTree from "./components/SkillTree";
import {
  startLesson,
  completeLesson,
  getLanguageXp,
} from "./utils/progressTracking";
import { awardXp } from "./utils/utils";
import { RiArrowLeftLine } from "react-icons/ri";
import SessionTimerModal from "./components/SessionTimerModal";
import TutorialStepper from "./components/TutorialStepper";
import TutorialActionBarPopovers from "./components/TutorialActionBarPopovers";
import AnimatedBackground from "./components/AnimatedBackground";
import useAppUpdate from "./hooks/useAppUpdate";
import {
  FaBitcoin,
  FaCalendarAlt,
  FaCalendarCheck,
  FaKey,
} from "react-icons/fa";
import { BsCalendar2DateFill } from "react-icons/bs";
import { HiVolumeUp } from "react-icons/hi";
import sparkleSound from "./assets/sparkle.mp3";
import submitActionSound from "./assets/submitaction.mp3";
import selectSound from "./assets/select.mp3";
import dailyGoalSound from "./assets/dailygoal.mp3";
import {
  brazilianFlag,
  frenchFlag,
  germanFlag,
  greekFlag,
  italianFlag,
  japaneseFlag,
  mexicanFlag,
  netherlandsFlag,
  russianFlag,
  usaFlag,
} from "./components/flagsIcons/flags";

/* ---------------------------
   Small helpers
--------------------------- */
const isTrue = (v) => v === true || v === "true" || v === 1 || v === "1";

const CEFR_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
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
 * beginner -> A1, intermediate -> B1, advanced -> C1
 */
function migrateToCEFRLevel(level) {
  const migrations = {
    beginner: "A1",
    intermediate: "B1",
    advanced: "C1",
  };
  return migrations[level] || level || "A1";
}
const TARGET_LANGUAGE_LABELS = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  nl: "Dutch",
  nah: "Huastec Nahuatl",
  ja: "Japanese",
  ru: "Russian",
  de: "German",
  el: "Greek",
};
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
      payload.explanation || payload.reason || payload.summary || ""
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
    "onboardingCompleted"
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
      onboardingPayload.completed = false;
    }

    if (shouldSetStep) {
      const existing = Number(onboardingPayload.currentStep);
      onboardingPayload.currentStep = Number.isFinite(existing) ? existing : 1;
    }

    await setDoc(
      doc(db, "users", id),
      { onboarding: onboardingPayload },
      { merge: true }
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
    let userData = { id: snap.id, ...snap.data() };
    userData = await ensureOnboardingField(db, id, userData);
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
  openSettings,
  closeSettings,
  accountOpen,
  closeAccount,
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
}) {
  const toast = useToast();
  const t = translations[appLanguage] || translations.en;

  // ---- Local draft state (no autosave) ----
  const p = user?.progress || {};
  const [level, setLevel] = useState(migrateToCEFRLevel(p.level) || "A1");
  const [supportLang, setSupportLang] = useState(p.supportLang || "en");
  const [voice, setVoice] = useState(p.voice || "alloy");
  const defaultPersona =
    p.voicePersona ||
    personaDefaultFor(p.supportLang || supportLang || appLanguage) ||
    translations.en.onboarding_persona_default_example;
  const [voicePersona, setVoicePersona] = useState(defaultPersona);
  const [targetLang, setTargetLang] = useState(p.targetLang || "es");
  const [showTranslations, setShowTranslations] = useState(
    typeof p.showTranslations === "boolean" ? p.showTranslations : true
  );
  const [pauseMs, setPauseMs] = useState(
    Number.isFinite(p.pauseMs) ? p.pauseMs : 1200
  );
  const [helpRequest, setHelpRequest] = useState(
    (p.helpRequest || user?.helpRequest || "").trim()
  );
  const [practicePronunciation, setPracticePronunciation] = useState(
    !!p.practicePronunciation
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
    [t]
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
        label: t.onboarding_practice_nah,
        beta: false,
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
    ];

    const visible = options.filter((option) => !option.hidden);
    const stable = visible
      .filter((option) => !option.beta)
      .sort((a, b) => collator.compare(a.label, b.label));
    const beta = visible
      .filter((option) => option.beta)
      .sort((a, b) => collator.compare(a.label, b.label));

    return [...stable, ...beta];
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
    setLevel(migrateToCEFRLevel(q.level) || "A1");
    setSupportLang(q.supportLang || "en");
    setVoice(q.voice || "alloy");
    setVoicePersona(
      q.voicePersona ??
        personaDefaultFor(q.supportLang || supportLang || appLanguage) ??
        translations.en.onboarding_persona_default_example
    );
    setTargetLang(q.targetLang || "es");
    setShowTranslations(
      typeof q.showTranslations === "boolean" ? q.showTranslations : true
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

  const [currentId, setCurrentId] = useState(activeNpub || "");
  const [currentSecret, setCurrentSecret] = useState(activeNsec || "");
  const [switchNsec, setSwitchNsec] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

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
    [onPatchSettings, toast, appLanguage]
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
    [persistSettings]
  );

  useEffect(() => setCurrentId(activeNpub || ""), [activeNpub]);
  useEffect(() => setCurrentSecret(activeNsec || ""), [activeNsec]);

  const copy = async (text, msg = t.toast_copied || "Copied") => {
    try {
      await navigator.clipboard.writeText(text || "");
      toast({ title: msg, status: "success", duration: 1400 });
    } catch (e) {
      toast({
        title: t.toast_copy_failed || "Copy failed",
        description: String(e?.message || e),
        status: "error",
      });
    }
  };

  const switchAccountWithNsec = async () => {
    const nsec = (switchNsec || "").trim();
    if (!nsec) {
      toast({
        title: t.toast_paste_nsec || "Paste your nsec",
        status: "warning",
      });
      return;
    }
    if (!nsec.startsWith("nsec")) {
      toast({
        title: t.toast_invalid_key || "Invalid key",
        description: t.toast_must_start_nsec || "Key must start with 'nsec'.",
        status: "error",
      });
      return;
    }
    setIsSwitching(true);
    try {
      if (typeof auth !== "function")
        throw new Error("auth(nsec) is not available.");
      const res = await auth(nsec);
      const npub = res?.user?.npub || localStorage.getItem("local_npub");
      if (!npub?.startsWith("npub"))
        throw new Error("Could not derive npub from the secret key.");

      localStorage.setItem("local_npub", npub);
      localStorage.setItem("local_nsec", nsec);

      setCurrentId(npub);
      setCurrentSecret(nsec);
      setSwitchNsec("");

      toast({
        title: t.toast_switched_account || "Switched account",
        status: "success",
      });
      closeAccount?.();

      await Promise.resolve(onSwitchedAccount?.(npub, nsec));
    } catch (e) {
      console.error("switchAccount error:", e);
      toast({
        title: t.toast_switch_failed || "Switch failed",
        description: e?.message || String(e),
        status: "error",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  /* ---------------------------
     Daily goal HUD (left side)
  --------------------------- */
  const MS_24H = 24 * 60 * 60 * 1000;
  const [dailyGoalXp, setDailyGoalXp] = useState(0);
  const [dailyXp, setDailyXp] = useState(0);
  const [dailyResetAt, setDailyResetAt] = useState(null);
  const [completedGoalDates, setCompletedGoalDates] = useState([]);

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
          { merge: true }
        );
      } catch (e) {
        toast({
          status: "error",
          title: appLanguage === "es" ? "Error al guardar" : "Save failed",
          description: String(e?.message || e),
        });
      }
    },
    [activeNpub, appLanguage, toast]
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

      const now = Date.now();
      const expired = !resetISO || now >= new Date(resetISO).getTime();
      if (expired && goal > 0) {
        const next = new Date(now + MS_24H).toISOString();
        await setDoc(
          ref,
          { dailyXp: 0, dailyHasCelebrated: false, dailyResetAt: next },
          { merge: true }
        );
        dxp = 0;
        resetISO = next;
      }

      setDailyGoalXp(goal);
      setGoalDraft(goal);
      setDailyXp(dxp);
      setDailyResetAt(resetISO);
      setCompletedGoalDates(completedDates);
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
      appLanguage === "es" ? "es" : "en-US"
    );

  return (
    <>
      {/* ---- Header (responsive) ---- */}
      <HStack
        as="header"
        w="100%"
        px={{ base: 2, md: 3 }}
        py={2}
        // bg="gray.900"
        color="gray.100"
        borderBottom="1px solid #000026ff"
        position="sticky"
        top={0}
        zIndex={100}
        wrap="wrap"
        spacing={{ base: 2, md: 3 }}
        backdropFilter="blur(4px)"
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

      {/* ---- Settings Drawer ---- */}
      <Drawer isOpen={settingsOpen} placement="bottom" onClose={closeSettings}>
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent
          bg="gray.900"
          color="gray.100"
          borderTopRadius="24px"
          maxH="100vh"
          sx={{
            "@supports (height: 100dvh)": {
              maxHeight: "100dvh",
            },
          }}
        >
          <DrawerCloseButton
            color="gray.400"
            _hover={{ color: "gray.200" }}
            top={4}
            right={4}
          />
          <DrawerHeader pb={2} pr={12}>
            <Box maxW="600px" mx="auto" w="100%">
              {t.ra_settings_title || "Settings"}
            </Box>
          </DrawerHeader>
          <DrawerBody pb={2}>
            <Box maxW="600px" mx="auto" w="100%">
              <VStack align="stretch" spacing={3}>
                <Wrap spacing={4}>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.400">
                      {translations[appLanguage]
                        .onboarding_support_menu_label || "Support:"}
                    </Text>
                    <Menu autoSelect={false} isLazy>
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
                      >
                        <HStack spacing={2}>
                          {selectedSupportOption?.flag}
                          <Text as="span">{selectedSupportOption?.label}</Text>
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
                            setSupportLang(value);
                            persistSettings({ supportLang: value });
                          }}
                        >
                          {supportLanguageOptions.map((option) => (
                            <MenuItemOption
                              key={option.value}
                              value={option.value}
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
                    <Text fontSize="xs" fontWeight="semibold" color="gray.400">
                      {translations[appLanguage]
                        .onboarding_practice_menu_label || "Practice:"}
                    </Text>
                    <Menu autoSelect={false} isLazy>
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
                      >
                        <HStack spacing={2}>
                          {selectedPracticeOption?.flag}
                          <Text as="span">
                            {selectedPracticeOption?.label}
                            {selectedPracticeOption?.beta ? " (beta)" : ""}
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
                            .onboarding_practice_menu_label || "Practice:"}
                        </Box>
                        <MenuOptionGroup
                          type="radio"
                          value={targetLang}
                          onChange={(value) => {
                            setTargetLang(value);
                            persistSettings({ targetLang: value });
                          }}
                        >
                          {practiceLanguageOptions.map((option) => (
                            <MenuItemOption
                              key={option.value}
                              value={option.value}
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

                {/* Persona */}
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
                            .onboarding_persona_default_example
                        )) ||
                      `e.g., ${translations[appLanguage].onboarding_persona_default_example}`
                    }
                  />
                  <Text fontSize="xs" opacity={0.7} mt={1}>
                    {t.ra_persona_help ||
                      "A short vibe/style hint for the AI voice."}
                  </Text>
                </Box>

                {/* VAD slider */}
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
                    onChange={setPauseMs}
                    onChangeEnd={(value) => persistSettings({ pauseMs: value })}
                  >
                    <SliderTrack bg="gray.700" h={3} borderRadius="full">
                      <SliderFilledTrack bg="linear-gradient(90deg, #3CB371, #5dade2)" />
                    </SliderTrack>
                    <SliderThumb boxSize={6} />
                  </Slider>
                  <Text fontSize="xs" opacity={0.6} mt={2}>
                    {vadHint}
                  </Text>
                </Box>

                {/* Allow Posts toggle */}
                <Box bg="gray.800" p={3} rounded="md">
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm">
                      {t.teams_feed_allow_label || "Allow posts"}
                    </Text>
                    <Switch
                      id="settings-allow-posts-switch"
                      isChecked={allowPosts}
                      onChange={(e) => onAllowPostsChange(e.target.checked)}
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

                {/* Sound Effects toggle */}
                <Box bg="gray.800" p={3} rounded="md">
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm">
                      {t.sound_effects_label || "Sound effects"}
                    </Text>
                    <Switch
                      id="settings-sound-effects-switch"
                      isChecked={soundEnabled}
                      onChange={(e) => onSoundEnabledChange(e.target.checked)}
                    />
                  </HStack>
                  <Text fontSize="xs" opacity={0.6} mt={2}>
                    {soundEnabled
                      ? t.sound_effects_enabled || "Sound effects are enabled."
                      : t.sound_effects_disabled || "Sound effects are muted."}
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
                          onChange={(val) => onVolumeChange(val)}
                          onChangeEnd={(val) => onVolumeSave(val)}
                        >
                          <SliderTrack bg="gray.700" h={3} borderRadius="full">
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
              </VStack>
            </Box>
          </DrawerBody>
          <DrawerFooter borderTop="1px solid" borderColor="gray.800">
            <Box maxW="600px" mx="auto" w="100%">
              <HStack w="100%" justify="flex-end" spacing={3}>
                <Button variant="ghost" onClick={closeSettings}>
                  {t.app_close || "Close"}
                </Button>
                <Button
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    try {
                      localStorage.clear();
                      window.location.href = "/";
                    } catch (err) {
                      console.error("signOut error:", err);
                      window.location.reload();
                    }
                  }}
                  colorScheme="gray"
                  border="1px solid orange"
                >
                  {t.app_sign_out || "Sign out"}
                </Button>
              </HStack>
            </Box>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ---- Account Drawer ---- */}
      <IdentityDrawer
        isOpen={accountOpen}
        onClose={closeAccount}
        t={t}
        appLanguage={appLanguage}
        activeNpub={currentId} // or props.activeNpub; both mirror each other
        activeNsec={currentSecret} // or props.activeNsec
        auth={auth}
        onSwitchedAccount={onSwitchedAccount}
        cefrResult={cefrResult}
        cefrLoading={cefrLoading}
        cefrError={cefrError}
        onRunCefrAnalysis={() => onRunCefrAnalysis?.({ dailyGoalXp, dailyXp })}
        user={user}
        onSelectIdentity={onSelectIdentity}
        isIdentitySaving={isIdentitySaving}
      />
    </>
  );
}

/* -------------------------------------------------------------------------------------------------
   App root
--------------------------------------------------------------------------------------------------*/
export default function App() {
  const toast = useToast();
  const initRef = useRef(false);
  const updateToastShownRef = useRef(false);
  const location = useLocation();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const helpChatDisclosure = useDisclosure();
  const helpChatRef = useRef(null);
  const { needsRefresh, reload } = useAppUpdate();
  const handleSendToHelpChat = useCallback(
    (text) => {
      const payload = (text || "").trim();
      if (!payload) return;
      helpChatDisclosure.onOpen();
      helpChatRef.current?.openAndSend(payload);
    },
    [helpChatDisclosure]
  );
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [pendingTeamInviteCount, setPendingTeamInviteCount] = useState(0);

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
      : ""
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
    []
  );

  const resolvedTargetLang = user?.progress?.targetLang || "es";
  const resolvedSupportLang =
    normalizeSupportLang(user?.progress?.supportLang) ||
    (storedUiLang === "es" ? "es" : "en");
  const resolvedLevel = migrateToCEFRLevel(user?.progress?.level) || "A1";

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
      typeof window !== "undefined" ? localStorage.getItem("local_nsec") : ""
    );

  // Active identity (npub/nsec)
  const [activeNpub, setActiveNpub] = useState(
    typeof window !== "undefined"
      ? (localStorage.getItem("local_npub") || "").trim()
      : ""
  );
  const [activeNsec, setActiveNsec] = useState(
    typeof window !== "undefined"
      ? (localStorage.getItem("local_nsec") || "").trim()
      : ""
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
        (invite) => invite.status === "pending"
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

  useEffect(() => {
    if (!needsRefresh || updateToastShownRef.current) return;
    updateToastShownRef.current = true;
    toast({
      id: "app-update",
      position: "top",
      duration: null,
      isClosable: true,
      render: ({ onClose }) => (
        <Alert
          status="info"
          variant="left-accent"
          borderRadius="md"
          boxShadow="md"
          alignItems="center"
        >
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="semibold">
              {t?.toast_update_title || "Update available"}
            </Text>
            <Text fontSize="sm">
              {t?.toast_update_desc ||
                "A new version is ready. Reload to update your app."}
            </Text>
          </Box>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => {
              onClose();
              reload();
            }}
          >
            {t?.toast_update_action || "Reload"}
          </Button>
        </Alert>
      ),
    });
  }, [needsRefresh, reload, t, toast]);
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

  const [cefrResult, setCefrResult] = useState(null);
  const [cefrLoading, setCefrLoading] = useState(false);
  const [cefrError, setCefrError] = useState("");
  const [isIdentitySaving, setIsIdentitySaving] = useState(false);

  useEffect(() => {
    // Default to true if user.allowPosts is not explicitly set
    setAllowPosts(user?.allowPosts !== false);
  }, [user?.allowPosts]);

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
      : "realtime"
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
  ];

  // Path mode state (path, flashcards, conversations, alphabet bootcamp)
  const [pathMode, setPathMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pathMode") || "path";
    }
    return ALPHABET_LANGS.includes(resolvedTargetLang) ? "alphabet" : "path";
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

  // Ensure alphabet languages default to bootcamp on language switch; others fall back to path
  // Only applies when user explicitly switches languages, not on initial load (respects localStorage)
  useEffect(() => {
    const validModes = ["alphabet", "path", "flashcards", "conversations"];
    if (!validModes.includes(pathMode)) {
      setPathMode(
        ALPHABET_LANGS.includes(resolvedTargetLang) ? "alphabet" : "path"
      );
      if (user) {
        lastPathTargetRef.current = resolvedTargetLang;
      }
      return;
    }

    // Only apply mode-switching logic when user is loaded AND language explicitly changed
    if (
      user &&
      lastPathTargetRef.current !== null &&
      lastPathTargetRef.current !== resolvedTargetLang
    ) {
      if (ALPHABET_LANGS.includes(resolvedTargetLang)) {
        setPathMode("alphabet");
      } else if (pathMode === "alphabet") {
        setPathMode("path");
      }
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

  // Play sparkle sound when lesson completion modal opens
  useEffect(() => {
    if (showCompletionModal) {
      playSound(sparkleSound);
    }
  }, [showCompletionModal, playSound]);

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
          { merge: true }
        );
        // Update local state
        patchUser?.({ shownProficiencyCelebrations: updated });
      } catch (e) {
        console.error("Failed to save celebration state:", e);
      }
    },
    [activeNpub, user?.shownProficiencyCelebrations, patchUser]
  );
  const wasCelebrationShown = useCallback(
    (level, mode) => {
      const shown = getShownCelebrations();
      return shown[getCelebrationKey(level, mode)] === true;
    },
    [getShownCelebrations]
  );

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
        { merge: true }
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
          })
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
    random: t?.tabs_random ?? "Random",
  };
  const TAB_ICONS = {
    realtime: <RiSpeakLine />,
    stories: <RiSpeakLine />,
    reading: <LuBookOpen />,
    grammar: <CiEdit />,
    vocabulary: <RiBook2Line />,
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
    level: "A1",
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
      console.log("[CONNECT_DID] Read local_npub from localStorage:", id);
      console.log(
        "[CONNECT_DID] Read local_nsec from localStorage:",
        localStorage.getItem("local_nsec")?.substring(0, 20) + "..."
      );
      let userDoc = null;

      if (id) {
        console.log(
          "[CONNECT_DID] Found existing npub, loading user from DB..."
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
        };
        await setDoc(doc(database, "users", id), base, { merge: true });
        userDoc = await loadUserObjectFromDB(database, id);
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
  const dailyGoalModalJustOpenedRef = useRef(false);
  const [shouldShowTimerAfterGoal, setShouldShowTimerAfterGoal] =
    useState(false);

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
  const [timerMinutes, setTimerMinutes] = useState("25");
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(null);
  const [timerDurationSeconds, setTimerDurationSeconds] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timeUpOpen, setTimeUpOpen] = useState(false);
  const timerIntervalRef = useRef(null);
  const timerRemainingRef = useRef(null);
  const isTimerRunning =
    timerActive && !timerPaused && timerRemainingSeconds !== null;

  const formatTimer = useCallback((seconds) => {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const mins = String(Math.floor(safe / 60)).padStart(2, "0");
    const secs = String(safe % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }, []);

  useEffect(() => {
    timerRemainingRef.current = timerRemainingSeconds;
  }, [timerRemainingSeconds]);

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
    [subscriptionXp, subscriptionVerified]
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
    setTimeUpOpen(false);
  }, []);

  const handleStartTimer = useCallback(() => {
    const parsedMinutes = Math.max(1, Math.round(Number(timerMinutes) || 0));
    handleResetTimer();
    const seconds = parsedMinutes * 60;
    setTimerDurationSeconds(seconds);
    setTimerRemainingSeconds(seconds);
    setTimerActive(true);
    setTimerPaused(false);
    setTimeUpOpen(false);
    setTimerModalOpen(false);
  }, [handleResetTimer, timerMinutes]);

  const handleCloseTimeUp = useCallback(() => {
    setTimeUpOpen(false);
    setTimerRemainingSeconds(null);
    setTimerDurationSeconds(null);
    setTimerActive(false);
    setTimerPaused(false);
  }, []);

  const timerHelper = useMemo(() => {
    if (timerRemainingSeconds === null) return null;
    return null;
  }, [formatTimer, timerActive, timerRemainingSeconds]);

  useEffect(() => {
    if (
      !timerActive ||
      timerPaused ||
      timerRemainingRef.current === null ||
      timerRemainingRef.current <= 0
    )
      return;

    const id = setInterval(() => {
      setTimerRemainingSeconds((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(id);
          timerIntervalRef.current = null;
          setTimerActive(false);
          setTimerPaused(false);
          setTimeUpOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerIntervalRef.current = id;

    return () => {
      clearInterval(id);
      timerIntervalRef.current = null;
    };
  }, [timerActive, timerPaused, timerRemainingSeconds]);

  const handleTogglePauseTimer = useCallback(() => {
    if (!timerActive || timerRemainingSeconds === null) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setTimerPaused((prev) => !prev);
  }, [timerActive, timerRemainingSeconds]);

  // Celebration listener (fired by awardXp when goal is reached)
  useEffect(() => {
    const onHit = () => {
      setCelebrateOpen(true);
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
            { merge: true }
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
    ]
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
        v.trim() !== "undefined"
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
    [allowPosts, resolveNpub, appLanguage, user, setUser]
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
    ]
  );

  const handleVolumeChange = useCallback(
    (nextValue) => {
      const normalized = Math.max(0, Math.min(100, Math.round(nextValue)));
      setSoundVolume(normalized);
      setSoundSettingsVolume(normalized);
    },
    [setSoundSettingsVolume]
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
    [resolveNpub, user, setUser]
  );

  const saveGlobalSettings = async (partial = {}) => {
    const npub = resolveNpub();
    if (!npub) return;

    const clampPause = (v) => {
      const n = Number.isFinite(v) ? Math.round(v) : 1200;
      return Math.max(200, Math.min(4000, Math.round(n / 100) * 100));
    };

    const prev = user?.progress || {
      level: "A1",
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
      level: migrateToCEFRLevel(partial.level ?? prev.level) ?? "A1",
      supportLang: ["en", "es"].includes(
        partial.supportLang ?? prev.supportLang
      )
        ? partial.supportLang ?? prev.supportLang
        : "en",
      voice: partial.voice ?? prev.voice ?? "alloy",
      voicePersona: (partial.voicePersona ?? prev.voicePersona ?? "").slice(
        0,
        240
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
      ].includes(partial.targetLang ?? prev.targetLang)
        ? partial.targetLang ?? prev.targetLang
        : "es",
      showTranslations:
        typeof (partial.showTranslations ?? prev.showTranslations) === "boolean"
          ? partial.showTranslations ?? prev.showTranslations
          : true,
      pauseMs: clampPause(partial.pauseMs ?? prev.pauseMs),
      helpRequest: String(partial.helpRequest ?? prev.helpRequest ?? "").slice(
        0,
        600
      ),
      practicePronunciation:
        typeof (partial.practicePronunciation ?? prev.practicePronunciation) ===
        "boolean"
          ? partial.practicePronunciation ?? prev.practicePronunciation
          : false,
    };

    const now = new Date().toISOString();
    setUser?.({
      ...(user || {}),
      local_npub: npub,
      updatedAt: now,
      helpRequest: next.helpRequest || "",
      progress: next,
      practicePronunciation: next.practicePronunciation,
    });

    try {
      localStorage.setItem("progress", JSON.stringify(next));
    } catch {}

    // Derive appLanguage from supportLang to keep them in sync
    const derivedAppLanguage = next.supportLang === "es" ? "es" : "en";

    await setDoc(
      doc(database, "users", npub),
      {
        local_npub: npub,
        updatedAt: now,
        helpRequest: next.helpRequest || "",
        progress: next,
        practicePronunciation: next.practicePronunciation,
        appLanguage: derivedAppLanguage,
      },
      { merge: true }
    );

    window.dispatchEvent(
      new CustomEvent("app:globalSettingsUpdated", { detail: next })
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
          { merge: true }
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
    [resolveNpub, setUser, user]
  );

  const handleOnboardingComplete = async (payload = {}) => {
    try {
      const id = resolveNpub();
      if (!id) return;

      const safe = (v, fallback) =>
        v === undefined || v === null ? fallback : v;

      // Simplified onboarding - only language settings, voice persona, and pause
      const normalized = {
        level: migrateToCEFRLevel(safe(payload.level, "A1")),
        supportLang: ["en", "es"].includes(payload.supportLang)
          ? payload.supportLang
          : "en",
        voicePersona: safe(
          payload.voicePersona,
          translations[appLanguage]?.onboarding_persona_default_example ||
            translations.en.onboarding_persona_default_example
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
        ].includes(payload.targetLang)
          ? payload.targetLang
          : "es",
        pauseMs: typeof payload.pauseMs === "number" ? payload.pauseMs : 800,
        xp: 0,
        streak: 0,
      };

      const now = new Date().toISOString();
      const uiLangForPersist =
        (user?.appLanguage === "es" && "es") ||
        (localStorage.getItem("appLanguage") === "es" && "es") ||
        (appLanguage === "es" ? "es" : "en");

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
        },
        { merge: true }
      );

      const fresh = await loadUserObjectFromDB(database, id);
      if (fresh) setUser?.(fresh);

      // Prompt for daily goal right after onboarding
      setDailyGoalOpen(true);
      setShouldShowTimerAfterGoal(true);
    } catch (e) {
      console.error("Failed to complete onboarding:", e);
    }
  };

  // Handle starting a lesson from the skill tree
  const handleStartLesson = async (lesson) => {
    if (!lesson) return;

    try {
      // Mark lesson as in progress in Firestore
      const npub = resolveNpub();
      let fresh = null;
      if (npub) {
        // Pass current user progress so startLesson can preserve COMPLETED status
        await startLesson(npub, lesson.id, resolvedTargetLang, user?.progress);

        // Refresh user data to get updated progress
        fresh = await loadUserObjectFromDB(database, npub);
        if (fresh) setUser?.(fresh);
      }

      // Set active lesson and persist it
      setActiveLesson(lesson);
      if (typeof window !== "undefined") {
        localStorage.setItem("activeLesson", JSON.stringify(lesson));
      }

      // Record starting XP for this lesson (language-specific)
      const lessonLang = resolvedTargetLang;
      activeLessonLanguageRef.current = lessonLang;
      const fallbackTotalXp = Number(fresh?.xp ?? user?.xp ?? 0) || 0;
      const progressSource = fresh?.progress ||
        user?.progress || { totalXp: fallbackTotalXp };
      const currentXp = getLanguageXp(progressSource, lessonLang);
      setLessonStartXp(currentXp);
      lessonCompletionTriggeredRef.current = false; // Reset completion flag
      console.log("[Lesson Start] Recording starting XP:", {
        lessonId: lesson.id,
        lessonTitle: lesson.title.en,
        lessonLang,
        startXp: currentXp,
        xpRequired: lesson.xpReward,
        freshXp: fresh?.xp,
        userXp: user?.xp,
      });

      // Switch to the first mode in the lesson BEFORE switching view mode
      const firstMode = lesson.modes?.[0];
      console.log(
        "[Lesson Start] Lesson modes:",
        lesson.modes,
        "First mode:",
        firstMode
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
    }
  };

  // Handle flashcard completion and award XP
  const handleCompleteFlashcard = async (card) => {
    const npub = resolveNpub();
    if (!npub || !card) return;

    try {
      // Award XP (card.xpReward is set by the FlashcardPractice component)
      const xpAmount = card.xpReward || 5;
      await awardXp(npub, xpAmount, resolvedTargetLang);

      // Update flashcard progress in Firestore (language-specific)
      const userRef = doc(database, "users", npub);
      await updateDoc(userRef, {
        [`progress.languageFlashcards.${resolvedTargetLang}.${card.id}.completed`]: true,
        [`progress.languageFlashcards.${resolvedTargetLang}.${card.id}.completedAt`]:
          new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Refresh user data to get updated progress
      const fresh = await loadUserObjectFromDB(database, npub);
      if (fresh) setUser?.(fresh);

      console.log(
        "[FlashcardComplete] Awarded",
        xpAmount,
        "XP for flashcard:",
        card.id
      );
    } catch (error) {
      console.error("Failed to complete flashcard:", error);
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
  };

  // Handle random practice flashcard - awards XP and resets card to be practiced again
  const handleRandomPracticeFlashcard = async (card) => {
    const npub = resolveNpub();
    if (!npub || !card) return;

    try {
      // Award XP (card.xpReward is set by the FlashcardPractice component, 4-7 XP)
      const xpAmount = card.xpReward || 5;
      await awardXp(npub, xpAmount, resolvedTargetLang);

      // Remove the card from completed status (add it back to the active deck)
      const userRef = doc(database, "users", npub);
      await updateDoc(userRef, {
        [`progress.languageFlashcards.${resolvedTargetLang}.${card.id}.completed`]: false,
        [`progress.languageFlashcards.${resolvedTargetLang}.${card.id}.completedAt`]:
          null,
        updatedAt: new Date().toISOString(),
      });

      // Refresh user data to get updated progress
      const fresh = await loadUserObjectFromDB(database, npub);
      if (fresh) setUser?.(fresh);

      console.log(
        "[RandomPractice] Awarded",
        xpAmount,
        "XP and reset flashcard:",
        card.id
      );
    } catch (error) {
      console.error("Failed to complete random practice:", error);
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
  };

  // Handle returning to skill tree
  const handleReturnToSkillTree = useCallback(() => {
    setViewMode("skillTree");
    setActiveLesson(null);
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
          lessonLang
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
    ]
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
        "[switchToRandomLessonMode] Exiting early - conditions not met"
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
          "[Tutorial Mode] All modules completed, triggering lesson completion"
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
        "[switchToRandomLessonMode] Only one mode available, not switching"
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
  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
    setCompletedLessonData(null);

    // Return to skill tree
    handleReturnToSkillTree();
  };

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
    dailyGoalModalJustOpenedRef.current = false;

    // Show pending lesson completion modal if it exists
    if (pendingLessonCompletionRef.current) {
      setShowCompletionModal(true);
      pendingLessonCompletionRef.current = null;
    }
  };

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
        activeLesson.modes
      );
      // If current tab is not in lesson modes, switch to first available mode
      if (!activeLesson.modes.includes(currentTab)) {
        const firstMode = activeLesson.modes[0];
        console.log(
          "[Tab Validation] Current tab not in lesson modes, switching to:",
          firstMode
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
    [activeNpub, appLanguage, t, toast, user]
  );

  /* -----------------------------------
     RANDOMIZE tab mechanics (no routing)
  ----------------------------------- */
  const RANDOM_POOL = useMemo(
    // ⬅️ keep JobScript out of this list
    () => ["realtime", "stories", "grammar", "vocabulary", "history"],
    []
  );
  const [randomPick, setRandomPick] = useState(null);
  const prevXpRef = useRef(null);
  const lastLocalXpEventRef = useRef(0);

  const handleIdentitySelection = useCallback(
    async (npub) => {
      if (!npub) {
        throw new Error("Identity selection is required.");
      }
      if (!activeNpub) {
        throw new Error("No active account available.");
      }
      if (user?.identity === npub) {
        return;
      }

      setIsIdentitySaving(true);
      try {
        await updateDoc(doc(database, "users", activeNpub), {
          identity: npub,
        });
        patchUser?.({ identity: npub });
      } catch (error) {
        console.error("Failed to persist identity selection", error);
        throw error;
      } finally {
        setIsIdentitySaving(false);
      }
    },
    [activeNpub, patchUser, user?.identity]
  );

  const handleDailyGoalClose = useCallback(() => {
    setDailyGoalOpen(false);
    if (shouldShowTimerAfterGoal) {
      setShouldShowTimerAfterGoal(false);
      setTimerModalOpen(true);
    }
  }, [shouldShowTimerAfterGoal]);

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
        (user?.progress?.targetLang || user?.targetLang || "es").toLowerCase()
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
          tags
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
    ]
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

  // ✅ Listen to XP changes; random tab adds toast + auto-pick next
  useEffect(() => {
    if (!activeNpub) return;
    const ref = doc(database, "users", activeNpub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const newXp = Number(data?.xp || 0);
      const lessonLang = activeLessonLanguageRef.current || resolvedTargetLang;
      const progressPayload = data?.progress || { totalXp: newXp };
      const newLessonLanguageXp = getLanguageXp(progressPayload, lessonLang);

      // Keep global user store in sync with Firestore changes so all modules
      // show the latest XP/progress immediately
      const patch = {
        xp: newXp,
        progress: progressPayload,
      };

      if (typeof data?.streak === "number") patch.streak = data.streak;
      if (typeof data?.dailyXp === "number") patch.dailyXp = data.dailyXp;
      if (typeof data?.dailyGoalXp === "number")
        patch.dailyGoalXp = data.dailyGoalXp;
      if (data?.stats) patch.stats = data.stats;
      if (data?.updatedAt) patch.updatedAt = data.updatedAt;
      if (data?.appLanguage) patch.appLanguage = data.appLanguage;

      const patchHasChanges = Object.entries(patch).some(([key, value]) => {
        const current = user?.[key];
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
            typeof user?.identity === "string" && user.identity.trim()
              ? user.identity.trim()
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
              "[Lesson Completion] XP goal reached! Completing lesson..."
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
    user,
    user?.identity,
    maybePostNostrProgress,
    viewMode,
    activeLesson,
    lessonStartXp,
    setUser,
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
  const [accountOpen, setAccountOpen] = useState(false);

  // Compute userProgress - must be before any conditional returns to maintain hook order
  const userProgress = useMemo(() => {
    const languageXpMap = user?.progress?.languageXp || {};
    const languageLessons = user?.progress?.languageLessons;
    const hasLanguageLessons =
      languageLessons && typeof languageLessons === "object";
    const lessonsForLanguage = hasLanguageLessons
      ? languageLessons?.[resolvedTargetLang] || {}
      : user?.progress?.lessons || {};

    // Get language-specific flashcards
    const languageFlashcards = user?.progress?.languageFlashcards;
    const hasLanguageFlashcards =
      languageFlashcards && typeof languageFlashcards === "object";
    const flashcardsForLanguage = hasLanguageFlashcards
      ? languageFlashcards?.[resolvedTargetLang] || {}
      : user?.progress?.flashcards || {};

    const skillTreeXp = getLanguageXp(user?.progress || {}, resolvedTargetLang);
    return {
      totalXp: skillTreeXp,
      lessons: lessonsForLanguage,
      languageXp: languageXpMap,
      languageLessons: hasLanguageLessons ? languageLessons : undefined,
      targetLang: resolvedTargetLang,
      flashcards: flashcardsForLanguage,
    };
  }, [user?.progress, resolvedTargetLang]);

  // CEFR level configuration (shared across modes)
  const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const CEFR_LEVEL_COUNTS = {
    A1: { flashcards: 300, lessons: 110 }, // 1 pre-unit (7) + 17 units (6 each) = 7 + 102
    A2: { flashcards: 250, lessons: 108 }, // 18 units × 6 lessons per unit
    B1: { flashcards: 200, lessons: 90 }, // 15 units × 6 lessons per unit
    B2: { flashcards: 150, lessons: 72 }, // 12 units × 6 lessons per unit
    C1: { flashcards: 100, lessons: 60 }, // 10 units × 6 lessons per unit
    C2: { flashcards: 50, lessons: 48 }, // 8 units × 6 lessons per unit
  };

  const CEFR_LEVEL_INFO = {
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
    const match = lessonId.match(/lesson-(?:pre-)?(?:tutorial-)?([a-z]\d+)/i);
    if (match) return match[1].toUpperCase();

    // Tutorial lessons like "lesson-tutorial-1" don't encode the CEFR level
    // in their ID, but they belong to A1 for progression unlocking.
    if (lessonId.includes("lesson-tutorial")) return "A1";

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
    // A level is unlocked if the previous level is complete
    let unlockedLevel = "A1"; // A1 is always unlocked

    for (let i = 0; i < CEFR_LEVELS.length - 1; i++) {
      const currentLevel = CEFR_LEVELS[i];
      const nextLevel = CEFR_LEVELS[i + 1];

      if (lessonLevelCompletionStatus[currentLevel]?.isComplete) {
        unlockedLevel = nextLevel;
      } else {
        break; // Stop at first incomplete level
      }
    }

    return unlockedLevel;
  }, [lessonLevelCompletionStatus]);

  // Determine current unlocked flashcard level (highest level user can access in flashcard mode)
  const currentFlashcardLevel = useMemo(() => {
    // Find the highest level that's unlocked for flashcards
    // A level is unlocked if the previous level is complete
    let unlockedLevel = "A1"; // A1 is always unlocked

    for (let i = 0; i < CEFR_LEVELS.length - 1; i++) {
      const currentLevel = CEFR_LEVELS[i];
      const nextLevel = CEFR_LEVELS[i + 1];

      if (flashcardLevelCompletionStatus[currentLevel]?.isComplete) {
        unlockedLevel = nextLevel;
      } else {
        break; // Stop at first incomplete level
      }
    }

    return unlockedLevel;
  }, [flashcardLevelCompletionStatus]);

  // Legacy: Combined current level (for backwards compatibility)
  const currentCEFRLevel = useMemo(() => {
    // Find the highest level that's unlocked in both modes
    // A level is unlocked if the previous level is complete in BOTH modes
    let unlockedLevel = "A1"; // A1 is always unlocked

    for (let i = 0; i < CEFR_LEVELS.length - 1; i++) {
      const currentLevel = CEFR_LEVELS[i];
      const nextLevel = CEFR_LEVELS[i + 1];

      if (levelCompletionStatus[currentLevel]?.isComplete) {
        unlockedLevel = nextLevel;
      } else {
        break; // Stop at first incomplete level
      }
    }

    return unlockedLevel;
  }, [levelCompletionStatus]);

  // State for which CEFR level is currently being viewed (separate for each mode)
  // Initialize with default, will be synced from user document when loaded
  const [activeLessonLevel, setActiveLessonLevel] = useState("A1");
  const [activeFlashcardLevel, setActiveFlashcardLevel] = useState("A1");
  const [hasInitializedLevels, setHasInitializedLevels] = useState(false);

  // Sync active levels from user document when it loads
  useEffect(() => {
    if (!user || hasInitializedLevels) return;

    // Initialize from user document if available, but validate they're unlocked
    if (
      user.activeLessonLevel &&
      CEFR_LEVELS.includes(user.activeLessonLevel)
    ) {
      // Validate the saved level is actually unlocked
      const savedLevelIndex = CEFR_LEVELS.indexOf(user.activeLessonLevel);
      let isUnlocked = user.activeLessonLevel === "A1";

      if (!isUnlocked) {
        isUnlocked = true;
        for (let i = 0; i < savedLevelIndex; i++) {
          if (!lessonLevelCompletionStatus[CEFR_LEVELS[i]]?.isComplete) {
            isUnlocked = false;
            break;
          }
        }
      }

      // Use saved level if unlocked, otherwise use the highest unlocked level
      setActiveLessonLevel(
        isUnlocked ? user.activeLessonLevel : currentLessonLevel
      );
    } else {
      setActiveLessonLevel(currentLessonLevel);
    }

    if (
      user.activeFlashcardLevel &&
      CEFR_LEVELS.includes(user.activeFlashcardLevel)
    ) {
      // Validate the saved level is actually unlocked
      const savedLevelIndex = CEFR_LEVELS.indexOf(user.activeFlashcardLevel);
      let isUnlocked = user.activeFlashcardLevel === "A1";

      if (!isUnlocked) {
        isUnlocked = true;
        for (let i = 0; i < savedLevelIndex; i++) {
          if (!flashcardLevelCompletionStatus[CEFR_LEVELS[i]]?.isComplete) {
            isUnlocked = false;
            break;
          }
        }
      }

      // Use saved level if unlocked, otherwise use the highest unlocked level
      setActiveFlashcardLevel(
        isUnlocked ? user.activeFlashcardLevel : currentFlashcardLevel
      );
    } else {
      setActiveFlashcardLevel(currentFlashcardLevel);
    }

    setHasInitializedLevels(true);
  }, [
    user,
    hasInitializedLevels,
    lessonLevelCompletionStatus,
    flashcardLevelCompletionStatus,
    currentLessonLevel,
    currentFlashcardLevel,
  ]);

  // Legacy: Combined active level (for backwards compatibility)
  const [activeCEFRLevel, setActiveCEFRLevel] = useState(currentCEFRLevel);

  // Persist active lesson level to Firestore
  const prevLessonLevelRef = useRef(null);
  useEffect(() => {
    // Skip if not initialized yet or no change
    if (!hasInitializedLevels || !activeNpub) return;
    if (prevLessonLevelRef.current === activeLessonLevel) return;
    prevLessonLevelRef.current = activeLessonLevel;

    // Save to Firestore
    setDoc(
      doc(database, "users", activeNpub),
      { activeLessonLevel, updatedAt: new Date().toISOString() },
      { merge: true }
    ).catch((e) => console.error("Failed to save activeLessonLevel:", e));
  }, [activeLessonLevel, activeNpub, hasInitializedLevels]);

  // Persist active flashcard level to Firestore
  const prevFlashcardLevelRef = useRef(null);
  useEffect(() => {
    // Skip if not initialized yet or no change
    if (!hasInitializedLevels || !activeNpub) return;
    if (prevFlashcardLevelRef.current === activeFlashcardLevel) return;
    prevFlashcardLevelRef.current = activeFlashcardLevel;

    // Save to Firestore
    setDoc(
      doc(database, "users", activeNpub),
      { activeFlashcardLevel, updatedAt: new Date().toISOString() },
      { merge: true }
    ).catch((e) => console.error("Failed to save activeFlashcardLevel:", e));
  }, [activeFlashcardLevel, activeNpub, hasInitializedLevels]);

  // Track previous completion status to detect newly completed levels
  const prevLessonCompletionRef = useRef({});
  const prevFlashcardCompletionRef = useRef({});

  // Detect lesson level completion and show celebration modal
  useEffect(() => {
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
    prevLessonCompletionRef.current = CEFR_LEVELS.reduce((acc, level) => {
      acc[level] = lessonLevelCompletionStatus[level]?.isComplete || false;
      return acc;
    }, {});
  }, [lessonLevelCompletionStatus, activeLessonLevel, wasCelebrationShown]);

  // Detect flashcard level completion and show celebration modal
  useEffect(() => {
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
    prevFlashcardCompletionRef.current = CEFR_LEVELS.reduce((acc, level) => {
      acc[level] = flashcardLevelCompletionStatus[level]?.isComplete || false;
      return acc;
    }, {});
  }, [
    flashcardLevelCompletionStatus,
    activeFlashcardLevel,
    wasCelebrationShown,
  ]);

  // Note: We deliberately do NOT auto-update active levels when new levels unlock
  // Users should stay at their current level until they manually navigate

  // Handler for lesson level navigation with lock checking
  const handleLessonLevelChange = useCallback(
    (newLevel) => {
      const newLevelIndex = CEFR_LEVELS.indexOf(newLevel);

      // Check if this level is unlocked in lesson mode
      let isUnlocked = newLevel === "A1";

      if (!isUnlocked) {
        // Check all levels before this one are complete in lesson mode
        isUnlocked = true;
        for (let i = 0; i < newLevelIndex; i++) {
          const prevLevel = CEFR_LEVELS[i];
          if (!lessonLevelCompletionStatus[prevLevel]?.isComplete) {
            isUnlocked = false;
            break;
          }
        }
      }

      // Only navigate if unlocked
      if (isUnlocked) {
        setActiveLessonLevel(newLevel);
      } else {
        console.log(
          `Lesson level ${newLevel} is locked. Complete previous levels first.`
        );
      }
    },
    [lessonLevelCompletionStatus]
  );

  // Handler for flashcard level navigation with lock checking
  const handleFlashcardLevelChange = useCallback(
    (newLevel) => {
      const newLevelIndex = CEFR_LEVELS.indexOf(newLevel);

      // Check if this level is unlocked in flashcard mode
      let isUnlocked = newLevel === "A1";

      if (!isUnlocked) {
        // Check all levels before this one are complete in flashcard mode
        isUnlocked = true;
        for (let i = 0; i < newLevelIndex; i++) {
          const prevLevel = CEFR_LEVELS[i];
          if (!flashcardLevelCompletionStatus[prevLevel]?.isComplete) {
            isUnlocked = false;
            break;
          }
        }
      }

      // Only navigate if unlocked
      if (isUnlocked) {
        setActiveFlashcardLevel(newLevel);
      } else {
        console.log(
          `Flashcard level ${newLevel} is locked. Complete previous levels first.`
        );
      }
    },
    [flashcardLevelCompletionStatus]
  );

  // Legacy: Combined handler for level navigation
  const handleLevelChange = useCallback(
    (newLevel) => {
      const newLevelIndex = CEFR_LEVELS.indexOf(newLevel);

      // Check if this level is unlocked
      let isUnlocked = newLevel === "A1";

      if (!isUnlocked) {
        // Check all levels before this one are complete
        isUnlocked = true;
        for (let i = 0; i < newLevelIndex; i++) {
          const prevLevel = CEFR_LEVELS[i];
          if (!levelCompletionStatus[prevLevel]?.isComplete) {
            isUnlocked = false;
            break;
          }
        }
      }

      // Only navigate if unlocked
      if (isUnlocked) {
        setActiveCEFRLevel(newLevel);
      } else {
        console.log(
          `Level ${newLevel} is locked. Complete previous levels first.`
        );
      }
    },
    [levelCompletionStatus]
  );

  // Load only the active levels (include both lesson and flashcard levels for mode switching)
  const relevantLevels = useMemo(() => {
    // Include both lesson and flashcard active levels to support mode switching
    const levelsSet = new Set([activeLessonLevel, activeFlashcardLevel]);
    return Array.from(levelsSet);
  }, [activeLessonLevel, activeFlashcardLevel]);

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
        <RobotBuddyPro state="Loading" />
      </Flex>
    );
  }

  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const isSubscriptionRoute = location.pathname.startsWith("/subscribe");
  const onboardingInitialDraft = {
    ...(user?.progress || {}),
    ...(user?.onboarding?.draft || {}),
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

  return (
    <Box minH="100dvh" bg="transparent" color="gray.50" width="100%">
      <AnimatedBackground />
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
        openSettings={() => setSettingsOpen(true)}
        closeSettings={() => setSettingsOpen(false)}
        accountOpen={accountOpen}
        closeAccount={() => setAccountOpen(false)}
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
      />

      <TeamsDrawer
        isOpen={teamsOpen}
        onClose={() => setTeamsOpen(false)}
        userLanguage={appLanguage}
        t={t}
        pendingInviteCount={pendingTeamInviteCount}
        allowPosts={allowPosts}
        onAllowPostsChange={handleAllowPostsChange}
      />

      <NotesDrawer
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        appLanguage={appLanguage}
        targetLang={resolvedTargetLang}
      />

      <BottomActionBar
        t={t}
        onOpenIdentity={() => setAccountOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTeams={() => setTeamsOpen(true)}
        onOpenNotes={() => setNotesOpen(true)}
        isIdentitySaving={isIdentitySaving}
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
      />

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
          {!hasInitializedLevels ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minH="60vh"
            >
              <RobotBuddyPro state="thinking" />
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
      {viewMode === "lesson" && (
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
                              localStorage.getItem("local_npub") || ""
                            );
                            setActiveNsec(
                              localStorage.getItem("local_nsec") || ""
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
        npub={activeNpub}
        lang={appLanguage}
        t={t}
        completedGoalDates={user?.completedGoalDates || []}
        startDate={user?.createdAt}
      />

      <SessionTimerModal
        isOpen={timerModalOpen}
        onClose={() => setTimerModalOpen(false)}
        minutes={timerMinutes}
        onMinutesChange={setTimerMinutes}
        onStart={handleStartTimer}
        isRunning={isTimerRunning}
        helper={timerHelper}
        t={t}
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
              <CelebrationOrb
                size={120}
                accentGradient="linear(135deg, #c084fc, #7c3aed, #22d3ee)"
                particleColor="cyan.100"
              />
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
                        String(Math.round(timerDurationSeconds / 60))
                      )
                    : t.timer_times_up_no_duration ||
                      "Nice work wrapping up your timer."}
                </Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3} flexWrap="wrap">
            <Button variant="ghost" onClick={handleCloseTimeUp}>
              {t.timer_times_up_close || "Close"}
            </Button>
            <Button
              colorScheme="whiteAlpha"
              bg="white"
              color="purple.700"
              _hover={{ bg: "whiteAlpha.900" }}
              onClick={() => {
                handleCloseTimeUp();
                setTimerModalOpen(true);
              }}
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
          <ModalBody py={12} px={8}>
            <VStack spacing={6} textAlign="center">
              <CelebrationOrb
                accentGradient="linear(135deg, teal.200, teal.400, green.400)"
                particleColor="teal.100"
              />

              <VStack spacing={2}>
                <Text fontSize="3xl" fontWeight="bold">
                  {appLanguage === "es"
                    ? "¡Meta diaria alcanzada!"
                    : "Daily Goal Complete!"}
                </Text>
                <Text fontSize="lg" opacity={0.9}>
                  {appLanguage === "es"
                    ? "Alcanzaste tu objetivo de XP de hoy."
                    : "You hit today’s XP target."}
                </Text>
              </VStack>

              <Box
                bg="whiteAlpha.200"
                borderRadius="xl"
                py={6}
                px={8}
                width="100%"
                border="2px solid"
                borderColor="whiteAlpha.400"
              >
                <VStack spacing={3}>
                  <Text
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    opacity={0.8}
                  >
                    {appLanguage === "es"
                      ? "Progreso diario"
                      : "Daily progress"}
                  </Text>
                  <HStack spacing={6} justify="center" flexWrap="wrap">
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

              {/* Calendar showing completed days including today */}
              <Accordion allowToggle width="100%">
                <AccordionItem
                  bg="whiteAlpha.150"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                >
                  <AccordionButton
                    py={3}
                    px={4}
                    _hover={{ bg: "whiteAlpha.200" }}
                    borderRadius="xl"
                  >
                    <Box flex="1" textAlign="left" fontWeight="medium">
                      {appLanguage === "es"
                        ? "Ver calendario de progreso"
                        : "View progress calendar"}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4} px={4}>
                    <GoalCalendar
                      completedDates={(() => {
                        // Include today's date in the completed dates for the celebration
                        const today = new Date();
                        const todayKey = `${today.getFullYear()}-${String(
                          today.getMonth() + 1
                        ).padStart(2, "0")}-${String(today.getDate()).padStart(
                          2,
                          "0"
                        )}`;
                        const existingDates = user?.completedGoalDates || [];
                        return existingDates.includes(todayKey)
                          ? existingDates
                          : [...existingDates, todayKey];
                      })()}
                      lang={appLanguage}
                      showNavigation={false}
                      highlightToday={true}
                      size="sm"
                      variant="light"
                      startDate={user?.createdAt}
                    />
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              <Button
                size="lg"
                width="100%"
                colorScheme="teal"
                onClick={handleCloseDailyGoalModal}
                fontWeight="bold"
                fontSize="lg"
                py={6}
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
              <CelebrationOrb />

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
                bg="whiteAlpha.200"
                borderRadius="xl"
                py={6}
                px={8}
                width="100%"
                border="2px solid"
                borderColor="whiteAlpha.400"
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
                _hover={{ bg: "gray.100" }}
                _active={{ bg: "gray.200" }}
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
                bg="whiteAlpha.200"
                borderRadius="xl"
                py={6}
                px={8}
                width="100%"
                border="2px solid"
                borderColor="whiteAlpha.400"
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
                _hover={{ bg: "gray.100" }}
                _active={{ bg: "gray.200" }}
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
  onOpenIdentity,
  onOpenSettings,
  onOpenTeams,
  onOpenNotes,
  isIdentitySaving = false,
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
  notesIsLoading = false,
  notesIsDone = false,
  pathMode = "path",
  onPathModeChange,
  onScrollToLatest,
}) {
  const identityLabel = t?.app_account_aria || "Identity";
  const settingsLabel =
    t?.app_settings_aria || t?.ra_btn_settings || "Settings";
  const toggleLabel =
    translationLabel || t?.ra_translations_toggle || "Translations";
  const helpChatLabel =
    helpLabel || t?.app_help_chat || (appLanguage === "es" ? "Ayuda" : "Help");
  const teamsLabel = t?.teams_drawer_title || "Teams";
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
  const handleActionClick = (action) => {
    if (!action) return;
    playSound?.(selectSound);
    action();
  };

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={80}
      bg="rgba(6, 10, 24, 0.2)"
      backdropFilter="blur(2px)"
      py={3}
      px={{ base: 3, md: 6 }}
      width="100%"
      maxW="480px"
      margin="0 auto"
      borderRadius="24"
      borderBottomLeftRadius={"0"}
      borderBottomRightRadius={"0"}
      paddingBottom={6}
      paddingTop={4}
    >
      <Flex
        as="nav"
        maxW="560px"
        mx="auto"
        w="100%"
        align="center"
        justify={{ base: "space-between", md: "space-between" }}
        flexWrap={{ base: "wrap", md: "wrap" }}
        overflow="visible"
      >
        <IconButton
          icon={<PiUsersBold size={18} />}
          onClick={() => handleActionClick(onOpenTeams)}
          aria-label={teamsLabel}
          rounded="xl"
          flexShrink={0}
          borderWidth={hasPendingTeamInvite ? "2px" : "0px"}
          borderColor={hasPendingTeamInvite ? "purple.400" : "gray.700"}
          boxShadow={
            hasPendingTeamInvite
              ? "0 0 0 2px rgba(168,85,247,0.35), 0 0 14px rgba(168,85,247,0.65)"
              : "0 4px 0 #313a4b"
          }
          colorScheme="gray"
          bg="gray.800"
        />

        <IconButton
          icon={<SettingsIcon boxSize={4} />}
          color="gray.100"
          onClick={() => handleActionClick(onOpenSettings)}
          aria-label={settingsLabel}
          rounded="xl"
          flexShrink={0}
          colorScheme="gray"
          bg="gray.800"
          boxShadow="0 4px 0 #313a4b"
        />

        <IconButton
          icon={<RiBookmarkLine size={18} />}
          aria-label={notesLabel}
          onClick={() => handleActionClick(onOpenNotes)}
          isLoading={notesIsLoading}
          colorScheme="gray"
          bg="gray.800"
          boxShadow="0 4px 0 #313a4b"
          color="white"
          // size="lg"
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
          icon={<FaBitcoin size={18} />}
          onClick={() => handleActionClick(onOpenIdentity)}
          aria-label={identityLabel}
          isLoading={isIdentitySaving}
          rounded="xl"
          flexShrink={0}
          bg="#f08e19"
          boxShadow="0px 4px 0px #834800ff"
        />

        <IconButton
          icon={<MdOutlineSupportAgent size={18} />}
          onClick={() => handleActionClick(onOpenHelpChat)}
          aria-label={helpChatLabel}
          isDisabled={!onOpenHelpChat}
          rounded="xl"
          bg="white"
          color="blue"
          boxShadow="0 4px 0 blue"
          zIndex={50}
          flexShrink={0}
        />

        {/* Path Mode Menu */}
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<CurrentModeIcon size={18} />}
            aria-label={modeMenuLabel}
            rounded="xl"
            flexShrink={0}
            onClick={() => playSound?.(selectSound)}
            // bg="rgba(0, 98, 189, 0.6)"
            colorScheme="teal"
            // boxShadow="0 4px 0 rgba(0, 151, 189, 0.6)"
            color="white"
          />
          <MenuList
            bg="gray.800"
            borderColor="whiteAlpha.200"
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
            minW="180px"
          >
            {PATH_MODES.map((mode) => {
              const ModeIcon = mode.icon;
              const isSelected = pathMode === mode.id;
              return (
                <MenuItem
                  key={mode.id}
                  onClick={() => {
                    playSound?.(selectSound);
                    // If clicking path when already in path mode, just scroll
                    if (mode.id === "path" && isSelected) {
                      onScrollToLatest?.();
                    } else {
                      onPathModeChange?.(mode.id);
                    }
                  }}
                  bg={isSelected ? "whiteAlpha.100" : "transparent"}
                  _hover={{ bg: "whiteAlpha.200" }}
                  color="white"
                  icon={<ModeIcon size={18} />}
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {mode.label}
                </MenuItem>
              );
            })}
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
}
