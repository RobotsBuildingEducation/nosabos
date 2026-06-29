// src/utils/companionMemoryCopy.js
//
// Localized copy for the companion-memory ("companion brain") experience:
// the memory drawer, the manga-like Daily Quest bubble, and the repair
// surface. Kept separate from components so Fast Refresh stays happy, and
// free of react-icons so it can be imported by plain utils too.
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";
import { getGermanCopy } from "./germanCopy";

// Same resolution rule as plateUiCopy: exact match → German auto-translate →
// English fallback.
export const memoryCopy = (lang, copy) => {
  const normalized = normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE);
  if (copy[normalized]) return copy[normalized];
  if (normalized === "de") return getGermanCopy(copy.en) || copy.en;
  return copy.en;
};

const fill = (template, vars = {}) =>
  String(template || "").replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : "",
  );

/* -----------------------------------
   Capture summary — "Saved for tomorrow: …"
----------------------------------- */
const SAVED_FOR_TOMORROW = {
  en: "Saved for tomorrow: {concept}",
  es: "Guardado para mañana: {concept}",
  pt: "Guardado para amanhã: {concept}",
  fr: "Gardé pour demain : {concept}",
  it: "Salvato per domani: {concept}",
  de: "Für morgen gemerkt: {concept}",
  ja: "明日のために保存：{concept}",
  zh: "已为明天保存：{concept}",
  ru: "Сохранено на завтра: {concept}",
  ar: "محفوظ لبكرة: {concept}",
  hi: "कल के लिए सहेजा: {concept}",
};

export function companionMemorySummary(lang, concept) {
  return fill(memoryCopy(lang, SAVED_FOR_TOMORROW), { concept });
}

/* -----------------------------------
   Drawer copy
----------------------------------- */
export const MEMORY_DRAWER_COPY = {
  title: {
    en: "Memory",
    es: "Memoria",
    pt: "Memória",
    fr: "Mémoire",
    it: "Memoria",
    de: "Gedächtnis",
    ja: "メモリー",
    zh: "记忆",
    ru: "Память",
    ar: "الذاكرة",
    hi: "मेमोरी",
  },
  subtitle: {
    en: "What your companion saved to practice",
    es: "Lo que tu compañero guardó para practicar",
    pt: "O que seu companheiro guardou para praticar",
    fr: "Ce que ton compagnon a gardé à réviser",
    it: "Ciò che il tuo compagno ha salvato da ripassare",
    de: "Was dein Begleiter zum Üben gemerkt hat",
    ja: "あなたの相棒が練習用に保存したもの",
    zh: "你的伙伴为练习保存的内容",
    ru: "Что твой компаньон сохранил для практики",
    ar: "اللي حفظه رفيقك علشان تتمرن عليه",
    hi: "आपके साथी ने अभ्यास के लिए क्या सहेजा",
  },
  empty: {
    en: "Nothing saved yet. When something trips you up, your companion tucks it here for tomorrow.",
    es: "Nada guardado aún. Cuando algo te cueste, tu compañero lo guardará aquí para mañana.",
    pt: "Nada guardado ainda. Quando algo te pegar, seu companheiro guarda aqui para amanhã.",
    fr: "Rien de gardé pour l'instant. Quand quelque chose te bloque, ton compagnon le range ici pour demain.",
    it: "Ancora niente. Quando qualcosa ti mette in difficoltà, il tuo compagno lo salva qui per domani.",
    de: "Noch nichts gemerkt. Wenn dich etwas ins Stolpern bringt, legt es dein Begleiter für morgen hierher.",
    ja: "まだ何もありません。つまずいたことは、相棒が明日のためにここに保存します。",
    zh: "还没有保存内容。当你卡住时，伙伴会把它存到这里，留到明天。",
    ru: "Пока пусто. Когда что-то даётся трудно, компаньон сохранит это здесь на завтра.",
    ar: "لسه مفيش حاجة. لما حاجة تصعّب عليك، رفيقك يحفظها هنا لبكرة.",
    hi: "अभी कुछ सहेजा नहीं गया। जब कुछ कठिन लगेगा, आपका साथी उसे कल के लिए यहाँ रख देगा।",
  },
  todayHeading: {
    en: "Saved today",
    es: "Guardado hoy",
    pt: "Guardado hoje",
    fr: "Gardé aujourd'hui",
    it: "Salvato oggi",
    de: "Heute gemerkt",
    ja: "今日保存した分",
    zh: "今天保存",
    ru: "Сохранено сегодня",
    ar: "اتحفظ النهاردة",
    hi: "आज सहेजा",
  },
  yesterdayHeading: {
    en: "From yesterday",
    es: "De ayer",
    pt: "De ontem",
    fr: "D'hier",
    it: "Da ieri",
    de: "Von gestern",
    ja: "昨日の分",
    zh: "来自昨天",
    ru: "Со вчера",
    ar: "من إمبارح",
    hi: "कल से",
  },
  savedNotesHeading: {
    en: "Saved notes",
    es: "Notas guardadas",
    pt: "Notas salvas",
    fr: "Notes enregistrées",
    it: "Note salvate",
    de: "Gespeicherte Notizen",
    ja: "保存したメモ",
    zh: "已保存的笔记",
    ru: "Сохранённые заметки",
    ar: "الملاحظات المحفوظة",
    hi: "सहेजे गए नोट्स",
  },
};

