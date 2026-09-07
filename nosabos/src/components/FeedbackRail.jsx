import React, { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ActivityActionRow from "./ActivityActionRow";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  SlideFade,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiArrowRight, FiHelpCircle } from "react-icons/fi";
import { RiBookmarkLine } from "react-icons/ri";
import ReactMarkdown from "react-markdown";
import { WaveBar } from "./WaveBar";
import RandomCharacter from "./RandomCharacter";
import useSoundSettings from "../hooks/useSoundSettings";
import { deliciousSound, clickSound, sparkleSound } from "../constants/sounds";
import VoiceOrb from "./VoiceOrb";
import {
  getQuestionFeedbackPanelProps,
  questionSquircleStyle,
  questionFeedbackAccent,
  questionToneText,
} from "./questionUiStyles";

const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_BORDER = "var(--app-border)";
const MotionBox = motion.create(Box);

/**
 * Stable, memoized feedback rail used by GrammarBook and Vocabulary.
 * Keeping this component outside of the parent renders prevents remount loops
 * (and the resulting animation flicker) when unrelated state changes.
 */
const FeedbackRail = React.memo(
  ({
    ok,
    xp,
    showNext,
    onNext,
    nextLabel,
    t,
    userLanguage,
    onExplainAnswer,
    explanationText,
    isLoadingExplanation,
    lessonProgress,
    // Note creation props
    onCreateNote,
    isCreatingNote,
    noteCreated,
    compact = false,
  }) => {
    const hasPlayedRef = useRef(false);
    const reduceMotion = useReducedMotion();
    const playSound = useSoundSettings((s) => s.playSound);

    // Play sound feedback based on answer correctness
    useEffect(() => {
      if (ok === true && !hasPlayedRef.current) {
        hasPlayedRef.current = true;
        playSound(deliciousSound);
      } else if (ok === false && !hasPlayedRef.current) {
        hasPlayedRef.current = true;
        playSound(clickSound);
      }
      // Reset when ok changes to null (new question)
      if (ok === null) {
        hasPlayedRef.current = false;
      }
    }, [ok, playSound]);

    if (ok === null) return null;

    // Note button labels
    const createNoteLabel = t?.("vocab_create_note") || "Create note";
    const noteSavedLabel = t?.("vocab_note_saved") || "Note saved!";

    const label = ok
      ? t?.("correct") || "Correct!"
      : t?.("try_again") || "Try again";

    if (compact) {
      return (
        <VStack align="stretch" spacing={3}>
          <MotionBox
            key={ok ? "correct" : "incorrect"}
            initial={
              reduceMotion ? false : { opacity: 0, y: 6, filter: "blur(3px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: reduceMotion ? 0 : 0.24,
              delay: reduceMotion ? 0 : 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            maxH="min(28dvh, 240px)"
            overflowY="auto"
            overscrollBehavior="contain"
            data-activity-feedback-content=""
            px={1}
            pt={2}
            pb={1}
          >
            <HStack align="start" spacing={3}>
              <Text
                aria-hidden="true"
                fontWeight="bold"
                color={
                  ok ? questionFeedbackAccent.ok : questionFeedbackAccent.error
                }
              >
                {ok ? "✓" : "✖"}
              </Text>
              <Box
                flex="1"
                minW={0}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <Text fontWeight="bold">
                  {label}
                  {xp > 0 ? ` · +${xp} XP` : ""}
                </Text>
              </Box>
              {onCreateNote && (
                <IconButton
                  icon={<RiBookmarkLine size={18} />}
                  aria-label={noteCreated ? noteSavedLabel : createNoteLabel}
                  variant="ghost"
                  size="sm"
                  isLoading={isCreatingNote}
                  isDisabled={isCreatingNote || noteCreated}
                  onClick={() => {
                    playSound(sparkleSound);
                    onCreateNote();
                  }}
                  flexShrink={0}
                />
              )}
            </HStack>
            {ok && lessonProgress?.total > 0 && (
              <Box mt={3}>
                <HStack
                  justify="space-between"
                  mb={2}
                  fontSize="xs"
                  color={questionToneText.secondary}
                >
                  <Text>{lessonProgress.label}</Text>
                  <Text fontWeight="semibold">
                    {Math.round(lessonProgress.pct)}%
                  </Text>
                </HStack>
                <Box
                  role="progressbar"
                  aria-label={lessonProgress.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.max(
                    0,
                    Math.min(100, Math.round(lessonProgress.pct || 0)),
                  )}
                >
                  <WaveBar
                    value={lessonProgress.pct}
                    height={14}
                    start="#4aa8ff"
                    end="#75f8ff"
                    bg="rgba(125, 211, 252, 0.12)"
                    border="rgba(125, 211, 252, 0.24)"
                  />
                </Box>
              </Box>
            )}
            {!ok && onExplainAnswer && !explanationText && (
              <Button
                mt={3}
                size="sm"
                w="full"
                justifyContent="center"
                textAlign="center"
                variant="solid"
                bg="var(--app-surface-elevated)"
                color={questionToneText.primary}
                border="1px solid var(--question-error-accent)"
                borderRadius="18px"
                boxShadow="0 3px 0 var(--question-error-bg)"
                _hover={{ bg: "var(--app-surface-muted)" }}
                _active={{ transform: "translateY(1px)", boxShadow: "none" }}
                _focusVisible={{
                  outline: "2px solid var(--question-error-accent)",
                  outlineOffset: "2px",
                }}
                leftIcon={<FiHelpCircle />}
                onClick={onExplainAnswer}
                isLoading={isLoadingExplanation}
                whiteSpace="normal"
                height="auto"
                minH="40px"
              >
                {t?.("flashcard_explain_answer") || "Explain my answer"}
              </Button>
            )}
            {!ok && explanationText && (
              <Box
                mt={2}
                fontSize="sm"
                lineHeight="1.6"
                sx={{
                  "& p": { mb: 2, unicodeBidi: "plaintext" },
                  "& ul, & ol": { ps: 4 },
                }}
              >
                <ReactMarkdown>{explanationText}</ReactMarkdown>
              </Box>
            )}
          </MotionBox>
          {showNext && (
            <ActivityActionRow
              tone={ok ? "success" : "danger"}
              primary={
                <Button
                  rightIcon={<FiArrowRight />}
                  colorScheme={ok ? "teal" : "red"}
                  onClick={onNext}
                  width="full"
                  minH="48px"
                  height="auto"
                  py={3}
                  whiteSpace="normal"
                  size="lg"
                >
                  {nextLabel}
                </Button>
              }
            />
          )}
        </VStack>
      );
    }

    return (
      <SlideFade in={true} offsetY="10px">
        <VStack spacing={3} align="stretch">
          <VStack
            spacing={3}
            align="stretch"
            p={4}
            borderRadius="xl"
            {...getQuestionFeedbackPanelProps({ ok })}
          >
            <HStack spacing={3} align="center">
              <Flex
                w="44px"
                h="44px"
                rounded="full"
                align="center"
                justify="center"
                bg={
                  ok ? questionFeedbackAccent.ok : questionFeedbackAccent.error
                }
                color="white"
                fontWeight="bold"
                fontSize="lg"
                boxShadow="var(--question-feedback-shadow)"
                flexShrink={0}
              >
                {ok ? "✓" : "✖"}
              </Flex>
              <Box flex="1">
                <Text fontWeight="semibold" color={questionToneText.primary}>
                  {label}
                </Text>
                <Text fontSize="sm" color={questionToneText.secondary}>
                  {xp > 0
                    ? `+${xp} XP`
                    : ok
                    ? t?.("practice_next_ready") ||
                      "Great work! Keep the streak going."
                    : t?.("practice_try_again_hint") ||
                      (userLanguage === "pt"
                        ? "Revise e tente novamente."
                        : userLanguage === "de"
                        ? "Überprüfe es und versuche es erneut."
                        : userLanguage === "es"
                        ? "Repasa y vuelve a intentarlo."
                        : userLanguage === "ja"
                        ? "復習してもう一度試しましょう。"
                        : "Review and try again.")}
                </Text>
              </Box>
              {/* Create Note Button - icon only */}
              {onCreateNote && (
                <IconButton
                  icon={
                    isCreatingNote ? (
                      <VoiceOrb
                        state={
                          ["idle", "listening", "speaking"][
                            Math.floor(Math.random() * 3)
                          ]
                        }
                        size={16}
                      />
                    ) : (
                      <RiBookmarkLine size={18} />
                    )
                  }
                  aria-label={noteCreated ? noteSavedLabel : createNoteLabel}
                  colorScheme={noteCreated ? "green" : "gray"}
                  variant={noteCreated ? "solid" : "ghost"}
                  onClick={() => {
                    playSound(sparkleSound);
                    onCreateNote();
                  }}
                  isDisabled={isCreatingNote || noteCreated}
                  size="sm"
                  flexShrink={0}
                />
              )}
            </HStack>

            {ok && lessonProgress && lessonProgress.total > 0 && (
              <VStack align="center" spacing={2} mt={2} px={1} width="full">
                <HStack
                  justify="center"
                  align="center"
                  spacing={3}
                  fontSize="xs"
                >
                  <Text
                    color={questionToneText.secondary}
                    fontWeight="semibold"
                    textAlign="center"
                  >
                    {lessonProgress.label}
                  </Text>
                  <Text
                    color={questionToneText.secondary}
                    fontWeight="semibold"
                    textAlign="center"
                  >
                    {Math.round(lessonProgress.pct)}%
                  </Text>
                </HStack>
                <Box width="60%" mx="auto">
                  <WaveBar
                    value={lessonProgress.pct}
                    height={20}
                    start="#4aa8ff"
                    end="#75f8ffff"
                  />
                </Box>
              </VStack>
            )}

            {!ok && onExplainAnswer && (
              <Button
                leftIcon={
                  isLoadingExplanation ? (
                    <VoiceOrb
                      state={
                        ["idle", "listening", "speaking"][
                          Math.floor(Math.random() * 3)
                        ]
                      }
                      size={24}
                    />
                  ) : (
                    <FiHelpCircle />
                  )
                }
                colorScheme={undefined}
                bg="#d8a4b6"
                color="#432b33"
                border="1px solid"
                borderColor="rgba(176, 94, 122, 0.28)"
                boxShadow="0px 4px 0px #c08aa0"
                _hover={{
                  bg: "#d3a0b2",
                  boxShadow: "0px 4px 0px #c08aa0",
                  transform: "translateY(-1px)",
                }}
                _active={{
                  bg: "#c992a6",
                  boxShadow: "0px 2px 0px #c08aa0",
                  transform: "translateY(2px)",
                }}
                _disabled={{
                  opacity: 0.7,
                  cursor: "not-allowed",
                  boxShadow: "0px 4px 0px #c08aa0",
                }}
                onClick={onExplainAnswer}
                isDisabled={isLoadingExplanation || !!explanationText}
                width="full"
                py={6}
                size="lg"
              >
                {t?.("flashcard_explain_answer") || "Explain the answer"}
              </Button>
            )}

            {showNext && (
              <Button
                rightIcon={<FiArrowRight />}
                colorScheme="cyan"
                variant="solid"
                onClick={onNext}
                shadow="md"
                width="full"
                py={6}
                size="lg"
              >
                {nextLabel}
              </Button>
            )}
          </VStack>

          {!ok && explanationText && (
            <Box
              p={4}
              mb={6}
              borderRadius="lg"
              style={questionSquircleStyle}
              bg={APP_SURFACE_ELEVATED}
              borderWidth="1px"
              borderColor={APP_BORDER}
              boxShadow="var(--question-feedback-shadow)"
            >
              <HStack spacing={2} mb={2}>
                <FiHelpCircle color="var(--question-tool-accent)" />
                <Text fontWeight="semibold" color={questionToneText.primary}>
                  {t?.("flashcard_explanation_heading") || "Explanation"}
                </Text>
              </HStack>
              <Box
                fontSize="md"
                color={questionToneText.primary}
                lineHeight="1.6"
                pb={4}
                sx={{
                  "& p": { mb: 2, unicodeBidi: "plaintext" },
                  "& p:last-child": { mb: 2 },
                  "& strong": {
                    fontWeight: "bold",
                    color: "var(--question-tool-accent)",
                  },
                  "& em": { fontStyle: "italic" },
                  "& ul, & ol": { pl: 4, mb: 2 },
                  "& li": { mb: 1, unicodeBidi: "plaintext" },
                  "& code": {
                    bg: "var(--app-surface-muted)",
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
          <Box mt="-6" paddingBottom={6}>
            <RandomCharacter />
          </Box>
        </VStack>
      </SlideFade>
    );
  },
);

FeedbackRail.displayName = "FeedbackRail";

export default FeedbackRail;
