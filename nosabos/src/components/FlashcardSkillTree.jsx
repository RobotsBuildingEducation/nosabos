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
import modeSwitcherSound from "../assets/modeswitcher.mp3";

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
// supportLang (from conversation settings) takes precedence if explicitly set
// Otherwise fall back to appLanguage (from account settings)
const getEffectiveCardLanguage = (supportLang) => {
  const appLang = getAppLanguage();
  // If supportLang is set to something other than default "en", use it
  // This means user explicitly chose a support language in conversation settings
  if (supportLang && supportLang !== "en") {
    return supportLang;
  }
  // Otherwise use the app language preference
  return appLang;
};

const MotionBox = motion(Box);

const FlashcardCard = React.memo(function FlashcardCard({
  card,
  status,
  onClick,
  stackPosition,
  supportLang,
  skipInitialAnimation = false,
}) {
  const cefrColor = CEFR_COLORS[card.cefrLevel];
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isLocked = status === "locked";
  const isStacked = stackPosition !== undefined;

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

  // Stacking offset for completed cards
  const stackOffset = isStacked ? stackPosition * 2 : 0;

  // Use simpler animations during initial render
  const animateProps = skipInitialAnimation
    ? {
        opacity: isLocked ? 0.4 : 1,
        scale: isStacked ? 0.95 - stackPosition * 0.02 : 1,
        y: isStacked ? stackOffset : 0,
      }
    : {
        opacity: isLocked ? 0.4 : 1,
        scale: isStacked ? 0.95 - stackPosition * 0.02 : 1,
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
          : { duration: 0.2, ease: "easeOut" }
      }
      onClick={onClick}
      cursor={isActive ? "pointer" : isLocked ? "not-allowed" : "default"}
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
        bgGradient={
          isCompleted
            ? "linear(135deg, whiteAlpha.100, whiteAlpha.50)"
            : cefrColor.gradient
        }
        borderRadius="2xl"
        border="2px solid"
        borderColor={isCompleted ? "whiteAlpha.200" : `${cefrColor.primary}80`}
        boxShadow={
          isActive
            ? "0 12px 32px rgba(0, 0, 0, 0.28), 0 0 0 0 rgba(0,0,0,0)"
            : "0 8px 24px rgba(0, 0, 0, 0.28)"
        }
        animation={
          isActive ? `${activeGlow} 2s ease-in-out infinite` : undefined
        }
        backdropFilter="blur(10px)"
        position="relative"
        overflow="hidden"
        opacity={isCompleted ? 0.6 : 1}
      >
        {/* Decorative gradient overlay */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          h="50%"
          bgGradient="linear(to-b, whiteAlpha.200, transparent)"
          pointerEvents="none"
        />

        {/* Sparkle effect for completed cards */}
        {isCompleted && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            opacity={0.3}
          >
            <RiCheckLine size={120} color="white" />
          </Box>
        )}

        {/* Lock icon for locked cards */}
        {isLocked && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            opacity={0.5}
          >
            <RiLockLine size={80} color="white" />
          </Box>
        )}

        {/* Card content */}
        <VStack
          h="100%"
          justify="space-between"
          p={6}
          position="relative"
          zIndex={2}
        >
          {/* CEFR Badge */}

          {/* Concept (centered) */}
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

          {/* Empty spacer for layout balance */}
          <Box h="40px" />
        </VStack>
      </Box>
    </MotionBox>
  );
});