export const MEMORY_STATUS_COPY = {
  captured: {
    en: "Saved for tomorrow",
    es: "Guardado para mañana",
    pt: "Guardado para amanhã",
    fr: "Gardé pour demain",
    it: "Salvato per domani",
    de: "Für morgen gemerkt",
    ja: "明日のために保存",
    zh: "为明天保存",
    ru: "Сохранено на завтра",
    ar: "محفوظ لبكرة",
    hi: "कल के लिए सहेजा",
  },
  queued_for_repair: {
    en: "Lined up to repair",
    es: "Listo para reparar",
    pt: "Pronto para reparar",
    fr: "Prêt à réparer",
    it: "Pronto da rinforzare",
    de: "Zum Auffrischen bereit",
    ja: "リペア予定",
    zh: "待修复",
    ru: "В очереди на повтор",
    ar: "جاهز للمراجعة",
    hi: "मरम्मत के लिए तैयार",
  },
  used_in_quest: {
    en: "In today's quest",
    es: "En la misión de hoy",
    pt: "Na missão de hoje",
    fr: "Dans la quête du jour",
    it: "Nella missione di oggi",
    de: "In der heutigen Mission",
    ja: "今日のクエストに登場",
    zh: "在今天的任务中",
    ru: "В сегодняшнем задании",
    ar: "في مهمة النهاردة",
    hi: "आज की क्वेस्ट में",
  },
  reinforced: {
    en: "Repaired",
    es: "Reparado",
    pt: "Reparado",
    fr: "Réparé",
    it: "Rinforzato",
    de: "Aufgefrischt",
    ja: "リペア済み",
    zh: "已修复",
    ru: "Повторено",
    ar: "اتراجع",
    hi: "मरम्मत हो गई",
  },
  expiring: {
    en: "Expires after today",
    es: "Expira después de hoy",
    pt: "Expira depois de hoje",
    fr: "Expire après aujourd'hui",
    it: "Scade dopo oggi",
    de: "Läuft nach heute ab",
    ja: "今日を過ぎると消えます",
    zh: "今天之后过期",
    ru: "Исчезнет после сегодня",
    ar: "هيختفي بعد النهاردة",
    hi: "आज के बाद समाप्त",
  },
};

export function memoryStatusLabel(lang, status) {
  return memoryCopy(lang, MEMORY_STATUS_COPY[status] || MEMORY_STATUS_COPY.captured);
}

