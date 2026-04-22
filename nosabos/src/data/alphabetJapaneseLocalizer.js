/**
 * Adds Japanese support-language copy to alphabet bootcamp payloads.
 *
 * Most alphabet datasets already carry authored English/Spanish guidance. This
 * pass adds Japanese fields so the UI can resolve `soundJa`, `tipJa`, and
 * `practiceWordMeaning.ja` without falling through to the English-only keys.
 */

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const INSTRUCTION_TRANSLATIONS = {
  "like 'ah' in 'father'": "英語 father の 'ah' のような音",
  "like 'ee' in 'see'": "英語 see の 'ee' のような音",
  "like 'oo' in 'food' (unrounded)": "英語 food の 'oo' に近い、唇を丸めすぎない音",
  "like 'e' in 'bed'": "英語 bed の 'e' に近い音",
  "like 'o' in 'organ'": "英語 organ の 'o' に近い音",
  "'sa' (unvoiced s)": "無声音の 'sa'",
  "'na'": "'na' の音",
  "'ma'": "'ma' の音",
  "'ya'": "'ya' の音",
  "'ra' with a light tap": "舌を軽くはじく 'ra' の音",
  "hiragana and katakana share the same sound.":
    "ひらがなとカタカナは同じ音を表します。",
  "keep it short": "短く発音しましょう。",
  "lips stay relaxed": "唇をリラックスさせます。",
  "a clean mid-vowel": "きれいな中舌母音です。",
  "rounded but short": "丸めますが短く発音します。",
};

const MEANING_TRANSLATIONS = {
  rain: "雨",
  dog: "犬",
  sea: "海",
  station: "駅",
  tea: "お茶",
  umbrella: "傘",
  "cherry blossom": "桜",
  egg: "卵",
  summer: "夏",
  "flower/nose": "花/鼻",
  town: "町",
  mountain: "山",
  night: "夜",
  person: "人",
  book: "本",
  water: "水",
  house: "家",
  mother: "母",
  father: "父",
  friend: "友達",
  school: "学校",
  food: "食べ物",
  red: "赤",
  blue: "青",
  green: "緑",
  white: "白",
  black: "黒",
  hello: "こんにちは",
  goodbye: "さようなら",
  "thank you": "ありがとう",
};

export function translateAlphabetInstructionToJapanese(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  const key = normalizeKey(source);
  if (INSTRUCTION_TRANSLATIONS[key]) return INSTRUCTION_TRANSLATIONS[key];
  const partial = Object.entries(INSTRUCTION_TRANSLATIONS).find(([needle]) =>
    key.includes(needle),
  );
  return partial ? partial[1] : source;
}

export function translateAlphabetMeaningToJapanese(value) {
  if (value && typeof value === "object") {
    return (
      value.ja ||
      translateAlphabetMeaningToJapanese(
        value.en || value.es || value.it || value.fr,
      )
    );
  }
  const source = String(value || "").trim();
  if (!source) return "";
  return MEANING_TRANSLATIONS[normalizeKey(source)] || source;
}

const addJapaneseAlphabetCopy = (letter) => {
  const sourceSound = letter.soundJa || letter.soundEs || letter.sound;
  const sourceTip = letter.tipJa || letter.tipEs || letter.tip;
  const meaning = letter.practiceWordMeaning || {};
  return {
    ...letter,
    soundJa: letter.soundJa || translateAlphabetInstructionToJapanese(sourceSound),
    tipJa: letter.tipJa || translateAlphabetInstructionToJapanese(sourceTip),
    practiceWordMeaning: {
      ...meaning,
      ja:
        meaning.ja ||
        translateAlphabetMeaningToJapanese(
          meaning.en || meaning.es || meaning.it || meaning.fr,
        ),
    },
  };
};

export const withJapaneseAlphabetSupport = (letters = []) =>
  letters.map(addJapaneseAlphabetCopy);
