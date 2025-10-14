// components/Vocabulary.jsx
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Badge,
  Button,
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
} from "@chakra-ui/react";
import {
  doc,
  onSnapshot,
  setDoc,
  increment,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { database, simplemodel } from "../firebaseResources/firebaseResources"; // ✅ streaming model
import useUserStore from "../hooks/useUserStore";
import { useSpeechPractice } from "../hooks/useSpeechPractice";
import { WaveBar } from "./WaveBar";
import { SpeakSuccessCard } from "./SpeakSuccessCard";
import translations from "../utils/translation";
import { PasscodePage } from "./PasscodePage";
import { FiCopy } from "react-icons/fi";
import { awardXp } from "../utils/utils";
import { callResponses, DEFAULT_RESPONSES_MODEL } from "../utils/llm";
import { speechReasonTips } from "../utils/speechEvaluation";

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

// Safely consume a line with potential JSON content (NDJSON style)
function tryConsumeLine(line, cb) {
  const s = line.indexOf("{");
  const e = line.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return;
  try {
    const obj = JSON.parse(line.slice(s, e + 1));
    cb?.(obj);
  } catch {
    // ignore parse noise
  }
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
  const blanks = countBlanks(question);
  if (!blanks) return false;
  const signature = `${question}||${choices.join("|")}||${answers.join("|")}`;
  return stableHash(signature) % 3 === 0;
}

/* ---------------------------
   Minimal i18n helper
--------------------------- */
function useT(uiLang = "en") {
  const lang = ["en", "es"].includes(uiLang) ? uiLang : "en";
  const dict = (translations && translations[lang]) || {};
  const enDict = (translations && translations.en) || {};
  return (key, params) => {
    const raw = (dict[key] ?? enDict[key] ?? key) + "";
    if (!params) return raw;
    return raw.replace(/{(\w+)}/g, (_, k) =>
      k in params ? String(params[k]) : `{${k}}`
    );
  };
}

/* ---------------------------
   LLM plumbing (backend fallback)
--------------------------- */
const MODEL = DEFAULT_RESPONSES_MODEL;

/* ---------------------------
   User/XP helpers
--------------------------- */
const LANG_NAME = (code) =>
  ({ en: "English", es: "Spanish", nah: "Nahuatl" }[code] || code);

const strongNpub = (user) =>
  (
    user?.id ||
    user?.local_npub ||
    (typeof window !== "undefined" ? localStorage.getItem("local_npub") : "") ||
    ""
  ).trim();

function useSharedProgress() {
  const user = useUserStore((s) => s.user);
  const npub = strongNpub(user);
  const [xp, setXp] = useState(0);
  const [progress, setProgress] = useState({
    level: "beginner",
    targetLang: "es",
    supportLang: "en",
    showTranslations: true,
  });
  // ✅ ready flag so we know when user settings have been loaded once
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!npub) {
      setReady(true); // no user -> use defaults immediately
      return;
    }
    const ref = doc(database, "users", npub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      setXp(Number.isFinite(data?.xp) ? data.xp : 0);
      const p = data?.progress || {};
      setProgress({
        level: p.level || "beginner",
        targetLang: ["nah", "es", "en"].includes(p.targetLang)
          ? p.targetLang
          : "es",
        supportLang: ["en", "es", "bilingual"].includes(p.supportLang)
          ? p.supportLang
          : "en",
        showTranslations:
          typeof p.showTranslations === "boolean" ? p.showTranslations : true,
      });
      setReady(true); // ✅ we’ve received user settings
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub, ready };
}

async function saveAttempt(npub, payload) {
  if (!npub) return;
  const col = collection(database, "users", npub, "vocabTurns");
  await addDoc(col, {
    ...payload,
    createdAt: serverTimestamp(),
    createdAtClient: Date.now(),
    origin: "vocabulary",
  });
}

/* ---------------------------
   Difficulty routing — vocabulary
--------------------------- */
function vocabDifficulty(level, xp) {
  const band = xp < 150 ? 0 : xp < 400 ? 1 : 2;
  if (level === "beginner") {
    return [
      "High-frequency everyday words; concrete nouns; common verbs.",
      "Common adjectives/adverbs; basic phrasal verbs; collocations.",
      "Less common words; simple idioms; multi-word expressions.",
    ][band];
  }
  if (level === "intermediate") {
    return [
      "Phrasal verbs & collocations; polysemy disambiguation.",
      "Nuanced adjectives; precise verbs; common idioms.",
      "Domain words (travel, health, work); figurative uses.",
    ][band];
  }
  return [
    "Low-frequency words; idioms; register differences.",
    "Nuanced synonyms; connotation/usage constraints.",
    "Collocational strength; subtle sense choices; near-synonyms.",
  ][band];
}

/* ---------------------------
   Support language resolution
--------------------------- */
const resolveSupportLang = (supportLang, appUILang) =>
  supportLang === "bilingual"
    ? appUILang === "es"
      ? "es"
      : "en"
    : supportLang === "es"
    ? "es"
    : "en";