/* -----------------------------------
   Manga-like Daily Quest bubble
----------------------------------- */
const BUBBLE_LEAD_REPAIR = {
  en: "Yesterday “{concept}” felt a little shaky, so I lined up a quick repair first.",
  es: "Ayer “{concept}” se sintió un poco flojo, así que preparé una reparación rápida primero.",
  pt: "Ontem “{concept}” ficou meio inseguro, então preparei um reparo rápido primeiro.",
  fr: "Hier, « {concept} » était un peu hésitant, alors j'ai prévu une petite réparation d'abord.",
  it: "Ieri “{concept}” era un po' incerto, così ho preparato prima un veloce ripasso.",
  de: "Gestern saß „{concept}“ noch nicht ganz, also habe ich zuerst eine kurze Auffrischung eingeplant.",
  ja: "昨日は「{concept}」が少しあやしかったので、まず軽くリペアを用意したよ。",
  zh: "昨天“{concept}”有点不稳，所以我先安排了一个快速修复。",
  ru: "Вчера «{concept}» давалось нелегко, поэтому я приготовил быстрый повтор.",
  ar: "إمبارح “{concept}” كانت لسه مش ثابتة، فجهّزت مراجعة سريعة الأول.",
  hi: "कल “{concept}” थोड़ा कच्चा लगा, इसलिए मैंने पहले एक त्वरित मरम्मत रखी है।",
};

const BUBBLE_LEAD_REPAIR_MULTI = {
  en: "I saved a few tricky bits from yesterday — we'll warm up “{concept}” first.",
  es: "Guardé varias cositas difíciles de ayer; primero calentaremos con “{concept}”.",
  pt: "Guardei algumas partes difíceis de ontem; primeiro vamos aquecer com “{concept}”.",
  fr: "J'ai gardé quelques passages délicats d'hier — on échauffe « {concept} » d'abord.",
  it: "Ho salvato un paio di punti ostici di ieri: prima scaldiamo con “{concept}”.",
  de: "Ich habe ein paar knifflige Stellen von gestern gemerkt — wir wärmen mit „{concept}“ auf.",
  ja: "昨日の難しかったところをいくつか保存したよ。まずは「{concept}」から温めよう。",
  zh: "我存了昨天几个棘手的地方，先用“{concept}”热个身。",
  ru: "Я сохранил пару сложных моментов со вчера — начнём с разминки «{concept}».",
  ar: "حفظت كذا حاجة صعبة من إمبارح؛ هنسخّن بـ “{concept}” الأول.",
  hi: "मैंने कल की कुछ मुश्किल चीज़ें सहेजीं — पहले “{concept}” से वार्मअप करेंगे।",
};

const BUBBLE_WELCOME = {
  en: "Hi! I'm your learning companion. Let's take on your first quest together.",
  es: "¡Hola! Soy tu compañero de aprendizaje. Hagamos juntos tu primera misión.",
  pt: "Oi! Sou seu companheiro de aprendizado. Vamos encarar sua primeira missão juntos.",
  fr: "Salut ! Je suis ton compagnon d'apprentissage. Lançons ta première quête ensemble.",
  it: "Ciao! Sono il tuo compagno di studio. Affrontiamo insieme la tua prima missione.",
  de: "Hi! Ich bin dein Lernbegleiter. Lass uns deine erste Mission zusammen angehen.",
  ja: "やあ！ぼくはきみの学習バディだよ。最初のクエストを一緒にやってみよう。",
  zh: "嗨！我是你的学习伙伴，我们一起完成你的第一个任务吧。",
  ru: "Привет! Я твой помощник в учёбе. Давай вместе пройдём твоё первое задание.",
  ar: "أهلاً! أنا رفيقك في التعلّم. يلا نبدأ أول مهمة مع بعض.",
  hi: "नमस्ते! मैं आपका लर्निंग साथी हूँ। चलिए आपकी पहली क्वेस्ट साथ में शुरू करते हैं।",
};

const BUBBLE_LEAD_FRESH = {
  en: "Fresh start today — nothing left over from yesterday. Let's keep the streak going.",
  es: "Hoy empezamos frescos, sin pendientes de ayer. Sigamos la racha.",
  pt: "Hoje começamos do zero, sem pendências de ontem. Vamos manter a sequência.",
  fr: "On repart à neuf aujourd'hui, rien d'hier. Continuons la série.",
  it: "Oggi si riparte freschi, niente di ieri. Teniamo viva la serie.",
  de: "Heute starten wir frisch — nichts von gestern offen. Halten wir die Serie am Laufen.",
  ja: "今日はまっさら、昨日の宿題はなし。連続記録を伸ばそう。",
  zh: "今天全新开始，没有昨天的遗留。继续保持连胜吧。",
  ru: "Сегодня начинаем с чистого листа — ничего со вчера. Продолжим серию.",
  ar: "النهاردة بداية جديدة، مفيش حاجة من إمبارح. نكمّل السلسلة.",
  hi: "आज नई शुरुआत — कल का कुछ बाकी नहीं। चलो स्ट्रीक बनाए रखें।",
};

