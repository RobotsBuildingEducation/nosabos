import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Badge,
  Heading,
  Alert,
  AlertIcon,
  Flex,
  Box,
  Button,
  IconButton,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { RUSSIAN_ALPHABET } from "../data/russianAlphabet";
import { JAPANESE_ALPHABET } from "../data/japaneseAlphabet";
import { ENGLISH_ALPHABET } from "../data/englishAlphabet";
import { SPANISH_ALPHABET } from "../data/spanishAlphabet";
import { PORTUGUESE_ALPHABET } from "../data/portugueseAlphabet";
import { FRENCH_ALPHABET } from "../data/frenchAlphabet";
import { ITALIAN_ALPHABET } from "../data/italianAlphabet";
import { DUTCH_ALPHABET } from "../data/dutchAlphabet";
import { GERMAN_ALPHABET } from "../data/germanAlphabet";
import { NAHUATL_ALPHABET } from "../data/nahuatlAlphabet";
import { GREEK_ALPHABET } from "../data/greekAlphabet";
import { POLISH_ALPHABET } from "../data/polishAlphabet";
import { IRISH_ALPHABET } from "../data/irishAlphabet";
import { YUCATEC_MAYA_ALPHABET } from "../data/yucatecMayaAlphabet";
import {
  translateAlphabetMeaningToArabic,
  withArabicAlphabetSupport,
} from "../data/alphabetArabicLocalizer";
import {
  translateAlphabetMeaningToItalian,
  withItalianAlphabetSupport,
} from "../data/alphabetItalianLocalizer";
import {
  translateAlphabetMeaningToFrench,
  withFrenchAlphabetSupport,
} from "../data/alphabetFrenchLocalizer";
import {
  translateAlphabetMeaningToPortuguese,
  withPortugueseAlphabetSupport,
} from "../data/alphabetPortugueseLocalizer";
import {
  translateAlphabetMeaningToJapanese,
  withJapaneseAlphabetSupport,
} from "../data/alphabetJapaneseLocalizer";
import {
  translateAlphabetMeaningToHindi,
  withHindiAlphabetSupport,
} from "../data/alphabetHindiLocalizer";
import {
  translateAlphabetMeaningToChinese,
  withChineseAlphabetSupport,
} from "../data/alphabetChineseLocalizer";
import {
  translateAlphabetMeaningToGerman,
  withGermanAlphabetSupport,
} from "../data/alphabetGermanLocalizer";
import { FiVolume2 } from "react-icons/fi";
import {
  RiMicLine,
  RiStopCircleLine,
  RiCheckLine,
  RiCloseLine,
  RiStarFill,
  RiRefreshLine,
} from "react-icons/ri";
import { getPreferredTTSVoice, getTTSPlayer, TTS_LANG_TAG } from "../utils/tts";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { awardXp } from "../utils/utils";
import { recordPlateActivity } from "../utils/dailyPlate";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";
import { WaveBar } from "./WaveBar";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import nextButtonSound from "../assets/nextbutton.mp3";
import VoiceOrb from "./VoiceOrb";
import XpProgressHeader from "./XpProgressHeader";
import RandomCharacter from "./RandomCharacter";
import { useThemeStore } from "../useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  LANGUAGE_FALLBACK_LABELS,
  LANGUAGE_PROMPT_LABELS,
  normalizeSupportLanguage,
} from "../constants/languages";

const MotionBox = motion(Box);
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

// Language name and script mapping for all supported languages
const LANGUAGE_NAMES = {
  ru: "Russian",
  ja: "Japanese",
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  nl: "Dutch",
  de: "German",
  nah: "Nahuatl",
  el: "Greek",
  pl: "Polish",
  ga: "Irish",
  yua: "Yucatec Maya",
};

const LANGUAGE_NAMES_EN = {
  ru: "Russian",
  ja: "Japanese",
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  nl: "Dutch",
  de: "German",
  nah: "Nahuatl",
  el: "Greek",
  pl: "Polish",
  ga: "Irish",
  yua: "Yucatec Maya",
};

const LANGUAGE_NAMES_ES = {
  ru: "Ruso",
  ja: "Japonés",
  en: "Inglés",
  es: "Español",
  pt: "Portugués",
  fr: "Francés",
  it: "Italiano",
  nl: "Neerlandés",
  de: "Alemán",
  nah: "Náhuatl",
  el: "Griego",
  pl: "Polaco",
  ga: "Irlandés",
  yua: "Maya yucateco",
};

const LANGUAGE_NAMES_IT = {
  ru: "Russo",
  ja: "Giapponese",
  en: "Inglese",
  es: "Spagnolo",
  pt: "Portoghese",
  fr: "Francese",
  it: "Italiano",
  nl: "Neerlandese",
  de: "Tedesco",
  nah: "Nahuatl",
  el: "Greco",
  pl: "Polacco",
  ga: "Irlandese",
  yua: "Maya yucateco",
};

const LANGUAGE_NAMES_PT = {
  ru: "Russo",
  ja: "Japonês",
  en: "Inglês",
  es: "Espanhol",
  pt: "Português",
  fr: "Francês",
  it: "Italiano",
  nl: "Holandês",
  de: "Alemão",
  nah: "Náuatle",
  el: "Grego",
  pl: "Polonês",
  ga: "Irlandês",
  yua: "Maia iucateque",
};

const LANGUAGE_NAMES_FR = {
  ru: "Russe",
  ja: "Japonais",
  en: "Anglais",
  es: "Espagnol",
  pt: "Portugais",
  fr: "Francais",
  it: "Italien",
  nl: "Neerlandais",
  de: "Allemand",
  nah: "Nahuatl",
  el: "Grec",
  pl: "Polonais",
  ga: "Irlandais",
  yua: "Maya yucateque",
};

const LANGUAGE_NAMES_JA = {
  ru: "ロシア語",
  ja: "日本語",
  en: "英語",
  es: "スペイン語",
  pt: "ポルトガル語",
  fr: "フランス語",
  it: "イタリア語",
  nl: "オランダ語",
  de: "ドイツ語",
  nah: "ナワトル語",
  el: "ギリシャ語",
  pl: "ポーランド語",
  ga: "アイルランド語",
  yua: "ユカテコ・マヤ語",
};

const LANGUAGE_NAMES_HI = {
  ru: "रूसी",
  ja: "जापानी",
  en: "अंग्रेज़ी",
  es: "स्पेनिश",
  pt: "पुर्तगाली",
  fr: "फ़्रेंच",
  it: "इतालवी",
  nl: "डच",
  de: "जर्मन",
  nah: "नाहुआत्ल",
  el: "ग्रीक",
  pl: "पोलिश",
  ga: "आयरिश",
  yua: "युकातेक माया",
};

const LANGUAGE_NAMES_AR = {
  ru: "الروسية",
  ja: "اليابانية",
  en: "الإنجليزية",
  es: "الإسبانية",
  pt: "البرتغالية",
  fr: "الفرنسية",
  it: "الإيطالية",
  nl: "الهولندية",
  de: "الألمانية",
  nah: "الناواتل",
  el: "اليونانية",
  pl: "البولندية",
  ga: "الأيرلندية",
  yua: "المايا اليوكاتيكية",
};

const LANGUAGE_NAMES_ZH = {
  ru: "俄语",
  ja: "日语",
  en: "英语",
  es: "西班牙语",
  pt: "葡萄牙语",
  fr: "法语",
  it: "意大利语",
  nl: "荷兰语",
  de: "德语",
  nah: "纳瓦特尔语",
  el: "希腊语",
  pl: "波兰语",
  ga: "爱尔兰语",
  yua: "尤卡坦玛雅语",
};

const LANGUAGE_NAMES_DE = {
  ru: "Russisch",
  ja: "Japanisch",
  en: "Englisch",
  es: "Spanisch",
  pt: "Portugiesisch",
  fr: "Französisch",
  it: "Italienisch",
  nl: "Niederländisch",
  de: "Deutsch",
  nah: "Nahuatl",
  el: "Griechisch",
  pl: "Polnisch",
  ga: "Irisch",
  yua: "Yucatec-Maya",
};

const LANGUAGE_NAMES_BY_UI = {
  en: LANGUAGE_NAMES_EN,
  es: LANGUAGE_NAMES_ES,
  pt: LANGUAGE_NAMES_PT,
  it: LANGUAGE_NAMES_IT,
  fr: LANGUAGE_NAMES_FR,
  de: LANGUAGE_NAMES_DE,
  ja: LANGUAGE_NAMES_JA,
  hi: LANGUAGE_NAMES_HI,
  ar: LANGUAGE_NAMES_AR,
  zh: LANGUAGE_NAMES_ZH,
};

const LANGUAGE_SCRIPTS = {
  ru: "Cyrillic",
  ja: "hiragana or katakana",
  en: "Latin alphabet",
  es: "Latin alphabet",
  pt: "Latin alphabet",
  fr: "Latin alphabet",
  it: "Latin alphabet",
  nl: "Latin alphabet",
  de: "Latin alphabet",
  nah: "Latin alphabet",
  el: "Greek alphabet",
  pl: "Latin alphabet",
  ga: "Latin alphabet",
  yua: "Latin alphabet",
};

const LANGUAGE_SCRIPTS_IT = {
  ru: "alfabeto cirillico",
  ja: "hiragana o katakana",
  en: "alfabeto latino",
  es: "alfabeto latino",
  pt: "alfabeto latino",
  fr: "alfabeto latino",
  it: "alfabeto latino",
  nl: "alfabeto latino",
  de: "alfabeto latino",
  nah: "alfabeto latino",
  el: "alfabeto greco",
  pl: "alfabeto latino",
  ga: "alfabeto latino",
  yua: "alfabeto latino",
};

const LANGUAGE_SCRIPTS_PT = {
  ru: "alfabeto cirílico",
  ja: "hiragana ou katakana",
  en: "alfabeto latino",
  es: "alfabeto latino",
  pt: "alfabeto latino",
  fr: "alfabeto latino",
  it: "alfabeto latino",
  nl: "alfabeto latino",
  de: "alfabeto latino",
  nah: "alfabeto latino",
  el: "alfabeto grego",
  pl: "alfabeto latino",
  ga: "alfabeto latino",
  yua: "alfabeto latino",
};

const LANGUAGE_SCRIPTS_FR = {
  ru: "alphabet cyrillique",
  ja: "hiragana ou katakana",
  en: "alphabet latin",
  es: "alphabet latin",
  pt: "alphabet latin",
  fr: "alphabet latin",
  it: "alphabet latin",
  nl: "alphabet latin",
  de: "alphabet latin",
  nah: "alphabet latin",
  el: "alphabet grec",
  pl: "alphabet latin",
  ga: "alphabet latin",
  yua: "alphabet latin",
};

const LANGUAGE_SCRIPTS_JA = {
  ru: "キリル文字",
  ja: "ひらがなまたはカタカナ",
  en: "ラテン文字",
  es: "ラテン文字",
  pt: "ラテン文字",
  fr: "ラテン文字",
  it: "ラテン文字",
  nl: "ラテン文字",
  de: "ラテン文字",
  nah: "ラテン文字",
  el: "ギリシャ文字",
  pl: "ラテン文字",
  ga: "ラテン文字",
  yua: "ラテン文字",
};

