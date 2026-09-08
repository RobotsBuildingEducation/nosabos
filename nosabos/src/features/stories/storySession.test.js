import test from "node:test";
import assert from "node:assert/strict";
import { chooseStoryMode, rotateStoryMode, parseStorySession, isStoryAnswerCorrect, buildStoryWordTiles, prepareGeneratedStorySession, buildStorySessionPrompt } from "./storySession.js";

const fixture = () => ({ title: "A surprise", segments: [
  { turns: [{ speaker: "Ana", target: "Tengo flores rojas.", support: "I have red flowers." }, { speaker: "Luis", target: "Son para mi madre.", support: "They are for my mother." }], question: { type: "select_words", prompt: "Select two words you hear.", options: ["azules", "flores", "rojas", "nunca"], answer: [1, 2], audioTurn: 0, explanation: "Ana has red flowers." } },
  { turns: [{ speaker: "Ana", target: "¿Es su cumpleaños?", support: "Is it her birthday?" }, { speaker: "Luis", target: "Sí, es hoy.", support: "Yes, it is today." }], question: { type: "order_words", prompt: "Build what you hear.", options: ["hoy", "Sí", "es"], answer: [1, 2, 0], audioTurn: 1, explanation: "Her birthday is today." } },
] });

test("tutorial retains speaking; explicit modes and automatic selection work", () => {
  assert.equal(chooseStoryMode({ topic: "tutorial", storyMode: "radio" }), "speaking");
  assert.equal(chooseStoryMode({ storyMode: "radio" }), "radio");
  assert.deepEqual([0, 0.4, 0.9].map((value) => chooseStoryMode(null, () => value)), ["speaking", "radio", "conversation"]);
});
test("rotateStoryMode alternates away from current mode while respecting pins", () => {
  assert.equal(rotateStoryMode("speaking", { topic: "tutorial" }), "speaking");
  assert.equal(rotateStoryMode("radio", { storyMode: "radio" }), "radio");
  assert.equal(rotateStoryMode("speaking", null, () => 0), "radio");
  assert.equal(rotateStoryMode("speaking", null, () => 0.9), "conversation");
  assert.notEqual(rotateStoryMode("radio", null, () => 0), "radio");
});
test("complete episodes accept fenced JSON and preserve target-language accents", () => {
  const episode = fixture();
  assert.deepEqual(parseStorySession('```json\n' + JSON.stringify(episode) + '\n```'), episode);
});
test("selection is unordered, tile assembly is ordered, duplicate guesses fail", () => {
  const [a, b] = fixture().segments.map((segment) => segment.question);
  assert.equal(isStoryAnswerCorrect(a, [2, 1]), true);
  assert.equal(isStoryAnswerCorrect(a, [1, 1]), false);
  assert.equal(isStoryAnswerCorrect(a, [1]), false);
  assert.equal(isStoryAnswerCorrect(b, [1, 2, 0]), true);
  assert.equal(isStoryAnswerCorrect(b, [0, 1, 2]), false);
});
test("rejects unusable checkpoints before learners start", () => {
  for (const mutate of [
    (s) => { s.segments[0].question.answer = [8]; },
    (s) => { s.segments[0].question.answer = [1, 1]; },
    (s) => { s.segments[0].question.audioTurn = 8; },
    (s) => { s.segments[0].question.options[0] = "Tengo"; },
    (s) => { s.segments[1].question.answer = [0, 1, 2]; },
    (s) => { s.segments[1].turns[0].speaker = "Someone else"; },
    (s) => { s.segments[1].question.type = "unknown"; },
  ]) { const episode = fixture(); mutate(episode); assert.throws(() => parseStorySession(episode)); }
});

test("listening checkpoints support Japanese and Chinese text without spaces", () => {
  const episode = fixture();
  episode.segments[0].turns[0].target = "赤い花があります。";
  episode.segments[0].question.options = ["青い", "赤い", "花", "明日"];
  episode.segments[1].turns[1].target = "今天是她的生日。";
  episode.segments[1].question.options = ["她的生日", "今天", "是"];
  assert.deepEqual(parseStorySession(episode), episode);
});

