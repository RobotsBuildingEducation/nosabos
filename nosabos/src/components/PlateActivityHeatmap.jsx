// src/components/PlateActivityHeatmap.jsx
//
// Standalone year-activity heatmap for the Daily Plate home. This is a
// deliberate copy of the daily-goal modal's heatmap so the plate surface
// has zero coupling to modal internals — it imports only stable utils,
// reads the theme itself, and builds its own localized labels.
import React, { useMemo } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  getLanguageLocale,
  normalizeSupportLanguage,
} from "../constants/languages";
import { t as translate } from "../utils/translation";
import { useThemeStore } from "../useThemeStore";
import { APP_DAILY_QUEST_RADIUS, APP_SQUIRCLE_SHAPE } from "../theme";
import useXpHistoryYear from "../hooks/useXpHistoryYear";

const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";

const MS_24H = 24 * 60 * 60 * 1000;

// Plain DOM nodes with precomputed styles — far cheaper than Chakra <Box>
// for hundreds of cells.
const DAY_CELL_BASE_STYLE = {
  width: "100%",
  aspectRatio: "1 / 1",
  borderRadius: "3px",
  border: "1px solid transparent",
  boxSizing: "border-box",
};

const DAY_CELL_BLANK_STYLE = {
  ...DAY_CELL_BASE_STYLE,
  background: "transparent",
};

const WEEK_COLUMN_STYLE = { minWidth: 0 };
const WEEK_LABEL_STYLE = {
  minHeight: "12px",
  fontSize: "8px",
  lineHeight: 1,
  color: "#6b7280",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  textAlign: "left",
};
const WEEK_DAYS_STYLE = { display: "grid", rowGap: "2px" };

function buildDayStyle(level, isFuture, isToday, isLightTheme = false) {
  const style = { ...DAY_CELL_BASE_STYLE };
  if (isLightTheme) {
    if (level === "goal") {
      style.background = "linear-gradient(135deg, #6fd0b5 0%, #8bc9de 100%)";
      style.borderColor = "rgba(79, 139, 120, 0.28)";
    } else if (level === "some") {
      style.background = "rgba(117, 198, 167, 0.34)";
      style.borderColor = "rgba(79, 139, 120, 0.18)";
    } else {
      style.background = isFuture
        ? "rgba(91, 75, 58, 0.035)"
        : "rgba(91, 75, 58, 0.075)";
      style.borderColor = isToday
        ? "rgba(91, 75, 58, 0.22)"
        : "rgba(91, 75, 58, 0.08)";
    }
  } else if (level === "goal") {
    style.background = "linear-gradient(135deg, #2dd4bf 0%, #38bdf8 100%)";
    style.borderColor = "rgba(167, 243, 208, 0.55)";
  } else if (level === "some") {
    style.background = "rgba(45, 212, 191, 0.42)";
    style.borderColor = "rgba(94, 234, 212, 0.28)";
  } else {
    style.background = isFuture
      ? "rgba(255,255,255,0.03)"
      : "rgba(255,255,255,0.08)";
    style.borderColor = isToday
      ? "rgba(255,255,255,0.45)"
      : "rgba(255,255,255,0.08)";
  }
  if (isFuture) style.opacity = isLightTheme ? 0.48 : 0.28;
  if (isToday) style.transform = "scale(1.04)";
  return style;
}

function getLocalDayKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildGoalHeatmapWeeks(
  xpHistory = {},
  completedGoalDates = [],
  language = "en",
  isLightTheme = false,
  now = new Date(),
) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);
  const firstWeekPadding = yearStart.getDay();
  const totalDaysInYear =
    Math.round((yearEnd.getTime() - yearStart.getTime()) / MS_24H) + 1;
  const totalWeeks = Math.ceil((firstWeekPadding + totalDaysInYear) / 7);
  const completedDatesSet = new Set(completedGoalDates);
  const locale = getLanguageLocale(
    normalizeSupportLanguage(language, DEFAULT_SUPPORT_LANGUAGE),
  );
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  });
  const todayKey = getLocalDayKey(today);

  return Array.from({ length: totalWeeks }, (_, weekIndex) => {
    let monthLabel = "";
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const cellIndex = weekIndex * 7 + dayIndex;
      const dayOffset = cellIndex - firstWeekPadding;

      if (dayOffset < 0 || dayOffset >= totalDaysInYear) {
        return {
          key: `blank-${weekIndex}-${dayIndex}`,
          isBlank: true,
        };
      }

      const date = new Date(yearStart);
      date.setDate(yearStart.getDate() + dayOffset);
      const dayKey = getLocalDayKey(date);
      const xp = Math.max(0, Number(xpHistory?.[dayKey]) || 0);
      const isGoalReached = completedDatesSet.has(dayKey);
      const isFuture = date.getTime() > today.getTime();
      const isToday = dayKey === todayKey;
      const level = isGoalReached ? "goal" : xp > 0 ? "some" : "empty";

      if (!monthLabel && date.getDate() === 1) {
        monthLabel = monthFormatter.format(date);
      }

      return {
        key: dayKey,
        isBlank: false,
        title: `${dateFormatter.format(date)} - ${xp} XP`,
        style: buildDayStyle(level, isFuture, isToday, isLightTheme),
      };
    });

    return {
      key: `plate-week-${currentYear}-${weekIndex}`,
      monthLabel,
      days,
    };
  });
}

