import test from "node:test";
import assert from "node:assert/strict";
import { getBootLoadingStage } from "./bootLoadingStage.js";

test("startup waits for the profile before reporting access or path preparation", () => {
  assert.equal(getBootLoadingStage({ isLoadingApp: true, hasUser: true, isResolvingSubscription: true }), "profile");
  assert.equal(getBootLoadingStage({ isLoadingApp: false, hasUser: false }), "profile");
});

test("startup only finishes after access and the initial learning path are ready", () => {
  const loaded = { isLoadingApp: false, hasUser: true };
  assert.equal(getBootLoadingStage({ ...loaded, isResolvingSubscription: true, shouldHoldForInitialSkillTree: true }), "access");
  assert.equal(getBootLoadingStage({ ...loaded, shouldHoldForInitialSkillTree: true }), "path");
  assert.equal(getBootLoadingStage(loaded), null);
});
