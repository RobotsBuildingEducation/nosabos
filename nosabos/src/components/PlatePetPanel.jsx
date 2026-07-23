// src/components/PlatePetPanel.jsx
//
// Standalone copy of the daily-goal pet panel for the Daily Plate home —
// kept independent of the modal's component file on purpose.
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { TbEdit } from "react-icons/tb";
import {
  WaveBar,
  WAVE_BAR_PROGRESS_END,
  WAVE_BAR_PROGRESS_START,
} from "./WaveBar";
import { useThemeStore } from "../useThemeStore";
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

const TILE = 16;
const SCALE = 3;
const T = TILE * SCALE;
const SCENE_Y_OFFSET = 4;
// Soft ground shadow shared by the companions; width tracks altitude so hops
// and hovering read as real height on the 48px scene.
const COMPANION_SHADOW = "rgba(100, 116, 139, 0.32)";
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

const DOG = {
  fur: "#d97706",
  furDark: "#a85d04",
  furLight: "#e5952a",
  belly: "#fef3c7",
  ear: "#92400e",
  paw: "#78350f",
  accent: "#2563eb",
  nose: "#111827",
  tongue: "#fb7185",
  eyeWhite: "#ffffff",
  eyePupil: "#1f2937",
};

const SICK_DOG = {
  ...DOG,
  fur: "#b7791f",
  furDark: "#8a5b18",
  furLight: "#d69e2e",
  accent: "#94a3b8",
};

const DEAD_DOG = {
  ...DOG,
  fur: "#6b7280",
  furDark: "#4b5563",
  furLight: "#9ca3af",
  belly: "#d1d5db",
  ear: "#52525b",
  paw: "#374151",
  accent: "#94a3b8",
  tongue: "#cbd5e1",
  eyeWhite: "#e5e7eb",
};

const ALIEN = {
  body: "#9a7fd6",
  body2: "#7c5fc0",
  eye: "#2a1f45",
  eyeLight: "#f6f1ff",
  cheek: "#dca6d6",
  leg: "#5a3fa6",
};

const SICK_ALIEN = {
  ...ALIEN,
  body: "#9d96b0",
  body2: "#7f7793",
  leg: "#5e576e",
  cheek: "#b4adc4",
};

const DEAD_ALIEN = {
  ...ALIEN,
  body: "#8b8893",
  body2: "#6e6b76",
  eye: "#2a2832",
  leg: "#5a5763",
};

function px(ctx, fill, x, y, width, height) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
}

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

function getPetStage(health, copy, isLightTheme = false) {
  if (health <= 0) {
    return {
      key: "dead",
      motion: "dead",
      palette: DEAD_DOG,
      colorScheme: "gray",
      label: copy.dead,
      background: isLightTheme
        ? "linear-gradient(180deg, rgba(231, 223, 212, 0.96) 0%, rgba(222, 212, 198, 0.94) 100%)"
        : "rgba(148, 163, 184, 0.22)",
      waveStart: isLightTheme ? "#c2b4a0" : "#9CA3AF",
      waveEnd: isLightTheme ? "#9e8b76" : "#6B7280",
      badgeBg: isLightTheme ? "rgba(158, 139, 118, 0.14)" : undefined,
      badgeColor: isLightTheme ? "#6d5a47" : undefined,
      face: "dead",
      decoration: "halo",
      showTongue: false,
    };
  }
  if (health <= 24) {
    return {
      key: "unhealthy",
      motion: "unhealthy",
      palette: SICK_DOG,
      colorScheme: "red",
      label: copy.unhealthy,
      background: isLightTheme
        ? "linear-gradient(180deg, rgba(248, 223, 218, 0.96) 0%, rgba(243, 210, 204, 0.94) 100%)"
        : "rgba(248, 113, 113, 0.18)",
      waveStart: isLightTheme ? "#ef998f" : "#FB7185",
      waveEnd: isLightTheme ? "#d66f62" : "#DC2626",
      badgeBg: isLightTheme ? "rgba(214, 111, 98, 0.14)" : undefined,
      badgeColor: isLightTheme ? "#984d43" : undefined,
      face: "unhealthy",
      decoration: null,
      showTongue: false,
    };
  }
  if (health <= 49) {
    return {
      key: "stressed",
      motion: "stressed",
      palette: DOG,
      colorScheme: "orange",
      label: copy.stressed,
      background: isLightTheme
        ? "linear-gradient(180deg, rgba(250, 236, 214, 0.96) 0%, rgba(245, 224, 192, 0.94) 100%)"
        : "rgba(251, 146, 60, 0.18)",
      waveStart: isLightTheme ? "#efbb78" : "#FDBA74",
      waveEnd: isLightTheme ? "#d88f39" : "#F97316",
      badgeBg: isLightTheme ? "rgba(216, 143, 57, 0.14)" : undefined,
      badgeColor: isLightTheme ? "#91591f" : undefined,
      face: "stressed",
      decoration: "sweat",
      showTongue: false,
    };
  }
  if (health <= 74) {
    return {
      key: "unhappy",
      motion: "unhappy",
      palette: DOG,
      colorScheme: "yellow",
      label: copy.unhappy,
      background: isLightTheme
        ? "linear-gradient(180deg, rgba(250, 244, 214, 0.96) 0%, rgba(246, 236, 196, 0.94) 100%)"
        : "rgba(250, 204, 21, 0.16)",
      waveStart: isLightTheme ? "#e7cf7d" : "#FDE68A",
      waveEnd: isLightTheme ? "#c9a14d" : "#F59E0B",
      badgeBg: isLightTheme ? "rgba(201, 161, 77, 0.14)" : undefined,
      badgeColor: isLightTheme ? "#85672c" : undefined,
      face: "unhappy",
      decoration: "cloud",
      showTongue: false,
    };
  }
  if (health <= 99) {
    return {
      key: "healthy",
      motion: "healthy",
      palette: DOG,
      colorScheme: "teal",
      label: copy.healthy,
      background: isLightTheme
        ? "linear-gradient(180deg, rgba(220, 244, 232, 0.96) 0%, rgba(205, 236, 222, 0.94) 100%)"
        : "rgba(45, 212, 191, 0.20)",
      waveStart: isLightTheme ? "#81d1b3" : "#5EEAD4",
      waveEnd: isLightTheme ? "#50a587" : "#14B8A6",
      badgeBg: isLightTheme ? "rgba(80, 165, 135, 0.14)" : undefined,
      badgeColor: isLightTheme ? "#2f6a57" : undefined,
      face: "healthy",
      decoration: null,
      showTongue: false,
    };
  }
  return {
    key: "happy",
    motion: "happy",
    palette: DOG,
    colorScheme: "green",
    label: copy.happy,
    background: isLightTheme
      ? "linear-gradient(180deg, rgba(206, 242, 226, 0.98) 0%, rgba(190, 232, 214, 0.95) 100%)"
      : "rgba(29, 251, 192, 0.54)",
    waveStart: isLightTheme ? "#75d4af" : "#86EFAC",
    waveEnd: isLightTheme ? "#32a877" : "#22C55E",
    badgeBg: isLightTheme ? "rgba(50, 168, 119, 0.14)" : undefined,
    badgeColor: isLightTheme ? "#265f4a" : undefined,
    face: "happy",
    decoration: "heart",
    showTongue: false,
  };
}

