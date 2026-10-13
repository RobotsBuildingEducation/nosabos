// src/components/PlatePetPanel.jsx
//
// Standalone copy of the daily-goal pet panel for the Daily Plate home —
// kept independent of the modal's component file on purpose.
import React, { useEffect, useMemo, useRef, useState } from "react";
import DailyPlateActions from "./DailyPlateActions.jsx";
import {
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FiHeart,
  FiLock,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";
import { MdShowChart } from "react-icons/md";
import { TbDeviceGamepad3, TbEdit } from "react-icons/tb";
import {
  WaveBar,
  WAVE_BAR_PROGRESS_END,
  WAVE_BAR_PROGRESS_START,
} from "./WaveBar";
import { useThemeStore } from "../useThemeStore";
import { t as translate } from "../utils/translation";
import { APP_DAILY_QUEST_RADIUS, APP_SQUIRCLE_SHAPE } from "../theme";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages.js";
import {
  DAILY_GOAL_PET_DEFAULT_HEALTH,
  DAILY_GOAL_PET_HEALTH_GAIN,
  DAILY_GOAL_PET_HEALTH_LOSS,
  clampDailyGoalPetHealth,
} from "../utils/dailyGoalPet";
import {
  PET_TYPES,
  getEffectivePetType,
  getPetUnlockLevel,
  isPetTypeUnlocked,
  normalizePetType,
} from "../utils/petTypes";
import { getCustomizeModalCopy } from "./companionCustomizeCopy";
import CompanionQuestBubble from "./CompanionQuestBubble";
import { drawCompanionCharacter, T, getPetStage } from "./companionDrawing";
// eslint-disable-next-line react-refresh/only-export-components
export { drawCompanionCharacter, getHealthyCompanionStage } from "./companionDrawing";

const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const UNLOCKED_TEXT_LIGHT = "#0f766e";
const UNLOCKED_TEXT_DARK = "#5eead4";
const ACTIVE_UNLOCKED_TEXT_LIGHT = "#0d9488";
const ACTIVE_UNLOCKED_TEXT_DARK = "#99f6e4";
const COMPANION_LEVEL_LABELS = {
  ar: "المستوى",
  de: "Level",
  en: "Level",
  es: "Nivel",
  fr: "Niveau",
  hi: "स्तर",
  it: "Livello",
  ja: "レベル",
  pt: "Nível",
  zh: "等级",
};

const NAME_MAX_LENGTH = 24;

function getCopy(lang) {
  if (lang === "ar") {
    return {
      title: "صاحبك",
      subtitle: "حافظ على صحته لما تحقق هدف XP اليومي.",
      dailyXp: "XP اليومية",
      health: "الصحة",
      happy: "مبسوط",
      healthy: "صحي",
      unhappy: "زعلان",
      stressed: "متوتر",
      unhealthy: "تعبان",
      dead: "غير نشط",
      reward: "الهدف اتحقق",
      penalty: "الهدف فاتك",
      rewardFooter: "الصحة بتعلى لحد {health}%",
      penaltyFooter: "الصحة بتنزل لحد {health}%",
      latestAchieved: "آخر تحديث: +{delta}% بعد تحقيق الهدف",
      latestMissed: "آخر تحديث: {delta}% بعد فوات الهدف",
      managementHint: "حقق هدف النهارده علشان يفضل قوي.",
      celebrationHint: "صحة صاحبك زادت النهارده.",
      rewardBadge: "مكافأة +{delta}%",
      penaltyBadge: "خطر -{delta}%",
      previewHint:
        "دي مجرد معاينة ومش هتغير الصحة الحقيقية لصاحبك.",
    };
  }

  if (lang === "hi") {
    return {
      title: "आपका साथी",
      subtitle: "अपना रोज़ का XP लक्ष्य पूरा करके इसकी सेहत अच्छी रखें।",
      dailyXp: "दैनिक XP",
      health: "सेहत",
      happy: "खुश",
      healthy: "स्वस्थ",
      unhappy: "उदास",
      stressed: "तनावग्रस्त",
      unhealthy: "अस्वस्थ",
      dead: "निष्क्रिय",
      reward: "लक्ष्य पूरा",
      penalty: "लक्ष्य छूटा",
      rewardFooter: "सेहत {health}% तक बढ़ती है",
      penaltyFooter: "सेहत {health}% तक घटती है",
      latestAchieved: "नवीनतम अपडेट: लक्ष्य पूरा करने पर +{delta}%",
      latestMissed: "नवीनतम अपडेट: लक्ष्य चूकने पर {delta}%",
      managementHint: "इसे मजबूत रखने के लिए आज का लक्ष्य पूरा करें।",
      celebrationHint: "आज आपके साथी की सेहत बढ़ी है।",
      rewardBadge: "इनाम +{delta}%",
      penaltyBadge: "जोखिम -{delta}%",
      previewHint:
        "यह केवल पूर्वावलोकन है। इससे आपके साथी की असली सेहत नहीं बदलती।",
    };
  }

  if (lang === "zh") {
    return {
      title: "你的伙伴",
      subtitle: "完成每日 XP 目标，照顾它的健康。",
      dailyXp: "每日 XP",
      health: "健康",
      happy: "开心",
      healthy: "健康",
      unhappy: "难过",
      stressed: "紧张",
      unhealthy: "不舒服",
      dead: "未激活",
      reward: "目标已完成",
      penalty: "目标未完成",
      rewardFooter: "健康值提升到 {health}%",
      penaltyFooter: "健康值下降到 {health}%",
      latestAchieved: "最新更新：完成目标获得 +{delta}%",
      latestMissed: "最新更新：未完成目标 {delta}%",
      managementHint: "完成今天的目标，让它保持强壮。",
      celebrationHint: "你的伙伴获得了健康提升。",
      rewardBadge: "奖励 +{delta}%",
      penaltyBadge: "风险 -{delta}%",
      previewHint: "这只是预览，不会改变真实健康值。",
    };
  }

  if (lang === "ja") {
    return {
      title: "あなたの相棒",
      subtitle: "毎日のXP目標を達成して元気を保ちましょう。",
      dailyXp: "今日のXP",
      health: "健康",
      happy: "ごきげん",
      healthy: "元気",
      unhappy: "悲しい",
      stressed: "ストレス",
      unhealthy: "弱っています",
      dead: "力尽きた",
      reward: "目標達成",
      penalty: "目標未達",
      rewardFooter: "健康度が{health}%に上がります",
      penaltyFooter: "健康度が{health}%に下がります",
      latestAchieved: "最新更新: 目標達成で+{delta}%",
      latestMissed: "最新更新: 目標未達で{delta}%",
      managementHint: "今日の目標を達成して元気を保ちましょう。",
      celebrationHint: "相棒の健康度が上がりました。",
      rewardBadge: "報酬 +{delta}%",
      penaltyBadge: "リスク -{delta}%",
      previewHint:
        "プレビューのみです。実際の健康度は変わりません。",
    };
  }

  if (lang === "fr") {
    return {
      title: "Ton compagnon",
      subtitle: "Garde sa sante elevee en atteignant ton objectif XP quotidien.",
      dailyXp: "XP du jour",
      health: "Sante",
      happy: "Heureux",
      healthy: "En forme",
      unhappy: "Triste",
      stressed: "Stresse",
      unhealthy: "Fragile",
      dead: "Epuise",
      reward: "Objectif atteint",
      penalty: "Objectif manque",
      rewardFooter: "La sante monte a {health}%",
      penaltyFooter: "La sante descend a {health}%",
      latestAchieved: "Derniere mise a jour : +{delta}% pour l'objectif atteint",
      latestMissed: "Derniere mise a jour : {delta}% pour l'objectif manque",
      managementHint: "Atteins l'objectif aujourd'hui pour le garder fort.",
      celebrationHint: "Ton compagnon a recu un bonus de sante.",
      rewardBadge: "Recompense +{delta}%",
      penaltyBadge: "Risque -{delta}%",
      previewHint:
        "Apercu seulement. Cela ne change pas sa vraie sante.",
    };
  }

  if (lang === "it") {
    return {
      title: "Il tuo compagno",
      subtitle: "Mantieni alta la sua salute raggiungendo il tuo obiettivo XP giornaliero.",
      dailyXp: "XP giornaliera",
      health: "Salute",
      happy: "Felice",
      healthy: "In salute",
      unhappy: "Triste",
      stressed: "Stressato",
      unhealthy: "Malaticcio",
      dead: "Morto",
      reward: "Obiettivo raggiunto",
      penalty: "Obiettivo mancato",
      rewardFooter: "La salute sale a {health}%",
      penaltyFooter: "La salute scende a {health}%",
      latestAchieved: "Ultimo aggiornamento: +{delta}% per aver raggiunto l'obiettivo",
      latestMissed: "Ultimo aggiornamento: {delta}% per aver mancato l'obiettivo",
      managementHint: "Raggiungi l'obiettivo oggi per mantenerlo forte.",
      celebrationHint: "Il tuo compagno ha ricevuto un aumento di salute.",
      rewardBadge: "Ricompensa +{delta}%",
      penaltyBadge: "Rischio -{delta}%",
      previewHint:
        "Solo anteprima. Non cambia la salute reale del compagno.",
    };
  }

  if (lang === "de") {
    return {
      title: "Dein Begleiter",
      subtitle: "Halte ihn gesund, indem du dein tägliches XP-Ziel erreichst.",
      dailyXp: "Tägliche XP",
      health: "Gesundheit",
      happy: "Glücklich",
      healthy: "Gesund",
      unhappy: "Traurig",
      stressed: "Gestresst",
      unhealthy: "Kränklich",
      dead: "Inaktiv",
      reward: "Ziel erreicht",
      penalty: "Ziel verfehlt",
      rewardFooter: "Die Gesundheit steigt auf {health}%",
      penaltyFooter: "Die Gesundheit sinkt auf {health}%",
      latestAchieved: "Letzte Aktualisierung: +{delta}% für dein erreichtes Ziel",
      latestMissed: "Letzte Aktualisierung: {delta}% für dein verfehltes Ziel",
      managementHint: "Erreiche heute dein Ziel, damit er stark bleibt.",
      celebrationHint: "Dein Begleiter hat einen Gesundheitsschub bekommen.",
      rewardBadge: "Belohnung +{delta}%",
      penaltyBadge: "Risiko -{delta}%",
      previewHint:
        "Nur Vorschau. Das ändert die echte Gesundheit deines Begleiters nicht.",
    };
  }

  if (lang === "pt") {
    return {
      title: "Seu companheiro",
      subtitle: "Cuide da saude dele alcancando sua meta diaria de XP.",
      dailyXp: "XP diária",
      health: "Saude",
      happy: "Feliz",
      healthy: "Saudavel",
      unhappy: "Triste",
      stressed: "Estressado",
      unhealthy: "Doentinho",
      dead: "Morto",
      reward: "Meta concluida",
      penalty: "Meta nao concluida",
      rewardFooter: "A saude sobe para {health}%",
      penaltyFooter: "A saude cai para {health}%",
      latestAchieved: "Ultima atualizacao: +{delta}% por cumprir sua meta",
      latestMissed: "Ultima atualizacao: {delta}% por nao cumprir sua meta",
      managementHint: "Cumpra a meta de hoje para mante-lo forte.",
      celebrationHint: "Seu companheiro recebeu um aumento de saude.",
      rewardBadge: "Recompensa +{delta}%",
      penaltyBadge: "Risco -{delta}%",
      previewHint:
        "Isto e apenas uma visualizacao. Nao muda a saude real do seu companheiro.",
    };
  }

  if (lang === "es") {
    return {
      title: "Tu compañero",
      subtitle: "Cuida su salud cumpliendo tu meta diaria de XP.",
      dailyXp: "XP diaria",
      health: "Salud",
      happy: "Feliz",
      healthy: "Saludable",
      unhappy: "Triste",
      stressed: "Estresado",
      unhealthy: "Enfermito",
      dead: "Muerto",
      reward: "Meta lograda",
      penalty: "Meta fallida",
      rewardFooter: "La salud sube a {health}%",
      penaltyFooter: "La salud baja a {health}%",
      latestAchieved: "Última actualización: +{delta}% por cumplir tu meta",
      latestMissed: "Última actualización: {delta}% por fallar tu meta",
      managementHint: "Cumple hoy para mantenerlo fuerte.",
      celebrationHint: "Tu compañero recibió un boost de salud.",
      rewardBadge: "Recompensa +{delta}%",
      penaltyBadge: "Riesgo -{delta}%",
      previewHint:
        "Vista previa solamente. No cambia la salud real de tu compañero.",
    };
  }

  return {
    title: "Your companion",
    subtitle: "Stay healthy by hitting your daily XP goal.",
    dailyXp: "Daily XP",
    health: "Health",
    happy: "Happy",
    healthy: "Healthy",
    unhappy: "Unhappy",
    stressed: "Stressed",
    unhealthy: "Unhealthy",
    dead: "Dead",
    reward: "Goal success",
    penalty: "Goal failed",
    rewardFooter: "Health rises to {health}%",
    penaltyFooter: "Health drops to {health}%",
    latestAchieved: "Latest update: +{delta}% for hitting your goal",
    latestMissed: "Latest update: {delta}% for missing your goal",
    managementHint: "Hit today's goal to keep it strong.",
    celebrationHint: "Your companion got a health boost today.",
    rewardBadge: "Reward +{delta}%",
    penaltyBadge: "Risk -{delta}%",
    previewHint: "Preview only. This does not change your companion's real health.",
  };
}

function getCompanionLevelLabel(lang) {
  return COMPANION_LEVEL_LABELS[lang] || COMPANION_LEVEL_LABELS.en;
}

// Per-pet manga-bubble nudge (px). Each procedural pet sits at a slightly
// different head height on the 48px canvas, so the balloon's tail needs a small
// vertical (and, for the alien, horizontal) tweak to land on the head. Positive
// y = down, negative x = left. Dog is the baseline (0,0).
const BUBBLE_OFFSET = {
  dog: { x: 0, y: 0 },
  alien: { x: -4, y: 4 },
  robot: { x: 0, y: 10 },
  slime: { x: 0, y: 10 },
  ghost: { x: 0, y: 10 },
  axolotl: { x: 0, y: 10 },
};

// On mobile, the non-dog pets need a small extra down-left nudge so the tail
// sits on the head. The dog is the baseline (already well-placed) and is exempt.
const BUBBLE_OFFSET_MOBILE = { x: -6, y: 6 };
// The pet canvas is larger on desktop (md+), so the balloon sits too high there.
// Add this extra downward nudge on top of each non-dog pet's base offset; the
// dog is already correct on desktop, so it's exempt too.
const BUBBLE_OFFSET_DESKTOP_Y = 16;

function CompanionCanvas({
  stage,
  petType = "ghost",
  isLightTheme,
  isCelebration = false,
}) {
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(0);
  const resolvedPetType = normalizePetType(petType);
  const canvasBackground = isCelebration
    ? isLightTheme
      ? "rgba(255, 253, 249, 0.52)"
      : "rgba(255, 255, 255, 0.22)"
    : stage.background;

  useEffect(() => {
    if (stage.key === "dead") {
      setFrame(0);
      return undefined;
    }
    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % 12);
    }, 180);
    return () => window.clearInterval(interval);
  }, [stage.key]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = T;
    canvas.height = T;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, T, T);

    drawCompanionCharacter(ctx, frame, stage, resolvedPetType);
  }, [frame, resolvedPetType, stage]);

  return (
    <Box
      as="canvas"
      ref={canvasRef}
      role="img"
      aria-label={`${stage.label} ${resolvedPetType} companion`}
      w={{ base: "96px", md: "144px" }}
      h={{ base: "96px", md: "144px" }}
      borderRadius={{ base: "20px", md: APP_DAILY_QUEST_RADIUS }}
      style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
      border="1px solid"
      borderColor={
        isCelebration
          ? "rgba(255, 255, 255, 0.38)"
          : isLightTheme
            ? "rgba(91, 75, 58, 0.12)"
            : "whiteAlpha.300"
      }
      bg={canvasBackground}
      sx={{ imageRendering: "pixelated" }}
    />
  );
}

