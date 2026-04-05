import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiArrowDownLine,
  RiCheckLine,
  RiLockLine,
} from "react-icons/ri";
import { FLASHCARD_DATA, loadRelevantFlashcards } from "../data/flashcardData";
import { CEFR_COLORS, getConceptText } from "../data/flashcards/common";
import FlashcardPractice from "./FlashcardPractice";
import { WaveBar } from "./WaveBar";
import { translations } from "../utils/translation";
import { getLanguageXp } from "../utils/progressTracking";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import {
  FLASHCARD_DAILY_TARGET,
  FLASHCARD_REVIEW_STATES,
  FLASHCARD_SCHEDULER_STATES,
  formatAbsoluteReviewTime,
  getFlashcardReviewSnapshot,
  getLocalDayKey,
} from "../utils/flashcardReview";

const MotionBox = motion(Box);
const EMPTY_PROGRESS = {};

const getAppLanguage = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("appLanguage") || "en";
  }
  return "en";
};

const getTranslation = (key, params = {}) => {
  const lang = getAppLanguage();
  const dict = translations[lang] || translations.en;
  const raw = dict[key] || key;
  if (typeof raw !== "string") return raw;
  return raw.replace(/\{(\w+)\}/g, (_, token) =>
    params[token] != null ? String(params[token]) : `{${token}}`,
  );
};

const getEffectiveCardLanguage = (supportLang) => {
  const appLang = getAppLanguage();
  if (supportLang && supportLang !== "en") {
    return supportLang;
  }
  return appLang;
};

function normalizeActivityMap(activityMap = {}) {
  return Object.entries(activityMap).reduce((accumulator, [dayKey, count]) => {
    if (!dayKey) return accumulator;

    const normalizedCount = Math.max(0, Number(count) || 0);
    if (normalizedCount > 0) {
      accumulator[dayKey] = normalizedCount;
    }

    return accumulator;
  }, {});
}

function getProgressTimestamp(progress = {}) {
  const rawValue =
    progress?.updatedAt || progress?.lastReviewedAt || progress?.completedAt;
  if (!rawValue) return 0;

  const timestamp = new Date(rawValue).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function buildFallbackActivityMap(progressMap = {}) {
  return Object.values(progressMap).reduce((accumulator, progress) => {
    const dayKey = getLocalDayKey(
      progress?.lastReviewedAt || progress?.completedAt,
    );
    if (!dayKey) return accumulator;

    accumulator[dayKey] = (accumulator[dayKey] || 0) + 1;
    return accumulator;
  }, {});
}

function buildOptimisticActivityMap(localProgressOverrides = {}, baseProgressMap = {}) {
  return Object.entries(localProgressOverrides).reduce(
    (accumulator, [cardId, progress]) => {
      const dayKey = getLocalDayKey(
        progress?.lastReviewedAt || progress?.completedAt,
      );
      if (!dayKey) return accumulator;

      const overrideTimestamp = getProgressTimestamp(progress);
      const baseTimestamp = getProgressTimestamp(baseProgressMap?.[cardId]);

      if (overrideTimestamp && overrideTimestamp <= baseTimestamp) {
        return accumulator;
      }

      accumulator[dayKey] = (accumulator[dayKey] || 0) + 1;
      return accumulator;
    },
    {},
  );
}

function buildHeatmapWeeks(activityMap, language, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);
  const firstWeekPadding = yearStart.getDay();
  const totalDaysInYear =
    Math.round((yearEnd.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000)) +
    1;
  const totalWeeks = Math.ceil((firstWeekPadding + totalDaysInYear) / 7);

  const monthFormatter = new Intl.DateTimeFormat(
    language === "es" ? "es-MX" : "en-US",
    { month: "short" },
  );

  return Array.from({ length: totalWeeks }, (_, weekIndex) => {
    let monthLabel = "";
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const cellIndex = weekIndex * 7 + dayIndex;
      const dayOffset = cellIndex - firstWeekPadding;

      if (dayOffset < 0 || dayOffset >= totalDaysInYear) {
        return {
          count: 0,
          dayKey: `blank-${weekIndex}-${dayIndex}`,
          date: null,
          isFuture: false,
          isToday: false,
          isBlank: true,
          level: "blank",
        };
      }

      const date = new Date(yearStart);
      date.setDate(yearStart.getDate() + dayOffset);
      const dayKey = getLocalDayKey(date);
      const count = Number(activityMap?.[dayKey]) || 0;
      const isFuture = date.getTime() > today.getTime();

      if (!monthLabel && date.getDate() === 1) {
        monthLabel = monthFormatter.format(date);
      }

      return {
        count,
        dayKey,
        date,
        isFuture,
        isToday: dayKey === getLocalDayKey(today),
        isBlank: false,
        level:
          count >= FLASHCARD_DAILY_TARGET
            ? "complete"
            : count > 0
              ? "partial"
              : "empty",
      };
    });

    return {
      key: `week-${currentYear}-${weekIndex}`,
      monthLabel,
      days,
    };
  });
}

