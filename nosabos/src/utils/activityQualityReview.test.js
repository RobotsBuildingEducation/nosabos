import test from "node:test";
import assert from "node:assert/strict";
import { reviewActivity, buildActivityReviewRequest } from "./activityQualityReview.js";
import { generateReadingWithQuality } from "./readingGeneration.js";

test("semantic review compares actual content and distinguishes required forms from repeated premises", async () => {
  const request = buildActivityReviewRequest({ mode: "reading", targetLang: "ja", candidate: { title: "New title", target: "同じ隣人の話" },
    recentEntries: [{ title: "Old title", targetText: "隣人を紹介します" }], objective: "Identify familiar people", selection: { subject: "teacher" } });
  const prompt = request.contents[0].parts[0].text;
  assert.match(prompt, /同じ隣人の話/);
  assert.match(prompt, /隣人を紹介します/);
  assert.match(prompt, /instructional purpose and broad lesson topic SHOULD recur/);
  assert.match(prompt, /no character scripts/);
  await assert.rejects(reviewActivity({ generate: async () => '{"accepted":true}' }), /valid result/);
});

test("Reading retries a fluent but semantically repeated subject before returning content", async () => {
  let attempts = 0;
  const output = await generateReadingWithQuality({ prompt: "People", generate: async () => ({ title: "Person", target: ++attempts === 1 ? "Marco lives next door. He has a red coat." : "Lina is our teacher. She helps us read." }),
    review: async (candidate) => candidate.target.includes("Marco") ? ["You repeated the neighbor subject. Use the selected teacher."] : [],
  });
  assert.equal(attempts, 2);
  assert.match(output.target, /teacher/);
});

test("semantic review returns one advisory opinion without a second blocking reviewer", async () => {
  const requests = [];
  const issues = await reviewActivity({ mode: "conversation", objective: "Family", candidate: { title: "La bufanda", target: "My aunt left her scarf. We can return it to her." },
    recentEntries: [{ targetText: "My aunt is in this old family photo." }],
    generate: async (request) => { requests.push(request); return requests.length === 1 ? '{"issues":["Same photo scene"]}' : '{"issues":[]}'; },
  });
  assert.deepEqual(issues, ["Same photo scene"]);
  assert.equal(requests.length, 1);
  assert.match(requests[0].contents[0].parts[0].text, /left her scarf/);
});
