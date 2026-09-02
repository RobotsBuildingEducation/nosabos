import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PET_TYPE,
  PET_TYPES,
  getEffectivePetType,
  getNewlyUnlockedPetTypes,
  getPetUnlockLevel,
  isPetTypeUnlocked,
  normalizePetType,
} from "./petTypes.js";

test("ghost is the starter companion and dog unlocks at level 20", () => {
  assert.equal(DEFAULT_PET_TYPE, "ghost");
  assert.equal(PET_TYPES[0], "ghost");
  assert.equal(getPetUnlockLevel("ghost"), 1);
  assert.equal(getPetUnlockLevel("dog"), 20);
  assert.equal(isPetTypeUnlocked("ghost", 1), true);
  assert.equal(isPetTypeUnlocked("dog", 19), false);
  assert.equal(isPetTypeUnlocked("dog", 20), true);
});

test("missing or locked pet selections fall back to the starter ghost", () => {
  assert.equal(normalizePetType(), "ghost");
  assert.equal(getEffectivePetType("dog", 1), "ghost");
  assert.equal(getEffectivePetType("dog", 20), "dog");
});

test("dog is reported as newly unlocked when level 20 is reached", () => {
  assert.deepEqual(getNewlyUnlockedPetTypes(19, 20), ["dog"]);
});
