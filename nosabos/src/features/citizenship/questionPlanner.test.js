import test from "node:test";
import assert from "node:assert/strict";
import { assessCitizenship } from "./decisionEngine.js";
import {
  getApplicableQuestionIds,
  getNextRequiredQuestion,
  getOptionalReadinessQuestionIds,
  getRequiredProgress,
  pruneInvalidatedAnswers,
} from "./questionPlanner.js";
import { DEFAULT_CITIZENSHIP_ANSWERS } from "./questions.js";

const answers = (overrides = {}) => ({
  ...DEFAULT_CITIZENSHIP_ANSWERS,
  ...overrides,
});

test("existing document path asks no unrelated required questions", () => {
  const input = answers({ existingDocs: ["passport"] });
  const assessment = assessCitizenship(input);
  assert.equal(getNextRequiredQuestion(input, assessment), null);
  assert.deepEqual(
    getApplicableQuestionIds(input, assessment, { includeReadiness: false }),
    ["existingDocs"],
  );
});

test("foreign-parent result moves record details to optional refinement", () => {
  const input = answers({
    existingDocs: ["none"],
    birthplace: "us",
    parentMexicanAtBirth: "mother",
  });
  const assessment = assessCitizenship(input);
  assert.equal(getNextRequiredQuestion(input, assessment), null);
  const optional = getOptionalReadinessQuestionIds(input, assessment);
  assert.ok(optional.includes("parentProof"));
  assert.ok(optional.includes("birthCertificateType"));
  assert.ok(optional.includes("handlingLocation"));
});

test("naturalization next question follows selected basis only", () => {
  const input = answers({
    existingDocs: ["none"],
    birthplace: "us",
    parentMexicanAtBirth: "no",
    residentStatus: "permanent",
    residenceYears: "2_5",
    naturalizationBases: ["marriage"],
  });
  assert.equal(getNextRequiredQuestion(input)?.id, "marriageDuration");
  const applicable = getApplicableQuestionIds(input, assessCitizenship(input), {
    includeReadiness: false,
  });
  assert.ok(applicable.includes("marriageDuration"));
  assert.ok(applicable.includes("marriageCohabitation"));
  assert.ok(!applicable.includes("adoptionStatus"));
});

test("changing birthplace clears parent and naturalization answers", () => {
  const before = answers({
    existingDocs: ["none"],
    birthplace: "us",
    parentMexicanAtBirth: "no",
    residentStatus: "permanent",
    residenceYears: "5_plus",
    naturalizationBases: ["none"],
    absences: "none",
    criminalHistory: "no",
  });
  const after = pruneInvalidatedAnswers(
    { ...before, birthplace: "mexico" },
    "birthplace",
  );
  assert.equal(after.parentMexicanAtBirth, "");
  assert.equal(after.residentStatus, "");
  assert.deepEqual(after.naturalizationBases, []);
});

test("removing marriage clears marriage follow-ups", () => {
  const before = answers({
    existingDocs: ["none"],
    birthplace: "us",
    parentMexicanAtBirth: "no",
    residentStatus: "permanent",
    residenceYears: "2_5",
    naturalizationBases: ["marriage"],
    marriageDuration: "2_plus",
    marriageCohabitation: "two_years_mexico",
  });
  const after = pruneInvalidatedAnswers(
    { ...before, naturalizationBases: ["mexican_child"] },
    "naturalizationBases",
  );
  assert.equal(after.marriageDuration, "");
  assert.equal(after.marriageCohabitation, "");
});

test("hidden answers cannot affect assessment", () => {
  const stale = answers({
    existingDocs: ["none"],
    birthplace: "us",
    parentMexicanAtBirth: "no",
    residentStatus: "permanent",
    residenceYears: "2_5",
    naturalizationBases: ["mexican_child"],
    marriageDuration: "under_2",
    marriageCohabitation: "not_living_together",
    absences: "none",
    criminalHistory: "no",
  });
  const clean = pruneInvalidatedAnswers(stale, "naturalizationBases");
  assert.equal(clean.marriageDuration, "");
  assert.equal(assessCitizenship(clean).modality, "mexican_child_2y");
});

test("progress counts only required questions in the active branch", () => {
  const input = answers({
    existingDocs: ["none"],
    birthplace: "mexican_ship_aircraft",
  });
  const progress = getRequiredProgress(input, assessCitizenship(input));
  assert.deepEqual(progress, { answered: 2, total: 2, percent: 100 });
});

test("short adaptive route progress stays stable as its branch is discovered", () => {
  const afterFirstAnswer = answers({
    existingDocs: ["none"],
  });
  assert.deepEqual(
    getRequiredProgress(
      afterFirstAnswer,
      assessCitizenship(afterFirstAnswer),
    ),
    { answered: 1, total: 3, percent: 33 },
  );

  const afterSecondAnswer = answers({
    existingDocs: ["none"],
    birthplace: "us",
  });
  assert.deepEqual(
    getRequiredProgress(
      afterSecondAnswer,
      assessCitizenship(afterSecondAnswer),
    ),
    { answered: 2, total: 3, percent: 67 },
  );

  const completed = answers({
    existingDocs: ["none"],
    birthplace: "us",
    parentMexicanAtBirth: "both",
  });
  assert.deepEqual(
    getRequiredProgress(completed, assessCitizenship(completed)),
    { answered: 3, total: 3, percent: 100 },
  );
});

test("answer pruning preserves the current modality absence answer", () => {
  const input = answers({
    existingDocs: ["none"],
    birthplace: "other_country",
    parentMexicanAtBirth: "no",
    residentStatus: "permanent",
    residenceYears: "5_plus",
    naturalizationBases: ["none"],
    absences: "under_6_months",
  });
  const pruned = pruneInvalidatedAnswers(input, "absences");
  assert.equal(pruned.absences, "under_6_months");
  assert.equal(assessCitizenship(pruned).nextQuestionId, "criminalHistory");
});