export default function FlashcardSkillTree({
  userProgress = { flashcards: {} },
  onStartFlashcard,
  onRandomPractice, // Callback for random practice completion (awards XP, resets card)
  targetLang = "es",
  supportLang = "en",
  activeCEFRLevel = null, // Filter flashcards by CEFR level
  pauseMs = 2000,
}) {
  const [practiceCard, setPracticeCard] = useState(null);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isRandomPractice, setIsRandomPractice] = useState(false);
  const [localCompletedCards, setLocalCompletedCards] = useState(new Set());
  const [flashcardData, setFlashcardData] = useState(FLASHCARD_DATA);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Sound settings
  const playSound = useSoundSettings((s) => s.playSound);

  const languageXp = useMemo(
    () => getLanguageXp(userProgress, targetLang),
    [userProgress, targetLang]
  );

  // Skip initial animation on first render to prevent stutter
  // Use double RAF to ensure we're past layout and paint
  useEffect(() => {
    let frame1, frame2;
    frame1 = requestAnimationFrame(() => {
      setHasMounted(true);
      // Second RAF ensures we're fully rendered before enabling animations
      frame2 = requestAnimationFrame(() => {
        setIsReady(true);
      });
    });
    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, []);

  // Reset local completed cards when language changes
  useEffect(() => {
    setLocalCompletedCards(new Set());
  }, [targetLang]);

  // Load relevant flashcards based on user progress (lazy loading)
  useEffect(() => {
    let isMounted = true;

    async function loadFlashcards() {
      setIsLoadingFlashcards(true);
      try {
        // For better performance, load only relevant flashcards
        // Fall back to all flashcards if loading fails
        const relevantFlashcards = await loadRelevantFlashcards(userProgress);

        if (isMounted && relevantFlashcards.length > 0) {
          // Filter by active CEFR level if specified
          const filteredFlashcards = activeCEFRLevel
            ? relevantFlashcards.filter(
                (card) => card.cefrLevel === activeCEFRLevel
              )
            : relevantFlashcards;

          // If filtering produced empty results, fall back to full dataset
          if (filteredFlashcards.length === 0 && activeCEFRLevel) {
            const fallbackFlashcards = FLASHCARD_DATA.filter(
              (card) => card.cefrLevel === activeCEFRLevel
            );
            setFlashcardData(fallbackFlashcards);
          } else {
            setFlashcardData(filteredFlashcards);
          }
        } else if (isMounted) {
          // If no relevant flashcards loaded, use all data (filtered by level)
          const filteredFlashcards = activeCEFRLevel
            ? FLASHCARD_DATA.filter(
                (card) => card.cefrLevel === activeCEFRLevel
              )
            : FLASHCARD_DATA;

          setFlashcardData(filteredFlashcards);
        }
      } catch (error) {
        console.error("Error loading flashcards:", error);
        if (isMounted) {
          // Fall back to full dataset on error (filtered by level)
          const filteredFlashcards = activeCEFRLevel
            ? FLASHCARD_DATA.filter(
                (card) => card.cefrLevel === activeCEFRLevel
              )
            : FLASHCARD_DATA;

          setFlashcardData(filteredFlashcards);
        }
      } finally {
        if (isMounted) {
          setIsLoadingFlashcards(false);
        }
      }
    }

    // Only use lazy loading if we have split data available
    // Otherwise fall back to the full FLASHCARD_DATA
    if (loadRelevantFlashcards) {
      loadFlashcards();
    }

    return () => {
      isMounted = false;
    };
  }, [userProgress, activeCEFRLevel]);

  // Memoized completion status map for O(1) lookups
  const completionMap = useMemo(() => {
    const map = new Map();
    flashcardData.forEach((card) => {
      const isCompleted =
        userProgress.flashcards?.[card.id]?.completed ||
        localCompletedCards.has(card.id);
      map.set(card.id, isCompleted);
    });
    return map;
  }, [userProgress.flashcards, localCompletedCards, flashcardData]);

  // Memoized card index map for O(1) lookups
  const cardIndexMap = useMemo(() => {
    const map = new Map();
    flashcardData.forEach((card, index) => {
      map.set(card.id, index);
    });
    return map;
  }, [flashcardData]);

  // Find first uncompleted card (memoized)
  const firstUncompletedCard = useMemo(() => {
    return flashcardData.find((card) => !completionMap.get(card.id));
  }, [completionMap, flashcardData]);

  // Memoized first uncompleted index
  const firstUncompletedIndex = useMemo(() => {
    return firstUncompletedCard
      ? cardIndexMap.get(firstUncompletedCard.id)
      : -1;
  }, [firstUncompletedCard, cardIndexMap]);

  // Separate completed and upcoming cards (memoized)
  const completedCards = useMemo(() => {
    return flashcardData.filter((card) => completionMap.get(card.id));
  }, [completionMap, flashcardData]);

  const upcomingCards = useMemo(() => {
    return flashcardData.filter((card) => !completionMap.get(card.id));
  }, [completionMap, flashcardData]);

  // Memoized card status lookup
  const cardStatusMap = useMemo(() => {
    const statusMap = new Map();
    flashcardData.forEach((card) => {
      if (completionMap.get(card.id)) {
        statusMap.set(card.id, "completed");
      } else if (card.id === firstUncompletedCard?.id) {
        statusMap.set(card.id, "active");
      } else {
        const cardIndex = cardIndexMap.get(card.id);
        if (cardIndex > firstUncompletedIndex && firstUncompletedIndex !== -1) {
          statusMap.set(card.id, "locked");
        } else {
          statusMap.set(card.id, "upcoming");
        }
      }
    });
    return statusMap;
  }, [
    completionMap,
    firstUncompletedCard,
    cardIndexMap,
    firstUncompletedIndex,
    flashcardData,
  ]);

  // Get card status - now just a lookup
  const getCardStatus = useCallback(
    (card) => {
      return cardStatusMap.get(card.id) || "upcoming";
    },
    [cardStatusMap]
  );

  const handleCardClick = useCallback((card, status) => {
    if (status === "active") {
      playSound(modeSwitcherSound);
      setPracticeCard(card);
      setIsPracticeOpen(true);
    }
  }, [playSound]);

  const handleComplete = useCallback(
    (card) => {
      if (isRandomPractice) {
        // Random practice: remove from local completed to add back to deck
        setLocalCompletedCards((prev) => {
          const next = new Set(prev);
          next.delete(card.id);
          return next;
        });

        // Call random practice callback (awards XP, resets card in DB)
        if (onRandomPractice) {
          onRandomPractice(card);
        }
      } else {
        // Normal practice: add to local completed cards immediately for instant UI update
        setLocalCompletedCards((prev) => new Set([...prev, card.id]));

        // Call parent callback if provided
        if (onStartFlashcard) {
          onStartFlashcard(card);
        }
      }

      setIsPracticeOpen(false);
      setPracticeCard(null);
      setIsRandomPractice(false);
    },
    [onStartFlashcard, onRandomPractice, isRandomPractice]
  );

  const handleRandomPracticeClick = useCallback(() => {
    if (completedCards.length === 0) return;

    // Select a random card from the completed cards
    const randomIndex = Math.floor(Math.random() * completedCards.length);
    const randomCard = completedCards[randomIndex];

    setIsRandomPractice(true);
    setPracticeCard(randomCard);
    setIsPracticeOpen(true);
  }, [completedCards]);

  const handleClosePractice = useCallback(() => {
    setIsPracticeOpen(false);
    setPracticeCard(null);
    setIsRandomPractice(false);
  }, []);

  return (
    <MotionBox
      w="100%"
      minH="500px"
      position="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {/* Main container with vertical layout */}
      <VStack spacing={8} align="stretch">
        {/* Top: Active/Upcoming Cards */}
        <Box w="100%">
          {/* Upcoming cards in horizontal scrollable row */}
          {upcomingCards.length > 0 ? (
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
                  {upcomingCards.map((card) => (
                    <FlashcardCard
                      key={card.id}
                      card={card}
                      status={getCardStatus(card)}
                      onClick={() => handleCardClick(card, getCardStatus(card))}
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
                  {getTranslation("flashcard_all_done")}
                </Text>
                <Text fontSize="md" color="gray.400" textAlign="center">
                  {getTranslation("flashcard_all_completed")}
                </Text>
              </VStack>
            </MotionBox>
          )}
        </Box>

        {/* Arrow indicator */}
        {completedCards.length > 0 && (
          <Box textAlign="center" py={2}>
            <RiArrowDownLine size={32} color="rgba(255, 255, 255, 0.2)" />
          </Box>
        )}

        {/* Bottom: Completed Cards Stack */}
        {completedCards.length > 0 && (
          <Box w="100%" mt={"-6"}>
            {/* Stacked cards - centered */}
            {/* Practice Random Card Button */}
            <Box textAlign="center" mb={4}>
              <Button
                onClick={handleRandomPracticeClick}
                leftIcon={<RiShuffleLine />}
                size="lg"
                borderColor="blue.300"
                bg="transparent"
                color="white"
                _hover={{
                  borderColor: "blue.400",
                }}
              >
                {getTranslation("flashcard_practice_random")}
              </Button>
            </Box>
            <Box
              position="relative"
              w="100%"
              h="300px"
              display="flex"
              justifyContent={"center"}
            >
              <Box position="relative" w="220px" h="280px">
                <AnimatePresence initial={false}>
                  {completedCards.slice(-5).map((card, index) => (
                    <FlashcardCard
                      key={card.id}
                      card={card}
                      status="completed"
                      stackPosition={index}
                      supportLang={supportLang}
                      skipInitialAnimation={!isReady}
                    />
                  ))}
                </AnimatePresence>
              </Box>
            </Box>
          </Box>
        )}
      </VStack>

      {/* Practice Modal */}
      {practiceCard && (
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
      )}
    </MotionBox>
  );
}
