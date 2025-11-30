import React, { useState } from "react";
import { Box, VStack, HStack, Text, Button, Badge } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { RiStarLine, RiCheckLine, RiArrowRightLine, RiLockLine } from "react-icons/ri";
import { FLASHCARD_DATA, CEFR_COLORS } from "../data/flashcardData";
import FlashcardPractice from "./FlashcardPractice";

const MotionBox = motion(Box);

function FlashcardCard({ card, status, onClick, stackPosition }) {
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
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{
        opacity: isLocked ? 0.4 : 1,
        x: 0,
        scale: isStacked ? 0.95 - stackPosition * 0.02 : 1,
        y: isStacked ? stackOffset : 0,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
      }}
      whileHover={isActive ? { scale: 1.05, y: -8 } : {}}
      onClick={onClick}
      cursor={isActive ? "pointer" : isLocked ? "not-allowed" : "default"}
      position={isStacked ? "absolute" : "relative"}
      left={isStacked ? 0 : "auto"}
      top={isStacked ? 0 : "auto"}
      w="280px"
      h="360px"
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
          <HStack w="100%" justify="space-between" align="start">
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

            {/* XP Badge */}
            <HStack
              px={3}
              py={1.5}
              borderRadius="full"
              bg="whiteAlpha.200"
              border="1px solid"
              borderColor="whiteAlpha.300"
              spacing={1}
            >
              <RiStarLine size={16} color="#FCD34D" />
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="white"
                textShadow="0 1px 2px rgba(0,0,0,0.3)"
              >
                {card.xpReward} XP
              </Text>
            </HStack>
          </HStack>

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
              {card.concept}
            </Text>

            <Box
              w="80%"
              h="1px"
              bgGradient="linear(to-r, transparent, whiteAlpha.400, transparent)"
            />

            <Text
              fontSize="xl"
              fontWeight="semibold"
              color="whiteAlpha.900"
              textAlign="center"
              fontStyle="italic"
            >
              {card.translation}
            </Text>
          </VStack>

          {/* Category tag */}
          <Box
            px={4}
            py={2}
            borderRadius="full"
            bg="blackAlpha.300"
            border="1px solid"
            borderColor="whiteAlpha.200"
          >
            <Text fontSize="xs" fontWeight="medium" color="whiteAlpha.800">
              {card.category}
            </Text>
          </Box>
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
}) {
  const [practiceCard, setPracticeCard] = useState(null);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);

  // Determine card status based on user progress
  const getCardStatus = (cardId, index) => {
    if (userProgress.flashcards?.[cardId]?.completed) {
      return "completed";
    }

    // Find the first uncompleted card
    const firstUncompletedIndex = FLASHCARD_DATA.findIndex(
      (card) => !userProgress.flashcards?.[card.id]?.completed
    );

    // Only the first uncompleted card is active (unlocked)
    if (index === firstUncompletedIndex) {
      return "active";
    }

    // Cards after the first uncompleted are locked
    if (index > firstUncompletedIndex) {
      return "locked";
    }

    return "upcoming";
  };

  // Separate completed and upcoming cards
  const completedCards = FLASHCARD_DATA.filter(
    (card) => userProgress.flashcards?.[card.id]?.completed
  );
  const upcomingCards = FLASHCARD_DATA.filter(
    (card) => !userProgress.flashcards?.[card.id]?.completed
  );

  const handleCardClick = (card, status) => {
    if (status === "active") {
      setPracticeCard(card);
      setIsPracticeOpen(true);
    }
  };

  const handleComplete = (card) => {
    // Mark card as completed and award XP
    if (onStartFlashcard) {
      // We'll use onStartFlashcard as onComplete callback
      // This should update userProgress in the parent component
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
      {/* Main container with horizontal layout */}
      <HStack
        spacing={0}
        align="center"
        justify="space-between"
        w="100%"
        h="500px"
        position="relative"
      >
        {/* Left: Completed Cards Stack */}
        <Box position="relative" w="320px" h="100%" flexShrink={0}>
          {completedCards.length > 0 ? (
            <>
              <VStack spacing={4} align="start" mb={4}>
                <Text fontSize="sm" fontWeight="bold" color="gray.400">
                  COMPLETED
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

              {/* Stacked cards */}
              <Box position="relative" w="280px" h="360px" mt={8}>
                <AnimatePresence>
                  {completedCards.slice(-5).map((card, index) => (
                    <FlashcardCard
                      key={card.id}
                      card={card}
                      status="completed"
                      stackPosition={index}
                    />
                  ))}
                </AnimatePresence>
              </Box>
            </>
          ) : (
            <VStack
              spacing={4}
              align="center"
              justify="center"
              h="100%"
              opacity={0.4}
            >
              <Box
                w="280px"
                h="360px"
                borderRadius="2xl"
                border="2px dashed"
                borderColor="whiteAlpha.200"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="sm" color="gray.500" textAlign="center" px={6}>
                  Completed cards
                  <br />
                  will stack here
                </Text>
              </Box>
            </VStack>
          )}
        </Box>

        {/* Center: Arrow indicator */}
        <Box px={8} flexShrink={0}>
          <RiArrowRightLine size={40} color="rgba(255, 255, 255, 0.2)" />
        </Box>

        {/* Right: Upcoming Cards Chain */}
        <Box flex={1} h="100%" overflowX="auto" overflowY="hidden">
          <HStack
            spacing={6}
            h="100%"
            align="center"
            px={4}
            minW="min-content"
          >
            <AnimatePresence mode="popLayout">
              {upcomingCards.map((card, index) => (
                <FlashcardCard
                  key={card.id}
                  card={card}
                  status={getCardStatus(card.id, index)}
                  onClick={() => handleCardClick(card, getCardStatus(card.id, index))}
                />
              ))}
            </AnimatePresence>

            {upcomingCards.length === 0 && (
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
          </HStack>
        </Box>
      </HStack>

      {/* Progress indicator */}
      <Box mt={8} w="100%">
        <HStack justify="center" spacing={2}>
          {FLASHCARD_DATA.map((card) => {
            const isCompleted = userProgress.flashcards?.[card.id]?.completed;
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

      {/* Practice Modal */}
      {practiceCard && (
        <FlashcardPractice
          card={practiceCard}
          isOpen={isPracticeOpen}
          onClose={handleClosePractice}
          onComplete={handleComplete}
        />
      )}
    </Box>
  );
}
