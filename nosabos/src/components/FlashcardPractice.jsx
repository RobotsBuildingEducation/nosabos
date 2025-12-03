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
import { CEFR_COLORS, getConceptText } from "../data/flashcardData";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";

const MotionBox = motion(Box);

// Language name helper
const LANG_NAME = (code) => {
  const names = {
    es: "Spanish",
    en: "English",
    pt: "Portuguese",
    fr: "French",
    it: "Italian",
    nah: "Nahuatl",
  };
  return names[code] || code;
};

// Build AI grading prompt for flashcard translation
function buildFlashcardJudgePrompt({
  concept,
  userAnswer,
  targetLang,
  supportLang,
  cefrLevel,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);

  return `
Judge a flashcard translation from ${SUPPORT} to ${TARGET} (CEFR ${cefrLevel}).

Original (${SUPPORT}):
${concept}

User's translation (${TARGET}):
${userAnswer}

Policy:
- Say YES if the translation accurately conveys the meaning in ${TARGET}.
- Allow natural variations and synonyms that maintain the core meaning.
- Ignore minor grammatical errors if the meaning is clear.
- Allow missing or incorrect accent marks/diacritics.
- For common phrases, accept culturally appropriate equivalents.
- If the meaning is significantly wrong or incomprehensible, say NO.

Reply with ONE of these formats:
YES | <xp_amount>
NO

Where <xp_amount> is 4-7 based on:
- 7 XP: Perfect translation with natural phrasing
- 6 XP: Correct meaning with minor imperfections
- 5 XP: Acceptable translation with some awkwardness
- 4 XP: Barely acceptable but conveys basic meaning
`.trim();
}

export default function FlashcardPractice({
  card,
  isOpen,
  onClose,
  onComplete,
  targetLang = "es",
  supportLang = "en",
}) {
  const [textAnswer, setTextAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [xpAwarded, setXpAwarded] = useState(0);
  const [isGrading, setIsGrading] = useState(false);
  const toast = useToast();

  const cefrColor = CEFR_COLORS[card.cefrLevel];

  // Speech practice hook
  const {
    startRecording,
    stopRecording,
    isRecording,
    supportsSpeech,
  } = useSpeechPractice({
    targetText: "answer", // Placeholder - we use AI grading instead of strict matching
    targetLang: targetLang,
    onResult: ({ recognizedText, evaluation, error }) => {
      if (error) {
        toast({
          title: "Could not evaluate",
          description: "Please try again with a stable connection.",
          status: "error",
          duration: 2500,
        });
        return;
      }

      const text = recognizedText || "";
      setRecognizedText(text);
      if (text && text.trim()) {
        checkAnswerWithAI(text);
      }
    },
  });

  const checkAnswerWithAI = async (answer) => {
    setIsGrading(true);

    try {
      const response = await callResponses({
        model: DEFAULT_RESPONSES_MODEL,
        input: buildFlashcardJudgePrompt({
          concept: getConceptText(card, supportLang),
          userAnswer: answer,
          targetLang,
          supportLang,
          cefrLevel: card.cefrLevel,
        }),
      });

      // Parse response: "YES | 6" or "NO"
      const trimmed = (response || "").trim().toUpperCase();
      const isYes = trimmed.startsWith("YES");

      let xp = 5; // default
      if (isYes && trimmed.includes("|")) {
        const parts = trimmed.split("|");
        const xpPart = parseInt(parts[1]?.trim());
        if (xpPart >= 4 && xpPart <= 7) {
          xp = xpPart;
        }
      }

      setIsCorrect(isYes);
      setXpAwarded(xp);
      setShowResult(true);

      // If correct, award XP and mark complete after a delay
      if (isYes) {
        setTimeout(() => {
          onComplete({ ...card, xpReward: xp });
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error("AI grading error:", error);
      toast({
        title: "Grading error",
        description: "Failed to grade your answer. Please try again.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleTextSubmit = () => {
    if (textAnswer.trim()) {
      checkAnswerWithAI(textAnswer);
    }
  };

  const handleTryAgain = () => {
    setTextAnswer("");
    setRecognizedText("");
    setShowResult(false);
    setIsCorrect(false);
    setXpAwarded(0);
  };

  const handleClose = () => {
    setTextAnswer("");
    setRecognizedText("");
    setShowResult(false);
    setIsCorrect(false);
    setXpAwarded(0);
    if (isRecording) {
      stopRecording();
    }
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && textAnswer.trim() && !showResult && !isGrading) {
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
    setXpAwarded(0);

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

              <Text fontSize="sm" color="gray.400" fontWeight="medium">
                {LANG_NAME(supportLang)} → {LANG_NAME(targetLang)}
              </Text>
            </HStack>

            {/* Question */}
            <VStack spacing={3} py={4}>
              <Text fontSize="sm" color="gray.400" fontWeight="medium">
                Translate to {LANG_NAME(targetLang)}:
              </Text>
              <Text
                fontSize="4xl"
                fontWeight="black"
                color="white"
                textAlign="center"
              >
                {getConceptText(card, supportLang)}
              </Text>
            </VStack>

            {/* Unified Input - Show both text and speech */}
            {!showResult && (
              <VStack spacing={4}>
                {/* Grading State */}
                {isGrading ? (
                  <VStack spacing={3} py={4}>
                    <Spinner size="lg" color={cefrColor.primary} />
                    <Text color="gray.400">Grading your answer...</Text>
                  </VStack>
                ) : (
                  <VStack spacing={4} w="100%">
                    {/* Record Button - Top */}
                    <Button
                      w="100%"
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
                      isDisabled={!supportsSpeech}
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 20px ${cefrColor.primary}40`,
                      }}
                      _active={{ transform: "translateY(0)" }}
                    >
                      {isRecording ? "Stop Recording" : "Record Answer"}
                    </Button>

                    {/* Recognized speech text */}
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

                    {/* Text Input and Submit Group */}
                    <VStack spacing={3} w="100%" pt={2}>
                      {/* Text Input */}
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

                      {/* Submit Button */}
                      <Button
                        w="100%"
                        size="lg"
                        bgGradient={cefrColor.gradient}
                        color="white"
                        onClick={handleTextSubmit}
                        isDisabled={!textAnswer.trim()}
                        leftIcon={<RiKeyboardLine size={20} />}
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: `0 8px 20px ${cefrColor.primary}40`,
                        }}
                        _active={{ transform: "translateY(0)" }}
                      >
                        Submit Answer
                      </Button>
                    </VStack>

                    {/* Cancel button */}
                    <Button
                      w="100%"
                      size="md"
                      variant="ghost"
                      color="gray.400"
                      onClick={handleClose}
                      _hover={{ bg: "whiteAlpha.100" }}
                    >
                      Cancel
                    </Button>
                  </VStack>
                )}
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

                    {isCorrect ? (
                      <HStack spacing={2} color="yellow.400">
                        <RiStarLine size={20} />
                        <Text fontSize="lg" fontWeight="bold">
                          +{xpAwarded} XP
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
