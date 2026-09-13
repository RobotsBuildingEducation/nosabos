import React from "react";
import {
  Box,
  HStack,
  VStack,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";
import { questionSquircleStyle } from "../../components/questionUiStyles";

const SKELETON_START = "var(--app-surface-muted, rgba(255, 255, 255, 0.08))";
const SKELETON_END = "var(--app-surface-elevated, rgba(255, 255, 255, 0.18))";
const panel = {
  bg: "var(--app-surface-elevated)",
  borderWidth: "1px",
  borderColor: "var(--app-border)",
  borderRadius: "24px",
};

export function RadioStorySkeleton() {
  return (
    <VStack align="stretch" spacing={5} maxW="760px" mx="auto" w="100%">
      {/* Title skeleton */}
      <Box>
        <Skeleton
          height="22px"
          width="180px"
          borderRadius="md"
          startColor={SKELETON_START}
          endColor={SKELETON_END}
        />
      </Box>

      {/* Radio player card skeleton */}
      <VStack
        {...panel}
        p={{ base: 6, md: 8 }}
        spacing={6}
        bg="linear-gradient(145deg, var(--app-surface-elevated), var(--app-surface-muted))"
        align="stretch"
      >
        <HStack justify="space-between" align="center">
          <Skeleton
            height="22px"
            width="88px"
            borderRadius="full"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Skeleton
            height="18px"
            width="64px"
            borderRadius="md"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
        </HStack>

        {/* Audio frequency wave bars placeholder */}
        <HStack spacing={2} justify="center" h="50px" align="center">
          {[28, 44, 32, 48, 24, 38, 20].map((h, i) => (
            <Skeleton
              key={`bar-${i}`}
              height={`${h}px`}
              width="6px"
              borderRadius="full"
              startColor="rgba(45, 212, 191, 0.2)"
              endColor="rgba(45, 212, 191, 0.5)"
            />
          ))}
        </HStack>

        {/* Current speaker info placeholder */}
        <HStack spacing={3} justify="center">
          <SkeletonCircle
            size="36px"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <VStack spacing={1.5} align="start">
            <Skeleton
              height="14px"
              width="70px"
              borderRadius="sm"
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="10px"
              width="45px"
              borderRadius="sm"
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
          </VStack>
        </HStack>
      </VStack>

      {/* Transcript bubbles placeholder */}
      <VStack spacing={3} align="stretch">
        <HStack spacing={3} maxW="85%" align="flex-start">
          <SkeletonCircle
            size="32px"
            flexShrink={0}
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Box
            p={3.5}
            borderRadius="xl"
            bg="var(--app-surface-elevated)"
            border="1px solid var(--app-border)"
            flex="1"
          >
            <Skeleton
              height="12px"
              width="50px"
              mb={2}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="16px"
              width="90%"
              mb={1.5}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="14px"
              width="65%"
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
          </Box>
        </HStack>

        <HStack spacing={3} maxW="85%" align="flex-start" alignSelf="flex-end">
          <Box
            p={3.5}
            borderRadius="xl"
            bg="rgba(45, 212, 191, 0.12)"
            border="1px solid rgba(45, 212, 191, 0.25)"
            flex="1"
          >
            <Skeleton
              height="12px"
              width="40px"
              mb={2}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="16px"
              width="85%"
              mb={1.5}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="14px"
              width="50%"
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
          </Box>
          <SkeletonCircle
            size="32px"
            flexShrink={0}
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
        </HStack>
      </VStack>

      {/* Checkpoint question placeholder */}
      <Box
        {...panel}
        p={{ base: 4, md: 6 }}
        bg="var(--app-surface-elevated)"
      >
        <Skeleton
          height="18px"
          width="65%"
          borderRadius="md"
          mb={4}
          startColor={SKELETON_START}
          endColor={SKELETON_END}
        />
        <VStack spacing={2.5} align="stretch">
          <Skeleton
            height="48px"
            borderRadius="xl"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
            style={questionSquircleStyle}
          />
          <Skeleton
            height="48px"
            borderRadius="xl"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
            style={questionSquircleStyle}
          />
        </VStack>
      </Box>
    </VStack>
  );
}

export function ConversationStorySkeleton() {
  return (
    <VStack align="stretch" spacing={5} maxW="760px" mx="auto" w="100%">
      {/* Title skeleton */}
      <Box>
        <Skeleton
          height="22px"
          width="200px"
          borderRadius="md"
          startColor={SKELETON_START}
          endColor={SKELETON_END}
        />
      </Box>

      {/* Conversation card skeleton */}
      <VStack
        {...panel}
        p={{ base: 5, md: 6 }}
        spacing={4}
        align="stretch"
        bg="var(--app-surface-elevated)"
      >
        {/* Turn 1 (Left) */}
        <HStack spacing={3} align="flex-start" justify="flex-start">
          <SkeletonCircle
            size="36px"
            flexShrink={0}
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Box
            bg="var(--app-surface-muted)"
            p={3.5}
            borderRadius="2xl"
            borderTopLeftRadius="sm"
            flex="1"
            maxW="78%"
          >
            <Skeleton
              height="12px"
              width="55px"
              mb={2}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="16px"
              width="90%"
              mb={1.5}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="14px"
              width="60%"
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
          </Box>
        </HStack>

        {/* Turn 2 (Right) */}
        <HStack spacing={3} align="flex-start" justify="flex-end">
          <Box
            bg="rgba(99, 102, 241, 0.12)"
            p={3.5}
            borderRadius="2xl"
            borderTopRightRadius="sm"
            flex="1"
            maxW="75%"
          >
            <Skeleton
              height="12px"
              width="45px"
              mb={2}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="16px"
              width="85%"
              mb={1.5}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="14px"
              width="50%"
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
          </Box>
          <SkeletonCircle
            size="36px"
            flexShrink={0}
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
        </HStack>

        {/* Turn 3 (Left) */}
        <HStack spacing={3} align="flex-start" justify="flex-start">
          <SkeletonCircle
            size="36px"
            flexShrink={0}
            startColor={SKELETON_START}
            endColor={SKELETON_END}
          />
          <Box
            bg="var(--app-surface-muted)"
            p={3.5}
            borderRadius="2xl"
            borderTopLeftRadius="sm"
            flex="1"
            maxW="82%"
          >
            <Skeleton
              height="12px"
              width="60px"
              mb={2}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="16px"
              width="95%"
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
          </Box>
        </HStack>
      </VStack>

      {/* Checkpoint question placeholder */}
      <Box
        {...panel}
        p={{ base: 4, md: 6 }}
        bg="var(--app-surface-elevated)"
      >
        <Skeleton
          height="18px"
          width="60%"
          borderRadius="md"
          mb={4}
          startColor={SKELETON_START}
          endColor={SKELETON_END}
        />
        <VStack spacing={2.5} align="stretch">
          <Skeleton
            height="48px"
            borderRadius="xl"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
            style={questionSquircleStyle}
          />
          <Skeleton
            height="48px"
            borderRadius="xl"
            startColor={SKELETON_START}
            endColor={SKELETON_END}
            style={questionSquircleStyle}
          />
        </VStack>
      </Box>
    </VStack>
  );
}

export function PracticeStorySkeleton() {
  return (
    <VStack align="stretch" spacing={5} maxW="760px" mx="auto" w="100%">
      {/* Title skeleton */}
      <Box>
        <Skeleton
          height="22px"
          width="220px"
          borderRadius="md"
          startColor={SKELETON_START}
          endColor={SKELETON_END}
        />
      </Box>

      {/* Practice sentences card skeleton */}
      <Box
        bg="var(--app-surface-elevated)"
        p={6}
        rounded="20px"
        border="1px solid var(--app-border)"
        boxShadow="var(--app-shadow-soft)"
        style={questionSquircleStyle}
      >
        <VStack spacing={4} align="stretch">
          {/* Sentence 1 (Left) */}
          <HStack spacing={3} align="flex-start" justify="flex-start">
            <SkeletonCircle
              size="36px"
              flexShrink={0}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Skeleton
              height="28px"
              width="28px"
              borderRadius="md"
              flexShrink={0}
              mt={1}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <Box
              bg="rgba(56, 178, 172, 0.15)"
              p={3}
              borderRadius="lg"
              borderLeft="3px solid rgba(56, 178, 172, 0.5)"
              flex="1"
              maxW="85%"
              style={questionSquircleStyle}
            >
              <Skeleton
                height="14px"
                width="60px"
                mb={2}
                startColor={SKELETON_START}
                endColor={SKELETON_END}
              />
              <Skeleton
                height="18px"
                width="85%"
                mb={1.5}
                startColor={SKELETON_START}
                endColor={SKELETON_END}
              />
              <Skeleton
                height="14px"
                width="55%"
                startColor={SKELETON_START}
                endColor={SKELETON_END}
              />
            </Box>
          </HStack>

          {/* Sentence 2 (Right) */}
          <HStack spacing={3} align="flex-start" justify="flex-end">
            <Box
              bg="rgba(99, 102, 241, 0.15)"
              p={3}
              borderRadius="lg"
              borderRight="3px solid rgba(99, 102, 241, 0.5)"
              flex="1"
              maxW="85%"
              style={questionSquircleStyle}
            >
              <Skeleton
                height="14px"
                width="50px"
                mb={2}
                startColor={SKELETON_START}
                endColor={SKELETON_END}
              />
              <Skeleton
                height="18px"
                width="90%"
                mb={1.5}
                startColor={SKELETON_START}
                endColor={SKELETON_END}
              />
              <Skeleton
                height="14px"
                width="60%"
                startColor={SKELETON_START}
                endColor={SKELETON_END}
              />
            </Box>
            <Skeleton
              height="28px"
              width="28px"
              borderRadius="md"
              flexShrink={0}
              mt={1}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
            <SkeletonCircle
              size="36px"
              flexShrink={0}
              startColor={SKELETON_START}
              endColor={SKELETON_END}
            />
          </HStack>
        </VStack>
      </Box>

      {/* Microphone primary action button placeholder */}
      <HStack justify="center" mt={4}>
        <Skeleton
          height="56px"
          width="160px"
          borderRadius="full"
          startColor={SKELETON_START}
          endColor={SKELETON_END}
        />
      </HStack>
    </VStack>
  );
}

export default function StorySkeleton({ variant = "radio" }) {
  if (variant === "radio") {
    return <RadioStorySkeleton />;
  }
  if (variant === "speaking" || variant === "practice") {
    return <PracticeStorySkeleton />;
  }
  return <ConversationStorySkeleton />;
}
