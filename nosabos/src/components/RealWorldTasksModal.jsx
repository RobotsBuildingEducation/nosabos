// src/components/RealWorldTasksModal.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Progress,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { doc, setDoc } from "firebase/firestore";
import { database, simplemodel } from "../firebaseResources/firebaseResources";
import { awardXp } from "../utils/utils";
import BottomDrawerDragHandle from "./BottomDrawerDragHandle";
import useBottomDrawerSwipeDismiss from "../hooks/useBottomDrawerSwipeDismiss";
import { useThemeStore } from "../useThemeStore";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

export const REAL_WORLD_TASKS_REWARD_XP = 50;
export const REAL_WORLD_TASKS_REFRESH_MS = 6 * 60 * 60 * 1000; // 6 hours

const TARGET_LANGUAGE_LABELS = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  nl: "Dutch",
  nah: "Eastern Huasteca Nahuatl",
  ja: "Japanese",
  ru: "Russian",
  de: "German",
  el: "Greek",
  pl: "Polish",
  ga: "Irish",
  yua: "Yucatec Maya",
};

function extractJsonBlock(text = "") {
  if (!text) return "";
  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (blockMatch) return blockMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  return braceMatch ? braceMatch[0].trim() : text.trim();
}

function normalizeTasks(parsed) {
  if (!parsed) return null;
  const arr = Array.isArray(parsed) ? parsed : parsed.tasks;
  if (!Array.isArray(arr)) return null;
  const cleaned = arr
    .slice(0, 3)
    .map((t) => {
      if (!t) return null;
      if (typeof t === "string") {
        return { title: t.trim(), description: "" };
      }
      const title = String(t.title || t.name || "").trim();
      const description = String(t.description || t.detail || "").trim();
      if (!title) return null;
      return { title, description };
    })
    .filter(Boolean);
  return cleaned.length === 3 ? cleaned : null;
}

async function generateRealWorldTasks({ targetLang, appLanguage, cefrLevel }) {
  const tName = TARGET_LANGUAGE_LABELS[targetLang] || targetLang;
  const sName = TARGET_LANGUAGE_LABELS[appLanguage] || appLanguage;
  const level = cefrLevel || "A1";

  const prompt = [
    `You are a language coach. Create EXACTLY 3 short, real-world practice missions for a learner of ${tName}.`,
    `The learner's proficiency level is ${level} (CEFR).`,
    `Each mission should be doable in the real world or on the internet within a few minutes.`,
    `Topic ideas (do NOT copy verbatim): ordering at a cafe, commenting on a video, switching a device's language, watching a short clip, labelling objects in your home, sending a voice message to a friend, searching for a recipe, reading a news headline, asking a stranger for the time, etc.`,
    `Adjust difficulty to the ${level} level — keep missions accessible at lower levels, and richer/more nuanced at higher levels.`,
    `CRITICAL: Do NOT give the learner the answer. Do NOT write the target-language phrase they should say. Do NOT translate anything for them. The description is a short prompt/context only — it tells them WHAT to do and WHY, never HOW.`,
    `Titles should be an action phrase (e.g. "Order a drink in ${tName}"), max ~8 words.`,
    `Descriptions should be 1 short sentence of context (max ~20 words) — a hint about the setting or goal, NOT the words to say. Avoid quoted phrases in the target language. Avoid literal scripts or vocabulary lists.`,
    `Write titles and descriptions in ${sName} (the learner's UI language). Mention ${tName} by name when referring to the target language.`,
    `Return ONLY a JSON object matching: {"tasks":[{"title":"...","description":"..."},{"title":"...","description":"..."},{"title":"...","description":"..."}]}`,
    `No code fences. No commentary. JSON only.`,
  ].join(" ");

  const resp = await simplemodel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text =
    (typeof resp?.response?.text === "function"
      ? resp.response.text()
      : resp?.response?.text) ||
    resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";

  const snippet = extractJsonBlock(text);
  let parsed = null;
  try {
    parsed = JSON.parse(snippet);
  } catch {
    parsed = null;
  }
  const tasks = normalizeTasks(parsed);
  if (!tasks) {
    throw new Error("Failed to parse generated tasks");
  }
  return tasks;
}

function formatRemaining(ms, lang) {
  if (ms <= 0) {
    return lang === "es" ? "Listas para renovar" : "Ready to refresh";
  }
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) {
    return lang === "es" ? `${h}h ${m}m restantes` : `${h}h ${m}m left`;
  }
  return lang === "es" ? `${m}m restantes` : `${m}m left`;
}

