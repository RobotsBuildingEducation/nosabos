/* eslint-disable react-refresh/only-export-components -- Manual live integration fixture. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { loadLearningPath } from "../../src/data/skillTree";
import { buildCurriculumPromptContext, getLessonAgenda } from "../../src/utils/lessonCurriculum";
import { createStoryPlan, buildStoryDiversityPrompt, recordStoryHistory, storySessionCandidate } from "../../src/features/stories/storyDiversity";
import { buildSpeakingStoryPrompt, getStoryDifficulty } from "../../src/features/stories/storyPrompts";
import { generatePracticeStory } from "../../src/features/stories/practiceStoryGeneration";
import { generateStorySession } from "../../src/features/stories/storyGeneration";
import { buildStorySessionPrompt } from "../../src/features/stories/storySession";
import { storyServices } from "../../src/features/stories/storyServices";
import { readingModel, readingRevisionModel, storyModel, storyRevisionModel } from "../../src/firebaseResources/firebaseResources";
import { reviewGeneratedActivity } from "../../src/utils/activityReviewService";
import { buildReadingDiversityPrompt, selectNextReadingFormat } from "../../src/utils/readingHistoryStore";
import { collectReadingStream, generateReadingWithQuality } from "../../src/utils/readingGeneration";

function Check() {
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (family) => {
    setBusy(true);
    const outputs = []; const rejections = []; let requests = 0, reviews = 0;
    const report = (status) => setResult(`${status}; ${requests} generations; ${reviews} reviews\n${JSON.stringify({ outputs, rejections }, null, 2)}`);
    const review = async (options) => { reviews++; const issues = await reviewGeneratedActivity(options); if (issues.length) rejections.push({ issues, candidate: options.candidate }); return issues; };
    report("Starting");
    try {
      const units = await loadLearningPath("en", "Pre-A1");
      const lessons = units.flatMap((unit) => unit.lessons);
      if (family) {
        const lesson = lessons.find((lesson) => lesson.id === "lesson-pre-a1-1-2");
        const lessonContent = { ...lesson.content.stories, curriculumContext: { lessonId: lesson.id, agendaItems: getLessonAgenda(lesson) } };
        const npub = `live-variety-fixture-${Date.now()}`;
        for (const mode of ["practice", "radio", "conversation"]) {
          const plan = createStoryPlan({ lessonContent, lessonId: lesson.id, npub, targetLang: "en", mode });
          report(`Generating ${mode}`);
          let candidate;
          if (mode === "practice") {
            const prompt = buildSpeakingStoryPrompt({ targetName: "English", targetLang: "en", difficulty: getStoryDifficulty("Pre-A1", { includeTranslations: false }), isTutorial: false, scenarioDirective: plan.objective, curriculumContext: buildStoryDiversityPrompt(plan) });
            const story = await generatePracticeStory({ prompt, plan, review,
              generate: async (input, { isRevision }) => { requests++; const r = await (isRevision ? storyRevisionModel : storyModel).generateContent({ contents: [{ role: "user", parts: [{ text: input }] }], generationConfig: { maxOutputTokens: 8192 } }); return r.response.text(); },
            });
            candidate = { title: "Practice", target: story.fullStory.tgt };
          } else {
            const prompt = buildStorySessionPrompt({ mode, targetName: "English", supportName: "Spanish", targetLang: "en", supportLang: "es", difficulty: getStoryDifficulty("Pre-A1"), context: `${plan.objective}\n${buildStoryDiversityPrompt(plan)}` });
            const story = await generateStorySession({ prompt, plan, review, targetLang: "en", generate: async (input, options) => { requests++; return storyServices.generate(input, options); } });
            candidate = storySessionCandidate(story);
          }
          outputs.push({ mode, subject: plan.subject.name, ...candidate });
          recordStoryHistory(plan, candidate);
          report(`Accepted ${mode}`);
        }
      } else {
        for (const [index, id] of ["lesson-pre-a1-1-3", "lesson-pre-a1-1-3", "lesson-pre-a1-6-3", "lesson-pre-a1-5-3"].entries()) {
          const lesson = lessons.find((lesson) => lesson.id === id);
          const content = lesson.content.reading;
          const plan = selectNextReadingFormat({ cefrLevel: "Pre-A1", readingSubjects: [content.readingSubjects[index % content.readingSubjects.length]], readingScope: content.readingScope, promptText: content.prompt, topicText: content.topic });
          const objective = buildCurriculumPromptContext({ lessonId: id, agendaItems: getLessonAgenda(lesson) }, { mode: "reading", includeExamples: false });
          const history = outputs.filter((output) => output.lessonId === id).map((output) => ({ title: output.title, targetText: output.target }));
          const prompt = ["Write one Pre-A1 English reading with Spanish takeaways and comprehension question.", objective,
            buildReadingDiversityPrompt({ targetLang: "en", cefrLevel: "Pre-A1", formatSelection: plan, topicText: content.topic, promptText: content.prompt }),
            `Recent titles: ${JSON.stringify(history.map((entry) => entry.title))}`,
            'Return NDJSON with a title record {"type":"title","text":"..."}, target prose records {"type":"target","text":"..."}, three takeaway records {"type":"takeaway","text":"..."}, one separate {"type":"review_question","questionType":"text","question":"...","answer":"..."}, then {"type":"done"}.',
          ].join("\n");
          report(`Generating ${id} with ${plan.subject.name}`);
          const candidate = await generateReadingWithQuality({ prompt, targetLang: "en", formatSelection: plan, recentEntries: history,
            review: (candidate) => review({ candidate, objective, selection: plan, recentEntries: history, mode: "reading", targetLang: "en" }),
            generate: async (input, { isRevision }) => { requests++; const response = await (isRevision ? readingRevisionModel : readingModel).generateContentStream({ contents: [{ role: "user", parts: [{ text: input }] }], generationConfig: { temperature: 0.9 } }); return collectReadingStream(response.stream, (chunk) => chunk.text()); },
          });
          outputs.push({ lessonId: id, subject: plan.subject.name, format: plan.format.name, title: candidate.title, target: candidate.target });
        }
      }
      report("PASS");
    } catch (error) { report(`FAIL: ${error.message} ${JSON.stringify(error.issues || [])}`); }
    finally { setBusy(false); }
  };
  return <main style={{ maxWidth: 950, margin: "30px auto", fontFamily: "sans-serif" }}>
    <h1>Activity variety integration check</h1>
    <p>Real model requests using the authored curriculum and quality review. No learner progress, XP, or audio writes. Story history uses a dedicated test identity.</p>
    <button disabled={busy} onClick={() => run(true)}>Check three family modes</button>
    <button disabled={busy} onClick={() => run(false)}>Check reading variety and documents</button>
    <pre role="status" style={{ whiteSpace: "pre-wrap" }}>{result}</pre>
  </main>;
}
createRoot(document.getElementById("root")).render(<Check />);
