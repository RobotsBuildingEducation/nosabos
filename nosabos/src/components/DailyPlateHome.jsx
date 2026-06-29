// src/components/DailyPlateHome.jsx
//
// The landing surface for pathMode "plate". Shows today's composed session
// (Tutor lesson → skill-tree lesson → flash cards), a single "Start daily
// practice" CTA, and at-a-glance daily-goal context (pet + activity
// heatmap) via standalone copies in PlatePetPanel / PlateActivityHeatmap.
// Deliberately plain (no entrance animations, no imports from other
// component files' internals) — App.jsx's conductor drives the guided
// session; this screen is where it starts and ends.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { FiPlay } from "react-icons/fi";

import { WaveBar } from "./WaveBar";
import PlatePetPanel from "./PlatePetPanel";
import PlateActivityHeatmap from "./PlateActivityHeatmap";
import useSoundSettings from "../hooks/useSoundSettings";
import { useThemeStore } from "../useThemeStore";
import selectSound from "../assets/select.mp3";
import {
  getDailyPlateSnapshot,
  getNextPlateCourse,
  hasSeenFirstQuest,
  isPastFirstQuest,
} from "../utils/dailyPlate";
import {
  getReusableMemory,
  getStoredBlueprint,
  getStoredRepairPlan,
  getStoredQuestExplanation,
  storeQuestExplanation,
} from "../utils/companionMemory";
import {
  buildQuestBubble,
  companionMemorySummary,
} from "../utils/companionMemoryCopy";
import {
  PLATE_CLEARED_COPY,
  PLATE_COURSE_META,
  PLATE_NEXT_COPY,
  PLATE_TITLE_COPY,
  plateUiCopy,
} from "../utils/dailyPlateCopy";

const START_COPY = {
  en: "Start tasks",
  es: "Comenzar tareas",
  pt: "Começar tarefas",
  fr: "Commencer les tâches",
  it: "Inizia le attività",
  de: "Aufgaben starten",
  ja: "タスクを始める",
  zh: "开始任务",
  ru: "Начать задания",
  ar: "ابدأ المهام",
  hi: "कार्य शुरू करें",
};

const CONTINUE_COPY = {
  en: "Continue practice",
  es: "Continuar práctica",
  pt: "Continuar prática",
  fr: "Continuer la pratique",
  it: "Continua la pratica",
  de: "Weiterüben",
  ja: "練習を続ける",
  zh: "继续练习",
  ru: "Продолжить практику",
  ar: "واصل التدريب",
  hi: "अभ्यास जारी रखें",
};

const SUBTITLE_COPY = {
  en: "Complete your tasks to earn an XP bonus",
  es: "Completa tus tareas y gana un bono de XP",
  pt: "Conclua suas tarefas e ganhe um bônus de XP",
  fr: "Termine tes tâches pour gagner un bonus d'XP",
  it: "Completa le attività e ottieni un bonus di XP",
  de: "Schließe deine Aufgaben ab, um einen XP-Bonus zu erhalten",
  ja: "タスクを達成してXPボーナスを獲得しよう",
  zh: "完成所有任务可获得经验值奖励",
  ru: "Выполни задания и получи XP-бонус",
  ar: "أكمل مهامك واحصل على مكافأة XP",
  hi: "अपने कार्य पूरे करें और XP बोनस पाएं",
};

