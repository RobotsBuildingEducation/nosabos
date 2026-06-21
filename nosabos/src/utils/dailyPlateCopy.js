// src/utils/dailyPlateCopy.js
//
// Shared localized copy + course metadata for the Daily Plate surfaces
// (DailyPlate card, DailyPlateHome, and App's session conductor). Lives
// outside the component files so Fast Refresh keeps working.
import { PiCardsBold, PiPath } from "react-icons/pi";
import { RiBook2Line, RiChat3Line } from "react-icons/ri";
import { LuLanguages } from "react-icons/lu";

import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";
import { getGermanCopy } from "./germanCopy";

export const plateUiCopy = (lang, copy) => {
  const normalized = normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE);
  if (copy[normalized]) return copy[normalized];
  if (normalized === "de") return getGermanCopy(copy.en) || copy.en;
  return copy.en;
};

export const PLATE_COURSE_META = {
  review: {
    icon: PiCardsBold,
    label: {
      en: "Flash Cards",
      es: "Tarjetas",
      pt: "Cartões",
      fr: "Cartes",
      it: "Schede",
      ja: "カード",
      zh: "闪卡",
      ru: "Карточки",
      ar: "البطاقات",
      hi: "फ्लैशकार्ड",
    },
  },
  learn: {
    icon: PiPath,
    label: {
      en: "Lessons",
      es: "Lecciones",
      pt: "Lições",
      fr: "Leçons",
      it: "Lezioni",
      ja: "レッスン",
      zh: "课程",
      ru: "Уроки",
      ar: "الدروس",
      hi: "पाठ",
    },
  },
  speak: {
    icon: RiBook2Line,
    label: {
      en: "Tutor",
      es: "Tutor",
      pt: "Tutor",
      fr: "Tuteur",
      it: "Tutor",
      ja: "チューター",
      zh: "导师",
      ru: "Тьютор",
      ar: "المعلم",
      hi: "ट्यूटर",
    },
  },
  conversation: {
    icon: RiChat3Line,
    label: {
      en: "Conversation",
      es: "Conversación",
      pt: "Conversação",
      fr: "Conversation",
      it: "Conversazione",
      ja: "会話",
      zh: "对话",
      ru: "Разговор",
      ar: "محادثة",
      hi: "बातचीत",
    },
  },
  phonics: {
    icon: LuLanguages,
    label: {
      en: "Phonics",
      es: "Fonética",
      pt: "Fonética",
      fr: "Phonétique",
      it: "Fonetica",
      ja: "フォニックス",
      zh: "自然拼读",
      ru: "Фонетика",
      ar: "الصوتيات",
      hi: "ध्वनिकी",
    },
  },
};

export const PLATE_TITLE_COPY = {
  en: "Daily Quest",
  es: "Misión diaria",
  pt: "Missão diária",
  fr: "Quête du jour",
  it: "Missione quotidiana",
  ja: "デイリークエスト",
  zh: "每日任务",
  ru: "Ежедневное задание",
  ar: "المهمة اليومية",
  hi: "दैनिक क्वेस्ट",
};

export const PLATE_CLEARED_COPY = {
  en: "Quests complete!",
  es: "¡Misiones completadas!",
  pt: "Missões concluídas!",
  fr: "Quêtes terminées !",
  it: "Missioni completate!",
  ja: "クエスト完了！",
  zh: "任务完成！",
  ru: "Задания выполнены!",
  ar: "اكتملت المهام!",
  hi: "क्वेस्ट पूरी हुईं!",
};

export const PLATE_BONUS_TOAST_COPY = {
  en: "Bonus added to your daily goal.",
  es: "Bono sumado a tu meta diaria.",
  pt: "Bônus somado à sua meta diária.",
  fr: "Bonus ajouté à ton objectif du jour.",
  it: "Bonus aggiunto al tuo obiettivo di oggi.",
  ja: "ボーナスが今日の目標に加算されました。",
  zh: "奖励已计入今日目标。",
  ru: "Бонус засчитан в цель дня.",
  ar: "أُضيفت المكافأة إلى هدفك اليومي.",
  hi: "बोनस आपके दैनिक लक्ष्य में जुड़ गया।",
};

export const PLATE_EXERCISE_COMPLETE_COPY = {
  en: "Task complete!",
  es: "¡Tarea completada!",
  pt: "Tarefa concluída!",
  fr: "Tâche terminée !",
  it: "Attività completata!",
  ja: "タスク完了！",
  zh: "任务完成！",
  ru: "Задача выполнена!",
  ar: "اكتملت المهمة!",
  hi: "कार्य पूरा हुआ!",
};

export const PLATE_CONTINUE_COPY = {
  en: "Continue",
  es: "Continuar",
  pt: "Continuar",
  fr: "Continuer",
  it: "Continua",
  ja: "続ける",
  zh: "继续",
  ru: "Продолжить",
  ar: "متابعة",
  hi: "जारी रखें",
};

export const PLATE_CLOSE_COPY = {
  en: "Awesome!",
  es: "¡Genial!",
  pt: "Incrível!",
  fr: "Super !",
  it: "Fantastico!",
  ja: "やった！",
  zh: "太棒了！",
  ru: "Отлично!",
  ar: "رائع!",
  hi: "बढ़िया!",
};

export const PLATE_NEXT_COPY = {
  en: "Next",
  es: "Siguiente",
  pt: "Próximo",
  fr: "Suivant",
  it: "Prossimo",
  ja: "次へ",
  zh: "下一项",
  ru: "Далее",
  ar: "التالي",
  hi: "अगला",
};