function drawDecoration(ctx, decoration, frame, cx, headY) {
  if (decoration === "sparkles") {
    const pulse = frame % 6 < 3;
    px(ctx, "#fef08a", cx + 10, 5, 3, 3);
    px(ctx, "#fcd34d", cx + 9, 8, 5, 2);
    if (pulse) px(ctx, "#fef08a", cx + 18, 9, 2, 2);
  }

  if (decoration === "heart") {
    const pulse = frame % 6 < 3 ? 0 : 1;
    const hx = cx + 12 - pulse;
    const hy = 7 - pulse;

    if (pulse === 0) {
      px(ctx, "#f9a8d4", hx + 2, hy, 2, 1);
      px(ctx, "#f9a8d4", hx + 6, hy, 2, 1);
      px(ctx, "#f472b6", hx + 1, hy + 1, 8, 1);
      px(ctx, "#ec4899", hx, hy + 2, 10, 1);
      px(ctx, "#ec4899", hx + 1, hy + 3, 8, 1);
      px(ctx, "#db2777", hx + 2, hy + 4, 6, 1);
      px(ctx, "#db2777", hx + 3, hy + 5, 4, 1);
      px(ctx, "#be185d", hx + 4, hy + 6, 2, 1);
    } else {
      px(ctx, "#fbcfe8", hx + 2, hy, 2, 1);
      px(ctx, "#fbcfe8", hx + 7, hy, 2, 1);
      px(ctx, "#f472b6", hx + 1, hy + 1, 9, 1);
      px(ctx, "#ec4899", hx, hy + 2, 11, 1);
      px(ctx, "#ec4899", hx + 1, hy + 3, 9, 1);
      px(ctx, "#db2777", hx + 2, hy + 4, 7, 1);
      px(ctx, "#db2777", hx + 3, hy + 5, 5, 1);
      px(ctx, "#be185d", hx + 4, hy + 6, 3, 1);
      px(ctx, "#9d174d", hx + 5, hy + 7, 1, 1);
    }
  }

  if (decoration === "cloud") {
    const driftX = frame % 6 < 3 ? 0 : 1;
    const driftY = frame % 6 < 3 ? 0 : -1;
    px(ctx, "#cbd5e1", cx + 11 + driftX, 8 + driftY, 5, 3);
    px(ctx, "#e2e8f0", cx + 14 + driftX, 6 + driftY, 6, 4);
    px(ctx, "#cbd5e1", cx + 18 + driftX, 8 + driftY, 5, 3);
    if (frame % 3 !== 1) {
      px(ctx, "#7dd3fc", cx + 13 + driftX, 12 + driftY, 1, 3);
      px(ctx, "#38bdf8", cx + 14 + driftX, 14 + driftY, 1, 2);
    }
    if (frame % 3 !== 0) {
      px(ctx, "#7dd3fc", cx + 18 + driftX, 13 + driftY, 1, 3);
      px(ctx, "#38bdf8", cx + 19 + driftX, 15 + driftY, 1, 2);
    }
    if (frame % 6 >= 3) {
      px(ctx, "#93c5fd", cx + 22 + driftX, 12 + driftY, 1, 2);
      px(ctx, "#60a5fa", cx + 23 + driftX, 13 + driftY, 1, 2);
    }
  }

  if (decoration === "sweat") {
    const bounce = frame % 6 < 3 ? 0 : 1;
    px(ctx, "#7dd3fc", cx + 13, headY + 2 + bounce, 2, 5);
    px(ctx, "#38bdf8", cx + 12, headY + 4 + bounce, 4, 2);
  }

  if (decoration === "bandage") {
    const pulse = frame % 6 < 3 ? 0 : 1;
    px(ctx, "#f8fafc", cx + 10, headY + 3, 8, 4 + pulse);
    px(ctx, "#cbd5e1", cx + 12, headY + 4, 1, 2 + pulse);
    px(ctx, "#cbd5e1", cx + 15, headY + 4, 1, 2 + pulse);
  }
}

function drawFaceExpression(ctx, face, palette, cx, headY) {
  if (face === "happy") {
    px(ctx, "#111827", cx - 5, headY + 14, 2, 1);
    px(ctx, "#111827", cx + 3, headY + 14, 2, 1);
    px(ctx, "#111827", cx - 3, headY + 15, 6, 1);
    px(ctx, "#111827", cx - 1, headY + 16, 2, 1);
  }

  if (face === "healthy") {
    px(ctx, "#111827", cx - 3, headY + 14, 2, 1);
    px(ctx, "#111827", cx + 1, headY + 14, 2, 1);
    px(ctx, "#111827", cx - 2, headY + 15, 4, 1);
  }

  if (face === "unhappy") {
    px(ctx, "#111827", cx - 7, headY + 4, 4, 1);
    px(ctx, "#111827", cx + 3, headY + 4, 4, 1);
    px(ctx, "#111827", cx - 3, headY + 15, 1, 1);
    px(ctx, "#111827", cx - 2, headY + 14, 4, 1);
    px(ctx, "#111827", cx + 2, headY + 15, 1, 1);
  }

  if (face === "stressed") {
    px(ctx, "#111827", cx - 7, headY + 4, 4, 1);
    px(ctx, "#111827", cx + 3, headY + 4, 4, 1);
    px(ctx, "#111827", cx - 3, headY + 15, 6, 1);
  }

  if (face === "unhealthy") {
    px(ctx, "#111827", cx - 7, headY + 7, 2, 1);
    px(ctx, "#111827", cx - 5, headY + 8, 2, 1);
    px(ctx, "#111827", cx - 3, headY + 7, 2, 1);
    px(ctx, "#111827", cx + 3, headY + 7, 2, 1);
    px(ctx, "#111827", cx + 5, headY + 8, 2, 1);
    px(ctx, "#111827", cx + 7, headY + 7, 2, 1);
    px(ctx, "#111827", cx - 4, headY + 18, 2, 1);
    px(ctx, "#111827", cx - 2, headY + 17, 2, 1);
    px(ctx, "#111827", cx, headY + 16, 2, 1);
    px(ctx, "#111827", cx + 2, headY + 17, 2, 1);
    px(ctx, "#111827", cx + 4, headY + 18, 2, 1);
  }
}

function drawDeadDog(ctx) {
  ctx.save();
  ctx.translate(0, SCENE_Y_OFFSET);

  px(ctx, DEAD_DOG.furDark, 10, 22, 24, 10);
  px(ctx, DEAD_DOG.fur, 12, 20, 22, 10);
  px(ctx, DEAD_DOG.belly, 17, 23, 10, 6);
  px(ctx, DEAD_DOG.accent, 13, 20, 20, 3);
  px(ctx, DEAD_DOG.paw, 8, 28, 5, 4);
  px(ctx, DEAD_DOG.paw, 14, 30, 5, 4);
  px(ctx, DEAD_DOG.paw, 25, 30, 5, 4);
  px(ctx, DEAD_DOG.paw, 31, 28, 5, 4);
  px(ctx, DEAD_DOG.fur, 13, 8, 20, 15);
  px(ctx, DEAD_DOG.belly, 16, 14, 14, 8);
  px(ctx, DEAD_DOG.ear, 9, 10, 6, 13);
  px(ctx, DEAD_DOG.ear, 31, 10, 6, 13);
  px(ctx, "#111827", 18, 14, 4, 1);
  px(ctx, "#111827", 19, 13, 2, 3);
  px(ctx, "#111827", 18, 16, 4, 1);
  px(ctx, "#111827", 25, 14, 4, 1);
  px(ctx, "#111827", 26, 13, 2, 3);
  px(ctx, "#111827", 25, 16, 4, 1);
  px(ctx, "#111827", 22, 17, 2, 2);
  px(ctx, "#111827", 20, 20, 6, 1);
  px(ctx, "#e2e8f0", 18, 2, 10, 2);
  px(ctx, "#cbd5e1", 16, 4, 14, 2);

  ctx.restore();
}

