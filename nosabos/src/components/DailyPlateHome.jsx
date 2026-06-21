// src/components/DailyPlateHome.jsx
//
// The landing surface for pathMode "plate". Shows today's composed session
// (Tutor lesson → skill-tree lesson → flash cards), a single "Start daily
// practice" CTA, and at-a-glance daily-goal context (pet + activity
// heatmap) via standalone copies in PlatePetPanel / PlateActivityHeatmap.
// Deliberately plain (no entrance animations, no imports from other
// component files' internals) — App.jsx's conductor drives the guided
// session; this screen is where it starts and ends.
import React, { useEffect, useMemo, useState } from "react";
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
} from "../utils/dailyPlate";
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
  // Custom companion name + rename handler for the pet panel's pencil button
  petName = "",
  onRenamePet,
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
      <VStack w="100%" maxW="560px" spacing={4} align="stretch">
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
        <VStack spacing={2.5} align="stretch">
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
                    color={course.done ? completedAccent : "var(--app-text-primary)"}
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
                          course.done ? completedAccent : "var(--app-text-muted)"
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
            isDisabled={ctaDisabled}
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
          onRenamePet={onRenamePet}
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