/* ---------------------------
   Prompts — STREAM-FIRST (NDJSON phases)
--------------------------- */
/* FILL phases:
   1) {"type":"vocab_fill","phase":"q","question":"..."}
   2) {"type":"vocab_fill","phase":"meta","hint":"...","translation":"..."}
   3) {"type":"done"}
*/
function buildFillVocabStreamPrompt({
  level,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  xp,
  recentGood,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const wantTR =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = vocabDifficulty(level, xp);

  return [
    `Create ONE short ${TARGET} VOCABULARY sentence with a single blank "___" that targets word choice (not grammar). Difficulty: ${diff}`,
    `- ≤ 120 chars; natural context that cues the target word.`,
    `- Consider learner recent corrects: ${JSON.stringify(
      recentGood.slice(-3)
    )}`,
    `- Hint in ${SUPPORT} (≤ 8 words), covering meaning/synonym/topic.`,
    wantTR
      ? `- ${SUPPORT} translation of the full sentence.`
      : `- Empty translation "".`,
    "",
    "Stream as NDJSON in phases:",
    `{"type":"vocab_fill","phase":"q","question":"<sentence with ___ in ${TARGET}>"}  // emit ASAP`,
    `{"type":"vocab_fill","phase":"meta","hint":"<${SUPPORT} hint>","translation":"<${SUPPORT} translation or empty>"}  // then`,
    `{"type":"done"}`,
  ].join("\n");
}

/* MC phases:
   1) {"type":"vocab_mc","phase":"q","question":"..."}
   2) {"type":"vocab_mc","phase":"choices","choices":["A","B","C","D"]}
   3) {"type":"vocab_mc","phase":"meta","hint":"...","answer":"...","translation":"..."}
   4) {"type":"done"}
*/
function buildMCVocabStreamPrompt({
  level,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  xp,
  recentGood,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const wantTR =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = vocabDifficulty(level, xp);

  return [
    `Create ONE ${TARGET} vocabulary multiple-choice question (exactly one correct). Difficulty: ${diff}`,
    `- Stem ≤120 chars with a blank "___" OR a short definition asking for a word.`,
    `- 4 distinct word choices in ${TARGET}.`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    wantTR ? `- ${SUPPORT} translation of stem.` : `- Empty translation "".`,
    `- Consider learner recent corrects: ${JSON.stringify(
      recentGood.slice(-3)
    )}`,
    "",
    "Stream as NDJSON:",
    `{"type":"vocab_mc","phase":"q","question":"<stem in ${TARGET}>"}  // first`,
    `{"type":"vocab_mc","phase":"choices","choices":["A","B","C","D"]}  // second`,
    `{"type":"vocab_mc","phase":"meta","hint":"<${SUPPORT} hint>","answer":"<exact correct choice text>","translation":"<${SUPPORT} translation or empty>"} // third`,
    `{"type":"done"}`,
  ].join("\n");
}

/* MA phases:
   1) {"type":"vocab_ma","phase":"q","question":"..."}
   2) {"type":"vocab_ma","phase":"choices","choices":["..."]} // 5–6
   3) {"type":"vocab_ma","phase":"meta","hint":"...","answers":["...","..."],"translation":"..."} // EXACTLY 2 or 3
   4) {"type":"done"}
*/
function buildMAVocabStreamPrompt({
  level,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  xp,
  recentGood,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const wantTR =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = vocabDifficulty(level, xp);

  return [
    `Create ONE ${TARGET} vocabulary multiple-answer question (EXACTLY 2 or 3 correct). Difficulty: ${diff}`,
    `- Stem ≤120 chars with context (e.g., “Which words fit the sentence?” or “Select all synonyms for ___”).`,
    `- 5–6 distinct choices in ${TARGET}.`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    wantTR ? `- ${SUPPORT} translation of stem.` : `- Empty translation "".`,
    `- Consider learner recent corrects: ${JSON.stringify(
      recentGood.slice(-3)
    )}`,
    "",
    "Stream as NDJSON:",
    `{"type":"vocab_ma","phase":"q","question":"<stem in ${TARGET}>"}  // first`,
    `{"type":"vocab_ma","phase":"choices","choices":["..."]}           // second`,
    `{"type":"vocab_ma","phase":"meta","hint":"<${SUPPORT} hint>","answers":["<correct>","<correct>"],"translation":"<${SUPPORT} translation or empty>"} // third`,
    `{"type":"done"}`,
  ].join("\n");
}

/* SPEAK phases:
   1) {"type":"vocab_speak","phase":"prompt","target":"<word>","prompt":"<instruction>"}
   2) {"type":"vocab_speak","phase":"meta","hint":"...","translation":"..."}
   3) {"type":"done"}
*/
function buildSpeakVocabStreamPrompt({
  level,
  targetLang,
  supportLang,
  showTranslations,
  appUILang,
  xp,
  recentGood,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const wantTR =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = vocabDifficulty(level, xp);
  const allowTranslate =
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);

  return [
    `Create ONE ${TARGET} speaking drill (difficulty: ${diff}). Choose VARIANT:`,
    `- repeat: show the ${TARGET} word/phrase (≤4 words) to repeat aloud.`,
    allowTranslate
      ? `- translate: show a ${SUPPORT} word/phrase (≤3 words) and have them speak the ${TARGET} translation aloud.`
      : `- translate: SKIP when support language equals ${TARGET}.`,
    `- complete: show a ${TARGET} sentence (≤120 chars) with ___ and have them speak the completed sentence aloud.`,
    `- Rotate variants (avoid repeating the same variant more than twice in a row relative to recent successes: ${JSON.stringify(
      recentGood.slice(-3)
    )}).`,
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

function normalizeSpeakVariant(variant) {
  const v = (variant || "").toString().toLowerCase();
  return ["repeat", "translate", "complete"].includes(v) ? v : "repeat";
}

/* MATCH phases:
   1) {"type":"vocab_match","stem":"...","left":["w1",...],"right":["def1",...],"hint":"..."}
   2) {"type":"done"}
   Left in TARGET (words), Right in SUPPORT (short defs), 3–6 rows
*/
function buildMatchVocabStreamPrompt({
  targetLang,
  supportLang,
  appUILang,
  level,
  xp,
  recentGood,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const diff = vocabDifficulty(level, xp);

  return [
    `Create ONE ${TARGET} vocabulary matching exercise. Difficulty: ${diff}`,
    `- Left column: ${TARGET} words (3–6 items, unique).`,
    `- Right column: ${SUPPORT} short definitions (unique).`,
    `- Clear 1:1 mapping; ≤ 4 words per item.`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    `- Consider learner recent corrects: ${JSON.stringify(
      recentGood.slice(-3)
    )}`,
    "",
    "Emit exactly TWO NDJSON lines:",
    `{"type":"vocab_match","stem":"<${TARGET} stem>","left":["<word>", "..."],"right":["<short ${SUPPORT} definition>", "..."],"hint":"<${SUPPORT} hint>"}`,
    `{"type":"done"}`,
  ].join("\n");
}

/* ---------------------------
   Prompts — JUDGE (lenient)
--------------------------- */
function buildFillVocabJudgePrompt({
  targetLang,
  level,
  sentence,
  userAnswer,
  hint,
}) {
  const TARGET = LANG_NAME(targetLang);
  const filled = sentence.replace(/_{2,}/, String(userAnswer || "").trim());
  return `
Judge a VOCABULARY fill-in-the-blank in ${TARGET} with leniency.

Sentence:
${sentence}

User word:
${userAnswer}

Filled sentence:
${filled}

Hint (optional):
${hint || ""}

Policy:
- Say YES if the user's word fits the meaning and collocates naturally in context (allow close synonyms).
- Ignore minor casing/inflection if meaning is equivalent.
- If it clearly doesn't fit the meaning or register, say NO.

Reply ONE WORD ONLY: YES or NO
`.trim();
}

function buildMCVocabJudgePrompt({
  targetLang,
  stem,
  choices,
  userChoice,
  hint,
}) {
  const TARGET = LANG_NAME(targetLang);
  const listed = choices.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return `
Judge a ${TARGET} VOCAB multiple-choice answer.

Stem:
${stem}

Choices:
${listed}

User selected:
${userChoice}

Hint (optional):
${hint || ""}

Rules:
- Say YES if the selected word best fits the stem's meaning/context.
- Allow close synonyms if they fit as well as the intended answer.
- Otherwise say NO.

Reply ONE WORD ONLY: YES or NO
`.trim();
}

function buildMAVocabJudgePrompt({
  targetLang,
  stem,
  choices,
  userSelections,
  hint,
}) {
  const TARGET = LANG_NAME(targetLang);
  const listed = choices.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const picked = userSelections.map((c) => `- ${c}`).join("\n");
  return `
Judge a ${TARGET} VOCAB multiple-answer response (order irrelevant).

Stem:
${stem}

Choices:
${listed}

User selected:
${picked || "(none)"}

Hint (optional):
${hint || ""}

Policy:
- Determine which choices are semantically correct (synonyms/fit the sentence).
- Say YES if the user's selection includes ALL correct choices and NO incorrect ones (order doesn't matter).
- Be lenient with near-synonyms if they fit naturally.

Reply ONE WORD ONLY: YES or NO
`.trim();
}

function buildMatchVocabJudgePrompt({ stem, left, right, userPairs, hint }) {
  const L = left.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const R = right.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const U =
    userPairs
      .map(
        ([li, ri]) =>
          `L${li + 1} -> R${ri + 1}  (${left[li]} -> ${right[ri] || "(none)"})`
      )
      .join("\n") || "(none)";

  return `
Judge a VOCAB matching task with leniency.

Stem:
${stem}

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
}

/* ---------------------------
   Utilities
--------------------------- */
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s !== -1 && e !== -1 && e > s) {
      try {
        return JSON.parse(text.slice(s, e + 1));
      } catch {}
    }
    return null;
  }
}
function safeParseJsonLoose(txt = "") {
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch {}
  const s = txt.indexOf("{");
  const e = txt.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) {
    try {
      return JSON.parse(txt.slice(s, e + 1));
    } catch {}
  }
  return null;
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
   Component
--------------------------- */
export default function Vocabulary({ userLanguage = "en" }) {
  const t = useT(userLanguage);
  const toast = useToast();
  const user = useUserStore((s) => s.user);

  const { xp, levelNumber, progressPct, progress, npub, ready } =
    useSharedProgress();

  const level = progress.level || "beginner";
  const targetLang = ["en", "es", "nah"].includes(progress.targetLang)
    ? progress.targetLang
    : "en";
  const supportLang = ["en", "es", "bilingual"].includes(progress.supportLang)
    ? progress.supportLang
    : "en";
  const showTranslations =
    typeof progress.showTranslations === "boolean"
      ? progress.showTranslations
      : true;
  const supportCode = resolveSupportLang(supportLang, userLanguage);

  // UI language labels
  const localizedLangName = (code) =>
    ({
      en: t("language_en"),
      es: t("language_es"),
      nah: t("language_nah"),
    }[code] || code);
  const supportName = localizedLangName(supportCode);
  const targetName = localizedLangName(targetLang);
  const levelLabel = t(`onboarding_level_${level}`) || level;

  const recentCorrectRef = useRef([]);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  useEffect(() => {
    if (
      levelNumber > 2 &&
      localStorage.getItem("passcode") !== import.meta.env.VITE_PATREON_PASSCODE
    ) {
      setShowPasscodeModal(true);
    }
  }, [xp]);

  const [mode, setMode] = useState("fill"); // "fill" | "mc" | "ma" | "speak" | "match"
  // ✅ always randomize (no manual lock controls in the UI)
  const lockedType = null;

  // verdict + next control
  const [lastOk, setLastOk] = useState(null); // null | true | false
  const [recentXp, setRecentXp] = useState(0);
  const [nextAction, setNextAction] = useState(null);

  function showCopyToast() {
    toast({
      title:
        t("copied_to_clipboard_all") ||
        (userLanguage === "es"
          ? "Copiado (pregunta + pista + traducción)"
          : "Copied (question + hint + translation)"),
      duration: 1200,
      isClosable: true,
      position: "top",
    });
  }

  function makeBundle(q, h, tr) {
    const lines = [];
    if (q?.trim()) lines.push(q.trim());
    if (h?.trim())
      lines.push((userLanguage === "es" ? "Pista: " : "Hint: ") + h.trim());
    if (tr?.trim())
      lines.push(
        (userLanguage === "es" ? "Traducción: " : "Translation: ") + tr.trim()
      );
    return lines.join("\n");
  }

  async function copyAll(q, h, tr) {
    const text = makeBundle(q, h, tr);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showCopyToast();
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showCopyToast();
      } catch {}
    }
  }

  function handleNext() {
    if (typeof nextAction === "function") {
      setLastOk(null);
      setRecentXp(0);
      const fn = nextAction;
      setNextAction(null);
      fn();
    }
  }

  // ---- FILL (vocab) ----
  const [qFill, setQFill] = useState("");
  const [hFill, setHFill] = useState("");
  const [trFill, setTrFill] = useState("");
  const [ansFill, setAnsFill] = useState("");
  const [resFill, setResFill] = useState(""); // log only
  const [loadingQFill, setLoadingQFill] = useState(false);
  const [loadingGFill, setLoadingGFill] = useState(false);

  // ---- MC (vocab) ----
  const [qMC, setQMC] = useState("");
  const [hMC, setHMC] = useState("");
  const [choicesMC, setChoicesMC] = useState([]);
  const [answerMC, setAnswerMC] = useState("");
  const [trMC, setTrMC] = useState("");
  const [pickMC, setPickMC] = useState("");
  const [mcLayout, setMcLayout] = useState("buttons");
  const [mcBankOrder, setMcBankOrder] = useState([]);
  const [mcSlotIndex, setMcSlotIndex] = useState(null);
  const [resMC, setResMC] = useState(""); // log only
  const [loadingQMC, setLoadingQMC] = useState(false);
  const [loadingGMC, setLoadingGMC] = useState(false);

  // ---- MA (vocab) ----
  const [qMA, setQMA] = useState("");
  const [hMA, setHMA] = useState("");
  const [choicesMA, setChoicesMA] = useState([]);
  const [answersMA, setAnswersMA] = useState([]);
  const [trMA, setTrMA] = useState("");
  const [picksMA, setPicksMA] = useState([]);
  const [maLayout, setMaLayout] = useState("buttons");
  const [maSlots, setMaSlots] = useState([]);
  const [maBankOrder, setMaBankOrder] = useState([]);
  const [resMA, setResMA] = useState(""); // log only
  const [loadingQMA, setLoadingQMA] = useState(false);
  const [loadingGMA, setLoadingGMA] = useState(false);

  // ---- SPEAK (vocab) ----
  const [sPrompt, setSPrompt] = useState("");
  const [sTarget, setSTarget] = useState("");
  const [sStimulus, setSStimulus] = useState("");
  const [sVariant, setSVariant] = useState("repeat");
  const [sHint, setSHint] = useState("");
  const [sTranslation, setSTranslation] = useState("");
  const [sRecognized, setSRecognized] = useState("");
  const [sEval, setSEval] = useState(null);
  const [loadingQSpeak, setLoadingQSpeak] = useState(false);

  // ---- MATCH (DnD) ----
  const [mStem, setMStem] = useState("");
  const [mHint, setMHint] = useState("");
  const [mLeft, setMLeft] = useState([]); // words (TARGET)
  const [mRight, setMRight] = useState([]); // definitions (SUPPORT)
  const [mSlots, setMSlots] = useState([]); // per-left: rightIndex|null
  const [mBank, setMBank] = useState([]); // right indices not used
  const [mResult, setMResult] = useState(""); // log only
  const [loadingMG, setLoadingMG] = useState(false);
  const [loadingMJ, setLoadingMJ] = useState(false);

  /* ---------------------------
     GENERATOR DISPATCH
  --------------------------- */
  const types = ["fill", "mc", "ma", "speak", "match"];
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
  function generateRandom() {
    const pool = types;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    // do NOT lock when randomizing
    setMode(pick);
    return generatorFor(pick)();
  }

  useEffect(() => {
    generateRandomRef.current = generateRandom;
  });

  useEffect(() => {
    if (!qMC || !choicesMC.length) return;
    const signature = `${qMC}||${choicesMC.join("|")}`;
    if (mcKeyRef.current === signature) return;
    mcKeyRef.current = signature;
    const useDrag = shouldUseDragVariant(qMC, choicesMC, [answerMC].filter(Boolean));
    setMcLayout(useDrag ? "drag" : "buttons");
    setMcSlotIndex(null);
    setPickMC("");
    setMcBankOrder(useDrag ? choicesMC.map((_, idx) => idx) : []);
  }, [qMC, choicesMC, answerMC]);

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

  const handleMcDragEnd = useCallback(
    (result) => {
      if (!result?.destination || mcLayout !== "drag") return;
      const { source, destination } = result;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      if (source.droppableId === "mc-bank" && destination.droppableId === "mc-bank") {
        const updated = Array.from(mcBankOrder);
        const [removed] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, removed);
        setMcBankOrder(updated);
        return;
      }

      if (source.droppableId === "mc-bank" && destination.droppableId === "mc-slot") {
        const updated = Array.from(mcBankOrder);
        const [removed] = updated.splice(source.index, 1);
        if (mcSlotIndex != null) {
          updated.splice(destination.index, 0, mcSlotIndex);
        }
        setMcBankOrder(updated);
        setMcSlotIndex(removed);
        setPickMC(choicesMC[removed] || "");
        return;
      }

      if (source.droppableId === "mc-slot" && destination.droppableId === "mc-bank") {
        if (mcSlotIndex == null) return;
        const updated = Array.from(mcBankOrder);
        updated.splice(destination.index, 0, mcSlotIndex);
        setMcBankOrder(updated);
        setMcSlotIndex(null);
        setPickMC("");
      }
    },
    [mcLayout, mcBankOrder, mcSlotIndex, choicesMC]
  );

  const handleMaDragEnd = useCallback(
    (result) => {
      if (!result?.destination || maLayout !== "drag") return;
      const { source, destination } = result;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      const parseSlot = (id) =>
        id.startsWith("ma-slot-") ? parseInt(id.replace("ma-slot-", ""), 10) : null;
      const sourceSlot = parseSlot(source.droppableId);
      const destSlot = parseSlot(destination.droppableId);

      if (source.droppableId === "ma-bank" && destination.droppableId === "ma-bank") {
        const updated = Array.from(maBankOrder);
        const [removed] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, removed);
        setMaBankOrder(updated);
        return;
      }

      if (source.droppableId === "ma-bank" && destSlot != null) {
        const updated = Array.from(maBankOrder);
        const [removed] = updated.splice(source.index, 1);
        const displaced = maSlots[destSlot];
        if (displaced != null) {
          updated.splice(source.index, 0, displaced);
        }
        setMaBankOrder(updated);
        setMaSlots((prev) => {
          const next = [...prev];
          next[destSlot] = removed;
          return next;
        });
        return;
      }

      if (sourceSlot != null && destination.droppableId === "ma-bank") {
        const slotValue = maSlots[sourceSlot];
        if (slotValue == null) return;
        const updated = Array.from(maBankOrder);
        updated.splice(destination.index, 0, slotValue);
        setMaBankOrder(updated);
        setMaSlots((prev) => {
          const next = [...prev];
          next[sourceSlot] = null;
          return next;
        });
        return;
      }

      if (sourceSlot != null && destSlot != null) {
        setMaSlots((prev) => {
          const next = [...prev];
          const temp = next[sourceSlot];
          next[sourceSlot] = next[destSlot];
          next[destSlot] = temp;
          return next;
        });
      }
    },
    [maLayout, maBankOrder, maSlots]
  );

  useEffect(() => {
    if (maLayout !== "drag") return;
    setPicksMA((prev) => {
      const filled = maSlots
        .filter((idx) => idx != null)
        .map((idx) => choicesMA[idx])
        .filter(Boolean);
      if (
        filled.length === prev.length &&
        filled.every((val, idx) => val === prev[idx])
      ) {
        return prev;
      }
      return filled;
    });
  }, [maLayout, maSlots, choicesMA]);

  /* ---------------------------
     STREAM Generate — FILL
  --------------------------- */
  async function generateFill() {
    setMode("fill");
    setLoadingQFill(true);
    setResFill("");
    setAnsFill("");
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    // reset view to allow placeholders while streaming
    setQFill("");
    setHFill("");
    setTrFill("");

    const prompt = buildFillVocabStreamPrompt({
      level,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      xp,
      recentGood: recentCorrectRef.current,
    });

    let gotSomething = false;

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");

      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;

        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (
              obj?.type === "vocab_fill" &&
              obj.phase === "q" &&
              obj.question
            ) {
              setQFill(String(obj.question));
              gotSomething = true;
            } else if (obj?.type === "vocab_fill" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setHFill(obj.hint);
              if (typeof obj.translation === "string")
                setTrFill(obj.translation);
              gotSomething = true;
            }
          });
        }
      }

      // Flush any trailing aggregates
      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (finalText) {
        (finalText + "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) =>
            tryConsumeLine(l, (obj) => {
              if (
                obj?.type === "vocab_fill" &&
                obj.phase === "q" &&
                obj.question
              ) {
                setQFill(String(obj.question));
                gotSomething = true;
              } else if (obj?.type === "vocab_fill" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setHFill(obj.hint);
                if (typeof obj.translation === "string")
                  setTrFill(obj.translation);
                gotSomething = true;
              }
            })
          );
      }

      if (!gotSomething) throw new Error("no-fill");
    } catch {
      // Fallback (non-stream)
      const text = await callResponses({
        model: MODEL,
        input: `
Create ONE short ${LANG_NAME(
          targetLang
        )} VOCAB sentence with a single blank "___" (not grammar), ≤120 chars.
Return EXACTLY:
<sentence> ||| <hint in ${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )}> ||| <${showTranslations ? "translation" : '""'}>
`.trim(),
      });

      const [q, h, tr] = text.split("|||").map((s) => (s || "").trim());
      if (q) {
        setQFill(q);
        setHFill(h || "");
        setTrFill(tr || "");
      } else {
        setQFill("Complete: She felt deep ___ after her mistake.");
        setHFill("regret/guilt (noun)");
        setTrFill(
          showTranslations && supportCode === "es"
            ? "Completa: Sintió un profundo ___ tras su error."
            : ""
        );
      }
    } finally {
      setLoadingQFill(false);
    }
  }

  async function submitFill() {
    if (!qFill || !ansFill.trim()) return;
    setLoadingGFill(true);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildFillVocabJudgePrompt({
        targetLang,
        level,
        sentence: qFill,
        userAnswer: ansFill,
        hint: hFill,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 10 : 0; // ✅ no XP for wrong answers

    await saveAttempt(npub, {
      ok,
      mode: "vocab_fill",
      question: qFill,
      hint: hFill,
      translation: trFill,
      user_input: ansFill,
      award_xp: delta,
    }).catch(() => {});
    if (delta > 0) await awardXp(npub, delta).catch(() => {});

    setResFill(ok ? "correct" : "try_again"); // log only
    setLastOk(ok);
    setRecentXp(delta);

    // ✅ If user hasn't locked a type, keep randomizing; otherwise stick to locked type
    const nextFn = ok
      ? lockedType
        ? () => generatorFor(lockedType)()
        : () => generateRandomRef.current()
      : null;
    setNextAction(() => nextFn);

    if (ok) {
      setAnsFill("");
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "fill", question: qFill },
      ].slice(-5);
    }

    setLoadingGFill(false);
  }

  /* ---------------------------
     STREAM Generate — MC
  --------------------------- */
  async function generateMC() {
    setMode("mc");
    setLoadingQMC(true);
    setResMC("");
    setPickMC("");
    setMcLayout("buttons");
    setMcSlotIndex(null);
    setMcBankOrder([]);
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    // reset for streaming placeholders
    setQMC("");
    setHMC("");
    setChoicesMC([]);
    setAnswerMC("");
    setTrMC("");

    const prompt = buildMCVocabStreamPrompt({
      level,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      xp,
      recentGood: recentCorrectRef.current,
    });

    let got = false;
    let pendingAnswer = "";

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");

      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;

        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (obj?.type === "vocab_mc" && obj.phase === "q" && obj.question) {
              setQMC(String(obj.question));
              got = true;
            } else if (
              obj?.type === "vocab_mc" &&
              obj.phase === "choices" &&
              Array.isArray(obj.choices)
            ) {
              const choices = obj.choices.slice(0, 4).map(String);
              setChoicesMC(choices);
              // if answer already known from meta, align it
              if (pendingAnswer) {
                const ans =
                  choices.find((c) => norm(c) === norm(pendingAnswer)) ||
                  choices[0];
                setAnswerMC(ans);
              }
              got = true;
            } else if (obj?.type === "vocab_mc" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setHMC(obj.hint);
              if (typeof obj.translation === "string") setTrMC(obj.translation);
              if (typeof obj.answer === "string") {
                pendingAnswer = obj.answer;
                if (Array.isArray(choicesMC) && choicesMC.length) {
                  const ans =
                    choicesMC.find((c) => norm(c) === norm(pendingAnswer)) ||
                    choicesMC[0];
                  setAnswerMC(ans);
                }
              }
              got = true;
            }
          });
        }
      }

      // flush tail
      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (finalText) {
        (finalText + "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) =>
            tryConsumeLine(l, (obj) => {
              if (
                obj?.type === "vocab_mc" &&
                obj.phase === "q" &&
                obj.question
              ) {
                setQMC(String(obj.question));
                got = true;
              } else if (
                obj?.type === "vocab_mc" &&
                obj.phase === "choices" &&
                Array.isArray(obj.choices)
              ) {
                const choices = obj.choices.slice(0, 4).map(String);
                setChoicesMC(choices);
                if (pendingAnswer) {
                  const ans =
                    choices.find((c) => norm(c) === norm(pendingAnswer)) ||
                    choices[0];
                  setAnswerMC(ans);
                }
                got = true;
              } else if (obj?.type === "vocab_mc" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setHMC(obj.hint);
                if (typeof obj.translation === "string")
                  setTrMC(obj.translation);
                if (typeof obj.answer === "string") {
                  pendingAnswer = obj.answer;
                  if (Array.isArray(choicesMC) && choicesMC.length) {
                    const ans =
                      choicesMC.find((c) => norm(c) === norm(pendingAnswer)) ||
                      choicesMC[0];
                    setAnswerMC(ans);
                  }
                }
                got = true;
              }
            })
          );
      }

      if (!got) throw new Error("no-mc");
    } catch {
      // Fallback (non-stream)
      const text = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(targetLang)} vocab MCQ (1 correct). Return JSON ONLY:
{
  "question":"<stem>",
  "hint":"<hint in ${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )}>",
  "choices":["A","B","C","D"],
  "answer":"<exact correct choice>",
  "translation":"${showTranslations ? "<translation>" : ""}"
}
`.trim(),
      });

      const parsed = safeParseJSON(text);
      if (
        parsed &&
        parsed.question &&
        Array.isArray(parsed.choices) &&
        parsed.choices.length >= 3
      ) {
        const choices = parsed.choices.slice(0, 4).map(String);
        const ans =
          choices.find((c) => norm(c) === norm(parsed.answer)) || choices[0];
        setQMC(String(parsed.question));
        setHMC(String(parsed.hint || ""));
        setChoicesMC(choices);
        setAnswerMC(ans);
        setTrMC(String(parsed.translation || ""));
      } else {
        setQMC("Choose the best synonym for “quick”.");
        setHMC("synonym");
        const choices = ["rapid", "slow", "late", "sleepy"];
        setChoicesMC(choices);
        setAnswerMC("rapid");
        setTrMC(
          showTranslations && supportCode === "es"
            ? "Elige el mejor sinónimo de “quick”."
            : ""
        );
      }
    } finally {
      setLoadingQMC(false);
    }
  }

  async function submitMC() {
    if (!qMC || !pickMC) return;
    setLoadingGMC(true);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMCVocabJudgePrompt({
        targetLang,
        stem: qMC,
        choices: choicesMC,
        userChoice: pickMC,
        hint: hMC,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 8 : 0; // ✅ no XP for wrong answers

    await saveAttempt(npub, {
      ok,
      mode: "vocab_mc",
      question: qMC,
      hint: hMC,
      translation: trMC,
      choices: choicesMC,
      author_answer: answerMC,
      user_choice: pickMC,
      award_xp: delta,
    }).catch(() => {});
    if (delta > 0) await awardXp(npub, delta).catch(() => {});

    setResMC(ok ? "correct" : "try_again"); // log only
    setLastOk(ok);
    setRecentXp(delta);

    const nextFn = ok
      ? lockedType
        ? () => generatorFor(lockedType)()
        : () => generateRandomRef.current()
      : null;
    setNextAction(() => nextFn);

    if (ok) {
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "mc", question: qMC },
      ].slice(-5);
    }

    setLoadingGMC(false);
  }

  /* ---------------------------
     STREAM Generate — MA
  --------------------------- */
  function sanitizeMA(parsed) {
    if (
      !parsed ||
      typeof parsed.question !== "string" ||
      !Array.isArray(parsed.choices) ||
      !Array.isArray(parsed.answers)
    )
      return null;

    const uniqByNorm = (arr) => {
      const seen = new Set();
      const out = [];
      for (const s of arr) {
        const k = norm(s);
        if (!seen.has(k)) {
          seen.add(k);
          out.push(String(s));
        }
      }
      return out;
    };

    const choices = uniqByNorm(parsed.choices).slice(0, 6);
    const answers = uniqByNorm(parsed.answers).filter((a) =>
      choices.some((c) => norm(c) === norm(a))
    );

    if (choices.length < 4) return null;
    if (answers.length < 2 || answers.length > 3) return null;

    return {
      question: String(parsed.question),
      hint: String(parsed.hint || ""),
      choices,
      answers,
      translation: String(parsed.translation || ""),
    };
  }

  async function generateMA() {
    setMode("ma");
    setLoadingQMA(true);
    setResMA("");
    setPicksMA([]);
    setMaLayout("buttons");
    setMaSlots([]);
    setMaBankOrder([]);
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    setQMA("");
    setHMA("");
    setChoicesMA([]);
    setAnswersMA([]);
    setTrMA("");

    const prompt = buildMAVocabStreamPrompt({
      level,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      xp,
      recentGood: recentCorrectRef.current,
    });

    let got = false;
    let pendingAnswers = [];

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");

      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;

        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (obj?.type === "vocab_ma" && obj.phase === "q" && obj.question) {
              setQMA(String(obj.question));
              got = true;
            } else if (
              obj?.type === "vocab_ma" &&
              obj.phase === "choices" &&
              Array.isArray(obj.choices)
            ) {
              const choices = obj.choices.slice(0, 6).map(String);
              setChoicesMA(choices);
              if (pendingAnswers?.length) {
                const aligned = pendingAnswers.filter((a) =>
                  choices.some((c) => norm(c) === norm(a))
                );
                if (aligned.length >= 2) setAnswersMA(aligned);
              }
              got = true;
            } else if (obj?.type === "vocab_ma" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setHMA(obj.hint);
              if (typeof obj.translation === "string") setTrMA(obj.translation);
              if (Array.isArray(obj.answers)) {
                pendingAnswers = obj.answers.map(String);
                if (Array.isArray(choicesMA) && choicesMA.length) {
                  const aligned = pendingAnswers.filter((a) =>
                    choicesMA.some((c) => norm(c) === norm(a))
                  );
                  if (aligned.length >= 2) setAnswersMA(aligned);
                }
              }
              got = true;
            }
          });
        }
      }

      // flush tail
      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (finalText) {
        (finalText + "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) =>
            tryConsumeLine(l, (obj) => {
              if (
                obj?.type === "vocab_ma" &&
                obj.phase === "q" &&
                obj.question
              ) {
                setQMA(String(obj.question));
                got = true;
              } else if (
                obj?.type === "vocab_ma" &&
                obj.phase === "choices" &&
                Array.isArray(obj.choices)
              ) {
                const choices = obj.choices.slice(0, 6).map(String);
                setChoicesMA(choices);
                if (pendingAnswers?.length) {
                  const aligned = pendingAnswers.filter((a) =>
                    choices.some((c) => norm(c) === norm(a))
                  );
                  if (aligned.length >= 2) setAnswersMA(aligned);
                }
                got = true;
              } else if (obj?.type === "vocab_ma" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setHMA(obj.hint);
                if (typeof obj.translation === "string")
                  setTrMA(obj.translation);
                if (Array.isArray(obj.answers)) {
                  pendingAnswers = obj.answers.map(String);
                  if (Array.isArray(choicesMA) && choicesMA.length) {
                    const aligned = pendingAnswers.filter((a) =>
                      choicesMA.some((c) => norm(c) === norm(a))
                    );
                    if (aligned.length >= 2) setAnswersMA(aligned);
                  }
                }
                got = true;
              }
            })
          );
      }

      if (!got) throw new Error("no-ma");
    } catch {
      // Fallback (non-stream)
      const text = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(targetLang)} vocab MAQ (2–3 correct). Return JSON ONLY:
{
  "question":"<stem>",
  "hint":"<hint in ${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )}>",
  "choices":["...","...","...","...","..."],
  "answers":["<correct>","<correct>"],
  "translation":"${showTranslations ? "<translation>" : ""}"
}
`.trim(),
      });

      const parsed = sanitizeMA(safeParseJSON(text));
      if (parsed) {
        setQMA(parsed.question);
        setHMA(parsed.hint);
        setChoicesMA(parsed.choices);
        setAnswersMA(parsed.answers);
        setTrMA(parsed.translation);
      } else {
        setQMA("Select all synonyms of “angry”.");
        setHMA("synonyms");
        const choices = ["furious", "irate", "calm", "content", "mad"];
        setChoicesMA(choices);
        setAnswersMA(["furious", "irate", "mad"]);
        setTrMA(
          showTranslations && supportCode === "es"
            ? "Selecciona todos los sinónimos de “angry”."
            : ""
        );
      }
    } finally {
      setLoadingQMA(false);
    }
  }

  async function submitMA() {
    if (!qMA || !picksMA.length) return;
    setLoadingGMA(true);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMAVocabJudgePrompt({
        targetLang,
        stem: qMA,
        choices: choicesMA,
        userSelections: picksMA,
        hint: hMA,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 10 : 0; // ✅ no XP for wrong answers

    await saveAttempt(npub, {
      ok,
      mode: "vocab_ma",
      question: qMA,
      hint: hMA,
      translation: trMA,
      choices: choicesMA,
      author_answers: answersMA,
      user_choices: picksMA,
      award_xp: delta,
    }).catch(() => {});
    if (delta > 0) await awardXp(npub, delta).catch(() => {});

    setResMA(ok ? "correct" : "try_again"); // log only
    setLastOk(ok);
    setRecentXp(delta);
    const nextFn = ok
      ? lockedType
        ? () => generatorFor(lockedType)()
        : () => generateRandomRef.current()
      : null;
    setNextAction(() => nextFn);

    if (ok) {
      setPicksMA([]);
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "ma", question: qMA },
      ].slice(-5);
    }

    setLoadingGMA(false);
  }

  async function generateSpeak() {
    try {
      stopSpeakRecording();
    } catch {}
    setMode("speak");
    setLoadingQSpeak(true);
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);
    setSPrompt("");
    setSTarget("");
    setSStimulus("");
    setSVariant("repeat");
    setSHint("");
    setSTranslation("");
    setSRecognized("");
    setSEval(null);

    const prompt = buildSpeakVocabStreamPrompt({
      level,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
      xp,
      recentGood: recentCorrectRef.current,
    });

    let got = false;

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");

      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;

        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (obj?.type === "vocab_speak" && obj.phase === "prompt") {
              if (typeof obj.prompt === "string") setSPrompt(obj.prompt.trim());
              if (typeof obj.target === "string") setSTarget(obj.target.trim());
              if (typeof obj.display === "string")
                setSStimulus(obj.display.trim());
              if (typeof obj.variant === "string")
                setSVariant(normalizeSpeakVariant(obj.variant));
              got = true;
            } else if (obj?.type === "vocab_speak" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setSHint(obj.hint);
              if (typeof obj.translation === "string")
                setSTranslation(obj.translation);
              got = true;
            }
          });
        }
      }

      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (finalText) {
        (finalText + "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) =>
            tryConsumeLine(l, (obj) => {
              if (obj?.type === "vocab_speak" && obj.phase === "prompt") {
                if (typeof obj.prompt === "string")
                  setSPrompt(obj.prompt.trim());
                if (typeof obj.target === "string")
                  setSTarget(obj.target.trim());
                if (typeof obj.display === "string")
                  setSStimulus(obj.display.trim());
                if (typeof obj.variant === "string")
                  setSVariant(normalizeSpeakVariant(obj.variant));
                got = true;
              } else if (obj?.type === "vocab_speak" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setSHint(obj.hint);
                if (typeof obj.translation === "string")
                  setSTranslation(obj.translation);
                got = true;
              }
            })
          );
      }

      if (!got) throw new Error("no-speak");
    } catch {
      const text = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(targetLang)} speaking drill. Randomly choose VARIANT from:
- repeat: show the ${LANG_NAME(targetLang)} word/phrase and have them repeat it aloud.
- translate: show a ${LANG_NAME(resolveSupportLang(
          supportLang,
          userLanguage
        ))} word and have them speak the ${LANG_NAME(targetLang)} translation aloud.
- complete: show a ${LANG_NAME(targetLang)} sentence with ___ and have them speak the completed sentence aloud.

Return JSON ONLY:
{
  "variant":"repeat"|"translate"|"complete",
  "prompt":"<${LANG_NAME(targetLang)} instruction>",
  "display":"<text to show the learner>",
  "target":"<${LANG_NAME(targetLang)} text they must say>",
  "hint":"<${LANG_NAME(resolveSupportLang(supportLang, userLanguage))} hint>",
  "translation":"${
          showTranslations
            ? `<${LANG_NAME(resolveSupportLang(supportLang, userLanguage))} translation or context>`
            : ""
        }"
}`.trim(),
      });

      const parsed = safeParseJSON(text);
      if (parsed && typeof parsed.target === "string") {
        setSTarget(parsed.target.trim());
        setSStimulus(String(parsed.display || parsed.target || "").trim());
        setSVariant(normalizeSpeakVariant(parsed.variant));
        setSPrompt(String(parsed.prompt || ""));
        setSHint(String(parsed.hint || ""));
        setSTranslation(String(parsed.translation || ""));
      } else {
        const fallbackOptions = ["repeat", "complete"];
        if (supportCode !== (targetLang === "en" ? "en" : targetLang)) {
          fallbackOptions.splice(1, 0, "translate");
        }
        const fallbackVariant =
          fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
        setSVariant(normalizeSpeakVariant(fallbackVariant));
        if (fallbackVariant === "translate") {
          const supportWord = supportCode === "es" ? "bosque" : "forest";
          setSStimulus(supportWord);
          setSTarget(
            targetLang === "es"
              ? "bosque"
              : targetLang === "nah"
              ? "kwawitl"
              : "forest"
          );
          setSPrompt(
            targetLang === "es"
              ? `Traduce en voz alta: ${supportWord}.`
              : targetLang === "nah"
              ? `Kijtoa tlen nechicoliz: ${supportWord}.`
              : `Translate aloud: ${supportWord}.`
          );
          setSHint(
            supportCode === "es"
              ? "Di la versión en español"
              : "Say it in the target language"
          );
          setSTranslation(
            showTranslations
              ? supportCode === "es"
                ? "bosque"
                : "forest"
              : ""
          );
        } else if (fallbackVariant === "complete") {
          const cloze =
            targetLang === "es"
              ? "Completa: La niña ___ una canción."
              : targetLang === "nah"
              ? "Tlatzotzona: Pilli ___ tlahkuiloa."
              : "Complete: The child ___ a song.";
          const completed =
            targetLang === "es"
              ? "La niña canta una canción."
              : targetLang === "nah"
              ? "Pilli tlahkuiloa tlatzotzontli."
              : "The child sings a song.";
          setSStimulus(cloze);
          setSTarget(completed);
          setSPrompt(
            targetLang === "es"
              ? "Di la oración completa con la palabra que falta."
              : targetLang === "nah"
              ? "Kijtoa nochi tlahtolli tlen mokpano."
              : "Say the full sentence with the missing word."
          );
          setSHint(
            supportCode === "es"
              ? "El verbo es 'cantar'"
              : "The verb is 'to sing'"
          );
          setSTranslation(
            showTranslations
              ? supportCode === "es"
                ? "La niña canta una canción."
                : "The girl sings a song."
              : ""
          );
        } else {
          const repeatWord =
            targetLang === "es"
              ? "sonrisa"
              : targetLang === "nah"
              ? "yolpaki"
              : "harmony";
          setSStimulus(repeatWord);
          setSTarget(repeatWord);
          setSPrompt(
            targetLang === "es"
              ? "Di la palabra claramente: sonrisa."
              : targetLang === "nah"
              ? "Pronuncia la palabra con calma: yolpaki."
              : "Say this word out loud: harmony."
          );
          setSHint(
            supportCode === "es" ? "significa felicidad" : "means happiness"
          );
          setSTranslation(
            showTranslations
              ? supportCode === "es"
                ? "sonrisa"
                : "harmony"
              : ""
          );
        }
      }
    } finally {
      setLoadingQSpeak(false);
    }
  }

  /* ---------------------------
     STREAM Generate — MATCH (DnD)
  --------------------------- */
  async function generateMatch() {
    setMode("match");
    setLoadingMG(true);
    setMResult("");
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    // reset state to show placeholders
    setMStem("");
    setMHint("");
    setMLeft([]);
    setMRight([]);
    setMSlots([]);
    setMBank([]);

    const prompt = buildMatchVocabStreamPrompt({
      targetLang,
      supportLang,
      appUILang: userLanguage,
      level,
      xp,
      recentGood: recentCorrectRef.current,
    });

    let okPayload = false;

    try {
      if (!simplemodel) throw new Error("gemini-unavailable");

      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let buffer = "";
      for await (const chunk of resp.stream) {
        const piece = textFromChunk(chunk);
        if (!piece) continue;
        buffer += piece;

        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          tryConsumeLine(line, (obj) => {
            if (
              obj?.type === "vocab_match" &&
              typeof obj.stem === "string" &&
              Array.isArray(obj.left) &&
              Array.isArray(obj.right) &&
              obj.left.length >= 3 &&
              obj.left.length <= 6 &&
              obj.left.length === obj.right.length
            ) {
              const stem =
                String(obj.stem).trim() ||
                "Match the words to their definitions.";
              const left = obj.left.slice(0, 6).map(String);
              const right = obj.right.slice(0, 6).map(String);
              const hint = String(obj.hint || "");
              setMStem(stem);
              setMHint(hint);
              setMLeft(left);
              setMRight(right);
              setMSlots(Array(left.length).fill(null));
              setMBank([...Array(right.length)].map((_, i) => i));
              okPayload = true;
            }
          });
        }
      }

      // flush tail
      const finalAgg = await resp.response;
      const finalText =
        (typeof finalAgg?.text === "function"
          ? finalAgg.text()
          : finalAgg?.text) || "";
      if (finalText) {
        (finalText + "\n")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) =>
            tryConsumeLine(l, (obj) => {
              if (
                obj?.type === "vocab_match" &&
                typeof obj.stem === "string" &&
                Array.isArray(obj.left) &&
                Array.isArray(obj.right) &&
                obj.left.length >= 3 &&
                obj.left.length <= 6 &&
                obj.left.length === obj.right.length
              ) {
                const stem =
                  String(obj.stem).trim() ||
                  "Match the words to their definitions.";
                const left = obj.left.slice(0, 6).map(String);
                const right = obj.right.slice(0, 6).map(String);
                const hint = String(obj.hint || "");
                setMStem(stem);
                setMHint(hint);
                setMLeft(left);
                setMRight(right);
                setMSlots(Array(left.length).fill(null));
                setMBank([...Array(right.length)].map((_, i) => i));
                okPayload = true;
              }
            })
          );
      }

      if (!okPayload) throw new Error("no-match");
    } catch {
      // Backend fallback (non-stream)
      const raw = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(targetLang)} vocabulary matching set. Return JSON ONLY:
{"stem":"<stem>","left":["<word>","..."],"right":["<short ${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )} definition>","..."],"hint":"<${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )} hint>"}
`.trim(),
      });
      const parsed = safeParseJsonLoose(raw);

      let stem = "",
        left = [],
        right = [],
        hint = "";

      if (
        parsed &&
        Array.isArray(parsed.left) &&
        Array.isArray(parsed.right) &&
        parsed.left.length >= 3 &&
        parsed.left.length <= 6 &&
        parsed.left.length === parsed.right.length
      ) {
        stem = String(parsed.stem || "Match the words to their definitions.");
        left = parsed.left.slice(0, 6).map(String);
        right = parsed.right.slice(0, 6).map(String);
        hint = String(parsed.hint || "");
      } else {
        stem = "Match words to their definitions.";
        left = ["rapid", "generous", "fragile"];
        right = ["quick", "kind in giving", "easily broken"];
        hint = "synonym match";
      }

      setMStem(stem);
      setMHint(hint);
      setMLeft(left);
      setMRight(right);
      setMSlots(Array(left.length).fill(null));
      setMBank([...Array(right.length)].map((_, i) => i));
    } finally {
      setLoadingMG(false);
    }
  }

  function canSubmitMatch() {
    return mLeft.length > 0 && mSlots.every((ri) => ri !== null);
  }

  async function submitMatch() {
    if (!canSubmitMatch()) return;
    setLoadingMJ(true);

    const userPairs = mSlots.map((ri, li) => [li, ri]);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMatchVocabJudgePrompt({
        stem: mStem,
        left: mLeft,
        right: mRight,
        userPairs,
        hint: mHint,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 12 : 0; // ✅ no XP for wrong answers

    await saveAttempt(npub, {
      ok,
      mode: "vocab_match",
      question: mStem,
      hint: mHint,
      left: mLeft,
      right: mRight,
      user_pairs: userPairs,
      award_xp: delta,
    }).catch(() => {});
    if (delta > 0) await awardXp(npub, delta).catch(() => {});

    setMResult(ok ? "correct" : "try_again"); // log only
    setLastOk(ok);
    setRecentXp(delta);
    const nextFn = ok
      ? lockedType
        ? () => generatorFor(lockedType)()
        : () => generateRandom()
      : null;
    setNextAction(() => nextFn);

    setLoadingMJ(false);
  }

  const handleSpeakEvaluation = useCallback(
    async ({
      evaluation,
      recognizedText = "",
      confidence = 0,
      audioMetrics = null,
      method = "",
      error = null,
    }) => {
      if (!sTarget) return;
      if (error) {
        toast({
          title:
            userLanguage === "es"
              ? "No se pudo evaluar"
              : "Could not evaluate",
          description:
            userLanguage === "es"
              ? "Vuelve a intentarlo con una conexión estable."
              : "Please try again with a stable connection.",
          status: "error",
          duration: 2500,
        });
        return;
      }
      if (!evaluation) return;

      setSRecognized(recognizedText || "");
      setSEval(evaluation);

      const ok = evaluation.pass;
      const delta = ok ? 14 : 0;

      await saveAttempt(npub, {
        ok,
        mode: "vocab_speak",
        question: sPrompt,
        target: sTarget,
        stimulus: sStimulus,
        variant: sVariant,
        hint: sHint,
        translation: sTranslation,
        recognized_text: recognizedText || "",
        confidence,
        audio_metrics: audioMetrics,
        eval: evaluation,
        method,
        award_xp: delta,
      }).catch(() => {});
      if (delta > 0) await awardXp(npub, delta).catch(() => {});

      setLastOk(ok);
      setRecentXp(delta);
      const nextFn = ok
        ? lockedType
          ? () => generatorFor(lockedType)()
          : () => generateRandomRef.current()
        : null;
      setNextAction(() => nextFn);

      if (ok) {
        recentCorrectRef.current = [
          ...recentCorrectRef.current,
          { mode: "speak", question: sStimulus || sTarget, variant: sVariant },
        ].slice(-5);
      } else {
        const tips = speechReasonTips(evaluation.reasons, {
          uiLang: userLanguage,
          targetLabel: targetName,
        });
        const retryTitle =
          t("vocab_speak_retry_title") ||
          (userLanguage === "es" ? "Intenta otra vez" : "Try again");
        toast({
          title: retryTitle,
          description: tips.join(" "),
          status: "warning",
          duration: 3600,
        });
      }
    },
    [
      lockedType,
      npub,
      sHint,
      sPrompt,
      sStimulus,
      sTarget,
      sTranslation,
      sVariant,
      t,
      targetName,
      toast,
      userLanguage,
    ]
  );

  const {
    startRecording: startSpeakRecording,
    stopRecording: stopSpeakRecording,
    isRecording: isSpeakRecording,
    supportsSpeech: supportsSpeak,
  } = useSpeechPractice({
    targetText: sTarget,
    targetLang,
    onResult: handleSpeakEvaluation,
  });

  /* ---------------------------
     Drag & Drop handlers (Match)
  --------------------------- */
  function onDragEnd(result) {
    if (!result?.destination) return;
    const { source, destination, draggableId } = result;
    const ri = parseInt(draggableId.replace("r-", ""), 10);
    if (Number.isNaN(ri)) return;

    // To bank
    if (destination.droppableId === "bank") {
      const nextSlots = mSlots.map((a) => (a === ri ? null : a));
      const filtered = mBank.filter((x) => x !== ri);
      filtered.splice(destination.index, 0, ri);
      setMSlots(nextSlots);
      setMBank(filtered);
      return;
    }

    // To a slot
    if (destination.droppableId.startsWith("slot-")) {
      const dest = parseInt(destination.droppableId.replace("slot-", ""), 10);
      if (Number.isNaN(dest)) return;

      // From bank -> slot
      if (source.droppableId === "bank") {
        const filtered = mBank.filter((x) => x !== ri);
        const prevInSlot = mSlots[dest];
        const nextSlots = [...mSlots];
        nextSlots[dest] = ri;
        setMSlots(nextSlots);
        if (prevInSlot !== null) setMBank([...filtered, prevInSlot]);
        else setMBank(filtered);
        return;
      }

      // From slot -> slot
      if (source.droppableId.startsWith("slot-")) {
        const src = parseInt(source.droppableId.replace("slot-", ""), 10);
        if (Number.isNaN(src) || src === dest) return;
        const nextSlots = [...mSlots];
        const prevDest = nextSlots[dest];
        nextSlots[dest] = ri;
        nextSlots[src] = null;
        setMSlots(nextSlots);
        if (prevDest !== null) setMBank((b) => [...b, prevDest]);
      }
    }
  }

  const showTRFill =
    showTranslations &&
    trFill &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRMC =
    showTranslations &&
    trMC &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRMA =
    showTranslations &&
    trMA &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRSpeak =
    showTranslations &&
    sTranslation &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);

  const speakVariantLabel = useMemo(() => {
    switch (sVariant) {
      case "translate":
        return (
          t("vocab_speak_variant_translate") ||
          (userLanguage === "es" ? "Traduce la palabra" : "Translate the word")
        );
      case "complete":
        return (
          t("vocab_speak_variant_complete") ||
          (userLanguage === "es"
            ? "Completa la oración"
            : "Complete the sentence")
        );
      case "repeat":
      default:
        return (
          t("vocab_speak_variant_repeat") ||
          (userLanguage === "es"
            ? "Pronuncia la palabra"
            : "Speak the word")
        );
    }
  }, [sVariant, t, userLanguage]);

  /* ---------------------------
     AUTO-GENERATE on first render (respecting user settings)
     - Wait until 'ready' so target/support languages are applied.
     - Randomize by default; only lock when user picks a type explicitly.
  --------------------------- */
  const autoInitRef = useRef(false);
  useEffect(() => {
    if (autoInitRef.current) return;
    if (showPasscodeModal) return;
    if (!ready) return; // ✅ wait for user progress to load
    autoInitRef.current = true;
    generateRandom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, showPasscodeModal]);

  if (showPasscodeModal) {
    return (
      <PasscodePage
        userLanguage={user?.appLanguage}
        setShowPasscodeModal={setShowPasscodeModal}
      />
    );
  }

  // Single copy button (left of question)
  const CopyAllBtn = ({ q, h, tr }) => {
    const has = (q && q.trim()) || (h && h.trim()) || (tr && tr.trim());
    if (!has) return null;
    return (
      <Tooltip
        label={
          t("copy_all") || (userLanguage === "es" ? "Copiar todo" : "Copy all")
        }
      >
        <IconButton
          aria-label="Copy all"
          icon={<FiCopy />}
          size="xs"
          variant="ghost"
          onClick={() => copyAll(q, h, tr)}
          mr={1}
        />
      </Tooltip>
    );
  };

  // Result badge (only feedback shown)
  const ResultBadge = ({ ok, xp }) => {
    if (ok === null) return null;
    const label = ok
      ? t("correct") || "Correct!"
      : t("try_again") || "Try again";
    return (
      <Badge
        colorScheme={ok ? "green" : "red"}
        variant="solid"
        borderRadius="full"
        px={3}
        py={1}
      >
        {ok ? "✓" : "✖"} {label} · +{xp} XP {ok ? "🎉" : ""}
      </Badge>
    );
  };

  const dragPlaceholderLabel =
    t("practice_drag_drop_slot_placeholder") ||
    (userLanguage === "es"
      ? "Suelta la respuesta aquí"
      : "Drop the answer here");

  const renderMcPrompt = () => {
    if (!qMC) return null;
    const segments = String(qMC).split("___");
    if (segments.length === 1) {
      return qMC;
    }
    let blankPlaced = false;
    const nodes = [];
    segments.forEach((segment, idx) => {
      nodes.push(
        <React.Fragment key={`mc-segment-${idx}`}>{segment}</React.Fragment>
      );
      if (idx < segments.length - 1) {
        if (blankPlaced) {
          nodes.push(
            <React.Fragment key={`mc-gap-${idx}`}>___</React.Fragment>
          );
          return;
        }
        blankPlaced = true;
        nodes.push(
          <Droppable
            droppableId="mc-slot"
            direction="horizontal"
            key={`mc-blank-${idx}`}
          >
            {(provided, snapshot) => (
              <Box
                as="span"
                ref={provided.innerRef}
                {...provided.droppableProps}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                minW="72px"
                minH="32px"
                px={2}
                py={1}
                mx={1}
                borderRadius="md"
                borderBottomWidth="2px"
                borderBottomColor={
                  snapshot.isDraggingOver
                    ? "purple.300"
                    : "rgba(255,255,255,0.6)"
                }
                bg={
                  snapshot.isDraggingOver
                    ? "rgba(128,90,213,0.18)"
                    : "rgba(255,255,255,0.08)"
                }
                transition="all 0.2s ease"
              >
                {mcSlotIndex != null ? (
                  <Draggable draggableId={`mc-${mcSlotIndex}`} index={0}>
                    {(dragProvided, snapshot) => (
                      <Box
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={{
                          cursor: "grab",
                          ...(dragProvided.draggableProps.style || {}),
                        }}
                        px={3}
                        py={2}
                        rounded="md"
                        borderWidth="1px"
                        borderColor={
                          snapshot.isDragging
                            ? "purple.300"
                            : "rgba(255,255,255,0.22)"
                        }
                        bg={
                          snapshot.isDragging
                            ? "rgba(128,90,213,0.24)"
                            : "purple.600"
                        }
                        color="white"
                        fontSize="sm"
                      >
                        {choicesMC[mcSlotIndex]}
                      </Box>
                    )}
                  </Draggable>
                ) : (
                  <Text as="span" fontSize="sm" opacity={0.7}>
                    {dragPlaceholderLabel}
                  </Text>
                )}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        );
      }
    });
    return nodes;
  };

  const renderMaPrompt = () => {
    if (!qMA) return null;
    const segments = String(qMA).split("___");
    if (segments.length === 1) {
      return qMA;
    }
    let slotNumber = 0;
    const nodes = [];
    segments.forEach((segment, idx) => {
      nodes.push(
        <React.Fragment key={`ma-segment-${idx}`}>{segment}</React.Fragment>
      );
      if (idx < segments.length - 1) {
        const currentSlot = slotNumber;
        slotNumber += 1;
        if (currentSlot >= maSlots.length) {
          nodes.push(
            <React.Fragment key={`ma-gap-${idx}`}>___</React.Fragment>
          );
          return;
        }
        const choiceIdx = maSlots[currentSlot];
        nodes.push(
          <Droppable
            droppableId={`ma-slot-${currentSlot}`}
            direction="horizontal"
            key={`ma-blank-${currentSlot}`}
          >
            {(provided, snapshot) => (
              <Box
                as="span"
                ref={provided.innerRef}
                {...provided.droppableProps}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                minW="72px"
                minH="32px"
                px={2}
                py={1}
                mx={1}
                borderRadius="md"
                borderBottomWidth="2px"
                borderBottomColor={
                  snapshot.isDraggingOver
                    ? "purple.300"
                    : "rgba(255,255,255,0.6)"
                }
                bg={
                  snapshot.isDraggingOver
                    ? "rgba(128,90,213,0.18)"
                    : "rgba(255,255,255,0.08)"
                }
                transition="all 0.2s ease"
              >
                {choiceIdx != null ? (
                  <Draggable draggableId={`ma-${choiceIdx}`} index={0}>
                    {(dragProvided, snapshot) => (
                      <Box
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={{
                          cursor: "grab",
                          ...(dragProvided.draggableProps.style || {}),
                        }}
                        px={3}
                        py={2}
                        rounded="md"
                        borderWidth="1px"
                        borderColor={
                          snapshot.isDragging
                            ? "purple.300"
                            : "rgba(255,255,255,0.22)"
                        }
                        bg={
                          snapshot.isDragging
                            ? "rgba(128,90,213,0.24)"
                            : "purple.600"
                        }
                        color="white"
                        fontSize="sm"
                      >
                        {choicesMA[choiceIdx]}
                      </Box>
                    )}
                  </Draggable>
                ) : (
                  <Text as="span" fontSize="sm" opacity={0.7}>
                    {dragPlaceholderLabel}
                  </Text>
                )}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        );
      }
    });
    return nodes;
  };

  const nextLabel =
    t("practice_next_question") ||
    (userLanguage === "es" ? "Siguiente pregunta" : "Next question");

  const maReady =
    maLayout === "drag"
      ? maSlots.length > 0 && maSlots.every((slot) => slot != null)
      : picksMA.length > 0;

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch" maxW="720px" mx="auto">
        {/* Shared progress header */}
        <Box display={"flex"} justifyContent={"center"}>
          <Box w="50%" justifyContent={"center"}>
            <HStack justify="space-between" mb={1}>
              <Badge variant="subtle">
                {t("vocab_badge_level", { level: levelNumber })}
              </Badge>
              <Badge variant="subtle">{t("vocab_badge_xp", { xp })}</Badge>
            </HStack>
            <WaveBar value={progressPct} />
          </Box>
        </Box>

        {/* Context chips */}
        <HStack spacing={2}>
          <Badge variant="outline">{targetName}</Badge>
          <Badge variant="outline">{supportName}</Badge>
          <Badge variant="subtle">{levelLabel}</Badge>
        </HStack>

        {/* ---- FILL UI ---- */}
        {mode === "fill" && (qFill || loadingQFill) ? (
          <>
            <HStack align="start">
              <CopyAllBtn q={qFill} h={hFill} tr={showTRFill ? trFill : ""} />
              <Text fontWeight="semibold" flex="1">
                {qFill || (loadingQFill ? "…" : "")}
              </Text>
            </HStack>
            {showTRFill && trFill ? (
              <Text fontSize="sm" opacity={0.8}>
                {trFill}
              </Text>
            ) : null}
            {hFill ? (
              <Text fontSize="sm" opacity={0.85}>
                💡 {hFill}
              </Text>
            ) : null}

            <HStack>
              <Input
                value={ansFill}
                onChange={(e) => setAnsFill(e.target.value)}
                placeholder={t("vocab_input_placeholder_word")}
                isDisabled={loadingGFill}
              />
              <Button
                onClick={submitFill}
                isDisabled={loadingGFill || !ansFill.trim() || !qFill}
              >
                {loadingGFill ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
              {lastOk === true && nextAction ? (
                <Button variant="outline" onClick={handleNext}>
                  {nextLabel}
                </Button>
              ) : null}
            </HStack>

            <HStack spacing={3} mt={1}>
              <ResultBadge ok={lastOk} xp={recentXp} />
            </HStack>
          </>
        ) : null}

        {/* ---- MC UI ---- */}
        {mode === "mc" && (qMC || loadingQMC) ? (
          <>
            {mcLayout === "drag" ? (
              <DragDropContext onDragEnd={handleMcDragEnd}>
                <VStack align="stretch" spacing={3}>
                  <HStack align="start">
                    <CopyAllBtn q={qMC} h={hMC} tr={showTRMC ? trMC : ""} />
                    <Text fontWeight="semibold" flex="1">
                      {renderMcPrompt() || (loadingQMC ? "…" : "")}
                    </Text>
                  </HStack>
                  {showTRMC && trMC ? (
                    <Text fontSize="sm" opacity={0.8}>
                      {trMC}
                    </Text>
                  ) : null}
                  {hMC ? (
                    <Text fontSize="sm" opacity={0.85}>
                      💡 {hMC}
                    </Text>
                  ) : null}
                  <Text fontSize="sm" opacity={0.75}>
                    {t("practice_drag_drop_instruction") ||
                      (userLanguage === "es"
                        ? "Arrastra la respuesta correcta al espacio en la frase."
                        : "Drag the correct answer into the blank in the sentence.")}
                  </Text>
                  <Droppable droppableId="mc-bank">
                    {(provided) => (
                      <VStack
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        align="stretch"
                        spacing={2}
                      >
                        {mcBankOrder.map((idx, position) => (
                          <Draggable
                            draggableId={`mc-${idx}`}
                            index={position}
                            key={`mc-bank-${idx}`}
                          >
                            {(dragProvided, snapshot) => (
                              <Box
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{
                                  cursor: "grab",
                                  ...(dragProvided.draggableProps.style || {}),
                                }}
                                px={3}
                                py={2}
                                rounded="md"
                                borderWidth="1px"
                                borderColor={
                                  snapshot.isDragging
                                    ? "purple.300"
                                    : "rgba(255,255,255,0.22)"
                                }
                                bg={
                                  snapshot.isDragging
                                    ? "rgba(128,90,213,0.16)"
                                    : "transparent"
                                }
                                fontSize="sm"
                                textAlign="left"
                                w="100%"
                              >
                                {choicesMC[idx]}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </VStack>
                    )}
                  </Droppable>
                </VStack>
              </DragDropContext>
            ) : (
              <>
                <HStack align="start">
                  <CopyAllBtn q={qMC} h={hMC} tr={showTRMC ? trMC : ""} />
                  <Text fontWeight="semibold" flex="1">
                    {qMC || (loadingQMC ? "…" : "")}
                  </Text>
                </HStack>
                {showTRMC && trMC ? (
                  <Text fontSize="sm" opacity={0.8}>
                    {trMC}
                  </Text>
                ) : null}
                {hMC ? (
                  <Text fontSize="sm" opacity={0.85}>
                    💡 {hMC}
                  </Text>
                ) : null}
                <RadioGroup value={pickMC} onChange={setPickMC}>
                  <Stack spacing={2}>
                    {(choicesMC.length
                      ? choicesMC
                      : loadingQMC
                      ? ["…", "…", "…", "…"]
                      : []
                    ).map((c, i) => (
                      <Radio value={c} key={i} isDisabled={!choicesMC.length}>
                        {c}
                      </Radio>
                    ))}
                  </Stack>
                </RadioGroup>
              </>
            )}

            <HStack>
              <Button
                onClick={submitMC}
                isDisabled={loadingGMC || !pickMC || !choicesMC.length}
              >
                {loadingGMC ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
              {lastOk === true && nextAction ? (
                <Button variant="outline" onClick={handleNext}>
                  {nextLabel}
                </Button>
              ) : null}
            </HStack>

            <HStack spacing={3} mt={1}>
              <ResultBadge ok={lastOk} xp={recentXp} />
            </HStack>
          </>
        ) : null}

        {/* ---- MA UI ---- */}
        {mode === "ma" && (qMA || loadingQMA) ? (
          <>
            {maLayout === "drag" ? (
              <DragDropContext onDragEnd={handleMaDragEnd}>
                <VStack align="stretch" spacing={3}>
                  <HStack align="start">
                    <CopyAllBtn q={qMA} h={hMA} tr={showTRMA ? trMA : ""} />
                    <Text fontWeight="semibold" flex="1">
                      {renderMaPrompt() || (loadingQMA ? "…" : "")}
                    </Text>
                  </HStack>
                  {showTRMA && trMA ? (
                    <Text fontSize="sm" opacity={0.8}>
                      {trMA}
                    </Text>
                  ) : null}
                  {hMA ? (
                    <Text fontSize="sm" opacity={0.85}>
                      💡 {hMA}
                    </Text>
                  ) : null}
                  <Text fontSize="xs" opacity={0.7}>
                    {t("vocab_select_all_apply")}
                  </Text>
                  <Text fontSize="sm" opacity={0.75}>
                    {t("practice_drag_drop_multi_instruction") ||
                      (userLanguage === "es"
                        ? "Arrastra cada respuesta correcta a su espacio en la frase."
                        : "Drag each correct answer into its place in the sentence.")}
                  </Text>
                  <Droppable droppableId="ma-bank">
                    {(provided) => (
                      <VStack
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        align="stretch"
                        spacing={2}
                      >
                        {maBankOrder.map((idx, position) => (
                          <Draggable
                            draggableId={`ma-${idx}`}
                            index={position}
                            key={`ma-bank-${idx}`}
                          >
                            {(dragProvided, snapshot) => (
                              <Box
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{
                                  cursor: "grab",
                                  ...(dragProvided.draggableProps.style || {}),
                                }}
                                px={3}
                                py={2}
                                rounded="md"
                                borderWidth="1px"
                                borderColor={
                                  snapshot.isDragging
                                    ? "purple.300"
                                    : "rgba(255,255,255,0.22)"
                                }
                                bg={
                                  snapshot.isDragging
                                    ? "rgba(128,90,213,0.16)"
                                    : "transparent"
                                }
                                fontSize="sm"
                                textAlign="left"
                                w="100%"
                              >
                                {choicesMA[idx]}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </VStack>
                    )}
                  </Droppable>
                </VStack>
              </DragDropContext>
            ) : (
              <>
                <HStack align="start">
                  <CopyAllBtn q={qMA} h={hMA} tr={showTRMA ? trMA : ""} />
                  <Text fontWeight="semibold" flex="1">
                    {qMA || (loadingQMA ? "…" : "")}
                  </Text>
                </HStack>
                {showTRMA && trMA ? (
                  <Text fontSize="sm" opacity={0.8}>
                    {trMA}
                  </Text>
                ) : null}
                {hMA ? (
                  <Text fontSize="sm" opacity={0.85}>
                    💡 {hMA}
                  </Text>
                ) : null}
                <Text fontSize="xs" opacity={0.7}>
                  {t("vocab_select_all_apply")}
                </Text>
                <CheckboxGroup value={picksMA} onChange={setPicksMA}>
                  <Stack spacing={2}>
                    {(choicesMA.length
                      ? choicesMA
                      : loadingQMA
                      ? ["…", "…", "…", "…", "…"]
                      : []
                    ).map((c, i) => (
                      <Checkbox value={c} key={i} isDisabled={!choicesMA.length}>
                        {c}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </>
            )}

            <HStack>
              <Button
                onClick={submitMA}
                isDisabled={loadingGMA || !choicesMA.length || !maReady}
              >
                {loadingGMA ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
              {lastOk === true && nextAction ? (
                <Button variant="outline" onClick={handleNext}>
                  {nextLabel}
                </Button>
              ) : null}
            </HStack>

            <HStack spacing={3} mt={1}>
              <ResultBadge ok={lastOk} xp={recentXp} />
            </HStack>
          </>
        ) : null}

        {/* ---- SPEAK UI ---- */}
        {mode === "speak" && (sTarget || loadingQSpeak) ? (
          <>
            <HStack align="flex-start" spacing={2} mb={2}>
              <CopyAllBtn
                q={`${sPrompt ? `${sPrompt}\n` : ""}${
                  sStimulus || sTarget || ""
                }`}
                h={sHint}
                tr={sTranslation}
              />
              <VStack align="flex-start" spacing={1} flex="1">
                <Text fontSize="sm" opacity={0.85}>
                  {t("vocab_speak_instruction_label") ||
                    (userLanguage === "es"
                      ? "Sigue la indicación y di la frase en voz alta."
                      : "Follow the prompt and say it aloud.")}
                </Text>
                <Text fontWeight="600" fontSize="md">
                  {loadingQSpeak ? "…" : sPrompt || ""}
                </Text>
              </VStack>
            </HStack>

            <Box
              border="1px solid rgba(255,255,255,0.18)"
              rounded="xl"
              p={6}
              textAlign="center"
              bg="rgba(255,255,255,0.04)"
            >
              <Badge mb={3} colorScheme="purple" fontSize="0.7rem">
                {speakVariantLabel}
              </Badge>
              <Text fontSize="3xl" fontWeight="700">
                {loadingQSpeak ? "…" : sStimulus || sTarget || "…"}
              </Text>
            </Box>

            {sHint ? (
              <Text fontSize="sm" mt={3}>
                <Text as="span" fontWeight="600">
                  {t("vocab_speak_hint_label") ||
                    (userLanguage === "es" ? "Pista" : "Hint")}
                  :
                </Text>{" "}
                {sHint}
              </Text>
            ) : null}

            {showTRSpeak ? (
              <Text fontSize="sm" mt={1} opacity={0.85}>
                <Text as="span" fontWeight="600">
                  {t("vocab_speak_translation_label") ||
                    (userLanguage === "es" ? "Traducción" : "Translation")}
                  :
                </Text>{" "}
                {sTranslation}
              </Text>
            ) : null}

            {sRecognized && lastOk !== true ? (
              <Text fontSize="sm" mt={3} color="teal.200">
                <Text as="span" fontWeight="600">
                  {t("vocab_speak_last_heard") ||
                    (userLanguage === "es" ? "Último intento" : "Last attempt")}
                  :
                </Text>{" "}
                {sRecognized}
              </Text>
            ) : null}

            <HStack spacing={3} mt={4} align="center">
              <Button
                colorScheme={isSpeakRecording ? "red" : "teal"}
                onClick={async () => {
                  if (isSpeakRecording) {
                    stopSpeakRecording();
                    return;
                  }
                  try {
                    await startSpeakRecording();
                  } catch (err) {
                    const code = err?.code;
                    if (code === "no-speech-recognition") {
                      toast({
                        title:
                          t("vocab_speak_unavailable") ||
                          (userLanguage === "es"
                            ? "Reconocimiento de voz no disponible"
                            : "Speech recognition unavailable"),
                        description:
                          userLanguage === "es"
                            ? "Usa un navegador Chromium con acceso al micrófono."
                            : "Use a Chromium-based browser with microphone access.",
                        status: "warning",
                        duration: 3200,
                      });
                    } else if (code === "mic-denied") {
                      toast({
                        title:
                          userLanguage === "es"
                            ? "Permiso de micrófono denegado"
                            : "Microphone denied",
                        description:
                          userLanguage === "es"
                            ? "Activa el micrófono en la configuración del navegador."
                            : "Enable microphone access in your browser settings.",
                        status: "error",
                        duration: 3200,
                      });
                    } else {
                      toast({
                        title:
                          userLanguage === "es"
                            ? "No se pudo iniciar la grabación"
                            : "Recording failed",
                        description:
                          userLanguage === "es"
                            ? "Inténtalo nuevamente."
                            : "Please try again.",
                        status: "error",
                        duration: 2500,
                      });
                    }
                  }
                }}
                isDisabled={!supportsSpeak || loadingQSpeak || !sTarget}
              >
                {isSpeakRecording
                  ? t("vocab_speak_stop") ||
                    (userLanguage === "es" ? "Detener" : "Stop")
                  : t("vocab_speak_record") ||
                    (userLanguage === "es"
                      ? "Grabar pronunciación"
                      : "Record pronunciation")}
              </Button>
              {lastOk === true && nextAction ? (
                <Button variant="outline" onClick={handleNext}>
                  {nextLabel}
                </Button>
              ) : null}
            </HStack>

            {lastOk === true ? (
              <SpeakSuccessCard
                title={
                  t("vocab_speak_success_title") ||
                  (userLanguage === "es"
                    ? "¡Gran pronunciación!"
                    : "Great pronunciation!")
                }
                scoreLabel={
                  sEval
                    ? t("vocab_speak_success_desc", { score: sEval.score }) ||
                      (userLanguage === "es"
                        ? `Puntaje ${sEval.score}%`
                        : `Score ${sEval.score}%`)
                    : ""
                }
                xp={recentXp}
                recognizedText={sRecognized}
                translation={showTRSpeak ? sTranslation : ""}
                t={t}
                userLanguage={userLanguage}
              />
            ) : (
              <HStack spacing={3} mt={3}>
                <ResultBadge ok={lastOk} xp={recentXp} />
              </HStack>
            )}
          </>
        ) : null}

        {/* ---- MATCH UI (Drag & Drop) ---- */}
        {mode === "match" && (mLeft.length > 0 || loadingMG) ? (
          <>
            <HStack align="start">
              <CopyAllBtn q={mStem} h={mHint} tr="" />
              <Text fontWeight="semibold" flex="1">
                {mStem || (loadingMG ? "…" : "")}
              </Text>
            </HStack>
            {!!mHint && (
              <Text fontSize="sm" opacity={0.85}>
                💡 {mHint}
              </Text>
            )}
            <DragDropContext onDragEnd={onDragEnd}>
              <VStack align="stretch" spacing={3}>
                {(mLeft.length ? mLeft : loadingMG ? ["…", "…", "…"] : []).map(
                  (lhs, i) => (
                    <HStack key={i} align="stretch" spacing={3}>
                      <Box minW="180px">
                        <Text>{lhs}</Text>
                      </Box>
                      <Droppable
                        droppableId={`slot-${i}`}
                        direction="horizontal"
                      >
                        {(provided) => (
                          <HStack
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            minH="42px"
                            px={2}
                            border="1px dashed rgba(255,255,255,0.22)"
                            rounded="md"
                            w="100%"
                          >
                            {mSlots[i] !== null && mRight[mSlots[i]] != null ? (
                              <Draggable
                                draggableId={`r-${mSlots[i]}`}
                                index={0}
                              >
                                {(dragProvided) => (
                                  <Box
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    style={{
                                      cursor: "grab",
                                      ...(dragProvided.draggableProps.style || {}),
                                    }}
                                    px={3}
                                    py={1.5}
                                    rounded="md"
                                    border="1px solid rgba(255,255,255,0.24)"
                                  >
                                    {mRight[mSlots[i]]}
                                  </Box>
                                )}
                              </Draggable>
                            ) : (
                              <Text opacity={0.6} fontSize="sm">
                                {t("vocab_dnd_drop_here")}
                              </Text>
                            )}
                            {provided.placeholder}
                          </HStack>
                        )}
                      </Droppable>
                    </HStack>
                  )
                )}
              </VStack>

              {/* Bank */}
              <Box mt={3}>
                <Text fontSize="sm" mb={1}>
                  {t("vocab_dnd_bank")}
                </Text>
                <Droppable droppableId="bank" direction="horizontal">
                  {(provided) => (
                    <HStack
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      spacing={2}
                      flexWrap="wrap"
                      minH="44px"
                      p={2}
                      border="1px dashed rgba(255,255,255,0.22)"
                      rounded="md"
                    >
                      {(mBank.length ? mBank : loadingMG ? [0, 1, 2] : []).map(
                        (ri, index) =>
                          mRight[ri] != null ? (
                            <Draggable
                              key={`r-${ri}`}
                              draggableId={`r-${ri}`}
                              index={index}
                            >
                              {(dragProvided) => (
                                <Box
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  style={{
                                    cursor: "grab",
                                    ...(dragProvided.draggableProps.style || {}),
                                  }}
                                  px={3}
                                  py={1.5}
                                  rounded="md"
                                  border="1px solid rgba(255,255,255,0.24)"
                                >
                                  {mRight[ri]}
                                </Box>
                              )}
                            </Draggable>
                          ) : (
                            <Box
                              key={`placeholder-${index}`}
                              px={3}
                              py={1.5}
                              rounded="md"
                              border="1px solid rgba(255,255,255,0.24)"
                              opacity={0.5}
                            >
                              …
                            </Box>
                          )
                      )}
                      {provided.placeholder}
                    </HStack>
                  )}
                </Droppable>
              </Box>
            </DragDropContext>

            <HStack>
              <Button
                onClick={submitMatch}
                isDisabled={!canSubmitMatch() || loadingMJ || !mLeft.length}
              >
                {loadingMJ ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
              {lastOk === true && nextAction ? (
                <Button variant="outline" onClick={handleNext}>
                  {nextLabel}
                </Button>
              ) : null}
            </HStack>

            <HStack spacing={3} mt={1}>
              <ResultBadge ok={lastOk} xp={recentXp} />
            </HStack>
          </>
        ) : null}
      </VStack>
    </Box>
  );
}
