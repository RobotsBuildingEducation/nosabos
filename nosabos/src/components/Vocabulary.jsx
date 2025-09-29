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
import { database } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { WaveBar } from "./WaveBar";
import translations from "../utils/translation";
import { PasscodePage } from "./PasscodePage";

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
   LLM plumbing
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

  useEffect(() => {
    if (!npub) return;
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
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub };
}

async function awardXp(npub, amount) {
  if (!npub || !amount) return;
  const ref = doc(database, "users", npub);
  await setDoc(
    ref,
    { xp: increment(Math.round(amount)), updatedAt: new Date().toISOString() },
    { merge: true }
  );
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
   Prompts — GENERATE
--------------------------- */
function buildFillVocabPrompt({
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

  return `
Create ONE short ${TARGET} VOCABULARY sentence with a single blank "___" that targets a word choice (not grammar).
- ≤ 120 chars. Difficulty: ${diff}
- Use natural context that clearly cues the target word.
- Consider learner recent corrects: ${JSON.stringify(recentGood.slice(-3))}
Also provide:
- a short hint in ${SUPPORT} (≤ 8 words) giving definition/synonym/topic
${
  wantTR
    ? `- ${SUPPORT} translation of the full sentence`
    : `- empty translation ""`
}

Return EXACTLY:
<sentence with ___> ||| <hint in ${SUPPORT}> ||| <${SUPPORT} translation or "">
`.trim();
}

function buildMCVocabQuestionPrompt({
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

  return `
Create ONE ${TARGET} vocabulary multiple-choice question.
- Stem (≤120 chars) with a blank "___" or definition asking for a word.
- 4 distinct word choices in ${TARGET}; EXACTLY ONE is the best answer.
- Provide a short hint in ${SUPPORT} (≤8 words).
${wantTR ? `- ${SUPPORT} translation of the stem.` : `- Empty translation "".`}
- Difficulty: ${diff}
- Consider learner recent corrects: ${JSON.stringify(recentGood.slice(-3))}

Return JSON ONLY:
{
  "question": "<stem in ${TARGET}>",
  "hint": "<hint in ${SUPPORT}>",
  "choices": ["A","B","C","D"],
  "answer": "<exact correct choice text>",
  "translation": "<${SUPPORT} translation or empty string>"
}
`.trim();
}

function buildMAVocabQuestionPrompt({
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

  return `
Create ONE ${TARGET} vocabulary multiple-answer question.
- Stem (≤120 chars) with context or instruction "Select all synonyms for ___" or "Which words fit the sentence?"
- 5–6 distinct choices; EXACTLY 2 or 3 are correct.
- Hint in ${SUPPORT} (≤8 words).
${wantTR ? `- ${SUPPORT} translation of the stem.` : `- Empty translation "".`}
- Difficulty: ${diff}
- Consider learner recent corrects: ${JSON.stringify(recentGood.slice(-3))}

Return JSON ONLY:
{
  "question": "<stem in ${TARGET}>",
  "hint": "<hint in ${SUPPORT}>",
  "choices": ["..."],
  "answers": ["<correct>","<correct>"],
  "translation": "<${SUPPORT} translation or empty string>"
}
`.trim();
}

function buildMatchVocabGenPrompt({
  targetLang,
  supportLang,
  appUILang,
  level,
  xp,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT_CODE = resolveSupportLang(supportLang, appUILang);
  const SUPPORT = LANG_NAME(SUPPORT_CODE);
  const diff = vocabDifficulty(level, xp);

  return `
Create ONE ${TARGET} vocabulary matching exercise.

Return JSON ONLY like:
{
  "stem":"Match words to their ${SUPPORT} definitions",
  "left":["<word1>","<word2>","<word3>"],
  "right":["<short definition>","<short definition>","<short definition>"],
  "hint":"topic or small cue"
}

Rules:
- Keep items short (≤ 4 words each).
- Make left items (words) unique; right items (definitions) unique.
- Clear 1:1 mapping; no ambiguity.
- Difficulty: ${diff}
`.trim();
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
  const user = useUserStore((s) => s.user);

  const { xp, levelNumber, progressPct, progress, npub } = useSharedProgress();

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
  const levelLabel = t(`onboarding_level_${level}`) || level; // fallback to raw if not found

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

  // ---- FILL (vocab) ----
  const [qFill, setQFill] = useState("");
  const [hFill, setHFill] = useState("");
  const [trFill, setTrFill] = useState("");
  const [ansFill, setAnsFill] = useState("");
  const [resFill, setResFill] = useState("");
  const [loadingQFill, setLoadingQFill] = useState(false);
  const [loadingGFill, setLoadingGFill] = useState(false);

  // ---- MC (vocab) ----
  const [qMC, setQMC] = useState("");
  const [hMC, setHMC] = useState("");
  const [choicesMC, setChoicesMC] = useState([]);
  const [answerMC, setAnswerMC] = useState("");
  const [trMC, setTrMC] = useState("");
  const [pickMC, setPickMC] = useState("");
  const [resMC, setResMC] = useState("");
  const [loadingQMC, setLoadingQMC] = useState(false);
  const [loadingGMC, setLoadingGMC] = useState(false);

  // ---- MA (vocab) ----
  const [qMA, setQMA] = useState("");
  const [hMA, setHMA] = useState("");
  const [choicesMA, setChoicesMA] = useState([]);

  const [answersMA, setAnswersMA] = useState([]);
  const [trMA, setTrMA] = useState("");
  const [picksMA, setPicksMA] = useState([]);
  const [resMA, setResMA] = useState("");
  const [loadingQMA, setLoadingQMA] = useState(false);
  const [loadingGMA, setLoadingGMA] = useState(false);

  // ---- MATCH (DnD) ----
  const [mStem, setMStem] = useState("");
  const [mHint, setMHint] = useState("");
  const [mLeft, setMLeft] = useState([]); // words (TARGET)
  const [mRight, setMRight] = useState([]); // definitions (SUPPORT)
  const [mSlots, setMSlots] = useState([]); // per-left: rightIndex|null
  const [mBank, setMBank] = useState([]); // right indices not used
  const [mResult, setMResult] = useState("");
  const [loadingMG, setLoadingMG] = useState(false);
  const [loadingMJ, setLoadingMJ] = useState(false);

  /* ---------------------------
     Generate — FILL
  --------------------------- */
  async function generateFill() {
    setMode("fill");
    setLoadingQFill(true);
    setResFill("");
    setAnsFill("");

    const text = await callResponses({
      model: MODEL,
      input: buildFillVocabPrompt({
        level,
        targetLang,
        supportLang,
        showTranslations,
        appUILang: userLanguage,
        xp,
        recentGood: recentCorrectRef.current,
      }),
    });

    const [q, h, tr] = text.split("|||").map((s) => (s || "").trim());
    if (q) {
      setQFill(q);
      setHFill(h || "");
      setTrFill(tr || "");
    } else {
      // tiny fallback (content only)
      setQFill("Complete: She felt deep ___ after her mistake.");
      setHFill("regret/guilt (noun)");
      setTrFill(
        showTranslations && supportCode === "es"
          ? "Completa: Sintió un profundo ___ tras su error."
          : ""
      );
    }
    setLoadingQFill(false);
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
    const delta = ok ? 10 : 3;

    await saveAttempt(npub, {
      ok,
      mode: "vocab_fill",
      question: qFill,
      hint: hFill,
      translation: trFill,
      user_input: ansFill,
      award_xp: delta,
    }).catch(() => {});
    await awardXp(npub, delta).catch(() => {});

    setResFill(
      ok
        ? t("vocab_result_nice", { xp: delta })
        : t("vocab_result_not_quite", { xp: delta })
    );

    if (ok) {
      setAnsFill("");
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "fill", question: qFill },
      ].slice(-5);
      generateFill();
    }

    setLoadingGFill(false);
  }

  /* ---------------------------
     Generate — MC
  --------------------------- */
  async function generateMC() {
    setMode("mc");
    setLoadingQMC(true);
    setResMC("");
    setPickMC("");

    const text = await callResponses({
      model: MODEL,
      input: buildMCVocabQuestionPrompt({
        level,
        targetLang,
        supportLang,
        showTranslations,
        appUILang: userLanguage,
        xp,
        recentGood: recentCorrectRef.current,
      }),
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
      // fallback (content only)
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

    setLoadingQMC(false);
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
    const delta = ok ? 8 : 2;

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
    await awardXp(npub, delta).catch(() => {});

    setResMC(
      ok
        ? t("vocab_result_correct", { xp: delta })
        : t("vocab_result_try_again", { xp: delta })
    );

    if (ok) {
      setPickMC("");
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "mc", question: qMC },
      ].slice(-5);
      generateMC();
    }

    setLoadingGMC(false);
  }

  /* ---------------------------
     Generate — MA
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

    const text = await callResponses({
      model: MODEL,
      input: buildMAVocabQuestionPrompt({
        level,
        targetLang,
        supportLang,
        showTranslations,
        appUILang: userLanguage,
        xp,
        recentGood: recentCorrectRef.current,
      }),
    });

    const parsed = sanitizeMA(safeParseJSON(text));
    if (parsed) {
      setQMA(parsed.question);
      setHMA(parsed.hint);
      setChoicesMA(parsed.choices);
      setAnswersMA(parsed.answers);
      setTrMA(parsed.translation);
    } else {
      // fallback (content only)
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

    setLoadingQMA(false);
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
    const delta = ok ? 10 : 3;

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
    await awardXp(npub, delta).catch(() => {});

    setResMA(
      ok
        ? t("vocab_result_correct", { xp: delta })
        : t("vocab_result_try_again", { xp: delta })
    );

    if (ok) {
      setPicksMA([]);
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "ma", question: qMA },
      ].slice(-5);
      generateMA();
    }

    setLoadingGMA(false);
  }

  /* ---------------------------
     Generate — MATCH (DnD)
  --------------------------- */
  async function generateMatch() {
    setMode("match");
    setLoadingMG(true);
    setMResult("");

    const raw = await callResponses({
      model: MODEL,
      input: buildMatchVocabGenPrompt({
        targetLang,
        supportLang,
        appUILang: userLanguage,
        level,
        xp,
      }),
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
      parsed.left.length >= 2 &&
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

    // init slots + bank
    setMStem(stem);
    setMHint(hint);
    setMLeft(left);
    setMRight(right);
    setMSlots(Array(left.length).fill(null));
    setMBank([...Array(right.length)].map((_, i) => i));

    setLoadingMG(false);
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
    const delta = ok ? 12 : 4;

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
    await awardXp(npub, delta).catch(() => {});

    setMResult(
      ok
        ? t("vocab_result_correct", { xp: delta })
        : t("vocab_result_try_again", { xp: delta })
    );

    if (ok) {
      await generateMatch();
    }

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
        userLanguage={user.appLanguage}
        setShowPasscodeModal={setShowPasscodeModal}
      />
    );
  }

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
          {[
            {
              key: "vocab_btn_fill",
              onClick: generateFill,
              loading: loadingQFill,
            },
            { key: "vocab_btn_mc", onClick: generateMC, loading: loadingQMC },
            { key: "vocab_btn_ma", onClick: generateMA, loading: loadingQMA },
            {
              key: "vocab_btn_match",
              onClick: generateMatch,
              loading: loadingMG,
            },
          ].map((b) => (
            <Button
              key={b.key}
              onClick={b.onClick}
              isDisabled={b.loading}
              rightIcon={b.loading ? <Spinner size="xs" /> : null}
              w="100%"
              size="sm"
              px={2}
              py={2}
              minH={{ base: "44px", md: "52px" }}
              rounded="lg"
              whiteSpace="normal"
              textAlign="center"
              lineHeight="1.2"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text
                noOfLines={2}
                fontWeight="700"
                fontSize={{ base: "xs", md: "sm" }}
              >
                {t(b.key)}
              </Text>
            </Button>
          ))}
        </SimpleGrid>

        {/* ---- FILL UI ---- */}
        {mode === "fill" && qFill ? (
          <>
            <Text fontWeight="semibold">{qFill}</Text>
            {showTRFill && (
              <Text fontSize="sm" opacity={0.8}>
                {trFill}
              </Text>
            )}
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
                isDisabled={loadingGFill || !ansFill.trim()}
              >
                {loadingGFill ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
            </HStack>
            {resFill ? <Text>{resFill}</Text> : null}
          </>
        ) : null}

        {/* ---- MC UI ---- */}
        {mode === "mc" && qMC ? (
          <>
            <Text fontWeight="semibold">{qMC}</Text>
            {showTRMC && (
              <Text fontSize="sm" opacity={0.8}>
                {trMC}
              </Text>
            )}
            {hMC ? (
              <Text fontSize="sm" opacity={0.85}>
                💡 {hMC}
              </Text>
            ) : null}

            <RadioGroup value={pickMC} onChange={setPickMC}>
              <Stack spacing={2}>
                {choicesMC.map((c, i) => (
                  <Radio value={c} key={i}>
                    {c}
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>

            <HStack>
              <Button onClick={submitMC} isDisabled={loadingGMC || !pickMC}>
                {loadingGMC ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
            </HStack>
            {resMC ? <Text>{resMC}</Text> : null}
          </>
        ) : null}

        {/* ---- MA UI ---- */}
        {mode === "ma" && qMA ? (
          <>
            <Text fontWeight="semibold">{qMA}</Text>
            {showTRMA && (
              <Text fontSize="sm" opacity={0.8}>
                {trMA}
              </Text>
            )}
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
                {choicesMA.map((c, i) => (
                  <Checkbox value={c} key={i}>
                    {c}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>

            <HStack>
              <Button
                onClick={submitMA}
                isDisabled={loadingGMA || !picksMA.length}
              >
                {loadingGMA ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
            </HStack>
            {resMA ? <Text>{resMA}</Text> : null}
          </>
        ) : null}

        {/* ---- MATCH UI (Drag & Drop) ---- */}
        {mode === "match" && mLeft.length > 0 ? (
          <>
            <Text fontWeight="semibold">{mStem}</Text>
            {!!mHint && (
              <Text fontSize="sm" opacity={0.85}>
                💡 {mHint}
              </Text>
            )}
            <DragDropContext onDragEnd={onDragEnd}>
              <VStack align="stretch" spacing={3}>
                {mLeft.map((lhs, i) => (
                  <HStack key={i} align="stretch" spacing={3}>
                    <Box minW="180px">
                      <Text>{lhs}</Text>
                    </Box>
                    <Droppable droppableId={`slot-${i}`} direction="horizontal">
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
                          {mSlots[i] !== null ? (
                            <Draggable draggableId={`r-${mSlots[i]}`} index={0}>
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
                ))}
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
                      {mBank.map((ri, index) => (
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
                      ))}
                      {provided.placeholder}
                    </HStack>
                  )}
                </Droppable>
              </Box>
            </DragDropContext>

            <HStack>
              <Button
                onClick={submitMatch}
                isDisabled={!canSubmitMatch() || loadingMJ}
              >
                {loadingMJ ? <Spinner size="sm" /> : t("vocab_submit")}
              </Button>
              {mResult ? <Text>{mResult}</Text> : null}
            </HStack>
          </>
        ) : null}
      </VStack>
    </Box>
  );
}
