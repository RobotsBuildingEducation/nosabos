import {
  ASSESSMENT_STATUSES,
  createAssessment,
  LEGAL_BASES,
  NATURALIZATION_MODALITIES,
  WORKFLOWS,
} from "./assessmentModel.js";
import { CHECKLIST_LIBRARY as C, uniqueChecklistItems } from "./checklist.js";

const decisiveDocuments = new Set([
  "birth_acta",
  "passport",
  "declaratoria",
  "naturalization_letter",
]);
const parentStrongProof = new Set([
  "parent_birth_acta",
  "parent_passport",
  "parent_naturalization_letter",
  "parent_declaratoria",
]);
const qualifyingResidence = new Set(["temporary", "permanent"]);
const outsideMexico = new Set(["us", "other_country", "unknown"]);
const parentWasMexican = new Set(["mother", "father", "both"]);

const hasAnswer = (answers, id) => {
  const value = answers?.[id];
  return Array.isArray(value)
    ? value.length > 0
    : String(value || "").trim().length > 0;
};

const issue = (code, explanation, severity = "review") => ({
  code,
  explanation,
  severity,
});

const need = (questionId, overrides = {}) =>
  createAssessment({
    ...overrides,
    status: ASSESSMENT_STATUSES.NEED_MORE_INFORMATION,
    nextQuestionId: questionId,
  });

const result = (overrides = {}) =>
  createAssessment({ nextQuestionId: null, ...overrides });

const yearsAtLeast = (value, count) => {
  if (count <= 1) return ["1_2", "2_5", "5_plus"].includes(value);
  if (count <= 2) return ["2_5", "5_plus"].includes(value);
  return value === "5_plus";
};

const existingDocumentAssessment = (answers) => {
  const docs = answers.existingDocs || [];
  if (!docs.some((doc) => decisiveDocuments.has(doc))) return null;

  const hasBirthDocument = docs.some((doc) =>
    ["birth_acta", "declaratoria"].includes(doc),
  );
  const hasNaturalizationLetter = docs.includes("naturalization_letter");
  const legalBasis =
    hasBirthDocument && !hasNaturalizationLetter
      ? LEGAL_BASES.MEXICAN_BY_BIRTH
      : hasNaturalizationLetter && !hasBirthDocument
        ? LEGAL_BASES.MEXICAN_BY_NATURALIZATION
        : LEGAL_BASES.UNKNOWN;
  const issues =
    hasBirthDocument && hasNaturalizationLetter
      ? [
          issue(
            "DOC-CONFLICT",
            "The selected documents point to different nationality bases; verify the underlying record.",
          ),
        ]
      : [];

  return result({
    legalBasis,
    workflow: WORKFLOWS.EXISTING_DOCUMENT,
    status: issues.length
      ? ASSESSMENT_STATUSES.NEEDS_REVIEW
      : ASSESSMENT_STATUSES.ALREADY_MEXICAN,
    issues,
    reasons: [
      legalBasis === LEGAL_BASES.MEXICAN_BY_NATURALIZATION
        ? "A Carta de Naturalizacion establishes Mexican nationality by naturalization."
        : "You already have a Mexican nationality document on the record.",
    ],
    checklist: uniqueChecklistItems(
      C.existingDocumentCopies,
      C.identityConsistency,
      C.mexicanIds,
    ),
    ruleCodes: ["DOC-01"],
  });
};

