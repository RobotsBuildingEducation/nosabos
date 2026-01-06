import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Badge,
  Heading,
  Alert,
  AlertIcon,
  Flex,
  Box,
  Button,
  IconButton,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { RUSSIAN_ALPHABET } from "../data/russianAlphabet";
import { JAPANESE_ALPHABET } from "../data/japaneseAlphabet";
import { FiVolume2 } from "react-icons/fi";
import { RiMicLine, RiStopCircleLine, RiCheckLine, RiCloseLine } from "react-icons/ri";
import { getTTSPlayer, TTS_LANG_TAG } from "../utils/tts";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { awardXp } from "../utils/utils";
import { WaveBar } from "./WaveBar";
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";

const MotionBox = motion(Box);

// Build AI grading prompt for alphabet practice
function buildAlphabetJudgePrompt({ practiceWord, userAnswer, targetLang }) {
  const langName = targetLang === "ja" ? "Japanese" : "Russian";

  return `
Judge if the user correctly pronounced a ${langName} word.

Target word: ${practiceWord}
User's pronunciation (transcribed): ${userAnswer}

Policy:
- Say YES if the transcription matches or is phonetically very close to the target word.
- Allow minor transcription errors since speech recognition may not be perfect for ${langName}.
- The user is a beginner, so be lenient with small pronunciation mistakes.
- If completely wrong or incomprehensible, say NO.

Reply with ONE of these formats:
YES | <xp_amount>
NO

Where <xp_amount> is 1-2 based on:
- 2 XP: Accurate pronunciation
- 1 XP: Recognizable but imperfect
`.trim();
}

