import test from "node:test";
import assert from "node:assert/strict";

import {
  recordReadingHistory,
  getRecentReadingHistory,
  clearReadingHistory,
  buildReadingDiversityPrompt,
  stripMetaNarratorPreamble,
  stripSpeakerPrefix,
  getReadingLevelSpecs,
  selectNextReadingFormat,
  detectReadingFormat,
  STRUCTURAL_FORMATS,
  READING_ANGLES,
  getReadingComparisonHistory,
} from "./readingHistoryStore.js";
import preA1Units from "../data/skillTree/baseLevels/pre-a1.js";

test("People Around Me covers each relationship before reusing a subject, even across formats", () => {
  const lesson = preA1Units.flatMap((unit) => unit.lessons)
    .find((item) => item.id === "lesson-pre-a1-1-3");
  const targetLang = "people-subject-test";
  clearReadingHistory(targetLang);
  // Existing histories have no subject metadata. They must not keep the new
  // inventory stuck on the old neighborhood interpretation.
  recordReadingHistory({ targetLang, lessonId: lesson.id, title: "My neighbor", targetText: "My neighbor works at a cafe." });
  const seen = new Set();
  for (let index = 0; index < lesson.content.reading.readingSubjects.length; index++) {
    const selection = selectNextReadingFormat({ targetLang, lessonId: lesson.id, cefrLevel: "A0", ...lesson.content.reading });
    assert.ok(selection.subject);
    assert.ok(!seen.has(selection.subject.id), `${selection.subject.id} repeated before coverage completed`);
    if (index === 0) assert.equal(selection.subject.id, "friend");
    const prompt = buildReadingDiversityPrompt({ targetLang, lessonId: lesson.id, cefrLevel: "A0",
      formatSelection: selection, topicText: lesson.content.reading.topic, promptText: lesson.content.reading.prompt });
    assert.ok(prompt.includes(`CHOSEN CONTENT SUBJECT: ${selection.subject.name}`));
    seen.add(selection.subject.id);
    recordReadingHistory({ targetLang, lessonId: lesson.id, title: `New reading ${index}`,
      targetText: `Different text ${index}`, format: selection.format.id, subject: selection.subject.id });
  }
  assert.equal(seen.size, 8);
  assert.equal(selectNextReadingFormat({ targetLang, lessonId: lesson.id, ...lesson.content.reading }).subject.id, "friend");
  clearReadingHistory(targetLang);
});

test("subjects rotate within their own lesson without affecting lessons that have no inventory", () => {
  const targetLang = "subject-isolation-test";
  const readingSubjects = [{ id: "friend", name: "A friend" }, { id: "teacher", name: "A teacher" }];
  clearReadingHistory(targetLang);
  recordReadingHistory({ targetLang, lessonId: "lesson-one", title: "Friend", targetText: "A text", subject: "friend" });
  assert.equal(selectNextReadingFormat({ targetLang, lessonId: "lesson-one", readingSubjects }).subject.id, "teacher");
  assert.equal(selectNextReadingFormat({ targetLang, lessonId: "lesson-two", readingSubjects }).subject.id, "friend");
  assert.equal(selectNextReadingFormat({ targetLang, lessonId: "lesson-one" }).subject, null);
  clearReadingHistory(targetLang);
});

test("formats, angles, and structures do not repeat while unused suitable options remain", () => {
  const targetLang = "rotation-test";
  clearReadingHistory(targetLang);
  const formats = new Set();
  const angles = new Set();
  const structures = new Set();
  for (let index = 0; index < 8; index++) {
    const selection = selectNextReadingFormat({ targetLang, cefrLevel: "B1" });
    assert.ok(!formats.has(selection.format.id));
    assert.ok(!angles.has(selection.readingAngle.id));
    if (index < 6) assert.ok(!structures.has(selection.structure.id));
    formats.add(selection.format.id);
    angles.add(selection.readingAngle.id);
    structures.add(selection.structure.id);
    recordReadingHistory({ targetLang, title: `Entry ${index}`, targetText: `Unique text ${index}`,
      format: selection.format.id, readingAngle: selection.readingAngle.id, structure: selection.structure.id });
  }
  assert.equal(angles.size, READING_ANGLES.length);
  clearReadingHistory(targetLang);
});

