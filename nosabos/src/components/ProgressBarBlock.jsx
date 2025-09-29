// components/ProgressBarBlock.jsx
import React from "react";
import { Box, HStack, Badge } from "@chakra-ui/react";
import { WaveBar } from "./WaveBar";

export default function ProgressBarBlock({
  xp,
  levelNumber,
  progressPct,
  xpLabel = "XP",
  levelLabel = "Level",
}) {
  return (
    <Box
      bg="gray.800"
      p={3}
      rounded="2xl"
      border="1px solid"
      borderColor="gray.700"
    >
      <HStack justify="space-between" mb={1}>
        <Badge colorScheme="cyan" variant="subtle" fontSize="10px">
          {levelLabel} {levelNumber}
        </Badge>
        <Badge colorScheme="teal" variant="subtle" fontSize="10px">
          {xpLabel} {xp}
        </Badge>
      </HStack>
      <WaveBar value={progressPct} />
    </Box>
  );
}
