# Astra Goals and Repair Intelligence Plan

## Purpose

Combine Astra upgrades #1 and #2 into one focused system:

- A learner can state a real-world language goal once and receive a goal-focused task in every Daily Quest.
- Piyali keeps a compact, durable picture of learning patterns so future repairs and goal tasks become more perceptive over time.
- Repair and goal tasks reuse the app's real practice surfaces while remaining separate from the normal curriculum and from Custom Conversation settings.

This document records the product decisions already agreed. It is an implementation plan, not a proposal to merge goals into Custom Conversations.

## Settled product decisions

### 1. The learning goal is its own setting

- Add an optional free-text goal field during onboarding, with examples such as “Talk with my grandmother about her childhood” or “Participate in meetings at work.”
- Save the goal in the user's settings and make it editable, replaceable, pausable, and clearable later.
- Scope goals by practice language. A Spanish goal must not silently become the goal for another target language.
- Do not copy the goal into Tutor persona, `helpRequest`, or Custom Conversation settings.
- Do not change a user's saved Custom Conversation topic, characters, scenario, or other conversation preferences when the goal changes.
- If no active goal is set for the current practice language, no goal task is added.

### 2. An active goal guarantees a daily Goal task

- If the learner has an active goal, every Daily Quest for that language includes exactly one `goal` course.
- The Goal task is derived and inserted every day, like Repair; it is not left to the normal quest elector and cannot be randomly omitted.
- It does not replace or rewrite the selected goal. It generates a fresh daily practice step toward that persistent goal.
- Initial course order should be: Repair when available, Goal when active, then the normally elected or carried-over courses.
- Goal completion has its own daily activity field and completion target so it cannot accidentally advance Repair, Tutor-path, lesson-path, or Custom Conversation progress.
- A missed Goal task may carry over using the existing unfinished-task behavior, but the new day must still resolve to one Goal course rather than creating duplicates.

### 3. Goal tasks can choose from five top-level modes

The daily goal planner may select:

- `tutor`
- `phonics`
- `flashcards`
- `lesson`

Conversation mode is excluded from both Goal and Repair tasks. Free-form conversation is too hard and unreliable for targeted goal verification given its original open-ended design; Conversation remains a standalone practice mode for regular daily quests.

The planner should select the mode that best advances the next capability needed for the goal. It should use variety across days when useful, but should not rotate modes merely for novelty.

`lesson` can use all five existing lesson modules at every CEFR level:

- Vocabulary
- Grammar
- Reading
- Stories
- Realtime

There is no Pre-A1/A1 restriction on module availability. CEFR can still guide wording, scaffolding, hints, and pacing.

### 4. The goal may stretch beyond the learner's CEFR level

- The goal, not the curriculum level, is the authoritative destination.
- CEFR is a scaffolding signal rather than a hard content ceiling for Goal tasks.
- Goal practice may introduce language above the learner's nominal level when it is genuinely needed for the real-world task.
- Difficulty should create productive discomfort, not an impossible exercise: simplify the surrounding language, model the target, provide supports, and judge success against the specific real-world action.
- Repair tasks remain level-aware because they diagnose learning inside the course. Goal tasks may stretch; the two policies must not be conflated.

## Durable rolling intelligence

### Two summaries, two purposes

Keep the existing two-day raw companion-memory window. Add two separate durable summaries:

1. **Repair learning summary:** per practice language; used only to inform future Repair generation.
2. **Goal progress summary:** per active goal; used only to choose and generate the next Goal task.

Neither summary should modify Custom Conversation settings. The existing short Memory-drawer digest can remain learner-facing and temporary; it is not a substitute for these durable machine-oriented summaries.

### Length budget

- Aim for approximately 100 words when the evidence is simple.
- Allow 100–150 words for a normal mature summary.
- Hard cap at 200 words.
- Store categorized data as the source of truth and optionally derive prose for prompts. Do not maintain an unbounded narrative diary.

### Repair summary contents

Catalog and organize:

- Up to three recurring unresolved patterns, including concrete target-language examples when useful.
- Recently repaired concepts that should either be left alone or checked for retention/transfer.
- Current demonstrated stage: recognition, production with help, independent production, or later transfer.
- Where the issue appears: recall, grammar, speech, pronunciation, listening, reading, writing, or conversation flow.
- Useful evidence such as recurrence, recency, severity, and whether the learner succeeded after a hint.
- Repair approaches that helped, failed, or were overused.
- A compact next-repair recommendation: target, suitable mode, support level, and what not to repeat.

