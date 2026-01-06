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
  Center,
  Stack,
} from "@chakra-ui/react";
import { PiSpeakerHighDuotone } from "react-icons/pi";
import { doc, onSnapshot } from "firebase/firestore";
import { MdMenuBook } from "react-icons/md";
import useUserStore from "../hooks/useUserStore";
import { WaveBar } from "./WaveBar";
import translations from "../utils/translation";
import { awardXp } from "../utils/utils";
import { getLanguageXp } from "../utils/progressTracking";
import { database, simplemodel } from "../firebaseResources/firebaseResources"; // ✅ Gemini streaming
import { extractCEFRLevel, getCEFRPromptHint } from "../utils/cefrUtils";
import { getUserProficiencyLevel } from "../utils/cefrProgress";
import {
  LOW_LATENCY_TTS_FORMAT,
  getRandomVoice,
  getTTSPlayer,
  TTS_LANG_TAG,
} from "../utils/tts";
const renderSpeakerIcon = (loading) =>
  loading ? <Spinner size="xs" /> : <PiSpeakerHighDuotone />;

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
const MODEL = import.meta.env.VITE_OPENAI_TRANSLATE_MODEL || "gpt-5-nano";

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
      `Translate the following text from ${LANG_NAME(
        targetLang
      )} (${targetLang}) into ${LANG_NAME(supportLang)} (${supportLang}).`,
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
  ({
    en: "English",
    es: "Spanish",
    pt: "Brazilian Portuguese",
    fr: "French",
    it: "Italian",
    nl: "Dutch",
    nah: "Huastec Nahuatl",
  }[code] || code);

const LANGUAGE_LABELS = {
  en: ["English", "Inglés"],
  es: ["Spanish", "Español"],
  pt: [
    "Portuguese",
    "Portugués",
    "Brazilian Portuguese",
    "Portugués brasileño",
  ],
  fr: ["French", "Francés"],
  it: ["Italian", "Italiano"],
  nl: ["Dutch", "Holandés", "Nederlands"],
  nah: ["Huastec Nahuatl", "Náhuatl huasteco"],
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
      `^(?:${tokens
        .map((token) => escapeRegExp(token))
        .join("|")})\\s*[:\\-–—]\\s*`,
      "i"
    );
    output = output.replace(pattern, "").trim();
  }
  output = output
    .replace(/^\[\s*/, "")
    .replace(/\s*\]$/, "")
    .trim();
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!npub) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const ref = doc(database, "users", npub);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const p = data?.progress || {};
      const targetLang = ["nah", "es", "pt", "en", "fr", "it", "nl", "ja", "ru"].includes(
        p.targetLang
      )
        ? p.targetLang
        : "es";
      const langXp = getLanguageXp(p, targetLang);

      setXp(Number.isFinite(langXp) ? langXp : 0);
      setProgress({
        level: p.level || "beginner",
        targetLang,
        supportLang: ["en", "es", "bilingual"].includes(p.supportLang)
          ? p.supportLang
          : "en",
        showTranslations:
          typeof p.showTranslations === "boolean" ? p.showTranslations : true,
        voice: p.voice || "alloy",
      });
      setIsLoading(false);
    });
    return () => unsub();
  }, [npub]);

  const levelNumber = Math.floor(xp / 100) + 1;
  const progressPct = Math.min(100, xp % 100);
  return { xp, levelNumber, progressPct, progress, npub, isLoading };
}

/* ---------------------------
   Difficulty + Prompts
--------------------------- */
function difficultyHint(cefrLevel) {
  return getCEFRPromptHint(cefrLevel);
}

