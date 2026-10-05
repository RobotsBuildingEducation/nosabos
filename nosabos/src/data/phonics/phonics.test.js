import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SUPPORT_LANGUAGE_CODES } from '../../constants/supportLanguages.js';
import { PHONICS_CURRICULUM, PHONICS_COVERAGE, PHONICS_LEVELS, PHONICS_TARGETS, PHONICS_SUPPORTS, PHONICS_CONTROLS, PHONICS_TARGET_NAMES, getAuthoredPhonicsDeck, initialPhonicsLevel, partitionPhonicsProgress, getAuthoredPhonicsFocusCards } from './index.js';
import { phonicsCompletionEvidence } from '../../achievements/phonicsProgress.js';
import { earnedProgressionIds } from '../../achievements/progressionEvidence.js';

test('all 1190 target/support/level decks contain explicitly authored complete copy', () => {
  assert.deepEqual(PHONICS_SUPPORTS, SUPPORT_LANGUAGE_CODES);
  assert.equal(PHONICS_TARGETS.length, 17);
  let total = 0;
  const ids = new Set();
  for (const target of PHONICS_TARGETS) for (const level of PHONICS_LEVELS) {
    const lesson = PHONICS_CURRICULUM[target][level];
    assert.ok(getAuthoredPhonicsDeck(target, 'en', level).length >= 24, `${target}/${level}`);
    assert.deepEqual(Object.keys(lesson.copy).sort(), [...SUPPORT_LANGUAGE_CODES].sort());
    const reference = getAuthoredPhonicsDeck(target, 'en', level).map(card => card.id);
    reference.forEach(id => { assert.ok(!ids.has(id), id); ids.add(id); });
    for (const support of PHONICS_SUPPORTS) {
      assert.ok(PHONICS_TARGET_NAMES[support][target]?.trim(), `${target}/${support} heading`);
      const cards = getAuthoredPhonicsDeck(target, support, level);
      assert.deepEqual(cards.map(card => card.id), reference, 'support switch preserves identity');
      for (const [index, card] of cards.entries()) {
        assert.equal(card.cefrLevel, level);
        assert.equal(card.supportLanguage, support);
        for (const text of [card.sound, card.tip, card.practiceWord, ...(card.pronunciationDrill ? [] : [card.practiceWordMeaning[support]])]) assert.ok(typeof text === 'string' && text.trim(), `${target}/${support}/${level}`);
        const coverage = PHONICS_COVERAGE[target][level];
        const instructions = card.pronunciationDrill && !Array.isArray(coverage) ? coverage.copy : lesson.copy;
        assert.equal(card.sound, instructions[support][0]);
        assert.equal(card.tip, instructions[support][1]);
        if (card.pronunciationDrill) assert.deepEqual(card.practiceWordMeaning, {}, 'drills never invent vocabulary glosses');
        else assert.equal(card.practiceWordMeaning[support], lesson.copy[support][index + 2]);
        if (support !== 'en') assert.notEqual(card.tip, lesson.copy.en[1], `${target}/${support}/${level} English copy`);
        if (support === 'hi') assert.match(card.tip, /[\u0900-\u097F]/u);
        if (support === 'ja') assert.match(card.tip, /[\u3040-\u30ff]/u);
        if (support === 'ar') assert.match(card.tip, /[\u0600-\u06ff]/u);
        if (support === 'zh') assert.match(card.tip, /[\u4e00-\u9fff]/u);
      }
      total++;
    }
  }
  assert.equal(total, 1190);
  assert.ok(ids.size > 3500);
  for (const support of PHONICS_SUPPORTS) assert.ok(Object.values(PHONICS_CONTROLS[support]).every(text => text.trim()));
});

test('missing pairs fail closed instead of falling back to Russian or English', () => {
  assert.deepEqual(getAuthoredPhonicsDeck('unknown', 'hi', 'A1'), []);
  assert.deepEqual(getAuthoredPhonicsDeck('de', 'unknown', 'A1'), []);
  assert.deepEqual(getAuthoredPhonicsDeck('de', 'hi', 'unknown'), []);
  const text = JSON.stringify(getAuthoredPhonicsDeck('de', 'hi', 'Pre-A1'));
  assert.doesNotMatch(text, /kite|book|moon|aspiration|English/i);
});

test('placement opens the appropriate first deck at every level', () => {
  for (const level of PHONICS_LEVELS) assert.equal(initialPhonicsLevel({ placementLevel: level, cefrLevel: 'Pre-A1' }), level);
  assert.equal(initialPhonicsLevel({ cefrLevel: 'B2' }), 'B2');
  assert.equal(initialPhonicsLevel({ placementLevel: 'invalid' }), 'Pre-A1');
});

