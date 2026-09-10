import { LearningGoalField } from "./LearningGoalSettings";
import { goalOnboardingCopy } from "../utils/learningGoalCopy";
import { astraGoalsEnabled } from "../utils/learningIntelligence";
// src/components/Onboarding.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  HStack,
  Text,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItemOption,
  MenuOptionGroup,
} from "@chakra-ui/react";
import { ChevronDownIcon, SettingsIcon } from "@chakra-ui/icons";
import { submitActionSound, selectSound } from "../constants/sounds";
import useSoundSettings, {
  DEFAULT_TUTOR_VOLUME,
} from "../hooks/useSoundSettings";
import { useLocation, useNavigate } from "react-router-dom";

import { translations } from "../utils/translation";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  getDefaultTargetForSupport,
  getPracticeLanguageOptions,
  getSupportLanguageOptions,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";
import { syncDocumentLanguage } from "../utils/documentLanguage";
import RandomCharacter from "./RandomCharacter";
import CommunityLanguageResourcesModal from "./CommunityLanguageResourcesModal";
import { useThemeStore } from "../useThemeStore";
import { isCommunityResourceLanguage } from "../data/communityLanguageResources";
import {
  nativeDrawerMotionProps,
  nativeOverlayMotionProps,
} from "../utils/modalMotion";
import { normalizeTutorVoice } from "../utils/tutorRealtime";
import { motion } from "framer-motion";

const BASE_PATH = "/onboarding";
const DEFAULT_VOICE_PAUSE_MS = 1200;

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

