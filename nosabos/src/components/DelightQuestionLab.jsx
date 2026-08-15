import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { FiArrowRight, FiRefreshCw, FiVolume2 } from "react-icons/fi";
import useUserStore from "../hooks/useUserStore";
import useSoundSettings from "../hooks/useSoundSettings";
import translations from "../utils/translation";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { awardXp } from "../utils/utils";
import { extractCEFRLevel } from "../utils/cefrUtils";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  getLanguageDirection,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";
import {
  TTS_LANG_TAG,
  getPreferredTTSVoice,
  getTTSPlayer,
  stopAllTTSPlayback,
} from "../utils/tts";
import {
  clickSound,
  deliciousSound,
  submitActionSound,
} from "../constants/sounds";
import {
  getQuestionChoiceCardProps,
  getQuestionChipProps,
  getQuestionFeedbackPanelProps,
  getQuestionToolButtonProps,
  questionSquircleStyle,
  questionToneText,
} from "./questionUiStyles";
import {
  DELIGHT_VARIANTS,
  buildDelightQuestionPrompt,
  buildThreeWordJudgePrompt,
  generateSentenceDetectiveQuestion,
  getDelightFallbackQuestion,
  getInitialDelightResponse,
  gradeDelightResponse,
  isDelightResponseReady,
  normalizeDelightQuestion,
} from "../utils/delightQuestionVariants";
import { DELIGHT_VARIANT_TEST_IDS } from "../config/delightVariantGate";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const GATED_VARIANTS = DELIGHT_VARIANTS.filter(({ id }) =>
  DELIGHT_VARIANT_TEST_IDS.includes(id),
);
const QUESTION_GENERATION_TIMEOUT_MS = 25000;

async function settleWithin(promise, timeoutMs) {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error("Question generation timed out.")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function useT(uiLang = "en") {
  return useCallback((key) => {
    const dict = translations?.[uiLang] || translations?.en || {};
    const english = translations?.en || {};
    return String(dict[key] ?? english[key] ?? key);
  }, [uiLang]);
}

function strongNpub(user) {
  return (
    user?.id ||
    user?.local_npub ||
    (typeof window !== "undefined"
      ? window.localStorage?.getItem("local_npub")
      : "") ||
    ""
  ).trim();
}

function shuffle(items = []) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function ChoiceCard({ selected, children, onClick, disabled = false }) {
  return (
    <Box
      as="button"
      type="button"
      width="100%"
      textAlign="left"
      p={4}
      borderRadius="xl"
      cursor={disabled ? "default" : "pointer"}
      opacity={disabled && !selected ? 0.72 : 1}
      {...getQuestionChoiceCardProps({
        selected,
        interactive: !disabled,
      })}
      onClick={disabled ? undefined : onClick}
    >
      <HStack spacing={3} align="flex-start">
        <Flex
          w="24px"
          h="24px"
          borderRadius="full"
          align="center"
          justify="center"
          flexShrink={0}
          borderWidth="2px"
          borderColor={
            selected ? "var(--question-choice-single-accent)" : APP_BORDER_STRONG
          }
          bg={selected ? "var(--question-choice-single-accent)" : "transparent"}
          color="white"
          fontSize="xs"
          fontWeight="800"
        >
          {selected ? "✓" : ""}
        </Flex>
        <Text color={APP_TEXT_PRIMARY} lineHeight="1.5">
          {children}
        </Text>
      </HStack>
    </Box>
  );
}

function Chip({ children, selected = false, onClick, disabled = false }) {
  return (
    <Button
      size="md"
      px={4}
      minH="44px"
      whiteSpace="normal"
      isDisabled={disabled}
      onClick={onClick}
      {...getQuestionChipProps()}
      borderColor={selected ? "var(--question-chip-accent)" : undefined}
      bg={selected ? "var(--question-chip-bg-hover)" : undefined}
    >
      {children}
    </Button>
  );
}

function QuestionShell({ meta, question, children }) {
  return (
    <VStack spacing={5} align="stretch">
      <Box>
        <HStack spacing={2} mb={1}>
          <Text fontSize="2xl" aria-hidden="true">
            {meta.icon}
          </Text>
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {meta.label}
          </Text>
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY}>
          {question.instruction || meta.description}
        </Text>
      </Box>
      {children}
    </VStack>
  );
}

