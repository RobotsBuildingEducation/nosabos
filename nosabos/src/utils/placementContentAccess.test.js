import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import parser from "@babel/parser";
import { isContentUnlockedByPlacement } from "./proficiencyPlacement.js";
import { getLessonLevelFromId } from "./cefrProgress.js";
import { getLatestUnlockedLesson, loadLearningPath, SKILL_STATUS } from "../data/skillTree/index.js";
import { getPhonicsGenerationLevel, getPhonicsBand } from "./phonicsLevel.js";
import { earnedProgressionIds } from "../achievements/progressionEvidence.js";

function sourceFor(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const ast = parser.parse(source, { sourceType: "module", plugins: ["jsx"] });
  return { source, ast };
}
function findNode(ast, predicate) {
  if (!ast || typeof ast !== "object") return null;
  if (predicate(ast)) return ast;
  for (const value of Object.values(ast)) {
    for (const child of Array.isArray(value) ? value : [value]) {
      const found = findNode(child, predicate);
      if (found) return found;
    }
  }
  return null;
}
const tutor = sourceFor("../components/Tutor.jsx");
const functions = ["isTutorLessonUnlocked", "isTutorLessonUnlockedById", "findLatestTutorUnlockedLesson"].map(name => {
  const node = findNode(tutor.ast, node => node.type === "FunctionDeclaration" && node.id?.name === name);
  assert.ok(node, name);
  return tutor.source.slice(node.start, node.end);
}).join("\n");
const tutorAccess = Function("isContentUnlockedByPlacement", "SKILL_STATUS", `${functions}; return { isTutorLessonUnlocked, isTutorLessonUnlockedById, findLatestTutorUnlockedLesson };`)(isContentUnlockedByPlacement, SKILL_STATUS);
const tree = sourceFor("../components/SkillTree.jsx");
const statusStart = tree.source.indexOf("const lessonProgress = lessonProgressById[lesson.id];");
const statusEnd = tree.source.indexOf("// Create zigzag pattern", statusStart);
assert.ok(statusStart > 0 && statusEnd > statusStart);
const treeStatus = Function("lesson", "lessonIndex", "lessonProgressById", "index", "previousUnitLastLessonStatus", "isTutorialComplete", "isPlacementUnlocked", "unit", "SKILL_STATUS", "isMasterUnlockActive", tree.source.slice(statusStart, statusEnd) + "return status;");
const tracking = sourceFor("./progressTracking.js");
const getStatusNode = findNode(tracking.ast, node => node.type === "FunctionDeclaration" && node.id?.name === "getLessonStatus");
const lessonStatus = Function("isContentUnlockedByPlacement", "SKILL_STATUS", "isMasterUnlockActive", "getLanguageXp", "getLessonLevelFromId", tracking.source.slice(getStatusNode.start, getStatusNode.end) + ";return getLessonStatus;")(
  isContentUnlockedByPlacement, SKILL_STATUS, () => false, () => 0, getLessonLevelFromId);

