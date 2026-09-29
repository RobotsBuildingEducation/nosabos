import React from "react";
import { Box, HStack, VStack, Text, Button, Badge } from "@chakra-ui/react";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiLockLine,
  RiTrophyLine,
} from "react-icons/ri";
import { APP_SQUIRCLE_SHAPE } from "../theme";
import { translations } from "../utils/translation";
import { normalizeSupportLanguage } from "../constants/languages";
import { isMasterUnlockActive } from "../utils/masterUnlock";

// Get app language from localStorage (UI language setting)
const getAppLanguage = () => {
  if (typeof window !== "undefined") {
    return normalizeSupportLanguage(localStorage.getItem("appLanguage"));
  }
  return normalizeSupportLanguage();
};

// Translation helper for UI strings
const getTranslation = (key, params = {}, langOverride = null) => {
  const lang = normalizeSupportLanguage(langOverride || getAppLanguage());
  const dict = translations[lang] ?? translations.en;
  const raw = dict[key] || key;
  if (typeof raw !== "string") return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`,
  );
};

import { CEFR_LEVELS, CEFR_LEVEL_INFO } from "../utils/cefrLevelInfo";

export default function CEFRLevelNavigator({
  currentLevel,
  activeCEFRLevel,
  onLevelChange,
  levelProgress = 0,
  supportLang = "en",
  levelCompletionStatus = {},
}) {
  const resolvedSupportLang = normalizeSupportLanguage(supportLang);
  const currentLevelIndex = CEFR_LEVELS.indexOf(activeCEFRLevel);
  const hasPrevious = currentLevelIndex > 0;
  const hasNext = currentLevelIndex < CEFR_LEVELS.length - 1;

  // Check if next level is unlocked based on completion status
  const nextLevel = hasNext ? CEFR_LEVELS[currentLevelIndex + 1] : null;
  const previousLevel = hasPrevious ? CEFR_LEVELS[currentLevelIndex - 1] : null;

  const isTestUnlocked = isMasterUnlockActive();

  // A level is unlocked if:
  // 1. Test mode is active, OR
  // 2. The next level is at or below the user's current unlocked level
  //    (which already accounts for proficiency placement), OR
  // 3. All previous levels are complete
  const currentUnlockedIndex = CEFR_LEVELS.indexOf(currentLevel);
  const nextLevelIndex = nextLevel ? CEFR_LEVELS.indexOf(nextLevel) : -1;

  const isNextLevelUnlocked =
    isTestUnlocked ||
    (nextLevel
      ? nextLevelIndex <= currentUnlockedIndex ||
        (() => {
          // Check all levels before the next level
          for (let i = 0; i < currentLevelIndex + 1; i++) {
            const level = CEFR_LEVELS[i];
            if (!levelCompletionStatus[level]?.isComplete) {
              return false;
            }
          }
          return true;
        })()
      : false);

  const levelInfo = CEFR_LEVEL_INFO[activeCEFRLevel];
  const isCurrentUserLevel = activeCEFRLevel === currentLevel;
  const levelName =
    levelInfo.name[resolvedSupportLang] ||
    levelInfo.name[getAppLanguage()] ||
    levelInfo.name.en;
  const levelDescription =
    levelInfo.description[resolvedSupportLang] ||
    levelInfo.description[getAppLanguage()] ||
    levelInfo.description.en;

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

  const navButtonStyles = {
    variant: "outline",
    borderColor: "blue.300",
    borderWidth: "2px",
    color: "var(--app-text-primary)",
    bg: "var(--app-glass-bg-soft)",

    px: 4,
    py: 3,
    size: "sm",
    minW: "50px",
  };

  return (
    <Box w="100%" mb={6}>
      <VStack spacing={4} align="center">
        {/* Level Header */}
        <HStack justify="space-between" align="center">
          {/* Previous Level Button */}

          {/* Current Level Badge */}
          <VStack spacing={0} flex={1} align="center">
            <Badge
              px={4}
              py={2}
              borderRadius="16px"
              style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
              bg="var(--app-glass-bg)"
              bgGradient={`linear(135deg, ${levelInfo.color}20, ${levelInfo.color}10)`}
              backdropFilter="blur(10px)"
              border="2px solid"
              borderColor={`${levelInfo.color}55`}
              color="var(--app-text-primary)"
              fontSize="md"
              fontWeight="black"
              boxShadow={`0 3px 10px ${levelInfo.color}18, 0 2px 5px rgba(0, 0, 0, 0.08)`}
            >
              {levelInfo.displayLabel || activeCEFRLevel}
            </Badge>
            <Text
              fontSize="md"
              fontWeight="bold"
              color="var(--app-text-primary)"
              textAlign={"center"}
            >
              {levelName}
            </Text>
            <Text fontSize="xs" color="gray.400" textAlign="center">
              {levelDescription}
            </Text>
          </VStack>

          {/* Next Level Button */}
        </HStack>

        <HStack justifyContent={"center"}>
          {hasPrevious ? (
            <Button
              leftIcon={<RiArrowLeftLine />}
              onClick={handlePrevious}
              {...navButtonStyles}
            >
              {CEFR_LEVEL_INFO[previousLevel]?.displayLabel || previousLevel}
            </Button>
          ) : (
            <Box />
          )}
          {hasNext ? (
            <Button
              rightIcon={
                isNextLevelUnlocked ? <RiArrowRightLine /> : <RiLockLine />
              }
              onClick={handleNext}
              isDisabled={!isNextLevelUnlocked}
              {...navButtonStyles}
              opacity={isNextLevelUnlocked ? 1 : 0.6}
              cursor={isNextLevelUnlocked ? "pointer" : "not-allowed"}
            >
              {CEFR_LEVEL_INFO[nextLevel]?.displayLabel || nextLevel}
            </Button>
          ) : (
            <Box />
          )}
        </HStack>
        {/* Completion Badge */}
        {levelProgress >= 100 && isCurrentUserLevel && (
          <Box>
            <HStack
              justify="center"
              p={3}
              bgGradient="linear(135deg, green.500, green.600)"
              borderRadius="lg"
              spacing={2}
            >
              <RiTrophyLine size={20} />
              <Text fontWeight="bold" fontSize="sm">
                {getTranslation("cefr_level_completed", {}, resolvedSupportLang)}
              </Text>
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
