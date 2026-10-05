import enCoverage from './en.coverage.js';
import esCoverage from './es.coverage.js';
import ptCoverage from './pt.coverage.js';
import itCoverage from './it.coverage.js';
import frCoverage from './fr.coverage.js';
import deCoverage from './de.coverage.js';
import jaCoverage from './ja.coverage.js';
import hiCoverage from './hi.coverage.js';
import arCoverage from './ar.coverage.js';
import zhCoverage from './zh.coverage.js';
import ruCoverage from './ru.coverage.js';
import nlCoverage from './nl.coverage.js';
import elCoverage from './el.coverage.js';
import plCoverage from './pl.coverage.js';
import gaCoverage from './ga.coverage.js';
import nahCoverage from './nah.coverage.js';
import yuaCoverage from './yua.coverage.js';
import en from './en.js';
import es from './es.js';
import pt from './pt.js';
import it from './it.js';
import fr from './fr.js';
import de from './de.js';
import ja from './ja.js';
import hi from './hi.js';
import ar from './ar.js';
import zh from './zh.js';
import ru from './ru.js';
import nl from './nl.js';
import el from './el.js';
import pl from './pl.js';
import ga from './ga.js';
import nah from './nah.js';
import yua from './yua.js';
export { default as PHONICS_TARGET_NAMES } from './names.js';

