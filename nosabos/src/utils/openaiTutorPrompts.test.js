import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOpenAITutorResponsePolicy,
  buildOpenAIStarterAgendaTurnInstructions,
  buildOpenAIRepairTurnInstructions,
  buildOpenAITutorTurnVerdictDirective,
} from "./openaiTutorPrompts.js";
import { TUTOR_TURN_VERDICT } from "./tutorTurnVerdict.js";

test("policy leads with native bilingual phonology for code switching", () => {
  const policy = buildOpenAITutorResponsePolicy({
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
    selectedLevel: "A1",
    isEarlyTutorLevel: true,
  });

  assert.ok(policy.startsWith("# Bilingual speech"));
  // Phonology is the SECOND line, right after the role — and names silent
  // letters ("hermano" was spoken with an audible H in a hi→es session).
  assert.match(
    policy,
    /Every Spanish span you speak — even one isolated word in the middle of English speech — must follow fully native Spanish pronunciation: native phonemes, silent letters kept silent/,
  );
  assert.ok(
    policy.indexOf("must follow fully native Spanish pronunciation") <
      policy.indexOf("base language"),
  );
  assert.match(policy, /Never pronounce Spanish text with English sounds/);
  // Early levels anchor the reply's BASE language — with Hindi support the
  // mini model opened replies in Spanish teacher talk instead.
  assert.match(
    policy,
    /English is your base language: every reply starts and stays in natural English, switching to Spanish only for the exact words and phrases being taught/,
  );
  // "supra-bhat": the model romanized Devanagari support words aloud.
  assert.match(policy, /never respell, romanize, transliterate/);
  // English state (curriculum labels, evidence notes, personas) leaked into
  // hi→es replies — the policy must pin spoken output to the session's pair.
  assert.match(
    policy,
    /Speak only English and Spanish to the learner: these instructions and their notes may arrive in other languages, but never render any other language aloud\./,
  );
});