const assessMexicoBirth = (answers) => {
  const base = {
    legalBasis: LEGAL_BASES.MEXICAN_BY_BIRTH,
    workflow: WORKFLOWS.MEXICO_BIRTH_RECORD,
    ruleCodes: ["BIRTH-01"],
  };
  if (!hasAnswer(answers, "registeredMexico")) {
    return need("registeredMexico", base);
  }
  if (["no", "unknown"].includes(answers.registeredMexico)) {
    return result({
      ...base,
      status: ASSESSMENT_STATUSES.NEEDS_REVIEW,
      issues: [
        issue(
          "CIVIL-REGISTRY",
          "The Mexican civil-registry record is missing or uncertain.",
        ),
      ],
      reasons: [
        "Birth in Mexico establishes the underlying Mexican-by-birth path, but the civil record needs review.",
      ],
      checklist: uniqueChecklistItems(C.civilRegistryReview, C.historicRecords),
    });
  }
  if (!hasAnswer(answers, "foreignNationalityBefore1998")) {
    return need("foreignNationalityBefore1998", base);
  }
  if (answers.foreignNationalityBefore1998 === "yes") {
    return result({
      ...base,
      workflow: WORKFLOWS.DECLARATORIA,
      status: ASSESSMENT_STATUSES.NEEDS_REVIEW,
      issues: [
        issue(
          "PRE-1998-VOLUNTARY",
          "Voluntary acquisition or use of another nationality before March 20, 1998 requires declaratoria or recovery review.",
        ),
      ],
      reasons: [
        "The pre-1998 fact changes the documentation workflow, not the Mexican-by-birth basis.",
      ],
      checklist: uniqueChecklistItems(
        C.mexicoBirthActa,
        C.declaratoriaEvidence,
        C.identityConsistency,
      ),
    });
  }
  if (answers.foreignNationalityBefore1998 === "unknown") {
    return result({
      ...base,
      status: ASSESSMENT_STATUSES.NEEDS_REVIEW,
      issues: [
        issue(
          "PRE-1998-UNKNOWN",
          "Confirm whether any pre-1998 foreign nationality was voluntarily acquired or merely automatic at birth.",
        ),
      ],
      reasons: ["The nationality basis is known, but the correct record workflow needs review."],
      checklist: uniqueChecklistItems(C.declaratoriaEvidence, C.mexicoBirthActa),
    });
  }
  if (!hasAnswer(answers, "actaIssue")) return need("actaIssue", base);
  const actaIssue = answers.actaIssue !== "no";
  return result({
    ...base,
    status: actaIssue
      ? ASSESSMENT_STATUSES.NEEDS_REVIEW
      : ASSESSMENT_STATUSES.ALREADY_MEXICAN,
    issues: actaIssue
      ? [
          issue(
            "ACTA-REVIEW",
            "The Mexican birth acta may be late-registered or inconsistent with identity records.",
          ),
        ]
      : [],
    reasons: [
      "People born in Mexico are Mexican by birth.",
      answers.foreignNationalityBefore1998 === "automatic_at_birth"
        ? "A foreign nationality acquired automatically at birth does not by itself trigger the pre-1998 declaratoria question."
        : "No pre-1998 voluntary foreign-nationality issue was identified.",
    ],
    checklist: uniqueChecklistItems(
      C.mexicoBirthActa,
      actaIssue ? C.civilRegistryReview : null,
      C.identityConsistency,
      C.mexicanIds,
    ),
  });
};

