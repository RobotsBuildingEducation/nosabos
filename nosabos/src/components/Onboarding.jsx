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
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
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
  onAppLanguageChange = () => {},
  initialDraft = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [appLang, setAppLang] = useState(userLanguage === "es" ? "es" : "en");
  const ui = translations[appLang] || translations.en;
  const englishLabel = ui.language_en || translations.en.language_en;
  const spanishLabel = ui.language_es || translations.en.language_es;

  const defaults = useMemo(() => {
    return {
      level: initialDraft.level || "beginner",
      supportLang: initialDraft.supportLang || "en",
      targetLang: initialDraft.targetLang || "es",
      voicePersona:
        initialDraft.voicePersona ||
        personaDefaultFor(appLang) ||
        translations.en.onboarding_persona_default_example,
      pauseMs:
        typeof initialDraft.pauseMs === "number" && initialDraft.pauseMs > 0
          ? initialDraft.pauseMs
          : 1200,
    };
  }, [initialDraft, ui.DEFAULT_PERSONA]);

  const [level, setLevel] = useState(defaults.level);
  const [supportLang, setSupportLang] = useState(defaults.supportLang);
  const [targetLang, setTargetLang] = useState(defaults.targetLang);
  const [voicePersona, setVoicePersona] = useState(defaults.voicePersona);
  const [pauseMs, setPauseMs] = useState(defaults.pauseMs);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const localizedDefault = personaDefaultFor(appLang);
    const enDefault = personaDefaultFor("en");
    const esDefault = personaDefaultFor("es");
    const current = (voicePersona || "").trim();

    if (
      !current ||
      current === enDefault ||
      current === esDefault
    ) {
      const next = localizedDefault || current;
      if (next && next !== current) {
        setVoicePersona(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appLang]);

  useEffect(() => {
    // Redirect to onboarding base path if not already there
    if (!location.pathname.startsWith(BASE_PATH)) {
      navigate(BASE_PATH, { replace: true });
    }
  }, [location.pathname, navigate]);

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
        voicePersona,
        targetLang,
        pauseMs,
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
    (appLang === "es" ? "Pausa entre turnos" : "Pause between replies");
  const VAD_HINT =
    ui.onboarding_vad_hint ||
    (appLang === "es"
      ? "Más corta = más sensible; más larga = te deja terminar de hablar. 1.2 segundos es lo recomendado para un habla natural."
      : "Shorter = more responsive; longer = gives you time to finish speaking. 1.2 seconds is recommended for natural speech.");
  const pauseSeconds = (pauseMs / 1000).toFixed(1);
  const secondsLabel = appLang === "es" ? "segundos" : "seconds";

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
                {/* Application Language - First Item */}
                <Box bg="gray.800" p={3} rounded="md">
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>
                    {ui.onboarding_app_language_title}
                  </Text>
                  <Text fontSize="xs" opacity={0.7} mb={3}>
                    {ui.onboarding_app_language_desc}
                  </Text>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      variant={appLang === "en" ? "solid" : "outline"}
                      colorScheme={appLang === "en" ? "teal" : "gray"}
                      onClick={() => persistAppLanguage("en")}
                      borderColor="gray.600"
                    >
                      {englishLabel}
                    </Button>
                    <Button
                      size="sm"
                      variant={appLang === "es" ? "solid" : "outline"}
                      colorScheme={appLang === "es" ? "teal" : "gray"}
                      onClick={() => persistAppLanguage("es")}
                      borderColor="gray.600"
                    >
                      {spanishLabel}
                    </Button>
                  </HStack>
                </Box>

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
                      {targetLang === "nah" && ui.onboarding_practice_nah}
                      {targetLang === "es" && ui.onboarding_practice_es}
                      {targetLang === "pt" && ui.onboarding_practice_pt}
                      {targetLang === "fr" && ui.onboarding_practice_fr}
                      {targetLang === "it" && ui.onboarding_practice_it}
                      {targetLang === "en" && ui.onboarding_practice_en}
                    </MenuButton>
                    <MenuList borderColor="gray.700" bg="gray.900">
                      <MenuOptionGroup
                        type="radio"
                        value={targetLang}
                        onChange={(value) => setTargetLang(value)}
                      >
                        <MenuItemOption value="nah">
                          {ui.onboarding_practice_nah}
                        </MenuItemOption>
                        <MenuItemOption value="es">
                          {ui.onboarding_practice_es}
                        </MenuItemOption>
                        <MenuItemOption value="pt">
                          {ui.onboarding_practice_pt}
                        </MenuItemOption>
                        <MenuItemOption value="fr">
                          {ui.onboarding_practice_fr}
                        </MenuItemOption>
                        <MenuItemOption value="it">
                          {ui.onboarding_practice_it}
                        </MenuItemOption>
                        <MenuItemOption value="en">
                          {ui.onboarding_practice_en}
                        </MenuItemOption>
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
