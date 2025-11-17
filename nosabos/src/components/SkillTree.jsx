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
function LessonNode({ lesson, unit, status, onClick, isNext }) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const lockedColor = useColorModeValue('gray.400', 'gray.600');

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
        label={status === SKILL_STATUS.LOCKED ? `Unlock at ${lesson.xpRequired} XP` : lesson.description.en}
        placement="right"
      >
        <Box position="relative">
          {isNext && (
            <MotionBox
              position="absolute"
              top="-4px"
              right="-4px"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <Badge
                colorScheme="yellow"
                borderRadius="full"
                px={2}
                fontSize="xs"
              >
                Next!
              </Badge>
            </MotionBox>
          )}

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
              bg={status === SKILL_STATUS.LOCKED ? 'gray.200' : getNodeColor()}
              border="4px solid"
              borderColor={status === SKILL_STATUS.COMPLETED ? getNodeColor() : borderColor}
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
              boxShadow={status !== SKILL_STATUS.LOCKED ? 'lg' : 'none'}
              opacity={status === SKILL_STATUS.LOCKED ? 0.5 : 1}
              transition="all 0.3s"
              _hover={
                isClickable
                  ? {
                      transform: 'translateY(-4px)',
                      boxShadow: 'xl',
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
              color={status === SKILL_STATUS.LOCKED ? 'gray.500' : 'inherit'}
            >
              {lesson.title.en}
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
function UnitSection({ unit, userProgress, onLessonClick, index }) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const unitProgressPercent = getUnitProgress(unit, userProgress);
  const completedCount = unit.lessons.filter(
    lesson => userProgress.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED
  ).length;

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
                <Heading size="md">{unit.title.en}</Heading>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                {unit.description.en}
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
            bg="gray.200"
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

            // Check if this is the next recommended lesson
            const nextLesson = getNextLesson([unit], userProgress);
            const isNext = nextLesson?.lesson?.id === lesson.id;

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
                    bg={status === SKILL_STATUS.COMPLETED ? unit.color : 'gray.300'}
                    zIndex={0}
                  />
                )}

                <Box position="relative" zIndex={1}>
                  <LessonNode
                    lesson={lesson}
                    unit={unit}
                    status={status}
                    isNext={isNext}
                    onClick={() => onLessonClick(lesson, unit, status)}
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
function LessonDetailModal({ isOpen, onClose, lesson, unit, onStartLesson }) {
  if (!lesson) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <HStack>
              <Box w={3} h={3} borderRadius="full" bg={unit.color} />
              <Text>{lesson.title.en}</Text>
            </HStack>
            <Text fontSize="sm" fontWeight="normal" color="gray.600">
              {unit.title.en}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <Text>{lesson.description.en}</Text>

            {/* Lesson modes */}
            <Box>
              <Text fontWeight="bold" mb={2}>
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
                    >
                      <Icon size={14} />
                      <Text textTransform="capitalize">{mode}</Text>
                    </Badge>
                  );
                })}
              </HStack>
            </Box>

            {/* XP Reward */}
            <HStack
              p={4}
              bg="yellow.50"
              borderRadius="lg"
              justify="space-between"
            >
              <HStack>
                <RiStarFill color="gold" size={24} />
                <Text fontWeight="bold">Complete to earn:</Text>
              </HStack>
              <Badge colorScheme="yellow" fontSize="md" px={3} py={1}>
                +{lesson.xpReward} XP
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
  userProgress = { totalXp: 0, lessons: {} },
  onStartLesson,
}) {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const units = getLearningPath(targetLang, level);
  const bgColor = useColorModeValue('gray.50', 'gray.900');

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
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.md">
        {/* Header */}
        <VStack spacing={6} mb={8}>
          <Heading size="xl">Your Learning Path</Heading>

          {/* Overall Progress */}
          <Box w="full" bg="white" p={6} borderRadius="xl" boxShadow="md">
            <VStack spacing={3}>
              <HStack w="full" justify="space-between">
                <Text fontWeight="bold">Overall Progress</Text>
                <HStack>
                  <RiTrophyLine size={20} color="gold" />
                  <Text fontWeight="bold" fontSize="lg">
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
              />

              <Text fontSize="sm" color="gray.600">
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
              />
            ))
          ) : (
            <Box textAlign="center" py={12}>
              <Text fontSize="lg" color="gray.500">
                No learning path available for this language yet.
              </Text>
              <Text fontSize="sm" color="gray.400" mt={2}>
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
          />
        )}
      </Container>
    </Box>
  );
}
