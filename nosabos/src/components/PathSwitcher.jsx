import React from "react";
import { HStack, Button, Box, Text } from "@chakra-ui/react";
import { RiRoadMapLine, RiFileList3Line } from "react-icons/ri";
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
  ];

  return (
    <Box
      mb={6}
      display="flex"
      justifyContent="center"
      width="100%"
    >
      <HStack
        spacing={2}
        bgGradient="linear(135deg, whiteAlpha.50, whiteAlpha.30)"
        backdropFilter="blur(10px)"
        p={1.5}
        borderRadius="full"
        border="1px solid"
        borderColor="whiteAlpha.200"
        boxShadow="0 4px 16px rgba(0, 0, 0, 0.3)"
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
              bg={isSelected ? "whiteAlpha.200" : "transparent"}
              color={isSelected ? "white" : "gray.400"}
              fontWeight={isSelected ? "bold" : "medium"}
              border={isSelected ? "1px solid" : "none"}
              borderColor={isSelected ? "whiteAlpha.300" : "transparent"}
              boxShadow={
                isSelected ? "0 2px 12px rgba(255, 255, 255, 0.15)" : "none"
              }
              _hover={{
                bg: isSelected ? "whiteAlpha.250" : "whiteAlpha.100",
                color: "white",
              }}
              _active={{
                bg: "whiteAlpha.300",
                color: "white",
                borderColor: "whiteAlpha.400",
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
