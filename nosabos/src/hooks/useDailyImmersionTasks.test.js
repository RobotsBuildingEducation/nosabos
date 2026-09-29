import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("useDailyImmersionTasks implements optimistic completion and celebration", () => {
  const fileContent = fs.readFileSync(path.join(__dirname, "useDailyImmersionTasks.js"), "utf8");

  // Verify optimistic check on completing all tasks
  assert.ok(
    fileContent.includes("const isCompletingAll = completed.length > 0 && completed.every(Boolean) && !batch.rewarded;"),
    "toggleTask should compute isCompletingAll",
  );

  // Verify next state includes rewarded: true optimistically
  assert.ok(
    fileContent.includes("rewarded: true, rewardedAt: new Date().toISOString()"),
    "toggleTask should optimistically set rewarded: true and rewardedAt",
  );

  // Verify patchUser is called immediately
  assert.ok(
    fileContent.includes("patchUser?.({ realWorldTasks: next });"),
    "toggleTask should immediately patchUser with optimistic state",
  );

  // Verify instant celebration and sound
  assert.ok(
    fileContent.includes("if (isCompletingAll) {\n      setRewardJustAwarded(true);\n      void playSound(sparkleSound);\n    }"),
    "toggleTask should immediately trigger celebration and sparkleSound upon completing all",
  );

  // Verify awardCompletion called with alreadyCelebrated flag
  assert.ok(
    fileContent.includes("await awardCompletion(next, scopeRef.current, { alreadyCelebrated: true });"),
    "toggleTask should pass alreadyCelebrated: true to awardCompletion in the background",
  );

  // Verify awardCompletion skips duplicate celebration sound if alreadyCelebrated
  assert.ok(
    fileContent.includes("if (!options.alreadyCelebrated) {\n          setRewardJustAwarded(true);\n          void playSound(sparkleSound);\n        }"),
    "awardCompletion should not replay sparkleSound if already celebrated",
  );

  // Verify rollback on error if alreadyCelebrated was true
  assert.ok(
    fileContent.includes("if (options.alreadyCelebrated) {\n        setRewardJustAwarded(false);\n        const unrewarded = { ...completedBatch, rewarded: false };\n        if (scopeRef.current === expectedScope) {\n          patchUser?.({ realWorldTasks: unrewarded });\n        }\n        void persist(unrewarded, expectedScope).catch(() => {});\n      }"),
    "awardCompletion should rollback optimistic celebration and rewarded state on failure",
  );
});
