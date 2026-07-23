import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOpenAITutorResponsePolicy,
  buildOpenAIStarterAgendaTurnInstructions,
  buildOpenAIRepairTurnInstructions,
  buildOpenAITutorTurnVerdictDirective,
  buildOpenAITeachTurnInstructions,
  buildOpenAIGoalTurnInstructions,
  buildOpenAITargetedReviewTurnInstructions,
  buildOpenAIIntegratedScenarioTurnInstructions,
  buildOpenAIPurposeReviewLoopInstructions,
  buildOpenAIQuizTurnInstructions,
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
  // The trailing clause matters most when the TARGET is English: instruction
  // prose is English too, and mini rendered task instructions in the target
  // language over a Pre-A1 learner's head ("Now think: Say something…").
  assert.match(
    policy,
    /English is your base language: every reply starts and stays in natural English, switching to Spanish only for the exact words and phrases being taught — never for instructions, questions, or commentary\./,
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
  // Anti-recitation: the state notes must never be read out as the reply.
  assert.match(
    policy,
    /never recite these notes' wording, labels, or layout — compose every sentence yourself/,
  );
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
  // Prose, never a colon-labelled card: mini recited the old card layout
  // verbatim ("English phrase: 'my name is'. Spanish meaning: 'me llamo'.")
  // instead of teaching in the support language.
  assert.match(
    turn,
    /The item being taught is learn to say goodbye: the Spanish phrase "adiós", which means "goodbye" in English\./,
  );
  assert.doesNotMatch(turn, /phrase: "/);
  assert.doesNotMatch(turn, /meaning: "/);
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
  assert.doesNotMatch(turn, /Introduce it now/);
});

test("starter kickoff begins teaching without a second welcome", () => {
  const turn = buildOpenAIStarterAgendaTurnInstructions({
    isKickoff: true,
    currentItem: { task: "learn to say hello", phrase: "hola", meaning: "hello" },
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(turn, /Begin the lesson now — do not greet them again/);
  assert.match(
    turn,
    /Introduce it now in your own natural English sentences/,
  );
  assert.match(turn, /Previously covered: none\./);
});

test("starter review turn quizzes from memory instead of dictating", () => {
  const turn = buildOpenAIStarterAgendaTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.ACCEPTED,
    currentItem: null,
    reviewPhrases: ["hola", "me llamo", "adiós"],
    taskVariation: "Offer two short choices and ask the learner to pick the correct one.",
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(turn, /Phase: review\./);
  assert.match(turn, /Covered Spanish phrases: "hola", "me llamo", "adiós"\./);
  // Gemini-parity give-away ban, both prongs: no modeling the answer, and no
  // restating its meaning right before the prompt.
  assert.match(
    turn,
    /Quiz from memory: do not dictate what to say, do not speak the answer Spanish phrase first, and do not restate its meaning right before the prompt/,
  );
  // The delivery clause keeps English-prose format sentences from being
  // mirrored into target-language teacher talk over the learner's head.
  assert.match(
    turn,
    /Format for this turn, asked and explained in English: Offer two short choices and ask the learner to pick the correct one\./,
  );
  assert.match(turn, /Do not introduce new material\./);
});

test("starter review without a rotation still forbids repeating the last format", () => {
  const turn = buildOpenAIStarterAgendaTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.ACCEPTED,
    currentItem: null,
    reviewPhrases: ["hola"],
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(
    turn,
    /Use a different task format than your previous message, asked and explained in English\./,
  );
});

test("starter teach turn carries the interaction layer verbatim", () => {
  const turn = buildOpenAIStarterAgendaTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.ACCEPTED,
    currentItem: { task: "learn to say hello", phrase: "hola", meaning: "hello" },
    interactionLayer:
      "Light interaction layer for this turn, kept inside the current item and delivered in English: coach the learner to ask the question back.",
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(
    turn,
    /Light interaction layer for this turn, kept inside the current item and delivered in English: coach the learner to ask the question back\./,
  );
  // The layer rides the teach phase only — review stays a pure quiz.
  const review = buildOpenAIStarterAgendaTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.ACCEPTED,
    currentItem: null,
    reviewPhrases: ["hola"],
    interactionLayer: "Light interaction layer for this turn: anything.",
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });
  assert.doesNotMatch(review, /interaction layer/i);
});

test("regular lessons share the starter teach shape, meaning supplied by the tutor", () => {
  const turn = buildOpenAITeachTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.ACCEPTED,
    phrase: "mom",
    completedPhrases: ["dad"],
    chunkMultiWord: true,
    sequenceLine: "The lesson runs strictly in order: stay on this item.",
    targetLanguageName: "English",
    supportLanguageName: "Spanish",
  });

  assert.ok(turn.startsWith("# Current lesson state"));
  // No support gloss in curriculum data → the tutor supplies the meaning.
  assert.match(
    turn,
    /The item being taught is the English phrase "mom"; give its Spanish meaning in your own words\./,
  );
  // The same natural-introduction recipe the starter tutorial uses — its
  // absence is what made regular lessons dry and English-drifting.
  assert.match(
    turn,
    /Introduce it now in your own natural Spanish sentences: give the meaning, say the English phrase once, and invite one small try\./,
  );
  assert.match(turn, /practice one small piece of it at a time/);
  assert.match(turn, /The lesson runs strictly in order: stay on this item\./);
  assert.doesNotMatch(turn, /Stay on this item until the app advances/);

  // Non-early levels swap chunking for the authored usage example.
  const contextTurn = buildOpenAITeachTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.REJECTED,
    phrase: "mom",
    contextExample: "Mom is here.",
    targetLanguageName: "English",
    supportLanguageName: "Spanish",
  });
  assert.match(
    contextTurn,
    /Context example for usage practice: "Mom is here\."/,
  );
  assert.doesNotMatch(contextTurn, /Introduce it now/);
});

