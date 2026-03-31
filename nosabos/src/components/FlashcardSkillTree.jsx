import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, VStack, HStack, Text, Button, Badge } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiStarLine,
  RiCheckLine,
  RiArrowDownLine,
  RiLockLine,
  RiShuffleLine,
  RiFlashlightLine,
  RiTimeLine,
  RiAddLine,
  RiBookOpenLine,
} from "react-icons/ri";
import {
  FLASHCARD_DATA,
  loadRelevantFlashcards,
  getUserProgressLevel,
} from "../data/flashcardData";
import { CEFR_COLORS, getConceptText } from "../data/flashcards/common";
import FlashcardPractice from "./FlashcardPractice";
import { translations } from "../utils/translation";
import { getLanguageXp } from "../utils/progressTracking";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import {
  buildStudyQueue,
  getDefaultSRSData,
  isCardDue,
} from "../utils/spacedRepetition";

// Get app language from localStorage (UI language setting)
const getAppLanguage = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("appLanguage") || "en";
  }
  return "en";
};

// Translation helper for UI strings - uses appLanguage for UI text
const getTranslation = (key, params = {}) => {
  const lang = getAppLanguage();
  const dict = translations[lang] || translations.en;
  const raw = dict[key] || key;
  if (typeof raw !== "string") return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`
  );
};

// Get effective language for flashcard content display
const getEffectiveCardLanguage = (supportLang) => {
  const appLang = getAppLanguage();
  if (supportLang && supportLang !== "en") {
    return supportLang;
  }
  return appLang;
};

const MotionBox = motion(Box);

// --- Study Queue Card ---
const StudyCard = React.memo(function StudyCard({
  card,
  cardType,
  onClick,
  supportLang,
  index,
}) {
  const cefrColor = CEFR_COLORS[card.cefrLevel];

  const typeColors = {
    learning: { bg: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.4)", label: getTranslation("srs_learning"), labelColor: "yellow.300" },
    due: { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.4)", label: getTranslation("srs_review"), labelColor: "red.300" },
    new: { bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.4)", label: getTranslation("srs_new"), labelColor: "blue.300" },
  };

  const style = typeColors[cardType] || typeColors.new;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={onClick}
      cursor="pointer"
      w="100%"
    >
      <HStack
        w="100%"
        p={4}
        bg={style.bg}
        border="1px solid"
        borderColor={style.border}
        borderRadius="xl"
        justify="space-between"
        _hover={{
          bg: `${style.bg.replace("0.12", "0.22").replace("0.15", "0.25")}`,
          transform: "translateY(-1px)",
        }}
        transition="all 0.15s ease"
      >
        <HStack spacing={3} flex={1} minW={0}>
          <Box
            w="4px"
            h="40px"
            borderRadius="full"
            bg={cefrColor.primary}
            flexShrink={0}
          />
          <VStack align="start" spacing={0} minW={0}>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="white"
              noOfLines={1}
            >
              {getConceptText(card, getEffectiveCardLanguage(supportLang))}
            </Text>
            <HStack spacing={2}>
              <Badge
                fontSize="xs"
                colorScheme="whiteAlpha"
                variant="subtle"
                bg="whiteAlpha.100"
              >
                {card.cefrLevel}
              </Badge>
              <Text fontSize="xs" color={style.labelColor}>
                {style.label}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </HStack>
    </MotionBox>
  );
});

// --- Count Badge ---
const CountBadge = ({ icon: Icon, count, label, color, onClick, isActive }) => (
  <VStack
    spacing={1}
    p={3}
    flex={1}
    borderRadius="xl"
    bg={isActive ? `${color}18` : "whiteAlpha.50"}
    border="1px solid"
    borderColor={isActive ? `${color}40` : "whiteAlpha.100"}
    cursor={onClick ? "pointer" : "default"}
    onClick={onClick}
    _hover={onClick ? { bg: `${color}22` } : undefined}
    transition="all 0.15s ease"
  >
    <HStack spacing={1}>
      <Icon size={16} color={color} />
      <Text fontSize="xl" fontWeight="black" color={color}>
        {count}
      </Text>
    </HStack>
    <Text fontSize="xs" color="gray.400" textAlign="center">
      {label}
    </Text>
  </VStack>
);

export default function FlashcardSkillTree({
  userProgress = { flashcards: {} },
  onStartFlashcard,
  onRandomPractice,
  targetLang = "es",
  supportLang = "en",
  activeCEFRLevel = null,
  pauseMs = 2000,
}) {
  const [practiceCard, setPracticeCard] = useState(null);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [currentCardType, setCurrentCardType] = useState("new");
  const [localSRSUpdates, setLocalSRSUpdates] = useState({});
  const [flashcardData, setFlashcardData] = useState(() =>
    activeCEFRLevel
      ? FLASHCARD_DATA.filter((card) => card.cefrLevel === activeCEFRLevel)
      : FLASHCARD_DATA
  );
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [studyStarted, setStudyStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

  const playSound = useSoundSettings((s) => s.playSound);

  const languageXp = useMemo(
    () => getLanguageXp(userProgress, targetLang),
    [userProgress, targetLang]
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Reset session when language changes
  useEffect(() => {
    setLocalSRSUpdates({});
    setStudyStarted(false);
    setCurrentIndex(0);
    setSessionStats({ reviewed: 0, correct: 0 });
  }, [targetLang]);

  // Load relevant flashcards
  useEffect(() => {
    let isMounted = true;

    async function loadFlashcards() {
      setIsLoadingFlashcards(true);
      try {
        const relevantFlashcards = await loadRelevantFlashcards(userProgress);
        if (isMounted && relevantFlashcards.length > 0) {
          const filtered = activeCEFRLevel
            ? relevantFlashcards.filter((c) => c.cefrLevel === activeCEFRLevel)
            : relevantFlashcards;
          if (filtered.length === 0 && activeCEFRLevel) {
            setFlashcardData(
              FLASHCARD_DATA.filter((c) => c.cefrLevel === activeCEFRLevel)
            );
          } else {
            setFlashcardData(filtered);
          }
        } else if (isMounted) {
          setFlashcardData(
            activeCEFRLevel
              ? FLASHCARD_DATA.filter((c) => c.cefrLevel === activeCEFRLevel)
              : FLASHCARD_DATA
          );
        }
      } catch (error) {
        console.error("Error loading flashcards:", error);
        if (isMounted) {
          setFlashcardData(
            activeCEFRLevel
              ? FLASHCARD_DATA.filter((c) => c.cefrLevel === activeCEFRLevel)
              : FLASHCARD_DATA
          );
        }
      } finally {
        if (isMounted) setIsLoadingFlashcards(false);
      }
    }

    if (loadRelevantFlashcards) loadFlashcards();
    return () => { isMounted = false; };
  }, [userProgress, activeCEFRLevel]);

  // Build progress map merging Firestore data + local SRS updates
  const progressMap = useMemo(() => {
    const map = {};
    const flashcards = userProgress.flashcards || {};
    for (const [id, data] of Object.entries(flashcards)) {
      map[id] = { ...data };
    }
    // Merge local SRS updates (from current session)
    for (const [id, data] of Object.entries(localSRSUpdates)) {
      map[id] = { ...map[id], ...data };
    }
    return map;
  }, [userProgress.flashcards, localSRSUpdates]);

  // Build the SRS study queue
  const { studyQueue, counts } = useMemo(
    () => buildStudyQueue(flashcardData, progressMap, 10),
    [flashcardData, progressMap]
  );

  // Current card in the study session
  const currentCard = studyQueue[currentIndex] || null;
  const currentCardTypeInQueue = useMemo(() => {
    if (!currentCard) return "new";
    const p = progressMap[currentCard.id];
    if (!p || !p.dueDate) return "new";
    if (p.state === "learning") return "learning";
    return "due";
  }, [currentCard, progressMap]);

  const handleStartStudy = useCallback(() => {
    setStudyStarted(true);
    setCurrentIndex(0);
    setSessionStats({ reviewed: 0, correct: 0 });
    if (studyQueue.length > 0) {
      playSound(selectSound);
      setPracticeCard(studyQueue[0]);
      setCurrentCardType(
        (() => {
          const p = progressMap[studyQueue[0].id];
          if (!p || !p.dueDate) return "new";
          if (p.state === "learning") return "learning";
          return "due";
        })()
      );
      setIsPracticeOpen(true);
    }
  }, [studyQueue, progressMap, playSound]);

  const handleCardClick = useCallback(
    (card, type) => {
      playSound(selectSound);
      setCurrentCardType(type);
      setPracticeCard(card);
      setIsPracticeOpen(true);
    },
    [playSound]
  );

  const handleComplete = useCallback(
    (card) => {
      // card now includes srsData from the quality rating
      const srsData = card.srsData || {};

      // Update local SRS state for immediate UI feedback
      setLocalSRSUpdates((prev) => ({
        ...prev,
        [card.id]: {
          ...srsData,
          completed: true,
        },
      }));

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: prev.correct + 1,
      }));

      // Call parent callback (saves to Firestore)
      if (onStartFlashcard) {
        onStartFlashcard(card);
      }

      setIsPracticeOpen(false);
      setPracticeCard(null);

      // Advance to next card in queue
      setCurrentIndex((prev) => prev + 1);
    },
    [onStartFlashcard]
  );

  const handleIncorrectComplete = useCallback(
    (card) => {
      // Card answered incorrectly - SRS resets it to learning
      const srsData = card.srsData || {};

      setLocalSRSUpdates((prev) => ({
        ...prev,
        [card.id]: {
          ...srsData,
          completed: true,
        },
      }));

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: prev.correct,
      }));

      // Save the SRS data even for incorrect answers
      if (onStartFlashcard) {
        onStartFlashcard(card);
      }

      setIsPracticeOpen(false);
      setPracticeCard(null);
      setCurrentIndex((prev) => prev + 1);
    },
    [onStartFlashcard]
  );

  const handleClosePractice = useCallback(() => {
    setIsPracticeOpen(false);
    setPracticeCard(null);
  }, []);

  const handleEndSession = useCallback(() => {
    setStudyStarted(false);
    setCurrentIndex(0);
  }, []);

  // Session complete state
  const isSessionComplete =
    studyStarted && (currentIndex >= studyQueue.length || studyQueue.length === 0);

  return (
    <Box w="100%" minH="500px" position="relative">
      {!studyStarted ? (
        // ===== STUDY DASHBOARD =====
        <VStack spacing={6} align="stretch">
          {/* Stats row */}
          <HStack spacing={3}>
            <CountBadge
              icon={RiTimeLine}
              count={counts.due}
              label={getTranslation("srs_due_label")}
              color="#EF4444"
            />
            <CountBadge
              icon={RiFlashlightLine}
              count={counts.learning}
              label={getTranslation("srs_learning_label")}
              color="#FBBF24"
            />
            <CountBadge
              icon={RiAddLine}
              count={counts.new}
              label={getTranslation("srs_new_label")}
              color="#38BDF8"
            />
          </HStack>

          {/* Study button */}
          {counts.total > 0 ? (
            <Button
              onClick={handleStartStudy}
              size="lg"
              h="60px"
              bg="linear-gradient(135deg, #3B82F6, #8B5CF6)"
              color="white"
              borderRadius="xl"
              fontSize="lg"
              fontWeight="bold"
              _hover={{
                bg: "linear-gradient(135deg, #2563EB, #7C3AED)",
                transform: "translateY(-1px)",
              }}
              _active={{ transform: "translateY(0)" }}
              leftIcon={<RiBookOpenLine size={22} />}
              boxShadow="0 4px 20px rgba(59, 130, 246, 0.3)"
            >
              {getTranslation("srs_study_now", { count: counts.total })}
            </Button>
          ) : (
            <MotionBox
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <VStack
                spacing={3}
                p={8}
                borderRadius="xl"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.100"
              >
                <RiCheckLine size={48} color="#22C55E" />
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {getTranslation("srs_all_caught_up")}
                </Text>
                <Text fontSize="sm" color="gray.400" textAlign="center">
                  {getTranslation("srs_come_back_later")}
                </Text>
              </VStack>
            </MotionBox>
          )}

          {/* Card list preview */}
          {studyQueue.length > 0 && (
            <VStack spacing={2} align="stretch">
              <Text fontSize="sm" color="gray.500" fontWeight="medium" px={1}>
                {getTranslation("srs_up_next")}
              </Text>
              <AnimatePresence initial={false}>
                {studyQueue.slice(0, 8).map((card, idx) => {
                  const p = progressMap[card.id];
                  let type = "new";
                  if (p?.state === "learning") type = "learning";
                  else if (p?.dueDate && isCardDue(p)) type = "due";

                  return (
                    <StudyCard
                      key={card.id}
                      card={card}
                      cardType={type}
                      onClick={() => handleCardClick(card, type)}
                      supportLang={supportLang}
                      index={idx}
                    />
                  );
                })}
              </AnimatePresence>
              {studyQueue.length > 8 && (
                <Text fontSize="xs" color="gray.500" textAlign="center" pt={1}>
                  {getTranslation("srs_more_cards", {
                    count: studyQueue.length - 8,
                  })}
                </Text>
              )}
            </VStack>
          )}
        </VStack>
      ) : isSessionComplete ? (
        // ===== SESSION COMPLETE =====
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <VStack spacing={6} p={8} align="center">
            <MotionBox
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <RiCheckLine size={72} color="#22C55E" />
            </MotionBox>
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="black" color="white">
                {getTranslation("srs_session_complete")}
              </Text>
              <Text fontSize="md" color="gray.400">
                {getTranslation("srs_session_stats", {
                  reviewed: sessionStats.reviewed,
                  correct: sessionStats.correct,
                })}
              </Text>
            </VStack>

            {/* Accuracy bar */}
            {sessionStats.reviewed > 0 && (
              <Box w="200px">
                <Box
                  w="100%"
                  h="8px"
                  bg="whiteAlpha.100"
                  borderRadius="full"
                  overflow="hidden"
                >
                  <Box
                    h="100%"
                    w={`${(sessionStats.correct / sessionStats.reviewed) * 100}%`}
                    bg="green.400"
                    borderRadius="full"
                    transition="width 0.5s ease"
                  />
                </Box>
                <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
                  {Math.round(
                    (sessionStats.correct / sessionStats.reviewed) * 100
                  )}
                  % {getTranslation("srs_accuracy")}
                </Text>
              </Box>
            )}

            <Button
              onClick={handleEndSession}
              variant="outline"
              borderColor="whiteAlpha.300"
              color="white"
              _hover={{ bg: "whiteAlpha.100" }}
              mt={2}
            >
              {getTranslation("srs_back_to_dashboard")}
            </Button>
          </VStack>
        </MotionBox>
      ) : (
        // ===== ACTIVE STUDY SESSION =====
        <VStack spacing={4} align="stretch">
          {/* Session progress bar */}
          <HStack spacing={3} align="center">
            <Box flex={1} h="6px" bg="whiteAlpha.100" borderRadius="full" overflow="hidden">
              <Box
                h="100%"
                w={`${studyQueue.length > 0
                  ? (currentIndex / studyQueue.length) * 100
                  : 0}%`}
                bg="linear-gradient(90deg, #3B82F6, #8B5CF6)"
                borderRadius="full"
                transition="width 0.3s ease"
              />
            </Box>
            <Text fontSize="xs" color="gray.400" flexShrink={0}>
              {currentIndex}/{studyQueue.length}
            </Text>
          </HStack>

          {/* Current card preview */}
          {currentCard && (
            <MotionBox
              key={currentCard.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <StudyCard
                card={currentCard}
                cardType={currentCardTypeInQueue}
                onClick={() =>
                  handleCardClick(currentCard, currentCardTypeInQueue)
                }
                supportLang={supportLang}
                index={0}
              />
            </MotionBox>
          )}

          {/* Upcoming cards */}
          {studyQueue.length > currentIndex + 1 && (
            <VStack spacing={2} align="stretch" opacity={0.5}>
              <Text fontSize="xs" color="gray.500" px={1}>
                {getTranslation("srs_up_next")}
              </Text>
              {studyQueue.slice(currentIndex + 1, currentIndex + 4).map((card, idx) => {
                const p = progressMap[card.id];
                let type = "new";
                if (p?.state === "learning") type = "learning";
                else if (p?.dueDate && isCardDue(p)) type = "due";
                return (
                  <StudyCard
                    key={card.id}
                    card={card}
                    cardType={type}
                    onClick={() => handleCardClick(card, type)}
                    supportLang={supportLang}
                    index={idx + 1}
                  />
                );
              })}
            </VStack>
          )}

          {/* End session button */}
          <Button
            onClick={handleEndSession}
            variant="ghost"
            size="sm"
            color="gray.500"
            _hover={{ color: "white", bg: "whiteAlpha.100" }}
          >
            {getTranslation("srs_end_session")}
          </Button>
        </VStack>
      )}

      {/* Practice Modal */}
      {practiceCard && (
        <FlashcardPractice
          card={practiceCard}
          isOpen={isPracticeOpen}
          onClose={handleClosePractice}
          onComplete={handleComplete}
          onIncorrectComplete={handleIncorrectComplete}
          targetLang={targetLang}
          supportLang={supportLang}
          pauseMs={pauseMs}
          languageXp={languageXp}
          srsData={progressMap[practiceCard?.id] || {}}
          cardType={currentCardType}
        />
      )}
    </Box>
  );
}
