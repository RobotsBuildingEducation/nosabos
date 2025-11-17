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
  Select,
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
  MenuItemOption,
  MenuOptionGroup,
  Badge,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import {
  SettingsIcon,
  ChevronDownIcon,
  CheckCircleIcon,
} from "@chakra-ui/icons";
import { CiUser, CiEdit } from "react-icons/ci";
import { MdOutlineSupportAgent } from "react-icons/md";
import { RiSpeakLine } from "react-icons/ri";
import {
  LuBadgeCheck,
  LuBookOpen,
  LuShuffle,
  LuLanguages,
} from "react-icons/lu";
import { PiUsers, PiUsersBold, PiUsersThreeBold } from "react-icons/pi";

import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { database, simplemodel } from "./firebaseResources/firebaseResources";

import { Navigate, useLocation } from "react-router-dom";

import useUserStore from "./hooks/useUserStore";
import { useDecentralizedIdentity } from "./hooks/useDecentralizedIdentity";

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
import BitcoinSupportModal from "./components/BitcoinSupportModal";
import JobScript from "./components/JobScript"; // ⬅️ NEW TAB COMPONENT
import IdentityDrawer from "./components/IdentityDrawer";
import { useNostrWalletStore } from "./hooks/useNostrWalletStore";
import { FaAddressCard } from "react-icons/fa";
import TeamsDrawer from "./components/Teams/TeamsDrawer";
import { subscribeToTeamInvites } from "./utils/teams";
import SkillTree from "./components/SkillTree";
import { getLearningPath } from "./data/skillTreeData";
import { startLesson, completeLesson } from "./utils/progressTracking";
import { RiArrowLeftLine } from "react-icons/ri";

/* ---------------------------
   Small helpers
--------------------------- */
const isTrue = (v) => v === true || v === "true" || v === 1 || v === "1";

