import React, { useEffect, useState } from "react";
import { keyframes } from "@emotion/react";
import { Box, Button, HStack, Text, usePrefersReducedMotion, VStack } from "@chakra-ui/react";
import { FiCheck, FiInfo } from "react-icons/fi";
import AnimatedEllipsis from "./AnimatedEllipsis";
import CompanionRewardDance from "./CompanionRewardDance";
import { useThemeStore } from "../useThemeStore";
import useSoundSettings from "../hooks/useSoundSettings";
import { selectSound } from "../constants/sounds";

import { IMMERSION_COPY } from "./immersionCopy";

const rewardCheckPulse = keyframes`
  0% { transform: scale(0.65) rotate(-18deg); }
  48% { transform: scale(1.25) rotate(9deg); }
  72% { transform: scale(0.94) rotate(-3deg); }
  100% { transform: scale(1) rotate(0); }
`;
const rewardCheckRing = keyframes`
  0% { opacity: 0.8; transform: scale(0.5); }
  100% { opacity: 0; transform: scale(1.9); }
`;
const rewardRowBloom = keyframes`
  0%, 100% { transform: translateY(0); box-shadow: none; }
  45% { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(20, 184, 166, 0.18); }
`;
const rewardRowSweep = keyframes`
  0% { opacity: 0; transform: translateX(-130%) skewX(-18deg); }
  30% { opacity: 0.7; }
  100% { opacity: 0; transform: translateX(250%) skewX(-18deg); }
`;
const rewardCardEnter = keyframes`
  0% { opacity: 0; transform: translateY(18px) scale(0.9); }
  62% { opacity: 1; transform: translateY(-4px) scale(1.025); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;
const rewardSparkBurst = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.2) rotate(0deg); }
  18% { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--spark-x)), calc(-50% + var(--spark-y))) scale(0.8) rotate(var(--spark-turn)); }
`;
const REWARD_SPARKS = [
  { x: "-132px", y: "-46px", turn: "-90deg", color: "#2dd4bf", size: 7 },
  { x: "-104px", y: "-82px", turn: "75deg", color: "#fbbf24", size: 9 },
  { x: "-56px", y: "-91px", turn: "110deg", color: "#67e8f9", size: 6 },
  { x: "12px", y: "-99px", turn: "-120deg", color: "#fbbf24", size: 8 },
  { x: "81px", y: "-76px", turn: "90deg", color: "#5eead4", size: 7 },
  { x: "129px", y: "-38px", turn: "120deg", color: "#fda4af", size: 9 },
  { x: "137px", y: "29px", turn: "-95deg", color: "#67e8f9", size: 6 },
  { x: "95px", y: "77px", turn: "85deg", color: "#fbbf24", size: 8 },
  { x: "18px", y: "94px", turn: "-110deg", color: "#2dd4bf", size: 7 },
  { x: "-61px", y: "78px", turn: "100deg", color: "#fda4af", size: 8 },
  { x: "-126px", y: "33px", turn: "-90deg", color: "#fbbf24", size: 7 },
];

