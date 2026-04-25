import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalCloseButton,
  Progress,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { doc, setDoc } from "firebase/firestore";
import { FaCalendarAlt } from "react-icons/fa";
import { database } from "../firebaseResources/firebaseResources";
import { useThemeStore } from "../useThemeStore";
import {
  translations as allTranslations,
  t as translate,
} from "../utils/translation.jsx";
import DailyGoalPetPanel from "./DailyGoalPetPanel.jsx";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import { getDailyGoalPetHealth } from "../utils/dailyGoalPet.js";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  getLanguageDirection,
  getLanguageLocale,
  normalizeSupportLanguage,
} from "../constants/languages.js";

const MS_24H = 24 * 60 * 60 * 1000;
const PRESETS = [100, 150, 200, 300];
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_OVERLAY = "var(--app-overlay)";
const APP_SHADOW = "var(--app-shadow-soft)";

// Precomputed static styles for heatmap cells — plain DOM nodes are ~10x
// faster to mount/reconcile than Chakra <Box> for hundreds of cells.
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
  // Build formatters once per heatmap — not once per cell.
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
      key: `goal-week-${currentYear}-${weekIndex}`,
      monthLabel,
      days,
    };
  });
}

const DailyGoalHeatmap = React.memo(function DailyGoalHeatmap({
  lang = "en",
  completedGoalDates = [],
  dailyXpHistory = {},
  currentDailyXp = 0,
  currentGoalXp = 0,
  labels,
  isLightTheme = false,
}) {
  const effectiveHistory = useMemo(() => {
    const todayKey = getLocalDayKey(new Date());
    if (!todayKey) return dailyXpHistory;

    return {
      ...dailyXpHistory,
      [todayKey]: Math.max(
        Number(dailyXpHistory?.[todayKey]) || 0,
        Number(currentDailyXp) || 0,
      ),
    };
  }, [currentDailyXp, dailyXpHistory]);

  const effectiveCompletedDates = useMemo(() => {
    const todayKey = getLocalDayKey(new Date());
    const completedSet = new Set(completedGoalDates);

    if (
      todayKey &&
      Number(currentGoalXp) > 0 &&
      Number(currentDailyXp) >= Number(currentGoalXp)
    ) {
      completedSet.add(todayKey);
    }

    return Array.from(completedSet);
  }, [completedGoalDates, currentDailyXp, currentGoalXp]);

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
      borderRadius="xl"
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
          <Text
            fontSize="xs"
            color={isLightTheme ? APP_TEXT_MUTED : "gray.400"}
          >
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
          <Text
            fontSize="xs"
            color={isLightTheme ? APP_TEXT_MUTED : "gray.400"}
          >
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
          <Text
            fontSize="xs"
            color={isLightTheme ? APP_TEXT_MUTED : "gray.400"}
          >
            {labels.goal}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
});

