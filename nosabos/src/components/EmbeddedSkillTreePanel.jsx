import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Heading,
  Progress,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiMapLine,
  RiCloseLine,
  RiStarLine,
  RiTrophyLine,
} from 'react-icons/ri';
import SkillTree from './SkillTree';

const MotionBox = motion(Box);

/**
 * Embedded Skill Tree Panel
 *
 * Shows a mini progress indicator and expands to full skill tree
 */
export default function EmbeddedSkillTreePanel({
  isExpanded,
  onToggle,
  targetLang,
  level,
  userProgress,
  activeLesson,
  onStartLesson,
  appLanguage = 'en',
}) {
  const totalXp = userProgress?.totalXp || 0;

  return (
    <>
      {/* Mini Progress Indicator - Always visible above action bar */}
      {activeLesson && !isExpanded && (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          position="fixed"
          bottom="80px"
          left={0}
          right={0}
          bg="gray.900"
          borderTop="2px solid"
          borderColor="teal.500"
          px={4}
          py={2}
          zIndex={79}
          onClick={onToggle}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{
            bg: 'gray.800',
            borderColor: 'teal.400',
          }}
        >
          <HStack justify="space-between" fontSize="xs">
            <HStack spacing={2}>
              <RiStarLine size={14} color="gold" />
              <Text color="gray.300" fontWeight="medium">
                {activeLesson.title[appLanguage] || activeLesson.title.en}
              </Text>
            </HStack>
            <HStack spacing={3}>
              <HStack spacing={1}>
                <RiTrophyLine size={14} color="gold" />
                <Text color="gray.300" fontWeight="bold">{totalXp} XP</Text>
              </HStack>
              <RiMapLine size={16} color="var(--chakra-colors-teal-400)" />
            </HStack>
          </HStack>
        </MotionBox>
      )}

      {/* Full Skill Tree Panel - Slides up from bottom */}
      <AnimatePresence>
        {isExpanded && (
          <MotionBox
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            height="calc(100vh - 60px)"
            bg="gray.950"
            zIndex={90}
            overflowY="auto"
            borderTop="2px solid"
            borderColor="teal.500"
          >
            {/* Header */}
            <Box
              position="sticky"
              top={0}
              bg="gray.900"
              zIndex={1}
              py={3}
              px={4}
              borderBottom="1px solid"
              borderColor="gray.700"
            >
              <HStack justify="space-between">
                <Heading size="md" color="gray.100">
                  {appLanguage === 'es' ? 'Tu Camino de Aprendizaje' : 'Your Learning Path'}
                </Heading>
                <IconButton
                  icon={<RiCloseLine size={24} />}
                  onClick={onToggle}
                  aria-label="Close"
                  variant="ghost"
                  color="gray.100"
                  size="sm"
                />
              </HStack>
            </Box>

            {/* Skill Tree Content */}
            <SkillTree
              targetLang={targetLang}
              level={level}
              userProgress={userProgress}
              onStartLesson={onStartLesson}
            />
          </MotionBox>
        )}
      </AnimatePresence>
    </>
  );
}
