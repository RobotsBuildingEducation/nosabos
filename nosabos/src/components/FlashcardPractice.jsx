import React, { useState, useRef } from "react";
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
  RiEyeLine,
  RiVolumeUpLine,
} from "react-icons/ri";
import { getRandomVoice } from "../utils/tts";
import { CEFR_COLORS, getConceptText } from "../data/flashcardData";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { simplemodel } from "../firebaseResources/firebaseResources";
import { translations } from "../utils/translation";

const MotionBox = motion(Box);

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
  pauseMs = 2000,
}) {
  const [textAnswer, setTextAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [xpAwarded, setXpAwarded] = useState(0);
  const [isGrading, setIsGrading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const streamingRef = useRef(false);
  const audioRef = useRef(null);
  const toast = useToast();

  const cefrColor = CEFR_COLORS[card.cefrLevel];

  // Speech practice hook
  const { startRecording, stopRecording, isRecording, supportsSpeech } =
    useSpeechPractice({
      targetText: "answer", // Placeholder - we use AI grading instead of strict matching
      targetLang: targetLang,
      onResult: ({ recognizedText, evaluation, error }) => {
        if (error) {
          toast({
            title: getTranslation("flashcard_eval_error_title"),
            description: getTranslation("flashcard_eval_error_desc"),
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
      timeoutMs: pauseMs,
    });

  const checkAnswerWithAI = async (answer) => {
    setIsGrading(true);

    try {
      const response = await callResponses({
        model: DEFAULT_RESPONSES_MODEL,
        input: buildFlashcardJudgePrompt({
          concept: getConceptText(card, getEffectiveCardLanguage(supportLang)),
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
        title: getTranslation("flashcard_grading_error_title"),
        description: getTranslation("flashcard_grading_error_desc"),
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
    setIsFlipped(false);
    setStreamedAnswer("");
    setIsStreaming(false);
    setIsPlayingAudio(false);
    streamingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
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
          title: getTranslation("flashcard_speech_unavailable_title"),
          description: getTranslation("flashcard_speech_unavailable_desc"),
          status: "warning",
          duration: 3200,
        });
      } else if (code === "mic-denied") {
        toast({
          title: getTranslation("flashcard_mic_denied_title"),
          description: getTranslation("flashcard_mic_denied_desc"),
          status: "error",
          duration: 3200,
        });
      }
    }
  };

  const handleShowAnswer = async () => {
    if (isFlipped || isStreaming) return;

    setIsFlipped(true);
    setIsStreaming(true);
    setStreamedAnswer("");
    streamingRef.current = true;

    const sourceText = getConceptText(
      card,
      getEffectiveCardLanguage(supportLang)
    );
    const prompt = `Translate "${sourceText}" to ${LANG_NAME(
      targetLang
    )}. Reply with ONLY the translated word or phrase, nothing else. No explanations, no quotes, no punctuation unless part of the translation.`;

    try {
      const result = await simplemodel.generateContentStream(prompt);

      let fullText = "";
      for await (const chunk of result.stream) {
        if (!streamingRef.current) break;

        const chunkText = typeof chunk.text === "function" ? chunk.text() : "";
        if (!chunkText) continue;

        fullText += chunkText;
        setStreamedAnswer(fullText.trim());
      }
    } catch (error) {
      console.error("Gemini streaming error:", error);
      setStreamedAnswer(getTranslation("flashcard_error_loading"));
    } finally {
      setIsStreaming(false);
      streamingRef.current = false;
    }
  };

  const handleFlipBack = () => {
    streamingRef.current = false;
    setIsFlipped(false);
    setStreamedAnswer("");
    setIsStreaming(false);
  };

  const handleListenToAnswer = async (e) => {
    e.stopPropagation(); // Prevent card flip when clicking listen button

    if (!streamedAnswer || isPlayingAudio) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlayingAudio(true);

    try {
      const res = await fetch(
        "https://proxytts-hftgya63qa-uc.a.run.app/proxyTTS",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: streamedAnswer,
            voice: getRandomVoice(),
            model: "gpt-4o-mini-tts",
            response_format: "mp3",
          }),
        }
      );

      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        setIsPlayingAudio(false);
        audioRef.current = null;
      };

      audio.onended = cleanup;
      audio.onerror = cleanup;

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsPlayingAudio(false);
      toast({
        title: "Audio error",
        description: "Could not play audio. Please try again.",
        status: "error",
        duration: 2500,
      });
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

            {/* Flip Card */}
            <Box
              position="relative"
              w="100%"
              h="140px"
              sx={{ perspective: "1000px" }}
            >
              <MotionBox
                position="absolute"
                w="100%"
                h="100%"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                {/* Front Side */}
                <Box
                  position="absolute"
                  w="100%"
                  h="100%"
                  bgGradient="linear(135deg, #1E3A8A, #2563EB, #3B82F6, #2563EB)"
                  borderRadius="xl"
                  border="2px solid"
                  borderColor="blue.400"
                  p={4}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ backfaceVisibility: "hidden" }}
                  boxShadow="0 8px 32px rgba(37, 99, 235, 0.3)"
                >
                  <Text
                    fontSize="xs"
                    color="whiteAlpha.800"
                    fontWeight="medium"
                    mb={1}
                  >
                    {getTranslation("flashcard_translate_to", {
                      language: LANG_NAME(targetLang),
                    })}
                  </Text>
                  <Text
                    fontSize="3xl"
                    fontWeight="black"
                    color="white"
                    textAlign="center"
                    textShadow="0 2px 4px rgba(0,0,0,0.2)"
                  >
                    {getConceptText(
                      card,
                      getEffectiveCardLanguage(supportLang)
                    )}
                  </Text>
                  <Button
                    position="absolute"
                    bottom={3}
                    right={3}
                    size="sm"
                    variant="solid"
                    bg="whiteAlpha.200"
                    color="white"
                    rightIcon={<RiEyeLine size={14} />}
                    onClick={handleShowAnswer}
                    _hover={{ bg: "whiteAlpha.300" }}
                    fontSize="xs"
                  >
                    {getTranslation("flashcard_show_answer")}
                  </Button>
                </Box>

                {/* Back Side */}
                <Box
                  position="absolute"
                  w="100%"
                  h="100%"
                  bgGradient="linear(135deg, #1E1B4B, #312E81, #3730A3, #4338CA)"
                  borderRadius="xl"
                  border="2px solid"
                  borderColor="blue.500"
                  p={4}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  boxShadow="0 8px 32px rgba(67, 56, 202, 0.3)"
                  cursor="pointer"
                  onClick={handleFlipBack}
                >
                  <Text
                    fontSize="xs"
                    color="blue.200"
                    fontWeight="medium"
                    mb={1}
                  >
                    {getTranslation("flashcard_answer_label")}
                  </Text>
                  {isStreaming && !streamedAnswer ? (
                    <Spinner size="md" color="blue.200" />
                  ) : (
                    <Text
                      fontSize="3xl"
                      fontWeight="black"
                      color="white"
                      textAlign="center"
                      textShadow="0 2px 4px rgba(0,0,0,0.3)"
                    >
                      {streamedAnswer || "..."}
                    </Text>
                  )}
                  {/* Listen Button */}
                  {streamedAnswer && !isStreaming && (
                    <Button
                      position="absolute"
                      bottom={3}
                      left={3}
                      size="sm"
                      variant="solid"
                      bg="whiteAlpha.200"
                      color="white"
                      leftIcon={<RiVolumeUpLine size={14} />}
                      onClick={handleListenToAnswer}
                      isLoading={isPlayingAudio}
                      loadingText={getTranslation("flashcard_listening")}
                      _hover={{ bg: "whiteAlpha.300" }}
                      fontSize="xs"
                    >
                      {getTranslation("flashcard_listen")}
                    </Button>
                  )}
                  <Text
                    position="absolute"
                    bottom={3}
                    right={3}
                    fontSize="xs"
                    color="blue.300"
                  >
                    {getTranslation("flashcard_tap_to_flip")}
                  </Text>
                </Box>
              </MotionBox>
            </Box>

            {/* Unified Input - Show both text and speech */}
            {!showResult && (
              <VStack spacing={4}>
                {/* Grading State */}
                {isGrading ? (
                  <VStack spacing={3} py={4}>
                    <Spinner size="lg" color={cefrColor.primary} />
                    <Text color="gray.400">
                      {getTranslation("flashcard_grading")}
                    </Text>
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
                      padding={9}
                      _active={{ transform: "translateY(0)" }}
                    >
                      {isRecording
                        ? getTranslation("flashcard_stop_recording")
                        : getTranslation("flashcard_record_answer")}
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
                          {getTranslation("flashcard_recognized")}
                        </Text>
                        <Text fontSize="lg" color="teal.200">
                          {recognizedText}
                        </Text>
                      </Box>
                    )}

                    {/* Text Input and Submit Group */}
                    <VStack spacing={3} w="100%" pt={6}>
                      {/* Text Input */}
                      <Input
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={getTranslation(
                          "flashcard_type_placeholder"
                        )}
                        size="lg"
                        fontSize="16px"
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
                        padding={9}
                        _active={{ transform: "translateY(0)" }}
                      >
                        {getTranslation("flashcard_submit")}
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
                      {getTranslation("flashcard_cancel")}
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
                        {isCorrect
                          ? getTranslation("flashcard_correct")
                          : getTranslation("flashcard_incorrect")}
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
                        {getTranslation("flashcard_try_again")}
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
