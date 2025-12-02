import React, { useState } from "react";
import { Box, VStack, HStack, Text, Button, Badge } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiStarLine,
  RiCheckLine,
  RiArrowDownLine,
  RiLockLine,
} from "react-icons/ri";
import {
  FLASHCARD_DATA,
  CEFR_COLORS,
  getConceptText,
} from "../data/flashcardData";
import FlashcardPractice from "./FlashcardPractice";

const MotionBox = motion(Box);

function FlashcardCard({ card, status, onClick, stackPosition, supportLang }) {
  const cefrColor = CEFR_COLORS[card.cefrLevel];
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isLocked = status === "locked";
  const isStacked = stackPosition !== undefined;

  // Stacking offset for completed cards
  const stackOffset = isStacked ? stackPosition * 2 : 0;

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isLocked ? 0.4 : 1,
        scale: isStacked ? 0.95 - stackPosition * 0.02 : 1,
        y: isStacked ? stackOffset : 0,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
      }}
      onClick={onClick}
      cursor={isActive ? "pointer" : isLocked ? "not-allowed" : "default"}
      position={isStacked ? "absolute" : "relative"}
      left={isStacked ? "50%" : "auto"}
      transform={isStacked ? "translateX(-50%)" : "none"}
      top={isStacked ? 0 : "auto"}
      w="220px"
      h="280px"
      flexShrink={0}
      zIndex={isStacked ? 100 - stackPosition : 1}
      filter={isLocked ? "grayscale(100%)" : "none"}
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
            ? `0 20px 60px ${cefrColor.primary}40, 0 0 0 2px ${cefrColor.primary}30`
            : isCompleted
            ? "0 10px 30px rgba(0, 0, 0, 0.3)"
            : "0 15px 40px rgba(0, 0, 0, 0.4)"
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
          <Badge
            px={4}
            py={2}
            borderRadius="full"
            bg={isCompleted ? "whiteAlpha.300" : "whiteAlpha.200"}
            color="white"
            fontSize="md"
            fontWeight="black"
            border="1px solid"
            borderColor="whiteAlpha.300"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
          >
            {card.cefrLevel}
          </Badge>

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
              {getConceptText(card, supportLang)}
            </Text>
          </VStack>

          {/* Empty spacer for layout balance */}
          <Box h="40px" />
        </VStack>

        {/* Active card pulse effect */}
        {isActive && !isCompleted && (
          <Box
            position="absolute"
            inset="-2px"
            borderRadius="2xl"
            bgGradient={`linear(135deg, ${cefrColor.primary}40, transparent)`}
            animation="pulse 2s ease-in-out infinite"
            sx={{
              "@keyframes pulse": {
                "0%, 100%": { opacity: 0.3 },
                "50%": { opacity: 0.6 },
              },
            }}
          />
        )}
      </Box>
    </MotionBox>
  );
}

