import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateSelfReportedPlacement,
  scoreFromPlacementEvidence,
  seedPlacementElo,
  SELF_ASSESSMENT_OPTIONS,
} from "./proficiencySelfAssessment.js";
import { eloForUser, initialEloRating, performanceContextFor, scoreToElo } from "./performanceEloModel.js";

test("self assessment covers two pages and uses the strongest selected range", () => {
  assert.equal(SELF_ASSESSMENT_OPTIONS.length, 10);
  assert.equal(estimateSelfReportedPlacement([]), null);
  assert.deepEqual(
    estimateSelfReportedPlacement(["understands_more"]),
    { level: "Pre-A1", rating: 3, range: "Pre-A1" },
  );
  assert.deepEqual(
    estimateSelfReportedPlacement(["common_words", "home_language", "stories_opinions"]),
    { level: "B1", rating: 53, range: "B1–B2" },
  );
  assert.deepEqual(
    estimateSelfReportedPlacement(["basic_conversations", "nuance_precision"]),
    { level: "C1", rating: 81, range: "C1–C2" },
  );
  assert.deepEqual(
    estimateSelfReportedPlacement(["grammar_struggle"]),
    { level: "A1", rating: 18, range: "A1" },
  );
  assert.deepEqual(
    estimateSelfReportedPlacement(["understands_more", "grammar_struggle"]),
    { level: "Pre-A1", rating: 3, range: "Pre-A1" },
  );
  assert.deepEqual(
    estimateSelfReportedPlacement(["common_words", "grammar_struggle"]),
    { level: "A1", rating: 18, range: "A1" },
  );
  assert.deepEqual(
    estimateSelfReportedPlacement(["basic_conversations", "grammar_struggle"]),
    { level: "A2", rating: 32, range: "A2" },
  );
  assert.deepEqual(
    estimateSelfReportedPlacement(["stories_opinions", "grammar_struggle"]),
    { level: "B1", rating: 53, range: "B1–B2" },
  );
});

test("placement seeds Score and self report context without erasing graded history", () => {
  const seeded = seedPlacementElo({}, {
    level: "B1", rating: 53, source: "self_report",
    selectedIds: ["common_words", "stories_opinions"], now: "2026-09-23T00:00:00.000Z",
  });
  assert.equal(seeded.elo.rating, scoreToElo(53));
  assert.equal(seeded.elo.scaleVersion, 4);
  assert.deepEqual(
    performanceContextFor({ learningIntelligence: { de: seeded } }, "de").selfReportedStatements,
    ["common_words", "stories_opinions"],
  );
  const graded = { ...seeded, elo: { ...seeded.elo, rating: scoreToElo(49), totalGraded: 4 } };
  assert.equal(seedPlacementElo(graded, { level: "C2", source: "placement_test" }).elo.rating, scoreToElo(49));
  assert.equal(seedPlacementElo(seeded, { level: "A2", source: "placement_test" }).elo.rating, scoreToElo(32));
});

test("only complete beginners or minimal placement evidence begin at zero", () => {
  assert.equal(seedPlacementElo({}, {
    level: "Pre-A1", rating: 0, source: "onboarding_baseline",
  }).elo.rating, scoreToElo(0));
  const completeBeginner = seedPlacementElo({}, { level: "Pre-A1", rating: 0, source: "completely_new" });
  assert.equal(completeBeginner.elo.rating, scoreToElo(0));
  assert.equal(eloForUser({ learningIntelligence: { de: completeBeginner } }, "de"), 0);
  const checklist = seedPlacementElo({}, {
    level: "Pre-A1", rating: 3, source: "self_report", selectedIds: ["understands_more"],
  });
  assert.equal(checklist.elo.rating, scoreToElo(3));
  const rubric = (score) => Object.fromEntries(
    ["pronunciation", "grammar", "vocabulary", "fluency", "confidence", "comprehension"]
      .map((key) => [key, { score }]),
  );
  assert.equal(scoreFromPlacementEvidence("Pre-A1", rubric(1)), 0);
  assert.ok(scoreFromPlacementEvidence("Pre-A1", rubric(2)) > 0);
  assert.equal(scoreFromPlacementEvidence("Pre-A1", null), 1);
  assert.ok(scoreFromPlacementEvidence("A2", rubric(4)) >= 29);
  assert.equal(seedPlacementElo({}, {
    level: "Pre-A1", rating: 0, source: "placement_test",
  }).elo.rating, scoreToElo(0));
});

test("existing users get a default Score from their current level", () => {
  assert.equal(initialEloRating("Pre-A1"), 1);
  assert.equal(initialEloRating("C2"), 89);
  assert.equal(eloForUser({ proficiencyPlacements: { de: "B2" } }, "de"), 60);
});

test("proficiency onboarding modal has complete localization for all supported languages", async () => {
  const { PROFICIENCY_MODAL_TRANSLATIONS } = await import("./proficiencyModalTranslations.js");
  const languages = ["en", "es", "de", "fr", "it", "pt", "ja", "zh", "ru", "ar", "hi"];
  const requiredKeys = [
    "proficiency_modal_choose_start",
    "proficiency_modal_choice_description",
    "proficiency_modal_completely_new",
    "proficiency_modal_find_level",
    "proficiency_modal_select_all",
    "proficiency_modal_part",
    "proficiency_modal_back",
    "proficiency_modal_next",
    "proficiency_modal_done",
    "proficiency_modal_result_title",
    "proficiency_modal_result_description",
    "proficiency_modal_result_range",
    "proficiency_modal_starting_elo",
    "proficiency_modal_start_level",
    "proficiency_modal_take_test_now",
    "proficiency_modal_save_error",
    ...SELF_ASSESSMENT_OPTIONS.map((opt) => `proficiency_self_${opt.id}`),
  ];

  for (const lang of languages) {
    assert.ok(PROFICIENCY_MODAL_TRANSLATIONS[lang], `Missing translations for ${lang}`);
    for (const key of requiredKeys) {
      const val = PROFICIENCY_MODAL_TRANSLATIONS[lang][key];
      assert.ok(typeof val === "string" && val.length > 0, `Missing key "${key}" in language "${lang}"`);
    }
  }
});

