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
  Skeleton,
  Spinner,
  Text,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiRefreshCw,
  FiVolume2,
} from "react-icons/fi";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { MdOutlineSupportAgent } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import useUserStore from "../hooks/useUserStore";
import useSoundSettings from "../hooks/useSoundSettings";
import useNotesStore from "../hooks/useNotesStore";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import FeedbackRail from "./FeedbackRail";
import VoiceOrb from "./VoiceOrb";
import XpProgressHeader from "./XpProgressHeader";
import { SortableArea, SortableList, SortableItem } from "./dnd/Sortable";
import { simplemodel } from "../firebaseResources/firebaseResources";
import translations from "../utils/translation";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { awardXp } from "../utils/utils";
import { captureCompanionMemory } from "../utils/companionMemory";
import { getLanguageXp } from "../utils/progressTracking";
import { extractCEFRLevel } from "../utils/cefrUtils";
import { generateNoteContent, buildNoteObject } from "../utils/noteGeneration";
import { buildAssistantLanguagePolicy } from "../utils/assistantLanguagePolicy";
import {
  getDelightQuizOutcome,
  normalizeDelightQuizProgress,
  serializeDelightQuizProgress,
} from "../utils/delightQuizProgress";
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
  submitSound,
} from "../constants/sounds";
import {
  getQuestionAssistantPanelProps,
  getQuestionChoiceCardProps,
  getQuestionChipProps,
  getQuestionToolButtonProps,
  questionAssistantMarkdownStyles,
  questionAssistantText,
  questionSquircleStyle,
} from "./questionUiStyles";
import {
  DELIGHT_VARIANTS,
  DELIGHT_VARIANT_IDS,
  buildDelightQuestionPrompt,
  buildDelightQuestionRepairPrompt,
  buildDelightResponseJudgePrompt,
  calculateDelightQuestionXp,
  generateSentenceDetectiveQuestion,
  getDelightLanguageName,
  getInitialDelightResponse,
  gradeDelightResponse,
  isDelightQuestionLessonGrounded,
  isDelightResponseReady,
  normalizeDelightQuestion,
  parseDelightJudgeVerdict,
  parsePartialDelightQuestion,
} from "../utils/delightQuestionVariants";
import {
  formatDialogueForkCopy,
  getDialogueForkCopy,
} from "../utils/dialogueForkI18n";
import {
  formatSentenceDetectiveCopy,
  getSentenceDetectiveCopy,
} from "../utils/sentenceDetectiveI18n";
import {
  formatSentenceShapeshifterCopy,
  getSentenceShapeshifterCopy,
} from "../utils/sentenceShapeshifterI18n";
import {
  formatWordNeighborhoodsCopy,
  getWordNeighborhoodsCopy,
} from "../utils/wordNeighborhoodsI18n";
import {
  formatMorphologyForgeCopy,
  getMorphologyForgeCopy,
} from "../utils/morphologyForgeI18n";
import {
  formatThreeClueMysteryCopy,
  getThreeClueMysteryCopy,
} from "../utils/threeClueMysteryI18n";
import { getListenDifferenceCopy } from "../utils/listenDifferenceI18n";
import { getThreeWordChallengeCopy } from "../utils/threeWordChallengeI18n";
import { getNaturalOrWeirdCopy } from "../utils/naturalOrWeirdI18n";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const AVAILABLE_VARIANTS = DELIGHT_VARIANT_IDS.map((variantId) =>
  DELIGHT_VARIANTS.find(({ id }) => id === variantId),
).filter(Boolean);
const QUESTION_GENERATION_TIMEOUT_MS = 30000;
const SENTENCE_DETECTIVE_CACHE_VERSION = "semantic-proof-v2";
const DELIGHT_JSON_GENERATION_CONFIG = {
  thinkingConfig: { thinkingBudget: 0 },
  responseMimeType: "application/json",
};
const SPEECH_RESPONSE_VARIANTS = new Set([
  "sentence_shapeshifter",
  "three_clue_mystery",
  "three_word_challenge",
]);

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
  const lang = normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE);
  const dict = (translations && translations[lang]) || {};
  const enDict = (translations && translations.en) || {};
  return useCallback(
    (key, params) => {
      const raw = (dict[key] ?? enDict[key] ?? key) + "";
      if (!params) return raw;
      return raw.replace(/{(\w+)}/g, (_, k) =>
        k in params ? String(params[k]) : `{${k}}`,
      );
    },
    [dict, enDict],
  );
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