function drawAliveDog(ctx, frame, stage) {
  ctx.save();
  ctx.translate(0, SCENE_Y_OFFSET);

  const cx = T / 2;
  const cy = T / 2;
  const palette = stage.palette;
  const phase = frame % 6;
  const motion = stage.motion ?? stage.key;
  const xShift =
    motion === "stressed"
      ? phase % 2 === 0
        ? -1
        : 1
      : motion === "unhappy"
        ? phase < 3
          ? 0
          : -1
        : 0;
  const stride =
    motion === "happy" || motion === "healthy"
      ? phase === 1 || phase === 5
        ? 2
        : phase === 3
          ? -2
          : 0
      : 0;
  const bob =
    motion === "happy"
      ? phase === 2 || phase === 4
        ? -2
        : 0
      : motion === "healthy"
        ? phase === 2 || phase === 4
          ? -1
          : 0
        : motion === "unhappy"
          ? phase < 3
            ? 0
            : 1
          : motion === "stressed"
            ? phase % 2 === 0
              ? -1
              : 1
            : phase < 3
              ? 1
              : 0;
  const tailWag =
    motion === "happy"
      ? phase % 2 === 0
        ? -2
        : 2
      : motion === "healthy"
        ? phase % 2 === 0
          ? -1
          : 1
        : motion === "unhappy"
          ? phase < 3
            ? -1
            : 0
          : motion === "stressed"
            ? phase % 2 === 0
              ? 1
              : -1
            : phase < 3
              ? 0
              : -1;
  const by = cy + 6;
  const headY = by - 28 + bob;
  const earHeight =
    stage.key === "unhealthy"
      ? 18
      : stage.key === "stressed"
        ? 16
        : stage.key === "unhappy"
          ? 15
          : 14;
  const showDefaultEyes = stage.face !== "unhealthy";

  px(ctx, palette.furDark, cx - 2 + tailWag + xShift, by - 22 + bob, 4, 6);
  px(ctx, palette.fur, cx - 10 + xShift, by - 18 + bob, 20, 14);
  px(ctx, palette.belly, cx - 6 + xShift, by - 12 + bob, 12, 10);
  px(ctx, palette.accent, cx - 10 + xShift, by - 18 + bob, 20, 4);
  px(ctx, palette.paw, cx - 8 + stride + xShift, by - 2, 6, 5);
  px(ctx, palette.paw, cx + 2 - stride + xShift, by - 2, 6, 5);
  px(ctx, palette.fur, cx - 10 + xShift, headY, 20, 16);
  px(ctx, palette.furLight, cx - 8 + xShift, headY + 2, 16, 10);
  px(ctx, palette.ear, cx - 14 + xShift, headY + 2, 6, earHeight);
  px(ctx, palette.ear, cx + 8 + xShift, headY + 2, 6, earHeight);
  px(ctx, palette.belly, cx - 6 + xShift, headY + 8, 12, 8);
  if (showDefaultEyes) {
    px(ctx, palette.eyeWhite, cx - 6 + xShift, headY + 6, 4, 4);
    px(ctx, palette.eyeWhite, cx + 2 + xShift, headY + 6, 4, 4);
    px(ctx, palette.eyePupil, cx - 5 + xShift, headY + 7, 3, 3);
    px(ctx, palette.eyePupil, cx + 3 + xShift, headY + 7, 3, 3);
  }
  px(ctx, palette.nose, cx - 2 + xShift, headY + 10, 4, 3);

  if (stage.showTongue && phase % 4 < 2) {
    px(ctx, palette.tongue, cx - 1 + xShift, headY + 13, 3, 4);
  }

  drawFaceExpression(ctx, stage.face, palette, cx + xShift, headY);
  drawDecoration(ctx, stage.decoration, frame, cx + xShift, headY);

  ctx.restore();
}

function drawDogCharacter(ctx, frame, stage) {
  if (stage.key === "dead") {
    drawDeadDog(ctx);
    return;
  }
  drawAliveDog(ctx, frame, stage);
}

function getAlienPalette(stage) {
  if (stage.key === "dead") return DEAD_ALIEN;
  if (stage.key === "unhealthy") return SICK_ALIEN;
  return ALIEN;
}

// `tilt` shifts the dome's top rows sideways so the body reads as leaning
// into its waddle while the base stays planted.
function drawAlienBody(ctx, palette, cx, topY, tilt = 0) {
  px(ctx, palette.body, cx - 8 + tilt, topY, 16, 1);
  px(ctx, palette.body, cx - 10 + tilt, topY + 1, 20, 1);
  px(ctx, palette.body, cx - 12 + tilt, topY + 2, 24, 1);
  px(ctx, palette.body, cx - 13, topY + 3, 26, 16);
  px(ctx, palette.body, cx - 12, topY + 19, 24, 1);
  px(ctx, palette.body, cx - 10, topY + 20, 20, 1);
  px(ctx, palette.body, cx - 8, topY + 21, 16, 1);
  px(ctx, palette.body2, cx - 10, topY + 20, 20, 1);
  px(ctx, palette.body2, cx - 8, topY + 21, 16, 1);
}

// `pose` (optional) animates the four legs individually: `lift(i)` raises a
// leg 1px (diagonal pairs = waddle gait), `dx(i)` skitters a leg sideways,
// `splay` pushes the outer legs outward, `drop`/`height` bend the legs for a
// sagging stance. A falsy pose draws the neutral planted stance.
function drawAlienLegs(ctx, palette, cx, topY, pose) {
  const y = topY + 21;
  const xs = [-10, -5, 1, 6];
  for (let i = 0; i < 4; i++) {
    const dx = pose?.dx ? pose.dx(i) : 0;
    const splay = pose?.splay ? (i === 0 ? -pose.splay : i === 3 ? pose.splay : 0) : 0;
    const lift = pose?.lift ? pose.lift(i) : 0;
    px(
      ctx,
      palette.leg,
      cx + xs[i] + dx + splay,
      y + (pose?.drop ?? 0) - lift,
      3,
      pose?.height ?? 3,
    );
  }
}

function drawAlienFace(ctx, key, palette, cx, topY) {
  const E = palette.eye;

  if (key === "happy") {
    px(ctx, E, cx - 4, topY + 8, 2, 3);
    px(ctx, E, cx + 2, topY + 8, 2, 3);
    px(ctx, palette.eyeLight, cx - 4, topY + 8, 1, 1);
    px(ctx, palette.eyeLight, cx + 2, topY + 8, 1, 1);
    px(ctx, palette.cheek, cx - 7, topY + 11, 2, 1);
    px(ctx, palette.cheek, cx + 5, topY + 11, 2, 1);
    px(ctx, E, cx - 2, topY + 15, 1, 1);
    px(ctx, E, cx + 1, topY + 15, 1, 1);
    px(ctx, E, cx - 1, topY + 16, 2, 1);
    return;
  }

  if (key === "healthy") {
    px(ctx, E, cx - 4, topY + 8, 2, 2);
    px(ctx, E, cx + 2, topY + 8, 2, 2);
    px(ctx, E, cx - 2, topY + 15, 1, 1);
    px(ctx, E, cx + 1, topY + 15, 1, 1);
    px(ctx, E, cx - 1, topY + 16, 2, 1);
    return;
  }

  if (key === "unhappy") {
    px(ctx, E, cx - 4, topY + 9, 2, 2);
    px(ctx, E, cx + 2, topY + 9, 2, 2);
    px(ctx, E, cx - 3, topY + 7, 1, 1);
    px(ctx, E, cx - 4, topY + 8, 1, 1);
    px(ctx, E, cx + 2, topY + 7, 1, 1);
    px(ctx, E, cx + 3, topY + 8, 1, 1);
    px(ctx, E, cx - 1, topY + 15, 2, 1);
    px(ctx, E, cx - 2, topY + 16, 1, 1);
    px(ctx, E, cx + 1, topY + 16, 1, 1);
    return;
  }

  if (key === "stressed") {
    px(ctx, E, cx - 4, topY + 8, 2, 2);
    px(ctx, E, cx + 2, topY + 8, 2, 2);
    px(ctx, E, cx - 4, topY + 6, 2, 1);
    px(ctx, E, cx + 2, topY + 6, 2, 1);
    px(ctx, E, cx - 3, topY + 16, 1, 1);
    px(ctx, E, cx - 2, topY + 15, 1, 1);
    px(ctx, E, cx - 1, topY + 16, 1, 1);
    px(ctx, E, cx, topY + 15, 1, 1);
    px(ctx, E, cx + 1, topY + 16, 1, 1);
    return;
  }

  if (key === "unhealthy") {
    px(ctx, E, cx - 5, topY + 8, 3, 1);
    px(ctx, E, cx - 4, topY + 9, 1, 1);
    px(ctx, E, cx + 2, topY + 8, 3, 1);
    px(ctx, E, cx + 3, topY + 9, 1, 1);
    px(ctx, E, cx - 2, topY + 16, 1, 1);
    px(ctx, E, cx - 1, topY + 15, 1, 1);
    px(ctx, E, cx, topY + 16, 1, 1);
  }
}

function drawAlienProps(ctx, key, cx, topY, frame) {
  if (key === "happy") {
    const heart = "#d36aa6";
    const big = frame % 6 >= 3;
    const hx = cx + 5;
    const hy = topY - 6 - (big ? 1 : 0);
    if (big) {
      px(ctx, heart, hx, hy, 2, 1);
      px(ctx, heart, hx + 4, hy, 2, 1);
      px(ctx, heart, hx - 1, hy + 1, 7, 1);
      px(ctx, heart, hx, hy + 2, 5, 1);
      px(ctx, heart, hx + 1, hy + 3, 3, 1);
      px(ctx, heart, hx + 2, hy + 4, 1, 1);
    } else {
      px(ctx, heart, hx, hy, 2, 1);
      px(ctx, heart, hx + 3, hy, 2, 1);
      px(ctx, heart, hx, hy + 1, 5, 1);
      px(ctx, heart, hx + 1, hy + 2, 3, 1);
      px(ctx, heart, hx + 2, hy + 3, 1, 1);
    }
    return;
  }

  if (key === "stressed") {
    const bounce = frame % 3 === 0 ? 0 : 1;
    px(ctx, "#86c9ee", cx + 7, topY + 3 + bounce, 2, 2);
    px(ctx, "#86c9ee", cx + 8, topY + 2 + bounce, 1, 1);
  }
}

