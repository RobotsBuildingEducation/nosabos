import { normalizeCEFRLevel } from "../../utils/cefrUtils.js";

export const STORY_THINKING_BUDGET = 0;

export function getStoryDifficulty(cefrLevel) {
  const level = normalizeCEFRLevel(cefrLevel, "Pre-A1");
  return `Aim for CEFR ${level} accessibility. Keep most language familiar and make new expressions understandable through context and faithful support translations. Adapt the wording, not the richness of the experience: beginners can enjoy interesting situations, humor, emotion, and characters with their own intentions. Use natural spoken rhythm, including brief replies and occasional fuller lines when needed. No word-count quotas, vocabulary whitelist, required connectors, or grammar demonstrations in every turn.`;
}

export function buildStoryWritingBrief({ mode, isTutorial = false }) {
  if (isTutorial) {
    return "A tiny encounter: a greeting, a greeting back, and a goodbye. Only 2–3 lines, 2–5 words each, greetings only. No extra plot or vocabulary.";
  }
  return `Write as a storyteller and dialogue writer. Invent an original situation from this lesson's topic, scenario, and learning objectives. The lesson language should help the characters do something that matters to them; it should not sound like they are demonstrating a syllabus.
Choose the experience freely to suit the lesson: playful adventure, curiosity or mystery, a warm personal moment, awkwardness, disagreement, or an ordinary realistic situation can all work, alone or blended. Vary the premise, mood, stakes, and kind of ending across stories. Neither a joke, a twist, nor a sentimental lesson is compulsory.
Begin with a concrete situation already unfolding: someone wants something, and the other person has their own response. Let their interaction change the situation and reach a satisfying ending. Invent the events yourself from the lesson; a list of facts or routine topic questions is not a story. Let the characters want something, react to one another, and affect what happens next. A small everyday event can be compelling when its details and people feel specific. Keep the situation, knowledge, intentions, and sequence of events coherent across checkpoints.
Write what these people would actually say in this moment, with distinct voices, concrete details, initiative, and feeling. A turn may contain several spoken sentences when the moment needs them; do not strip away the details that make the exchange engaging. Let a reaction or choice reveal personality instead of announcing emotions. Avoid textbook question-and-answer drills, polite filler, repetitive praise, and summaries disguised as dialogue. Read the exchange for flow: each turn should respond to or develop what came before, and the ending should feel earned.
Spoken lines contain dialogue only, without a narrator, stage directions, or exercise instructions. Translate the meaning and tone faithfully without adding explanations.
${mode === "radio"
    ? "The host and caller are in separate places. Make the reason for the call clear and let the interaction develop on the call. The host only knows what the caller shares."
    : "Keep the same two speakers throughout the encounter. Other people may be mentioned without adding spoken roles."}`;
}

export function buildSpeakingStoryPrompt({ targetName, targetLang, supportName, supportLang, difficulty, isTutorial, scenarioDirective, curriculumContext }) {
  return [
    `Write a short character-led story script in ${targetName} (${targetLang}) for a language learner. Difficulty: ${isTutorial ? "absolute beginner, very easy" : difficulty}.`,
    `Provide a faithful support translation in ${supportName} (${supportLang}) for each spoken line.`,
    scenarioDirective,
    curriculumContext,
    buildStoryWritingBrief({ mode: "speaking", isTutorial }),
    "OUTPUT CONSTRAINTS:",
    "Choose exactly 2 characters from the official cast: Sheilfer, Jiraiya, Yoruichi, Neko, Yachiru, or You (the learner). Keep those same two speakers throughout.",
    isTutorial
      ? "Write 2–3 dialogue lines total, greetings only, 2–5 words per line."
      : "Write 8–10 dialogue lines total. Vary the length naturally, with enough substance for the scene to develop and reach a satisfying ending.",
    "No headings, commentary, code fences, narration, or stage directions.",
    "Output protocol: NDJSON, one compact JSON object per line.",
    `For each dialogue line: {"type":"sentence","character":"Sheilfer | Jiraiya | Yoruichi | Neko | Yachiru | You","gender":"male or female","tgt":"${targetName} spoken line","sup":"${supportName} translation"}`,
    'After the final line: {"type":"done"}',
    "The character field contains ONLY one official cast name. Do not include it in tgt. Keep the same gender for each character every time they speak.",
  ].filter(Boolean).join("\n");
}
