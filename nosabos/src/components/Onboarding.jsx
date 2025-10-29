// src/components/Onboarding.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Input,
  Select,
  Switch,
  Text,
  VStack,
  Wrap,
  WrapItem,
  Spacer,
  Textarea,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  IconButton,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useLocation, useNavigate } from "react-router-dom";

import { WaveBar } from "./WaveBar";
import { BitcoinWalletSection } from "./IdentityDrawer";
import { translations } from "../utils/translation";

const STEP_ROUTES = [
  { slug: "step-1" },
  { slug: "step-2" },
  { slug: "step-3" },
  { slug: "step-4" },
];

const BASE_PATH = "/onboarding";

export default function Onboarding({
  onComplete,
  userLanguage = "en",
  onAppLanguageChange = () => {},
  initialDraft = {},
  onSaveDraft = async () => {},
  walletIdentity = "",
  onWalletIdentityChange = async () => {},
  isWalletIdentitySaving = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [appLang, setAppLang] = useState(userLanguage === "es" ? "es" : "en");
  const ui = translations[appLang] || translations.en;

  const defaults = useMemo(() => {
    return {
      level: initialDraft.level || "beginner",
      supportLang: initialDraft.supportLang || "en",
      targetLang: initialDraft.targetLang || "es",
      practicePronunciation:
        typeof initialDraft.practicePronunciation === "boolean"
          ? initialDraft.practicePronunciation
          : false,
      voice: initialDraft.voice || "alloy",
      voicePersona:
        initialDraft.voicePersona ||
        ui.DEFAULT_PERSONA ||
        translations.en.onboarding_persona_default_example,
      showTranslations:
        typeof initialDraft.showTranslations === "boolean"
          ? initialDraft.showTranslations
          : true,
      helpRequest: initialDraft.helpRequest || "",
      pauseMs:
        typeof initialDraft.pauseMs === "number" && initialDraft.pauseMs > 0
          ? initialDraft.pauseMs
          : 800,
    };
  }, [initialDraft, ui.DEFAULT_PERSONA]);

  const [level, setLevel] = useState(defaults.level);
  const [supportLang, setSupportLang] = useState(defaults.supportLang);
  const [targetLang, setTargetLang] = useState(defaults.targetLang);
  const [practicePronunciation, setPracticePronunciation] = useState(
    defaults.practicePronunciation
  );
  const [voice, setVoice] = useState(defaults.voice);
  const [voicePersona, setVoicePersona] = useState(defaults.voicePersona);
  const [helpRequest, setHelpRequest] = useState(defaults.helpRequest);
  const [showTranslations, setShowTranslations] = useState(
    defaults.showTranslations
  );
  const [pauseMs, setPauseMs] = useState(defaults.pauseMs);

  const [isSaving, setIsSaving] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);

  useEffect(() => {
    if (!voicePersona) {
      setVoicePersona(ui.DEFAULT_PERSONA || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appLang]);

  useEffect(() => {
    const inScope = STEP_ROUTES.some((step) =>
      location.pathname.startsWith(`${BASE_PATH}/${step.slug}`)
    );
    if (!inScope) {
      navigate(`${BASE_PATH}/${STEP_ROUTES[0].slug}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  const currentStepIndex = useMemo(() => {
    const idx = STEP_ROUTES.findIndex((step) =>
      location.pathname.startsWith(`${BASE_PATH}/${step.slug}`)
    );
    return idx >= 0 ? idx : 0;
  }, [location.pathname]);

  const totalSteps = STEP_ROUTES.length;
  const progressValue = ((currentStepIndex + 1) / totalSteps) * 100;

  const persistAppLanguage = (lang) => {
    const norm = lang === "es" ? "es" : "en";
    setAppLang(norm);
    try {
      localStorage.setItem("appLanguage", norm);
    } catch {}
    try {
      onAppLanguageChange(norm);
    } catch {}
  };

  const CHALLENGE = useMemo(
    () => ({
      en: translations.en.onboarding_challenge_default,
      es: translations.es.onboarding_challenge_default,
    }),
    []
  );

  const handlePersistDraft = async (stepNumber) => {
    if (typeof onSaveDraft !== "function") return;
    setIsPersisting(true);
    try {
      await onSaveDraft(
        {
          level,
          supportLang,
          targetLang,
          practicePronunciation,
          voice,
          voicePersona,
          helpRequest,
          showTranslations,
          pauseMs,
          challenge: { ...CHALLENGE },
          identity: walletIdentity || null,
        },
        stepNumber
      );
    } catch (error) {
      console.error("Failed to persist onboarding draft", error);
    } finally {
      setIsPersisting(false);
    }
  };

  const goToStep = async (index) => {
    const clamped = Math.max(0, Math.min(totalSteps - 1, index));
    await handlePersistDraft(clamped + 1);
    navigate(`${BASE_PATH}/${STEP_ROUTES[clamped].slug}`);
  };

  const handleNext = async () => {
    if (currentStepIndex >= totalSteps - 1) return;
    await goToStep(currentStepIndex + 1);
  };

  const handleBack = async () => {
    if (currentStepIndex <= 0) return;
    await goToStep(currentStepIndex - 1);
  };

  async function handleStart() {
    if (typeof onComplete !== "function") {
      console.error("Onboarding.onComplete is not provided.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        level,
        supportLang,
        voice,
        voicePersona,
        targetLang,
        practicePronunciation,
        showTranslations,
        helpRequest,
        pauseMs,
        challenge: { ...CHALLENGE },
        identity: walletIdentity || null,
      };
      await Promise.resolve(onComplete(payload));
    } finally {
      setIsSaving(false);
    }
  }

  const personaPlaceholder = (
    ui.onboarding_persona_input_placeholder || 'e.g., "{example}"'
  ).replace(
    "{example}",
    ui.onboarding_persona_default_example || "patient, encouraging, playful"
  );

  const secondaryPref = supportLang === "es" ? "es" : "en";
  const toggleLabel = (
    ui.onboarding_translations_toggle || "Show translations in {language}"
  ).replace(
    "{language}",
    ui[`language_${secondaryPref}`] ||
      (secondaryPref === "es" ? "Spanish" : "English")
  );

  const HELP_TITLE =
    ui.onboarding_help_title || "What would you like help with?";
  const HELP_PLACEHOLDER =
    ui.onboarding_help_placeholder ||
    "e.g., conversational practice for job interviews; past tenses review; travel Spanish…";
  const HELP_HINT =
    ui.onboarding_help_hint ||
    "Share topics, goals, or situations. This guides your AI coach.";

  const PRON_LABEL = ui.onboarding_pron_label || "Practice pronunciation";
  const PRON_HINT =
    ui.onboarding_pron_hint ||
    "When enabled, your coach will prompt you to repeat lines and focus on sounds/intonation.";

  const VAD_LABEL =
    ui.ra_vad_label ||
    (appLang === "es" ? "Pausa entre turnos" : "Pause between replies");
  const VAD_HINT =
    ui.onboarding_vad_hint ||
    (appLang === "es"
      ? "Más corta = más sensible; más larga = te deja terminar de hablar."
      : "Shorter = more responsive; longer = gives you time to finish speaking.");

  const stepIndicator = (
    ui.onboarding_step_indicator || "Step {current} of {total}"
  )
    .replace("{current}", currentStepIndex + 1)
    .replace("{total}", totalSteps);

  const stepTitleKeys = [
    ui.onboarding_step1_title || ui.onboarding_section_difficulty_support,
    ui.onboarding_step2_title || ui.onboarding_section_voice_persona,
    ui.onboarding_step3_title || ui.onboarding_section_first_goal,
    ui.onboarding_step4_title ||
      (appLang === "es"
        ? "Activa tu billetera (opcional)"
        : "Activate your wallet (optional)"),
  ];

  return (
    <Box minH="100vh" bg="gray.900" color="gray.100">
      <Drawer isOpen={true} placement="bottom" onClose={() => {}}>
        <DrawerOverlay bg="blackAlpha.700" />
        <DrawerContent bg="gray.900" color="gray.100" borderTopRadius="24px">
          <DrawerHeader pb={4}>
            <IconButton
              aria-label="Back"
              icon={<ArrowBackIcon />}
              onClick={handleBack}
              isDisabled={currentStepIndex === 0 || isPersisting || isSaving}
              variant="ghost"
              colorScheme="teal"
              mb={2}
            />
            <VStack align="stretch" spacing={4}>
              <HStack align="center" w="100%">
                <VStack align="stretch" spacing={1}>
                  <Text fontWeight="bold" fontSize="lg">
                    {ui.onboarding_title}
                  </Text>
                  <Text opacity={0.85} fontSize="sm">
                    {ui.onboarding_subtitle}
                  </Text>
                </VStack>
                <Spacer />
                <HStack spacing={2} align="center">
                  <Text
                    fontSize="sm"
                    color={appLang === "en" ? "teal.300" : "gray.400"}
                  >
                    EN
                  </Text>
                  <Switch
                    colorScheme="teal"
                    isChecked={appLang === "es"}
                    onChange={() =>
                      persistAppLanguage(appLang === "en" ? "es" : "en")
                    }
                  />
                  <Text
                    fontSize="sm"
                    color={appLang === "es" ? "teal.300" : "gray.400"}
                  >
                    ES
                  </Text>
                </HStack>
              </HStack>

              <VStack align="stretch" spacing={2}>
                <Text fontSize="xs" color="gray.400">
                  {stepIndicator}
                </Text>
                <WaveBar
                  value={progressValue}
                  height={12}
                  start="#38f9d7"
                  end="#4facfe"
                  bg="rgba(255,255,255,0.08)"
                  border="rgba(255,255,255,0.12)"
                />
              </VStack>
              <Text fontSize="sm" fontWeight="semibold" color="teal.200">
                {stepTitleKeys[currentStepIndex]}
              </Text>
            </VStack>
          </DrawerHeader>

          <DrawerBody pb={6}>
            <VStack align="stretch" spacing={4}>
              {currentStepIndex === 0 && (
                <VStack align="stretch" spacing={4}>
                  <Box bg="gray.800" p={3} rounded="md">
                    <Text fontSize="sm" mb={2} opacity={0.85}>
                      {ui.onboarding_section_difficulty_support}
                    </Text>
                    <Wrap spacing={2}>
                      <WrapItem>
                        <Select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          bg="gray.800"
                          size="md"
                          w="auto"
                        >
                          <option value="beginner">
                            {ui.onboarding_level_beginner}
                          </option>
                          <option value="intermediate">
                            {ui.onboarding_level_intermediate}
                          </option>
                          <option value="advanced">
                            {ui.onboarding_level_advanced}
                          </option>
                        </Select>
                      </WrapItem>

                      <WrapItem>
                        <Select
                          value={supportLang}
                          onChange={(e) => setSupportLang(e.target.value)}
                          bg="gray.800"
                          size="md"
                          w="auto"
                        >
                          <option value="en">{ui.onboarding_support_en}</option>
                          <option value="bilingual">
                            {ui.onboarding_support_bilingual}
                          </option>
                          <option value="es">{ui.onboarding_support_es}</option>
                        </Select>
                      </WrapItem>

                      <WrapItem>
                        <Select
                          value={targetLang}
                          onChange={(e) => setTargetLang(e.target.value)}
                          bg="gray.800"
                          size="md"
                          w="auto"
                          title={ui.onboarding_practice_label_title}
                        >
                          <option value="nah">
                            {ui.onboarding_practice_nah}
                          </option>
                          <option value="es">
                            {ui.onboarding_practice_es}
                          </option>
                          <option value="pt">
                            {ui.onboarding_practice_pt}
                          </option>
                          <option value="en">
                            {ui.onboarding_practice_en}
                          </option>
                        </Select>
                      </WrapItem>
                    </Wrap>
                  </Box>

                  <HStack
                    bg="gray.800"
                    p={3}
                    rounded="md"
                    justify="space-between"
                  >
                    <Box>
                      <Text fontSize="sm" mr={2}>
                        {PRON_LABEL}
                      </Text>
                      <Text fontSize="xs" opacity={0.7}>
                        {PRON_HINT}
                      </Text>
                    </Box>
                    <Switch
                      isChecked={practicePronunciation}
                      onChange={(e) =>
                        setPracticePronunciation(e.target.checked)
                      }
                      colorScheme="teal"
                    />
                  </HStack>
                </VStack>
              )}

              {currentStepIndex === 1 && (
                <VStack align="stretch" spacing={4}>
                  <Box bg="gray.800" p={3} rounded="md">
                    <Text fontSize="sm" mb={2} opacity={0.85}>
                      {ui.onboarding_section_voice_persona}
                    </Text>
                    <Wrap spacing={2} mb={2}>
                      <WrapItem>
                        <Select
                          value={voice}
                          onChange={(e) => setVoice(e.target.value)}
                          bg="gray.800"
                          size="md"
                          w="auto"
                        >
                          <option value="alloy">
                            {ui.onboarding_voice_alloy}
                          </option>
                          <option value="ash">{ui.onboarding_voice_ash}</option>
                          <option value="ballad">
                            {ui.onboarding_voice_ballad}
                          </option>
                          <option value="coral">
                            {ui.onboarding_voice_coral}
                          </option>
                          <option value="echo">
                            {ui.onboarding_voice_echo}
                          </option>
                          <option value="sage">
                            {ui.onboarding_voice_sage}
                          </option>
                          <option value="shimmer">
                            {ui.onboarding_voice_shimmer}
                          </option>
                          <option value="verse">
                            {ui.onboarding_voice_verse}
                          </option>
                        </Select>
                      </WrapItem>
                    </Wrap>

                    <Input
                      value={voicePersona}
                      onChange={(e) => setVoicePersona(e.target.value)}
                      bg="gray.700"
                      placeholder={personaPlaceholder}
                    />
                    <Text fontSize="xs" opacity={0.7} mt={1}>
                      {ui.onboarding_persona_help_text}
                    </Text>

                    <Text fontSize="sm" mt={4} opacity={0.85}>
                      {HELP_TITLE}
                    </Text>
                    <Textarea
                      value={helpRequest}
                      onChange={(e) => setHelpRequest(e.target.value)}
                      bg="gray.700"
                      placeholder={HELP_PLACEHOLDER}
                      resize="vertical"
                      minH="80px"
                      mt={1}
                    />
                    <Text fontSize="xs" opacity={0.7} mt={1}>
                      {HELP_HINT}
                    </Text>
                  </Box>
                </VStack>
              )}

              {currentStepIndex === 2 && (
                <VStack align="stretch" spacing={4}>
                  <HStack
                    bg="gray.800"
                    p={3}
                    rounded="md"
                    justify="space-between"
                  >
                    <Text fontSize="sm" mr={2}>
                      {toggleLabel}
                    </Text>
                    <Switch
                      isChecked={showTranslations}
                      onChange={(e) => setShowTranslations(e.target.checked)}
                    />
                  </HStack>

                  <Box bg="gray.800" p={3} rounded="md">
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm">{VAD_LABEL}</Text>
                      <Text fontSize="sm" opacity={0.8}>
                        {pauseMs} ms
                      </Text>
                    </HStack>
                    <Text fontSize="xs" opacity={0.7} mb={2}>
                      {VAD_HINT}
                    </Text>
                    <Slider
                      aria-label="onboarding-pause-slider"
                      min={200}
                      max={4000}
                      step={100}
                      value={pauseMs}
                      onChange={(val) => setPauseMs(val)}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Box>

                  <Box bg="gray.800" p={3} rounded="md">
                    <Text fontSize="sm" opacity={0.8}>
                      {ui.onboarding_section_first_goal}
                    </Text>
                    <Text mt={1} whiteSpace="pre-wrap">
                      🎯 {ui.onboarding_challenge_default}
                    </Text>
                    <Text mt={1} opacity={0.9}>
                      {ui.onboarding_challenge_label_es}{" "}
                      {translations.es.onboarding_challenge_default}
                    </Text>
                  </Box>
                </VStack>
              )}

              {currentStepIndex === 3 && (
                <VStack align="stretch" spacing={4}>
                  <Box bg="gray.800" p={3} rounded="md">
                    <Text fontSize="sm" mb={1}>
                      {ui.onboarding_bitcoin_optional_title ||
                        (appLang === "es"
                          ? "Depósitos opcionales en Bitcoin"
                          : "Optional Bitcoin deposits")}
                    </Text>
                    <Text fontSize="xs" opacity={0.8}>
                      {ui.onboarding_bitcoin_optional_desc ||
                        (appLang === "es"
                          ? "Si quieres apoyar a una comunidad, elige una identidad y recarga tu billetera. Puedes omitir este paso."
                          : "If you’d like to support a community, choose an identity and top up your wallet. You can skip this for now.")}
                    </Text>
                  </Box>

                  <BitcoinWalletSection
                    userLanguage={appLang}
                    identity={walletIdentity || ""}
                    onSelectIdentity={onWalletIdentityChange}
                    isIdentitySaving={isWalletIdentitySaving}
                  />
                </VStack>
              )}
        </VStack>
      </DrawerBody>

          <Box
            px={6}
            pb={6}
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
          >
            {currentStepIndex < totalSteps - 1 ? (
              <Button
                size="lg"
                colorScheme="teal"
                onClick={handleNext}
                isLoading={isPersisting}
                loadingText={ui.common_saving}
                isDisabled={isSaving}
              >
                {ui.onboarding_cta_next || "Next"}
              </Button>
            ) : (
              <Button
                size="lg"
                colorScheme="teal"
                onClick={handleStart}
                isLoading={isSaving}
                loadingText={ui.common_saving}
                isDisabled={isPersisting}
              >
                {ui.onboarding_cta_start}
              </Button>
            )}
          </Box>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
