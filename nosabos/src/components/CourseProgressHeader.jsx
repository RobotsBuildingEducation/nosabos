import React from 'react';
import { Box, HStack, VStack, Text } from '@chakra-ui/react';
import { APP_SQUIRCLE_SHAPE } from '../theme';
import { t } from '../utils/translation';
import { WaveBar } from './WaveBar';

// Shared by lessons, flashcards and phonics so their course headers stay aligned.
export default function CourseProgressHeader({ totalXp = 0, activeLevel, percentage = 0, supportLang = 'en', progressCount,
  showLevelProgress = true, progressStart = '#4aa8ff', progressEnd = '#75f8ffff' }) {
  const xp = Math.max(0, Number(totalXp) || 0);
  return (
    <Box mb={4} display="flex" justifyContent="center" w="100%">
      <HStack justify="space-between" bg="var(--app-glass-bg-soft)" backdropFilter="blur(10px)"
        px={{ base: 3, md: 6 }} py={2} borderRadius="8px" style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
        border="1px solid" borderColor="var(--app-border)" boxShadow="var(--app-shadow-soft)"
        w="100%" maxW="600px" spacing={3}>
        <VStack spacing={0} align="start" minW={0} flex={1}>
          <Text fontSize="sm" fontWeight="black" color="var(--app-text-primary)" lineHeight="1">
            {progressCount ? `${progressCount.completed} / ${progressCount.total}` : `${xp} XP`}
          </Text>
          <Text fontSize="xs" color="gray.400" fontWeight="medium">
            {progressCount ? progressCount.label : t(supportLang, 'skill_tree_next_level_progress', { percent: xp % 100, level: Math.floor(xp / 100) + 2 })}
          </Text>
        </VStack>
        <VStack spacing={1} align="end" minW={0} flex={1} maxW="200px">
          {showLevelProgress && <HStack spacing={2}>
            <Text fontSize="xs" fontWeight="semibold" color="var(--app-text-primary)">{activeLevel}</Text>
            <Text fontSize="xs" fontWeight="bold" color="blue.300">{percentage}%</Text>
          </HStack>}
          <Box w="full">
            <WaveBar value={percentage} height={12} start={progressStart} end={progressEnd}
              bg="rgba(255,255,255,0.05)" border="rgba(255,255,255,0.1)" />
          </Box>
        </VStack>
      </HStack>
    </Box>
  );
}