function QuestionAssistantButton({
  label,
  onAskAssistant,
  isLoading = false,
  hasResponse = false,
}) {
  if (!onAskAssistant) return null;

  return (
    <IconButton
      aria-label={label || "Help"}
      icon={
        isLoading ? (
          <VoiceOrb
            state={
              ["idle", "listening", "speaking"][
                Math.floor(Math.random() * 3)
              ]
            }
            size={16}
          />
        ) : (
          <MdOutlineSupportAgent />
        )
      }
      size="sm"
      fontSize="lg"
      rounded="xl"
      onClick={onAskAssistant}
      isDisabled={isLoading || hasResponse}
      {...getQuestionToolButtonProps()}
    />
  );
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

function SpeechAnswerButton({
  onClick,
  isRecording = false,
  isConnecting = false,
  isSupported = false,
  isDisabled = false,
  labels = {},
}) {
  const label = isConnecting
    ? labels.connecting || "Connecting…"
    : isRecording
      ? labels.stop || "Stop recording"
      : labels.record || "Record answer";

  return (
    <IconButton
      type="button"
      aria-label={label}
      title={label}
      icon={
        isConnecting ? (
          <Spinner size="xs" thickness="2px" color="currentColor" />
        ) : isRecording ? (
          <FaStop size={16} />
        ) : (
          <FaMicrophone size={18} />
        )
      }
      size="lg"
      minW="54px"
      minH="54px"
      flexShrink={0}
      rounded="xl"
      colorScheme={isRecording ? undefined : "teal"}
      variant={isRecording ? "solid" : "outline"}
      onClick={onClick}
      isDisabled={isDisabled || isConnecting || !isSupported}
      {...getQuestionToolButtonProps({
        active: isRecording || isConnecting,
      })}
      bg={isRecording ? SOFT_STOP_BUTTON_BG : undefined}
      color={isRecording ? "white" : undefined}
      _hover={
        isRecording
          ? { bg: SOFT_STOP_BUTTON_HOVER_BG }
          : undefined
      }
      style={questionSquircleStyle}
    />
  );
}

function Chip({
  children,
  selected = false,
  onClick,
  disabled = false,
  status = "default",
  phase = "find",
}) {
  const isRepair = phase === "repair";
  const phaseStyle = isRepair
    ? {
        bg: selected ? "teal.600" : "teal.500",
        borderColor: selected ? "teal.700" : "teal.500",
        hoverBg: selected ? "teal.700" : "teal.600",
      }
    : {
        bg: selected ? "purple.600" : "purple.500",
        borderColor: selected ? "purple.700" : "purple.500",
        hoverBg: selected ? "purple.700" : "purple.600",
      };
  const statusStyle =
    status === "rejected"
      ? {
          borderColor: "var(--question-error-accent)",
          bg: "var(--question-error-bg)",
          color: APP_TEXT_PRIMARY,
          hoverBg: "var(--question-error-bg)",
        }
      : status === "confirmed"
        ? {
            borderColor: "teal.500",
            bg: "rgba(49, 151, 149, 0.14)",
            color: APP_TEXT_PRIMARY,
            hoverBg: "rgba(49, 151, 149, 0.14)",
          }
        : { ...phaseStyle, color: "white" };
  return (
    <Button
      size="md"
      px={4}
      minH="44px"
      whiteSpace="normal"
      isDisabled={disabled}
      onClick={onClick}
      {...getQuestionChipProps()}
      borderColor={statusStyle.borderColor}
      bg={statusStyle.bg}
      color={statusStyle.color}
      _hover={{
        bg: statusStyle.hoverBg || phaseStyle.hoverBg,
        borderColor: statusStyle.borderColor,
      }}
      _disabled={{
        opacity: 1,
        cursor: "default",
        color: statusStyle.color,
      }}
    >
      {children}
    </Button>
  );
}

function textFromChunk(chunk) {
  try {
    if (!chunk) return "";
    if (typeof chunk.text === "function") return chunk.text() || "";
    if (typeof chunk.text === "string") return chunk.text;
    const cand = chunk.candidates?.[0];
    if (cand?.content?.parts?.length) {
      return cand.content.parts.map((p) => p.text || "").join("");
    }
  } catch {
    // Ignore malformed provider chunks until more text arrives.
  }
  return "";
}

function QuestionShell({
  meta,
  question,
  description,
  title,
  language,
  direction,
  showIcon = true,
  showDescription = true,
  headerAction = null,
  children,
}) {
  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={language}
      dir={direction}
    >
      <Box>
        <HStack spacing={2} mb={showDescription ? 1 : 0} justify="space-between">
          <HStack spacing={2} minW={0}>
            {showIcon && (
              <Text fontSize="2xl" aria-hidden="true">
                {meta.icon}
              </Text>
            )}
            <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
              {title || meta.label}
            </Text>
          </HStack>
          {headerAction}
        </HStack>
        {showDescription && (
          <Text fontSize="sm" color={APP_TEXT_SECONDARY}>
            {description || question.instruction || meta.description}
          </Text>
        )}
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
  supportLang,
  copy,
  onAskAssistant,
  isLoadingAssistantSupport = false,
  assistantSupportText = "",
  assistantLabel = "Assistant",
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");
  const guidanceJoiner = ["ja", "zh"].includes(supportLang) ? "" : " ";
  const rejectedTokenIndices = response.rejectedTokenIndices || [];
  const foundBrokenWord = response.tokenIndex === question.incorrectIndex;
  const previewTokens = [...question.tokens];
  if (foundBrokenWord && response.replacement) {
    previewTokens[question.incorrectIndex] = response.replacement;
  }
  const repairedPreview = previewTokens.join(question.joiner);

  const handleTokenClick = (index) => {
    if (index === question.incorrectIndex) {
      setResponse((current) => ({
        ...current,
        tokenIndex: index,
        replacement: "",
        rejectedTokenIndices: [],
      }));
      return;
    }
    setResponse((current) => ({
      ...current,
      tokenIndex: null,
      replacement: "",
      rejectedTokenIndices: Array.from(
        new Set([...(current.rejectedTokenIndices || []), index]),
      ),
    }));
  };

  return (
    <QuestionShell
      meta={DELIGHT_VARIANTS[0]}
      question={question}
      title={copy.title}
      language={supportLang}
      direction={supportDirection}
      showIcon={false}
      showDescription={false}
      headerAction={
        <QuestionAssistantButton
          label={copy.askForHelp}
          onAskAssistant={onAskAssistant}
          isLoading={isLoadingAssistantSupport}
          hasResponse={!!assistantSupportText}
        />
      }
    >
      {!foundBrokenWord && (
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {`${copy.findTitle}${guidanceJoiner}${copy.findHelp}`}
        </Text>
      )}

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
              status={
                response.tokenIndex === index
                  ? "confirmed"
                  : rejectedTokenIndices.includes(index)
                    ? "rejected"
                    : "default"
              }
              disabled={
                locked ||
                foundBrokenWord ||
                rejectedTokenIndices.includes(index)
              }
              onClick={() => handleTokenClick(index)}
            >
              <HStack as="span" spacing={2}>
                <Text as="span">{token}</Text>
                {response.tokenIndex === index && (
                  <Text as="span" aria-hidden="true">✓</Text>
                )}
              </HStack>
            </Chip>
          </WrapItem>
        ))}
      </Wrap>

      {/* Inline assistant support response */}
      {(assistantSupportText || isLoadingAssistantSupport) && (
        <Box
          p={4}
          borderRadius="xl"
          style={questionSquircleStyle}
          {...getQuestionAssistantPanelProps()}
        >
          <HStack spacing={2} mb={2} align="center">
            <MdOutlineSupportAgent color={questionAssistantText.accent} />
            <Text
              fontSize="xs"
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="wider"
              color="var(--question-assistant-accent-strong)"
            >
              {assistantLabel}
            </Text>
            {isLoadingAssistantSupport && (
              <VoiceOrb
                state={
                  ["idle", "listening", "speaking"][
                    Math.floor(Math.random() * 3)
                  ]
                }
                size={16}
                centered={false}
              />
            )}
          </HStack>
          {assistantSupportText && (
            <Box
              fontSize="sm"
              color="var(--question-assistant-text)"
              lineHeight="tall"
              sx={questionAssistantMarkdownStyles}
            >
              <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
            </Box>
          )}
        </Box>
      )}

      {foundBrokenWord && (
        <Box
          p={{ base: 4, md: 5 }}
          borderWidth="1px"
          borderColor="var(--question-choice-single-accent)"
          bg={APP_SURFACE_MUTED}
          borderRadius="xl"
          style={questionSquircleStyle}
        >
          <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal" mb={3}>
            {copy.chooseRepair}
          </Text>
          <Wrap spacing={2} dir={targetDirection} lang={targetLang}>
            {question.replacements.map((replacement) => (
              <WrapItem key={replacement}>
                <Chip
                  phase="repair"
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
          {response.replacement && (
            <Box
              mt={4}
              p={3}
              bg={APP_SURFACE_ELEVATED}
              borderWidth="1px"
              borderColor={APP_BORDER}
              borderRadius="lg"
              style={questionSquircleStyle}
            >
              <Text
                fontSize="lg"
                fontWeight="750"
                color={APP_TEXT_PRIMARY}
                dir={targetDirection}
                lang={targetLang}
              >
                {repairedPreview}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </QuestionShell>
  );
}

function SentenceDetectiveSkeleton({
  streamingQuestion = null,
  copy,
  targetLang = "es",
  supportLang = "en",
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");
  const guidanceJoiner = ["ja", "zh"].includes(supportLang) ? "" : " ";
  const placeholderWidths = [85, 110, 65, 95, 75, 100];
  const streamingTokens =
    streamingQuestion?.tokens ||
    (streamingQuestion?.sentence
      ? streamingQuestion.sentence.split(/\s+/).filter(Boolean)
      : null);

  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={supportLang}
      dir={supportDirection}
    >
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Sentence Detective"}
          </Text>
          <IconButton
            aria-label={copy?.askForHelp || "Help"}
            icon={<MdOutlineSupportAgent />}
            size="sm"
            fontSize="lg"
            rounded="xl"
            isDisabled
            {...getQuestionToolButtonProps()}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {`${copy?.findTitle || "Find the error"}${guidanceJoiner}${copy?.findHelp || "Tap the word that feels out of place."}`}
        </Text>
      </Box>

      <Wrap
        spacing={2}
        justify="center"
        py={3}
        dir={targetDirection}
        lang={targetLang}
      >
        {streamingTokens && streamingTokens.length > 0
          ? streamingTokens.map((token, i) => (
              <WrapItem key={`stream-tok-${i}`}>
                <Chip disabled status="default">
                  {token}
                </Chip>
              </WrapItem>
            ))
          : placeholderWidths.map((width, i) => (
              <WrapItem key={`skel-${i}`}>
                <Skeleton
                  height="44px"
                  width={`${width}px`}
                  borderRadius="xl"
                  startColor="rgba(128, 90, 213, 0.12)"
                  endColor="rgba(128, 90, 213, 0.28)"
                  style={questionSquircleStyle}
                />
              </WrapItem>
            ))}
      </Wrap>
    </VStack>
  );
}

function DialogueForkSkeleton({
  streamingQuestion = null,
  copy,
  targetLang = "es",
  supportLang = "en",
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");

  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={supportLang}
      dir={supportDirection}
    >
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Dialogue Fork"}
          </Text>
          <IconButton
            aria-label={copy?.askForHelp || "Help"}
            icon={<MdOutlineSupportAgent />}
            size="sm"
            fontSize="lg"
            rounded="xl"
            isDisabled
            {...getQuestionToolButtonProps()}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Choose the natural response to continue the conversation."}
        </Text>
      </Box>

      {/* Dialogue Line with TTS Button to the left */}
      <HStack
        spacing={3}
        align="center"
        dir={targetDirection}
        lang={targetLang}
        py={1}
      >
        <IconButton
          aria-label="Play dialogue audio"
          icon={<FiVolume2 />}
          size="sm"
          variant="ghost"
          rounded="full"
          color="var(--question-assistant-accent-strong)"
          isDisabled
          flexShrink={0}
        />
        {streamingQuestion?.line ? (
          <Text
            color={APP_TEXT_PRIMARY}
            fontSize="xl"
            fontWeight="semibold"
          >
            {streamingQuestion.line}
          </Text>
        ) : (
          <Skeleton
            height="24px"
            width="240px"
            borderRadius="md"
            startColor="rgba(128, 90, 213, 0.12)"
            endColor="rgba(128, 90, 213, 0.28)"
          />
        )}
      </HStack>

      {/* 4 Option Cards */}
      <VStack spacing={3} align="stretch" dir={targetDirection} lang={targetLang}>
        {[0, 1, 2, 3].map((i) => {
          const opt = streamingQuestion?.options?.[i];
          return opt ? (
            <ChoiceCard key={`dialogue-opt-${i}`} disabled selected={false}>
              {opt}
            </ChoiceCard>
          ) : (
            <Skeleton
              key={`dialogue-skel-opt-${i}`}
              height="52px"
              width="100%"
              borderRadius="xl"
              startColor="rgba(128, 90, 213, 0.12)"
              endColor="rgba(128, 90, 213, 0.28)"
              style={questionSquircleStyle}
            />
          );
        })}
      </VStack>
    </VStack>
  );
}

function SentenceShapeshifterSkeleton({
  streamingQuestion = null,
  copy,
  targetLang = "es",
  supportLang = "en",
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");
  const sentenceText =
    streamingQuestion?.source || streamingQuestion?.sentence;

  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={supportLang}
      dir={supportDirection}
    >
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Sentence Shapeshifter"}
          </Text>
          <IconButton
            aria-label={copy?.askForHelp || "Help"}
            icon={<MdOutlineSupportAgent />}
            size="sm"
            fontSize="lg"
            rounded="xl"
            isDisabled
            {...getQuestionToolButtonProps()}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Transform the sentence according to the rule."}
        </Text>
      </Box>

      {/* Source Sentence Card with left-aligned TTS */}
      <Box
        p={4}
        bg={APP_SURFACE_MUTED}
        borderWidth="1px"
        borderColor={APP_BORDER}
        borderRadius="xl"
        style={questionSquircleStyle}
      >
        <HStack
          spacing={3}
          align="center"
          dir={targetDirection}
          lang={targetLang}
        >
          <IconButton
            aria-label="Play source sentence audio"
            icon={<FiVolume2 />}
            size="sm"
            variant="ghost"
            rounded="full"
            color="var(--question-assistant-accent-strong)"
            isDisabled
            flexShrink={0}
          />
          {sentenceText ? (
            <Text
              color={APP_TEXT_PRIMARY}
              fontSize="lg"
              fontWeight="semibold"
            >
              {sentenceText}
            </Text>
          ) : (
            <Skeleton
              height="24px"
              width="220px"
              borderRadius="md"
              startColor="rgba(128, 90, 213, 0.12)"
              endColor="rgba(128, 90, 213, 0.28)"
            />
          )}
        </HStack>
      </Box>

      {/* Transformation Rule Text */}
      <HStack justify="center" align="center" spacing={2} maxW="100%" px={2}>
        <Text fontSize="md" color={APP_TEXT_SECONDARY} fontWeight="bold" flexShrink={0}>
          ↓
        </Text>
        {streamingQuestion?.constraint ? (
          <Text
            color={APP_TEXT_SECONDARY}
            fontSize="sm"
            fontWeight="medium"
            textAlign="center"
            noOfLines={2}
          >
            {streamingQuestion.constraint}
          </Text>
        ) : (
          <Skeleton
            height="18px"
            width="160px"
            borderRadius="md"
            startColor="rgba(128, 90, 213, 0.12)"
            endColor="rgba(128, 90, 213, 0.28)"
          />
        )}
      </HStack>

      {/* Input Box Skeleton */}
      <Skeleton
        height="50px"
        width="100%"
        borderRadius="xl"
        startColor="rgba(128, 90, 213, 0.12)"
        endColor="rgba(128, 90, 213, 0.28)"
        style={questionSquircleStyle}
      />
    </VStack>
  );
}

function WordNeighborhoodsSkeleton({
  streamingQuestion = null,
  copy,
  targetLang = "es",
  supportLang = "en",
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");
  const groups = streamingQuestion?.groups || [];
  const streamingItems = groups.flatMap((g) => g.items || []);

  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={supportLang}
      dir={supportDirection}
    >
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Word Neighborhoods"}
          </Text>
          <IconButton
            aria-label={copy?.askForHelp || "Help"}
            icon={<MdOutlineSupportAgent />}
            size="sm"
            fontSize="lg"
            rounded="xl"
            isDisabled
            {...getQuestionToolButtonProps()}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Sort each word into its matching neighborhood."}
        </Text>
      </Box>

      {/* Word Bank */}
      <Box
        minH="86px"
        p={4}
        borderWidth="1.5px"
        borderStyle="dashed"
        borderColor={APP_BORDER_STRONG}
        bg={APP_SURFACE_MUTED}
        borderRadius="xl"
        style={questionSquircleStyle}
      >
        <Wrap spacing={2.5} justify="center" dir={targetDirection} lang={targetLang}>
          {streamingItems.length > 0
            ? streamingItems.map((item, i) => (
                <WrapItem key={`stream-wn-item-${i}`}>
                  <Box
                    style={questionSquircleStyle}
                    px={3.5}
                    py={2}
                    borderRadius="lg"
                    fontSize="md"
                    fontWeight="semibold"
                    borderWidth="1.5px"
                    borderColor={APP_BORDER}
                    bg={APP_SURFACE_ELEVATED}
                    color={APP_TEXT_PRIMARY}
                    boxShadow="sm"
                  >
                    {item}
                  </Box>
                </WrapItem>
              ))
            : [1, 2, 3, 4, 5, 6].map((i) => (
                <WrapItem key={`word-bank-skel-${i}`}>
                  <Skeleton
                    height="38px"
                    width="76px"
                    borderRadius="lg"
                    startColor="rgba(128, 90, 213, 0.12)"
                    endColor="rgba(128, 90, 213, 0.28)"
                    style={questionSquircleStyle}
                  />
                </WrapItem>
              ))}
        </Wrap>
      </Box>

      {/* 2 Column Group Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3.5}>
        {[0, 1].map((i) => {
          const grp = groups[i];
          return (
            <Box
              key={`word-group-skel-${i}`}
              minH="150px"
              p={4}
              borderWidth="2px"
              borderColor={APP_BORDER}
              bg={APP_SURFACE_ELEVATED}
              borderRadius="xl"
              style={questionSquircleStyle}
              textAlign="left"
            >
              {grp?.label ? (
                <Text fontWeight="800" fontSize="md" color={APP_TEXT_PRIMARY} mb={3}>
                  {grp.label}
                </Text>
              ) : (
                <Box mb={3}>
                  <Skeleton height="20px" width="110px" borderRadius="md" />
                </Box>
              )}
              <Wrap spacing={2} dir={targetDirection} lang={targetLang}>
                {grp?.items?.length ? (
                  grp.items.map((it, idx) => (
                    <WrapItem key={`grp-${i}-it-${idx}`}>
                      <Box
                        style={questionSquircleStyle}
                        px={3}
                        py={1.5}
                        borderRadius="lg"
                        fontSize="sm"
                        fontWeight="medium"
                        borderWidth="1px"
                        borderColor={APP_BORDER}
                        bg={APP_SURFACE_MUTED}
                        color={APP_TEXT_PRIMARY}
                      >
                        {it}
                      </Box>
                    </WrapItem>
                  ))
                ) : (
                  <>
                    <Skeleton height="32px" width="68px" borderRadius="lg" />
                    <Skeleton height="32px" width="80px" borderRadius="lg" />
                  </>
                )}
              </Wrap>
            </Box>
          );
        })}
      </SimpleGrid>
    </VStack>
  );
}

function MorphologyForgeSkeleton({
  streamingQuestion = null,
  copy,
  targetLang = "es",
  supportLang = "en",
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");
  const pieces = streamingQuestion?.pieces || [];
  const sentence = streamingQuestion?.sentence || "";

  return (
    <VStack spacing={5} align="stretch" lang={supportLang} dir={supportDirection}>
      {/* Header */}
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Morphology Forge"}
          </Text>
          <IconButton
            aria-label={copy?.askForHelp || "Help"}
            icon={<MdOutlineSupportAgent />}
            size="sm"
            fontSize="lg"
            rounded="xl"
            isDisabled
            {...getQuestionToolButtonProps()}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Build the missing word from meaningful morphemes."}
        </Text>
      </Box>

      {/* Context Sentence Card */}
      <Box
        p={5}
        borderWidth="1.5px"
        borderColor={APP_BORDER}
        bg={APP_SURFACE_ELEVATED}
        borderRadius="xl"
        style={questionSquircleStyle}
        textAlign="center"
        dir={targetDirection}
        lang={targetLang}
      >
        {sentence ? (
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="semibold"
            color={APP_TEXT_PRIMARY}
            lineHeight="tall"
          >
            {sentence}
          </Text>
        ) : (
          <Skeleton height="24px" width="85%" borderRadius="md" mx="auto" />
        )}
      </Box>

      {/* Forge Slot Box */}
      <Box
        minH="88px"
        p={4}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={APP_BORDER_STRONG}
        bg={APP_SURFACE_MUTED}
        borderRadius="xl"
        style={questionSquircleStyle}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text
          fontSize="xs"
          color={APP_TEXT_SECONDARY}
          fontStyle="italic"
          py={2}
        >
          {copy?.emptyForge || "Drag or tap pieces below to forge the missing word"}
        </Text>
      </Box>

      {/* Available Pieces Bank */}
      <Box
        p={4}
        borderWidth="1.5px"
        borderColor={APP_BORDER}
        bg={APP_SURFACE_ELEVATED}
        borderRadius="xl"
        style={questionSquircleStyle}
      >
        <Wrap spacing={2.5} justify="center" dir={targetDirection} lang={targetLang}>
          {pieces.length > 0
            ? pieces.map((piece, i) => (
                <WrapItem key={`stream-piece-${i}`}>
                  <Box
                    style={questionSquircleStyle}
                    px={3.5}
                    py={2}
                    borderRadius="lg"
                    fontSize="md"
                    fontWeight="semibold"
                    borderWidth="1.5px"
                    borderColor={APP_BORDER}
                    bg={APP_SURFACE_MUTED}
                    color={APP_TEXT_PRIMARY}
                    boxShadow="sm"
                  >
                    {piece}
                  </Box>
                </WrapItem>
              ))
            : [1, 2, 3, 4, 5].map((i) => (
                <WrapItem key={`forge-piece-skel-${i}`}>
                  <Skeleton
                    height="38px"
                    width="72px"
                    borderRadius="lg"
                    startColor="rgba(128, 90, 213, 0.12)"
                    endColor="rgba(128, 90, 213, 0.28)"
                    style={questionSquircleStyle}
                  />
                </WrapItem>
              ))}
        </Wrap>
      </Box>
    </VStack>
  );
}

function ThreeClueMysterySkeleton({
  streamingQuestion = null,
  copy,
  targetLang = "es",
  supportLang = "en",
}) {
  const supportDirection = getLanguageDirection(supportLang, "ltr");
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const clues = streamingQuestion?.clues || [];
  const firstClue = clues[0] || "";

  return (
    <VStack spacing={5} align="stretch" lang={supportLang} dir={supportDirection}>
      {/* Header */}
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Three-Clue Mystery"}
          </Text>
          <IconButton
            aria-label={copy?.askForHelp || "Help"}
            icon={<MdOutlineSupportAgent />}
            size="sm"
            fontSize="lg"
            rounded="xl"
            isDisabled
            {...getQuestionToolButtonProps()}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Deduce the mystery word using as few clues as possible."}
        </Text>
      </Box>

      {/* Clues Card Stack: Strictly show only Clue 1 during loading to prevent spoilers */}
      <VStack spacing={3} align="stretch">
        <Box
          p={4}
          borderWidth="1.5px"
          borderColor="purple.400"
          bg={APP_SURFACE_ELEVATED}
          borderRadius="xl"
          style={questionSquircleStyle}
          boxShadow="0 2px 10px rgba(128, 90, 213, 0.12)"
        >
          <HStack spacing={3} align="flex-start">
            <Badge
              colorScheme="purple"
              variant="solid"
              borderRadius="full"
              px={2.5}
              py={0.5}
              fontSize="xs"
              fontWeight="bold"
              textTransform="none"
              flexShrink={0}
            >
              {formatThreeClueMysteryCopy(copy?.clueBadge || "Clue {index}", {
                index: 1,
              })}
            </Badge>
            {firstClue ? (
              <Text
                fontSize={{ base: "sm", md: "md" }}
                color={APP_TEXT_PRIMARY}
                fontWeight="medium"
                lineHeight="tall"
              >
                {firstClue}
              </Text>
            ) : (
              <Skeleton height="20px" width="75%" borderRadius="md" />
            )}
          </HStack>
        </Box>
      </VStack>

      {/* Clue Control Row: Live XP Badge & Reveal Action */}
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={2} px={1}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="purple.500"
          bg="rgba(128, 90, 213, 0.08)"
          px={3}
          py={1}
          borderRadius="full"
        >
          {formatThreeClueMysteryCopy(copy?.potentialXp || "+{xp} XP", {
            xp: 10,
          })}
        </Text>
        <Button
          size="sm"
          variant="ghost"
          colorScheme="purple"
          isDisabled
          style={questionSquircleStyle}
        >
          {copy?.revealNext || "Reveal next clue"}
        </Button>
      </HStack>

      {/* Target Word Input Field Skeleton */}
      <Box>
        <Input
          value=""
          isDisabled
          placeholder={copy?.inputPlaceholder || "Type your answer…"}
          size="lg"
          variant="filled"
          borderRadius="xl"
          bg={APP_SURFACE_MUTED}
          borderColor={APP_BORDER}
          dir={targetDirection}
          lang={targetLang}
          style={questionSquircleStyle}
        />
      </Box>
    </VStack>
  );
}

function ListenDifferenceSkeleton({
  streamingQuestion = null,
  copy,
  targetLang = "es",
  supportLang = "en",
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");
  const options = streamingQuestion?.options || [];

  return (
    <VStack spacing={5} align="stretch" lang={supportLang} dir={supportDirection}>
      {/* Header */}
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Listen for the Difference"}
          </Text>
          <IconButton
            aria-label={copy?.askForHelp || "Help"}
            icon={<MdOutlineSupportAgent />}
            size="sm"
            fontSize="lg"
            rounded="xl"
            isDisabled
            {...getQuestionToolButtonProps()}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Listen carefully. Which sentence did you hear?"}
        </Text>
      </Box>

      {/* Prominent Play Audio Button */}
      <Button
        leftIcon={<FiVolume2 size={22} />}
        size="lg"
        py={7}
        isDisabled
        {...getQuestionToolButtonProps({ active: false })}
        style={questionSquircleStyle}
        fontSize="md"
        fontWeight="semibold"
        boxShadow="0 2px 12px rgba(128, 90, 213, 0.15)"
      >
        {copy?.playAudio || "Play audio"}
      </Button>

      {/* Options Cards */}
      <VStack spacing={3} align="stretch" dir={targetDirection} lang={targetLang}>
        {[0, 1].map((i) => {
          const opt = options[i];
          return opt ? (
            <ChoiceCard key={`stream-ld-opt-${i}`} disabled selected={false}>
              {opt}
            </ChoiceCard>
          ) : (
            <Skeleton
              key={`ld-skel-${i}`}
              height="54px"
              width="100%"
              borderRadius="xl"
              startColor="rgba(128, 90, 213, 0.12)"
              endColor="rgba(128, 90, 213, 0.28)"
              style={questionSquircleStyle}
            />
          );
        })}
      </VStack>
    </VStack>
  );
}

function ThreeWordChallengeSkeleton({
  streamingQuestion = null,
  copy,
  targetLang = "es",
  supportLang = "en",
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");
  const cues = streamingQuestion?.cues || [];

  return (
    <VStack spacing={5} align="stretch" lang={supportLang} dir={supportDirection}>
      {/* Header */}
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Three-Word Challenge"}
          </Text>
          <IconButton
            aria-label={copy?.askForHelp || "Help"}
            icon={<MdOutlineSupportAgent />}
            size="sm"
            fontSize="lg"
            rounded="xl"
            isDisabled
            {...getQuestionToolButtonProps()}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Create an original sentence using all three words."}
        </Text>
      </Box>

      {/* 3 Cue Chips */}
      <HStack
        spacing={3}
        justify="center"
        flexWrap="wrap"
        py={2}
        dir={targetDirection}
        lang={targetLang}
      >
        {cues.length > 0
          ? cues.map((cue, index) => (
              <Box
                key={`stream-cue-${index}`}
                px={4}
                py={2.5}
                borderRadius="xl"
                borderWidth="1.5px"
                borderColor="purple.300"
                bg="rgba(128, 90, 213, 0.12)"
                color={APP_TEXT_PRIMARY}
                style={questionSquircleStyle}
                boxShadow="0 2px 8px rgba(128, 90, 213, 0.1)"
              >
                <Text
                  as="span"
                  fontWeight="800"
                  fontSize={{ base: "md", md: "lg" }}
                >
                  {cue}
                </Text>
              </Box>
            ))
          : [1, 2, 3].map((i) => (
              <Skeleton
                key={`skel-cue-${i}`}
                height="46px"
                width="115px"
                borderRadius="xl"
                startColor="rgba(128, 90, 213, 0.12)"
                endColor="rgba(128, 90, 213, 0.28)"
                style={questionSquircleStyle}
              />
            ))}
      </HStack>

      {/* Input Field Skeleton */}
      <Skeleton
        height="50px"
        width="100%"
        borderRadius="xl"
        startColor="rgba(128, 90, 213, 0.12)"
        endColor="rgba(128, 90, 213, 0.28)"
        style={questionSquircleStyle}
      />
    </VStack>
  );
}

function NaturalOrWeirdSkeleton({
  streamingQuestion = null,
  copy,
  targetLang = "es",
  supportLang = "en",
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");

  return (
    <VStack spacing={5} align="stretch" lang={supportLang} dir={supportDirection}>
      {/* Header */}
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Natural or Weird?"}
          </Text>
          <IconButton
            aria-label={copy?.askForHelp || "Help"}
            icon={<MdOutlineSupportAgent />}
            size="sm"
            fontSize="lg"
            rounded="xl"
            isDisabled
            {...getQuestionToolButtonProps()}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Decide if this sentence sounds natural in everyday use."}
        </Text>
      </Box>

      {/* Sentence Presentation Card with Audio Button */}
      <Box
        p={{ base: 5, md: 6 }}
        bg={APP_SURFACE_MUTED}
        borderWidth="1px"
        borderColor={APP_BORDER}
        borderRadius="2xl"
        style={questionSquircleStyle}
      >
        <HStack justify="space-between" align="center" spacing={3}>
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="bold"
            color={APP_TEXT_PRIMARY}
            textAlign="left"
            dir={targetDirection}
            lang={targetLang}
            flex="1"
          >
            {streamingQuestion?.sentence ? (
              `“${streamingQuestion.sentence}”`
            ) : (
              <Skeleton
                height="28px"
                width="75%"
                borderRadius="md"
                startColor="rgba(128, 90, 213, 0.12)"
                endColor="rgba(128, 90, 213, 0.28)"
              />
            )}
          </Text>
          <IconButton
            aria-label="Listen to sentence"
            icon={<FiVolume2 />}
            size="md"
            rounded="xl"
            variant="ghost"
            color={APP_TEXT_PRIMARY}
            isDisabled
            {...getQuestionToolButtonProps()}
          />
        </HStack>
      </Box>

      {/* Binary Choice Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
        <ChoiceCard disabled selected={false}>
          {copy?.soundsWeird || "Sounds weird"}
        </ChoiceCard>
        <ChoiceCard disabled selected={false}>
          {copy?.soundsNatural || "Sounds natural"}
        </ChoiceCard>
      </SimpleGrid>
    </VStack>
  );
}

function DialogueFork({
  question,
  response,
  setResponse,
  locked,
  targetLang,
  supportLang,
  copy,
  onAskAssistant,
  isLoadingAssistantSupport = false,
  assistantSupportText = "",
  assistantLabel = "Assistant",
  onPlayAudio,
  isLoadingAudio = false,
  isPlayingAudio = false,
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");

  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={supportLang}
      dir={supportDirection}
    >
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Dialogue Fork"}
          </Text>
          <QuestionAssistantButton
            label={copy?.askForHelp}
            onAskAssistant={onAskAssistant}
            isLoading={isLoadingAssistantSupport}
            hasResponse={!!assistantSupportText}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Choose the natural response to continue the conversation."}
        </Text>
      </Box>

      {/* Dialogue Line with TTS Button to the left */}
      <HStack
        spacing={3}
        align="center"
        dir={targetDirection}
        lang={targetLang}
        py={1}
      >
        {onPlayAudio && (
          <IconButton
            aria-label={copy?.playAudio || "Play dialogue audio"}
            icon={
              isLoadingAudio ? (
                <Spinner size="xs" color="purple.500" />
              ) : (
                <FiVolume2 />
              )
            }
            size="sm"
            variant="ghost"
            rounded="full"
            color={
              isPlayingAudio
                ? "purple.400"
                : "var(--question-assistant-accent-strong)"
            }
            onClick={() => onPlayAudio(question.line)}
            isDisabled={locked || isLoadingAudio}
            flexShrink={0}
            {...getQuestionToolButtonProps({ active: isLoadingAudio || isPlayingAudio })}
          />
        )}
        <Text
          color={APP_TEXT_PRIMARY}
          fontSize="xl"
          fontWeight="semibold"
        >
          {question.line}
        </Text>
      </HStack>

      {/* Inline Assistant Panel */}
      {(assistantSupportText || isLoadingAssistantSupport) && (
        <Box
          p={4}
          borderRadius="xl"
          style={questionSquircleStyle}
          {...getQuestionAssistantPanelProps()}
        >
          <HStack spacing={2} mb={2} align="center">
            <MdOutlineSupportAgent color={questionAssistantText.accent} />
            <Text
              fontSize="xs"
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="wider"
              color="var(--question-assistant-accent-strong)"
            >
              {assistantLabel}
            </Text>
            {isLoadingAssistantSupport && (
              <VoiceOrb
                state={
                  ["idle", "listening", "speaking"][
                    Math.floor(Math.random() * 3)
                  ]
                }
                size={16}
                centered={false}
              />
            )}
          </HStack>
          {assistantSupportText && (
            <Box
              fontSize="sm"
              color="var(--question-assistant-text)"
              lineHeight="tall"
              sx={questionAssistantMarkdownStyles}
            >
              <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
            </Box>
          )}
        </Box>
      )}

      {/* Choice Cards */}
      <VStack spacing={3} align="stretch" dir={targetDirection} lang={targetLang}>
        {question.options.map((option, index) => (
          <ChoiceCard
            key={`${option}-${index}`}
            selected={response.selectedIndex === index}
            disabled={locked}
            onClick={() => setResponse({ selectedIndex: index })}
          >
            {option}
          </ChoiceCard>
        ))}
      </VStack>

    </VStack>
  );
}

function SentenceShapeshifter({
  question,
  response,
  setResponse,
  locked,
  targetLang,
  supportLang,
  copy,
  onAskAssistant,
  isLoadingAssistantSupport = false,
  assistantSupportText = "",
  assistantLabel = "Assistant",
  onPlayAudio,
  isLoadingAudio = false,
  isPlayingAudio = false,
  onToggleSpeech,
  isSpeechRecording = false,
  isSpeechConnecting = false,
  supportsSpeech = false,
  speechLabels,
  onSubmit,
  canSubmit = false,
  submitting = false,
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && canSubmit && !submitting && !locked) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={supportLang}
      dir={supportDirection}
    >
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Sentence Shapeshifter"}
          </Text>
          <QuestionAssistantButton
            label={copy?.askForHelp}
            onAskAssistant={onAskAssistant}
            isLoading={isLoadingAssistantSupport}
            hasResponse={!!assistantSupportText}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Transform the sentence according to the rule."}
        </Text>
      </Box>

      {/* Source Sentence Card with left-aligned TTS */}
      <Box
        p={4}
        bg={APP_SURFACE_MUTED}
        borderWidth="1px"
        borderColor={APP_BORDER}
        borderRadius="xl"
        style={questionSquircleStyle}
      >
        <HStack
          spacing={3}
          align="center"
          dir={targetDirection}
          lang={targetLang}
        >
          {onPlayAudio && (
            <IconButton
              aria-label={copy?.playAudio || "Play source sentence audio"}
              icon={
                isLoadingAudio ? (
                  <Spinner size="xs" color="purple.500" />
                ) : (
                  <FiVolume2 />
                )
              }
              size="sm"
              variant="ghost"
              rounded="full"
              color={
                isPlayingAudio
                  ? "purple.400"
                  : "var(--question-assistant-accent-strong)"
              }
              onClick={() => onPlayAudio(question.source)}
              isDisabled={
                isLoadingAudio || isSpeechRecording || isSpeechConnecting
              }
              flexShrink={0}
              {...getQuestionToolButtonProps({ active: isLoadingAudio || isPlayingAudio })}
            />
          )}
          <Text
            color={APP_TEXT_PRIMARY}
            fontSize="lg"
            fontWeight="semibold"
          >
            {question.source}
          </Text>
        </HStack>
      </Box>

      {/* Transformation Rule Text */}
      <HStack justify="center" align="center" spacing={2} maxW="100%" px={2}>
        <Text fontSize="md" color={APP_TEXT_SECONDARY} fontWeight="bold" flexShrink={0}>
          ↓
        </Text>
        <Text
          color={APP_TEXT_SECONDARY}
          fontSize="sm"
          fontWeight="medium"
          textAlign="center"
          wordBreak="break-word"
          lineHeight="normal"
        >
          {question.constraint}
        </Text>
      </HStack>

      {/* Inline Assistant Panel */}
      {(assistantSupportText || isLoadingAssistantSupport) && (
        <Box
          p={4}
          borderRadius="xl"
          style={questionSquircleStyle}
          {...getQuestionAssistantPanelProps()}
        >
          <HStack spacing={2} mb={2} align="center">
            <MdOutlineSupportAgent color={questionAssistantText.accent} />
            <Text
              fontSize="xs"
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="wider"
              color="var(--question-assistant-accent-strong)"
            >
              {assistantLabel}
            </Text>
            {isLoadingAssistantSupport && (
              <VoiceOrb
                state={
                  ["idle", "listening", "speaking"][
                    Math.floor(Math.random() * 3)
                  ]
                }
                size={16}
                centered={false}
              />
            )}
          </HStack>
          {assistantSupportText && (
            <Box
              fontSize="sm"
              color="var(--question-assistant-text)"
              lineHeight="tall"
              sx={questionAssistantMarkdownStyles}
            >
              <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
            </Box>
          )}
        </Box>
      )}

      {/* Text Input */}
      <Box lang={targetLang}>
        <HStack align="stretch" spacing={2} dir="ltr">
          <SpeechAnswerButton
            onClick={onToggleSpeech}
            isRecording={isSpeechRecording}
            isConnecting={isSpeechConnecting}
            isSupported={supportsSpeech}
            isDisabled={locked || submitting}
            labels={speechLabels}
          />
          <Input
            value={response.text || ""}
            onChange={(event) => setResponse({ text: event.target.value })}
            onKeyDown={handleKeyDown}
            isDisabled={locked || submitting || isSpeechConnecting || isSpeechRecording}
            placeholder="Write or record your answer"
            dir={targetDirection}
            lang={targetLang}
            size="lg"
            minH="54px"
            bg={APP_SURFACE_ELEVATED}
            borderColor={APP_BORDER_STRONG}
            _hover={{ borderColor: "purple.400" }}
            _focus={{ borderColor: "purple.400", boxShadow: "0 0 0 1px #9f7aea" }}
            style={questionSquircleStyle}
            autoFocus
          />
        </HStack>
      </Box>
    </VStack>
  );
}

function WordNeighborhoods({
  question,
  response,
  setResponse,
  locked,
  wordOrder,
  targetLang,
  supportLang,
  copy,
  onAskAssistant,
  isLoadingAssistantSupport = false,
  assistantSupportText = "",
  assistantLabel = "Assistant",
}) {
  const [selectedWord, setSelectedWord] = useState("");
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");

  const assignments = response.assignments || {};
  const unassigned = wordOrder.filter((word) => assignments[word] === undefined);

  const assign = useCallback(
    (word, groupIndex) => {
      if (!word || locked) return;
      setResponse((current) => ({
        assignments: {
          ...(current.assignments || {}),
          [word]: groupIndex,
        },
      }));
      setSelectedWord((prev) => (prev === word ? "" : prev));
    },
    [locked, setResponse],
  );

  const returnToBank = useCallback(
    (word) => {
      if (!word || locked) return;
      setResponse((current) => {
        const assignmentsNext = { ...(current.assignments || {}) };
        delete assignmentsNext[word];
        return { assignments: assignmentsNext };
      });
      setSelectedWord((prev) => (prev === word ? "" : prev));
    },
    [locked, setResponse],
  );

  const handleDragEnd = useCallback(
    (dragResult) => {
      if (locked || !dragResult?.destination) return;
      const { draggableId, source, destination } = dragResult;
      if (source.droppableId === destination.droppableId) return;

      if (destination.droppableId === "bank") {
        returnToBank(draggableId);
        return;
      }

      if (destination.droppableId.startsWith("group-")) {
        const targetGroupIndex = Number(
          destination.droppableId.replace("group-", ""),
        );
        if (!isNaN(targetGroupIndex)) {
          assign(draggableId, targetGroupIndex);
        }
      }
    },
    [assign, locked, returnToBank],
  );

  return (
    <SortableArea onDragEnd={handleDragEnd}>
      <VStack
        spacing={5}
        align="stretch"
        lang={supportLang}
        dir={supportDirection}
      >
        <Box>
          <HStack spacing={2} mb={1} justify="space-between">
            <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
              {copy?.title || "Word Neighborhoods"}
            </Text>
            <QuestionAssistantButton
              label={copy?.askForHelp}
              onAskAssistant={onAskAssistant}
              isLoading={isLoadingAssistantSupport}
              hasResponse={!!assistantSupportText}
            />
          </HStack>
          <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
            {copy?.instruction || "Sort each word into its matching neighborhood."}
          </Text>
        </Box>

        {/* Inline Assistant Panel */}
        {(assistantSupportText || isLoadingAssistantSupport) && (
          <Box
            p={4}
            borderRadius="xl"
            style={questionSquircleStyle}
            {...getQuestionAssistantPanelProps()}
          >
            <HStack spacing={2} mb={2} align="center">
              <MdOutlineSupportAgent color={questionAssistantText.accent} />
              <Text
                fontSize="xs"
                fontWeight="800"
                textTransform="uppercase"
                letterSpacing="wider"
                color="var(--question-assistant-accent-strong)"
              >
                {assistantLabel}
              </Text>
              {isLoadingAssistantSupport && (
                <VoiceOrb
                  state={
                    ["idle", "listening", "speaking"][
                      Math.floor(Math.random() * 3)
                    ]
                  }
                  size={16}
                  centered={false}
                />
              )}
            </HStack>
            {assistantSupportText && (
              <Box
                fontSize="sm"
                color="var(--question-assistant-text)"
                lineHeight="tall"
                sx={questionAssistantMarkdownStyles}
              >
                <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
              </Box>
            )}
          </Box>
        )}

        {/* Word Bank */}
        <Box
          minH="86px"
          p={4}
          borderWidth="1.5px"
          borderStyle="dashed"
          borderColor={selectedWord ? "purple.400" : APP_BORDER_STRONG}
          bg={APP_SURFACE_MUTED}
          borderRadius="xl"
          style={questionSquircleStyle}
          transition="border-color 0.2s ease"
        >
          <SortableList
            id="bank"
            items={unassigned}
            flexWrap="wrap"
            gap={2.5}
            minH="42px"
            dir={targetDirection}
            lang={targetLang}
          >
            {unassigned.map((word) => {
              const isSelected = selectedWord === word;
              return (
                <SortableItem key={word} id={word} disabled={locked}>
                  {({ setNodeRef, attributes, listeners, style, isDragging }) => (
                    <Box
                      ref={setNodeRef}
                      style={{
                        ...style,
                        ...questionSquircleStyle,
                        cursor: locked ? "default" : isDragging ? "grabbing" : "grab",
                        userSelect: "none",
                      }}
                      {...attributes}
                      {...listeners}
                      px={3.5}
                      py={2}
                      borderRadius="lg"
                      fontSize="md"
                      fontWeight="semibold"
                      borderWidth="1.5px"
                      borderColor={isSelected ? "purple.400" : APP_BORDER}
                      bg={isSelected ? "purple.500" : APP_SURFACE_ELEVATED}
                      color={isSelected ? "white" : APP_TEXT_PRIMARY}
                      boxShadow={
                        isDragging
                          ? "0 8px 20px rgba(128,90,213,0.35)"
                          : isSelected
                            ? "0 0 0 2px rgba(159, 122, 234, 0.4)"
                            : "sm"
                      }
                      transition="border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease"
                      _hover={
                        !locked && !isSelected
                          ? {
                              borderColor: "purple.300",
                              transform: "translateY(-1px)",
                            }
                          : {}
                      }
                      onClick={() => setSelectedWord(isSelected ? "" : word)}
                    >
                      {word}
                    </Box>
                  )}
                </SortableItem>
              );
            })}
          </SortableList>
        </Box>

        {/* Group Buckets */}
        <SimpleGrid columns={{ base: 1, sm: question.groups?.length || 2 }} spacing={3.5}>
          {(question.groups || []).map((group, groupIndex) => {
            const members = wordOrder.filter(
              (word) => Number(assignments[word]) === groupIndex,
            );
            const isTargetGroup = !!selectedWord;
            return (
              <Box
                key={group.label}
                textAlign="left"
                minH="150px"
                p={4}
                borderWidth="2px"
                borderColor={isTargetGroup ? "purple.400" : APP_BORDER}
                bg={APP_SURFACE_ELEVATED}
                borderRadius="xl"
                style={questionSquircleStyle}
                transition="all 0.2s ease"
                boxShadow={isTargetGroup ? "0 0 12px rgba(128, 90, 213, 0.15)" : "none"}
                _hover={
                  isTargetGroup && !locked
                    ? {
                        borderColor: "purple.300",
                        transform: "translateY(-2px)",
                        boxShadow: "0 0 16px rgba(128, 90, 213, 0.25)",
                        cursor: "pointer",
                      }
                    : {}
                }
                onClick={() => {
                  if (selectedWord && !locked) {
                    assign(selectedWord, groupIndex);
                  }
                }}
              >
                <Text fontWeight="800" fontSize="md" color={APP_TEXT_PRIMARY} mb={3}>
                  {group.label}
                </Text>
                <SortableList
                  id={`group-${groupIndex}`}
                  items={members}
                  flexWrap="wrap"
                  gap={2}
                  minH="50px"
                  dir={targetDirection}
                  lang={targetLang}
                >
                  {members.map((word) => (
                    <SortableItem key={word} id={word} disabled={locked}>
                      {({ setNodeRef, attributes, listeners, style, isDragging }) => (
                        <Box
                          ref={setNodeRef}
                          style={{
                            ...style,
                            ...questionSquircleStyle,
                            cursor: locked ? "default" : isDragging ? "grabbing" : "grab",
                            userSelect: "none",
                          }}
                          {...attributes}
                          {...listeners}
                          px={3}
                          py={1.5}
                          borderRadius="lg"
                          fontSize="sm"
                          fontWeight="semibold"
                          bg={APP_SURFACE_MUTED}
                          borderWidth="1px"
                          borderColor={APP_BORDER_STRONG}
                          color={APP_TEXT_PRIMARY}
                          title={copy?.tapToReturn}
                          boxShadow={isDragging ? "0 6px 16px rgba(128,90,213,0.3)" : "none"}
                          _hover={
                            !locked
                              ? {
                                  borderColor: "purple.300",
                                  color: APP_TEXT_PRIMARY,
                                  bg: "var(--question-chip-bg-hover)",
                                  transform: "translateY(-1px)",
                                }
                              : {}
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            returnToBank(word);
                          }}
                        >
                          {word}
                        </Box>
                      )}
                    </SortableItem>
                  ))}
                  {!members.length && (
                    <Text
                      fontSize="xs"
                      color={APP_TEXT_SECONDARY}
                      fontStyle="italic"
                      py={2}
                    >
                      {selectedWord
                        ? formatWordNeighborhoodsCopy(copy?.tapToPlace, {
                            word: selectedWord,
                          }) || `Tap to place “${selectedWord}”`
                        : copy?.dropPlaceholder ||
                          "Drag a word here or tap to place"}
                    </Text>
                  )}
                </SortableList>
              </Box>
            );
          })}
        </SimpleGrid>
      </VStack>
    </SortableArea>
  );
}

function MorphologyForge({
  question,
  response,
  setResponse,
  locked,
  targetLang,
  supportLang,
  copy,
  onAskAssistant,
  isLoadingAssistantSupport = false,
  assistantSupportText = "",
  assistantLabel = "Assistant",
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");

  const chosenIndices = response.pieceIndices || [];
  const pieces = question.pieces || [];

  // Available pieces that haven't been chosen yet
  const available = pieces
    .map((piece, index) => ({ piece, index }))
    .filter(({ index }) => !chosenIndices.includes(index));

  // The live forged word assembled from chosen pieces in order
  const forgedWord = chosenIndices
    .map((idx) => pieces[idx])
    .filter(Boolean)
    .join("");

  const addPiece = useCallback(
    (index) => {
      if (locked || chosenIndices.includes(index)) return;
      setResponse((current) => ({
        pieceIndices: [...(current.pieceIndices || []), index],
      }));
    },
    [chosenIndices, locked, setResponse],
  );

  const removePiece = useCallback(
    (position) => {
      if (locked) return;
      setResponse((current) => ({
        pieceIndices: (current.pieceIndices || []).filter(
          (_, idx) => idx !== position,
        ),
      }));
    },
    [locked, setResponse],
  );

  const handleDragEnd = useCallback(
    (dragResult) => {
      if (locked || !dragResult?.destination) return;
      const { draggableId, source, destination } = dragResult;
      if (source.droppableId === destination.droppableId) return;

      const match = draggableId.match(/piece-(\d+)/);
      if (!match) return;
      const pieceIndex = Number(match[1]);

      if (destination.droppableId === "forge") {
        if (!chosenIndices.includes(pieceIndex)) {
          addPiece(pieceIndex);
        }
      } else if (destination.droppableId === "bank") {
        const pos = chosenIndices.indexOf(pieceIndex);
        if (pos !== -1) {
          removePiece(pos);
        }
      }
    },
    [addPiece, chosenIndices, locked, removePiece],
  );

  // Split sentence at "___"
  const sentenceParts = (question.sentence || "").split("___");
  const beforeBlank = sentenceParts[0] || "";
  const afterBlank = sentenceParts.slice(1).join("___");

  return (
    <SortableArea onDragEnd={handleDragEnd}>
      <VStack
        spacing={5}
        align="stretch"
        lang={supportLang}
        dir={supportDirection}
      >
        {/* Header */}
        <Box>
          <HStack spacing={2} mb={1} justify="space-between">
            <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
              {copy?.title || "Morphology Forge"}
            </Text>
            <QuestionAssistantButton
              label={copy?.askForHelp}
              onAskAssistant={onAskAssistant}
              isLoading={isLoadingAssistantSupport}
              hasResponse={!!assistantSupportText}
            />
          </HStack>
          <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
            {copy?.instruction || "Build the missing word piece by piece."}
          </Text>
        </Box>

        {/* Inline Assistant Panel */}
        {(assistantSupportText || isLoadingAssistantSupport) && (
          <Box
            p={4}
            borderRadius="xl"
            style={questionSquircleStyle}
            {...getQuestionAssistantPanelProps()}
          >
            <HStack spacing={2} mb={2} align="center">
              <MdOutlineSupportAgent color={questionAssistantText.accent} />
              <Text
                fontSize="xs"
                fontWeight="800"
                textTransform="uppercase"
                letterSpacing="wider"
                color="var(--question-assistant-accent-strong)"
              >
                {assistantLabel}
              </Text>
              {isLoadingAssistantSupport && (
                <VoiceOrb
                  state={
                    ["idle", "listening", "speaking"][
                      Math.floor(Math.random() * 3)
                    ]
                  }
                  size={16}
                  centered={false}
                />
              )}
            </HStack>
            {assistantSupportText && (
              <Box
                fontSize="sm"
                color="var(--question-assistant-text)"
                lineHeight="tall"
                sx={questionAssistantMarkdownStyles}
              >
                <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
              </Box>
            )}
          </Box>
        )}

        {/* Context Sentence Card */}
        <Box
          p={5}
          borderWidth="1.5px"
          borderColor={APP_BORDER}
          bg={APP_SURFACE_ELEVATED}
          borderRadius="xl"
          style={questionSquircleStyle}
          textAlign="center"
          dir={targetDirection}
          lang={targetLang}
        >
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="semibold"
            color={APP_TEXT_PRIMARY}
            lineHeight="tall"
          >
            {beforeBlank}
            <Box
              as="span"
              display="inline-block"
              minW="70px"
              px={2.5}
              py={0.5}
              mx={1.5}
              borderBottomWidth="2.5px"
              borderBottomColor={forgedWord ? "purple.400" : "purple.300"}
              color={forgedWord ? "purple.600" : APP_TEXT_MUTED}
              fontWeight="bold"
              bg={forgedWord ? "rgba(128, 90, 213, 0.08)" : "transparent"}
              borderRadius="md"
              transition="all 0.2s ease"
            >
              {forgedWord || "___"}
            </Box>
            {afterBlank}
          </Text>
        </Box>

        {/* Forge Slot / Assembled Word Box */}
        <Box
          minH="88px"
          p={4}
          borderWidth="2px"
          borderStyle="dashed"
          borderColor={chosenIndices.length ? "purple.400" : APP_BORDER_STRONG}
          bg={APP_SURFACE_MUTED}
          borderRadius="xl"
          style={questionSquircleStyle}
          transition="all 0.2s ease"
          boxShadow={chosenIndices.length ? "0 0 12px rgba(128, 90, 213, 0.12)" : "none"}
        >
          <SortableList
            id="forge"
            items={chosenIndices.map((idx) => `piece-${idx}`)}
            flexWrap="wrap"
            justify="center"
            align="center"
            gap={2}
            minH="48px"
            dir={targetDirection}
            lang={targetLang}
          >
            {chosenIndices.map((pieceIndex, position) => {
              const piece = pieces[pieceIndex];
              return (
                <SortableItem
                  key={`chosen-${pieceIndex}-${position}`}
                  id={`piece-${pieceIndex}`}
                  disabled={locked}
                >
                  {({ setNodeRef, attributes, listeners, style, isDragging }) => (
                    <Box
                      ref={setNodeRef}
                      style={{
                        ...style,
                        ...questionSquircleStyle,
                        cursor: locked ? "default" : isDragging ? "grabbing" : "grab",
                        userSelect: "none",
                      }}
                      {...attributes}
                      {...listeners}
                      px={3.5}
                      py={2}
                      borderRadius="lg"
                      fontSize="md"
                      fontWeight="bold"
                      bg="purple.500"
                      color="white"
                      borderWidth="1.5px"
                      borderColor="purple.400"
                      boxShadow={
                        isDragging
                          ? "0 8px 20px rgba(128,90,213,0.35)"
                          : "0 2px 8px rgba(128,90,213,0.2)"
                      }
                      title={copy?.tapToRemove}
                      _hover={
                        !locked
                          ? {
                              bg: "purple.600",
                              transform: "translateY(-1px)",
                            }
                          : {}
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        removePiece(position);
                      }}
                    >
                      {piece} ✕
                    </Box>
                  )}
                </SortableItem>
              );
            })}
            {!chosenIndices.length && (
              <Text
                fontSize="xs"
                color={APP_TEXT_SECONDARY}
                fontStyle="italic"
                py={2}
              >
                {copy?.emptyForge || "Drag or tap pieces below to forge the missing word"}
              </Text>
            )}
          </SortableList>
        </Box>

        {/* Available Pieces Bank */}
        <Box
          p={4}
          borderWidth="1.5px"
          borderColor={APP_BORDER}
          bg={APP_SURFACE_ELEVATED}
          borderRadius="xl"
          style={questionSquircleStyle}
        >
          <SortableList
            id="bank"
            items={available.map(({ index }) => `piece-${index}`)}
            flexWrap="wrap"
            justify="center"
            gap={2.5}
            minH="42px"
            dir={targetDirection}
            lang={targetLang}
          >
            {available.map(({ piece, index }) => (
              <SortableItem
                key={`avail-${index}`}
                id={`piece-${index}`}
                disabled={locked}
              >
                {({ setNodeRef, attributes, listeners, style, isDragging }) => (
                  <Box
                    ref={setNodeRef}
                    style={{
                      ...style,
                      ...questionSquircleStyle,
                      cursor: locked ? "default" : isDragging ? "grabbing" : "grab",
                      userSelect: "none",
                    }}
                    {...attributes}
                    {...listeners}
                    px={3.5}
                    py={2}
                    borderRadius="lg"
                    fontSize="md"
                    fontWeight="semibold"
                    borderWidth="1.5px"
                    borderColor={APP_BORDER}
                    bg={APP_SURFACE_MUTED}
                    color={APP_TEXT_PRIMARY}
                    boxShadow={
                      isDragging
                        ? "0 8px 20px rgba(128,90,213,0.35)"
                        : "sm"
                    }
                    transition="border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease"
                    _hover={
                      !locked
                        ? {
                            borderColor: "purple.300",
                            transform: "translateY(-1px)",
                            bg: "rgba(128, 90, 213, 0.08)",
                          }
                        : {}
                    }
                    onClick={() => addPiece(index)}
                  >
                    {piece}
                  </Box>
                )}
              </SortableItem>
            ))}
            {!available.length && (
              <Text
                fontSize="xs"
                color={APP_TEXT_SECONDARY}
                fontStyle="italic"
                py={2}
              >
                {copy?.allPiecesUsed || "All pieces placed."}
              </Text>
            )}
          </SortableList>
        </Box>
      </VStack>
    </SortableArea>
  );
}

function ThreeClueMystery({
  question,
  response,
  setResponse,
  locked,
  revealedClues = 1,
  setRevealedClues,
  targetLang,
  supportLang,
  copy,
  onAskAssistant,
  isLoadingAssistantSupport = false,
  assistantSupportText = "",
  assistantLabel = "Assistant",
  onToggleSpeech,
  isSpeechRecording = false,
  isSpeechConnecting = false,
  supportsSpeech = false,
  speechLabels,
  onSubmit,
  canSubmit = false,
  submitting = false,
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");

  const clues = question.clues || [];
  const activeClueCount = Math.min(Math.max(1, revealedClues), clues.length);
  const visibleClues = clues.slice(0, activeClueCount);
  const potentialXp = Math.max(4, 10 - (activeClueCount - 1) * 3);
  const hasMoreClues = activeClueCount < clues.length;

  const handleRevealNextClue = useCallback(() => {
    if (locked || !hasMoreClues || !setRevealedClues) return;
    setRevealedClues((count) => Math.min(clues.length, count + 1));
  }, [clues.length, hasMoreClues, locked, setRevealedClues]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !locked && canSubmit && !submitting && onSubmit) {
        event.preventDefault();
        onSubmit();
      }
    },
    [canSubmit, locked, onSubmit, submitting],
  );

  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={supportLang}
      dir={supportDirection}
    >
      {/* Header */}
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Three-Clue Mystery"}
          </Text>
          <QuestionAssistantButton
            label={copy?.askForHelp}
            onAskAssistant={onAskAssistant}
            isLoading={isLoadingAssistantSupport}
            hasResponse={!!assistantSupportText}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Deduce the mystery word using as few clues as possible."}
        </Text>
      </Box>

      {/* Inline Assistant Panel */}
      {(assistantSupportText || isLoadingAssistantSupport) && (
        <Box
          p={4}
          borderRadius="xl"
          style={questionSquircleStyle}
          {...getQuestionAssistantPanelProps()}
        >
          <HStack spacing={2} mb={2} align="center">
            <MdOutlineSupportAgent color={questionAssistantText.accent} />
            <Text
              fontSize="xs"
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="wider"
              color="var(--question-assistant-accent-strong)"
            >
              {assistantLabel}
            </Text>
            {isLoadingAssistantSupport && (
              <VoiceOrb
                state={
                  ["idle", "listening", "speaking"][
                    Math.floor(Math.random() * 3)
                  ]
                }
                size={16}
                centered={false}
              />
            )}
          </HStack>
          {assistantSupportText && (
            <Box
              fontSize="sm"
              color="var(--question-assistant-text)"
              lineHeight="tall"
              sx={questionAssistantMarkdownStyles}
            >
              <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
            </Box>
          )}
        </Box>
      )}

      {/* Progressive Clue Cards */}
      <VStack spacing={3} align="stretch">
        {visibleClues.map((clue, index) => {
          const isLatest = index === activeClueCount - 1;
          const badgeText = formatThreeClueMysteryCopy(copy?.clueBadge || "Clue {index}", {
            index: index + 1,
          });
          return (
            <Box
              key={`clue-${index}`}
              p={4}
              borderWidth="1.5px"
              borderColor={isLatest ? "purple.400" : APP_BORDER}
              bg={isLatest ? APP_SURFACE_ELEVATED : APP_SURFACE_MUTED}
              borderRadius="xl"
              style={questionSquircleStyle}
              boxShadow={isLatest ? "0 2px 10px rgba(128, 90, 213, 0.12)" : "none"}
              transition="all 0.2s ease"
            >
              <HStack spacing={3} align="flex-start">
                <Badge
                  colorScheme={isLatest ? "purple" : "gray"}
                  variant={isLatest ? "solid" : "subtle"}
                  borderRadius="full"
                  px={2.5}
                  py={0.5}
                  fontSize="xs"
                  fontWeight="bold"
                  textTransform="none"
                  flexShrink={0}
                >
                  {badgeText}
                </Badge>
                <Text
                  fontSize={{ base: "sm", md: "md" }}
                  color={APP_TEXT_PRIMARY}
                  fontWeight={isLatest ? "medium" : "normal"}
                  lineHeight="tall"
                >
                  {clue}
                </Text>
              </HStack>
            </Box>
          );
        })}
      </VStack>

      {/* Clue Control Row: Live XP Badge & Reveal Action */}
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={2} px={1}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="purple.500"
          bg="rgba(128, 90, 213, 0.08)"
          px={3}
          py={1}
          borderRadius="full"
        >
          {formatThreeClueMysteryCopy(copy?.potentialXp || "+{xp} XP", {
            xp: potentialXp,
          })}
        </Text>
        {hasMoreClues && !locked && (
          <Button
            size="sm"
            variant="ghost"
            colorScheme="purple"
            onClick={handleRevealNextClue}
            style={questionSquircleStyle}
          >
            {copy?.revealNext || "Reveal next clue"}
          </Button>
        )}
      </HStack>

      {/* Target Word Input Field */}
      <Box>
        <HStack align="stretch" spacing={2} dir="ltr" lang={targetLang}>
          <SpeechAnswerButton
            onClick={onToggleSpeech}
            isRecording={isSpeechRecording}
            isConnecting={isSpeechConnecting}
            isSupported={supportsSpeech}
            isDisabled={locked || submitting}
            labels={speechLabels}
          />
          <Input
            value={response?.text || ""}
            onChange={(event) =>
              setResponse((current) => ({
                ...current,
                text: event.target.value,
              }))
            }
            onKeyDown={handleKeyDown}
            isDisabled={locked || submitting || isSpeechConnecting || isSpeechRecording}
            placeholder="Write or record your answer"
            dir={targetDirection}
            lang={targetLang}
            size="lg"
            minH="54px"
            fontSize={{ base: "md", md: "lg" }}
            fontWeight="semibold"
            bg={APP_SURFACE_ELEVATED}
            borderColor={APP_BORDER_STRONG}
            focusBorderColor="purple.400"
            style={questionSquircleStyle}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </HStack>
      </Box>
    </VStack>
  );
}

function ListenDifference({
  question,
  response,
  setResponse,
  locked,
  targetLang,
  supportLang,
  copy,
  onAskAssistant,
  isLoadingAssistantSupport = false,
  assistantSupportText = "",
  assistantLabel = "Assistant",
  onPlayAudio,
  isLoadingAudio = false,
  isPlayingAudio = false,
  onSubmit,
  canSubmit = false,
  submitting = false,
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !locked && canSubmit && !submitting && onSubmit) {
        event.preventDefault();
        onSubmit();
      }
    },
    [canSubmit, locked, onSubmit, submitting],
  );

  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={supportLang}
      dir={supportDirection}
      onKeyDown={handleKeyDown}
    >
      {/* Minimalist Question Header */}
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Listen for the Difference"}
          </Text>
          <QuestionAssistantButton
            label={copy?.askForHelp}
            onAskAssistant={onAskAssistant}
            isLoading={isLoadingAssistantSupport}
            hasResponse={!!assistantSupportText}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Listen carefully. Which sentence did you hear?"}
        </Text>
      </Box>

      {/* Inline Assistant Panel */}
      {(assistantSupportText || isLoadingAssistantSupport) && (
        <Box
          p={4}
          borderRadius="xl"
          style={questionSquircleStyle}
          {...getQuestionAssistantPanelProps()}
        >
          <HStack spacing={2} mb={2} align="center">
            <MdOutlineSupportAgent color={questionAssistantText.accent} />
            <Text
              fontSize="xs"
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="wider"
              color="var(--question-assistant-accent-strong)"
            >
              {assistantLabel}
            </Text>
            {isLoadingAssistantSupport && (
              <VoiceOrb
                state={
                  ["idle", "listening", "speaking"][
                    Math.floor(Math.random() * 3)
                  ]
                }
                size={16}
                centered={false}
              />
            )}
          </HStack>
          {assistantSupportText && (
            <Box
              fontSize="sm"
              color="var(--question-assistant-text)"
              lineHeight="tall"
              sx={questionAssistantMarkdownStyles}
            >
              <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
            </Box>
          )}
        </Box>
      )}

      {/* Prominent Play Audio Button */}
      <Button
        leftIcon={
          isLoadingAudio ? (
            <Spinner size="sm" color="purple.500" />
          ) : (
            <FiVolume2 size={22} />
          )
        }
        size="lg"
        py={7}
        onClick={() => onPlayAudio?.(question.audioText)}
        isDisabled={isLoadingAudio}
        {...getQuestionToolButtonProps({ active: isLoadingAudio || isPlayingAudio })}
        style={questionSquircleStyle}
        fontSize="md"
        fontWeight="semibold"
        boxShadow="0 2px 12px rgba(128, 90, 213, 0.15)"
      >
        {isLoadingAudio
          ? (copy?.playingAudio || "Playing…")
          : isPlayingAudio
            ? (copy?.playingAudio || "Playing…")
            : (copy?.playAudio || "Play audio")}
      </Button>

      {/* Options List */}
      <VStack spacing={3} align="stretch" dir={targetDirection} lang={targetLang}>
        {(question.options || []).map((option, index) => (
          <ChoiceCard
            key={`${option}-${index}`}
            selected={response?.selectedIndex === index}
            disabled={locked}
            onClick={() => setResponse({ selectedIndex: index })}
          >
            {option}
          </ChoiceCard>
        ))}
      </VStack>
    </VStack>
  );
}

function ThreeWordChallenge({
  question,
  response,
  setResponse,
  locked,
  targetLang,
  supportLang,
  copy,
  onAskAssistant,
  isLoadingAssistantSupport = false,
  assistantSupportText = "",
  assistantLabel = "Assistant",
  onToggleSpeech,
  isSpeechRecording = false,
  isSpeechConnecting = false,
  supportsSpeech = false,
  speechLabels,
  onSubmit,
  canSubmit = false,
  submitting = false,
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !locked && canSubmit && !submitting && onSubmit) {
        event.preventDefault();
        onSubmit();
      }
    },
    [canSubmit, locked, onSubmit, submitting],
  );

  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={supportLang}
      dir={supportDirection}
      onKeyDown={handleKeyDown}
    >
      {/* Minimalist Question Header */}
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Three-Word Challenge"}
          </Text>
          <QuestionAssistantButton
            label={copy?.askForHelp}
            onAskAssistant={onAskAssistant}
            isLoading={isLoadingAssistantSupport}
            hasResponse={!!assistantSupportText}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Create an original sentence using all three words."}
        </Text>
      </Box>

      {/* Inline Assistant Panel */}
      {(assistantSupportText || isLoadingAssistantSupport) && (
        <Box
          p={4}
          borderRadius="xl"
          style={questionSquircleStyle}
          {...getQuestionAssistantPanelProps()}
        >
          <HStack spacing={2} mb={2} align="center">
            <MdOutlineSupportAgent color={questionAssistantText.accent} />
            <Text
              fontSize="xs"
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="wider"
              color="var(--question-assistant-accent-strong)"
            >
              {assistantLabel}
            </Text>
            {isLoadingAssistantSupport && (
              <VoiceOrb
                state={
                  ["idle", "listening", "speaking"][
                    Math.floor(Math.random() * 3)
                  ]
                }
                size={16}
                centered={false}
              />
            )}
          </HStack>
          {assistantSupportText && (
            <Box
              fontSize="sm"
              color="var(--question-assistant-text)"
              lineHeight="tall"
              sx={questionAssistantMarkdownStyles}
            >
              <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
            </Box>
          )}
        </Box>
      )}

      {/* 3 Cue Chips */}
      <HStack
        spacing={3}
        justify="center"
        flexWrap="wrap"
        py={2}
        dir={targetDirection}
        lang={targetLang}
      >
        {(question.cues || []).map((cue, index) => (
          <Box
            key={`${cue}-${index}`}
            px={4}
            py={2.5}
            borderRadius="xl"
            borderWidth="1.5px"
            borderColor="purple.300"
            bg="rgba(128, 90, 213, 0.12)"
            color={APP_TEXT_PRIMARY}
            style={questionSquircleStyle}
            boxShadow="0 2px 8px rgba(128, 90, 213, 0.1)"
          >
            <Text
              as="span"
              fontWeight="800"
              fontSize={{ base: "md", md: "lg" }}
            >
              {cue}
            </Text>
          </Box>
        ))}
      </HStack>

      {/* Target Language Input Field */}
      <Box>
        <HStack align="stretch" spacing={2} dir="ltr" lang={targetLang}>
          <SpeechAnswerButton
            onClick={onToggleSpeech}
            isRecording={isSpeechRecording}
            isConnecting={isSpeechConnecting}
            isSupported={supportsSpeech}
            isDisabled={locked || submitting}
            labels={speechLabels}
          />
          <Input
            value={response?.text || ""}
            onChange={(event) =>
              setResponse((current) => ({
                ...current,
                text: event.target.value,
              }))
            }
            isDisabled={locked || submitting || isSpeechConnecting || isSpeechRecording}
            placeholder="Write or record your answer"
            dir={targetDirection}
            lang={targetLang}
            size="lg"
            minH="54px"
            fontSize={{ base: "md", md: "lg" }}
            fontWeight="semibold"
            bg={APP_SURFACE_ELEVATED}
            borderColor={APP_BORDER_STRONG}
            focusBorderColor="purple.400"
            style={questionSquircleStyle}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </HStack>
      </Box>
    </VStack>
  );
}