Do not include generic encouragement, every historical answer, unrelated personal information, or Custom Conversation preferences.

### Goal summary contents

Catalog and organize:

- The exact user-authored goal and target language.
- The real-world capabilities already demonstrated.
- Missing capabilities that still block the goal.
- Important language, situations, or pronunciation targets encountered while training.
- Degree of support required: modeled, prompted, lightly supported, independent, and transferred to a new situation.
- Recent modes used and what each revealed.
- The best next step toward the goal, including a fresh scenario or transfer check when appropriate.

### Update rules

- Update the relevant summary only after meaningful evidence: a captured high-signal mistake, a completed repair, a completed goal task, or a focused post-conversation check.
- Merge new evidence into categories rather than appending prose forever.
- Downgrade stale assumptions and remove resolved details that no longer affect future generation.
- Do not mark something mastered from exposure or completion alone. Require observable success and distinguish prompted from independent performance.
- Retain the recent raw evidence window for precision; use the durable summary for continuity across weeks and months.

### Suggested storage shape

```js
learningIntelligence: {
  [targetLang]: {
    repairSummary: {
      openPatterns: [],
      recentlyRepaired: [],
      effectiveSupports: [],
      nextRepairGuidance: {},
      prose: "",
      wordCount: 0,
      updatedAt: ""
    },
    activeGoal: {
      id: "",
      text: "",
      status: "active",
      createdAt: "",
      updatedAt: ""
    },
    goalProgress: {
      demonstrated: [],
      openCapabilities: [],
      usefulLanguage: [],
      modeEvidence: [],
      nextGoalGuidance: {},
      prose: "",
      wordCount: 0,
      updatedAt: ""
    }
  }
}
```

The final schema can use subcollection documents if user-document size or concurrent writes make that safer. The important constraints are per-language isolation, bounded arrays, versioning, and no coupling to conversation settings.

## Custom repair generation by mode

### Tutor

- Continue creating an ephemeral Tutor repair session around the saved weak phrase or concept.
- Use fresh elicitation, a modeled example, and a tiny realistic exchange.
- Record whether success was modeled, prompted, or independent so the rolling summary learns more than “completed.”

### Flashcards

- Continue generating a small repair deck containing the original weak item and tightly related variations.
- Preserve a deterministic fallback containing the original item if generation fails.
- Feed recall results back into repair evidence without treating recognition as independent production.

### Lesson

- Seed every lesson module with the same repair topic, exact target forms, and repair guidance.
- Make Vocabulary, Grammar, Reading, Stories, and Realtime available at every level.
- Keep level guards inside generation to control complexity without hiding modes.
- Ensure each module creates fresh material rather than replaying the original failed question.

### Phonics

Replace the current “move the old card to the front” behavior with a generated repair mini-deck.

The phonics repair set should normally contain three to five tightly focused items:

1. The original word, sound, letter, or captured example.
2. A valid minimal pair or close contrast when the language supports one.
3. A new transfer word containing the same sound in a different position or context.
4. Optionally, one short phrase that uses the sound naturally.

Requirements:

- Preserve the captured phonics card as the deterministic fallback.
- Generate for the actual target language and writing system; never invent an English-style minimal pair for a language where it is invalid.
- Include pronunciation targets or phoneme/letter metadata when available, not only display strings.
- Reuse the real Alphabet/Phonics interaction, TTS, speech capture, and grading.
- Cache the generated deck by user, language, day, and repair-step ID so reloads resume the same task.
- Completion requires a successful attempt on the target sound, not merely opening or hearing the deck.
- Record which item succeeded and whether the transfer word also succeeded.

## Goal-task generation and execution

### Daily goal blueprint

Generate one bounded goal blueprint per active goal, target language, and local day. It should contain:

```js
{
  goalId: "",
  dayKey: "",
  mode: "tutor|phonics|flashcards|lesson|conversation",
  objective: "one concrete action for today",
  scenario: "",
  targetLanguage: [],
  supports: [],
  successCriteria: [],
  rationale: "",
  target: 1
}
```

Inputs should include the exact goal text, durable goal summary, recent goal-task evidence, and relevant recent repair evidence. Repair history can inform scaffolding, but it must not cause the Goal task to become another mistake-repair task.