function drawDeadAlien(ctx) {
  ctx.save();
  ctx.translate(0, SCENE_Y_OFFSET);

  const cx = T / 2;
  const topY = 7;

  drawAlienBody(ctx, DEAD_ALIEN, cx, topY);
  drawAlienLegs(ctx, DEAD_ALIEN, cx, topY, 0);

  const halo = "#f2d06a";
  px(ctx, halo, cx - 5, topY - 7, 10, 1);
  px(ctx, halo, cx - 5, topY - 5, 10, 1);
  px(ctx, halo, cx - 6, topY - 6, 1, 1);
  px(ctx, halo, cx + 5, topY - 6, 1, 1);

  const E = DEAD_ALIEN.eye;
  px(ctx, E, cx - 5, topY + 8, 1, 1);
  px(ctx, E, cx - 3, topY + 8, 1, 1);
  px(ctx, E, cx - 4, topY + 9, 1, 1);
  px(ctx, E, cx - 5, topY + 10, 1, 1);
  px(ctx, E, cx - 3, topY + 10, 1, 1);
  px(ctx, E, cx + 2, topY + 8, 1, 1);
  px(ctx, E, cx + 4, topY + 8, 1, 1);
  px(ctx, E, cx + 3, topY + 9, 1, 1);
  px(ctx, E, cx + 2, topY + 10, 1, 1);
  px(ctx, E, cx + 4, topY + 10, 1, 1);
  px(ctx, E, cx - 2, topY + 15, 4, 1);

  ctx.restore();
}

function drawAliveAlien(ctx, frame, stage) {
  ctx.save();
  ctx.translate(0, SCENE_Y_OFFSET);

  const cx = T / 2;
  const t = frame % 12;
  const motion = stage.motion ?? stage.key;
  const palette = getAlienPalette(stage);
  let bob = 0;
  let tilt = 0;
  let jitterX = 0;
  const pose = {};
  if (motion === "happy" || motion === "healthy") {
    bob = (
      motion === "happy"
        ? [0, -1, -1, 0, 0, 0, 0, 0, -2, -2, 0, 0]
        : [0, -1, -1, 0, 0, 0, 0, -1, -1, 0, 0, 0]
    )[t];
    const hopping = motion === "happy" && (t === 8 || t === 9);
    if (hopping) {
      pose.height = 2; // legs tucked mid-air
    } else {
      const leftPair = t % 4 < 2;
      pose.lift = (i) => ((i % 2 === 0) === leftPair ? 1 : 0);
      tilt = leftPair ? 1 : -1;
    }
    if (motion === "happy" && t === 10) pose.splay = 1; // landing absorb
  } else if (motion === "unhappy") {
    bob = 1 + (t % 12 < 6 ? 0 : 1);
    pose.height = 2;
    pose.drop = 1;
  } else if (motion === "stressed") {
    jitterX = t % 2 === 0 ? -1 : 1;
    bob = t % 2 === 0 ? -1 : 0;
    pose.dx = (i) => (t + i) % 2;
  } else if (motion === "unhealthy") {
    bob = 1 + (t % 12 < 8 ? 0 : 1);
    pose.height = 2;
    pose.drop = 1;
    pose.splay = 1;
  }
  const topY = 6 + bob;
  const ox = cx + jitterX;
  const shadowW = bob < -1 ? 14 : 20;
  px(ctx, COMPANION_SHADOW, cx - shadowW / 2, 30, shadowW, 1);

  drawAlienBody(ctx, palette, ox, topY, tilt);
  drawAlienLegs(ctx, palette, ox, topY, pose);
  drawAlienFace(ctx, stage.key, palette, ox + tilt, topY);
  drawAlienProps(ctx, stage.key, ox + tilt, topY, t);

  ctx.restore();
}

function drawAlienCharacter(ctx, frame, stage) {
  if (stage.key === "dead") {
    drawDeadAlien(ctx);
    return;
  }
  drawAliveAlien(ctx, frame, stage);
}

const GHOST = {
  body: "#e6ecfa",
  body2: "#c2cde8",
  bodyLight: "#f3f6fe",
  eye: "#2f3566",
};

const SICK_GHOST = {
  ...GHOST,
  body: "#cdd7c0",
  body2: "#a8b291",
};

const DEAD_GHOST = {
  ...GHOST,
  body: "#d8d8e0",
  body2: "#b5b5c0",
  eye: "#5a5a66",
};

const GHOST_HW = [
  3, 5, 7, 8, 9, 10, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
  12, 12, 12, 12,
];

function getGhostPalette(stage) {
  if (stage.key === "dead") return DEAD_GHOST;
  if (stage.key === "unhealthy") return SICK_GHOST;
  return GHOST;
}

// The hem's three lobes can ripple independently (like trailing fabric);
// `ripple(lobeIndex)` returns the per-lobe lift in px, or null for a still hem.
function drawGhostBody(ctx, palette, cx, gy, ripple = null) {
  for (let i = 0; i < GHOST_HW.length; i++) {
    px(ctx, palette.body, cx - GHOST_HW[i], gy + i, 2 * GHOST_HW[i], 1);
  }
  const b = gy + GHOST_HW.length;
  const lobes = [
    [-12, 7, -11, 5],
    [-3, 6, -2, 4],
    [5, 7, 6, 5],
  ];
  lobes.forEach(([x1, w1, x2, w2], i) => {
    const lift = ripple ? ripple(i) : 0;
    px(ctx, palette.body, cx + x1, b + lift, w1, 1);
    px(ctx, palette.body, cx + x2, b + 1 + lift, w2, 1);
    px(ctx, palette.body2, cx + x2, b + 1 + lift, w2, 1);
  });
  for (let i = 4; i < GHOST_HW.length; i++) {
    px(ctx, palette.body2, cx + GHOST_HW[i] - 1, gy + i, 1, 1);
  }
  px(ctx, palette.bodyLight, cx - 6, gy + 2, 3, 1);
  px(ctx, palette.bodyLight, cx - 8, gy + 3, 2, 1);
  px(ctx, palette.bodyLight, cx - 9, gy + 4, 2, 1);
}

function drawGhostEyes(ctx, palette, key, cx, gy) {
  const E = palette.eye;
  const y = gy + 12;
  const pair = (rows) =>
    rows.forEach(([dx, dy, w = 1, h = 1]) => {
      px(ctx, E, cx - dx, y + dy, w, h);
      px(ctx, E, cx + dx - (w - 1), y + dy, w, h);
    });

  if (key === "happy") {
    pair([
      [8, 2], [7, 1], [6, 0, 2, 1], [4, 1], [3, 2],
      [8, 3], [7, 2], [6, 1, 2, 1], [4, 2], [3, 3],
    ]);
    return;
  }
  if (key === "unhappy") {
    pair([[9, 0], [9, 1], [4, 0], [4, 1], [8, 2], [7, 2], [6, 2], [5, 2]]);
    return;
  }
  if (key === "stressed") {
    pair([[9, 0], [8, 1], [7, 2], [8, 3], [9, 4]]);
    return;
  }
  if (key === "unhealthy") {
    pair([[9, 0, 3, 1], [9, 3, 3, 1], [9, 1, 1, 2], [7, 1, 1, 2], [8, 1]]);
    return;
  }
  if (key === "dead") {
    pair([[9, 0], [7, 0], [8, 1], [9, 2], [7, 2]]);
    px(ctx, "#f2d06a", cx - 5, gy - 2, 10, 1);
    px(ctx, "#f2d06a", cx - 5, gy, 10, 1);
    px(ctx, "#f2d06a", cx - 6, gy - 1, 1, 1);
    px(ctx, "#f2d06a", cx + 5, gy - 1, 1, 1);
    return;
  }
  pair([[8, 0, 1, 3], [9, 1], [7, 1]]);
}

