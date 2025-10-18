// components/History.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Badge,
  Button,
  HStack,
  VStack,
  Text,
  Spinner,
  Divider,
  IconButton,
  useDisclosure,
  Collapse,
} from "@chakra-ui/react";
import { FaVolumeUp, FaStop } from "react-icons/fa";
import { MdMenuBook } from "react-icons/md";
import {
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import useUserStore from "../hooks/useUserStore";
import { WaveBar } from "./WaveBar";
import translations from "../utils/translation";
import { PasscodePage } from "./PasscodePage";
import { awardXp } from "../utils/utils";
import { simplemodel } from "../firebaseResources/firebaseResources"; // ✅ Gemini streaming

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
   LLM plumbing (backend for XP scoring + fallback)
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

async function normalizeLectureTexts({
  targetText,
  supportText,
  targetLang,
  supportLang,
}) {
  const cleanTarget = sanitizeLectureBlock(targetText, targetLang);
  let cleanSupport = sanitizeLectureBlock(supportText, supportLang);

  const shouldTranslateSupport =
    supportLang &&
    supportLang !== targetLang &&
    cleanTarget &&
    (!cleanSupport ||
      normalizeForCompare(cleanSupport) === normalizeForCompare(cleanTarget));

  if (shouldTranslateSupport) {
    const prompt = [
      `Translate the following text from ${LANG_NAME(targetLang)} (${targetLang}) into ${LANG_NAME(supportLang)} (${supportLang}).`,
      "Return only the translation in that language without labels, speaker names, or commentary.",
      "",
      cleanTarget,
    ].join("\n");

    const translatedRaw = await callResponses({ model: MODEL, input: prompt });
    const translatedClean = sanitizeLectureBlock(translatedRaw, supportLang);
    if (translatedClean) {
      cleanSupport = translatedClean;
    }
  }

  if (cleanTarget && supportLang === targetLang) {
    cleanSupport = cleanTarget;
  }

  if (!cleanSupport && cleanTarget) {
    cleanSupport = cleanTarget;
  }

  return { cleanTarget, cleanSupport };
}

/* ---------------------------
   User / XP / Settings
--------------------------- */
const LANG_NAME = (code) =>
  ({ en: "English", es: "Spanish", nah: "Nahuatl" }[code] || code);

const LANGUAGE_LABELS = {
  en: ["English", "Inglés"],
  es: ["Spanish", "Español"],
  nah: ["Nahuatl", "Náhuatl"],
};

const GENERIC_LANGUAGE_PREFIXES = [
  "Target",
  "Support",
  "Translation",
  "Traducción",
  "Translated",
];

const SPECIAL_REGEX_CHARS = new Set([
  ".",
  "*",
  "+",
  "?",
  "^",
  "$",
  "{",
  "}",
  "(",
  ")",
  "|",
  "[",
  "]",
  "\\",
]);
const escapeRegExp = (str) =>
  String(str ?? "")
    .split("")
    .map((ch) => (SPECIAL_REGEX_CHARS.has(ch) ? `\\${ch}` : ch))
    .join("");

function buildLabelTokens(langCode) {
  const baseNames = [
    ...(LANGUAGE_LABELS[langCode] || []),
    LANG_NAME(langCode),
  ].filter(Boolean);
  const tokens = new Set();
  baseNames.forEach((name) => {
    if (!name) return;
    const variants = [name, name.toLowerCase()];
    variants.forEach((variant) => {
      tokens.add(variant);
      tokens.add(`${variant} translation`);
      tokens.add(`${variant} Translation`);
      tokens.add(`${variant} traducción`);
      tokens.add(`${variant} Traducción`);
    });
  });
  GENERIC_LANGUAGE_PREFIXES.forEach((prefix) => {
    tokens.add(prefix);
    baseNames.forEach((name) => {
      tokens.add(`${prefix} (${name})`);
      tokens.add(`${prefix} ${name}`);
      tokens.add(`${name} ${prefix.toLowerCase()}`);
    });
  });
  return Array.from(tokens).filter(Boolean);
}

function stripLineLabel(text, langCode) {
  if (!text) return "";
  const tokens = buildLabelTokens(langCode);
  let output = text.trim();
  if (tokens.length) {
    const pattern = new RegExp(
      `^(?:${tokens.map((token) => escapeRegExp(token)).join("|")})\\s*[:\\-–—]\\s*`,
      "i"
    );
    output = output.replace(pattern, "").trim();
  }
  output = output.replace(/^\[\s*/, "").replace(/\s*\]$/, "").trim();
  output = output.replace(/^[•·\-–—]+\s*/, "").trim();
  return output;
}

function sanitizeLectureBlock(text, langCode) {
  if (!text) return "";
  return text
    .split(/\n+/)
    .map((line) => stripLineLabel(line, langCode))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const normalizeForCompare = (text) =>
  (text || "").replace(/\s+/g, " ").trim().toLowerCase();

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
    voice: "alloy",
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
        voice: p.voice || "alloy",
      });
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub };
}