const parentRegistrationAssessment = (answers) => {
  const parentAnswer = answers.parentMexicanAtBirth;
  const base = {
    legalBasis: LEGAL_BASES.MEXICAN_BY_BIRTH,
    workflow: WORKFLOWS.FOREIGN_BIRTH_REGISTRATION,
    ruleCodes: ["BIRTH-02"],
  };
  const readinessChecklist = [
    ["short_abstract", "hospital_only", "no"].includes(
      answers.birthCertificateType,
    )
      ? C.applicantLongFormBirth
      : null,
    answers.parentNamesMatch && answers.parentNamesMatch !== "yes"
      ? C.identityConsistency
      : null,
    answers.parentAvailability && answers.parentAvailability !== "no"
      ? C.parentChain
      : null,
    ["non_us", "non_english", "unknown"].includes(answers.foreignBirthRecord)
      ? C.translation
      : null,
  ];
  const readiness = [];
  if (
    answers.parentProof &&
    !parentStrongProof.has(answers.parentProof)
  ) {
    readiness.push("Stronger Mexican-parent nationality proof is still needed.");
  }
  if (answers.parentNamesMatch && answers.parentNamesMatch !== "yes") {
    readiness.push("Parent-name differences should be resolved before the appointment.");
  }
  if (
    answers.birthCertificateType &&
    answers.birthCertificateType !== "long_form"
  ) {
    readiness.push("A long-form certified birth certificate is still needed.");
  }
  if (answers.parentAvailability && answers.parentAvailability !== "no") {
    readiness.push("Parent availability or appearance requirements need confirmation.");
  }
  if (parentWasMexican.has(parentAnswer)) {
    return result({
      ...base,
      status: ASSESSMENT_STATUSES.ALREADY_MEXICAN,
      reasons: [
        "At least one legal parent was Mexican at or before the applicant's birth.",
      ],
      checklist: uniqueChecklistItems(
        C.foreignBirthAppointment,
        C.applicantLongFormBirth,
        C.mexicanParentProof,
        C.identityConsistency,
        C.mexicanIds,
        readinessChecklist,
      ),
      readiness,
    });
  }
  if (parentAnswer !== "not_sure") return null;
  if (!hasAnswer(answers, "parentProof")) {
    return need("parentProof", {
      legalBasis: LEGAL_BASES.UNKNOWN,
      workflow: WORKFLOWS.PARENT_CHAIN,
    });
  }
  if (!parentStrongProof.has(answers.parentProof)) {
    return result({
      legalBasis: LEGAL_BASES.UNKNOWN,
      workflow: WORKFLOWS.PARENT_CHAIN,
      status: ASSESSMENT_STATUSES.NEEDS_REVIEW,
      issues: [
        issue(
          "PARENT-PROOF",
          "The potential Mexican parent needs stronger nationality proof and timing confirmation.",
        ),
      ],
      reasons: [
        "The parent link may qualify, but the Mexican parent must be documented first.",
      ],
      checklist: uniqueChecklistItems(C.parentChain, C.mexicanParentProof),
      ruleCodes: ["BIRTH-02"],
    });
  }
  if (!hasAnswer(answers, "parentNationalityTiming")) {
    return need("parentNationalityTiming", {
      legalBasis: LEGAL_BASES.UNKNOWN,
      workflow: WORKFLOWS.PARENT_CHAIN,
      ruleCodes: ["BIRTH-02"],
    });
  }
  if (answers.parentNationalityTiming === "before_birth") {
    return result({
      ...base,
      status: ASSESSMENT_STATUSES.ALREADY_MEXICAN,
      reasons: [
        "At least one legal parent was Mexican at or before the applicant's birth.",
      ],
      checklist: uniqueChecklistItems(
        C.foreignBirthAppointment,
        C.applicantLongFormBirth,
        C.mexicanParentProof,
        readinessChecklist,
      ),
      readiness,
    });
  }
  if (answers.parentNationalityTiming === "unknown") {
    return result({
      legalBasis: LEGAL_BASES.UNKNOWN,
      workflow: WORKFLOWS.PARENT_CHAIN,
      status: ASSESSMENT_STATUSES.NEEDS_REVIEW,
      issues: [
        issue(
          "PARENT-TIMING",
          "The date the parent became Mexican must be compared with the applicant's birth date.",
        ),
      ],
      reasons: ["The parent proof is promising, but nationality timing remains decisive."],
      checklist: uniqueChecklistItems(C.parentChain, C.mexicanParentProof),
      ruleCodes: ["BIRTH-02"],
    });
  }
  return null;
};

const selectedBases = (answers) => {
  const values = Array.isArray(answers.naturalizationBases)
    ? answers.naturalizationBases
    : [];
  return new Set(values.filter((value) => value !== "none"));
};

