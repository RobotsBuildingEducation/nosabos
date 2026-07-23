import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCitizenshipProgressV3,
  migrateVersion2Answers,
  normalizeCitizenshipProgressV3,
} from "./persistence.js";

test("version-2 naturalization answers migrate to version 3 bases", () => {
  const migrated = migrateVersion2Answers({
    existingDocs: ["none"],
    birthplace: "us",
    parentMexicanAtBirth: "no",
    marriedMexican: "yes",
    mexicanChild: "yes",
    descendant: "grandparent",
    criminalHistory: "conviction",
  });
  assert.deepEqual(migrated.naturalizationBases, [
    "marriage",
    "mexican_child",
    "direct_descendant",
  ]);
  assert.equal(migrated.descendantDegree, "second");
  assert.equal(migrated.criminalHistory, "past_conviction");
});

test("completed version-2 result is reopened when new required facts are missing", () => {
  const progress = normalizeCitizenshipProgressV3({
    version: 2,
    questionIndex: 31,
    showResults: true,
    answers: {
      existingDocs: ["none"],
      birthplace: "us",
      parentMexicanAtBirth: "no",
      residentStatus: "permanent",
      residenceYears: "2_5",
      marriedMexican: "yes",
      criminalHistory: "no",
    },
  });
  assert.equal(progress.version, 3);
  assert.equal(progress.showResults, false);
  assert.equal(progress.currentQuestionId, "marriageDuration");
});

test("version-2 existing document result stays complete after recalculation", () => {
  const progress = normalizeCitizenshipProgressV3({
    version: 2,
    questionIndex: 4,
    showResults: true,
    answers: { existingDocs: ["naturalization_letter"] },
  });
  assert.equal(progress.showResults, true);
  assert.equal(progress.assessment.legalBasis, "mexican_by_naturalization");
});

test("version-3 progress resumes the saved applicable question ID", () => {
  const progress = normalizeCitizenshipProgressV3({
    version: 3,
    currentQuestionId: "birthplace",
    showResults: false,
    answers: {
      existingDocs: ["none"],
      birthplace: "us",
      parentMexicanAtBirth: "no",
      residentStatus: "permanent",
      residenceYears: "5_plus",
      naturalizationBases: ["none"],
    },
  });
  assert.equal(progress.currentQuestionId, "birthplace");
});

test("completed progress can resume at the checkpoint", () => {
  const progress = normalizeCitizenshipProgressV3({
    version: 3,
    currentQuestionId: "parentMexicanAtBirth",
    showCheckpoint: true,
    showResults: false,
    answers: {
      existingDocs: ["none"],
      birthplace: "us",
      parentMexicanAtBirth: "both",
    },
  });

  assert.equal(progress.showCheckpoint, true);
  assert.equal(progress.showResults, false);
  assert.equal(progress.refiningChecklist, false);
});

test("checkpoint, refinement, and final results are mutually exclusive", () => {
  const progress = buildCitizenshipProgressV3({
    answers: {
      existingDocs: ["none"],
      birthplace: "us",
      parentMexicanAtBirth: "mother",
    },
    currentQuestionId: "parentMexicanAtBirth",
    showCheckpoint: true,
    showResults: true,
    refiningChecklist: true,
  });

  assert.equal(progress.showResults, true);
  assert.equal(progress.showCheckpoint, false);
  assert.equal(progress.refiningChecklist, false);
});

test("checkpoint cannot remain open when required information is missing", () => {
  const progress = buildCitizenshipProgressV3({
    answers: {
      existingDocs: ["none"],
      birthplace: "us",
    },
    currentQuestionId: "parentMexicanAtBirth",
    showCheckpoint: true,
  });

  assert.equal(progress.showCheckpoint, false);
  assert.equal(progress.showResults, false);
});
