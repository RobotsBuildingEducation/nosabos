import React from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  SlideFade,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiArrowRight, FiHelpCircle } from "react-icons/fi";

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
  }) => {
    if (ok === null) return null;

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
                    : t?.("practice_try_again_hint") ||
                      (userLanguage === "es"
                        ? "Repasa y vuelve a intentarlo."
                        : "Review and try again.")}
                </Text>
              </Box>
            </HStack>

            {!ok && onExplainAnswer && (
              <Button
                leftIcon={
                  isLoadingExplanation ? (
                    <Spinner size="sm" />
                  ) : (
                    <FiHelpCircle />
                  )
                }
                colorScheme="purple"
                variant="solid"
                onClick={onExplainAnswer}
                isDisabled={isLoadingExplanation || !!explanationText}
                shadow="md"
                width="full"
                py={6}
                size="lg"
              >
                {userLanguage === "es"
                  ? "Explicar mi respuesta"
                  : "Explain my answer"}
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
              bg="rgba(139, 92, 246, 0.1)"
              borderWidth="1px"
              borderColor="purple.400"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
            >
              <HStack spacing={2} mb={2}>
                <FiHelpCircle color="var(--chakra-colors-purple-400)" />
                <Text fontWeight="semibold" color="purple.300">
                  {userLanguage === "es" ? "Explicación" : "Explanation"}
                </Text>
              </HStack>
              <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.6">
                {explanationText}
              </Text>
            </Box>
          )}
        </VStack>
      </SlideFade>
    );
  }
);

FeedbackRail.displayName = "FeedbackRail";

export default FeedbackRail;