function CompanionOptionCanvas({ stage, petType = "ghost" }) {
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(0);
  const resolvedPetType = normalizePetType(petType);

  useEffect(() => {
    if (stage.key === "dead") {
      setFrame(0);
      return undefined;
    }
    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % 12);
    }, 180);
    return () => window.clearInterval(interval);
  }, [stage.key]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = T;
    canvas.height = T;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, T, T);
    drawCompanionCharacter(ctx, frame, stage, resolvedPetType);
  }, [frame, resolvedPetType, stage]);

  return (
    <Box
      as="canvas"
      ref={canvasRef}
      aria-hidden="true"
      w={{ base: "68px", md: "76px" }}
      h={{ base: "68px", md: "76px" }}
      flexShrink={0}
      sx={{ imageRendering: "pixelated" }}
    />
  );
}

export default function PlatePetPanel({
  lang = "en",
  health = DAILY_GOAL_PET_DEFAULT_HEALTH,
  variant = "setup",
  showPreview = true,
  fillHeight = false,
  // Today's XP, shown under the health bar when provided
  dailyXp = null,
  dailyGoalXp = 0,
  // Total XP for the active language, shown with the account level.
  totalXp = 0,
  // Custom companion name; falls back to the localized default when empty.
  petName = "",
  petType = "ghost",
  companionLevel = 1,
  // When provided, a pencil button next to the title opens the customize modal.
  onCustomizePet = null,
  // Optional manga speech balloon { text } — rendered at the pet's top-right.
  questBubble = null,
  onViewActivity = null,
  onViewAchievements = null,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const resolvedLang = normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE);
  const copy = useMemo(() => getCopy(resolvedLang), [resolvedLang]);
  const safeHealth = clampDailyGoalPetHealth(health);
  const stage = useMemo(
    () => getPetStage(safeHealth, copy, isLightTheme),
    [copy, isLightTheme, safeHealth],
  );
  const isCelebration = variant === "celebration";

  const trimmedName = typeof petName === "string" ? petName.trim() : "";
  const safeCompanionLevel = Math.max(
    1,
    Math.floor(Number(companionLevel) || 1),
  );
  const safeTotalXp = Math.max(0, Math.round(Number(totalXp) || 0));
  const resolvedPetType = getEffectivePetType(petType, safeCompanionLevel);
  const displayTitle = trimmedName || copy.title;
  const companionLevelText = `${getCompanionLevelLabel(
    resolvedLang,
  )} ${safeCompanionLevel}`;
  const canCustomize = typeof onCustomizePet === "function" && !isCelebration;
  // While the manga bubble is up it overlaps the edit button; disable the button
  // and drop it under the bubble, then restore once the bubble is dismissed.
  const bubbleActive = !isCelebration && !!questBubble?.text;
  const bubbleOff = BUBBLE_OFFSET[resolvedPetType] || BUBBLE_OFFSET.dog;
  // The dog is the baseline pet and is already well-placed in both views, so it
  // gets no extra mobile/desktop nudge; every other pet does.
  const bubbleIsDog = resolvedPetType === "dog";
  const bubbleMobileX = bubbleIsDog ? 0 : BUBBLE_OFFSET_MOBILE.x;
  const bubbleMobileY = bubbleIsDog ? 0 : BUBBLE_OFFSET_MOBILE.y;
  const bubbleDesktopY = bubbleIsDog ? 0 : BUBBLE_OFFSET_DESKTOP_Y;
  const customizeModalCopy = getCustomizeModalCopy(resolvedLang);
  const customizeModal = useDisclosure();
  const [draftName, setDraftName] = useState(trimmedName);
  const [draftPetType, setDraftPetType] = useState(resolvedPetType);

  const openCustomizeModal = () => {
    setDraftName(trimmedName);
    setDraftPetType(resolvedPetType);
    customizeModal.onOpen();
  };

  const submitCustomize = () => {
    const name = draftName.trim().slice(0, NAME_MAX_LENGTH);
    const type = getEffectivePetType(draftPetType, safeCompanionLevel);

    if (typeof onCustomizePet === "function") {
      onCustomizePet({ name, petType: type });
    }
    customizeModal.onClose();
  };
  const rewardColor = isLightTheme ? "#48765f" : "green.200";
  const penaltyColor = isLightTheme ? "#a06a3b" : "orange.200";
  const previewCardBg = isLightTheme ? APP_SURFACE_ELEVATED : "blackAlpha.220";
  const panelBg = isCelebration
    ? isLightTheme
      ? stage.background
      : "rgba(255, 255, 255, 0.18)"
    : stage.background;
  const panelBorderColor = isCelebration
    ? "rgba(255, 255, 255, 0.38)"
    : isLightTheme
      ? APP_BORDER
      : "transparent";

  return (
    <>
    <Box
      bg={panelBg}
      border="1px solid"
      borderColor={panelBorderColor}
      borderRadius={APP_DAILY_QUEST_RADIUS}
      style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
      p={{ base: isCelebration ? 2.5 : 3, md: isCelebration ? 4 : 5 }}
      w="100%"
      h={fillHeight ? "100%" : undefined}
    >
      <VStack
        h={fillHeight ? "100%" : undefined}
        spacing={{ base: 3, md: 4 }}
        align="stretch"
      >
        <HStack
          align="flex-start"
          justify="space-between"
          spacing={{ base: 3, md: 4 }}
          flexDirection="row"
        >
          <VStack align="stretch" spacing={{ base: 1.5, md: 2 }} flexShrink={0}>
            <Box position="relative" w="fit-content" alignSelf="center">
              <CompanionCanvas
                stage={stage}
                petType={resolvedPetType}
                isLightTheme={isLightTheme}
                isCelebration={isCelebration}
              />
              {/* Manga balloon at the pet's top-right — overlaps surrounding
                  content (zIndex) with its tail aimed back into the pet. */}
              {!isCelebration && questBubble?.text ? (
                <Box
                  position="absolute"
                  bottom="106%"
                  left="54%"
                  transform={{
                    base: `translateX(-20%) translate(${
                      bubbleOff.x + bubbleMobileX
                    }px, ${bubbleOff.y + bubbleMobileY}px)`,
                    md: `translateX(-20%) translate(${bubbleOff.x}px, ${
                      bubbleOff.y + bubbleDesktopY
                    }px)`,
                  }}
                  zIndex={30}
                  pointerEvents="auto"
                  w="max-content"
                >
                  <CompanionQuestBubble
                    text={questBubble.text}
                    fontSize={questBubble.fontSize}
                    onDismiss={questBubble.onDismiss}
                  />
                </Box>
              ) : null}
            </Box>
            <Badge
              colorScheme={stage.colorScheme}
              bg={isLightTheme ? stage.badgeBg : undefined}
              color={isLightTheme ? stage.badgeColor : undefined}
              alignSelf="center"
              px={{ base: 2, md: 3 }}
              py={{ base: 0.35, md: 1 }}
              borderRadius="md"
              fontSize={{ base: "0.62rem", md: "0.78rem" }}
            >
              {stage.label}
            </Badge>
          </VStack>

          <VStack
            align="stretch"
            spacing={{ base: 2, md: 3 }}
            flex="1"
            minW={0}
          >
            <VStack align="stretch" spacing={{ base: 0.5, md: 1 }}>
              <HStack
                spacing={{ base: 1, md: 1.5 }}
                align="center"
                flexWrap="wrap"
                rowGap={1}
              >
                {canCustomize ? (
                  <IconButton
                    aria-label={customizeModalCopy.edit}
                    icon={<Box as={TbEdit} boxSize={{ base: 3.5, md: 5 }} position="relative" top={{ base: "-0.5px", md: "0.25px" }} />}
                    size="sm"
                    variant="ghost"
                    w={{ base: 5, md: 8 }}
                    h={{ base: 5, md: 8 }}
                    minW={{ base: 5, md: 8 }}
                    p={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    position="relative"
                    zIndex={bubbleActive ? 1 : 35}
                    isDisabled={bubbleActive}
                    alignSelf="center"
                    flexShrink={0}
                    bg="transparent"
                    color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
                    _hover={{
                      bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.200",
                    }}
                    onClick={openCustomizeModal}
                  />
                ) : null}
                <Text
                  fontSize={{ base: "sm", sm: "md", md: "lg" }}
                  fontWeight="bold"
                  lineHeight="1.2"
                  color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                  noOfLines={2}
                  wordBreak="break-word"
                >
                  {displayTitle}
                </Text>
                {!isCelebration ? (
                  <HStack
                    spacing={{ base: 1, md: 1.5 }}
                    flexShrink={0}
                    whiteSpace="nowrap"
                    align="center"
                    // The title uses noOfLines (display:-webkit-box) which sits a
                    // hair higher than this row at the larger desktop size; a tiny
                    // desktop-only nudge lines the level up with the name. Mobile
                    // is already perfectly aligned, so it stays at 0.
                    position="relative"
                    top={{ base: "0px", md: "0.5px" }}
                  >
                    <Text
                      fontSize={{ base: "sm", sm: "md", md: "lg" }}
                      color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
                      fontWeight="semibold"
                      lineHeight="1.1"
                    >
                      |
                    </Text>
                    <Text
                      fontSize={{ base: "sm", sm: "md", md: "lg" }}
                      fontWeight="bold"
                      color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
                      lineHeight="1.1"
                    >
                      {companionLevelText}
                    </Text>
                  </HStack>
                ) : null}
              </HStack>
              {!isCelebration ? (
                <Text
                  fontSize="10px"
                  color={isLightTheme ? APP_TEXT_SECONDARY : undefined}
                  opacity={isLightTheme ? 1 : 0.9}
                  lineHeight="1.35"
                >
                  {copy.subtitle}
                </Text>
              ) : null}
            </VStack>

            <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
              <VStack align="stretch" spacing={{ base: 1.5, md: 2 }}>
                <HStack justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Box
                      as={FiHeart}
                      color={isLightTheme ? "#ce7a8c" : "pink.200"}
                      boxSize={{ base: 3.5, md: 4 }}
                    />
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                    >
                      {copy.health}
                    </Text>
                  </HStack>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    lineHeight="1"
                    color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                  >
                    {safeHealth}%
                  </Text>
                </HStack>

                <Box w="100%">
                  <WaveBar
                    value={safeHealth}
                    height={14}
                    start="#60a5fa"
                    end="#38bdf8"
                    bg={
                      isLightTheme
                        ? "rgba(255, 255, 255, 0.58)"
                        : "rgba(255,255,255,0.22)"
                    }
                    border={
                      isLightTheme
                        ? "rgba(91, 75, 58, 0.10)"
                        : "rgba(255,255,255,0.14)"
                    }
                  />
                </Box>
              </VStack>

              {/* Today's XP — a second bar mirroring Health ("XP" is
                  universal, so no per-language copy needed) */}
              {dailyXp != null
                ? (() => {
                    const earned = Math.max(
                      0,
                      Math.round(Number(dailyXp) || 0),
                    );
                    const goal = Math.max(
                      0,
                      Math.round(Number(dailyGoalXp) || 0),
                    );
                    // Bar fill is clamped to 100%, but the readout shows the
                    // true percentage (can exceed 100%).
                    const rawPercent =
                      goal > 0 ? Math.round((earned / goal) * 100) : 0;
                    const pct = Math.min(100, rawPercent);
                    return (
                      <>
                        <VStack
                          align="stretch"
                          spacing={{ base: 1.5, md: 2 }}
                        >
                        <HStack justify="space-between" align="center">
                          <HStack spacing={2}>
                            <Box
                              as={MdShowChart}
                              color={isLightTheme ? "#b7791f" : "yellow.200"}
                              boxSize={{ base: 3.5, md: 4 }}
                            />
                            <Text
                              fontSize="xs"
                              fontWeight="semibold"
                              color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                            >
                              {copy.dailyXp || "Daily XP"}
                            </Text>
                          </HStack>
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            lineHeight="1"
                            color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                          >
                            {rawPercent}%
                          </Text>
                        </HStack>

                        <Box w="100%">
                          <WaveBar
                            value={pct}
                            height={14}
                            start="#fbbf24"
                            end="#f59e0b"
                            bg={
                              isLightTheme
                                ? "rgba(255, 255, 255, 0.58)"
                                : "rgba(255,255,255,0.22)"
                            }
                            border={
                              isLightTheme
                                ? "rgba(91, 75, 58, 0.10)"
                                : "rgba(255,255,255,0.14)"
                            }
                          />
                        </Box>

                        </VStack>

                        <VStack
                          align="stretch"
                          spacing={{ base: 1.5, md: 2 }}
                        >
                          <HStack justify="space-between" align="center">
                            <HStack spacing={2}>
                              <Box
                                as={TbDeviceGamepad3}
                                color={
                                  isLightTheme ? "#2563eb" : "blue.200"
                                }
                                boxSize={{ base: 4, md: 6 }}
                                flexShrink={0}
                              />
                              <Text
                                fontSize="xs"
                                fontWeight="semibold"
                                color={
                                  isLightTheme ? APP_TEXT_PRIMARY : undefined
                                }
                              >
                                {companionLevelText}
                              </Text>
                            </HStack>
                            <Text
                              fontSize="11px"
                              fontWeight="bold"
                              lineHeight="1"
                              color={
                                isLightTheme ? APP_TEXT_PRIMARY : undefined
                              }
                            >
                              XP {safeTotalXp}
                            </Text>
                          </HStack>

                          <Box w="100%">
                            <WaveBar
                              value={safeTotalXp % 100}
                              height={14}
                              start={WAVE_BAR_PROGRESS_START}
                              end={WAVE_BAR_PROGRESS_END}
                              bg={
                                isLightTheme
                                  ? "rgba(255, 255, 255, 0.58)"
                                  : "rgba(255,255,255,0.22)"
                              }
                              border={
                                isLightTheme
                                  ? "rgba(91, 75, 58, 0.10)"
                                  : "rgba(255,255,255,0.14)"
                              }
                            />
                          </Box>
                        </VStack>
                      </>
                    );
                  })()
                : null}
            </VStack>
          </VStack>
        </HStack>

        <DailyPlateActions primaryLabel={translate(resolvedLang, "daily_plate_view_activity") || "Activity"}
          onPrimary={onViewActivity} onAchievements={onViewAchievements}
          language={resolvedLang} isLightTheme={isLightTheme} />

        {showPreview ? (
          <HStack
            spacing={{ base: 2, md: 3 }}
            align="stretch"
            w="100%"
            maxW={{ base: "100%", md: "520px" }}
            alignSelf="center"
          >
            <Box
              flex="1"
              bg={previewCardBg}
              border="1px solid"
              borderColor={isLightTheme ? APP_BORDER : "transparent"}
              borderRadius={APP_DAILY_QUEST_RADIUS}
              style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
              p={{ base: 2.5, md: 3 }}
              textAlign="center"
            >
              <HStack
                spacing={{ base: 1.5, md: 2 }}
                mb={{ base: 1, md: 2 }}
                align="flex-start"
                justify="center"
              >
                <Box
                  as={FiTrendingUp}
                  color={rewardColor}
                  boxSize={{ base: 3.5, md: 4 }}
                  mt="1px"
                />
                <Text
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="semibold"
                  lineHeight="1.2"
                  color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                >
                  {copy.reward}
                </Text>
              </HStack>
              <Text
                fontSize={{ base: "2xl", md: "lg" }}
                fontWeight="bold"
                color={rewardColor}
                lineHeight="1"
              >
                +{DAILY_GOAL_PET_HEALTH_GAIN}%
              </Text>
            </Box>

            <Box
              flex="1"
              bg={previewCardBg}
              border="1px solid"
              borderColor={isLightTheme ? APP_BORDER : "transparent"}
              borderRadius={APP_DAILY_QUEST_RADIUS}
              style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
              p={{ base: 2.5, md: 3 }}
              textAlign="center"
            >
              <HStack
                spacing={{ base: 1.5, md: 2 }}
                mb={{ base: 1, md: 2 }}
                align="flex-start"
                justify="center"
              >
                <Box
                  as={FiTrendingDown}
                  color={penaltyColor}
                  boxSize={{ base: 3.5, md: 4 }}
                  mt="1px"
                />
                <Text
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="semibold"
                  lineHeight="1.2"
                  color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                >
                  {copy.penalty}
                </Text>
              </HStack>
              <Text
                fontSize={{ base: "2xl", md: "lg" }}
                fontWeight="bold"
                color={penaltyColor}
                lineHeight="1"
              >
                -{DAILY_GOAL_PET_HEALTH_LOSS}%
              </Text>
            </Box>
          </HStack>
        ) : null}
      </VStack>
    </Box>

    {canCustomize ? (
      <Modal
        isOpen={customizeModal.isOpen}
        onClose={customizeModal.onClose}
        isCentered
        size="sm"
        autoFocus={false}
        motionPreset="scale"
      >
        <ModalOverlay bg="var(--app-overlay)" />
        <ModalContent
          bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.900"}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          border="1px solid"
          borderColor={isLightTheme ? APP_BORDER : "gray.700"}
          rounded="2xl"
          mx={4}
          sx={{
            "&& > .chakra-modal__header": {
              paddingBottom: "8px !important",
            },
            "&& > .chakra-modal__body:first-of-type": {
              paddingTop: "8px !important",
            },
          }}
        >
          <ModalHeader
            fontSize="md"
            fontWeight="bold"
            pb={{ base: 0, md: 2 }}
          >
            {customizeModalCopy.edit}
          </ModalHeader>
          <ModalBody pt={0}>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                  mb={1.5}
                >
                  {customizeModalCopy.name}
                </Text>
                <Input
                  value={draftName}
                  onChange={(e) =>
                    setDraftName(e.target.value.slice(0, NAME_MAX_LENGTH))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitCustomize();
                    }
                  }}
                  maxLength={NAME_MAX_LENGTH}
                  placeholder={copy.title}
                  bg={isLightTheme ? APP_SURFACE_ELEVATED : "gray.800"}
                  color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                  borderColor={isLightTheme ? APP_BORDER_STRONG : undefined}
                  rounded="md"
                />
              </Box>

              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                  mb={1.5}
                >
                  {customizeModalCopy.companion}
                </Text>
                <SimpleGrid columns={2} spacing={2}>
                  {PET_TYPES.map((type) => {
                    const active = draftPetType === type;
                    const unlockLevel = getPetUnlockLevel(type);
                    const unlocked = isPetTypeUnlocked(
                      type,
                      safeCompanionLevel,
                    );
                    const levelLabel =
                      unlockLevel <= 1
                        ? customizeModalCopy.starter
                        : customizeModalCopy.unlockLevel.replace(
                            "{level}",
                            String(unlockLevel),
                          );
                    const ariaLabel = unlocked
                      ? `${customizeModalCopy[type]}, ${levelLabel}`
                      : `${customizeModalCopy[type]}, ${customizeModalCopy.locked}, ${levelLabel}`;
                    return (
                      <Button
                        key={type}
                        w="100%"
                        h={{ base: "116px", md: "128px" }}
                        minW={0}
                        px={2}
                        py={2}
                        variant="ghost"
                        aria-pressed={active}
                        aria-label={ariaLabel}
                        isDisabled={!unlocked}
                        border="2px solid"
                        borderColor={
                          active
                            ? isLightTheme
                              ? "#3f9f9b"
                              : "#5eead4"
                            : "transparent"
                        }
                        borderRadius="xl"
                        bg={
                          active
                            ? isLightTheme
                              ? "rgba(63, 159, 155, 0.12)"
                              : "whiteAlpha.100"
                            : "transparent"
                        }
                        _hover={{
                          bg: active
                            ? isLightTheme
                              ? "rgba(63, 159, 155, 0.18)"
                              : "whiteAlpha.200"
                            : isLightTheme
                              ? APP_SURFACE_MUTED
                              : "whiteAlpha.100",
                        }}
                        _active={{ bg: undefined }}
                        _disabled={{
                          opacity: isLightTheme ? 0.62 : 0.48,
                          cursor: "not-allowed",
                        }}
                        onClick={() => setDraftPetType(type)}
                      >
                        <VStack spacing={1.5} justify="center">
                          <CompanionOptionCanvas stage={stage} petType={type} />
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            lineHeight="1"
                            color={
                              active
                                ? isLightTheme
                                  ? ACTIVE_UNLOCKED_TEXT_LIGHT
                                  : ACTIVE_UNLOCKED_TEXT_DARK
                                : unlocked
                                  ? isLightTheme
                                    ? UNLOCKED_TEXT_LIGHT
                                    : UNLOCKED_TEXT_DARK
                                  : isLightTheme
                                    ? APP_TEXT_SECONDARY
                                    : "gray.300"
                            }
                          >
                            {customizeModalCopy[type]}
                          </Text>
                          <HStack
                            spacing={1}
                            minH="14px"
                            color={
                              unlocked
                                ? active
                                  ? isLightTheme
                                    ? ACTIVE_UNLOCKED_TEXT_LIGHT
                                    : ACTIVE_UNLOCKED_TEXT_DARK
                                  : isLightTheme
                                    ? UNLOCKED_TEXT_LIGHT
                                    : UNLOCKED_TEXT_DARK
                                : isLightTheme
                                  ? "#8a6b32"
                                  : "yellow.200"
                            }
                          >
                            {!unlocked ? (
                              <Box as={FiLock} boxSize="10px" />
                            ) : null}
                            <Text
                              fontSize="10px"
                              fontWeight="bold"
                              lineHeight="1"
                            >
                              {levelLabel}
                            </Text>
                          </HStack>
                        </VStack>
                      </Button>
                    );
                  })}
                </SimpleGrid>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button
              variant="ghost"
              color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
              _hover={{
                bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
              }}
              onClick={customizeModal.onClose}
            >
              {customizeModalCopy.cancel}
            </Button>
            <Button
              colorScheme={isLightTheme ? undefined : "teal"}
              bg={isLightTheme ? "#3f9f9b" : undefined}
              color={isLightTheme ? "white" : undefined}
              _hover={isLightTheme ? { bg: "#398f8b" } : undefined}
              boxShadow="0px 4px 0px teal"
              onClick={submitCustomize}
            >
              {customizeModalCopy.save}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    ) : null}
    </>
  );
}
