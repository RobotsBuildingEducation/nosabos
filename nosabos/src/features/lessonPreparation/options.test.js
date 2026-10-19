import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuestionOptionSelector } from './options.js';
import { DELIGHT_VARIANT_IDS } from '../../utils/delightQuestionVariants.js';
test('prepared quizzes retain the existing shuffled variety and exclude flashcards', () => {
  const select = createQuestionOptionSelector();
  const context = {
    lesson: {
      id: 'quiz-a1',
      isFinalQuiz: true,
      cefrLevel: 'A1'
    },
    targetLang: 'es',
    user: {}
  };
  const count = 7 + DELIGHT_VARIANT_IDS.length;
  const options = Array.from({
    length: count
  }, () => select('vocabulary', context));
  assert.equal(new Set(options.map(option => option.exerciseType)).size, count);
  assert.equal(options.some(option => option.exerciseType === 'flashcard'), false);
  assert.ok(options.every(option => option.cefrLevel === 'A1'));
});
test('the prepared translation layout agrees with its direction and listening mode', () => {
  const select = createQuestionOptionSelector();
  const context = {
    lesson: {
      id: 'quiz-a1',
      isFinalQuiz: true,
      cefrLevel: 'A1'
    },
    targetLang: 'es',
    user: {}
  };
  const count = 7 + DELIGHT_VARIANT_IDS.length;
  const options = Array.from({
    length: count
  }, () => select('grammar', context));
  const repeat = options.find(option => option.exerciseType === 'repeat');
  assert.equal(repeat.direction, repeat.isListening ? 'support-to-target' : repeat.repeatMode === 'target-tts-support-bank' ? 'target-to-support' : 'support-to-target');
});
