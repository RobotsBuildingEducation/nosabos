// src/components/ConversationSettingsDrawer.jsx
import React, { useCallback } from "react";
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  Text,
  Textarea,
  VStack,
  Button,
  Badge,
} from "@chakra-ui/react";
import { FiChevronDown } from "react-icons/fi";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";

// CEFR level information (matches CEFR_LEVEL_INFO from FlashcardSkillTree)
const CEFR_LEVELS = [
  {
    level: "Pre-A1",
    name: { en: "Foundations", es: "Fundamentos" },
    description: {
      en: "First words and phrases",
      es: "Primeras palabras y frases",
    },
    color: "#8B5CF6",
  },
  {
    level: "A1",
    name: { en: "Beginner", es: "Principiante" },
    description: {
      en: "Basic survival language",
      es: "Lenguaje básico de supervivencia",
    },
    color: "#3B82F6",
  },
  {
    level: "A2",
    name: { en: "Elementary", es: "Elemental" },
    description: {
      en: "Simple everyday communication",
      es: "Comunicación cotidiana simple",
    },
    color: "#8B5CF6",
  },
  {
    level: "B1",
    name: { en: "Intermediate", es: "Intermedio" },
    description: {
      en: "Handle everyday situations",
      es: "Manejo de situaciones cotidianas",
    },
    color: "#A855F7",
  },
  {
    level: "B2",
    name: { en: "Upper Intermediate", es: "Intermedio Alto" },
    description: {
      en: "Complex discussions",
      es: "Discusiones complejas",
    },
    color: "#F97316",
  },
  {
    level: "C1",
    name: { en: "Advanced", es: "Avanzado" },
    description: {
      en: "Sophisticated language use",
      es: "Uso sofisticado del idioma",
    },
    color: "#EF4444",
  },
  {
    level: "C2",
    name: { en: "Mastery", es: "Maestría" },
    description: {
      en: "Near-native proficiency",
      es: "Competencia casi nativa",
    },
    color: "#EC4899",
  },
];

