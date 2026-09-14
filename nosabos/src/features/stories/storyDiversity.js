import { buildCurriculumPromptContext } from "../../utils/lessonCurriculum.js";
import { getReadingQualityIssues } from "../../utils/readingGeneration.js";

const memory = new Map();
const keyFor = ({ npub = "guest", targetLang = "" }) => `nosabos_story_history_v1:${npub || "guest"}:${targetLang}`;
const directions = [
  "Work out who or what a message, item, or piece of information is intended for.",
  "Resolve a mistaken assumption about something happening now through concrete clues.",
  "Arrange a plan when one useful piece of information is missing.",
  "Coordinate a small task by deciding who does what and why.",
  "Choose which person, thing, or option fits a concrete everyday need.",
  "Adjust a plan when someone's availability or an important detail changes.",
  "Settle two different preferences by considering their practical consequences.",
  "Recall a specific experience to help make a decision in the present.",
].map((guidance, index) => ({ id: `purpose-${index}`, guidance }));

function readHistory(options) {
  const key = keyFor(options);
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    const entries = raw ? JSON.parse(raw) : memory.get(key) || [];
    return Array.isArray(entries) ? entries.filter((entry) => entry && typeof entry.targetText === "string") : [];
  } catch { return memory.get(key) || []; }
}

export function getStoryHistory(options) {
  const all = readHistory(options);
  const sameLesson = all.filter((entry) => entry.lessonId === options.lessonId).slice(0, 8);
  return [...new Set([...all.slice(0, 8), ...sameLesson])];
}

function pick(options, entries, field) {
  if (!options.length) return null;
  const unused = options.filter((option) => !entries.some((entry) => entry[field] === option.id));
  if (unused.length) return unused[Math.floor(Math.random() * unused.length)];
  return options.reduce((oldest, option) => entries.findIndex((entry) => entry[field] === option.id) >
    entries.findIndex((entry) => entry[field] === oldest.id) ? option : oldest, options[0]);
}

export function createStoryPlan({ lessonContent, lessonId, npub, targetLang, mode }) {
  const identity = { lessonId: lessonContent?.curriculumContext?.lessonId || lessonId || lessonContent?.id || lessonContent?.topic || "free", npub, targetLang };
  const recentEntries = getStoryHistory(identity);
  const subject = pick(lessonContent?.storySubjects || [], recentEntries.filter((entry) => entry.lessonId === identity.lessonId), "subject");
  const purpose = pick(directions, recentEntries, "purpose");
  const objective = [
    buildCurriculumPromptContext(lessonContent?.curriculumContext, { mode: "stories", includeExamples: false }),
    lessonContent?.storyScope?.objective || lessonContent?.prompt || lessonContent?.scenario || lessonContent?.topic,
  ].filter(Boolean).join("\n");
  return { ...identity, mode, subject, purpose, recentEntries, objective, isTutorial: lessonContent?.topic === "tutorial" };
}

export function buildStoryDiversityPrompt(plan) {
  if (plan.isTutorial) return "";
  return `CREATIVE SCOPE AND RECENT HISTORY:
The required skills, meanings, and target-language forms remain authoritative. A setting, object, relative, or sample sentence mentioned in a brief is an illustration unless understanding that particular thing is the learning objective. Do not turn an illustrative family visit, market exchange, or classroom into the only possible story.
Keep the learning objective central to what the characters need to understand and decide. For a family lesson, identifying who is related to whom should matter to the interaction; merely mentioning a relative before switching to an unrelated hobby or task is insufficient. Apply this same principle to every lesson. Use the creative direction only insofar as it supports the skill.
${plan.subject ? `Selected central subject: ${plan.subject.name}. ${plan.subject.guidance}` : "Choose a fresh central subject within this lesson's scope."}
For this episode, build a concrete scene around this communication need: ${plan.purpose.guidance} Adapt the details to the skill, level, and mode; invent the plot rather than following a fixed sequence. The characters must actually use the lesson language to address this need.
Invent new concrete circumstances, opening syntax, conversational progression, and ending. Vary which roster characters participate and what they want. Do not always begin with a greeting, invitation, surprised observation, or statement of today's plans. Characters need a reason to use the target language. No obligatory surprise visit, happy resolution, or moral.
The recent activities below include Practice, Call, and Story together. A different mode or cast does not make a reused scene new. Do not reuse their central premise or opening sentence with changed names or a greeting added. Required target vocabulary and grammar may recur naturally.
Recent activity topics and directions (comparison data, not dialogue to imitate): ${JSON.stringify(plan.recentEntries.map((entry) => ({ title: entry.title, mode: entry.mode, subject: entry.subject, purpose: entry.purpose })))}`;
}

export function getStoryNoveltyIssues(candidate, plan) {
  if (plan.isTutorial) return [];
  const openings = (text) => (String(text).match(/[^.!?。！？\n]+/gu) || []).slice(0, 2)
    .map((line) => line.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim())
    .filter((line) => line.split(" ").length >= 5);
  if (plan.recentEntries.some((entry) => openings(entry.targetText).some((line) => openings(candidate.target).includes(line)))) {
    return ["repeated_opening: The opening repeats a recent activity, even if a greeting was added. Start with a different concrete moment and sentence."];
  }
  return getReadingQualityIssues(candidate, { recentEntries: plan.recentEntries, targetLang: plan.targetLang })
    .filter((issue) => /^(missing_content|repeated_passage|repeated_sentence):/.test(issue));
}

export function recordStoryHistory(plan, candidate) {
  if (plan.isTutorial || !candidate?.target?.trim()) return;
  const key = keyFor(plan);
  const entries = [{ lessonId: plan.lessonId, mode: plan.mode, title: candidate.title,
    targetText: candidate.target.slice(0, 6000), subject: plan.subject?.id || "", purpose: plan.purpose?.id || "",
  }, ...readHistory(plan)].slice(0, 40);
  memory.set(key, entries);
  try { if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(entries)); } catch { /* memory fallback */ }
}

export const storySessionCandidate = (session) => ({ title: session.title,
  target: session.segments.flatMap((segment) => segment.turns.map((turn) => turn.target)).join("\n") });

export async function reviewStoryCandidate(candidate, plan, review) {
  if (plan.isTutorial || !review) return [];
  return review({ candidate, objective: plan.objective, selection: { subject: plan.subject, purpose: plan.purpose },
    recentEntries: plan.recentEntries, mode: plan.mode, targetLang: plan.targetLang });
}