test("capability goals cannot be recited as target-language phrases", () => {
  const turn = buildOpenAIGoalTurnInstructions({
    isKickoff: true,
    label: "Identifica personas conocidas en una descripción breve",
    goal:
      "Identify familiar people and their relationships in a short neighborhood description",
    activityBrief:
      "Present a two-sentence Pre-A1 description, then ask one meaning question",
    evidence: "The learner correctly identifies at least one relationship",
    examples: ["This is my friend Ana.", "She is my neighbor."],
    targetLanguageName: "English",
    supportLanguageName: "Spanish",
  });

  assert.match(turn, /Phase: teach a capability objective/);
  assert.match(turn, /English reference material/);
  assert.match(
    turn,
    /Never quote them as language to repeat, pronounce, translate, or memorize/,
  );
  assert.match(
    turn,
    /For comprehension, present the English material first and ask a meaning question/,
  );
  assert.doesNotMatch(turn, /The item being taught is the English phrase/);
});

test("quiz turns test before teaching and advance after an incorrect answer", () => {
  const first = buildOpenAIQuizTurnInstructions({
    isKickoff: true,
    currentQuestion: {
      goal: "Produce a basic self-introduction",
      targetForms: ["Me llamo"],
      examples: ["Me llamo Ana."],
      evidence: "Learner supplies the Spanish phrase",
    },
    questionNumber: 1,
    totalQuestions: 9,
    passingScore: 8,
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });
  assert.match(first, /Phase: scored assessment/);
  assert.match(first, /never teach before the learner answers/i);
  assert.match(
    first,
    /Do not say, spell, translate, paraphrase, or model any accepted form/,
  );
  assert.match(first, /one scored attempt/i);

  const afterMiss = buildOpenAIQuizTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.REJECTED,
    previousCorrection: "Me llamo",
    currentQuestion: {
      goal: "Recognize a morning greeting",
      targetForms: ["Buenos días"],
    },
    questionNumber: 2,
    totalQuestions: 9,
    passingScore: 8,
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });
  assert.match(afterMiss, /Give one concise correction/);
  assert.match(afterMiss, /Do not make the learner retry the old question/);
  assert.match(afterMiss, /then ask the new question/);
});

