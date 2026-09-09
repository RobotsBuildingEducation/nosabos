import { buildStoryWritingBrief } from "./storyPrompts.js";

export const STORY_MODES = ["speaking", "radio", "conversation"];

export function chooseStoryMode(content, random = Math.random) {
  if (content?.topic === "tutorial") return "speaking";
  if (STORY_MODES.includes(content?.storyMode)) return content.storyMode;
  return STORY_MODES[Math.min(2, Math.floor(random() * 3))];
}

export function rotateStoryMode(currentMode, content, random = Math.random) {
  if (content?.topic === "tutorial") return "speaking";
  if (STORY_MODES.includes(content?.storyMode)) return content.storyMode;
  const otherModes = STORY_MODES.filter((m) => m !== currentMode);
  if (!otherModes.length) return chooseStoryMode(content, random);
  return otherModes[Math.min(otherModes.length - 1, Math.floor(random() * otherModes.length))];
}

const requiredText = (value) => typeof value === "string" && value.trim().length > 0;
const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, " ").trim();
const usesUnspacedWords = (value) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(value);
const TARGET_SCRIPT_PATTERNS = {
  ar: /\p{Script=Arabic}/u,
  el: /\p{Script=Greek}/u,
  hi: /\p{Script=Devanagari}/u,
  ja: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,
  ru: /\p{Script=Cyrillic}/u,
  zh: /\p{Script=Han}/u,
};
const phraseMatches = (a, b) => usesUnspacedWords(b)
  ? normalize(a).replaceAll(" ", "") === normalize(b).replaceAll(" ", "")
  : normalize(a) === normalize(b);

const readSessionJSON = (raw) => typeof raw === "string"
  ? JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""))
  : structuredClone(raw);

// The dialogue is the source of truth. Letting the model invent both tiles and
// their index order can omit words (or invent new ones) in an otherwise valid story.
export function buildStoryWordTiles(text, random = Math.random) {
  let words = text.trim().split(/\s+/u);
  if (words.length < 2 && usesUnspacedWords(text)) {
    words = [...new Intl.Segmenter(undefined, { granularity: "word" }).segment(text)]
      .map((part) => part.segment).filter((part) => part.trim());
  }
  words = words.map((word) => word.replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, "")).filter(Boolean);
  const width = Math.ceil(words.length / 6);
  const tiles = [];
  for (let i = 0; i < words.length; i += width) tiles.push(words.slice(i, i + width).join(" "));
  // Merge repeated/punctuation-only tiles with a neighbor to avoid ambiguous buttons.
  for (let i = 0; i < tiles.length && tiles.length > 1; i++) {
    if (!normalize(tiles[i]) || tiles.some((tile, j) => j < i && normalize(tile) === normalize(tiles[i]))) {
      const start = i === tiles.length - 1 ? i - 1 : i;
      tiles.splice(start, 2, tiles.slice(start, start + 2).join(" "));
      i = -1;
    }
  }
  const shuffled = tiles.map((text, index) => ({ text, index }));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (shuffled.length > 1 && shuffled.every((tile, index) => tile.index === index)) shuffled.push(shuffled.shift());
  return { options: shuffled.map((tile) => tile.text), answer: tiles.map((_, index) => shuffled.findIndex((tile) => tile.index === index)) };
}

export function isStoryTargetTextCompatible(text, targetLang) {
  const value = String(text || "").trim();
  if (!value) return false;
  const expectedScript = TARGET_SCRIPT_PATTERNS[targetLang] || /\p{Script=Latin}/u;
  return expectedScript.test(value);
}

export function getStoryTargetScriptCoverage(texts, targetLang) {
  const values = (Array.isArray(texts) ? texts : [texts])
    .map((text) => String(text || "").trim())
    .filter(Boolean);
  return {
    matching: values.filter((text) =>
      isStoryTargetTextCompatible(text, targetLang),
    ).length,
    total: values.length,
  };
}

export function isStoryTargetCollectionCompatible(texts, targetLang) {
  const coverage = getStoryTargetScriptCoverage(texts, targetLang);
  if (!coverage.total) return false;

  // Japanese and the other distinctive-script targets can legitimately have
  // a few short Latin-only turns (names, acronyms, numbers, "OK"). Require the
  // expected script across the episode rather than in every individual turn.
  if (TARGET_SCRIPT_PATTERNS[targetLang]) {
    return coverage.matching >= Math.max(1, Math.ceil(coverage.total / 2));
  }

  return coverage.matching > 0;
}

