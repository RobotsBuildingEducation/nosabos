import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { LuBlocks, LuSparkles } from "react-icons/lu";
import FlashcardSkillTree from "./FlashcardSkillTree";
import Conversations from "./Conversations";
import CEFRLevelNavigator from "./CEFRLevelNavigator";
import {
  RiLockLine,
  RiCheckLine,
  RiStarLine,
  RiStarFill,
  RiTrophyLine,
  RiBookOpenLine,
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
  // Additional icons for more variety
  RiUserAddLine,
  RiChatSmileLine,
  RiPhoneLine,
  RiMoneyDollarCircleLine,
  RiCakeLine,
  RiSunLine,
  RiMoonLine,
  RiShoppingBag3Line,
  RiHome4Line,
  RiFlightTakeoffLine,
  RiWalkLine,
  RiRunLine,
  RiRoadMapLine,
  RiDirectionLine,
  RiStore2Line,
  RiShoppingBasketLine,
  RiAppleLine,
  RiLeafLine,
  RiTShirt2Line,
  RiDoorLine,
  RiAlarmLine,
  RiCalendarCheckLine,
  RiCalendarEventLine,
  RiCalendar2Line,
  RiTimer2Line,
  RiHourglassLine,
  RiParentLine,
  RiUserHeartLine,
  RiGroupLine,
  RiBrushLine,
  RiContrastLine,
  RiDropLine,
  RiFridgeLine,
  RiKnifeLine,
  RiBookReadLine,
  RiBook3Line,
  RiBookletLine,
  RiArticleLine,
  RiFileTextLine,
  RiDraftLine,
  RiFileList3Line,
  RiHospitalLine,
  RiStethoscopeLine,
  RiMentalHealthLine,
  RiHeartAddLine,
  RiFirstAidKitLine,
  RiGraduationCapLine,
  RiSchoolLine,
  RiPencilRulerLine,
  RiGovernmentLine,
  RiAuctionLine,
  RiBarChartLine,
  RiLineChartLine,
  RiPieChartLine,
  RiPresentationLine,
  RiMicLine,
  RiVoiceprintLine,
  RiSpeakerLine,
  RiChatQuoteLine,
  RiMessageLine,
  RiQuestionAnswerFill,
  RiFeedbackFill,
  RiDiscussFill,
  RiChatCheckLine,
  RiUserSmileLine,
  RiEmotionHappyLine,
  RiEmotionNormalLine,
  RiEmotionUnhappyLine,
  RiThumbUpLine,
  RiThumbDownLine,
  RiHeart3Line,
  RiDislikeLine,
  RiEye2Line,
  RiEyeLine,
  RiUserLine,
  RiUser3Line,
  RiAccountCircleLine,
  RiMapLine,
  RiBuilding4Line,
  RiBuildingLine,
  RiCommunityLine,
  RiCarLine,
  RiSailboatLine,
  RiCompass3Line,
  RiNavigationLine,
  RiSignpostLine,
  RiRestaurant2Line,
  RiGamepadLine,
  RiBasketballLine,
  RiCameraLine,
  RiGalleryLine,
  RiImage2Line,
  RiMedalLine,
  RiAwardLine,
  RiVipCrownLine,
  RiLightbulbFlashLine,
  RiNodeTree,
  RiFocus3Line,
  RiCheckboxCircleLine,
  RiTodoLine,
  RiPlayListAddLine,
  RiFileEditLine,
  RiEditLine,
  RiEdit2Line,
  RiInkBottleLine,
  RiPenNibLine,
  RiMarkPenLine,
  RiArtboardLine,
  RiDashboardLine,
  RiPieChart2Line,
  RiStockLine,
  RiBriefcase4Line,
  RiBriefcase5Line,
  RiSuitcase2Line,
  RiAncientGateLine,
  RiBuilding2Line,
  RiSparklingLine,
  RiSparklingFill,
  RiStarSmileLine,
  RiFireLine,
  RiTreeLine,
  RiSeedlingLine,
  RiRecycleLine,
  RiGlobeLine,
  RiCompass2Line,
  RiFlagLine,
  RiFlag2Line,
  RiMedalFill,
  RiAwardFill,
  RiCheckboxLine,
} from "react-icons/ri";
import {
  getLearningPath,
  getMultiLevelLearningPath,
  getUnitProgress,
  getNextLesson,
  SKILL_STATUS,
} from "../data/skillTreeData";
import { translations } from "../utils/translation";
import { FiTarget } from "react-icons/fi";
import { WaveBar } from "./WaveBar";
import {
  getAllLessonProgress,
  getAllFlashcardProgress,
} from "../utils/cefrProgress";
import { CEFR_LEVELS } from "../data/flashcards/common";
import { MdOutlineDescription } from "react-icons/md";
import { FaMicrophone } from "react-icons/fa";
import useSoundSettings from "../hooks/useSoundSettings";
import modeSwitcherSound from "../assets/modeswitcher.mp3";
import selectSound from "../assets/select.mp3";

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

// Get app language from localStorage (UI language setting)
const getAppLanguage = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("appLanguage") || "en";
  }
  return "en";
};

// Helper to get UI display text using appLanguage (for titles, descriptions, etc.)
const getUIDisplayText = (textObj) => {
  if (!textObj) return "";
  if (typeof textObj === "string") return textObj;
  const lang = getAppLanguage();
  const fallback = textObj.en || textObj.es || Object.values(textObj)[0] || "";
  return textObj[lang] || fallback;
};

