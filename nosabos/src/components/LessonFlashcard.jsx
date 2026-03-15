// components/LessonFlashcard.jsx
// Inline flashcard question UI for Vocabulary/Grammar modules.
// AI-generates a card from the lesson context. Collected cards form a
// unit-scoped deck the learner can review (reviewing does NOT count for progress).
import React, { useState, useRef } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  IconButton,
  Badge,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCheckLine,
  RiCloseLine,
  RiStarLine,
  RiEyeLine,
  RiVolumeUpLine,
  RiStopLine,
  RiKeyboardLine,
  RiMicLine,
  RiStopCircleLine,
  RiBookmarkLine,
  RiStackLine,
} from "react-icons/ri";
import { FiHelpCircle } from "react-icons/fi";
import { MdOutlineSupportAgent, MdKeyboard } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import VirtualKeyboard from "./VirtualKeyboard";
import {
  LOW_LATENCY_TTS_FORMAT,
  getRandomVoice,
  getTTSPlayer,
  TTS_LANG_TAG,
} from "../utils/tts";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { simplemodel } from "../firebaseResources/firebaseResources";
import useSoundSettings from "../hooks/useSoundSettings";
import submitActionSound from "../assets/submitaction.mp3";
import deliciousSound from "../assets/delicious.mp3";
import clickSound from "../assets/click.mp3";
import RandomCharacter from "./RandomCharacter";

const MotionBox = motion(Box);

// --------------- helpers ---------------

const LANG_NAME = (code, uiLang = "en") => {
  const map = {
    en: "English",
    es: "Spanish",
    pt: "Portuguese",
    fr: "French",
    it: "Italian",
    nl: "Dutch",
    nah: "Nahuatl",
    ja: "Japanese",
    ru: "Russian",
    de: "German",
    el: "Greek",
    pl: "Polish",
    ga: "Irish",
    yua: "Yucatec Maya",
  };
  return map[code] || code;
};

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

// --------------- prompt builder ---------------

export function buildLessonFlashcardPrompt({
  cefrLevel,
  targetLang,
  supportLang,
  moduleType, // "vocabulary" | "grammar"
  lessonContent,
  collectedConcepts = [],
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);

  const topicLine = lessonContent?.topic ? `Topic: ${lessonContent.topic}` : "";
  const focusLine = lessonContent?.focusPoints?.length
    ? `Focus points: ${lessonContent.focusPoints.join(", ")}`
    : "";
  const wordsLine = lessonContent?.words?.length
    ? `Word list: ${lessonContent.words.join(", ")}`
    : "";
  const avoidLine = collectedConcepts.length
    ? `Avoid repeating these already-collected concepts: ${collectedConcepts.join(", ")}`
    : "";

  const moduleHint =
    moduleType === "grammar"
      ? `Generate a flashcard that tests a GRAMMAR concept (conjugation, tense, agreement, etc.) from the lesson.`
      : `Generate a flashcard that tests a VOCABULARY word or phrase from the lesson.`;

  return [
    `${moduleHint}`,
    `CEFR level: ${cefrLevel}. Target language: ${TARGET}. Support language: ${SUPPORT}.`,
    topicLine,
    focusLine,
    wordsLine,
    avoidLine,
    "",
    `Reply as a single JSON object (no markdown fences):`,
    `{"type":"lesson_flashcard","concept":"<word/phrase/pattern in ${SUPPORT}>","answer":"<correct translation in ${TARGET}>"}`,
    "",
    `Rules:`,
    `- concept is the prompt the learner sees (in ${SUPPORT}).`,
    `- answer is the correct response (in ${TARGET}).`,
    `- Keep concept short (1-6 words). Keep answer short.`,
    `- The concept MUST relate to the lesson topic/focus above.`,
    `- Output ONLY the JSON line, nothing else.`,
  ]
    .filter(Boolean)
    .join("\n");
}

// --------------- main component ---------------

