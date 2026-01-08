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
  Spinner,
  useToast,
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

const MotionBox = motion(Box);

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
  practiceWordMeaning
) {
  if (!npub) return;

  const userRef = doc(database, "users", npub);
  const progressKey = `progress.alphabetPractice.${targetLang}.${letterId}`;

  try {
    const snap = await getDoc(userRef);
    const existingProgress = snap.exists()
      ? snap.data()?.progress?.alphabetPractice?.[targetLang]?.[letterId]
      : null;

    const attempts = (existingProgress?.attempts || 0) + 1;
    const correctCount =
      (existingProgress?.correctCount || 0) + (wasCorrect ? 1 : 0);
    const lastWords = existingProgress?.practicedWords || [];

    // Keep track of last 10 practiced words
    const updatedWords = [...new Set([practiceWord, ...lastWords])].slice(
      0,
      10
    );

    await setDoc(
      userRef,
      {
        [`${progressKey}.attempts`]: attempts,
        [`${progressKey}.correctCount`]: correctCount,
        [`${progressKey}.practicedWords`]: updatedWords,
        [`${progressKey}.lastAttemptAt`]: serverTimestamp(),
        [`${progressKey}.lastWord`]: practiceWord,
        [`${progressKey}.lastWordMeaning`]:
          practiceWordMeaning ?? existingProgress?.lastWordMeaning ?? null,
        "progress.lastActiveAt": serverTimestamp(),
      },
      { merge: true }
    );
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
  correctCount
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
      { merge: true }
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
  letter,
  onPlay,
  isPlaying,
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
  const [practiceWord, setPracticeWord] = useState(
    initialPracticeWord || letter.practiceWord || ""
  );
  const [practiceWordMeaningData, setPracticeWordMeaningData] = useState(
    normalizeMeaning(initialPracticeWordMeaning || letter.practiceWordMeaning)
  );
  const [correctCount, setCorrectCount] = useState(initialCorrectCount);
  const wordPlayerRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    setPracticeWord(initialPracticeWord || letter.practiceWord || "");
    setPracticeWordMeaningData(
      normalizeMeaning(initialPracticeWordMeaning || letter.practiceWordMeaning)
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
    [practiceMarker, practiceWord]
  );

  // Speech practice hook - use hook's isRecording state
  const { startRecording, stopRecording, isRecording, supportsSpeech } =
    useSpeechPractice({
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
        nextPracticeMeaning
      );
      await saveAlphabetPracticeWord(
        npub,
        targetLang,
        letter.id,
        nextPracticeWord,
        nextPracticeMeaning,
        newCorrectCount
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
    setIsPracticeMode(true);
    setIsFlipped(true);
    setShowResult(false);
  };

  const handleFlipBack = () => {
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

  const handlePlayWord = async () => {
    if (!practiceWord) return;

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
        text: practiceWord,
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
    setIsCorrect(false);
  };

  const handleNextWord = async () => {
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
      correctCount
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
    [letter.letter, letter.name, targetLang]
  );

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
          align="center"
          justify="center"
          spacing={4}
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.300"
          borderRadius="lg"
          p={4}
          boxShadow="0 10px 30px rgba(0,0,0,0.35)"
          color="white"
          position="relative"
          sx={{ backfaceVisibility: "hidden" }}
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

            <Text color="whiteAlpha.900" fontSize="sm">
              {sound}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.800">
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
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="teal.400"
          borderRadius="lg"
          p={4}
          boxShadow="0 10px 30px rgba(0,0,0,0.35), 0 0 0 2px rgba(56, 178, 172, 0.3)"
          color="white"
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

          {/* Practice Word Display */}
          <Text fontSize="xs" color="whiteAlpha.700" fontWeight="medium">
            {appLanguage === "es" ? "Di esta palabra:" : "Say this word:"}
          </Text>

          <HStack spacing={2} align="center">
            <Text fontSize="2xl" fontWeight="black" color="white">
              {highlightedPracticeWord.map((part, index) => (
                <Text
                  key={`${part.text}-${index}`}
                  as="span"
                  color={part.highlight ? "green.300" : "white"}
                >
                  {part.text}
                </Text>
              ))}
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

          {showMeaning && (
            <Text fontSize="sm" color="whiteAlpha.700">
              ({practiceWordMeaningText})
            </Text>
          )}

          {/* Recording / Result Area */}
          {isGrading ? (
            <VStack spacing={2} py={2}>
              <Spinner size="md" color="teal.300" />
              <Text fontSize="xs" color="whiteAlpha.700">
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
                    color="white"
                    onClick={handleTryAgain}
                    _hover={{ bg: "whiteAlpha.200" }}
                  >
                    {appLanguage === "es" ? "Otra vez" : "Try again"}
                  </Button>
                )}
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
                  ? appLanguage === "es"
                    ? "Detener"
                    : "Stop"
                  : appLanguage === "es"
                  ? "Grabar"
                  : "Record"}
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
  en: ENGLISH_ALPHABET,
  es: SPANISH_ALPHABET,
  pt: PORTUGUESE_ALPHABET,
  fr: FRENCH_ALPHABET,
  it: ITALIAN_ALPHABET,
  nl: DUTCH_ALPHABET,
  de: GERMAN_ALPHABET,
  nah: NAHUATL_ALPHABET,
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
  const [playingId, setPlayingId] = useState(null);
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

  const targetLanguage = LANGUAGE_NAMES[targetLang] || "Language";
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
            where("targetLang", "==", targetLang)
          )
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
      try {
        playerRef.current?.audio?.pause?.();
      } catch {}
      playerRef.current?.cleanup?.();
    };
  }, []);

  return (
    <VStack align="stretch" spacing={4} w="100%" color="white">
      {/* XP Progress Bar */}
      <Box maxW="400px" mx="auto" w="100%" zIndex={10} mt={12}>
        <HStack justify="space-between" mb={1}>
          <Badge variant="subtle">
            {appLanguage === "es" ? "NIVEL" : "LEVEL"} {xpLevelNumber}
          </Badge>
          <Badge variant="subtle">XP {currentXp}</Badge>
        </HStack>
        <WaveBar
          value={nextLevelProgressPct}
          height={12}
          start="#38B2AC"
          end="#81E6D9"
          bg="whiteAlpha.200"
          border="whiteAlpha.300"
        />
      </Box>

      <Heading
        size="md"
        color="whiteAlpha.900"
        zIndex={10}
        textAlign={"center"}
      >
        {headline}
      </Heading>
      <Text color="whiteAlpha.800" zIndex={10} textAlign={"center"} mt={"-4"}>
        {subhead}
      </Text>
      {/* <Alert status="info" borderRadius="lg" bg="blue.900" color="white">
        <AlertIcon />
        {note}
      </Alert> */}

      {!isInitialized ? (
        <Flex align="center" justify="center" py={12}>
          <Spinner size="lg" color="teal.300" />
        </Flex>
      ) : hasLetters ? (
        <VStack spacing={8} w="100%" zIndex={10}>
          {/* Deck Section */}
          {deck.length > 0 ? (
            <VStack spacing={4} w="100%">
              {/* Progress bar showing completion */}
              <Box w="100%" maxW="400px" mx="auto">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color="whiteAlpha.700">
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
                  bg="whiteAlpha.200"
                  border="whiteAlpha.300"
                />
              </Box>

              {/* Deck visual - stacked cards with top card active */}
              <Box position="relative" w="100%" maxW="400px" mx="auto">
                {/* Top card (current card to practice) */}
                <Box position="relative" zIndex={20}>
                  <LetterCard
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
                    onPlay={async (data) => {
                      const text = (data?.tts || data?.letter || "")
                        .toString()
                        .trim();
                      if (!text) return;

                      if (playingId === data.id) {
                        try {
                          playerRef.current?.audio?.pause?.();
                        } catch {}
                        playerRef.current?.cleanup?.();
                        setPlayingId(null);
                        return;
                      }

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
                </Box>

                {/* Deck thickness indicator - stacked edges below */}
                {deck.length > 1 && (
                  <Box
                    position="relative"
                    zIndex={1}
                    mt={{ base: "-84px", md: "-102px" }}
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
                  onClick={onStartSkillTree}
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
              <HStack spacing={2}>
                <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                  {appLanguage === "es" ? "Colección" : "Collection"}:{" "}
                  {collectedLetters.length}
                </Badge>
              </HStack>

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
                    onPlay={async (data) => {
                      const text = (data?.tts || data?.letter || "")
                        .toString()
                        .trim();
                      if (!text) return;

                      if (playingId === data.id) {
                        try {
                          playerRef.current?.audio?.pause?.();
                        } catch {}
                        playerRef.current?.cleanup?.();
                        setPlayingId(null);
                        return;
                      }

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
            </VStack>
          )}
        </VStack>
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