function drawGhostCharacter(ctx, frame, stage) {
  ctx.save();
  ctx.translate(0, SCENE_Y_OFFSET);
  const cx = T / 2;
  const t = frame % 12;
  const palette = getGhostPalette(stage);
  const motion = stage.key === "dead" ? "dead" : (stage.motion ?? stage.key);
  let drift = 0;
  let sway = 0;
  let eyeDx = 0;
  let eyeDy = 0;
  let ripple = null;
  let alpha = 1;
  if (motion === "happy") {
    drift = [0, -1, -2, -2, -2, -1, 0, 1, 2, 2, 1, 0][t];
    sway = [0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, -1][t];
    eyeDx = sway;
    ripple = (i) => ((t + i * 2) % 6 < 3 ? 0 : -1);
  } else if (motion === "healthy") {
    drift = [0, -1, -1, -1, 0, 0, 0, 1, 1, 1, 0, 0][t];
    sway = [0, 0, 1, 1, 0, 0, 0, 0, -1, -1, 0, 0][t];
    eyeDx = sway;
    ripple = (i) => ((t + i * 4) % 12 < 6 ? 0 : -1);
  } else if (motion === "unhappy") {
    drift = 2 + (t % 12 < 6 ? 0 : 1);
    eyeDy = 1;
  } else if (motion === "stressed") {
    drift = t % 2 === 0 ? -1 : 0;
    sway = t % 2 === 0 ? -1 : 1;
    ripple = (i) => ((t + i) % 2 === 0 ? 0 : -1);
  } else if (motion === "unhealthy") {
    drift = 3 + (t % 12 < 6 ? 0 : 1);
    alpha = t === 5 || t === 11 ? 0.5 : 1;
  }
  const gy = 7 + drift;
  if (motion !== "dead") {
    const shadowW = Math.max(8, Math.min(18, 16 - 2 * (7 - gy)));
    px(ctx, COMPANION_SHADOW, cx - shadowW / 2, 37, shadowW, 1);
  }
  ctx.globalAlpha = alpha;
  drawGhostBody(ctx, palette, cx + sway, gy, ripple);
  drawGhostEyes(ctx, palette, stage.key, cx + sway + eyeDx, gy + eyeDy);
  ctx.globalAlpha = 1;
  ctx.restore();
}

const ROBOT = {
  metal: "#9fb4c9",
  metalDark: "#7891ab",
  screen: "#222a38",
  eye: "#5fe0d8",
  bulb: "#f0934e",
  wheel: "#3a4452",
};

const SICK_ROBOT = {
  ...ROBOT,
  metal: "#9a9a8a",
  metalDark: "#76766a",
  eye: "#9ec0bd",
  bulb: "#b89a6a",
};

const DEAD_ROBOT = {
  ...ROBOT,
  metal: "#8a8d92",
  metalDark: "#6b6e73",
  eye: "#5a6b6a",
  bulb: "#5a5a60",
  screen: "#1a1f28",
  wheel: "#33373f",
};

function getRobotPalette(stage) {
  if (stage.key === "dead") return DEAD_ROBOT;
  if (stage.key === "unhealthy") return SICK_ROBOT;
  return ROBOT;
}

// The robot is drawn in decoupled parts so they can move independently: the
// wheeled chassis stays planted, the torso rides suspension, the head lags the
// torso by one frame, and the antenna lags the head (follow-through).
function drawRobotChassis(ctx, p, cx, motion, t) {
  px(ctx, p.wheel, cx - 7, 32, 14, 3);
  px(ctx, p.metalDark, cx - 7, 34, 14, 1);
  px(ctx, p.metal, cx - 1, 32, 2, 2);
  if (motion === "dead") return;
  const speed =
    motion === "happy"
      ? 3
      : motion === "healthy"
        ? 2
        : motion === "stressed"
          ? 4
          : motion === "unhappy"
            ? 1
            : 0;
  const scroll = motion === "unhealthy" ? Math.floor(t / 2) : t * speed;
  px(ctx, "#232a35", cx - 7 + (scroll % 14), 33, 1, 1);
  px(ctx, "#232a35", cx - 7 + ((scroll + 7) % 14), 33, 1, 1);
}

function drawRobotTorso(ctx, p, cx, by, key, armDrop) {
  px(ctx, p.metal, cx - 11, 25 + by + armDrop, 2, 4);
  px(ctx, p.metal, cx + 9, 25 + by + armDrop, 2, 4);
  px(ctx, p.metal, cx - 8, 23 + by, 16, 1);
  px(ctx, p.metal, cx - 9, 24 + by, 18, 7);
  px(ctx, p.metal, cx - 8, 31 + by, 16, 1);
  px(ctx, p.metalDark, cx + 8, 24 + by, 1, 7);
  px(ctx, key === "dead" ? p.metalDark : p.eye, cx - 1, 26 + by, 2, 2);
}

function drawRobotHead(ctx, p, cx, hy, key, t) {
  px(ctx, p.metal, cx - 9, 12 + hy, 18, 1);
  px(ctx, p.metal, cx - 10, 13 + hy, 20, 8);
  px(ctx, p.metal, cx - 9, 21 + hy, 18, 1);
  px(ctx, p.metalDark, cx + 9, 13 + hy, 1, 8);
  px(ctx, p.metalDark, cx - 10, 20 + hy, 20, 1);
  px(ctx, p.screen, cx - 7, 14 + hy, 14, 6);
  if (key !== "dead") {
    px(ctx, "rgba(255, 255, 255, 0.10)", cx - 7, 14 + hy + (t % 6), 14, 1);
  }
}

function drawRobotAntenna(ctx, p, cx, hy, ay, lean, key, t) {
  px(ctx, p.metal, cx - 1, 9 + hy, 2, 4);
  if (key === "dead") {
    px(ctx, p.metalDark, cx - 1, 6, 2, 2);
    return;
  }
  px(
    ctx,
    p.metalDark,
    cx + lean,
    8 + Math.min(ay, hy),
    1,
    Math.max(1, Math.abs(hy - ay)),
  );
  let on = false;
  let tip = false;
  if (key === "happy") {
    on = true;
    tip = t % 6 < 3;
  } else if (key === "healthy") {
    on = t % 6 < 3;
  } else if (key === "unhappy") {
    on = t % 12 < 3;
  } else if (key === "stressed") {
    on = t % 2 === 0;
  } else {
    on = t < 2;
  }
  px(ctx, on ? p.bulb : p.metalDark, cx - 1 + lean, 6 + ay, 2, 2);
  if (on && tip) px(ctx, p.bulb, cx + lean, 5 + ay, 1, 1);
}

function drawRobotFace(ctx, p, key, cx, by) {
  const E = p.eye;
  const y = 16 + by;
  if (key === "happy") {
    px(ctx, E, cx - 6, y + 1, 1, 1);
    px(ctx, E, cx - 5, y, 2, 1);
    px(ctx, E, cx - 3, y + 1, 1, 1);
    px(ctx, E, cx + 2, y + 1, 1, 1);
    px(ctx, E, cx + 3, y, 2, 1);
    px(ctx, E, cx + 5, y + 1, 1, 1);
    px(ctx, E, cx - 3, y + 2, 1, 1);
    px(ctx, E, cx - 2, y + 3, 4, 1);
    px(ctx, E, cx + 2, y + 2, 1, 1);
    return;
  }
  if (key === "healthy") {
    px(ctx, E, cx - 5, y, 2, 2);
    px(ctx, E, cx + 3, y, 2, 2);
    return;
  }
  if (key === "unhappy") {
    px(ctx, E, cx - 6, y, 1, 1);
    px(ctx, E, cx - 5, y + 1, 2, 1);
    px(ctx, E, cx + 3, y + 1, 2, 1);
    px(ctx, E, cx + 5, y, 1, 1);
    return;
  }
  if (key === "stressed") {
    px(ctx, E, cx - 6, y - 1, 1, 1);
    px(ctx, E, cx - 5, y, 1, 1);
    px(ctx, E, cx - 4, y + 1, 1, 1);
    px(ctx, E, cx - 5, y + 2, 1, 1);
    px(ctx, E, cx - 6, y + 3, 1, 1);
    px(ctx, E, cx + 5, y - 1, 1, 1);
    px(ctx, E, cx + 4, y, 1, 1);
    px(ctx, E, cx + 3, y + 1, 1, 1);
    px(ctx, E, cx + 4, y + 2, 1, 1);
    px(ctx, E, cx + 5, y + 3, 1, 1);
    return;
  }
  if (key === "unhealthy") {
    px(ctx, E, cx - 6, y + 1, 3, 1);
    px(ctx, E, cx + 3, y + 1, 3, 1);
    return;
  }
  if (key === "dead") {
    px(ctx, E, cx - 4, y + 1, 8, 1);
  }
}

