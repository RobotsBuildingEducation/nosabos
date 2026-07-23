import {
  ASSESSMENT_STATUSES,
  NATURALIZATION_MODALITIES,
  WORKFLOWS,
} from "./assessmentModel.js";
import { assessCitizenship } from "./decisionEngine.js";
import {
  CITIZENSHIP_QUESTIONS,
  DEFAULT_CITIZENSHIP_ANSWERS,
  getQuestionById,
  hasQuestionAnswer,
} from "./questions.js";

const decisiveDocuments = new Set([
  "birth_acta",
  "passport",
  "declaratoria",
  "naturalization_letter",
]);
const parentYes = new Set(["mother", "father", "both"]);
const qualifyingResidence = new Set(["temporary", "permanent"]);

const add = (ids, id, condition = true) => {
  if (condition && id && !ids.includes(id)) ids.push(id);
};

const hasDecisiveDocument = (answers) =>
  (answers.existingDocs || []).some((doc) => decisiveDocuments.has(doc));

export const getRequiredQuestionIds = (
  answers = {},
  assessment = assessCitizenship(answers),
) => {
  const ids = ["existingDocs"];
  if (!hasQuestionAnswer("existingDocs", answers) || hasDecisiveDocument(answers)) {
    return ids;
  }

  add(ids, "birthplace");
  if (!hasQuestionAnswer("birthplace", answers)) return ids;
  if (answers.birthplace === "mexico") {
    add(ids, "registeredMexico");
    if (answers.registeredMexico !== "yes") return ids;
    add(ids, "foreignNationalityBefore1998");
    if (
      !hasQuestionAnswer("foreignNationalityBefore1998", answers) ||
      ["yes", "unknown"].includes(answers.foreignNationalityBefore1998)
    ) {
      return ids;
    }
    add(ids, "actaIssue");
    return ids;
  }
  if (answers.birthplace === "mexican_ship_aircraft") return ids;

  add(ids, "parentMexicanAtBirth");
  if (!hasQuestionAnswer("parentMexicanAtBirth", answers)) return ids;
  if (parentYes.has(answers.parentMexicanAtBirth)) return ids;
  if (answers.parentMexicanAtBirth === "not_sure") {
    add(ids, "parentProof");
    if (
      ![
        "parent_birth_acta",
        "parent_passport",
        "parent_naturalization_letter",
        "parent_declaratoria",
      ].includes(answers.parentProof)
    ) {
      return ids;
    }
    add(ids, "parentNationalityTiming");
    if (answers.parentNationalityTiming !== "after_birth") return ids;
  }

  add(ids, "residentStatus");
  if (!hasQuestionAnswer("residentStatus", answers)) return ids;
  add(ids, "residenceYears", qualifyingResidence.has(answers.residentStatus));
  if (
    qualifyingResidence.has(answers.residentStatus) &&
    !hasQuestionAnswer("residenceYears", answers)
  ) {
    return ids;
  }
  add(ids, "naturalizationBases");
  if (!hasQuestionAnswer("naturalizationBases", answers)) return ids;

  const bases = new Set(
    (answers.naturalizationBases || []).filter((value) => value !== "none"),
  );
  add(ids, "marriageDuration", bases.has("marriage"));
  add(ids, "marriageCohabitation", bases.has("marriage"));
  add(ids, "adoptionStatus", bases.has("adoption_parental_authority"));
  add(ids, "descendantDegree", bases.has("direct_descendant"));
  add(
    ids,
    "secondDegreeException",
    bases.has("direct_descendant") && answers.descendantDegree === "second",
  );

  add(
    ids,
    assessment.modality ===
      NATURALIZATION_MODALITIES.ADOPTION_PARENTAL_AUTHORITY_1Y
      ? "oneYearAbsence"
      : "absences",
    Boolean(assessment.modality) &&
      (hasQuestionAnswer("oneYearAbsence", answers) ||
        hasQuestionAnswer("absences", answers)),
  );
  if (assessment.nextQuestionId) add(ids, assessment.nextQuestionId);
  if (
    assessment.status !== ASSESSMENT_STATUSES.NEED_MORE_INFORMATION ||
    assessment.nextQuestionId === "criminalHistory"
  ) {
    add(ids, "criminalHistory");
  }
  return ids;
};

