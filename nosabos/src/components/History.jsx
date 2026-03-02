// components/History.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Badge,
  Button,
  Flex,
  HStack,
  VStack,
  Text,
  Spinner,
  Divider,
  IconButton,
  Center,
  Stack,
  Input,
  SlideFade,
  Grid,
  GridItem,
  Switch,
} from "@chakra-ui/react";
import {
  PiSpeakerHighDuotone,
  PiLightningDuotone,
  PiStopDuotone,
  PiMicrophoneStageDuotone,
} from "react-icons/pi";
import { doc, onSnapshot } from "firebase/firestore";
import { MdKeyboard, MdMenuBook } from "react-icons/md";
import { FiArrowRight, FiHelpCircle } from "react-icons/fi";
import useUserStore from "../hooks/useUserStore";
import { WaveBar } from "./WaveBar";
import VirtualKeyboard from "./VirtualKeyboard";
import translations from "../utils/translation";
import { awardXp } from "../utils/utils";
import { getLanguageXp } from "../utils/progressTracking";
import {
  database,
  simplemodel,
  gradingModel,
} from "../firebaseResources/firebaseResources"; // ✅ Gemini streaming
import { extractCEFRLevel, getCEFRPromptHint } from "../utils/cefrUtils";
import { getUserProficiencyLevel } from "../utils/cefrProgress";
import {
  LOW_LATENCY_TTS_FORMAT,
  getRandomVoice,
  getTTSPlayer,
  TTS_LANG_TAG,
} from "../utils/tts";
import useSoundSettings from "../hooks/useSoundSettings";
import submitActionSound from "../assets/submitaction.mp3";
import nextButtonSound from "../assets/nextbutton.mp3";
import deliciousSound from "../assets/delicious.mp3";
import clickSound from "../assets/click.mp3";
import selectSound from "../assets/select.mp3";
import RandomCharacter from "./RandomCharacter";

const renderSpeakerIcon = (loading) =>
  loading ? (
    <Spinner size="xs" />
  ) : (
    <PiSpeakerHighDuotone style={{ marginLeft: "12px" }} />
  );

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
      k in params ? String(params[k]) : `{${k}}`,
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
            (it?.content || []).map((seg) => seg?.text || "").join(""),
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
        targetLang,
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
    nah: "Eastern Huasteca Nahuatl",
    ru: "Russian",
    de: "German",
    el: "Greek",
    pl: "Polish",
    ga: "Irish",
    yua: "Yucatec Maya",
  })[code] || code;

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
  nah: ["Eastern Huasteca Nahuatl", "Náhuatl huasteco oriental"],
  el: ["Greek", "Griego", "Ελληνικά"],
  ru: ["Russian", "Ruso"],
  de: ["German", "Alemán", "Deutsch"],
  pl: ["Polish", "Polaco", "Polski"],
  ga: ["Irish", "Irlandés", "Gaeilge"],
  yua: ["Yucatec Maya", "Maya yucateco", "Maaya t'aan"],
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
      "i",
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
      const targetLang = [
        "nah",
        "es",
        "pt",
        "en",
        "fr",
        "it",
        "nl",
        "ja",
        "ru",
        "de",
        "el",
        "pl",
        "ga",
        "yua",
      ].includes(p.targetLang)
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
- Length should be only 20-40 words total
- Make it feel welcoming and encouraging`
    : "";

  return `
Write ONE short educational lecture about ${topicText}. ${promptText}. Difficulty: ${
    isTutorial ? "absolute beginner, very easy" : diff
  }.${tutorialDirective}

CRITICAL LANGUAGE REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
1. Most importantly, the lecture generated is suitable for a ${cefrLevel} level reader.
2. The target language for learning is: ${TARGET} (language code: ${targetLang})
3. Write the title and lecture body in ${TARGET} ONLY
4. Write all takeaways in ${SUPPORT} ONLY
5. Do NOT write in any other language regardless of what the topic mentions
6. Even if the topic references other cultures or languages, you MUST write in ${TARGET} for the title/body

IMPORTANT: Ignore any language references in the topic description. Your output language is determined by the target language (${TARGET}) for title/body and ${SUPPORT} for takeaways.

Content requirements:
${isTutorial ? "- Length: 20–40 words total" : "- Length: ≈180–260 words"}
${isTutorial ? "- 2–4 very short sentences (3–5 words each)" : "- Make it relevant and practical for language learners"}
${isTutorial ? "- Use ONLY greetings; no other topics" : "- Include cultural context and common vocabulary related to " + topicText}
${isTutorial ? "- Keep it welcoming and ultra-simple" : "- Use examples and situations that learners might encounter"}
${isTutorial ? "" : "- Keep it engaging, clear, and accessible"}

Include:
- A concise title (<= 60 chars) in ${TARGET}
- Lecture body in ${TARGET}
- 3 concise bullet takeaways in ${SUPPORT}

