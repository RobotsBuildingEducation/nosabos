import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { RUSSIAN_ALPHABET } from "../data/russianAlphabet";
import { JAPANESE_ALPHABET } from "../data/japaneseAlphabet";
import { ENGLISH_ALPHABET } from "../data/englishAlphabet";
import { SPANISH_ALPHABET } from "../data/spanishAlphabet";
import { PORTUGUESE_ALPHABET } from "../data/portugueseAlphabet";
import { FRENCH_ALPHABET } from "../data/frenchAlphabet";
import { ITALIAN_ALPHABET } from "../data/italianAlphabet";
import { DUTCH_ALPHABET } from "../data/dutchAlphabet";
import { GERMAN_ALPHABET } from "../data/germanAlphabet";
import { NAHUATL_ALPHABET } from "../data/nahuatlAlphabet";
import { GREEK_ALPHABET } from "../data/greekAlphabet";
import { POLISH_ALPHABET } from "../data/polishAlphabet";
import { IRISH_ALPHABET } from "../data/irishAlphabet";
import { YUCATEC_MAYA_ALPHABET } from "../data/yucatecMayaAlphabet";
import { FiVolume2 } from "react-icons/fi";
import {
  RiMicLine,
  RiStopCircleLine,
  RiCheckLine,
  RiCloseLine,
  RiStarFill,
} from "react-icons/ri";
import { getTTSPlayer, TTS_LANG_TAG } from "../utils/tts";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { awardXp } from "../utils/utils";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";
import { WaveBar } from "./WaveBar";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import nextButtonSound from "../assets/nextbutton.mp3";
import VoiceOrb from "./VoiceOrb";
import XpProgressHeader from "./XpProgressHeader";

const MotionBox = motion(Box);
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

// Language name and script mapping for all supported languages
const LANGUAGE_NAMES = {
  ru: "Russian",
  ja: "Japanese",
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  nl: "Dutch",
  de: "German",
  nah: "Nahuatl",
  el: "Greek",
  pl: "Polish",
  ga: "Irish",
  yua: "Yucatec Maya",
};

const LANGUAGE_NAMES_EN = {
  ru: "Russian",
  ja: "Japanese",
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  nl: "Dutch",
  de: "German",
  nah: "Nahuatl",
  el: "Greek",
  pl: "Polish",
  ga: "Irish",
  yua: "Yucatec Maya",
};

const LANGUAGE_NAMES_ES = {
  ru: "Ruso",
  ja: "Japonés",
  en: "Inglés",
  es: "Español",
  pt: "Portugués",
  fr: "Francés",
  it: "Italiano",
  nl: "Neerlandés",
  de: "Alemán",
  nah: "Náhuatl",
  el: "Griego",
  pl: "Polaco",
  ga: "Irlandés",
  yua: "Maya yucateco",
};

const LANGUAGE_SCRIPTS = {
  ru: "Cyrillic",
  ja: "hiragana or katakana",
  en: "Latin alphabet",
  es: "Latin alphabet",
  pt: "Latin alphabet",
  fr: "Latin alphabet",
  it: "Latin alphabet",
  nl: "Latin alphabet",
  de: "Latin alphabet",
  nah: "Latin alphabet",
  el: "Greek alphabet",
  pl: "Latin alphabet",
  ga: "Latin alphabet",
  yua: "Latin alphabet",
};

const normalizeMeaning = (meaning) => {
  if (!meaning) return { en: "", es: "" };
  if (typeof meaning === "string") {
    return { en: meaning, es: meaning };
  }

  const en = meaning.en || meaning.es || "";
  const es = meaning.es || meaning.en || "";

  return { en, es };
};