export default function DailyGoalModal({
  isOpen,
  onClose,
  onSaveGoal,
  npub,
  lang = "en",
  defaultGoal = 100,
  t,
  ui = {},
  petHealth,
  petLastOutcome,
  petLastDelta,
  completedGoalDates = [],
  dailyXpHistory = {},
  currentDailyXp = 0,
  currentGoalXp = 0,
  useSharedBackdrop = false,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const resolvedLang = normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE);
  const isRtl = getLanguageDirection(resolvedLang) === "rtl";
  const resolvedTranslations = useMemo(
    () => t || allTranslations[resolvedLang] || allTranslations.en,
    [t, resolvedLang],
  );

  const getLabel = useCallback(
    (key, fallback, vars = {}) =>
      translate(resolvedLang, key, vars) ||
      translate("en", key, vars) ||
      resolvedTranslations?.[key] ||
      fallback,
    [resolvedLang, resolvedTranslations],
  );

  const L = useMemo(
    () => ({
      quickPicks: getLabel("daily_goal_quick_picks", "Quick picks"),
      fineTune: getLabel("daily_goal_fine_tune", "Fine-tune"),
      xpUnit: getLabel("daily_goal_xp_unit", "XP / day"),
      levelExplainer: (pct, lvls) =>
        getLabel("daily_goal_level_explainer", `Each level is 100 XP.`, {
          pct,
          levels: lvls,
        }),
      goalPreview: getLabel("daily_goal_preview", "Goal preview"),
      resetsIn: (when) =>
        getLabel("daily_goal_resets_in", `Resets in 24h · ${when}`, { when }),
      save: getLabel("daily_goal_save", "Save"),
      title: getLabel("daily_goal_title", "Goal Manager"),
      subtitle: getLabel(
        "daily_goal_subtitle",
        "Each level = 100 XP. How many XP do you want to earn per day?",
      ),
      activityTitle: getLabel("daily_goal_activity_title", "XP activity"),
      activitySubtitle: getLabel("daily_goal_activity_subtitle", "This year"),
      activityEmpty: getLabel("daily_goal_activity_empty", "No XP"),
      activitySome: getLabel("daily_goal_activity_some", "Some XP"),
      activityGoal: getLabel("daily_goal_activity_goal", "Daily goal reached"),
      inputLabel: getLabel("daily_goal_input_label", "XP per day"),
      errNoUserTitle: getLabel("daily_goal_error_no_user", "No user ID"),
      errNoUserDesc: getLabel(
        "daily_goal_error_no_user_desc",
        "Please sign in again.",
      ),
      errSaveTitle: getLabel("daily_goal_error_save", "Could not save goal"),
    }),
    [getLabel],
  );
  // Stable labels object for DailyGoalHeatmap — prevents re-renders of the
  // heavy heatmap tree on every keystroke of the goal input.
  const heatmapLabels = useMemo(
    () => ({
      title: L.activityTitle,
      subtitle: L.activitySubtitle,
      empty: L.activityEmpty,
      some: L.activitySome,
      goal: L.activityGoal,
    }),
    [L],
  );

  const [goal, setGoal] = useState(String(defaultGoal));
  const playSound = useSoundSettings((s) => s.playSound);
  const recentActionRef = useRef({ key: "", at: 0 });
  const deferPostAction = useCallback((task) => {
    if (typeof task !== "function") return;

    if (typeof window === "undefined") {
      task();
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        task();
      });
    });
  }, []);

  const blurActiveElement = useCallback(() => {
    if (typeof document === "undefined") return;
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      typeof activeElement.blur === "function"
    ) {
      activeElement.blur();
    }
  }, []);

  const runResponsiveAction = useCallback((key, action) => {
    recentActionRef.current = { key, at: Date.now() };
    action?.();
  }, []);

  const getActionPressProps = useCallback(
    (key, action) => ({
      touchAction: "manipulation",
      onPointerDown: (event) => {
        if (event.button !== 0) return;
        runResponsiveAction(key, action);
      },
      onClick: () => {
        const recent = recentActionRef.current;
        if (recent.key === key && Date.now() - recent.at < 750) {
          recentActionRef.current = { key: "", at: 0 };
          return;
        }
        runResponsiveAction(key, action);
      },
    }),
    [runResponsiveAction],
  );

  // Lazy-mount the XP-activity heatmap AFTER the modal shell paints.
  // The heatmap is still ~371 DOM nodes + a scrollable grid; rendering
  // it on the same tick the modal opens is the last remaining cause of
  // perceptible lag. Deferring to the next frame lets the modal appear
  // instantly, and the heatmap fills in immediately afterwards.
  const [heatmapReady, setHeatmapReady] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setHeatmapReady(false);
      return undefined;
    }
    if (typeof window === "undefined") {
      setHeatmapReady(true);
      return undefined;
    }
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setHeatmapReady(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [isOpen]);

  // Reset field when modal re-opens or default changes
  useEffect(() => {
    if (isOpen) {
      setGoal(String(defaultGoal));
    }
  }, [isOpen, defaultGoal]);

  // Clamp + parse
  const parsed = useMemo(
    () => Math.max(1, Math.min(1000, Math.round(Number(goal) || 0))),
    [goal],
  );

  // Pretty preview of “next reset” (local time)
  const resetPreview = useMemo(() => {
    const d = new Date(Date.now() + MS_24H);
    const date = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} · ${time}`;
  }, [isOpen]); // recompute on open

  const levelPct = Math.min(100, parsed); // % of one level (100 XP)
  const approxLevels = (parsed / 100).toFixed(parsed % 100 === 0 ? 0 : 1);

  const save = async () => {
    blurActiveElement();

    if (onSaveGoal) {
      onSaveGoal(parsed);
      deferPostAction(() => {
        void playSound(submitActionSound);
      });
      return;
    }

    if (!npub) {
      console.warn(L.errNoUserTitle, L.errNoUserDesc);
      return;
    }

    try {
      const resetAt = new Date(Date.now() + MS_24H).toISOString();
      const todayKey = getLocalDayKey(new Date());
      await setDoc(
        doc(database, "users", npub),
        {
          dailyGoalXp: parsed,
          dailyXp: 0,
          dailyResetAt: resetAt,
          dailyHasCelebrated: false,
          dailyGoalPetHealth: getDailyGoalPetHealth({
            dailyGoalPetHealth: petHealth,
          }),
          ...(todayKey
            ? {
                dailyXpHistory: {
                  ...(dailyXpHistory || {}),
                  [todayKey]: 0,
                },
              }
            : {}),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      onClose?.();
      deferPostAction(() => {
        void playSound(submitActionSound);
      });
    } catch (e) {
      console.error(L.errSaveTitle, e);
    }
  };
  const handleClose = useCallback(() => {
    blurActiveElement();
    onClose?.();
    void playSound(selectSound);
  }, [blurActiveElement, onClose, playSound]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size="lg"
      closeOnOverlayClick={false}
      closeOnEsc={true}
      motionPreset="none"
      returnFocusOnClose={false}
    >
      <ModalOverlay
        bg={useSharedBackdrop ? "transparent" : isLightTheme ? APP_OVERLAY : "blackAlpha.700"}
        backdropFilter={useSharedBackdrop ? undefined : isLightTheme ? "blur(4px)" : undefined}
      />

      <ModalContent
        bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
        color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
        border="1px solid"
        borderColor={isLightTheme ? APP_BORDER : "gray.700"}
        rounded="2xl"
        shadow={isLightTheme ? APP_SHADOW : "xl"}
        overflow="hidden"
        maxH={{ base: "92vh", md: "880px" }}
        sx={{
          "@supports (height: 100dvh)": {
            maxHeight: "92dvh",
          },
        }}
      >
        <ModalCloseButton
          color={isLightTheme ? "white" : "currentColor"}
          left={isRtl ? 3 : undefined}
          right={isRtl ? "auto" : undefined}
          _hover={{
            bg: isLightTheme ? "rgba(255,255,255,0.12)" : "whiteAlpha.100",
          }}
        />
        {/* Header */}
        <Box
          bg={
            isLightTheme
              ? "linear-gradient(135deg, #43a19d 0%, #378b86 100%)"
              : "teal.500"
          }
          color="white"
          px={6}
          pl={isRtl ? 12 : 6}
          pr={isRtl ? 6 : 12}
          py={5}
        >
          <HStack spacing={3} align="center">
            <Box
              as={FaCalendarAlt}
              aria-hidden
              fontSize="22px"
              opacity={0.95}
            />
            <Text fontWeight="bold" fontSize="lg" lineHeight="1.2">
              {ui.title || L.title}
            </Text>
          </HStack>
        </Box>
        {/* Body */}
        <ModalBody
          px={{ base: 4, md: 6 }}
          py={5}
          overflowY="auto"
          maxH={{ base: "72vh", md: "720px" }}
          sx={{
            "@supports (height: 100dvh)": {
              maxHeight: "72dvh",
            },
          }}
        >
          <VStack align="stretch" spacing={5}>
            <DailyGoalPetPanel
              lang={resolvedLang}
              health={petHealth}
              lastOutcome={petLastOutcome}
              lastDelta={petLastDelta}
              variant="setup"
              showPreview={true}
            />

            {/* Quick presets */}
            <Box>
              <HStack spacing={2} wrap="wrap">
                {PRESETS.map((v) => {
                  const active = parsed === v;
                  return (
                    <Button
                      key={v}
                      size="sm"
                      variant={
                        isLightTheme ? "solid" : active ? "solid" : "outline"
                      }
                      bg={
                        isLightTheme
                          ? active
                            ? "#3f9f9b"
                            : APP_SURFACE_ELEVATED
                          : undefined
                      }
                      color={
                        isLightTheme
                          ? active
                            ? "white"
                            : APP_TEXT_PRIMARY
                          : undefined
                      }
                      border="1px solid"
                      borderColor={
                        isLightTheme
                          ? active
                            ? "rgba(63, 159, 155, 0.7)"
                            : APP_BORDER
                          : active
                            ? "transparent"
                            : undefined
                      }
                      boxShadow={
                        isLightTheme && active
                          ? "0 6px 0 rgba(36, 91, 89, 0.18)"
                          : "none"
                      }
                      _hover={
                        isLightTheme
                          ? {
                              bg: active ? "#398f8b" : APP_SURFACE_MUTED,
                            }
                          : undefined
                      }
                      colorScheme={isLightTheme ? undefined : "teal"}
                      onClick={() => {
                        playSound(selectSound);
                        setGoal(String(v));
                      }}
                    >
                      {v} XP
                    </Button>
                  );
                })}
              </HStack>
            </Box>

            {/* Simple text field (no steppers) */}
            <FormControl>
              <FormLabel color={isLightTheme ? APP_TEXT_PRIMARY : undefined}>
                {ui.inputLabel || L.inputLabel}
              </FormLabel>
              <HStack spacing={3} align="center">
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  max={1000}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.800"}
                  color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                  borderColor={isLightTheme ? APP_BORDER_STRONG : undefined}
                  rounded="md"
                  size="md"
                  w="180px"
                />
                <Text color={isLightTheme ? APP_TEXT_SECONDARY : undefined}>
                  {L.xpUnit}
                </Text>
              </HStack>
              <Text
                mt={2}
                fontSize="xs"
                color={isLightTheme ? APP_TEXT_MUTED : undefined}
                opacity={isLightTheme ? 1 : 0.7}
              >
                {L.levelExplainer(levelPct, approxLevels)}
              </Text>
            </FormControl>

            {heatmapReady ? (
              <DailyGoalHeatmap
                lang={resolvedLang}
                completedGoalDates={completedGoalDates}
                dailyXpHistory={dailyXpHistory}
                currentDailyXp={currentDailyXp}
                currentGoalXp={currentGoalXp}
                labels={heatmapLabels}
                isLightTheme={isLightTheme}
              />
            ) : (
              <Box
                p={4}
                borderRadius="xl"
                bg={isLightTheme ? APP_SURFACE_MUTED : "gray.800"}
                border="1px solid"
                borderColor={isLightTheme ? APP_BORDER : "gray.700"}
                minH={{ base: "150px", md: "170px" }}
              />
            )}
          </VStack>
        </ModalBody>
        {/* Footer */}
        <ModalFooter
          px={{ base: 4, md: 6 }}
          py={4}
          borderTop="1px solid"
          borderColor={isLightTheme ? APP_BORDER : "gray.800"}
        >
          <HStack w="100%" justify="flex-end" spacing={3}>
            <Button
              variant={"ghost"}
              color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
              {...getActionPressProps("daily-goal-close", handleClose)}
            >
              {t?.daily_goal_close || t?.teams_drawer_close || t?.app_close || "Close"}
            </Button>
            <Button
              colorScheme={isLightTheme ? undefined : "teal"}
              bg={isLightTheme ? "#3f9f9b" : undefined}
              color={isLightTheme ? "white" : undefined}
              _hover={isLightTheme ? { bg: "#398f8b" } : undefined}
              {...getActionPressProps("daily-goal-save", save)}
              isDisabled={!npub}
              boxShadow={"0px 4px 0px teal"}
            >
              {ui.save || L.save}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
