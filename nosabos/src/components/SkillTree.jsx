import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Badge,
  useColorModeValue,
  Container,
  Heading,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiLockLine,
  RiCheckLine,
  RiStarLine,
  RiStarFill,
  RiTrophyLine,
  RiBookOpenLine,
  RiSpeakLine,
  RiPencilLine,
  RiHistoryLine,
} from 'react-icons/ri';
import {
  getLearningPath,
  getUnitProgress,
  getNextLesson,
  SKILL_STATUS,
} from '../data/skillTreeData';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const getDisplayText = (textObj, supportLang = 'en') => {
  if (!textObj) return '';
  if (typeof textObj === 'string') return textObj;
  const fallback = textObj.en || textObj.es || Object.values(textObj)[0] || '';
  if (supportLang === 'bilingual') {
    const en = textObj.en || '';
    const es = textObj.es || '';
    if (en && es && en !== es) {
      return `${en} / ${es}`;
    }
    return en || es || fallback;
  }
  return textObj[supportLang] || fallback;
};

// Icon mapping for different learning modes
const MODE_ICONS = {
  vocabulary: RiBookOpenLine,
  grammar: RiPencilLine,
  realtime: RiSpeakLine,
  stories: RiBookOpenLine,
  history: RiHistoryLine,
  jobscript: RiPencilLine,
};

/**
 * Individual Lesson Node Component
 * Represents a single lesson in the skill tree
 */