// Seed: FIRST lecture based on lesson content
function buildSeedLecturePrompt({
  targetLang,
  supportLang,
  cefrLevel,
  lessonContent = null,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);
  const diff = difficultyHint(cefrLevel);

  // Special handling for tutorial mode - use very simple "hello" content only
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicText = isTutorial
    ? "basic greetings and saying hello"
    : lessonContent?.topic ||
      lessonContent?.scenario ||
      "general cultural and linguistic concepts";
  const promptText = isTutorial
    ? "Focus ONLY on the word 'hello' and simple greetings. This is for absolute beginners."
    : lessonContent?.prompt || "";
  const tutorialDirective = isTutorial
    ? `
TUTORIAL MODE - ABSOLUTE BEGINNER CONTENT:
- This is a tutorial for complete beginners
- Focus ONLY on the greeting "hello" and its equivalents
- Use extremely simple vocabulary (hello, hi, good morning, goodbye)
- Keep sentences very short (3-5 words maximum)
- Length should be only 50-80 words total
- Make it feel welcoming and encouraging`
    : "";

  return `
Write ONE short educational lecture about ${topicText}. ${promptText}. Difficulty: ${
    isTutorial ? "absolute beginner, very easy" : diff
  }.${tutorialDirective}

CRITICAL LANGUAGE REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
1. Most importantly, the lecture generated is suitable for a ${cefrLevel} level reader.
2. The target language for learning is: ${TARGET} (language code: ${targetLang})
3. The support/translation language is: ${SUPPORT} (language code: ${supportLang})
4. Write the title and lecture body in ${TARGET} ONLY
5. Write all takeaways in ${SUPPORT} ONLY
6. Write the translation in ${SUPPORT} ONLY
7. Do NOT write in any other language regardless of what the topic mentions
8. Even if the topic references other cultures or languages, you MUST write in ${TARGET} for the title/body

IMPORTANT: Ignore any language references in the topic description. Your output language is determined ONLY by the target language (${TARGET}) and support language (${SUPPORT}) specified above.

Content requirements:
- Length: ≈180–260 words
- Make it relevant and practical for language learners
- Include cultural context and common vocabulary related to ${topicText}
- Use examples and situations that learners might encounter
- Keep it engaging, clear, and accessible

Include:
- A concise title (<= 60 chars) in ${TARGET}
- Lecture body in ${TARGET}
- 3 concise bullet takeaways in ${SUPPORT}
- A full ${SUPPORT} translation of the lecture body (NOT the takeaways)

Return JSON ONLY:
{
  "title": "<short title in ${TARGET}>",
  "target": "<lecture body in ${TARGET}>",
  "takeaways": ["<3 bullets in ${SUPPORT}>"],
  "support": "<full translation in ${SUPPORT}>"
}
`.trim();
}

