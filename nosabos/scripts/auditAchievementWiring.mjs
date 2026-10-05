// Generate the catalog-to-trigger checklist after running the host audit suites.
import { writeFile } from "node:fs/promises";
import { SORTED_ACHIEVEMENTS } from "../src/achievements/catalog.js";
import { localizeAchievement } from "../src/achievements/copy.js";

function trigger(item) {
  const r = item.requirement;
  if (item.source === "shared") return "Both genuine full-course records → completeCollectionAwards";
  if (item.source === "robotsbuildingeducation") {
    if (r.metric === "solved_questions" || r.metric === "post_course_questions") return "App: positive question grade → correctQuestionEvents → awardRobotsProgress";
    if (r.type === "chapter_review" || r.metric === "review_videos" || r.metric === "review_checklists") return "LectureModal: 90% timeline / summary / practice → reviewCompletionEvents → awardRobotsProgress";
    return "App: completed course step → awardRobotsProgress → codingCourseEvidence";
  }
  if (r.type === "level") return "Tutor: highest fully completed level → awardTutorLevelAchievements; genuine Tutor awards recover reach";
  if (r.metric === "phonics_cards" || r.metric === "phonics_decks") return "AlphabetBootcamp: confirmed alphabetPractice listener → phonicsCompletionEvidence";
  if (r.metric === "conversation_goals") return "Conversations: positive goal verdict → conversationCompletionEvent";
  if (r.metric === "flashcards_completed") return "App: successful canonical-card review → awardPiyaliFlashcardProgress; hydration and cloud receipts recover it";
  return "Saved profile/courseProgress/questDays → usePiyaliAchievements → piyaliCompletionProof";
}
const text = `# Achievement wiring audit

Catalog: **104 active awards: 75 Piyali, 28 Robots, 1 shared**.

This is a reproducible automated integration audit, using isolated accounts and
transaction/listener fixtures. It does not complete work on real user accounts
or contact deployed Firebase, Nostr relays or grading services.

For every host award, the audit checks incomplete progress, the exact qualifying
completion, a genuine award and feedback, repeated delivery, durable local
records and account isolation. Piyali uses production proof builders, committed
listeners and real curriculum totals. Robots executes its production host adapter
against both actual curricula and review assets. The shared award checks both
genuine course records, excludes test-only completion, and restores through a
second persistence adapter. Existing recovery suites also cover offline retries,
storage failures, device unions and one-time historical catch-up.

Proficiency completion is cumulative within its category: a complete higher
level grants earlier level awards. C2 completion in all three tracks in one
language qualifies for full-course completion. Placement and partial work do
not qualify. The cumulative proficiency suite also checks existing-award
recovery, test exclusion, duplicate feedback and unchanged actual task counts.

Production save functions and listener wiring are exercised separately:

- Piyali's actual lesson/Tutor transactions: failed save, retry, fifth completion, repeat and language isolation.
- Piyali's actual achievement hook: pending/cache rejection, server acknowledgement, stale account rejection and listener disposal.
- Piyali phonics: a final save arriving after an incomplete read still triggers evaluation.
- Robots' actual review handlers: seeking to 90%, completion before a slow initial load, preservation of new checkmarks and saved checklist awards.

The audit found and fixed two timing gaps: Piyali's one-shot phonics read could
miss a later completion; Robots' initial review read could overwrite newly
completed work and fail to trigger its save. These now have regression coverage.

## Reproduce

Piyali:

\`\`\`sh
node --test src/achievements/*.test.js src/utils/achievements.test.js src/utils/piyaliAchievement*.test.js src/utils/piyaliFlashcardAchievements.test.js src/utils/progressTrackingAchievementAudit.test.js src/hooks/achievementHookWiring.test.js
node scripts/auditAchievementWiring.mjs
\`\`\`

Robots, from its repository:

\`\`\`sh
node --test src/achievements/*.test.js src/utility/achievements.test.js src/utility/chapterAchievements.test.js src/utility/reviewCompletion.test.js src/utility/robotsAchievementAudit.test.js src/utility/reviewLoadAudit.test.js
\`\`\`

Primary per-award tests: Piyali \`src/utils/piyaliAchievementAudit.test.js\`;
Robots \`src/utility/robotsAchievementAudit.test.js\`;
shared \`src/achievements/capstoneAudit.test.js\` (both hosts).

## Checklist

“Covered” means the automated boundary/integration case exists and must pass;
this generated checklist is not itself a test runner or a live service check.

| App | Achievement / permanent ID | Requirement | Production trigger | Coverage |
| --- | --- | --- | --- | --- |
${SORTED_ACHIEVEMENTS.map(item => {
  const localized = localizeAchievement(item, "en");
  const host = item.source === "nosabos" ? "Piyali" : item.source === "shared" ? "Shared" : "Robots";
  return `| ${host} | ${localized.title}<br>\`${item.id}\` | ${localized.desc} | ${trigger(item)} | Covered |`;
}).join("\n")}
`;
if (SORTED_ACHIEVEMENTS.length !== 104) throw new Error("Update the audit coverage when the active catalog changes");
await writeFile(new URL("../src/achievements/WIRING_AUDIT.md", import.meta.url), text);
console.log("Generated the 104-achievement trigger and boundary checklist.");
