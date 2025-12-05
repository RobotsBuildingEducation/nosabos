// components/LessonGroupQuiz.jsx
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Badge,
  Button,
  Flex,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
  CheckboxGroup,
  Tooltip,
  IconButton,
  useToast,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { database, simplemodel } from "../firebaseResources/firebaseResources";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { WaveBar } from "./WaveBar";
import { PasscodePage } from "./PasscodePage";
import { FiCopy } from "react-icons/fi";
import { PiSpeakerHighDuotone } from "react-icons/pi";
import { awardXp } from "../utils/utils";
import { completeLesson } from "../utils/progressTracking";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import {
  TTS_LANG_TAG,
  fetchTTSBlob,
} from "../utils/tts";
import { doc, onSnapshot } from "firebase/firestore";
import { extractCEFRLevel, getCEFRPromptHint } from "../utils/cefrUtils";

/* ---------------------------
   Streaming helpers (Gemini)
--------------------------- */
function textFromChunk(chunk) {
  try {
    if (!chunk) return "";
    if (typeof chunk.text === "function") return chunk.text() || "";
    if (typeof chunk.text === "string") return chunk.text;
    const cand = chunk.candidates?.[0];
    if (cand?.content?.parts?.length) {
      return cand.content.parts.map((p) => p.text || "").join("");
    }
  } catch {}
  return "";
}

function tryConsumeLine(line, cb) {
  const s = line.indexOf("{");
  const e = line.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return;
  try {
    const obj = JSON.parse(line.slice(s, e + 1));
    cb?.(obj);
  } catch {}
}

function countBlanks(text = "") {
  return (text.match(/___/g) || []).length;
}

