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
  Tooltip,
  IconButton,
  useToast,
  Center,
} from "@chakra-ui/react";
import {
  doc,
  onSnapshot,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { database, simplemodel } from "../firebaseResources/firebaseResources"; // ✅ Gemini (client-side)
import useUserStore from "../hooks/useUserStore";
import { WaveBar } from "./WaveBar";
import translations from "../utils/translation";
import { PasscodePage } from "./PasscodePage";
import { FiCopy } from "react-icons/fi";
import { awardXp } from "../utils/utils";

/* ---------------------------
   Tiny helpers for Gemini streaming
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

// Consume an NDJSON line safely and hand parsed object to cb(obj)
function tryConsumeLine(line, cb) {
  const s = line.indexOf("{");
  const e = line.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return;
  try {
    const obj = JSON.parse(line.slice(s, e + 1));
    cb?.(obj);
  } catch {
    // ignore
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
  // ✅ ready flag so first generated question uses the user's settings
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!npub) {
      setReady(true); // no user doc -> use defaults immediately
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
      setReady(true); // ✅ we've loaded user settings at least once
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub, ready };
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
   Prompts (stream-first variants)
--------------------------- */
const resolveSupportLang = (supportLang, appUILang) =>
  supportLang === "bilingual"
    ? appUILang === "es"
      ? "es"
      : "en"
    : supportLang === "es"
    ? "es"
    : "en";

/* FILL — stream phases */
function buildFillStreamPrompt({
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

  return [
    `Create ONE short ${TARGET} grammar fill-in-the-blank with a single blank "___". Difficulty: ${diff}`,
    `- No meta like "(to go)" in the stem; ≤120 chars.`,
    `- Consider learner recent corrects: ${JSON.stringify(
      recentGood.slice(-3)
    )}`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    wantTranslation
      ? `- Provide a ${SUPPORT} translation.`
      : `- Provide empty translation "".`,
    "",
    "Stream as NDJSON in phases:",
    `{"type":"fill","phase":"q","question":"<stem in ${TARGET}>"}  // emit ASAP`,
    `{"type":"fill","phase":"meta","hint":"<${SUPPORT} hint>","translation":"<${SUPPORT} translation or empty string>"}  // then`,
    `{"type":"done"}`,
  ].join("\n");
}

function buildFillJudgePrompt({ targetLang, question, userAnswer, hint }) {
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

/* MATCH — stream with explicit answer map */
function buildMatchStreamPrompt({
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
  const diff = difficultyHint(level, xp);

  return [
    `Create ONE ${TARGET} GRAMMAR matching exercise using exactly ONE grammar family (coherent set). Difficulty: ${diff}.`,
    `Stay related to recent correct topics: ${JSON.stringify(
      recentGood.slice(-3)
    )}`,
    "",
    "Allowed families (pick ONE for all rows):",
    "1) Subject pronoun → correct present form of ONE high-frequency verb",
    "2) Verb (infinitive) → past participle (or simple past)",
    "3) Noun (singular) → plural form",
    "4) Adjective (base) → comparative form",
    "5) Personal pronoun → object/indirect/possessive form (pick one)",
    `6) Time signal → appropriate tense/aspect label (within ${TARGET})`,
    "",
    `- All items in ${TARGET}; hint in ${SUPPORT} (≤ 8 words).`,
    "- 3–6 rows; left/right unique; clear 1:1 mapping.",
    "- One concise instruction as the stem; no meta like “(to go)” inside items.",
    "",
    "Emit exactly TWO NDJSON lines:",
    `{"type":"match","stem":"<${TARGET} stem>","left":["..."],"right":["..."],"map":[0,2,1], "hint":"<${SUPPORT} hint>"}`,
    `{"type":"done"}`,
  ].join("\n");
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

function buildMCStreamPrompt({
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

  return [
    `Create ONE ${TARGET} multiple-choice grammar question (EXACTLY one correct). Difficulty: ${diff}`,
    `- Stem short (≤120 chars), may include "___".`,
    `- 4 distinct choices in ${TARGET}.`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    wantTranslation
      ? `- ${SUPPORT} translation of stem.`
      : `- Empty translation "".`,
    `- Consider learner recent corrects: ${JSON.stringify(
      recentGood.slice(-3)
    )}`,
    "",
    "Stream as NDJSON:",
    `{"type":"mc","phase":"q","question":"<stem in ${TARGET}>"}  // first`,
    `{"type":"mc","phase":"choices","choices":["A","B","C","D"]} // second`,
    `{"type":"mc","phase":"meta","hint":"<${SUPPORT} hint>","answer":"<exact correct choice text>","translation":"<${SUPPORT} translation or empty>"} // third`,
    `{"type":"done"}`,
  ].join("\n");
}

function buildMCJudgePrompt({ targetLang, stem, choices, userChoice, hint }) {
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

function buildMAStreamPrompt({
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

  return [
    `Create ONE ${TARGET} multiple-answer grammar question (EXACTLY 2 or 3 correct). Difficulty: ${diff}`,
    `- Stem short (≤120 chars), may include "___".`,
    `- 5–6 distinct choices in ${TARGET}.`,
    `- Hint in ${SUPPORT} (≤8 words).`,
    wantTranslation
      ? `- ${SUPPORT} translation of stem.`
      : `- Empty translation "".`,
    `- Consider learner recent corrects: ${JSON.stringify(
      recentGood.slice(-3)
    )}`,
    "",
    "Stream as NDJSON:",
    `{"type":"ma","phase":"q","question":"<stem in ${TARGET}>"}  // first`,
    `{"type":"ma","phase":"choices","choices":["..."]}           // second`,
    `{"type":"ma","phase":"meta","hint":"<${SUPPORT} hint>","answers":["<correct>","<correct>"],"translation":"<${SUPPORT} translation or empty>"} // third`,
    `{"type":"done"}`,
  ].join("\n");
}

function buildMAJudgePrompt({
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

/* Normalize 0-based or 1-based 'map' arrays coming from model */
function normalizeMap(map, len) {
  const arr = Array.isArray(map) ? map.map((n) => parseInt(n, 10)) : [];
  if (!arr.length || arr.some((n) => Number.isNaN(n))) return [];
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (min === 0 && max === len - 1) return arr; // already 0-based
  if (min === 1 && max === len) return arr.map((n) => n - 1); // 1-based
  return [];
}

/* ---------------------------
   Component
--------------------------- */
export default function GrammarBook({ userLanguage = "en" }) {
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

  // random-by-default vs user-locked mode
  const [modeLocked, setModeLocked] = useState(false);
  const autoInitRef = useRef(false);

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

  // ---- FILL ----
  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [translation, setTranslation] = useState("");
  const [input, setInput] = useState("");
  const [loadingQ, setLoadingQ] = useState(false);
  const [loadingG, setLoadingG] = useState(false);

  // ---- MC ----
  const [mcQ, setMcQ] = useState("");
  const [mcHint, setMcHint] = useState("");
  const [mcChoices, setMcChoices] = useState([]);
  const [mcAnswer, setMcAnswer] = useState("");
  const [mcTranslation, setMcTranslation] = useState("");
  const [mcPick, setMcPick] = useState("");
  const [mcResult, setMcResult] = useState(""); // kept for firestore text; not shown
  const [loadingMCQ, setLoadingMCQ] = useState(false);
  const [loadingMCG, setLoadingMCG] = useState(false);

  // ---- MA ----
  const [maQ, setMaQ] = useState("");
  const [maHint, setMaHint] = useState("");
  const [maChoices, setMaChoices] = useState([]);
  const [maAnswers, setMaAnswers] = useState([]); // correct strings
  const [maTranslation, setMaTranslation] = useState("");
  const [maPicks, setMaPicks] = useState([]); // selected strings
  const [maResult, setMaResult] = useState(""); // kept for firestore text; not shown
  const [loadingMAQ, setLoadingMAQ] = useState(false);
  const [loadingMAG, setLoadingMAG] = useState(false);

  // ---- MATCH (DnD) ----
  const [mStem, setMStem] = useState("");
  const [mHint, setMHint] = useState("");
  const [mLeft, setMLeft] = useState([]); // strings
  const [mRight, setMRight] = useState([]); // strings
  const [mSlots, setMSlots] = useState([]); // per-left slot: rightIndex | null
  const [mBank, setMBank] = useState([]); // right indices not yet used
  const [mResult, setMResult] = useState(""); // kept for firestore text; not shown
  const [loadingMG, setLoadingMG] = useState(false);
  const [loadingMJ, setLoadingMJ] = useState(false);
  const [mAnswerMap, setMAnswerMap] = useState([]); // ✅ right index for each left (deterministic)

  /* ---------- RANDOM GENERATOR (default on mount & for Next unless user locks a type) ---------- */
  function generateRandom() {
    const fns = [generateFill, generateMC, generateMA, generateMatch];
    const pick = Math.floor(Math.random() * fns.length);
    fns[pick]();
  }

  /* ---------- AUTO-GENERATE on first render (respect language settings) ---------- */
  // ✅ Wait until 'ready' so the very first prompt uses the user's target/support language.
  useEffect(() => {
    if (autoInitRef.current) return;
    if (showPasscodeModal) return;
    if (!ready) return;
    autoInitRef.current = true;
    generateRandom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, showPasscodeModal]);

  /* ---------- STREAM Generate: Fill ---------- */
  async function generateFill() {
    setMode("fill");
    setLoadingQ(true);
    setInput("");
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    setQuestion("");
    setHint("");
    setTranslation("");

    const prompt = buildFillStreamPrompt({
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
            if (obj?.type === "fill" && obj.phase === "q" && obj.question) {
              setQuestion(String(obj.question));
              gotSomething = true;
            } else if (obj?.type === "fill" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setHint(obj.hint);
              if (typeof obj.translation === "string")
                setTranslation(obj.translation);
              gotSomething = true;
            }
          });
        }
      }

      // Flush any trailing text after stream ends
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
              if (obj?.type === "fill" && obj.phase === "q" && obj.question) {
                setQuestion(String(obj.question));
                gotSomething = true;
              } else if (obj?.type === "fill" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setHint(obj.hint);
                if (typeof obj.translation === "string")
                  setTranslation(obj.translation);
                gotSomething = true;
              }
            })
          );
      }

      if (!gotSomething) throw new Error("no-fill");
    } catch {
      // Fallback (unchanged)
      const fallbackPrompt = `
Write ONE short ${LANG_NAME(
        targetLang
      )} grammar question with a single blank "___".
- No meta like "(to go)" in the question.
- ≤ 120 chars.
Return EXACTLY: <question> ||| <hint in ${LANG_NAME(
        resolveSupportLang(supportLang, userLanguage)
      )} (≤ 8 words)> ||| <${
        showTranslations
          ? LANG_NAME(resolveSupportLang(supportLang, userLanguage))
          : ""
      } translation or "">
`.trim();

      const text = await callResponses({ model: MODEL, input: fallbackPrompt });
      const [q, h, tr] = text.split("|||").map((s) => (s || "").trim());
      if (q) {
        setQuestion(q);
        setHint(h || "");
        setTranslation(tr || "");
      } else {
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
    } finally {
      setLoadingQ(false);
    }
  }

  /* ---------- STREAM Generate: MC ---------- */
  async function generateMC() {
    setMode("mc");
    setLoadingMCQ(true);
    setMcResult("");
    setMcPick("");
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    setMcQ("");
    setMcHint("");
    setMcChoices([]);
    setMcAnswer("");
    setMcTranslation("");

    const prompt = buildMCStreamPrompt({
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
            if (obj?.type === "mc" && obj.phase === "q" && obj.question) {
              setMcQ(String(obj.question));
              got = true;
            } else if (
              obj?.type === "mc" &&
              obj.phase === "choices" &&
              Array.isArray(obj.choices)
            ) {
              const choices = obj.choices.slice(0, 4).map(String);
              setMcChoices(choices);
              // If answer already known, align it
              if (pendingAnswer) {
                const ans =
                  choices.find((c) => norm(c) === norm(pendingAnswer)) ||
                  choices[0];
                setMcAnswer(ans);
              }
              got = true;
            } else if (obj?.type === "mc" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setMcHint(obj.hint);
              if (typeof obj.translation === "string")
                setMcTranslation(obj.translation);
              if (typeof obj.answer === "string") {
                pendingAnswer = obj.answer;
                if (Array.isArray(mcChoices) && mcChoices.length) {
                  const ans =
                    mcChoices.find((c) => norm(c) === norm(pendingAnswer)) ||
                    mcChoices[0];
                  setMcAnswer(ans);
                }
              }
              got = true;
            }
          });
        }
      }

      // Flush tail
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
              if (obj?.type === "mc" && obj.phase === "q" && obj.question) {
                setMcQ(String(obj.question));
                got = true;
              } else if (
                obj?.type === "mc" &&
                obj.phase === "choices" &&
                Array.isArray(obj.choices)
              ) {
                const choices = obj.choices.slice(0, 4).map(String);
                setMcChoices(choices);
                if (pendingAnswer) {
                  const ans =
                    choices.find((c) => norm(c) === norm(pendingAnswer)) ||
                    choices[0];
                  setMcAnswer(ans);
                }
                got = true;
              } else if (obj?.type === "mc" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setMcHint(obj.hint);
                if (typeof obj.translation === "string")
                  setMcTranslation(obj.translation);
                if (typeof obj.answer === "string") {
                  pendingAnswer = obj.answer;
                  if (Array.isArray(mcChoices) && mcChoices.length) {
                    const ans =
                      mcChoices.find((c) => norm(c) === norm(pendingAnswer)) ||
                      mcChoices[0];
                    setMcAnswer(ans);
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
      const fallback = `
Create ONE multiple-choice ${LANG_NAME(
        targetLang
      )} grammar question. Return JSON ONLY:
{
  "question": "<stem>",
  "hint": "<hint in ${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )}>",
  "choices": ["A","B","C","D"],
  "answer": "<exact correct choice>",
  "translation": "${showTranslations ? "<translation>" : ""}"
}
`.trim();

      const text = await callResponses({ model: MODEL, input: fallback });
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
    } finally {
      setLoadingMCQ(false);
    }
  }

  /* ---------- STREAM Generate: MA ---------- */
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
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    setMaQ("");
    setMaHint("");
    setMaChoices([]);
    setMaAnswers([]);
    setMaTranslation("");

    const prompt = buildMAStreamPrompt({
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
            if (obj?.type === "ma" && obj.phase === "q" && obj.question) {
              setMaQ(String(obj.question));
              got = true;
            } else if (
              obj?.type === "ma" &&
              obj.phase === "choices" &&
              Array.isArray(obj.choices)
            ) {
              const choices = obj.choices.slice(0, 6).map(String);
              setMaChoices(choices);
              // If we already have pending answers, align them
              if (pendingAnswers?.length) {
                const aligned = pendingAnswers.filter((a) =>
                  choices.some((c) => norm(c) === norm(a))
                );
                if (aligned.length >= 2) setMaAnswers(aligned);
              }
              got = true;
            } else if (obj?.type === "ma" && obj.phase === "meta") {
              if (typeof obj.hint === "string") setMaHint(obj.hint);
              if (typeof obj.translation === "string")
                setMaTranslation(obj.translation);
              if (Array.isArray(obj.answers)) {
                pendingAnswers = obj.answers.map(String);
                if (Array.isArray(maChoices) && maChoices.length) {
                  const aligned = pendingAnswers.filter((a) =>
                    maChoices.some((c) => norm(c) === norm(a))
                  );
                  if (aligned.length >= 2) setMaAnswers(aligned);
                }
              }
              got = true;
            }
          });
        }
      }

      // Flush tail
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
              if (obj?.type === "ma" && obj.phase === "q" && obj.question) {
                setMaQ(String(obj.question));
                got = true;
              } else if (
                obj?.type === "ma" &&
                obj.phase === "choices" &&
                Array.isArray(obj.choices)
              ) {
                const choices = obj.choices.slice(0, 6).map(String);
                setMaChoices(choices);
                if (pendingAnswers?.length) {
                  const aligned = pendingAnswers.filter((a) =>
                    choices.some((c) => norm(c) === norm(a))
                  );
                  if (aligned.length >= 2) setMaAnswers(aligned);
                }
                got = true;
              } else if (obj?.type === "ma" && obj.phase === "meta") {
                if (typeof obj.hint === "string") setMaHint(obj.hint);
                if (typeof obj.translation === "string")
                  setMaTranslation(obj.translation);
                if (Array.isArray(obj.answers)) {
                  pendingAnswers = obj.answers.map(String);
                  if (Array.isArray(maChoices) && maChoices.length) {
                    const aligned = pendingAnswers.filter((a) =>
                      maChoices.some((c) => norm(c) === norm(a))
                    );
                    if (aligned.length >= 2) setMaAnswers(aligned);
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
      const fallback = `
Create ONE multiple-answer ${LANG_NAME(
        targetLang
      )} grammar question. Return JSON ONLY:
{
  "question":"<stem>",
  "hint":"<hint in ${LANG_NAME(
    resolveSupportLang(supportLang, userLanguage)
  )}>",
  "choices":["...","...","...","...","..."],
  "answers":["<correct>","<correct>"],
  "translation":"${showTranslations ? "<translation>" : ""}"
}
`.trim();

      const text = await callResponses({ model: MODEL, input: fallback });
      const parsed = sanitizeMA(safeParseJSON(text));
      if (parsed) {
        setMaQ(parsed.question);
        setMaHint(parsed.hint);
        setMaChoices(parsed.choices);
        setMaAnswers(parsed.answers);
        setMaTranslation(parsed.translation);
      } else {
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
        setMaAnswers([
          "She has eaten.",
          "We have finished.",
          "I have seen it.",
        ]);
        setMaTranslation(
          showTranslations && supportCode === "es"
            ? "Selecciona todas las oraciones en presente perfecto."
            : ""
        );
      }
    } finally {
      setLoadingMAQ(false);
    }
  }

  /* ---------- STREAM Generate: MATCH (Gemini with deterministic map) ---------- */
  async function generateMatch() {
    setMode("match");
    setLoadingMG(true);
    setMResult("");
    setLastOk(null);
    setRecentXp(0);
    setNextAction(null);

    // Reset state
    setMStem("");
    setMHint("");
    setMLeft([]);
    setMRight([]);
    setMSlots([]);
    setMBank([]);
    setMAnswerMap([]);

    const prompt = buildMatchStreamPrompt({
      level,
      targetLang,
      supportLang,
      showTranslations,
      appUILang: userLanguage,
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
              obj?.type === "match" &&
              typeof obj.stem === "string" &&
              Array.isArray(obj.left) &&
              Array.isArray(obj.right) &&
              obj.left.length >= 3 &&
              obj.left.length <= 6 &&
              obj.left.length === obj.right.length
            ) {
              const stem = String(obj.stem).trim() || "Empareja los elementos.";
              const left = obj.left.slice(0, 6).map(String);
              const right = obj.right.slice(0, 6).map(String);
              const hint = String(obj.hint || "");
              const map = normalizeMap(obj.map, right.length);
              setMStem(stem);
              setMHint(hint);
              setMLeft(left);
              setMRight(right);
              setMSlots(Array(left.length).fill(null));
              setMBank([...Array(right.length)].map((_, i) => i));
              setMAnswerMap(
                map.length === left.length ? map : [...left.keys()]
              );
              okPayload = true;
            }
          });
        }
      }

      // Flush tail
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
                obj?.type === "match" &&
                typeof obj.stem === "string" &&
                Array.isArray(obj.left) &&
                Array.isArray(obj.right) &&
                obj.left.length >= 3 &&
                obj.left.length <= 6 &&
                obj.left.length === obj.right.length
              ) {
                const stem =
                  String(obj.stem).trim() || "Empareja los elementos.";
                const left = obj.left.slice(0, 6).map(String);
                const right = obj.right.slice(0, 6).map(String);
                const hint = String(obj.hint || "");
                const map = normalizeMap(obj.map, right.length);
                setMStem(stem);
                setMHint(hint);
                setMLeft(left);
                setMRight(right);
                setMSlots(Array(left.length).fill(null));
                setMBank([...Array(right.length)].map((_, i) => i));
                setMAnswerMap(
                  map.length === left.length ? map : [...left.keys()]
                );
                okPayload = true;
              }
            })
          );
      }

      if (!okPayload) throw new Error("no-match");
    } catch {
      // Backend fallback with the same coherence guarantees
      const raw = await callResponses({
        model: MODEL,
        input: `
Create ONE ${LANG_NAME(
          targetLang
        )} GRAMMAR matching exercise (single grammar family, 3–6 rows).
Return JSON ONLY:
{"stem":"<stem>","left":["..."],"right":["..."],"map":[0,2,1],"hint":"<hint in ${LANG_NAME(
          resolveSupportLang(supportLang, userLanguage)
        )}>"}
`.trim(),
      });
      const parsed = safeParseJsonLoose(raw);

      let stem = "",
        left = [],
        right = [],
        hint = "",
        map = [];

      if (
        parsed &&
        Array.isArray(parsed.left) &&
        Array.isArray(parsed.right) &&
        parsed.left.length >= 3 &&
        parsed.left.length <= 6 &&
        parsed.left.length === parsed.right.length
      ) {
        stem = String(parsed.stem || "Empareja los elementos.");
        left = parsed.left.slice(0, 6).map(String);
        right = parsed.right.slice(0, 6).map(String);
        hint = String(parsed.hint || "");
        map = normalizeMap(parsed.map, right.length);
      } else {
        // Safe default set (family: subject → 'to be' present)
        if (targetLang === "es") {
          stem =
            "Relaciona el sujeto con la forma correcta del verbo 'ser' (presente).";
          left = ["yo", "él", "nosotros"];
          right = ["soy", "es", "somos"];
          hint = "Concordancia sujeto–verbo";
          map = [0, 1, 2];
        } else {
          stem = "Match subjects with the correct present form of 'to be'.";
          left = ["I", "she", "they"];
          right = ["am", "is", "are"];
          hint = "Subject–verb agreement";
          map = [0, 1, 2];
        }
      }

      setMStem(stem);
      setMHint(hint);
      setMLeft(left);
      setMRight(right);
      setMSlots(Array(left.length).fill(null));
      setMBank([...Array(right.length)].map((_, i) => i));
      setMAnswerMap(map.length === left.length ? map : [...left.keys()]);
    } finally {
      setLoadingMG(false);
    }
  }

  /* ---------------------------
     Submits (backend judging for fill/mc/ma; deterministic for match)
  --------------------------- */
  async function submitFill() {
    if (!question || !input.trim()) return;
    setLoadingG(true);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildFillJudgePrompt({
        targetLang,
        question,
        userAnswer: input,
        hint,
      }),
    });
    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 12 : 0; // ✅ no XP for wrong answers

    await saveAttempt(npub, {
      ok,
      mode: "fill",
      question,
      hint,
      translation,
      user_input: input,
      award_xp: delta,
    }).catch(() => {});
    if (delta > 0) await awardXp(npub, delta).catch(() => {});

    setLastOk(ok);
    setRecentXp(delta);

    if (ok) {
      setInput("");
      recentCorrectRef.current = [
        ...recentCorrectRef.current,
        { mode: "fill", question },
      ].slice(-5);
      setNextAction(() => (modeLocked ? generateFill : generateRandom)); // ✅ random unless user locked a type
    } else {
      setNextAction(null);
    }

    setLoadingG(false);
  }

  async function submitMC() {
    if (!mcQ || !mcPick) return;
    setLoadingMCG(true);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMCJudgePrompt({
        targetLang,
        stem: mcQ,
        choices: mcChoices,
        userChoice: mcPick,
        hint: mcHint,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 8 : 0; // ✅ no XP for wrong answers

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
    if (delta > 0) await awardXp(npub, delta).catch(() => {});

    setMcResult(ok ? "correct" : "try_again"); // for logs only
    setLastOk(ok);
    setRecentXp(delta);
    setNextAction(
      ok ? (modeLocked ? () => generateMC : () => generateRandom) : null
    );

    setLoadingMCG(false);
  }

  async function submitMA() {
    if (!maQ || !maPicks.length) return;
    setLoadingMAG(true);

    const verdictRaw = await callResponses({
      model: MODEL,
      input: buildMAJudgePrompt({
        targetLang,
        stem: maQ,
        choices: maChoices,
        userSelections: maPicks,
        hint: maHint,
      }),
    });

    const ok = (verdictRaw || "").trim().toUpperCase().startsWith("Y");
    const delta = ok ? 10 : 0; // ✅ no XP for wrong answers

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
    if (delta > 0) await awardXp(npub, delta).catch(() => {});

    setMaResult(ok ? "correct" : "try_again"); // for logs only
    setLastOk(ok);
    setRecentXp(delta);
    setNextAction(
      ok ? (modeLocked ? () => generateMA : () => generateRandom) : null
    );

    setLoadingMAG(false);
  }

  function canSubmitMatch() {
    return mLeft.length > 0 && mSlots.every((ri) => ri !== null);
  }

  // ✅ Deterministic judge for Match using the returned map
  async function submitMatch() {
    if (!canSubmitMatch()) return;
    setLoadingMJ(true);

    const userPairs = mSlots.map((ri, li) => [li, ri]);

    let ok = false;
    if (mAnswerMap.length === mSlots.length) {
      ok = mSlots.every((ri, li) => ri === mAnswerMap[li]);
    } else {
      ok = false;
    }

    const delta = ok ? 12 : 0; // ✅ no XP for wrong answers

    setMResult(ok ? "correct" : "try_again"); // for logs only

    await saveAttempt(npub, {
      ok,
      mode: "match",
      question: mStem,
      hint: mHint,
      left: mLeft,
      right: mRight,
      user_pairs: userPairs,
      answer_map: mAnswerMap,
      award_xp: delta,
    }).catch(() => {});
    if (delta > 0) await awardXp(npub, delta).catch(() => {});

    setLastOk(ok);
    setRecentXp(delta);
    setNextAction(
      ok ? (modeLocked ? () => generateMatch : () => generateRandom) : null
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
        {ok ? "✓" : "✖"} {label}
        {xp > 0 ? ` · +${xp} XP 🎉` : ""}
      </Badge>
    );
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch" maxW="720px" mx="auto">
        {/* Shared progress header */}
        <Box display={"flex"} justifyContent={"center"}>
          <Box w="50%">
            <HStack justify="space-between" mb={1}>
              <Badge variant="subtle">
                {t("grammar_badge_level", { level: levelNumber })}
              </Badge>
              <Badge variant="subtle">{t("grammar_badge_xp", { xp })}</Badge>
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

        {/* Generators */}
        <SimpleGrid
          columns={{ base: 2, md: 4 }}
          spacing={{ base: 2, md: 3 }}
          w="100%"
        >
          {[
            {
              key: "grammar_btn_fill",
              onClick: () => {
                setModeLocked(true); // ✅ user locks type
                generateFill();
              },
              loading: loadingQ,
            },
            {
              key: "grammar_btn_mc",
              onClick: () => {
                setModeLocked(true);
                generateMC();
              },
              loading: loadingMCQ,
            },
            {
              key: "grammar_btn_ma",
              onClick: () => {
                setModeLocked(true);
                generateMA();
              },
              loading: loadingMAQ,
            },
            {
              key: "grammar_btn_match",
              onClick: () => {
                setModeLocked(true);
                generateMatch();
              },
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
        {mode === "fill" && (question || loadingQ) ? (
          <>
            <HStack align="start">
              <CopyAllBtn
                q={question}
                h={hint}
                tr={showTRFill ? translation : ""}
              />
              <Text fontWeight="semibold" flex="1">
                {question || (loadingQ ? "…" : "")}
              </Text>
            </HStack>
            {showTRFill && translation ? (
              <Text fontSize="sm" opacity={0.8}>
                {translation}
              </Text>
            ) : null}
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
                isDisabled={loadingG || !input.trim() || !question}
              >
                {loadingG ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
              {lastOk === true && nextAction ? (
                <Button variant="outline" onClick={handleNext}>
                  {t("grammar_next") || "Next"}
                </Button>
              ) : null}
            </HStack>

            <HStack spacing={3} mt={1}>
              <ResultBadge ok={lastOk} xp={recentXp} />
            </HStack>
          </>
        ) : null}

        {/* ---- MC UI ---- */}
        {mode === "mc" && (mcQ || loadingMCQ) ? (
          <>
            <HStack align="start">
              <CopyAllBtn
                q={mcQ}
                h={mcHint}
                tr={showTRMC ? mcTranslation : ""}
              />
              <Text fontWeight="semibold" flex="1">
                {mcQ || (loadingMCQ ? "…" : "")}
              </Text>
            </HStack>
            {showTRMC && mcTranslation ? (
              <Text fontSize="sm" opacity={0.8}>
                {mcTranslation}
              </Text>
            ) : null}
            {mcHint ? (
              <Text fontSize="sm" opacity={0.85}>
                💡 {mcHint}
              </Text>
            ) : null}

            <RadioGroup value={mcPick} onChange={setMcPick}>
              <Stack spacing={2}>
                {(mcChoices.length
                  ? mcChoices
                  : loadingMCQ
                  ? ["…", "…", "…", "…"]
                  : []
                ).map((c, i) => (
                  <Radio value={c} key={i} isDisabled={!mcChoices.length}>
                    {c}
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>

            <HStack>
              <Button
                onClick={submitMC}
                isDisabled={loadingMCG || !mcPick || !mcChoices.length}
              >
                {loadingMCG ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
              {lastOk === true && nextAction ? (
                <Button variant="outline" onClick={handleNext}>
                  {t("grammar_next") || "Next"}
                </Button>
              ) : null}
            </HStack>

            <HStack spacing={3} mt={1}>
              <ResultBadge ok={lastOk} xp={recentXp} />
            </HStack>
          </>
        ) : null}

        {/* ---- MA UI ---- */}
        {mode === "ma" && (maQ || loadingMAQ) ? (
          <>
            <HStack align="start">
              <CopyAllBtn
                q={maQ}
                h={maHint}
                tr={showTRMA ? maTranslation : ""}
              />
              <Text fontWeight="semibold" flex="1">
                {maQ || (loadingMAQ ? "…" : "")}
              </Text>
            </HStack>
            {showTRMA && maTranslation ? (
              <Text fontSize="sm" opacity={0.8}>
                {maTranslation}
              </Text>
            ) : null}
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
                {(maChoices.length
                  ? maChoices
                  : loadingMAQ
                  ? ["…", "…", "…", "…", "…"]
                  : []
                ).map((c, i) => (
                  <Checkbox value={c} key={i} isDisabled={!maChoices.length}>
                    {c}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>

            <HStack>
              <Button
                onClick={submitMA}
                isDisabled={loadingMAG || !maPicks.length || !maChoices.length}
              >
                {loadingMAG ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
              {lastOk === true && nextAction ? (
                <Button variant="outline" onClick={handleNext}>
                  {t("grammar_next") || "Next"}
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
                                {t("grammar_dnd_drop_here")}
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
                {loadingMJ ? <Spinner size="sm" /> : t("grammar_submit")}
              </Button>
              {lastOk === true && nextAction ? (
                <Button variant="outline" onClick={handleNext}>
                  {t("grammar_next") || "Next"}
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

/* ---------------------------
   Firestore logging helper
--------------------------- */
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