// General progression (after seed), based on prior titles
function buildLecturePrompt({
  previousTitles,
  targetLang,
  supportLang,
  cefrLevel,
  lessonContent = null,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);
  const diff = difficultyHint(cefrLevel);
  const prev =
    previousTitles && previousTitles.length
      ? previousTitles.map((t) => `- ${t}`).join("\n")
      : "(none yet)";

  // Special handling for tutorial mode - use very simple "hello" content only
  const isTutorial = lessonContent?.topic === "tutorial";
  const topicText = isTutorial
    ? "basic greetings and saying hello"
    : lessonContent?.topic ||
      lessonContent?.scenario ||
      "general cultural and linguistic concepts";
  const promptText = isTutorial
    ? "Focus ONLY on the word 'hello' and simple greetings. This is for absolute beginners."
    : lessonContent?.prompt || "";
  const tutorialDirective = isTutorial
    ? `
TUTORIAL MODE - ABSOLUTE BEGINNER CONTENT:
- Focus ONLY on the greeting "hello" and its equivalents
- Use extremely simple vocabulary (hello, hi, good morning, goodbye)
- Keep sentences very short (3-5 words maximum)
- Length should be only 50-80 words total`
    : "";

  return `
You are creating educational reading material for language learners focused on ${topicText}. ${promptText}${tutorialDirective}
Choose the **next related sub-topic** based on the list of previous lecture titles.
Avoid repetition but maintain thematic coherence with ${topicText}.

previous_titles:
${prev}

CRITICAL LANGUAGE REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
1. The target language for learning is: ${TARGET} (language code: ${targetLang})
2. The support/translation language is: ${SUPPORT} (language code: ${supportLang})
3. Write the title and lecture body in ${TARGET} ONLY
4. Write all takeaways in ${SUPPORT} ONLY
5. Write the translation in ${SUPPORT} ONLY
6. Do NOT write in any other language regardless of what the topic mentions
7. Even if the topic references other cultures or languages, you MUST write in ${TARGET} for title/body

IMPORTANT: Ignore any language references in the topic description. Your output language is determined ONLY by the target language (${TARGET}) and support language (${SUPPORT}) specified above.

Content requirements:
- Length: ≈180–260 words, suitable for a ${cefrLevel} learner
- Difficulty: ${diff}
- Include cultural context and practical vocabulary for language learners
- Use examples and situations that learners might encounter

Include:
- A concise title (<= 60 chars) related to ${topicText} in ${TARGET}
- Lecture body in ${TARGET}
- 3 concise bullet takeaways in ${SUPPORT}
- A full ${SUPPORT} translation of the lecture body (NOT the takeaways)

Return JSON ONLY:
{
  "title": "<short title in ${TARGET}>",
  "target": "<lecture body in ${TARGET}>",
  "takeaways": ["<3 bullets in ${SUPPORT}>"],
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
  cefrLevel,
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
- Topic granularity/specificity (figures, events, policies), and overall difficulty for the user's CEFR level: ${cefrLevel}.
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
  cefrLevel,
  currentXp,
  hoursSinceLastLecture,
}) {
  const MIN = 4;
  const MAX = 7;

  try {
    const prompt = buildXpPrompt({
      title,
      target,
      takeaways,
      previousTitles,
      cefrLevel,
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

  // Heuristic fallback (kept inside 4–7) - normalized to 4-7 XP range
  let score = 5; // center
  // Nudge by density (smaller increments for 4-7 range)
  score += target.length > 230 ? 1 : target.length < 170 ? -1 : 0;
  // Novelty vs previous titles
  const looksRepeated = previousTitles?.some((t) =>
    String(t || "")
      .toLowerCase()
      .includes(String(title || "").toLowerCase())
  );
  score += looksRepeated ? -1 : 1;
  // Streak bonus
  score += hoursSinceLastLecture != null && hoursSinceLastLecture <= 48 ? 1 : 0;
  // CEFR level tweak
  score += ["C1", "C2"].includes(cefrLevel)
    ? 1
    : ["B1", "B2"].includes(cefrLevel)
    ? 0.5
    : 0;

  const xp = Math.max(MIN, Math.min(MAX, score));
  return { xp, reason: "Heuristic fallback scoring." };
}

/* ---------------------------
   TTS (no highlighting)
--------------------------- */
const BCP47 = {
  es: { tts: "es-ES" },
  en: { tts: "en-US" },
  pt: { tts: "pt-BR" },
  fr: { tts: "fr-FR" },
  it: { tts: "it-IT" },
  nl: { tts: "nl-NL" },
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
  cefrLevel,
  lessonContent = null,
}) {
  const TARGET = LANG_NAME(targetLang);
  const SUPPORT = LANG_NAME(supportLang);
  const diff = difficultyHint(cefrLevel);
  const prev =
    previousTitles && previousTitles.length
      ? previousTitles.map((t) => `- ${t}`).join("\n")
      : "(none yet)";

  const topicText =
    lessonContent?.topic ||
    lessonContent?.scenario ||
    "general cultural and linguistic concepts";
  const promptText = lessonContent?.prompt || "";

  const baseTopic = isFirst
    ? `Topic: ${topicText}. ${promptText}\nFocus on practical cultural context and vocabulary for language learners.`
    : `Continue the educational series about ${topicText}. Choose the next related sub-topic based on previous_titles. Avoid repetition but maintain thematic coherence.\nprevious_titles:\n${prev}`;

  return [
    `You are writing an educational reading lecture for language learners about ${topicText}.`,
    baseTopic,
    "",
    "CRITICAL LANGUAGE REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:",
    `1. The target language for learning is: ${TARGET} (language code: ${targetLang})`,
    `2. The support/translation language is: ${SUPPORT} (language code: ${supportLang})`,
    `3. Write the title and lecture body in ${TARGET} ONLY`,
    `4. Write ALL takeaways in ${SUPPORT} ONLY`,
    `5. Write the translation in ${SUPPORT} ONLY`,
    `6. Do NOT write in any other language regardless of what the topic mentions`,
    `7. Even if the topic references other cultures or languages, you MUST write in ${TARGET} for title/body`,
    "",
    `IMPORTANT: Ignore any language references in the topic description. Your output language is determined ONLY by ${TARGET} and ${SUPPORT}.`,
    "",
    `Style: ~180–260 words, ${diff}.`,
    "",
    "OUTPUT PROTOCOL — NDJSON (one compact JSON object per line):",
    `1) {"type":"title","text":"<title in ${TARGET} (<=60 chars)>"} (emit once, early)`,
    `2) Emit the lecture body sentence-by-sentence in ${TARGET}: {"type":"target","text":"<one sentence>"} (4–10 lines total)`,
    `3) Then emit the full translation sentence-by-sentence in ${SUPPORT}: {"type":"support","text":"<one sentence>"} (mirrors the body)`,
    `4) Emit exactly three takeaways (bullets) in ${SUPPORT}: {"type":"takeaway","text":"<concise takeaway>"} (3 lines)`,
    '5) Finally emit {"type":"done"}',
    "",
    "STRICT RULES:",
    `- Use ${TARGET} ONLY for \"title\" and \"target\" lines.`,
    `- Use ${SUPPORT} ONLY for \"support\" and \"takeaway\" lines.`,
    "- Do not include any other languages, labels, or commentary.",
    "- Do not output code fences or commentary.",
    "- Each line must be a single valid JSON object matching one of the types above.",
    "- Keep sentences 8–22 words; simple, clear, engaging.",
  ].join("\n");
}

