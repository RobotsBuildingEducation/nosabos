// src/components/JobScript.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Center,
  useToast,
  Badge,
  Progress,
  Spacer,
  Input,
  Textarea,
  Divider,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaVolumeUp } from "react-icons/fa";
import { PiMicrophoneStageDuotone } from "react-icons/pi";
import { MdOutlineFileUpload, MdSave, MdOpenInNew } from "react-icons/md";
import {
  doc,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit as qLimit,
} from "firebase/firestore";
import { database, simplemodel } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { translations } from "../utils/translation";
import { awardXp } from "../utils/utils";
import { getLanguageXp } from "../utils/progressTracking";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_EDGE,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";
import { LOW_LATENCY_TTS_FORMAT, getTTSPlayer } from "../utils/tts";
import XpProgressHeader from "./XpProgressHeader";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  isSupportedPracticeLanguage,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";

// File parsers
import * as mammoth from "mammoth/mammoth.browser";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

/* -------------------------------------------------------------------------- */
/*                               PDF.js worker                                */
/* -------------------------------------------------------------------------- */
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.js",
    import.meta.url
  ).toString();
} catch {}

/* ================================
   Helpers / Language utils
=================================== */
const strongNpub = (user) =>
  (
    user?.id ||
    user?.local_npub ||
    localStorage.getItem("local_npub") ||
    ""
  ).trim();

const capName = (x) =>
  String(x || "")
    .trim()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const LLM_LANG_NAME = (codeOrName) => {
  const m = String(codeOrName || "")
    .trim()
    .toLowerCase();
  if (m === "en" || m === "english") return "English";
  if (m === "es" || m === "spanish" || m === "español") return "Spanish";
  if (
    m === "ar" ||
    m === "arabic" ||
    m === "egyptian arabic" ||
    m === "العربية" ||
    m === "العربية المصرية" ||
    m === "مصري" ||
    m === "مصرى"
  )
    return "Egyptian Arabic";
  if (
    m === "zh" ||
    m === "zh-cn" ||
    m === "chinese" ||
    m === "mandarin" ||
    m === "mandarin chinese" ||
    m === "中文" ||
    m === "普通话"
  )
    return "Mandarin Chinese";
  if (m === "pt" || m === "portuguese" || m === "português")
    return "Brazilian Portuguese";
  if (m === "fr" || m === "french" || m === "francés" || m === "français")
    return "French";
  if (m === "it" || m === "italian" || m === "italiano") return "Italian";
  if (m === "hi" || m === "hindi" || m === "हिंदी" || m === "हिन्दी")
    return "Hindi";
  if (m === "ja" || m === "japanese" || m === "日本語") return "Japanese";
  if (m === "nl" || m === "dutch" || m === "nederlands" || m === "holandés")
    return "Dutch";
  if (m === "nah" || m === "nahuatl" || m === "eastern huasteca nahuatl")
    return "Eastern Huasteca Nahuatl";
  if (m === "ru" || m === "russian" || m === "русский") return "Russian";
  if (m === "el" || m === "greek" || m === "griego" || m === "ελληνικά")
    return "Greek";
  if (m === "pl" || m === "polish" || m === "polaco" || m === "polski")
    return "Polish";
  if (m === "ga" || m === "irish" || m === "irlandés" || m === "gaeilge")
    return "Irish";
  if (
    m === "yua" ||
    m === "yucatec maya" ||
    m === "maya yucateco" ||
    m === "maaya t'aan"
  )
    return "Yucatec Maya";
  return capName(m);
};

const normalizeLangCode = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();

/** BCP-47 for TTS/SR */
const toBCP47 = (v, fallback = "en-US") => {
  const m = normalizeLangCode(v);
  if (!m) return fallback;
  if (m === "en") return "en-US";
  if (m === "es") return "es-MX";
  if (m === "ar") return "ar-EG";
  if (m === "zh") return "zh-CN";
  if (m === "pt") return "pt-BR";
  if (m === "fr") return "fr-FR";
  if (m === "it") return "it-IT";
  if (m === "hi") return "hi-IN";
  if (m === "ja") return "ja-JP";
  if (m === "nl") return "nl-NL";
  if (m === "nah") return "es-MX"; // fallback
  if (m === "ru") return "ru-RU";
  if (m === "de") return "de-DE";
  if (m === "el") return "el-GR";
  if (m === "pl") return "pl-PL";
  if (m === "ga") return "ga-IE";
  if (m === "yua") return "es-MX";
  if (/^[a-z]{2}$/.test(m)) return `${m}-${m.toUpperCase()}`;
  if (/^[a-z]{2,3}-[A-Za-z]{2,4}$/.test(m)) return m;
  return fallback;
};

const toLangKey = (value) => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return null;
  if (["en", "english"].includes(raw)) return "en";
  if (["es", "spanish", "español"].includes(raw)) return "es";
  if (
    [
      "ar",
      "arabic",
      "egyptian arabic",
      "العربية",
      "العربية المصرية",
      "مصري",
      "مصرى",
    ].includes(raw)
  )
    return "ar";
  if (["zh", "zh-cn", "chinese", "mandarin", "mandarin chinese", "中文", "普通话"].includes(raw))
    return "zh";
  if (["pt", "portuguese", "português", "portugues"].includes(raw)) return "pt";
  if (["fr", "french", "francés", "francais", "français"].includes(raw))
    return "fr";
  if (["it", "italian", "italiano"].includes(raw)) return "it";
  if (["hi", "hindi", "हिंदी", "हिन्दी"].includes(raw)) return "hi";
  if (["ja", "japanese", "japonés", "japones", "giapponese", "japonais", "日本語"].includes(raw)) return "ja";
  if (["nl", "dutch", "nederlands", "holandés", "holandes"].includes(raw))
    return "nl";
  if (
    [
      "nah",
      "nahuatl",
      "náhuatl",
      "eastern huasteca nahuatl",
      "náhuatl huasteco oriental",
    ].includes(raw)
  )
    return "nah";
  if (
    ["yua", "yucatec maya", "maya yucateco", "maaya t'aan"].includes(raw)
  )
    return "yua";
  if (["ru", "russian", "ruso", "русский"].includes(raw)) return "ru";
  if (["de", "german", "alemán", "aleman", "deutsch"].includes(raw)) return "de";
  if (["el", "greek", "griego", "ελληνικά", "ελληνικα"].includes(raw))
    return "el";
  if (["pl", "polish", "polaco", "polski"].includes(raw)) return "pl";
  if (["ga", "irish", "irlandés", "irlandes", "gaeilge"].includes(raw))
    return "ga";
  return null;
};

const displayLanguageName = (code, uiLang) => {
  const dict = translations[uiLang] || translations.en || {};
  const fallback = translations.en || {};
  const langKey = toLangKey(code);
  if (langKey) {
    const key = `language_${langKey}`;
    return dict[key] || fallback[key] || langKey;
  }
  const raw = String(code ?? "").trim();
  return raw || LLM_LANG_NAME(code);
};

const getAppUILang = () => {
  const user = useUserStore.getState().user;
  return normalizeSupportLanguage(
    user?.appLanguage || localStorage.getItem("appLanguage"),
    DEFAULT_SUPPORT_LANGUAGE,
  );
};