function drawRobotCharacter(ctx, frame, stage) {
  ctx.save();
  ctx.translate(0, SCENE_Y_OFFSET);
  const cx = T / 2;
  const t = frame % 12;
  const key = stage.key;
  const motion = key === "dead" ? "dead" : (stage.motion ?? key);
  const palette = getRobotPalette(stage);
  let bobs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let rest = 0;
  let jitter = 0;
  let headJitter = 0;
  if (motion === "happy") {
    bobs = [0, -1, -2, -1, 0, 0, 0, -1, -2, -1, 0, 0];
  } else if (motion === "healthy") {
    bobs = [0, -1, -1, 0, 0, 0, 0, -1, -1, 0, 0, 0];
  } else if (motion === "unhappy") {
    bobs = [0, 0, 0, -1, -1, 0, 0, 0, 0, 0, 0, 0];
    rest = 1;
  } else if (motion === "stressed") {
    bobs = [-1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0];
    jitter = t % 2 === 0 ? -1 : 1;
    headJitter = -jitter;
  } else if (motion === "unhealthy") {
    bobs = [0, 0, 0, 0, 0, 0, 0, 0, -1, -1, 0, 0];
    rest = 1;
  }
  const bodyBob = motion === "dead" ? 0 : bobs[t] + rest;
  const headBob = motion === "dead" ? 0 : bobs[(t + 11) % 12] + rest;
  const antennaBob = motion === "dead" ? 0 : bobs[(t + 10) % 12] + rest;
  const lean = Math.max(-1, Math.min(1, headBob - antennaBob));
  if (motion !== "dead") {
    px(ctx, COMPANION_SHADOW, cx - 8, 36, 16, 1);
  }
  drawRobotChassis(ctx, palette, cx, motion, t);
  drawRobotTorso(ctx, palette, cx + jitter, bodyBob, key, bodyBob < 0 ? 1 : 0);
  drawRobotHead(ctx, palette, cx + headJitter, headBob, key, t);
  let faceDx = 0;
  if (key === "unhealthy") {
    if (t === 3) faceDx = -1;
    if (t === 9) faceDx = 1;
    px(
      ctx,
      "rgba(255, 255, 255, 0.18)",
      cx + headJitter - 7 + ((t * 5) % 14),
      14 + headBob + ((t * 3) % 6),
      1,
      1,
    );
  }
  drawRobotFace(ctx, palette, key, cx + headJitter + faceDx, headBob);
  drawRobotAntenna(
    ctx,
    palette,
    cx + headJitter,
    headBob,
    antennaBob,
    lean,
    key,
    t,
  );
  ctx.restore();
}

const SLIME = {
  body: "#5fc92e",
  outline: "#39791a",
  hi: "#8ed848",
  eye: "#26391a",
  gold: "#f7c948",
  cheek: "#f0a0ae",
};

const SICK_SLIME = {
  ...SLIME,
  body: "#9aa86a",
  outline: "#69763f",
  hi: "#b2c088",
  gold: "#cbb56a",
};

const DEAD_SLIME = {
  ...SLIME,
  body: "#a7b59a",
  outline: "#727f66",
  hi: "#bcc7b2",
  eye: "#46503c",
  gold: "#8a9070",
};

const SLIME_HW = [
  3, 5, 7, 9, 10, 11, 12, 12, 13, 13, 14, 14, 14, 14, 13, 13, 12, 10, 7,
];
// Squash-and-stretch silhouettes. All shapes share the same bottom row
// (SLIME_BASELINE) so the slime deforms with its feet planted instead of
// floating: stretch is taller/narrower, squash shorter/wider, melt is the
// sagging puddle used when unhappy or sick.
const SLIME_HW_STRETCH = [
  3, 4, 6, 8, 9, 10, 11, 11, 12, 12, 12, 13, 13, 13, 13, 12, 12, 11, 10, 8, 6,
];
const SLIME_HW_SQUASH = [
  5, 8, 10, 12, 13, 14, 14, 15, 15, 15, 15, 15, 14, 13, 12, 10,
];
const SLIME_HW_MELT = [
  3, 5, 7, 9, 10, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16,
];
const SLIME_BASELINE = 31;

function getSlimePalette(stage) {
  if (stage.key === "dead") return DEAD_SLIME;
  if (stage.key === "unhealthy") return SICK_SLIME;
  return SLIME;
}

// `rows` selects the silhouette, `jitter(rowIndex)` shifts individual rows for
// the jelly tremble, and ballDx/ballDy drag the antenna ball behind the body
// (follow-through).
function drawSlimeBody(
  ctx,
  p,
  cx,
  topY,
  rows = SLIME_HW,
  jitter = null,
  ballDx = 0,
  ballDy = 0,
) {
  // ball-on-stalk antenna
  const stalkDx = jitter ? jitter(0) : 0;
  px(ctx, p.outline, cx + stalkDx, topY - 2, 1, 2);
  px(ctx, p.outline, cx + 1 + stalkDx, topY - 3, 1, 1);
  px(ctx, p.outline, cx + 2 + stalkDx, topY - 4, 1, 1);
  px(ctx, p.outline, cx + 3 + stalkDx, topY - 4, 1, 1);
  px(ctx, p.body, cx + 4 + ballDx, topY - 6 + ballDy, 3, 3);
  px(ctx, p.outline, cx + 4 + ballDx, topY - 7 + ballDy, 3, 1);
  px(ctx, p.outline, cx + 4 + ballDx, topY - 3 + ballDy, 3, 1);
  px(ctx, p.outline, cx + 3 + ballDx, topY - 6 + ballDy, 1, 3);
  px(ctx, p.outline, cx + 7 + ballDx, topY - 6 + ballDy, 1, 3);
  // body (outline + inset fill)
  const n = rows.length;
  for (let i = 0; i < n; i++) {
    const w = rows[i];
    const dx = jitter ? jitter(i) : 0;
    px(ctx, p.outline, cx - w + dx, topY + i, 2 * w, 1);
    if (i > 0 && i < n - 1)
      px(ctx, p.body, cx - (w - 1) + dx, topY + i, 2 * (w - 1), 1);
  }
  // soft green rim
  const rim1 = jitter ? jitter(1) : 0;
  const rim2 = jitter ? jitter(2) : 0;
  px(ctx, p.hi, cx - 4 + rim1, topY + 1, 8, 1);
  px(ctx, p.hi, cx - 7 + rim2, topY + 2, 4, 1);
  px(ctx, p.hi, cx + 4 + rim2, topY + 2, 4, 1);
}

function drawSlimeEyes(ctx, p, key, cx, topY, squish = false) {
  const E = p.eye;
  const G = p.gold;
  const ey = topY + 5;
  const base = (ex) => {
    if (squish) {
      px(ctx, E, ex + 1, ey + 1, 4, 1);
      px(ctx, E, ex, ey + 2, 6, 3);
      px(ctx, E, ex + 1, ey + 5, 4, 1);
      return;
    }
    px(ctx, E, ex + 1, ey, 4, 1);
    px(ctx, E, ex, ey + 1, 6, 4);
    px(ctx, E, ex + 1, ey + 5, 4, 1);
  };
  const glint = (ex, big) => {
    if (big) {
      px(ctx, G, ex + 2, ey + 1, 1, 3);
      px(ctx, G, ex + 1, ey + 2, 3, 1);
    } else {
      px(ctx, G, ex + 1, ey + 2, 3, 1);
      px(ctx, G, ex + 2, ey + 1, 1, 1);
    }
  };
  if (key === "happy") {
    base(cx - 8);
    base(cx + 3);
    glint(cx - 8, true);
    glint(cx + 3, true);
    px(ctx, p.cheek, cx - 10, topY + 11, 2, 1);
    px(ctx, p.cheek, cx + 8, topY + 11, 2, 1);
    px(ctx, E, cx - 3, topY + 12, 1, 1);
    px(ctx, E, cx + 2, topY + 12, 1, 1);
    px(ctx, E, cx - 2, topY + 13, 4, 1);
    return;
  }
  if (key === "healthy") {
    base(cx - 8);
    base(cx + 3);
    glint(cx - 8, false);
    glint(cx + 3, false);
    px(ctx, E, cx - 3, topY + 12, 1, 1);
    px(ctx, E, cx - 2, topY + 13, 1, 1);
    px(ctx, E, cx - 1, topY + 12, 1, 1);
    px(ctx, E, cx, topY + 12, 1, 1);
    px(ctx, E, cx + 1, topY + 13, 1, 1);
    px(ctx, E, cx + 2, topY + 12, 1, 1);
    return;
  }
  if (key === "unhappy") {
    px(ctx, E, cx - 8, ey + 2, 5, 1);
    px(ctx, E, cx - 8, ey + 3, 5, 2);
    px(ctx, E, cx + 3, ey + 2, 5, 1);
    px(ctx, E, cx + 3, ey + 3, 5, 2);
    px(ctx, E, cx - 2, topY + 13, 5, 1);
    px(ctx, E, cx - 3, topY + 14, 1, 1);
    px(ctx, E, cx + 2, topY + 14, 1, 1);
    return;
  }
  if (key === "stressed") {
    px(ctx, E, cx - 8, ey + 1, 5, 1);
    px(ctx, E, cx - 7, ey + 2, 5, 2);
    px(ctx, E, cx + 3, ey + 1, 5, 1);
    px(ctx, E, cx + 2, ey + 2, 5, 2);
    px(ctx, E, cx - 3, topY + 14, 1, 1);
    px(ctx, E, cx - 1, topY + 13, 1, 1);
    px(ctx, E, cx + 1, topY + 14, 1, 1);
    px(ctx, E, cx + 3, topY + 13, 1, 1);
    return;
  }
  if (key === "unhealthy") {
    px(ctx, E, cx - 8, ey + 2, 6, 1);
    px(ctx, E, cx - 7, ey + 3, 2, 1);
    px(ctx, E, cx + 2, ey + 2, 6, 1);
    px(ctx, E, cx + 4, ey + 3, 2, 1);
    px(ctx, E, cx - 2, topY + 13, 1, 1);
    px(ctx, E, cx, topY + 14, 1, 1);
    px(ctx, E, cx + 2, topY + 13, 1, 1);
    return;
  }
  if (key === "dead") {
    const xeye = (ex) => {
      px(ctx, E, ex, ey + 1, 1, 1);
      px(ctx, E, ex + 3, ey + 1, 1, 1);
      px(ctx, E, ex + 1, ey + 2, 2, 1);
      px(ctx, E, ex, ey + 3, 1, 1);
      px(ctx, E, ex + 3, ey + 3, 1, 1);
    };
    xeye(cx - 8);
    xeye(cx + 4);
    px(ctx, E, cx - 2, topY + 13, 4, 1);
  }
}

