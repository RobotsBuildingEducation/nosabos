import React, { useState, useEffect } from "react";
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
  useBreakpointValue,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
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
  RiHandHeartLine,
  RiUserVoiceLine,
  RiQuestionLine,
  RiQuestionAnswerLine,
  RiHeartLine,
  RiNumbersLine,
  RiRestaurantLine,
  RiTimeLine,
  RiCalendarLine,
  RiTeamLine,
  RiMapPinLine,
  RiCompassLine,
  RiBusLine,
  RiShoppingCartLine,
  RiShirtLine,
  RiPaletteLine,
  RiEmotionLine,
  RiFootballLine,
  RiMusicLine,
  RiBook2Line,
  RiHistoryFill,
  RiSuitcaseLine,
  RiCloudyLine,
  RiBodyScanLine,
  RiHeartPulseLine,
  RiPlantLine,
  RiGlobalLine,
  RiLightbulbLine,
  RiMegaphoneLine,
  RiNewspaperLine,
  RiBriefcaseLine,
  RiQuillPenLine,
  RiPaintBrushLine,
  RiClapperboardLine,
  RiSmartphoneLine,
  RiFlaskLine,
  RiBitCoinLine,
  RiScalesLine,
  RiEarthLine,
} from "react-icons/ri";
import {
  getLearningPath,
  getMultiLevelLearningPath,
  getUnitProgress,
  getNextLesson,
  SKILL_STATUS,
} from "../data/skillTreeData";
import { translations } from "../utils/translation";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const getDisplayText = (textObj, supportLang = "en") => {
  if (!textObj) return "";
  if (typeof textObj === "string") return textObj;
  const fallback = textObj.en || textObj.es || Object.values(textObj)[0] || "";
  if (supportLang === "bilingual") {
    const en = textObj.en || "";
    const es = textObj.es || "";
    if (en && es && en !== es) {
      return `${en} / ${es}`;
    }
    return en || es || fallback;
  }
  return textObj[supportLang] || fallback;
};

