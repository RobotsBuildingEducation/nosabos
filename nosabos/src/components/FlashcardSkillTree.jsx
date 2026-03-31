import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, VStack, HStack, Text, Button, Badge } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiStarLine,
  RiCheckLine,
  RiArrowDownLine,
  RiLockLine,
  RiShuffleLine,
  RiFlashlightLine,
  RiTimeLine,
  RiAddLine,
  RiBookOpenLine,
} from "react-icons/ri";
import {
  FLASHCARD_DATA,
  loadRelevantFlashcards,
  getUserProgressLevel,
} from "../data/flashcardData";
import { CEFR_COLORS, getConceptText } from "../data/flashcards/common";
import FlashcardPractice from "./FlashcardPractice";
import { translations } from "../utils/translation";
import { getLanguageXp } from "../utils/progressTracking";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import {
  buildStudyQueue,
  getDefaultSRSData,
  isCardDue,
} from "../utils/spacedRepetition";

// Get app language from localStorage (UI language setting)
const getAppLanguage = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("appLanguage") || "en";
  }
  return "en";
};

// Translation helper for UI strings - uses appLanguage for UI text
const getTranslation = (key, params = {}) => {
  const lang = getAppLanguage();
  const dict = translations[lang] || translations.en;
  const raw = dict[key] || key;
  if (typeof raw !== "string") return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`
  );
};

// Get effective language for flashcard content display
const getEffectiveCardLanguage = (supportLang) => {
  const appLang = getAppLanguage();
  if (supportLang && supportLang !== "en") {
    return supportLang;
  }
  return appLang;
};

const MotionBox = motion(Box);

// --- Visual flashcard (keeps the original card aesthetic) ---
const FlashcardCard = React.memo(function FlashcardCard({
  card,
  onClick,
  supportLang,
  isActive,
  skipInitialAnimation = false,
}) {
  const cefrColor = CEFR_COLORS[card.cefrLevel];
  const glowColor = `${cefrColor.primary}90`;
  const softGlowColor = `${cefrColor.primary}66`;

  const activeGlow = useMemo(
    () =>
      keyframes`
        0% {
          box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.28), 0 0 0 0 ${glowColor};
        }
        50% {
          box-shadow: 0px 4px 4px rgba(0, 0, 0, 1), 0 0 0 6px ${softGlowColor};
        }
        100% {
          box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.28), 0 0 0 0 ${glowColor};
        }
      `,
    [glowColor, softGlowColor]
  );

  return (
    <MotionBox
      initial={skipInitialAnimation ? false : { opacity: 0.8, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={
        skipInitialAnimation
          ? { duration: 0 }
          : { duration: 0.2, ease: "easeOut" }
      }
      onClick={onClick}
      cursor="pointer"
      w="220px"
      h="280px"
      flexShrink={0}
      style={{ willChange: "transform, opacity" }}
    >
      <Box
        w="100%"
        h="100%"
        bg={isActive ? "#08142b" : undefined}
        bgGradient={isActive ? undefined : cefrColor.gradient}
        borderRadius="2xl"
        border="2px solid"
        borderColor={isActive ? "rgba(56,189,248,0.3)" : `${cefrColor.primary}80`}
        boxShadow="0 12px 32px rgba(0, 0, 0, 0.28)"
        animation={
          isActive ? `${activeGlow} 2s ease-in-out infinite` : undefined
        }
        backdropFilter="blur(10px)"
        position="relative"
        overflow="hidden"
        sx={isActive ? {
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 15%, rgba(56,189,248,0.14) 0%, transparent 42%), " +
              "radial-gradient(circle at 82% 25%, rgba(45,212,191,0.12) 0%, transparent 40%), " +
              "radial-gradient(circle at 50% 100%, rgba(30,64,175,0.28) 0%, transparent 62%), " +
              "linear-gradient(180deg, rgba(8,20,43,0.95) 0%, rgba(5,16,36,0.98) 100%)",
            animation: "matrixGlowShift 10s ease-in-out infinite",
            zIndex: 0,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 1px, transparent 1px, transparent 28px), " +
              "repeating-linear-gradient(90deg, rgba(148,163,184,0.05) 0px, rgba(148,163,184,0.05) 1px, transparent 1px, transparent 28px)",
            opacity: 0.45,
            mixBlendMode: "screen",
            zIndex: 0,
          },
          "@keyframes matrixGlowShift": {
            "0%, 100%": { transform: "translate(0, 0) scale(1)" },
            "50%": { transform: "translate(0, -2%) scale(1.02)" },
          },
        } : undefined}
      >
        {!isActive && (
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            h="50%"
            bgGradient="linear(to-b, whiteAlpha.200, transparent)"
            pointerEvents="none"
          />
        )}

        <VStack
          h="100%"
          justify="space-between"
          p={6}
          position="relative"
          zIndex={2}
        >
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
          <Box h="40px" />
        </VStack>
      </Box>
    </MotionBox>
  );
});

// --- Compact count indicator ---
const CountPill = ({ count, label, color }) => (
  <HStack
    spacing={1.5}
    px={3}
    py={1.5}
    borderRadius="full"
    bg={`${color}15`}
    border="1px solid"
    borderColor={`${color}30`}
  >
    <Text fontSize="sm" fontWeight="bold" color={color}>
      {count}
    </Text>
    <Text fontSize="xs" color="gray.400">
      {label}
    </Text>
  </HStack>
);

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
  const [currentCardType, setCurrentCardType] = useState("new");
  const [localSRSUpdates, setLocalSRSUpdates] = useState({});
  const [flashcardData, setFlashcardData] = useState(() =>
    activeCEFRLevel
      ? FLASHCARD_DATA.filter((card) => card.cefrLevel === activeCEFRLevel)
      : FLASHCARD_DATA
  );
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

  const playSound = useSoundSettings((s) => s.playSound);

  const languageXp = useMemo(
    () => getLanguageXp(userProgress, targetLang),
    [userProgress, targetLang]
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setLocalSRSUpdates({});
    setSessionStats({ reviewed: 0, correct: 0 });
  }, [targetLang]);

  // Load relevant flashcards
  useEffect(() => {
    let isMounted = true;

    async function loadFlashcards() {
      setIsLoadingFlashcards(true);
      try {
        const relevantFlashcards = await loadRelevantFlashcards(userProgress);
        if (isMounted && relevantFlashcards.length > 0) {
          const filtered = activeCEFRLevel
            ? relevantFlashcards.filter((c) => c.cefrLevel === activeCEFRLevel)
            : relevantFlashcards;
          if (filtered.length === 0 && activeCEFRLevel) {
            setFlashcardData(
              FLASHCARD_DATA.filter((c) => c.cefrLevel === activeCEFRLevel)
            );
          } else {
            setFlashcardData(filtered);
          }
        } else if (isMounted) {
          setFlashcardData(
            activeCEFRLevel
              ? FLASHCARD_DATA.filter((c) => c.cefrLevel === activeCEFRLevel)
              : FLASHCARD_DATA
          );
        }
      } catch (error) {
        console.error("Error loading flashcards:", error);
        if (isMounted) {
          setFlashcardData(
            activeCEFRLevel
              ? FLASHCARD_DATA.filter((c) => c.cefrLevel === activeCEFRLevel)
              : FLASHCARD_DATA
          );
        }
      } finally {
        if (isMounted) setIsLoadingFlashcards(false);
      }
    }

    if (loadRelevantFlashcards) loadFlashcards();
    return () => { isMounted = false; };
  }, [userProgress, activeCEFRLevel]);

  // Build progress map merging Firestore data + local SRS updates
  const progressMap = useMemo(() => {
    const map = {};
    const flashcards = userProgress.flashcards || {};
    for (const [id, data] of Object.entries(flashcards)) {
      map[id] = { ...data };
    }
    for (const [id, data] of Object.entries(localSRSUpdates)) {
      map[id] = { ...map[id], ...data };
    }
    return map;
  }, [userProgress.flashcards, localSRSUpdates]);

  // Build the SRS study queue
  const { studyQueue, counts } = useMemo(
    () => buildStudyQueue(flashcardData, progressMap, 10),
    [flashcardData, progressMap]
  );

  const getCardType = useCallback(
    (card) => {
      const p = progressMap[card.id];
      if (!p || !p.dueDate) return "new";
      if (p.state === "learning") return "learning";
      return "due";
    },
    [progressMap]
  );

  const handleCardClick = useCallback(
    (card) => {
      playSound(selectSound);
      setCurrentCardType(getCardType(card));
      setPracticeCard(card);
      setIsPracticeOpen(true);
    },
    [playSound, getCardType]
  );

  const handleComplete = useCallback(
    (card) => {
      const srsData = card.srsData || {};

      setLocalSRSUpdates((prev) => ({
        ...prev,
        [card.id]: { ...srsData, completed: true },
      }));

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: prev.correct + 1,
      }));

      if (onStartFlashcard) onStartFlashcard(card);

      setIsPracticeOpen(false);
      setPracticeCard(null);
    },
    [onStartFlashcard]
  );

  const handleIncorrectComplete = useCallback(
    (card) => {
      const srsData = card.srsData || {};

      setLocalSRSUpdates((prev) => ({
        ...prev,
        [card.id]: { ...srsData, completed: true },
      }));

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: prev.correct,
      }));

      if (onStartFlashcard) onStartFlashcard(card);

      setIsPracticeOpen(false);
      setPracticeCard(null);
    },
    [onStartFlashcard]
  );

  const handleClosePractice = useCallback(() => {
    setIsPracticeOpen(false);
    setPracticeCard(null);
  }, []);

  const hasCards = studyQueue.length > 0;

  return (
    <Box w="100%" minH="500px" position="relative">
      <VStack spacing={6} align="stretch">
        {/* Compact stats bar */}
        <HStack spacing={2} justify="center" flexWrap="wrap">
          {counts.due > 0 && (
            <CountPill count={counts.due} label={getTranslation("srs_due_label")} color="#EF4444" />
          )}
          {counts.learning > 0 && (
            <CountPill count={counts.learning} label={getTranslation("srs_learning_label")} color="#FBBF24" />
          )}
          <CountPill count={counts.new} label={getTranslation("srs_new_label")} color="#38BDF8" />
          {sessionStats.reviewed > 0 && (
            <CountPill
              count={sessionStats.reviewed}
              label={getTranslation("srs_reviewed_label")}
              color="#22C55E"
            />
          )}
        </HStack>

        {/* Card carousel - horizontal scroll, just like original */}
        {hasCards ? (
          <Box
            overflowX="auto"
            overflowY="hidden"
            w="100%"
            pb={4}
            sx={{
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            <HStack spacing={6} px={4} minW="min-content" padding={6}>
              <AnimatePresence initial={false}>
                {studyQueue.map((card, idx) => (
                  <FlashcardCard
                    key={card.id}
                    card={card}
                    isActive={idx === 0}
                    onClick={() => handleCardClick(card)}
                    supportLang={supportLang}
                    skipInitialAnimation={!isReady}
                  />
                ))}
              </AnimatePresence>
            </HStack>
          </Box>
        ) : (
          <MotionBox
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
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
                {getTranslation("srs_all_caught_up")}
              </Text>
              <Text fontSize="md" color="gray.400" textAlign="center">
                {getTranslation("srs_come_back_later")}
              </Text>
            </VStack>
          </MotionBox>
        )}
      </VStack>

      {/* Practice Modal */}
      {practiceCard && (
        <FlashcardPractice
          card={practiceCard}
          isOpen={isPracticeOpen}
          onClose={handleClosePractice}
          onComplete={handleComplete}
          onIncorrectComplete={handleIncorrectComplete}
          targetLang={targetLang}
          supportLang={supportLang}
          pauseMs={pauseMs}
          languageXp={languageXp}
          srsData={progressMap[practiceCard?.id] || {}}
          cardType={currentCardType}
        />
      )}
    </Box>
  );
}
