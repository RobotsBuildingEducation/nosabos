import { assessCitizenship } from "./decisionEngine.js";
import {
  DEFAULT_CITIZENSHIP_ANSWERS,
  normalizeAnswerValue,
} from "./questions.js";
import {
  getApplicableQuestionIds,
  getNextRequiredQuestion,
  pruneInvalidatedAnswers,
} from "./questionPlanner.js";

export const CITIZENSHIP_PROGRESS_VERSION = 3;

const normalizeStringArray = (value) =>
  Array.isArray(value)
    ? [...new Set(value.filter((entry) => typeof entry === "string"))]
    : [];

export const migrateVersion2Answers = (rawAnswers = {}) => {
  const migrated = { ...DEFAULT_CITIZENSHIP_ANSWERS, ...rawAnswers };
  if (!migrated.ageGroup && rawAnswers.applicantAdult) {
    migrated.ageGroup =
      rawAnswers.applicantAdult === "no" ? "minor" : "adult";
  }
  if (!migrated.naturalizationBases.length) {
    const bases = [];
    if (rawAnswers.marriedMexican === "yes") bases.push("marriage");
    if (rawAnswers.mexicanChild === "yes") bases.push("mexican_child");
    if (["parent", "grandparent", "great_grandparent"].includes(rawAnswers.descendant)) {
      bases.push("direct_descendant");
      migrated.descendantDegree =
        rawAnswers.descendant === "parent"
          ? "first"
          : rawAnswers.descendant === "grandparent"
            ? "second"
            : "further";
    }
    if (rawAnswers.latinIberian === "yes") bases.push("latin_iberian");
    if (["yes", "former"].includes(rawAnswers.adoptedParentalAuthority)) {
      bases.push("adoption_parental_authority");
      migrated.adoptionStatus =
        rawAnswers.adoptedParentalAuthority === "yes"
          ? "minor_current"
          : "unknown";
    }
    if (rawAnswers.distinguishedService === "yes") {
      bases.push("distinguished_services");
    }
    if (bases.length) migrated.naturalizationBases = bases;
  }
  if (!migrated.spanishExamReady && rawAnswers.examReady) {
    migrated.spanishExamReady =
      rawAnswers.examReady === "exempt" ? "" : rawAnswers.examReady;
  }
  if (!migrated.historyCultureExamReady && rawAnswers.examReady) {
    migrated.historyCultureExamReady =
      rawAnswers.examReady === "exempt" ? "" : rawAnswers.examReady;
  }
  if (rawAnswers.criminalHistory === "sentence") {
    migrated.criminalHistory = "current_intentional_sentence";
  } else if (rawAnswers.criminalHistory === "conviction") {
    migrated.criminalHistory = "past_conviction";
  }
  return migrated;
};

export const normalizeCitizenshipAnswers = (rawAnswers = {}) => {
  const source = migrateVersion2Answers(rawAnswers);
  const normalized = {};
  Object.entries(DEFAULT_CITIZENSHIP_ANSWERS).forEach(([key, defaultValue]) => {
    if (Array.isArray(defaultValue)) {
      normalized[key] = normalizeAnswerValue(
        key,
        normalizeStringArray(source[key]),
      );
    } else {
      normalized[key] =
        typeof source[key] === "string" ? source[key] : defaultValue;
    }
  });
  return pruneInvalidatedAnswers(normalized);
};

const normalizeStringIds = (value) =>
  normalizeStringArray(value).filter(Boolean);

export const migrateQuestionIndexToId = (rawProgress, answers) => {
  if (
    typeof rawProgress?.currentQuestionId === "string" &&
    rawProgress.currentQuestionId
  ) {
    return rawProgress.currentQuestionId;
  }
  const applicable = getApplicableQuestionIds(answers, assessCitizenship(answers));
  const oldIndex = Math.max(0, Math.floor(Number(rawProgress?.questionIndex) || 0));
  return applicable[Math.min(oldIndex, Math.max(applicable.length - 1, 0))] || "existingDocs";
};

export const normalizeCitizenshipProgressV3 = (
  rawProgress,
  {
    normalizeChecklistProgress = (value) => value || {},
    normalizeAssistantChat = (value) => value,
  } = {},
) => {
  if (!rawProgress || typeof rawProgress !== "object") return null;
  const answers = normalizeCitizenshipAnswers(rawProgress.answers);
  const assessment = assessCitizenship(answers);
  const nextRequired = getNextRequiredQuestion(answers, assessment);
  const requestedId = migrateQuestionIndexToId(rawProgress, answers);
  const applicable = new Set(getApplicableQuestionIds(answers, assessment));
  const canResumeRequestedQuestion =
    rawProgress.version === CITIZENSHIP_PROGRESS_VERSION &&
    applicable.has(requestedId);
  const hasTerminalAssessment =
    assessment.status !== "need_more_information";
  const showResults =
    rawProgress.showResults === true && hasTerminalAssessment;
  const refiningChecklist =
    rawProgress.refiningChecklist === true &&
    !showResults &&
    hasTerminalAssessment;
  const showCheckpoint =
    rawProgress.showCheckpoint === true &&
    !showResults &&
    !refiningChecklist &&
    hasTerminalAssessment;
  const currentQuestionId =
    canResumeRequestedQuestion
      ? requestedId
      : assessment.status === "need_more_information"
        ? nextRequired?.id || "existingDocs"
      : applicable.has(requestedId)
        ? requestedId
        : "existingDocs";

  return {
    version: CITIZENSHIP_PROGRESS_VERSION,
    currentQuestionId,
    questionHistory: normalizeStringIds(rawProgress.questionHistory).filter((id) =>
      applicable.has(id),
    ),
    visitedQuestionIds: normalizeStringIds(rawProgress.visitedQuestionIds).filter(
      (id) => applicable.has(id),
    ),
    answers,
    assessment,
    showResults,
    showCheckpoint,
    refiningChecklist,
    checklistProgress: normalizeChecklistProgress(rawProgress.checklistProgress),
    assistantChat: normalizeAssistantChat(rawProgress.assistantChat),
    updatedAt:
      typeof rawProgress.updatedAt === "string" ? rawProgress.updatedAt : "",
  };
};

export const buildCitizenshipProgressV3 = ({
  answers,
  currentQuestionId,
  questionHistory = [],
  visitedQuestionIds = [],
  assessment = assessCitizenship(answers),
  showResults,
  showCheckpoint = false,
  refiningChecklist = false,
  checklistProgress = {},
  assistantChat,
}) => {
  const hasTerminalAssessment =
    assessment.status !== "need_more_information";
  const normalizedShowResults =
    showResults === true && hasTerminalAssessment;
  const normalizedRefiningChecklist =
    refiningChecklist === true &&
    !normalizedShowResults &&
    hasTerminalAssessment;

  return {
    version: CITIZENSHIP_PROGRESS_VERSION,
    currentQuestionId: currentQuestionId || "existingDocs",
    questionHistory: normalizeStringIds(questionHistory),
    visitedQuestionIds: normalizeStringIds(visitedQuestionIds),
    answers: normalizeCitizenshipAnswers(answers),
    assessment,
    showResults: normalizedShowResults,
    showCheckpoint:
      showCheckpoint === true &&
      !normalizedShowResults &&
      !normalizedRefiningChecklist &&
      hasTerminalAssessment,
    refiningChecklist: normalizedRefiningChecklist,
    checklistProgress,
    assistantChat,
    updatedAt: new Date().toISOString(),
  };
};
