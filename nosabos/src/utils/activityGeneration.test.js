import test from "node:test";
import assert from "node:assert/strict";
import { generateUsableActivity, isExactActivityRepeat } from "./activityGeneration.js";

const original = { title: "Our teacher", target: "Lina is our teacher. She helps us read.", question: { answer: [0] } };
const improved = { title: "The class photo", target: "Lina stands beside our class in this photo.", question: { answer: [1] } };
const options = {
  prompt: "Original lesson and output protocol",
  generate: async () => original,
  validate: (raw) => { if (!raw?.target || !raw.question) throw new Error("Invalid content"); return raw; },
  buildRevisionPrompt: ({ prompt, stage }) => `${prompt}\n${stage}`,
  reviewTimeoutMs: 15, rewriteTimeoutMs: 15,
};

test("style review has one improvement attempt and preserves the better complete candidate", async () => {
  let calls = 0;
  const requests = [];
  const result = await generateUsableActivity({ ...options,
    generate: async (prompt, context) => { requests.push({ prompt, context }); return ++calls === 1 ? original : improved; },
    review: async (candidate) => candidate === original ? ["Similar opening"] : ["Similar opening", "Repeated ending"],
    onDiagnostic: () => assert.fail("Advisory criticism must not be logged as a failed generation"),
  });
  assert.deepEqual(result, original);
  assert.equal(calls, 2);
  assert.equal(requests[0].context.isRevision, false);
  assert.equal(requests[1].context.isRevision, true);
  assert.match(requests[1].prompt, /Original lesson and output protocol/);
});

test("a better revision includes its own matching question, not the first draft's", async () => {
  let calls = 0;
  const result = await generateUsableActivity({ ...options,
    generate: async () => ++calls === 1 ? original : improved,
    getQualityIssues: (candidate) => candidate === original ? ["Repetitive structure"] : [],
    review: async () => [],
  });
  assert.deepEqual(result, improved);
  assert.equal(calls, 2);
});

test("a broken, malformed, or slow optional reviewer cannot fail a valid activity", async (t) => {
  const reviews = {
    throwing: () => { throw new Error("Quota exhausted"); },
    rejecting: async () => { throw new Error("Network offline"); },
    malformed: async () => ({ issues: "not an array" }),
    mixed: async () => [null, "bad format"],
    stalled: () => new Promise(() => {}),
  };
  for (const [name, review] of Object.entries(reviews)) await t.test(name, async () => {
    let calls = 0;
    const result = await generateUsableActivity({ ...options, generate: async () => { calls++; return original; }, review });
    assert.deepEqual(result, original);
    assert.equal(calls, 1);
  });
});

test("optional rewrite failure, invalid output, and timeout all recover the validated draft", async (t) => {
  const rewrites = {
    throwing: () => { throw new Error("Rate limited"); },
    malformed: async () => "broken JSON",
    incomplete: async () => ({ title: "Only a title" }),
    stalled: () => new Promise(() => {}),
  };
  for (const [name, rewrite] of Object.entries(rewrites)) await t.test(name, async () => {
    let calls = 0;
    const diagnostics = [];
    const result = await generateUsableActivity({ ...options,
      generate: (...args) => ++calls === 1 ? original : rewrite(...args),
      review: async () => ["Try another treatment"],
      onDiagnostic: (detail) => diagnostics.push(detail),
    });
    assert.deepEqual(result, original);
    assert.equal(calls, 2);
    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].recovered, true);
  });
});

test("late responses from timed-out optional work cannot replace the returned activity", async () => {
  let finishRewrite;
  let calls = 0;
  const result = await generateUsableActivity({ ...options,
    generate: () => ++calls === 1 ? original : new Promise((resolve) => { finishRewrite = resolve; }),
    review: async () => ["Change the opening"],
  });
  finishRewrite(improved);
  await Promise.resolve();
  assert.deepEqual(result, original);
});

test("broken content is repaired before a candidate can become a fallback", async () => {
  const prompts = [];
  let reviews = 0;
  const result = await generateUsableActivity({ ...options,
    generate: (prompt) => { prompts.push(prompt); return prompts.length === 1 ? null : original; },
    review: async () => { reviews++; return ["Vary the style"]; },
  });
  assert.deepEqual(result, original);
  assert.equal(prompts.length, 3);
  assert.match(prompts[1], /validation/);
  assert.match(prompts[2], /quality/);
  assert.equal(reviews, 2, "An invalid draft must never reach optional style review");
});

test("no usable draft still raises a real bounded validation or service error", async () => {
  let calls = 0;
  await assert.rejects(generateUsableActivity({ ...options, maxInvalidAttempts: 2,
    generate: async () => { calls++; return null; },
    review: () => assert.fail("Invalid content cannot reach review"),
  }), /Invalid content/);
  assert.equal(calls, 2);
  await assert.rejects(generateUsableActivity({ ...options, generate: async () => { throw new Error("Writer unavailable"); } }), /Writer unavailable/);
});

test("cancellation before or during generation, review, and rewrite never returns a stale activity", async (t) => {
  for (const stage of ["before", "generation", "review", "rewrite"]) await t.test(stage, async () => {
    let cancelled = stage === "before";
    let calls = 0;
    const result = await generateUsableActivity({ ...options,
      isCancelled: () => cancelled,
      generate: async () => {
        calls++;
        if (stage === "generation" || (stage === "rewrite" && calls === 2)) cancelled = true;
        return original;
      },
      review: async () => { if (stage === "review") cancelled = true; return ["Change style"]; },
      onDiagnostic: () => assert.fail("Cancelled work should be ignored"),
    });
    assert.equal(result, null);
    assert.equal(calls, stage === "before" ? 0 : stage === "rewrite" ? 2 : 1);
  });
});

test("exact duplicate detection handles typography and legacy history without blocking new content", () => {
  assert.equal(isExactActivityRepeat("  Lina IS our teacher!  ", [{ targetText: "Lina is our teacher." }]), true);
  assert.equal(isExactActivityRepeat("Ｃａｆé", [{ snippet: "Cafe\u0301" }]), true);
  assert.equal(isExactActivityRepeat("今日は雨です。", [{ targetText: "今日は雨です！" }]), true);
  assert.equal(isExactActivityRepeat("Lina is our teacher. She has a new book.", [{ targetText: "Lina is our teacher. She has a red pen." }]), false);
  assert.equal(isExactActivityRepeat("", [{ targetText: "" }]), false);
});
