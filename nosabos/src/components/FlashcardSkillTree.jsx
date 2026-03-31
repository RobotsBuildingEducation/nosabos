import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, VStack, HStack, Text, Button, Badge } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiStarLine,
  RiCheckLine,
  RiLockLine,
  RiArrowRightLine,
  RiFireLine,
  RiHistoryLine,
  RiPlantLine,
  RiTrophyLine,
} from "react-icons/ri";
import {
  FLASHCARD_DATA,
  loadRelevantFlashcards,
} from "../data/flashcardData";
import { CEFR_COLORS, getConceptText } from "../data/flashcards/common";
import FlashcardPractice from "./FlashcardPractice";
import { translations } from "../utils/translation";
import { getLanguageXp } from "../utils/progressTracking";
import {
  FLASHCARD_SESSION_LIMITS,
  buildFlashcardSession,
  createFlashcardReviewUpdate,
  getFlashcardReviewBuckets,
} from "../utils/flashcardScheduler";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";

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
const EMPTY_SESSION = {
  mode: null,
  label: "",
  description: "",
  queue: [],
  index: 0,
};

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
        bg={isActive ? "#08142b" : undefined}
        bgGradient={
          isActive
            ? undefined
            : isCompleted
            ? "linear(135deg, whiteAlpha.100, whiteAlpha.50)"
            : cefrColor.gradient
        }
        borderRadius="2xl"
        border="2px solid"
        borderColor={isCompleted ? "whiteAlpha.200" : isActive ? "rgba(56,189,248,0.3)" : `${cefrColor.primary}80`}
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
        {/* Decorative gradient overlay */}
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
  onRandomPractice, // Callback for review completion on already completed cards
  onFlashcardAttempt,
  targetLang = "es",
  supportLang = "en",
  activeCEFRLevel = null, // Filter flashcards by CEFR level
  pauseMs = 2000,
}) {
  const [sessionState, setSessionState] = useState(EMPTY_SESSION);
  const [localProgressOverrides, setLocalProgressOverrides] = useState({});
  // Initialize with filtered data to prevent flicker
  const [flashcardData, setFlashcardData] = useState(() =>
    activeCEFRLevel
      ? FLASHCARD_DATA.filter((card) => card.cefrLevel === activeCEFRLevel)
      : FLASHCARD_DATA
  );
  const [, setIsLoadingFlashcards] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Sound settings
  const playSound = useSoundSettings((s) => s.playSound);

  const languageXp = useMemo(
    () => getLanguageXp(userProgress, targetLang),
    [userProgress, targetLang]
  );

  // Enable animations after first render (single RAF is sufficient)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Reset local review state when language changes
  useEffect(() => {
    setLocalProgressOverrides({});
    setSessionState(EMPTY_SESSION);
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

  const mergedFlashcardProgress = useMemo(
    () => ({
      ...(userProgress.flashcards || {}),
      ...localProgressOverrides,
    }),
    [userProgress.flashcards, localProgressOverrides]
  );

  // Memoized completion status map for O(1) lookups
  const completionMap = useMemo(() => {
    const map = new Map();
    flashcardData.forEach((card) => {
      map.set(card.id, mergedFlashcardProgress?.[card.id]?.completed === true);
    });
    return map;
  }, [mergedFlashcardProgress, flashcardData]);

  // Find first uncompleted card (memoized)
  const firstUncompletedCard = useMemo(() => {
    return flashcardData.find((card) => !completionMap.get(card.id));
  }, [completionMap, flashcardData]);

  // Separate completed and upcoming cards (memoized)
  const completedCards = useMemo(() => {
    return flashcardData.filter((card) => completionMap.get(card.id));
  }, [completionMap, flashcardData]);

  const upcomingCards = useMemo(() => {
    return flashcardData.filter((card) => !completionMap.get(card.id));
  }, [completionMap, flashcardData]);

  const reviewBuckets = useMemo(
    () =>
      getFlashcardReviewBuckets({
        flashcardData,
        progressMap: mergedFlashcardProgress,
      }),
    [flashcardData, mergedFlashcardProgress]
  );

  // Get card status - now just a lookup
  const getCardStatus = useCallback(
    (card) => {
      if (completionMap.get(card.id)) return "completed";
      if (card.id === firstUncompletedCard?.id) return "active";
      return "locked";
    },
    [completionMap, firstUncompletedCard]
  );

  const practiceCard = sessionState.queue?.[sessionState.index] || null;

  const sessionCopy = useMemo(
    () => ({
      smart: {
        title: getTranslation("flashcard_session_smart_title"),
        description: getTranslation("flashcard_session_smart_desc"),
        cta: getTranslation("flashcard_session_smart_cta"),
        icon: RiHistoryLine,
        color: "cyan.300",
        accent: "rgba(34, 211, 238, 0.22)",
        count: reviewBuckets.dueCards.length,
        helper:
          reviewBuckets.dueCards.length > 0
            ? getTranslation("flashcard_session_due_count", {
                count: reviewBuckets.dueCards.length,
              })
            : getTranslation("flashcard_session_due_empty"),
      },
      challenge: {
        title: getTranslation("flashcard_session_challenge_title"),
        description: getTranslation("flashcard_session_challenge_desc"),
        cta: getTranslation("flashcard_session_challenge_cta"),
        icon: RiFireLine,
        color: "orange.300",
        accent: "rgba(249, 115, 22, 0.22)",
        count: reviewBuckets.weakCards.length,
        helper:
          reviewBuckets.weakCards.length > 0
            ? getTranslation("flashcard_session_weak_count", {
                count: reviewBuckets.weakCards.length,
              })
            : getTranslation("flashcard_session_weak_empty"),
      },
      learn: {
        title: getTranslation("flashcard_session_learn_title"),
        description: getTranslation("flashcard_session_learn_desc"),
        cta: getTranslation("flashcard_session_learn_cta"),
        icon: RiPlantLine,
        color: "green.300",
        accent: "rgba(74, 222, 128, 0.22)",
        count: upcomingCards.length,
        helper:
          upcomingCards.length > 0
            ? getTranslation("flashcard_session_new_count", {
                count: upcomingCards.length,
              })
            : getTranslation("flashcard_session_new_empty"),
      },
    }),
    [reviewBuckets.dueCards.length, reviewBuckets.weakCards.length, upcomingCards.length]
  );

  const previewCards = useMemo(
    () => upcomingCards.slice(0, FLASHCARD_SESSION_LIMITS.preview),
    [upcomingCards]
  );

  const recentCompletedCards = useMemo(
    () => reviewBuckets.completedCards.slice(0, 5),
    [reviewBuckets.completedCards]
  );

  const openSession = useCallback(
    (mode, queueOverride = null) => {
      const session = queueOverride
        ? {
            mode,
            label: getTranslation("flashcard_session_single_title"),
            description: getTranslation("flashcard_session_single_desc"),
            queue: queueOverride,
          }
        : buildFlashcardSession({
            flashcardData,
            progressMap: mergedFlashcardProgress,
            mode,
          });

      if (!session.queue.length) return;

      playSound(selectSound);
      setSessionState({
        mode,
        label:
          mode === "single"
            ? getTranslation("flashcard_session_single_title")
            : sessionCopy[mode]?.title || session.label,
        description:
          mode === "single"
            ? getTranslation("flashcard_session_single_desc")
            : sessionCopy[mode]?.description || session.description,
        queue: session.queue,
        index: 0,
      });
    },
    [
      flashcardData,
      mergedFlashcardProgress,
      playSound,
      sessionCopy,
    ]
  );

  const closeSession = useCallback(() => {
    setSessionState(EMPTY_SESSION);
  }, []);

  const applyReviewOutcome = useCallback(
    (card, outcome) => {
      const existingProgress = mergedFlashcardProgress?.[card.id] || {};
      const reviewPatch = createFlashcardReviewUpdate({
        previousProgress: existingProgress,
        outcome,
      });

      const nextProgress = {
        ...existingProgress,
        ...reviewPatch,
      };

      setLocalProgressOverrides((prev) => ({
        ...prev,
        [card.id]: nextProgress,
      }));

      return {
        ...card,
        reviewPatch,
      };
    },
    [mergedFlashcardProgress]
  );

  const handleAttempt = useCallback(
    (card) => {
      const payload = applyReviewOutcome(card, "incorrect");
      onFlashcardAttempt?.(payload);
    },
    [applyReviewOutcome, onFlashcardAttempt]
  );

  const handleComplete = useCallback(
    (card) => {
      const alreadyCompleted =
        mergedFlashcardProgress?.[card.id]?.completed === true;
      const payload = applyReviewOutcome(card, "correct");

      if (alreadyCompleted) {
        onRandomPractice?.(payload);
      } else {
        onStartFlashcard?.(payload);
      }

      setSessionState((prev) => {
        const nextIndex = prev.index + 1;
        if (nextIndex >= prev.queue.length) {
          return EMPTY_SESSION;
        }

        return {
          ...prev,
          index: nextIndex,
        };
      });
    },
    [
      applyReviewOutcome,
      mergedFlashcardProgress,
      onRandomPractice,
      onStartFlashcard,
    ]
  );

  const handleCardClick = useCallback(
    (card, status) => {
      if (status !== "active") return;
      openSession("single", [card]);
    },
    [openSession]
  );

  return (
    <Box w="100%" minH="500px" position="relative">
      <VStack spacing={8} align="stretch">
        <Box
          p={{ base: 5, md: 7 }}
          borderRadius="3xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          bg="#091a36"
          position="relative"
          overflow="hidden"
          sx={{
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.24), transparent 32%), radial-gradient(circle at 85% 10%, rgba(45,212,191,0.16), transparent 28%), radial-gradient(circle at 50% 100%, rgba(16,185,129,0.18), transparent 45%)",
              pointerEvents: "none",
            },
          }}
        >
          <VStack spacing={6} align="stretch" position="relative" zIndex={1}>
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
              <VStack align="start" spacing={2} maxW="560px">
                <Badge
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg="whiteAlpha.200"
                  color="white"
                  textTransform="none"
                  fontSize="xs"
                >
                  {activeCEFRLevel || firstUncompletedCard?.cefrLevel || "CEFR"}
                </Badge>
                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="black" color="white">
                  {getTranslation("flashcard_training_title")}
                </Text>
                <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.6">
                  {getTranslation("flashcard_training_subtitle")}
                </Text>
              </VStack>

              <HStack spacing={3} flexWrap="wrap" justify="flex-end">
                <Badge
                  px={3}
                  py={2}
                  borderRadius="xl"
                  bg="rgba(34,211,238,0.16)"
                  color="cyan.100"
                  textTransform="none"
                >
                  {getTranslation("flashcard_due_now_stat", {
                    count: reviewBuckets.dueCards.length,
                  })}
                </Badge>
                <Badge
                  px={3}
                  py={2}
                  borderRadius="xl"
                  bg="rgba(249,115,22,0.18)"
                  color="orange.100"
                  textTransform="none"
                >
                  {getTranslation("flashcard_weak_stat", {
                    count: reviewBuckets.weakCards.length,
                  })}
                </Badge>
                <Badge
                  px={3}
                  py={2}
                  borderRadius="xl"
                  bg="rgba(74,222,128,0.16)"
                  color="green.100"
                  textTransform="none"
                >
                  {getTranslation("flashcard_new_stat", {
                    count: upcomingCards.length,
                  })}
                </Badge>
              </HStack>
            </HStack>

            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "repeat(3, minmax(0, 1fr))" }}
              gap={4}
            >
              {Object.entries(sessionCopy).map(([mode, config]) => {
                const Icon = config.icon;

                return (
                  <MotionBox
                    key={mode}
                    initial={isReady ? { opacity: 0, y: 12 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  >
                    <Box
                      h="100%"
                      p={5}
                      borderRadius="2xl"
                      bg="rgba(5, 16, 36, 0.78)"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      boxShadow="0 18px 40px rgba(0, 0, 0, 0.24)"
                    >
                      <VStack align="stretch" spacing={4} h="100%">
                        <HStack justify="space-between" align="start">
                          <Box
                            w="44px"
                            h="44px"
                            borderRadius="xl"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bg={config.accent}
                            color={config.color}
                          >
                            <Icon size={22} />
                          </Box>
                          <Badge
                            px={3}
                            py={1}
                            borderRadius="full"
                            bg="whiteAlpha.100"
                            color="white"
                            textTransform="none"
                          >
                            {config.count}
                          </Badge>
                        </HStack>

                        <VStack align="start" spacing={2} flex={1}>
                          <Text fontSize="xl" fontWeight="bold" color="white">
                            {config.title}
                          </Text>
                          <Text color="whiteAlpha.800" lineHeight="1.6">
                            {config.description}
                          </Text>
                          <Text fontSize="sm" color={config.color}>
                            {config.helper}
                          </Text>
                        </VStack>

                        <Button
                          onClick={() => openSession(mode)}
                          leftIcon={<Icon />}
                          rightIcon={<RiArrowRightLine />}
                          isDisabled={config.count === 0 && mode !== "learn"}
                          bg="white"
                          color="black"
                          _hover={{ transform: "translateY(-2px)" }}
                          _active={{ transform: "translateY(0)" }}
                        >
                          {config.cta}
                        </Button>
                      </VStack>
                    </Box>
                  </MotionBox>
                );
              })}
            </Box>
          </VStack>
        </Box>

        {upcomingCards.length > 0 ? (
          <Box w="100%">
            <HStack justify="space-between" align="end" mb={3} px={1}>
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {getTranslation("flashcard_continue_title")}
                </Text>
                <Text fontSize="sm" color="gray.400">
                  {getTranslation("flashcard_continue_desc")}
                </Text>
              </VStack>
              <Badge
                px={3}
                py={1}
                borderRadius="full"
                bg="whiteAlpha.100"
                color="white"
                textTransform="none"
              >
                {getTranslation("flashcard_remaining_count", {
                  count: upcomingCards.length,
                })}
              </Badge>
            </HStack>

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
                  {previewCards.map((card) => (
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

        {completedCards.length > 0 && (
          <Box w="100%">
            <HStack justify="space-between" align="end" mb={3} px={1}>
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {getTranslation("flashcard_mastered_title")}
                </Text>
                <Text fontSize="sm" color="gray.400">
                  {getTranslation("flashcard_mastered_desc")}
                </Text>
              </VStack>
              <Badge
                px={3}
                py={1}
                borderRadius="full"
                bg="whiteAlpha.100"
                color="white"
                textTransform="none"
              >
                {getTranslation("flashcard_scheduled_count", {
                  count: reviewBuckets.scheduledCards.length,
                })}
              </Badge>
            </HStack>

            <Box position="relative" w="100%" h="300px" display="flex" justifyContent="center">
              <Box position="relative" w="220px" h="280px">
                <AnimatePresence initial={false}>
                  {recentCompletedCards.map((card, index) => (
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

            <HStack
              mt={2}
              spacing={3}
              justify="center"
              flexWrap="wrap"
            >
              <Badge
                px={3}
                py={1}
                borderRadius="full"
                bg="rgba(16,185,129,0.16)"
                color="green.100"
                textTransform="none"
              >
                <HStack spacing={2}>
                  <RiTrophyLine />
                  <Text>{getTranslation("flashcard_mastered_badge")}</Text>
                </HStack>
              </Badge>
              <Badge
                px={3}
                py={1}
                borderRadius="full"
                bg="rgba(59,130,246,0.16)"
                color="blue.100"
                textTransform="none"
              >
                <HStack spacing={2}>
                  <RiStarLine />
                  <Text>
                    {getTranslation("flashcard_xp_level_badge", {
                      level: Math.floor(languageXp / 100) + 1,
                    })}
                  </Text>
                </HStack>
              </Badge>
            </HStack>
          </Box>
        )}
      </VStack>

      {/* Practice Modal */}
      {practiceCard && (
        <FlashcardPractice
          card={practiceCard}
          isOpen={Boolean(practiceCard)}
          onClose={closeSession}
          onComplete={handleComplete}
          onAttempt={handleAttempt}
          targetLang={targetLang}
          supportLang={supportLang}
          pauseMs={pauseMs}
          languageXp={languageXp}
          sessionLabel={sessionState.label}
          sessionIndex={sessionState.index}
          sessionTotal={sessionState.queue.length}
        />
      )}
    </Box>
  );
}