// Save alphabet practice progress to Firestore
async function saveAlphabetProgress(npub, targetLang, letterId, practiceWord, wasCorrect) {
  if (!npub) return;

  const userRef = doc(database, "users", npub);
  const now = new Date().toISOString();
  const progressKey = `progress.alphabetPractice.${targetLang}.${letterId}`;

  try {
    const snap = await getDoc(userRef);
    const existingProgress = snap.exists()
      ? snap.data()?.progress?.alphabetPractice?.[targetLang]?.[letterId]
      : null;

    const attempts = (existingProgress?.attempts || 0) + 1;
    const correctCount = (existingProgress?.correctCount || 0) + (wasCorrect ? 1 : 0);
    const lastWords = existingProgress?.practicedWords || [];

    // Keep track of last 10 practiced words
    const updatedWords = [...new Set([practiceWord, ...lastWords])].slice(0, 10);

    await updateDoc(userRef, {
      [`${progressKey}.attempts`]: attempts,
      [`${progressKey}.correctCount`]: correctCount,
      [`${progressKey}.practicedWords`]: updatedWords,
      [`${progressKey}.lastAttemptAt`]: serverTimestamp(),
      [`${progressKey}.lastWord`]: practiceWord,
      "progress.lastActiveAt": serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving alphabet progress:", error);
  }
}

function LetterCard({
  letter,
  onPlay,
  isPlaying,
  appLanguage,
  targetLang,
  npub,
  onXpAwarded,
  pauseMs = 2000,
}) {
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [recognizedText, setRecognizedText] = useState("");
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const wordPlayerRef = useRef(null);
  const toast = useToast();

  const typeColor = useMemo(() => {
    switch (letter.type) {
      case "vowel":
        return "purple";
      case "consonant":
        return "teal";
      case "sign":
        return "orange";
      default:
        return "gray";
    }
  }, [letter.type]);

  const typeLabel =
    appLanguage === "es"
      ? letter.type === "vowel"
        ? "Vocal"
        : letter.type === "consonant"
        ? "Consonante"
        : "Signo"
      : letter.type.charAt(0).toUpperCase() + letter.type.slice(1);

  const sound = appLanguage === "es" ? letter.soundEs || letter.sound : letter.sound;
  const tip = appLanguage === "es" ? letter.tipEs || letter.tip : letter.tip;
  const practiceWordMeaning = letter.practiceWordMeaning?.[appLanguage === "es" ? "es" : "en"] || "";

  // Speech practice hook - use hook's isRecording state
  const { startRecording, stopRecording, isRecording, supportsSpeech } = useSpeechPractice({
    targetText: letter.practiceWord || "placeholder",
    targetLang: targetLang,
    onResult: ({ recognizedText: text, error }) => {
      if (error) {
        toast({
          title: appLanguage === "es" ? "Error de grabación" : "Recording error",
          description: appLanguage === "es"
            ? "No se pudo grabar. Intenta de nuevo."
            : "Could not record. Please try again.",
          status: "error",
          duration: 2500,
        });
        return;
      }

      const recognized = text || "";
      setRecognizedText(recognized);

      if (recognized.trim()) {
        checkAnswerWithAI(recognized);
      }
    },
    timeoutMs: pauseMs,
  });

  const checkAnswerWithAI = async (answer) => {
    setIsGrading(true);

    try {
      const response = await callResponses({
        model: DEFAULT_RESPONSES_MODEL,
        input: buildAlphabetJudgePrompt({
          practiceWord: letter.practiceWord,
          userAnswer: answer,
          targetLang,
        }),
      });

      const trimmed = (response || "").trim().toUpperCase();
      const isYes = trimmed.startsWith("YES");

      let xp = 1;
      if (isYes && trimmed.includes("|")) {
        const parts = trimmed.split("|");
        const xpPart = parseInt(parts[1]?.trim());
        if (xpPart >= 1 && xpPart <= 2) {
          xp = xpPart;
        }
      }

      setIsCorrect(isYes);
      setXpAwarded(xp);
      setShowResult(true);

      // Award XP and save progress
      if (isYes && npub) {
        await awardXp(npub, xp, targetLang);
        onXpAwarded?.(xp);
      }

      // Save progress regardless of result
      await saveAlphabetProgress(npub, targetLang, letter.id, letter.practiceWord, isYes);

    } catch (error) {
      console.error("AI grading error:", error);
      toast({
        title: appLanguage === "es" ? "Error al evaluar" : "Grading error",
        description: appLanguage === "es"
          ? "No pudimos evaluar tu respuesta."
          : "Could not grade your answer.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handlePracticeClick = () => {
    setIsPracticeMode(true);
    setIsFlipped(true);
    setShowResult(false);
    setRecognizedText("");
    setXpAwarded(0);
  };

  const handleFlipBack = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setIsPracticeMode(false);
      setShowResult(false);
      setRecognizedText("");
    }, 300);
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
          title: appLanguage === "es" ? "Sin soporte de voz" : "Speech not supported",
          description: appLanguage === "es"
            ? "Tu navegador no soporta reconocimiento de voz."
            : "Your browser doesn't support speech recognition.",
          status: "warning",
          duration: 3200,
        });
      } else if (code === "mic-denied") {
        toast({
          title: appLanguage === "es" ? "Micrófono denegado" : "Microphone denied",
          description: appLanguage === "es"
            ? "Permite el acceso al micrófono para grabar."
            : "Please allow microphone access to record.",
          status: "error",
          duration: 3200,
        });
      }
    }
  };

  const handlePlayWord = async () => {
    if (!letter.practiceWord) return;

    if (isPlayingWord) {
      try {
        wordPlayerRef.current?.audio?.pause?.();
      } catch {}
      wordPlayerRef.current?.cleanup?.();
      setIsPlayingWord(false);
      return;
    }

    try {
      const player = await getTTSPlayer({
        text: letter.practiceWord,
        langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
      });
      wordPlayerRef.current = player;
      setIsPlayingWord(true);

      player.audio.onended = () => {
        setIsPlayingWord(false);
        player.cleanup?.();
      };
      player.audio.onerror = () => {
        setIsPlayingWord(false);
        player.cleanup?.();
      };

      await player.ready;
      await player.audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setIsPlayingWord(false);
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setRecognizedText("");
    setIsCorrect(false);
    setXpAwarded(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        wordPlayerRef.current?.audio?.pause?.();
      } catch {}
      wordPlayerRef.current?.cleanup?.();
    };
  }, []);

  return (
    <Box
      position="relative"
      w="100%"
      minH={{ base: "320px", md: "340px" }}
      sx={{ perspective: "1000px" }}
    >
      <MotionBox
        w="100%"
        h="100%"
        display="grid"
        gridTemplateColumns="1fr"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Front Side - Letter Info */}
        <VStack
          gridArea="1 / 1"
          w="100%"
          h="100%"
          align="flex-start"
          spacing={2}
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.300"
          borderRadius="lg"
          p={4}
          boxShadow="0 10px 30px rgba(0,0,0,0.35)"
          color="white"
          sx={{ backfaceVisibility: "hidden" }}
        >
          <HStack justify="space-between" w="100%">
            <Badge colorScheme={typeColor} borderRadius="md" px={2} py={1}>
              {typeLabel}
            </Badge>
            {letter.practiceWord && (
              <Button
                size="xs"
                variant="ghost"
                color="white"
                leftIcon={<RiMicLine size={12} />}
                onClick={handlePracticeClick}
                _hover={{ bg: "whiteAlpha.200" }}
                fontSize="xs"
              >
                {appLanguage === "es" ? "Practicar" : "Practice"}
              </Button>
            )}
          </HStack>

          <Flex
            align="center"
            justify="space-between"
            w="100%"
            gap={3}
            minH="48px"
          >
            <VStack spacing={1} align="flex-start">
              <Text fontSize="2xl" fontWeight="bold">
                {letter.letter}
              </Text>
              <Text fontSize="lg" fontWeight="semibold">
                {letter.name}
              </Text>
            </VStack>
            {onPlay && (
              <Flex
                as="button"
                aria-label="Play sound"
                align="center"
                justify="center"
                bg="whiteAlpha.200"
                border="1px solid"
                borderColor="whiteAlpha.400"
                borderRadius="full"
                p={2}
                _hover={{ bg: "whiteAlpha.300" }}
                color={isPlaying ? "teal.200" : "white"}
                onClick={() => onPlay(letter)}
              >
                <FiVolume2 />
              </Flex>
            )}
          </Flex>
          <Text color="whiteAlpha.900" fontSize="sm">{sound}</Text>
          <Text fontSize="xs" color="whiteAlpha.800">
            {tip}
          </Text>
        </VStack>

        {/* Back Side - Practice Mode */}
        <VStack
          gridArea="1 / 1"
          w="100%"
          h="100%"
          align="center"
          justify="center"
          spacing={3}
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="teal.400"
          borderRadius="lg"
          p={4}
          boxShadow="0 10px 30px rgba(0,0,0,0.35), 0 0 0 2px rgba(56, 178, 172, 0.3)"
          color="white"
          sx={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Practice Word Display */}
          <Text fontSize="xs" color="whiteAlpha.700" fontWeight="medium">
            {appLanguage === "es" ? "Di esta palabra:" : "Say this word:"}
          </Text>

          <HStack spacing={2} align="center">
            <Text fontSize="2xl" fontWeight="black" color="white">
              {letter.practiceWord}
            </Text>
            <IconButton
              aria-label="Play word"
              icon={isPlayingWord ? <Spinner size="xs" /> : <FiVolume2 />}
              size="sm"
              variant="ghost"
              color={isPlayingWord ? "teal.300" : "white"}
              onClick={handlePlayWord}
              _hover={{ bg: "whiteAlpha.200" }}
            />
          </HStack>

          <Text fontSize="sm" color="whiteAlpha.700">
            ({practiceWordMeaning})
          </Text>

          {/* Recording / Result Area */}
          {isGrading ? (
            <VStack spacing={2} py={2}>
              <Spinner size="md" color="teal.300" />
              <Text fontSize="xs" color="whiteAlpha.700">
                {appLanguage === "es" ? "Evaluando..." : "Grading..."}
              </Text>
            </VStack>
          ) : showResult ? (
            <VStack spacing={2} py={2}>
              <Flex
                align="center"
                justify="center"
                w={10}
                h={10}
                borderRadius="full"
                bg={isCorrect ? "green.500" : "red.500"}
              >
                {isCorrect ? <RiCheckLine size={24} /> : <RiCloseLine size={24} />}
              </Flex>

              {recognizedText && (
                <Text fontSize="xs" color="whiteAlpha.700">
                  {appLanguage === "es" ? "Escuchamos:" : "We heard:"} "{recognizedText}"
                </Text>
              )}

              {isCorrect && (
                <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                  +{xpAwarded} XP
                </Badge>
              )}

              <HStack spacing={2} mt={1}>
                <Button
                  size="xs"
                  variant="ghost"
                  color="white"
                  onClick={handleTryAgain}
                  _hover={{ bg: "whiteAlpha.200" }}
                >
                  {appLanguage === "es" ? "Otra vez" : "Try again"}
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  color="white"
                  onClick={handleFlipBack}
                  _hover={{ bg: "whiteAlpha.200" }}
                >
                  {appLanguage === "es" ? "Volver" : "Back"}
                </Button>
              </HStack>
            </VStack>
          ) : (
            <VStack spacing={2} py={2}>
              <Button
                size="md"
                colorScheme={isRecording ? "red" : "teal"}
                leftIcon={isRecording ? <RiStopCircleLine /> : <RiMicLine />}
                onClick={handleRecord}
                isDisabled={!supportsSpeech}
                _hover={{ transform: "scale(1.02)" }}
              >
                {isRecording
                  ? (appLanguage === "es" ? "Detener" : "Stop")
                  : (appLanguage === "es" ? "Grabar" : "Record")}
              </Button>

              <Button
                size="xs"
                variant="ghost"
                color="whiteAlpha.700"
                onClick={handleFlipBack}
                _hover={{ bg: "whiteAlpha.200" }}
              >
                {appLanguage === "es" ? "Cancelar" : "Cancel"}
              </Button>
            </VStack>
          )}
        </VStack>
      </MotionBox>
    </Box>
  );
}