const assessNaturalization = (answers) => {
  const base = {
    legalBasis: LEGAL_BASES.FOREIGN,
    workflow: WORKFLOWS.NATURALIZATION,
  };
  if (!hasAnswer(answers, "residentStatus")) return need("residentStatus", base);
  const hasResidence = qualifyingResidence.has(answers.residentStatus);
  if (hasResidence && !hasAnswer(answers, "residenceYears")) {
    return need("residenceYears", base);
  }
  if (!hasAnswer(answers, "naturalizationBases")) {
    return need("naturalizationBases", base);
  }

  const bases = selectedBases(answers);
  if (bases.has("marriage") && !hasAnswer(answers, "marriageDuration")) {
    return need("marriageDuration", base);
  }
  if (bases.has("marriage") && !hasAnswer(answers, "marriageCohabitation")) {
    return need("marriageCohabitation", base);
  }
  if (
    bases.has("adoption_parental_authority") &&
    !hasAnswer(answers, "adoptionStatus")
  ) {
    return need("adoptionStatus", base);
  }
  if (
    bases.has("direct_descendant") &&
    !hasAnswer(answers, "descendantDegree")
  ) {
    return need("descendantDegree", base);
  }
  if (
    bases.has("direct_descendant") &&
    answers.descendantDegree === "second" &&
    !hasAnswer(answers, "secondDegreeException")
  ) {
    return need("secondDegreeException", base);
  }

  const adoptionAvailable =
    bases.has("adoption_parental_authority") &&
    ["minor_current", "adult_within_one_year"].includes(answers.adoptionStatus);
  const marriageAvailable =
    bases.has("marriage") &&
    answers.marriageDuration === "2_plus" &&
    ["two_years_mexico", "government_assignment_abroad"].includes(
      answers.marriageCohabitation,
    );
  const descendantAvailable =
    bases.has("direct_descendant") &&
    ["first", "second", "further"].includes(answers.descendantDegree);

  let modality = NATURALIZATION_MODALITIES.GENERAL_5Y;
  let requiredYears = 5;
  if (adoptionAvailable) {
    modality = NATURALIZATION_MODALITIES.ADOPTION_PARENTAL_AUTHORITY_1Y;
    requiredYears = 1;
  } else if (bases.has("marriage")) {
    modality = NATURALIZATION_MODALITIES.MARRIAGE_2Y;
    requiredYears = 2;
  } else if (bases.has("mexican_child")) {
    modality = NATURALIZATION_MODALITIES.MEXICAN_CHILD_2Y;
    requiredYears = 2;
  } else if (descendantAvailable) {
    modality = NATURALIZATION_MODALITIES.DIRECT_DESCENDANT_2Y;
    requiredYears = 2;
  } else if (bases.has("latin_iberian")) {
    modality = NATURALIZATION_MODALITIES.LATIN_IBERIAN_2Y;
    requiredYears = 2;
  } else if (bases.has("distinguished_services")) {
    modality = NATURALIZATION_MODALITIES.DISTINGUISHED_SERVICES;
    requiredYears = 2;
  }

  const narrowDescendantException =
    modality === NATURALIZATION_MODALITIES.DIRECT_DESCENDANT_2Y &&
    answers.descendantDegree === "second" &&
    ["no_other_nationality", "birth_rights_not_recognized"].includes(
      answers.secondDegreeException,
    );
  const marriageFactsIncomplete =
    bases.has("marriage") &&
    (answers.marriageDuration === "unknown" ||
      answers.marriageCohabitation === "unknown");
  const adoptionFactsIncomplete =
    bases.has("adoption_parental_authority") &&
    answers.adoptionStatus === "unknown";
  const marriageConditionNotMet =
    modality === NATURALIZATION_MODALITIES.MARRIAGE_2Y &&
    !marriageAvailable &&
    !marriageFactsIncomplete;

  const enoughResidence =
    hasResidence && yearsAtLeast(answers.residenceYears, requiredYears);
  const distinguishedWaiverReview =
    modality === NATURALIZATION_MODALITIES.DISTINGUISHED_SERVICES &&
    !enoughResidence;
  const shouldAskAbsence =
    enoughResidence && !narrowDescendantException && !distinguishedWaiverReview;
  if (shouldAskAbsence) {
    const absenceQuestion =
      modality === NATURALIZATION_MODALITIES.ADOPTION_PARENTAL_AUTHORITY_1Y
        ? "oneYearAbsence"
        : "absences";
    if (!hasAnswer(answers, absenceQuestion)) {
      return need(absenceQuestion, { ...base, modality });
    }
  }
  if (!hasAnswer(answers, "criminalHistory")) {
    return need("criminalHistory", { ...base, modality });
  }

  const issues = [];
  const checklist = [C.naturalizationResidence];
  const reasons = [];
  const ruleCodes = [
    requiredYears === 5 ? "NAT-5Y" : "NAT-2Y",
    "NAT-CRIMINAL",
  ];
  if (modality === NATURALIZATION_MODALITIES.MARRIAGE_2Y) {
    checklist.push(C.marriageProof);
    ruleCodes.push("NAT-MARRIAGE");
  } else if (
    modality === NATURALIZATION_MODALITIES.ADOPTION_PARENTAL_AUTHORITY_1Y
  ) {
    checklist.push(C.adoptionProof);
    ruleCodes.push("NAT-ADOPTION");
  } else if (
    modality === NATURALIZATION_MODALITIES.DIRECT_DESCENDANT_2Y
  ) {
    checklist.push(C.descendantProof);
  } else if (
    modality === NATURALIZATION_MODALITIES.DISTINGUISHED_SERVICES
  ) {
    checklist.push(C.distinguishedServicesProof);
  } else if (requiredYears === 2) {
    checklist.push(C.modalityProof);
  }

  if (narrowDescendantException) {
    issues.push(
      issue(
        "SECOND-DEGREE-EXCEPTION",
        "The narrow second-degree direct-descendant residence exception requires SRE review of nationality and birth-right facts.",
      ),
    );
  }
  if (distinguishedWaiverReview) {
    issues.push(
      issue(
        "DISTINGUISHED-WAIVER",
        "A request to waive the two-year residence period for distinguished services is exceptional and discretionary.",
      ),
    );
  } else if (
    modality === NATURALIZATION_MODALITIES.DISTINGUISHED_SERVICES
  ) {
    issues.push(
      issue(
        "DISTINGUISHED-DISCRETION",
        "SRE must evaluate whether the claimed services qualify as distinguished services benefiting Mexico.",
      ),
    );
  }
  if (marriageFactsIncomplete) {
    issues.push(
      issue(
        "MARRIAGE-FACTS",
        "Marriage duration or qualifying cohabitation is uncertain.",
      ),
    );
  }
  if (adoptionFactsIncomplete) {
    issues.push(
      issue(
        "ADOPTION-TIMING",
        "The adoption, parental-authority, or majority timing is uncertain.",
      ),
    );
  }
  if (
    modality === NATURALIZATION_MODALITIES.ADOPTION_PARENTAL_AUTHORITY_1Y &&
    answers.oneYearAbsence !== "none"
  ) {
    issues.push(
      issue(
        "ONE-YEAR-INTERRUPTION",
        "The one-year adoption or parental-authority residence period must be uninterrupted.",
        "eligibility",
      ),
    );
    checklist.push(C.residenceAbsenceReview);
    ruleCodes.push("NAT-ABSENCE");
  } else if (
    modality !== NATURALIZATION_MODALITIES.ADOPTION_PARENTAL_AUTHORITY_1Y &&
    answers.absences === "over_6_months"
  ) {
    issues.push(
      issue(
        "EXCESS-ABSENCE",
        "More than six months outside Mexico during the previous two years interrupts the residence calculation.",
        "eligibility",
      ),
    );
    checklist.push(C.residenceAbsenceReview);
    ruleCodes.push("NAT-ABSENCE");
  } else if (answers.absences === "unknown" || answers.oneYearAbsence === "unknown") {
    issues.push(
      issue(
        "ABSENCE-UNKNOWN",
        "The residence period cannot be confirmed until absences are calculated.",
      ),
    );
  }

  if (answers.criminalHistory === "pending") {
    issues.push(
      issue(
        "PENDING-PROCEEDING",
        "A pending criminal proceeding may suspend the naturalization process.",
      ),
    );
    checklist.push(C.criminalReview);
  } else if (answers.criminalHistory === "current_intentional_sentence") {
    issues.push(
      issue(
        "CURRENT-CUSTODIAL-SENTENCE",
        "A current custodial sentence for an intentional offense may prevent issuance of the naturalization letter.",
      ),
    );
    checklist.push(C.criminalReview);
  } else if (answers.criminalHistory === "past_conviction") {
    issues.push(
      issue(
        "PAST-CONVICTION",
        "A completed or past conviction requires individualized document review.",
      ),
    );
    checklist.push(C.criminalReview);
  } else if (answers.criminalHistory === "unknown") {
    issues.push(
      issue(
        "CRIMINAL-HISTORY-UNKNOWN",
        "Criminal-record status should be confirmed before filing.",
      ),
    );
    checklist.push(C.criminalReview);
  }

  const eligibilityIssue = issues.some((entry) =>
    ["ONE-YEAR-INTERRUPTION", "EXCESS-ABSENCE"].includes(entry.code),
  );
  let status;
  if (
    issues.some(
      (entry) => entry.severity === "review",
    ) ||
    narrowDescendantException ||
    distinguishedWaiverReview
  ) {
    status = ASSESSMENT_STATUSES.NEEDS_REVIEW;
  } else if (
    !hasResidence ||
    !enoughResidence ||
    eligibilityIssue ||
    marriageConditionNotMet
  ) {
    status = ASSESSMENT_STATUSES.NOT_ELIGIBLE_YET;
  } else {
    status = ASSESSMENT_STATUSES.ELIGIBLE_NOW;
  }

  if (!hasResidence) {
    reasons.push(
      narrowDescendantException || distinguishedWaiverReview
        ? "A narrow statutory residence exception requires individualized government review."
        : "Naturalization generally requires temporary or permanent resident status.",
    );
  } else if (!enoughResidence) {
    reasons.push(
      requiredYears === 5
        ? "No shorter statutory route is selected, and the five-year clock is not complete."
        : "A shorter route may exist, but the residence clock is not long enough yet.",
    );
  } else {
    if (modality === NATURALIZATION_MODALITIES.GENERAL_5Y) {
      reasons.push(
        "Five or more years of qualifying residence can support the general route.",
      );
    } else if (
      modality ===
      NATURALIZATION_MODALITIES.ADOPTION_PARENTAL_AUTHORITY_1Y
    ) {
      reasons.push(
        "Adoption or Mexican parental authority can support a one-year route with custody review.",
      );
    } else {
      const subjectByModality = {
        [NATURALIZATION_MODALITIES.MARRIAGE_2Y]:
          "marriage to a Mexican citizen",
        [NATURALIZATION_MODALITIES.MEXICAN_CHILD_2Y]:
          "Mexican child by birth",
        [NATURALIZATION_MODALITIES.DIRECT_DESCENDANT_2Y]:
          "direct descent from Mexican by birth",
        [NATURALIZATION_MODALITIES.LATIN_IBERIAN_2Y]:
          "Latin American or Iberian origin",
      };
      const subject = subjectByModality[modality];
      reasons.push(
        subject
          ? `${subject} can support a shorter naturalization route.`
          : "Distinguished services are discretionary and should be reviewed before relying on the route.",
      );
    }
  }
  if (
    bases.has("adoption_parental_authority") &&
    answers.adoptionStatus === "adult_over_one_year"
  ) {
    reasons.push(
      "The limited post-majority adoption or parental-authority window appears to have passed, so the assessment falls back to another available modality.",
    );
  }
  if (bases.has("marriage") && !marriageAvailable && !marriageFactsIncomplete) {
    reasons.push(
      "The marriage facts do not yet satisfy the two-year marriage and cohabitation conditions, so another available modality controls.",
    );
  }

  checklist.push(C.naturalizationPacket, C.cardAndAddress, C.examsSpanish);
  const historyExamRequired = !(
    answers.ageGroup === "minor" ||
    answers.ageGroup === "over_60" ||
    answers.refugee === "yes"
  );
  if (historyExamRequired) checklist.push(C.examsHistory);
  if (answers.refugee === "yes") checklist.push(C.refugeeDocumentation);
  checklist.push(C.passportValidity);

  const readiness = [];
  if (answers.cardReady && answers.cardReady !== "yes") {
    readiness.push("Resident card validity or CURP is not ready.");
  }
  if (answers.addressMatch && answers.addressMatch !== "yes") {
    readiness.push("The INM address should be reconciled with the application.");
  }
  if (answers.spanishExamReady && answers.spanishExamReady !== "yes") {
    readiness.push("Spanish preparation is still needed.");
  }
  if (
    historyExamRequired &&
    answers.historyCultureExamReady &&
    answers.historyCultureExamReady !== "yes"
  ) {
    readiness.push("History and culture exam preparation is still needed.");
  }
  if (answers.passportReady && answers.passportReady !== "yes") {
    readiness.push("Foreign-passport validity needs attention.");
  }

  return result({
    ...base,
    modality,
    status,
    issues,
    readiness,
    reasons,
    checklist: uniqueChecklistItems(checklist),
    ruleCodes: [...new Set(ruleCodes)],
  });
};