const CEFR_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const ONBOARDING_TOTAL_STEPS = 3;
const TARGET_LANGUAGE_LABELS = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  nah: "Nahuatl",
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
}) {
  const toast = useToast();
  const t = translations[appLanguage] || translations.en;

  // ---- Local draft state (no autosave) ----
  const p = user?.progress || {};
  const [level, setLevel] = useState(p.level || "beginner");
  const [supportLang, setSupportLang] = useState(p.supportLang || "en");
  const [voice, setVoice] = useState(p.voice || "alloy");
  const [voicePersona, setVoicePersona] = useState(
    p.voicePersona || translations.en.onboarding_persona_default_example
  );
  const [targetLang, setTargetLang] = useState(p.targetLang || "es");
  const [showTranslations, setShowTranslations] = useState(
    typeof p.showTranslations === "boolean" ? p.showTranslations : true
  );
  const [pauseMs, setPauseMs] = useState(
    Number.isFinite(p.pauseMs) ? p.pauseMs : 2000
  );
  const [helpRequest, setHelpRequest] = useState(
    (p.helpRequest || user?.helpRequest || "").trim()
  );
  const [practicePronunciation, setPracticePronunciation] = useState(
    !!p.practicePronunciation
  );

  // Refill draft when store changes
  useEffect(() => {
    const q = user?.progress || {};
    setLevel(q.level || "beginner");
    setSupportLang(q.supportLang || "en");
    setVoice(q.voice || "alloy");
    setVoicePersona(
      q.voicePersona || translations.en.onboarding_persona_default_example
    );
    setTargetLang(q.targetLang || "es");
    setShowTranslations(
      typeof q.showTranslations === "boolean" ? q.showTranslations : true
    );
    setPauseMs(Number.isFinite(q.pauseMs) ? q.pauseMs : 2000);
    setHelpRequest((q.helpRequest || user?.helpRequest || "").trim());
    setPracticePronunciation(!!q.practicePronunciation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.progress, user?.helpRequest]);

  const [currentId, setCurrentId] = useState(activeNpub || "");
  const [currentSecret, setCurrentSecret] = useState(activeNsec || "");
  const [switchNsec, setSwitchNsec] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

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

  // Keep a local draft for settings input
  const [goalDraft, setGoalDraft] = useState(0);

  useEffect(() => {
    if (!activeNpub) return;
    const ref = doc(database, "users", activeNpub);
    const unsub = onSnapshot(ref, async (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const goal = Number(data?.dailyGoalXp || 0);
      let dxp = Number(data?.dailyXp || 0);
      let resetISO = data?.dailyResetAt || null;

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
    });
    return () => unsub();
  }, [activeNpub]);

  const dailyPct =
    dailyGoalXp > 0
      ? Math.min(100, Math.round((dailyXp / dailyGoalXp) * 100))
      : 0;
  const dailyDone = dailyGoalXp > 0 && dailyXp >= dailyGoalXp;

  // Save all settings at once (including dailyGoalXp) — no resets
  const handleSaveSettings = async () => {
    try {
      const nextDraft = {
        level,
        supportLang,
        voice,
        voicePersona,
        targetLang,
        showTranslations,
        pauseMs,
        helpRequest,
        practicePronunciation,
      };
      await Promise.resolve(onPatchSettings?.(nextDraft));
      if (activeNpub != null) {
        const val = Math.max(0, Math.floor(Number(goalDraft) || 0));
        await setDoc(
          doc(database, "users", activeNpub),
          { dailyGoalXp: val }, // only the goal changes
          { merge: true }
        );
      }
      toast({
        status: "success",
        title:
          appLanguage === "es" ? "Configuración guardada" : "Settings saved",
      });
      closeSettings?.();
    } catch (e) {
      toast({
        status: "error",
        title: appLanguage === "es" ? "Error al guardar" : "Save failed",
        description: String(e?.message || e),
      });
    }
  };

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
        borderBottom="1px solid"
        borderColor="gray.700"
        position="sticky"
        top={0}
        zIndex={100}
        wrap="wrap"
        spacing={{ base: 2, md: 3 }}
        backdropFilter="blur(6px)"
      >
        {/* LEFT: Daily WaveBar + % */}
        <HStack
          spacing={{ base: 2, md: 3 }}
          minW={0}
          flex="1 1 auto"
          align="center"
        >
          <Text fontSize="sm">
            {translations[appLanguage]["dailyGoalProgress"]}
          </Text>
          <Box w={{ base: "120px", sm: "150px", md: "180px" }}>
            <WaveBar value={dailyPct} />
          </Box>
          <HStack spacing={1} flexShrink={0}>
            {dailyDone && (
              <CheckCircleIcon
                boxSize={{ base: "16px", md: "18px" }}
                color="green.200"
              />
            )}
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
          <Menu autoSelect={false} isLazy>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="outline"
              size="sm"
              borderColor="gray.700"
              px={3}
              py={1.5}
            >
              <HStack spacing={2}>
                {tabIcons?.[currentTab]}
                <Text fontSize="sm" noOfLines={1}>
                  {tabLabels?.[currentTab] || currentTab}
                </Text>
              </HStack>
            </MenuButton>

            <MenuList borderColor="gray.700" bg="gray.900">
              <MenuOptionGroup
                type="radio"
                value={currentTab}
                onChange={(value) => onSelectTab?.(String(value))}
              >
                {tabOrder.map((key) => (
                  <MenuItemOption key={key} value={key}>
                    <HStack spacing={2}>
                      {tabIcons?.[key]}
                      <Text>{tabLabels?.[key] || key}</Text>
                    </HStack>
                  </MenuItemOption>
                ))}
              </MenuOptionGroup>
            </MenuList>
          </Menu>
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
            {t.ra_settings_title || "Conversation settings"}
          </DrawerHeader>
          <DrawerBody pb={2}>
            <VStack align="stretch" spacing={3}>
              <Wrap spacing={2}>
                <Select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  bg="gray.800"
                  size="md"
                  w="auto"
                >
                  <option value="beginner">
                    {translations[appLanguage].onboarding_level_beginner}
                  </option>
                  <option value="intermediate">
                    {translations[appLanguage].onboarding_level_intermediate}
                  </option>
                  <option value="advanced">
                    {translations[appLanguage].onboarding_level_advanced}
                  </option>
                </Select>

                <Select
                  value={supportLang}
                  onChange={(e) => setSupportLang(e.target.value)}
                  bg="gray.800"
                  size="md"
                  w="auto"
                >
                  <option value="en">
                    {translations[appLanguage].onboarding_support_en}
                  </option>
                  <option value="bilingual">
                    {translations[appLanguage].onboarding_support_bilingual}
                  </option>
                  <option value="es">
                    {translations[appLanguage].onboarding_support_es}
                  </option>
                </Select>

                <Select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  bg="gray.800"
                  size="md"
                  w="auto"
                >
                  <option value="alloy">
                    {translations[appLanguage].onboarding_voice_alloy}
                  </option>
                  <option value="ash">
                    {translations[appLanguage].onboarding_voice_ash}
                  </option>
                  <option value="ballad">
                    {translations[appLanguage].onboarding_voice_ballad}
                  </option>
                  <option value="coral">
                    {translations[appLanguage].onboarding_voice_coral}
                  </option>
                  <option value="echo">
                    {translations[appLanguage].onboarding_voice_echo}
                  </option>
                  <option value="sage">
                    {translations[appLanguage].onboarding_voice_sage}
                  </option>
                  <option value="shimmer">
                    {translations[appLanguage].onboarding_voice_shimmer}
                  </option>
                  <option value="verse">
                    {translations[appLanguage].onboarding_voice_verse}
                  </option>
                </Select>

                <Select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  bg="gray.800"
                  size="md"
                  w="auto"
                  title={
                    translations[appLanguage].onboarding_practice_label_title
                  }
                >
                  <option value="nah">
                    {translations[appLanguage].onboarding_practice_nah}
                  </option>
                  <option value="es">
                    {translations[appLanguage].onboarding_practice_es}
                  </option>
                  <option value="pt">
                    {translations[appLanguage].onboarding_practice_pt}
                  </option>
                  <option value="fr">
                    {translations[appLanguage].onboarding_practice_fr}
                  </option>
                  <option value="it">
                    {translations[appLanguage].onboarding_practice_it}
                  </option>
                  <option value="en">
                    {translations[appLanguage].onboarding_practice_en}
                  </option>
                </Select>
              </Wrap>

              {/* Pronunciation coaching */}
              <HStack bg="gray.800" p={3} rounded="md" justify="space-between">
                <Box>
                  <Text fontSize="sm" mb={0.5}>
                    {t.ra_pron_label ||
                      (appLanguage === "es"
                        ? "Practicar pronunciación"
                        : "Practice pronunciation")}
                  </Text>
                  <Text fontSize="xs" opacity={0.7}>
                    {t.ra_pron_help ||
                      (appLanguage === "es"
                        ? "Añade una micro-pista y una repetición lenta en cada turno."
                        : "Adds a tiny cue and one slow repetition each turn.")}
                  </Text>
                </Box>
                <Switch
                  isChecked={practicePronunciation}
                  onChange={(e) => setPracticePronunciation(e.target.checked)}
                />
              </HStack>

              {/* Persona */}
              <Box bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" mb={2}>
                  {t.ra_persona_label || "Persona"}
                </Text>
                <Input
                  value={voicePersona}
                  onChange={(e) =>
                    setVoicePersona(e.target.value.slice(0, 240))
                  }
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

              {/* Help Request */}
              <Box bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" mb={2}>
                  {t.ra_help_label ||
                    (appLanguage === "es"
                      ? "¿En qué te gustaría ayuda?"
                      : "What would you like help with?")}
                </Text>
                <Textarea
                  value={helpRequest}
                  onChange={(e) => setHelpRequest(e.target.value.slice(0, 600))}
                  bg="gray.700"
                  minH="100px"
                  placeholder={
                    t.ra_help_placeholder ||
                    (appLanguage === "es"
                      ? "Ej.: practicar conversación para entrevistas; repasar tiempos pasados; español para turismo…"
                      : "e.g., conversational practice for job interviews; past tenses review; travel Spanish…")
                  }
                />
                <Text fontSize="xs" opacity={0.7} mt={1}>
                  {t.ra_help_help ||
                    (appLanguage === "es"
                      ? "Describe tu meta o contexto (esto guía la experiencia)."
                      : "Describe your goal or context (this guides the experience).")}
                </Text>
              </Box>

              {/* VAD slider */}
              <Box bg="gray.800" p={3} rounded="md">
                <HStack justifyContent="space-between" mb={2}>
                  <Text fontSize="sm">
                    {t.ra_vad_label || "Voice activity pause (ms)"}
                  </Text>
                  <Text fontSize="sm" opacity={0.8}>
                    {pauseMs} ms
                  </Text>
                </HStack>
                <Slider
                  aria-label="pause-slider"
                  min={200}
                  max={4000}
                  step={100}
                  value={pauseMs}
                  onChange={setPauseMs}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </Box>

              {/* Daily XP Goal (part of single Save) */}
              <Box bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" mb={1}>
                  {appLanguage === "es" ? "Meta diaria de XP" : "Daily XP goal"}
                </Text>
                <Input
                  type="number"
                  min={0}
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  bg="gray.700"
                  w="160px"
                  placeholder={
                    appLanguage === "es" ? "XP por día" : "XP per day"
                  }
                />
                <Text fontSize="xs" opacity={0.7} mt={1}>
                  {appLanguage === "es"
                    ? "Cada nivel equivale a 100 XP. Cambiar este valor no reinicia tu progreso de hoy."
                    : "Each level is 100 XP. Changing this won’t reset today’s progress or timer."}
                </Text>
              </Box>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTop="1px solid" borderColor="gray.800">
            <HStack w="100%" justify="flex-end" spacing={3}>
              <Button variant="ghost" onClick={closeSettings}>
                {t.app_close || "Close"}
              </Button>
              <Button colorScheme="teal" onClick={handleSaveSettings}>
                {appLanguage === "es" ? "Guardar" : "Save"}
              </Button>
            </HStack>
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
  const location = useLocation();
  const helpChatDisclosure = useDisclosure();
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [pendingTeamInviteCount, setPendingTeamInviteCount] = useState(0);

  const [isLoadingApp, setIsLoadingApp] = useState(true);

  // Zustand store
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const patchUser = useUserStore((s) => s.patchUser);

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
  const initWalletService = useNostrWalletStore((s) => s.initWalletService);
  const walletBalance = useNostrWalletStore((s) => s.walletBalance);
  const sendOneSatToNpub = useNostrWalletStore((s) => s.sendOneSatToNpub);
  const cashuWallet = useNostrWalletStore((s) => s.cashuWallet);
  const rerunWallet = useNostrWalletStore((s) => s.rerunWallet);

  console.log("walletBalance", walletBalance);

  const totalWalletBalance = useMemo(() => {
    if (Array.isArray(walletBalance)) {
      return walletBalance.reduce(
        (sum, entry) => sum + (Number(entry?.amount) || 0),
        0
      );
    }
    if (walletBalance && typeof walletBalance === "object") {
      return Number(walletBalance?.amount || 0) || 0;
    }
    const numeric = Number(walletBalance);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [walletBalance]);

  const hasSpendableBalance = useMemo(
    () => totalWalletBalance > 0 && Boolean(cashuWallet),
    [totalWalletBalance, cashuWallet]
  );

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
  const [appLanguage, setAppLanguage] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("appLanguage") === "es"
        ? "es"
        : "en"
      : "en"
  );
  const t = translations[appLanguage] || translations.en;
  const [allowPosts, setAllowPosts] = useState(false);

  const [cefrResult, setCefrResult] = useState(null);
  const [cefrLoading, setCefrLoading] = useState(false);
  const [cefrError, setCefrError] = useState("");
  const [isIdentitySaving, setIsIdentitySaving] = useState(false);

  useEffect(() => {
    setAllowPosts(Boolean(user?.allowPosts));
  }, [user?.allowPosts]);

  // Tabs (order: Chat, Stories, JobScript, History, Grammar, Vocabulary, Random)
  const [currentTab, setCurrentTab] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("currentTab") || "realtime"
      : "realtime"
  );

  // Active lesson tracking and view mode
  const [viewMode, setViewMode] = useState(
    typeof window !== "undefined" && localStorage.getItem("viewMode")
      ? localStorage.getItem("viewMode")
      : "skillTree" // Default to skill tree view
  );
  const [activeLesson, setActiveLesson] = useState(
    typeof window !== "undefined" && localStorage.getItem("activeLesson")
      ? JSON.parse(localStorage.getItem("activeLesson"))
      : null
  );

  // Helper mapping for keys/index
  const TAB_KEYS = [
    "realtime",
    "stories",
    "jobscript", // ⬅️ NEW TAB KEY
    "history",
    "grammar",
    "vocabulary",
    "random",
  ];

  // Filter tabs based on active lesson modes
  const activeTabs = viewMode === "lesson" && activeLesson?.modes?.length > 0
    ? TAB_KEYS.filter(key => activeLesson.modes.includes(key))
    : TAB_KEYS;

  // Track XP at lesson start for completion detection
  const [lessonStartXp, setLessonStartXp] = useState(null);
  const lessonCompletionTriggeredRef = useRef(false);
  const previousXpRef = useRef(null);

  // Random mode switcher for lessons
  const switchToRandomLessonMode = useCallback(() => {
    if (viewMode !== "lesson" || !activeLesson?.modes?.length) return;

    const availableModes = activeLesson.modes;
    if (availableModes.length <= 1) return; // No switching needed if only one mode

    // Filter out current mode to ensure we switch to a different one
    const otherModes = availableModes.filter(mode => mode !== currentTab);
    if (otherModes.length === 0) return;

    // Pick random mode from other modes
    const randomMode = otherModes[Math.floor(Math.random() * otherModes.length)];

    console.log('[Random Mode Switch]', {
      from: currentTab,
      to: randomMode,
      availableModes,
    });

    setCurrentTab(randomMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("currentTab", randomMode);
    }
  }, [viewMode, activeLesson, currentTab]);

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
    jobscript: t?.tabs_jobscript ?? "Job Script", // ⬅️ LABEL
    history: t?.tabs_history ?? "History",
    grammar: t?.tabs_grammar ?? "Grammar",
    vocabulary: t?.tabs_vocab ?? "Vocabulary",
    random: t?.tabs_random ?? "Random",
  };
  const TAB_ICONS = {
    realtime: <RiSpeakLine />,
    stories: <RiSpeakLine />,
    jobscript: <RiSpeakLine />, // ⬅️ ICON
    history: <LuBookOpen />,
    grammar: <CiEdit />,
    vocabulary: <CiEdit />,
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
    level: "beginner",
    supportLang: "en",
    voice: "alloy",
    voicePersona: translations?.en?.onboarding_persona_default_example || "",
    targetLang: "es",
    showTranslations: true,
    pauseMs: 2000,
    helpRequest: "",
    practicePronunciation: false,
  };

  const runWallet = async () => {
    await init();
    await initWalletService();
  };
  useEffect(() => {
    if (rerunWallet) {
      console.log("wallet run");
      runWallet();
    }
  }, [rerunWallet]);

  /* ----------------------------------
     Identity bootstrap + user doc ensure
  ----------------------------------- */
  const connectDID = async () => {
    setIsLoadingApp(true);
    try {
      let id = (localStorage.getItem("local_npub") || "").trim();
      let userDoc = null;

      if (id) {
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
        const did = await generateNostrKeys();
        id = did?.npub || (localStorage.getItem("local_npub") || "").trim();
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
          userDoc.appLanguage === "es"
            ? "es"
            : localStorage.getItem("appLanguage") === "es"
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

  // Keep appLanguage synced from store if changed elsewhere
  useEffect(() => {
    if (!user) return;
    const fromStore =
      user.appLanguage === "es"
        ? "es"
        : localStorage.getItem("appLanguage") === "es"
        ? "es"
        : "en";
    setAppLanguage(fromStore);
    localStorage.setItem("appLanguage", fromStore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.appLanguage]);

  const onboardingDone = useMemo(() => {
    const nested = user?.onboarding?.completed;
    const legacy = user?.onboardingCompleted;
    return isTrue(nested) || isTrue(legacy);
  }, [user]);

  const needsOnboarding = useMemo(() => !onboardingDone, [onboardingDone]);

  /* -----------------------------------
     Daily goal modals (open logic)
     - Only open DailyGoalModal right after onboarding completes
  ----------------------------------- */
  const [dailyGoalOpen, setDailyGoalOpen] = useState(false);
  const [bitcoinModalQueued, setBitcoinModalQueued] = useState(false);
  const [bitcoinModalOpen, setBitcoinModalOpen] = useState(false);
  const [celebrateOpen, setCelebrateOpen] = useState(false);

  // Celebration listener (fired by awardXp when goal is reached)
  useEffect(() => {
    const onHit = () => setCelebrateOpen(true);
    window.addEventListener("daily:goalAchieved", onHit);
    return () => window.removeEventListener("daily:goalAchieved", onHit);
  }, []);

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

  const saveAppLanguage = async (lang = "en") => {
    const id = resolveNpub();
    const norm = lang === "es" ? "es" : "en";
    setAppLanguage(norm);
    try {
      localStorage.setItem("appLanguage", norm);
    } catch {}
    if (!id) return;
    try {
      const now = new Date().toISOString();
      await setDoc(
        doc(database, "users", id),
        { appLanguage: norm, updatedAt: now },
        { merge: true }
      );
      if (user) setUser?.({ ...user, appLanguage: norm, updatedAt: now });
    } catch (e) {
      console.error("Failed to save language:", e);
      toast({
        status: "error",
        title: "Could not save language",
        description: String(e?.message || e),
      });
    }
    window.dispatchEvent(
      new CustomEvent("app:uiLanguageChanged", { detail: norm })
    );
  };

  // Persist settings (used by TopBar Save button)
  const handleSelectAppLanguage = (lang) => {
    const next = lang === "es" ? "es" : "en";
    if (next !== appLanguage) {
      saveAppLanguage(next);
    }
  };

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

  const saveGlobalSettings = async (partial = {}) => {
    const npub = resolveNpub();
    if (!npub) return;

    const clampPause = (v) => {
      const n = Number.isFinite(v) ? Math.round(v) : 800;
      return Math.max(200, Math.min(4000, Math.round(n / 100) * 100));
    };

    const prev = user?.progress || {
      level: "beginner",
      supportLang: "en",
      voice: "alloy",
      voicePersona: translations?.en?.onboarding_persona_default_example || "",
      targetLang: "es",
      showTranslations: true,
      pauseMs: 2000,
      helpRequest: "",
      practicePronunciation: false,
    };

    const next = {
      level: partial.level ?? prev.level ?? "beginner",
      supportLang: ["en", "es", "bilingual"].includes(
        partial.supportLang ?? prev.supportLang
      )
        ? partial.supportLang ?? prev.supportLang
        : "en",
      voice: partial.voice ?? prev.voice ?? "alloy",
      voicePersona: (partial.voicePersona ?? prev.voicePersona ?? "")
        .slice(0, 240)
        .trim(),
      targetLang: ["nah", "es", "pt", "en", "fr", "it"].includes(
        partial.targetLang ?? prev.targetLang
      )
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

    await setDoc(
      doc(database, "users", npub),
      {
        local_npub: npub,
        updatedAt: now,
        helpRequest: next.helpRequest || "",
        progress: next,
        practicePronunciation: next.practicePronunciation,
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

      const CHALLENGE = {
        en: translations.en.onboarding_challenge_default,
        es: translations.es.onboarding_challenge_default,
      };

      const normalized = {
        level: safe(payload.level, "beginner"),
        supportLang: ["en", "es", "bilingual"].includes(payload.supportLang)
          ? payload.supportLang
          : "en",
        practicePronunciation:
          typeof payload.practicePronunciation === "boolean"
            ? payload.practicePronunciation
            : false,
        voice: safe(payload.voice, "alloy"),
        voicePersona: safe(
          payload.voicePersona,
          translations.en.onboarding_persona_default_example
        ),
        targetLang: ["nah", "es", "pt", "en", "fr", "it"].includes(
          payload.targetLang
        )
          ? payload.targetLang
          : "es",
        showTranslations:
          typeof payload.showTranslations === "boolean"
            ? payload.showTranslations
            : true,
        helpRequest: String(safe(payload.helpRequest, "")).slice(0, 600),
        pauseMs: typeof payload.pauseMs === "number" ? payload.pauseMs : 800,
        challenge:
          payload?.challenge?.en && payload?.challenge?.es
            ? payload.challenge
            : { ...CHALLENGE },
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
            currentStep: ONBOARDING_TOTAL_STEPS,
            draft: null,
          },
          lastGoal: normalized.challenge.en,
          xp: 0,
          streak: 0,
          helpRequest: normalized.helpRequest,
          practicePronunciation: normalized.practicePronunciation,
          progress: { ...normalized },
          identity: safe(payload.identity, user?.identity || null),
        },
        { merge: true }
      );

      const fresh = await loadUserObjectFromDB(database, id);
      if (fresh) setUser?.(fresh);

      // Prompt for daily goal right after onboarding
      setDailyGoalOpen(true);
      setBitcoinModalQueued(true);
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
      if (npub) {
        await startLesson(npub, lesson.id);

        // Refresh user data to get updated progress
        const fresh = await loadUserObjectFromDB(database, npub);
        if (fresh) setUser?.(fresh);
      }

      // Set active lesson and persist it
      setActiveLesson(lesson);
      if (typeof window !== "undefined") {
        localStorage.setItem("activeLesson", JSON.stringify(lesson));
      }

      // Record starting XP for this lesson
      const currentXp = user?.progress?.totalXp || user?.xp || 0;
      setLessonStartXp(currentXp);
      lessonCompletionTriggeredRef.current = false; // Reset completion flag
      console.log('[Lesson Start] Recording starting XP:', {
        lessonId: lesson.id,
        lessonTitle: lesson.title.en,
        startXp: currentXp,
        xpRequired: lesson.xpReward,
        userProgressTotalXp: user?.progress?.totalXp,
        userXp: user?.xp,
      });

      // Switch to the first mode in the lesson BEFORE switching view mode
      const firstMode = lesson.modes?.[0];
      console.log('[Lesson Start] Lesson modes:', lesson.modes, 'First mode:', firstMode);
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
      }

      toast({
        title: appLanguage === "es" ? "Lección iniciada" : "Lesson started",
        description: lesson.title[appLanguage] || lesson.title.en,
        status: "success",
        duration: 2000,
      });
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

  // Handle returning to skill tree
  const handleReturnToSkillTree = () => {
    setViewMode("skillTree");
    if (typeof window !== "undefined") {
      localStorage.setItem("viewMode", "skillTree");
    }
  };

  // Ensure current tab is valid for the active lesson
  useEffect(() => {
    if (viewMode === "lesson" && activeLesson?.modes?.length > 0) {
      console.log('[Tab Validation] Current tab:', currentTab, 'Lesson modes:', activeLesson.modes);
      // If current tab is not in lesson modes, switch to first available mode
      if (!activeLesson.modes.includes(currentTab)) {
        const firstMode = activeLesson.modes[0];
        console.log('[Tab Validation] Current tab not in lesson modes, switching to:', firstMode);
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
    if (bitcoinModalQueued) {
      setBitcoinModalQueued(false);
      setBitcoinModalOpen(true);
    }
  }, [bitcoinModalQueued]);

  const handleBitcoinModalClose = useCallback(() => {
    setBitcoinModalOpen(false);
    setBitcoinModalQueued(false);
  }, []);

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
      console.log("RUNNING", totalXp);
      // if (!allowPosts) return;
      console.log("RUNNINGXX", totalXp);
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
          const totalXpEarned = newXp - lessonStartXp;

          console.log('[Lesson XP Check]', {
            newXp,
            lessonStartXp,
            totalXpEarned,
            lessonGoal: activeLesson.xpReward,
            shouldComplete: totalXpEarned >= activeLesson.xpReward,
          });

          // Check if lesson goal reached
          if (totalXpEarned >= activeLesson.xpReward && !lessonCompletionTriggeredRef.current) {
            console.log('[Lesson Completion] XP goal reached! Completing lesson...');
            lessonCompletionTriggeredRef.current = true;

            const npub = resolveNpub();
            if (npub) {
              completeLesson(npub, activeLesson.id, activeLesson.xpReward)
                .then(async () => {
                  const fresh = await loadUserObjectFromDB(database, npub);
                  if (fresh) setUser?.(fresh);

                  toast({
                    title: appLanguage === "es" ? "¡Lección completada!" : "Lesson Complete!",
                    description: activeLesson.title[appLanguage] || activeLesson.title.en,
                    status: "success",
                    duration: 3000,
                  });

                  setTimeout(() => {
                    handleReturnToSkillTree();
                    setActiveLesson(null);
                    setLessonStartXp(null);
                    previousXpRef.current = null;
                    lessonCompletionTriggeredRef.current = false;
                    localStorage.removeItem("activeLesson");
                  }, 1500);
                })
                .catch((err) => {
                  console.error("Failed to complete lesson:", err);
                  lessonCompletionTriggeredRef.current = false;
                });
            }
          } else if (totalXpEarned < activeLesson.xpReward) {
            // Not complete yet - switch to random mode
            setTimeout(() => {
              switchToRandomLessonMode();
            }, 1000);
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
    user?.identity,
    maybePostNostrProgress,
    viewMode,
    activeLesson,
    lessonStartXp,
    switchToRandomLessonMode,
    handleReturnToSkillTree,
    setActiveLesson,
    setLessonStartXp,
    setUser,
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
            />
          </>
        );
      case "history":
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

  /* -----------------------------------
     Loading / Onboarding gates
  ----------------------------------- */
  if (isLoadingApp || !user) {
    return (
      <Box minH="100vh" bg="gray.900" color="gray.100" p={6}>
        <RobotBuddyPro state="Loading" />
      </Box>
    );
  }

  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const rawOnboardingStep = Number(user?.onboarding?.currentStep);
  const onboardingStep = Number.isFinite(rawOnboardingStep)
    ? rawOnboardingStep
    : 1;
  const clampedOnboardingStep = Math.min(
    Math.max(Math.round(onboardingStep) || 1, 1),
    ONBOARDING_TOTAL_STEPS
  );
  const onboardingDefaultPath = `/onboarding/step-${clampedOnboardingStep}`;
  const onboardingInitialDraft = {
    ...(user?.progress || {}),
    ...(user?.onboarding?.draft || {}),
  };

  if (needsOnboarding) {
    if (!isOnboardingRoute) {
      return <Navigate to={onboardingDefaultPath} replace />;
    }

    return (
      <Box minH="100vh" bg="gray.900" color="gray.100">
        <Onboarding
          userLanguage={appLanguage}
          onComplete={handleOnboardingComplete}
          onAppLanguageChange={async (lang) => {
            await saveAppLanguage(lang);
          }}
          initialDraft={onboardingInitialDraft}
          onSaveDraft={handleOnboardingDraftSave}
        />
      </Box>
    );
  }

  if (isOnboardingRoute) {
    return <Navigate to="/" replace />;
  }

  /* -----------------------------------
     Main App (dropdown + panels)
  ----------------------------------- */

  const targetLang = user?.progress?.targetLang || "es";
  const level = user?.progress?.level || "beginner";
  const userProgress = {
    totalXp: user?.progress?.totalXp || user?.xp || 0,
    lessons: user?.progress?.lessons || {},
  };

  return (
    <Box minH="100dvh" bg="gray.950" color="gray.50" width="100%">
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
          if (id) localStorage.setItem("local_npub", id);
          if (typeof sec === "string") localStorage.setItem("local_nsec", sec);
          await connectDID();
          setActiveNpub(localStorage.getItem("local_npub") || "");
          setActiveNsec(localStorage.getItem("local_nsec") || "");
        }}
        onPatchSettings={saveGlobalSettings}
        // controlled drawers
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

      <BottomActionBar
        t={t}
        onOpenIdentity={() => setAccountOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTeams={() => setTeamsOpen(true)}
        isIdentitySaving={isIdentitySaving}
        showTranslations={showTranslationsEnabled}
        onToggleTranslations={handleToggleTranslations}
        translationLabel={translationToggleLabel}
        appLanguage={appLanguage}
        onSelectLanguage={handleSelectAppLanguage}
        onOpenHelpChat={helpChatDisclosure.onOpen}
        hasPendingTeamInvite={pendingTeamInviteCount > 0}
      />

      {/* Skill Tree Scene - Full Screen */}
      {viewMode === "skillTree" && (
        <Box px={[2, 3, 4]} pt={[2, 3]} pb={{ base: 32, md: 24 }} w="100%">
          <SkillTree
            targetLang={targetLang}
            level={level}
            userProgress={userProgress}
            onStartLesson={handleStartLesson}
          />
        </Box>
      )}

      {/* Learning Modules Scene */}
      {viewMode === "lesson" && (
        <Box px={[2, 3, 4]} pt={[2, 3]} pb={{ base: 32, md: 24 }} w="100%">
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
                        supportLang={user?.progress?.supportLang}
                        voice={user?.progress?.voice}
                        voicePersona={user?.progress?.voicePersona}
                        targetLang={user?.progress?.targetLang}
                        showTranslations={user?.progress?.showTranslations}
                        pauseMs={user?.progress?.pauseMs}
                        helpRequest={user?.progress?.helpRequest}
                        practicePronunciation={user?.progress?.practicePronunciation}
                        lessonContent={activeLesson?.content?.realtime}
                        onSwitchedAccount={async (id, sec) => {
                          if (id) localStorage.setItem("local_npub", id);
                          if (typeof sec === "string")
                            localStorage.setItem("local_nsec", sec);
                          await connectDID();
                          setActiveNpub(localStorage.getItem("local_npub") || "");
                          setActiveNsec(localStorage.getItem("local_nsec") || "");
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
                        lessonContent={activeLesson?.content?.stories}
                      />
                    </TabPanel>
                  );
                case "jobscript":
                  return (
                    <TabPanel key="jobscript" px={0}>
                      <JobScript
                        userLanguage={appLanguage}
                        activeNpub={activeNpub}
                        activeNsec={activeNsec}
                        lessonContent={activeLesson?.content?.jobscript}
                      />
                    </TabPanel>
                  );
                case "history":
                  return (
                    <TabPanel key="history" px={0}>
                      <History
                        userLanguage={appLanguage}
                        lessonContent={activeLesson?.content?.history}
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
                        lessonContent={activeLesson?.content?.grammar}
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
                        lessonContent={activeLesson?.content?.vocabulary}
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
        progress={user?.progress}
        appLanguage={appLanguage}
        isOpen={helpChatDisclosure.isOpen}
        onClose={helpChatDisclosure.onClose}
        showFloatingTrigger={false}
      />

      {/* Daily Goal Setup — only opened right after onboarding completes */}
      <DailyGoalModal
        isOpen={dailyGoalOpen}
        onClose={handleDailyGoalClose}
        npub={activeNpub}
        ui={{
          title: appLanguage === "es" ? "Meta diaria de XP" : "Daily XP goal",
          subtitle:
            appLanguage === "es"
              ? "Cada nivel = 100 XP. ¿Cuántos XP quieres ganar al día?"
              : "Each level = 100 XP. How many XP do you want to earn per day?",
          inputLabel: appLanguage === "es" ? "XP por día" : "XP per day",
          save: appLanguage === "es" ? "Guardar" : "Save",
          cancel: appLanguage === "es" ? "Cancelar" : "Cancel",
        }}
      />

      <BitcoinSupportModal
        isOpen={bitcoinModalOpen}
        onClose={handleBitcoinModalClose}
        userLanguage={appLanguage}
        identity={user?.identity || ""}
        onSelectIdentity={handleIdentitySelection}
        isIdentitySaving={isIdentitySaving}
      />

      {/* Daily celebration (once per day) */}
      <Modal
        isOpen={celebrateOpen}
        onClose={() => setCelebrateOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          bg="gray.900"
          color="gray.100"
          maxH="100vh"
          sx={{
            "@supports (height: 100dvh)": {
              maxHeight: "100dvh",
            },
          }}
        >
          <ModalHeader pr={12}>
            {appLanguage === "es"
              ? "¡Meta diaria lograda!"
              : "Daily goal reached!"}
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />
          <ModalBody>
            <Text>
              {appLanguage === "es"
                ? "¡Buen trabajo! Has alcanzado tu objetivo de XP de hoy."
                : "Great job! You reached today’s XP target."}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" onClick={() => setCelebrateOpen(false)}>
              {appLanguage === "es" ? "Seguir" : "Keep going"}
            </Button>
          </ModalFooter>
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
  isIdentitySaving = false,
  showTranslations = true,
  onToggleTranslations,
  translationLabel,
  appLanguage = "en",
  onSelectLanguage,
  onOpenHelpChat,
  helpLabel,
  hasPendingTeamInvite = false,
}) {
  const identityLabel = t?.app_account_aria || "Identity";
  const settingsLabel =
    t?.app_settings_aria || t?.ra_btn_settings || "Settings";
  const toggleLabel =
    translationLabel || t?.ra_translations_toggle || "Translations";
  const englishLabel = t?.language_en || t?.app_language_en || "English";
  const spanishLabel = t?.language_es || t?.app_language_es || "Spanish";
  const helpChatLabel =
    helpLabel || t?.app_help_chat || (appLanguage === "es" ? "Ayuda" : "Help");
  const teamsLabel = t?.teams_drawer_title || "Teams";

  const handleSelectLanguage = (lang) => {
    if (typeof onSelectLanguage === "function") {
      onSelectLanguage(lang);
    }
  };

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={80}
      bg="rgba(6, 10, 24, 0.95)"
      borderTop="1px solid"
      borderColor="gray.800"
      backdropFilter="blur(8px)"
      py={3}
      px={{ base: 3, md: 6 }}
      width="100%"
      maxW="480px"
      margin="0 auto"
      borderRadius="24"
      paddingBottom={6}
      paddingTop={4}
    >
      <Flex
        as="nav"
        maxW="560px"
        mx="auto"
        w="100%"
        align="center"
        justify={{ base: "center", md: "center" }}
        gap={{ base: 3, md: 6 }}
        flexWrap={{ base: "wrap", md: "wrap" }}
        rowGap={{ base: 3, md: 4 }}
        columnGap={{ base: 3, md: 6 }}
        overflow="visible"
      >
        <ButtonGroup
          size="sm"
          isAttached
          variant="outline"
          borderRadius="full"
          bg="rgba(255, 255, 255, 0.04)"
          border="1px solid"
          borderColor="gray.700"
          flexShrink={0}
        >
          <Button
            onClick={() => handleSelectLanguage("en")}
            variant={appLanguage === "en" ? "solid" : "ghost"}
            colorScheme="teal"
            fontSize="xs"
            fontWeight="bold"
            aria-label={englishLabel}
            px={3}
          >
            EN
          </Button>
          <Button
            onClick={() => handleSelectLanguage("es")}
            variant={appLanguage === "es" ? "solid" : "ghost"}
            colorScheme="teal"
            fontSize="xs"
            fontWeight="bold"
            aria-label={spanishLabel}
            px={3}
          >
            ES
          </Button>
        </ButtonGroup>
        <IconButton
          icon={<FaAddressCard size={18} />}
          onClick={onOpenIdentity}
          aria-label={identityLabel}
          isLoading={isIdentitySaving}
          rounded="xl"
          flexShrink={0}
        />

        <IconButton
          icon={<PiUsersBold size={20} />}
          onClick={onOpenTeams}
          aria-label={teamsLabel}
          rounded="xl"
          flexShrink={0}
          borderWidth={hasPendingTeamInvite ? "2px" : "0px"}
          borderColor={hasPendingTeamInvite ? "purple.400" : "gray.700"}
          boxShadow={
            hasPendingTeamInvite
              ? "0 0 0 2px rgba(168,85,247,0.35), 0 0 14px rgba(168,85,247,0.65)"
              : undefined
          }
        />

        <IconButton
          icon={<SettingsIcon boxSize={4} />}
          color="gray.100"
          onClick={onOpenSettings}
          aria-label={settingsLabel}
          rounded="xl"
          flexShrink={0}
        />

        <IconButton
          icon={<MdOutlineSupportAgent size={20} />}
          onClick={onOpenHelpChat}
          aria-label={helpChatLabel}
          rounded="full"
          isDisabled={!onOpenHelpChat}
          bg="white"
          color="blue"
          border="4px solid skyblue"
          size="lg"
          zIndex={50}
          boxShadow="lg"
          flexShrink={0}
        />
      </Flex>
    </Box>
  );
}
