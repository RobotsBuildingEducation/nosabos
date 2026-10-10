import test from "node:test";
import assert from "node:assert/strict";
import { landingEthosCopy, getLandingEthosCopy } from "./landingEthosCopy.js";
import { landingPageRefreshCopy } from "./landingPageRefreshCopy.js";

test("every landing locale has the three ethos principles and Bitcoin FAQ guidance", () => {
  assert.deepEqual(
    Object.keys(landingEthosCopy).sort(),
    Object.keys(landingPageRefreshCopy).sort(),
  );
  for (const [locale, copy] of Object.entries(landingEthosCopy)) {
    assert.ok(copy.label && copy.title && copy.bitcoinQuestion, locale);
    assert.equal(copy.principles.length, 3, locale);
    assert.ok(
      copy.bitcoinAnswer.includes(locale === "zh" ? "二维码" : "QR"),
      locale,
    );
    for (const principle of copy.principles)
      assert.ok(principle.title && principle.lead && principle.body, locale);
    for (const term of ["Bitcoin", "US$0.10", "Lightning", "Cash App"])
      assert.ok(copy.bitcoinAnswer.includes(term), `${locale}: ${term}`);
  }
  assert.equal(getLandingEthosCopy("unknown"), landingEthosCopy.en);
});
