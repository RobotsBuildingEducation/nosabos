import { translateFlashcardConceptToChinese } from "./flashcards/chineseLocalizer.js";

/**
 * Adds Mandarin Chinese support-language copy to alphabet bootcamp payloads.
 *
 * The component renders data fields directly, so this layer must provide
 * Chinese-only `nameZh`, `soundZh`, `tipZh`, and `practiceWordMeaning.zh`
 * fields instead of relying on render-time English fallbacks.
 */

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/[¿¡]/g, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");

const compactWhitespace = (value) =>
  String(value || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const EXACT_NAME_TRANSLATIONS = {
  [normalizeKey("Lange IJ")]: "长 IJ",
  [normalizeKey("Griekse ij")]: "希腊式 ij",
  [normalizeKey("E met trema")]: "带分音符的 E",
  [normalizeKey("I met trema")]: "带分音符的 I",
  [normalizeKey("Silent Letters")]: "不发音字母",
  [normalizeKey("Word Stress")]: "单词重音",
  [normalizeKey("TH (voiced)")]: "有声 TH",
  [normalizeKey("TH (unvoiced)")]: "无声 TH",
  [normalizeKey("Nasal AN/EN")]: "鼻化 AN/EN",
  [normalizeKey("Nasal ON")]: "鼻化 ON",
  [normalizeKey("Nasal IN")]: "鼻化 IN",
  [normalizeKey("Nasal UN")]: "鼻化 UN",
  [normalizeKey("Flap T")]: "闪音 T",
  [normalizeKey("R (American)")]: "美式 R",
  [normalizeKey("Soft sign")]: "软音符号",
  [normalizeKey("Hard sign")]: "硬音符号",
  [normalizeKey("Glottal stop (')")]: "喉塞音",
  [normalizeKey("Clear L")]: "清晰 L",
  [normalizeKey("Dark L")]: "深色 L",
  [normalizeKey("Double consonants")]: "双辅音",
  [normalizeKey("Liaison")]: "联诵",
  [normalizeKey("Schwa")]: "央元音",
};

const NAME_PATTERNS = [
  [/^(.+) with acute accent$/i, (letter) => `带锐音符的 ${letter}`],
  [/^(.+) with grave accent$/i, (letter) => `带重音符的 ${letter}`],
  [/^(.+) with circumflex$/i, (letter) => `带扬抑符的 ${letter}`],
  [/^(.+) with diaeresis$/i, (letter) => `带分音符的 ${letter}`],
  [/^(.+) with umlaut$/i, (letter) => `带变音符的 ${letter}`],
  [/^(.+) with cedilla$/i, (letter) => `带软音符的 ${letter}`],
  [/^(.+) with tilde$/i, (letter) => `带波浪符的 ${letter}`],
  [/^Nasal (.+)$/i, (value) => `鼻化 ${value}`],
  [/^Final (.+)$/i, (value) => `词尾 ${value}`],
  [/^(.+) \(ending\)$/i, (value) => `词尾 ${value}`],
  [/^(.+) \(voiced\)$/i, (value) => `有声 ${value}`],
  [/^(.+) \(unvoiced\)$/i, (value) => `无声 ${value}`],
  [/^(.+) before (.+)$/i, (value, context) => `${context} 前的 ${value}`],
];

const EXACT_INSTRUCTION_TRANSLATIONS = Object.fromEntries(
  [
    ["A breath of air from the throat", "从喉咙轻轻送出一口气。"],
    ["A brief catch or pause in the throat", "喉咙里有很短的停顿。"],
    ["A soft 'gh', like the 'ch' in Spanish 'lago'", "柔和的 'gh' 音，类似西班牙语 'lago' 里的 'ch'。"],
    ["Always 's' sound", "始终发 's' 音。"],
    ["Both K and N are pronounced", "K 和 N 都要发音。"],
    ["Clear L (Spanish-like)", "清晰的 L，类似西班牙语。"],
    ["Closed 'e' like 'ay' in 'say' without the glide", "闭口 'e' 音，接近 'say' 里的 'ay'，但不要滑音。"],
    ["Closed 'oh' sound", "闭口的 'oh' 音。"],
    ["Guttural sound from back of throat, like clearing throat", "从喉咙后部发出的喉音，像轻轻清嗓子。"],
    ["Hiragana (あ) and Katakana (ア) share the same sound.", "平假名 あ 和片假名 ア 发音相同。"],
    ["No sound - marks beginning of question", "不发音，用来标记疑问句开头。"],
    ["No sound - marks beginning of exclamation", "不发音，用来标记感叹句开头。"],
    ["No sound—softens the consonant before it", "不发音，会软化前面的辅音。"],
    ["No sound—prevents softening and adds a break", "不发音，用来阻止软化并加入停顿。"],
    ["Pronounced separately from adjacent vowel", "和相邻元音分开发音。"],
    ["Pronounced separately from previous vowel", "和前一个元音分开发音。"],
    ["Pure sound; never silent.", "发音纯净，永远不省音。"],
    ["Same as English", "和英语相同。"],
    ["Same as Spanish", "和西班牙语相同。"],
    ["Same as Portuguese", "和葡萄牙语相同。"],
    ["Same as Italian", "和意大利语相同。"],
    ["Same as French", "和法语相同。"],
    ["Same as German", "和德语相同。"],
    ["Same as Dutch", "和荷兰语相同。"],
    ["Same as Polish", "和波兰语相同。"],
    ["Same as Russian", "和俄语相同。"],
    ["Same as Greek", "和希腊语相同。"],
    ["Same as Irish", "和爱尔兰语相同。"],
    ["Same as Japanese", "和日语相同。"],
    ["Same as Nahuatl", "和纳瓦特尔语相同。"],
    ["Same sound as U. Marks historical spelling.", "和 U 发音相同，用来标记历史拼写。"],
    ["Same sound as I. Circumflex marks historical spelling change.", "和 I 发音相同，扬抑符标记历史拼写变化。"],
    ["Short, crisp e sound.", "短而清晰的 e 音。"],
    ["Standard B sound, same as English.", "标准 B 音，和英语相同。"],
    ["Standard F sound.", "标准 F 音。"],
    ["Standard K sound.", "标准 K 音。"],
    ["Standard M sound.", "标准 M 音。"],
    ["Standard N sound.", "标准 N 音。"],
    ["Standard P sound.", "标准 P 音。"],
    ["Standard S sound, always voiceless.", "标准 S 音，始终清音。"],
    ["Standard T sound, tongue touches teeth.", "标准 T 音，舌尖接触牙齿。"],
    ["Touch the tongue tip to the ridge behind the teeth; keep it light.", "舌尖轻触牙齿后方的齿龈，动作保持轻。"],
    ["Upper teeth touch lower lip.", "上齿轻触下唇。"],
  ].map(([source, translation]) => [normalizeKey(source), translation]),
);

const PHRASE_REPLACEMENTS = [
  ["same sound as", "和这个音相同："],
  ["same as", "和它相同："],
  ["sounds like", "听起来像"],
  ["sound like", "听起来像"],
  ["pronounced like", "发音像"],
  ["like English", "像英语"],
  ["like Spanish", "像西班牙语"],
  ["like French", "像法语"],
  ["like German", "像德语"],
  ["like Portuguese", "像葡萄牙语"],
  ["like Italian", "像意大利语"],
  ["like Dutch", "像荷兰语"],
  ["like Polish", "像波兰语"],
  ["like Russian", "像俄语"],
  ["like Greek", "像希腊语"],
  ["like Irish", "像爱尔兰语"],
  ["like Japanese", "像日语"],
  ["at the beginning of a word", "在词首"],
  ["at the beginning", "在开头"],
  ["at the end of a word", "在词尾"],
  ["at the end of words", "在词尾"],
  ["at the end", "在末尾"],
  ["between vowels", "在元音之间"],
  ["before e/i", "在 e/i 前"],
  ["before a/o/u", "在 a/o/u 前"],
  ["with rounded lips", "嘴唇收圆"],
  ["keep lips rounded", "保持嘴唇收圆"],
  ["tip of tongue", "舌尖"],
  ["front of tongue", "舌前部"],
  ["back of tongue", "舌后部"],
  ["air through nose", "气流从鼻腔通过"],
  ["through the nose", "通过鼻腔"],
  ["usually silent", "通常不发音"],
  ["always silent", "始终不发音"],
  ["never silent", "永远不省音"],
  ["not silent", "要发音"],
  ["used in loanwords", "用于外来词"],
  ["used mostly in borrowed words", "主要用于外来词"],
  ["used mostly in foreign words", "主要用于外来词"],
  ["stress this syllable", "重读这个音节"],
  ["stress this word", "重读这个词"],
  ["long sound", "长音"],
  ["short sound", "短音"],
  ["soft sound", "软音"],
  ["hard sound", "硬音"],
  ["open sound", "开口音"],
  ["closed sound", "闭口音"],
  ["nasal sound", "鼻音"],
  ["guttural sound", "喉音"],
];

const QUOTED_TOKEN_RE = /'([^']+)'|"([^"]+)"/g;
const ENGLISH_WORD_RE = /\b(?:the|same|like|sound|sounds|used|word|words|letter|letters|vowel|vowels|consonant|consonants|english|spanish|portuguese|italian|french|german|dutch|polish|russian|greek|irish|japanese|nahuatl|maya|silent|stress|accent|rounded|tongue|lips|mouth|nose|air|voiced|unvoiced|guttural|slender|broad|lenition|trema|umlaut|before|after|with|without|between)\b/i;

