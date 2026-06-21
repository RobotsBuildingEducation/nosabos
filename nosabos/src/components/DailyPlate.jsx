// src/components/DailyPlate.jsx
//
// Slim "today's plate" tracker card shown above the skill tree / flashcard
// surfaces. Pure presentation: counts come from the user object, taps
// deep-link into the matching surface, and the daily bonus is claimed by
// the conductor in App.jsx (which is always mounted), not here.
import React, { useEffect, useMemo, useState } from "react";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";

import { WaveBar } from "./WaveBar";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import {
  DAILY_PLATE_BONUS_XP,
  getDailyPlateSnapshot,
} from "../utils/dailyPlate";
import {
  PLATE_CLEARED_COPY,
  PLATE_COURSE_META,
  PLATE_TITLE_COPY,
  plateUiCopy,
} from "../utils/dailyPlateCopy";

export default function DailyPlate({
  user,
  targetLang = "es",
  appLanguage = "en",
  onNavigate,
}) {
  const playSound = useSoundSettings((s) => s.playSound);

  // Re-derive "today" once a minute so the plate resets itself at midnight
  // without a reload.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const snapshot = useMemo(
    () => getDailyPlateSnapshot(user, targetLang, now),
    [user, targetLang, now],
  );
  const { courses, doneCount, isCleared } = snapshot;

  const handleCourseTap = (kind) => {
    playSound(selectSound);
    onNavigate?.(kind);
  };

  return (
    <Box
      px={{ base: 3, sm: 4, md: 6 }}
      pt={3}
      display="flex"
      justifyContent="center"
      w="100%"
      // Lift above the fixed AnimatedBackground (zIndex 0) — see
      // DailyPlateHome for the stacking-order details.
      position="relative"
      zIndex={1}
    >
      <Box
        w="100%"
        maxW="600px"
        bg="var(--app-glass-bg-soft)"
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor={isCleared ? "rgba(250, 204, 21, 0.45)" : "var(--app-border)"}
        borderRadius="12px"
        boxShadow="var(--app-shadow-soft)"
        px={4}
        py={3}
        transition="border-color 0.4s ease"
      >
        <HStack justify="space-between" mb={2} spacing={3}>
          <HStack spacing={2} minW={0}>
            <Text fontSize="md" lineHeight="1" aria-hidden="true">
              🍽️
            </Text>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="var(--app-text-primary)"
              noOfLines={1}
            >
              {plateUiCopy(appLanguage, PLATE_TITLE_COPY)}
            </Text>
          </HStack>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color={isCleared ? "yellow.300" : "var(--app-text-muted)"}
            whiteSpace="nowrap"
          >
            {isCleared
              ? `${plateUiCopy(appLanguage, PLATE_CLEARED_COPY)} +${DAILY_PLATE_BONUS_XP} XP`
              : `${doneCount}/${courses.length} · +${DAILY_PLATE_BONUS_XP} XP`}
          </Text>
        </HStack>

        <Flex gap={2}>
          {courses.map((course) => {
            const meta = PLATE_COURSE_META[course.kind];
            const CourseIcon = meta.icon;
            return (
              <Box
                key={course.kind}
                as="button"
                type="button"
                onClick={() => handleCourseTap(course.kind)}
                flex="1"
                minW={0}
                textAlign="left"
                bg={
                  course.done
                    ? "rgba(74, 222, 128, 0.08)"
                    : "rgba(255, 255, 255, 0.03)"
                }
                border="1px solid"
                borderColor={
                  course.done ? "rgba(74, 222, 128, 0.35)" : "var(--app-border)"
                }
                borderRadius="10px"
                px={2.5}
                py={2}
                transition="transform 0.12s ease, border-color 0.2s ease"
                _hover={{ transform: "translateY(-1px)" }}
                _active={{ transform: "translateY(0px)" }}
              >
                <HStack justify="space-between" mb={1.5} spacing={1}>
                  <HStack spacing={1.5} minW={0}>
                    <Box
                      color={
                        course.done ? "green.300" : "var(--app-text-secondary)"
                      }
                      flexShrink={0}
                      display="inline-flex"
                    >
                      <CourseIcon size={14} />
                    </Box>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="var(--app-text-primary)"
                      noOfLines={1}
                    >
                      {plateUiCopy(appLanguage, meta.label)}
                    </Text>
                  </HStack>
                  {course.done ? (
                    <CheckCircleIcon color="green.300" boxSize={3.5} />
                  ) : (
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      color="var(--app-text-muted)"
                      whiteSpace="nowrap"
                    >
                      {course.count}/{course.target}
                    </Text>
                  )}
                </HStack>
                <WaveBar
                  value={course.percent}
                  height={6}
                  start={course.done ? "#43e97b" : "#60A5FA"}
                  end={course.done ? "#38f9d7" : "#2563EB"}
                  bg="rgba(255,255,255,0.05)"
                  border="rgba(255,255,255,0.1)"
                />
              </Box>
            );
          })}
        </Flex>
      </Box>
    </Box>
  );
}