/* ---------------------------
   Difficulty + Prompts
--------------------------- */
function difficultyHint(level, xp) {
  const band = xp < 150 ? 0 : xp < 400 ? 1 : 2;
  if (level === "beginner") {
    return [
      "Short, simple syntax.",
      "Short with a few details.",
      "Short with transitions.",
    ][band];
  }
  if (level === "intermediate") {
    return [
      "Add some connectors.",
      "Add comparisons & causes.",
      "Add brief nuance & context.",
    ][band];
  }
  return [
    "Concise but advanced.",
    "Analytical with nuance.",
    "Denser, more academic tone.",
  ][band];
}

// Seed: FIRST lecture must be Bering migration
function buildSeedLecturePrompt({ targetLang, supportLang, level, xp }) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);
  const diff = difficultyHint(level, xp);

  return `
Write ONE short lecture in ${TARGET} (≈180–260 words) about the **initial migration from Siberia across the Bering Strait (Beringia)** into the Americas. Suitable for a ${level} learner. Difficulty: ${diff}.

Requirements:
- Mention approximate time frames (e.g., Late Pleistocene), changing climates/sea levels, and possible inland/coastal routes.
- Note types of evidence (archaeology, genetics, languages) without getting too technical.
- Keep it engaging and clear.

Include:
- A concise title (<= 60 chars) in ${TARGET}.
- 3 concise bullet takeaways in ${TARGET}.
- A full ${SUPPORT} translation of the lecture (NOT the takeaways).

Language restrictions:
- Use ${TARGET} only for the title, lecture body, and takeaways.
- Use ${SUPPORT} only for the translation.
- Do NOT include any other languages, language labels, or commentary.

Return JSON ONLY:
{
  "title": "<short title in ${TARGET}>",
  "target": "<lecture body in ${TARGET}>",
  "takeaways": ["<3 bullets in ${TARGET}>"],
  "support": "<full translation in ${SUPPORT}>"
}
`.trim();
}

// General progression (after seed), based on prior titles
function buildLecturePrompt({
  previousTitles,
  targetLang,
  supportLang,
  level,
  xp,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);
  const diff = difficultyHint(level, xp);
  const prev =
    previousTitles && previousTitles.length
      ? previousTitles.map((t) => `- ${t}`).join("\n")
      : "(none yet)";

  return `
You are curating a long, progressive curriculum of short lectures on Mexican and Mesoamerican history.
Choose the **next granular topic** based on the list of previous lecture titles (chronological if possible; otherwise deepen a thread).
Avoid repetition. Favor specificity: a city, figure, event, reform, battle, treaty, cultural theme, or policy.

previous_titles:
${prev}

Write ONE lecture in ${TARGET} (≈180–260 words), suitable for a ${level} learner. Difficulty: ${diff}.
Include:
- A concise title (<= 60 chars).
- 3 concise bullet takeaways.
- Touch on people, culture, governments, and/or wars as relevant.
- Provide a full ${SUPPORT} translation of the lecture (NOT the takeaways).

Language restrictions:
- Use ${TARGET} only for the title, lecture body, and takeaways.
- Use ${SUPPORT} only for the translation.
- Do NOT include any other languages, labels, or commentary.

Return JSON ONLY:
{
  "title": "<short title in ${TARGET}>",
  "target": "<lecture body in ${TARGET}>",
  "takeaways": ["<3 bullets in ${TARGET}>"],
  "support": "<full translation in ${SUPPORT}>"
}
`.trim();
}

/* ---------------------------
   XP scoring (kept on backend)
--------------------------- */
function buildXpPrompt({
  title,
  target,
  takeaways,
  previousTitles,
  level,
  currentXp,
  hoursSinceLastLecture,
}) {
  const prev =
    previousTitles && previousTitles.length
      ? previousTitles.map((t) => `- ${t}`).join("\n")
      : "(none yet)";

  return `
You are an impartial XP rater for a language-learning history app.

Given the NEW lecture and the list of PREVIOUS lecture titles, assign an XP integer for this session.
Consider:
- Novelty vs. previous titles (avoid repetition; reward progression or deepening a thread).
- Topic granularity/specificity (figures, events, policies), and overall difficulty for the user's level: ${level}.
- Coverage balance (people, culture, governments, wars) at least touched.
- Text density/length (≈180–260 words is ideal).
- Consistency/streak: if hours_since_last_lecture <= 48, give a small streak bonus.
- Current user XP: ${currentXp} (slightly increase expectations as XP grows).

Return JSON ONLY in this strict schema:

{
  "xp": <integer between 20 and 70>,
  "reason": "<one-sentence reason>"
}

previous_titles:
${prev}

new_title: ${title}

new_lecture_excerpt:
${target.slice(0, 900)}

new_takeaways:
${Array.isArray(takeaways) ? takeaways.join(" | ") : ""}
hours_since_last_lecture: ${hoursSinceLastLecture ?? "null"}
`.trim();
}