function drawSlimeCharacter(ctx, frame, stage) {
  ctx.save();
  ctx.translate(0, SCENE_Y_OFFSET);
  const cx = T / 2;
  const t = frame % 12;
  const palette = getSlimePalette(stage);
  const motion = stage.key === "dead" ? "dead" : (stage.motion ?? stage.key);
  const shapes = [SLIME_HW, SLIME_HW_SQUASH, SLIME_HW_STRETCH];
  let rows = SLIME_HW;
  let hop = 0;
  let jitter = null;
  let ballDx = 0;
  let ballDy = 0;
  let squish = false;
  if (motion === "happy") {
    // anticipation squash -> stretch launch -> airborne -> landing splat
    const seq = [0, 1, 1, 2, 2, 2, 1, 1, 0, 0, 2, 0];
    const hops = [0, 0, 0, -1, -3, -2, 0, 0, 0, 0, 0, 0];
    rows = shapes[seq[t]];
    hop = hops[t];
    squish = seq[t] === 1;
    const prev = (t + 11) % 12;
    const prevTop = SLIME_BASELINE - shapes[seq[prev]].length + hops[prev];
    const currTop = SLIME_BASELINE - rows.length + hop;
    ballDy = Math.max(-2, Math.min(2, prevTop - currTop));
  } else if (motion === "healthy") {
    const seq = [0, 0, 2, 2, 2, 0, 0, 1, 1, 1, 0, 0];
    rows = shapes[seq[t]];
    squish = seq[t] === 1;
    const prev = (t + 11) % 12;
    ballDy = Math.max(
      -2,
      Math.min(2, rows.length - shapes[seq[prev]].length),
    );
  } else if (motion === "unhappy") {
    rows = t % 12 < 6 ? SLIME_HW_MELT : SLIME_HW_MELT.slice(1);
    ballDx = 1;
    ballDy = 2;
  } else if (motion === "stressed") {
    jitter = (i) => (i < 10 ? (t % 2 === 0 ? -1 : 1) : 0);
    ballDx = t % 2 === 0 ? 1 : -1;
  } else if (motion === "unhealthy") {
    rows = t % 12 < 8 ? SLIME_HW_MELT : SLIME_HW_MELT.slice(1);
    ballDx = 1;
    ballDy = 2;
  }
  const topY = motion === "dead" ? 12 : SLIME_BASELINE - rows.length + hop;
  if (motion !== "dead") {
    const shadowW = Math.max(8, 20 + 4 * Math.min(0, hop));
    px(ctx, COMPANION_SHADOW, cx - shadowW / 2, 31, shadowW, 1);
  }
  drawSlimeBody(ctx, palette, cx, topY, rows, jitter, ballDx, ballDy);
  drawSlimeEyes(ctx, palette, stage.key, cx, topY, squish);
  if (motion === "unhealthy") {
    if (t < 10) px(ctx, palette.body, cx + 13, 18 + t, 1, 2);
    else px(ctx, palette.body, cx + 12, 30, 3, 1);
  }
  ctx.restore();
}

const AXOLOTL = {
  body: "#f9a8d4",
  bodyLt: "#fbcfe8",
  belly: "#fdf2f8",
  gill: "#fb7185",
  gillTip: "#f43f5e",
  gillSoft: "#fecdd3",
  cheek: "#f472b6",
  eye: "#3f1d2b",
  smile: "#be185d",
};

const SICK_AXOLOTL = {
  ...AXOLOTL,
  body: "#cda9b6",
  bodyLt: "#dcc1cb",
  belly: "#ece2e7",
  gill: "#bd8a98",
  gillTip: "#ab7886",
  gillSoft: "#d7c2c9",
  cheek: "#bd8a98",
  smile: "#7d5160",
};

const DEAD_AXOLOTL = {
  ...AXOLOTL,
  body: "#b8b3bd",
  bodyLt: "#cfcad3",
  belly: "#e4e1e7",
  gill: "#9aa0a6",
  gillTip: "#878d94",
  gillSoft: "#cfcad3",
  cheek: "#9aa0a6",
  eye: "#4b4b52",
  smile: "#6b6b73",
};

function getAxolotlPalette(stage) {
  if (stage.key === "dead") return DEAD_AXOLOTL;
  if (stage.key === "unhealthy") return SICK_AXOLOTL;
  return AXOLOTL;
}

// External gills: bushy feathery clusters hugging the head's upper-side curve
// (3 per side). NOT thin floating spikes — that read as "weird".
// `ext(tuftIndex)` extends a tuft's tip 1px outward (staggered = breathing);
// tufts are indexed 0-2 left top-to-bottom, 3-5 right. `droop` sinks them all.
function drawAxolotlGills(ctx, p, cx, o, ext = null, droop = 0) {
  const g = p.gill;
  const t = p.gillTip;
  const s = p.gillSoft;
  const left = [
    [-11, 10, -13, 9, -10, 11],
    [-12, 14, -14, 15, -11, 15],
    [-13, 18, -15, 20, -12, 19],
  ];
  const right = [
    [7, 10, 11, 9, 9, 11],
    [8, 14, 12, 15, 10, 15],
    [9, 18, 13, 20, 11, 19],
  ];
  left.forEach(([bx, by, tx, ty, sx, sy], i) => {
    const e = ext ? ext(i) : 0;
    px(ctx, g, cx + bx, by + o + droop, 4, 3);
    px(ctx, t, cx + tx - e, ty + o + droop, 2, 2);
    px(ctx, s, cx + sx, sy + o + droop, 1, 1);
  });
  right.forEach(([bx, by, tx, ty, sx, sy], i) => {
    const e = ext ? ext(i + 3) : 0;
    px(ctx, g, cx + bx, by + o + droop, 4, 3);
    px(ctx, t, cx + tx + e, ty + o + droop, 2, 2);
    px(ctx, s, cx + sx, sy + o + droop, 1, 1);
  });
}

function drawAxolotlBody(ctx, p, cx, o) {
  // oval (egg) silhouette
  px(ctx, p.body, cx - 4, 8 + o, 8, 1);
  px(ctx, p.body, cx - 6, 9 + o, 12, 1);
  px(ctx, p.body, cx - 7, 10 + o, 14, 2);
  px(ctx, p.body, cx - 8, 12 + o, 16, 1);
  px(ctx, p.body, cx - 9, 13 + o, 18, 3);
  px(ctx, p.body, cx - 10, 16 + o, 20, 7);
  px(ctx, p.body, cx - 9, 23 + o, 18, 3);
  px(ctx, p.body, cx - 8, 26 + o, 15, 2);
  px(ctx, p.body, cx - 6, 28 + o, 12, 1);
  // soft upper-left sheen for roundness
  px(ctx, p.bodyLt, cx - 7, 11 + o, 5, 1);
  px(ctx, p.bodyLt, cx - 8, 12 + o, 5, 2);
  // belly patch
  px(ctx, p.belly, cx - 5, 18 + o, 10, 1);
  px(ctx, p.belly, cx - 6, 19 + o, 12, 7);
  px(ctx, p.belly, cx - 5, 26 + o, 10, 1);
  // little arms
  px(ctx, p.body, cx - 11, 23 + o, 3, 3);
  px(ctx, p.body, cx + 8, 23 + o, 3, 3);
  // feet
  px(ctx, p.body, cx - 6, 29 + o, 5, 3);
  px(ctx, p.body, cx + 1, 29 + o, 5, 3);
  px(ctx, p.bodyLt, cx - 6, 31 + o, 5, 1);
  px(ctx, p.bodyLt, cx + 1, 31 + o, 5, 1);
}