function formatActivityDate(date, language) {
  return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getCardDecor(status, cefrColor) {
  switch (status) {
    case "due":
      return {
        bg: "#24140b",
        bgGradient:
          "linear(180deg, rgba(124,45,18,0.96) 0%, rgba(69,26,3,0.98) 100%)",
        borderColor: "rgba(251, 191, 36, 0.55)",
        opacity: 1,
      };
    case "active":
      return {
        bg: "#08142b",
        bgGradient: undefined,
        borderColor: "rgba(56,189,248,0.36)",
        opacity: 1,
      };
    case "learning":
      return {
        bg: "#0f172a",
        bgGradient:
          "linear(180deg, rgba(15,23,42,0.92) 0%, rgba(8,20,43,0.98) 100%)",
        borderColor: "rgba(45,212,191,0.34)",
        opacity: 0.86,
      };
    case "weak":
      return {
        bg: "#11243d",
        bgGradient:
          "linear(180deg, rgba(17,36,61,0.95) 0%, rgba(10,24,45,0.98) 100%)",
        borderColor: "rgba(244,114,182,0.36)",
        opacity: 0.92,
      };
    case "scheduled":
      return {
        bg: undefined,
        bgGradient: "linear(135deg, whiteAlpha.100, whiteAlpha.50)",
        borderColor: "whiteAlpha.200",
        opacity: 0.62,
      };
    case "locked":
      return {
        bg: cefrColor.primary,
        bgGradient: cefrColor.gradient,
        borderColor: `${cefrColor.primary}55`,
        opacity: 0.38,
      };
    default:
      return {
        bg: cefrColor.primary,
        bgGradient: cefrColor.gradient,
        borderColor: `${cefrColor.primary}80`,
        opacity: 1,
      };
  }
}

const FlashcardCard = React.memo(function FlashcardCard({
  card,
  status,
  onClick,
  stackPosition,
  supportLang,
  skipInitialAnimation = false,
}) {
  const cefrColor = CEFR_COLORS[card.cefrLevel];
  const isActive = status === "active";
  const isDue = status === "due";
  const isWeak = status === "weak";
  const isLocked = status === "locked";
  const isStacked = stackPosition !== undefined;
  const isCompletedStyle =
    status === "scheduled" || status === "learning" || isDue || isWeak;
  const decor = getCardDecor(status, cefrColor);
  const isActionable = isActive || isDue || isWeak;

  const glowColor = isDue
    ? "rgba(251, 191, 36, 0.65)"
    : isWeak
      ? "rgba(244,114,182,0.52)"
      : `${cefrColor.primary}90`;
  const softGlowColor = isDue
    ? "rgba(251, 191, 36, 0.3)"
    : isWeak
      ? "rgba(244,114,182,0.22)"
      : `${cefrColor.primary}66`;

  const activeGlow = useMemo(
    () =>
      keyframes`
        0% {
          box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.28), 0 0 0 0 ${glowColor};
        }
        50% {
          box-shadow: 0px 4px 4px rgba(0, 0, 0, 1), 0 0 0 8px ${softGlowColor};
        }
        100% {
          box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.28), 0 0 0 0 ${glowColor};
        }
      `,
    [glowColor, softGlowColor],
  );

  const stackOffset = isStacked ? stackPosition * 4 : 0;
  const animateProps = {
    opacity: decor.opacity,
    scale: isStacked ? 0.96 - stackPosition * 0.03 : 1,
    y: isStacked ? stackOffset : 0,
  };

  return (
    <MotionBox
      initial={skipInitialAnimation ? false : { opacity: 0.8, scale: 0.95 }}
      animate={animateProps}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={
        skipInitialAnimation
          ? { duration: 0 }
          : { duration: 0.22, ease: "easeOut" }
      }
      onClick={onClick}
      cursor={isActionable ? "pointer" : isLocked ? "not-allowed" : "default"}
      position={isStacked ? "absolute" : "relative"}
      top={isStacked ? 0 : "auto"}
      w="220px"
      h="280px"
      flexShrink={0}
      zIndex={isStacked ? 100 - stackPosition : 1}
      filter={isLocked ? "grayscale(100%)" : "none"}
      style={{ willChange: "transform, opacity" }}
    >
      <Box
        w="100%"
        h="100%"
        bg={decor.bg}
        bgGradient={decor.bgGradient}
        borderRadius="2xl"
        border="2px solid"
        borderColor={decor.borderColor}
        boxShadow={
          isActionable
            ? "0 12px 32px rgba(0, 0, 0, 0.28), 0 0 0 0 rgba(0,0,0,0)"
            : "0 8px 24px rgba(0, 0, 0, 0.28)"
        }
        animation={
          isActionable ? `${activeGlow} 2s ease-in-out infinite` : undefined
        }
        backdropFilter="blur(10px)"
        position="relative"
        overflow="hidden"
        opacity={decor.opacity}
        sx={
          isActionable
            ? {
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background:
                    isDue
                      ? "radial-gradient(circle at 20% 15%, rgba(251,191,36,0.18) 0%, transparent 40%), radial-gradient(circle at 82% 25%, rgba(249,115,22,0.16) 0%, transparent 42%), linear-gradient(180deg, rgba(36,20,11,0.94) 0%, rgba(69,26,3,0.98) 100%)"
                      : isWeak
                        ? "radial-gradient(circle at 20% 15%, rgba(244,114,182,0.14) 0%, transparent 40%), radial-gradient(circle at 82% 25%, rgba(125,211,252,0.12) 0%, transparent 40%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.18) 0%, transparent 60%), linear-gradient(180deg, rgba(17,36,61,0.95) 0%, rgba(10,24,45,0.98) 100%)"
                      : "radial-gradient(circle at 20% 15%, rgba(56,189,248,0.14) 0%, transparent 42%), radial-gradient(circle at 82% 25%, rgba(45,212,191,0.12) 0%, transparent 40%), radial-gradient(circle at 50% 100%, rgba(30,64,175,0.28) 0%, transparent 62%), linear-gradient(180deg, rgba(8,20,43,0.95) 0%, rgba(5,16,36,0.98) 100%)",
                  animation: "flashcardGlowShift 10s ease-in-out infinite",
                  zIndex: 0,
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, rgba(148,163,184,0.05) 0px, rgba(148,163,184,0.05) 1px, transparent 1px, transparent 28px)",
                  opacity: 0.4,
                  mixBlendMode: "screen",
                  zIndex: 0,
                },
                "@keyframes flashcardGlowShift": {
                  "0%, 100%": { transform: "translate(0, 0) scale(1)" },
                  "50%": { transform: "translate(0, -2%) scale(1.02)" },
                },
              }
            : undefined
        }
      >
        {!isActive && !isDue && !isWeak ? (
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            h="50%"
            bgGradient="linear(to-b, whiteAlpha.200, transparent)"
            pointerEvents="none"
          />
        ) : null}

        {isCompletedStyle ? (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            opacity={isDue ? 0.16 : 0.28}
          >
            <RiCheckLine size={isDue ? 96 : 120} color="white" />
          </Box>
        ) : null}

        {isLocked ? (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            opacity={0.5}
          >
            <RiLockLine size={80} color="white" />
          </Box>
        ) : null}

        <VStack
          h="100%"
          justify="space-between"
          p={6}
          position="relative"
          zIndex={2}
          align="stretch"
        >
          <Box minH="20px" />

          <VStack spacing={4} flex={1} justify="center">
            <Text
              fontSize="3xl"
              fontWeight="black"
              color="white"
              textAlign="center"
              lineHeight="1.2"
              textShadow="0 2px 12px rgba(0,0,0,0.4)"
            >
              {getConceptText(card, getEffectiveCardLanguage(supportLang))}
            </Text>
          </VStack>

          <Box minH="20px" />
        </VStack>
      </Box>
    </MotionBox>
  );
});