export default function LessonFlashcard({
  // card data (AI-generated)
  concept = "",
  answer = "",
  loading = false,
  // language
  targetLang = "es",
  supportLang = "en",
  cefrLevel = "A1",
  // callbacks
  onCorrect, // (xp) => void — called when user answers correctly
  onCollect, // (card) => void — add to unit deck
  onNext, // () => void — proceed to next question
  onSkip, // () => void
  // deck
  deckSize = 0, // how many cards collected so far
  onOpenDeck, // () => void — open the review deck overlay
  // UI lang
  userLanguage = "en",
  // pause
  pauseMs = 2000,
}) {
  const [textAnswer, setTextAnswer] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [xpAwarded, setXpAwarded] = useState(0);
  const [isGrading, setIsGrading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loadingTts, setLoadingTts] = useState(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const [collected, setCollected] = useState(false);
  const explanationStreamingRef = useRef(false);
  const audioRef = useRef(null);
  const playSound = useSoundSettings((s) => s.playSound);
  const toast = useToast();

  const t = (key) => {
    const dict = {
      en: {
        translate_to: `Translate to ${LANG_NAME(targetLang)}`,
        show_answer: "Show answer",
        tap_to_flip: "Tap to flip back",
        answer_label: "Answer",
        type_placeholder: "Type your translation...",
        submit: "Submit",
        record: "Record answer",
        stop_recording: "Stop",
        grading: "Checking...",
        correct: "Correct!",
        incorrect: "Not quite",
        try_again: "Try again",
        explain: "Explain my answer",
        explanation_heading: "Explanation",
        skip: "Skip",
        collect: "Collect card",
        collected: "Collected!",
        deck_label: "Deck",
        next: "Next question",
        added_to_deck: "Added to deck",
      },
      es: {
        translate_to: `Traduce al ${LANG_NAME(targetLang)}`,
        show_answer: "Ver respuesta",
        tap_to_flip: "Toca para voltear",
        answer_label: "Respuesta",
        type_placeholder: "Escribe tu traducción...",
        submit: "Enviar",
        record: "Grabar respuesta",
        stop_recording: "Detener",
        grading: "Verificando...",
        correct: "¡Correcto!",
        incorrect: "No del todo",
        try_again: "Intentar de nuevo",
        explain: "Explicar mi respuesta",
        explanation_heading: "Explicación",
        skip: "Omitir",
        collect: "Recoger tarjeta",
        collected: "¡Recogida!",
        deck_label: "Mazo",
        next: "Siguiente pregunta",
        added_to_deck: "Añadida al mazo",
      },
    };
    return (dict[userLanguage] || dict.en)[key] || key;
  };

  // Speech
  const {
    startRecording,
    stopRecording,
    isRecording,
    isConnecting,
    supportsSpeech,
  } = useSpeechPractice({
    targetText: "answer",
    targetLang,
    onResult: ({ recognizedText: rt, error }) => {
      if (error) {
        toast({ title: "Speech error", status: "error", duration: 2500 });
        return;
      }
      const text = rt || "";
      setRecognizedText(text);
      if (text.trim()) checkAnswerWithAI(text);
    },
    timeoutMs: pauseMs,
  });

  const checkAnswerWithAI = async (userAns) => {
    setIsGrading(true);
    try {
      const response = await callResponses({
        model: DEFAULT_RESPONSES_MODEL,
        input: buildFlashcardJudgePrompt({
          concept,
          userAnswer: userAns,
          targetLang,
          supportLang,
          cefrLevel,
        }),
      });
      const trimmed = (response || "").trim().toUpperCase();
      const isYes = trimmed.startsWith("YES");
      let xp = 5;
      if (isYes && trimmed.includes("|")) {
        const parts = trimmed.split("|");
        const xpPart = parseInt(parts[1]?.trim());
        if (xpPart >= 4 && xpPart <= 7) xp = xpPart;
      }
      setIsCorrect(isYes);
      setXpAwarded(xp);
      setShowResult(true);
      playSound(isYes ? deliciousSound : clickSound);

      if (isYes) {
        onCorrect?.(xp);
        // Auto-collect to deck
        if (!collected) {
          setCollected(true);
          onCollect?.({ concept, answer, cefrLevel, targetLang, supportLang });
        }
      }
    } catch (error) {
      console.error("AI grading error:", error);
      toast({ title: "Grading error", status: "error", duration: 3000 });
    } finally {
      setIsGrading(false);
    }
  };

  const handleTextSubmit = () => {
    if (textAnswer.trim()) {
      playSound(submitActionSound);
      setExplanationText("");
      checkAnswerWithAI(textAnswer);
    }
  };

  // Virtual keyboard support (Japanese, Russian, Greek)
  const hasVirtualKeyboard =
    targetLang === "ja" || targetLang === "ru" || targetLang === "el";

  const handleKeyboardInput = (key) => {
    if (key === "⌫") {
      setTextAnswer((prev) => prev.slice(0, -1));
    } else {
      setTextAnswer((prev) => prev + key);
    }
  };

  const handleTryAgain = () => {
    setTextAnswer("");
    setRecognizedText("");
    setShowResult(false);
    setIsCorrect(false);
    setXpAwarded(0);
    explanationStreamingRef.current = false;
    setExplanationText("");
    setIsLoadingExplanation(false);
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
    setShowResult(false);
    setRecognizedText("");
    setIsCorrect(false);
    setXpAwarded(0);
    setExplanationText("");
    playSound(submitActionSound);
    try {
      await startRecording();
    } catch (err) {
      const code = err?.code;
      if (code === "no-speech-recognition" || code === "mic-denied") {
        toast({
          title: "Microphone unavailable",
          status: "warning",
          duration: 3200,
        });
      }
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleListenToAnswer = async (e) => {
    e?.stopPropagation?.();
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }
    if (!answer || loadingTts) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setLoadingTts(true);
    try {
      const player = await getTTSPlayer({
        text: answer,
        langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
        voice: getRandomVoice(),
        responseFormat: LOW_LATENCY_TTS_FORMAT,
      });
      audioRef.current = player.audio;
      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        setIsPlayingAudio(false);
        audioRef.current = null;
        player.cleanup?.();
      };
      player.audio.onended = cleanup;
      player.audio.onerror = cleanup;
      await player.ready;
      setLoadingTts(false);
      setIsPlayingAudio(true);
      await player.audio.play();
    } catch {
      setLoadingTts(false);
      setIsPlayingAudio(false);
    }
  };

  const handleCollect = () => {
    if (collected) return;
    setCollected(true);
    onCollect?.({ concept, answer, cefrLevel, targetLang, supportLang });
  };

  const handleExplainAnswer = async () => {
    if (isLoadingExplanation || explanationText) return;
    const userAnswer = textAnswer || recognizedText;
    if (!userAnswer) return;
    const prompt = `You are a helpful language tutor for ${LANG_NAME(targetLang)}. A student tried to translate a prompt from ${LANG_NAME(supportLang)} to ${LANG_NAME(targetLang)}.

Prompt (${LANG_NAME(supportLang)}): ${concept}
Student translation attempt (${LANG_NAME(targetLang)}): ${userAnswer}

Provide a brief response in ${LANG_NAME(supportLang)} with two parts:
1) Correct translation: the best translation into ${LANG_NAME(targetLang)}
2) Explanation: 2-3 concise sentences in ${LANG_NAME(supportLang)} explaining how the student's answer could be improved.`;

    setIsLoadingExplanation(true);
    setExplanationText("");
    explanationStreamingRef.current = true;

    try {
      if (simplemodel) {
        const result = await simplemodel.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        let fullText = "";
        for await (const chunk of result.stream) {
          if (!explanationStreamingRef.current) break;
          const chunkText =
            typeof chunk.text === "function" ? chunk.text() : "";
          if (chunkText) {
            fullText += chunkText;
            setExplanationText(fullText.trim());
          }
        }
      } else {
        const explanation = await callResponses({
          model: DEFAULT_RESPONSES_MODEL,
          input: prompt,
        });
        setExplanationText(explanation.trim());
      }
    } catch {
      toast({ title: "Could not explain", status: "error", duration: 3000 });
    } finally {
      explanationStreamingRef.current = false;
      setIsLoadingExplanation(false);
    }
  };

  // --------- RENDER ---------

  // Deck display helper (reused across early returns)
  const deckDisplay =
    deckSize > 0 ? (
      <Box
        w="100%"
        p={3}
        borderRadius="xl"
        bg="whiteAlpha.50"
        border="1px solid"
        borderColor="whiteAlpha.100"
        cursor="pointer"
        onClick={onOpenDeck}
        _hover={{ bg: "whiteAlpha.100" }}
        transition="background 0.2s"
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <RiStackLine size={16} color="#93C5FD" />
            <Text fontSize="sm" color="blue.200" fontWeight="medium">
              {t("deck_label")}
            </Text>
          </HStack>
          <HStack spacing={1}>
            {Array.from({ length: Math.min(deckSize, 8) }).map((_, i) => (
              <Box
                key={i}
                w="6px"
                h="8px"
                borderRadius="sm"
                bg="blue.400"
                opacity={0.5 + (i / Math.min(deckSize, 8)) * 0.5}
              />
            ))}
            <Text fontSize="xs" color="whiteAlpha.600" ml={1}>
              {deckSize}
            </Text>
          </HStack>
        </HStack>
      </Box>
    ) : null;

  if (loading) {
    return (
      <VStack spacing={3} w="100%" maxW="400px" mx="auto">
        <Box
          borderRadius="2xl"
          overflow="hidden"
          bg="#08142b"
          boxShadow="0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(59, 130, 246, 0.25)"
          border="2px solid"
          borderColor="rgba(59, 130, 246, 0.2)"
          w="100%"
          p={5}
          position="relative"
          sx={{
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
              pointerEvents: "none",
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
              pointerEvents: "none",
            },
            "@keyframes matrixGlowShift": {
              "0%, 100%": { transform: "translate(0, 0) scale(1)" },
              "50%": { transform: "translate(0, -2%) scale(1.02)" },
            },
          }}
        >
          <VStack
            spacing={3}
            py={4}
            align="center"
            position="relative"
            zIndex={1}
          >
            <Spinner size="md" color="blue.200" />
            <Text color="whiteAlpha.800" fontSize="sm">
              {userLanguage === "es"
                ? "Generando tarjeta..."
                : "Generating flashcard..."}
            </Text>
          </VStack>
        </Box>
        {deckDisplay}
      </VStack>
    );
  }

  if (!concept) {
    // Still show deck even when no concept
    return deckSize > 0 ? (
      <VStack spacing={3} w="100%" maxW="400px" mx="auto">
        {deckDisplay}
      </VStack>
    ) : null;
  }

  return (
    <VStack spacing={3} w="100%" maxW="400px" mx="auto">
      <Box
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(59, 130, 246, 0.25)"
        border="2px solid"
        borderColor="rgba(59, 130, 246, 0.2)"
        w="100%"
      >
        <Box
          px={4}
          py={3}
          position="relative"
          bg="#08142b"
          sx={{
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
              pointerEvents: "none",
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
              pointerEvents: "none",
            },
            "@keyframes matrixGlowShift": {
              "0%, 100%": { transform: "translate(0, 0) scale(1)" },
              "50%": { transform: "translate(0, -2%) scale(1.02)" },
            },
          }}
        >
          <VStack spacing={2} align="stretch" position="relative" zIndex={1}>
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
                  px={3}
                  pt={2}
                  pb={1}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ backfaceVisibility: "hidden" }}
                >
                  {/* Support agent button – top left */}
                  <IconButton
                    aria-label={t("show_answer")}
                    icon={<MdOutlineSupportAgent size={18} />}
                    position="absolute"
                    top={2}
                    left={2}
                    size="sm"
                    variant="ghost"
                    color="whiteAlpha.700"
                    _hover={{ bg: "whiteAlpha.200", color: "white" }}
                    onClick={handleFlip}
                    zIndex={2}
                  />
                  <Text
                    fontSize="xs"
                    color="whiteAlpha.800"
                    fontWeight="medium"
                    mb={1}
                  >
                    {t("translate_to")}
                  </Text>
                  <Text
                    fontSize="xl"
                    fontWeight="black"
                    color="white"
                    textAlign="center"
                    textShadow="0 2px 4px rgba(0,0,0,0.2)"
                  >
                    {concept}
                  </Text>
                </Box>

                {/* Back Side */}
                <Box
                  position="absolute"
                  w="100%"
                  h="100%"
                  p={3}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  cursor="pointer"
                  onClick={handleFlip}
                >
                  <Text fontSize="xs" color="white" fontWeight="medium" mb={1}>
                    {t("answer_label")}
                  </Text>
                  <Text
                    fontSize="xl"
                    fontWeight="black"
                    color="white"
                    textAlign="center"
                    textShadow="0 2px 4px rgba(0,0,0,0.3)"
                  >
                    {answer || "..."}
                  </Text>
                  {/* Listen Button */}
                  <Box>
                    {answer && (
                      <IconButton
                        aria-label={
                          loadingTts
                            ? "Loading"
                            : isPlayingAudio
                              ? "Stop"
                              : "Listen"
                        }
                        position="absolute"
                        bottom={2}
                        left={2}
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
                      bottom={2}
                      right={2}
                      fontSize="xs"
                      color="white"
                    >
                      {t("tap_to_flip")}
                    </Text>
                  </Box>
                </Box>
              </MotionBox>
            </Box>

            {/* Unified Input - Show both text and speech */}
            {!showResult && (
              <VStack spacing={2} mt={2}>
                {/* Grading State */}
                {isGrading ? (
                  <VStack
                    spacing={2}
                    py={6}
                    w="100%"
                    minH="140px"
                    justify="center"
                  >
                    <Spinner size="md" color="blue.200" />
                    <Text color="whiteAlpha.700" fontSize="sm">
                      {t("grading")}
                    </Text>
                  </VStack>
                ) : (
                  <VStack spacing={2} w="100%">
                    {/* Record Button */}
                    <Button
                      w="100%"
                      size="md"
                      colorScheme={
                        isRecording ? "red" : isConnecting ? "yellow" : "teal"
                      }
                      leftIcon={
                        isConnecting ? (
                          <Spinner size="xs" />
                        ) : isRecording ? (
                          <RiStopCircleLine size={16} />
                        ) : (
                          <RiMicLine size={16} />
                        )
                      }
                      onClick={handleRecord}
                      isDisabled={!supportsSpeech || isConnecting}
                    >
                      {isConnecting
                        ? userLanguage === "es"
                          ? "Conectando..."
                          : "Connecting..."
                        : isRecording
                          ? t("stop_recording")
                          : t("record")}
                    </Button>

                    {/* Recognized speech text */}
                    {recognizedText && (
                      <Box
                        p={2}
                        borderRadius="md"
                        bg="whiteAlpha.100"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        w="100%"
                      >
                        <Text fontSize="xs" color="whiteAlpha.700" mb={1}>
                          {userLanguage === "es"
                            ? "Reconocido:"
                            : "Recognized:"}
                        </Text>
                        <Text fontSize="sm" color="teal.200">
                          {recognizedText}
                        </Text>
                      </Box>
                    )}

                    {/* Text Input and Submit Group */}
                    <VStack spacing={3} w="100%" mt={6}>
                      <Input
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t("type_placeholder")}
                        size="sm"
                        fontSize="14px"
                        textAlign="center"
                        bg="#f4f5ffff"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        color="black"
                        _placeholder={{ color: "gray.500" }}
                        _focus={{
                          borderColor: "blue.300",
                          boxShadow: "0 0 0 1px #3B82F6",
                        }}
                      />

                      {/* Virtual keyboard */}
                      {hasVirtualKeyboard && showKeyboard && (
                        <VirtualKeyboard
                          lang={targetLang}
                          onKeyPress={handleKeyboardInput}
                          onClose={() => setShowKeyboard(false)}
                        />
                      )}

                      <HStack spacing={2} w="100%">
                        {hasVirtualKeyboard && (
                          <IconButton
                            aria-label={
                              showKeyboard ? "Close keyboard" : "Open keyboard"
                            }
                            icon={<MdKeyboard size={20} />}
                            size="md"
                            variant="outline"
                            bg={showKeyboard ? "blue.500" : "whiteAlpha.200"}
                            color="white"
                            onClick={() => setShowKeyboard(!showKeyboard)}
                            _hover={{
                              bg: showKeyboard ? "blue.600" : "whiteAlpha.300",
                            }}
                            flexShrink={0}
                          />
                        )}
                        <Button
                          flex={1}
                          size="md"
                          color="white"
                          onClick={handleTextSubmit}
                          isDisabled={!textAnswer.trim()}
                          leftIcon={<RiKeyboardLine size={14} />}
                        >
                          {t("submit")}
                        </Button>
                      </HStack>
                    </VStack>

                    {/* Skip button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      color="whiteAlpha.600"
                      onClick={onSkip || onNext}
                      _hover={{ bg: "whiteAlpha.100" }}
                      mt={8}
                      w="100%"
                      py={5}
                    >
                      {t("skip")}
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
                    spacing={2}
                    p={3}
                    borderRadius="xl"
                    bg={isCorrect ? "transparent" : "red.900"}
                    border="2px solid"
                    borderColor={isCorrect ? "green.500" : "red.500"}
                  >
                    <HStack spacing={2} w="100%">
                      {isCorrect ? (
                        <RiCheckLine size={24} color="#22C55E" />
                      ) : (
                        <RiCloseLine size={24} color="#EF4444" />
                      )}
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        color="white"
                        flex="1"
                      >
                        {isCorrect ? t("correct") : t("incorrect")}
                      </Text>
                    </HStack>

                    {isCorrect ? (
                      <>
                        <HStack spacing={2} color="yellow.400">
                          <RiStarLine size={16} />
                          <Text fontSize="md" fontWeight="bold">
                            +{xpAwarded} XP
                          </Text>
                        </HStack>

                        {/* Next */}
                        <Button
                          size="sm"
                          bg="teal"
                          variant="outline"
                          onClick={onNext}
                        >
                          {t("next")}
                        </Button>
                      </>
                    ) : (
                      <VStack w="100%" spacing={2} mt={1}>
                        <Button
                          size="sm"
                          bg="teal"
                          colorScheme="teal"
                          onClick={handleTryAgain}
                        >
                          {t("try_again")}
                        </Button>

                        <Button
                          size="sm"
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
                              <Spinner size="xs" />
                            ) : (
                              <FiHelpCircle size={14} />
                            )
                          }
                        >
                          {t("explain")}
                        </Button>
                      </VStack>
                    )}

                    {!isCorrect && explanationText && (
                      <Box
                        w="100%"
                        p={3}
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
                          {t("explanation_heading")}
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
                  </VStack>
                  <Box mt="-2" paddingBottom={6}>
                    <RandomCharacter />
                  </Box>
                </MotionBox>
              </AnimatePresence>
            )}
          </VStack>
        </Box>
      </Box>
    </VStack>
  );
}