function NaturalOrWeird({
  question,
  response,
  setResponse,
  locked,
  targetLang,
  supportLang,
  copy,
  onAskAssistant,
  isLoadingAssistantSupport = false,
  assistantSupportText = "",
  assistantLabel = "Assistant",
  onPlayAudio,
  isLoadingAudio = false,
  isPlayingAudio = false,
  onSubmit,
  canSubmit = false,
  submitting = false,
}) {
  const targetDirection = getLanguageDirection(targetLang, "ltr");
  const supportDirection = getLanguageDirection(supportLang, "ltr");

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !locked && canSubmit && !submitting && onSubmit) {
        event.preventDefault();
        onSubmit();
      }
    },
    [canSubmit, locked, onSubmit, submitting],
  );

  return (
    <VStack
      spacing={5}
      align="stretch"
      lang={supportLang}
      dir={supportDirection}
      onKeyDown={handleKeyDown}
    >
      {/* Minimalist Question Header */}
      <Box>
        <HStack spacing={2} mb={1} justify="space-between">
          <Text fontSize="xl" fontWeight="800" color={APP_TEXT_PRIMARY}>
            {copy?.title || "Natural or Weird?"}
          </Text>
          <QuestionAssistantButton
            label={copy?.askForHelp}
            onAskAssistant={onAskAssistant}
            isLoading={isLoadingAssistantSupport}
            hasResponse={!!assistantSupportText}
          />
        </HStack>
        <Text fontSize="sm" color={APP_TEXT_SECONDARY} fontWeight="normal">
          {copy?.instruction || "Decide if this sentence sounds natural in everyday use."}
        </Text>
      </Box>

      {/* Inline Assistant Panel */}
      {(assistantSupportText || isLoadingAssistantSupport) && (
        <Box
          p={4}
          borderRadius="xl"
          style={questionSquircleStyle}
          {...getQuestionAssistantPanelProps()}
        >
          <HStack spacing={2} mb={2} align="center">
            <MdOutlineSupportAgent color={questionAssistantText.accent} />
            <Text
              fontSize="xs"
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="wider"
              color="var(--question-assistant-accent-strong)"
            >
              {assistantLabel}
            </Text>
            {isLoadingAssistantSupport && (
              <VoiceOrb
                state={
                  ["idle", "listening", "speaking"][
                    Math.floor(Math.random() * 3)
                  ]
                }
                size={16}
                centered={false}
              />
            )}
          </HStack>
          {assistantSupportText && (
            <Box
              fontSize="sm"
              color="var(--question-assistant-text)"
              lineHeight="tall"
              sx={questionAssistantMarkdownStyles}
            >
              <ReactMarkdown>{assistantSupportText}</ReactMarkdown>
            </Box>
          )}
        </Box>
      )}

      {/* Sentence Presentation Card with Audio Button */}
      <Box
        p={{ base: 5, md: 6 }}
        bg={APP_SURFACE_MUTED}
        borderWidth="1px"
        borderColor={APP_BORDER}
        borderRadius="2xl"
        style={questionSquircleStyle}
      >
        <HStack justify="space-between" align="center" spacing={3}>
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="bold"
            color={APP_TEXT_PRIMARY}
            textAlign="left"
            dir={targetDirection}
            lang={targetLang}
            flex="1"
          >
            “{question.sentence}”
          </Text>
          {onPlayAudio && (
            <IconButton
              aria-label={copy?.playAudio || "Listen to sentence"}
              icon={
                isLoadingAudio ? (
                  <Spinner size="xs" color="purple.500" />
                ) : (
                  <FiVolume2 />
                )
              }
              size="md"
              rounded="xl"
              variant="ghost"
              color={isPlayingAudio ? "purple.400" : APP_TEXT_PRIMARY}
              onClick={() => onPlayAudio(question.sentence)}
              isDisabled={locked || isLoadingAudio}
              {...getQuestionToolButtonProps({ active: isLoadingAudio || isPlayingAudio })}
            />
          )}
        </HStack>
      </Box>

      {/* Binary Choice Cards (Weird vs. Natural) */}
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
        <ChoiceCard
          selected={response?.choice === false}
          disabled={locked}
          onClick={() => setResponse({ choice: false })}
        >
          {copy?.soundsWeird || "Sounds weird"}
        </ChoiceCard>
        <ChoiceCard
          selected={response?.choice === true}
          disabled={locked}
          onClick={() => setResponse({ choice: true })}
        >
          {copy?.soundsNatural || "Sounds natural"}
        </ChoiceCard>
      </SimpleGrid>
    </VStack>
  );
}



