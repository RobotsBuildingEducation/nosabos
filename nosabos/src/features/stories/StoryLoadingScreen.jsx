import React from "react";
import { Box, Button, Center, HStack, Text, VStack } from "@chakra-ui/react";
import AnimatedEllipsis from "../../components/AnimatedEllipsis";
import ActivityActionRow from "../../components/ActivityActionRow";
import QuestionActionArea from "../../components/QuestionActionArea";
import StorySkeleton from "./StorySkeletons";

export default function StoryLoadingScreen({
  title,
  subtitle,
  error = null,
  onRetry = null,
  retryLabel = "Try again",
  onSkip = null,
  skipLabel = "Skip",
  variant = "radio",
  minH = "320px",
}) {
  if (error) {
    return (
      <Box
        minH={minH}
        py={{ base: 8, md: 16 }}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        w="100%"
      >
        <Center flex="1">
          <VStack spacing={4} textAlign="center" maxW="440px" px={4}>
            <Text
              role="alert"
              color="var(--app-text-primary)"
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="600"
            >
              {error}
            </Text>
            {onRetry && (
              <Button
                onClick={onRetry}
                colorScheme="teal"
                rounded="full"
                px={6}
              >
                {retryLabel}
              </Button>
            )}
          </VStack>
        </Center>
        {onSkip && (
          <Box w="full" maxW="720px" mx="auto" mt={8}>
            <QuestionActionArea
              actions={
                <ActivityActionRow>
                  <Button
                    onClick={onSkip}
                    variant="ghost"
                    color="var(--app-text-primary)"
                    _hover={{ bg: "var(--app-surface-muted)" }}
                    width="fit-content"
                  >
                    {skipLabel}
                  </Button>
                </ActivityActionRow>
              }
            />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box w="100%" maxW="760px" mx="auto" py={{ base: 2, md: 4 }}>
      {/* Subtle status indicator */}
      {title && (
        <HStack spacing={2} justify="center" mb={4} opacity={0.75}>
          <Text fontSize="xs" fontWeight="500" color="var(--app-text-secondary)">
            {title}
          </Text>
          <AnimatedEllipsis color="teal.400" ariaLabel={title || "Loading"} />
        </HStack>
      )}

      {/* Bespoke Story Skeleton */}
      <StorySkeleton variant={variant} />

      {/* Skip button in QuestionActionArea */}
      {onSkip && (
        <Box w="full" maxW="760px" mx="auto" mt={8}>
          <QuestionActionArea
            actions={
              <ActivityActionRow>
                <Button
                  onClick={onSkip}
                  variant="ghost"
                  color="var(--app-text-primary)"
                  _hover={{ bg: "var(--app-surface-muted)" }}
                  width="fit-content"
                >
                  {skipLabel}
                </Button>
              </ActivityActionRow>
            }
          />
        </Box>
      )}
    </Box>
  );
}
