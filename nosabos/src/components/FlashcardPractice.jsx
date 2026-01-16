import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Box,
  VStack,
  HStack,
  Flex,
  Text,
  Input,
  Button,
  IconButton,
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
  RiStopLine,
} from "react-icons/ri";
import {
  LOW_LATENCY_TTS_FORMAT,
  getRandomVoice,
  getTTSPlayer,
  TTS_LANG_TAG,
} from "../utils/tts";
import { CEFR_COLORS, getConceptText } from "../data/flashcardData";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { simplemodel } from "../firebaseResources/firebaseResources";
import { translations } from "../utils/translation";
import { WaveBar } from "./WaveBar";
import useNotesStore from "../hooks/useNotesStore";
import { generateNoteContent, buildNoteObject } from "../utils/noteGeneration";
import { RiBookmarkLine } from "react-icons/ri";
import { FiHelpCircle } from "react-icons/fi";
import useSoundSettings from "../hooks/useSoundSettings";
import RandomCharacter from "./RandomCharacter";

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
  const appLang = getAppLanguage();
  const dict = translations[appLang] || translations.en;
  const key = `language_${code === "nah" ? "nah" : code}`;
  return dict[key] || translations.en[key] || code;
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
  languageXp = 0,
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
  const [loadingTts, setLoadingTts] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteCreated, setNoteCreated] = useState(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const streamingRef = useRef(false);
  const explanationStreamingRef = useRef(false);
  const audioRef = useRef(null);
  const playSound = useSoundSettings((s) => s.playSound);
  const toast = useToast();

  // Notes store
  const addNote = useNotesStore((s) => s.addNote);
  const setNotesLoading = useNotesStore((s) => s.setLoading);
  const triggerDoneAnimation = useNotesStore((s) => s.triggerDoneAnimation);

  const cefrColor = CEFR_COLORS[card.cefrLevel];
  const currentLanguageXp = Number(languageXp) || 0;
  const updatedTotalXp = currentLanguageXp + xpAwarded;
  const xpLevelNumber = Math.floor(updatedTotalXp / 100) + 1;
  const nextLevelProgressPct = updatedTotalXp % 100;

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

      // Play feedback sound
      playSound(isYes ? "correct" : "incorrect");

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
      playSound("submitAction");
      setExplanationText("");
      checkAnswerWithAI(textAnswer);
    }
  };

  const handleTryAgain = () => {
    setTextAnswer("");
    setRecognizedText("");
    setShowResult(false);
    setIsCorrect(false);
    setXpAwarded(0);
    setNoteCreated(false);
    explanationStreamingRef.current = false;
    setExplanationText("");
    setIsLoadingExplanation(false);
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
    setLoadingTts(false);
    setIsCreatingNote(false);
    setNoteCreated(false);
    explanationStreamingRef.current = false;
    setExplanationText("");
    setIsLoadingExplanation(false);
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

  const handleCreateNote = async () => {
    if (isCreatingNote || noteCreated) return;

    setIsCreatingNote(true);
    setNotesLoading(true);

    try {
      const concept = getConceptText(
        card,
        getEffectiveCardLanguage(supportLang)
      );
      const userAnswer = textAnswer || recognizedText;

      const { example, summary } = await generateNoteContent({
        concept,
        userAnswer,
        wasCorrect: isCorrect,
        targetLang,
        supportLang,
        cefrLevel: card.cefrLevel,
        moduleType: "flashcard",
      });

      const note = buildNoteObject({
        lessonTitle: { en: concept, es: concept },
        cefrLevel: card.cefrLevel,
        example,
        summary,
        targetLang,
        supportLang,
        moduleType: "flashcard",
        wasCorrect: isCorrect,
      });

      addNote(note);
      setNoteCreated(true);
      triggerDoneAnimation();
    } catch (error) {
      console.error("Error creating note:", error);
      toast({
        title:
          getTranslation("flashcard_note_error") || "Could not create note",
        status: "error",
        duration: 2500,
      });
    } finally {
      setIsCreatingNote(false);
      setNotesLoading(false);
    }
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
    setExplanationText("");
    setIsLoadingExplanation(false);
    playSound("submitAction");

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

  const handleExplainAnswer = async () => {
    if (isLoadingExplanation || explanationText) return;

    const userAnswer = textAnswer || recognizedText;
    if (!userAnswer) return;

    const concept = getConceptText(card, getEffectiveCardLanguage(supportLang));
    const prompt = `You are a helpful language tutor for ${LANG_NAME(
      targetLang
    )}. A student tried to translate a prompt from ${LANG_NAME(
      supportLang
    )} to ${LANG_NAME(targetLang)}.

Prompt (${LANG_NAME(supportLang)}): ${concept}
Student translation attempt (${LANG_NAME(targetLang)}): ${userAnswer}

Provide a brief response in ${LANG_NAME(supportLang)} with two parts:
1) Correct translation: the best translation into ${LANG_NAME(targetLang)}
2) Explanation: 2-3 concise sentences in ${LANG_NAME(
      supportLang
    )} explaining how the student's answer could be improved.`;

    setIsLoadingExplanation(true);
    setExplanationText("");
    explanationStreamingRef.current = true;

    const streamChunkText = (chunk) =>
      typeof chunk?.text === "function" ? chunk.text() : chunk?.text || "";

    try {
      // Prefer streaming for faster UI feedback
      if (simplemodel) {
        const result = await simplemodel.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        let fullText = "";
        for await (const chunk of result.stream) {
          if (!explanationStreamingRef.current) break;

          const chunkText = streamChunkText(chunk);
          if (!chunkText) continue;

          fullText += chunkText;
          setExplanationText(fullText.trim());
        }

        if (explanationStreamingRef.current) {
          const finalResp = await result.response;
          const finalText = streamChunkText(finalResp) || fullText;
          setExplanationText(finalText.trim());
        }
      } else {
        const explanation = await callResponses({
          model: DEFAULT_RESPONSES_MODEL,
          input: prompt,
        });

        setExplanationText(explanation.trim());
      }
    } catch (error) {
      console.error("Error explaining answer:", error);
      toast({
        title: getTranslation("flashcard_grading_error_title"),
        description: getTranslation("flashcard_grading_error_desc"),
        status: "error",
        duration: 3000,
      });
    } finally {
      explanationStreamingRef.current = false;
      setIsLoadingExplanation(false);
    }
  };

  const handleListenToAnswer = async (e) => {
    e.stopPropagation(); // Prevent card flip when clicking listen button

    // If already playing, stop it
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    if (!streamedAnswer || loadingTts) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setLoadingTts(true);

    try {
      const player = await getTTSPlayer({
        text: streamedAnswer,
        langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
        voice: getRandomVoice(),
        responseFormat: LOW_LATENCY_TTS_FORMAT,
      });

      audioRef.current = player.audio;

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return; // Prevent double cleanup
        cleanedUp = true;
        setIsPlayingAudio(false);
        audioRef.current = null;
        player.cleanup?.();
      };

      player.audio.onended = cleanup;
      player.audio.onerror = cleanup;
      // Also listen to finalize promise as backup for cleanup
      player.finalize?.then?.(cleanup)?.catch?.(() => {});

      await player.ready;
      setLoadingTts(false);
      setIsPlayingAudio(true);
      await player.audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setLoadingTts(false);
      setIsPlayingAudio(false);
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
        <ModalBody
          p={8}
          position="relative"
          bgGradient="linear(135deg, #1E3A8A, #2563EB, #3B82F6, #2563EB)"
        >
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

              <Text fontSize="sm" color="white" fontWeight="medium">
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
                  p={4}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ backfaceVisibility: "hidden" }}
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
                  <Box mt={6}>
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
                </Box>

                {/* Back Side */}
                <Box
                  position="absolute"
                  w="100%"
                  h="100%"
                  p={4}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  cursor="pointer"
                  onClick={handleFlipBack}
                >
                  <Text
                    fontSize="xs"
                    // color="blue.200"
                    colorr="white"
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
                  <Box mt={6}>
                    {streamedAnswer && !isStreaming && (
                      <IconButton
                        aria-label={
                          loadingTts
                            ? getTranslation("flashcard_loading") || "Loading"
                            : isPlayingAudio
                            ? getTranslation("flashcard_stop") || "Stop"
                            : getTranslation("flashcard_listen")
                        }
                        position="absolute"
                        bottom={3}
                        left={3}
                        size="sm"
                        variant="solid"
                        colorScheme="purple"
                        color="white"
                        icon={
                          loadingTts ? (
                            <Spinner size="xs" />
                          ) : isPlayingAudio ? (
                            <RiStopLine size={14} />
                          ) : (
                            <RiVolumeUpLine size={14} />
                          )
                        }
                        onClick={handleListenToAnswer}
                        isDisabled={loadingTts}
                        _hover={{ bg: "whiteAlpha.300" }}
                        fontSize="xs"
                      />
                    )}
                    <Text
                      position="absolute"
                      bottom={3}
                      right={3}
                      fontSize="xs"
                      color="white"
                    >
                      {getTranslation("flashcard_tap_to_flip")}
                    </Text>
                  </Box>
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
                        bg="#f4f5ffff"
                        border="2px solid"
                        borderColor="whiteAlpha.200"
                        color="black"
                        _placeholder={{ color: "gray.500" }}
                        _focus={{
                          borderColor: cefrColor.primary,
                          boxShadow: `0 0 0 1px ${cefrColor.primary}`,
                        }}
                      />

                      {/* Submit Button */}
                      <Button
                        w="100%"
                        size="lg"
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
                      color="white"
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
                    <HStack spacing={3} w="100%">
                      {isCorrect ? (
                        <RiCheckLine size={32} color="#22C55E" />
                      ) : (
                        <RiCloseLine size={32} color="#EF4444" />
                      )}
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color="white"
                        flex="1"
                      >
                        {isCorrect
                          ? getTranslation("flashcard_correct")
                          : getTranslation("flashcard_incorrect")}
                      </Text>
                      {/* Create Note Button - icon only */}
                      <IconButton
                        icon={
                          isCreatingNote ? (
                            <Spinner size="xs" />
                          ) : (
                            <RiBookmarkLine size={18} />
                          )
                        }
                        aria-label={
                          noteCreated
                            ? getTranslation("flashcard_note_saved") ||
                              "Note saved!"
                            : getTranslation("flashcard_create_note") ||
                              "Create note"
                        }
                        colorScheme={noteCreated ? "green" : "gray"}
                        variant={noteCreated ? "solid" : "ghost"}
                        onClick={handleCreateNote}
                        isDisabled={isCreatingNote || noteCreated}
                        size="sm"
                        flexShrink={0}
                      />
                    </HStack>

                    {isCorrect ? (
                      <HStack spacing={2} color="yellow.400">
                        <RiStarLine size={20} />
                        <Text fontSize="lg" fontWeight="bold">
                          +{xpAwarded} XP
                        </Text>
                      </HStack>
                    ) : (
                      <VStack w="100%" spacing={3} mt={2}>
                        <Button
                          size="lg"
                          // colorScheme="teal"
                          bg="teal"
                          colorScheme="teal"
                          onClick={handleTryAgain}
                          w="100%"
                        >
                          {getTranslation("flashcard_try_again")}
                        </Button>

                        <Button
                          size="lg"
                          colorScheme="pink"
                          variant="solid"
                          onClick={handleExplainAnswer}
                          isDisabled={
                            isLoadingExplanation ||
                            !!explanationText ||
                            isGrading
                          }
                          leftIcon={
                            isLoadingExplanation ? (
                              <Spinner size="sm" />
                            ) : (
                              <FiHelpCircle />
                            )
                          }
                          w="100%"
                        >
                          {getTranslation("flashcard_explain_answer") ||
                            "Explain my answer"}
                        </Button>
                      </VStack>
                    )}

                    {!isCorrect && explanationText && (
                      <Box
                        w="100%"
                        p={4}
                        borderRadius="md"
                        bg="rgba(244, 114, 182, 0.08)"
                        border="1px solid"
                        borderColor="pink.400"
                        boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                      >
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="pink.200"
                          mb={2}
                          display="flex"
                          alignItems="center"
                          gap={2}
                        >
                          <RiEyeLine />
                          {getTranslation("flashcard_explanation_heading") ||
                            "Explanation"}
                        </Text>
                        <Box
                          color="white"
                          fontSize="sm"
                          lineHeight="1.6"
                          sx={{
                            "& p": { mb: 2 },
                            "& p:last-child": { mb: 0 },
                            "& strong": {
                              fontWeight: "bold",
                              color: "pink.100",
                            },
                            "& em": { fontStyle: "italic" },
                            "& ul, & ol": { pl: 4, mb: 2 },
                            "& li": { mb: 1 },
                            "& code": {
                              bg: "rgba(0,0,0,0.3)",
                              px: 1,
                              py: 0.5,
                              borderRadius: "sm",
                              fontFamily: "mono",
                            },
                          }}
                        >
                          <ReactMarkdown>{explanationText}</ReactMarkdown>
                        </Box>
                      </Box>
                    )}

                    {isCorrect && (
                      <VStack align="stretch" spacing={3} w="100%" p={4}>
                        <HStack justify="space-between" w="100%">
                          <Badge
                            colorScheme="cyan"
                            variant="subtle"
                            fontSize="10px"
                          >
                            Level {xpLevelNumber}
                          </Badge>
                          <Badge
                            colorScheme="teal"
                            variant="subtle"
                            fontSize="10px"
                          >
                            Total XP {updatedTotalXp}
                          </Badge>
                        </HStack>

                        <WaveBar value={nextLevelProgressPct} />
                      </VStack>
                    )}
                  </VStack>
                  <Box mt="-2" paddingBottom={6}>
                    <RandomCharacter />
                  </Box>
                </MotionBox>
              </AnimatePresence>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}