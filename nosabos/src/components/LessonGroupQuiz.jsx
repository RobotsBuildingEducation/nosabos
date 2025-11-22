// components/LessonGroupQuiz.jsx
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Badge,
  Button,
  Flex,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
  CheckboxGroup,
  Tooltip,
  IconButton,
  useToast,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import {
  doc,
  onSnapshot,
  increment,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { database, simplemodel } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { WaveBar } from "./WaveBar";
import { SpeakSuccessCard } from "./SpeakSuccessCard";
import RobotBuddyPro from "./RobotBuddyPro";
import translations from "../utils/translation";
import { PasscodePage } from "./PasscodePage";
import { FiCopy } from "react-icons/fi";
import { PiSpeakerHighDuotone } from "react-icons/pi";
import { awardXp } from "../utils/utils";
import { getLanguageXp, completeLesson } from "../utils/progressTracking";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { speechReasonTips } from "../utils/speechEvaluation";
import {
  TTS_LANG_TAG,
  fetchTTSBlob,
  resolveVoicePreference,
} from "../utils/tts";

/* ---------------------------
   Streaming helpers (Gemini)
--------------------------- */
function textFromChunk(chunk) {
  try {
    if (!chunk) return "";
    if (typeof chunk.text === "function") return chunk.text() || "";
    if (typeof chunk.text === "string") return chunk.text;
    const cand = chunk.candidates?.[0];
    if (cand?.content?.parts?.length) {
      return cand.content.parts.map((p) => p.text || "").join("");
    }
  } catch {}
  return "";
}

function tryConsumeLine(line, cb) {
  const s = line.indexOf("{");
  const e = line.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return;
  try {
    const obj = JSON.parse(line.slice(s, e + 1));
    cb?.(obj);
  } catch {}
}

function countBlanks(text = "") {
  return (text.match(/___/g) || []).length;
}

function stableHash(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

function shouldUseDragVariant(question, choices = [], answers = []) {
  if (!question || !choices.length) return false;
  const seed = stableHash(question + JSON.stringify(choices) + JSON.stringify(answers));
  return seed % 2 === 0;
}

/* ---------------------------
   Language name helper
--------------------------- */
function LANG_NAME(code) {
  const map = {
    en: "English",
    es: "Spanish",
    nah: "Nahuatl",
    pt: "Portuguese",
    fr: "French",
    it: "Italian",
  };
  return map[code] || code;
}

function resolveSupportLang(support, appUILang) {
  if (!support || support === "auto") return appUILang === "es" ? "es" : "en";
  return ["en", "es", "pt", "fr", "it", "nah"].includes(support) ? support : "en";
}

function quizDifficulty(level, xp) {
  if (xp < 100) return "beginner";
  if (xp < 300) return "intermediate";
  return "advanced";
}

/* ---------------------------
   Quiz Question Prompts
--------------------------- */
function buildQuizPrompt({
  questionType,
  level,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  xp,
  lessonContent = null,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const wantTR =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = quizDifficulty(level, xp);

  // Build comprehensive topic directive from all lesson content
  let topicDirective = "";
  if (lessonContent) {
    const allWords = [];
    const allTopics = [];

    if (Array.isArray(lessonContent)) {
      lessonContent.forEach(content => {
        if (content?.words) allWords.push(...content.words);
        if (content?.topic) allTopics.push(content.topic);
      });
    } else {
      if (lessonContent?.words) allWords.push(...lessonContent.words);
      if (lessonContent?.topic) allTopics.push(lessonContent.topic);
    }

    if (allWords.length > 0) {
      topicDirective = `- CONTEXT: Draw from this vocabulary pool: ${JSON.stringify([...new Set(allWords)])}. Use these words or related concepts from the same topics.`;
    } else if (allTopics.length > 0) {
      topicDirective = `- CONTEXT: Questions should relate to these topics: ${allTopics.join(", ")}.`;
    }
  }

  if (!topicDirective) {
    topicDirective = "- Create contextually appropriate questions for a unit quiz.";
  }

  switch (questionType) {
    case "fill":
      return [
        `Create ONE short ${TARGET} sentence with a single blank "___" for a unit quiz. Difficulty: ${diff}`,
        `- ≤ 120 chars; natural context that cues the target word.`,
        topicDirective,
        `- Hint in ${SUPPORT} (≤ 8 words), covering meaning/synonym/topic.`,
        wantTR
          ? `- ${SUPPORT} translation of the full sentence.`
          : `- Empty translation "".`,
        "",
        "Stream as NDJSON in phases:",
        `{"type":"quiz_fill","phase":"q","question":"<sentence with ___ in ${TARGET}>"}`,
        `{"type":"quiz_fill","phase":"meta","hint":"<${SUPPORT} hint>","translation":"<${SUPPORT} translation or empty>"}`,
        `{"type":"done"}`,
      ].join("\n");

    case "mc":
      return [
        `Create ONE ${TARGET} multiple-choice question for a unit quiz (exactly one correct). Difficulty: ${diff}`,
        `- Stem ≤120 chars with a blank "___" in a natural sentence.`,
        `- 4 distinct word choices in ${TARGET}.`,
        `- Hint in ${SUPPORT} (≤8 words).`,
        wantTR ? `- ${SUPPORT} translation of stem.` : `- Empty translation "".`,
        topicDirective,
        "",
        "Stream as NDJSON:",
        `{"type":"quiz_mc","phase":"q","question":"<stem in ${TARGET}>"}`,
        `{"type":"quiz_mc","phase":"choices","choices":["<choice1>","<choice2>","<choice3>","<choice4>"]}`,
        `{"type":"quiz_mc","phase":"meta","hint":"<${SUPPORT} hint>","answer":"<exact correct choice text>","translation":"<${SUPPORT} translation or empty>"}`,
        `{"type":"done"}`,
      ].join("\n");

    case "ma":
      return [
        `Create ONE ${TARGET} multiple-answer question for a unit quiz (EXACTLY 2 or 3 correct). Difficulty: ${diff}`,
        `- Stem ≤120 chars with at least one blank "___" within context.`,
        `- 5–6 distinct choices in ${TARGET}.`,
        `- Hint in ${SUPPORT} (≤8 words).`,
        wantTR ? `- ${SUPPORT} translation of stem.` : `- Empty translation "".`,
        topicDirective,
        "",
        "Stream as NDJSON:",
        `{"type":"quiz_ma","phase":"q","question":"<stem in ${TARGET}>"}`,
        `{"type":"quiz_ma","phase":"choices","choices":["..."]}`,
        `{"type":"quiz_ma","phase":"meta","hint":"<${SUPPORT} hint>","answers":["<correct>","<correct>"],"translation":"<${SUPPORT} translation or empty>"}`,
        `{"type":"done"}`,
      ].join("\n");

    case "speak":
      const allowTranslate = SUPPORT_CODE !== targetLang;
      return [
        `Create ONE ${TARGET} speaking drill for a unit quiz (difficulty: ${diff}). Choose VARIANT:`,
        `- repeat: show the ${TARGET} word/phrase (≤4 words) to repeat aloud.`,
        allowTranslate
          ? `- translate: show a ${SUPPORT} word/phrase (≤3 words) and have them speak the ${TARGET} translation aloud.`
          : `- translate: SKIP when support language equals ${TARGET}.`,
        `- complete: show a ${TARGET} sentence (≤120 chars) with ___ and have them speak the completed sentence aloud.`,
        topicDirective,
        `- Provide a concise instruction sentence in ${TARGET} (≤120 chars).`,
        `- Include a hint in ${SUPPORT} (≤10 words).`,
        wantTR
          ? `- Provide a ${SUPPORT} translation of the stimulus or completed sentence.`
          : `- Use empty translation "".`,
        "",
        "Stream as NDJSON:",
        `{"type":"quiz_speak","phase":"prompt","variant":"repeat|translate|complete","display":"<text shown to learner>","target":"<${TARGET} output to evaluate>","prompt":"<instruction in ${TARGET}>"}`,
        `{"type":"quiz_speak","phase":"meta","hint":"<${SUPPORT} hint>","translation":"<${SUPPORT} translation or empty>"}`,
        `{"type":"done"}`,
      ].join("\n");

    case "match":
      return [
        `Create ONE ${TARGET} vocabulary matching exercise for a unit quiz. Difficulty: ${diff}`,
        topicDirective,
        `- Left column: ${TARGET} words (3–6 items, unique).`,
        `- Right column: ${SUPPORT} short definitions (unique).`,
        `- Clear 1:1 mapping; ≤ 4 words per item.`,
        `- Hint in ${SUPPORT} (≤8 words).`,
        "",
        "Emit exactly TWO NDJSON lines:",
        `{"type":"quiz_match","stem":"<${TARGET} stem>","left":["<word>", "..."],"right":["<short ${SUPPORT} definition>", "..."],"hint":"<${SUPPORT} hint>"}`,
        `{"type":"done"}`,
      ].join("\n");

    default:
      return "";
  }
}

function buildQuizJudgePrompt({
  targetLang,
  level,
  sentence,
  userAnswer,
  hint,
}) {
  const TARGET = LANG_NAME(targetLang);
  const filled = sentence.replace(/_{2,}/, String(userAnswer || "").trim());
  return `
Judge a fill-in-the-blank in ${TARGET} for a unit quiz with leniency.

Sentence:
${sentence}

User word:
${userAnswer}

Filled sentence:
${filled}

Hint (optional):
${hint || ""}

Policy:
- Say YES if the user's word fits the meaning and collocates naturally in context (allow close synonyms).
- Ignore minor casing/inflection if meaning is equivalent.
- If it clearly doesn't fit the meaning or register, say NO.

Reply ONE WORD ONLY: YES or NO
`.trim();
}

function normalizeSpeakVariant(variant) {
  const v = (variant || "").toString().toLowerCase();
  return ["repeat", "translate", "complete"].includes(v) ? v : "repeat";
}

/* ---------------------------
   Main Component
--------------------------- */
export default function LessonGroupQuiz({
  userLanguage = "en",
  activeNpub = "",
  activeNsec = "",
  lessonContent = null,
  lessonId = null,
  xpReward = 50,
  onComplete = null,
}) {
  const user = useUserStore((s) => s.user);
  const npub = activeNpub || user?.id || "";
  const nsec = activeNsec || "";
  const toast = useToast();

  // Language settings
  const [targetLang, setTargetLang] = useState("es");
  const [supportLang, setSupportLang] = useState("auto");
  const [showTranslations, setShowTranslations] = useState(true);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Current question state
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [selectedChoices, setSelectedChoices] = useState([]);
  const [dragItems, setDragItems] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const abortRef = useRef(null);

  // Speech practice hook
  const {
    isListening,
    transcript,
    confidence,
    recognitionLang,
    startListening,
    stopListening,
    speechSupported,
    hasAudioSignal,
    getAudioLevel,
  } = useSpeechPractice(targetLang);

  const TOTAL_QUESTIONS = 10;
  const PASS_SCORE = 8;

  // Subscribe to user progress
  useEffect(() => {
    if (!npub) return;
    const ref = doc(database, "users", npub);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const prog = data.progress || {};
      const tLang = ["nah", "es", "pt", "en", "fr", "it"].includes(prog.targetLang)
        ? prog.targetLang
        : "es";
      const sLang = prog.supportLanguage || "auto";
      const showTr = prog.showTranslations !== false;
      const langXp = getLanguageXp(prog, tLang);
      const lvl = Math.floor(langXp / 100) + 1;

      setTargetLang(tLang);
      setSupportLang(sLang);
      setShowTranslations(showTr);
      setXp(langXp);
      setLevel(lvl);
    });
    return () => unsub();
  }, [npub]);

  // Generate all 10 questions at quiz start
  const generateQuestions = useCallback(async () => {
    if (!npub) return;

    setLoading(true);
    const questionTypes = ["fill", "mc", "ma", "speak", "match"];
    const generatedQuestions = [];

    try {
      // Generate 10 questions (mix of types)
      for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        const qType = questionTypes[i % questionTypes.length];
        const prompt = buildQuizPrompt({
          questionType: qType,
          level,
          targetLang,
          supportLang,
          showTranslations,
          appUILang: userLanguage,
          xp,
          lessonContent,
        });

        const stream = await simplemodel.generateContentStream(prompt);
        let questionData = { type: qType };
        let buffer = "";

        for await (const chunk of stream.stream) {
          const txt = textFromChunk(chunk);
          buffer += txt;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            tryConsumeLine(line, (obj) => {
              if (obj.type === "done") return;
              if (obj.type?.startsWith("quiz_")) {
                Object.assign(questionData, obj);
              }
            });
          }
        }

        if (buffer.trim()) {
          tryConsumeLine(buffer, (obj) => {
            if (obj.type?.startsWith("quiz_")) {
              Object.assign(questionData, obj);
            }
          });
        }

        generatedQuestions.push(questionData);
      }

      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setQuizStarted(true);
    } catch (err) {
      console.error("Quiz generation error:", err);
      toast({
        title: "Error generating quiz",
        description: err.message,
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [npub, level, targetLang, supportLang, showTranslations, userLanguage, xp, lessonContent, toast]);

  // Load current question
  useEffect(() => {
    if (!quizStarted || currentQuestionIndex >= questions.length) return;

    const q = questions[currentQuestionIndex];
    setQuestion(q);
    setUserInput("");
    setSelectedChoices([]);
    setDragItems({});
    setFeedback(null);

    // Setup drag items for match questions
    if (q.type === "match" && q.left && q.right) {
      const shuffledRight = [...q.right].sort(() => Math.random() - 0.5);
      const items = {};
      q.left.forEach((word, idx) => {
        items[`left-${idx}`] = { word, matched: null };
      });
      shuffledRight.forEach((def, idx) => {
        items[`right-${idx}`] = { definition: def };
      });
      setDragItems(items);
    }
  }, [quizStarted, currentQuestionIndex, questions]);

  // Check answer
  const checkAnswer = useCallback(async () => {
    if (!question) return;

    setIsChecking(true);
    let isCorrect = false;

    try {
      if (question.type === "fill") {
        const prompt = buildQuizJudgePrompt({
          targetLang,
          level,
          sentence: question.question || "",
          userAnswer: userInput,
          hint: question.hint || "",
        });

        const response = await callResponses({
          system: "You are a language quiz grader.",
          user: prompt,
          model: DEFAULT_RESPONSES_MODEL,
        });

        isCorrect = response?.toUpperCase().includes("YES");
      } else if (question.type === "mc") {
        isCorrect = userInput === question.answer;
      } else if (question.type === "ma") {
        const userSet = new Set(selectedChoices);
        const answerSet = new Set(question.answers || []);
        isCorrect = userSet.size === answerSet.size &&
          [...userSet].every(a => answerSet.has(a));
      } else if (question.type === "speak") {
        const expected = (question.target || "").toLowerCase().trim();
        const spoken = transcript.toLowerCase().trim();
        isCorrect = spoken.includes(expected) || expected.includes(spoken);
      } else if (question.type === "match") {
        const userMatches = Object.values(dragItems).filter(item => item.word).length;
        isCorrect = userMatches === question.left?.length;
      }

      setUserAnswers([...userAnswers, { question, userAnswer: userInput || selectedChoices, isCorrect }]);
      setScore(isCorrect ? score + 1 : score);
      setFeedback(isCorrect ? "correct" : "incorrect");

      setTimeout(() => {
        if (currentQuestionIndex + 1 >= TOTAL_QUESTIONS) {
          setQuizComplete(true);
          setShowResults(true);
        } else {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      }, 1500);
    } catch (err) {
      console.error("Error checking answer:", err);
      toast({
        title: "Error checking answer",
        status: "error",
        duration: 2000,
      });
    } finally {
      setIsChecking(false);
    }
  }, [question, userInput, selectedChoices, transcript, dragItems, targetLang, level, userAnswers, score, currentQuestionIndex, toast]);

  // Handle quiz completion
  const handleQuizComplete = useCallback(async () => {
    const passed = score >= PASS_SCORE;

    if (passed && lessonId && npub) {
      try {
        await completeLesson(npub, lessonId, xpReward, targetLang);
        await awardXp(npub, xpReward, "lesson");

        toast({
          title: "Quiz Passed! 🎉",
          description: `You scored ${score}/${TOTAL_QUESTIONS}. +${xpReward} XP!`,
          status: "success",
          duration: 4000,
        });

        if (onComplete) {
          onComplete({ passed: true, score });
        }
      } catch (err) {
        console.error("Error completing quiz:", err);
      }
    } else {
      toast({
        title: "Quiz Failed",
        description: `You scored ${score}/${TOTAL_QUESTIONS}. You need ${PASS_SCORE} to pass.`,
        status: "warning",
        duration: 4000,
      });

      if (onComplete) {
        onComplete({ passed: false, score });
      }
    }
  }, [score, lessonId, npub, xpReward, targetLang, toast, onComplete]);

  // Render question based on type
  const renderQuestion = () => {
    if (!question) return null;

    const commonProps = {
      fontSize: "lg",
      mb: 4,
      color: "white",
    };

    switch (question.type) {
      case "fill":
        return (
          <VStack spacing={4} align="stretch">
            <Text {...commonProps}>{question.question}</Text>
            {question.hint && (
              <Text fontSize="sm" color="gray.400">
                💡 {question.hint}
              </Text>
            )}
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your answer..."
              size="lg"
              bg="whiteAlpha.100"
              color="white"
              isDisabled={isChecking || feedback}
            />
          </VStack>
        );

      case "mc":
        return (
          <VStack spacing={4} align="stretch">
            <Text {...commonProps}>{question.question}</Text>
            {question.hint && (
              <Text fontSize="sm" color="gray.400">
                💡 {question.hint}
              </Text>
            )}
            <RadioGroup value={userInput} onChange={setUserInput} isDisabled={isChecking || feedback}>
              <Stack spacing={2}>
                {(question.choices || []).map((choice, idx) => (
                  <Radio key={idx} value={choice} colorScheme="teal">
                    {choice}
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>
          </VStack>
        );

      case "ma":
        return (
          <VStack spacing={4} align="stretch">
            <Text {...commonProps}>{question.question}</Text>
            {question.hint && (
              <Text fontSize="sm" color="gray.400">
                💡 {question.hint}
              </Text>
            )}
            <CheckboxGroup value={selectedChoices} onChange={setSelectedChoices} isDisabled={isChecking || feedback}>
              <Stack spacing={2}>
                {(question.choices || []).map((choice, idx) => (
                  <Checkbox key={idx} value={choice} colorScheme="teal">
                    {choice}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </VStack>
        );

      case "speak":
        return (
          <VStack spacing={4} align="stretch">
            <Text {...commonProps}>{question.prompt}</Text>
            <Text fontSize="xl" fontWeight="bold" color="cyan.300">
              {question.display}
            </Text>
            {question.hint && (
              <Text fontSize="sm" color="gray.400">
                💡 {question.hint}
              </Text>
            )}
            <Button
              colorScheme={isListening ? "red" : "teal"}
              onClick={isListening ? stopListening : startListening}
              isDisabled={isChecking || feedback}
              size="lg"
            >
              {isListening ? "Stop Recording" : "Start Speaking"}
            </Button>
            {transcript && (
              <Text color="white" fontSize="sm">
                You said: "{transcript}"
              </Text>
            )}
          </VStack>
        );

      case "match":
        return (
          <VStack spacing={4} align="stretch">
            <Text {...commonProps}>{question.stem || "Match the words with their definitions"}</Text>
            {question.hint && (
              <Text fontSize="sm" color="gray.400">
                💡 {question.hint}
              </Text>
            )}
            <HStack spacing={4} align="start">
              <VStack flex={1} spacing={2}>
                {(question.left || []).map((word, idx) => (
                  <Box
                    key={idx}
                    p={3}
                    bg="whiteAlpha.200"
                    borderRadius="md"
                    w="full"
                    textAlign="center"
                    color="white"
                  >
                    {word}
                  </Box>
                ))}
              </VStack>
              <VStack flex={1} spacing={2}>
                {(question.right || []).map((def, idx) => (
                  <Box
                    key={idx}
                    p={3}
                    bg="whiteAlpha.100"
                    borderRadius="md"
                    w="full"
                    textAlign="center"
                    color="white"
                    fontSize="sm"
                  >
                    {def}
                  </Box>
                ))}
              </VStack>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              (Matching drag-and-drop will be enhanced in final version)
            </Text>
          </VStack>
        );

      default:
        return <Text color="white">Unknown question type</Text>;
    }
  };

  if (!npub) {
    return <PasscodePage />;
  }

  if (showResults) {
    const passed = score >= PASS_SCORE;
    return (
      <Box
        minH="100vh"
        bg="linear-gradient(135deg, #0f0f23 0%, #1a1e2e 50%, #16213e 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={6} maxW="600px" w="full" p={6}>
          <Text fontSize="4xl" fontWeight="bold" color={passed ? "green.400" : "red.400"}>
            {passed ? "🎉 Quiz Passed!" : "😔 Quiz Failed"}
          </Text>
          <Text fontSize="2xl" color="white">
            Score: {score}/{TOTAL_QUESTIONS}
          </Text>
          <Progress
            value={(score / TOTAL_QUESTIONS) * 100}
            colorScheme={passed ? "green" : "red"}
            w="full"
            size="lg"
            borderRadius="full"
          />
          <Text color="white" textAlign="center">
            {passed
              ? `Congratulations! You passed with ${score} correct answers. You earned ${xpReward} XP!`
              : `You need ${PASS_SCORE} correct answers to pass. You got ${score}. Try again!`}
          </Text>
          <HStack spacing={4}>
            {!passed && (
              <Button
                colorScheme="teal"
                onClick={() => {
                  setQuizComplete(false);
                  setShowResults(false);
                  setQuizStarted(false);
                  setQuestions([]);
                  setCurrentQuestionIndex(0);
                  setUserAnswers([]);
                  setScore(0);
                }}
              >
                Retry Quiz
              </Button>
            )}
            <Button onClick={() => onComplete?.({ passed, score })}>
              Continue
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  }

  if (!quizStarted) {
    return (
      <Box
        minH="100vh"
        bg="linear-gradient(135deg, #0f0f23 0%, #1a1e2e 50%, #16213e 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={6} maxW="500px" w="full" p={6}>
          <Text fontSize="3xl" fontWeight="bold" color="white" textAlign="center">
            📝 Unit Quiz
          </Text>
          <Text color="white" textAlign="center">
            Test your knowledge from this unit! You'll answer {TOTAL_QUESTIONS} questions and need {PASS_SCORE} correct to pass.
          </Text>
          <VStack spacing={2} color="gray.400" fontSize="sm">
            <Text>✓ No skipping questions</Text>
            <Text>✓ Mix of question types</Text>
            <Text>✓ Based on unit content</Text>
          </VStack>
          <Button
            colorScheme="teal"
            size="lg"
            onClick={generateQuestions}
            isLoading={loading}
            loadingText="Generating quiz..."
          >
            Start Quiz
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(135deg, #0f0f23 0%, #1a1e2e 50%, #16213e 100%)"
      py={8}
    >
      <VStack spacing={6} maxW="800px" mx="auto" px={4}>
        {/* Progress Header */}
        <Box w="full">
          <HStack justify="space-between" mb={2}>
            <Badge colorScheme="teal">
              Question {currentQuestionIndex + 1}/{TOTAL_QUESTIONS}
            </Badge>
            <Badge colorScheme="purple">
              Score: {score}/{TOTAL_QUESTIONS}
            </Badge>
          </HStack>
          <Progress
            value={((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}
            colorScheme="teal"
            borderRadius="full"
            size="sm"
          />
        </Box>

        {/* Question Card */}
        <Box
          w="full"
          bg="whiteAlpha.100"
          borderRadius="xl"
          p={8}
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          {renderQuestion()}

          {/* Feedback */}
          {feedback && (
            <Box
              mt={4}
              p={4}
              bg={feedback === "correct" ? "green.500" : "red.500"}
              borderRadius="md"
              color="white"
              textAlign="center"
            >
              {feedback === "correct" ? "✓ Correct!" : "✗ Incorrect"}
            </Box>
          )}

          {/* Submit Button */}
          {!feedback && (
            <Button
              colorScheme="teal"
              size="lg"
              w="full"
              mt={6}
              onClick={checkAnswer}
              isLoading={isChecking}
              isDisabled={
                (question?.type === "fill" && !userInput) ||
                (question?.type === "mc" && !userInput) ||
                (question?.type === "ma" && selectedChoices.length === 0) ||
                (question?.type === "speak" && !transcript)
              }
            >
              Submit Answer
            </Button>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