test("generated tile checkpoints use the full spoken sentence, not the model's incomplete answer", () => {
  const episode = fixture();
  episode.segments[1].turns[1].target = "La fiesta empieza a las ocho de la noche.";
  // Captured from the live radio response: missing 'La'/'ocho' and an invented tile.
  episode.segments[1].question.options = ["las", "a", "empieza", "la", "noche", "fiesta", "de", "a.m.chochte"];
  episode.segments[1].question.answer = [5, 2, 1, 0, 6, 4];
  assert.throws(() => parseStorySession(episode), /Word order does not match audio/);
  const prepared = prepareGeneratedStorySession(episode);
  const question = prepared.segments[1].question;
  assert.equal(question.answer.map((index) => question.options[index]).join(" "), "La fiesta empieza a las ocho de la noche");
  assert.equal(question.options.includes("a.m.chochte"), false);
  assert.equal(episode.segments[1].question.options.includes("a.m.chochte"), true, "Input stays immutable");
});

test("tile construction retains repeated words without ambiguous duplicate buttons", () => {
  for (const sentence of ["Sí, es hoy.", "Muy, muy, muy bien.", "La casa es bonita y la casa es grande.", "今日は母の誕生日です。", "今天是她的生日。", "هذا البيت جميل جدا"]) {
    const question = buildStoryWordTiles(sentence, () => 0.5);
    assert.ok(question.options.length >= 2 && question.options.length <= 6);
    assert.equal(new Set(question.options.map((text) => text.toLowerCase())).size, question.options.length);
    const normalize = (text) => text.replace(/[^\p{L}\p{N}\p{M}]/gu, "").toLowerCase();
    assert.equal(normalize(question.answer.map((index) => question.options[index]).join(" ")), normalize(sentence));
  }
});

test("supports reply question checkpoints where the user replies to the other speaker", () => {
  const episode = {
    title: "On the air with Sheilfer",
    segments: [
      {
        turns: [
          { speaker: "Sheilfer", target: "¡Hola! ¿Cómo estás hoy?", support: "Hello! How are you today?" },
          { speaker: "You", target: "Estoy muy bien, gracias.", support: "I am doing well, thank you." },
        ],
        question: {
          type: "reply",
          prompt: "How do you reply to Sheilfer?",
          options: ["Estoy muy bien, gracias.", "No me gusta la música.", "El cielo es azul."],
          answer: [0],
          explanation: "Greeting back politely is the appropriate response.",
          audioTurn: 0,
        },
      },
      {
        turns: [
          { speaker: "Sheilfer", target: "¿Qué te gustaría escuchar?", support: "What would you like to listen to?" },
          { speaker: "You", target: "Quiero escuchar rock.", support: "I want to listen to rock." },
        ],
        question: {
          type: "choice",
          prompt: "What does the caller want to hear?",
          options: ["Rock music", "Classical music"],
          answer: [0],
          explanation: "The caller requested rock.",
          audioTurn: 1,
        },
      },
    ],
  };

  const parsed = parseStorySession(episode);
  assert.equal(parsed.segments[0].question.type, "reply");
  assert.equal(isStoryAnswerCorrect(parsed.segments[0].question, [0]), true);
  assert.equal(isStoryAnswerCorrect(parsed.segments[0].question, [1]), false);
});

test("buildStorySessionPrompt includes the RPG character roster and reply instructions", () => {
  const prompt = buildStorySessionPrompt({
    mode: "radio",
    targetName: "Spanish",
    supportName: "English",
    difficulty: "A1",
    context: "daily routine",
    userCharacterName: "You",
  });

  assert.ok(prompt.includes("Sheilfer"));
  assert.ok(prompt.includes("Jiraiya"));
  assert.ok(prompt.includes("Yoruichi"));
  assert.ok(prompt.includes("Neko"));
  assert.ok(prompt.includes("Yachiru"));
  assert.ok(prompt.includes('"You"'));
  assert.ok(prompt.includes("reply"));
});

test("test answer logic reliably generates matching correct and wrong selections", () => {
  const choiceQuestion = {
    type: "choice",
    options: ["Option A", "Option B", "Option C"],
    answer: [1],
  };
  const orderQuestion = {
    type: "order_words",
    options: ["second", "first", "third"],
    answer: [1, 0, 2],
  };

  // Correct selection test
  assert.equal(isStoryAnswerCorrect(choiceQuestion, choiceQuestion.answer), true);
  assert.equal(isStoryAnswerCorrect(orderQuestion, orderQuestion.answer), true);

  // Wrong selection simulation test (picking an option not in answer)
  const choiceWrong = choiceQuestion.options.map((_, i) => i).filter((i) => !choiceQuestion.answer.includes(i));
  assert.equal(isStoryAnswerCorrect(choiceQuestion, [choiceWrong[0]]), false);

  const orderWrong = [orderQuestion.answer[0]]; // incomplete
  assert.equal(isStoryAnswerCorrect(orderQuestion, orderWrong), false);
});


