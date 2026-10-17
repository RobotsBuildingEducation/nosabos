import { questionWorthForUser } from '../../utils/performanceEloModel.js';
import { replayPreparedText } from './session.js';

// Shared by the real exercise renderers; keeps answer state and grading out of
// preparation. Quizzes advance their buffer without remounting quiz counters.
export function createPreparedQuestionConsumer(ticket, mode, lessonId, services) {
  let current = ticket?.mode === mode && ticket.context.lesson.id === lessonId ? ticket : null;
  let data = null;
  const base = () => current?.context.lesson.isFinalQuiz ? current.session.current : current;
  const available = () => {
    const active = base();
    return !active?.claimed ? active : active.context.lesson.isFinalQuiz && active.session.next?.mode === mode ? active.session.next : null;
  };
  const cancelled = () => Boolean(current?.session.disposed || base()?.signal.aborted);
  const load = async (fallback, exerciseType) => {
    data = null;
    if (cancelled()) throw new DOMException('Lesson preparation cancelled', 'AbortError');
    const candidate = available();
    if (!candidate || exerciseType && candidate.options.exerciseType !== exerciseType) return fallback();
    current = candidate === candidate.session.current ? candidate : candidate.session.advance(base().id, {
      ...candidate.context,
      user: services.getUser()
    });
    current.claimed = true;
    const activeTicket = current;
    const preparedData = await activeTicket.promise;
    if (activeTicket.signal.aborted || activeTicket.session.current !== activeTicket || cancelled()) throw new DOMException('Lesson preparation cancelled', 'AbortError');
    data = preparedData;
    const result = data || (await fallback());
    if (activeTicket.signal.aborted || activeTicket.session.current !== activeTicket || cancelled()) throw new DOMException("Lesson preparation cancelled", "AbortError");
    if (current.context.lesson.isFinalQuiz) current.session.prepareNext(mode, {
      ...current.context,
      user: services.getUser()
    });
    return result;
  };
  const consumer = {
    get ticket() {
      return base();
    },
    get cancelled() {
      return cancelled();
    },
    get options() {
      return available()?.options;
    },
    discard() {
      data = null;
    },
    finishQuiz() {
      if (current?.context.lesson.isFinalQuiz) current.session.finish();
    },
    restartQuiz() {
      if (current?.context.lesson.isFinalQuiz) {
        current.session.restartQuiz({
          ...current.context,
          user: services.getUser()
        });
        current = current.session.current;
        data = null;
      }
    },
    load,
    async stream(fallback, exerciseType) {
      const result = await load(async () => ({
        response: await fallback()
      }), exerciseType);
      return result.raw != null ? replayPreparedText(result.raw) : result.response;
    },
    async response(fallback, exerciseType) {
      const result = await load(async () => ({
        response: await fallback()
      }), exerciseType);
      return result.raw != null ? {
        response: {
          text: () => result.raw
        }
      } : result.response;
    },
    assess(options) {
      const draft = data;
      return draft ? Promise.resolve(draft.assessmentPromise).then(assessment => questionWorthForUser(options.user, options.targetLang, options.questionLevel, {
        difficultyScore: assessment?.difficultyScore ?? draft.difficultyScore
      })) : services.assess(options);
    },
    assessMany(options) {
      const draft = data;
      if (!draft) return services.assessMany(options);
      return Promise.resolve(draft.assessmentPromise).then(assessment => {
        const scores = assessment?.sentenceDifficultyScores || draft.sentenceDifficultyScores;
        return scores?.length === options.questions.length ? scores.map(difficultyScore => questionWorthForUser(options.user, options.targetLang, options.questionLevel, {
          difficultyScore
        })) : services.assessMany(options);
      });
    }
  };
  return consumer;
}
