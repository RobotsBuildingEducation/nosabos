import test from "node:test";
import assert from "node:assert/strict";

import {
  getLearningPath as getAggregateLearningPath,
} from "../skillTreeData.js";
import { loadLearningPath } from "./index.js";

test("split CEFR loaders preserve the aggregate Spanish curriculum", async () => {
  for (const level of ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"]) {
    assert.deepEqual(
      await loadLearningPath("es", level),
      getAggregateLearningPath("es", level),
    );
  }
});

test("split target-language chunks preserve authored curriculum", async () => {
  for (const [language, level] of [
    ["en", "A1"],
    ["ja", "C1"],
    ["de", "B2"],
  ]) {
    assert.deepEqual(
      await loadLearningPath(language, level),
      getAggregateLearningPath(language, level),
    );
  }
});
