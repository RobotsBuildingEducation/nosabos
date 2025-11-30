import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Badge,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCheckLine, RiCloseLine, RiStarLine } from "react-icons/ri";
import { CEFR_COLORS } from "../data/flashcardData";

const MotionBox = motion(Box);

export default function FlashcardPractice({ card, isOpen, onClose, onComplete }) {
  const [answer, setAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const cefrColor = CEFR_COLORS[card.cefrLevel];

  const handleSubmit = () => {
    // Simple check: compare lowercase trimmed strings
    const userAnswer = answer.toLowerCase().trim();
    const correctAnswer = card.translation.toLowerCase().trim();
    const correct = userAnswer === correctAnswer;

    setIsCorrect(correct);
    setShowResult(true);

    // If correct, award XP and mark complete after a delay
    if (correct) {
      setTimeout(() => {
        onComplete(card);
        handleClose();
      }, 2000);
    }
  };

  const handleTryAgain = () => {
    setAnswer("");
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleClose = () => {
    setAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && answer.trim() && !showResult) {
      handleSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
      <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.700" />
      <ModalContent
        bg="gray.900"
        borderRadius="2xl"
        overflow="hidden"
        boxShadow={`0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 2px ${cefrColor.primary}40`}
        border="2px solid"
        borderColor={`${cefrColor.primary}30`}
      >
        {/* Decorative gradient background */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          h="200px"
          bgGradient={`linear(135deg, ${cefrColor.primary}20, transparent)`}
          opacity={0.5}
          pointerEvents="none"
        />

        <ModalBody p={8} position="relative">
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <HStack justify="space-between">
              <Badge
                px={4}
                py={2}
                borderRadius="full"
                bg={cefrColor.primary}
                color="white"
                fontSize="md"
                fontWeight="black"
                boxShadow={`0 2px 12px ${cefrColor.primary}60`}
              >
                {card.cefrLevel}
              </Badge>

              <HStack spacing={2}>
                <RiStarLine size={20} color="#FCD34D" />
                <Text fontSize="lg" fontWeight="bold" color="white">
                  {card.xpReward} XP
                </Text>
              </HStack>
            </HStack>

            {/* Question */}
            <VStack spacing={3} py={6}>
              <Text fontSize="sm" color="gray.400" fontWeight="medium">
                Translate to Spanish:
              </Text>
              <Text
                fontSize="4xl"
                fontWeight="black"
                color="white"
                textAlign="center"
              >
                {card.concept}
              </Text>
            </VStack>

            {/* Input field */}
            {!showResult ? (
              <VStack spacing={4}>
                <Input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer..."
                  size="lg"
                  fontSize="2xl"
                  textAlign="center"
                  bg="whiteAlpha.100"
                  border="2px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: "gray.500" }}
                  _focus={{
                    borderColor: cefrColor.primary,
                    boxShadow: `0 0 0 1px ${cefrColor.primary}`,
                  }}
                  autoFocus
                />

                <HStack spacing={3} w="100%">
                  <Button
                    flex={1}
                    size="lg"
                    variant="ghost"
                    color="gray.400"
                    onClick={handleClose}
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    flex={1}
                    size="lg"
                    bgGradient={cefrColor.gradient}
                    color="white"
                    onClick={handleSubmit}
                    isDisabled={!answer.trim()}
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: `0 8px 20px ${cefrColor.primary}40`,
                    }}
                    _active={{ transform: "translateY(0)" }}
                  >
                    Check Answer
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <AnimatePresence>
                <MotionBox
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <VStack
                    spacing={4}
                    p={6}
                    borderRadius="xl"
                    bg={isCorrect ? "green.900" : "red.900"}
                    border="2px solid"
                    borderColor={isCorrect ? "green.500" : "red.500"}
                  >
                    <HStack spacing={3}>
                      {isCorrect ? (
                        <RiCheckLine size={32} color="#22C55E" />
                      ) : (
                        <RiCloseLine size={32} color="#EF4444" />
                      )}
                      <Text fontSize="2xl" fontWeight="bold" color="white">
                        {isCorrect ? "Correct!" : "Not quite..."}
                      </Text>
                    </HStack>

                    {!isCorrect && (
                      <VStack spacing={2}>
                        <Text fontSize="sm" color="gray.400">
                          Correct answer:
                        </Text>
                        <Text fontSize="xl" fontWeight="bold" color="white">
                          {card.translation}
                        </Text>
                      </VStack>
                    )}

                    {isCorrect ? (
                      <HStack spacing={2} color="yellow.400">
                        <RiStarLine size={20} />
                        <Text fontSize="lg" fontWeight="bold">
                          +{card.xpReward} XP
                        </Text>
                      </HStack>
                    ) : (
                      <Button
                        size="lg"
                        colorScheme="red"
                        variant="outline"
                        onClick={handleTryAgain}
                        mt={2}
                      >
                        Try Again
                      </Button>
                    )}
                  </VStack>
                </MotionBox>
              </AnimatePresence>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
