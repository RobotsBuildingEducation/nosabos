import test from "node:test";
import assert from "node:assert/strict";
test("quoted and unquoted reported exchanges cannot masquerade as a reading passage", () => {
  for (const target of [
    'I find a blue umbrella. Thank you, says the clerk. You are welcome, I reply with a smile.',
    'Maria says, "Excuse me." Tom replies, "Thank you." They leave.',
    'I find a phone on the cafe table. He says, "Thank you very much." I say, "You are welcome."',
    'Please wait, I say to the man. Thank you so much, he tells me. No problem at all, I answer.',
  ]) {
    assert.ok(getReadingQualityIssues({ title: "Diary", target }).some((issue) => issue.startsWith("reported_dialogue:")));
  }
});
test("required document sections are not mistaken for speakers", () => {
  const issues = getReadingQualityIssues({ title: "Cafe menu", target: "Hot drinks: Coffee costs two dollars.\nCold drinks: Juice costs three dollars.\nSnacks: Bread costs one dollar." },
    { formatSelection: { format: { id: "document:Cafe menu" } } });
  assert.deepEqual(issues, []);
  assert.ok(getReadingQualityIssues({ title: "Menu", target: "A: I want coffee.\nB: It costs two dollars." },
    { formatSelection: { format: { id: "document:Cafe menu" } } }).some((issue) => issue.startsWith("script:")));
});
test("reported-speech objectives can still use indirect reports in prose", () => {
  const target = "The organizer said that the bridge would open on Friday. The engineer replied that one inspection remained. The opening date is therefore uncertain.";
  assert.deepEqual(getReadingQualityIssues({ title: "Bridge update", target }), []);
});
import { collectReadingStream, generateReadingWithQuality, getReadingQualityIssues, ReadingQualityError } from "./readingGeneration.js";

const screenshotReadings = [
  "The community market opens early this Saturday morning. Oh, how wonderful! Look at the fresh fruit and sweet cakes!",
  "Oh, what a busy morning in the kitchen! Look at the fresh coffee and warm toast. Really? How nice to start the day well!",
  "Oh, what a lovely welcome gift! Look at the fresh bread and fruit! Really? How nice of you!",
  "Oh, look at the finished painting on the desk! Really? How wonderful for the community art class! Oh, what a lovely surprise to see it today!",
  "I find a small box in the back of my desk. Oh, wow, it is my very old toy car! Yay, I love this bright red color so much! Ah, what a wonderful surprise to see it today.",
  "My desk is now near the large window in the room. The bright morning sun shines right on my books. Oh, wow, the warm light makes reading so nice! Yay, I love this new spot so much!",
];
const valid = { title: "The green notebook", target: "My green notebook has no lines. I draw plants on the left page and write their names on the right. Today I found a tiny flower near our door.", takeaways: ["An observation journal."] };

test("rejects the reported passages and live-model reaction chains with neutral punctuation", () => {
  for (const [index, target] of screenshotReadings.entries()) {
    const issues = getReadingQualityIssues({ title: "Reading", target }, {
      formatSelection: { format: { id: index === 0 ? "practical_notice" : "personal_note" } }, targetLang: "en",
    });
    assert.ok(issues.some((issue) => issue.startsWith("reaction_chain:")), target);
  }
});

test("detects noun substitutions in a repeated sentence skeleton even without exclamations", () => {
  const previous = "Outside the kitchen, a bicycle waits. Under the stairs, there are boots. Behind the door, a green coat hangs.";
  const candidate = { title: "A different title", target: "Outside the station, a taxi waits. Under the bridge, there are boats. Behind the fence, a yellow kite hangs." };
  assert.ok(getReadingQualityIssues(candidate, { targetLang: "en", recentEntries: [{ title: "Earlier", targetText: previous }] })
    .some((issue) => issue.startsWith("repeated_passage:")));
});

test("rejects the same context-reaction-context-praise pattern across different genres", () => {
  const recentEntries = [{ title: "My Old Book", targetText: "I found a small blue book on the floor. Oh! My old name is on the page. I forgot this old diary. Wow, I love these old pictures!" }];
  for (const target of [
    "The city changed the empty dirt lot into a green park with tall trees. Oh! The grass is so bright and soft. People walk dogs and children play on the new benches every afternoon. Wow, what a wonderful place to relax!",
    "I looked at the heavy grey bicycle and the shiny red bicycle in the shop window. Oh! The red bicycle has a small basket for my books. The grey bicycle is cheaper, but I want the bright red one. Wow, riding it home will be so much fun!",
  ]) {
    assert.ok(getReadingQualityIssues({ title: "New genre", target }, { targetLang: "en", recentEntries })
      .some((issue) => issue.startsWith("repeated_reaction_structure:")));
  }
});

test("allows necessary target forms in new contexts and contextual emotional language", () => {
  assert.deepEqual(getReadingQualityIssues(valid, { targetLang: "en" }), []);
  assert.deepEqual(getReadingQualityIssues({ title: "Our shelf", target: "There is a red book near the lamp. There is a pencil in the box. There is a map above the shelf." }, {
    targetLang: "en", recentEntries: [{ title: "Our garden", targetText: "There is a tall tree by the gate. There is a pond behind the house. There is a cat asleep on the path." }],
  }), []);
  assert.deepEqual(getReadingQualityIssues({ title: "A new place", target: "My drawing is on the library wall today. How exciting! I used only a blue pencil for the sea. My sister wants to visit after school." }, { targetLang: "en" }), []);
});

