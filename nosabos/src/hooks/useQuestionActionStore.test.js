import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import useQuestionActionStore from "./useQuestionActionStore.js";

afterEach(() => {
  for (const id of useQuestionActionStore.getState().activeIds.keys()) {
    useQuestionActionStore.getState().setActive(id, false);
  }
});

test("activity controls own the menu even when the loading fallback mounts later", () => {
  const activity = Symbol("activity");
  const fallback = Symbol("fallback");
  const slot = {};
  const { setActive } = useQuestionActionStore.getState();
  setActive(activity, true, slot);
  setActive(fallback, true, {}, 0);
  assert.equal(useQuestionActionStore.getState().ownerId, activity);
  assert.equal(useQuestionActionStore.getState().menuSlot, slot);
  setActive(activity, false);
  assert.equal(useQuestionActionStore.getState().ownerId, fallback);
});

test("a hidden keep-alive activity releases the menu to the visible activity", () => {
  const tutor = Symbol("tutor");
  const conversation = Symbol("conversation");
  const { setActive } = useQuestionActionStore.getState();
  setActive(tutor, true, {});
  setActive(conversation, true, {});
  setActive(conversation, false);
  assert.equal(useQuestionActionStore.getState().ownerId, tutor);
  setActive(tutor, false);
  assert.equal(useQuestionActionStore.getState().menuSlot, null);
  assert.equal(useQuestionActionStore.getState().activeIds.size, 0);
});

test("explicit suppression releases activity controls and restores them on exit", () => {
  const activity = Symbol("activity");
  const card = Symbol("flashcard");
  const slot = {};
  const { setActive } = useQuestionActionStore.getState();
  setActive(card, true, null, 2);
  setActive(activity, true, slot);
  assert.equal(useQuestionActionStore.getState().suppressed, true);
  assert.equal(useQuestionActionStore.getState().menuSlot, null);
  setActive(card, false);
  assert.equal(useQuestionActionStore.getState().suppressed, false);
  assert.equal(useQuestionActionStore.getState().menuSlot, slot);
});
