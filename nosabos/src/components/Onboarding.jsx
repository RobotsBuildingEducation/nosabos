// src/components/Onboarding.jsx
import React, { useEffect, useMemo, useState } from "react";
import { keyframes } from "@emotion/react";
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
  Switch,
  Text,
  VStack,
  Wrap,
  WrapItem,
  Spacer,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Menu,
  MenuButton,
  MenuList,
  MenuItemOption,
  MenuOptionGroup,
  useBreakpointValue,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { HiVolumeUp } from "react-icons/hi";
import submitActionSound from "../assets/submitaction.mp3";
import selectSound from "../assets/select.mp3";
import nextButtonSound from "../assets/nextbutton.mp3";
import useSoundSettings from "../hooks/useSoundSettings";
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
import RandomCharacter from "./RandomCharacter";
import ThemeModeField from "./ThemeModeField";
import { useThemeStore } from "../useThemeStore";

const BASE_PATH = "/onboarding";
const stepContentReveal = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

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
  return ["en", "es", "it", "fr", "ja"].some(
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

const STEPS = ["languages", "voice", "extra"];
const uiCopy = (lang, copy) =>
  copy[normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE)] || copy.en;

export default function Onboarding({
  onComplete,
  userLanguage = "en",
  initialDraft = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [step, setStep] = useState(0);

  const normalizedUserLang = normalizeSupportLanguage(
    userLanguage,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  const initialSupportLang = normalizeSupportLanguage(
    initialDraft.supportLang || normalizedUserLang,
    normalizedUserLang,
  );
  const [supportLang, setSupportLang] = useState(initialSupportLang);
  const ui = translations[supportLang] || translations.en;
  const storedThemeMode = useThemeStore((s) => s.themeMode);
  const syncThemeMode = useThemeStore((s) => s.syncThemeMode);

  const defaults = useMemo(() => {
    return {
      level: initialDraft.level || "beginner",
      supportLang: initialSupportLang,
      targetLang: normalizePracticeLanguage(
        initialDraft.targetLang,
        getDefaultTargetForSupport(initialSupportLang),
      ),
      voicePersona:
        personaForSupportLanguage(
          initialDraft.voicePersona,
          initialSupportLang,
        ) ??
        personaDefaultFor(initialSupportLang) ??
        translations.en.onboarding_persona_default_example,
      pauseMs:
        typeof initialDraft.pauseMs === "number" && initialDraft.pauseMs > 0
          ? initialDraft.pauseMs
          : 1200,
      soundEnabled:
        typeof initialDraft.soundEnabled === "boolean"
          ? initialDraft.soundEnabled
          : true,
      soundVolume:
        typeof initialDraft.soundVolume === "number"
          ? initialDraft.soundVolume
          : 40,
      themeMode:
        initialDraft.themeMode === "light"
          ? "light"
          : storedThemeMode === "light"
            ? "light"
            : "dark",
    };
  }, [initialDraft, initialSupportLang, storedThemeMode, ui.DEFAULT_PERSONA]);

  const [level, setLevel] = useState(defaults.level);
  const [targetLang, setTargetLang] = useState(defaults.targetLang);
  const [voicePersona, setVoicePersona] = useState(defaults.voicePersona);
  const [pauseMs, setPauseMs] = useState(defaults.pauseMs);
  const [soundEnabled, setSoundEnabled] = useState(defaults.soundEnabled);
  const [soundVolume, setSoundVolume] = useState(defaults.soundVolume);
  const [themeMode, setThemeMode] = useState(defaults.themeMode);
  const playSound = useSoundSettings((s) => s.playSound);
  const setGlobalVolume = useSoundSettings((s) => s.setVolume);
  const playSliderTick = useSoundSettings((s) => s.playSliderTick);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    syncThemeMode(themeMode);
  }, [syncThemeMode, themeMode]);

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
      }),
    [supportLang, ui, showJapanese],
  );

  const handleSupportLanguageChange = (value) => {
    playSound(selectSound);
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
      playSound(submitActionSound);
      const payload = {
        level,
        supportLang,
        voicePersona,
        targetLang,
        pauseMs,
        soundEnabled,
        soundVolume,
        themeMode,
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
    ui.onboarding_persona_default_example || "patient, encouraging, playful",
  );

  const VAD_LABEL =
    ui.ra_vad_label ||
    uiCopy(supportLang, {
      en: "Pause between replies",
      es: "Pausa entre turnos",
      it: "Pausa tra le risposte",
      fr: "Pause entre les reponses",
      ja: "返答の間のポーズ",
    });
  const VAD_HINT =
    ui.onboarding_vad_hint ||
    uiCopy(supportLang, {
      en: "Shorter = more responsive; longer = gives you time to finish speaking. 1.2 seconds is recommended for natural speech.",
      es: "Más corta = más sensible; más larga = te deja terminar de hablar. 1.2 segundos es lo recomendado para un habla natural.",
      it: "Più breve = più reattiva; più lunga = ti lascia finire di parlare. 1,2 secondi è consigliato per un parlato naturale.",
      fr: "Plus court = plus reactif ; plus long = te laisse finir de parler. 1,2 seconde est recommande pour une parole naturelle.",
      ja: "短いほど反応が速く、長いほど話し終える時間ができます。自然な会話には1.2秒がおすすめです。",
    });
  const pauseSeconds = (pauseMs / 1000).toFixed(1);
  const secondsLabel = uiCopy(supportLang, {
    en: "seconds",
    es: "segundos",
    it: "secondi",
    fr: "secondes",
    ja: "秒",
  });
  const supportOption =
    supportLanguageOptions.find((option) => option.value === supportLang) ||
    supportLanguageOptions[0];
  const selectedPracticeOption =
    practiceLanguageOptions.find((option) => option.value === targetLang) ||
    practiceLanguageOptions[0];
  const stepLabels = uiCopy(supportLang, {
    en: ["Languages", "Voice", "Effects"],
    es: ["Idiomas", "Voz", "Efectos"],
    it: ["Lingue", "Voce", "Effetti"],
    fr: ["Langues", "Voix", "Effets"],
    ja: ["言語", "音声", "効果"],
  });

  return (
    <Box
      minH="100vh"
      bg="gray.900"
      color="gray.100"
      sx={{
        "@supports (height: 100dvh)": {
          minHeight: "100dvh",
        },
      }}
    >
      <Drawer isOpen={true} placement="bottom" onClose={() => {}}>
        <DrawerOverlay bg="var(--app-overlay)" />
        <DrawerContent
          bg="gray.900"
          color="gray.100"
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
          <DrawerBody px={6} pt={6} pb={4} flex="1" overflowY="auto">
            <Box
              maxW="600px"
              mx="auto"
              w="100%"
              minH="100%"
              display="flex"
              flexDirection="column"
            >
              <VStack align="stretch" spacing={1}>
                <HStack display="flex" alignItems={"center"}>
                  <RandomCharacter notSoRandomCharacter={"24"} />
                  <Text fontWeight="bold" fontSize="lg">
                    {ui.onboarding_title}
                  </Text>
                </HStack>
                <Text opacity={0.85} fontSize="sm">
                  {ui.onboarding_subtitle}
                </Text>
              </VStack>

              {/* Step indicator */}
              <VStack
                align="stretch"
                spacing={2}
                mt={5}
                mb={5}
              >
                <HStack align="stretch" spacing={3}>
                  {STEPS.map((s, i) => {
                    const isComplete = i < step;
                    const isCurrent = i === step;
                    const isActive = isComplete || isCurrent;

                    return (
                      <Box key={s} flex={1} minW={0}>
                        <Box
                          h="8px"
                          borderRadius="full"
                          bg="var(--app-border)"
                          position="relative"
                          overflow="hidden"
                        >
                          <Box
                            position="absolute"
                            inset="0"
                            borderRadius="inherit"
                            bgGradient={
                              isCurrent
                                ? "linear(to-r, teal.200, blue.200)"
                                : "linear(to-r, teal.300, cyan.300)"
                            }
                            transform={isActive ? "scaleX(1)" : "scaleX(0)"}
                            transformOrigin="left center"
                            transition={`transform 0.38s cubic-bezier(0.22, 1, 0.36, 1) ${i * 80}ms, background 0.2s ease`}
                            boxShadow={
                              isCurrent
                                ? "0 0 16px rgba(125, 211, 252, 0.35)"
                                : "none"
                            }
                          />
                        </Box>
                        <Text
                          mt={2}
                          fontSize="xs"
                          fontWeight={isCurrent ? "semibold" : "medium"}
                          letterSpacing="0.08em"
                          textTransform="uppercase"
                          color={isCurrent ? "gray.100" : isComplete ? "gray.300" : "gray.500"}
                          transition="color 0.2s ease"
                        >
                          {stepLabels[i]}
                        </Text>
                      </Box>
                    );
                  })}
                </HStack>
              </VStack>

              <Box
                flex="1"
                minH={{ base: "240px", md: "280px" }}
                display="flex"
                flexDirection="column"
                justifyContent="center"
                mb={{ base: 4, md: 5 }}
                animation={`${stepContentReveal} 0.28s ease`}
                key={step}
              >
                <VStack align="stretch" spacing={4} w="100%">
                  {/* ── Step 1: Languages ── */}
                  {step === 0 && (
                    <>
                      {/* Support Language */}
                      <Box
                        bg="gray.800"
                        p={3}
                        rounded="md"
                        minH={{ base: "158px", md: "146px" }}
                        display="flex"
                        flexDirection="column"
                      >
                        <Text fontSize="sm" fontWeight="semibold" mb={1}>
                          {ui.onboarding_support_language_title}
                        </Text>
                        <Text
                          fontSize="xs"
                          opacity={0.7}
                          mb={3}
                          minH={{ base: "42px", md: "36px" }}
                        >
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
                            mt="auto"
                            onClick={() => playSound(selectSound)}
                          >
                            <HStack spacing={2}>
                              {supportOption.flag}
                              <Text as="span">{supportOption.label}</Text>
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
                        minH={{ base: "158px", md: "146px" }}
                        display="flex"
                        flexDirection="column"
                      >
                        <Text fontSize="sm" fontWeight="semibold" mb={1}>
                          {ui.onboarding_practice_language_title}
                        </Text>
                        <Text
                          fontSize="xs"
                          opacity={0.7}
                          mb={3}
                          minH={{ base: "42px", md: "36px" }}
                        >
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
                            mt="auto"
                            onClick={() => playSound(selectSound)}
                          >
                            <HStack spacing={2}>
                              {selectedPracticeOption?.flag}
                              <Text as="span">{selectedPracticeOption?.label}</Text>
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
                              onChange={(value) => {
                                playSound(selectSound);
                                setTargetLang(
                                  normalizePracticeLanguage(
                                    value,
                                    DEFAULT_TARGET_LANGUAGE,
                                  ),
                                );
                              }}
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
                    </>
                  )}

                  {/* ── Step 2: Voice ── */}
                  {step === 1 && (
                    <>
                      {/* Voice Personality */}
                      <Box bg="gray.800" p={3} rounded="md">
                        <Text fontSize="sm" fontWeight="semibold" mb={1}>
                          {ui.onboarding_section_voice_persona}
                        </Text>
                        <Text fontSize="xs" opacity={0.7} mb={3}>
                          {ui.onboarding_persona_help_text}
                        </Text>
                        <Input
                          value={voicePersona}
                          onChange={(e) => setVoicePersona(e.target.value)}
                          bg="gray.700"
                          placeholder={personaPlaceholder}
                        />
                      </Box>

                      {/* Voice Activity Pause Slider */}
                      <Box bg="gray.800" p={3} rounded="md">
                        <Text fontSize="sm" fontWeight="semibold" mb={1}>
                          {ui.onboarding_vad_title}
                        </Text>
                        <Text fontSize="xs" opacity={0.7} mb={3}>
                          {ui.onboarding_vad_explanation}
                        </Text>
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="sm">{VAD_LABEL}</Text>
                          <Text fontSize="sm" opacity={0.8}>
                            {pauseSeconds} {secondsLabel}
                          </Text>
                        </HStack>
                        <Slider
                          aria-label="onboarding-pause-slider"
                          min={200}
                          max={4000}
                          step={100}
                          value={pauseMs}
                          onChange={(val) => {
                            setPauseMs(val);
                            playSliderTick(val, 200, 4000);
                          }}
                        >
                          <SliderTrack bg="gray.700" h={3} borderRadius="full">
                            <SliderFilledTrack bg="linear-gradient(90deg, #3CB371, #5dade2)" />
                          </SliderTrack>
                          <SliderThumb boxSize={6} />
                        </Slider>
                      </Box>
                    </>
                  )}

                  {/* ── Step 3: Extra ── */}
                  {step === 2 && (
                    <>
                      <Box bg="gray.800" p={3} rounded="md">
                        <HStack justifyContent="space-between">
                          <Text fontSize="sm" fontWeight="semibold" color="var(--app-text-primary)">
                            {ui.sound_effects_label || "Sound effects"}
                          </Text>
                          <Switch
                            id="onboarding-sound-effects-switch"
                            isChecked={soundEnabled}
                            onChange={(e) => setSoundEnabled(e.target.checked)}
                          />
                        </HStack>
                        <Text fontSize="xs" opacity={0.6} mt={2}>
                          {soundEnabled
                            ? ui.sound_effects_enabled ||
                              "Sound effects are enabled."
                            : ui.sound_effects_disabled ||
                              "Sound effects are muted."}
                        </Text>
                        {soundEnabled && (
                          <HStack
                            mt={3}
                            spacing={4}
                            align="end"
                            w="100%"
                            flexWrap="wrap"
                          >
                            <Box flex="1" minW="240px">
                              <HStack justify="space-between" mb={2} mt={3}>
                                <Text fontSize="sm">
                                  {ui.sound_volume_label || "Volume"}
                                </Text>
                                <Text fontSize="sm" opacity={0.8}>
                                  {soundVolume}%
                                </Text>
                              </HStack>
                              <Slider
                                aria-label="onboarding-volume-slider"
                                min={0}
                                max={100}
                                step={5}
                                value={soundVolume}
                                onChange={(val) => {
                                  setSoundVolume(val);
                                  setGlobalVolume(val);
                                  playSliderTick(val, 0, 100);
                                }}
                              >
                                <SliderTrack
                                  bg="gray.700"
                                  h={4}
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
                              onClick={() => playSound(submitActionSound)}
                              mb={1}
                            >
                              {ui.test_sound || "Test sound"}
                            </Button>
                          </HStack>
                        )}
                      </Box>

                      <ThemeModeField
                        value={themeMode}
                        onChange={(nextMode) => {
                          playSound(selectSound);
                          setThemeMode(nextMode);
                        }}
                        t={ui}
                      />
                    </>
                  )}
                </VStack>
              </Box>
            </Box>
          </DrawerBody>

          {/* Navigation buttons */}
          <Box
            px={6}
            pt={4}
            pb={6}
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
          >
            <Box maxW="600px" mx="auto" w="100%">
              <HStack spacing={3}>
                {step > 0 && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      playSound(selectSound);
                      setStep((s) => s - 1);
                    }}
                    w="100%"
                  >
                    {uiCopy(supportLang, {
                      en: "Back",
                      es: "Atrás",
                      it: "Indietro",
                      fr: "Retour",
                      ja: "戻る",
                    })}
                  </Button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button
                    size="lg"
                    colorScheme="teal"
                    onClick={() => {
                      playSound(nextButtonSound);
                      setStep((s) => s + 1);
                    }}
                    w="100%"
                  >
                    {ui.onboarding_cta_next ||
                      uiCopy(supportLang, {
                        en: "Next",
                        es: "Siguiente",
                        it: "Avanti",
                        fr: "Suivant",
                        ja: "次へ",
                      })}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    colorScheme="teal"
                    onClick={handleStart}
                    isLoading={isSaving}
                    loadingText={ui.common_saving}
                    w="100%"
                  >
                    {ui.onboarding_cta_start}
                  </Button>
                )}
              </HStack>
            </Box>
          </Box>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
