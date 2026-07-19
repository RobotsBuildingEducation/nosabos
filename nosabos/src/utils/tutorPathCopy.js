export const TUTOR_PATH_COPY_LANGUAGES = [
  "en",
  "es",
  "pt",
  "it",
  "fr",
  "de",
  "ja",
  "hi",
  "ar",
  "zh",
];

const TUTOR_PATH_COPY = {
  currentLesson: {
    en: "Current Tutor lesson",
    es: "Lección actual",
    pt: "Lição atual",
    it: "Lezione attuale",
    fr: "Leçon actuelle",
    de: "Aktuelle Tutor-Lektion",
    ja: "現在のレッスン",
    hi: "मौजूदा पाठ",
    ar: "الدرس الحالي",
    zh: "当前课程",
  },
  loadingPath: {
    en: "Loading path...",
    es: "Cargando ruta...",
    pt: "Carregando rota...",
    it: "Caricamento percorso...",
    fr: "Chargement du parcours...",
    de: "Lernpfad wird geladen...",
    ja: "パスを読み込み中...",
    hi: "पथ लोड हो रहा है...",
    ar: "جارٍ تحميل المسار...",
    zh: "正在加载路径...",
  },
  noLessons: {
    en: "No lessons found for this level yet.",
    es: "Aún no hay lecciones para este nivel.",
    pt: "Ainda não há lições para este nível.",
    it: "Non ci sono ancora lezioni per questo livello.",
    fr: "Aucune leçon pour ce niveau pour l'instant.",
    de: "Für dieses Level wurden noch keine Lektionen gefunden.",
    ja: "このレベルのレッスンはまだありません。",
    hi: "इस स्तर के लिए अभी कोई पाठ नहीं है।",
    ar: "لا توجد دروس لهذا المستوى حتى الآن.",
    zh: "该等级目前还没有课程。",
  },
  levelComplete: {
    en: "Level complete",
    es: "Nivel completado",
    pt: "Nível concluído",
    it: "Livello completato",
    fr: "Niveau terminé",
    de: "Level abgeschlossen",
    ja: "レベル完了",
    hi: "स्तर पूरा हुआ",
    ar: "اكتمل المستوى",
    zh: "等级完成",
  },
  lockedLessonPreview: {
    en: ", locked lesson preview",
    es: ", vista previa de la lección bloqueada",
    pt: ", pré-visualização da lição bloqueada",
    it: ", anteprima della lezione bloccata",
    fr: ", aperçu de la leçon verrouillée",
    de: ", Vorschau einer gesperrten Lektion",
    ja: "、ロックされたレッスンのプレビュー",
    hi: ", लॉक किए गए पाठ का पूर्वावलोकन",
    ar: "، معاينة درس مقفل",
    zh: "，已锁定课程预览",
  },
  close: {
    en: "Close",
    es: "Cerrar",
    pt: "Fechar",
    it: "Chiudi",
    fr: "Fermer",
    de: "Schließen",
    ja: "閉じる",
    hi: "बंद करें",
    ar: "إغلاق",
    zh: "关闭",
  },
};

function normalizeLanguage(language) {
  return String(language || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
}

export function getTutorPathCopy(key, language = "en") {
  const copy = TUTOR_PATH_COPY[key];
  if (!copy) return "";
  const normalized = normalizeLanguage(language);
  return copy[normalized] || copy.en || "";
}

export const TUTOR_PATH_COPY_KEYS = Object.keys(TUTOR_PATH_COPY);