function extractDelightMemoryItem(question, response) {
  if (!question) return { concept: "", userAnswer: "", expectedAnswer: "" };
  switch (question.variant) {
    case "sentence_detective": {
      const selectedWord =
        response?.tokenIndex != null
          ? question.tokens?.[response.tokenIndex] || ""
          : "";
      return {
        concept: question.sentence || question.wrongToken || question.answer || "",
        userAnswer: selectedWord
          ? `${selectedWord} → ${response?.replacement || ""}`
          : response?.replacement || "",
        expectedAnswer: `${question.wrongToken || question.tokens?.[question.incorrectIndex] || ""} → ${question.answer || ""}`,
      };
    }
    case "dialogue_fork": {
      const selected =
        response?.selectedIndex != null
          ? question.options?.[response.selectedIndex] || ""
          : "";
      return {
        concept: question.prompt || question.targetRole || "",
        userAnswer: selected,
        expectedAnswer: question.options?.[question.correctIndex] || "",
      };
    }
    case "sentence_shapeshifter": {
      return {
        concept: `${question.source || ""} (${question.constraint || ""})`.trim(),
        userAnswer: response?.text || "",
        expectedAnswer: question.answer || "",
      };
    }
    case "word_neighborhoods": {
      const summary = (question.groups || [])
        .map((g) => `${g.label}: ${(g.items || []).join(", ")}`)
        .join(" | ");
      return {
        concept: summary,
        userAnswer: JSON.stringify(response?.assignments || {}),
        expectedAnswer: summary,
      };
    }
    case "morphology_forge": {
      return {
        concept: question.sentence || question.root || question.answer || "",
        userAnswer: (response?.assembled || []).join(""),
        expectedAnswer: question.answer || "",
      };
    }
    case "three_clue_mystery": {
      return {
        concept: (question.clues || []).join(" • "),
        userAnswer: response?.guess || "",
        expectedAnswer: question.answer || "",
      };
    }
    case "listen_difference": {
      const selectedPair =
        response?.selectedIndex != null
          ? question.pairs?.[response.selectedIndex]?.wordA || ""
          : "";
      const correctPair =
        question.pairs?.find((p) => p.isCorrect)?.wordA || question.answer || "";
      return {
        concept: question.sentence || "Listening discrimination",
        userAnswer: selectedPair,
        expectedAnswer: correctPair,
      };
    }
    case "three_word_challenge": {
      return {
        concept: (question.cues || []).join(", "),
        userAnswer: response?.text || "",
        expectedAnswer: (question.cues || []).join(", "),
      };
    }
    case "natural_or_weird": {
      return {
        concept: question.sentence || "",
        userAnswer: response?.choice ? "Sounds natural" : "Sounds weird",
        expectedAnswer: question.isNatural ? "Sounds natural" : "Sounds weird",
      };
    }
    default: {
      return {
        concept: question.sentence || question.prompt || question.instruction || "",
        userAnswer: String(response?.text || response?.replacement || response?.guess || ""),
        expectedAnswer: String(question.answer || ""),
      };
    }
  }
}

