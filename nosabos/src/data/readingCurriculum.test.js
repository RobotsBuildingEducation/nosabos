import test from "node:test";
import assert from "node:assert/strict";
import { getLearningPath } from "./skillTreeData.js";
import { getReadingScopeIssues } from "./readingCurriculum.js";
import { loadLearningPath } from "./skillTree/index.js";
import { selectNextReadingFormat } from "../utils/readingHistoryStore.js";
import { getLessonAgenda, buildCurriculumPromptContext } from "../utils/lessonCurriculum.js";

test("every non-tutorial reading and story has authored variety across languages and levels", async () => {
  let readingCount = 0, storyCount = 0;
  for (const lang of ["en", "es", "pt", "fr", "it", "nl", "nah", "ja", "ru", "de", "el", "pl", "ga", "yua"]) {
    for (const level of ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"]) {
      const units = await loadLearningPath(lang, level);
      assert.deepEqual(getReadingScopeIssues(units), [], `${lang} ${level}`);
      for (const lesson of units.flatMap((unit) => unit.lessons)) {
        const reading = lesson.content?.reading, story = lesson.content?.stories;
        if (reading && reading.topic !== "tutorial") readingCount++;
        if (!story || story.topic === "tutorial") continue;
        storyCount++;
        assert.ok(story.storyScope && story.storyScope.source !== "fallback", lesson.id);
        assert.ok(story.storySubjects.length >= 4, lesson.id);
        assert.equal(new Set(story.storySubjects.map((subject) => subject.id)).size, story.storySubjects.length);
        assert.equal(story.storyScope.requiredDocument, undefined, "Reading document rules must not constrain Stories");
      }
    }
  }
  assert.ok(readingCount > 2000 && storyCount > 2000);
});

test("document comprehension survives variation even when legacy format heuristics disagree", () => {
  const lessons = ["Pre-A1", "A1"].flatMap((level) => getLearningPath("en", level).flatMap((unit) => unit.lessons));
  for (const id of ["lesson-a1-3-3", "lesson-a1-7-3", "lesson-a1-8-3", "lesson-a1-11-3"]) {
    const reading = lessons.find((lesson) => lesson.id === id).content.reading;
    const plan = selectNextReadingFormat({ readingScope: reading.readingScope, readingSubjects: reading.readingSubjects, promptText: "reactions", cefrLevel: "A1" });
    assert.equal(plan.format.name, reading.readingScope.requiredDocument.name);
    assert.ok(plan.subject);
  }
});

test("More Family broadens the scene while keeping relatives, and reviews inherit the corrected goal", () => {
  const units = getLearningPath("en", "Pre-A1");
  const unit = units.find((unit) => unit.lessons.some((lesson) => lesson.id === "lesson-pre-a1-1-2"));
  const family = unit.lessons.find((lesson) => lesson.id === "lesson-pre-a1-1-2");
  const context = buildCurriculumPromptContext({ agendaItems: getLessonAgenda(family) }, { mode: "stories", includeExamples: false });
  assert.match(context, /Identify extended family members/i);
  assert.doesNotMatch(context, /I visit my grandparents/);
  assert.ok(family.content.stories.storySubjects.some((subject) => subject.name.includes("cousin")));
  const review = unit.lessons.find((lesson) => lesson.id.includes("integrated-practice"));
  assert.ok(review.agenda.items.some((item) => item.goal.includes("Identify extended family members")));
  assert.ok(review.content.stories.storySubjects.some((subject) => subject.id.startsWith("extended_family")));
});