function sortByReviewDate(cardA, cardB, reviewSnapshotMap) {
  const aTime =
    reviewSnapshotMap.get(cardA.id)?.nextReviewDate?.getTime?.() ?? Number.MIN_SAFE_INTEGER;
  const bTime =
    reviewSnapshotMap.get(cardB.id)?.nextReviewDate?.getTime?.() ?? Number.MIN_SAFE_INTEGER;
  return aTime - bTime;
}

function getWeaknessScore(snapshot) {
  return (
    snapshot.lapseCount * 6 +
    (snapshot.reviewState === FLASHCARD_REVIEW_STATES.DUE ? 4 : 0) +
    (6 - snapshot.masteryStage) * 2 -
    snapshot.consecutiveCorrect
  );
}

function isWeakCardSnapshot(snapshot) {
  if (!snapshot) return false;
  if (snapshot.reviewState !== FLASHCARD_REVIEW_STATES.SCHEDULED) return false;
  return getWeaknessScore(snapshot) >= 6;
}

function DashboardStat({ label, value }) {
  return (
    <Box
      minW={{ base: "calc(50% - 6px)", md: "170px" }}
      flex="1"
      p={4}
      borderRadius="2xl"
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.200"
      backdropFilter="blur(12px)"
    >
      <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="0.08em">
        {label}
      </Text>
      <Text mt={1} fontSize="2xl" fontWeight="black" color="white">
        {value}
      </Text>
    </Box>
  );
}