function getDelightQuestionVarietySummary(question) {
  if (!question) return "";
  const content =
    question.correctedSentence ||
    question.sentence ||
    question.line ||
    question.source ||
    question.audioText ||
    question.example ||
    question.answerWord ||
    question.answer ||
    (question.cues || []).join(" / ") ||
    (question.groups || [])
      .map((group) => `${group.label}: ${(group.items || []).join(", ")}`)
      .join(" / ");

  return `${question.variant || "question"}: ${String(content || "")}`.slice(
    0,
    280,
  );
}

export default function DelightQuestionLab({
  moduleType = "grammar",
  userLanguage = "en",
  targetLang: propTargetLang,
  supportLang: propSupportLang,
  lesson = null,
  lessonContent = null,
  isFinalQuiz = false,
  quizConfig = { questionsRequired: 10, passingScore: 8 },
  onSkip = null,
  onExitQuiz = null,
  lessonEarnedXp = 0,
  embedded = false,
  variantId = null,
  onNextQuestion = null,
  onQuizAnswer = null,
}) {
  const user = useUserStore((state) => state.user);
  const playSound = useSoundSettings((state) => state.playSound);
  const progress = user?.progress || {};
  const targetLang = normalizePracticeLanguage(
    propTargetLang ||
      lesson?.targetLang ||
      lessonContent?.targetLang ||
      progress.targetLang,
    DEFAULT_TARGET_LANGUAGE,
  );
  const supportLang = normalizeSupportLanguage(
    propSupportLang ||
      (progress.supportLang === "bilingual"
        ? userLanguage
        : progress.supportLang || userLanguage),
    DEFAULT_SUPPORT_LANGUAGE,
  );
  const t = useT(supportLang);
  const detectiveCopy = getSentenceDetectiveCopy(supportLang);
  const dialogueForkCopy = getDialogueForkCopy(supportLang);
  const sentenceShapeshifterCopy = getSentenceShapeshifterCopy(supportLang);
  const wordNeighborhoodsCopy = getWordNeighborhoodsCopy(supportLang);
  const morphologyForgeCopy = getMorphologyForgeCopy(supportLang);
  const threeClueMysteryCopy = getThreeClueMysteryCopy(supportLang);
  const listenDifferenceCopy = getListenDifferenceCopy(supportLang);
  const threeWordChallengeCopy = getThreeWordChallengeCopy(supportLang);
  const naturalOrWeirdCopy = getNaturalOrWeirdCopy(supportLang);
  const supportDirection = getLanguageDirection(supportLang, "ltr");
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
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [assistantSupportText, setAssistantSupportText] = useState("");
  const [isLoadingAssistantSupport, setIsLoadingAssistantSupport] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [sessionEarnedXp, setSessionEarnedXp] = useState(0);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteCreated, setNoteCreated] = useState(false);
  const [streamingQuestion, setStreamingQuestion] = useState(null);

  const addNote = useNotesStore((s) => s.addNote);
  const setNotesLoading = useNotesStore((s) => s.setLoading);
  const triggerDoneAnimation = useNotesStore((s) => s.triggerDoneAnimation);
  const toast = useToast();

  const rawLanguageXp = getLanguageXp(progress, targetLang);
  const totalUserXp =
    (Number.isFinite(rawLanguageXp) ? rawLanguageXp : 0) + sessionEarnedXp;
  const levelNumber = Math.floor(totalUserXp / 100) + 1;
  const xpProgressPct = Math.min(100, totalUserXp % 100);

  const lessonXpGoal = lesson?.xpReward || 0;
  const normalizedLessonEarnedXp = Math.max(0, Number(lessonEarnedXp) || 0);
  const currentEarnedXp = normalizedLessonEarnedXp + sessionEarnedXp;
  const lessonProgressPct =
    lessonXpGoal > 0
      ? Math.min(100, (currentEarnedXp / lessonXpGoal) * 100)
      : 0;
  const lessonProgress =
    lesson &&
    !lesson.isTutorial &&
    !isFinalQuiz &&
    lessonXpGoal > 0
      ? {
          pct: lessonProgressPct,
          earned: Math.min(currentEarnedXp, lessonXpGoal),
          total: lessonXpGoal,
          label:
            t("vocab_lesson_progress") === "vocab_lesson_progress"
              ? "Lesson progress"
              : t("vocab_lesson_progress"),
        }
      : null;

  const cacheRef = useRef(new Map());
  const requestRef = useRef(0);
  const audioRequestRef = useRef(0);
  const audioPlayerRef = useRef(null);
  const companionCapturedRef = useRef(null);
  const pendingSpeechSubmissionRef = useRef(null);
  const recentQuestionSummariesRef = useRef([]);

  const usesExternalQuiz =
    isFinalQuiz && typeof onQuizAnswer === "function";
  const quizStorageKey = lesson?.id ? `quiz-progress:${lesson.id}` : null;
  const quizOutcome = getDelightQuizOutcome(quizHistory, quizConfig);

  useEffect(() => {
    if (!isFinalQuiz || usesExternalQuiz || !quizStorageKey) return;
    try {
      const stored = localStorage.getItem(quizStorageKey);
      if (!stored) return;
      const restored = normalizeDelightQuizProgress(
        JSON.parse(stored),
        quizConfig,
      );
      setQuizHistory(restored.history);
      setQuizFinished(restored.completed);
    } catch (error) {
      console.warn("Failed to load delight quiz progress", error);
    }
  }, [
    isFinalQuiz,
    quizConfig.passingScore,
    quizConfig.questionsRequired,
    quizStorageKey,
    usesExternalQuiz,
  ]);

  useEffect(() => {
    if (!isFinalQuiz || usesExternalQuiz || !quizStorageKey) return;
    try {
      localStorage.setItem(
        quizStorageKey,
        JSON.stringify(serializeDelightQuizProgress(quizHistory, quizConfig)),
      );
    } catch (error) {
      console.warn("Failed to save delight quiz progress", error);
    }
  }, [
    isFinalQuiz,
    quizConfig.passingScore,
    quizConfig.questionsRequired,
    quizHistory,
    quizStorageKey,
    usesExternalQuiz,
  ]);

  useEffect(() => {
    recentQuestionSummariesRef.current = [];
    cacheRef.current.clear();
  }, [lesson?.id, moduleType, supportLang, targetLang]);

  const forcedVariantMeta = variantId
    ? DELIGHT_VARIANTS.find(({ id }) => id === variantId)
    : null;
  const variantMeta =
    forcedVariantMeta || AVAILABLE_VARIANTS[variantIndex] || AVAILABLE_VARIANTS[0];
  const activeVariantCopy =
    variantMeta?.id === "natural_or_weird"
      ? naturalOrWeirdCopy
      : variantMeta?.id === "three_word_challenge"
        ? threeWordChallengeCopy
        : variantMeta?.id === "listen_difference"
          ? listenDifferenceCopy
          : variantMeta?.id === "three_clue_mystery"
            ? threeClueMysteryCopy
            : variantMeta?.id === "morphology_forge"
              ? morphologyForgeCopy
              : variantMeta?.id === "word_neighborhoods"
                ? wordNeighborhoodsCopy
                : variantMeta?.id === "sentence_shapeshifter"
                  ? sentenceShapeshifterCopy
                  : variantMeta?.id === "dialogue_fork"
                    ? dialogueForkCopy
                    : detectiveCopy;

  const speechInputEnabled = SPEECH_RESPONSE_VARIANTS.has(question?.variant);
  const speechTargetText = speechInputEnabled
    ? question?.answer ||
      question?.sampleAnswers?.[0] ||
      (question?.cues || []).join(" ") ||
      "spoken answer"
    : "";
  const handleSpeechPracticeResult = useCallback(
    ({ recognizedText, error }) => {
      if (error) {
        pendingSpeechSubmissionRef.current = null;
        toast({
          title: t("flashcard_eval_error_title") || "Speech error",
          description:
            t("flashcard_eval_error_desc") ||
            "Please check microphone access and try again.",
          status: "error",
          duration: 2800,
        });
        return;
      }

      const transcript = String(recognizedText || "").trim();
      if (!transcript) {
        pendingSpeechSubmissionRef.current = null;
        toast({
          title: t("flashcard_eval_error_title") || "Speech not detected",
          status: "warning",
          duration: 2200,
        });
        return;
      }

      pendingSpeechSubmissionRef.current = transcript;
      setResponseState((current) => ({ ...current, text: transcript }));
    },
    [t, toast],
  );
  const {
    startRecording: startSpeechRecording,
    stopRecording: stopSpeechRecording,
    cancelRecording: cancelSpeechRecording,
    isRecording: isSpeechRecording,
    isConnecting: isSpeechConnecting,
    supportsSpeech,
  } = useSpeechPractice({
    targetText: speechTargetText,
    targetLang,
    onResult: handleSpeechPracticeResult,
    timeoutMs: 2000,
  });
  const cancelQuestionSpeech = useCallback(() => {
    pendingSpeechSubmissionRef.current = null;
    cancelSpeechRecording();
  }, [cancelSpeechRecording]);

  const stopQuestionAudio = useCallback((resetState = true) => {
    audioRequestRef.current += 1;
    stopAllTTSPlayback();
    audioPlayerRef.current?.cleanup?.();
    audioPlayerRef.current = null;
    if (resetState) {
      setIsSpeaking(false);
      setIsSynthesizingAudio(false);
    }
  }, []);

  const resetForQuestion = useCallback((nextQuestion) => {
    stopQuestionAudio();
    cancelQuestionSpeech();
    companionCapturedRef.current = null;
    setQuestion(nextQuestion);
    setResponseState(getInitialDelightResponse(nextQuestion));
    setResult(null);
    setRecentXp(0);
    setRevealedClues(1);
    setAssistantSupportText("");
    setIsLoadingAssistantSupport(false);
    setExplanationText("");
    setIsLoadingExplanation(false);
    setNoteCreated(false);
    setIsCreatingNote(false);
    setStreamingQuestion(null);
    setWordOrder(
      nextQuestion?.variant === "word_neighborhoods"
        ? shuffle(nextQuestion.groups.flatMap((group) => group.items))
        : [],
    );
  }, [cancelQuestionSpeech, stopQuestionAudio]);

  const setResponse = useCallback((updater) => {
    setResponseState(updater);
    if (result === false) {
      setResult(null);
      setExplanationText("");
    }
  }, [result]);

  const handleAskAssistant = useCallback(async () => {
    if (
      isFinalQuiz ||
      !question ||
      isLoadingAssistantSupport ||
      assistantSupportText
    )
      return;
    playSound(submitSound);
    setIsLoadingAssistantSupport(true);
    setAssistantSupportText("");

    try {
      const targetName = getDelightLanguageName(targetLang);
      const supportName = getDelightLanguageName(supportLang);
      const levelHint = cefrLevel
        ? `The learner's proficiency is CEFR ${cefrLevel}.`
        : "";

      const instruction = [
        "You are a helpful, encouraging language study buddy.",
        `The learner is practicing ${targetName}; their support/UI language is ${supportName}.`,
        levelHint,
        buildAssistantLanguagePolicy({
          supportLanguageName: supportName,
          targetLanguageName: targetName,
        }),
        `Explain and guide directly in ${supportName}. Clearly explain the required grammar or vocabulary, provide the relevant words/phrases in ${targetName} with translations in ${supportName}, and guide the learner to successfully answer the question.`,
        "Keep replies concise (≤ 60 words).",
        "Use concise Markdown when helpful (bullets, **bold**).",
      ].join(" ");

      const questionContext =
        question.variant === "sentence_detective"
          ? formatSentenceDetectiveCopy(detectiveCopy.helpRequest, {
              sentence: question.sentence,
            })
          : question.variant === "dialogue_fork"
            ? formatDialogueForkCopy(dialogueForkCopy.helpRequest, {
                speaker: question.speaker || "Speaker",
                line: question.line || "",
              })
            : question.variant === "sentence_shapeshifter"
              ? formatSentenceShapeshifterCopy(sentenceShapeshifterCopy.helpRequest, {
                  source: question.source || "",
                  constraint: question.constraint || "",
                })
              : question.variant === "word_neighborhoods"
                ? formatWordNeighborhoodsCopy(wordNeighborhoodsCopy.helpRequest, {
                    groups: (question.groups || []).map((g) => g.label).join(", "),
                  })
                : question.variant === "morphology_forge"
                  ? formatMorphologyForgeCopy(morphologyForgeCopy.helpRequest, {
                      sentence: question.sentence || "",
                    })
                  : question.variant === "three_clue_mystery"
                    ? formatThreeClueMysteryCopy(threeClueMysteryCopy.helpRequest, {
                        clues: (question.clues || []).slice(0, revealedClues || 1).join(" | "),
                      })
                  : question.variant === "listen_difference"
                    ? listenDifferenceCopy.helpRequest
                  : question.variant === "three_word_challenge"
                    ? threeWordChallengeCopy.helpRequest
                  : question.variant === "natural_or_weird"
                    ? naturalOrWeirdCopy.helpRequest
                  : question.instruction || "Help me with this question.";

      let variantContext = "";
      if (question.variant === "sentence_detective") {
        variantContext = [
          `Exercise: Sentence Detective`,
          `Sentence with error: "${question.sentence || ""}"`,
          `Incorrect word: "${question.wrongToken || ""}"`,
          `Correct repair: "${question.answer || ""}"`,
          `Task: Explain which word is incorrect ("${question.wrongToken || ""}"), why it is wrong, and provide the correct repair word ("${question.answer || ""}") with a clear explanation.`,
        ].join("\n");
      } else if (question.variant === "dialogue_fork") {
        variantContext = [
          `Exercise: Dialogue Fork (Conversational Reply)`,
          `Speaker prompt: ${question.speaker ? `${question.speaker}: ` : ""}"${question.line || ""}"`,
          `Options: ${(question.options || []).map((opt, i) => `${i + 1}. "${opt}"`).join(", ")}`,
          `Correct reply: "${question.options?.[question.answerIndex] || ""}"`,
          `Task: Recommend the best reply ("${question.options?.[question.answerIndex] || ""}") and explain why it is the most natural and appropriate conversational response in ${targetName}.`,
        ].join("\n");
      } else if (question.variant === "sentence_shapeshifter") {
        variantContext = [
          `Exercise: Sentence Shapeshifter`,
          `Original sentence: "${question.source || ""}"`,
          `Transformation rule: "${question.constraint || ""}"`,
          `Expected answer: "${question.answer || ""}"`,
          `Task: Guide the learner on how to transform the sentence according to the rule ("${question.constraint || ""}") in ${targetName}. Provide the target words/phrases and guide them to form the complete sentence ("${question.answer || ""}").`,
        ].join("\n");
      } else if (question.variant === "word_neighborhoods") {
        const groupsDesc = (question.groups || [])
          .map((g) => `- "${g.label}": [${(g.items || []).join(", ")}]`)
          .join("\n");
        variantContext = [
          `Exercise: Word Neighborhoods (Sorting words into categories)`,
          `Categories & target words:`,
          groupsDesc,
          `Task: Explain the categories clearly and guide the learner on where the words belong with helpful definitions or translations.`,
        ].join("\n");
      } else if (question.variant === "morphology_forge") {
        variantContext = [
          `Exercise: Morphology Forge (Building words from morphemes)`,
          `Sentence: "${question.sentence || ""}"`,
          `Target word to build: "${question.answerWord || ""}"`,
          `Correct morpheme pieces: ${(question.answerPieces || []).join(" + ")}`,
          `Available pieces: ${(question.pieces || []).join(", ")}`,
          `Task: Explain how to build the target word ("${question.answerWord || ""}") using the morpheme pieces (${(question.answerPieces || []).join(" + ")}), explaining their grammatical function or meaning.`,
        ].join("\n");
      } else if (question.variant === "three_clue_mystery") {
        const revealedList = (question.clues || []).slice(0, revealedClues || 1);
        const cluesDesc = revealedList
          .map((c, i) => `Clue ${i + 1}: "${c}"`)
          .join("\n");
        variantContext = [
          `Exercise: Three-Clue Mystery`,
          `Mystery word (secret answer): "${question.answer || ""}"`,
          `Example sentence with answer: "${question.example || ""}"`,
          `Clues currently revealed to the learner:`,
          cluesDesc,
          `Task: Guide the learner to deduce the mystery word ("${question.answer || ""}") by explaining how the clues connect and providing a helpful hint or definition in ${supportName}.`,
        ].join("\n");
      } else if (question.variant === "listen_difference") {
        variantContext = [
          `Exercise: Listen for the Difference (Minimal Pairs & Phonetics)`,
          `Spoken target audio: "${question.audioText || ""}"`,
          `Available options: ${(question.options || []).map((opt, i) => `${i + 1}. "${opt}"`).join(", ")}`,
          `Correct option: Option ${typeof question.answerIndex === "number" ? question.answerIndex + 1 : 1} ("${question.options?.[question.answerIndex] || ""}")`,
          `Key phonetic/grammatical distinction: "${question.contrast || ""}"`,
          `Task: Explain the correct option ("${question.options?.[question.answerIndex] || ""}") and point out the key sound or grammatical distinction to listen for.`,
        ].join("\n");
      } else if (question.variant === "three_word_challenge") {
        variantContext = [
          `Exercise: Three-Word Challenge (Creative Sentence Construction)`,
          `Required cue words: ${(question.cues || []).map((c, i) => `${i + 1}. "${c}"`).join(", ")}`,
          `Valid sample answers: ${(question.sampleAnswers || []).map((a) => `"${a}"`).join(", ")}`,
          `Task: Provide a natural example sentence in ${targetName} connecting all 3 words with its translation in ${supportName} to guide the learner.`,
        ].join("\n");
      } else if (question.variant === "natural_or_weird") {
        variantContext = [
          `Exercise: Natural or Weird? (Intuition & Idiomatic Nuance)`,
          `Target sentence: "${question.sentence || ""}"`,
          `Correct status: ${question.isNatural ? "NATURAL (authentic everyday phrasing)" : "WEIRD / AWKWARD (unnatural phrasing or grammatical mistake)"}`,
          question.correction ? `Proper correction/repair if weird: "${question.correction}"` : "",
          question.explanation ? `Nuance explanation: "${question.explanation}"` : "",
          `Task: Explain clearly whether the sentence is natural or weird in everyday ${targetName}, why native speakers say it that way, and provide the natural phrasing.`,
        ].filter(Boolean).join("\n");
      } else {
        variantContext = `Exercise: ${question.variant || "General practice"}\nContent: "${question.line || question.sentence || question.source || question.instruction || ""}"`;
      }

      const prompt = `${instruction}\n\n${variantContext}\n\nLearner request:\n${questionContext}`;

      if (simplemodel) {
        const resp = await simplemodel.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        let accumulatedText = "";
        for await (const chunk of resp.stream) {
          const piece = textFromChunk(chunk);
          if (piece) {
            accumulatedText += piece;
            setAssistantSupportText(accumulatedText);
          }
        }
        const finalAgg = await resp.response;
        const finalText =
          (typeof finalAgg?.text === "function"
            ? finalAgg.text()
            : finalAgg?.text) || accumulatedText;
        if (finalText) {
          setAssistantSupportText(finalText);
        }
      } else {
        const response = await callResponses({
          model: DEFAULT_RESPONSES_MODEL,
          input: prompt,
        });
        setAssistantSupportText(
          response ||
            t("vocab_assistant_error") ||
            "I couldn't load help right now. Please try again.",
        );
      }
    } catch (error) {
      console.error("Failed to generate assistant support:", error);
      setAssistantSupportText(
        t("vocab_assistant_error") ||
          "I couldn't load help right now. Please try again.",
      );
    } finally {
      setIsLoadingAssistantSupport(false);
    }
  }, [
    assistantSupportText,
    cefrLevel,
    detectiveCopy.helpRequest,
    dialogueForkCopy.helpRequest,
    isLoadingAssistantSupport,
    isFinalQuiz,
    listenDifferenceCopy.helpRequest,
    morphologyForgeCopy.helpRequest,
    naturalOrWeirdCopy.helpRequest,
    playSound,
    question,
    revealedClues,
    sentenceShapeshifterCopy.helpRequest,
    supportLang,
    t,
    targetLang,
    threeClueMysteryCopy.helpRequest,
    threeWordChallengeCopy.helpRequest,
    wordNeighborhoodsCopy.helpRequest,
  ]);

  useEffect(() => {
    const requestId = ++requestRef.current;
    const cacheKey = [
      moduleType,
      lesson?.id || "free",
      targetLang,
      supportLang,
      cefrLevel,
      variantMeta.id,
      variantMeta.id === "sentence_detective"
        ? SENTENCE_DETECTIVE_CACHE_VERSION
        : "v1",
    ].join(":");
    const cached = cacheRef.current.get(cacheKey);
    if (cached && generationNonce === 0) {
      resetForQuestion(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setStreamingQuestion(null);
    setGenerationError("");
    setQuestion(null);

    const onStreamChunk = (accumulated) => {
      if (requestId !== requestRef.current) return;
      const partial = parsePartialDelightQuestion(accumulated);
      if (partial) {
        setStreamingQuestion(partial);
      }
    };

    const generate = async (input, onStream) => {
      if (simplemodel) {
        try {
          const resp = await simplemodel.generateContentStream({
            contents: [{ role: "user", parts: [{ text: input }] }],
            generationConfig: DELIGHT_JSON_GENERATION_CONFIG,
          });
          let accumulated = "";
          for await (const chunk of resp.stream) {
            if (requestId !== requestRef.current) break;
            const piece = textFromChunk(chunk);
            if (piece) {
              accumulated += piece;
              onStream?.(accumulated);
            }
          }
          const finalAgg = await resp.response;
          const output =
            (typeof finalAgg?.text === "function"
              ? finalAgg.text()
              : finalAgg?.text) || accumulated;
          if (String(output || "").trim()) return output;
          throw new Error("Question generation returned an empty response.");
        } catch (primaryError) {
          if (requestId !== requestRef.current) throw primaryError;
          const fallback = await callResponses({
            model: DEFAULT_RESPONSES_MODEL,
            input,
            generationConfig: DELIGHT_JSON_GENERATION_CONFIG,
            skipGemini: true,
          });
          if (String(fallback || "").trim()) {
            onStream?.(fallback);
            return fallback;
          }
          throw primaryError;
        }
      }
      const result = await callResponses({
        model: DEFAULT_RESPONSES_MODEL,
        input,
        generationConfig: DELIGHT_JSON_GENERATION_CONFIG,
      });
      if (!String(result || "").trim()) {
        throw new Error("Question generation returned an empty response.");
      }
      onStream?.(result);
      return result;
    };

    const normalizeCandidate = (raw) =>
      normalizeDelightQuestion(variantMeta.id, raw);
    const candidateIsGrounded = (candidate) =>
      candidate &&
      isDelightQuestionLessonGrounded(
        candidate,
        lessonContent,
        moduleType,
      );

    const generationTask = (async () => {
      let firstRaw = "";
      let firstCandidate = null;
      let rejectionReason = "The first response did not match the required schema.";

      try {
        if (variantMeta.id === "sentence_detective") {
          firstCandidate = await generateSentenceDetectiveQuestion({
            generate,
            moduleType,
            targetLang,
            supportLang,
            cefrLevel,
            lessonContent,
            recentQuestions: recentQuestionSummariesRef.current,
            onStream: onStreamChunk,
          });
        } else {
          firstRaw = await generate(
            buildDelightQuestionPrompt({
              variant: variantMeta.id,
              moduleType,
              targetLang,
              supportLang,
              cefrLevel,
              lessonContent,
              recentQuestions: recentQuestionSummariesRef.current,
            }),
            onStreamChunk,
          );
          firstCandidate = normalizeCandidate(firstRaw);
        }
      } catch (error) {
        rejectionReason =
          error?.issues?.join(" ") ||
          error?.message ||
          rejectionReason;
      }

      if (candidateIsGrounded(firstCandidate)) return firstCandidate;
      if (firstCandidate) {
        rejectionReason = "The first response drifted outside the active lesson curriculum.";
      }

      // One bounded repair attempt lives inside this request. It cannot be
      // triggered again by rendering or state updates.
      let repairedCandidate = null;
      if (variantMeta.id === "sentence_detective") {
        repairedCandidate = await generateSentenceDetectiveQuestion({
          generate,
          moduleType,
          targetLang,
          supportLang,
          cefrLevel,
          lessonContent,
          recentQuestions: recentQuestionSummariesRef.current,
          previousIssues: [rejectionReason],
          onStream: onStreamChunk,
        });
      } else {
        const repairedRaw = await generate(
          buildDelightQuestionRepairPrompt({
            variant: variantMeta.id,
            moduleType,
            targetLang,
            supportLang,
            cefrLevel,
            lessonContent,
            recentQuestions: recentQuestionSummariesRef.current,
            rejectedResponse: firstRaw,
            reason: rejectionReason,
          }),
          onStreamChunk,
        );
        repairedCandidate = normalizeCandidate(repairedRaw);
      }

      if (candidateIsGrounded(repairedCandidate)) return repairedCandidate;
      throw new Error(
        repairedCandidate
          ? "The repaired question did not match the active lesson curriculum."
          : "The repaired question did not match the required schema.",
      );
    })();
    const generation = settleWithin(
      generationTask,
      QUESTION_GENERATION_TIMEOUT_MS,
    );

    generation
      .then((raw) => {
        if (requestId !== requestRef.current) return;
        const normalized = raw;
        const summary = getDelightQuestionVarietySummary(normalized);
        if (summary) {
          recentQuestionSummariesRef.current = [
            ...recentQuestionSummariesRef.current,
            summary,
          ].slice(-5);
        }
        cacheRef.current.set(cacheKey, normalized);
        resetForQuestion(normalized);
      })
      .catch((error) => {
        if (requestId !== requestRef.current) return;
        if (import.meta.env.DEV) {
          console.warn("Delight question generation failed:", error?.message);
        }
        setGenerationError("");
        setQuestion(null);
      })
      .finally(() => {
        if (requestId === requestRef.current) {
          setLoading(false);
          setStreamingQuestion(null);
        }
      });
  }, [
    cefrLevel,
    detectiveCopy,
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
      stopQuestionAudio(false);
    },
    [stopQuestionAudio],
  );

  const moveToVariant = useCallback(
    (index) => {
      stopQuestionAudio();
      cancelQuestionSpeech();
      // Revisiting a format should generate fresh lesson material rather than
      // revive that format's first cached testing sample.
      setGenerationNonce((value) => value + 1);
      setVariantIndex(
        (index + AVAILABLE_VARIANTS.length) % AVAILABLE_VARIANTS.length,
      );
    },
    [cancelQuestionSpeech, stopQuestionAudio],
  );

  const handleRefresh = useCallback(() => {
    stopQuestionAudio();
    cancelQuestionSpeech();
    const cacheKey = [
      moduleType,
      lesson?.id || "free",
      targetLang,
      supportLang,
      cefrLevel,
      variantMeta.id,
      variantMeta.id === "sentence_detective"
        ? SENTENCE_DETECTIVE_CACHE_VERSION
        : "v1",
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
    cancelQuestionSpeech,
    stopQuestionAudio,
  ]);

  const handleSkipQuestion = useCallback(() => {
    if (isFinalQuiz || submitting) return;
    playSound(clickSound);
    if (onSkip) {
      stopQuestionAudio();
      cancelQuestionSpeech();
      onSkip();
      return;
    }
    handleRefresh();
  }, [
    handleRefresh,
    isFinalQuiz,
    onSkip,
    playSound,
    cancelQuestionSpeech,
    stopQuestionAudio,
    submitting,
  ]);

  const handlePlay = useCallback(
    async (customText = null) => {
      const textToPlay =
        (typeof customText === "string" ? customText : null) ||
        question?.audioText ||
        question?.line ||
        question?.source ||
        question?.sentence;
      if (!textToPlay || isSynthesizingAudio) return;

      stopQuestionAudio();
      const requestId = ++audioRequestRef.current;

      setIsSynthesizingAudio(true);
      setIsSpeaking(false);

      try {
        const player = await getTTSPlayer({
          text: textToPlay,
          langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
          voice: getPreferredTTSVoice(),
        });

        if (requestId !== audioRequestRef.current) {
          player.cleanup?.();
          return;
        }

        audioPlayerRef.current = player;
        const audio = player.audio;
        const audioTracks = audio.srcObject?.getAudioTracks?.() || [];
        let responseHasCompleted = false;
        const handleTrackMute = () => {
          if (requestId === audioRequestRef.current) {
            setIsSpeaking(false);
          }
        };

        let isDone = false;
        const onDone = () => {
          if (isDone) return;
          isDone = true;
          audioTracks.forEach((track) =>
            track.removeEventListener("mute", handleTrackMute),
          );
          if (requestId === audioRequestRef.current) {
            setIsSpeaking(false);
            setIsSynthesizingAudio(false);
            audioPlayerRef.current = null;
          }
          player.cleanup?.();
        };

        audio.onended = onDone;
        audio.onerror = onDone;
        audio.onpause = onDone;

        audioTracks.forEach((track) => {
          if (track.muted) {
            handleTrackMute();
          } else {
            track.addEventListener("mute", handleTrackMute, { once: true });
          }
        });

        // Cached blob players expose an already-resolved finalize promise, so
        // only realtime streams use it as the playback-completion signal.
        if (audio.srcObject && player.finalize) {
          player.finalize.then(onDone).catch(onDone);
        }
        if (audio.srcObject && player.responseComplete) {
          player.responseComplete
            .then(() => {
              responseHasCompleted = true;
              if (requestId === audioRequestRef.current) {
                setIsSpeaking(false);
              }
            })
            .catch(onDone);
        }

        await player.ready;
        if (requestId !== audioRequestRef.current || isDone) {
          player.cleanup?.();
          return;
        }
        setIsSynthesizingAudio(false);
        setIsSpeaking(!responseHasCompleted);
        await audio.play().catch(onDone);
      } catch {
        if (requestId === audioRequestRef.current) {
          setIsSynthesizingAudio(false);
          setIsSpeaking(false);
          audioPlayerRef.current = null;
        }
      }
    },
    [
      isSynthesizingAudio,
      question?.audioText,
      question?.line,
      question?.sentence,
      question?.source,
      stopQuestionAudio,
      targetLang,
    ],
  );

  const handleSubmit = useCallback(async (responseOverride = null) => {
    const submittedResponse = responseOverride || response;
    if (
      !question ||
      !isDelightResponseReady(question, submittedResponse) ||
      submitting
    )
      return;
    playSound(submitActionSound);
    setSubmitting(true);
    let ok = gradeDelightResponse(question, submittedResponse);
    if (ok === null) {
      const judgeInput = buildDelightResponseJudgePrompt({
        question,
        response: submittedResponse,
        targetLang,
        supportLang,
        cefrLevel,
        moduleType,
      });

      try {
        const verdict = await callResponses({
          model: DEFAULT_RESPONSES_MODEL,
          input: judgeInput,
        });
        const parsedVerdict = parseDelightJudgeVerdict(verdict);
        if (parsedVerdict === null) {
          throw new Error("Semantic grader returned no explicit verdict.");
        }
        ok = parsedVerdict;
      } catch (error) {
        console.error("Delight semantic grading error:", error);
        toast({
          title: t("flashcard_eval_error_title") || "Could not grade answer",
          description:
            t("flashcard_eval_error_desc") ||
            "Please check your connection and try again.",
          status: "error",
          duration: 3000,
        });
        setSubmitting(false);
        return;
      }
    }

    const xp = ok
      ? calculateDelightQuestionXp(question, submittedResponse, {
          revealedClues,
          isFinalQuiz,
        })
      : 0;
    setResult(Boolean(ok));
    setRecentXp(isFinalQuiz ? 0 : xp);
    if (ok) {
      setExplanationText("");
      setSessionEarnedXp((prev) => prev + xp);
    } else {
      const mem = extractDelightMemoryItem(question, submittedResponse);
      const sig = `${question.variant || ""}|${mem.concept}|${mem.userAnswer}`;
      if (companionCapturedRef.current !== sig) {
        companionCapturedRef.current = sig;
        void captureCompanionMemory({
          npub,
          targetLang,
          supportLang,
          sourceMode: moduleType === "vocabulary" ? "vocabulary" : "grammar",
          concept:
            mem.concept ||
            question.sentence ||
            question.prompt ||
            "Missed practice item",
          userAnswer: mem.userAnswer,
          expectedAnswer: mem.expectedAnswer,
          cefrLevel,
          sourceContext: question.variant || moduleType || "delight_question",
        }).catch((err) => {
          console.warn("Delight question memory capture error:", err);
        });
        triggerDoneAnimation?.();
      }
    }
    playSound(ok ? deliciousSound : clickSound);

    if (isFinalQuiz) {
      if (usesExternalQuiz) {
        onQuizAnswer(Boolean(ok), {
          question:
            question.sentence ||
            question.line ||
            question.source ||
            question.instruction ||
            question.variant,
          userAnswer: JSON.stringify(submittedResponse),
          correctAnswer:
            question.answer ||
            question.answerWord ||
            question.options?.[question.answerIndex] ||
            question.correction ||
            "",
          questionType: question.variant,
        });
      } else {
        setQuizHistory((history) => [...history, Boolean(ok)]);
      }
    } else if (xp > 0) {
      await awardXp(npub, xp, targetLang, {
        skillTreeLessonId: lesson?.id,
      }).catch(() => {});
    }
    setSubmitting(false);
  }, [
    cefrLevel,
    isFinalQuiz,
    lesson?.id,
    moduleType,
    npub,
    playSound,
    question,
    response,
    revealedClues,
    submitting,
    supportLang,
    t,
    targetLang,
    toast,
    triggerDoneAnimation,
    usesExternalQuiz,
    onQuizAnswer,
  ]);

  useEffect(() => {
    const transcript = pendingSpeechSubmissionRef.current;
    if (
      !transcript ||
      submitting ||
      response?.text !== transcript ||
      !speechInputEnabled
    ) {
      return;
    }

    pendingSpeechSubmissionRef.current = null;
    void handleSubmit({ ...response, text: transcript });
  }, [
    handleSubmit,
    response,
    speechInputEnabled,
    submitting,
  ]);

  const handleToggleSpeech = useCallback(async () => {
    if (isSpeechRecording) {
      playSound(clickSound);
      stopSpeechRecording();
      return;
    }
    if (
      !speechInputEnabled ||
      isSpeechConnecting ||
      submitting ||
      result === true
    ) {
      return;
    }

    pendingSpeechSubmissionRef.current = null;
    stopQuestionAudio();
    setResult(null);
    setExplanationText("");
    playSound(submitActionSound);

    try {
      await startSpeechRecording();
    } catch (error) {
      const isMicDenied = error?.code === "mic-denied";
      toast({
        title: isMicDenied
          ? t("flashcard_mic_denied_title")
          : t("flashcard_eval_error_title"),
        description: isMicDenied
          ? t("flashcard_mic_denied_desc")
          : t("flashcard_eval_error_desc"),
        status: isMicDenied ? "warning" : "error",
        duration: 3000,
      });
    }
  }, [
    isSpeechConnecting,
    isSpeechRecording,
    playSound,
    result,
    speechInputEnabled,
    startSpeechRecording,
    stopQuestionAudio,
    stopSpeechRecording,
    submitting,
    t,
    toast,
  ]);

  const handleExplainAnswer = useCallback(async () => {
    if (isFinalQuiz || !question || isLoadingExplanation || explanationText)
      return;
    playSound(submitActionSound);
    setIsLoadingExplanation(true);
    setExplanationText("");

    try {
      const targetName = getDelightLanguageName(targetLang);
      const supportName = getDelightLanguageName(supportLang);
      const variantDetails =
        question.variant === "sentence_detective"
          ? [
              `Original sentence with error: "${question.sentence || ""}"`,
              `The incorrect word was: "${question.wrongToken || question.tokens?.[question.incorrectIndex] || ""}"`,
              `The student selected: "${question.tokens?.[response?.tokenIndex] || ""}" replaced with "${response?.replacement || ""}"`,
              `The correct repair is: "${question.answer || ""}"`,
              question.correctedSentence ? `Full correct sentence: "${question.correctedSentence}"` : "",
            ]
          : question.variant === "dialogue_fork"
            ? [
                `Speaker "${question.speaker || "Speaker"}" said: "${question.line || ""}"`,
                `The student selected: "${question.options?.[response?.selectedIndex] || ""}"`,
                `The natural and correct reply is: "${question.options?.[question.answerIndex] || ""}"`,
              ]
            : question.variant === "sentence_shapeshifter"
              ? [
                  `Original source sentence: "${question.source || ""}"`,
                  `Transformation constraint: "${question.constraint || ""}"`,
                  `The student typed: "${response?.text || ""}"`,
                  `Expected correct transformation: "${question.answer || ""}"`,
                  question.acceptableAnswers?.length
                    ? `Acceptable alternatives: ${question.acceptableAnswers.map((a) => `"${a}"`).join(", ")}`
                    : "",
                ]
            : question.variant === "word_neighborhoods"
              ? [
                  `Category groups: ${(question.groups || []).map((g) => `${g.label}: ${g.items.join(", ")}`).join("; ")}`,
                  `Student placed words as: ${(question.groups || []).map((g, idx) => `${g.label}: ${Object.entries(response?.assignments || {}).filter(([, groupIndex]) => Number(groupIndex) === idx).map(([word]) => word).join(", ") || "(empty)"}`).join("; ")}`,
                ]
              : question.variant === "morphology_forge"
                ? [
                    `Sentence with blank: "${question.sentence || ""}"`,
                    `Expected correct forged word: "${question.answerWord || (question.answerPieces || []).join("")}"`,
                    `Target word morphemes: ${(question.answerPieces || []).join(" + ")}`,
                    `Student assembled pieces: ${(response?.pieceIndices || []).map((idx) => question.pieces?.[idx]).join(" + ") || "(none)"}`,
                    `Student formed word: "${(response?.pieceIndices || []).map((idx) => question.pieces?.[idx]).join("")}"`,
                  ]
              : question.variant === "three_clue_mystery"
                ? [
                    `Mystery Clues: ${(question.clues || []).map((c, i) => `Clue ${i + 1}: "${c}"`).join("; ")}`,
                    `Expected correct target word: "${question.answer || ""}"`,
                    question.example ? `Example sentence: "${question.example}"` : "",
                    `Student guessed: "${response?.text || ""}"`,
                  ]
              : [
                  `Question: "${question.sentence || question.source || question.line || ""}"`,
                  `Correct answer: "${question.answer || question.options?.[question.answerIndex] || ""}"`,
                ];

      const prompt = [
        `You are a helpful language tutor teaching ${targetName}. A student answered an exercise incorrectly.`,
        buildAssistantLanguagePolicy({
          supportLanguageName: supportName,
          targetLanguageName: targetName,
        }),
        `Question variant: ${question.variant || "Dialogue Fork"}`,
        ...variantDetails,
        "",
        `IMPORTANT: Provide your entire explanation in ${supportName}.`,
        `Provide a brief, encouraging explanation (2-3 sentences) in ${supportName} that:`,
        `1. Explains why the student's selected answer was not the best choice`,
        `2. Clarifies why the correct response fits best naturally`,
        `3. Gives a friendly tip to remember it`,
        `Keep it concise, supportive, and focused on learning. Write in ${supportName}.`,
      ].filter(Boolean).join("\n");

      if (simplemodel) {
        const resp = await simplemodel.generateContentStream({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        let accumulatedText = "";
        for await (const chunk of resp.stream) {
          const piece = textFromChunk(chunk);
          if (piece) {
            accumulatedText += piece;
            setExplanationText(accumulatedText);
          }
        }
        const finalAgg = await resp.response;
        const finalText =
          (typeof finalAgg?.text === "function"
            ? finalAgg.text()
            : finalAgg?.text) || accumulatedText;
        if (finalText) {
          setExplanationText(finalText);
        }
      } else {
        const explanation = await callResponses({
          model: DEFAULT_RESPONSES_MODEL,
          input: prompt,
        });
        setExplanationText(
          explanation ||
            t("vocab_explanation_error") ||
            "I couldn't load an explanation right now. Please try again.",
        );
      }
    } catch (error) {
      console.error("Failed to generate explanation:", error);
      setExplanationText(
        t("vocab_explanation_error") ||
          "I couldn't load an explanation right now. Please try again.",
      );
    } finally {
      setIsLoadingExplanation(false);
    }
  }, [
    explanationText,
    isFinalQuiz,
    isLoadingExplanation,
    playSound,
    question,
    response?.assignments,
    response?.pieceIndices,
    response?.replacement,
    response?.selectedIndex,
    response?.text,
    response?.tokenIndex,
    supportLang,
    t,
    targetLang,
  ]);

  const handleCreateNote = useCallback(async () => {
    if (isFinalQuiz || isCreatingNote || noteCreated || !question) return;

    setIsCreatingNote(true);
    setNotesLoading(true);

    try {
      const concept =
        question.variant === "three_clue_mystery"
          ? `${question.answer || "Mystery Word"}${question.example ? ` — ${question.example}` : ""}`
          : question.variant === "morphology_forge"
            ? `${question.answerWord || "Word"}: ${(question.answerPieces || []).join(" + ")}`
            : question.variant === "word_neighborhoods"
              ? (question.groups || []).map((g) => `${g.label}: ${g.items.join(", ")}`).join(" | ")
              : question.variant === "sentence_shapeshifter"
                ? `${question.source || "Sentence"} → ${question.constraint || "Rule"}`
                : question.correctedSentence ||
                  question.sentence ||
                  (question.speaker && question.line ? `${question.speaker}: ${question.line}` : "") ||
                  question.source ||
                  question.answer ||
                  "Exercise";

      const userAnswer =
        question.variant === "three_clue_mystery"
          ? response?.text || ""
          : question.variant === "morphology_forge"
            ? (response?.pieceIndices || []).map((idx) => question.pieces?.[idx]).join("")
            : question.variant === "word_neighborhoods"
              ? (question.groups || []).map((g, idx) => `${g.label}: ${Object.entries(response?.assignments || {}).filter(([, groupIndex]) => Number(groupIndex) === idx).map(([word]) => word).join(", ")}`).join(" | ")
              : question.variant === "dialogue_fork"
                ? question.options?.[response?.selectedIndex] || ""
                : question.variant === "sentence_shapeshifter"
                  ? response?.text || ""
                  : response?.replacement || response?.text || "";

      const { example, summary } = await generateNoteContent({
        concept,
        userAnswer,
        wasCorrect: result,
        targetLang,
        supportLang,
        cefrLevel,
        moduleType,
      });

      const lessonTitle = lesson?.title || {
        en: moduleType === "grammar" ? "Grammar" : "Vocabulary",
        es: moduleType === "grammar" ? "Gramática" : "Vocabulario",
      };

      const note = buildNoteObject({
        lessonTitle,
        cefrLevel,
        example,
        summary,
        targetLang,
        supportLang,
        moduleType,
        wasCorrect: result,
      });

      addNote(note);
      setNoteCreated(true);
      triggerDoneAnimation?.();
    } catch (error) {
      console.error("Error creating note:", error);
      toast({
        title:
          t("vocab_create_note_error") === "vocab_create_note_error"
            ? "Could not create note"
            : t("vocab_create_note_error"),
        status: "error",
        duration: 2500,
      });
    } finally {
      setIsCreatingNote(false);
      setNotesLoading(false);
    }
  }, [
    addNote,
    cefrLevel,
    isCreatingNote,
    isFinalQuiz,
    lesson?.title,
    moduleType,
    noteCreated,
    question,
    response?.assignments,
    response?.pieceIndices,
    response?.replacement,
    response?.selectedIndex,
    response?.text,
    result,
    setNotesLoading,
    supportLang,
    t,
    targetLang,
    toast,
    triggerDoneAnimation,
  ]);

  const handleNext = useCallback(() => {
    if (onNextQuestion) {
      onNextQuestion();
      return;
    }
    if (isFinalQuiz && quizOutcome.completed) {
      setQuizFinished(true);
      return;
    }
    if (AVAILABLE_VARIANTS.length === 1) {
      handleRefresh();
      return;
    }
    moveToVariant(variantIndex + 1);
  }, [
    handleRefresh,
    isFinalQuiz,
    moveToVariant,
    onNextQuestion,
    quizOutcome.completed,
    variantIndex,
  ]);

  const ready = question && isDelightResponseReady(question, response);
  const speechLabels = {
    record: t("flashcard_record_answer"),
    stop: t("flashcard_stop_recording"),
    connecting: t("vocab_connecting"),
  };
  const isLastQuizQuestion =
    isFinalQuiz && quizOutcome.completed;
  const quizCorrect = quizOutcome.correct;

  const handleExitQuiz = useCallback(() => {
    if (quizStorageKey && typeof window !== "undefined") {
      localStorage.removeItem(quizStorageKey);
    }
    setQuizHistory([]);
    setQuizFinished(false);
    (onExitQuiz || onSkip)?.();
  }, [onExitQuiz, onSkip, quizStorageKey]);

  const handleRetryQuiz = useCallback(() => {
    if (quizStorageKey && typeof window !== "undefined") {
      localStorage.removeItem(quizStorageKey);
    }
    setQuizHistory([]);
    setQuizFinished(false);
    handleRefresh();
  }, [handleRefresh, quizStorageKey]);

  if (quizFinished) {
    const passed = quizOutcome.passed;
    return (
      <Box
        p={4}
        color={APP_TEXT_PRIMARY}
        lang={supportLang}
        dir={supportDirection}
      >
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
            {passed ? detectiveCopy.quizComplete : detectiveCopy.keepExploring}
          </Text>
          <Text color={APP_TEXT_SECONDARY}>
            {formatSentenceDetectiveCopy(detectiveCopy.correctCount, {
              correct: quizCorrect,
              total: quizHistory.length,
            })}
          </Text>
          <VStack spacing={3} width="100%">
            {!passed && (
              <Button
                width="100%"
                colorScheme="purple"
                onClick={handleRetryQuiz}
              >
                {t("flashcard_try_again") === "flashcard_try_again"
                  ? "Try again"
                  : t("flashcard_try_again")}
              </Button>
            )}
            <Button
              width="100%"
              colorScheme="cyan"
              variant={passed ? "solid" : "outline"}
              onClick={handleExitQuiz}
            >
              {passed
                ? detectiveCopy.continue
                : t("vocab_back_to_skill_tree") === "vocab_back_to_skill_tree"
                  ? "Back to skill tree"
                  : t("vocab_back_to_skill_tree")}
            </Button>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      p={embedded ? 0 : 4}
      color={APP_TEXT_PRIMARY}
      lang={supportLang}
      dir={supportDirection}
    >
      <VStack
        spacing={4}
        align="stretch"
        maxW={embedded ? "none" : "720px"}
        mx="auto"
      >
        {/* Shared progress header */}
        {!embedded && <Box display="flex" justifyContent="center">
          <Box w={{ base: "100%", md: "60%" }} justifyContent="center">
            {isFinalQuiz ? (
              // Quiz progress display with animated bars
              <VStack spacing={2} w="100%">
                <HStack justify="space-between" w="100%" mb={1}>
                  <Badge colorScheme="purple" fontSize="md">
                    {t("vocab_final_quiz") === "vocab_final_quiz"
                      ? "Final Quiz"
                      : t("vocab_final_quiz")}
                  </Badge>
                  <Badge
                    colorScheme={
                      quizCorrect >= quizConfig.passingScore
                        ? "green"
                        : "yellow"
                    }
                    fontSize="md"
                  >
                    {quizHistory.length}/{quizConfig.questionsRequired}
                  </Badge>
                </HStack>

                {/* Animated progress bar showing correct (blue) and wrong (red) answers */}
                <HStack spacing="2px" w="100%" h="16px">
                  {Array.from({ length: quizConfig.questionsRequired }).map(
                    (_, i) => {
                      const hasAnswer = i < quizHistory.length;
                      const isCorrect = hasAnswer ? quizHistory[i] : null;

                      return (
                        <Box
                          key={i}
                          flex="1"
                          h="100%"
                          bg={
                            !hasAnswer
                              ? "gray.700"
                              : isCorrect
                                ? "blue.400"
                                : "red.400"
                          }
                          borderRadius="sm"
                          position="relative"
                          overflow="hidden"
                          opacity={hasAnswer ? 1 : 0.5}
                        />
                      );
                    },
                  )}
                </HStack>

                <Text fontSize="xs" color="gray.400" textAlign="center">
                  {t("vocab_quiz_score_failed", {
                    correct: quizCorrect,
                    needed: quizConfig.passingScore,
                  })}
                </Text>
              </VStack>
            ) : (
              // Normal XP progress display
              <XpProgressHeader
                levelText={
                  moduleType === "grammar"
                    ? t("grammar_badge_level", { level: levelNumber }) ===
                      "grammar_badge_level"
                      ? `Level ${levelNumber}`
                      : t("grammar_badge_level", { level: levelNumber })
                    : t("vocab_badge_level", { level: levelNumber }) ===
                        "vocab_badge_level"
                      ? `Level ${levelNumber}`
                      : t("vocab_badge_level", { level: levelNumber })
                }
                xpText={
                  moduleType === "grammar"
                    ? t("grammar_badge_xp", { xp: totalUserXp }) ===
                      "grammar_badge_xp"
                      ? `${totalUserXp} XP`
                      : t("grammar_badge_xp", { xp: totalUserXp })
                    : t("vocab_badge_xp", { xp: totalUserXp }) ===
                        "vocab_badge_xp"
                      ? `${totalUserXp} XP`
                      : t("vocab_badge_xp", { xp: totalUserXp })
                }
                progressPct={xpProgressPct}
              />
            )}
          </Box>
        </Box>}

        {!embedded && !isFinalQuiz && (
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
                {detectiveCopy.testingGate}
              </Badge>
              {AVAILABLE_VARIANTS.length > 1 ? (
                <>
                  <Select
                    aria-label="Choose delight variant"
                    size="sm"
                    flex="1"
                    minW="210px"
                    value={variantMeta.id}
                    onChange={(event) =>
                      moveToVariant(
                        AVAILABLE_VARIANTS.findIndex(
                          ({ id }) => id === event.target.value,
                        ),
                      )
                    }
                    bg={APP_SURFACE}
                    borderColor={APP_BORDER}
                    style={questionSquircleStyle}
                  >
                    {AVAILABLE_VARIANTS.map((variant, index) => (
                      <option key={variant.id} value={variant.id}>
                        {index + 1}. {variant.label}
                      </option>
                    ))}
                  </Select>
                  <Badge variant="outline" colorScheme="purple">
                    {variantIndex + 1}/{AVAILABLE_VARIANTS.length}
                  </Badge>
                </>
              ) : (
                <Text flex="1" fontSize="sm" fontWeight="800">
                  {activeVariantCopy.title}
                </Text>
              )}
              <IconButton
                aria-label={
                  activeVariantCopy.generateAnother ||
                  activeVariantCopy.tryAnother ||
                  "Generate another"
                }
                icon={<FiRefreshCw />}
                size="sm"
                onClick={handleRefresh}
                isDisabled={loading}
                {...getQuestionToolButtonProps()}
              />
            </Flex>
            <Text fontSize="xs" color={APP_TEXT_SECONDARY} mt={2}>
              {moduleType === "vocabulary"
                ? detectiveCopy.testingVocabulary
                : detectiveCopy.testingGrammar}
            </Text>
          </Box>
        )}

        <Box
          p={{ base: 4, md: 6 }}
          bg={APP_SURFACE_ELEVATED}
          borderWidth="1px"
          borderColor={APP_BORDER}
          borderRadius="2xl"
          boxShadow="var(--app-shadow-soft)"
          style={questionSquircleStyle}
        >
          {loading ? (
            variantMeta.id === "natural_or_weird" ? (
              <NaturalOrWeirdSkeleton
                streamingQuestion={streamingQuestion}
                copy={naturalOrWeirdCopy}
                targetLang={targetLang}
                supportLang={supportLang}
              />
            ) : variantMeta.id === "three_word_challenge" ? (
              <ThreeWordChallengeSkeleton
                streamingQuestion={streamingQuestion}
                copy={threeWordChallengeCopy}
                targetLang={targetLang}
                supportLang={supportLang}
              />
            ) : variantMeta.id === "listen_difference" ? (
              <ListenDifferenceSkeleton
                streamingQuestion={streamingQuestion}
                copy={listenDifferenceCopy}
                targetLang={targetLang}
                supportLang={supportLang}
              />
            ) : variantMeta.id === "three_clue_mystery" ? (
              <ThreeClueMysterySkeleton
                streamingQuestion={streamingQuestion}
                copy={threeClueMysteryCopy}
                targetLang={targetLang}
                supportLang={supportLang}
              />
            ) : variantMeta.id === "morphology_forge" ? (
              <MorphologyForgeSkeleton
                streamingQuestion={streamingQuestion}
                copy={morphologyForgeCopy}
                targetLang={targetLang}
                supportLang={supportLang}
              />
            ) : variantMeta.id === "word_neighborhoods" ? (
              <WordNeighborhoodsSkeleton
                streamingQuestion={streamingQuestion}
                copy={wordNeighborhoodsCopy}
                targetLang={targetLang}
                supportLang={supportLang}
              />
            ) : variantMeta.id === "sentence_shapeshifter" ? (
              <SentenceShapeshifterSkeleton
                streamingQuestion={streamingQuestion}
                copy={sentenceShapeshifterCopy}
                targetLang={targetLang}
                supportLang={supportLang}
              />
            ) : variantMeta.id === "dialogue_fork" ? (
              <DialogueForkSkeleton
                streamingQuestion={streamingQuestion}
                copy={dialogueForkCopy}
                targetLang={targetLang}
                supportLang={supportLang}
              />
            ) : (
              <SentenceDetectiveSkeleton
                streamingQuestion={streamingQuestion}
                copy={detectiveCopy}
                targetLang={targetLang}
                supportLang={supportLang}
              />
            )
          ) : !question ? (
            <VStack justify="center" align="center" minH="200px" spacing={4}>
              <Text fontSize="sm" color={APP_TEXT_SECONDARY}>
                {generationError || activeVariantCopy.generationFailed}
              </Text>
              <Button
                leftIcon={<FiRefreshCw />}
                colorScheme="purple"
                onClick={handleRefresh}
                style={questionSquircleStyle}
              >
                {activeVariantCopy.tryAnother}
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
                  locked={result === true}
                  targetLang={targetLang}
                  supportLang={supportLang}
                  copy={detectiveCopy}
                  onAskAssistant={isFinalQuiz ? null : handleAskAssistant}
                  isLoadingAssistantSupport={isLoadingAssistantSupport}
                  assistantSupportText={assistantSupportText}
                  assistantLabel={t("vocab_assistant") || "Assistant"}
                />
              )}
              {question.variant === "dialogue_fork" && (
                <DialogueFork
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result === true}
                  targetLang={targetLang}
                  supportLang={supportLang}
                  copy={dialogueForkCopy}
                  onAskAssistant={isFinalQuiz ? null : handleAskAssistant}
                  isLoadingAssistantSupport={isLoadingAssistantSupport}
                  assistantSupportText={assistantSupportText}
                  assistantLabel={t("vocab_assistant") || "Assistant"}
                  onPlayAudio={handlePlay}
                  isLoadingAudio={isSynthesizingAudio}
                  isPlayingAudio={isSpeaking}
                />
              )}
              {question.variant === "sentence_shapeshifter" && (
                <SentenceShapeshifter
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result === true}
                  targetLang={targetLang}
                  supportLang={supportLang}
                  copy={sentenceShapeshifterCopy}
                  onAskAssistant={isFinalQuiz ? null : handleAskAssistant}
                  isLoadingAssistantSupport={isLoadingAssistantSupport}
                  assistantSupportText={assistantSupportText}
                  assistantLabel={t("vocab_assistant") || "Assistant"}
                  onPlayAudio={handlePlay}
                  isLoadingAudio={isSynthesizingAudio}
                  isPlayingAudio={isSpeaking}
                  onToggleSpeech={handleToggleSpeech}
                  isSpeechRecording={isSpeechRecording}
                  isSpeechConnecting={isSpeechConnecting}
                  supportsSpeech={supportsSpeech}
                  speechLabels={speechLabels}
                  onSubmit={handleSubmit}
                  canSubmit={ready}
                  submitting={submitting}
                />
              )}
              {question.variant === "word_neighborhoods" && (
                <WordNeighborhoods
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result === true}
                  wordOrder={wordOrder}
                  targetLang={targetLang}
                  supportLang={supportLang}
                  copy={wordNeighborhoodsCopy}
                  onAskAssistant={isFinalQuiz ? null : handleAskAssistant}
                  isLoadingAssistantSupport={isLoadingAssistantSupport}
                  assistantSupportText={assistantSupportText}
                  assistantLabel={t("vocab_assistant") || "Assistant"}
                />
              )}
              {question.variant === "morphology_forge" && (
                <MorphologyForge
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result === true}
                  targetLang={targetLang}
                  supportLang={supportLang}
                  copy={morphologyForgeCopy}
                  onAskAssistant={isFinalQuiz ? null : handleAskAssistant}
                  isLoadingAssistantSupport={isLoadingAssistantSupport}
                  assistantSupportText={assistantSupportText}
                  assistantLabel={t("vocab_assistant") || "Assistant"}
                />
              )}
              {question.variant === "three_clue_mystery" && (
                <ThreeClueMystery
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result === true}
                  revealedClues={revealedClues}
                  setRevealedClues={setRevealedClues}
                  targetLang={targetLang}
                  supportLang={supportLang}
                  copy={threeClueMysteryCopy}
                  onAskAssistant={isFinalQuiz ? null : handleAskAssistant}
                  isLoadingAssistantSupport={isLoadingAssistantSupport}
                  assistantSupportText={assistantSupportText}
                  assistantLabel={t("vocab_assistant") || "Assistant"}
                  onToggleSpeech={handleToggleSpeech}
                  isSpeechRecording={isSpeechRecording}
                  isSpeechConnecting={isSpeechConnecting}
                  supportsSpeech={supportsSpeech}
                  speechLabels={speechLabels}
                  onSubmit={handleSubmit}
                  canSubmit={ready}
                  submitting={submitting}
                />
              )}
              {question.variant === "listen_difference" && (
                <ListenDifference
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result === true}
                  targetLang={targetLang}
                  supportLang={supportLang}
                  copy={listenDifferenceCopy}
                  onAskAssistant={isFinalQuiz ? null : handleAskAssistant}
                  isLoadingAssistantSupport={isLoadingAssistantSupport}
                  assistantSupportText={assistantSupportText}
                  assistantLabel={t("vocab_assistant") || "Assistant"}
                  onPlayAudio={handlePlay}
                  isLoadingAudio={isSynthesizingAudio}
                  isPlayingAudio={isSpeaking}
                  onSubmit={handleSubmit}
                  canSubmit={ready}
                  submitting={submitting}
                />
              )}
              {question.variant === "three_word_challenge" && (
                <ThreeWordChallenge
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result === true}
                  targetLang={targetLang}
                  supportLang={supportLang}
                  copy={threeWordChallengeCopy}
                  onAskAssistant={isFinalQuiz ? null : handleAskAssistant}
                  isLoadingAssistantSupport={isLoadingAssistantSupport}
                  assistantSupportText={assistantSupportText}
                  assistantLabel={t("vocab_assistant") || "Assistant"}
                  onToggleSpeech={handleToggleSpeech}
                  isSpeechRecording={isSpeechRecording}
                  isSpeechConnecting={isSpeechConnecting}
                  supportsSpeech={supportsSpeech}
                  speechLabels={speechLabels}
                  onSubmit={handleSubmit}
                  canSubmit={ready}
                  submitting={submitting}
                />
              )}
              {question.variant === "natural_or_weird" && (
                <NaturalOrWeird
                  question={question}
                  response={response}
                  setResponse={setResponse}
                  locked={result === true}
                  targetLang={targetLang}
                  supportLang={supportLang}
                  copy={naturalOrWeirdCopy}
                  onAskAssistant={isFinalQuiz ? null : handleAskAssistant}
                  isLoadingAssistantSupport={isLoadingAssistantSupport}
                  assistantSupportText={assistantSupportText}
                  assistantLabel={t("vocab_assistant") || "Assistant"}
                  onPlayAudio={handlePlay}
                  isLoadingAudio={isSynthesizingAudio}
                  isPlayingAudio={isSpeaking}
                  onSubmit={handleSubmit}
                  canSubmit={ready}
                  submitting={submitting}
                />
              )}
            </>
          )}
        </Box>

        {(result === null || (!isFinalQuiz && result === false)) && (
          <VStack spacing={3} align="stretch" pt={1}>
            <HStack justify="flex-end" spacing={3} flexWrap="wrap">
              {!isFinalQuiz && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleSkipQuestion}
                  isDisabled={submitting}
                  style={questionSquircleStyle}
                >
                  {activeVariantCopy.skip || "Skip"}
                </Button>
              )}
              <Button
                colorScheme="purple"
                size="lg"
                px={{ base: 7, md: 10 }}
                isLoading={submitting}
                isDisabled={
                  loading ||
                  !ready ||
                  submitting ||
                  isSpeechRecording ||
                  isSpeechConnecting
                }
                onClick={() => handleSubmit()}
                style={questionSquircleStyle}
              >
                {submitting
                  ? activeVariantCopy.checking || "Checking…"
                  : activeVariantCopy.submit || "Check"}
              </Button>
            </HStack>
          </VStack>
        )}

        {question && result !== null && (
          <FeedbackRail
            ok={result}
            xp={recentXp}
            showNext={result === true || isFinalQuiz}
            onNext={handleNext}
            nextLabel={
              isLastQuizQuestion
                ? t("vocab_see_results") !== "vocab_see_results"
                  ? t("vocab_see_results")
                  : (supportLang === "es"
                      ? "Ver resultados"
                      : supportLang === "it"
                        ? "Vedi i risultati"
                        : supportLang === "fr"
                          ? "Voir les résultats"
                          : supportLang === "de"
                            ? "Ergebnisse ansehen"
                            : "See results")
                : activeVariantCopy?.nextQuestion
                  ? activeVariantCopy.nextQuestion.replace(/\s*→\s*$/, "")
                  : t("practice_next_question") !== "practice_next_question"
                    ? t("practice_next_question")
                    : "Next question"
            }
            t={t}
            userLanguage={supportLang}
            onExplainAnswer={isFinalQuiz ? undefined : handleExplainAnswer}
            explanationText={explanationText}
            isLoadingExplanation={isLoadingExplanation}
            lessonProgress={lessonProgress}
            onCreateNote={isFinalQuiz ? undefined : handleCreateNote}
            isCreatingNote={isCreatingNote}
            noteCreated={noteCreated}
          />
        )}
      </VStack>
    </Box>
  );
}
