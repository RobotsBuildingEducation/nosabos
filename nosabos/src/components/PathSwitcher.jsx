import React from "react";
import { HStack, Button, Box, Text } from "@chakra-ui/react";
import { RiRoadMapLine, RiFileList3Line, RiChat3Line } from "react-icons/ri";
import { motion } from "framer-motion";
import { translations } from "../utils/translation";

const MotionButton = motion(Button);

// Get app language from localStorage (UI language setting)
const getAppLanguage = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("appLanguage") || "en";
  }
  return "en";
};

// Translation helper for UI strings
const getTranslation = (key) => {
  const lang = getAppLanguage();
  const dict = translations[lang] || translations.en;
  return dict[key] || key;
};

export default function PathSwitcher({ selectedMode, onModeChange }) {
  const modes = [
    {
      id: "path",
      label: getTranslation("path_switcher_path"),
      icon: RiRoadMapLine,
      description: "Learning path",
    },
    {
      id: "flashcards",
      label: getTranslation("path_switcher_flashcards"),
      icon: RiFileList3Line,
      description: "Practice cards",
    },
    {
      id: "conversations",
      label: getTranslation("path_switcher_conversations"),
      icon: RiChat3Line,
      description: "Free conversation",
    },
  ];

  return (
    <Box mb={6} display="flex" justifyContent="center" width="100%">
      <HStack
        spacing={2}
        bg="var(--app-glass-bg-soft)"
        backdropFilter="blur(10px)"
        p={1.5}
        borderRadius="full"
        border="1px solid"
        borderColor="var(--app-border)"
        boxShadow="var(--app-shadow-soft)"
        display="inline-flex"
      >
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const Icon = mode.icon;

          return (
            <MotionButton
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              size="md"
              borderRadius="full"
              px={6}
              py={2}
              h="auto"
              bg={isSelected ? "var(--app-surface-muted)" : "transparent"}
              color={isSelected ? "var(--app-text-primary)" : "var(--app-text-muted)"}
              fontWeight={isSelected ? "bold" : "medium"}
              border={isSelected ? "1px solid" : "none"}
              borderColor={isSelected ? "var(--app-border-strong)" : "transparent"}
              boxShadow={
                isSelected ? "var(--app-shadow-soft)" : "none"
              }
              _hover={{
                bg: isSelected
                  ? "var(--app-surface-muted)"
                  : "var(--app-glass-bg-soft)",
                color: "var(--app-text-primary)",
              }}
              _active={{
                bg: "var(--app-surface-muted)",
                color: "var(--app-text-primary)",
                borderColor: "var(--app-border-strong)",
                transform: "scale(0.97)",
              }}
              transition="background 0.1s, color 0.1s, border-color 0.1s"
              whileHover={{ scale: 1.02 }}
              whileTap={{
                scale: 0.97,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              }}
            >
              <HStack spacing={2}>
                <Icon size={18} />
                <Text fontSize="sm">{mode.label}</Text>
              </HStack>
            </MotionButton>
          );
        })}
      </HStack>
    </Box>
  );
}
