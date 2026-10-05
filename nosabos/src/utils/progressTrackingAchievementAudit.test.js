import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import parser from "@babel/parser";
import { COURSE_PROGRESS_COLLECTION, COURSE_PROGRESS_SCHEMA_VERSION, normalizeCourseLevel, toCourseLevelKey, createEmptyCourseProgressSummary } from "./courseProgress.js";
import { LESSON_COUNTS, getLessonLevelFromId } from "./cefrProgress.js";
import { piyaliCompletionProof } from "./piyaliAchievementProgress.js";
import { earnedProgressionIds } from "../achievements/progressionEvidence.js";

// Run the actual production save functions with an isolated transaction store.
// Extracting declarations avoids initializing Firebase/App Check in Node.
const source = readFileSync(new URL("./progressTracking.js", import.meta.url), "utf8");
const ast = parser.parse(source, { sourceType: "module" });
const names = ["getLessonCourseLevel", "getCourseSummaryCompletionPatch", "completeLesson", "completeTutorLesson"];
const declarations = names.map(name => {
  const node = ast.program.body.map(node => node.declaration || node).find(node => node.type === "FunctionDeclaration" && node.id.name === name);
  assert.ok(node, `${name} remains connected to the production module`);
  return source.slice(node.start, node.end);
}).join("\n");

test("real lesson and Tutor transactions increment achievements once and retry failed saves", async () => {
  for (const [method, mode, field, metric] of [
    ["completeLesson", "skillTree", "languageLessons", "skill_tree_lessons"],
    ["completeTutorLesson", "tutor", "tutorLanguageLessons", "tutor_lessons"],
  ]) {
    const database = new Map(), npub = `save-audit-${mode}`, userPath = `users/${npub}`;
    const summaryPath = `${userPath}/courseProgress/es`;
    const summary = createEmptyCourseProgressSummary("es");
    summary.migration.complete = true;
    summary[mode].levels.pre_a1.completed = 4;
    database.set(userPath, { progress: {} });
    database.set(summaryPath, summary);
    const merge = (old = {}, patch) => Object.fromEntries([...new Set([...Object.keys(old), ...Object.keys(patch)])].map(key => {
      const value = patch[key];
      return [key, value === undefined ? old[key] : value?.incrementBy !== undefined ? (old[key] || 0) + value.incrementBy :
        value && typeof value === "object" ? merge(old[key], value) : value];
    }));
    let fail = true;
    const dependencies = { doc: (_db, ...parts) => parts.join("/"), database, SKILL_STATUS: { COMPLETED: "completed" },
      serverTimestamp: () => "saved", deleteField: () => null, normalizeCourseLevel, getLessonLevelFromId,
      COURSE_PROGRESS_COLLECTION, COURSE_PROGRESS_SCHEMA_VERSION, LESSON_COUNTS, toCourseLevelKey, increment: incrementBy => ({ incrementBy }),
      runTransaction: async (_db, run) => {
        if (fail) throw new Error("test offline");
        const writes = [];
        await run({ get: async path => ({ exists: () => database.has(path), data: () => database.get(path) }),
          update: (path, patch) => writes.push([path, patch]), set: (path, patch) => writes.push([path, patch]) });
        for (const [path, patch] of writes) database.set(path, merge(database.get(path), patch));
      },
    };
    const production = Function(...Object.keys(dependencies), declarations + "\nreturn { completeLesson, completeTutorLesson };")(...Object.values(dependencies));
    const lessonId = "lesson-pre-a1-last";
    const errors = console.error;
    console.error = () => {};
    try { await assert.rejects(production[method](npub, lessonId, 5, "es", "Pre-A1"), /test offline/); }
    finally { console.error = errors; }
    const earned = () => earnedProgressionIds("nosabos", piyaliCompletionProof({ profile: {}, summary: database.get(summaryPath), language: "es" }).evidence);
    assert.ok(!earned().includes(`nosabos_${metric}_5`));
    fail = false;
    await production[method](npub, lessonId, 5, "es", "Pre-A1");
    assert.equal(database.get(`${userPath}/${field}/es_${lessonId}`).status, "completed");
    assert.ok(earned().includes(`nosabos_${metric}_5`));
    await production[method](npub, lessonId, 5, "es", "Pre-A1");
    assert.equal(database.get(summaryPath)[mode].levels.pre_a1.completed, 5, "another device repeating this lesson cannot double count");
    await production[method](npub, lessonId, 5, "ja", "Pre-A1");
    assert.equal(database.get(summaryPath)[mode].levels.pre_a1.completed, 5, "languages retain separate summaries");
  }
});
