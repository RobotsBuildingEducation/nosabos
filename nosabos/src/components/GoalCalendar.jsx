import React, { useMemo } from "react";
import { Box, Grid, Text, VStack, HStack, IconButton } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Gradient for completed days
const COMPLETED_GRADIENT = "linear-gradient(135deg, #14b8a6 0%, #06b6d4 50%, #0ea5e9 100%)";
const COMPLETED_GRADIENT_LEGEND = "linear-gradient(135deg, #14b8a6, #0ea5e9)";

/**
 * Formats a date as YYYY-MM-DD in local timezone
 */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * GoalCalendar - A visual calendar showing completed goal days
 *
 * @param {Object} props
 * @param {string[]} props.completedDates - Array of completed date strings (YYYY-MM-DD)
 * @param {string} [props.lang="en"] - Language for weekday/month names
 * @param {number} [props.year] - Year to display (defaults to current)
 * @param {number} [props.month] - Month to display 0-11 (defaults to current)
 * @param {function} [props.onMonthChange] - Callback when month changes (year, month)
 * @param {boolean} [props.showNavigation=true] - Show month navigation arrows
 * @param {boolean} [props.highlightToday=true] - Highlight current day
 * @param {string} [props.size="md"] - Size variant: "sm", "md", "lg"
 * @param {string} [props.completedLabel] - Custom label for "Completed" legend
 * @param {string} [props.incompleteLabel] - Custom label for "Incomplete" legend
 * @param {string} [props.variant="dark"] - Color variant: "dark" or "light"
 * @param {string|Date} [props.startDate] - First date when goals could be tracked (account creation)
 */
