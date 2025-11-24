import React, { useState } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Heading,
  Progress,
  Collapse,
  Badge,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiStarLine,
  RiTrophyLine,
} from 'react-icons/ri';
import SkillTree from './SkillTree';
import { translations } from '../utils/translation';

const MotionBox = motion(Box);

/**
 * Embedded Skill Tree - Always Visible
 *
 * Sits at the top of the learning area, collapsible but always present
 * Informs learning modules what content to generate
 */
export default function EmbeddedSkillTree({
  targetLang,
  level,
  userProgress,
  activeLesson,
  onStartLesson,
  appLanguage = 'en',
}) {
  const [isExpanded, setIsExpanded] = useState(!activeLesson); // Collapsed when lesson active
  const totalXp = userProgress?.totalXp || 0;

  // Get translations for current language
  const t = translations[appLanguage] || translations.en;

  return (
    <Box
      bg="gray.900"
      borderBottom="2px solid"
      borderColor="teal.500"
      mb={4}
    >
      {/* Collapsible Header - Always Visible */}
      <Box
        px={4}
        py={3}
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        _hover={{ bg: 'gray.800' }}
        transition="background 0.2s"
      >
        <HStack justify="space-between">
          <HStack spacing={3}>
            <IconButton
              icon={isExpanded ? <RiArrowUpSLine size={24} /> : <RiArrowDownSLine size={24} />}
              aria-label={isExpanded ? t.skill_tree_collapse : t.skill_tree_expand}
              variant="ghost"
              size="sm"
              color="gray.300"
            />
            <VStack align="start" spacing={0}>
              <Heading size="sm" color="gray.100">
                {t.skill_tree_your_path}
              </Heading>
              {activeLesson && (
                <HStack spacing={2} fontSize="xs">
                  <RiStarLine size={12} color="gold" />
                  <Text color="gray.400">
                    {activeLesson.title[appLanguage] || activeLesson.title.en}
                  </Text>
                </HStack>
              )}
            </VStack>
          </HStack>

          <HStack spacing={4}>
            <HStack spacing={1}>
              <RiTrophyLine size={16} color="gold" />
              <Text color="gray.300" fontWeight="bold" fontSize="sm">
                {totalXp} XP
              </Text>
            </HStack>
            {activeLesson && (
              <Badge colorScheme="teal" fontSize="xs">
                {t.skill_tree_lesson_active}
              </Badge>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={isExpanded} animateOpacity>
        <Box
          maxH="60vh"
          overflowY="auto"
          bg="gray.950"
          borderTop="1px solid"
          borderColor="gray.700"
        >
          <SkillTree
            targetLang={targetLang}
            level={level}
            supportLang={appLanguage}
            userProgress={userProgress}
            onStartLesson={(lesson) => {
              onStartLesson(lesson);
              setIsExpanded(false); // Collapse after starting lesson
            }}
          />
        </Box>
      </Collapse>
    </Box>
  );
}
