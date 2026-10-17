// Pure scheduling: a current module and at most one upcoming module. Preparation
// does not mount lesson components or write learner progress.
export function lessonPreparationScope({
  lesson,
  account,
  targetLang,
  supportLang,
  user
}) {
  return JSON.stringify([account || '', lesson?.id, lesson?.content, lesson?.modes, lesson?.gameReviewContext, lesson?.cefrLevel, Boolean(lesson?.isFinalQuiz), Boolean(lesson?.isTutorial), lesson?.quizConfig, targetLang, supportLang, user?.progress?.showTranslations !== false, Boolean(user?.progress?.practicePronunciation)]);
}
export function createLessonPreparationSession(context, prepare, random = Math.random, selectOptions = () => ({}), initialMode = context.lesson?.modes?.[0]) {
  let disposed = false;
  let sequence = 0;
  const scope = lessonPreparationScope(context);
  const controllers = new Set();
  const modes = context.lesson?.modes || [];
  const make = (mode, latest = context) => {
    if (!mode) return null;
    const controller = new AbortController();
    controllers.add(controller);
    const ticket = {
      id: ++sequence,
      mode,
      context: latest,
      options: selectOptions(mode, latest),
      signal: controller.signal,
      cancel: () => controller.abort()
    };
    ticket.promise = (mode === 'game' ? Promise.resolve(null) : Promise.resolve().then(() => disposed ? null : prepare(ticket)).then(value => disposed || controller.signal.aborted ? null : value).catch(() => null)).finally(() => controllers.delete(controller));
    ticket.session = session;
    return ticket;
  };
  const session = {
    scope,
    started: false,
    finished: false,
    get disposed() {
      return disposed;
    },
    current: null,
    next: null,
    matches: value => !disposed && scope === lessonPreparationScope(value),
    prepareNext(mode, latest = context) {
      if (disposed || session.finished || session.next) return session.next;
      if (context.lesson.isFinalQuiz && session.current?.id >= (context.lesson.quizConfig?.questionsRequired || 10)) return null;
      const index = modes.indexOf(mode);
      const choices = context.lesson.isFinalQuiz ? [mode] : context.lesson.isTutorial ? modes.slice(index + 1, index + 2) : modes.length > 1 ? modes.filter(value => value !== mode) : modes;
      const nextMode = choices[Math.floor(random() * choices.length)];
      session.next = make(nextMode, latest);
      return session.next;
    },
    advance(expectedId, latest = context) {
      if (disposed || session.finished || session.current?.id !== expectedId) return null;
      session.prepareNext(session.current.mode, latest);
      session.current.cancel();
      session.current = session.next;
      session.next = null;
      return session.current;
    },
    restartQuiz(latest = context) {
      if (disposed || !context.lesson.isFinalQuiz) return;
      const mode = session.current.mode;
      session.current.cancel();
      session.next?.cancel();
      session.next = null;
      sequence = 0;
      session.finished = false;
      selectOptions.reset?.();
      session.current = make(mode, latest);
    },
    finish() {
      session.finished = true;
      session.next?.cancel();
      session.next = null;
    },
    dispose() {
      disposed = true;
      session.current?.cancel();
      session.next?.cancel();
      controllers.forEach(controller => controller.abort());
      controllers.clear();
      session.next = null;
    }
  };
  if (!context.lesson?.isGame) session.current = make(initialMode);
  return session;
}
export function replayPreparedText(text) {
  const response = {
    text: () => text
  };
  return {
    stream: {
      async *[Symbol.asyncIterator]() {
        yield response;
      }
    },
    response: Promise.resolve(response)
  };
}
