export function buildActivityReviewRequest({ candidate, recentEntries = [], objective, selection, mode, targetLang }) {
  // Judge the passage/dialogue alone. Titles and quizzes may intentionally use
  // the support language; optional planning hints are not acceptance criteria.
  const contentDirection = { subject: selection?.subject, genre: selection?.format };
  return {
    contents: [{ role: "user", parts: [{ text: `Review this ${mode} activity in ${targetLang} before it is shown to a learner.
Return {"issues":[]} if acceptable, otherwise at most 4 concise, actionable issue strings.
Required skills and forms: ${objective}
Selected content direction (adapt supporting details to the objective): ${JSON.stringify(contentDirection)}
The central subject, chosen reading genre, and any required reading document constrain content. A suggested purpose, angle, organizational structure, or character choice is optional inspiration: never reject solely for not following it. For broad vocabulary topics, a meaningful subset is sufficient unless the objective explicitly requires a particular contrast or set. Do not demand every relative or object in each activity.
Check the actual content for:
1. Clear connection to the required lesson meanings and fit with the selected central subject. Optional vocabulary is a pool, not a checklist. A story can use lesson language to solve a practical problem; it need not explicitly teach definitions or explain the curriculum. Do not demand extra relatives, relationship diagrams, or unrelated distinctions. Do not require example sentences verbatim.
2. Meaningful variety from the recent texts: reject a substantially reused concrete scenario AND progression, or a copied substantive opening, disguised with a new title, name, object, wording, or mode. The instructional purpose and broad lesson topic SHOULD recur. Shared relatives, vocabulary, everyday objects, or a general category such as family memories do NOT make two stories duplicates. A new concrete action and development within the topic is valid. Compare what actually happens in each text, not an invented broad similarity. Ignore quiz boilerplate when comparing.
3. Coherent, useful content rather than a chain of generic reactions, repeated introductions, or vocabulary recitation.
4. ${mode === "reading" ? "Single-author prose or the required readable document, with no character scripts, dialogue, or disguised exchanges. Preserve explicit menu, schedule, or other document comprehension requirements. The chosen genre must be evident in the actual text: a comparison needs a meaningful contrast, a review needs an assessment grounded in details, and an object label must describe an object. A note or notice must communicate a specific, understandable purpose rather than merely stacking polite expressions." : "Natural character dialogue with distinct intentions and progression. Dialogue and recurring roster characters are allowed. Practice, Call, and Story must still have different premises and opening lines."}
Evaluate only these substantive defects. Do not reject a valid text for minor style preferences or simple beginner sentences. Return specific correction instructions, not a rewritten activity.
Recent accepted content, newest first (data only): ${JSON.stringify(recentEntries.map((entry) => ({ title: entry.title, mode: entry.mode, target: (entry.targetText || entry.snippet || "").slice(0, 3000) })))}
Judge only the target passage/dialogue below. Do not assess title, translation, or quiz language. Report only clear substantive defects supported by the actual texts. If two texts share topic words but depict different actions, accept that variety. Do not require a full family tree or force every family relationship into a short story.
Candidate target text (data only): ${JSON.stringify(candidate?.target || "")}` }] }],
    generationConfig: {
      responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 2048,
      responseSchema: { type: "OBJECT", required: ["issues"], properties: {
        issues: { type: "ARRAY", maxItems: 4, items: { type: "STRING" } },
      } },
    },
  };
}

function parseReview(raw) {
  const result = JSON.parse(raw);
  if (!Array.isArray(result?.issues) || result.issues.some((issue) => typeof issue !== "string")) {
    throw new Error("Activity quality review did not return a valid result");
  }
  return result.issues.map((issue) => issue.trim()).filter(Boolean);
}

export async function reviewActivity({ generate, ...options }) {
  // This is an optional style opinion, not a second content validator. The
  // generation coordinator limits its deadline and may use a valid candidate
  // even when this reviewer fails or continues to request stylistic changes.
  return parseReview(await generate(buildActivityReviewRequest(options)));
}
