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

  const defaults = useMemo(() => {
    return {
      level: initialDraft.level || "beginner",
      supportLang: initialDraft.supportLang || "en",
      targetLang: initialDraft.targetLang || "es",
      voicePersona:
        initialDraft.voicePersona ||
        ui.DEFAULT_PERSONA ||
        translations.en.onboarding_persona_default_example,
      pauseMs:
        typeof initialDraft.pauseMs === "number" && initialDraft.pauseMs > 0
          ? initialDraft.pauseMs
          : 800,
    };
  }, [initialDraft, ui.DEFAULT_PERSONA]);

  const [level, setLevel] = useState(defaults.level);
  const [supportLang, setSupportLang] = useState(defaults.supportLang);
  const [targetLang, setTargetLang] = useState(defaults.targetLang);
  const [voicePersona, setVoicePersona] = useState(defaults.voicePersona);
  const [pauseMs, setPauseMs] = useState(defaults.pauseMs);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!voicePersona) {
      setVoicePersona(ui.DEFAULT_PERSONA || "");
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
      ? "Más corta = más sensible; más larga = te deja terminar de hablar."
      : "Shorter = more responsive; longer = gives you time to finish speaking.");

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
              </VStack>
            </Box>
          </DrawerHeader>

          <DrawerBody pb={6}>
            <Box maxW="600px" mx="auto" w="100%">
              <VStack align="stretch" spacing={4}>
                {/* Language Selection */}
                <Box bg="gray.800" p={3} rounded="md">
                  <Text fontSize="sm" mb={2} opacity={0.85}>
                    {ui.onboarding_section_difficulty_support}
                  </Text>
                  <Wrap spacing={2}>
                    <WrapItem>
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
                        >
                          {supportLang === "en" && ui.onboarding_support_en}
                          {supportLang === "bilingual" && ui.onboarding_support_bilingual}
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
                            <MenuItemOption value="bilingual">
                              {ui.onboarding_support_bilingual}
                            </MenuItemOption>
                            <MenuItemOption value="es">
                              {ui.onboarding_support_es}
                            </MenuItemOption>
                          </MenuOptionGroup>
                        </MenuList>
                      </Menu>
                    </WrapItem>

                    <WrapItem>
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
                    </WrapItem>
                  </Wrap>
                </Box>

                {/* Voice Personality */}
                <Box bg="gray.800" p={3} rounded="md">
                  <Text fontSize="sm" mb={2} opacity={0.85}>
                    {ui.onboarding_section_voice_persona}
                  </Text>
                  <Input
                    value={voicePersona}
                    onChange={(e) => setVoicePersona(e.target.value)}
                    bg="gray.700"
                    placeholder={personaPlaceholder}
                  />
                  <Text fontSize="xs" opacity={0.7} mt={1}>
                    {ui.onboarding_persona_help_text}
                  </Text>
                </Box>

                {/* Voice Pause Slider */}
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
