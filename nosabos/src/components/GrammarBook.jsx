// components/GrammarBook.jsx
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
  const col = collection(database, "users", npub, "grammarTurns");
  await addDoc(col, {
    ...payload,
    createdAt: serverTimestamp(),
    createdAtClient: Date.now(),
    origin: "grammar",
  });
}

/* ---------------------------
   Difficulty routing
--------------------------- */
function difficultyHint(level, xp) {
  const band = xp < 150 ? 0 : xp < 400 ? 1 : 2;
  if (level === "beginner") {
    return [
      "Use frequent present/past forms only.",
      "Allow simple perfect/continuous.",
      "Light conditionals or passive allowed.",
    ][band];
  }
  if (level === "intermediate") {
    return [
      "Prefer perfect/continuous and modals.",
      "Use mixed tenses and comparatives.",
      "Allow conditionals, reported speech.",
    ][band];
  }
  return [
    "Allow complex clauses; be concise.",
    "Use conditionals, passive, reduced clauses.",
    "Allow nuanced aspect/voice choices.",
  ][band];
}

/* ---------------------------
   Prompts
--------------------------- */
const resolveSupportLang = (supportLang, appUILang) =>
  supportLang === "bilingual"
    ? appUILang === "es"
      ? "es"
      : "en"
    : supportLang === "es"
    ? "es"
    : "en";

