// src/components/Onboarding.jsx — first-run setup (with inline language switch)
import React, { useEffect, useState } from "react";
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
} from "@chakra-ui/react";
import { translations } from "../utils/translation";

export default function Onboarding({
  npub = "",
  onComplete,
  userLanguage = "en", // 'en' | 'es' initial UI language from App
  onAppLanguageChange = () => {}, // parent callback that persists to Firestore + store
}) {
  // Local UI language for this panel (instant switch)
  const [appLang, setAppLang] = useState(userLanguage === "es" ? "es" : "en");
  const ui = translations[appLang];

  // Form state mirrors progress shape for Firestore
  const [level, setLevel] = useState("beginner"); // 'beginner' | 'intermediate' | 'advanced'
  const [supportLang, setSupportLang] = useState("en"); // 'en' | 'bilingual' | 'es'
  const [voice, setVoice] = useState("alloy"); // GPT Realtime default voices
  const [targetLang, setTargetLang] = useState("es"); // 'nah' | 'es' | 'en'
  const [voicePersona, setVoicePersona] = useState(ui.DEFAULT_PERSONA);
  const [showTranslations, setShowTranslations] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const secondaryPref = supportLang === "es" ? "es" : "en";

  // Challenge text from translations (keeps DB/UI aligned)
  const CHALLENGE = {
    en: translations.en.onboarding_challenge_default,
    es: translations.es.onboarding_challenge_default,
  };

  useEffect(() => {
    setVoicePersona(ui.DEFAULT_PERSONA);
  }, [appLang]);
  // Inline language switch → call parent persister + update local UI
  const persistAppLanguage = (lang) => {
    const norm = lang === "es" ? "es" : "en";
    setAppLang(norm); // instant panel switch
    try {
      localStorage.setItem("appLanguage", norm); // helpful cache
    } catch {}
    try {
      onAppLanguageChange(norm); // ✅ parent writes to Firestore + store
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
        voice, // GPT Realtime voice id (alloy, ash, ballad, coral, echo, sage, shimmer, verse)
        voicePersona,
        targetLang,
        showTranslations,
        challenge: { ...CHALLENGE },
      };
      await Promise.resolve(onComplete(payload)); // App.jsx persists & flips onboarding
    } finally {
      setIsSaving(false);
    }
  }

  // UI text helpers
  const personaPlaceholder = ui.onboarding_persona_input_placeholder.replace(
    "{example}",
    ui.onboarding_persona_default_example
  );
  const toggleLabel = ui.onboarding_translations_toggle.replace(
    "{language}",
    ui[`language_${secondaryPref}`]
  );

  return (
    <Box minH="100vh" bg="gray.900" color="gray.100">
      <Drawer isOpen={true} placement="bottom" onClose={() => {}}>
        <DrawerOverlay bg="blackAlpha.700" />
        <DrawerContent bg="gray.900" color="gray.100" borderTopRadius="24px">
          <DrawerHeader pb={0}>
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

              {/* Inline language switch for the onboarding panel */}

              <HStack spacing={2} align="center">
                <Text
                  fontSize="sm"
                  color={userLanguage === "en" ? "teal.300" : "gray.400"}
                >
                  EN
                </Text>
                <Switch
                  colorScheme="teal"
                  isChecked={userLanguage === "es"}
                  onChange={() =>
                    persistAppLanguage(userLanguage === "en" ? "es" : "en")
                  }
                />
                <Text
                  fontSize="sm"
                  color={userLanguage === "es" ? "teal.300" : "gray.400"}
                >
                  ES
                </Text>
              </HStack>
            </HStack>
          </DrawerHeader>

          <DrawerBody pb={6}>
            <VStack align="stretch" spacing={4}>
              {/* Difficulty & Language */}
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
                      <option value="nah">{ui.onboarding_practice_nah}</option>
                      <option value="es">{ui.onboarding_practice_es}</option>
                      <option value="en">{ui.onboarding_practice_en}</option>
                    </Select>
                  </WrapItem>
                </Wrap>
              </Box>

              {/* Voice & Persona */}
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
                      <option value="alloy">{ui.onboarding_voice_alloy}</option>
                      <option value="ash">{ui.onboarding_voice_ash}</option>
                      <option value="ballad">
                        {ui.onboarding_voice_ballad}
                      </option>
                      <option value="coral">{ui.onboarding_voice_coral}</option>
                      <option value="echo">{ui.onboarding_voice_echo}</option>
                      <option value="sage">{ui.onboarding_voice_sage}</option>
                      <option value="shimmer">
                        {ui.onboarding_voice_shimmer}
                      </option>
                      <option value="verse">{ui.onboarding_voice_verse}</option>
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

              {/* First goal preview */}
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

              {/* Submit */}
              <Button
                size="lg"
                colorScheme="teal"
                onClick={handleStart}
                isLoading={isSaving}
                loadingText={ui.common_saving}
              >
                {ui.onboarding_cta_start}
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
