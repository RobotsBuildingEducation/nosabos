// src/components/RealWorldTasksModal.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { WaveBar } from "./WaveBar";
import VoiceOrb from "./VoiceOrb";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import sparkleSound from "../assets/sparkle.mp3";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";

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
  hi: "Hindi",
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

  // Concrete, level-specific guidance so the model actually respects CEFR.
  const levelGuidance = {
    "Pre-A1":
      "Absolute beginner. Single words or 2-3 word phrases. Numbers, colors, greetings in isolation, naming objects, copying characters. Listening/reading should be labels, signs, or single words at a time. No sentences, no conversations.",
    A1: "Beginner. Very short, rehearsed phrases about self, family, basic needs. Can ask/answer simple personal questions if the other person speaks slowly. Reading: signs, menus, short messages. Writing: a postcard, filling a form.",
    A2: "Elementary. Short routine exchanges on familiar topics (shopping, work, local area). Can understand frequently used expressions. Reading: short simple texts, ads, schedules. Writing: short notes and messages.",
    B1: "Intermediate. Can handle most situations while traveling. Can describe experiences, dreams, opinions briefly. Understands clear standard input on familiar matters. Reading: factual texts on topics of interest. Writing: connected text on familiar topics.",
    B2: "Upper intermediate. Can interact with fluency and spontaneity. Can produce detailed text on a wide range of subjects and explain a viewpoint. Can follow most news, films, articles.",
    C1: "Advanced. Can express ideas fluently and spontaneously without much searching. Can use language flexibly for social, academic, and professional purposes. Can understand long, demanding texts and implicit meaning.",
    C2: "Proficient. Can understand virtually everything heard or read. Can summarize from different sources, reconstruct arguments, express shades of meaning precisely.",
  };
  const levelDescription = levelGuidance[level] || levelGuidance.A1;

  // Nudge the model toward variety by seeding each call with a random
  // creative signature. The model never sees this verbatim — it just
  // influences what it dreams up.
  const creativitySeed = Math.random().toString(36).slice(2, 10);
  // Realistic, self-contained vibes. Every option must be doable by a
  // learner alone, without access to native speakers, a target-language
  // country, or specific local businesses. Leans heavily on passive
  // immersion and discovery, not just producing language.
  const diversityHints = [
    `follow a ${tName}-speaking creator on YouTube / TikTok / Instagram`,
    `Post to a ${tName}-language subreddit or forum`,
    `find and save a ${tName}-language podcast or radio station`,
    `find and bookmark a ${tName}-language show, movie, or channel to watch`,
    `follow a ${tName}-language news account or newsletter`,
    `discover a musician who sings in ${tName} and play their music`,
    `browse a ${tName}-language community, meme page, or hobby group`,
    `switch an app, game, or device interface into ${tName}`,
    `journal, label, or note-take a few words/phrases in ${tName}`,
    `shadow or read aloud a short clip in ${tName}`,
    `chat briefly with an AI or voice assistant in ${tName}`,
    `watch a short video in ${tName} and observe without translating`,
  ];
  // Pick 3 distinct vibes for this batch so the 3 tasks cover different territory.
  const shuffled = [...diversityHints].sort(() => Math.random() - 0.5);
  const pickedHints = shuffled.slice(0, 3);

  const prompt = [
    `You are a creative language coach. Invent EXACTLY 3 short, original immersion missions for a learner of ${tName}.`,
    `The learner's proficiency level is ${level} (CEFR). ${levelDescription}`,
    `STRICTLY match the difficulty to ${level}. Do NOT suggest anything above this level. At Pre-A1/A1, absolutely no full conversations, no nuanced opinions, no reading articles — stick to words, labels, and rehearsed micro-phrases. At higher levels, make the missions richer and more demanding.`,
    `Each mission must be doable alone, from anywhere, in a few minutes, using only a phone/computer or the learner's immediate home environment.`,
    `DO NOT assume the learner has access to native speakers, a target-language country, local shops, clerks, strangers, restaurants, or community events. No "greet a local clerk", "order at a cafe", "ask a stranger" style tasks. No missions that require traveling or finding a specific place.`,
    `GO BROADER THAN JUST SPEAKING/WRITING DRILLS. Prioritize discovery and passive immersion: following a ${tName}-speaking creator, posting to a ${tName}-language subreddit / Discord / forum, finding a podcast, show, musician, or streamer in ${tName}, switching an app's language, lurking in a hobby community, etc. Building the learner's ${tName} media diet matters as much as producing language. Mix passive (follow / watch / listen / lurk) and active (shadow / journal / label / chat) tasks across the 3 missions.`,
    `Make the 3 missions meaningfully DIFFERENT from each other — different modalities and different contexts.`,
    `Vary across batches — do not default to the same ideas every time.`,
    `For inspiration this batch only, loosely draw one mission from each of these vibes (do NOT quote them, just use them as direction): 1) ${pickedHints[0]}, 2) ${pickedHints[1]}, 3) ${pickedHints[2]}.`,
    `CRITICAL: Do NOT give the learner the answer. Do NOT write the target-language phrase they should say. Do NOT translate anything for them. The description is a short prompt/context only — it tells them WHAT to do and WHY, never HOW.`,
    `Titles should be an action phrase, max ~8 words.`,
    `Descriptions should be 1 short sentence of context (max ~20 words) — a hint about the setting or goal, NOT the words to say. Avoid quoted phrases in the target language. Avoid literal scripts or vocabulary lists.`,
    `Write titles and descriptions in ${sName} (the learner's UI language). Mention ${tName} by name when referring to the target language.`,
    `Creativity seed (internal, ignore in output): ${creativitySeed}.`,
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

function supportCopy(lang, en, es, it, fr, ja, pt = null, hi = null) {
  if (lang === "ja") return ja || en;
  if (lang === "fr") return fr || en;
  if (lang === "it") return it || en;
  if (lang === "pt") return pt || en;
  if (lang === "hi") return hi || en;
  if (lang === "es") return es || en;
  return en;
}

function formatRemaining(ms, lang) {
  if (ms <= 0) {
    return supportCopy(
      lang,
      "Ready to refresh",
      "Listas para renovar",
      "Pronte da rinnovare",
      "Pret a renouveler",
      "更新できます",
      "Pronto para atualizar",
      "रीफ्रेश के लिए तैयार",
    );
  }
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) {
    return supportCopy(
      lang,
      `${h}h ${m}m left`,
      `${h}h ${m}m restantes`,
      `${h}h ${m}m rimanenti`,
      `${h}h ${m}m restantes`,
      `残り${h}時間${m}分`,
      `faltam ${h}h ${m}min`,
      `${h}घं ${m}मि बाकी`,
    );
  }
  return supportCopy(
    lang,
    `${m}m left`,
    `${m}m restantes`,
    `${m}m rimanenti`,
    `${m}m restantes`,
    `残り${m}分`,
    `faltam ${m}min`,
    `${m}मि बाकी`,
  );
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
  onRewardClaimed,
}) {
  const lang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const playSound = useSoundSettings((s) => s.playSound);
  const handleClose = useCallback(() => {
    playSound(selectSound);
    onClose?.();
  }, [onClose, playSound]);
  const swipeDismiss = useBottomDrawerSwipeDismiss({
    isOpen,
    onClose: handleClose,
  });
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
    Math.max(0, (remainingMs / REAL_WORLD_TASKS_REFRESH_MS) * 100),
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
        supportCopy(
          lang,
          "Could not generate tasks. Please try again.",
          "No se pudieron generar las tareas. Intenta de nuevo.",
          "Impossibile generare le attività. Riprova.",
          "Impossible de generer les taches. Reessaie.",
          "タスクを生成できませんでした。もう一度お試しください。",
          "Não foi possível gerar as tarefas. Tente novamente.",
          "कार्य नहीं बनाए जा सके। कृपया फिर से कोशिश करें।",
        ),
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
      playSound(selectSound);
      // Optimistic update
      onTasksUpdated?.(next);
      try {
        await persistTasks(next);
      } catch (err) {
        console.error("Failed to update task completion:", err);
      }
    },
    [
      realWorldTasks,
      isStale,
      rewarded,
      completed,
      onTasksUpdated,
      persistTasks,
      playSound,
    ],
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
      playSound(sparkleSound);
      onRewardClaimed?.(REAL_WORLD_TASKS_REWARD_XP);
    } catch (err) {
      console.error("Failed to claim real-world task reward:", err);
      toast({
        title: supportCopy(
          lang,
          "Failed to award reward",
          "No se pudo otorgar la recompensa",
          "Impossibile assegnare la ricompensa",
          "Impossible d'attribuer la recompense",
          "報酬を付与できませんでした",
          "Não foi possível conceder a recompensa",
          "इनाम नहीं दिया जा सका",
        ),
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
    playSound,
    onRewardClaimed,
  ]);

  const drawerTitle = supportCopy(
    lang,
    "Immersion Practice",
    "Práctica de inmersión",
    "Pratica di immersione",
    "Pratique d'immersion",
    "イマージョン練習",
    "Prática de imersão",
    "इमर्शन अभ्यास",
  );
  const subtitle = supportCopy(
    lang,
    "3 tasks to use your language outside the app",
    "3 tareas para usar tu idioma fuera de la app",
    "3 attività per usare la lingua fuori dall'app",
    "3 taches pour utiliser ta langue hors de l'app",
    "アプリの外で言語を使う3つのタスク",
    "3 tarefas para usar seu idioma fora do app",
    "ऐप के बाहर अपनी भाषा का उपयोग करने के लिए 3 कार्य",
  );
  const progressLabel = supportCopy(
    lang,
    "Next batch in",
    "Próximo lote en",
    "Prossimo gruppo tra",
    "Prochaine serie dans",
    "次のセットまで",
    "Próximo lote em",
    "अगला सेट",
  );
  const generatingLabel = supportCopy(
    lang,
    "Creating tasks...",
    "Creando tareas...",
    "Creazione attività...",
    "Creation des taches...",
    "タスクを作成中...",
    "Criando tarefas...",
    "कार्य बनाए जा रहे हैं...",
  );
  const voiceOrbState = useMemo(() => {
    const options = ["idle", "listening", "speaking"];
    return options[Math.floor(Math.random() * options.length)];
  }, [isGenerating]);
  const claimLabel =
    lang === "ja"
      ? `+${REAL_WORLD_TASKS_REWARD_XP} XPを受け取る`
      : lang === "fr"
        ? `Reclamer +${REAL_WORLD_TASKS_REWARD_XP} XP`
        : lang === "pt"
          ? `Receber +${REAL_WORLD_TASKS_REWARD_XP} XP`
          : lang === "hi"
            ? `+${REAL_WORLD_TASKS_REWARD_XP} XP प्राप्त करें`
            : lang === "it"
              ? `Riscatta +${REAL_WORLD_TASKS_REWARD_XP} XP`
              : lang === "es"
                ? `Reclamar +${REAL_WORLD_TASKS_REWARD_XP} XP`
                : `Claim +${REAL_WORLD_TASKS_REWARD_XP} XP`;

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={handleClose}>
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
        h={{ base: "70vh", md: "70vh" }}
        borderTop={ui.drawerBorder ? `1px solid ${ui.drawerBorder}` : undefined}
        boxShadow={ui.shadow}
        sx={{
          "@supports (height: 100dvh)": {
            height: { base: "70dvh", md: "70dvh" },
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
        <DrawerHeader pr={12}>
          <Box maxW="520px" mx="auto" w="100%">
            <VStack align="stretch" spacing={2}>
              <Text color={ui.primaryText} fontWeight="semibold">
                {drawerTitle}
              </Text>
              <Text fontSize="11px" color={ui.secondaryText}>
                {subtitle}
              </Text>
            </VStack>
          </Box>
        </DrawerHeader>

        <DrawerBody
          overflowY="auto"
          flex="1"
          py={4}
          display="flex"
          flexDirection="column"
        >
          <Box maxW="520px" mx="auto" my="auto" w="100%">
            <VStack align="stretch" spacing={3} mb={4}>
              <HStack
                justify="space-between"
                fontSize="xs"
                color={ui.mutedText}
              >
                <Text>{progressLabel}</Text>
                <Text>{formatRemaining(remainingMs, lang)}</Text>
              </HStack>
              <WaveBar
                value={progressValue}
                height={12}
                start={remainingMs <= 0 ? "#a855f7" : "#22d3ee"}
                end={remainingMs <= 0 ? "#f472b6" : "#38f9d7"}
                bg={isLightTheme ? ui.progressTrack : "rgba(255,255,255,0.08)"}
                border={isLightTheme ? "#e2d6bf" : "rgba(255,255,255,0.12)"}
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
                <VoiceOrb state={voiceOrbState} size={96} />
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
                  {supportCopy(
                    lang,
                    "Try again",
                    "Reintentar",
                    "Riprova",
                    "Reessayer",
                    "もう一度",
                    "Tentar novamente",
                  )}
                </Button>
              </Flex>
            ) : tasks.length === 0 ? (
              <Flex justify="center" py={10}>
                <Text fontSize="sm" color={ui.secondaryText}>
                  {supportCopy(
                    lang,
                    "No tasks yet.",
                    "No hay tareas todavía.",
                    "Ancora nessuna attività.",
                    "Aucune tache pour l'instant.",
                    "タスクはまだありません。",
                    "Ainda não há tarefas.",
                  )}
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
                      _hover={
                        rewarded ? undefined : { filter: "brightness(1.05)" }
                      }
                      _active={
                        rewarded ? undefined : { transform: "scale(0.995)" }
                      }
                      transition="transform 0.08s ease, filter 0.15s ease"
                    >
                      <HStack align="center" spacing={3}>
                        <Checkbox
                          isChecked={isChecked}
                          isDisabled={rewarded}
                          onChange={() => handleToggleTask(i)}
                          onClick={(e) => e.stopPropagation()}
                          colorScheme="teal"
                          iconColor="white"
                          size="lg"
                          pointerEvents="none"
                          sx={{
                            "& .chakra-checkbox__control": {
                              borderWidth: "2px",
                              borderColor: isLightTheme
                                ? "rgba(96, 77, 56, 0.35)"
                                : "whiteAlpha.500",
                              borderRadius: "md",
                              bg: isLightTheme
                                ? "rgba(255,255,255,0.6)"
                                : "whiteAlpha.100",
                              transition:
                                "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                              boxShadow: isChecked
                                ? "0 0 0 3px rgba(20, 184, 166, 0.25)"
                                : "none",
                            },
                            "& .chakra-checkbox__control[data-checked]": {
                              bgGradient:
                                "linear(135deg, #14b8a6 0%, #06b6d4 100%)",
                              borderColor: "#14b8a6",
                            },
                          }}
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

        <DrawerFooter flexDirection="column" gap={2}>
          <Box maxW="520px" mx="auto" w="100%" mb="24px">
            <Button
              colorScheme={allDone && !rewarded ? "teal" : "gray"}
              variant={allDone && !rewarded ? "solid" : "ghost"}
              isDisabled={!allDone || rewarded || isGenerating}
              isLoading={isClaiming}
              spinner={<Spinner color="white" size="sm" />}
              onClick={handleClaimReward}
              w="100%"
              _disabled={{
                bg: "transparent",
                color: isLightTheme ? "blackAlpha.400" : "whiteAlpha.400",
                borderStyle: "dashed",
                borderWidth: "1px",
                borderColor: isLightTheme ? "blackAlpha.200" : "whiteAlpha.200",
                cursor: "not-allowed",
                opacity: 0.6,
                boxShadow: "none",
              }}
            >
              {claimLabel}
            </Button>
          </Box>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