export default function Onboarding({
  onComplete,
  userLanguage = "en",
  initialDraft = {},
  includeSelectorHidden = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const normalizedUserLang = normalizeSupportLanguage(
    userLanguage,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  const initialSupportLang = normalizeSupportLanguage(
    initialDraft.supportLang || normalizedUserLang,
    normalizedUserLang,
  );
  const [supportLang, setSupportLang] = useState(initialSupportLang);
  // Follow the resolved app language (set on the landing page / /links / the
  // user doc) until the user explicitly picks a support language here — so a
  // late language resolution can't leave this stuck on the default.
  const userPickedSupportLangRef = useRef(false);
  useEffect(() => {
    if (userPickedSupportLangRef.current) return;
    const next = normalizeSupportLanguage(
      userLanguage,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    setSupportLang((prev) => (prev === next ? prev : next));
  }, [userLanguage]);
  const ui = translations[supportLang] || translations.en;
  const storedThemeMode = useThemeStore((s) => s.themeMode);

  const defaults = useMemo(() => {
    return {
      level: initialDraft.level || "beginner",
      supportLang: initialSupportLang,
      targetLang: normalizePracticeLanguage(
        initialDraft.targetLang,
        getDefaultTargetForSupport(initialSupportLang),
      ),
      tutorVoice: normalizeTutorVoice(
        initialDraft.tutorVoice || initialDraft.voice,
      ),
      voicePersona:
        personaForSupportLanguage(
          initialDraft.tutorVoicePersona ?? initialDraft.voicePersona,
          initialSupportLang,
        ) ??
        personaDefaultFor(initialSupportLang) ??
        translations.en.onboarding_persona_default_example,
      pauseMs:
        typeof initialDraft.pauseMs === "number" && initialDraft.pauseMs > 0
          ? initialDraft.pauseMs
          : DEFAULT_VOICE_PAUSE_MS,
      soundEnabled:
        typeof initialDraft.soundEnabled === "boolean"
          ? initialDraft.soundEnabled
          : true,
      soundVolume:
        typeof initialDraft.soundVolume === "number"
          ? initialDraft.soundVolume
          : 100,
      tutorVolume:
        typeof initialDraft.tutorVolume === "number"
          ? initialDraft.tutorVolume
          : DEFAULT_TUTOR_VOLUME,
      themeMode:
        initialDraft.themeMode === "dark" || initialDraft.themeMode === "light"
          ? initialDraft.themeMode
          : storedThemeMode === "dark"
          ? "dark"
          : "light",
    };
  }, [initialDraft, initialSupportLang, storedThemeMode]);

  const {
    level,
    tutorVoice,
    pauseMs,
    soundEnabled,
    soundVolume,
    tutorVolume,
    themeMode,
  } = defaults;
  const [targetLang, setTargetLang] = useState(defaults.targetLang);
  const [step, setStep] = useState(0);
  const goalsEnabled = astraGoalsEnabled();
  const stepCopy = goalOnboardingCopy(supportLang);
  const stepLabels = goalsEnabled
    ? [stepCopy.language, stepCopy.goals]
    : [stepCopy.language];
  const stepHeadingRef = useRef(null);
  const stepBodyRef = useRef(null);
  function goToStep(nextStep) {
    playOnboardingSound(selectSound);
    setStep(nextStep);
    stepBodyRef.current?.scrollTo({ top: 0 });
    requestAnimationFrame(() => stepHeadingRef.current?.focus());
  }
  const [learningGoals, setLearningGoals] = useState(
    initialDraft.learningGoals || {},
  );
  const [communityLanguageCode, setCommunityLanguageCode] = useState(null);
  const [voicePersona, setVoicePersona] = useState(defaults.voicePersona);
  const playSound = useSoundSettings((s) => s.playSound);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    syncDocumentLanguage(supportLang);
  }, [supportLang]);

  const playOnboardingSound = (sound) => {
    if (!soundEnabled) return;
    void playSound(sound);
  };

  // Japanese is visible for everyone (beta label applied in UI)
  const showJapanese = true;

  const supportLanguageOptions = useMemo(
    () => getSupportLanguageOptions({ ui, uiLang: supportLang }),
    [supportLang, ui],
  );

  const practiceLanguageOptions = useMemo(
    () =>
      getPracticeLanguageOptions({
        ui,
        uiLang: supportLang,
        showJapanese,
        includeSelectorHidden,
      }),
    [includeSelectorHidden, supportLang, ui, showJapanese],
  );

  const handlePracticeLanguageChange = (value) => {
    playOnboardingSound(selectSound);
    if (isCommunityResourceLanguage(value)) {
      setCommunityLanguageCode(value);
      return;
    }
    setTargetLang(normalizePracticeLanguage(value, DEFAULT_TARGET_LANGUAGE));
  };

  const handleSupportLanguageChange = (value) => {
    userPickedSupportLangRef.current = true;
    playOnboardingSound(selectSound);
    const normalized = normalizeSupportLanguage(
      value,
      DEFAULT_SUPPORT_LANGUAGE,
    );
    const nextPersona = personaForSupportLanguage(voicePersona, normalized);

    setSupportLang(normalized);
    if (nextPersona && nextPersona !== voicePersona) {
      setVoicePersona(nextPersona);
    }
  };

  useEffect(() => {
    const localizedDefault = personaDefaultFor(supportLang);
    const current = (voicePersona || "").trim();

    if (isDefaultPersonaValue(current)) {
      const next = localizedDefault || current;
      if (next && next !== current) {
        setVoicePersona(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportLang]);

  useEffect(() => {
    // Redirect to onboarding base path if not already there
    if (!location.pathname.startsWith(BASE_PATH)) {
      navigate(BASE_PATH, { replace: true });
    }
  }, [location.pathname, navigate]);

  async function handleStart() {
    if (typeof onComplete !== "function") {
      console.error("Onboarding.onComplete is not provided.");
      return;
    }
    setIsSaving(true);
    try {
      playOnboardingSound(submitActionSound);
      const payload = {
        level,
        supportLang,
        tutorVoice,
        tutorVoicePersona: voicePersona,
        targetLang,
        learningGoals,
        pauseMs,
        soundEnabled,
        soundVolume,
        tutorVolume,
        themeMode,
      };
      await Promise.resolve(onComplete(payload));
    } finally {
      setIsSaving(false);
    }
  }

  const supportOption =
    supportLanguageOptions.find((option) => option.value === supportLang) ||
    supportLanguageOptions[0];
  const selectedPracticeOption =
    practiceLanguageOptions.find((option) => option.value === targetLang) ||
    practiceLanguageOptions[0];
  return (
    <Box
      minH="100vh"
      bg="var(--app-page-bg)"
      color="var(--app-text-primary)"
      sx={{
        "@supports (height: 100dvh)": {
          minHeight: "100dvh",
        },
      }}
    >
      <Drawer
        isOpen={true}
        placement="bottom"
        onClose={() => {}}
        initialFocusRef={stepHeadingRef}
      >
        <DrawerOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <DrawerContent
          motionProps={nativeDrawerMotionProps}
          bg="var(--app-surface)"
          color="var(--app-text-primary)"
          borderTopRadius="24px"
          display="flex"
          flexDirection="column"
          h={{ base: "100vh", md: "min(760px, calc(100vh - 32px))" }}
          maxH={{ base: "100vh", md: "760px" }}
          overflow="hidden"
          sx={{
            "@supports (height: 100dvh)": {
              maxHeight: "100dvh",
              height: "100dvh",
              "@media screen and (min-width: 48em)": {
                height: "min(760px, calc(100dvh - 32px))",
              },
            },
          }}
        >
          <DrawerBody
            ref={stepBodyRef}
            px={6}
            pt="max(24px, env(safe-area-inset-top))"
            pb={4}
            flex="1"
            overflowY="auto"
          >
            <Box
              maxW="600px"
              mx="auto"
              w="100%"
              display="flex"
              flexDirection="column"
            >
              <VStack align="stretch" spacing={1} mb={4}>
                <HStack display="flex" alignItems="center" spacing={2.5}>
                  <Box flexShrink={0}>
                    <RandomCharacter notSoRandomCharacter={"24"} />
                  </Box>
                  <Text
                    as="h1"
                    ref={stepHeadingRef}
                    tabIndex={-1}
                    outline="none"
                    fontWeight="bold"
                    fontSize="2xl"
                  >
                    {ui.onboarding_title || "Welcome"}
                  </Text>
                </HStack>
                <Text opacity={0.85} fontSize="sm">
                  {ui.onboarding_subtitle}
                </Text>
              </VStack>

              {stepLabels.length > 1 && (
                <HStack
                  as="ol"
                  listStyleType="none"
                  w="100%"
                  spacing={3}
                  mb={5}
                  aria-label={ui.onboarding_title || "Onboarding steps"}
                >
                  {stepLabels.map((label, index) => {
                    const isActive = step === index;
                    const isCompleted = index < step;
                    return (
                      <Box
                        as="li"
                        key={label}
                        flex="1"
                        aria-current={isActive ? "step" : undefined}
                      >
                        <Box
                          as="button"
                          type="button"
                          w="100%"
                          textAlign="left"
                          onClick={() => goToStep(index)}
                          p={1}
                          bg="transparent"
                          border="none"
                          boxShadow="none"
                          cursor="pointer"
                          outline="none"
                          _hover={{
                            opacity: 0.85,
                          }}
                          _active={{
                            transform: "scale(0.99)",
                          }}
                          transition="opacity 0.2s ease"
                        >
                          <Box
                            position="relative"
                            h="7px"
                            borderRadius="full"
                            bg="var(--app-surface-muted)"
                            overflow="hidden"
                            mb={2.5}
                          >
                            <motion.div
                              style={{
                                height: "100%",
                                borderRadius: "9999px",
                                background:
                                  "linear-gradient(90deg, #22d3ee 0%, #2dd4bf 40%, #5eead4 75%, #67e8f9 100%)",
                                boxShadow: isActive
                                  ? "0 0 10px rgba(45, 212, 191, 0.45)"
                                  : "none",
                              }}
                              initial={false}
                              animate={{
                                width: index <= step ? "100%" : "0%",
                                opacity: index <= step ? 1 : 0.3,
                              }}
                              transition={{
                                duration: 0.38,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            />
                          </Box>

                          <HStack spacing={2} align="center">
                            <motion.div
                              animate={{
                                scale: isActive ? [0.85, 1.12, 1] : 1,
                              }}
                              transition={{
                                duration: 0.3,
                                ease: "easeOut",
                              }}
                            >
                              <Box
                                boxSize="20px"
                                borderRadius="full"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                fontSize="xs"
                                fontWeight="bold"
                                bg={
                                  isActive
                                    ? "#2dd4bf"
                                    : isCompleted
                                    ? "#06b6d4"
                                    : "var(--app-surface-muted)"
                                }
                                color={
                                  isActive || isCompleted
                                    ? "white"
                                    : "var(--app-text-muted)"
                                }
                                boxShadow="none"
                                transition="all 0.2s ease"
                              >
                                {isCompleted ? "✓" : index + 1}
                              </Box>
                            </motion.div>
                            <Text
                              fontSize="sm"
                              fontWeight={isActive ? "bold" : "medium"}
                              color={
                                isActive
                                  ? "var(--app-text-primary)"
                                  : isCompleted
                                  ? "var(--app-text-secondary)"
                                  : "var(--app-text-muted)"
                              }
                              transition="color 0.2s ease"
                            >
                              {label}
                            </Text>
                          </HStack>
                        </Box>
                      </Box>
                    );
                  })}
                </HStack>
              )}

              <Box
                display="flex"
                flexDirection="column"
                mb={{ base: 4, md: 5 }}
              >
                {step === 0 ? (
                  <VStack align="stretch" spacing={4} w="100%">
                    {/* Support Language */}
                    <Box
                      bg="gray.800"
                      p={3}
                      rounded="md"
                      display="flex"
                      flexDirection="column"
                    >
                      <Text fontSize="sm" fontWeight="semibold" mb={1}>
                        {ui.onboarding_support_language_title}
                      </Text>
                      <Text fontSize="xs" opacity={0.7} mb="12px">
                        {ui.onboarding_support_language_desc}
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
                          w="100%"
                          textAlign="left"
                          padding={5}
                          onClick={() => playOnboardingSound(selectSound)}
                        >
                          <HStack spacing={2}>
                            {supportOption.flag}
                            <Text as="span">{supportOption.label}</Text>
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
                            {ui.onboarding_support_menu_label || "Support:"}
                          </Box>
                          <MenuOptionGroup
                            type="radio"
                            value={supportLang}
                            onChange={handleSupportLanguageChange}
                          >
                            {supportLanguageOptions.map((option) => (
                              <MenuItemOption
                                key={option.value}
                                value={option.value}
                                padding={5}
                                pl={1}
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
                    </Box>

                    {/* Practice Language */}
                    <Box
                      bg="gray.800"
                      p={3}
                      rounded="md"
                      display="flex"
                      flexDirection="column"
                    >
                      <Text fontSize="sm" fontWeight="semibold" mb={1}>
                        {ui.onboarding_practice_language_title}
                      </Text>
                      <Text fontSize="xs" opacity={0.7} mb="12px">
                        {ui.onboarding_practice_language_desc}
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
                          w="100%"
                          textAlign="left"
                          title={ui.onboarding_practice_label_title}
                          padding={5}
                          onClick={() => playOnboardingSound(selectSound)}
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
                            {ui.onboarding_practice_menu_label || "Practice:"}
                          </Box>
                          <MenuOptionGroup
                            type="radio"
                            value={targetLang}
                            onChange={handlePracticeLanguageChange}
                          >
                            {practiceLanguageOptions.map((option) => (
                              <MenuItemOption
                                key={option.value}
                                value={option.value}
                                padding={5}
                                pl={1}
                              >
                                <div style={{ display: "inline-flex" }}>
                                  {option?.flag}&nbsp;
                                  {option.label}
                                </div>
                              </MenuItemOption>
                            ))}
                          </MenuOptionGroup>
                        </MenuList>
                      </Menu>
                    </Box>
                  </VStack>
                ) : (
                  <Box
                    bg="var(--app-surface-muted)"
                    p={{ base: 4, md: 5 }}
                    borderRadius="xl"
                  >
                    <LearningGoalField
                      lang={supportLang}
                      value={learningGoals[targetLang] || ""}
                      onChange={(value) =>
                        setLearningGoals((previous) => ({
                          ...previous,
                          [targetLang]: value,
                        }))
                      }
                      minH="140px"
                      rows={4}
                    />
                    <Text
                      mt={3}
                      fontSize="xs"
                      lineHeight="tall"
                      color="var(--app-text-secondary)"
                      opacity={0.88}
                    >
                      {stepCopy.hint
                        .split("{settingsIcon}")
                        .map((part, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && (
                              <SettingsIcon
                                aria-hidden="true"
                                boxSize="0.95em"
                                verticalAlign="-0.1em"
                              />
                            )}
                            {part}
                          </React.Fragment>
                        ))}
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          </DrawerBody>

          {/* Complete onboarding with the saved defaults for voice and effects. */}
          <Box
            px={6}
            pt={4}
            pb="max(24px, env(safe-area-inset-bottom))"
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
          >
            <HStack maxW="600px" mx="auto" w="100%" spacing={3}>
              {step > 0 && (
                <Button
                  size="lg"
                  variant="outline"
                  isDisabled={isSaving}
                  onClick={() => goToStep(step - 1)}
                >
                  {ui.onboarding_back || ui.onboarding_go_back || "Back"}
                </Button>
              )}
              <Button
                size="lg"
                colorScheme="teal"
                onClick={
                  step < stepLabels.length - 1
                    ? () => goToStep(step + 1)
                    : handleStart
                }
                isLoading={isSaving}
                loadingText={ui.common_saving}
                flex="1"
              >
                {step < stepLabels.length - 1
                  ? ui.onboarding_next || ui.onboarding_cta_next || "Next"
                  : ui.onboarding_cta_start}
              </Button>
            </HStack>
          </Box>
        </DrawerContent>
      </Drawer>
      <CommunityLanguageResourcesModal
        isOpen={Boolean(communityLanguageCode)}
        onClose={() => setCommunityLanguageCode(null)}
        languageCode={communityLanguageCode}
        appLanguage={supportLang}
      />
    </Box>
  );
}