export const getNextRequiredQuestion = (
  answers = {},
  assessment = assessCitizenship(answers),
) => {
  if (assessment.status !== ASSESSMENT_STATUSES.NEED_MORE_INFORMATION) {
    return null;
  }
  const questionId =
    assessment.nextQuestionId ||
    getRequiredQuestionIds(answers, assessment).find(
      (id) => !hasQuestionAnswer(id, answers),
    );
  return getQuestionById(questionId);
};

export const getOptionalReadinessQuestionIds = (
  answers = {},
  assessment = assessCitizenship(answers),
) => {
  if (assessment.status === ASSESSMENT_STATUSES.NEED_MORE_INFORMATION) return [];
  const ids = ["currentCitizenship", "applicantType"];

  if (
    [WORKFLOWS.FOREIGN_BIRTH_REGISTRATION, WORKFLOWS.PARENT_CHAIN].includes(
      assessment.workflow,
    )
  ) {
    add(ids, "parentProof");
    add(ids, "parentOrigin");
    add(ids, "parentNamesMatch");
    add(ids, "birthCertificateType");
    add(ids, "parentsMarriedTiming");
    add(ids, "parentAvailability");
    add(ids, "foreignBirthRecord");
  }

  if (assessment.workflow === WORKFLOWS.NATURALIZATION) {
    add(ids, "ageGroup");
    add(ids, "refugee");
    add(ids, "cardReady");
    add(ids, "addressMatch");
    add(ids, "spanishExamReady");
    const historyExamExempt =
      ["minor", "over_60"].includes(answers.ageGroup) ||
      answers.refugee === "yes";
    add(ids, "historyCultureExamReady", !historyExamExempt);
    add(ids, "passportReady");
  }

  add(ids, "handlingLocation");
  return ids;
};

export const getOptionalReadinessQuestions = (answers, assessment) =>
  getOptionalReadinessQuestionIds(answers, assessment)
    .map(getQuestionById)
    .filter(Boolean);

export const getApplicableQuestionIds = (
  answers = {},
  assessment = assessCitizenship(answers),
  { includeReadiness = true } = {},
) => {
  const ids = getRequiredQuestionIds(answers, assessment);
  if (includeReadiness) {
    getOptionalReadinessQuestionIds(answers, assessment).forEach((id) =>
      add(ids, id),
    );
  }
  return ids;
};

export const getApplicableQuestions = (answers, assessment, options) =>
  getApplicableQuestionIds(answers, assessment, options)
    .map(getQuestionById)
    .filter(Boolean);

export const pruneInvalidatedAnswers = (candidateAnswers = {}) => {
  const assessment = assessCitizenship(candidateAnswers);
  const applicable = new Set(
    getApplicableQuestionIds(candidateAnswers, assessment, {
      includeReadiness: true,
    }),
  );
  const next = { ...DEFAULT_CITIZENSHIP_ANSWERS };
  applicable.forEach((id) => {
    if (Object.hasOwn(candidateAnswers, id)) next[id] = candidateAnswers[id];
  });
  return next;
};

export const getInvalidatedQuestionIds = (before = {}, after = {}) =>
  CITIZENSHIP_QUESTIONS.filter(
    (question) =>
      hasQuestionAnswer(question, before) && !hasQuestionAnswer(question, after),
  ).map((question) => question.id);

export const getRequiredProgress = (
  answers = {},
  assessment = assessCitizenship(answers),
) => {
  const requiredIds = getRequiredQuestionIds(answers, assessment);
  const answered = requiredIds.filter((id) => hasQuestionAnswer(id, answers))
    .length;
  const isTerminal =
    assessment.status !== ASSESSMENT_STATUSES.NEED_MORE_INFORMATION;
  const total = isTerminal
    ? requiredIds.length
    : Math.max(requiredIds.length, 3);
  return {
    answered,
    total,
    percent: total ? Math.round((answered / total) * 100) : 0,
  };
};