export const COMPANION_SPEAKER_FALLBACK = {
  en: "Your companion",
  es: "Tu compañero",
  pt: "Seu companheiro",
  fr: "Ton compagnon",
  it: "Il tuo compagno",
  de: "Dein Begleiter",
  ja: "あなたの相棒",
  zh: "你的伙伴",
  ru: "Твой компаньон",
  ar: "رفيقك",
  hi: "आपका साथी",
};

const BUBBLE_PLAN_LABEL = {
  en: "Today's quest",
  es: "Misión de hoy",
  pt: "Missão de hoje",
  fr: "Quête du jour",
  it: "Missione di oggi",
  de: "Heutige Mission",
  ja: "今日のクエスト",
  zh: "今日任务",
  ru: "Задание дня",
  ar: "مهمة النهاردة",
  hi: "आज की क्वेस्ट",
};

const BUBBLE_CLEARED = {
  en: "Quest cleared — yesterday's tricky bits feel stronger now. Proud of you.",
  es: "Misión completada: lo difícil de ayer ya se siente más firme. Orgulloso de ti.",
  pt: "Missão concluída: o difícil de ontem já está mais firme. Orgulhoso de você.",
  fr: "Quête terminée — les points délicats d'hier sont plus solides. Fier de toi.",
  it: "Missione completata: i punti ostici di ieri ora reggono meglio. Fiero di te.",
  de: "Mission geschafft — die kniffligen Stellen von gestern sitzen jetzt besser. Stolz auf dich.",
  ja: "クエスト達成！昨日の難所がしっかりしてきたね。えらい！",
  zh: "任务完成——昨天的难点现在更稳了。为你骄傲。",
  ru: "Задание выполнено — вчерашние трудности стали увереннее. Горжусь тобой.",
  ar: "خلصت المهمة — صعوبات إمبارح بقت أمتن. فخور بيك.",
  hi: "क्वेस्ट पूरी — कल की मुश्किलें अब मज़बूत लगती हैं। तुम पर गर्व है।",
};

/**
 * Compose the companion's quest note. Deterministic + localized (no AI needed),
 * but the shape leaves room for an AI-enriched `long` later. `taskList` is the
 * already-localized, comma-joined course labels from the caller.
 * Returns { short, long }.
 */
export function buildQuestBubble({
  lang,
  leadKind = "fresh",
  concept = "",
  taskList = "",
  cleared = false,
}) {
  if (cleared) {
    const text = memoryCopy(lang, BUBBLE_CLEARED);
    return { short: text, long: text };
  }

  let leadTpl;
  if (leadKind === "welcome") leadTpl = BUBBLE_WELCOME;
  else if (leadKind === "repair") leadTpl = BUBBLE_LEAD_REPAIR;
  else if (leadKind === "repairMulti") leadTpl = BUBBLE_LEAD_REPAIR_MULTI;
  else leadTpl = BUBBLE_LEAD_FRESH;

  const short = fill(memoryCopy(lang, leadTpl), { concept });
  const planLabel = memoryCopy(lang, BUBBLE_PLAN_LABEL);
  // The welcome stays short — the course rows are listed right below it, so
  // appending the task list there is redundant and makes the balloon tall.
  const long =
    taskList && leadKind !== "welcome"
      ? `${short} ${planLabel}: ${taskList}.`
      : short;
  return { short, long };
}

