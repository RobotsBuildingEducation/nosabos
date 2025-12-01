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
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCheckLine,
  RiCloseLine,
  RiStarLine,
  RiMicLine,
  RiStopCircleLine,
  RiKeyboardLine,
} from "react-icons/ri";
import { CEFR_COLORS } from "../data/flashcardData";
import { useSpeechPractice } from "../hooks/useSpeechPractice";

const MotionBox = motion(Box);

export default function FlashcardPractice({
  card,
  isOpen,
  onClose,
  onComplete,
  targetLang = "es",
  supportLang = "en",
}) {
  const [inputMode, setInputMode] = useState("speech"); // "speech" or "text"
  const [textAnswer, setTextAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const toast = useToast();

  const cefrColor = CEFR_COLORS[card.cefrLevel];

  // Speech practice hook
  const {
    startRecording,
    stopRecording,
    isRecording,
    supportsSpeech,
  } = useSpeechPractice({
    targetText: card.translation,
    targetLang: targetLang,
    onResult: ({ recognizedText: text, evaluation }) => {
      setRecognizedText(text || "");
      checkAnswer(text || "");
    },
  });

  const checkAnswer = (answer) => {
    // Simple check: compare lowercase trimmed strings
    const userAnswer = answer.toLowerCase().trim();
    const correctAnswer = card.translation.toLowerCase().trim();

    // Allow some flexibility - check if the answer contains the correct answer or vice versa
    const correct = userAnswer === correctAnswer ||
                   userAnswer.includes(correctAnswer) ||
                   correctAnswer.includes(userAnswer);

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

  const handleTextSubmit = () => {
    checkAnswer(textAnswer);
  };

  const handleTryAgain = () => {
    setTextAnswer("");
    setRecognizedText("");
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleClose = () => {
    setTextAnswer("");
    setRecognizedText("");
    setShowResult(false);
    setIsCorrect(false);
    if (isRecording) {
      stopRecording();
    }
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && textAnswer.trim() && !showResult) {
      handleTextSubmit();
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    // Clear previous results
    setShowResult(false);
    setRecognizedText("");
    setIsCorrect(false);

    try {
      await startRecording();
    } catch (err) {
      const code = err?.code;
      if (code === "no-speech-recognition") {
        toast({
          title: "Speech recognition unavailable",
          description: "Use a Chromium-based browser with microphone access.",
          status: "warning",
          duration: 3200,
        });
      } else if (code === "mic-denied") {
        toast({
          title: "Microphone denied",
          description: "Enable microphone access in your browser settings.",
          status: "error",
          duration: 3200,
        });
      }
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
            <VStack spacing={3} py={4}>
              <Text fontSize="sm" color="gray.400" fontWeight="medium">
                Translate to {targetLang === "es" ? "Spanish" : "English"}:
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

            {/* Mode Toggle */}
            {!showResult && (
              <HStack spacing={2} justify="center">
                <Button
                  size="sm"
                  variant={inputMode === "speech" ? "solid" : "ghost"}
                  colorScheme={inputMode === "speech" ? "teal" : "gray"}
                  leftIcon={<RiMicLine />}
                  onClick={() => setInputMode("speech")}
                  isDisabled={!supportsSpeech}
                >
                  Speak
                </Button>
                <Button
                  size="sm"
                  variant={inputMode === "text" ? "solid" : "ghost"}
                  colorScheme={inputMode === "text" ? "purple" : "gray"}
                  leftIcon={<RiKeyboardLine />}
                  onClick={() => setInputMode("text")}
                >
                  Type
                </Button>
              </HStack>
            )}

            {/* Speech Mode */}
            {inputMode === "speech" && !showResult && (
              <VStack spacing={4}>
                {recognizedText && (
                  <Box
                    p={4}
                    borderRadius="lg"
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    w="100%"
                  >
                    <Text fontSize="sm" color="gray.400" mb={1}>
                      Recognized:
                    </Text>
                    <Text fontSize="lg" color="teal.200">
                      {recognizedText}
                    </Text>
                  </Box>
                )}

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
                    colorScheme={isRecording ? "red" : "teal"}
                    leftIcon={
                      isRecording ? (
                        <RiStopCircleLine size={20} />
                      ) : (
                        <RiMicLine size={20} />
                      )
                    }
                    onClick={handleRecord}
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: `0 8px 20px ${cefrColor.primary}40`,
                    }}
                    _active={{ transform: "translateY(0)" }}
                  >
                    {isRecording ? "Stop Recording" : "Start Recording"}
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* Text Mode */}
            {inputMode === "text" && !showResult && (
              <VStack spacing={4}>
                <Input
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
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
                    onClick={handleTextSubmit}
                    isDisabled={!textAnswer.trim()}
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
            )}

            {/* Result */}
            {showResult && (
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
