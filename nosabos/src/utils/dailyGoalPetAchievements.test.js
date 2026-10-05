import test from "node:test";
import assert from "node:assert/strict";
import { buildDailyGoalResetFields } from "./dailyGoalPet.js";
const now = new Date(2026,9,3,12);
const profile = { dailyGoalXp:100,dailyGoalPetHealth:100,dailyGoalPetLastAccountedDay:"2026-09-30",dailyGoalPetTrackedDay:"2026-10-01",dailyGoalPetStartedFull:true,completedGoalDates:["2026-10-01","2026-10-02"] };
test("healthy-day history only counts finalized, observed days starting and staying at full health", () => {
  const fields=buildDailyGoalResetFields(profile,now);
  assert.deepEqual(fields.dailyGoalPetHealthyDates,["2026-10-01","2026-10-02"]);
  assert.equal(fields.dailyGoalPetTrackedDay,"2026-10-03");
  assert.deepEqual(buildDailyGoalResetFields({...profile,...fields},now).dailyGoalPetHealthyDates,fields.dailyGoalPetHealthyDates);
  for (const patch of [{dailyGoalPetStartedFull:false},{dailyGoalPetTrackedDay:undefined},{dailyGoalPetHealth:90},{completedGoalDates:[]}]) {
    assert.deepEqual(buildDailyGoalResetFields({...profile,...patch},now).dailyGoalPetHealthyDates,[]);
  }
});


test("Score and companion unlocks stay outside the completion transcript", async () => {
  const { SCORE_MILESTONES } = await import("./scoreMilestones.js");
  const { ACHIEVEMENTS } = await import("../achievements/catalog.js");
  const { PET_TYPE_UNLOCK_LEVELS } = await import("./petTypes.js");
  for (const {score} of SCORE_MILESTONES) assert.equal(ACHIEVEMENTS[`piyali_score_landmark_${score}`], undefined);
  for (const pet of Object.keys(PET_TYPE_UNLOCK_LEVELS)) assert.equal(ACHIEVEMENTS[`piyali_pet_${pet}`], undefined);
});

test("healthy days survive goal-history pruning and cannot be regained after a same-day health drop", () => {
  const compact = { ...profile, completedGoalDates:undefined, dailyGoalPetReachedDates:profile.completedGoalDates, lastGoalDayKey:"2026-10-03" };
  assert.deepEqual(buildDailyGoalResetFields(compact,now).dailyGoalPetHealthyDates,["2026-10-01","2026-10-02"]);
  const damaged = buildDailyGoalResetFields({ ...compact, dailyGoalPetTrackedDay:"2026-10-03", dailyGoalPetHealth:90 }, now);
  assert.equal(damaged.dailyGoalPetStartedFull,false);
  const recovered = buildDailyGoalResetFields({ ...compact, ...damaged, dailyGoalPetHealth:100 }, now);
  assert.equal(recovered.dailyGoalPetStartedFull,false);
});