/* -----------------------------------
   Repair surface copy
----------------------------------- */
export const REPAIR_COPY = {
  courseLabel: {
    en: "Repair",
    es: "Reparar",
    pt: "Reparar",
    fr: "Réparer",
    it: "Ripasso",
    de: "Auffrischen",
    ja: "リペア",
    zh: "修复",
    ru: "Повтор",
    ar: "مراجعة",
    hi: "मरम्मत",
  },
  title: {
    en: "Quick repair",
    es: "Reparación rápida",
    pt: "Reparo rápido",
    fr: "Réparation rapide",
    it: "Ripasso veloce",
    de: "Kurze Auffrischung",
    ja: "クイックリペア",
    zh: "快速修复",
    ru: "Быстрый повтор",
    ar: "مراجعة سريعة",
    hi: "त्वरित मरम्मत",
  },
  intro: {
    en: "Let's make yesterday's tricky bits automatic.",
    es: "Hagamos automático lo difícil de ayer.",
    pt: "Vamos tornar automático o difícil de ontem.",
    fr: "Rendons automatiques les points délicats d'hier.",
    it: "Rendiamo automatici i punti ostici di ieri.",
    de: "Machen wir die kniffligen Stellen von gestern automatisch.",
    ja: "昨日の難所を自然に出せるようにしよう。",
    zh: "把昨天的难点变成自然反应。",
    ru: "Сделаем вчерашние трудности автоматическими.",
    ar: "خلّينا نخلي صعوبات إمبارح تطلع تلقائي.",
    hi: "कल की मुश्किल चीज़ों को सहज बना देते हैं।",
  },
  reveal: {
    en: "Show answer",
    es: "Mostrar respuesta",
    pt: "Mostrar resposta",
    fr: "Voir la réponse",
    it: "Mostra risposta",
    de: "Antwort zeigen",
    ja: "答えを見る",
    zh: "显示答案",
    ru: "Показать ответ",
    ar: "اظهر الإجابة",
    hi: "उत्तर दिखाएँ",
  },
  gotIt: {
    en: "I've got it",
    es: "Ya lo tengo",
    pt: "Já entendi",
    fr: "Je l'ai",
    it: "Ce l'ho",
    de: "Sitzt",
    ja: "できた",
    zh: "我会了",
    ru: "Понял",
    ar: "فهمتها",
    hi: "समझ गया",
  },
  next: {
    en: "Next",
    es: "Siguiente",
    pt: "Próximo",
    fr: "Suivant",
    it: "Avanti",
    de: "Weiter",
    ja: "次へ",
    zh: "下一个",
    ru: "Далее",
    ar: "التالي",
    hi: "अगला",
  },
  done: {
    en: "Repair complete!",
    es: "¡Reparación completa!",
    pt: "Reparo concluído!",
    fr: "Réparation terminée !",
    it: "Ripasso completato!",
    de: "Auffrischung abgeschlossen!",
    ja: "リペア完了！",
    zh: "修复完成！",
    ru: "Повтор завершён!",
    ar: "خلصت المراجعة!",
    hi: "मरम्मत पूरी!",
  },
  yourAnswerLabel: {
    en: "You said",
    es: "Dijiste",
    pt: "Você disse",
    fr: "Tu as dit",
    it: "Hai detto",
    de: "Du sagtest",
    ja: "あなたの答え",
    zh: "你的回答",
    ru: "Ты ответил",
    ar: "إنت قلت",
    hi: "आपने कहा",
  },
  answerLabel: {
    en: "Answer",
    es: "Respuesta",
    pt: "Resposta",
    fr: "Réponse",
    it: "Risposta",
    de: "Antwort",
    ja: "答え",
    zh: "答案",
    ru: "Ответ",
    ar: "الإجابة",
    hi: "उत्तर",
  },
  promptLabel: {
    en: "Remember this",
    es: "Recuerda esto",
    pt: "Lembre-se disto",
    fr: "Souviens-toi de ça",
    it: "Ricorda questo",
    de: "Merke dir das",
    ja: "これを思い出して",
    zh: "记住这个",
    ru: "Вспомни это",
    ar: "افتكر ده",
    hi: "इसे याद रखें",
  },
};

export function repairCopy(lang, key) {
  return memoryCopy(lang, REPAIR_COPY[key] || { en: "" });
}
