import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  HStack,
  IconButton,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FiHeart, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { TbEdit } from "react-icons/tb";
import {
  WaveBar,
  WAVE_BAR_PROGRESS_END,
  WAVE_BAR_PROGRESS_START,
} from "./WaveBar";
import { useThemeStore } from "../useThemeStore";
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
import { getEffectivePetType, normalizePetType } from "../utils/petTypes";
import CompanionCustomizeModal from "./CompanionCustomizeModal";
import { getCustomizeModalCopy } from "./companionCustomizeCopy";

const TILE = 16;
const SCALE = 3;
const T = TILE * SCALE;
const SCENE_Y_OFFSET = 4;
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
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
      motion: "happy",
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
      face: "happy",
      decoration: null,
      showTongue: false,
    };
  }
  return {
    key: "happy",
    motion: "healthy",
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
    face: "healthy",
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

function drawAlienBody(ctx, palette, cx, topY) {
  px(ctx, palette.body, cx - 8, topY, 16, 1);
  px(ctx, palette.body, cx - 10, topY + 1, 20, 1);
  px(ctx, palette.body, cx - 12, topY + 2, 24, 1);
  px(ctx, palette.body, cx - 13, topY + 3, 26, 16);
  px(ctx, palette.body, cx - 12, topY + 19, 24, 1);
  px(ctx, palette.body, cx - 10, topY + 20, 20, 1);
  px(ctx, palette.body, cx - 8, topY + 21, 16, 1);
  px(ctx, palette.body2, cx - 10, topY + 20, 20, 1);
  px(ctx, palette.body2, cx - 8, topY + 21, 16, 1);
}

function drawAlienLegs(ctx, palette, cx, topY, stride) {
  const y = topY + 21;
  px(ctx, palette.leg, cx - 10 + stride, y, 3, 3);
  px(ctx, palette.leg, cx - 5, y, 3, 3);
  px(ctx, palette.leg, cx + 1, y, 3, 3);
  px(ctx, palette.leg, cx + 6 - stride, y, 3, 3);
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
    px(ctx, heart, cx + 5, topY - 6, 2, 1);
    px(ctx, heart, cx + 8, topY - 6, 2, 1);
    px(ctx, heart, cx + 5, topY - 5, 5, 1);
    px(ctx, heart, cx + 6, topY - 4, 3, 1);
    px(ctx, heart, cx + 7, topY - 3, 1, 1);
    return;
  }

  if (key === "stressed") {
    const bounce = frame % 6 < 3 ? 0 : 1;
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
  const phase = frame % 6;
  const motion = stage.motion ?? stage.key;
  const palette = getAlienPalette(stage);
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
        ? 1
        : phase === 3
          ? -1
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
  const topY = 6 + bob;
  const ox = cx + xShift;

  drawAlienBody(ctx, palette, ox, topY);
  drawAlienLegs(ctx, palette, ox, topY, stride);
  drawAlienFace(ctx, stage.key, palette, ox, topY);
  drawAlienProps(ctx, stage.key, ox, topY, frame);

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

function drawGhostBody(ctx, palette, cx, gy) {
  for (let i = 0; i < GHOST_HW.length; i++) {
    px(ctx, palette.body, cx - GHOST_HW[i], gy + i, 2 * GHOST_HW[i], 1);
  }
  const b = gy + GHOST_HW.length;
  px(ctx, palette.body, cx - 12, b, 7, 1);
  px(ctx, palette.body, cx - 3, b, 6, 1);
  px(ctx, palette.body, cx + 5, b, 7, 1);
  px(ctx, palette.body, cx - 11, b + 1, 5, 1);
  px(ctx, palette.body, cx - 2, b + 1, 4, 1);
  px(ctx, palette.body, cx + 6, b + 1, 5, 1);
  for (let i = 4; i < GHOST_HW.length; i++) {
    px(ctx, palette.body2, cx + GHOST_HW[i] - 1, gy + i, 1, 1);
  }
  px(ctx, palette.body2, cx - 11, b + 1, 5, 1);
  px(ctx, palette.body2, cx - 2, b + 1, 4, 1);
  px(ctx, palette.body2, cx + 6, b + 1, 5, 1);
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
  const phase = frame % 6;
  const palette = getGhostPalette(stage);
  const bob = stage.key === "dead" ? 0 : [0, -1, -1, 0, 1, 0][phase];
  const gy = 7 + bob;
  drawGhostBody(ctx, palette, cx, gy);
  drawGhostEyes(ctx, palette, stage.key, cx, gy);
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

function drawRobotBody(ctx, p, cx, by, key, phase) {
  const blink = key !== "dead" && phase < 3;
  px(ctx, p.metal, cx - 1, 9 + by, 2, 4);
  if (key !== "dead") {
    px(ctx, p.bulb, cx - 1, 6 + by, 2, 2);
    if (blink) px(ctx, p.bulb, cx, 5 + by, 1, 1);
  } else {
    px(ctx, p.metalDark, cx - 1, 6 + by, 2, 2);
  }
  px(ctx, p.metal, cx - 9, 12 + by, 18, 1);
  px(ctx, p.metal, cx - 10, 13 + by, 20, 8);
  px(ctx, p.metal, cx - 9, 21 + by, 18, 1);
  px(ctx, p.metalDark, cx + 9, 13 + by, 1, 8);
  px(ctx, p.metalDark, cx - 10, 20 + by, 20, 1);
  px(ctx, p.screen, cx - 7, 14 + by, 14, 6);
  px(ctx, p.metal, cx - 8, 23 + by, 16, 1);
  px(ctx, p.metal, cx - 9, 24 + by, 18, 7);
  px(ctx, p.metal, cx - 8, 31 + by, 16, 1);
  px(ctx, p.metalDark, cx + 8, 24 + by, 1, 7);
  px(ctx, p.metal, cx - 11, 25 + by, 2, 4);
  px(ctx, p.metal, cx + 9, 25 + by, 2, 4);
  px(ctx, key === "dead" ? p.metalDark : p.eye, cx - 1, 26 + by, 2, 2);
  px(ctx, p.wheel, cx - 7, 32 + by, 14, 3);
  px(ctx, p.metalDark, cx - 7, 34 + by, 14, 1);
  px(ctx, p.metal, cx - 1, 32 + by, 2, 2);
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
  const phase = frame % 6;
  const key = stage.key;
  const palette = getRobotPalette(stage);
  const bob = key === "dead" ? 0 : phase === 2 || phase === 4 ? -1 : 0;
  const jitter = key === "stressed" ? (phase % 2 === 0 ? -1 : 1) : 0;
  drawRobotBody(ctx, palette, cx + jitter, bob, key, phase);
  drawRobotFace(ctx, palette, key, cx + jitter, bob);
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

function getSlimePalette(stage) {
  if (stage.key === "dead") return DEAD_SLIME;
  if (stage.key === "unhealthy") return SICK_SLIME;
  return SLIME;
}

function drawSlimeBody(ctx, p, cx, topY) {
  // ball-on-stalk antenna
  px(ctx, p.outline, cx, topY - 2, 1, 2);
  px(ctx, p.outline, cx + 1, topY - 3, 1, 1);
  px(ctx, p.outline, cx + 2, topY - 4, 1, 1);
  px(ctx, p.outline, cx + 3, topY - 4, 1, 1);
  px(ctx, p.body, cx + 4, topY - 6, 3, 3);
  px(ctx, p.outline, cx + 4, topY - 7, 3, 1);
  px(ctx, p.outline, cx + 4, topY - 3, 3, 1);
  px(ctx, p.outline, cx + 3, topY - 6, 1, 3);
  px(ctx, p.outline, cx + 7, topY - 6, 1, 3);
  // body (outline + inset fill)
  const n = SLIME_HW.length;
  for (let i = 0; i < n; i++) {
    const w = SLIME_HW[i];
    px(ctx, p.outline, cx - w, topY + i, 2 * w, 1);
    if (i > 0 && i < n - 1) px(ctx, p.body, cx - (w - 1), topY + i, 2 * (w - 1), 1);
  }
  // soft green rim
  px(ctx, p.hi, cx - 4, topY + 1, 8, 1);
  px(ctx, p.hi, cx - 7, topY + 2, 4, 1);
  px(ctx, p.hi, cx + 4, topY + 2, 4, 1);
}

function drawSlimeEyes(ctx, p, key, cx, topY) {
  const E = p.eye;
  const G = p.gold;
  const ey = topY + 5;
  const base = (ex) => {
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
  const phase = frame % 6;
  const palette = getSlimePalette(stage);
  const toff = stage.key === "dead" ? 0 : [0, 0, -1, -1, 0, 0][phase];
  const topY = 12 + toff;
  drawSlimeBody(ctx, palette, cx, topY);
  drawSlimeEyes(ctx, palette, stage.key, cx, topY);
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
function drawAxolotlGills(ctx, p, cx, o) {
  const g = p.gill;
  const t = p.gillTip;
  const s = p.gillSoft;
  px(ctx, g, cx - 11, 10 + o, 4, 3); px(ctx, t, cx - 13, 9 + o, 2, 2); px(ctx, s, cx - 10, 11 + o, 1, 1);
  px(ctx, g, cx - 12, 14 + o, 4, 3); px(ctx, t, cx - 14, 15 + o, 2, 2); px(ctx, s, cx - 11, 15 + o, 1, 1);
  px(ctx, g, cx - 13, 18 + o, 4, 3); px(ctx, t, cx - 15, 20 + o, 2, 2); px(ctx, s, cx - 12, 19 + o, 1, 1);
  px(ctx, g, cx + 7, 10 + o, 4, 3); px(ctx, t, cx + 11, 9 + o, 2, 2); px(ctx, s, cx + 9, 11 + o, 1, 1);
  px(ctx, g, cx + 8, 14 + o, 4, 3); px(ctx, t, cx + 12, 15 + o, 2, 2); px(ctx, s, cx + 10, 15 + o, 1, 1);
  px(ctx, g, cx + 9, 18 + o, 4, 3); px(ctx, t, cx + 13, 20 + o, 2, 2); px(ctx, s, cx + 11, 19 + o, 1, 1);
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
function drawAxolotlFace(ctx, key, p, cx, o) {
  const E = p.eye;
  const ey = 12 + o;
  const pair = (rows) =>
    rows.forEach(([dx, dy, w = 1, h = 1]) => {
      px(ctx, E, cx - dx, ey + dy, w, h);
      px(ctx, E, cx + dx - (w - 1), ey + dy, w, h);
    });
  const drawEye = (originX, rows) => {
    rows.forEach(([x, y, w = 1, h = 1, fill = E]) => {
      px(ctx, fill, originX + x, ey + y, w, h);
    });
  };
  const drawEyePair = (leftRows, rightRows = leftRows) => {
    drawEye(cx - 9, leftRows);
    drawEye(cx + 5, rightRows);
  };
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
  if (key === "happy") {
    drawEyePair([[0, 1], [1, 0, 3, 1], [4, 1]]); // tiny crescent eyes
  } else if (key === "healthy") {
    drawEyePair([
      [1, 0, 2, 1],
      [0, 1, 4, 1],
      [1, 2, 2, 1],
      [1, 0, 1, 1, "#ffffff"],
    ]); // soft bright eyes
  } else if (key === "unhappy") {
    drawEyePair(
      [[0, 0, 3, 1], [1, 1, 2, 1], [2, 2]],
      [[1, 0, 3, 1], [1, 1, 2, 1], [1, 2]],
    ); // gentle droop
  } else if (key === "stressed") {
    drawEyePair(
      [[0, 0, 2, 1], [1, 1, 2, 1], [2, 2]],
      [[2, 0, 2, 1], [1, 1, 2, 1], [1, 2]],
    ); // small uneasy squint
  } else if (key === "unhealthy") {
    drawEyePair([[0, 1, 4, 1], [1, 2, 2, 1]]); // sleepy half-lids
  }
}

function drawAxolotlCharacter(ctx, frame, stage) {
  ctx.save();
  ctx.translate(0, SCENE_Y_OFFSET);
  const cx = T / 2;
  const phase = frame % 6;
  const palette = getAxolotlPalette(stage);
  const o = stage.key === "dead" ? 0 : [0, -1, -1, 0, 1, 0][phase];
  const wag = stage.key === "dead" ? 0 : [0, 0, 1, 1, 0, 0][phase];
  drawAxolotlTail(ctx, palette, cx, o, wag);
  drawAxolotlGills(ctx, palette, cx, o);
  drawAxolotlBody(ctx, palette, cx, o);
  drawAxolotlFace(ctx, stage.key, palette, cx, o);
  ctx.restore();
}

function drawCompanionCharacter(ctx, frame, stage, petType) {
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

function CompanionCanvas({
  stage,
  petType = "dog",
  isLightTheme,
  isCelebration = false,
  celebrationTone = "default",
}) {
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(0);
  const resolvedPetType = normalizePetType(petType);
  const isUnlockCelebration = isCelebration && celebrationTone === "unlock";
  const canvasBackground = isCelebration
    ? isUnlockCelebration
      ? "rgba(255, 255, 255, 0.74)"
      : isLightTheme
      ? "rgba(255, 253, 249, 0.52)"
      : "rgba(255, 255, 255, 0.22)"
    : stage.background;

  useEffect(() => {
    if (stage.key === "dead") {
      setFrame(0);
      return undefined;
    }
    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % 6);
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
      borderRadius={{ base: "lg", md: "xl" }}
      border="1px solid"
      borderColor={
        isUnlockCelebration
          ? "rgba(14, 165, 233, 0.18)"
          : isCelebration
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

export default function DailyGoalPetPanel({
  lang = "en",
  health = DAILY_GOAL_PET_DEFAULT_HEALTH,
  variant = "setup",
  celebrationTone = "default",
  showPreview = true,
  // Custom companion name; falls back to the localized default ("Your
  // companion") when empty. Edited from the daily-quest pet panel.
  petName = "",
  petType = "dog",
  companionLevel = 1,
  // When provided, a pencil button by the title opens the customize modal.
  onCustomizePet = null,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const resolvedLang = normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE);
  const copy = useMemo(() => getCopy(resolvedLang), [resolvedLang]);
  const safeHealth = clampDailyGoalPetHealth(health);
  const safeCompanionLevel = Math.max(
    1,
    Math.floor(Number(companionLevel) || 1),
  );
  const displayTitle =
    (typeof petName === "string" && petName.trim()) || copy.title;
  const resolvedPetType = getEffectivePetType(petType, safeCompanionLevel);
  const companionLevelText = `${getCompanionLevelLabel(
    resolvedLang,
  )} ${safeCompanionLevel}`;
  const stage = useMemo(
    () => getPetStage(safeHealth, copy, isLightTheme),
    [copy, isLightTheme, safeHealth],
  );
  const isCelebration = variant === "celebration";
  const isUnlockCelebration = isCelebration && celebrationTone === "unlock";
  const canCustomize = typeof onCustomizePet === "function" && !isCelebration;
  const customizeModalCopy = getCustomizeModalCopy(resolvedLang);
  const customizeModal = useDisclosure();
  const rewardColor = isLightTheme ? "#48765f" : "green.200";
  const penaltyColor = isLightTheme ? "#a06a3b" : "orange.200";
  const previewCardBg = isLightTheme ? APP_SURFACE_ELEVATED : "blackAlpha.220";
  const panelBg = isUnlockCelebration
    ? "linear-gradient(180deg, rgba(252, 254, 255, 0.96) 0%, rgba(232, 250, 255, 0.92) 100%)"
    : isCelebration
    ? isLightTheme
      ? stage.background
      : "rgba(255, 255, 255, 0.18)"
    : stage.background;
  const panelBorderColor = isUnlockCelebration
    ? "rgba(207, 250, 254, 0.86)"
    : isCelebration
    ? "rgba(255, 255, 255, 0.38)"
    : isLightTheme
      ? APP_BORDER
      : "transparent";
  const panelTextColor = isUnlockCelebration
    ? "#1f2937"
    : isLightTheme
      ? APP_TEXT_PRIMARY
      : undefined;
  const panelSecondaryTextColor = isUnlockCelebration
    ? "#0f766e"
    : isLightTheme
      ? APP_TEXT_SECONDARY
      : undefined;
  const panelBadgeBg = isUnlockCelebration
    ? "rgba(6, 182, 212, 0.16)"
    : isLightTheme
      ? stage.badgeBg
      : undefined;
  const panelBadgeColor = isUnlockCelebration
    ? "#0f766e"
    : isLightTheme
      ? stage.badgeColor
      : undefined;

  return (
    <>
    <Box
      bg={panelBg}
      border="1px solid"
      borderColor={panelBorderColor}
      borderRadius="2xl"
      boxShadow={
        isUnlockCelebration
          ? "inset 0 1px 0 rgba(255,255,255,0.72), 0 18px 38px rgba(8,145,178,0.16)"
          : undefined
      }
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
            <CompanionCanvas
              stage={stage}
              petType={resolvedPetType}
              isLightTheme={isLightTheme}
              isCelebration={isCelebration}
              celebrationTone={celebrationTone}
            />
            <Badge
              colorScheme={stage.colorScheme}
              bg={panelBadgeBg}
              color={panelBadgeColor}
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
                    alignSelf="center"
                    flexShrink={0}
                    color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
                    _hover={{
                      bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.200",
                    }}
                    onClick={customizeModal.onOpen}
                  />
                ) : null}
                <Text
                  fontSize={{ base: "sm", sm: "lg", md: "xl" }}
                  fontWeight="bold"
                  lineHeight="1.1"
                  color={panelTextColor}
                  noOfLines={2}
                  wordBreak="break-word"
                >
                  {displayTitle}
                </Text>
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
                    fontSize={{ base: "xs", md: "sm" }}
                    fontWeight="semibold"
                    color={panelSecondaryTextColor}
                  >
                    {copy.health}
                  </Text>
                </HStack>
                <Text
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="bold"
                  lineHeight="1"
                  color={panelTextColor}
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
                  // Health is a static state here (e.g. full at onboarding) — only
                  // animate the fill when a celebration is showing a health gain.
                  animateFill={isCelebration}
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
              borderRadius="xl"
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
              borderRadius="xl"
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
      <CompanionCustomizeModal
        isOpen={customizeModal.isOpen}
        onClose={customizeModal.onClose}
        lang={resolvedLang}
        isLightTheme={isLightTheme}
        petName={petName}
        petType={petType}
        companionLevel={safeCompanionLevel}
        placeholder={copy.title}
        stage={stage}
        drawCompanion={drawCompanionCharacter}
        onSubmit={onCustomizePet}
      />
    ) : null}
    </>
  );
}