// Helper to get translations for UI elements
const getTranslation = (supportLang = "en", key, params = {}) => {
  const lang = supportLang === "bilingual" ? "en" : supportLang;
  const dict = translations[lang] || translations.en;
  const raw = dict[key] || key;
  if (typeof raw !== "string") return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`
  );
};

// Icon mapping for different learning modes
const MODE_ICONS = {
  vocabulary: RiBook2Line,
  grammar: RiPencilLine,
  realtime: RiSpeakLine,
  stories: RiBookOpenLine,
  reading: RiBookOpenLine,
};

// Dynamic lesson icon mapping based on unit topics
const getUnitTopicIcon = (unitId) => {
  // A1 Units - Beginner
  if (unitId === "unit-a1-1") return RiHandHeartLine; // First Words
  if (unitId === "unit-a1-2") return RiUserVoiceLine; // Introducing Yourself
  if (unitId === "unit-a1-3") return RiNumbersLine; // Numbers 0-20
  if (unitId === "unit-a1-4") return RiNumbersLine; // Numbers 21-100
  if (unitId === "unit-a1-5") return RiCalendarLine; // Days of Week
  if (unitId === "unit-a1-6") return RiCalendarLine; // Months & Dates
  if (unitId === "unit-a1-7") return RiTimeLine; // Telling Time
  if (unitId === "unit-a1-8") return RiTeamLine; // Family Members
  if (unitId === "unit-a1-9") return RiPaletteLine; // Colors & Shapes
  if (unitId === "unit-a1-10") return RiRestaurantLine; // Food & Drinks
  if (unitId === "unit-a1-11") return RiRestaurantLine; // At the Restaurant
  if (unitId === "unit-a1-12") return RiBookOpenLine; // Common Objects
  if (unitId === "unit-a1-13") return RiMapPinLine; // In the House
  if (unitId === "unit-a1-14") return RiShirtLine; // Clothing
  if (unitId === "unit-a1-15") return RiTimeLine; // Daily Routine
  if (unitId === "unit-a1-16") return RiCloudyLine; // Weather
  if (unitId === "unit-a1-17") return RiHeartLine; // Likes & Dislikes
  if (unitId === "unit-a1-18") return RiQuestionAnswerLine; // Basic Questions

  // A2 Units - Elementary
  if (unitId === "unit-a2-1") return RiEmotionLine; // Describing People
  if (unitId === "unit-a2-2") return RiMapPinLine; // Describing Places
  if (unitId === "unit-a2-3") return RiShoppingCartLine; // Shopping & Money
  if (unitId === "unit-a2-4") return RiShoppingCartLine; // At the Market
  if (unitId === "unit-a2-5") return RiBusLine; // Transportation
  if (unitId === "unit-a2-6") return RiCompassLine; // Directions
  if (unitId === "unit-a2-7") return RiCalendarLine; // Making Plans
  if (unitId === "unit-a2-8") return RiMusicLine; // Hobbies & Interests
  if (unitId === "unit-a2-9") return RiFootballLine; // Sports & Exercise
  if (unitId === "unit-a2-10") return RiHistoryLine; // Past Tense Regular
  if (unitId === "unit-a2-11") return RiHistoryFill; // Past Tense Irregular
  if (unitId === "unit-a2-12") return RiBookOpenLine; // Telling Stories
  if (unitId === "unit-a2-13") return RiCalendarLine; // Future Plans
  if (unitId === "unit-a2-14") return RiBodyScanLine; // Health & Body
  if (unitId === "unit-a2-15") return RiHeartPulseLine; // At the Doctor's
  if (unitId === "unit-a2-16") return RiBriefcaseLine; // Jobs & Professions
  if (unitId === "unit-a2-17") return RiBook2Line; // School & Education
  if (unitId === "unit-a2-18") return RiSmartphoneLine; // Technology Basics

  // B1 Units - Intermediate
  if (unitId === "unit-b1-1") return RiHistoryLine; // Present Perfect
  if (unitId === "unit-b1-2") return RiHistoryFill; // Past Continuous
  if (unitId === "unit-b1-3") return RiCalendarLine; // Future Tense
  if (unitId === "unit-b1-4") return RiScalesLine; // Comparisons
  if (unitId === "unit-b1-5") return RiLightbulbLine; // Giving Advice
  if (unitId === "unit-b1-6") return RiLightbulbLine; // Making Suggestions
  if (unitId === "unit-b1-7") return RiQuestionLine; // Conditional Would
  if (unitId === "unit-b1-8") return RiSuitcaseLine; // Travel & Tourism
  if (unitId === "unit-b1-9") return RiPlantLine; // Environment
  if (unitId === "unit-b1-10") return RiGlobalLine; // Culture & Traditions
  if (unitId === "unit-b1-11") return RiNewspaperLine; // Media & News
  if (unitId === "unit-b1-12") return RiMegaphoneLine; // Expressing Opinions
  if (unitId === "unit-b1-13") return RiMegaphoneLine; // Making Complaints
  if (unitId === "unit-b1-14") return RiStarLine; // Experiences
  if (unitId === "unit-b1-15") return RiQuestionLine; // Probability

  // B2 Units - Upper Intermediate
  if (unitId === "unit-b2-1") return RiHistoryFill; // Past Perfect
  if (unitId === "unit-b2-2") return RiPencilLine; // Passive Voice
  if (unitId === "unit-b2-3") return RiSpeakLine; // Reported Speech
  if (unitId === "unit-b2-4") return RiPencilLine; // Relative Clauses
  if (unitId === "unit-b2-5") return RiBookOpenLine; // Formal vs Informal
  if (unitId === "unit-b2-6") return RiBriefcaseLine; // Business Spanish
  if (unitId === "unit-b2-7") return RiFlaskLine; // Science & Innovation
  if (unitId === "unit-b2-8") return RiScalesLine; // Social Issues
  if (unitId === "unit-b2-9") return RiPaintBrushLine; // Arts & Literature
  if (unitId === "unit-b2-10") return RiMegaphoneLine; // Politics & Society
  if (unitId === "unit-b2-11") return RiHeartPulseLine; // Health & Lifestyle
  if (unitId === "unit-b2-12") return RiLightbulbLine; // Abstract Concepts

  // C1 Units - Advanced
  if (unitId === "unit-c1-1") return RiStarLine; // Subjunctive Present
  if (unitId === "unit-c1-2") return RiStarFill; // Subjunctive Past
  if (unitId === "unit-c1-3") return RiQuestionLine; // Complex Conditionals
  if (unitId === "unit-c1-4") return RiQuillPenLine; // Idiomatic Expressions
  if (unitId === "unit-c1-5") return RiBook2Line; // Academic Writing
  if (unitId === "unit-c1-6") return RiBriefcaseLine; // Professional Communication
  if (unitId === "unit-c1-7") return RiMegaphoneLine; // Debate & Argumentation
  if (unitId === "unit-c1-8") return RiGlobalLine; // Cultural Analysis
  if (unitId === "unit-c1-9") return RiQuillPenLine; // Literary Techniques
  if (unitId === "unit-c1-10") return RiSpeakLine; // Advanced Discourse

  // C2 Units - Mastery
  if (unitId === "unit-c2-1") return RiStarFill; // Native Idioms
  if (unitId === "unit-c2-2") return RiGlobalLine; // Regional Variations
  if (unitId === "unit-c2-3") return RiQuillPenLine; // Stylistic Mastery
  if (unitId === "unit-c2-4") return RiPaintBrushLine; // Rhetorical Devices
  if (unitId === "unit-c2-5") return RiBook2Line; // Specialized Vocabulary
  if (unitId === "unit-c2-6") return RiLightbulbLine; // Subtle Nuances
  if (unitId === "unit-c2-7") return RiEarthLine; // Cultural Expertise
  if (unitId === "unit-c2-8") return RiTrophyLine; // Near-Native Fluency

  return RiBookOpenLine; // Default fallback
};

// Get icon for individual lessons based on lesson type and unit
const getLessonIcon = (lessonId, unitId) => {
  // Quiz lessons always get the question mark icon
  if (lessonId.includes("-quiz")) return RiQuestionLine;

  // Get the base icon from the unit's topic
  return getUnitTopicIcon(unitId);
};

/**
 * Individual Lesson Node Component
 * Represents a single lesson in the skill tree
 */
function LessonNode({ lesson, unit, status, onClick, supportLang }) {
  const bgColor = "gray.800";
  const borderColor = "gray.700";
  const lockedColor = "gray.600";

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
    return getLessonIcon(lesson.id, unit.id);
  };

  const Icon = getNodeIcon();
  const isClickable =
    status === SKILL_STATUS.AVAILABLE ||
    status === SKILL_STATUS.IN_PROGRESS ||
    status === SKILL_STATUS.COMPLETED;

  const baseBorderColor =
    status === SKILL_STATUS.COMPLETED
      ? unit.color
      : status === SKILL_STATUS.LOCKED
      ? "gray.600"
      : `${unit.color}88`;

  return (
    <MotionBox
      whileHover={isClickable ? { scale: 1.02, y: -1 } : {}}
      whileTap={isClickable ? { scale: 0.99 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
      <Tooltip
        label={
          status === SKILL_STATUS.LOCKED
            ? getTranslation(supportLang, "skill_tree_unlock_at", {
                xpRequired: lesson.xpRequired,
              })
            : lessonDescription
        }
        placement="right"
        hasArrow
        bg="gray.700"
        color="white"
        fontSize="sm"
        p={3}
        borderRadius="lg"
      >
        <Box position="relative">
          <VStack
            spacing={2}
            cursor={isClickable ? "pointer" : "not-allowed"}
            onClick={isClickable ? onClick : undefined}
          >
            {/* Glow Effect for active lessons */}
            {status !== SKILL_STATUS.LOCKED && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                w="100px"
                h="100px"
                borderRadius="full"
                bgGradient={`radial(${unit.color}40, transparent 70%)`}
                filter="blur(20px)"
                opacity={status === SKILL_STATUS.COMPLETED ? 0.8 : 0.5}
                animation={
                  status === SKILL_STATUS.IN_PROGRESS
                    ? "pulse 2s ease-in-out infinite"
                    : "none"
                }
                sx={{
                  "@keyframes pulse": {
                    "0%, 100%": {
                      opacity: 0.5,
                      transform: "translate(-50%, -50%) scale(1)",
                    },
                    "50%": {
                      opacity: 0.8,
                      transform: "translate(-50%, -50%) scale(1.1)",
                    },
                  },
                }}
                pointerEvents="none"
              />
            )}

            {/* Lesson Circle */}
            <Button
              w="90px"
              h="90px"
              borderRadius="full"
              bgGradient={
                status === SKILL_STATUS.LOCKED
                  ? "linear(to-br, gray.700, gray.800)"
                  : status === SKILL_STATUS.COMPLETED
                  ? `linear(135deg, ${unit.color}, ${unit.color}dd)`
                  : `linear(135deg, ${unit.color}dd, ${unit.color})`
              }
              border="4px solid"
              borderColor="transparent"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
              boxShadow={
                status !== SKILL_STATUS.LOCKED
                  ? `0 8px 0px ${unit.color}AA` // darker shadow version of unit.color
                  : `0 8px 0px rgba(0,0,0,0.4)`
              }
              opacity={status === SKILL_STATUS.LOCKED ? 0.4 : 1}
              transition="all 0.3s ease"
            >
              <Icon
                size={36}
                color={status === SKILL_STATUS.LOCKED ? "gray" : "white"}
                style={{
                  filter:
                    status !== SKILL_STATUS.LOCKED
                      ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                      : "none",
                }}
              />

              {/* Progress ring for in-progress lessons */}
              {status === SKILL_STATUS.IN_PROGRESS && (
                <Box
                  position="absolute"
                  top="-6px"
                  left="-6px"
                  right="-6px"
                  bottom="-6px"
                  borderRadius="full"
                  border="3px dashed"
                  borderColor={unit.color}
                  animation="spin 4s linear infinite"
                  sx={{
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
              )}

              {/* Sparkle effect for completed lessons */}
              {status === SKILL_STATUS.COMPLETED && (
                <>
                  <Box
                    position="absolute"
                    top="10%"
                    right="15%"
                    w="10px"
                    h="10px"
                    borderRadius="full"
                    bg="white"
                    boxShadow="0 0 12px 4px rgba(255,255,255,0.8), 0 0 24px rgba(255,255,255,0.6)"
                    animation="sparkle 2.4s ease-in-out infinite"
                    sx={{
                      "@keyframes sparkle": {
                        "0%, 100%": {
                          opacity: 0,
                          transform: "scale(0.5) rotate(0deg)",
                        },
                        "50%": {
                          opacity: 0.6,
                          transform: "scale(0.6) rotate(15deg)",
                          filter:
                            "drop-shadow(0 0 10px rgba(255, 255, 255, 0.9))",
                        },
                      },
                    }}
                  />
                  <Box
                    position="absolute"
                    bottom="15%"
                    left="10%"
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg="white"
                    boxShadow="0 0 10px 3px rgba(255,255,255,0.7), 0 0 18px rgba(255,255,255,0.5)"
                    animation="sparkle 2.7s ease-in-out infinite 1.2s"
                    sx={{
                      "@keyframes sparkle": {
                        "0%, 100%": {
                          opacity: 0,
                          transform: "scale(0.4) rotate(0deg)",
                        },
                        "50%": {
                          opacity: 1,
                          transform: "scale(1.4) rotate(-10deg)",
                          filter: "drop-shadow(0 0 8px rgba(255,255,255,0.9))",
                        },
                      },
                    }}
                  />
                  <Box
                    position="absolute"
                    top="45%"
                    left="60%"
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg="white"
                    boxShadow="0 0 10px 3px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.6)"
                    animation="sparkle 2.2s ease-in-out infinite 0.6s"
                    sx={{
                      "@keyframes sparkle": {
                        "0%, 100%": {
                          opacity: 0,
                          transform: "scale(0.3) rotate(0deg)",
                        },
                        "50%": {
                          opacity: 1,
                          transform: "scale(1.2) rotate(8deg)",
                          filter: "drop-shadow(0 0 9px rgba(255,255,255,0.9))",
                        },
                      },
                    }}
                  />
                </>
              )}
            </Button>

            {/* Lesson Title */}
            <Text
              fontSize="sm"
              fontWeight="bold"
              textAlign="center"
              maxW="140px"
              color={status === SKILL_STATUS.LOCKED ? "gray.600" : "white"}
              textShadow={
                status !== SKILL_STATUS.LOCKED
                  ? "0 2px 8px rgba(0,0,0,0.5)"
                  : "none"
              }
            >
              {lessonTitle}
            </Text>
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
function UnitSection({
  unit,
  userProgress,
  onLessonClick,
  index,
  supportLang,
  hasNextUnit,
}) {
  const bgColor = "gray.800";
  const borderColor = "gray.700";

  // Responsive horizontal offset for zigzag pattern
  const zigzagOffset =
    useBreakpointValue({
      base: 90, // Mobile devices
      sm: 110, // Small tablets
      md: 140, // Medium tablets
      lg: 180, // Desktop
    }) || 90; // Fallback to mobile size

  // Responsive SVG container width
  const svgWidth =
    useBreakpointValue({
      base: 240,
      sm: 260,
      md: 300,
      lg: 320,
    }) || 240;

  const unitProgressPercent = getUnitProgress(unit, userProgress);
  const completedCount = unit.lessons.filter(
    (lesson) =>
      userProgress.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED
  ).length;

  const unitTitle = getDisplayText(unit.title, supportLang);
  const unitDescription = getDisplayText(unit.description, supportLang);

  return (
    <MotionBox
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
      mb={8}
      position="relative"
    >
      {/* Decorative gradient orb behind unit */}
      <Box
        position="absolute"
        top="0"
        left="50%"
        transform="translateX(-50%)"
        w="300px"
        h="300px"
        bgGradient={`radial(${unit.color}15, transparent 70%)`}
        filter="blur(60px)"
        opacity={0.6}
        pointerEvents="none"
        zIndex={0}
      />

      <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
        {/* Unit Header with glassmorphism */}
        <Box
          bgGradient={`linear(135deg, ${unit.color}15, ${unit.color}08)`}
          backdropFilter="blur(10px)"
          borderRadius="2xl"
          p={6}
          border="2px solid"
          borderColor={`${unit.color}40`}
          boxShadow={`0 8px 32px ${unit.color}20, 0 4px 16px rgba(0,0,0,0.3)`}
          position="relative"
          overflow="hidden"
          _hover={{
            borderColor: `${unit.color}60`,
            boxShadow: `0 12px 40px ${unit.color}30, 0 6px 20px rgba(0,0,0,0.4)`,
          }}
          transition="all 0.3s ease"
        >
          {/* Subtle pattern overlay */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            opacity={0.03}
            bgImage="radial-gradient(circle at 1px 1px, white 1px, transparent 1px)"
            bgSize="24px 24px"
            pointerEvents="none"
          />

          <HStack justify="space-between" mb={4} position="relative">
            <VStack align="start" spacing={2}>
              <HStack spacing={3}>
                <Box
                  w={5}
                  h={5}
                  borderRadius="full"
                  bg={unit.color}
                  boxShadow={`0 0 20px ${unit.color}80`}
                  animation="pulse 3s ease-in-out infinite"
                  sx={{
                    "@keyframes pulse": {
                      "0%, 100%": { boxShadow: `0 0 20px ${unit.color}80` },
                      "50%": { boxShadow: `0 0 30px ${unit.color}cc` },
                    },
                  }}
                />
                <Heading
                  size="md"
                  bgGradient={`linear(to-r, white, gray.200)`}
                  bgClip="text"
                  fontWeight="bold"
                >
                  {unitTitle}
                </Heading>
                {/* CEFR Level Badge */}
                {unit.cefrLevel && (
                  <Badge
                    colorScheme={
                      unit.cefrLevel === "A1"
                        ? "green"
                        : unit.cefrLevel === "A2"
                        ? "blue"
                        : unit.cefrLevel === "B1"
                        ? "purple"
                        : unit.cefrLevel === "B2"
                        ? "orange"
                        : unit.cefrLevel === "C1"
                        ? "red"
                        : "pink"
                    }
                    fontSize="xs"
                    px={2}
                    py={1}
                    borderRadius="md"
                    fontWeight="bold"
                  >
                    {unit.cefrLevel}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="sm" color="gray.300" ml={8}>
                {unitDescription}
              </Text>
            </VStack>

            <VStack spacing={1}>
              <Box
                p={2}
                borderRadius="xl"
                bgGradient={`linear(135deg, ${unit.color}30, ${unit.color}20)`}
                border="1px solid"
                borderColor={`${unit.color}40`}
              >
                <RiTrophyLine
                  size={28}
                  color={unit.color}
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
                />
              </Box>
              <Text fontSize="sm" fontWeight="bold" color="white">
                {completedCount}/{unit.lessons.length}
              </Text>
            </VStack>
          </HStack>

          {/* Enhanced Unit Progress Bar */}
          <Box position="relative">
            <Progress
              value={unitProgressPercent}
              borderRadius="full"
              size="sm"
              bg="whiteAlpha.100"
              sx={{
                "& > div": {
                  bgGradient: `linear(to-r, ${unit.color}, ${unit.color}dd)`,
                  boxShadow: `0 0 10px ${unit.color}80`,
                },
              }}
            />
            <Text
              position="absolute"
              right={2}
              top="50%"
              transform="translateY(-50%)"
              fontSize="xs"
              fontWeight="bold"
              color="white"
              textShadow="0 1px 2px rgba(0,0,0,0.5)"
            >
              {Math.round(unitProgressPercent)}%
            </Text>
          </Box>
        </Box>

        {/* Connector from unit header to first lesson */}
        <Box
          as="svg"
          position="absolute"
          top="0"
          left="50%"
          transform="translateX(-50%)"
          width="200px"
          height="80px"
          overflow="visible"
          zIndex={0}
          pointerEvents="none"
        >
          <defs>
            <linearGradient
              id={`unit-start-${unit.id}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={unit.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={unit.color} stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <path
            d="M 100 0 Q 100 40, 100 60"
            stroke={`url(#unit-start-${unit.id})`}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="8 4"
          />
        </Box>

        {/* Lessons in this unit - Game-like zigzag layout */}
        <Box position="relative" py={4} minH="200px">
          {unit.lessons.map((lesson, lessonIndex) => {
            const lessonProgress = userProgress.lessons?.[lesson.id];
            let status = SKILL_STATUS.LOCKED;

            // Testing unlock: check for specific nsec in local storage
            const testNsec =
              typeof window !== "undefined"
                ? localStorage.getItem("local_nsec")
                : null;
            const isTestUnlocked =
              testNsec ===
              "nsec1akcvuhtemz3kw58gvvfg38uucu30zfsahyt6ulqapx44lype6a9q42qevv";

            // Determine lesson status
            if (lessonProgress?.status === SKILL_STATUS.COMPLETED) {
              status = SKILL_STATUS.COMPLETED;
            } else if (lessonProgress?.status === SKILL_STATUS.IN_PROGRESS) {
              status = SKILL_STATUS.IN_PROGRESS;
            } else if (
              isTestUnlocked ||
              userProgress.totalXp >= lesson.xpRequired
            ) {
              status = SKILL_STATUS.AVAILABLE;
            }

            // Create zigzag pattern - alternating positions
            const isEven = lessonIndex % 2 === 0;
            const offset = isEven ? 0 : zigzagOffset; // Horizontal offset for zigzag (responsive)
            const yPosition = lessonIndex * 140; // Vertical spacing

            // Calculate connection path
            const nextIsEven = (lessonIndex + 1) % 2 === 0;
            const nextOffset = nextIsEven ? 0 : zigzagOffset;

            return (
              <Box key={lesson.id}>
                {/* SVG Path connecting to next lesson */}
                {lessonIndex < unit.lessons.length - 1 && (
                  <Box
                    as="svg"
                    position="absolute"
                    top={`${yPosition + 45}px`}
                    left="50%"
                    transform="translateX(-50%)"
                    width={`${svgWidth}px`}
                    height="140px"
                    overflow="visible"
                    zIndex={0}
                    pointerEvents="none"
                  >
                    <defs>
                      <linearGradient
                        id={`gradient-${lesson.id}`}
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor={
                            status === SKILL_STATUS.COMPLETED
                              ? unit.color
                              : "#374151"
                          }
                          stopOpacity={
                            status === SKILL_STATUS.COMPLETED ? 0.8 : 0.5
                          }
                        />
                        <stop
                          offset="100%"
                          stopColor={
                            status === SKILL_STATUS.COMPLETED
                              ? unit.color
                              : "#374151"
                          }
                          stopOpacity={
                            status === SKILL_STATUS.COMPLETED ? 0.4 : 0.3
                          }
                        />
                      </linearGradient>
                      {status === SKILL_STATUS.COMPLETED && (
                        <filter id={`glow-${lesson.id}`}>
                          <feGaussianBlur
                            stdDeviation="3"
                            result="coloredBlur"
                          />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      )}
                    </defs>
                    <path
                      d={`M ${svgWidth / 2 + offset} 0 Q ${
                        svgWidth / 2 + (offset + nextOffset) / 2
                      } 70, ${svgWidth / 2 + nextOffset} 95`}
                      stroke={`url(#gradient-${lesson.id})`}
                      strokeWidth="5"
                      fill="none"
                      strokeLinecap="round"
                      filter={
                        status === SKILL_STATUS.COMPLETED
                          ? `url(#glow-${lesson.id})`
                          : "none"
                      }
                      style={{
                        transition: "all 0.3s ease",
                      }}
                    />
                  </Box>
                )}

                {/* Lesson Node */}
                <Box
                  position="absolute"
                  top={`${yPosition}px`}
                  left="50%"
                  transform={`translateX(calc(-50% + ${offset}px))`}
                  zIndex={1}
                >
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
          {/* Spacer to ensure container height accommodates all lessons */}
          <Box h={`${unit.lessons.length * 140}px`} />
        </Box>

        {/* Connector from last lesson to next unit */}
        {hasNextUnit && (
          <Box
            as="svg"
            position="relative"
            left="50%"
            transform="translateX(-50%)"
            width="200px"
            height="100px"
            overflow="visible"
            zIndex={0}
            pointerEvents="none"
            mt={-4}
          >
            <defs>
              <linearGradient
                id={`unit-end-${unit.id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={unit.color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={unit.color} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <path
              d="M 100 0 Q 100 50, 100 100"
              stroke={`url(#unit-end-${unit.id})`}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8 4"
            />
            {/* Animated arrow */}
            <circle cx="100" cy="0" r="4" fill={unit.color} opacity="0.8">
              <animate
                attributeName="cy"
                from="0"
                to="100"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.8"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </Box>
        )}
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.600" />
      <ModalContent
        bg="gray.900"
        color="gray.100"
        borderRadius="2xl"
        overflow="hidden"
        boxShadow={`0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px ${unit.color}40`}
        border="1px solid"
        borderColor={`${unit.color}30`}
      >
        {/* Decorative gradient background */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          h="200px"
          bgGradient={`linear(135deg, ${unit.color}20, transparent)`}
          opacity={0.5}
          pointerEvents="none"
        />

        <ModalHeader
          borderBottomWidth="1px"
          borderColor="whiteAlpha.200"
          position="relative"
          pt={6}
          pb={4}
        >
          <VStack align="start" spacing={2}>
            <HStack spacing={3}>
              <Box
                w={4}
                h={4}
                borderRadius="full"
                bg={unit.color}
                boxShadow={`0 0 15px ${unit.color}80`}
              />
              <Text
                fontSize="2xl"
                fontWeight="bold"
                bgGradient={`linear(to-r, white, gray.200)`}
                bgClip="text"
              >
                {lessonTitle}
              </Text>
            </HStack>
            <Text fontSize="sm" fontWeight="normal" color="gray.400" ml={7}>
              {unitTitle}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton
          color="gray.400"
          _hover={{ color: "white", bg: "whiteAlpha.200" }}
          borderRadius="lg"
          top={4}
          right={4}
        />
        <ModalBody pb={6} pt={6} position="relative">
          <VStack align="stretch" spacing={6}>
            <Text color="gray.300" fontSize="md" lineHeight="tall">
              {lessonDescription}
            </Text>

            {/* Lesson modes */}
            <Box
              bg="whiteAlpha.50"
              p={5}
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.100"
            >
              <Text fontWeight="bold" mb={3} color="white" fontSize="sm">
                {getTranslation(supportLang, "skill_tree_learning_activities")}
              </Text>
              <Flex gap={2} flexWrap="wrap">
                {lesson.modes.map((mode) => {
                  const Icon = MODE_ICONS[mode] || RiStarLine;
                  return (
                    <Badge
                      key={mode}
                      px={4}
                      py={2}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      bg={unit.color}
                      color="white"
                      fontWeight="bold"
                      fontSize="sm"
                      border="2px solid"
                      borderColor="whiteAlpha.300"
                      boxShadow="0 2px 8px rgba(0, 0, 0, 0.3)"
                    >
                      <Icon size={16} />
                      <Text textTransform="capitalize">{mode}</Text>
                    </Badge>
                  );
                })}
              </Flex>
            </Box>

            {/* XP Goal */}
            <Box
              p={5}
              bgGradient="linear(135deg, yellow.900, orange.900)"
              borderRadius="xl"
              position="relative"
              overflow="hidden"
              border="1px solid"
              borderColor="yellow.600"
              boxShadow="0 4px 20px rgba(251, 191, 36, 0.2)"
            >
              <Box
                position="absolute"
                top="-50%"
                right="-20%"
                w="150px"
                h="150px"
                bgGradient="radial(circle, yellow.400, transparent 70%)"
                filter="blur(40px)"
                opacity={0.3}
              />
              <HStack justify="space-between" position="relative">
                <HStack spacing={3}>
                  <Box
                    p={2}
                    borderRadius="lg"
                    bgGradient="linear(135deg, yellow.400, orange.400)"
                    boxShadow="0 2px 10px rgba(251, 191, 36, 0.4)"
                  >
                    <RiStarFill color="white" size={24} />
                  </Box>
                  <Text fontWeight="bold" color="white" fontSize="md">
                    {getTranslation(supportLang, "skill_tree_xp_reward")}
                  </Text>
                </HStack>
                <Badge
                  bgGradient="linear(to-r, yellow.400, orange.400)"
                  color="gray.900"
                  fontSize="xl"
                  px={5}
                  py={2}
                  borderRadius="full"
                  fontWeight="black"
                  boxShadow="0 4px 15px rgba(251, 191, 36, 0.5)"
                >
                  +{lesson.xpReward} XP
                </Badge>
              </HStack>
            </Box>

            {/* Start button */}
            <Button
              size="lg"
              h="60px"
              onClick={() => {
                onStartLesson(lesson);
                onClose();
              }}
              leftIcon={<RiStarLine size={24} />}
              bgGradient={`linear(135deg, ${unit.color}, ${unit.color}dd)`}
              color="white"
              fontSize="lg"
              fontWeight="bold"
              borderRadius="xl"
              boxShadow={`0 8px 25px ${unit.color}40`}
              _hover={{
                bgGradient: `linear(135deg, ${unit.color}dd, ${unit.color})`,
                boxShadow: `0 12px 35px ${unit.color}60`,
                transform: "translateY(-2px)",
              }}
              _active={{
                transform: "translateY(0)",
              }}
              transition="all 0.2s"
            >
              {getTranslation(supportLang, "skill_tree_start_lesson")}
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
  targetLang = "es",
  level = "A1",
  supportLang = "en",
  userProgress = { totalXp: 0, lessons: {} },
  onStartLesson,
  showMultipleLevels = true, // New prop to show multiple levels
  levels = ["A1", "A2", "B1", "B2", "C1", "C2"], // Default to showing all CEFR levels A1 through C2
}) {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Use multi-level path if enabled, otherwise use single level
  const units = showMultipleLevels
    ? getMultiLevelLearningPath(targetLang, levels)
    : getLearningPath(targetLang, level);
  const bgColor = "gray.950";

  const handleLessonClick = (lesson, unit, status) => {
    if (
      status === SKILL_STATUS.AVAILABLE ||
      status === SKILL_STATUS.IN_PROGRESS ||
      status === SKILL_STATUS.COMPLETED
    ) {
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
  const totalLessons = units.reduce(
    (sum, unit) => sum + unit.lessons.length,
    0
  );
  const completedLessons = units.reduce(
    (sum, unit) =>
      sum +
      unit.lessons.filter(
        (lesson) =>
          userProgress.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED
      ).length,
    0
  );
  const overallProgress =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <Box bg={bgColor} minH="100vh" position="relative" overflow="hidden">
      {/* Animated Background Gradients */}
      <Box
        position="absolute"
        top="-20%"
        left="-10%"
        w="600px"
        h="600px"
        bgGradient="radial(circle, teal.500, transparent 70%)"
        filter="blur(80px)"
        opacity={0.15}
        animation="float 20s ease-in-out infinite"
        sx={{
          "@keyframes float": {
            "0%, 100%": { transform: "translate(0, 0) scale(1)" },
            "33%": { transform: "translate(50px, -30px) scale(1.1)" },
            "66%": { transform: "translate(-30px, 50px) scale(0.9)" },
          },
        }}
      />
      <Box
        position="absolute"
        top="30%"
        right="-10%"
        w="500px"
        h="500px"
        bgGradient="radial(circle, purple.500, transparent 70%)"
        filter="blur(80px)"
        opacity={0.12}
        animation="float 25s ease-in-out infinite 5s"
        sx={{
          "@keyframes float": {
            "0%, 100%": { transform: "translate(0, 0) scale(1)" },
            "33%": { transform: "translate(-40px, 40px) scale(1.1)" },
            "66%": { transform: "translate(40px, -40px) scale(0.9)" },
          },
        }}
      />
      <Box
        position="absolute"
        bottom="10%"
        left="20%"
        w="400px"
        h="400px"
        bgGradient="radial(circle, blue.500, transparent 70%)"
        filter="blur(80px)"
        opacity={0.1}
        animation="float 30s ease-in-out infinite 10s"
        sx={{
          "@keyframes float": {
            "0%, 100%": { transform: "translate(0, 0) scale(1)" },
            "33%": { transform: "translate(30px, -50px) scale(1.2)" },
            "66%": { transform: "translate(-50px, 30px) scale(0.8)" },
          },
        }}
      />

      <Container
        maxW="container.lg"
        py={6}
        px={{ base: 3, sm: 4, md: 6 }}
        position="relative"
        zIndex={1}
      >
        {/* Minimal Progress Header */}
        <MotionBox
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          mb={8}
        >
          <HStack
            justify="space-between"
            bgGradient="linear(135deg, whiteAlpha.50, whiteAlpha.30)"
            backdropFilter="blur(10px)"
            px={6}
            py={3}
            borderRadius="full"
            border="1px solid"
            borderColor="whiteAlpha.200"
            boxShadow="0 4px 16px rgba(0, 0, 0, 0.3)"
          >
            <HStack spacing={3}>
              <Box
                p={1.5}
                borderRadius="lg"
                bgGradient="linear(135deg, yellow.400, orange.400)"
                boxShadow="0 2px 8px rgba(251, 191, 36, 0.3)"
              >
                <RiTrophyLine size={18} color="white" />
              </Box>
              <VStack spacing={0} align="start">
                <Text
                  fontSize="lg"
                  fontWeight="black"
                  color="white"
                  lineHeight="1"
                >
                  {userProgress.totalXp || 0} XP
                </Text>
                <Text fontSize="xs" color="gray.400" fontWeight="medium">
                  {getTranslation(supportLang, "skill_tree_level", {
                    level: Math.floor((userProgress.totalXp || 0) / 100) + 1,
                  })}
                </Text>
              </VStack>
            </HStack>

            <HStack spacing={4}>
              <VStack spacing={0} align="end">
                <Text fontSize="sm" fontWeight="bold" color="white">
                  {Math.round(overallProgress)}%
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {completedLessons}/{totalLessons}
                </Text>
              </VStack>
              <Box w="120px">
                <Progress
                  value={overallProgress}
                  borderRadius="full"
                  size="sm"
                  bg="whiteAlpha.200"
                  sx={{
                    "& > div": {
                      bgGradient:
                        "linear(to-r, teal.400, blue.400, purple.400)",
                      boxShadow: "0 0 10px rgba(56, 178, 172, 0.5)",
                    },
                  }}
                />
              </Box>
            </HStack>
          </HStack>
        </MotionBox>

        {/* Skill Tree Units */}
        <VStack spacing={8} align="stretch">
          {units.length > 0 ? (
            units.map((unit, index) => (
              <UnitSection
                key={unit.id}
                unit={unit}
                userProgress={userProgress}
                onLessonClick={handleLessonClick}
                index={index}
                supportLang={supportLang}
                hasNextUnit={index < units.length - 1}
              />
            ))
          ) : (
            <Box textAlign="center" py={12}>
              <Text fontSize="lg" color="gray.400">
                {getTranslation(supportLang, "skill_tree_no_path")}
              </Text>
              <Text fontSize="sm" color="gray.500" mt={2}>
                {getTranslation(supportLang, "skill_tree_check_back")}
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