export function ImmersionTasksContent({ immersion, appLanguage = "en", petType = "ghost", showHeading = true }) {
  const copy = IMMERSION_COPY[appLanguage] || IMMERSION_COPY.en;
  const isLight = useThemeStore((state) => state.themeMode) === "light";
  const prefersReducedMotion = usePrefersReducedMotion();
  const playSound = useSoundSettings((state) => state.playSound);
  const tasks = immersion?.tasks || [];
  const completed = immersion?.completed || [];
  const allDone = tasks.length > 0 && completed.length === tasks.length && completed.every(Boolean);
  const celebrating = Boolean(immersion?.rewardJustAwarded && immersion?.rewarded && allDone);
  const [rewardMessage, setRewardMessage] = useState(() => ({
    dayKey: immersion?.dayKey,
    index: Math.floor(Math.random() * copy.encouragements.length),
  }));
  const rewardMessageIndex = rewardMessage?.dayKey === immersion?.dayKey
    ? rewardMessage.index
    : null;

  useEffect(() => {
    if (!immersion?.rewarded || !allDone || rewardMessage?.dayKey === immersion?.dayKey) return;
    setRewardMessage({
      dayKey: immersion.dayKey,
      index: Math.floor(Math.random() * copy.encouragements.length),
    });
  }, [immersion?.dayKey, immersion?.rewarded, allDone, rewardMessage?.dayKey, copy.encouragements.length]);

  const handleToggle = (index) => {
    playSound(selectSound);
    immersion?.toggleTask?.(index);
  };

  return (
    <VStack as="section" aria-label={copy.title} align="stretch" spacing={3}>
      {showHeading && (
        <HStack align="start" justify="space-between" spacing={3}>
          <Box>
            <Text fontWeight="bold" color="var(--app-text-primary)">{copy.title}</Text>
            <Text fontSize="sm" color="var(--app-text-secondary)">{copy.subtitle}</Text>
          </Box>
          {!immersion?.awaitingPlacement && (
            <Text fontSize="xs" fontWeight="bold" color="var(--app-text-muted)" flexShrink={0}>
              {completed.filter(Boolean).length}/{immersion?.goal ? 4 : 3}
            </Text>
          )}
        </HStack>
      )}

      {immersion?.awaitingPlacement && (
        <HStack align="start" spacing={3} p={4} border="1px solid var(--app-border)"
          borderRadius="16px" bg="var(--app-surface-muted)" role="status">
          <Box color="teal.500" pt={0.5} flexShrink={0}><FiInfo size={18} aria-hidden="true" /></Box>
          <Text fontSize="sm" color="var(--app-text-secondary)" lineHeight="1.5">
            {copy.placementNeeded}
          </Text>
        </HStack>
      )}

      {tasks.map((task, index) => {
        const checked = Boolean(completed[index]);
        return (
          <Box as="button" type="button" key={`${index}:${task.title}`}
            onClick={() => handleToggle(index)}
            disabled={immersion?.isGenerating || immersion?.isClaiming || immersion?.status !== "ready" || (immersion?.rewarded && allDone)}
            aria-pressed={checked} w="100%" p={3} textAlign="left" position="relative" overflow="hidden"
            border="1px solid" borderColor="var(--app-border)" borderRadius="16px"
            bg={isLight ? "var(--app-surface-elevated)" : "var(--app-surface-muted)"}
            opacity={immersion?.isGenerating ? 0.7 : 1}
            animation={celebrating && !prefersReducedMotion
              ? `${rewardRowBloom} 720ms ease-out ${index * 130}ms both` : undefined}
            _hover={{ borderColor: "teal.400" }}>
            {celebrating && !prefersReducedMotion && (
              <Box aria-hidden="true" position="absolute" top={0} bottom={0} left={0} w="60%"
                bgGradient="linear(to-r, transparent, rgba(94, 234, 212, 0.32), transparent)"
                pointerEvents="none"
                animation={`${rewardRowSweep} 750ms ease-out ${index * 130}ms both`} />
            )}
            <HStack align="start" spacing={3} position="relative">
              <Box w="22px" h="22px" flexShrink={0} display="flex" alignItems="center" justifyContent="center"
                border="2px solid" borderColor={checked ? "teal.500" : "var(--app-border-strong)"}
                bg={checked ? "teal.500" : "transparent"} color="white" borderRadius="7px" position="relative"
                animation={celebrating && !prefersReducedMotion
                  ? `${rewardCheckPulse} 720ms cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 130}ms both` : undefined}>
                {celebrating && !prefersReducedMotion && (
                  <Box aria-hidden="true" position="absolute" inset="-6px" border="2px solid"
                    borderColor="teal.300" borderRadius="10px" pointerEvents="none"
                    animation={`${rewardCheckRing} 650ms ease-out ${index * 130 + 100}ms both`} />
                )}
                {checked && <FiCheck size={14} aria-hidden="true" />}
              </Box>
              <Box flex="1" minW={0}>
                {index === 3 && <Text fontSize="xs" color="teal.500" fontWeight="bold" mb={1}>{copy.goal}</Text>}
                <Text fontSize="sm" fontWeight="bold" color="var(--app-text-primary)">{task.title}</Text>
                {task.description && <Text fontSize="sm" color="var(--app-text-secondary)" mt={0.5}>{task.description}</Text>}
              </Box>
            </HStack>
          </Box>
        );
      })}

      {immersion?.rewarded && allDone && (
        <Box position="relative" overflow="hidden" borderRadius="18px" px={4} py={5}
          border="1px solid" borderColor={isLight ? "#8ddfd2" : "#2b8178"}
          bg={isLight
            ? "linear-gradient(135deg, #e7fff9 0%, #f2fcff 55%, #fff8dd 100%)"
            : "linear-gradient(135deg, #103d3d 0%, #17324a 58%, #3d3422 100%)"}
          boxShadow={isLight ? "0 8px 25px rgba(13, 148, 136, 0.12)" : "0 8px 28px rgba(0, 0, 0, 0.2)"}
          animation={celebrating && !prefersReducedMotion
            ? `${rewardCardEnter} 760ms cubic-bezier(0.2, 0.8, 0.2, 1) 520ms both` : undefined}>
          {celebrating && !prefersReducedMotion && REWARD_SPARKS.map((spark, index) => (
            <Box key={index} aria-hidden="true" position="absolute" left="50%" top="50%"
              w={`${spark.size}px`} h={`${spark.size}px`}
              bg={spark.color} borderRadius={index % 3 === 0 ? "full" : "2px"}
              pointerEvents="none"
              style={{ "--spark-x": spark.x, "--spark-y": spark.y, "--spark-turn": spark.turn }}
              animation={`${rewardSparkBurst} 950ms ease-out ${700 + (index % 4) * 65}ms both`} />
          ))}
          <VStack position="relative" zIndex={1} spacing={1.5} textAlign="center">
            <CompanionRewardDance petType={petType} prefersReducedMotion={prefersReducedMotion} />
            <Text role="status" aria-live="polite"
              aria-label={`${copy.encouragements[rewardMessageIndex ?? 0]} ${copy.rewardXp}`}
              fontSize={{ base: "26px", md: "30px" }} lineHeight="1" letterSpacing="-0.04em"
              fontWeight="black" color={isLight ? "#0e7490" : "#99f6e4"}>
              +15 XP
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="var(--app-text-primary)">
              {copy.encouragements[rewardMessageIndex ?? 0]}
            </Text>
          </VStack>
        </Box>
      )}

      {immersion?.rewardError && (
        <VStack align="center" spacing={2} py={1}>
          <Text fontSize="sm" color="red.400" textAlign="center">{copy.rewardFailed}</Text>
          <Button size="sm" variant="outline" onClick={immersion.retryReward} isLoading={immersion.isClaiming}>
            {copy.retryReward}
          </Button>
        </VStack>
      )}

      {immersion?.isGenerating && (
        <HStack py={tasks.length ? 2 : 6} justify="center" spacing={2}>
          <AnimatedEllipsis color={isLight ? "black" : "white"} ariaLabel={copy.loading} />
        </HStack>
      )}

      {immersion?.error && (
        <VStack align="center" spacing={2} py={2}>
          <Text fontSize="sm" color="red.400" textAlign="center">{immersion.error}</Text>
          <Button size="sm" onClick={immersion.retry}>{copy.retry}</Button>
        </VStack>
      )}

      {!tasks.length && !immersion?.awaitingPlacement && !immersion?.isGenerating && !immersion?.error && (
        <Text fontSize="sm" color="var(--app-text-secondary)" textAlign="center" py={4}>{copy.empty}</Text>
      )}

    </VStack>
  );
}