const extractQuotedExamples = (source) => {
  const examples = [];
  String(source || "").replace(QUOTED_TOKEN_RE, (_, single, double) => {
    const token = single || double;
    if (token && !examples.includes(token)) examples.push(token);
    return "";
  });
  return examples.slice(0, 4);
};

const repairMixedInstruction = (translation, source) => {
  const compacted = compactWhitespace(translation);
  if (compacted && !ENGLISH_WORD_RE.test(compacted)) {
    return compacted;
  }

  const examples = extractQuotedExamples(source);
  if (examples.length) {
    return `练习这个发音。例词：${examples.map((item) => `'${item}'`).join("、")}。`;
  }

  return `练习这个发音规则。`;
};

export const translateAlphabetMeaningToChinese = (meaning) => {
  if (!meaning) return "";
  if (typeof meaning === "string") {
    return translateFlashcardConceptToChinese(meaning) || "";
  }

  const source =
    meaning.zh ||
    meaning.en ||
    meaning.es ||
    meaning.pt ||
    meaning.it ||
    meaning.fr ||
    meaning.ja ||
    meaning.hi ||
    meaning.ar ||
    "";

  return source ? translateFlashcardConceptToChinese(source) || "词义" : "";
};

export const translateAlphabetNameToChinese = (value, letter = null) => {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^[A-ZÀ-ÖØ-Þ]$/u.test(source)) return "";

  if (letter?.type === "phrase") {
    const phraseMeaning = translateAlphabetMeaningToChinese(
      letter.practiceWordMeaning,
    );
    if (phraseMeaning) return phraseMeaning;
  }

  const exact = EXACT_NAME_TRANSLATIONS[normalizeKey(source)];
  if (exact) return exact;

  const translatedMeaning = translateFlashcardConceptToChinese(source);
  if (translatedMeaning && translatedMeaning !== source) {
    return translatedMeaning;
  }

  for (const [pattern, formatter] of NAME_PATTERNS) {
    const match = source.match(pattern);
    if (match) return formatter(...match.slice(1));
  }

  if (/^[A-ZÀ-ÖØ-Þ0-9' /().-]+$/u.test(source)) {
    return `字母组合 ${source}`;
  }

  return "";
};

