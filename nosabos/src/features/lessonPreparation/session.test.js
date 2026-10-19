import test from 'node:test';
import assert from 'node:assert/strict';
import { createLessonPreparationSession, lessonPreparationScope } from './session.js';
import { createPreparedQuestionConsumer } from './consumer.js';
import { questionWorthForUser, scoreToElo } from '../../utils/performanceEloModel.js';
const context = (patch = {}) => ({
  account: 'learner',
  targetLang: 'es',
  supportLang: 'en',
  lesson: {
    id: 'A1-lesson',
    modes: ['vocabulary', 'grammar'],
    content: {
      vocabulary: {
        topic: 'family'
      }
    }
  },
  user: {
    progress: {
      showTranslations: true
    }
  },
  ...patch
});
const deferred = () => {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return {
    resolve,
    promise
  };
};
const services = {
  getUser: () => ({}),
  assess: () => {
    throw new Error('Unexpected reassessment');
  },
  assessMany: () => {
    throw new Error('Unexpected reassessment');
  }
};
const options = () => ({
  exerciseType: 'mc',
  cefrLevel: 'A1'
});
test('opening a modal starts only its first question; entering the lesson can warm exactly one next module', async () => {
  const calls = [];
  const session = createLessonPreparationSession(context(), async ticket => {
    calls.push(ticket.mode);
    return {
      raw: ticket.mode
    };
  }, () => 0, options);
  await session.current.promise;
  assert.deepEqual(calls, ['vocabulary']);
  session.prepareNext('vocabulary');
  session.prepareNext('vocabulary');
  await session.next.promise;
  assert.deepEqual(calls, ['vocabulary', 'grammar']);
  const nextId = session.next.id;
  assert.equal(session.advance(session.current.id).id, nextId);
  assert.equal(session.next, null);
  assert.equal(calls.length, 2, 'Consuming the ready question must not generate it twice');
});
test('Next while preparation is pending shares the in-flight request', async () => {
  const pending = deferred();
  let calls = 0;
  const session = createLessonPreparationSession(context(), () => {
    calls++;
    return pending.promise;
  }, () => 0, options);
  const consumer = createPreparedQuestionConsumer(session.current, 'vocabulary', context().lesson.id, services);
  const reading = consumer.stream(() => {
    throw new Error('Duplicate foreground request');
  }, 'mc');
  await Promise.resolve();
  assert.equal(calls, 1);
  pending.resolve({
    raw: 'ready'
  });
  const response = await reading;
  assert.equal((await response.response).text(), 'ready');
});
test('closing or switching scope discards pending results and does not start fallback generation', async () => {
  const pending = deferred();
  const session = createLessonPreparationSession(context(), () => pending.promise, () => 0, options);
  const consumer = createPreparedQuestionConsumer(session.current, 'vocabulary', context().lesson.id, services);
  const reading = consumer.stream(() => assert.fail('Cancelled work cannot generate a replacement'));
  session.dispose();
  pending.resolve({
    raw: 'stale'
  });
  await assert.rejects(reading, {
    name: 'AbortError'
  });
  assert.equal(await session.current.promise, null);
  assert.equal(session.prepareNext('vocabulary'), null);
  assert.equal(session.matches(context()), false);
});
test('scope includes account, languages, lesson content and settings but not changing ratings', () => {
  const original = context();
  const session = createLessonPreparationSession(original, async () => null, () => 0, options);
  for (const patch of [{
    account: 'another'
  }, {
    targetLang: 'fr'
  }, {
    supportLang: 'de'
  }, {
    lesson: {
      ...original.lesson,
      content: {
        vocabulary: {
          topic: 'travel'
        }
      }
    }
  }, {
    user: {
      progress: {
        showTranslations: false
      }
    }
  }]) assert.equal(session.matches(context(patch)), false);
  assert.equal(lessonPreparationScope(original), lessonPreparationScope(context({
    user: {
      ...original.user,
      learningIntelligence: {
        es: {
          elo: {
            rating: 1500
          }
        }
      }
    }
  })));
});
test('games never generate in the background; tutorials retain sequential order and stop at the end', async () => {
  const calls = [];
  const session = createLessonPreparationSession(context({
    lesson: {
      id: 'tutorial',
      isTutorial: true,
      modes: ['vocabulary', 'game']
    }
  }), async ticket => {
    calls.push(ticket.mode);
    return {};
  }, () => 0, options);
  await session.current.promise;
  session.prepareNext('vocabulary');
  await session.next.promise;
  assert.deepEqual(calls, ['vocabulary']);
  assert.equal(session.advance(session.current.id).mode, 'game');
  assert.equal(session.prepareNext('game'), null);
  const game = createLessonPreparationSession(context({
    lesson: {
      id: 'game',
      isGame: true,
      modes: ['game']
    }
  }), () => assert.fail('Game preloaded'));
  assert.equal(game.current, null);
});
test('a quiz consumes one ready question at a time without remounting its scoring state', async () => {
  const quiz = context({
    lesson: {
      id: 'quiz',
      isFinalQuiz: true,
      modes: ['vocabulary']
    }
  });
  let calls = 0;
  const session = createLessonPreparationSession(quiz, async () => ({
    raw: `question-${++calls}`,
    difficultyScore: 30
  }), () => 0, options);
  const consumer = createPreparedQuestionConsumer(session.current, 'vocabulary', 'quiz', services);
  assert.equal((await (await consumer.stream(() => assert.fail(), 'mc')).response).text(), 'question-1');
  await session.next.promise;
  assert.equal((await (await consumer.stream(() => assert.fail(), 'mc')).response).text(), 'question-2');
  assert.equal(session.current.id, 2);
  assert.equal(session.next.id, 3);
});
test('nested renderers share a claimed ticket and a subsequent manual type change cannot reuse the old payload', async () => {
  const session = createLessonPreparationSession(context(), async () => ({
    raw: 'mc-question'
  }), () => 0, options);
  const parent = createPreparedQuestionConsumer(session.current, 'vocabulary', context().lesson.id, services);
  const child = createPreparedQuestionConsumer(session.current, 'vocabulary', context().lesson.id, services);
  await child.stream(() => assert.fail(), 'mc');
  assert.equal(parent.options, undefined);
  const manual = await parent.stream(async () => ({
    fresh: true
  }), 'fill');
  assert.equal(manual.fresh, true);
});
test('difficulty is prepared once, but Elo is quoted from the latest rating when the question is shown', async () => {
  const session = createLessonPreparationSession(context(), async () => ({
    raw: 'question',
    difficultyScore: 45
  }), () => 0, options);
  const consumer = createPreparedQuestionConsumer(session.current, 'vocabulary', context().lesson.id, services);
  await consumer.stream(() => assert.fail(), 'mc');
  const user = {
    learningIntelligence: {
      es: {
        elo: {
          rating: scoreToElo(60),
          scaleVersion: 4
        }
      }
    }
  };
  const quote = await consumer.assess({
    user,
    targetLang: 'es',
    questionLevel: 'A1'
  });
  assert.deepEqual(quote, questionWorthForUser(user, 'es', 'A1', {
    difficultyScore: 45
  }));
  assert.equal(quote.ratingAtGeneration, scoreToElo(60));
});
test('failed background preparation falls back to the existing foreground generator', async () => {
  const session = createLessonPreparationSession(context(), async () => {
    throw new Error('offline');
  }, () => 0, options);
  const consumer = createPreparedQuestionConsumer(session.current, 'vocabulary', context().lesson.id, services);
  const response = await consumer.stream(async () => ({
    fallback: true
  }), 'mc');
  assert.equal(response.fallback, true);
});
test('multi-mode quizzes warm the active module and never generate beyond the final question', async () => {
  const quiz = context({
    lesson: {
      id: 'quiz',
      isFinalQuiz: true,
      modes: ['vocabulary', 'grammar'],
      quizConfig: {
        questionsRequired: 2
      }
    }
  });
  const calls = [];
  const session = createLessonPreparationSession(quiz, async ticket => {
    calls.push(ticket.mode);
    return {
      raw: 'question'
    };
  }, () => 0, options);
  const consumer = createPreparedQuestionConsumer(session.current, 'vocabulary', 'quiz', services);
  await consumer.stream(() => assert.fail(), 'mc');
  await session.next.promise;
  await consumer.stream(() => assert.fail(), 'mc');
  assert.deepEqual(calls, ['vocabulary', 'vocabulary']);
  assert.equal(session.next, null);
});
test('retrying a quiz restarts its preparation sequence and discards the previous attempt', async () => {
  const quiz = context({
    lesson: {
      id: 'quiz',
      isFinalQuiz: true,
      modes: ['vocabulary'],
      quizConfig: {
        questionsRequired: 2
      }
    }
  });
  let calls = 0;
  const session = createLessonPreparationSession(quiz, async () => ({
    raw: `question-${++calls}`
  }), () => 0, options);
  const consumer = createPreparedQuestionConsumer(session.current, 'vocabulary', 'quiz', services);
  await consumer.stream(() => assert.fail(), 'mc');
  const obsolete = session.next;
  consumer.restartQuiz();
  assert.equal(obsolete.signal.aborted, true);
  assert.equal(session.current.id, 1);
  const expected = (await session.current.promise).raw;
  const response = await consumer.stream(() => assert.fail(), 'mc');
  assert.equal((await response.response).text(), expected);
});
test('a slow difficulty assessment does not delay displaying an already-prepared question', async () => {
  const assessment = deferred();
  const session = createLessonPreparationSession(context(), async () => ({
    raw: 'ready question',
    assessmentPromise: assessment.promise
  }), () => 0, options);
  const consumer = createPreparedQuestionConsumer(session.current, 'vocabulary', context().lesson.id, services);
  const response = await consumer.stream(() => assert.fail(), 'mc');
  assert.equal((await response.response).text(), 'ready question');
  let quoted = false;
  const grading = consumer.assess({
    user: {},
    targetLang: 'es',
    questionLevel: 'A1'
  }).then(worth => {
    quoted = true;
    return worth;
  });
  await Promise.resolve();
  assert.equal(quoted, false);
  assessment.resolve({
    difficultyScore: 42
  });
  assert.equal((await grading).difficultyScore, 42);
});

test('finishing a lesson cancels the queued draft while retaining the visible question', async () => {
  const session = createLessonPreparationSession(context(), async () => ({ raw: 'question' }), () => 0, options);
  await session.current.promise;
  session.prepareNext('vocabulary');
  const next = session.next;
  session.finish();
  assert.equal(next.signal.aborted, true);
  assert.equal(session.next, null);
  assert.equal(session.current.signal.aborted, false);
  assert.equal(session.prepareNext('vocabulary'), null);
  assert.equal(session.advance(session.current.id), null);
  assert.equal(session.matches(context()), true);
});