export default function PlateActivityHeatmap({
  npub,
  lang = "en",
  completedGoalDates = [],
  dailyXpHistory = {},
  currentDailyXp = 0,
  currentGoalXp = 0,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const loadedHistory = useXpHistoryYear({
    npub,
    legacyDays: dailyXpHistory,
    legacyGoalDays: completedGoalDates,
  });

  const labels = useMemo(() => {
    const getLabel = (key, fallback) =>
      translate(lang, key) || translate("en", key) || fallback;
    return {
      title: getLabel("daily_goal_activity_title", "XP activity"),
      subtitle: getLabel("daily_goal_activity_subtitle", "This year"),
      empty: getLabel("daily_goal_activity_empty", "No XP"),
      some: getLabel("daily_goal_activity_some", "Some XP"),
      goal: getLabel("daily_goal_activity_goal", "Daily goal reached"),
    };
  }, [lang]);

  const effectiveHistory = useMemo(() => {
    const todayKey = getLocalDayKey(new Date());
    if (!todayKey) return loadedHistory.days;

    return {
      ...loadedHistory.days,
      [todayKey]: Math.max(
        Number(loadedHistory.days?.[todayKey]) || 0,
        Number(currentDailyXp) || 0,
      ),
    };
  }, [currentDailyXp, loadedHistory.days]);

  const effectiveCompletedDates = useMemo(() => {
    const todayKey = getLocalDayKey(new Date());
    const completedSet = new Set(loadedHistory.goalDays);

    if (
      todayKey &&
      Number(currentGoalXp) > 0 &&
      Number(currentDailyXp) >= Number(currentGoalXp)
    ) {
      completedSet.add(todayKey);
    }

    return Array.from(completedSet);
  }, [currentDailyXp, currentGoalXp, loadedHistory.goalDays]);

  const weeks = useMemo(
    () =>
      buildGoalHeatmapWeeks(
        effectiveHistory,
        effectiveCompletedDates,
        lang,
        isLightTheme,
      ),
    [effectiveCompletedDates, effectiveHistory, isLightTheme, lang],
  );

  return (
    <Box
      p={4}
      borderRadius={APP_DAILY_QUEST_RADIUS}
      style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
      bg={isLightTheme ? APP_SURFACE_MUTED : "gray.800"}
      border="1px solid"
      borderColor={isLightTheme ? APP_BORDER : "gray.700"}
    >
      <HStack justify="space-between" align="baseline" mb={3} flexWrap="wrap">
        <Text
          fontSize="xs"
          fontWeight="bold"
          color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          {labels.title}
        </Text>
        <Text fontSize="xs" color={isLightTheme ? APP_TEXT_MUTED : "gray.500"}>
          {labels.subtitle}
        </Text>
      </HStack>

      <Box
        overflowX="auto"
        overflowY="hidden"
        w="100%"
        pb={2}
        sx={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <Box
          display="grid"
          gridTemplateColumns={{
            base: `repeat(${weeks.length}, 11px)`,
            sm: `repeat(${weeks.length}, 12px)`,
            md: `repeat(${weeks.length}, 12px)`,
            lg: `repeat(${weeks.length}, minmax(12px, 1fr))`,
          }}
          columnGap={{ base: "2px", lg: "4px" }}
          w={{ base: "max-content", lg: "100%" }}
          minW={{ base: "max-content", lg: "100%" }}
        >
          {weeks.map((week) => (
            <div key={week.key} style={WEEK_COLUMN_STYLE}>
              <div style={WEEK_LABEL_STYLE}>{week.monthLabel}</div>
              <div style={WEEK_DAYS_STYLE}>
                {week.days.map((day) =>
                  day.isBlank ? (
                    <div key={day.key} style={DAY_CELL_BLANK_STYLE} />
                  ) : (
                    <div key={day.key} style={day.style} title={day.title} />
                  ),
                )}
              </div>
            </div>
          ))}
        </Box>
      </Box>

      <HStack spacing={4} mt={4} flexWrap="wrap">
        <HStack spacing={2}>
          <Box
            w="10px"
            h="10px"
            borderRadius="3px"
            bg={
              isLightTheme
                ? "rgba(91, 75, 58, 0.075)"
                : "rgba(255,255,255,0.08)"
            }
            border="1px solid"
            borderColor={
              isLightTheme ? "rgba(91, 75, 58, 0.08)" : "rgba(255,255,255,0.08)"
            }
          />
          <Text fontSize="xs" color={isLightTheme ? APP_TEXT_MUTED : "gray.400"}>
            {labels.empty}
          </Text>
        </HStack>
        <HStack spacing={2}>
          <Box
            w="10px"
            h="10px"
            borderRadius="3px"
            bg={
              isLightTheme
                ? "rgba(117, 198, 167, 0.34)"
                : "rgba(45, 212, 191, 0.42)"
            }
            border="1px solid"
            borderColor={
              isLightTheme
                ? "rgba(79, 139, 120, 0.18)"
                : "rgba(94, 234, 212, 0.28)"
            }
          />
          <Text fontSize="xs" color={isLightTheme ? APP_TEXT_MUTED : "gray.400"}>
            {labels.some}
          </Text>
        </HStack>
        <HStack spacing={2}>
          <Box
            w="10px"
            h="10px"
            borderRadius="3px"
            bgGradient={
              isLightTheme
                ? "linear(135deg, #6fd0b5 0%, #8bc9de 100%)"
                : "linear(135deg, #2dd4bf 0%, #38bdf8 100%)"
            }
            border="1px solid"
            borderColor={
              isLightTheme
                ? "rgba(79, 139, 120, 0.28)"
                : "rgba(167, 243, 208, 0.55)"
            }
          />
          <Text fontSize="xs" color={isLightTheme ? APP_TEXT_MUTED : "gray.400"}>
            {labels.goal}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
}
