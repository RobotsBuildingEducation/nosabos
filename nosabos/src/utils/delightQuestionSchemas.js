const stringSchema = (description) => ({
  type: "string",
  ...(description ? { description } : {}),
});

const integerSchema = (description, minimum, maximum) => ({
  type: "integer",
  ...(description ? { description } : {}),
  ...(Number.isFinite(minimum) ? { minimum } : {}),
  ...(Number.isFinite(maximum) ? { maximum } : {}),
});

const arraySchema = (items, minItems, maxItems, description) => ({
  type: "array",
  items,
  ...(Number.isFinite(minItems) ? { minItems } : {}),
  ...(Number.isFinite(maxItems) ? { maxItems } : {}),
  ...(description ? { description } : {}),
});

const objectSchema = (
  properties,
  required = Object.keys(properties),
  description,
) => ({
  type: "object",
  properties,
  required,
  ...(description ? { description } : {}),
});

const sharedQuestionSchema = {
  instruction: stringSchema("Short learner instruction in the support language."),
  hint: stringSchema("Optional short hint in the support language."),
  explanation: stringSchema("Optional explanation in the support language."),
};

// This is the provider contract and the UI contract. Keep required fields
// minimal, but express every supported cardinality constraint here so Gemini
// and OpenAI do not have to infer hidden array-size rules from prose alone.
export const DELIGHT_RESPONSE_SCHEMAS = Object.freeze({
  sentence_detective: objectSchema({
    tokens: arraySchema(
      stringSchema("One target-language sentence token."),
      2,
      30,
      "The complete broken sentence in reading order.",
    ),
    incorrectIndex: integerSchema(
      "Zero-based index of the one incorrect token.",
      0,
      29,
    ),
    replacements: arraySchema(
      stringSchema("One target-language replacement token."),
      4,
      4,
      "Four unique choices, including the answer.",
    ),
    answer: stringSchema("The correct replacement token."),
  }),
  dialogue_fork: objectSchema(
    {
      ...sharedQuestionSchema,
      speaker: stringSchema("Speaker role in the support language."),
      line: stringSchema("Conversation prompt in the target language."),
      options: arraySchema(
        stringSchema("One target-language reply."),
        4,
        4,
        "Exactly four reply choices.",
      ),
      answerIndex: integerSchema(
        "Zero-based index of the correct reply in options.",
        0,
        3,
      ),
      reaction: stringSchema("Short target-language follow-up utterance."),
    },
    ["line", "options", "answerIndex"],
  ),
  sentence_shapeshifter: objectSchema(
    {
      ...sharedQuestionSchema,
      source: stringSchema("Source sentence in the target language."),
      constraint: stringSchema(
        "Transformation rule in the support language, without the answer.",
      ),
      answer: stringSchema("One valid transformed target-language sentence."),
      acceptableAnswers: arraySchema(
        stringSchema("Another valid target-language answer."),
        0,
        8,
      ),
    },
    ["source", "constraint", "answer"],
  ),
  word_neighborhoods: objectSchema(
    {
      ...sharedQuestionSchema,
      groups: arraySchema(
        objectSchema({
          label: stringSchema("Category label in the support language."),
          items: arraySchema(
            stringSchema("One unique target-language category item."),
            3,
            3,
            "Exactly three unique items for this category.",
          ),
        }),
        2,
        2,
        "Exactly two mutually exclusive categories.",
      ),
    },
    ["groups"],
  ),
  morphology_forge: objectSchema(
    {
      ...sharedQuestionSchema,
      sentence: stringSchema(
        "Target-language sentence containing exactly one ___ placeholder.",
      ),
      pieces: arraySchema(
        stringSchema("One target-language morpheme choice."),
        4,
        6,
        "All answer pieces plus two or three distractor pieces.",
      ),
      answerPieces: arraySchema(
        stringSchema("One answer morpheme, in assembly order."),
        2,
        3,
      ),
      answerWord: stringSchema("The word formed by joining answerPieces."),
    },
    ["sentence", "pieces", "answerPieces"],
  ),
  three_clue_mystery: objectSchema(
    {
      ...sharedQuestionSchema,
      clues: arraySchema(
        stringSchema("One clue in the support language."),
        3,
        3,
        "Exactly three clues, from subtle to obvious.",
      ),
      answer: stringSchema("Mystery answer in the target language."),
      acceptableAnswers: arraySchema(
        stringSchema("Another acceptable target-language answer."),
        0,
        8,
      ),
      example: stringSchema("Natural target-language example sentence."),
    },
    ["clues", "answer"],
  ),
  listen_difference: objectSchema(
    {
      ...sharedQuestionSchema,
      audioText: stringSchema(
        "Target-language text to speak; it must equal the correct option.",
      ),
      options: arraySchema(
        stringSchema("One target-language listening option."),
        2,
        2,
        "Exactly two contrasting options.",
      ),
      answerIndex: integerSchema(
        "Zero-based index of the option equal to audioText.",
        0,
        1,
      ),
      contrast: stringSchema("Brief contrast description in the support language."),
    },
    ["audioText", "options", "answerIndex"],
  ),
  three_word_challenge: objectSchema(
    {
      ...sharedQuestionSchema,
      cues: arraySchema(
        stringSchema("One distinct target-language word with no whitespace."),
        3,
        3,
        "Exactly three distinct single-word cues.",
      ),
      sampleAnswers: arraySchema(
        stringSchema("Natural target-language sentence using all three cues."),
        1,
        3,
      ),
      reaction: stringSchema("Short encouragement in the support language."),
    },
    ["cues", "sampleAnswers"],
  ),
  natural_or_weird: objectSchema(
    {
      ...sharedQuestionSchema,
      sentence: stringSchema("Target-language sentence to judge."),
      isNatural: {
        type: "boolean",
        description: "Whether sentence is natural target-language usage.",
      },
      correction: stringSchema(
        "Natural target-language form; equal to sentence when already natural.",
      ),
    },
    ["sentence", "isNatural", "correction"],
  ),
});

export function getDelightResponseSchema(variant) {
  return DELIGHT_RESPONSE_SCHEMAS[variant] || null;
}