export default function ConversationSettingsDrawer({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  supportLang = "en",
}) {
  const lang = supportLang === "es" ? "es" : "en";
  const playSound = useSoundSettings((s) => s.playSound);

  const currentLevel =
    CEFR_LEVELS.find((l) => l.level === settings.proficiencyLevel) ||
    CEFR_LEVELS[0];

  const handleLevelChange = (level) => {
    playSound(selectSound);
    onSettingsChange({ ...settings, proficiencyLevel: level });
  };

  const handlePronunciationChange = (checked) => {
    playSound(selectSound);
    onSettingsChange({ ...settings, practicePronunciation: checked });
  };

  const handleSubjectChange = (e) => {
    onSettingsChange({ ...settings, conversationSubjects: e.target.value });
  };

  const handleSave = useCallback(() => {
    playSound(submitActionSound);
    onClose?.();
  }, [onClose, playSound]);

  const handleClose = useCallback(() => {
    playSound(selectSound);
    onClose?.();
  }, [onClose, playSound]);

  const ui = {
    en: {
      title: "Conversation Settings",
      proficiencyLabel: "Proficiency Level",
      proficiencyHint: "Set the difficulty level for conversation topics",
      pronunciationLabel: "Pronunciation Practice",
      pronunciationHint: "AI will help you improve pronunciation of words",
      subjectLabel: "Custom Topics",
      subjectHint:
        "Define subjects you want to practice (e.g., medical terms, business, travel)",
      subjectPlaceholder:
        "e.g., I'm a doctor and want to practice medical conversations with patients...",
      save: "Save",
      close: "Close",
    },
    es: {
      title: "Configuración de Conversación",
      proficiencyLabel: "Nivel de Competencia",
      proficiencyHint:
        "Establece el nivel de dificultad para los temas de conversación",
      pronunciationLabel: "Práctica de Pronunciación",
      pronunciationHint: "La IA te ayudará a mejorar la pronunciación",
      subjectLabel: "Temas Personalizados",
      subjectHint:
        "Define los temas que quieres practicar (ej: términos médicos, negocios, viajes)",
      subjectPlaceholder:
        "ej: Soy médico y quiero practicar conversaciones médicas con pacientes...",
      save: "Guardar",
      close: "Cerrar",
    },
  };

  const t = ui[lang];

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={handleClose}
      size="md"
      closeOnOverlayClick={false}
    >
      <DrawerOverlay bg="blackAlpha.600" />
      <DrawerContent
        bg="gray.900"
        color="gray.100"
        borderLeftRadius="24px"
        maxH="100vh"
        display="flex"
        flexDirection="column"
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
          onClick={handleClose}
        />
        <DrawerHeader pb={2} pr={12}>
          {t.title}
        </DrawerHeader>
        <DrawerBody pb={6} display="flex" flexDirection="column" flex={1}>
          <VStack align="stretch" spacing={5} flex={1}>
            {/* Proficiency Level Dropdown */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold" mb={1}>
                {t.proficiencyLabel}
              </FormLabel>
              <Text fontSize="xs" color="gray.400" mb={3}>
                {t.proficiencyHint}
              </Text>
              <Menu matchWidth onOpen={() => playSound(selectSound)}>
                <MenuButton
                  as={Button}
                  rightIcon={<FiChevronDown />}
                  w="100%"
                  bg="gray.800"
                  boxShadow="0 4px 0px black"
                  _active={{ bg: "gray.700" }}
                  textAlign="left"
                  fontWeight="normal"
                  h="auto"
                  py={3}
                  px={3}
                  whiteSpace="normal"
                  onClick={() => playSound(selectSound)}
                >
                  <HStack spacing={2} align="center" flex={1} minW={0}>
                    <Badge
                      px={2}
                      py={1}
                      borderRadius="md"
                      bg={currentLevel.color}
                      color="white"
                      fontSize="sm"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {currentLevel.level === "Pre-A1" ? "A0" : currentLevel.level}
                    </Badge>
                    <Box minW={0} flex={1}>
                      <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                        {currentLevel.name[lang]}
                      </Text>
                      <Text fontSize="xs" color="gray.400" noOfLines={1}>
                        {currentLevel.description[lang]}
                      </Text>
                    </Box>
                  </HStack>
                </MenuButton>
                <MenuList
                  bg="gray.800"
                  borderColor="gray.700"
                  maxH="300px"
                  overflowY="auto"
                >
                  {CEFR_LEVELS.map((level) => (
                    <MenuItem
                      key={level.level}
                      onClick={() => handleLevelChange(level.level)}
                      bg={
                        settings.proficiencyLevel === level.level
                          ? "gray.700"
                          : "transparent"
                      }
                      _hover={{ bg: "gray.700" }}
                      py={3}
                    >
                      <HStack spacing={2} w="100%" align="center">
                        <Badge
                          px={2}
                          py={1}
                          borderRadius="md"
                          bg={level.color}
                          color="white"
                          fontSize="sm"
                          fontWeight="bold"
                          flexShrink={0}
                        >
                          {level.level === "Pre-A1" ? "A0" : level.level}
                        </Badge>
                        <Box minW={0} flex={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {level.name[lang]}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {level.description[lang]}
                          </Text>
                        </Box>
                      </HStack>
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </FormControl>

            {/* Pronunciation Practice Switch */}
            <FormControl>
              <HStack justify="space-between" align="center">
                <Box>
                  <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>
                    {t.pronunciationLabel}
                  </FormLabel>
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    {t.pronunciationHint}
                  </Text>
                </Box>
                <Switch
                  colorScheme="cyan"
                  isChecked={settings.practicePronunciation}
                  onChange={(e) => handlePronunciationChange(e.target.checked)}
                />
              </HStack>
            </FormControl>

            {/* Subject Selector */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold" mb={1}>
                {t.subjectLabel}
              </FormLabel>
              <Text fontSize="xs" color="gray.400" mb={3}>
                {t.subjectHint}
              </Text>
              <Textarea
                value={settings.conversationSubjects || ""}
                onChange={handleSubjectChange}
                placeholder={t.subjectPlaceholder}
                bg="gray.800"
                borderColor="gray.700"
                _hover={{ borderColor: "gray.600" }}
                _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                resize="vertical"
                minH="120px"
                fontSize="16px"
              />
            </FormControl>

            {/* Save/Close Buttons */}
            <HStack spacing={3} mt="auto">
              <Button
                variant="outline"
                colorScheme="gray"
                onClick={handleClose}
                size="lg"
                flex={1}
              >
                {t.close}
              </Button>
              <Button
                colorScheme="cyan"
                onClick={handleSave}
                size="lg"
                flex={1}
              >
                {t.save}
              </Button>
            </HStack>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// Export CEFR_LEVELS for use in other components
export { CEFR_LEVELS };