const LANGUAGE_SCRIPTS_HI = {
  ru: "सिरिलिक लिपि",
  ja: "हिरागाना या काताकाना",
  en: "लैटिन वर्णमाला",
  es: "लैटिन वर्णमाला",
  pt: "लैटिन वर्णमाला",
  fr: "लैटिन वर्णमाला",
  it: "लैटिन वर्णमाला",
  nl: "लैटिन वर्णमाला",
  de: "लैटिन वर्णमाला",
  nah: "लैटिन वर्णमाला",
  el: "ग्रीक वर्णमाला",
  pl: "लैटिन वर्णमाला",
  ga: "लैटिन वर्णमाला",
  yua: "लैटिन वर्णमाला",
};

const LANGUAGE_SCRIPTS_AR = {
  ru: "الأبجدية السيريلية",
  ja: "الهيراجانا أو الكاتاكانا",
  en: "الأبجدية اللاتينية",
  es: "الأبجدية اللاتينية",
  pt: "الأبجدية اللاتينية",
  fr: "الأبجدية اللاتينية",
  it: "الأبجدية اللاتينية",
  nl: "الأبجدية اللاتينية",
  de: "الأبجدية اللاتينية",
  nah: "الأبجدية اللاتينية",
  el: "الأبجدية اليونانية",
  pl: "الأبجدية اللاتينية",
  ga: "الأبجدية اللاتينية",
  yua: "الأبجدية اللاتينية",
};

const LANGUAGE_SCRIPTS_ZH = {
  ru: "西里尔字母",
  ja: "平假名或片假名",
  en: "拉丁字母",
  es: "拉丁字母",
  pt: "拉丁字母",
  fr: "拉丁字母",
  it: "拉丁字母",
  nl: "拉丁字母",
  de: "拉丁字母",
  nah: "拉丁字母",
  el: "希腊字母",
  pl: "拉丁字母",
  ga: "拉丁字母",
  yua: "拉丁字母",
};

const LANGUAGE_SCRIPTS_DE = {
  ru: "kyrillisches Alphabet",
  ja: "Hiragana oder Katakana",
  en: "lateinisches Alphabet",
  es: "lateinisches Alphabet",
  pt: "lateinisches Alphabet",
  fr: "lateinisches Alphabet",
  it: "lateinisches Alphabet",
  nl: "lateinisches Alphabet",
  de: "lateinisches Alphabet",
  nah: "lateinisches Alphabet",
  el: "griechisches Alphabet",
  pl: "lateinisches Alphabet",
  ga: "lateinisches Alphabet",
  yua: "lateinisches Alphabet",
};

const LANGUAGE_SCRIPTS_BY_UI = {
  en: LANGUAGE_SCRIPTS,
  es: {
    ru: "alfabeto cirílico",
    ja: "hiragana o katakana",
    en: "alfabeto latino",
    es: "alfabeto latino",
    pt: "alfabeto latino",
    fr: "alfabeto latino",
    it: "alfabeto latino",
    nl: "alfabeto latino",
    de: "alfabeto latino",
    nah: "alfabeto latino",
    el: "alfabeto griego",
    pl: "alfabeto latino",
    ga: "alfabeto latino",
    yua: "alfabeto latino",
  },
  pt: LANGUAGE_SCRIPTS_PT,
  it: LANGUAGE_SCRIPTS_IT,
  fr: LANGUAGE_SCRIPTS_FR,
  de: LANGUAGE_SCRIPTS_DE,
  ja: LANGUAGE_SCRIPTS_JA,
  hi: LANGUAGE_SCRIPTS_HI,
  ar: LANGUAGE_SCRIPTS_AR,
  zh: LANGUAGE_SCRIPTS_ZH,
};

const ALPHABET_UI_TEXT = {
  en: {
    vowel: "Vowel",
    consonant: "Consonant",
    sign: "Sign",
    sound: "Sound",
    practice: "Practice",
    playSound: "Play sound",
    playWord: "Play word",
    close: "Close",
    sayThisWord: "Say this word:",
    grading: "Grading...",
    nextWord: "Next word",
    tryAgain: "Try again",
    back: "Back",
    connecting: "Connecting...",
    stop: "Stop",
    record: "Record",
    recordingErrorTitle: "Recording error",
    recordingErrorDescription: "Could not record. Please try again.",
    gradingErrorTitle: "Grading error",
    gradingErrorDescription: "Could not grade your answer.",
    speechUnsupportedTitle: "Speech not supported",
    speechUnsupportedDescription:
      "Your browser doesn't support speech recognition.",
    micDeniedTitle: "Microphone denied",
    micDeniedDescription: "Please allow microphone access to record.",
    generateWordErrorTitle: "Couldn't generate a new word",
    level: "Level",
    progress: "Progress",
    alphabetHeadline: "{language} Alphabet",
    alphabetSubhead: "Start by learning {language} letters and sounds.",
    note: "After this, switch to Path mode in the menu to explore lessons.",
    complete: "Congratulations! You've completed the alphabet.",
    deckComplete: "Deck cleared! Generate a new one to keep going.",
    generateDeckError: "Couldn't generate a new deck. Please try again.",
    startSkillTree: "Start skill tree",
    newRound: "New round",
    collection: "Collection",
    loadError: "We couldn't load the alphabet. Please try again.",
  },
  es: {
    vowel: "Vocal",
    consonant: "Consonante",
    sign: "Signo",
    practice: "Practicar",
    playSound: "Reproducir sonido",
    playWord: "Reproducir palabra",
    close: "Cerrar",
    sayThisWord: "Di esta palabra:",
    grading: "Evaluando...",
    nextWord: "Siguiente palabra",
    tryAgain: "Otra vez",
    back: "Volver",
    connecting: "Conectando...",
    stop: "Detener",
    record: "Grabar",
    recordingErrorTitle: "Error de grabación",
    recordingErrorDescription: "No se pudo grabar. Intenta de nuevo.",
    gradingErrorTitle: "Error al evaluar",
    gradingErrorDescription: "No pudimos evaluar tu respuesta.",
    speechUnsupportedTitle: "Sin soporte de voz",
    speechUnsupportedDescription:
      "Tu navegador no soporta reconocimiento de voz.",
    micDeniedTitle: "Micrófono denegado",
    micDeniedDescription: "Permite el acceso al micrófono para grabar.",
    generateWordErrorTitle: "No pudimos generar una palabra",
    level: "Nivel",
    progress: "Progreso",
    alphabetHeadline: "Alfabeto {language}",
    alphabetSubhead:
      "Empieza aprendiendo las letras y sonidos del {language}.",
    note:
      "Después de esto, cambia al modo Ruta en el menú para explorar las lecciones.",
    complete: "¡Felicidades! Has completado el alfabeto.",
    startSkillTree: "Iniciar árbol de habilidades",
    newRound: "Nueva ronda",
    collection: "Colección",
    loadError: "No pudimos cargar el alfabeto. Intenta nuevamente.",
  },
  it: {
    vowel: "Vocale",
    consonant: "Consonante",
    sign: "Segno",
    practice: "Esercitati",
    playSound: "Riproduci suono",
    playWord: "Riproduci parola",
    close: "Chiudi",
    sayThisWord: "Pronuncia questa parola:",
    grading: "Valutazione...",
    nextWord: "Prossima parola",
    tryAgain: "Riprova",
    back: "Indietro",
    connecting: "Connessione...",
    stop: "Ferma",
    record: "Registra",
    recordingErrorTitle: "Errore di registrazione",
    recordingErrorDescription: "Non è stato possibile registrare. Riprova.",
    gradingErrorTitle: "Errore di valutazione",
    gradingErrorDescription: "Non abbiamo potuto valutare la tua risposta.",
    speechUnsupportedTitle: "Voce non supportata",
    speechUnsupportedDescription:
      "Il tuo browser non supporta il riconoscimento vocale.",
    micDeniedTitle: "Microfono negato",
    micDeniedDescription: "Consenti l'accesso al microfono per registrare.",
    generateWordErrorTitle: "Non abbiamo potuto generare una nuova parola",
    level: "Livello",
    progress: "Progressi",
    alphabetHeadline: "Alfabeto {language}",
    alphabetSubhead:
      "Inizia imparando le lettere e i suoni del {language}.",
    note:
      "Dopo questo, passa alla modalità Percorso nel menu per esplorare le lezioni.",
    complete: "Congratulazioni! Hai completato l'alfabeto.",
    startSkillTree: "Inizia l'albero delle abilità",
    newRound: "Nuovo giro",
    collection: "Collezione",
    loadError: "Non siamo riusciti a caricare l'alfabeto. Riprova.",
  },
  fr: {
    vowel: "Voyelle",
    consonant: "Consonne",
    sign: "Signe",
    practice: "Pratiquer",
    playSound: "Lire le son",
    playWord: "Lire le mot",
    close: "Fermer",
    sayThisWord: "Dis ce mot :",
    grading: "Evaluation...",
    nextWord: "Mot suivant",
    tryAgain: "Reessaie",
    back: "Retour",
    connecting: "Connexion...",
    stop: "Arreter",
    record: "Enregistrer",
    recordingErrorTitle: "Erreur d'enregistrement",
    recordingErrorDescription: "Impossible d'enregistrer. Reessaie.",
    gradingErrorTitle: "Erreur d'evaluation",
    gradingErrorDescription: "Impossible d'evaluer ta reponse.",
    speechUnsupportedTitle: "Voix non prise en charge",
    speechUnsupportedDescription:
      "Ton navigateur ne prend pas en charge la reconnaissance vocale.",
    micDeniedTitle: "Micro refuse",
    micDeniedDescription: "Autorise l'acces au micro pour enregistrer.",
    generateWordErrorTitle: "Impossible de generer un nouveau mot",
    level: "Niveau",
    progress: "Progres",
    alphabetHeadline: "Alphabet {language}",
    alphabetSubhead:
      "Commence par apprendre les lettres et les sons du {language}.",
    note:
      "Ensuite, passe au mode Parcours dans le menu pour explorer les lecons.",
    complete: "Felicitations ! Tu as termine l'alphabet.",
    startSkillTree: "Commencer l'arbre",
    newRound: "Nouvelle manche",
    collection: "Collection",
    loadError: "Impossible de charger l'alphabet. Reessaie.",
  },
  de: {
    vowel: "Vokal",
    consonant: "Konsonant",
    sign: "Zeichen",
    practice: "Üben",
    playSound: "Laut abspielen",
    playWord: "Wort abspielen",
    close: "Schließen",
    sayThisWord: "Sprich dieses Wort:",
    grading: "Wird bewertet...",
    nextWord: "Nächstes Wort",
    tryAgain: "Erneut versuchen",
    back: "Zurück",
    connecting: "Verbindung wird hergestellt...",
    stop: "Stopp",
    record: "Aufnehmen",
    recordingErrorTitle: "Aufnahmefehler",
    recordingErrorDescription: "Aufnahme nicht möglich. Bitte versuche es erneut.",
    gradingErrorTitle: "Bewertungsfehler",
    gradingErrorDescription: "Deine Antwort konnte nicht bewertet werden.",
    speechUnsupportedTitle: "Sprache wird nicht unterstützt",
    speechUnsupportedDescription:
      "Dein Browser unterstützt keine Spracherkennung.",
    micDeniedTitle: "Mikrofon verweigert",
    micDeniedDescription: "Erlaube den Mikrofonzugriff zum Aufnehmen.",
    generateWordErrorTitle: "Kein neues Wort generierbar",
    level: "Level",
    progress: "Fortschritt",
    alphabetHeadline: "{language}-Alphabet",
    alphabetSubhead:
      "Beginne mit den Buchstaben und Lauten von {language}.",
    note:
      "Wechsle danach im Menü zum Pfadmodus, um Lektionen zu erkunden.",
    complete: "Glückwunsch! Du hast das Alphabet abgeschlossen.",
    startSkillTree: "Skill-Tree starten",
    newRound: "Neue Runde",
    collection: "Sammlung",
    loadError: "Das Alphabet konnte nicht geladen werden. Bitte versuche es erneut.",
  },
  ja: {
    vowel: "母音",
    consonant: "子音",
    sign: "記号",
    practice: "練習",
    playSound: "音を再生",
    playWord: "単語を再生",
    close: "閉じる",
    sayThisWord: "この単語を言ってください:",
    grading: "採点中...",
    nextWord: "次の単語",
    tryAgain: "もう一度",
    back: "戻る",
    connecting: "接続中...",
    stop: "停止",
    record: "録音",
    recordingErrorTitle: "録音エラー",
    recordingErrorDescription: "録音できませんでした。もう一度お試しください。",
    gradingErrorTitle: "採点エラー",
    gradingErrorDescription: "答えを採点できませんでした。",
    speechUnsupportedTitle: "音声はサポートされていません",
    speechUnsupportedDescription:
      "このブラウザは音声認識に対応していません。",
    micDeniedTitle: "マイクが拒否されました",
    micDeniedDescription: "録音するにはマイクアクセスを許可してください。",
    generateWordErrorTitle: "新しい単語を生成できませんでした",
    level: "レベル",
    progress: "進捗",
    alphabetHeadline: "{language}の文字",
    alphabetSubhead: "{language}の文字と音から始めましょう。",
    note: "この後は、メニューでパスモードに切り替えてレッスンを探索しましょう。",
    complete: "おめでとうございます！文字練習を完了しました。",
    startSkillTree: "スキルツリーを始める",
    newRound: "新しいラウンド",
    collection: "コレクション",
    loadError: "文字データを読み込めませんでした。もう一度お試しください。",
  },
  hi: {
    vowel: "स्वर",
    consonant: "व्यंजन",
    sign: "चिह्न",
    practice: "अभ्यास",
    playSound: "ध्वनि चलाएं",
    playWord: "शब्द चलाएं",
    close: "बंद करें",
    sayThisWord: "यह शब्द बोलें:",
    grading: "मूल्यांकन हो रहा है...",
    nextWord: "अगला शब्द",
    tryAgain: "फिर से कोशिश करें",
    back: "वापस",
    connecting: "कनेक्ट हो रहा है...",
    stop: "रोकें",
    record: "रिकॉर्ड करें",
    recordingErrorTitle: "रिकॉर्डिंग त्रुटि",
    recordingErrorDescription: "रिकॉर्ड नहीं हो सका। कृपया फिर प्रयास करें।",
    gradingErrorTitle: "मूल्यांकन त्रुटि",
    gradingErrorDescription: "हम आपके उत्तर का मूल्यांकन नहीं कर सके।",
    speechUnsupportedTitle: "वॉइस सपोर्ट उपलब्ध नहीं है",
    speechUnsupportedDescription:
      "आपका ब्राउज़र वॉइस रिकग्निशन का समर्थन नहीं करता।",
    micDeniedTitle: "माइक्रोफोन अस्वीकृत",
    micDeniedDescription: "रिकॉर्ड करने के लिए माइक्रोफोन की अनुमति दें।",
    generateWordErrorTitle: "नया शब्द तैयार नहीं किया जा सका",
    level: "स्तर",
    progress: "प्रगति",
    alphabetHeadline: "{language} वर्णमाला",
    alphabetSubhead: "{language} की ध्वनियां और अक्षर सीखकर शुरुआत करें।",
    note: "इसके बाद मेनू में पाथ मोड पर जाकर पाठों को देखें।",
    complete: "बधाई हो! आपने वर्णमाला पूरी कर ली है।",
    startSkillTree: "स्किल ट्री शुरू करें",
    newRound: "नया दौर",
    collection: "संग्रह",
    loadError: "हम वर्णमाला लोड नहीं कर सके। कृपया फिर कोशिश करें।",
  },
  ar: {
    vowel: "حرف علّة",
    consonant: "حرف ساكن",
    sign: "علامة",
    practice: "اتدرّب",
    playSound: "شغّل الصوت",
    playWord: "شغّل الكلمة",
    close: "اقفل",
    sayThisWord: "قول الكلمة دي:",
    grading: "جارٍ التقييم...",
    nextWord: "الكلمة اللي بعد كده",
    tryAgain: "حاول تاني",
    back: "رجوع",
    connecting: "جارٍ الاتصال...",
    stop: "إيقاف",
    record: "سجّل",
    recordingErrorTitle: "خطأ في التسجيل",
    recordingErrorDescription: "ما قدرناش نسجّل. جرّب تاني.",
    gradingErrorTitle: "خطأ في التقييم",
    gradingErrorDescription: "ما قدرناش نقيّم إجابتك.",
    speechUnsupportedTitle: "الصوت غير مدعوم",
    speechUnsupportedDescription:
      "المتصفح ده مش بيدعم التعرّف على الكلام.",
    micDeniedTitle: "المايك مرفوض",
    micDeniedDescription: "اسمح للمايك علشان تسجّل.",
    generateWordErrorTitle: "ما قدرناش نطلّع كلمة جديدة",
    level: "المستوى",
    progress: "التقدّم",
    alphabetHeadline: "أبجدية {language}",
    alphabetSubhead: "ابدأ بتعلّم حروف وأصوات {language}.",
    note:
      "بعد كده بدّل لوضع المسار من القائمة علشان تستكشف الدروس.",
    complete: "مبروك! خلّصت الأبجدية.",
    startSkillTree: "ابدأ شجرة المهارات",
    newRound: "جولة جديدة",
    collection: "المجموعة",
    loadError: "ما قدرناش نحمّل الأبجدية. جرّب تاني.",
  },
  zh: {
    vowel: "元音",
    consonant: "辅音",
    sign: "符号",
    practice: "练习",
    playSound: "播放发音",
    playWord: "播放单词",
    close: "关闭",
    sayThisWord: "说这个词：",
    grading: "正在评分...",
    nextWord: "下一个词",
    tryAgain: "再试一次",
    back: "返回",
    connecting: "正在连接...",
    stop: "停止",
    record: "录音",
    recordingErrorTitle: "录音出错",
    recordingErrorDescription: "无法录音。请再试一次。",
    gradingErrorTitle: "评分出错",
    gradingErrorDescription: "无法评估你的回答。",
    speechUnsupportedTitle: "不支持语音",
    speechUnsupportedDescription:
      "你的浏览器不支持语音识别。",
    micDeniedTitle: "麦克风被拒绝",
    micDeniedDescription: "请允许麦克风权限以便录音。",
    generateWordErrorTitle: "无法生成新单词",
    level: "等级",
    progress: "进度",
    alphabetHeadline: "{language}字母",
    alphabetSubhead: "从学习{language}的字母和发音开始。",
    note:
      "完成后，在菜单中切换到路径模式继续学习课程。",
    complete: "恭喜！你已完成字母练习。",
    startSkillTree: "开始技能树",
    newRound: "新一轮",
    collection: "收藏",
    loadError: "无法加载字母数据。请再试一次。",
  },
};