function ActivityHeatmap({ activityMap, appLanguage }) {
  const weeks = useMemo(
    () => buildHeatmapWeeks(activityMap, appLanguage),
    [activityMap, appLanguage],
  );

  const renderDayCell = (day) => {
    if (day.isBlank) {
      return (
        <Box
          key={day.dayKey}
          w="100%"
          aspectRatio="1 / 1"
          borderRadius={{ base: "1px", sm: "2px", md: "3px", lg: "4px" }}
          bg="transparent"
        />
      );
    }

    const title = `${formatActivityDate(day.date, appLanguage)} - ${
      day.count
    }/${FLASHCARD_DAILY_TARGET}`;
    const baseProps = {
      w: "100%",
      aspectRatio: "1 / 1",
      borderRadius: { base: "2px", sm: "3px", md: "3px", lg: "4px" },
      borderStyle: "solid",
      borderWidth: "1px",
      transition: "transform 0.16s ease, opacity 0.16s ease",
    };

    if (day.level === "complete") {
      return (
        <Box
          key={day.dayKey}
          {...baseProps}
          title={title}
          bgGradient="linear(135deg, #2dd4bf 0%, #38bdf8 100%)"
          borderColor="rgba(167, 243, 208, 0.55)"
          boxShadow={{
            base: "none",
            md: "0 0 0 1px rgba(45, 212, 191, 0.14), 0 6px 12px rgba(14, 165, 233, 0.16)",
          }}
          opacity={day.isFuture ? 0.28 : 1}
          transform={day.isToday ? "scale(1.04)" : "none"}
        />
      );
    }

    if (day.level === "partial") {
      return (
        <Box
          key={day.dayKey}
          {...baseProps}
          title={title}
          bg="rgba(45, 212, 191, 0.42)"
          borderColor="rgba(94, 234, 212, 0.28)"
          opacity={day.isFuture ? 0.28 : 1}
          transform={day.isToday ? "scale(1.04)" : "none"}
        />
      );
    }

    return (
      <Box
        key={day.dayKey}
        {...baseProps}
        title={title}
        bg={day.isFuture ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)"}
        borderColor={
          day.isToday
            ? "rgba(255,255,255,0.45)"
            : "rgba(255,255,255,0.08)"
        }
        opacity={day.isFuture ? 0.35 : 1}
        transform={day.isToday ? "scale(1.04)" : "none"}
      />
    );
  };

  return (
    <Box
      p={{ base: 3, md: 4 }}
      borderRadius="2xl"
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.200"
      backdropFilter="blur(12px)"
    >
      <HStack justify="space-between" align="baseline" mb={3} flexWrap="wrap">
        <Text
          fontSize="xs"
          color="gray.400"
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          {getTranslation("flashcard_activity")}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {getTranslation("flashcard_activity_subtitle")}
        </Text>
      </HStack>

      <Box
        overflowX="auto"
        overflowY="hidden"
        w="100%"
        pb={2}
        sx={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <Box
          display="grid"
          gridTemplateColumns={{
            base: `repeat(${weeks.length}, 12px)`,
            sm: `repeat(${weeks.length}, 13px)`,
            md: `repeat(${weeks.length}, 13px)`,
            lg: `repeat(${weeks.length}, minmax(14px, 1fr))`,
          }}
          columnGap={{ base: "2px", md: "2px", lg: "4px" }}
          rowGap="0px"
          alignItems="start"
          w={{ base: "max-content", lg: "100%" }}
          minW={{ base: "max-content", lg: "100%" }}
        >
          {weeks.map((week) => (
            <Box key={week.key} minW={0}>
              <Text
                minH={{ base: "10px", sm: "11px", md: "12px", lg: "14px" }}
                fontSize={{ base: "7px", sm: "7px", md: "8px", lg: "9px" }}
                lineHeight="1"
                color="gray.500"
                textTransform="uppercase"
                whiteSpace="nowrap"
                textAlign="left"
              >
                {week.monthLabel}
              </Text>
              <Box display="grid" rowGap={{ base: "2px", md: "2px" }}>
                {week.days.map((day) => renderDayCell(day))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <HStack spacing={4} mt={4} flexWrap="wrap">
        <HStack spacing={2}>
          <Box
            w="10px"
            h="10px"
            borderRadius="3px"
            bg="rgba(255,255,255,0.08)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
          />
          <Text fontSize="xs" color="gray.400">
            {getTranslation("flashcard_activity_empty")}
          </Text>
        </HStack>
        <HStack spacing={2}>
          <Box
            w="10px"
            h="10px"
            borderRadius="3px"
            bg="rgba(45, 212, 191, 0.42)"
            border="1px solid"
            borderColor="rgba(94, 234, 212, 0.28)"
          />
          <Text fontSize="xs" color="gray.400">
            {getTranslation("flashcard_activity_some")}
          </Text>
        </HStack>
        <HStack spacing={2}>
          <Box
            w="10px"
            h="10px"
            borderRadius="3px"
            bgGradient="linear(135deg, #2dd4bf 0%, #38bdf8 100%)"
            border="1px solid"
            borderColor="rgba(167, 243, 208, 0.55)"
          />
          <Text fontSize="xs" color="gray.400">
            {getTranslation("flashcard_activity_goal")}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
}

function DeckSection({
  title,
  subtitle,
  cards,
  reviewSnapshotMap,
  getCardStatus,
  resolveCardStatus,
  handleCardClick,
  getCardNote,
  supportLang,
  skipInitialAnimation,
}) {
  if (cards.length === 0) return null;

  return (
    <VStack align="stretch" spacing={3}>
      <VStack align="stretch" spacing={1} px={1}>
        <Text fontSize="lg" fontWeight="black" color="white">
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize="sm" color="gray.400">
            {subtitle}
          </Text>
        ) : null}
      </VStack>

      <Box
        overflowX="auto"
        overflowY="hidden"
        w="100%"
        pb={4}
        sx={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <HStack spacing={6} px={4} minW="min-content" padding={6}>
          <AnimatePresence initial={false}>
            {cards.map((card) => {
              const status = resolveCardStatus
                ? resolveCardStatus(card, reviewSnapshotMap.get(card.id))
                : getCardStatus(card);

              return (
                <VStack
                  key={card.id}
                  spacing={2}
                  align="stretch"
                  w="220px"
                  flexShrink={0}
                >
                  <FlashcardCard
                    card={card}
                    status={status}
                    onClick={() => handleCardClick(card, status)}
                    supportLang={supportLang}
                    skipInitialAnimation={skipInitialAnimation}
                  />
                  {getCardNote ? (
                    <Text
                      fontSize="sm"
                      color="gray.400"
                      textAlign="center"
                      px={2}
                      whiteSpace="pre-line"
                    >
                      {getCardNote(card, reviewSnapshotMap.get(card.id))}
                    </Text>
                  ) : null}
                </VStack>
              );
            })}
          </AnimatePresence>
        </HStack>
      </Box>
    </VStack>
  );
}

export default function FlashcardSkillTree({
  userProgress = { flashcards: {} },
  onStartFlashcard,
  onRandomPractice,
  targetLang = "es",
  supportLang = "en",
  activeCEFRLevel = null,
  pauseMs = 2000,
}) {
  const [practiceCard, setPracticeCard] = useState(null);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isReviewSession, setIsReviewSession] = useState(false);
  const [localProgressOverrides, setLocalProgressOverrides] = useState({});
  const [flashcardData, setFlashcardData] = useState(() =>
    activeCEFRLevel
      ? FLASHCARD_DATA.filter((card) => card.cefrLevel === activeCEFRLevel)
      : FLASHCARD_DATA,
  );
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const playSound = useSoundSettings((state) => state.playSound);
  const appLanguage = getAppLanguage();

  const languageXp = useMemo(
    () => getLanguageXp(userProgress, targetLang),
    [userProgress, targetLang],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setLocalProgressOverrides({});
  }, [targetLang]);

  useEffect(() => {
    let isMounted = true;

    async function loadFlashcards() {
      setIsLoadingFlashcards(true);

      try {
        const relevantFlashcards = await loadRelevantFlashcards(userProgress);

        if (isMounted && relevantFlashcards.length > 0) {
          const filteredFlashcards = activeCEFRLevel
            ? relevantFlashcards.filter((card) => card.cefrLevel === activeCEFRLevel)
            : relevantFlashcards;

          if (filteredFlashcards.length === 0 && activeCEFRLevel) {
            setFlashcardData(
              FLASHCARD_DATA.filter((card) => card.cefrLevel === activeCEFRLevel),
            );
          } else {
            setFlashcardData(filteredFlashcards);
          }
        } else if (isMounted) {
          setFlashcardData(
            activeCEFRLevel
              ? FLASHCARD_DATA.filter((card) => card.cefrLevel === activeCEFRLevel)
              : FLASHCARD_DATA,
          );
        }
      } catch (error) {
        console.error("Error loading flashcards:", error);
        if (isMounted) {
          setFlashcardData(
            activeCEFRLevel
              ? FLASHCARD_DATA.filter((card) => card.cefrLevel === activeCEFRLevel)
              : FLASHCARD_DATA,
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingFlashcards(false);
        }
      }
    }

    if (loadRelevantFlashcards) {
      loadFlashcards();
    }

    return () => {
      isMounted = false;
    };
  }, [userProgress, activeCEFRLevel]);

  const effectiveProgressMap = useMemo(() => {
    const map = {};

    flashcardData.forEach((card) => {
      map[card.id] = {
        ...(userProgress.flashcards?.[card.id] || EMPTY_PROGRESS),
        ...(localProgressOverrides[card.id] || EMPTY_PROGRESS),
      };
    });

    return map;
  }, [flashcardData, localProgressOverrides, userProgress.flashcards]);

  const reviewSnapshotMap = useMemo(() => {
    const map = new Map();
    flashcardData.forEach((card) => {
      map.set(card.id, getFlashcardReviewSnapshot(effectiveProgressMap[card.id]));
    });
    return map;
  }, [effectiveProgressMap, flashcardData]);

  const completedCards = useMemo(
    () =>
      flashcardData.filter((card) => reviewSnapshotMap.get(card.id)?.completed),
    [flashcardData, reviewSnapshotMap],
  );

  const dueCards = useMemo(
    () =>
      flashcardData
        .filter(
          (card) =>
            reviewSnapshotMap.get(card.id)?.reviewState ===
            FLASHCARD_REVIEW_STATES.DUE,
        )
        .sort((a, b) => sortByReviewDate(a, b, reviewSnapshotMap)),
    [flashcardData, reviewSnapshotMap],
  );

  const newCards = useMemo(
    () =>
      flashcardData.filter(
        (card) =>
          reviewSnapshotMap.get(card.id)?.schedulerState ===
          FLASHCARD_SCHEDULER_STATES.NEW,
      ),
    [flashcardData, reviewSnapshotMap],
  );

  const learningCards = useMemo(
    () =>
      flashcardData
        .filter(
          (card) =>
            reviewSnapshotMap.get(card.id)?.reviewState ===
            FLASHCARD_REVIEW_STATES.LEARNING,
        )
        .sort((a, b) => sortByReviewDate(a, b, reviewSnapshotMap)),
    [flashcardData, reviewSnapshotMap],
  );

  const scheduledCards = useMemo(
    () =>
      flashcardData
        .filter(
          (card) =>
            reviewSnapshotMap.get(card.id)?.reviewState ===
            FLASHCARD_REVIEW_STATES.SCHEDULED,
        )
        .sort((a, b) => sortByReviewDate(a, b, reviewSnapshotMap)),
    [flashcardData, reviewSnapshotMap],
  );

  const weakCards = useMemo(
    () =>
      scheduledCards
        .filter((card) => isWeakCardSnapshot(reviewSnapshotMap.get(card.id)))
        .sort((cardA, cardB) => {
          const aScore = getWeaknessScore(reviewSnapshotMap.get(cardA.id));
          const bScore = getWeaknessScore(reviewSnapshotMap.get(cardB.id));

          if (aScore === bScore) {
            return sortByReviewDate(cardA, cardB, reviewSnapshotMap);
          }

          return bScore - aScore;
        })
        .slice(0, 6),
    [reviewSnapshotMap, scheduledCards],
  );

  const weakCardIds = useMemo(
    () => new Set(weakCards.map((card) => card.id)),
    [weakCards],
  );

  const remainingScheduledCards = useMemo(
    () => scheduledCards.filter((card) => !weakCardIds.has(card.id)),
    [scheduledCards, weakCardIds],
  );

  const firstNewCard = newCards[0] || null;
  const firstNewCardIndex = firstNewCard
    ? flashcardData.findIndex((card) => card.id === firstNewCard.id)
    : -1;

  const weakestReviewCard = useMemo(() => {
    return weakCards[0] || null;
  }, [weakCards]);

  const fallbackActivityMap = useMemo(
    () => buildFallbackActivityMap(userProgress.flashcards || EMPTY_PROGRESS),
    [userProgress.flashcards],
  );

  const optimisticActivityMap = useMemo(
    () =>
      buildOptimisticActivityMap(
        localProgressOverrides,
        userProgress.flashcards || EMPTY_PROGRESS,
      ),
    [localProgressOverrides, userProgress.flashcards],
  );

  const dailyActivityMap = useMemo(() => {
    const storedActivityMap = normalizeActivityMap(
      userProgress.flashcardActivity || EMPTY_PROGRESS,
    );
    const mergedActivityMap = { ...storedActivityMap };

    Object.entries(fallbackActivityMap).forEach(([dayKey, count]) => {
      mergedActivityMap[dayKey] = Math.max(
        Number(mergedActivityMap[dayKey]) || 0,
        count,
      );
    });

    Object.entries(optimisticActivityMap).forEach(([dayKey, count]) => {
      mergedActivityMap[dayKey] =
        (Number(mergedActivityMap[dayKey]) || 0) + count;
    });

    return mergedActivityMap;
  }, [
    fallbackActivityMap,
    optimisticActivityMap,
    userProgress.flashcardActivity,
  ]);

  const reviewedTodayCount = useMemo(
    () => Number(dailyActivityMap[getLocalDayKey(new Date())]) || 0,
    [dailyActivityMap],
  );

  const dailyProgressPct = Math.min(
    100,
    Math.round((reviewedTodayCount / FLASHCARD_DAILY_TARGET) * 100),
  );

  const getNextReviewNote = useCallback(
    (snapshot) => {
      const time = formatAbsoluteReviewTime(
        snapshot?.nextReviewDate,
        appLanguage,
      );
      if (!time) return "";
      return `${getTranslation("flashcard_next_review_label")}\n${time}`;
    },
    [appLanguage],
  );

  const getWeakCardNote = useCallback(
    (snapshot) => {
      const time = formatAbsoluteReviewTime(
        snapshot?.nextReviewDate,
        appLanguage,
      );
      if (!time) return "";
      return `${getTranslation("flashcard_next_review_label")}\n${time}`;
    },
    [appLanguage],
  );

  const getCardStatus = useCallback(
    (card) => {
      const snapshot = reviewSnapshotMap.get(card.id);

      if (snapshot?.reviewState === FLASHCARD_REVIEW_STATES.DUE) {
        return "due";
      }

      if (!snapshot?.completed && card.id === firstNewCard?.id) {
        return "active";
      }

      if (!snapshot?.completed) {
        const cardIndex = flashcardData.findIndex(
          (entry) => entry.id === card.id,
        );
        return firstNewCardIndex !== -1 && cardIndex > firstNewCardIndex
          ? "locked"
          : "active";
      }

      if (snapshot.reviewState === FLASHCARD_REVIEW_STATES.LEARNING) {
        return "learning";
      }

      return "scheduled";
    },
    [firstNewCard, firstNewCardIndex, flashcardData, reviewSnapshotMap],
  );

  const openPracticeCard = useCallback(
    (card, practiceMode, practiceStatus = null) => {
      if (!card) return;

      playSound(selectSound);
      const reviewProgress = effectiveProgressMap[card.id] || EMPTY_PROGRESS;
      const reviewSnapshot = reviewSnapshotMap.get(card.id);

      setIsReviewSession(practiceMode === "review");
      setPracticeCard({
        ...card,
        reviewProgress,
        reviewState: reviewSnapshot?.reviewState,
        practiceStatus,
      });
      setIsPracticeOpen(true);
    },
    [effectiveProgressMap, playSound, reviewSnapshotMap],
  );

  const handleCardClick = useCallback(
    (card, status) => {
      if (status === "active") {
        openPracticeCard(card, "learn", "active");
      }

      if (status === "due") {
        openPracticeCard(card, "review", "due");
      }
    },
    [openPracticeCard],
  );

  const handleComplete = useCallback(
    (card) => {
      if (!card?.id) return;

      setLocalProgressOverrides((current) => ({
        ...current,
        [card.id]: {
          ...(current[card.id] || EMPTY_PROGRESS),
          ...(card.reviewPatch || EMPTY_PROGRESS),
          completed: card.reviewPatch?.completed === true,
        },
      }));

      if (isReviewSession) {
        onRandomPractice?.(card);
      } else {
        onStartFlashcard?.(card);
      }

      setIsPracticeOpen(false);
      setPracticeCard(null);
      setIsReviewSession(false);
    },
    [isReviewSession, onRandomPractice, onStartFlashcard],
  );

  const handleClosePractice = useCallback(() => {
    setIsPracticeOpen(false);
    setPracticeCard(null);
    setIsReviewSession(false);
  }, []);

  const handleLaunchDueSession = useCallback(() => {
    if (dueCards[0]) {
      openPracticeCard(dueCards[0], "review", "due");
      return;
    }

    if (weakestReviewCard) {
      openPracticeCard(weakestReviewCard, "review", "weak");
    }
  }, [dueCards, openPracticeCard, weakestReviewCard]);

  const handleLaunchNewSession = useCallback(() => {
    openPracticeCard(firstNewCard, "learn", "active");
  }, [firstNewCard, openPracticeCard]);

  const handleLaunchWeakCard = useCallback(() => {
    openPracticeCard(weakestReviewCard, "review", "weak");
  }, [openPracticeCard, weakestReviewCard]);

  const newCardsSection = (
    <DeckSection
      title={getTranslation("flashcard_new_queue")}
      cards={newCards}
      reviewSnapshotMap={reviewSnapshotMap}
      getCardStatus={getCardStatus}
      resolveCardStatus={(card) => {
        if (card.id === firstNewCard?.id) return "active";

        const cardIndex = flashcardData.findIndex(
          (entry) => entry.id === card.id,
        );
        return firstNewCardIndex !== -1 && cardIndex > firstNewCardIndex
          ? "locked"
          : "active";
      }}
      handleCardClick={handleCardClick}
      supportLang={supportLang}
      skipInitialAnimation={!isReady}
    />
  );

  const dueCardsSection = (
    <DeckSection
      title={getTranslation("flashcard_reviews_due")}
      cards={dueCards}
      reviewSnapshotMap={reviewSnapshotMap}
      getCardStatus={getCardStatus}
      resolveCardStatus={() => "due"}
      handleCardClick={(card) => openPracticeCard(card, "review", "due")}
      supportLang={supportLang}
      skipInitialAnimation={!isReady}
    />
  );

  return (
    <Box w="100%" minH="500px" position="relative">
      <VStack spacing={8} align="stretch">
        <Box
          p={{ base: 5, md: 6 }}
          borderRadius="3xl"
          bg="#071224"
          border="1px solid"
          borderColor="whiteAlpha.200"
          boxShadow="0 18px 40px rgba(0, 0, 0, 0.28)"
          overflow="hidden"
          position="relative"
        >
          <Box
            position="absolute"
            inset={0}
            bgGradient="linear(135deg, rgba(56,189,248,0.12), rgba(14,165,233,0.03) 45%, rgba(45,212,191,0.12))"
            pointerEvents="none"
          />

          <VStack align="stretch" spacing={5} position="relative" zIndex={1}>
            <HStack spacing={3} align="stretch" flexWrap="wrap">
              <DashboardStat
                label={getTranslation("flashcard_reviews_due")}
                value={dueCards.length}
              />
              <DashboardStat
                label={getTranslation("flashcard_new_queue")}
                value={newCards.length}
              />
              <DashboardStat
                label={getTranslation("flashcard_mastered_cards")}
                value={completedCards.length}
              />
            </HStack>

            <ActivityHeatmap
              activityMap={dailyActivityMap}
              appLanguage={appLanguage}
            />

            <Box
              p={4}
              borderRadius="2xl"
              bg="whiteAlpha.100"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <HStack justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="bold" color="white">
                  {getTranslation("flashcard_daily_target")}
                </Text>
                <Text fontSize="sm" color="gray.300">
                  {getTranslation("flashcard_cards_done_today", {
                    count: reviewedTodayCount,
                    target: FLASHCARD_DAILY_TARGET,
                  })}
                </Text>
              </HStack>
              <WaveBar
                value={dailyProgressPct}
                height={10}
                start="#f7d66c"
                end="#f0b429"
                bg="rgba(255,255,255,0.12)"
                border="rgba(255, 231, 168, 0.35)"
              />
            </Box>

            <HStack spacing={3} flexWrap="wrap" align="stretch">
              {dueCards.length > 0 ? (
                <Button
                  size="lg"
                  colorScheme="teal"
                  onClick={handleLaunchDueSession}
                  minW={{ base: "100%", sm: "220px" }}
                  flex={{ base: "1 1 100%", lg: "1 1 0" }}
                >
                  {getTranslation("flashcard_start_reviews")}
                </Button>
              ) : null}

              {weakestReviewCard ? (
                <Button
                  size="lg"
                  variant="ghost"
                  color="white"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  onClick={handleLaunchWeakCard}
                  minW={{ base: "100%", sm: "220px" }}
                  flex={{ base: "1 1 100%", lg: "1 1 0" }}
                >
                  {getTranslation("flashcard_strengthen_weak")}
                </Button>
              ) : null}

              {firstNewCard ? (
                <Button
                  size="lg"
                  colorScheme="teal"
                  variant={dueCards.length > 0 ? "outline" : "solid"}
                  onClick={handleLaunchNewSession}
                  minW={{ base: "100%", sm: "220px" }}
                  flex={{ base: "1 1 100%", lg: "1 1 0" }}
                >
                  {getTranslation("flashcard_learn_next")}
                </Button>
              ) : null}
            </HStack>
          </VStack>
        </Box>

        {isLoadingFlashcards ? (
          <Box px={2}>
            <Text fontSize="sm" color="gray.400">
              {getTranslation("flashcard_session_loading")}
            </Text>
          </Box>
        ) : null}

        {dueCards.length > 0 ? (
          <>
            {dueCardsSection}
            {newCardsSection}
          </>
        ) : (
          <>
            {newCardsSection}
            {dueCardsSection}
          </>
        )}

        <DeckSection
          title={getTranslation("flashcard_weak_queue")}
          cards={weakCards}
          reviewSnapshotMap={reviewSnapshotMap}
          getCardStatus={getCardStatus}
          resolveCardStatus={() => "weak"}
          handleCardClick={(card) => openPracticeCard(card, "review", "weak")}
          getCardNote={(_card, snapshot) => getWeakCardNote(snapshot)}
          supportLang={supportLang}
          skipInitialAnimation={!isReady}
        />

        {learningCards.length > 0 || remainingScheduledCards.length > 0 ? (
          <Box textAlign="center" py={1}>
            <RiArrowDownLine size={30} color="rgba(255, 255, 255, 0.18)" />
          </Box>
        ) : null}

        {learningCards.length > 0 || remainingScheduledCards.length > 0 ? (
          <VStack align="stretch" spacing={4}>
            <VStack align="stretch" spacing={1}>
              <Text fontSize="lg" fontWeight="black" color="white">
                {getTranslation("flashcard_scheduled_queue")}
              </Text>
            </VStack>

            <Box
              overflowX="auto"
              overflowY="hidden"
              w="100%"
              pb={4}
              sx={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <HStack spacing={6} px={4} minW="min-content" padding={6}>
                <AnimatePresence initial={false}>
                  {[...learningCards, ...remainingScheduledCards]
                    .slice(0, 8)
                    .map((card) => {
                      const snapshot = reviewSnapshotMap.get(card.id);
                      return (
                        <VStack
                          key={card.id}
                          spacing={2}
                          align="stretch"
                          w="220px"
                          flexShrink={0}
                        >
                          <FlashcardCard
                            card={card}
                            status={
                              snapshot.reviewState ===
                              FLASHCARD_REVIEW_STATES.LEARNING
                                ? "learning"
                                : "scheduled"
                            }
                            supportLang={supportLang}
                            skipInitialAnimation={!isReady}
                          />
                          <Text
                            fontSize="sm"
                            color="gray.400"
                            textAlign="center"
                            px={2}
                            whiteSpace="pre-line"
                          >
                            {getNextReviewNote(snapshot)}
                          </Text>
                        </VStack>
                      );
                    })}
                </AnimatePresence>
              </HStack>
            </Box>
          </VStack>
        ) : null}

        {!firstNewCard && completedCards.length === 0 && !isLoadingFlashcards ? (
          <MotionBox
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
          >
            <VStack
              spacing={4}
              p={12}
              borderRadius="2xl"
              bgGradient="linear(135deg, whiteAlpha.100, whiteAlpha.50)"
              border="2px solid"
              borderColor="whiteAlpha.200"
              backdropFilter="blur(10px)"
            >
              <RiCheckLine size={64} color="#22C55E" />
              <Text fontSize="2xl" fontWeight="black" color="white">
                {getTranslation("flashcard_all_done")}
              </Text>
              <Text fontSize="md" color="gray.400" textAlign="center">
                {getTranslation("flashcard_all_completed")}
              </Text>
            </VStack>
          </MotionBox>
        ) : null}
      </VStack>

      {practiceCard ? (
        <FlashcardPractice
          card={practiceCard}
          isOpen={isPracticeOpen}
          onClose={handleClosePractice}
          onComplete={handleComplete}
          targetLang={targetLang}
          supportLang={supportLang}
          pauseMs={pauseMs}
          languageXp={languageXp}
        />
      ) : null}
    </Box>
  );
}