export const assessCitizenship = (answers = {}) => {
  if (!hasAnswer(answers, "existingDocs")) return need("existingDocs");
  const existing = existingDocumentAssessment(answers);
  if (existing) return existing;

  if (!hasAnswer(answers, "birthplace")) return need("birthplace");
  if (answers.birthplace === "mexico") return assessMexicoBirth(answers);
  if (answers.birthplace === "mexican_ship_aircraft") {
    return result({
      legalBasis: LEGAL_BASES.MEXICAN_BY_BIRTH,
      workflow: WORKFLOWS.MEXICO_BIRTH_RECORD,
      status: ASSESSMENT_STATUSES.ALREADY_MEXICAN,
      reasons: [
        "Birth aboard a Mexican vessel or aircraft is a specialized Mexican-by-birth documentation path.",
      ],
      checklist: uniqueChecklistItems(C.vesselRecord, C.identityConsistency, C.mexicanIds),
      ruleCodes: ["BIRTH-01"],
    });
  }

  if (outsideMexico.has(answers.birthplace)) {
    if (!hasAnswer(answers, "parentMexicanAtBirth")) {
      return need("parentMexicanAtBirth");
    }
    const parentAssessment = parentRegistrationAssessment(answers);
    if (parentAssessment) return parentAssessment;
  }

  return assessNaturalization(answers);
};

export const deriveLegacyRouteCode = (assessment) => {
  if (!assessment || assessment.status === ASSESSMENT_STATUSES.NEED_MORE_INFORMATION) {
    return null;
  }
  if (assessment.workflow === WORKFLOWS.DECLARATORIA) return "R4";
  if (assessment.workflow === WORKFLOWS.FOREIGN_BIRTH_REGISTRATION) return "R2";
  if (assessment.workflow === WORKFLOWS.PARENT_CHAIN) return "R3";
  if (assessment.workflow === WORKFLOWS.NATURALIZATION) {
    if (assessment.status === ASSESSMENT_STATUSES.NEEDS_REVIEW) return "R7";
    if (assessment.status === ASSESSMENT_STATUSES.ELIGIBLE_NOW) return "R5";
    return "R6";
  }
  if (assessment.status === ASSESSMENT_STATUSES.NEEDS_REVIEW) return "R7";
  return "R1";
};
