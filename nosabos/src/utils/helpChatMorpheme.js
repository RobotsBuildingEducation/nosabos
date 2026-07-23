export const hasMorphemeBreakdown = (text) =>
  /(^|\n)\s*\*\*[^*\n]+\*\*\s*=\s*\S+/m.test(String(text || ""));

export const hasDirectTranslation = (text) =>
  /(^|\n)\s*\/\/\s*\S+/m.test(String(text || ""));

export const hasCompleteMorphemeResponse = (text) =>
  hasDirectTranslation(text) && hasMorphemeBreakdown(text);

export const buildMorphemeModeInstruction = ({
  targetLanguageName,
  supportLanguageName,
}) => `🔬 MORPHEME MODE IS ON.

Treat the latest user input as the exact text to translate and analyze.

First, directly translate the complete submitted text between ${targetLanguageName} and ${supportLanguageName}. If the input is in ${targetLanguageName}, translate it into ${supportLanguageName}; if it is in ${supportLanguageName}, translate it into ${targetLanguageName}. For a name or other text that normally stays unchanged, repeat it unchanged. Put this translation on the first line using exactly:

// direct translation

Then give the morpheme breakdown of the ORIGINAL submitted word or words. Do not break down the translated wording.

Do not create an example sentence. Do not add related words, rewrite the input, or analyze words from the conversation history or your own response.

Use this format for each submitted word:

**word** = part1 + part2 + part3
- part1: meaning or grammatical function
- part2: meaning or grammatical function
→ "concise English gloss"

If a ${targetLanguageName} word cannot be meaningfully divided into smaller morphemes, do not invent a split. Show the word as a single unit instead:

**word** = word
- word: single morpheme (brief meaning, function, or origin when useful)
→ "concise English gloss"

Preserve the user's words and analyze all and only those words. Apart from the // translation line, use no heading or introductory paragraph.`;

export const buildMorphemeFallbackPrompt = ({
  targetLanguageName,
  supportLanguageName,
  question,
  assistantAnswer,
}) =>
  [
    "The response did not contain both the required direct translation and morpheme breakdown.",
    `Target language: ${targetLanguageName}.`,
    `Support language: ${supportLanguageName}.`,
    `First translate the exact latest user input between ${targetLanguageName} and ${supportLanguageName}.`,
    `If it is in ${targetLanguageName}, translate into ${supportLanguageName}; if it is in ${supportLanguageName}, translate into ${targetLanguageName}.`,
    "Return the direct translation as the first line in this exact format:",
    "// direct translation",
    "",
    "Then return a morpheme breakdown of only the ORIGINAL word or words in the latest user input.",
    "Do not create an example sentence, add related words, or analyze text from the assistant answer.",
    "Use this format for each submitted word (no heading):",
    "**word** = part1 + part2 + part3",
    "- part1: meaning or grammatical function",
    "- part2: meaning or grammatical function",
    '→ "concise English gloss"',
    "",
    "For a word with no meaningful smaller morphemes, use:",
    "**word** = word",
    "- word: single morpheme (brief meaning, function, or origin when useful)",
    '→ "concise English gloss"',
    "",
    `Latest user input: ${question}`,
    "",
    "The previous assistant answer is included only to diagnose the missing format; do not analyze any words from it:",
    assistantAnswer,
  ].join("\n");
