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
import useSoundSettings from "../hooks/useSoundSettings";
import { useLocation, useNavigate } from "react-router-dom";

import { translations } from "../utils/translation";

const BASE_PATH = "/onboarding";

const personaDefaultFor = (lang) =>
  translations?.[lang]?.DEFAULT_PERSONA ||
  translations?.[lang]?.onboarding_persona_default_example ||
  translations?.en?.onboarding_persona_default_example ||
  "";

export default function Onboarding({
  onComplete,
  userLanguage = "en",
  initialDraft = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const normalizedUserLang = userLanguage === "es" ? "es" : "en";
  const initialSupportLang = initialDraft.supportLang || normalizedUserLang;
  const [supportLang, setSupportLang] = useState(initialSupportLang);
  const ui = translations[supportLang] || translations.en;

  const defaults = useMemo(() => {
    return {
      level: initialDraft.level || "beginner",
      supportLang: initialSupportLang,
      targetLang:
        initialDraft.targetLang || (initialSupportLang === "es" ? "en" : "es"),
      voicePersona:
        initialDraft.voicePersona ||
        personaDefaultFor(initialSupportLang) ||
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
    };
  }, [initialDraft, initialSupportLang, ui.DEFAULT_PERSONA]);

  const [level, setLevel] = useState(defaults.level);
  const [targetLang, setTargetLang] = useState(defaults.targetLang);
  const [voicePersona, setVoicePersona] = useState(defaults.voicePersona);
  const [pauseMs, setPauseMs] = useState(defaults.pauseMs);
  const [soundEnabled, setSoundEnabled] = useState(defaults.soundEnabled);
  const [soundVolume, setSoundVolume] = useState(defaults.soundVolume);
  const playSound = useSoundSettings((s) => s.playSound);
  const setGlobalVolume = useSoundSettings((s) => s.setVolume);

  const [isSaving, setIsSaving] = useState(false);

  // Japanese is visible for everyone (beta label applied in UI)
  const showJapanese = true;

  const practiceLanguageOptions = useMemo(() => {
    const collator = new Intl.Collator(supportLang === "es" ? "es" : "en");
    const options = [
      { value: "nl", label: ui.onboarding_practice_nl, beta: false },
      { value: "en", label: ui.onboarding_practice_en, beta: false },
      { value: "fr", label: ui.onboarding_practice_fr, beta: false },
      { value: "de", label: ui.onboarding_practice_de, beta: false },
      { value: "it", label: ui.onboarding_practice_it, beta: false },
      { value: "nah", label: ui.onboarding_practice_nah, beta: false },
      { value: "pt", label: ui.onboarding_practice_pt, beta: false },
      { value: "es", label: ui.onboarding_practice_es, beta: false },
      { value: "el", label: ui.onboarding_practice_el, beta: true },
      {
        value: "ja",
        label: ui.onboarding_practice_ja,
        beta: true,
        hidden: !showJapanese,
      },
      { value: "ru", label: ui.onboarding_practice_ru, beta: true },
    ];

    const visible = options.filter((option) => !option.hidden);
    const stable = visible
      .filter((option) => !option.beta)
      .sort((a, b) => collator.compare(a.label, b.label));
    const beta = visible
      .filter((option) => option.beta)
      .sort((a, b) => collator.compare(a.label, b.label));

    return [...stable, ...beta];
  }, [supportLang, ui, showJapanese]);

  useEffect(() => {
    const localizedDefault = personaDefaultFor(supportLang);
    const enDefault = personaDefaultFor("en");
    const esDefault = personaDefaultFor("es");
    const current = (voicePersona || "").trim();

    if (!current || current === enDefault || current === esDefault) {
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

  const VAD_LABEL =
    ui.ra_vad_label ||
    (supportLang === "es" ? "Pausa entre turnos" : "Pause between replies");
  const VAD_HINT =
    ui.onboarding_vad_hint ||
    (supportLang === "es"
      ? "Más corta = más sensible; más larga = te deja terminar de hablar. 1.2 segundos es lo recomendado para un habla natural."
      : "Shorter = more responsive; longer = gives you time to finish speaking. 1.2 seconds is recommended for natural speech.");
  const pauseSeconds = (pauseMs / 1000).toFixed(1);
  const secondsLabel = supportLang === "es" ? "segundos" : "seconds";

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
        <DrawerOverlay bg="blackAlpha.700" />
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
          <DrawerHeader pb={4}>
            <Box maxW="600px" mx="auto" w="100%">
              <VStack align="stretch" spacing={1}>
                <Text fontWeight="bold" fontSize="lg">
                  {ui.onboarding_title}
                </Text>
                <Text opacity={0.85} fontSize="sm">
                  {ui.onboarding_subtitle}
                </Text>
              </VStack>
            </Box>
          </DrawerHeader>

          <DrawerBody pb={6}>
            <Box maxW="600px" mx="auto" w="100%">
              <VStack align="stretch" spacing={4}>
                {/* Support Language */}
                <Box bg="gray.800" p={3} rounded="md">
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>
                    {ui.onboarding_support_language_title}
                  </Text>
                  <Text fontSize="xs" opacity={0.7} mb={3}>
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
                    >
                      {supportLang === "en" && ui.onboarding_support_en}
                      {supportLang === "es" && ui.onboarding_support_es}
                    </MenuButton>
                    <MenuList borderColor="gray.700" bg="gray.900">
                      <MenuOptionGroup
                        type="radio"
                        value={supportLang}
                        onChange={(value) => setSupportLang(value)}
                      >
                        <MenuItemOption value="en">
                          {ui.onboarding_support_en}
                        </MenuItemOption>
                        <MenuItemOption value="es">
                          {ui.onboarding_support_es}
                        </MenuItemOption>
                      </MenuOptionGroup>
                    </MenuList>
                  </Menu>
                </Box>

                {/* Practice Language */}
                <Box bg="gray.800" p={3} rounded="md">
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>
                    {ui.onboarding_practice_language_title}
                  </Text>
                  <Text fontSize="xs" opacity={0.7} mb={3}>
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
                    >
                      {targetLang === "nl" && ui.onboarding_practice_nl}
                      {targetLang === "en" && ui.onboarding_practice_en}
                      {targetLang === "fr" && ui.onboarding_practice_fr}
                      {targetLang === "it" && ui.onboarding_practice_it}
                      {targetLang === "ja" && (
                        <>{ui.onboarding_practice_ja} (beta)</>
                      )}
                      {targetLang === "nah" && ui.onboarding_practice_nah}
                      {targetLang === "pt" && ui.onboarding_practice_pt}
                      {targetLang === "es" && ui.onboarding_practice_es}
                      {targetLang === "ru" && (
                        <>{ui.onboarding_practice_ru} (beta)</>
                      )}
                      {targetLang === "de" && <>{ui.onboarding_practice_de}</>}
                      {targetLang === "el" && (
                        <>{ui.onboarding_practice_el} (beta)</>
                      )}
                    </MenuButton>
                    <MenuList borderColor="gray.700" bg="gray.900">
                      <MenuOptionGroup
                        type="radio"
                        value={targetLang}
                        onChange={(value) => setTargetLang(value)}
                      >
                        {practiceLanguageOptions.map((option) => (
                          <MenuItemOption
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                            {option.beta ? " (beta)" : ""}
                          </MenuItemOption>
                        ))}
                      </MenuOptionGroup>
                    </MenuList>
                  </Menu>
                </Box>

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
                    onChange={(val) => setPauseMs(val)}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <Text fontSize="xs" opacity={0.6} mt={2}>
                    {VAD_HINT}
                  </Text>
                </Box>

                {/* Sound Effects toggle */}
                <Box bg="gray.800" p={3} rounded="md">
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm">
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
                      ? ui.sound_effects_enabled || "Sound effects are enabled."
                      : ui.sound_effects_disabled || "Sound effects are muted."}
                  </Text>
                  {soundEnabled && !isMobile && (
                    <HStack mt={3} spacing={3} align="center">
                      <Box w="50%">
                        <HStack justify="space-between" mb={2}>
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
                          }}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                      </Box>
                      <Button
                        leftIcon={<HiVolumeUp />}
                        size="sm"
                        variant="outline"
                        onClick={() => playSound(submitActionSound)}
                      >
                        {ui.test_sound || "Test sound"}
                      </Button>
                    </HStack>
                  )}
                </Box>
              </VStack>
            </Box>
          </DrawerBody>

          <Box
            px={6}
            pb={6}
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
          >
            <Box maxW="600px" mx="auto" w="100%">
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
            </Box>
          </Box>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
