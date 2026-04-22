import React, { useEffect, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  SlideFade, Text,
  VStack,
} from "@chakra-ui/react";
import { FiArrowRight, FiHelpCircle } from "react-icons/fi";
import { RiBookmarkLine } from "react-icons/ri";
import ReactMarkdown from "react-markdown";
import { WaveBar } from "./WaveBar";
import RandomCharacter from "./RandomCharacter";
import useSoundSettings from "../hooks/useSoundSettings";
import deliciousSound from "../assets/delicious.mp3";
import clickSound from "../assets/click.mp3";
import sparkleSound from "../assets/sparkle.mp3";
import VoiceOrb from "./VoiceOrb";
import {
  getQuestionFeedbackPanelProps,
  questionFeedbackAccent,
  questionToneText,
} from "./questionUiStyles";

const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_BORDER = "var(--app-border)";

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
  }) => {
    const hasPlayedRef = useRef(false);
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
                bg={ok ? questionFeedbackAccent.ok : questionFeedbackAccent.error}
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
                      (userLanguage === "es"
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
                      <VoiceOrb state={["idle","listening","speaking"][Math.floor(Math.random()*3)]} size={16} />
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
                    <VoiceOrb state={["idle","listening","speaking"][Math.floor(Math.random()*3)]} size={24} />
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
                  "& p": { mb: 2 },
                  "& p:last-child": { mb: 2 },
                  "& strong": {
                    fontWeight: "bold",
                    color: "var(--question-tool-accent)",
                  },
                  "& em": { fontStyle: "italic" },
                  "& ul, & ol": { pl: 4, mb: 2 },
                  "& li": { mb: 1 },
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
  }
);

FeedbackRail.displayName = "FeedbackRail";

export default FeedbackRail;
