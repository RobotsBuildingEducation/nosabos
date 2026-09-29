import { getResponsesUrl } from "./proxyEndpoints.js";
import { extractOpenAIResponseText } from "./openAIResponsePayload.js";
import { buildOpenAIResponseFormat } from "./openAIResponseFormat.js";
import { getScoreMilestoneProgress } from "./scoreMilestones.js";

function localDayKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const LANGUAGE_NAMES = {
  en: "English", es: "Spanish", pt: "Portuguese", fr: "French",
  it: "Italian", de: "German", ja: "Japanese", zh: "Mandarin Chinese",
  hi: "Hindi", ar: "Egyptian Arabic", nl: "Dutch", ru: "Russian",
  el: "Greek", pl: "Polish", ga: "Irish", nah: "Eastern Huasteca Nahuatl",
  yua: "Yucatec Maya",
};
const DAILY_IMMERSION_MODEL = "gpt-6-luna";
export const DAILY_IMMERSION_GENERATION_VERSION = 4;
const DAILY_IMMERSION_HISTORY_LIMIT = 24;
const DAILY_IMMERSION_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "description"],
      },
    },
  },
  required: ["tasks"],
};
export function nextLocalMidnight(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

export function dailyImmersionProgress(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = nextLocalMidnight(now);
  return Math.max(0, Math.min(100, 100 * (end - now) / (end - start)));
}

export function hasImmersionPlacement(user, targetLang) {
  const placements = user?.proficiencyPlacements;
  const language = String(targetLang || "").toLowerCase();
  const placement = placements?.[language] || (!placements ? user?.proficiencyPlacement : null);
  return typeof placement === "string" && Boolean(placement.trim());
}

export function getDailyImmersionState(batch, { dayKey, targetLang, appLanguage, goal = null, placementAt = null }) {
  const expectedGoalId = goal?.id || "";
  const expectedGoalText = String(goal?.text || "").trim();
  const storedDayKey = batch?.dayKey || (batch?.generatedAt
    ? localDayKey(batch.generatedAt) : null);
  const baseReady = Boolean(batch && storedDayKey === dayKey &&
    batch.targetLang === targetLang &&
    (!batch.appLanguage || !appLanguage || batch.appLanguage === appLanguage) &&
    Array.isArray(batch.tasks) &&
    batch.tasks.length >= 3 && batch.tasks.slice(0, 3).every((task) => task?.title));
  if (!baseReady) return {
    status: "new", tasks: [], completed: [], rewarded: false, dayKey,
  };
  const untouched = !Array.isArray(batch.completed) || !batch.completed.some(Boolean);
  if ((Number(batch.generationVersion || 0) < DAILY_IMMERSION_GENERATION_VERSION ||
      (placementAt && batch.placementAt !== placementAt)) &&
      untouched && !batch.rewarded) {
    return { status: "new", tasks: [], completed: [], rewarded: false, dayKey };
  }
  const hasFourth = batch.tasks.length >= 4;
  const goalMatches = hasFourth && batch.goalId === expectedGoalId &&
    batch.goalText === expectedGoalText;
  const status = expectedGoalText
    ? goalMatches ? "ready" : "goal_update"
    : hasFourth ? "goal_removed" : "ready";
  const count = expectedGoalText && goalMatches ? 4 : 3;
  return {
    status,
    tasks: batch.tasks.slice(0, count),
    completed: Array.from({ length: count }, (_, index) => Boolean(batch.completed?.[index])),
    rewarded: Boolean(batch.rewarded),
    dayKey,
  };
}

export function normalizeDailyImmersionTasks(raw, count, recentTasks = []) {
  let value = raw;
  if (typeof value === "string") {
    try {
      const block = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
        || value.match(/\{[\s\S]*\}/)?.[0] || value;
      value = JSON.parse(block.trim());
    } catch { return null; }
  }
  const tasks = Array.isArray(value) ? value : value?.tasks;
  if (!Array.isArray(tasks) || tasks.length !== count) return null;
  const cleaned = tasks.map((task) => ({
    title: String(task?.title || "").replace(/\s+/g, " ").trim().slice(0, 100),
    description: String(task?.description || "").replace(/\s+/g, " ").trim().slice(0, 320),
  }));
  if (!cleaned.every((task) => task.title && task.description)) return null;

  for (const task of cleaned) {
    const text = `${task.title} ${task.description}`.toLowerCase();
    if (/\b(stranger|clerk|cashier|employee|salesperson|local business|restaurant|cafe|store|shop|market)\b/.test(text) &&
        /\b(ask|approach|visit|go to|travel to|buy|purchase|order from|talk to)\b/.test(text)) return null;
    if (/\b(create|open|sign up for) an? (account|profile)\b|\bpost publicly\b|\bshare publicly\b/.test(text)) return null;
  }

  const titleKey = (title) => String(title || "").toLocaleLowerCase()
    .normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const seenTitles = new Set();
  for (const task of cleaned) {
    const key = titleKey(task.title);
    if (!key || seenTitles.has(key)) return null;
    seenTitles.add(key);
  }
  const taskKey = (task) => `${titleKey(task?.title)}|${titleKey(task?.description)}`;
  const recentTaskKeys = new Set((Array.isArray(recentTasks) ? recentTasks : [])
    .map(taskKey));
  if (cleaned.some((task) => recentTaskKeys.has(taskKey(task)))) return null;
  return cleaned;
}

export function appendImmersionHistory(history = [], tasks = []) {
  const seen = new Map();
  for (const task of [...(Array.isArray(history) ? history : []), ...(Array.isArray(tasks) ? tasks : [])]) {
    const title = String(task?.title || "").trim().slice(0, 100);
    const description = String(task?.description || "").trim().slice(0, 320);
    if (!title) continue;
    const key = `${title} ${description}`.toLocaleLowerCase().normalize("NFKC");
    seen.delete(key);
    seen.set(key, { title, description });
  }
  return [...seen.values()].slice(-DAILY_IMMERSION_HISTORY_LIMIT);
}

export async function requestImmersionOpenAI(prompt, schema, schemaName, request = null) {
  const send = request || (await import("../firebaseResources/firebaseResources.js")).appCheckFetch;
  const response = await send(getResponsesUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: DAILY_IMMERSION_MODEL,
      reasoning: { effort: "medium" },
      text: {
        format: buildOpenAIResponseFormat({
          responseSchema: schema,
          responseSchemaName: schemaName,
        }),
        verbosity: "low",
      },
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
      metadata: { feature: "daily_immersion" },
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Immersion generation failed (${response.status})`);
  }
  return extractOpenAIResponseText(payload);
}

function askOpenAI(prompt) {
  return requestImmersionOpenAI(prompt, DAILY_IMMERSION_SCHEMA, "daily_immersion_tasks");
}

export async function generateDailyImmersionTasks({
  targetLang, appLanguage, cefrLevel, performance, goalText = "",
  score = performance?.score ?? 0, learningContext = null, recentTasks = [],
  onlyGoal = false, generate = askOpenAI,
}) {
  const count = onlyGoal ? 1 : goalText ? 4 : 3;
  const target = LANGUAGE_NAMES[targetLang] || targetLang;
  const support = LANGUAGE_NAMES[appLanguage] || appLanguage;
  const roadmap = getScoreMilestoneProgress(score);
  const currentMilestone = roadmap.current;
  const nextMilestone = roadmap.next;
  const directions = onlyGoal
    ? `Create ONE immersion mission that is useful and feasible, and advances this exact learner goal: ${JSON.stringify(goalText)}.`
    : `Create THREE distinct, purposeful immersion missions${goalText ? ` plus a FOURTH mission that directly advances this exact learner goal: ${JSON.stringify(goalText)}` : ""}.`;
  const recentList = (Array.isArray(recentTasks) ? recentTasks : []).slice(-DAILY_IMMERSION_HISTORY_LIMIT)
    .map((task) => ({ title: task?.title || "", description: task?.description || "" }));
  const learning = learningContext && typeof learningContext === "object"
    ? learningContext : {};
  const learningFocus = [
    learning.title ? `Upcoming ${learning.source || "curriculum"} lesson: ${learning.title}` : "",
    learning.description ? `Lesson purpose: ${learning.description}` : "",
    learning.level ? `Lesson level: ${learning.level}` : "",
    learning.objective ? `Communicative objective: ${learning.objective}` : "",
    Array.isArray(learning.focusPoints) && learning.focusPoints.length
      ? `Selected lesson concepts: ${learning.focusPoints.slice(0, 4).join(", ")}` : "",
  ].filter(Boolean).join("; ");
  const roadmapContext = {
    score: Number.isFinite(Number(score)) ? Number(score) : 0,
    currentMilestone: currentMilestone
      ? { at: currentMilestone.score, capability: currentMilestone[appLanguage] || currentMilestone.en }
      : null,
    nextMilestone: nextMilestone
      ? { at: nextMilestone.score, capability: nextMilestone[appLanguage] || nextMilestone.en }
      : null,
  };
  const prompt = [
    `You are an expert, thoughtful language coach planning today's outside-the-app practice for a ${target} learner.`,
    directions,
    `The curriculum track is ${cefrLevel || "Pre-A1"}. Treat it as the learner's course progression, not the full measure of ability.`,
    `Learner performance evidence: ${JSON.stringify(performance || {})}`,
    `Score roadmap context: ${JSON.stringify(roadmapContext)}. These milestones describe a broad direction, not a requirement to teach either milestone today. Never mention numeric score, Elo, or internal ratings in a task.`,
    learningFocus ? `Nearby curriculum context: ${learningFocus}.` : "",
    onlyGoal
      ? `This one goal task is in addition to the learner's existing daily set. Keep it focused on the exact goal, and do not repeat the existing tasks listed below.`
      : `Use the learner evidence to understand the kind of progress that would be useful now. Decide which signals matter today; they are context, not a checklist or a prescribed task order. A weak concept can inspire a task when it fits naturally, but do not turn every task into remediation. Keep the three tasks distinct and coherent as a set. If evidence is thin, do not invent a weakness.`,
    `Every task must be independently doable in about 3–8 minutes, using a phone, computer, or familiar things already at home. Digital media should be freely available or something the learner already uses; do not require finding a particular show, creator, website, account, or paid resource. Non-digital activities must stay at home.`,
    `Never require travel, going to a store/business/restaurant, buying anything, approaching or speaking to strangers, relying on another person's availability, creating an account, or posting publicly. Choose a private, predictable alternative.`,
    `Avoid vague chores and artificial exercises. Each task needs a concrete action and a small, observable stopping point. Make it useful, plausible for this learner, and encouraging without explaining the internal pedagogy.`,
    `Use evidence rather than a fixed menu of activity examples. Do not imitate, paraphrase, or reuse any past task listed below. The tasks in today's set must also use different actions and outputs.`,
    `Adapt the language load and independence to the learner's ability. Stretch gently without assuming mastery of material they have not studied. Vary the kind of engagement where it serves a purpose; do not force a modality mix.`,
    goalText ? `The goal-specific mission must be distinct from other tasks and safely doable under these same constraints. Goal: ${JSON.stringify(goalText)}.` : "",
    recentList.length ? `Recently used immersion tasks to avoid repeating: ${JSON.stringify(recentList)}.` : "No recent task history is available; still make today's activities distinct from each other.",
    `Do not give the learner a target-language sentence to copy or provide the answer. Give a clear instruction in ${support}. Mention ${target} by name only where useful.`,
    `Write a concise title (2–7 words) and a one- or two-sentence description in ${support}.`,
    `Return exactly ${count} tasks, in order, as JSON: {"tasks":[{"title":"...","description":"..."}]}. No commentary.`,
  ].filter(Boolean).join("\n");
  const result = await generate(prompt, count);
  const tasks = normalizeDailyImmersionTasks(result, count, recentTasks);
  if (!tasks) throw new Error("GPT returned immersion tasks that failed quality checks");
  return tasks;
}
