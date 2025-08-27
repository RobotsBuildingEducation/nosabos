// Onboarding.jsx — first-run setup (one view, mirrors Settings UI)
import React, { useState } from "react";
import {
  Badge,
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
} from "@chakra-ui/react";

const DEFAULT_CHALLENGE = {
  en: "Make a polite request.",
  es: "Pide algo con cortesía.",
};

// Keep this aligned with App.jsx & VoiceChat.jsx defaults
const DEFAULT_PERSONA = "Like a sarcastic, semi-friendly toxica.";

export default function Onboarding({ npub = "", onComplete }) {
  // UI state mirrors the progress shape saved in Firestore
  const [level, setLevel] = useState("beginner"); // 'beginner' | 'intermediate' | 'advanced'
  const [supportLang, setSupportLang] = useState("en"); // 'en' | 'bilingual' | 'es'
  const [voice, setVoice] = useState("Leda"); // 'Leda' | 'Puck' | 'Kore' | 'Breeze' | 'Solemn'
  const [targetLang, setTargetLang] = useState("es"); // 'nah' | 'es'
  const [voicePersona, setVoicePersona] = useState(DEFAULT_PERSONA);
  const [showTranslations, setShowTranslations] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const secondaryPref = supportLang === "es" ? "es" : "en";

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
        showTranslations,
        challenge: { ...DEFAULT_CHALLENGE },
      };
      await Promise.resolve(onComplete(payload)); // App.jsx will persist and flip onboarding.completed
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Box minH="100vh" bg="gray.900" color="gray.100">
      <Drawer isOpen={true} placement="bottom" onClose={() => {}}>
        <DrawerOverlay bg="blackAlpha.700" />
        <DrawerContent bg="gray.900" color="gray.100" borderTopRadius="24px">
          <DrawerHeader pb={0}>
            <VStack align="stretch" spacing={1}>
              <Text fontWeight="bold" fontSize="lg">
                Welcome
              </Text>
              <Text opacity={0.85} fontSize="sm">
                Let’s set up your AI experience before you start.
              </Text>
              {/* {!!npub && (
                <HStack pt={1}>
                  <Badge colorScheme="purple" variant="subtle" maxW="100%">
                    ID: {npub}
                  </Badge>
                </HStack>
              )} */}
            </VStack>
          </DrawerHeader>

          <DrawerBody pb={6}>
            <VStack align="stretch" spacing={4}>
              {/* Difficulty & Language */}
              <Box bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" mb={2} opacity={0.85}>
                  Difficulty & Language Support
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
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
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
                      <option value="en">Support: English</option>
                      <option value="bilingual">Support: Bilingual</option>
                      <option value="es">Support: Spanish</option>
                    </Select>
                  </WrapItem>

                  <WrapItem>
                    <Select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      bg="gray.800"
                      size="md"
                      w="auto"
                      title="Practice language"
                    >
                      <option value="nah">Practice: Náhuatl</option>
                      <option value="es">Practice: Spanish</option>
                    </Select>
                  </WrapItem>
                </Wrap>
              </Box>

              {/* Voice & Persona */}
              <Box bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" mb={2} opacity={0.85}>
                  Voice & Personality
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
                      <option value="Leda">Leda</option>
                      <option value="Puck">Puck</option>
                      <option value="Kore">Kore</option>
                      <option value="Breeze">Breeze</option>
                      <option value="Solemn">Solemn</option>
                    </Select>
                  </WrapItem>
                </Wrap>

                <Input
                  value={voicePersona}
                  onChange={(e) => setVoicePersona(e.target.value)}
                  bg="gray.700"
                  placeholder={`e.g., ${DEFAULT_PERSONA}`}
                />
                <Text fontSize="xs" opacity={0.7} mt={1}>
                  This guides tone/style (keep it playful, not hurtful).
                </Text>
              </Box>

              {/* Translations toggle */}
              <HStack bg="gray.800" p={3} rounded="md" justify="space-between">
                <Text fontSize="sm" mr={2}>
                  Show {secondaryPref === "es" ? "Spanish" : "English"}{" "}
                  translation
                </Text>
                <Switch
                  isChecked={showTranslations}
                  onChange={(e) => setShowTranslations(e.target.checked)}
                />
              </HStack>

              {/* First goal preview */}
              <Box bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" opacity={0.8}>
                  First goal
                </Text>
                <Text mt={1} whiteSpace="pre-wrap">
                  🎯 {DEFAULT_CHALLENGE.en}
                </Text>
                <Text mt={1} opacity={0.9}>
                  ES: {DEFAULT_CHALLENGE.es}
                </Text>
              </Box>

              {/* Submit */}
              <Button
                size="lg"
                colorScheme="teal"
                onClick={handleStart}
                isLoading={isSaving}
                loadingText="Saving"
              >
                Start my session
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