/* ---------------------------
   Component
--------------------------- */
export default function History({
  userLanguage = "en",
  lesson = null,
  lessonContent = null,
  onSkip = null,
}) {
  const t = useT(userLanguage);
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const { xp, levelNumber, progressPct, progress, npub, isLoading } =
    useSharedProgress();

  const targetLang = ["en", "es", "pt", "nah", "fr", "it", "nl", "ja"].includes(
    progress.targetLang
  )
    ? progress.targetLang
    : "es";

  // Use CEFR level from the current lesson, or user's proficiency level as fallback
  const cefrLevel = lesson?.id
    ? extractCEFRLevel(lesson.id)
    : getUserProficiencyLevel(progress, targetLang);

  // Track lesson content changes to auto-trigger generation
  const lessonContentKey = useMemo(
    () => JSON.stringify(lessonContent || null),
    [lessonContent]
  );
  const lastLessonContentKeyRef = useRef(null);

  // ---- Dedup & concurrency guards ----
  const generatingRef = useRef(false); // synchronous mutex to stop double invokes

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
      pt: t("language_pt"),
      fr: t("language_fr"),
      it: t("language_it"),
      nl: t("language_nl"),
      nah: t("language_nah"),
      ja: t("language_ja"),
    }[code] || code);

  const targetDisplay = localizedLangName(targetLang);
  const supportDisplay = localizedLangName(supportLang);

  // List
  const [lectures, setLectures] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Generate state
  const [isGenerating, setIsGenerating] = useState(false);

  // Reading state
  const [isReadingTarget, setIsReadingTarget] = useState(false);
  const [isSynthesizingTarget, setIsSynthesizingTarget] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Refs for audio
  const currentAudioRef = useRef(null);

  // streaming draft lecture (local only while generating)
  const [draftLecture, setDraftLecture] = useState(null); // {title,target,support,takeaways[]}

  // refs for auto-scroll (mobile + desktop lists)

  // Auto-generate lecture when component mounts with no lectures
  useEffect(() => {
    // Wait for progress data to load before generating content
    if (!npub || isLoading || isGenerating || generatingRef.current) return;
    // Avoid double-generation when a lesson-provided prompt is present;
    // the lessonContent effect will trigger its own generation path.
    if (lectures.length === 0 && !draftLecture && !lessonContent) {
      // Don't set activeId when auto-generating first lecture
      setActiveId(null);
      generateNextLectureGeminiStream();
    }
  }, [npub, lectures.length, isLoading]); // eslint-disable-line

  // Auto-generate a fresh lecture whenever lesson content changes (lesson mode)
  useEffect(() => {
    if (!npub || isLoading || isGenerating || generatingRef.current) return;
    if (!lessonContentKey) return;

    if (lastLessonContentKeyRef.current !== lessonContentKey) {
      lastLessonContentKeyRef.current = lessonContentKey;
      setActiveId(null);
      setDraftLecture(null);
      generateNextLectureGeminiStream();
    }
  }, [npub, isLoading, isGenerating, lessonContentKey]);

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
          cefrLevel,
          lessonContent,
        })
      : buildLecturePrompt({
          previousTitles,
          targetLang,
          supportLang,
          cefrLevel,
          lessonContent,
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
          supportLang === "es"
            ? "Intercambios y aldeas más fuertes."
            : "Stronger villages and exchanges.",
          supportLang === "es"
            ? "Nuevas identidades y creencias."
            : "New identities and beliefs.",
          supportLang === "es"
            ? "La tecnología se difundió en la región."
            : "Technology spread regionally.",
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
          .map((t) => stripLineLabel(String(t || ""), supportLang))
          .filter(Boolean)
          .slice(0, 3)
      : [];

    const { xp: xpAward, reason: xpReason } = await computeAdaptiveXp({
      title: cleanTitle,
      target: safeTarget,
      takeaways: cleanTakeaways,
      previousTitles,
      cefrLevel,
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
      createdAtClient: Date.now(),
      awarded: false, // ← XP not yet claimed
    };

    // 🔒 Idempotency guard: if last lecture matches, don't write a new doc
    if (isDuplicateOfLast(payload.title, payload.target)) {
      const last = lectures[lectures.length - 1];
      if (last) setActiveId(last.id);
      return;
    }

    const newId = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    setLectures((prev) => [...prev, { id: newId, ...payload }]);
    setActiveId(newId);
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
      cefrLevel,
      lessonContent,
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
        t("reading_generating_title") ||
        t("reading_generating") ||
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
        type === "support" || type === "takeaway"
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
        cleanSupport ||
        sanitizeLectureBlock(draftSupport, supportLang) ||
        safeTarget;
      const finalTitle =
        title ||
        (targetLang === "en" ? "Untitled lecture" : "Lección sin título");

      // XP scoring (backend)
      const { xp: xpAward, reason: xpReason } = await computeAdaptiveXp({
        title: finalTitle,
        target: safeTarget,
        takeaways: finalTakeaways,
        previousTitles,
        cefrLevel,
        currentXp: xp,
        hoursSinceLastLecture,
      });

      // Save locally (do not award yet)
      const payload = {
        title: finalTitle,
        target: safeTarget,
        support: safeSupport,
        takeaways: finalTakeaways,
        targetLang,
        supportLang,
        xpAward,
        xpReason,
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

      const newId = crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
      setLectures((prev) => [...prev, { id: newId, ...payload }]);
      setActiveId(newId);
      setDraftLecture(null);
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
  };

  async function speak({ text, langTag, setReading, setSynthesizing, onDone }) {
    stopSpeech();
    if (!text) return;
    setReading(true);
    setSynthesizing?.(true);

    try {
      const player = await getTTSPlayer({
        text,
        langTag: langTag || TTS_LANG_TAG.es,
        voice: getRandomVoice(),
        responseFormat: LOW_LATENCY_TTS_FORMAT,
      });

      currentAudioRef.current = player.audio;

      const cleanup = () => {
        setReading(false);
        currentAudioRef.current = null;
        player.cleanup?.();
        player.finalize?.catch?.(() => {});
        onDone?.();
      };

      player.audio.onended = cleanup;
      player.audio.onerror = cleanup;

      await player.ready;
      setSynthesizing?.(false);
      await player.audio.play();
      return;
    } catch {
      setSynthesizing?.(false);
      setReading(false);
      onDone?.();
    }
  }

  const readTarget = async () =>
    speak({
      text: viewLecture?.target,
      langTag: (BCP47[targetLang] || BCP47.es).tts,
      onDone: () => {},
      setReading: setIsReadingTarget,
      setSynthesizing: setIsSynthesizingTarget,
    });

  const xpReasonText =
    activeLecture?.xpReason && typeof activeLecture.xpReason === "string"
      ? ` — ${activeLecture.xpReason}`
      : "";

  // Award XP for current lecture and move to next module
  async function finishReadingAndNext() {
    if (!npub || !activeLecture || isGenerating || isFinishing) return;
    setIsFinishing(true);
    try {
      if (!activeLecture.awarded) {
        const amt = Number(activeLecture?.xpAward || 0);
        if (amt > 0) {
          await awardXp(npub, amt, targetLang).catch(() => {});
        }
        setLectures((prev) =>
          prev.map((lec) =>
            lec.id === activeLecture.id ? { ...lec, awarded: true } : lec
          )
        );
      }
      // Move to the next module
      if (onSkip) {
        onSkip();
      }
    } catch (e) {
      console.error("finishReadingAndNext error", e);
    } finally {
      setIsFinishing(false);
    }
  }

  // Skip handler
  function handleSkip() {
    if (onSkip) {
      onSkip();
    }
  }

  return (
    <Box p={[3, 4, 6]}>
      <VStack spacing={5} align="stretch" maxW="1100px" mx="auto">
        {/* Header: Level / XP */}
        <Box justifyContent={"center"} display="flex">
          <Box width="50%">
            <HStack justify="space-between" mb={2}>
              <Badge variant="subtle" px={2} py={1} rounded="md">
                {t("reading_badge_level", { level: levelNumber })}
              </Badge>
              <Badge variant="subtle" px={2} py={1} rounded="md">
                {t("reading_badge_xp", { xp })}
              </Badge>
            </HStack>
            <WaveBar value={progressPct} />
          </Box>
        </Box>

        {/* Controls */}
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <HStack gap={2}>
            <MdMenuBook />
            <Text fontWeight="semibold">{t("reading_title")}</Text>
          </HStack>
          {onSkip && (
            <Button
              onClick={handleSkip}
              variant="outline"
              border="1px solid cyan"
            >
              {t("reading_skip")}
            </Button>
          )}
        </HStack>

        {/* Main content area */}
        <HStack
          align="start"
          spacing={5}
          flexDir={{ base: "column", md: "row" }}
        >
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
            {isLoading ? (
              <VStack spacing={3} width="100%" justify="center" minH="280px">
                <Spinner size="lg" color="teal.400" />
                <Text fontSize="lg" opacity={0.9}>
                  {t("reading_loading") || "Loading settings..."}
                </Text>
              </VStack>
            ) : isGenerating && !draftLecture ? (
              <VStack spacing={3} width="100%" justify="center" minH="280px">
                <Spinner size="lg" color="teal.400" />
                <Text fontSize="lg" opacity={0.9}>
                  {t("reading_generating") || "Creating lecture..."}
                </Text>
              </VStack>
            ) : viewLecture ? (
              <VStack align="stretch" spacing={4}>
                <HStack align="center" gap={2}>
                  <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="700">
                    <Button
                      onClick={readTarget}
                      leftIcon={renderSpeakerIcon(isSynthesizingTarget)}
                      size="sm"
                      fontSize="lg"
                      variant="ghost"
                      isDisabled={
                        !viewLecture?.target || draftLecture || isGenerating
                      }
                    />
                    {viewLecture.title}
                    {draftLecture ? (
                      <Text as="span" ml={2} fontSize="sm" opacity={0.7}>
                        ({t("reading_generating") || "generating…"})
                      </Text>
                    ) : null}
                  </Text>
                </HStack>

                <Box
                  display="flex"
                  justifyContent={"center"}
                  spacing={4}
                  mt={"-24px"}
                >
                  {!draftLecture && activeLecture ? (
                    <Button
                      mt={4}
                      colorScheme="teal"
                      onClick={finishReadingAndNext}
                      isLoading={isFinishing}
                      isDisabled={isGenerating}
                      p={4}
                      w="fit-content"
                    >
                      {activeLecture.awarded
                        ? t("reading_btn_next") || "Next lecture"
                        : t("reading_btn_finish") || "Finished reading"}
                    </Button>
                  ) : null}
                </Box>

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
                      {t("reading_takeaways_heading")}
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
              </VStack>
            ) : (
              <VStack spacing={3} width="100%">
                <Text>{t("reading_no_lecture")}</Text>
              </VStack>
            )}
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
}
