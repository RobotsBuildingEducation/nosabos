// Quality checks run on the original model output, before UI sanitizers can
// erase speaker labels or collapse a script into apparently continuous prose.
import { stripMetaNarratorPreamble } from "./readingHistoryStore.js";
import { generateUsableActivity, isExactActivityRepeat } from "./activityGeneration.js";

export const READING_WRITER_INSTRUCTION = "You write natural, engaging reading passages for language learners. Write cohesive, realistic prose (a minimum of 100 words, scaling up to 300 words based on learner proficiency level) that brings the lesson's topics, everyday situations, and vocabulary to life. Use clear, level-appropriate prose that is interesting and informative to read. Present the text as continuous single-author reading prose (no dialogue scripts or character speaker labels). Follow the requested language, level, and output protocol exactly.";

const normalize = (text) => String(text || "").normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

function words(text, language) {
  try {
    return [...new Intl.Segmenter(language || undefined, { granularity: "word" }).segment(normalize(text))]
      .filter((part) => part.isWordLike).map((part) => part.segment);
  } catch {
    return normalize(text).split(/\s+/).filter(Boolean);
  }
}

function sentences(text) {
  return String(text || "").match(/[^.!?。！？\n]+[.!?。！？]*/gu)?.map((s) => s.trim()).filter(Boolean) || [];
}