export const PHONICS_LEVELS = Object.freeze(['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export const PHONICS_SUPPORTS = Object.freeze(['en', 'es', 'pt', 'it', 'fr', 'de', 'ja', 'hi', 'ar', 'zh']);
export const PHONICS_CURRICULUM = Object.freeze({ en, es, pt, it, fr, de, ja, hi, ar, zh, ru, nl, el, pl, ga, nah, yua });
export const PHONICS_COVERAGE = Object.freeze({ en: enCoverage, es: esCoverage, pt: ptCoverage, it: itCoverage, fr: frCoverage, de: deCoverage, ja: jaCoverage, hi: hiCoverage, ar: arCoverage, zh: zhCoverage, ru: ruCoverage, nl: nlCoverage, el: elCoverage, pl: plCoverage, ga: gaCoverage, nah: nahCoverage, yua: yuaCoverage });
export const PHONICS_TARGETS = Object.freeze(Object.keys(PHONICS_CURRICULUM));
export const PHONICS_VERSION = 'authored-v1';

export function initialPhonicsLevel({ placementLevel, cefrLevel } = {}) {
  return PHONICS_LEVELS.includes(placementLevel) ? placementLevel
    : PHONICS_LEVELS.includes(cefrLevel) ? cefrLevel : 'Pre-A1';
}

// This only selects explicit fields. It does not translate, compose guidance,
// invent practice words, or fall back to a different support/target language.
export function getAuthoredPhonicsDeck(target, support, level) {
  const lesson = PHONICS_CURRICULUM[target]?.[level];
  const row = lesson?.copy[support];
  if (!row || row.length !== lesson.examples.length + 2) return [];
  const deckId = `${PHONICS_VERSION}:${target}:${level}`;
  const cards = lesson.examples.map(([slug, display, word], index) => ({
    id: `${deckId}:${slug}`,
    deckId,
    curriculumVersion: PHONICS_VERSION,
    authored: true,
    supportLanguage: support,
    targetLang: target,
    cefrLevel: level,
    type: 'sound',
    letter: display,
    tts: word,
    practiceWord: word,
    practiceWordMeaning: { [support]: row[index + 2] },
    name: '',
    sound: row[0],
    tip: row[1],
  }));
  const coverage = PHONICS_COVERAGE[target]?.[level];
  const instructions = Array.isArray(coverage) ? row : coverage?.copy?.[support];
  const exercises = Array.isArray(coverage) ? coverage : coverage?.drills;
  if (!instructions || !Array.isArray(exercises)) return [];
  const seen = new Set(cards.map(card => level === 'Pre-A1' ? card.letter + ':' + card.practiceWord : card.practiceWord));
  for (const exercise of exercises) {
    const [display, word] = typeof exercise === 'string' ? [exercise, exercise] : exercise;
    const key = level === 'Pre-A1' ? display + ':' + word : word;
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push({
      id: deckId + ':coverage:' + encodeURIComponent(display) + ':' + encodeURIComponent(word),
      deckId, curriculumVersion: PHONICS_VERSION, authored: true, pronunciationDrill: true,
      supportLanguage: support, targetLang: target, cefrLevel: level, type: 'sound',
      letter: display, tts: word, practiceWord: word, practiceWordMeaning: {},
      name: '', sound: instructions[0], tip: instructions[1],
    });
  }
  return cards;
}

// Remote progress may supply counts, never practice text or explanations.
export function partitionPhonicsProgress(cards, documents) {
  const counts = {};
  for (const document of documents) {
    if (document.targetLang !== cards[0]?.targetLang || !Number.isSafeInteger(document.correctCount) || document.correctCount <= 0) continue;
    counts[document.letterId] = Math.max(counts[document.letterId] || 0, document.correctCount);
  }
  return {
    counts,
    remaining: cards.filter(card => !counts[card.id]),
    collected: cards.filter(card => counts[card.id]),
  };
}

export function getAuthoredPhonicsFocusCards(focus) {
  const item = focus.plan?.items?.[0];
  const captured = item?.sourceContext?.card;
  const level = initialPhonicsLevel({ cefrLevel: focus.blueprint?.cefrLevel || item?.cefrLevel });
  const requested = getAuthoredPhonicsDeck(focus.targetLang, focus.supportLang, level);
  const id = captured?.id || (typeof item?.sourceContext === 'string' ? item.sourceContext : '');
  const word = captured?.practiceWord || item?.originalAnswer || item?.expectedAnswer || focus.blueprint?.targetLanguage?.[0];
  const all = PHONICS_LEVELS.flatMap(level => getAuthoredPhonicsDeck(focus.targetLang, focus.supportLang, level));
  const first = all.find(card => card.id === id) || requested.find(card => card.practiceWord === word)
    || all.find(card => card.practiceWord === word);
  // An arbitrary goal word must retain its objective in Tutor. Never mark a
  // different phonics word as success on the original goal or repair.
  if (!first) return [];
  const siblings = getAuthoredPhonicsDeck(focus.targetLang, focus.supportLang, first.cefrLevel);
  return [first, ...siblings.filter(card => card.id !== first.id)].slice(0, focus.blueprint ? 2 : 3);
}

export const PHONICS_CONTROLS = Object.freeze({
  en: { level: 'Practice level', next: 'Next level', repeat: 'Practice again', complete: 'This collection is complete.', subhead: 'Practice sounds, stress and rhythm at your level.' },
  es: { level: 'Nivel de práctica', next: 'Siguiente nivel', repeat: 'Practicar de nuevo', complete: 'Esta colección está completa.', subhead: 'Practica sonidos, acento y ritmo según tu nivel.' },
  pt: { level: 'Nível de prática', next: 'Próximo nível', repeat: 'Praticar novamente', complete: 'Esta coleção está completa.', subhead: 'Pratique sons, acento e ritmo no seu nível.' },
  it: { level: 'Livello di pratica', next: 'Livello successivo', repeat: 'Pratica di nuovo', complete: 'Questa raccolta è completa.', subhead: 'Pratica suoni, accento e ritmo al tuo livello.' },
  fr: { level: 'Niveau de pratique', next: 'Niveau suivant', repeat: 'Pratiquer à nouveau', complete: 'Cette collection est complète.', subhead: 'Pratique les sons, les accents et le rythme à ton niveau.' },
  de: { level: 'Übungsniveau', next: 'Nächste Stufe', repeat: 'Erneut üben', complete: 'Diese Sammlung ist vollständig.', subhead: 'Übe Laute, Betonung und Rhythmus auf deinem Niveau.' },
  ja: { level: '練習レベル', next: '次のレベル', repeat: 'もう一度練習', complete: 'このコレクションは完了です。', subhead: '自分のレベルに合った音・強勢・リズムを練習します。' },
  hi: { level: 'अभ्यास स्तर', next: 'अगला स्तर', repeat: 'फिर अभ्यास करें', complete: 'यह संग्रह पूरा है।', subhead: 'अपने स्तर पर ध्वनि, बल और लय का अभ्यास करें।' },
  ar: { level: 'مستوى التدريب', next: 'المستوى التالي', repeat: 'تدرب مرة أخرى', complete: 'اكتملت هذه المجموعة.', subhead: 'تدرب على الأصوات والنبر والإيقاع في مستواك.' },
  zh: { level: '练习级别', next: '下一级', repeat: '再次练习', complete: '本组已完成。', subhead: '按你的级别练习发音、重音和节奏。' },
});