async function computeAdaptiveXp({
  title,
  target,
  takeaways,
  previousTitles,
  level,
  currentXp,
  hoursSinceLastLecture,
}) {
  const MIN = 20;
  const MAX = 35;

  try {
    const prompt = buildXpPrompt({
      title,
      target,
      takeaways,
      previousTitles,
      level,
      currentXp,
      hoursSinceLastLecture,
    });
    const raw = await callResponses({ model: MODEL, input: prompt });
    const parsed = safeParseJSON(raw);

    const xpRaw = Math.round(Number(parsed?.xp));
    const xp = Number.isFinite(xpRaw)
      ? Math.max(MIN, Math.min(MAX, xpRaw))
      : null;

    const reason =
      typeof parsed?.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim()
        : "Auto-scored by rubric.";

    if (xp !== null) return { xp, reason };
  } catch {}

  // Heuristic fallback (kept inside 20–35)
  let score = 28; // center
  // Nudge by density
  score += target.length > 230 ? 3 : target.length < 170 ? -2 : 0;
  // Novelty vs previous titles
  const looksRepeated = previousTitles?.some((t) =>
    String(t || "")
      .toLowerCase()
      .includes(String(title || "").toLowerCase())
  );
  score += looksRepeated ? -2 : 2;
  // Streak bonus
  score += hoursSinceLastLecture != null && hoursSinceLastLecture <= 48 ? 2 : 0;
  // Level tweak
  score += level === "advanced" ? 3 : level === "intermediate" ? 1 : 0;

  const xp = Math.max(MIN, Math.min(MAX, score));
  return { xp, reason: "Heuristic fallback scoring." };
}

/* ---------------------------
   TTS (no highlighting)
--------------------------- */
const BCP47 = {
  es: { tts: "es-ES" },
  en: { tts: "en-US" },
  nah: { tts: "es-ES" },
};

