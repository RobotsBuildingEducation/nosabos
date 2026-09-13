// src/utils/dailyPlateHeadline.js
//
// Manages the personalized single-sentence headline for Today's Focus.
// Extracts task objectives from today's scheduled plate courses (excluding
// repair and goal, which the companion pet handles), prompts Gemini once,
// and caches the resulting promise under user.dailyPlateHeadline[targetLang] = { dayKey, appLanguage, text }.

import useUserStore from "../hooks/useUserStore.js";

export const LANGUAGE_PROMPT_NAMES = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  de: "German",
  ja: "Japanese",
  zh: "Mandarin Chinese",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
  nl: "Dutch",
  nah: "Eastern Huasteca Nahuatl",
  pl: "Polish",
  el: "Greek",
  ga: "Irish",
};

export function resolveLanguageName(code) {
  const normalized = typeof code === "string" ? code.trim().toLowerCase() : "";
  return (
    LANGUAGE_PROMPT_NAMES[normalized] ||
    normalized.toUpperCase() ||
    "English"
  );
}

export function normalizePlateLang(targetLang) {
  return typeof targetLang === "string" && targetLang.trim()
    ? targetLang.trim().toLowerCase()
    : "es";
}

/**
 * Check if today's headline is already cached in the user document for the
 * requested support/app language.
 * Returns the headline text if both dayKey and appLanguage match, otherwise null.
 */
export function getStoredPlateHeadline(user, targetLang, dayKey, appLanguage = "en") {
  if (!user || !targetLang || !dayKey) return null;
  const langKey = normalizePlateLang(targetLang);
  const supportKey = typeof appLanguage === "string" ? appLanguage.trim().toLowerCase() : "en";
  const cached = user?.dailyPlateHeadline?.[langKey];
  if (
    cached &&
    cached.dayKey === dayKey &&
    cached.appLanguage === supportKey &&
    typeof cached.text === "string" &&
    cached.text.trim()
  ) {
    return cached.text.trim();
  }
  return null;
}

/**
 * Helper to determine lesson status from user progress (pure).
 */
function isLessonCompleted(progress) {
  return Boolean(progress?.completed || progress?.isCompleted);
}

/**
 * Find the next available or in-progress lesson from a list of units.
 */
export function findNextLessonFromUnits(units = [], userProgress = {}, targetLang = "es") {
  const languageLessons =
    userProgress?.languageLessons?.[targetLang] || userProgress?.lessons || {};

  for (const unit of units) {
    if (!unit?.lessons || !Array.isArray(unit.lessons)) continue;
    for (const lesson of unit.lessons) {
      const p = languageLessons[lesson.id];
      if (!isLessonCompleted(p)) {
        return { lesson, unit };
      }
    }
  }
  return null;
}

/**
 * Extract active task material, topics, and progress for non-repair, non-goal
 * courses on today's plate.
 */
export function getPlateTaskSummary(courses = [], user = {}, targetLang = "es", levelUnits = []) {
  const langKey = normalizePlateLang(targetLang);

  // Exclude repair and goal — the companion pet handles those
  const actionableCourses = courses.filter(
    (c) => c && c.kind && c.kind !== "repair" && c.kind !== "goal",
  );

  return actionableCourses.map((course) => {
    let topic = "";

    if (course.kind === "learn") {
      if (Array.isArray(levelUnits) && levelUnits.length > 0) {
        const next = findNextLessonFromUnits(levelUnits, user?.progress || {}, langKey);
        const titleVal = next?.lesson?.title || next?.unit?.title;
        topic = typeof titleVal === "object" ? titleVal?.en || Object.values(titleVal)[0] || "" : titleVal || "";
      }
      if (!topic) {
        topic = "Skill tree lesson";
      }
    } else if (course.kind === "speak") {
      topic = "Tutor conversation practice";
    } else if (course.kind === "review") {
      topic = "Vocabulary flashcard review";
    } else if (course.kind === "conversation") {
      topic = "Interactive conversation";
    } else if (course.kind === "phonics") {
      topic = "Phonics and pronunciation practice";
    } else {
      topic = `${course.kind} practice`;
    }

    const count = Number(course.count) || 0;
    const target = Number(course.target) || 1;

    return {
      kind: course.kind,
      topic,
      count,
      target,
      progress: `${count}/${target}`,
      done: count >= target,
    };
  });
}