export default function FlashcardSkillTree({
  userProgress = { flashcards: {} },
  onStartFlashcard,
  targetLang = "es",
  supportLang = "en",
}) {
  const [practiceCard, setPracticeCard] = useState(null);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [localCompletedCards, setLocalCompletedCards] = useState(new Set());

  // Determine card status based on user progress and local state
  const getCardStatus = (card) => {
    if (
      userProgress.flashcards?.[card.id]?.completed ||
      localCompletedCards.has(card.id)
    ) {
      return "completed";
    }

    // Find the first uncompleted card in the original data array
    const firstUncompletedCard = FLASHCARD_DATA.find(
      (c) =>
        !userProgress.flashcards?.[c.id]?.completed &&
        !localCompletedCards.has(c.id)
    );

    // Only the first uncompleted card is active (unlocked)
    if (card.id === firstUncompletedCard?.id) {
      return "active";
    }

    // Cards after the first uncompleted are locked
    const cardIndex = FLASHCARD_DATA.findIndex((c) => c.id === card.id);
    const firstUncompletedIndex = FLASHCARD_DATA.findIndex(
      (c) => c.id === firstUncompletedCard?.id
    );

    if (cardIndex > firstUncompletedIndex) {
      return "locked";
    }

    return "upcoming";
  };

  // Separate completed and upcoming cards
  const completedCards = FLASHCARD_DATA.filter(
    (card) =>
      userProgress.flashcards?.[card.id]?.completed ||
      localCompletedCards.has(card.id)
  );
  const upcomingCards = FLASHCARD_DATA.filter(
    (card) =>
      !userProgress.flashcards?.[card.id]?.completed &&
      !localCompletedCards.has(card.id)
  );

  const handleCardClick = (card, status) => {
    if (status === "active") {
      setPracticeCard(card);
      setIsPracticeOpen(true);
    }
  };

  const handleComplete = (card) => {
    // Add to local completed cards immediately for instant UI update
    setLocalCompletedCards((prev) => new Set([...prev, card.id]));

    // Call parent callback if provided
    if (onStartFlashcard) {
      onStartFlashcard(card);
    }

    setIsPracticeOpen(false);
    setPracticeCard(null);
  };

  const handleClosePractice = () => {
    setIsPracticeOpen(false);
    setPracticeCard(null);
  };

  return (
    <Box w="100%" minH="500px" position="relative">
      {/* Main container with vertical layout */}
      <VStack spacing={8} align="stretch">
        {/* Top: Active/Upcoming Cards */}
        <Box w="100%">
          <VStack spacing={4} mb={4}>
            <Text fontSize="sm" fontWeight="bold" color="gray.400">
              {upcomingCards.length > 0 ? "PRACTICE" : "ALL COMPLETE!"}
            </Text>
            <HStack spacing={2}>
              <Text fontSize="3xl" fontWeight="black" color="white">
                {completedCards.length}
              </Text>
              <Text fontSize="lg" color="gray.400">
                / {FLASHCARD_DATA.length}
              </Text>
            </HStack>
          </VStack>

          {/* Upcoming cards in horizontal scrollable row */}
          {upcomingCards.length > 0 ? (
            <Box
              overflowX="auto"
              overflowY="hidden"
              w="100%"
              pb={4}
              sx={{
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              <HStack spacing={6} px={4} minW="min-content">
                <AnimatePresence mode="popLayout">
                  {upcomingCards.map((card) => (
                    <FlashcardCard
                      key={card.id}
                      card={card}
                      status={getCardStatus(card)}
                      onClick={() =>
                        handleCardClick(card, getCardStatus(card))
                      }
                      supportLang={supportLang}
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
                  All Done!
                </Text>
                <Text fontSize="md" color="gray.400" textAlign="center">
                  You've completed all flashcards!
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
          <Box w="100%">
            <VStack spacing={4} mb={6}>
              <Text fontSize="sm" fontWeight="bold" color="gray.400">
                COMPLETED
              </Text>
            </VStack>

            {/* Stacked cards - centered */}
            <Box position="relative" w="100%" h="300px">
              <Box
                position="relative"
                w="220px"
                h="280px"
                mx="auto"
              >
                <AnimatePresence>
                  {completedCards.slice(-5).map((card, index) => (
                    <FlashcardCard
                      key={card.id}
                      card={card}
                      status="completed"
                      stackPosition={index}
                      supportLang={supportLang}
                    />
                  ))}
                </AnimatePresence>
              </Box>
            </Box>
          </Box>
        )}

        {/* Progress indicator */}
        <Box w="100%">
          <HStack justify="center" spacing={2} flexWrap="wrap">
            {FLASHCARD_DATA.map((card) => {
              const isCompleted =
                userProgress.flashcards?.[card.id]?.completed ||
                localCompletedCards.has(card.id);
              return (
                <Box
                  key={card.id}
                  w="40px"
                  h="6px"
                  borderRadius="full"
                  bg={
                    isCompleted
                      ? CEFR_COLORS[card.cefrLevel].primary
                      : "whiteAlpha.200"
                  }
                  transition="all 0.3s"
                  boxShadow={
                    isCompleted
                      ? `0 0 10px ${CEFR_COLORS[card.cefrLevel].primary}60`
                      : "none"
                  }
                />
              );
            })}
          </HStack>
        </Box>
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
        />
      )}
    </Box>
  );
}