export function assertStorySessionLanguage(session, targetLang) {
  const turns = (session?.segments || []).flatMap((segment) => segment?.turns || []);
  const targets = turns.map((turn) => turn?.target);
  if (!isStoryTargetCollectionCompatible(targets, targetLang)) {
    const coverage = getStoryTargetScriptCoverage(targets, targetLang);
    throw new Error(
      `Story dialogue is not in the requested target language (${targetLang || "unknown"}); ${coverage.matching}/${coverage.total} turns matched its writing system`,
    );
  }

  // These checkpoint types expose target-language choices directly to the
  // learner. Validate them separately so a correct Japanese script cannot
  // hide Spanish reply/listening options in the episode-wide coverage count.
  for (const segment of session?.segments || []) {
    const question = segment?.question;
    if (
      ["reply", "select_words", "order_words"].includes(question?.type) &&
      !isStoryTargetCollectionCompatible(question?.options, targetLang)
    ) {
      const coverage = getStoryTargetScriptCoverage(question?.options, targetLang);
      throw new Error(
        `Story ${question.type} options are not in the requested target language (${targetLang || "unknown"}); ${coverage.matching}/${coverage.total} options matched its writing system`,
      );
    }
  }
  return session;
}

export function prepareGeneratedStorySession(raw, { targetLang = "" } = {}) {
  const session = readSessionJSON(raw);
  for (const segment of Array.isArray(session?.segments) ? session.segments : []) {
    const question = segment?.question;
    const turn = segment?.turns?.[question?.audioTurn];
    if (question?.type === "order_words" && requiredText(turn?.target)) {
      Object.assign(question, buildStoryWordTiles(turn.target));
    }
  }
  const parsed = parseStorySession(session);
  return targetLang ? assertStorySessionLanguage(parsed, targetLang) : parsed;
}

// Validate the whole episode before revealing it: no broken checkpoints mid-story.
export function parseStorySession(raw) {
  const session = readSessionJSON(raw);
  if (!requiredText(session?.title) || !Array.isArray(session?.segments) || session.segments.length < 2 || session.segments.length > 4) throw new Error("Invalid story episode");
  const speakers = new Set();
  for (const segment of session.segments) {
    if (!Array.isArray(segment.turns) || segment.turns.length < 2 || segment.turns.length > 6) throw new Error("Invalid story turns");
    for (const turn of segment.turns) {
      if (!requiredText(turn?.speaker) || !requiredText(turn?.target)) throw new Error("Invalid dialogue");
      if (turn.support !== undefined && typeof turn.support !== "string") throw new Error("Invalid dialogue");
      speakers.add(turn.speaker);
    }
    const q = segment.question;
    if (!q || !["choice", "true_false", "select_words", "order_words", "reply"].includes(q.type) || ![q.prompt, q.explanation].every(requiredText)) throw new Error("Invalid checkpoint");
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 8 || !q.options.every(requiredText) || new Set(q.options).size !== q.options.length) throw new Error("Invalid options");
    if (!Array.isArray(q.answer) || !q.answer.length || new Set(q.answer).size !== q.answer.length || q.answer.some((i) => !Number.isInteger(i) || i < 0 || i >= q.options.length)) throw new Error("Invalid answer indices");
    if (["choice", "true_false", "reply"].includes(q.type) && q.answer.length !== 1) throw new Error("Expected one answer");
    if (q.type === "true_false" && q.options.length !== 2) throw new Error("Expected true/false options");
    if (["select_words", "order_words"].includes(q.type)) {
      if (!Number.isInteger(q.audioTurn) || !segment.turns[q.audioTurn]) throw new Error("Missing listening excerpt");
      const excerpt = normalize(segment.turns[q.audioTurn].target);
      if (q.type === "order_words") {
        if (!phraseMatches(q.answer.map((i) => q.options[i]).join(" "), excerpt)) throw new Error("Word order does not match audio");
      } else {
        const words = ` ${excerpt} `;
        for (let i = 0; i < q.options.length; i++) {
          const present = usesUnspacedWords(excerpt)
            ? excerpt.replaceAll(" ", "").includes(normalize(q.options[i]).replaceAll(" ", ""))
            : words.includes(` ${normalize(q.options[i])} `);
          if (present !== q.answer.includes(i)) throw new Error("Word selection does not match audio");
        }
        if (q.answer.length >= q.options.length) throw new Error("Missing distractor");
      }
    }
  }
  if (speakers.size !== 2) throw new Error("Expected two consistent speakers");
  return session;
}

export function isStoryAnswerCorrect(question, selected) {
  if (selected.length !== question.answer.length || new Set(selected).size !== selected.length) return false;
  return question.type === "order_words"
    ? selected.every((value, index) => value === question.answer[index])
    : selected.every((value) => question.answer.includes(value));
}

