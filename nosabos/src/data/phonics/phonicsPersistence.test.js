import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSupplementalPhonicsDeck, supplementalPhonicsRecord } from '../../utils/supplementalPhonics.js';

// Execute the production save functions with Firestore's increment contract.
// Both reads deliberately see the same old document, as two devices can.
const component = fs.readFileSync(new URL('../../components/AlphabetBootcamp.jsx', import.meta.url), 'utf8');
const saves = component.slice(component.indexOf('async function saveAlphabetProgress('), component.indexOf('const getPracticeLetterMarker'));

test('concurrent phonics attempts and repeating a word never erase a completed card', async () => {
  const records = new Map();
  const snapshots = new Map();
  const doc = (_database, ...segments) => segments.join('/');
  const functions = new Function('database', 'doc', 'getDoc', 'setDoc', 'increment', 'serverTimestamp',
    saves + '\nreturn { saveAlphabetProgress, saveAlphabetPracticeWord };');
  const { saveAlphabetProgress, saveAlphabetPracticeWord } = functions({}, doc,
    async reference => ({ exists: () => snapshots.has(reference), data: () => snapshots.get(reference) }),
    async (reference, fields) => {
      const updated = { ...records.get(reference) };
      for (const [key, value] of Object.entries(fields)) {
        updated[key] = value?.increment !== undefined ? (updated[key] || 0) + value.increment : value;
      }
      records.set(reference, updated);
    }, amount => ({ increment: amount }), () => 123);

  const id = 'authored-v1:de:B2:rad';
  const reference = doc({}, 'users', 'account-a', 'alphabetPractice', `de_${id}`);
  records.set(reference, { correctCount: 2, attempts: 2 });
  snapshots.set(reference, { ...records.get(reference) });
  await Promise.all([
    saveAlphabetProgress('account-a', 'de', id, 'Rad', true, { hi: 'पहिया' }),
    saveAlphabetProgress('account-a', 'de', id, 'Rad', true, { hi: 'पहिया' }),
    saveAlphabetProgress('account-a', 'de', id, 'Rad', false, { hi: 'पहिया' }),
  ]);
  assert.equal(records.get(reference).correctCount, 4);
  assert.equal(records.get(reference).attempts, 5);
  await saveAlphabetPracticeWord('account-a', 'de', id, 'Rad', { ja: '車輪' });
  assert.equal(records.get(reference).correctCount, 4);
  assert.equal(records.get(reference).attempts, 5);
  await saveAlphabetProgress('account-b', 'de', id, 'Rad', true, { hi: 'पहिया' });
  assert.equal(records.get(doc({}, 'users', 'account-b', 'alphabetPractice', `de_${id}`)).correctCount, 1);
  assert.equal(records.get(reference).correctCount, 4);
});

test('generated definitions commit atomically without erasing attempts, and rejected saves stay rejected', async () => {
  const source = component.slice(component.indexOf('async function saveSupplementalPhonicsDeck('), component.indexOf('const getPracticeLetterMarker'));
  const cards = buildSupplementalPhonicsDeck(Array.from({ length: 6 }, (_, index) => ({
    grapheme: 'ch', exampleWord: 'Example ' + index,
    sound: 'Listen to this sound.', tip: 'Keep the ending clear.', meaning: 'An example.',
  })), { target: 'en', support: 'en', level: 'C2', batchId: 1728000000000000 });
  const writes = [];
  let rejected = false;
  const save = new Function('database', 'writeBatch', 'doc', 'serverTimestamp', 'supplementalPhonicsRecord',
    source + '\nreturn saveSupplementalPhonicsDeck;')({},
    () => ({
      set: (reference, fields, options) => writes.push({ reference, fields, options }),
      commit: async () => { if (rejected) throw new Error('Relay unavailable'); },
    }), (_database, ...segments) => segments.join('/'), () => 123, supplementalPhonicsRecord);
  await save('account-a', cards);
  assert.equal(writes.length, 6);
  for (const write of writes) {
    assert.ok(write.reference.startsWith('users/account-a/alphabetPractice/en_gen_'));
    assert.deepEqual(write.options, { merge: true });
    assert.ok(!Object.hasOwn(write.fields, 'correctCount'));
    assert.ok(!Object.hasOwn(write.fields, 'attempts'));
  }
  rejected = true;
  await assert.rejects(save('account-a', cards), /unavailable/);
});