test('saved progress cannot replace authored words or leak another support language', () => {
  const cards = getAuthoredPhonicsDeck('de', 'hi', 'B2');
  const state = partitionPhonicsProgress(cards, [
    { letterId: cards[0].id, targetLang: 'de', correctCount: 1, currentWord: 'English leak', currentMeaning: { en: 'wrong' }, tip: 'wrong' },
    { letterId: cards[1].id, targetLang: 'es', correctCount: 1 },
    { letterId: cards[2].id, targetLang: 'de', correctCount: -1 },
    { letterId: 'gen_1_0', targetLang: 'de', correctCount: 1, generated: true },
  ]);
  assert.deepEqual(state.collected, [cards[0]]);
  assert.deepEqual(state.remaining, cards.slice(1));
  assert.equal(state.collected[0].practiceWord, 'Rad');
  assert.equal(state.collected[0].practiceWordMeaning.hi, 'पहिया');
  assert.deepEqual(partitionPhonicsProgress(cards, []).collected, []);
  const merged = partitionPhonicsProgress(cards, [
    { letterId: cards[0].id, targetLang: 'de', correctCount: 6 },
    { letterId: cards[0].id, targetLang: 'de', correctCount: 1 },
  ]);
  assert.equal(merged.counts[cards[0].id], 6, 'optimistic completion cannot reduce acknowledged progress');
});

test('authored decks only count after every canonical card is completed; retries retain event IDs', () => {
  const cards = getAuthoredPhonicsDeck('de', 'hi', 'B2');
  const records = cards.map(card => ({ letterId: card.id, targetLang: 'de', correctCount: 1 }));
  assert.deepEqual(phonicsCompletionEvidence('de', cards, records.slice(1)).events, []);
  const proof = phonicsCompletionEvidence('de', cards, records);
  assert.equal(proof.events.length, 1);
  assert.deepEqual(phonicsCompletionEvidence('de', cards, [...records, { letterId: 'gen_1_0', generated: true, correctCount: 0 }]).events, proof.events);
  assert.deepEqual(phonicsCompletionEvidence('de', getAuthoredPhonicsDeck('de', 'ja', 'B2'), records).events, proof.events);
  assert.deepEqual(phonicsCompletionEvidence('es', cards, records).events, []);
});

test('completing one level earns a deck without prematurely earning the entire phonics curriculum', () => {
  const all = PHONICS_LEVELS.flatMap(level => getAuthoredPhonicsDeck('de', 'hi', level));
  const records = all.map(card => ({ letterId: card.id, targetLang: 'de', correctCount: 1 }));
  const firstDeckSize = getAuthoredPhonicsDeck('de', 'hi', 'Pre-A1').length;
  const first = phonicsCompletionEvidence('de', all, records.slice(0, firstDeckSize));
  assert.equal(first.events.length, 1);
  assert.equal(first.evidence.sets.phonics_cards.required.length, all.length);
  assert.ok(!earnedProgressionIds('nosabos', first.evidence).includes('nosabos_phonics_cards_all'));
  const complete = phonicsCompletionEvidence('de', all, records);
  assert.equal(complete.events.length, 7);
  assert.ok(earnedProgressionIds('nosabos', complete.evidence).includes('nosabos_phonics_cards_all'));
});

test('the fixed and focused curriculum use authored lookup independently of optional continuation', () => {
  const ui = fs.readFileSync(new URL('../../components/AlphabetBootcamp.jsx', import.meta.url), 'utf8');
  assert.match(ui, /getAuthoredPhonicsDeck\(targetLang, uiLang, activeLevel\)/);
  assert.doesNotMatch(ui, /alphabet\w+Localizer|translateAlphabetMeaning|generateNewPhonicsUnits|LANGUAGE_ALPHABETS/);
  const focused = fs.readFileSync(new URL('../../utils/focusedPracticeDecks.js', import.meta.url), 'utf8').split('export async function getFocusedPhonicsDeck')[1].split('export async function getGoalFlashcards')[0];
  assert.match(focused, /getAuthoredPhonicsFocusCards/);
  assert.doesNotMatch(focused, /callResponses|item\?\.summary/);
  const languages = fs.readFileSync(new URL('../../constants/languages.js', import.meta.url), 'utf8');
  for (const code of ['ar','hi','zh']) assert.match(languages, new RegExp('value: "' + code + '"[^}]*practiceEnabled: false'));
});

test('focused practice preserves the requested authored word across levels and reroutes unsupported words', () => {
  const cards = getAuthoredPhonicsFocusCards({ targetLang: 'es', supportLang: 'hi', plan: { items: [{ originalAnswer: 'perro', cefrLevel: 'B2' }] } });
  assert.equal(cards[0].practiceWord, 'perro');
  assert.equal(cards[0].cefrLevel, 'A1');
  assert.match(cards[0].tip, /[\u0900-\u097F]/u);
  assert.deepEqual(getAuthoredPhonicsFocusCards({ targetLang: 'es', supportLang: 'hi', blueprint: { targetLanguage: ['an arbitrary uncovered phrase'] } }), []);
});