/* ================================
   Shared Progress (global XP + settings)
=================================== */
function useSharedProgress() {
  const user = useUserStore((s) => s.user);
  const npub = strongNpub(user);
  const [xp, setXp] = useState(0);
  const [progress, setProgress] = useState({
    level: "beginner",
    targetLang: "es",
    supportLang: "en",
    voice: "alloy",
  });

  useEffect(() => {
    if (!npub) return;
    const ref = doc(database, "users", npub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const p = data?.progress || {};
      const targetLang = isSupportedPracticeLanguage(p.targetLang)
        ? normalizePracticeLanguage(p.targetLang, DEFAULT_TARGET_LANGUAGE)
        : DEFAULT_TARGET_LANGUAGE;
      const langXp = getLanguageXp(p, targetLang);

      setXp(Number.isFinite(langXp) ? langXp : 0);
      setProgress({
        level: p.level || "beginner",
        targetLang,
        supportLang: normalizeSupportLanguage(
          p.supportLang,
          DEFAULT_SUPPORT_LANGUAGE,
        ),
        voice: p.voice || "alloy",
      });
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub };
}

/* ================================
   Logging (story turns)
=================================== */
async function saveStoryTurn(npub, payload) {
  if (!npub) return;
  const col = collection(database, "users", npub, "storyTurns");
  await addDoc(col, {
    ...payload,
    createdAt: serverTimestamp(),
    createdAtClient: Date.now(),
    origin: "jobscript",
  });
}

/* ================================
   UI text (driven by APP UI language only)
=================================== */
const uiCopy = (lang, copy) =>
  copy[normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE)] || copy.en;

function useUIText(uiLang, level, translationsObj) {
  return useMemo(() => {
    const t = translationsObj[uiLang] || translationsObj.en;
    const frCopy = {
      "Script Coach": "Coach de scripts",
      "Upload or paste your script; we convert it to the target language and show support in your language.":
        "Televerse ou colle ton script ; nous le convertissons vers la langue cible et affichons l'aide dans ta langue.",
      "Create script": "Creer le script",
      Listen: "Ecouter",
      "Start Sentence Practice": "Commencer la pratique par phrase",
      "Practice this sentence:": "Pratique cette phrase :",
      "Skip Sentence": "Passer la phrase",
      "Finish Practice": "Terminer la pratique",
      "Record Sentence": "Enregistrer la phrase",
      "Stop Recording": "Arreter l'enregistrement",
      Progress: "Progres",
      "Well done!": "Bien joue !",
      "Almost — try again": "Presque - reessaie",
      Score: "Score",
      Level: "Niveau",
      "I speak (support)": "Je parle (support)",
      "I’m learning (target)": "J'apprends (cible)",
      "e.g., es, Spanish, fr-CA": "ex. : es, Spanish, fr-CA",
      "Paste your script here… (supported: .txt, .srt, .vtt, .md, .docx, .pdf)":
        "Colle ton script ici... (pris en charge : .txt, .srt, .vtt, .md, .docx, .pdf)",
      "Upload file": "Televerser un fichier",
      "Script ready! Start practicing.": "Script pret ! Commence la pratique.",
      "You need at least one sentence.": "Il faut au moins une phrase.",
      Save: "Enregistrer",
      "Title (optional)": "Titre (facultatif)",
      "Your saved scripts": "Tes scripts enregistres",
      Open: "Ouvrir",
      "Script saved": "Script enregistre",
      "Script loaded": "Script charge",
      "You don't have any saved scripts yet.": "Tu n'as pas encore de scripts enregistres.",
    };
    const jaCopy = {
      "Script Coach": "スクリプトコーチ",
      "Upload or paste your script; we convert it to the target language and show support in your language.":
        "スクリプトをアップロードまたは貼り付けると、目標言語に変換し、あなたの言語でサポートを表示します。",
      "Create script": "スクリプトを作成",
      Listen: "聞く",
      "Start Sentence Practice": "文ごとの練習を開始",
      "Practice this sentence:": "この文を練習:",
      "Skip Sentence": "文をスキップ",
      "Finish Practice": "練習を終了",
      "Record Sentence": "文を録音",
      "Stop Recording": "録音を停止",
      Progress: "進捗",
      "Well done!": "よくできました！",
      "Almost — try again": "もう少しです。もう一度",
      Score: "スコア",
      Level: "レベル",
      "I speak (support)": "話せる言語（サポート）",
      "I’m learning (target)": "学習中（目標）",
      "e.g., es, Spanish, fr-CA": "例: es, Spanish, fr-CA",
      "Paste your script here… (supported: .txt, .srt, .vtt, .md, .docx, .pdf)":
        "ここにスクリプトを貼り付けてください…（対応: .txt, .srt, .vtt, .md, .docx, .pdf）",
      "Upload file": "ファイルをアップロード",
      "Script ready! Start practicing.": "スクリプトの準備ができました。練習を始めましょう。",
      "You need at least one sentence.": "少なくとも1文が必要です。",
      Save: "保存",
      "Title (optional)": "タイトル（任意）",
      "Your saved scripts": "保存済みスクリプト",
      Open: "開く",
      "Script saved": "スクリプトを保存しました",
      "Script loaded": "スクリプトを読み込みました",
      "You don't have any saved scripts yet.": "保存済みスクリプトはまだありません。",
    };
    const arCopy = {
      "Script Coach": "مدرب السكربت",
      "Upload or paste your script; we convert it to the target language and show support in your language.":
        "ارفع السكربت أو الصقه؛ هنحوّله للغة الهدف ونعرض الشرح بلغتك.",
      "Create script": "اعمل سكربت",
      Listen: "اسمع",
      "Start Sentence Practice": "ابدأ تدريب الجمل",
      "Practice this sentence:": "اتدرّب على الجملة دي:",
      "Skip Sentence": "تخطى الجملة",
      "Finish Practice": "أنهِ التدريب",
      "Record Sentence": "سجّل الجملة",
      "Stop Recording": "أوقف التسجيل",
      Progress: "التقدم",
      "Well done!": "أحسنت!",
      "Almost — try again": "قربت، جرّب مرة تانية",
      Score: "النتيجة",
      Level: "المستوى",
      "I speak (support)": "أنا بتكلم (الدعم)",
      "I’m learning (target)": "أنا بتعلم (الهدف)",
      "e.g., es, Spanish, fr-CA": "مثال: es أو Spanish أو fr-CA",
      "Paste your script here… (supported: .txt, .srt, .vtt, .md, .docx, .pdf)":
        "الصق السكربت هنا... (المدعوم: .txt و .srt و .vtt و .md و .docx و .pdf)",
      "Upload file": "ارفع ملف",
      "Script ready! Start practicing.": "السكربت جاهز! ابدأ التدريب.",
      "You need at least one sentence.": "لازم يكون فيه جملة واحدة على الأقل.",
      Save: "احفظ",
      "Title (optional)": "العنوان (اختياري)",
      "Your saved scripts": "السكربتات المحفوظة",
      Open: "افتح",
      "Script saved": "تم حفظ السكربت",
      "Script loaded": "تم تحميل السكربت",
      "You don't have any saved scripts yet.": "لسه ما عندكش سكربتات محفوظة.",
    };
    const copy = (en, es, it, fr, ja, ar) =>
      uiCopy(uiLang, {
        en,
        es,
        it,
        fr: fr || frCopy[en] || en,
        ja: ja || jaCopy[en] || en,
        ar: ar || arCopy[en] || en,
      });
    return {
      header: copy("Script Coach", "Entrenador de guiones", "Coach di copioni"),
      sub: copy(
        "Upload or paste your script; we convert it to the target language and show support in your language.",
        "Sube o pega tu guion; lo convertimos al idioma meta y te damos apoyo en tu idioma.",
        "Carica o incolla il tuo copione; lo convertiamo nella lingua obiettivo e mostriamo supporto nella tua lingua.",
      ),
      build: copy("Create script", "Crear guion", "Crea copione"),
      listen: copy("Listen", "Escuchar", "Ascolta"),
      startPractice: copy(
        "Start Sentence Practice",
        "Empezar práctica por oración",
        "Inizia pratica per frasi",
      ),
      practiceThis: copy(
        "Practice this sentence:",
        "Practica esta oración:",
        "Pratica questa frase:",
      ),
      skip: copy("Skip Sentence", "Saltar oración", "Salta frase"),
      finish: copy("Finish Practice", "Terminar práctica", "Termina pratica"),
      record: copy("Record Sentence", "Grabar oración", "Registra frase"),
      stopRecording: copy(
        "Stop Recording",
        "Detener grabación",
        "Ferma registrazione",
      ),
      progress: copy("Progress", "Progreso", "Progressi"),
      wellDone: copy("Well done!", "¡Bien hecho!", "Ben fatto!"),
      almost: copy(
        "Almost — try again",
        "Casi — inténtalo otra vez",
        "Ci sei quasi — riprova",
      ),
      score: copy("Score", "Puntuación", "Punteggio"),
      xp: t?.ra_label_xp || "XP",
      levelLabel: copy("Level", "Nivel", "Livello"),
      iSpeak: copy("I speak (support)", "Yo hablo (apoyo)", "Parlo (supporto)"),
      iLearn: copy(
        "I’m learning (target)",
        "Estoy aprendiendo (meta)",
        "Sto imparando (obiettivo)",
      ),
      langPH: copy(
        "e.g., es, Spanish, fr-CA",
        "ej.: en, English, fr-CA",
        "es.: es, Spanish, fr-CA",
      ),
      pastePH: copy(
        "Paste your script here… (supported: .txt, .srt, .vtt, .md, .docx, .pdf)",
        "Pega tu guion aquí… (soportado: .txt, .srt, .vtt, .md, .docx, .pdf)",
        "Incolla qui il copione... (supportati: .txt, .srt, .vtt, .md, .docx, .pdf)",
      ),
      upload: copy("Upload file", "Subir archivo", "Carica file"),
      builtOk: copy(
        "Script ready! Start practicing.",
        "¡Guion listo! Empieza la práctica.",
        "Copione pronto! Inizia a praticare.",
      ),
      needText: copy(
        "You need at least one sentence.",
        "Necesitas al menos 1 oración.",
        "Serve almeno una frase.",
      ),
      save: copy("Save", "Guardar", "Salva"),
      titlePH: copy("Title (optional)", "Título (opcional)", "Titolo (opzionale)"),
      savedHeader: copy(
        "Your saved scripts",
        "Tus guiones guardados",
        "I tuoi copioni salvati",
      ),
      open: copy("Open", "Abrir", "Apri"),
      scriptSaved: copy("Script saved", "Guion guardado", "Copione salvato"),
      scriptLoaded: copy("Script loaded", "Guion cargado", "Copione caricato"),
      noneSaved: copy(
        "You don't have any saved scripts yet.",
        "Aún no tienes guiones guardados.",
        "Non hai ancora copioni salvati.",
      ),
    };
  }, [uiLang, level, translationsObj]);
}

/* ================================
   Normalization / Scoring (multi-lang)
=================================== */
const STOPWORDS = {
  es: new Set([
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "de",
    "del",
    "al",
    "y",
    "o",
    "u",
    "que",
    "como",
    "cuando",
    "donde",
    "por",
    "para",
    "con",
    "sin",
    "en",
    "a",
    "es",
    "era",
    "soy",
    "eres",
    "somos",
    "son",
    "fue",
    "fueron",
    "ser",
    "estar",
    "estoy",
    "está",
    "están",
    "muy",
    "más",
    "menos",
    "también",
    "pero",
    "porque",
    "si",
    "no",
    "ya",
    "hay",
    "me",
    "te",
    "se",
    "le",
    "lo",
    "nos",
    "les",
    "mi",
    "tu",
    "su",
    "sus",
  ]),
  en: new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "so",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "that",
    "which",
    "who",
    "whom",
    "this",
    "these",
    "those",
    "at",
    "as",
    "by",
    "from",
    "it",
    "its",
    "my",
    "your",
    "his",
    "her",
    "our",
    "their",
    "there",
    "here",
  ]),
  nah: new Set(),
};

