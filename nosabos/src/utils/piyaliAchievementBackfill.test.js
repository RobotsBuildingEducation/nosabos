import test from "node:test";
import assert from "node:assert/strict";
import { piyaliBackfillProofs, scanPiyaliAchievementHistory } from "./piyaliAchievementBackfill.js";
import { earnedProgressionIds, completeLevel } from "../achievements/progressionEvidence.js";
import { buildCourseProgressSummary } from "./courseProgress.js";
import { progressionSnapshot } from "../achievements/progressionRuntime.js";

test("Piyali catches up all languages and deduplicates legacy Tutor records", () => {
  const lesson = { id: "es_lesson-a1-9", data: { targetLang: "es", lessonId: "lesson-a1-9", status: "completed", tutorAgendaProgress: {} } };
  const records = { languageLessons: [lesson], tutorLanguageLessons: [lesson], languageFlashcards: [], courseProgress: [] };
  for (let i = 0; i < 10; i++) records.languageFlashcards.push({ id: `ja_a1-${i}`, data: { targetLang: "ja", cardId: `a1-${i}`, completed: true } });
  records.languageFlashcards.push(records.languageFlashcards[0], { id: "wrong", data: { targetLang: "ja", cardId: "a1-wrong", completed: false } });
  const result = piyaliBackfillProofs({ profile: { progress: { level: "C2", xp: 999999 } }, records });
  const es = result.proofs.find(proof => proof.evidence.language === "es");
  const ja = result.proofs.find(proof => proof.evidence.language === "ja");
  assert.equal(es.evidence.counters.tutor_lessons, 1);
  assert.equal(ja.evidence.counters.flashcards_completed, 10);
  assert.ok(earnedProgressionIds("nosabos", ja.evidence).includes("nosabos_flashcards_completed_10"));
  assert.ok(!earnedProgressionIds("nosabos", es.evidence).includes("nosabos_flashcards_completed_5"));
  assert.deepEqual(result.achievementIds, []);
});

test("older language-prefixed progress document IDs retain completions when targetLang is missing", () => {
  const result = piyaliBackfillProofs({ profile: {}, records: {
    languageFlashcards: [{ id: "es_a1-one", data: { cardId: "a1-one", completed: true } }],
  } });
  assert.equal(result.proofs[0].evidence.language, "es");
  assert.equal(result.proofs[0].evidence.counters.flashcards_completed, 1);
});

test("saved completed levels unlock their awards and Tutor reach milestones", () => {
  const summary = buildCourseProgressSummary({ targetLang: "es" });
  for (const stats of Object.values(summary.tutor.levels)) stats.completed = stats.total;
  const result = piyaliBackfillProofs({ profile: {}, records: { courseProgress: [{ id: "es", data: summary }] } });
  assert.ok(completeLevel(result.proofs[0].evidence.levels.tutor.c2));
  assert.deepEqual(result.achievementIds, ["tutor_reach_a2", "tutor_reach_b1", "tutor_reach_b2"]);
  assert.ok(earnedProgressionIds("nosabos", result.proofs[0].evidence).includes("piyali_tutor_complete_c2"));
  assert.ok(!earnedProgressionIds("nosabos", result.proofs[0].evidence).includes("piyali_full_curriculum_v4"));
});

test("historical higher-level completion earns earlier awards without beginner history", () => {
  const summary = buildCourseProgressSummary({ targetLang: "es" });
  summary.tutor.levels.a2.completed = summary.tutor.levels.a2.total;
  const result = piyaliBackfillProofs({ profile: {}, records: { courseProgress: [{ id: "es", data: summary }] } });
  const ids = earnedProgressionIds("nosabos", result.proofs[0].evidence);
  for (const level of ["pre_a1", "a1", "a2"]) assert.ok(ids.includes(`piyali_tutor_complete_${level}`));
  assert.ok(!ids.includes("piyali_tutor_complete_b1"));
  assert.deepEqual(result.achievementIds, ["tutor_reach_a2", "tutor_reach_b1"]);
  assert.equal(result.proofs[0].evidence.counters.tutor_lessons, summary.tutor.levels.a2.total);
});

test("Piyali imports saved repair, immersion and phonics completions with stable IDs", () => {
  const profile = { progress: { repairDailyActivity: { es: { "2026-01-01": 1 } } },
    realWorldTasks: { targetLang: "es", generatedAt: "stamp", dayKey: "2026-01-01", tasks: [{}], completed: { 0: true }, rewarded: true } };
  const records = { questDays: [{ id: "es_2026-01-01", data: { lang: "es", dayKey: "2026-01-01", repair: { createdAt: "repair", items: [{ cefrLevel: "B1" }], target: 1 } } }],
    alphabetPractice: [{ id: "es_base", data: { targetLang: "es", letterId: "base", correctCount: 1 } },
      { id: "es_gen_123_0", data: { targetLang: "es", letterId: "gen_123_0", correctCount: 1, generated: true, generatedDeckSize: 1 } }] };
  const result = piyaliBackfillProofs({ profile, records, alphabets: { es: [{ id: "base" }] } });
  const events = result.proofs.flatMap(proof => proof.events || []);
  const snapshot = progressionSnapshot("piyali-import-proof", "nosabos", {}, events);
  assert.equal(snapshot.counters.immersion_tasks, 1);
  assert.equal(snapshot.counters.immersion_checklists, 1);
  assert.equal(snapshot.counters.phonics_decks, 1);
  assert.equal(snapshot.levelCounts.repairs.b1, 1);
  assert.ok(result.proofs.some(proof => earnedProgressionIds("nosabos", proof.evidence).includes("nosabos_phonics_cards_all")));
});

test("an incomplete historical read fails instead of completing a partial scan", async () => {
  const dependencies = { database: {}, doc: (_db, ...parts) => parts.join("/"), collection: (_db, ...parts) => parts.join("/"),
    getDoc: async () => ({ data: () => ({}) }), getDocs: async ref => {
      if (ref.endsWith("/languageFlashcards")) throw new Error("offline");
      return { docs: [] };
    } };
  await assert.rejects(scanPiyaliAchievementHistory("account", dependencies), /offline/);
});