Return JSON ONLY:
{
  "title": "<short title in ${TARGET}>",
  "target": "<lecture body in ${TARGET}>",
  "takeaways": ["<3 bullets in ${SUPPORT}>"]
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
- Length should be only 20-40 words total`
    : "";

  return `
You are creating educational reading material for language learners focused on ${topicText}. ${promptText}${tutorialDirective}
Choose the **next related sub-topic** based on the list of previous lecture titles.
Avoid repetition but maintain thematic coherence with ${topicText}.

previous_titles:
${prev}

CRITICAL LANGUAGE REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
1. The target language for learning is: ${TARGET} (language code: ${targetLang})
2. Write the title and lecture body in ${TARGET} ONLY
3. Write all takeaways in ${SUPPORT} ONLY
4. Do NOT write in any other language regardless of what the topic mentions
5. Even if the topic references other cultures or languages, you MUST write in ${TARGET} for title/body

IMPORTANT: Ignore any language references in the topic description. Your output language is determined by the target language (${TARGET}) for title/body and ${SUPPORT} for takeaways.

Content requirements:
${isTutorial ? "- Length: 20–40 words total" : "- Length: ≈180–260 words, suitable for a " + cefrLevel + " learner"}
${isTutorial ? "- 2–4 very short sentences (3–5 words each)" : "- Difficulty: " + diff}
${isTutorial ? "- Use ONLY greetings; no other topics" : "- Include cultural context and practical vocabulary for language learners"}
${isTutorial ? "- Keep it ultra-simple and welcoming" : "- Use examples and situations that learners might encounter"}

Include:
- A concise title (<= 60 chars) related to ${topicText} in ${TARGET}
- Lecture body in ${TARGET}
- 3 concise bullet takeaways in ${SUPPORT}

Return JSON ONLY:
{
  "title": "<short title in ${TARGET}>",
  "target": "<lecture body in ${TARGET}>",
  "takeaways": ["<3 bullets in ${SUPPORT}>"]
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
      .includes(String(title || "").toLowerCase()),
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
   TTS helpers
--------------------------- */

/**
 * Split text into sentences by splitting on sentence-ending punctuation
 * followed by whitespace. Keeps the punctuation attached to each sentence.
 */
function splitIntoSentences(text) {
  if (!text) return [];
  // Match runs of text ending with sentence-ending punctuation
  const result = text.match(/[^.!?。！？]*[.!?。！？]+/g);
  if (!result) return text.trim() ? [text.trim()] : [];
  const joined = result.join("");
  const remainder = text.slice(joined.length).trim();
  if (remainder) result.push(remainder);
  return result.map((s) => s.trim()).filter(Boolean);
}
const BCP47 = {
  es: { tts: "es-MX" },
  en: { tts: "en-US" },
  pt: { tts: "pt-BR" },
  fr: { tts: "fr-FR" },
  it: { tts: "it-IT" },
  nl: { tts: "nl-NL" },
  nah: { tts: "es-MX" },
  ru: { tts: "ru-RU" },
  de: { tts: "de-DE" },
  el: { tts: "el-GR" },
  yua: { tts: "es-MX" },
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
    `2. Write the title and lecture body in ${TARGET} ONLY`,
    `3. Write ALL takeaways in ${SUPPORT} ONLY`,
    `4. Do NOT write in any other language regardless of what the topic mentions`,
    `5. Even if the topic references other cultures or languages, you MUST write in ${TARGET} for title/body`,
    "",
    `IMPORTANT: Ignore any language references in the topic description. Use ${TARGET} for title/target and ${SUPPORT} only for takeaways.`,
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
   Speech format grading helpers
--------------------------- */
const SPEECH_CRITERIA = [
  { key: "accuracy", en: "Accuracy", es: "Precisión" },
  { key: "completeness", en: "Completeness", es: "Completitud" },
  { key: "pronunciation", en: "Pronunciation", es: "Pronunciación" },
  { key: "fluency", en: "Fluency", es: "Fluidez" },
  { key: "confidence", en: "Confidence", es: "Confianza" },
  { key: "comprehension", en: "Comprehension", es: "Comprensión" },
];

function speechScoreColor(score) {
  if (score >= 8) return "green";
  if (score >= 6) return "teal";
  if (score >= 4) return "yellow";
  return "purple";
}

/* ---------------------------
   Component
--------------------------- */
export default function History({
  userLanguage = "en",
  lesson = null,
  lessonContent = null,
  onSkip = null,
  lessonStartXp = null,
}) {
  const t = useT(userLanguage);
  const user = useUserStore((s) => s.user);
  const playSound = useSoundSettings((s) => s.playSound);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const { xp, levelNumber, progressPct, progress, npub, isLoading } =
    useSharedProgress();

  // Lesson progress (mirrors Vocabulary / GrammarBook pattern)
  const lessonXpGoal = lesson?.xpReward || 0;
  const lessonXpEarned =
    lessonStartXp == null ? 0 : Math.max(0, xp - lessonStartXp);
  const lessonProgressPct =
    lessonXpGoal > 0 ? Math.min(100, (lessonXpEarned / lessonXpGoal) * 100) : 0;
  const lessonProgress =
    lesson && !lesson.isTutorial && lessonStartXp != null && lessonXpGoal > 0
      ? {
          pct: lessonProgressPct,
          earned: Math.min(lessonXpEarned, lessonXpGoal),
          total: lessonXpGoal,
          label:
            userLanguage === "es"
              ? "Progreso de la lección"
              : "Lesson progress",
        }
      : null;

  const targetLang = [
    "en",
    "es",
    "pt",
    "nah",
    "fr",
    "it",
    "nl",
    "ja",
    "ru",
    "de",
    "el",
    "pl",
    "ga",
    "yua",
  ].includes(progress.targetLang)
    ? progress.targetLang
    : "es";

  // Use CEFR level from the current lesson, or user's proficiency level as fallback
  const cefrLevel = lesson?.id
    ? extractCEFRLevel(lesson.id)
    : getUserProficiencyLevel(progress, targetLang);

  // Track lesson content changes to auto-trigger generation
  const lessonContentKey = useMemo(
    () => JSON.stringify(lessonContent || null),
    [lessonContent],
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
      ru: t("language_ru"),
      de: t("language_de"),
      el: t("language_el"),
      pl: t("language_pl"),
      ga: t("language_ga"),
      yua: t("language_yua"),
    })[code] || code;

  const targetDisplay = localizedLangName(targetLang);
  const supportDisplay = localizedLangName(supportLang);

  const isTutorial = lessonContent?.topic === "tutorial";

  // List
  const [lectures, setLectures] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Generate state
  const [isGenerating, setIsGenerating] = useState(false);

  // Reading state
  const [isReadingTarget, setIsReadingTarget] = useState(false);
  const [isSynthesizingTarget, setIsSynthesizingTarget] = useState(false);
  // Sentence-level TTS highlighting
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);

  // Refs for audio
  const currentAudioRef = useRef(null);

  // Review question state
  // reviewQuestion shape: { type: "text"|"fill"|"mc", question: string,
  //   answer: string, blank?: string, options?: string[] }
  const [reviewQuestion, setReviewQuestion] = useState(null);
  const [reviewAnswer, setReviewAnswer] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewCorrect, setReviewCorrect] = useState(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [showReviewKeyboard, setShowReviewKeyboard] = useState(false);

  // Speech format state
  const [reviewFormat, setReviewFormat] = useState(null); // "question" | "speech"
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [speechFeedback, setSpeechFeedback] = useState(null);
  const [isGradingSpeech, setIsGradingSpeech] = useState(false);
  const [speechSubmitted, setSpeechSubmitted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const speechRecRef = useRef(null);
  const [lineTranslationsByLecture, setLineTranslationsByLecture] = useState(
    {},
  );
  const [translationsVisibleByLecture, setTranslationsVisibleByLecture] =
    useState({});
  const [isTranslatingLecture, setIsTranslatingLecture] = useState(false);

  const showReviewKeyboardButton = ["ja", "ru", "el", "pl", "ga"].includes(
    targetLang,
  );

  const handleReviewKeyboardInput = useCallback((key) => {
    if (key === "BACKSPACE") {
      setReviewAnswer((prev) => prev.slice(0, -1));
    } else {
      setReviewAnswer((prev) => prev + key);
    }
  }, []);

  // Browser SpeechRecognition support
  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  function startListening() {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = BCP47[targetLang]?.tts || "es-MX";
    rec.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSpeechTranscript(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    speechRecRef.current = rec;
    rec.start();
    setIsListening(true);
  }

  function stopListening() {
    if (speechRecRef.current) {
      speechRecRef.current.stop();
      speechRecRef.current = null;
    }
    setIsListening(false);
  }

  function startOverSpeech() {
    stopListening();
    setSpeechTranscript("");
  }

  function switchReviewFormat(format) {
    if (format === reviewFormat) return;
    stopListening();
    setReviewFormat(format);
    setReviewAnswer("");
    setReviewSubmitted(false);
    setReviewCorrect(null);
    setSpeechTranscript("");
    setSpeechFeedback(null);
    setSpeechSubmitted(false);
    setExplanationText("");
  }

  function scrollHistoryToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  async function translateLectureLines() {
    if (!viewLecture?.id || !targetSentences.length || isTranslatingLecture)
      return;

    if ((lineTranslationsByLecture[viewLecture.id] || []).length) return;

    setIsTranslatingLecture(true);
    setTranslationsVisibleByLecture((prev) => ({
      ...prev,
      [viewLecture.id]: true,
    }));
    setLineTranslationsByLecture((prev) => ({
      ...prev,
      [viewLecture.id]: Array(targetSentences.length).fill(""),
    }));

    let receivedCount = 0;
    const nextLines = Array(targetSentences.length).fill("");
    let lineBuffer = "";

    const applyLine = (rawLine) => {
      if (receivedCount >= targetSentences.length) return;
      const clean = String(rawLine || "")
        .replace(/^\s*\d+[\).:-]\s*/, "")
        .trim();
      if (!clean) return;
      nextLines[receivedCount] = clean;
      receivedCount += 1;
      setLineTranslationsByLecture((prev) => ({
        ...prev,
        [viewLecture.id]: [...nextLines],
      }));
    };

    try {
      const prompt = [
        `Translate each sentence below from ${LANG_NAME(targetLang)} (${targetLang}) into ${LANG_NAME(supportLang)} (${supportLang}).`,
        "Output plain text only.",
        `Return exactly ${targetSentences.length} lines.`,
        "Each line must be only the translation for the matching sentence index.",
        "No numbering, labels, markdown, or commentary.",
        "",
        "Sentences:",
        ...targetSentences.map((sentence, i) => `${i + 1}. ${sentence}`),
      ].join("\n");

      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      for await (const chunk of resp.stream) {
        const chunkText = textFromChunk(chunk);
        if (!chunkText) continue;
        lineBuffer += chunkText;
        const segments = lineBuffer.split(/\r?\n/);
        lineBuffer = segments.pop() || "";
        for (const line of segments) applyLine(line);
      }

      if (lineBuffer.trim()) applyLine(lineBuffer);

      if (!(receivedCount === targetSentences.length && nextLines.every(Boolean))) {
        const supportFallback = splitIntoSentences(viewLecture.support || "");
        if (supportFallback.length === targetSentences.length) {
          setLineTranslationsByLecture((prev) => ({
            ...prev,
            [viewLecture.id]: supportFallback,
          }));
        } else {
          setLineTranslationsByLecture((prev) => {
            const copy = { ...prev };
            delete copy[viewLecture.id];
            return copy;
          });
          setTranslationsVisibleByLecture((prev) => ({
            ...prev,
            [viewLecture.id]: false,
          }));
        }
      }
    } catch {
      const supportFallback = splitIntoSentences(viewLecture.support || "");
      if (supportFallback.length === targetSentences.length) {
        setLineTranslationsByLecture((prev) => ({
          ...prev,
          [viewLecture.id]: supportFallback,
        }));
      } else {
        setLineTranslationsByLecture((prev) => {
          const copy = { ...prev };
          delete copy[viewLecture.id];
          return copy;
        });
      }
    } finally {
      setIsTranslatingLecture(false);
    }
  }

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
    [lectures, activeId],
  );

  // Which lecture to show in the main pane (draft while streaming, else saved)
  const viewLecture = draftLecture || activeLecture;
  const targetSentences = useMemo(
    () => splitIntoSentences(viewLecture?.target || ""),
    [viewLecture?.target],
  );
  const lineTranslations = viewLecture?.id
    ? lineTranslationsByLecture[viewLecture.id] || []
    : [];
  const isTranslationVisible = viewLecture?.id
    ? translationsVisibleByLecture[viewLecture.id] === true
    : false;

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
    const safeTarget = sanitizeLectureBlock(String(parsed.target || ""), targetLang);
    const safeSupport = "";
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
        support: "",
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
        type === "takeaway"
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
        targetLang,
      );
      const finalTakeaways = takeaways.slice(0, 3);
      const safeTarget = draftTarget;
      const safeSupport = "";
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
    setActiveSentenceIndex(-1);
    try {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    } catch {}
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current._ttsCleanup?.();
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    } catch {}
    setIsReadingTarget(false);
    setIsSynthesizingTarget(false);
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

  const readTargetFull = async () =>
    speak({
      text: viewLecture?.target,
      langTag: (BCP47[targetLang] || BCP47.es).tts,
      onDone: () => {},
      setReading: setIsReadingTarget,
      setSynthesizing: setIsSynthesizingTarget,
    });

  const singleSentenceIndexRef = useRef(-1);

  const readSingleSentence = (sentence, index) => {
    if (!sentence) return;
    singleSentenceIndexRef.current = index;
    // No-op setReading/setSynthesizing to avoid spinners on single line taps
    speak({
      text: sentence,
      langTag: (BCP47[targetLang] || BCP47.es).tts,
      onDone: () => {
        // Only clear if this sentence is still the active one
        if (singleSentenceIndexRef.current === index) {
          setActiveSentenceIndex(-1);
          singleSentenceIndexRef.current = -1;
        }
      },
      setReading: () => {},
      setSynthesizing: () => {},
    });
    setActiveSentenceIndex(index);
  };

  // Generate a review question for the current lecture
  async function generateReviewQuestion() {
    const text = viewLecture?.target;
    if (!text || isGeneratingQuestion) return;

    setIsGeneratingQuestion(true);
    setReviewQuestion(null);
    setReviewAnswer("");
    setReviewSubmitted(false);
    setReviewCorrect(null);

    const questionTypes = ["text", "fill", "mc"];
    const type =
      questionTypes[Math.floor(Math.random() * questionTypes.length)];

    let instruction = "";
    if (type === "text") {
      instruction = [
        `Based on this ${LANG_NAME(targetLang)} text, create one short comprehension question in ${LANG_NAME(supportLang)}.`,
        `The question should be brief (one sentence). Do NOT repeat or quote the passage.`,
        `The answer should be a short phrase that any reasonable reader could derive from the text. Accept multiple valid phrasings.`,
        `Return ONLY valid JSON: {"question":"<the question>","answer":"<short correct answer>"}`,
        "",
        text,
      ].join("\n");
    } else if (type === "fill") {
      instruction = [
        `Based on this ${LANG_NAME(targetLang)} text, create a short fill-in-the-blank question in ${LANG_NAME(supportLang)}.`,
        `Write a brief original question (not a sentence from the passage) with a key phrase replaced by "___".`,
        `The missing answer should be something clearly derivable from the text — use meaningful words or short phrases, not obscure single words.`,
        `Return ONLY valid JSON: {"sentence":"<short question with ___>","answer":"<the missing word or phrase>"}`,
        "",
        text,
      ].join("\n");
    } else {
      instruction = [
        `Based on this ${LANG_NAME(targetLang)} text, create one short multiple-choice comprehension question in ${LANG_NAME(supportLang)}.`,
        `The question should test genuine understanding — ask about meaning, inference, or context rather than surface-level facts that are obvious from the question itself.`,
        `AVOID questions where the answer is already contained in the question (e.g. "What relationship is the speaker's brother?" with "Brother" as an option).`,
        `Instead, ask things like "What can you infer about...?", "Why does the speaker mention...?", "What is the main idea?", or "What does ___ refer to in context?"`,
        `Make the wrong options plausible but clearly distinguishable. Do NOT repeat or quote the passage. Keep the question to one sentence.`,
        `Return ONLY valid JSON: {"question":"<the question>","options":["A","B","C","D"],"answer":"<the correct option text>"}`,
        "",
        text,
      ].join("\n");
    }

    try {
      const raw = await callResponses({ model: MODEL, input: instruction });
      const parsed = safeParseJSON(raw);
      if (parsed) {
        if (type === "text") {
          setReviewQuestion({
            type,
            question: parsed.question,
            answer: parsed.answer,
          });
        } else if (type === "fill") {
          setReviewQuestion({
            type,
            question: parsed.sentence,
            answer: parsed.answer,
          });
        } else {
          setReviewQuestion({
            type,
            question: parsed.question,
            options: parsed.options,
            answer: parsed.answer,
          });
        }
      }
    } catch (e) {
      console.error("Failed to generate review question", e);
    } finally {
      setIsGeneratingQuestion(false);
    }
  }

  async function checkReviewAnswer() {
    if (!reviewQuestion || isCheckingAnswer) return;
    playSound(submitActionSound);

    let isCorrect = false;

    // Multiple choice: exact match
    if (reviewQuestion.type === "mc") {
      isCorrect = reviewAnswer === reviewQuestion.answer;
    } else {
      // Text / fill-in-the-blank: AI evaluation
      setIsCheckingAnswer(true);
      try {
        const prompt = [
          `You are grading a language-learning student's answer to a reading comprehension question.`,
          `Your job is to decide whether the student's answer is VALID — not whether it matches one specific expected answer.`,
          "",
          `Passage: ${viewLecture?.target || ""}`,
          `Question: ${reviewQuestion.question}`,
          `Student's answer: ${reviewAnswer}`,
          "",
          `GRADING RULES (follow strictly):`,
          `- The student's answer is CORRECT if it is ANY truthful, reasonable answer to the question based on the passage.`,
          `- There may be MULTIPLE valid answers. Do NOT expect one specific answer.`,
          `- For example, if the question asks "Who lives in the house?" and the passage mentions a father, mother, and brother, then ANY of those is correct.`,
          `- Accept answers in the target language OR the support language.`,
          `- Accept partial answers, synonyms, rephrasings, and minor spelling or grammar mistakes.`,
          `- Only mark INCORRECT if the answer is factually wrong according to the passage, completely unrelated, or nonsensical.`,
          `- When in doubt, mark CORRECT.`,
          `Reply with ONLY valid JSON: {"correct":true} or {"correct":false}`,
        ].join("\n");
        const raw = await callResponses({ model: MODEL, input: prompt });
        const parsed = safeParseJSON(raw);
        isCorrect = parsed?.correct === true;
      } catch {
        // Fallback to exact match on error
        isCorrect =
          reviewAnswer.trim().toLowerCase() ===
          reviewQuestion.answer.trim().toLowerCase();
      } finally {
        setIsCheckingAnswer(false);
      }
    }

    setReviewCorrect(isCorrect);
    setReviewSubmitted(isCorrect);
    playSound(isCorrect ? deliciousSound : clickSound);

    // Award XP immediately on correct answer
    if (isCorrect && activeLecture && !activeLecture.awarded) {
      const amt = Number(activeLecture?.xpAward || 0);
      if (amt > 0) {
        await awardXp(npub, amt, targetLang).catch(() => {});
      }
      setLectures((prev) =>
        prev.map((lec) =>
          lec.id === activeLecture.id ? { ...lec, awarded: true } : lec,
        ),
      );
    }
  }

  async function explainReviewAnswer() {
    if (!reviewQuestion || isLoadingExplanation || explanationText) return;
    setIsLoadingExplanation(true);
    try {
      const prompt = [
        `The student was asked this question about a ${LANG_NAME(targetLang)} text:`,
        `Question: ${reviewQuestion.question}`,
        `Correct answer: ${reviewQuestion.answer}`,
        `Student's answer: ${reviewAnswer}`,
        "",
        `Explain briefly in ${LANG_NAME(supportLang)} why the correct answer is "${reviewQuestion.answer}".`,
        `Keep it to 2-3 sentences.`,
      ].join("\n");
      const raw = await callResponses({ model: MODEL, input: prompt });
      setExplanationText(raw || "Could not generate explanation.");
    } catch {
      setExplanationText("Could not generate explanation.");
    } finally {
      setIsLoadingExplanation(false);
    }
  }

  async function gradeSpeechAttempt() {
    if (!speechTranscript.trim() || isGradingSpeech) return;
    playSound(submitActionSound);
    setIsGradingSpeech(true);
    stopListening();

    const originalText = viewLecture?.target || "";
    const langName = LANG_NAME(targetLang);
    const supportName = LANG_NAME(supportLang);

    const prompt = `You are grading a language learner's attempt to read a ${langName} paragraph aloud.

ORIGINAL PARAGRAPH:
${originalText}

STUDENT'S ATTEMPT (transcription):
${speechTranscript}

Grade the student's reading attempt on these criteria (1-10 scale):

SCORING GUIDELINES:
- accuracy (1-10): How closely does the student's text match the original? Word-for-word comparison.
- completeness (1-10): Did the student read the full paragraph or only parts?
- pronunciation (1-10): Based on transcription accuracy, how well were words likely pronounced? Wrong or missing words suggest pronunciation difficulty.
- fluency (1-10): Based on the flow and coherence of the transcript, how smooth was the reading?
- confidence (1-10): Overall assessment of reading confidence based on completeness and accuracy.
- comprehension (1-10): Does the transcript suggest the student understood what they were reading?

BE ENCOURAGING but HONEST. This is practice, not a test. Highlight what they did well and what to work on.

Provide a brief 2-3 sentence summary of feedback in ${supportName}.

Return ONLY valid JSON:
{"summary":"brief feedback","scores":{"accuracy":{"score":5,"note":"reason"},"completeness":{"score":5,"note":"reason"},"pronunciation":{"score":5,"note":"reason"},"fluency":{"score":5,"note":"reason"},"confidence":{"score":5,"note":"reason"},"comprehension":{"score":5,"note":"reason"}}}`;

    try {
      const resp = await gradingModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      let resultText = "";
      const result = resp.response;
      if (typeof result?.text === "function") resultText = result.text();
      else if (typeof result?.text === "string") resultText = result.text;
      else {
        const cand = result?.candidates?.[0];
        if (cand?.content?.parts?.length)
          resultText = cand.content.parts.map((p) => p.text || "").join("");
      }
      const parsed = safeParseJSON(resultText);
      if (parsed) {
        setSpeechFeedback(parsed);
      }
    } catch (e) {
      console.error("Speech grading failed", e);
      setSpeechFeedback({
        summary:
          userLanguage === "es"
            ? "No se pudo generar retroalimentación. ¡Sigue practicando!"
            : "Could not generate feedback. Keep practicing!",
        scores: {},
      });
    } finally {
      setIsGradingSpeech(false);
      setSpeechSubmitted(true);
      playSound(deliciousSound);
    }

    // Always award XP for speech format (user always passes)
    if (activeLecture && !activeLecture.awarded) {
      const amt = Number(activeLecture?.xpAward || 0);
      if (amt > 0) {
        await awardXp(npub, amt, targetLang).catch(() => {});
      }
      setLectures((prev) =>
        prev.map((lec) =>
          lec.id === activeLecture.id ? { ...lec, awarded: true } : lec,
        ),
      );
    }
  }

  // Reset review state when lecture changes
  useEffect(() => {
    setReviewFormat(null);
    setReviewQuestion(null);
    setExplanationText("");
    setIsLoadingExplanation(false);
    setReviewAnswer("");
    setReviewSubmitted(false);
    setReviewCorrect(null);
    setShowReviewKeyboard(false);
    setSpeechTranscript("");
    setSpeechFeedback(null);
    setSpeechSubmitted(false);
    stopListening();
  }, [activeId]); // eslint-disable-line

  // Default to question format when a lecture is ready
  useEffect(() => {
    if (
      activeLecture?.target &&
      !draftLecture &&
      !isGenerating &&
      reviewFormat === null
    ) {
      setReviewFormat("question");
    }
  }, [activeLecture?.id, draftLecture, isGenerating]); // eslint-disable-line

  // Auto-generate review question when format is "question"
  useEffect(() => {
    if (
      reviewFormat === "question" &&
      activeLecture?.target &&
      !draftLecture &&
      !isGenerating &&
      !reviewQuestion &&
      !isGeneratingQuestion
    ) {
      generateReviewQuestion();
    }
  }, [reviewFormat, activeLecture?.id, draftLecture, isGenerating]); // eslint-disable-line

  const xpReasonText =
    activeLecture?.xpReason && typeof activeLecture.xpReason === "string"
      ? ` — ${activeLecture.xpReason}`
      : "";

  // Award XP for current lecture and move to next module
  function finishReadingAndNext() {
    if (!activeLecture || isGenerating) return;
    playSound(submitActionSound);
    // XP is already awarded on correct answer; just move to next module
    if (onSkip) {
      onSkip();
    }
  }

  // Skip handler
  function handleSkip() {
    playSound(nextButtonSound);
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
            bg="rgba(255, 255, 255, 0.05)"
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
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
                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="700">
                  {viewLecture.title}
                  {draftLecture ? (
                    <Text as="span" ml={2} fontSize="sm" opacity={0.7}>
                      ({t("reading_generating") || "generating…"})
                    </Text>
                  ) : null}
                </Text>

                {/* TTS controls */}
                <HStack spacing={4} justify="center">
                  <VStack spacing={0.5}>
                    <IconButton
                      icon={
                        isSynthesizingTarget ? (
                          <Spinner size="sm" />
                        ) : (
                          <PiLightningDuotone size="20px" />
                        )
                      }
                      onClick={() => {
                        playSound(selectSound);
                        readTargetFull();
                      }}
                      aria-label="Read all"
                      size="sm"
                      variant="ghost"
                      isDisabled={
                        !viewLecture?.target || draftLecture || isGenerating
                      }
                    />
                    <Text fontSize="xs" opacity={0.6}>
                      {t("history_read_all")}
                    </Text>
                  </VStack>
                  <VStack spacing={0.5}>
                    <IconButton
                      icon={<PiStopDuotone size="20px" />}
                      onClick={() => {
                        playSound(selectSound);
                        stopSpeech();
                      }}
                      aria-label="Stop"
                      size="sm"
                      variant="ghost"
                      isDisabled={!isReadingTarget && !isSynthesizingTarget}
                    />
                    <Text fontSize="xs" opacity={0.6}>
                      {t("history_stop")}
                    </Text>
                  </VStack>
                </HStack>

                <Box
                  bg="rgba(56, 178, 172, 0.15)"
                  borderLeft="3px solid"
                  borderColor="teal.400"
                  rounded="lg"
                  p={4}
                >
                  {isTranslationVisible ? (
                    <VStack align="stretch" spacing={2}>
                      {targetSentences.map((sentence, i) => {
                        const colors = [
                          "rgba(56, 178, 172, 0.12)",
                          "rgba(128, 90, 213, 0.12)",
                          "rgba(237, 137, 54, 0.12)",
                          "rgba(99, 179, 237, 0.12)",
                          "rgba(246, 173, 85, 0.12)",
                        ];
                        const shadowColors = [
                          "rgba(56, 178, 172, 0.3)",
                          "rgba(128, 90, 213, 0.3)",
                          "rgba(237, 137, 54, 0.3)",
                          "rgba(99, 179, 237, 0.3)",
                          "rgba(246, 173, 85, 0.3)",
                        ];
                        const defaultBg = colors[i % colors.length];
                        const shadow = shadowColors[i % shadowColors.length];
                        return (
                          <Box key={i}>
                            <Text
                              as="span"
                              role="button"
                              tabIndex={0}
                              position="relative"
                              bg={
                                activeSentenceIndex === i
                                  ? "rgba(56, 178, 172, 0.35)"
                                  : defaultBg
                              }
                              borderRadius="sm"
                              px={1}
                              py="1px"
                              border="1px solid"
                              borderColor={
                                activeSentenceIndex === i
                                  ? "teal.400"
                                  : "rgba(255, 255, 255, 0.12)"
                              }
                              boxShadow={
                                activeSentenceIndex === i
                                  ? "0px 4px 0px teal"
                                  : `0px 4px 0px ${shadow}`
                              }
                              transition="all 0.15s"
                              cursor="pointer"
                              sx={{
                                "&:active": {
                                  top: "2px",
                                  boxShadow: "none",
                                },
                              }}
                              onClick={() => {
                                playSound(selectSound);
                                readSingleSentence(sentence, i);
                              }}
                            >
                              {sentence}
                            </Text>
                            {lineTranslations[i] ? (
                              <Text
                                mt={1}
                                px={1}
                                fontSize="sm"
                                color="whiteAlpha.800"
                                opacity={0.9}
                                fontStyle="italic"
                                lineHeight="1.5"
                              >
                                {lineTranslations[i]}
                              </Text>
                            ) : null}
                          </Box>
                        );
                      })}
                    </VStack>
                  ) : (
                    <Text fontSize={{ base: "md", md: "md" }} lineHeight="2.2">
                      {targetSentences.map((sentence, i) => {
                        const colors = [
                          "rgba(56, 178, 172, 0.12)",
                          "rgba(128, 90, 213, 0.12)",
                          "rgba(237, 137, 54, 0.12)",
                          "rgba(99, 179, 237, 0.12)",
                          "rgba(246, 173, 85, 0.12)",
                        ];
                        const shadowColors = [
                          "rgba(56, 178, 172, 0.3)",
                          "rgba(128, 90, 213, 0.3)",
                          "rgba(237, 137, 54, 0.3)",
                          "rgba(99, 179, 237, 0.3)",
                          "rgba(246, 173, 85, 0.3)",
                        ];
                        const defaultBg = colors[i % colors.length];
                        const shadow = shadowColors[i % shadowColors.length];
                        return (
                          <Text
                            as="span"
                            role="button"
                            tabIndex={0}
                            key={i}
                            position="relative"
                            bg={
                              activeSentenceIndex === i
                                ? "rgba(56, 178, 172, 0.35)"
                                : defaultBg
                            }
                            borderRadius="sm"
                            px={1}
                            py="1px"
                            border="1px solid"
                            borderColor={
                              activeSentenceIndex === i
                                ? "teal.400"
                                : "rgba(255, 255, 255, 0.12)"
                            }
                            boxShadow={
                              activeSentenceIndex === i
                                ? "0px 4px 0px teal"
                                : `0px 4px 0px ${shadow}`
                            }
                            transition="all 0.15s"
                            cursor="pointer"
                            sx={{
                              "&:active": {
                                top: "2px",
                                boxShadow: "none",
                              },
                            }}
                            onClick={() => {
                              playSound(selectSound);
                              readSingleSentence(sentence, i);
                            }}
                          >
                            {sentence}{" "}
                          </Text>
                        );
                      })}
                    </Text>
                  )}
                  {showTranslations ? (
                    <HStack justify="flex-end" mt={4}>
                      {!lineTranslations.length ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            playSound(selectSound);
                            scrollHistoryToTop();
                            translateLectureLines();
                          }}
                          isLoading={isTranslatingLecture}
                        >
                          {t("history_translate")}
                        </Button>
                      ) : isTranslationVisible ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            playSound(selectSound);
                            if (!viewLecture?.id) return;
                            setTranslationsVisibleByLecture((prev) => ({
                              ...prev,
                              [viewLecture.id]: false,
                            }));
                          }}
                        >
                          {t("history_hide_translation") || "Hide translation"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            playSound(selectSound);
                            scrollHistoryToTop();
                            if (!viewLecture?.id) return;
                            setTranslationsVisibleByLecture((prev) => ({
                              ...prev,
                              [viewLecture.id]: true,
                            }));
                          }}
                        >
                          {t("history_show_translation") || "Show translation"}
                        </Button>
                      )}
                    </HStack>
                  ) : null}
                </Box>

                {/* Review: question or speech format */}
                {!draftLecture && !isGenerating ? (
                  <Box>
                    <Divider opacity={0.2} mb={3} />

                    {/* Tutorial mode: let user toggle format */}
                    {reviewFormat && (
                      <HStack spacing={3} mb={3} justify="center">
                        <Text
                          fontSize="sm"
                          fontWeight={
                            reviewFormat === "question" ? "bold" : "normal"
                          }
                          opacity={reviewFormat === "question" ? 1 : 0.6}
                        >
                          {t("history_format_question")}
                        </Text>
                        <Switch
                          size="md"
                          colorScheme="purple"
                          isChecked={reviewFormat === "speech"}
                          onChange={() =>
                            switchReviewFormat(
                              reviewFormat === "speech" ? "question" : "speech",
                            )
                          }
                        />
                        <Text
                          fontSize="sm"
                          fontWeight={
                            reviewFormat === "speech" ? "bold" : "normal"
                          }
                          opacity={reviewFormat === "speech" ? 1 : 0.6}
                        >
                          {t("history_format_speech")}
                        </Text>
                      </HStack>
                    )}

                    {/* Speech format */}
                    {reviewFormat === "speech" ? (
                      <VStack align="stretch" spacing={3}>
                        <Text fontWeight="600" fontSize="sm">
                          {t("history_speech_heading")}
                        </Text>

                        {!speechSubmitted && (
                          <>
                            <HStack justify="center" spacing={2}>
                              {!isListening ? (
                                <Button
                                  size="sm"
                                  colorScheme="purple"
                                  leftIcon={<PiMicrophoneStageDuotone />}
                                  onClick={() => {
                                    playSound(selectSound);
                                    startListening();
                                  }}
                                  isDisabled={!hasSpeechRecognition}
                                >
                                  {t("history_speech_start_mic")}
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    leftIcon={<PiStopDuotone />}
                                    onClick={() => {
                                      playSound(selectSound);
                                      stopListening();
                                    }}
                                  >
                                    {t("history_speech_stop_mic")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="whiteAlpha"
                                    onClick={() => {
                                      playSound(selectSound);
                                      startOverSpeech();
                                    }}
                                  >
                                    {t("history_speech_start_over")}
                                  </Button>
                                </>
                              )}
                            </HStack>

                            {speechTranscript && (
                              <Text
                                fontSize="sm"
                                lineHeight="1.8"
                                opacity={0.9}
                              >
                                {speechTranscript}
                              </Text>
                            )}

                            {speechTranscript && (
                              <Box display="flex" justifyContent="center">
                                <Button
                                  size="md"
                                  colorScheme="teal"
                                  onClick={gradeSpeechAttempt}
                                  isLoading={isGradingSpeech}
                                  loadingText={t("history_speech_submitting")}
                                  isDisabled={!speechTranscript.trim()}
                                  maxW="300px"
                                  w="full"
                                  py={6}
                                >
                                  {t("history_speech_submit")}
                                </Button>
                              </Box>
                            )}
                          </>
                        )}

                        {/* Speech feedback */}
                        {speechSubmitted && speechFeedback && (
                          <SlideFade in={true} offsetY="10px">
                            <VStack spacing={3} align="stretch">
                              <VStack
                                spacing={3}
                                align="stretch"
                                p={4}
                                borderRadius="xl"
                                bg="linear-gradient(90deg, rgba(72,187,120,0.16), rgba(56,161,105,0.08))"
                                borderWidth="1px"
                                borderColor="green.400"
                                boxShadow="0 12px 30px rgba(0, 0, 0, 0.3)"
                              >
                                <HStack spacing={3} align="center">
                                  <Flex
                                    w="44px"
                                    h="44px"
                                    rounded="full"
                                    align="center"
                                    justify="center"
                                    bg="green.500"
                                    color="white"
                                    fontWeight="bold"
                                    fontSize="lg"
                                    boxShadow="0 10px 24px rgba(0,0,0,0.22)"
                                    flexShrink={0}
                                  >
                                    {"✓"}
                                  </Flex>
                                  <Box flex="1">
                                    <Text fontWeight="semibold">
                                      {t("history_speech_complete")}
                                    </Text>
                                  </Box>
                                </HStack>

                                {speechFeedback.summary && (
                                  <Text
                                    fontSize="sm"
                                    opacity={0.9}
                                    lineHeight="1.6"
                                  >
                                    {speechFeedback.summary}
                                  </Text>
                                )}

                                {/* Total score */}
                                {speechFeedback.scores &&
                                  Object.keys(speechFeedback.scores).length >
                                    0 &&
                                  (() => {
                                    const totalColorMap = {
                                      green: "#48BB78",
                                      teal: "#38B2AC",
                                      yellow: "#ECC94B",
                                      purple: "#B794F4",
                                    };
                                    let totalScore = 0;
                                    let count = 0;
                                    SPEECH_CRITERIA.forEach((c) => {
                                      const d = speechFeedback.scores[c.key];
                                      const s =
                                        typeof d?.score === "number"
                                          ? Math.max(1, Math.min(10, d.score))
                                          : typeof d === "number"
                                            ? Math.max(1, Math.min(10, d))
                                            : null;
                                      if (s !== null) {
                                        totalScore += s;
                                        count++;
                                      }
                                    });
                                    if (count === 0) return null;
                                    const avg = totalScore / count;
                                    const totalAccent =
                                      totalColorMap[speechScoreColor(avg)] ||
                                      "#A0AEC0";
                                    return (
                                      <Box
                                        bg="rgba(0,0,0,0.25)"
                                        px={4}
                                        py={3}
                                        rounded="xl"
                                        borderWidth="1px"
                                        borderColor={totalAccent}
                                        textAlign="center"
                                      >
                                        <Text
                                          fontWeight="semibold"
                                          fontSize="xs"
                                          opacity={0.7}
                                          textTransform="uppercase"
                                          letterSpacing="0.05em"
                                          mb={1}
                                        >
                                          {t("history_speech_total_score")}
                                        </Text>
                                        <Text
                                          fontSize="3xl"
                                          fontWeight="bold"
                                          color={totalAccent}
                                          lineHeight="1"
                                        >
                                          {totalScore}
                                          <Text
                                            as="span"
                                            fontSize="md"
                                            opacity={0.5}
                                            fontWeight="normal"
                                          >
                                            /{count * 10}
                                          </Text>
                                        </Text>
                                      </Box>
                                    );
                                  })()}

                                {/* Score breakdown grid */}
                                {speechFeedback.scores &&
                                  Object.keys(speechFeedback.scores).length >
                                    0 && (
                                    <Box>
                                      <Text
                                        fontWeight="semibold"
                                        fontSize="xs"
                                        mb={2}
                                        opacity={0.7}
                                        textTransform="uppercase"
                                        letterSpacing="0.05em"
                                      >
                                        {t("history_speech_breakdown")}
                                      </Text>
                                      <Grid
                                        templateColumns="repeat(2, 1fr)"
                                        gap={2}
                                      >
                                        {SPEECH_CRITERIA.map((criterion) => {
                                          const data =
                                            speechFeedback.scores[
                                              criterion.key
                                            ];
                                          const score =
                                            typeof data?.score === "number"
                                              ? Math.max(
                                                  1,
                                                  Math.min(10, data.score),
                                                )
                                              : typeof data === "number"
                                                ? Math.max(
                                                    1,
                                                    Math.min(10, data),
                                                  )
                                                : null;
                                          if (score === null) return null;
                                          const note =
                                            typeof data?.note === "string"
                                              ? data.note
                                              : "";
                                          const color = speechScoreColor(score);
                                          const colorMap = {
                                            green: "#48BB78",
                                            teal: "#38B2AC",
                                            yellow: "#ECC94B",
                                            purple: "#B794F4",
                                          };
                                          const accent =
                                            colorMap[color] || "#A0AEC0";
                                          return (
                                            <GridItem key={criterion.key}>
                                              <Box
                                                bg="rgba(0,0,0,0.2)"
                                                px={3}
                                                py={2.5}
                                                rounded="lg"
                                                borderLeft="3px solid"
                                                borderColor={accent}
                                                h="100%"
                                              >
                                                <HStack
                                                  justify="space-between"
                                                  align="center"
                                                  mb={1}
                                                >
                                                  <Text
                                                    fontSize="xs"
                                                    fontWeight="semibold"
                                                    opacity={0.85}
                                                  >
                                                    {
                                                      criterion[
                                                        userLanguage === "es"
                                                          ? "es"
                                                          : "en"
                                                      ]
                                                    }
                                                  </Text>
                                                  <Text
                                                    fontSize="lg"
                                                    fontWeight="bold"
                                                    color={accent}
                                                    lineHeight="1"
                                                  >
                                                    {score}
                                                  </Text>
                                                </HStack>
                                                {note && (
                                                  <Text
                                                    fontSize="2xs"
                                                    opacity={0.55}
                                                    lineHeight="1.4"
                                                    noOfLines={3}
                                                  >
                                                    {note}
                                                  </Text>
                                                )}
                                              </Box>
                                            </GridItem>
                                          );
                                        })}
                                      </Grid>
                                    </Box>
                                  )}

                                {/* Next button - always pass */}
                                {activeLecture && (
                                  <Box
                                    width="100%"
                                    display="flex"
                                    justifyContent="center"
                                  >
                                    <Button
                                      rightIcon={<FiArrowRight />}
                                      colorScheme="cyan"
                                      variant="solid"
                                      onClick={finishReadingAndNext}
                                      isDisabled={isGenerating}
                                      shadow="md"
                                      width="full"
                                      py={6}
                                      size="lg"
                                      maxWidth="250px"
                                    >
                                      {t("reading_btn_next") || "Next"}
                                    </Button>
                                  </Box>
                                )}

                                {lessonProgress && lessonProgress.total > 0 && (
                                  <VStack
                                    align="center"
                                    spacing={2}
                                    mt={2}
                                    px={1}
                                    width="full"
                                  >
                                    <HStack
                                      justify="center"
                                      align="center"
                                      spacing={3}
                                      fontSize="xs"
                                    >
                                      <Text
                                        color="whiteAlpha.800"
                                        fontWeight="semibold"
                                        textAlign="center"
                                      >
                                        {lessonProgress.label}
                                      </Text>
                                      <Text
                                        color="whiteAlpha.800"
                                        fontWeight="semibold"
                                        textAlign="center"
                                      >
                                        {Math.round(lessonProgress.pct)}%
                                      </Text>
                                    </HStack>
                                    <Box width="60%" mx="auto">
                                      <WaveBar
                                        value={lessonProgress.pct}
                                        height={20}
                                        start="#4aa8ff"
                                        end="#75f8ffff"
                                      />
                                    </Box>
                                  </VStack>
                                )}
                              </VStack>
                              <RandomCharacter />
                            </VStack>
                          </SlideFade>
                        )}
                      </VStack>
                    ) : isGeneratingQuestion ? (
                      <HStack justify="center" py={4}>
                        <Spinner size="sm" color="teal.400" />
                        <Text fontSize="sm" opacity={0.7}>
                          {t("history_generating_question")}
                        </Text>
                      </HStack>
                    ) : reviewQuestion ? (
                      <VStack align="stretch" spacing={3}>
                        <Text fontWeight="600" fontSize="sm">
                          {t("history_review_heading")}
                        </Text>

                        <Text fontSize="sm" lineHeight="1.6">
                          {reviewQuestion.question}
                        </Text>

                        {reviewQuestion.type === "fill" ? (
                          <>
                            <HStack maxW="400px">
                              <Input
                                size="sm"
                                placeholder={t(
                                  "history_fill_blank_placeholder",
                                )}
                                value={reviewAnswer}
                                onChange={(e) => {
                                  setReviewAnswer(e.target.value);
                                  if (reviewCorrect !== null)
                                    setReviewCorrect(null);
                                }}
                                isDisabled={isCheckingAnswer}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && checkReviewAnswer()
                                }
                              />
                              <Button
                                size="sm"
                                colorScheme="teal"
                                onClick={checkReviewAnswer}
                                isLoading={isCheckingAnswer}
                                isDisabled={!reviewAnswer.trim()}
                              >
                                {t("history_check_answer")}
                              </Button>
                            </HStack>
                            {showReviewKeyboard && showReviewKeyboardButton && (
                              <VirtualKeyboard
                                lang={targetLang}
                                onKeyPress={handleReviewKeyboardInput}
                                onClose={() => setShowReviewKeyboard(false)}
                                userLanguage={userLanguage}
                              />
                            )}
                            {showReviewKeyboardButton && (
                              <Stack
                                direction="row"
                                spacing={2}
                                justify="flex-start"
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  leftIcon={<MdKeyboard />}
                                  onClick={() => {
                                    playSound(selectSound);
                                    setShowReviewKeyboard((prev) => !prev);
                                  }}
                                >
                                  {showReviewKeyboard
                                    ? t("history_keyboard_close")
                                    : t("history_keyboard_open")}
                                </Button>
                              </Stack>
                            )}
                          </>
                        ) : reviewQuestion.type === "mc" ? (
                          <>
                            <VStack align="stretch" spacing={2}>
                              {reviewQuestion.options.map((opt, i) => (
                                <Box
                                  key={i}
                                  as="button"
                                  onClick={() => {
                                    playSound(selectSound);
                                    setReviewAnswer(opt);
                                    if (reviewCorrect !== null)
                                      setReviewCorrect(null);
                                  }}
                                  p={3}
                                  borderRadius="lg"
                                  borderWidth="1px"
                                  borderColor={
                                    reviewAnswer === opt
                                      ? "teal.400"
                                      : "whiteAlpha.200"
                                  }
                                  bg={
                                    reviewAnswer === opt
                                      ? "rgba(56, 178, 172, 0.12)"
                                      : "transparent"
                                  }
                                  _hover={{ bg: "rgba(255,255,255,0.06)" }}
                                  cursor="pointer"
                                  transition="all 0.15s"
                                  textAlign="left"
                                >
                                  <HStack spacing={3}>
                                    <Flex
                                      w="28px"
                                      h="28px"
                                      rounded="full"
                                      align="center"
                                      justify="center"
                                      borderWidth="2px"
                                      borderColor={
                                        reviewAnswer === opt
                                          ? "teal.400"
                                          : "whiteAlpha.300"
                                      }
                                      bg={
                                        reviewAnswer === opt
                                          ? "teal.400"
                                          : "transparent"
                                      }
                                      color="white"
                                      fontSize="xs"
                                      fontWeight="bold"
                                      flexShrink={0}
                                      transition="all 0.15s"
                                    >
                                      {String.fromCharCode(65 + i)}
                                    </Flex>
                                    <Text fontSize="sm">{opt}</Text>
                                  </HStack>
                                </Box>
                              ))}
                            </VStack>
                            <Button
                              size="sm"
                              colorScheme="teal"
                              onClick={checkReviewAnswer}
                              isDisabled={!reviewAnswer}
                              w="fit-content"
                            >
                              {t("history_check_answer")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <HStack maxW="400px">
                              <Input
                                size="sm"
                                placeholder={t("history_answer_placeholder")}
                                value={reviewAnswer}
                                onChange={(e) => {
                                  setReviewAnswer(e.target.value);
                                  if (reviewCorrect !== null)
                                    setReviewCorrect(null);
                                }}
                                isDisabled={isCheckingAnswer}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && checkReviewAnswer()
                                }
                              />
                              <Button
                                size="sm"
                                colorScheme="teal"
                                onClick={checkReviewAnswer}
                                isLoading={isCheckingAnswer}
                                isDisabled={!reviewAnswer.trim()}
                              >
                                {t("history_check_answer")}
                              </Button>
                            </HStack>
                            {showReviewKeyboard && showReviewKeyboardButton && (
                              <VirtualKeyboard
                                lang={targetLang}
                                onKeyPress={handleReviewKeyboardInput}
                                onClose={() => setShowReviewKeyboard(false)}
                                userLanguage={userLanguage}
                              />
                            )}
                            {showReviewKeyboardButton && (
                              <Stack
                                direction="row"
                                spacing={2}
                                justify="flex-start"
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  leftIcon={<MdKeyboard />}
                                  onClick={() => {
                                    playSound(selectSound);
                                    setShowReviewKeyboard((prev) => !prev);
                                  }}
                                >
                                  {showReviewKeyboard
                                    ? t("history_keyboard_close")
                                    : t("history_keyboard_open")}
                                </Button>
                              </Stack>
                            )}
                          </>
                        )}

                        {reviewCorrect !== null && (
                          <SlideFade in={true} offsetY="10px">
                            <VStack spacing={3} align="stretch">
                              <VStack
                                spacing={3}
                                align="stretch"
                                p={4}
                                borderRadius="xl"
                                bg={
                                  reviewCorrect
                                    ? "linear-gradient(90deg, rgba(72,187,120,0.16), rgba(56,161,105,0.08))"
                                    : "linear-gradient(90deg, rgba(245,101,101,0.16), rgba(229,62,62,0.08))"
                                }
                                borderWidth="1px"
                                borderColor={
                                  reviewCorrect ? "green.400" : "red.300"
                                }
                                boxShadow="0 12px 30px rgba(0, 0, 0, 0.3)"
                              >
                                <HStack spacing={3} align="center">
                                  <Flex
                                    w="44px"
                                    h="44px"
                                    rounded="full"
                                    align="center"
                                    justify="center"
                                    bg={reviewCorrect ? "green.500" : "red.500"}
                                    color="white"
                                    fontWeight="bold"
                                    fontSize="lg"
                                    boxShadow="0 10px 24px rgba(0,0,0,0.22)"
                                    flexShrink={0}
                                  >
                                    {reviewCorrect ? "✓" : "✖"}
                                  </Flex>
                                  <Box flex="1">
                                    <Text fontWeight="semibold">
                                      {reviewCorrect
                                        ? t("history_correct")
                                        : t("history_not_quite")}
                                    </Text>
                                  </Box>
                                </HStack>

                                {!reviewCorrect && (
                                  <Button
                                    leftIcon={
                                      isLoadingExplanation ? (
                                        <Spinner size="sm" />
                                      ) : (
                                        <FiHelpCircle />
                                      )
                                    }
                                    colorScheme="pink"
                                    onClick={() => {
                                      playSound(selectSound);
                                      explainReviewAnswer();
                                    }}
                                    isDisabled={
                                      isLoadingExplanation || !!explanationText
                                    }
                                    width="full"
                                    py={6}
                                    size="lg"
                                  >
                                    {t("history_explain_answer")}
                                  </Button>
                                )}

                                {reviewCorrect && activeLecture && (
                                  <Box
                                    width="100%"
                                    display="flex"
                                    justifyContent={"center"}
                                  >
                                    <Button
                                      rightIcon={<FiArrowRight />}
                                      colorScheme="cyan"
                                      variant="solid"
                                      onClick={finishReadingAndNext}
                                      isDisabled={isGenerating}
                                      shadow="md"
                                      width="full"
                                      py={6}
                                      size="lg"
                                      maxWidth="250px"
                                    >
                                      {activeLecture.awarded
                                        ? t("reading_btn_next") ||
                                          "Next lecture"
                                        : t("reading_btn_finish") ||
                                          "Finished reading"}
                                    </Button>
                                  </Box>
                                )}

                                {reviewCorrect &&
                                  lessonProgress &&
                                  lessonProgress.total > 0 && (
                                    <VStack
                                      align="center"
                                      spacing={2}
                                      mt={2}
                                      px={1}
                                      width="full"
                                    >
                                      <HStack
                                        justify="center"
                                        align="center"
                                        spacing={3}
                                        fontSize="xs"
                                      >
                                        <Text
                                          color="whiteAlpha.800"
                                          fontWeight="semibold"
                                          textAlign="center"
                                        >
                                          {lessonProgress.label}
                                        </Text>
                                        <Text
                                          color="whiteAlpha.800"
                                          fontWeight="semibold"
                                          textAlign="center"
                                        >
                                          {Math.round(lessonProgress.pct)}%
                                        </Text>
                                      </HStack>
                                      <Box width="60%" mx="auto">
                                        <WaveBar
                                          value={lessonProgress.pct}
                                          height={20}
                                          start="#4aa8ff"
                                          end="#75f8ffff"
                                        />
                                      </Box>
                                    </VStack>
                                  )}
                              </VStack>
                              <RandomCharacter />
                              {!reviewCorrect && explanationText && (
                                <Box
                                  p={4}
                                  borderRadius="lg"
                                  bg="rgba(246, 92, 174, 0.1)"
                                  borderWidth="1px"
                                  borderColor="pink.400"
                                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                                >
                                  <HStack spacing={2} mb={2}>
                                    <FiHelpCircle color="var(--chakra-colors-pink-400)" />
                                    <Text
                                      fontWeight="semibold"
                                      color="pink.300"
                                    >
                                      {t("history_explanation_heading")}
                                    </Text>
                                  </HStack>
                                  <Text
                                    fontSize="sm"
                                    color="whiteAlpha.900"
                                    lineHeight="1.6"
                                  >
                                    {explanationText}
                                  </Text>
                                </Box>
                              )}
                            </VStack>
                          </SlideFade>
                        )}
                      </VStack>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          playSound(selectSound);
                          generateReviewQuestion();
                        }}
                      >
                        {t("history_generate_review")}
                      </Button>
                    )}
                  </Box>
                ) : null}

                {Array.isArray(viewLecture.takeaways) &&
                viewLecture.takeaways.length ? (
                  <>
                    <Text fontWeight="600" fontSize="sm" opacity={0.9} mb={1.5}>
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
