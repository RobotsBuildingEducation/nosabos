import test from "node:test";
import assert from "node:assert/strict";
import { isNsecSecretKeyLike } from "./nostrKeyDetection.js";

test("detects nsec secret keys pasted into a text field", () => {
  assert.equal(isNsecSecretKeyLike("nsec1example"), true);
  assert.equal(isNsecSecretKeyLike("  NSEC1EXAMPLE  "), true);
});

test("does not classify ordinary display names as secret keys", () => {
  assert.equal(isNsecSecretKeyLike("Nseca"), false);
  assert.equal(isNsecSecretKeyLike("Taylor"), false);
  assert.equal(isNsecSecretKeyLike(""), false);
});