/* ---------------------------
   Gemini stream helpers
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

function buildStreamingPrompt({
  isFirst,
  previousTitles,
  targetLang,
  supportLang,
  level,
  xp,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);
  const diff = difficultyHint(level, xp);
  const prev =
    previousTitles && previousTitles.length
      ? previousTitles.map((t) => `- ${t}`).join("\n")
      : "(none yet)";

  const baseTopic = isFirst
    ? `Topic: the initial migration from Siberia across Beringia into the Americas (Late Pleistocene, sea levels, inland/coastal routes, evidence types).`
    : `Choose the next granular topic for Mexican/Mesoamerican history. Avoid repeating previous_titles. Prefer specificity (figure, city, battle, reform, treaty, cultural theme, or policy) and a coherent progression.\nprevious_titles:\n${prev}`;

  return [
    `You are writing an educational *history lecture* for language learners.`,
    baseTopic,
    `Target language: ${TARGET} (${targetLang}). Provide a full translation in ${SUPPORT} (${supportLang}).`,
    `Style: ~180–260 words, ${diff}.`,
    "",
    "OUTPUT PROTOCOL — NDJSON (one compact JSON object per line):",
    `1) {"type":"title","text":"<title in ${TARGET} (<=60 chars)>"} (emit once, early)`,
    `2) Emit the lecture body sentence-by-sentence in ${TARGET}: {"type":"target","text":"<one sentence>"} (4–10 lines total)`,
    `3) Then emit the full translation sentence-by-sentence in ${SUPPORT}: {"type":"support","text":"<one sentence>"} (mirrors the body)`,
    `4) Emit exactly three takeaways (bullets) in ${TARGET}: {"type":"takeaway","text":"<concise takeaway>"} (3 lines)`,
    '5) Finally emit {"type":"done"}',
    "",
    "STRICT RULES:",
    `- Use ${TARGET} only for \"title\", \"target\", and \"takeaway\" lines.`,
    `- Use ${SUPPORT} only for \"support\" lines.`,
    "- Do not include any other languages, labels, or commentary.",
    "- Do not output code fences or commentary.",
    "- Each line must be a single valid JSON object matching one of the types above.",
    "- Keep sentences 8–22 words; simple, clear, engaging.",
  ].join("\n");
}

/* ---------------------------
   Component
--------------------------- */
export default function History({ userLanguage = "en" }) {
  const t = useT(userLanguage);
  const user = useUserStore((s) => s.user);

  // ---- Dedup & concurrency guards ----
  const generatingRef = useRef(false); // synchronous mutex to stop double invokes

  const { xp, levelNumber, progressPct, progress, npub } = useSharedProgress();

  const targetLang = ["en", "es", "nah"].includes(progress.targetLang)
    ? progress.targetLang
    : "es";
  const supportLang =
    progress.supportLang === "bilingual"
      ? userLanguage === "es"
        ? "es"
        : "en"
      : progress.supportLang || "en";
  const showTranslations = progress.showTranslations !== false;

  const localizedLangName = (code) =>
    ({
      en: t("language_en"),
      es: t("language_es"),
      nah: t("language_nah"),
    }[code] || code);

  const targetDisplay = localizedLangName(targetLang);
  const supportDisplay = localizedLangName(supportLang);

  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  useEffect(() => {
    if (
      levelNumber > 2 &&
      localStorage.getItem("passcode") !== import.meta.env.VITE_PATREON_PASSCODE
    ) {
      setShowPasscodeModal(true);
    }
  }, [xp, levelNumber]);

  // List
  const [lectures, setLectures] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const listDisclosure = useDisclosure({ defaultIsOpen: false }); // mobile list toggle

  // Generate state
  const [isGenerating, setIsGenerating] = useState(false);

  // Reading state
  const [isReadingTarget, setIsReadingTarget] = useState(false);
  const [isReadingSupport, setIsReadingSupport] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Refs for audio
  const currentAudioRef = useRef(null);

  // streaming draft lecture (local only while generating)
  const [draftLecture, setDraftLecture] = useState(null); // {title,target,support,takeaways[]}

  // refs for auto-scroll (mobile + desktop lists)
  const mobileEndRef = useRef(null);
  const desktopEndRef = useRef(null);

  // Auto-scroll to bottom when a new lecture arrives
  useEffect(() => {
    requestAnimationFrame(() => {
      mobileEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
      desktopEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [lectures.length]);

  // Live sync lectures
  useEffect(() => {
    if (!npub) return;
    const col = collection(database, "users", npub, "historyLectures");
    const q = query(col, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.createdAtClient || 0) - (b.createdAtClient || 0));
      setLectures(items);
      if (!activeId && items.length) setActiveId(items[items.length - 1].id);
    });
    return () => unsub();
  }, [npub]); // eslint-disable-line

  const activeLecture = useMemo(
    () => lectures.find((l) => l.id === activeId) || null,
    [lectures, activeId]
  );

  // Which lecture to show in the main pane (draft while streaming, else saved)
  const viewLecture = draftLecture || activeLecture;

  // Reset reading when switching lecture or when draft toggles
  useEffect(() => {
    stopSpeech();
  }, [activeId, draftLecture]); // eslint-disable-line

  // quick duplicate detector against the most recent saved lecture (same title+target within 15s)
  const isDuplicateOfLast = (titleStr, targetStr) => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const last = lectures[lectures.length - 1];
    if (!last) return false;
    const within15s = Date.now() - (last.createdAtClient || 0) < 15000;
    return (
      within15s &&
      norm(last.title) === norm(titleStr) &&
      norm(last.target) === norm(targetStr)
    );
  };

  /* ---------------------------
     Backend (non-stream) fallback
  --------------------------- */
  async function generateNextLectureBackend() {
    const previousTitles = lectures
      .map((l) => l.title || "")
      .filter(Boolean)
      .slice(-30);
    const lastClient = lectures.length
      ? lectures[lectures.length - 1].createdAtClient || 0
      : 0;
    const hoursSinceLastLecture = lastClient
      ? Math.round((Date.now() - lastClient) / 3600000)
      : null;

    const isFirst = previousTitles.length === 0;
    const prompt = isFirst
      ? buildSeedLecturePrompt({
          targetLang,
          supportLang,
          level: progress.level || "beginner",
          xp,
        })
      : buildLecturePrompt({
          previousTitles,
          targetLang,
          supportLang,
          level: progress.level || "beginner",
          xp,
        });

    let parsed =
      safeParseJSON(await callResponses({ model: MODEL, input: prompt })) ||
      null;

    if (
      !parsed ||
      typeof parsed.title !== "string" ||
      typeof parsed.target !== "string"
    ) {
      // Simple fallback content
      parsed = {
        title:
          targetLang === "en"
            ? "A Turning Point in Early Mesoamerica"
            : "Un punto de inflexión temprano",
        target:
          targetLang === "en"
            ? "An important phase unfolded as communities consolidated agriculture, ritual life, and trade networks..."
            : "Una fase importante se desarrolló cuando las comunidades consolidaron la agricultura, la vida ritual y las redes de intercambio...",
        support:
          supportLang === "es"
            ? "Una fase importante se desarrolló cuando las comunidades consolidaron la agricultura..."
            : "An important phase unfolded as communities consolidated agriculture...",
        takeaways: [
          targetLang === "en"
            ? "Stronger villages and exchanges."
            : "Aldeas y trueques más fuertes.",
          targetLang === "en"
            ? "New identities and beliefs."
            : "Nuevas identidades y creencias.",
          targetLang === "en"
            ? "Technology spread regionally."
            : "Tecnología difundida regionalmente.",
        ],
      };
    }

    const cleanTitle = stripLineLabel(String(parsed.title || ""), targetLang);
    const { cleanTarget, cleanSupport } = await normalizeLectureTexts({
      targetText: parsed.target || "",
      supportText: parsed.support || "",
      targetLang,
      supportLang,
    });
    const safeTarget = cleanTarget || String(parsed.target || "").trim();
    const safeSupport =
      cleanSupport ||
      sanitizeLectureBlock(String(parsed.support || ""), supportLang) ||
      safeTarget;
    const cleanTakeaways = Array.isArray(parsed.takeaways)
      ? parsed.takeaways
          .map((t) => stripLineLabel(String(t || ""), targetLang))
          .filter(Boolean)
          .slice(0, 3)
      : [];

    const { xp: xpAward, reason: xpReason } = await computeAdaptiveXp({
      title: cleanTitle,
      target: safeTarget,
      takeaways: cleanTakeaways,
      previousTitles,
      level: progress.level || "beginner",
      currentXp: xp,
      hoursSinceLastLecture,
    });

    const payload = {
      title: cleanTitle,
      target: safeTarget,
      support: safeSupport,
      takeaways: cleanTakeaways,
      targetLang,
      supportLang,
      xpAward,
      xpReason,
      createdAt: serverTimestamp(),
      createdAtClient: Date.now(),
      awarded: false, // ← XP not yet claimed
    };

    // 🔒 Idempotency guard: if last lecture matches, don't write a new doc
    if (isDuplicateOfLast(payload.title, payload.target)) {
      const last = lectures[lectures.length - 1];
      if (last) setActiveId(last.id);
      return;
    }

    const col = collection(database, "users", npub, "historyLectures");
    const ref = await addDoc(col, payload);
    setActiveId(ref.id);
  }

  /* ---------------------------
     Gemini streaming generator
  --------------------------- */
  async function generateNextLectureGeminiStream() {
    // 🔒 Hard guard against double-invoke (click races / multiple triggers)
    if (!npub || generatingRef.current || isGenerating) return;
    generatingRef.current = true;
    setIsGenerating(true);
    setDraftLecture(null);

    const previousTitles = lectures
      .map((l) => l.title || "")
      .filter(Boolean)
      .slice(-30);
    const lastClient = lectures.length
      ? lectures[lectures.length - 1].createdAtClient || 0
      : 0;
    const hoursSinceLastLecture = lastClient
      ? Math.round((Date.now() - lastClient) / 3600000)
      : null;

    const isFirst = previousTitles.length === 0;
    const streamPrompt = buildStreamingPrompt({
      isFirst,
      previousTitles,
      targetLang,
      supportLang,
      level: progress.level || "beginner",
      xp,
    });

    let title = "";
    const targetParts = [];
    const supportParts = [];
    const takeaways = [];
    let revealed = false;

    // track seen lines to prevent duplicates (e.g., when a provider re-emits the whole output)
    const seenLineKeys = new Set();

    const revealDraft = () => {
      if (!revealed) revealed = true;
      const draftTitle =
        title ||
        t("history_generating_title") ||
        t("history_generating") ||
        "Generating…";
      setDraftLecture({
        title: draftTitle,
        target: sanitizeLectureBlock(targetParts.join(" "), targetLang),
        support: sanitizeLectureBlock(supportParts.join(" "), supportLang),
        takeaways: [...takeaways],
      });
    };

    const tryConsumeLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("```")) return;
      if (!(trimmed.startsWith("{") && trimmed.endsWith("}"))) return;

      let obj;
      try {
        obj = JSON.parse(trimmed);
      } catch {
        return;
      }

      const text = typeof obj?.text === "string" ? obj.text.trim() : "";
      const type = obj?.type;
      if (!type || !text) return;

      const cleaned =
        type === "support"
          ? stripLineLabel(text, supportLang)
          : stripLineLabel(text, targetLang);
      const normalized = cleaned.replace(/\s+/g, " ").trim();
      if (!normalized) return;

      const key = `${type}|${normalized}`;
      if (seenLineKeys.has(key)) return; // <-- drop dupes
      seenLineKeys.add(key);

      if (type === "title" && !title) {
        title = normalized;
        revealDraft();
        return;
      }
      if (type === "target") {
        if (targetParts[targetParts.length - 1] !== normalized) {
          targetParts.push(normalized);
          revealDraft();
        }
        return;
      }
      if (type === "support") {
        if (supportParts[supportParts.length - 1] !== normalized) {
          supportParts.push(normalized);
          revealDraft();
        }
        return;
      }
      if (type === "takeaway") {
        if (takeaways.length < 3 && !takeaways.includes(normalized)) {
          takeaways.push(normalized);
          revealDraft();
        }
        return;
      }
      // {"type":"done"} handled implicitly after stream ends
    };

    try {
      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: streamPrompt }] }],
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
          tryConsumeLine(line);
        }
      }

      // ✅ Only parse a leftover partial line, NOT the provider's final aggregate (which repeats everything)
      const leftover = buffer.trim();
      if (leftover) tryConsumeLine(leftover);

      // If nothing parsed, fallback to backend
      if (!title && targetParts.length === 0) {
        await generateNextLectureBackend();
        setDraftLecture(null);
        setIsGenerating(false);
        generatingRef.current = false; // 🔓 release on fallback early-return
        if (!listDisclosure.isOpen) listDisclosure.onOpen();
        return;
      }

      // Build final lecture strings
      const draftTarget = sanitizeLectureBlock(
        targetParts.join(" "),
        targetLang
      );
      const draftSupport = sanitizeLectureBlock(
        supportParts.join(" "),
        supportLang
      );
      const finalTakeaways = takeaways.slice(0, 3);

      const { cleanTarget, cleanSupport } = await normalizeLectureTexts({
        targetText: draftTarget,
        supportText: draftSupport,
        targetLang,
        supportLang,
      });
      const safeTarget = cleanTarget || draftTarget;
      const safeSupport =
        cleanSupport || sanitizeLectureBlock(draftSupport, supportLang) || safeTarget;
      const finalTitle =
        title ||
        (targetLang === "en" ? "Untitled lecture" : "Lección sin título");

      // XP scoring (backend)
      const { xp: xpAward, reason: xpReason } = await computeAdaptiveXp({
        title: finalTitle,
        target: safeTarget,
        takeaways: finalTakeaways,
        previousTitles,
        level: progress.level || "beginner",
        currentXp: xp,
        hoursSinceLastLecture,
      });

      // Save to Firestore (do not award yet)
      const payload = {
        title: finalTitle,
        target: safeTarget,
        support: safeSupport,
        takeaways: finalTakeaways,
        targetLang,
        supportLang,
        xpAward,
        xpReason,
        createdAt: serverTimestamp(),
        createdAtClient: Date.now(),
        awarded: false, // ← wait until user finishes reading
      };

      // 🔒 Idempotency guard: avoid immediate duplicates
      if (isDuplicateOfLast(payload.title, payload.target)) {
        const last = lectures[lectures.length - 1];
        if (last) setActiveId(last.id);
        setDraftLecture(null);
        return; // finally{} will release the lock
      }

      const colRef = collection(database, "users", npub, "historyLectures");
      const ref = await addDoc(colRef, payload);
      setActiveId(ref.id);
      setDraftLecture(null);
      if (!listDisclosure.isOpen) listDisclosure.onOpen();
    } catch (e) {
      console.error("Gemini streaming error; using backend fallback.", e);
      try {
        await generateNextLectureBackend();
      } catch (e2) {
        console.error("Backend fallback failed:", e2);
      }
      setDraftLecture(null);
    } finally {
      setIsGenerating(false);
      generatingRef.current = false; // 🔓 always release
    }
  }

  const stopSpeech = () => {
    try {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    } catch {}
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    } catch {}
    setIsReadingTarget(false);
    setIsReadingSupport(false);
  };

  async function speak({ text, langTag, voice, setReading, onDone }) {
    stopSpeech();
    if (!text) return;
    setReading(true);

    try {
      const res = await fetch(
        "https://proxytts-hftgya63qa-uc.a.run.app/proxyTTS",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: text,
            voice: voice || "alloy",
            model: "gpt-4o-mini-tts",
            response_format: "mp3",
          }),
        }
      );
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        setReading(false);
        currentAudioRef.current = null;
        onDone?.();
      };
      audio.onended = cleanup;
      audio.onerror = cleanup;

      await audio.play();
      return;
    } catch {
      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = langTag || "es-ES";
        utter.rate = 0.95;
        utter.pitch = 1.0;
        utter.onend = () => {
          setReading(false);
          onDone?.();
        };
        utter.onerror = () => {
          setReading(false);
          onDone?.();
        };
        speechSynthesis.speak(utter);
        return;
      }
      setReading(false);
      onDone?.();
    }
  }

  const readTarget = async () =>
    speak({
      text: viewLecture?.target,
      langTag: (BCP47[targetLang] || BCP47.es).tts,
      voice: progress.voice || "alloy",
      onDone: () => {},
      setReading: setIsReadingTarget,
    });

  const readSupport = async () =>
    speak({
      text: viewLecture?.support,
      langTag: (BCP47[supportLang] || BCP47.en).tts,
      voice: progress.voice || "alloy",
      onDone: () => {},
      setReading: setIsReadingSupport,
    });

  const xpReasonText =
    activeLecture?.xpReason && typeof activeLecture.xpReason === "string"
      ? ` — ${activeLecture.xpReason}`
      : "";

  // Award XP for current lecture and generate a new one
  async function finishReadingAndNext() {
    if (!npub || !activeLecture || isGenerating || isFinishing) return;
    setIsFinishing(true);
    try {
      const docRef = doc(
        database,
        "users",
        npub,
        "historyLectures",
        activeLecture.id
      );
      if (!activeLecture.awarded) {
        await setDoc(
          docRef,
          { awarded: true, awardedAt: serverTimestamp() },
          { merge: true }
        );
        const amt = Number(activeLecture?.xpAward || 0);
        if (amt > 0) {
          await awardXp(npub, amt).catch(() => {});
        }
      }
      // Immediately move to the next lecture
      await generateNextLectureGeminiStream();
    } catch (e) {
      console.error("finishReadingAndNext error", e);
    } finally {
      setIsFinishing(false);
    }
  }

  if (showPasscodeModal) {
    return (
      <PasscodePage
        userLanguage={user.appLanguage}
        setShowPasscodeModal={setShowPasscodeModal}
      />
    );
  }

  return (
    <Box p={[3, 4, 6]}>
      <VStack spacing={5} align="stretch" maxW="1100px" mx="auto">
        {/* Header: Level / XP */}
        <Box justifyContent={"center"} display="flex">
          <Box width="50%">
            <HStack justify="space-between" mb={2}>
              <Badge variant="subtle" px={2} py={1} rounded="md">
                {t("history_badge_level", { level: levelNumber })}
              </Badge>
              <Badge variant="subtle" px={2} py={1} rounded="md">
                {t("history_badge_xp", { xp })}
              </Badge>
            </HStack>
            <WaveBar value={progressPct} />
          </Box>
        </Box>

        {/* Controls */}
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <HStack gap={2}>
            <MdMenuBook />
            <Text fontWeight="semibold">{t("history_title")}</Text>
          </HStack>
          <Button
            onClick={generateNextLectureGeminiStream}
            isDisabled={isGenerating}
          >
            {isGenerating ? (
              <Spinner size="sm" style={{ marginRight: 8 }} />
            ) : null}
            {t("history_btn_generate")}
          </Button>
        </HStack>

        {/* Mobile: collapsible list */}
        <Box display={{ base: "block", md: "none" }}>
          <Button
            size="sm"
            variant="outline"
            onClick={listDisclosure.onToggle}
            mt={2}
          >
            {listDisclosure.isOpen
              ? t("history_list_hide")
              : t("history_list_show")}
          </Button>
          <Collapse in={listDisclosure.isOpen} animateOpacity>
            <Box
              mt={3}
              bg="gray.800"
              border="1px solid"
              borderColor="gray.700"
              rounded="xl"
              p={4}
              mx={1}
            >
              <Text fontSize="sm" opacity={0.8} mb={3}>
                {t("history_prev_lectures_label")}
              </Text>
              <VStack
                align="stretch"
                spacing={3}
                height="200px"
                overflowY="auto"
                pr={1}
                sx={{
                  scrollPadding: "8px",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  "&::-webkit-scrollbar": { width: "0px", height: "0px" },
                  "&::-webkit-scrollbar-thumb": { background: "transparent" },
                }}
              >
                {lectures.length === 0 ? (
                  <Text fontSize="sm" opacity={0.7}>
                    {t("history_none_yet")}
                  </Text>
                ) : (
                  lectures.map((lec) => {
                    const active = lec.id === activeId;
                    return (
                      <Button
                        key={lec.id}
                        onClick={() => setActiveId(lec.id)}
                        justifyContent="flex-start"
                        size="sm"
                        variant={active ? "solid" : "ghost"}
                        colorScheme={active ? "teal" : "cyan"}
                        whiteSpace="normal"
                        textAlign="left"
                        py={3}
                        px={3}
                        rounded="lg"
                      >
                        <Text fontWeight="600" fontSize="sm">
                          {lec.title}
                        </Text>
                      </Button>
                    );
                  })
                )}
                {/* sentinel for auto-scroll (mobile) */}
                <Box ref={mobileEndRef} />
              </VStack>
            </Box>
          </Collapse>
        </Box>

        <Divider opacity={0.25} display={{ base: "none", md: "block" }} />

        {/* Main content area */}
        <HStack
          align="start"
          spacing={5}
          flexDir={{ base: "column", md: "row" }}
        >
          {/* Left: list (desktop/tablet) */}
          <Box
            w={{ base: "100%", md: "300px" }}
            flexShrink={0}
            bg="gray.800"
            borderColor="gray.700"
            rounded="xl"
            p={4}
            display={{ base: "none", md: "block" }}
          >
            <Text fontSize="sm" opacity={0.8} mb={3}>
              {t("history_prev_lectures_label")}
            </Text>
            <VStack
              align="stretch"
              spacing={3}
              maxH="64vh"
              overflowY="auto"
              pr={1}
              height="200px"
              sx={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "&::-webkit-scrollbar": { width: "0px", height: "0px" },
                "&::-webkit-scrollbar-thumb": { background: "transparent" },
              }}
            >
              {lectures.length === 0 ? (
                <Text fontSize="sm" opacity={0.7}>
                  {t("history_none_yet")}
                </Text>
              ) : (
                lectures.map((lec) => {
                  const active = lec.id === activeId;
                  return (
                    <Button
                      key={lec.id}
                      onClick={() => setActiveId(lec.id)}
                      justifyContent="flex-start"
                      size="sm"
                      variant={active ? "solid" : "ghost"}
                      colorScheme={active ? "teal" : "cyan"}
                      whiteSpace="normal"
                      textAlign="left"
                      py={6}
                      px={6}
                      rounded="lg"
                    >
                      <Text fontWeight="600" fontSize="sm">
                        {lec.title}
                      </Text>
                    </Button>
                  );
                })
              )}
              {/* sentinel for auto-scroll (desktop) */}
              <Box ref={desktopEndRef} />
            </VStack>
          </Box>

          {/* Right: Active/draft lecture */}
          <Box
            flex="1"
            bg="gray.800"
            border="1px solid"
            borderColor="gray.700"
            rounded="xl"
            p={[4, 5]}
            minH="280px"
            width="100%"
          >
            {viewLecture ? (
              <VStack align="stretch" spacing={4}>
                <HStack
                  justify="space-between"
                  align="center"
                  flexWrap="wrap"
                  gap={2}
                >
                  <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="700">
                    {viewLecture.title}
                    {draftLecture ? (
                      <Text as="span" ml={2} fontSize="sm" opacity={0.7}>
                        ({t("history_generating") || "generating…"})
                      </Text>
                    ) : null}
                  </Text>
                  <HStack mt={{ base: 2, md: 0 }}>
                    <Button
                      onClick={readTarget}
                      isLoading={isReadingTarget}
                      leftIcon={<FaVolumeUp />}
                      size="sm"
                      isDisabled={!viewLecture?.target}
                    >
                      {t("history_read_in", { language: targetDisplay })}
                    </Button>
                    {showTranslations && viewLecture?.support ? (
                      <Button
                        onClick={readSupport}
                        isLoading={isReadingSupport}
                        leftIcon={<FaVolumeUp />}
                        size="sm"
                        variant="outline"
                      >
                        {t("history_read_in", { language: supportDisplay })}
                      </Button>
                    ) : null}
                    {(isReadingTarget || isReadingSupport) && (
                      <IconButton
                        aria-label={t("history_stop_aria")}
                        onClick={stopSpeech}
                        icon={<FaStop />}
                        size="sm"
                        variant="outline"
                      />
                    )}
                  </HStack>
                </HStack>

                {!draftLecture && activeLecture ? (
                  <Button
                    colorScheme="teal"
                    onClick={finishReadingAndNext}
                    isLoading={isFinishing}
                    isDisabled={isGenerating}
                    p={4}
                  >
                    {activeLecture.awarded
                      ? t("history_btn_next") || "Next lecture"
                      : t("history_btn_finish") || "Finished reading"}
                  </Button>
                ) : null}

                <Text fontSize={{ base: "md", md: "md" }} lineHeight="1.8">
                  {viewLecture.target || ""}
                </Text>

                {showTranslations && viewLecture.support ? (
                  <>
                    <Divider opacity={0.2} />
                    <Text fontWeight="600" fontSize="sm" opacity={0.9}>
                      {supportDisplay}
                    </Text>
                    <Text
                      fontSize={{ base: "sm", md: "sm" }}
                      opacity={0.95}
                      lineHeight="1.8"
                    >
                      {viewLecture.support}
                    </Text>
                  </>
                ) : null}

                {Array.isArray(viewLecture.takeaways) &&
                viewLecture.takeaways.length ? (
                  <>
                    <Divider opacity={0.2} />
                    <Text fontWeight="600" fontSize="sm" opacity={0.9}>
                      {t("history_takeaways_heading")}
                    </Text>
                    <VStack align="stretch" spacing={1.5}>
                      {viewLecture.takeaways.map((tkw, i) => (
                        <Text key={i} fontSize="sm">
                          • {tkw}
                        </Text>
                      ))}
                    </VStack>
                  </>
                ) : null}

                {!draftLecture && Number.isFinite(activeLecture?.xpAward) ? (
                  <>
                    <Divider opacity={0.2} />
                    {activeLecture.awarded ? (
                      <Text fontSize="sm" opacity={0.9}>
                        {t("history_xp_awarded_line", {
                          xp: activeLecture.xpAward,
                          reason: xpReasonText,
                        })}
                      </Text>
                    ) : (
                      <Text fontSize="sm" opacity={0.9}>
                        {t("history_xp_pending_line", {
                          xp: activeLecture.xpAward,
                        }) ||
                          `Pending +${activeLecture.xpAward} XP — tap “Finished reading” to claim`}
                      </Text>
                    )}
                  </>
                ) : null}
              </VStack>
            ) : (
              <VStack spacing={3} width="100%">
                <Text>{t("history_no_lecture")}</Text>
              </VStack>
            )}
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
}