export default function DailyPlateHome({
  user,
  targetLang = "es",
  appLanguage = "en",
  dailyXp = 0,
  dailyGoalXp = 0,
  sessionActive = false,
  onStartPractice,
  // onRegenerate, // dev-only: re-enable with the "Regenerate quest" button below
  questKinds,
  // Disable the primary CTA until the post-onboarding popover tour is finished.
  ctaDisabled = false,
  // Daily-goal modal data, mirrored here for at-a-glance context
  petHealth,
  completedGoalDates = [],
  dailyXpHistory = {},
  // Companion name/type + customize handler for the pet panel's pencil button.
  petName = "",
  petType = "dog",
  companionLevel = 1,
  onCustomizePet,
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const isLightTheme = useThemeStore((s) => s.themeMode) === "light";

  // Completed-quest styling — stronger teal so a done row reads clearly on
  // both the cream (light) and navy (dark) page backgrounds.
  const completedBg = isLightTheme
    ? "rgba(49, 151, 149, 0.16)"
    : "rgba(45, 212, 191, 0.18)";
  const completedBorder = isLightTheme ? "teal.500" : "teal.300";
  const completedAccent = isLightTheme ? "teal.700" : "teal.200";
  const completedIconBg = isLightTheme
    ? "rgba(49, 151, 149, 0.22)"
    : "rgba(45, 212, 191, 0.24)";

  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const snapshot = useMemo(
    () => getDailyPlateSnapshot(user, targetLang, now, questKinds),
    [user, targetLang, now, questKinds],
  );
  const { courses, isCleared } = snapshot;
  const nextCourse = getNextPlateCourse(snapshot);

  /* --- Companion quest bubble ------------------------------------------
     The manga-like note that frames the quest. On the very first quest it's a
     warm welcome (introducing the companion, no memory personalization — the
     caveat is honored); from the next quest on it's memory-aware framing. */
  const pastFirst = isPastFirstQuest(user, snapshot.dayKey);
  // The user has an established quest (so we're not flashing a bubble before the
  // first plate is even composed). On the first quest this is true + !pastFirst.
  const hasQuest = hasSeenFirstQuest(user);
  const repairPlan = useMemo(
    () => getStoredRepairPlan(user, targetLang, snapshot.dayKey),
    [user, targetLang, snapshot.dayKey],
  );
  const reusableMemory = useMemo(
    () => getReusableMemory(user, targetLang, now),
    [user, targetLang, now],
  );
  const repairConcept =
    repairPlan?.items?.[0]?.concept || reusableMemory[0]?.concept || "";
  const repairCount = repairPlan?.items?.length || reusableMemory.length;
  const taskList = useMemo(
    () =>
      courses
        .map((course) => {
          const meta = PLATE_COURSE_META[course.kind];
          return meta ? plateUiCopy(appLanguage, meta.label) : null;
        })
        .filter(Boolean)
        .join(", "),
    [courses, appLanguage],
  );
  const leadKind = !pastFirst
    ? "welcome"
    : repairConcept
      ? repairCount > 1
        ? "repairMulti"
        : "repair"
      : "fresh";
  const bubble = useMemo(
    () =>
      buildQuestBubble({
        lang: appLanguage,
        leadKind,
        concept: repairConcept,
        taskList,
        cleared: isCleared && pastFirst && Boolean(repairConcept),
      }),
    [appLanguage, leadKind, repairConcept, taskList, isCleared, pastFirst],
  );
  // On returning days, prefer the AI-composed message from the batch blueprint
  // (it's written from the day's whole note feed); fall back to the
  // deterministic bubble when there's no blueprint yet or it failed. The first
  // quest always uses the deterministic welcome (caveat: never personalized).
  const blueprint = useMemo(
    () => getStoredBlueprint(user, targetLang, snapshot.dayKey),
    [user, targetLang, snapshot.dayKey],
  );
  const aiLong =
    blueprint?.status === "ready" ? blueprint?.message?.long || "" : "";

  // Welcome on the first quest; memory framing afterward. Cleared with nothing
  // repaired → the "complete" banner says it all, so no bubble.
  const bubbleText =
    hasQuest && (!isCleared || (pastFirst && repairConcept))
      ? pastFirst && aiLong
        ? aiLong
        : bubble.long
      : "";

  // The companion bubble waits for the post-onboarding action-bar tour to finish
  // (ctaDisabled tracks that tour) so it doesn't compete with the stepper, then
  // shows until the user taps "Continue" to dismiss it.
  const showBubble = !!bubbleText && !bubbleDismissed && !ctaDisabled;
  // The task list (and CTA) stay locked continuously: first while the stepper
  // tour runs, then while the bubble is up — only freeing once the bubble is
  // dismissed (or, when there's no bubble, once the tour ends).
  const tasksLocked = ctaDisabled || showBubble;

  // Persist the day's explanation to the user doc once (quest history /
  // diary / notifications can read it later). Active-quest framing only — the
  // cleared recap isn't stored as "why this quest existed".
  const explanationWrittenRef = useRef("");
  useEffect(() => {
    // Only persist the "why this quest" rationale for returning quests, not the
    // first-quest welcome.
    if (!pastFirst || isCleared) return;
    const { dayKey, langKey } = snapshot;
    if (!dayKey || !langKey) return;
    const onceKey = `${langKey}:${dayKey}`;
    if (explanationWrittenRef.current === onceKey) return;
    explanationWrittenRef.current = onceKey;
    if (getStoredQuestExplanation(user, targetLang, dayKey)) return;
    storeQuestExplanation({
      targetLang,
      dayKey,
      explanation: {
        questDayKey: dayKey,
        targetLang: langKey,
        questKinds: courses.map((course) => course.kind),
        repairMemoryIds: repairPlan?.memoryIds || [],
        shortBubbleText: bubble.short,
        explanation: bubble.long,
        companionMood: leadKind === "fresh" ? "neutral" : "focused",
        sourceMemorySummary: repairConcept
          ? companionMemorySummary(appLanguage, repairConcept)
          : "",
        createdAt: Date.now(),
      },
    });
    // Intentionally keyed on the day/lang only — the bubble text is derived
    // from those and we want a single write per quest day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastFirst, isCleared, snapshot.dayKey, snapshot.langKey]);

  const dateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(appLanguage, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now);
    } catch {
      return "";
    }
  }, [appLanguage, now]);

  const ctaLabel = sessionActive
    ? plateUiCopy(appLanguage, CONTINUE_COPY)
    : plateUiCopy(appLanguage, START_COPY);

  const handleStart = () => {
    playSound(selectSound);
    onStartPractice?.();
  };

  return (
    <Box
      px={{ base: 3, sm: 4, md: 6 }}
      pt={{ base: 4, md: 6 }}
      display="flex"
      justifyContent="center"
      w="100%"
      // Lift above the fixed AnimatedBackground (position: fixed, zIndex 0):
      // positioned elements paint over static content regardless of DOM
      // order, so without this the background's washes cover the page.
      position="relative"
      zIndex={1}
    >
      <VStack w="100%" maxW="560px" spacing={3} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Text
            fontSize="2xl"
            fontWeight="black"
            color="var(--app-text-primary)"
            lineHeight="1.2"
          >
            {plateUiCopy(appLanguage, PLATE_TITLE_COPY)}
          </Text>
          {dateLabel ? (
            <Text fontSize="sm" color="var(--app-text-muted)" mt={0.5}>
              {dateLabel}
            </Text>
          ) : null}
        </Box>

        {/* Cleared banner / subtitle */}
        {isCleared ? (
          <Box
            bg={
              isLightTheme
                ? "rgba(183, 121, 31, 0.14)"
                : "rgba(250, 204, 21, 0.14)"
            }
            border="1px solid"
            borderColor={
              isLightTheme
                ? "rgba(183, 121, 31, 0.5)"
                : "rgba(250, 204, 21, 0.5)"
            }
            borderRadius="12px"
            px={4}
            py={3}
            textAlign="center"
          >
            <Text
              fontSize="md"
              fontWeight="bold"
              color={isLightTheme ? "yellow.700" : "yellow.300"}
            >
              {plateUiCopy(appLanguage, PLATE_CLEARED_COPY)}
            </Text>
          </Box>
        ) : (
          <Text
            fontSize="sm"
            color="var(--app-text-secondary)"
            textAlign="center"
          >
            {plateUiCopy(appLanguage, SUBTITLE_COPY)}
          </Text>
        )}

        {/* Course rows in the plate's elected order (display-only) */}
        <VStack
          spacing={2.5}
          align="stretch"
          opacity={tasksLocked ? 0.4 : 1}
          pointerEvents={tasksLocked ? "none" : "auto"}
          transition="opacity 0.2s"
        >
          {courses.map((course) => {
            const kind = course.kind;
            const meta = PLATE_COURSE_META[kind];
            if (!meta) return null;
            const CourseIcon = meta.icon;
            const isNext = !isCleared && kind === nextCourse;
            // Border tells completion state only: teal when done, purple
            // when started but unfinished, neutral when untouched.
            const isInProgress = !course.done && course.count > 0;

            return (
              <Box
                key={kind}
                w="100%"
                textAlign="left"
                bg={course.done ? completedBg : "var(--app-glass-bg-soft)"}
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor={
                  course.done
                    ? completedBorder
                    : isInProgress
                      ? "purple.400"
                      : "var(--app-border)"
                }
                boxShadow="var(--app-shadow-soft)"
                borderRadius="14px"
                px={4}
                py={3}
              >
                <HStack spacing={3} align="center">
                  <Box
                    w="38px"
                    h="38px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    bg={
                      course.done ? completedIconBg : "rgba(255,255,255,0.06)"
                    }
                    color={
                      course.done ? completedAccent : "var(--app-text-primary)"
                    }
                  >
                    <CourseIcon size={18} />
                  </Box>

                  <Box flex="1" minW={0} h="38px" position="relative">
                    <HStack
                      h="38px"
                      justify="space-between"
                      align="center"
                      spacing={2}
                    >
                      <HStack spacing={2} minW={0}>
                        <Text
                          fontSize="sm"
                          fontWeight="bold"
                          color="var(--app-text-primary)"
                          noOfLines={1}
                        >
                          {plateUiCopy(appLanguage, meta.label)}
                        </Text>
                        {isNext ? (
                          <Box
                            bg="var(--app-surface-muted)"
                            border="1px solid"
                            borderColor="var(--app-border-strong)"
                            borderRadius="full"
                            px={2}
                            py="1px"
                          >
                            <Text
                              fontSize="2xs"
                              fontWeight="bold"
                              color="var(--app-text-secondary)"
                              whiteSpace="nowrap"
                            >
                              {plateUiCopy(appLanguage, PLATE_NEXT_COPY)}
                            </Text>
                          </Box>
                        ) : null}
                      </HStack>
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color={
                          course.done
                            ? completedAccent
                            : "var(--app-text-muted)"
                        }
                        whiteSpace="nowrap"
                      >
                        {course.done
                          ? `${
                              course.target > 0
                                ? Math.round(
                                    (course.count / course.target) * 100,
                                  )
                                : 100
                            }%`
                          : `${course.count}/${course.target}`}
                      </Text>
                    </HStack>
                    <Box position="absolute" left={0} right={0} bottom="-3px">
                      <WaveBar
                        value={course.percent}
                        height={8}
                        start={course.done ? "#43e97b" : "#60A5FA"}
                        end={course.done ? "#38f9d7" : "#2563EB"}
                        bg="rgba(255,255,255,0.05)"
                        border="rgba(255,255,255,0.1)"
                      />
                    </Box>
                  </Box>

                  {course.done ? (
                    <CheckCircleIcon color={completedAccent} boxSize={4} />
                  ) : null}
                </HStack>
              </Box>
            );
          })}
        </VStack>

        {/* Primary CTA — sits under the tasks; hidden once every quest is done,
            as the user then picks their own mode from the menu. */}
        {!isCleared ? (
          <Button
            onClick={handleStart}
            size="lg"
            colorScheme="teal"
            variant="solid"
            leftIcon={<FiPlay />}
            isDisabled={tasksLocked}
          >
            {ctaLabel}
          </Button>
        ) : null}

        {/* Pet + daily activity — same data the daily-goal modal shows,
            minus the goal-setting controls (the top bar opens that). */}
        <PlatePetPanel
          lang={appLanguage}
          health={petHealth}
          variant="setup"
          showPreview={false}
          dailyXp={dailyXp}
          dailyGoalXp={dailyGoalXp}
          petName={petName}
          petType={petType}
          companionLevel={companionLevel}
          onCustomizePet={onCustomizePet}
          questBubble={
            showBubble
              ? { text: bubbleText, onDismiss: () => setBubbleDismissed(true) }
              : null
          }
        />
        <PlateActivityHeatmap
          lang={appLanguage}
          completedGoalDates={completedGoalDates}
          dailyXpHistory={dailyXpHistory}
          currentDailyXp={dailyXp}
          currentGoalXp={dailyGoalXp}
        />

        {/* Dev/testing only: reset today's quest so the flow can be re-run.
            Commented out for shipping — re-enable this block (and the
            onRegenerate prop above) when testing the quest flow.
        {onRegenerate ? (
          <Button
            size="sm"
            variant="ghost"
            color="var(--app-text-muted)"
            alignSelf="center"
            onClick={() => {
              playSound(selectSound);
              onRegenerate();
            }}
          >
            ↻ Regenerate quest (dev)
          </Button>
        ) : null}
        */}
      </VStack>
    </Box>
  );
}
