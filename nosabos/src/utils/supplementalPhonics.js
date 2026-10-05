import { PHONICS_LEVELS, PHONICS_SUPPORTS, PHONICS_TARGETS } from '../data/phonics/index.js';

export const SUPPLEMENTAL_PHONICS_VERSION = 'phonics-extra-v1';
export const SUPPLEMENTAL_DECK_SIZE = 6;
const scripts = { hi: /[\u0900-\u097f]/u, ar: /[\u0600-\u06ff]/u, ja: /[\u3040-\u30ff\u3400-\u9fff]/u, zh: /[\u3400-\u9fff]/u, ru: /[\u0400-\u04ff]/u, el: /[\u0370-\u03ff]/u };
const clean = value => typeof value === 'string' ? value.trim() : '';
const wordKey = value => clean(value).normalize('NFKC').toLocaleLowerCase();
const usesScript = (value, language) => {
  if (!scripts[language]) return true;
  const letters = value.match(/\p{L}/gu) || [];
  return letters.length > 0 && letters.filter(letter => scripts[language].test(letter)).length >= letters.length / 2;
};

// Reject incomplete localized content; never borrow English explanations.
export function buildSupplementalPhonicsDeck(units, { target, support, level, batchId, existingWords = [] }) {
  if (!PHONICS_TARGETS.includes(target) || !PHONICS_SUPPORTS.includes(support) ||
    !PHONICS_LEVELS.includes(level) || !/^\d{13,16}$/.test(String(batchId)) ||
    !Array.isArray(units) || units.length !== SUPPLEMENTAL_DECK_SIZE) throw new Error('Invalid phonics deck');
  const seen = new Set(existingWords.map(wordKey));
  const deckId = [SUPPLEMENTAL_PHONICS_VERSION, target, support, level, batchId].join(':');
  return units.map((unit, index) => {
    const fields = Object.fromEntries(['grapheme', 'exampleWord', 'sound', 'tip', 'meaning'].map(key => [key, clean(unit?.[key])]));
    if (Object.values(fields).some(value => !value || value.length > 600) ||
      [fields.sound, fields.tip, fields.meaning].some(value => !usesScript(value, support)) ||
      !usesScript(fields.exampleWord, target) ||
      seen.has(wordKey(fields.exampleWord))) throw new Error('Incomplete or repeated phonics content');
    seen.add(wordKey(fields.exampleWord));
    return {
      id: 'gen_' + batchId + '_' + index, deckId,
      curriculumVersion: SUPPLEMENTAL_PHONICS_VERSION,
      generated: true, generatedDeckSize: SUPPLEMENTAL_DECK_SIZE,
      supportLanguage: support, targetLang: target, cefrLevel: level,
      type: 'sound', letter: fields.grapheme, name: '', sound: fields.sound, tip: fields.tip,
      tts: fields.exampleWord, practiceWord: fields.exampleWord,
      practiceWordMeaning: { [support]: fields.meaning },
    };
  });
}

export function supplementalPhonicsRecord(card) {
  return {
    letterId: card.id, targetLang: card.targetLang, generated: true,
    generatedDeckSize: card.generatedDeckSize, curriculumVersion: card.curriculumVersion,
    deckId: card.deckId, supportLanguage: card.supportLanguage, cefrLevel: card.cefrLevel,
    grapheme: card.letter, sound: card.sound, tip: card.tip,
    currentWord: card.practiceWord, currentMeaning: card.practiceWordMeaning,
  };
}

// Only a complete persisted batch can become a playable collection.
export function restoreSupplementalPhonics(target, support, level, records) {
  const groups = new Map();
  for (const record of records) {
    if (record.generated !== true || record.curriculumVersion !== SUPPLEMENTAL_PHONICS_VERSION ||
      record.targetLang !== target || record.supportLanguage !== support || record.cefrLevel !== level) continue;
    const match = /^gen_(\d{13,16})_([0-5])$/.exec(record.letterId || '');
    if (!match || record.generatedDeckSize !== SUPPLEMENTAL_DECK_SIZE) continue;
    const group = groups.get(match[1]) || new Map();
    group.set(Number(match[2]), record);
    groups.set(match[1], group);
  }
  const cards = [];
  for (const [batchId, group] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    if (group.size !== SUPPLEMENTAL_DECK_SIZE) continue;
    const batch = Array.from({ length: SUPPLEMENTAL_DECK_SIZE }, (_, index) => group.get(index));
    try {
      const restored = buildSupplementalPhonicsDeck(batch.map(record => ({
        grapheme: record.grapheme, exampleWord: record.currentWord,
        sound: record.sound, tip: record.tip, meaning: record.currentMeaning?.[support],
      })), { target, support, level, batchId });
      if (batch.every((record, index) => record.deckId === restored[index].deckId)) cards.push(...restored);
    } catch { /* Invalid or partially saved batches cannot replace authored cards. */ }
  }
  return cards;
}

export function supplementalPhonicsEvents(target, records) {
  const successful = new Set(records.filter(record => record.targetLang === target &&
    Number.isSafeInteger(record.correctCount) && record.correctCount > 0).map(record => record.letterId));
  const scopes = new Map(records.filter(record => record.targetLang === target && record.generated === true)
    .map(record => [record.supportLanguage + ':' + record.cefrLevel, record]));
  const decks = new Map();
  for (const record of scopes.values()) for (const card of restoreSupplementalPhonics(target, record.supportLanguage, record.cefrLevel, records)) {
    const group = decks.get(card.deckId) || [];
    group.push(card.id); decks.set(card.deckId, group);
  }
  return [...decks].filter(([, ids]) => ids.every(id => successful.has(id)))
    .map(([id]) => ({ metric: 'phonics_decks', id: target + ':' + id }));
}