function stableHash(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

function shouldUseDragVariant(question, choices = [], answers = []) {
  if (!question || !choices.length) return false;
  const seed = stableHash(
    question + JSON.stringify(choices) + JSON.stringify(answers)
  );
  return seed % 2 === 0;
}

/* ---------------------------
   Language name helper
--------------------------- */
function LANG_NAME(code) {
  const map = {
    en: "English",
    es: "Spanish",
    nah: "Nahuatl",
    pt: "Portuguese",
    fr: "French",
    it: "Italian",
  };
  return map[code] || code;
}

function resolveSupportLang(support, appUILang) {
  if (!support || support === "auto") return appUILang === "es" ? "es" : "en";
  return ["en", "es", "pt", "fr", "it", "nah"].includes(support)
    ? support
    : "en";
}

function quizDifficulty(cefrLevel) {
  // Use CEFR level instead of XP for more accurate difficulty
  return getCEFRPromptHint(cefrLevel);
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------------------------
   Main Component
--------------------------- */
export default function LessonGroupQuiz({
  userLanguage = "en",
  lessonContent = null,
  lessonId = null,
  xpReward = 50,
  onComplete = null,
}) {
  const toast = useToast();

  // Extract CEFR level from lesson ID
  const cefrLevel = lessonId ? extractCEFRLevel(lessonId) : "A1";

  // User state from Firestore
  const [npub, setNpub] = useState("");
  const [targetLang, setTargetLang] = useState("es");
  const [supportLang, setSupportLang] = useState("auto");
  const [showTranslations, setShowTranslations] = useState(true);
  const [xp, setXp] = useState(0);

  // Subscribe to user progress
  useEffect(() => {
    const storedNpub = localStorage.getItem("local_npub");
    if (!storedNpub) return;

    setNpub(storedNpub);
    const ref = doc(database, "users", storedNpub);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const prog = data.progress || {};
      const tLang = ["nah", "es", "pt", "en", "fr", "it"].includes(
        prog.targetLang
      )
        ? prog.targetLang
        : "es";
      const sLang = prog.supportLang || "auto";
      const showTr = prog.showTranslations !== false;
      const langXp = prog.languageXp?.[tLang] || prog.totalXp || 0;

      setTargetLang(tLang);
      setSupportLang(sLang);
      setShowTranslations(showTr);
      setXp(langXp);
    });
    return () => unsub();
  }, []);

  const supportCode = resolveSupportLang(supportLang, userLanguage);
  const diff = quizDifficulty(cefrLevel);

  // Quiz tracking
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const TOTAL_QUESTIONS = 10;
  const PASS_SCORE = 8;

  // Question mode
  const [mode, setMode] = useState("fill");
  const [lastOk, setLastOk] = useState(null);
  const [recentXp, setRecentXp] = useState(0);
  const [nextAction, setNextAction] = useState(null);

  // Fill state
  const [qFill, setQFill] = useState("");
  const [hFill, setHFill] = useState("");
  const [trFill, setTrFill] = useState("");
  const [ansFill, setAnsFill] = useState("");
  const [loadingQFill, setLoadingQFill] = useState(false);
  const [loadingGFill, setLoadingGFill] = useState(false);

  // MC state
  const [qMC, setQMC] = useState("");
  const [hMC, setHMC] = useState("");
  const [choicesMC, setChoicesMC] = useState([]);
  const [answerMC, setAnswerMC] = useState("");
  const [trMC, setTrMC] = useState("");
  const [pickMC, setPickMC] = useState("");
  const [mcLayout, setMcLayout] = useState("buttons");
  const [mcBankOrder, setMcBankOrder] = useState([]);
  const [mcSlotIndex, setMcSlotIndex] = useState(null);
  const [loadingQMC, setLoadingQMC] = useState(false);
  const [loadingGMC, setLoadingGMC] = useState(false);

  // MA state
  const [qMA, setQMA] = useState("");
  const [hMA, setHMA] = useState("");
  const [choicesMA, setChoicesMA] = useState([]);
  const [answersMA, setAnswersMA] = useState([]);
  const [trMA, setTrMA] = useState("");
  const [picksMA, setPicksMA] = useState([]);
  const [maLayout, setMaLayout] = useState("buttons");
  const [maSlots, setMaSlots] = useState([]);
  const [maBankOrder, setMaBankOrder] = useState([]);
  const [loadingQMA, setLoadingQMA] = useState(false);
  const [loadingGMA, setLoadingGMA] = useState(false);

  // Speak state
  const [sPrompt, setSPrompt] = useState("");
  const [sTarget, setSTarget] = useState("");
  const [sStimulus, setSStimulus] = useState("");
  const [sVariant, setSVariant] = useState("repeat");
  const [sHint, setSHint] = useState("");
  const [sTranslation, setSTranslation] = useState("");
  const [sRecognized, setSRecognized] = useState("");
  const [sEval, setSEval] = useState(null);
  const [loadingQSpeak, setLoadingQSpeak] = useState(false);
  const speakAudioRef = useRef(null);
  const [isSpeakPlaying, setIsSpeakPlaying] = useState(false);

  // Match state
  const [mStem, setMStem] = useState("");
  const [mHint, setMHint] = useState("");
  const [mLeft, setMLeft] = useState([]);
  const [mRight, setMRight] = useState([]);
  const [mSlots, setMSlots] = useState([]);
  const [mBank, setMBank] = useState([]);
  const [loadingMG, setLoadingMG] = useState(false);
  const [loadingMJ, setLoadingMJ] = useState(false);

  // Speech hook
  const {
    isListening,
    transcript,
    confidence,
    startListening,
    stopListening,
    speechSupported,
  } = useSpeechPractice(targetLang);

  /* ---------------------------
     PROMPT BUILDERS (Quiz versions)
  --------------------------- */
  function buildQuizFillPrompt() {
    const TARGET = LANG_NAME(targetLang);
    const SUPPORT = LANG_NAME(supportCode);
    const wantTR = showTranslations && supportCode !== targetLang;

    let topicDirective = "- Create contextually appropriate quiz questions.";
    if (lessonContent && Array.isArray(lessonContent)) {
      const allWords = [];
      const allTopics = [];
      lessonContent.forEach((content) => {
        if (content?.words) allWords.push(...content.words);
        if (content?.topic) allTopics.push(content.topic);
      });
      if (allWords.length > 0) {
        topicDirective = `- CONTEXT: Draw from this vocabulary pool: ${JSON.stringify(
          [...new Set(allWords)]
        )}. Use these words or related concepts.`;
      } else if (allTopics.length > 0) {
        topicDirective = `- CONTEXT: Questions should relate to these topics: ${allTopics.join(
          ", "
        )}.`;
      }
    }

    return [
      `Create ONE short ${TARGET} sentence with a single blank "___" for a unit quiz. Difficulty: ${diff}`,
      `- ≤ 120 chars; natural context that cues the target word.`,
      topicDirective,
      `- Hint in ${SUPPORT} (≤ 8 words).`,
      wantTR
        ? `- ${SUPPORT} translation of the full sentence.`
        : `- Empty translation "".`,
      "",
      "Stream as NDJSON in phases:",
      `{"type":"vocab_fill","phase":"q","question":"<sentence with ___ in ${TARGET}>"}`,
      `{"type":"vocab_fill","phase":"meta","hint":"<${SUPPORT} hint>","translation":"<${SUPPORT} translation or empty>"}`,
      `{"type":"done"}`,
    ].join("\n");
  }

  function buildQuizMCPrompt() {
    const TARGET = LANG_NAME(targetLang);
    const SUPPORT = LANG_NAME(supportCode);
    const wantTR = showTranslations && supportCode !== targetLang;

    let topicDirective = "- Create contextually appropriate quiz questions.";
    if (lessonContent && Array.isArray(lessonContent)) {
      const allWords = [];
      const allTopics = [];
      lessonContent.forEach((content) => {
        if (content?.words) allWords.push(...content.words);
        if (content?.topic) allTopics.push(content.topic);
      });
      if (allWords.length > 0) {
        topicDirective = `- CONTEXT: Draw from this vocabulary pool: ${JSON.stringify(
          [...new Set(allWords)]
        )}. Use these words or related concepts.`;
      } else if (allTopics.length > 0) {
        topicDirective = `- CONTEXT: Questions should relate to these topics: ${allTopics.join(
          ", "
        )}.`;
      }
    }

    return [
      `Create ONE ${TARGET} multiple-choice question for a unit quiz (exactly one correct). Difficulty: ${diff}`,
      `- Stem ≤120 chars with a blank "___" in a natural sentence.`,
      `- 4 distinct word choices in ${TARGET}.`,
      `- Hint in ${SUPPORT} (≤8 words).`,
      wantTR ? `- ${SUPPORT} translation of stem.` : `- Empty translation "".`,
      topicDirective,
      "",
      "Stream as NDJSON:",
      `{"type":"vocab_mc","phase":"q","question":"<stem in ${TARGET}>"}`,
      `{"type":"vocab_mc","phase":"choices","choices":["<choice1>","<choice2>","<choice3>","<choice4>"]}`,
      `{"type":"vocab_mc","phase":"meta","hint":"<${SUPPORT} hint>","answer":"<exact correct choice text>","translation":"<${SUPPORT} translation or empty>"}`,
      `{"type":"done"}`,
    ].join("\n");
  }

  function buildQuizMAPrompt() {
    const TARGET = LANG_NAME(targetLang);
    const SUPPORT = LANG_NAME(supportCode);
    const wantTR = showTranslations && supportCode !== targetLang;

    let topicDirective = "- Create contextually appropriate quiz questions.";
    if (lessonContent && Array.isArray(lessonContent)) {
      const allWords = [];
      const allTopics = [];
      lessonContent.forEach((content) => {
        if (content?.words) allWords.push(...content.words);
        if (content?.topic) allTopics.push(content.topic);
      });
      if (allWords.length > 0) {
        topicDirective = `- CONTEXT: Draw from this vocabulary pool: ${JSON.stringify(
          [...new Set(allWords)]
        )}. Use these words or related concepts.`;
      } else if (allTopics.length > 0) {
        topicDirective = `- CONTEXT: Questions should relate to these topics: ${allTopics.join(
          ", "
        )}.`;
      }
    }

    return [
      `Create ONE ${TARGET} multiple-answer question for a unit quiz (EXACTLY 2 or 3 correct). Difficulty: ${diff}`,
      `- Stem ≤120 chars with at least one blank "___" within context.`,
      `- 5–6 distinct choices in ${TARGET}.`,
      `- Hint in ${SUPPORT} (≤8 words).`,
      wantTR ? `- ${SUPPORT} translation of stem.` : `- Empty translation "".`,
      topicDirective,
      "",
      "Stream as NDJSON:",
      `{"type":"vocab_ma","phase":"q","question":"<stem in ${TARGET}>"}`,
      `{"type":"vocab_ma","phase":"choices","choices":["..."]}`,
      `{"type":"vocab_ma","phase":"meta","hint":"<${SUPPORT} hint>","answers":["<correct>","<correct>"],"translation":"<${SUPPORT} translation or empty>"}`,
      `{"type":"done"}`,
    ].join("\n");
  }

  function buildQuizSpeakPrompt() {
    const TARGET = LANG_NAME(targetLang);
    const SUPPORT = LANG_NAME(supportCode);
    const wantTR = showTranslations && supportCode !== targetLang;
    const allowTranslate = supportCode !== targetLang;

    let topicDirective = "- Create contextually appropriate quiz questions.";
    if (lessonContent && Array.isArray(lessonContent)) {
      const allWords = [];
      const allTopics = [];
      lessonContent.forEach((content) => {
        if (content?.words) allWords.push(...content.words);
        if (content?.topic) allTopics.push(content.topic);
      });
      if (allWords.length > 0) {
        topicDirective = `- CONTEXT: Draw from this vocabulary pool: ${JSON.stringify(
          [...new Set(allWords)]
        )}. Use these words or related concepts.`;
      } else if (allTopics.length > 0) {
        topicDirective = `- CONTEXT: Questions should relate to these topics: ${allTopics.join(
          ", "
        )}.`;
      }
    }

    return [
      `Create ONE ${TARGET} speaking drill for a unit quiz (difficulty: ${diff}). Choose VARIANT:`,
      `- repeat: show the ${TARGET} word/phrase (≤4 words) to repeat aloud.`,
      allowTranslate
        ? `- translate: show a ${SUPPORT} word/phrase (≤3 words) and have them speak the ${TARGET} translation aloud.`
        : `- translate: SKIP when support language equals ${TARGET}.`,
      `- complete: show a ${TARGET} sentence (≤120 chars) with ___ and have them speak the completed sentence aloud.`,
      topicDirective,
      `- Provide a concise instruction sentence in ${TARGET} (≤120 chars).`,
      `- Include a hint in ${SUPPORT} (≤10 words).`,
      wantTR
        ? `- Provide a ${SUPPORT} translation of the stimulus or completed sentence.`
        : `- Use empty translation "".`,
      "",
      "Stream as NDJSON:",
      `{"type":"vocab_speak","phase":"prompt","variant":"repeat|translate|complete","display":"<text shown to learner>","target":"<${TARGET} output to evaluate>","prompt":"<instruction in ${TARGET}>"}`,
      `{"type":"vocab_speak","phase":"meta","hint":"<${SUPPORT} hint>","translation":"<${SUPPORT} translation or empty>"}`,
      `{"type":"done"}`,
    ].join("\n");
  }

  function buildQuizMatchPrompt() {
    const TARGET = LANG_NAME(targetLang);
    const SUPPORT = LANG_NAME(supportCode);

    let topicDirective = "- Create contextually appropriate quiz questions.";
    if (lessonContent && Array.isArray(lessonContent)) {
      const allWords = [];
      const allTopics = [];
      lessonContent.forEach((content) => {
        if (content?.words) allWords.push(...content.words);
        if (content?.topic) allTopics.push(content.topic);
      });
      if (allWords.length > 0) {
        topicDirective = `- CONTEXT: Draw from this vocabulary pool: ${JSON.stringify(
          [...new Set(allWords)]
        )}. Use these words or related concepts.`;
      } else if (allTopics.length > 0) {
        topicDirective = `- CONTEXT: Questions should relate to these topics: ${allTopics.join(
          ", "
        )}.`;
      }
    }

    return [
      `Create ONE ${TARGET} vocabulary matching exercise for a unit quiz. Difficulty: ${diff}`,
      topicDirective,
      `- Left column: ${TARGET} words (3–6 items, unique).`,
      `- Right column: ${SUPPORT} short definitions (unique).`,
      `- Clear 1:1 mapping; ≤ 4 words per item.`,
      `- Hint in ${SUPPORT} (≤8 words).`,
      "",
      "Emit exactly TWO NDJSON lines:",
      `{"type":"vocab_match","stem":"<${TARGET} stem>","left":["<word>", "..."],"right":["<short ${SUPPORT} definition>", "..."],"hint":"<${SUPPORT} hint>"}`,
      `{"type":"done"}`,
    ].join("\n");
  }

  /* ---------------------------
     GENERATORS
  --------------------------- */
  async function generateFill() {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }
    abortRef.current = new AbortController();

    setMode("fill");
    setQFill("");
    setHFill("");
    setTrFill("");
    setAnsFill("");
    setLoadingQFill(true);

    try {
      const prompt = buildQuizFillPrompt();
      const stream = await simplemodel.generateContentStream(prompt);
      let buffer = "";

      for await (const chunk of stream.stream) {
        const txt = textFromChunk(chunk);
        buffer += txt;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          tryConsumeLine(line, (obj) => {
            if (obj.type === "vocab_fill" && obj.phase === "q") {
              setQFill(obj.question || "");
            } else if (obj.type === "vocab_fill" && obj.phase === "meta") {
              setHFill(obj.hint || "");
              setTrFill(obj.translation || "");
            }
          });
        }
      }

      if (buffer.trim()) {
        tryConsumeLine(buffer, (obj) => {
          if (obj.type === "vocab_fill" && obj.phase === "q") {
            setQFill(obj.question || "");
          } else if (obj.type === "vocab_fill" && obj.phase === "meta") {
            setHFill(obj.hint || "");
            setTrFill(obj.translation || "");
          }
        });
      }
    } catch (err) {
      console.error("Fill generation error:", err);
      toast({
        title: "Error generating question",
        status: "error",
        duration: 2000,
      });
    } finally {
      setLoadingQFill(false);
      abortRef.current = null;
    }
  }

  async function generateMC() {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }
    abortRef.current = new AbortController();

    setMode("mc");
    setQMC("");
    setHMC("");
    setChoicesMC([]);
    setAnswerMC("");
    setTrMC("");
    setPickMC("");
    setLoadingQMC(true);

    try {
      const prompt = buildQuizMCPrompt();
      const stream = await simplemodel.generateContentStream(prompt);
      let buffer = "";

      for await (const chunk of stream.stream) {
        const txt = textFromChunk(chunk);
        buffer += txt;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          tryConsumeLine(line, (obj) => {
            if (obj.type === "vocab_mc" && obj.phase === "q") {
              setQMC(obj.question || "");
            } else if (obj.type === "vocab_mc" && obj.phase === "choices") {
              setChoicesMC(obj.choices || []);
            } else if (obj.type === "vocab_mc" && obj.phase === "meta") {
              setHMC(obj.hint || "");
              setAnswerMC(obj.answer || "");
              setTrMC(obj.translation || "");
            }
          });
        }
      }

      if (buffer.trim()) {
        tryConsumeLine(buffer, (obj) => {
          if (obj.type === "vocab_mc" && obj.phase === "q") {
            setQMC(obj.question || "");
          } else if (obj.type === "vocab_mc" && obj.phase === "choices") {
            setChoicesMC(obj.choices || []);
          } else if (obj.type === "vocab_mc" && obj.phase === "meta") {
            setHMC(obj.hint || "");
            setAnswerMC(obj.answer || "");
            setTrMC(obj.translation || "");
          }
        });
      }
    } catch (err) {
      console.error("MC generation error:", err);
      toast({
        title: "Error generating question",
        status: "error",
        duration: 2000,
      });
    } finally {
      setLoadingQMC(false);
      abortRef.current = null;
    }
  }

  async function generateMA() {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }
    abortRef.current = new AbortController();

    setMode("ma");
    setQMA("");
    setHMA("");
    setChoicesMA([]);
    setAnswersMA([]);
    setTrMA("");
    setPicksMA([]);
    setLoadingQMA(true);

    try {
      const prompt = buildQuizMAPrompt();
      const stream = await simplemodel.generateContentStream(prompt);
      let buffer = "";

      for await (const chunk of stream.stream) {
        const txt = textFromChunk(chunk);
        buffer += txt;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          tryConsumeLine(line, (obj) => {
            if (obj.type === "vocab_ma" && obj.phase === "q") {
              setQMA(obj.question || "");
            } else if (obj.type === "vocab_ma" && obj.phase === "choices") {
              setChoicesMA(obj.choices || []);
            } else if (obj.type === "vocab_ma" && obj.phase === "meta") {
              setHMA(obj.hint || "");
              setAnswersMA(obj.answers || []);
              setTrMA(obj.translation || "");
            }
          });
        }
      }

      if (buffer.trim()) {
        tryConsumeLine(buffer, (obj) => {
          if (obj.type === "vocab_ma" && obj.phase === "q") {
            setQMA(obj.question || "");
          } else if (obj.type === "vocab_ma" && obj.phase === "choices") {
            setChoicesMA(obj.choices || []);
          } else if (obj.type === "vocab_ma" && obj.phase === "meta") {
            setHMA(obj.hint || "");
            setAnswersMA(obj.answers || []);
            setTrMA(obj.translation || "");
          }
        });
      }
    } catch (err) {
      console.error("MA generation error:", err);
      toast({
        title: "Error generating question",
        status: "error",
        duration: 2000,
      });
    } finally {
      setLoadingQMA(false);
      abortRef.current = null;
    }
  }

  async function generateSpeak() {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }
    abortRef.current = new AbortController();

    setMode("speak");
    setSPrompt("");
    setSTarget("");
    setSStimulus("");
    setSVariant("repeat");
    setSHint("");
    setSTranslation("");
    setSRecognized("");
    setSEval(null);
    setLoadingQSpeak(true);

    try {
      const prompt = buildQuizSpeakPrompt();
      const stream = await simplemodel.generateContentStream(prompt);
      let buffer = "";

      for await (const chunk of stream.stream) {
        const txt = textFromChunk(chunk);
        buffer += txt;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          tryConsumeLine(line, (obj) => {
            if (obj.type === "vocab_speak" && obj.phase === "prompt") {
              setSPrompt(obj.prompt || "");
              setSTarget(obj.target || "");
              setSStimulus(obj.display || "");
              setSVariant(obj.variant || "repeat");
            } else if (obj.type === "vocab_speak" && obj.phase === "meta") {
              setSHint(obj.hint || "");
              setSTranslation(obj.translation || "");
            }
          });
        }
      }

      if (buffer.trim()) {
        tryConsumeLine(buffer, (obj) => {
          if (obj.type === "vocab_speak" && obj.phase === "prompt") {
            setSPrompt(obj.prompt || "");
            setSTarget(obj.target || "");
            setSStimulus(obj.display || "");
            setSVariant(obj.variant || "repeat");
          } else if (obj.type === "vocab_speak" && obj.phase === "meta") {
            setSHint(obj.hint || "");
            setSTranslation(obj.translation || "");
          }
        });
      }
    } catch (err) {
      console.error("Speak generation error:", err);
      toast({
        title: "Error generating question",
        status: "error",
        duration: 2000,
      });
    } finally {
      setLoadingQSpeak(false);
      abortRef.current = null;
    }
  }

  async function generateMatch() {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }
    abortRef.current = new AbortController();

    setMode("match");
    setMStem("");
    setMHint("");
    setMLeft([]);
    setMRight([]);
    setMSlots([]);
    setMBank([]);
    setLoadingMG(true);

    try {
      const prompt = buildQuizMatchPrompt();
      const stream = await simplemodel.generateContentStream(prompt);
      let buffer = "";

      for await (const chunk of stream.stream) {
        const txt = textFromChunk(chunk);
        buffer += txt;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          tryConsumeLine(line, (obj) => {
            if (obj.type === "vocab_match") {
              setMStem(obj.stem || "");
              setMHint(obj.hint || "");
              const left = obj.left || [];
              const right = obj.right || [];
              setMLeft(left);
              setMRight(right);
              setMSlots(left.map(() => null));
              setMBank(right.map((_, i) => i));
            }
          });
        }
      }

      if (buffer.trim()) {
        tryConsumeLine(buffer, (obj) => {
          if (obj.type === "vocab_match") {
            setMStem(obj.stem || "");
            setMHint(obj.hint || "");
            const left = obj.left || [];
            const right = obj.right || [];
            setMLeft(left);
            setMRight(right);
            setMSlots(left.map(() => null));
            setMBank(right.map((_, i) => i));
          }
        });
      }
    } catch (err) {
      console.error("Match generation error:", err);
      toast({
        title: "Error generating question",
        status: "error",
        duration: 2000,
      });
    } finally {
      setLoadingMG(false);
      abortRef.current = null;
    }
  }

  const abortRef = useRef(null);
  const types = ["fill", "mc", "ma", "speak", "match"];
  const typeDeckRef = useRef([]);
  const generateRandomRef = useRef(() => {});
  const mcKeyRef = useRef("");
  const maKeyRef = useRef("");

  function generatorFor(type) {
    switch (type) {
      case "fill":
        return generateFill;
      case "mc":
        return generateMC;
      case "ma":
        return generateMA;
      case "speak":
        return generateSpeak;
      case "match":
        return generateMatch;
      default:
        return generateFill;
    }
  }

  function drawType() {
    if (!typeDeckRef.current.length) {
      const reshuffled = [...types];
      for (let i = reshuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
      }
      typeDeckRef.current = reshuffled;
    }
    const [next, ...rest] = typeDeckRef.current;
    typeDeckRef.current = rest;
    return next || types[0];
  }

  function generateRandom() {
    const pick = drawType();
    setMode(pick);
    return generatorFor(pick)();
  }

  useEffect(() => {
    generateRandomRef.current = generateRandom;
  });

  // Auto-start first question
  useEffect(() => {
    if (
      npub &&
      questionsAnswered === 0 &&
      !qFill &&
      !qMC &&
      !qMA &&
      !sTarget &&
      !mLeft.length
    ) {
      generateRandom();
    }
  }, [npub, questionsAnswered]);

  // MC layout
  useEffect(() => {
    if (!qMC || !choicesMC.length) return;
    const signature = `${qMC}||${choicesMC.join("|")}`;
    if (mcKeyRef.current === signature) return;
    mcKeyRef.current = signature;
    const useDrag = shouldUseDragVariant(
      qMC,
      choicesMC,
      [answerMC].filter(Boolean)
    );
    setMcLayout(useDrag ? "drag" : "buttons");
    setMcSlotIndex(null);
    setPickMC("");
    setMcBankOrder(useDrag ? choicesMC.map((_, idx) => idx) : []);
  }, [qMC, choicesMC, answerMC]);

  // MA layout
  useEffect(() => {
    if (!qMA || !choicesMA.length || !answersMA.length) return;
    const signature = `${qMA}||${choicesMA.join("|")}|${answersMA.join("|")}`;
    if (maKeyRef.current === signature) return;
    maKeyRef.current = signature;
    const useDrag = shouldUseDragVariant(qMA, choicesMA, answersMA);
    setMaLayout(useDrag ? "drag" : "buttons");
    if (useDrag) {
      const blanks = countBlanks(qMA) || answersMA.length;
      const slotCount = Math.min(Math.max(blanks, 1), answersMA.length);
      setMaSlots(Array.from({ length: slotCount }, () => null));
      setMaBankOrder(choicesMA.map((_, idx) => idx));
    } else {
      setMaSlots([]);
      setMaBankOrder([]);
    }
    setPicksMA([]);
  }, [qMA, choicesMA, answersMA]);

  /* ---------------------------
     ANSWER CHECKING
  --------------------------- */
  async function checkFill() {
    if (!ansFill.trim()) return;
    setLoadingGFill(true);

    try {
      const TARGET = LANG_NAME(targetLang);
      const filled = qFill.replace(/_{2,}/, ansFill.trim());
      const prompt = `
Judge a fill-in-the-blank in ${TARGET} for a unit quiz with leniency.

Sentence:
${qFill}

User word:
${ansFill}

Filled sentence:
${filled}

Hint (optional):
${hFill || ""}

Policy:
- Say YES if the user's word fits the meaning and collocates naturally in context (allow close synonyms).
- Ignore minor casing/inflection if meaning is equivalent.
- If it clearly doesn't fit the meaning or register, say NO.

Reply ONE WORD ONLY: YES or NO
`.trim();

      const response = await callResponses({
        system: "You are a language quiz grader.",
        user: prompt,
        model: DEFAULT_RESPONSES_MODEL,
      });

      const isCorrect = response?.toUpperCase().includes("YES");
      handleAnswerResult(isCorrect);
    } catch (err) {
      console.error("Error checking fill:", err);
      toast({
        title: "Error checking answer",
        status: "error",
        duration: 2000,
      });
    } finally {
      setLoadingGFill(false);
    }
  }

  async function checkMC() {
    if (!pickMC) return;
    const isCorrect = norm(pickMC) === norm(answerMC);
    handleAnswerResult(isCorrect);
  }

  async function checkMA() {
    if (maLayout === "drag") {
      const userPicked = maSlots.filter((c) => c != null);
      if (userPicked.length === 0) return;
    } else {
      if (picksMA.length === 0) return;
    }

    const userAnswers =
      maLayout === "drag"
        ? maSlots.filter((c) => c != null).map((c) => choicesMA[c])
        : picksMA;

    const userSet = new Set(userAnswers.map(norm));
    const correctSet = new Set(answersMA.map(norm));
    const isCorrect =
      userSet.size === correctSet.size &&
      [...userSet].every((a) => correctSet.has(a));

    handleAnswerResult(isCorrect);
  }

  async function checkSpeak() {
    if (!transcript) return;
    const expected = norm(sTarget);
    const spoken = norm(transcript);
    const isCorrect = spoken.includes(expected) || expected.includes(spoken);
    handleAnswerResult(isCorrect);
  }

  async function checkMatch() {
    const allFilled = mSlots.every((s) => s !== null);
    if (!allFilled) return;

    setLoadingMJ(true);
    try {
      const userPairs = mSlots.map((rightIdx, leftIdx) => [leftIdx, rightIdx]);
      const L = mLeft.map((t, i) => `${i + 1}. ${t}`).join("\n");
      const R = mRight.map((t, i) => `${i + 1}. ${t}`).join("\n");
      const U =
        userPairs
          .map(
            ([li, ri]) =>
              `L${li + 1} -> R${ri + 1}  (${mLeft[li]} -> ${
                mRight[ri] || "(none)"
              })`
          )
          .join("\n") || "(none)";

      const prompt = `
Judge a vocabulary matching task for a unit quiz with leniency.

Stem:
${mStem}

Left (words):
${L}

Right (definitions):
${R}

User mapping (1:1 intended):
${U}

Rules:
- Say YES if each word is matched to a definition that is semantically accurate.
- Allow close paraphrases.
- If any mapping is wrong or missing, say NO.

Reply ONE WORD ONLY:
YES or NO
`.trim();

      const response = await callResponses({
        system: "You are a language quiz grader.",
        user: prompt,
        model: DEFAULT_RESPONSES_MODEL,
      });

      const isCorrect = response?.toUpperCase().includes("YES");
      handleAnswerResult(isCorrect);
    } catch (err) {
      console.error("Error checking match:", err);
      toast({
        title: "Error checking answer",
        status: "error",
        duration: 2000,
      });
    } finally {
      setLoadingMJ(false);
    }
  }

  function handleAnswerResult(isCorrect) {
    setLastOk(isCorrect);
    setQuestionsAnswered((prev) => prev + 1);

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    }

    if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
      // Quiz complete
      setTimeout(() => {
        setShowResults(true);
      }, 1500);
    } else {
      // Next question
      setTimeout(() => {
        setLastOk(null);
        generateRandom();
      }, 1500);
    }
  }

  function handleSubmit() {
    if (mode === "fill") checkFill();
    else if (mode === "mc") checkMC();
    else if (mode === "ma") checkMA();
    else if (mode === "speak") checkSpeak();
    else if (mode === "match") checkMatch();
  }

  async function handleRetry() {
    setShowResults(false);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setLastOk(null);
    generateRandom();
  }

  async function handleComplete() {
    const passed = correctAnswers >= PASS_SCORE;

    if (passed && lessonId && npub) {
      try {
        await completeLesson(npub, lessonId, xpReward, targetLang);
        await awardXp(npub, xpReward, "lesson");

        toast({
          title: userLanguage === "es" ? "¡Examen aprobado!" : "Quiz Passed!",
          description:
            userLanguage === "es"
              ? `Puntuación: ${correctAnswers}/${TOTAL_QUESTIONS}. +${xpReward} XP!`
              : `Score: ${correctAnswers}/${TOTAL_QUESTIONS}. +${xpReward} XP!`,
          status: "success",
          duration: 4000,
        });
      } catch (err) {
        console.error("Error completing quiz:", err);
      }
    }

    if (onComplete) {
      onComplete({ passed, score: correctAnswers });
    }
  }

  /* ---------------------------
     RENDER
  --------------------------- */
  if (!npub) {
    return <PasscodePage />;
  }

  // Results Modal
  if (showResults) {
    const passed = correctAnswers >= PASS_SCORE;
    return (
      <Modal isOpen={true} onClose={handleComplete} size="lg">
        <ModalOverlay />
        <ModalContent bg="#1a1e2e" color="white">
          <ModalHeader textAlign="center">
            {userLanguage === "es"
              ? passed
                ? "¡Examen Aprobado! 🎉"
                : "Examen Fallido 😔"
              : passed
              ? "Quiz Passed! 🎉"
              : "Quiz Failed 😔"}
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="2xl">
                {userLanguage === "es" ? "Puntuación" : "Score"}:{" "}
                {correctAnswers}/{TOTAL_QUESTIONS}
              </Text>
              <Progress
                value={(correctAnswers / TOTAL_QUESTIONS) * 100}
                colorScheme={passed ? "green" : "red"}
                w="full"
                size="lg"
                borderRadius="full"
              />
              <Text textAlign="center">
                {passed
                  ? userLanguage === "es"
                    ? `¡Felicitaciones! Aprobaste con ${correctAnswers} respuestas correctas. Ganaste ${xpReward} XP!`
                    : `Congratulations! You passed with ${correctAnswers} correct answers. You earned ${xpReward} XP!`
                  : userLanguage === "es"
                  ? `Necesitas ${PASS_SCORE} respuestas correctas para aprobar. Obtuviste ${correctAnswers}. ¡Inténtalo de nuevo!`
                  : `You need ${PASS_SCORE} correct answers to pass. You got ${correctAnswers}. Try again!`}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={4} w="full" justify="center">
              {!passed && (
                <Button colorScheme="teal" onClick={handleRetry}>
                  {userLanguage === "es" ? "Reintentar" : "Retry Quiz"}
                </Button>
              )}
              <Button onClick={handleComplete}>
                {userLanguage === "es" ? "Continuar" : "Continue"}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const isLoading =
    loadingQFill || loadingQMC || loadingQMA || loadingQSpeak || loadingMG;
  const isGrading = loadingGFill || loadingGMC || loadingGMA || loadingMJ;

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(135deg, #0f0f23 0%, #1a1e2e 50%, #16213e 100%)"
      py={8}
    >
      <VStack spacing={6} maxW="800px" mx="auto" px={4}>
        {/* Progress Header */}
        <Box w="full">
          <HStack justify="space-between" mb={2}>
            <Badge colorScheme="teal">
              {userLanguage === "es" ? "Pregunta" : "Question"}{" "}
              {questionsAnswered + 1}/{TOTAL_QUESTIONS}
            </Badge>
            <Badge colorScheme="purple">
              {userLanguage === "es" ? "Correctas" : "Correct"}:{" "}
              {correctAnswers}/{questionsAnswered}
            </Badge>
          </HStack>
          <Progress
            value={((questionsAnswered + 1) / TOTAL_QUESTIONS) * 100}
            colorScheme="teal"
            borderRadius="full"
            size="sm"
          />
        </Box>

        {/* Question Card */}
        <Box
          w="full"
          bg="whiteAlpha.100"
          borderRadius="xl"
          p={8}
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          {isLoading ? (
            <VStack spacing={4}>
              <Spinner color="teal.300" />
              <Text color="white">
                {userLanguage === "es"
                  ? "Generando pregunta..."
                  : "Generating question..."}
              </Text>
            </VStack>
          ) : mode === "fill" ? (
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" color="white">
                {qFill}
              </Text>
              {hFill && (
                <Text fontSize="sm" color="gray.400">
                  💡 {hFill}
                </Text>
              )}
              {trFill && showTranslations && (
                <Text fontSize="sm" color="gray.500" fontStyle="italic">
                  {trFill}
                </Text>
              )}
              <Input
                value={ansFill}
                onChange={(e) => setAnsFill(e.target.value)}
                placeholder={
                  userLanguage === "es"
                    ? "Escribe tu respuesta..."
                    : "Type your answer..."
                }
                size="lg"
                bg="whiteAlpha.100"
                color="white"
                isDisabled={lastOk !== null || isGrading}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              />
            </VStack>
          ) : mode === "mc" ? (
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" color="white">
                {qMC}
              </Text>
              {hMC && (
                <Text fontSize="sm" color="gray.400">
                  💡 {hMC}
                </Text>
              )}
              {trMC && showTranslations && (
                <Text fontSize="sm" color="gray.500" fontStyle="italic">
                  {trMC}
                </Text>
              )}
              {mcLayout === "buttons" ? (
                <RadioGroup
                  value={pickMC}
                  onChange={setPickMC}
                  isDisabled={lastOk !== null}
                >
                  <Stack spacing={2}>
                    {choicesMC.map((choice, idx) => (
                      <Radio key={idx} value={choice} colorScheme="teal">
                        {choice}
                      </Radio>
                    ))}
                  </Stack>
                </RadioGroup>
              ) : (
                <Text color="gray.400" fontSize="sm">
                  (Drag variant would render here)
                </Text>
              )}
            </VStack>
          ) : mode === "ma" ? (
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" color="white">
                {qMA}
              </Text>
              {hMA && (
                <Text fontSize="sm" color="gray.400">
                  💡 {hMA}
                </Text>
              )}
              {trMA && showTranslations && (
                <Text fontSize="sm" color="gray.500" fontStyle="italic">
                  {trMA}
                </Text>
              )}
              {maLayout === "buttons" ? (
                <CheckboxGroup
                  value={picksMA}
                  onChange={setPicksMA}
                  isDisabled={lastOk !== null}
                >
                  <Stack spacing={2}>
                    {choicesMA.map((choice, idx) => (
                      <Checkbox key={idx} value={choice} colorScheme="teal">
                        {choice}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              ) : (
                <Text color="gray.400" fontSize="sm">
                  (Drag variant would render here)
                </Text>
              )}
            </VStack>
          ) : mode === "speak" ? (
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" color="white">
                {sPrompt}
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="cyan.300">
                {sStimulus}
              </Text>
              {sHint && (
                <Text fontSize="sm" color="gray.400">
                  💡 {sHint}
                </Text>
              )}
              {sTranslation && showTranslations && (
                <Text fontSize="sm" color="gray.500" fontStyle="italic">
                  {sTranslation}
                </Text>
              )}
              <Button
                colorScheme={isListening ? "red" : "teal"}
                onClick={isListening ? stopListening : startListening}
                isDisabled={lastOk !== null}
                size="lg"
              >
                {isListening
                  ? userLanguage === "es"
                    ? "Parar Grabación"
                    : "Stop Recording"
                  : userLanguage === "es"
                  ? "Empezar a Hablar"
                  : "Start Speaking"}
              </Button>
              {transcript && (
                <Text color="white" fontSize="sm">
                  {userLanguage === "es" ? "Dijiste" : "You said"}: "
                  {transcript}"
                </Text>
              )}
            </VStack>
          ) : mode === "match" ? (
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" color="white">
                {mStem ||
                  (userLanguage === "es"
                    ? "Empareja las palabras con sus definiciones"
                    : "Match the words with their definitions")}
              </Text>
              {mHint && (
                <Text fontSize="sm" color="gray.400">
                  💡 {mHint}
                </Text>
              )}
              <HStack spacing={4} align="start">
                <VStack flex={1} spacing={2}>
                  {mLeft.map((word, idx) => (
                    <Box
                      key={idx}
                      p={3}
                      bg="whiteAlpha.200"
                      borderRadius="md"
                      w="full"
                      textAlign="center"
                      color="white"
                    >
                      {word}
                    </Box>
                  ))}
                </VStack>
                <VStack flex={1} spacing={2}>
                  {mRight.map((def, idx) => (
                    <Box
                      key={idx}
                      p={3}
                      bg="whiteAlpha.100"
                      borderRadius="md"
                      w="full"
                      textAlign="center"
                      color="white"
                      fontSize="sm"
                      cursor="pointer"
                      onClick={() => {
                        const firstEmpty = mSlots.findIndex((s) => s === null);
                        if (firstEmpty !== -1) {
                          const newSlots = [...mSlots];
                          newSlots[firstEmpty] = idx;
                          setMSlots(newSlots);
                          setMBank(mBank.filter((i) => i !== idx));
                        }
                      }}
                    >
                      {def}
                    </Box>
                  ))}
                </VStack>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                {userLanguage === "es"
                  ? "(Haz clic en las definiciones para emparejarlas)"
                  : "(Click definitions to match them)"}
              </Text>
            </VStack>
          ) : (
            <Text color="white">
              {userLanguage === "es"
                ? "Tipo de pregunta desconocida"
                : "Unknown question type"}
            </Text>
          )}

          {/* Feedback */}
          {lastOk !== null && (
            <Box
              mt={4}
              p={4}
              bg={lastOk ? "green.500" : "red.500"}
              borderRadius="md"
              color="white"
              textAlign="center"
            >
              {lastOk
                ? userLanguage === "es"
                  ? "✓ ¡Correcto!"
                  : "✓ Correct!"
                : userLanguage === "es"
                ? "✗ Incorrecto"
                : "✗ Incorrect"}
            </Box>
          )}

          {/* Submit Button */}
          {lastOk === null && !isLoading && (
            <Button
              colorScheme="teal"
              size="lg"
              w="full"
              mt={6}
              onClick={handleSubmit}
              isLoading={isGrading}
              isDisabled={
                (mode === "fill" && !ansFill.trim()) ||
                (mode === "mc" && !pickMC) ||
                (mode === "ma" &&
                  (maLayout === "drag"
                    ? !maSlots.some((s) => s !== null)
                    : picksMA.length === 0)) ||
                (mode === "speak" && !transcript) ||
                (mode === "match" && !mSlots.every((s) => s !== null))
              }
            >
              {userLanguage === "es" ? "Enviar Respuesta" : "Submit Answer"}
            </Button>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
