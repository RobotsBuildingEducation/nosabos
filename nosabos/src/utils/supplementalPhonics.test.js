import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSupplementalPhonicsDeck, supplementalPhonicsRecord, restoreSupplementalPhonics, supplementalPhonicsEvents } from './supplementalPhonics.js';
import { getAuthoredPhonicsDeck } from '../data/phonics/index.js';
import { getPhonicsCourseProgress } from './phonicsCourseProgress.js';
import { phonicsCompletionEvidence } from '../achievements/phonicsProgress.js';

const options = { target: 'de', support: 'hi', level: 'C2', batchId: 1728000000000000 };
const words = ['Genau genommen ist das offen.', 'So habe ich es nicht gemeint.', 'Das bleibt zunächst unklar.', 'Wir sollten abwarten.', 'Lassen Sie mich ergänzen.', 'Es bedarf einer Erklärung.'];
const units = words.map(exampleWord => ({ grapheme: exampleWord, exampleWord, sound: 'स्पष्ट वाक्य और लय।', tip: 'नमूना सुनकर पूरे वाक्य को दोहराएँ।', meaning: 'वाक्य का अर्थ।' }));
const deck = () => buildSupplementalPhonicsDeck(units, options);

test('continuation keeps its level and localized copy and survives persisted reloads', () => {
  const cards = deck();
  assert.equal(cards.length, 6);
  assert.ok(cards.every(card => card.cefrLevel === 'C2' && card.supportLanguage === 'hi' && !card.authored));
  const records = cards.map(supplementalPhonicsRecord);
  assert.deepEqual(restoreSupplementalPhonics('de', 'hi', 'C2', records), cards);
  assert.deepEqual(restoreSupplementalPhonics('de', 'ja', 'C2', records), []);
  assert.deepEqual(restoreSupplementalPhonics('de', 'hi', 'B2', records), []);
  assert.deepEqual(restoreSupplementalPhonics('es', 'hi', 'C2', records), []);
  assert.equal(restoreSupplementalPhonics('de', 'hi', 'C2', [...records, ...records]).length, 6);
});

test('missing localized fields and English fallback content are rejected as a whole batch', () => {
  for (const key of ['grapheme', 'exampleWord', 'sound', 'tip', 'meaning']) {
    const missing = structuredClone(units); missing[3][key] = '';
    assert.throws(() => buildSupplementalPhonicsDeck(missing, options));
  }
  const english = structuredClone(units);
  english[0].tip = 'Listen carefully and keep the vowel steady.';
  assert.throws(() => buildSupplementalPhonicsDeck(english, options));
  english[0].tip += ' न';
  assert.throws(() => buildSupplementalPhonicsDeck(english, options));
  assert.throws(() => buildSupplementalPhonicsDeck(units.slice(1), options));
  assert.throws(() => buildSupplementalPhonicsDeck(units, { ...options, level: 'unknown' }));
});

test('repeat words are rejected, including canonical words and case differences', () => {
  const repeated = structuredClone(units); repeated[1].exampleWord = repeated[0].exampleWord.toUpperCase();
  assert.throws(() => buildSupplementalPhonicsDeck(repeated, options));
  assert.throws(() => buildSupplementalPhonicsDeck(units, { ...options, existingWords: [words[0]] }));
});

test('partial, corrupt and mixed-language persisted batches stay out of the playable collection', () => {
  const records = deck().map(supplementalPhonicsRecord);
  assert.deepEqual(restoreSupplementalPhonics('de', 'hi', 'C2', records.slice(1)), []);
  const corrupt = structuredClone(records); corrupt[2].deckId = 'unrelated';
  assert.deepEqual(restoreSupplementalPhonics('de', 'hi', 'C2', corrupt), []);
  const mixed = structuredClone(records); mixed[2].supportLanguage = 'en';
  assert.deepEqual(restoreSupplementalPhonics('de', 'hi', 'C2', mixed), []);
});

test('all six acknowledged successes earn one stable deck event without changing canonical requirements or level gates', () => {
  const records = deck().map(card => ({ ...supplementalPhonicsRecord(card), correctCount: 1 }));
  assert.deepEqual(supplementalPhonicsEvents('de', records.map((record, index) => ({ ...record, correctCount: index === 5 ? 0 : 1 }))), []);
  const events = supplementalPhonicsEvents('de', records);
  assert.equal(events.length, 1);
  assert.deepEqual(supplementalPhonicsEvents('de', [...records, ...records]), events);
  assert.deepEqual(supplementalPhonicsEvents('es', records), []);
  const required = getAuthoredPhonicsDeck('de', 'hi', 'Pre-A1');
  const evidence = phonicsCompletionEvidence('de', required, records);
  assert.deepEqual(evidence.events, []);
  assert.deepEqual(evidence.evidence.sets.phonics_cards.required, required.map(card => card.id));
  const progress = getPhonicsCourseProgress({ cards: required, counts: Object.fromEntries(records.map(record => [record.letterId, 1])) });
  assert.equal(progress.levels['Pre-A1'].completed, 0);
  assert.equal(progress.unlockedLevel, 'Pre-A1');
});
