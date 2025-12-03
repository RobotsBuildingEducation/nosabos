import React from "react";
import { Box, HStack, VStack, Text, Button, Badge } from "@chakra-ui/react";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiLockLine,
  RiTrophyLine,
} from "react-icons/ri";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const CEFR_LEVEL_INFO = {
  A1: {
    name: { en: "Beginner", es: "Principiante" },
    color: "#3B82F6",
    gradient: "linear(135deg, #60A5FA, #3B82F6)",
    description: {
      en: "Basic survival language",
      es: "Lenguaje básico de supervivencia",
    },
  },
  A2: {
    name: { en: "Elementary", es: "Elemental" },
    color: "#8B5CF6",
    gradient: "linear(135deg, #A78BFA, #8B5CF6)",
    description: {
      en: "Simple everyday communication",
      es: "Comunicación cotidiana simple",
    },
  },
  B1: {
    name: { en: "Intermediate", es: "Intermedio" },
    color: "#A855F7",
    gradient: "linear(135deg, #C084FC, #A855F7)",
    description: {
      en: "Handle everyday situations",
      es: "Manejo de situaciones cotidianas",
    },
  },
  B2: {
    name: { en: "Upper Intermediate", es: "Intermedio Alto" },
    color: "#F97316",
    gradient: "linear(135deg, #FB923C, #F97316)",
    description: { en: "Complex discussions", es: "Discusiones complejas" },
  },
  C1: {
    name: { en: "Advanced", es: "Avanzado" },
    color: "#EF4444",
    gradient: "linear(135deg, #F87171, #EF4444)",
    description: {
      en: "Sophisticated language use",
      es: "Uso sofisticado del idioma",
    },
  },
  C2: {
    name: { en: "Mastery", es: "Maestría" },
    color: "#EC4899",
    gradient: "linear(135deg, #F472B6, #EC4899)",
    description: {
      en: "Near-native proficiency",
      es: "Competencia casi nativa",
    },
  },
};

export default function CEFRLevelNavigator({
  currentLevel,
  activeCEFRLevel,
  onLevelChange,
  levelProgress = 0,
  supportLang = "en",
  levelCompletionStatus = {},
}) {
  const currentLevelIndex = CEFR_LEVELS.indexOf(activeCEFRLevel);
  const hasPrevious = currentLevelIndex > 0;
  const hasNext = currentLevelIndex < CEFR_LEVELS.length - 1;

  // Check if next level is unlocked based on completion status
  const nextLevel = hasNext ? CEFR_LEVELS[currentLevelIndex + 1] : null;
  const previousLevel = hasPrevious ? CEFR_LEVELS[currentLevelIndex - 1] : null;

  // A level is unlocked if all previous levels are complete
  const isNextLevelUnlocked = nextLevel
    ? (() => {
        // Check all levels before the next level
        for (let i = 0; i < currentLevelIndex + 1; i++) {
          const level = CEFR_LEVELS[i];
          if (!levelCompletionStatus[level]?.isComplete) {
            return false;
          }
        }
        return true;
      })()
    : false;

  const levelInfo = CEFR_LEVEL_INFO[activeCEFRLevel];
  const isCurrentUserLevel = activeCEFRLevel === currentLevel;

  const handlePrevious = () => {
    if (hasPrevious && previousLevel) {
      onLevelChange(previousLevel);
    }
  };

  const handleNext = () => {
    if (hasNext && nextLevel && isNextLevelUnlocked) {
      onLevelChange(nextLevel);
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      w="100%"
      mb={6}
    >
      <VStack spacing={4} align="stretch">
        {/* Level Header */}
        <HStack justify="space-between" align="center">
          {/* Previous Level Button */}
          <Button
            leftIcon={<RiArrowLeftLine />}
            onClick={handlePrevious}
            isDisabled={!hasPrevious}
            variant="ghost"
            color="gray.400"
            _hover={{ bg: "whiteAlpha.100", color: "white" }}
            size="sm"
          >
            {hasPrevious ? previousLevel : ""}
          </Button>

          {/* Current Level Badge */}
          <VStack spacing={2} flex={1} align="center">
            <Badge
              px={6}
              py={3}
              borderRadius="16px"
              bgGradient={levelInfo.gradient}
              color="white"
              fontSize="2xl"
              fontWeight="black"
              boxShadow={`0 4px 14px ${levelInfo.color}40`}
            >
              {activeCEFRLevel}
            </Badge>
            <Text fontSize="lg" fontWeight="bold" color="white">
              {levelInfo.name[supportLang]}
            </Text>
            <Text fontSize="sm" color="gray.400" textAlign="center">
              {levelInfo.description[supportLang]}
            </Text>
          </VStack>

          {/* Next Level Button */}
          <Button
            rightIcon={
              isNextLevelUnlocked ? <RiArrowRightLine /> : <RiLockLine />
            }
            onClick={handleNext}
            isDisabled={!hasNext || !isNextLevelUnlocked}
            variant="ghost"
            color={isNextLevelUnlocked ? "gray.400" : "gray.600"}
            _hover={
              isNextLevelUnlocked
                ? { bg: "whiteAlpha.100", color: "white" }
                : {}
            }
            size="sm"
          >
            {hasNext ? nextLevel : ""}
          </Button>
        </HStack>

        {/* Completion Badge */}
        {levelProgress >= 100 && isCurrentUserLevel && (
          <MotionBox
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <HStack
              justify="center"
              p={3}
              bgGradient="linear(135deg, green.500, green.600)"
              borderRadius="lg"
              spacing={2}
            >
              <RiTrophyLine size={20} />
              <Text fontWeight="bold" fontSize="sm">
                {supportLang === "es"
                  ? "¡Nivel Completado!"
                  : "Level Completed!"}
              </Text>
            </HStack>
          </MotionBox>
        )}
      </VStack>
    </MotionBox>
  );
}