// Helper to get translations for UI elements - uses appLanguage for UI text
const getTranslation = (key, params = {}) => {
  const lang = getAppLanguage();
  const dict = translations[lang] || translations.en;
  const raw = dict[key] || key;
  if (typeof raw !== "string") return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`
  );
};

const CEFR_LEVEL_COLORS = {
  A1: "green",
  A2: "blue",
  B1: "purple",
  B2: "orange",
  C1: "red",
  C2: "pink",
};

// Icon mapping for different learning modes
const MODE_ICONS = {
  vocabulary: RiBook2Line,
  grammar: RiPencilLine,
  realtime: FaMicrophone,
  stories: MdOutlineDescription,
  reading: RiBookOpenLine,
};

// Map vocabulary library topics to contextual icons
const TOPIC_ICON_MAP = {
  // Basic communication
  greetings: RiHandHeartLine,
  introductions: RiUserVoiceLine,
  "question words": RiQuestionAnswerLine,

  // Numbers and counting
  numbers: RiNumbersLine,

  // Time and dates
  time: RiTimeLine,
  "time expressions": RiHistoryLine,
  "days of week": RiCalendarLine,

  // Food and dining
  "food and drinks": RiRestaurantLine,

  // Daily life
  "daily activities": RiTimeLine,
  preferences: RiHeartLine,

  // People and relationships
  family: RiTeamLine,
  "physical descriptions": RiEmotionLine,
  personality: RiEmotionLine,

  // Places and navigation
  places: RiMapPinLine,
  directions: RiCompassLine,
  transportation: RiBusLine,

  // Shopping and commerce
  shopping: RiShoppingCartLine,
  clothing: RiShirtLine,

  // Colors and appearance
  colors: RiPaletteLine,

  // Sports and hobbies
  sports: RiFootballLine,
  entertainment: RiMusicLine,
  "arts and reading": RiBook2Line,

  // Travel
  travel: RiSuitcaseLine,

  // Weather and nature
  weather: RiCloudyLine,
  nature: RiPlantLine,
  environment: RiEarthLine,
  geography: RiGlobalLine,

  // Work and education
  careers: RiBriefcaseLine,
  professional: RiBriefcaseLine,

  // Health and wellness
  "body parts": RiBodyScanLine,
  health: RiHeartPulseLine,
  wellness: RiHeartPulseLine,

  // Advanced topics
  debate: RiMegaphoneLine,
  "current events": RiNewspaperLine,
  literature: RiQuillPenLine,
  "visual arts": RiPaintBrushLine,
  cinema: RiClapperboardLine,
  "digital communication": RiSmartphoneLine,
  science: RiFlaskLine,
  "digital economy": RiBitCoinLine,
  "social justice": RiScalesLine,
  "global issues": RiEarthLine,

  // Common objects and spaces
  "common objects": RiBookOpenLine,
  "house and rooms": RiMapPinLine,
};

// Get icon based on lesson's vocabulary topic
const getIconFromTopic = (topic) => {
  if (!topic) return RiBookOpenLine;

  // Normalize topic string (lowercase, trim)
  const normalizedTopic = topic.toLowerCase().trim();

  // Direct match
  if (TOPIC_ICON_MAP[normalizedTopic]) {
    return TOPIC_ICON_MAP[normalizedTopic];
  }

  // Partial match for compound topics (e.g., "greetings structures" -> "greetings")
  for (const [key, icon] of Object.entries(TOPIC_ICON_MAP)) {
    if (normalizedTopic.includes(key)) {
      return icon;
    }
  }

  return RiBookOpenLine; // Default fallback
};

// Direct mapping of all unique lesson titles to contextual icons
const LESSON_TITLE_ICONS = {
  // Pre-A1 - Foundations
  "Alphabet & Sounds": RiFileTextLine,
  "Pronunciation Building Blocks": RiVoiceprintLine,
  "Survival Phrases": RiFirstAidKitLine,

  // A1 - Greetings & Introductions
  "Hello and Goodbye": RiHandHeartLine,
  "Meeting Someone New": RiUserAddLine,
  "Polite Conversations": RiChatSmileLine,
  "What's Your Name?": RiAccountCircleLine,
  "Nice to Meet You": RiUserSmileLine,
  "Tell Me About Yourself": RiMessageLine,

  // A1 - Numbers
  "Counting to Twenty": RiNumbersLine,
  "Using Numbers Daily": RiAlarmLine,
  "Phone Numbers and Ages": RiPhoneLine,
  "Counting to One Hundred": RiBarChartLine,
  "Prices and Money": RiMoneyDollarCircleLine,
  "Big Numbers in Context": RiLineChartLine,

  // A1 - Days & Time
  "Monday to Sunday": RiCalendarLine,
  "What Day Is It?": RiCalendarCheckLine,
  "Planning Your Week": RiCalendarEventLine,
  "Twelve Months": RiCalendar2Line,
  "When's Your Birthday?": RiCakeLine,
  "Important Dates": RiCalendarEventLine,
  "What Time Is It?": RiTimeLine,
  "Daily Schedule": RiTimer2Line,
  "Making Appointments": RiTodoLine,

  // A1 - Family & Colors
  "My Family Tree": RiTreeLine,
  "Talking About Family": RiParentLine,
  "Family Relationships": RiUserHeartLine,
  "Rainbow Colors": RiContrastLine,
  "Describing Things": RiEyeLine,
  "Colors Everywhere": RiDropLine,

  // A1 - Food & Dining
  "Food Vocabulary": RiAppleLine,
  "I'm Hungry!": RiEmotionUnhappyLine,
  "My Favorite Foods": RiHeart3Line,
  "Restaurant Words": RiRestaurant2Line,
  "Ordering a Meal": RiKnifeLine,
  "Paying the Bill": RiBitCoinLine,

  // A1 - Objects & Spaces
  "Everyday Items": RiBookOpenLine,
  "What Is This?": RiQuestionLine,
  "Objects Around Us": RiEye2Line,
  "Rooms of the House": RiDoorLine,
  "Where Is It?": RiCompass3Line,
  "At Home": RiHome4Line,

  // A1 - Clothing & Daily Life
  "What to Wear": RiTShirt2Line,
  "Shopping for Clothes": RiShoppingBag3Line,
  "My Wardrobe": RiShirtLine,
  "My Day": RiSunLine,
  "Daily Activities": RiWalkLine,
  "From Morning to Night": RiMoonLine,

  // A1 - Weather & Preferences
  "How's the Weather?": RiCloudyLine,
  "Four Seasons": RiLeafLine,
  "Weather Reports": RiSunLine,
  "I Like, I Love": RiThumbUpLine,
  "Expressing Preferences": RiEmotionHappyLine,
  "Favorites and Dislikes": RiThumbDownLine,

  // A1 - Questions & Descriptions
  "Question Words": RiQuestionAnswerFill,
  "Asking Questions": RiChatQuoteLine,
  "Getting Information": RiFeedbackFill,
  "Appearance Words": RiUserLine,
  "How Do They Look?": RiUser3Line,
  "Detailed Descriptions": RiEyeLine,

  // A1 - Places & Shopping
  "Places Around Town": RiBuildingLine,
  "My Neighborhood": RiCommunityLine,
  "Dream Destinations": RiFlightTakeoffLine,
  "At the Store": RiStore2Line,
  "Bargain Hunting": RiAuctionLine,
  "Smart Shopping": RiShoppingBasketLine,
  "Fresh Produce": RiLeafLine,
  "Buying Groceries": RiShoppingCartLine,
  "Market Day": RiFridgeLine,

  // A1 - Transportation & Directions
  "Getting Around": RiRoadMapLine,
  "Taking the Bus": RiBusLine,
  "Travel Options": RiCarLine,
  "Left and Right": RiDirectionLine,
  "How Do I Get There?": RiNavigationLine,
  "Finding Your Way": RiSignpostLine,

  // A2 - Future & Hobbies
  "Future Activities": RiCalendarEventLine,
  "Let's Meet Up!": RiGroupLine,
  "Scheduling Events": RiCalendarCheckLine,
  "Free Time Fun": RiGamepadLine,
  "What Do You Enjoy?": RiEmotionHappyLine,
  "Sharing Interests": RiDiscussFill,
  "Playing Sports": RiBasketballLine,
  "Staying Active": RiRunLine,
  "Fitness Goals": FiTarget,

  // A2 - Past Tense & Stories
  "Yesterday's Actions": RiHistoryLine,
  "What Did You Do?": RiChatCheckLine,
  "Recent Events": RiCalendar2Line,
  "Common Irregular Verbs": RiEditLine,
  "Last Week": RiHistoryFill,
  "Life Stories": RiBookReadLine,
  "Story Elements": RiFileList3Line,
  "Once Upon a Time": RiBook3Line,
  "My Story": RiDraftLine,

  // A2 - Future & Health
  "Dreams and Goals": RiLightbulbFlashLine,
  "What Will You Do?": RiFocus3Line,
  "Planning Ahead": RiRoadMapLine,
  "Body Parts": RiBodyScanLine,
  "How Do You Feel?": RiMentalHealthLine,
  "Healthy Living": RiHeartAddLine,
  "Medical Terms": RiStethoscopeLine,
  "Visiting the Doctor": RiHospitalLine,
  "Health Concerns": RiFirstAidKitLine,

  // A2 - Work & Education
  "Career Words": RiBriefcase4Line,
  "What Do You Do?": RiBriefcase5Line,
  "Dream Job": RiSuitcase2Line,
  "In the Classroom": RiSchoolLine,
  "School Life": RiGraduationCapLine,
  "Learning Journey": RiPencilRulerLine,

  // A2 - Technology
  "Digital Devices": RiSmartphoneLine,
  "Using Technology": RiLightbulbFlashLine,
  "Connected Life": RiGlobalLine,

  // B1 - Present Perfect & Continuous
  "Have You Ever?": RiQuestionAnswerLine,
  "Life Experiences": RiSuitcaseLine,
  Achievements: RiMedalLine,
  "While It Was Happening": RiHourglassLine,
  "Background Actions": RiFileEditLine,
  "Setting the Scene": RiCameraLine,

  // B1 - Future & Comparisons
  "Tomorrow's World": RiGlobeLine,
  Predictions: RiLightbulbFlashLine,
  "Future Possibilities": RiSparklingLine,
  "Better or Worse": RiBarChartLine,
  "Making Comparisons": RiPieChart2Line,
  Superlatives: RiAwardLine,

  // B1 - Modals & Suggestions
  "Should and Shouldn't": RiCheckboxCircleLine,
  "Helpful Suggestions": RiLightbulbLine,
  "Problem Solving": RiNodeTree,
  "Why Don't We?": RiGroupLine,
  "Let's Try This": RiPlayListAddLine,
  "Collaborative Ideas": RiTeamLine,

  // B1 - Conditionals & Travel
  "If I Were You": RiQuestionAnswerLine,
  "Hypothetical Situations": RiLightbulbLine,
  "Imagining Possibilities": RiSparklingFill,
  "Trip Planning": RiMapLine,
  "Booking a Trip": RiFlightTakeoffLine,
  "Adventure Awaits": RiSailboatLine,

  // B1 - Environment & Culture
  "Our Planet": RiEarthLine,
  "Going Green": RiRecycleLine,
  "Saving Earth": RiSeedlingLine,
  "Cultural Heritage": RiAncientGateLine,
  "Customs and Festivals": RiFlagLine,
  "Celebrating Diversity": RiFlag2Line,

  // B1 - Media & Opinions
  Headlines: RiNewspaperLine,
  "Current Events": RiArticleLine,
  "Informed Citizen": RiGovernmentLine,
  "I Think That...": RiChatQuoteLine,
  "Sharing Views": RiDiscussFill,
  "Respectful Debate": RiScalesLine,

  // B1 - Complaints & Anecdotes
  "Something's Wrong": RiEmotionUnhappyLine,
  "I'm Not Satisfied": RiDislikeLine,
  "Resolving Issues": RiCheckboxLine,
  "Memorable Moments": RiStarSmileLine,
  "Sharing Experiences": RiMessageLine,
  "Learning from Life": RiBookletLine,

  // B2 - Modal Verbs & Past Perfect
  "Maybe and Perhaps": RiQuestionLine,
  "Likely or Unlikely": RiPieChartLine,
  "Making Predictions": RiLineChartLine,
  "Before It Happened": RiHistoryFill,
  "Earlier Actions": RiTimeLine,
  "Complex Timelines": RiCalendar2Line,

  // B2 - Passive & Reported Speech
  "It Was Done": RiCheckboxCircleLine,
  "Formal Writing": RiPenNibLine,
  "Professional Tone": RiFileTextLine,
  "She Said That...": RiVoiceprintLine,
  "Quoting Others": RiChatCheckLine,
  "Retelling Stories": RiBookReadLine,

  // B2 - Relative Clauses & Register
  "Who, Which, That": RiEdit2Line,
  "Connecting Ideas": RiNodeTree,
  "Complex Sentences": RiFileList3Line,
  "Registers of Speech": RiMicLine,
  "Appropriate Language": RiSpeakerLine,
  "Context Matters": RiFocus3Line,

  // B2 - Business & Science
  "Corporate World": RiBuilding4Line,
  "Professional Meetings": RiPresentationLine,
  "Business Communication": RiBriefcaseLine,
  "Scientific Terms": RiFlaskLine,
  "Technological Advances": RiLightbulbFlashLine,
  "Future of Science": RiStockLine,

  // B2 - Social Issues & Arts
  "Society Today": RiCommunityLine,
  "Discussing Problems": RiFeedbackFill,
  "Making Change": RiFireLine,
  "Creative Expression": RiBrushLine,
  "Artistic Movements": RiGalleryLine,
  "Cultural Analysis": RiImage2Line,

  // B2 - Politics & Wellness
  "Civic Engagement": RiGovernmentLine,
  "Political Discourse": RiMegaphoneLine,
  "Active Citizenship": RiFlagLine,
  "Wellness Choices": RiHeartPulseLine,
  "Balanced Living": RiMentalHealthLine,
  "Holistic Health": RiHeartAddLine,

  // B2 - Philosophy
  "Philosophical Ideas": RiNodeTree,
  "Deep Thinking": RiLightbulbFlashLine,
  "Theoretical Discussion": RiArticleLine,

  // C1 - Subjunctive & Conditionals
  "Doubt and Desire": RiEmotionNormalLine,
  "Expressing Wishes": RiStarLine,
  "Nuanced Meaning": RiInkBottleLine,
  "If Only...": RiEmotionLine,
  "Contrary to Fact": RiQuestionLine,
  "Complex Emotions": RiMentalHealthLine,
  "Advanced If Clauses": RiMarkPenLine,
  "Mixed Conditionals": RiEdit2Line,
  "Sophisticated Logic": RiNodeTree,

  // C1 - Idioms & Academic
  "Native Phrases": RiChatSmileLine,
  "Sound Natural": RiVoiceprintLine,
  "Cultural Fluency": RiCompass2Line,
  "Scholarly Language": RiQuillPenLine,
  "Research Papers": RiDraftLine,
  "Critical Analysis": RiFileTextLine,

  // C1 - Business & Debate
  "Business Etiquette": RiBriefcase4Line,
  "Executive Presence": RiVipCrownLine,
  "Leadership Language": RiBriefcase5Line,
  "Persuasive Language": RiSpeakerLine,
  "Building Arguments": RiArtboardLine,
  "Winning Debates": RiAwardFill,

  // C1 - Culture & Literature
  "Cultural Studies": RiBuilding2Line,
  "Interpreting Culture": RiCompass2Line,
  "Cross-Cultural Understanding": RiGlobeLine,
  "Literary Devices": RiPenNibLine,
  "Analyzing Texts": RiBookReadLine,
  "Literary Criticism": RiInkBottleLine,

  // C1 - Discourse
  "Discourse Markers": RiMarkPenLine,
  "Coherent Arguments": RiDashboardLine,
  "Fluent Expression": RiMicLine,

  // C2 - Near-Native Fluency
  "Advanced Expressions": RiQuillPenLine,
  "Speaking Like a Native": RiVipCrownLine,
  "Cultural Mastery": RiAwardFill,
  Dialects: RiVoiceprintLine,
  "Accent and Usage": RiSpeakerLine,
  "Linguistic Diversity": RiGlobeLine,

  // C2 - Refined Language
  "Refined Language": RiPenNibLine,
  "Elegant Expression": RiInkBottleLine,
  "Artistic Language": RiArtboardLine,

  // C2 - Rhetoric & Mastery
  "Persuasive Techniques": RiMegaphoneLine,
  "Powerful Speech": RiMicLine,
  "Master Rhetoric": RiPresentationLine,
  "Expert Terminology": RiFileTextLine,
  "Professional Fields": RiBriefcase5Line,
  "Domain Expertise": RiTrophyLine,

  // C2 - Precision & Cultural Intelligence
  "Fine Distinctions": RiContrastLine,
  "Precise Meaning": FiTarget,
  "Mastery of Detail": RiFocus3Line,
  "Cultural Intelligence": RiCompass2Line,
  "Cultural Navigator": RiNavigationLine,
  "Cultural Ambassador": RiEarthLine,

  // C2 - Ultimate Mastery
  "Native-Like Skills": RiMedalFill,
  "Perfect Fluency": RiSparklingFill,
  "Complete Mastery": RiTrophyLine,
};

// Get icon based on exact lesson title match
const getTitleBasedIcon = (title) => {
  if (!title) return RiBookOpenLine;

  // Direct lookup from comprehensive title mapping
  return LESSON_TITLE_ICONS[title] || RiBookOpenLine;
};

// Get unique icon for each individual lesson based on lesson content
const getLessonIcon = (lesson, unitId) => {
  // Quiz lessons always get the question mark icon
  if (lesson.id.includes("-quiz")) return RiQuestionLine;

  // Get title for pattern matching
  const titleEn = lesson.title?.en || "";

  // Skill Builder lessons get blocks icon
  if (titleEn.endsWith("Skill Builder")) return LuBlocks;

  // Integrated Practice lessons get sparkles icon
  if (titleEn.endsWith("Integrated Practice")) return LuSparkles;

  // Get icon based on lesson title (primary method)
  const titleIcon = getTitleBasedIcon(titleEn);

  // If we got a non-default icon from the title, use it
  if (titleIcon !== RiBookOpenLine) {
    return titleIcon;
  }

  // Fallback: try vocabulary topic if title didn't produce a specific icon
  if (lesson.content?.vocabulary?.topic) {
    return getIconFromTopic(lesson.content.vocabulary.topic);
  }

  // Final fallback
  return RiBookOpenLine;
};

/**
 * Individual Lesson Node Component
 * Represents a single lesson in the skill tree
 *
 * This version is optimized for mobile taps:
 * - Single real <button> element (VStack as="button")
 * - No Framer whileTap / whileHover
 * - touchAction: "manipulation" to avoid scroll interference
 */
function LessonNode({ lesson, unit, status, onClick, supportLang }) {
  const lockedColor = "gray.600";

  const lessonTitle = getUIDisplayText(lesson.title);

  const getNodeIcon = () => {
    if (status === SKILL_STATUS.COMPLETED) return RiCheckLine;
    if (status === SKILL_STATUS.LOCKED) return RiLockLine;
    return getLessonIcon(lesson, unit.id);
  };

  const Icon = getNodeIcon();

  const isClickable =
    status === SKILL_STATUS.AVAILABLE ||
    status === SKILL_STATUS.IN_PROGRESS ||
    status === SKILL_STATUS.COMPLETED;

  const handlePress = () => {
    if (!isClickable) return;
    onClick?.();
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
      <Box position="relative">
        <VStack
          as="button"
          type="button"
          spacing={2}
          onClick={handlePress}
          disabled={!isClickable}
          cursor={isClickable ? "pointer" : "not-allowed"}
          bg="transparent"
          border="none"
          _focus={{ outline: "none" }}
          _focusVisible={
            isClickable ? { boxShadow: `0 0 0 3px ${unit.color}` } : {}
          }
          _active={
            isClickable ? { transform: "translateY(2px) scale(0.97)" } : {}
          }
          sx={{
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Box position="relative">
            {/* Glow Effect for active lessons */}
            {status !== SKILL_STATUS.LOCKED && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                w="90px"
                h="90px"
                borderRadius="full"
                bg={status === SKILL_STATUS.COMPLETED ? "#FFD700" : unit.color}
                filter="blur(16px)"
                opacity={status === SKILL_STATUS.COMPLETED ? 0.6 : 0.4}
                pointerEvents="none"
              />
            )}

            {/* Lesson Circle */}
            <Box
              w="90px"
              h="90px"
              borderRadius="full"
              bgGradient={
                status === SKILL_STATUS.LOCKED
                  ? "linear(to-br, gray.700, gray.800)"
                  : status === SKILL_STATUS.COMPLETED
                  ? "linear(135deg, #FFD700, #FFA500, #FFD700)"
                  : `linear(135deg, ${unit.color}dd, ${unit.color})`
              }
              border="4px solid"
              borderColor="transparent"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
              boxShadow={
                status === SKILL_STATUS.LOCKED
                  ? "0 8px 0px rgba(0,0,0,0.4)"
                  : status === SKILL_STATUS.COMPLETED
                  ? "0 8px 0px #DAA520, 0 0 15px rgba(255,215,0,0.3)"
                  : `0 8px 0px ${unit.color}AA`
              }
              opacity={status === SKILL_STATUS.LOCKED ? 0.4 : 1}
              transition="transform 0.15s ease, box-shadow 0.15s ease"
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
                  pointerEvents="none"
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
                    pointerEvents="none"
                    position="absolute"
                    top="10%"
                    right="15%"
                    w="9px"
                    h="9px"
                    borderRadius="full"
                    bg="white"
                    boxShadow="0 0 10px 3px rgba(255,255,255,0.7), 0 0 18px rgba(255,255,255,0.5)"
                    animation="sparkle 2.4s ease-in-out infinite"
                    sx={{
                      "@keyframes sparkle": {
                        "0%, 100%": {
                          opacity: 0,
                          transform: "scale(0.5) rotate(0deg)",
                        },
                        "50%": {
                          opacity: 0.55,
                          transform: "scale(0.6) rotate(15deg)",
                          filter:
                            "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))",
                        },
                      },
                    }}
                  />
                  <Box
                    pointerEvents="none"
                    position="absolute"
                    bottom="15%"
                    left="10%"
                    w="7px"
                    h="7px"
                    borderRadius="full"
                    bg="white"
                    boxShadow="0 0 8px 2px rgba(255,255,255,0.6), 0 0 14px rgba(255,255,255,0.4)"
                    animation="sparkle 2.7s ease-in-out infinite 1.2s"
                    sx={{
                      "@keyframes sparkle": {
                        "0%, 100%": {
                          opacity: 0,
                          transform: "scale(0.4) rotate(0deg)",
                        },
                        "50%": {
                          opacity: 0.9,
                          transform: "scale(1.3) rotate(-10deg)",
                          filter: "drop-shadow(0 0 6px rgba(255,255,255,0.8))",
                        },
                      },
                    }}
                  />
                  <Box
                    pointerEvents="none"
                    position="absolute"
                    top="45%"
                    left="60%"
                    w="5px"
                    h="5px"
                    borderRadius="full"
                    bg="white"
                    boxShadow="0 0 8px 2px rgba(255,255,255,0.7), 0 0 16px rgba(255,255,255,0.5)"
                    animation="sparkle 2.2s ease-in-out infinite 0.6s"
                    sx={{
                      "@keyframes sparkle": {
                        "0%, 100%": {
                          opacity: 0,
                          transform: "scale(0.3) rotate(0deg)",
                        },
                        "50%": {
                          opacity: 0.9,
                          transform: "scale(1.1) rotate(8deg)",
                          filter: "drop-shadow(0 0 7px rgba(255,255,255,0.8))",
                        },
                      },
                    }}
                  />
                </>
              )}
            </Box>
          </Box>

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
    </MotionBox>
  );
}

/**
 * Unit Component
 * Represents a unit containing multiple lessons
 */
const UnitSection = React.memo(function UnitSection({
  unit,
  userProgress,
  onLessonClick,
  index,
  supportLang,
  hasNextUnit,
  previousUnit,
  latestUnlockedLessonId,
  latestUnlockedRef,
  isTutorialComplete = true,
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

  const unitTitle = getUIDisplayText(unit.title);
  const unitDescription = getUIDisplayText(unit.description);

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
                />
                <Heading
                  size="md"
                  bgGradient={`linear(to-r, white, gray.200)`}
                  bgClip="text"
                  fontWeight="bold"
                >
                  {unitTitle}
                </Heading>
              </HStack>
              <Text fontSize="sm" color="gray.300" ml={8}>
                {unitDescription}
              </Text>
            </VStack>

            <VStack spacing={1}>
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
            } else {
              // Sequential unlock logic: check if previous lesson is completed
              let isPreviousLessonCompleted = false;

              if (lessonIndex === 0) {
                // First lesson of the unit
                if (index === 0) {
                  // First lesson of first unit - only available if tutorial is complete
                  isPreviousLessonCompleted = isTutorialComplete;
                } else if (previousUnit) {
                  // First lesson of subsequent units - check if last lesson of previous unit is completed
                  const previousUnitLastLesson =
                    previousUnit.lessons[previousUnit.lessons.length - 1];
                  isPreviousLessonCompleted =
                    userProgress.lessons?.[previousUnitLastLesson.id]
                      ?.status === SKILL_STATUS.COMPLETED;
                }
              } else {
                // Not the first lesson - check if previous lesson in same unit is completed
                isPreviousLessonCompleted =
                  userProgress.lessons?.[unit.lessons[lessonIndex - 1].id]
                    ?.status === SKILL_STATUS.COMPLETED;
              }

              if (isTestUnlocked || isPreviousLessonCompleted) {
                status = SKILL_STATUS.AVAILABLE;
              }
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
                  ref={lesson.id === latestUnlockedLessonId ? latestUnlockedRef : null}
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
});

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

  const lessonTitle = getUIDisplayText(lesson.title);
  const unitTitle = getUIDisplayText(unit.title);
  const lessonDescription = getUIDisplayText(lesson.description);

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
                {getTranslation("skill_tree_learning_activities")}
              </Text>
              <Flex gap={2} flexWrap="wrap">
                {lesson.modes.map((mode) => {
                  const Icon = MODE_ICONS[mode] || RiStarLine;
                  const modeKey = `mode_${mode}`;
                  const modeName =
                    getTranslation(modeKey) !== modeKey
                      ? getTranslation(modeKey)
                      : mode;
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
                      <Text textTransform="capitalize">{modeName}</Text>
                    </Badge>
                  );
                })}
              </Flex>
            </Box>

            {/* XP Goal / Passing Score / Tutorial */}
            <Box
              p={5}
              borderRadius="xl"
              position="relative"
              overflow="hidden"
              border="1px solid"
              borderColor={
                lesson.isTutorial
                  ? "blue.600"
                  : lesson.isFinalQuiz
                  ? "purple.600"
                  : "yellow.600"
              }
              boxShadow={
                lesson.isTutorial
                  ? "0 4px 12px rgba(99, 102, 241, 0.2)"
                  : lesson.isFinalQuiz
                  ? "0 4px 12px rgba(159, 122, 234, 0.2)"
                  : "0 4px 12px rgba(251, 191, 36, 0.2)"
              }
            >
              <Box
                position="absolute"
                top="-50%"
                right="-20%"
                w="150px"
                h="150px"
                filter="blur(40px)"
                opacity={0.3}
              />
              <HStack justify="space-between" position="relative">
                <HStack spacing={3}>
                  <Box
                    p={2}
                    borderRadius="lg"
                    bgGradient={
                      lesson.isTutorial
                        ? "linear(135deg, blue.400, indigo.600)"
                        : lesson.isFinalQuiz
                        ? "linear(135deg, purple.400, purple.600)"
                        : "linear(135deg, yellow.400, orange.400)"
                    }
                    boxShadow={
                      lesson.isTutorial
                        ? "0 2px 10px rgba(99, 102, 241, 0.4)"
                        : lesson.isFinalQuiz
                        ? "0 2px 10px rgba(159, 122, 234, 0.4)"
                        : "0 2px 10px rgba(251, 191, 36, 0.4)"
                    }
                  >
                    {lesson.isTutorial ? (
                      <RiTrophyLine color="white" size={24} />
                    ) : lesson.isFinalQuiz ? (
                      <RiTrophyLine color="white" size={24} />
                    ) : (
                      <RiStarFill color="white" size={24} />
                    )}
                  </Box>
                  <Text fontWeight="bold" color="white" fontSize="md">
                    {lesson.isTutorial
                      ? getTranslation("skill_tree_tutorial_goal")
                      : lesson.isFinalQuiz
                      ? getTranslation("skill_tree_passing_score")
                      : getTranslation("skill_tree_xp_reward")}
                  </Text>
                </HStack>
                <Text
                  color="white"
                  fontSize={{
                    base: "xs",
                    sm: "sm",
                    md: lesson.isTutorial ? "md" : "xl",
                  }}
                  px={{ base: 2, md: 5 }}
                  py={2}
                  fontWeight="bold"
                  whiteSpace={{ base: "normal", md: "nowrap" }}
                  textAlign="right"
                  maxW={{ base: "140px", sm: "200px", md: "none" }}
                >
                  {lesson.isTutorial
                    ? getTranslation("skill_tree_tutorial_activities")
                    : lesson.isFinalQuiz
                    ? `${Math.round(
                        (lesson.quizConfig?.passingScore /
                          lesson.quizConfig?.questionsRequired) *
                          100
                      )}%`
                    : `+${lesson.xpReward} XP`}
                </Text>
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
              {getTranslation("skill_tree_start_lesson")}
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
  onCompleteFlashcard, // Callback for flashcard completion with XP
  onRandomPracticeFlashcard, // Callback for random practice (awards XP, resets card)
  pauseMs = 2000,
  showMultipleLevels = true, // New prop to show multiple levels
  levels = ["A1", "A2", "B1", "B2", "C1", "C2"], // Default to showing all CEFR levels A1 through C2
  // Mode-specific level props
  activeLessonLevel = "A1", // Currently active/visible level in lesson mode
  activeFlashcardLevel = "A1", // Currently active/visible level in flashcard mode
  currentLessonLevel = "A1", // User's current progress level in lesson mode
  currentFlashcardLevel = "A1", // User's current progress level in flashcard mode
  onLessonLevelChange, // Callback when user navigates to different level in lesson mode
  onFlashcardLevelChange, // Callback when user navigates to different level in flashcard mode
  lessonLevelCompletionStatus = {}, // Status of all levels in lesson mode
  flashcardLevelCompletionStatus = {}, // Status of all levels in flashcard mode
  // Legacy props (for backwards compatibility)
  activeCEFRLevel = "A1", // Currently active/visible CEFR level
  currentCEFRLevel = "A1", // User's current progress level
  onLevelChange, // Callback when user navigates to different level
  levelCompletionStatus = {}, // Status of all levels (unlocked/locked, progress, etc.)
  // Conversations props
  activeNpub = "", // User's npub for conversations
  // Path mode props (controlled by parent)
  pathMode = "path",
  onPathModeChange,
  scrollToLatestUnlockedRef,
  scrollToLatestTrigger = 0,
  // Tutorial props
  isTutorialComplete = true, // Whether skill tree tutorial is complete (lessons locked until complete)
}) {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Sound settings
  const playSound = useSoundSettings((s) => s.playSound);

  // Ref for the latest unlocked lesson element
  const latestUnlockedRef = useRef(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Scroll to latest unlocked lesson function
  const scrollToLatestUnlocked = useCallback(() => {
    if (latestUnlockedRef.current) {
      latestUnlockedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  // Expose scroll function to parent via ref
  useEffect(() => {
    if (scrollToLatestUnlockedRef) {
      scrollToLatestUnlockedRef.current = scrollToLatestUnlocked;
    }
  }, [scrollToLatestUnlocked, scrollToLatestUnlockedRef]);

  // Scroll to latest unlocked when trigger changes (and we're in path mode)
  useEffect(() => {
    if (scrollToLatestTrigger > 0 && pathMode === "path") {
      // Use a longer timeout to ensure the path view has rendered
      const timer = setTimeout(() => {
        scrollToLatestUnlocked();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [scrollToLatestTrigger, pathMode, scrollToLatestUnlocked]);

  // Select appropriate level props based on current mode
  const effectiveActiveLevel =
    pathMode === "path" ? activeLessonLevel : activeFlashcardLevel;
  const effectiveCurrentLevel =
    pathMode === "path" ? currentLessonLevel : currentFlashcardLevel;
  const effectiveOnLevelChange =
    pathMode === "path" ? onLessonLevelChange : onFlashcardLevelChange;
  const effectiveLevelCompletionStatus =
    pathMode === "path"
      ? lessonLevelCompletionStatus
      : flashcardLevelCompletionStatus;

  // Memoize units to prevent unnecessary recalculations
  const units = useMemo(() => {
    return showMultipleLevels
      ? getMultiLevelLearningPath(targetLang, levels)
      : getLearningPath(targetLang, level);
  }, [showMultipleLevels, targetLang, levels, level]);

  // Filter units to show only the effective active level for the current mode
  const visibleUnits = useMemo(() => {
    return units.filter((unit) => unit.cefrLevel === effectiveActiveLevel);
  }, [units, effectiveActiveLevel]);

  // Calculate max unlocked proficiency level for conversations
  // Uses the highest unlocked level between skill tree and flashcards
  const maxProficiencyLevel = useMemo(() => {
    const levelsOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const lessonIndex = levelsOrder.indexOf(currentLessonLevel);
    const flashcardIndex = levelsOrder.indexOf(currentFlashcardLevel);
    const maxIndex = Math.max(lessonIndex, flashcardIndex);
    return levelsOrder[maxIndex] || "A1";
  }, [currentLessonLevel, currentFlashcardLevel]);

  const bgColor = "gray.950";

  const handleLessonClick = (lesson, unit, status) => {
    if (
      status === SKILL_STATUS.AVAILABLE ||
      status === SKILL_STATUS.IN_PROGRESS ||
      status === SKILL_STATUS.COMPLETED
    ) {
      playSound(selectSound);
      setSelectedLesson(lesson);
      setSelectedUnit(unit);
      onOpen();
    }
  };

  const handleStartLesson = (lesson) => {
    playSound(modeSwitcherSound);
    if (onStartLesson) {
      onStartLesson(lesson);
    }
  };

  // Separate handler for flashcard completion - doesn't trigger lesson logic
  const handleFlashcardComplete = (card) => {
    // Call parent callback to award XP and update progress
    if (onCompleteFlashcard) {
      onCompleteFlashcard(card);
    }
  };

  // Handler for random practice - awards XP and resets card to be practiced again
  const handleRandomPractice = (card) => {
    if (onRandomPracticeFlashcard) {
      onRandomPracticeFlashcard(card);
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

  // Find the latest unlocked lesson (first AVAILABLE or IN_PROGRESS lesson)
  const latestUnlockedLessonId = useMemo(() => {
    // If tutorial not complete, no lesson is available
    if (!isTutorialComplete) return null;

    for (let unitIndex = 0; unitIndex < visibleUnits.length; unitIndex++) {
      const unit = visibleUnits[unitIndex];
      const previousUnit = unitIndex > 0 ? visibleUnits[unitIndex - 1] : null;

      for (let lessonIndex = 0; lessonIndex < unit.lessons.length; lessonIndex++) {
        const lesson = unit.lessons[lessonIndex];
        const lessonProgress = userProgress.lessons?.[lesson.id];

        // Check if this lesson is IN_PROGRESS
        if (lessonProgress?.status === SKILL_STATUS.IN_PROGRESS) {
          return lesson.id;
        }

        // Check if this lesson is AVAILABLE (not completed, not in progress)
        if (lessonProgress?.status !== SKILL_STATUS.COMPLETED) {
          // Check if it should be available based on previous lesson
          let isPreviousCompleted = false;

          if (lessonIndex === 0) {
            if (unitIndex === 0) {
              isPreviousCompleted = true;
            } else if (previousUnit) {
              const prevUnitLastLesson =
                previousUnit.lessons[previousUnit.lessons.length - 1];
              isPreviousCompleted =
                userProgress.lessons?.[prevUnitLastLesson.id]?.status ===
                SKILL_STATUS.COMPLETED;
            }
          } else {
            isPreviousCompleted =
              userProgress.lessons?.[unit.lessons[lessonIndex - 1].id]?.status ===
              SKILL_STATUS.COMPLETED;
          }

          if (isPreviousCompleted) {
            return lesson.id;
          }
        }
      }
    }
    return null;
  }, [visibleUnits, userProgress, isTutorialComplete]);

  // Calculate current level progress (for the active CEFR level)
  const levelProgress = useMemo(() => {
    if (visibleUnits.length === 0) return 0;

    const levelTotalLessons = visibleUnits.reduce(
      (sum, unit) => sum + unit.lessons.length,
      0
    );
    const levelCompletedLessons = visibleUnits.reduce(
      (sum, unit) =>
        sum +
        unit.lessons.filter(
          (lesson) =>
            userProgress.lessons?.[lesson.id]?.status === SKILL_STATUS.COMPLETED
        ).length,
      0
    );

    return levelTotalLessons > 0
      ? (levelCompletedLessons / levelTotalLessons) * 100
      : 0;
  }, [visibleUnits, userProgress.lessons]);

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
        {/* CEFR Level Navigator - hidden in conversations mode */}
        {effectiveOnLevelChange && pathMode !== "conversations" && (
          <CEFRLevelNavigator
            currentLevel={effectiveCurrentLevel}
            activeCEFRLevel={effectiveActiveLevel}
            onLevelChange={effectiveOnLevelChange}
            levelProgress={levelProgress}
            supportLang={supportLang}
            levelCompletionStatus={effectiveLevelCompletionStatus}
          />
        )}

        {/* Simplified proficiency display for conversations mode */}
        {pathMode === "conversations" &&
          (() => {
            // Use the correctly calculated maxProficiencyLevel
            const LEVEL_INFO = {
              A1: {
                name: { en: "Beginner", es: "Principiante" },
                desc: {
                  en: "Basic survival language",
                  es: "Lenguaje básico de supervivencia",
                },
                color: "#3B82F6",
              },
              A2: {
                name: { en: "Elementary", es: "Elemental" },
                desc: {
                  en: "Simple everyday communication",
                  es: "Comunicación cotidiana simple",
                },
                color: "#8B5CF6",
              },
              B1: {
                name: { en: "Intermediate", es: "Intermedio" },
                desc: {
                  en: "Handle everyday situations",
                  es: "Manejo de situaciones cotidianas",
                },
                color: "#A855F7",
              },
              B2: {
                name: { en: "Upper Intermediate", es: "Intermedio Alto" },
                desc: {
                  en: "Complex discussions",
                  es: "Discusiones complejas",
                },
                color: "#F97316",
              },
              C1: {
                name: { en: "Advanced", es: "Avanzado" },
                desc: {
                  en: "Sophisticated language use",
                  es: "Uso sofisticado del idioma",
                },
                color: "#EF4444",
              },
              C2: {
                name: { en: "Mastery", es: "Maestría" },
                desc: {
                  en: "Near-native proficiency",
                  es: "Competencia casi nativa",
                },
                color: "#EC4899",
              },
            };
            const info = LEVEL_INFO[maxProficiencyLevel];
            const lang = getAppLanguage();

            return (
              <MotionBox
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                w="100%"
                mb={6}
              >
                <VStack spacing={2} align="center">
                  <Badge
                    px={6}
                    py={3}
                    borderRadius="16px"
                    bgGradient={`linear(135deg, ${info.color}99, ${info.color})`}
                    color="white"
                    fontSize="md"
                    fontWeight="black"
                    boxShadow={`0 4px 14px ${info.color}66`}
                  >
                    {maxProficiencyLevel}
                  </Badge>
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {info.name[lang] || info.name.en}
                  </Text>
                  <Text fontSize="sm" color="gray.400" textAlign="center">
                    {info.desc[lang] || info.desc.en}
                  </Text>
                </VStack>
              </MotionBox>
            );
          })()}

        {/* Minimal Progress Header - hidden in conversations mode */}
        {pathMode !== "conversations" && (
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
              borderRadius="8px"
              border="1px solid"
              borderColor="whiteAlpha.200"
              boxShadow="0 4px 16px rgba(0, 0, 0, 0.3)"
            >
              <HStack spacing={3}>
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
                    {getTranslation("skill_tree_level", {
                      level: Math.floor((userProgress.totalXp || 0) / 100) + 1,
                    })}
                  </Text>
                </VStack>
              </HStack>

              {/* CEFR Level Progress Bar */}
              {(() => {
                const progress =
                  pathMode === "path"
                    ? getAllLessonProgress(userProgress, targetLang)
                    : getAllFlashcardProgress(userProgress, targetLang);
                const currentLevelProgress = progress[effectiveActiveLevel];
                return (
                  <VStack spacing={1} align="end" minW="200px">
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="semibold" color="white">
                        {effectiveActiveLevel}
                      </Text>
                      <Text fontSize="xs" fontWeight="bold" color="blue.300">
                        {currentLevelProgress.percentage}%
                      </Text>
                    </HStack>
                    <Box w="full">
                      <WaveBar
                        value={currentLevelProgress.percentage}
                        height={12}
                        start="#60A5FA"
                        end="#2563EB"
                        bg="rgba(255,255,255,0.05)"
                        border="rgba(255,255,255,0.1)"
                      />
                    </Box>
                  </VStack>
                );
              })()}
            </HStack>
          </MotionBox>
        )}

        {/* Skill Tree Units, Flashcards, or Conversations */}
        <AnimatePresence mode="wait" initial={false}>
          {pathMode === "path" ? (
            <MotionBox
              key="path-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <VStack spacing={8} align="stretch">
                {visibleUnits.length > 0 ? (
                  visibleUnits.map((unit, index) => (
                    <UnitSection
                      key={unit.id}
                      unit={unit}
                      userProgress={userProgress}
                      onLessonClick={handleLessonClick}
                      index={index}
                      supportLang={supportLang}
                      hasNextUnit={index < visibleUnits.length - 1}
                      previousUnit={index > 0 ? visibleUnits[index - 1] : null}
                      latestUnlockedLessonId={latestUnlockedLessonId}
                      latestUnlockedRef={latestUnlockedRef}
                      isTutorialComplete={isTutorialComplete}
                    />
                  ))
                ) : (
                  <Box textAlign="center" py={12}>
                    <Text fontSize="lg" color="gray.400">
                      {getTranslation("skill_tree_no_path")}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      {getTranslation("skill_tree_check_back")}
                    </Text>
                  </Box>
                )}
              </VStack>
            </MotionBox>
          ) : pathMode === "flashcards" ? (
            <MotionBox
              key="flashcard-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <FlashcardSkillTree
                userProgress={userProgress}
                onStartFlashcard={handleFlashcardComplete}
                onRandomPractice={handleRandomPractice}
                targetLang={targetLang}
                supportLang={supportLang}
                activeCEFRLevel={effectiveActiveLevel}
                pauseMs={pauseMs}
              />
            </MotionBox>
          ) : (
            <MotionBox
              key="conversations-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <Conversations
                activeNpub={activeNpub}
                targetLang={targetLang}
                supportLang={supportLang}
                pauseMs={pauseMs}
                maxProficiencyLevel={maxProficiencyLevel}
              />
            </MotionBox>
          )}
        </AnimatePresence>

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
