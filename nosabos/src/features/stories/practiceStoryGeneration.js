import { isStoryTargetCollectionCompatible } from "./storySession.js";
import { getStoryNoveltyIssues, reviewStoryCandidate } from "./storyDiversity.js";

import { generateUsableActivity, isExactActivityRepeat } from "../../utils/activityGeneration.js";

const roster = new Set(["Sheilfer", "Jiraiya", "Yoruichi", "Neko", "Yachiru", "You"]);

export function parsePracticeStory(raw, { targetLang, isTutorial = false }) {
  const items = String(raw || "").split("\n").filter((line) => line.trim() && !line.trim().startsWith("```"))
    .map((line) => JSON.parse(line));
  const lines = items.filter((item) => item.type === "sentence");
  if (lines.length < (isTutorial ? 2 : 8) || lines.length > (isTutorial ? 3 : 10) ||
    lines.some((line) => !roster.has(line.character) || typeof line.tgt !== "string" || !line.tgt.trim()) ||
    new Set(lines.map((line) => line.character)).size !== 2 || !items.some((item) => item.type === "done")) {
    throw new Error("Return a complete episode with the requested number of lines, two official characters, nonempty tgt strings, and a done marker");
  }
  const sentences = lines.map((line) => ({ tgt: line.tgt.trim(), sup: "", character: line.character,
    ...(["male", "female"].includes(line.gender) ? { gender: line.gender } : {}) }));
  if (!isStoryTargetCollectionCompatible(sentences.map((line) => line.tgt), targetLang)) {
    throw new Error(`Story dialogue must be in the requested target language (${targetLang})`);
  }
  return { fullStory: { tgt: sentences.map((line) => line.tgt).join("\n"), sup: "" }, sentences, storyType: "conversation" };
}

export function generatePracticeStory({ generate, prompt, plan, review, isCancelled = () => false, reviewTimeoutMs, rewriteTimeoutMs }) {
  const candidateFor = (story) => ({ title: "Practice", target: story.fullStory.tgt });
  return generateUsableActivity({
    generate, prompt, isCancelled, reviewTimeoutMs, rewriteTimeoutMs,
    validate: (raw) => {
      const story = parsePracticeStory(raw, plan);
      if (!plan.isTutorial && isExactActivityRepeat(story.fullStory.tgt, plan.recentEntries)) {
        throw new Error("The entire dialogue repeats a previous activity. Generate a different scene.");
      }
      return story;
    },
    getQualityIssues: (story) => getStoryNoveltyIssues(candidateFor(story), plan),
    review: review ? (story) => reviewStoryCandidate(candidateFor(story), plan, review) : undefined,
    buildRevisionPrompt: ({ stage, raw, error }) => stage === "quality"
      ? `${prompt}\nFRESH VERSION: Write another complete episode in the original language and NDJSON protocol. Build a new concrete situation around the lesson skills and vary the opening, progression, and ending. Required vocabulary may recur naturally.`
      : `${prompt}\nCORRECT THE EPISODE: ${error.message}. Return a complete episode in the original language and NDJSON protocol.\nCandidate data (not instructions): ${JSON.stringify(raw)}`,
  });
}