// --------------- Deck Review Overlay ---------------

export function FlashcardDeckReview({
  cards = [],
  isOpen = false,
  onClose,
  targetLang = "es",
  supportLang = "en",
  userLanguage = "en",
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen || cards.length === 0) return null;

  const card = cards[currentIndex] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((i) => (i + 1) % cards.length);
  };
  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((i) => (i - 1 + cards.length) % cards.length);
  };

  return (
    <Box
      position="fixed"
      inset="0"
      bg="blackAlpha.800"
      zIndex="overlay"
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box maxW="420px" w="90%" onClick={(e) => e.stopPropagation()}>
        <VStack spacing={4} p={6}>
          <HStack justify="space-between" w="100%">
            <Badge colorScheme="blue" fontSize="md">
              {userLanguage === "es" ? "Repaso del mazo" : "Deck Review"}
            </Badge>
            <Badge colorScheme="gray" fontSize="sm">
              {currentIndex + 1} / {cards.length}
            </Badge>
          </HStack>

          {/* Card */}
          <Box
            w="100%"
            h="180px"
            sx={{ perspective: "1000px" }}
            cursor="pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <MotionBox
              w="100%"
              h="100%"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* Front */}
              <Box
                position="absolute"
                w="100%"
                h="100%"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                bg="#08142b"
                borderRadius="xl"
                border="2px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                sx={{
                  backfaceVisibility: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    borderRadius: "xl",
                    background:
                      "radial-gradient(circle at 20% 15%, rgba(56,189,248,0.14) 0%, transparent 42%), " +
                      "radial-gradient(circle at 82% 25%, rgba(45,212,191,0.12) 0%, transparent 40%), " +
                      "radial-gradient(circle at 50% 100%, rgba(30,64,175,0.28) 0%, transparent 62%), " +
                      "linear-gradient(180deg, rgba(8,20,43,0.95) 0%, rgba(5,16,36,0.98) 100%)",
                    animation: "matrixGlowShift 10s ease-in-out infinite",
                    pointerEvents: "none",
                  },
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    borderRadius: "xl",
                    backgroundImage:
                      "repeating-linear-gradient(0deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 1px, transparent 1px, transparent 28px), " +
                      "repeating-linear-gradient(90deg, rgba(148,163,184,0.05) 0px, rgba(148,163,184,0.05) 1px, transparent 1px, transparent 28px)",
                    opacity: 0.45,
                    mixBlendMode: "screen",
                    pointerEvents: "none",
                  },
                  "@keyframes matrixGlowShift": {
                    "0%, 100%": { transform: "translate(0, 0) scale(1)" },
                    "50%": { transform: "translate(0, -2%) scale(1.02)" },
                  },
                }}
                overflow="hidden"
                p={4}
              >
                <Text
                  fontSize="xs"
                  color="whiteAlpha.700"
                  mb={2}
                  position="relative"
                  zIndex={1}
                >
                  {LANG_NAME(supportLang)}
                </Text>
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color="white"
                  textAlign="center"
                  position="relative"
                  zIndex={1}
                >
                  {card.concept}
                </Text>
                <Text
                  fontSize="xs"
                  color="whiteAlpha.600"
                  mt={4}
                  position="relative"
                  zIndex={1}
                >
                  {userLanguage === "es" ? "Toca para voltear" : "Tap to flip"}
                </Text>
              </Box>
              {/* Back */}
              <Box
                position="absolute"
                w="100%"
                h="100%"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                bgGradient="linear(135deg, #065F46, #059669)"
                borderRadius="xl"
                border="2px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                sx={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
                p={4}
              >
                <Text fontSize="xs" color="whiteAlpha.700" mb={2}>
                  {LANG_NAME(targetLang)}
                </Text>
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color="white"
                  textAlign="center"
                >
                  {card.answer}
                </Text>
              </Box>
            </MotionBox>
          </Box>

          {/* Navigation */}
          <HStack spacing={4}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="whiteAlpha"
              onClick={handlePrev}
              isDisabled={cards.length <= 1}
            >
              {userLanguage === "es" ? "Anterior" : "Prev"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="whiteAlpha"
              onClick={handleNext}
              isDisabled={cards.length <= 1}
            >
              {userLanguage === "es" ? "Siguiente" : "Next"}
            </Button>
          </HStack>

          <Button size="sm" variant="ghost" color="gray.400" onClick={onClose}>
            {userLanguage === "es" ? "Cerrar" : "Close"}
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
