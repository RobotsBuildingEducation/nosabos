const LEGACY_CODE_SWITCHING_INSTRUCTION =
  "You are a language tutor. Correct target-language pronunciation is required. When code switching, switch accent and phonology for the target-language words instead of reading them with the surrounding language accent.";

const BILINGUAL_CODE_SWITCHING_INSTRUCTION =
  "You are a fully bilingual, native-sounding speaker of the target language and the support language. Speak each language with its own native pronunciation.";

export function buildTutorCodeSwitchingAudioInstruction(
  targetLanguageName = "the target language",
  supportLanguageName = "the support language",
  { emphasizeSingleWordSwitches = false } = {},
) {
  if (emphasizeSingleWordSwitches) {
    return [
      "# Spoken languages",
      BILINGUAL_CODE_SWITCHING_INSTRUCTION,
      `Use natural ${supportLanguageName} pronunciation for ${supportLanguageName} teacher talk.`,
      `Whenever the spoken text changes to ${targetLanguageName}, immediately use native ${targetLanguageName} phonology and prosody for that entire span. This applies even when the span is only one word inside a ${supportLanguageName} sentence.`,
      `After the ${targetLanguageName} span ends, return smoothly to native ${supportLanguageName} pronunciation. Keep the code switch fluid and conversational.`,
      `Never read ${targetLanguageName} spelling with ${supportLanguageName} sounds. Do not announce the switch, exaggerate it, spell the word, split it into pieces, or add pronunciation commentary unless the learner asks.`,
      "Use normal spelling in visible text. Never expose phonetic notation, SSML, timing tags, or internal pronunciation instructions.",
    ].join("\n");
  }

  return [
    LEGACY_CODE_SWITCHING_INSTRUCTION,
    `When you include ${targetLanguageName} words or phrases, pronounce those words with native-like ${targetLanguageName} sounds, rhythm, stress, and intonation even if the surrounding tutoring language is different.`,
    `Do not anglicize, hispanicize, or otherwise adapt ${targetLanguageName} model phrases to ${supportLanguageName} pronunciation. The accent must switch for the target phrase itself.`,
    `Before and after each ${targetLanguageName} model phrase, separate it naturally with normal speech timing so the audio clearly switches into ${targetLanguageName} pronunciation.`,
    `Say each ${targetLanguageName} model phrase as a short standalone phrase. Do not blend its sounds into a support-language sentence.`,
    "Never write visible timing, SSML, or control tags such as <pause>, </pause>, <break>, or [pause]. Use normal punctuation only.",
    "Write target-language words in normal spelling. Do not use phonetic respelling, hyphenation, or transliteration unless the learner explicitly asks.",
  ].join(" ");
}
