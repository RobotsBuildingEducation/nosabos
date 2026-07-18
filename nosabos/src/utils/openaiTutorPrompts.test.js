import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOpenAITutorResponsePolicy,
  buildOpenAIStarterAgendaTurnInstructions,
  buildOpenAIRepairTurnInstructions,
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
  assert.match(
    policy,
    /Every Spanish span you speak — even one isolated word in the middle of English speech — must use fully native Spanish phonemes/,
  );
  assert.match(policy, /Never pronounce Spanish text with English sounds/);
  assert.match(
    policy,
    /Use natural English for teacher talk and Spanish for the exact words and phrases being taught/,
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
  assert.match(policy, /say the Spanish phrase first and its English meaning second/);
  assert.match(policy, /never speak words like "accepted"/i);
  assert.match(policy, /Never restate or paraphrase a sentence you already said/);
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
    latestTranscript: "buenos días",
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
  assert.match(turn, /Latest learner transcript: "buenos días"\./);
  // Exactly one acknowledgement directive — the doubled praise instructions
  // were what made mini speak two stacked acknowledgements in one reply.
  assert.equal(turn.match(/Acknowledge/g)?.length, 1);
});

test("starter rejected turn helps first and keeps the same phrase", () => {
  const turn = buildOpenAIStarterAgendaTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.REJECTED,
    currentItem: { task: "learn to say hello", phrase: "hola", meaning: "hello" },
    latestTranscript: "what does that mean?",
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

test("repair turn wraps the directive with one verdict line", () => {
  const turn = buildOpenAIRepairTurnInstructions({
    repairDirective: "REPAIR SESSION: practice the saved material.",
    turnVerdict: TUTOR_TURN_VERDICT.REJECTED,
    latestTranscript: "uh",
  });

  assert.match(turn, /Continue the repair session/);
  assert.match(turn, /REPAIR SESSION: practice the saved material\./);
  assert.match(turn, /The latest attempt did not succeed\./);
  assert.doesNotMatch(turn, /could not be graded/);
  assert.match(turn, /Give the learner exactly one clear action\./);
});
