import React from "react";
import {
  Box,
  HStack,
  VStack,
  Skeleton,
  SkeletonCircle,
  Text,
} from "@chakra-ui/react";
import AnimatedEllipsis from "./AnimatedEllipsis";
import { questionSquircleStyle } from "./questionUiStyles";

const SKELETON_START = "var(--app-surface-muted, rgba(255, 255, 255, 0.08))";
const SKELETON_END = "var(--app-surface-elevated, rgba(255, 255, 255, 0.18))";

export function HistoryLectureSkeleton({ statusText = "Creating lecture…" }) {
  return (
    <VStack align="stretch" spacing={4} w="100%" py={1}>
      {/* Title skeleton */}
      <Skeleton
        height="28px"
        width="60%"
        borderRadius="md"
        startColor={SKELETON_START}
        endColor={SKELETON_END}
      />

      {/* TTS controls placeholder */}
      <HStack spacing={4} justify="center" py={1}>
        <VStack spacing={1}>
          <SkeletonCircle
            size="32px"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Skeleton
            height="10px"
            width="48px"
            borderRadius="xs"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
        </VStack>
        <VStack spacing={1}>
          <SkeletonCircle
            size="32px"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Skeleton
            height="10px"
            width="36px"
            borderRadius="xs"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
        </VStack>
      </HStack>

      {/* Article reading box placeholder */}
      <Box
        bg="rgba(56, 178, 172, 0.12)"
        borderLeft="3px solid"
        borderColor="teal.400"
        rounded="lg"
        style={questionSquircleStyle}
        p={4}
      >
        <VStack spacing={2.5} align="stretch">
          <Skeleton
            height="16px"
            width="96%"
            borderRadius="sm"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Skeleton
            height="16px"
            width="90%"
            borderRadius="sm"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Skeleton
            height="16px"
            width="72%"
            borderRadius="sm"
            mb={2}
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Skeleton
            height="16px"
            width="94%"
            borderRadius="sm"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Skeleton
            height="16px"
            width="86%"
            borderRadius="sm"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Skeleton
            height="16px"
            width="58%"
            borderRadius="sm"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
        </VStack>
      </Box>

      {/* Subtle status indicator */}
      <HStack spacing={2} justify="center" pt={2} opacity={0.75}>
        <Text fontSize="xs" fontWeight="500" color="var(--app-text-secondary)">
          {statusText}
        </Text>
        <AnimatedEllipsis color="teal.400" ariaLabel={statusText} />
      </HStack>
    </VStack>
  );
}

export function HistoryQuestionSkeleton({ statusText = "Generating question…" }) {
  return (
    <VStack align="stretch" spacing={3} w="100%" py={1}>
      <Box
        p={4}
        rounded="xl"
        borderWidth="1px"
        borderColor="var(--app-border, rgba(255, 255, 255, 0.1))"
        bg="var(--app-surface-elevated, rgba(255, 255, 255, 0.04))"
        style={questionSquircleStyle}
      >
        <Skeleton
          height="18px"
          width="75%"
          borderRadius="md"
          mb={4}
          startColor={SKELETON_START}
          endColor={SKELETON_END}
        />
        <VStack spacing={2.5} align="stretch">
          <Skeleton
            height="44px"
            borderRadius="lg"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
            style={questionSquircleStyle}
          />
          <Skeleton
            height="44px"
            borderRadius="lg"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
            style={questionSquircleStyle}
          />
          <Skeleton
            height="44px"
            borderRadius="lg"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
            style={questionSquircleStyle}
          />
        </VStack>
      </Box>

      {/* Subtle status indicator */}
      <HStack spacing={2} justify="center" pt={1} opacity={0.75}>
        <Text fontSize="xs" fontWeight="500" color="var(--app-text-secondary)">
          {statusText}
        </Text>
        <AnimatedEllipsis color="teal.400" ariaLabel={statusText} />
      </HStack>
    </VStack>
  );
}
