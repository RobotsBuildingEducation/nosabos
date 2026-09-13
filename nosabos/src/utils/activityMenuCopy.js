import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";

export const ACTIVITY_MENU_COPY = {
  settings: {
    en: "Settings",
    es: "Configuración",
    pt: "Configurações",
    it: "Impostazioni",
    fr: "Paramètres",
    de: "Einstellungen",
    ja: "設定",
    hi: "सेटिंग्स",
    ar: "الإعدادات",
    zh: "设置",
  },
  immersion: {
    en: "Immersion Practice",
    es: "Práctica de inmersión",
    pt: "Prática de imersão",
    it: "Pratica di immersione",
    fr: "Pratique d'immersion",
    de: "Immersionsübung",
    ja: "イマージョン練習",
    hi: "इमर्शन अभ्यास",
    ar: "تدريب الانغماس",
    zh: "沉浸练习",
  },
  assistant: {
    en: "Assistant",
    es: "Asistente",
    pt: "Assistente",
    it: "Assistente",
    fr: "Assistant",
    de: "Assistent",
    ja: "アシスタント",
    hi: "सहायक",
    ar: "المساعد",
    zh: "助手",
  },
  memory: {
    en: "Memory",
    es: "Memoria",
    pt: "Memória",
    it: "Memoria",
    fr: "Mémoire",
    de: "Erinnerung",
    ja: "メモリー",
    hi: "स्मृति",
    ar: "الذاكرة",
    zh: "记忆",
  },
  mode: {
    en: "Menu",
    es: "Modo",
    pt: "Modo",
    it: "Modalità",
    fr: "Mode",
    de: "Menü",
    ja: "モード",
    hi: "मोड",
    ar: "الأنماط",
    zh: "模式",
  },
  exitLesson: {
    en: "Exit lesson",
    es: "Salir de la lección",
    pt: "Sair da lição",
    it: "Esci dalla lezione",
    fr: "Quitter la leçon",
    de: "Lektion verlassen",
    ja: "レッスンを終了",
    hi: "पाठ से बाहर निकलें",
    ar: "الخروج من الدرس",
    zh: "退出课程",
  },
  back: {
    en: "Back",
    es: "Volver",
    pt: "Voltar",
    it: "Indietro",
    fr: "Retour",
    de: "Zurück",
    ja: "戻る",
    hi: "वापस",
    ar: "رجوع",
    zh: "返回",
  },
  closeMenu: {
    en: "Close menu",
    es: "Cerrar menú",
    pt: "Fechar menu",
    it: "Chiudi menu",
    fr: "Fermer le menu",
    de: "Menü schließen",
    ja: "メニューを閉じる",
    hi: "मेनू बंद करें",
    ar: "إغلاق القائمة",
    zh: "关闭菜单",
  },
};

const SUPPORTED_SET = new Set(SUPPORT_LANGUAGE_CODES);

export function normalizeSupportCode(rawLang, fallback = "en") {
  const code = String(rawLang || "").trim().toLowerCase();
  if (SUPPORTED_SET.has(code)) return code;
  const [base] = code.split(/[-_]/);
  if (SUPPORTED_SET.has(base)) return base;
  return fallback;
}

export function getActivityMenuLabels(rawLang, t = {}) {
  const lang = normalizeSupportCode(rawLang, "en");

  // Settings label: guard against English fallback leakage into non-English languages
  let settings =
    t?.app_settings ||
    t?.ra_btn_settings ||
    t?.app_settings_aria ||
    ACTIVITY_MENU_COPY.settings[lang];
  if (
    lang !== "en" &&
    (settings === "Settings" || settings === "Einstellungen öffnen")
  ) {
    settings = ACTIVITY_MENU_COPY.settings[lang];
  }

  // Immersion Practice
  let immersion =
    t?.real_world_tasks_title || ACTIVITY_MENU_COPY.immersion[lang];
  if (lang !== "en" && immersion === "Immersion Practice") {
    immersion = ACTIVITY_MENU_COPY.immersion[lang];
  }

  // Assistant
  let assistant = t?.app_help_chat || ACTIVITY_MENU_COPY.assistant[lang];
  if (lang !== "en" && lang !== "fr" && assistant === "Assistant") {
    assistant = ACTIVITY_MENU_COPY.assistant[lang];
  }

  // Memory
  let memory = t?.app_notes || ACTIVITY_MENU_COPY.memory[lang];
  if (lang !== "en" && memory === "Memory") {
    memory = ACTIVITY_MENU_COPY.memory[lang];
  }

  // Mode
  let mode = t?.app_mode_menu || ACTIVITY_MENU_COPY.mode[lang];
  if (lang !== "en" && (mode === "Menu" || mode === "Mode Menu")) {
    mode = ACTIVITY_MENU_COPY.mode[lang];
  }

  // Exit lesson
  let exitLesson = t?.exit_lesson || ACTIVITY_MENU_COPY.exitLesson[lang];

  // Back
  let back = t?.back || ACTIVITY_MENU_COPY.back[lang];

  // Close menu
  const closeMenu = ACTIVITY_MENU_COPY.closeMenu[lang];

  return {
    settings,
    immersion,
    assistant,
    memory,
    mode,
    exitLesson,
    back,
    closeMenu,
  };
}