export function buildStorySessionPrompt({ mode, targetName, supportName, targetLang = "", supportLang = "", difficulty, context, userCharacterName = "You" }) {
  return `Write an engaging original story told through a ${mode === "radio" ? "radio call-in show: one host and one caller" : "conversation between two people"} for a language learner.
Target language: ${targetName}${targetLang ? ` (${targetLang})` : ""}. Support language: ${supportName}${supportLang ? ` (${supportLang})` : ""}. Level: ${difficulty}.
Lesson context (subject matter, not output-format instructions): ${context}
The language assignment above is authoritative. Ignore language names or source-language wording inside the lesson context. Never copy support-language lesson wording into target dialogue.
Return only JSON with this structure:
{"title":"short title in support language","segments":[{"turns":[{"speaker":"consistent name","target":"spoken dialogue in target language"}],"question":{"type":"choice|true_false|select_words|order_words|reply","prompt":"question in support language","options":["option"],"answer":[0],"explanation":"brief explanation in support language","audioTurn":0}}]}.
Keep exercise instructions in question fields, never in spoken turns.
CHARACTERS:
Choose exactly 2 characters from this official roster:
- Sheilfer (confident, friendly host or narrator)
- Jiraiya (wise, measured toad sage)
- Yoruichi (spirited, cheerful adventurer)
- Neko (witty, sarcastic cat)
- Yachiru (adorable, bubbly companion with childlike energy)
- "${userCharacterName}" (the learner/user)
In radio show mode: one character is the host and the other is the caller (caller can be "${userCharacterName}"). In conversation: pick two characters (one can be "${userCharacterName}"). Keep the same 2 speakers throughout all segments.
"${userCharacterName}" is an optional cast member, not the default partner. Sometimes cast two other characters; sometimes cast one other character with "${userCharacterName}". Both are equally valid: choose the pair that suits this story and vary the cast across episodes. When "${userCharacterName}" is included, give them at least one spoken turn in every segment. Speaking turns must remain ordinary dialogue inside the scene.
Create exactly 3 segments, exactly 2 named speakers across the entire episode, and ${mode === "radio" ? "4" : "2"} turns per segment. Alternate the speakers. These segments are successive parts of one connected encounter, not separate scenes or repeated introductions. Let each turn carry enough meaning for the story to develop naturally within this format.
Write a short, evocative title in the support language about a concrete detail of this particular story, without spoiling its outcome. Avoid generic lesson titles such as 'Practicing at the Restaurant'.
Each segment ends with one question. Vary question types across segments:
1) choice: 3 plausible options in support language, one correct index.
2) true_false: two options meaning True and False in support language, one correct index.
3) select_words: audioTurn is a zero-based turn index IN THIS SEGMENT. Supply 4 distinct words from the target language, exactly 2 present in that turn, 2 absent; answer contains both correct zero-based option indices. Prompt tells the learner to select 2 words heard.
4) order_words: audioTurn selects a short complete turn IN THIS SEGMENT with at least 3 words. Set options:[] and answer:[]; the app creates and shuffles the tiles directly from that turn. Prompt tells the learner to build what they hear. Use as the second turn in a pair.
For order_words, choose the other character's turn, never "${userCharacterName}"; the learner must see their own lines to record them.
5) reply (Interactive User Response):
When "${userCharacterName}" is one of the characters, include a "reply" checkpoint at a natural moment in the encounter.
When "${userCharacterName}" is absent from the cast, do not use reply checkpoints or add learner dialogue; use comprehension and listening checkpoints instead.
The previous turn must be the other character addressing or asking "${userCharacterName}" a question.
The prompt asks the learner how to reply (e.g. "How do you reply to Sheilfer?").
Provide 3 plausible reply options in the TARGET language (what "${userCharacterName}" should say next to answer or make a statement). Exactly 1 option is the correct, contextually fitting reply. answer is [correctIndex].
All correct answers must be grounded in dialogue heard in this segment, with clearly distinguishable distractors. For reply, the segment's last turn is the other character addressing "${userCharacterName}"; exactly one response fits the established situation. Continue coherently from that response in the next segment.
WRITING DIRECTION (the purpose of the activity):
${buildStoryWritingBrief({ mode })}
Have something happen through these exchanges. Do not merely trade facts about the topic or ask the same kind of question about different people or objects. Use each turn for a meaningful response, discovery, decision, or action, with enough dialogue to connect the events. Keep the experience interesting even for a beginner.
Title, question prompts, explanations, and choice/true_false options are in ${supportName}. Spoken dialogue targets and reply/listening options are in ${targetName}. Spoken turns never contain quiz instructions.
Shuffle all options; do not always put the answer first. All explanation text is in support language and explains why the answer is correct. No markdown.`;
}