function drawAxolotlTail(ctx, p, cx, o, wag) {
  // flat fin tail sweeping out to the lower-right and curling up (wag animates it)
  px(ctx, p.body, cx + 7, 25 + o, 4, 4);
  px(ctx, p.body, cx + 10, 24 + o + wag, 3, 4);
  px(ctx, p.bodyLt, cx + 10, 23 + o + wag, 4, 1);
  px(ctx, p.body, cx + 13, 23 + o + wag, 2, 3);
  px(ctx, p.bodyLt, cx + 13, 22 + o + wag, 3, 1);
  px(ctx, p.body, cx + 15, 21 + o + wag, 1, 2);
}

// Emotion is EYES-ONLY (no mouth), like the ghost/slime.
function drawAxolotlFace(ctx, key, p, cx, o, blink = false) {
  const E = p.eye;
  const ey = 12 + o;
  const pair = (rows) =>
    rows.forEach(([dx, dy, w = 1, h = 1]) => {
      px(ctx, E, cx - dx, ey + dy, w, h);
      px(ctx, E, cx + dx - (w - 1), ey + dy, w, h);
    });
  if (key === "dead") {
    pair([[9, 0], [7, 0], [8, 1], [9, 2], [7, 2]]); // x x
    px(ctx, "#f2d06a", cx - 5, 4 + o, 10, 1);
    px(ctx, "#f2d06a", cx - 5, 6 + o, 10, 1);
    px(ctx, "#f2d06a", cx - 6, 5 + o, 1, 1);
    px(ctx, "#f2d06a", cx + 5, 5 + o, 1, 1);
    return;
  }
  if (key === "happy" || key === "healthy") {
    px(ctx, p.cheek, cx - 9, 17 + o, 3, 2);
    px(ctx, p.cheek, cx + 6, 17 + o, 3, 2);
  }
  if (blink && (key === "happy" || key === "healthy" || key === "unhappy")) {
    pair([[9, 1, 4, 1]]); // closed lids mid-blink
    return;
  }
  if (key === "happy") {
    pair([[9, 2], [8, 1], [6, 0, 3, 1], [4, 1], [3, 2]]); // ^ ^ joyful
  } else if (key === "healthy") {
    pair([[8, 0, 2, 3], [9, 1], [6, 1]]); // • • bright
    px(ctx, "#ffffff", cx - 8, ey, 1, 1);
    px(ctx, "#ffffff", cx + 7, ey, 1, 1);
  } else if (key === "unhappy") {
    pair([[9, 0], [9, 1], [5, 0], [5, 1], [8, 2], [7, 2], [6, 2]]); // worried
  } else if (key === "stressed") {
    pair([[9, 0], [8, 1], [7, 2], [8, 3], [9, 4]]); // > <
  } else if (key === "unhealthy") {
    pair([[9, 0, 3, 1], [9, 3, 3, 1], [9, 1, 1, 2], [7, 1, 1, 2], [8, 1]]); // @ @ woozy
  }
}

function drawAxolotlCharacter(ctx, frame, stage) {
  ctx.save();
  ctx.translate(0, SCENE_Y_OFFSET);
  const cx = T / 2;
  const t = frame % 12;
  const palette = getAxolotlPalette(stage);
  const motion = stage.key === "dead" ? "dead" : (stage.motion ?? stage.key);
  let o = 0;
  let driftX = 0;
  let wag = 0;
  let gillExt = null;
  let gillDroop = 0;
  let blink = false;
  let bubbles = false;
  if (motion === "happy") {
    o = [0, -1, -2, -2, -1, 0, 0, 1, 2, 2, 1, 0][t];
    driftX = [0, 0, -1, -1, 0, 0, 0, 0, 1, 1, 0, 0][t];
    wag = [0, -1, 0, 1, 0, -1, 0, 1, 0, -1, 0, 1][t];
    gillExt = (i) => ((t + i * 2) % 6 < 2 ? 1 : 0);
    blink = t === 11;
    bubbles = true;
  } else if (motion === "healthy") {
    o = [0, -1, -1, -1, 0, 0, 0, 1, 1, 1, 0, 0][t];
    driftX = [0, 0, -1, -1, 0, 0, 0, 0, 1, 1, 0, 0][t];
    wag = [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0][t];
    gillExt = (i) => ((t + i * 2) % 12 < 3 ? 1 : 0);
    blink = t === 11;
    bubbles = true;
  } else if (motion === "unhappy") {
    o = 1 + (t % 12 < 6 ? 0 : 1);
    wag = 1 + (t % 12 < 6 ? 0 : 1);
    gillExt = (i) => ((t + i * 2) % 12 < 2 ? 1 : 0);
    blink = t === 11;
  } else if (motion === "stressed") {
    o = t % 2 === 0 ? -1 : 0;
    driftX = t % 2 === 0 ? -1 : 1;
    wag = t % 2;
    gillExt = (i) => ((t + i) % 3 < 1 ? 1 : 0);
  } else if (motion === "unhealthy") {
    o = 2 + (t % 12 < 6 ? 0 : -1);
    wag = 2;
    gillDroop = 1;
  }
  const ox = cx + driftX;
  drawAxolotlTail(ctx, palette, ox, o, wag);
  drawAxolotlGills(ctx, palette, ox, o, gillExt, gillDroop);
  drawAxolotlBody(ctx, palette, ox, o);
  drawAxolotlFace(ctx, stage.key, palette, ox, o, blink);
  if (bubbles) {
    const rise1 = 20 - (t % 12);
    if (rise1 > 6) px(ctx, "#9ad7f2", cx + 10 + (t % 2), rise1, 1, 1);
    const rise2 = 20 - ((t + 7) % 12);
    if (rise2 > 6) px(ctx, "#c7e8f8", cx + 13 - (t % 2), rise2, 1, 1);
  }
  ctx.restore();
}

// eslint-disable-next-line react-refresh/only-export-components
export function drawCompanionCharacter(ctx, frame, stage, petType) {
  if (petType === "axolotl") {
    drawAxolotlCharacter(ctx, frame, stage);
    return;
  }
  if (petType === "alien") {
    drawAlienCharacter(ctx, frame, stage);
    return;
  }
  if (petType === "ghost") {
    drawGhostCharacter(ctx, frame, stage);
    return;
  }
  if (petType === "robot") {
    drawRobotCharacter(ctx, frame, stage);
    return;
  }
  if (petType === "slime") {
    drawSlimeCharacter(ctx, frame, stage);
    return;
  }
  drawDogCharacter(ctx, frame, stage);
}

// RPG uses its own companion selection and never inherits the app companion's
// health. Keep this healthy stage available to other game surfaces.
// eslint-disable-next-line react-refresh/only-export-components
export function getHealthyCompanionStage() {
  return getPetStage(100, { happy: "Happy" }, true);
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
  petType = "dog",
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

function CompanionOptionCanvas({ stage, petType = "dog" }) {
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
  // Today's XP, shown under the health bar when provided
  dailyXp = null,
  dailyGoalXp = 0,
  // Custom companion name; falls back to the localized default when empty.
  petName = "",
  petType = "dog",
  companionLevel = 1,
  // When provided, a pencil button next to the title opens the customize modal.
  onCustomizePet = null,
  // Optional manga speech balloon { text } — rendered at the pet's top-right.
  questBubble = null,
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
    >
      <VStack spacing={{ base: 3, md: 4 }} align="stretch">
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
                      <VStack
                        align="stretch"
                        spacing={{ base: 1.5, md: 2 }}
                        mt={{ base: 2, md: 2.5 }}
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
                    );
                  })()
                : null}
            </VStack>
          </VStack>
        </HStack>

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
        >
          <ModalHeader fontSize="md" fontWeight="bold" pb={2}>
            {customizeModalCopy.edit}
          </ModalHeader>
          <ModalBody>
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