function isReactionLedSentence(part) {
  return /^(?:oh\b|ah\b|wow\b|yay\b|hooray\b|really\b|look\b|how\s+(?:nice|lovely|wonderful|exciting|great)|what\s+(?:a|an)\b|ay\b|vaya\b|guau\b|qué\s+(?:bien|bonito|bueno|maravilla)|waouh\b|super\b|comme\s+c'est|che\s+bello|que\s+(?:bom|legal)|wie\s+(?:schön|toll)|わあ|すごい|哇)/iu.test(part.replace(/^[¡¿\s]+/u, ""));
}

function reactionStructure(parts) {
  const flags = parts.map(isReactionLedSentence);
  if (flags.filter(Boolean).length < 2) return "";
  // Ignore how many neutral sentences were added between the same reaction
  // beats. Padding the same observation/reaction/observation/praise structure
  // still produces the formula the learner has already seen.
  return flags.map((flag) => flag ? "R" : "C").join("").replace(/C+/g, "C");
}

function shingles(tokens, size = 5) {
  return new Set(Array.from({ length: Math.max(0, tokens.length - size + 1) },
    (_, index) => tokens.slice(index, index + size).join(" ")));
}

function sameSentenceSkeleton(current, previous, language) {
  const starts = (items) => items.map((sentence) => {
    const tokens = words(sentence, language);
    return tokens.length >= 2 ? tokens.slice(0, 2).join(" ") : "";
  });
  const a = starts(current);
  const b = starts(previous);
  const shared = a.filter((start, index) => start && start === b[index]);
  // Several distinct openings in the same order catch noun-swapped templates,
  // without treating practice of a single necessary grammar form as a failure.
  return shared.length >= 3 && new Set(shared).size >= 2 &&
    shared.length / Math.max(a.length, b.length) >= 0.6;
}

export function getReadingQualityIssues(candidate, {
  recentEntries = [], targetLang = "", formatSelection = null, isTutorial = false,
} = {}) {
  if (!candidate || typeof candidate.title !== "string" || !candidate.title.trim() ||
      typeof candidate.target !== "string" || !candidate.target.trim()) {
    return ["missing_content: Return a nonempty title and complete passage in the requested schema."];
  }
  if (isTutorial) return []; // The welcome is intentionally fixed across retries.
  const text = candidate.target;
  const parts = sentences(text);
  const tokens = words(text, targetLang);
  const issues = [];
  const speechReports = text.match(/\b(?:say|says|said|tell|tells|told|reply|replies|replied|answer|answers|answered|ask|asks|asked|dice|dijo|responde|respondió|pregunta|preguntó)\b/giu) || [];
  const directQuotes = text.match(/["“«][^"”»\n]+["”»]/gu) || [];
  const invertedSpeech = /,\s*(?:(?:I|he|she|we|they)\s+)?(?:say|says|said|tell|tells|told|reply|replies|replied|answer|answers|answered)\b/iu.test(text);
  // Reported-speech lessons may legitimately summarize what people said. Only
  // reject a reconstructed exchange, not two indirect reports in prose.
  if (speechReports.length >= 2 && (directQuotes.length >= 2 || invertedSpeech)) {
    issues.push("reported_dialogue: Do not reconstruct an exchange through says, replies, or quoted remarks. Write the actual single author's note, description, or reflection instead.");
  }
  if (stripMetaNarratorPreamble(text) !== text.trim()) {
    issues.push("meta_preamble: Start directly with the authentic passage, without announcing a reading, story, or conversation.");
  }
  const labels = [...text.matchAll(/(?:^|\n|[.!?。！？]\s+)([\p{L}\p{N}_][\p{L}\p{N}_ ]{0,24}):\s+/gu)].map((match) => match[1].trim());
  const speakerLabels = labels.filter((label) => !/^(notice|hours|schedule|warning|attention|bulletin|aviso|horario|note|tip|ingredients|opening hours|opening times|price|time|date|location)$/i.test(label));
  const isRequiredDocument = formatSelection?.format?.id?.startsWith("document:");
  if ((!isRequiredDocument && new Set(speakerLabels).size >= 2) || speakerLabels.some((label) => /^(?:[A-Z]|speaker\s*\d+|person\s*\d+)$/i.test(label)) ||
      (text.match(/(?:^|\n)\s*[—–-]\s*\S/gu) || []).length >= 2) {
    issues.push("script: Rewrite as one author's connected prose. Removing speaker names from the same exchange is not a repair.");
  }
  const reactions = parts.filter((part) => /[!?！？]$/.test(part));
  // Punctuation alone misses the same formula written with periods. Detect
  // reaction-led sentences as well, while allowing isolated target expressions
  // grounded in the surrounding prose.
  const reactionLed = parts.map(isReactionLedSentence);
  const adjacentReactions = reactionLed.some((reactive, index) => reactive && reactionLed[index + 1]);
  const informational = ["practical_notice", "everyday_guide", "object_label", "news_brief"].includes(formatSelection?.format?.id);
  if ((parts.length >= 3 && reactions.length >= 3 && reactions.length / parts.length >= 0.75) ||
      (informational && reactions.length >= 2 && reactions.length / parts.length >= 0.6) ||
      adjacentReactions || reactionLed.filter(Boolean).length > parts.length / 2) {
    issues.push("reaction_chain: Rebuild the passage around concrete information. At least half the sentences must provide non-reaction context, and place meaningful context between short reactions. Changing exclamation marks to periods does not fix a reaction chain.");
  }
  const substantial = parts.map(normalize).filter((part) => words(part, targetLang).length >= 5);
  if (new Set(substantial).size < substantial.length) {
    issues.push("repeated_sentence: Remove repeated sentences and add meaningful new information instead.");
  }
  const grams = shingles(tokens);
  for (const entry of recentEntries) {
    const previous = entry.targetText || entry.snippet || "";
    if (!previous) continue;
    const oldTokens = words(previous, targetLang);
    const oldGrams = shingles(oldTokens);
    const shared = [...grams].filter((gram) => oldGrams.has(gram)).length;
    const overlap = (2 * shared) / Math.max(1, grams.size + oldGrams.size);
    const sameText = normalize(previous) === normalize(text);
    if (reactionStructure(parts) && reactionStructure(parts) === reactionStructure(sentences(previous))) {
      issues.push("repeated_reaction_structure: The passage repeats the same sequence of context and reaction beats as a recent reading. Rebuild its organization and ending. Express the lesson's meanings within connected prose; do not reuse the same observation-reaction-observation-praise pattern with new objects or extra context sentences.");
      break;
    }
    if (sameText || (shared >= 4 && overlap >= 0.45) ||
        sameSentenceSkeleton(parts, sentences(previous), targetLang)) {
      issues.push(`repeated_passage: Too similar in wording or sentence skeleton to ${JSON.stringify(entry.title || "a recent reading")}. Keep the lesson's needed vocabulary but change the purpose, syntax, information order, and ending.`);
      break;
    }
  }
  return issues;
}

export class ReadingQualityError extends Error {
  constructor(issues) {
    super("Unable to generate a complete reading in the requested format. Please try again.");
    this.name = "ReadingQualityError";
    this.issues = issues;
  }
}

export function generateReadingWithQuality({ generate, prompt, review, maxAttempts = 3, reviewTimeoutMs, rewriteTimeoutMs, isCancelled, ...qualityOptions }) {
  return generateUsableActivity({
    generate, prompt, maxAttempts, reviewTimeoutMs, rewriteTimeoutMs, isCancelled,
    validate: (candidate) => {
      const blocking = getReadingQualityIssues(candidate, qualityOptions)
        .filter((issue) => /^(missing_content|script|reported_dialogue):/.test(issue));
      if (!qualityOptions.isTutorial && isExactActivityRepeat(candidate?.target, qualityOptions.recentEntries)) {
        blocking.push("duplicate_passage: Generate different content; this entire passage has already been shown.");
      }
      if (blocking.length) throw new ReadingQualityError(blocking);
      return candidate;
    },
    getQualityIssues: (candidate) => getReadingQualityIssues(candidate, qualityOptions),
    review: qualityOptions.isTutorial ? undefined : review,
    buildRevisionPrompt: ({ stage, error }) => [
      prompt,
      stage === "validation" ? `\nCORRECT THE READING FORMAT: ${error.issues.join("; ")}` : "\nFRESH VERSION: Improve the variety of this reading while keeping its lesson objective.",
      "Start from a blank page. Give the chosen genre a different concrete purpose, opening, information order, and ending. Keep required lesson expressions in natural context; avoid a chain of stock reactions. Do not paraphrase a previous passage or demonstrate every target form in every sentence. Keep the complete original output protocol, including takeaways and a separate comprehension question.",
    ].join("\n"),
  });
}

export async function collectReadingStream(stream, textFromChunk, onItem) {
  let buffer = "";
  let title = "";
  const targets = [];
  const takeaways = [];
  let reviewQuestion = null;
  const consume = (line) => {
    let item;
    try { item = JSON.parse(line.trim()); } catch { return; }
    if (!item || typeof item !== "object") return;
    if (item.type === "review_question") {
      reviewQuestion = item;
      onItem?.(item);
      return;
    }
    if (typeof item.text !== "string") return;
    if (item.type === "title" && !title) {
      title = item.text.trim();
      onItem?.(item);
    }
    if (item.type === "target") {
      targets.push(item.text.trim());
      onItem?.(item);
    }
    if (item.type === "takeaway" && takeaways.length < 3) {
      takeaways.push(item.text.trim());
      onItem?.(item);
    }
  };
  for await (const chunk of stream) {
    buffer += textFromChunk(chunk) || "";
    let newline;
    while ((newline = buffer.indexOf("\n")) !== -1) {
      consume(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
    }
  }
  if (buffer.trim()) consume(buffer);
  return { title, target: targets.join("\n"), takeaways, reviewQuestion };
}
