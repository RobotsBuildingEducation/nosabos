// components/Vocabulary.jsx
import React, { useRef, useState, useEffect } from "react";
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
  SimpleGrid,
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
import { WaveBar } from "./WaveBar";
import translations from "../utils/translation";
import { PasscodePage } from "./PasscodePage";
import { FiCopy } from "react-icons/fi";
import { awardXp } from "../utils/utils";

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
const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const MODEL = import.meta.env.VITE_OPENAI_TRANSLATE_MODEL || "gpt-4o-mini";

async function callResponses({ model, input }) {
  try {
    const r = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        text: { format: { type: "text" } },
        input,
      }),
    });
    const ct = r.headers.get("content-type") || "";
    const payload = ct.includes("application/json")
      ? await r.json()
      : await r.text();
    const text =
      (typeof payload?.output_text === "string" && payload.output_text) ||
      (Array.isArray(payload?.output) &&
        payload.output
          .map((it) =>
            (it?.content || []).map((seg) => seg?.text || "").join("")
          )
          .join(" ")
          .trim()) ||
      (Array.isArray(payload?.content) && payload.content[0]?.text) ||
      (Array.isArray(payload?.choices) &&
        (payload.choices[0]?.message?.content || "")) ||
      (typeof payload === "string" ? payload : "");
    return String(text || "");
  } catch {
    return "";
  }
}

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

  const [mode, setMode] = useState("fill"); // "fill" | "mc" | "ma" | "match"
  // ✅ whether user has selected a specific type; if null => keep randomizing
  const [lockedType, setLockedType] = useState(null);

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
  const [resMA, setResMA] = useState(""); // log only
  const [loadingQMA, setLoadingQMA] = useState(false);
  const [loadingGMA, setLoadingGMA] = useState(false);

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
  const types = ["fill", "mc", "ma", "match"];
  function generatorFor(type) {
    switch (type) {
      case "fill":
        return generateFill;
      case "mc":
        return generateMC;
      case "ma":
        return generateMA;
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
    setNextAction(
      ok
        ? lockedType
          ? () => generatorFor(lockedType)()
          : () => generateRandom()
        : null
    );

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

    setNextAction(
      ok
        ? lockedType
          ? () => generatorFor(lockedType)()
          : () => generateRandom()
        : null
    );

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
    setNextAction(
      ok
        ? lockedType
          ? () => generatorFor(lockedType)()
          : () => generateRandom()
        : null
    );

    if (ok) {
      setPicksMA([]);
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "ma", question: qMA },
      ].slice(-5);
    }

    setLoadingGMA(false);
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
    setNextAction(
      ok
        ? lockedType
          ? () => generatorFor(lockedType)()
          : () => generateRandom()
        : null
    );

    setLoadingMJ(false);
  }

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

  const nextLabel = t("grammar_next") || t("grammar_next") || "Next";

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

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch" maxW="720px" mx="auto">
        {/* Shared progress header */}
        <Box>
          <HStack justify="space-between" mb={1}>
            <Badge variant="subtle">
              {t("vocab_badge_level", { level: levelNumber })}
            </Badge>
            <Badge variant="subtle">{t("vocab_badge_xp", { xp })}</Badge>
          </HStack>
          <WaveBar value={progressPct} />
        </Box>

        {/* Context chips */}
        <HStack spacing={2}>
          <Badge variant="outline">{targetName}</Badge>
          <Badge variant="outline">{supportName}</Badge>
          <Badge variant="subtle">{levelLabel}</Badge>
        </HStack>

        {/* Generators */}
        <SimpleGrid
          columns={{ base: 2, md: 4 }}
          spacing={{ base: 2, md: 3 }}
          w="100%"
        >
          <Button
            onClick={() => {
              setLockedType("fill");
              generateFill();
            }}
            isDisabled={loadingQFill}
            rightIcon={loadingQFill ? <Spinner size="xs" /> : null}
            w="100%"
            size="sm"
            px={2}
            py={2}
            minH={{ base: "44px", md: "52px" }}
            rounded="lg"
          >
            <Text
              noOfLines={2}
              fontWeight="700"
              fontSize={{ base: "xs", md: "sm" }}
            >
              {t("vocab_btn_fill")}
            </Text>
          </Button>

          <Button
            onClick={() => {
              setLockedType("mc");
              generateMC();
            }}
            isDisabled={loadingQMC}
            rightIcon={loadingQMC ? <Spinner size="xs" /> : null}
            w="100%"
            size="sm"
            px={2}
            py={2}
            minH={{ base: "44px", md: "52px" }}
            rounded="lg"
          >
            <Text
              noOfLines={2}
              fontWeight="700"
              fontSize={{ base: "xs", md: "sm" }}
            >
              {t("vocab_btn_mc")}
            </Text>
          </Button>

          <Button
            onClick={() => {
              setLockedType("ma");
              generateMA();
            }}
            isDisabled={loadingQMA}
            rightIcon={loadingQMA ? <Spinner size="xs" /> : null}
            w="100%"
            size="sm"
            px={2}
            py={2}
            minH={{ base: "44px", md: "52px" }}
            rounded="lg"
          >
            <Text
              noOfLines={2}
              fontWeight="700"
              fontSize={{ base: "xs", md: "sm" }}
            >
              {t("vocab_btn_ma")}
            </Text>
          </Button>

          <Button
            onClick={() => {
              setLockedType("match");
              generateMatch();
            }}
            isDisabled={loadingMG}
            rightIcon={loadingMG ? <Spinner size="xs" /> : null}
            w="100%"
            size="sm"
            px={2}
            py={2}
            minH={{ base: "44px", md: "52px" }}
            rounded="lg"
          >
            <Text
              noOfLines={2}
              fontWeight="700"
              fontSize={{ base: "xs", md: "sm" }}
            >
              {t("vocab_btn_match")}
            </Text>
          </Button>
        </SimpleGrid>

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

            <HStack>
              <Button
                onClick={submitMA}
                isDisabled={loadingGMA || !picksMA.length || !choicesMA.length}
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