test("reaction lessons rotate single-author genres without notices or advanced essays", () => {
  const targetLang = "reaction-test";
  clearReadingHistory(targetLang);
  const chosen = new Set();
  for (let index = 0; index < 5; index++) {
    const selection = selectNextReadingFormat({ targetLang, cefrLevel: "Pre-A1",
      promptText: "Read a text message conversation full of reactions and exclamations" });
    assert.ok(["personal_note", "diary_entry", "personal_update", "mini_review", "photo_caption"].includes(selection.format.id));
    assert.ok(!chosen.has(selection.format.id));
    chosen.add(selection.format.id);
    recordReadingHistory({ targetLang, title: `Entry ${index}`, targetText: `Text ${index}`, format: selection.format.id });
  }
  clearReadingHistory(targetLang);
});

test("a menu comprehension objective keeps a practical document format", () => {
  const selection = selectNextReadingFormat({ promptText: "Read a cafe menu and find the prices", cefrLevel: "A1" });
  assert.ok(["everyday_guide", "practical_notice"].includes(selection.format.id));
});

test("history preserves endings, same-title variants, and cross-lesson recency", () => {
  const targetLang = "history-test";
  clearReadingHistory(targetLang);
  const longText = "Details of a trip. ".repeat(30) + "The last train left without us.";
  recordReadingHistory({ targetLang, lessonId: "old", title: "A trip", targetText: longText });
  recordReadingHistory({ targetLang, lessonId: "old", title: "A trip", targetText: "Another visit to the coast." });
  recordReadingHistory({ targetLang, lessonId: "new", title: "Recent", targetText: "The latest reading." });
  const history = getReadingComparisonHistory(targetLang, "old");
  assert.equal(history[0].lessonId, "new");
  assert.equal(history.filter((entry) => entry.title === "A trip").length, 2);
  assert.ok(history.some((entry) => entry.targetText.endsWith("The last train left without us.")));
  clearReadingHistory(targetLang);
});

