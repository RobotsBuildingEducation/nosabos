import { t } from "../utils/translation";
import { getSpeechPracticeErrorFeedback } from "../utils/speechPracticeFeedback.js";
import { createPhonicsCompletionObserver } from "../achievements/phonicsProgress.js";
import { awardProgressionAchievements } from "../utils/achievements.js";
import useGoalFocusStore from "../hooks/useGoalFocusStore";
import useUserStore from "../hooks/useUserStore";
import { questionWorthForUser } from "../utils/performanceEloModel";
import { assessGeneratedQuestionWorth } from "../utils/questionDifficultyAssessment";
import { currentGoalFocus, recordGoalAttempt } from "../utils/learningIntelligence";
import { getFocusedPhonicsDeck, savePracticeOutcome } from "../utils/focusedPracticeDecks";
import ActivityActionRow from "./ActivityActionRow";
import QuestionActionArea from "./QuestionActionArea";
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
import { getAuthoredPhonicsDeck, partitionPhonicsProgress, PHONICS_CONTROLS, PHONICS_LEVELS, PHONICS_TARGET_NAMES } from "../data/phonics/index.js";
import { FiVolume2 } from "react-icons/fi";
import { FaMicrophone, FaStop } from "react-icons/fa";
import {
  RiMicLine,
  RiStopCircleLine,
  RiCheckLine,
  RiCloseLine,
  RiStarFill,
  RiRefreshLine,
} from "react-icons/ri";
import { getPreferredTTSVoice, getTTSPlayer, TTS_LANG_TAG } from "../utils/tts";
import { watchPhonicsPlaybackCompletion } from "../utils/phonicsPlayback";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { awardXp } from "../utils/utils";
import { recordGradedOutcome } from "../utils/learningIntelligence";
import { recordPlateActivity } from "../utils/dailyPlate";
import {
  captureCompanionMemory,
  completeRepairFocus,
} from "../utils/companionMemory";
import useRepairFocusStore, { currentRepairFocus } from "../hooks/useRepairFocusStore";
import {
  SOFT_STOP_BUTTON_BG,
  SOFT_STOP_BUTTON_HOVER_BG,
} from "../utils/softStopButton";
import VoiceWaveIcon from "./VoiceWaveIcon";
import { WaveBar } from "./WaveBar";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useSoundSettings from "../hooks/useSoundSettings";
import { selectSound, submitActionSound, nextButtonSound } from "../constants/sounds";
import VoiceOrb from "./VoiceOrbNext";
import CEFRLevelNavigator from "./CEFRLevelNavigator";
import CourseProgressHeader from "./CourseProgressHeader";
import PhonicsCardStack from "./PhonicsCardStack";
import { getPhonicsCourseProgress, canAccessPhonicsLevel, resolvePhonicsLevel } from "../utils/phonicsCourseProgress.js";
import { generateSupplementalPhonicsDeck } from "../utils/phonicsDeckGeneration.js";
import { restoreSupplementalPhonics, supplementalPhonicsRecord, supplementalPhonicsEvents, SUPPLEMENTAL_PHONICS_VERSION } from "../utils/supplementalPhonics.js";
import { isMasterUnlockActive } from "../utils/masterUnlock";
import RandomCharacter from "./RandomCharacter";
import { useThemeStore } from "../useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  LANGUAGE_FALLBACK_LABELS,
  LANGUAGE_PROMPT_LABELS,
  normalizeSupportLanguage,
} from "../constants/languages";
import { APP_SQUIRCLE_SHAPE } from "../theme";

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
const APP_SQUIRCLE_STYLE = { cornerShape: APP_SQUIRCLE_SHAPE };

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
    next: "Next",
    nextWord: "Next word",
    correct: "Correct!",
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
    alphabetHeadline: "{language} Phonics",
    alphabetSubhead: "Practice {language} letters and sounds.",
    note: "After this, switch to Path mode in the menu to explore lessons.",
    complete: "Congratulations! You've completed the alphabet.",
    deckComplete: "Deck cleared! Generate a new one to keep going.",
    generateDeckError: "Couldn't generate a new deck. Please try again.",
    startSkillTree: "Start lessons",
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
    next: "Siguiente",
    nextWord: "Siguiente palabra",
    correct: "¡Correcto!",
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
    alphabetHeadline: "Fonética del {language}",
    alphabetSubhead: "Practica las letras y los sonidos del {language}.",
    note:
      "Después de esto, cambia al modo Ruta en el menú para explorar las lecciones.",
    complete: "¡Felicidades! Has completado el alfabeto.",
    startSkillTree: "Iniciar lecciones",
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
    next: "Avanti",
    nextWord: "Prossima parola",
    correct: "Corretto!",
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
    alphabetHeadline: "Fonetica {language}",
    alphabetSubhead: "Esercitati con le lettere e i suoni del {language}.",
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
    next: "Suivant",
    nextWord: "Mot suivant",
    correct: "Correct !",
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
    alphabetHeadline: "Phonétique {language}",
    alphabetSubhead: "Pratique les lettres et les sons du {language}.",
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
    next: "Weiter",
    nextWord: "Nächstes Wort",
    correct: "Richtig!",
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
    alphabetHeadline: "{language}-Phonetik",
    alphabetSubhead: "Übe die Buchstaben und Laute von {language}.",
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
    next: "次へ",
    nextWord: "次の単語",
    correct: "正解！",
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
    alphabetHeadline: "{language}のフォニックス",
    alphabetSubhead: "{language}の文字と音を練習しましょう。",
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
    next: "आगे बढ़ें",
    nextWord: "अगला शब्द",
    correct: "सही!",
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
    alphabetHeadline: "{language} फ़ोनिक्स",
    alphabetSubhead: "{language} के अक्षरों और ध्वनियों का अभ्यास करें।",
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
    next: "التالي",
    nextWord: "الكلمة اللي بعد كده",
    correct: "صحيح!",
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
    alphabetHeadline: "صوتيات {language}",
    alphabetSubhead: "تدرّب على حروف وأصوات {language}.",
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
    next: "下一个",
    nextWord: "下一个词",
    correct: "正确！",
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
    alphabetHeadline: "{language}自然拼读",
    alphabetSubhead: "练习{language}的字母和发音。",
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
  next: "Avançar",
  nextWord: "Próxima palavra",
  correct: "Correto!",
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
  alphabetHeadline: "Fonética do {language}",
  alphabetSubhead: "Pratique as letras e os sons do {language}.",
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