test("policy carries the level ceiling, coherence, and internal-word bans", () => {
  const policy = buildOpenAITutorResponsePolicy({
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
    selectedLevel: "Pre-A1",
    isEarlyTutorLevel: true,
    persona: "Warm, playful",
  });

  assert.match(policy, /absolute beginner \(Pre-A1\)/);
  assert.match(policy, /a fill-in-the-blank must leave the answer out/);
  assert.match(policy, /include exactly one correct Spanish answer/);
  assert.match(
    policy,
    /asking which phrase the learner heard is only possible immediately after you actually said that phrase aloud/,
  );
  // No quoted English template here: mini copied the literal word "means"
  // from the old '"X means Y"' formula into Hindi replies ("hola means
  // नमस्ते"). The rule now demands support-language connecting words instead.
  assert.match(
    policy,
    /say the Spanish phrase first and then its English meaning, with the connecting words in natural English/,
  );
  assert.doesNotMatch(policy, /X means Y/);
  assert.match(policy, /never speak words like "accepted"/i);
  assert.match(policy, /Never restate or paraphrase a sentence you already said/);
  // Mini narrated its own deliberation aloud ("let me think about the next
  // very small step", "Déjame pensar cómo seguir") before the actual reply —
  // planning must stay silent in every language.
  assert.match(
    policy,
    /Plan the turn silently, in any language: never say you are thinking/,
  );
  assert.match(policy, /# Persona\nWarm, playful\./);
});

test("policy collapses to a single-language section when target equals support", () => {
  const policy = buildOpenAITutorResponsePolicy({
    targetLanguageName: "Spanish",
    supportLanguageName: "Spanish",
    sameLanguage: true,
  });

  assert.ok(policy.startsWith("# Spoken language"));
  assert.doesNotMatch(policy, /bilingual/i);
});

test("starter teach turn states one verdict directive and the current item", () => {
  const turn = buildOpenAIStarterAgendaTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.ACCEPTED,
    currentItem: {
      task: "learn to say goodbye",
      phrase: "adiós",
      meaning: "goodbye",
    },
    acceptedPhrases: ["buenos días"],
    completedPhrases: ["hola", "buenos días"],
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.ok(turn.startsWith("# Current lesson state"));
  assert.match(turn, /Phase: teach\./);
  assert.match(
    turn,
    /Current item: learn to say goodbye — Spanish phrase: "adiós" — English meaning: "goodbye"\./,
  );
  assert.match(turn, /succeeded \("buenos días"\)/);
  assert.match(turn, /Previously covered \(do not re-teach or re-quiz now\): "hola", "buenos días"\./);
  // The learner's ASR transcript is never echoed into instructions: the model
  // heard the audio itself, and target-hinted ASR renders support-language
  // speech as pseudo-target garbage that dragged replies into the wrong
  // language (hi-support sessions opened in Spanish).
  assert.doesNotMatch(turn, /transcript/i);
  // Exactly one acknowledgement directive — the doubled praise instructions
  // were what made mini speak two stacked acknowledgements in one reply.
  assert.equal(turn.match(/Acknowledge/g)?.length, 1);
});

test("starter rejected turn helps first and keeps the same phrase", () => {
  const turn = buildOpenAIStarterAgendaTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.REJECTED,
    currentItem: { task: "learn to say hello", phrase: "hola", meaning: "hello" },
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(turn, /If the learner asked for help, the meaning, or a repetition/);
  assert.match(turn, /invite one more try at the same phrase/);
  assert.doesNotMatch(turn, /Introduce the current item/);
});

test("starter kickoff begins teaching without a second welcome", () => {
  const turn = buildOpenAIStarterAgendaTurnInstructions({
    isKickoff: true,
    currentItem: { task: "learn to say hello", phrase: "hola", meaning: "hello" },
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(turn, /Begin the lesson now — do not greet them again/);
  assert.match(turn, /Introduce the current item naturally/);
  assert.match(turn, /Previously covered: none\./);
});

test("starter review turn elicits covered phrases instead of dictating", () => {
  const turn = buildOpenAIStarterAgendaTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.ACCEPTED,
    currentItem: null,
    reviewPhrases: ["hola", "me llamo", "adiós"],
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(turn, /Phase: review\./);
  assert.match(turn, /Covered Spanish phrases: "hola", "me llamo", "adiós"\./);
  assert.match(turn, /Elicit the phrase — do not say it first and ask for a repeat\./);
  assert.match(turn, /Do not introduce new material\./);
});

test("regular lessons reuse the starter verdict wording, never a narratable variant", () => {
  const accepted = buildOpenAITutorTurnVerdictDirective({
    turnVerdict: TUTOR_TURN_VERDICT.ACCEPTED,
    supportLanguageName: "Hindi",
  });
  assert.match(accepted, /Acknowledge it with one short natural phrase, then move straight on\./);
  // "next teaching move" was mini's parrot source for the spoken English
  // "let me take that as a next step and build on it".
  assert.doesNotMatch(accepted, /teaching move|next step/);

  const rejected = buildOpenAITutorTurnVerdictDirective({
    turnVerdict: TUTOR_TURN_VERDICT.REJECTED,
    supportLanguageName: "Hindi",
  });
  assert.match(rejected, /give exactly that in Hindi for the current phrase/);

  const uncertain = buildOpenAITutorTurnVerdictDirective({
    turnVerdict: TUTOR_TURN_VERDICT.UNCERTAIN,
    supportLanguageName: "Hindi",
  });
  assert.match(uncertain, /could not be graded/);
  // Never the kickoff variant: this directive always reacts to a real turn.
  assert.doesNotMatch(uncertain, /already been welcomed/);
});

test("repair turn wraps the directive with one verdict line", () => {
  const turn = buildOpenAIRepairTurnInstructions({
    repairDirective: "REPAIR SESSION: practice the saved material.",
    turnVerdict: TUTOR_TURN_VERDICT.REJECTED,
  });

  assert.match(turn, /Continue the repair session/);
  assert.match(turn, /REPAIR SESSION: practice the saved material\./);
  assert.match(turn, /The latest attempt did not succeed\./);
  assert.doesNotMatch(turn, /could not be graded/);
  assert.doesNotMatch(turn, /transcript/i);
  assert.match(turn, /Give the learner exactly one clear action\./);
});
