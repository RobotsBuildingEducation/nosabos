import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuthoredPhonicsDeck, PHONICS_LEVELS } from '../data/phonics/index.js';
import { getPhonicsCourseProgress, canAccessPhonicsLevel, resolvePhonicsLevel } from './phonicsCourseProgress.js';

const cards = PHONICS_LEVELS.flatMap(level => getAuthoredPhonicsDeck('de', 'en', level));
const completed = (...levels) => Object.fromEntries(cards.filter(card => levels.includes(card.cefrLevel)).map(card => [card.id, 1]));

test('phonics starts at A0 and only sequential completion unlocks the next level', () => {
  const fresh = getPhonicsCourseProgress({ cards });
  assert.equal(fresh.unlockedLevel, 'Pre-A1');
  assert.equal(fresh.levels['Pre-A1'].percentage, 0);
  assert.equal(canAccessPhonicsLevel('A1', fresh.unlockedLevel), false);
  const partial = getPhonicsCourseProgress({ cards, counts: Object.fromEntries(cards.slice(0, 3).map(card => [card.id, 1])) });
  assert.equal(partial.levels['Pre-A1'].percentage, 3 / fresh.levels['Pre-A1'].total * 100);
  assert.equal(partial.unlockedLevel, 'Pre-A1');
  const first = getPhonicsCourseProgress({ cards, counts: { ...completed('Pre-A1'), ...completed('B2') } });
  assert.equal(first.unlockedLevel, 'A1');
  assert.equal(first.levels['Pre-A1'].isComplete, true);
  assert.equal(first.levels.A1.percentage, 0);
  assert.equal(getPhonicsCourseProgress({ cards, counts: completed('Pre-A1', 'A1') }).unlockedLevel, 'A2');
});

test('placement skips lower gates without inventing completion and supports onward phonics progression', () => {
  const placed = getPhonicsCourseProgress({ cards, placementLevel: 'B2' });
  assert.equal(placed.entryLevel, 'B2');
  assert.equal(placed.unlockedLevel, 'B2');
  assert.equal(placed.levels['Pre-A1'].completed, 0);
  assert.equal(placed.levels.B2.percentage, 0);
  assert.equal(canAccessPhonicsLevel('A1', placed.unlockedLevel), true);
  assert.equal(canAccessPhonicsLevel('C1', placed.unlockedLevel), false);
  assert.equal(getPhonicsCourseProgress({ cards, placementLevel: 'B2', counts: completed('B2') }).unlockedLevel, 'C1');
  assert.equal(getPhonicsCourseProgress({ cards, placementLevel: 'B2', counts: completed('B2', 'C1') }).unlockedLevel, 'C2');
  assert.equal(getPhonicsCourseProgress({ cards, placementLevel: 'B2', courseLevel: 'C1' }).entryLevel, 'C1');
});

test('level handlers reject locked and invalid selections while retaining the existing master unlock', () => {
  assert.equal(resolvePhonicsLevel('C2', 'B2'), 'B2');
  assert.equal(resolvePhonicsLevel('A1', 'B2'), 'A1');
  assert.equal(resolvePhonicsLevel('C2', 'B2', true), 'C2');
  assert.equal(canAccessPhonicsLevel('unknown', 'B2', true), false);
  assert.equal(getPhonicsCourseProgress({ cards, placementLevel: 'skipped', courseLevel: 'unknown' }).entryLevel, 'Pre-A1');
  assert.equal(getPhonicsCourseProgress({ cards, counts: completed(...PHONICS_LEVELS) }).unlockedLevel, 'C2');
});

test('only canonical successes count; repeated attempts, legacy records and other targets do not inflate progress', () => {
  const counts = { [cards[0].id]: 40, [cards[1].id]: -1, [cards[2].id]: 0.5, 'gen_1_0': 1, 'authored-v1:es:Pre-A1:a': 1 };
  const state = getPhonicsCourseProgress({ cards, counts });
  assert.equal(state.levels['Pre-A1'].completed, 1);
  assert.ok(Math.abs(state.levels['Pre-A1'].percentage - 100 / state.levels['Pre-A1'].total) < 1e-10);
  assert.equal(state.unlockedLevel, 'Pre-A1');
  const japaneseCards = PHONICS_LEVELS.flatMap(level => getAuthoredPhonicsDeck('de', 'ja', level));
  assert.deepEqual(getPhonicsCourseProgress({ cards: japaneseCards, counts }), state);
});
