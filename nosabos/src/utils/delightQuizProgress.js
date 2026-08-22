const toHistory = (value) =>
  Array.isArray(value) ? value.map((item) => item === true) : [];

export function getDelightQuizOutcome(history, quizConfig = {}) {
  const answers = toHistory(history);
  const questionsRequired = Math.max(
    1,
    Number(quizConfig.questionsRequired) || 10,
  );
  const passingScore = Math.min(
    questionsRequired,
    Math.max(1, Number(quizConfig.passingScore) || 8),
  );
  const answered = answers.length;
  const correct = answers.filter(Boolean).length;
  const wrong = answered - correct;
  const maxAllowedWrong = questionsRequired - passingScore;
  const completed =
    correct >= passingScore ||
    wrong > maxAllowedWrong ||
    answered >= questionsRequired;

  return {
    answered,
    correct,
    wrong,
    completed,
    passed: completed && correct >= passingScore,
  };
}

export function normalizeDelightQuizProgress(value, quizConfig = {}) {
  const source = value && typeof value === "object" ? value : {};
  const history = toHistory(source.history);
  const outcome = getDelightQuizOutcome(history, quizConfig);

  return {
    history,
    ...outcome,
  };
}

export function serializeDelightQuizProgress(history, quizConfig = {}) {
  const answers = toHistory(history);
  const outcome = getDelightQuizOutcome(answers, quizConfig);

  return {
    answered: outcome.answered,
    correct: outcome.correct,
    completed: outcome.completed,
    passed: outcome.passed,
    history: answers,
    currentAttempted: false,
  };
}
