import React from "react";
import { Box, Button, Flex, HStack, SlideFade, Text } from "@chakra-ui/react";
import { FiArrowRight } from "react-icons/fi";

/**
 * Stable, memoized feedback rail used by GrammarBook and Vocabulary.
 * Keeping this component outside of the parent renders prevents remount loops
 * (and the resulting animation flicker) when unrelated state changes.
 */
const FeedbackRail = React.memo(
  ({ ok, xp, showNext, onNext, nextLabel, t, userLanguage }) => {
    if (ok === null) return null;

    const label = ok
      ? t?.("correct") || "Correct!"
      : t?.("try_again") || "Try again";

    return (
      <SlideFade in={true} offsetY="10px">
        <Flex
          align={{ base: "center", md: "center" }}
          direction={{ base: "row", md: "row" }}
          justify="space-between"
          gap={3}
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
          <HStack spacing={3} flex="1" align="center">
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
            >
              {ok ? "✓" : "✖"}
            </Flex>
            <Box>
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
          {showNext ? (
            <Button
              rightIcon={<FiArrowRight />}
              colorScheme="cyan"
              variant="solid"
              onClick={onNext}
              shadow="md"
              px={{ base: 7, md: 12 }}
              py={{ base: 3, md: 4 }}
              alignSelf="flex-end"
            >
              {nextLabel}
            </Button>
          ) : null}
        </Flex>
      </SlideFade>
    );
  }
);

FeedbackRail.displayName = "FeedbackRail";

export default FeedbackRail;

