import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
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
import { FiTarget, FiZap, FiClock, FiCalendar } from "react-icons/fi";
import { database } from "../firebaseResources/firebaseResources";
import {
  translations as allTranslations,
  t as translate,
} from "../utils/translation.jsx";
import { WaveBar } from "./WaveBar.jsx";
import GoalCalendar from "./GoalCalendar.jsx";
import { FaCalendarAlt, FaCalendarCheck } from "react-icons/fa";

const MS_24H = 24 * 60 * 60 * 1000;
const PRESETS = [75, 100, 150, 200, 300];

export default function DailyGoalModal({
  isOpen,
  onClose,
  npub,
  lang = "en",
  defaultGoal = 100,
  t,
  ui = {},
  completedGoalDates = [],
  startDate,
}) {
  const resolvedLang = lang === "es" ? "es" : "en";
  const resolvedTranslations = useMemo(
    () => t || allTranslations[resolvedLang] || allTranslations.en,
    [t, resolvedLang]
  );

  const getLabel = useCallback(
    (key, fallback, vars = {}) =>
      translate(resolvedLang, key, vars) ||
      translate("en", key, vars) ||
      resolvedTranslations?.[key] ||
      fallback,
    [resolvedLang, resolvedTranslations]
  );

  const L = useMemo(
    () => ({
      quickPicks: getLabel("daily_goal_quick_picks", "Quick picks"),
      fineTune: getLabel("daily_goal_fine_tune", "Fine-tune"),
      xpUnit: getLabel("daily_goal_xp_unit", "XP / day"),
      levelExplainer: (pct, lvls) =>
        getLabel(
          "daily_goal_level_explainer",
          `Each level is 100 XP. This goal is ${pct}% of a level (≈ ${lvls} levels per day).`,
          { pct, levels: lvls }
        ),
      goalPreview: getLabel("daily_goal_preview", "Goal preview"),
      resetsIn: (when) =>
        getLabel("daily_goal_resets_in", `Resets in 24h · ${when}`, { when }),
      save: getLabel("daily_goal_save", "Save"),
      title: getLabel("daily_goal_title", "Daily XP goal"),
      subtitle: getLabel(
        "daily_goal_subtitle",
        "Each level = 100 XP. How many XP do you want to earn per day?"
      ),
      inputLabel: getLabel("daily_goal_input_label", "XP per day"),
      errNoUserTitle: getLabel("daily_goal_error_no_user", "No user ID"),
      errNoUserDesc: getLabel(
        "daily_goal_error_no_user_desc",
        "Please sign in again."
      ),
      errSaveTitle: getLabel("daily_goal_error_save", "Could not save goal"),
      calendarTitle: getLabel("daily_goal_calendar_title", "Your progress"),
    }),
    [getLabel]
  );
  const [goal, setGoal] = useState(String(defaultGoal));

  // Calendar month navigation state
  const [calendarYear, setCalendarYear] = useState(() =>
    new Date().getFullYear()
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    new Date().getMonth()
  );

  // Reset field when modal re-opens or default changes
  useEffect(() => {
    if (isOpen) {
      setGoal(String(defaultGoal));
      // Reset calendar to current month when modal opens
      const now = new Date();
      setCalendarYear(now.getFullYear());
      setCalendarMonth(now.getMonth());
    }
  }, [isOpen, defaultGoal]);

  const handleMonthChange = useCallback((year, month) => {
    setCalendarYear(year);
    setCalendarMonth(month);
  }, []);

  // Clamp + parse
  const parsed = useMemo(
    () => Math.max(1, Math.min(1000, Math.round(Number(goal) || 0))),
    [goal]
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
    if (!npub) {
      console.warn(L.errNoUserTitle, L.errNoUserDesc);
      return;
    }
    try {
      const resetAt = new Date(Date.now() + MS_24H).toISOString();
      setDoc(
        doc(database, "users", npub),
        {
          dailyGoalXp: parsed,
          dailyXp: 0,
          dailyResetAt: resetAt,
          dailyHasCelebrated: false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      onClose?.();
    } catch (e) {
      console.error(L.errSaveTitle, e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="lg"
      closeOnOverlayClick={false}
      closeOnEsc={true}
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.700" />

      <ModalContent
        bg="gray.900"
        color="gray.100"
        border="1px solid"
        borderColor="gray.700"
        rounded="2xl"
        shadow="xl"
        overflow="hidden"
        maxH="100vh"
        sx={{
          "@supports (height: 100dvh)": {
            maxHeight: "100dvh",
          },
        }}
      >
        <ModalCloseButton />
        {/* Header */}
        <Box
          bgGradient="linear(to-r, teal.700, teal.500)"
          color="white"
          px={6}
          pr={12}
          py={5}
        >
          <HStack spacing={3} align="center">
            <Box
              as={FaCalendarAlt}
              aria-hidden
              fontSize="22px"
              opacity={0.95}
            />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="lg" lineHeight="1.2">
                {ui.title || L.title}
              </Text>
              <Text fontSize="sm" opacity={0.95}>
                {ui.subtitle || L.subtitle}
              </Text>
            </VStack>
          </HStack>
        </Box>
        {/* Body */}
        <ModalBody px={{ base: 4, md: 6 }} py={5} overflowY="auto" maxH="60vh">
          <VStack align="stretch" spacing={5}>
            {/* Quick presets */}
            <Box>
              <Text fontSize="sm" mb={2} opacity={0.85}>
                {L.quickPicks}
              </Text>
              <HStack spacing={2} wrap="wrap">
                {PRESETS.map((v) => {
                  const active = parsed === v;
                  return (
                    <Button
                      key={v}
                      size="sm"
                      variant={active ? "solid" : "outline"}
                      colorScheme="teal"
                      onClick={() => setGoal(String(v))}
                    >
                      {v} XP
                    </Button>
                  );
                })}
              </HStack>
            </Box>

            {/* Simple text field (no steppers) */}
            <FormControl>
              <FormLabel>{ui.inputLabel || L.inputLabel}</FormLabel>
              <HStack spacing={3} align="center">
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  max={1000}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  bg="gray.800"
                  rounded="md"
                  size="md"
                  w="180px"
                />
                <Text opacity={0.8}>{L.xpUnit}</Text>
              </HStack>
              <Text mt={2} fontSize="xs" opacity={0.7}>
                {L.levelExplainer(levelPct, approxLevels)}
              </Text>
            </FormControl>

            <Divider borderColor="gray.700" />

            {/* Preview */}
            <Box>
              <HStack spacing={2} mb={2}>
                <Box as={FiZap} aria-hidden fontSize="18px" color="teal.300" />
                <Text fontWeight="semibold">{L.goalPreview}</Text>
              </HStack>
              <WaveBar
                value={Math.min(levelPct, 100)}
                size="sm"
                rounded="md"
                hasStripe
                isAnimated
                start="rgba(28, 145, 248, 1)"
                end="rgba(0, 157, 255, 1)"
              />
              <HStack mt={2} justify="space-between" fontSize="sm">
                <Text opacity={0.85}>
                  {parsed} {L.xpUnit}
                </Text>
                <HStack spacing={2}>
                  <Box
                    as={FiClock}
                    aria-hidden
                    fontSize="16px"
                    color="gray.300"
                  />
                  <Text opacity={0.8}>{L.resetsIn(resetPreview)}</Text>
                </HStack>
              </HStack>
            </Box>

            <Divider borderColor="gray.700" />

            {/* Goal Calendar */}
            <Box>
              <HStack spacing={2} mb={3}>
                <Box
                  as={FiCalendar}
                  aria-hidden
                  fontSize="18px"
                  color="teal.300"
                />
                <Text fontWeight="semibold">{L.calendarTitle}</Text>
              </HStack>
              <Box
                bg="gray.800"
                borderRadius="lg"
                p={4}
                border="1px solid"
                borderColor="gray.700"
              >
                <GoalCalendar
                  completedDates={completedGoalDates}
                  lang={resolvedLang}
                  year={calendarYear}
                  month={calendarMonth}
                  onMonthChange={handleMonthChange}
                  showNavigation={true}
                  highlightToday={true}
                  size="md"
                  startDate={startDate}
                />
              </Box>
            </Box>
          </VStack>
        </ModalBody>
        {/* Footer */}
        <ModalFooter
          px={{ base: 4, md: 6 }}
          py={4}
          borderTop="1px solid"
          borderColor="gray.800"
        >
          <HStack w="100%" justify="flex-end" spacing={3}>
            <Button variant={"ghost"} onClick={onClose}>
              {t?.teams_drawer_close || "Close"}
            </Button>
            <Button colorScheme="teal" onClick={save} isDisabled={!npub}>
              {ui.save || L.save}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
