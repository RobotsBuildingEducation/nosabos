import React from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  SlideFade,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiArrowRight, FiHelpCircle } from "react-icons/fi";
import { RiBookmarkLine } from "react-icons/ri";
import ReactMarkdown from "react-markdown";
import { WaveBar } from "./WaveBar";

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
    onExplainAnswer,
    explanationText,
    isLoadingExplanation,
    lessonProgress,
    // Note creation props
    onCreateNote,
    isCreatingNote,
    noteCreated,
  }) => {
    if (ok === null) return null;

    // Note button labels
    const createNoteLabel = t?.("feedback_create_note") || "Create note";
    const noteSavedLabel = t?.("feedback_note_saved") || "Note saved!";

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
            bg={
              ok
                ? "linear-gradient(90deg, rgba(72,187,120,0.16), rgba(56,161,105,0.08))"
                : "linear-gradient(90deg, rgba(245,101,101,0.16), rgba(229,62,62,0.08))"
            }
            borderWidth="1px"
            borderColor={ok ? "green.400" : "red.300"}
            boxShadow="0 12px 30px rgba(0, 0, 0, 0.3)"
          >
            <HStack spacing={3} align="center">
              <Flex
                w="44px"
                h="44px"
                rounded="full"
                align="center"
                justify="center"
                bg={ok ? "green.500" : "red.500"}
                color="white"
                fontWeight="bold"
                fontSize="lg"
                boxShadow="0 10px 24px rgba(0,0,0,0.22)"
                flexShrink={0}
              >
                {ok ? "✓" : "✖"}
              </Flex>
              <Box flex="1">
                <Text fontWeight="semibold">{label}</Text>
                <Text fontSize="sm" color="whiteAlpha.800">
                  {xp > 0
                    ? `+${xp} XP`
                    : ok
                    ? t?.("practice_next_ready") ||
                      "Great work! Keep the streak going."
                    : t?.("practice_try_again_hint") || "Review and try again."}
                </Text>
              </Box>
              {/* Create Note Button - icon only */}
              {onCreateNote && (
                <IconButton
                  icon={
                    isCreatingNote ? (
                      <Spinner size="xs" />
                    ) : (
                      <RiBookmarkLine size={18} />
                    )
                  }
                  aria-label={noteCreated ? noteSavedLabel : createNoteLabel}
                  colorScheme={noteCreated ? "green" : "gray"}
                  variant={noteCreated ? "solid" : "ghost"}
                  onClick={onCreateNote}
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
                    color="whiteAlpha.800"
                    fontWeight="semibold"
                    textAlign="center"
                  >
                    {lessonProgress.label}
                  </Text>
                  <Text
                    color="whiteAlpha.800"
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
                    <Spinner size="sm" />
                  ) : (
                    <FiHelpCircle />
                  )
                }
                colorScheme="pink"
                onClick={onExplainAnswer}
                isDisabled={isLoadingExplanation || !!explanationText}
                width="full"
                py={6}
                size="lg"
              >
                {t?.("feedback_explain_answer") || "Explain the answer"}
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
              borderRadius="lg"
              bg="rgba(246, 92, 174, 0.1)"
              borderWidth="1px"
              borderColor="pink.400"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
            >
              <HStack spacing={2} mb={2}>
                <FiHelpCircle color="var(--chakra-colors-pink-400)" />
                <Text fontWeight="semibold" color="pink.300">
                  {t?.("feedback_explanation_title") || "Explanation"}
                </Text>
              </HStack>
              <Box
                fontSize="md"
                color="whiteAlpha.900"
                lineHeight="1.6"
                sx={{
                  "& p": { mb: 2 },
                  "& p:last-child": { mb: 0 },
                  "& strong": { fontWeight: "bold", color: "purple.200" },
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
      </SlideFade>
    );
  }
);

FeedbackRail.displayName = "FeedbackRail";

export default FeedbackRail;