function buildFillPrompt({
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
  const wantTranslation =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = difficultyHint(level, xp);

  return `
Write ONE short ${TARGET} grammar question with a single blank "___".
- No meta like "(to go)" in the question.
- ≤ 120 chars. Difficulty: ${diff}
- Consider learner recent corrects: ${JSON.stringify(recentGood.slice(-3))}
Provide also:
- a short hint in ${SUPPORT} (≤ 8 words)
${
  wantTranslation ? `- a ${SUPPORT} translation` : `- an empty translation ("")`
}
Return EXACTLY: <question> ||| <hint> ||| <translation or "">
`.trim();
}

/* Missing in original: judge prompt for fill */
function buildFillJudgePrompt({
  level,
  targetLang,
  question,
  userAnswer,
  hint,
}) {
  return `
Judge a GRAMMAR fill-in-the-blank in ${LANG_NAME(targetLang)}.

Question:
${question}

User answer:
${userAnswer}

Hint (optional):
${hint || ""}

Policy:
- Say YES if the answer is grammatically correct and fits the context.
- Allow contractions, minor casing/punctuation differences, and natural variants.
- If clearly wrong or ungrammatical for the stem, say NO.

Reply ONE WORD ONLY:
YES or NO
`.trim();
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

/* Matching: generator + judge */
function buildMatchGenPrompt() {
  return `
Create ONE simple English GRAMMAR matching exercise.

Return ONLY JSON like:
{"stem":"Match the items","left":["I","She","They"],"right":["am","is","are"],"hint":"Subject–verb agreement"}

Rules:
- Keep it very short (<= 10 words per item).
- Make left/right unique (no duplicates after lowercasing/diacritics removal).
- Ensure a clear 1:1 mapping with no ambiguity.
- Do NOT include meta like "(to be)" inside items; if needed, put that in "hint".
`.trim();
}

function buildMatchJudgePrompt({ stem, left, right, userPairs, hint }) {
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
Judge a MATCHING grammar task with leniency.

Stem:
${stem}

Left column:
${L}

Right column:
${R}

Hint (optional):
${hint || ""}

User mapping (order irrelevant; 1:1 intended):
${U}

Rules:
- Reply YES if each left item is matched to a right item that is grammatically and contextually appropriate.
- Allow minor surface differences, synonyms, and natural variants if meaning/grammar fit is correct.
- If any mapping is clearly wrong or missing, reply NO.

Reply with ONE WORD ONLY:
YES or NO
`.trim();
}

function buildMCQuestionPrompt({
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
  const wantTranslation =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = difficultyHint(level, xp);

  return `
Create ONE multiple-choice ${TARGET} grammar question.
- Stem short (≤120 chars); may include "___".
- 4 distinct choices in ${TARGET}. EXACTLY ONE is correct, unambiguous.
- Hint in ${SUPPORT} (≤8 words).
${
  wantTranslation
    ? `- ${SUPPORT} translation of the stem.`
    : `- Empty translation "".`
}
- Difficulty: ${diff}
- Consider learner recent corrects: ${JSON.stringify(recentGood.slice(-3))}

Return JSON ONLY:
{
  "question": "<stem in ${TARGET}>",
  "hint": "<hint in ${SUPPORT}>",
  "choices": ["A","B","C","D"],
  "answer": "<exact text of the correct choice>",
  "translation": "<${SUPPORT} translation or empty string>"
}
`.trim();
}

function buildMAQuestionPrompt({
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
  const wantTranslation =
    showTranslations &&
    SUPPORT_CODE !== (targetLang === "en" ? "en" : targetLang);
  const diff = difficultyHint(level, xp);

  return `
Create ONE multiple-answer ${TARGET} grammar question.
- Stem short (≤120 chars); may include "___".
- 5–6 distinct choices in ${TARGET}.
- EXACTLY 2 or 3 choices are correct; others clearly wrong.
- Hint in ${SUPPORT} (≤8 words).
${
  wantTranslation
    ? `- ${SUPPORT} translation of the stem.`
    : `- Empty translation "".`
}
- Difficulty: ${diff}
- Consider learner recent corrects: ${JSON.stringify(recentGood.slice(-3))}

Return JSON ONLY:
{
  "question": "<stem in ${TARGET}>",
  "hint": "<hint in ${SUPPORT}>",
  "choices": ["..."],
  "answers": ["<correct option>", "<correct option>"],
  "translation": "<${SUPPORT} translation or empty string>"
}
`.trim();
}

function buildMCJudgePrompt({
  level,
  targetLang,
  stem,
  choices,
  userChoice,
  hint,
}) {
  const listed = choices.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return `
Judge a MULTIPLE-CHOICE grammar question in ${LANG_NAME(targetLang)}.

Stem:
${stem}

Choices:
${listed}

User selected:
${userChoice}

Hint (optional):
${hint || ""}

Instructions:
- Say YES if the selected choice is a grammatically correct, context-appropriate answer to the stem.
- Use the hint and any time/aspect cues in the stem (e.g., "usually", "yesterday", "for/since").
- Allow contractions, minor punctuation/casing differences, and natural variation.
- If more than one choice could be acceptable, accept the user's if it fits well.
- Otherwise say NO.

Reply with ONE WORD ONLY:
YES or NO
`.trim();
}

function buildMAJudgePrompt({
  level,
  targetLang,
  stem,
  choices,
  userSelections,
  hint,
}) {
  const listed = choices.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const picked = userSelections.map((c) => `- ${c}`).join("\n");
  return `
Judge a MULTIPLE-ANSWER grammar question in ${LANG_NAME(targetLang)}.

Stem:
${stem}

Choices:
${listed}

User selected (order irrelevant):
${picked || "(none)"}

Hint (optional):
${hint || ""}

Instructions:
- Determine which choices are grammatically correct and context-appropriate answers.
- Say YES if the user's selection includes ALL correct choices and NO incorrect ones (order doesn't matter).
- Be lenient about contractions and minor surface differences; focus on grammar/meaning fit with the stem + hint.
- If two variants are both acceptable, either may be included.

Reply with ONE WORD ONLY:
YES or NO
`.trim();
}

/* ---------------------------
   Normalizers
--------------------------- */
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

/* ---------------------------
   Component
--------------------------- */
export default function GrammarBook({ userLanguage = "en" }) {
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

  // Localized chips
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

  const [mode, setMode] = useState("fill"); // "fill" | "mc" | "ma" | "match"
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  useEffect(() => {
    if (
      levelNumber > 2 &&
      localStorage.getItem("passcode") !== import.meta.env.VITE_PATREON_PASSCODE
    ) {
      setShowPasscodeModal(true);
    }
  }, [xp]);

  // ---- FILL ----
  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [translation, setTranslation] = useState("");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loadingQ, setLoadingQ] = useState(false);
  const [loadingG, setLoadingG] = useState(false);

  // ---- MC ----
  const [mcQ, setMcQ] = useState("");
  const [mcHint, setMcHint] = useState("");
  const [mcChoices, setMcChoices] = useState([]);
  const [mcAnswer, setMcAnswer] = useState("");
  const [mcTranslation, setMcTranslation] = useState("");
  const [mcPick, setMcPick] = useState("");
  const [mcResult, setMcResult] = useState("");
  const [loadingMCQ, setLoadingMCQ] = useState(false);
  const [loadingMCG, setLoadingMCG] = useState(false);

  // ---- MA ----
  const [maQ, setMaQ] = useState("");
  const [maHint, setMaHint] = useState("");
  const [maChoices, setMaChoices] = useState([]);
  const [maAnswers, setMaAnswers] = useState([]); // correct strings
  const [maTranslation, setMaTranslation] = useState("");
  const [maPicks, setMaPicks] = useState([]); // selected strings
  const [maResult, setMaResult] = useState("");
  const [loadingMAQ, setLoadingMAQ] = useState(false);
  const [loadingMAG, setLoadingMAG] = useState(false);

  // ---- MATCH (DnD) ----
  const [mStem, setMStem] = useState("");
  const [mHint, setMHint] = useState("");
  const [mLeft, setMLeft] = useState([]); // strings
  const [mRight, setMRight] = useState([]); // strings
  const [mSlots, setMSlots] = useState([]); // per-left slot: rightIndex | null
  const [mBank, setMBank] = useState([]); // right indices not yet used
  const [mResult, setMResult] = useState("");
  const [loadingMG, setLoadingMG] = useState(false);
  const [loadingMJ, setLoadingMJ] = useState(false);

  /* ---------- Generate: Fill ---------- */
  async function generateFill() {
    setMode("fill");
    setLoadingQ(true);
    setResult("");
    setInput("");

    const text = await callResponses({
      model: MODEL,
      input: buildFillPrompt({
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
      setQuestion(q);
      setHint(h || "");
      setTranslation(tr || "");
    } else {
      // minimal content fallback (not localized on purpose)
      if (targetLang === "es") {
        setQuestion("Completa: Ella ___ al trabajo cada día.");
        setHint("Tiempo presente de ir");
        setTranslation(
          showTranslations && supportCode === "en"
            ? "She ___ to work every day."
            : ""
        );
      } else {
        setQuestion("Fill in the blank: She ___ to work every day.");
        setHint('Use present of "go"');
        setTranslation(
          showTranslations && supportCode === "es"
            ? "Ella ___ al trabajo cada día."
            : ""
        );
      }
    }
    setLoadingQ(false);
  }

  /* ---------- Generate: MC ---------- */
  async function generateMC() {
    setMode("mc");
    setLoadingMCQ(true);
    setMcResult("");
    setMcPick("");

    const text = await callResponses({
      model: MODEL,
      input: buildMCQuestionPrompt({
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
      const choices = parsed.choices.slice(0, 4).map((c) => String(c));
      const ans =
        choices.find((c) => norm(c) === norm(parsed.answer)) || choices[0];
      setMcQ(String(parsed.question));
      setMcHint(String(parsed.hint || ""));
      setMcChoices(choices);
      setMcAnswer(ans);
      setMcTranslation(String(parsed.translation || ""));
    } else {
      setMcQ("Choose the correct past form of 'go'.");
      setMcHint("Simple past");
      const choices = ["go", "went", "gone", "going"];
      setMcChoices(choices);
      setMcAnswer("went");
      setMcTranslation(
        showTranslations && supportCode === "es"
          ? "Elige la forma correcta del pasado de 'go'."
          : ""
      );
    }

    setLoadingMCQ(false);
  }

  /* ---------- Generate: MA ---------- */
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
    setLoadingMAQ(true);
    setMaResult("");
    setMaPicks([]);

    const text = await callResponses({
      model: MODEL,
      input: buildMAQuestionPrompt({
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
      setMaQ(parsed.question);
      setMaHint(parsed.hint);
      setMaChoices(parsed.choices);
      setMaAnswers(parsed.answers);
      setMaTranslation(parsed.translation);
    } else {
      // minimal content fallback
      setMaQ("Select all sentences that are in present perfect.");
      setMaHint("have/has + past participle");
      const choices = [
        "She has eaten.",
        "They eat now.",
        "We have finished.",
        "He is finishing.",
        "I have seen it.",
      ];
      setMaChoices(choices);
      setMaAnswers(["She has eaten.", "We have finished.", "I have seen it."]);
      setMaTranslation(
        showTranslations && supportCode === "es"
          ? "Selecciona todas las oraciones en presente perfecto."
          : ""
      );
    }

    setLoadingMAQ(false);
  }

  /* ---------- Generate: MATCH (DnD) ---------- */
  async function generateMatch() {
    setMode("match");
    setLoadingMG(true);
    setMResult("");

    const raw = await callResponses({
      model: MODEL,
      input: buildMatchGenPrompt(),
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
      stem = String(parsed.stem || "Match the items.");
      left = parsed.left.slice(0, 6).map(String);
      right = parsed.right.slice(0, 6).map(String);
      hint = String(parsed.hint || "");
    } else {
      stem = "Match subjects with the correct 'to be' form.";
      left = ["I", "She", "They"];
      right = ["am", "is", "are"];
      hint = "Subject–verb agreement";
    }

    setMStem(stem);
    setMHint(hint);
    setMLeft(left);
    setMRight(right);
    setMSlots(Array(left.length).fill(null)); // empty slots
    setMBank([...Array(right.length)].map((_, i) => i)); // right indices in bank

    setLoadingMG(false);
  }

  /* ---------------------------
     Submits
  --------------------------- */
  async function submitFill() {
    if (!question || !input.trim()) return;
    setLoadingG(true);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildFillJudgePrompt({
        level,
        targetLang,
        question,
        userAnswer: input,
        hint,
      }),
    });
    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 12 : 3;

    await saveAttempt(npub, {
      ok,
      mode: "fill",
      question,
      hint,
      translation,
      user_input: input,
      award_xp: delta,
    }).catch(() => {});
    await awardXp(npub, delta).catch(() => {});

    setResult(
      ok
        ? t("grammar_result_good", { xp: delta })
        : t("grammar_result_not_fit", { xp: delta })
    );

    if (ok) {
      setInput("");
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "fill", question },
      ].slice(-5);
      generateFill();
    }

    setLoadingG(false);
  }

  async function submitMC() {
    if (!mcQ || !mcPick) return;
    setLoadingMCG(true);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMCJudgePrompt({
        level,
        targetLang,
        stem: mcQ,
        choices: mcChoices,
        userChoice: mcPick,
        hint: mcHint,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 8 : 2;

    await saveAttempt(npub, {
      ok,
      mode: "mc",
      question: mcQ,
      hint: mcHint,
      translation: mcTranslation,
      choices: mcChoices,
      author_answer: mcAnswer || "",
      user_choice: mcPick,
      award_xp: delta,
    }).catch(() => {});
    await awardXp(npub, delta).catch(() => {});

    setMcResult(
      ok
        ? t("grammar_result_correct", { xp: delta })
        : t("grammar_result_try_again", { xp: delta })
    );

    if (ok) {
      setMcPick("");
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "mc", question: mcQ },
      ].slice(-5);
      generateMC();
    }

    setLoadingMCG(false);
  }

  async function submitMA() {
    if (!maQ || !maPicks.length) return;
    setLoadingMAG(true);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMAJudgePrompt({
        level,
        targetLang,
        stem: maQ,
        choices: maChoices,
        userSelections: maPicks,
        hint: maHint,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 10 : 3;

    await saveAttempt(npub, {
      ok,
      mode: "ma",
      question: maQ,
      hint: maHint,
      translation: maTranslation,
      choices: maChoices,
      author_answers: maAnswers || [],
      user_choices: maPicks,
      award_xp: delta,
    }).catch(() => {});
    await awardXp(npub, delta).catch(() => {});

    setMaResult(
      ok
        ? t("grammar_result_correct", { xp: delta })
        : t("grammar_result_try_again", { xp: delta })
    );

    if (ok) {
      setMaPicks([]);
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "ma", question: maQ },
      ].slice(-5);
      generateMA();
    }

    setLoadingMAG(false);
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
      input: buildMatchJudgePrompt({
        stem: mStem,
        left: mLeft,
        right: mRight,
        userPairs,
        hint: mHint,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 12 : 4;
    setMResult(
      ok
        ? t("grammar_result_correct", { xp: delta })
        : t("grammar_result_try_again", { xp: delta })
    );

    await saveAttempt(npub, {
      ok,
      mode: "match",
      question: mStem,
      hint: mHint,
      left: mLeft,
      right: mRight,
      user_pairs: userPairs,
      award_xp: delta,
    }).catch(() => {});
    await awardXp(npub, delta).catch(() => {});

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
    translation &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRMC =
    showTranslations &&
    mcTranslation &&
    supportCode !== (targetLang === "en" ? "en" : targetLang);
  const showTRMA =
    showTranslations &&
    maTranslation &&
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
              {t("grammar_badge_level", { level: levelNumber })}
            </Badge>
            <Badge variant="subtle">{t("grammar_badge_xp", { xp })}</Badge>
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
              key: "grammar_btn_fill",
              onClick: generateFill,
              loading: loadingQ,
            },
            { key: "grammar_btn_mc", onClick: generateMC, loading: loadingMCQ },
            { key: "grammar_btn_ma", onClick: generateMA, loading: loadingMAQ },
            {
              key: "grammar_btn_match",
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

        {/* ---- Fill UI ---- */}
        {mode === "fill" && question ? (
          <>
            <Text fontWeight="semibold">{question}</Text>
            {showTRFill && (
              <Text fontSize="sm" opacity={0.8}>
                {translation}
              </Text>
            )}
            {hint ? (
              <Text fontSize="sm" opacity={0.85}>
                💡 {hint}
              </Text>
            ) : null}

            <HStack>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("grammar_input_placeholder_answer")}
                isDisabled={loadingG}
              />
              <Button
                onClick={submitFill}
                isDisabled={loadingG || !input.trim()}
              >
                {loadingG ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
            </HStack>
            {result ? <Text>{result}</Text> : null}
          </>
        ) : null}

        {/* ---- MC UI ---- */}
        {mode === "mc" && mcQ ? (
          <>
            <Text fontWeight="semibold">{mcQ}</Text>
            {showTRMC && (
              <Text fontSize="sm" opacity={0.8}>
                {mcTranslation}
              </Text>
            )}
            {mcHint ? (
              <Text fontSize="sm" opacity={0.85}>
                💡 {mcHint}
              </Text>
            ) : null}

            <RadioGroup value={mcPick} onChange={setMcPick}>
              <Stack spacing={2}>
                {mcChoices.map((c, i) => (
                  <Radio value={c} key={i}>
                    {c}
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>

            <HStack>
              <Button onClick={submitMC} isDisabled={loadingMCG || !mcPick}>
                {loadingMCG ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
            </HStack>
            {mcResult ? <Text>{mcResult}</Text> : null}
          </>
        ) : null}

        {/* ---- MA UI ---- */}
        {mode === "ma" && maQ ? (
          <>
            <Text fontWeight="semibold">{maQ}</Text>
            {showTRMA && (
              <Text fontSize="sm" opacity={0.8}>
                {maTranslation}
              </Text>
            )}
            {maHint ? (
              <Text fontSize="sm" opacity={0.85}>
                💡 {maHint}
              </Text>
            ) : null}
            <Text fontSize="xs" opacity={0.7}>
              {t("grammar_select_all_apply")}
            </Text>

            <CheckboxGroup value={maPicks} onChange={setMaPicks}>
              <Stack spacing={2}>
                {maChoices.map((c, i) => (
                  <Checkbox value={c} key={i}>
                    {c}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>

            <HStack>
              <Button
                onClick={submitMA}
                isDisabled={loadingMAG || !maPicks.length}
              >
                {loadingMAG ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
            </HStack>
            {maResult ? <Text>{maResult}</Text> : null}
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
                              {t("grammar_dnd_drop_here")}
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
                  {t("grammar_dnd_bank")}
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
                {loadingMJ ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
              {mResult ? <Text>{mResult}</Text> : null}
            </HStack>
          </>
        ) : null}
      </VStack>
    </Box>
  );
}
