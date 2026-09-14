import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStorySessionStreamPrompt,
  applyStoryStreamLine,
} from "./storySession.js";

test("buildStorySessionStreamPrompt includes official cast members and NDJSON protocol", () => {
  const prompt = buildStorySessionStreamPrompt({
    mode: "conversation",
    targetName: "Spanish",
    supportName: "English",
    targetLang: "es",
    supportLang: "en",
    difficulty: "A2",
    context: "ordering food at a bakery",
    userCharacterName: "You",
  });

  assert.ok(prompt.includes("Sheilfer"));
  assert.ok(prompt.includes("Jiraiya"));
  assert.ok(prompt.includes("Yoruichi"));
  assert.ok(prompt.includes("Neko"));
  assert.ok(prompt.includes("Yachiru"));
  assert.ok(prompt.includes("You"));
  assert.ok(prompt.includes("NDJSON"));
  assert.ok(prompt.includes('"type":"turn"'));
  assert.ok(prompt.includes('"type":"question"'));
  assert.ok(prompt.includes('"type":"done"'));
});

test("applyStoryStreamLine sets title and incrementally creates segments and turns", () => {
  const draft = { title: "", segments: [] };

  // 1. Title arrives
  const titleApplied = applyStoryStreamLine(draft, {
    type: "title",
    title: "A Trip to the Market",
  });
  assert.equal(titleApplied, true);
  assert.equal(draft.title, "A Trip to the Market");
  assert.equal(draft.segments.length, 0);

  // 2. First turn of segment 0 arrives
  const turn1Applied = applyStoryStreamLine(draft, {
    type: "turn",
    segment: 0,
    speaker: "Sheilfer",
    target: "¡Buenos días, amigo!",
    support: "Good morning, friend!",
  });
  assert.equal(turn1Applied, true);
  assert.equal(draft.segments.length, 1);
  assert.equal(draft.segments[0].turns.length, 1);
  assert.equal(draft.segments[0].turns[0].speaker, "Sheilfer");
  assert.equal(draft.segments[0].turns[0].target, "¡Buenos días, amigo!");
  assert.equal(draft.segments[0].question, null);

  // 3. Second turn of segment 0 arrives
  const turn2Applied = applyStoryStreamLine(draft, {
    type: "turn",
    segment: 0,
    speaker: "Yoruichi",
    target: "¡Buenos días! ¿Qué vamos a comprar?",
    support: "Good morning! What are we going to buy?",
  });
  assert.equal(turn2Applied, true);
  assert.equal(draft.segments[0].turns.length, 2);
  assert.equal(draft.segments[0].turns[1].speaker, "Yoruichi");

  // 4. Question for segment 0 arrives
  const qApplied = applyStoryStreamLine(draft, {
    type: "question",
    segment: 0,
    question: {
      type: "choice",
      prompt: "Who greeted first?",
      options: ["Sheilfer", "Yoruichi"],
      answer: [0],
      explanation: "Sheilfer said good morning first.",
      audioTurn: 0,
    },
  });
  assert.equal(qApplied, true);
  assert.equal(draft.segments[0].question.type, "choice");
  assert.equal(draft.segments[0].question.prompt, "Who greeted first?");
  assert.deepEqual(draft.segments[0].question.answer, [0]);
});

test("applyStoryStreamLine automatically generates word tiles for order_words questions", () => {
  const draft = {
    title: "Cafe",
    segments: [
      {
        turns: [
          { speaker: "Sheilfer", target: "Un café por favor.", support: "A coffee please." },
          { speaker: "Neko", target: "Aquí tienes el café con leche.", support: "Here is the coffee with milk." },
        ],
        question: null,
      },
    ],
  };

  const qApplied = applyStoryStreamLine(draft, {
    type: "question",
    segment: 0,
    question: {
      type: "order_words",
      prompt: "Build what you hear.",
      options: [],
      answer: [],
      audioTurn: 1,
      explanation: "Neko serves coffee with milk.",
    },
  });

  assert.equal(qApplied, true);
  assert.equal(draft.segments[0].question.type, "order_words");
  // Options and answer must have been auto-populated from turn 1 target
  assert.ok(draft.segments[0].question.options.length >= 2);
  assert.ok(draft.segments[0].question.answer.length >= 2);
});

test("practice streaming NDJSON produces immediate reveal on first line", () => {
  const lines = [
    JSON.stringify({ type: "sentence", character: "Sheilfer", tgt: "¡Hola! ¿Cómo estás?", gender: "male" }),
    JSON.stringify({ type: "sentence", character: "Yoruichi", tgt: "¡Muy bien, gracias!", gender: "female" }),
    JSON.stringify({ type: "done" }),
  ];

  let revealed = false;
  let storyData = null;
  const collected = [];

  for (const line of lines) {
    const obj = JSON.parse(line);
    if (obj.type === "sentence") {
      const item = { tgt: obj.tgt, character: obj.character, gender: obj.gender };
      collected.push(item);
      if (!revealed) {
        revealed = true;
        storyData = {
          fullStory: { tgt: item.tgt, sup: "" },
          sentences: [item],
          storyType: "conversation",
        };
      } else {
        storyData = {
          fullStory: { tgt: collected.map((s) => s.tgt).join("\n"), sup: "" },
          sentences: [...storyData.sentences, item],
          storyType: "conversation",
        };
      }
    }
  }

  assert.equal(revealed, true);
  assert.equal(storyData.sentences.length, 2);
  assert.equal(storyData.sentences[0].character, "Sheilfer");
  assert.equal(storyData.sentences[0].tgt, "¡Hola! ¿Cómo estás?");
  assert.equal(storyData.sentences[1].character, "Yoruichi");
});