const removeDiacritics = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const normalizeGeneric = (str) =>
  removeDiacritics(str || "")
    .toLowerCase()
    .replace(/[^a-zñáéíóúüʼ' -]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenizeWords = (str) => normalizeGeneric(str).split(" ").filter(Boolean);

function levenshteinDistance(a, b) {
  const n = a.length,
    m = b.length;
  if (!n) return m;
  if (!m) return n;
  const dp = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= m; j++) {
      const tmp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[m];
}
const charSimilarity01 = (a, b) => {
  const A = normalizeGeneric(a),
    B = normalizeGeneric(b);
  const d = levenshteinDistance(A, B);
  const m = Math.max(A.length, B.length) || 1;
  return (m - d) / m;
};
function wordPRF(recWords, tgtWords, lang, { dropStopwords = true } = {}) {
  const sw = STOPWORDS[lang] || STOPWORDS.en;
  const rw = dropStopwords ? recWords.filter((w) => !sw.has(w)) : recWords;
  const tw = dropStopwords ? tgtWords.filter((w) => !sw.has(w)) : tgtWords;
  const rMap = new Map(),
    tMap = new Map();
  for (const w of rw) rMap.set(w, (rMap.get(w) || 0) + 1);
  for (const w of tw) tMap.set(w, (tMap.get(w) || 0) + 1);
  let hit = 0;
  for (const [w, tc] of tMap) hit += Math.min(tc, rMap.get(w) || 0);
  const prec = rw.length ? hit / rw.length : 0;
  const rec = tw.length ? hit / tw.length : 0;
  const f1 = prec + rec ? (2 * prec * rec) / (prec + rec) : 0;
  return { prec, rec, f1 };
}
function languageLikelihood(recWords, lang) {
  if (!recWords.length) return 0;
  const sw = STOPWORDS[lang] || STOPWORDS.en;
  let lettersOK = 0,
    stopHits = 0;
  for (const w of recWords) {
    if (/^[a-zñáéíóúü]+$/i.test(w)) lettersOK++;
    if (sw.has(w)) stopHits++;
  }
  const letterRatio = lettersOK / recWords.length;
  const stopRatio = stopHits / Math.max(2, recWords.length);
  return 0.8 * letterRatio + 0.2 * stopRatio;
}

/* ---------------- Sentence extraction helpers (support-language filter) ---- */
function likelyLangScore(line, lang) {
  return languageLikelihood(tokenizeWords(line || ""), lang || "es");
}
function filterBilingualLines(lines, targetLang, supportLang) {
  if (!Array.isArray(lines) || !lines.length) return [];
  if (!supportLang || supportLang === targetLang) return lines;

  const scored = lines.map((s) => ({
    s,
    t: likelyLangScore(s, targetLang),
    u: likelyLangScore(s, supportLang),
  }));

  const T = scored.filter((x) => x.t >= 0.6).length;
  const U = scored.filter((x) => x.u >= 0.6).length;
  const bilingual = T >= 3 && U >= 3;

  if (!bilingual) return lines;

  const kept = scored.filter((x) => x.t >= x.u + 0.05).map((x) => x.s);
  if (kept.length === 0) {
    return scored
      .slice()
      .sort((a, b) => b.t - a.t)
      .slice(0, Math.min(30, scored.length))
      .map((x) => x.s);
  }
  return kept;
}
function normalizeForDedup(s) {
  return removeDiacritics(String(s || "").toLowerCase())
    .replace(/\s+/g, " ")
    .trim();
}

/* ================================
   Strict thresholds (base)
=================================== */
const STRICT = {
  default: {
    MIN_SPEECH_SEC: 1.1,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 500,
    MAX_ZCR_PSEC: 8000,
    MIN_CONFIDENCE: 0.55,
    MIN_CHAR_SIM: 0.7,
    MIN_WORD_F1: 0.6,
    MIN_LANG_LIKE: 0.55,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.5, 2.8],
  },
  es: {
    MIN_SPEECH_SEC: 1.2,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 500,
    MAX_ZCR_PSEC: 8000,
    MIN_CONFIDENCE: 0.55,
    MIN_CHAR_SIM: 0.74,
    MIN_WORD_F1: 0.65,
    MIN_LANG_LIKE: 0.55,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.5, 2.8],
  },
  en: {
    MIN_SPEECH_SEC: 1.1,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 500,
    MAX_ZCR_PSEC: 8000,
    MIN_CONFIDENCE: 0.55,
    MIN_CHAR_SIM: 0.72,
    MIN_WORD_F1: 0.62,
    MIN_LANG_LIKE: 0.55,
    DURATION_PER_CHAR_SEC: 0.04,
    DURATION_TOLERANCE: [0.5, 2.8],
  },
  nah: {
    MIN_SPEECH_SEC: 1.0,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 400,
    MAX_ZCR_PSEC: 9000,
    MIN_CONFIDENCE: 0.5,
    MIN_CHAR_SIM: 0.6,
    MIN_WORD_F1: 0.5,
    MIN_LANG_LIKE: 0.45,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.5, 3.0],
  },
  nl: {
    MIN_SPEECH_SEC: 1.1,
    MIN_RMS: 0.008,
    MIN_ZCR_PSEC: 500,
    MAX_ZCR_PSEC: 8000,
    MIN_CONFIDENCE: 0.55,
    MIN_CHAR_SIM: 0.72,
    MIN_WORD_F1: 0.62,
    MIN_LANG_LIKE: 0.55,
    DURATION_PER_CHAR_SEC: 0.045,
    DURATION_TOLERANCE: [0.5, 2.8],
  },
};

function passesSpeechQuality(
  { duration, rms, zeroCrossings },
  targetLenChars,
  cfg
) {
  if (!Number.isFinite(duration) || duration < cfg.MIN_SPEECH_SEC) return false;
  if (!Number.isFinite(rms) || rms < cfg.MIN_RMS) return false;
  const zps = zeroCrossings && duration ? zeroCrossings / duration : 0;
  if (zps < cfg.MIN_ZCR_PSEC || zps > cfg.MAX_ZCR_PSEC) return false;
  const expected = Math.max(
    cfg.MIN_SPEECH_SEC,
    targetLenChars * cfg.DURATION_PER_CHAR_SEC
  );
  const ratio = duration / expected;
  return (
    ratio >= cfg.DURATION_TOLERANCE[0] && ratio <= cfg.DURATION_TOLERANCE[1]
  );
}

/* ================================
   Parsing: .txt/.srt/.vtt/.md/.docx/.pdf
=================================== */
async function parseDocxToText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value || "";
}
async function parsePdfToText(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const parts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) =>
      typeof it.str === "string" ? it.str : ""
    );
    parts.push(strings.join(" ").replace(/\s+/g, " ").trim());
  }
  return parts.join("\n\n");
}

/* ================================
   Heuristic extractor + AI extractor
=================================== */
const smartToPlainQuotes = (s) =>
  String(s || "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u2013|\u2014/g, "-");

const stripSeparators = (s) => s.replace(/^[\s_*\-–—=]{3,}$/gm, "");
const stripTimingBlocks = (s) =>
  s
    .replace(/^\s*\d+\s*$/gm, "")
    .replace(
      /^\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,\.]\d{3}.*$/gm,
      ""
    );