export const translateAlphabetInstructionToChinese = (instruction) => {
  const source = compactWhitespace(instruction);
  if (!source) return "";

  const exact = EXACT_INSTRUCTION_TRANSLATIONS[normalizeKey(source)];
  if (exact) return exact;

  let translated = source;
  for (const [phrase, replacement] of PHRASE_REPLACEMENTS) {
    translated = translated.replace(new RegExp(escapeRegex(phrase), "giu"), replacement);
  }

  translated = translated
    .replace(/\blike\s+'([^']+)'\s+in\s+'([^']+)'/giu, (_, sound, word) => `像 '${word}' 里的 '${sound}'`)
    .replace(/\bsame as\s+'([^']+)'\s+in\s+'([^']+)'/giu, (_, sound, word) => `和 '${word}' 里的 '${sound}' 相同`)
    .replace(/\blike\s+'([^']+)'/giu, (_, sound) => `像 '${sound}'`)
    .replace(/\bsay\s+'([^']+)'/giu, (_, sound) => `说 '${sound}'`)
    .replace(/\bSay\b/gu, "说")
    .replace(/\bUse\b/gu, "使用")
    .replace(/\bKeep\b/gu, "保持")
    .replace(/\bPut\b/gu, "放")
    .replace(/\bTouch(?:es)?\b/gu, "接触")
    .replace(/\bPronounce\b/gu, "发音")
    .replace(/\bDon't pronounce\b/giu, "不要发音")
    .replace(/\bThink of\b/gu, "可以想成")
    .replace(/\bMore\b/gu, "更")
    .replace(/\bLess\b/gu, "更少");

  return repairMixedInstruction(translated, source);
};

const addChineseAlphabetCopy = (letter) => {
  if (!letter || typeof letter !== "object") return letter;

  const sourceSound = letter.sound || letter.soundEs || "";
  const sourceTip = letter.tip || letter.tipEs || "";
  const practiceWordMeaning = letter.practiceWordMeaning || {};

  return {
    ...letter,
    nameZh: letter.nameZh || translateAlphabetNameToChinese(letter.name, letter),
    soundZh:
      letter.soundZh || translateAlphabetInstructionToChinese(sourceSound),
    tipZh: letter.tipZh || translateAlphabetInstructionToChinese(sourceTip),
    practiceWordMeaning: {
      ...practiceWordMeaning,
      zh:
        practiceWordMeaning.zh ||
        translateAlphabetMeaningToChinese(practiceWordMeaning),
    },
  };
};

export const withChineseAlphabetSupport = (letters = []) =>
  Array.isArray(letters) ? letters.map(addChineseAlphabetCopy) : letters;
