/* eslint-disable react-refresh/only-export-components -- Manual live integration check. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { readingModel } from "../../src/firebaseResources/firebaseResources";
import { buildCurriculumPromptContext, getLessonAgenda } from "../../src/utils/lessonCurriculum";
import { buildReadingDiversityPrompt, STRUCTURAL_FORMATS, READING_ANGLES, READING_STRUCTURES } from "../../src/utils/readingHistoryStore";
import preA1Units from "../../src/data/skillTree/baseLevels/pre-a1";
import { collectReadingStream, generateReadingWithQuality } from "../../src/utils/readingGeneration";

function Check() {
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (lessonType = "reactions") => {
    const peopleLesson = lessonType === "people"
      ? preA1Units.flatMap((unit) => unit.lessons).find((lesson) => lesson.id === "lesson-pre-a1-1-3")
      : null;
    setBusy(true);
    setResult(`Generating three Pre-A1 readings for ${peopleLesson ? "People Around Me" : "the same reactions objective"}…`);
    const history = [];
    let requests = 0;
    try {
      for (const [index, formatId] of (peopleLesson ? ["profile_description", "photo_caption", "personal_note"] : ["diary_entry", "mini_review", "personal_note"]).entries()) {
        const formatSelection = {
          format: STRUCTURAL_FORMATS.find((format) => format.id === formatId),
          readingAngle: READING_ANGLES[index + 4],
          structure: READING_STRUCTURES[index],
          subject: peopleLesson?.content.reading.readingSubjects[index] || null,
        };
        const prompt = [
          "Create one Pre-A1 English reading. Write the title and body in English and takeaways in Spanish.",
          buildCurriculumPromptContext({
            lessonId: peopleLesson?.id || "synthetic-reading-check",
            agendaItems: peopleLesson ? getLessonAgenda(peopleLesson) : [{ id: "reactions", kind: "comprehension", modes: ["reading"], targetRole: "goal",
              goal: "Recognize surprise and pleasure through short reactions in context",
              activityBrief: "Read a text message conversation full of reactions and exclamations" }],
          }, { mode: "reading", includeExamples: false }),
          buildReadingDiversityPrompt({ targetLang: "en", cefrLevel: "Pre-A1", formatSelection,
            topicText: peopleLesson?.content.reading.topic || "Reactions and exclamations",
            promptText: peopleLesson?.content.reading.prompt || "Recognize surprise and pleasure through short reactions in context" }),
          `Additional recent readings (comparison data only): ${JSON.stringify(history)}`,
          'Return NDJSON, one JSON object per line: {"type":"title","text":"..."}, then one {"type":"target","text":"..."} per sentence, then three {"type":"takeaway","text":"..."} lines, one {"type":"review_question","questionType":"text","question":"...","answer":"..."} line in Spanish, and {"type":"done"}. Keep the question outside the passage: target records contain only reading prose. No other output.',
        ].join("\n");
        const candidate = await generateReadingWithQuality({
          prompt, targetLang: "en", formatSelection, recentEntries: history,
          generate: async (input) => {
            requests++;
            const response = await readingModel.generateContentStream({
              contents: [{ role: "user", parts: [{ text: input }] }],
              generationConfig: { temperature: 0.9 },
            });
            return collectReadingStream(response.stream, (chunk) => chunk.text());
          },
        });
        history.push({ format: formatId, subject: formatSelection.subject?.id || "", title: candidate.title, targetText: candidate.target });
        setResult(`${history.length}/3 readings accepted after ${requests} requests\n\n${JSON.stringify(history, null, 2)}`);
      }
      setResult(`PASS: three readings accepted after ${requests} requests\n\n${JSON.stringify(history, null, 2)}`);
    } catch (error) {
      setResult(`FAIL: ${error.message}\n${JSON.stringify(error.issues || [])}\n\n${JSON.stringify(history, null, 2)}`);
    } finally {
      setBusy(false);
    }
  };
  return <main style={{ maxWidth: 900, margin: "32px auto", padding: 16, fontFamily: "sans-serif" }}>
    <h1>Reading generation check</h1>
    <p>Calls the real reading model with a synthetic reactions lesson or the authored People Around Me lesson. Does not save readings, award XP, or play audio.</p>
    <button disabled={busy} onClick={() => run()}>Generate three readings</button>
    <button disabled={busy} onClick={() => run("people")}>Check People Around Me</button>
    <pre style={{ whiteSpace: "pre-wrap" }} role="status">{result}</pre>
  </main>;
}
createRoot(document.getElementById("root")).render(<Check />);