test("Skill Builder turns require retrieval before corrective teaching", () => {
  const firstAttempt = buildOpenAITargetedReviewTurnInstructions({
    isKickoff: true,
    currentItem: {
      goal: "Use a morning greeting",
      targetForms: ["Buenos días"],
      evidence: "The learner supplies an appropriate greeting",
      examples: ["Buenos días, Ana."],
    },
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(firstAttempt, /Phase: targeted skill review/);
  assert.match(firstAttempt, /retrieve first/i);
  assert.match(firstAttempt, /Do not say, translate, spell, paraphrase, or model/);
  assert.match(firstAttempt, /exactly one learner action/i);

  const afterMiss = buildOpenAITargetedReviewTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.REJECTED,
    currentItem: {
      goal: "Use a morning greeting",
      targetForms: ["Buenos días"],
    },
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });
  assert.match(afterMiss, /one concise correction or scaffold in English/);
  assert.match(afterMiss, /correction may include the answer/);
  assert.match(afterMiss, /one new learner attempt/);
});

test("Integrated Practice turns combine objectives inside one continuing scenario", () => {
  const turn = buildOpenAIIntegratedScenarioTurnInstructions({
    isKickoff: true,
    currentItem: {
      goal: "Ask the price",
      targetForms: ["¿Cuánto cuesta?"],
      evidence: "The learner asks for a price",
    },
    companionItems: [
      { goal: "Request a quantity" },
      { goal: "Confirm the total" },
    ],
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(turn, /one continuous, realistic scenario/);
  assert.match(turn, /Supporting unit objectives to weave/);
  assert.match(turn, /not grade or complete on this turn/);
  assert.match(turn, /Never announce, list, or teach the objectives separately/);
  assert.match(turn, /only evidence the app should grade on this turn/);

  const continued = buildOpenAIIntegratedScenarioTurnInstructions({
    turnVerdict: TUTOR_TURN_VERDICT.ACCEPTED,
    currentItem: { goal: "Confirm the total" },
    companionItems: [{ goal: "Say goodbye politely" }],
  });
  assert.match(continued, /continue the same roleplay/);
  assert.match(continued, /do not reset the scene/);
});

test("supplemental Tutor review loops retain their distinct modalities", () => {
  const skillBuilder = buildOpenAIPurposeReviewLoopInstructions({
    tutorPurpose: "targeted_review",
    coveredItems: ["greet someone", "introduce yourself"],
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });
  assert.match(skillBuilder, /mixed retrieval review/);
  assert.match(skillBuilder, /Do not speak, translate, or model/);

  const integrated = buildOpenAIPurposeReviewLoopInstructions({
    tutorPurpose: "integrated_scenario",
    coveredItems: ["greet someone", "introduce yourself"],
  });
  assert.match(integrated, /integrated scenario review/);
  assert.match(integrated, /at least two covered objectives/);
  assert.match(integrated, /Do not return to isolated phrase drills/);
});

test("Tutor quiz turns use XP completion without a pass-score instruction", () => {
  const turn = buildOpenAIQuizTurnInstructions({
    isKickoff: true,
    completionMode: "xp",
    currentQuestion: {
      goal: "Use a greeting",
      targetForms: ["hola"],
    },
    questionNumber: 1,
    totalQuestions: 9,
    passingScore: 8,
    targetLanguageName: "Spanish",
    supportLanguageName: "English",
  });

  assert.match(turn, /Correct answers earn lesson progress/);
  assert.match(turn, /XP requirement is reached/);
  assert.doesNotMatch(turn, /passing score|required.*pass/i);
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