### Mode behavior

- **Tutor:** a short ephemeral coaching session for one missing goal capability.
- **Phonics:** custom sound practice only when pronunciation materially blocks the goal.
- **Flashcards:** goal-specific words or chunks needed for later performance.
- **Lesson:** mixed, generated preparation across the five lesson modules.

### Success and progression

- Define success as evidence tied to the day's objective, not generic XP or time spent.
- Record how much help was needed and whether the learner handled a fresh variation.
- Rotate from preparation toward performance: learn useful language, rehearse with support, perform, then transfer to a less predictable scenario.
- Avoid repeatedly regenerating the same comfortable exercise after it has been demonstrated.
- A completed goal remains editable and can be marked achieved. The learner may keep it active for maintenance, replace it, pause it, or start a new goal.

## Daily Quest integration

Add `goal` alongside Repair as a derived Daily Quest kind:

- Add `goal` to canonical ordering, display copy, activity fields, reset tooling, persistence, completion celebrations, and analytics.
- Inject it whenever `activeGoal.status === "active"` for the current practice language.
- Keep its daily blueprint stable across refreshes and devices.
- Resolve duplicate carry-over Goal entries into today's single Goal course.
- Route it through a goal-focus store parallel to repair focus; do not overload repair state with goal state.
- Tag XP and completion sources distinctly so goal practice cannot accidentally advance another path.
- If generation fails, fall back to a deterministic task using the exact goal text and an appropriate existing surface. The daily goal guarantee must survive model failure.

## Implementation sequence

### Phase 1: contracts and storage

- Define bounded, versioned schemas for active goals, goal progress, repair summaries, goal blueprints, and evidence events.
- Add per-language reads, writes, hydration, merge behavior, and pruning/compaction rules.
- Keep recent raw companion notes on their existing two-day lifecycle.

### Phase 2: durable repair intelligence

- Build summary update/compaction after captures and repair outcomes.
- Add the repair summary to the repair-blueprint generation prompt.
- Enforce the 100-word target, 100–150 normal range, and 200-word maximum.
- Test that stale or repaired patterns do not dominate new repairs.

### Phase 3: custom phonics repairs

- Add generated phonics repair entries and a deterministic fallback.
- Route the generated mini-deck into Alphabet/Phonics.
- Persist/reload progress and emit support-level and transfer evidence.

### Phase 4: goal onboarding and settings

- Add the localized onboarding text box and examples.
- Persist the goal independently from `helpRequest`, Tutor persona, and conversation settings.
- Add settings controls to edit, pause, clear, replace, or mark the goal achieved.

### Phase 5: daily Goal task

- Add Goal to Daily Quest composition and persistence.
- Build daily blueprint generation and deterministic fallback.
- Add dedicated routing and completion for Tutor, Phonics, Flashcards, Lesson, and Conversation.
- Update the durable goal summary from observable results.

### Phase 6: quality and rollout

- Unit-test schema bounds, goal injection, no duplicate carry-over, mode routing, completion isolation, summary compaction, and fallbacks.
- Add browser coverage for setting a goal, seeing it every day, completing every mode, refreshing mid-task, and changing practice languages.
- Verify that goal edits never alter Custom Conversation settings.
- Verify that every CEFR level receives all five lesson modules while generated difficulty remains usable.
- Feature-flag the system and inspect whether daily Goal tasks feel purposeful, achievable, and progressively closer to the user's real-world outcome.

## Acceptance criteria

- An active per-language goal produces one Goal task in every Daily Quest.
- Goal tasks can use Tutor, Phonics, Flashcards, or Lesson (Conversations is excluded from goals/repairs and remains standalone for regular daily quests).
- Goal content may stretch beyond CEFR while support adapts to the learner.
- Repair lessons expose Vocabulary, Grammar, Reading, Stories, and Realtime at every CEFR level.
- Tutor, Flashcards, Lesson, and Phonics all provide fresh repair material, with deterministic fallbacks.
- The repair summary and goal summary are categorized, bounded, per-language, and no longer than 200 words each.
- Repair generation demonstrably uses prior repair outcomes without retaining an unbounded raw history.
- Goal generation moves from preparation toward independent performance and transfer instead of repeating the same task.
- Repair, Goal, normal curriculum, and Custom Conversation persistence remain isolated from one another.
