import test from "node:test";
import assert from "node:assert/strict";
import { getInitialLoadingPresentation, shouldShowInitialProgress } from "./loadingPresentation.js";

test("only landing and links receive a public first-visit progress screen", () => {
  for (const path of ["/", "/links", "/links/"]) assert.equal(getInitialLoadingPresentation(path), "progress");
  for (const path of ["/onboarding", "/onboarding/profile", "/proficiency", "/subscribe", "/citizenship", "/squircle", "/orbing", "/patreon-return", "/legacy-links"]) {
    assert.equal(getInitialLoadingPresentation(path), "ellipsis", path);
  }
  assert.equal(getInitialLoadingPresentation("/", true), "ellipsis");
  assert.equal(getInitialLoadingPresentation("/links", true), "progress");
});

test("later navigations never restart the full public progress screen", () => {
  const first = { pathname: "/links", initialPathname: "/links", initialLoadingComplete: false, authenticated: false };
  assert.equal(shouldShowInitialProgress(first), true);
  assert.equal(shouldShowInitialProgress({ ...first, initialLoadingComplete: true }), false);
  assert.equal(shouldShowInitialProgress({ ...first, pathname: "/" }), false);
  assert.equal(shouldShowInitialProgress({ ...first, pathname: "/proficiency" }), false);
  assert.equal(shouldShowInitialProgress({ ...first, pathname: "/links/" }), true);
});

test("signing in from landing switches to minimal app feedback even before startup is marked complete", () => {
  assert.equal(shouldShowInitialProgress({ pathname: "/", initialPathname: "/", initialLoadingComplete: false, authenticated: true }), false);
});