ALPHABET_UI_TEXT.pt = {
  title: "Modo Alfabeto",
  newRound: "Nova rodada",
  vowel: "Vogal",
  consonant: "Consoante",
  sign: "Sinal",
  practice: "Praticar",
  playSound: "Reproduzir som",
  playWord: "Reproduzir palavra",
  close: "Fechar",
  sayThisWord: "Diga esta palavra:",
  grading: "Avaliando...",
  nextWord: "Próxima palavra",
  tryAgain: "Tentar novamente",
  back: "Voltar",
  connecting: "Conectando...",
  stop: "Parar",
  record: "Gravar",
  recordingErrorTitle: "Erro de gravação",
  recordingErrorDescription: "Não foi possível gravar. Tente novamente.",
  gradingErrorTitle: "Erro de avaliação",
  gradingErrorDescription: "Não foi possível avaliar a resposta.",
  speechUnsupportedTitle: "Fala não suportada",
  speechUnsupportedDescription:
    "Este navegador não oferece suporte a reconhecimento de voz.",
  micDeniedTitle: "Microfone bloqueado",
  micDeniedDescription:
    "Permita o acesso ao microfone para gravar.",
  generateWordErrorTitle: "Não foi possível gerar uma nova palavra",
  level: "Nível",
  progress: "Progresso",
  alphabetHeadline: "Alfabeto {language}",
  alphabetSubhead:
    "Comece aprendendo as letras e os sons do {language}.",
  note:
    "Depois disso, mude para o modo Caminho no menu para explorar as lições.",
  complete: "Parabéns! Você concluiu a prática do alfabeto.",
  startSkillTree: "Iniciar árvore de habilidades",
  collection: "Coleção",
  loadError:
    "Não foi possível carregar os dados do alfabeto. Tente novamente.",
};

// Extra phonics-journey copy (the generated-deck flow). Kept here instead of in
// every ALPHABET_UI_TEXT block; uiText falls back through this map, then to en.
const PHONICS_EXTRA_UI_TEXT = {
  es: {
    sound: "Sonido",
    deckComplete: "¡Mazo completado! Genera uno nuevo para seguir.",
    generateDeckError: "No se pudo generar un mazo nuevo. Inténtalo de nuevo.",
  },
  pt: {
    sound: "Som",
    deckComplete: "Baralho concluído! Gere um novo para continuar.",
    generateDeckError: "Não foi possível gerar um novo baralho. Tente de novo.",
  },
  it: {
    sound: "Suono",
    deckComplete: "Mazzo completato! Generane uno nuovo per continuare.",
    generateDeckError: "Impossibile generare un nuovo mazzo. Riprova.",
  },
  fr: {
    sound: "Son",
    deckComplete: "Paquet terminé ! Génère-en un nouveau pour continuer.",
    generateDeckError: "Impossible de générer un nouveau paquet. Réessaie.",
  },
  de: {
    sound: "Laut",
    deckComplete: "Stapel geschafft! Erzeuge einen neuen, um weiterzumachen.",
    generateDeckError:
      "Neuer Stapel konnte nicht erzeugt werden. Bitte erneut versuchen.",
  },
  ja: {
    sound: "音",
    deckComplete: "デッキ完了！新しいデッキを作って続けましょう。",
    generateDeckError:
      "新しいデッキを生成できませんでした。もう一度お試しください。",
  },
  hi: {
    sound: "ध्वनि",
    deckComplete: "डेक पूरा! जारी रखने के लिए नया बनाएँ।",
    generateDeckError: "नया डेक नहीं बन सका। कृपया फिर से प्रयास करें।",
  },
  ar: {
    sound: "صوت",
    deckComplete: "اكتملت المجموعة! أنشئ واحدة جديدة للمتابعة.",
    generateDeckError: "تعذّر إنشاء مجموعة جديدة. حاول مرة أخرى.",
  },
  zh: {
    sound: "音",
    deckComplete: "卡组完成！生成新的一组继续学习。",
    generateDeckError: "无法生成新卡组。请重试。",
  },
};

const uiText = (lang, key, params = {}) => {
  const normalizedLang = normalizeSupportLanguage(lang, DEFAULT_SUPPORT_LANGUAGE);
  const raw =
    ALPHABET_UI_TEXT[normalizedLang]?.[key] ??
    PHONICS_EXTRA_UI_TEXT[normalizedLang]?.[key] ??
    ALPHABET_UI_TEXT.en[key] ??
    key;
  return raw.replace(/\{(\w+)\}/g, (_, token) =>
    params[token] != null ? String(params[token]) : `{${token}}`,
  );
};

