// src/utils/cefrLevelInfo.js

export const CEFR_LEVELS = Object.freeze([
  "Pre-A1",
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
]);

export const CEFR_LEVEL_INFO = Object.freeze({
  "Pre-A1": {
    label: "A0",
    displayLabel: "A0",
    color: "#8B5CF6",
    gradient: "linear(135deg, #A78BFA, #8B5CF6)",
    name: {
      en: "Ultimate Beginner",
      es: "Principiante Total",
      pt: "Iniciante absoluto",
      it: "Principiante assoluto",
      fr: "Grand débutant",
      de: "Absoluter Anfänger",
      ja: "完全初心者",
      hi: "पूर्ण शुरुआती",
      ar: "مبتدئ تمامًا",
      zh: "完全初学者",
      ru: "Абсолютный новичок",
    },
    description: {
      en: "First words and recognition",
      es: "Primeras palabras y reconocimiento",
      pt: "Primeiras palavras e reconhecimento",
      it: "Prime parole e riconoscimento",
      fr: "Premiers mots et reconnaissance",
      de: "Erste Wörter und Wiedererkennung",
      ja: "最初の単語と認識",
      hi: "पहले शब्द और पहचान",
      ar: "أول كلمات والتعرّف عليها",
      zh: "最初的词语与识别",
      ru: "Первые слова и распознавание",
    },
  },
  A1: {
    label: "A1",
    displayLabel: "A1",
    color: "#3B82F6",
    gradient: "linear(135deg, #60A5FA, #3B82F6)",
    name: {
      en: "Beginner",
      es: "Principiante",
      pt: "Iniciante",
      it: "Principiante",
      fr: "Débutant",
      de: "Anfänger",
      ja: "初心者",
      hi: "शुरुआती",
      ar: "مبتدئ",
      zh: "初学者",
      ru: "Начинающий",
    },
    description: {
      en: "Basic survival language",
      es: "Lenguaje básico de supervivencia",
      pt: "Linguagem básica de sobrevivência",
      it: "Lingua di sopravvivenza di base",
      fr: "Langue de survie de base",
      de: "Grundlegende Alltagssprache",
      ja: "基本的なサバイバル表現",
      hi: "बुनियादी रोज़मर्रा की भाषा",
      ar: "لغة أساسية للحياة اليومية",
      zh: "基础生存表达",
      ru: "Базовые фразы для общения",
    },
  },
  A2: {
    label: "A2",
    displayLabel: "A2",
    color: "#8B5CF6",
    gradient: "linear(135deg, #A78BFA, #8B5CF6)",
    name: {
      en: "Elementary",
      es: "Elemental",
      pt: "Elementar",
      it: "Elementare",
      fr: "Élémentaire",
      de: "Grundstufe",
      ja: "初級",
      hi: "प्रारंभिक",
      ar: "أساسي",
      zh: "初级",
      ru: "Элементарный",
    },
    description: {
      en: "Simple everyday communication",
      es: "Comunicación cotidiana simple",
      pt: "Comunicação cotidiana simples",
      it: "Comunicazione quotidiana semplice",
      fr: "Communication simple du quotidien",
      de: "Einfache Alltagskommunikation",
      ja: "簡単な日常コミュニケーション",
      hi: "सरल रोज़मर्रा का संचार",
      ar: "تواصل يومي بسيط",
      zh: "简单日常沟通",
      ru: "Простое ежедневное общение",
    },
  },
  B1: {
    label: "B1",
    displayLabel: "B1",
    color: "#A855F7",
    gradient: "linear(135deg, #C084FC, #A855F7)",
    name: {
      en: "Intermediate",
      es: "Intermedio",
      pt: "Intermediário",
      it: "Intermedio",
      fr: "Intermédiaire",
      de: "Mittelstufe",
      ja: "中級",
      hi: "मध्यवर्ती",
      ar: "متوسط",
      zh: "中级",
      ru: "Средний",
    },
    description: {
      en: "Handle everyday situations",
      es: "Manejo de situaciones cotidianas",
      pt: "Lidar com situações do dia a dia",
      it: "Gestire situazioni quotidiane",
      fr: "Gérer les situations quotidiennes",
      de: "Alltagssituationen bewältigen",
      ja: "日常場面に対応",
      hi: "रोज़मर्रा की स्थितियों को संभालना",
      ar: "التعامل مع مواقف الحياة اليومية",
      zh: "处理日常情境",
      ru: "Понимание повседневных ситуаций",
    },
  },
  B2: {
    label: "B2",
    displayLabel: "B2",
    color: "#F97316",
    gradient: "linear(135deg, #FB923C, #F97316)",
    name: {
      en: "Upper Intermediate",
      es: "Intermedio Alto",
      pt: "Intermediário avançado",
      it: "Intermedio superiore",
      fr: "Intermédiaire avancé",
      de: "Obere Mittelstufe",
      ja: "中上級",
      hi: "उच्च मध्यवर्ती",
      ar: "متوسط أعلى",
      zh: "中高级",
      ru: "Выше среднего",
    },
    description: {
      en: "Complex discussions",
      es: "Discusiones complejas",
      pt: "Discussões complexas",
      it: "Discussioni complesse",
      fr: "Discussions complexes",
      de: "Komplexe Gespräche",
      ja: "複雑な話し合い",
      hi: "जटिल चर्चाएं",
      ar: "نقاشات أكثر تعقيدًا",
      zh: "复杂讨论",
      ru: "Сложные темы и обсуждения",
    },
  },
  C1: {
    label: "C1",
    displayLabel: "C1",
    color: "#EF4444",
    gradient: "linear(135deg, #F87171, #EF4444)",
    name: {
      en: "Advanced",
      es: "Avanzado",
      pt: "Avançado",
      it: "Avanzato",
      fr: "Avancé",
      de: "Fortgeschritten",
      ja: "上級",
      hi: "उन्नत",
      ar: "متقدم",
      zh: "高级",
      ru: "Продвинутый",
    },
    description: {
      en: "Sophisticated language use",
      es: "Uso sofisticado del idioma",
      pt: "Uso sofisticado do idioma",
      it: "Uso sofisticato della lingua",
      fr: "Usage sophistiqué de la langue",
      de: "Anspruchsvolle Sprachverwendung",
      ja: "洗練された言語運用",
      hi: "भाषा का परिष्कृत उपयोग",
      ar: "استخدام متطور للغة",
      zh: "成熟的语言运用",
      ru: "Уверенное и гибкое владение языком",
    },
  },
  C2: {
    label: "C2",
    displayLabel: "C2",
    color: "#EC4899",
    gradient: "linear(135deg, #F472B6, #EC4899)",
    name: {
      en: "Mastery",
      es: "Maestría",
      pt: "Domínio",
      it: "Padronanza",
      fr: "Maîtrise",
      de: "Meisterschaft",
      ja: "熟達",
      hi: "निपुणता",
      ar: "إتقان",
      zh: "精通",
      ru: "В совершенстве",
    },
    description: {
      en: "Near-native proficiency",
      es: "Competencia casi nativa",
      pt: "Proficiência quase nativa",
      it: "Competenza quasi nativa",
      fr: "Compétence quasi native",
      de: "Nahezu muttersprachliche Kompetenz",
      ja: "ネイティブに近い熟達度",
      hi: "मूल वक्ता जैसी दक्षता",
      ar: "إتقان قريب من المتحدث الأصلي",
      zh: "接近母语水平",
      ru: "Владение на уровне носителя",
    },
  },
});

export function normalizeLevelKey(level) {
  if (!level || typeof level !== "string") return "Pre-A1";
  const trimmed = level.trim();
  if (/^(?:pre[-_]?a1|a0)$/i.test(trimmed)) return "Pre-A1";
  const upper = trimmed.toUpperCase();
  if (CEFR_LEVELS.includes(upper)) return upper;
  return "Pre-A1";
}

export function getCefrLevelDetails(level, lang = "en") {
  const key = normalizeLevelKey(level);
  const info = CEFR_LEVEL_INFO[key] || CEFR_LEVEL_INFO["Pre-A1"];
  const langKey = typeof lang === "string" ? lang.toLowerCase().split("-")[0] : "en";
  const name =
    info.name[langKey] ||
    info.name[lang] ||
    info.name.en ||
    "";
  const description =
    info.description[langKey] ||
    info.description[lang] ||
    info.description.en ||
    "";

  return {
    ...info,
    key,
    name,
    description,
  };
}