test("checks full passages and legacy snippets, even under new titles", () => {
  for (const field of ["targetText", "snippet"]) {
    assert.ok(getReadingQualityIssues({ ...valid, title: "New title" }, { recentEntries: [{ title: valid.title, [field]: valid.target }] })
      .some((issue) => issue.startsWith("repeated_passage:")));
  }
  assert.ok(getReadingQualityIssues({ title: "重复", target: "今天下雨了。我把雨伞放在门边。" }, {
    targetLang: "zh", recentEntries: [{ title: "昨天", targetText: "今天下雨了。我把雨伞放在门边。" }],
  }).length);
});

test("rejects speaker scripts before sanitization, preserving factual notice labels", () => {
  for (const target of ["A: Where is it?\nB: On the desk.", "Lucía: Está aquí.\nAndrés: Muchas gracias.", "田中: おはよう。\n佐藤: こんにちは。", "— Hello there.\n— Good morning."]) {
    assert.ok(getReadingQualityIssues({ title: "Script", target }).some((issue) => issue.startsWith("script:")));
  }
  assert.deepEqual(getReadingQualityIssues({ title: "Hours", target: "Hours: Monday to Friday, 9 to 5.\nLocation: Near the station." }), []);
});

test("quality retry rewrites the entire candidate and returns its new supporting material", async () => {
  const inputs = [];
  const result = await generateReadingWithQuality({ prompt: "Lesson objective: identify colors. Return JSON.", targetLang: "en",
    generate: async (input) => { inputs.push(input); return inputs.length === 1 ? { title: "First", target: screenshotReadings[1] } : { ...valid, reviewQuestion: { question: "Which color is the notebook?" } }; },
  });
  assert.equal(inputs.length, 2);
  assert.match(inputs[1], /Lesson objective: identify colors/);
  assert.match(inputs[1], /FRESH VERSION/);
  assert.doesNotMatch(inputs[1], /Oh, what a busy morning/);
  assert.match(inputs[1], /Start from a blank page/);
  assert.equal(result.reviewQuestion.question, "Which color is the notebook?");
  assert.equal(result.target, valid.target);
});

test("missing reading content still fails after bounded validation retries", async () => {
  let calls = 0;
  await assert.rejects(generateReadingWithQuality({ prompt: "Reading", generate: async () => { calls++; return null; } }), ReadingQualityError);
  assert.equal(calls, 3);
});

test("the reported style complaint cannot exhaust Reading generation", async () => {
  let calls = 0;
  const complaint = "The text reuses the exact same concrete pattern and exclamation formula ('Oh, look at...!' 'How surprising...') found in several recent texts such as 'Leaving the Art Studio' and 'My Bus Schedule Update'.";
  const result = await generateReadingWithQuality({ prompt: "A0 reactions", targetLang: "en",
    generate: async (prompt) => { calls++; assert.ok(!prompt.includes(complaint)); return valid; },
    review: async () => [complaint],
  });
  assert.deepEqual(result, valid);
  assert.equal(calls, 2);
});

test("a failed optional rewrite retains the full validated reading and its question", async () => {
  const original = { ...valid, reviewQuestion: { question: "What does the writer draw?", options: ["Plants", "Cars"], answer: 0 } };
  for (const rewrite of [null, { title: "Script", target: "A: Hello.\nB: Hi." }]) {
    let calls = 0;
    const result = await generateReadingWithQuality({ prompt: "Reading",
      generate: async () => ++calls === 1 ? original : rewrite, review: async () => ["Try a different style"],
    });
    assert.deepEqual(result, original);
    assert.equal(calls, 2);
  }
});

test("Reading still refuses scripts and entire previously shown passages", async () => {
  for (const candidate of [{ title: "Script", target: "A: Hello.\nB: Hi." }, valid]) {
    let calls = 0;
    await assert.rejects(generateReadingWithQuality({ prompt: "Reading", recentEntries: [{ targetText: valid.target }],
      generate: async () => { calls++; return candidate; }, review: async () => [],
    }), ReadingQualityError);
    assert.equal(calls, 3);
  }
});

test("fixed tutorial is exempt from variety checks but still needs real content", async () => {
  const target = "Hello. Good morning. My name is Ana. Welcome.";
  assert.deepEqual(getReadingQualityIssues({ title: "Welcome", target }, { isTutorial: true, recentEntries: [{ targetText: target }] }), []);
  assert.ok(getReadingQualityIssues({ title: "Welcome", target: "" }, { isTutorial: true }).length);
});

test("stream parser handles chunk splits, review questions, and a final line without newline", async () => {
  async function* stream() {
    yield '```json\n{"type":"title","text":"Notebook"}\n{"type":"tar';
    yield 'get","text":"A: It is green."}\n{"type":"target","text":"B: I can see it."}\n';
    yield '{"type":"review_question","question":"What color?"}\n{"type":"takeaway","text":"A notebook."}';
  }
  const result = await collectReadingStream(stream(), (chunk) => chunk);
  assert.equal(result.title, "Notebook");
  assert.equal(result.reviewQuestion.question, "What color?");
  assert.equal(result.takeaways[0], "A notebook.");
  assert.ok(getReadingQualityIssues(result).some((issue) => issue.startsWith("script:")));
});