const getLanguageName = (code, uiLang) =>
  LANGUAGE_NAMES_BY_UI[uiLang]?.[code] ||
  LANGUAGE_NAMES_EN[code] ||
  LANGUAGE_NAMES[code] ||
  "Language";

const getScriptName = (code, uiLang) =>
  LANGUAGE_SCRIPTS_BY_UI[uiLang]?.[code] ||
  LANGUAGE_SCRIPTS[code] ||
  "native script";

const LOCALIZED_FIELD_SUFFIX = {
  en: "",
  es: "Es",
  pt: "Pt",
  it: "It",
  fr: "Fr",
  de: "De",
  ja: "Ja",
  hi: "Hi",
  ar: "Ar",
  zh: "Zh",
};

const getLocalizedLetterField = (letter, uiLang, baseKey) => {
  if (!letter || !baseKey) return "";
  const normalizedLang = normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE);
  const suffix = LOCALIZED_FIELD_SUFFIX[normalizedLang];
  const fieldName = suffix ? `${baseKey}${suffix}` : baseKey;
  const value = letter[fieldName];
  return typeof value === "string" ? value.trim() : "";
};

const getMeaningText = (meaning, uiLang) => {
  if (!meaning || typeof meaning !== "object") return "";
  const normalizedLang = normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE);
  if (normalizedLang === "en") {
    return (
      meaning.en ||
      meaning.es ||
      meaning.ar ||
      meaning.hi ||
      meaning.pt ||
      meaning.it ||
      meaning.fr ||
      meaning.de ||
      meaning.ja ||
      meaning.zh ||
      ""
    );
  }
  return meaning[normalizedLang] || "";
};

const getLetterName = (letter, uiLang) => {
  const localizedName = getLocalizedLetterField(letter, uiLang, "name");
  if (localizedName) {
    return localizedName;
  }

  const normalizedLang = normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE);
  if (normalizedLang === "en") {
    return letter.name || "";
  }

  if (letter?.type === "phrase") {
    return getMeaningText(normalizeMeaning(letter.practiceWordMeaning), normalizedLang);
  }

  return "";
};

const getLetterSound = (letter, uiLang) =>
  getLocalizedLetterField(letter, uiLang, "sound");

const getLetterTip = (letter, uiLang) =>
  getLocalizedLetterField(letter, uiLang, "tip");

const normalizeMeaning = (meaning) => {
  if (!meaning) {
    return {
      en: "",
      es: "",
      pt: "",
      it: "",
      fr: "",
      de: "",
      ja: "",
      hi: "",
      ar: "",
      zh: "",
    };
  }
  if (typeof meaning === "string") {
    const source = String(meaning || "").trim();
    return {
      en: source,
      es: "",
      pt: translateAlphabetMeaningToPortuguese(source) || "",
      it: translateAlphabetMeaningToItalian(source) || "",
      fr: translateAlphabetMeaningToFrench(source) || "",
      de: translateAlphabetMeaningToGerman(source) || "",
      ja: translateAlphabetMeaningToJapanese(source) || "",
      hi: translateAlphabetMeaningToHindi(source) || "",
      ar: translateAlphabetMeaningToArabic(source) || "",
      zh: translateAlphabetMeaningToChinese(source) || "",
    };
  }

  const en =
    meaning.en ||
    meaning.es ||
    meaning.ar ||
    meaning.hi ||
    meaning.pt ||
    meaning.it ||
    meaning.fr ||
    meaning.de ||
    meaning.ja ||
    meaning.zh ||
    "";
  const es = meaning.es || "";
  const pt = meaning.pt || translateAlphabetMeaningToPortuguese(meaning) || "";
  const it = meaning.it || translateAlphabetMeaningToItalian(meaning) || "";
  const fr = meaning.fr || translateAlphabetMeaningToFrench(meaning) || "";
  const de = meaning.de || translateAlphabetMeaningToGerman(meaning) || "";
  const ja = meaning.ja || translateAlphabetMeaningToJapanese(meaning) || "";
  const hi = meaning.hi || translateAlphabetMeaningToHindi(meaning) || "";
  const ar = meaning.ar || translateAlphabetMeaningToArabic(meaning) || "";
  const zh = meaning.zh || translateAlphabetMeaningToChinese(meaning) || "";

  return { en, es, pt, it, fr, de, ja, hi, ar, zh };
};

// Build AI grading prompt for alphabet practice
function buildAlphabetJudgePrompt({ practiceWord, userAnswer, targetLang }) {
  const langName = LANGUAGE_NAMES[targetLang] || "the target";

  return `
Judge if the user correctly pronounced a ${langName} word.

Target word: ${practiceWord}
User's pronunciation (transcribed): ${userAnswer}

Policy:
- Say YES if the transcription matches or is phonetically very close to the target word.
- Allow minor transcription errors since speech recognition may not be perfect for ${langName}.
- The user is a beginner, so be lenient with small pronunciation mistakes.
- If completely wrong or incomprehensible, say NO.

Reply with ONE of these formats:
YES | <xp_amount>
NO

Where <xp_amount> is 1-2 based on:
- 2 XP: Accurate pronunciation
- 1 XP: Recognizable but imperfect
`.trim();
}