function LessonNode({ lesson, unit, status, onClick, supportLang }) {
  const bgColor = 'gray.800';
  const borderColor = 'gray.700';
  const lockedColor = 'gray.600';

  const lessonTitle = getDisplayText(lesson.title, supportLang);
  const lessonDescription = getDisplayText(lesson.description, supportLang);

  const getNodeColor = () => {
    if (status === SKILL_STATUS.COMPLETED) return unit.color;
    if (status === SKILL_STATUS.IN_PROGRESS) return unit.color;
    if (status === SKILL_STATUS.AVAILABLE) return unit.color;
    return lockedColor;
  };

  const getNodeIcon = () => {
    if (status === SKILL_STATUS.COMPLETED) return RiCheckLine;
    if (status === SKILL_STATUS.LOCKED) return RiLockLine;
    return RiStarLine;
  };

  const Icon = getNodeIcon();
  const isClickable = status === SKILL_STATUS.AVAILABLE || status === SKILL_STATUS.IN_PROGRESS;

  return (
    <MotionBox
      whileHover={isClickable ? { scale: 1.1 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tooltip
        label={
          status === SKILL_STATUS.LOCKED
            ? `Unlock at ${lesson.xpRequired} XP`
            : lessonDescription
        }
        placement="right"
      >
        <Box position="relative">
          <VStack
            spacing={2}
            cursor={isClickable ? 'pointer' : 'not-allowed'}
            onClick={isClickable ? onClick : undefined}
          >
            {/* Lesson Circle */}
            <Box
              w="80px"
              h="80px"
              borderRadius="full"
              bg={status === SKILL_STATUS.LOCKED ? 'gray.700' : getNodeColor()}
              border="4px solid"
              borderColor={status === SKILL_STATUS.COMPLETED ? getNodeColor() : 'gray.600'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
              boxShadow={status !== SKILL_STATUS.LOCKED ? 'dark-lg' : 'none'}
              opacity={status === SKILL_STATUS.LOCKED ? 0.4 : 1}
              transition="all 0.3s"
              _hover={
                isClickable
                  ? {
                      transform: 'translateY(-4px)',
                      boxShadow: 'dark-lg',
                    }
                  : {}
              }
            >
              <Icon
                size={32}
                color={status === SKILL_STATUS.LOCKED ? 'gray' : 'white'}
              />

              {/* Progress ring for in-progress lessons */}
              {status === SKILL_STATUS.IN_PROGRESS && (
                <Box
                  position="absolute"
                  top="-4px"
                  left="-4px"
                  right="-4px"
                  bottom="-4px"
                  borderRadius="full"
                  border="3px dashed"
                  borderColor={getNodeColor()}
                  animation="spin 3s linear infinite"
                  sx={{
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              )}
            </Box>

            {/* Lesson Title */}
            <Text
              fontSize="sm"
              fontWeight="bold"
              textAlign="center"
              maxW="120px"
              color={status === SKILL_STATUS.LOCKED ? 'gray.600' : 'gray.100'}
            >
              {lessonTitle}
            </Text>

            {/* XP Badge */}
            <Badge
              colorScheme={status === SKILL_STATUS.COMPLETED ? 'green' : 'gray'}
              fontSize="xs"
            >
              {status === SKILL_STATUS.COMPLETED ? `+${lesson.xpReward} XP` : `${lesson.xpReward} XP`}
            </Badge>
          </VStack>
        </Box>
      </Tooltip>
    </MotionBox>
  );
}

/**
 * Unit Component
 * Represents a unit containing multiple lessons
 */
function UnitSection({ unit, userProgress, onLessonClick, index, supportLang }) {
  const bgColor = 'gray.800';
  const borderColor = 'gray.700';

  const unitProgressPercent = getUnitProgress(unit, userProgress);
  const completedCount = unit.lessons.filter(
    lesson => userProgress.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED
  ).length;

  const unitTitle = getDisplayText(unit.title, supportLang);
  const unitDescription = getDisplayText(unit.description, supportLang);

  return (
    <MotionBox
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      mb={8}
    >
      <VStack spacing={4} align="stretch">
        {/* Unit Header */}
        <Box
          bg={bgColor}
          borderRadius="xl"
          p={6}
          border="2px solid"
          borderColor={borderColor}
          boxShadow="md"
        >
          <HStack justify="space-between" mb={3}>
            <VStack align="start" spacing={1}>
              <HStack>
                <Box
                  w={4}
                  h={4}
                  borderRadius="full"
                  bg={unit.color}
                />
                <Heading size="md">{unitTitle}</Heading>
              </HStack>
              <Text fontSize="sm" color="gray.400">
                {unitDescription}
              </Text>
            </VStack>

            <VStack spacing={1}>
              <RiTrophyLine size={24} color={unit.color} />
              <Text fontSize="sm" fontWeight="bold">
                {completedCount}/{unit.lessons.length}
              </Text>
            </VStack>
          </HStack>

          {/* Unit Progress Bar */}
          <Progress
            value={unitProgressPercent}
            colorScheme="teal"
            borderRadius="full"
            size="sm"
            bg="gray.700"
          />
        </Box>

        {/* Lessons in this unit */}
        <VStack spacing={8} position="relative">
          {unit.lessons.map((lesson, lessonIndex) => {
            const lessonProgress = userProgress.lessons?.[lesson.id];
            let status = SKILL_STATUS.LOCKED;

            // Determine lesson status
            if (lessonProgress?.status === SKILL_STATUS.COMPLETED) {
              status = SKILL_STATUS.COMPLETED;
            } else if (lessonProgress?.status === SKILL_STATUS.IN_PROGRESS) {
              status = SKILL_STATUS.IN_PROGRESS;
            } else if (userProgress.totalXp >= lesson.xpRequired) {
              status = SKILL_STATUS.AVAILABLE;
            }

            return (
              <Box key={lesson.id} position="relative">
                {/* Connecting line to next lesson */}
                {lessonIndex < unit.lessons.length - 1 && (
                  <Box
                    position="absolute"
                    top="80px"
                    left="50%"
                    transform="translateX(-50%)"
                    w="4px"
                    h="40px"
                    bg={status === SKILL_STATUS.COMPLETED ? unit.color : 'gray.700'}
                    zIndex={0}
                  />
                )}

                <Box position="relative" zIndex={1}>
                  <LessonNode
                    lesson={lesson}
                    unit={unit}
                    status={status}
                    onClick={() => onLessonClick(lesson, unit, status)}
                    supportLang={supportLang}
                  />
                </Box>
              </Box>
            );
          })}
        </VStack>
      </VStack>
    </MotionBox>
  );
}

/**
 * Lesson Detail Modal
 * Shows detailed information about a lesson
 */
function LessonDetailModal({
  isOpen,
  onClose,
  lesson,
  unit,
  onStartLesson,
  supportLang,
}) {
  if (!lesson) return null;

  const lessonTitle = getDisplayText(lesson.title, supportLang);
  const unitTitle = getDisplayText(unit.title, supportLang);
  const lessonDescription = getDisplayText(lesson.description, supportLang);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="gray.900" color="gray.100">
        <ModalHeader borderBottomWidth="1px" borderColor="gray.700">
          <VStack align="start" spacing={2}>
            <HStack>
              <Box w={3} h={3} borderRadius="full" bg={unit.color} />
              <Text color="gray.100">{lessonTitle}</Text>
            </HStack>
            <Text fontSize="sm" fontWeight="normal" color="gray.400">
              {unitTitle}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: "gray.100" }} />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <Text color="gray.300">{lessonDescription}</Text>

            {/* Lesson modes */}
            <Box>
              <Text fontWeight="bold" mb={2} color="gray.100">
                Learning Activities:
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                {lesson.modes.map((mode) => {
                  const Icon = MODE_ICONS[mode] || RiStarLine;
                  return (
                    <Badge
                      key={mode}
                      colorScheme="teal"
                      px={3}
                      py={1}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      bg="teal.600"
                      color="gray.100"
                    >
                      <Icon size={14} />
                      <Text textTransform="capitalize">{mode}</Text>
                    </Badge>
                  );
                })}
              </HStack>
            </Box>

            {/* XP Goal */}
            <HStack
              p={4}
              bg="gray.800"
              borderRadius="lg"
              justify="space-between"
              borderWidth="1px"
              borderColor="gray.700"
            >
              <HStack>
                <RiStarFill color="gold" size={24} />
                <Text fontWeight="bold" color="gray.100">XP to complete:</Text>
              </HStack>
              <Badge colorScheme="yellow" fontSize="md" px={3} py={1} bg="yellow.500" color="gray.900">
                {lesson.xpReward} XP
              </Badge>
            </HStack>

            {/* Start button */}
            <Button
              colorScheme="teal"
              size="lg"
              onClick={() => {
                onStartLesson(lesson);
                onClose();
              }}
              leftIcon={<RiStarLine />}
            >
              Start Lesson
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

/**
 * Main SkillTree Component
 */
export default function SkillTree({
  targetLang = 'es',
  level = 'beginner',
  supportLang = 'en',
  userProgress = { totalXp: 0, lessons: {} },
  onStartLesson,
}) {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const units = getLearningPath(targetLang, level);
  const bgColor = 'gray.950';

  const handleLessonClick = (lesson, unit, status) => {
    if (status === SKILL_STATUS.AVAILABLE || status === SKILL_STATUS.IN_PROGRESS) {
      setSelectedLesson(lesson);
      setSelectedUnit(unit);
      onOpen();
    }
  };

  const handleStartLesson = (lesson) => {
    if (onStartLesson) {
      onStartLesson(lesson);
    }
  };

  // Calculate overall progress
  const totalLessons = units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const completedLessons = units.reduce(
    (sum, unit) =>
      sum +
      unit.lessons.filter(
        (lesson) => userProgress.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED
      ).length,
    0
  );
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <Box bg={bgColor} py={8}>
      <Container maxW="container.md">
        {/* Header */}
        <VStack spacing={6} mb={8}>
          <Heading size="xl" color="gray.100">Your Learning Path</Heading>

          {/* Overall Progress */}
          <Box w="full" bg="gray.800" p={6} borderRadius="xl" boxShadow="dark-lg" borderWidth="1px" borderColor="gray.700">
            <VStack spacing={3}>
              <HStack w="full" justify="space-between">
                <Text fontWeight="bold" color="gray.100">Overall Progress</Text>
                <HStack>
                  <RiTrophyLine size={20} color="gold" />
                  <Text fontWeight="bold" fontSize="lg" color="gray.100">
                    {userProgress.totalXp || 0} XP
                  </Text>
                </HStack>
              </HStack>

              <Progress
                value={overallProgress}
                colorScheme="teal"
                borderRadius="full"
                size="lg"
                w="full"
                bg="gray.700"
              />

              <Text fontSize="sm" color="gray.400">
                {completedLessons} of {totalLessons} lessons completed
              </Text>
            </VStack>
          </Box>
        </VStack>

        {/* Skill Tree Units */}
        <VStack spacing={12} align="stretch">
          {units.length > 0 ? (
            units.map((unit, index) => (
              <UnitSection
                key={unit.id}
                unit={unit}
                userProgress={userProgress}
                onLessonClick={handleLessonClick}
                index={index}
                supportLang={supportLang}
              />
            ))
          ) : (
            <Box textAlign="center" py={12}>
              <Text fontSize="lg" color="gray.400">
                No learning path available for this language yet.
              </Text>
              <Text fontSize="sm" color="gray.500" mt={2}>
                Check back soon for structured lessons!
              </Text>
            </Box>
          )}
        </VStack>

        {/* Lesson Detail Modal */}
        {selectedLesson && selectedUnit && (
            <LessonDetailModal
              isOpen={isOpen}
              onClose={onClose}
              lesson={selectedLesson}
              unit={selectedUnit}
              onStartLesson={handleStartLesson}
              supportLang={supportLang}
            />
          )}
      </Container>
    </Box>
  );
}