function SentenceDetective({
  question,
  response,
  setResponse,
  locked,
  targetLang,
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  return (
    <QuestionShell
      meta={DELIGHT_VARIANTS[0]}
      question={question}
    >
      <Wrap
        spacing={2}
        justify="center"
        py={3}
        dir={targetDirection}
        lang={targetLang}
      >
        {question.tokens.map((token, index) => (
          <WrapItem key={`${token}-${index}`}>
            <Chip
              selected={response.tokenIndex === index}
              disabled={locked}
              onClick={() => setResponse({ tokenIndex: index, replacement: "" })}
            >
              {token}
            </Chip>
          </WrapItem>
        ))}
      </Wrap>
      {response.tokenIndex !== null && (
        <Box
          p={4}
          borderWidth="1px"
          borderColor={APP_BORDER}
          bg={APP_SURFACE_MUTED}
          borderRadius="xl"
          style={questionSquircleStyle}
        >
          <Text fontSize="sm" color={APP_TEXT_SECONDARY} mb={3}>
            Repair “{question.tokens[response.tokenIndex]}” with:
          </Text>
          <Wrap spacing={2} dir={targetDirection} lang={targetLang}>
            {question.replacements.map((replacement) => (
              <WrapItem key={replacement}>
                <Chip
                  selected={response.replacement === replacement}
                  disabled={locked}
                  onClick={() =>
                    setResponse((current) => ({
                      ...current,
                      replacement,
                    }))
                  }
                >
                  {replacement}
                </Chip>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}
    </QuestionShell>
  );
}

function DialogueFork({ question, response, setResponse, locked }) {
  return (
    <QuestionShell meta={DELIGHT_VARIANTS[1]} question={question}>
      <Box
        alignSelf="flex-start"
        maxW="88%"
        p={4}
        bg="var(--question-assistant-bg)"
        borderWidth="1px"
        borderColor="var(--question-assistant-border)"
        borderRadius="2xl 2xl 2xl 6px"
        style={questionSquircleStyle}
      >
        <Text
          fontSize="xs"
          fontWeight="800"
          color="var(--question-assistant-accent-strong)"
          mb={1}
        >
          {question.speaker}
        </Text>
        <Text color={APP_TEXT_PRIMARY} fontSize="lg">
          {question.line}
        </Text>
      </Box>
      <VStack spacing={3} align="stretch">
        {question.options.map((option, index) => (
          <ChoiceCard
            key={option}
            selected={response.selectedIndex === index}
            disabled={locked}
            onClick={() => setResponse({ selectedIndex: index })}
          >
            {option}
          </ChoiceCard>
        ))}
      </VStack>
    </QuestionShell>
  );
}

function SentenceShapeshifter({ question, response, setResponse, locked }) {
  return (
    <QuestionShell meta={DELIGHT_VARIANTS[2]} question={question}>
      <VStack spacing={3} align="stretch">
        <Box
          p={4}
          bg={APP_SURFACE_MUTED}
          borderWidth="1px"
          borderColor={APP_BORDER}
          borderRadius="xl"
          style={questionSquircleStyle}
        >
          <Text fontSize="lg" color={APP_TEXT_PRIMARY} textAlign="center">
            {question.source}
          </Text>
        </Box>
        <HStack justify="center" spacing={2} color="purple.300">
          <Text fontSize="xl">↓</Text>
          <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
            {question.constraint}
          </Badge>
        </HStack>
        <Input
          value={response.text}
          onChange={(event) => setResponse({ text: event.target.value })}
          isDisabled={locked}
          placeholder="Write the transformed sentence…"
          size="lg"
          bg={APP_SURFACE_ELEVATED}
          borderColor={APP_BORDER_STRONG}
          style={questionSquircleStyle}
        />
      </VStack>
    </QuestionShell>
  );
}

function WordNeighborhoods({
  question,
  response,
  setResponse,
  locked,
  wordOrder,
}) {
  const [selectedWord, setSelectedWord] = useState("");
  const assignments = response.assignments || {};
  const unassigned = wordOrder.filter((word) => assignments[word] === undefined);

  const assign = (groupIndex) => {
    if (!selectedWord || locked) return;
    setResponse((current) => ({
      assignments: {
        ...(current.assignments || {}),
        [selectedWord]: groupIndex,
      },
    }));
    setSelectedWord("");
  };

  const returnToBank = (word) => {
    if (locked) return;
    setResponse((current) => {
      const assignmentsNext = { ...(current.assignments || {}) };
      delete assignmentsNext[word];
      return { assignments: assignmentsNext };
    });
  };

  return (
    <QuestionShell meta={DELIGHT_VARIANTS[3]} question={question}>
      <Box
        minH="82px"
        p={4}
        borderWidth="1px"
        borderStyle="dashed"
        borderColor={APP_BORDER_STRONG}
        bg={APP_SURFACE_MUTED}
        borderRadius="xl"
        style={questionSquircleStyle}
      >
        <Text fontSize="xs" color={APP_TEXT_SECONDARY} mb={3}>
          Word bank · tap a word, then its neighborhood
        </Text>
        <Wrap spacing={2}>
          {unassigned.map((word) => (
            <WrapItem key={word}>
              <Chip
                selected={selectedWord === word}
                disabled={locked}
                onClick={() => setSelectedWord(word)}
              >
                {word}
              </Chip>
            </WrapItem>
          ))}
          {!unassigned.length && (
            <Text fontSize="sm" color={APP_TEXT_SECONDARY}>
              Every word has a home.
            </Text>
          )}
        </Wrap>
      </Box>
      <SimpleGrid columns={{ base: 1, sm: question.groups.length }} spacing={3}>
        {question.groups.map((group, groupIndex) => {
          const members = wordOrder.filter(
            (word) => Number(assignments[word]) === groupIndex,
          );
          return (
            <Box
              key={group.label}
              as="button"
              type="button"
              textAlign="left"
              minH="150px"
              p={4}
              borderWidth="2px"
              borderColor={selectedWord ? "purple.300" : APP_BORDER}
              bg={APP_SURFACE_ELEVATED}
              borderRadius="xl"
              style={questionSquircleStyle}
              transition="all 0.2s ease"
              _hover={selectedWord && !locked ? { transform: "translateY(-2px)" } : {}}
              onClick={() => assign(groupIndex)}
            >
              <Text fontWeight="800" color={APP_TEXT_PRIMARY} mb={3}>
                {group.label}
              </Text>
              <Wrap spacing={2}>
                {members.map((word) => (
                  <WrapItem key={word}>
                    <Box
                      as="span"
                      px={3}
                      py={2}
                      borderRadius="lg"
                      {...getQuestionChipProps()}
                      onClick={(event) => {
                        event.stopPropagation();
                        returnToBank(word);
                      }}
                    >
                      {word}
                    </Box>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          );
        })}
      </SimpleGrid>
    </QuestionShell>
  );
}

function MorphologyForge({ question, response, setResponse, locked }) {
  const chosen = response.pieceIndices || [];
  const available = question.pieces
    .map((piece, index) => ({ piece, index }))
    .filter(({ index }) => !chosen.includes(index));
  return (
    <QuestionShell meta={DELIGHT_VARIANTS[4]} question={question}>
      <Text fontSize="lg" color={APP_TEXT_PRIMARY} textAlign="center">
        {question.sentence}
      </Text>
      <Flex
        minH="76px"
        p={4}
        align="center"
        justify="center"
        borderWidth="2px"
        borderStyle="dashed"
        borderColor="orange.300"
        bg="rgba(237, 137, 54, 0.08)"
        borderRadius="xl"
        style={questionSquircleStyle}
      >
        {chosen.length ? (
          <HStack spacing={0} flexWrap="wrap" justify="center">
            {chosen.map((pieceIndex, position) => (
              <Button
                key={`${pieceIndex}-${position}`}
                size="lg"
                px={2}
                variant="ghost"
                color={APP_TEXT_PRIMARY}
                isDisabled={locked}
                onClick={() =>
                  setResponse({
                    pieceIndices: chosen.filter((_, index) => index !== position),
                  })
                }
              >
                {question.pieces[pieceIndex]}
              </Button>
            ))}
          </HStack>
        ) : (
          <Text color={APP_TEXT_SECONDARY}>Tap pieces to forge the word</Text>
        )}
      </Flex>
      <Wrap spacing={2} justify="center">
        {available.map(({ piece, index }) => (
          <WrapItem key={`${piece}-${index}`}>
            <Chip
              disabled={locked}
              onClick={() =>
                setResponse({ pieceIndices: [...chosen, index] })
              }
            >
              {piece}
            </Chip>
          </WrapItem>
        ))}
      </Wrap>
    </QuestionShell>
  );
}

function ThreeClueMystery({
  question,
  response,
  setResponse,
  locked,
  revealedClues,
  setRevealedClues,
}) {
  const reward = Math.max(4, 10 - (revealedClues - 1) * 3);
  return (
    <QuestionShell meta={DELIGHT_VARIANTS[5]} question={question}>
      <VStack spacing={3} align="stretch">
        {question.clues.slice(0, revealedClues).map((clue, index) => (
          <HStack
            key={clue}
            p={4}
            borderWidth="1px"
            borderColor={APP_BORDER}
            bg={index === revealedClues - 1 ? APP_SURFACE_ELEVATED : APP_SURFACE_MUTED}
            borderRadius="xl"
            style={questionSquircleStyle}
          >
            <Badge colorScheme="purple" borderRadius="full">
              {index + 1}
            </Badge>
            <Text color={APP_TEXT_PRIMARY}>{clue}</Text>
          </HStack>
        ))}
      </VStack>
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Badge colorScheme="yellow" px={3} py={1} borderRadius="full">
          Solve now · +{reward} XP
        </Badge>
        {revealedClues < question.clues.length && !locked && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRevealedClues((count) => count + 1)}
          >
            Reveal another clue
          </Button>
        )}
      </HStack>
      <Input
        value={response.text}
        onChange={(event) => setResponse({ text: event.target.value })}
        isDisabled={locked}
        placeholder="What am I?"
        size="lg"
        bg={APP_SURFACE_ELEVATED}
        borderColor={APP_BORDER_STRONG}
        style={questionSquircleStyle}
      />
    </QuestionShell>
  );
}

function ListenDifference({
  question,
  response,
  setResponse,
  locked,
  onPlay,
  isSpeaking,
}) {
  return (
    <QuestionShell meta={DELIGHT_VARIANTS[6]} question={question}>
      <Button
        leftIcon={isSpeaking ? <Spinner size="sm" /> : <FiVolume2 />}
        size="lg"
        py={7}
        onClick={onPlay}
        isDisabled={isSpeaking}
        {...getQuestionToolButtonProps({ active: isSpeaking })}
      >
        {isSpeaking ? "Preparing audio…" : "Play sentence"}
      </Button>
      <VStack spacing={3} align="stretch">
        {question.options.map((option, index) => (
          <ChoiceCard
            key={option}
            selected={response.selectedIndex === index}
            disabled={locked}
            onClick={() => setResponse({ selectedIndex: index })}
          >
            {option}
          </ChoiceCard>
        ))}
      </VStack>
    </QuestionShell>
  );
}

function ThreeWordChallenge({ question, response, setResponse, locked }) {
  return (
    <QuestionShell meta={DELIGHT_VARIANTS[7]} question={question}>
      <Wrap spacing={3} justify="center" py={2}>
        {question.cues.map((cue, index) => (
          <WrapItem key={cue}>
            <Box
              px={4}
              py={3}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="purple.300"
              bg="rgba(128, 90, 213, 0.12)"
              color={APP_TEXT_PRIMARY}
              style={questionSquircleStyle}
            >
              <Text as="span" fontSize="xs" color="purple.300" mr={2}>
                {index + 1}
              </Text>
              <Text as="span" fontWeight="800">
                {cue}
              </Text>
            </Box>
          </WrapItem>
        ))}
      </Wrap>
      <Input
        value={response.text}
        onChange={(event) => setResponse({ text: event.target.value })}
        isDisabled={locked}
        placeholder="Make the three ideas meet…"
        size="lg"
        bg={APP_SURFACE_ELEVATED}
        borderColor={APP_BORDER_STRONG}
        style={questionSquircleStyle}
      />
      <Text fontSize="xs" color={APP_TEXT_SECONDARY} textAlign="center">
        Original answers are judged for meaning, not exact wording.
      </Text>
    </QuestionShell>
  );
}

function NaturalOrWeird({ question, response, setResponse, locked }) {
  return (
    <QuestionShell meta={DELIGHT_VARIANTS[8]} question={question}>
      <Box
        p={6}
        bg={APP_SURFACE_MUTED}
        borderWidth="1px"
        borderColor={APP_BORDER}
        borderRadius="xl"
        style={questionSquircleStyle}
      >
        <Text fontSize="xl" color={APP_TEXT_PRIMARY} textAlign="center">
          “{question.sentence}”
        </Text>
      </Box>
      <SimpleGrid columns={2} spacing={3}>
        <Button
          minH="76px"
          fontSize="lg"
          colorScheme={response.choice === false ? "pink" : undefined}
          variant={response.choice === false ? "solid" : "outline"}
          isDisabled={locked}
          onClick={() => setResponse({ choice: false })}
          style={questionSquircleStyle}
        >
          🌀 Sounds weird
        </Button>
        <Button
          minH="76px"
          fontSize="lg"
          colorScheme={response.choice === true ? "green" : undefined}
          variant={response.choice === true ? "solid" : "outline"}
          isDisabled={locked}
          onClick={() => setResponse({ choice: true })}
          style={questionSquircleStyle}
        >
          ✨ Sounds natural
        </Button>
      </SimpleGrid>
    </QuestionShell>
  );
}

function getAnswerReveal(question) {
  switch (question.variant) {
    case "sentence_detective":
      return question.correctedSentence;
    case "dialogue_fork":
      return question.options[question.answerIndex];
    case "sentence_shapeshifter":
      return question.answer;
    case "word_neighborhoods":
      return question.groups
        .map((group) => `${group.label}: ${group.items.join(", ")}`)
        .join(" · ");
    case "morphology_forge":
      return question.answerWord;
    case "three_clue_mystery":
      return question.answer;
    case "listen_difference":
      return question.options[question.answerIndex];
    case "three_word_challenge":
      return question.sampleAnswers[0];
    case "natural_or_weird":
      return question.isNatural ? question.sentence : question.correction;
    default:
      return "";
  }
}

function ResultPanel({
  ok,
  xp,
  question,
  onRetry,
  onNext,
  isLastQuizQuestion,
  allowRetry,
}) {
  const answer = getAnswerReveal(question);
  const delight =
    question.variant === "dialogue_fork" && ok
      ? question.reaction
      : question.variant === "three_word_challenge" && ok
        ? question.reaction
        : question.variant === "three_clue_mystery" && ok
          ? question.example
          : question.variant === "listen_difference"
            ? question.contrast
            : "";

  return (
    <VStack
      spacing={3}
      align="stretch"
      p={4}
      borderRadius="xl"
      {...getQuestionFeedbackPanelProps({ ok })}
    >
      <HStack align="flex-start" spacing={3}>
        <Flex
          w="42px"
          h="42px"
          borderRadius="full"
          align="center"
          justify="center"
          flexShrink={0}
          bg={ok ? "var(--question-success-accent)" : "var(--question-error-accent)"}
          color="white"
          fontWeight="900"
        >
          {ok ? "✓" : "✕"}
        </Flex>
        <Box flex="1">
          <Text fontWeight="800" color={questionToneText.primary}>
            {ok ? "That works!" : "Not quite—here’s the pattern."}
          </Text>
          <Text fontSize="sm" color={questionToneText.secondary}>
            {ok && xp > 0 ? `+${xp} XP` : question.explanation}
          </Text>
        </Box>
      </HStack>
      {(answer || delight) && (
        <Box
          p={3}
          bg="rgba(255,255,255,0.08)"
          borderRadius="lg"
          style={questionSquircleStyle}
        >
          {!ok && answer && (
            <Text fontWeight="700" color={questionToneText.primary}>
              {answer}
            </Text>
          )}
          {delight && (
            <Text color={questionToneText.primary}>{delight}</Text>
          )}
          {ok && question.explanation && (
            <Text fontSize="sm" color={questionToneText.secondary} mt={1}>
              {question.explanation}
            </Text>
          )}
        </Box>
      )}
      <HStack justify="flex-end" flexWrap="wrap">
        {!ok && allowRetry && (
          <Button variant="ghost" onClick={onRetry}>
            Try again
          </Button>
        )}
        <Button
          rightIcon={<FiArrowRight />}
          colorScheme="cyan"
          onClick={onNext}
        >
          {isLastQuizQuestion ? "See results" : "Next question"}
        </Button>
      </HStack>
    </VStack>
  );
}

export default function DelightQuestionLab({
  moduleType = "grammar",
  userLanguage = "en",
  lesson = null,
  lessonContent = null,
  isFinalQuiz = false,
  quizConfig = { questionsRequired: 10, passingScore: 8 },
  onSkip = null,
  onExitQuiz = null,
}) {
  const t = useT(userLanguage);
  const user = useUserStore((state) => state.user);
  const playSound = useSoundSettings((state) => state.playSound);
  const progress = user?.progress || {};
  const targetLang = normalizePracticeLanguage(
    progress.targetLang,
    DEFAULT_TARGET_LANGUAGE,
  );
  const supportLang =
    progress.supportLang === "bilingual"
      ? normalizeSupportLanguage(userLanguage, DEFAULT_SUPPORT_LANGUAGE)
      : normalizeSupportLanguage(
          progress.supportLang,
          DEFAULT_SUPPORT_LANGUAGE,
        );
  const cefrLevel =
    lesson?.cefrLevel ||
    lessonContent?.cefrLevel ||
    (lesson?.id ? extractCEFRLevel(lesson.id) : "A1");
  const npub = strongNpub(user);

  const [variantIndex, setVariantIndex] = useState(0);
  const [question, setQuestion] = useState(null);
  const [response, setResponseState] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationNonce, setGenerationNonce] = useState(0);
  const [result, setResult] = useState(null);
  const [recentXp, setRecentXp] = useState(0);
  const [revealedClues, setRevealedClues] = useState(1);
  const [wordOrder, setWordOrder] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const cacheRef = useRef(new Map());
  const requestRef = useRef(0);
  const audioPlayerRef = useRef(null);

  const variantMeta = GATED_VARIANTS[variantIndex] || GATED_VARIANTS[0];

  const resetForQuestion = useCallback((nextQuestion) => {
    setQuestion(nextQuestion);
    setResponseState(getInitialDelightResponse(nextQuestion));
    setResult(null);
    setRecentXp(0);
    setRevealedClues(1);
    setWordOrder(
      nextQuestion?.variant === "word_neighborhoods"
        ? shuffle(nextQuestion.groups.flatMap((group) => group.items))
        : [],
    );
  }, []);

  useEffect(() => {
    const requestId = ++requestRef.current;
    const cacheKey = [
      moduleType,
      lesson?.id || "free",
      targetLang,
      supportLang,
      cefrLevel,
      variantMeta.id,
    ].join(":");
    const cached = cacheRef.current.get(cacheKey);
    if (cached && generationNonce === 0) {
      resetForQuestion(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setGenerationError("");
    setQuestion(null);
    const generate = (input) =>
      callResponses({ model: DEFAULT_RESPONSES_MODEL, input });
    const generationTask =
      variantMeta.id === "sentence_detective"
        ? generateSentenceDetectiveQuestion({
            generate,
            moduleType,
            targetLang,
            supportLang,
            cefrLevel,
            lessonContent,
          })
        : generate(
            buildDelightQuestionPrompt({
              variant: variantMeta.id,
              moduleType,
              targetLang,
              supportLang,
              cefrLevel,
              lessonContent,
            }),
          );
    const generation = settleWithin(
      generationTask,
      QUESTION_GENERATION_TIMEOUT_MS,
    );

    generation
      .then((raw) => {
        if (requestId !== requestRef.current) return;
        const normalized =
          variantMeta.id === "sentence_detective"
            ? raw
            : normalizeDelightQuestion(variantMeta.id, raw);
        const nextQuestion =
          normalized || getDelightFallbackQuestion(variantMeta.id, moduleType);
        if (!normalized) {
          setGenerationError("Showing a local sample because generation was unavailable.");
        }
        cacheRef.current.set(cacheKey, nextQuestion);
        resetForQuestion(nextQuestion);
      })
      .catch(() => {
        if (requestId !== requestRef.current) return;
        if (variantMeta.id === "sentence_detective") {
          setGenerationError(
            "We couldn't build a clear Sentence Detective question this time.",
          );
          setQuestion(null);
          return;
        }
        const fallback = getDelightFallbackQuestion(variantMeta.id, moduleType);
        setGenerationError("Showing a local sample because generation was unavailable.");
        resetForQuestion(fallback);
      })
      .finally(() => {
        if (requestId === requestRef.current) setLoading(false);
      });
  }, [
    cefrLevel,
    generationNonce,
    lesson?.id,
    lessonContent,
    moduleType,
    resetForQuestion,
    supportLang,
    targetLang,
    variantMeta.id,
  ]);

  useEffect(
    () => () => {
      requestRef.current += 1;
      stopAllTTSPlayback();
      audioPlayerRef.current?.cleanup?.();
    },
    [],
  );

  const setResponse = useCallback(
    (next) => {
      if (result !== null) return;
      setResponseState((current) =>
        typeof next === "function" ? next(current) : next,
      );
    },
    [result],
  );

  const moveToVariant = useCallback(
    (index) => {
      stopAllTTSPlayback();
      audioPlayerRef.current?.cleanup?.();
      setIsSpeaking(false);
      setGenerationNonce(0);
      setVariantIndex(
        (index + GATED_VARIANTS.length) % GATED_VARIANTS.length,
      );
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    const cacheKey = [
      moduleType,
      lesson?.id || "free",
      targetLang,
      supportLang,
      cefrLevel,
      variantMeta.id,
    ].join(":");
    cacheRef.current.delete(cacheKey);
    setGenerationNonce((value) => value + 1);
  }, [
    cefrLevel,
    lesson?.id,
    moduleType,
    supportLang,
    targetLang,
    variantMeta.id,
  ]);

  const handlePlay = useCallback(async () => {
    if (!question?.audioText || isSpeaking) return;
    stopAllTTSPlayback();
    audioPlayerRef.current?.cleanup?.();
    setIsSpeaking(true);
    try {
      const player = await getTTSPlayer({
        text: question.audioText,
        langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
        voice: getPreferredTTSVoice(),
      });
      audioPlayerRef.current = player;
      await player.ready;
      await player.audio.play();
      player.audio.onended = () => {
        setIsSpeaking(false);
        player.cleanup?.();
      };
    } catch {
      setIsSpeaking(false);
    }
  }, [isSpeaking, question?.audioText, targetLang]);

  const handleSubmit = useCallback(async () => {
    if (!question || !isDelightResponseReady(question, response) || submitting)
      return;
    playSound(submitActionSound);
    setSubmitting(true);
    let ok = gradeDelightResponse(question, response);
    if (ok === null) {
      const verdict = await callResponses({
        model: DEFAULT_RESPONSES_MODEL,
        input: buildThreeWordJudgePrompt({
          question,
          response,
          targetLang,
          supportLang,
        }),
      });
      ok = String(verdict || "")
        .trim()
        .toUpperCase()
        .startsWith("Y");
    }

    const xp = ok
      ? question.variant === "three_clue_mystery"
        ? Math.max(4, 10 - (revealedClues - 1) * 3)
        : 6
      : 0;
    setResult(Boolean(ok));
    setRecentXp(isFinalQuiz ? 0 : xp);
    playSound(ok ? deliciousSound : clickSound);

    if (isFinalQuiz) {
      setQuizHistory((history) => [...history, Boolean(ok)]);
    } else if (xp > 0) {
      await awardXp(npub, xp, targetLang, {
        skillTreeLessonId: lesson?.id,
      }).catch(() => {});
    }
    setSubmitting(false);
  }, [
    isFinalQuiz,
    lesson?.id,
    npub,
    playSound,
    question,
    response,
    revealedClues,
    submitting,
    supportLang,
    targetLang,
  ]);

  const handleRetry = useCallback(() => {
    if (!question) return;
    resetForQuestion(question);
  }, [question, resetForQuestion]);

  const handleNext = useCallback(() => {
    if (isFinalQuiz && quizHistory.length >= quizConfig.questionsRequired) {
      setQuizFinished(true);
      return;
    }
    if (GATED_VARIANTS.length === 1) {
      handleRefresh();
      return;
    }
    moveToVariant(variantIndex + 1);
  }, [
    handleRefresh,
    isFinalQuiz,
    moveToVariant,
    quizConfig.questionsRequired,
    quizHistory.length,
    variantIndex,
  ]);

  const ready = question && isDelightResponseReady(question, response);
  const quizCorrect = quizHistory.filter(Boolean).length;

  if (quizFinished) {
    const passed = quizCorrect >= quizConfig.passingScore;
    return (
      <Box p={4} color={APP_TEXT_PRIMARY}>
        <VStack
          maxW="620px"
          mx="auto"
          spacing={5}
          p={6}
          bg={APP_SURFACE_ELEVATED}
          borderWidth="1px"
          borderColor={APP_BORDER}
          borderRadius="2xl"
          style={questionSquircleStyle}
        >
          <Text fontSize="4xl">{passed ? "🎉" : "🌱"}</Text>
          <Text fontSize="2xl" fontWeight="900">
            {passed ? "Variant quiz complete!" : "Keep exploring the patterns"}
          </Text>
          <Text color={APP_TEXT_SECONDARY}>
            {quizCorrect}/{quizHistory.length} correct
          </Text>
          <Button
            colorScheme="cyan"
            onClick={onExitQuiz || onSkip || (() => setQuizFinished(false))}
          >
            Continue
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={4} color={APP_TEXT_PRIMARY}>
      <VStack spacing={4} align="stretch" maxW="720px" mx="auto">
        <Box
          p={3}
          bg="rgba(128, 90, 213, 0.10)"
          borderWidth="1px"
          borderColor="rgba(128, 90, 213, 0.35)"
          borderRadius="xl"
          style={questionSquircleStyle}
        >
          <Flex gap={3} align="center" flexWrap="wrap">
            <Badge colorScheme="purple" flexShrink={0}>
              Testing gate
            </Badge>
            {GATED_VARIANTS.length > 1 ? (
              <>
                <Select
                  aria-label="Choose delight variant"
                  size="sm"
                  flex="1"
                  minW="210px"
                  value={variantMeta.id}
                  onChange={(event) =>
                    moveToVariant(
                      GATED_VARIANTS.findIndex(
                        ({ id }) => id === event.target.value,
                      ),
                    )
                  }
                  bg={APP_SURFACE}
                  borderColor={APP_BORDER}
                  style={questionSquircleStyle}
                >
                  {GATED_VARIANTS.map((variant, index) => (
                    <option key={variant.id} value={variant.id}>
                      {index + 1}. {variant.label}
                    </option>
                  ))}
                </Select>
                <Badge variant="outline" colorScheme="purple">
                  {variantIndex + 1}/{GATED_VARIANTS.length}
                </Badge>
              </>
            ) : (
              <Text flex="1" fontSize="sm" fontWeight="800">
                {variantMeta.label}
              </Text>
            )}
            <IconButton
              aria-label="Generate another example"
              icon={<FiRefreshCw />}
              size="sm"
              onClick={handleRefresh}
              isDisabled={loading}
              {...getQuestionToolButtonProps()}
            />
          </Flex>
          <Text fontSize="xs" color={APP_TEXT_SECONDARY} mt={2}>
            Only Sentence Detective renders while we refine its {moduleType} experience.
          </Text>
        </Box>

        {isFinalQuiz && (
          <HStack spacing="2px" w="100%" h="12px">
            {Array.from({ length: quizConfig.questionsRequired }).map((_, index) => (
              <Box
                key={index}
                flex="1"
                h="100%"
                borderRadius="full"
                bg={
                  index >= quizHistory.length
                    ? APP_SURFACE_MUTED
                    : quizHistory[index]
                      ? "var(--question-success-accent)"
                      : "var(--question-error-accent)"
                }
              />
            ))}
          </HStack>
        )}

        <Box
          p={{ base: 4, md: 6 }}
          minH="360px"
          bg={APP_SURFACE_ELEVATED}
          borderWidth="1px"
          borderColor={APP_BORDER}
          borderRadius="2xl"
          boxShadow="var(--app-shadow-soft)"
          style={questionSquircleStyle}
        >
          {loading ? (
            <VStack minH="310px" justify="center" spacing={4}>
              <Spinner size="lg" color="purple.300" thickness="3px" />
              <Text color={APP_TEXT_SECONDARY}>
                Building {variantMeta.label.toLowerCase()}…
              </Text>
            </VStack>
          ) : !question ? (
            <VStack minH="310px" justify="center" spacing={4} textAlign="center">
              <Text fontSize="3xl" aria-hidden="true">
                🔎
              </Text>
              <Text fontWeight="800" color={APP_TEXT_PRIMARY}>
                No clear case was generated
              </Text>
              <Text maxW="420px" fontSize="sm" color={APP_TEXT_SECONDARY}>
                {generationError ||
                  "Sentence Detective couldn't create an unambiguous question."}
              </Text>
              <Button
                leftIcon={<FiRefreshCw />}
                colorScheme="purple"
                onClick={handleRefresh}
                style={questionSquircleStyle}
              >
                Try another case
              </Button>
            </VStack>
          ) : (
            <>
              {generationError && (
                <Text fontSize="xs" color="orange.300" mb={4}>
                  {generationError}
                </Text>
              )}
              {question.variant === "sentence_detective" && (
                <SentenceDetective
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result !== null}
                  targetLang={targetLang}
                />
              )}
              {question.variant === "dialogue_fork" && (
                <DialogueFork
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result !== null}
                />
              )}
              {question.variant === "sentence_shapeshifter" && (
                <SentenceShapeshifter
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result !== null}
                />
              )}
              {question.variant === "word_neighborhoods" && (
                <WordNeighborhoods
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result !== null}
                  wordOrder={wordOrder}
                />
              )}
              {question.variant === "morphology_forge" && (
                <MorphologyForge
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result !== null}
                />
              )}
              {question.variant === "three_clue_mystery" && (
                <ThreeClueMystery
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result !== null}
                  revealedClues={revealedClues}
                  setRevealedClues={setRevealedClues}
                />
              )}
              {question.variant === "listen_difference" && (
                <ListenDifference
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result !== null}
                  onPlay={handlePlay}
                  isSpeaking={isSpeaking}
                />
              )}
              {question.variant === "three_word_challenge" && (
                <ThreeWordChallenge
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result !== null}
                />
              )}
              {question.variant === "natural_or_weird" && (
                <NaturalOrWeird
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result !== null}
                />
              )}
            </>
          )}
        </Box>

        {!loading && question && result === null && (
          <VStack spacing={2} align="stretch">
            {question.hint && (
              <Text fontSize="sm" color={APP_TEXT_SECONDARY} textAlign="center">
                Hint: {question.hint}
              </Text>
            )}
            <Button
              colorScheme="cyan"
              size="lg"
              py={6}
              isLoading={submitting}
              isDisabled={!ready || submitting}
              onClick={handleSubmit}
              style={questionSquircleStyle}
            >
              {submitting
                ? "Checking…"
                : t("vocab_submit") === "vocab_submit"
                  ? "Check answer"
                  : t("vocab_submit")}
            </Button>
          </VStack>
        )}

        {question && result !== null && (
          <ResultPanel
            ok={result}
            xp={recentXp}
            question={question}
            onRetry={handleRetry}
            onNext={handleNext}
            isLastQuizQuestion={
              isFinalQuiz && quizHistory.length >= quizConfig.questionsRequired
            }
            allowRetry={!isFinalQuiz}
          />
        )}
      </VStack>
    </Box>
  );
}