export default function RealWorldTasksModal({
  isOpen,
  onClose,
  npub,
  appLanguage = "en",
  targetLang = "es",
  cefrLevel = "A1",
  realWorldTasks,
  onTasksUpdated,
}) {
  const lang = appLanguage === "es" ? "es" : "en";
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const swipeDismiss = useBottomDrawerSwipeDismiss({ isOpen, onClose });
  const toast = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [isClaiming, setIsClaiming] = useState(false);
  const generationGuard = useRef(false);

  const ui = useMemo(
    () =>
      isLightTheme
        ? {
            overlay: "rgba(76, 60, 40, 0.18)",
            drawerBg: APP_SURFACE_ELEVATED,
            drawerBorder: APP_BORDER,
            drawerText: APP_TEXT_PRIMARY,
            headerBorder: APP_BORDER,
            cardBg: "#f3ebdf",
            cardBorder: "rgba(96, 77, 56, 0.12)",
            primaryText: APP_TEXT_PRIMARY,
            secondaryText: APP_TEXT_SECONDARY,
            mutedText: APP_TEXT_MUTED,
            icon: APP_TEXT_SECONDARY,
            closeHoverBg: APP_SURFACE_MUTED,
            shadow: APP_SHADOW,
            progressTrack: "#e6dcc9",
          }
        : {
            overlay: "blackAlpha.600",
            drawerBg: "gray.900",
            drawerBorder: undefined,
            drawerText: "white",
            headerBorder: "whiteAlpha.200",
            cardBg: "whiteAlpha.50",
            cardBorder: "transparent",
            primaryText: "white",
            secondaryText: "gray.300",
            mutedText: "gray.500",
            icon: "gray.400",
            closeHoverBg: "whiteAlpha.100",
            shadow: undefined,
            progressTrack: "whiteAlpha.200",
          },
    [isLightTheme],
  );

  const normalizedTargetLang = String(targetLang || "").toLowerCase();
  const normalizedLevel = cefrLevel || "A1";

  const generatedAt = realWorldTasks?.generatedAt
    ? new Date(realWorldTasks.generatedAt).getTime()
    : 0;
  const isStale =
    !realWorldTasks ||
    !Array.isArray(realWorldTasks.tasks) ||
    realWorldTasks.tasks.length !== 3 ||
    realWorldTasks.targetLang !== normalizedTargetLang ||
    !generatedAt ||
    now - generatedAt >= REAL_WORLD_TASKS_REFRESH_MS;

  const tasks = isStale ? [] : realWorldTasks.tasks;
  const completed =
    !isStale && Array.isArray(realWorldTasks.completed)
      ? realWorldTasks.completed
      : [false, false, false];
  const rewarded = !isStale && Boolean(realWorldTasks?.rewarded);

  const allDone = completed.length === 3 && completed.every(Boolean);
  const remainingMs = isStale
    ? 0
    : Math.max(0, REAL_WORLD_TASKS_REFRESH_MS - (now - generatedAt));
  const elapsedMs = isStale
    ? REAL_WORLD_TASKS_REFRESH_MS
    : Math.min(REAL_WORLD_TASKS_REFRESH_MS, now - generatedAt);
  const progressValue = Math.min(
    100,
    Math.max(0, (elapsedMs / REAL_WORLD_TASKS_REFRESH_MS) * 100),
  );

  // Tick timer while modal is open so progress bar updates
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    setNow(Date.now());
    return () => clearInterval(id);
  }, [isOpen]);

  const persistTasks = useCallback(
    async (next) => {
      if (!npub) return;
      const ref = doc(database, "users", npub);
      await setDoc(
        ref,
        {
          realWorldTasks: next,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      onTasksUpdated?.(next);
    },
    [npub, onTasksUpdated],
  );

  const triggerGeneration = useCallback(async () => {
    if (!npub) return;
    if (generationGuard.current) return;
    generationGuard.current = true;
    setIsGenerating(true);
    setErrorMsg("");
    try {
      const fresh = await generateRealWorldTasks({
        targetLang: normalizedTargetLang,
        appLanguage: lang,
        cefrLevel: normalizedLevel,
      });
      const next = {
        tasks: fresh,
        completed: [false, false, false],
        rewarded: false,
        generatedAt: new Date().toISOString(),
        targetLang: normalizedTargetLang,
        cefrLevel: normalizedLevel,
        appLanguage: lang,
      };
      await persistTasks(next);
    } catch (err) {
      console.error("Real-world task generation failed:", err);
      setErrorMsg(
        lang === "es"
          ? "No se pudieron generar las tareas. Intenta de nuevo."
          : "Could not generate tasks. Please try again.",
      );
    } finally {
      setIsGenerating(false);
      generationGuard.current = false;
    }
  }, [npub, normalizedTargetLang, lang, normalizedLevel, persistTasks]);

  // Auto-generate when stale and modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (!npub) return;
    if (isGenerating) return;
    if (isStale) {
      triggerGeneration();
    }
  }, [isOpen, npub, isStale, isGenerating, triggerGeneration]);

  const handleToggleTask = useCallback(
    async (index) => {
      if (!realWorldTasks || isStale || rewarded) return;
      const nextCompleted = [...completed];
      nextCompleted[index] = !nextCompleted[index];
      const next = {
        ...realWorldTasks,
        completed: nextCompleted,
      };
      // Optimistic update
      onTasksUpdated?.(next);
      try {
        await persistTasks(next);
      } catch (err) {
        console.error("Failed to update task completion:", err);
      }
    },
    [realWorldTasks, isStale, rewarded, completed, onTasksUpdated, persistTasks],
  );

  const handleClaimReward = useCallback(async () => {
    if (!npub || !realWorldTasks || isStale || rewarded || !allDone) return;
    setIsClaiming(true);
    try {
      await awardXp(npub, REAL_WORLD_TASKS_REWARD_XP, normalizedTargetLang);
      const next = {
        ...realWorldTasks,
        rewarded: true,
        rewardedAt: new Date().toISOString(),
      };
      await persistTasks(next);
      toast({
        title:
          lang === "es"
            ? `+${REAL_WORLD_TASKS_REWARD_XP} XP ganados`
            : `+${REAL_WORLD_TASKS_REWARD_XP} XP earned`,
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (err) {
      console.error("Failed to claim real-world task reward:", err);
      toast({
        title:
          lang === "es"
            ? "No se pudo otorgar la recompensa"
            : "Failed to award reward",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsClaiming(false);
    }
  }, [
    npub,
    realWorldTasks,
    isStale,
    rewarded,
    allDone,
    normalizedTargetLang,
    persistTasks,
    toast,
    lang,
  ]);

  const drawerTitle =
    lang === "es" ? "Práctica del mundo real" : "Real-World Practice";
  const subtitle =
    lang === "es"
      ? "3 micro-tareas para usar tu idioma fuera de la app"
      : "3 micro-tasks to use your language outside the app";
  const progressLabel =
    lang === "es"
      ? "Próximo lote en"
      : "Next batch in";
  const generatingLabel =
    lang === "es" ? "Generando tareas..." : "Generating tasks...";
  const claimLabel =
    lang === "es"
      ? `Reclamar +${REAL_WORLD_TASKS_REWARD_XP} XP`
      : `Claim +${REAL_WORLD_TASKS_REWARD_XP} XP`;

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
      <DrawerOverlay
        bg={ui.overlay}
        backdropFilter={isLightTheme ? "blur(4px)" : undefined}
        opacity={swipeDismiss.overlayOpacity}
        transition="opacity 0.18s ease"
      />
      <DrawerContent
        {...swipeDismiss.drawerContentProps}
        display="flex"
        flexDirection="column"
        bg={ui.drawerBg}
        color={ui.drawerText}
        borderTopRadius="24px"
        h={{ base: "90vh", md: "auto" }}
        maxH={{ base: "90vh", md: "85vh" }}
        borderTop={ui.drawerBorder ? `1px solid ${ui.drawerBorder}` : undefined}
        boxShadow={ui.shadow}
        sx={{
          "@supports (height: 100dvh)": {
            "@media (max-width: 47.99em)": {
              height: "90dvh",
              maxHeight: "90dvh",
            },
            "@media (min-width: 48em)": {
              maxHeight: "85dvh",
            },
          },
        }}
      >
        <BottomDrawerDragHandle isDragging={swipeDismiss.isDragging} />
        <DrawerCloseButton
          color={ui.icon}
          _hover={{ color: ui.primaryText, bg: ui.closeHoverBg }}
          top={4}
          right={4}
        />
        <DrawerHeader
          borderBottomWidth="1px"
          borderColor={ui.headerBorder}
          pr={12}
        >
          <Box maxW="520px" mx="auto" w="100%">
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between" align="center">
                <Text color={ui.primaryText} fontWeight="semibold">
                  {drawerTitle}
                </Text>
                {/* TEMP test button — remove later */}
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="orange"
                  onClick={triggerGeneration}
                  isDisabled={isGenerating}
                  isLoading={isGenerating}
                >
                  {lang === "es" ? "Prueba: regenerar" : "Test: regenerate"}
                </Button>
              </HStack>
              <Text fontSize="11px" color={ui.secondaryText}>
                {subtitle}
              </Text>
            </VStack>
          </Box>
        </DrawerHeader>

        <DrawerBody overflowY="auto" flex="1" py={4}>
          <Box maxW="520px" mx="auto" w="100%">
            <VStack align="stretch" spacing={3} mb={4}>
              <HStack justify="space-between" fontSize="xs" color={ui.mutedText}>
                <Text>{progressLabel}</Text>
                <Text>{formatRemaining(remainingMs, lang)}</Text>
              </HStack>
              <Progress
                value={progressValue}
                size="sm"
                borderRadius="full"
                colorScheme={remainingMs <= 0 ? "purple" : "cyan"}
                bg={ui.progressTrack}
              />
            </VStack>

            {isGenerating ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                py={10}
                gap={3}
              >
                <Spinner size="md" color="cyan.400" />
                <Text fontSize="sm" color={ui.secondaryText}>
                  {generatingLabel}
                </Text>
              </Flex>
            ) : errorMsg ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                py={8}
                gap={3}
              >
                <Text fontSize="sm" color="red.300" textAlign="center">
                  {errorMsg}
                </Text>
                <Button
                  size="sm"
                  colorScheme="cyan"
                  onClick={triggerGeneration}
                >
                  {lang === "es" ? "Reintentar" : "Try again"}
                </Button>
              </Flex>
            ) : tasks.length === 0 ? (
              <Flex justify="center" py={10}>
                <Text fontSize="sm" color={ui.secondaryText}>
                  {lang === "es"
                    ? "No hay tareas todavía."
                    : "No tasks yet."}
                </Text>
              </Flex>
            ) : (
              <VStack align="stretch" spacing={3}>
                {tasks.map((task, i) => {
                  const isChecked = Boolean(completed[i]);
                  return (
                    <Box
                      key={i}
                      as="button"
                      type="button"
                      bg={ui.cardBg}
                      borderWidth="1px"
                      borderColor={ui.cardBorder}
                      borderRadius="lg"
                      p={4}
                      w="100%"
                      textAlign="left"
                      cursor={rewarded ? "default" : "pointer"}
                      opacity={rewarded ? 0.75 : 1}
                      onClick={() => {
                        if (rewarded) return;
                        handleToggleTask(i);
                      }}
                      _hover={rewarded ? undefined : { filter: "brightness(1.05)" }}
                      _active={rewarded ? undefined : { transform: "scale(0.995)" }}
                      transition="transform 0.08s ease, filter 0.15s ease"
                    >
                      <HStack align="start" spacing={3}>
                        <Checkbox
                          isChecked={isChecked}
                          isDisabled={rewarded}
                          onChange={() => handleToggleTask(i)}
                          onClick={(e) => e.stopPropagation()}
                          colorScheme="green"
                          size="lg"
                          mt={1}
                          pointerEvents="none"
                        />
                        <VStack align="stretch" spacing={1} flex="1">
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color={ui.primaryText}
                            textDecoration={isChecked ? "line-through" : "none"}
                          >
                            {task.title}
                          </Text>
                          {task.description && (
                            <Text fontSize="11px" color={ui.secondaryText}>
                              {task.description}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Box>
        </DrawerBody>

        <DrawerFooter
          borderTopWidth="1px"
          borderColor={ui.headerBorder}
          flexDirection="column"
          gap={2}
        >
          <Box maxW="520px" mx="auto" w="100%">
            <Button
              colorScheme={allDone && !rewarded ? "teal" : "gray"}
              variant={allDone && !rewarded ? "solid" : "outline"}
              isDisabled={!allDone || rewarded || isGenerating}
              isLoading={isClaiming}
              onClick={handleClaimReward}
              w="100%"
            >
              {claimLabel}
            </Button>
          </Box>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