const LANGUAGE_ALPHABETS = {
  ru: RUSSIAN_ALPHABET,
  ja: JAPANESE_ALPHABET,
};

export default function AlphabetBootcamp({
  appLanguage = "en",
  targetLang,
  npub,
  languageXp = 0,
  pauseMs = 2000,
}) {
  const alphabet = LANGUAGE_ALPHABETS[targetLang] || RUSSIAN_ALPHABET;
  const playerRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const [currentXp, setCurrentXp] = useState(languageXp);

  // Update currentXp when languageXp prop changes
  useEffect(() => {
    setCurrentXp(languageXp);
  }, [languageXp]);

  const handleXpAwarded = (xp) => {
    setCurrentXp((prev) => prev + xp);
  };

  const headline =
    appLanguage === "es"
      ? "Bootcamp de alfabeto"
      : "Alphabet Bootcamp";
  const subhead =
    appLanguage === "es"
      ? "Empieza aquí antes de entrar al árbol de habilidades."
      : "Start here before diving into the skill tree.";
  const note =
    appLanguage === "es"
      ? "Después de esto, cambia al modo Ruta en el menú para explorar las lecciones."
      : "After this, switch to Path mode in the menu to explore lessons.";
  const hasLetters = Array.isArray(alphabet) && alphabet.length;

  // XP progress calculations
  const xpLevelNumber = Math.floor(currentXp / 100) + 1;
  const nextLevelProgressPct = currentXp % 100;

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.audio?.pause?.();
      } catch {}
      playerRef.current?.cleanup?.();
    };
  }, []);

  return (
    <VStack align="stretch" spacing={4} w="100%" color="white">
      {/* XP Progress Bar */}
      <Box
        bg="whiteAlpha.100"
        borderRadius="lg"
        p={4}
        border="1px solid"
        borderColor="whiteAlpha.200"
      >
        <HStack justify="space-between" mb={2}>
          <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.900">
            {appLanguage === "es" ? "Nivel" : "Level"} {xpLevelNumber}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.700">
            {currentXp} XP
          </Text>
        </HStack>
        <WaveBar
          value={nextLevelProgressPct}
          height={12}
          start="#38B2AC"
          end="#81E6D9"
          bg="whiteAlpha.200"
          border="whiteAlpha.300"
        />
        <Text fontSize="xs" color="whiteAlpha.600" mt={1} textAlign="right">
          {nextLevelProgressPct}/100 {appLanguage === "es" ? "para el próximo nivel" : "to next level"}
        </Text>
      </Box>

      <Heading size="lg" color="whiteAlpha.900">
        {headline}
      </Heading>
      <Text color="whiteAlpha.800">{subhead}</Text>
      <Alert status="info" borderRadius="lg" bg="blue.900" color="white">
        <AlertIcon />
        {note}
      </Alert>

      {hasLetters ? (
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 3 }}
          spacing={4}
          mt={2}
          zIndex={10}
          position="relative"
        >
          {alphabet.map((item) => (
            <LetterCard
              key={item.id}
              letter={item}
              appLanguage={appLanguage}
              targetLang={targetLang}
              npub={npub}
              pauseMs={pauseMs}
              onXpAwarded={handleXpAwarded}
              isPlaying={playingId === item.id}
              onPlay={async (data) => {
                const text = (data?.tts || data?.letter || "").toString().trim();
                if (!text) return;

                // Toggle off if the same card is playing
                if (playingId === data.id) {
                  try {
                    playerRef.current?.audio?.pause?.();
                  } catch {}
                  playerRef.current?.cleanup?.();
                  setPlayingId(null);
                  return;
                }

                // Stop any existing playback
                try {
                  playerRef.current?.audio?.pause?.();
                } catch {}
                playerRef.current?.cleanup?.();

                try {
                  const player = await getTTSPlayer({
                    text,
                    langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
                  });
                  playerRef.current = player;
                  setPlayingId(data.id);

                  const audio = player.audio;
                  audio.onended = () => {
                    setPlayingId(null);
                    player.cleanup?.();
                  };
                  audio.onerror = () => {
                    setPlayingId(null);
                    player.cleanup?.();
                  };
                  await player.ready;
                  await audio.play();
                } catch (err) {
                  console.error("AlphabetBootcamp TTS failed", err);
                  setPlayingId(null);
                }
              }}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Flex
          align="center"
          justify="center"
          bg="whiteAlpha.100"
          borderRadius="lg"
          border="1px solid"
          borderColor="whiteAlpha.300"
          p={6}
        >
          <Text color="whiteAlpha.800">
            {appLanguage === "es"
              ? "No pudimos cargar el alfabeto. Intenta nuevamente."
              : "We couldn't load the alphabet. Please try again."}
          </Text>
        </Flex>
      )}
    </VStack>
  );
}