export default function GoalCalendar({
  completedDates = [],
  lang = "en",
  year,
  month,
  onMonthChange,
  showNavigation = true,
  highlightToday = true,
  size = "md",
  completedLabel,
  incompleteLabel,
  variant = "dark",
  startDate,
}) {
  const playSound = useSoundSettings((s) => s.playSound);
  const today = useMemo(() => {
    const now = new Date();
    // Normalize to start of day for comparison
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const displayYear = year ?? today.getFullYear();
  const displayMonth = month ?? today.getMonth();

  const weekdays = lang === "es" ? WEEKDAYS_ES : WEEKDAYS_EN;
  const months = lang === "es" ? MONTHS_ES : MONTHS_EN;

  // Parse startDate if provided
  const goalStartDate = useMemo(() => {
    if (!startDate) return null;
    const parsed = typeof startDate === "string" ? new Date(startDate) : startDate;
    // Normalize to start of day
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }, [startDate]);

  // Set of completed dates for O(1) lookup
  const completedSet = useMemo(
    () => new Set(completedDates || []),
    [completedDates]
  );

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, key: `empty-${i}` });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(displayYear, displayMonth, day);
      const dateKey = formatDateKey(date);
      const isCompleted = completedSet.has(dateKey);
      const isToday =
        highlightToday &&
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      const isFuture = date > today;
      // Days before goal tracking started are "unavailable"
      const isBeforeStart = goalStartDate && date < goalStartDate;

      days.push({
        day,
        dateKey,
        isCompleted,
        isToday,
        isFuture,
        isBeforeStart,
        key: dateKey,
      });
    }

    return days;
  }, [displayYear, displayMonth, completedSet, today, highlightToday, goalStartDate]);

  const handlePrevMonth = () => {
    if (!onMonthChange) return;
    playSound(selectSound);
    const newMonth = displayMonth === 0 ? 11 : displayMonth - 1;
    const newYear = displayMonth === 0 ? displayYear - 1 : displayYear;
    onMonthChange(newYear, newMonth);
  };

  const handleNextMonth = () => {
    if (!onMonthChange) return;
    playSound(selectSound);
    const newMonth = displayMonth === 11 ? 0 : displayMonth + 1;
    const newYear = displayMonth === 11 ? displayYear + 1 : displayYear;
    onMonthChange(newYear, newMonth);
  };

  // Size configurations
  const sizeConfig = {
    sm: { cellSize: "28px", fontSize: "xs", headerFontSize: "sm", gap: 1 },
    md: { cellSize: "36px", fontSize: "sm", headerFontSize: "md", gap: 1 },
    lg: { cellSize: "44px", fontSize: "md", headerFontSize: "lg", gap: 2 },
  };
  const config = sizeConfig[size] || sizeConfig.md;

  // Color configurations based on variant
  const isLight = variant === "light";
  const colors = {
    headerText: isLight ? "white" : "gray.100",
    weekdayText: isLight ? "whiteAlpha.700" : "gray.400",
    incompleteBg: isLight ? "whiteAlpha.300" : "gray.700",
    incompleteText: isLight ? "whiteAlpha.800" : "gray.300",
    futureText: isLight ? "whiteAlpha.400" : "gray.600",
    legendText: isLight ? "whiteAlpha.800" : "gray.400",
    legendIncompleteBg: isLight ? "whiteAlpha.300" : "gray.700",
    todayBorder: isLight ? "yellow.300" : "yellow.400",
    navButtonScheme: isLight ? "whiteAlpha" : "teal",
  };

  return (
    <VStack spacing={3} w="100%">
      {/* Month/Year Header with Navigation */}
      <HStack justify="space-between" w="100%" px={1}>
        {showNavigation && onMonthChange ? (
          <IconButton
            icon={<ChevronLeftIcon />}
            size="sm"
            variant="ghost"
            colorScheme={colors.navButtonScheme}
            color={colors.headerText}
            onClick={handlePrevMonth}
            aria-label={lang === "es" ? "Mes anterior" : "Previous month"}
          />
        ) : (
          <Box w="32px" />
        )}

        <Text
          fontWeight="semibold"
          fontSize={config.headerFontSize}
          color={colors.headerText}
        >
          {months[displayMonth]} {displayYear}
        </Text>

        {showNavigation && onMonthChange ? (
          <IconButton
            icon={<ChevronRightIcon />}
            size="sm"
            variant="ghost"
            colorScheme={colors.navButtonScheme}
            color={colors.headerText}
            onClick={handleNextMonth}
            aria-label={lang === "es" ? "Mes siguiente" : "Next month"}
          />
        ) : (
          <Box w="32px" />
        )}
      </HStack>

      {/* Weekday Headers */}
      <Grid templateColumns="repeat(7, 1fr)" gap={config.gap} w="100%">
        {weekdays.map((day) => (
          <Box
            key={day}
            textAlign="center"
            fontSize="xs"
            fontWeight="medium"
            color={colors.weekdayText}
            py={1}
          >
            {day}
          </Box>
        ))}
      </Grid>

      {/* Calendar Grid */}
      <Grid templateColumns="repeat(7, 1fr)" gap={config.gap} w="100%">
        {calendarDays.map(({ day, isCompleted, isToday, isFuture, isBeforeStart, key }) => {
          // Determine background:
          // - null days (padding) = transparent
          // - completed = gradient
          // - before start date = transparent (unavailable)
          // - future or today/past after start = incomplete (gray)
          const getBg = () => {
            if (day === null) return "transparent";
            if (isCompleted) return COMPLETED_GRADIENT;
            if (isBeforeStart) return "transparent";
            return colors.incompleteBg; // future days and incomplete past days
          };

          // Determine text color:
          // - null days = transparent
          // - completed = white
          // - before start = faded (unavailable)
          // - future or incomplete = normal incomplete color
          const getColor = () => {
            if (day === null) return "transparent";
            if (isCompleted) return "white";
            if (isBeforeStart) return colors.futureText; // faded for unavailable
            return colors.incompleteText;
          };

          const isClickable = day !== null && !isBeforeStart;

          return (
            <Box
              key={key}
              w={config.cellSize}
              h={config.cellSize}
              mx="auto"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="md"
              fontSize={config.fontSize}
              fontWeight={isToday ? "bold" : "normal"}
              bg={getBg()}
              color={getColor()}
              border={isToday ? "2px solid" : "none"}
              borderColor={isToday ? colors.todayBorder : "transparent"}
              boxShadow={isCompleted ? "0 2px 8px rgba(20, 184, 166, 0.4)" : "none"}
              transition="all 0.2s"
              _hover={isClickable ? { transform: "scale(1.1)" } : undefined}
            >
              {day}
            </Box>
          );
        })}
      </Grid>

      {/* Legend */}
      <HStack spacing={4} pt={2} justify="center" flexWrap="wrap">
        <HStack spacing={1}>
          <Box w="12px" h="12px" borderRadius="sm" bg={COMPLETED_GRADIENT_LEGEND} />
          <Text fontSize="xs" color={colors.legendText}>
            {completedLabel || (lang === "es" ? "Completado" : "Completed")}
          </Text>
        </HStack>
        <HStack spacing={1}>
          <Box w="12px" h="12px" borderRadius="sm" bg={colors.legendIncompleteBg} />
          <Text fontSize="xs" color={colors.legendText}>
            {incompleteLabel || (lang === "es" ? "Pendiente" : "Incomplete")}
          </Text>
        </HStack>
        <HStack spacing={1}>
          <Box
            w="12px"
            h="12px"
            borderRadius="sm"
            bg={colors.legendIncompleteBg}
            border="2px solid"
            borderColor={colors.todayBorder}
          />
          <Text fontSize="xs" color={colors.legendText}>
            {lang === "es" ? "Hoy" : "Today"}
          </Text>
        </HStack>
      </HStack>
    </VStack>
  );
}