test("actual lesson and Tutor gates open all nodes through placement with zero XP and no completions", async () => {
  for (const placement of ["A2", "B2", "C2"]) {
    const progress = { proficiencyPlacements: { es: placement, ja: "A1" }, languageLessons: { es: {} }, totalXp: 0 };
    for (const level of ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"]) {
      const units = (await loadLearningPath("es", level)).map(unit => ({ ...unit, cefrLevel: level }));
      const placed = isContentUnlockedByPlacement(placement, level);
      for (const [unitIndex, unit] of units.entries()) for (const [lessonIndex, lesson] of unit.lessons.entries()) {
        // The first normal node is available sequentially; all other nodes
        // must remain locked above placement when there is no prior work.
        const sequential = unitIndex === 0 && lessonIndex === 0;
        assert.equal(tutorAccess.isTutorLessonUnlocked(units, {}, unitIndex, lessonIndex, placement), placed || sequential);
        assert.equal(tutorAccess.isTutorLessonUnlockedById(units, {}, lesson.id, placement), placed || sequential);
        assert.equal(treeStatus(lesson, lessonIndex, {}, unitIndex, "", true, placed, unit, SKILL_STATUS, () => false), placed || sequential ? "available" : "locked");
        if (placed) assert.equal(lessonStatus(progress, { ...lesson, cefrLevel: level }, "es"), "available");
      }
      const late = units.at(-1).lessons.at(-1);
      assert.equal(lessonStatus(progress, { ...late, cefrLevel: level, xpRequired: 999999 }, "es"), placed ? "available" : "locked");
      assert.equal(lessonStatus(progress, { ...late, cefrLevel: "B2", xpRequired: 999999 }, "ja"), "locked", "placement is language-specific");
    }
    assert.deepEqual(progress.languageLessons.es, {});
    assert.deepEqual(earnedProgressionIds("nosabos", { language: "es", ...progress }), [], "access never awards completion");
  }
});

test("placement-aware recommendations resume saved work and start Tutor at the placed level", async () => {
  const levels = await Promise.all(["Pre-A1", "B2"].map(async level => (await loadLearningPath("es", level)).map(unit => ({ ...unit, cefrLevel: level }))));
  const units = levels.flat();
  assert.equal(tutorAccess.findLatestTutorUnlockedLesson(units, {}, "B2").unit.cefrLevel, "B2");
  const current = levels[1].at(-1).lessons.at(-1);
  assert.equal(tutorAccess.isTutorLessonUnlockedById(units, {}, current.id, "B2"), true);
  const lateUnit = { ...levels[1].at(-1), lessons: [current] };
  assert.equal(getLatestUnlockedLesson([lateUnit], {}, false, "B2").lesson.id, current.id);
  assert.equal(getLatestUnlockedLesson([lateUnit], {}, false, "A1"), null);
  assert.equal(tutorAccess.findLatestTutorUnlockedLesson(units, {}).unit.cefrLevel, "Pre-A1");
  assert.equal(lessonStatus({ proficiencyPlacements: { es: "B2" }, languageLessons: { es: { [current.id]: { status: "completed" } } } }, current, "es"), "completed");
});

test("both flashcard display gates open later new cards at the placed level", () => {
  const cards = [{ id: "b2-1", cefrLevel: "B2" }, { id: "b2-2", cefrLevel: "B2" }];
  const flashcards = sourceFor("../components/FlashcardSkillTree.jsx");
  const getStatus = findNode(flashcards.ast, node => node.type === "VariableDeclarator" && node.id.name === "getCardStatus").init.arguments[0];
  const resolveStatus = findNode(flashcards.ast, node => node.type === "JSXAttribute" && node.name.name === "resolveCardStatus" && node.value?.expression?.type === "ArrowFunctionExpression").value.expression;
  for (const callback of [getStatus, resolveStatus]) {
    const make = Function("isContentUnlockedByPlacement", "placementLevel", "activeCEFRLevel", "reviewSnapshotMap", "FLASHCARD_REVIEW_STATES", "firstNewCard", "firstNewCardIndex", "deckData", `return (${flashcards.source.slice(callback.start, callback.end)});`);
    assert.equal(make(isContentUnlockedByPlacement, "B2", "B2", new Map(), { DUE: "due" }, cards[0], 0, cards)(cards[1]), "active");
    assert.equal(make(isContentUnlockedByPlacement, "A1", "B2", new Map(), { DUE: "due" }, cards[0], 0, cards)(cards[1]), "locked");
  }
});

test("B2 placement seeds advanced generated phonics even without completed decks", () => {
  const level = getPhonicsGenerationLevel({ placementLevel: "B2", courseCeilingLevel: "B2", completedDeckCount: 0 });
  assert.equal(level, "B2");
  assert.equal(getPhonicsBand(level), "advanced");
});
