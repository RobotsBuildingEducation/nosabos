import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSESSMENT_STATUSES,
  LEGAL_BASES,
  NATURALIZATION_MODALITIES,
  WORKFLOWS,
} from "./assessmentModel.js";
import {
  assessCitizenship,
  deriveLegacyRouteCode,
} from "./decisionEngine.js";
import { DEFAULT_CITIZENSHIP_ANSWERS } from "./questions.js";

const answers = (overrides = {}) => ({
  ...DEFAULT_CITIZENSHIP_ANSWERS,
  ...overrides,
});

test("does not emit a route before a decisive answer", () => {
  const assessment = assessCitizenship(answers());
  assert.equal(
    assessment.status,
    ASSESSMENT_STATUSES.NEED_MORE_INFORMATION,
  );
  assert.equal(assessment.nextQuestionId, "existingDocs");
  assert.equal(deriveLegacyRouteCode(assessment), null);
});

for (const [document, legalBasis] of [
  ["birth_acta", LEGAL_BASES.MEXICAN_BY_BIRTH],
  ["passport", LEGAL_BASES.UNKNOWN],
  ["naturalization_letter", LEGAL_BASES.MEXICAN_BY_NATURALIZATION],
  ["declaratoria", LEGAL_BASES.MEXICAN_BY_BIRTH],
]) {
  test(`existing ${document} short-circuits to an existing-document workflow`, () => {
    const assessment = assessCitizenship(answers({ existingDocs: [document] }));
    assert.equal(assessment.workflow, WORKFLOWS.EXISTING_DOCUMENT);
    assert.equal(assessment.legalBasis, legalBasis);
    assert.equal(assessment.status, ASSESSMENT_STATUSES.ALREADY_MEXICAN);
    assert.equal(assessment.nextQuestionId, null);
  });
}

test("Mexico birth requires record and declaratoria facts before result", () => {
  const partial = assessCitizenship(
    answers({ existingDocs: ["none"], birthplace: "mexico" }),
  );
  assert.equal(partial.nextQuestionId, "registeredMexico");

  const assessment = assessCitizenship(
    answers({
      existingDocs: ["none"],
      birthplace: "mexico",
      registeredMexico: "yes",
      foreignNationalityBefore1998: "automatic_at_birth",
      actaIssue: "no",
    }),
  );
  assert.equal(assessment.legalBasis, LEGAL_BASES.MEXICAN_BY_BIRTH);
  assert.equal(assessment.status, ASSESSMENT_STATUSES.ALREADY_MEXICAN);
  assert.equal(assessment.workflow, WORKFLOWS.MEXICO_BIRTH_RECORD);
});

test("only voluntary pre-1998 acquisition or use selects declaratoria", () => {
  const assessment = assessCitizenship(
    answers({
      existingDocs: ["none"],
      birthplace: "mexico",
      registeredMexico: "yes",
      foreignNationalityBefore1998: "yes",
    }),
  );
  assert.equal(assessment.workflow, WORKFLOWS.DECLARATORIA);
  assert.equal(assessment.status, ASSESSMENT_STATUSES.NEEDS_REVIEW);
  assert.equal(deriveLegacyRouteCode(assessment), "R4");
});

test("Mexican ship or aircraft birth hard-stops", () => {
  const assessment = assessCitizenship(
    answers({
      existingDocs: ["none"],
      birthplace: "mexican_ship_aircraft",
    }),
  );
  assert.equal(assessment.legalBasis, LEGAL_BASES.MEXICAN_BY_BIRTH);
  assert.equal(assessment.status, ASSESSMENT_STATUSES.ALREADY_MEXICAN);
});

test("foreign birth with Mexican parent hard-stops before readiness questions", () => {
  const assessment = assessCitizenship(
    answers({
      existingDocs: ["none"],
      birthplace: "us",
      parentMexicanAtBirth: "mother",
    }),
  );
  assert.equal(assessment.workflow, WORKFLOWS.FOREIGN_BIRTH_REGISTRATION);
  assert.equal(assessment.status, ASSESSMENT_STATUSES.ALREADY_MEXICAN);
  assert.equal(deriveLegacyRouteCode(assessment), "R2");
});