test("diversity instructions preserve required forms without turning vocabulary into a checklist", () => {
  const prompt = buildReadingDiversityPrompt({ promptText: "Read a conversation about greetings" });
  assert.match(prompt, /pool, not a checklist/);
  assert.match(prompt, /OBJECTIVES OVER LEGACY FORMAT REQUESTS/);
  assert.match(prompt, /Swapping nouns or changing the title of the same sentence skeleton is not variety/);
  assert.match(prompt, /clear cause in the same author's text/);
  assert.doesNotMatch(prompt, /SUGGESTED SITUATIONAL INSPIRATION|A conversation at a public transit stop/);
});

test("records and retrieves reading history with target language isolation", () => {
  clearReadingHistory("es");
  clearReadingHistory("en");

  recordReadingHistory({
    targetLang: "es",
    lessonId: "lesson-pre-a1-1-3",
    topic: "people in daily life",
    title: "Aviso de la biblioteca comunitaria",
    targetText: "Atención: La biblioteca está abierta para todos los vecinos.",
    format: "practical_notice",
  });

  recordReadingHistory({
    targetLang: "en",
    lessonId: "lesson-pre-a1-1-3",
    topic: "people in daily life",
    title: "Note to Maya",
    targetText: "Hi Maya, I left the keys on the kitchen table for you. See you soon!",
    format: "personal_note",
  });

  const esHistory = getRecentReadingHistory("es");
  assert.equal(esHistory.length, 1);
  assert.equal(esHistory[0].title, "Aviso de la biblioteca comunitaria");
  assert.equal(esHistory[0].lessonId, "lesson-pre-a1-1-3");
  assert.equal(esHistory[0].format, "practical_notice");

  const enHistory = getRecentReadingHistory("en");
  assert.equal(enHistory.length, 1);
  assert.equal(enHistory[0].title, "Note to Maya");
  assert.equal(enHistory[0].format, "personal_note");

  clearReadingHistory("es");
  clearReadingHistory("en");
});

test("prioritizes matching lessonId when retrieving history", () => {
  clearReadingHistory("en");

  recordReadingHistory({
    targetLang: "en",
    lessonId: "lesson-other",
    topic: "food",
    title: "Bakery Notice",
    targetText: "Notice: Fresh bread baked daily at seven in the morning.",
  });

  recordReadingHistory({
    targetLang: "en",
    lessonId: "lesson-pre-a1-1-3",
    topic: "people in daily life",
    title: "My Neighbor Lucas",
    targetText: "Lucas is my friendly neighbor. He works at the library and has a dog.",
    format: "profile_description",
  });

  const history = getRecentReadingHistory("en", "lesson-pre-a1-1-3");
  assert.equal(history.length, 2);
  assert.equal(history[0].title, "My Neighbor Lucas");
  assert.equal(history[0].lessonId, "lesson-pre-a1-1-3");

  clearReadingHistory("en");
});

test("stripMetaNarratorPreamble removes accidental meta preambles in multiple languages", () => {
  // English preamble with following text
  const text1 =
    "This is a text message chat between two gardeners taking a short break together. We have seeds today and the flowers are blooming.";
  assert.equal(
    stripMetaNarratorPreamble(text1),
    "We have seeds today and the flowers are blooming."
  );

  // English standalone preamble (returns empty string so caller can drop line)
  const text2 =
    "This is a text message chat between two library patrons looking for a quiet study desk today.";
  assert.equal(stripMetaNarratorPreamble(text2), "");

  // Spanish preamble with following text
  const text3 =
    "Esta es una conversación entre dos amigos en el mercado. En el mercado compramos fruta fresca.";
  assert.equal(
    stripMetaNarratorPreamble(text3),
    "En el mercado compramos fruta fresca."
  );

  // Text that starts directly without meta intro is untouched
  const text4 = "Lucas es mi vecino. Él trabaja en la biblioteca local.";
  assert.equal(stripMetaNarratorPreamble(text4), text4);
});

test("stripSpeakerPrefix removes accidental script speaker labels (A:, B:, Name:) while preserving notices", () => {
  assert.equal(
    stripSpeakerPrefix("A: This is my neighbor Lucas."),
    "This is my neighbor Lucas."
  );
  assert.equal(
    stripSpeakerPrefix("B: Hello Lucas, how are you today?"),
    "Hello Lucas, how are you today?"
  );
  assert.equal(
    stripSpeakerPrefix("Lucas: He is waiting with me for the bus."),
    "He is waiting with me for the bus."
  );
  assert.equal(
    stripSpeakerPrefix("Speaker 1: Welcome to our city."),
    "Welcome to our city."
  );
  // Preserves informational notice headers
  assert.equal(
    stripSpeakerPrefix("Notice: Library hours for Sunday are 10:00 to 17:00."),
    "Notice: Library hours for Sunday are 10:00 to 17:00."
  );
  assert.equal(
    stripSpeakerPrefix("Hours: Monday to Friday from 9 to 5."),
    "Hours: Monday to Friday from 9 to 5."
  );
});

test("getReadingLevelSpecs returns tailored constraints across CEFR levels", () => {
  const preA1 = getReadingLevelSpecs("Pre-A1");
  assert.equal(preA1.wordCount, "100–120 words");
  assert.match(preA1.lineRange, /8–14/);
  assert.match(preA1.sentenceLength, /6–12 words/);

  const a1 = getReadingLevelSpecs("A1");
  assert.equal(a1.wordCount, "120–150 words");
  assert.match(a1.lineRange, /10–16/);

  const a2 = getReadingLevelSpecs("A2");
  assert.equal(a2.wordCount, "150–190 words");

  const b1 = getReadingLevelSpecs("B1");
  assert.equal(b1.wordCount, "190–230 words");

  const b2 = getReadingLevelSpecs("B2");
  assert.equal(b2.wordCount, "230–270 words");

  const c1 = getReadingLevelSpecs("C1");
  assert.equal(c1.wordCount, "270–300 words");

  const c2 = getReadingLevelSpecs("C2");
  assert.equal(c2.wordCount, "280–300 words");
});

test("detectReadingFormat identifies profiles, notes, notices, and everyday guides without scripts", () => {
  assert.equal(
    detectReadingFormat("Lucas is my neighbor. He lives on Oak Street and takes the morning bus."),
    "profile_description"
  );
  assert.equal(
    detectReadingFormat("Dear roomie, I left some fresh fruit in the kitchen. Enjoy!"),
    "personal_note"
  );
  assert.equal(
    detectReadingFormat("Notice: Library hours for Sunday are 10:00 to 17:00."),
    "practical_notice"
  );
  assert.equal(
    detectReadingFormat("Menu specials today: fresh mint tea and warm croissants."),
    "everyday_guide"
  );
});

test("selectNextReadingFormat rotates across non-script reading formats and reading angles", () => {
  clearReadingHistory("en");

  // Record a profile_description entry
  recordReadingHistory({
    targetLang: "en",
    lessonId: "lesson-test",
    title: "Neighbor Lucas",
    targetText: "Lucas is my neighbor. We wait for the bus every evening.",
    format: "profile_description",
    readingAngle: "daily_context",
  });

  const nextGeneral = selectNextReadingFormat({
    targetLang: "en",
    lessonId: "lesson-test",
    promptText: "Read about people around you",
  });
  assert.notEqual(nextGeneral.format.id, "profile_description");
  assert.ok(
    STRUCTURAL_FORMATS.some((format) => format.id === nextGeneral.format.id)
  );
  // Ensure NO chat_thread format exists in STRUCTURAL_FORMATS
  assert.ok(!STRUCTURAL_FORMATS.some((f) => f.id === "chat_thread" || f.id === "dialogue"));

  clearReadingHistory("en");
});

test("buildReadingDiversityPrompt mandates continuous non-script reading prose and bans scripts", () => {
  clearReadingHistory("en");

  recordReadingHistory({
    targetLang: "en",
    lessonId: "lesson-pre-a1-1-3",
    topic: "people around me",
    title: "At the Bus Stop",
    targetText: "Lucas is my neighbor. We wait for the bus every evening.",
    format: "profile_description",
  });

  const prompt = buildReadingDiversityPrompt({
    targetLang: "en",
    lessonId: "lesson-pre-a1-1-3",
    topicText: "people around me",
    promptText: "Read a short description of one person you know",
    cefrLevel: "Pre-A1",
  });

  assert.match(prompt, /RECENT READING TOPICS AND FORMATS/);
  assert.match(prompt, /At the Bus Stop/);
  assert.doesNotMatch(prompt, /Lucas is my neighbor/, "Do not prime the writer to copy previous sentences");
  assert.match(prompt, /STRUCTURAL FORMAT & DIVERSITY MANDATE/);
  assert.match(prompt, /CHOSEN STRUCTURAL FORMAT/);
  assert.match(prompt, /CRITICAL FORMAT RULES \(ABSOLUTELY NO SCRIPTS\)/);
  assert.match(prompt, /ABSOLUTELY NO SCRIPTS OR DIALOGUES/);
  assert.match(prompt, /SINGLE-AUTHOR PROSE/);
  assert.match(prompt, /NO META-NARRATOR OPENINGS/);
  assert.match(prompt, /NATURAL READING PROSE/);
  assert.match(prompt, /DISTINCT FROM PRECEDING PASSAGES/);
  assert.match(prompt, /TARGET LENGTH FOR Pre-A1: 100–120 words/);

  clearReadingHistory("en");
});