const getLanguageName = (code, uiLang) => PHONICS_TARGET_NAMES[uiLang]?.[code] || "";

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
  if (letter.authored || letter.curriculumVersion === SUPPLEMENTAL_PHONICS_VERSION) return letter.supportLanguage === normalizedLang ? (letter[baseKey] || "") : "";
  const suffix = LOCALIZED_FIELD_SUFFIX[normalizedLang];
  const fieldName = suffix ? `${baseKey}${suffix}` : baseKey;
  const value = letter[fieldName];
  return typeof value === "string" ? value.trim() : "";
};

const getMeaningText = (meaning, uiLang) => meaning?.[normalizeSupportLanguage(uiLang, DEFAULT_SUPPORT_LANGUAGE)] || "";

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

const normalizeMeaning = (meaning) => meaning && typeof meaning === "object" ? { ...meaning } : {};

// Build AI grading prompt for alphabet practice
function buildAlphabetJudgePrompt({ practiceWord, userAnswer, targetLang, phoneme = "", cefrLevel = "Pre-A1" }) {
  const langName = LANGUAGE_PROMPT_LABELS[targetLang] || "the target";

  return `
Judge if the user correctly pronounced a ${langName} word.

Target word: ${practiceWord}
${phoneme ? `Focus sound: ${phoneme}. The target sound must be recognizable in the attempt; do not accept a different sound just because the overall word is close.` : ""}
User's pronunciation (transcribed): ${userAnswer}

Policy:
- Say YES if the transcription matches or is phonetically very close to the target word.
- Allow minor transcription errors since speech recognition may not be perfect for ${langName}.
- Practice level: ${cefrLevel}. Assess recognizable speech; do not demand a native accent.
- A transcript cannot prove pitch, tone, stress or rhythm. Do not claim to have measured those features.
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
          attempts: increment(1),
          correctCount: increment(wasCorrect ? 1 : 0),
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
        // Word selection must never overwrite another device's completion.
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving alphabet practice word:", error);
  }
}

async function saveSupplementalPhonicsDeck(npub, cards) {
  if (!npub) return;
  const batch = writeBatch(database);
  for (const card of cards) batch.set(
    doc(database, "users", npub, "alphabetPractice", card.targetLang + "_" + card.id),
    { ...supplementalPhonicsRecord(card), createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );
  await batch.commit();
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
  dockActions = false,
  stackCount = 1,
  playSound = () => {},
  letter,
  onPlay,
  isPlaying,
  isLoading = false,
  appLanguage,
  targetLang,
  npub,
  cefrLevel = "Pre-A1",
  onXpAwarded,
  initialPracticeWord,
  initialPracticeWordMeaning,
  initialCorrectCount = 0,
  onPracticeWordUpdated,
  onCardCollected,
  pauseMs = 2000,
}) {
  const uiLang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const questionWorthRef = useRef(null);
  const questionWorthPromiseRef = useRef(Promise.resolve(null));
  useEffect(() => {
    questionWorthRef.current = questionWorthForUser(
      useUserStore.getState().user, targetLang, letter?.cefrLevel || cefrLevel,
    );
  }, [letter?.id, letter?.cefrLevel, cefrLevel, targetLang]);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const useDock = dockActions || isPracticeMode;
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
  useEffect(() => {
    const user = useUserStore.getState().user;
    questionWorthPromiseRef.current = assessGeneratedQuestionWorth({
      user, targetLang, questionLevel: letter?.cefrLevel || cefrLevel,
      question: { letter: letter?.letter, phoneme: letter?.phoneme,
        practiceWord, task: "Pronounce the practice word" }, mode: "phonics",
    });
    void questionWorthPromiseRef.current.then((worth) => { questionWorthRef.current = worth; });
  }, [letter?.id, letter?.cefrLevel, letter?.letter, letter?.phoneme,
    practiceWord, cefrLevel, targetLang]);
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
    isEvaluating,
    stream,
    supportsSpeech,
  } = useSpeechPractice({
    targetText: practiceWord || "placeholder",
    targetLang: targetLang,
    transcriptionHint: practiceWord,
    onResult: ({ recognizedText: text, error }) => {
      if (error) {
        toast({
          ...getSpeechPracticeErrorFeedback(error, (key) => t(uiLang, key)),
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
          phoneme: letter?.phoneme || "",
          userAnswer: answer,
          cefrLevel: letter.cefrLevel || cefrLevel,
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
      const assessedWorth = await questionWorthPromiseRef.current;
      void recordGradedOutcome({ npub, targetLang, success: isYes,
        questionLevel: letter?.cefrLevel || cefrLevel,
        worth: assessedWorth,
        mode: "phonics", concept: practiceWord, support: "modeled" })
        .catch((error) => console.warn("Phonics Score save failed:", error));

      // Companion brain: a missed pronunciation is a high-signal phonics slip —
      // bank it for tomorrow's repair quest (it enriches itself via the cheap
      // model). Fire-and-forget so grading UI stays snappy.
      if (!isYes && !letter.isGoal) {
        captureCompanionMemory({
          npub,
          targetLang,
          supportLang: uiLang,
          sourceMode: "phonics",
          concept: practiceWord,
          userAnswer: answer,
          expectedAnswer: practiceWord,
          // Generated cards carry the level they were generated at; base
          // alphabet cards fall back to the learner-context prop.
          cefrLevel: letter?.cefrLevel || cefrLevel,
          questionWorth: assessedWorth,
          gradedOutcome: false,
          // The letter/sound card id, not a generic label — lets a routed
          // repair deep-seed the deck with this exact card instead of a
          // random one (see the repair-focus deck reorder on mount).
          sourceContext: { card: { id: letter?.id || "", letter: letter?.letter || "", tts: letter?.tts || "", phoneme: letter?.phoneme || "", practiceWord, practiceWordMeaning: practiceWordMeaningData || {} } },
        });
      }

      const focused = letter.isGoal ? currentGoalFocus("alphabet") : letter.isRepair ? currentRepairFocus() : null;
      if (letter.isGoal || letter.isRepair) {
        if (!focused || focused.targetLang !== targetLang || focused.npub !== npub) return;
        const artifact = await savePracticeOutcome(focused, "phonics", letter, isYes, "modeled");
        if (isYes) {
          playSound("correct"); setCorrectCount(c => c + 1);
          await awardXp(npub, xp, targetLang, letter.isGoal ? "goalPhonics" : "repairPhonics");
          const required = letter.isGoal
            ? artifact?.cards?.slice(0, 2) || []
            : artifact?.cards?.filter(
                (card) =>
                  card.practiceRole === "original" ||
                  card.practiceRole === "transfer",
              ) || [];
          if (required.length && required.every(c => artifact.outcomes[c.id]?.success)) {
            const observation = required.map(c => `${c.practiceRole}: ${artifact.outcomes[c.id].item} pronounced successfully after a model`).join("; ");
            if (letter.isGoal) await recordGoalAttempt(focused, { success: true, support: "modeled", observation, domain: "pronunciation" });
            else await completeRepairFocus({ success: true, support: "modeled", observation });
          }
        }
        return;
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
      }

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

    // Reload the fixed practice word if a collected card has no word state.
    if (!practiceWord && !isGeneratingWord) {
      setIsGeneratingWord(true);
      try {
        const generated = await getAuthoredPracticeWord("");
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
          );
        }
      } catch (error) {
        console.error("Failed to load authored practice word:", error);
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
    } catch { /* Audio may already have been released. */ }
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

      detachCompletionWatcher = watchPhonicsPlaybackCompletion(
        player,
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

  const handleNext = async () => {
    playSound(nextButtonSound);

    // If this card is an active deck card being cleared, advance the deck
    if (onCardCollected) {
      if (!collectedThisMountRef.current) {
        collectedThisMountRef.current = true;
        onCardCollected(letter.id);
        if (npub && !letter.isGoal && !letter.isRepair) {
          void recordPlateActivity(npub, "phonics", targetLang);
        }
      }
      return;
    }

    // Repeat the authored card from the collection.
    await handleNextWord();
  };

  const handleNextWord = async () => {
    playSound(nextButtonSound);
    const generated = await getAuthoredPracticeWord(practiceWord);
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
    );
    setShowResult(false);
    setIsCorrect(false);
  };

  const getAuthoredPracticeWord = useCallback(async () => ({
    word: letter.practiceWord, meaning: letter.practiceWordMeaning,
  }), [letter.practiceWord, letter.practiceWordMeaning]);

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
      sx={{ perspective: "1000px" }}
    >
      <PhonicsCardStack count={stackCount}>
      <MotionBox
        w="100%"
        h="100%"
        display="grid"
        gridTemplateColumns="minmax(0, 1fr)"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Front Side - Letter Info */}
        <VStack
          gridArea="1 / 1"
          w="100%"
          minW={0}
          h="100%"
          align="center"
          justify="center"
          spacing={4}
          bg={APP_SURFACE_ELEVATED}
          border="1px solid"
          borderColor={APP_BORDER}
          borderRadius="48px"
          style={APP_SQUIRCLE_STYLE}
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
            <Badge
              colorScheme={typeColor}
              borderRadius="md"
              px={2}
              py={1}
              style={APP_SQUIRCLE_STYLE}
            >
              {typeLabel}
            </Badge>
            <HStack spacing={2}>
              <>
                {!useDock && (
                  <Button
                    size="sm"
                    background="transparent"
                    border="1px solid"
                    borderColor={APP_BORDER_STRONG}
                    boxShadow="0px 2px 0px rgba(148, 163, 184, 0.35)"
                    color={APP_TEXT_PRIMARY}
                    leftIcon={
                      onCardCollected && correctCount > 0 ? undefined : (
                        <RiMicLine size={12} />
                      )
                    }
                    onClick={
                      onCardCollected && correctCount > 0
                        ? handleNext
                        : handlePracticeClick
                    }
                    isLoading={isGeneratingWord}
                    fontSize="xs"
                    _hover={{ bg: APP_SURFACE_MUTED }}
                  >
                    {onCardCollected && correctCount > 0
                      ? uiText(uiLang, "next")
                      : uiText(uiLang, "practice")}
                  </Button>
                )}
              </>
            </HStack>
          </HStack>

          <VStack spacing={3} align="center" textAlign="center" w="100%">
            <Flex align="center" justify="center" w="100%" gap={3} minH="48px">
              <VStack spacing={1} align="center" minW={0}>
                <Text fontSize="2xl" fontWeight="bold" overflowWrap="anywhere">
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
                  flexShrink={0}
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
          minW={0}
          h="100%"
          align="center"
          justify="center"
          spacing={3}
          bg={APP_SURFACE_ELEVATED}
          border="1px solid"
          borderColor={APP_BORDER_STRONG}
          borderRadius="48px"
          style={APP_SQUIRCLE_STYLE}
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
            <HStack spacing={2} align="center" justify="center" w="full">
              <Text fontSize="2xl" fontWeight="black" color={APP_TEXT_PRIMARY} minW={0} overflowWrap="anywhere" textAlign="center">
                {highlightedPracticeWord.map((part, index) => (
                  <Text
                    key={`${part.text}-${index}`}
                    as="span"
                    overflowWrap="anywhere"
                    color={part.highlight ? "green.500" : APP_TEXT_PRIMARY}
                  >
                    {part.text}
                  </Text>
                ))}
              </Text>
              <IconButton
                aria-label={uiText(uiLang, "playWord")}
                flexShrink={0}
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
                variant="tutor"
                state="thinking"
                size={52}
                force3D
                showShadow={false}
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
                  <>
                    {!useDock && (
                      <Button
                        size="xs"
                        colorScheme="green"
                        onClick={handleNext}
                        _hover={{ bg: "green.400" }}
                      >
                        {onCardCollected ? uiText(uiLang, "next") : PHONICS_CONTROLS[uiLang].repeat}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {!useDock && (
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
                  </>
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
              <>
                {!useDock && (
                  <Button
                    size="md"
                    colorScheme={isConnecting ? "yellow" : "teal"}
                    leftIcon={
                      isConnecting ? (
                        <Spinner size="xs" />
                      ) : !isRecording ? (
                        <FaMicrophone />
                      ) : undefined
                    }
                    onClick={handleRecord}
                    isDisabled={!supportsSpeech || isConnecting || isEvaluating}
                    isLoading={isEvaluating}
                    _hover={{
                      transform: "scale(1.02)",
                    }}
                  >
                    {isConnecting ? (
                      uiText(uiLang, "connecting")
                    ) : isRecording ? (
                      <VoiceWaveIcon stream={stream} size={18} color="currentColor" />
                    ) : (
                      uiText(uiLang, "record")
                    )}
                  </Button>
                )}
              </>
            </VStack>
          )}
        </VStack>
      </MotionBox>
      </PhonicsCardStack>

      {useDock && (
        <QuestionActionArea
          feedback={showResult ? isCorrect : null}
          actions={
            <ActivityActionRow
              tone={
                showResult && isCorrect
                  ? "success"
                  : isPracticeMode && !showResult
                  ? "speak"
                  : "primary"
              }
              primary={
                <Button
                  key={isPracticeMode && isRecording ? "listening" : "record"}
                  colorScheme="teal"
                  isLoading={isGeneratingWord || isGrading || isConnecting || isEvaluating}
                  isDisabled={
                    isGeneratingWord ||
                    isGrading ||
                    isConnecting ||
                    isEvaluating ||
                    (isPracticeMode && !supportsSpeech)
                  }
                  leftIcon={
                    isPracticeMode && !showResult && !isRecording ? (
                      <FaMicrophone />
                    ) : undefined
                  }
                  onClick={
                    !isPracticeMode
                      ? onCardCollected && correctCount > 0
                        ? handleNext
                        : handlePracticeClick
                      : showResult
                      ? isCorrect
                        ? handleNext
                        : handleTryAgain
                      : handleRecord
                  }
                >
                  {!isPracticeMode
                    ? onCardCollected && correctCount > 0
                      ? uiText(uiLang, "next")
                      : uiText(uiLang, "practice")
                    : showResult
                    ? isCorrect
                      ? (onCardCollected ? uiText(uiLang, "next") : PHONICS_CONTROLS[uiLang].repeat)
                      : uiText(uiLang, "tryAgain")
                    : isRecording ? (
                        <VoiceWaveIcon stream={stream} size={20} color="currentColor" />
                      ) : (
                        uiText(uiLang, "record")
                      )}
                </Button>
              }
            >
              {isPracticeMode ? (
                <Button variant="ghost" onClick={handleFlipBack}>
                  {uiText(uiLang, "back")}
                </Button>
              ) : onCardCollected && correctCount > 0 ? (
                <Button variant="ghost" onClick={handlePracticeClick}>
                  {uiText(uiLang, "practice")}
                </Button>
              ) : null}
            </ActivityActionRow>
          }
        >
          {showResult && (
            <Box
              role="status"
              px={1} py={2}
            >
              <Text fontWeight="bold">
                {isCorrect ? "✓" : "✖"}{" "}
                {isCorrect
                  ? uiText(uiLang, "correct")
                  : uiText(uiLang, "tryAgain")}
              </Text>
            </Box>
          )}
        </QuestionActionArea>
      )}
    </Box>
  );
}

export default function AlphabetBootcamp({
  appLanguage = "en",
  targetLang,
  npub,
  cefrLevel = "Pre-A1",
  placementLevel = null,
  onFocusedPracticeUnavailable,
  pauseMs = 2000,
}) {
  const uiLang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const isLightTheme = useThemeStore((s) => s.themeMode) === "light";
  const playSound = useSoundSettings((s) => s.playSound);
  const accountScope = [npub || "guest", targetLang].join(":");
  const [courseProgressState, setCourseProgressState] = useState({ scope: null, counts: {} });
  const courseCounts = courseProgressState.scope === accountScope ? courseProgressState.counts : {};
  const curriculumCards = useMemo(() => PHONICS_LEVELS.flatMap(level => getAuthoredPhonicsDeck(targetLang, uiLang, level)), [targetLang, uiLang]);
  const courseProgress = getPhonicsCourseProgress({ cards: curriculumCards, counts: courseCounts, placementLevel, courseLevel: cefrLevel });
  const initialLevel = courseProgress.entryLevel;
  const scope = [accountScope, initialLevel].join(":");
  const [levelSelection, setLevelSelection] = useState(null);
  const masterUnlocked = isMasterUnlockActive(npub);
  const activeLevel = resolvePhonicsLevel(levelSelection?.scope === scope ? levelSelection.level : courseProgress.unlockedLevel, courseProgress.unlockedLevel, masterUnlocked);
  const alphabet = useMemo(() => getAuthoredPhonicsDeck(targetLang, uiLang, activeLevel), [targetLang, uiLang, activeLevel]);
  const knownCountsRef = useRef({ scope: null, counts: {} });
  const rememberCourseCounts = useCallback((counts) => {
    const known = knownCountsRef.current.scope === accountScope ? knownCountsRef.current.counts : {};
    for (const [id, count] of Object.entries(counts)) known[id] = Math.max(known[id] || 0, count);
    knownCountsRef.current = { scope: accountScope, counts: known };
    setCourseProgressState(previous => {
      const merged = previous.scope === accountScope ? { ...previous.counts } : {};
      for (const [id, count] of Object.entries(counts)) merged[id] = Math.max(merged[id] || 0, count);
      return { scope: accountScope, counts: merged };
    });
  }, [accountScope]);
  const handleLevelChange = useCallback((level) => {
    if (!canAccessPhonicsLevel(level, courseProgress.unlockedLevel, masterUnlocked)) return;
    playSound(selectSound);
    setLevelSelection({ scope, level });
  }, [courseProgress.unlockedLevel, masterUnlocked, scope, playSound]);
  const controls = PHONICS_CONTROLS[uiLang];
  const repairFocus = useRepairFocusStore(s => s.focus);
  const goalFocus = useGoalFocusStore(s => s.focus);
  const activeGoal = goalFocus ? currentGoalFocus("alphabet") : null;
  const focusedPractice = (activeGoal?.targetLang === targetLang && activeGoal?.npub === npub ? activeGoal : null) || (repairFocus?.surface === "alphabet" && repairFocus.targetLang === targetLang && repairFocus.npub === npub ? repairFocus : null);
  const playerRef = useRef(null);
  const playbackRequestRef = useRef(0);
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const localCompletionRef = useRef({});
  const completionScopeRef = useRef(null);
  const [savedCorrectCounts, setSavedCorrectCounts] = useState({});

  // Deck-based state
  const [deck, setDeck] = useState([]);
  const [collectedLetters, setCollectedLetters] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [generatedState, setGeneratedState] = useState({ scope: null, cards: [] });
  const generationScope = [accountScope, uiLang, activeLevel].join(":");
  const generatedCards = useMemo(() => generatedState.scope === generationScope ? generatedState.cards : [], [generatedState, generationScope]);
  const generatedRecordsRef = useRef({ scope: null, records: [] });
  const generationScopeRef = useRef(generationScope);
  generationScopeRef.current = generationScope;
  const generationRequestRef = useRef(0);
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const toast = useToast();
  useEffect(() => {
    setIsGeneratingDeck(false);
    return () => { generationRequestRef.current += 1; };
  }, [generationScope]);
  const handleNextLevel = useCallback(() => {
    const index = PHONICS_LEVELS.indexOf(activeLevel);
    if (index < PHONICS_LEVELS.length - 1) {
      handleLevelChange(PHONICS_LEVELS[index + 1]);
    }
  }, [activeLevel, handleLevelChange]);

  const handleNewRound = useCallback(async () => {
    if (isGeneratingDeck || !isInitialized || focusedPractice || deck.length || collectedLetters.length < alphabet.length) return;
    const request = ++generationRequestRef.current;
    playSound(selectSound);
    setIsGeneratingDeck(true);
    try {
      const savedRounds = generatedRecordsRef.current.scope === accountScope ? generatedRecordsRef.current.records : [];
      const newCards = await generateSupplementalPhonicsDeck({
        target: targetLang, support: uiLang, level: activeLevel,
        batchId: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        existingWords: [...new Set([
          ...[...curriculumCards, ...generatedCards].map(card => card.practiceWord),
          ...savedRounds.map(record => record.currentWord).filter(word => typeof word === "string" && word.trim()),
        ])],
      });
      if (request !== generationRequestRef.current || generationScopeRef.current !== generationScope) return;
      await saveSupplementalPhonicsDeck(npub, newCards);
      if (request !== generationRequestRef.current || generationScopeRef.current !== generationScope) return;
      const records = generatedRecordsRef.current.scope === accountScope ? generatedRecordsRef.current.records : [];
      generatedRecordsRef.current = { scope: accountScope, records: [...records, ...newCards.map(supplementalPhonicsRecord)] };
      setGeneratedState({ scope: generationScope, cards: [...generatedCards, ...newCards] });
      setDeck(newCards);
    } catch (error) {
      console.warn("New phonics deck unavailable:", error);
      if (request === generationRequestRef.current && generationScopeRef.current === generationScope) toast({ title: uiText(uiLang, "generateDeckError"), status: "error", duration: 4000 });
    } finally {
      if (request === generationRequestRef.current) setIsGeneratingDeck(false);
    }
  }, [isGeneratingDeck, isInitialized, focusedPractice, deck.length, collectedLetters.length, alphabet.length, playSound, targetLang, uiLang, activeLevel, curriculumCards, generatedCards, generationScope, accountScope, npub, toast]);

  const targetLanguage = getLanguageName(targetLang, uiLang);
  const headline = uiText(uiLang, "alphabetHeadline", {
    language: targetLanguage,
  });
  const subhead = controls.subhead;
  const hasLetters = Array.isArray(alphabet) && alphabet.length;
  // One selected, explicitly authored collection.
  const totalCards = focusedPractice ? deck.length + collectedLetters.length : alphabet.length + generatedCards.length;
  const displayCompleted = [...alphabet, ...generatedCards].filter(card => Number.isSafeInteger(courseCounts[card.id]) && courseCounts[card.id] > 0).length;
  const displayPercentage = totalCards ? Math.round(displayCompleted / totalCards * 100) : 0;
  const isComplete =
    hasLetters &&
    isInitialized &&
    deck.length === 0 &&
    totalCards > 0 &&
    collectedLetters.length >= totalCards;

  useEffect(() => {
    if (!npub || !isInitialized || focusedPractice) return;
    let observedRecords = [];
    const observer = createPhonicsCompletionObserver({ language: targetLang, baseCards: curriculumCards,
      onProgress: proof => {
        void awardProgressionAchievements({ npub, source: "nosabos", ...proof, events: [...proof.events, ...supplementalPhonicsEvents(targetLang, observedRecords)] })
          .catch(error => console.warn("Phonics achievements:", error));
      },
    });
    const stop = onSnapshot(
      query(collection(database, "users", npub, "alphabetPractice"), where("targetLang", "==", targetLang)),
      { includeMetadataChanges: true }, snapshot => {
        observedRecords = snapshot.docs.map(document => document.data());
        rememberCourseCounts(partitionPhonicsProgress(curriculumCards, observedRecords).counts);
        observer.receive(snapshot);
      },
      error => console.warn("Phonics achievements:", error),
    );
    return () => { observer.dispose(); stop(); };
  }, [npub, targetLang, isInitialized, focusedPractice, curriculumCards, rememberCourseCounts]);

  // When a card is successfully practiced, move it from deck to collection
  const handleCardCollected = useCallback((letterId) => {
    setLevelSelection(previous => previous?.scope === scope ? previous : { scope, level: activeLevel });
    localCompletionRef.current[letterId] = 1;
    rememberCourseCounts({ [letterId]: 1 });
    setDeck((prevDeck) => {
      const cardIndex = prevDeck.findIndex((l) => l.id === letterId);
      if (cardIndex === -1) return prevDeck; // Already removed

      const card = prevDeck[cardIndex];
      // Add to collection
      setCollectedLetters((prev) => prev.some(item => item.id === card.id) ? prev : [...prev, card]);

      // Remove from deck
      return prevDeck.filter((l) => l.id !== letterId);
    });

    // Update saved correct counts (they just got their first correct)
    setSavedCorrectCounts((prev) => ({
      ...prev,
      [letterId]: (prev[letterId] || 0) + 1,
    }));
  }, [rememberCourseCounts, scope, activeLevel]);

  const stopLetterPlayback = useCallback(() => {
    playbackRequestRef.current += 1;
    try {
      playerRef.current?.audio?.pause?.();
    } catch { /* Audio may already have been released. */ }
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

      stopLetterPlayback();
      const requestId = playbackRequestRef.current;
      setLoadingId(data.id);

      try {
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
        detachCompletionWatcher = watchPhonicsPlaybackCompletion(
          player,
          finishPlayback,
        );

        setLoadingId(null);
        setPlayingId(data.id);
        await audio.play();
      } catch (err) {
        if (requestId !== playbackRequestRef.current) return;
        console.error("AlphabetBootcamp TTS failed", err);
        stopLetterPlayback();
      }
    },
    [loadingId, playingId, stopLetterPlayback, targetLang],
  );

  useEffect(() => {
    const completionScope = [npub || "guest", targetLang].join(":");
    if (completionScopeRef.current !== completionScope) {
      completionScopeRef.current = completionScope;
      localCompletionRef.current = {};
    }
    setSavedCorrectCounts({});
    setDeck([]);
    setCollectedLetters([]);
    setIsInitialized(false);
    let cancelled = false;
    const apply = (cards, documents, initializeLevel = true) => {
      if (cancelled) return;
      const known = knownCountsRef.current.scope === accountScope ? knownCountsRef.current.counts : {};
      const optimistic = Object.entries({ ...known, ...localCompletionRef.current }).map(([letterId, correctCount]) => ({ letterId, correctCount, targetLang }));
      const cachedRecords = generatedRecordsRef.current.scope === accountScope ? generatedRecordsRef.current.records : [];
      const records = [...documents, ...cachedRecords];
      const extras = restoreSupplementalPhonics(targetLang, uiLang, activeLevel, records);
      generatedRecordsRef.current = { scope: accountScope, records: [...new Map(records.filter(record => record.generated === true).map(record => [record.letterId, record])).values()] };
      setGeneratedState({ scope: generationScope, cards: extras });
      const progress = partitionPhonicsProgress([...cards, ...extras], [...records, ...optimistic]);
      setSavedCorrectCounts(progress.counts);
      rememberCourseCounts(progress.counts);
      const loadedCourse = getPhonicsCourseProgress({ cards: curriculumCards, counts: progress.counts, placementLevel, courseLevel: cefrLevel });
      if (initializeLevel) setLevelSelection(previous => previous?.scope === scope ? previous : { scope, level: loadedCourse.unlockedLevel });
      setDeck(progress.remaining);
      setCollectedLetters(progress.collected);
      setIsInitialized(true);
    };
    // Never substitute ordinary cards for a focused objective while its
    // captured outcomes load. Ordinary authored cards remain usable offline.
    const fallback = focusedPractice ? null : setTimeout(() => apply(alphabet, [], false), 2500);
    const load = async () => {
      try {
        if (focusedPractice) {
          const artifact = await getFocusedPhonicsDeck(focusedPractice, alphabet);
          if (cancelled) return;
          clearTimeout(fallback);
          if (artifact.requiresTutor) {
            onFocusedPracticeUnavailable?.(focusedPractice);
            return;
          }
          setDeck(artifact.cards.filter(card => !artifact.outcomes[card.id]?.success));
          setCollectedLetters(artifact.cards.filter(card => artifact.outcomes[card.id]?.success));
          setIsInitialized(true);
          return;
        }
        if (!npub) { clearTimeout(fallback); apply(alphabet, []); return; }
        const snapshot = await getDocs(query(collection(database, "users", npub, "alphabetPractice"), where("targetLang", "==", targetLang)));
        clearTimeout(fallback);
        apply(alphabet, snapshot.docs.map(item => item.data()));
      } catch (error) {
        console.warn("Phonics progress unavailable:", error);
        clearTimeout(fallback);
        if (focusedPractice) onFocusedPracticeUnavailable?.(focusedPractice);
        else apply(alphabet, []);
      }
    };
    void load();
    return () => { cancelled = true; clearTimeout(fallback); };
  }, [npub, targetLang, alphabet, focusedPractice, onFocusedPracticeUnavailable, curriculumCards, placementLevel, cefrLevel, scope, rememberCourseCounts, accountScope, generationScope, uiLang, activeLevel]);

  useEffect(() => {
    return () => {
      stopLetterPlayback();
    };
  }, [stopLetterPlayback]);

  return (
    <VStack
      align="stretch"
      spacing={4}
      w="100%"
      color={APP_TEXT_PRIMARY}
      px={6}
      pt={{ base: 5, md: 6 }}
    >
      {focusedPractice ? (
        <>
          <Heading size="md" color={APP_TEXT_PRIMARY} zIndex={10} textAlign="center">{headline}</Heading>
          <Text color={APP_TEXT_SECONDARY} zIndex={10} textAlign="center" mt="-4" fontSize="sm">{subhead}</Text>
        </>
      ) : (
        <Box w="100%" zIndex={10}>
          <CEFRLevelNavigator currentLevel={courseProgress.unlockedLevel} activeCEFRLevel={activeLevel}
            onLevelChange={handleLevelChange} levelProgress={courseProgress.levels[activeLevel].percentage}
            supportLang={uiLang} levelCompletionStatus={courseProgress.levels} masterUnlocked={masterUnlocked} showCompletionBadge={false} />
          <CourseProgressHeader activeLevel={activeLevel}
            progressCount={{ completed: displayCompleted, total: totalCards, label: uiText(uiLang, "progress") }}
            showLevelProgress={false} progressStart="#fbbf24" progressEnd="#f59e0b"
            percentage={displayPercentage} supportLang={uiLang} />
        </Box>
      )}

      {!isInitialized ? (
        <Flex align="center" justify="center" py={12}>
          <VoiceOrb
            variant="tutor"
            state="thinking"
            size={52}
            force3D
            showShadow={false}
          />
        </Flex>
      ) : hasLetters ? (
        <VStack spacing={8} w="100%" zIndex={10}>
          {/* Deck Section */}
          {deck.length > 0 ? (
            <VStack spacing={4} w="100%">
              {/* Progress bar showing completion */}
              {focusedPractice && <Box w="100%" maxW="400px" mx="auto">
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
              </Box>}

              {/* The card owns its stack so action-dock spacing cannot detach it. */}
              <Box position="relative" w="100%" maxW="400px" mx="auto">
                {/* Top card (current card to practice) */}
                <Box position="relative" zIndex={20}>
                  <LetterCard
                    playSound={playSound}
                    key={`${deck[0].id}:${uiLang}:${npub || "guest"}`}
                    dockActions
                    stackCount={deck.length}
                    letter={deck[0]}
                    appLanguage={appLanguage}
                    targetLang={targetLang}
                    npub={npub}
                    cefrLevel={activeLevel}
                    pauseMs={pauseMs}
                    initialPracticeWord={
                      deck[0].practiceWord
                    }
                    initialPracticeWordMeaning={
                      deck[0].practiceWordMeaning
                    }
                    initialCorrectCount={savedCorrectCounts[deck[0].id] || 0}
                    onCardCollected={handleCardCollected}
                    isPlaying={playingId === deck[0].id}
                    isLoading={loadingId === deck[0].id}
                    onPlay={handlePlayLetterAudio}
                  />
                </Box>

              </Box>
            </VStack>
          ) : (
            <VStack spacing={4} w="100%" maxW="400px" mx="auto">
              <Flex
                align="center"
                justify="center"
                bg={isLightTheme ? "green.50" : "green.900"}
                borderRadius="lg"
                style={APP_SQUIRCLE_STYLE}
                border="1px solid"
                borderColor={isLightTheme ? "green.300" : "green.500"}
                p={6}
                w="100%"
              >
                <VStack spacing={4} w="100%">
                  <RandomCharacter notSoRandomCharacter="30" />
                  <Text
                    color={isLightTheme ? "green.700" : "green.200"}
                    fontWeight="bold"
                    textAlign="center"
                  >
                    {controls.complete}
                  </Text>
                </VStack>
              </Flex>
              {isComplete && !focusedPractice && (
                <VStack spacing={3} w="full">
                  <Button w="full" variant="outline" colorScheme="teal" size="lg"
                    leftIcon={<RiRefreshLine />} onClick={handleNewRound} isLoading={isGeneratingDeck}
                    spinner={<VoiceOrb variant="tutor" state="thinking" size={32} force3D showShadow={false} />}>
                    {uiText(uiLang, "newRound")}
                  </Button>
                  {activeLevel !== "C2" && <Button variant="ghost" onClick={handleNextLevel} isDisabled={isGeneratingDeck}>{controls.next}</Button>}
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
                    key={`${item.id}:${uiLang}:${npub || "guest"}`}
                    playSound={playSound}
                    letter={item}
                    appLanguage={appLanguage}
                    targetLang={targetLang}
                    npub={npub}
                    cefrLevel={activeLevel}
                    pauseMs={pauseMs}
                    initialPracticeWord={
                      item.practiceWord
                    }
                    initialPracticeWordMeaning={
                      item.practiceWordMeaning
                    }
                    initialCorrectCount={savedCorrectCounts[item.id] || 0}
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
          style={APP_SQUIRCLE_STYLE}
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