// Build AI grading prompt for alphabet practice
function buildAlphabetJudgePrompt({ practiceWord, userAnswer, targetLang }) {
  const langName = LANGUAGE_NAMES[targetLang] || "the target";

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
async function saveAlphabetProgress(
  npub,
  targetLang,
  letterId,
  practiceWord,
  wasCorrect,
  practiceWordMeaning,
) {
  if (!npub) return;

  const userRef = doc(database, "users", npub);
  const docId = `${targetLang}_${letterId}`;
  const alphabetProgressRef = doc(
    database,
    "users",
    npub,
    "alphabetPractice",
    docId,
  );

  try {
    const snap = await getDoc(alphabetProgressRef);
    const existingProgress = snap.exists() ? snap.data() : null;

    const attempts = (existingProgress?.attempts || 0) + 1;
    const correctCount =
      (existingProgress?.correctCount || 0) + (wasCorrect ? 1 : 0);
    const lastWords = existingProgress?.practicedWords || [];

    // Keep track of last 10 practiced words
    const updatedWords = [...new Set([practiceWord, ...lastWords])].slice(
      0,
      10,
    );

    await Promise.all([
      setDoc(
        alphabetProgressRef,
        {
          letterId,
          targetLang,
          attempts,
          correctCount,
          practicedWords: updatedWords,
          lastAttemptAt: serverTimestamp(),
          lastWord: practiceWord,
          lastWordMeaning:
            practiceWordMeaning ?? existingProgress?.lastWordMeaning ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
      setDoc(
        userRef,
        {
          "progress.lastActiveAt": serverTimestamp(),
        },
        { merge: true },
      ),
    ]);
  } catch (error) {
    console.error("Error saving alphabet progress:", error);
  }
}

async function saveAlphabetPracticeWord(
  npub,
  targetLang,
  letterId,
  practiceWord,
  practiceWordMeaning,
  correctCount,
) {
  if (!npub) return;

  try {
    const docId = `${targetLang}_${letterId}`;
    await setDoc(
      doc(database, "users", npub, "alphabetPractice", docId),
      {
        letterId,
        targetLang,
        currentWord: practiceWord,
        currentMeaning: practiceWordMeaning ?? null,
        correctCount: correctCount ?? 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving alphabet practice word:", error);
  }
}

const getPracticeLetterMarker = (letter) => {
  if (!letter?.letter) return "";
  return letter.letter.split("/")[0]?.trim()?.split(" ")[0] || "";
};

const getHighlightedWordParts = (word, marker) => {
  if (!word || !marker) return [{ text: word, highlight: false }];

  const parts = [];
  let index = 0;
  const lowerWord = word.toLowerCase();
  const lowerMarker = marker.toLowerCase();

  while (index < word.length) {
    const matchIndex = lowerWord.indexOf(lowerMarker, index);
    if (matchIndex === -1) {
      parts.push({ text: word.slice(index), highlight: false });
      break;
    }

    if (matchIndex > index) {
      parts.push({ text: word.slice(index, matchIndex), highlight: false });
    }

    // Use the actual characters from the word (preserving original case)
    parts.push({
      text: word.slice(matchIndex, matchIndex + marker.length),
      highlight: true,
    });
    index = matchIndex + marker.length;
  }

  return parts;
};

function LetterCard({
  playSound,
  letter,
  onPlay,
  isPlaying,
  isLoading = false,
  appLanguage,
  targetLang,
  npub,
  onXpAwarded,
  initialPracticeWord,
  initialPracticeWordMeaning,
  initialCorrectCount = 0,
  onPracticeWordUpdated,
  onCardCollected,
  pauseMs = 2000,
}) {
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isLoadingTts, setIsLoadingTts] = useState(false);
  const [practiceWord, setPracticeWord] = useState(
    initialPracticeWord || letter.practiceWord || "",
  );
  const [practiceWordMeaningData, setPracticeWordMeaningData] = useState(
    normalizeMeaning(initialPracticeWordMeaning || letter.practiceWordMeaning),
  );
  const [correctCount, setCorrectCount] = useState(initialCorrectCount);
  const wordPlayerRef = useRef(null);
  const wordPlaybackRequestRef = useRef(0);
  const toast = useToast();

  useEffect(() => {
    setPracticeWord(initialPracticeWord || letter.practiceWord || "");
    setPracticeWordMeaningData(
      normalizeMeaning(
        initialPracticeWordMeaning || letter.practiceWordMeaning,
      ),
    );
  }, [
    initialPracticeWord,
    initialPracticeWordMeaning,
    letter.practiceWord,
    letter.practiceWordMeaning,
  ]);

  // Sync correctCount only when initial value changes (on load)
  useEffect(() => {
    setCorrectCount(initialCorrectCount);
  }, [initialCorrectCount]);

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

  const sound =
    appLanguage === "es" ? letter.soundEs || letter.sound : letter.sound;
  const tip = appLanguage === "es" ? letter.tipEs || letter.tip : letter.tip;
  const practiceWordMeaningText =
    practiceWordMeaningData?.[appLanguage === "es" ? "es" : "en"] || "";
  const showMeaning = Boolean(practiceWordMeaningText);
  const practiceMarker = getPracticeLetterMarker(letter);
  const highlightedPracticeWord = useMemo(
    () => getHighlightedWordParts(practiceWord, practiceMarker),
    [practiceMarker, practiceWord],
  );

  // Speech practice hook - use hook's isRecording and isConnecting states
  const {
    startRecording,
    stopRecording,
    isRecording,
    isConnecting,
    supportsSpeech,
  } = useSpeechPractice({
    targetText: practiceWord || "placeholder",
    targetLang: targetLang,
    onResult: ({ recognizedText: text, error }) => {
      if (error) {
        toast({
          title:
            appLanguage === "es" ? "Error de grabación" : "Recording error",
          description:
            appLanguage === "es"
              ? "No se pudo grabar. Intenta de nuevo."
              : "Could not record. Please try again.",
          status: "error",
          duration: 2500,
        });
        return;
      }

      const recognized = text || "";
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
          practiceWord,
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
      setShowResult(true);

      let nextPracticeWord = practiceWord;
      let nextPracticeMeaning = practiceWordMeaningData;

      // Award XP and save progress
      if (isYes) {
        setCorrectCount((c) => c + 1);
        if (npub) {
          await awardXp(npub, xp, targetLang);
          onXpAwarded?.(xp);
        }
        // First successful practice - collect the card
        if (correctCount === 0) {
          onCardCollected?.(letter.id);
        }
      }

      // Calculate new correctCount (since setCorrectCount is async)
      const newCorrectCount = isYes ? correctCount + 1 : correctCount;

      // Save progress regardless of result
      await saveAlphabetProgress(
        npub,
        targetLang,
        letter.id,
        nextPracticeWord,
        isYes,
        nextPracticeMeaning,
      );
      await saveAlphabetPracticeWord(
        npub,
        targetLang,
        letter.id,
        nextPracticeWord,
        nextPracticeMeaning,
        newCorrectCount,
      );
    } catch (error) {
      console.error("AI grading error:", error);
      toast({
        title: appLanguage === "es" ? "Error al evaluar" : "Grading error",
        description:
          appLanguage === "es"
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
    playSound(selectSound);
    setIsPracticeMode(true);
    setIsFlipped(true);
    setShowResult(false);
  };

  const handleFlipBack = () => {
    playSound(selectSound);
    setIsFlipped(false);
    setTimeout(() => {
      setIsPracticeMode(false);
      setShowResult(false);
    }, 300);
  };

  const handleRecord = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    // Clear previous results
    setShowResult(false);
    setIsCorrect(false);
    playSound(submitActionSound);

    try {
      await startRecording();
    } catch (err) {
      const code = err?.code;
      if (code === "no-speech-recognition") {
        toast({
          title:
            appLanguage === "es"
              ? "Sin soporte de voz"
              : "Speech not supported",
          description:
            appLanguage === "es"
              ? "Tu navegador no soporta reconocimiento de voz."
              : "Your browser doesn't support speech recognition.",
          status: "warning",
          duration: 3200,
        });
      } else if (code === "mic-denied") {
        toast({
          title:
            appLanguage === "es" ? "Micrófono denegado" : "Microphone denied",
          description:
            appLanguage === "es"
              ? "Permite el acceso al micrófono para grabar."
              : "Please allow microphone access to record.",
          status: "error",
          duration: 3200,
        });
      }
    }
  };

  const stopWordPlayback = useCallback(() => {
    wordPlaybackRequestRef.current += 1;
    try {
      wordPlayerRef.current?.audio?.pause?.();
    } catch {}
    wordPlayerRef.current?.cleanup?.();
    wordPlayerRef.current = null;
    setIsPlayingWord(false);
    setIsLoadingTts(false);
  }, []);

  const handlePlayWord = async () => {
    if (!practiceWord) return;

    if (isPlayingWord || isLoadingTts) {
      stopWordPlayback();
      return;
    }

    stopWordPlayback();
    const requestId = wordPlaybackRequestRef.current;
    setIsLoadingTts(true);

    try {
      const player = await getTTSPlayer({
        text: practiceWord,
        langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
      });

      if (requestId !== wordPlaybackRequestRef.current) {
        player.cleanup?.();
        return;
      }

      wordPlayerRef.current = player;

      await player.ready;

      if (requestId !== wordPlaybackRequestRef.current) {
        player.cleanup?.();
        wordPlayerRef.current = null;
        return;
      }

      const finishPlayback = () => {
        if (requestId !== wordPlaybackRequestRef.current) return;
        setIsPlayingWord(false);
        setIsLoadingTts(false);
        wordPlayerRef.current = null;
        player.cleanup?.();
      };

      player.audio.onended = finishPlayback;
      player.audio.onerror = finishPlayback;

      setIsLoadingTts(false);
      setIsPlayingWord(true);
      await player.audio.play();
    } catch (err) {
      if (requestId !== wordPlaybackRequestRef.current) return;
      console.error("TTS error:", err);
      stopWordPlayback();
    }
  };

  const handleTryAgain = () => {
    playSound(selectSound);
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleNextWord = async () => {
    playSound(nextButtonSound);
    const generated = await generateNewPracticeWord(practiceWord);
    if (!generated?.word) {
      toast({
        title:
          appLanguage === "es"
            ? "No pudimos generar una palabra"
            : "Couldn't generate a new word",
        status: "warning",
        duration: 2500,
      });
      return;
    }

    const nextPracticeWord = generated.word;
    const nextPracticeMeaning = normalizeMeaning(generated.meaning);
    setPracticeWord(nextPracticeWord);
    setPracticeWordMeaningData(nextPracticeMeaning);
    onPracticeWordUpdated?.(letter.id, nextPracticeWord, nextPracticeMeaning);
    await saveAlphabetPracticeWord(
      npub,
      targetLang,
      letter.id,
      nextPracticeWord,
      nextPracticeMeaning,
      correctCount,
    );
    setShowResult(false);
    setIsCorrect(false);
  };

  const generateNewPracticeWord = useCallback(
    async (currentWord) => {
      const languageName = LANGUAGE_NAMES[targetLang] || "the target language";
      const scriptName = LANGUAGE_SCRIPTS[targetLang] || "native script";
      const avoidClause = currentWord
        ? `\n- Do NOT use the word "${currentWord}" - generate a DIFFERENT word.`
        : "";
      const prompt = `Generate one beginner-friendly ${languageName} word that starts with the ${languageName} letter/syllable "${letter.letter}" (${letter.name}). Respond ONLY with JSON in this shape:
{"word":"<${languageName} word in native script>","meaning_en":"<short english meaning>","meaning_es":"<short spanish meaning>"}
- Use ${scriptName}.
- Keep the word simple (2-4 syllables) and common.${avoidClause}
- Do not add any extra text.`;

      try {
        const raw = await callResponses({
          model: DEFAULT_RESPONSES_MODEL,
          input: prompt,
        });
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
        const word = String(parsed.word || "").trim();
        const meaning = normalizeMeaning({
          en: parsed.meaning_en || parsed.meaning || "",
          es: parsed.meaning_es || parsed.meaning || "",
        });

        if (!word) return null;

        return { word, meaning };
      } catch (error) {
        console.error("Failed to generate practice word:", error);
        return null;
      }
    },
    [letter.letter, letter.name, targetLang],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWordPlayback();
    };
  }, [stopWordPlayback]);

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
          align="center"
          justify="center"
          spacing={4}
          bg={APP_SURFACE_ELEVATED}
          border="1px solid"
          borderColor={APP_BORDER}
          borderRadius="lg"
          p={4}
          boxShadow={APP_SHADOW}
          color={APP_TEXT_PRIMARY}
          position="relative"
          sx={{ backfaceVisibility: "hidden" }}
          minH={{ base: "260px", md: "230px" }}
        >
          {/* Star counter */}
          {correctCount === 0 ? null : (
            <HStack spacing={1} position="absolute" top={3} left={3}>
              <RiStarFill size={14} color="cyan" />
              <Text fontSize="xs" fontWeight="bold">
                {correctCount}
              </Text>
            </HStack>
          )}

          <HStack justify="space-between" w="100%">
            <Badge colorScheme={typeColor} borderRadius="md" px={2} py={1}>
              {typeLabel}
            </Badge>
            {practiceWord && (
              <Button
                size="sm"
                background="transparent"
                border="1px solid"
                borderColor={APP_BORDER_STRONG}
                boxShadow="0px 2px 0px rgba(148, 163, 184, 0.35)"
                color={APP_TEXT_PRIMARY}
                leftIcon={<RiMicLine size={12} />}
                onClick={handlePracticeClick}
                fontSize="xs"
                _hover={{ bg: APP_SURFACE_MUTED }}
              >
                {appLanguage === "es" ? "Practicar" : "Practice"}
              </Button>
            )}
          </HStack>

          <VStack spacing={3} align="center" textAlign="center" w="100%">
            <Flex align="center" justify="center" w="100%" gap={3} minH="48px">
              <VStack spacing={1} align="center">
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
                  bg={APP_SURFACE_MUTED}
                  border="1px solid"
                  borderColor={APP_BORDER}
                  borderRadius="full"
                  p={2}
                  _hover={{ bg: APP_SURFACE }}
                  color={isLoading || isPlaying ? "teal.500" : APP_TEXT_PRIMARY}
                  onClick={() => onPlay(letter)}
                >
                  {isLoading || isPlaying ? (
                    <Spinner size={"xs"} />
                  ) : (
                    <FiVolume2 />
                  )}
                </Flex>
              )}
            </Flex>

            <Text color={APP_TEXT_PRIMARY} fontSize="sm">
              {sound}
            </Text>
            <Text fontSize="2xs" color={APP_TEXT_SECONDARY}>
              {tip}
            </Text>
          </VStack>
        </VStack>

        {/* Back Side - Practice Mode */}
        <VStack
          gridArea="1 / 1"
          w="100%"
          h="100%"
          align="center"
          justify="center"
          spacing={3}
          bg={APP_SURFACE_ELEVATED}
          border="1px solid"
          borderColor={APP_BORDER_STRONG}
          borderRadius="lg"
          p={4}
          boxShadow={APP_SHADOW}
          color={APP_TEXT_PRIMARY}
          position="relative"
          sx={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Star counter */}
          <HStack spacing={1} position="absolute" top={3} left={3}>
            <RiStarFill size={14} color="#ECC94B" />
            <Text fontSize="xs" fontWeight="bold" color="yellow.400">
              {correctCount}
            </Text>
          </HStack>

          {/* Close button */}
          <IconButton
            aria-label={appLanguage === "es" ? "Cerrar" : "Close"}
            icon={<RiCloseLine size={18} />}
            size="xs"
            bg="transparent"
            border="1px solid"
            borderColor={APP_BORDER_STRONG}
            boxShadow="0px 2px 0px rgba(148, 163, 184, 0.35)"
            color={APP_TEXT_SECONDARY}
            position="absolute"
            top={2}
            right={2}
            onClick={handleFlipBack}
            _hover={{ bg: APP_SURFACE_MUTED }}
          />

          {/* Practice Word Display */}
          <Text fontSize="xs" color={APP_TEXT_SECONDARY} fontWeight="medium">
            {appLanguage === "es" ? "Di esta palabra:" : "Say this word:"}
          </Text>

          <HStack spacing={2} align="center">
            <Text fontSize="2xl" fontWeight="black" color={APP_TEXT_PRIMARY}>
              {highlightedPracticeWord.map((part, index) => (
                <Text
                  key={`${part.text}-${index}`}
                  as="span"
                  color={part.highlight ? "green.500" : APP_TEXT_PRIMARY}
                >
                  {part.text}
                </Text>
              ))}
            </Text>
            <IconButton
              aria-label="Play word"
              icon={
                isLoadingTts || isPlayingWord ? (
                  <Spinner size="xs" />
                ) : (
                  <FiVolume2 />
                )
              }
              size="sm"
              variant="ghost"
              color={isLoadingTts || isPlayingWord ? "teal.500" : APP_TEXT_PRIMARY}
              onClick={handlePlayWord}
              isDisabled={isLoadingTts}
              _hover={{ bg: APP_SURFACE_MUTED }}
            />
          </HStack>

          {showMeaning && (
            <Text fontSize="sm" color={APP_TEXT_SECONDARY}>
              ({practiceWordMeaningText})
            </Text>
          )}

          {/* Recording / Result Area */}
          {isGrading ? (
            <VStack spacing={2} py={2}>
              <VoiceOrb
                state={
                  ["idle", "listening", "speaking"][
                    Math.floor(Math.random() * 3)
                  ]
                }
                size={32}
              />
              <Text fontSize="xs" color={APP_TEXT_SECONDARY}>
                {appLanguage === "es" ? "Evaluando..." : "Grading..."}
              </Text>
            </VStack>
          ) : showResult ? (
            <VStack spacing={3} py={2}>
              <Flex
                align="center"
                justify="center"
                w={10}
                h={10}
                borderRadius="full"
                bg={isCorrect ? "green.500" : "red.500"}
              >
                {isCorrect ? (
                  <RiCheckLine size={24} />
                ) : (
                  <RiCloseLine size={24} />
                )}
              </Flex>

              <HStack spacing={2} mt={1}>
                {isCorrect ? (
                  <Button
                    size="xs"
                    colorScheme="green"
                    onClick={handleNextWord}
                    _hover={{ bg: "green.400" }}
                  >
                    {appLanguage === "es" ? "Siguiente palabra" : "Next word"}
                  </Button>
                ) : (
                  <Button
                    size="xs"
                    variant="ghost"
                    color={APP_TEXT_PRIMARY}
                    onClick={handleTryAgain}
                    _hover={{ bg: APP_SURFACE_MUTED }}
                  >
                    {appLanguage === "es" ? "Otra vez" : "Try again"}
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  color={APP_TEXT_PRIMARY}
                  onClick={handleFlipBack}
                  _hover={{ bg: APP_SURFACE_MUTED }}
                >
                  {appLanguage === "es" ? "Volver" : "Back"}
                </Button>
              </HStack>
            </VStack>
          ) : (
            <VStack spacing={2} py={2}>
              <Button
                size="md"
                colorScheme={
                  isRecording ? undefined : isConnecting ? "yellow" : "teal"
                }
                bg={isRecording ? SOFT_STOP_BUTTON_BG : undefined}
                boxShadow={isRecording ? "0px 4px 0px #e03767" : undefined}
                color={isRecording ? "white" : undefined}
                leftIcon={
                  isConnecting ? (
                    <Spinner size="xs" />
                  ) : isRecording ? (
                    <RiStopCircleLine />
                  ) : (
                    <RiMicLine />
                  )
                }
                onClick={handleRecord}
                isDisabled={!supportsSpeech || isConnecting}
                _hover={{
                  transform: "scale(1.02)",
                  ...(isRecording ? { bg: SOFT_STOP_BUTTON_HOVER_BG } : {}),
                }}
              >
                {isConnecting
                  ? appLanguage === "es"
                    ? "Conectando..."
                    : "Connecting..."
                  : isRecording
                    ? appLanguage === "es"
                      ? "Detener"
                      : "Stop"
                    : appLanguage === "es"
                      ? "Grabar"
                      : "Record"}
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
  en: ENGLISH_ALPHABET,
  es: SPANISH_ALPHABET,
  pt: PORTUGUESE_ALPHABET,
  fr: FRENCH_ALPHABET,
  it: ITALIAN_ALPHABET,
  nl: DUTCH_ALPHABET,
  de: GERMAN_ALPHABET,
  nah: NAHUATL_ALPHABET,
  el: GREEK_ALPHABET,
  pl: POLISH_ALPHABET,
  ga: IRISH_ALPHABET,
  yua: YUCATEC_MAYA_ALPHABET,
};

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function AlphabetBootcamp({
  appLanguage = "en",
  targetLang,
  npub,
  languageXp = 0,
  pauseMs = 2000,
  onStartSkillTree,
}) {
  const alphabet = LANGUAGE_ALPHABETS[targetLang] || RUSSIAN_ALPHABET;
  const playerRef = useRef(null);
  const playbackRequestRef = useRef(0);
  const playSound = useSoundSettings((s) => s.playSound);
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [currentXp, setCurrentXp] = useState(languageXp);
  const [savedPracticeWords, setSavedPracticeWords] = useState({});
  const [savedCorrectCounts, setSavedCorrectCounts] = useState({});

  // Deck-based state
  const [deck, setDeck] = useState([]);
  const [collectedLetters, setCollectedLetters] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update currentXp when languageXp prop changes
  useEffect(() => {
    setCurrentXp(languageXp);
  }, [languageXp]);

  const handleXpAwarded = (xp) => {
    setCurrentXp((prev) => prev + xp);
  };

  const handleStartSkillTreeClick = useCallback(() => {
    playSound(selectSound);
    onStartSkillTree?.();
  }, [onStartSkillTree, playSound]);

  const targetLanguage =
    appLanguage === "es"
      ? LANGUAGE_NAMES_ES[targetLang]
      : LANGUAGE_NAMES_EN[targetLang] || "Language";
  const headline =
    appLanguage === "es"
      ? `Alfabeto ${targetLanguage}`
      : `${targetLanguage} Alphabet`;
  const subhead =
    appLanguage === "es"
      ? `Empieza aprendiendo las letras y sonidos del ${targetLanguage}.`
      : `Start by learning ${targetLanguage} letters and sounds.`;
  const note =
    appLanguage === "es"
      ? "Después de esto, cambia al modo Ruta en el menú para explorar las lecciones."
      : "After this, switch to Path mode in the menu to explore lessons.";
  const hasLetters = Array.isArray(alphabet) && alphabet.length;
  const isComplete =
    hasLetters &&
    deck.length === 0 &&
    collectedLetters.length === alphabet.length;

  // XP progress calculations
  const xpLevelNumber = Math.floor(currentXp / 100) + 1;
  const nextLevelProgressPct = currentXp % 100;

  const handlePracticeWordUpdated = useCallback((letterId, word, meaning) => {
    setSavedPracticeWords((prev) => ({
      ...prev,
      [letterId]: { word, meaning: normalizeMeaning(meaning) },
    }));
  }, []);

  // When a card is successfully practiced, move it from deck to collection
  const handleCardCollected = useCallback((letterId) => {
    setDeck((prevDeck) => {
      const cardIndex = prevDeck.findIndex((l) => l.id === letterId);
      if (cardIndex === -1) return prevDeck; // Already removed

      const card = prevDeck[cardIndex];
      // Add to collection
      setCollectedLetters((prev) => [...prev, card]);

      // Remove from deck
      return prevDeck.filter((l) => l.id !== letterId);
    });

    // Update saved correct counts (they just got their first correct)
    setSavedCorrectCounts((prev) => ({
      ...prev,
      [letterId]: (prev[letterId] || 0) + 1,
    }));
  }, []);

  const stopLetterPlayback = useCallback(() => {
    playbackRequestRef.current += 1;
    try {
      playerRef.current?.audio?.pause?.();
    } catch {}
    playerRef.current?.cleanup?.();
    playerRef.current = null;
    setPlayingId(null);
    setLoadingId(null);
  }, []);

  const handlePlayLetterAudio = useCallback(
    async (data) => {
      const text = (data?.tts || data?.letter || "").toString().trim();
      if (!text) return;

      const isSameCardActive = playingId === data.id || loadingId === data.id;
      const isPlaybackActuallyActive =
        loadingId === data.id ||
        Boolean(playerRef.current?.audio && !playerRef.current.audio.paused);

      if (isSameCardActive && isPlaybackActuallyActive) {
        stopLetterPlayback();
        return;
      }

      try {
        stopLetterPlayback();
        const requestId = playbackRequestRef.current;
        setLoadingId(data.id);

        const player = await getTTSPlayer({
          text,
          langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
        });

        if (requestId !== playbackRequestRef.current) {
          player.cleanup?.();
          return;
        }

        playerRef.current = player;
        await player.ready;

        if (requestId !== playbackRequestRef.current) {
          player.cleanup?.();
          playerRef.current = null;
          return;
        }

        const finishPlayback = () => {
          if (requestId !== playbackRequestRef.current) return;
          setPlayingId(null);
          setLoadingId(null);
          playerRef.current = null;
          player.cleanup?.();
        };

        const audio = player.audio;
        audio.onended = finishPlayback;
        audio.onerror = finishPlayback;

        setLoadingId(null);
        setPlayingId(data.id);
        await audio.play();
      } catch (err) {
        console.error("AlphabetBootcamp TTS failed", err);
        stopLetterPlayback();
      }
    },
    [loadingId, playingId, stopLetterPlayback, targetLang],
  );

  useEffect(() => {
    setSavedPracticeWords({});
    setSavedCorrectCounts({});
    setIsInitialized(false);

    if (!npub) {
      // No user - initialize deck with all letters shuffled
      const shuffled = shuffleArray(alphabet);
      setDeck(shuffled);
      setCollectedLetters([]);
      setIsInitialized(true);
      return;
    }
    let cancelled = false;

    const loadProgress = async () => {
      try {
        // Load practice words and correctCounts from subcollection
        const snapshot = await getDocs(
          query(
            collection(database, "users", npub, "alphabetPractice"),
            where("targetLang", "==", targetLang),
          ),
        );

        const mapped = {};
        const correctCounts = {};
        const collectedIds = new Set();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?.letterId) {
            if (data?.currentWord) {
              mapped[data.letterId] = {
                word: data.currentWord,
                meaning: normalizeMeaning(data.currentMeaning),
              };
            }
            if (data?.correctCount) {
              correctCounts[data.letterId] = data.correctCount;
              // Letters with at least 1 correct are "collected"
              if (data.correctCount >= 1) {
                collectedIds.add(data.letterId);
              }
            }
          }
        });

        if (!cancelled) {
          setSavedPracticeWords(mapped);
          setSavedCorrectCounts(correctCounts);

          // Initialize deck: shuffle letters that haven't been collected
          const uncollected = alphabet.filter((l) => !collectedIds.has(l.id));
          const collected = alphabet.filter((l) => collectedIds.has(l.id));

          setDeck(shuffleArray(uncollected));
          setCollectedLetters(collected);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to load alphabet progress:", error);
        if (!cancelled) {
          setSavedPracticeWords({});
          setSavedCorrectCounts({});
          // Fallback: all letters in deck
          setDeck(shuffleArray(alphabet));
          setCollectedLetters([]);
          setIsInitialized(true);
        }
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [npub, targetLang, alphabet]);

  useEffect(() => {
    return () => {
      stopLetterPlayback();
    };
  }, [stopLetterPlayback]);

  return (
    <VStack align="stretch" spacing={4} w="100%" color={APP_TEXT_PRIMARY} px={6}>
      {/* XP Progress Bar */}
      <Box maxW="400px" mx="auto" w="100%" zIndex={10} mt={12}>
        <XpProgressHeader
          levelText={`${appLanguage === "es" ? "Nivel" : "Level"} ${xpLevelNumber}`}
          xpText={`XP ${currentXp}`}
          progressPct={nextLevelProgressPct}
          barProps={{
            height: 12,
            start: "#38B2AC",
            end: "#81E6D9",
            bg: APP_SURFACE_MUTED,
            border: APP_BORDER,
          }}
        />
      </Box>

      <Heading
        size="md"
        color={APP_TEXT_PRIMARY}
        zIndex={10}
        textAlign={"center"}
      >
        {headline}
      </Heading>
      <Text color={APP_TEXT_SECONDARY} zIndex={10} textAlign={"center"} mt={"-4"}>
        {subhead}
      </Text>
      {/* <Alert status="info" borderRadius="lg" bg="blue.900" color="white">
        <AlertIcon />
        {note}
      </Alert> */}

      {!isInitialized ? (
        <Flex align="center" justify="center" py={12}>
          <VoiceOrb
            state={
              ["idle", "listening", "speaking"][Math.floor(Math.random() * 3)]
            }
            size={48}
          />
        </Flex>
      ) : hasLetters ? (
        <VStack spacing={8} w="100%" zIndex={10}>
          {/* Deck Section */}
          {deck.length > 0 ? (
            <VStack spacing={4} w="100%">
              {/* Progress bar showing completion */}
              <Box w="100%" maxW="400px" mx="auto">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color={APP_TEXT_SECONDARY}>
                    {appLanguage === "es" ? "Progreso" : "Progress"}
                  </Text>
                  <Text fontSize="xs" color="yellow.300" fontWeight="bold">
                    {collectedLetters.length} / {alphabet.length}
                  </Text>
                </HStack>
                <WaveBar
                  value={(collectedLetters.length / alphabet.length) * 100}
                  height={10}
                  start="#D69E2E"
                  end="#F6E05E"
                  bg={APP_SURFACE_MUTED}
                  border={APP_BORDER}
                />
              </Box>

              {/* Deck visual - stacked cards with top card active */}
              <Box position="relative" w="100%" maxW="400px" mx="auto">
                {/* Top card (current card to practice) */}
                <Box position="relative" zIndex={20}>
                  <LetterCard
                    playSound={playSound}
                    key={deck[0].id}
                    letter={deck[0]}
                    appLanguage={appLanguage}
                    targetLang={targetLang}
                    npub={npub}
                    pauseMs={pauseMs}
                    onXpAwarded={handleXpAwarded}
                    initialPracticeWord={
                      savedPracticeWords[deck[0].id]?.word ||
                      deck[0].practiceWord
                    }
                    initialPracticeWordMeaning={
                      savedPracticeWords[deck[0].id]?.meaning ||
                      deck[0].practiceWordMeaning
                    }
                    initialCorrectCount={savedCorrectCounts[deck[0].id] || 0}
                    onPracticeWordUpdated={handlePracticeWordUpdated}
                    onCardCollected={handleCardCollected}
                    isPlaying={playingId === deck[0].id}
                    isLoading={loadingId === deck[0].id}
                    onPlay={handlePlayLetterAudio}
                  />
                </Box>

                {/* Deck thickness indicator - stacked edges below */}
                {deck.length > 1 && (
                  <Box
                    position="relative"
                    zIndex={1}
                    mt={{ base: "-60px", md: "-102px" }}
                    mx="1px"
                  >
                    {[...Array(Math.min(deck.length - 1, 8))].map((_, i) => (
                      <Box
                        key={i}
                        h="4px"
                        bg={i % 2 === 0 ? "gray.600" : "gray.700"}
                        borderBottomRadius={
                          i === Math.min(deck.length - 2, 7) ? "lg" : "none"
                        }
                        mx={`${i * 1}px`}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </VStack>
          ) : (
            <VStack spacing={4}>
              <Flex
                align="center"
                justify="center"
                bg="green.900"
                borderRadius="lg"
                border="1px solid"
                borderColor="green.500"
                p={6}
                maxW="400px"
                mx="auto"
              >
                <VStack spacing={2}>
                  <Text fontSize="2xl">🎉</Text>
                  <Text color="green.200" fontWeight="bold" textAlign="center">
                    {appLanguage === "es"
                      ? "¡Felicidades! Has completado el alfabeto."
                      : "Congratulations! You've completed the alphabet."}
                  </Text>
                </VStack>
              </Flex>
              {isComplete && (
                <Button
                  colorScheme="teal"
                  size="lg"
                  onClick={handleStartSkillTreeClick}
                >
                  {appLanguage === "es"
                    ? "Iniciar árbol de habilidades"
                    : "Start skill tree"}
                </Button>
              )}
            </VStack>
          )}

          {/* Collection Section */}
          {collectedLetters.length > 0 && (
            <VStack spacing={4} w="100%">
              {/* <HStack spacing={2}>
                <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                  {appLanguage === "es" ? "Colección" : "Collection"}:{" "}
                  {collectedLetters.length}
                </Badge>
              </HStack> */}

              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3 }}
                spacing={4}
                w="100%"
              >
                {collectedLetters.map((item) => (
                  <LetterCard
                    key={item.id}
                    letter={item}
                    appLanguage={appLanguage}
                    targetLang={targetLang}
                    npub={npub}
                    pauseMs={pauseMs}
                    onXpAwarded={handleXpAwarded}
                    initialPracticeWord={
                      savedPracticeWords[item.id]?.word || item.practiceWord
                    }
                    initialPracticeWordMeaning={
                      savedPracticeWords[item.id]?.meaning ||
                      item.practiceWordMeaning
                    }
                    initialCorrectCount={savedCorrectCounts[item.id] || 0}
                    onPracticeWordUpdated={handlePracticeWordUpdated}
                    isPlaying={playingId === item.id}
                    isLoading={loadingId === item.id}
                    onPlay={handlePlayLetterAudio}
                  />
                ))}
              </SimpleGrid>
            </VStack>
          )}
        </VStack>
      ) : (
        <Flex
          align="center"
          justify="center"
          bg={APP_SURFACE_ELEVATED}
          borderRadius="lg"
          border="1px solid"
          borderColor={APP_BORDER}
          p={6}
          boxShadow={APP_SHADOW}
        >
          <Text color={APP_TEXT_SECONDARY}>
            {appLanguage === "es"
              ? "No pudimos cargar el alfabeto. Intenta nuevamente."
              : "We couldn't load the alphabet. Please try again."}
          </Text>
        </Flex>
      )}
    </VStack>
  );
}