/**
 * Build the Gemini prompt to generate a single-sentence outcome.
 * Explicitly instructs the model in which language to write.
 */
export function buildPlateHeadlinePrompt({ targetLang, appLanguage = "en", taskSummary = [] }) {
  const targetName = resolveLanguageName(targetLang);
  const supportName = resolveLanguageName(appLanguage);

  const tasksFormatted = taskSummary
    .map((t) => `- ${t.kind}: ${t.topic} (${t.progress} completed)`)
    .join("\n");

  return [
    `You are generating the single-sentence subtitle for "Today's Focus" in a language learning app.`,
    `Course: Learning ${targetName}.`,
    `OUTPUT LANGUAGE REQUIREMENT: You MUST write the sentence strictly in ${supportName}.`,
    ``,
    `Today's scheduled learning tasks:`,
    tasksFormatted || `- General lesson practice`,
    ``,
    `Write ONE crisp, inspiring sentence (maximum 12 words) in ${supportName} stating the real-world communication skill, moment, or capability we will cover today.`,
    `CRITICAL RULES:`,
    `- The entire sentence MUST be written in ${supportName}.`,
    `- Do NOT write in ${targetName} unless ${supportName} is ${targetName}.`,
    `- Do NOT mention XP, points, levels, tasks, exercises, or homework.`,
    `- Do NOT mention repairs, mistakes, or errors.`,
    `- Frame it as a human outcome (e.g. "Handle your first café order, including a follow-up question" or "Ask about someone's weekend plans with confidence").`,
    `- Return ONLY the plain sentence in ${supportName}, without quotes or markdown.`,
  ].join("\n");
}

/**
 * Persist headline to Firestore lazily so non-browser environments/tests don't fail.
 */
async function persistHeadlineDoc(npub, langKey, payload) {
  if (!npub) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const { database } = await import("../firebaseResources/firebaseResources.js");
    if (database) {
      await setDoc(
        doc(database, "users", npub),
        { dailyPlateHeadline: { [langKey]: payload } },
        { merge: true },
      );
    }
  } catch (fsError) {
    console.warn("Failed to persist plate headline to Firestore:", fsError);
  }
}

/**
 * Helper to clean markdown fences, line breaks, and quotation marks from headline text.
 */
export function cleanHeadlineText(raw) {
  let text = String(raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json|text)?\s*/i, "").replace(/```$/, "").trim();
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  text = lines[0] || "";
  text = text.replace(/^["'“‘]+|["'”’]+$/g, "").trim();
  return text;
}

/**
 * Prompt Gemini once for the day's headline, then overwrite the language entry
 * in the local user store and Firestore. Supports streaming tokens via onStream.
 */
export async function generateAndStorePlateHeadline({
  npub,
  targetLang = "es",
  appLanguage = "en",
  dayKey,
  taskSummary = [],
  callLlm,
  onStream,
}) {
  if (!dayKey) return null;
  const langKey = normalizePlateLang(targetLang);
  const supportKey = typeof appLanguage === "string" ? appLanguage.trim().toLowerCase() : "en";

  const prompt = buildPlateHeadlinePrompt({
    targetLang,
    appLanguage: supportKey,
    taskSummary,
  });

  try {
    let runner = callLlm;
    if (!runner) {
      const llmModule = await import("./llm.js");
      runner = llmModule.callResponses;
    }

    const raw = await runner({
      input: prompt,
      onChunk: (accumulated) => {
        const cleaned = cleanHeadlineText(accumulated);
        if (cleaned) {
          onStream?.(cleaned);
        }
      },
    });
    let text = cleanHeadlineText(raw);

    if (!text) return null;

    const payload = { dayKey, appLanguage: supportKey, text };

    // 1. Overwrite in local Zustand store for instant UI update
    try {
      const store = useUserStore.getState?.();
      const current = store?.user?.dailyPlateHeadline || {};
      store?.patchUser?.({
        dailyPlateHeadline: {
          ...current,
          [langKey]: payload,
        },
      });
    } catch (storeError) {
      console.warn("Failed to patch local user store for plate headline:", storeError);
    }

    // 2. Overwrite in Firestore (no history kept)
    await persistHeadlineDoc(npub, langKey, payload);

    return text;
  } catch (error) {
    console.warn("generateAndStorePlateHeadline failed:", error);
    return null;
  }
}
