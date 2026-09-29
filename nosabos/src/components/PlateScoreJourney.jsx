import React from "react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import {
  FiBookOpen, FiCalendar, FiCompass, FiHeadphones, FiHeart,
  FiHome, FiMapPin, FiMessageCircle, FiPenTool, FiStar,
  FiUsers, FiBriefcase, FiZap, FiCoffee,
} from "react-icons/fi";
import { APP_DAILY_QUEST_RADIUS, APP_SQUIRCLE_SHAPE } from "../theme";
import { LANGUAGE_FALLBACK_LABELS } from "../constants/languages";
import { useThemeStore } from "../useThemeStore";
import { practiceLevelForScore } from "../utils/performanceEloModel";
import { getScoreMilestoneProgress, getScoreMilestoneWindow } from "../utils/scoreMilestones";
import { ImmersionTasksContent } from "./ImmersionTasksContent";

const ICONS = {
  spark: FiZap, voice: FiMessageCircle, heart: FiHeart, people: FiUsers,
  ear: FiHeadphones, book: FiBookOpen, calendar: FiCalendar, food: FiCoffee,
  home: FiHome, note: FiPenTool, map: FiMapPin, story: FiBookOpen,
  compass: FiCompass, work: FiBriefcase, star: FiStar,
};
const COPY = {
  en: { score: "Score" },
  es: { score: "Puntuación" },
  pt: { score: "Pontuação" },
  fr: { score: "Score" },
  de: { score: "Punktzahl" },
  it: { score: "Punteggio" },
  ja: { score: "スコア" },
  zh: { score: "分数" },
};

function displayLanguage(targetLang, appLanguage) {
  try {
    const name = new Intl.DisplayNames([appLanguage], { type: "language" }).of(targetLang);
    if (name && name !== targetLang) return name;
  } catch { /* use the app's language label */ }
  return LANGUAGE_FALLBACK_LABELS[targetLang] || targetLang;
}

export default function PlateScoreJourney({ score, targetLang = "es", appLanguage = "en", immersion = null, petType = "ghost" }) {
  const isLightTheme = useThemeStore((s) => s.themeMode) === "light";
  const progress = getScoreMilestoneProgress(score);
  const visibleMilestones = getScoreMilestoneWindow(score);
  const copy = COPY[appLanguage] || COPY.en;
  const language = displayLanguage(targetLang, appLanguage);

  return (
    <Box
      as="section"
      aria-label={`${language} ${copy.score}`}
      bg="var(--app-glass-bg-soft)"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="var(--app-border)"
      borderRadius={APP_DAILY_QUEST_RADIUS}
      style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
      boxShadow="var(--app-shadow-soft)"
      px={{ base: 4, md: 5 }}
      py={4}
      overflow="hidden"
    >
      <HStack align="start" justify="space-between" spacing={3}>
        <VStack align="start" spacing={0} minW={0}>
          <Text fontSize="xs" fontWeight="bold" color="var(--app-text-secondary)" letterSpacing="0.08em" textTransform="uppercase">
            {language} {copy.score}
          </Text>
          <HStack spacing={3} align="baseline">
            <Text fontSize={{ base: "56px", md: "64px" }} lineHeight="1" fontWeight="black" color="var(--app-text-primary)" fontVariantNumeric="tabular-nums">
              {progress.score.toLocaleString(appLanguage)}
            </Text>
          </HStack>
        </VStack>
        <Text fontSize="sm" fontWeight="bold" color="var(--app-text-secondary)" pt={1}>
          {practiceLevelForScore(progress.score)}
        </Text>
      </HStack>

      <Box position="relative" mt={5} px={4} py={2}>
        <Box position="relative" w="100%">
          <Box position="absolute" top="20px" left="18px" right="18px" h="4px" bg="var(--app-border-strong)" borderRadius="full" />
          <HStack align="start" spacing={2} position="relative" zIndex={1}>
            {visibleMilestones.map((item, index) => {
              const reached = item.score <= progress.score;
              const current = item.score === (progress.current?.score || progress.next?.score);
              const Icon = ICONS[item.icon] || FiStar;
              const title = item[appLanguage] || item.en;
              const alignment = index === 0 ? "start" : index === visibleMilestones.length - 1 ? "end" : "center";
              return (
                <VStack key={item.score} data-current={current} as="article" align={alignment} spacing={1.5} flex="1" minW={0}>
                  <Box w="42px" h="42px" display="flex" alignItems="center" justifyContent="center" borderRadius="full" border="2px solid" borderColor={reached ? (isLightTheme ? "#0891b2" : "#67e8f9") : "var(--app-border-strong)"} bg={reached ? (isLightTheme ? "#d8f4f6" : "#164e63") : "var(--app-surface-muted)"} color={reached ? (isLightTheme ? "#0e7490" : "#a5f3fc") : "var(--app-text-muted)"} boxShadow={current ? "0 0 0 4px rgba(34, 211, 238, 0.18)" : "none"}>
                    <Icon size={19} aria-hidden="true" />
                  </Box>
                  <Text fontSize="xs" fontWeight="black" color={reached ? (isLightTheme ? "#0e7490" : "#a5f3fc") : "var(--app-text-muted)"}>{item.score}</Text>
                  <Text fontSize="sm" textAlign={alignment === "start" ? "left" : alignment === "end" ? "right" : "center"} fontWeight={reached ? "bold" : "medium"} color={reached ? "var(--app-text-primary)" : "var(--app-text-secondary)"} lineHeight="1.25" minH="35px">{title}</Text>
                </VStack>
              );
            })}
          </HStack>
        </Box>
      </Box>
      {immersion && (
        <Box mt={5} pt={5} borderTop="1px solid var(--app-border)">
          <ImmersionTasksContent immersion={immersion} appLanguage={appLanguage} petType={petType} />
        </Box>
      )}
    </Box>
  );
}
