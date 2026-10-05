import test from 'node:test';
import assert from 'node:assert/strict';
import { PHONICS_TARGETS, PHONICS_LEVELS, PHONICS_SUPPORTS, getAuthoredPhonicsDeck } from './index.js';

const legacySizes = { en: 30, es: 38, pt: 40, it: 39, fr: 49, de: 41, ja: 15, ru: 33, nl: 38, el: 24, pl: 32, ga: 25, nah: 23, yua: 12 };
test('beginner coverage never shrinks the previous inventories and every higher pair has substantial practice', () => {
  for (const target of PHONICS_TARGETS) for (const support of PHONICS_SUPPORTS) {
    assert.ok(getAuthoredPhonicsDeck(target, support, 'Pre-A1').length >= (legacySizes[target] || 28), target + '/' + support);
    for (const level of PHONICS_LEVELS.slice(1)) assert.ok(getAuthoredPhonicsDeck(target, support, level).length >= 24, target + '/' + support + '/' + level);
  }
});

test('critical script and sound combinations are explicitly present in the foundation', () => {
  const required = {
    de: ['Ä', 'Ö', 'Ü', 'ß', 'ch', 'sch', 'sp', 'st', 'ei', 'ie', 'eu', 'äu', 'au', 'pf', 'ng', 'kn'],
    ja: ['あ','い','う','え','お','か','し','ち','つ','ふ','を','ん','ぎ','ぢ','づ','ぽ','きゃ','きゅ','きょ','ア','ヲ','ン','ギ','ヂ','ヅ','ポ','キャ','キュ','キョ','っ','ッ','ー'],
    hi: ['ऋ','ङ','ञ','ण','क्ष','त्र','ज्ञ','श्र','क़','ख़','ग़','ज़','फ़','ड़','ढ़','ँ','्'],
    ar: ['ث','ح','خ','ذ','ص','ض','ط','ظ','ع','غ','ق','ء','ة','ى','لا','ّ','ْ'],
    zh: ['b ·','p ·','j ·','q ·','x ·','zh ·','ch ·','sh ·','ü ·','ang ·','eng ·','ong ·','er ·','ueng ·','ün ·','mā','má','mǎ','mà','ma'],
    pl: ['Ą','Ć','Ę','Ł','Ń','Ó','Ś','Ź','Ż','SZ','CZ','RZ','CH','DZ','DŹ','DŻ'],
    yua: ["aa","áa","a'a","a'","ee","ée","e'e","e'","ii","íi","i'i","i'","oo","óo","o'o","o'","uu","úu","u'u","u'","k'","p'","t'","ch'","ts'"],
  };
  for (const [target, labels] of Object.entries(required)) {
    const cards = getAuthoredPhonicsDeck(target, 'hi', 'Pre-A1');
    for (const label of labels) assert.ok(cards.some(card => card.letter.includes(label)), target + ': ' + label);
  }
});

test('the original 476 card identities and localized meanings remain present after expansion', () => {
  let original = 0;
  for (const target of PHONICS_TARGETS) for (const level of PHONICS_LEVELS) {
    const cards = getAuthoredPhonicsDeck(target, 'hi', level);
    const old = cards.filter(card => !card.pronunciationDrill);
    assert.equal(old.length, 4);
    assert.ok(old.every(card => card.id.startsWith('authored-v1:' + target + ':' + level + ':') && card.practiceWordMeaning.hi));
    assert.equal(new Set(cards.map(card => card.id)).size, cards.length);
    original += old.length;
  }
  assert.equal(original, 476);
});