test("uncertain parent with no strong proof preserves parent-chain review", () => {
  const assessment = assessCitizenship(
    answers({
      existingDocs: ["none"],
      birthplace: "us",
      parentMexicanAtBirth: "not_sure",
      parentProof: "parent_ine",
    }),
  );
  assert.equal(assessment.workflow, WORKFLOWS.PARENT_CHAIN);
  assert.equal(assessment.status, ASSESSMENT_STATUSES.NEEDS_REVIEW);
  assert.equal(deriveLegacyRouteCode(assessment), "R3");
});

test("a parent naturalized after birth continues into naturalization", () => {
  const assessment = assessCitizenship(
    answers({
      existingDocs: ["none"],
      birthplace: "us",
      parentMexicanAtBirth: "parent_after_birth",
    }),
  );
  assert.equal(assessment.nextQuestionId, "residentStatus");
  assert.equal(assessment.workflow, WORKFLOWS.NATURALIZATION);
});

const eligibleNaturalization = (overrides = {}) =>
  answers({
    existingDocs: ["none"],
    birthplace: "other_country",
    parentMexicanAtBirth: "no",
    residentStatus: "permanent",
    residenceYears: "5_plus",
    naturalizationBases: ["none"],
    absences: "under_6_months",
    criminalHistory: "no",
    ...overrides,
  });

test("five-year general route can be eligible now", () => {
  const assessment = assessCitizenship(eligibleNaturalization());
  assert.equal(assessment.modality, NATURALIZATION_MODALITIES.GENERAL_5Y);
  assert.equal(assessment.status, ASSESSMENT_STATUSES.ELIGIBLE_NOW);
  assert.equal(deriveLegacyRouteCode(assessment), "R5");
});

test("refugee status does not shorten residence", () => {
  const assessment = assessCitizenship(
    eligibleNaturalization({
      residenceYears: "2_5",
      refugee: "yes",
    }),
  );
  assert.equal(assessment.modality, NATURALIZATION_MODALITIES.GENERAL_5Y);
  assert.equal(assessment.status, ASSESSMENT_STATUSES.NOT_ELIGIBLE_YET);
});

test("marriage requires duration, cohabitation, residence and absence facts", () => {
  const assessment = assessCitizenship(
    eligibleNaturalization({
      residenceYears: "2_5",
      naturalizationBases: ["marriage"],
      marriageDuration: "2_plus",
      marriageCohabitation: "two_years_mexico",
    }),
  );
  assert.equal(assessment.modality, NATURALIZATION_MODALITIES.MARRIAGE_2Y);
  assert.equal(assessment.status, ASSESSMENT_STATUSES.ELIGIBLE_NOW);
});

test("marriage without qualifying cohabitation is not eligible yet", () => {
  const assessment = assessCitizenship(
    eligibleNaturalization({
      residenceYears: "2_5",
      naturalizationBases: ["marriage"],
      marriageDuration: "2_plus",
      marriageCohabitation: "under_two_years",
    }),
  );
  assert.equal(assessment.modality, NATURALIZATION_MODALITIES.MARRIAGE_2Y);
  assert.equal(assessment.status, ASSESSMENT_STATUSES.NOT_ELIGIBLE_YET);
});

for (const [basis, modality] of [
  ["mexican_child", NATURALIZATION_MODALITIES.MEXICAN_CHILD_2Y],
  ["latin_iberian", NATURALIZATION_MODALITIES.LATIN_IBERIAN_2Y],
]) {
  test(`${basis} uses an ordinary two-year route`, () => {
    const assessment = assessCitizenship(
      eligibleNaturalization({
        residenceYears: "2_5",
        naturalizationBases: [basis],
      }),
    );
    assert.equal(assessment.modality, modality);
    assert.equal(assessment.status, ASSESSMENT_STATUSES.ELIGIBLE_NOW);
  });
}

test("direct descendant uses a two-year route", () => {
  const assessment = assessCitizenship(
    eligibleNaturalization({
      residenceYears: "2_5",
      naturalizationBases: ["direct_descendant"],
      descendantDegree: "first",
    }),
  );
  assert.equal(
    assessment.modality,
    NATURALIZATION_MODALITIES.DIRECT_DESCENDANT_2Y,
  );
  assert.equal(assessment.status, ASSESSMENT_STATUSES.ELIGIBLE_NOW);
});

