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
  Menu,
  MenuButton,
  MenuList,
  MenuItemOption,
  MenuOptionGroup,
  Badge,
} from "@chakra-ui/react";
import {
  SettingsIcon,
  ChevronDownIcon,
  CheckCircleIcon,
} from "@chakra-ui/icons";
import { GoDownload } from "react-icons/go";
import { CiUser, CiSquarePlus, CiEdit } from "react-icons/ci";
import { IoIosMore } from "react-icons/io";
import { MdOutlineFileUpload } from "react-icons/md";
import { RiSpeakLine } from "react-icons/ri";
import { LuBadgeCheck, LuBookOpen, LuShuffle } from "react-icons/lu";

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

/* ---------------------------
   Small helpers
--------------------------- */
const isTrue = (v) => v === true || v === "true" || v === 1 || v === "1";

const CEFR_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const ONBOARDING_TOTAL_STEPS = 3;

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
  onToggleAppLanguage,
  onPatchSettings,
  onSwitchedAccount,
  settingsOpen,
  openSettings,
  closeSettings,
  accountOpen,
  openAccount,
  closeAccount,
  onRunCefrAnalysis,
  installOpen,
  openInstall,
  closeInstall,
  onSelectIdentity,
  isIdentitySaving = false,
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

  const languageName = (code) =>
    translations[appLanguage][`language_${code === "nah" ? "nah" : code}`] ||
    code;

  const toggleLabel =
    translations[appLanguage].onboarding_translations_toggle?.replace(
      "{language}",
      languageName(
        targetLang === "en" ? "es" : supportLang === "es" ? "es" : "en"
      )
    ) || (appLanguage === "es" ? "Mostrar traducción" : "Show translation");

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
          <Box w={{ base: "120px", sm: "150px", md: "180px" }}>
            <WaveBar value={dailyPct} />
          </Box>
          <HStack spacing={1} flexShrink={0}>
            <Text fontSize="sm" opacity={0.9} noOfLines={1}>
              {dailyGoalXp > 0 ? `${dailyPct}%` : "—"}
            </Text>
            {dailyDone && (
              <CheckCircleIcon
                boxSize={{ base: "16px", md: "18px" }}
                color="green.400"
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
          <IconButton
            aria-label={t.app_settings_aria || "Settings"}
            icon={<SettingsIcon size={20} />}
            size={{ base: "sm", md: "md" }}
            onClick={openSettings}
            colorScheme="cyan"
            color="white"
          />
          <IconButton
            aria-label={t.app_install_aria || "Install"}
            icon={<GoDownload size={20} />}
            size={{ base: "sm", md: "md" }}
            onClick={openInstall}
            color="white"
          />
          <IconButton
            aria-label={t.app_account_aria || "Account"}
            icon={<CiUser size={20} />}
            size={{ base: "sm", md: "md" }}
            onClick={openAccount}
            color="white"
          />
          {/* UI language toggle EN <-> ES */}
          <HStack spacing={1} align="center" pl={{ base: 1, md: 2 }}>
            <Text
              display={{ base: "inline", sm: "inline" }}
              fontSize="sm"
              color={appLanguage === "en" ? "teal.300" : "gray.400"}
            >
              EN
            </Text>
            <Switch
              colorScheme="teal"
              size={{ base: "sm", md: "md" }}
              isChecked={appLanguage === "es"}
              onChange={onToggleAppLanguage}
            />
            <Text
              display={{ base: "inline", sm: "inline" }}
              fontSize="sm"
              color={appLanguage === "es" ? "teal.300" : "gray.400"}
            >
              ES
            </Text>
          </HStack>
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

              {/* Translations toggle */}
              <HStack bg="gray.800" p={3} rounded="md" justify="space-between">
                <Text fontSize="sm" mr={2}>
                  {toggleLabel}
                </Text>
                <Switch
                  isChecked={showTranslations}
                  onChange={(e) => setShowTranslations(e.target.checked)}
                />
              </HStack>

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

      {/* ---- Install Modal ---- */}
      <Modal isOpen={installOpen} onClose={closeInstall} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.900" color="gray.100">
          <ModalHeader>{t.app_install_title || "Install as app"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" pb={0}>
              <IoIosMore size={32} />
              <Text mt={2}>
                {t.app_install_step1 || "Open the browser menu."}
              </Text>
            </Flex>
            <Divider my={6} />

            <Flex direction="column" pb={0}>
              <MdOutlineFileUpload size={32} />
              <Text mt={2}>
                {t.app_install_step2 || "Choose 'Share' or 'Install'."}
              </Text>
            </Flex>
            <Divider my={6} />

            <Flex direction="column" pb={0}>
              <CiSquarePlus size={32} />
              <Text mt={2}>{t.app_install_step3 || "Add to Home Screen."}</Text>
            </Flex>
            <Divider my={6} />

            <Flex direction="column" pb={0}>
              <LuBadgeCheck size={32} />
              <Text mt={2}>
                {t.app_install_step4 || "Launch from your Home Screen."}
              </Text>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              onMouseDown={closeInstall}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") closeInstall();
              }}
            >
              {t.app_close || "Close"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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

  const [isLoadingApp, setIsLoadingApp] = useState(true);

  // Zustand store
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const patchUser = useUserStore((s) => s.patchUser);

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
    () => totalWalletBalance > 0 && Boolean(cashuWallet) && Boolean(user?.identity),
    [totalWalletBalance, cashuWallet, user?.identity]
  );

  // DID / auth
  const { generateNostrKeys, auth } = useDecentralizedIdentity(
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

  // UI language for the *app UI*
  const [appLanguage, setAppLanguage] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("appLanguage") === "es"
        ? "es"
        : "en"
      : "en"
  );
  const t = translations[appLanguage] || translations.en;

  const [cefrResult, setCefrResult] = useState(null);
  const [cefrLoading, setCefrLoading] = useState(false);
  const [cefrError, setCefrError] = useState("");
  const [isIdentitySaving, setIsIdentitySaving] = useState(false);

  // Tabs (order: Chat, Stories, JobScript, History, Grammar, Vocabulary, Random)
  const [currentTab, setCurrentTab] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("currentTab") || "realtime"
      : "realtime"
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
  const keyToIndex = (k) => Math.max(0, TAB_KEYS.indexOf(k));
  const indexToKey = (i) => TAB_KEYS[i] ?? "realtime";
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
      targetLang: ["nah", "es", "pt", "en"].includes(
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
        targetLang: ["nah", "es", "pt", "en"].includes(payload.targetLang)
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleLocalXpAward = () => {
      if (!hasSpendableBalance) return;
      const mark = Date.now();
      lastLocalXpEventRef.current = mark;
      Promise.resolve(sendOneSatToNpub()).catch((error) => {
        console.error("Failed to send sat on local XP award", error);
        if (lastLocalXpEventRef.current === mark) {
          lastLocalXpEventRef.current = 0;
        }
      });
    };
    window.addEventListener("xp:awarded", handleLocalXpAward);
    return () => window.removeEventListener("xp:awarded", handleLocalXpAward);
  }, [hasSpendableBalance, sendOneSatToNpub]);

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
          Promise.resolve(sendOneSatToNpub()).catch((error) => {
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
  ]);

  const RandomHeader = (
    <HStack justify="flex-end" rounded="xl" mb={2}>
      <Button
        size="sm"
        leftIcon={<LuShuffle />}
        variant="outline"
        borderColor="gray.700"
        onClick={pickRandomFeature}
        zIndex={10000}
      >
        {t?.random_shuffle ?? "Shuffle"}
      </Button>
    </HStack>
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
  const [installOpen, setInstallOpen] = useState(false);

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
        onToggleAppLanguage={() =>
          saveAppLanguage(appLanguage === "en" ? "es" : "en")
        }
        // controlled drawers
        settingsOpen={settingsOpen}
        openSettings={() => setSettingsOpen(true)}
        closeSettings={() => setSettingsOpen(false)}
        accountOpen={accountOpen}
        openAccount={() => setAccountOpen(true)}
        closeAccount={() => setAccountOpen(false)}
        onRunCefrAnalysis={runCefrAnalysis}
        installOpen={installOpen}
        openInstall={() => setInstallOpen(true)}
        closeInstall={() => setInstallOpen(false)}
        onSelectIdentity={handleIdentitySelection}
        isIdentitySaving={isIdentitySaving}
      />

      <Box px={[2, 3, 4]} pt={[2, 3]} w="100%">
        <Tabs
          index={tabIndex}
          onChange={(i) => {
            const key = indexToKey(i);
            setCurrentTab(key);
            localStorage.setItem("currentTab", key);
          }}
          colorScheme="teal"
          isLazy
        >
          {/* Top dropdown selector (replaces TabList) */}
          <Box
            borderColor="gray.700"
            rounded="xl"
            p="6px"
            mb={[2, 3]}
            width="100%"
            display="flex"
            justifyContent="center"
          >
            <Menu autoSelect={false} isLazy>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant="outline"
                size="sm"
                borderColor="gray.700"
                w={{ base: "100%", sm: "70%", md: "50%" }}
                padding={6}
              >
                <HStack spacing={2} justify="center">
                  {TAB_ICONS[currentTab]}
                  <Text>{TAB_LABELS[currentTab]}</Text>
                </HStack>
              </MenuButton>

              <MenuList borderColor="gray.700">
                <MenuOptionGroup
                  type="radio"
                  value={currentTab}
                  onChange={(value) => {
                    const v = String(value);
                    setCurrentTab(v);
                    localStorage.setItem("currentTab", v);
                  }}
                >
                  <MenuItemOption value="realtime">
                    <HStack spacing={2}>
                      {TAB_ICONS.realtime}
                      <Text>{TAB_LABELS.realtime}</Text>
                    </HStack>
                  </MenuItemOption>

                  <MenuItemOption value="stories">
                    <HStack spacing={2}>
                      {TAB_ICONS.stories}
                      <Text>{TAB_LABELS.stories}</Text>
                    </HStack>
                  </MenuItemOption>

                  {/* NEW: Job Script */}
                  <MenuItemOption value="jobscript">
                    <HStack spacing={2}>
                      {TAB_ICONS.jobscript}
                      <Text>{TAB_LABELS.jobscript}</Text>
                    </HStack>
                  </MenuItemOption>

                  <MenuItemOption value="history">
                    <HStack spacing={2}>
                      {TAB_ICONS.history}
                      <Text>{TAB_LABELS.history}</Text>
                    </HStack>
                  </MenuItemOption>

                  <MenuItemOption value="grammar">
                    <HStack spacing={2}>
                      {TAB_ICONS.grammar}
                      <Text>{TAB_LABELS.grammar}</Text>
                    </HStack>
                  </MenuItemOption>

                  <MenuItemOption value="vocabulary">
                    <HStack spacing={2}>
                      {TAB_ICONS.vocabulary}
                      <Text>{TAB_LABELS.vocabulary}</Text>
                    </HStack>
                  </MenuItemOption>

                  <MenuItemOption value="random">
                    <HStack spacing={2}>
                      {TAB_ICONS.random}
                      <Text>{TAB_LABELS.random}</Text>
                    </HStack>
                  </MenuItemOption>
                </MenuOptionGroup>
              </MenuList>
            </Menu>
          </Box>

          <TabPanels mt={[2, 3]}>
            {/* Chat */}
            <TabPanel px={0}>
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
            </TabPanel>

            {/* Stories */}
            <TabPanel px={0}>
              <StoryMode
                userLanguage={appLanguage}
                activeNpub={activeNpub}
                activeNsec={activeNsec}
              />
            </TabPanel>

            {/* Job Script (existing component) */}
            <TabPanel px={0}>
              <JobScript
                userLanguage={appLanguage}
                activeNpub={activeNpub}
                activeNsec={activeNsec}
              />
            </TabPanel>

            {/* History (reading) */}
            <TabPanel px={0}>
              <History userLanguage={appLanguage} />
            </TabPanel>

            {/* Grammar */}
            <TabPanel px={0}>
              <GrammarBook
                userLanguage={appLanguage}
                activeNpub={activeNpub}
                activeNsec={activeNsec}
              />
            </TabPanel>

            {/* Vocabulary */}
            <TabPanel px={0}>
              <Vocabulary
                userLanguage={appLanguage}
                activeNpub={activeNpub}
                activeNsec={activeNsec}
              />
            </TabPanel>

            {/* Randomize (not route-based) */}
            <TabPanel px={0}>{renderRandomPanel()}</TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      <HelpChatFab progress={user?.progress} appLanguage={appLanguage} />

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