// Save alphabet practice progress to Firestore
async function saveAlphabetProgress(
  npub,
  targetLang,
  letterId,
  practiceWord,
  wasCorrect,
  practiceWordMeaning,
) {
  if (!npub) return;

  const userRef = doc(database, "users", npub);
  const docId = `${targetLang}_${letterId}`;
  const alphabetProgressRef = doc(
    database,
    "users",
    npub,
    "alphabetPractice",
    docId,
  );

  try {
    const snap = await getDoc(alphabetProgressRef);
    const existingProgress = snap.exists() ? snap.data() : null;

    const attempts = (existingProgress?.attempts || 0) + 1;
    const correctCount =
      (existingProgress?.correctCount || 0) + (wasCorrect ? 1 : 0);
    const lastWords = existingProgress?.practicedWords || [];

    // Keep track of last 10 practiced words
    const updatedWords = [...new Set([practiceWord, ...lastWords])].slice(
      0,
      10,
    );

    await Promise.all([
      setDoc(
        alphabetProgressRef,
        {
          letterId,
          targetLang,
          attempts,
          correctCount,
          practicedWords: updatedWords,
          lastAttemptAt: serverTimestamp(),
          lastWord: practiceWord,
          lastWordMeaning:
            practiceWordMeaning ?? existingProgress?.lastWordMeaning ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
      setDoc(
        userRef,
        {
          "progress.lastActiveAt": serverTimestamp(),
        },
        { merge: true },
      ),
    ]);
  } catch (error) {
    console.error("Error saving alphabet progress:", error);
  }
}

async function saveAlphabetPracticeWord(
  npub,
  targetLang,
  letterId,
  practiceWord,
  practiceWordMeaning,
  correctCount,
) {
  if (!npub) return;

  try {
    const docId = `${targetLang}_${letterId}`;
    await setDoc(
      doc(database, "users", npub, "alphabetPractice", docId),
      {
        letterId,
        targetLang,
        currentWord: practiceWord,
        currentMeaning: practiceWordMeaning ?? null,
        correctCount: correctCount ?? 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving alphabet practice word:", error);
  }
}

// Number of brand-new phonics cards generated per "New round".
const NEW_DECK_SIZE = 6;

// Localized display fields a generated phonics card can carry, mirroring the
// base alphabet entries (name / sound / tip, with per-language suffixes).
const GEN_DISPLAY_BASES = ["name", "sound", "tip"];
const GEN_DISPLAY_SUFFIXES = [
  "",
  "Es",
  "Pt",
  "It",
  "Fr",
  "De",
  "Ja",
  "Hi",
  "Ar",
  "Zh",
];

// Copy just the present localized display fields off a card (for saving) or off
// a Firestore doc (for reloading) so the same shape round-trips both ways.
function pickGeneratedDisplayFields(source) {
  const out = {};
  GEN_DISPLAY_BASES.forEach((base) => {
    GEN_DISPLAY_SUFFIXES.forEach((suffix) => {
      const key = `${base}${suffix}`;
      const value = source?.[key];
      if (typeof value === "string" && value) out[key] = value;
    });
  });
  return out;
}

// Turn a raw generated unit into a card shaped like a base alphabet entry, with
// the pronunciation guide + tip in BOTH English (base keys) and the learner's
// support language (suffixed keys), so the card reveals the same details.
function buildGeneratedCard(unit, uiLang, id) {
  const lang = normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE);
  const suffix = LOCALIZED_FIELD_SUFFIX[lang] || "";
  const card = {
    id,
    letter: unit.grapheme,
    type: "sound",
    generated: true,
    name: unit.name || "",
    sound: unit.soundEn || "",
    tip: unit.tipEn || "",
    // Tap-to-hear plays a real word demonstrating the sound (like base cards).
    tts: unit.exampleWord || "",
    practiceWord: unit.exampleWord || "",
    practiceWordMeaning: normalizeMeaning({
      en: unit.meaningEn || "",
      [lang]: unit.meaningLoc || unit.meaningEn || "",
    }),
  };
  if (suffix) {
    if (unit.soundLoc || unit.soundEn) {
      card[`sound${suffix}`] = unit.soundLoc || unit.soundEn;
    }
    if (unit.tipLoc || unit.tipEn) {
      card[`tip${suffix}`] = unit.tipLoc || unit.tipEn;
    }
  }
  return card;
}

// Generate a fresh batch of NEW phonics units (digraphs, blends, syllables,
// less-common sounds) that go beyond the base alphabet. Guidance comes back in
// English + the learner's support language so cards read in the right language.
async function generateNewPhonicsUnits(
  targetLang,
  uiLang,
  existingGraphemes = [],
  count = NEW_DECK_SIZE,
) {
  const lang = normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE);
  const languageName =
    LANGUAGE_PROMPT_LABELS[targetLang] ||
    LANGUAGE_NAMES[targetLang] ||
    "the target language";
  const scriptName = getScriptName(targetLang, uiLang);
  const supportName =
    LANGUAGE_PROMPT_LABELS[lang] || LANGUAGE_FALLBACK_LABELS[lang] || "English";
  const avoid = existingGraphemes.filter(Boolean).slice(0, 200).join(", ");
  const prompt = `You are creating phonics flashcards for a learner.
- Target language being learned: ${languageName} (written in ${scriptName}).
- The learner's OWN language, used for ALL explanations: ${supportName}.

Generate ${count} NEW beginner-friendly ${languageName} phonics units that go BEYOND the basic alphabet — for example digraphs, consonant blends, common syllables, or less-common sounds.
Avoid these already-covered units: ${avoid || "(none)"}.

For each unit:
- "grapheme": the sound/letters written in ${scriptName} (${languageName}).
- "exampleWord": a common ${languageName} word that uses it, written in ${scriptName}.
- "name": a very short English label.
- "sound_en", "tip_en", "meaning_en": written in English.
- "sound_loc", "tip_loc", "meaning_loc": written in ${supportName}. These three explanations MUST be in ${supportName}, NOT in ${languageName}.

Respond ONLY with a JSON array of exactly ${count} objects in this exact shape:
[{"grapheme":"...","name":"...","sound_en":"...","sound_loc":"...","tip_en":"...","tip_loc":"...","exampleWord":"...","meaning_en":"...","meaning_loc":"..."}]
- Keep each grapheme short and beginner-friendly.
- Do not repeat any avoided unit and do not duplicate within the list.
- No extra text.`;

  try {
    const raw = await callResponses({
      model: DEFAULT_RESPONSES_MODEL,
      input: prompt,
    });
    const match = raw.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    return parsed
      .map((u) => ({
        grapheme: String(u?.grapheme || "").trim(),
        name: String(u?.name || "").trim(),
        soundEn: String(u?.sound_en || u?.sound || "").trim(),
        soundLoc: String(u?.sound_loc || u?.sound_en || u?.sound || "").trim(),
        tipEn: String(u?.tip_en || u?.tip || "").trim(),
        tipLoc: String(u?.tip_loc || u?.tip_en || u?.tip || "").trim(),
        exampleWord: String(u?.exampleWord || u?.word || "").trim(),
        meaningEn: String(u?.meaning_en || u?.meaning || "").trim(),
        meaningLoc: String(
          u?.meaning_loc || u?.meaning_en || u?.meaning || "",
        ).trim(),
      }))
      .filter((u) => {
        if (!u.grapheme) return false;
        const key = u.grapheme.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  } catch (error) {
    console.error("Failed to generate phonics units:", error);
    return [];
  }
}

// Persist a generated phonics unit's definition so the growing collection
// survives reloads. Shares the alphabetPractice subcollection with letters;
// merge keeps any later practice progress intact.
async function saveGeneratedPhonicsUnit(npub, targetLang, card) {
  if (!npub || !card?.id) return;
  try {
    await setDoc(
      doc(database, "users", npub, "alphabetPractice", `${targetLang}_${card.id}`),
      {
        letterId: card.id,
        targetLang,
        generated: true,
        grapheme: card.letter || "",
        ...pickGeneratedDisplayFields(card),
        tts: card.tts || null,
        currentWord: card.practiceWord || null,
        currentMeaning: card.practiceWordMeaning ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving generated phonics unit:", error);
  }
}

const getPracticeLetterMarker = (letter) => {
  if (!letter?.letter) return "";
  return letter.letter.split("/")[0]?.trim()?.split(" ")[0] || "";
};

const getHighlightedWordParts = (word, marker) => {
  if (!word || !marker) return [{ text: word, highlight: false }];

  const parts = [];
  let index = 0;
  const lowerWord = word.toLowerCase();
  const lowerMarker = marker.toLowerCase();

  while (index < word.length) {
    const matchIndex = lowerWord.indexOf(lowerMarker, index);
    if (matchIndex === -1) {
      parts.push({ text: word.slice(index), highlight: false });
      break;
    }

    if (matchIndex > index) {
      parts.push({ text: word.slice(index, matchIndex), highlight: false });
    }

    // Use the actual characters from the word (preserving original case)
    parts.push({
      text: word.slice(matchIndex, matchIndex + marker.length),
      highlight: true,
    });
    index = matchIndex + marker.length;
  }

  return parts;
};

function LetterCard({
  playSound = () => {},
  letter,
  onPlay,
  isPlaying,
  isLoading = false,
  appLanguage,
  targetLang,
  npub,
  onXpAwarded,
  initialPracticeWord,
  initialPracticeWordMeaning,
  initialCorrectCount = 0,
  onPracticeWordUpdated,
  onCardCollected,
  pauseMs = 2000,
}) {
  const uiLang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  // Collect this card the first time it's cleared during this mount, so a new
  // round re-collects letters even though their cumulative count is already > 0.
  const collectedThisMountRef = useRef(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isLoadingTts, setIsLoadingTts] = useState(false);
  const [practiceWord, setPracticeWord] = useState(
    initialPracticeWord || letter.practiceWord || "",
  );
  const [practiceWordMeaningData, setPracticeWordMeaningData] = useState(
    normalizeMeaning(initialPracticeWordMeaning || letter.practiceWordMeaning),
  );
  const [correctCount, setCorrectCount] = useState(initialCorrectCount);
  const wordPlayerRef = useRef(null);
  const wordPlaybackRequestRef = useRef(0);
  const toast = useToast();

  useEffect(() => {
    setPracticeWord(initialPracticeWord || letter.practiceWord || "");
    setPracticeWordMeaningData(
      normalizeMeaning(
        initialPracticeWordMeaning || letter.practiceWordMeaning,
      ),
    );
  }, [
    initialPracticeWord,
    initialPracticeWordMeaning,
    letter.practiceWord,
    letter.practiceWordMeaning,
  ]);

  // Sync correctCount only when initial value changes (on load)
  useEffect(() => {
    setCorrectCount(initialCorrectCount);
  }, [initialCorrectCount]);

  const typeColor = useMemo(() => {
    switch (letter.type) {
      case "vowel":
        return "purple";
      case "consonant":
        return "teal";
      case "sign":
        return "orange";
      default:
        return "gray";
    }
  }, [letter.type]);

  const typeLabel =
    uiText(uiLang, letter.type) ||
    letter.type.charAt(0).toUpperCase() + letter.type.slice(1);

  const displayName = getLetterName(letter, uiLang);
  const sound = getLetterSound(letter, uiLang);
  const tip = getLetterTip(letter, uiLang);
  const practiceWordMeaningText = getMeaningText(practiceWordMeaningData, uiLang);
  const showMeaning = Boolean(practiceWordMeaningText);
  const practiceMarker = getPracticeLetterMarker(letter);
  const highlightedPracticeWord = useMemo(
    () => getHighlightedWordParts(practiceWord, practiceMarker),
    [practiceMarker, practiceWord],
  );

  // Speech practice hook - use hook's isRecording and isConnecting states
  const {
    startRecording,
    stopRecording,
    isRecording,
    isConnecting,
    supportsSpeech,
  } = useSpeechPractice({
    targetText: practiceWord || "placeholder",
    targetLang: targetLang,
    onResult: ({ recognizedText: text, error }) => {
      if (error) {
        toast({
          title: uiText(uiLang, "recordingErrorTitle"),
          description: uiText(uiLang, "recordingErrorDescription"),
          status: "error",
          duration: 2500,
        });
        return;
      }

      const recognized = text || "";
      if (recognized.trim()) {
        checkAnswerWithAI(recognized);
      }
    },
    timeoutMs: pauseMs,
  });

  const checkAnswerWithAI = async (answer) => {
    setIsGrading(true);

    try {
      const response = await callResponses({
        model: DEFAULT_RESPONSES_MODEL,
        input: buildAlphabetJudgePrompt({
          practiceWord,
          userAnswer: answer,
          targetLang,
        }),
      });

      const trimmed = (response || "").trim().toUpperCase();
      const isYes = trimmed.startsWith("YES");

      let xp = 1;
      if (isYes && trimmed.includes("|")) {
        const parts = trimmed.split("|");
        const xpPart = parseInt(parts[1]?.trim());
        if (xpPart >= 1 && xpPart <= 2) {
          xp = xpPart;
        }
      }

      setIsCorrect(isYes);
      setShowResult(true);

      // Daily plate: every graded letter practice counts toward the Phonics
      // quest course (pass or fail, like flashcard reviews).
      if (npub) {
        void recordPlateActivity(npub, "phonics", targetLang);
      }

      let nextPracticeWord = practiceWord;
      let nextPracticeMeaning = practiceWordMeaningData;

      // Award XP and save progress
      if (isYes) {
        // Auditory cue that the answer was correct.
        playSound("correct");
        setCorrectCount((c) => c + 1);
        if (npub) {
          await awardXp(npub, xp, targetLang);
          onXpAwarded?.(xp);
        }
        // Collect the card on its first clear this mount (works across rounds).
        if (!collectedThisMountRef.current) {
          collectedThisMountRef.current = true;
          onCardCollected?.(letter.id);
        }
      }

      // Calculate new correctCount (since setCorrectCount is async)
      const newCorrectCount = isYes ? correctCount + 1 : correctCount;

      // Save progress regardless of result
      await saveAlphabetProgress(
        npub,
        targetLang,
        letter.id,
        nextPracticeWord,
        isYes,
        nextPracticeMeaning,
      );
      await saveAlphabetPracticeWord(
        npub,
        targetLang,
        letter.id,
        nextPracticeWord,
        nextPracticeMeaning,
        newCorrectCount,
      );
    } catch (error) {
      console.error("AI grading error:", error);
      toast({
        title: uiText(uiLang, "gradingErrorTitle"),
        description: uiText(uiLang, "gradingErrorDescription"),
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handlePracticeClick = async () => {
    playSound(selectSound);
    setIsPracticeMode(true);
    setIsFlipped(true);
    setShowResult(false);

    // Completed/collected letters may not have a practice word loaded yet —
    // generate one on demand so Practice always has something to say.
    if (!practiceWord && !isGeneratingWord) {
      setIsGeneratingWord(true);
      try {
        const generated = await generateNewPracticeWord("");
        if (generated?.word) {
          const meaning = normalizeMeaning(generated.meaning);
          setPracticeWord(generated.word);
          setPracticeWordMeaningData(meaning);
          onPracticeWordUpdated?.(letter.id, generated.word, meaning);
          await saveAlphabetPracticeWord(
            npub,
            targetLang,
            letter.id,
            generated.word,
            meaning,
            correctCount,
          );
        }
      } catch (error) {
        console.error("Failed to generate practice word on demand:", error);
      } finally {
        setIsGeneratingWord(false);
      }
    }
  };

  const handleFlipBack = () => {
    playSound(selectSound);
    setIsFlipped(false);
    setTimeout(() => {
      setIsPracticeMode(false);
      setShowResult(false);
    }, 300);
  };

  const handleRecord = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    // Clear previous results
    setShowResult(false);
    setIsCorrect(false);
    playSound(submitActionSound);

    try {
      await startRecording();
    } catch (err) {
      const code = err?.code;
      if (code === "no-speech-recognition") {
        toast({
          title: uiText(uiLang, "speechUnsupportedTitle"),
          description: uiText(uiLang, "speechUnsupportedDescription"),
          status: "warning",
          duration: 3200,
        });
      } else if (code === "mic-denied") {
        toast({
          title: uiText(uiLang, "micDeniedTitle"),
          description: uiText(uiLang, "micDeniedDescription"),
          status: "error",
          duration: 3200,
        });
      }
    }
  };

  const stopWordPlayback = useCallback(() => {
    wordPlaybackRequestRef.current += 1;
    try {
      wordPlayerRef.current?.audio?.pause?.();
    } catch {}
    wordPlayerRef.current?.cleanup?.();
    wordPlayerRef.current = null;
    setIsPlayingWord(false);
    setIsLoadingTts(false);
  }, []);

  const handlePlayWord = async () => {
    if (!practiceWord) return;

    if (isPlayingWord || isLoadingTts) {
      stopWordPlayback();
      return;
    }

    stopWordPlayback();
    const requestId = wordPlaybackRequestRef.current;
    setIsLoadingTts(true);

    try {
      const player = await getTTSPlayer({
        text: practiceWord,
        langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
        voice: getPreferredTTSVoice(),
      });

      if (requestId !== wordPlaybackRequestRef.current) {
        player.cleanup?.();
        return;
      }

      wordPlayerRef.current = player;

      await player.ready;

      if (requestId !== wordPlaybackRequestRef.current) {
        player.cleanup?.();
        wordPlayerRef.current = null;
        return;
      }

      let didFinishPlayback = false;
      let detachCompletionWatcher = () => {};
      const finishPlayback = () => {
        if (requestId !== wordPlaybackRequestRef.current) return;
        if (didFinishPlayback) return;
        didFinishPlayback = true;
        detachCompletionWatcher();
        setIsPlayingWord(false);
        setIsLoadingTts(false);
        wordPlayerRef.current = null;
        player.cleanup?.();
      };

      detachCompletionWatcher = watchRealtimeAudioCompletion(
        player.audio,
        finishPlayback,
      );

      setIsLoadingTts(false);
      setIsPlayingWord(true);
      await player.audio.play();
    } catch (err) {
      if (requestId !== wordPlaybackRequestRef.current) return;
      console.error("TTS error:", err);
      stopWordPlayback();
    }
  };

  const handleTryAgain = () => {
    playSound(selectSound);
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleNextWord = async () => {
    playSound(nextButtonSound);
    const generated = await generateNewPracticeWord(practiceWord);
    if (!generated?.word) {
      toast({
        title: uiText(uiLang, "generateWordErrorTitle"),
        status: "warning",
        duration: 2500,
      });
      return;
    }

    const nextPracticeWord = generated.word;
    const nextPracticeMeaning = normalizeMeaning(generated.meaning);
    setPracticeWord(nextPracticeWord);
    setPracticeWordMeaningData(nextPracticeMeaning);
    onPracticeWordUpdated?.(letter.id, nextPracticeWord, nextPracticeMeaning);
    await saveAlphabetPracticeWord(
      npub,
      targetLang,
      letter.id,
      nextPracticeWord,
      nextPracticeMeaning,
      correctCount,
    );
    setShowResult(false);
    setIsCorrect(false);
  };

  const generateNewPracticeWord = useCallback(
    async (currentWord) => {
      const languageName = LANGUAGE_NAMES[targetLang] || "the target language";
      const scriptName = getScriptName(targetLang, uiLang);
      const letterNameForPrompt = getLetterName(letter, uiLang) || letter.name || letter.letter;
      const avoidClause = currentWord
        ? `\n- Do NOT use the word "${currentWord}" - generate a DIFFERENT word.`
        : "";
      const prompt = `Generate one beginner-friendly ${languageName} word that starts with the ${languageName} letter/syllable "${letter.letter}" (${letterNameForPrompt}). Respond ONLY with JSON in this shape:
{"word":"<${languageName} word in native script>","meaning_en":"<short english meaning>","meaning_es":"<short spanish meaning>","meaning_it":"<short italian meaning>","meaning_fr":"<short french meaning>","meaning_ja":"<short Japanese meaning>","meaning_hi":"<short Hindi meaning>","meaning_ar":"<short Egyptian Arabic meaning>","meaning_zh":"<short Mandarin Chinese meaning>"}
- Use ${scriptName}.
- Keep the word simple (2-4 syllables) and common.${avoidClause}
- Do not add any extra text.`;

      try {
        const raw = await callResponses({
          model: DEFAULT_RESPONSES_MODEL,
          input: prompt,
        });
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
        const word = String(parsed.word || "").trim();
        const meaning = normalizeMeaning({
          en: parsed.meaning_en || parsed.meaning || "",
          es: parsed.meaning_es || parsed.meaning || "",
          it: parsed.meaning_it || parsed.meaning || "",
          fr: parsed.meaning_fr || parsed.meaning || "",
          ja: parsed.meaning_ja || parsed.meaning || "",
          hi: parsed.meaning_hi || parsed.meaning || "",
          ar: parsed.meaning_ar || parsed.meaning || "",
          zh: parsed.meaning_zh || parsed.meaning || "",
        });

        if (!word) return null;

        return { word, meaning };
      } catch (error) {
        console.error("Failed to generate practice word:", error);
        return null;
      }
    },
    [
      letter.letter,
      letter.name,
      letter.nameAr,
      letter.nameHi,
      letter.nameJa,
      letter.nameZh,
      targetLang,
      uiLang,
    ],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWordPlayback();
    };
  }, [stopWordPlayback]);

  return (
    <Box
      position="relative"
      w="100%"
      minH={{ base: "320px", md: "340px" }}
      sx={{ perspective: "1000px" }}
    >
      <MotionBox
        w="100%"
        h="100%"
        display="grid"
        gridTemplateColumns="1fr"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Front Side - Letter Info */}
        <VStack
          gridArea="1 / 1"
          w="100%"
          h="100%"
          align="center"
          justify="center"
          spacing={4}
          bg={APP_SURFACE_ELEVATED}
          border="1px solid"
          borderColor={APP_BORDER}
          borderRadius="lg"
          p={4}
          boxShadow={APP_SHADOW}
          color={APP_TEXT_PRIMARY}
          position="relative"
          sx={{ backfaceVisibility: "hidden" }}
          minH={{ base: "260px", md: "230px" }}
        >
          {/* Star counter */}
          {correctCount === 0 ? null : (
            <HStack spacing={1} position="absolute" top={3} left={3}>
              <RiStarFill size={14} color="cyan" />
              <Text fontSize="xs" fontWeight="bold">
                {correctCount}
              </Text>
            </HStack>
          )}

          <HStack justify="space-between" w="100%">
            <Badge colorScheme={typeColor} borderRadius="md" px={2} py={1}>
              {typeLabel}
            </Badge>
            <HStack spacing={2}>
              <Button
                size="sm"
                background="transparent"
                border="1px solid"
                borderColor={APP_BORDER_STRONG}
                boxShadow="0px 2px 0px rgba(148, 163, 184, 0.35)"
                color={APP_TEXT_PRIMARY}
                leftIcon={<RiMicLine size={12} />}
                onClick={handlePracticeClick}
                isLoading={isGeneratingWord}
                fontSize="xs"
                _hover={{ bg: APP_SURFACE_MUTED }}
              >
                {uiText(uiLang, "practice")}
              </Button>
            </HStack>
          </HStack>

          <VStack spacing={3} align="center" textAlign="center" w="100%">
            <Flex align="center" justify="center" w="100%" gap={3} minH="48px">
              <VStack spacing={1} align="center">
                <Text fontSize="2xl" fontWeight="bold">
                  {letter.letter}
                </Text>
                {displayName ? (
                  <Text fontSize="lg" fontWeight="semibold">
                    {displayName}
                  </Text>
                ) : null}
              </VStack>
              {onPlay && (
                <Flex
                  as="button"
                  aria-label={uiText(uiLang, "playSound")}
                  align="center"
                  justify="center"
                  bg={APP_SURFACE_MUTED}
                  border="1px solid"
                  borderColor={APP_BORDER}
                  borderRadius="full"
                  p={2}
                  _hover={{ bg: APP_SURFACE }}
                  color={isLoading || isPlaying ? "teal.500" : APP_TEXT_PRIMARY}
                  onClick={() => onPlay(letter)}
                >
                  {isLoading ? (
                    <Spinner size={"xs"} />
                  ) : (
                    <FiVolume2 />
                  )}
                </Flex>
              )}
            </Flex>

            {sound ? (
              <Text color={APP_TEXT_PRIMARY} fontSize="sm">
                {sound}
              </Text>
            ) : null}
            {tip ? (
              <Text fontSize="2xs" color={APP_TEXT_SECONDARY}>
                {tip}
              </Text>
            ) : null}
          </VStack>
        </VStack>

        {/* Back Side - Practice Mode */}
        <VStack
          gridArea="1 / 1"
          w="100%"
          h="100%"
          align="center"
          justify="center"
          spacing={3}
          bg={APP_SURFACE_ELEVATED}
          border="1px solid"
          borderColor={APP_BORDER_STRONG}
          borderRadius="lg"
          p={4}
          boxShadow={APP_SHADOW}
          color={APP_TEXT_PRIMARY}
          position="relative"
          sx={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Star counter */}
          <HStack spacing={1} position="absolute" top={3} left={3}>
            <RiStarFill size={14} color="#ECC94B" />
            <Text fontSize="xs" fontWeight="bold" color="yellow.400">
              {correctCount}
            </Text>
          </HStack>

          {/* Close button */}
          <IconButton
            aria-label={uiText(uiLang, "close")}
            icon={<RiCloseLine size={18} />}
            size="xs"
            bg="transparent"
            border="1px solid"
            borderColor={APP_BORDER_STRONG}
            boxShadow="0px 2px 0px rgba(148, 163, 184, 0.35)"
            color={APP_TEXT_SECONDARY}
            position="absolute"
            top={2}
            right={2}
            onClick={handleFlipBack}
            _hover={{ bg: APP_SURFACE_MUTED }}
          />

          {/* Practice Word Display */}
          <Text fontSize="xs" color={APP_TEXT_SECONDARY} fontWeight="medium">
            {uiText(uiLang, "sayThisWord")}
          </Text>

          {isGeneratingWord && !practiceWord ? (
            <Spinner size="md" color="teal.400" my={2} />
          ) : (
            <HStack spacing={2} align="center">
              <Text fontSize="2xl" fontWeight="black" color={APP_TEXT_PRIMARY}>
                {highlightedPracticeWord.map((part, index) => (
                  <Text
                    key={`${part.text}-${index}`}
                    as="span"
                    color={part.highlight ? "green.500" : APP_TEXT_PRIMARY}
                  >
                    {part.text}
                  </Text>
                ))}
              </Text>
              <IconButton
                aria-label={uiText(uiLang, "playWord")}
                icon={isLoadingTts ? <Spinner size="xs" /> : <FiVolume2 />}
                size="sm"
                variant="ghost"
                color={
                  isLoadingTts || isPlayingWord ? "teal.500" : APP_TEXT_PRIMARY
                }
                onClick={handlePlayWord}
                isDisabled={isLoadingTts}
                _hover={{ bg: APP_SURFACE_MUTED }}
              />
            </HStack>
          )}

          {showMeaning && (
            <Text fontSize="sm" color={APP_TEXT_SECONDARY}>
              ({practiceWordMeaningText})
            </Text>
          )}

          {/* Recording / Result Area */}
          {isGrading ? (
            <VStack spacing={2} py={2}>
              <VoiceOrb
                state={
                  ["idle", "listening", "speaking"][
                    Math.floor(Math.random() * 3)
                  ]
                }
                size={32}
              />
              <Text fontSize="xs" color={APP_TEXT_SECONDARY}>
                {uiText(uiLang, "grading")}
              </Text>
            </VStack>
          ) : showResult ? (
            <VStack spacing={3} py={2}>
              <Flex
                align="center"
                justify="center"
                w={10}
                h={10}
                borderRadius="full"
                bg={isCorrect ? "green.500" : "red.500"}
              >
                {isCorrect ? (
                  <RiCheckLine size={24} />
                ) : (
                  <RiCloseLine size={24} />
                )}
              </Flex>

              <HStack spacing={2} mt={1}>
                {isCorrect ? (
                  <Button
                    size="xs"
                    colorScheme="green"
                    onClick={handleNextWord}
                    _hover={{ bg: "green.400" }}
                  >
                    {uiText(uiLang, "nextWord")}
                  </Button>
                ) : (
                  <Button
                    size="xs"
                    variant="ghost"
                    color={APP_TEXT_PRIMARY}
                    onClick={handleTryAgain}
                    _hover={{ bg: APP_SURFACE_MUTED }}
                  >
                    {uiText(uiLang, "tryAgain")}
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  color={APP_TEXT_PRIMARY}
                  onClick={handleFlipBack}
                  _hover={{ bg: APP_SURFACE_MUTED }}
                >
                  {uiText(uiLang, "back")}
                </Button>
              </HStack>
            </VStack>
          ) : (
            <VStack spacing={2} py={2}>
              <Button
                size="md"
                colorScheme={
                  isRecording ? undefined : isConnecting ? "yellow" : "teal"
                }
                bg={isRecording ? SOFT_STOP_BUTTON_BG : undefined}
                boxShadow={isRecording ? "0px 4px 0px #e03767" : undefined}
                color={isRecording ? "white" : undefined}
                leftIcon={
                  isConnecting ? (
                    <Spinner size="xs" />
                  ) : isRecording ? (
                    <RiStopCircleLine />
                  ) : (
                    <RiMicLine />
                  )
                }
                onClick={handleRecord}
                isDisabled={!supportsSpeech || isConnecting}
                _hover={{
                  transform: "scale(1.02)",
                  ...(isRecording ? { bg: SOFT_STOP_BUTTON_HOVER_BG } : {}),
                }}
              >
                {isConnecting
                  ? uiText(uiLang, "connecting")
                  : isRecording
                    ? uiText(uiLang, "stop")
                    : uiText(uiLang, "record")}
              </Button>
            </VStack>
          )}
        </VStack>
      </MotionBox>
    </Box>
  );
}

const withLocalizedAlphabetSupport = (letters) =>
  withChineseAlphabetSupport(
    withArabicAlphabetSupport(
      withHindiAlphabetSupport(
        withJapaneseAlphabetSupport(
          withFrenchAlphabetSupport(
            withGermanAlphabetSupport(
              withItalianAlphabetSupport(withPortugueseAlphabetSupport(letters)),
            ),
          ),
        ),
      ),
    ),
  );

const LANGUAGE_ALPHABETS = {
  ru: withLocalizedAlphabetSupport(RUSSIAN_ALPHABET),
  ja: withLocalizedAlphabetSupport(JAPANESE_ALPHABET),
  en: withLocalizedAlphabetSupport(ENGLISH_ALPHABET),
  es: withLocalizedAlphabetSupport(SPANISH_ALPHABET),
  pt: withLocalizedAlphabetSupport(PORTUGUESE_ALPHABET),
  fr: withLocalizedAlphabetSupport(FRENCH_ALPHABET),
  it: withLocalizedAlphabetSupport(ITALIAN_ALPHABET),
  nl: withLocalizedAlphabetSupport(DUTCH_ALPHABET),
  de: withLocalizedAlphabetSupport(GERMAN_ALPHABET),
  nah: withLocalizedAlphabetSupport(NAHUATL_ALPHABET),
  el: withLocalizedAlphabetSupport(GREEK_ALPHABET),
  pl: withLocalizedAlphabetSupport(POLISH_ALPHABET),
  ga: withLocalizedAlphabetSupport(IRISH_ALPHABET),
  yua: withLocalizedAlphabetSupport(YUCATEC_MAYA_ALPHABET),
};

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function watchRealtimeAudioCompletion(audio, onDone) {
  if (!audio) return () => {};

  let hasStarted = false;
  let isDetached = false;
  let silenceTimer = null;
  let levelPollTimer = null;
  let audioContext = null;
  let mediaSource = null;
  let analyser = null;
  let levelSamples = null;
  const audioTracks = audio.srcObject?.getAudioTracks?.() || [];

  const clearSilenceTimer = () => {
    if (!silenceTimer) return;
    clearTimeout(silenceTimer);
    silenceTimer = null;
  };
  const markStarted = () => {
    hasStarted = true;
    clearSilenceTimer();
  };
  const scheduleSilenceFinish = () => {
    if (!hasStarted || silenceTimer) return;
    silenceTimer = setTimeout(() => {
      silenceTimer = null;
      onDone();
    }, 700);
  };
  const finishAfterStart = () => {
    const currentTime = Number.isFinite(audio.currentTime)
      ? audio.currentTime
      : 0;
    if (hasStarted || currentTime > 0.01) onDone();
  };
  const finish = () => {
    onDone();
  };
  const detach = () => {
    if (isDetached) return;
    isDetached = true;
    clearSilenceTimer();
    if (levelPollTimer) {
      clearTimeout(levelPollTimer);
      levelPollTimer = null;
    }
    audio.removeEventListener("playing", markStarted);
    audio.removeEventListener("ended", finish);
    audio.removeEventListener("error", finish);
    audioTracks.forEach((track) => {
      track.removeEventListener("unmute", markStarted);
      track.removeEventListener("mute", finishAfterStart);
      track.removeEventListener("ended", finishAfterStart);
    });
    try {
      mediaSource?.disconnect?.();
    } catch {
      // The source may already be disconnected when playback is cleaned up.
    }
    try {
      analyser?.disconnect?.();
    } catch {
      // The analyser may already be disconnected when playback is cleaned up.
    }
    try {
      audioContext?.close?.();
    } catch {
      // Closing is best-effort; the browser will reclaim the context.
    }
  };

  const pollAudioLevel = () => {
    if (isDetached || !analyser || !levelSamples) return;

    analyser.getByteTimeDomainData(levelSamples);
    let sumSquares = 0;
    for (let i = 0; i < levelSamples.length; i += 1) {
      const centered = (levelSamples[i] - 128) / 128;
      sumSquares += centered * centered;
    }
    const rms = Math.sqrt(sumSquares / levelSamples.length);

    if (rms > 0.006) {
      markStarted();
    } else {
      scheduleSilenceFinish();
    }

    levelPollTimer = setTimeout(pollAudioLevel, 80);
  };

  audio.addEventListener("playing", markStarted, { once: true });
  audio.addEventListener("ended", finish, { once: true });
  audio.addEventListener("error", finish, { once: true });

  audioTracks.forEach((track) => {
    if (!track.muted && track.readyState === "live") markStarted();
    track.addEventListener("unmute", markStarted, { once: true });
    track.addEventListener("mute", finishAfterStart);
    track.addEventListener("ended", finishAfterStart);
  });

  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextCtor && audio.srcObject instanceof MediaStream) {
      audioContext = new AudioContextCtor();
      mediaSource = audioContext.createMediaStreamSource(audio.srcObject);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      levelSamples = new Uint8Array(analyser.fftSize);
      mediaSource.connect(analyser);
      void audioContext.resume?.();
      pollAudioLevel();
    }
  } catch {
    // Fall back to media and track events when Web Audio is unavailable.
  }

  return detach;
}

export default function AlphabetBootcamp({
  appLanguage = "en",
  targetLang,
  npub,
  languageXp = 0,
  pauseMs = 2000,
}) {
  const uiLang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const isLightTheme = useThemeStore((s) => s.themeMode) === "light";
  const alphabet = LANGUAGE_ALPHABETS[targetLang] || RUSSIAN_ALPHABET;
  const playerRef = useRef(null);
  const playbackRequestRef = useRef(0);
  const playSound = useSoundSettings((s) => s.playSound);
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [currentXp, setCurrentXp] = useState(languageXp);
  const [savedPracticeWords, setSavedPracticeWords] = useState({});
  const [savedCorrectCounts, setSavedCorrectCounts] = useState({});

  // Deck-based state
  const [deck, setDeck] = useState([]);
  const [collectedLetters, setCollectedLetters] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  // Generated phonics units beyond the base alphabet (persisted to Firestore),
  // plus a flag shown while a fresh deck is being generated.
  const [generatedCards, setGeneratedCards] = useState([]);
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const toast = useToast();

  // Update currentXp when languageXp prop changes
  useEffect(() => {
    setCurrentXp(languageXp);
  }, [languageXp]);

  const handleXpAwarded = (xp) => {
    setCurrentXp((prev) => prev + xp);
  };

  // Generate an entirely new deck of fresh phonics units (digraphs, blends,
  // syllables, less-common sounds) beyond what's already been seen. Completed
  // cards are never touched — the collection only grows — and the new units are
  // persisted so they survive reloads.
  const handleNewRound = useCallback(async () => {
    if (isGeneratingDeck) return;
    playSound(selectSound);
    setIsGeneratingDeck(true);
    try {
      const existing = [...alphabet, ...generatedCards]
        .map((c) => c.letter)
        .filter(Boolean);
      const units = await generateNewPhonicsUnits(
        targetLang,
        uiLang,
        existing,
        NEW_DECK_SIZE,
      );
      if (!units.length) {
        toast({
          title: uiText(uiLang, "generateDeckError"),
          status: "error",
          duration: 3000,
        });
        return;
      }
      const stamp = Date.now();
      const newCards = units.map((u, i) =>
        buildGeneratedCard(u, uiLang, `gen_${stamp}_${i}`),
      );
      await Promise.all(
        newCards.map((c) => saveGeneratedPhonicsUnit(npub, targetLang, c)),
      );
      setGeneratedCards((prev) => [...prev, ...newCards]);
      setSavedPracticeWords((prev) => {
        const next = { ...prev };
        newCards.forEach((c) => {
          if (c.practiceWord) {
            next[c.id] = {
              word: c.practiceWord,
              meaning: c.practiceWordMeaning,
            };
          }
        });
        return next;
      });
      // New deck = the freshly generated units; the collection is left intact.
      setDeck((prev) => [...prev, ...shuffleArray(newCards)]);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Failed to generate a new phonics deck:", error);
      toast({
        title: uiText(uiLang, "generateDeckError"),
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsGeneratingDeck(false);
    }
  }, [
    alphabet,
    generatedCards,
    isGeneratingDeck,
    npub,
    playSound,
    targetLang,
    toast,
    uiLang,
  ]);

  const targetLanguage = getLanguageName(targetLang, uiLang);
  const headline = uiText(uiLang, "alphabetHeadline", {
    language: targetLanguage,
  });
  const subhead = uiText(uiLang, "alphabetSubhead", {
    language: targetLanguage,
  });
  const note = uiText(uiLang, "note");
  const hasLetters = Array.isArray(alphabet) && alphabet.length;
  // Total known cards = base alphabet + every generated phonics unit so far.
  const totalCards = (alphabet?.length || 0) + generatedCards.length;
  const isComplete =
    hasLetters &&
    isInitialized &&
    deck.length === 0 &&
    totalCards > 0 &&
    collectedLetters.length >= totalCards;

  // XP progress calculations
  const xpLevelNumber = Math.floor(currentXp / 100) + 1;
  const nextLevelProgressPct = currentXp % 100;

  const handlePracticeWordUpdated = useCallback((letterId, word, meaning) => {
    setSavedPracticeWords((prev) => ({
      ...prev,
      [letterId]: { word, meaning: normalizeMeaning(meaning) },
    }));
  }, []);

  // When a card is successfully practiced, move it from deck to collection
  const handleCardCollected = useCallback((letterId) => {
    setDeck((prevDeck) => {
      const cardIndex = prevDeck.findIndex((l) => l.id === letterId);
      if (cardIndex === -1) return prevDeck; // Already removed

      const card = prevDeck[cardIndex];
      // Add to collection
      setCollectedLetters((prev) => [...prev, card]);

      // Remove from deck
      return prevDeck.filter((l) => l.id !== letterId);
    });

    // Update saved correct counts (they just got their first correct)
    setSavedCorrectCounts((prev) => ({
      ...prev,
      [letterId]: (prev[letterId] || 0) + 1,
    }));
  }, []);

  const stopLetterPlayback = useCallback(() => {
    playbackRequestRef.current += 1;
    try {
      playerRef.current?.audio?.pause?.();
    } catch {}
    playerRef.current?.cleanup?.();
    playerRef.current = null;
    setPlayingId(null);
    setLoadingId(null);
  }, []);

  const handlePlayLetterAudio = useCallback(
    async (data) => {
      const text = (data?.tts || data?.letter || "").toString().trim();
      if (!text) return;

      const isSameCardActive = playingId === data.id || loadingId === data.id;
      const isPlaybackActuallyActive =
        loadingId === data.id ||
        Boolean(playerRef.current?.audio && !playerRef.current.audio.paused);

      if (isSameCardActive && isPlaybackActuallyActive) {
        stopLetterPlayback();
        return;
      }

      try {
        stopLetterPlayback();
        const requestId = playbackRequestRef.current;
        setLoadingId(data.id);

        const player = await getTTSPlayer({
          text,
          langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
          voice: getPreferredTTSVoice(),
        });

        if (requestId !== playbackRequestRef.current) {
          player.cleanup?.();
          return;
        }

        playerRef.current = player;
        await player.ready;

        if (requestId !== playbackRequestRef.current) {
          player.cleanup?.();
          playerRef.current = null;
          return;
        }

        let didFinishPlayback = false;
        let detachCompletionWatcher = () => {};
        const finishPlayback = () => {
          if (requestId !== playbackRequestRef.current) return;
          if (didFinishPlayback) return;
          didFinishPlayback = true;
          detachCompletionWatcher();
          setPlayingId(null);
          setLoadingId(null);
          playerRef.current = null;
          player.cleanup?.();
        };

        const audio = player.audio;
        detachCompletionWatcher = watchRealtimeAudioCompletion(
          audio,
          finishPlayback,
        );

        setLoadingId(null);
        setPlayingId(data.id);
        await audio.play();
      } catch (err) {
        console.error("AlphabetBootcamp TTS failed", err);
        stopLetterPlayback();
      }
    },
    [loadingId, playingId, stopLetterPlayback, targetLang],
  );

  useEffect(() => {
    setSavedPracticeWords({});
    setSavedCorrectCounts({});
    setGeneratedCards([]);
    setIsInitialized(false);

    if (!npub) {
      // No user - initialize deck with all letters shuffled
      const shuffled = shuffleArray(alphabet);
      setDeck(shuffled);
      setCollectedLetters([]);
      setIsInitialized(true);
      return;
    }
    let cancelled = false;
    const fallbackTimer = setTimeout(() => {
      if (cancelled) return;
      setDeck((currentDeck) =>
        currentDeck.length ? currentDeck : shuffleArray(alphabet),
      );
      setCollectedLetters((currentLetters) => currentLetters || []);
      setIsInitialized(true);
    }, 2500);

    const loadProgress = async () => {
      try {
        // Load practice words and correctCounts from subcollection
        const snapshot = await getDocs(
          query(
            collection(database, "users", npub, "alphabetPractice"),
            where("targetLang", "==", targetLang),
          ),
        );

        const mapped = {};
        const correctCounts = {};
        const collectedIds = new Set();
        const loadedGenerated = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?.letterId) {
            if (data?.currentWord) {
              mapped[data.letterId] = {
                word: data.currentWord,
                meaning: normalizeMeaning(data.currentMeaning),
              };
            }
            if (data?.correctCount) {
              correctCounts[data.letterId] = data.correctCount;
              // Cards with at least 1 correct are "collected"
              if (data.correctCount >= 1) {
                collectedIds.add(data.letterId);
              }
            }
            // Rebuild generated phonics units (beyond the base alphabet) so the
            // grown collection + any unfinished deck survive reloads, keeping
            // their localized pronunciation guide + tip.
            if (data.generated) {
              loadedGenerated.push({
                id: data.letterId,
                letter: data.grapheme || "",
                tts: data.tts || "",
                type: "sound",
                generated: true,
                ...pickGeneratedDisplayFields(data),
              });
            }
          }
        });

        if (!cancelled) {
          clearTimeout(fallbackTimer);
          setSavedPracticeWords(mapped);
          setSavedCorrectCounts(correctCounts);
          setGeneratedCards(loadedGenerated);

          // Deck = every known card (alphabet + generated) not yet collected;
          // the collection keeps everything cleared so far.
          const allCards = [...alphabet, ...loadedGenerated];
          const uncollected = allCards.filter((c) => !collectedIds.has(c.id));
          const collected = allCards.filter((c) => collectedIds.has(c.id));

          setDeck(shuffleArray(uncollected));
          setCollectedLetters(collected);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to load alphabet progress:", error);
        if (!cancelled) {
          clearTimeout(fallbackTimer);
          setSavedPracticeWords({});
          setSavedCorrectCounts({});
          // Fallback: all letters in deck
          setDeck(shuffleArray(alphabet));
          setCollectedLetters([]);
          setIsInitialized(true);
        }
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [npub, targetLang, alphabet]);

  useEffect(() => {
    return () => {
      stopLetterPlayback();
    };
  }, [stopLetterPlayback]);

  return (
    <VStack align="stretch" spacing={4} w="100%" color={APP_TEXT_PRIMARY} px={6}>
      {/* XP Progress Bar */}
      <Box maxW="400px" mx="auto" w="100%" zIndex={10} mt={12}>
        <XpProgressHeader
          levelText={`${uiText(uiLang, "level")} ${xpLevelNumber}`}
          xpText={`XP ${currentXp}`}
          progressPct={nextLevelProgressPct}
          xpBadgeProps={{ colorScheme: "teal", fontSize: "10px" }}
        />
      </Box>

      <Heading
        size="md"
        color={APP_TEXT_PRIMARY}
        zIndex={10}
        textAlign={"center"}
      >
        {headline}
      </Heading>
      <Text color={APP_TEXT_SECONDARY} zIndex={10} textAlign={"center"} mt={"-4"}>
        {subhead}
      </Text>
      {/* <Alert status="info" borderRadius="lg" bg="blue.900" color="white">
        <AlertIcon />
        {note}
      </Alert> */}

      {!isInitialized ? (
        <Flex align="center" justify="center" py={12}>
          <VoiceOrb
            state={
              ["idle", "listening", "speaking"][Math.floor(Math.random() * 3)]
            }
            size={48}
          />
        </Flex>
      ) : hasLetters ? (
        <VStack spacing={8} w="100%" zIndex={10}>
          {/* Deck Section */}
          {deck.length > 0 ? (
            <VStack spacing={4} w="100%">
              {/* Progress bar showing completion */}
              <Box w="100%" maxW="400px" mx="auto">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color={APP_TEXT_SECONDARY}>
                    {uiText(uiLang, "progress")}
                  </Text>
                  <Text fontSize="xs" color={APP_TEXT_PRIMARY} fontWeight="bold">
                    {collectedLetters.length} / {totalCards}
                  </Text>
                </HStack>
                <WaveBar
                  value={
                    totalCards > 0
                      ? (collectedLetters.length / totalCards) * 100
                      : 0
                  }
                  height={10}
                  start="#fbbf24"
                  end="#f59e0b"
                />
              </Box>

              {/* Deck visual - stacked cards with top card active */}
              <Box position="relative" w="100%" maxW="400px" mx="auto">
                {/* Top card (current card to practice) */}
                <Box position="relative" zIndex={20}>
                  <LetterCard
                    playSound={playSound}
                    key={deck[0].id}
                    letter={deck[0]}
                    appLanguage={appLanguage}
                    targetLang={targetLang}
                    npub={npub}
                    pauseMs={pauseMs}
                    onXpAwarded={handleXpAwarded}
                    initialPracticeWord={
                      savedPracticeWords[deck[0].id]?.word ||
                      deck[0].practiceWord
                    }
                    initialPracticeWordMeaning={
                      savedPracticeWords[deck[0].id]?.meaning ||
                      deck[0].practiceWordMeaning
                    }
                    initialCorrectCount={savedCorrectCounts[deck[0].id] || 0}
                    onPracticeWordUpdated={handlePracticeWordUpdated}
                    onCardCollected={handleCardCollected}
                    isPlaying={playingId === deck[0].id}
                    isLoading={loadingId === deck[0].id}
                    onPlay={handlePlayLetterAudio}
                  />
                </Box>

                {/* Deck thickness indicator - stacked edges below */}
                {deck.length > 1 && (
                  <Box
                    position="relative"
                    zIndex={1}
                    mt={{ base: "-60px", md: "-102px" }}
                    mx="1px"
                  >
                    {[...Array(Math.min(deck.length - 1, 8))].map((_, i) => (
                      <Box
                        key={i}
                        h="4px"
                        bg={i % 2 === 0 ? "gray.600" : "gray.700"}
                        borderBottomRadius={
                          i === Math.min(deck.length - 2, 7) ? "lg" : "none"
                        }
                        mx={`${i * 1}px`}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </VStack>
          ) : (
            <VStack spacing={4}>
              <Flex
                align="center"
                justify="center"
                bg={isLightTheme ? "green.50" : "green.900"}
                borderRadius="lg"
                border="1px solid"
                borderColor={isLightTheme ? "green.300" : "green.500"}
                p={6}
                maxW="400px"
                mx="auto"
              >
                <VStack spacing={2}>
                  <RandomCharacter notSoRandomCharacter="30" />
                  <Text
                    color={isLightTheme ? "green.700" : "green.200"}
                    fontWeight="bold"
                    textAlign="center"
                  >
                    {uiText(
                      uiLang,
                      generatedCards.length > 0 ? "deckComplete" : "complete",
                    )}
                  </Text>
                </VStack>
              </Flex>
              {isComplete && (
                <VStack spacing={3}>
                  <Button
                    variant="outline"
                    colorScheme="teal"
                    size="lg"
                    leftIcon={<RiRefreshLine />}
                    onClick={handleNewRound}
                    isLoading={isGeneratingDeck}
                  >
                    {uiText(uiLang, "newRound")}
                  </Button>
                </VStack>
              )}
            </VStack>
          )}

          {/* Collection Section */}
          {collectedLetters.length > 0 && (
            <VStack spacing={4} w="100%">
              {/* <HStack spacing={2}>
                <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                  {uiText(uiLang, "collection")}:{" "}
                  {collectedLetters.length}
                </Badge>
              </HStack> */}

              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3 }}
                spacing={4}
                w="100%"
              >
                {collectedLetters.map((item) => (
                  <LetterCard
                    key={item.id}
                    playSound={playSound}
                    letter={item}
                    appLanguage={appLanguage}
                    targetLang={targetLang}
                    npub={npub}
                    pauseMs={pauseMs}
                    onXpAwarded={handleXpAwarded}
                    initialPracticeWord={
                      savedPracticeWords[item.id]?.word || item.practiceWord
                    }
                    initialPracticeWordMeaning={
                      savedPracticeWords[item.id]?.meaning ||
                      item.practiceWordMeaning
                    }
                    initialCorrectCount={savedCorrectCounts[item.id] || 0}
                    onPracticeWordUpdated={handlePracticeWordUpdated}
                    isPlaying={playingId === item.id}
                    isLoading={loadingId === item.id}
                    onPlay={handlePlayLetterAudio}
                  />
                ))}
              </SimpleGrid>
            </VStack>
          )}
        </VStack>
      ) : (
        <Flex
          align="center"
          justify="center"
          bg={APP_SURFACE_ELEVATED}
          borderRadius="lg"
          border="1px solid"
          borderColor={APP_BORDER}
          p={6}
          boxShadow={APP_SHADOW}
        >
          <Text color={APP_TEXT_SECONDARY}>
            {uiText(uiLang, "loadError")}
          </Text>
        </Flex>
      )}
    </VStack>
  );
}