const stripAllCapsHeaders = (s) =>
  s
    .split(/\r?\n/)
    .filter((line) => {
      const raw = line.trim();
      if (!raw) return false;
      const isAllCaps =
        raw.length <= 80 &&
        /[A-Z]/.test(raw) &&
        raw === raw.toUpperCase() &&
        !/[.!?"]$/.test(raw);
      const isDecor =
        /^[A-Za-z0-9 ()./#:&,'-]{1,80}$/.test(raw) &&
        !/[.!?"]$/.test(raw) &&
        /—|-/.test(raw);
      return !(isAllCaps || isDecor);
    })
    .join("\n");
const collapseWhitespace = (s) =>
  s.replace(/[ \t]+\n/g, "\n").replace(/\s{2,}/g, " ");
const stripSpeakerLabel = (line) =>
  line.replace(
    /^\s*[\[\(]?\s*[A-Z][A-Za-z .\/&'-]{1,24}\s*[:\-–—]\s*[\]\)]?\s*/u,
    ""
  );
const stripOuterQuotes = (line) =>
  line.replace(/^['"]+|['"]+$/g, "").replace(/^“+|”+$/g, "");
const stripPlaceholders = (line) =>
  line.replace(/\[([^\]]+)\]/g, (_, inner) => inner).trim();

function splitSentences(line) {
  return line
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
const NOT_SPEAKABLE = [
  /^actions?:/i,
  /^notes?:/i,
  /^subject:/i,
  /^re:/i,
  /^dear\s/i,
  /—\s*[A-Z][a-z]+(?:,|\s)/,
  /\bETA\b:/i,
  /\bSDS\b|\bCOA\b|\bRMA\b|PO\/?ID/i,
  /\{.{0,40}\}/,
];
const isSpokenish = (line) => {
  const l = line.trim();
  if (!l) return false;
  if (/[|]{3,}/.test(l)) return false;
  if (NOT_SPEAKABLE.some((rx) => rx.test(l))) return false;
  const words = l
    .replace(/[^A-Za-zÀ-ÿ' -]/g, " ")
    .trim()
    .split(/\s+/);
  const endsLikeSentence = /[.!?…]$/.test(l) || /[“"]/.test(l) || /¿|¡/.test(l);
  const looksConversational =
    /\b(you|your|we|our|I|me|my|please|thanks?|gracias|por\s+favor|hola|hello|hi|dónde|donde|qué|que|cómo|como|cuándo|cuando)\b/i.test(
      l
    );
  return words.length >= 4 && (endsLikeSentence || looksConversational);
};

function heuristicExtractSpeechLines(raw) {
  if (!raw) return [];
  let txt = smartToPlainQuotes(raw);
  const cut = txt.indexOf("END OF SCRIPT");
  if (cut >= 0) txt = txt.slice(0, cut);
  txt = stripSeparators(stripTimingBlocks(txt));
  txt = stripAllCapsHeaders(txt);
  txt = collapseWhitespace(txt);

  const out = [];
  const push = (s) => {
    const clean = stripOuterQuotes(
      stripPlaceholders(stripSpeakerLabel(s))
    ).trim();
    if (isSpokenish(clean)) {
      const parts = splitSentences(clean);
      if (parts.length) {
        parts.forEach((sent) =>
          out.push(/[.!?…]$/.test(sent) ? sent : sent + ".")
        );
      } else {
        out.push(/[.!?…]$/.test(clean) ? clean : clean + ".");
      }
    }
  };

  const quoted = [...txt.matchAll(/"([^"]{3,500})"/g)].map((m) => m[1]);
  quoted.forEach(push);

  txt.split(/\r?\n/).forEach((line) => {
    const l = line.trim();
    if (!l) return;
    if (/^(\*|-|•|\d+\.)\s*/.test(l) || /:\s*["'A-Za-z]/.test(l)) {
      push(l);
    }
  });

  txt
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((p) => {
      if (!/"[^"]{3,}"/.test(p)) splitSentences(p).forEach(push);
    });

  const deduped = Array.from(
    new Set(
      out
        .map((s) => s.replace(/\s+/g, " ").trim())
        .filter(
          (s) =>
            s.length >= 3 &&
            s.length <= 240 &&
            !NOT_SPEAKABLE.some((rx) => rx.test(s))
        )
    )
  );
  return deduped.slice(0, 120);
}

function salvageLinesFromBullets(raw) {
  const lines = String(raw || "")
    .split(/\r?\n/)
    .map((l) =>
      stripOuterQuotes(stripPlaceholders(stripSpeakerLabel(l))).trim()
    )
    .filter(Boolean)
    .filter((l) => !NOT_SPEAKABLE.some((rx) => rx.test(l)))
    .map((l) => l.replace(/^[\s*\-•\d.]+\s*/, ""))
    .map((l) => l.replace(/\s{2,}/g, " "))
    .filter((l) => l.split(/\s+/).length >= 4);
  const sents = lines.map((l) => (/[.!?…]$/.test(l) ? l : l + "."));
  return Array.from(new Set(sents)).slice(0, 120);
}

// --- AI extractor: pull only speakable lines via the LLM ---
async function aiExtractSpeechLines(raw) {
  const rules = `
You are given a script in arbitrary formatting (bullets, tables, headers, policy notes, templates, SRT/VTT, PDFs).
Return ONLY speakable lines for a live conversation/role-play.

STRICT RULES
- Exclude section headers, numbers, separators, policy text, "Actions:", after-call notes, email/chat templates (subjects, greetings, sign-offs), compliance/legal, and placeholders-only lines.
- Remove speaker labels like "Agent:" or "Customer:".
- Remove outer quotes.
- Keep placeholder words but DROP the brackets.
- Output EXACTLY one sentence per item as a compact JSON array of strings.
`.trim();

  const ex_in = `A) Greeting
   "Thank you for calling Pickle Kings Distributors, this is John. How can I help you today?"
Notes:
 - Use CRM
Email Template:
 Subject: Your Order Update
 Hi {NAME}, ...
Customer: "Where is my order?"`;
  const ex_out = `[
"Thank you for calling Pickle Kings Distributors, this is John. How can I help you today?",
"Where is my order?"
]`;

  const prompt = [
    rules,
    "### EXAMPLE INPUT",
    ex_in,
    "### EXAMPLE OUTPUT",
    ex_out,
    "### INPUT",
    smartToPlainQuotes(raw).slice(0, 35000),
    "### OUTPUT",
  ].join("\n");

  const resp = await simplemodel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text =
    (typeof resp?.response?.text === "function"
      ? resp.response.text()
      : resp?.response?.text) || "[]";

  const match = text.match(/\[[\s\S]*\]/);
  let arr = [];
  try {
    arr = JSON.parse(match ? match[0] : "[]");
  } catch {
    arr = [];
  }

  const cleaned = [];
  for (const item of Array.isArray(arr) ? arr : []) {
    const base = stripOuterQuotes(stripPlaceholders(String(item || "")));
    splitSentences(base).forEach((s) => {
      const final = s.trim();
      if (isSpokenish(final))
        cleaned.push(/[.!?…]$/.test(final) ? final : final + ".");
    });
  }
  // de-dupe & clamp
  return Array.from(
    new Set(cleaned.map((s) => s.replace(/\s+/g, " ").trim()))
  ).slice(0, 120);
}

/* ================================
   Translation helpers (length-safe)
=================================== */
async function translateLinesStrict(lines, dstLang) {
  if (!lines?.length) return [];
  const dstName = LLM_LANG_NAME(dstLang);

  const prompt = [
    `Translate each of the following sentences into ${dstName}.`,
    "Return a STRICT JSON array of strings with EXACTLY the same number of items as the input.",
    "",
    JSON.stringify(lines, null, 0),
  ].join("\n");

  async function once() {
    const resp = await simplemodel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text =
      (typeof resp?.response?.text === "function"
        ? resp.response.text()
        : resp?.response?.text) || "[]";
    const match = text.match(/\[[\s\S]*\]/);
    let arr = [];
    try {
      arr = JSON.parse(match ? match[0] : "[]");
    } catch {
      arr = [];
    }
    return Array.isArray(arr) ? arr.map((s) => String(s || "").trim()) : [];
  }

  let out = await once();
  if (out.length !== lines.length) out = await once();

  if (out.length !== lines.length) {
    const final = new Array(lines.length).fill("");
    for (let i = 0; i < lines.length; i++) {
      if (out[i]) {
        final[i] = String(out[i] || "").trim();
        continue;
      }
      const single = [
        `Translate the following sentence into ${dstName}:`,
        `"${lines[i]}"`,
        "Return ONLY the translated sentence.",
      ].join("\n");
      try {
        const r = await simplemodel.generateContent({
          contents: [{ role: "user", parts: [{ text: single }] }],
        });
        const txt =
          (typeof r?.response?.text === "function"
            ? r.response.text()
            : r?.response?.text) || "";
        final[i] = txt.replace(/^["'\s]+|["'\s]+$/g, "");
      } catch {
        final[i] = "";
      }
    }
    out = final;
  }

  return out.map((s, i) => {
    const safe = String(s || "")
      .replace(/\s+/g, " ")
      .trim();
    return safe || lines[i];
  });
}

/* ================================
   Mic + SR helpers (permissions & VAD)
=================================== */
const isInsecureContext = () => {
  try {
    if (typeof window === "undefined") return false;
    const h = window.location?.hostname || "";
    const isLocal =
      h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
    return !window.isSecureContext && !isLocal;
  } catch {
    return false;
  }
};

function micErrorToMessage(err, uiLang) {
  const t = (en, es, fr, it = en, ja = en, ar = en) =>
    uiCopy(uiLang, { en, es, it, fr, ja, ar });
  switch (err?.name) {
    case "NotAllowedError":
      return t(
        "Browser is blocking the mic for this site. Click the lock icon → Site settings → Microphone → Allow, then reload.",
        "El navegador está bloqueando el micrófono para este sitio. Haz clic en el candado → Configuración del sitio → Micrófono → Permitir y recarga.",
        "Le navigateur bloque le micro pour ce site. Clique sur le cadenas → Parametres du site → Microphone → Autoriser, puis recharge.",
        undefined,
        "ブラウザがこのサイトのマイクをブロックしています。鍵アイコン → サイト設定 → マイク → 許可を選び、再読み込みしてください。",
        "المتصفح مانع الميكروفون للموقع ده. اضغط على رمز القفل → إعدادات الموقع → الميكروفون → سماح، وبعدها أعد التحميل.",
      );
    case "SecurityError":
      return t(
        "Microphone requires HTTPS (or localhost). Open the app over https:// and try again.",
        "El micrófono requiere HTTPS (o localhost). Abre la app en https:// e inténtalo de nuevo.",
        "Le micro necessite HTTPS (ou localhost). Ouvre l'app en https:// et reessaie.",
        undefined,
        "マイクにはHTTPS（またはlocalhost）が必要です。https:// でアプリを開いてもう一度試してください。",
        "الميكروفون يحتاج HTTPS (أو localhost). افتح التطبيق عبر https:// ثم جرّب مرة أخرى.",
      );
    case "NotReadableError":
      return t(
        "The microphone is busy (Zoom/Teams/Discord). Close other apps using the mic and try again.",
        "El micrófono está en uso (Zoom/Teams/Discord). Cierra otras apps que lo usen e inténtalo de nuevo.",
        "Le micro est occupe (Zoom/Teams/Discord). Ferme les autres apps qui l'utilisent et reessaie.",
        undefined,
        "マイクが使用中です（Zoom/Teams/Discordなど）。マイクを使っている他のアプリを閉じて、もう一度試してください。",
        "الميكروفون مستخدم في تطبيق آخر (Zoom/Teams/Discord). اقفل التطبيقات الثانية ثم جرّب مرة أخرى.",
      );
    case "NotFoundError":
      return t(
        "No microphone was found or it’s disabled at the OS level.",
        "No se encontró micrófono o está deshabilitado en el sistema.",
        "Aucun micro trouve ou il est desactive dans le systeme.",
        undefined,
        "マイクが見つからないか、OS側で無効になっています。",
        "لم يتم العثور على ميكروفون أو أنه معطّل من النظام.",
      );
    case "OverconstrainedError":
      return t(
        "Requested audio constraints are not supported by your mic.",
        "Las restricciones de audio solicitadas no son compatibles con tu micrófono.",
        "Les contraintes audio demandees ne sont pas prises en charge par ton micro.",
        undefined,
        "要求された音声設定はこのマイクではサポートされていません。",
        "إعدادات الصوت المطلوبة غير مدعومة على هذا الميكروفون.",
      );
    default:
      return t(
        "Microphone error. If permissions look allowed, reload the page and try again.",
        "Error de micrófono. Si los permisos están en 'Permitir', recarga la página e inténtalo de nuevo.",
        "Erreur de micro. Si les autorisations semblent correctes, recharge la page et reessaie.",
        undefined,
        "マイクエラーです。権限が許可されている場合は、ページを再読み込みしてもう一度試してください。",
        "حصلت مشكلة في الميكروفون. إذا كانت الصلاحيات مفعلة، أعد تحميل الصفحة ثم جرّب مرة أخرى.",
      );
  }
}

/* ================================
   Component
=================================== */
export default function JobScript({
  userLanguage = "en",
  lessonContent = null,
}) {
  const toast = useToast();
  const user = useUserStore((s) => s.user);

  // Shared settings + XP
  const { xp, levelNumber, progressPct, progress, npub } = useSharedProgress();

  // App UI language
  const uiLang = getAppUILang();
  const uiText = useUIText(uiLang, progress.level, translations);

  // Free-form languages (inputs)
  const [practiceSupport, setPracticeSupport] = useState(
    displayLanguageName(progress.supportLang || DEFAULT_SUPPORT_LANGUAGE, uiLang),
  );
  const [practiceTarget, setPracticeTarget] = useState(
    displayLanguageName(progress.targetLang || DEFAULT_TARGET_LANGUAGE, uiLang),
  );

  // Script state
  const [scriptText, setScriptText] = useState("");
  const [creatingScript, setCreatingScript] = useState(false);

  // Save/load state
  const [savedTitle, setSavedTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedScripts, setSavedScripts] = useState([]);
  const [lastFileName, setLastFileName] = useState("");

  // Built practice data
  const [storyData, setStoryData] = useState(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);

  // Audio / recording
  const currentAudioRef = useRef(null);
  const currentAudioUrlRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // SR aggregation / silence gating
  const aggTranscriptRef = useRef("");
  const heardOnceRef = useRef(false);
  const lastHeardAtRef = useRef(0);
  const silenceTimerRef = useRef(null);
  const startedAtRef = useRef(0);
  const mrMimeRef = useRef("");

  // VAD refs
  const vadCtxRef = useRef(null);
  const vadAnalyserRef = useRef(null);
  const vadSourceRef = useRef(null);
  const vadIntervalRef = useRef(null);

  const gradedOnceRef = useRef(false);

  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [isPlayingSupport, setIsPlayingSupport] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const targetLang =
    toLangKey(practiceTarget) ||
    normalizePracticeLanguage(practiceTarget, DEFAULT_TARGET_LANGUAGE);
  const supportLang =
    toLangKey(practiceSupport) ||
    normalizeSupportLanguage(practiceSupport, DEFAULT_SUPPORT_LANGUAGE);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const currentSentence = storyData?.sentences?.[currentSentenceIndex];

  /* ----------------------------- Saved scripts listener ----------------------------- */
  useEffect(() => {
    if (!npub) return;
    const colRef = collection(database, "users", npub, "savedScripts");
    const q = query(colRef, orderBy("createdAt", "desc"), qLimit(50));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSavedScripts(items);
      },
      () => setSavedScripts([])
    );
    return () => unsub();
  }, [npub]);

  /* ----------------------------- File handling ----------------------------- */
  const handleFile = async (file) => {
    if (!file) return;
    const name = file.name || "";
    theExt: {
      const ext = name.toLowerCase().split(".").pop();
      try {
        let text = "";
        if (/(txt|srt|vtt|md)$/.test(ext)) {
          text = await file.text();
        } else if (ext === "docx") {
          text = await parseDocxToText(file);
        } else if (ext === "pdf") {
          text = await parsePdfToText(file);
        } else {
          toast({
            title: uiCopy(uiLang, {
              en: "Unsupported file",
              es: "Archivo no compatible",
              it: "File non supportato",
              fr: "Fichier non pris en charge",
              ja: "未対応のファイルです",
              ar: "ملف غير مدعوم",
            }),
            description: uiCopy(uiLang, {
              en: "Use .txt, .srt, .vtt, .md, .docx, or .pdf",
              es: "Usa .txt, .srt, .vtt, .md, .docx o .pdf",
              it: "Usa .txt, .srt, .vtt, .md, .docx o .pdf",
              fr: "Utilise .txt, .srt, .vtt, .md, .docx ou .pdf",
              ja: ".txt、.srt、.vtt、.md、.docx、.pdf を使ってください",
              ar: "استخدم .txt أو .srt أو .vtt أو .md أو .docx أو .pdf",
            }),
            status: "warning",
          });
          break theExt;
        }
        setScriptText(text || "");
        setLastFileName(name);
        toast({
          title: uiCopy(uiLang, {
            en: "File loaded",
            es: "Archivo cargado",
            it: "File caricato",
            fr: "Fichier charge",
            ja: "ファイルを読み込みました",
            ar: "تم تحميل الملف",
          }),
          status: "success",
          duration: 1200,
        });
      } catch (e) {
        console.error(e);
        toast({
          title: uiCopy(uiLang, {
            en: "File read error",
            es: "Error al leer archivo",
            it: "Errore di lettura del file",
            fr: "Erreur de lecture du fichier",
            ja: "ファイルの読み取りエラー",
            ar: "خطأ في قراءة الملف",
          }),
          description: String(e?.message || e),
          status: "error",
        });
      }
    }
  };

  /* -------------------- Create script (extract ⇒ translate x2) -------------------- */
  const buildFromScript = async () => {
    const raw = (scriptText || "").trim();
    if (!raw) {
      toast({ title: uiText.needText, status: "warning" });
      return;
    }
    setCreatingScript(true);
    try {
      // 1) extract speakable sentences
      let lines = heuristicExtractSpeechLines(raw);
      const aiLines = await aiExtractSpeechLines(raw);
      if (aiLines.length) {
        const seen = new Set();
        lines = aiLines
          .concat(lines)
          .map((s) => s.trim())
          .filter((s) => {
            const k = s.toLowerCase();
            if (!s) return false;
            if (s.length > 240) return false;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
      }

      if (!lines.length) lines = salvageLinesFromBullets(raw);
      lines = lines.filter((s) => !NOT_SPEAKABLE.some((rx) => rx.test(s)));

      const preFilter = lines.slice();
      lines = filterBilingualLines(lines, targetLang, supportLang);
      if (!lines.length) lines = preFilter;

      if (!lines.length) {
        toast({ title: uiText.needText, status: "warning" });
        return;
      }

      // 2) translate to TARGET (practice) language
      const tgtLines =
        supportLang === targetLang && targetLang === "en"
          ? lines
          : await translateLinesStrict(lines, targetLang);

      // 3) translate to SUPPORT language
      let supLines = [];
      if (supportLang && supportLang !== targetLang) {
        supLines = await translateLinesStrict(lines, supportLang);
      } else {
        supLines = new Array(lines.length).fill("");
      }

      // 4) build story data with TARGET-based dedupe
      const byTgt = new Map();
      for (let i = 0; i < tgtLines.length; i++) {
        const tgt = String(tgtLines[i] || "").trim();
        const sup = String(supLines[i] || "").trim();
        const key = normalizeForDedup(tgt);
        if (!key) continue;
        if (!byTgt.has(key)) byTgt.set(key, { tgt, sup });
      }
      let sentences = Array.from(byTgt.values()).filter(
        (s) => s.tgt.length > 0
      );

      if (!sentences.length) {
        const salvage = salvageLinesFromBullets(raw);
        if (salvage.length) {
          const [t2, s2] = await Promise.all([
            translateLinesStrict(salvage, targetLang),
            supportLang && supportLang !== targetLang
              ? translateLinesStrict(salvage, supportLang)
              : new Array(salvage.length).fill(""),
          ]);
          const by2 = new Map();
          for (let i = 0; i < t2.length; i++) {
            const T = String(t2[i] || "").trim();
            const S = String(s2[i] || "").trim();
            const K = normalizeForDedup(T);
            if (!K) continue;
            if (!by2.has(K)) by2.set(K, { tgt: T, sup: S });
          }
          sentences = Array.from(by2.values()).filter((s) => s.tgt.length > 0);
        }
      }

      if (!sentences.length) {
        toast({ title: uiText.needText, status: "warning" });
        return;
      }

      setStoryData({
        fullStory: {
          tgt: sentences.map((s) => s.tgt).join(" "),
          sup: sentences
            .map((s) => s.sup)
            .filter(Boolean)
            .join(" "),
        },
        sentences,
      });

      setCurrentSentenceIndex(0);
      setSessionXp(0);

      toast({ title: uiText.builtOk, status: "success", duration: 1500 });
    } catch (e) {
      console.error(e);
      toast({
        title: uiCopy(uiLang, {
          en: "Couldn’t create script",
          es: "No se pudo crear el guion",
          it: "Impossibile creare il copione",
          fr: "Impossible de creer le script",
          ja: "スクリプトを作成できませんでした",
          ar: "تعذر إنشاء السكربت",
        }),
        description: String(e?.message || e),
        status: "error",
      });
    } finally {
      setCreatingScript(false);
    }
  };

  /* ----------------------------- Save / Load ----------------------------- */
  const saveCurrentScript = async () => {
    if (!npub || !storyData) {
      toast({
        title: uiCopy(uiLang, {
          en: "Nothing to save",
          es: "Nada que guardar",
          it: "Niente da salvare",
          fr: "Rien a enregistrer",
          ja: "保存するものがありません",
          ar: "لا يوجد شيء للحفظ",
        }),
        status: "warning",
      });
      return;
    }
    setSaving(true);
    try {
      const colRef = collection(database, "users", npub, "savedScripts");
      const titleFallback =
        savedTitle ||
        lastFileName ||
        storyData.sentences?.[0]?.tgt?.slice(0, 40) ||
        "Untitled";
      const payload = {
        title: String(titleFallback).slice(0, 120),
        targetLang,
        supportLang,
        raw: (scriptText || "").slice(0, 100000),
        sentences: storyData.sentences,
        fullStory: storyData.fullStory,
        filename: lastFileName || "",
        createdAt: serverTimestamp(),
        createdAtClient: Date.now(),
        version: 1,
        origin: "jobscript",
      };
      await addDoc(colRef, payload);
      setSavedTitle("");
      toast({ title: uiText.scriptSaved, status: "success", duration: 1400 });
    } catch (e) {
      toast({
        title: uiCopy(uiLang, {
          en: "Couldn’t save",
          es: "No se pudo guardar",
          it: "Impossibile salvare",
          fr: "Impossible d'enregistrer",
          ja: "保存できませんでした",
          ar: "تعذر الحفظ",
        }),
        description: String(e?.message || e),
        status: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const loadSavedScript = (item) => {
    if (!item) return;
    try {
      setStoryData({
        sentences: item.sentences || [],
        fullStory: item.fullStory || { tgt: "", sup: "" },
      });
      setCurrentSentenceIndex(0);
      setSessionXp(0);
      if (item.targetLang) setPracticeTarget(item.targetLang);
      if (item.supportLang) setPracticeSupport(item.supportLang);
      setScriptText(item.raw || "");
      toast({ title: uiText.scriptLoaded, status: "success", duration: 1200 });
    } catch (e) {
      toast({
        title: uiCopy(uiLang, {
          en: "Couldn’t open",
          es: "No se pudo abrir",
          it: "Impossibile aprire",
          fr: "Impossible d'ouvrir",
          ja: "開けませんでした",
          ar: "تعذر الفتح",
        }),
        description: String(e?.message || e),
        status: "error",
      });
    }
  };

  const formatWhen = (ts) => {
    try {
      if (ts?.seconds) {
        const d = new Date(ts.seconds * 1000);
        return d.toLocaleString();
      }
      if (typeof ts === "number") return new Date(ts).toLocaleString();
    } catch {}
    return "";
  };

  /* ----------------------------- TTS ----------------------------- */
  const stopAllAudio = () => {
    try {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    } catch {}
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsPlayingTarget(false);
    setIsPlayingSupport(false);
  };

  const playWithOpenAITTS = async (text, langTag, setLoading) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (currentAudioUrlRef.current) {
        try {
          URL.revokeObjectURL(currentAudioUrlRef.current);
        } catch {}
        currentAudioUrlRef.current = null;
      }

      const player = await getTTSPlayer({
        text,
        langTag,
        responseFormat: LOW_LATENCY_TTS_FORMAT,
      });
      currentAudioUrlRef.current = player.audioUrl;

      const audio = player.audio;
      currentAudioRef.current = audio;

      audio.onended = () => {
        setLoading(false);
        currentAudioRef.current = null;
        player.cleanup?.();
      };
      audio.onerror = () => {
        setLoading(false);
        currentAudioRef.current = null;
        player.cleanup?.();
      };

      await player.ready;
      await audio.play();
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  const playTargetTTS = async (text) => {
    if (!text) return;
    stopAllAudio();
    setIsPlayingTarget(true);
    try {
      await playWithOpenAITTS(
        text,
        toBCP47(targetLang, "en-US"),
        setIsPlayingTarget
      );
    } catch {
      setIsPlayingTarget(false);
    }
  };

  const playSupportTTS = async (text) => {
    if (!text) return;
    stopAllAudio();
    setIsPlayingSupport(true);
    try {
      await playWithOpenAITTS(
        text,
        toBCP47(supportLang, "en-US"),
        setIsPlayingSupport
      );
    } catch {
      setIsPlayingSupport(false);
    }
  };

  /* ================================
     VAD (simple RMS-based)
  =================================*/
  const setupVAD = (stream) => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buf = new Float32Array(analyser.fftSize);
      vadCtxRef.current = ctx;
      vadAnalyserRef.current = analyser;
      vadSourceRef.current = source;

      // sample every ~100ms
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = setInterval(() => {
        try {
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const rms = Math.sqrt(sum / buf.length);
          // threshold tuned to be above room noise but below normal speech
          if (rms > 0.02) {
            heardOnceRef.current = true;
            lastHeardAtRef.current = Date.now();
          }
        } catch {}
      }, 100);
    } catch (e) {
      // VAD optional; ignore if fails
      console.warn("VAD setup failed:", e);
    }
  };

  const cleanupVAD = () => {
    try {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
      vadSourceRef.current && vadSourceRef.current.disconnect();
      vadAnalyserRef.current && vadAnalyserRef.current.disconnect();
      if (vadCtxRef.current && vadCtxRef.current.state !== "closed") {
        vadCtxRef.current.close();
      }
    } catch {}
    vadCtxRef.current = null;
    vadAnalyserRef.current = null;
    vadSourceRef.current = null;
  };

  /* ----------------------------- Recording + ADAPTIVE grading ----------------------------- */
  // ADAPTIVE grading: softer gates for SR; no hard fail on language-likelihood; speech-quality only when audioMetrics present
  function evaluateAttemptAdaptive({
    recognizedText = "",
    confidence = 0,
    audioMetrics,
    targetSentence = "",
    lang = "es",
    method = "live-speech-api",
  }) {
    const cfg = STRICT[lang] || STRICT.default;
    const recWords = tokenizeWords(recognizedText);
    const tgtWords = tokenizeWords(targetSentence);

    if (audioMetrics) {
      const ok = passesSpeechQuality(
        audioMetrics,
        (targetSentence || "").length,
        cfg
      );
      if (!ok) {
        return {
          pass: false,
          score: 0,
          reasons: ["speech-quality"],
          charSim: 0,
          f1: 0,
          langLike: 0,
          confidence,
        };
      }
    }

    const charSim = charSimilarity01(recognizedText, targetSentence);
    const { f1 } = wordPRF(recWords, tgtWords, lang, { dropStopwords: true });

    const soften = method === "live-speech-api" ? 0.06 : 0;
    const minChar = Math.max(0, (cfg.MIN_CHAR_SIM || 0.7) - soften);
    const minF1 = Math.max(0, (cfg.MIN_WORD_F1 || 0.6) - soften);

    const reasons = [];
    if (charSim < minChar) reasons.push("low-char-sim");
    if (f1 < minF1) reasons.push("low-word-f1");

    const langLike = languageLikelihood(recWords, lang);

    const pass = reasons.length === 0;
    const score = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          charSim * 65 +
            f1 * 35 +
            langLike * 10 +
            Math.max(confidence || 0.55, 0.55) * 10
        )
      )
    );
    return { pass, score, reasons, charSim, f1, langLike, confidence };
  }

  const handleEvaluationResult = async ({
    recognizedText = "",
    confidence = 0,
    audioMetrics,
    method = "live-speech-api",
  }) => {
    const target = currentSentence?.tgt || "";
    const evalOut = evaluateAttemptAdaptive({
      recognizedText,
      confidence,
      audioMetrics,
      targetSentence: target,
      lang: targetLang || "es",
      method,
    });
    const npubLive = strongNpub(useUserStore.getState().user);

    const delta = 5; // ✅ normalized to 4-7 XP range
    setSessionXp((p) => p + delta);

    saveStoryTurn(npubLive, {
      ok: true,
      mode: "sentence",
      lang: targetLang,
      supportLang,
      sentenceIndex: currentSentenceIndex,
      target,
      recognizedText,
      confidence,
      audioMetrics: audioMetrics || null,
      eval: evalOut,
      xpAwarded: 0,
    }).catch(() => {});

    setTimeout(() => {
      const last =
        currentSentenceIndex >= (storyData?.sentences?.length || 0) - 1;
      if (!last) {
        setCurrentSentenceIndex((p) => p + 1);
      } else {
        finalizePracticeSession(sessionXp + delta);
      }
      setIsRecording(false);
    }, 800);
  };

  const finalizePracticeSession = async (awardedXp) => {
    const npubLive = strongNpub(useUserStore.getState().user);
    if (!npubLive) return;

    if (awardedXp > 0) {
      await awardXp(npubLive, Math.round(awardedXp), targetLang).catch(
        () => {}
      );
    }
    try {
      await saveStoryTurn(npubLive, {
        ok: true,
        mode: "story-session-complete",
        lang: targetLang,
        supportLang,
        totalSentences: storyData?.sentences?.length || 0,
        xpAwarded: Math.round(awardedXp || 0),
      });
    } catch {}

    toast({
      title: uiCopy(uiLang, {
        en: "Congrats!",
        es: "¡Felicidades!",
        it: "Congratulazioni!",
        fr: "Felicitations !",
        ja: "おめでとうございます！",
        ar: "مبروك!",
      }),
      description: uiCopy(uiLang, {
        en: `Practice completed! You earned ${awardedXp} ${uiText.xp}.`,
        es: `¡Completaste la práctica! Ganaste ${awardedXp} ${uiText.xp}.`,
        it: `Pratica completata! Hai guadagnato ${awardedXp} ${uiText.xp}.`,
        fr: `Pratique terminee ! Tu as gagne ${awardedXp} ${uiText.xp}.`,
        ja: `練習完了！${awardedXp} ${uiText.xp}を獲得しました。`,
        ar: `خلصت التدريب! كسبت ${awardedXp} ${uiText.xp}.`,
      }),
      status: "success",
      duration: 3000,
    });

    setCurrentSentenceIndex(0);
    setSessionXp(0);
  };

  /* ----------------------------- Recording lifecycle ----------------------------- */
  const startRecording = async () => {
    gradedOnceRef.current = false;
    aggTranscriptRef.current = "";
    heardOnceRef.current = false;
    lastHeardAtRef.current = 0;
    startedAtRef.current = Date.now();
    mrMimeRef.current = "";

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Insecure context guard
    if (isInsecureContext()) {
      toast({
        title: uiCopy(uiLang, {
          en: "Microphone blocked",
          es: "Micrófono bloqueado",
          it: "Microfono bloccato",
          fr: "Micro bloque",
          ja: "マイクがブロックされています",
          ar: "الميكروفون محظور",
        }),
        description: micErrorToMessage({ name: "SecurityError" }, uiLang),
        status: "warning",
        duration: 4500,
      });
      return;
    }

    // Permission probe (best-effort)
    try {
      const perm = await navigator.permissions?.query?.({ name: "microphone" });
      if (perm?.state === "denied") {
        toast({
          title: uiCopy(uiLang, {
            en: "Microphone blocked",
            es: "Micrófono bloqueado",
            it: "Microfono bloccato",
            fr: "Micro bloque",
            ja: "マイクがブロックされています",
            ar: "الميكروفون محظور",
          }),
          description: micErrorToMessage({ name: "NotAllowedError" }, uiLang),
          status: "error",
          duration: 5000,
        });
        return;
      }
    } catch {}

    // Helper: start SpeechRecognition (used both with and without a stream)
    const startSRSession = () => {
      if (!SR) return false;
      try {
        const recog = new SR();
        recognitionRef.current = recog;
        recog.lang = toBCP47(targetLang, "en-US");
        recog.continuous = true;
        recog.interimResults = true;
        recog.maxAlternatives = 1;

        recog.onresult = (evt) => {
          for (let i = evt.resultIndex; i < evt.results.length; i++) {
            const r = evt.results[i];
            const txt = (r[0]?.transcript || "").trim();
            if (!txt) continue;
            heardOnceRef.current = true;
            lastHeardAtRef.current = Date.now();
            if (r.isFinal) {
              aggTranscriptRef.current = (
                aggTranscriptRef.current +
                " " +
                txt
              ).trim();
            }
          }
        };

        recog.onerror = () => {
          // keep running; silence timer handles stop
        };
        recog.onend = () => {
          if (isRecording) {
            try {
              recog.start();
            } catch {}
          }
        };

        recog.start();
        return true;
      } catch (e) {
        console.error("SR start failed:", e);
        return false;
      }
    };

    // Try to get a stream (preferred: gives VAD + offline metrics)
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
      mediaStreamRef.current = stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      // If we can still start SR-only, do it
      const msg = micErrorToMessage(err, uiLang);
      toast({
        title: uiCopy(uiLang, {
          en: "Microphone issue",
          es: "Problema con el micrófono",
          it: "Problema con il microfono",
          fr: "Probleme de micro",
          ja: "マイクの問題",
          ar: "مشكلة في الميكروفون",
        }),
        description: msg,
        status: "warning",
        duration: 6000,
      });
      const srOk = startSRSession();
      if (srOk) {
        setIsRecording(true);
        // Silence gate (2.5s after last SR activity; max 20s)
        const SILENCE_MS = 2500;
        const MAX_MS = 20000;
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = setInterval(() => {
          const now = Date.now();
          const maxed = now - startedAtRef.current > MAX_MS;
          const silentLongEnough =
            heardOnceRef.current && lastHeardAtRef.current > 0
              ? now - lastHeardAtRef.current > SILENCE_MS
              : false;

          if (silentLongEnough || maxed) {
            try {
              recognitionRef.current?.stop?.();
            } catch {}
            if (!gradedOnceRef.current) {
              gradedOnceRef.current = true;
              handleEvaluationResult({
                recognizedText: aggTranscriptRef.current.trim(),
                confidence: 0,
                audioMetrics: null,
                method: "live-speech-api",
              }).finally(() => {
                clearInterval(silenceTimerRef.current);
                silenceTimerRef.current = null;
                setIsRecording(false);
              });
            } else {
              clearInterval(silenceTimerRef.current);
              silenceTimerRef.current = null;
              setIsRecording(false);
            }
          }
        }, 200);
        return;
      }

      toast({
        title: uiCopy(uiLang, {
          en: "Couldn’t use microphone",
          es: "No se pudo usar el micrófono",
          it: "Impossibile usare il microfono",
          fr: "Impossible d'utiliser le micro",
          ja: "マイクを使用できませんでした",
          ar: "تعذر استخدام الميكروفون",
        }),
        description: uiCopy(uiLang, {
          en: "Try Chrome/Edge over https://, check the lock icon (Microphone: Allow), and make sure no app is using the mic.",
          es: "Prueba en Chrome/Edge con https://, revisa el candado (Micrófono: Permitir) y que ninguna app esté usando el micrófono.",
          it: "Prova Chrome/Edge su https://, controlla il lucchetto (Microfono: Consenti) e assicurati che nessun'altra app usi il microfono.",
          fr: "Essaie Chrome/Edge en https://, verifie le cadenas (Microphone : Autoriser) et assure-toi qu'aucune autre app n'utilise le micro.",
          ja: "https:// のChrome/Edgeで試し、鍵アイコン（マイク: 許可）を確認し、他のアプリがマイクを使用していないことを確認してください。",
          ar: "جرّب Chrome/Edge عبر https://، وتأكد من رمز القفل (الميكروفون: سماح)، وأنه لا يوجد تطبيق آخر يستخدم الميكروفون.",
        }),
        status: "error",
        duration: 7000,
      });
      return;
    }

    // We have a stream ⇒ MR + VAD + SR
    try {
      // MediaRecorder
      let mime = "";
      try {
        if (MediaRecorder?.isTypeSupported?.("audio/webm;codecs=opus")) {
          mime = "audio/webm;codecs=opus";
        } else if (MediaRecorder?.isTypeSupported?.("audio/webm")) {
          mime = "audio/webm";
        } else if (MediaRecorder) {
          mime = "";
        }
      } catch {}
      const mr = MediaRecorder
        ? mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream)
        : null;
      mediaRecorderRef.current = mr;
      mrMimeRef.current = mime;

      const chunks = [];
      if (mr) {
        mr.ondataavailable = (e) => {
          if (e.data?.size) chunks.push(e.data);
        };
        mr.onstop = async () => {
          // Offline metrics (if any)
          let duration = null,
            rms = null,
            zc = null;
          try {
            if (chunks.length) {
              const AC = window.AudioContext || window.webkitAudioContext;
              const arrayBuf = await new Blob(chunks, {
                type: mrMimeRef.current || "audio/webm",
              }).arrayBuffer();
              const ctx = new AC();
              const audio = await ctx.decodeAudioData(arrayBuf);
              const ch0 = audio.getChannelData(0);
              duration = audio.duration;
              let sum = 0;
              for (let i = 0; i < ch0.length; i++) sum += ch0[i] * ch0[i];
              rms = Math.sqrt(sum / ch0.length);
              let zcCount = 0;
              for (let i = 1; i < ch0.length; i++)
                if (ch0[i] >= 0 !== ch0[i - 1] >= 0) zcCount++;
              zc = zcCount;
            }
          } catch {}

          if (!gradedOnceRef.current) {
            gradedOnceRef.current = true;
            await handleEvaluationResult({
              recognizedText: aggTranscriptRef.current.trim(),
              confidence: 0,
              audioMetrics: chunks.length
                ? { duration, rms, zeroCrossings: zc }
                : null,
              method: "live-speech-api",
            });
          }

          cleanupVAD();
          try {
            mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
          } catch {}
          clearInterval(silenceTimerRef.current);
          silenceTimerRef.current = null;
          setIsRecording(false);
        };

        try {
          mr.start();
        } catch (e) {
          console.warn("MediaRecorder start failed:", e);
        }
      }

      // VAD + SR
      setupVAD(stream);
      startSRSession();

      // Flip UI
      setIsRecording(true);

      // Silence gate: 2.5s after last voice; hard cap 20s
      const SILENCE_MS = 2500;
      const MAX_MS = 20000;
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = setInterval(() => {
        const now = Date.now();
        const maxed = now - startedAtRef.current > MAX_MS;
        const silentLongEnough =
          heardOnceRef.current && lastHeardAtRef.current > 0
            ? now - lastHeardAtRef.current > SILENCE_MS
            : false;

        if (silentLongEnough || maxed) {
          try {
            recognitionRef.current?.stop?.();
          } catch {}
          try {
            if (mediaRecorderRef.current?.state === "recording") {
              mediaRecorderRef.current.stop();
            }
          } catch {}
          if (!mediaRecorderRef.current) {
            // SR-only cleanup (shouldn't happen here since we have a stream)
            if (!gradedOnceRef.current) {
              gradedOnceRef.current = true;
              handleEvaluationResult({
                recognizedText: aggTranscriptRef.current.trim(),
                confidence: 0,
                audioMetrics: null,
                method: "live-speech-api",
              }).finally(() => {
                cleanupVAD();
                try {
                  mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
                } catch {}
                clearInterval(silenceTimerRef.current);
                silenceTimerRef.current = null;
                setIsRecording(false);
              });
            } else {
              cleanupVAD();
              try {
                mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
              } catch {}
              clearInterval(silenceTimerRef.current);
              silenceTimerRef.current = null;
              setIsRecording(false);
            }
          }
        }
      }, 200);
    } catch (e) {
      console.error("Recording setup failed:", e);
      toast({
        title: uiCopy(uiLang, {
          en: "Microphone error",
          es: "Error de micrófono",
          it: "Errore del microfono",
          fr: "Erreur de micro",
          ja: "マイクエラー",
          ar: "خطأ في الميكروفون",
        }),
        description: micErrorToMessage(e, uiLang),
        status: "error",
        duration: 6000,
      });
    }
  };

  const stopRecording = () => {
    try {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
      recognitionRef.current?.stop?.();
    } catch {}
    try {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      } else {
        // SR-only path: evaluate whatever we have
        if (!gradedOnceRef.current) {
          gradedOnceRef.current = true;
          handleEvaluationResult({
            recognizedText: aggTranscriptRef.current.trim(),
            confidence: 0,
            audioMetrics: null,
            method: "live-speech-api",
          }).finally(() => {
            setIsRecording(false);
          });
        } else {
          setIsRecording(false);
        }
      }
    } catch {}
    try {
      cleanupVAD();
      mediaStreamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
  };

  /* ----------------------------- Progress ----------------------------- */
  const progressPercentage = storyData
    ? (Math.min(currentSentenceIndex + 1, storyData.sentences.length) /
        storyData.sentences.length) *
      100
    : 0;

  /* ----------------------------- UI ----------------------------- */
  return (
    <Box
      minH="100vh"
      // bg="linear-gradient(135deg, #0f0f23 0%, #1a1e2e 50%, #16213e 100%)"
    >
      {/* Header */}
      <motion.div
        initial={prefersReducedMotion ? {} : { y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={
          prefersReducedMotion ? {} : { duration: 0.6, ease: "easeOut" }
        }
      >
        <HStack
          as="header"
          w="100%"
          px={4}
          py={3}
          // bg="rgba(15, 15, 35, 0.8)"
          backdropFilter="blur(20px)"
          color="white"
          // borderBottom="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          position="sticky"
          top={{ base: "60px", md: "70px" }}
          zIndex={10}
          bg="rgba(5, 8, 20, 0.85)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.35)"
        >
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="700">
              {uiText.header}
            </Text>
            <Text fontSize="sm" color="#94a3b8">
              {uiText.sub}
            </Text>
          </VStack>
          <Spacer />
          {sessionXp > 0 && (
            <Badge colorScheme="teal" variant="subtle" fontSize="sm">
              +{sessionXp}
            </Badge>
          )}
        </HStack>
      </motion.div>

      {/* Level/XP */}
      <Box px={4} pt={4}>
        <Box p={3} rounded="2xl">
          <Box display="flex" justifyContent="center">
            <Box width="50%">
              <XpProgressHeader
                levelText={`${uiText.levelLabel} ${levelNumber}`}
                xpText={`${uiText.xp} ${xp}`}
                progressPct={progressPct}
                xpBadgeProps={{ colorScheme: "teal", fontSize: "10px" }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Builder */}
      <Box px={4} py={2}>
        <VStack
          spacing={3}
          align="stretch"
          bg="rgba(255,255,255,0.04)"
          p={4}
          rounded="xl"
          border="1px solid rgba(255,255,255,0.08)"
        >
          <HStack spacing={3} flexWrap="wrap">
            <Box minW="220px">
              <Text fontSize="xs" mb={1} color="#94a3b8">
                {uiText.iSpeak}
              </Text>
              <Input
                value={practiceSupport}
                onChange={(e) => setPracticeSupport(e.target.value)}
                bg="gray.800"
                color="white"
                placeholder={uiText.langPH}
              />
            </Box>
            <Box minW="220px">
              <Text fontSize="xs" mb={1} color="#94a3b8">
                {uiText.iLearn}
              </Text>
              <Input
                value={practiceTarget}
                onChange={(e) => setPracticeTarget(e.target.value)}
                bg="gray.800"
                color="white"
                placeholder={uiText.langPH}
              />
            </Box>
          </HStack>

          <Textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            minH="140px"
            bg="gray.800"
            color="white"
            placeholder={uiText.pastePH}
          />

          <HStack spacing={3} align="center">
            <Button
              leftIcon={<MdOutlineFileUpload />}
              variant="outline"
              borderColor="rgba(255,255,255,0.3)"
              color="white"
              onClick={() =>
                document.getElementById("script-upload-input")?.click()
              }
            >
              {uiText.upload}
            </Button>
            <Input
              id="script-upload-input"
              type="file"
              accept=".txt,.srt,.vtt,.md,.docx,.pdf"
              display="none"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Spacer />
            <Button
              colorScheme="teal"
              onClick={buildFromScript}
              isLoading={creatingScript}
            >
              {uiText.build}
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Save controls + Saved list (shows when we have a built script) */}
      {storyData && (
        <Box px={4} pt={2}>
          <HStack spacing={3} align="center">
            <Input
              value={savedTitle}
              onChange={(e) => setSavedTitle(e.target.value)}
              bg="gray.800"
              color="white"
              placeholder={uiText.titlePH}
              maxW="360px"
            />
            <Button
              onClick={saveCurrentScript}
              isLoading={saving}
              colorScheme="purple"
              variant="solid"
            >
              {uiText.save}
            </Button>
          </HStack>
        </Box>
      )}

      {/* Saved scripts list */}
      <Box px={4} py={3}>
        <Text fontSize="md" color="#94a3b8" mb={2}>
          {uiText.savedHeader}
        </Text>
        {savedScripts.length === 0 ? (
          <Text fontSize="sm" color="#64748b">
            {uiText.noneSaved}
          </Text>
        ) : (
          <SimpleGrid columns={[1, 2, 3]} spacing={3}>
            {savedScripts.map((it) => (
              <Card
                key={it.id}
                bg="rgba(255,255,255,0.04)"
                border="1px solid rgba(255,255,255,0.08)"
              >
                <CardHeader pb={0}>
                  <Text fontWeight="600" color="white">
                    {it.title || it.filename || "Untitled"}
                  </Text>
                </CardHeader>
                <CardBody pt={2}>
                  <Text fontSize="xs" color="#94a3b8" mb={2}>
                    {formatWhen(it.createdAt) || formatWhen(it.createdAtClient)}
                  </Text>
                  <HStack>
                    <Button
                      size="sm"
                      leftIcon={<MdOpenInNew />}
                      variant="outline"
                      borderColor="rgba(255,255,255,0.3)"
                      color="white"
                      onClick={() => loadSavedScript(it)}
                    >
                      {uiText.open}
                    </Button>
                    <Spacer />
                    <Badge variant="subtle" colorScheme="cyan">
                      {displayLanguageName(it.targetLang, uiLang)} /{" "}
                      {displayLanguageName(it.supportLang, uiLang)}
                    </Badge>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Practice UI */}
      {storyData && (
        <>
          <Box px={4} py={3}>
            <VStack spacing={2}>
              <HStack w="100%" justify="space-between">
                <Text fontSize="sm" color="#94a3b8">
                  {uiText.progress}
                </Text>
                <Text fontSize="sm" color="#94a3b8">
                  {`${currentSentenceIndex + 1} / ${
                    storyData?.sentences?.length || 0
                  }`}
                </Text>
              </HStack>
              <Progress
                value={progressPercentage}
                w="100%"
                h="8px"
                borderRadius="full"
                bg="rgba(255, 255, 255, 0.1)"
                // sx={{
                //   "& > div": {
                //     bg: "linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)",
                //   },
                // }}
              />
            </VStack>
          </Box>

          <Box px={4} py={6}>
            <Divider opacity={0.15} mb={4} />
            <VStack spacing={4} align="stretch">
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                p={6}
                rounded="20px"
                border="1px solid rgba(255, 255, 255, 0.1)"
                backdropFilter="blur(20px)"
              >
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="lg" fontWeight="500" color="#f8fafc" mb={3}>
                      {uiText.practiceThis}
                    </Text>
                    <Text
                      fontSize="xl"
                      fontWeight="600"
                      color="white"
                      lineHeight="1.6"
                      mb={2}
                      textAlign="center"
                    >
                      {currentSentence?.tgt}
                    </Text>
                    {!!currentSentence?.sup && (
                      <Text
                        fontSize="md"
                        color="#94a3b8"
                        lineHeight="1.5"
                        textAlign="center"
                      >
                        {currentSentence?.sup}
                      </Text>
                    )}
                    <Text
                      fontSize="sm"
                      color="#64748b"
                      textAlign="center"
                      mt={2}
                    >
                      {uiCopy(uiLang, {
                        en: "Sentence",
                        es: "Oración",
                        it: "Frase",
                        fr: "Phrase",
                        ja: "文",
                        ar: "الجملة",
                      })}{" "}
                      {currentSentenceIndex + 1}{" "}
                      {uiCopy(uiLang, {
                        en: "of",
                        es: "de",
                        it: "di",
                        fr: "sur",
                        ja: "／",
                        ar: "من",
                      })}{" "}
                      {storyData.sentences.length}
                    </Text>
                  </Box>

                  <VStack spacing={4}>
                    <Center>
                      <Button
                        onClick={() => {
                          if (isRecording) return stopRecording();
                          return startRecording();
                        }}
                        size="lg"
                        height="60px"
                        px={8}
                        rounded="full"
                        bg={
                          isRecording
                            ? SOFT_STOP_BUTTON_BG
                            : "linear-gradient(135deg,rgb(0, 157, 255) 0%,rgb(0, 101, 210) 100%)"
                        }
                        boxShadow={
                          isRecording
                            ? `0px 4px 0px ${SOFT_STOP_BUTTON_EDGE}`
                            : undefined
                        }
                        color="white"
                        fontWeight="600"
                        fontSize="lg"
                        leftIcon={<PiMicrophoneStageDuotone />}
                        _hover={{
                          bg: isRecording
                            ? SOFT_STOP_BUTTON_HOVER_BG
                            : "linear-gradient(135deg,rgb(0, 157, 255) 0%,rgb(0, 101, 210) 100%)",
                          transform: "translateY(-2px)",
                        }}
                        _active={{ transform: "translateY(0)" }}
                        transition="all 0.2s ease"
                      >
                        {isRecording ? uiText.stopRecording : uiText.record}
                      </Button>
                    </Center>
                    <HStack spacing={3} justify="center">
                      <Button
                        onClick={() => playTargetTTS(currentSentence?.tgt)}
                        leftIcon={<FaVolumeUp />}
                        variant="outline"
                        borderColor="rgba(255, 255, 255, 0.3)"
                        color="white"
                        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                        size="sm"
                        isLoading={isPlayingTarget}
                        loadingText={uiText.playing}
                      >
                        {uiText.listen}
                      </Button>
                      <Button
                        onClick={() => {
                          const last =
                            currentSentenceIndex >=
                            storyData.sentences.length - 1;
                          if (!last) {
                            setCurrentSentenceIndex((p) => p + 1);
                          } else {
                            finalizePracticeSession(sessionXp);
                          }
                        }}
                        variant="outline"
                        borderColor="rgba(255, 255, 255, 0.3)"
                        color="white"
                        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                        size="sm"
                      >
                        {currentSentenceIndex < storyData.sentences.length - 1
                          ? uiText.skip
                          : uiText.finish}
                      </Button>
                    </HStack>
                  </VStack>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </>
      )}

      {!storyData && (
        <Box px={4} py={6}>
          <Divider opacity={0.15} />
        </Box>
      )}
    </Box>
  );
}