test("narrow second-degree descendant exception is a review overlay", () => {
  const assessment = assessCitizenship(
    eligibleNaturalization({
      residentStatus: "no",
      residenceYears: "",
      naturalizationBases: ["direct_descendant"],
      descendantDegree: "second",
      secondDegreeException: "no_other_nationality",
    }),
  );
  assert.equal(assessment.workflow, WORKFLOWS.NATURALIZATION);
  assert.equal(assessment.status, ASSESSMENT_STATUSES.NEEDS_REVIEW);
  assert.ok(
    assessment.issues.some((entry) => entry.code === "SECOND-DEGREE-EXCEPTION"),
  );
});

test("distinguished services with two years remains discretionary review", () => {
  const assessment = assessCitizenship(
    eligibleNaturalization({
      residenceYears: "2_5",
      naturalizationBases: ["distinguished_services"],
    }),
  );
  assert.equal(
    assessment.modality,
    NATURALIZATION_MODALITIES.DISTINGUISHED_SERVICES,
  );
  assert.equal(assessment.status, ASSESSMENT_STATUSES.NEEDS_REVIEW);
  assert.ok(
    assessment.issues.some(
      (entry) => entry.code === "DISTINGUISHED-DISCRETION",
    ),
  );
});

test("distinguished services under two years becomes waiver review", () => {
  const assessment = assessCitizenship(
    eligibleNaturalization({
      residenceYears: "1_2",
      naturalizationBases: ["distinguished_services"],
    }),
  );
  assert.equal(assessment.status, ASSESSMENT_STATUSES.NEEDS_REVIEW);
  assert.ok(
    assessment.issues.some(
      (entry) => entry.code === "DISTINGUISHED-WAIVER",
    ),
  );
});

test("one-year adoption route requires uninterrupted residence", () => {
  const assessment = assessCitizenship(
    eligibleNaturalization({
      residenceYears: "1_2",
      naturalizationBases: ["adoption_parental_authority"],
      adoptionStatus: "adult_within_one_year",
      absences: "",
      oneYearAbsence: "any",
    }),
  );
  assert.equal(
    assessment.modality,
    NATURALIZATION_MODALITIES.ADOPTION_PARENTAL_AUTHORITY_1Y,
  );
  assert.equal(assessment.status, ASSESSMENT_STATUSES.NOT_ELIGIBLE_YET);
});

test("former minor outside the post-majority year falls back to general route", () => {
  const assessment = assessCitizenship(
    eligibleNaturalization({
      naturalizationBases: ["adoption_parental_authority"],
      adoptionStatus: "adult_over_one_year",
    }),
  );
  assert.equal(assessment.modality, NATURALIZATION_MODALITIES.GENERAL_5Y);
});

for (const [criminalHistory, issueCode] of [
  ["pending", "PENDING-PROCEEDING"],
  ["current_intentional_sentence", "CURRENT-CUSTODIAL-SENTENCE"],
  ["past_conviction", "PAST-CONVICTION"],
  ["unknown", "CRIMINAL-HISTORY-UNKNOWN"],
]) {
  test(`${criminalHistory} creates the specific review issue`, () => {
    const assessment = assessCitizenship(
      eligibleNaturalization({ criminalHistory }),
    );
    assert.equal(assessment.status, ASSESSMENT_STATUSES.NEEDS_REVIEW);
    assert.ok(assessment.issues.some((entry) => entry.code === issueCode));
  });
}

test("more than six months of absence changes present eligibility", () => {
  const assessment = assessCitizenship(
    eligibleNaturalization({ absences: "over_6_months" }),
  );
  assert.equal(assessment.status, ASSESSMENT_STATUSES.NOT_ELIGIBLE_YET);
  assert.ok(assessment.issues.some((entry) => entry.code === "EXCESS-ABSENCE"));
});

test("checklist items use stable IDs", () => {
  const first = assessCitizenship(eligibleNaturalization()).checklist;
  const second = assessCitizenship(eligibleNaturalization()).checklist;
  assert.deepEqual(
    first.map((entry) => entry.id),
    second.map((entry) => entry.id),
  );
  assert.ok(first.every((entry) => entry.id && entry.text && entry.stage));
});

